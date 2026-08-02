"use client";

// The canvas zoom level, seeded from the server and committed to a cookie.
//
// #237's split, third application: the value settles on commit and rides a cookie so the first
// paint is correct rather than corrected. There is no preview half here — a zoom is a discrete
// choice rather than a drag, so there is no continuous phase to keep off React.
//
// NOT A CONTEXT, for `useInspectorWidth`'s reason: one subtree of consumers per surface, and a
// context for one consumer is machinery that cannot be traced from the call site.
import { useCallback, useState } from "react";
import {
  clampZoom, stepZoom, ZOOM_COOKIE, type ZoomLevel, type ZoomSurface,
} from "@/lib/studio/canvas-zoom";

export function useCanvasZoom(initial: ZoomLevel, surface: ZoomSurface) {
  const [level, setLevel] = useState<ZoomLevel>(() => clampZoom(initial));

  const commit = useCallback((next: ZoomLevel) => {
    const v = next === "fit" ? "fit" : clampZoom(next);
    setLevel(v);
    document.cookie = `${ZOOM_COOKIE[surface]}=${v}; path=/; max-age=31536000; samesite=lax`;
  }, [surface]);

  /** Step from what is ON SCREEN, not from the stored level — see `stepZoom`. */
  const step = useCallback((effective: number, direction: 1 | -1) => {
    commit(stepZoom(effective, direction));
  }, [commit]);

  const fit = useCallback(() => commit("fit"), [commit]);

  return { level, commit, step, fit };
}
