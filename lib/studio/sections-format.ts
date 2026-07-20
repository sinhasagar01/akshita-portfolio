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

/** The section shell's closed sets. EXPORTED so the shell form's selects read the
 *  same source this validates against — the form cannot offer an option the
 *  sanitizer would reject. */
export const VARIANTS = ["hero", "default", "static", "bare"] as const;
export const LAYOUTS = ["stack", "split"] as const;
export type SectionVariant = (typeof VARIANTS)[number];
export type SectionLayout = (typeof LAYOUTS)[number];

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

/**
 * `number | null` — the tier-3 null gate, and the counterpart to the empties rule.
 *
 * NULL IS A VALUE HERE, not an absence: the file carries `rotate: -6` on one device
 * and `rotate: null` on its sibling (106 nulls across the three case studies). So
 * this accepts a finite number or an explicit null, and REJECTS "" — which is what
 * catches a form that renders null as an empty string and saves the string back,
 * silently changing content the owner never touched. NaN and Infinity are rejected
 * too: js-yaml would dump them as `.nan`/`.inf`, which the schema cannot hold.
 */
const numOrNull: Check<number | null> = (raw, at) => {
  if (raw === null) return { ok: true, value: null };
  if (typeof raw !== "number") return invalid(`${at} must be a number or null`, at);
  if (!Number.isFinite(raw)) return invalid(`${at} must be a finite number`, at);
  return { ok: true, value: raw };
};

/**
 * An image `src`: a path, or null for "no image set".
 *
 * "" IS REJECTED, and that is the point. The schema types this `string | null`,
 * which means null is how Keystatic represents an unset image — and no `src: ''`
 * exists in any real file (all 16 are real paths). So an empty string can only
 * come from a form that coerced a null, which is precisely the hazard this gate
 * exists to catch. Same posture as numOrNull.
 */
const imageSrc: Check<string | null> = (raw, at) => {
  if (raw === null) return { ok: true, value: null };
  if (typeof raw !== "string") return invalid(`${at} must be a string or null`, at);
  if (raw === "") return invalid(`${at} must be a path or null, never ""`, at);
  return { ok: true, value: raw };
};

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


/**
 * An array whose length the schema FIXES. heroCover.devices is
 * `validation: { length: { min: 2, max: 2 } }`, and the adapter re-validates it
 * defensively when narrowing to its [DeviceSpec, DeviceSpec] tuple — so a save
 * carrying three devices would pass Keystatic's reader on write and then throw at
 * SSG, breaking the public build. Enforced here, where it fails loudly on the way
 * in instead.
 */
const arrayOfLen = <T,>(n: number, item: Check<T>): Check<T[]> => {
  const inner = arrayOf(item);
  return (raw, at) => {
    const res = inner(raw, at);
    if (!res.ok) return res;
    if (res.value.length !== n) return invalid(`${at} must have exactly ${n} items`, at);
    return res;
  };
};

/* --------------------------------------------- shared tier-3 field shapes
 * Declared in SCHEMA ORDER, which is load-bearing: `obj` rebuilds in declared
 * order, so a shape declared out of order would re-key every block it touches and
 * churn the file. Disk is the reference (src, alt, width, rotate, translateX,
 * translateY, z, then label, dotColor).                                          */

const IMG_SPEC = {
  src: imageSrc,
  alt: str,
  width: numOrNull,
  rotate: numOrNull,
  translateX: numOrNull,
  translateY: numOrNull,
  z: numOrNull,
} as const;

/** CS-4 — the image frame enum. Duplicated from the adapter's FRAMES exactly as
 *  VARIANTS/LAYOUTS are, so this strict gate stays independent of the permissive
 *  adapter. The template->frame MAPPING is NOT here (that is the adapter's single
 *  source); this only validates the value. */
export const FRAMES = ["phone", "browser", "macbook"] as const;

/**
 * An image-bearing object. The seven geometry keys are REQUIRED (the empties-
 * preserved rule), but `frame` is the one OMIT-WHEN-EMPTY exception: an absent or
 * "" frame is dropped from the output — so an existing image, which the reader
 * injects `frame:""` into, never gains a `frame:` line on save — and a non-empty
 * frame must be a valid enum. `extra` (label/dotColor) follows, matching the schema
 * key order (imgSpecFields ends with frame, then deviceSpecFields adds label/dotColor).
 */
