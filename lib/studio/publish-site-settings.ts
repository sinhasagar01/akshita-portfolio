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
      const m = /^content\/projects\/([a-z0-9-]+)\.yaml$/.exec(file.filename);
      if (!m || file.status === "removed") continue;
      const projectRaw = await getFileTextAtRef(file.filename, DRAFT_BRANCH);
      const sections = validateProjectSections(m[1], projectRaw);
      if (!sections.ok) {
        // main untouched, draft left in place so it can be fixed.
        return { ok: false, error: sections.error };
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
