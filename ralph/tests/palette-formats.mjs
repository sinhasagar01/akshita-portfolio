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
  readPaletteSource, layerPalette, paletteResolver, report, usageFor, parseColor, hexOf,
  srgbFallbackOf, alphaOf,
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
const { resolvedPalette, authoredPalette } = paletteResolver(SOURCE.rawDecl);
const REAL = THEME_NAMES.filter((n) => n !== VERIFY_THEME);
const build = (name) => {
  const groundClass = THEME_GROUND[name];
  const layered = layerPalette(SOURCE, name, { defaultTheme: DEFAULT_THEME, groundClass });
  /* Two renderings of one palette, assembled in the same order `paletteCompatibility` assembles
     them. `bytes` is what `report` measures; `tokens` is what a stranger is handed. */
  const bytes = resolvedPalette(layered);
  const tokens = authoredPalette(layered);
  const r = report(bytes, usageFor(GROUND_TOKEN[groundClass]));
  return {
    name, groundClass, counterpart: THEME_COUNTERPART[name], verdict: r.verdict,
    rows: r.rows.map((x) => ({ key: x.key, fg: x.fg, bg: x.bg, min: x.min, kind: x.kind, got: x.got })),
    tokens,
    fallback: Object.fromEntries(Object.keys(tokens).map((k) => {
      const rgb = parseColor(bytes[k]);
      return [k, rgb ? srgbFallbackOf(rgb, tokens[k]) : bytes[k]];
    })),
    /* Kept for section E, which must compare the published form against the measured one. Nothing
       in the shipped `PaletteCompatibility` carries this — the suite needs both sides and the page
       needs only one. */
    bytes,
    layered,
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
/* ⚠ SCOPED TO THE REPORT COMMENT, AND THE UNSCOPED VERSION BROKE THE MOMENT THE VALUES BECAME
 * OKLCH. It matched every decimal in the whole emitted text, which was safe only because hex
 * contains none — `#b65329` has no `.`, so "every figure in the block" and "every figure in the
 * report" were the same set BY ACCIDENT OF THE NOTATION. `oklch(56.0% 0.14 42)` contributes two
 * more, and the row would have reddened on a change that moved no ratio at all.
 *
 * The subject was always the REPORT agreeing with the panel. Naming that explicitly is what makes
 * the row survive a notation change, and it is the reason the header is extracted rather than the
 * matcher being narrowed to exclude things that look like colours. */
const reportOf = (text) => text.slice(0, text.indexOf("*/"));
const figuresIn = (text) => [...text.matchAll(/\b\d+\.\d+\b/g)].map((m) => m[0]).sort();
const expected = (p) => p.rows.map((r) => formatRatio(r.got)).sort();
for (const fmt of ["css", "tailwind"]) {
  t(`B1 ⚠ ${fmt}: EVERY FIGURE IN THE REPORT IS A ROW'S, AND EVERY ROW IS IN THE REPORT — one formatter, both surfaces`,
    PALETTES.filter((p) => JSON.stringify(figuresIn(reportOf(render(p, fmt)))) !== JSON.stringify(expected(p)))
      .map((p) => p.name), []);
}
/* ⚠ A `B1a` GUARDING THE SLICE WAS WRITTEN HERE AND DELETED, WHICH IS WORTH A LINE BECAUSE THE
 * REASONING FOR IT LOOKED SOUND. It asserted the report region is non-empty and holds every row,
 * on the usual argument that an `indexOf` returning -1 makes B1 compare two empty sets and pass.
 *
 * IT CANNOT FAIL ALONE. B1 compares MULTISETS, and equal multisets have equal counts — so B1a
 * passed whenever B1 passed and carried no information B1 did not. The empty-set case it named is
 * already closed by A0a, which floors every palette at ten rows, so `expected(p)` is never empty
 * and B1 can never be a comparison of nothing against nothing.
 *
 * Found by asking what would have to change for it to redden and finding nothing a reasonable edit
 * could do — the test this repo applies to every new row. Six other rows added in the same unit
 * passed that test and were kept; this is the one it removed. */
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
/* ⚠ TWICE THE PALETTE, BECAUSE THE FALLBACK DECLARES THE SAME TOKENS AGAIN — and the factor is
 * asserted rather than divided out. `declared / 2 === count` would pass a block that emitted every
 * token four times, or one that emitted the values twice and no fallback at all. Splitting the
 * text at the `@supports` line and counting each side separately is what distinguishes those. */
const [valuesPart, fallbackPart] = (() => {
  const at = (p) => { const s = toCss(p); const i = s.indexOf("@supports"); return [s.slice(0, i), s.slice(i)]; };
  return [(p) => at(p)[0], (p) => at(p)[1]];
})();
t("D1a …and the VALUES block declares every token exactly once, so D1 cannot pass by emitting fewer",
  PALETTES.filter((p) => (valuesPart(p).match(/^\s+--color-/gm) ?? []).length !== tokenEntries(p).length)
    .map((p) => p.name), []);
t("D1b …and the FALLBACK block declares every token exactly once too — a partial fallback is a palette that half-degrades",
  PALETTES.filter((p) => (fallbackPart(p).match(/^\s+--color-/gm) ?? []).length !== tokenEntries(p).length)
    .map((p) => p.name), []);
/* ⚠ AND THE REFUSAL FIRES RATHER THAN BEING DOCUMENTED. "Already resolved upstream" is a property of
 * a different file, which this one cannot see — so it throws, and this row proves the throw works. */
const aliasCarrier = { ...PALETTES[0], tokens: { ...PALETTES[0].tokens, surface: "var(--color-cream-50)" } };
let threw = false;
try { toCss(aliasCarrier); } catch { threw = true; }
t("D2 ⚠ AND AN ALIAS IS REFUSED AT THE FORMATTER, not merely absent by luck upstream", threw, true);

console.log("\nE · the published form is OKLCH, and it is the colour that was measured");
/* ⚠ THE WHOLE COMMIT RESTS ON ONE CLAIM — that publishing OKLCH and measuring bytes cannot come
 * apart. Two renderings of one palette is the second-spelling hazard `formats.ts` is written
 * against, so the binding is asserted here rather than argued in a comment. */
t("E0 ⚠ THE SUBJECT IS REAL — every palette carries both renderings, at the same token count",
  PALETTES.filter((p) => Object.keys(p.tokens).length !== Object.keys(p.bytes).length
    || Object.keys(p.tokens).length < 40).map((p) => p.name), []);
/* ⚠ THE ROW THAT CANNOT BE SATISFIED BY AGREEMENT ON A NOTATION. It re-parses the published string
 * and compares the BYTES against the ones `report` was handed. A published value half a byte from
 * the measured one reddens it; a published value in a different but equivalent spelling does not,
 * which is the correct behaviour for a row about colour rather than about text. */
t("E1 ⚠ EVERY PUBLISHED VALUE RE-PARSES TO THE EXACT BYTES `report` MEASURED — 450 tokens, no drift",
  PALETTES.flatMap((p) => Object.keys(p.tokens).filter((k) => {
    const a = parseColor(p.tokens[k]), b = parseColor(p.bytes[k]);
    return !a || !b || hexOf(a) !== hexOf(b);
  }).map((k) => `${p.name}:${k}`)), []);
t("E2 …and every published value is a colour a parser can read, so E1 cannot pass on an unparseable pair being skipped",
  PALETTES.flatMap((p) => Object.keys(p.tokens).filter((k) => parseColor(p.tokens[k]) === null)
    .map((k) => `${p.name}:${k}`)), []);
/* ⚠ THE NOTATION CLAIM, STATED AS A COUNT RATHER THAN AS A PREDICATE OVER ONE TOKEN. "No hex is
 * emitted as a value" would pass a block that emitted nothing. */
t("E3 ⚠ NO PUBLISHED VALUE IS HEX — the page argues OKLCH re-themes and must not hand over frozen sRGB",
  PALETTES.flatMap((p) => Object.keys(p.tokens).filter((k) => /^#/.test(p.tokens[k]))
    .map((k) => `${p.name}:${k}`)), []);
t("E3a …and every one of them IS oklch, which is a different claim from not being hex",
  PALETTES.flatMap((p) => Object.keys(p.tokens).filter((k) => !/^oklch\(/.test(p.tokens[k]))
    .map((k) => `${p.name}:${k}`)), []);
/* ⚠ THE AUTHORED-VERBATIM CLAIM. 47 of 50 tokens on a light palette are already OKLCH in
 * `globals.css`, and round-tripping them through sRGB would publish `oklch(56.02% 0.1399 41.97)`
 * for a declaration that reads `oklch(56% 0.14 42)` — same colour, and a copied block would no
 * longer diff clean against the stylesheet it came from. */
t("E4 ⚠ AN ALREADY-OKLCH DECLARATION IS PUBLISHED VERBATIM — not re-derived through bytes",
  PALETTES.flatMap((p) => Object.keys(p.tokens)
    .filter((k) => /^\s*oklch\(/i.test(String(p.layered[k] ?? "")))
    .filter((k) => p.tokens[k] !== String(p.layered[k]).trim())
    .map((k) => `${p.name}:${k}`)), []);
t("E4a …and that population is most of the palette, so E4 is not passing over a handful",
  PALETTES.every((p) => Object.keys(p.tokens)
    .filter((k) => /^\s*oklch\(/i.test(String(p.layered[k] ?? ""))).length >= 25), true);
/* ⚠ THE DEFECT THIS COMMIT EXISTS TO FIX, ASSERTED ON BOTH SIDES. `resolvedPalette` drops alpha by
 * design — `report` composites through `over()` and honouring an embedded alpha would double it —
 * so the copy block handed a stranger OPAQUE smoke where this site draws washes. */
const ALPHA_TOKENS = ["smoke-1", "smoke-2", "smoke-3", "smoke-4", "glow-paper"];
t("E5 ⚠ EVERY TRANSLUCENT TOKEN IS PUBLISHED WITH ITS ALPHA — the copied block drew these opaque until #515",
  PALETTES.flatMap((p) => ALPHA_TOKENS.filter((k) => k in p.tokens && alphaOf(p.tokens[k]) === null)
    .map((k) => `${p.name}:${k}`)), []);
t("E5a …and its fallback carries the alpha too, as eight digits — a six-digit fallback for a wash is a different colour",
  PALETTES.flatMap((p) => ALPHA_TOKENS.filter((k) => k in p.tokens && !/^#[0-9a-f]{8}$/i.test(p.fallback[k]))
    .map((k) => `${p.name}:${k}`)), []);
t("E5b …and the named list is a real population on every palette, so E5 cannot pass by naming tokens that do not exist",
  PALETTES.filter((p) => ALPHA_TOKENS.some((k) => !(k in p.tokens))).map((p) => p.name), []);
/* ⚠ AND THE OPAQUE TOKENS TAKE SIX, which is the complement E5a needs. A fallback map that emitted
 * eight digits for everything would satisfy E5a and be wrong about 45 tokens in every palette. */
t("E6 …and an OPAQUE token's fallback is six digits, so the alpha path is not applied to everything",
  PALETTES.flatMap((p) => Object.keys(p.tokens)
    .filter((k) => alphaOf(p.tokens[k]) === null && !/^#[0-9a-f]{6}$/i.test(p.fallback[k]))
    .map((k) => `${p.name}:${k}`)), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
