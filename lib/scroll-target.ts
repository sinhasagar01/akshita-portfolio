/* ============================================================================================
   WHERE A NAVIGATION LANDS — EXTRACTED SO THE RULE CAN BE ASSERTED RATHER THAN OBSERVED.

   `ScrollManager` is the single owner of scroll position across navigation, and its rule lived
   inside a layout effect reading `window`. Nothing could test it, which is the same reason
   `lib/reveal-mode.ts` exists: a source regex proves the words are in the file and nothing about
   which branch runs.

   ⚠ THE DEFECT THAT FORCED IT. `usePathname()` does not carry the hash, so a PUSH to `/#work`
   resolved to `target = 0` — and nothing else applied the hash either, because the nav's section
   links carry `scroll={false}` and their click handler returns early when it is not home. Measured
   on production, clicking nav "Work" from `/projects/fosfor-ai`:

       url /#work    scrollY 0    #work top 855    — the reader is at the hero

   THE SECTION THEY ASKED FOR WAS NEVER SCROLLED TO. Five nav entries from every non-home page,
   plus the gallery hero's "See the work instead" — not the single latent link this was boarded as.

   ⚠ AND IT IS THE SECOND HALF OF A DEFECT WHOSE FIRST HALF SHIPPED IN #693. That one made a
   hash-named panel appear instantly instead of staying blank; this one is that you never travel to
   it. Same report, two mechanisms, and fixing the visible one first is why the second was still
   there to find.
============================================================================================ */

export type NavKind = "push" | "pop";

export type TargetInput = {
  kind: NavKind;
  /** Offset of the element the URL's hash names, or null when there is no such element. */
  hashOffset: number | null;
  /** The offset saved for this path by a previous visit, if any. */
  savedOffset: number | undefined;
};

/**
 * Where a navigation should place the scroll.
 *
 * ⚠ THE HASH OUTRANKS THE SAVED POSITION ON A PUSH AND NOT ON A POP, and the asymmetry is the
 * decision rather than an oversight. A push carries an intent the reader just expressed — they
 * clicked a link naming a section. A pop carries a position the reader left behind, and a hash
 * still sitting in that history entry is a description of where they were, not a request. Letting
 * the hash win a pop would drag a reader back to a section they had scrolled away from before
 * leaving, which is the restore defect this file's owner was written to fix.
 */
export function scrollTargetFor(i: TargetInput): number {
  if (i.kind === "push") return i.hashOffset ?? 0;
  return i.savedOffset ?? 0;
}

/**
 * The landing offset for an element, honouring its own scroll margin.
 *
 * ⚠ `scroll-margin-top` IS THE HALF A HAND-ROLLED JUMP FORGETS. Every section carries
 * `scroll-mt-20` so the fixed 72px header does not cover its heading, and a browser honours that
 * on a real hash navigation. `rect.top + scrollY` alone is correct arithmetic that lands 80px
 * wrong every time, with the heading under the nav.
 */
export function landingOffset(
  rectTop: number,
  scrollY: number,
  scrollMarginTop: number,
): number {
  return Math.max(0, scrollY + rectTop - scrollMarginTop);
}
