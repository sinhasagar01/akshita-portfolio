// GH-4 — publish = merge the draft branch into main (the FIRST write to main).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first.
// Validation runs at publish (the gate the draft model deferred): an invalid
// draft can never reach main. The merge uses the conflict-safe REST merges API,
// so a draft that conflicts with a moved main returns a typed merge_conflict
// and main is never force-pushed or corrupted. Reuses the proven transform,
// commit, and read modules unchanged.
import { load } from "js-yaml";
import {
  transformSiteSettings,
  type SaveErrorCode,
  type SiteSettingsRecord,
} from "./site-settings-format";
import {
  branchExists,
  deleteBranchRef,
  getBaseBranchHeadOid,
  mergeBranch,
  compareBranches,
} from "./github-commit";
import { getFileTextAtRef, SETTINGS_PATH } from "./commit-site-settings";
import { validateProjectSections } from "./validate-draft-sections";
import { validateBlogPost, hasPlaceholder } from "./validate-blog-post";
import { COLLECTION_FILE_RE } from "./publish-preview";
import { isCollectionName, type CollectionName } from "./commit-collection-entry";
import { validateGalleryEntry } from "./gallery-format";
import type { SaveError } from "./site-settings-format";
import { BLOG_TOPICS } from "./blog-format-core";
import { DRAFT_BRANCH } from "./draft-site-settings";

export type PublishResult =
  | { ok: true; merged: true; sha: string; deployPending: true }
  | { ok: true; merged: false; reason: "no_draft" | "not_applicable" | "no_changes" }
  | {
      ok: false;
      error: {
        // The transform's SaveErrorCode plus the merge-specific codes, so a
        // validation error can flow through publish unchanged.
        code: SaveErrorCode | "merge_conflict" | "merge_failed";
        field?: string;
        message: string;
      };
    };

