// EVERY COLOUR UTILITY IN /studio MUST RESOLVE TO A DECLARED @theme TOKEN.
// Run: node ralph/tests/studio-tokens.mjs
//
// ---- THE MECHANISM -------------------------------------------------------------------
//
// Tailwind v4 generates a bare theme utility ONLY when the token behind it exists in @theme.
// `text-ink-500` looks exactly like `text-ink-600`, survives review, survives grep, and
// type-checks — and because `--color-ink-500` was never declared, **it emits no CSS at all**.
// The element renders whatever it inherits, silently.
//
// ---- WHY THIS IS GENERAL RATHER THAN A CHECK FOR TWO NAMES ---------------------------
//
// The obvious gate is "no `text-ink-500` and no `text-ink-700`". That closes the two instances
// we found and nothing else — the NEXT invented step, `text-ink-300` or `bg-cream-400`, walks
// in exactly the same way and is found the same way: by someone eventually measuring.
//
// This derives the legal set from `@theme` and checks every colour utility in studio against
// it, so **a token that does not exist fails on arrival rather than after 51 uses**. That is
// the same move as `studio-cascade` (derive the unlayered rules, do not encode the four known
// collisions) and the same lesson a third time: generalising the assertion beat closing the
// instance.
//
// ---- WHAT IT FOUND WHEN FIRST RUN, AND HOW BOTH HALVES CLOSED -------------------------
//
// `text-ink-500` x40 and `text-ink-700` x11 — 51 sites across 20 files, every one rendering
// ink-950 while its code claimed otherwise. The 11 `text-ink-700` sites were deleted (they
// read correctly at full ink). The 40 `text-ink-500` sites were REAL DEFECTS the dead class
// was hiding — a class that meant "muted" painting at full ink beside the text it should have
// sat behind. They are now closed the other way: each was re-pointed to the token its own
// working neighbour already used — icon buttons to `text-ink-400` (the ListDetailLayout idiom),
// inactive tabs to `text-ink-600` (SegmentedToggle), badges, status hints and readonly fields
// to `text-text-subtle`. So the hazard closed by realising the muted intent these sites always
// carried rather than by deleting the muting, and B2 below now holds the family at zero.
import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
/** Comment bodies blanked, so prose naming an old token is not read as a declaration. */
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/.*$/gm, "$1");

/* ================================================ A. THE LEGAL SET, FROM @theme
 * Parsed, never listed. Adding `--color-ink-500` to @theme makes `text-ink-500` legal here on
 * the next run without touching this file — which is correct: the defect is a utility with no
 * token, not a particular name. */
const DECLARED = new Set();
for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:/g)) DECLARED.add(m[1]);

t("A1: the ink scale parsed out of @theme is the five steps the design actually declares — 500 and 700 are values it deliberately does not have",
  ["950", "800", "600", "400", "200"].map((s) => DECLARED.has(`ink-${s}`)), [true, true, true, true, true]);
t("A2: `ink-500` is NOT declared — if this ever passes, the owner added the token and the exemptions below should be revisited",
  DECLARED.has("ink-500"), false);
t("A3: `ink-700` is NOT declared either",
  DECLARED.has("ink-700"), false);

/* ================================================ B. EVERY COLOUR UTILITY IN STUDIO */

const files = [];
const walk = (base, rel) => {
  for (const e of readdirSync(new URL(rel, base), { withFileTypes: true })) {
    if (e.isDirectory()) walk(base, `${rel}${e.name}/`);
    else if (e.name.endsWith(".tsx")) files.push({ rel: `${rel}${e.name}`, base });
  }
};
walk(new URL("../../components/studio/", import.meta.url), "");
const studioFiles = files.map((f) => ({ rel: `components/studio/${f.rel}`, url: new URL(f.rel, f.base) }));
const appFiles = [];
const walkApp = (rel) => {
  for (const e of readdirSync(new URL(rel, new URL("../../app/studio/", import.meta.url)), { withFileTypes: true })) {
    if (e.isDirectory()) walkApp(`${rel}${e.name}/`);
    else if (e.name.endsWith(".tsx")) appFiles.push(`${rel}${e.name}`);
  }
};
walkApp("");
const ALL = [
  ...studioFiles,
  ...appFiles.map((r) => ({ rel: `app/studio/${r}`, url: new URL(r, new URL("../../app/studio/", import.meta.url)) })),
];

