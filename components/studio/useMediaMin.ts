"use client";

// `matchMedia` as React state, without a hydration mismatch.
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
// WHY useSyncExternalStore AND NOT useEffect. A `useState` seeded in an effect renders once
// with a wrong value and corrects on the next frame, which is a visible flash on every
// mount. `useSyncExternalStore` subscribes to the MediaQueryList directly and takes its
// server value from `getServerSnapshot`, so React never compares a client-only read against
// server HTML and never warns. The one cost is real and accepted: the server cannot know
// the viewport, so a narrow first paint renders the wide layout and corrects on hydration.
// This is an authenticated, client-rendered, single-owner tool behind a login, not a page
// with a first-paint budget.
import { useCallback, useSyncExternalStore } from "react";

/**
 * True when the viewport is at least `px` wide.
 *
 * @param px the breakpoint, ALWAYS passed from a named constant rather than a literal —
 *           that single-source property is what ralph/tests/three-pane.mjs asserts.
 */
export function useMediaMin(px: number): boolean {
  const query = `(min-width: ${px}px)`;

  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      // `addEventListener("change")` rather than the deprecated `addListener`. Safari
      // gained this in 14 and the studio has no older target.
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // THE SERVER ALWAYS SAYS WIDE. It has to say something, and saying wide means the
  // markup React hydrates against is the three-pane layout — the case the editor is
  // designed for and the one an author on the 1536 laptop sees with no correction at all.
  const getServerSnapshot = useCallback(() => true, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
