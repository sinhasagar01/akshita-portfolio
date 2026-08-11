// The homepage palette teaser — one mechanism, a curated four, and an arrival state that is live.
// Run: node --experimental-strip-types ralph/tests/palette-teaser.mjs
//
// ---- ⚠ WHAT THIS IS FOR, WHICH DECIDED THE ROWS ----------------------------------------------
//
// The teaser is `Try across portfolio` arriving from a different door. The risk is NOT that a dot
// paints the wrong colour — the swatches come from `paletteCompatibility()`, which `palette-formats`
// already pins. The risk is a SECOND MECHANISM: a private cookie name, a private encoder, a private
// exit. Two mechanisms for one state is how an exit action stops working — the second writer sets
// something the exit does not clear and the visitor is stranded on a palette with a dead button.
//
// So section B asserts the single mechanism, and section C asserts the arrival state, which is the
// one path a class-string gate cannot see: five of nine publishable themes are not in the four, and
// two of them have been the published theme this month.
import { TEASER_THEMES, publishedIsOffered, arrivalNote } from "../../lib/palettes/teaser.ts";
import { THEME_NAMES, VERIFY_THEME, THEME_GROUND, selectableThemes } from "../../lib/theme.ts";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const css = read("app/globals.css");
const component = read("components/palettes/HomePaletteTeaser.tsx");
const page = read("app/(portfolio)/page.tsx");

console.log("\nA · the four are real, and they are a curated pair of pairs");
/* ⚠ THE NAMES LIVE IN `lib/palettes/teaser.ts` AS STRINGS, because ralph loads that file raw and it
 * cannot import the registry in any spelling `tsc` also accepts — the constraint `THEME_METRICS` and
 * `SETTINGS_THEME_VALUES` already sit under. These rows are what makes the registry the single
 * source of truth by ENFORCEMENT rather than by import. */
t("A0 there are four — a curated set, and the count is the design rather than an accident",
  TEASER_THEMES.length, 4);
t("A1 ⚠ EVERY ONE IS A REAL PALETTE — a typo would render a dot with no colours and no error",
  TEASER_THEMES.filter((n) => !THEME_NAMES.includes(n)), []);
t("A2 …and every one is SELECTABLE, so the teaser can never offer a control the sanitizer refuses",
  TEASER_THEMES.filter((n) => !selectableThemes().includes(n)), []);
t("A2a ⚠ AND THE VERIFICATION TWIN IS NOT AMONG THEM — it is a control and is never shown",
  TEASER_THEMES.includes(VERIFY_THEME), false);
t("A3 no palette appears twice, which would silently make it three dots",
  new Set(TEASER_THEMES).size, TEASER_THEMES.length);
/* ⚠ TWO AND TWO IS THE DESIGN, NOT AN OBSERVATION. The teaser's claim is that the structure holds
 * across a change of GROUND, and it cannot make that claim from three lights and one dark. */
t("A4 ⚠ EXACTLY TWO LIGHT AND TWO DARK — the claim is about a change of ground, so the set must span one",
  [TEASER_THEMES.filter((n) => THEME_GROUND[n] === "light").length,
   TEASER_THEMES.filter((n) => THEME_GROUND[n] === "dark").length], [2, 2]);

console.log("\nB · ONE mechanism — the dots are a door onto the preview, not a second one");
t("B0 the component was found and has code — a zero here makes every row below vacuous",
  component.length > 800, true);
t("B1 ⚠ IT IMPORTS THE SHARED COOKIE MODULE rather than naming a cookie of its own",
  /import\s*\{[^}]*\}\s*from\s*"@\/lib\/palettes\/preview-cookie"/.test(component), true);
t("B1a …and takes the NAME, the MAX AGE and the ENCODER from it, so none of the three can drift",
  ["PREVIEW_COOKIE", "PREVIEW_MAX_AGE_SECONDS", "encodePreview"].filter((n) => {
    const m = /import\s*\{([^}]*)\}\s*from\s*"@\/lib\/palettes\/preview-cookie"/.exec(component);
    return !m || !m[1].includes(n);
  }), []);
/* ⚠ THE LITERAL IS THE TELL. A second mechanism does not announce itself; it appears as a cookie
 * name typed inline, which reads as harmless and is the whole defect. */
/* ⚠ THE MATCHER OPENS A QUOTE AND DOES NOT REQUIRE ONE TO CLOSE, AND THE CLOSING FORM WAS TOO
 * NARROW FOR ITS OWN CONCEPT. It read `["\'`]palette-preview["\'`]` — a bare quoted name — and the
 * REALISTIC second mechanism is the name opening a template literal, `` `palette-preview=${...}` ``,
 * where what follows is `=` rather than a quote. The mutation that types a cookie name inline
 * sailed past it. Sixth instance of a gate's vocabulary being narrower than the idea it names.
 *
 * ⚠ AND THE LOOKAHEAD IS LOAD-BEARING: `palette-preview-changed` is the EVENT this component
 * legitimately dispatches, and without excluding it the row would fail on correct code. */
