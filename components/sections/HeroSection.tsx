"use client";

import { useRef, useState, Fragment } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type Transition,
} from "motion/react";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";

const FACETS = [
  {
    tab: "Who I am",
    word: "who i am",
    line: "A product designer who turns rough ideas into products people use.",
  },
  {
    tab: "What I do",
    word: "what i do",
    line: "I carry work from the first messy sketch to the shipped screen.",
  },
  {
    tab: "How I work",
    word: "how i work",
    line: "Sit with the ambiguity, then narrow it, discover, define, design, validate.",
  },
  {
    tab: "What I'm up to",
    word: "what i'm up to",
    line: "Designing a connected app for Otis, and looking for my next team.",
  },
];

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

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const isReducedMotion = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current || !glowRef.current || !coreRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = `${e.clientX - rect.left}px`;
    const y = `${e.clientY - rect.top}px`;
    glowRef.current.style.left = x;
    glowRef.current.style.top = y;
    coreRef.current.style.left = x;
    coreRef.current.style.top = y;
  };

  const handleMouseLeave = () => {
    if (!glowRef.current || !coreRef.current) return;
    glowRef.current.style.left = "50%";
    glowRef.current.style.top = "46%";
    coreRef.current.style.left = "50%";
    coreRef.current.style.top = "46%";
  };

  const pillTransition = isReducedMotion ? PILL_INSTANT : PILL_SPRING;

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="section-card relative overflow-hidden min-h-[78svh] flex flex-col items-center justify-center py-section"
      style={{ marginTop: "clamp(1rem, 1.5vw, 1.5rem)" }}
      onMouseMove={isReducedMotion ? undefined : handleMouseMove}
      onMouseLeave={isReducedMotion ? undefined : handleMouseLeave}
    >
      {/* Warm glow — follows cursor */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(255,247,234,.9) 0%, rgba(244,222,201,.48) 28%, rgba(234,225,212,0) 62%)",
          transition: "left .14s ease-out, top .14s ease-out",
          zIndex: 1,
        }}
      />

      {/* Terracotta core — follows cursor slightly slower */}
      <div
        ref={coreRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          width: "240px",
          height: "240px",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, oklch(56% 0.14 42 / 0.14) 0%, oklch(56% 0.14 42 / 0) 65%)",
          transition: "left .2s ease-out, top .2s ease-out",
          zIndex: 1,
        }}
      />

      {/* Content — above glow layers */}
      <Container>
        <div className="relative flex flex-col items-center text-center" style={{ zIndex: 2 }}>

          {/* Signature + role label */}
          <Reveal>
            <div className="flex flex-col items-center gap-2">
              <p
                className="font-script text-[--color-accent-500] leading-[1]"
                style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
              >
                Akshita Singh
              </p>
              <SectionLabel>Product designer</SectionLabel>
            </div>
          </Reveal>

          {/* Facet tabs */}
          <Reveal delay={0.08} className="mt-9">
            <LayoutGroup>
              <div
                role="tablist"
                aria-label="Designer facets"
                className="relative inline-flex gap-1.5 p-1"
              >
                {FACETS.map((f, i) => (
                  <button
                    key={f.tab}
                    role="tab"
                    aria-selected={i === active}
                    onClick={() => setActive(i)}
                    className="relative px-4 py-2.5 text-[12px] uppercase tracking-[0.10em] font-medium rounded-full transition-colors duration-[--duration-base] select-none cursor-pointer"
                    style={{
                      color:
                        i === active
                          ? "var(--color-accent-500)"
                          : "var(--color-ink-400)",
                    }}
                  >
                    {i === active && (
                      <motion.span
                        layoutId="hero-tab-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: "oklch(98.5% 0.012 80 / 0.50)",
                          backdropFilter: "blur(9px) saturate(1.3)",
                          WebkitBackdropFilter: "blur(9px) saturate(1.3)",
                          border: "1px solid oklch(56% 0.14 42 / 0.30)",
                          boxShadow:
                            "0 3px 12px oklch(30% 0.018 60 / 0.12), inset 0 1px 0 oklch(100% 0 0 / 0.70)",
                        }}
                        transition={pillTransition}
                      />
                    )}
                    <span className="relative z-10">{f.tab}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </Reveal>

          {/* Serif line with handwritten backdrop word */}
          <Reveal delay={0.14} className="mt-7">
            <div
              className="relative min-h-[5rem] flex items-center justify-center w-full"
            >
              {/* Backdrop word — bleeds horizontally, anchored vertically to this container */}
              <AnimatePresence mode="wait">
                {/* Outer: position + centering transform, owns the exit fade */}
                <motion.div
                  key={`word-${active}`}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "-50vw",
                    right: "-50vw",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  {/* Inner: y-rise + scale + opacity — no conflict with outer centering */}
                  <motion.span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-script)",
                      fontSize: "clamp(4rem, 11vw, 7rem)",
                      lineHeight: 1,
                      color: "var(--color-accent-500)",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    }}
                    initial={
                      isReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 24, scale: 0.97 }
                    }
                    animate={
                      isReducedMotion
                        ? { opacity: 0.42 }
                        : { opacity: 0.42, y: 0, scale: 1 }
                    }
                    transition={
                      isReducedMotion
                        ? { duration: 0.25 }
                        : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {FACETS[active].word}
                  </motion.span>
                </motion.div>
              </AnimatePresence>

              {/* Serif line — sits above the backdrop word */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={active}
                  className="font-display italic text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-tight] max-w-[34ch]!"
                  style={{ position: "relative", zIndex: 2, fontSize: "clamp(1.5rem, 2.6vw, 2.05rem)" }}
                  variants={isReducedMotion ? lineContainerVariantsReduced : lineContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {isReducedMotion
                    ? FACETS[active].line
                    : FACETS[active].line.split(" ").map((word, i, arr) => (
                        <Fragment key={`${active}-w-${i}`}>
                          <motion.span
                            variants={wordVariants}
                            style={{ display: "inline-block" }}
                          >
                            {word}
                          </motion.span>
                          {i < arr.length - 1 ? " " : null}
                        </Fragment>
                      ))
                  }
                </motion.p>
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Scroll cue */}
          <Reveal delay={0.2} className="mt-12">
            <a
              href="#work"
              className="flex items-center gap-2 text-[11px] text-[--color-text-muted] tracking-[0.08em] uppercase font-medium transition-colors duration-[--duration-base] hover:text-[--color-text-secondary]"
            >
              <span
                aria-hidden="true"
                className="scroll-dot inline-block w-[7px] h-[7px] rounded-full bg-[--color-accent-500] shrink-0"
              />
              scroll to see work
            </a>
          </Reveal>

        </div>
      </Container>
    </section>
  );
}
