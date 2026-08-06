// P4 3(c) — the content -> CaseStudy adapter. Maps a project's Keystatic
// `sections` content (the P4 3(b) schema) into the Section[]/Block[] shape the
// bespoke renderer consumes (CaseStudyView -> SectionRenderer -> BlockRenderer).
//
// PURE by design: only a type-only import from ./types (erased at runtime), no
// Next, no React, no filesystem — unit-exercisable directly with
// `node --experimental-strip-types` (ralph/tests/p4-3c-adapter.mjs), the same
// convention as lib/studio/slug.ts and draft-overlay.ts.
//
// TWO MODES (P4 4(a)), because the same content serves two callers with opposite
// needs:
//
//  - "ssg" (THE DEFAULT, and the whole public path): FAIL-LOUD. Disk content can
//    bypass Keystatic's UI validation (hand-edited yaml, a scripted migration),
//    and the renderer indexes heroCover.devices[0]/[1] unconditionally — so a
//    wrong device count or a missing required image THROWS a descriptive error
//    here at the adapter boundary. A broken public build SHOULD fail rather than
//    ship a crash inside next/image or silently drop content.
//  - "preview" (the studio preview surface only): each fail-loud site yields a
//    typed PLACEHOLDER instead of throwing, so an owner mid-edit sees their
//    work-in-progress with one clearly-marked gap rather than a blank page. The
//    guard sits at the two failure sites (not a try/catch around a whole
//    section) precisely so a missing image in block 5 cannot blank blocks 6-9.
//
// The default is "ssg" ON PURPOSE and is pinned by the unit suite: adaptSections
// (raw) with NO mode argument must stay fail-loud, so a future default flip can
// never silently disarm the public path's protection.
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
  BeforeAfterPair,
  Block,
  Callout,
  Change,
  DeviceSpec,
  Feature,
  FigureItem,
  GlowWord,
  HeroCover,
  ImgSpec,
  Principle,
  Rich,
  RichRun,
  Scrawl,
  Section,
  Stat,
  StoryScreen,
  SwatchToken,
  TokenGroup,
} from "./types";
import type { SectionBlockKind, AssertComplete } from "./sections-raw";

/* -------------------------------------------------------------------- mode */

/** "ssg" throws on unrenderable content (the public default); "preview" yields
 *  placeholders so a half-authored studio draft still renders. */
export type AdaptMode = "ssg" | "preview";

/** Everything resolved once per case study and carried down to every block, so a
 *  new per-study option costs one field here instead of a parameter on each
 *  adapter. Internal — callers pass the options object to adaptSections. */
type AdaptCtx = {
  mode: AdaptMode;
  defaultFrame: Frame;
  /** Optional per-image src rewrite (studio preview only, see adaptSections). */
  rewriteSrc?: (src: string) => string;
};

/** The stand-in for an image the owner has not set yet. Only ever reachable in
 *  preview mode — the ssg path throws before it can be produced. */
const MISSING_IMAGE_SRC = "/images/projects/placeholder-missing.webp";
const MISSING_IMAGE_ALT = "Image not set yet";

/* ------------------------------------------------------------------- frame
 * CS-4 — the device frame an image renders in. The adapter resolves it now; no
 * component reads it yet (CS-5). Absent frame + absent template => "phone", so
 * every existing image and boat-crest render exactly as before.                */

/** The device frames an image can render in. */
export const FRAMES = ["phone", "browser", "macbook"] as const;
export type Frame = (typeof FRAMES)[number];

/** The case-study templates that derive a default frame. */
export const TEMPLATES = ["mobile", "web"] as const;
export type Template = (typeof TEMPLATES)[number];

/**
 * THE SINGLE derivation: a case study's `template` -> its default image frame.
 * `web` -> browser, `mobile` -> phone; anything else (absent, "", unknown) ->
 * phone, so a project with no template resolves exactly as today. This is the one
 * source of the mapping — the sanitizer only validates the enum, it never re-maps.
 */