/** The colour-carrying utility prefixes. A suffix like `/8` or `/12` is an opacity modifier and
 *  is stripped before lookup — `border-ink-950/12` is `ink-950` at 12%. */
const PREFIX = /\b(?:text|bg|border|border-[trblxy]|ring|fill|stroke|decoration|outline|from|via|to|divide|shadow|accent|caret|placeholder)-([a-z]+-\d{2,3})(?:\/\d+)?\b/g;

/** Names that are NOT theme colours and must not be looked up as such. */
const NOT_A_COLOUR = /^(?:radius|text|leading|tracking|spacing|z|opacity)-/;

const offenders = [];
for (const f of ALL) {
  const src = readFileSync(f.url, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")   // block comments — a token named in prose is not a use
    .replace(/^\s*\/\/.*$/gm, "");      // line comments, same reason
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(PREFIX)) {
      const token = m[1];
      if (NOT_A_COLOUR.test(token)) continue;
      if (DECLARED.has(token)) continue;
      offenders.push({ where: `${f.rel}:${i + 1}`, utility: m[0], token });
    }
  });
}

/**
 * `text-ink-500` IS THE CLOSED FAMILY, HELD AT ZERO — no longer an exemption for live defects.
 *
 * It was 40 real defects: a class that meant "muted" rendering at full ink-950 beside the
 * primary text it was supposed to sit behind. Rather than delete the muting (which would make
 * the code honest and leave every element looking exactly as wrong), each site was re-pointed to
 * the muted token its own working neighbour already used, so the muted intent finally reached
 * the screen. B2 now asserts the family is EMPTY, and it fails the day any `text-ink-500`
 * returns — the same phantom walking back in under the same name.
 *
 * KEYED ON THE TOKEN, NOT A SITE COUNT, DELIBERATELY. The split is kept so B2 is a dedicated
 * tripwire for this exact token: B1 guards every OTHER undeclared token, B2 guards that ink-500
 * stays gone. A2 above still fails the day someone "resurrects" it by declaring the token.
 */
const CLOSED_TOKEN = "ink-500";
const exempt = offenders.filter((o) => o.token === CLOSED_TOKEN);
const real = offenders.filter((o) => o.token !== CLOSED_TOKEN);

/* ================================================ C. REPORT
 * NAMES THE TOKEN AND THE SITE, NEVER A COUNT. "3 undeclared utilities" sends the next person
 * back to re-derive the whole thing; the token plus the file and line is directly actionable,
 * and the message says WHY the class does nothing rather than only that it is wrong. */
if (real.length) {
  console.log("\n  UNDECLARED COLOUR TOKENS — these utilities generate NO CSS:\n");
  for (const o of real) {
    console.log(`    ${o.where}`);
    console.log(`      \`${o.utility}\` reads the token \`--color-${o.token}\`, which is NOT declared`);
    console.log(`      in @theme. Tailwind emits nothing for it, so the element renders whatever`);
    console.log(`      it inherits and the intent never reaches the screen.`);
    console.log(`      Fix: use a declared step, or declare the token if the scale really needs it.\n`);
  }
}
t(`B1: every colour utility in /studio resolves to a declared @theme token${real.length ? " — see above" : ""}`,
  real.map((o) => `${o.where} ${o.utility} (--color-${o.token} undeclared)`), []);

// B2 · the closed family stays empty. It was 40 sites all rendering ink-950 while claiming to be
// muted; each was re-pointed to the muted token its working neighbour already used, so the count
// is now ZERO and this guard fails the day any `text-ink-500` returns — the phantom walking back
// in under the same name.
t("B2: the `text-ink-500` family is CLOSED and empty — the 40 dead sites were re-pointed to the muted token each neighbour already used (ink-400 / ink-600 / text-subtle), realising the intent rather than deleting it. Any non-zero here is the phantom returning",
  exempt.length, 0);

// B3 · the deleted half stays deleted. `text-ink-700` was the other phantom and its 11 sites
// read correctly at full ink, so they were removed rather than deferred.
t("B3: `text-ink-700` has no remaining sites — the 11 that carried it read correctly at inherited ink and were deleted, not replaced",
  offenders.filter((o) => o.token === "ink-700").length, 0);

