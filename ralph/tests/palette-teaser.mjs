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
// So section B asserts the single mechanism. The ARRIVAL state — five of nine publishable themes are
// not in the four — is `palette-arrival`'s subject, because the strip that states it is site-wide and
// this teaser is not.
import { TEASER_THEMES, publishedIsOffered, arrivalNote, TEASER_COUNT_WORD } from "../../lib/palettes/teaser.ts";
import { THEME_NAMES, VERIFY_THEME, THEME_GROUND, selectableThemes, countWord } from "../../lib/theme.ts";
import { readPaletteSource, layerPalette, oklchOf } from "../../lib/theme-contrast.ts";
import { DEFAULT_THEME, THEME_COUNTERPART, GROUND_TOKEN } from "../../lib/theme.ts";
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

console.log("\nA · the five are real, and each is a distinct claim");
/* ⚠ THE NAMES LIVE IN `lib/palettes/teaser.ts` AS STRINGS, because ralph loads that file raw and it
 * cannot import the registry in any spelling `tsc` also accepts — the constraint `THEME_METRICS` and
 * `SETTINGS_THEME_VALUES` already sit under. These rows are what makes the registry the single
 * source of truth by ENFORCEMENT rather than by import. */
t("A0 there are five — a curated set, and the count is the design rather than an accident",
  TEASER_THEMES.length, 5);
t("A1 ⚠ EVERY ONE IS A REAL PALETTE — a typo would render a dot with no colours and no error",
  TEASER_THEMES.filter((n) => !THEME_NAMES.includes(n)), []);
t("A2 …and every one is SELECTABLE, so the teaser can never offer a control the sanitizer refuses",
  TEASER_THEMES.filter((n) => !selectableThemes().includes(n)), []);
t("A2a ⚠ AND THE VERIFICATION TWIN IS NOT AMONG THEM — it is a control and is never shown",
  TEASER_THEMES.includes(VERIFY_THEME), false);
t("A3 no palette appears twice, which would silently make it three dots",
  new Set(TEASER_THEMES).size, TEASER_THEMES.length);
/* ⚠ TWO AND THREE, AND THE ASYMMETRY IS THE DESIGN RATHER THAN A DRIFT. The set was two and two for
 * an arc and the row asserted that. Basalt arriving makes it two and three, and the temptation is to
 * read the old shape as the rule and "restore" it — which would mean dropping a claim to satisfy a
 * symmetry. The claims are not paired: there are TWO ways a light ground varies here and THREE ways
 * a dark one does. What the row actually protects is unchanged — the set must span a change of
 * ground, so neither side may be empty. */
t("A4 ⚠ EXACTLY TWO LIGHT AND THREE DARK — the claim is about a change of ground, so the set must span one",
  [TEASER_THEMES.filter((n) => THEME_GROUND[n] === "light").length,
   TEASER_THEMES.filter((n) => THEME_GROUND[n] === "dark").length], [2, 3]);

/* ⚠ THE COMMENT BESIDE THE CONSTANT MAKES NUMERIC CLAIMS, SO THE NUMBERS ARE ASSERTED. It was first
 * written as "warm light, cool light, coloured dark, ACHROMATIC dark" and the measurement refuted it
 * — ink-flare's ground carries chroma 0.014 and the only achromatic palette is photostat at 0.000,
 * which is not in the set. A reasoning that does not survive its own numbers is worse than none, and
 * prose is the one thing no gate reads. These rows are what stop it drifting back. */
const SRC = readPaletteSource(css);
const groundChroma = (n) => oklchOf(
  layerPalette(SRC, n, { defaultTheme: DEFAULT_THEME, groundClass: THEME_GROUND[n] })[
    GROUND_TOKEN[THEME_GROUND[n]]
  ]
).C;
const darkMembers = TEASER_THEMES.filter((n) => THEME_GROUND[n] === "dark");
console.log(`         ground chroma: ${TEASER_THEMES.map((n) => `${n} ${groundChroma(n).toFixed(3)}`).join(", ")}`);
/* ⚠ THIS ROW ASSERTED THE OPPOSITE FOR AN ARC, AND IT WAS CORRECT THEN. It read "NO MEMBER IS
 * ACHROMATIC", because the set's prose had once claimed an achromatic dark it did not contain and
 * the row existed to stop that sentence drifting back in. The set now HAS one, deliberately, so the
 * row follows the claim instead of the old membership.
 *
 * ⚠ AND IT NAMES THE MEMBER RATHER THAN COUNTING. "Exactly one achromatic" would pass if photostat were
 * swapped for some future neutral palette while the prose above went on naming photostat — the
 * prose-and-data gap this file's own header was written about. */
