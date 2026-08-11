// The copy formats — the first output on this page that leaves it.
// Run: node --experimental-strip-types ralph/tests/palette-formats.mjs
//
// ---- ⚠ WHY THIS EXECUTES THE FORMATTERS RATHER THAN READING THEM -----------------------------
//
// `palette-compat` had to check its generator by SOURCE, because that module imports `@/lib/...` at
// runtime and ralph's raw loader cannot resolve the alias. `lib/palettes/formats.ts` imports only a
// TYPE from `@/`, which strip-types erases — so this suite calls the real functions and asserts what
// they actually emit. A source grep is a proxy for behaviour; this is the behaviour.
//
// ---- ⚠ THE ROW THAT MATTERS IS THE IDENTITY, AND IT IS FALSIFIABLE IN ONE DIRECTION -----------
//
// The panel and the copy block must show a stranger the same numbers. Both call `formatRatio`, so
// MUTATING `formatRatio` MOVES BOTH AND THE ROW STILL PASSES — that is correct, they stayed in step.
// What must fail is one side formatting independently: a `toFixed(1)` written inline in the report
// lines, a rounding that drops a place, a block that emits a subset. B1 compares the multiset of
// figures in the emitted text against the multiset the report produces, so any of those reddens it.
import {
  formatRatio, toCss, toTailwind, toJson, render, FORMATS, tokenEntries,
} from "../../lib/palettes/formats.ts";
import {
  readPaletteSource, layerPalette, paletteResolver, report, usageFor,
} from "../../lib/theme-contrast.ts";
import {
  THEME_NAMES, VERIFY_THEME, DEFAULT_THEME, THEME_GROUND, GROUND_TOKEN, THEME_COUNTERPART,
} from "../../lib/theme.ts";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* The real palettes, assembled here the way the generator assembles them — this suite cannot import
 * the generator (it uses `@/` at runtime), so it calls the same leaf functions in the same order. */
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const SOURCE = readPaletteSource(css);
const { resolvedPalette } = paletteResolver(SOURCE.rawDecl);
const REAL = THEME_NAMES.filter((n) => n !== VERIFY_THEME);
const build = (name) => {
  const groundClass = THEME_GROUND[name];
  const tokens = resolvedPalette(layerPalette(SOURCE, name, { defaultTheme: DEFAULT_THEME, groundClass }));
  const r = report(tokens, usageFor(GROUND_TOKEN[groundClass]));
  return {
    name, groundClass, counterpart: THEME_COUNTERPART[name], verdict: r.verdict,
    rows: r.rows.map((x) => ({ key: x.key, fg: x.fg, bg: x.bg, min: x.min, kind: x.kind, got: x.got })),
    tokens,
  };
};
const PALETTES = REAL.map(build);

console.log("\nA · the subject is real");
t("A0 every real palette assembled — a short list would make every row below weaker than it reads",
  PALETTES.length, REAL.length);
t("A0a …and each has rows to format, so the identity below is not comparing empty sets",
  PALETTES.filter((p) => p.rows.length < 10).map((p) => p.name), []);
t("A1 the three formats are declared, and `render` covers every one",
  FORMATS.map((f) => f.id), ["css", "tailwind", "json"]);

console.log("\nB · the identity — the block's figures ARE the panel's figures");
/* ⚠ THE MULTISET, NOT A SUBSET CHECK. "Every row appears somewhere" passes a block that also emits
 * three figures from nowhere; "every figure is a row's" passes a block that emits one row. Comparing
 * sorted multisets catches an extra, a missing, and a reformatted one with the same assertion. */
/* ⚠ `\d+` RATHER THAN `\d{2}` FOR THE FRACTION, AND THE FIXED WIDTH WAS A FALSE FAILURE WAITING.
 * Pinning two places bakes `formatRatio`'s CURRENT precision into the matcher, so changing the
 * SHARED formatter to three places reddened this row — even though both surfaces had moved together,
 * which is the case it is supposed to allow. Caught by the mutation written to prove it survives.
 * Following whatever precision is emitted keeps the row about DIVERGENCE, which is its subject. */
