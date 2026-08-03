// Drag-to-pan on the case-study canvas.
// Run: node --experimental-strip-types ralph/tests/canvas-pan.mjs
//
// ⚠ WHY THE LOGIC IS A PURE LEAF. A pan needs a real pointer on an owner-gated page, so the browser
// path cannot be driven from a gate at all. The decisions and the arithmetic are therefore split
// into `lib/studio/canvas-pan.ts` and asserted directly — the same split `bar-clearance.ts` and
// `publish-preview.ts` made, and both earned it, because the arithmetic was the half that was wrong.
//
// ⚠ WHAT THIS SUITE CANNOT SEE, STATED RATHER THAN IMPLIED. It cannot confirm that a drag tracks
// the cursor on screen, that Space types a space in a field, or that the caret still lands where it
// is clicked. Those need a login. #211 established that reporting NOT MEASURED beats claiming a
// pass never performed, and #252's end-to-end upload is on record as unverified for the same
// reason. They are named in the PR as the owner's to drive.
import { readFileSync } from "node:fs";
import {
  shouldPan,
  panScroll,
  nextLatch,
  shouldSwallowSpace,
} from "../../lib/studio/canvas-pan.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const code = (p) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

/* ── A · WHEN A DRAG BECOMES A PAN ─────────────────────────────────────────────────────────── */

/* ⚠ THE WHOLE SAFETY ARGUMENT IS THIS ONE ROW: a pointerdown on text never pans. Not "usually
 * does not" — never, because the gesture is defined by where it STARTS. */
t("A1: a drag starting on an editable field does NOT pan — it selects text, as it always did",
  shouldPan({ editableTarget: true, spaceHeld: false, button: 0 }), false);
t("A2: a drag starting on background DOES pan",
  shouldPan({ editableTarget: false, spaceHeld: false, button: 0 }), true);
/* Space is the override, so it must WIN over the editable target — that is its only purpose. */
t("A3: Space held pans even over a field, which is the override's entire job",
  shouldPan({ editableTarget: true, spaceHeld: true, button: 0 }), true);
/* Middle and right keep their own meanings — autoscroll and the context menu. */
t("A4: only the primary button pans, so middle-click autoscroll and right-click survive",
  [1, 2].map((button) => shouldPan({ editableTarget: false, spaceHeld: false, button })), [false, false]);

/* ── B · THE ARITHMETIC ────────────────────────────────────────────────────────────────────── */

const ORIGIN = { x: 500, y: 300, left: 200, top: 100 };
/* ⚠ THE SIGN IS THE THING. The canvas follows the hand: dragging RIGHT moves content right, which
 * means scrollLeft DECREASES. Inverted, the canvas runs away from the cursor — which reads as a
 * broken gesture rather than a reversed one, so it is worth an assertion rather than a comment. */
t("B1: dragging right scrolls LEFT — the canvas follows the hand",
  panScroll(ORIGIN, { x: 560, y: 300 }), { left: 140, top: 100 });
t("B2: dragging down scrolls UP, same reason",
  panScroll(ORIGIN, { x: 500, y: 360 }), { left: 200, top: 40 });
t("B3: no movement is no scroll", panScroll(ORIGIN, { x: 500, y: 300 }), { left: 200, top: 100 });
t("B4: …and both axes move together on a diagonal",
  panScroll(ORIGIN, { x: 450, y: 250 }), { left: 250, top: 150 });

/* ── C · THE SPACE LATCH — THE TRANSITIONS, NOT THE RESTING CASES ──────────────────────────── */

/* ⚠ A LATCH CORRECT IN BOTH RESTING STATES AND WRONG IN A TRANSITION IS THE SHAPE #248 AND #249
 * KEPT PRODUCING, so the three that would ship broken are asserted first and by name. */

t("C1: Space outside a field arms it", nextLatch(false, { type: "space-down", focusInEditable: false }), true);
/* Inside a field Space is a CHARACTER. Arming here would pan while the author types. */
t("C2: Space INSIDE a field does not arm — there it is a character",
  nextLatch(false, { type: "space-down", focusInEditable: true }), false);
t("C3: releasing Space disarms", nextLatch(true, { type: "space-up" }), false);

/* ⚠ TRANSITION 1 — Space held while focus MOVES INTO a field. Without this the next keystroke
 * pans instead of typing. */
t("C4: focus arriving in a field disarms MID-HOLD, so the next keystroke types",
  nextLatch(true, { type: "focus-editable" }), false);
/* ⚠ TRANSITION 2 — the same crossing arrived at from the other side: already armed, field focused. */
t("C5: …and it stays disarmed while that field holds focus",
  nextLatch(nextLatch(true, { type: "focus-editable" }), { type: "focus-editable" }), false);
