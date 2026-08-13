"use client";

import Image from "next/image";
import { useRef, useState, useEffect, Fragment } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type Transition,
} from "motion/react";
import CursorGlow from "@/components/motion/CursorGlow";
import { heroFontVariables } from "@/components/sections/hero-fonts";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";

/* ⚠ THE COPY LIVES IN content/site-settings.yaml AND THE BYPASS FLAG IS GONE.
   `USE_CONTRACT_COPY` stood here with the contract's words beside it, and while it was true **50 of
   the hero's 51 owner-editable fields were editable in /studio with no effect on the page** — only
   `heroCopy` survived, because it is read outside the flag. The owner has since ruled the contract's
   copy correct, so it is now CONTENT rather than a hardcoded bypass: every string below arrives as a
   prop, and editing any of them in /studio changes the page.

   ⚠ THAT MAKES THE FLAG'S GATE OBSOLETE AND THE ABSENCE IS WHAT IS ASSERTED NOW.
   `ralph/tests/hero-contract-copy.mjs` used to fail if the flag reached main; it now fails if a
   bypass of ANY name comes back, which is the durable form of the same rule.

   ⚠ THE `*em*` MARKERS ARE PART OF THE HEADLINE FIELD. The contract italicises one word of each
   answer in the accent, and a headline is one CMS string — so the marker travels in the copy and
   `HeroWord` parses it. An unmarked headline simply renders with no accent word. */

/** One tab as the hero draws it, after the CMS values and the fallbacks have been merged. */
type HeroFacet = {
  tab: string;
  /** asterisk pairs mark the one accent `<em>` word, e.g. "people *use*." */
  line: string;
  support: string;
  /** label paired with the connector line's y position, percent of hero height */
  calls: [string, number][];
  stats: { value: string; unit: string }[];
};

/* ⚠ THE CALLOUT LABEL IS CONTENT AND ITS y POSITION IS LAYOUT. The connector lines need a height for
   each trace and the CMS stores three labels, not three coordinates — asking an author for a
   percentage would be asking them to design.

   ⚠ SHIFTED DOWN SIX POINTS FROM THE CONTRACT'S 24/47/70, WITH THE RHYTHM PRESERVED. The copy column
   moved down to clear the nav and these did not, which left the first trace level with the eyebrow
   and reading as part of the nav band. The +23 spacing between them is the contract's and is
   untouched — only the origin moved.

   ⚠ AND THEY ARE NOT ALIGNED TO COPY LANDMARKS, WHICH WAS TRIED AND REJECTED. Matching each trace to
   the name, the answer and the counters reads better on tab one and drifts on the others, because a
   support line of two or three lines moves everything below it. A fixed rhythm is stable across all
   four tabs; an aligned one is correct on whichever tab it was measured against. */
const CALLOUT_Y = [30, 53, 76];

/** ⚠ THE ONE SOURCE FOR THE SHIPPED ILLUSTRATION'S PATH. The studio panel imports this so its
 *  "using the shipped default" preview cannot drift from what the page actually draws. */
export const HERO_FIGURE_FALLBACK = "/images/hero/hero-figure.webp";

/* the contract's four backdrop arrangements, one per tab, normalised to the art panel */
type EmberShape =
  | { t: "r"; x: number; y: number; w: number; h: number }
  | { t: "c"; x: number; y: number; r: number };
const EMBER_LAYOUTS: EmberShape[][] = [
  [{ t: "r", x: 0.04, y: 0.30, w: 0.34, h: 0.21 }, { t: "r", x: 0.60, y: 0.16, w: 0.33, h: 0.19 }, { t: "c", x: 0.80, y: 0.62, r: 0.17 }, { t: "r", x: 0.30, y: 0.62, w: 0.26, h: 0.22 }],
  [{ t: "r", x: 0.08, y: 0.20, w: 0.30, h: 0.24 }, { t: "c", x: 0.72, y: 0.28, r: 0.19 }, { t: "r", x: 0.56, y: 0.58, w: 0.34, h: 0.20 }, { t: "r", x: 0.20, y: 0.66, w: 0.22, h: 0.18 }],
  [{ t: "c", x: 0.22, y: 0.34, r: 0.16 }, { t: "r", x: 0.50, y: 0.20, w: 0.36, h: 0.18 }, { t: "r", x: 0.62, y: 0.52, w: 0.28, h: 0.24 }, { t: "r", x: 0.12, y: 0.64, w: 0.28, h: 0.16 }],
  [{ t: "r", x: 0.06, y: 0.24, w: 0.28, h: 0.26 }, { t: "r", x: 0.44, y: 0.34, w: 0.30, h: 0.20 }, { t: "c", x: 0.84, y: 0.20, r: 0.15 }, { t: "c", x: 0.40, y: 0.70, r: 0.14 }],
];

