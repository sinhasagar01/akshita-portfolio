// P4 4(b)-i — the STRICT sanitizer for a `sections` patch.
//
// DELIBERATELY NOT THE ADAPTER, and this is the load-bearing distinction:
//   - lib/case-studies/adapter.ts is PERMISSIVE. It reads TRUSTED disk content,
//     so it coalesces "" and tolerates missing keys to build a render shape.
//   - this is STRICT. It reads an UNTRUSTED request body, so it REJECTS unknown
//     fields, unknown kinds, and wrong types rather than coalescing them.
// Reusing the adapter here would silently accept a malformed patch and coalesce
// it into the committed file. Same shape, opposite posture — on purpose.
//
// 4(b)-ii SCOPE: the section shell and the tier 1-2 kinds are validated FULLY by
// the per-kind VALIDATORS table below. The tier 3 kinds (structurally deep or
// image-bearing) still pass their `value` through opaquely, because the editor
// renders no form for them yet, so they round-trip verbatim. An unknown kind is
// always rejected, so the schema and the patch can never silently disagree.
//
// The 14 in-scope kinds are no longer a list here. Membership IS the VALIDATORS
// table's own keys, and the table is `{ [K in SectionBlockKind]: … }` — exhaustive
// against the Keystatic-derived union, so a kind cannot be missed. This replaces a
// hand-synced copy of the adapter's list that carried a comment asking the next
// reader to keep the two in step.
//
// Dependency-free beyond type-only imports, so it is unit-exercisable directly.
import type { SaveError } from "./site-settings-format";
import type { SectionBlockKind } from "../case-studies/sections-raw";

const VARIANTS = ["hero", "default", "static", "bare"] as const;
const LAYOUTS = ["stack", "split"] as const;

/** The section shell's own fields (everything except `blocks`). All strings. */
const SECTION_TEXT_KEYS = ["id", "index", "eyebrow", "title", "lead", "northStar"] as const;
const GLOW_KEYS = ["text", "top", "right", "bottom", "left", "size"] as const;

export type SanitizedBlock = { discriminant: string; value: Record<string, unknown> };
export type SanitizedSection = {
  variant: string;
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  lead: string;
  northStar: string;
  layout: string;
  glow: Record<string, string>;
  blocks: SanitizedBlock[];
};

type Fail = { ok: false; error: SaveError };
const invalid = (message: string, field?: string): Fail =>
  ({ ok: false, error: { code: "invalid_patch", field, message } });

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/* ------------------------------------------------- per-kind field validators */

type Ok<T> = { ok: true; value: T };
type Check<T> = (raw: unknown, at: string) => Ok<T> | Fail;

const str: Check<string> = (raw, at) =>
  typeof raw === "string" ? { ok: true, value: raw } : invalid(`${at} must be a string`, at);

const bool: Check<boolean> = (raw, at) =>
  typeof raw === "boolean" ? { ok: true, value: raw } : invalid(`${at} must be a boolean`, at);

const arrayOf =
  <T,>(item: Check<T>): Check<T[]> =>
  (raw, at) => {
    if (!Array.isArray(raw)) return invalid(`${at} must be an array`, at);
    const out: T[] = [];
    for (const [i, v] of raw.entries()) {
      const res = item(v, `${at}[${i}]`);
      if (!res.ok) return res;
      out.push(res.value);
    }
    return { ok: true, value: out };
  };

/**
 * An object with an exact field set. Every declared field is REQUIRED and every
 * undeclared one is rejected.
 *
 * Required-not-optional is deliberate and is the 4(b)-i lesson at the field layer:
 * Keystatic always writes every field, including `""` for untouched text and
 * `false` for an untouched checkbox, so a well-formed patch always carries them
 * all. Treating them as optional would let a form that "helpfully" strips empties
 * past the sanitizer and silently drop keys from the file — which is exactly the
 * byte-churn the surgical bar exists to catch. A missing key means the client
 * dropped it, and that is a bug, not a default to fill in.
 *
 * Rebuilds in DECLARED order so the dump is stable no matter what key order the
 * client sent.
 */
const obj =
  <S extends Record<string, Check<unknown>>>(shape: S): Check<Record<string, unknown>> =>
  (raw, at) => {
    if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);
    for (const k of Object.keys(raw)) {
      if (!Object.prototype.hasOwnProperty.call(shape, k)) {
        return invalid(`${at}: unknown field ${k}`, at);
      }
    }
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(shape)) {
      const res = shape[k](raw[k], `${at}.${k}`);
      if (!res.ok) return res;
      out[k] = res.value;
    }
    return { ok: true, value: out };
  };

/** A tier 3 kind the editor cannot edit yet: round-trip its value verbatim rather
 *  than validate a shape no form can produce. Replaced per kind in 4(b)-ii tier 3. */
const opaque: Check<Record<string, unknown>> = (raw, at) =>
  isPlainObject(raw) ? { ok: true, value: raw } : invalid(`${at} must be an object`, at);

/**
 * The per-kind table. Exhaustive by construction against the Keystatic-derived
 * union, so a 15th kind is a compile error here — no assertNever needed, because a
 * mapped type over the union IS the exhaustiveness check. Its keys are also the
 * runtime membership list, so there is no separate list to drift.
 */
