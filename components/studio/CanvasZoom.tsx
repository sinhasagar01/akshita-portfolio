"use client";

// The canvas zoom control. Minus, a readout, plus.
//
// ---- WHY THREE CONTROLS AND NOT A LISTBOX ---------------------------------------------------
//
// The strip it sits in is 65px tall and already carries the section title and, below the fold,
// the Canvas|Inspector toggle. Five levels in a segmented control would take the width the title
// needs; a listbox would put a popover over the canvas to change the canvas. Two steppers and a
// readout fit the room and are the shape people already know from every other zoom.
//
// ⚠ THE READOUT IS THE RESET, AND ITS ACCESSIBLE NAME IS WHERE THAT LIVES. A separate "Fit"
// button would be a fourth control for a state the readout is already showing. #255 is the
// precedent for the rule rather than the shape: what a control DOES belongs in its name, not only
// in a tooltip, because a suffix that leaves the label and is `aria-hidden` tells a screen reader
// less than before.
//
// IT SHOWS THE EFFECTIVE PERCENTAGE, NEVER THE WORD "fit". `fit` is what the author ASKED for;
// the percentage is what they are LOOKING AT, and on the case study those differ at almost every
// pane width. Showing the level would mean the control reads "fit" while the canvas is at 59%.
import { ZOOM_STEPS, zoomLabel, type ZoomLevel } from "@/lib/studio/canvas-zoom";

const btn =
  "grid size-[26px] flex-none place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 disabled:pointer-events-none disabled:opacity-30";

export default function CanvasZoom({
  effective,
  level,
  onStep,
  onFit,
}: {
  /** The scale actually on screen, whatever `fit` resolved to. */
  effective: number;
  /** What the author asked for. Only used to say whether Fit is already the state. */
  level: ZoomLevel;
  onStep: (direction: 1 | -1) => void;
  onFit: () => void;
}) {
  const atMin = effective <= ZOOM_STEPS[0] + 0.001;
  const atMax = effective >= ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.001;
  const isFit = level === "fit";
  return (
    <div role="group" aria-label="Canvas zoom" className="inline-flex flex-none items-center gap-1">
      <button
        type="button"
        className={btn}
        onClick={() => onStep(-1)}
        disabled={atMin}
        aria-label="Zoom out"
        title="Zoom out"
      >
        {/* A stated glyph rather than an icon import: one horizontal rule needs no component. */}
        <span aria-hidden className="block h-px w-2.5 bg-current" />
      </button>

      {/* The readout doubles as the reset. Disabled when Fit is already the level, so the control
          never offers a press that changes nothing. */}
      <button
        type="button"
        onClick={onFit}
        disabled={isFit}
        title={isFit ? "Fitting the pane" : "Reset to fit the pane"}
        aria-label={isFit ? `Canvas zoom, ${zoomLabel(effective)}, fitting the pane` : `Canvas zoom, ${zoomLabel(effective)}. Reset to fit the pane.`}
        className="min-w-[46px] rounded-[var(--studio-radius-control,4px)] px-1 py-1 text-[12px] font-semibold tabular-nums text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 disabled:hover:bg-transparent disabled:hover:text-ink-600"
      >
        {zoomLabel(effective)}
      </button>

      <button
        type="button"
        className={btn}
        onClick={() => onStep(1)}
        disabled={atMax}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <span aria-hidden className="relative block size-2.5">
          <span className="absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-current" />
          <span className="absolute left-1/2 top-0 h-2.5 w-px -translate-x-1/2 bg-current" />
        </span>
      </button>
    </div>
  );
}
