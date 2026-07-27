// How a title is sized and trimmed so an OG card cannot clip — the MEASURED half of lib/og.tsx.
//
// A PLAIN .ts LEAF ON PURPOSE. `lib/og.tsx` is .tsx and node's type-stripping cannot load it
// (the same constraint blog-empties.ts records for the blog registry), so anything ralph must
// DRIVE rather than regex has to live here. Same reason resolveHeroSrc sits in hero-fill.ts and
// the preview map sits in preview-map.ts.
//
// ------------------------------------------------------------------- THE NUMBERS ARE MEASURED
//
// Rendered with the exact Fraunces 600 TrueType file lib/og.tsx fetches from Google, loaded as
// a FontFace, replicating Satori's greedy word wrap at maxWidth 1000. NOT computed from an
// average character width — a threshold this project estimated rather than measured has been
// wrong before by 190px.
//
// The 630px card has 80px padding, leaving 470px of content. Eyebrow ~29, footer ~36, and a 24
// gap between title and dek:
//
//     84px    3 lines  ->  +73px slack        4 lines  ->  -15px, OVERFLOWS
//     68px    4 lines  ->  +52px slack        5 lines  ->  -19px
//
// THE LONGEST REAL TITLE IS ALREADY THREE LINES. "What a design system is for when the machine
// can draw" (53 chars) renders one line from the edge, which is why these are constants with a
// derivation rather than a comment claiming it fits.
//
// Prose first needs a 4th line at 84px at 71 characters, so 60 carries 11 characters of
// headroom; a long-word title was already 3 lines by 50 characters, so 60 is conservative
// there too. All three current posts are <=53 and stay at 84px, so no existing card changed.

export const TITLE_SIZE_PX = 84;
/** Above this many characters the title steps down a size. Measured, see above. */
export const TITLE_STEP_DOWN_CHARS = 60;
export const TITLE_SMALL_SIZE_PX = 68;
/**
 * The backstop, and it should never fire. At 68px prose holds 4 lines to 109 characters and
 * first needs a 5th at 116, so a 100 cap can never overflow, with 9 characters spare.
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
 * Measured the same way: the eyebrow row is a 48px rule plus a 16px gap inside 1040px of
 * content, leaving 976px, and an uppercase letterspaced eyebrow overflows at 51 characters.
 * The three real topics are 13-14 characters (243-272px), so the longest carries 36 characters
 * of headroom.
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
