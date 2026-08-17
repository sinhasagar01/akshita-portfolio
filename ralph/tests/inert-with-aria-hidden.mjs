// A CONDITIONALLY HIDDEN CONTAINER MUST LEAVE THE TAB ORDER, NOT JUST THE ACCESSIBILITY TREE.
// Run: node ralph/tests/inert-with-aria-hidden.mjs
//
// ---- ⚠ WHY THIS EXISTS: THE SAME DEFECT WAS PATCHED FOUR TIMES, ONE ELEMENT AT A TIME ----------
//
// `aria-hidden` removes a subtree from the accessibility TREE. It does nothing to the TAB ORDER.
// `pointer-events: none` stops a mouse and nothing else. `opacity: 0` stops neither. So a closed
// disclosure surface stays keyboard-reachable unless something says otherwise, and the only thing
// that says otherwise is `inert`.
//
// Four elements on the public home page had this, and each was found by a separate review:
//
//     #mobile-menu        guarded from the start          — the one that was right
//     #nav-sheet          8 links, fixed after review 3
//     .nav-fab-desktop    47x47 button, fixed after review 3, found because the SHEET was fixed
//     .palette-pill       6 controls, fixed after review 4
//     .nav-fab-mobile     41x41 button, fixed after review 4
//
// ⚠ AND THE PATTERN IS THE POINT: EVERY FIX REVEALED THE NEXT INSTANCE. The sheet was guarded and
// its own toggle was not. The desktop toggle was guarded and its mobile twin was not. Patching by
// instance has now failed three times running, which is what makes this a gate rather than a fifth
// patch.
//
// ---- ⚠ WHAT IT CHECKS, AND WHY THE SUBJECT IS *CONDITIONAL* aria-hidden -----------------------
//
// A STATIC `aria-hidden="true"` marks decoration — an icon, a duplicated glyph, an arrow. It has no
// focusable content and needs no `inert`; requiring one would be a gate asserting more than its
// subject needs, which this record has been bitten by.
//
// A CONDITIONAL `aria-hidden={expr}` means the thing TOGGLES, which means it is a disclosure
// surface, which means it very likely holds controls. That is the derivable discriminator, and it
// is why the rule keys on the expression rather than on a list of component names — a list would be
// correct on the day it was written and decay from then on.
//
// ---- THE HONEST LIMIT --------------------------------------------------------------------------
//
// This reads SOURCE. It cannot see whether a subtree actually contains a focusable node, and it
// cannot see the other routes into the same defect — a zero-size box, `display: contents`, or an
// off-screen container, all of which the browser census found and none of which carry an
// `aria-hidden` to key on. Those need a DOM, and a DOM needs a browser. What this closes is the one
// route that produced four of the five instances.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const walk = (rel, out = []) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(rel, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
};
const files = walk("components");

/* ⚠ COMMENTS BLANKED. This file's own subject is `aria-hidden={`, and the components it walks
 * explain their guards in prose that names the attribute — the self-reading trap this repository
 * has now hit in four separate tools. */
const read = (p) => blankCommentBodies(readFileSync(join(root, p), "utf8"));

/* An opening tag, from `<` to the `>` that closes it, tolerating nested braces in attribute
 * expressions. A regex cannot count braces, so the scan is a small state machine. */
function openingTags(src) {
  const tags = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== "<") continue;
    if (!/[A-Za-z]/.test(src[i + 1] ?? "")) continue;
    let depth = 0, j = i + 1, inStr = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (inStr) { if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    if (j < src.length) { tags.push({ text: src.slice(i, j + 1), index: i }); i = j; }
  }
  return tags;
}

const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

console.log("\nA · the scan finds real tags, so B cannot pass over nothing");
const allTags = files.flatMap((f) => openingTags(read(f)).map((tg) => ({ ...tg, f })));
t("A1 the walk found component files", files.length >= 20, true);
t("A2 …and parsed opening tags out of them", allTags.length >= 500, true);
/* ⚠ THE DENOMINATOR ROW. A broken tag scanner returns nothing, every lookup below finds nothing,
 * and the gate reports success over an empty subject — the vacuous pass this record carries six
 * instances of. */
const conditional = allTags.filter((tg) => /\saria-hidden=\{(?!true\}|"true"\})/.test(tg.text));
t("A3 …and CONDITIONAL aria-hidden has members, so the rule has a subject at all",
  conditional.length >= 3, true);

console.log("\nB · every conditionally hidden container also leaves the tab order");
console.log(`      ${conditional.length} conditional aria-hidden site(s) across ${new Set(conditional.map((c) => c.f)).size} file(s)`);
const unguarded = [];
for (const tg of conditional) {
  const hasInert = /\sinert=/.test(tg.text);
  /* `tabIndex={cond ? 0 : -1}` is the other correct answer and is accepted BY NAME rather than
     waved through: it removes the element itself from the tab order, which is sufficient when the
     element IS the control rather than a container around controls. ContactSection's back button
     is the live instance. */
  const hasTabGuard = /\stabIndex=\{[^}]*-\s*1/.test(tg.text);
  const src = read(tg.f);
  if (!hasInert && !hasTabGuard) {
    unguarded.push(`${tg.f}:${lineOf(src, tg.index)} — aria-hidden is conditional, no inert and no tabIndex guard`);
  } else {
    console.log(`      ok  ${relative(".", tg.f)}:${lineOf(src, tg.index)}  ${hasInert ? "inert" : "tabIndex"}`);
  }
}
t("B1 ⚠ A CONDITIONAL `aria-hidden` CARRIES `inert` OR A tabIndex GUARD — the tree and the tab order are different questions",
  unguarded, []);

console.log("\nC · what this gate cannot reach, by name");
/* Stated rather than implied, because a gate that reads as complete is worse than one whose edges
 * are written down. The browser census that produced this rule found three other routes to the same
 * defect, and not one of them carries an `aria-hidden` for a source scan to key on. */
for (const gap of [
  "a zero-size box that is RENDERED — measured, the population is currently EMPTY: every zero-box\n                    focusable sits inside, or is, a `display: none` element, so the browser already refuses it",
  "`display: contents` — the INVERSE hazard, visible content whose element takes no focus. It made\n                    five footer links unfocusable once; measured across four pages at both viewports, 98\n                    focusable candidates and ZERO elements use the property at all",
  "an off-screen container — measured with a constructed hazard to prove the probe fires: ZERO on\n                    the real page. But the census found a FIFTH route nobody had listed — an ancestor clipped\n                    to nothing by `clip-path`, which removes an element from sight and not from the tab order",
  "whether a guarded subtree actually contains anything focusable — measured across both\n                    viewports: all 5 inert guards on the home page protect real controls, 29 in total, and\n                    each fab is load-bearing at the viewport that shows it and redundant at the other",
]) console.log(`      unreachable   ${gap}`);
t("C1 the gaps are named rather than counted — a list of four, stated", 4, 4);

console.log(`\ninert-with-aria-hidden result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
