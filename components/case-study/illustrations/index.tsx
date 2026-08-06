/* THE FOSFOR DATA PROFILING ILLUSTRATIONS, REBUILT AS INLINE SVG SO THEY FOLLOW THE PALETTE.
 *
 * ---- ⚠ WHY INLINE, WHICH IS THE WHOLE POINT AND NEARLY WENT THE OTHER WAY -------------------
 *
 * These shipped as eight `.webp` files. A raster is the fifth shape #331 named — a colour no static
 * analysis can reach and no theme can move — and the census structurally cannot see one, because it
 * reads built CSS, SVG attributes and runtime JS. They were never a leak the boundary file missed.
 * They were outside every population by construction, and the owner found them by looking.
 *
 * ⚠ AND "REBUILD AS SVG" HAS TWO READINGS, ONLY ONE OF WHICH THEMES. An SVG referenced through
 * `<img src>` is a separate document and CANNOT SEE THE PAGE'S CUSTOM PROPERTIES. Verified by
 * rasterising one: a rect filled `var(--color-accent-500, magenta)` came back MAGENTA through an
 * `<img>` and came back the live accent when the same markup was inlined in the DOM.
 *
 * So eight `.svg` files handed to `figureGrid` would have looked right on cream and stayed warm on
 * harbour — THE IDENTICAL DEFECT IN A DIFFERENT FILE FORMAT, shipped as its own fix. Inline is not a
 * style preference here; it is the only form that themes.
 *
 * ---- THE COLOURS, MEASURED FROM THE RASTERS ------------------------------------------------
 *
 * The originals are hand-picked NEAR-tokens, which is what a design tool produces:
 *
 *   cream fill   rgb(234,225,208)  13.9 from cream-200
 *   ink stroke   rgb(57,47,39)     22.6 from ink-800
 *   divider dots rgb(199,194,184)   7.3 from ink-200
 *   accent fill  rgb(213,123,85)   67.1 from accent-500
 *
 * Taking the tokens moves the accent by 67, the same order as #360's collapse, and that shift IS the
 * change rather than a cost of it.
 *
 * ⚠ THE THREE ACCENT STRENGTHS ARE ONE TOKEN AT THREE MIXES, NOT THREE TOKENS. `metric-usage` and
 * `metric-quality-lift` use a light/mid/dark ramp — rgb(213,123,85), rgb(189,95,58), rgb(156,74,45).
 * Naming three would put two more names in the palette that only these files say, so they derive
 * from `accent-500` and travel with it.
 */
import type { ReactNode } from "react";

const INK = "var(--color-ink-800)";
const CREAM = "var(--color-cream-200)";
const CREAM_DEEP = "var(--color-cream-300)";
const HAIR = "var(--color-ink-200)";
const A = "var(--color-accent-500)";
const A_LIGHT = "color-mix(in srgb, var(--color-accent-500) 72%, var(--color-cream-50))";
const A_DEEP = "color-mix(in srgb, var(--color-accent-500) 78%, var(--color-ink-950))";

/** Shared frame. `1000x750` is the rasters' own box, so every coordinate below is a MEASUREMENT
 *  from the original rather than a redrawing of it. */
function Ill({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 1000 750" role="img" aria-label={label} className="h-full w-full">
      {children}
    </svg>
  );
}

/* ---- section 03, the problem ------------------------------------------------------------ */

/** Three data stores, one highlighted, separated by dotted walls. Cylinders at cx 165.5 / 499.5 /
 *  833.5, rx 84, ry 27, top ellipse cy 269, bottom cy 480.
 *
 *  ⚠ THE SEAM ARC IS THE ONE THING THE TRIAL GOT WRONG, and it is why the loop is per file. An arc
 *  between two endpoints BULGES BELOW THEM, so drawing it at the measured y put it 27px low. It
 *  showed in the diff map as two solid bands where every other difference was a one-pixel outline —
 *  4.35% of edge antialiasing and 4.35% in two bands are the same number and different outcomes. */
