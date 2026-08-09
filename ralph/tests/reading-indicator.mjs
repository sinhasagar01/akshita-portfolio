// The reading indicator — always on, no SMIL, and yielding the corner to the nav sheet.
//
// ⚠ THIS COMPONENT'S WHOLE HISTORY IS COMPOSITING NOBODY COULD READ FROM SOURCE. Its body is
// transparent to the page and its tint composited through a background-blend-mode overlay stack, and
// that one fact produced six invalidated measurements, five probe defects and two arcs. The change
// this suite guards makes it readable: one visible state instead of three, and no filter whose
// animation the CSS reset cannot reach.
//
// ⚠ AND WHAT A SOURCE SUITE CAN HOLD IS THE WIRING, NOT THE PAINT. The numbers below were measured in
// a browser and are recorded beside the rows they justify, because a row that pins a measured value
// it cannot re-take is a claim about a state that has already changed.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Comment-stripped, because this file's own header names the things it forbids. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const src = code("components/blog/ReadingVessel.tsx");
const css = code("app/globals.css");

console.log("A · the subject exists — a zero here makes every row below vacuous");
t("A1 the component is real and non-trivial, against a literal", src.length > 1200, true);
t("A2 …and it still renders both forms, which is what makes B and D separable",
  [/className="blog-vessel is-on"/.test(src), /className="blog-docked is-on"/.test(src)], [true, true]);

console.log("\nB · always on — the scroll gate and the reveal state are gone");
/* ⚠ THE POINT OF THE CHANGE, NOT A TIDY-UP. Three visible states meant a sweep could catch the
 * component mid-reveal and measure a colour that exists for 400ms. One state is readable. */
t("B1 ⚠ NEITHER FORM IS GATED ON A VISIBILITY FLAG — `is-on` is unconditional on both",
  /\$\{visible \? " is-on" : ""\}/.test(src), false);
