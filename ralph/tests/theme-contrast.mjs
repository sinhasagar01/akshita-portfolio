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
import { THEME_NAMES, DEFAULT_THEME, VERIFY_THEME } from "../../lib/theme.ts";

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
 * ⚠ AND THE AUDIT SAYS WHAT REMAINS. 17 of the 18 listed tokens parse. The one that does not is
 * `on-dark-line`, a `color-mix()` over another token — UNPARSEABLE BY NATURE rather than by defect,
 * because it is derived rather than literal. `unparseable` below asserts exactly that distinction:
 * a failure is acceptable only when the value references another token. */
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
  /* The case-study h1 on a wide hero. It is the accent in its heading ROLE on ink, so it is
   * computed here rather than excused anywhere — the h1 is the largest text on the page. */
  ...TEXT("accent-on-dark", ["band-dark"]),
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
t("D1 harbour clears every contrast floor — the half this row always got right",
  [harbour.external, harbour.internal], [[], []]);
t("D1a ⚠ AND IT IS UNREPRESENTABLE ANYWAY — its accent is 60.7 outside sRGB and ships clamped",
  harbour.verdict, "UNREPRESENTABLE");
t("D1b …named, so the entry cannot decay into a bare verdict nobody can act on",
  harbour.unrepresentable.map((u) => u.token).sort(), ["accent-500", "accent-600", "glow-web"]);
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
 * the finding; the refusals were its symptom. */
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
console.log(`         ${REAL.length} real palettes -> ${PAIRS.length} pairs, derived from THEME_NAMES`);
for (const n of REAL) console.log(`           ${n.padEnd(10)} ground h${HUES[n].ground}  accent h${HUES[n].accent}`);

t("D12a every palette resolves BOTH hues, so the rows below are not comparing nulls",
  REAL.filter((n) => typeof HUES[n].ground !== "number" || typeof HUES[n].accent !== "number"), []);
/* ⚠ THE DENOMINATOR. A derived pair list that derived nothing would pass every row beneath it, and
 * an empty subject reading as success is this project's most repeated defect. */
t("D12b the pair list is derived and non-trivial — 5 palettes must give 10 pairs",
  PAIRS.length, (REAL.length * (REAL.length - 1)) / 2);
t("D12c …and it grew with the palettes rather than staying at the hardcoded three", PAIRS.length >= 10, true);

t("D12 ⚠ NO TWO GROUNDS ARE ADJACENT — a palette near an existing one tells you nothing new",
  PAIRS.filter(([a, b]) => arc(HUES[a].ground, HUES[b].ground) < 60)
    .map(([a, b]) => `${a}/${b} ${arc(HUES[a].ground, HUES[b].ground)}`), []);
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
/* ⚠ THE CAPABILITY ASSERTION, SEPARATE FROM THE POLICY ONE. Every token the parser cannot read must
 * be DERIVED — a `var()` reference rather than a literal. A literal it cannot read is a parser
 * defect, and being on the boundary list must never make one invisible again. */
t("E7 every unparseable token is DERIVED, not a literal the parser cannot read",
  unparseable.filter((u) => !u.derived).map((u) => `${u.name}: ${u.value}`), []);
t("E8 …and the unparseable set is enumerated rather than filtered away silently",
  unparseable.map((u) => u.name).sort(), ["on-dark-line"]);


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
const KNOWN_CLIPPED = {
  "harbour accent-500": "⚠ THE BRAND COLOUR, 60.7 OUTSIDE sRGB AND SHIPPED. h168 at L .52 holds "
    + "0.121 of chroma and this asks 0.12 at a lightness where it does not fit; the clamp lands on "
    + "rgb(0, 126, 91), which is what THEME_OG independently recorded. Clears when harbour's accent "
    + "is re-derived against the ceiling — a repaint of the brand colour, so it needs a render.",
  "harbour accent-600": "the same accent one step darker, 64.3 out, clipping for the same reason. "
    + "Clears with accent-500 in the same pass.",
  "harbour glow-web": "atmosphere, never a foreground on a ground — 132.0 out at c 0.115 h205. "
    + "The most extreme clip on the site and the least consequential, because it is a wash behind "
    + "content. Clears when the glow is re-derived against the ceiling.",
};

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
t("K1a …and it still finds the known-worst, so the predicate has not quietly narrowed",
  clips.some((c) => c.key === "harbour glow-web" && c.over > 100), true);
t("K2 ⚠ NO UNDECLARED TOKEN IS OUTSIDE sRGB — a new one is a colour the stylesheet asks for and no screen draws",
  clips.filter((c) => !(c.key in KNOWN_CLIPPED)).map((c) => `${c.key} (+${c.over})`), []);
t("K3 every declared clip still clips — a stale entry is an exemption for a token that was fixed",
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
