"use client";

// Blog PR 2 — the floating liquid-glass reading vessel (fixed right on desktop) and its
// docked capsule (below the 1200px FIT breakpoint). It fills as you read.
//
// R1 — Lenis cooperation BY CONSTRUCTION. `--read` is driven by a GSAP ScrollTrigger,
// not a raw `scrollY` listener. GSAPProvider calls ScrollTrigger.update() on every
// `lenis.on("scroll")`, so ScrollTrigger is already synced to Lenis' smooth scroll —
// the same mechanism ProcessSection/BeforeAfterStory use. A raw listener would lag it.
//
// R2 — SMIL is dropped under reduced motion. The wave wobble is an SVG <animate> inside
// feTurbulence; the global CSS `animation` reset cannot stop SMIL. So under reduced
// motion this component renders NOTHING — no filter, no <animate>, no fixed decoration —
// and the article header still carries the date, reading time and topic, so the page
// reads fully. (The CSS @media reduce block is belt-and-braces for the animated layers.)
//
// The vessel is aria-hidden: it is a decorative progress affordance whose metadata is
// already announced in the semantic article header, so it must not double up for AT.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { ScrollTrigger } from "@/lib/gsap";
import { formatLongDate, formatCapsuleDate } from "@/lib/blog/format";
import LoveButton from "./LoveButton";

const WAVE_PATH_A =
  "M0,7 C25,2 75,2 100,7 C125,12 175,12 200,7 C225,2 275,2 300,7 C325,12 375,12 400,7 L400,13 L0,13 Z";
const WAVE_PATH_B =
  "M0,9 C25,3 75,3 100,9 C125,15 175,15 200,9 C225,3 275,3 300,9 C325,15 375,15 400,9 L400,16 L0,16 Z";

export default function ReadingVessel({
  slug,
  date,
  readingTime,
  topic,
}: {
  slug: string;
  date: string;
  readingTime: number;
  topic: string;
}) {
  const prefersReduced = useReducedMotion();
  const [read, setRead] = useState(0);
  const [visible, setVisible] = useState(false);
  const readRef = useRef(0);

  useEffect(() => {
    if (prefersReduced) return;
    const head = document.getElementById("blog-article-head");
    const love = document.getElementById("blog-love-block");
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        // Avoid churn from sub-pixel updates.
        if (Math.abs(p - readRef.current) > 0.0005) {
          readRef.current = p;
          setRead(p);
        }
        const pastTitle = head ? head.getBoundingClientRect().bottom < 40 : true;
        const atLove = love ? love.getBoundingClientRect().top < window.innerHeight - 80 : false;
        setVisible(pastTitle && !atLove);
      },
    });
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [prefersReduced]);

  // R2: reduced motion renders nothing — the header carries the metadata.
  if (prefersReduced) return null;

  const style = { "--read": read } as CSSProperties;
  const pct = Math.round(read * 100);

  return (
    <>
      {/* The wobble filter — only mounted when motion is allowed, so the SMIL <animate>
          never runs under reduced motion. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="blog-wobble" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.05" numOctaves="2" seed="5" result="n">
            <animate
              attributeName="baseFrequency"
              dur="24s"
              repeatCount="indefinite"
              values="0.014 0.05; 0.021 0.06; 0.014 0.05"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <aside className={`blog-vessel${visible ? " is-on" : ""}`} style={style} aria-hidden="true">
        <div className="blog-liquid">
          <div className="blog-smoke" />
          <div className="blog-wave is-b">
            <svg viewBox="0 0 400 16" preserveAspectRatio="none">
              <path fill="color-mix(in srgb, var(--color-smoke-4) 55%, transparent)" d={WAVE_PATH_B} />
            </svg>
          </div>
          <div className="blog-wave is-a">
            <svg viewBox="0 0 400 13" preserveAspectRatio="none">
              <path fill="color-mix(in srgb, var(--color-vessel-wave) 85%, transparent)" d={WAVE_PATH_A} />
            </svg>
          </div>
          <div className="blog-glint" />
          <div className="blog-waterline" />
          <span className="blog-bub" />
          <span className="blog-bub" />
          <span className="blog-bub" />
        </div>
        <div className="blog-vessel-body">
          <span className="blog-lbl">Published</span>
          <p className="blog-val">{formatLongDate(date)}</p>
          <span className="blog-lbl">Reading time</span>
          <p className="blog-val">{readingTime} min</p>
          {topic ? (
            <>
              <span className="blog-lbl">Topic</span>
              <p className="blog-val">{topic}</p>
            </>
          ) : null}
          <div className="blog-sep" />
          <span className="blog-lbl">Loved by</span>
          <div className="mt-2">
            {/* A READOUT, not a control. This container is aria-hidden and fixed-position;
                see LoveButton's header for why nothing focusable may live in here. */}
            <LoveButton slug={slug} variant="readout" />
          </div>
          <p className="blog-pct">{pct}% read</p>
        </div>
      </aside>

      <div className={`blog-docked${visible ? " is-on" : ""}`} style={style} aria-hidden="true">
        <div className="blog-capsule">
          <div className="blog-bead" />
          <div className="blog-cap-body">
            <p className="blog-meta-row">
              <span>{formatCapsuleDate(date)}</span>
              <span>{readingTime} min</span>
            </p>
            <div className="blog-cap-right">
              {/* THE REFLOW RISK: margin-left:auto, so the number's width slides this
                  whole group. Count reserves 3ch and uses tabular-nums for that reason. */}
              <LoveButton slug={slug} variant="readout" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
