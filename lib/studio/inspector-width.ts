// The case-study inspector's width — its bounds, and the clamp that makes a stored value advisory.
//
// The same shape as `sidebar-width.ts`, deliberately: bounds, a clamp applied ON THE READ, a
// cookie and a custom property. #237 settled that shape and this is its second application, not a
// new pattern. Pure and DEPENDENCY-FREE, so `--experimental-strip-types` can load it and ralph
// can assert the clamp directly.
//
// ---- ⚠ THE CASE STUDY ONLY, AND THE ASYMMETRY IS THE DESIGN ---------------------------------
//
// Blog's inspector does NOT resize and has no bounds here. Both panes sit in the same shell, so
// the obvious move is to give both the same control — and it is wrong, because the panes are for
// different things.
//
//     the case-study canvas SCALES     reclaimed width becomes a larger render, and
//                                      `CS_MIN_SCALE` stops binding sooner. The width is USED.
//     blog's canvas is a FIXED MEASURE the article is 68ch and never widens (locked decision).
//                                      Every pixel the inspector gives or takes is CREAM.
//
// MEASURED: blog renders a 746px column in a 995px pane today. At a zero inspector that pane is
// ~1315px and the column sits in it with 284px of empty cream on each side — an article adrift in
// a pane that has nothing to do with it. Honouring the letter of the locked decision while
// producing that satisfies the rule and defeats its purpose.
//
// ⚠ AND WIDENING BLOG'S INSPECTOR IS DECORATION IN THE SAME WAY, which is the half that is easy
// to miss: narrowing the cream by widening the pane still moves nothing but margin, because the
// measure is fixed in both directions. A control whose ENTIRE RANGE moves only margin is a
// control with no purpose. So blog's inspector is fixed, full stop — not "resizes but does not
// collapse", which was considered and rejected on exactly this ground.
//
// The ninth by-role answer in this project: ask what the pane is FOR, not what the other one does.
/**
 * Narrowest the inspector may be before it is a broken pane rather than a narrow one.
 *
 * ⚠ MEASURED, NOT CHOSEN — `min-content` of the case-study inspector's own content, read off the
 * live pane. Below it the content already overflows the box that holds it, so every width in
 * 1…266 renders a pane whose fields are cut off. That is why "a 40px inspector is worse than
 * none": there is no useful width down there to snap to, so the drag snaps past all of it.
 *
 * Blog's equivalent measures 185 and is recorded here only to say why it is not used: the two
 * panes hold different things, so a single floor would be wrong for one of them. Blog is fixed,
 * so its number has no consumer and is deliberately not exported.
 */
export const CS_INSPECTOR_MIN_PX = 267;

/**
 * Widest the inspector may be, and it is a BY-ROLE bound rather than a taste one.
 *
 * The inspector may never be wider than the canvas's own floor. The canvas is the subject of this
 * editor and the inspector is the apparatus; an apparatus wider than its subject has the roles
 * backwards. So this IS `CS_CANVAS_MIN_PX`, and 640 is that number.
 *
 * ⚠ IT IS A SECOND COPY, AND THE LEAF DISCIPLINE IS WHY. Importing the constant is the obvious
 * move and it does not survive: ralph loads these modules as raw `.ts` leaves, Node's ESM needs
 * the extension to resolve one, and `tsc` rejects a `.ts` extension without
 * `allowImportingTsExtensions`. The thing that makes these files testable is the thing that
 * forbids the import. So it is the #194 shape — two copies of one measurement — and it is closed
 * the way #194 closed it, by a gate ASSERTING THE IDENTITY rather than by construction.
 * `studio-resize` A1 fails the moment the scale floor moves and this does not.
 *
 * ⚠ THIS IS THE STATIC MAX ONLY. A wide inspector on a narrow page still starves the canvas, and
 * the server cannot measure the page — so `InspectorResizer` applies a second, page-derived
 * maximum at runtime. Both are needed: this one keeps a stored cookie sane on the server, that
 * one keeps a drag honest on the client.
 */
export const CS_INSPECTOR_MAX_PX = 640;

/** Collapsed. A real width rather than a flag, so the arithmetic never needs a special case. */
export const CS_INSPECTOR_COLLAPSED_PX = 0;

/** The width the case-study editor shipped with, and what an unset or unparseable cookie means. */
export const CS_INSPECTOR_DEFAULT_PX = 320;

/** The custom property the width travels through. `ThreePaneShell`'s aside consumes it with a
 *  320px FALLBACK, which is what keeps blog — who never sets it — on exactly today's geometry. */
export const INSPECTOR_WIDTH_VAR = "--studio-inspector-w";

/** The cookie's name. Not httpOnly and not a secret — a UI preference on a single-owner tool. */
export const CS_INSPECTOR_COOKIE = "studio-inspector-w-cs";

/**
 * Any stored or typed value → a width this build allows.
 *
 * ⚠ THE RANGE HAS A HOLE IN IT, WHICH IS THE WHOLE POINT. Legal widths are `0` or
 * `CS_INSPECTOR_MIN_PX…CS_INSPECTOR_MAX_PX`, and nothing in between, because everything in
 * between is a pane whose content overflows it. So this does not merely clamp — it SNAPS: a value
 * under the halfway mark of the minimum falls to collapsed, and anything above it rises to the
 * minimum. A plain `Math.max(MIN, …)` would make the collapse unreachable by drag.
 *
 * Missing, unparseable, negative and out-of-range all resolve rather than throw, because this runs
 * during a server render of the whole editor and a bad cookie must not be able to 500 it.
 */
export function clampInspectorWidth(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n)) return CS_INSPECTOR_DEFAULT_PX;
  const px = Math.round(n);
  if (px >= CS_INSPECTOR_MIN_PX) return Math.min(CS_INSPECTOR_MAX_PX, px);
  // Below the minimum there is only one honest answer on each side of the gap.
  return px <= CS_INSPECTOR_MIN_PX / 2 ? CS_INSPECTOR_COLLAPSED_PX : CS_INSPECTOR_MIN_PX;
}

/** Is the pane collapsed at this width? One function so the shell's `inert`, the grip's label and
 *  the save bar's home cannot be computed separately and disagree — `isListCollapsed`'s rule. */
export function isInspectorCollapsed(px: number): boolean {
  return px <= CS_INSPECTOR_COLLAPSED_PX;
}
