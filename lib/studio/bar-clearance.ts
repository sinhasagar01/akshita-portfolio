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
// ---- ⚠ THE TOPMOST EDGE, NOT THE TALLEST PARTICIPANT -----------------------------------------
//
// This started as "the tallest of the mounted bars", which is right when only one can be visible
// — the case study mounts the details form's bar and the sections form's, one inside a `hidden`
// wrapper, and a last-writer-wins property would let the hidden one at height 0 clobber the
// visible one.
//
// ⚠ IT IS WRONG THE MOMENT TWO PARTICIPANTS STACK, AND TWO DO. The Selected rail sits at the
// canvas foot and the save bar docks BELOW it when the inspector is collapsed. Taking the maximum
// published 62 — the bar alone — so the pill rose just enough to clear the bar and landed squarely
// inside the rail: measured 60 × 293px, with the rail spanning 724…838 and the pill 758…818.
// Summing the two would be wrong as well, because participants in DIFFERENT panes do not stack.
//
// SO IT ASKS THE ONLY QUESTION THAT IS ACTUALLY BEING ASKED: how far up the viewport does the
// docked furniture reach? That is `innerHeight - min(top)`, and it needs to know nothing about
// which pane anything is in. Stacked participants give the higher top and are covered; mutually
// exclusive ones give one top; a `display:none` participant reports no box and is skipped.

/** A participant is anything docked at the foot of a pane that a floating control must clear —
 *  a save bar, the Selected rail. Registered rather than enumerated, so a new one joins by
 *  existing rather than by being added to a list here. */

/** The property the pill reads. Declared once here; `SaveBar` writes it and `PublishBar`'s class
 *  names it. Those are two copies of one string, so `studio-resize` asserts they agree. */
export const BAR_CLEARANCE_VAR = "--studio-bar-clearance";

const mounted = new Set<HTMLElement>();

/**
 * How far up the viewport the docked furniture reaches, from the boxes alone.
 *
 * ⚠ SPLIT OUT AS A PURE FUNCTION BECAUSE THE BROWSER PATH CANNOT BE DRIVEN FROM A TEST. Opening
 * the Selected rail needs a click that selects a canvas field, and the harness cannot deliver it;
 * injecting a style instead does not work either, because a `ResizeObserver` created outside the
 * page never fires. So the arithmetic — which is the part that was WRONG, taking a maximum where
 * a stack needed the topmost edge — is separated from the DOM reading and asserted directly, with
 * the rail-above-bar case among the inputs. What is left in `republishBarClearance` is one
 * `getBoundingClientRect` loop and a property write.
 *
 * A zero-height box is skipped rather than counted: `max-h-0` is how the rail hides, and its top
 * would otherwise sit at the very foot and publish a clearance of nothing.
 */
export function clearanceFrom(
  boxes: readonly { top: number; height: number }[],
  viewportHeight: number,
): number {
  let highest = viewportHeight;
  for (const b of boxes) {
    if (b.height <= 0) continue;
    highest = Math.min(highest, b.top);
  }
  return Math.max(0, Math.round(viewportHeight - highest));
}

/** Recompute and publish the clearance. Exported for the gate, not for consumers. */
export function republishBarClearance(): void {
  const boxes: { top: number; height: number }[] = [];
  for (const el of mounted) {
    // `offsetParent === null` catches `display:none`, which is how a hidden panel's bar reports
    // itself absent rather than reporting a stale box.
    if (el.offsetParent === null) continue;
    const { top, height } = el.getBoundingClientRect();
    boxes.push({ top, height });
  }
  const clearance = clearanceFrom(boxes, window.innerHeight);
  document.documentElement.style.setProperty(BAR_CLEARANCE_VAR, `${clearance}px`);
}

/** Register a participant. Returns the unregister, so the caller's effect cleanup is the whole
 *  contract. */
export function registerBar(el: HTMLElement): () => void {
  mounted.add(el);
  republishBarClearance();
  return () => {
    mounted.delete(el);
    republishBarClearance();
  };
}
