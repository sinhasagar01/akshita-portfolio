"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";
import { sectionDisplayLabel } from "@/lib/case-studies/section-label";

/**
 * The preview rail — a fixed right-side section nav. CHROME, NOT CONTENT: every item is
 * DERIVED from a Section the owner already edits (id, index, eyebrow, title, and the
 * first block's kind for the schematic thumbnail). It is not a block kind, has no schema,
 * and renders ONLY on the public case-study route — the studio has its own right-hand
 * Selected rail, so this one is simply never mounted there.
 *
 * The widget is imperative on purpose. Resting width, hover width, the aimed tick, and
 * the floating preview all update per pointer-frame; driving that through React state
 * would rerender fourteen ticks a frame and fight the class toggles. So React renders the
 * static structure once and the effect owns every dynamic mutation through refs — the
 * same shape as the approved mock, adapted to the project's tokens.
 *
 * Targets resolve BY POSITION (the i-th child of article.case-study), not by id: a
 * section's id is owner-editable and may be blank or duplicated, and position matches the
 * item order regardless. Clicks scroll through the Lenis-aware smooth-scroll seam (no
 * hash, no history push) so the reveal system and the back/forward restore are untouched.
 */

export type RailItem = {
  id?: string;
  index?: string;
  eyebrow?: string;
  title?: string;
  kind: string;
};

// First-block kind → schematic thumbnail family. Chrome-local presentation, NOT a block
// registry — the 16-kind union stays where it lives. A kind not listed falls back to prose.
const THUMB: Record<string, "ui" | "dark" | "txt"> = {
  heroCover: "ui",
  deviceShelf: "ui",
  figureGrid: "ui",
  featureRows: "ui",
  beforeAfter: "ui",
  videoEmbed: "ui",
  annotatedImage: "ui",
  swatchTokens: "ui",
  pullQuote: "dark",
  glanceGrid: "txt",
  issueList: "txt",
  stepper: "txt",
  statCards: "txt",
  principleCards: "txt",
  richText: "txt",
  closingLine: "txt",
};

// First-block kind → human label for the preview note. Mirrors the studio BLOCK_LABELS
// values, kept local so the public bundle never imports a studio module.
const LABEL: Record<string, string> = {
  heroCover: "Hero cover",
  deviceShelf: "Device shelf",
  pullQuote: "Pull quote",
  glanceGrid: "Glance grid",
  issueList: "Issue list",
  stepper: "Stepper",
  statCards: "Stat cards",
  principleCards: "Principle cards",
  figureGrid: "Figure grid",
  featureRows: "Feature rows",
  beforeAfter: "Before / after",
  swatchTokens: "Swatch tokens",
  annotatedImage: "Annotated image",
  richText: "Rich text",
  closingLine: "Closing line",
  videoEmbed: "Video embed",
};

const OPTS = { baseW: 10, activeW: 28, maxW: 44, restSpan: 4, reach: 70 };
const smooth = (f: number) => f * f * (3 - 2 * f);

const eyebrowOf = (it: RailItem) =>
  [it.index, it.eyebrow].filter(Boolean).join(" · ") || it.eyebrow || it.index || "";
// Same fallback chain as the studio, so a section with no authored eyebrow/title reads
// as "Hero" / "Final video" / "Closing", never the raw slug or a bare "Section N".
const titleOf = (it: RailItem, i: number) => sectionDisplayLabel(it, i);
const noteOf = (it: RailItem) => LABEL[it.kind] ?? "Section";

