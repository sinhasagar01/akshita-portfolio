"use client";

// The sidebar's drag handle. A separator, because that is what it is.
//
// THERE IS NO NATIVE RESIZER PRIMITIVE, so everything below is built rather than inherited, and
// the listbox PR's rule applies: dropping a capability deliberately is fine, dropping it silently
// is not. NOTHING IS DROPPED HERE — pointer, keyboard, name, role and value are all present —
// which is worth stating precisely because there is no deliberate-drop note to write.
//
// ---- ENTER IS BOUND TO MINIMUM ↔ LAST NON-MINIMUM, NOT TO THE DEFAULT ----------------------
//
// The obvious binding is the useless one. Toggling to the DEFAULT hands a keyboard user the one
// width they already had, and the whole reason to give Enter a job is that the collapse gesture —
// "get out of my way" — is otherwise unreachable without arrowing thirteen times. So Enter goes
// to the MINIMUM, and pressing it again restores the width you came from.
//
// ---- BELOW `lg` IT DOES NOT RENDER ---------------------------------------------------------
//
// `hidden lg:block`. Below the breakpoint the sidebar is full width and stacked above `main`, so
// there is no width to drag; a focusable control with no effect is worse than no control. This
// pairs with the width itself being consumed only inside `lg:` utilities, so both halves of the
// below-lg answer are structural rather than conditional.
import { useRef, useState } from "react";
import StudioResizeGrip from "./StudioResizeGrip";
import { useSidebarWidthControls } from "./SidebarWidthProvider";
import { SIDEBAR_MAX_PX, SIDEBAR_MIN_PX, SIDEBAR_DEFAULT_PX } from "@/lib/studio/sidebar-width";

const STEP = 8;

export default function SidebarResizer() {
  const ctl = useSidebarWidthControls();
  // Where Enter returns to. Seeded to the default so the first Enter at the minimum still has
  // somewhere to go.
  const lastWide = useRef(SIDEBAR_DEFAULT_PX);
  // Drawn from the gesture rather than `:active`: pointer capture keeps the drag alive after the
  // pointer has left the element, and `:active` does not follow it there.
  const [dragging, setDragging] = useState(false);
  if (!ctl) return null;
  const { width, preview, commit } = ctl;

  const setTo = (px: number) => {
    if (px > SIDEBAR_MIN_PX) lastWide.current = px;
    commit(px);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={SIDEBAR_MIN_PX}
      aria-valuemax={SIDEBAR_MAX_PX}
      aria-controls="studio-sidebar"
      tabIndex={0}
      onPointerDown={(e) => {
        // setPointerCapture keeps the gesture alive when the pointer leaves the 8px hit area —
        // without it a fast drag drops as soon as it outruns the handle.
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        // The drag would otherwise select the nav labels it passes over. A class on the root
        // rather than a style on the handle, because the selection happens in the SIBLINGS.
        document.documentElement.classList.add("select-none");
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        // PREVIEW, NOT COMMIT — see SidebarWidthProvider. This writes one CSS property and
        // triggers no React render, so the panes reflow natively at pointer rate.
        preview(e.clientX);
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(false);
        document.documentElement.classList.remove("select-none");
        setTo(e.clientX);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); setTo(width - STEP); }
        else if (e.key === "ArrowRight") { e.preventDefault(); setTo(width + STEP); }
        else if (e.key === "Home") { e.preventDefault(); commit(SIDEBAR_MIN_PX); }
        else if (e.key === "End") { e.preventDefault(); setTo(SIDEBAR_MAX_PX); }
        else if (e.key === "Enter") {
          e.preventDefault();
          // The collapse gesture, and its undo. See the header for why not the default.
          if (width <= SIDEBAR_MIN_PX) commit(lastWide.current);
          else { lastWide.current = width; commit(SIDEBAR_MIN_PX); }
        }
      }}
      // ---- ABSOLUTE, BECAUSE A HANDLE MUST NOT STEAL WIDTH FROM THE PANES -------------------
      //
      // BOTH OF THESE WERE FOUND BY DRIVING IT, and the second is the one that mattered.
      //
      // (1) In flow with a negative 4px right margin, `main` STARTED 4px inside this handle and painted over the
      //     right half of the hit area: a pointerdown at x=241, inside a 236..244 handle, reported
      //     a BUTTON in main as its target and the drag never began. Half the affordance was dead
      //     and it looked fine.
      // (2) Worse, and the reason for the rewrite: an in-flow flex item CONSUMES LAYOUT WIDTH.
      //     8px wide with a -4px margin is a net 4px taken from the work area, so at a 288px
      //     sidebar the canvas measured 645 where the arithmetic promises 649. That is the whole
      //     class of defect this project has spent the arc on — a threshold and a layout
      //     disagreeing by a term nobody put in the sum — and it would have been introduced by
      //     the control built to sit on the seam.
      //
      // Absolutely positioned ON the seam, it consumes nothing and every pane sum stays exactly
      // as derived. `left` reads the SAME custom property the sidebar's width does, so the handle
      // cannot drift off the edge it drags.
      // ⚠ 12px, UP FROM 8, AND THE TRANSLATE MOVES WITH IT. `-translate-x-1` centred an 8px box
      // on the seam; a 12px box needs -6. Changing one without the other slides the whole target
      // off the edge it drags, which is the same class of defect as (1) above and would look
      // exactly as fine. The before and after are measured by POINTERDOWN in the PR, not by
      // reading these classes — 8px of live band was proven that way and 12 is proven the same.
      //
      // ⚠ `focus-visible:outline` IS GONE FROM HERE and lives on the grip as a ring instead. An
      // outline on a 12px transparent box drew a rectangle in the middle of the chrome that
      // named nothing; the ring on the mark names the thing that moves.
      className="group/rz absolute inset-y-0 z-10 hidden w-3 -translate-x-1.5 cursor-col-resize touch-none select-none lg:grid lg:place-items-center lg:left-[var(--studio-sidebar-w)] focus-visible:outline-none"
    >
      {/* THE MARK REPLACES THE HAIRLINE. It used to be nothing at rest, which meant the sidebar
          resized and never said so — an affordance you have to brush the seam to discover. The
          grip announces it, and it is the same object on both seams. ON INK HERE, because the
          sidebar is ink-950; the inspector's is on cream. One rule, two directions. */}
      <StudioResizeGrip ground="ink" dragging={dragging} />
    </div>
  );
}
