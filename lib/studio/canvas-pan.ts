// Drag-to-pan for the case-study canvas — the parts a gate can reach.
//
// ---- ⚠ WHY THE GESTURE IS "DRAG THE BACKGROUND" -----------------------------------------------
//
// The canvas is an EDITOR. Click already places a caret (#287 proved that works under transform,
// 180 samples) and click-drag already selects text, so a plain drag-to-pan destroys both. This
// gesture never competes with text BECAUSE IT NEVER STARTS ON TEXT — a property, not a heuristic
// that usually works.
//
// It is viable because of a measurement rather than a hope: across the whole flagship, in 62
// windows each the size of what 150% shows, **the densest window is still 74% non-editable
// background**; the 10th percentile is 78% and no window falls under 30%. Space+drag exists for
// the case where the cursor IS over a field.
//
// ---- ⚠ AND THE MEASUREMENT'S FIRST INSTRUMENT WAS WRONG ---------------------------------------
//
// A crude `elementFromPoint` + own-text-node classifier mis-classified a real paragraph as
// background — biasing the result TOWARD the answer that favoured this design. The figures above
// come from `caretRangeFromPoint` PLUS a check that the point falls inside the text node's own
// painted rect, because `caretRangeFromPoint` alone snaps to the nearest text and would read
// padding as text. Validated in both directions before use. The corrected instrument returned a
// HIGHER background figure than the crude one, which is the tell that it was measuring rather than
// agreeing: a convenient instrument usually gets more convenient, not less.
//
// ---- ⚠ THIS FILE IS PURE, AND IMPORTS NOTHING -------------------------------------------------
//
// The browser path cannot be driven from a gate — a pan needs a real pointer on an owner-gated
// page. So the classification and the arithmetic live here and are asserted directly, exactly as
// `bar-clearance.ts` split `clearanceFrom` and `publish-preview.ts` split its line extraction.
// Both splits earned it: the arithmetic was the half that was wrong.

/** Primary button. A pan is a left-drag; middle and right keep their own meanings. */
const PRIMARY = 0;

/**
 * Whether a pointerdown begins a pan.
 *
 * ⚠ `spaceHeld` WINS OVER `editableTarget`, and that ordering is the whole point of the override:
 * it exists precisely for the case where the cursor is over a field.
 */
export function shouldPan(opts: {
  /** The pointerdown landed on (or inside) an inline-editable field. */
  editableTarget: boolean;
  /** The Space latch is armed — see `nextLatch`. */
  spaceHeld: boolean;
  /** `PointerEvent.button`. */
  button: number;
}): boolean {
  if (opts.button !== PRIMARY) return false;
  if (opts.spaceHeld) return true;
  return !opts.editableTarget;
}

export type PanOrigin = {
  /** Pointer position when the drag began. */
  x: number;
  y: number;
  /** The scroller's position when the drag began. */
  left: number;
  top: number;
};

/**
 * Where the scroller should be, given where the pointer now is.
 *
 * ⚠ THE SIGN IS INVERTED BECAUSE THE CANVAS FOLLOWS THE HAND. Dragging right moves the content
 * right, which means scrolling LEFT — `scrollLeft` decreases. Getting this backwards produces a
 * canvas that runs away from the cursor, which reads as a broken gesture rather than a reversed
 * one, so it is worth stating rather than inferring from the minus sign.
 */
export function panScroll(origin: PanOrigin, now: { x: number; y: number }): { left: number; top: number } {
  return {
    left: origin.left - (now.x - origin.x),
    top: origin.top - (now.y - origin.y),
  };
}

/* ── THE SPACE LATCH ─────────────────────────────────────────────────────────────────────────
 *
 * ⚠ SPACE IS A REAL CHARACTER INSIDE A `contentEditable`, so this cannot simply track keydown and
 * keyup. It arms only when focus is OUTSIDE an editable, and a space typed into a paragraph must
 * stay a space.
 *
 * ⚠ AND THE STATES THAT MATTER ARE THE TRANSITIONS, NOT THE RESTING CASES. A latch correct in both
 * resting states and wrong in a transition is the shape #248 and #249 kept producing. The three
 * that would ship broken:
 *   - Space held while focus MOVES INTO a field — the latch must drop, or the next keystroke pans.
 *   - a field focused while Space is ALREADY held — same transition, arrived at from the other side.
 *   - the window losing focus mid-hold — the keyup never arrives, so without this the latch
 *     survives an alt-tab and the next background click pans unexpectedly.
 */

export type LatchEvent =
  | { type: "space-down"; focusInEditable: boolean }
  | { type: "space-up" }
  | { type: "focus-editable" }
  | { type: "window-blur" };

/** The latch is one boolean; it is the TRANSITIONS that carry the behaviour. */
export function nextLatch(armed: boolean, event: LatchEvent): boolean {
  switch (event.type) {
    // Arms only outside an editable. Inside one, Space is a character and this must not fire.
    case "space-down":
      return event.focusInEditable ? false : true;
    case "space-up":
      return false;
    // Focus arriving in a field disarms even mid-hold: the author is about to type.
    case "focus-editable":
      return false;
    // A keyup that will never arrive. Without this the latch outlives the window.
    case "window-blur":
      return false;
  }
}

/**
 * Whether the Space keydown should be swallowed.
 *
 * ⚠ ONLY WHEN IT ARMED. A Space that did not arm the latch is a character, and preventing its
 * default would silently stop the author typing spaces — a defect that looks like a broken
 * keyboard rather than a broken pan.
 */
export function shouldSwallowSpace(opts: { focusInEditable: boolean }): boolean {
  return !opts.focusInEditable;
}
