"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { scrollTargetFor, landingOffset } from "@/lib/scroll-target";

// Layout effect on the client (so scroll lands before paint), plain effect on the
// server render where useLayoutEffect is a no-op and would warn.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The element the current URL's hash names, or null.
 *
 * ⚠ READ FROM `window.location` BECAUSE NEXT DOES NOT EXPOSE THE HASH. `usePathname()` strips it
 * and there is no `useHash`; `PageLoader` reads it the same way for the same reason. It is read at
 * effect time rather than captured, because this effect runs after the route commits and the URL
 * is already the new one.
 */
function hashElement(): HTMLElement | null {
  const hash = window.location.hash;
  if (hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    // A malformed escape in the hash — treat it as no target rather than throwing inside a
    // layout effect, which would take the whole navigation down.
    return null;
  }
}

/**
 * Where to land so an element sits where a native hash jump would put it.
 *
 * ⚠ `scroll-margin-top` IS THE HALF A HAND-ROLLED JUMP FORGETS. Every section carries
 * `scroll-mt-20` so the fixed 72px header does not cover its heading, and a browser honours that
 * on a real hash navigation. Computing `rect.top + scrollY` alone would put the heading under the
 * nav — correct arithmetic, wrong by 80px, on every landing.
 */
function offsetOf(el: HTMLElement): number {
  return landingOffset(
    el.getBoundingClientRect().top,
    window.scrollY,
    parseFloat(getComputedStyle(el).scrollMarginTop) || 0,
  );
}

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
 *  - PUSH (a new forward navigation) → the URL's hash target if it names an element on the new
 *    page, otherwise top. Every page opens at its hero unless the link asked for a section.
 *  - POP  (back/forward) → the exact offset saved for that history entry.
 *
 * ⚠ THE HASH ARM IS THIRD AND IT WAS MISSING, WHICH MADE EVERY SECTION LINK FROM A NON-HOME PAGE
 * LAND AT THE HERO. `usePathname()` does not carry the hash, so a push to `/#work` resolved to
 * `target = 0` here — and nothing else applied it either, because the nav's section links carry
 * `scroll={false}` and their click handler returns early when it is not home. Measured on
 * production: nav "Work" from `/projects/fosfor-ai` gave `url /#work, scrollY 0, #work top 855`.
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

    // ⚠ A PUSH TO A HASHED ROUTE LANDS ON THE SECTION, NOT THE TOP — AND THIS READ `usePathname()`
    // ALONE, WHICH DOES NOT CARRY THE HASH. Every section entry in the nav is `/#<id>` from any
    // page that is not home, and those links carry `scroll={false}` while `handleNavClick` returns
    // early when it is not home. So NOTHING applied the hash, and this effect then forced 0.
    // Measured on production before the fix, clicking nav "Work" from `/projects/fosfor-ai`:
    //
    //     url /#work    scrollY 0    #work top 855    — the reader is at the hero
    //
    // The section they asked for was never scrolled to. That is five nav entries from every
    // non-home page, plus the gallery hero's "See the work instead", rather than the one latent
    // link this was boarded as.
    const hashTarget = hashElement();
    const target = scrollTargetFor({
      kind: isPop ? "pop" : "push",
      hashOffset: hashTarget ? offsetOf(hashTarget) : null,
      savedOffset: positionsRef.current[pathname],
    });

    // Native first so window.scrollY reads the target synchronously, then Lenis so its
    // internal target matches and it cannot animate back to the old offset.
    window.scrollTo(0, target);
    if (lenis && !prefersReduced) {
      lenis.scrollTo(target, { immediate: true, force: true });
    }
  }, [pathname, lenis, prefersReduced]);

  return null;
}
