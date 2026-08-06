// The studio chrome draws from the FROZEN palette and nothing else, so a theme cannot repaint it.
// Run: node ralph/tests/studio-palette.mjs
//
// ---- WHY THIS SUITE EXISTS ---------------------------------------------------------------------
//
// The theme is about to land on `<html>`, which wraps /studio as well as the public site. That is
// the right host — `html { background-color }` paints the page ground, so a wrapper inside <body>
// leaves a mismatched band on every short page (measured: a 40px wrapper painted 40px of a 1060px
// viewport, and <html> painted the other 1020). The consequence is that the studio's immunity can
// no longer be a claim about intent. It has to be a property.
//
// PART B IS THE ONE THAT EARNS THE FILE, AND ITS SHAPE IS DELIBERATE. It asserts the shared palette
// DOES NOT APPEAR in studio source, rather than asserting that the frozen copies agree with it.
// Asserting a duplicate away beats asserting it consistent — #202's no-per-path-release API and
// three-pane's Part C are the same move. A consistency check passes happily while a second, unfrozen
// path exists beside it.
//
// ---- ⚠ PART A EXISTS BECAUSE THE FIRST CENSUS WAS WRONG BY A FACTOR OF 38 -----------------------
//
// A grep for shared-palette utilities under the studio directories returns 38 hits. ONE of them is
// code. The other 37 are inside COMMENTS — the records this repo keeps of hazard 23, of the ink-700
// deletion, of the ink-500 re-point, each of which necessarily QUOTES the utility it is about.
//
// ⚠ AN ASSERTION WHOSE INPUT IS CONTAMINATED BY THE THING IT IS MEANT TO PROVE. Third instance:
// the consumer count read the token's own declaration, then its own comment; the round-trip gate
// seeded the value it asserted. Here the census counted the documentation OF the defect as
// instances OF the defect. The fix is the same one every time — the input must come from somewhere
// the change cannot reach — and here that means comments must be gone before matching.
//
// ⚠ AND THE OBVIOUS STRIPPER IS NOT GOOD ENOUGH, WHICH IS WHY THE STATE MACHINE IS HERE. A regex
// that strips `//` to end-of-line has to stop somewhere to avoid eating a `//` inside a URL string.
// Stopping at quotes and backticks means a comment containing `` `bg-ink-950` `` survives — which
// is precisely how the second census reported that site as live. So the stripper tracks string and
// template state properly, and Part A validates it in BOTH directions before Part B trusts it.
import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

/** Blank out comments while preserving offsets, tracking string and template state so a `//`
 *  inside a quoted value is not a comment and a quote inside a comment does not open a string. */
function stripComments(s) {
  const out = [...s];
  let i = 0, quote = null;
  while (i < s.length) {
    const c = s[i], nx = s[i + 1] ?? "";
    if (quote === null) {
      if (c === "/" && nx === "/") { while (i < s.length && s[i] !== "\n") out[i++] = " "; continue; }
      if (c === "/" && nx === "*") {
        while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) out[i++] = " ";
        out[i] = " "; if (i + 1 < s.length) out[i + 1] = " ";
        i += 2; continue;
      }
      if (c === "\"" || c === "'" || c === "`") quote = c;
    } else {
      if (c === "\\") { i += 2; continue; }
      if (c === quote) quote = null;
    }
    i++;
  }
  return out.join("");
}

