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
      className="relative min-h-[180vh] border-t border-[--color-border] scroll-mt-20"
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
            <ArtifactFrame stageIndex={active} showBloom={isLastStep} />
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
      className="scroll-mt-20 border-t border-[--color-border]"
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
              <ArtifactFrame stageIndex={i} showBloom={i === STAGES.length - 1} />
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

function ArtifactFrame({
  stageIndex,
  showBloom,
}: {
  stageIndex: number;
  showBloom?: boolean;
}) {
  return (
    <div className="relative w-full h-[260px]">
      {/* Warm bloom — kept as-is, CSS transition */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-10px",
          background:
            "radial-gradient(52% 52% at 60% 55%, color-mix(in oklch, var(--color-accent-500) 10%, transparent), transparent 70%)",
          opacity: showBloom ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
        aria-hidden
      />

      <ArtifactScribble visible={stageIndex === 0} />
      <ArtifactWireframe visible={stageIndex === 1} />
      <ArtifactScreen visible={stageIndex === 2} />
      <ArtifactValidated visible={stageIndex === 3} />
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

function ArtifactScribble({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
      <svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path
          d="M40 70 q12 -20 26 -4 q14 16 28 0 q12 -14 24 2"
          fill="none"
          stroke="var(--color-ink-200)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="56" y1="40" x2="84" y2="34"
          stroke="var(--color-ink-200)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="128" cy="46" r="3" fill="var(--color-ink-200)" />
        <circle cx="150" cy="92" r="3" fill="var(--color-ink-200)" />
        <text
          x="92" y="116"
          fontFamily="var(--font-display)"
          fontStyle="italic"
          fontSize="34"
          fill="var(--color-ink-200)"
        >
          ?
        </text>
      </svg>
    </div>
  );
}

function ArtifactWireframe({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
      <svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <rect
          x="40" y="26" width="120" height="20" rx="4"
          fill="none" stroke="var(--color-ink-200)" strokeWidth="1.6" strokeDasharray="5 4"
        />
        <rect
          x="40" y="56" width="56" height="68" rx="4"
          fill="none" stroke="var(--color-ink-200)" strokeWidth="1.6" strokeDasharray="5 4"
        />
        <rect
          x="104" y="56" width="56" height="30" rx="4"
          fill="none" stroke="var(--color-ink-200)" strokeWidth="1.6" strokeDasharray="5 4"
        />
        <rect
          x="104" y="94" width="56" height="30" rx="4"
          fill="none" stroke="var(--color-ink-200)" strokeWidth="1.6" strokeDasharray="5 4"
        />
      </svg>
    </div>
  );
}

function ArtifactScreen({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
      <svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <rect
          x="38" y="22" width="124" height="106" rx="9"
          fill="var(--color-surface)" stroke="var(--color-text-primary)" strokeOpacity=".7" strokeWidth="1.2"
        />
        <circle cx="50" cy="34" r="2.4" fill="var(--color-ink-200)" />
        <circle cx="58" cy="34" r="2.4" fill="var(--color-ink-200)" />
        <rect x="48" y="50" width="70" height="8" rx="3" fill="var(--color-text-primary)" fillOpacity="0.22" />
        <rect x="48" y="66" width="104" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.12" />
        <rect x="48" y="80" width="88" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.12" />
        <rect x="48" y="100" width="42" height="14" rx="4" fill="var(--color-accent-500)" fillOpacity="0.85" />
      </svg>
    </div>
  );
}

function ArtifactValidated({ visible }: { visible: boolean }) {
  return (
    <div style={layerStyle(visible)}>
      <svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <rect
          x="38" y="22" width="124" height="106" rx="9"
          fill="var(--color-surface)" stroke="var(--color-text-primary)" strokeOpacity=".75" strokeWidth="1.2"
        />
        <circle cx="50" cy="34" r="2.4" fill="var(--color-ink-200)" />
        <circle cx="58" cy="34" r="2.4" fill="var(--color-ink-200)" />
        <rect x="48" y="50" width="70" height="8" rx="3" fill="var(--color-text-primary)" fillOpacity="0.22" />
        <rect x="48" y="66" width="104" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.12" />
        <rect x="48" y="80" width="88" height="6" rx="3" fill="var(--color-text-primary)" fillOpacity="0.12" />
        <rect x="48" y="100" width="42" height="14" rx="4" fill="var(--color-accent-500)" fillOpacity="0.9" />
        <circle cx="158" cy="28" r="14" fill="var(--color-accent-500)" />
        <path
          d="M152 28 l4 4 8 -9"
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
