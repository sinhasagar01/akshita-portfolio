// The case-study index's view preference — its values, its cookie, and the parse that makes a
// stored value advisory.
//
// Pure and dependency-free on purpose, the same constraint that shapes `sidebar-width.ts` and
// `three-pane.ts`: `--experimental-strip-types` can only load a leaf, and ralph asserts against
// these directly.
//
// ---- WHY A COOKIE AND NOT localStorage -----------------------------------------------------
//
// The view has to be known BEFORE the first paint or the author watches the wrong one flip to
// the right one on every load. `localStorage` cannot be read on the server, so it guarantees
// exactly that flash — and a hydration correction is the thing #178 spent a whole PR removing.
// A cookie is readable by the server component that renders the page, so the first HTML is
// already correct and there is nothing to animate away. #237 chose this for the sidebar width
// for the same reason, and this reuses the mechanism rather than the module.
//
// ---- READ BY THE ROUTE, NOT BY THE LAYOUT --------------------------------------------------
//
// The dashboard layout already calls `cookies()`, so putting this there looks like one fewer
// call. It is not: that layout serves TEN pages and this value belongs to ONE, so the layout
// would carry a projects-only prop through nine surfaces that never read it.
// `projects/page.tsx` is already dynamic — it awaits `getStudioData()` — so reading the jar
// there costs nothing and keeps the value where its consumer is. Same shared-seam question
// #239, #240 and #244 each answered the same way: ask what the seam is shared BY before
// deciding it is shared FOR this.

/** The two presentations of the same content. */
export type IndexView = "grid" | "list";

/**
 * GRID IS THE DEFAULT, AND THAT IS A CLAIM ABOUT WHAT THE PAGE IS FOR. An author arriving here
 * is choosing which study to open, and recognising a hero is faster than reading a title.
 * Ordering is the rarer errand and it is one click away.
 */
export const INDEX_VIEW_DEFAULT: IndexView = "grid";

/** A UI preference on a single-owner tool, so not httpOnly and not a secret. */
export const INDEX_VIEW_COOKIE = "studio-projects-view";

/**
 * Whatever is in the jar, what reaches the page is one of the two legal values.
 *
 * THE PARSE IS ON THE READ, WHICH IS THE HALF THAT MATTERS — `sidebar-width.ts`'s rule applied
 * to a closed set rather than a range. A cookie written by a build that offered a third view
 * outlives that build, and an unknown value must fall back rather than render nothing.
 */
export function parseIndexView(raw: unknown): IndexView {
  return raw === "list" ? "list" : INDEX_VIEW_DEFAULT;
}
