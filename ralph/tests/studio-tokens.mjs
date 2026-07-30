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

console.log(`\nstudio-tokens result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
