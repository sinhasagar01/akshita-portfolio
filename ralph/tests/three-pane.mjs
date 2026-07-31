// The three-pane editor's geometry, its collapse rule, and the SINGLE-SOURCE property that
// keeps its two breakpoints from becoming hand-coupled literals.
// Run: node --experimental-strip-types ralph/tests/three-pane.mjs
//
// WHY THIS SUITE EXISTS, and it is two different reasons wearing one file.
//
// PART A/B — THE COLLAPSE RULE. `isListCollapsed` is three states collapsed into a boolean
// and its middle case is the non-obvious one: "default" means nobody has chosen, so the
// width decides, while "open" and "closed" are explicit and hold at EVERY width. A boolean
// `open` cannot express that, and the version this replaced could not — it defaulted true
// and never read the width at all, so the layout did not respond to the viewport.
//
// PART C — THE ABSENCE ASSERTION, and this is the one that earns the file. Tailwind cannot
// interpolate a value into a class name, so the natural build writes `max-[1538px]:w-0`
// beside an exported `FIT_THRESHOLD_PX = 1538` and couples the two copies BY HAND. That is
// the 236px PublishBar hazard reproduced, and that hazard is comment-enforced, which is to
// say unenforced. The obvious test — assert the constant equals the number in the class —
// only proves two copies currently agree. This asserts the SECOND COPY DOES NOT EXIST.
// Asserting a duplicate away beats asserting it consistent, and it is the precedent for the
// next literal that wants two homes.
//
// THE FAILURE THIS CATCHES IS REAL AND ALREADY HAPPENED ONCE. `FIT_THRESHOLD_PX` shipped in
// a586e98 with ZERO consumers anywhere in the repo, while the file's own comment described
// `max-[1538px]` variants that did not exist. A comment describing code that is not there is
// how `structural()` became a name people believed in. Part D is the other half of that
// repair: the constant must be USED, not merely exported.
import { readFileSync } from "node:fs";
import {
  FIT_THRESHOLD_PX,
  INSPECTOR_FOLD_PX,
  isListCollapsed,
  CS_CANVAS_WIDTH_PX,
  CS_MIN_SCALE,
  CS_CANVAS_MIN_PX,
  CS_FIT_THRESHOLD_PX,
  CS_COLLAPSED_FLOOR_PX,
} from "../../lib/studio/three-pane.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

/** Source with comments removed. The assertions in Part C are about CODE — a comment that
 *  quotes the old wrong `max-[1538px]` variant, which ThreePaneShell's header deliberately
 *  does, is a record of a corrected mistake and not a second consumer of the number. */
const code = (p) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

/* ---- THE SIDEBAR TERM, READ OUT OF ITS OWN CLASS STRING LIKE EVERY OTHER PANE ---------------
 *
 * #194 made Part H read the list and inspector widths from the shell's classes, because a class
 * and a threshold that state the same measurement can drift apart with every gate green. IT LEFT
 * ONE TERM OUT. The sidebar stayed a bare `236` literal on both sides of every sum in this file,
 * so the one pane whose width lives in a DIFFERENT component was the one nothing tied together.
 *
 * That gap had already started to cost. `studio-ink` D was written to pin "all five sites" and
 * pins four; at HEAD there are SEVEN, and the two it misses — `CS_FIT_THRESHOLD_PX` and
 * `CS_COLLAPSED_FLOOR_PX` — are both BEHAVIOURAL and were both added after D was written. A
 * count is accurate when written and decays as the thing under it grows.
 *
 * DERIVING IT MAKES THE COUNT STOP MATTERING, which is the point. Nothing here now restates the
 * sidebar width; it is read once from `StudioSidebar` and summed. Move the class and every sum
 * in this file moves with it, or fails. */
