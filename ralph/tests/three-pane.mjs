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

/* ================================================================= A. the numbers
 * Pinned from the MEASUREMENT, not read back out of the layout. 68ch resolves against the
 * wrapper's 16px font at 745.9px, so canvas = 745.9 + 48 padding = 794 (rounded up).
 * The contract's 620 was estimated from the 18px prose font and made the threshold wrong
 * by 190px. VERIFY A UNIT BEFORE COMPUTING WITH IT. */
t("A: FIT_THRESHOLD_PX is 1614", FIT_THRESHOLD_PX, 1614);
t("A: the arithmetic reproduces it", 236 + 264 + 794 + 320, FIT_THRESHOLD_PX);
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
  "components/studio/useMediaMin.ts",
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

/* ================================================================= D. the constants are USED
 * The other half of the a586e98 repair. An exported constant with no consumers is not a
 * single source of truth, it is a decoration beside whatever the code actually does — and
 * that is exactly the state the drafted shell shipped in, while its comment described
 * variants that were never written. So: each constant must be IMPORTED and READ somewhere
 * that can act on it. */
const shell = code("components/studio/ThreePaneShell.tsx");
t("D: the shell imports FIT_THRESHOLD_PX", /FIT_THRESHOLD_PX/.test(shell), true);
t("D: the shell passes it to the media hook", /useMediaMin\(\s*FIT_THRESHOLD_PX\s*\)/.test(shell), true);
t("D: the shell drives collapse through isListCollapsed", /isListCollapsed\(/.test(shell), true);

const host = code("components/studio/BlogBlocksEditPanel.tsx");
t("D: the host imports INSPECTOR_FOLD_PX", /INSPECTOR_FOLD_PX/.test(host), true);
t("D: the host passes it to the media hook", /useMediaMin\(\s*INSPECTOR_FOLD_PX\s*\)/.test(host), true);

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
// THE COUPLING, MACHINE-CHECKED. 236 is the sidebar and 794 is the canvas (68ch + 48px of
// padding); both are measured elsewhere and are not this file's to move.
t("H: sidebar + list + canvas + inspector IS the fit threshold",
  236 + LIST_PX + 794 + INSPECTOR_PX, FIT_THRESHOLD_PX);
// And the canvas term must still clear the public measure it exists to protect, or the
// threshold is internally consistent but wrong.
t("H: the canvas term covers 68ch (745.9) plus its 48px padding", 794 >= 745.9 + 48, true);

console.log(`\nthree-pane result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
