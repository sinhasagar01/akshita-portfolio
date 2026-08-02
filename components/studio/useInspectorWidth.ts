"use client";

// The case-study inspector's width, seeded from the server and committed to a cookie.
//
// ---- THE SAME SPLIT AS #237, AND FOR THE SAME REASON -----------------------------------------
//
// THE CONTINUOUS PART IS LIVE AND COSTS NOTHING. `preview` writes the custom property straight to
// the DOM — no setState, so no React render per pointermove. The panes are flex children and
// reflow natively, and `useFitToWidth` already observes the canvas pane with a ResizeObserver, so
// the canvas SCALE tracks the drag for free.
//
// THE DISCRETE PART SETTLES ONCE. Whether the list collapses, whether the inspector folds, and
// where the save bar lives are threshold decisions; re-evaluating them per move gives a layout
// that argues with the hand moving it. They read `width`, which only moves on `commit`.
//
// ---- ⚠ NOT A CONTEXT, AND THAT IS DELIBERATE -------------------------------------------------
//
// `SidebarWidthProvider` is a context because the sidebar's width is read by chrome the editor
// does not own — `PublishBar`, the layout, both editors. THIS width has exactly one subtree of
// consumers, all inside `SectionsEditPanel`. A context for one consumer is machinery that has to
// be maintained and cannot be traced by reading the call site.
import { useCallback, useRef, useState } from "react";
import {
  clampInspectorWidth,
  isInspectorCollapsed,
  INSPECTOR_BOUNDS,
  INSPECTOR_WIDTH_VAR,
  type InspectorSurface,
} from "@/lib/studio/inspector-width";

export type InspectorWidth = {
  /** The committed width. Threshold arithmetic and the save bar's home read THIS. */
  width: number;
  /** Collapsed at the committed width. One source, so `inert` and the dock cannot disagree. */
  collapsed: boolean;
  /** Paint a width without committing — the per-move write during a drag. */
  preview: (px: number) => void;
  /** Commit: state, cookie and the property settle together. */
  commit: (px: number) => void;
  /** Where Enter returns to. Kept here rather than in the resizer so a remount cannot lose it. */
  lastOpen: React.MutableRefObject<number>;
  /** The element that declares the property. Must be an ANCESTOR of the shell's aside. */
  rootRef: React.RefObject<HTMLDivElement | null>;
  /** The declaration for that element's `style`. */
  styleVar: React.CSSProperties;
};

export function useInspectorWidth(initial: number, surface: InspectorSurface): InspectorWidth {
  const { min, cookie } = INSPECTOR_BOUNDS[surface];
  const [width, setWidth] = useState(() => clampInspectorWidth(initial, surface));
  const rootRef = useRef<HTMLDivElement>(null);
  // Seeded to the minimum so the first Enter from a collapsed pane still has somewhere to go —
  // #237's rule: binding the toggle to a fixed DEFAULT hands a keyboard user a width they may
  // never have chosen, so it returns to the last one they did.
  const lastOpen = useRef(Math.max(min, clampInspectorWidth(initial, surface)));

  const preview = useCallback((px: number) => {
    rootRef.current?.style.setProperty(INSPECTOR_WIDTH_VAR, `${clampInspectorWidth(px, surface)}px`);
  }, [surface]);

  const commit = useCallback((px: number) => {
    const next = clampInspectorWidth(px, surface);
    if (!isInspectorCollapsed(next)) lastOpen.current = next;
    setWidth(next);
    rootRef.current?.style.setProperty(INSPECTOR_WIDTH_VAR, `${next}px`);
    // A UI preference on a single-owner tool: not httpOnly, not a secret, SameSite=Lax so it
    // rides ordinary navigation. One year, because a width you set once should stay set.
    document.cookie = `${cookie}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, [surface, cookie]);

  return {
    width,
    collapsed: isInspectorCollapsed(width),
    preview,
    commit,
    lastOpen,
    rootRef,
    styleVar: { [INSPECTOR_WIDTH_VAR]: `${width}px` } as React.CSSProperties,
  };
}
