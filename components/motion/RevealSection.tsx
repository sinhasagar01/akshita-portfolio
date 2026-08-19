"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import {
  revealModeOnMount,
  revealModeOnScroll,
  REVEAL_ROOT_MARGIN,
} from "@/lib/reveal-mode";

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
    const el = ref.current;
    if (!el) return;

    // ⚠ THE DECISION LIVES IN `lib/reveal-mode.ts` AND IS CALLED HERE. It used to be written
    // inline, where nothing could assert it — a source regex proves the words are in the file
    // and nothing about which branch runs. `reveal-mode` A covers every case including the two
    // that regressed, and this call site is the only place `window` is read.
    const r0 = el.getBoundingClientRect();
    if (
      revealModeOnMount({
        prefersReduced: !!prefersReduced,
        hash: window.location.hash,
        id,
        rectTop: r0.top,
        rectBottom: r0.bottom,
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
      }) === "instant"
    ) {
      setMode("instant");
      return;
    }

    // Below the fold on a top load: arm the reveal. It animates when scrolled into view (the
    // downward journey, and the on-load intro), OR shows instantly if the reader gets past it
    // without the observer firing — a skipped section must never be left hidden.
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
      { rootMargin: REVEAL_ROOT_MARGIN, threshold: 0 },
    );
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (revealModeOnScroll(r.top, r.bottom) === "instant") finish("instant");
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
  }, [prefersReduced, id]);

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
