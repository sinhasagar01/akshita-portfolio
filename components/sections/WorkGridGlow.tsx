"use client";

import { useEffect } from "react";

/**
 * The work-grid dock cascade (PR 3). On hover/focus of a card it expresses the dock
 * falloff in LIGHT, not size: the pointed card glows at full and neighbours fall off by
 * e^(-1.2·d²) of grid distance, on a stagger wave, while the un-pointed cards recede. It
 * writes --gl / --op / --dly onto each .work-card; the CSS turns those into the tinted
 * box-shadow, the recede, and the stagger delay. --op rides the shot + rail, never the
 * .reveal-card <li>, so it cannot fight the scroll-reveal.
 *
 * Enhancement only. Base CSS lights the pointed card on :hover, so no-JS keeps a static
 * glow. This no-ops on touch (pointerenter fires on tap with no pointerleave, which would
 * strand a lit card) and under reduced motion, leaving that CSS :hover fallback in place.
 *
 * LOCKED tuning (the contract): stagger 60ms/unit, glow 100%, recede 28%, falloff e^(-1.2d²).
 */
const STAGGER = 60;
const DIM = 0.28;

export default function WorkGridGlow() {
  useEffect(() => {
    // A2 — never attach on touch; the CSS :hover fallback is harmless there. Reduced
    // motion also falls back to the static :hover glow.
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const grid = document.querySelector<HTMLElement>("#work .work-grid");
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".work-card"));
    if (!cards.length) return;

    // Grid coords of the currently-visible cards, recomputed per hover because the column
    // count changes at lg and a future filter (PR 4) changes who sits next to whom.
    const coords = () => {
      const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      const live = cards.filter((c) => c.offsetParent !== null);
      const map = new Map<HTMLElement, { r: number; c: number }>();
      live.forEach((c, i) => map.set(c, { r: Math.floor(i / cols), c: i % cols }));
      return map;
    };

    const focusOn = (hovered: HTMLElement) => {
      const pos = coords();
      const h = pos.get(hovered);
      if (!h) return;
      pos.forEach((p, card) => {
        const d = Math.hypot(p.r - h.r, p.c - h.c);
        const falloff = Math.exp(-1.2 * d * d);
        card.style.setProperty("--dly", `${Math.round(d * STAGGER)}ms`);
        card.style.setProperty("--gl", falloff.toFixed(3));
        card.style.setProperty("--op", (1 - DIM * (1 - falloff)).toFixed(3));
      });
    };

    const settle = () => {
      cards.forEach((card, i) => {
        card.style.setProperty("--dly", `${Math.round(i * 22)}ms`);
        card.style.setProperty("--gl", "0");
        card.style.setProperty("--op", "1");
      });
    };

    const enter = (e: Event) => focusOn(e.currentTarget as HTMLElement);
    cards.forEach((card) => {
      card.addEventListener("pointerenter", enter);
      card.addEventListener("focus", enter);
      card.addEventListener("blur", settle);
    });
    grid.addEventListener("pointerleave", settle);
    window.addEventListener("resize", settle); // A3 — a resize across lg strands stale vars

    settle();

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("pointerenter", enter);
        card.removeEventListener("focus", enter);
        card.removeEventListener("blur", settle);
        card.style.removeProperty("--gl");
        card.style.removeProperty("--op");
        card.style.removeProperty("--dly");
      });
      grid.removeEventListener("pointerleave", settle);
      window.removeEventListener("resize", settle);
    };
  }, []);

  return null;
}
