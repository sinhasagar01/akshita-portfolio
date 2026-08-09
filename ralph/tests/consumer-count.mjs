// A DECLARED VALUE WITH NO CONSUMER — the recurring defect, given an instrument.
//
// ⚠ FIVE INSTANCES BEFORE THIS FILE EXISTED. `FIT_THRESHOLD_PX`, `CS_MIN_SCALE`, the four derived
// dark roles that nothing referenced, `--glass-shadow-dark` before it was wired, and the tone block
// that remapped fill, stroke, gradient and text while skipping the shadow. EVERY PART WAS CHECKED
// AND NOTHING CHECKED THE JOIN.
//
// ⚠ AND NO EXISTING GATE COULD SEE ANY OF THEM. A value that resolves correctly and is referenced by
// nothing produces no wrong value, no failing ratio and no missing declaration — and the whole
// instrument set here reads values and declarations. This reads EDGES.
import { readFileSync, readdirSync } from "node:fs";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = new URL("../../", import.meta.url).pathname;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (/^(node_modules|\.next|\.git|public)$/.test(e.name)) continue;
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) walk(p);
    /* ⚠ .ts AND .tsx AS WELL AS .css — the file-type boundary has cost three findings here, and a
     * gate about EDGES is exactly where a walk that sees only stylesheets would miss the markup. */
    else if (/\.(css|ts|tsx)$/.test(e.name)) files.push(p);
  }
})(root.replace(/\/$/, ""));
const rel = (p) => p.slice(root.length);
const isStudio = (p) => /^(components\/studio|app\/studio)\//.test(rel(p));
/* ⚠ REFERENCES ARE COLLECTED FROM EVERYWHERE, INCLUDING /studio. The freeze protects VALUES, not
 * NAMES — a studio file reading a token declared in globals.css is a real consumer, and excluding
 * it made every --studio-* token look orphaned. Its first run said so. */
const blob = files.map((p) => strip(readFileSync(p, "utf8"))).join("\n");

/* ⚠ THE SUBJECT IS DERIVED, NOT ENUMERATED. An enumerated subject is correct the day it is written
 * and decays from then on; this one cannot fall behind its own population. */
const declared = new Map();
for (const p of files) {
  if (isStudio(p) || !p.endsWith(".css")) continue;
  /* ⚠ @theme DECLARATIONS ARE EXCLUDED, AND THAT IS THE CONCEPT RATHER THAN A CONVENIENCE. Tailwind
   * v4 GENERATES A UTILITY from each one, so `--spacing-4` and `--text-xl` are consumed by class
   * names and never by var(). This gate's concept is "an authored value nothing reads"; a token
   * whose consumption route is utility generation is a different question and role-layer's ratchet
   * already owns the colour half of it. Its first run reported 90 of these as orphans. */
  const src = strip(readFileSync(p, "utf8")).replace(/@theme[^{]*\{[\s\S]*?\n\}/g, "");
  for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.set(m[1], rel(p));
}
/* ⚠ TWO CONSUMPTION ROUTES, AND THE SECOND NEARLY COST A LIVE TOKEN. `var()` is the CSS route;
 * `getPropertyValue("--x")` is the JS route, and `--studio-t0` is read that way by
 * SectionsEditPanel's reveal. A gate whose concept is "nothing reads it" and whose vocabulary is
 * `var()` alone reports a read token as dead — and this one was about to be DELETED on that
 * reading. Fourth subject error in this file before it ever ran green, and the only one with a
 * destructive edit waiting on it. */
const referenced = new Set([
  ...[...blob.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]),
  ...[...blob.matchAll(/["'`](--[a-z0-9-]+)["'`]/gi)].map((m) => m[1]),
]);

/* ⚠ EXEMPT ONLY WITH AN END CONDITION. "Not consumed yet" is a backlog wearing an exemption's
 * clothes — the shape section L already refuses for ground-invariant tokens. */
const ALLOW = {};
const orphans = [...declared.keys()]
  .filter((k) => !referenced.has(k) && !(k in ALLOW))
  /* Tailwind v4 @theme generates utilities from --color-*, so a colour token has a consumer route
     that is not a var(). Colour orphans belong to role-layer's ratchet, not here. */
  .filter((k) => !k.startsWith("--color-"))
  .sort();

console.log(`         ${declared.size} custom properties declared publicly, ${referenced.size} referenced through var()`);
console.log(`         ${orphans.length} declared with no consumer`);

console.log("\nA · the subject is real — a zero denominator is not a pass");
t("A1 the walk found stylesheets and markup, against a literal", files.length > 200, true);
t("A2 …and a real population of declarations, so A3 cannot pass by matching nothing", declared.size > 40, true);
t("A3 …and a real population of references", referenced.size > 80, true);
/* ⚠ THE SECOND ROUTE ASSERTED SEPARATELY, or a regression to var()-only would pass A3 unchanged. */
t("A3a ⚠ AND THE JS ROUTE IS COLLECTED — a token read through getPropertyValue is read, and one was nearly deleted for not being",
  referenced.has("--studio-t0"), true);
/* ⚠ THE COMPLEMENT. A1..A3 prove the walk ran; this proves it reached BOTH file kinds, which is the
 * boundary that hid a JSX inline style from a .css-bounded census one unit ago. */
t("A4 ⚠ AND IT REACHED MARKUP AS WELL AS STYLESHEETS — the file-type boundary, asserted rather than assumed",
  [files.some((p) => p.endsWith(".css")), files.some((p) => p.endsWith(".tsx"))], [true, true]);

console.log("\nB · every declared value has a consumer");
t("B1 ⚠ NO PUBLIC CUSTOM PROPERTY IS DECLARED AND NEVER READ — a derived value nothing references is the defect this file exists for",
  orphans, []);
t("B2 …and every exemption states when it ends, so 'not consumed yet' cannot hide here",
  Object.entries(ALLOW).filter(([, why]) => !/\bends\b/i.test(why)).map(([k]) => k), []);
t("B3 …and no exemption outlives its subject — an entry for an undeclared property is stale",
  Object.keys(ALLOW).filter((k) => !declared.has(k)), []);

console.log(`\nconsumer-count result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
