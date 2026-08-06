import type { StaticImageData } from "next/image";

/* ============================================================
   Case study content model — data-driven, shared by every study.
   One CaseStudy object per study, mapped over by CaseStudyView.
   A Section is a card; a Block is one body layout inside it.
============================================================ */

/**
 * Inline rich text — a plain string, or a run list.
 *
 * ONE mark per run, deliberately: `{ b }` bold, `{ i }` italic, `{ a, href }` link.
 * A run cannot be bold AND italic. Supporting both would mean carrying the marks as
 * flags beside the text (`{ text, b?, i? }`), which rewrites every consumer — the
 * hand-authored runs in boat-crest.ts, About's own renderer, the serializer — to buy a
 * combination editorial prose almost never needs. `***both***` is therefore not
 * syntax, and is preserved literally rather than half-parsed.
 */
export type RichRun = string | { b: string } | { i: string } | { a: string; href: string };
export type Rich = string | RichRun[];

/** An image. boAt screens are static imports (true aspect + blur placeholder). */
export type ImgSpec = {
  src: StaticImageData | string;
  alt: string;
  /** Rendered width in px on desktop. Height is derived from the aspect. */
  width?: number;
  /** Rendered height in px. When set, width is derived (used by before/after pairs). */
  height?: number;
  /**
   * The SOURCE asset's own pixel dimensions — not a rendered size.
   *
   * ⚠ A STATIC IMPORT CARRIES THESE AND A PATH STRING DOES NOT, which is the whole reason they
   * exist. `DeviceImage` sizes a static import from its intrinsic dims and falls back, for a bare
   * string, to the canonical bezel aspect. MEASURED on boat-crest: **19 of its 25 images have a
   * true aspect different from that fallback**, and the scroller footers are 4.33 and 3.77 — wide
   * strips forced into a 0.476 phone box. So porting a hand-built study to content without these
   * does not merely lose a blur placeholder, it renders the images the wrong shape.
   *
   * Optional, because a static import needs neither. `ScreenAsset` below REQUIRES the height,
   * because `unitGeo` divides by it.
   */
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  /** Desktop-only rotation in degrees. Dropped at the mobile breakpoint. */
  rotate?: number;
  /** Desktop-only translate [x, y] in px. Dropped at the mobile breakpoint. */
  translate?: [number, number];
  /** Stacking order within a shelf. */
  z?: number;
  /** CS-4 — the device frame this image renders in. The adapter always resolves
   *  it (block frame > template default > "phone"); no component reads it until
   *  CS-5, so emitting it changes no rendered markup. Optional because hand-authored
   *  ImgSpecs (boat-crest) omit it and default to phone. */
  frame?: "phone" | "browser" | "macbook";
  /** Skip next/image optimization. Set by the adapter ONLY when it rewrote the
   *  src to the owner-gated draft-image proxy, which the optimizer cannot fetch
   *  (it refetches server-side without the owner cookie). Never set on the
   *  public path. */
  unoptimized?: boolean;
};

/** A device screenshot on a shelf, with an optional theme label. */
export type DeviceSpec = ImgSpec & {
  label?: string;
  /** Optional dot colour beside the label (literal hex, product palette). */
  dotColor?: string;
};

/** Faint Fraunces watermark behind a section. Positions are desktop hints. */
export type GlowWord = {
  text: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  /** font-size, e.g. "clamp(6rem, 14vw, 13rem)". */
  size?: string;
};

export type Stat = {
  value: string;
  suffix?: string;
  body: Rich;
  tag: string;
  highlighted?: boolean;
};

export type Principle = { index: string; title: string; body: Rich };

/** One cell of a `figureGrid`: a plain (frameless) illustration or diagram with an
 *  optional caption title and body. Used for concept diagrams and card grids that
 *  are not product-in-a-device screenshots. */
