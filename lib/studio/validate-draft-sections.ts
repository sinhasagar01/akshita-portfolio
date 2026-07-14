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
import type { SaveError } from "./site-settings-format";

export type SectionsValidation = { ok: true } | { ok: false; error: SaveError };

/**
 * Validate ONE project's raw yaml the way the public build will render it.
 * `slug` only labels the error; the check is `adaptSections` in ssg mode.
 */
export function validateProjectSections(slug: string, raw: string): SectionsValidation {
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
