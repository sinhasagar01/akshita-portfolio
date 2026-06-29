"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import SectionHeading from "@/components/ui/SectionHeading";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { SiteSettingsEntry } from "@/lib/keystatic";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";

type Props = { settings: SiteSettingsEntry | null };

const STAGES = [
  {
    index: "01",
    name: "Discover",
    description: "I sit with the ambiguity, talk to people, and map what is really going on.",
    tags: ["interviews", "research", "audits"],
  },
  {
    index: "02",
    name: "Define",
    description: "I narrow it to the real problem, the people, and the scope.",
    tags: ["personas", "journeys", "scope"],
  },
  {
    index: "03",
    name: "Design",
    description: "I shape it, from rough wireframes to a working prototype.",
    tags: ["wireframes", "prototypes", "systems"],
  },
  {
    index: "04",
    name: "Validate",
    description: "I put it in front of people, refine, and measure the impact.",
    tags: ["usability tests", "iteration", "handoff"],
  },
] as const;

type Stage = (typeof STAGES)[number];

// [translateX, translateY, rotate] for fan slot d=0 (active/front) through d=3
const FAN_POS = [
  [0, 0, 0],
  [34, 10, 9],
  [-32, 18, -10],
  [50, 28, 15],
] as const;
const FAN_SCALE = [1, 0.96, 0.93, 0.9];
const FAN_OPACITY = [1, 0.9, 0.82, 0.74];
const FAN_Z = [40, 30, 20, 10];

// Per-stage glow drift offsets [x, y] in px
const GLOW_OFFSETS = [
  [0, -4],
  [22, 2],
  [-20, 6],
  [14, 14],
] as const;

export default function ProcessSection(_props: Props) {
  const [active, setActive] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const prefersReduced = useReducedMotion();
  const lenis = useLenis();
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Keep a ref so the ScrollTrigger effect can reach the current lenis instance
  // without declaring lenis as a dependency and recreating the trigger on changes.
  const lenisRef = useRef(lenis);
  useEffect(() => { lenisRef.current = lenis; }, [lenis]);

  const { isProgrammaticRef } = useSmoothScroll() ?? {};
  const userScrolled = useRef(false);
  useEffect(() => {
    const mark = () => { userScrolled.current = true; };
    window.addEventListener("wheel", mark, { passive: true });
    window.addEventListener("touchmove", mark, { passive: true });
    window.addEventListener("keydown", mark);
    return () => {
      window.removeEventListener("wheel", mark);
      window.removeEventListener("touchmove", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsSmallScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const noPin = !!prefersReduced || isSmallScreen;

  useEffect(() => {
    if (noPin || !wrapperRef.current) return;

    let snapTimer: ReturnType<typeof setTimeout> | null = null;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: "process-scrub",
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          // During programmatic scrolls: suppress stepper update AND snap together.
          if (isProgrammaticRef?.current) {
            if (snapTimer) clearTimeout(snapTimer);
            snapTimer = null;
            return;
          }

          const stage = Math.min(3, Math.round(self.progress * 3));
          setActive(stage);

          if (!userScrolled.current || !self.isActive) return;

          // After the user pauses, snap to that stage's third-point via Lenis.
          if (snapTimer) clearTimeout(snapTimer);
          snapTimer = setTimeout(() => {
            snapTimer = null;
            if (isProgrammaticRef?.current) return; // race guard
            const st = ScrollTrigger.getById("process-scrub");
            const l = lenisRef.current;
            if (!st || !l) return;
            const snapTarget = st.start + (stage / 3) * (st.end - st.start);
            l.scrollTo(snapTarget, { duration: 0.4 });
          }, 100);
        },
      });
      ScrollTrigger.refresh();
    });

    return () => {
      if (snapTimer) clearTimeout(snapTimer);
      ctx.revert();
    };
  }, [noPin]);

  const scrollToStage = useCallback(
    (i: number) => {
      if (noPin || !lenis || !wrapperRef.current) {
        setActive(i);
        return;
      }
      const wrapper = wrapperRef.current;
      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      const target = wrapperTop + (i / 3) * wrapper.offsetHeight;
      lenis.scrollTo(target, { duration: 0.8 });
    },
    [noPin, lenis],
  );

  const inner = (
    <section
      id="process"
      className={[
        "section-card scroll-mt-20",
        noPin
          ? "py-section"
          : "sticky top-0 min-h-screen flex flex-col justify-center py-section",
      ].join(" ")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] items-center">
        <LeftColumn active={active} onSelect={scrollToStage} />
        <FanDeck active={active} skipAnim={noPin} />
      </div>
    </section>
  );

  if (noPin) return inner;

  return (
    <div ref={wrapperRef} style={{ height: "240vh" }}>
      {inner}
    </div>
  );
}

