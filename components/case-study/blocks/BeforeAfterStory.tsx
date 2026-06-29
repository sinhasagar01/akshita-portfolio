"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import { useReducedMotion } from "motion/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { BeforeAfterStoryPair, Rich } from "@/lib/case-studies/types";
import CaseSectionHeader from "../CaseSectionHeader";
import {
  BEZEL_W,
  BEZEL_H,
  INSET,
  WIN_TOP,
  SCREEN_BOTTOM,
  RADIUS,
  SCREEN_BG,
  clamp,
  eIO,
  unitGeo,
  EDGE,
  type Geo,
} from "./deviceScroller";
import bezel from "@/public/work/boat-crest/scroll-assets/phone-frame-bezel.png";

/* Before → After scroll-pinned comparison story (cs-07) — 1:1 port of
   docs/case-study-page/before-after-pinned.html. The card pins (CSS-sticky inner panel
   inside a 300vh track, matching the homepage ProcessSection — not GSAP pin, which
   fights Lenis) and steps through Home → Activity → Vitals. In each, the after-screen
   auto-scrolls inside the genuine device bezel driven by scroll progress while the
   before sits static beside it; the 01/02/03 change notes light up, a progress bar
   fills, and the left rail tracks the active screen. prefers-reduced-motion / ≤lg →
   no pin, the three pairs render as stacked static comparisons (after at top). */

const PHONE_W = 204; // pinned (desktop) device width — matches the prototype
const STATIC_PHONE_W = 180; // stacked fallback device width
const GROUNDING = "drop-shadow(0 20px 30px rgba(45,28,15,0.20))"; // soft phone grounding
const RAIL_SPINE = "color-mix(in oklch, var(--color-ink-950) 14%, transparent)";
const BAR_TRACK = "color-mix(in oklch, var(--color-ink-950) 14%, transparent)";

const phoneH = (w: number) => (w * BEZEL_H) / BEZEL_W;
const edgeFor = (h: number) => Math.round((h * 24) / 462); // 24px edge tuned at h=462

type RefCb = (el: HTMLDivElement | null) => void;

