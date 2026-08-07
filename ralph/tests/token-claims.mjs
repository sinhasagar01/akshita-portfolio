// A COMMENT NAMING A TOKEN IS A CLAIM, AND UNTIL NOW NOTHING CHECKED IT.
// Run: node --experimental-strip-types ralph/tests/token-claims.mjs
//
// ---- ⚠ THREE INSTANCES, ONE MECHANISM, AND NO INSTRUMENT ------------------------------------
//
// A colour literal sits in source with a comment naming the token it is supposed to be. Every gate
// in this repo reads VALUES. The claim lives in PROSE, which no gate reads — so the two drift and
// the comment goes on asserting equality that stopped being true.
//
//   `accent-400`   comments called it load-bearing for on-dark contrast while NOTHING referenced it
//   the cursor     `#B5613C`, a hand-typed near-copy of `accent-500` at distance 23.6
//   `lib/og.tsx`   `#C0673E // --color-accent-500`, distance 30.7, asserting equality outright
//
// ⚠ AND ALL THREE WERE FOUND BY MEASURING SOMETHING ELSE. None was found by looking for it, and a
// fourth would have been found the same way or not at all. That is the argument for an instrument
// rather than for more care.
//
// ⚠ AND THE FIRST RUN FOUND THAT `lib/og.tsx` HAD THREE, NOT ONE. `ink-950` was 26.7 away and
// `ink-600` 34.8 — both past the snap threshold, both beside a comment naming the token, and neither
// noticed while the accent was being investigated. The suspected defect was a third of the real one.
//
// ---- WHAT IT DOES NOT COVER, STATED --------------------------------------------------------
//
// It reads a literal whose SAME LINE carries a `--color-*` comment. A claim made in a paragraph
// above a block, or one naming a token in prose without a literal beside it, is invisible here —
// `accent-400`'s defect was of that second kind and this would NOT have caught it. What it catches
// is the tightest and commonest form, and saying so is what stops the count reading as complete.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { parseColor, parseOklch, colourPattern } from "../../lib/theme-contrast.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

/* ⚠ THE SNAP THRESHOLD THIS PROJECT SETTLED AT. #332 judged near-misses on the composite and the
 * rulings landed in single digits; #340's kept literals were 11 and up. 9 is the line those two
 * agree on, and it is stated here rather than tuned to make the current tree pass. */
const SNAP = 9;

const css = read("app/globals.css");
/** A token's value at `@theme` scope — the default palette, which is what a resolved hex encodes. */
function tokenValue(name) {
  const m = new RegExp(`--color-${name}\\s*:\\s*([^;]+);`).exec(css);
  return m ? m[1].trim() : null;
}
const rgbOf = (v) => (v.startsWith("oklch") ? parseOklch(v) : parseColor(v));

/* Every source file that could hold one. Studio files included — a false claim there is the same
 * defect, and the frozen palette makes it MORE likely rather than less. */
const files = [];
const walk = (rel) => {
  for (const e of readdirSync(url(rel), { withFileTypes: true })) {
    const child = `${rel}/${e.name}`;
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    if (e.isDirectory()) walk(child);
    else if (/\.(ts|tsx|css|mjs)$/.test(e.name)) files.push(child);
  }
};
for (const root of ["app", "lib", "components"]) walk(root);

console.log("\nA · every colour literal whose comment names a token IS that token");

const COMMENT_TOKEN = /(?:\/\/|\/\*)[^\n]*--color-([a-z0-9-]+)/;
const claims = [];
for (const rel of files) {
  const src = read(rel);
  for (const line of src.split("\n")) {
    const c = COMMENT_TOKEN.exec(line);
    if (!c) continue;
    /* The literal must be BEFORE the comment on the line — otherwise a comment mentioning a token
     * and a token reference in the code read as a claim about each other. */
    const code = line.slice(0, c.index);
    const lit = [...code.matchAll(colourPattern())].pop();
    if (!lit) continue;
    claims.push({ file: rel, token: c[1], literal: lit[0].trim() });
  }
}
console.log(`         ${claims.length} literal(s) sit beside a comment naming a token`);
t("A1 the population is real — a zero here means the matcher stopped seeing", claims.length > 0, true);

const unknown = claims.filter((c) => tokenValue(c.token) === null);
t("A2 every named token exists — a comment naming a deleted token is a claim about nothing",
  unknown.map((c) => `${c.file}: --color-${c.token}`).sort(), []);

const drifted = [];
for (const c of claims) {
  const tv = tokenValue(c.token);
  if (!tv) continue;
  const a = parseColor(c.literal), b = rgbOf(tv);
  if (!a || !b) continue;
  const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  if (dist > SNAP) drifted.push(`${c.file}: ${c.literal} claims --color-${c.token} but is ${dist.toFixed(1)} away`);
}
t(`A3 ⚠ AND NONE HAS DRIFTED PAST ${SNAP} — the threshold the snap rulings settled at`, drifted.sort(), []);

/* ⚠ THE DENOMINATOR IN ITS SECOND FORM. A1 catches a matcher that found nothing; this catches one
 * that found only trivia. Three of the four `lib/og.tsx` constants were the original subject, so a
 * run seeing fewer than that is seeing less than the defect that prompted it. */
t("A4 …and the matcher reaches the file the defect was found in",
  claims.filter((c) => c.file === "lib/og.tsx").length >= 4, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
