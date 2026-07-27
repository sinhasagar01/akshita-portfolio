"use client";

// The blog editor's list, canvas and inspector shell.
//
// BLOG-SPECIFIC ON PURPOSE. Other studio pages are intended to adopt this layout, and the
// rule is to extract a shared shell at the SECOND consumer, not the first. Two consumers
// teach you what varies, one teaches you nothing and you design the wrong abstraction.
// Same rule that governed #173's splice. So the seams stay visible and the props stay
// concrete rather than generic.
//
// THE GEOMETRY LIVES IN lib/studio/three-pane.ts, along with the collapse rule and the
// reasoning for both. Read that file first.
//
// A CORRECTION TO THIS FILE'S FIRST DRAFT. The drafted version carried a comment saying
// "below the fit threshold CSS collapses it regardless (see the max-width variants)".
// THERE WERE NO SUCH VARIANTS. `FIT_THRESHOLD_PX` was exported and had zero consumers
// anywhere in the repo, including this file, and the collapse ran off the `open` boolean
// alone — so the layout did not respond to width at all. The comment described code that
// did not exist, which is precisely how `structural()` became a name people believed in.
// Both are fixed here, together, because fixing only the comment would have left a
// documented behaviour unbuilt and fixing only the code would have left the next reader
// trusting a variant they could not find.
//
// HEIGHT WITHOUT A LITERAL, AND A CORRECTION. This root is `flex-1 min-h-0` inside the
// dashboard layout's `main`. The first version of this comment claimed `overflow-hidden`
// alone was enough — that it would stop the panes' content contributing to intrinsic
// height, so the row would fall back to its `min-h-screen` and this box would resolve to
// the viewport minus the topbar. THAT IS WRONG, and measuring it is the only reason we
// know: the shell came out 1230px tall in a 960px viewport and the page scrolled. Overflow
// makes a box a scroll container; it does not remove the box's own content from intrinsic
// sizing, and `flex-1` divides free space only when the container's height is already
// resolved. Under `min-h-screen` it is not.
//
// The fix is in the layout, not here: a viewport-height rule on the shell row plus a zero min-height on
// `main` make the height definite, and this box then resolves to the viewport minus the
// topbar with nothing hardcoding the topbar's 64px. The panes scroll internally, which is
// the whole reason #D1 deleted the layout's shared padding wrapper.
//
// The overflow rules below are `lg:`-gated to match. Below `lg` the layout is ordinary
// document flow, the list is already collapsed (1024 is well under the 1614 fit threshold)
// and the inspector is folded, so the shell is a single scrolling column and clipping it to
// a viewport height it does not have would put its bottom out of reach.
//
// COLLAPSE IS A WIDTH TRANSITION, NEVER A CONDITIONAL RENDER. Unmounting the list would
// reset its search field. But a `width: 0` pane still keeps its contents TABBABLE, which is
// #177's finding in mirror form, so the collapsed pane also gets `inert` — the one
// attribute that removes it from the tab order and the accessibility tree together, while
// leaving the transition intact. `hidden` would kill the transition. Whether `inert`
// actually holds is G3's question, not this comment's: prove inertness, do not infer it.
import { useState, type ReactNode } from "react";
// A RIGHT chevron, rotated for the collapse direction rather than a DOWN chevron rotated
// 90 degrees. The icons carry no intrinsic width or height — they are a 24x24 viewBox with
// `stroke="currentColor"` and nothing else — so a consumer MUST size them, either with a
// `size-*` class on the svg or `[&>svg]:size-*` on the parent. The first draft wrapped one
// in a `text-[11px]` span and the button rendered visibly empty.
import { IconChevronRight } from "./icons";
import { useMediaMin } from "./useMediaMin";
import { FIT_THRESHOLD_PX, isListCollapsed, type ListIntent } from "@/lib/studio/three-pane";

