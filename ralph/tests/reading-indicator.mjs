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

console.log(`\nreading-indicator result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
