// P4 4(b)-iv — validate a draft's case-study sections BEFORE publishing.
//
// WHY THIS EXISTS. Until now, add was GATED wherever a new row or block would carry
// a required-but-unset image: PR B hid "add" on the three image-bearing nested
// arrays, and 4(b)-iii withheld heroCover and annotatedImage from the block picker.
// Those gates existed because the FAIL-LOUD ssg adapter refuses a missing image, so
// such a block could be added, previewed happily (preview substitutes a
// placeholder), published — and then fail the Vercel build, blocking every unrelated
// edit in the draft too.
//
// 4(b)-iv un-gates them, because upload now exists. But upload does not remove the
// hazard, it only gives the owner a way OUT: a new block is still born `src: null`,
// and publishing in the window between adding and uploading would still wedge the
// build. So the gate MOVES — from the picker (which could only guess) to publish
// (which can actually check).
//
// This cannot be a sanitizer rule: a null src is structurally valid, and
// publishability is the ADAPTER's question, not the schema's. So the check is the
// adapter itself, in its pinned ssg mode, and the message the owner sees is the
// adapter's own ("image src is missing — upload an image or remove the block").
//
// The shape mirrors GH-4's existing validate-at-publish for site-settings: an
// invalid draft returns a typed error, main is untouched, and the draft is left in
// place so it can be fixed.
import { load } from "js-yaml";
import { adaptSections } from "@/lib/case-studies/adapter";
/* ⚠ THE PROJECTS VALIDATOR IMPORTS THE BLOG ONE, AND THE DIRECTION IS FORCED RATHER THAN CHOSEN.
   The obvious move on a second consumer is to extract the placeholder vocabulary to its own leaf,
   which is this repo's stated threshold for extraction. IT WAS TRIED AND REVERTED: a relative VALUE
   import would cost `validate-blog-post.ts` the property its own header names — dependency-free
   beyond js-yaml and type-only imports, which is what lets a ralph suite import and EXECUTE it.
   THE COMMENT FORBIDDING IT WAS ALREADY THERE and the suite failed within a minute of ignoring it.

   This file already imports the adapter as a value, so it is source-inspected rather than executed
   and has no such property to lose. The dependency therefore runs from the file that can afford it
   to the file that cannot, and one definition still serves both collections. */
import { hasPlaceholder } from "./validate-blog-post";
import type { SaveError } from "./site-settings-format";

export type SectionsValidation = { ok: true } | { ok: false; error: SaveError };

/**
 * Validate ONE project's raw yaml the way the public build will render it.
 * `slug` only labels the error; the check is `adaptSections` in ssg mode.
 */
export function validateProjectSections(slug: string, raw: string): SectionsValidation {
  /* ⚠ BEFORE THE SECTIONS GUARD, AND ON THE RAW DOCUMENT, FOR TWO SEPARATE REASONS.
     A placeholder can sit in `summary` or in `facts` as easily as in a section, so walking blocks
     would miss it — the same reason the blog rule reads raw. And the guard below exempts any
     project with no `sections` array, so a check placed after it would be skipped entirely for
     exactly the documents nobody is looking at.

     ⚠ AND A CASE STUDY HAS NO DRAFT STATE, WHICH MAKES THIS STRICTER THAN THE BLOG'S RULE RATHER
     THAN THE SAME. The projects collection declares no `status` field, so every case study is
     public the moment it is on main — there is no permissive-at-save half to preserve here,
     because there is nothing to be permissive about. The draft BRANCH is still the permissive
     side: this runs at publish, and a marker sitting on the draft branch is correct until then. */
  if (hasPlaceholder(raw)) {
    return {
      ok: false,
      error: {
        code: "invalid_sections",
        field: slug,
        message: `${slug}: a draft marker is still in the body — every placeholder must be replaced before publishing`,
      },
    };
  }

  const doc = (load(raw) ?? {}) as { sections?: unknown };
  // A project with no sections is not this seam's to judge (boat-crest is bespoke).
  if (!Array.isArray(doc.sections)) return { ok: true };
  try {
    // No mode argument would also be ssg — it is the pinned default — but it is
    // passed explicitly here so the intent survives a future default change.
    adaptSections(doc.sections, { mode: "ssg" });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "invalid_sections",
        field: slug,
        message: `${slug}: ${e instanceof Error ? e.message : String(e)}`,
      },
    };
  }
}