function githubMode(): boolean {
  return process.env.STUDIO_WRITE_MODE === "github";
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Promote the draft branch to main. Returns merged:true with the merge commit
 * SHA and deployPending:true (the live site updates only after the Vercel
 * rebuild, ~1-5 min — GH-5's UI uses deployPending for a "Publishing…" state).
 */
/* ============================================================================================
   ⚠ WHAT EACH COLLECTION MUST SATISFY BEFORE IT REACHES MAIN — EXHAUSTIVE OVER `CollectionName`.

   THE DEFECT THIS REPLACES WAS THE CATCH-ALL, NOT A MISSING ARM. The loop below used to run two
   `if`s — projects, then blog — and then a branch matching "any other content yaml", which applied
   a placeholder scan and accepted the file. **Gallery did not slip through a gap. It landed in the
   branch designed to accept anything unrecognised**, and four project-shaped entries reached main
   and took the production build down site-wide, because the Keystatic reader validates on read and
   THROWS.

   ⚠ SO A THIRD `if` WOULD HAVE REPAIRED ONE INSTANCE OF A SHAPE THAT REPEATS. A `Record` makes the
   fifth collection a COMPILE ERROR here rather than a production one — this arc's own lesson,
   applied to the loop that broke the build. It is the same repair the four commit-layer dispatches
   took, one layer out: those chose how to WRITE a file, this chooses whether it may SHIP.
============================================================================================ */
type PublishCheck = (slug: string, raw: string) => { ok: true } | { ok: false; error: SaveError };

const COLLECTION_PUBLISH_CHECKS: Record<CollectionName, PublishCheck> = {
  /* Runs the fail-loud ssg adapter — the strictest of the four, because a case study renders
     through a renderer that throws on a shape it does not expect. */
  projects: (slug, raw) => {
    const sections = validateProjectSections(slug, raw);
    return sections.ok ? { ok: true } : { ok: false, error: sections.error };
  },
  /* A NARROWER REMIT, deliberately: BlogProse is adapter-free and defensive, so this only catches
     content the renderer would THROW on. It also skips drafts outright — see its header for why
     judging them would let one half-written post block the publish of everything else. */
  blog: (slug, raw) => {
    const blocks = validateBlogPost(slug, raw, BLOG_TOPICS);
    return blocks.ok ? { ok: true } : { ok: false, error: blocks.error };
  },
  /* ⚠ `galleryPublishBlockers` WIRED, AND IT WAS WRITTEN BEFORE THE INCIDENT AND CALLED BY NOTHING.
     It already refuses an empty alt, a missing image and a zero dimension — precisely what shipped.
     A gate that exists and is never called is the worst version of this shape, because its presence
     reads as coverage: a comment in `app/(portfolio)/gallery/page.tsx` called it "the only thing
     between an unlabelled image and a reader", which was false for as long as nothing called it.
     That comment is corrected in this same commit, because the code and the claim move together.

     ⚠ AND `waves.yaml` WILL BE REFUSED BY THIS, WHICH IS CORRECT AND IS NOT SOFTENED. It carries
     `image: null, width: 0, height: 0` — an entry whose upload never completed. The masonry cannot
     place a tile without intrinsic dimensions, so publishing it would ship a layout shift. The
     author's remedy is to upload the image; the gate's job is to say so, not to admit it.

     THE PARSE IS PART OF THE CHECK. A file that does not parse as this collection's schema is
     exactly what took the build down, so a throw here becomes a refusal with the file named rather
     than an exception that fails the publish with a stack trace. */
  gallery: (slug, raw) => validateGalleryEntry(slug, raw),
  /* ⚠ EXPERIENCE HAS NO PER-ENTRY CHECK AND THAT IS AN ANSWER RATHER THAN AN OMISSION. Five short
     structured scalars, no prose field at all — its one prose field was deliberately deleted — and
     no renderer that can throw on a shape. The placeholder rule below still covers it, because the
     derived branch walks every other content yaml. A `Record` forces this to be SAID; the old
     catch-all let it be assumed. */
  experience: () => ({ ok: true }),
};

/** `content/<collection>/<slug>.yaml` -> which collection, which slug. Null for anything else,
 *  which then falls to the placeholder branch. Derived from `COLLECTION_ENTRY_PATH_RE` so the
 *  publish loop and the commit layer cannot disagree about what a collection file looks like. */
function matchCollectionFile(filename: string): { collection: CollectionName; slug: string } | null {
  const m = COLLECTION_FILE_RE.exec(filename);
  if (!m) return null;
  if (!isCollectionName(m[1])) return null;
  return { collection: m[1], slug: m[2] };
}

export async function publishSiteSettings(): Promise<PublishResult> {
  if (!githubMode() || !process.env.STUDIO_GITHUB_TOKEN) {
    return { ok: true, merged: false, reason: "not_applicable" };
  }

  // 1. A draft must exist.
  let base: { branch: string; oid: string };
  try {
    if (!(await branchExists(DRAFT_BRANCH))) {
      return { ok: true, merged: false, reason: "no_draft" };
    }
    base = await getBaseBranchHeadOid();
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: messageOf(e) } };
  }

  // 2. Validate at publish — the deferred gate. An invalid draft never merges.
  let raw: string;
  try {
    raw = await getFileTextAtRef(SETTINGS_PATH, DRAFT_BRANCH);
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: messageOf(e) } };
  }
  const loaded = (load(raw) ?? {}) as SiteSettingsRecord;
  const validation = transformSiteSettings(loaded, {});
  if (!validation.ok) {
    // main untouched, draft left in place so it can be fixed.
    return { ok: false, error: validation.error };
  }

  // 2b. P4 4(b)-iv — the same gate, for case-study sections.
  //
  // Every CHANGED project is re-rendered the way the public build will render it
  // (adaptSections in its pinned fail-loud ssg mode). This is what makes 4(b)-iv's
  // un-gating safe: a block can now be added before its image is uploaded, so the
  // check moves from the picker — which could only guess — to publish, which can
  // actually look. An unpublishable draft is refused HERE, with the adapter's own
  // message, instead of silently failing the Vercel build and blocking every
  // unrelated edit in the draft.
  //
  // Only changed projects are read: main is already known-good (it built), so an
  // untouched project cannot have become invalid, and a full scan would cost a read
  // per project on every publish.
  try {
    const cmp = await compareBranches(base.branch, DRAFT_BRANCH);
    // FAILS CLOSED. If the compare is unavailable we cannot know whether the draft
    // renders, and publishing on an unknown is how the wedge this gate exists to
    // prevent gets through. The cost of refusing is a retry; the cost of allowing is
    // a broken build blocking every edit.
    if (!cmp) {
      return {
        ok: false,
        error: { code: "read_failed", message: "could not compare the draft against main" },
      };
    }
    // A truncated file list would leave a changed project UNVALIDATED, which is
    // precisely the wedge this gate exists to catch — so it refuses rather than
    // validating a subset and calling it a pass. F-1's getTreeRecursive takes the
    // same stance for the same reason.
    if (cmp.truncated) {
      return {
        ok: false,
        error: {
          code: "read_failed",
          message: "too many changed files to validate the draft; publish in smaller batches",
        },
      };
    }
    for (const file of cmp.files) {
      if (file.status === "removed") continue;

      /* ⚠ EVERY COLLECTION IS ASKED BY NAME, AND THE CATCH-ALL NO LONGER DECIDES ANYTHING.
         `COLLECTION_PUBLISH_CHECKS` is a `Record<CollectionName, …>`, so a fifth collection is a
         COMPILE ERROR here rather than a production one. */
      const entry = matchCollectionFile(file.filename);
      if (entry) {
        const raw = await getFileTextAtRef(file.filename, DRAFT_BRANCH);
        const check = COLLECTION_PUBLISH_CHECKS[entry.collection];
        const result = check(entry.slug, raw);
        if (!result.ok) return { ok: false, error: result.error };
        continue;
      }

      /* THE PLACEHOLDER RULE FOR EVERYTHING ELSE UNDER `content/` — `site-settings.yaml`, the five
         experience entries and `skills.yaml`. Seven files of fifteen had NO check at all until this
         branch existed, and `site-settings.yaml` carries the longest prose on the site outside the
         two collections above.

         ⚠ AND IT IS NO LONGER THE BRANCH A COLLECTION CAN FALL INTO, WHICH IS THE WHOLE CHANGE. It
         used to run after two `if`s, so anything they did not recognise landed here and was accepted
         with a placeholder scan — gallery did not slip through a gap, it landed in the branch
         designed to accept the unrecognised. Collections are now matched exhaustively above; what
         reaches here is the singletons and the collections that carry no per-entry renderer.

         There is no renderer to re-run for these: they are read as plain data, so the adapter and
         BlogProse checks have no equivalent. */
      if (/^content\/.+\.yaml$/.test(file.filename)) {
        // Named apart from the outer `raw`, which holds site-settings at line 72 — a shadow here
        // would read as the same document to anyone skimming.
        const otherRaw = await getFileTextAtRef(file.filename, DRAFT_BRANCH);
        if (hasPlaceholder(otherRaw)) {
          return {
            ok: false,
            error: {
              code: "invalid_sections",
              field: file.filename,
              message: `${file.filename}: a draft marker is still in the body — every placeholder must be replaced before publishing`,
            },
          };
        }
      }
    }
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: messageOf(e) } };
  }

  // 3. Merge draft -> main (conflict-safe; never forces main).
  let merge: Awaited<ReturnType<typeof mergeBranch>>;
  try {
    merge = await mergeBranch({
      base: base.branch,
      head: DRAFT_BRANCH,
      message: "studio: publish site settings",
    });
  } catch (e) {
    return { ok: false, error: { code: "merge_failed", message: messageOf(e) } };
  }
  if (merge.status === "conflict") {
    return {
      ok: false,
      error: { code: "merge_conflict", message: "draft conflicts with main; rebase the draft" },
    };
  }
  if (merge.status === "noop") {
    return { ok: true, merged: false, reason: "no_changes" };
  }

  // 4. Promote-then-clear: delete the draft branch (non-fatal — merge landed).
  try {
    await deleteBranchRef(DRAFT_BRANCH);
  } catch {
    /* merge already landed; a leftover draft is harmless and self-heals */
  }

  // 5. Merge landed; the live site updates after the Vercel rebuild.
  return { ok: true, merged: true, sha: merge.oid, deployPending: true };
}
