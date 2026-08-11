// The arrival strip — every page, route to all nine, and NO exit.
// Run: node --experimental-strip-types ralph/tests/palette-arrival.mjs
//
// ---- ⚠ THE ROWS ASSERT THE SHAPE, NOT THE PRESENCE, AND THAT IS THE WHOLE DESIGN OF THIS SUITE --
//
// "The arrival strip renders" passes with BOTH strips on screen at once, which is the failure worth
// preventing: a visitor previewing nocturne while also being told the published theme is not in the
// four sees two contradictory statements and an exit that appears to belong to either. A presence
// row cannot see that. So the rows here are about the BRANCH — that reaching the arrival strip
// requires the preview to be absent — and about the ABSENCE of an exit in it.
import { arrivalNote, publishedIsOffered, TEASER_THEMES } from "../../lib/palettes/teaser.ts";
import { THEME_NAMES, VERIFY_THEME } from "../../lib/theme.ts";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const src = read("components/palettes/PreviewIndicator.tsx");
const layout = read("app/(portfolio)/layout.tsx");
/* Comments stripped before any structural match — this file's own prose names the things it checks
   for, which is the trap that has fired on three suites in this arc. */
const code = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");

console.log("\nA · the subject is real");
t("A0 the indicator has code after comments are stripped", code.trim().length > 600, true);
t("A1 ⚠ IT IS MOUNTED IN THE PORTFOLIO LAYOUT — every public page, which is the point of the unit",
  /<PreviewIndicator\s+publishedTheme=/.test(layout), true);
t("A1a …and the layout passes the PUBLISHED value, not a default — a default would make the note always null",
  /publishedTheme=\{settings\?\.theme/.test(layout), true);

console.log("\nB · the exclusive shape — the two strips can never both render");
/* ⚠ ONE COMPONENT, ONE RETURN PATH. Two components could both render and nothing would notice; a
 * single branch cannot. The ordering IS the exclusivity: reaching the arrival strip requires
 * `previewing` to be null, so these rows read the ORDER rather than the existence of each strip. */
const arrivalIdx = code.indexOf("data-arrival-strip");
const previewIdx = code.indexOf("data-preview-strip");
const guardIdx = code.indexOf("if (!previewing)");
t("B0 both strips exist in the source — a missing one would make the ordering rows vacuous",
  arrivalIdx > 0 && previewIdx > 0, true);
t("B1 ⚠ THE ARRIVAL STRIP IS INSIDE THE `!previewing` BRANCH — so a live preview can never reach it",
  guardIdx > 0 && guardIdx < arrivalIdx, true);
t("B2 ⚠ AND THE PREVIEW STRIP IS RETURNED AFTER IT, so the two are alternatives rather than siblings",
  arrivalIdx < previewIdx, true);
t("B3 …and there is exactly ONE arrival strip and ONE preview strip, so neither can be duplicated into a sibling",
  [(code.match(/data-arrival-strip/g) ?? []).length, (code.match(/data-preview-strip/g) ?? []).length], [1, 1]);

console.log("\nC · the arrival strip has a ROUTE and no EXIT");
/* ⚠ ON ARRIVAL THERE IS NO PREVIEW, SO AN EXIT WOULD ACT ON NOTHING. It would either do nothing or
 * "exit" to the state it is already in, which reads as broken. The exit belongs to the live-preview
 * strip exclusively, and "add one for symmetry" is what a later pass will try. */
const arrivalBlock = (() => {
  const start = code.lastIndexOf("<div", arrivalIdx);
  const end = code.indexOf("</div>", arrivalIdx);
  return start >= 0 && end > start ? code.slice(start, end) : "";
})();
t("C0 the arrival strip's own markup was isolated — an empty slice would make C1 and C2 vacuous",
  arrivalBlock.length > 120, true);
t("C1 ⚠ IT ROUTES TO /palettes — the visitor is told there are nine and given the way to them",
  /href="\/palettes"/.test(arrivalBlock), true);
t("C2 ⚠ AND IT CARRIES NO EXIT — no button, no exit handler, nothing that clears the cookie",
  /<button|onClick|Max-Age=0/.test(arrivalBlock), false);
t("C3 …while the PREVIEW strip still has its exit, so the exit was moved nowhere",
  /Exit preview/.test(code), true);

console.log("\nD · the note fires on exactly the palettes the four do not contain");
const REAL = THEME_NAMES.filter((n) => n !== VERIFY_THEME);
const NOT_OFFERED = REAL.filter((n) => !TEASER_THEMES.includes(n));
t("D0 ⚠ THE STATE IS LIVE — publishable palettes exist that the four do not contain",
  NOT_OFFERED.length >= 1, true);
console.log(`         ${NOT_OFFERED.length} of ${REAL.length} publishable palettes trigger the strip: ${NOT_OFFERED.join(", ")}`);
t("D1 every offered palette yields NO strip — the dots explain themselves there",
  TEASER_THEMES.filter((n) => arrivalNote(n) !== null), []);
t("D2 ⚠ AND EVERY UNOFFERED ONE YIELDS A STRIP THAT NAMES IT",
  NOT_OFFERED.filter((n) => !(arrivalNote(n) ?? "").includes(n)), []);
t("D2a …and it says the published theme is not among them, rather than merely naming it",
  NOT_OFFERED.filter((n) => !/not one of these/.test(arrivalNote(n) ?? "")), []);
t("D3 the two predicates cannot disagree about the same palette",
  REAL.filter((n) => publishedIsOffered(n) !== (arrivalNote(n) === null)), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