/* ⚠ TWO NOW, NOT ONE, AND THEY ARE EXACTLY THE COUNTERPART PAIR. `harbour` retired and
   `drawing-office` took its slot, which is achromatic by design. So the set carries a neutral
   pair — one light, one dark, registry partners — and three hued members around them. That is a
   sharper claim than "exactly one", and the row states the PAIR rather than a count so a third
   neutral arriving still fails. */
/* ⚠ THREE NOW, NOT A PAIR, AND redline IS THE THIRD. Its ground carries c 0.003 — a faint warm
   grey that reads as neutral to this row's 0.005 threshold. So the set is three near-neutral
   media and two hued darks, which is what a sheet-set direction looks like once its chromatic
   palettes retire. The row states the MEMBERS rather than a count, so a fourth still fails. */
t("A5 ⚠ THE ACHROMATIC MEMBERS ARE EXACTLY THE THREE SHEET MEDIA — a fourth neutral is drift and fails here",
  TEASER_THEMES.filter((n) => groundChroma(n) < 0.005).sort(), ["drawing-office", "photostat", "redline"]);
/* The complement, because "one is achromatic" says nothing about the other four still carrying hue —
 * and a set drifting neutral is exactly what the original row was guarding. */
t("A5a …and every OTHER member carries hue, so the set cannot drift neutral without failing",
  TEASER_THEMES.filter((n) => !["photostat", "drawing-office", "redline"].includes(n)).filter((n) => groundChroma(n) < 0.005), []);
/* ⚠ A ROW TESTING `groundChroma === 0` WAS WRITTEN HERE AND DELETED, AND THE REASON IS MEASURED.
 * Basalt's ground chroma is 6.28e-9, not zero — the declaration is `oklch(... 0 ...)` and the
 * round-trip through sRGB leaves a residue — so the row could not fire even on the ONE palette it
 * existed to catch. And everything it would have caught is already inside A5's `< 0.005`. Implied
 * AND unfalsifiable, which is two reasons to delete rather than one. Found by mutating: swapping
 * photostat in killed A5 and A7 and left it green. */
/* ⚠ THREE DARKS NOW, AND THE ORDER IS BY CLAIM RATHER THAN BY A NUMBER. The first draft of the
 * comment beside the constant said "by ground chroma descending to zero" and the run is
 * 0.014, 0.023, 0.000 — the middle is the MOST chromatic ground on the site, so it is not monotonic
 * in either direction.
 *
 * ⚠ IT WAS CAUGHT BY THE ROW REFUSING TO PASS HONESTLY. Written to assert the descent, it had to be
 * given `false` as its expectation to go green — an assertion agreeing with broken prose instead of
 * catching it, which is the `count:`-field defect arriving inside a row I had just written. The
 * prose is fixed and the rows now assert what is true. */
t("A6 ⚠ THE DARKS RUN warm, coloured, ACHROMATIC — the comment claims an order, so the order is asserted",
  darkMembers, ["ink-flare", "nocturne", "photostat"]);
t("A6a …and the WARM dark really is less chromatic than the COLOURED one, so the first two names are earned",
  groundChroma(darkMembers[0]) < groundChroma(darkMembers[1]), true);
/* ⚠ THE ROW THAT PINS WHY INK-FLARE IS HERE RATHER THAN BASALT. Cream and ink-flare are registry
 * counterparts, so one press shows the SAME IDENTITY ON A DIFFERENT GROUND. Swapping in photostat would
 * buy achromatic coverage and lose the demonstration — this fails if anyone does. */
/* ⚠ THE CLAIM STRENGTHENED WHEN `harbour` RETIRED, AND THE ROW SAYS SO RATHER THAN KEEPING ITS OLD
   LITERAL. It asserted ONE pair, cream and ink-flare. With drawing-office in harbour's place EVERY
   member's counterpart is also in the set, so any dot press shows that identity on the other ground
   rather than only two of them doing it. A literal left at the old pair goes red on an improvement. */
