/* ============================================================================================
   THE HOMEPAGE TEASER'S FIVE — A CURATED SET, NOT A DERIVATION.

   ⚠ FIXED RATHER THAN DERIVED FROM THE PUBLISHED THEME, AND THE REJECTED ALTERNATIVE IS WHY.
   A derived set — published plus its counterpart plus one of each class — would always contain
   whatever is published, so a visitor's first press would always depart from the state they were
   already looking at. That reads like a fix and HIDES THE PROBLEM instead of solving it: the four
   would change under the owner without anyone deciding, and a visitor would never learn the site
   has nine. These five are a design decision, taken once, by a person.

   ---- ⚠ FIVE CLAIMS RATHER THAN FIVE COLOURS -------------------------------------------------

   The set is WARM LIGHT, COOL LIGHT, WARM DARK, COLOURED DARK, ACHROMATIC DARK. Each dot is a
   different thing the system is being asked to survive, not a different hue somebody liked.

   ⚠ THE ACHROMATIC CLAIM WAS ONCE MADE AND WAS FALSE, WHICH IS WHY IT IS ASSERTED NOW. The set was
   first described as "warm light, cool light, coloured dark, ACHROMATIC dark" while containing no
   achromatic member — ink-flare's ground carries chroma 0.014. The prose asserted a structure the
   data did not have. Basalt arriving makes that sentence true for the first time, and `A5` pins it
   to the member rather than to the adjective. Measured ground chroma, through the resolver the
   gates use:

     cream      light   chroma 0.022   hue  78.0
     harbour    light   chroma 0.018   hue 233.0
     ink-flare  dark    chroma 0.014   hue  44.3      warm, NOT achromatic
     nocturne   dark    chroma 0.023   hue 279.6      the coloured dark
     basalt     dark    chroma 0.000   hue   0.0      the achromatic dark

   ---- WHY EACH ONE, AND WHY BASALT IS AN ADDITION RATHER THAN A SWAP --------------------------

     cream      the published default and the site's origin — the reference the other three are
                read against, chroma 0.022 at hue 78.

     harbour    the cool light. Accent hue 123.3 degrees from cream's, against fern's 92, orchid's
                72 and cerise's 38, so the light pair spans the light range rather than sampling
                twice near one end.

     ink-flare  the warm dark, and cream's own counterpart in `THEME_COUNTERPART`. Its accent sits
                10 degrees from cream's — the nearest of all nine.

                ⚠ THIS IS THE SET'S STRONGEST DOT, AND THE ARGUMENT THAT ONCE KEPT BASALT OUT WAS
                AN ARGUMENT AGAINST A SWAP. Cream and ink-flare are a registry pair, so ONE PRESS
                SHOWS THE SAME IDENTITY ON A DIFFERENT GROUND — the same warm hue, the same
                structure, a near-black page. That is what a visitor learns in one click, and
                REPLACING this dot with basalt would have bought achromatic coverage and lost the
                demonstration.

                ⚠ ADDING A FIFTH COSTS NEITHER. The pair survives untouched and the set gains the
                one claim it could not make. The old reasoning is kept above rather than deleted,
                because it is still the right answer to the question it was asked — and a reversed
                decision whose reasoning is deleted leaves two contradictory rationales and no
                record of which won.

     nocturne   the coloured dark, chroma 0.023 — the most chromatic dark ground of all four darks.
                Set beside ink-flare's warm near-black it shows that a dark ground can carry hue.

     basalt     the achromatic dark, chroma 0.000 — the only palette on the site with no hue at all.
                It is the claim nocturne makes in reverse: that the ladder alone carries the
                structure, with nothing for hue to do. ⚠ AND IT IS THE ONE MEMBER WHOSE PRESENCE A
                READER WILL QUESTION, because the paragraph above spent two arcs arguing it out —
                against a SWAP, which this is not.

   ⚠ AND IT IS TWO LIGHT AND THREE DARK, NOT A SYMMETRY — worth saying because the set was two and
   two for an arc and reads as though it wants to be even. The claims are not paired: there are two
   ways a light ground varies here and three ways a dark one does. Making it symmetrical again would
   mean dropping a claim to satisfy a shape.

   ⚠ AND IT IS NOT A SET OF COUNTERPART PAIRS EITHER. Only cream and ink-flare are a registry pair.
   Harbour's counterpart is sapphire, nocturne's is orchid, basalt's is cream — none of those
   partners is here. Reading this as pairs would make the next person "fix" harbour to sapphire and
   lose the widest light swing.

   ---- ⚠ THE NAMES LIVE HERE AS STRINGS AND CANNOT BE IMPORTED FROM THE REGISTRY ---------------

   `ralph` loads this raw under `--experimental-strip-types`, so it cannot import `lib/theme.ts` in
   any spelling `tsc` also accepts — the same constraint `THEME_METRICS` and `SETTINGS_THEME_VALUES`
   sit under. So these are plain strings and `ralph/tests/palette-teaser.mjs` enforces that every one
   is a real, selectable palette and that the light and dark counts are two and two. Single source of
   truth by enforcement rather than by import, which is this repo's standing posture for exactly this.
============================================================================================ */

