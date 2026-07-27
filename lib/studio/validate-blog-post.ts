// Blog PR 3b — validate a draft's blog post BEFORE publishing. The sibling of
// validate-draft-sections.ts, and deliberately a DIFFERENT KIND OF CHECK from the
// sanitizer next door.
//
//   blog-format.ts asks "is this well-formed INPUT" — it guards the write boundary
//   against an untrusted request body.
//   this asks "will this RENDER" — it guards the published site against content that
//   reached disk some other way.
//
// WHAT ACTUALLY BREAKS A BLOG BUILD — measured, not assumed. The pre-PR analysis guessed
// that BlogProse would throw a TypeError on a malformed block. It does not, because it
// never sees one: EVERY path to it goes through a Keystatic reader (createReader on the
// public path, createGitHubReader on the draft path), and the reader VALIDATES against
// the schema and COERCES what it accepts. Probed against seven malformed shapes:
//
//   REJECTED by the reader (it throws) — richText whose paragraphs is not an array;
//     a heading whose text is a number; an unknown discriminant; a videoEmbed whose src
//     is not a string.
//   COERCED by the reader (they never reach the renderer as written) — a null block
//     entry; a richText with no paragraphs key; a heading with a null value.
//
// So the real hazard is the FIRST group, and it is worse than a render bug: the reader
// throws inside `reader.collections.blog.all()`, which the blog index and
// generateStaticParams both call, so the failure is a BUILD failure for the WHOLE SITE —
// not a broken /blog. Merge one malformed post to main and every subsequent build fails
// until someone reverts it.
//
// THAT is this gate's job: refuse the publish instead. Same purpose as the projects gate,
// reached by a different mechanism — projects fails loud in its ADAPTER, blog fails loud
// in its READER. The claim to avoid is that this replicates the projects gate's coverage
// of half-authored content: it does not, because an empty-src videoEmbed or a missing
// image is legal for a post and renders as nothing.
//
// This is deliberately STRICTER than the reader (it refuses the coerced group too). Those
// shapes cannot come from the studio — the sanitizer rejects them on the way in — so
// refusing to publish a hand-committed file that carries them costs nothing real.
//
// Dependency-free beyond js-yaml + a type-only import, so it is unit-exercisable directly.
import { load } from "js-yaml";
import type { SaveError } from "./site-settings-format";

export type BlogValidation = { ok: true } | { ok: false; error: SaveError };

/**
 * Which changed files in a publish compare are blog posts. Lives HERE, beside the
 * validator that consumes it, so a ralph suite can assert it directly — publish-site-
 * settings.ts pulls in the GitHub layer and cannot be imported by a pure test. The
 * bare-slug shape matches the rest of the studio's path guards, and the `$` anchor keeps
 * a nested path (content/blog/<slug>/anything.yaml) out.
 *
 * The projects equivalent stays inline in the publish loop — untouched by this PR.
 */
export const BLOG_POST_PATH_RE = /^content\/blog\/([a-z0-9-]+)\.yaml$/;

/** The kinds BlogProse can render. Spelled here rather than imported from the sanitizer's
 *  table on purpose: this asks what the RENDERER handles, and the renderer's own table is
 *  the authority. If the two ever disagree, that disagreement is a real bug and this
 *  should surface it rather than inherit it.
 *
 *  DELIBERATELY NOT DERIVED from BlogProse's RENDERERS, even though that is now a mapped
 *  type and could be. Deriving it would launder exactly the disagreement this exists to
 *  catch. EXPORTED so ralph can assert BLOG_PICKER_ORDER is a subset of it — a kind an
 *  author can pick but the renderer will not draw is the silent failure that let
 *  videoEmbed.poster sit authorable and invisible for three PRs. */
export const RENDERABLE = new Set(["heading", "richText", "pullQuote", "imageBlock", "videoEmbed"]);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Validate ONE post's raw yaml the way the public build will render it. `slug` only
 * labels the error.
 *
 * DRAFTS ARE NOT JUDGED HERE, and that is a decision with evidence behind it. A draft's
 * blocks are never rendered (generateStaticParams reads the status-filtered list,
 * dynamicParams is false, and the route component gates on status), and since PR 3b the
 * index read filters BEFORE mapping, so nothing touches a draft's blocks at build time at
 * all. Meanwhile a status flip is itself a change to the file, so the post is validated
 * at the publish that makes it live — there is no window. Judging drafts would only mean
 * one half-written post blocking the publish of everything else in the draft branch,
 * which on a daily-cadence collection is real recurring friction for no safety.
 */