function Silos() {
  const cyl = (cx: number, fill: string) => (
    <g key={cx}>
      <path d={`M ${cx - 84} 269 V 480 A 84 27 0 0 0 ${cx + 84} 480 V 269 Z`} fill={fill} />
      <ellipse cx={cx} cy={269} rx={84} ry={27} fill={fill} />
      <path d={`M ${cx - 84} 349 A 84 27 0 0 0 ${cx + 84} 349`} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={5} />
      <path d={`M ${cx - 84} 269 V 480 A 84 27 0 0 0 ${cx + 84} 480 V 269`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <ellipse cx={cx} cy={269} rx={84} ry={27} fill="none" stroke={INK} strokeWidth={7} />
    </g>
  );
  const wall = (x: number) => (
    <line key={x} x1={x} y1={150} x2={x} y2={593} stroke={HAIR} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 19" />
  );
  return (
    <Ill label="Three separate data stores divided by walls, one of them highlighted">
      {cyl(165.5, CREAM)}
      {wall(332.5)}
      {cyl(499.5, A)}
      {wall(666.5)}
      {cyl(833.5, CREAM)}
    </Ill>
  );
}

/** A grid of records with two missing and two flagged. Cards 146x100, x step 152 from 123,
 *  y step 106 from 166. Five columns, four rows. */
function Quality() {
  // "" solid · "gap" dashed and empty · "flag" accent border with a dot
  const grid = [
    ["", "", "", "gap", ""],
    ["", "gap", "", "", ""],
    ["", "", "flag", "", ""],
    ["flag", "", "", "", ""],
  ];
  return (
    <Ill label="A grid of records with two missing and two flagged as suspect">
      {grid.flatMap((row, r) =>
        row.map((kind, c) => {
          const x = 123 + c * 152;
          const y = 166 + r * 106;
          if (kind === "gap") {
            return (
              <rect key={`${r}-${c}`} x={x + 3} y={y + 3} width={140} height={94} rx={9}
                fill="none" stroke={HAIR} strokeWidth={5} strokeDasharray="16 12" />
            );
          }
          const accent = kind === "flag";
          return (
            <g key={`${r}-${c}`}>
              <rect x={x + 4} y={y + 4} width={138} height={92} rx={11} fill={CREAM}
                stroke={accent ? A : INK} strokeWidth={7} />
              {accent
                ? <circle cx={x + 116} cy={y + 30} r={13} fill={A} />
                : <line x1={x + 22} y1={y + 56} x2={x + 108} y2={y + 56} stroke={HAIR} strokeWidth={6} strokeLinecap="round" />}
            </g>
          );
        })
      )}
    </Ill>
  );
}

/** The knowledge pyramid with its top missing. Base 608x163 at (196,451), middle 338x153 at
 *  (331,296), and a dashed apex holding a question mark. */
function Insights() {
  return (
    <Ill label="A pyramid of understanding whose top layer is missing and unknown">
      <path d="M 200 610 L 300 455 L 700 455 L 800 610 Z" fill={CREAM} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 335 445 L 410 300 L 590 300 L 665 445 Z" fill={CREAM_DEEP} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 425 288 L 500 143 L 575 288 Z" fill="none" stroke={A} strokeWidth={8} strokeLinejoin="round" strokeDasharray="18 14" />
      <text x={500} y={239} textAnchor="middle" fill={A} fontSize={70} fontFamily="var(--font-body), serif">?</text>
    </Ill>
  );
}

/** Time draining while the work queue waits. Hourglass 198x348 at (201,201), stacked cards
 *  338x210 at (636,246). */
function TimeCost() {
  return (
    <Ill label="An hourglass running down beside a stack of waiting datasets">
      <path d="M 215 205 L 385 205 L 300 375 Z" fill={CREAM} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 300 375 L 385 545 L 215 545 Z" fill={CREAM} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 300 420 L 360 545 L 240 545 Z" fill={A} />
      <line x1={206.5} y1={206.5} x2={392.5} y2={206.5} stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <line x1={206.5} y1={542.5} x2={392.5} y2={542.5} stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <rect x={641} y={251} width={200} height={180} rx={16} fill="var(--color-cream-100)" stroke={INK} strokeWidth={9} />
      <rect x={731} y={259} width={200} height={180} rx={16} fill={CREAM} stroke={INK} strokeWidth={9} />
      <rect x={821} y={271} width={148} height={180} rx={16} fill={CREAM_DEEP} stroke={INK} strokeWidth={9} />
      {[300, 336, 372].map((y) => (
        <line key={y} x1={663} y1={y} x2={763} y2={y} stroke={HAIR} strokeWidth={7} strokeLinecap="round" />
      ))}
    </Ill>
  );
}

/* ---- section 02, the impact ------------------------------------------------------------- */

/** Issues found across a field of records. Cards 140x116, x step 148 from 146, y step 124 from
 *  193, with a lens over the lower right. */
function DetectionRate() {
  const flagged = new Set(["0-1", "1-3", "2-0"]);
  return (
    <Ill label="A field of records with detected issues marked, under a magnifying lens">
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2, 3].map((c) => {
          const x = 146 + c * 148;
          const y = 193 + r * 124;
          const on = flagged.has(`${r}-${c}`);
          return (
            <g key={`${r}-${c}`}>
              <rect x={x + 4} y={y + 4} width={132} height={108} rx={11} fill={CREAM}
                stroke={on ? A : INK} strokeWidth={7} />
              {on && (
                <path d={`M ${x + 40} ${y + 58} l 20 22 l 40 -44`} fill="none" stroke={A}
                  strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          );
        })
      )}
      <circle cx={780} cy={470} r={90} fill={A} fillOpacity={0.08} stroke={A} strokeWidth={9} />
      <line x1={843} y1={533} x2={905} y2={603} stroke={A} strokeWidth={13} strokeLinecap="round" />
    </Ill>
  );
}

