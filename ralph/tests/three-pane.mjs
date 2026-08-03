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
  SIDEBAR_MIN_PX, SIDEBAR_MAX_PX, SIDEBAR_DEFAULT_PX, clampSidebarWidth,
} from "../../lib/studio/sidebar-width.ts";
import {
  PANES_SUM,
  BLOG_CANVAS_MIN_PX,
  INSPECTOR_FOLD_PX,
  isListCollapsed,
  CS_CANVAS_WIDTH_PX,
  CS_MIN_SCALE,
  CS_CANVAS_MIN_PX,
  CS_PANES_SUM,
  CS_COLLAPSED_PANES_SUM,
} from "../../lib/studio/three-pane.ts";
/* THE SHIPPED DEFAULT, for the "as it ships" assertions below — an author who has never touched
 * the handle. Imported rather than re-derived from the aside's fallback, because the module is
 * where the default is DECIDED and the class attribute merely mirrors it. */
import { INSPECTOR_FALLBACK_PX as INSPECTOR_FALLBACK } from "../../lib/studio/inspector-width.ts";

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

/* ---- THE SIDEBAR TERM LEFT THE SUMS, AND #236's DERIVATION CHANGED SHAPE WITH IT -----------
 *
 * #236 read the sidebar width out of `StudioSidebar`'s class, because a class and a threshold
 * stating one measurement drift apart with every gate green. THE CLASS HAS NO NUMBER IN IT NOW —
 * it consumes a custom property, because Tailwind cannot interpolate a runtime value into a class
 * name and that inability is the original cause of the whole 236px hazard.
 *
 * So the derivation moves rather than dies: the DEFAULT comes from `sidebar-width.ts`, and what
 * is asserted here is that both consumers read THE SAME PROPERTY. #236 had to assert the sidebar
 * and PublishBar were EQUAL because they were two literals; they are now one value, so the
 * assertion is an identity rather than a vigil. **Hazard 1's display half closes here, and its
 * arithmetic half closes in the sums below.** */
{
  const sb = code("components/studio/StudioSidebar.tsx");
  const pb = code("components/studio/PublishBar.tsx");
  t("A: the sidebar's width is a custom property, not a literal", /lg:w-\[var\(--studio-sidebar-w\)\]/.test(sb), true);
  t("A: …and no literal width survives on it", /lg:w-\[\d+px\]/.test(sb), false);
  t("A: PublishBar offsets by the SAME property — the hand-kept pair is now one value",
    /lg:left-\[var\(--studio-sidebar-w\)\]/.test(pb), true);
  t("A: …and its literal offset is gone too", /lg:left-\[\d+px\]/.test(pb), false);
  // The property's NAME lives in one place, so the two consumers cannot drift onto different ones.
  t("A: the property name is declared once, in sidebar-width.ts",
    /export const SIDEBAR_WIDTH_VAR = "--studio-sidebar-w";/.test(read("lib/studio/sidebar-width.ts")), true);
}

/* ---- THE CLAMP, AND THE HALF OF IT THAT MATTERS -------------------------------------------
 * Clamping on WRITE alone is the bug: a cookie written while the max was wider outlives the
 * build that allowed it. Clamping on READ makes the stored value ADVISORY. Asserted with an
 * out-of-range input, which is exactly what a normal test would never produce. */
t("A: the bounds are 184 / 236 / 288", [SIDEBAR_MIN_PX, SIDEBAR_DEFAULT_PX, SIDEBAR_MAX_PX], [184, 236, 288]);
t("A: a stored value from a WIDER old clamp is clamped on the way in", clampSidebarWidth("320"), SIDEBAR_MAX_PX);
t("A: …and from a NARROWER one", clampSidebarWidth("120"), SIDEBAR_MIN_PX);
t("A: missing, junk and NaN all resolve to the default rather than throwing",
  [clampSidebarWidth(undefined), clampSidebarWidth("abc"), clampSidebarWidth(null), clampSidebarWidth(NaN)],
  [SIDEBAR_DEFAULT_PX, SIDEBAR_DEFAULT_PX, SIDEBAR_DEFAULT_PX, SIDEBAR_DEFAULT_PX]);
