// P4 3(c) — the content -> CaseStudy adapter. Maps a project's Keystatic
// `sections` content (the P4 3(b) schema) into the Section[]/Block[] shape the
// bespoke renderer consumes (CaseStudyView -> SectionRenderer -> BlockRenderer).
//
// PURE by design: only a type-only import from ./types (erased at runtime), no
// Next, no React, no filesystem — unit-exercisable directly with
// `node --experimental-strip-types` (ralph/tests/p4-3c-adapter.mjs), the same
// convention as lib/studio/slug.ts and draft-overlay.ts.
//
// FAIL-LOUD posture (deliberate, carried as a 3(d) flag): disk content can
// bypass Keystatic's UI validation (hand-edited yaml, a scripted migration), and
// the renderer indexes heroCover.devices[0]/[1] unconditionally — so a wrong
// device count or a missing required image THROWS a descriptive error here at
// the adapter boundary (a build/SSG failure) instead of crashing inside
// next/image or silently dropping content. 3(d) may add a preview-placeholder
// guard in front of this for half-authored studio drafts.
//
// The four 3(b) schema quirks this absorbs, plus one:
//  1. selects are always concrete (variant/layout never undefined) — read as-is.
//  2. translateX/translateY recombine into the TS `translate: [x, y]` tuple.
//  3. heroCover.devices (length-validated 2 in the UI) narrows to the
//     [DeviceSpec, DeviceSpec] tuple — defensively re-validated here (above).
//  4. inline **bold** parses into Rich {b} runs (parseRich below).
//  5. always-present empties map to TS optionals: Keystatic dumps glow/
//     ratingChip/scrawl objects and "" texts even when untouched, but the
//     renderer distinguishes undefined from "" (hasHeader is a Boolean check),
//     so empty objects/strings become undefined here.
import type {
  Section,
  Block,
  Rich,
  RichRun,
  ImgSpec,
  DeviceSpec,
  GlowWord,
  Stat,
  Principle,
  Feature,
  BeforeAfterPair,
  Change,
  SwatchToken,
  TokenGroup,
  Scrawl,
  Callout,
  HeroCover,
} from "./types";

/* ---------------------------------------------------------------- parseRich */

/**
 * Parse inline `**bold**` markers into the renderer's Rich shape.
 *
 * A string with NO bold returns the PLAIN STRING (Rich's string branch — a
 * distinct renderWithBold path from a 1-run list, so this is load-bearing, not
 * cosmetic). Any bold yields a run list with no empty text runs. Degenerate
 * syntax is preserved literally, never dropped or half-parsed: `****` (empty
 * bold) and an unclosed `**` stay as literal text.
 */
export function parseRich(s: string): Rich {
  const runs: RichRun[] = [];
  // Non-greedy, content must be >= 1 char — so `****` can never match.
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let found = false;
  while ((m = re.exec(s)) !== null) {
    found = true;
    if (m.index > last) runs.push(s.slice(last, m.index));
    runs.push({ b: m[1] });
    last = m.index + m[0].length;
  }
  if (!found) return s;
  if (last < s.length) runs.push(s.slice(last));
  return runs;
}

/* ------------------------------------------------------------- raw helpers */

type Raw = Record<string, unknown>;

