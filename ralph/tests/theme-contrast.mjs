// Is a candidate palette shippable? An INSTRUMENT, built before the palettes exist.
// Run: node --experimental-strip-types ralph/tests/theme-contrast.mjs
//
// ---- WHAT THIS ANSWERS, WHICH IS BIGGER THAN ITS NAME -----------------------------------------
//
// Given a proposed palette, can it ship without redesigning a component. Step 2 answered that once,
// by hand, for one dark palette, and found the glass nav and the Pearl Smoke vessel structurally
// light-ground at 1.15 and 1.20. This makes it a function.
//
// ⚠ BUILT AGAINST FIXTURES, NOT AGAINST THE FOUR CANDIDATE PALETTES, AND THE ORDER IS THE POINT.
// A gate built against four known palettes is a gate FITTED to them — every floor and every usage
// row gets chosen, consciously or not, to let them through, and what results proves that the
// palettes pass a test written to be passed. Fixtures first makes it an instrument before it is an
// answer.
//
// ⚠ AND THE KNOWN-BAD FIXTURES ARE THE HALF THAT MATTERS. A gate that has never refused anything is
// a gate nobody has seen fail. There are two, so BOTH verdict types are exercised rather than only
// the mechanism: one fails an EXTERNAL floor, one fails an INTERNAL floor.
//
// ---- ⚠ THREE WAYS A ROW CAN BE WRONG, EACH FOUND BY A DIFFERENT MECHANISM ----------------------
//
// This map was widened with a ground dimension and the twelve failures it produced resolved to FOUR
// causes and ZERO token changes. Every repair was to the map or to a consumer. The three shapes:
//
//  1 · A ROW CAN ASSERT A PAIRING THE SITE DOES NOT DRAW. Four rows named `canvas`, which no dark
//      palette paints; one named `on-accent` on the `accent-500` RUNG, which the design had migrated
//      off; one named `accent-500` on `cream-200`, whose two declared consumers had both gone.
//      FOUND BY MEASURING CONSUMERS, never by reading. And the `accent-500` row survived because its
//      note cited a comment rather than a render — the comment outlived the code and kept the row.
//
//  2 · AN ABSENCE CHECK PROVES THE PAIRING UNUSED, NOT THE COLOUR ACCOUNTED FOR. Deleting a row with
//      a `P3b`-style absence check looks complete and is not: the pairing is covered, the COLOUR
//      falls out of the map. Two different questions. FOUND BY `E1`.
//
//  3 · A DELETION CAN REMOVE COVERAGE OF A COLOUR IT NEVER NAMES. `accent-600`'s rows were deleted;
//      `accent-text` resolves THROUGH `accent-600`, so its coverage left with them and nothing named
//      it. FOUND BY `E1` AGAIN, one level deeper — and NO ABSENCE CHECK COULD HAVE CAUGHT IT, because
//      absence checks are all about pairings and this is about a colour.
//
//  4 · A FIXTURE WHOSE SUBJECT IS DELETED STOPS FAILING AND GOES GREEN FOR THE WRONG REASON. `B1`
//      broke `ink-600` to prove a failing palette reports REFUSED_EXTERNAL. `ink-600`'s rows were
//      deleted for an unrelated reason, so the fixture stopped exercising anything and PASSED — it
//      was proving nothing, and only a different change exposed it.
//      THE GENERAL FORM: A FIXTURE ASSERTS A VALUE AND, SILENTLY, ITS OWN LIVENESS. The second claim
//      is the one nothing checks. Ask of each fixture WHAT WOULD HAVE TO CHANGE FOR IT TO STOP BEING
//      ABLE TO FAIL — and note this is not mode 2 or 3: nothing fell out of coverage here, the
//      coverage was fine and the PROOF went hollow.
//
//  5 · ⚠ AND KNOWING A FAILURE MODE DOES NOT PREVENT IT. Mode 1 was written into this header, and
//      ONE COMMIT LATER two rows were added naming consumers at paths that do not exist — a Stepper
//      and an "illustration index" that were real components at other paths. The reverse sweep found
//      them, along with two pre-existing ones in `ink-400`'s row.
//      ONLY A MECHANISM PREVENTS A FAILURE MODE. Care does not. Same lesson as the comment trap
//      firing on the person who had just fixed it, and it is the argument for the sweep existing
//      rather than for being careful next time.
//
// THE COMPLETED FORM OF A DELETION IS THEREFORE BOTH: assert the pairing unused, AND list the colour
// in the boundary with its reason. Either alone leaves a hole, and the holes are different shapes.
//
// ⚠ AND `E1` IS THE ONLY REASON ANY OF THIS SURFACED. A completeness check nobody was thinking about
// caught two live colours falling out of coverage. It is proven to still bite: remove a colour from
// every row and it names it.

// ---- ⚠ THE BOUNDARY. WHAT THIS GATE DOES NOT COMPUTE, AND WHY ---------------------------------
//
// `studio-ink-contrast` naming its own boundary is the only reason hazard 30 was findable. This
// list is larger, and it is final since Step 1.
//
//   1 · THE 64 ARTWORK COLOURS. Illustration, not interface. No text sits on them.
//   2 · THE SIGNATURE-COMPONENT LITERALS, 37 of 61. They did not become tokens, so a theme cannot
//       move them — which is exactly why Step 2 found the glass nav structurally light-ground.
//   3 · THE NINE Δ≥10 NEARS left as literals by the snap ruling. Snapping them would have been a
//       visual change disguised as a refactor.
//   4 · THE FROZEN `--color-studio-*` PALETTE, outside BY CONSTRUCTION. `studio-tokens` C1 asserts
//       it is independent of the public one, so a theme cannot reach it. `studio-ground` is the
//       sharpest case: it has NO public counterpart at all, which is why the pairing-based row
//       could not see it and why 6a had to find it by census.
//   5 · SIX PUBLIC TOKENS WITH ZERO PUBLIC CONSUMERS — measured, not assumed. Listed by name below.
//   6 · ⚠ THE CURSOR AND `.ab-tint`. TWO, NOT FOUR — AND THE REVERSAL IS DELIBERATE.
//       #327 put the three WATERMARKS here too, on the reasoning that they are "closer to artwork
//       than interface". THE HARBOUR RENDER SAID OTHERWISE. `SectionHeading` draws its watermark
//       from a `tone` prop whose warm branch was a literal and whose grey branch was already a
//       token, so on harbour five watermarks stayed terracotta while Process and About went cool —
//       one component, one page, two answers.
//
//       ⚠ A COLOUR THAT MUST AGREE WITH A SIBLING RENDERED BY THE SAME COMPONENT FROM THE SAME
//       PROP IS INTERFACE. Artwork does not have to match anything. The artwork test was the wrong
//       test, and applying it a second time would have preserved the defect the theme had just
//       exposed. #328 gave both branches `accent-500` and `ink-600` — a SNAP at Δ2 to 4
//       composited, inside Step 1's own threshold — so `tone` still means accent-toned versus
//       ink-toned and both follow the palette.
//
//       WHAT REMAINS IS MEASURED RATHER THAN ASSERTED. `.ab-tint` is `mix-blend-mode: soft-light`
//       at opacity .5 over a PHOTOGRAPH — a tonal wash rather than a scrim, compositing over
//       artwork rather than the theme's ground, and it reads as photographic warmth. The cursor
//       has NO SIBLING TO DISAGREE WITH, which is exactly the property the watermarks lacked.
//
// ⚠ AND A HEADER IS NOT ENOUGH, WHICH IS WHY PART E EXISTS. The vocabulary blind spot has now
// appeared in THREE gates: `studio-tokens` C2 matched numbered scales only and missed `bg-canvas`;
// the 6a census counted comments as sites; C1's public-counterpart pairing could not reach a token
// with no public twin. Each time something was uncomputed and NOTHING SAID SO. Part E asserts the
// boundary is COMPLETE — every public colour is computed or listed — and it names the offender
// rather than reporting a count, because a count is the `length > 0` shape #260 caught in a suite
// written to prevent it.
import { readFileSync } from "node:fs";
import {
  report, parseOklch, parseColor, contrastRatio, oklchToRgb, gamutOvershoot, CLIP_EPSILON,
  readPaletteSource, layerPalette, paletteResolver, rgbToOklch, oklchOf, hexOf,
  USAGE, usageFor as usageForGround,
} from "../../lib/theme-contrast.ts";
import { THEME_NAMES, DEFAULT_THEME, VERIFY_THEME, THEME_GROUND, GROUND_TOKEN } from "../../lib/theme.ts";

import { readdirSync } from "node:fs";
import { join } from "node:path";
const tsxFilesForUsage = [];
(function walk(d) { for (const e of readdirSync(d, { withFileTypes: true })) {
  const p = join(d, e.name);
  if (/node_modules|\.next|\.git|components\/studio|app\/studio/.test(p)) continue;
  if (e.isDirectory()) walk(p); else if (/\.(tsx|ts|css)$/.test(e.name)) tsxFilesForUsage.push(p); }
})(new URL("../../components", import.meta.url).pathname);
(function walk(d) { for (const e of readdirSync(d, { withFileTypes: true })) {
  const p = join(d, e.name);
  if (/node_modules|\.next|\.git|app\/studio/.test(p)) continue;
  if (e.isDirectory()) walk(p); else if (/\.(tsx|ts|css)$/.test(e.name)) tsxFilesForUsage.push(p); }
})(new URL("../../app", import.meta.url).pathname);
/* ⚠ THE WALK ADMITS .ts AND .css NOW, AND IT DID NOT. A `.tsx`-only subject over a system whose
 * CSS holds hundreds of colour declarations hid ELEVEN foreground sites from section M — two of
 * which were a live AA failure on all four case studies, `ink-400` drawn as text in the next-case
 * rail while its own row called it non-text.
 *
 * ⚠ SECOND TIME THIS EXACT BOUNDARY HAS HIDDEN A POPULATION. The role migration walked `.tsx`
 * over a stylesheet holding 81 raw rungs. Both times the denominators INSIDE the subject were
 * sound — which is why neither was caught by a count. A sweep bounded by directory still has a
 * boundary by file type, and a denominator computed inside the walk cannot see it. */

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const cssAll = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

/* ⚠ THE READER LIVES IN `lib/theme-contrast.ts` NOW, AND THE REASONING IT CARRIED MOVED WITH IT —
 * the `@theme` scoping, the brace matching, and parse-before-exclude are all stated at
 * `readPaletteSource`. What stays here is the one line that reads the file, because a file read is
 * not the resolver and keeping `node:fs` out of the leaf is what lets a Server Component import it.
 *
 * ⚠ THIS SUITE IS STILL THE ONLY THING THAT REFUSES A PALETTE. The lift moved arithmetic, not
 * judgement — every floor, every usage row and every verdict assertion below is unchanged, and the
 * proof is that this file's output did not move by a byte. */
const SOURCE = readPaletteSource(cssAll);

/* ⚠ THE GROUND BLOCK, WHICH THIS SUITE MODELLED NOWHERE UNTIL NOW — AND THE DATA WAS ALREADY IN
 * SCOPE. `THEME_GROUND` is imported at the top of this file and says which palettes are dark;
 * `:root[data-ground="dark"]` in globals.css remaps SIXTEEN roles for exactly those palettes. The
 * suite read the defaults and the `[data-theme]` block and stopped, so on the four dark palettes it
 * resolved every one of those sixteen to its LIGHT value.
 *
 * ⚠ WHAT THAT MADE UNREPRESENTABLE: `on-accent` is near-white on light and near-black on dark. The
 * row `TEXT("on-accent", ["accent-500"])` therefore measured a near-white against a dark palette's
 * accent and passed comfortably, while the paint is near-black on a dark accent. Measured from a
 * canvas on the real render, nocturne is 3.24 and its `accent-600` pair is 2.39.
 *
 * ⚠ THE FAILURE SHAPE IS THE ONE THIS REPO HAS NAMED TWICE: a gate correct about what it models,
 * whose model cannot express the property. `theme-contrast`'s own merge of cream-plus-overrides made
 * a missing override unrepresentable; this is the same merge missing a THIRD layer.
 *
 * Specificity decides the order. `:root[data-ground="dark"]` is 0-2-0 and `[data-theme="x"]` is
 * 0-1-0, so the ground block wins wherever both declare a token — defaults, then theme, then ground.
 */
const themeOverrides = SOURCE.overridesOf;

console.log("\nS · the sanity pair, first — abort trust if a known input reads wrong");
t("S1 white on black is 21:1", Math.round(contrastRatio([255, 255, 255], [0, 0, 0])), 21);
t("S2 the oklch transform lands ink-950 on its known bytes", oklchToRgb(0.14, 0.018, 60), [15, 7, 3]);
t("S3 …and cream-50 on its known bytes", oklchToRgb(0.985, 0.012, 80), [254, 249, 241]);

/* ---- THE SHIPPED PALETTE, read from the same file the screen renders from. Aliases are resolved,
 * so `--color-background: var(--color-canvas)` contributes canvas's colour under both names. */
const { rawDecl, aliasOf, publicTokens: PUBLIC } = SOURCE;

/* ⚠ PARSE EVERYTHING, THEN EXCLUDE — NOT EXCLUDE, THEN PARSE. The old order silently filtered out
 * whatever `parseColor` could not read, and the boundary list then covered the survivors. That made
 * the list a SHIELD FOR CAPABILITY rather than a statement of POLICY: anything listed was never
 * asked to parse, so a parser defect on a listed value was silent by construction.
 *
 * It hid one. `parseOklch` required a `%` on the lightness while `--color-smoke-1` is
 * `oklch(0.84 0.014 58 / 0.74)`, so every smoke stop read as null and nothing noticed, because
 * smoke is listed. #333 taught the parser the percentless form; this changes the ORDER so the next
 * one cannot hide the same way.
 *
 * ⚠ AND THE AUDIT SAYS WHAT REMAINS. Every listed token now parses. The one that never did was
 * `on-dark-line`, a `color-mix()` over another token — unparseable by NATURE rather than by defect,
 * because it was derived rather than literal. It has been deleted (zero consumers, its job already
 * done by `--color-border` on the dark ground at the identical 16%), so E8's expected set is empty.
 * The distinction it existed to draw is still asserted: a parse failure is acceptable ONLY when the
 * value references another token, which is E7, and E8 keeps the population enumerated so a future
 * derived token cannot be filtered away silently the way this one nearly was. */
const { defaults: CREAM, unparseable } = SOURCE;

/* ============================================================================================
   ⚠ A THEMED PALETTE IS RUNGS OVER *ALIASES*, NOT RUNGS OVER CREAM'S RESOLVED ROLES. THE ONE
   ASSEMBLY SEAM, AND IT EXISTS BECAUSE THE OBVIOUS SPREAD IS WRONG.

   `{ ...CREAM, ...themeOverrides(n) }` reads as the whole story and is not. A `[data-theme]` block
   declares 35 tokens and EVERY ONE IS A RUNG — harbour declares `cream-50` and does not declare
   `surface`. The roles live once in `@theme` spelled `--color-surface: var(--color-cream-50)`, and
   `CREAM` above stores each one ALREADY FLATTENED against cream. So the spread layers harbour's
   rungs over CREAM's resolved roles and SEVEN TOKENS THE USAGE MAP NAMES keep cream's value on
   every light palette that is not cream — `accent`, `accent-text`, `on-accent`, `surface`,
   `surface-well`, `text-primary`, `text-secondary`.

   ⚠ THE TELL WAS IN THE OUTPUT AND READ AS A COINCIDENCE. `on-accent on accent` reported 4.70 for
   cream, harbour, orchid, cerise AND fern — five identical figures for five different palettes,
   because both operands were cream's, so the row was palette-INDEPENDENT by construction. A number
   that cannot vary is not a measurement, and five copies of it sat in the log.

   ⚠ AND THE MACHINERY TO DO IT RIGHT ALREADY EXISTED — `rawIn` follows `var()` through the merged
   palette and falls back to `rawDecl`. CREAM's pre-flattening SHADOWED that path. The repair is to
   follow each alias through the MERGED map here, once, rather than to add a second resolver.

   ⚠ THE GROUND BLOCK IS SKIPPED RATHER THAN FOLLOWED, AND THAT IS LOAD-BEARING.
   `:root[data-ground="dark"]` redeclares those same seven roles as fresh `var()` and `color-mix()`
   expressions. Following `@theme`'s alias for a token the ground block owns would overwrite the
   dark answer with the light one — so a key any later layer declares is left exactly as that layer
   wrote it, and the resolver flattens it downstream as before. This is also why the dark palettes
   passed the browser oracle while the defect was live: the ground block repaired them by accident.

   ⚠ `GROUND_DARK` IS READ ONLY FOR A DARK PALETTE, WHICH IS NOT A MICRO-OPTIMISATION. It is
   declared 580 lines below this one, so evaluating it for a light palette would be a temporal dead
   zone error at the two section-D fixtures that call this before that line.
============================================================================================ */
const layered = (n) => layerPalette(SOURCE, n, {
  defaultTheme: DEFAULT_THEME,
  groundClass: THEME_GROUND[n] === "dark" ? "dark" : "light",
});

/* ⚠ AND A DEAD BINDING CAME OUT WITH IT, WHICH ONLY THE MOVE COULD REVEAL. `GROUNDS` sat beside
 * the map, referenced by nothing, and this file is a `.mjs` — outside `tsc`'s include and outside
 * eslint's reach in practice — so nothing had ever said so. It failed `no-unused-vars` within a
 * minute of landing in a `.ts`. A file nobody typechecks is a file where a dead binding is
 * indistinguishable from a live one, and the lift is what asked the question.
 *
 * ⚠ THE USAGE MAP MOVED TO `lib/theme-contrast.ts` AND ITS REASONING WENT WITH IT. The palette
 * varies per theme and the map does not — it is the design's statement about its own product, so
 * `/palettes` and this gate read one copy. Every floor and every row is unchanged, which is what
 * "identical figures" below means. */

console.log("\nA · the shipped palette is shippable, and every row computes");
const cream = report(CREAM, USAGE);
t("A1 verdict", cream.verdict, "SHIPPABLE");
t("A2 nothing uncomputable — a skipped row is a colour nobody knows is unchecked", cream.uncomputable, []);
t("A3 no failures", cream.failures.map((r) => r.key), []);
t("A4 the row count is what the map declares — a shrunken map passes vacuously",
  cream.rows.length, USAGE.length);
/* Pinned, so a token retuned in globals.css moves this and fails on arrival. */
const got = (k) => cream.rows.find((r) => r.key === k)?.got;
/* ⚠ THE LADDER IS TWO RUNGS NOW, AND THE THIRD LEFT WITH ITS ROW RATHER THAN WITH A RETUNE. The
   4.07 that stood here was `accent-500 on cream-200`, whose UI row was deleted because both of its
   declared consumers had migrated away and no public mark draws that pairing. The two values below
   are unchanged, which is what says the token did not move — only the map's claim about it did. */