t("A: an in-range value survives", clampSidebarWidth("200"), 200);
// THE LAYOUT CLAMPS ON THE READ, not only the provider on the write.
t("A: the dashboard layout clamps the cookie as it reads it",
  /clampSidebarWidth\(jar\.get\(SIDEBAR_COOKIE\)\?\.value\)/.test(code("app/studio/(dashboard)/layout.tsx")), true);

/* ---- THE HANDLE MUST NOT BE A COLUMN ------------------------------------------------------
 *
 * DRIVEN FIRST, PINNED AFTER, because the first build got it wrong twice and both were silent.
 *
 * (1) In flow with `-mr-1`, `main` started 4px inside the handle and painted over half its hit
 *     area — a pointerdown at x=241 inside a 236..244 handle reported a BUTTON in main as its
 *     target and the drag never began.
 * (2) Worse: an in-flow flex item CONSUMES LAYOUT WIDTH. Net 4px came off the work area, so at a
 *     288px sidebar the canvas measured 645 where every sum here promises 649. A term nobody put
 *     in the arithmetic, introduced by the control built to sit on the seam — the exact defect
 *     class this file exists for.
 *
 * Absolute on the seam, it consumes nothing and the sums stay true. */
{
  const rz = code("components/studio/SidebarResizer.tsx");
  t("A: the resizer is absolutely positioned, so it takes no width from the panes",
    /className="[^"]*\babsolute\b/.test(rz), true);
  t("A: …and is NOT a flex item that could",
    /className="[^"]*\bflex-none\b/.test(rz), false);
  t("A: …and it rides the same property it drags, so it cannot drift off the seam",
    /lg:left-\[var\(--studio-sidebar-w\)\]/.test(rz), true);
  // `lg:grid` NOW, NOT `lg:block` — the handle centres a grip on the seam and the display mode is
  // how. THE ASSERTION IS ABOUT `hidden` BELOW lg, which is the property that matters and has not
  // moved; pinning the exact display keyword made a paint change fail a behaviour check.
  t("A: it does not render below lg, where there is no width to drag",
    /className="[^"]*\bhidden\b[^"]*\blg:(block|grid|flex)\b/.test(rz), true);
  // The separator contract. Driven with REAL keys (#209: a programmatic .focus() reports a false
  // negative on :focus-visible), and pinned here so the roles cannot quietly go.
  for (const [attr, re] of [
    ["role=separator", /role="separator"/], ["aria-orientation", /aria-orientation="vertical"/],
    ["aria-label", /aria-label="Resize sidebar"/], ["aria-valuenow", /aria-valuenow=\{width\}/],
    ["aria-valuemin", /aria-valuemin=\{SIDEBAR_MIN_PX\}/], ["aria-valuemax", /aria-valuemax=\{SIDEBAR_MAX_PX\}/],
    ["tabIndex", /tabIndex=\{0\}/], ["setPointerCapture", /setPointerCapture/],
  ]) t(`A: the resizer declares ${attr}`, re.test(rz), true);
  t("A: every key the plan promised is handled — arrows, Home, End, Enter",
    ["ArrowLeft","ArrowRight","Home","End","Enter"].every((k) => rz.includes(`"${k}"`)), true);
  // ENTER GOES TO THE MINIMUM, NOT THE DEFAULT. The obvious binding is the useless one: toggling
  // to 236 hands a keyboard user the width they already had, and the collapse gesture is the one
  // they cannot otherwise reach.
  t("A: Enter toggles against the MINIMUM, which is the collapse gesture",
    /if \(width <= SIDEBAR_MIN_PX\) commit\(lastWide\.current\);/.test(rz), true);
}

/* ================================================================= A. the numbers
 * Pinned from the MEASUREMENT, not read back out of the layout. 68ch resolves against the
 * wrapper's 16px font at 745.9px, so canvas = 745.9 + 48 padding = 794 (rounded up).
 * The contract's 620 was estimated from the 18px prose font and made the threshold wrong
 * by 190px. VERIFY A UNIT BEFORE COMPUTING WITH IT. */
