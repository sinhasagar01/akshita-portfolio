/* ============================================================================================
   THE REVEAL DECISION, AS A PURE FUNCTION — EXTRACTED AFTER A DEADLOCK NOTHING COULD ASSERT.

   `RevealSection` decides whether a panel appears instantly or animates in, and the decision
   lived inside a `useEffect` reading `window`. Nothing could test it: a source regex proves the
   words are in the file and nothing about which branch runs, which is this repository's standing
   reason for extraction (`bar-clearance.ts` and `draft-status-text.ts` are the precedents).

   ⚠ THE DEFECT THAT FORCED IT. `.reveal-panel` ships `clip-path: inset(0 0 100%)`, which leaves a
   ZERO-HEIGHT STRIP at the panel's own top, and IntersectionObserver clips the intersection rect
   against it. With a top inset on the observer's root the strip has to pass THROUGH the band to be
   seen — so a hash landing, which puts the strip ABOVE the band, left the panel hidden by a clip
   that blinded the observer that would remove it. Scrolling down moved the strip further away.
   Only scrolling back UP, or clean past the bottom, resolved it.

   Measured on production, panel at top 72 in an 872px viewport:

       rootMargin "-20% 0px"         isIntersecting false    band 174..698, strip at 72
       rootMargin "0px 0px -20% 0px" isIntersecting true     band   0..698
       clip removed, "-20% 0px"      isIntersecting true     the clip is the blocker

   A DEADLOCK RATHER THAN A RACE, and the difference matters: a race is fixed by waiting and this
   could not be. It was misread as a probe artefact earlier the same day, on the grounds that
   programmatic scrolling had "outrun the observer" — the observer was never going to fire.
============================================================================================ */

export type RevealMode = "armed" | "reveal" | "instant";

export type MountInput = {
  prefersReduced: boolean;
  /** `window.location.hash`, including the leading '#'. */
  hash: string;
  /** The panel's own id, when it has one. */
  id?: string;
  rectTop: number;
  rectBottom: number;
  scrollY: number;
  innerHeight: number;
};

/**
 * What a panel should be at mount. `armed` means hand off to the observer.
 *
 * ⚠ THE HASH RULE COMES FIRST AND DOES NOT READ THE SCROLL, WHICH IS THE WHOLE REPAIR. A deep
 * link to a panel is a request to see it, and the scroll position is exactly what cannot be
 * trusted at this moment: `PageLoader` freezes the page at 0 for the loader's duration and
 * applies the hash target only after it lifts, so this runs while `scrollY` is still 0 and the
 * geometry rule below reads a "top load" that is really a deep link. The loader is
 * once-per-session, which is why the symptom was intermittent.
 */
export function revealModeOnMount(i: MountInput): "armed" | "instant" {
  if (i.prefersReduced) return "instant";
  if (i.id && i.hash === `#${i.id}`) return "instant";
  // Scrolled clean past on arrival.
  if (i.rectBottom <= 0) return "instant";
  // Landed with it already on screen without travelling down into it — a mid-page refresh or a
  // back/forward restore. Showing it already-final means nothing replays under the reader.
  if (i.scrollY > 0 && i.rectTop < i.innerHeight) return "instant";
  return "armed";
}

/**
 * The scroll fallback for a panel still armed, or null to keep waiting.
 *
 * ⚠ THE `top < 0` ARM IS UNREACHABLE ON A DOWNWARD JOURNEY, which is what keeps it from
 * pre-empting the animation it guards. The strip crosses the observer's band at 80% of the
 * viewport long before it reaches 0, so a still-armed panel whose top is above the fold means the
 * observer was never given its chance — a landing scroll applied after the mount decision.
 */
export function revealModeOnScroll(rectTop: number, rectBottom: number): "instant" | null {
  if (rectBottom <= 0) return "instant";
  if (rectTop < 0) return "instant";
  return null;
}

/**
 * The observer's root margin. Bottom inset only.
 *
 * ⚠ A TOP INSET IS THE DEADLOCK. It is exported so the gate can assert the absence rather than
 * grep a component for a string, and so the next person to reach for symmetry meets the reason.
 * The bottom inset governs the downward journey, so the trigger point for a reader scrolling into
 * a section is unchanged by dropping the top one.
 */
export const REVEAL_ROOT_MARGIN = "0px 0px -20% 0px";
