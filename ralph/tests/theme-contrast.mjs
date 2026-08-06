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
  report, parseOklch, parseColor, contrastRatio, oklchToRgb,
} from "../../lib/theme-contrast.ts";

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
const CREAM = {};
for (const k of PUBLIC) { const v = resolve(k); if (v && parseColor(v)) CREAM[k] = v; }

/* ---- THE USAGE MAP. Which colour sits on which ground in which role. The palette varies per
 * theme; THIS DOES NOT. Every foreground below was confirmed to have public consumers by count
 * before it was written down, so no row is invented. */
const TEXT = (fg, bgs, note) => bgs.map((bg) => ({ key: `${fg} on ${bg}`, fg, bg, min: 4.5, kind: "external", note }));
const UI = (fg, bgs, note) => bgs.map((bg) => ({ key: `${fg} on ${bg} (non-text)`, fg, bg, min: 3.0, kind: "external", note }));
const GROUNDS = ["canvas", "cream-50", "cream-100", "cream-200"];

const USAGE = [
  ...TEXT("ink-950", GROUNDS), ...TEXT("ink-800", ["cream-50", "cream-100"]),
  ...TEXT("ink-600", GROUNDS), ...TEXT("text-primary", ["canvas"]),
  ...TEXT("text-secondary", ["canvas"]),
  /* `text-muted` stood beside this and is deleted — it held the same value, so its rows were a
     second copy of these. One name, one set of rows. */
  ...TEXT("text-subtle", GROUNDS), ...TEXT("accent-600", ["canvas", "cream-50", "cream-100"]),
  ...TEXT("on-dark", ["band-dark"]), ...TEXT("on-dark-muted", ["band-dark"]),
  ...TEXT("on-dark-quote", ["band-dark"]),
  /* Long-form prose. Named in #327 — it is 9.41 on cream-50, between text-primary and
     text-secondary, which is what made it a role rather than a spelling. */
  ...TEXT("text-body", ["canvas", "cream-50"]),

  /* ⚠ THE ROW THAT PROVES THE USAGE MAP IS LOAD-BEARING. accent-500's cream ladder is
     4.7 / 4.48 / 4.07 / 3.43, so it clears the text floor on cream-50 ALONE and misses cream-100
     by 0.02. A palette-only gate — every token against every ground — would refuse the site that
     ships today. It is text on ONE step and a non-text mark everywhere else, and that is a fact
     about the product rather than a tolerance in the gate. */
  ...TEXT("accent-500", ["cream-50"], "text on cream-50 only — misses cream-100 by 0.02"),
  ...UI("accent-500", ["canvas", "cream-100", "cream-200"]),
  ...UI("ink-400", ["cream-50", "cream-100", "cream-200"], "never text — fails 4.5 on every step"),

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
t("B9 and the uncomputable rows are named", inc.uncomputable, [
  "on-dark on band-dark", "on-dark-muted on band-dark", "on-dark-quote on band-dark"]);

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
 * computes: `@theme` on `:root`, the unlayered `[data-theme]` block winning over it. */
const HARBOUR = { ...CREAM, ...themeOverrides("harbour") };
const harbour = report(HARBOUR, USAGE);
t("D1 harbour is SHIPPABLE", harbour.verdict, "SHIPPABLE");
t("D2 nothing uncomputable — every row the map names exists in the palette", harbour.uncomputable, []);
t("D3 it is a DIFFERENT palette, not the defaults wearing a name",
  Object.keys(themeOverrides("harbour")).length > 15, true);

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

console.log("\nE · ⚠ THE BOUNDARY IS COMPLETE — every public colour is computed or listed BY NAME");

/* Measured with a public-consumer count before being written here, so "unused" is a fact rather
 * than an assumption. These six serve /studio from the public block; moving them is its own PR. */
const BOUNDARY = {
  "reveal-sand": "artwork — the reveal panel's ground, never a text pair",
  "case-study-sand": "artwork — the warm sand behind a case study",
  "glow-web": "atmosphere — a glow, never a foreground on a ground",
  "ink-200": "zero public consumers",
  "accent-400": "zero public consumers",
  "success-50": "zero public consumers",
  "success-700": "zero public consumers",
  "danger-600": "zero public consumers",
  "draft-600": "zero public consumers",

  /* ⚠ A CATEGORY THE BOUNDARY LIST DID NOT HAVE, AND E1 FOUND IT ON ITS FIRST RUN. `on-dark-line`
     is a `color-mix(... 16%, transparent)` derivative of `on-dark`, so it is not an oklch literal
     and the palette extraction drops it. It is a HAIRLINE on the dark band, never a foreground
     carrying text, and its base IS computed. Listed rather than computed — but listed is the
     point: before E1 existed it was neither, which is the exact shape of hazard 30. */
  /* ⚠ THE SECOND TIME THE MISSING HAIRLINE FLOOR HAS DECIDED SOMETHING. `--color-rule` is drawn at
     five alphas between .10 and .30 and never carries text, and this site states no contrast floor
     for a hairline — which is also why no public alpha row exists and why `over()` is exercised
     only by `studio-ink-contrast`. Listed rather than computed, and the gap is now worth naming:
     a stated hairline floor would move this row and that one out of the boundary in one go. */
  "rule": "hairline — five alphas, never text, and this design states no hairline floor",
  "on-dark-line": "alpha derivative — a hairline, not a foreground; its base on-dark is computed",
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