/* ⚠ 1378 -> 1058: THE INSPECTOR TERM LEFT BLOG'S SUM TOO, one PR after it left the case study's.
 * #283 kept 320 here because blog's inspector was fixed; that did not survive measurement — two
 * fields are clipped at 320 and the pane needs to widen. `inspector-width.ts` carries the
 * correction in full. Both editors now add the live width, so the asymmetry is gone. */
t("A: PANES_SUM is 1058 — list + measure, WITHOUT the sidebar or the inspector", PANES_SUM, 1058);
t("A: the arithmetic reproduces it", 264 + BLOG_CANVAS_MIN_PX, PANES_SUM);
t("A: INSPECTOR_FOLD_PX is 1100", INSPECTOR_FOLD_PX, 1100);
t("A: the fold is below the fit threshold at every legal sidebar width",
  INSPECTOR_FOLD_PX < SIDEBAR_MIN_PX + PANES_SUM, true);
// The 1536-wide laptop this is authored on is BELOW the threshold, which is the fact that
// makes the collapse control load-bearing rather than a refinement. If someone "rounds"
// the threshold down to 1536 or lower, that stops being true and this fails.
// ⚠ THIS COMPARED A VIEWPORT LITERAL TO A PAGE-SPACE CONSTANT AND PASSED FOR THE WRONG REASON.
// #235 moved every threshold into page space — `documentElement`'s box, gutter excluded — and
// this line kept saying 1536, which is a VIEWPORT. It stayed true (1521 < 1614 as well as
// 1536 < 1614), so nothing failed, which is exactly the shape this arc has spent eight PRs
// finding: a gate that is right by luck of margin. Restated in page space, and now reactive.
const LAPTOP_PAGE = 1521; // a 1536 viewport minus the reserved scrollbar gutter, measured
// THE INSPECTOR IS ADDED BACK AT ITS DEFAULT, because this is about the laptop as it ships — an
// author who has not touched the handle. The verdict is unchanged, which is the point.
t("A: the 1536 laptop does NOT fit blog's three panes at ANY legal sidebar width",
  LAPTOP_PAGE < SIDEBAR_MIN_PX + PANES_SUM + INSPECTOR_FALLBACK, true);

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
t("C: three-pane.ts declares 1378 exactly once", (home.match(/\b1378\b/g) ?? []).length, 0);
t("C: …and 1058 is not spelled either — the terms are the declaration",
  (home.match(/\b1058\b/g) ?? []).length, 0);
// PANES_SUM is written as its TERMS (264 + 794 + 320), never as a total — so there is no total
// to duplicate. The strongest form of "declared once" is "not spelled at all".
t("C: …because the blog pane sum is written as its terms, not as a total",
  /export const PANES_SUM = 264 \+ BLOG_CANVAS_MIN_PX;/.test(home), true);
// 794 is now NAMED, because InspectorResizer needs it: the drag's runtime ceiling is "whatever the
// canvas can give up", and each surface passes its own floor.
t("C: …and blog's canvas floor is declared once, as the measure plus its padding",
  /export const BLOG_CANVAS_MIN_PX = 794;/.test(home), true);
t("C: three-pane.ts declares 1100 exactly once", (home.match(/\b1100\b/g) ?? []).length, 1);
// The case-study numbers get the same discipline from the start rather than after a second
// copy appears. They have no consumers yet — PR 7 adds those — so this is the cheap moment.
// THE INSPECTOR TERM IS GONE FROM BOTH — it is a runtime value now, added by the caller. Blog's
// PANES_SUM above still spells 320 and still should: that pane is fixed.
t("C: the case-study pane sum is its terms too, with the canvas floor DERIVED",
  /export const CS_PANES_SUM = 264 \+ CS_CANVAS_MIN_PX;/.test(home), true);