function rec(v: unknown): Raw {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Raw) : {};
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Required string — reader text values coalesce to "". */
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Optional string — "" (Keystatic's untouched-text dump) becomes undefined. */
function opt(v: unknown): string | undefined {
  const s = str(v);
  return s === "" ? undefined : s;
}

/** Optional number — reader number fields are number | null. */
function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

/** Required Rich (bold-parsed). */
function rich(v: unknown): Rich {
  return parseRich(str(v));
}

/** Optional Rich — "" becomes undefined, else bold-parsed. */
function richOpt(v: unknown): Rich | undefined {
  const s = str(v);
  return s === "" ? undefined : parseRich(s);
}

/* --------------------------------------------------------- shape adapters */

function adaptImgSpec(v: unknown, at: string): ImgSpec {
  const o = rec(v);
  const src = str(o.src);
  if (src === "") {
    throw new Error(`${at}: image src is missing — upload an image or remove the block`);
  }
  const translateX = num(o.translateX);
  const translateY = num(o.translateY);
  const spec: ImgSpec = { src, alt: str(o.alt) };
  const width = num(o.width);
  if (width !== undefined) spec.width = width;
  const rotate = num(o.rotate);
  if (rotate !== undefined) spec.rotate = rotate;
  if (translateX !== undefined || translateY !== undefined) {
    spec.translate = [translateX ?? 0, translateY ?? 0];
  }
  const z = num(o.z);
  if (z !== undefined) spec.z = z;
  return spec;
}

function adaptDeviceSpec(v: unknown, at: string): DeviceSpec {
  const o = rec(v);
  const spec: DeviceSpec = adaptImgSpec(v, at);
  const label = opt(o.label);
  if (label !== undefined) spec.label = label;
  const dotColor = opt(o.dotColor);
  if (dotColor !== undefined) spec.dotColor = dotColor;
  return spec;
}

/** Keystatic always dumps the glow object; an empty `text` means "no glow". */
function adaptGlow(v: unknown): GlowWord | undefined {
  const o = rec(v);
  const text = opt(o.text);
  if (text === undefined) return undefined;
  const glow: GlowWord = { text };
  for (const key of ["top", "right", "bottom", "left", "size"] as const) {
    const val = opt(o[key]);
    if (val !== undefined) glow[key] = val;
  }
  return glow;
}

function adaptScrawl(v: unknown): Scrawl | undefined {
  const o = rec(v);
  const text = opt(o.text);
  if (text === undefined) return undefined;
  const scrawl: Scrawl = { text };
  for (const key of ["top", "right", "bottom", "left"] as const) {
    const val = opt(o[key]);
    if (val !== undefined) scrawl[key] = val;
  }
  return scrawl;
}

/* ------------------------------------------------------------- the blocks */

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

type RawBlockKind = (typeof BLOCK_KINDS)[number];

function assertNever(x: never): never {
  throw new Error(`unhandled block kind: ${String(x)}`);
}

function adaptBlock(raw: unknown, at: string): Block {
  const o = rec(raw);
  const discriminant = str(o.discriminant);
  if (!(BLOCK_KINDS as readonly string[]).includes(discriminant)) {
    throw new Error(`${at}: unknown block kind "${discriminant}"`);
  }
  const kind = discriminant as RawBlockKind;
  const v = rec(o.value);

  switch (kind) {
    case "heroCover": {
      const devices = arr(v.devices).map((d, i) =>
        adaptDeviceSpec(d, `${at}.devices[${i}]`)
      );
      if (devices.length !== 2) {
        throw new Error(
          `${at}: heroCover.devices must be exactly 2 (back, front) — got ${devices.length}`
        );
      }
      const chip = rec(v.ratingChip);
      const stat = opt(chip.stat);
      const rest = opt(chip.rest);
      const block: HeroCover = {
        kind,
        title: str(v.title),
        thesis: str(v.thesis),
        position: str(v.position),
        meta: arr(v.meta).map((m) => {
          const mo = rec(m);
          return { label: str(mo.label), value: str(mo.value) };
        }),
        devices: [devices[0], devices[1]],
      };
      const eyebrow = opt(v.eyebrow);
      if (eyebrow !== undefined) block.eyebrow = eyebrow;
      const watermark = opt(v.watermark);
      if (watermark !== undefined) block.watermark = watermark;
      if (stat !== undefined || rest !== undefined) {
        block.ratingChip = { stat: stat ?? "", rest: rest ?? "" };
      }
      const glow = adaptGlow(v.glow);
      if (glow !== undefined) block.glow = glow;
      return block;
    }
    case "deviceShelf": {
      const block: Block = {
        kind,
        devices: arr(v.devices).map((d, i) => adaptDeviceSpec(d, `${at}.devices[${i}]`)),
      };
      const glow = adaptGlow(v.glow);
      if (glow !== undefined) block.glow = glow;
      const minHeight = num(v.minHeight);
      if (minHeight !== undefined) block.minHeight = minHeight;
      return block;
    }
    case "pullQuote":
      return { kind, text: str(v.text) };
    case "glanceGrid":
      return {
        kind,
        items: arr(v.items).map((it) => {
          const o2 = rec(it);
          return { label: str(o2.label), value: str(o2.value) };
        }),
      };
    case "issueList":
      return {
        kind,
        items: arr(v.items).map((it) => {
          const o2 = rec(it);
          return { title: str(o2.title), note: str(o2.note) };
        }),
      };
    case "stepper":
      return {
        kind,
        steps: arr(v.steps).map((st) => {
          const o2 = rec(st);
          return { label: str(o2.label), text: str(o2.text) };
        }),
      };
    case "statCards": {
      const block: Block = {
        kind,
        stats: arr(v.stats).map((st) => {
          const o2 = rec(st);
          const stat: Stat = { value: str(o2.value), body: rich(o2.body), tag: str(o2.tag) };
          const suffix = opt(o2.suffix);
          if (suffix !== undefined) stat.suffix = suffix;
          if (o2.highlighted === true) stat.highlighted = true;
          return stat;
        }),
      };
      const heading = opt(v.heading);
      if (heading !== undefined) block.heading = heading;
      return block;
    }
    case "principleCards": {
      const block: Block = {
        kind,
        cards: arr(v.cards).map((c): Principle => {
          const o2 = rec(c);
          return { index: str(o2.index), title: str(o2.title), body: rich(o2.body) };
        }),
      };
      const heading = opt(v.heading);
      if (heading !== undefined) block.heading = heading;
      const subhead = opt(v.subhead);
      if (subhead !== undefined) block.subhead = subhead;
      return block;
    }
    case "featureRows":
      return {
        kind,
        features: arr(v.features).map((f, i): Feature => {
          const o2 = rec(f);
          return {
            index: str(o2.index),
            category: str(o2.category),
            title: str(o2.title),
            body: rich(o2.body),
            image: adaptImgSpec(o2.image, `${at}.features[${i}].image`),
          };
        }),
      };
    case "beforeAfter":
      return {
        kind,
        pairs: arr(v.pairs).map((p, i): BeforeAfterPair => {
          const o2 = rec(p);
          return {
            title: str(o2.title),
            tag: str(o2.tag),
            before: adaptImgSpec(o2.before, `${at}.pairs[${i}].before`),
            after: adaptImgSpec(o2.after, `${at}.pairs[${i}].after`),
            changes: arr(o2.changes).map((c): Change => {
              const o3 = rec(c);
              return { emphasis: str(o3.emphasis), rest: str(o3.rest) };
            }),
          };
        }),
      };
    case "swatchTokens":
      return {
        kind,
        groups: arr(v.groups).map((g): TokenGroup => {
          const o2 = rec(g);
          return {
            tokens: arr(o2.tokens).map((t): SwatchToken => {
              const o3 = rec(t);
              const tv = rec(o3.value);
              if (o3.discriminant === "font") {
                return { type: "font", name: str(tv.name), note: str(tv.note) };
              }
              const token: SwatchToken = {
                type: "color",
                name: str(tv.name),
                value: str(tv.value),
              };
              const hex = opt(tv.hex);
              if (hex !== undefined) token.hex = hex;
              return token;
            }),
          };
        }),
      };
    case "annotatedImage": {
      const block: Block = { kind, image: adaptImgSpec(v.image, `${at}.image`) };
      const scrawl = adaptScrawl(v.scrawl);
      if (scrawl !== undefined) block.scrawl = scrawl;
      const callouts = arr(v.callouts).map((c): Callout => {
        const o2 = rec(c);
        const callout: Callout = { title: str(o2.title), note: str(o2.note) };
        for (const key of ["top", "right", "bottom", "left"] as const) {
          const val = opt(o2[key]);
          if (val !== undefined) callout[key] = val;
        }
        return callout;
      });
      if (callouts.length > 0) block.callouts = callouts;
      return block;
    }
    case "richText":
      return { kind, paragraphs: arr(v.paragraphs).map((p) => rich(p)) };
    case "closingLine":
      return { kind, text: str(v.text) };
    default:
      return assertNever(kind);
  }
}

/* ------------------------------------------------------------ the sections */

const VARIANTS = new Set(["hero", "default", "static", "bare"]);
const LAYOUTS = new Set(["stack", "split"]);

/**
 * Map a project entry's raw `sections` value (as emitted by the Keystatic
 * reader) into the renderer's Section[]. Throws descriptive errors on content
 * the renderer cannot represent (see the fail-loud note in the header).
 */
export function adaptSections(raw: unknown): Section[] {
  return arr(raw).map((s, i) => {
    const at = `sections[${i}]`;
    const o = rec(s);

    const variant = str(o.variant);
    if (!VARIANTS.has(variant)) {
      throw new Error(`${at}: unknown variant "${variant}"`);
    }
    const layout = str(o.layout);
    if (!LAYOUTS.has(layout)) {
      throw new Error(`${at}: unknown layout "${layout}"`);
    }

    const section: Section = {
      variant: variant as Section["variant"],
      layout: layout as Section["layout"],
      blocks: arr(o.blocks).map((b, j) => adaptBlock(b, `${at}.blocks[${j}]`)),
    };
    const id = opt(o.id);
    if (id !== undefined) section.id = id;
    const index = opt(o.index);
    if (index !== undefined) section.index = index;
    const eyebrow = opt(o.eyebrow);
    if (eyebrow !== undefined) section.eyebrow = eyebrow;
    const title = opt(o.title);
    if (title !== undefined) section.title = title;
    const lead = richOpt(o.lead);
    if (lead !== undefined) section.lead = lead;
    const northStar = richOpt(o.northStar);
    if (northStar !== undefined) section.northStar = northStar;
    const glow = adaptGlow(o.glow);
    if (glow !== undefined) section.glow = glow;
    return section;
  });
}
