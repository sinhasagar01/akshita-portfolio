"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";

// Layout effect on the client (so scroll lands before paint), plain effect on the
// server render where useLayoutEffect is a no-op and would warn.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The single owner of scroll position across navigation.
 *
 * Two things were broken and they share this seam:
 *  - Lenis is mounted once on the persistent layout, so it survives client navigation
 *    and keeps its target offset. Next scrolls to the top on a forward push, Lenis
 *    re-applies the old offset a frame later, and the new page opens mid-scroll.
 *  - `scrollRestoration` was set to "manual" but nothing ever restored a position, so
 *    back/forward carried the outgoing page's raw offset onto a page of different
 *    height — landing on whatever section happened to sit at that pixel.
 *
 * This distinguishes a PUSH from a POP and drives BOTH the native scroll and Lenis so
 * neither can re-apply a stale value:
 *  - PUSH (a new forward navigation) → top. Every page opens at its hero.
 *  - POP  (back/forward) → the exact offset saved for that history entry.
 *
 * Manual restoration is owned here (not in the head script or the Lenis provider) so
 * there is one authority. Positions are keyed by pathname and mirrored to
 * sessionStorage so a genuine reload-then-back also restores. Reduced motion has no
 * Lenis, so it drives the native scroll with the same rules.
 */
export default function ScrollManager() {
  const pathname = usePathname();
  const lenis = useLenis();
  const prefersReduced = useReducedMotion();

  const pathRef = useRef(pathname);
  const isPopRef = useRef(false);
  const positionsRef = useRef<Record<string, number>>({});

  // Own manual restoration and load any positions saved before a reload.
  useEffect(() => {
    try {
      positionsRef.current = JSON.parse(
        sessionStorage.getItem("akshita:scroll") || "{}",
      );
    } catch {
      positionsRef.current = {};
    }
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);

  // A back/forward fires popstate before the pathname effect runs, so the effect can
  // tell a history pop from a fresh push.
  useEffect(() => {
    const onPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Keep the current page's offset current, so leaving it (or reloading) preserves the
  // exact position for a later restore. rAF-coalesced; the ref tracks the live path.
  useEffect(() => {
    let raf = 0;
    const save = () => {
      raf = 0;
      positionsRef.current[pathRef.current] = window.scrollY;
      try {
        sessionStorage.setItem(
          "akshita:scroll",
          JSON.stringify(positionsRef.current),
        );
      } catch {
        // sessionStorage can be unavailable (private mode); in-memory still restores.
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(save);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // On a route change, place the scroll before paint so the reveal system (which
  // decides from its first post-paint observation) sees the true landing offset.
  useIsoLayoutEffect(() => {
    if (pathname === pathRef.current) return;
    const isPop = isPopRef.current;
    isPopRef.current = false;
    pathRef.current = pathname;

    const target = isPop ? positionsRef.current[pathname] ?? 0 : 0;

    // Native first so window.scrollY reads the target synchronously, then Lenis so its
    // internal target matches and it cannot animate back to the old offset.
    window.scrollTo(0, target);
    if (lenis && !prefersReduced) {
      lenis.scrollTo(target, { immediate: true, force: true });
    }
  }, [pathname, lenis, prefersReduced]);

  return null;
}