const SIDEBAR_PX = (() => {
  const m = /lg:w-\[(\d+)px\]/.exec(code("components/studio/StudioSidebar.tsx"));
  t("A: StudioSidebar declares its own width, and it is the only place that does", m !== null, true);
  return m ? Number(m[1]) : NaN;
})();
t("A: the sidebar is 236px", SIDEBAR_PX, 236);
// THE DISPLAY HALF OF THE COUPLING, ALSO DERIVED. PublishBar offsets a `fixed` bar past the
// sidebar by hand; hazard 1 has called that comment-enforced since #165. It is an equality
// between two files, so assert the equality rather than pinning both to a literal.
{
  const pb = /lg:left-\[(\d+)px\]/.exec(code("components/studio/PublishBar.tsx"));
  t("A: PublishBar declares a sidebar offset", pb !== null, true);
  t("A: …and it EQUALS the sidebar's width — the hand-kept coupling, machine-checked",
    pb ? Number(pb[1]) : NaN, SIDEBAR_PX);
}

/* ================================================================= A. the numbers
 * Pinned from the MEASUREMENT, not read back out of the layout. 68ch resolves against the
 * wrapper's 16px font at 745.9px, so canvas = 745.9 + 48 padding = 794 (rounded up).
 * The contract's 620 was estimated from the 18px prose font and made the threshold wrong
 * by 190px. VERIFY A UNIT BEFORE COMPUTING WITH IT. */
t("A: FIT_THRESHOLD_PX is 1614", FIT_THRESHOLD_PX, 1614);
t("A: the arithmetic reproduces it", SIDEBAR_PX + 264 + 794 + 320, FIT_THRESHOLD_PX);
t("A: INSPECTOR_FOLD_PX is 1100", INSPECTOR_FOLD_PX, 1100);
t("A: the fold is below the fit threshold", INSPECTOR_FOLD_PX < FIT_THRESHOLD_PX, true);
// The 1536-wide laptop this is authored on is BELOW the threshold, which is the fact that
// makes the collapse control load-bearing rather than a refinement. If someone "rounds"
// the threshold down to 1536 or lower, that stops being true and this fails.
t("A: a 1536 laptop does NOT fit three panes", 1536 < FIT_THRESHOLD_PX, true);

/* ================================================================= B. the collapse rule
 * The WHOLE truth table. Six rows, because a table with a hole in it is how the middle
 * case gets reasoned about instead of tested. */
const TABLE = [
  // [intent,     fits,  collapsed]
  ["default", true, false], // nobody chose, the panes fit  -> open
  ["default", false, true], // nobody chose, they do not fit -> collapsed
  ["open", true, false], // explicit open, wide            -> open
  ["open", false, false], // explicit open, NARROW          -> STILL open
  ["closed", true, true], // explicit closed, wide          -> STILL closed
  ["closed", false, true], // explicit closed, narrow        -> closed
];
for (const [intent, fits, want] of TABLE) {
  t(`B: (${intent}, fits=${fits}) -> collapsed=${want}`, isListCollapsed(intent, fits), want);
}
// Stated as its own assertion because it is the reason the type is not a boolean: an
// author who reopened the list on a narrow screen did so KNOWING it was narrow, and a
// layout that reverses that on the next render is a layout that argues with them.
t("B: an explicit choice survives a width that disagrees with it",
  [isListCollapsed("open", false), isListCollapsed("closed", true)], [false, true]);
// And the inverse: "default" is the ONLY intent the width can move.
t("B: only `default` is width-sensitive",
  ["default", "open", "closed"].map((i) => isListCollapsed(i, true) !== isListCollapsed(i, false)),
  [true, false, false]);

/* ================================================================= C. no second literal
 * Every file that acts on either breakpoint, and the assertion that none of them spells
 * the number out. */
