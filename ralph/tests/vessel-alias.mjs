// The alias layer only works if every consumer goes through it — and nothing asserted that.
//
// ⚠ THE DEFECT TWICE. The wave fills read `--color-smoke-4` and `--color-vessel-wave` RAW while the
// ground block remapped only the `--vessel-*` aliases — a complete remap, defeated by one consumer
// walking past it, measured at +62.27 on nocturne against -1.68 on cream. And before that the hero
// tab's shadow was an inline JSX literal no selector could reach. Both were found OUTSIDE the sweep
// that should have caught them, which is why this suite's subject reaches JSX and not only CSS.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const tsx = readFileSync(new URL("../../components/blog/ReadingVessel.tsx", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/^\s*\/\/.*$/gm, "");

console.log("A · the covered set is DERIVED from the alias declarations, not listed");
/* ⚠ AN ALIAS COVERS A RAW TOKEN when a `--vessel-*` or `--smoke-*`/`--bounce` alias resolves to it
 * in light AND the ground block redeclares the alias. Both halves read from source, so a new alias
 * joins the subject the day it is written. */
const ground = (() => {
  const i = css.indexOf(':root[data-ground="dark"] {');
  let d = 0, j = i;
  for (; j < css.length; j++) { if (css[j] === "{") d++; else if (css[j] === "}" && --d === 0) break; }
  return css.slice(i, j);
})();
/* LIGHT-SIDE DECLARATIONS ONLY. The first version scanned the whole file and read the ground
 * block's REMAP TARGETS as alias sources, covering the on-dark ink and flagging the liquid's
 * always-light glow as a bypass on its own first run. The covered set is what the layer maps
 * FROM on light; what the ground block maps TO is the mechanism's other half, not a source. */
const lightCss = css.replace(ground, "");
const aliasDecl = new Map();
for (const m of lightCss.matchAll(/(--(?:vessel|smoke|bounce)[a-z0-9-]*)\s*:\s*var\((--color-[a-z0-9-]+)\)\s*;/g))
  aliasDecl.set(m[1], m[2]);
const remapped = new Set([...ground.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const covered = new Map();               // raw token -> the alias that covers it
for (const [alias, raw] of aliasDecl) if (remapped.has(alias)) covered.set(raw, alias);
t("A1 the derivation found a real covered set, against a literal", covered.size >= 8, true);
t("A2 …including the two tokens the waves bypassed, or the derivation has gone blind",
  [covered.has("--color-smoke-4"), covered.has("--color-vessel-wave")], [true, true]);

console.log("\nB · no vessel consumer reads a covered raw token — CSS and JSX both");
/* The vessel's class family is DERIVED from the component's own className strings. */
const family = new Set();
for (const m of tsx.matchAll(/className="([^"]+)"/g))
  for (const c of m[1].split(/\s+/)) if (c.startsWith("blog-")) family.add(c);
t("B0 the family is real and includes the paint layers, against literals",
  [family.size >= 10, family.has("blog-liquid"), family.has("blog-capsule")], [true, true, true]);
/* Every CSS block whose selector names a family class is subject; alias-declaration lines are the
 * one legitimate raw read and are exempted by shape, not by name. */
const offenders = [];
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (![...family].some((c) => m[1].includes("." + c))) continue;
  for (const line of m[2].split(";")) {
    if (/^\s*--(?:vessel|smoke|bounce)[a-z0-9-]*\s*:/.test(line)) continue;   // alias declaration
    for (const [raw, alias] of covered)
      if (line.includes(`var(${raw})`)) offenders.push(`${m[1].trim().slice(0, 40)} reads ${raw} (alias: ${alias})`);
  }
}
for (const [raw, alias] of covered)
  if (tsx.includes(`var(${raw})`)) offenders.push(`ReadingVessel.tsx reads ${raw} (alias: ${alias})`);
t("B1 ⚠ ZERO BYPASSES — a complete remap is defeated by one consumer reading the raw token", offenders, []);

console.log("\nC · the hero tab's shadow stays OUT of JSX — the other instance of this defect");
const hero = readFileSync(new URL("../../components/sections/HeroSection.tsx", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
t("C1 the pill's boxShadow reads the token, so a selector can give it a dark answer",
  /boxShadow: "var\(--hero-tab-shadow\)"/.test(hero), true);
t("C2 …and no inline shadow literal has returned — an inline style is unthemeable by construction",
  /boxShadow:\s*"[^"]*(oklch|color-mix)/.test(hero), false);

console.log(`\nvessel-alias result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