const figuresIn = (text) => [...text.matchAll(/\b\d+\.\d+\b/g)].map((m) => m[0]).sort();
const expected = (p) => p.rows.map((r) => formatRatio(r.got)).sort();
for (const fmt of ["css", "tailwind"]) {
  t(`B1 ⚠ ${fmt}: EVERY FIGURE IN THE BLOCK IS A ROW'S, AND EVERY ROW IS IN THE BLOCK — one formatter, both surfaces`,
    PALETTES.filter((p) => JSON.stringify(figuresIn(render(p, fmt))) !== JSON.stringify(expected(p)))
      .map((p) => p.name), []);
}
/* JSON's figures are numbers rather than text, so the same claim is made against the parsed value —
 * which also proves the JSON is valid, and proves the ratio survived `Number()` unchanged. */
t("B1-json ⚠ AND JSON CARRIES THE SAME FIGURES, through a parse rather than a regex",
  PALETTES.filter((p) => {
    const parsed = JSON.parse(toJson(p));
    /* ⚠ `formatRatio` ON BOTH SIDES, NOT `toFixed(2)`. The same hardcoded precision that made B1 a
     * false failure was sitting here too, and fixing one and leaving the other is exactly the
     * "a repair for an unfalsifiable row introduces a fresh one" shape — found by re-running the
     * survive-mutation after the first repair rather than trusting it. */
    const got = parsed.contrast.map((c) => formatRatio(c.ratio)).sort();
    return JSON.stringify(got) !== JSON.stringify(expected(p));
  }).map((p) => p.name), []);
t("B2 …and the row COUNT matches the report, so a truncated block cannot pass by agreeing on what it kept",
  PALETTES.filter((p) => JSON.parse(toJson(p)).contrast.length !== p.rows.length).map((p) => p.name), []);

console.log("\nC · no format quietly carries less");
/* ⚠ JSON HAS NO COMMENT SYNTAX, SO THE REPORT IS DATA THERE — asserted, not assumed. The failure to
 * avoid is a format that silently drops the report, which nobody notices until they rely on it. */
t("C1 ⚠ JSON CARRIES EVERY ROW'S PAIR, RATIO, FLOOR AND FLOOR KIND — richer than the comment forms, not poorer",
  PALETTES.filter((p) => JSON.parse(toJson(p)).contrast
    .some((c) => !c.pair || typeof c.ratio !== "number" || typeof c.floor !== "number" || !c.kind))
    .map((p) => p.name), []);
t("C2 …and the comment forms carry the report too, one line per pair",
  PALETTES.filter((p) => {
    const body = toCss(p).slice(0, toCss(p).indexOf("*/"));
    return p.rows.some((r) => !body.includes(r.key));
  }).map((p) => p.name), []);
t("C3 every format names the palette and its counterpart, so a copied file says where it came from",
  PALETTES.filter((p) => !FORMATS.every((f) => {
    const out = render(p, f.id);
    return out.includes(p.name) && out.includes(p.counterpart);
  })).map((p) => p.name), []);

console.log("\nD · what leaves the page is a LITERAL, never an alias");
/* ⚠ #500's DEFECT POINTED OUTWARD, AND THE MOST LIKELY WAY THIS FEATURE SHIPS SOMETHING WRONG.
 * `--color-surface: var(--color-cream-50)` pasted into a stranger's project resolves to nothing —
 * a stylesheet of dead declarations that looks complete. */
t("D1 ⚠ NO EMITTED VALUE IS AN ALIAS — every token in every format, on every palette",
  PALETTES.flatMap((p) => FORMATS
    .filter((f) => /var\(|color-mix\(/.test(render(p, f.id)))
    .map((f) => `${p.name}:${f.id}`)), []);
t("D1a …and the token count in a block equals the palette's, so D1 cannot pass by emitting fewer",
  PALETTES.filter((p) => {
    const declared = (toCss(p).match(/^\s+--color-/gm) ?? []).length;
    return declared !== tokenEntries(p).length;
  }).map((p) => p.name), []);
/* ⚠ AND THE REFUSAL FIRES RATHER THAN BEING DOCUMENTED. "Already resolved upstream" is a property of
 * a different file, which this one cannot see — so it throws, and this row proves the throw works. */
const aliasCarrier = { ...PALETTES[0], tokens: { ...PALETTES[0].tokens, surface: "var(--color-cream-50)" } };
let threw = false;
try { toCss(aliasCarrier); } catch { threw = true; }
t("D2 ⚠ AND AN ALIAS IS REFUSED AT THE FORMATTER, not merely absent by luck upstream", threw, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
