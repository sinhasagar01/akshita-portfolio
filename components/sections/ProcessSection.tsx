"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import { ScrollTrigger } from "@/lib/gsap";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

const STAGES = [
  {
    index: "01",
    name: "Discover",
    description: "I listen first, to users and to the business, before drawing anything.",
    tags: ["interviews", "research", "audits"],
  },
  {
    index: "02",
    name: "Define",
    description: "I frame the real problem, who it serves, and what success looks like.",
    tags: ["personas", "journeys", "scope"],
  },
  {
    index: "03",
    name: "Design",
    description: "I shape it, from wireframes through to polished, interactive UI.",
    tags: ["wireframes", "prototypes", "design systems"],
  },
  {
    index: "04",
    name: "Validate",
    description: "I put it in front of people, refine, and measure the impact.",
    tags: ["usability tests", "iteration", "handoff"],
  },
] as const;

export default function ProcessSection(_props: Props) {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? <ProcessSectionStatic /> : <ProcessSectionScrollable />;
}

/* ── Scrollable mode ─────────────────────────────────────────── */

function ProcessSectionScrollable() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stage = STAGES[active];
  const isLastStep = active === STAGES.length - 1;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setActive(Math.min(STAGES.length - 1, Math.floor(self.progress * STAGES.length)));
      },
    });

    return () => st.kill();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="section-card relative min-h-[180vh] scroll-mt-20"
    >
      <div className="sticky top-20 h-[calc(100dvh-5rem)] flex flex-col justify-center py-8">
        <Container>
          <Reveal>
            <SectionLabel className="mb-[9px]">Process</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display italic text-section-heading text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mb-6">
              watch the idea become the design
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[26px] items-center">
            <StageCopy stage={stage} />
            <ArtifactFrame stageIndex={active} />
          </div>

          <StepStepper active={active} onSelect={setActive} />
        </Container>
      </div>
    </section>
  );
}

/* ── Static mode (prefers-reduced-motion) ────────────────────── */

function ProcessSectionStatic() {
  return (
    <SectionWrapper
      id="process"
      className="scroll-mt-20"
    >
      <Container>
        <Reveal>
          <SectionLabel className="mb-[9px]">Process</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display italic text-section-heading text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mb-6">
            watch the idea become the design
          </h2>
        </Reveal>

        <div className="flex flex-col divide-y divide-[--color-border]">
          {STAGES.map((stage, i) => (
            <div
              key={stage.index}
              className="grid grid-cols-1 md:grid-cols-2 gap-[26px] items-center py-10"
            >
              <StageCopyStatic stage={stage} />
              <ArtifactFrame stageIndex={i} />
            </div>
          ))}
        </div>

        <StepStepper active={STAGES.length - 1} onSelect={() => {}} />
      </Container>
    </SectionWrapper>
  );
}

/* ── Stage copy variants ─────────────────────────────────────── */

type Stage = (typeof STAGES)[number];

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