/* ⚠ THE RE-DERIVED CLAIMS ARE PINNED, BECAUSE THE PASS THAT PRODUCED THEM EXISTED ONLY BECAUSE THE
   PREVIOUS ONES WERE NOT. The rationale beside the constant stated five claims about a palette set
   that had since been replaced, and two of the five were false — "warm light" and "cool light"
   described a GROUND HUE neither light member carries any more. Nothing read that prose, which is
   why it survived a rename and two palette swaps.

   ⚠ THESE ROWS DO NOT ASSERT THE ADJECTIVES. A gate cannot decide whether a ground reads as warm;
   what it can do is hold the NUMERIC claims the prose rests on, so the next member that breaks one
   turns a row red instead of quietly making a sentence wrong. */
const accentChroma = (n) => oklchOf(
  layerPalette(SRC, n, { defaultTheme: DEFAULT_THEME, groundClass: THEME_GROUND[n] })["accent-500"]
).C;
console.log(`         accent chroma: ${TEASER_THEMES.map((n) => `${n} ${accentChroma(n).toFixed(3)}`).join(", ")}`);

/* ⚠ THE AXIS CLAIM. The rationale says the two lights differ by their ACCENT and not by their
   ground, which is only true while their grounds sit together. A literal would go red on a retune
   that changed nothing about the argument, so the row states the RELATION. */
const lightMembers = TEASER_THEMES.filter((n) => THEME_GROUND[n] === "light");
t("A8 ⚠ BOTH LIGHTS SHARE A NEUTRAL GROUND — the rationale's axis claim, and it is what makes the accent the differentiator",
  lightMembers.length === 2
    && Math.abs(groundChroma(lightMembers[0]) - groundChroma(lightMembers[1])) < 0.005, true);
/* The complement, and it is the half that carries the claim: sharing a ground is only interesting
   because the accents do NOT share one. Without this, two identical palettes would pass A8. */
t("A8a …and their ACCENTS do not, which is the whole of the signal-only claim",
  Math.abs(accentChroma(lightMembers[0]) - accentChroma(lightMembers[1])) > 0.10, true);
/* ⚠ SCOPED TO THE SET, AND THE SCOPING IS THE ROW. This line read "the most chromatic dark ground
   of all four darks" and then "on the site" — false since blueprint shipped at 0.063, which is not
   a member. A superlative has to name its population, and a row is how that stops being prose. */
t("A9 ⚠ nocturne CARRIES THE MOST CHROMATIC GROUND IN THIS SET — scoped to the five, because the site's is blueprint's 0.063",
  TEASER_THEMES.slice().sort((a, b) => groundChroma(b) - groundChroma(a))[0], "nocturne");
t("A9a …and the site's most chromatic ground is NOT a member, so the scoping is load-bearing rather than pedantic",
  TEASER_THEMES.includes(
    selectableThemes().slice().sort((a, b) => groundChroma(b) - groundChroma(a))[0]), false);
/* ⚠ THE RECIPROCITY STRUCTURE, WHICH A7's COUNT CANNOT SEE. Four of five pairing inside the set is
   true of "everyone points at a member" AND of "two point at each other and two point one way", and
   the rationale claims the second. Stating the reciprocated pair by name is what separates them. */
/* ⚠ THIS ROW WENT RED ON ITS FIRST RUN AND THE PROSE WAS THE THING THAT WAS WRONG, WHICH IS THE
   whole argument for adding it. The rationale said redline "points out and is not pointed back".
   Measured: `redline` and `machine-room` point at EACH OTHER — the pair is mutual and one half of
   it simply is not a member. Three of the five are reciprocated, not two, and only one mutual pair
   lies wholly inside the set. Two claims that a count cannot tell apart, separated by two rows. */
t("A10 ⚠ THREE MEMBERS SIT IN A MUTUAL PAIR — being pointed back at is not the same as your partner being here",
  TEASER_THEMES.filter((n) => THEME_COUNTERPART[THEME_COUNTERPART[n]] === n).sort(),
  ["drawing-office", "photostat", "redline"]);
t("A10a …and exactly ONE mutual pair lies wholly inside the set, which is the claim the rationale actually makes",
  TEASER_THEMES.filter((n) => THEME_COUNTERPART[THEME_COUNTERPART[n]] === n
    && TEASER_THEMES.includes(THEME_COUNTERPART[n])).sort(),
  ["drawing-office", "photostat"]);

/* ⚠ THE TITLE NAMED THE WRONG PARTNER AND THE ROW WAS PASSING FOR THE RIGHT REASON. It read
   "redline's partner is sapphire". Measured: `THEME_COUNTERPART.redline` is `machine-room`, and
   sapphire's partner is redline rather than the other way round. The ASSERTION is derived from the
   registry so it never noticed — a title stating a fact its own row does not compute is the
   prose-and-data gap this suite's own header exists for, sitting inside the suite. */
