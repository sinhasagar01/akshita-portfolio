"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * The warm-settle scroll reveal — but journey-aware.
 *
 * `.reveal-panel` ships clipped and `.reveal-card` ships opacity:0, so a section is
 * genuinely INVISIBLE until it reaches its final state. That means "don't animate"
 * can never mean "stay hidden": any section the reader did not scroll DOWN into must
 * appear in its final state immediately. The hazard is a section left at opacity:0
 * because the observer never fired for it — after a deep link, a refresh mid-page, or
 * a back/forward restore that lands past the hero.
 *
 * So the decision is made from the FIRST IntersectionObserver callback, which fires
 * after the landing scroll is already applied (ScrollManager restores in a layout
 * effect, before paint; the IO callback runs after paint):
 *   - fully above the viewport at first sight  → scrolled past on arrival → INSTANT.
 *   - in view at first sight → animate only if the page began at the very top (a real
 *     downward journey from the hero, i.e. the on-load intro); a mid-page landing
 *     shows it already-final so nothing replays → INSTANT otherwise.
 *   - below the fold at first sight → wait, then animate when it is scrolled into view.
 *
 * `once` semantics are preserved: the observer disconnects the moment a section
 * settles, so a revealed section never re-hides or replays on the way back up.
 * Reduced motion is always instant. The initial render stays 'armed' (matching the
 * server markup) so hydration does not mismatch; the effect adjusts after mount.
 */
export default function RevealSection({
  as: Tag = "section",
  id,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const [mode, setMode] = useState<"armed" | "reveal" | "instant">("armed");

  useEffect(() => {
    if (prefersReduced) {
      setMode("instant");
      return;
    }
    const el = ref.current;
    if (!el) return;

    // This runs after ScrollManager's layout-effect restore, so the geometry read here
    // is the true landing position. Decide synchronously — never depend on catching an
    // async observer frame, which back/forward remounts can outrun.
    const rect = el.getBoundingClientRect();
    const landedScrolled = window.scrollY > 0;
    if (rect.bottom <= 0 || (landedScrolled && rect.top < window.innerHeight)) {
      // Scrolled past, or landed with it already on screen without scrolling down into
      // it (deep link, refresh mid-page, back/forward restore) → final, no animation.
      setMode("instant");
      return;
    }

    // Below the fold, or the first viewport on a top load: arm the reveal. It animates
    // when scrolled into view (the downward journey, and the on-load intro), OR shows
    // instantly if it is scrolled clean past first — an anchor jump or a fast scroll can
    // skip a section without the observer ever firing, and a skipped section must not be
    // left hidden to animate on the way back up.
    let done = false;
    const finish = (next: "reveal" | "instant") => {
      if (done) return;
      done = true;
      setMode(next);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) finish("reveal");
      },
      { rootMargin: "-20% 0px", threshold: 0 },
    );
    let raf = 0;
    const check = () => {
      raf = 0;
      if (el.getBoundingClientRect().bottom <= 0) finish("instant");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [prefersReduced]);

  const state =
    mode === "reveal"
      ? " is-revealed"
      : mode === "instant"
        ? " is-revealed reveal-instant"
        : "";

  return (
    <Tag
      ref={ref}
      id={id}
      className={`py-section section-card reveal-panel${state}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Tag>
  );
}