export function templateDefaultFrame(template: unknown): Frame {
  return template === "web" ? "browser" : "phone";
}

/**
 * Resolve ONE image's frame by precedence: an explicit, valid block `frame` wins;
 * otherwise the template-derived default (already "phone" when there is no
 * template). Permissive like the rest of the adapter — an unknown or "" frame is
 * treated as unset, never thrown.
 */
function resolveFrame(rawFrame: unknown, defaultFrame: Frame): Frame {
  return typeof rawFrame === "string" && (FRAMES as readonly string[]).includes(rawFrame)
    ? (rawFrame as Frame)
    : defaultFrame;
}

/* ---------------------------------------------------------------- parseRich */

/**
 * Which hrefs a link marker may carry. THE one definition — the parser below, the
 * renderer (`components/case-study/rich.tsx`) and the studio serializer all ask this,
 * because a second copy that drifts is how a blocked scheme gets through one path. It
 * lives here, in the parser's own pure module, rather than in a shared file: adapter.ts
 * is loaded directly by the unit suites in plain node, which cannot resolve an
 * extensionless relative import, and keeping it leaf is what makes those suites work.
 *
 * ALLOWLIST, not a blocklist. `javascript:` and `data:` are the obvious attacks but not
 * the only ones, and this content arrives from a draft branch, so anything not named is
 * refused. Callers keep the original text when refused — nothing is silently dropped.
 */
export function isSafeHref(href: string): boolean {
  const h = href.trim();
  if (h === "") return false;
  // Relative, root-relative and same-page links carry no scheme and are always fine.
  if (/^[/#?]/.test(h)) return true;
  // Strip the whitespace and control characters used to smuggle `java\tscript:` past a
  // naive prefix check before looking for a scheme.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(h.replace(/[\s\u0000-\u0020]/g, ""));
  if (!scheme) return true; // bare "example.com/page" — no scheme to abuse
  return ["http", "https", "mailto"].includes(scheme[1].toLowerCase());
}

/**
 * A non-empty http(s) URL — the videoEmbed source rule.
 *
 * Stricter than isSafeHref, which also allows mailto and relative because a LINK is
 * navigation. A `<video src>` must be a fetchable media URL, so only http and https
 * qualify. The whitespace/control strip is the same anti-obfuscation step isSafeHref
 * uses, so `java\tscript:` cannot masquerade as a scheme.
 *
 * ONE definition, shared by the studio form's inline error and the panel's save gate.
 * The sanitiser and this module's own adapter case predate it and keep their equivalent
 * inline checks, which their suites cover; those stay untouched.
 */
export function isHttpUrl(src: string): boolean {
  return /^https?:\/\//i.test(src.trim().replace(/[\s\u0000- ]/g, ""));
}

/** One tokenising pass: split every plain run by `re`, replacing matches with `make`. */
function splitRuns(runs: RichRun[], re: RegExp, make: (m: RegExpExecArray) => RichRun | null): RichRun[] {
  const out: RichRun[] = [];
  for (const run of runs) {
    if (typeof run !== "string") {
      out.push(run); // already marked — a later pass never re-reads an earlier mark
      continue;
    }
    let last = 0;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(run)) !== null) {
      const made = make(m);
      if (made === null) continue; // refused (e.g. unsafe href) — leave it literal
      if (m.index > last) out.push(run.slice(last, m.index));
      out.push(made);
      last = m.index + m[0].length;
    }
    if (last < run.length) out.push(run.slice(last));
  }
  return out;
}

