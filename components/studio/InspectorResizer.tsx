"use client";

// The inspector's drag handle. A separator, like the sidebar's, and the same grip on the seam.
//
// ---- ⚠ THE MAXIMUM IS MEASURED AT POINTERDOWN, NOT SUMMED --------------------------------
//
// A wide inspector on a narrow page starves the canvas, and the honest bound is "however much the
// canvas can give up before it hits `CS_MIN_SCALE`". That could be written as a sum — page minus
// sidebar minus list minus 640 — but the list's collapsed state lives inside `ThreePaneShell`, so
// the sum would need a term this component cannot see, and a threshold that disagrees with the
// layout by one term is the whole class of defect this project has spent the arc on.
//
// So it MEASURES: at pointerdown, the canvas pane's current width says exactly how much slack
// there is, and the ceiling is `current + slack`. It re-measures per gesture rather than per move,
// because the answer is fixed for the duration of a drag and re-reading it mid-gesture would let
// the ceiling chase the pointer.
//
// ---- ENTER TOGGLES COLLAPSED ↔ LAST OPEN --------------------------------------------------
//
// #237's binding, for #237's reason. Toggling to the DEFAULT hands a keyboard user a width they
// may never have chosen; the collapse gesture — "get out of my way" — is otherwise unreachable
// without arrowing forty times.
//
// ---- BELOW THE FOLD IT DOES NOT RENDER ----------------------------------------------------
//
// The caller renders it only when the inspector is a pane at all. Below `INSPECTOR_FOLD_PX` the
// inspector node moves INTO the canvas and there is no seam to drag — a focusable control with no
// effect is worse than no control. Structural, like `SidebarResizer`'s `hidden lg:block`.
import { useRef, useState } from "react";
import StudioResizeGrip from "./StudioResizeGrip";
import { INSPECTOR_BOUNDS, type InspectorSurface } from "@/lib/studio/inspector-width";

const STEP = 8;

export default function InspectorResizer({
  width,
  collapsed,
  preview,
  commit,
  lastOpen,
  surface,
  canvasFloorPx,
}: {
  width: number;
  collapsed: boolean;
  preview: (px: number) => void;
  commit: (px: number) => void;
  lastOpen: React.MutableRefObject<number>;
  /** Which inspector — the two measure different bounds. */
  surface: InspectorSurface;
  /** The width the canvas may not go below. The case study's is a SCALE floor, blog's is its
   *  MEASURE; the ceiling arithmetic is identical either way, so the caller passes the number. */
  canvasFloorPx: number;
}) {
  const { min: MIN_PX, max: MAX_PX } = INSPECTOR_BOUNDS[surface];
  const [dragging, setDragging] = useState(false);
  // The ceiling for THIS gesture, measured once at pointerdown. See the header.
  const ceiling = useRef(MAX_PX);
  const el = useRef<HTMLDivElement>(null);

  /** How wide the inspector may go right now: its own width plus whatever the canvas can spare. */
  const measureCeiling = () => {
    const shell = el.current?.parentElement;
    // The canvas pane is the flex child that grows; the aside is the one after it.
    const canvas = shell ? [...shell.children].find((c) => c.className.includes("flex-1")) : null;
    const slack = canvas ? canvas.getBoundingClientRect().width - canvasFloorPx : 0;
    ceiling.current = Math.max(MIN_PX, Math.min(MAX_PX, width + Math.floor(slack)));
  };

  /** Pointer x → an inspector width. The pane is on the RIGHT, so it grows as x falls. */
  const fromPointer = (clientX: number) => {
    const shell = el.current?.parentElement;
    const right = shell ? shell.getBoundingClientRect().right : 0;
    return Math.min(ceiling.current, Math.max(0, right - clientX));
  };

  const setTo = (px: number) => commit(Math.min(ceiling.current, px));

  return (
    <div
      ref={el}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize inspector"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={MAX_PX}
      aria-controls="studio-inspector"
      tabIndex={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        measureCeiling();
        setDragging(true);
        // The drag would otherwise select the fields it passes over. A class on the root rather
        // than a style here, because the selection happens in the SIBLINGS.
        document.documentElement.classList.add("select-none");
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        preview(fromPointer(e.clientX));
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(false);
        document.documentElement.classList.remove("select-none");
        commit(fromPointer(e.clientX));
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); measureCeiling(); setTo(width + STEP); }
        else if (e.key === "ArrowRight") { e.preventDefault(); setTo(width - STEP); }
        else if (e.key === "Home") { e.preventDefault(); commit(0); }
        else if (e.key === "End") { e.preventDefault(); measureCeiling(); setTo(MAX_PX); }
        else if (e.key === "Enter") {
          e.preventDefault();
          // The collapse gesture and its undo. The clamp lives in `commit`, so a stale
          // `lastOpen` from a build with wider bounds still resolves inside today's.
          if (collapsed) { measureCeiling(); setTo(lastOpen.current); }
          else commit(0);
        }
      }}
      // ---- ABSOLUTE ON THE SEAM, CONSUMING NO LAYOUT WIDTH ---------------------------------
      //
      // #237's second defect, which cost 4px of work area at every sidebar width: an in-flow
      // handle is a term in the arithmetic that nobody put there. `right` reads the SAME custom
      // property the aside's width does, so the handle cannot drift off the edge it drags, and
      // `translate-x-1.5` centres the 12px target on the seam.
      //
      // ⚠ AT ZERO WIDTH IT RIDES THE PAGE EDGE AND IS STILL THE WAY BACK. That is the whole
      // argument for a grip over a hairline: a pane at zero has no handle inside it, so the
      // affordance and its undo have to be the same object in the same place.
      className="group/rz absolute inset-y-0 z-10 hidden w-3 translate-x-1.5 cursor-col-resize touch-none select-none focus-visible:outline-none lg:grid lg:place-items-center lg:right-[var(--studio-inspector-w,320px)]"
    >
      <StudioResizeGrip ground="cream" dragging={dragging} />
    </div>
  );
}