/** The five the homepage offers. Order is light, light, then the three darks by CLAIM — warm,
 *  coloured, achromatic — read left to right.
 *
 *  ⚠ NOT BY CHROMA, AND THIS COMMENT SAID SO FOR ONE DRAFT. "The three darks by ground chroma
 *  descending to zero" is false: the run is 0.014, 0.023, 0.000. The middle is the MOST chromatic
 *  ground on the site, so the sequence is not monotonic in either direction. Caught because the row
 *  written to assert it had to be given `false` as its expectation to pass — a row agreeing with
 *  broken prose rather than catching it. */
/* ⚠ THE COUNT SPELLED LOCALLY, AND IT IS A FORCED COPY RATHER THAN A PREFERENCE. `lib/theme.ts`
   exports `countWord` and importing it here is the obvious move — it was written, `tsc` accepted
   it, and `ralph` died on it: `Cannot find module .../lib/theme`. Node cannot resolve an
   extensionless `.ts` and `tsc` rejects the extension, which is the constraint this file's own
   header states four paragraphs up and which I read after breaking it.

   Third forced copy in this codebase, after `INSPECTOR_BOUNDS` and `COLLECTION_FILE_RE`. The
   posture is the one this file already names — single source of truth BY ENFORCEMENT rather than
   by import — so `palette-teaser` asserts this word against `countWord()` in the registry, and a
   drift between the two is a red row rather than a silent disagreement. */
const TEASER_COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve"] as const;

export const TEASER_THEMES = ["cream", "harbour", "ink-flare", "nocturne", "basalt"] as const;

export type TeaserTheme = (typeof TEASER_THEMES)[number];

/** How many swatches the row offers, spelled for the arrival note. */
export const TEASER_COUNT_WORD: string =
  TEASER_COUNT_WORDS[TEASER_THEMES.length] ?? String(TEASER_THEMES.length);

/**
 * Is the published theme one the teaser offers?
 *
 * ⚠ A LIVE STATE TODAY, NOT AN EDGE CASE. Nine palettes ship and five are here, so four publishable
 * themes are not — and `sapphire` has been the published theme this month. A visitor arriving on one
 * of the four sees a site the five dots cannot explain.
 */
export function publishedIsOffered(publishedTheme: string): boolean {
  return (TEASER_THEMES as readonly string[]).includes(publishedTheme);
}

/**
 * What the teaser says about the state the visitor ARRIVED in, before pressing anything.
 *
 * ⚠ THE ARRIVAL CASE IS A FEATURE OF THE FIXED SET RATHER THAN A COST OF IT. A visitor landing on
 * a palette this row does not contain should be TOLD that — that the site is on a published theme
 * outside the row, and that the full set is larger. That is the page's whole argument arriving
 * before they press anything, and an indicator that only appears after a press leaves this case
 * silently wrong.
 *
 * ⚠ AND THE COUNT IS DERIVED, BECAUSE THIS SENTENCE WAS ALREADY WRONG ONCE IN THE PARAGRAPH ABOVE
 * IT. That prose said "there are nine" and there are ten — stale from the moment `drawing-office`
 * shipped. The user-facing string said "these five" and happened to stay correct only because
 * `TEASER_THEMES` has not changed since it was typed. Same defect, one comment apart, and the
 * visible half was right by luck rather than by construction.
 *
 * The number now comes from `TEASER_THEMES.length`, so adding or removing a swatch moves the
 * sentence with it. The full-set figure is deliberately NOT restated here — the link beside this
 * note already says `All ten` from `selectableCountWord()`, and two derived counts in one breath is
 * a second place to drift.
 *
 * Returns null when the published theme IS offered, because then the dots explain themselves.
 */
export function arrivalNote(publishedTheme: string): string | null {
  if (publishedIsOffered(publishedTheme)) return null;
  return `Published: ${publishedTheme} — not one of these ${TEASER_COUNT_WORD}`;
}