t("B2 ⚠ AND IT NEVER SPELLS A COOKIE NAME ITSELF — a typed literal here IS the second mechanism",
  /["'`]palette-preview(?!-changed)/.test(component), false);
t("B3 …nor computes its own deadline, which would expire on a different schedule from the head script",
  /Date\.now\(\)\s*\+/.test(component), false);
t("B4 ⚠ AND IT DEFINES NO EXIT OF ITS OWN — the one indicator in the portfolio layout owns that",
  /Max-Age=0/.test(component), false);

console.log("\nC · the arrival state, which is LIVE rather than an edge case");
const OFFERED = TEASER_THEMES[0];
const NOT_OFFERED = THEME_NAMES.filter((n) => n !== VERIFY_THEME && !TEASER_THEMES.includes(n));
t("C0 ⚠ THE ARRIVAL CASE IS REACHABLE — publishable palettes exist that the four do not contain",
  NOT_OFFERED.length >= 1, true);
console.log(`         ${NOT_OFFERED.length} publishable palettes are NOT offered: ${NOT_OFFERED.join(", ")}`);
t("C1 a published theme the teaser offers needs no note — the dots explain themselves",
  arrivalNote(OFFERED), null);
t("C2 ⚠ AND ONE IT DOES NOT OFFER GETS A NOTE THAT NAMES IT, before anything is pressed",
  NOT_OFFERED.filter((n) => !(arrivalNote(n) ?? "").includes(n)), []);
t("C2a …and the note says the published theme is not among them, rather than merely naming it",
  NOT_OFFERED.filter((n) => !/not one of these/.test(arrivalNote(n) ?? "")), []);
t("C3 `publishedIsOffered` agrees with the note, so the two cannot disagree about the same state",
  THEME_NAMES.filter((n) => publishedIsOffered(n) !== (arrivalNote(n) === null)), []);
t("C4 ⚠ AND THE PAGE PASSES THE PUBLISHED THEME IN — a note computed from a default would always be null",
  /publishedTheme=\{settings\?\.theme/.test(page), true);

console.log("\nD · the breakpoint is the site's own, and the containment boundary is not a threshold");
/* ⚠ `container-type: inline-size` ON `.hero-ground` IS A CONTAINMENT BOUNDARY, NOT A THRESHOLD.
 * Inside it nothing can query the viewport; outside it nothing can query the hero. The teaser's
 * controls are `position: fixed`, so they live outside that containment entirely and could not read
 * a container query on the hero even if one existed. The hero's own reflow WAS a container query at
 * 942 and was retired to the site's 1023 media query. These are different boxes, and a tidying pass
 * that "unified" them would be unifying two coordinate systems. */
/* ⚠ COMMENTS STRIPPED BEFORE ANY MATCH, AND D2 FAILED ON ITS OWN EXPLANATION WITHOUT IT. The block's
 * comment states that there are ZERO `@container` rules in this file — so a search for `@container`
 * found the sentence saying there are none. Explaining-it-requires-writing-it, in the suite written
 * to check the thing being explained. `palette-compat` strips for the same reason. */
/* ⚠ AND THE SLICE STARTS AFTER THE HEADER COMMENT CLOSES, NOT AT THE MARKER — because the marker is
 * INSIDE that comment. Slicing from it left the block with a comment BODY and no opening delimiter,
 * so the stripper could not match it and the prose survived: D2 went on reporting a container query
 * that was only ever the sentence saying there are none. Two delimiter mistakes in one row, and the
 * second was created by the fix for the first. */
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, " ");
const teaserStart = css.indexOf("*/", css.indexOf("THE HOMEPAGE PALETTE TEASER")) + 2;
const teaserCss = stripComments(css.slice(teaserStart, css.indexOf(".site-header {")));
t("D0 the teaser's CSS block was found — a zero here makes D1 and D2 vacuous", teaserCss.length > 500, true);
t("D1 ⚠ IT USES THE SITE'S ONE BREAKPOINT, max-width 1023", /@media \(max-width: 1023px\)/.test(teaserCss), true);
t("D2 ⚠ AND NO CONTAINER QUERY — the controls are fixed and sit outside the hero's containment",
  /@container/.test(teaserCss), false);
t("D3 the rail is narrower than the hero copy's right gutter, which is what clears the tab strip AT ANY HEIGHT",
  /padding: 11px 4px/.test(teaserCss), true);

console.log("\nE · reduced motion removes the FADE and never the CONTROL");
/* ⚠ THE REDUCED-MOTION BLOCK IS BRACE-MATCHED, NOT REACHED WITH A SLACK QUANTIFIER, AND THE SLACK
 * VERSION WAS WRONG IN A WAY THAT LOOKED RIGHT. `[\s\S]{0,200}?` from the at-rule ran straight past
 * its own closing brace into the `max-width: 1023` block — where `.palette-pill { display: none }`
 * is CORRECT, because the pill is replaced by the rail there. E2 therefore reported the pill hidden
 * under reduced motion when nothing of the sort was written. A matcher that must not cross a
 * delimiter cannot be written with a pattern that does not count; this repo has six of these. */
const blockBody = (src, marker) => {
  const at = src.indexOf(marker);
  if (at < 0) return "";
  const open = src.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open + 1, i);
  }
  return "";
};
const reducedMotion = blockBody(teaserCss, "@media (prefers-reduced-motion: reduce)");
t("E0 the reduced-motion block was found — an empty one would make E1 and E2 both vacuous",
  reducedMotion.trim().length > 20, true);
t("E1 ⚠ THE PILL'S TRANSITION IS REMOVED UNDER REDUCED MOTION",
  /\.palette-pill\s*\{[^}]*transition:\s*none/.test(reducedMotion), true);
t("E2 ⚠ AND ITS PRESENCE IS NOT — nothing there hides it, which would take the control from the people most likely to want it",
  /(display:\s*none|opacity:\s*0)/.test(reducedMotion), false);
t("E3 the reveal is an IntersectionObserver on the hero, not a scroll handler writing style per event",
  /new IntersectionObserver/.test(component) && !/addEventListener\(\s*["']scroll["']/.test(component), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
