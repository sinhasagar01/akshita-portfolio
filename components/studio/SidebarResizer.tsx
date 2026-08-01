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
import { useRef } from "react";
import { useSidebarWidthControls } from "./SidebarWidthProvider";
import { SIDEBAR_MAX_PX, SIDEBAR_MIN_PX, SIDEBAR_DEFAULT_PX } from "@/lib/studio/sidebar-width";

const STEP = 8;

export default function SidebarResizer() {
  const ctl = useSidebarWidthControls();
  // Where Enter returns to. Seeded to the default so the first Enter at the minimum still has
  // somewhere to go.
  const lastWide = useRef(SIDEBAR_DEFAULT_PX);
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
      className="group/rz absolute inset-y-0 z-10 hidden w-2 -translate-x-1 cursor-col-resize touch-none select-none lg:block lg:left-[var(--studio-sidebar-w)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
    >
      {/* The visible affordance: nothing at rest, a hairline on hover or focus. The sidebar's
          own `lg:border-r` is the seam; this only brightens it, so the chrome does not gain a
          permanent line it did not have. */}
      <span
        aria-hidden
        className="block h-full w-px bg-transparent transition-colors group-hover/rz:bg-accent-500 group-focus-visible/rz:bg-accent-500"
      />
    </div>
  );
}
