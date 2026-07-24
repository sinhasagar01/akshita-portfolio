"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The ONE cursor glow. A single fixed-size radial layer moved with `translate3d` in a
 * rAF-throttled `pointermove` on its host (its parent element), so it stays on the
 * compositor and never repaints via `left`/`top` or `background-position` (the shape this
 * replaces used layout-property animation on two layers). Colour comes from the host's
 * `--glow-color`, so one component serves every surface (paper / tan / dark).
 *
 * Public-only by placement: it is mounted on the public hero(es) and the work section,
 * never in the studio canvas. It is disabled under `prefers-reduced-motion` (here) and on
 * touch, `@media (hover: none)` (CSS) — no pointer to follow.
 *
 * The host must be `position: relative; isolation: isolate; overflow: hidden` and reveal
 * the layer on hover; see `.cursor-glow` / `.glow-host` in globals.css.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const layer = ref.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
