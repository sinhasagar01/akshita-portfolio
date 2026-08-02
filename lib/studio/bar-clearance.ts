// How much room a floating control must leave above the save bar.
//
// ---- WHY A PROPERTY RATHER THAN A NUMBER -----------------------------------------------------
//
// The publish pill is `fixed` a short way up from the foot, centred over the work area. (Its
// offset utility is one Tailwind emits a rule for, so it is described rather than named — the
// comment trap catches it otherwise.) Every save bar is
// `sticky bottom-0` inside a pane. So the pill floats in the band the bar occupies and lands ON
// it — measured at 124 × 40px on Site settings, Experience and Skills, where the bar is a
// 1042px detail column and the centred pill is inside it, and again on the case study below its
// fold, where the inspector folds into the canvas and the bar spans the whole work area.
//
// ⚠ HORIZONTAL IS NOT AVAILABLE, WHICH IS WHY THIS IS VERTICAL. Clearing the settings bar
// sideways would mean moving the pill left of x=543 — over the list rail — and the pill is
// centred over the work area by design, a decision `PublishBar` argues for at length. So the pill
// rises instead, and what it rises by is the bar's own height.
//
// ⚠ AND IT IS MEASURED, NOT ASSUMED. A fixed offset would have to clear the TALLEST bar — the
// case study's loaded three-row form at 117px — and would then float the pill 117px up on the
// index pages, which have no bar at all. The bars are 62, 96 and 117 depending on surface and
// width, and the save-bar PR's whole finding was that a number true at one setting of an
// adjustable thing is worse than no number.
//
// ---- ⚠ THE MAXIMUM ACROSS MOUNTED BARS, NOT THE LAST ONE TO WRITE ----------------------------
//
// More than one `SaveBar` is mounted at once on the case study: the details form's and the
// sections form's, one of them inside a `hidden` wrapper. A last-writer-wins property would let
// the hidden one — height 0 — clobber the visible one, and the pill would drop back onto the bar
// with nothing looking wrong. So the registry below keeps every mounted bar and publishes the
// LARGEST height any of them currently reports. A display:none bar measures 0 and contributes
// nothing, which is exactly right.

/** The property the pill reads. Declared once here; `SaveBar` writes it and `PublishBar`'s class
 *  names it. Those are two copies of one string, so `studio-resize` asserts they agree. */
export const BAR_CLEARANCE_VAR = "--studio-bar-clearance";

const mounted = new Set<HTMLElement>();

/** Recompute and publish the tallest visible bar. Exported for the gate, not for consumers. */
export function republishBarClearance(): void {
  let tallest = 0;
  for (const el of mounted) {
    // `offsetParent === null` catches `display:none`, which is how a hidden panel's bar reports
    // itself absent rather than reporting a stale height.
    if (el.offsetParent === null) continue;
    tallest = Math.max(tallest, el.getBoundingClientRect().height);
  }
  document.documentElement.style.setProperty(BAR_CLEARANCE_VAR, `${Math.round(tallest)}px`);
}

/** Register a bar. Returns the unregister, so the caller's effect cleanup is the whole contract. */
export function registerBar(el: HTMLElement): () => void {
  mounted.add(el);
  republishBarClearance();
  return () => {
    mounted.delete(el);
    republishBarClearance();
  };
}
