// The three-pane editor's geometry constants and its pure collapse rule.
//
// WHY THIS IS A LIB MODULE AND NOT PART OF ThreePaneShell. Two reasons.
//
//   1. THE LITERALS LIVE HERE, ONCE EACH. Tailwind cannot interpolate a value into a class
//      name, so the obvious build — a max-width-1538 Tailwind variant beside an exported
//      `FIT_THRESHOLD_PX = 1538` — writes each number TWICE and couples the copies by
//      hand. That is the 236px hazard (#165) reproduced, and comment-enforced coupling is
//      what it already costs us. So the shell reads both widths by MEASURING THE PAGE BOX
//      instead, each number is consumed from the constant, and `ralph/tests/three-pane.mjs`
//      asserts the ABSENCE of a second literal rather than asserting two copies agree.
//      Asserting a duplicate away beats asserting it consistent, and this is the precedent
//      for the next hand-coupled literal.
//
//   2. THE COLLAPSE RULE IS TESTABLE ONLY IF IT IS PURE. `isListCollapsed` is a two-input
//      function with a genuinely non-obvious middle case, and a dependency-free leaf is
//      the only shape `--experimental-strip-types` can load (five occurrences of that
//      constraint now). React state and the page measurement stay in the shell.
//
// ---- EVERY SUM BELOW IS THE **PAGE BOX**, NOT THE VIEWPORT. STATED ONCE, HERE. -----------
//
// `documentElement.getBoundingClientRect().width`, which is what the layout is handed. It is NOT
// `window.innerWidth`: `scrollbar-gutter: stable` on `html` permanently reserves the classic
// scrollbar's width, so the viewport is wider than the page by that amount (15 here, 0 with
// overlay scrollbars, ~17 on Windows).
//
// This distinction cost a real defect. The thresholds were compared against the VIEWPORT through
// `matchMedia`, so at a 1460 viewport the canvas got 625 rather than the 640 the sum promises,
// the raw fit was 0.488, and the scale clamp was covering the difference. **No number here was
// wrong** — they are page-space sums and always were, exact when compared to a page. The hook
// now measures the page box (`usePageWidthMin`), which is why none of them changed. Anyone
// re-deriving one of these must keep it in page space and must NOT add the gutter to it; baking
// one machine's scrollbar width into a shared constant is how it becomes wrong everywhere else.
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
// 236 + 27 (the reopen rail, plus the collapsed pane's 1px residual border) + 794 + 320 = 1377,
// where the old inspector reached 1300. So
// the band in which the inspector is shown but the canvas is under measure is 76px wider
// than it was. INSPECTOR_FOLD_PX stays 1100 because it is a CHOSEN breakpoint rather than a
// derived one — it answers "is the inspector still usable", not "does the canvas still hold
// its measure" — but if that band ever needs closing, raising the fold to 1376 is the change.

/* ---- THE SIDEBAR TERM LEFT THESE SUMS, AND THE COMPOSITE CONSTANTS WENT WITH IT -----------
 *
 * `FIT_THRESHOLD_PX = 1614` was `236 + 264 + 794 + 320`. It was correct for as long as the
 * sidebar was 236px, and the studio now ships a control whose entire purpose is to move off 236.
 * **A constant true at exactly one setting of an adjustable thing is worse than no constant**:
 * it reads as authoritative and is wrong everywhere except the default. So the composites are
 * DELETED rather than kept "for documentation" — leaving one would have the next reader believe
 * a number nothing produces. Third deletion of this shape, after `FIT_THRESHOLD_PX` shipping
 * with zero consumers and the 2xl radius token sitting below the xl one.
 *
 * WHAT REPLACES THEM IS THE PART THAT WAS ALWAYS CONSTANT. The panes have fixed widths; the
 * sidebar does not. So the sum stops at the panes and the caller adds the live width:
 *
 *     const fits = usePageWidthMin(sidebarPx + PANES_SUM);
 *
 * This is hazard 1's arithmetic half closing. The sidebar was a literal in three thresholds and
 * is now a runtime value in none of them. */

/** List + canvas measure + inspector. The blog editor's three panes at their natural sizes,
 *  WITHOUT the sidebar — add the live sidebar width to get the fit threshold. */
export const PANES_SUM = 264 + 794 + 320;

/** Below this the inspector pane folds away and the canvas pane's own Canvas/Inspector
 *  toggle becomes the route to those fields. One mechanism at two widths, and the narrow
 *  layout is the one that already shipped in #174.
 *
 *  THE ONE THRESHOLD THAT STAYS A WHOLE NUMBER, because it is CHOSEN rather than summed. It
 *  answers "is the inspector still usable", and the inspector is 320px at every sidebar width.
 *  Hazard 1 listed it as coupled-but-soft: its MEANING drifts when the sidebar moves (the page
 *  it is measured against holds less work area) even though no arithmetic breaks. Left chosen,
 *  and left whole, rather than manufacturing a sum for it. */
export const INSPECTOR_FOLD_PX = 1100;

