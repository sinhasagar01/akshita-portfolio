"use client";

import { Fragment, useState } from "react";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
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
  const [active, setActive] = useState(0);
  const stage = STAGES[active];
  const isLastStep = active === STAGES.length - 1;

  return (
    <SectionWrapper
      id="process"
      className="scroll-mt-20 border-t border-[--color-border]"
    >
      <Container>
        <Reveal>
          <SectionLabel className="mb-4">Process</SectionLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display italic text-[--text-2xl] text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mb-12">
            watch the idea become the design
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-16">
          {/* Left: active stage copy */}
          <div className="flex flex-col justify-center gap-4">
            <span
              className="text-[--text-xs] font-[--font-weight-semibold] tracking-[--tracking-widest]"
              style={{ color: "var(--color-accent-500)" }}
            >
              {stage.index}
            </span>
            <h3 className="font-display italic text-[--text-xl] text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug]">
              {stage.name}
            </h3>
            <p className="text-[--text-base] text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[42ch]">
              {stage.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {stage.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[--text-xs] px-3 py-1 rounded-[--radius-full] border border-[--color-border] text-[--color-text-muted] leading-none"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: artifact frame */}
          <div className="relative flex items-center justify-center">
            {/* Warm bloom — lifts only on the final stage */}
            <div
              className="absolute inset-0 rounded-[--radius-xl] pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, color-mix(in oklch, var(--color-accent-500) 20%, transparent) 0%, transparent 70%)",
                opacity: isLastStep ? 1 : 0,
                transition: "opacity var(--duration-slower) var(--ease-out-expo)",
              }}
              aria-hidden
            />

            {/* Artifact frame */}
            <div className="relative w-full max-w-xs aspect-[4/3] rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] overflow-hidden">
              <ArtifactScribble visible={active === 0} />
              <ArtifactWireframe visible={active === 1} />
              <ArtifactScreen visible={active === 2} />
              <ArtifactValidated visible={active === 3} />
            </div>
          </div>
        </div>

        <StepStepper active={active} onSelect={setActive} />
      </Container>
    </SectionWrapper>
  );
}

/* ── Artifact states ─────────────────────────────────────────── */

function artifactStyle(visible: boolean): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: visible ? 1 : 0,
    transition: "opacity var(--duration-slow) var(--ease-out-expo)",
  };
}