/** The after-screen: three-layer auto-scroller (window body + pinned footer + bezel). */
function AfterPhone({
  after,
  geo,
  w,
  contentRef,
}: {
  after: BeforeAfterStoryPair["after"];
  geo: Geo;
  w: number;
  contentRef?: RefCb;
}) {
  const h = phoneH(w);
  const edgeH = edgeFor(h);
  return (
    <div className="relative shrink-0" style={{ width: w, height: h, filter: GROUNDING }}>
      {geo.scrollable && (
        <>
          {/* .win — scrolling body + iOS scroll-edge blur */}
          <div
            style={{
              position: "absolute",
              left: geo.win.left,
              top: geo.win.top,
              width: geo.win.width,
              height: geo.win.height,
              overflow: "hidden",
              background: SCREEN_BG,
              zIndex: 1,
            }}
          >
            <div ref={contentRef} style={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
              <Image src={after.body} alt="" sizes={`${Math.round(geo.win.width)}px`} className="block h-auto w-full" />
            </div>
            <div style={EDGE("t", edgeH)} />
            <div style={EDGE("b", edgeH)} />
          </div>
          {/* .footer — pinned bottom bar */}
          <div
            style={{
              position: "absolute",
              left: geo.footer.left,
              top: geo.footer.top,
              width: geo.footer.width,
              height: geo.footer.height,
              overflow: "hidden",
              background: SCREEN_BG,
              zIndex: 2,
              borderRadius: `0 0 ${geo.radius}px ${geo.radius}px`,
            }}
          >
            <Image
              src={after.footer}
              alt=""
              sizes={`${Math.round(geo.footer.width)}px`}
              className="absolute bottom-0 left-0 block h-auto w-full"
            />
          </div>
        </>
      )}
      {/* .frame — bezel overlay */}
      <Image
        src={bezel}
        alt=""
        sizes={`${w}px`}
        className="absolute inset-0 h-auto w-full"
        style={{ zIndex: 3, pointerEvents: "none" }}
      />
    </div>
  );
}

/** The before-screen: one static full screen shown inside the same bezel. */
function BeforePhone({ before, w }: { before: StaticImageData; w: number }) {
  const h = phoneH(w);
  const sc = w / BEZEL_W;
  const screen = {
    left: INSET * sc,
    top: WIN_TOP * sc,
    width: (BEZEL_W - 2 * INSET) * sc,
    height: (SCREEN_BOTTOM - WIN_TOP) * sc,
    radius: RADIUS * sc,
  };
  return (
    <div className="relative shrink-0" style={{ width: w, height: h, filter: GROUNDING }}>
      <div
        style={{
          position: "absolute",
          left: screen.left,
          top: screen.top,
          width: screen.width,
          height: screen.height,
          overflow: "hidden",
          background: SCREEN_BG,
          borderRadius: `0 0 ${screen.radius}px ${screen.radius}px`,
        }}
      >
        <Image
          src={before}
          alt=""
          sizes={`${Math.round(screen.width)}px`}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>
      <Image
        src={bezel}
        alt=""
        sizes={`${w}px`}
        className="absolute inset-0 h-auto w-full"
        style={{ zIndex: 3, pointerEvents: "none" }}
      />
    </div>
  );
}

function PhoneLabel({ children, after }: { children: ReactNode; after?: boolean }) {
  return (
    <figcaption
      className={`text-eyebrow tracking-[0.14em] uppercase font-semibold ${after ? "text-accent-500" : "text-text-subtle"}`}
    >
      {children}
    </figcaption>
  );
}

/** Numbered change notes (01/02/03). `lit` forces the static/reduced state visible. */
function ChangeNotes({
  changes,
  litAll,
  itemRef,
}: {
  changes: BeforeAfterStoryPair["changes"];
  litAll?: boolean;
  itemRef?: (j: number) => (el: HTMLLIElement | null) => void;
}) {
  return (
    <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
      {changes.map((c, j) => (
        <li
          key={j}
          ref={itemRef?.(j)}
          className="flex items-start gap-2.5"
          style={
            litAll
              ? undefined
              : { opacity: 0.25, transform: "translateX(-6px)", transition: "opacity .4s, transform .4s" }
          }
        >
          <span className="w-[18px] shrink-0 font-display italic text-[14px] leading-[1.5] text-accent-500">
            {String(j + 1).padStart(2, "0")}
          </span>
          <span className="text-[12.5px] leading-[1.45] text-ink-600">
            <b className="font-semibold text-ink-950">{c.emphasis}</b> {c.rest}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RatingStat({ from, to }: { from: string; to: string }) {
  return (
    <div className="shrink-0 text-right">
      <div className="text-eyebrow tracking-[0.16em] uppercase font-semibold text-text-subtle">App Store rating</div>
      <div className="mt-1.5 flex items-baseline justify-end gap-2">
        <span className="font-display text-lg text-text-subtle">{from}★</span>
        <span aria-hidden="true" className="text-base text-accent-500">
          →
        </span>
        <span className="font-display text-3xl font-medium text-accent-500">{to}★</span>
      </div>
    </div>
  );
}

type Props = {
  index?: string;
  eyebrow?: string;
  title?: string;
  lead?: Rich;
  rating?: { from: string; to: string };
  pairs: BeforeAfterStoryPair[];
};

export default function BeforeAfterStory({ index, eyebrow, title, lead, rating, pairs }: Props) {
  const prefersReduced = useReducedMotion();
  const [isSmall, setIsSmall] = useState(false);
  const noPin = prefersReduced === true || isSmall;
  const n = pairs.length;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const railRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railDotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const itemRefs = useRef<(HTMLLIElement | null)[][]>([]);
  const geoRef = useRef<Geo[]>([]);

  // Track the mobile breakpoint (≤lg, the site-wide case-study switch) for noPin.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsSmall(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scroll-pinned engine — mirrors ProcessSection (sticky inner + onUpdate progress).
  useEffect(() => {
    if (noPin || !wrapperRef.current) return;

    geoRef.current = pairs.map((p) => unitGeo(PHONE_W, p.after));

    const paint = (progress: number) => {
      const W = 0.12; // crossfade window between adjacent comparisons
      const active = Math.min(n - 1, Math.floor(progress * n));
      for (let i = 0; i < n; i++) {
        const ph = progress * n - i;
        const op = ph < 0 ? clamp((ph + W) / W) : ph > 1 ? 1 - clamp((ph - 1) / W) : 1;

        const panel = panelRefs.current[i];
        if (panel) {
          panel.style.opacity = String(op);
          panel.style.zIndex = ph >= 0 && ph <= 1 ? "2" : "1";
          panel.style.pointerEvents = op > 0.5 ? "auto" : "none";
        }

        const content = contentRefs.current[i];
        const g = geoRef.current[i];
        if (content && g && g.scrollable) {
          const sp = eIO(clamp(ph));
          content.style.transform = `translateY(${-sp * g.scrollPct * 100}%)`;
        }

        const fill = fillRefs.current[i];
        if (fill) fill.style.width = `${clamp(ph) * 100}%`;

        const rail = railRefs.current[i];
        if (rail) rail.style.opacity = i === active ? "1" : "0.4";
        const dot = railDotRefs.current[i];
        if (dot) dot.style.background = i === active ? "var(--color-accent-500)" : "transparent";

        const items = itemRefs.current[i] ?? [];
        for (let j = 0; j < items.length; j++) {
          const it = items[j];
          if (!it) continue;
          const lit = clamp(ph) >= 0.12 + j * 0.28;
          it.style.opacity = lit ? "1" : "0.25";
          it.style.transform = lit ? "translateX(0)" : "translateX(-6px)";
        }
      }
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapperRef.current!,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => paint(self.progress),
      });
      ScrollTrigger.refresh();
    });
    paint(0); // first comparison correct before any scroll

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [noPin, pairs, n]);

  const header = (
    <div className="flex items-start justify-between gap-6">
      <CaseSectionHeader index={index} eyebrow={eyebrow} title={title} lead={lead} />
      {rating && <RatingStat from={rating.from} to={rating.to} />}
    </div>
  );

  // ── Reduced motion / mobile: stacked static comparisons, after at top, notes all lit.
  if (noPin) {
    return (
      <section className="section-card py-section">
        {header}
        <div className="mt-10 flex flex-col gap-14">
          {pairs.map((pair, i) => {
            const geo = unitGeo(STATIC_PHONE_W, pair.after);
            return (
              <div key={i} className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-10">
                <div
                  className="flex shrink-0 flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-5"
                  aria-hidden="true"
                >
                  <figure className="flex flex-col items-center gap-2.5">
                    <PhoneLabel after>After</PhoneLabel>
                    <AfterPhone after={pair.after} geo={geo} w={STATIC_PHONE_W} />
                  </figure>
                  <figure className="flex flex-col items-center gap-2.5">
                    <PhoneLabel>Before</PhoneLabel>
                    <BeforePhone before={pair.before} w={STATIC_PHONE_W} />
                  </figure>
                </div>
                <div className="flex-1">
                  <div className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-text-subtle">
                    {String(i + 1).padStart(2, "0")} · {pair.title}
                  </div>
                  <h3 className="mt-1.5 font-display text-2xl font-normal leading-tight text-ink-950">{pair.title}</h3>
                  <p className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-accent-500 mt-1">
                    {pair.tag}
                  </p>
                  <ChangeNotes changes={pair.changes} litAll />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ── Pinned story: 300vh track + sticky card, scrubbed by ScrollTrigger.onUpdate.
  const stageH = phoneH(PHONE_W) + 52;
  return (
    <div ref={wrapperRef} style={{ height: "300vh" }}>
      <section className="section-card sticky top-0 flex min-h-screen flex-col justify-center py-section">
        {header}

        <div className="mt-10 flex items-center gap-6 lg:gap-10">
          {/* left rail — tracks the active comparison */}
          <div aria-hidden="true" className="relative flex shrink-0 flex-col gap-[18px] pl-1">
            <span
              className="absolute left-[4px] top-[7px] bottom-[7px] w-[1.5px]"
              style={{ background: RAIL_SPINE }}
            />
            {pairs.map((pair, i) => (
              <div
                key={i}
                ref={(el) => {
                  railRefs.current[i] = el;
                }}
                className="relative flex items-center gap-2.5"
                style={{ opacity: i === 0 ? 1 : 0.4, transition: "opacity .3s" }}
              >
                <span
                  ref={(el) => {
                    railDotRefs.current[i] = el;
                  }}
                  className="size-[9px] shrink-0 rounded-full border-[1.5px] border-accent-500"
                  style={{ background: i === 0 ? "var(--color-accent-500)" : "transparent" }}
                />
                <span className="whitespace-nowrap text-[12px] font-semibold text-ink-950">{pair.title}</span>
              </div>
            ))}
          </div>

          {/* stage — three comparison panels stacked + crossfading */}
          <div className="relative flex-1" style={{ height: stageH }}>
            {pairs.map((pair, i) => {
              const geo = unitGeo(PHONE_W, pair.after);
              return (
                <div
                  key={i}
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                  className="absolute inset-0 flex items-center justify-center gap-7"
                  style={{ opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 2 : 1 }}
                >
                  {/* before (static) */}
                  <figure className="flex flex-col items-center gap-2.5" aria-hidden="true">
                    <PhoneLabel>Before</PhoneLabel>
                    <BeforePhone before={pair.before} w={PHONE_W} />
                  </figure>

                  {/* center — name, tag, change notes, progress bar */}
                  <div className="max-w-[238px] flex-1">
                    <h3 className="font-display text-2xl font-normal leading-tight text-ink-950">{pair.title}</h3>
                    <p className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-accent-500 mt-1">
                      {pair.tag}
                    </p>
                    <ChangeNotes
                      changes={pair.changes}
                      itemRef={(j) => (el) => {
                        if (!itemRefs.current[i]) itemRefs.current[i] = [];
                        itemRefs.current[i][j] = el;
                      }}
                    />
                    <div
                      className="mt-5 h-[3px] max-w-[190px] overflow-hidden rounded-full"
                      style={{ background: BAR_TRACK }}
                    >
                      <span
                        ref={(el) => {
                          fillRefs.current[i] = el;
                        }}
                        className="block h-full bg-accent-500"
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>

                  {/* after (auto-scrolling) */}
                  <figure className="flex flex-col items-center gap-2.5" aria-hidden="true">
                    <PhoneLabel after>After</PhoneLabel>
                    <AfterPhone
                      after={pair.after}
                      geo={geo}
                      w={PHONE_W}
                      contentRef={(el) => {
                        contentRefs.current[i] = el;
                      }}
                    />
                  </figure>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
