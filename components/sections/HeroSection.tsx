"use client";

import { useRef, useState, useEffect, Fragment } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type Transition,
} from "motion/react";
import Container from "@/components/layout/Container";
import Reveal from "@/components/motion/Reveal";
import CursorGlow from "@/components/motion/CursorGlow";
import SectionLabel from "@/components/ui/SectionLabel";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";

// Tab NAMES and LINES are CMS-driven (siteSettings tabNLabel and tabNLine),
// with these values as the defensive fallbacks so the Hero never renders
// blank. The script backdrop word derives from the tab name (lowercased), so
// it follows renames automatically.
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
    line: "Designing a connected app for Elevate, and looking for my next team.",
  },
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

type TabStrings = { label?: string; line?: string };

export default function HeroSection({
  heroCopy,
  tabs,
  roleLabel,
  scrollCue,
}: {
  heroCopy?: string;
  /** CMS strings per tab, index-aligned with FACETS (tab1..tab4). */
  tabs?: TabStrings[];
  roleLabel?: string;
  scrollCue?: string;
}) {
  const [active, setActive] = useState(0);
  const isReducedMotion = useReducedMotion();
  const smoothScroll    = useSmoothScroll();

  // The simple-string slots read live siteSettings values with defensive
  // fallbacks to the previous hardcoded text, so the Hero never renders blank
  // (all fields are optional).
  const signature = heroCopy?.trim() ? heroCopy : "Akshita Singh";
  const role      = roleLabel?.trim() ? roleLabel : "Product designer";
  const cue       = scrollCue?.trim() ? scrollCue : "scroll to process";

  // CMS name and line per tab, falling back to the hardcoded FACETS values
  // when blank. The backdrop word derives from the effective tab name. Lines
  // are trimmed because the CMS fields are multiline and a stray trailing
  // newline must not become a word-split token.
  const facets = FACETS.map((f, i) => {
    const cms = tabs?.[i];
    const label = cms?.label?.trim() ? cms.label.trim() : f.tab;
    return {
      tab: label,
      word: cms?.label?.trim() ? label.toLowerCase() : f.word,
      line: cms?.line?.trim() ? cms.line.trim() : f.line,
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

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="hero-ground items-center"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* The ONE cursor glow — translate3d + rAF, off on touch/reduced-motion (--glow-on-paper). */}
      <CursorGlow />

      {/* Content — above the glow layer */}
      <Container>
        <div className="relative flex flex-col items-center text-center" style={{ zIndex: 2 }}>

          {/* Signature + role label.
              LCP: the signature is the home page's largest-contentful paint, so it must
              NOT be wrapped in <Reveal> — that ships opacity:0 in SSR and only reveals
              after hydration, delaying LCP by ~1.8s on throttled mobile. This keeps
              opacity:1 in the SSR HTML (paints at FCP) and only SLIDES in, so the entrance
              is preserved but the paint isn't gated on JS. */}
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={isReducedMotion ? { y: 0 } : { y: 14 }}
            animate={{ y: 0 }}
            transition={
              isReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
            }
          >
            {/* The page's single h1 (accessibility): the signature is the home page's
                top-level heading. Rendered at 40–56px, so accent-500 on canvas clears
                the 3:1 large-text bar. */}
            <h1
              // ⚠ `font-script` WAS HERE AND DREW NOTHING. The unlayered `h1` rule sets
              // `font-family: var(--font-display)`, which beats a utility in `@layer utilities`
              // regardless of specificity — hazard 11. So this heading has ALWAYS rendered the
              // display serif while its class asked for the script, and removing the class changes
              // no pixel. A class that asks for one face and draws another is a lie in the markup;
              // it survived because the result looked right.
              className="text-accent-500 leading-[1] m-0 font-normal"
              style={{ fontSize: "clamp(3rem, 6.5vw, 5rem)" }}
            >
              {signature}
            </h1>
            <SectionLabel>{role}</SectionLabel>
          </motion.div>

          {/* Facet tabs */}
          <Reveal delay={0.08} className="mt-9">
            {/* Mobile: dot-grows-to-bar indicators (below 1024px) */}
            <div
              role="group"
              aria-label="Designer facets"
              className="flex lg:hidden justify-center items-center gap-3 py-2"
            >
              {facets.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i === active}
                  aria-label={f.tab}
                  onClick={() => setActive(i)}
                  className="rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "block",
                      height: "8px",
                      width: i === active ? "24px" : "8px",
                      borderRadius: "9999px",
                      backgroundColor:
                        i === active
                          ? "var(--color-accent-500)"
                          : "color-mix(in oklch, var(--color-ink-950) 25%, transparent)",
                      transition: isReducedMotion
                        ? "background-color 0.3s ease"
                        : "width 0.35s ease, background-color 0.3s ease",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Desktop: labeled tabs with animated pill (1024px and above) */}
            <LayoutGroup>
              <div
                role="group"
                aria-label="Designer facets"
                className="hidden lg:inline-flex relative gap-1.5 p-1"
              >
                {facets.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={i === active}
                    onClick={() => setActive(i)}
                    className="relative px-4 py-2.5 text-[12px] uppercase tracking-[0.10em] font-medium rounded-full transition-colors duration-[var(--duration-base)] select-none cursor-pointer"
                    style={{
                      color:
                        i === active
                          ? "var(--color-accent-text)"
                          : "var(--color-text-subtle)",
                    }}
                  >
                    {i === active && (
                      <motion.span
                        layoutId="hero-tab-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: "color-mix(in oklch, var(--color-surface) 50%, transparent)",
                          backdropFilter: "blur(9px) saturate(1.3)",
                          WebkitBackdropFilter: "blur(9px) saturate(1.3)",
                          border: "1px solid color-mix(in oklch, var(--color-accent-500) 30%, transparent)",
                          boxShadow:
                            "0 3px 12px oklch(30% 0.018 60 / 0.12), inset 0 1px 0 color-mix(in srgb, var(--color-white) 70%, transparent)",
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
              className="relative min-h-[7rem] flex items-center justify-center w-full"
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
                      fontSize: "clamp(5rem, 12vw, 9rem)",
                      lineHeight: 1,
                      color: "color-mix(in oklch, var(--color-accent-500) 14%, transparent)",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      filter: "blur(0.4px)",
                    }}
                    initial={
                      isReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 24, scale: 0.97 }
                    }
                    animate={
                      isReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, scale: 1 }
                    }
                    transition={
                      isReducedMotion
                        ? { duration: 0.25 }
                        : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {facets[active].word}
                  </motion.span>
                </motion.div>
              </AnimatePresence>

              {/* Serif line — sits above the backdrop word */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={active}
                  className="font-display not-italic leading-snug tracking-tight max-w-[34ch]!"
                  style={{ position: "relative", zIndex: 2, fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)" }}
                  variants={isReducedMotion ? lineContainerVariantsReduced : lineContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {isReducedMotion
                    ? facets[active].line
                    : facets[active].line.split(/\s+/).map((word, i, arr) => (
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
              href="#process"
              onClick={(e) => {
                const el = document.getElementById("process");
                if (el && smoothScroll) {
                  e.preventDefault();
                  smoothScroll.scrollToTarget(el);
                }
              }}
              className="flex items-center gap-2 text-[12px] text-text-subtle tracking-[0.08em] uppercase font-medium transition-colors duration-[var(--duration-base)] hover:text-text-secondary"
            >
              <span
                aria-hidden="true"
                className="scroll-dot inline-block w-[7px] h-[7px] rounded-full bg-accent-500 shrink-0"
              />
              {cue}
            </a>
          </Reveal>

        </div>
      </Container>
    </section>
  );
}
