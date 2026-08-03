"use client";

// Drag-to-pan for the case-study canvas — the browser half.
//
// The decisions and the arithmetic are in `lib/studio/canvas-pan.ts`, which imports nothing and is
// asserted directly; what is left here is pointer capture, the listeners, and the scroll writes.
//
// ---- ⚠ THE SCROLL WRITES USE A PER-CALL `behavior: "instant"`, AND NEVER TOUCH THE CSS ---------
//
// The canvas slot carries `scroll-smooth`, and that is load-bearing rather than decorative: T0's
// reveal calls `scrollTo({top})` with NO behavior key precisely so the global reduced-motion reset
// wins for free (#198, #258). Measured, a drag against it is unusable — a direct `scrollLeft = 500`
// reads back **0** and only reaches 480 after 400ms, so the canvas trails the cursor by a third of
// a second. `scrollTo({ behavior: "instant" })` lands immediately and exactly, verified against a
// smooth element.
//
// ⚠ AND IT IS PREFERRED OVER TOGGLING `style.scrollBehavior` FOR THE DRAG'S DURATION, which is the
// obvious alternative and the one that breaks quietly: a drag interrupted by the pointer being
// released outside the window would never restore it, leaving the canvas permanently non-smooth and
// T0's reveal silently instant. A per-call override has no state to leak. `canvas-pan` asserts BOTH
// halves — that instant is used, and that nothing anywhere mutates `style.scrollBehavior`.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  shouldPan,
  panScroll,
  nextLatch,
  shouldSwallowSpace,
  type PanOrigin,
} from "@/lib/studio/canvas-pan";

/** Every inline-editable field carries this; see `components/case-study/editable.ts`. */
const EDITABLE_SELECTOR = "[data-edit-value-path]";

const inEditable = (node: EventTarget | null): boolean =>
  node instanceof Element && node.closest(EDITABLE_SELECTOR) !== null;

export function useCanvasPan(opts: {
  /* ⚠ NO `paneRef` HERE, THOUGH THE FIRST VERSION TOOK ONE. The panel resolves the scroller itself
     and the hook never needed the pane — an accepted-and-ignored prop is the "control that cannot
     do anything" shape this repo has deleted four times, one level down. Lint caught it. */
  /** Resolves the real scroller. The panel passes its existing `scrollParent` walk rather than
   *  this file re-deriving one, because that walk already encodes which of three arrangements is
   *  live and why it tests DECLARED overflow. */
  getScroller: () => HTMLElement | null;
}) {
  const { getScroller } = opts;
  const [spaceArmed, setSpaceArmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const origin = useRef<PanOrigin | null>(null);
  const scroller = useRef<HTMLElement | null>(null);
  // Read by the pointer handler, which must not be re-created on every latch change.
  const armedRef = useRef(false);
  armedRef.current = spaceArmed;

  /* ---- THE SPACE LATCH. The transitions are the behaviour; see `nextLatch`. ---- */
  useEffect(() => {
    const apply = (e: Parameters<typeof nextLatch>[1]) =>
      setSpaceArmed((armed) => nextLatch(armed, e));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.repeat) return;
      const focusInEditable = inEditable(document.activeElement);
      // ⚠ SWALLOWED ONLY WHEN IT ARMS. A Space inside a field is a character, and preventing its
      // default there would stop the author typing spaces — a defect that reads as a broken
      // keyboard rather than a broken pan.
      if (shouldSwallowSpace({ focusInEditable })) e.preventDefault();
      apply({ type: "space-down", focusInEditable });
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      apply({ type: "space-up" });
    };
    // Focus arriving in a field disarms even mid-hold: the author is about to type.
    const onFocusIn = (e: FocusEvent) => {
      if (inEditable(e.target)) apply({ type: "focus-editable" });
    };
    // The keyup that will never arrive. Without this the latch outlives an alt-tab and the next
    // background click pans unexpectedly.
    const onBlur = () => apply({ type: "window-blur" });

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* ---- THE DRAG ---- */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!shouldPan({ editableTarget: inEditable(e.target), spaceHeld: armedRef.current, button: e.button })) {
        return;
      }
      const el = getScroller();
      if (!el) return;
      scroller.current = el;
      origin.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
      setDragging(true);
      // Capture so the drag survives the pointer leaving the pane — and so `pointerup` arrives
      // even when it is released over the inspector.
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    },
    [getScroller],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const o = origin.current;
    const el = scroller.current;
    if (!o || !el) return;
    const next = panScroll(o, { x: e.clientX, y: e.clientY });
    // ⚠ `instant`, per call. See the header: the CSS is not touched.
    el.scrollTo({ left: next.left, top: next.top, behavior: "instant" });
  }, []);

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!origin.current) return;
    origin.current = null;
    scroller.current = null;
    setDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return {
    /** Spread onto the canvas pane. */
    panProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    /** `grab` while armed, `grabbing` while dragging — the only affordance this gesture has. */
    panCursor: dragging ? "grabbing" : spaceArmed ? "grab" : undefined,
    dragging,
    spaceArmed,
  };
}
