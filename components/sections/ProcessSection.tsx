"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import SectionLabel from "@/components/ui/SectionLabel";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { SiteSettingsEntry } from "@/lib/keystatic";

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

export default function ProcessSection(_props: Props) {
  const [active, setActive] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const prefersReduced = useReducedMotion();
  const lenis = useLenis();
  const wrapperRef = useRef<HTMLDivElement>(null);

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

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          setActive(Math.min(3, Math.floor(self.progress * 4)));
        },
      });
      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, [noPin]);

  const scrollToStage = useCallback(
    (i: number) => {
      if (noPin || !lenis || !wrapperRef.current) {
        setActive(i);
        return;
      }
      const wrapper = wrapperRef.current;
      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      const target = wrapperTop + (i / 4) * wrapper.offsetHeight;
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
        <FanDeck active={active} />
      </div>
    </section>
  );

  if (noPin) return inner;

  return (
    <div ref={wrapperRef} style={{ height: "250vh" }}>
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
      <SectionLabel className="mb-[9px]">Process</SectionLabel>
      <h2 className="font-display italic text-section-heading text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mb-6">
        watch the idea become the design
      </h2>
      <StageCopy stage={STAGES[active]} />
      <VerticalStepper active={active} onSelect={onSelect} />
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
            className="text-[--text-sm] text-[--color-text-secondary] leading-[--leading-normal]"
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

function FanDeck({ active }: { active: number }) {
  return (
    <div style={{ position: "relative", height: "400px" }}>
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
            <CardGraphic index={i} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Card graphics ───────────────────────────────────────────── */

function CardGraphic({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <GraphicDiscover />;
    case 1:
      return <GraphicDefine />;
    case 2:
      return <GraphicDesign />;
    case 3:
      return <GraphicValidate />;
    default:
      return null;
  }
}

function GraphicDiscover() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <g stroke="var(--color-ink-200)" strokeWidth="1.6" fill="var(--color-surface)">
        <rect x="36" y="64" width="74" height="56" rx="6" transform="rotate(-6 73 92)" />
        <rect x="96" y="42" width="74" height="56" rx="6" transform="rotate(5 133 70)" />
      </g>
      <g stroke="var(--color-ink-200)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="48" y1="84" x2="92" y2="80" transform="rotate(-6 73 92)" />
        <line x1="48" y1="96" x2="78" y2="94" transform="rotate(-6 73 92)" />
        <line x1="108" y1="60" x2="152" y2="58" transform="rotate(5 133 70)" />
        <line x1="108" y1="72" x2="138" y2="71" transform="rotate(5 133 70)" />
      </g>
      <circle cx="188" cy="122" r="30" fill="none" stroke="var(--color-accent-500)" strokeWidth="2.5" />
      <line x1="210" y1="144" x2="236" y2="170" stroke="var(--color-accent-500)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="210" cy="56" r="3" fill="var(--color-ink-200)" />
      <text
        x="224"
        y="80"
        style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
        fontSize="26"
        fill="var(--color-ink-200)"
      >
        ?
      </text>
    </svg>
  );
}

function GraphicDefine() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <rect x="40" y="48" width="96" height="116" rx="9" fill="var(--color-surface)" stroke="var(--color-text-primary)" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="64" cy="74" r="11" fill="none" stroke="var(--color-accent-500)" strokeWidth="1.8" />
      <rect x="84" y="68" width="40" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.22" />
      <rect x="84" y="80" width="28" height="5" rx="2.5" fill="var(--color-text-primary)" fillOpacity="0.13" />
      <rect x="56" y="104" width="64" height="5" rx="2.5" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <rect x="56" y="116" width="64" height="5" rx="2.5" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <rect x="56" y="128" width="44" height="5" rx="2.5" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <line x1="168" y1="106" x2="244" y2="106" stroke="var(--color-ink-200)" strokeWidth="1.6" />
      <circle cx="168" cy="106" r="6.5" fill="var(--color-surface)" stroke="var(--color-ink-200)" strokeWidth="1.6" />
      <circle cx="206" cy="106" r="6.5" fill="var(--color-accent-500)" />
      <circle cx="244" cy="106" r="6.5" fill="var(--color-surface)" stroke="var(--color-ink-200)" strokeWidth="1.6" />
    </svg>
  );
}

function GraphicDesign() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <rect x="62" y="34" width="156" height="138" rx="11" fill="var(--color-surface)" stroke="var(--color-text-primary)" strokeOpacity="0.65" strokeWidth="1.5" />
      <circle cx="78" cy="50" r="3" fill="var(--color-ink-200)" />
      <circle cx="89" cy="50" r="3" fill="var(--color-ink-200)" />
      <line x1="62" y1="62" x2="218" y2="62" stroke="var(--color-text-primary)" strokeOpacity="0.1" strokeWidth="1" />
      <rect x="78" y="78" width="84" height="10" rx="4" fill="var(--color-text-primary)" fillOpacity="0.22" />
      <rect x="78" y="98" width="124" height="7" rx="3.5" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <rect x="78" y="112" width="108" height="7" rx="3.5" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <rect x="78" y="136" width="54" height="18" rx="5" fill="var(--color-accent-500)" />
    </svg>
  );
}

function GraphicValidate() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <rect x="50" y="40" width="150" height="130" rx="11" fill="var(--color-surface)" stroke="var(--color-text-primary)" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle cx="66" cy="56" r="3" fill="var(--color-ink-200)" />
      <circle cx="77" cy="56" r="3" fill="var(--color-ink-200)" />
      <rect x="66" y="74" width="80" height="9" rx="4" fill="var(--color-text-primary)" fillOpacity="0.22" />
      <rect x="66" y="92" width="118" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <rect x="66" y="104" width="100" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.12" />
      <rect x="66" y="126" width="48" height="16" rx="5" fill="var(--color-accent-500)" fillOpacity="0.85" />
      <circle cx="196" cy="48" r="17" fill="var(--color-accent-500)" />
      <path d="M188 48 l5 5 10 -11" fill="none" stroke="var(--color-surface)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="214" y="150" width="10" height="14" rx="2" fill="var(--color-ink-200)" />
      <rect x="230" y="140" width="10" height="24" rx="2" fill="var(--color-ink-200)" />
      <rect x="246" y="126" width="10" height="38" rx="2" fill="var(--color-accent-500)" />
    </svg>
  );
}