/* Animated version — used in scrollable mode */
function StageCopy({ stage }: { stage: Stage }) {
  return (
    /* min-h reserves space for the tallest stage so the grid never reflows */
    <div className="relative min-h-[220px] overflow-hidden">
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
            style={{ minHeight: "64px" }}
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

/* Static version — no animation wrappers, used in reduced-motion mode */
function StageCopyStatic({ stage }: { stage: Stage }) {
  return (
    <div className="flex flex-col">
      <span
        className="text-meta font-[--font-weight-medium] uppercase tracking-ui"
        style={{ color: "var(--color-accent-500)" }}
      >
        {stage.index}
      </span>
      <h3 className="font-display italic text-subheading text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mt-1 mb-2.5">
        {stage.name}
      </h3>
      <p
        className="text-[--text-sm] text-[--color-text-secondary] leading-[--leading-normal]"
        style={{ minHeight: "64px" }}
      >
        {stage.description}
      </p>
      <div className="flex flex-wrap gap-[6px] mt-[14px]">
        {stage.tags.map((tag) => (
          <span
            key={tag}
            className="text-tag px-[11px] py-1 rounded-full text-[--color-text-muted] leading-none"
            style={{
              border: "1px solid color-mix(in oklch, var(--color-text-primary) 14%, transparent)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Artifact frame ──────────────────────────────────────────── */

function ArtifactFrame({ stageIndex }: { stageIndex: number }) {
  return (
    <div className="relative w-full h-[260px]">
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-10px",
          background:
            "radial-gradient(52% 52% at 60% 55%, color-mix(in oklch, var(--color-accent-500) 10%, transparent), transparent 70%)",
          opacity: stageIndex === 3 ? 1 : 0.65,
          transition: "opacity 0.6s ease",
        }}
        aria-hidden
      />

      <ArtifactDiscover visible={stageIndex === 0} />
      <ArtifactDefine visible={stageIndex === 1} />
      <ArtifactDesign visible={stageIndex === 2} />
      <ArtifactValidate visible={stageIndex === 3} />
    </div>
  );
}

/* ── Artifact states ─────────────────────────────────────────── */

function layerStyle(visible: boolean): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1)" : "scale(0.97)",
    transition: "opacity 0.55s ease, transform 0.55s ease",
  };
}

function ArtifactDiscover({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
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
          x="224" y="80"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          fontSize="26"
          fill="var(--color-ink-200)"
        >
          ?
        </text>
      </svg>
    </div>
  );
}

function ArtifactDefine({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
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
    </div>
  );
}

function ArtifactDesign({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
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
    </div>
  );
}

function ArtifactValidate({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
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
    </div>
  );
}

/* ── Step stepper ────────────────────────────────────────────── */

type StepStepperProps = {
  active: number;
  onSelect: (i: number) => void;
};

function StepStepper({ active, onSelect }: StepStepperProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="overflow-x-auto mt-[30px]">
      <div
        className="flex items-center min-w-max"
        role="tablist"
        aria-label="Process stages"
      >
        {STAGES.map((stage, i) => {
          const isCompleted =
            i < active || (active === STAGES.length - 1 && i === active);
          const isCurrent = i === active;
          const connectorFilled = i > 0 && i <= active;

          return (
            <Fragment key={stage.index}>
              {i > 0 && (
                prefersReduced ? (
                  /* Reduced motion: instant color, no growth */
                  <div
                    className="flex-1 min-w-[18px] h-0.5"
                    style={{
                      backgroundColor: connectorFilled
                        ? "var(--color-accent-500)"
                        : "color-mix(in oklch, var(--color-text-primary) 13%, transparent)",
                    }}
                  />
                ) : (
                  /* Animated: fill grows from left */
                  <div
                    className="flex-1 min-w-[18px] h-0.5 relative overflow-hidden"
                    style={{
                      backgroundColor:
                        "color-mix(in oklch, var(--color-text-primary) 13%, transparent)",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 origin-left"
                      style={{ backgroundColor: "var(--color-accent-500)" }}
                      animate={{ scaleX: connectorFilled ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                )
              )}
              <button
                role="tab"
                aria-selected={i === active}
                onClick={() => onSelect(i)}
                className="flex-none flex items-center justify-center gap-2 min-w-[120px] px-4 py-[11px] rounded-[12px] text-ui-label font-[--font-weight-medium] uppercase tracking-ui whitespace-nowrap cursor-pointer"
                style={{
                  fontFamily: "var(--font-body)",
                  border: isCompleted
                    ? "1.5px solid color-mix(in oklch, var(--color-accent-500) 50%, transparent)"
                    : isCurrent
                    ? "1.5px solid var(--color-accent-500)"
                    : "1.5px solid color-mix(in oklch, var(--color-text-primary) 16%, transparent)",
                  backgroundColor: isCompleted
                    ? "color-mix(in oklch, var(--color-accent-500) 9%, transparent)"
                    : "var(--color-surface)",
                  color:
                    isCompleted || isCurrent
                      ? "var(--color-accent-500)"
                      : "var(--color-text-muted)",
                  transition:
                    "border-color 0.35s ease, color 0.35s ease, background-color 0.35s ease",
                }}
              >
                {prefersReduced ? (
                  /* Reduced motion: badge appears instantly */
                  isCompleted && (
                    <span
                      className="flex-none flex items-center justify-center rounded-full"
                      style={{ width: "16px", height: "16px", background: "var(--color-accent-500)" }}
                      aria-hidden
                    >
                      <CheckIcon />
                    </span>
                  )
                ) : (
                  /* Animated: spring scale from zero with slight overshoot */
                  <AnimatePresence>
                    {isCompleted && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 20 }}
                        className="flex-none flex items-center justify-center rounded-full"
                        style={{ width: "16px", height: "16px", background: "var(--color-accent-500)" }}
                        aria-hidden
                      >
                        <CheckIcon />
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
                <span>{stage.name}</span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.5 8 l2.2 2.2 4.8 -5.2"
        stroke="var(--color-surface)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