/* ============================================================================================
 * THE CASE-STUDY THRESHOLD — A DIFFERENT SHAPE OF CONSTANT, NOT A DIFFERENT VALUE
 *
 * PANES_SUM above is derived from a canvas that has a NATURAL MINIMUM WIDTH: blog's
 * 68ch measure is a property of the text, so the pane must be at least 794px or the measure
 * breaks. THE CASE-STUDY CANVAS HAS NO SUCH MINIMUM. It renders at the public content width
 * (1280, `container-x`'s cap) and SCALES to fit the pane, deliberately — the site's breakpoints
 * key off the WINDOW, so squeezing the pane produced a layout that looked nothing like the page.
 *
 * SO SUBSTITUTING THE TERM IS THE TRAP, and it is the same trap that produced the 190px error
 * recorded above. 236 + 264 + 1280 + 320 = 2100px, a threshold most laptops never reach, and it
 * would be answering a question the scaled canvas does not ask. What has to be derived is a
 * MINIMUM LEGIBLE SCALE, and from that a pane width, and only then a threshold.
 *
 * THE FLOOR IS 50%, AND IT IS A ROLE DECISION RATHER THAN A LEGIBILITY ONE.
 * THE CANVAS IS FOR SHAPE; THE INSPECTOR IS FOR WORDS. A case-study author writes every field
 * in the inspector. What the canvas uniquely shows is COMPOSITION — device width, rotation,
 * translate, stacking, glow, the whole surface of the Style tab. Those are spatial properties no
 * number field can convey. Body-text readability is not the canvas's job, so it is not what the
 * floor protects. (The fifth by-role answer in this arc, after the section headers, the listbox,
 * the three-pane split and Skills' footer.)
 *
 * MEASURED at 50% on a real dense section (`elevate-one-view`, the featureRows tour — not the
 * hero, which is mostly large type, and not boat-crest, which is hand-built with no sections at
 * all, hazard 28). Natural sizes in the 1280 space are heading 49.7 / row title 21 / body 16 /
 * eyebrow 12, and a 248px device. At 50% those render 24.9 / 10.5 / 8.0 / 6.0 and a 124px
 * device: layout, rhythm, image identity and row titles all survive; body text and small labels
 * do not, and are read in the inspector instead.
 *
 * WHY NOT 60%: it needs 1588px, so a 13-inch laptop cannot show three panes and the rail
 * collapses there anyway. It buys 9.6px prose the author reads in the inspector.
 * WHY NOT 40%: the row title drops to 8.4px and image identity degrades to "type of screen".
 * Its real gain — the whole section in one view — is the BOARD's job, and the Board exists.
 * NOT REAL OPTIONS FOR THREE PANES, recorded so nobody re-derives them: 75% needs 1780px and
 * 100% needs 2100px. Neither is a laptop viewport.
 *
 * AND 50% IS AN IMPROVEMENT ON WHAT SHIPS. Measured today at a 1138px window, the current
 * single-column editor renders the canvas at scale(0.383) — below every floor considered. The
 * threshold is not a compromise against today; it is a floor today does not have.
 * ========================================================================================== */

/** The width the case-study canvas RENDERS at before scaling — `container-x`'s max-width, i.e.
 *  the public content width. Must equal `CANVAS_WIDTH` in SectionsEditPanel, which is the
 *  module-private constant the canvas actually uses; the gate asserts the two agree, because two
 *  copies of one measurement is how #194's threshold and pane widths drifted with every gate
 *  green. */
export const CS_CANVAS_WIDTH_PX = 1280;

/** The minimum legible scale for the case-study canvas — the owner's decision, see above. */
export const CS_MIN_SCALE = 0.5;

/** The canvas pane's floor: the scale applied to the render width. 1280 × 0.5 = 640. */
export const CS_CANVAS_MIN_PX = CS_CANVAS_WIDTH_PX * CS_MIN_SCALE;

/** List + canvas floor + inspector. The case-study editor's three panes, WITHOUT the sidebar.
 *  264 + 640 + 320 = 1224; add the live sidebar width for the fit threshold.
 *  THE SAME DISCIPLINE AS BEFORE: the threshold IS the sum, so widening any pane — or lowering
 *  the scale floor — is an ARITHMETIC CHANGE, NOT A STYLING CHANGE, and this number moves with
 *  it. Only the sidebar term left, because only the sidebar became adjustable. */
export const CS_PANES_SUM = 264 + CS_CANVAS_MIN_PX + 320;

/** The collapsed-list pane sum: reopen rail + the collapsed pane's residual border + canvas
 *  floor + inspector = 27 + 640 + 320 = 987. Add the live sidebar width for the fold threshold.
 *  Below it the canvas drops under its minimum scale even with the list collapsed, and the
 *  inspector fold is the only lever left.
 *
 *  THE 27 IS 26 + 1 AND THE 1 WAS MISSING UNTIL IT WAS DRIVEN. The reopen rail is 26px, but a
 *  COLLAPSED list pane is not 0px — it is `w-0 border-transparent`, and a transparent border
 *  still occupies its 1px (the border-color is what animates, so it cannot be removed without
 *  losing the transition). Measured at page 1222 before the fix: 236 + 1 + 26 + 639 + 320. The
 *  canvas came out 639 rather than 640, raw fit 0.499, and the scale clamp was covering that
 *  last pixel — precisely the shape this constant exists to make unnecessary. Corrected by
 *  RE-DERIVING the term, not by padding the total.
 *
 *  DERIVED AND CONFIRMED RATHER THAN ASSUMED: collapsing the list returns 264 − 27 = 237px to
 *  the canvas, so at the fit threshold the collapsed canvas is 640 + 237 = 877px, which is
 *  877 / 1280 = 68.5% — comfortably above the 50% floor. Across the whole band between the two
 *  thresholds the collapsed canvas runs 640…877px, i.e. 50%…68.5%, so the rail collapsing never
 *  takes the canvas below the floor. That is the property this constant exists to state. */
export const CS_COLLAPSED_PANES_SUM = 27 + CS_CANVAS_MIN_PX + 320;

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
 *  @param fits   whether the page box is at or above `sidebarPx + PANES_SUM`
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