export default function ThreePaneShell({
  list,
  canvas,
  canvasBar,
  inspector,
}: {
  list: ReactNode;
  canvas: ReactNode;
  /** Content for the canvas pane's top strip, beside the collapse control. The strip is
   *  the shell's because the collapse control lives in it, but what sits next to that
   *  control is the caller's business — for blog it is the post title and the narrow-width
   *  view toggle. */
  canvasBar?: ReactNode;
  /** The inspector, or null when the caller has folded it and is rendering that same node
   *  inside `canvas` instead. The shell never renders a hidden second copy.
   *
   *  THE FOLD IS THE CALLER'S QUERY, NOT THE SHELL'S, and deliberately so. The shell would
   *  have to hand the answer back up for the caller to act on it, and a callback fired
   *  during render sets parent state mid-render. The caller reads INSPECTOR_FOLD_PX
   *  through the same useMediaMin hook and simply decides what to pass. */
  inspector: ReactNode | null;
}) {
  const [intent, setIntent] = useState<ListIntent>("default");
  const fits = useMediaMin(FIT_THRESHOLD_PX);
  const collapsed = isListCollapsed(intent, fits);

  // THE TRANSITION IS FOR USER TOGGLES ONLY, NEVER FOR THE HYDRATION CORRECTION.
  //
  // The server always renders the wide layout (useMediaMin has no viewport to read), so on
  // a narrow screen the first client render switches the pane from 264px to 0. With the
  // transition always on, that correction ANIMATES — the rail visibly slides shut on every
  // single page load below 1614px, which reads as a glitch rather than a choice. It also
  // makes the pane's width unmeasurable for 300ms after load, which is how this was found:
  // a gate read 264px from a pane whose class already said `w-0`.
  //
  // Enabling it on the first explicit toggle rather than from an effect keeps it to one
  // piece of state and no extra render. Nothing animates until the author asks for it, and
  // then everything does.
  const [animate, setAnimate] = useState(false);
  const toggle = (next: ListIntent) => {
    setAnimate(true);
    setIntent(next);
  };

  return (
    // `data-studio-fullheight` is how this page OPTS IN to the dashboard layout's
    // viewport-height rule. The layout keys off it with `:has()` rather than knowing the route,
    // because applying that height to every studio page made the bottom of a short-viewport
    // page unreachable. See the layout's comment for the measurement.
    <div data-studio-fullheight className="flex min-h-0 flex-1 lg:overflow-hidden">
      {/* LIST — a width transition. overflow-hidden plus an inner min-w-[264px] so the
          children keep their intrinsic width while the box animates to zero, instead of
          reflowing on every frame of the transition. */}
      <div
        // Driven from the SAME `collapsed` that drives the width. Computing the two
        // separately is how a pane ends up visually gone and still tabbable.
        //
        // G3 SETTLED THE `inert` QUESTION, AND THE ANSWER WAS NOT THE EXPECTED ONE. The
        // plan carried `{...(collapsed ? { inert: "" as unknown as boolean } : {})}` because
        // older React typings wanted a string-ish attribute and TypeScript rejected the
        // boolean. On React 19 that cast is the BUG, not the workaround: React 19 supports
        // `inert` as a real boolean prop, and an empty string is FALSY, so React dropped the
        // attribute entirely. The collapsed pane rendered with no `inert` at all and every
        // control inside it stayed in the tab order — the exact focus trap this line exists
        // to prevent, introduced by the code written to prevent it. `@types/react` 19 types
        // it as `boolean | undefined`, so the plain prop needs no cast and the documented
        // `visibility: hidden` fallback is not needed. Only driving it in a browser found
        // this; the attribute was in the source the whole time. PROVE INERTNESS, DON'T INFER IT.
        inert={collapsed}
        // `min-w-0` IS LOAD-BEARING. A flex item defaults to `min-width: auto`, which floors
        // it at its min-content size, and the inner wrapper's `min-w-[264px]` made that
        // 264px — so `w-0` computed to 264px and the pane never actually collapsed. The
        // class was right and the box ignored it.
        className={`relative flex min-w-0 flex-none flex-col overflow-hidden border-r bg-cream-50 ${
          animate ? "transition-[width,border-color] duration-300 ease-out" : ""
        } ${
          collapsed ? "w-0 border-transparent" : "w-[264px] border-ink-950/8"
        }`}
      >
        <div className="flex min-w-[264px] min-h-0 flex-1 flex-col overflow-hidden">{list}</div>
      </div>

      {/* The reopen rail, only when collapsed. A real <button> with a real accessible name,
          not an icon carrying a title attribute. */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => toggle("open")}
          aria-label="Show posts"
          aria-expanded={false}
          className="mt-3.5 grid h-7 w-[26px] flex-none place-items-center rounded-r-lg border border-l-0 border-ink-950/8 bg-cream-50 text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500"
        >
          <IconChevronRight className="size-3.5" />
        </button>
      ) : null}

      {/* CANVAS — the only pane that owns the page's remaining width. */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col bg-cream-50 lg:overflow-hidden">
        {/* The strip renders at BOTH states so `canvasBar` (the post title) does not
            appear and vanish as the list collapses. Only the collapse control itself is
            conditional — when the list is already collapsed, the reopen rail is the
            control, and two ways to reopen one pane is one too many. */}
        <div className="flex flex-none items-center gap-2.5 border-b border-ink-950/8 px-4 py-2">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => toggle("closed")}
              aria-label="Collapse posts"
              aria-expanded
              className="grid size-[26px] flex-none place-items-center rounded-md border border-ink-950/8 text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500"
            >
              <IconChevronRight className="size-3.5 rotate-180" />
            </button>
          ) : null}
          {canvasBar}
        </div>
        <div className="min-h-0 flex-1 lg:overflow-y-auto">{canvas}</div>
      </div>

      {/* INSPECTOR — rendered only when it fits. Below INSPECTOR_FOLD_PX the caller mounts
          the SAME node inside the canvas pane instead, so there is never a hidden second
          copy of the forms. That matters more than it looks: two copies would be two
          useDraftForm-fed field trees posting through one onChange, with colliding ids and
          two carets. */}
      {inspector !== null ? (
        <aside className="w-[320px] flex-none overflow-y-auto border-l border-ink-950/8 bg-cream-100">
          {inspector}
        </aside>
      ) : null}
    </div>
  );
}
