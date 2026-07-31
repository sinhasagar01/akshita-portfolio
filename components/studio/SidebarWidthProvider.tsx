"use client";

// The sidebar's width, shared by the chrome that draws it and the editors that budget around it.
//
// SEEDED FROM THE SERVER, WHICH IS WHAT AVOIDS THE FLASH. The dashboard layout is already an
// async server component calling `cookies()` for the owner session; it reads the width cookie in
// the same call and passes it here as `initial`. So the FIRST PAINT IS CORRECT rather than
// corrected. `localStorage` would have guaranteed the opposite — the server cannot read it, so
// every load would render the default and jump on mount, which is the flash `usePageWidthMin`'s
// header and #178's `animate` gate already exist to fight. Adding a second source of it for a
// preference would be a poor trade.
//
// NOT A NEW PATTERN. `StudioCountsProvider` in the same layout already takes server-computed
// values across the boundary as a prop. The layout stays a server component and nothing that
// renders on the server becomes a client component to make this work.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  clampSidebarWidth,
  SIDEBAR_COOKIE,
  SIDEBAR_DEFAULT_PX,
  SIDEBAR_WIDTH_VAR,
} from "@/lib/studio/sidebar-width";

type Ctx = {
  /** The committed width. Threshold arithmetic reads THIS, not the mid-drag value. */
  width: number;
  /** Paint a width without committing — the per-move write during a drag. */
  preview: (px: number) => void;
  /** Commit: state, cookie, and the property settle together. */
  commit: (px: number) => void;
};

const SidebarWidthContext = createContext<Ctx | null>(null);

/** The committed sidebar width in px. */
export function useSidebarWidth(): number {
  return useContext(SidebarWidthContext)?.width ?? SIDEBAR_DEFAULT_PX;
}

/** The resizer's handle onto preview/commit. Null outside the provider. */
export function useSidebarWidthControls(): Ctx | null {
  return useContext(SidebarWidthContext);
}

export default function SidebarWidthProvider({
  initial,
  className,
  children,
}: {
  initial: number;
  /** The layout's own root classes. THIS COMPONENT RENDERS THAT DIV rather than wrapping it:
   *  the property has to be declared on the element the server already renders, or the SSR value
   *  and the client's per-move write would land on two different ancestors and the closer one
   *  would win. Taking the class over adding a node keeps the DOM identical to before. */
  className?: string;
  children: ReactNode;
}) {
  const [width, setWidth] = useState(() => clampSidebarWidth(initial));
  const root = useRef<HTMLDivElement>(null);

  // ---- LIVE OR ON COMMIT: SPLIT BY KIND, AND THE SPLIT IS THE DESIGN --------------------
  //
  // THE CONTINUOUS PART IS LIVE AND COSTS NOTHING. `preview` writes the custom property
  // directly on the DOM node — no setState, so no React render per pointermove. The panes are
  // flex children, so they reflow natively, and `useFitToWidth` already observes the canvas pane
  // with a ResizeObserver, which means the canvas SCALE tracks the drag for free. The feedback
  // that matters is continuous and it is free.
  //
  // THE DISCRETE PART SETTLES ONCE. Whether the list collapses and whether the inspector folds
  // are threshold decisions, and re-evaluating them per move gives you a pane that pops shut and
  // open again as the pointer crosses a boundary — a layout arguing with the hand moving it. So
  // they read `width`, which only moves on `commit`.
  //
  // WHAT STOPS IT THRASHING IS STRUCTURAL, NOT A DEBOUNCE: the only per-move write is a CSS
  // property, and no threshold is consulted until the gesture ends. There is no timer to tune.
  //
  // AND THE ONE HONEST COST LANDS ON A GUARD THAT ALREADY EXISTS. Drag past the fit threshold
  // and the list stays open until release, so the canvas pane dips under its 640 floor for the
  // duration. `useFitToWidth`'s 50% clamp covers exactly that — the guard #235 established for
  // the explicit-open path, covering the mid-drag path cleanly without being told to.
  const preview = useCallback((px: number) => {
    root.current?.style.setProperty(SIDEBAR_WIDTH_VAR, `${clampSidebarWidth(px)}px`);
  }, []);

  const commit = useCallback((px: number) => {
    const next = clampSidebarWidth(px);
    setWidth(next);
    root.current?.style.setProperty(SIDEBAR_WIDTH_VAR, `${next}px`);
    // A UI preference on a single-owner tool: not httpOnly, not a secret, SameSite=Lax so it
    // rides ordinary navigation. One year, because a width you set once should stay set.
    document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <SidebarWidthContext.Provider value={{ width, preview, commit }}>
      {/* THE PROPERTY IS DECLARED HERE AND CONSUMED INSIDE `lg:` UTILITIES, WHICH IS WHAT MAKES
          THE BELOW-lg ANSWER STRUCTURAL. Below the breakpoint the sidebar is full width and
          stacked above `main`, a different composition on purpose — and because the width is
          only ever READ inside an `lg:` utility, the stored value simply does not apply there.
          An inline `style={{ width }}` on the aside would have applied at every width and needed
          a conditional to undo, which is the shape that decays. */}
      {/* `relative` is the resizer's containing block. The handle is absolutely positioned on the
          seam so it consumes no layout width — see SidebarResizer for what happened when it did. */}
      <div ref={root} className={`relative ${className ?? ""}`} style={{ [SIDEBAR_WIDTH_VAR]: `${width}px` } as React.CSSProperties}>
        {children}
      </div>
    </SidebarWidthContext.Provider>
  );
}
