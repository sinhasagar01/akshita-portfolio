"use client";

import { useEffect, useRef } from "react";

/* The accent at an alpha, as an inline-style string. `color-mix` is used rather than a second
 * `--color-*` token per alpha because these are four one-off strengths for one component, and a
 * token each would be four names nobody else says. */
const ACCENT = (pct: number) =>
  `color-mix(in srgb, var(--color-accent-500) ${pct}%, transparent)`;

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    // Fine pointer only, and never under reduced motion: the custom cursor is itself
    // motion (the ring resizes/eases on hover) and it hides the OS pointer. Reduced-motion
    // visitors keep their native cursor rather than an animated stand-in.
    if (!fine || reduce) return;

    const html = document.documentElement;
    html.classList.add("has-custom-cursor");

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    let mx = 0, my = 0, rx = 0, ry = 0, shown = false;
    let rafId = 0;

    function setRing(w: string, h: string, bg: string, bc: string) {
      ring.style.width = w;
      ring.style.height = h;
      ring.style.background = bg;
      ring.style.borderColor = bc;
    }

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
      if (!shown) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    }

    /* ⚠ THE CURSOR WAS RULED A SIGNATURE ON A ONE-THEME SITE, WHICH IS TO SAY THE TEST WAS NEVER RUN.
     * The boundary entry read "it HAS NO SIBLING TO DISAGREE WITH … it holds across all four themes
     * deliberately". The first half was true and the second was never exercised: with one palette
     * shipped, "holds across themes" and "was only ever seen on one" are the same observation.
     *
     * Harbour ran it. A terracotta cursor on a teal site is not a signature, it is a leak.
     *
     * ⚠ AND IT WAS NOT EVEN ITS OWN COLOUR. `#B5613C` is rgb(181,97,60); cream's accent-500 is
     * rgb(182,83,41) — a distance of 23.6, hue 43.6 against 41.9, chroma .120 against .140. A
     * HAND-TYPED NEAR-COPY OF THE ACCENT, drifted by exactly as much as retyping a colour drifts it.
     * So this is not a signature being given up. It is a second spelling of the accent being spelled
     * once. */
    function onLeave() {
      shown = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    }

    function onOver(e: MouseEvent) {
      const t = e.target as Element;
      if (t.closest("input,textarea,select,[contenteditable]")) {
        dot.style.opacity = "0";
        ring.style.opacity = "0";
        return;
      }
      if (t.closest('[data-cursor="card"]')) {
        setRing("84px", "84px", ACCENT(12), "transparent");
        dot.style.opacity = "0";
        return;
      }
      if (t.closest('a,button,[role="button"],.cursor-link')) {
        setRing("46px", "46px", "transparent", ACCENT(80));
        if (shown) dot.style.opacity = "1";
        return;
      }
    }

    function onOut(e: MouseEvent) {
      const t = e.target as Element;
      if (
        t.closest(
          'input,textarea,select,[contenteditable],[data-cursor="card"],a,button,[role="button"],.cursor-link'
        )
      ) {
        setRing("34px", "34px", "transparent", ACCENT(55));
        if (shown) {
          dot.style.opacity = "1";
          ring.style.opacity = "1";
        }
      }
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      html.classList.remove("has-custom-cursor");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--color-accent-500)",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity .2s",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `1.5px solid ${ACCENT(55)}`,
          background: "transparent",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0,
          transition: "width .25s, height .25s, background .25s, border-color .25s, opacity .2s",
        }}
      />
    </>
  );
}
