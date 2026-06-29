import type { CSSProperties } from "react";
import type { StoryScreen } from "@/lib/case-studies/types";

/* Shared three-layer device-bezel scroller geometry. Single source of truth for both
   the Work story (WorkStory) and the Before → After story (BeforeAfterStory) so the
   bezel, window, footer split, and scroll range can never drift between them. All
   numbers live in the 1030px-wide device space from scroll-assets/geometry.json. */

export const BEZEL_W = 1030;
export const BEZEL_H = 2165;
export const INSET = 30;
export const WIN_TOP = 110; // tucks ~20px under the status bar so no page-bg seam shows
export const SCREEN_BOTTOM = 2138;
export const RADIUS = 100;
export const SCREEN_BG = "#0c0c0f"; // phone letterbox — device-internal, not a site token

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** ease-in-out (used for the in-screen auto-scroll). */
export const eIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export type Rect = { left: number; top: number; width: number; height: number };
export type Geo =
  | { scrollable: false; scrollPct: 0 }
  | { scrollable: true; scrollPct: number; win: Rect; footer: Rect; radius: number };

/**
 * Window / footer rects + scroll range for one phone, scaled to a rendered `phoneW`.
 * `scrollPct` is a unitless ratio of the body image's own height, so the content
 * scrolls via `translateY(-progress * scrollPct * 100%)` — resolution-independent and
 * free of any `offsetHeight`/decode race (dims come from the static imports' `.height`).
 * A `{ full }` (or absent) screen is non-scrollable.
 */
export function unitGeo(phoneW: number, screen: StoryScreen | undefined): Geo {
  if (!screen || !("body" in screen)) return { scrollable: false, scrollPct: 0 };
  const sc = phoneW / BEZEL_W;
  const bodyH = screen.body.height;
  const footerH = screen.footer.height;
  const footerTopSpace = SCREEN_BOTTOM - footerH;
  const winHeightSpace = footerTopSpace - WIN_TOP;
  const w = (BEZEL_W - 2 * INSET) * sc;
  return {
    scrollable: true,
    scrollPct: bodyH > 0 ? (bodyH - winHeightSpace) / bodyH : 0,
    win: { left: INSET * sc, top: WIN_TOP * sc, width: w, height: winHeightSpace * sc },
    footer: { left: INSET * sc, top: footerTopSpace * sc, width: w, height: footerH * sc },
    radius: RADIUS * sc,
  };
}

/** iOS-style scroll-edge blur strip, masked-faded, pinned to the top or bottom of `.win`. */
export const EDGE = (dir: "t" | "b", h: number): CSSProperties => ({
  position: "absolute",
  left: 0,
  right: 0,
  [dir === "t" ? "top" : "bottom"]: dir === "t" ? 4 : 0,
  height: h,
  zIndex: 2,
  pointerEvents: "none",
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  maskImage: dir === "t" ? "linear-gradient(#000 28%, transparent)" : "linear-gradient(transparent, #000 72%)",
  WebkitMaskImage: dir === "t" ? "linear-gradient(#000 28%, transparent)" : "linear-gradient(transparent, #000 72%)",
});