export default function PreviewRail({ items }: { items: RailItem[] }) {
  const prefersReduced = useReducedMotion();
  const smoothScroll = useSmoothScroll();
  const smoothRef = useRef(smoothScroll);
  smoothRef.current = smoothScroll;

  const railRef = useRef<HTMLElement>(null);
  const tickRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const connRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const rail = railRef.current;
    const prev = prevRef.current;
    const card = cardRef.current;
    const conn = connRef.current;
    if (!rail || !prev || !card || !conn) return;

    // Resolve section elements by POSITION (immune to blank/duplicate ids), falling back
    // to id lookup only if the structure is not the expected article-of-sections.
    const article = document.querySelector("article.case-study");
    let sections: (HTMLElement | null)[] = article
      ? (Array.from(article.children) as HTMLElement[])
      : [];
    if (sections.length !== items.length) {
      sections = items.map((it) =>
        it.id ? (document.getElementById(it.id) as HTMLElement | null) : null,
      );
    }

    let active = 0;
    let pointerY: number | null = null;
    let aimIndex = -1;

    const buildThumb = (kind: string): HTMLElement => {
      const fam = THUMB[kind] ?? "txt";
      const t = document.createElement("div");
      t.className = "pr-thumb pr-thumb--" + fam;
      if (fam === "ui") {
        const sd = document.createElement("div");
        sd.className = "pr-thumb-side";
        const bd = document.createElement("div");
        bd.className = "pr-thumb-body";
        const bar = document.createElement("div");
        bar.className = "pr-thumb-bar";
        const row = document.createElement("div");
        row.className = "pr-thumb-row";
        row.append(tile(), tile());
        bd.append(bar, row, tile("wide"));
        t.append(sd, bd);
      } else {
        const widths = fam === "dark" ? [40, 82, 70] : [34, 88, 76, 58];
        widths.forEach((w) => {
          const l = document.createElement("div");
          l.className = "pr-thumb-line";
          l.style.width = w + "%";
          t.appendChild(l);
        });
      }
      return t;
    };
    const tile = (mod?: string) => {
      const el = document.createElement("div");
      el.className = "pr-thumb-tile" + (mod ? " pr-thumb-tile--" + mod : "");
      return el;
    };

    const showPreview = (i: number) => {
      const btn = tickRefs.current[i];
      if (!btn) return;
      const it = items[i];
      const r = btn.getBoundingClientRect();
      // rebuild card content (textContent, never innerHTML — no injection surface)
      card.textContent = "";
      card.appendChild(buildThumb(it.kind));
      const k = document.createElement("div");
      k.className = "pr-k";
      k.textContent = eyebrowOf(it);
      const t = document.createElement("div");
      t.className = "pr-t";
      t.textContent = titleOf(it, i);
      const n = document.createElement("div");
      n.className = "pr-n";
      n.textContent = noteOf(it);
      card.append(k, t, n);
      if (i === active) {
        const here = document.createElement("span");
        here.className = "pr-here";
        here.textContent = "You are here";
        card.appendChild(here);
      }
      prev.classList.add("is-shown");
      const h = card.offsetHeight;
      const mid = r.top + r.height / 2;
      const top = Math.min(Math.max(mid - h / 2, 70), window.innerHeight - h - 16);
      const left = r.left - card.offsetWidth - 16;
      prev.style.top = top + "px";
      prev.style.left = left + "px";
      conn.classList.add("is-shown");
      conn.style.top = mid + "px";
      const connLeft = left + card.offsetWidth;
      conn.style.left = connLeft + "px";
      conn.style.width = Math.max(0, r.left - connLeft - 6) + "px";
    };
    const hidePreview = () => {
      prev.classList.remove("is-shown");
      conn.classList.remove("is-shown");
    };

    // resting width from |i - active|; hover width from pointer distance;
    // final = max(resting, hover) so hover can only ADD, never shrink the active pyramid.
    const paint = () => {
      let best = -1;
      let bestD = Infinity;
      const centers: number[] = [];
      tickRefs.current.forEach((btn, i) => {
        if (!btn) return;
        if (pointerY !== null) {
          const r = btn.getBoundingClientRect();
          centers[i] = r.top + r.height / 2;
          const pd = Math.abs(pointerY - centers[i]);
          if (pd < bestD) {
            bestD = pd;
            best = i;
          }
        }
      });
      aimIndex = best;
      tickRefs.current.forEach((btn, i) => {
        if (!btn) return;
        const dist = Math.abs(i - active);
        const restW =
          OPTS.baseW +
          (OPTS.activeW - OPTS.baseW) * smooth(Math.max(0, 1 - dist / OPTS.restSpan));
        let hovW = 0;
        if (pointerY !== null && centers[i] !== undefined) {
          const pd = Math.abs(pointerY - centers[i]);
          hovW = OPTS.baseW + (OPTS.maxW - OPTS.baseW) * smooth(Math.max(0, 1 - pd / OPTS.reach));
        }
        const dash = btn.firstElementChild as HTMLElement | null;
        if (dash) dash.style.width = Math.max(restW, hovW) + "px";
        btn.classList.toggle("current", i === active);
        btn.classList.toggle("near1", dist === 1);
        btn.classList.toggle("near2", dist === 2);
        btn.classList.toggle("aim", i === aimIndex);
        if (i === active) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
    };

    const spy = () => {
      const line = window.innerHeight * 0.35;
      let idx = 0;
      sections.forEach((s, i) => {
        if (s && s.getBoundingClientRect().top <= line) idx = i;
      });
      if (idx !== active) {
        active = idx;
        paint();
      }
    };

    const onMove = (e: PointerEvent) => {
      rail.classList.add("aiming");
      pointerY = e.clientY;
      paint();
    };
    const onLeave = () => {
      rail.classList.remove("aiming");
      pointerY = null;
      paint();
      hidePreview();
    };
    const onScroll = () => spy();
    const onResize = () => {
      paint();
      hidePreview();
    };

    rail.addEventListener("pointermove", onMove);
    rail.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Per-tick preview triggers. pointerenter follows the hovered row; focus/blur give the
    // keyboard the identical preview so tabbing the rail is not a blind walk.
    const perTick = tickRefs.current.map((btn, i) => {
      if (!btn) return null;
      const enter = () => showPreview(i);
      const focus = () => showPreview(i);
      const blur = () => hidePreview();
      btn.addEventListener("pointerenter", enter);
      btn.addEventListener("focus", focus);
      btn.addEventListener("blur", blur);
      return { btn, enter, focus, blur };
    });

    paint();
    spy();

    return () => {
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      perTick.forEach((h) => {
        if (!h) return;
        h.btn.removeEventListener("pointerenter", h.enter);
        h.btn.removeEventListener("focus", h.focus);
        h.btn.removeEventListener("blur", h.blur);
      });
    };
    // items are stable per page; prefersReduced only flips transitions via CSS.
  }, [items]);

  if (items.length === 0) return null;

  const scrollTo = (i: number) => {
    const article = document.querySelector("article.case-study");
    let el: HTMLElement | null = null;
    if (article && article.children.length === items.length) {
      el = article.children[i] as HTMLElement;
    } else if (items[i].id) {
      el = document.getElementById(items[i].id as string);
    }
    if (!el) return;
    const ss = smoothRef.current;
    if (ss) ss.scrollToTarget(el, { offset: 8 });
    else el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <nav
        ref={railRef}
        className="pr-rail"
        aria-label="Case study sections"
        data-preview-rail
      >
        {items.map((it, i) => (
          <button
            key={i}
            ref={(el) => {
              tickRefs.current[i] = el;
            }}
            type="button"
            className="pr-tick"
            aria-label={`Go to ${titleOf(it, i)}`}
            onClick={() => scrollTo(i)}
          >
            <span className="pr-dash" aria-hidden="true" />
          </button>
        ))}
      </nav>
      <div ref={connRef} className="pr-conn" aria-hidden="true" />
      <div ref={prevRef} className="pr-prev" aria-hidden="true">
        <div ref={cardRef} className="pr-card" />
      </div>
    </>
  );
}