t("C: and the collapsed sum, likewise",
  /export const CS_COLLAPSED_PANES_SUM = 27 \+ CS_CANVAS_MIN_PX;/.test(home), true);
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
t("D: the blog host adds the LIVE sidebar width AND the live inspector width to its pane sum",
  /PANES_SUM/.test(host) && /fitThresholdPx=\{sidebarPx \+ PANES_SUM \+ ins\.width\}/.test(host), true);
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
// ⚠ THE TOKEN, NOT THE SUBSTRING, AND THIS IS A LATENT DEFECT FOUND IN PASSING RATHER THAN A
// RE-ANCHOR. The check read `\bhidden\b`, and a `-` is a word boundary, so `overflow-hidden` on
// the aside matched — an assertion about `display: none` failing on a rule about OVERFLOW. The
// save-bar PR briefly gave the aside `overflow-hidden` while trying a docked bar there, which is
// how it surfaced; that experiment was reverted and the aside is unchanged, so NOTHING IN THAT
// PR'"'"'S DIFF WOULD HAVE TRIPPED THIS. The defect is real anyway and fires for the next person who
// adds any `overflow-*` utility, so the fix stays. The pair below is what proves it still sees a
// real one — a check loosened until it passes is how a gate stops guarding anything.
const asideCls = (src) => /<aside[^>]*className="([^"]*)"/.exec(src)?.[1] ?? "";
const hasHiddenUtility = (src) => asideCls(src).split(/\s+/).includes("hidden");
t("E: the shell's aside carries no `hidden` utility", hasHiddenUtility(shell), false);
t("E: …and the check can still SEE a real one — the regex it replaces matched `overflow-hidden`",
  hasHiddenUtility('<aside className="hidden w-[320px]">'), true);
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
// PINNED ON THE WIDTH, NOT ON WHAT FOLLOWS IT. This read `w-[320px] flex-none`, so it failed the
// moment the aside gained `flex flex-col` — a change about LAYOUT breaking an assertion about
// WIDTH. Surfaced the same way as the note above, by a reverted experiment, and kept for the same
// reason: the brittleness is real and the next layout utility on that element trips it. Same
// defect studio-ink'"'"'s E6 was re-anchored for. There is exactly one aside in the shell, so matching
// anywhere in its class list is no less specific.
/* ⚠ RE-ANCHORED ON THE CUSTOM PROPERTY'S FALLBACK, AND THE SPLIT IS THE POINT.
 * The case-study inspector now drags and collapses, so its width is a cookie rather than a class
 * literal. Blog's does NOT — that pane is fixed, because its canvas is a fixed measure and every
 * pixel the inspector gives or takes is margin (see `inspector-width.ts`). So the aside reads
 * `w-[var(--studio-inspector-w,320px)]`: the case study declares the property, blog never does
 * and resolves to the fallback.
 * THAT FALLBACK IS STILL A REAL SOURCE OF TRUTH FOR BLOG, so every blog assertion below keeps
 * reading 320 and keeps its meaning. Only the two CASE-STUDY sums changed shape, because only
 * they became runtime. A gate rewritten wholesale under pressure stops guarding; this splits on
 * the property that actually moved. */
const INSPECTOR_PX = widthFrom(/w-\[var\(--studio-inspector-w,(\d+)px\)\]/, "inspector");
const sectionsSrc = code("components/studio/SectionsEditPanel.tsx");

t("H: the list pane is 264px", LIST_PX, 264);
t("H: the inspector pane is 320px", INSPECTOR_PX, 320);
// THE COUPLING, MACHINE-CHECKED. The sidebar is DERIVED now (see Part A) and 794 is the canvas
// (68ch + 48px of padding), which is measured elsewhere and is not this file's to move.
t("H: sidebar + list + canvas IS the fit threshold, and the inspector is NOT in it",
  LIST_PX + BLOG_CANVAS_MIN_PX, PANES_SUM);
// ASSERTED AS AN ABSENCE too, the stronger half: a term that must not be baked in cannot be proved
// gone by adding it up.
t("H: …and blog's sum no longer spells the inspector's width either",
  /PANES_SUM = 264 \+ BLOG_CANVAS_MIN_PX;/.test(home), true);
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
/* ⚠ 1224 -> 904: THE INSPECTOR TERM LEFT, exactly as the sidebar term left in #237. The pane is
 * adjustable now, so a constant naming one of its widths would read as authoritative and be wrong
 * everywhere except the default. The caller adds the live width. */
t("I: CS_PANES_SUM is 904 — the two FIXED panes, without the sidebar or the inspector", CS_PANES_SUM, 904);
t("I: sidebar + list + canvas-floor IS the case-study threshold, and the inspector is NOT in it",
  LIST_PX + CS_CANVAS_MIN_PX, CS_PANES_SUM);