t("B2 …and no visibility state survives to gate it later",
  /setVisible|const \[visible/.test(src), false);
t("B3 …and the scroll handler no longer reads the elements the gate used",
  /blog-article-head|blog-love-block/.test(src), false);

console.log("\nC · no SMIL, and R2 is reversed rather than deleted");
/* ⚠ R2 EXISTED BECAUSE THE CSS `animation` RESET CANNOT STOP SMIL, so the whole component used to
 * return null under reduced motion. With the wobble gone there is no SMIL to escape the reset — and
 * A PROGRESS INDICATOR THAT DISAPPEARS UNDER REDUCED MOTION IS A DIFFERENT DEFECT FROM AN ANIMATION
 * THAT STOPS. Measured after the change: both forms render under `reduce`, and `--read` reaches
 * 0.727 against 0.726 with motion allowed — the fill tracks identically. */
t("C1 ⚠ NO SMIL REMAINS — an <animate> is the one thing the CSS reset cannot reach",
  /<animate|feTurbulence|feDisplacementMap/.test(src), false);
t("C2 …and the filter it drove is not referenced from CSS either, so no url() dangles",
  /url\(#blog-wobble\)/.test(css), false);
t("C3 ⚠ AND THE COMPONENT NO LONGER RETURNS NULL UNDER REDUCED MOTION — it renders statically",
  /prefersReduced|useReducedMotion/.test(src), false);
t("C4 …and `--read` is still driven, so reduced motion loses the wobble and not the information",
  /"--read": read/.test(src) && /ScrollTrigger\.create/.test(src), true);

console.log("\nD · the corner yields to the nav sheet, and only the corner");
/* ⚠ MEASURED, NOT ASSUMED. Sheet closed the aside is 216x324 at 1169,132 on a 1440 viewport and
 * 1009,132 at 1280; the sheet is 197x272 at top 68 with z-index 44 against the aside's 40, so they
 * overlap by roughly 183x208 and the sheet wins. Sheet open, the aside is ABSENT FROM THE DOM at
 * 1440, 1280, 1024 and 390, and the docked form is byte-identical across the transition at all four.
 *
 * ⚠ UNMOUNTED RATHER THAN FADED, AND ONLY ONE OF PublishBar's TWO REASONS TRANSFERS. Its comment
 * cites a clickable pill and the tab order; this element is aria-hidden and holds no control. The
 * reason that does transfer: a zero-opacity element STILL COMPOSITES, and compositing is the one
 * thing nobody could ever read from this component's source. */
t("D1 ⚠ THE ASIDE IS CONDITIONAL ON OCCLUSION — a fade would leave it compositing",
  /\{occluded \? null : \(/.test(src), true);
/* ⚠ STRUCTURAL, NOT A REGEX. The first version read `/\{occluded \? null : \([\s\S]*?blog-docked/`
 * and FAILED, because a lazy any-character run walks straight past the conditional's closing `)}` to
 * find the docked form further down the file. A regex cannot express "inside this block" — so the
 * block's own bounds are found and the docked form is asked whether it falls within them. A matcher
 * whose vocabulary cannot hold the concept, repaired by widening to the concept. */
const gate = src.indexOf("{occluded ? null : (");
/* ⚠ THE MATCHING PAREN, NOT THE NEXT ONE. `indexOf(")}")` finds whichever `)}` comes first, which is
 * not necessarily this block's — and a mutation that DELETED the close survived, because the search
 * simply walked on to a later one and still reported the docked form as outside. Balanced instead, so
 * "inside this block" is computed rather than approximated. Second time in this file that a matcher
 * could not express the concept it was written for. */
const gateEnd = (() => {
  if (gate < 0) return -1;
  const open = src.indexOf("(", gate);
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") d++;
    else if (src[i] === ")" && --d === 0) return i;
  }
  return -1;
})();
const dockedAt = src.indexOf("blog-docked is-on");
t("D2a the yield block and the docked form were both located, or D2 passes over nothing",
  gate >= 0 && gateEnd > gate && dockedAt >= 0, true);
t("D2 ⚠ AND THE DOCKED FORM SITS OUTSIDE THE YIELD — it is bottom-anchored where the sheet is top-anchored, so the no-op is GEOMETRY rather than a breakpoint",
  dockedAt > gateEnd, true);
t("D3 …and occlusion is read from the sheet itself rather than from a provider built for one consumer",
  /getElementById\("nav-sheet"\)/.test(src) && /MutationObserver/.test(src), true);
t("D4 …and the observer is torn down, or a route change leaks it",
  /mo\.disconnect\(\)/.test(src), true);
t("D5 ⚠ AND IT WATCHES THE CLASS THAT ACTUALLY TOGGLES — attributeFilter, not every mutation on the subtree",
  /attributeFilter: \["class"\]/.test(src), true);

console.log("\nE · the single-state collapse, and the property that keeps it safe");
/* ⚠ THE COLLAPSE IS SAFE ONLY WHILE `is-on` IS UNCONDITIONAL. Both selectors used to carry a hidden
 * base — `opacity: 0`, a 14px offset, `pointer-events: none` and a transition — with `.is-on`
 * supplying the visible values. With the class always applied, one state was reachable and the other
 * was a trap: a component declaring itself invisible and relying on a class ALWAYS being present is
 * one edit from a blank element, and nothing would report it.
 *
 * ⚠ SO THIS GATES THE PROPERTY, NOT THE CLASS STRING. Asserting `className="blog-vessel is-on"`
 * would pass for a component that reintroduced a scroll gate under a different name. What must hold
 * is the PAIR: either the base state is visible and the class is unconditional, or the hidden base
 * and its transition both come back. E2 is the half that catches a future gate.
 *
 * ⚠ AND THE FAILURE IS SILENT BY CONSTRUCTION, which is why it is worth a row at all — a blank fixed
 * element paints nothing, throws nothing and reports nothing. */
const vesselRule = (() => {
  const i = css.indexOf(".blog-vessel {");
  return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
})();
const dockedRule = (() => {
  const i = css.indexOf(".blog-docked {");
  return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
})();
t("E0 both base rules were located, or E1 and E2 pass over nothing",
  [vesselRule.length > 40, dockedRule.length > 40], [true, true]);
t("E1 ⚠ NEITHER BASE RULE HIDES ITSELF — a hidden base plus an always-on class is one edit from a blank element",
  [/opacity:\s*0\s*;/.test(vesselRule), /opacity:\s*0\s*;/.test(dockedRule)], [false, false]);
t("E1a …and neither keeps the reveal transition it no longer has a state to run",
  [/transition:/.test(vesselRule), /transition:/.test(dockedRule)], [false, false]);
t("E1b …and the `.is-on` overrides are gone, since they restated the only state there is",
  /\.blog-(vessel|docked)\.is-on\s*\{/.test(css), false);
t("E2 ⚠ AND THE CLASS IS STILL UNCONDITIONAL — reintroduce a gate and the collapse becomes a blank element",
  /className=\{`blog-(vessel|docked)\$\{/.test(src), false);
t("E2a …asserted on BOTH forms, so a gate on one would not hide behind the other",
  [/className="blog-vessel is-on"/.test(src), /className="blog-docked is-on"/.test(src)], [true, true]);

console.log(`\nreading-indicator result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
