// The three-pane editor's geometry constants and its pure collapse rule.
//
// WHY THIS IS A LIB MODULE AND NOT PART OF ThreePaneShell. Two reasons.
//
//   1. THE LITERALS LIVE HERE, ONCE EACH. Tailwind cannot interpolate a value into a class
//      name, so the obvious build — a max-width-1538 Tailwind variant beside an exported
//      `FIT_THRESHOLD_PX = 1538` — writes each number TWICE and couples the copies by
//      hand. That is the 236px hazard (#165) reproduced, and comment-enforced coupling is
//      what it already costs us. So the shell reads both widths through `matchMedia`
//      instead, each number is consumed from the constant, and `ralph/tests/three-pane.mjs`
//      asserts the ABSENCE of a second literal rather than asserting two copies agree.
//      Asserting a duplicate away beats asserting it consistent, and this is the precedent
//      for the next hand-coupled literal.
//
//   2. THE COLLAPSE RULE IS TESTABLE ONLY IF IT IS PURE. `isListCollapsed` is a two-input
//      function with a genuinely non-obvious middle case, and a dependency-free leaf is
//      the only shape `--experimental-strip-types` can load (five occurrences of that
//      constraint now). React state and `matchMedia` stay in the shell.
//
// THE ARITHMETIC. Measured, not derived:
//   sidebar 236 + list 264 + canvas 794 + inspector 320 = 1614px minimum.
// The canvas term is 68ch plus 48px of horizontal padding. 68ch resolves against the
// WRAPPER's 16px font, not the 18px prose font, so it is 745.9px. The design contract
// estimated it from the prose font, got 620, and computed a 1406 threshold that was wrong
// by 190px. Below the threshold the list starts collapsed and the reopen rail is the way
// back.
//
// THE INSPECTOR WIDENED 244 -> 320 AND THIS NUMBER HAD TO MOVE WITH IT, 1538 -> 1614. The
// two are one measurement, not two settings: the threshold IS the sum, so widening the pane
// without raising it would leave 1538..1613 claiming all three panes fit while the canvas
// actually got 718px — under the 794 it needs, which silently drops the canvas column below
// its 697.9296875 public measure. That measure is the property the whole editor exists to
// hold, and nothing would have failed. WIDENING A PANE IS AN ARITHMETIC CHANGE, NOT A
// STYLING CHANGE.
//
// THE COLLAPSED-LIST FLOOR MOVED TOO, and it is worth knowing even though nothing reads it.
// With the list collapsed the canvas keeps its full measure down to
// 236 + 26 (the reopen rail) + 794 + 320 = 1376, where the old inspector reached 1300. So
// the band in which the inspector is shown but the canvas is under measure is 76px wider
// than it was. INSPECTOR_FOLD_PX stays 1100 because it is a CHOSEN breakpoint rather than a
// derived one — it answers "is the inspector still usable", not "does the canvas still hold
// its measure" — but if that band ever needs closing, raising the fold to 1376 is the change.

/** The width at or above which all three panes fit at their natural sizes. */
export const FIT_THRESHOLD_PX = 1614;

/** Below this the inspector pane folds away and the canvas pane's own Canvas/Inspector
 *  toggle becomes the route to those fields. One mechanism at two widths, and the narrow
 *  layout is the one that already shipped in #174. */
export const INSPECTOR_FOLD_PX = 1100;

/** The list pane's THREE-STATE intent.
 *
 *  Not a boolean, and that is the whole point. `"default"` means the author has expressed
 *  no preference, so the width decides — open when the panes fit, collapsed when they do
 *  not. `"open"` and `"closed"` are explicit and hold at EVERY width, because an author
 *  who reopened the list on a narrow screen did so knowing it was narrow, and a layout
 *  that reverses that on the next render is a layout that argues with them.
 *
 *  A boolean cannot express this. `open: true` cannot distinguish "nobody has chosen" from
 *  "the author chose open", so a narrow viewport would either override a real choice or
 *  fail to collapse by default. The design contract encodes the same three states as a
 *  base rule plus `.collapsed` and `.expanded` override classes. */
export type ListIntent = "default" | "open" | "closed";

/** Is the list pane collapsed right now?
 *
 *  @param intent what the author has asked for, if anything
 *  @param fits   whether the viewport is at or above FIT_THRESHOLD_PX
 *
 *  The shell drives BOTH the width transition and `inert` from this one answer. They must
 *  not be computed separately: a pane that is visually collapsed but still tabbable is
 *  #177's invisible-nav-label finding in mirror form, and it is the failure G3 exists to
 *  catch. One function, one truth, two consumers. */
export function isListCollapsed(intent: ListIntent, fits: boolean): boolean {
  if (intent === "closed") return true;
  if (intent === "open") return false;
  return !fits;
}