function ArtifactScribble({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 160 120" aria-hidden style={artifactStyle(visible)}>
      <path
        d="M 20 60 C 35 40, 50 80, 65 55 C 80 30, 95 75, 110 50 C 125 25, 135 65, 145 48"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 15 80 C 30 68, 45 92, 60 75 C 75 58, 90 88, 105 70"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M 40 35 C 55 20, 70 48, 85 30"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="28"  cy="46" r="1.5" fill="var(--color-ink-400)" opacity="0.5" />
      <circle cx="120" cy="88" r="1"   fill="var(--color-ink-400)" opacity="0.4" />
      <circle cx="90"  cy="25" r="1.2" fill="var(--color-ink-400)" opacity="0.4" />
      <line x1="130" y1="30" x2="138" y2="22" stroke="var(--color-ink-400)" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <line x1="22"  y1="95" x2="30"  y2="88" stroke="var(--color-ink-400)" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function ArtifactWireframe({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 160 120" aria-hidden style={artifactStyle(visible)}>
      {/* Header bar */}
      <rect
        x="12" y="12" width="136" height="18" rx="2"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      {/* Content block 1 */}
      <rect
        x="12" y="40" width="84" height="10" rx="2"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      {/* Content block 2 */}
      <rect
        x="12" y="58" width="60" height="10" rx="2"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      {/* Image placeholder */}
      <rect
        x="106" y="38" width="42" height="42" rx="3"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.4"
      />
      <line x1="106" y1="38" x2="148" y2="80" stroke="var(--color-ink-400)" strokeWidth="0.5" opacity="0.3" />
      <line x1="148" y1="38" x2="106" y2="80" stroke="var(--color-ink-400)" strokeWidth="0.5" opacity="0.3" />
      {/* CTA placeholder */}
      <rect
        x="12" y="88" width="44" height="14" rx="7"
        fill="none"
        stroke="var(--color-ink-400)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.5"
      />
    </svg>
  );
}

function ArtifactScreen({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 160 120" aria-hidden style={artifactStyle(visible)}>
      {/* Header bar */}
      <rect x="12" y="12" width="136" height="18" rx="2" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="0.75" />
      {/* Nav dots */}
      <circle cx="22" cy="21" r="2.5" fill="var(--color-ink-200)" />
      <circle cx="30" cy="21" r="2.5" fill="var(--color-ink-200)" />
      <circle cx="38" cy="21" r="2.5" fill="var(--color-ink-200)" />
      {/* Content lines */}
      <rect x="12" y="42" width="88" height="7" rx="2" fill="var(--color-ink-200)" />
      <rect x="12" y="56" width="64" height="7" rx="2" fill="var(--color-ink-200)" />
      <rect x="12" y="70" width="72" height="7" rx="2" fill="var(--color-ink-200)" />
      {/* Terracotta CTA button */}
      <rect x="12" y="90" width="48" height="16" rx="8" fill="var(--color-accent-500)" opacity="0.9" />
    </svg>
  );
}

function ArtifactValidated({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 160 120" aria-hidden style={artifactStyle(visible)}>
      {/* Header bar */}
      <rect x="12" y="12" width="136" height="18" rx="2" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="0.75" />
      {/* Nav dots */}
      <circle cx="22" cy="21" r="2.5" fill="var(--color-ink-200)" />
      <circle cx="30" cy="21" r="2.5" fill="var(--color-ink-200)" />
      <circle cx="38" cy="21" r="2.5" fill="var(--color-ink-200)" />
      {/* Content lines */}
      <rect x="12" y="42" width="88" height="7" rx="2" fill="var(--color-ink-200)" />
      <rect x="12" y="56" width="64" height="7" rx="2" fill="var(--color-ink-200)" />
      <rect x="12" y="70" width="72" height="7" rx="2" fill="var(--color-ink-200)" />
      {/* Terracotta CTA button */}
      <rect x="12" y="90" width="48" height="16" rx="8" fill="var(--color-accent-500)" opacity="0.9" />
      {/* Check badge in top-right corner */}
      <circle cx="136" cy="14" r="10" fill="var(--color-accent-500)" />
      <path
        d="M 130 14 L 134 18 L 142 10"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Step stepper ────────────────────────────────────────────── */

type StepStepperProps = {
  active: number;
  onSelect: (i: number) => void;
};

function StepStepper({ active, onSelect }: StepStepperProps) {
  return (
    <div className="overflow-x-auto" role="tablist" aria-label="Process stages">
      <div className="flex items-center w-fit mx-auto">
        {STAGES.map((stage, i) => {
          const isCompleted =
            i < active || (active === STAGES.length - 1 && i === active);
          const isCurrent = i === active;
          const connectorFilled = i > 0 && i <= active;

          return (
            <Fragment key={stage.index}>
              {i > 0 && (
                <div
                  className="h-px w-8 md:w-12 flex-shrink-0"
                  style={{
                    backgroundColor: connectorFilled
                      ? "var(--color-accent-500)"
                      : "var(--color-border)",
                    transition: "background-color var(--duration-base) var(--ease-out-expo)",
                  }}
                />
              )}
              <button
                role="tab"
                aria-selected={i === active}
                onClick={() => onSelect(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-[--radius-full] border text-[--text-xs] md:text-[--text-sm] whitespace-nowrap cursor-pointer"
                style={{
                  backgroundColor: isCompleted
                    ? "color-mix(in oklch, var(--color-accent-500) 10%, transparent)"
                    : "transparent",
                  borderColor:
                    isCompleted || isCurrent
                      ? "var(--color-accent-500)"
                      : "var(--color-border)",
                  color:
                    isCompleted || isCurrent
                      ? "var(--color-accent-500)"
                      : "var(--color-text-muted)",
                  transition:
                    "background-color var(--duration-base) var(--ease-out-expo), border-color var(--duration-base) var(--ease-out-expo), color var(--duration-base) var(--ease-out-expo)",
                }}
              >
                {isCompleted && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {stage.name}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
