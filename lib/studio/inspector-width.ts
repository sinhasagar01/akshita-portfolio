// The inspector's width — per-surface bounds, and the clamp that makes a stored value advisory.
//
// The same shape as `sidebar-width.ts`, deliberately: bounds, a clamp applied ON THE READ, a
// cookie and a custom property. #237 settled that shape and this is its second application, not a
// new pattern. Pure and DEPENDENCY-FREE, so `--experimental-strip-types` can load it and ralph
// can assert the clamp directly.
//
// ---- ⚠ TWO SURFACES, TWO SETS OF BOUNDS, AND A CORRECTION TO MY OWN ARGUMENT ------------------
//
// #283 shipped this for the CASE STUDY ONLY, on the reasoning that blog's canvas is a FIXED
// MEASURE — 68ch, locked, never widens — so any width the inspector gives or takes is cream and
// the article never changes. A control whose entire range moves only margin is a control with no
// purpose.
//
// ⚠ THAT REASONING WAS INCOMPLETE AND THE CONCLUSION WAS WRONG. It asked what the CANVAS does
// with the width and never asked what the INSPECTOR does with it. Measured on the live pane at
// the shipped 320: the post title needs 299px in a 289px box and the excerpt needs 305 — TWO
// FIELDS ARE CLIPPED, and they are the two an author writes first. They un-clip at 340.
//
//     inspector   clipped fields   canvas pane   measure   cream each side
//     320                      2           995       746               125
//     340                      0           975       746               115
//     460                      0           855       746                55
//
// So widening blog's inspector is not decoration: it fixes a live defect, and it NARROWS the
// cream rather than widening it — the article looks less adrift, not more. The owner proposed
// exactly this and I talked them out of it; both of us then agreed, and both of us were wrong for
// the same reason, because neither had measured the pane that was actually constrained.
//
// THE ONE HALF THAT SURVIVES is that COLLAPSING blog gives the canvas 284px of cream it cannot
// spend. The owner chose full parity anyway, and the argument is the gesture rather than the
// pixels: "get out of my way" is worth the same on both editors, and a distraction-free article
// at its true measure is a reasonable thing to want. Recorded so the trade is visible.

/** Which inspector. The two hold different content, so they measure different bounds. */
export type InspectorSurface = "cs" | "blog";

/**
 * The bounds, per surface. Each `min` is a MEASURED `min-content` of that inspector's own content
 * — below it the pane already overflows itself, so every width between 1 and the minimum renders
 * fields that are cut off. That is why "a 40px inspector is worse than none": there is nothing
 * useful down there, so the drag snaps past all of it to zero.
 *
 * ⚠ EACH `max` IS THE SURFACE'S OWN CANVAS FLOOR, which is one by-role sentence rather than two
 * numbers: the inspector may never be wider than the canvas's minimum, because the canvas is the
 * subject of the editor and the inspector is the apparatus. The floors differ because the canvases
 * do — the case study's is 1280 × `CS_MIN_SCALE`, blog's is the 68ch measure plus its padding.
 *
 * ⚠ AND THESE ARE SECOND COPIES, BECAUSE THE LEAF DISCIPLINE FORBIDS THE IMPORT. ralph loads this
 * as a raw `.ts` leaf, Node's ESM needs the extension to resolve one, and `tsc` rejects a `.ts`
 * extension without `allowImportingTsExtensions` — the property that makes this file testable is
 * the property that prevents the import. So it is the #194 shape, closed the way #194 closed it:
 * `studio-resize` asserts both identities and fails the moment either canvas floor moves.
 *
 * THE STATIC MAX IS RARELY WHAT BINDS. A wide inspector on a narrow page starves the canvas, and
 * the server cannot measure the page — so `InspectorResizer` applies a second, page-derived
 * ceiling at runtime. Both are needed: this keeps a stored cookie sane on the server, that keeps
 * a drag honest on the client.
 */
export const INSPECTOR_BOUNDS: Record<InspectorSurface, {
  min: number; max: number; fallback: number; cookie: string;
}> = {
  // 267 measured; 640 is CS_CANVAS_MIN_PX (1280 × 0.5).
  cs: { min: 267, max: 640, fallback: 320, cookie: "studio-inspector-w-cs" },
  // 185 measured; 794 is blog's canvas term, 68ch (745.9) plus 48px of padding.
  blog: { min: 185, max: 794, fallback: 320, cookie: "studio-inspector-w-blog" },
};

/** Collapsed. A real width rather than a flag, so the arithmetic never needs a special case. */
export const CS_INSPECTOR_COLLAPSED_PX = 0;

/** ⚠ THE DEFAULT IS 320 ON BOTH AND DELIBERATELY UNCHANGED, even though blog clips two fields
 *  there. Moving it would move blog's shipped geometry for every author who has never touched the
 *  handle, which is a different decision from making the pane adjustable. The clipping is
 *  pre-existing, it is now fixable by dragging, and it is recorded rather than quietly bundled. */
export const INSPECTOR_FALLBACK_PX = 320;

/** The custom property the width travels through. `ThreePaneShell`'s aside consumes it with a
 *  320px fallback, so a surface that has not declared it renders exactly as it did before. */
export const INSPECTOR_WIDTH_VAR = "--studio-inspector-w";

/**
 * Any stored or typed value → a width this build allows on that surface.
 *
 * ⚠ THE RANGE HAS A HOLE IN IT, WHICH IS THE WHOLE POINT. Legal widths are `0` or `min…max`, and
 * nothing between, because everything between is a pane whose content overflows it. So this does
 * not merely clamp — it SNAPS: a value under the halfway mark of the minimum falls to collapsed,
 * anything above it rises to the minimum. A plain `Math.max(min, …)` would make the collapse
 * unreachable by drag, which is the defect this shape exists to prevent.
 *
 * ⚠ AND THE SURFACE IS REQUIRED, WITH NO DEFAULT. The two sets of bounds differ, and a default
 * would silently apply one surface's floor to the other — which is the exact failure two cookies
 * exist to prevent, reintroduced one layer down.
 *
 * Missing, unparseable, negative and out-of-range all resolve rather than throw, because this runs
 * during a server render of the whole editor and a bad cookie must not be able to 500 it.
 */
export function clampInspectorWidth(raw: unknown, surface: InspectorSurface): number {
  const { min, max, fallback } = INSPECTOR_BOUNDS[surface];
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n)) return fallback;
  const px = Math.round(n);
  if (px >= min) return Math.min(max, px);
  // Below the minimum there is only one honest answer on each side of the gap.
  return px <= min / 2 ? CS_INSPECTOR_COLLAPSED_PX : min;
}

/** Is the pane collapsed at this width? One function so the shell's `inert`, the grip and the save
 *  bar's home cannot be computed separately and disagree — `isListCollapsed`'s rule. */
export function isInspectorCollapsed(px: number): boolean {
  return px <= CS_INSPECTOR_COLLAPSED_PX;
}