/**
 * Parse inline markers into the renderer's Rich shape.
 *
 * Supports `**bold**`, `*italic*` and `[text](url)`. A string with NO marker returns the
 * PLAIN STRING (Rich's string branch — a distinct render path from a 1-run list, so this
 * is load-bearing, not cosmetic).
 *
 * HOW `*` AND `**` ARE KEPT APART. The passes are LAYERED, and each only ever splits the
 * plain text the previous one left behind. Bold runs first and consumes its own
 * asterisks, so by the time italic looks, no `*` belonging to a `**` is still in play —
 * which is the whole ambiguity. A single combined regex would have to encode that
 * precedence in lookarounds; ordering the passes states it instead.
 *
 * Bold content additionally may not begin or end with `*`, so `***x***` cannot match as
 * a half-eaten bold. It is not syntax (one mark per run), and lands as literal asterisks
 * around a bold `x` rather than being silently reinterpreted.
 *
 * Degenerate syntax is preserved literally, never dropped or half-parsed: `****`, an
 * unclosed `**` or `*`, a lone `*` mid-word, a `[` with no `](`, and a link whose scheme
 * is refused all stay as text.
 */
export function parseRich(s: string): Rich {
  let runs: RichRun[] = [s];
  // 1. bold, first, so its asterisks are gone before italic looks. Content is non-greedy
  //    and may not start or end with `*` (that is the `***` guard).
  runs = splitRuns(runs, /\*\*(?!\*)((?:[^*]|\*(?!\*))+?)(?<!\*)\*\*/g, (m) => ({ b: m[1] }));
  // 2. italic, on what is left. `(?!\*)`/`(?<!\*)` keep it off any surviving `**`.
  runs = splitRuns(runs, /\*(?!\*)([^*]+?)\*(?!\*)/g, (m) => ({ i: m[1] }));
  // 3. links. The url may not contain whitespace or a closing paren.
  runs = splitRuns(runs, /\[([^\]]+)\]\(([^)\s]+)\)/g, (m) =>
    isSafeHref(m[2]) ? { a: m[1], href: m[2].trim() } : null
  );
  // No mark anywhere -> the PLAIN STRING branch, exactly as before this gained italic and
  // links. Tested against `runs` rather than a length check because "" splits to an EMPTY
  // list, and returning [] for an empty string would hand the renderer a run list where
  // it has always had a string.
  if (!runs.some((r) => typeof r !== "string")) return s;
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

/** VE-1 — aspect ratio from the schema's text field; blank or junk -> 16/9. */
function aspectOf(v: unknown): number {
  const n = typeof v === "number" ? v : Number.parseFloat(str(v));
  return Number.isFinite(n) && n > 0 ? n : 16 / 9;
}

/** Optional Rich — "" becomes undefined, else bold-parsed. */
function richOpt(v: unknown): Rich | undefined {
  const s = str(v);
  return s === "" ? undefined : parseRich(s);
}

/* --------------------------------------------------------- shape adapters */

/** A feature's optional auto-scroll screen: the schema's `{ discriminant, value }` union turned
 *  into the render shape, or nothing at all when the arm is `none`. */
function adaptScreen(raw: unknown, at: string, ctx: AdaptCtx): { screen?: StoryScreen } {
  const o = rec(raw);
  const d = str(o.discriminant);
  if (d === "full") return { screen: { full: adaptImgSpec(o.value, `${at}.value`, ctx) } };
  if (d === "split") {
    const v = rec(o.value);
    const asset = (k: string) => ({
      ...adaptImgSpec(v[k], `${at}.value.${k}`, ctx),
      intrinsicHeight: num(rec(v[k]).intrinsicHeight) ?? 0,
    });
    return { screen: { body: asset("body"), footer: asset("footer") } };
  }
  return {};
}

