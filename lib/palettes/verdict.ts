/* ============================================================================================
   THE VERDICT — WHAT THE THIRTY ROWS SAY, IN THREE NUMBERS THAT EACH NAME THEIR SUBJECT.

   ⚠ THE PAGE USED TO RENDER THE ROWS AND CALL THAT THE INTERFACE. Thirty rows per palette is a
   gate's output pasted into a UI: it is complete, it is correct, and it asks a visitor to be the
   summariser. The rows still exist and they move behind a disclosure. What sits in front is the
   answer they add up to.

   ---- ⚠ THREE QUANTITIES ANSWER TO "TIGHTEST" AND A READER MEANS ONE OF THEM ------------------

   Measured on cream:

       tightest by RATIO          ground step cream-50 / cream-100   1.05
       tightest by MARGIN         the same row                      +0.00 over its 1.05 floor
       tightest TEXT pair         text-subtle on canvas              4.56 over a 4.5 floor

   The first two are the same row and it is a LADDER FLOOR — the design's own statement that two
   adjacent grounds must be separable, not a claim about anything being readable. Surfacing 1.05 as
   a headline would put the page's weakest-looking number in front of a reader who would take it for
   a legibility figure, and it is not one.

   ⚠ SO `tightestText` IS THE ONLY ONE PROMOTED, AND ITS NAME CARRIES ITS SUBJECT. This file
   deliberately exports no function called `tightest`. A number without its subject is an invitation
   to supply one, and this repo has now recorded that failure twenty times.

   ---- ⚠ AND THE THIRTY ARE NOT THE SAME THIRTY, WHICH A CROSS-PALETTE SUMMARY WOULD HIDE -------

   Light and dark palettes share 23 keys. Seven differ, because `usageFor` swaps the page ground:
   `text-primary on canvas` on a light palette is `text-primary on band-dark` on a dark one. Every
   figure here is therefore computed PER PALETTE and never pooled across the nine. "The same thirty
   pairs across all nine palettes" is a sentence this page must not say.
============================================================================================ */
import type { PaletteCompatibility } from "@/lib/palettes/compatibility";

/** The WCAG floor for body-size text. A row at or above this is a legibility claim; one below it
 *  is a non-text or ladder claim, and the two must not be summarised together. */
export const TEXT_FLOOR = 4.5;

export type PaletteVerdict = {
  /** Does it hold. Every row at or above its own floor. */
  holds: boolean;
  /** How many rows were checked on THIS palette — never a constant, see the header. */
  checked: number;
  /** Any row below its floor, so a failing palette names what failed rather than just failing. */
  failing: { key: string; got: number; min: number }[];
  /**
   * The tightest pair among rows governed by a TEXT floor — the number a reader means.
   * Null when a palette declares no text rows at all, which no palette does and which is
   * represented rather than assumed.
   */
  tightestText: { key: string; got: number; min: number } | null;
  /**
   * The worst case for body copy specifically. The longest-read text on the site, and the row a
   * visitor is really asking about when they ask whether a palette is comfortable.
   */
  bodyWorst: { key: string; got: number; min: number } | null;
};

/**
 * ⚠ ROWS ARE SELECTED BY THEIR FLOOR, NOT BY THEIR NAME. A label that names a CAUSE invites a
 * reader to assert the cause; the checkable claim is which floor governs. This repo has the
 * instance on record — `theme-contrast`'s 3.0 rows were called "non-text", and a gate written from
 * that label reported two non-violations, because 3.0 IS the WCAG floor for large type. The floor
 * is the property; "text" is the shorthand.
 */
const textRows = (p: PaletteCompatibility) => p.rows.filter((r) => r.min >= TEXT_FLOOR);

/**
 * ⚠ BODY COPY IS IDENTIFIED BY TOKEN, AND THE MATCH IS ANCHORED. A substring test for "body" also
 * catches nothing else today and would catch `text-body-strong` tomorrow — which is the fixed-list
 * shape wearing a regex. The row key is `<fg> on <ground>`, so the foreground is the segment before
 * the first space.
 */
const bodyRows = (p: PaletteCompatibility) =>
  p.rows.filter((r) => r.key.split(" ")[0] === "text-body");

const least = <T extends { got: number }>(rows: T[]): T | null =>
  rows.length ? rows.reduce((a, b) => (b.got < a.got ? b : a)) : null;

export function verdictFor(p: PaletteCompatibility): PaletteVerdict {
  const failing = p.rows.filter((r) => r.got < r.min)
    .map((r) => ({ key: r.key, got: r.got, min: r.min }));
  const pick = (r: { key: string; got: number; min: number } | null) =>
    r ? { key: r.key, got: r.got, min: r.min } : null;
  return {
    holds: failing.length === 0,
    checked: p.rows.length,
    failing,
    tightestText: pick(least(textRows(p))),
    bodyWorst: pick(least(bodyRows(p))),
  };
}

/**
 * The three headline figures as strings, formatted once.
 *
 * ⚠ THE RATIO FORMATTER IS `formats.ts`'s, IMPORTED RATHER THAN REPEATED. The panel, the copy block
 * and this verdict must show a stranger the same number, and `palette-formats` B1 asserts that as
 * an identity. A second `toFixed(2)` here would be a third spelling of one decision and the
 * assertion could not see it, because it compares the block against the report and this is neither.
 */
export { formatRatio } from "@/lib/palettes/formats";
