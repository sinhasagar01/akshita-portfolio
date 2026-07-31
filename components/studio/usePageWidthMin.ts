"use client";

// The PAGE BOX as React state, without a hydration mismatch.
//
// WHY A HOOK AND NOT A TAILWIND VARIANT. Two of the three-pane shell's responsive
// decisions cannot be expressed in CSS at all, so the width has to reach JavaScript:
//
//   - `inert` on the collapsed list pane is an ATTRIBUTE. CSS can take a pane to `width: 0`
//     but cannot take it out of the tab order, and a 0-width pane whose contents are still
//     tabbable is exactly the focus trap G3 exists to catch.
//   - The inspector must render EXACTLY ONCE. Below the fold it belongs inside the canvas
//     pane's Inspector view and above it inside the aside. A CSS answer means both copies
//     exist in the tree with one hidden, which is two form trees sharing one `onChange`,
//     two sets of colliding ids, and two carets. Choosing the parent is a JS decision.
//
// Once the width is in JS for those, driving the width transition from the same source
// removes the duplicated literal as well. See lib/studio/three-pane.ts.
//
// ---- WHY THIS IS NOT `matchMedia`, AND WHY THAT WAS A REAL BUG ------------------------
//
// This was `useMediaMin`, and it asked `matchMedia("(min-width: 1460px)")`. **`matchMedia`
// matches the VIEWPORT. Every pane divides the PAGE BOX.** `scrollbar-gutter: stable` on `html`
// (globals.css:222) permanently reserves the difference, so the two are never equal here:
//
//     window.innerWidth                                 1475
//     documentElement.getBoundingClientRect().width     1460   <- what the panes divide
//     body.clientWidth                                  1460
//
// The thresholds are PAGE-SPACE SUMS and always were — the case study's was
// `236 + 264 + 640 + 320`, describing a page rather than a viewport. (The sidebar term has since
// become a runtime value and the composite constants were deleted with it; the sum is now
// `sidebarPx + CS_PANES_SUM`, which is the same arithmetic with one term no longer frozen.) So at a 1460 VIEWPORT the canvas got 625 rather than
// 640, the raw fit was 0.488, and `useFitToWidth`'s 50% clamp was quietly covering the
// difference. THE NUMBERS WERE RIGHT; THE COMPARISON WAS WRONG. Not one constant changed to fix
// it. Driven at a 1475 viewport, where the page box is exactly 1460: canvas 640, raw fit 0.500.
//
// It also removes a machine dependency. The gap is this machine's scrollbar width — 0 where
// scrollbars are overlays, ~17 on Windows — so until now the thresholds were accurate or not
// depending on whose laptop the studio ran on.
//
// ---- WHY `documentElement` AND NOT THE SHELL, WHICH IS WHAT THE TRIGGER ASKED FOR ------
//
// STATE recorded this as "matchMedia -> a ResizeObserver on the shell". **Measuring the shell is
// CIRCULAR and would have been a worse bug than the one being fixed.** The shell's root is a flex
// ROW container with `min-width: auto`, so its width is set by its own panes' min-content — at a
// 900px viewport it measures **1309px inside an 885px page**, and a threshold read off it would
// answer "fits" where nothing fits. `<main>` and the shell's parent stay at 885 because they are
// `min-w-0` or column items; only the shell overflows.
//
// `documentElement` is the honest subject: it is the page box the layout is handed, it is never
// content-sized, and it is not a node any component renders — which is why the contract below
// did not have to change.
import { useCallback, useSyncExternalStore } from "react";

/** The page box's width — what the layout actually receives, reserved gutter already excluded. */
const pageWidth = () => document.documentElement.getBoundingClientRect().width;

/**
 * True when the PAGE BOX is at least `px` wide.
 *
 * @param px the breakpoint, ALWAYS passed from a named constant rather than a literal —
 *           that single-source property is what ralph/tests/three-pane.mjs asserts.
 */
export function usePageWidthMin(px: number): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    // A ResizeObserver rather than a `resize` listener: the page box can change without the
    // window doing so. The reserved gutter is stable here, but a zoom or a root font-size
    // change moves the box, and the observer sees those where a resize handler does not.
    const ro = new ResizeObserver(onChange);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  const getSnapshot = useCallback(() => pageWidth() >= px, [px]);

  // THE SERVER ALWAYS SAYS WIDE. It has to say something, and saying wide means the
  // markup React hydrates against is the three-pane layout — the case the editor is
  // designed for and the one an author on the 1536 laptop sees with no correction at all.
  //
  // THE CONTRACT DID NOT CHANGE WHEN THE SUBJECT DID, AND THAT IS WORTH KNOWING. A measured
  // value normally cannot have a server snapshot, because there is no node to measure until
  // mount — so this was expected to become "a boolean subscription becomes a value that does
  // not exist until mount", with a first frame that has to guess. **It evaporates because
  // `documentElement` is not a node a component renders.** There is no ref to be null:
  // `getSnapshot` runs during the first client render against a node that is already there and
  // reads the REAL page width, exactly as `matchMedia` did. No first-frame guess was invented,
  // `useSyncExternalStore` still avoids the render-once-wrong flash its presence is for, and
  // #178's "animate on explicit toggles only" fix is untouched — the hydration correction it
  // exists for is unchanged in shape and still happens on a narrow load.
  const getServerSnapshot = useCallback(() => true, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
