// The studio sidebar's width — its bounds, and the clamp that makes a stored value advisory.
//
// Pure and dependency-free on purpose: `--experimental-strip-types` can only load a leaf, and
// ralph asserts against these bounds directly. Same constraint that shapes `three-pane.ts`.
//
// ---- WHERE THE BOUNDS COME FROM. MEASURED, NOT CHOSEN. -------------------------------------
//
// LOWER — 184. The sidebar's intrinsic shrink-to-fit width is 181px: below that the nav labels
// CLIP rather than ellipsise, because each link is `whitespace-nowrap` with no `truncate`. The
// widest label is "Case studies" at 84px. 184 is 181 on the 4px grid. (The logo row survives to
// 123, so the nav governs.)
//
// UPPER — 288, AND IT IS NOT COSMETIC. Above it the sidebar starts taking width the case-study
// editor needs for three panes. Measured at a 1536 viewport, page box 1521:
//
//     sidebar 184 -> canvas 753 (0.588)      sidebar 288 -> canvas 649 (0.507)
//     sidebar 236 -> canvas 701 (0.548)      sidebar 297 -> canvas 640 (0.500, exactly the floor)
//                                            sidebar 298 -> the list collapses
//
// So 288 sits 10px short of the width at which the editor restructures on the machine this is
// authored on, and leaves the canvas one notch (0.7%) above its 50% floor.
//
// ⚠ "288 IS SAFE" IS A FACT ABOUT A 1536 LAPTOP, NOT ABOUT THIS CONTROL. The fit threshold is
// `sidebarPx + CS_PANES_SUM`, so it is reactive: on a NARROWER display the collapse point falls
// INSIDE this range, and dragging to 288 there will collapse the list pane. That is the feature
// working correctly and it will look like a bug to whoever meets it first. Recorded here, at the
// definition, rather than only in the PR that shipped it.
//
// ---- THE CLAMP IS APPLIED ON THE READ, WHICH IS THE HALF THAT MATTERS -----------------------
//
// Clamping only on write is the bug this shape exists to avoid: a cookie written while the max
// was 320 outlives the build that allowed it, and would produce a sidebar the current build
// forbids. Clamping on READ makes the stored value ADVISORY — whatever is in the jar, the width
// that reaches the layout is inside today's bounds. The write clamps too, but only so the cookie
// is not misleading; the read is what is load-bearing, and ralph asserts it with an out-of-range
// input a normal test would never produce.

/** Narrowest the sidebar may be before the nav labels clip. */
export const SIDEBAR_MIN_PX = 184;

/** Widest before the sidebar starts costing the case-study editor its three panes. */
export const SIDEBAR_MAX_PX = 288;

/** The width the studio shipped with, and what an unset or unparseable cookie resolves to. */
export const SIDEBAR_DEFAULT_PX = 236;

/** The custom property the width travels through. Declared once; `StudioSidebar` and
 *  `PublishBar` both CONSUME it, which is how their hand-kept coupling stopped being two
 *  literals that had to be asserted equal (hazard 1, display half). */
export const SIDEBAR_WIDTH_VAR = "--studio-sidebar-w";

/**
 * Any stored or typed value → a width inside today's bounds.
 *
 * Accepts the cookie's string, a number, or junk. Missing, unparseable and out-of-range all
 * resolve rather than throw, because this runs during a server render of the whole dashboard
 * and a bad cookie must not be able to 500 the studio.
 */
export function clampSidebarWidth(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n)) return SIDEBAR_DEFAULT_PX;
  return Math.min(SIDEBAR_MAX_PX, Math.max(SIDEBAR_MIN_PX, Math.round(n)));
}

/** The cookie's name. Not httpOnly and not a secret — a UI preference on a single-owner tool. */
export const SIDEBAR_COOKIE = "studio-sidebar-w";
