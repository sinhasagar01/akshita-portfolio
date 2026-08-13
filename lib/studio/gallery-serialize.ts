// The gallery write seam — read-modify-write for one item file.
//
// ---- ⚠ NO SPLICE, BECAUSE THERE IS NO TAIL TO PRESERVE ---------------------------------------
//
// `projects-serialize` and `blog-serialize` both split the file at a body key (`sections:`,
// `blocks:`) and re-emit the head, so a hand-authored literal `|` scalar in the tail survives
// untouched. Their shared comment says the splice is duplicated twice deliberately and to
// "extract on the third".
//
// THIS IS NOT THE THIRD. A gallery entry is FLAT — title, kind, image, width, height, alt,
// description, tags, caseStudy, orderIndex, and nothing else — so there is no tail, no splice, and
// no third copy of the eight lines of indexOf and slice. What it does share is the part that can
// genuinely drift: the declared-order rebuild, which is why the key list lives beside the
// sanitizer's field arms rather than being inferred from whatever the client happened to send.
//
// ---- ⚠ THE REBUILD IS IN DECLARED ORDER, WHICH IS WHAT MAKES A NO-OP SAVE A NO-OP DIFF --------
//
// A client can send keys in any order. Rebuilding from a fixed list means the dump is stable, an
// optional key that was absent lands in its schema position rather than at the end, and saving a
// file without changing anything produces zero lines of diff. That last property is what lets a
// reviewer read a gallery commit and see only what moved.
import { load, dump } from "js-yaml";
import type { DumpOptions } from "js-yaml";
import type { GalleryInput } from "./gallery-format";
import type { SaveError } from "./site-settings-format";

/* ⚠ THE THIRD `detectHeadOptions` — AND THE EXTRACTION IT WAS SUPPOSED TO TRIGGER BUYS NOTHING.
 *
 * `blog-serialize`'s header says the splice is duplicated twice deliberately and to "extract on the
 * third". This is the third consumer, so the rule was applied — and reading both copies refutes it:
 * the five-line loop is identical, and the DATA it loops over is not.
 *
 *     blog       [{ noRefs: true }]
 *     projects   [{}, { lineWidth: -1, quotingType: '"' }]
 *
 * Those differ because the two collections' files were generated differently, and that is not
 * drift — it is per-collection truth. Extracting would hoist a loop that cannot meaningfully drift
 * and push its only variable part back down as a parameter, while editing two proven files whose
 * own comment says leaving them untouched was worth more than deleting the duplication.
 *
 * SO THE RULE FIRED AND THE ANSWER WAS NO. Recorded here rather than silently duplicating, because
 * the next person to count copies will reach the same trigger and deserves the measurement.
 */
const HEAD_DUMP_CANDIDATES: DumpOptions[] = [{ noRefs: true }, {}];

/** Round-trip the file to find the options that reproduce it. Null when none does — the caller
 *  then REFUSES rather than reformatting content nobody asked it to touch. */
function detectHeadOptions(head: string): DumpOptions | null {
  const loaded = load(head) ?? {};
  for (const opts of HEAD_DUMP_CANDIDATES) {
    if (dump(loaded, opts) === head) return opts;
  }
  return null;
}

/* The SHARED error type, not a structural lookalike. `commitCollectionEntry`'s transform is typed
   against `SaveError`, whose `code` is a union — a local `{ code: string }` is assignable to
   nothing and would have been caught here rather than at the call site only by luck. */
type SerializeResult = { ok: true; bytes: string } | { ok: false; error: SaveError };

/**
 * The schema's key order, mirrored.
 *
 * ⚠ A LIST RATHER THAN `Object.keys(patch)`, and the difference is the whole function. Taking the
 * client's key order would make the file's shape depend on what a form happened to send, so two
 * saves of the same values could produce different bytes and every diff would be noise.
 */
const GALLERY_KEYS = [
  "title",
  "kind",
  "image",
  "width",
  "height",
  "alt",
  "description",
  "tags",
  "caseStudy",
  "orderIndex",
] as const;

export function serializeGalleryEntry(raw: string, patch: Partial<GalleryInput>): SerializeResult {
  const opts = detectHeadOptions(raw);
  if (!opts) {
    return {
      ok: false,
      error: { code: "unsupported_format", message: "this gallery file is not in the expected format" },
    };
  }
  const current = (load(raw) ?? {}) as Record<string, unknown>;
  const patched = patch as Record<string, unknown>;

  const out: Record<string, unknown> = {};
  for (const key of GALLERY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(patched, key)) {
      out[key] = patched[key];
    } else if (Object.prototype.hasOwnProperty.call(current, key)) {
      /* hasOwnProperty, not truthiness: `image: null` is a VALUE — Keystatic writes an absent
         image as null and the editor clears one to null — and a `width: 0` from a failed upload
         must survive to be seen by the publish gate rather than vanishing into an absent key. */
      out[key] = current[key];
    }
  }

  return { ok: true, bytes: dump(out, opts) };
}