function adaptImgSpec(v: unknown, at: string, ctx: AdaptCtx): ImgSpec {
  const o = rec(v);
  const rawSrc = str(o.src);
  // GUARD SITE 1 — an unset image. ssg throws (a broken public build should
  // fail); preview substitutes the placeholder so the rest of the block renders.
  if (rawSrc === "" && ctx.mode === "ssg") {
    throw new Error(`${at}: image src is missing — upload an image or remove the block`);
  }
  const resolved = rawSrc === "" ? MISSING_IMAGE_SRC : rawSrc;
  // The rewrite is the studio preview's draft-image hook. It is only ever
  // supplied by the preview callers, so the public path takes the identity
  // branch and the emitted spec is unchanged.
  const src = ctx.rewriteSrc ? ctx.rewriteSrc(resolved) : resolved;
  const alt = rawSrc === "" ? MISSING_IMAGE_ALT : str(o.alt);
  const translateX = num(o.translateX);
  const translateY = num(o.translateY);
  const spec: ImgSpec = { src, alt };
  // A rewritten src points at the owner-gated draft-image proxy, which the Next
  // image optimizer would refetch WITHOUT the owner cookie and get a 401 for. So
  // a rewritten image opts out of optimization; an untouched one never sets the
  // flag, so the public spec is byte-identical.
  if (src !== resolved) spec.unoptimized = true;
  const width = num(o.width);
  if (width !== undefined) spec.width = width;
  // The source asset's own dimensions, when content carries them. `DeviceImage` prefers this
  // aspect over the canonical bezel; absent, nothing changes.
  const iw = num(o.intrinsicWidth);
  if (iw !== undefined) spec.intrinsicWidth = iw;
  const ih = num(o.intrinsicHeight);
  if (ih !== undefined) spec.intrinsicHeight = ih;
  const rotate = num(o.rotate);
  if (rotate !== undefined) spec.rotate = rotate;
  if (translateX !== undefined || translateY !== undefined) {
    spec.translate = [translateX ?? 0, translateY ?? 0];
  }
  const z = num(o.z);
  if (z !== undefined) spec.z = z;
  // CS-4 — emit the resolved frame (block frame > template default > phone). No
  // component reads it yet, so this changes no rendered markup.
  spec.frame = resolveFrame(o.frame, ctx.defaultFrame);
  return spec;
}

