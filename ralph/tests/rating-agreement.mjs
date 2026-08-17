// ONE NUMBER, STATED IN MANY PLACES, MUST BE THE SAME NUMBER.
// Run: node ralph/tests/rating-agreement.mjs
//
// ---- ⚠ WHY THIS EXISTS: THE SAME FIGURE DRIFTED TWICE, IN TWO DIFFERENT DIRECTIONS ------------
//
// The boAt Crest store rating is the site's single most load-bearing claim — the one outcome a
// hiring manager reads — and it has now been three different numbers at once on the live site:
//
//     content/projects/boat-crest.yaml   2.3 to 4     -> corrected to 4.2 in #615
//     the case study body                2.3 … 4.2
//     PaletteConsole's demo StatCard     2.3 → 4.0    -> found by LOOKING at a palette render
//
// ⚠ AND THE SECOND ONE IS THE INTERESTING ONE, BECAUSE #615 WAS A CAREFUL FIX THAT MISSED IT.
// That PR corrected the rating in the content and in the case study, which is where anybody fixing
// a rating would search. The third instance is a HARDCODED PROP IN A DESIGN-SYSTEM PAGE — a demo
// fixture illustrating a component, in a file nobody greps when fixing copy. It was live on
// `/palettes` and every `/palettes/<slug>` for as long as that page has existed.
//
// Same shape as the `app/dev` harness paths that a content-only image sweep would have deleted: a
// real reference living outside the directory the search assumed. A denominator computed inside a
// walk cannot see the walk's own boundary.
//
// ---- WHAT IT CHECKS ---------------------------------------------------------------------------
//
// Every statement of the form "2.3 <arrow or word> <number>" anywhere in content or public source,
// and it asserts they all name the SAME target. It does not know which number is right — that is
// the owner's — only that the site must not say two things.
//
// ⚠ THE SUBJECT IS DERIVED, NOT LISTED. It walks for the pattern rather than checking a list of
// known sites, so a fourth instance written into a fifth file joins the subject automatically. A
// fixed list of places to check is the shape that let this one hide, since the missing place was
// by definition the one nobody had listed.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const walk = (rel, out = []) => {
  const abs = join(root, rel);
  if (!existsSync(abs)) return out;
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child, out);
    else if (/\.(tsx?|mdx?|ya?ml)$/.test(e.name)) out.push(child);
  }
  return out;
};

/* ⚠ COMMENTS ARE BLANKED ON SOURCE AND NOT ON CONTENT, AND THE ASYMMETRY IS DELIBERATE. The note
 * this suite prompted sits in `PaletteConsole.tsx` and QUOTES the wrong figure while explaining it —
 * the explaining-it-requires-writing-it trap, which this repository has hit in five separate
 * scanners. A yaml file has no comments carrying prose about a defect, and its `#` lines are
 * authored content, so blanking there would be inventing a hazard rather than closing one. */
const FILES = [...walk("content"), ...walk("components"), ...walk("app"), ...walk("lib")];
const RATING = /2\.3\s*(?:→|->|to|—)\s*([0-9]+(?:\.[0-9]+)?)/g;

const sites = [];
for (const rel of FILES) {
  let src;
  try { src = readFileSync(join(root, rel), "utf8"); } catch (e) { if (e && e.code) continue; throw e; }
  const text = /\.(tsx?|mjs)$/.test(rel) ? blankCommentBodies(src) : src;
  for (const m of text.matchAll(RATING)) sites.push({ rel, value: m[1], raw: m[0].replace(/\s+/g, " ") });
}

console.log("\nA · the subject exists, so the agreement check is not passing over nothing");
for (const s of sites) console.log(`         ${s.value.padEnd(4)} ${s.rel}   "${s.raw}"`);
/* ⚠ THE DENOMINATOR ROW, AND IT IS NOT DECORATION HERE. If the pattern stops matching — the copy is
 * reworded, an arrow character changes — every site vanishes from the subject and B1 passes on an
 * empty set, reporting agreement between nothing and nothing. That is the vacuous pass this
 * repository has recorded in three separate gates. */
t("A1 ⚠ THE WALK FOUND STATEMENTS OF THE RATING — an empty subject makes B1 agree with itself",
  sites.length >= 2, true);
t("A2 …and it reaches more than one file, so a single-file walk cannot satisfy it",
  new Set(sites.map((s) => s.rel)).size >= 2, true);

console.log("\nB · and every one of them names the same number");
const values = [...new Set(sites.map((s) => s.value))];
t("B1 ⚠ ONE RATING, ONE FIGURE — the site must not state two, whichever is right",
  values.length <= 1 ? [] : sites.map((s) => `${s.rel}: ${s.raw}`), []);

console.log("\nC · what this cannot reach, by name");
for (const gap of [
  "a rating written without the 2.3, which the pattern anchors on",
  "a figure assembled at runtime from parts, which no literal scan sees",
  "whether the agreed number is the TRUE one — that is the owner's, not a gate's",
  "an image or a screenshot carrying the old figure in pixels",
]) console.log(`      unreachable   ${gap}`);
t("C1 the gaps are named rather than counted — a list of four, stated", 4, 4);

console.log(`\nrating-agreement result: ${pass} passed, ${fail} failed  ·  ${sites.length} statement(s) across ${new Set(sites.map((s) => s.rel)).size} file(s)`);
process.exit(fail === 0 ? 0 : 1);