/* ⚠ TRANSITION 3 — the keyup that never arrives. Without this the latch outlives an alt-tab and
 * the next background click pans unexpectedly. */
t("C6: the window losing focus mid-hold disarms — that keyup is never coming",
  nextLatch(true, { type: "window-blur" }), false);

/* And the swallow is separate from the arm, because getting them confused eats the author's
 * spacebar — a defect that reads as a broken keyboard rather than a broken pan. */
t("C7: the Space keydown is swallowed only when it armed",
  [shouldSwallowSpace({ focusInEditable: false }), shouldSwallowSpace({ focusInEditable: true })],
  [true, false]);

/* ── D · THE `scroll-smooth` RESOLUTION, BOTH HALVES ───────────────────────────────────────── */

{
  const hook = code("components/studio/useCanvasPan.ts");
  /* MEASURED: against `scroll-behavior: smooth`, a direct `scrollLeft = 500` reads back 0 and only
   * reaches 480 after 400ms — the canvas trails the cursor by a third of a second. */
  t("D1: the drag scrolls with a per-call `instant`, so it tracks the cursor",
    /behavior: "instant"/.test(hook), true);
  /* ⚠ AND THIS IS THE HALF ONLY AN ABSENCE ASSERTION CAN CATCH. The obvious alternative — flip
   * `style.scrollBehavior` for the drag's duration — breaks quietly: a drag interrupted by the
   * pointer being released outside the window never restores it, leaving the canvas permanently
   * non-smooth and T0's reveal silently instant. A per-call override has no state to leak. */
  t("D2: …and NOTHING mutates `style.scrollBehavior`, so T0's CSS route is provably untouched",
    /style\.scrollBehavior|scrollBehavior\s*=/.test(hook), false);
  /* T0's own call is the other end of that contract: no behavior key, so the reduced-motion reset
   * wins for free (#198, #258). If this ever gains one, the free story is gone. */
  /* ⚠ ORDER-INDEPENDENT, AND THE FIRST VERSION WAS NOT. It required `behavior` to appear AFTER
   * `top`, so a mutation that put the key FIRST walked straight past it. Every `scrollTo` argument
   * object in the panel is extracted and tested for the key, wherever it sits. */
  const scrollToArgs = [...code("components/studio/SectionsEditPanel.tsx").matchAll(/scrollTo\(\{([^}]*)\}/g)]
    .map((m) => m[1]);
  t("D3: the panel's scrollTo calls were found, so the absence below is not vacuous",
    scrollToArgs.length > 0, true);
  t("D3: …and NONE passes a behavior key, which is what makes reduce free (#198, #258)",
    scrollToArgs.filter((a) => /behavior/.test(a)), []);
}

/* ── E · THE SEAMS ─────────────────────────────────────────────────────────────────────────── */

{
  const panel = code("components/studio/SectionsEditPanel.tsx");
  const hook = code("components/studio/useCanvasPan.ts");
  const leaf = code("lib/studio/canvas-pan.ts");

  t("E1: the pure leaf imports nothing, so it runs in a plain node gate",
    /^\s*import\s/m.test(leaf), false);
  /* ⚠ ONE SCROLLER WALK, NOT TWO. `scrollParent` already encodes which of three arrangements is
   * live and why it tests DECLARED overflow rather than "is it scrolling now" — a distinction that
   * cost a measurement. A second walk in the hook would be a second answer to the same question. */
  t("E2: the panel passes its OWN scrollParent walk in, rather than the hook deriving one",
    /getScroller: \(\) => \(paneRef\.current \? scrollParent\(paneRef\.current\) : null\)/.test(panel), true);
  t("E3: …and the hook contains no walk of its own",
    /overflowY|parentElement/.test(hook), false);
  /* The editable test keys on the marker every field already carries, rather than a class or a
   * tag list that would drift from the fields themselves. */
  t("E4: an editable target is identified by the data attribute every field already carries",
    /\[data-edit-value-path\]/.test(hook), true);
  t("E5: …which is the attribute `inlineEditProps` actually writes",
    /"data-edit-value-path": path/.test(code("components/case-study/editable.ts")), true);
  /* Pointer capture, or a drag released over the inspector never ends and the canvas stays stuck. */
  t("E6: the drag captures the pointer, so releasing outside the pane still ends it",
    /setPointerCapture/.test(hook) && /releasePointerCapture/.test(hook), true);
  t("E7: …and a cancelled pointer ends it too", /onPointerCancel: endDrag/.test(hook), true);
  /* Blog is deliberately NOT wired — see the deferral and its 325px figure in STATE. */
  t("E8: blog's canvas is untouched, which is the recorded scope",
    /useCanvasPan/.test(code("components/studio/BlogBlocksEditPanel.tsx")), false);
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
