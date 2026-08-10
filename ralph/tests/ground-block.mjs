// The dark ground block RESOLVES, not merely declares — the gate #457's shadowing demanded.
//
// ⚠ FIVE VALUES WERE DECLARED IN THIS BLOCK AND SHADOWED BY A LATER `:root` AT EQUAL SPECIFICITY.
// `--glass-shadow`, `--glass-shadow-hi`, `--vessel-edge`, `--vessel-lit-edge` and
// `--hero-tab-lit-edge` all lost on source order, were verified "by value" with a grep that proved
// PRESENCE, and shipped inert. Presence and resolution are different quantities and only one of
// them is the appearance.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

console.log("A · the ground block wins by SPECIFICITY, never by source order");
/* ⚠ 0-2-0 BY CONSTRUCTION. A bare `[data-ground="dark"]` ties every `:root` block at 0-1-0 and the
 * winner is whichever was written lower in the file — an order no one maintains. `:root[...]` beats
 * every plain `:root` wherever either sits, so the next inserted block cannot re-break it. */
t("A1 ⚠ THE BLOCK'S SELECTOR CARRIES :root — bare [data-ground] ties :root and loses on order",
  /\n:root\[data-ground="dark"\] \{/.test(css), true);
t("A2 …and no BARE ground block exists for a later edit to land dark values in",
  /\n\[data-ground="dark"\] \{/.test(css), false);

console.log("\nB · every shadowed-then-repaired pair still has both halves");
const ground = (() => {
  const i = css.indexOf(':root[data-ground="dark"] {');
  let d = 0, j = i;
  for (; j < css.length; j++) { if (css[j] === "{") d++; else if (css[j] === "}" && --d === 0) break; }
  return css.slice(i, j);
})();
const gProps = new Set([...ground.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
t("B0 the block was located and is non-trivial, against a literal", gProps.size > 25, true);
/* ⚠ THE FIVE THAT SHIPPED INERT, BY NAME. Each must be declared in the ground block AND somewhere
 * outside it — losing either half silently reverts a repair this arc paid for twice. */
const PAIRED = ["--glass-shadow", "--glass-shadow-hi", "--vessel-edge", "--vessel-lit-edge", "--hero-tab-lit-edge", "--hero-tab-drop", "--color-on-accent", "--wc-veil-ink", "--vessel-drop", "--capsule-drop"];
t("B1 ⚠ THE FORMERLY-INERT FIVE (PLUS THE DROP) ARE STILL DECLARED IN THE GROUND BLOCK",
  PAIRED.filter((p) => !gProps.has(p)), []);
t("B2 …and each still has a light-side declaration outside it, so neither half has been folded away",
  PAIRED.filter((p) => !css.replace(ground, "").includes(p + ":")), []);

console.log(`\nground-block result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