const CONSUMERS = [
  "components/studio/ThreePaneShell.tsx",
  "components/studio/usePageWidthMin.ts",
  "components/studio/BlogBlocksEditPanel.tsx",
];
for (const f of CONSUMERS) {
  const src = code(f);
  t(`C: ${f} contains no literal 1614`, /\b1614\b/.test(src), false);
  t(`C: ${f} contains no literal 1100`, /\b1100\b/.test(src), false);
  // A Tailwind arbitrary variant is the specific shape this is guarding against, so it is
  // asserted by NAME as well as by number — `max-[1538px]` and `min-[1100px]` are what the
  // drafted shell's comment promised and what a future edit would reach for first.
  t(`C: ${f} has no arbitrary-width Tailwind variant`, /\b(?:max|min)-\[\d+px\]/.test(src), false);
}
// The constants themselves live in exactly one place, once each. Comment-stripped for the
// same reason as the consumers: three-pane.ts's header states the arithmetic that PRODUCES
// 1538, and prose showing its work is not a second declaration.
const home = code("lib/studio/three-pane.ts");
t("C: three-pane.ts declares 1614 exactly once", (home.match(/\b1614\b/g) ?? []).length, 1);
t("C: three-pane.ts declares 1100 exactly once", (home.match(/\b1100\b/g) ?? []).length, 1);
// The case-study numbers get the same discipline from the start rather than after a second
// copy appears. They have no consumers yet — PR 7 adds those — so this is the cheap moment.
t("C: three-pane.ts declares 1460 exactly once", (home.match(/\b1460\b/g) ?? []).length, 1);
t("C: three-pane.ts declares 1223 exactly once", (home.match(/\b1223\b/g) ?? []).length, 1);
// 640 is DERIVED (1280 × 0.5), never written as a literal — writing it would be the second
// copy this part exists to prevent, and it would silently survive a change to the scale floor.
t("C: the canvas floor is computed from the scale, not spelled as a literal",
  /CS_CANVAS_MIN_PX = CS_CANVAS_WIDTH_PX \* CS_MIN_SCALE/.test(home), true);

/* ================================================================= D. the constants are USED
 * The other half of the a586e98 repair. An exported constant with no consumers is not a
 * single source of truth, it is a decoration beside whatever the code actually does — and
 * that is exactly the state the drafted shell shipped in, while its comment described
 * variants that were never written. So: each constant must be IMPORTED and READ somewhere
 * that can act on it. */
const shell = code("components/studio/ThreePaneShell.tsx");
/* THESE TWO WERE REVALUED IN PR 5, DELIBERATELY, AND THE INTENT IS UNCHANGED.
 * They used to read "the SHELL imports FIT_THRESHOLD_PX" and "the shell passes it to the media
 * hook". Both were true and both were the defect: the shell reading blog's 1614 directly is
 * exactly what would have handed a second consumer blog's breakpoint in silence. The constant
 * must still be IMPORTED AND READ — that is a586e98's repair and it stands — but by the CONSUMER,
 * which is the only place that knows which collection it is. So the assertion moved with the
 * responsibility rather than being weakened. */
t("D: the shell no longer imports FIT_THRESHOLD_PX — it takes the threshold as a prop, so it knows no collection",
  /FIT_THRESHOLD_PX/.test(shell), false);
t("D: the shell drives its page-width query from that prop", /usePageWidthMin\(\s*fitThresholdPx\s*\)/.test(shell), true);
t("D: …and the collapse controls are named from the consumer's noun, not a hardcoded 'posts'",
  /aria-label=\{`Show \$\{listNoun\}`\}/.test(shell) && /aria-label=\{`Collapse \$\{listNoun\}`\}/.test(shell), true);