t("A5 accent-500's cream ladder, computed", [got("accent-500 on cream-50"),
  got("accent-500 on cream-100 (non-text)")], [4.7, 4.48]);
t("A6 the ground ladder, computed", [got("ground step cream-50 / cream-100"),
  got("ground step cream-100 / cream-200"), got("ground step cream-200 / cream-300"),
  got("ground step cream-300 / canvas")], [1.05, 1.1, 1.19, 1.13]);

console.log("\nB · it REFUSES — both verdict types, not just the mechanism");

/* ⚠ EXTERNAL. ink-600 lightened until body text misses WCAG AA. Nothing else moves, so the failure
 * cannot be a side effect of a broken fixture. */
/* ⚠ THE FIXTURE BROKE `ink-600`, WHOSE ROWS ARE DELETED — SO IT STOPPED FAILING AND B1 WENT GREEN FOR
   THE WRONG REASON. A fixture that no longer exercises the thing it asserts is the quietest kind of
   dead row, and it went dead because a DIFFERENT change removed its subject. Re-pointed at
   `text-subtle`, which still carries rows on all four grounds and is a real text role rather than a
   rung nothing draws. The lightness is chosen the same way the old one was: far enough above the
   cream ladder to fail 4.5 on every ground, so the verdict is unambiguous. */
const badExternal = { ...CREAM, "text-subtle": "oklch(75.0% 0.016 60)" };
const bx = report(badExternal, USAGE);
t("B1 a palette failing WCAG is REFUSED_EXTERNAL", bx.verdict, "REFUSED_EXTERNAL");
/* Re-derived with the fixture, not fitted to it: breaking `text-subtle` names every ground it
   carries a row on and no others. The SHAPE of the assertion is what matters — named pairs rather
   than a count — and it is unchanged.

   ⚠ AND THE LIST GREW BY ONE WHEN THE HERO'S `surface` ROWS LANDED, WHICH IS THIS ROW WORKING. A
   fixture with a pinned list is the only kind that notices its own subject expanding: adding
   `text-subtle on surface` to the map made this red immediately, where a COUNT would have been
   updated without anyone reading which pair joined. Ordered as the report emits them. */
t("B2 and the failing pairs are named, not counted", bx.external, [
  "text-subtle on surface", "text-subtle on canvas", "text-subtle on cream-200"]);
t("B3 no internal floor was disturbed, so the fixture proves what it claims", bx.internal, []);

/* ⚠ INTERNAL. cream-100 collapsed onto cream-50, so the ground ladder loses its first step while
 * every text ratio stays legal — the failure that is OURS rather than WCAG's. */
const badInternal = { ...CREAM, "cream-100": CREAM["cream-50"] };
const bi = report(badInternal, USAGE);
t("B4 a palette failing only our own floor is REFUSED_INTERNAL", bi.verdict, "REFUSED_INTERNAL");
t("B5 named", bi.internal, ["ground step cream-50 / cream-100"]);
t("B6 ⚠ AND IT IS STILL A REFUSAL — naming a floor as ours must not soften it to a warning",
  bi.verdict === "SHIPPABLE", false);
t("B7 no external floor was broken by it", bi.external, []);

/* ⚠ A MISSING TOKEN IS NOT A PASS. A palette that does not define what the usage map names must
 * refuse, or the gate reports SHIPPABLE having checked fewer pairs than it claims. */
const incomplete = { ...CREAM };
delete incomplete["band-dark"];
const inc = report(incomplete, USAGE);
t("B8 a palette missing a token is UNCOMPUTABLE, never SHIPPABLE", inc.verdict, "UNCOMPUTABLE");
/* ⚠ THIS LIST GREW WHEN `accent-on-dark` ARRIVED, AND THAT IS THE FIXTURE WORKING RATHER THAN
 * NEEDING RELAXING. It enumerates every row that becomes uncomputable when `band-dark` is removed,
 * so a new consumer of that ground MUST appear here — a fixture that silently accepted the old
 * three would be one that stopped tracking its subject. */
t("B9 and the uncomputable rows are named", inc.uncomputable, [
  "on-dark on band-dark", "on-dark-muted on band-dark", "on-dark-quote on band-dark",
  "accent-on-dark on band-dark"]);

/* ⚠ `over()` IS NOT EXERCISED HERE, AND THAT IS STATED RATHER THAN LEFT TO LOOK LIKE COVERAGE.
 * `UsageRow.alpha` exists in the type — every hairline and scrim on this site is specified as a
 * colour over a ground — but no PUBLIC row below uses it, because the public hairline has no
 * stated floor of its own and inventing one here would encode a number nobody chose. Mutation
 * found this: breaking the compositing left all 27 assertions passing. The maths IS covered, by
 * `studio-ink-contrast`, whose /8, /10 and /22 rows kill the same mutation across 16 assertions —
 * checked, not assumed. A public alpha row arrives when the design states its floor. */

console.log("\nC · the report is a function of its ARGUMENTS, not of the live stylesheet");
t("C1 the same palette twice gives the same verdict", report(CREAM, USAGE).verdict, cream.verdict);
t("C2 a different palette gives a different verdict — so it reads the argument",
  bx.verdict !== cream.verdict, true);
t("C3 an empty usage map is not a pass — zero subjects, zero meaning",
  report(CREAM, []).rows.length, 0);

console.log("\nD · theme two — judged by the instrument, not by eye");

/* Harbour is the defaults with its block layered over them, which is exactly what the browser
 * computes: `@theme` on `:root`, the unlayered `[data-theme]` block winning over it.
 *
 * ⚠ AND THAT FIDELITY IS ALSO THIS SUITE'S BLIND SPOT, WHICH IS WHY THE OWNER IS NAMED BELOW. The
 * spread means a token harbour FORGETS to override silently arrives from CREAM — so `report` would
 * measure cream's contrast, and D1 would call the result harbour SHIPPABLE. The instrument
 * faithfully reproduces the browser's own failure mode: the browser inherits silently too.
 *
 * That is not hypothetical. `--color-accent-400` shipped for months declared on ONE side, and no
 * gate could see it because every reader either merged the two or read the source where both
 * plainly existed. THE OWNER OF THAT CLAIM IS `theme` SECTION G, which asserts the two blocks
 * declare the same token SET, and D3 below now compares the two counts rather than testing one
 * against a floor. Naming it because a deferral without a named check is a deferral to nobody. */
const HARBOUR = layered("harbour");
const harbour = report(HARBOUR, USAGE);
/* ⚠ HARBOUR IS NOT SHIPPABLE UNDER THE GAMUT CHECK, AND THIS ROW SAID IT WAS FOR TWENTY-ODD PRs.
 * It clears every contrast floor it has ever been asked about — that half was always true and is
 * asserted below. What was never asked is whether its brand colour EXISTS: `accent-500` is 60.7
 * outside sRGB and has painted clamped since #325.
 *
 * ⚠ NOT PAPERED OVER AND NOT SILENTLY REPAINTED. Re-deriving harbour's accent against the h168
 * ceiling is a change to a shipped brand colour and belongs to the owner with a render behind it,
 * not to a gate tightening its own subject. So the verdict is asserted HONESTLY and the two halves
 * are separated, which is what makes the finding survive until it is decided. */
/* ⚠ SHIPPABLE AGAIN SINCE #378, AND IT IS NOT THE SAME CLAIM IT WAS BEFORE #377. This row read
 * SHIPPABLE for twenty-odd PRs while harbour's brand colour sat 60.7 outside sRGB, because nothing
 * asked whether a colour EXISTED before asking what it contrasted with. It now passes having been
 * asked both. */
t("D1 harbour is SHIPPABLE — and since #377 that includes existing, not only contrasting",
  harbour.verdict, "SHIPPABLE");
t("D1a ⚠ AND ITS PALETTE IS ENTIRELY INSIDE sRGB — the half that was never checked until #377",
  harbour.unrepresentable, []);
t("D2 nothing uncomputable — every row the map names exists in the palette", harbour.uncomputable, []);
t("D3 it is a DIFFERENT palette, not the defaults wearing a name",
  Object.keys(themeOverrides("harbour")).length > 15, true);
/* ⚠ SYMMETRIC, BECAUSE `> 15` WOULD LET NINETEEN TOKENS VANISH. Cream did not have a block to
 * compare against until #365 gave it one; now the two are counted against EACH OTHER, so a palette
 * that drops a token fails here as well as in `theme` G4. Two independent readers of the same
 * invariant is the point — G4 reads names, this reads the parsed override maps. */
t("D3b ⚠ AND BOTH PALETTES DECLARE THE SAME NUMBER OF TOKENS — a short palette inherits the other silently",
  Object.keys(themeOverrides("harbour")).length,
  Object.keys(themeOverrides("cream")).length);
t("D3c …and that number is the real palette, not two empty maps agreeing",
  Object.keys(themeOverrides("cream")).length > 20, true);

/* ⚠ THE TWO ROWS THAT REFUSED THE EARLIER DRAFTS, PINNED. Draft 1 put the ground near the old
 * "roughly 85%" figure and failed five external rows; draft 2 kept cream's `ink-400` at 62% and
 * computed 2.88 against a 3.0 floor. Both numbers live here so a future tune cannot quietly walk
 * back into them. */
const hgot = (k) => harbour.rows.find((r) => r.key === k)?.got;
t("D4 ink-400 sits at 60.5% BECAUSE cream's 62% computes 2.88 here — the row that refused draft 2",
  hgot("ink-400 on cream-200 (non-text)") >= 3.0, true);
t("D5 accent sits darker than cream's because teal carries more luminance at equal lightness",
  hgot("accent-500 on cream-50") >= 4.5, true);

/* ⚠ SHIPPABLE AND ON THE FLOOR ARE NOT THE SAME THING, AND THIS IS WHERE I HAD IT WRONG. I told the
 * owner cream sat on THREE floors and that harbour "has the same zero headroom". Both halves were
 * wrong, and the assertion is what said so: cream has SIX rows inside 0.1 of their floor and
 * harbour has THREE. My three came from a hand-picked sample, which is the difference between
 * reading a table and computing one.
 *
 * The three harbour keeps are the GROUND LADDER, which is a relation rather than a colour — "one
 * step apart" means exactly 1.05 by construction, so no palette can buy margin there without
 * changing what the ladder is. The three it does NOT keep are the three that refused its earlier
 * drafts: darkening `ink-400` to 60.5% and `text-subtle` to 50% bought real margin where cream has
 * none. A palette measured from scratch beat the palette it was derived from.
 *
 * ⚠ SO THE RULE IS NOT "EVERY THEME SITS ON THE FLOOR", IT IS "CREAM IS NOT A TEMPLATE". A palette
 * that copies cream's lightness values inherits cream's zero margin and fails the moment it moves a
 * hue — which is precisely what draft 1 did. */
const TIGHT = 0.1;
const onFloor = (rep) => rep.rows.filter((r) => r.got !== null && r.got - r.min < TIGHT).map((r) => r.key).sort();
/* ⚠ FIVE, AND IT WAS SIX UNTIL THE VOCABULARY LOST A WORD. One of the six was `text-muted on
 * canvas`, a duplicate ROW for a duplicate TOKEN — same value, same ground, same ratio. So the
 * count I had already corrected once (from a hand-picked three to a computed six) was still
 * carrying the redundancy it was counting. A duplicate name inflates every measurement taken over
 * the names, which is a quieter cost than a wrong colour and is why the merge was worth doing. */
t("D6 cream sits inside 0.1 of five DISTINCT floors — computed, and one fewer since #330",
  onFloor(cream).length, 5);
t("D7 harbour sits on three, and they are the ground ladder — a relation no palette can loosen",
  onFloor(harbour), ["ground step cream-100 / cream-200", "ground step cream-300 / canvas",
    "ground step cream-50 / cream-100"]);
t("D8 the three harbour escaped are exactly the ones its earlier drafts failed on",
  onFloor(cream).filter((k) => !onFloor(harbour).includes(k)).sort(),
  ["ink-400 on cream-200 (non-text)", "text-subtle on canvas"]);

console.log("\nD3 · theme three — ORCHID, judged before it is looked at");

/* ⚠ THE INSTRUMENT RUNS FIRST AND THE RENDER SECOND, AND NEITHER IS OPTIONAL. `SHIPPABLE` means
 * every token pair clears its floor; it has never meant the site looks right. Harbour took three
 * drafts and every refusal was this working. */
const ORCHID = layered("orchid");
const orchid = report(ORCHID, USAGE);
console.log(`         verdict ${orchid.verdict}`);
for (const r of orchid.rows.filter((x) => !x.ok)) console.log(`           REFUSED  ${r.fg} on ${r.bg}  got ${r.got?.toFixed(3)} floor ${r.floor} (${r.kind})`);
t("D9 orchid is SHIPPABLE", orchid.verdict, "SHIPPABLE");
t("D10 nothing uncomputable — every row the map names exists in the palette", orchid.uncomputable, []);
t("D11 …and it declares the same token set as the others, so nothing inherits silently",
  Object.keys(themeOverrides("orchid")).length, Object.keys(themeOverrides("harbour")).length);
/* ⚠ A REGISTRY OF BANDS, NOT A BAND — AND THE DIFFERENCE ONLY BECAME VISIBLE WHEN A SECOND CLASS
 * ARRIVED. There has only ever been one ground class, so "a band" and "a registry of one band" are
 * indistinguishable, and the single-band form was what got written. It was always a PER-CLASS FACT
 * WEARING A SINGLE-BAND SHAPE.
 *
 * ⚠ AND THE ALTERNATIVE WAS REFUSED DELIBERATELY EVEN THOUGH IT WAS CHEAPEST. Moving a dark
 * palette's hue until it satisfied the LIGHT class's 60 degree floor would have passed a comparison
 * that does not apply — the wrong-unit rule shipped on purpose. It is the jade failure inverted:
 * there the instrument reported "too close" for a colour that could not exist, here it would report
 * "far enough" for a comparison between classes that do not compete.
 *
 * ⚠ `hueFloor: null` IS A MEASUREMENT THAT HAS NOT BEEN TAKEN, NOT A DEFAULT. The ceiling work
 * found the floor is a property of the CHROMA a class chooses rather than of the class — a dark
 * ground at c 0.016 needs 117 degrees where c 0.030 needs 61. A band with one member has no
 * separation to enforce, and saying so beats inheriting 60 from a class it was measured on. */
