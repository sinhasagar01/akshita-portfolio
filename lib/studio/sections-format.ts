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
// 4(b)-i SCOPE: the section shell + `pullQuote` are validated FULLY. Other kinds
// are checked for a KNOWN discriminant and then their `value` passes through
// opaquely — the editor renders no form for them yet, so it round-trips them
// verbatim. The per-kind validator table is 4(b)-ii; until then an unknown kind
// is still rejected, so the schema and the patch can never silently disagree.
//
// Dependency-free beyond a type-only import, so it is unit-exercisable directly.
import type { SaveError } from "./site-settings-format";

/** The 14 in-scope kinds — must match the keystatic.config sections schema and
 *  the adapter's BLOCK_KINDS. The two scroll-story kinds are excluded by design
 *  (boat-crest's island), so content can never carry them. */
const BLOCK_KINDS = [
  "heroCover",
  "deviceShelf",
  "pullQuote",
  "glanceGrid",
  "issueList",
  "stepper",
  "statCards",
  "principleCards",
  "featureRows",
  "beforeAfter",
  "swatchTokens",
  "annotatedImage",
  "richText",
  "closingLine",
] as const;

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

/** Validate one block. pullQuote is validated fully; other KNOWN kinds pass their
 *  value through opaquely (4b-i). An unknown kind is always rejected. */
function sanitizeBlock(raw: unknown, at: string): { ok: true; value: SanitizedBlock } | Fail {
  if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);

  const discriminant = raw.discriminant;
  if (typeof discriminant !== "string") {
    return invalid(`${at}.discriminant must be a string`, at);
  }
  if (!(BLOCK_KINDS as readonly string[]).includes(discriminant)) {
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

  if (discriminant === "pullQuote") {
    const v = raw.value;
    for (const k of Object.keys(v)) {
      if (k !== "text") return invalid(`${at}.value: unknown field ${k}`, at);
    }
    if (typeof v.text !== "string") {
      return invalid(`${at}.value.text must be a string`, at);
    }
    return { ok: true, value: { discriminant, value: { text: v.text } } };
  }

  // 4(b)-i — a known kind the editor does not edit yet. Its value round-trips
  // verbatim; 4(b)-ii replaces this with a per-kind validator.
  return { ok: true, value: { discriminant, value: raw.value } };
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