export type FigureItem = {
  image: ImgSpec;
  title?: string;
  body?: Rich;
  /** ⚠ AN INLINE ILLUSTRATION COMPONENT, WHICH IS THE ONLY FORM THAT THEMES. When set and known to
   *  `ILLUSTRATIONS`, it renders INSTEAD of `image` — the raster stays in the content as the
   *  fallback for an id that stops resolving. An `.svg` in `image.src` would NOT have worked: an
   *  SVG behind `<img src>` is a separate document and cannot read the page's custom properties,
   *  verified by rasterisation. See `components/case-study/illustrations`. */
  illustration?: string;
};

/** A screen asset in an auto-scroller, carrying its INTRINSIC height in 1030-space.
 *
 *  ⚠ `intrinsicHeight` IS NOT `ImgSpec.height`, AND THE TWO MUST NOT BE MERGED. `ImgSpec.height`
 *  is a RENDERED height in CSS px ("when set, width is derived"); this is the pixel height of the
 *  asset itself, and `deviceScroller.unitGeo` divides by it to get `scrollPct`. Overloading one
 *  field for both would compile perfectly and silently compute a scroll ratio from a layout
 *  number — a correct measurement of the wrong quantity, which is a failure shape this project has
 *  already recorded twice.
 *
 *  ⚠ AND IT IS EXPLICIT BECAUSE CONTENT CANNOT DERIVE IT. A static import carries `.height`
 *  intrinsically, so the code path passes it straight through and nothing is hand-typed. A CMS
 *  entry is a path string with no dims at all, and measuring at runtime is the `offsetHeight`
 *  decode race `deviceScroller` documents itself as being free of. So the number is authored. */
/** An `ImgSpec` whose intrinsic height is REQUIRED — `deviceScroller.unitGeo` divides by it, so a
 *  missing one is not a degraded render but a broken scroll ratio. Same field, narrowed, rather
 *  than a second name for the same measurement. */
export type ScreenAsset = ImgSpec & { intrinsicHeight: number };

/** cs-07 auto-scroll story assets (optional). A scrollable screen is split into a
 *  tall `body` (scrolls behind the bezel) + a pinned `footer`; onboarding is a single
 *  `full` screen, which is NOT scrollable and therefore needs no intrinsic height.
 *  Absent → the feature has no auto-scroll story (e.g. used by the `rows` variant). */
export type StoryScreen =
  | { full: ImgSpec }
  | { body: ScreenAsset; footer: ScreenAsset };

export type Feature = {
  index: string;
  category: string;
  title: string;
  body: Rich;
  image: ImgSpec;
  screen?: StoryScreen;
};

export type Change = { emphasis: string; rest: string };

export type BeforeAfterPair = {
  title: string;
  tag: string;
  before: ImgSpec;
  after: ImgSpec;
  changes: Change[];
};

/** cs-07 scroll-pinned variant of a comparison. `before` is a single static screen
 *  shown in the bezel; `after` is the three-layer auto-scroller (body + footer).
 *
 *  ⚠ `after` IS LITERALLY `StoryScreen`'s SCROLLABLE ARM, not merely "the same shape". Both
 *  components hand it to `unitGeo`, so a second structurally-identical declaration would be one
 *  the geometry could silently drift away from. It is extracted rather than restated. */
export type BeforeAfterStoryPair = {
  title: string;
  tag: string;
  before: ImgSpec;
  after: Extract<StoryScreen, { body: ScreenAsset }>;
  changes: Change[];
};

/** A swatch/type token chip. `color` shows a swatch; `type` is a font name. */
export type SwatchToken =
  | { type: "color"; name: string; value: string; hex?: string }
  | { type: "font"; name: string; note: string };

/** Tokens are grouped; groups render separated by a thin divider. */
export type TokenGroup = { tokens: SwatchToken[] };

