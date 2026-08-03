// How a title is sized and trimmed so an OG card cannot clip — the MEASURED half of lib/og.tsx.
//
// A PLAIN .ts LEAF ON PURPOSE. `lib/og.tsx` is .tsx and node's type-stripping cannot load it
// (the same constraint blog-empties.ts records for the blog registry), so anything ralph must
// DRIVE rather than regex has to live here. Same reason resolveHeroSrc sits in hero-fill.ts and
// the preview map sits in preview-map.ts.
//
// ------------------------------------------------------------------- THE NUMBERS ARE MEASURED
//
// Rendered with the exact SOURCE SERIF 4 600 TrueType file lib/og.tsx fetches from Google, loaded
// as a FontFace, replicating Satori's greedy word wrap at maxWidth 1000. NOT computed from an
// average character width, and NOT scaled from the Fraunces figures these replaced — a threshold
// this project estimated rather than measured has been wrong before by 190px.
//
// The 630px card has 80px padding, leaving 470px of content. Eyebrow ~29, footer ~36, and a 24
// gap between title and dek:
//
//     84px    3 lines  ->  +73px slack        4 lines  ->  -15px, OVERFLOWS
//     68px    4 lines  ->  +52px slack        5 lines  ->  -19px
//
// ⚠ THAT SLACK TABLE IS UNCHANGED BY THE FAMILY SWAP, AND THE REASON IS WORTH STATING SO NOBODY
// RE-MEASURES IT. It is line COUNT times size times line-height — pure geometry. A face changes
// how many CHARACTERS fit on a line, never how tall a line is. So the family swap moves the
// character thresholds below and leaves every vertical figure exactly where it was. Re-derived
// and confirmed identical rather than assumed.
//
// ⚠ AND THE TABLE ASSUMES A ONE-LINE DEK, WHICH THE ORIGINAL DERIVATION DID NOT SAY. Measured
// against the real content, the six subtitles wrap to 1, 1, 2, 2, 3 and 3 lines, and each extra
// dek line costs 43px. The combination that would overflow — a 3-line title beside a 3-line dek —
// does not exist in the content today, and every real card was rendered and checked. It is
// recorded because nothing prevents it: the dek is capped at 140 characters, and a 140-character
// dek is three lines.
//
// THE CHARACTER THRESHOLDS, RE-MEASURED AGAINST SOURCE SERIF 4:
//
//     84px   prose first needs a 4th line at  70 chars   (Fraunces: 71)
//     68px   prose first needs a 5th line at 113 chars   (Fraunces: 116)
//
// So the step-down at 60 carries 9 characters of headroom and the 100 cap carries 12. Both
// margins are narrower than Fraunces gave and both still hold, which is why the four constants
// below are UNCHANGED. A swap that moves a threshold's justification without moving the threshold
// is still a swap that has to be measured — the alternative is a number that was true about a
// font nobody uses any more.
//
// THE LONGEST REAL TITLE IS 53 CHARACTERS and renders 3 lines at 84px, one line from the edge,
// which is why these are constants with a derivation rather than a comment claiming it fits.

export const TITLE_SIZE_PX = 84;
/** Above this many characters the title steps down a size. Measured, see above. */
export const TITLE_STEP_DOWN_CHARS = 60;
export const TITLE_SMALL_SIZE_PX = 68;
/**
 * The backstop, and it should never fire. At 68px prose holds 4 lines to 112 characters and
 * first needs a 5th at 113, so a 100 cap can never overflow, with 12 characters spare.
 *
 * WHAT IT COSTS WHEN IT DOES FIRE, recorded because the cut is not neutral: the ellipsis takes
 * the END, so a headline whose payoff is its last clause loses exactly the part that earned the
 * click. That is the argument for the step-down existing at all — it pushes truncation out past
 * roughly fifteen words, further than any headline this blog is likely to write.
 */
export const TITLE_MAX_CHARS = 100;

/* THE EYEBROW IS UNCAPPED, DELIBERATELY, AND HERE IS THE NUMBER SO THAT IS A DECISION.
 *
 * `topic` is free text — there is no schema-side set — so nothing constrains its length.
 * Measured the same way, and RE-MEASURED against Source Serif 4: the eyebrow row is a 48px rule
 * plus a 16px gap inside 1040px of content, leaving 976px, and an uppercase letterspaced eyebrow
 * overflows at 53 characters (Fraunces: 51 — the one figure the swap improved). The three real
 * topics are 13-14 characters and measure 232-259px, so the longest carries 39 characters of
 * headroom.
 *
 * NO CONSTANT FOR IT, because there would be nothing to compare against: a cap here would be a
 * guard that cannot fire, and an exported threshold with zero consumers is a shape this repo
 * has already had to delete once. The number belongs in the record, not in the code.
 */

/**
 * Truncate to at most `max` characters INCLUDING the ellipsis, ending on a word boundary.
 *
 * THE WORD BOUNDARY CAME FROM LOOKING AT A RENDER, not from reasoning. A raw slice produced
 * "…to draw the s…", a cut mid-word that reads as a rendering fault rather than an elision.
 * A title with no space in the span has no boundary to find, so the raw cut still stands.
 */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** The rendered title and its size, applied in that order — the cap first, so the step-down
 *  reads the string that will actually be drawn rather than the one that was passed in. */
export function fitTitle(title: string): { text: string; sizePx: number } {
  const text = truncateAtWord(title, TITLE_MAX_CHARS);
  return {
    text,
    sizePx: text.length > TITLE_STEP_DOWN_CHARS ? TITLE_SMALL_SIZE_PX : TITLE_SIZE_PX,
  };
}