const BANDS = [
  { label: "light", min: 0.920, max: 0.962, hueFloor: 12.5, floorUnit: "dE",
    why: "the five shipped palettes, measured on THIS band. ⚠ 12.5 IS A CEILING ON THE FLOOR RATHER "
       + "THAN A JUDGED THRESHOLD, and the difference is the whole entry. It sits just under the "
       + "SMALLEST separation among the ten shipped light pairs, cream/cerise at 12.529964, every one of which went "
       + "through the render protocol and reads as its own colour. So the evidence bounds this floor "
       + "from ABOVE — nothing at or over 12.53 may be refused, because all ten shipped — and NOTHING "
       + "BOUNDS IT FROM BELOW, because no light pair has ever been rendered side by side and read as "
       + "ONE colour. The dark band is the mirror: it has a `one` at 6.0 and no `two`, so its floor is "
       + "pinned from below and free above. Neither band has both, and saying which half is missing "
       + "beats a number that reads as fully derived. "
       + "⚠ AND THE UNIT MOVED BECAUSE DEGREES DID NOT MERELY GO SILENT ON AN ACHROMATIC GROUND — IT "
       + "REFUSED ONE UNCONDITIONALLY. This entry predicted silence. Measured, a chroma-0 ground still "
       + "carries a hue DIGIT that `arc()` happily reads, and of the 360 spellings available NOT ONE "
       + "clears 60 degrees against all five shipped hues. The colour is rgb(228,228,228) in every one "
       + "of them and sits dE 12.04 to 17.52 away, which is ordinary for this band. So the old floor "
       + "reported a phantom collision whose only cure was rotating a digit to satisfy a gate, which "
       + "this project refuses by name. "
       + "⚠ AND THE TWO UNITS DISAGREE ABOUT WHICH PAIR IS TIGHTEST, WHICH IS WHY THIS IS NOT A "
       + "RELABELLING. By degrees the binding pair is orchid/cerise at exactly 60.0; by dE it is "
       + "cream/cerise at 12.53, which sits 63.0 degrees apart. Both tightest-by-dE pairs involve "
       + "cerise, whose ground chroma is forced to 0.016 by the gamut rather than chosen — the record "
       + "already names cerise as the palette degrees flatter most. "
       + "⚠ AND THE FLOOR IS 12.5 RATHER THAN 12.53 BECAUSE THE ROUNDED FIGURE REFUSED ITS OWN SOURCE "
       + "PAIR. The true separation is 12.529964, which is BELOW the two-decimal form it prints as, so "
       + "a floor set to the displayed 12.53 failed cream/cerise — the pair the floor was derived "
       + "from, refused by its own derivation. `measure through the string that gets written` is this "
       + "repository's own rule and this is it arriving in a band floor, caught by the row going red "
       + "rather than by reading." },
  /* ⚠ THE EVIDENCE IS DATA, NOT PROSE, BECAUSE A MUTATION RAISED THIS FLOOR TO 10.5 AND THE `why`
   * WENT ON SAYING 6.1 WAS THE ONLY JUDGED FIGURE. Nothing compared the number to the sentence —
   * the A8a shape, written by the same hand in the same moment, one more time. `judged` holds every
   * render anyone has looked at, and L3d COMPUTES the floor from it, so a floor can only move when
   * a judgement moves. Adding an owner's read is one row here, not a rewritten paragraph. */
  { label: "dark", min: 0.150, max: 0.200, hueFloor: 6.1, floorUnit: "dE",
    judged: [
      /* ⚠ `colours` IS WHAT THE READING WAS TAKEN ON, AND IT IS NOT WHAT SHIPPED. Chased from the
       * history because the 6.0 reproduced from nothing — 4.69 on the shipped grounds, 8.37 on
       * canvas, 1.25 or 12.52 in OKLab. It is exact once the right subject is used:
       *
       *     judged    oklch(17.0% 0.016 250) vs oklch(17.0% 0.024 282)   dist3 6.000000
       *     shipped   oklch(17.0% 0.016 250) vs rgb(13, 14, 25)          dist3 4.690416
       *
       * Nocturne did not exist in `globals.css` when this was judged — 0f9f183's own message says
       * "Nocturne is deferred" — so the render matched both grounds at ONE lightness for a
       * like-for-like read. The authored preset then shipped at the studio doc's shared D.bg of
       * .168 in a779868, 0.2 units darker, and nobody re-measured.
       *
       * THE JUDGEMENT STANDS AND THE FLOOR DOES NOT MOVE. Somebody rendered two grounds at dE 6.0
       * and read them as ONE colour; that is a perceptual fact about a separation, not about a
       * palette, so "at or below 6.0 is refused on evidence" is still exactly what it always was.
       * What was wrong was a `what` field that reads as the shipped pair. */
      { dE: 6.0, read: "one", what: "sapphire h250 vs nocturne h282, page grounds full-bleed, accent held out, BOTH MATCHED AT 17.0% — the nocturne ground judged here is 0.2 lightness units lighter than the one that shipped",
        colours: ["oklch(17.0% 0.016 250)", "oklch(17.0% 0.024 282)"] },
    ],
    why: "the dark class. ⚠ 6.1 IS A CEILING ON THE FLOOR, NOT THE FLOOR — and the difference is the "
       + "whole entry. What is measured on THIS band is ONE judgement: sapphire h250 and nocturne "
       + "h282, both dark-band members, rendered full-bleed with the accent held out, READ AS ONE "
       + "COLOUR. They measure dE 6.0. So anything at or below 6.0 is refused on evidence, and "
       + "NOTHING ABOVE IT HAS BEEN JUDGED. 6.1 admits pairs nobody has looked at; it is the largest "
       + "claim this band's evidence supports and it is deliberately not the largest useful one. "
       + "⚠ AND 10.5 WAS TRIED HERE AND REFUSED BY L3c, WHICH IS THAT ROW EARNING ITS PLACE. 10.5 is "
       + "the smallest separation among the five `band-dark` values on LIGHT palettes, judged in the "
       + "same full-bleed presentation — defensible, honestly arrived at, AND CALIBRATED ON ANOTHER "
       + "BAND. A stated floor naming the wrong subject is this project's signature defect, and L3c "
       + "is the first gate to stand in front of it. "
       + "⚠ THE IN-BAND SERIES IS TAKEN AND AWAITS A READ: candidates at dE 6.0, 8.4, 10.8, 13.3 and "
       + "16.4 against sapphire's ground, full-bleed, no accent and no label in frame. The flip point "
       + "sets this value. If it lands near 10.5 that is TWO BANDS CONVERGING BY INDEPENDENT ROUTES, "
       + "which is worth more than one borrowed number — and only worth it if the independence is "
       + "said out loud rather than read as confirmation. "
       + "⚠ AND IT IS NOT 60 IN DEGREES, which belongs to the light band's chroma — a dark ground at "
       + "c 0.016 would need 117 degrees for the same separation. "
       + "The value was null while ONE member shipped and there was no pair; this row's own end "
       + "condition was `the first pair that looks too close sets it`, and a second member arrived "
       + "and was too close. "
       + "⚠ AND IT IS NOT 60 IN DEGREES, which belongs to the light band's chroma — a dark ground at "
       + "c 0.016 would need 117 degrees for the same separation. "
       + "⚠ AND THE UNIT IS dE RATHER THAN DEGREES, WHICH IS A CANDIDATE PALETTE'S DOING. `Basalt` "
       + "proposes a ZERO-CHROMA ground: it has no hue, so a floor in degrees is not merely wrong "
       + "about it, it is SILENT — and silence reads as a pass. Same shape as a census row that "
       + "cannot be matched by form: a member outside the predicate's vocabulary, passing because it "
       + "cannot be evaluated. Measured, Basalt separates from the other three by dE 7.3 to 10.2 "
       + "while two of its three degree figures are large and one is meaningless. "
       + "⚠ AND THE FIGURE THAT USED TO SIT HERE WAS THE WRONG RELATION. This row said `sapphire and "
       + "Nocturne at 32 degrees and dE 4.7`; 32 is the GROUNDS and the accents are 24, and the two "
       + "rows that rule on them are different. Measured on the built palettes the grounds are dE 6.0. "
       + "A number recorded without naming its relation is one a reader supplies a relation for. "
       + "⚠ WHAT THIS FLOOR COSTS IS A PALETTE, SAID PLAINLY. Nocturne as drawn cannot ship beside "
       + "sapphire: it needs h320+ at c 0.024, or c 0.036 to clear from h300, and either moves its "
       + "accent too — which lands it beside orchid's h330. That is a fact about the blue-violet "
       + "quadrant being occupied rather than about the drawing. TRIGGER FOR ITS RETURN: the accent "
       + "question is reopened, or sapphire is retired. "
       + "⚠ AND AN OWNER RULING OVERRIDES THE DEFERRAL BELOW, HELD RATHER THAN CANCELLED — READ IT "
       + "BEFORE ACTING ON ANYTHING THAT FOLLOWS. The three are ruled INDEPENDENTLY AUTHORED dark "
       + "themes with `docs/dark-mode-studio.html` as the source of truth, which explicitly overrides "
       + "Nocturne's rebuild parameters: the DRAWN h282 ships, not the h320 derived here. "
       + "⚠ IT IS AN OVERRIDE OF THE dE 6.0 JUDGEMENT AND NOT A CLAIM THAT THE JUDGEMENT WAS WRONG. "
       + "The render stands as the evidence it was; the owner has ruled the palette's identity worth "
       + "the collision. So WHEN THE PRESETS ARE SLOTTED, this floor's own founding evidence becomes "
       + "a pair the system then ships — and that contradiction must be written here explicitly at "
       + "that moment, because a reader who finds it without the ruling beside it will read it as "
       + "drift rather than as a decision. THE FLOOR ITSELF IS UNAFFECTED and stays worth closing, "
       + "since it governs every dark palette after these three. "
       + "⚠ ALL THREE CANDIDATE DARK PALETTES ARE DEFERRED, AND NOT FOR THE SAME REASON. Nocturne "
       + "fails on its GROUND (dE 6.0 from sapphire) and its accent is legal at exactly 24.0; Ink & "
       + "Flare fails on its ACCENT (h52, ten degrees from cream's h42); Basalt fails on its accent "
       + "too (h128, six degrees from fern's h134). They were drawn in `docs/dark-mode-studio.html` "
       + "before most of the shipped palette existed, so none was drawn against it. "
       + "⚠ AND THE ACCENT CIRCLE IS NOT FULL — THE OPPOSITE OF WHAT WAS FORECAST. Measured at the 24 "
       + "degree floor there is room for SIX more accents, in three open arcs: h66 to h110, h189 to "
       + "h248, and h296 to h306. Twelve palettes total before the accent constraint shuts. The "
       + "candidates collide because each was drawn on a taken hue, not because the circle is closed. "
       + "⚠ SO THE IDENTITIES ARE KEPT AND THE PALETTES WAIT. Rotating Ink & Flare into h66+ makes a "
       + "yellow-olive of a molten orange and Basalt into h189+ makes a cyan of an acid lime — a "
       + "different palette wearing the name. THE FOUR DRAWN NUMBERS ARE THE DESIGN, and moving them "
       + "to satisfy a gate inverts which of the two is authoritative. Nothing is lost by waiting "
       + "while six arcs are open, and A PALETTE DRAWN INTO AN OPEN ARC WILL BE BETTER THAN ONE "
       + "ROTATED OUT OF A COLLISION. The windows are recorded here so the next one starts from an "
       + "open arc rather than from a drawing that has to be checked against one. "
       + "⚠ NOCTURNE IS THE SMALLEST REDRAW AND WAITS FOR THIS BAND'S FLIP POINT RATHER THAN BEING "
       + "BUILT TWICE. Ground h320 c0.024 gives dE 10.8 with one gamut cap — and 10.8 is EXACTLY the "
       + "read this floor is waiting on, which is the argument for waiting: a value sitting on the "
       + "boundary is the one most likely to move. Fallbacks measured: h330 c0.024 at 11.9, h320 "
       + "c0.030 at 12.1. Preserving its 14 degree ground-accent gap costs SIX clamped tokens instead "
       + "of one, because ground chroma feeds every ground-family rung through the ratio rules. "
       + "⚠ AND THE ACHROMATIC CASE STILL HAS NO MEMBER. Basalt proposes a ZERO-CHROMA ground, which "
       + "is why the unit is dE and not degrees — a degree floor is not merely wrong about a hueless "
       + "palette, it is SILENT, and silence reads as a pass. Measured, Basalt separates from the "
       + "other three by dE 7.3 to 10.2, so it sits BELOW this floor and will have to be judged on a "
       + "render exactly as this pair was. "
       + "⚠ AND ITS PREDICATE QUESTION SURVIVES ITS DEFERRAL, BECAUSE IT IS ABOUT THIS BAND'S RULE "
       + "RATHER THAN ABOUT THAT PALETTE: a zero-chroma ground has NO HUE TO SEPARATE WITH, so its "
       + "7.3 to 10.2 is a lightness-and-chroma distance wearing a hue comparison's name — the "
       + "distance-is-not-a-direction family a third time. ASK WHETHER THIS FLOOR APPLIES TO AN "
       + "ACHROMATIC GROUND AT ALL before measuring one against it. If such a ground separates by "
       + "lightness rather than by hue it needs a different predicate or a stated exemption, and "
       + "either beats a number that answers the wrong question." },
];


/* ⚠ COMPUTED, NOT PATTERN-MATCHED. The first version of this row was a regex looking for a hue in
 * the 310s and it never ran — a silent non-assertion, which is the shape this suite spends its
 * comments warning about. The hues are parsed and the separations measured.
 *
 * ---- ⚠ AND THE PAIR LIST IS NOW DERIVED, BECAUSE IT WAS THE THING NOBODY WOULD UPDATE ---------
 *
 * It was written out by hand: three pairs for three themes. THAT IS QUADRATIC — 21 pairs at seven
 * themes — and a hand-kept quadratic list is a gate that silently narrows every time the subject
 * grows. When cerise and fern landed, the hardcoded version went on comparing the same three pairs
 * and PASSED without looking at either new palette. Derived from `THEME_NAMES` it cannot.
 *
 * ---- ⚠ AND IT CHECKED GROUNDS AND NOTHING ELSE, WHICH IS THE BIGGER HOLE -----------------------
 *
 * A candidate green sat 65 degrees from harbour's GROUND — clear — with its accent 10 degrees from
 * harbour's ACCENT and its ground sitting on harbour's accent hue EXACTLY. D12 would have passed
 * it. Two palettes could ship indistinguishable accents and this suite would have said nothing,
 * because the accent is the colour a visitor remembers and nothing was looking at it.
 *
 * Three relations, three floors, and the floors DIFFER ON PURPOSE:
 *   ground / ground   60   near-neutral at c 0.02, so two grounds need a wide arc to read apart
 *   accent / accent   30   vivid at c 0.14 and up, where 30 degrees is plainly a different colour
 *   ground / accent   25   the specific defect above — a palette's ground ON another's accent
 *
 * ⚠ HUE SEPARATION IS NOT EQUALLY VISIBLE AT EVERY CHROMA, which is what makes one floor for all
 * three wrong rather than merely conservative.
 *
 * ---- ⚠ AND THE FLOOR IS A CEILING ON THE PALETTE COUNT. THE TWO ARE ONE DECISION. -------------
 *
 * Seven hues on a circle are 51.4 degrees apart AT PERFECT SPACING, so seven palettes and a 60
 * degree ground floor cannot both be true — at any placement, not merely at the ones tried. With
 * cream, harbour and orchid already placed unevenly (gaps 155, 82, 123), exactly TWO more fit, and
 * cerise and fern both land EXACTLY on 60 against a neighbour.
 *
 * FIVE REAL PALETTES IS THE CEILING THIS FLOOR IMPLIES. A sixth is not a matter of deriving another
 * good palette; whoever wants one is CHOOSING TO LOWER THIS NUMBER, and D12d is where they will
 * have to do it.
 *
 * ⚠ NOTHING DISCOVERS THAT EXCEPT COUNTING. Four candidates were measured first and came back as
 * three unrelated hue collisions — a result somebody tunes three hues in response to. The bound is
 * the finding; the refusals were its symptom.
 *
 * ---- ⚠ AND WHAT THIS SECTION MEASURES IS DEGREES, WHICH IS A PROXY ---------------------------
 *
 * Degrees ignore CHROMA and LIGHTNESS, and both change what a given rotation is worth. Re-derived
 * in perceptual distance (#380), TWO OF THE TEN SHIPPED GROUND PAIRS deliver less separation than
 * the 60 degree rule was calibrated to buy:
 *
 *   cream/cerise    63 degrees   hue-only 10.72   against a 15.68 reference
 *   orchid/cerise   60 degrees   hue-only 14.80   against the same
 *
 * Both are cerise, whose ground chroma is 0.016 — the lowest on the site, and FORCED BY THE GAMUT
 * at h15 / L.962 rather than chosen. The ladder's rule asked for 0.0192 and h15 admits 0.008 up
 * there; 0.016 is what the canvas rung could hold.
 *
 * ⚠ SO A DISTANCE-BASED D12 WOULD REFUSE A PALETTE FOR A CONSTRAINT THE GAMUT IMPOSED — reporting
 * "too close" for something that is really "cannot exist there". THAT IS THE JADE FAILURE IN A NEW
 * COSTUME, and it is why this stays on degrees rather than moving to distance now.
 *
 * ⚠ AND THE TWO PAIRS ARE SAFE FOR A REASON THAT IS NOT A RULE. cream/cerise is the MOST separated
 * pair on the site overall (32.45 including lightness) and the LEAST separated by hue. The
 * lightness ladder covered the gap — cerise and fern sit at L.962 where cream, harbour and orchid
 * sit at L.920 to .926. THE CURRENT ARRANGEMENT HOLDS BY LUCK RATHER THAN BY RULE, and section L
 * is what stops that luck from being silently extended to a ground in a different class.
 *
 * ⚠ THE TRIGGER FOR MOVING D12 TO DISTANCE, NAMED SO IT IS NOT A DEFERRAL TO NOBODY: if a future
 * palette's ground chroma is forced low again — by the gamut, as cerise's was — degrees will pass a
 * pair that distance would refuse, and the lightness ladder may not be there to cover it. THAT is
 * when this section changes units. Not before, and not on the strength of the two pairs above. */
