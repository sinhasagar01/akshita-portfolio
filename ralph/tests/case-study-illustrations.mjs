// THE INLINE ILLUSTRATIONS FOLLOW THE PALETTE, AND A NINTH ONE CANNOT ARRIVE UNTHEMED.
// Run: node --experimental-strip-types ralph/tests/case-study-illustrations.mjs
//
// ---- ⚠ WHY THIS EXISTS, AND IT IS THE PROPERTY THAT MADE THE REBUILD WORTH DOING -------------
//
// Eight `challenge-*` / `metric-*` rasters carried the site's own accent baked into pixels. That is
// the FIFTH SHAPE #331 named — unreachable by static analysis, unmovable by any theme — and
// `colour-census` structurally CANNOT see one, because it reads built CSS, SVG attributes and
// runtime JS, and a webp is none of those.
//
// ⚠ SO THIS WAS NEVER A CENSUS FAILURE. The eight were outside every population BY CONSTRUCTION,
// and the owner found them by looking at the page. Four instruments could not have.
//
// The other three options all left them outside forever: boundary-listing them makes a row no gate
// can verify, re-exporting per theme is an obligation on a PERSON that nothing checks, and
// desaturating gives up the accent where the accent is the content. Rebuilding as INLINE SVG is the
// only one that moves them INTO a population — which is what this file then holds.
//
// ---- ⚠ AND "REBUILD AS SVG" HAD TWO READINGS, ONLY ONE OF WHICH THEMES --------------------------
//
// An SVG behind `<img src>` is a separate document and cannot read the page's custom properties —
// verified by rasterisation, not assumed: a rect filled `var(--color-accent-500, magenta)` came back
// MAGENTA through an `<img>` and came back the live accent inlined. Eight `.svg` FILES would have
// been the identical defect in a different format, shipped as its own fix. `A3` is what keeps the
// components inline-only.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { colourPattern } from "../../lib/theme-contrast.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

const SRC = "components/case-study/illustrations/index.tsx";
const src = read(SRC);

console.log("\nA · the components are themeable by construction");

/* The registry, parsed from the source rather than imported — this suite must not need a React
 * runtime to answer a question about text. */
const registered = [...src.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\w+,$/gm)].map((m) => m[1]);
console.log(`         ${registered.length} illustrations registered`);
t("A1 the registry is a real population — a zero here means the parser stopped seeing",
  registered.length >= 8, true);

/* ⚠ EVERY COLOUR IS A TOKEN REFERENCE. This is the assertion the whole rebuild buys: a literal here
 * is a colour that stops following the palette, and unlike a webp it is now VISIBLE to a gate.
 * `colourPattern()` is the shared matcher, so this cannot disagree with the census about what a
 * colour is — the defect #344 was built to end. */
const body = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\w"'`])\/\/.*$/gm, "$1");
const literals = [...body.matchAll(colourPattern())].map((m) => m[0]);
t("A2 ⚠ NO COLOUR LITERAL — every paint is a var() or a color-mix over one, so all of it themes",
  literals.sort(), []);

/* A `<svg>` in JSX is inline in the document. A file reference is not, and the difference is
 * whether the page's custom properties are visible at all. */
t("A3 ⚠ AND THEY ARE INLINE JSX, NOT FILE REFERENCES — an <img src> svg cannot read page tokens",
  /<img|\.svg"|\.svg'/.test(body), false);

t("A4 …and they actually paint — a component drawing nothing would pass A2 trivially",
  (body.match(/\bfill=|\bstroke=/g) ?? []).length > 40, true);

console.log("\nB · content and the registry agree");

const YAML = "content/projects/fosfor-data-profiling.yaml";
const used = [...read(YAML).matchAll(/^\s*illustration:\s*(\S+)\s*$/gm)].map((m) => m[1]);
console.log(`         ${used.length} figures name an illustration`);
t("B1 the content population is non-empty", used.length >= 8, true);

t("B2 ⚠ EVERY ID IN CONTENT RESOLVES — an unknown id renders the raster silently, so nothing else says so",
  used.filter((u) => !registered.includes(u)).sort(), []);

t("B3 ⚠ AND EVERY REGISTERED COMPONENT IS USED — a dead one is code nobody can see to review",
  registered.filter((r) => !used.includes(r)).sort(), []);

/* The raster stays in `image.src` as the fallback for an id that stops resolving, so it has to
 * still be on disk. A missing file turns a silent fallback into a broken figure. */
const missing = [];
for (const m of read(YAML).matchAll(/\/images\/projects\/fosfor-data-profiling\/([a-z0-9-]+\.webp)/g)) {
  if (!existsSync(url(`public/images/projects/fosfor-data-profiling/${m[1]}`))) missing.push(m[1]);
}
t("B4 the fallback rasters are still on disk — the silent branch has something to fall back TO",
  [...new Set(missing)].sort(), []);

console.log("\nC · the field is additive, proven rather than asserted");

/* ⚠ A NEW KEY IN A SHAPE REJECTS EVERY FILE THAT LACKS IT. `omitEmpty` is the one way to add one
 * without rewriting content, and adding a key naively once failed 147 assertions. This asserts the
 * new field is on that list rather than trusting that it is — the four studies below are the
 * evidence, and this is the mechanism that makes them evidence. */
const fmt = read("lib/studio/sections-format.ts");
t("C1 `illustration` is omit-when-empty, so a figure that never sets one writes no key",
  /omitEmpty:\s*\["illustration"\]/.test(fmt), true);

/* The four studies that never set the field. If the key leaked into them, it would be here. */
const others = readdirSync(url("content/projects"))
  .filter((f) => f.endsWith(".yaml") && f !== "fosfor-data-profiling.yaml");
console.log(`         ${others.length} other case studies checked for leakage`);
t("C2 there are other studies to check — an empty set would make C3 vacuous", others.length >= 3, true);
t("C3 ⚠ AND NONE OF THEM GAINED THE KEY — additive by construction, not by intention",
  others.filter((f) => /(^|\s)illustration:/m.test(read(`content/projects/${f}`))).sort(), []);

console.log("\nD · what this suite does NOT cover, stated rather than implied");
/* ⚠ FIDELITY IS NOT ASSERTED HERE AND CANNOT BE. Whether each drawing still LOOKS like its raster is
 * a rasterisation question needing a browser, and it was measured by hand at build time — shape
 * mismatch 0.96% to 6.78%, every one edge-distributed rather than banded, with the diff map's SHAPE
 * checked and not only its percentage. A 4.35% of edge outline and a 4.35% in two bands are the same
 * number and different outcomes, and the trial's one real defect was found exactly that way.
 *
 * THE OWNER OF THAT CLAIM IS `/dev/parity/<slug>` PLUS A RE-RUN OF THAT HAND MEASUREMENT, not this
 * file. Naming it because a deferral without a named owner is a deferral to nobody. */
console.log("         fidelity vs the rasters is NOT asserted here — it needs a browser;");
console.log("         owner is a hand re-run of the shape diff, recorded in docs/STATE.md");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