const STUDIO_DIRS = ["components/studio", "app/studio"];
const sources = [];
const walk = (rel) => {
  for (const e of readdirSync(new URL(`../../${rel}`, import.meta.url), { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child);
    else if (/\.tsx?$/.test(e.name)) sources.push({ rel: child, src: read(child) });
  }
};
STUDIO_DIRS.forEach(walk);

console.log("\nA · the stripper, validated in both directions before anything trusts it");

t("A1 there is studio source to scan at all — a zero here is not a pass", sources.length > 30, true);

/* ⚠ POSITIVE CONTROL. A stripper that ate code would make Part B pass by having nothing to look
 * at. The frozen palette is 800+ live utilities, so it is the loudest possible canary. */
const FROZEN_U = /\b(?:bg|text|border|from|to|via|fill|stroke|ring)-studio-[a-z0-9-]+/g;
const frozenRaw = sources.reduce((n, f) => n + (f.src.match(FROZEN_U) ?? []).length, 0);
const frozenLive = sources.reduce((n, f) => n + (stripComments(f.src).match(FROZEN_U) ?? []).length, 0);
t("A2 the stripper does not gut code — frozen utilities survive it", frozenLive > 800, true);
t("A3 and it removes something, so it is not a no-op", frozenRaw > frozenLive, true);

/* ⚠ NEGATIVE CONTROL, AND IT IS THE EXACT CASE THAT FOOLED THE NAIVE VERSION. A line comment
 * containing a backticked utility must be gone, and a real className on the same line must not. */
const probe = 'const a = "bg-ink-950"; // note about `bg-cream-100` and //urls\nconst b = `text-ink-600`;';
const stripped = stripComments(probe);
t("A4 a utility inside a line comment is removed", /bg-cream-100/.test(stripped), false);
t("A5 a utility inside a string on the same line survives", /bg-ink-950/.test(stripped), true);
t("A6 a utility inside a template literal survives", /text-ink-600/.test(stripped), true);
t("A7 offsets are preserved, so line numbers stay reportable", stripped.length, probe.length);

console.log("\nB · zero live references to the PUBLIC palette anywhere in studio source");

/* Both spellings that can reach a public colour: the Tailwind utility and a raw var(). */
const SHARED_U = /\b(?:bg|text|border|from|to|via|fill|stroke|ring|decoration|outline|placeholder|divide)-(?:cream-\d+|ink-\d+|accent-\d+|canvas|border|background|text-primary|text-secondary)(?:\/\d+)?\b/g;
const SHARED_VAR = /var\(--color-(?:cream|ink|accent|canvas|border|background|text-primary|text-secondary)[a-z0-9-]*\)/g;

const leaks = [];
for (const { rel, src } of sources) {
  const live = stripComments(src);
  for (const re of [SHARED_U, SHARED_VAR]) {
    for (const m of live.matchAll(re)) {
      leaks.push(`${rel}:${src.slice(0, m.index).split("\n").length} ${m[0]}`);
    }
  }
}
t("B1 ⚠ THE STUDIO CHROME REFERENCES NO PUBLIC COLOUR — a theme on <html> cannot repaint it", leaks, []);

/* The single site this suite was written around. Named so a regression says WHAT came back rather
 * than only that the count moved — the ground is the largest painted area in the product. */
const studioLayout = stripComments(read("app/studio/layout.tsx"));
t("B2 the studio ground is the frozen token", /bg-studio-ground/.test(studioLayout), true);

console.log("\nC · the VOCABULARY, which a coverage count cannot see");

/* ⚠ THE FREEZE WAS 99.9% BY COUNT AND STILL INCOMPLETE, because the one missing site needed a
 * shade the frozen palette DID NOT HAVE. A gate counting sites would have reported the same number
 * while missing that, so coverage and vocabulary are asserted separately. */
const css = read("app/globals.css");
const declared = new Set([...css.matchAll(/--color-studio-([a-z0-9-]+):/g)].map((m) => m[1]));
const USED = /\b(?:bg|text|border|from|to|via|fill|stroke|ring|decoration|outline|placeholder|divide)-studio-([a-z0-9-]+?)(?:\/\d+)?(?=[\s"'`\]}]|$)/g;
const used = new Set();
for (const { src } of sources) for (const m of stripComments(src).matchAll(USED)) used.add(m[1]);

t("C1 every shade the studio uses has a frozen declaration — hazard 23 inside the namespace",
  [...used].filter((u) => !declared.has(u)).sort(), []);
/* The other direction. This repo deletes unused tokens rather than keeping them for later — the
 * 2xl radius token and three weight tokens went exactly this way. */
t("C2 and no frozen token is declared without a consumer",
  [...declared].filter((d) => !used.has(d)).sort(), []);
t("C3 the frozen palette is fifteen shades", declared.size, 15);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