export function validateBlogPost(slug: string, raw: string): BlogValidation {
  const doc = (load(raw) ?? {}) as { status?: unknown; title?: unknown; blocks?: unknown };

  // Not published -> not this seam's to judge (see above).
  if (doc.status !== "published") return { ok: true };

  const fail = (message: string): BlogValidation => ({
    ok: false,
    error: { code: "invalid_blocks", field: slug, message: `${slug}: ${message}` },
  });

  // ---- THE TITLE GATE, THE SAME SHAPE AS alt BELOW -------------------------------------
  //
  // #216 made `title` editable, and the read path falls back to the SLUG when it is blank
  // (select.ts:55) — so a blanked title never crashes, it publishes a post HEADED BY ITS OWN
  // SLUG (`what-a-data-table-teaches-you-about-trust` as an <h1>). That is the same class of
  // defect as an unlabelled image: renderable, live, and wrong. Permissive at save (an author
  // may clear it mid-edit), strict at publish — this is the one gate they cannot walk past.
  // In the file `title` is a plain scalar (fields.slug stores the name half unwrapped), so a
  // raw load reads a string; `.trim()` guards whitespace-only.
  const title = typeof doc.title === "string" ? doc.title.trim() : "";
  if (title === "") {
    return fail(
      "title must not be empty on a published post — it falls back to the slug, which is not a title"
    );
  }

  // A post with no blocks array renders an empty prose column — legal, not a failure.
  if (doc.blocks === undefined || doc.blocks === null) return { ok: true };
  if (!Array.isArray(doc.blocks)) return fail("blocks must be an array");

  for (const [i, block] of doc.blocks.entries()) {
    const at = `blocks[${i}]`;
    // BlogProse reads block.discriminant unconditionally, so a null entry is a TypeError.
    if (!isPlainObject(block)) return fail(`${at} must be an object`);
    const { discriminant, value } = block;
    if (typeof discriminant !== "string") return fail(`${at}.discriminant must be a string`);
    if (!RENDERABLE.has(discriminant)) return fail(`${at}: unknown block kind "${discriminant}"`);
    // Every branch of the renderer's switch dereferences value.
    if (!isPlainObject(value)) return fail(`${at}.value must be an object`);

    switch (discriminant) {
      case "heading":
      case "pullQuote":
        if (typeof value.text !== "string") return fail(`${at}.value.text must be a string`);
        break;
      case "richText":
        // BlogProse calls .map on this directly.
        if (!Array.isArray(value.paragraphs)) {
          return fail(`${at}.value.paragraphs must be an array`);
        }
        for (const [j, p] of value.paragraphs.entries()) {
          if (typeof p !== "string") return fail(`${at}.value.paragraphs[${j}] must be a string`);
        }
        break;
      case "videoEmbed":
        // BlogProse calls src.trim() before deciding whether to render at all.
        if (typeof value.src !== "string") return fail(`${at}.value.src must be a string`);
        if (value.caption !== undefined && typeof value.caption !== "string") {
          return fail(`${at}.value.caption must be a string`);
        }
        break;
      case "imageBlock": {
        // src is `string | null` — null is an unset image, which BlogProse skips.
        if (value.src !== null && typeof value.src !== "string") {
          return fail(`${at}.value.src must be a string or null`);
        }
        if (value.caption !== undefined && typeof value.caption !== "string") {
          return fail(`${at}.value.caption must be a string`);
        }
        // ---- THE ALT GATE, AND THIS IS WHERE "REQUIRED" BECOMES TRUE ------------------
        //
        // The schema types `alt` as a plain text field and the sanitizer accepts "", both
        // deliberately: a block is born with src: null and alt: "", so refusing an empty
        // alt at SAVE would make the kind impossible to add at all. That is videoSrc's
        // reasoning applied to a second field — permissive about half-authored drafts,
        // strict about what may go live.
        //
        // This file judges PUBLISHED posts only, so it is the one gate an author cannot
        // walk past, and therefore the only place a required field can actually be
        // required. A required field the author can leave empty is not required.
        //
        // `decorative` is the deliberate exemption. Without it an author facing this gate
        // types "image" into alt to clear it, which is worse than empty: empty is a known
        // absence a screen reader can skip, while "image" is confidently wrong.
        if (typeof value.src === "string" && value.src !== "") {
          const decorative = value.decorative === true;
          const alt = typeof value.alt === "string" ? value.alt.trim() : "";
          if (!decorative && alt === "") {
            return fail(
              `${at}.value.alt must not be empty on a published post — describe the image, or tick "Decorative"`
            );
          }
        }
        break;
      }
    }
  }

  return { ok: true };
}