t("D: no hardcoded collection noun survives in the shell", /"[^"]*\bposts\b[^"]*"/.test(shell), false);
t("D: the shell drives collapse through isListCollapsed", /isListCollapsed\(/.test(shell), true);

const host = code("components/studio/BlogBlocksEditPanel.tsx");
// THE CONSUMER now owns BOTH breakpoints, which is where the a586e98 "must be used" property
// relocated to. If the blog host stops passing its own threshold, the shell has no default to
// fall back on (the prop is required) — but a gate that only trusted tsc would miss the case
// where someone passes the WRONG constant, so the identity is asserted here.
t("D: the blog host imports FIT_THRESHOLD_PX and passes it as the shell's threshold",
  /FIT_THRESHOLD_PX/.test(host) && /fitThresholdPx=\{FIT_THRESHOLD_PX\}/.test(host), true);
t("D: …and names its list 'posts' at the call site", /listNoun="posts"/.test(host), true);
t("D: the host imports INSPECTOR_FOLD_PX", /INSPECTOR_FOLD_PX/.test(host), true);
t("D: the host passes it to the page-width hook", /usePageWidthMin\(\s*INSPECTOR_FOLD_PX\s*\)/.test(host), true);

/* ================================================================= E. one inspector, not two
 * The fold moves the inspector node between parents; it must never render a hidden second
 * copy. Two copies would be two field trees posting through one onChange, with colliding
 * ids and two carets. Asserted as the ABSENCE of the pattern that would create them —
 * ASSERT THE ABSENCE OF A PATTERN, NOT JUST THE PRESENCE OF A RESULT. */
t("E: the shell renders the inspector aside conditionally, not with a hidden class",
  /inspector\s*!==\s*null\s*\?/.test(shell), true);
t("E: the shell's aside carries no `hidden` utility",
  /<aside[^>]*className="[^"]*\bhidden\b/.test(shell), false);
// The host passes null rather than a second copy when it folds.
t("E: the host passes null below the fold",
  /inspector=\{\s*inspectorFits\s*\?\s*inspector\s*:\s*null\s*\}/.test(host), true);
// And the same identifier is what goes into the canvas when folded, so there is one node.
t("E: the folded inspector is the SAME node the aside would have taken",
  /canvas=\{[^}]*view === "inspector" \? inspector :/.test(host), true);

/* ================================================================= F. inert tracks collapsed
 * G3's structural half. The attribute and the width must be driven by ONE value — a pane
 * that is visually collapsed and still tabbable is #177's finding in mirror form, and
 * computing the two separately is exactly how that happens. This cannot prove the browser
 * honours `inert`; that is G3's job, in a browser. It proves the code cannot get them out
 * of step. PROVE INERTNESS, DON'T INFER IT — this is the half that is inferable. */
// The exact form matters and this assertion pins it. `inert={collapsed}` is a React 19
// boolean prop. The shape it replaced — `{...(collapsed ? { inert: "" } : {})}`, written to
// satisfy an older TypeScript — passes an EMPTY STRING, which React 19 treats as falsy and
// omits, so the collapsed pane shipped with no `inert` at all and stayed fully tabbable.
// Asserting the absence of the cast is what stops a future "type error fix" reintroducing it.
t("F: inert is applied from `collapsed` as a boolean prop", /inert=\{collapsed\}/.test(shell), true);
t("F: inert is NOT passed as a string cast", /inert:\s*""/.test(shell), false);
// The other half of the same failure: `w-0` computed to 264px because a flex item's default
// `min-width: auto` floors it at min-content, and the inner wrapper is `min-w-[264px]`.
t("F: the collapsing pane carries min-w-0", /relative flex min-w-0 flex-none/.test(shell), true);
t("F: the width is applied from the same `collapsed`",
  /collapsed \? "w-0 border-transparent" : "w-\[264px\]/.test(shell), true);
t("F: `collapsed` is computed exactly once",
  (shell.match(/const collapsed = /g) ?? []).length, 1);

/* ================================================================= G. the full-height opt-in
 * `data-studio-fullheight` is a HAND-COUPLED PAIR across two files — the shell writes the
 * attribute, the dashboard layout selects on it with `:has()`. Nothing in the type system
 * connects them, so a rename on either side silently returns the editor to a page-scrolled
 * column that clips its own panes.
 *
 * THE `:has()` SCOPING IS ITSELF THE ASSERTION. Applying `lg:h-dvh` unconditionally made the
 * bottom of every OTHER studio page unreachable at a short viewport — measured on
 * /studio/projects at 420px: body clientHeight 420 against scrollHeight 520, and neither the
 * window nor body would scroll the last 100px. So a bare `lg:h-dvh` in the layout is a
 * regression, and this fails if one reappears. */
const layout = code("app/studio/(dashboard)/layout.tsx");
t("G: the shell marks itself full-height", /data-studio-fullheight/.test(shell), true);
t("G: the layout keys its height off that marker",
  /lg:has-\[\[data-studio-fullheight\]\]:h-dvh/.test(layout), true);
t("G: the layout scopes min-h-0 the same way",
  /lg:has-\[\[data-studio-fullheight\]\]:min-h-0/.test(layout), true);
// The regression guard: an UNSCOPED height on the shared layout.
t("G: the layout has no unscoped lg:h-dvh", /(?<!\]:)\blg:h-dvh\b/.test(layout), false);
t("G: the layout keeps min-h-screen for page-scrolled routes",
  /\bmin-h-screen\b/.test(layout), true);

