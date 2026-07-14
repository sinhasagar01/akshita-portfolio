// P4 4(b)-i — the SECTIONS write seam. A NEW seam, and the mirror image of the
// head-splice next door (projects-serialize.ts).
//
// WHY THIS EXISTS. splitAtBody treats everything from `\nbody:` to EOF as an
// OPAQUE PRESERVED TAIL — that is exactly what made the 3(d) migration byte-safe,
// and exactly why it can never WRITE the sections that live in that tail. An
// editor needs the other half: rewrite sections, preserve everything else.
//
// WHY NOT JUST load -> dump THE WHOLE FILE. Because it corrupts the head: the
// projects' `summary` is a long UNFOLDED line on disk, and js-yaml's default dump
// folds it to `>-`. That is the same folded-scalar drift detectHeadOptions exists
// to dodge. Verified on all three migrated files before this was written.
//
// SO: split at `\nsections:`; keep everything before it (head + `body: []`)
// byte-for-byte verbatim, never re-dumped; re-dump ONLY `{ sections }`. Verified
// on all three real files: `preserved + dump({ sections }) === raw` exactly, and
// a single-field patch changes only that field's lines (the surgical property
// that makes editing one block safe on a 15-block project).
//
// Only js-yaml + type-only imports, so it is unit-exercisable directly
// (ralph/tests/p4-4bi-sections-serialize.mjs).
import { load, dump } from "js-yaml";
import type { SaveError } from "./site-settings-format";

export type SerializeResult = { ok: true; bytes: string } | { ok: false; error: SaveError };

/**
 * TRANSPORT-INDEPENDENCE (the 4b-i surgical-bar fix). js-yaml emits `&ref_0`/`*ref_0`
 * anchors whenever two keys hold the SAME OBJECT REFERENCE — a property of the input
 * object graph, not of its values. That makes the dump depend on how the sections got
 * here:
 *
 *   readSections(raw)                -> load() RESTORES the file's shared refs -> anchors
 *   the route's JSON.parse(body)     -> JSON has no ref sharing               -> no anchors
 *
 * So the same edit serialized identically-valued input two different ways, and every
 * unedited block's bytes churned on the first save through the real route. noRefs makes
 * the output a function of values alone, so both paths agree. It is a no-op for input
 * with no shared refs, which is why the on-disk files were normalized once to match
 * (their anchors were an artifact of the 3(d) authoring script sharing one NO_GLOW
 * object, never anything an editor or Keystatic produced).
 */
const DUMP_OPTIONS = { noRefs: true } as const;

/**
 * Split a project file at the top-level `sections:` key. `sections` is the LAST
 * top-level key in the schema, and every nested line is indented, so `\nsections:`
 * matches only the key itself (the same reasoning splitAtBody uses for `\nbody:`).
 */
function splitAtSections(raw: string): { preserved: string; sections: string } | null {
  const i = raw.indexOf("\nsections:");
  if (i === -1) return null;
  return { preserved: raw.slice(0, i + 1), sections: raw.slice(i + 1) };
}

/** Read a project file's current `sections` value. Returns [] when the file has
 *  no sections key (an unmigrated project), so callers can distinguish. */
export function readSections(raw: string): unknown[] {
  const doc = (load(raw) ?? {}) as { sections?: unknown };
  return Array.isArray(doc.sections) ? doc.sections : [];
}

/**
 * Write a new `sections` value into a project file, preserving the head and
 * `body: []` byte-for-byte. The caller supplies the FULL sections array (the
 * editor reads all of it, edits one field, and writes it back), so unedited
 * blocks are re-dumped from the exact values they were read as — never retyped.
 *
 * Refuses (unsupported_format) on a file with no `sections:` key rather than
 * appending one, mirroring serializeProjectEntry's refuse-rather-than-reformat
 * posture: a project that has not been migrated is not this seam's to rewrite.
 */
export function serializeProjectSections(raw: string, sections: unknown[]): SerializeResult {
  const split = splitAtSections(raw);
  if (!split) {
    return {
      ok: false,
      error: {
        code: "unsupported_format",
        message: "this project has no sections to edit; it has not been migrated",
      },
    };
  }
  return { ok: true, bytes: split.preserved + dump({ sections }, DUMP_OPTIONS) };
}
