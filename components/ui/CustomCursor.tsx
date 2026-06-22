"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer:fine)").matches;
    if (!fine) return;

    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
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
      if (reduce) {
        ring.style.left = mx + "px";
        ring.style.top = my + "px";
      }
      if (!shown) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    }

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
        setRing("84px", "84px", "rgba(181,97,60,.12)", "transparent");
        dot.style.opacity = "0";
        return;
      }
      if (t.closest('a,button,[role="button"],.cursor-link')) {
        setRing("46px", "46px", "transparent", "rgba(181,97,60,.8)");
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
        setRing("34px", "34px", "transparent", "rgba(181,97,60,.55)");
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

    if (!reduce) {
      function loop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.left = rx + "px";
        ring.style.top = ry + "px";
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);
    }

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
          background: "#B5613C",
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
          border: "1.5px solid rgba(181,97,60,.55)",
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
