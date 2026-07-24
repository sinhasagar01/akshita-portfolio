"use client";

import { useEffect, useRef } from "react";

type Counts = { all: number; web: number; mobile: number };

/**
 * The work-grid platform filter (PR 4) — a segmented control (All / Web / Mobile) with a
 * sliding thumb, over the contract's leave -> hide -> FLIP-repack -> enter sequence. An
 * imperative enhancer over the server-rendered grid, like WorkGridGlow.
 *
 * Coexistence: the FLIP writes `transform`/`opacity` on the .work-card <a> and toggles
 * `hidden` on the .reveal-card <li>, never touching the <li>'s reveal opacity (so it can't
 * fight the scroll-reveal). WorkGridGlow keeps working — its coords() already filters
 * visible cards by offsetParent, so a hidden card drops out of the dock automatically.
 *
 * A1 — LAST-INTENT QUEUE. The visual state (thumb + aria-pressed) updates ONLY inside
 * applyFilter, after the busy check, so a click that will not take effect never lies to
 * the eye or to a screen reader. A click during the ~900ms sequence is stored and replayed
 * once it settles (last intent wins; superseded clicks are dropped).
 *
 * A4 — an "" (uncategorised) card matches "all" only, so it shows under All and is absent
 * from Web and Mobile. Counts reflect it; Web + Mobile need not sum to All.
 */
export default function WorkFilter({ counts }: { counts: Counts }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const control = ref.current;
    if (!control) return;
    const gridEl = document.querySelector<HTMLElement>("#work .work-grid");
    if (!gridEl) return;
    const grid: HTMLElement = gridEl; // pinned non-null so the nested closures narrow
    const buttons = Array.from(control.querySelectorAll<HTMLButtonElement>("button[data-filter]"));
    const thumbEl = control.querySelector<HTMLElement>(".wf-thumb");
    if (!thumbEl) return;
    const thumb: HTMLElement = thumbEl;
    const items = Array.from(grid.querySelectorAll<HTMLElement>(".reveal-card")).map((li) => ({
      li,
      a: li.querySelector<HTMLElement>(".work-card"),
      cat: li.querySelector<HTMLElement>(".work-card")?.dataset.cat ?? "",
    }));
    if (!items.length || items.some((it) => !it.a)) return;

    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A4 — "" matches only "all"
    const matches = (f: string, cat: string) => f === "all" || cat === f;

    const moveThumb = (btn: HTMLButtonElement) => {
      thumb.style.width = `${btn.offsetWidth}px`;
      thumb.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
    };
    const setPressed = (f: string) =>
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));

    let busy = false;
    let pending: string | null = null;
    let active = "all";

    function commitVisual(f: string) {
      active = f;
      setPressed(f);
      const btn = buttons.find((b) => b.dataset.filter === f);
      if (btn) moveThumb(btn);
    }

    function applyFilter(f: string) {
      if (busy) {
        pending = f; // A1 — queue; DO NOT touch thumb/aria-pressed for a click that won't run
        return;
      }
      const stay = items.filter((it) => !it.li.hidden && matches(f, it.cat));
      const go = items.filter((it) => !it.li.hidden && !matches(f, it.cat));
      const come = items.filter((it) => it.li.hidden && matches(f, it.cat));
      if (!go.length && !come.length) {
        commitVisual(f); // already this filter — keep the control truthful, no animation
        return;
      }

      commitVisual(f); // A1 — visual state updates only now, for a click that takes effect

      if (reduced()) {
        go.forEach((it) => (it.li.hidden = true));
        come.forEach((it) => (it.li.hidden = false));
        return;
      }

      busy = true;
      const h0 = grid.offsetHeight;
      const first = new Map(stay.map((it) => [it, it.a!.getBoundingClientRect()] as const));

      // PHASE 1 — leave (fade the <a>, staggered)
      go.forEach((it, i) => {
        it.a!.style.transitionDelay = `${i * 45}ms`;
        it.a!.classList.add("leaving");
      });

      window.setTimeout(
        () => {
          go.forEach((it) => {
            it.li.hidden = true;
            it.a!.classList.remove("leaving");
            it.a!.style.transitionDelay = "";
          });
          come.forEach((it) => {
            it.li.hidden = false;
            it.a!.classList.add("entering");
          });

          // PHASE 2 — repack survivors with FLIP (transform the <a>)
          stay.forEach((it) => {
            const before = first.get(it)!;
            const after = it.a!.getBoundingClientRect();
            const dx = before.left - after.left;
            const dy = before.top - after.top;
            if (!dx && !dy) return;
            it.a!.style.transition = "none";
            it.a!.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            it.a!.getBoundingClientRect(); // force reflow — the "invert"
            it.a!.style.transition = "";
            it.a!.style.transform = "";
          });

          // animate the grid height so content below does not snap
          const h1 = grid.offsetHeight;
          grid.style.height = `${h0}px`;
          grid.getBoundingClientRect();
          grid.style.transition = "height 520ms cubic-bezier(.16,.9,.28,1)";
          grid.style.height = `${h1}px`;

          // PHASE 3 — enter, staggered
          requestAnimationFrame(() => {
            come.forEach((it, i) => {
              it.a!.style.transitionDelay = `${160 + i * 70}ms`;
              it.a!.classList.remove("entering");
            });
          });

          window.setTimeout(() => {
            grid.style.transition = "";
            grid.style.height = "";
            come.forEach((it) => (it.a!.style.transitionDelay = ""));
            busy = false;
            if (pending !== null) {
              const next = pending;
              pending = null;
              applyFilter(next); // A1 — replay the last intent
            }
          }, 700);
        },
        go.length ? 200 + (go.length - 1) * 45 : 0,
      );
    }

    const onClick = (e: Event) => applyFilter((e.currentTarget as HTMLButtonElement).dataset.filter!);
    buttons.forEach((b) => b.addEventListener("click", onClick));
    const onResize = () => {
      const b = buttons.find((x) => x.dataset.filter === active);
      if (b) moveThumb(b);
    };
    window.addEventListener("resize", onResize);

    const initial = buttons.find((b) => b.dataset.filter === "all");
    if (initial) moveThumb(initial);

    return () => {
      buttons.forEach((b) => b.removeEventListener("click", onClick));
      window.removeEventListener("resize", onResize);
      items.forEach((it) => {
        it.li.hidden = false;
        it.a?.classList.remove("leaving", "entering");
        if (it.a) {
          it.a.style.transition = "";
          it.a.style.transform = "";
          it.a.style.transitionDelay = "";
        }
      });
      grid.style.height = "";
      grid.style.transition = "";
    };
  }, []);

  return (
    <div className="work-filter" role="group" aria-label="Filter work by platform" ref={ref}>
      <span className="wf-thumb" aria-hidden="true" />
      <button type="button" data-filter="all" aria-pressed="true">
        All <span className="wf-n">{counts.all}</span>
      </button>
      <button type="button" data-filter="web" aria-pressed="false" disabled={counts.web === 0}>
        Web <span className="wf-n">{counts.web}</span>
      </button>
      <button type="button" data-filter="mobile" aria-pressed="false" disabled={counts.mobile === 0}>
        Mobile <span className="wf-n">{counts.mobile}</span>
      </button>
    </div>
  );
}