t("A7 ⚠ FOUR OF THE FIVE PAIR INSIDE THE SET — redline's partner is machine-room, which the teaser does not carry",
  TEASER_THEMES.filter((n) => TEASER_THEMES.includes(THEME_COUNTERPART[n])).sort(),
  ["drawing-office", "ink-flare", "nocturne", "photostat"]);

console.log("\nB · ONE mechanism — the dots are a door onto the preview, not a second one");
t("B0 the component was found and has code — a zero here makes every row below vacuous",
  component.length > 800, true);
t("B1 ⚠ IT IMPORTS THE SHARED COOKIE MODULE rather than naming a cookie of its own",
  /import\s*\{[^}]*\}\s*from\s*"@\/lib\/palettes\/preview-cookie"/.test(component), true);
/* ⚠ THIS ROW ASKED FOR THREE NAMES — `PREVIEW_COOKIE`, `PREVIEW_MAX_AGE_SECONDS` and
 * `encodePreview` — because this component ASSEMBLED THE COOKIE ITSELF and the row was checking
 * that each ingredient came from the shared module rather than being typed here.
 *
 * ⚠ IMPORTING THREE INGREDIENTS CORRECTLY IS A WEAKER PROPERTY THAN NOT ASSEMBLING ANYTHING. Since
 * #516 there is one writer, `startPreview`, and this component calls it. The three ingredients are
 * still shared — they are shared INSIDE the writer, where nothing downstream can get them wrong.
 * The row follows the property rather than the spelling, and it is narrower than it looks: it names
 * the one function, so an edit that reinstates a local cookie assembly and drops the call reddens
 * it. That is the mutation that matters, and it is the one the old three-name form would have
 * survived — a component can import all three constants and still spell its own cookie beside them. */
t("B1a …and calls the ONE WRITER rather than assembling a cookie from ingredients it imported",
  /import\s*\{([^}]*)\}\s*from\s*"@\/lib\/palettes\/preview-cookie"/.exec(component)?.[1]
    ?.includes("startPreview") === true && /startPreview\s*\(/.test(component), true);
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

/* ⚠ SECTION C LIVED HERE AND HAS MOVED TO `palette-arrival`, WHICH IS A SUBJECT CHANGE RATHER THAN
 * A DELETION. It asserted the arrival note, because the teaser's own label used to carry it — the
 * four dots were the only surface that showed the four, so the note belonged beside them.
 *
 * The arrival STRIP now says it on every page, so keeping it in the pill too put the identical
 * sentence twice on the homepage, forty pixels apart. The note moved, and its rows moved with it:
 * `palette-arrival` D covers the same claims and `palette-arrival` A1a covers the prop that used to
 * be C4. Leaving them here would have been a second spelling of one claim — and C4 would have gone
 * on asserting a prop the component no longer takes, which is how a row outlives its subject.
 *
 * This suite's subject is now the FOUR and the single MECHANISM. The note is not its business. */

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

/* ⚠ THE FORCED COPY IS ENFORCED HERE RATHER THAN IMPORTED THERE. `teaser.ts` spells its own count
 * because `ralph` loads it raw and cannot resolve `lib/theme.ts` — the constraint that file's header
 * states and that I broke before reading. This suite CAN import both, so it is the one place the two
 * spellings can be compared, which is this repo's standing answer to a copy it cannot remove.
 *
 * ⚠ AND THE VISIBLE STRING IS ASSERTED WITH ITS NUMBER, WHICH IT NEVER WAS. `palette-arrival` checks
 * `/not one of these/` — a PREFIX — so the note could have said "these nine" and stayed green. An
 * assertion that matches a prefix tells you nothing about the rest of the string, and the count was
 * the part nobody looked at. */
t("F1 ⚠ THE TEASER'S OWN COUNT WORD AGREES WITH THE REGISTRY'S — a forced copy is only safe while something compares it",
  TEASER_COUNT_WORD, countWord(TEASER_THEMES.length));
t("F2 ⚠ AND THE ARRIVAL NOTE CARRIES THAT NUMBER — the existing row matches a prefix and never saw the count",
  (arrivalNote("sapphire") ?? "").endsWith(`not one of these ${countWord(TEASER_THEMES.length)}`), true);
t("F3 …and the note is only offered for a palette the row does NOT contain, so F2 is not asserted on a null",
  arrivalNote(TEASER_THEMES[0]), null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