/* ================================================ C. THE STUDIO HAS ITS OWN PALETTE
 *
 * ⚠ IT DID NOT, AND THAT MADE ONE STATED SCOPE IMPOSSIBLE. The studio drew 895 of its colours
 * from the PUBLIC scales — ink, cream, accent, danger, success and the subtle text alias — while
 * declaring radius, motion and elevation of its own, so it LOOKED self-contained from either side.
 * A runtime theme repointing `--color-ink-950` would have repainted every panel, rail and band in
 * the editor. "The studio keeps its design" was not achievable while that was true.
 *
 * ⚠ FROZEN COPIES, NOT `var()` ALIASES. An alias tracks the public token and defeats the purpose
 * one indirection later. C1 asserts the copies still MATCH today's public values, which is what
 * turns "frozen at today's values" into a checkable claim — and the day a theme moves a public
 * token, C1 is the row that has to be deliberately updated rather than quietly drifting.
 *
 * ⚠ AND THE CANVAS IS DELIBERATELY EXEMPT. It renders PUBLIC components at the public measure, so
 * it takes the public tokens and shows the ACTIVE theme. That is the parity contract — what the
 * author sees is what the article ships — and it means the studio is PARTLY THEMED. The scope
 * narrows rather than gaining an exception: the studio's CHROME keeps its design, and the canvas
 * is public content drawn inside it, as it always was. C3 pins that the canvas components are NOT
 * swept onto studio tokens, so a later tidy cannot quietly break parity.
 */
{
  const value = (n) => {
    const m = new RegExp(`--color-${n.replace(/-/g, "\\-")}:\\s*([^;]+);`).exec(code(css));
    return m ? m[1].trim() : null;
  };
  const PAIRS = ["cream-50", "cream-100", "cream-200", "cream-300", "ink-950", "ink-800",
    "ink-600", "ink-400", "ink-200", "accent-500", "accent-600", "danger-600",
    "success-700", "text-subtle"];
  t("C1: the studio palette was found at all — a zero denominator is not a pass",
    PAIRS.filter((n) => value(`studio-${n}`) !== null).length, PAIRS.length);
  t("C1: every frozen studio colour still equals its public counterpart — this is the row a theme change must deliberately break",
    PAIRS.filter((n) => value(n) !== value(`studio-${n}`)), []);

  /* C2 · NO LIVE PUBLIC COLOUR UTILITY SURVIVES UNDER /studio. Asserted as an ABSENCE over the
   * derived file set, so a NEW component reaching for the public scale fails on arrival — which
   * is the only thing that keeps the separation true after today. */
  const PUB = /\b(?:bg|text|border|border-[trblxy]{1,2}|ring|fill|stroke|from|via|to|outline|decoration|caret|divide|placeholder)-((?:cream|ink|accent|danger|success)-[0-9]+|text-subtle)\b/g;
  const strays = [];
  for (const f of ALL) {
    for (const m of code(readFileSync(f.url, "utf8")).matchAll(PUB)) {
      strays.push(`${f.rel} ${m[0]}`);
    }
  }
  t("C2: no studio file reaches for a PUBLIC colour token — the chrome is on its own palette",
    strays.slice(0, 8), []);

  /* C3 · AND THE CANVAS IS STILL ON THE PUBLIC ONES, which is the other half and the easier one
   * to lose. These are the public modules the studio renders; if a sweep ever put them on studio
   * tokens the canvas would stop showing the theme and the parity contract would be broken with
   * every class string still looking right. */
  const CANVAS_MODULES = [
    "components/blog/BlogProse.tsx",
    "components/case-study/SectionRenderer.tsx",
    "components/sections/ProjectCard.tsx",
  ];
  const onStudioTokens = CANVAS_MODULES.filter((m) =>
    /-studio-(?:cream|ink|accent|danger|success|text)-/.test(
      code(readFileSync(new URL(`../../${m}`, import.meta.url), "utf8"))));
  t("C3: the public components the canvas renders are NOT on studio tokens — the canvas shows the active theme",
    onStudioTokens, []);
}

console.log(`\nstudio-tokens result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