// ASSERTED AS AN ABSENCE, the stronger half: a term that must not be baked in cannot be proved
// gone by adding it up. `three-pane.ts` writes its sums as TERMS, so this reads them.
t("I: …and neither case-study sum still spells the inspector's width",
  /CS_PANES_SUM = 264 \+ CS_CANVAS_MIN_PX;/.test(home)
    && /CS_COLLAPSED_PANES_SUM = 27 \+ CS_CANVAS_MIN_PX;/.test(home), true);
// The host must ADD it back, or the threshold silently under-counts by a whole pane.
t("I: …and the case-study host adds the live inspector width to both",
  /fitThresholdPx=\{sidebarPx \+ CS_PANES_SUM \+ ins\.width\}/.test(sectionsSrc)
    && /sidebarPx \+ CS_COLLAPSED_PANES_SUM \+ Math\.max\(ins\.width, INSPECTOR_BOUNDS\.cs\.min\)/.test(sectionsSrc), true);
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
t("I: CS_COLLAPSED_PANES_SUM is 667", CS_COLLAPSED_PANES_SUM, 667);
t("I: the collapsed arithmetic uses the shell's OWN reopen-rail width AND the collapsed pane's residual border",
  COLLAPSED_LIST_PX + RAIL_PX + CS_CANVAS_MIN_PX, CS_COLLAPSED_PANES_SUM);
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
  CS_PANES_SUM - LIST_PX, CS_CANVAS_MIN_PX);
t("I: …and blog's threshold is the same shape of sum",
  PANES_SUM - LIST_PX, BLOG_CANVAS_MIN_PX);
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
  (CS_COLLAPSED_PANES_SUM - LIST_PX - INSPECTOR_PX) / CS_CANVAS_WIDTH_PX < CS_MIN_SCALE, true);
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
  t("I: the case-study editor adds the LIVE sidebar width to ITS pane sum, not blog's",
    /fitThresholdPx=\{sidebarPx \+ CS_PANES_SUM \+ ins\.width\}/.test(host), true);
  t("I: …and names its list 'sections' at the call site", /listNoun="sections"/.test(host), true);
  /* ⚠ AND THE FOLD TAKES `Math.max(width, MIN)`, NOT THE LIVE WIDTH, WHICH IS THE ONE PLACE THE
   * TWO THRESHOLDS DIFFER. The fold asks "IF the inspector were shown, would three panes fit?" —
   * feeding it a collapsed 0 answers a different question and would report that three panes fit
   * on a page where expanding immediately drops the canvas under CS_MIN_SCALE, with nothing
   * failing. Evaluating at the minimum errs toward folding: it over-collapses and never lies. */
  t("I: …and folds its inspector at its own derived sum rather than blog's chosen 1100",
    /usePageWidthMin\(\s*sidebarPx \+ CS_COLLAPSED_PANES_SUM \+ Math\.max\(ins\.width, INSPECTOR_BOUNDS\.cs\.min\),?\s*\)/.test(host), true);
  // On CODE, not the raw file — the comment at :729 names 1100 to say why it is NOT used, and a
  // check that punishes explaining a decision teaches people to stop explaining decisions.
  t("I: the case-study editor declares no literal breakpoint of its own — the constants are the only source",
    /\b(1460|1223|1614|1100)\b/.test(code("components/studio/SectionsEditPanel.tsx")), false);
}

// NOT REAL OPTIONS FOR THREE PANES — recorded so nobody re-derives them and proposes one.
t("I: 75% would need 1780px and 100% would need 2100px — neither is a laptop viewport",
  [SIDEBAR_DEFAULT_PX + LIST_PX + Math.round(1280 * 0.75) + INSPECTOR_PX,
   SIDEBAR_DEFAULT_PX + LIST_PX + 1280 + INSPECTOR_PX],
  [1780, 2100]);
// Counterintuitive and worth pinning: the case-study canvas is WIDER than blog's, yet its
// threshold is LOWER — because it scales and blog's does not. A reader who assumes the bigger
// canvas needs the bigger viewport has the model backwards.
t("I: the case-study threshold is BELOW blog's, because the canvas scales and blog's does not",
  CS_PANES_SUM < PANES_SUM, true);
