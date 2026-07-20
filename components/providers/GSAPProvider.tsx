"use client";

import { useEffect, ReactNode } from "react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { ScrollTrigger } from "@/lib/gsap";

export default function GSAPProvider({ children }: { children: ReactNode }) {
  const lenis = useLenis();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!lenis || prefersReduced) return;

    const update = () => ScrollTrigger.update();
    lenis.on("scroll", update);
    ScrollTrigger.refresh();
    // Don't yank the page to the top when arriving on a deep link (e.g. /#work) — the
    // hash target owns the scroll position. Only reset when there is no hash.
    if (!window.location.hash) {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
    // Web fonts (Fraunces / DM Sans) swap in after first paint and reflow the content
    // above the pinned ScrollTrigger sections (Process, BeforeAfterStory), leaving their
    // start/end offsets stale on first load. Refresh once fonts settle so the scrub
    // boundaries are correct. Centralised here so every ScrollTrigger benefits.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      lenis.off("scroll", update);
    };
  }, [lenis, prefersReduced]);

  return <>{children}</>;
}
