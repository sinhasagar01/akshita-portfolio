// THE BLOG DIAGRAMS FOLLOW THE PALETTE, AND A THIRD ONE CANNOT ARRIVE UNTHEMED.
// Run: node --experimental-strip-types ralph/tests/blog-diagrams.mjs
//
// ---- ⚠ THE SAME GATE `case-study-illustrations` IS, FOR THE OTHER COLLECTION -----------------
//
// Two blog rasters were drawn in cream's own ground — 81.3% and 50.3% of their pixels within 12 of
// `cream-50` on the hue-aware predicate. `raster-grounds` is what finds that class; this is what
// keeps the replacement honest.
//
// ⚠ AND THE REPLACEMENT IS JSX RATHER THAN INLINE SVG, WHICH IS THE OPPOSITE CHOICE FROM #365. The
// eight Fosfor illustrations were pure geometry, so SVG paths reproduced them exactly. These two are
// TEXT — eleven box labels, a legend, captions — and SVG `<text>` does not reflow, so a caption
// would break at a fixed point regardless of container width. Real text in real boxes reflows,
// scales with the reader's font size, and is searchable.
//
// ---- WHAT THIS CANNOT SEE, STATED -----------------------------------------------------------
//
// It reads source and content. Whether the diagrams LOOK right is a render question, and the render
// is what found the two defects this file cannot: squad two's accent bar sitting 10px below the
// other three (which broke the diagram's only claim), and an 11px label at 3.33 contrast. Both were
// measured in a browser, and neither is expressible here.
import { readFileSync, readdirSync } from "node:fs";
import { colourPattern } from "../../lib/theme-contrast.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

const SRC = "components/blog/diagrams/index.tsx";
const src = read(SRC);

console.log("\nA · themeable by construction");

const registered = [...src.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\w+,$/gm)].map((m) => m[1]);
console.log(`         ${registered.length} diagrams registered`);
t("A1 the registry is a real population — a zero means the parser stopped seeing", registered.length >= 2, true);

/* ⚠ NO COLOUR LITERAL. This is the assertion the whole redraw buys, and unlike a webp it is
 * visible to a gate. `colourPattern()` is the shared matcher, so this cannot disagree with the
 * census about what a colour is. */
const body = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\w"'`])\/\/.*$/gm, "$1");
t("A2 ⚠ NO COLOUR LITERAL — every colour is a token utility, so all of it themes",
  [...body.matchAll(colourPattern())].map((m) => m[0]).sort(), []);

/* The public hairline is `/8`; `/12` is studio chrome. A diagram rendered in the article AND in the
 * canvas must use the public one — the split `studio-ink` E3 exists to keep.
 *
 * ⚠ BORDERS ONLY, AND THE FIRST VERSION OF THIS ROW WAS WRONG ABOUT THAT. It matched any
 * `ink-950/12` and failed on the legend's "everything else moved" SWATCH, which is a fill at that
 * opacity and has nothing to do with hairlines. The /8-versus-/12 rule is about the line between
 * two surfaces; a swatch is a surface. Narrowing it here rather than repainting the swatch, because
 * the swatch was right and the assertion was not. */
t("A3 HAIRLINES are the public /8, never the studio /12 — these render in the article and the canvas",
  [...body.matchAll(/border-[a-z-]*ink-950\/12/g)].map((m) => m[0]), []);

t("A4 …and they actually paint — a component drawing nothing would satisfy A2 trivially",
  (body.match(/className=/g) ?? []).length > 20, true);

console.log("\nB · content and the registry agree");

const posts = readdirSync(url("content/blog")).filter((f) => f.endsWith(".yaml"));
const used = [];
for (const f of posts) {
  for (const m of read(`content/blog/${f}`).matchAll(/^\s*diagram:\s*(\S+)\s*$/gm)) used.push({ post: f, id: m[1] });
}
console.log(`         ${used.length} blocks name a diagram, across ${posts.length} posts`);
t("B1 the content population is non-empty", used.length >= 2, true);
t("B2 ⚠ EVERY ID IN CONTENT RESOLVES — an unknown one silently draws the raster, so nothing else says so",
  used.filter((u) => !registered.includes(u.id)).map((u) => `${u.post}: ${u.id}`).sort(), []);
t("B3 ⚠ AND EVERY REGISTERED DIAGRAM IS USED — a dead one is code nobody can see to review",
  registered.filter((r) => !used.some((u) => u.id === r)).sort(), []);

console.log("\nC · the field is additive, proven rather than asserted");

const fmt = read("lib/studio/blog-format-core.ts");
t("C1 `diagram` is omit-when-empty, so a block that never sets one writes no key",
  /omitEmpty:\s*\["diagram"\]/.test(fmt), true);

/* The posts that set no diagram. If the key had leaked into them, it would be here. */
const untouched = posts.filter((f) => !/^\s*diagram:/m.test(read(`content/blog/${f}`)));
console.log(`         ${untouched.length} posts set no diagram and are checked for leakage`);
t("C2 there are untouched posts to check — an empty set would make C3 vacuous", untouched.length >= 1, true);
t("C3 ⚠ AND NONE OF THEM GAINED THE KEY — additive by construction, not by intention",
  untouched.filter((f) => /diagram/.test(read(`content/blog/${f}`))).sort(), []);

/* The raster stays in `src` as the fallback for an id that stops resolving, so it must still be on
 * disk — and `raster-grounds` declares those two as fallback-only for exactly this reason. */
const missing = [];
for (const f of posts) {
  const text = read(`content/blog/${f}`);
  if (!/^\s*diagram:/m.test(text)) continue;
  for (const m of text.matchAll(/src:\s*>?-?\s*\n?\s*(\/images\/blog\/\S+)/g)) {
    try { readFileSync(url(`public${m[1]}`)); } catch { missing.push(m[1]); }
  }
}
t("C4 the fallback rasters are still on disk — the silent branch has something to fall back TO",
  [...new Set(missing)].sort(), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