const imageObj =
  (extra: Record<string, Check<unknown>> = {}): Check<Record<string, unknown>> =>
  (raw, at) => {
    if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);
    const base = IMG_SPEC as Record<string, Check<unknown>>;
    for (const k of Object.keys(raw)) {
      if (
        !Object.prototype.hasOwnProperty.call(base, k) &&
        !Object.prototype.hasOwnProperty.call(extra, k) &&
        k !== "frame"
      ) {
        return invalid(`${at}: unknown field ${k}`, at);
      }
    }
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(base)) {
      const res = base[k](raw[k], `${at}.${k}`);
      if (!res.ok) return res;
      out[k] = res.value;
    }
    if (raw.frame !== undefined && raw.frame !== "") {
      if (typeof raw.frame !== "string" || !(FRAMES as readonly string[]).includes(raw.frame)) {
        return invalid(`${at}.frame must be one of ${FRAMES.join(", ")}`, at);
      }
      out.frame = raw.frame;
    }
    for (const k of Object.keys(extra)) {
      const res = extra[k](raw[k], `${at}.${k}`);
      if (!res.ok) return res;
      out[k] = res.value;
    }
    return { ok: true, value: out };
  };

const imgSpec = imageObj();
const deviceSpec = imageObj({ label: str, dotColor: str });
/** The same shape as the section shell's own glow, one level down. */
const glowWord = obj({ text: str, top: str, right: str, bottom: str, left: str, size: str });

/**
 * A `{ discriminant, value }` union nested INSIDE the block — swatchTokens' tokens
 * are the only place the schema does this, and they are structurally the same shape
 * as a block itself. So this is the block dispatch one level down, with the same
 * two properties that matter: exhaustive against the derived inner union (a mapped
 * type, so a third token kind is a compile error), and hasOwnProperty rather than
 * `in`, because the discriminant is untrusted and `"constructor" in table` is true
 * on any plain object.
 */
const unionOf = <K extends string>(
  table: { [P in K]: Check<Record<string, unknown>> }
): Check<{ discriminant: K; value: Record<string, unknown> }> => {
  return (raw, at) => {
    if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);
    for (const k of Object.keys(raw)) {
      if (k !== "discriminant" && k !== "value") return invalid(`${at}: unknown field ${k}`, at);
    }
    const d = raw.discriminant;
    if (typeof d !== "string") return invalid(`${at}.discriminant must be a string`, at);
    if (!Object.prototype.hasOwnProperty.call(table, d)) {
      return invalid(`${at}: unknown token kind "${d}"`, at);
    }
    const res = table[d as K](raw.value, `${at}.value`);
    if (!res.ok) return res;
    return { ok: true, value: { discriminant: d as K, value: res.value } };
  };
};

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
  // tier 3
  deviceShelf: obj({ devices: arrayOf(deviceSpec), glow: glowWord, minHeight: numOrNull }),
  featureRows: obj({
    features: arrayOf(obj({ index: str, category: str, title: str, body: str, image: imgSpec })),
  }),
  figureGrid: obj({
    heading: str,
    items: arrayOf(obj({ image: imgSpec, title: str, body: str })),
  }),
  annotatedImage: obj({
    image: imgSpec,
    scrawl: obj({ text: str, top: str, right: str, bottom: str, left: str }),
    // The offsets are CSS-value TEXT ("10%"), not numbers — so they are plain
    // strings covered by the empties rule, not the null rule.
    callouts: arrayOf(obj({ title: str, note: str, top: str, right: str, bottom: str, left: str })),
  }),
  heroCover: obj({
    title: str,
    thesis: str,
    position: str,
    eyebrow: str,
    watermark: str,
    ratingChip: obj({ stat: str, rest: str }),
    meta: arrayOf(obj({ label: str, value: str })),
    // EXACTLY two — see arrayOfLen. The UI hides add/remove for this one array.
    devices: arrayOfLen(2, deviceSpec),
    glow: glowWord,
  }),
  beforeAfter: obj({
    pairs: arrayOf(
      obj({
        title: str,
        tag: str,
        before: imgSpec,
        after: imgSpec,
        changes: arrayOf(obj({ emphasis: str, rest: str })),
      })
    ),
  }),
  swatchTokens: obj({
    groups: arrayOf(
      obj({
        tokens: arrayOf(
          unionOf({
            color: obj({ name: str, value: str, hex: str }),
            font: obj({ name: str, note: str }),
          })
        ),
      })
    ),
  }),
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