function adaptDeviceSpec(v: unknown, at: string, ctx: AdaptCtx): DeviceSpec {
  const o = rec(v);
  const spec: DeviceSpec = adaptImgSpec(v, at, ctx);
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

// The list is now POLICED BY THE SCHEMA rather than hand-synced to the copy that
// used to live in lib/studio/sections-format.ts (each carried a comment asking
// the next reader to keep them in step). `satisfies` catches a typo or a rename;
// AssertComplete catches a kind missing entirely.
const BLOCK_KINDS = [
  "heroCover",
  "deviceShelf",
  "pullQuote",
  "glanceGrid",
  "issueList",
  "stepper",
  "statCards",
  "principleCards",
  "figureGrid",
  "featureRows",
  "beforeAfter",
  "beforeAfterStory",
  "swatchTokens",
  "annotatedImage",
  "richText",
  "closingLine",
  "videoEmbed",
] as const satisfies readonly SectionBlockKind[];
// ENFORCED, not merely declared. `type _ = AssertComplete<…>` is inert — a type
// alias holding the "missing kinds" tuple is a perfectly legal type, so it never
// failed a build. Assigning it to `true` is what turns an incomplete list into a
// compile error, which is what the invariant claimed all along. Found while adding
// the 16th kind (VE-1), when the mutation probe showed the adapter staying green.
const _blockKindsComplete: AssertComplete<typeof BLOCK_KINDS> = true;
void _blockKindsComplete;

type RawBlockKind = (typeof BLOCK_KINDS)[number];

function assertNever(x: never): never {
  throw new Error(`unhandled block kind: ${String(x)}`);
}

function adaptBlock(raw: unknown, at: string, ctx: AdaptCtx): Block {
  const o = rec(raw);
  const discriminant = str(o.discriminant);
  // An unknown discriminant throws in BOTH modes: it means the content and the
  // schema disagree, which no placeholder can honestly represent.
  if (!(BLOCK_KINDS as readonly string[]).includes(discriminant)) {
    throw new Error(`${at}: unknown block kind "${discriminant}"`);
  }
  const kind = discriminant as RawBlockKind;
  const v = rec(o.value);

  switch (kind) {
    case "heroCover": {
      const devices = arr(v.devices).map((d, i) =>
        adaptDeviceSpec(d, `${at}.devices[${i}]`, ctx)
      );
      // GUARD SITE 2 — the device tuple. ssg throws; preview pads with the
      // placeholder (or truncates) so the hero still renders while the owner is
      // mid-edit. HeroCover indexes [0]/[1] unconditionally, so preview MUST
      // hand it exactly two.
      if (devices.length !== 2) {
        if (ctx.mode === "ssg") {
          throw new Error(
            `${at}: heroCover.devices must be exactly 2 (back, front) — got ${devices.length}`
          );
        }
        const placeholder: DeviceSpec = { src: MISSING_IMAGE_SRC, alt: MISSING_IMAGE_ALT };
        while (devices.length < 2) devices.push({ ...placeholder });
        devices.length = 2;
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
        devices: arr(v.devices).map((d, i) => adaptDeviceSpec(d, `${at}.devices[${i}]`, ctx)),
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
    case "figureGrid": {
      const block: Block = {
        kind,
        items: arr(v.items).map((it, i): FigureItem => {
          const o2 = rec(it);
          const item: FigureItem = {
            image: adaptImgSpec(o2.image, `${at}.items[${i}].image`, ctx),
          };
          const illustration = opt(o2.illustration);
          if (illustration !== undefined) item.illustration = illustration;
          const title = opt(o2.title);
          if (title !== undefined) item.title = title;
          if (opt(o2.body) !== undefined) item.body = rich(o2.body);
          return item;
        }),
      };
      const heading = opt(v.heading);
      if (heading !== undefined) block.heading = heading;
      return block;
    }
    case "featureRows":
      return {
        kind,
        // ⚠ ONLY "story" IS HONOURED; anything else falls to rows. Three shipped blocks carry no
        // variant at all, so absent MUST mean rows — reading it permissively here is what stops a
        // typo in content from silently restyling them.
        ...(str(v.variant) === "story" ? { variant: "story" as const } : {}),
        features: arr(v.features).map((f, i): Feature => {
          const o2 = rec(f);
          return {
            index: str(o2.index),
            category: str(o2.category),
            title: str(o2.title),
            body: rich(o2.body),
            image: adaptImgSpec(o2.image, `${at}.features[${i}].image`, ctx),
            // `none` yields NO key rather than an empty one — `unitGeo` branches on `"body" in
            // screen`, so an absent screen is what makes a plain feature row non-scrollable.
            ...adaptScreen(o2.screen, `${at}.features[${i}].screen`, ctx),
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
            before: adaptImgSpec(o2.before, `${at}.pairs[${i}].before`, ctx),
            after: adaptImgSpec(o2.after, `${at}.pairs[${i}].after`, ctx),
            changes: arr(o2.changes).map((c): Change => {
              const o3 = rec(c);
              return { emphasis: str(o3.emphasis), rest: str(o3.rest) };
            }),
          };
        }),
      };
    /* ⚠ THE SCHEMA IS FLAT AND THE RENDER SHAPE IS NESTED, so this is where they meet. Content
       stores `ratingFrom`/`ratingTo` and `afterBody`/`afterFooter` as siblings, because Keystatic
       forms edit flat fields far better than nested objects; the components want `rating: {from,to}`
       and `after: {body,footer}`. Doing the nesting HERE keeps both sides idiomatic and puts the
       one mapping in the layer whose whole job is translating content into a render shape.
       `intrinsicHeight` falls back to 0, which `unitGeo` already treats as non-scrollable — an
       unset height renders a static screen rather than dividing by nothing. */
    case "beforeAfterStory":
      return {
        kind,
        index: str(v.index),
        eyebrow: str(v.eyebrow),
        title: str(v.title),
        lead: rich(v.lead),
        rating: { from: str(v.ratingFrom), to: str(v.ratingTo) },
        pairs: arr(v.pairs).map((p, i) => {
          const o2 = rec(p);
          const screen = (raw: unknown, which: string) => ({
            ...adaptImgSpec(raw, `${at}.pairs[${i}].${which}`, ctx),
            intrinsicHeight: num(rec(raw).intrinsicHeight) ?? 0,
          });
          return {
            title: str(o2.title),
            tag: str(o2.tag),
            before: adaptImgSpec(o2.before, `${at}.pairs[${i}].before`, ctx),
            after: { body: screen(o2.afterBody, "afterBody"), footer: screen(o2.afterFooter, "afterFooter") },
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
      const block: Block = { kind, image: adaptImgSpec(v.image, `${at}.image`, ctx) };
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
    case "videoEmbed": {
      const rawSrc = str(v.src).trim();
      // GUARD SITE 3 — the same posture as an unset image, for the same reason: a
      // public build with a videoEmbed that has no source should FAIL rather than
      // ship an empty player, while the studio preview shows the rest of the block
      // so a half-authored draft still renders. An unsafe scheme is treated as no
      // source at all — the sanitiser refuses it on the way in, and this is the
      // second gate for content that reached disk another way.
      const usable = rawSrc !== "" && isSafeHref(rawSrc) && /^https?:/i.test(rawSrc);
      if (!usable && ctx.mode === "ssg") {
        throw new Error(
          `${at}: video src is missing or not an http(s) URL — set a video URL or remove the block`
        );
      }
      const block: Block = {
        kind,
        src: usable ? rawSrc : "",
        // "browser" unless explicitly plain, so an absent or unknown value composes
        // as the chosen default rather than throwing — permissive like the rest of
        // the adapter; the sanitiser is where a bad enum is refused.
        frame: v.frame === "plain" ? "plain" : "browser",
        // The schema stores aspect as TEXT: Keystatic has no optional number that
        // round-trips as a blank field, and a 0 would be indistinguishable from unset.
        // A blank or unparseable value composes as the 16/9 default.
        aspect: aspectOf(v.aspect),
      };
      // The poster is OPTIONAL, so an unset one must not trip adaptImgSpec's
      // fail-loud guard — only a poster the owner actually set is adapted.
      const posterSrc = str(rec(v.poster).src).trim();
      if (posterSrc !== "") block.poster = adaptImgSpec(v.poster, `${at}.poster`, ctx);
      const caption = richOpt(v.caption);
      if (caption !== undefined) block.caption = caption;
      const eyebrow = str(v.eyebrow);
      if (eyebrow !== "") block.eyebrow = eyebrow;
      const title = str(v.title);
      if (title !== "") block.title = title;
      return block;
    }
    default:
      return assertNever(kind);
  }
}

/* ------------------------------------------------------------ the sections */

const VARIANTS = new Set(["hero", "default", "static", "bare"]);
const LAYOUTS = new Set(["stack", "split"]);

/**
 * Map a project entry's raw `sections` value (as emitted by the Keystatic
 * reader) into the renderer's Section[].
 *
 * `mode` DEFAULTS TO "ssg" (fail-loud) so every public caller is protected
 * without opting in, and so adding this option changed no existing behaviour.
 * Only the studio preview passes "preview". Do not flip this default — the unit
 * suite pins it precisely to stop a flip from silently disarming SSG.
 */
export function adaptSections(
  raw: unknown,
  opts?: {
    mode?: AdaptMode;
    template?: unknown;
    /**
     * Rewrite each image `src` as it is adapted. The studio preview passes one
     * that routes DRAFT-ONLY images through the owner-gated proxy, because a
     * just-uploaded image lives on the draft branch and its public path 404s
     * until publish. A rewritten image is marked `unoptimized`.
     *
     * Public callers pass nothing and get the identity behaviour, so the SSG
     * output is unchanged.
     */
    rewriteSrc?: (src: string) => string;
  }
): Section[] {
  const mode: AdaptMode = opts?.mode ?? "ssg";
  // CS-4 — the case-study template's default frame, resolved ONCE per case study
  // and applied to every image unless a block overrides it. Absent -> "phone".
  const defaultFrame = templateDefaultFrame(opts?.template);
  const ctx: AdaptCtx = { mode, defaultFrame, rewriteSrc: opts?.rewriteSrc };
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
      blocks: arr(o.blocks).map((b, j) => adaptBlock(b, `${at}.blocks[${j}]`, ctx)),
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
