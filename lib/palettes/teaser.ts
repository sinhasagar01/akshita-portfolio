/* ============================================================================================
   THE HOMEPAGE TEASER'S FOUR — A CURATED SET, NOT A DERIVATION.

   ⚠ FIXED RATHER THAN DERIVED FROM THE PUBLISHED THEME, AND THE REJECTED ALTERNATIVE IS WHY.
   A derived set — published plus its counterpart plus one of each class — would always contain
   whatever is published, so a visitor's first press would always depart from the state they were
   already looking at. That reads like a fix and HIDES THE PROBLEM instead of solving it: the four
   would change under the owner without anyone deciding, and a visitor would never learn the site
   has nine. These four are a design decision, taken once, by a person.

   ---- WHY EACH ONE, MEASURED -----------------------------------------------------------------

     cream      the published default and the site's origin. Every other palette is a departure
                from it, so it is the reference the other three are read against.

     harbour    the furthest LIGHT palette from cream — accent hue 123.3 degrees away, against
                fern's 92, orchid's 72 and cerise's 38. The light pair therefore spans the light
                range rather than sampling twice near one end.

     ink-flare  cream's own counterpart in `THEME_COUNTERPART`, and the nearest accent of all nine
                at 10 degrees. It is the cheapest way to make the page's claim legible: the same
                warm identity, the same structure, on a dark ground.

     nocturne   the most chromatic dark ground of the four darks (0.023, against sapphire's 0.016,
                ink-flare's 0.014 and basalt's 0.000). Set beside ink-flare's warm near-black, the
                dark pair spans "dark that keeps its hue" against "dark that nearly does not".

   ⚠ AND IT IS TWO LIGHT AND TWO DARK, NOT TWO COUNTERPART PAIRS — worth saying because it looks
   like the latter. Only cream and ink-flare are a registry pair. Harbour's counterpart is sapphire
   and nocturne's is orchid, and neither is here. Reading this as a pair-of-pairs would make the
   next person "fix" harbour to sapphire and lose the widest light swing.

   ---- ⚠ THE NAMES LIVE HERE AS STRINGS AND CANNOT BE IMPORTED FROM THE REGISTRY ---------------

   `ralph` loads this raw under `--experimental-strip-types`, so it cannot import `lib/theme.ts` in
   any spelling `tsc` also accepts — the same constraint `THEME_METRICS` and `SETTINGS_THEME_VALUES`
   sit under. So these are plain strings and `ralph/tests/palette-teaser.mjs` enforces that every one
   is a real, selectable palette and that the light and dark counts are two and two. Single source of
   truth by enforcement rather than by import, which is this repo's standing posture for exactly this.
============================================================================================ */

/** The four the homepage offers. Order is light, light, dark, dark — read left to right. */
export const TEASER_THEMES = ["cream", "harbour", "ink-flare", "nocturne"] as const;

export type TeaserTheme = (typeof TEASER_THEMES)[number];

/**
 * Is the published theme one the teaser offers?
 *
 * ⚠ A LIVE STATE TODAY, NOT AN EDGE CASE. Nine palettes ship and four are here, so five publishable
 * themes are not — and `ink-flare` and `sapphire` have both been the published theme this month. A
 * visitor arriving on one of the five sees a site the four dots cannot explain.
 */
export function publishedIsOffered(publishedTheme: string): boolean {
  return (TEASER_THEMES as readonly string[]).includes(publishedTheme);
}

/**
 * What the teaser says about the state the visitor ARRIVED in, before pressing anything.
 *
 * ⚠ THE ARRIVAL CASE IS A FEATURE OF THE FIXED SET RATHER THAN A COST OF IT. A visitor landing on
 * a palette the four do not contain should be TOLD that — that the site is on a published theme
 * outside this row, and that there are nine. That is the page's whole argument arriving before they
 * press anything, and an indicator that only appears after a press leaves this case silently wrong.
 *
 * Returns null when the published theme IS offered, because then the dots explain themselves.
 */
export function arrivalNote(publishedTheme: string): string | null {
  if (publishedIsOffered(publishedTheme)) return null;
  return `Published: ${publishedTheme} — not one of these four`;
}