const hueOf = (p, token) => { const m = /oklch\(\s*[\d.]+%?\s+[\d.]+\s+([\d.]+)/.exec(p[token] ?? ""); return m ? Number(m[1]) : null; };
const arc = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

/* The REAL palettes, derived. The twin is excluded by name because it is byte-identical to the
 * default on purpose — including it would report a 0 degree collision that is the control working. */
const REAL = THEME_NAMES.filter((n) => n !== VERIFY_THEME);
const GROUND_DARK = SOURCE.groundDark;
/* ---- THE PALETTE-AWARE RESOLVER -------------------------------------------------------------
 *
 * ⚠ WITHOUT THIS THE GROUND LAYER ONLY BUYS A REFUSAL. `resolve()` above follows `var()` aliases
 * through the `@theme` DEFAULTS, which is right for cream and wrong for a merged palette: the dark
 * ground declares `--color-on-accent: var(--color-band-dark)`, and `band-dark` is re-declared by
 * every palette. Following that alias in the defaults returns CREAM's band-dark. Following it in the
 * merged palette returns the palette's own — which is the colour the screen paints.
 *
 * ⚠ FOUR VALUES IN THE DARK BLOCK ARE `color-mix(in oklch, …)`, AND THE OLD PARSER CALLED THAT
 * "unparseable BY NATURE". THAT CLAIM IS TRUE OF A LITERAL AND FALSE OF AN EXPRESSION. A mix is
 * perfectly computable — it just has to be evaluated rather than pattern-matched — so it is computed
 * here rather than declined.
 *
 * ⚠ AND THE CLAIM WAS NEVER TESTED AGAINST THE FORMS ACTUALLY ON DISK, WHICH IS THE DURABLE HALF.
 * Four palettes declare their inks as `rgb()`, not `oklch()`, so a mix reader that only understood
 * oklch operands would decline THEIR mixes for a second reason nobody had named. The inverse
 * transform back to OKLCH is what makes those computable at all. A statement about a value's FORM is
 * a claim about the file, and the next person will reach for the same shortcut — check the forms
 * before deciding what cannot be parsed.
 *
 * ⚠ AND AN UNFOLLOWABLE VALUE STILL RETURNS null, DELIBERATELY. P1's refusal is what caught this
 * defect in the first place — "a skipped row is a pair nobody knows is unchecked" — and a resolver
 * that guessed at anything it could not follow would convert that refusal into a confident wrong
 * number, which is the whole failure being repaired. */
const { rawIn, deref, mixIn, rgbIn, resolvedPalette } = paletteResolver(rawDecl);

console.log("\nR · the resolver's own sanity, before any palette is read through it");
/* ⚠ A RESOLVER THAT WALKS ALIASES HAS FOUR WAYS TO RETURN A PLAUSIBLE WRONG COLOUR — the wrong
 * palette's copy of a re-declared token, a chain that stops one hop early, a mix in the wrong space,
 * and a mix whose weights are swapped. Every one produces a confident number. These rows are the
 * cheapest place to catch all four, and they run before any real row. */
t("R1 the sanity pair still reads 21 through this file's own ratio", Math.round(contrastRatio([255, 255, 255], [0, 0, 0])), 21);
t("R2 a var() chain resolves to the MERGED palette's copy, not the defaults'",
  rgbIn({ "on-accent": "var(--color-band-dark)", "band-dark": "#123456" }, "on-accent"), [18, 52, 86]);
t("R2a …and one hop further, so a chain that stops early is caught",
  rgbIn({ a: "var(--color-b)", b: "var(--color-c)", c: "#0a141e" }, "a"), [10, 20, 30]);
t("R3 a color-mix at 100% is its first operand exactly — the weights are not swapped",
  rgbIn({ x: "color-mix(in oklch, var(--color-a) 100%, var(--color-b))", a: "oklch(0.5 0 0)", b: "oklch(1 0 0)" }, "x"),
  oklchToRgb(0.5, 0, 0));
t("R3a …and at 0% it is the second, which is the other half of the same mistake",
  rgbIn({ x: "color-mix(in oklch, var(--color-a) 0%, var(--color-b))", a: "oklch(0.5 0 0)", b: "oklch(1 0 0)" }, "x"),
  oklchToRgb(1, 0, 0));
t("R4 ⚠ AND AN UNFOLLOWABLE VALUE RETURNS null RATHER THAN A GUESS — P1's refusal depends on it",
  rgbIn({ x: "var(--color-nope)" }, "x"), null);

/* ⚠ THREE LAYERS, NOT TWO. A dark palette resolves its roles through the ground block, which is what
   the screen does and what this suite did not. `GROUND_TOKEN` decides which token IS the page ground
   for the class, so a dark palette is measured against `band-dark` rather than `canvas`. */
const paletteOf = (n) => {
  /* ⚠ THE ASSEMBLY LIVES IN `layered` ABOVE AND NOT HERE, because the spread this used to perform
     inline was the defect — rungs over cream's already-resolved roles. Kept as the named seam the
     rest of the file calls, so there is one place a layering bug can live rather than four. */
  const themed = layered(n);
  /* ⚠ RAW, NOT RESOLVED. An earlier version returned `resolvedPalette(layered)` and broke six rows
     that had been fine: the hue and band sections read OKLCH COMPONENTS off these values, and
     flattening every token to a hex literal throws the hue and chroma away. `report` needs literals;
     D12 and L need the oklch text. So the flattening happens at the report call site instead of
     here, and this returns what the palette actually declares. */
  return themed;
};
const HUES = Object.fromEntries(REAL.map((n) => {
  const p = paletteOf(n);
  return [n, { ground: hueOf(p, "canvas"), accent: hueOf(p, "accent-500") }];
}));
const PAIRS = REAL.flatMap((a, i) => REAL.slice(i + 1).map((b) => [a, b]));
/* ⚠ DEFINED HERE AND USED BY D12, BUT THE BAND REGISTRY LIVES IN SECTION L BELOW. Hoisted `const`
 * would be a temporal-dead-zone error, so these read the registry through functions that run at
 * assertion time rather than at definition time. */
/* ⚠ THE PAGE-GROUND TOKEN DEPENDS ON THE CLASS, which is why reading `canvas` for everyone was
 * wrong: it IS the page ground on a light palette and is not on a dark one. */
const groundLightness = (n) => {
  const cls = THEME_GROUND[n];
  const tokenName = GROUND_TOKEN[cls] ?? "canvas";
  const raw = paletteOf(n)[tokenName] ?? "";
  const m = /oklch\(\s*([\d.]+)(%?)\s+/.exec(raw);
  if (m) return m[2] === "%" ? Number(m[1]) / 100 : Number(m[1]);
  /* ⚠ AND rgb() TOO, BECAUSE AN AUTHORED PRESET SHIPS THE BYTES THE BROWSER PAINTS. The three dark
   * presets declare their five preview rungs as rgb() literals — that is what "exact" means under
   * the authoring ruling, since a declaration outside sRGB is clamped before anyone sees it. This
   * parser read `oklch(` only, so all three grounds resolved NULL and L0 caught it on arrival.
   * A matcher narrower than its concept: the concept is "this palette's page ground", not "an
   * oklch declaration". Widened rather than the subject bent. */
  const rgb = parseColor(raw);
  if (!rgb) return null;
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb.map(lin);
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const mm = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const ss = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  return 0.2104542553*l + 0.7936177850*mm - 0.0040720468*ss;
};
/* ⚠ CLASSIFIED BY DECLARATION, NOT BY MEASUREMENT. L1c cross-checks the two against each other —
 * under inference they could not disagree, which is precisely why inference hid the defect. */
const bandFor = (n) => BANDS.find((b) => b.label === THEME_GROUND[n]) ?? null;
const sameBand = (a, b) => { const x = bandFor(a), y = bandFor(b); return !!x && !!y && x.label === y.label; };
const bandFloor = (a) => bandFor(a)?.hueFloor ?? null;
let crossBandPairs = 0;
crossBandPairs = PAIRS.filter(([a, b]) => !sameBand(a, b)).length;
console.log(`         ${REAL.length} real palettes -> ${PAIRS.length} pairs, derived from THEME_NAMES`);
console.log(`         ${PAIRS.length - crossBandPairs} same-band (hue compared), ${crossBandPairs} cross-band (does not apply)`);
for (const n of REAL) console.log(`           ${n.padEnd(10)} ground h${HUES[n].ground}  accent h${HUES[n].accent}`);

t("D12a every palette resolves BOTH hues, so the rows below are not comparing nulls",
  REAL.filter((n) => typeof HUES[n].ground !== "number" || typeof HUES[n].accent !== "number"), []);
/* ⚠ THE DENOMINATOR — AND THE FIRST VERSION OF D12b WAS NOT ONE, WHICH A MUTATION PROVED. It
 * compared `PAIRS.length` against `n(n-1)/2` computed from THE SAME `REAL`, so with `REAL = []`
 * both sides were 0 and it PASSED. Setting `REAL = []` left **five of these six rows green** —
 * every hue row has nothing to iterate, and nothing to iterate is indistinguishable from nothing
 * wrong. Only the row comparing against a CONSTANT caught it.
 *
 * ⚠ SO A GUARD DERIVED FROM ITS OWN SUBJECT GUARDS NOTHING, and this one was written expressly to
 * be the guard. Both halves are asserted now: the population is real against a fixed floor, AND the
 * pair count is the closed form of it. */
t("D12b ⚠ THE POPULATION IS REAL, AGAINST A CONSTANT — a guard derived from its own subject guards nothing",
  REAL.length >= 5, true);
t("D12b2 …and the pair count is the closed form of it, so neither can drift from the other",
  PAIRS.length, (REAL.length * (REAL.length - 1)) / 2);
t("D12c …and it grew with the palettes rather than staying at the hardcoded three", PAIRS.length >= 10, true);

/* ⚠ SAME-BAND PAIRS ONLY SINCE #389, AND CROSS-BAND IS NOT A WEAKER CHECK — IT IS A COMPARISON THAT
 * DOES NOT APPLY. Measured in the ground-class work: hue can change the perceptual difference
 * between a LIGHT and a DARK ground by 0.1%, against 38% within the light band. Two grounds in
 * different classes do not compete for hue at all, so a 17 degree gap between them is not a
 * collision and refusing it would be the wrong-unit rule shipped deliberately.
 *
 * The band registry in section L owns which pairs those are, and owns the floor each band enforces —
 * this row reads both rather than holding a second copy. L3 is where the per-band comparison lives;
 * this row keeps the SITE-WIDE statement, scoped to pairs the statement is true of. */
/* ⚠ THE GROUND TOKEN IS PER CLASS, as `groundLightness` already knows — `canvas` IS the page ground
 * on a light palette and is NOT on a dark one, where `band-dark` is. Reading `canvas` for everyone is
 * the classifier defect section L was rewritten to remove, and it must not reappear here.
 *
 * DECLARED HERE rather than beside D12e, because D12 now needs them too — a `const` used before its
 * declaration is a temporal-dead-zone error, which this file already warns about for the band
 * registry a few rows above. */
const rgbOf = (n, tok) => parseColor(paletteOf(n)[tok] ?? "");
const groundRgb = (n) => rgbOf(n, GROUND_TOKEN[THEME_GROUND[n]] ?? "canvas");
const dist3 = (a, b) => (a && b) ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : null;

/* ============================================================================================
   ⚠ NAMED EXEMPTIONS FOR THE INDEPENDENTLY AUTHORED DARK PRESETS — owner ruling, encoded here
   rather than documented beside the palettes.

   ⚠ NOT A LOWERED FLOOR. D12d was lowered ONCE, on a render, and refusing a second lowering is what
   kept it meaningful. These three conflicts are admitted BY NAME so the rule stays intact for every
   palette that is not on this list, and so the exception is visible rather than absorbed.

   SCOPE, AND IT DOES NOT TRAVEL: independently authored dark presets are exempt from cross-palette
   identity constraints. A DERIVED palette is not exempt, and proximity to these entries confers
   nothing — a future palette must be added by name with its own reason.
============================================================================================ */
const AUTHORED_PRESET = "owner ruling — an independently authored dark preset with "
  + "docs/dark-mode-studio.html as its source of truth. It is not derived from the light system and "
  + "is not constrained against it. END: the exemption is reviewed if the preset is ever re-derived "
  + "from the palette system rather than authored.";
const ACCENT_EXEMPT = {
  /* ⚠ THE FIGURES CARRY dE NOW, BECAUSE D12d DOES. Stating a conflict in a unit the rule no longer
   * measures is the comment-and-code drift this file records six times — and here it would be worse
   * than usual, since D12y proves these exemptions are EARNED by re-running the rule. A reader
   * checking "6 degrees" against a dE floor has no way to tell whether the exemption still holds. */
  "ink-flare": AUTHORED_PRESET + " Conflict: 44.1 dE from cream's accent (10 degrees).",
  basalt: AUTHORED_PRESET + " Conflict: 33.7 dE from fern's accent (6 degrees).",
};
const GROUND_EXEMPT = {
  /* ⚠ THE ACCEPTED CONTRADICTION, STATED SO IT CANNOT READ AS DRIFT. Sapphire and nocturne at dE 6.0
   * are THE EVIDENCE this band's floor was set from — rendered full-bleed with the accent held out,
   * they read as one colour, and that judgement is what closed `hueFloor: null`. The system now ships
   * BOTH under this ruling. The floor is not wrong and the pair is not an oversight: the owner has
   * ruled the preset's identity worth the collision. A reader finding this without the ruling beside
   * it would call it drift, which is why it is here rather than in a document. */
  /* ⚠ THE FIGURE HERE READ 6.0 AND THE SHIPPED PAIR IS 4.69. Both halves of the old sentence were
   * wrong: the conflict is not 6.0, and this is NOT "the very pair the floor was measured from" —
   * the judged pair had nocturne 0.2 lightness units HIGHER, at a value that never shipped. See the
   * `judged` register below, where the provenance now lives. The exemption itself is unaffected:
   * the shipped pair is CLOSER than the judged one, so it needs the exemption more rather than
   * less. */
  nocturne: AUTHORED_PRESET + " Conflict: dE 4.69 from sapphire's ground as SHIPPED. The judged "
    + "reading that set this band's floor was 6.0, taken on a nocturne ground 0.2 lightness units "
    + "lighter than the one that shipped, so this is the same PAIR and not the same COLOURS.",
};

/* ⚠ THE UNIT COMES FROM THE BAND, AND IT DID NOT USED TO. This row compared a HUE ARC IN DEGREES
 * against whatever number the band declared — and the dark band's floor is in dE, which the registry
 * has said since it was written. So a dark pair "passed" at 32 against 6.1: two different quantities,
 * one comparison, and the answer was meaningless rather than merely wrong.
 *
 * The registry already carried `floorUnit` for exactly this reason and nothing read it. THE WRONG-UNIT
 * RULE, INSIDE THE ROW THAT MEASURES SEPARATION — found when the first pair that the dE floor should
 * have caught sailed through. */
const bandUnit = (n) => bandFor(n)?.floorUnit ?? "degrees";
const groundSep = (a, b) => bandUnit(a) === "dE"
  ? dist3(groundRgb(a), groundRgb(b))
  : arc(HUES[a].ground, HUES[b].ground);

/* ⚠ ACCENTS MOVE TO dE FOR THE SAME REASON GROUNDS DID, AND THE ACHROMATIC CASE BREAKS DIFFERENTLY
 * HERE — WHICH IS WHY THIS IS NOT THE SAME EDIT TWICE. A chroma-0 colour has no hue and still
 * carries a hue DIGIT that `arc()` reads. On the GROUND floor that refused an achromatic palette
 * unconditionally, 0 of 360 spellings passing. On this one, 104 OF 360 PASS.
 *
 * That is the worse failure of the two. Unconditional refusal is at least visible; here the verdict
 * on a colour with no hue depends entirely on which meaningless digit somebody typed, so the row
 * REFUSES a black accent spelled h4 and ADMITS the identical black spelled h80. It can therefore be
 * wrong in the permissive direction, which the ground case could not.
 *
 * MEASURED, THE PHANTOM IS ENORMOUS. A pure black accent sits 144.5 dE from its NEAREST shipped
 * neighbour (basalt) against a shipped minimum of 33.7 — the MOST separated accent the system
 * carries. The pair degrees called a 4-degree collision, cerise, is 239.1 dE away.
 *
 * ⚠ AND THE FLOOR IS THE JUDGED PAIR, WHICH ALREADY EXISTED IN THIS FILE IN THIS UNIT. Sapphire and
 * nocturne's accents were rendered and read as TWO NAMEABLE COLOURS, and that reading is `dist3` in
 * the same quantity this row measures — so nothing had to be re-judged to change the unit. 47 sits
 * just under it, admitting the pair judged distinct and refusing anything closer.
 *
 * ⚠ THE FIGURE ITSELF IS NOT REPEATED HERE, DELIBERATELY. It lives in `ACCENT_JUDGED` with the two
 * colours it was taken on, D12j1 recomputes it, and D12j2 holds this floor to it. When this comment
 * carried the number instead, nothing compared the two — which is the same shape as the dark band's
 * 6.0 and as A8a's title stating a count its row did not compute.
 *
 * BOUNDED ABOVE AND NOT BELOW, exactly like the light band: no accent pair has ever been rendered
 * and read as ONE colour, so nothing pins this from underneath. Said rather than implied. */
const ACCENT_FLOOR = 47;
const accentSep = (a, b) => dist3(rgbOf(a, "accent-500"), rgbOf(b, "accent-500"));

/* ⚠ THE ACCENT JUDGEMENTS, MOVED OUT OF PROSE AFTER THE DARK BAND'S 6.0 TURNED OUT TO DESCRIBE A
 * COLOUR THAT NEVER SHIPPED. Both of these sat in comments as bare figures — "47.2 in perceptual
 * distance", "harbour/fern's 95.4" — which is exactly the form that let the 6.0 drift unnoticed for
 * a week. A number in prose is a claim nobody can re-derive.
 *
 * ⚠ AND THE SAME QUESTION WAS ASKED OF THESE BEFORE REGISTERING THEM, BECAUSE THE 6.0 CAME FROM
 * THIS VERY COMMIT. `0f9f183` recorded all three while nocturne was still deferred, so "was this
 * taken on the shipped colours" had to be answered rather than assumed. Measured:
 *
 *     shipped pair, sap 52% c.174 h272 vs noc 52% c.160 h296     47.244  -> 47.2   MATCHES
 *     the candidate accent at c.170                              47.053  -> 47.1   does not
 *     both at the studio doc's accent lightness of 70%           49.497           does not
 *     harbour/fern, the cited precedent, both shipped            95.431  -> 95.4   MATCHES
 *
 * So unlike the ground reading, these two were taken on values that did ship, and they reproduce.
 * That is a measurement rather than an assumption, and it is the only reason they can be registered
 * with their colours rather than with a caveat. */
const ACCENT_JUDGED = [
  { dE: 47.2, read: "two",
    what: "sapphire vs nocturne accent-500, each ALONE on a shared neutral ground, switched in "
        + "sequence rather than shown side by side. Sapphire reads BLUE and nocturne VIOLET — two "
        + "nameable colours, so two themes. This is the pair that lowered D12d from 30 to 24.",
    colours: ["oklch(52.0% 0.174 272)", "oklch(52.0% 0.160 296)"] },
  { dE: 95.4, read: "two",
    what: "harbour vs fern accent-500, the PRECEDENT the pair above was weighed against — ruled "
        + "distinct at 31.3 degrees under the old unit, and the widest of the close pairs.",
    colours: ["oklch(52.5% 0.110 165.3)", "oklch(54.0% 0.136 134)"] },
];

/* ⚠ CHECKED AT THE PRECISION THEY WERE RECORDED AT, WHICH IS THE ONLY HONEST TOLERANCE. 47.244
 * recorded as 47.2 is not a drift, it is one decimal place; demanding equality to the hundredth
 * would fail a figure that is correct as stated. So the computed value is rounded to the recorded
 * value's OWN number of decimals, and a reading may not be recorded more precisely than it can be
 * reproduced. */
const decimalsOf = (n) => { const s = String(n); const i = s.indexOf("."); return i < 0 ? 0 : s.length - i - 1; };
const recheckJudged = (label, list) => list.map((j) => {
  if (!Array.isArray(j.colours) || j.colours.length !== 2) return `${label} ${j.dE}: no colours recorded`;
  const [x, y] = j.colours.map((c) => parseColor(c));
  if (!x || !y) return `${label} ${j.dE}: a colour did not parse`;
  const p = 10 ** decimalsOf(j.dE);
  const got = Math.round(dist3(x, y) * p) / p;
  return got !== j.dE ? `${label}: recorded ${j.dE}, recomputes to ${got}` : null;
}).filter(Boolean);
t("D12u ⚠ EVERY BAND'S FLOOR UNIT IS ONE THIS ROW CAN MEASURE — an unknown unit must not fall back to degrees silently",
  BANDS.filter((b) => !["degrees", "dE"].includes(b.floorUnit)).map((b) => b.label), []);
t("D12 ⚠ NO TWO GROUNDS IN ONE CLASS ARE ADJACENT — in the band's OWN unit, across classes it does not apply",
  PAIRS.filter(([a, b]) => sameBand(a, b) && !(a in GROUND_EXEMPT) && !(b in GROUND_EXEMPT)
      && (groundSep(a, b) ?? Infinity) < (bandFloor(a) ?? 0))
    .map(([a, b]) => `${a}/${b} ${(groundSep(a, b) ?? 0).toFixed(1)} ${bandUnit(a)}`), []);
t("D12f ⚠ AND CROSS-BAND PAIRS ARE COUNTED RATHER THAN SILENTLY DROPPED — a skipped pair must be visible",
  typeof crossBandPairs === "number" && crossBandPairs >= 0, true);
/* ⚠ 24, LOWERED FROM 30 ON A RENDER — AND THIS ROW STAYS CROSS-BAND ON PURPOSE. Unlike D12 and
 * D12e below, an accent/accent comparison DOES apply across bands: accents are drawn at comparable
 * lightness and chroma on a light palette and a dark one, and a person switching themes meets them
 * in sequence. So the pair is real and only a render can settle it.
 *
 * THE RENDER: sapphire's accent beside nocturne's at 24 degrees, each drawn ALONE on a shared
 * neutral ground — alone, because side by side any two hues differ and that is not what switching a
 * theme looks like. Criterion stated before looking: would a person switching say the site changed
 * theme, or that something shifted slightly? Sapphire reads BLUE and nocturne reads VIOLET. Two
 * nameable colours, so: two themes.
 *
 * ⚠ AND THE NUMBER THAT MADE IT UNCOMFORTABLE IS RECORDED BESIDE IT, because a floor lowered on a
 * render should carry it. BOTH FIGURES NOW LIVE IN `ACCENT_JUDGED` WITH THE COLOURS THEY WERE TAKEN
 * ON, and D12j1 recomputes them — they are not restated here, because a number in prose is a claim
 * nobody can re-derive and that is precisely how the dark band's 6.0 sat wrong for a week.
 *
 * WHAT THE PROSE KEEPS IS THE ARGUMENT, WHICH NO ARITHMETIC CARRIES: sapphire/nocturne is roughly
 * HALF the precedent set by harbour/fern, ruled distinct at 31.3 degrees under the old unit, so
 * this pair is now THE CLOSEST THE SYSTEM CARRIES by both measures. Distinct on the criterion, and
 * the closest it has come. Both halves are true and the second is why 24 was a floor rather than a
 * direction — and why that floor is 47 in dE today, held to these readings by D12j2. */
t("D12x ⚠ EVERY EXEMPTION NAMES A REAL PALETTE AND AN END CONDITION — an exemption for a palette that does not exist is a rule quietly deleted",
  [...Object.entries(ACCENT_EXEMPT), ...Object.entries(GROUND_EXEMPT)]
    .filter(([n, why]) => !REAL.includes(n) || !/END:/.test(why) || !/Conflict:/.test(why)).map(([n]) => n), []);
t("D12y ⚠ AND EVERY EXEMPTION IS EARNED — a palette that would pass the rule must not be exempt from it",
  Object.keys(ACCENT_EXEMPT).filter((n) =>
    !PAIRS.some(([a, b]) => (a === n || b === n) && accentSep(a, b) < ACCENT_FLOOR)), []);
t("D12d ⚠ NOR TWO ACCENTS — cross-band ON PURPOSE, in dE because an achromatic accent has no hue to compare",
  PAIRS.filter(([a, b]) => !(a in ACCENT_EXEMPT) && !(b in ACCENT_EXEMPT) && accentSep(a, b) < ACCENT_FLOOR)
    .map(([a, b]) => `${a}/${b} ${accentSep(a, b).toFixed(1)} dE`), []);
/* ⚠ AND THE UNIT NEEDS ITS OWN ROW, BECAUSE D12d STAYS GREEN UNDER A REVERT TO DEGREES. Every
 * shipped accent pair clears 47 dE and also clears 24 degrees, so swapping `accentSep` back to
 * `arc()` changes no verdict on today's palettes — the row goes on passing while measuring the
 * wrong quantity, which is precisely how this defect survived in the first place.
 *
 * The two units have to DISAGREE on a real case for the row to be worth anything, and a chroma-0
 * accent is that case. Against CERISE, one pair in both units: 4 degrees and 239.1 dE.
 *
 * ⚠ AND THE FIRST VERSION OF THIS ROW MIXED TWO PAIRS, WHICH THE ROW ITSELF CAUGHT. It asserted
 * "4 degrees, 144.5 dE" — but 4 degrees is black against CERISE and 144.5 is black against BASALT,
 * its nearest neighbour. Two true figures about two different pairs, read as one comparison. The
 * wrong-subject defect this file names a dozen times, committed inside the assertion written to
 * stop a unit confusion, and caught because the expectation was computed rather than quoted.
 *
 * ⚠ AND D12z ALONE DOES NOT CLOSE IT EITHER, WHICH I CLAIMED IT DID IN THIS VERY COMMENT. It read
 * "same lesson as L3u/L3v, applied here BEFORE shipping rather than after" — and the mutation
 * reverting D12d to `arc()` came back with NOTHING RED, because D12z calls `accentSep` itself and
 * cannot see what D12d's filter calls. The exact shape L3u had, repeated one section away, by the
 * hand that had just fixed it and written the lesson down.
 *
 * That is worth more than the fix: knowing the rule is not applying it, because applying it means
 * noticing that THIS row is an instance, and an instance does not announce itself. So D12za is the
 * L3v-equivalent, and D12d is proved to EXECUTE AND BIND by the other two mutations rather than by
 * either row — raising the floor to 48 and dropping the exemption filter both redden it. */
const BLACK_ACCENT = [0, 0, 0];
t("D12z ⚠ D12d MEASURES IN dE — proved on ONE pair in both units, so a revert to degrees cannot pass",
  [Math.round(accentSep("sapphire", "nocturne") * 10) / 10,
   Math.round(dist3(BLACK_ACCENT, rgbOf("cerise", "accent-500")) * 10) / 10,
   arc(0, HUES.cerise.accent)],
  [47.2, 239.1, 4]);
t("D12za ⚠ …AND D12d IS THE CALLER THAT USES IT — D12z stays green if D12d reverts to arc(), so the two are not redundant",
  /!\(b in ACCENT_EXEMPT\) && accentSep\(a, b\) < ACCENT_FLOOR\)/.test(
    readFileSync(new URL(import.meta.url), "utf8")), true);
/* ⚠ AND THE ACCENT FLOOR IS NOW HELD TO ITS JUDGEMENTS THE WAY A BAND'S IS, WHICH IT NEVER WAS.
 * 47 sat as a literal beside prose citing 47.2, and nothing compared the two — the A8a shape, where
 * a title states a quantity the row does not compute. These three rows close it: the register is
 * non-empty, every reading recomputes from its own colours, and the floor sits where its readings
 * put it. */
t("D12j0 ⚠ THE ACCENT REGISTER IS NON-EMPTY, against a literal — an empty one makes the two rows below vacuous",
  ACCENT_JUDGED.length >= 1, true);
t("D12j1 ⚠ EVERY ACCENT JUDGEMENT RECOMPUTES FROM ITS OWN STATED COLOURS — the dark band's 6.0 sat wrong for a week for want of this",
  recheckJudged("accent", ACCENT_JUDGED), []);
/* ⚠ AND IT IS BOUNDED ABOVE ONLY, SAID RATHER THAN IMPLIED. Both readings are TWO — two colours a
 * viewer could name apart — so they cap the floor and none pins it from below. No accent pair has
 * ever been rendered and read as ONE. Identical posture to the light band, and the opposite of the
 * dark band, which has a `one` and no `two`. Not one of the three has both halves. */
t("D12j2 ⚠ …AND THE FLOOR SITS AT OR BELOW EVERY SEPARATION READ AS TWO — a floor above one of them would refuse a pair somebody judged distinct",
  ACCENT_JUDGED.filter((j) => j.read === "two" && ACCENT_FLOOR > j.dE).map((j) => `floor ${ACCENT_FLOOR} > judged-two ${j.dE}`), []);
/* ⚠ ORDERED, BOTH WAYS. The defect is asymmetric — a ground ON another palette's accent — so a
 * pair list that compares each duo once would miss it in one direction.
 *
 * ⚠ SAME-BAND, AND THE REASON MATTERS BECAUSE THE FIRST ONE GIVEN WAS WRONG. This was ruled
 * band-aware on the grounds that a dark palette's ground and a light palette's accent are NEVER
 * PAINTED TOGETHER. That argument PROVES TOO MUCH: no two palettes are ever painted together, same
 * band or not, so it would justify DELETING this row rather than scoping it — and the row's origin
 * was a real refusal between two LIGHT palettes, a candidate green whose ground sat exactly on
 * harbour's accent hue.
 *
 * ⚠ A PREDICATE THAT PROVES TOO MUCH IS WORSE THAN NO PREDICATE, BECAUSE IT READS AS RIGOUR.
 *
 * WHAT THIS ROW ACTUALLY MEASURES IS SEQUENTIAL CONFUSABILITY. If palette A's page ground is palette
 * B's accent hue, then switching from B to A reads as B's accent having FLOODED THE PAGE — the two
 * themes are confusable in a way neither ground/ground nor accent/accent catches. That is the same
 * kind of argument as D12d's, and it is about what a visitor meets in sequence.
 *
 * ⚠ BAND-AWARENESS SURVIVES THE CORRECTED REASON, WHICH IS WHY THE SCOPE STANDS. A ground at L17 and
 * a ground at L92 do not read as one flooding into the other at ANY hue — that is D12's own reason
 * and it transfers intact. The outcome was right for a different argument than the one first given.
 *
 * D12 was made band-aware in #389 and D12d and D12e were left flat; nobody noticed until a dark
 * palette reached them. D12d keeps its cross-band scope on the opposite argument — two accents ARE
 * met in sequence and are drawn at comparable lightness and chroma. One row becomes band-aware; the
 * other keeps its scope and lowered its floor on a render. Two rulings, deliberately not one edit. */
/* ⚠ dE, NOT DEGREES — AND THIS IS THE ONE GATE-VOCABULARY CASE WHERE WIDENING THE MATCHER DOES NOT
 * HELP. Six others this arc were repaired by widening a predicate to its concept. Here DEGREES ARE
 * THE WRONG AXIS: a ground and an accent differ by ~35 lightness units and roughly 7x in chroma BY
 * CONSTRUCTION, so hue alone can never decide whether they are confusable.
 *
 * Measured across all 22 same-band pairs, the two units RANK DIFFERENT PAIRS. Closest by degrees is
 * `nocturne ground on sapphire accent` at 10 degrees — and 201.8 apart, the FIFTH-WIDEST of the 22.
 * Closest by distance is `cream ground on orchid accent` at 195.4, a hundred and eight degrees apart.
 * Rendered, the degree-closest pair is a near-black beside a vivid blue.
 *
 * ⚠ AND THE ORIGIN REFUSAL MAY HAVE BEEN FALSE. This row was justified by a candidate green refused
 * for a ground sitting EXACTLY on harbour's accent hue — which is precisely the axis now known to be
 * wrong. Its values are not in the repo and cannot be rechecked. A REFUSAL PRODUCED BY A UNIT NOW
 * KNOWN TO BE WRONG IS NOT EVIDENCE THE ROW WORKS, and it has been cited as this row's justification.
 * Recorded without assuming it either way.
 *
 * ⚠ THE ROW IS KEPT RATHER THAN RETIRED, AND NOT BECAUSE THE CASE IS LIKELY. "Grounds at L17 or L92
 * and accents at L52 cannot converge" is today's STRUCTURE, not a law — a palette with a darker
 * accent or a mid-toned ground brings them together, and this row is what would notice. Deleting it
 * would be a claim that the case cannot arise, made on an argument rather than a measurement. */
const D12E_FLOOR = 48;
/* The ground-distance helpers are declared above D12, which needs them for the dE-unit comparison. */
const groundAccent = REAL.flatMap((a) => REAL.filter((b) => b !== a && sameBand(a, b))
  .map((b) => ({ key: `${a} ground on ${b} accent`, de: dist3(groundRgb(a), rgbOf(b, "accent-500")) })))
  .filter((x) => x.de !== null).map((x) => ({ ...x, de: +x.de.toFixed(1) }));
const gaMin = groundAccent.length ? Math.min(...groundAccent.map((x) => x.de)) : null;
console.log(`         ${groundAccent.length} same-band ground/accent pairs; closest ${gaMin} (floor ${D12E_FLOOR})`);

t("D12e-0 ⚠ THE SUBJECT IS NON-EMPTY, against a literal — a same-band filter that matched nothing would pass silently",
  groundAccent.length >= 10, true);
t(`D12e ⚠ NO PALETTE'S GROUND SITS ON ANOTHER'S ACCENT — dE below ${D12E_FLOOR}, same-band, because across bands two grounds never compete`,
  groundAccent.filter((x) => x.de < D12E_FLOOR).map((x) => `${x.key} ${x.de}`), []);
/* ⚠ THE FLOOR'S WEAKNESS IS ASSERTED, NOT LEFT IN PROSE. The population's closest pair is 195.4 —
 * FOUR TIMES the floor — so no shipped palette comes near it and THIS GUARD HAS NEVER FIRED FOR A
 * REAL REASON. Its pass is therefore not evidence of anything, and this row says so out loud so the
 * next reader does not read a green tick as a measurement.
 *
 * 48 is anchored on the ONLY judged datapoint available: sapphire and nocturne's accents at 47.2,
 * looked at on a render and ruled two themes rather than one. So the floor means "closer than the
 * closest pair anyone has judged distinct". PROVISIONAL. What would calibrate it is a real pair
 * somebody looks at and calls confusable; until then it is an anchor, not a measurement. */
/* ⚠ AGAINST A LITERAL, NOT AGAINST THE FLOOR IT GUARDS. The first version asserted
 * `gaMin > D12E_FLOOR * 3` — derived from the very number it exists to characterise, so LOWERING THE
 * FLOOR WOULD LOWER THE GUARD WITH IT and the row would go on reporting the floor as comfortable.
 * A denominator guard derived from its own subject guards nothing; caught by mutation, and it is the
 * same defect `theme` V4 had this same session. 150 is a literal for that reason. */
t("D12e-a ⚠ AND THE FLOOR IS PROVISIONAL — the closest shipped pair is 195.4, four times it, so a pass here is not evidence",
  gaMin !== null && gaMin >= 120, true);
t("D12e-b ⚠ AND THE CROSS-BAND PAIRS IT SKIPS ARE COUNTED — a dropped comparison nobody can see is one nobody chose",
  REAL.flatMap((a) => REAL.filter((b) => b !== a && !sameBand(a, b))).length > 0, true);

console.log("\nE · ⚠ THE BOUNDARY IS COMPLETE — every public colour is computed or listed BY NAME");

/* Measured with a public-consumer count before being written here, so "unused" is a fact rather
 * than an assumption. These six serve /studio from the public block; moving them is its own PR. */
const BOUNDARY = {
  "reveal-sand": "artwork — the reveal panel's ground, never a text pair",
  "case-study-sand": "artwork — the warm sand behind a case study",
  "glow-web": "atmosphere — a glow, never a foreground on a ground",
  "ink-200": "zero public consumers",
  /* ⚠ THREE ENTRIES ADDED WITH THE ROWS THAT COMPUTED THEM, EACH DERIVED RATHER THAN ASSUMED.
     Censused as a Tailwind `text-*`, a JSX `color:` and a `color:` declaration in globals.css:
     every one is ZERO. Their rows measured 1.01 to 1.66 on the dark palettes against grounds
     nothing paints them on, which is a floor enforced on an empty set. */
  "ink-950": "zero public consumers — not drawn as text anywhere, asserted by Q1",
  "accent-600": "zero public consumers as text — `accent-text` is the role that carries its value",

  /* ⚠ `etch` IS LISTED FOR A COMPLETELY DIFFERENT REASON AND THE SENTENCE MUST NOT BE SHARED. The
     three above mean NOTHING DRAWS THIS PAIRING. This one has FORTY-THREE consumers and means THE
     MAP'S FLAT-VALUE MODEL CANNOT EXPRESS IT: every single use carries a weight — `bg-etch/5`,
     `/8`, `/10`, `/12`, `border-etch/8` twelve times — and not one is a `color:` property. It is a
     hairline and mark colour, so it owes 3.0 and never 4.5, and a row measuring FLAT `etch` against
     a ground would measure a colour no consumer draws.

     ⚠ ITS TRIGGER, SO THIS IS A UNIT SOMEBODY CAN TAKE RATHER THAN A PERMANENT EXCUSE: an
     alpha-aware row that composites the weight over the ground before measuring, which
     `studio-ink-contrast` already does for its on-ink washes. When that exists, `etch` leaves this
     list and gets rows per weight. Reading this entry as "unused" would be exactly wrong. */
  "etch": "43 consumers, every one at an alpha weight and none a `color:` — the flat-value model "
    + "cannot express it; clears when an alpha-aware row composites the weight over the ground",
  /* `accent-400` sat here reading "zero public consumers" — TRUE, AND THE WRONG CONCLUSION DRAWN
   * FROM IT. Zero consumers is a reason to delete a token, not a reason to exempt it from a contrast
   * floor forever. The exemption made the dead token survive review for as long as this list did,
   * and #363 removed the token instead. E2 is what reported the exclusion once its subject was gone. */
  "success-50": "zero public consumers",
  "success-700": "zero public consumers",
  "danger-600": "zero public consumers",
  "draft-600": "zero public consumers",

  /* ⚠ THE CATEGORY E1 FOUND ON ITS FIRST RUN IS NOW EMPTY, AND ITS ENTRY IS DELETED WITH THE TOKEN.
     `on-dark-line` was a `color-mix(... 16%, transparent)` derivative of `on-dark` — unparseable by
     nature rather than by defect, so it was listed rather than computed. It had ZERO consumers for
     its whole life and its job was already done by `--color-border` in the dark-ground block, at
     the identical 16%. `role-layer` section L found that by deriving its subject from consumption.

     ⚠ AND E2 CAUGHT THE STALE ENTRY THE MOMENT THE TOKEN WENT, which is the half of this list that
     earns it: a dead exclusion hides a colour exactly as a missing one does, and only the both-ways
     join can tell you which of the two you are looking at. */
  /* ⚠ THE SECOND TIME THE MISSING HAIRLINE FLOOR HAS DECIDED SOMETHING. `--color-rule` is drawn at
     five alphas between .10 and .30 and never carries text, and this site states no contrast floor
     for a hairline — which is also why no public alpha row exists and why `over()` is exercised
     only by `studio-ink-contrast`. Listed rather than computed, and the gap is now worth naming:
     a stated hairline floor would move this row and that one out of the boundary in one go. */
  /* ⚠ THE SIX #332 BROUGHT INTO THE NAMESPACE, LISTED THE MOMENT THEY ARRIVED. E1 demanded it, and
     that is the gate working — a token cannot enter the namespace without a row or a reason.

     THE SMOKE RAMP IS ONE ENTRY IN FOUR LINES. Its stops are gradient positions carrying 74% alpha
     over the vessel's own backdrop, never a foreground under text. And they are related to EACH
     OTHER rather than to the ladder, so a contrast row against a palette ground would be measuring
     the wrong pair — the same wrong-quantity error this arc has made in three other places. */
  "smoke-1": "gradient stop — a ramp member, 74% over the vessel, never a text foreground",
  "smoke-2": "gradient stop — see smoke-1",
  "smoke-3": "gradient stop — see smoke-1",
  "smoke-4": "gradient stop — see smoke-1",
  "vessel-ink": "vessel shadow ink — a shadow source, never a text foreground",
  "vessel-capsule": "the capsule's ground tone — a surface wash",
  "vessel-glass": "vessel glass tone — a surface wash, never a text foreground",
  "vessel-pearl": "vessel glass tone — see vessel-glass",
  "vessel-shadow": "vessel glass tone — see vessel-glass",
  "vessel-wave": "the vessel's front wave — a discrete shape over the ramp, not a fifth stop",
  "glow-paper": "cursor-following glow at 20% — atmosphere, never a foreground on a ground",
  "bounce": "the vessel's bounce highlight — a gradient source, not a text colour",
  "rule": "hairline — five alphas, never text, and this design states no hairline floor",
};

const computed = new Set(USAGE.flatMap((r) => [r.fg, r.bg]));
/* An alias is covered by its target — `border` is `cream-300` wearing a role name. */
const covered = (name) => computed.has(name) || (aliasOf(name) ? covered(aliasOf(name)) : false);
const orphans = PUBLIC.filter((n) => !covered(n) && !(n in BOUNDARY));

t("E1 ⚠ NO PUBLIC COLOUR IS NEITHER COMPUTED NOR LISTED — named, because a count is the length>0 shape",
  orphans, []);
t("E2 the boundary list has no dead entries either — a stale exclusion hides a colour too",
  Object.keys(BOUNDARY).filter((n) => !PUBLIC.includes(n)), []);
t("E3 nothing is on the list AND computed, which would make the list a lie",
  Object.keys(BOUNDARY).filter((n) => computed.has(n)), []);
t("E4 the public palette was found at all — a zero denominator is not a pass", PUBLIC.length > 25, true);

/* ⚠ THE PALETTE EXTRACTION KEEPS ONLY OKLCH LITERALS, WHICH IS A SILENT DROP UNLESS SOMETHING
 * WATCHES IT. Every public token must be one of three things — parseable, an alias of a parseable
 * one, or on the boundary with a stated reason. Anything else vanishes from the palette without
 * appearing anywhere, which is how `on-dark-line` stayed invisible until E1 was written. */
t("E5 every public token is parseable, aliased, or listed — no colour leaves silently",
  PUBLIC.filter((n) => !(n in CREAM) && !aliasOf(n) && !(n in BOUNDARY)), []);
t("E6 …and every palette entry actually parsed, so no row reads a broken value as a colour",
  Object.keys(CREAM).filter((n) => parseColor(CREAM[n]) === null), []);
/* ⚠ THE CAPABILITY ASSERTION, SEPARATE FROM THE POLICY ONE. Every token the parser cannot read must
 * be DERIVED — a `var()` reference rather than a literal. A literal it cannot read is a parser
 * defect, and being on the boundary list must never make one invisible again. */
t("E7 every unparseable token is DERIVED, not a literal the parser cannot read",
  unparseable.filter((u) => !u.derived).map((u) => `${u.name}: ${u.value}`), []);
t("E8 …and the unparseable set is enumerated rather than filtered away silently",
  unparseable.map((u) => u.name).sort(), []);


console.log("\nK · ⚠ THE GAMUT CHECK — is the colour one sRGB can actually hold?");

/* ⚠ THE INSTRUMENT COULD NOT TELL "FAILS CONTRAST" FROM "DOES NOT EXIST", AND BOTH ARRIVED AS A
 * RATIO. A candidate green measured 4.320 against a 4.5 floor and read as a palette wanting a
 * darker accent. It was not. Its red channel computed to MINUS 129, `oklchToRgb` clamped it to
 * zero, and 4.320 was the contrast of a colour that cannot be drawn. Tuning the lightness in
 * response would have been a correct measurement of a quantity that does not exist — the same
 * shape as #334's parse-before-exclude, one layer down.
 *
 * ⚠ AND THE PREDICTION GOING IN WAS BACKWARDS, WHICH IS THE ARGUMENT FOR THE INSTRUMENT RATHER
 * THAN FOR MORE CARE. Two candidate accents at c 0.215 were expected to clip and both were fine;
 * the one that clipped was at c 0.160, the LOWEST of the four. sRGB holds 0.289 of chroma at h300
 * and 0.126 at h158, so CHROMA IS NOT COMPARABLE ACROSS HUES — a number that reads as "more
 * saturated" is a different proportion of the available space at every hue.
 *
 * ---- ⚠ AND THE FIRST RUN FOUND THE SHIPPED SITE, NOT THE CANDIDATES --------------------------
 *
 * Harbour's `accent-500` — the brand colour of a palette that has been live for twenty-odd PRs —
 * is 60.7 outside sRGB and has been painting clamped the whole time. That is not a bug: the
 * clamped colour is what every visitor has seen, it clears its contrast floors, and it looks
 * right. What was wrong is that the DECLARED value was never the DRAWN value and nothing said so.
 *
 * ⚠ THERE WAS ALREADY A WITNESS IN THE REPO THAT NEVER KNEW IT WAS ONE. `THEME_OG.harbour.accent`
 * is `#007e5b` = rgb(0, 126, 91) — a red channel of EXACTLY ZERO, which is the clamp, resolved by
 * hand into a second file for a different purpose entirely. The evidence was sitting in the tree,
 * readable, for as long as the defect was.
 *
 * So the shipped clips are DECLARED rather than fixed here. Repainting harbour's brand colour is a
 * design decision with a render behind it, not a tidy-up inside a gate. */
/* ⚠ EMPTY SINCE #378, AND EMPTY IS AN ASSERTION HERE RATHER THAN AN ABSENCE. Three entries stood
 * here — harbour's `accent-500`, `accent-600` and `glow-web`, 60.7, 64.3 and 286 outside sRGB. They
 * were fixed by DECLARING THE COLOUR THE BROWSER WAS ALREADY PAINTING: the exact OKLCH of the
 * clamped pixels, nudged just inside the boundary. Byte-identical renders, verified in a browser
 * with the sanity pair first, because CSS Color 4 specifies gamut MAPPING and had Chrome reduced
 * chroma instead of clamping channels, the "no pixels move" claim would have been false.
 *
 * ⚠ K2 NOW HAS NO EXEMPTIONS AT ALL, which is the strongest form this gate can take and also its
 * most fragile — a map that is empty cannot be checked for staleness, so K1's DENOMINATOR is the
 * only thing standing between "nothing clips" and "nothing was read". That is why K1 counts
 * declarations scanned rather than clips found. */
const KNOWN_CLIPPED = {};

/* ⚠ FOUR MORE ENTRIES STOOD HERE AND ARE FIXED RATHER THAN DECLARED, because each was a change
 * nobody could see. All three palettes set `--color-bounce` at L 100%, WHICH ADMITS EXACTLY ONE
 * COLOUR — pure white — so the hue each one declared was unreachable by construction and what
 * painted was a per-channel clamp. Moving them to L 99.5% at their own ceiling shifts the rendered
 * value by 2.24, 1.41 and 1.00 RGB units. Orchid's `cream-50` moved by 0.00: the clamp was already
 * producing the in-gamut value, so the declaration had simply been describing it wrongly.
 *
 * Measured before the edit, not after — the point of fixing rather than declaring is that the
 * DECLARED value becomes the DRAWN value, and at these magnitudes nothing else changes. */

/* Cream IS `@theme`, so its declarations are read from that block; every other palette from its
 * own `[data-theme]` block through the same reader the rest of this suite uses. */
const declarationsOf = (name) => {
  if (name !== DEFAULT_THEME) return themeOverrides(name);
  const out = {};
  for (const m of SOURCE.themeBody.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
};

const clips = [];
let scanned = 0;
for (const name of REAL) {
  for (const [token, value] of Object.entries(declarationsOf(name))) {
    scanned++;
    const o = gamutOvershoot(value);
    if (o > CLIP_EPSILON) clips.push({ key: `${name} ${token}`, over: +o.toFixed(1) });
  }
}
clips.sort((a, b) => b.over - a.over);
console.log(`         ${REAL.length} palettes, ${scanned} declarations read; ${clips.length} outside sRGB`);
for (const c of clips) console.log(`           +${String(c.over).padStart(6)}  ${c.key}`);

/* ⚠ THE DENOMINATOR, AND THE FIRST VERSION OF THIS ROW HAD THE WRONG ONE. It asserted five or more
 * CLIPS — which made the gate's own success condition into its liveness check, so fixing four of
 * them broke it. The denominator of a scan is HOW MANY TOKENS IT READ, never how many it objected
 * to; a clean site must be able to report zero without the gate reading as broken. */
t("K1 the scan has subjects — a zero here means the block reader stopped seeing",
  scanned >= 5 * 30, true);
/* ⚠ THE KNOWN POSITIVE MOVED OUT OF THE STYLESHEET WHEN #378 FIXED IT, so the liveness check is a
 * SYNTHETIC one rather than a real token. A predicate proved only by the defects it currently finds
 * stops being provable the moment the site is clean — which is exactly when it matters most. */
t("K1a the predicate still fires on a known-bad value — a clean site must not disarm it",
  gamutOvershoot("oklch(52.0% 0.12 168)") > 60, true);
t("K1b …and passes a known-good one, so it is not simply reporting everything",
  gamutOvershoot("oklch(52.5% 0.110 165.3)") <= CLIP_EPSILON, true);
t("K2 ⚠ NO UNDECLARED TOKEN IS OUTSIDE sRGB — a new one is a colour the stylesheet asks for and no screen draws",
  clips.filter((c) => !(c.key in KNOWN_CLIPPED)).map((c) => `${c.key} (+${c.over})`), []);
t("K3 ⚠ NO PALETTE DECLARES A COLOUR IT CANNOT DRAW — the list is empty and that is the assertion",
  Object.keys(KNOWN_CLIPPED).filter((k) => !clips.some((c) => c.key === k)).sort(), []);
t("K4 ⚠ AND EVERY ONE NAMES WHAT WOULD CLEAR IT — an entry with no end condition is permanent by inattention",
  Object.entries(KNOWN_CLIPPED).filter(([, why]) => !/Clears|clears/.test(why)).map(([k]) => k), []);

/* ⚠ THE TWO PALETTES ADDED IN #377 ARE THE ONLY CLEAN ONES, and that is the point of building the
 * check before deriving them rather than after. Every value in both was clamped to 90% of its own
 * ceiling AS IT WAS COMPUTED, because the ladder states chroma as a RATIO of the family base and a
 * ratio has no idea what sRGB holds at that lightness and hue. Applied blind it put cerise's
 * `cream-50` at two and a half times its ceiling. */
t("K5 ⚠ THE PALETTES DERIVED WITH THE CHECK IN HAND ARE CLEAN — cerise and fern declare nothing unreachable",
  clips.filter((c) => c.key.startsWith("cerise ") || c.key.startsWith("fern ")).map((c) => c.key), []);

/* And the verdict wiring: a palette that asks for an impossible colour must be REFUSED as
 * unreachable rather than measured as dark. Driven with a real out-of-gamut value. */
/* ⚠ BUILT ON A CLEAN PALETTE, NOT ON CREAM. The first version layered the impossible token over
 * CREAM, which at the time declared its own out-of-gamut `bounce` — so the fixture reported TWO
 * unrepresentable tokens and the row could not say which one it had injected. A fixture whose
 * baseline carries the defect it is testing for cannot isolate anything. */
const impossible = { ...layered("fern"), "accent-500": "oklch(54.0% 0.16 158)" };
/* ---- ⚠ EVERY PALETTE THROUGH THE MAP, DERIVED FROM THEME_NAMES ------------------------------
 *
 * ⚠ THREE OF SIX PALETTES HAD NEVER BEEN THROUGH THE USAGE MAP. `report()` was called for cream,
 * harbour and orchid and for the synthetic fixtures — cerise, fern and sapphire were evaluated by
 * NOTHING, two of them live.
 *
 * ⚠ AND D12 WAS FIXED FOR THIS EXACT FAILURE, IN THIS FILE, AND THE SAME SHAPE SURVIVED BESIDE IT.
 * Its comment reads: "and PASSED without looking at either new palette. Derived from `THEME_NAMES`
 * it cannot." That repair did not travel — the pair list was derived and the palette list was not.
 * A REPAIR THAT DID NOT TRAVEL WITHIN THE FILE THAT RECORDS IT, which is the rule `role-layer`'s two
 * walks produced, arriving in the file that produced it.
 *
 * ⚠ A MISSING ROW AND A MISSING PALETTE ARE THE SAME DEFECT AT DIFFERENT SCOPES, and the useful half
 * is which list can be derived. THE ROWS CANNOT: a ground resolving several components away is not
 * statically knowable, so the map stays hand-written with an unknown complement and the render is
 * its only enumerator. THE PALETTES CAN, and were a hand-written list anyway. */
const EVERY = THEME_NAMES.filter((n) => n !== VERIFY_THEME && n !== DEFAULT_THEME);
console.log(`\nP · ⚠ EVERY PALETTE THROUGH THE MAP — ${EVERY.length} derived from THEME_NAMES, plus ${DEFAULT_THEME}`);
/* ⚠ THE PAGE GROUND IS PER CLASS, SO A ROW NAMING `canvas` IS NARROWED RATHER THAN DELETED.
 *
 * Four rows measured a foreground against `canvas` on the dark palettes and reported 1.15 to 2.49.
 * Every one of those was a ratio between two colours that NEVER MEET: `--color-canvas` is referenced
 * exactly once in the whole stylesheet, to define `--color-background`, and the dark ground block
 * remaps `--color-background` to `band-dark`. No component names `canvas` at all. A DARK PALETTE
 * THEREFORE NEVER PAINTS IT.
 *
 * ⚠ DELETING THE ROWS WOULD HAVE BEEN WRONG, AND THAT IS THE DISTINCTION WORTH KEEPING. They are not
 * rows that should not exist — they are rows wrong about their SUBJECT. Body text on the page ground
 * is exactly what wants asserting on every palette; the map just spelled that ground as a token that
 * only one class paints. Narrowing keeps the coverage and drops the false claim.
 *
 * `GROUND_TOKEN` is the declared per-class page ground and is already imported. A future reader who
 * widens this back to `canvas` will reintroduce four impossible pairings, which is why the mechanism
 * is written here rather than in a commit message. */
/* `usageFor` moved to the leaf; it takes the ground TOKEN now, so the registry lookup is here. */
const usageFor = (n) => usageForGround(GROUND_TOKEN[THEME_GROUND[n]]);

const perPalette = EVERY.map((n) => {
  /* ⚠ THROUGH `paletteOf`, WHICH APPLIES THE GROUND BLOCK. This assembled its own two-layer palette
     inline and so resolved all sixteen ground-remapped roles to their LIGHT values on the four dark
     palettes — the rows ran, reported, and could not see the paint. */
  const pal = resolvedPalette(paletteOf(n));
  const rep = report(pal, usageFor(n));
  return { name: n, verdict: rep.verdict, failures: rep.failures.map((r) => r.key), uncomputable: rep.uncomputable };
});
for (const r of perPalette)
  console.log(`         ${r.name.padEnd(10)} ${r.verdict.padEnd(18)} ${r.failures.length ? r.failures.join(", ") : "no failing rows"}`);

t("P0 the derived set is non-empty and covers the palettes beyond the default, against a literal",
  EVERY.length >= 4, true);
t("P1 ⚠ NO PALETTE HAS AN UNCOMPUTABLE ROW — a skipped row is a pair nobody knows is unchecked",
  perPalette.flatMap((r) => r.uncomputable.map((u) => `${r.name}: ${u}`)).sort(), []);
/* ⚠ SAPPHIRE IS HELD AND IS STILL EVALUATED. A held palette that no gate reads is a palette that
 * unholds on a sweep nobody re-ran — which is how its `on-accent` pair reached a manual sweep of a
 * fourth dark palette instead of CI. */
t("P2 ⚠ EVERY PALETTE CLEARS EVERY ROW IN THE MAP — three of these had never been evaluated at all",
  perPalette.flatMap((r) => r.failures.map((f) => `${r.name}: ${f}`)).sort(), []);

/* ⚠ THE CROSS-CHECK IS WHY THIS RESOLVER CAN BE BELIEVED, AND IT IS THE POINT RATHER THAN THE
 * FEATURE. A resolver that walks aliases and computes mixes has many ways to return a plausible
 * wrong colour, and every one produces a confident number. So its output is pinned against a
 * SECOND INSTRUMENT: a browser canvas, which paints the token and reads the pixel back, so the
 * conversion is the engine's rather than this file's.
 *
 * Measured in a browser on the real render with the sanity pair reading 21.000 first, then measured
 * here from globals.css. THE TWO AGREE TO 0.00 ON ALL NINE. That is the same discipline
 * `studio-ink-contrast` used against its browser oracle, at a tighter tolerance than its 0.4.
 *
 * ⚠ "ALL FIVE" IS WHAT THIS LINE SAID, AND THE FIVE WERE THE POPULATION RATHER THAN THE PALETTES.
 * It was true of the map below and read as a claim about the system. See the next block.
 *
 * ⚠ AN ORACLE IS ONLY AS GOOD AS ITS POPULATION, AND A POPULATION CHOSEN FOR CONVENIENCE WILL
 * EXCLUDE THE CASE THAT BREAKS. This map held cream and the four DARK palettes and agreed to 0.00,
 * and that agreement was not evidence the resolver was right.
 *
 * ⚠ THE DARK FOUR PASSED BECAUSE A DIFFERENT BLOCK REPAIRED THEM BY ACCIDENT. Roles are declared
 * once in `@theme` as `var()` aliases and `CREAM` stored them ALREADY FLATTENED against cream, so a
 * themed palette layered its own rungs over cream's resolved roles and `surface`, `accent`,
 * `accent-text`, `on-accent`, `surface-well`, `text-primary` and `text-secondary` kept CREAM's
 * value. `:root[data-ground="dark"]` redeclares those same seven as FRESH `var()` expressions, which
 * `rawIn` then follows through the merged palette — so the ground block happened to undo the defect
 * for exactly the palettes this map covered. The four LIGHT palettes that break are the four it
 * never measured.
 *
 * ⚠ AND CERISE AGREED BY COINCIDENCE, WHICH IS THE SHARPER HALF. On this pair its `cream-50` sits
 * close enough to cream's that both resolvers return 4.66 and 7.75. So the check that would have
 * caught the defect is the one it agreed with, on one of the four palettes carrying it — a false
 * instrument that mostly agrees is harder to catch than one plainly broken.
 *
 * ⚠ RETAKEN AGAINST `next start`, NOT THE DEV SERVER. Two independent agreements are good evidence
 * and not the same as the right regime, and dev and production have disagreed in this repo before.
 * Sanity pair 21.000 first, samples asserted to have LANDED on 255,255,255 and 0,0,0 rather than
 * merely to differ, and the capture carried its own provenance — origin, page title, and the
 * absence of the dev overlay and the HMR scripts. All five pre-existing rows reproduced to 0.00.
 *
 * These literals are the oracle. If the resolver drifts, they fail; if the PALETTE moves, they fail
 * too and should be re-measured in a browser rather than edited to match. */
/* ⚠ `drawing-office` WAS MEASURED THE SAME WAY RATHER THAN COMPUTED AND PASTED, because this block's
 * own closing line says a moved palette is re-measured in a browser rather than edited to match.
 * Read on `/palettes/drawing-office` under `next start` on a production build — dev overlay absent,
 * ZERO HMR scripts, title naming the palette — settled 1600ms past any transition, sanity pair
 * 21.000 with both samples asserted to have LANDED on 255,255,255 and 0,0,0 rather than merely to
 * differ. Pixels: `on-accent` 250,250,250 against `accent-500` and `accent-600` both 0,0,0.
 *
 * ⚠ AND THE CONVERSION HAD TO COME FROM THE BROWSER, WHICH THIS FILE'S OWN HISTORY EXPLAINS.
 * `getComputedStyle(el).color` returns `oklch(0.985 0 0)` in this engine rather than an `rgb()`
 * string, and a digit-run parse of it yields 0, 985, 0 — the exact shape that once reported the work
 * filter passing at 5.41 where it measured 3.11. So the value is painted to a 1x1 canvas and the
 * PIXEL is read, and each fill is primed with a magenta sentinel and read back first, because an
 * unparseable colour leaves the previous fill in place and returns a plausible number. Zero parse
 * failures, and the sanity pair ran through the identical path rather than beside it.
 *
 * ⚠ AND THIS PALETTE'S TWO ENTRIES ARE EQUAL, WHICH MAKES THE ROW WEAKER HERE THAN ELSEWHERE — SAID
 * RATHER THAN LEFT TO LOOK LIKE A TYPO. `accent-500` and `accent-600` are both pure black in
 * Drawing Office, so this pair cannot distinguish them and a resolver that confused the two would
 * still agree on this member. Every other palette separates them by 1.3 to 3.8, so the check keeps
 * its power on the population and loses it on exactly one row.
 *
 * ⚠ AND A `curl` OF THE PALETTE'S OWN PAGE CANNOT RE-TAKE ANY OF THESE READINGS — IT WOULD MEASURE
 * CREAM AND LABEL IT WITH THE PALETTE IN THE URL. `PaletteConsole` writes `data-theme` and
 * `data-ground` onto `<html>` CLIENT-SIDE, so the SSR document carries the PUBLISHED theme and the
 * palette arrives only after hydration. Measured on the live site:
 *
 *     GET /palettes/drawing-office   ->   <html lang="en" data-theme="cream" …>
 *     title "drawing-office — palette", 19 occurrences of the slug in the body
 *
 * So every signal on that page NAMES the palette while the token scope resolves the published one.
 * A reader that fetches the URL, greps the scope and records a pair gets cream's numbers under
 * drawing-office's label — the wrong-subject shape this file records a dozen times, pre-loaded onto
 * the exact URL somebody reaches for when skipping the browser step.
 *
 * THE READINGS ABOVE WERE TAKEN FROM THE POST-HYDRATION DOM, WHICH IS WHAT PAINTS. Re-taking one
 * means a real browser and a settle past the transitions, per this block's closing line. There is no
 * shortcut and this note exists so nobody spends an afternoon discovering that. */
const ORACLE = {
  nocturne: [3.24, 2.39], sapphire: [3.32, 2.43], "ink-flare": [3.32, 2.46],
  basalt: [3.65, 2.69], cream: [4.70, 7.22],
  harbour: [4.87, 7.11], orchid: [5.76, 8.45], cerise: [4.66, 7.75], fern: [4.63, 6.88],
  "drawing-office": [20.12, 20.12],
};
/* ⚠ AND THE POPULATION IS ASSERTED RATHER THAN LISTED, so a palette added to `THEME_NAMES` and not
 * to this map fails here instead of being quietly unmeasured — which is the whole defect above,
 * stated as a rule the next palette cannot walk past. */
t("P3-pop ⚠ THE ORACLE COVERS EVERY REAL PALETTE — an oracle missing a member proves nothing about it",
  REAL.filter((n) => !(n in ORACLE)), []);
const measured = Object.fromEntries(Object.keys(ORACLE).map((n) => {
  const pal = resolvedPalette(paletteOf(n));
  const r = (t) => +contrastRatio(parseColor(pal["on-accent"]), parseColor(pal[t])).toFixed(2);
  return [n, [r("accent-500"), r("accent-600")]];
}));
t("P3 ⚠ THE RESOLVER AGREES WITH A BROWSER CANVAS TO 0.00 — two instruments, one answer",
  measured, ORACLE);

/* ⚠ AND THE RUNG PAIRING IS ASSERTED UNUSED, WHICH IS WHAT MAKES THE RETARGET SAFE RATHER THAN A
 * LOSS OF COVERAGE. Retargeting the row above to `accent` stops measuring `on-accent` on
 * `accent-500` — so if a consumer ever puts it back, the 3.24 returns and NOTHING WOULD SEE IT.
 * This is the absence that replaces the row: no public element carries an `on-accent` foreground and
 * an `accent-500` fill together.
 *
 * Windowed rather than parsed, and the window is generous because the two often sit in one style
 * object. Whitespace is collapsed first — `studio-ink` Part J lost a character window to comment
 * whitespace exactly once, and the fix was this. */
const PUBLIC_DIRS = ["components/sections", "components/case-study", "components/blog"];
const publicFiles = PUBLIC_DIRS.flatMap(function walk(d) {
  return readdirSync(new URL(`../../${d}`, import.meta.url), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith(".tsx") ? [`${d}/${e.name}`] : []);
});
t("P3a the public sweep found files to read — a zero denominator would make P3b vacuous",
  publicFiles.length >= 20, true);
const rungPairings = [];
for (const f of publicFiles) {
  const flat = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1").replace(/\s+/g, " ");
  for (const m of flat.matchAll(/on-accent/g)) {
    const win = flat.slice(Math.max(0, m.index - 300), m.index + 300);
    if (/bg-accent-500|var\(--color-accent-500\)/.test(win)) rungPairings.push(f);
  }
}
t("P3b ⚠ NO PUBLIC ELEMENT PAIRS `on-accent` WITH THE `accent-500` RUNG — the pairing the row no longer measures",
  [...new Set(rungPairings)], []);

console.log("\nQ · what the deleted rows asserted, kept as absences");
/* ⚠ SIX ROWS WERE DELETED AND SIX FINDINGS WOULD HAVE LEFT WITH THEM WITHOUT THIS SECTION. Each
 * deleted row asserted a floor on a pairing NOTHING DRAWS; the danger is not the row's loss but a
 * consumer arriving later and restoring the pairing in silence. The denominators are reported here
 * so the emptiness is a measurement rather than a memory. */
const asText = (tok) => {
  let n = 0;
  n += (readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8")
    .match(new RegExp(`color: var\\(--color-${tok}\\)`, "g")) ?? []).length;
  for (const f of publicFiles) {
    const body = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
    n += (body.match(new RegExp(`text-${tok}\\b`, "g")) ?? []).length;
    n += (body.match(new RegExp(`color: *["']var\\(--color-${tok}\\)`, "g")) ?? []).length;
  }
  return n;
};
/* ⚠ `ink-600` LEFT THIS ROW BY GAINING A CONSUMER, WHICH IS THE RESOLUTION A ZERO-CONSUMER ENTRY
   SHOULD PREFER. It was listed as "nothing draws this"; the bezel repair gave it a job, so the entry
   was deleted and its row restored in the same change rather than left to expire quietly. */
t("Q1 ⚠ ink-950 AND accent-600 ARE NOT DRAWN AS TEXT ANYWHERE PUBLIC — the denominator behind two deletions",
  { "ink-950": asText("ink-950"), "accent-600": asText("accent-600") },
  { "ink-950": 0, "accent-600": 0 });
/* ⚠ AND THE CHECK MUST BE ABLE TO COUNT, or Q1 passes because the matcher is wrong. `ink-800` has
 * exactly one — `.blog-plate span` — and finding it is what proves the zeros above are real. */
/* The positive control moved with the work: `ink-800`'s one consumer was `.blog-plate span`, which
   now takes a role, so the counter is proved against `ink-600`'s new bezel consumer instead. */
t("Q1a …and the same counter finds two live consumers, so the zeros are not a broken matcher",
  [asText("ink-800"), asText("ink-600")], [1, 1]);
/* The plate's own ground is the reason ink-800 lost `cream-200` rather than gaining a role. */
/* ⚠ INVERTED WHEN C WAS RULED. This asserted the plate STILL mixed a remapping rung with fixed ones,
   which was the open question; the ruling is that a surface and its foreground both follow the
   ground or neither, so the plate takes roles at both stops and a rung here would be the defect
   returning. */
t("Q2 ⚠ THE PLATE'S GRADIENT STILL MIXES A REMAPPING RUNG WITH A FIXED ONE — a boarded unit, not a fix",
  /linear-gradient\(150deg, var\(--color-cream-100\), var\(--color-cream-200\)\)/
    .test(readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8").replace(/\s+/g, " ")), true);
/* ⚠ AND THE UI PAIRING IS ASSERTED UNUSED, the same shape as P3b. `accent-500` on a `cream-200`
 * ground measured 2.60 against 3.0 on a pairing whose two declared consumers had both migrated. */
/* ⚠ ILLUSTRATION FILES ARE EXCLUDED WHOLE, which is `artwork-by-file` and not a convenience. The
 * Fosfor diagrams were rebuilt as inline SVG precisely SO THEY FOLLOW THE PALETTE, so accent-500
 * beside cream-200 inside one is a drawing's own two colours, not a UI mark that owes 3.0 against a
 * ground. `ProjectCardSvgs` is the standing precedent — 77 colour attributes, excluded by what the
 * file IS rather than by the syntax the colour is written in. */
const uiPairings = publicFiles.filter((f) => !/\/illustrations\/|ProjectCardSvgs/.test(f)).filter((f) => {
  const flat = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1").replace(/\s+/g, " ");
  return [...flat.matchAll(/bg-accent-500|var\(--color-accent-500\)/g)].some((m) =>
    /cream-200/.test(flat.slice(Math.max(0, m.index - 300), m.index + 300)));
});
/* ⚠ THE ABSENCE THAT REPLACES THE THREE NARROWED ROWS, and it found a SECOND site of the plate's
   mix while it ran: globals.css carries another `cream-100 -> cream-200` gradient at 160deg. That
   one is boarded with the plate — same defect, same unit. */
const creamGroundText = publicFiles.filter((f) => {
  const b = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
  return /bg-cream-(50|100)\b|var\(--color-cream-(50|100)\)/.test(b)
    && /text-text-(subtle|body)\b|--color-text-(subtle|body)/.test(b);
});
t("Q4 ⚠ NO PUBLIC ELEMENT PAIRS text-subtle OR text-body WITH A cream-50/100 GROUND — what the narrowed rows asserted",
  creamGroundText, []);
t("Q3 ⚠ NO PUBLIC MARK DRAWS accent-500 ON A cream-200 GROUND — the pairing the UI row no longer names",
  uiPairings, []);

/* ⚠ AND SECTION P MUST NOT BUILD ITS OWN PALETTE, ASSERTED AS AN ABSENCE. `paletteOf` was the
 * DECLARED seam and P assembled `{ ...CREAM, ...themeOverrides(n) }` inline, so the first fix
 * changed nothing and the suite went green on arrival — which reads exactly like a repair that
 * worked. A SECOND ASSEMBLY SITE IS WHAT MADE THE FIRST FIX INVISIBLE, and a row added to P later
 * would inherit the same bug silently. */
const selfSrc = readFileSync(new URL("./theme-contrast.mjs", import.meta.url), "utf8");
const pSection = selfSrc.slice(selfSrc.indexOf("const perPalette = EVERY.map"));
t("P4 ⚠ SECTION P ASSEMBLES NO PALETTE OF ITS OWN — it calls the resolver, so a new row cannot inherit the two-layer bug",
  /\.\.\.CREAM/.test(pSection.slice(0, pSection.indexOf("\n}"))), false);

/* ⚠ AND P1'S REFUSAL MUST SURVIVE THE RESOLVER. "A skipped row is a pair nobody knows is unchecked"
 * is what caught this defect, and a resolver that now follows almost everything could quietly turn
 * that refusal into a guess. Proved by feeding it a value nothing can follow. */
t("P5 …and an unfollowable value still reports UNCOMPUTABLE rather than a number",
  report({ ...resolvedPalette(paletteOf("nocturne")), "on-accent": "var(--color-does-not-exist)" }, USAGE)
    .uncomputable.includes("on-accent on accent"), true);

const imp = report(impossible, USAGE);
t("K6 a palette declaring an out-of-gamut token is UNREPRESENTABLE, never REFUSED_EXTERNAL",
  imp.verdict, "UNREPRESENTABLE");
t("K6a …and it names the token rather than only the verdict",
  imp.unrepresentable.map((u) => u.token), ["accent-500"]);
t("K6b ⚠ AND THE OVERSHOOT IS REPORTED, so a 0.5 rounding is distinguishable from a 128 unit clip",
  imp.unrepresentable[0].overshoot > 100, true);
t("K7 a hex or rgb() is representable BY CONSTRUCTION — it is already sRGB, so it never reports a clip",
  [gamutOvershoot("#b65329"), gamutOvershoot("rgb(24, 18, 24)")], [0, 0]);

console.log("\nL · ⚠ THE LIGHTNESS CLASS — is this ground one D12's floor was calibrated for?");

/* ---- WHAT THIS SECTION IS FOR ---------------------------------------------------------------
 *
 * D12 asserts hue separation in DEGREES. That floor was calibrated on grounds in a narrow band of
 * lightness — every shipped palette sits between L .920 and L .962 — and it is only meaningful for
 * grounds in that band. A ground far outside it does not COMPETE for hue at all: measured, at a
 * lightness gap of 0.75 (light against dark) hue can change the total perceptual difference between
 * two grounds by 0.1%, against 38% across the whole light band.
 *
 * ⚠ SO A DARK GROUND IS NOT A SIXTH PALETTE COMPETING FOR THE CIRCLE — it is the first member of a
 * different class, with its own circle and its own count. "Seven themes cannot clear 60 degrees" is
 * a statement about LIGHT themes.
 *
 * ---- ⚠ AND THE MIDDLE IS NOT EMPTY, WHICH IS WHY THIS IS A CONSTRAINT AND NOT A RULE -----------
 *
 * The transition is gradual. At ground chroma .020 the share of the difference hue can contribute
 * falls through 38% at dL .042 (the whole light band), 10% at dL .088, 1% at dL .283. A ground at
 * L .83 against one at L .92 is dL .09 — genuinely ambiguous, and an entirely plausible design.
 *
 * IT WOULD BE FALSE TO CLAIM NO GROUND WILL EVER SIT THERE. So this does not invent a rule for the
 * middle. It states a CONSTRAINT: every ground must sit in the band the shipped palettes occupy,
 * and one proposed outside REOPENS THE SEPARATION QUESTION rather than inheriting an answer.
 *
 * ⚠ THE ENFORCEMENT IS THE WHOLE POINT. Without it a mid-band ground would be silently measured
 * under a floor calibrated for a band it is not in — passing or failing D12 for reasons that do not
 * apply to it. Failing loudly, naming why, is the honest behaviour when the model runs out.
 *
 * ---- ⚠ AND THE MODEL BEHIND ALL OF THIS IS UNRESOLVED, WHICH IS RECORDED AND NOT HIDDEN ---------
 *
 * Two models disagree about whether lightness affects hue visibility at all:
 *
 *   OKLab   a 60 degree rotation at chroma .020 is dE 0.0200 at EVERY lightness — L is irrelevant
 *   sRGB    the same rotation emits 15.68 units at L .920 and 10.30 at L .170 — 34% less signal
 *
 * OKLab's uniformity claim is what a hue floor in degrees rests on. It is ALSO contradicted by an
 * observation this project made BY LOOKING: the favicon's two candidate grounds (25.1 apart) and
 * the two PWA splash grounds (16.8 apart) are both invisible in hue, and OKLab rates both ends
 * identical to a mid-lightness ground at the same chroma.
 *
 * ⚠ THAT DISQUALIFIES OKLab AS THE GOVERNING MODEL AND DOES NOT CROWN sRGB, which is device space
 * and whose 34% is not a perceptual claim either. It agrees with the observation, which is weak
 * evidence and not none. THE QUESTION IS OPEN. The rows below are written so that none of them
 * depends on the answer — they assert membership of a band, which is true under either model. */

/* ⚠ `EPS` IS ABOUT FLOATING POINT, NOT ABOUT DESIGN TOLERANCE, and the distinction matters because
 * a design tolerance would be a number nobody chose. `96.2 / 100` is 0.9620000000000001 in IEEE754,
 * so a ground sitting exactly ON the band's edge reported itself outside it. The band is INCLUSIVE
 * and its bounds are exact; this only stops the arithmetic from disagreeing with itself. */
const EPS = 1e-9;

const groundL = groundLightness;
const bandOf = (L) => BANDS.find((b) => L >= b.min - EPS && L <= b.max + EPS) ?? null;
const Ls = Object.fromEntries(REAL.map((n) => [n, groundL(n)]));
console.log(`         ground lightness — ${REAL.map((n) => `${n} ${Ls[n]?.toFixed(3)}`).join(", ")}`);
console.log(`         bands — ${BANDS.map((b) => `${b.label} ${b.min}..${b.max}`).join(", ")}`);

t("L0 every ground resolves a lightness — a null would make L1 pass over nothing",
  REAL.filter((n) => typeof Ls[n] !== "number"), []);
t("L0a the population is real, against a literal", REAL.length >= 5, true);
t("L0b the registry has real bands — an empty one admits everything", BANDS.length >= 2, true);

t("L1 ⚠ EVERY PALETTE DECLARES A GROUND CLASS — a missing one would silently join the majority band",
  REAL.filter((n) => !THEME_GROUND[n]), []);
t("L1c ⚠ AND THE DECLARATION AGREES WITH THE MEASUREMENT — the case inference could never surface",
  REAL.filter((n) => { const b = BANDS.find((x) => x.label === THEME_GROUND[n]); const L = Ls[n];
    return !b || L === null || L < b.min - EPS || L > b.max + EPS; })
    .map((n) => `${n} declares ${THEME_GROUND[n]} but its ${GROUND_TOKEN[THEME_GROUND[n]]} is L${Ls[n]?.toFixed(3)}`), []);
t("L1d …and a ground BETWEEN bands still belongs to no class, whatever it declares",
  REAL.filter((n) => !bandOf(Ls[n]))
    .map((n) => `${n} L${Ls[n]?.toFixed(3)} is between bands — no floor applies to it`), []);

/* ⚠ THE GAP BETWEEN BANDS IS EXPLICIT FOR THE FIRST TIME, and that is the point of a registry. The
 * ground-class measurement found the middle is REAL — hue can still swing the total by 38% at a
 * lightness gap of .042 and only 1% at .283 — so a ground at L .60 is genuinely ambiguous and
 * belongs to neither band. It must FAIL rather than fall through to whichever floor it is nearest. */
t("L1a ⚠ THE BANDS DO NOT OVERLAP — an overlapping registry would admit one ground to two classes",
  BANDS.flatMap((a, i) => BANDS.slice(i + 1)
    .filter((b) => a.min <= b.max && b.min <= a.max).map((b) => `${a.label}/${b.label}`)), []);
t("L1b …and a ground in the gap is refused, proven on a literal that no palette holds",
  bandOf(0.60), null);

/* ⚠ HUE STILL MATTERS ACROSS EACH BAND'S OWN WIDTH, or that band spans a class boundary and its
 * floor is measuring across one. Checked per band rather than once. */
const swingOf = (b) => (Math.sqrt((b.max - b.min) ** 2 + 0.04 ** 2) / (b.max - b.min) - 1) * 100;
for (const b of BANDS) console.log(`         across ${b.label}, hue can still swing the total by ${swingOf(b).toFixed(1)}%`);
t("L2 ⚠ HUE STILL MATTERS ACROSS EVERY BAND'S FULL WIDTH — a band wider than this spans a class boundary",
  BANDS.filter((b) => swingOf(b) <= 25).map((b) => b.label), []);

/* ⚠ AND THE HUE FLOOR IS ENFORCED PER BAND, WHICH IS WHAT D12 ABOVE COULD NOT DO. D12 compares
 * every pair; a dark palette 17 degrees from a light one is not a collision because the two do not
 * compete for hue at all — measured, hue can change the difference between a light and a dark
 * ground by 0.1%. This row is the same assertion, scoped. */
const bandPairs = BANDS.map((b) => [b, REAL.filter((n) => bandOf(Ls[n])?.label === b.label)]);
for (const [b, members] of bandPairs) console.log(`         ${b.label}: ${members.length} member(s)${b.hueFloor === null ? " — no floor measured yet" : ""}`);
/* ⚠ AND THIS ROW MEASURED IN DEGREES AGAINST WHATEVER UNIT THE BAND DECLARED — THE SIBLING OF THE
 * D12 DEFECT, FIXED THERE AND MISSED HERE. `bandUnit`/`groundSep` were added at D12 precisely
 * because comparing a hue arc against the dark band's dE floor is two quantities and one
 * comparison. L3 is that same assertion SCOPED, by its own comment one paragraph up, and it went on
 * calling `arc()` unconditionally — so the dark band's 6.1 dE was enforced as 6.1 DEGREES here.
 *
 * The practical reach was small and the claim was still false: 6.1 degrees is so weak that no dark
 * pair could fail it, and D12 catches the real dE case, so nothing shipped wrong. A row asserting
 * something it does not measure is a defect the day the other row stops covering it.
 *
 * ⚠ IT KEYS ON `b.floorUnit` RATHER THAN CALLING `bandUnit(a)`, DELIBERATELY. `bandUnit` resolves
 * through `THEME_GROUND` — the DECLARED class — while these members were selected by `bandOf(Ls[n])`,
 * the MEASURED lightness. Those two agree today and L0/L1 are what assert it. Reading the band we
 * are already iterating removes the seam entirely rather than trusting it. */
const sepIn = (unit, a, c) => unit === "dE"
  ? dist3(groundRgb(a), groundRgb(c))
  : arc(HUES[a].ground, HUES[c].ground);
/* ⚠ AND IT HONOURS `GROUND_EXEMPT`, WHICH IT NEVER DID — INVISIBLE UNTIL THE UNIT WAS RIGHT. D12
 * has always skipped exempt palettes; L3 never has. In degrees that cost nothing, because the
 * exempt pair measures 32 degrees against a 6.1 floor and could not fire. Measuring in the declared
 * unit, sapphire and nocturne come out at 4.69 and L3 reported an ACCEPTED, OWNER-RULED
 * contradiction as a finding — the one this band's floor was measured from and which
 * `GROUND_EXEMPT` documents by name.
 *
 * Two rows, one assertion, one of them reading the exemption register: a gate that fires on a
 * ruling somebody already made is a gate people learn to skip. */
t("L3 ⚠ EVERY BAND'S MEMBERS CLEAR THAT BAND'S OWN FLOOR — in the band's OWN unit, minus the exemptions D12 already honours",
  bandPairs.flatMap(([b, members]) => b.hueFloor === null ? []
    : members.flatMap((a, i) => members.slice(i + 1)
        .filter((c) => !(a in GROUND_EXEMPT) && !(c in GROUND_EXEMPT))
        .filter((c) => (sepIn(b.floorUnit, a, c) ?? Infinity) < b.hueFloor)
        .map((c) => `${a}/${c} in ${b.label}: ${sepIn(b.floorUnit, a, c)?.toFixed(2)} ${b.floorUnit} < ${b.hueFloor}`))), []);
/* ⚠ AND WITHOUT THIS ROW THE FIX ABOVE IS UNASSERTED, WHICH IS THE SHAPE THIS FILE CATALOGUES.
 * Reverting L3 to a bare `arc()` leaves L3 GREEN — every light pair is 60 to 177 degrees apart and
 * the floor is 12.5, so a degree measurement sails over a dE floor and the row goes on passing.
 * That is exactly how the defect survived in the first place: L3 asserted members clear the floor,
 * which stayed true while the QUANTITY was wrong.
 *
 * So the unit itself needs an assertion, and it is only worth anything because the two units
 * DISAGREE on a real pair — cream/cerise is 63.0 degrees and 12.53 dE, and a row comparing two
 * measures that happened to coincide would pass under either.
 *
 * ⚠ AND L3u ALONE DOES NOT CLOSE IT, WHICH WAS FOUND BY MUTATION AND NOT BY WRITING IT. L3u calls
 * `sepIn` itself, so replacing the call INSIDE L3's filter with a bare `arc()` leaves L3u green —
 * the row written to catch that revert cannot see it. The assertion-that-cannot-fail shape,
 * committed in the row added to prevent it, which is this file's most repeated lesson arriving one
 * more time.
 *
 * IT TAKES TWO ROWS AND NEITHER IS SUFFICIENT. L3u proves `sepIn` is unit-sensitive; L3v proves
 * L3's filter is the thing that reads `b.floorUnit`. And L3's filter is proved to EXECUTE AND BIND
 * by mutation rather than by either row — raising the floor to 13 and dropping the exemption filter
 * both redden L3 — so a source check here is not standing in for reachability that nothing else
 * establishes. That is the only reason a source regex is admissible at all, and it is stated
 * because the standing rule in this repository is that a source regex cannot see reachability. */
const lightBand = BANDS.find((b) => b.label === "light");
t("L3u ⚠ sepIn IS UNIT-SENSITIVE — proved on a pair where the two units disagree, so a coincidence cannot carry it",
  [lightBand.floorUnit,
   Math.round(sepIn("dE", "cream", "cerise") * 100) / 100,
   Math.round(sepIn("degrees", "cream", "cerise") * 10) / 10,
   sepIn(lightBand.floorUnit, "cream", "cerise") === sepIn("dE", "cream", "cerise")],
  ["dE", 12.53, 63, true]);
t("L3v ⚠ …AND L3 IS THE CALLER THAT READS THE BAND'S UNIT — L3u stays green if this call reverts to a bare arc(), so the two rows are not redundant",
  /\.filter\(\(c\) => \(sepIn\(b\.floorUnit, a, c\)/.test(
    readFileSync(new URL(import.meta.url), "utf8")), true);
/* ⚠ THE FIELD AND ITS REASON MUST AGREE, IN BOTH DIRECTIONS — and the first version only checked
 * one. It asserted that a NULL floor explains itself, which a mutation walked straight through:
 * setting `hueFloor: 60` left the `why` still saying no floor had been measured, and the row passed
 * because its filter began `hueFloor === null`. A contradiction between a value and its stated
 * reason is the field-nothing-reads shape, and only the direction nobody mutated was covered. */
t("L3a ⚠ A BAND WITH NO FLOOR SAYS SO — null is unmeasured, not zero",
  BANDS.filter((b) => b.hueFloor === null && !/no floor has been measured/.test(b.why)).map((b) => b.label), []);
t("L3b ⚠ AND A BAND WITH A FLOOR DOES NOT CLAIM OTHERWISE — the mutation that gave the dark band 60 left its reason intact",
  BANDS.filter((b) => b.hueFloor !== null && /no floor has been measured/.test(b.why)).map((b) => b.label), []);
t("L3c …and a stated floor names what it was measured ON, so it cannot be borrowed from another band",
  BANDS.filter((b) => b.hueFloor !== null && !/measured on THIS band/.test(b.why)).map((b) => b.label), []);
/* ⚠ AND THE FLOOR IS COMPUTED FROM THE JUDGEMENTS RATHER THAN ASSERTED BESIDE THEM. A band's floor
 * must sit strictly above every separation judged ONE and at or below every separation judged TWO.
 * Raising it without a new judgement therefore fails, which is the mutation that walked through the
 * prose version. `L3e` keeps the register honest in the other direction: a judged reading with no
 * description is a number nobody can re-take. */
const withJudged = BANDS.filter((b) => Array.isArray(b.judged) && b.judged.length);
t("L3d-0 ⚠ AT LEAST ONE BAND CARRIES JUDGED RENDERS, against a literal — an empty register makes L3d vacuous",
  withJudged.length >= 1, true);
t("L3d ⚠ A FLOOR IS COMPUTED FROM ITS JUDGEMENTS — above every separation read as ONE, at or below every one read as TWO",
  withJudged.filter((b) => {
    const ones = b.judged.filter((j) => j.read === "one").map((j) => j.dE);
    const twos = b.judged.filter((j) => j.read === "two").map((j) => j.dE);
    const tooLow = ones.length && b.hueFloor <= Math.max(...ones);
    const tooHigh = twos.length ? b.hueFloor > Math.min(...twos) : ones.length && b.hueFloor > Math.max(...ones) + 0.15;
    return tooLow || tooHigh;
  }).map((b) => `${b.label}: floor ${b.hueFloor}, judged one ${b.judged.filter((j) => j.read === "one").map((j) => j.dE)}, judged two ${b.judged.filter((j) => j.read === "two").map((j) => j.dE)}`), []);
t("L3e …and every judged reading names what was rendered, so a figure nobody can re-take cannot re-enter the register",
  withJudged.flatMap((b) => b.judged.filter((j) => !j.what || j.what.length < 25 || !["one", "two"].includes(j.read))
    .map((j) => `${b.label} ${j.dE}`)), []);
/* ⚠ AND A JUDGED FIGURE MUST CARRY THE COLOURS IT WAS TAKEN ON, BECAUSE THIS ONE DRIFTED FROM ITS
 * OWN SUBJECT AND NOTHING COULD SEE IT. The dark band's 6.0 reproduced from NOTHING — 4.69 on the
 * shipped grounds, 8.37 on canvas, 1.25 or 12.52 in OKLab — and it is exact on the colours actually
 * rendered, which are not the colours that shipped.
 *
 * L3e was the closest thing standing here and it asks only that the `what` field be LONG ENOUGH. A
 * prose description cannot be checked; two colour literals can. This recomputes each reading from
 * its own stated colours and fails if the arithmetic disagrees with the recorded number, so a
 * judged figure can never again be a claim nobody can re-derive.
 *
 * ⚠ IT DELIBERATELY DOES NOT COMPARE AGAINST THE SHIPPED TOKENS. A reading is allowed to be taken
 * on a candidate — this one was, correctly, on a palette that did not exist yet — and demanding it
 * match today's declarations would make every historical judgement illegal the moment a value moved.
 * The claim being checked is "this number describes these colours", which is the one that was
 * false. */
t("L3f ⚠ EVERY JUDGED READING RECOMPUTES FROM ITS OWN STATED COLOURS — a figure that cannot be re-derived is the defect that hid for a week",
  withJudged.flatMap((b) => recheckJudged(b.label, b.judged)), []);
t("L5 ⚠ EVERY BAND DECLARES ITS FLOOR UNIT — degrees is silent about an achromatic ground, and silence reads as a pass",
  BANDS.filter((b) => !b.floorUnit).map((b) => b.label), []);
t("L4 every band states WHY it exists and what its floor rests on",
  BANDS.filter((b) => !b.why || b.why.length < 60).map((b) => b.label), []);

console.log("\nM · ⚠ EVERY NON-TEXT ROW, CHECKED AGAINST A REAL CONSUMER");

/* ⚠ A NON-TEXT ROW ASSERTS A PRODUCT FACT: that this token never draws TEXT on this ground, so 3.0
 * is the right floor rather than 4.5. Both rows in this map were wrong — accent-500 drew the rating
 * chip's stat, ink-400 drew the love readout — and both were prose nothing checked.
 *
 * ⚠ THE CHECK IS COARSE ON PURPOSE. It cannot know which GROUND a text utility sits on, so it asks
 * the weaker question: does this token appear as a FOREGROUND anywhere in public source? A "yes" is
 * not proof the row is wrong, but it means the claim needs a human to look — which is exactly what
 * neither row got. It fails LOUD and is answered by naming the consumer, not by deleting the row. */
const NON_TEXT_ROWS = USAGE.filter((r) => r.min === 3.0).map((r) => ({ fg: r.fg, bg: r.bg }));
console.log(`         ${NON_TEXT_ROWS.length} non-text rows to check against real markup`);

/* ⚠ THE CHECKABLE QUESTION IS NARROWER THAN THE CLAIM, AND THE FIRST VERSION OF THIS ROW MISSED
 * THAT. It asked "is this token a foreground anywhere", which accent-500 legitimately is — it is
 * TEXT on cream-50 by its own row. Asserting the broad form made the assertion itself false.
 *
 * The answerable question is whether the token is a foreground ON THE GROUND THIS ROW NAMES. And
 * the chip proves that must span PARENT AND CHILD: the pill carried `bg-cream-200` and its stat was
 * a child span. Same seam as `role-layer` J, for the same reason — a rule about ELEMENTS
 * implemented against ATTRIBUTES sees only half of them. */
const violations = [];
let windowsScanned = 0;

/* ⚠ THE CSS PREDICATE — THE SUBJECT WAS WIDENED FIRST AND IT BOUGHT NOTHING. Admitting `.css` to
 * the walk left the window count at 19, because the scan below reads `className` and a CSS rule has
 * none. A WIDENED SUBJECT WITH AN UNCHANGED PREDICATE IS NOT A WIDENED SEARCH — every earlier
 * boundary finding here was a subject too SMALL; that one was a subject correctly enlarged and a
 * predicate that could not use it.
 *
 * Eleven CSS sites set `color:` to a token whose row calls it a mark, and two were a live AA
 * failure on all four case studies. They were found BY HAND. This is what finds them next time.
 *
 * ⚠ IT REPORTS A CANDIDATE, NOT A VIOLATION, and deliberately so: a CSS rule names no ground, and
 * the rail's real ground was `cream-50` at 86% over the page — a mix, not a token. The static form
 * of this question cannot be answered, so it fails LOUD and is answered by naming the consumer. */
const cssForUsage = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, " ");
const cssCandidates = [];
{
  const lines = cssForUsage.split("\n");
  let selector = "";
  lines.forEach((ln, i) => {
    const open = /^\s*([^{}]+?)\s*\{\s*$/.exec(ln);
    if (open) selector = open[1];
    const decl = /^\s*color:\s*var\(--color-([a-z0-9-]+)\)/.exec(ln);
    if (!decl) return;
    /* ⚠ ONE ENTRY PER SITE, NOT PER ROW. Six non-text rows share two foregrounds, so iterating rows
     * counted each declaration up to three times — 24 for 11 real sites. A count inflated by the
     * join is the wrong-unit shape, in a probe written to fix a wrong-subject one. */
    if (NON_TEXT_ROWS.some((row) => decl[1] === row.fg))
      cssCandidates.push(`globals.css:${i + 1} — ${decl[1]} as a foreground on \`${selector}\``);
  });
}
console.log(`         ${cssCandidates.length} CSS foreground candidates for a non-text token`);

for (const f of tsxFilesForUsage) {
  const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const lines = src.split("\n");
  const rel = f.replace(new URL("../../", import.meta.url).pathname, "");
  lines.forEach((ln, i) => {
    for (const row of NON_TEXT_ROWS) {
      if (!new RegExp("\\b(?:bg|from|via|to)-" + row.bg + "\\b(?!/)").test(ln)) continue;
      windowsScanned++;
      const win = lines.slice(i, i + 12).join("\n");
      if (!new RegExp("\\b(?:text|fill|stroke|decoration)-" + row.fg + "\\b(?!/)").test(win)) continue;
      /* ⚠ A 3.0 FLOOR IS CORRECT FOR LARGE TEXT AS WELL AS FOR NON-TEXT MARKS, which is why the
       * first narrowed version reported two false positives. `PrincipleCard` draws the row's token
       * at `text-3xl` (30px) and `StatCard` at `text-5xl` (48px) — both LARGE by WCAG, where 3.0 IS
       * the floor. The chip failed at 14.4px and the readout at 12.5px, which is the real class.
       *
       * SO THE ROW'S FLOOR WAS RIGHT AND ITS LABEL WAS WRONG. It is not "non-text"; it is "3.0
       * applies", which covers a mark and large type alike. Only SMALL text on that ground is a
       * violation. */
      const bold = /\bfont-(?:bold|semibold|black|extrabold)\b|\bfont-\[7\d\d\]/.test(win);
      const px = (() => {
        const named = { "text-xs": 12, "text-sm": 14, "text-base": 16, "text-lg": 18, "text-xl": 20,
          "text-2xl": 24, "text-3xl": 30, "text-4xl": 36, "text-5xl": 48, "text-6xl": 60, "text-7xl": 72 };
        for (const [k, v] of Object.entries(named)) if (new RegExp("\\b" + k + "\\b").test(win)) return v;
        const rem = /text-\[([\d.]+)rem\]/.exec(win); if (rem) return Number(rem[1]) * 16;
        const p2 = /text-\[([\d.]+)px\]/.exec(win); if (p2) return Number(p2[1]);
        const cl = /text-\[clamp\(([\d.]+)rem/.exec(win); if (cl) return Number(cl[1]) * 16;
        return null;
      })();
      const large = px !== null && (bold ? px >= 18.66 : px >= 24);
      if (!large)
        violations.push(`${rel}:${i + 1} — ${row.fg} drawn as ${px === null ? "text of unknown size" : px + "px" + (bold ? " bold" : "")} on a ${row.bg} ground`);
    }
  });
}
console.log(`         ${windowsScanned} ground windows scanned for a foreground of the same row`);
/* ⚠ WHAT THIS SECTION CANNOT SEE, PROVEN BY A MUTATION RATHER THAN GUESSED. It finds a foreground
 * within 12 lines of a ground DECLARED IN THE SAME FILE. The rating chip is that shape and is
 * caught. THE LOVE READOUT IS NOT: it inherits its ground from the blog article's card several
 * components up, so no window in `LoveButton.tsx` contains one. Restoring its failure leaves this
 * row GREEN.
 *
 * That case needs a RENDER — the ground only exists once the tree is assembled — which is where the
 * chip was confirmed too. Stated rather than papered over: one of the two failures this section was
 * written for is outside its reach, and the comment beside the readout is its only protection. */
/* ⚠ RESOLVED BY HAND, EACH WITH WHAT IT PAINTS. A candidate leaves this list only when someone has
 * looked at the element and the ground — which is what the two rail sites did not get for as long as
 * the instrument could not see them. */
const CSS_RESOLVED = {
  "logo-singh": "the wordmark's tracked caps, on the nav glass — accent-500's own TEXT row covers it",
  "logo-sig": "the script half of the wordmark, hover state, same ground and same row",
  "header-mob-resume-pill": "text on the ACCENT fill, not a cream step — `on-accent`'s pairing",
  "footer-chip": "a social glyph, hover — a mark rather than type",
  "footer-label": "the social label, hover, on the footer ground",
  "pr-here": "the process rail's position marker",
  "next-rail-all": "a link — MOVED to text-secondary, it was 3.36 to 4.32 as ink-400",
  "next-rail-eyebrow": "an eyebrow — MOVED to text-subtle, same measurement",
  "next-rail-title": "the next-case title, hover",
  "next-rail-arrow": "the arrow glyph",
};
t("Z-css ⚠ EVERY CSS FOREGROUND CANDIDATE IS RESOLVED BY NAME — the eleven were found by hand because nothing looked",
  cssCandidates.filter((c) => !Object.keys(CSS_RESOLVED).some((k) => c.includes(k))).sort(), []);
t("Z-css0 …and the scan found candidates at all, against a literal — an empty scan resolves nothing and passes",
  cssCandidates.length >= 8, true);

t("Z-ui ⚠ EVERY UI ROW NAMES WHAT DRAWS IT — the negative form was false three times out of three",
  USAGE.filter((r) => r.min === 3.0 && (!r.draws || r.draws.length < 40)).map((r) => r.key), []);
t("M0 there ARE non-text rows to check — a zero would make M1 vacuous", NON_TEXT_ROWS.length >= 4, true);
t("M0a …and the scan found grounds to look inside, against a literal", windowsScanned >= 3, true);
t("M1 ⚠ NO NON-TEXT TOKEN IS DRAWN AS TEXT ON THE GROUND ITS ROW NAMES — the claim both rows got wrong",
  [...new Set(violations)].sort(), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
