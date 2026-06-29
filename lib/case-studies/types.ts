import type { StaticImageData } from "next/image";

/* ============================================================
   Case study content model — data-driven, shared by every study.
   One CaseStudy object per study, mapped over by CaseStudyView.
   A Section is a card; a Block is one body layout inside it.
============================================================ */

/** Inline rich text — a plain string, or a run list where { b } is bold. */
export type RichRun = string | { b: string };
export type Rich = string | RichRun[];

/** An image. boAt screens are static imports (true aspect + blur placeholder). */
export type ImgSpec = {
  src: StaticImageData | string;
  alt: string;
  /** Rendered width in px on desktop. Height is derived from the aspect. */
  width?: number;
  /** Rendered height in px. When set, width is derived (used by before/after pairs). */
  height?: number;
  /** Desktop-only rotation in degrees. Dropped at the mobile breakpoint. */
  rotate?: number;
  /** Desktop-only translate [x, y] in px. Dropped at the mobile breakpoint. */
  translate?: [number, number];
  /** Stacking order within a shelf. */
  z?: number;
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

export type Feature = {
  index: string;
  category: string;
  title: string;
  body: Rich;
  image: ImgSpec;
};

export type Change = { emphasis: string; rest: string };

export type BeforeAfterPair = {
  title: string;
  tag: string;
  before: ImgSpec;
  after: ImgSpec;
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
  devices: DeviceSpec[];
  glow?: GlowWord;
};

/** Discriminated union — each entry names a block type plus its data. */
export type Block =
  | HeroCover
  | { kind: "deviceShelf"; devices: DeviceSpec[]; glow?: GlowWord; minHeight?: number }
  | { kind: "pullQuote"; text: string }
  | { kind: "glanceGrid"; items: { label: string; value: string }[] }
  | { kind: "issueList"; items: { title: string; note: string }[] }
  | { kind: "stepper"; steps: { label: string; text: string }[] }
  | { kind: "statCards"; heading?: string; stats: Stat[] }
  | { kind: "principleCards"; heading?: string; subhead?: string; cards: Principle[] }
  | { kind: "featureRows"; features: Feature[] }
  | { kind: "beforeAfter"; pairs: BeforeAfterPair[] }
  | { kind: "swatchTokens"; groups: TokenGroup[] }
  | { kind: "annotatedImage"; image: ImgSpec; scrawl?: Scrawl; callouts?: Callout[] }
  | { kind: "richText"; paragraphs: Rich[] }
  | { kind: "closingLine"; text: string };

export type BlockKind = Block["kind"];

/** A section is one card. The hero variant skips the standard header. */
export type Section = {
  id?: string;
  variant?: "hero" | "default";
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
};

/**
 * Slugs served by the bespoke template via a literal route segment. Filtered out
 * of the Keystatic [slug] route's generateStaticParams to avoid a build collision.
 * Only add a slug here once its literal route is wired and its content is poured.
 */
export const BESPOKE_SLUGS = new Set<string>(["boat-crest"]);