const VALIDATORS: { [K in SectionBlockKind]: Check<Record<string, unknown>> } = {
  // tier 1 — flat strings
  closingLine: obj({ text: str }),
  pullQuote: obj({ text: str }),
  richText: obj({ paragraphs: arrayOf(str) }),
  glanceGrid: obj({ items: arrayOf(obj({ label: str, value: str })) }),
  issueList: obj({ items: arrayOf(obj({ title: str, note: str })) }),
  stepper: obj({ steps: arrayOf(obj({ label: str, text: str })) }),
  // tier 2 — + the union's only boolean
  statCards: obj({
    heading: str,
    stats: arrayOf(obj({ value: str, suffix: str, body: str, tag: str, highlighted: bool })),
  }),
  principleCards: obj({
    heading: str,
    subhead: str,
    cards: arrayOf(obj({ index: str, title: str, body: str })),
  }),
  // tier 3 — opaque until their forms land (PR B)
  heroCover: opaque,
  deviceShelf: opaque,
  featureRows: opaque,
  beforeAfter: opaque,
  swatchTokens: opaque,
  annotatedImage: opaque,
};

/** Validate one block against its kind's validator. An unknown kind is rejected. */
function sanitizeBlock(raw: unknown, at: string): { ok: true; value: SanitizedBlock } | Fail {
  if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);

  const discriminant = raw.discriminant;
  if (typeof discriminant !== "string") {
    return invalid(`${at}.discriminant must be a string`, at);
  }
  // hasOwnProperty, never `in`: the discriminant is untrusted, and `"constructor"
  // in VALIDATORS` is true on any plain object. `in` would let a prototype key
  // through as a known kind.
  if (!Object.prototype.hasOwnProperty.call(VALIDATORS, discriminant)) {
    return invalid(`${at}: unknown block kind "${discriminant}"`, at);
  }
  if (!isPlainObject(raw.value)) {
    return invalid(`${at}.value must be an object`, at);
  }
  for (const k of Object.keys(raw)) {
    if (k !== "discriminant" && k !== "value") {
      return invalid(`${at}: unknown block field ${k}`, at);
    }
  }

  const res = VALIDATORS[discriminant as SectionBlockKind](raw.value, `${at}.value`);
  if (!res.ok) return res;
  return { ok: true, value: { discriminant, value: res.value } };
}

/**
 * Validate an untrusted `sections` patch. The editor always sends the WHOLE
 * sections array (it reads all of it, edits one field, writes it back), so this
 * validates the whole array and returns it normalized.
 */
export function sanitizeSectionsPatch(
  raw: unknown
): { ok: true; sections: SanitizedSection[] } | Fail {
  if (!Array.isArray(raw)) return invalid("sections must be an array", "sections");

  const sections: SanitizedSection[] = [];
  for (const [i, item] of raw.entries()) {
    const at = `sections[${i}]`;
    if (!isPlainObject(item)) return invalid(`${at} must be an object`, at);

    for (const k of Object.keys(item)) {
      const known =
        k === "variant" ||
        k === "layout" ||
        k === "glow" ||
        k === "blocks" ||
        (SECTION_TEXT_KEYS as readonly string[]).includes(k);
      if (!known) return invalid(`${at}: unknown section field ${k}`, at);
    }

    if (typeof item.variant !== "string" || !(VARIANTS as readonly string[]).includes(item.variant)) {
      return invalid(`${at}.variant must be one of ${VARIANTS.join(", ")}`, at);
    }
    if (typeof item.layout !== "string" || !(LAYOUTS as readonly string[]).includes(item.layout)) {
      return invalid(`${at}.layout must be one of ${LAYOUTS.join(", ")}`, at);
    }
    for (const k of SECTION_TEXT_KEYS) {
      if (typeof item[k] !== "string") return invalid(`${at}.${k} must be a string`, at);
    }
    if (!isPlainObject(item.glow)) return invalid(`${at}.glow must be an object`, at);
    for (const k of Object.keys(item.glow)) {
      if (!(GLOW_KEYS as readonly string[]).includes(k)) {
        return invalid(`${at}.glow: unknown field ${k}`, at);
      }
    }
    const glow: Record<string, string> = {};
    for (const k of GLOW_KEYS) {
      const val = (item.glow as Record<string, unknown>)[k];
      if (typeof val !== "string") return invalid(`${at}.glow.${k} must be a string`, at);
      glow[k] = val;
    }

    if (!Array.isArray(item.blocks)) return invalid(`${at}.blocks must be an array`, at);
    const blocks: SanitizedBlock[] = [];
    for (const [j, b] of item.blocks.entries()) {
      const res = sanitizeBlock(b, `${at}.blocks[${j}]`);
      if (!res.ok) return res;
      blocks.push(res.value);
    }

    // Rebuilt in the schema's key order, so the dump is stable regardless of the
    // key order the client happened to send.
    sections.push({
      variant: item.variant,
      id: item.id as string,
      index: item.index as string,
      eyebrow: item.eyebrow as string,
      title: item.title as string,
      lead: item.lead as string,
      northStar: item.northStar as string,
      layout: item.layout,
      glow,
      blocks,
    });
  }
  return { ok: true, sections };
}