// And the 1536 laptop that cannot fit blog's three panes CAN fit the case study's.
/* THE REFERENCE MACHINE ACROSS THE WHOLE CLAMP — the E table, pinned. This is the assertion the
 * upper bound exists for: at the WIDEST legal sidebar the 1536 laptop must still fit three
 * case-study panes, and at the narrowest it must have room to spare. */
// AT THE SHIPPED DEFAULT on both, for the reason given at the first of these.
t("I: the 1536 laptop fits three case-study panes at EVERY legal sidebar width, and never blog's",
  [LAPTOP_PAGE >= SIDEBAR_MAX_PX + CS_PANES_SUM + INSPECTOR_FALLBACK,
   LAPTOP_PAGE >= SIDEBAR_MIN_PX + CS_PANES_SUM + INSPECTOR_FALLBACK,
   LAPTOP_PAGE >= SIDEBAR_MIN_PX + PANES_SUM + INSPECTOR_FALLBACK], [true, true, false]);
// AND THE MARGIN IS SMALL AND DELIBERATE. At the max the canvas is 9px above the point where the
// list would collapse — measured 649px, 0.507, one notch over its 50% floor. The clamp is doing
// something invisible, so the number is stated rather than trusted.
// THE INSPECTOR IS ADDED BACK EXPLICITLY HERE, at its DEFAULT, because this assertion is about the
// reference laptop as it ships — an author who has not touched the handle. The 9px is unchanged,
// which is the point: making the pane adjustable did not move the default geometry by a pixel.
t("I: at the widest sidebar the reference laptop keeps 9px of headroom, and the canvas clears its floor",
  [LAPTOP_PAGE - (SIDEBAR_MAX_PX + CS_PANES_SUM + INSPECTOR_PX),
   (LAPTOP_PAGE - SIDEBAR_MAX_PX - LIST_PX - INSPECTOR_PX) / CS_CANVAS_WIDTH_PX > CS_MIN_SCALE], [9, true]);


/* ---- THE TWO CANVASES ZOOM THE SAME WAY, BY DIFFERENT MEANS -------------------------------
 *
 * Reported by the owner: the blog canvas scaled evenly from its centre while the case-study canvas
 * stayed pinned to its left edge and grew rightward. Both are true statements about the same
 * feature, and the reason they diverged is that only ONE of them drives a box.
 *
 * ⚠ SO THE FIX IS NOT TO MATCH THE `transform-origin`, WHICH IS THE TRAP HERE. Blog drives no
 * width, so `top center` lets its content overflow evenly either side. The case study drives the
 * pane's width to the DRAWN size — that is what gives the transform something to scroll — so
 * `top left` is what keeps the box and the drawn result the same rectangle. Copying `top center`
 * onto it would misalign the two: at 50% the surface draws from 266px while the pane still starts
 * at 0. The box is centred instead, which is a layout fix rather than a transform one.
 */
{
  const cs = code("components/studio/SectionsEditPanel.tsx");
  const blog = code("components/studio/BlogBlocksEditPanel.tsx");

  t("Z1: blog centres by ORIGIN, because it drives no box",
    /transformOrigin: "top center"/.test(blog), true);
  t("Z2: …and drives neither a width nor a height, which is what lets it",
    /setWidth\(|setHeight\(/.test(blog), false);

  t("Z3: the case study keeps `top left`, because its box IS the drawn rectangle",
    /transformOrigin: "top left"/.test(cs), true);
  t("Z4: …and it drives that box from the scale",
    /setWidth\(CANVAS_WIDTH \* next\)/.test(cs), true);
  /* ⚠ THE ACTUAL DEFECT. A block with an explicit width and no auto margin sits at its parent's
   * left edge, so every zoom step added its growth on the right. */
  t("Z5: …so the PANE is centred with an auto margin, which is what makes the zoom symmetric",
    /className="case-study canvas-static mx-auto /.test(cs), true);
  t("Z6: …and the case study did NOT copy blog's origin, which would misalign box from content",
    /transformOrigin: "top center"/.test(cs), false);
}

console.log(`\nthree-pane result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