/* ================================================================= H. the panes ARE the sum
 * THE GAP THAT LET THE INSPECTOR WIDEN DANGEROUSLY. Section A pins the arithmetic and
 * section C forbids a second copy of the THRESHOLD, but nothing tied the shell's pane width
 * CLASSES to the terms of that sum. So widening the inspector from 244 to 320 in the class
 * alone left every gate green while the threshold still claimed three panes fit at 1538 —
 * where the canvas would actually get 718px against the 794 it needs, dropping the canvas
 * column below its 697.9296875 public measure. Nothing would have failed, and the measure is
 * the property the whole editor exists to hold.
 *
 * So the widths are READ OUT OF THE CLASS STRINGS and summed here. Change a pane's class
 * without moving FIT_THRESHOLD_PX and this fails. It is #178's A1 discipline applied to the
 * layout itself — ASSERT THE CONSTANT AGAINST THE CLASS STRING THAT CONSUMES IT — and it is
 * the honest answer to a coupling Tailwind makes impossible to remove, since a class name
 * cannot interpolate a value. Assert the pair, because you cannot delete the pair. */
const widthFrom = (re, label) => {
  const m = re.exec(shell);
  t(`H: the shell declares a ${label} width`, m !== null, true);
  return m ? Number(m[1]) : NaN;
};
// The list's open width, out of the collapsed/open ternary.
//
// THE HAIRLINE OPACITY IS A WILDCARD ON PURPOSE. This read `border-ink-950\/8` and broke when
// the ink-chrome panel language stepped the studio's hairlines to /12 — a legitimate change
// that has nothing to do with the width this line exists to extract. The assertion was pinning
// more than its subject, which makes it fail for the wrong reason and invites someone to
// weaken it. It still anchors to the same class string, so it cannot match some other pane.
const LIST_PX = widthFrom(/"w-\[(\d+)px\] border-ink-950\/\d+"/, "list");
// The inspector's, off the <aside>.
const INSPECTOR_PX = widthFrom(/<aside className="w-\[(\d+)px\] flex-none/, "inspector");

t("H: the list pane is 264px", LIST_PX, 264);
t("H: the inspector pane is 320px", INSPECTOR_PX, 320);
// THE COUPLING, MACHINE-CHECKED. The sidebar is DERIVED now (see Part A) and 794 is the canvas
// (68ch + 48px of padding), which is measured elsewhere and is not this file's to move.
t("H: sidebar + list + canvas + inspector IS the fit threshold",
  SIDEBAR_PX + LIST_PX + 794 + INSPECTOR_PX, FIT_THRESHOLD_PX);
// And the canvas term must still clear the public measure it exists to protect, or the
// threshold is internally consistent but wrong.
t("H: the canvas term covers 68ch (745.9) plus its 48px padding", 794 >= 745.9 + 48, true);

/* ================================================================= I. THE CASE-STUDY THRESHOLD
 * A DIFFERENT SHAPE OF CONSTANT, NOT A DIFFERENT VALUE. Blog's canvas has a natural minimum
 * width (68ch is a property of the text). The case-study canvas has none — it renders at 1280
 * and SCALES — so substituting the term gives 236+264+1280+320 = 2100, a threshold most laptops
 * never reach, and answers a question the scaled canvas does not ask. What is derived instead is
 * a minimum legible SCALE, then a pane width, then a threshold.
 *
 * PINNED THE SAME WAY 1614 IS, AND OFF THE SAME EXTRACTED CLASS WIDTHS — because #194 found the
 * threshold and the pane widths could drift apart with every gate green. Reusing LIST_PX and
 * INSPECTOR_PX from Part H is the point: one set of widths feeds both thresholds. */
const REOPEN_PX = widthFrom(/place-items-center rounded-r-\[|w-\[(\d+)px\] flex-none place-items-center/, "reopen rail") || 26;
const RAIL_PX = Number((/h-7 w-\[(\d+)px\] flex-none place-items-center/.exec(shell) ?? [])[1] ?? 26);
/* THE COLLAPSED LIST PANE IS NOT ZERO, AND THAT PIXEL WAS MISSING FROM THE FLOOR. It is
 * `w-0 border-transparent`, and a transparent border still occupies its width — the border-COLOR
 * is what animates, so it cannot be dropped without losing the transition. Derived from the
 * shell's own class rather than assumed, because the whole point of Part I is that the threshold
 * IS the sum. Driven at page 1222 before the fix: canvas 639, raw fit 0.499, clamp covering it. */
const COLLAPSED_LIST_PX = /collapsed \? "w-0 border-transparent"/.test(shell) ? 1 : 0;
t("I: a collapsed list pane still occupies its 1px transparent border", COLLAPSED_LIST_PX, 1);

t("I: CS_MIN_SCALE is 0.5 — the owner's floor, and a ROLE decision: the canvas is for SHAPE, the inspector is for WORDS",
  CS_MIN_SCALE, 0.5);
t("I: CS_CANVAS_WIDTH_PX is 1280 — `container-x`'s cap, the width the canvas renders at before scaling",
  CS_CANVAS_WIDTH_PX, 1280);
t("I: the canvas floor is the render width times the scale", CS_CANVAS_WIDTH_PX * CS_MIN_SCALE, CS_CANVAS_MIN_PX);
t("I: CS_FIT_THRESHOLD_PX is 1460", CS_FIT_THRESHOLD_PX, 1460);
// THE COUPLING, MACHINE-CHECKED, off the SHELL'S OWN class strings rather than repeated literals.
t("I: sidebar + list + canvas-floor + inspector IS the case-study threshold",
  SIDEBAR_PX + LIST_PX + CS_CANVAS_MIN_PX + INSPECTOR_PX, CS_FIT_THRESHOLD_PX);
// The render width lives in TWO places — here and SectionsEditPanel's module-private
// CANVAS_WIDTH. Two copies of one measurement is the #194 shape, so they are asserted equal.
{
  const sections = readFileSync(new URL("../../components/studio/SectionsEditPanel.tsx", import.meta.url), "utf8");
  const m = /const CANVAS_WIDTH = (\d+);/.exec(sections);
  t("I: SectionsEditPanel still declares CANVAS_WIDTH", m !== null, true);
  t("I: …and it agrees with CS_CANVAS_WIDTH_PX — two copies of one measurement, asserted equal",
    m ? Number(m[1]) : NaN, CS_CANVAS_WIDTH_PX);
}
// THE COLLAPSED FLOOR, DERIVED AND CONFIRMED RATHER THAN ASSUMED.
t("I: CS_COLLAPSED_FLOOR_PX is 1223", CS_COLLAPSED_FLOOR_PX, 1223);
t("I: the collapsed arithmetic uses the shell's OWN reopen-rail width AND the collapsed pane's residual border",
  SIDEBAR_PX + COLLAPSED_LIST_PX + RAIL_PX + CS_CANVAS_MIN_PX + INSPECTOR_PX, CS_COLLAPSED_FLOOR_PX);
// Collapsing returns (list − rail) to the canvas. At the fit threshold that is 878px, and the
// question the constant exists to answer is whether that clears the floor. It does, by 18.6pts.
{
  const recovered = LIST_PX - RAIL_PX - COLLAPSED_LIST_PX;
  const canvasWhenCollapsed = CS_CANVAS_MIN_PX + recovered;
  t("I: collapsing the list returns 237px to the canvas", recovered, 237);
  t("I: …so at the fit threshold the collapsed canvas is 877px", canvasWhenCollapsed, 877);
  t("I: …which is above the 50% floor, so the rail collapsing never takes the canvas under it",
    canvasWhenCollapsed / CS_CANVAS_WIDTH_PX >= CS_MIN_SCALE, true);
}
/* ---- THE SUMS ARE PAGE-SPACE AND THE HOOK NOW MEASURES A PAGE. THE GAP IS CLOSED. -----------
 *
 * THIS BLOCK REPLACED ITS OWN PREDECESSOR RATHER THAN KEEPING IT. The assertions here used to
 * prove the gap EXISTED — "the fit threshold minus the reserved scrollbar leaves the canvas below
 * its floor, so the clamp is load-bearing". That gap is now fixed, so keeping those assertions
 * would PIN THE BUG: a gate that outlives the defect it described is the same shape as a comment
 * describing code that no longer exists, except that it fails when someone fixes the thing.
 *
 * WHAT THE DEFECT ACTUALLY WAS, sharper than it was first recorded. `matchMedia` matches the
 * VIEWPORT; every pane divides the PAGE BOX, and `scrollbar-gutter: stable` keeps them apart.
 * The constants were PAGE-SPACE SUMS all along, so not one of them was wrong — only the thing
 * they were compared against. Driven at a 1475 viewport, where the page box is exactly 1460:
 * canvas 640, raw fit 0.500, rendered 0.500. `usePageWidthMin` measures the page box now.
 *
 * AND THE RECORDED REMEDY WAS WRONG. The trigger said "a ResizeObserver on the shell". The
 * shell's root is a flex ROW with `min-width: auto`, so its width is its panes' min-content — at
 * a 900px viewport it measures 1309px inside an 885px page and would have reported "fits" where
 * nothing fits. Measuring `documentElement` is what closes it. */
t("I: the fit threshold IS the page-space sum, exactly — the canvas gets its floor at the threshold, with nothing left over",
  CS_FIT_THRESHOLD_PX - SIDEBAR_PX - LIST_PX - INSPECTOR_PX, CS_CANVAS_MIN_PX);
t("I: …and blog's threshold is the same shape of sum",
  FIT_THRESHOLD_PX - SIDEBAR_PX - LIST_PX - INSPECTOR_PX, 794);
{
  const hook = readFileSync(new URL("../../components/studio/usePageWidthMin.ts", import.meta.url), "utf8");
  t("I: the hook measures the PAGE BOX, not the viewport",
    /document\.documentElement\.getBoundingClientRect\(\)\.width/.test(hook), true);
  t("I: …and no longer asks matchMedia, which is what compared a page-space sum to a viewport",
    /matchMedia\(/.test(hook.replace(/\/\/.*$/gm, "")), false);
  // The subject is pinned BY NAME, because the wrong subject is the one the trigger prescribed.
  t("I: …and it observes documentElement rather than the shell, whose width is its own panes' min-content",
    /ro\.observe\(document\.documentElement\)/.test(hook), true);
  t("I: the server snapshot survives the change — documentElement is not a node a component renders",
    /getServerSnapshot = useCallback\(\(\) => true/.test(hook), true);
}
/* THE FLOOR IS NOT INERT AFTERWARDS, WHICH IS WHY IT STAYS. On the default path it never binds —
 * that is the point of getting the threshold right. It binds on the EXPLICIT-OPEN path, which
 * `ListIntent` deliberately does not cover by width: an author who reopens the list on a narrow
 * screen keeps it open. Driven at page 1225 with the list reopened: canvas 405, raw fit 0.316,
 * rendered 0.500. The clamp stopped covering an arithmetic error and started guarding the one
 * path the arithmetic does not. */
t("I: with the list explicitly OPEN below the collapsed floor the raw fit drops under 50%, so the clamp is still doing work",
  (CS_COLLAPSED_FLOOR_PX - SIDEBAR_PX - LIST_PX - INSPECTOR_PX) / CS_CANVAS_WIDTH_PX < CS_MIN_SCALE, true);
t("I: …and `isListCollapsed` is what lets that happen — an explicit open beats the width",
  isListCollapsed("open", false), false);
// The clamp itself, in source. `Math.min(1, …)` alone is the simplification this comment warns
// against, so the FLOOR term is pinned rather than described.
{
  const sections = readFileSync(new URL("../../components/studio/SectionsEditPanel.tsx", import.meta.url), "utf8");
  t("I: useFitToWidth clamps UP to CS_MIN_SCALE as well as down to 1",
    /Math\.max\(CS_MIN_SCALE, Math\.min\(1, [^)]*\/ CANVAS_WIDTH\)\)/.test(sections), true);
}

/* ---- THE CASE-STUDY CONSUMER PASSES ITS OWN BREAKPOINT, mirroring Part D for blog. Both
 * thresholds are the consumer's since PR 5; this is the half that proves the SECOND consumer
 * actually uses its own rather than inheriting blog's by omission. */
{
  const host = readFileSync(new URL("../../components/studio/SectionsEditPanel.tsx", import.meta.url), "utf8");
  t("I: the case-study editor passes CS_FIT_THRESHOLD_PX, not a literal and not blog's constant",
    /fitThresholdPx=\{CS_FIT_THRESHOLD_PX\}/.test(host), true);
  t("I: …and names its list 'sections' at the call site", /listNoun="sections"/.test(host), true);
  t("I: …and folds its inspector at CS_COLLAPSED_FLOOR_PX, the derived floor rather than blog's 1100",
    /usePageWidthMin\(CS_COLLAPSED_FLOOR_PX\)/.test(host), true);
  // On CODE, not the raw file — the comment at :729 names 1100 to say why it is NOT used, and a
  // check that punishes explaining a decision teaches people to stop explaining decisions.
  t("I: the case-study editor declares no literal breakpoint of its own — the constants are the only source",
    /\b(1460|1223|1614|1100)\b/.test(code("components/studio/SectionsEditPanel.tsx")), false);
}

// NOT REAL OPTIONS FOR THREE PANES — recorded so nobody re-derives them and proposes one.
t("I: 75% would need 1780px and 100% would need 2100px — neither is a laptop viewport",
  [SIDEBAR_PX + LIST_PX + Math.round(1280 * 0.75) + INSPECTOR_PX, SIDEBAR_PX + LIST_PX + 1280 + INSPECTOR_PX],
  [1780, 2100]);
// Counterintuitive and worth pinning: the case-study canvas is WIDER than blog's, yet its
// threshold is LOWER — because it scales and blog's does not. A reader who assumes the bigger
// canvas needs the bigger viewport has the model backwards.
t("I: the case-study threshold is BELOW blog's, because the canvas scales and blog's does not",
  CS_FIT_THRESHOLD_PX < FIT_THRESHOLD_PX, true);
// And the 1536 laptop that cannot fit blog's three panes CAN fit the case study's.
t("I: a 1536 laptop DOES fit three case-study panes, where it does not fit blog's",
  [1536 >= CS_FIT_THRESHOLD_PX, 1536 >= FIT_THRESHOLD_PX], [true, false]);

console.log(`\nthree-pane result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
