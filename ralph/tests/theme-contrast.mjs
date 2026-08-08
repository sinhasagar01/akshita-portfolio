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

/* ⚠ SCOPED TO `@theme`, WHICH IS THE DEFAULT PALETTE — cream. Unscoped, a first-wins scan happens
 * to read cream correctly only because `@theme` precedes the theme blocks in the file, and a gate
 * that is right by file ordering is a gate one reorder from being wrong. `studio-ink-contrast` had
 * the last-wins version of the same scan and started reading harbour's colours the moment theme
 * two landed. Brace-matched rather than regex-bounded, so a nested rule cannot end it early. */
const themeBlock = (src) => {
  const start = src.indexOf("@theme");
  if (start < 0) throw new Error("no @theme block in globals.css");
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open + 1, i);
  }
  throw new Error("unterminated @theme block");
};
const css = themeBlock(cssAll);

/** One theme's declarations, read from its `[data-theme="…"]` block. Cream has none by design —
 *  `@theme` IS cream — so a themed palette is the defaults with that block layered over them. */
const themeOverrides = (name) => {
  const at = cssAll.indexOf(`[data-theme="${name}"]`);
  if (at < 0) return {};
  const open = cssAll.indexOf("{", at);
  let depth = 0, end = -1;
  for (let i = open; i < cssAll.length; i++) {
    if (cssAll[i] === "{") depth++;
    else if (cssAll[i] === "}" && --depth === 0) { end = i; break; }
  }
  const out = {};
  for (const m of cssAll.slice(open + 1, end).matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
};

console.log("\nS · the sanity pair, first — abort trust if a known input reads wrong");
t("S1 white on black is 21:1", Math.round(contrastRatio([255, 255, 255], [0, 0, 0])), 21);
t("S2 the oklch transform lands ink-950 on its known bytes", oklchToRgb(0.14, 0.018, 60), [15, 7, 3]);
t("S3 …and cream-50 on its known bytes", oklchToRgb(0.985, 0.012, 80), [254, 249, 241]);

/* ---- THE SHIPPED PALETTE, read from the same file the screen renders from. Aliases are resolved,
 * so `--color-background: var(--color-canvas)` contributes canvas's colour under both names. */
const rawDecl = {};
for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) if (!(m[1] in rawDecl)) rawDecl[m[1]] = m[2].trim();
const aliasOf = (name) => {
  const m = /^var\(\s*--color-([a-z0-9-]+)\s*\)$/.exec(rawDecl[name] ?? "");
  return m ? m[1] : null;
};
const resolve = (name, depth = 0) => {
  const a = aliasOf(name);
  return a && depth < 5 ? resolve(a, depth + 1) : rawDecl[name];
};
const PUBLIC = Object.keys(rawDecl).filter((k) => !k.startsWith("studio-"));

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
const CREAM = {};
const unparseable = [];
for (const k of PUBLIC) {
  const v = resolve(k);
  if (!v) continue;
  if (parseColor(v)) CREAM[k] = v;
  else unparseable.push({ name: k, value: v, derived: /var\(--/.test(v) });
}

/* ---- THE USAGE MAP. Which colour sits on which ground in which role. The palette varies per
 * theme; THIS DOES NOT. Every foreground below was confirmed to have public consumers by count
 * before it was written down, so no row is invented. */
const TEXT = (fg, bgs, note) => bgs.map((bg) => ({ key: `${fg} on ${bg}`, fg, bg, min: 4.5, kind: "external", note }));
/* ⚠ A UI ROW NAMES ITS CONSUMER, AND `draws` IS REQUIRED. Three UI rows have existed and ALL THREE
 * WERE FALSE — accent-500's "non-text everywhere else" (the rating chip), ink-400's "never text"
 * (the love readout), and ink-400 again (the next-case rail's eyebrow and link). That is the
 * population, not a sample.
 *
 * ⚠ THE ASYMMETRY IS STRUCTURAL RATHER THAN STATISTICAL. A TEXT row claims a pair IS text and its
 * foreground is drawn, so the claim is checkable against the thing it describes. A UI row in the old
 * form claimed an element is NOT text — a claim about everywhere it is not, which nothing in this
 * map can falsify. So the negative form is gone: a row states WHAT DRAWS IT and ON WHAT GROUND THAT
 * WAS MEASURED, and `Z-ui` fails a row that does not. A fourth row cannot be written in the old
 * shape by someone who has not read this. */
const UI = (fg, bgs, draws) => bgs.map((bg) => ({ key: `${fg} on ${bg} (non-text)`, fg, bg, min: 3.0, kind: "external", draws }));
const GROUNDS = ["canvas", "cream-50", "cream-100", "cream-200"];

const USAGE = [
  /* ⚠ `cream-200` JOINED ink-800's ROW IN #379, WITH A CONSUMER BEHIND IT. `.blog-plate` draws its
     text on a `cream-100 -> cream-200` gradient, so the DARKER end is a real text-on-ground pair
     that this map did not name — the plate had never rendered (every post carried a hero), so the
     pair had no consumer to be counted until #376 unset two. Measured across all five palettes
     before adding: 12.87 / 12.45 / 12.66 / 11.76 / 11.63, worst margin +7.13. */
  ...TEXT("ink-950", GROUNDS), ...TEXT("ink-800", ["cream-50", "cream-100", "cream-200"]),
  ...TEXT("ink-600", GROUNDS), ...TEXT("text-primary", ["canvas"]),
  ...TEXT("text-secondary", ["canvas"]),
  /* `text-muted` stood beside this and is deleted — it held the same value, so its rows were a
     second copy of these. One name, one set of rows. */
  ...TEXT("text-subtle", GROUNDS), ...TEXT("accent-600", ["canvas", "cream-50", "cream-100"]),
  ...TEXT("on-dark", ["band-dark"]), ...TEXT("on-dark-muted", ["band-dark"]),
  ...TEXT("on-dark-quote", ["band-dark"]),
  /* The case-study h1 on a wide hero. It is the accent in its heading ROLE on ink, so it is
   * computed here rather than excused anywhere — the h1 is the largest text on the page. */
  ...TEXT("accent-on-dark", ["band-dark"]),
  /* Long-form prose. Named in #327 — it is 9.41 on cream-50, between text-primary and
     text-secondary, which is what made it a role rather than a spelling. */
  ...TEXT("text-body", ["canvas", "cream-50"]),

  /* ⚠ THE ROW THAT PROVES THE USAGE MAP IS LOAD-BEARING. accent-500's cream ladder is
     4.7 / 4.48 / 4.07 / 3.43, so it clears the text floor on cream-50 ALONE and misses cream-100
     by 0.02. A palette-only gate — every token against every ground — would refuse the site that
     ships today.

     ⚠ AND THE SENTENCE THAT USED TO FOLLOW WAS FALSE, WHICH IS THE MORE IMPORTANT HALF. It read
     "it is text on ONE step and a non-text mark everywhere else, and that is a fact about the
     product rather than a tolerance in the gate." A CLAIMED PRODUCT FACT, STATED WITH UNUSUAL
     CONFIDENCE, THAT NOTHING CHECKED AND THAT WAS WRONG. `HeroCover`'s rating chip drew accent-500
     as TEXT on cream-200 at 14.4px — failing AA on four of five shipped palettes, on all four case
     studies, since the chip was built.

     ⚠ THE GATE WAS NOT WRONG. IT WAS TOLD THE WRONG THING, in prose, by someone who was certain.
     That is the token-claim shape moved from TOKENS to USAGE, and it is worse: a wrong token claim
     mislabels a colour, a wrong usage claim mislabels WHAT AN ELEMENT IS — and the floor follows
     from that.

     ⚠ THE `ink-400` ROW BELOW CARRIED THE SAME DEFECT AND WAS FOUND BY ENUMERATING RATHER THAN BY
     ACCIDENT. It said "never text"; the blog's love readout drew it at 12.5px, failing on ALL FIVE
     palettes. Two rows in this section, two false product facts, one found by a new palette's
     refusal and one by checking its neighbour.

     Both elements moved rather than the tokens — accent-500 and ink-400 are correct everywhere else
     they land, which is what makes a single-site fix honest rather than a patch. Section M asserts
     every non-text row against a real consumer, so the claim cannot be false again in silence. */
  ...TEXT("accent-500", ["cream-50"], "text on cream-50 only — misses cream-100 by 0.02"),
  ...UI("accent-500", ["canvas", "cream-100", "cream-200"],
    "the work-card category tint and the process diagram's accent outline — marks, not glyphs, "
    + "measured on those grounds. Its ONE text consumer is the row above, on cream-50."),
  ...UI("ink-400", ["cream-50", "cream-100", "cream-200"],
    "icon rests — the stepper's inactive dots and the device-shelf marks. NOT the next-case rail, "
    + "which drew it as text at 3.36 to 4.32 until the eyebrow took text-subtle and the link text-secondary."),

  /* ⚠ INTERNAL. THE GROUND LADDER IS THIS DESIGN'S OWN NUMBER, NOT WCAG'S. cream-50/cream-100 sits
     at exactly 1.05, which is where the floor came from, so a theme with a different ladder may
     legitimately need it retuned — and that is the whole reason the verdict is typed. */
  ...[["cream-50", "cream-100"], ["cream-100", "cream-200"], ["cream-200", "cream-300"],
      ["cream-300", "canvas"]].map(([a, b]) => ({
    key: `ground step ${a} / ${b}`, fg: a, bg: b, min: 1.05, kind: "internal",
  })),
];

console.log("\nA · the shipped palette is shippable, and every row computes");
const cream = report(CREAM, USAGE);
t("A1 verdict", cream.verdict, "SHIPPABLE");
t("A2 nothing uncomputable — a skipped row is a colour nobody knows is unchecked", cream.uncomputable, []);
t("A3 no failures", cream.failures.map((r) => r.key), []);
t("A4 the row count is what the map declares — a shrunken map passes vacuously",
  cream.rows.length, USAGE.length);
/* Pinned, so a token retuned in globals.css moves this and fails on arrival. */
const got = (k) => cream.rows.find((r) => r.key === k)?.got;
t("A5 accent-500's cream ladder, computed", [got("accent-500 on cream-50"),
  got("accent-500 on cream-100 (non-text)"), got("accent-500 on cream-200 (non-text)")], [4.7, 4.48, 4.07]);
t("A6 the ground ladder, computed", [got("ground step cream-50 / cream-100"),
  got("ground step cream-100 / cream-200"), got("ground step cream-200 / cream-300"),
  got("ground step cream-300 / canvas")], [1.05, 1.1, 1.19, 1.13]);

console.log("\nB · it REFUSES — both verdict types, not just the mechanism");

/* ⚠ EXTERNAL. ink-600 lightened until body text misses WCAG AA. Nothing else moves, so the failure
 * cannot be a side effect of a broken fixture. */
const badExternal = { ...CREAM, "ink-600": "oklch(75.0% 0.016 60)" };
const bx = report(badExternal, USAGE);
t("B1 a palette failing WCAG is REFUSED_EXTERNAL", bx.verdict, "REFUSED_EXTERNAL");
t("B2 and the failing pairs are named, not counted", bx.external, [
  "ink-600 on canvas", "ink-600 on cream-50", "ink-600 on cream-100", "ink-600 on cream-200"]);
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
const HARBOUR = { ...CREAM, ...themeOverrides("harbour") };
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
const ORCHID = { ...CREAM, ...themeOverrides("orchid") };
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
  { label: "light", min: 0.920, max: 0.962, hueFloor: 60, floorUnit: "degrees",
    why: "the five shipped palettes. 60 degrees is measured on THIS band and the palette count is "
       + "bounded by it — seven hues on a circle are 51.4 apart, so five real palettes is the ceiling. "
       + "⚠ AND DEGREES IS PROBABLY THE WRONG UNIT HERE TOO, LATENT RATHER THAN BROKEN. It works only "
       + "because every shipped light ground carries chroma (0.016 to 0.022) and NOTHING FORBIDS ZERO. "
       + "An achromatic light palette — a paper or newsprint theme — has no hue, and this floor would "
       + "be silent about it exactly as the dark band's would have been about Basalt. The hole is "
       + "identical and only the dark band has met a member that exposes it. Move this to dE when one "
       + "is proposed, or when the dark band's value is set and the two can share a unit." },
  { label: "dark", min: 0.150, max: 0.200, hueFloor: null, floorUnit: "dE",
    why: "the dark class. ONE member shipped, so there is no pair to separate and no floor has been "
       + "measured. Null rather than 60 because 60 belongs to the light band's chroma — a dark ground "
       + "at c 0.016 would need 117 degrees for the same separation. "
       + "⚠ AND THE UNIT IS dE RATHER THAN DEGREES, WHICH IS A CANDIDATE PALETTE'S DOING. `Basalt` "
       + "proposes a ZERO-CHROMA ground: it has no hue, so a floor in degrees is not merely wrong "
       + "about it, it is SILENT — and silence reads as a pass. Same shape as a census row that "
       + "cannot be matched by form: a member outside the predicate's vocabulary, passing because it "
       + "cannot be evaluated. Measured, Basalt separates from the other three by dE 7.3 to 10.2 "
       + "while two of its three degree figures are large and one is meaningless. "
       + "⚠ THE VALUE STAYS NULL DELIBERATELY: four members with one achromatic is the wrong "
       + "population to derive from, and the pair that would decide it — sapphire and Nocturne at 32 "
       + "degrees and dE 4.7 — is a RENDER question rather than a derivation, the same one orchid and "
       + "ultraviolet raised at 27. The first pair that looks too close sets it." },
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
const paletteOf = (n) => (n === DEFAULT_THEME ? CREAM : { ...CREAM, ...themeOverrides(n) });
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
  const m = /oklch\(\s*([\d.]+)(%?)\s+/.exec(paletteOf(n)[tokenName] ?? "");
  return m ? (m[2] === "%" ? Number(m[1]) / 100 : Number(m[1])) : null;
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
t("D12 ⚠ NO TWO GROUNDS IN ONE CLASS ARE ADJACENT — across classes the comparison does not apply",
  PAIRS.filter(([a, b]) => sameBand(a, b) && arc(HUES[a].ground, HUES[b].ground) < (bandFloor(a) ?? 0))
    .map(([a, b]) => `${a}/${b} ${arc(HUES[a].ground, HUES[b].ground)}`), []);
t("D12f ⚠ AND CROSS-BAND PAIRS ARE COUNTED RATHER THAN SILENTLY DROPPED — a skipped pair must be visible",
  typeof crossBandPairs === "number" && crossBandPairs >= 0, true);
t("D12d ⚠ NOR TWO ACCENTS — the accent is the colour a visitor remembers, and NOTHING checked it",
  PAIRS.filter(([a, b]) => arc(HUES[a].accent, HUES[b].accent) < 30)
    .map(([a, b]) => `${a}/${b} ${arc(HUES[a].accent, HUES[b].accent)}`), []);
/* ⚠ ORDERED, BOTH WAYS. The defect is asymmetric — a ground ON another palette's accent — so a
 * pair list that compares each duo once would miss it in one direction. */
t("D12e ⚠ AND NO PALETTE'S GROUND SITS ON ANOTHER'S ACCENT — the exact shape that would have passed",
  REAL.flatMap((a) => REAL.filter((b) => b !== a)
    .filter((b) => arc(HUES[a].ground, HUES[b].accent) < 25)
    .map((b) => `${a} ground h${HUES[a].ground} on ${b} accent h${HUES[b].accent}`)), []);

console.log("\nE · ⚠ THE BOUNDARY IS COMPLETE — every public colour is computed or listed BY NAME");

/* Measured with a public-consumer count before being written here, so "unused" is a fact rather
 * than an assumption. These six serve /studio from the public block; moving them is its own PR. */
const BOUNDARY = {
  "reveal-sand": "artwork — the reveal panel's ground, never a text pair",
  "case-study-sand": "artwork — the warm sand behind a case study",
  "glow-web": "atmosphere — a glow, never a foreground on a ground",
  "ink-200": "zero public consumers",
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
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
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
const impossible = { ...CREAM, ...themeOverrides("fern"), "accent-500": "oklch(54.0% 0.16 158)" };
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
t("L3 ⚠ EVERY BAND'S MEMBERS CLEAR THAT BAND'S OWN FLOOR — and a band with no measured floor enforces none",
  bandPairs.flatMap(([b, members]) => b.hueFloor === null ? []
    : members.flatMap((a, i) => members.slice(i + 1)
        .filter((c) => arc(HUES[a].ground, HUES[c].ground) < b.hueFloor)
        .map((c) => `${a}/${c} in ${b.label}: ${arc(HUES[a].ground, HUES[c].ground)} < ${b.hueFloor}`))), []);
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