/* ── Left column ─────────────────────────────────────────────── */

function LeftColumn({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div>
      <SectionHeading
        index="01"
        title="Process"
        subtext="Watch a rough idea grow into the shipped design."
        variant="default"
        tone="grey"
      />
      <div className="mt-8 sm:mt-[52px]">
        <StageCopy stage={STAGES[active]} />
        <VerticalStepper active={active} onSelect={onSelect} />
      </div>
    </div>
  );
}

/* ── Stage copy ──────────────────────────────────────────────── */

const stageWrap = {
  enter: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] as const },
  },
};

const stageLine = {
  enter: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, y: 0 },
};

function StageCopy({ stage }: { stage: Stage }) {
  return (
    <div className="relative min-h-[180px] overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage.index}
          variants={stageWrap}
          initial="enter"
          animate="show"
          exit="exit"
          className="flex flex-col"
        >
          <motion.span
            variants={stageLine}
            className="text-meta font-[--font-weight-medium] uppercase tracking-ui"
            style={{ color: "var(--color-accent-500)" }}
          >
            {stage.index}
          </motion.span>
          <motion.h3
            variants={stageLine}
            className="font-display italic text-subheading text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mt-1 mb-2.5"
          >
            {stage.name}
          </motion.h3>
          <motion.p
            variants={stageLine}
            className="text-sm text-[--color-text-secondary] leading-[--leading-normal]"
            style={{ minHeight: "46px" }}
          >
            {stage.description}
          </motion.p>
          <motion.div
            variants={stageLine}
            className="flex flex-wrap gap-[6px] mt-[14px]"
          >
            {stage.tags.map((tag) => (
              <span
                key={tag}
                className="text-tag px-[11px] py-1 rounded-full text-[--color-text-muted] leading-none"
                style={{
                  background: "var(--color-cream-200)",
                  border: "1px solid color-mix(in oklch, var(--color-text-primary) 14%, transparent)",
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Vertical stepper ────────────────────────────────────────── */

function VerticalStepper({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (i: number) => void;
}) {
  const ROW_H = 44;
  const railHeight = (STAGES.length - 1) * ROW_H;
  const fillHeight = active * ROW_H;

  return (
    <div
      className="relative"
      style={{ paddingLeft: "6px", marginTop: "28px" }}
      role="tablist"
      aria-label="Process stages"
    >
      {/* background rail */}
      <div
        style={{
          position: "absolute",
          left: "17px",
          top: "22px",
          width: "2px",
          height: `${railHeight}px`,
          background: "color-mix(in oklch, var(--color-text-primary) 18%, transparent)",
          zIndex: 1,
        }}
      />
      {/* terracotta fill */}
      <div
        style={{
          position: "absolute",
          left: "17px",
          top: "22px",
          width: "2px",
          height: `${fillHeight}px`,
          background: "var(--color-accent-500)",
          transition: "height 0.4s ease",
          zIndex: 2,
        }}
      />
      {STAGES.map((stage, i) => {
        const isActive = i === active;
        const isDone = i < active;

        return (
          <button
            key={stage.index}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(i)}
            className="flex items-center gap-3 w-full cursor-pointer bg-transparent border-0 p-0 text-left"
            style={{ height: `${ROW_H}px`, position: "relative", zIndex: 3 }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                background: isActive || isDone ? "var(--color-accent-500)" : "var(--color-cream-50)",
                border: isActive || isDone
                  ? "1.5px solid var(--color-accent-500)"
                  : "1.5px solid color-mix(in oklch, var(--color-text-primary) 32%, transparent)",
                color: isActive || isDone ? "var(--color-cream-50)" : "var(--color-text-muted)",
                transition: "background 0.3s, border-color 0.3s, color 0.3s",
              }}
            >
              {isActive || isDone ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6 l2.2 2.2 4.8 -4.4"
                    stroke="var(--color-cream-50)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              style={{
                fontSize: "13px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? "var(--color-accent-500)" : "var(--color-text-muted)",
                fontWeight: isActive ? 500 : 400,
                transition: "color 0.3s",
                fontFamily: "var(--font-body)",
              }}
            >
              {stage.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Fan deck ────────────────────────────────────────────────── */

function FanDeck({ active, skipAnim }: { active: number; skipAnim: boolean }) {
  const [ox, oy] = GLOW_OFFSETS[active];

  return (
    <div style={{ position: "relative", height: "400px" }}>
      {/* Warm glow — z-index 0, below cards (10–40), pointer-events none */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          zIndex: 0,
          pointerEvents: "none",
          transform: skipAnim ? "translate(0px,0px)" : `translate(${ox}px,${oy}px)`,
          transition: skipAnim ? "none" : "transform 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Breathe wrapper — key change remounts and restarts the scale sequence */}
        <motion.div
          key={skipAnim ? "g" : active}
          animate={skipAnim ? { scale: 1 } : { scale: [1, 1.07, 1] }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] }}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {/* Halo ~300px */}
          <div
            style={{
              position: "absolute",
              width: "300px",
              height: "300px",
              left: "-150px",
              top: "-150px",
              filter: "blur(34px)",
              background:
                "radial-gradient(closest-side, rgba(181,97,60,0.36), rgba(181,97,60,0.12) 48%, transparent 72%)",
              pointerEvents: "none",
            }}
          />
          {/* Core ~200px */}
          <div
            style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              left: "-100px",
              top: "-100px",
              filter: "blur(34px)",
              background:
                "radial-gradient(closest-side, rgba(224,156,96,0.34), transparent 70%)",
              pointerEvents: "none",
            }}
          />
        </motion.div>
      </div>

      {/* Cards */}
      {STAGES.map((_, i) => {
        const d = (i - active + 4) % 4;
        const [tx, ty, rot] = FAN_POS[d];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "248px",
              height: "320px",
              marginTop: "-160px",
              marginLeft: "-124px",
              borderRadius: "18px",
              border: "1.5px solid var(--color-accent-500)",
              background: "var(--color-cream-50)",
              boxShadow: "0 10px 30px color-mix(in oklch, var(--color-accent-500) 12%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: FAN_Z[d],
              opacity: FAN_OPACITY[d],
              transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${FAN_SCALE[d]})`,
              transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.45s",
            }}
          >
            <CardGraphic index={i} active={active} skipAnim={skipAnim} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Card graphics ───────────────────────────────────────────── */

function CardGraphic({
  index,
  active,
  skipAnim,
}: {
  index: number;
  active: number;
  skipAnim: boolean;
}) {
  const isActive = index === active;
  switch (index) {
    case 0:
      return <ArtifactDiscover isActive={isActive} skipAnim={skipAnim} />;
    case 1:
      return <ArtifactDefine isActive={isActive} skipAnim={skipAnim} />;
    case 2:
      return <ArtifactDesign isActive={isActive} skipAnim={skipAnim} />;
    case 3:
      return <ArtifactValidate isActive={isActive} skipAnim={skipAnim} />;
    default:
      return null;
  }
}

/* ── Draw helper ─────────────────────────────────────────────── */

function runDraw(svg: SVGSVGElement | null, skipAnim: boolean, isActive: boolean) {
  if (!svg) return;
  const dr = Array.from(svg.querySelectorAll<SVGElement>(".dr"));
  const fd = Array.from(svg.querySelectorAll<SVGElement>(".fd"));

  // Immediate final state: reduced motion, mobile no-pin, or non-active card
  if (skipAnim || !isActive) {
    dr.forEach((el) => {
      el.style.transition = "none";
      el.style.strokeDashoffset = "0";
    });
    fd.forEach((el) => {
      el.style.transition = "none";
      el.style.opacity = "1";
    });
    return;
  }

  // Active stage: reset then sketch in
  dr.forEach((el, k) => {
    el.style.transition = "none";
    el.style.strokeDashoffset = "1";
    el.getBoundingClientRect(); // force reflow before starting transition
    el.style.transition = "stroke-dashoffset 0.6s ease";
    el.style.transitionDelay = `${k * 0.13}s`;
    el.style.strokeDashoffset = "0";
  });

  const base = dr.length * 0.13 + 0.25;
  fd.forEach((el, k) => {
    el.style.transition = "none";
    el.style.opacity = "0";
    el.getBoundingClientRect();
    el.style.transition = "opacity 0.45s ease";
    el.style.transitionDelay = `${base + k * 0.08}s`;
    el.style.opacity = "1";
  });
}

/* ── Artifact: Discover — lightbulb with filament scribble ──── */

function ArtifactDiscover({ isActive, skipAnim }: { isActive: boolean; skipAnim: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => { runDraw(ref.current, skipAnim, isActive); }, [isActive, skipAnim]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 240"
      fill="none"
      stroke="var(--color-accent-500)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="88%"
      height="82%"
      aria-hidden
    >
      {/* Bulb outline */}
      <circle className="dr" pathLength={1} cx={100} cy={84} r={31} />
      {/* Bulb base collar */}
      <path className="dr" pathLength={1} d="M87 110 L87 126 Q87 137 100 137 Q113 137 113 126 L113 110" />
      {/* Collar horizontal lines */}
      <path className="dr" pathLength={1} d="M88 117 H112" />
      <path className="dr" pathLength={1} d="M90 123 H110" />
      {/* Filament scribble */}
      <path className="dr" pathLength={1} d="M89 88 q6 -14 11 0 q6 14 11 0" />
      {/* Spark rays — fade in after strokes */}
      <path className="fd" d="M100 34 V23" strokeWidth={2.6} />
      <path className="fd" d="M66 48 L58 40" strokeWidth={2.6} />
      <path className="fd" d="M134 48 L142 40" strokeWidth={2.6} />
      {/* "idea" handwritten label */}
      <text
        className="fd"
        x={100}
        y={190}
        textAnchor="middle"
        style={{ fontFamily: "var(--font-script)" }}
        fontSize={34}
        fill="var(--color-accent-500)"
        stroke="none"
        transform="rotate(-4 100 190)"
      >
        idea
      </text>
      {/* Underline curve below "idea" */}
      <path className="fd" d="M78 200 q22 8 44 0" strokeWidth={2.4} />
    </svg>
  );
}

/* ── Artifact: Define — boxes and dashed connectors ─────────── */

function ArtifactDefine({ isActive, skipAnim }: { isActive: boolean; skipAnim: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => { runDraw(ref.current, skipAnim, isActive); }, [isActive, skipAnim]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 240"
      fill="none"
      width="88%"
      height="82%"
      aria-hidden
    >
      <g stroke="var(--color-accent-500)" strokeWidth={3}>
        <rect className="dr" pathLength={1} x={40} y={62} width={50} height={38} rx={7} />
        <rect className="dr" pathLength={1} x={112} y={62} width={50} height={38} rx={7} />
        <rect className="dr" pathLength={1} x={76} y={150} width={50} height={38} rx={7} />
      </g>
      {/* Dashed connectors — fade in after boxes draw */}
      <g
        className="fd"
        stroke="var(--color-accent-500)"
        strokeWidth={2.4}
        strokeDasharray="2 7"
        fill="none"
      >
        <path d="M65 100 V128 H101 V150" />
        <path d="M137 100 V128 H101" />
      </g>
      {/* Convergence arrow */}
      <path
        className="fd"
        d="M95 144 l6 6 l6 -6"
        stroke="var(--color-accent-500)"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Artifact: Design — wireframe screen ────────────────────── */

function ArtifactDesign({ isActive, skipAnim }: { isActive: boolean; skipAnim: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => { runDraw(ref.current, skipAnim, isActive); }, [isActive, skipAnim]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 240"
      fill="none"
      width="88%"
      height="82%"
      aria-hidden
    >
      <g stroke="var(--color-accent-500)" strokeWidth={3}>
        <rect className="dr" pathLength={1} x={58} y={44} width={84} height={158} rx={11} />
        <path className="dr" pathLength={1} d="M58 76 H142" />
      </g>
      {/* Warm-fill content blocks — fade in after outline draws */}
      <g className="fd" fill="#e7d5c2">
        <rect x={72} y={90} width={56} height={18} rx={4} />
        <rect x={72} y={118} width={42} height={11} rx={3} />
        <rect x={72} y={136} width={50} height={11} rx={3} />
      </g>
      {/* CTA button block */}
      <rect className="fd" x={72} y={162} width={34} height={15} rx={4} fill="#cda98c" />
    </svg>
  );
}

/* ── Artifact: Validate — finished screen with check ────────── */

function ArtifactValidate({ isActive, skipAnim }: { isActive: boolean; skipAnim: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => { runDraw(ref.current, skipAnim, isActive); }, [isActive, skipAnim]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 240"
      fill="none"
      width="88%"
      height="82%"
      aria-hidden
    >
      {/* Phone outline — draws first */}
      <rect
        className="dr"
        pathLength={1}
        x={58}
        y={40}
        width={84}
        height={158}
        rx={11}
        fill="none"
        stroke="var(--color-accent-500)"
        strokeWidth={3}
      />
      {/* Filled header bar */}
      <path
        className="fd"
        d="M58 51 a11 11 0 0 1 11 -11 h62 a11 11 0 0 1 11 11 v17 H58 Z"
        fill="var(--color-accent-500)"
      />
      {/* Header avatar dot */}
      <circle className="fd" cx={76} cy={59} r={4} fill="white" />
      {/* Content row */}
      <rect className="fd" x={72} y={86} width={56} height={12} rx={3} fill="#efdfcb" />
      {/* Bar chart */}
      <g className="fd">
        <rect x={72} y={112} width={14} height={32} rx={2} fill="#cdb89a" />
        <rect x={91} y={124} width={14} height={20} rx={2} fill="#e7d5c2" />
        <rect x={110} y={104} width={14} height={40} rx={2} fill="var(--color-accent-500)" />
      </g>
      {/* Check circle */}
      <circle className="fd" cx={124} cy={172} r={12} fill="var(--color-accent-500)" />
      {/* Checkmark stroke — draws last (second .dr, after fills appear) */}
      <path
        className="dr"
        pathLength={1}
        d="M118 172 l4 5 l8 -9"
        stroke="white"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
