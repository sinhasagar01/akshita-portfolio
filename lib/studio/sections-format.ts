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
// The 16 in-scope kinds (CORRECTED FROM 14, a count that decayed silently as richText,
// closingLine and videoEmbed were added) are no longer a list here. Membership IS the
// VALIDATORS table's own keys, and the table is `{ [K in SectionBlockKind]: … }` — exhaustive
// against the Keystatic-derived union, so a kind cannot be missed. This replaces a
// hand-synced copy of the adapter's list that carried a comment asking the next
// reader to keep the two in step.
//
// BLOG PR 3b — the field COMBINATORS below (str, arrayOf, obj, imgSpec, videoSrc,
// videoFrame, plus the Check/Ok/Fail types and invalid/isPlainObject) are now EXPORTED
// so lib/studio/blog-format.ts can share them. The line is drawn deliberately:
//   - PRIMITIVES are shared. imgSpec and videoSrc carry real validation LOGIC (the
//     frame enum, the http(s) URL rule with its anti-obfuscation strip). Two copies of
//     those would diverge the first time one is fixed — the same forking smell that
//     made parameterizing right in 3a.
//   - The TABLE is not shared. Each collection owns its own kind->validator map,
//     exhaustive over its own Keystatic-derived union, so a new kind in either schema
//     is a compile error in that collection's table and nowhere else.
// Adding `export` changed no behaviour here; the 132-assertion block-forms suite is
// per-file identical across the change.
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

export type Fail = { ok: false; error: SaveError };
export const invalid = (message: string, field?: string): Fail =>
  ({ ok: false, error: { code: "invalid_patch", field, message } });

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/* ------------------------------------------------- per-kind field validators */

export type Ok<T> = { ok: true; value: T };
export type Check<T> = (raw: unknown, at: string) => Ok<T> | Fail;

export const str: Check<string> = (raw, at) =>
  typeof raw === "string" ? { ok: true, value: raw } : invalid(`${at} must be a string`, at);

/** Exported for blog's sanitizer, which injects the shared combinators rather than
 *  re-deriving them (#173: the COMBINATORS are shared, only the TABLE is blog's).
 *  `imageBlock.wide` and `.decorative` are its first blog consumers; projects' only
 *  boolean is `statCards.highlighted`, whose behaviour is unchanged. */
export const bool: Check<boolean> = (raw, at) =>
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
 *
 * EXPORTED alongside `bool` for blog's injected combinator set. `imageBlock.src` is the
 * same `string | null` shape as every projects image src, so it gets this gate rather than
 * a weaker blog-local one.
 */
export const imageSrc: Check<string | null> = (raw, at) => {
  if (raw === null) return { ok: true, value: null };
  if (typeof raw !== "string") return invalid(`${at} must be a string or null`, at);
  if (raw === "") return invalid(`${at} must be a path or null, never ""`, at);
  return { ok: true, value: raw };
};

export const arrayOf =
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
/**
 * ⚠ `omitEmpty` IS THE ONE WAY TO ADD A FIELD WITHOUT REWRITING EVERY FILE.
 *
 * Every key in a shape is REQUIRED (the empties-preserved rule), and the sanitised object is
 * dumped straight back to disk — `preserved + dump({ sections }) === raw` byte for byte. So a new
 * key rejects all existing content for being absent, and setting it to `undefined` instead would
 * put a `variant: null` line into three case-study files that nobody edited. Adding one naively
 * failed 147 assertions, which is what this exists to make impossible.
 *
 * A key listed here behaves exactly as `frame` already does inside `imageObj`: absent or "" is
 * DROPPED from the output, so a file that never had the key never gains it, and the Keystatic
 * reader injecting `""` into existing entries round-trips to nothing. A non-empty value is checked
 * and kept — IN ITS DECLARED POSITION, because the loop below still walks the shape in order and
 * merely skips, so a present key lands where the schema puts it rather than at the end.
 *
 * `frame` is deliberately NOT migrated onto this. Its check is an enum test rather than a plain
 * one, and folding it in would mean this generic helper knowing about image frames.
 */
export const obj =
  <S extends Record<string, Check<unknown>>>(
    shape: S,
    opts: { omitEmpty?: readonly (keyof S & string)[] } = {},
  ): Check<Record<string, unknown>> =>
  (raw, at) => {
    if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);
    const omit = new Set<string>(opts.omitEmpty ?? []);
    for (const k of Object.keys(raw)) {
      if (!Object.prototype.hasOwnProperty.call(shape, k)) {
        return invalid(`${at}: unknown field ${k}`, at);
      }
    }
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(shape)) {
      if (omit.has(k) && (raw[k] === undefined || raw[k] === "")) continue;
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

/** The source asset's own pixel dimensions. Omit-when-empty, like `frame`. */
const INTRINSIC: readonly string[] = ["intrinsicWidth", "intrinsicHeight"];

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
        k !== "frame" &&
        !INTRINSIC.includes(k)
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
    // ⚠ THE SOURCE ASSET'S OWN DIMENSIONS, OMITTED WHEN EMPTY — the same posture as `frame` above
    // and for the same reason: every image already on disk lacks them, and a required key would
    // reject all of it. They are NOT the rendered `width`/`height` in the base shape; a static
    // import carries these implicitly and a path string cannot, which is what let 19 of
    // boat-crest's 25 images render at the wrong aspect when it was ported to content.
    for (const k of INTRINSIC) {
      if (raw[k] === undefined || raw[k] === "" || raw[k] === null) continue;
      const res = numOrNull(raw[k], `${at}.${k}`);
      if (!res.ok) return res;
      out[k] = res.value;
    }
    for (const k of Object.keys(extra)) {
      const res = extra[k](raw[k], `${at}.${k}`);
      if (!res.ok) return res;
      out[k] = res.value;
    }
    return { ok: true, value: out };
  };