export type Scrawl = {
  text: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

export type Callout = {
  title: string;
  note: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

/** Hero cover — title, thesis, meta facts, rating chip, and its own devices. */
export type HeroCover = {
  kind: "heroCover";
  title: string;
  thesis: string;
  position: string;
  ratingChip?: { stat: string; rest: string };
  meta: { label: string; value: string }[];
  /** Exactly two — [back, front]. The hero's entrance is a hand-tuned two-phone
   *  parallax (distinct back/front choreography, see HeroCover.tsx), not a
   *  generic N-device layout — hence a tuple, not an open-ended array. */
  devices: [DeviceSpec, DeviceSpec];
  glow?: GlowWord;
  /** Optional eyebrow label above the title (e.g. "Case study · Product
   *  design"). Omitted → no eyebrow row renders. */
  eyebrow?: string;
  /** Optional faint Fraunces watermark word behind the device cluster (e.g.
   *  "crest"). Omitted → no watermark renders. */
  watermark?: string;
};

/** Discriminated union — each entry names a block type plus its data. */
/**
 * VE-1 — an externally hosted video with an optional poster still.
 *
 * `src` is a URL, not a repo path, and that is the one deliberate break from every
 * other media block: the poster is committed and content-addressed like any image,
 * the video is not committed at all. `frame` picks the browser chrome or a plain
 * card, mirroring DeviceImage rather than splitting this into two kinds.
 */
export type VideoEmbed = {
  kind: "videoEmbed";
  src: string;
  poster?: ImgSpec;
  caption?: Rich;
  frame: "plain" | "browser";
  aspect: number;
  eyebrow?: string;
  title?: string;
};

export type Block =
  | HeroCover
  | VideoEmbed
  | { kind: "deviceShelf"; devices: DeviceSpec[]; glow?: GlowWord; minHeight?: number }
  | { kind: "pullQuote"; text: string }
  | { kind: "glanceGrid"; items: { label: string; value: string }[] }
  | { kind: "issueList"; items: { title: string; note: string }[] }
  | { kind: "stepper"; steps: { label: string; text: string }[] }
  | { kind: "statCards"; heading?: string; stats: Stat[] }
  | { kind: "principleCards"; heading?: string; subhead?: string; cards: Principle[] }
  | { kind: "figureGrid"; heading?: string; items: FigureItem[] }
  /* ⚠ ONE KIND, TWO PRESENTATIONS. `featureStory` used to be a separate member of this union
     carrying the IDENTICAL payload — `Feature[]` — and differing only in which component rendered
     it and how it animated. That is a presentation difference wearing a content difference's
     clothes: it cost the Add menu a second entry with the same fields and nothing in the UI to
     tell them apart. `variant` is absent on every existing `featureRows`, so ABSENT MUST MEAN
     "rows" and the default is load-bearing rather than cosmetic. */
  | { kind: "featureRows"; features: Feature[]; variant?: "rows" | "story" }
  | { kind: "beforeAfter"; pairs: BeforeAfterPair[] }
  | {
      kind: "beforeAfterStory";
      index?: string;
      eyebrow?: string;
      title?: string;
      lead?: Rich;
      rating?: { from: string; to: string };
      pairs: BeforeAfterStoryPair[];
    }
  | { kind: "swatchTokens"; groups: TokenGroup[] }
  | { kind: "annotatedImage"; image: ImgSpec; scrawl?: Scrawl; callouts?: Callout[] }
  | { kind: "richText"; paragraphs: Rich[] }
  | { kind: "closingLine"; text: string };

export type BlockKind = Block["kind"];

/** A section is one card. The hero variant skips the standard header. */
export type Section = {
  id?: string;
  variant?: "hero" | "default" | "static" | "bare";
  index?: string;
  eyebrow?: string;
  /** Title may contain "\n" for an explicit line break. */
  title?: string;
  lead?: Rich;
  /** A display-italic statement that opens the section (e.g. Goals' north star). */
  northStar?: Rich;
  /** "stack" (default) renders blocks vertically; "split" places the first two
   *  blocks side by side on desktop (e.g. an issue list beside a screenshot). */
  layout?: "stack" | "split";
  glow?: GlowWord;
  blocks: Block[];
};

export type CaseStudy = {
  slug: string;
  title: string;
  thesis: string;
  description: string;
  sections: Section[];
  /** CS-7b — the case-study template ("web" | "mobile" | ""), so the renderer can
   *  switch on the Bold-gallery web treatments. Absent/"" and "mobile" render the
   *  existing (mobile) composition; only "web" opts in. Threaded from the page down
   *  through CaseStudyView; blocks receive a derived `web` boolean. */
  template?: string;
};