// Defensive fallbacks for the tab name and headline, so the hero never renders blank.
const FACETS = [
  { tab: "Who I am", line: "A product designer who turns rough ideas into products people use." },
  { tab: "What I do", line: "I carry work from the first messy sketch to the shipped screen." },
  { tab: "How I work", line: "Sit with the ambiguity, then narrow it, discover, define, design, validate." },
  { tab: "What I'm up to", line: "Designing a connected app for Elevate, and looking for my next team." },
];

// The ONE source for the fallback tab names — the studio Hero editor imports
// this so its pill fallbacks can never drift from what the live hero renders.
export const HERO_TAB_FALLBACK_NAMES = FACETS.map((f) => f.tab);

const PILL_SPRING: Transition = { type: "spring", stiffness: 380, damping: 30 };
const PILL_INSTANT: Transition = { duration: 0.15 };

const LINE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const lineContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.042 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const wordVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LINE_EASE } },
};

const lineContainerVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

const MOBILE_BP = 1024;
const SWIPE_PX = 44;
const INTENT_RATIO = 1.4;

type TabStrings = {
  label?: string;
  line?: string;
  support?: string;
  callouts?: string[];
  stats?: { value: string; unit: string }[];
};

/* strip the *em* markers for aria and reduced-motion rendering */
const plain = (line: string) => line.replace(/\*/g, "");

/* one word of the answer line — the asterisk pair inside a word becomes the accent `<em>`,
   with any leading or trailing punctuation staying in ink, exactly as the contract marks it */
function HeroWord({ word }: { word: string }) {
  const m = word.match(/^(.*?)\*(.+?)\*(.*)$/);
  if (!m) return <>{word}</>;
  return (
    <>
      {m[1]}
      <em>{m[2]}</em>
      {m[3]}
    </>
  );
}

