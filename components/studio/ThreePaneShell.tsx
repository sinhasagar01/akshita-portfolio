"use client";

// The blog editor's list + canvas + inspector shell.
//
// BLOG-SPECIFIC ON PURPOSE. Other studio pages are intended to adopt this layout, and the
// rule is to extract a shared shell at the SECOND consumer, not the first: two consumers
// teach you what varies, one teaches you nothing and you design the wrong abstraction.
// Same rule that governed #173's splice. So the seams stay visible and the props stay
// concrete rather than generic.
//
// THE ARITHMETIC THIS LAYOUT IS BUILT TO. Measured, not taken from the contract:
//   sidebar 236 + list 264 + canvas 794 + inspector 244 = 1538px minimum.
// The canvas term is 68ch (745.9px at the inherited 16px DM Sans) plus 48px of padding.
// The contract said 620 + 64 and computed 1406, which was wrong by 190px because 68ch was
// mis-estimated from the 18px prose font rather than the 16px wrapper font. 1538 fits the
// 1536-wide laptop this is used on; below it the list starts collapsed.
//
// THE CANVAS MEASURE NEVER CHANGES. The contract widened `.canvas-inner` from 620 to 700
// when the list collapsed. That would break the one property that justifies 68ch at all —
// the canvas renders through the PUBLIC component at the PUBLIC measure, so what the
// author sees is what the article will render. A measure that moves when you hide a pane
// is a measure that lies.
//
// COLLAPSE IS A WIDTH TRANSITION, NEVER A CONDITIONAL RENDER. Unmounting the list would
// reset its search field. But a `width: 0` pane still keeps its contents TABBABLE, which
// is #177's aria-hidden finding in mirror form — so the collapsed pane also gets `inert`,
// which removes it from the tab order and from the accessibility tree together. `hidden`
// would unmount-equivalent it for AT but also kill the transition; `inert` is the one
// attribute that does exactly this job.
import { useState, type ReactNode } from "react";
import { IconChevronDown } from "./icons";

/** The measured FIT threshold. Exported so a gate can assert against the same number the
 *  layout uses, rather than a copy of it. */
export const FIT_THRESHOLD_PX = 1538;
/** Below this the inspector pane folds away and the canvas pane's own view toggle takes
 *  over — one mechanism at two widths, and the narrow layout is the already-shipped one. */
export const INSPECTOR_FOLD_PX = 1100;

export default function ThreePaneShell({
  list,
  canvas,
  inspector,
}: {
  list: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
}) {
  // Default OPEN. Below the fit threshold CSS collapses it regardless (see the
  // `max-[1538px]` variants), so this state only decides the wide case and the explicit
  // user toggle. Keeping one boolean rather than mirroring the media query avoids the
  // hydration mismatch a `matchMedia` read during render would cause.
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-0 flex-1">
      {/* LIST — width transition. min-w-0 + overflow-hidden so the children keep their
          intrinsic 264px while the box animates to 0. */}
      <div
        // `inert` is the G3 fix: a 0-width pane is still tabbable without it.
        {...(!open ? { inert: "" as unknown as boolean } : {})}
        className={`relative flex flex-none flex-col overflow-hidden border-r bg-cream-50 transition-[width,border-color] duration-300 ease-out ${
          open ? "w-[264px] border-ink-950/8" : "w-0 border-transparent"
        }`}
      >
        <div className="flex min-w-[264px] flex-1 flex-col overflow-hidden">{list}</div>
      </div>

      {/* The reopen rail. Only rendered when collapsed, and a real <button> with a real
          accessible name — not an icon with a title attribute. */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show posts"
          aria-expanded={false}
          className="mt-3.5 h-7 w-[26px] flex-none rounded-r-lg border border-l-0 border-ink-950/8 bg-cream-50 text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500"
        >
          <span aria-hidden className="block -rotate-90 text-[11px] leading-none">
            <IconChevronDown />
          </span>
        </button>
      ) : null}

      {/* CANVAS */}
      <div className="relative min-w-0 flex-1 overflow-y-auto bg-cream-50">
        <div className="flex items-center gap-2 border-b border-ink-950/8 px-4 py-2">
          {open ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Collapse posts"
              aria-expanded
              className="grid size-[26px] place-items-center rounded-md border border-ink-950/8 text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500"
            >
              <span aria-hidden className="block rotate-90 text-[11px] leading-none">
                <IconChevronDown />
              </span>
            </button>
          ) : null}
        </div>
        {canvas}
      </div>

      {/* INSPECTOR — folds away below INSPECTOR_FOLD_PX, where the canvas pane's own
          Canvas/Inspector toggle becomes the route to these fields. `hidden` rather than a
          conditional render for the same reason as the list: the forms keep their values
          and their caret across the fold. */}
      <aside className="hidden w-[244px] flex-none overflow-y-auto border-l border-ink-950/8 bg-cream-100 min-[1100px]:block">
        {inspector}
      </aside>
    </div>
  );
}