/**
 * VE-1 — the video source. REQUIRED and http(s) only.
 *
 * Stricter than the link mark's allowlist on purpose: a link may be mailto or
 * site-relative because it is navigation, but a <video src> has to be a fetchable
 * media URL, so only http and https make sense. Everything else — javascript:,
 * data:, a bare path, an empty field — is refused with the reason, and refusing at
 * the WRITE boundary is what keeps the value out of the yaml in the first place.
 *
 * The renderer and the adapter check again. This is the gate; those are the belt.
 */
export const videoSrc: Check<string> = (raw, at) => {
  if (typeof raw !== "string") return invalid(`${at} must be a string`, at);
  const v = raw.trim();
  // EMPTY IS ACCEPTED HERE, and that is deliberate. A block is born from the picker
  // with no source, exactly as an image block is born with `src: null`, so refusing
  // empty at SAVE would make the kind impossible to add at all. Emptiness is caught
  // at PUBLISH, where validate-draft-sections re-renders through the ssg adapter and
  // throws — the same split every image block already uses: permissive about
  // half-authored drafts, strict about what may go live.
  //
  // What is refused here is a NON-EMPTY value that is not an http(s) URL, because
  // that is a mistake no later gate should have to tolerate.
  if (v === "") return { ok: true, value: v };
  // Strip the whitespace and control padding used to smuggle `java\tscript:` past a
  // naive prefix test before reading the scheme.
  if (!/^https?:\/\//i.test(v.replace(/[\s\u0000-\u0020]/g, ""))) {
    return invalid(`${at} must be an http:// or https:// URL`, at);
  }
  return { ok: true, value: v };
};

/** VE-1 — the two frames the block can render in. */
export const videoFrame: Check<string> = (raw, at) => {
  if (typeof raw !== "string") return invalid(`${at} must be a string`, at);
  if (raw !== "plain" && raw !== "browser") {
    return invalid(`${at} must be "plain" or "browser"`, at);
  }
  return { ok: true, value: raw };
};

export const imgSpec = imageObj();

/** An image PLUS the source asset's own pixel height, which the auto-scroller divides by. Declared
 *  from `imageObj` so it inherits the frame handling and the key order rather than restating them. */
const screenAsset = imageObj({ intrinsicHeight: numOrNull });

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
 * A feature's optional auto-scroll screen. A `{ discriminant, value }` union like swatchTokens'
 * tokens, but `unionOf` does not fit it: the `none` arm's value is NULL, not an object, and
 * `unionOf`'s table is typed `Check<Record<string, unknown>>`. Bending that type to admit null
 * would weaken it for the token union too, so this stays local and explicit.
 */
const storyScreen: Check<{ discriminant: string; value: unknown }> = (raw, at) => {
  if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);
  for (const k of Object.keys(raw)) {
    if (k !== "discriminant" && k !== "value") return invalid(`${at}: unknown field ${k}`, at);
  }
  const d = raw.discriminant;
  if (d === "none") return { ok: true, value: { discriminant: "none", value: null } };
  if (d === "full") {
    const res = imgSpec(raw.value, `${at}.value`);
    return res.ok ? { ok: true, value: { discriminant: "full", value: res.value } } : res;
  }
  if (d === "split") {
    const res = obj({ body: screenAsset, footer: screenAsset })(raw.value, `${at}.value`);
    return res.ok ? { ok: true, value: { discriminant: "split", value: res.value } } : res;
  }
  return invalid(`${at}: unknown screen kind "${String(d)}"`, at);
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
  featureRows: obj(
    {
      // Declared FIRST because the schema declares it first — `obj` rebuilds in declared order.
      variant: str,
      features: arrayOf(obj(
        { index: str, category: str, title: str, body: str, image: imgSpec, screen: storyScreen },
        // ⚠ OMITTED WHEN ABSENT, same posture as `variant` and `frame`. Every `featureRows` feature
        // already on disk predates this field, so a required key rejects all of it — which is
        // exactly what it did, on 27 assertions, before this was added.
        { omitEmpty: ["screen"] },
      )),
    },
    // …and omitted when empty, so the three shipped featureRows blocks never gain a `variant:` line.
    { omitEmpty: ["variant"] },
  ),
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
  // The scroll story. `intrinsicHeight` is `numOrNull` like every other tier-3 number, so an unset
  // one round-trips as an explicit null rather than vanishing — the empties-preserved rule. It is
  // the asset's OWN pixel height, not a rendered one; see the schema note.
  beforeAfterStory: obj({
    index: str,
    eyebrow: str,
    title: str,
    lead: str,
    ratingFrom: str,
    ratingTo: str,
    pairs: arrayOf(
      obj({
        title: str,
        tag: str,
        before: imgSpec,
        afterBody: screenAsset,
        afterFooter: screenAsset,
        changes: arrayOf(obj({ emphasis: str, rest: str })),
      })
    ),
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
  // VE-1. `obj` refuses any key not listed, so an unknown field is a 400 rather than
  // something that reaches disk. aspect is a TEXT field in the schema (Keystatic has
  // no optional number that round-trips as blank), so it is validated as a string and
  // parsed by the adapter.
  videoEmbed: obj({
    src: videoSrc,
    poster: imgSpec,
    caption: str,
    frame: videoFrame,
    aspect: str,
    eyebrow: str,
    title: str,
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