/* the contract's counter roll — 0 to the figure over 900ms, cubic ease-out, staggered */
function RollNumber({ value, delay, reduced }: { value: string; delay: number; reduced: boolean }) {
  const target = Number(value);
  const rollable = Number.isFinite(target);
  const [shown, setShown] = useState(reduced || !rollable ? value : "0");
  useEffect(() => {
    if (reduced || !rollable) { setShown(value); return; }
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = (now: number) => {
      if (now < t0) { raf = requestAnimationFrame(step); return; }
      const p = Math.min((now - t0) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(String(Math.round(target * e)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, delay, reduced, rollable, target]);
  return <>{shown}</>;
}

export default function HeroSection({
  heroCopy,
  tabs,
  roleLabel,
  scrollCue,
  figure,
}: {
  heroCopy?: string;
  /** CMS strings per tab, index-aligned with FACETS (tab1..tab4). */
  tabs?: TabStrings[];
  roleLabel?: string;
  scrollCue?: string;
  /** The hero illustration from site settings. Null falls back to the shipped asset. */
  figure?: string | null;
}) {
  const [active, setActive] = useState(0);
  const isReducedMotion = useReducedMotion();
  const smoothScroll    = useSmoothScroll();

  // The simple-string slots read live siteSettings values with defensive
  // fallbacks so the Hero never renders blank (all fields are optional).
  const signature = heroCopy?.trim() ? heroCopy : "Akshita Singh";

  /* ⚠ THE `<em>` IS DERIVED FROM THE NAME, NOT A SECOND CMS FIELD. The contract italicises the
     surname in the accent, and the name is one owner-editable string — so the split is the LAST
     whitespace-separated word, and a single-word name yields an empty `em` that does not render. */
  const nameParts = signature.trim().split(/\s+/);
  const nameEm    = nameParts.length > 1 ? nameParts.pop()! : "";
  const nameLead  = nameEm ? `${nameParts.join(" ")} ` : signature;

  /* ⚠ THE ILLUSTRATION FALLS BACK TO THE SHIPPED ASSET, WHICH IS WHAT MAKES THE FIELD SAFE TO ADD.
     It was hardcoded here and invisible to /studio until the owner asked for it. Every settings file
     written before the field existed has no `heroFigure` key, so the fallback is what those files
     render — byte-identical to before. A cleared field lands here too, because a hero with no
     artwork is a broken layout rather than an empty slot: this is the one image on the page whose
     absence the composition cannot absorb. */
  const figureSrc = figure?.trim() ? figure.trim() : HERO_FIGURE_FALLBACK;

  const eyebrow = roleLabel?.trim() ? roleLabel : "Product designer";
  const cue     = scrollCue?.trim() ? scrollCue : "scroll to process";

  /* ⚠ EVERY SLOT IS GATED ON ITS OWN CONTENT AND NOTHING IS INVENTED. The tab NAME and the headline
     fall back, because a tab must be pressable and a blank answer is a blank hero. Support, callouts
     and figures do NOT — a blank there has nothing to fall back TO, and putting words on the page the
     owner never wrote is what the schema PR asserted must never happen. `filter(Boolean)` before the
     length check, so three empty strings read as absent rather than as three items. */
  const facets: HeroFacet[] = FACETS.map((f, i) => {
    const cms = tabs?.[i];
    return {
      tab: cms?.label?.trim() ? cms.label.trim() : f.tab,
      line: cms?.line?.trim() ? cms.line.trim() : f.line,
      support: cms?.support?.trim() ?? "",
      calls: (cms?.callouts ?? [])
        .map((c, j) => [c.trim(), CALLOUT_Y[j] ?? 50] as [string, number])
        .filter(([label]) => label !== ""),
      stats: (cms?.stats ?? []).filter((st) => st.value.trim()),
    };
  });

  const sectionRef  = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeIntent = useRef<"horizontal" | "vertical" | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (swipeIntent.current === "horizontal") e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") return;
    if (typeof window !== "undefined" && window.innerWidth >= MOBILE_BP) return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    swipeIntent.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (swipeIntent.current !== null) return;
    const dx = Math.abs(e.clientX - touchStartX.current);
    const dy = Math.abs(e.clientY - touchStartY.current);
    if (dx + dy > 8) {
      swipeIntent.current = dx > dy * INTENT_RATIO ? "horizontal" : "vertical";
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") return;
    const startX = touchStartX.current;
    const intent = swipeIntent.current;
    touchStartX.current = null;
    touchStartY.current = null;
    swipeIntent.current = null;
    if (startX === null || intent !== "horizontal") return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) < SWIPE_PX) return;
    setActive(prev =>
      dx < 0
        ? Math.min(prev + 1, FACETS.length - 1)
        : Math.max(prev - 1, 0)
    );
  };

  const handlePointerCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    swipeIntent.current = null;
  };

  const pillTransition = isReducedMotion ? PILL_INSTANT : PILL_SPRING;

  /* ⚠ TWO MOTIONS THAT MUST NOT SHARE AN ELEMENT, WHICH IS WHY EVERY MOVING THING IS A PAIR. The
     entrance is a CSS animation with a `forwards` fill and the parallax is a plain transform; on one
     element the animation wins and the parallax freezes at the entrance value forever. The outer
     `.hero-piece` and `.hero-figure` carry the pointer transform, their inner `.hero-pin` and `img`
     carry the entrance. `hero-illustration` B1 and B2 assert the pairs, because a collapse renders
     identically today and only surfaces once motion exists. */
  const shellRef = useRef<HTMLDivElement>(null);
  const artRef   = useRef<HTMLDivElement>(null);
  const emberRef = useRef<HTMLCanvasElement>(null);

  /* Assemble runs on mount and replays on every tab change, exactly as the contract's replay()
     does. The class is removed and re-added two frames apart so the animations restart rather
     than being skipped as already finished. Under reduced motion the class is added once and the
     CSS reset paints every final state. */
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    if (isReducedMotion) { el.classList.add("is-running"); return; }
    el.classList.remove("is-running");
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => el.classList.add("is-running"));
    });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, [active, isReducedMotion]);

  /* ⚠ THE EMBER BACKDROP — the contract's ash engine, verbatim. Thousands of particles stream in
     from the edges and settle into four themed panels behind the figure; on a tab change they
     re-gather into a different arrangement. The loop stops the frame the last particle lands.
     Reduced motion paints the settled state directly, because a canvas loop is invisible to any
     CSS reset. */
  useEffect(() => {
    const art = artRef.current, cv = emberRef.current, root = sectionRef.current;
    if (!art || !cv || !root) return;
    let raf = 0;
    const assemble = () => {
      cancelAnimationFrame(raf);
      const W = art.clientWidth, H = art.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cs = getComputedStyle(root);
      /* ⚠ FOUR EMBER SLOTS, READ FROM THE STYLESHEET RATHER THAN NAMED HERE. They resolve to one
         accent at four strengths — the contract's warm four-rung ladder has no site equivalent,
         because rungs do not remap on a dark ground. Reading them by name keeps the palette
         decision in CSS where the theme can reach it, which a literal in this file could not be. */
      const cols = ["--hx-ember-1", "--hx-ember-2", "--hx-ember-3", "--hx-ember-4"]
        .map((k) => cs.getPropertyValue(k).trim());
      type Part = { hx: number; hy: number; sx: number; sy: number; c: string; d: number; s: number; o: number };
      const parts: Part[] = [];
      EMBER_LAYOUTS[active].forEach((sh, i) => {
        const pts: [number, number][] = [];
        if (sh.t === "r") {
          const x = sh.x * W, y = sh.y * H, w = sh.w * W, h = sh.h * H;
          const n = Math.round(w * h * 0.0055);
          for (let k = 0; k < n; k++) pts.push([x + Math.random() * w, y + Math.random() * h]);
        } else {
          const cx = sh.x * W, cy = sh.y * H, rr = sh.r * Math.min(W, H);
          const n = Math.round(Math.PI * rr * rr * 0.0055);
          for (let k = 0; k < n; k++) {
            const a = Math.random() * 6.2832, d = Math.sqrt(Math.random()) * rr;
            pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]);
          }
        }
        pts.forEach((p) => {
          const edge = Math.floor(Math.random() * 3);
          const sx = edge === 0 ? -40 : edge === 1 ? W + 40 : p[0] + (Math.random() - 0.5) * W * 0.7;
          const sy = edge === 2 ? H + 60 : p[1] + (Math.random() - 0.5) * H * 0.9;
          parts.push({
            hx: p[0], hy: p[1], sx, sy, c: cols[i % 4],
            d: Math.random() * 520 + i * 90,
            s: 0.9 + Math.random() * 1.5, o: 0.25 + Math.random() * 0.5,
          });
        });
      });
      if (isReducedMotion) {
        g.clearRect(0, 0, W, H);
        parts.forEach((p) => { g.globalAlpha = p.o; g.fillStyle = p.c; g.fillRect(p.hx, p.hy, p.s, p.s); });
        g.globalAlpha = 1;
        return;
      }
      const t0 = performance.now(), DUR = 1250;
      const step = (now: number) => {
        g.clearRect(0, 0, W, H);
        let live = false;
        for (const p of parts) {
          const e0 = now - t0 - p.d;
          const t = e0 <= 0 ? 0 : Math.min(e0 / DUR, 1);
          if (t < 1) live = true;
          const e = 1 - Math.pow(1 - t, 3);
          const x = p.sx + (p.hx - p.sx) * e, y = p.sy + (p.hy - p.sy) * e;
          const wob = (1 - e) * Math.sin(now / 240 + p.hx * 0.05) * 7;
          g.globalAlpha = p.o * (0.25 + 0.75 * e);
          g.fillStyle = p.c;
          g.fillRect(x + wob, y + wob * 0.5, p.s, p.s);
        }
        g.globalAlpha = 1;
        if (live) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    assemble();
    window.addEventListener("resize", assemble);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", assemble); };
  }, [active, isReducedMotion]);

  /* the connector lines need real pixel geometry — the hero's box and the panel's left edge —
     so they render only after measurement and remeasure with the shell */
  const [lineGeom, setLineGeom] = useState<{ w: number; h: number; artLeft: number } | null>(null);
  useEffect(() => {
    const shell = shellRef.current, art = artRef.current;
    if (!shell || !art) return;
    const measure = () => {
      const s = shell.getBoundingClientRect();
      const a = art.getBoundingClientRect();
      setLineGeom({ w: Math.round(s.width), h: Math.round(s.height), artLeft: Math.round(a.left - s.left) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(shell);
    return () => ro.disconnect();
  }, []);

  /* Magnetic. Depth is divergent MULTIPLIERS rather than stacking order — the figure moves ×7, the
     ember canvas ×14 the other way, the cursor ×18, the spark ×20, the blue card ×24, the lime
     card ×34. Written as custom properties on the panel so every consumer reads one pointer event,
     and skipped entirely under reduced motion rather than written and then cancelled in CSS. */
  const handleArtPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = artRef.current;
    if (!el || isReducedMotion) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    const mx = (x - 0.5) * 2;
    const my = (y - 0.5) * 2;
    const S = el.style;
    S.setProperty("--tilt-x", `${(-my * 1.8).toFixed(2)}deg`);
    S.setProperty("--tilt-y", `${(mx * 2.6).toFixed(2)}deg`);
    S.setProperty("--hero-x", `${(mx * 7).toFixed(1)}px`);
    S.setProperty("--hero-y", `${(my * 5).toFixed(1)}px`);
    S.setProperty("--bg-x", `${(-mx * 14).toFixed(1)}px`);
    S.setProperty("--bg-y", `${(-my * 11).toFixed(1)}px`);
    S.setProperty("--p1x", `${(-mx * 24).toFixed(1)}px`);
    S.setProperty("--p1y", `${(-my * 18).toFixed(1)}px`);
    S.setProperty("--p2x", `${(mx * 34).toFixed(1)}px`);
    S.setProperty("--p2y", `${(my * 24).toFixed(1)}px`);
    S.setProperty("--p3x", `${(-mx * 18).toFixed(1)}px`);
    S.setProperty("--p3y", `${(my * 22).toFixed(1)}px`);
    S.setProperty("--p4x", `${(mx * 20).toFixed(1)}px`);
    S.setProperty("--p4y", `${(-my * 24).toFixed(1)}px`);
    S.setProperty("--px", `${(x * 100).toFixed(1)}%`);
    S.setProperty("--py", `${(y * 100).toFixed(1)}%`);
  };

  const handleArtPointerLeave = () => {
    const el = artRef.current;
    if (!el) return;
    const S = el.style;
    ["--tilt-x", "--tilt-y"].forEach((k) => S.setProperty(k, "0deg"));
    ["--hero-x", "--hero-y", "--bg-x", "--bg-y", "--p1x", "--p1y", "--p2x", "--p2y", "--p3x", "--p3y", "--p4x", "--p4y"]
      .forEach((k) => S.setProperty(k, "0px"));
    S.setProperty("--px", "50%");
    S.setProperty("--py", "50%");
  };

  const showLines = lineGeom !== null && lineGeom.w > 1023;

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`hero-ground hero-ground--split ${heroFontVariables}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* The ONE cursor glow — translate3d + rAF, off on touch/reduced-motion (--glow-on-paper). */}
      <CursorGlow />

      {/* ⚠ THE GRAIN FILTER, DECLARED ONCE AND OFF-LAYOUT. `feTurbulence` is the contract's texture
          and there is no CSS equivalent, so the filter has to exist as real SVG somewhere. Zero-sized
          and aria-hidden, so it contributes no box and no accessible node. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <filter id="hero-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.14" /></feComponentTransfer>
        </filter>
      </svg>

      {/* ⚠ TWO COLUMNS, COPY LEFT AND ARTWORK BLEEDING RIGHT, AND THE CENTRED HERO IS DELETED RATHER
          THAN WRAPPED. What stood here was a Container holding a centre-aligned signature, a 144px
          script watermark and a pulsing dot — a whole composition, not a variant of this one.
          Keeping it behind a class would have left two heroes in one file, which is the shape that
          let an unreachable studio route drift for an arc.

          THE SHELL IS THE POSITIONED BOX. Both columns are absolute inside it, which is what lets
          the artwork own its own height and reach three edges of the viewport. `is-running` arrives
          from the assemble effect, on mount and on every tab change. */}
      <div ref={shellRef} className="hero-shell">
        <div className="hero-field" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />

        {/* ⚠ THE ARTWORK PANEL. Nothing is EVER applied to the illustration — no filter, mask,
            clip-path, blend or opacity, in either motion, ever. An earlier version of this design
            shipped a duotone that nobody read as hiding the artwork until the owner did. The plate,
            embers, veil, seam and sheen are siblings and a pseudo-element; `hero-illustration` C1
            asserts the absence on the figure's own two rules rather than trusting a polish pass. */}
        <div
          ref={artRef}
          className="hero-art"
          aria-hidden="true"
          onPointerMove={handleArtPointerMove}
          onPointerLeave={handleArtPointerLeave}
        >
          <div className="hero-plate" />
          <canvas ref={emberRef} className="hero-ember" />

          <div className="hero-figure">
            {/* ⚠ NEXT/IMAGE, because this repo serves rasters through the optimizer. The intrinsic
                size is the source's; the panel drives the rendered height and the width overflows
                and is clipped, which is why no `sizes` guess can be right — it is height-driven. */}
            <Image
              src={figureSrc}
              alt=""
              width={1033}
              height={1024}
              priority
              sizes="(max-width: 1023px) 100vw, 60vw"
            />
          </div>

          {/* ⚠ THE PIECES SIT IN THE ARTWORK'S TRANSPARENT WEDGE, WHICH IS NOT THE SAME AS THE
              PANEL'S EMPTY EDGE — the figure's bounding box IS the panel at every real viewport,
              because the raster is height-driven and 1.009:1 while the panel is roughly 0.6:1. The
              cutout is 77.5% opaque and its box is the full frame, so only the ALPHA says where the
              gutter is: an upper-left wedge and a lower-left strip. These positions were measured
              against it in the render at 16:10, 16:9 and 8:5, and below 3:2 the pieces hide
              entirely because the crop leaves no clear column at all. */}
          <div className="hero-piece hero-piece--blue hero-card" style={{ left: "2%", top: "7%" }}>
            <div className="hero-pin">
              <span className="hero-card-dot" />
              <span className="hero-card-line" />
              <span className="hero-card-line is-short" />
              <span className="hero-card-ports"><i /><i /><i /></span>
            </div>
          </div>

          {/* ⚠ TWO ROWS, NOT FOUR, AND THAT IS WHAT MAKES `is-sm` ACTUALLY SMALL. It carried the same
              four rows as the blue card and differed only in width, so it stood 90px tall — and when
              the figure dropped to clear the nav, the lower-left clearing shortened to 63px and the
              card no longer fitted anywhere below the shoulder. Measured: with the drop, the only
              window holding a 90px card is the top 16% of the panel, where the blue one already is.
              Shorter is the fix that keeps the composition's lower anchor. */}
          <div className="hero-piece hero-piece--lime hero-card is-sm" style={{ left: "1.5%", bottom: "0%" }}>
            <div className="hero-pin">
              <span className="hero-card-dot" />
              <span className="hero-card-line" />
            </div>
          </div>

          <div className="hero-piece hero-piece--cursor" style={{ left: "1.5%", top: "28%" }}>
            <div className="hero-pin">
              {/* ⚠ INLINED, NOT AN <img>. These are `currentColor` SVGs and an <img> cannot inherit
                  it — the file would draw its own colour and stop following the ink, which is the
                  whole reason the committed icons replace the mock's CSS shapes. */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="24" height="30" role="presentation">
                <path
                  d="M1.6 1.2 L1.6 24.4 L7.9 18.6 L11.6 27.4 L15.2 25.8 L11.6 17.2 L20.1 16.6 Z"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </div>
          </div>

          <div className="hero-piece hero-piece--spark" style={{ left: "1.5%", top: "19%" }}>
            <div className="hero-pin">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="presentation">
                <path
                  d="M20 1.5 C21.4 11.6 28.4 18.6 38.5 20 C28.4 21.4 21.4 28.4 20 38.5 C18.6 28.4 11.6 21.4 1.5 20 C11.6 18.6 18.6 11.6 20 1.5 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="hero-veil" />
          <div className="hero-seam" />
          <span className="hero-fig-label">Fig. 01 — the designer</span>
        </div>

        {/* ⚠ FOUR CHILDREN AND FOUR GRID ROWS, `auto auto 1fr auto`. The `1fr` is the body, so the
            answer sits optically centred in the column while the eyebrow pins to the top and the
            scroll cue to the bottom — which is why nothing here is wrapped in a <Reveal>: an extra
            wrapper element would become a fifth row and break the alignment. */}
        <div className="hero-copy">
          <p className="hero-eyebrow">{eyebrow}</p>

          <div>
            {/* The page's single h1. LCP: the name is the home page's largest-contentful paint, so
                it must NOT be wrapped in <Reveal> — that ships opacity:0 in SSR and only reveals
                after hydration, delaying LCP by ~1.8s on throttled mobile.

                ⚠ INK WITH ONLY THE `<em>` IN ACCENT. The split is in `.hero-name` and
                `.hero-name em` rather than in utilities, because the unlayered `h1` rule sets
                family and weight and beats a utility at any specificity — the same hazard that made
                a `font-script` class on this element draw nothing for months. */}
            <h1 className="hero-name">{nameLead}{nameEm ? <em>{nameEm}</em> : null}</h1>

            {/* ⚠ ONE PILL GROUP AT EVERY WIDTH. There were two controls here — a mobile-only row
                of dot indicators and a desktop-only row of labelled tabs — carrying the SAME
                `aria-label`, which is how `studio-ink` J1 came to anchor on the wrong one and read
                a container with no type utilities at all. Below the breakpoint this group scrolls
                horizontally instead of being replaced, so there is one control, one label and one
                anchor. */}
            <LayoutGroup>
              <div role="group" aria-label="Designer facets" className="hero-tabs">
                {facets.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={i === active}
                    onClick={() => setActive(i)}
                    className="relative px-[15px] py-[9px] text-[10px] uppercase tracking-[0.15em] font-normal rounded-full transition-colors duration-[var(--duration-base)] select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent-500"
                    style={{
                      /* ⚠ `--hx-tab-faint`, NOT `--hx-faint` — see globals.css beside the token.
                         The shared one is `text-subtle`, which measured 3.11 / 3.82 / 4.26 against
                         this track on sapphire, ink-flare and nocturne, under the 4.5 floor. The
                         tabs take `text-secondary`: 5.09 / 6.71 / 7.39 there, 7.12 to 8.66 light.
                         ROLE TO ROLE — the hero already took a role, and what failed was the choice
                         of rung. Scoped to a tab token so the hero's other three `--hx-faint`
                         consumers, which nobody has measured, do not move with it. */
                      color: i === active ? "var(--hx-cta-fg)" : "var(--hx-tab-faint)",
                    }}
                  >
                    {i === active && (
                      <motion.span
                        layoutId="hero-tab-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full"
                        style={{
                          /* ⚠ THE FILL IS THE ACCENT ROLE AND THE SHADOW STAYS A TOKEN READ.
                             `vessel-alias` C1 asserts the pill's shadow arrives through
                             `--hero-tab-shadow` so a selector can give it a dark answer — the
                             contract's value is supplied by overriding that token under
                             `.hero-ground--split`, never by an inline literal here. */
                          backgroundColor: "var(--hx-accent)",
                          boxShadow: "var(--hero-tab-shadow)",
                        }}
                        transition={pillTransition}
                      />
                    )}
                    <span className="relative z-10">{f.tab}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>

          <div className="hero-body">
            <AnimatePresence mode="wait">
              <motion.h2
                key={active}
                className="hero-line"
                variants={isReducedMotion ? lineContainerVariantsReduced : lineContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {isReducedMotion
                  ? plain(facets[active].line)
                  : facets[active].line.split(/\s+/).map((word, i, arr) => (
                      <Fragment key={`${active}-w-${i}`}>
                        <motion.span
                          variants={wordVariants}
                          style={{ display: "inline-block" }}
                        >
                          <HeroWord word={word} />
                        </motion.span>
                        {i < arr.length - 1 ? " " : null}
                      </Fragment>
                    ))
                }
              </motion.h2>
            </AnimatePresence>

            {/* keyed on the tab so support, chips and counters re-enter on every pick, with the
                contract's own delays. Each slot still gates on its own content — the CMS branch
                renders exactly nothing where a field is empty. */}
            <Fragment key={active}>
              {facets[active].support ? (
                <p className="hero-support hero-fade" style={{ animationDelay: "240ms" }}>
                  {facets[active].support}
                </p>
              ) : null}

              {facets[active].calls.length > 0 ? (
                <ul className="hero-callouts">
                  {facets[active].calls.map((c, i) => (
                    <li key={i} className="hero-fade" style={{ animationDelay: `${240 + i * 90}ms` }}>
                      {c[0]}
                    </li>
                  ))}
                </ul>
              ) : null}

              {facets[active].stats.length > 0 ? (
                <dl className="hero-counters hero-fade" style={{ animationDelay: "300ms" }}>
                  {facets[active].stats.map((st, i) => (
                    <div key={i}>
                      <dt>
                        <RollNumber value={st.value} delay={i * 90} reduced={!!isReducedMotion} />
                      </dt>
                      <dd>{st.unit}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </Fragment>
          </div>

          {/* ⚠ THE TARGET AND THE COPY COME FROM DIFFERENT PLACES AND NOTHING TIES THEM. `cue` is
              `heroScrollCue` in site-settings and is EDITABLE BY AN AUTHOR in /studio's hero panel;
              this destination is code. They agreed by coincidence until now.
              The copy cannot derive the target — it is free text, and "Take a look below" yields no
              id — so the pair is ASSERTED instead: `nav-order` fails if this id stops being the
              first non-route entry in `SiteHeader`'s NAV. An author renaming the cue still cannot
              break where it goes; what they can do is describe it wrongly, which is an authoring
              error like any other copy error and is not one a gate can see. */}
          <a
            href="#work"
            className="hero-scroll"
            onClick={(e) => {
              const el = document.getElementById("work");
              if (el && smoothScroll) {
                e.preventDefault();
                smoothScroll.scrollToTarget(el);
              }
            }}
          >
            {cue}
          </a>
        </div>

        {/* the connector lines — redrawn per tab, desktop only, and keyed so the draw animation
            replays on every pick exactly as the contract's drawLines does.

            ⚠ EVERYTHING HERE ENDS BEFORE THE SEAM, BY THE OWNER'S RULING. The contract puts the
            kink 30px INSIDE the panel and the label after it, over the artwork, where 9px mono
            text loses to the illustration. So the box is exactly `artLeft` wide, the kink sits
            30px left of the seam, and the label anchors END before the dot — on the copy ground,
            never on the art. */}
        {showLines && facets[active].calls.length > 0 ? (
          <svg
            key={`lines-${active}`}
            className="hero-lines"
            viewBox={`0 0 ${lineGeom.artLeft} ${lineGeom.h}`}
            style={{ width: `${lineGeom.artLeft}px` }}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {facets[active].calls.map(([label, pct], i) => {
              const y = (lineGeom.h * pct) / 100;
              const x0 = lineGeom.w * 0.32;
              const x1 = lineGeom.artLeft - 30;
              const ky = y - 20;
              const d = `M ${x0} ${y} H ${x1 - 28} L ${x1} ${ky}`;
              const len = Math.round(x1 - 28 - x0 + Math.hypot(28, 20));
              const dl = 120 + i * 140;
              const lenVar = { "--len": len } as React.CSSProperties;
              return (
                <Fragment key={i}>
                  <path className="hero-trace" d={d} style={{ ...lenVar, animationDelay: `${dl}ms` }} />
                  <path className="hero-spark" d={d} style={{ ...lenVar, animationDelay: `${dl}ms` }} />
                  <circle className="hero-dot" cx={x1} cy={ky} r={5.5} style={{ animationDelay: `${dl + 820}ms` }} />
                  <circle className="hero-core" cx={x1} cy={ky} r={1.8} style={{ animationDelay: `${dl + 880}ms` }} />
                  <text x={x1 - 13} y={ky + 3.5} textAnchor="end" style={{ animationDelay: `${dl + 900}ms` }}>{label}</text>
                </Fragment>
              );
            })}
          </svg>
        ) : null}
      </div>
    </section>
  );
}