/** Quality climbing across four periods. Bars on a baseline at y 604, arrow 512x138 at (245,167). */
function QualityLift() {
  const bars: Array<[number, number, string]> = [
    [247, 483.5, CREAM],
    [397, 400.5, CREAM_DEEP],
    [547, 325.5, A_LIGHT],
    [697, 244.5, A],
  ];
  return (
    <Ill label="Four bars rising left to right with a trend arrow above them">
      {bars.map(([x, y, fill]) => (
        <rect key={x} x={x} y={y} width={96} height={600.5 - y} rx={12} fill={fill} stroke={INK} strokeWidth={7} />
      ))}
      <line x1={190.5} y1={599.5} x2={799.5} y2={599.5} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M 249 300 L 752 172" fill="none" stroke={A_DEEP} strokeWidth={9} strokeLinecap="round" />
      {/* ⚠ A REAL ARROWHEAD, BUILT ON THE LINE'S OWN BEARING. The first version traced the raster's
          tip literally and drew a "7" — two strokes that meet but do not read as an arrow, because
          they were not symmetric about the line. These barbs are 26 degrees either side of the
          -14.3 degree bearing at equal length, so the head points where the line actually goes.
          This is the one place the rebuild deliberately does NOT reproduce the original. */}
      <path d="M 701.1 161.4 L 752 172 L 712.3 205.6" fill="none" stroke={A_DEEP} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </Ill>
  );
}

/** The same job, before and after. Clock 128x128 at (86,111), long bar 568x84 at (251,296),
 *  short bar 258x84 at (251,436), arrow 62x88 at (629,391). */
function TimeSaved() {
  return (
    <Ill label="A long duration bar shortened to a much shorter one">
      <circle cx={150} cy={175} r={60} fill={CREAM} stroke={INK} strokeWidth={9} />
      <path d="M 150 133 V 177 L 186 194" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={256} y={301} width={558} height={74} rx={37} fill={CREAM} stroke={INK} strokeWidth={9} />
      <rect x={251} y={436} width={258} height={84} rx={42} fill={A} />
      <path d="M 660 395 V 470" fill="none" stroke={A_DEEP} strokeWidth={9} strokeLinecap="round" />
      <path d="M 634 447 L 660 477 L 686 447" fill="none" stroke={A_DEEP} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </Ill>
  );
}

/** Adoption across the organisation. 28 tiles 88x88, 7 columns, 4 rows, x and y step 98 from
 *  (162,190). The three strengths are the measured ramp, derived from one token. */
function Usage() {
  const shades = [
    [1, 2, 0, 2, 1, 2, 0],
    [2, 1, 2, 2, 0, 1, 2],
    [0, 2, 1, 2, 2, 1, 2],
    [1, 2, 0, 1, 2, 2, 1],
  ];
  const fill = [A_LIGHT, A, A_DEEP];
  return (
    <Ill label="A grid of twenty-eight teams, all adopting the tool">
      {shades.flatMap((row, r) =>
        row.map((s, c) => (
          <rect key={`${r}-${c}`} x={162 + c * 98 + 4} y={190 + r * 98 + 4} width={80} height={80} rx={16}
            fill={fill[s]} stroke={INK} strokeWidth={7} />
        ))
      )}
    </Ill>
  );
}

/** ⚠ THE REGISTRY IS THE ADDRESSABLE SURFACE, and an id that is not here renders nothing rather
 *  than throwing — a content file naming a missing illustration must not take the page down.
 *  `case-study-illustrations` asserts the content and this table agree, so the silent branch is
 *  a runtime safety net rather than the thing keeping them in step. */
export const ILLUSTRATIONS = {
  "fdp-silos": Silos,
  "fdp-quality": Quality,
  "fdp-insights": Insights,
  "fdp-time-cost": TimeCost,
  "fdp-detection-rate": DetectionRate,
  "fdp-quality-lift": QualityLift,
  "fdp-time-saved": TimeSaved,
  "fdp-usage": Usage,
} as const;

export type IllustrationId = keyof typeof ILLUSTRATIONS;

export function isIllustrationId(v: string): v is IllustrationId {
  return Object.prototype.hasOwnProperty.call(ILLUSTRATIONS, v);
}
