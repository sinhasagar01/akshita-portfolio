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

type TabStrings = {
  label?: string;
  line?: string;
  support?: string;
  callouts?: string[];
  stats?: { value: string; unit: string }[];
};

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
      /* ⚠ NO FALLBACK FOR THE TEN NEW FIELDS, DELIBERATELY, AND IT IS THE OPPOSITE CHOICE FROM THE
         LINE ABOVE. A blank tab NAME falls back because the tab must be pressable; a blank callout
         or figure has nothing to fall back TO — inventing one would put words on the page the owner
         never wrote, which is what the schema PR asserted must never happen. Empty stays empty and
         the slot does not draw. */
      support: cms?.support?.trim() ?? "",
      callouts: cms?.callouts ?? [],
      stats: cms?.stats ?? [],
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
      {/* ⚠ TWO COLUMNS, COPY LEFT AND ARTWORK BLEEDING RIGHT. This replaces the centred-text hero
          entirely — a full replacement of the composition, not an addition to it. The shell is a
          grid rather than absolute positioning so the reflow is one property change. */}
      <div className="hero-shell">
      <Container>
        <div className="relative flex flex-col items-start text-left" style={{ zIndex: 2 }}>

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
              className="text-accent leading-[1] m-0 font-normal"
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
                          ? "var(--color-accent)"
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
                          border: "1px solid color-mix(in oklch, var(--color-accent) 30%, transparent)",
                          /* ⚠ THE VALUE HAS TO LEAVE THE COMPONENT BEFORE IT CAN THEME. JSX cannot
                             respond to `[data-ground="dark"]`, so an inline shadow is unthemeable
                             by construction however it is written — the token is what makes a dark
                             answer possible at all. This move is MECHANICAL: the declaration in
                             globals.css is the identical string, so every palette is byte-identical
                             and the alpha change is a separate commit.

                             ⚠ AND THE DROP INSIDE IT IS A SEPARATE, UNSCOPED DEFECT, CARRIED ACROSS
                             UNCHANGED ON PURPOSE. `oklch(30% 0.018 60 / 0.12)` is a raw literal at
                             cream's warm hue that themes on none of the nine palettes. Fixing it
                             here would ship a themeing repair inside a plumbing change. */
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
                  /* ⚠ TEXTURE, DECLARED — see the note in `SkillsBody`. A 144px ghost word at 14%
                     alpha behind the hero: felt rather than read, so a 4.5 floor does not apply.
                     `aria-hidden` above is here for its own reason and CANNOT double as this marker
                     — 17 nodes carry it and eight of them are real prose. */
                  data-texture="true"
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
                      color: "color-mix(in oklch, var(--color-accent) 14%, transparent)",
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
                className="scroll-dot inline-block w-[7px] h-[7px] rounded-full bg-accent shrink-0"
              />
              {cue}
            </a>
          </Reveal>


          {/* ⚠ THE EMPTY STATE IS TODAY'S REAL CONTENT, NOT AN EDGE CASE. All forty of the new
              fields are empty on every tab, so this is what the hero renders the day it lands — and
              a field can be cleared in the editor at any time.

              ⚠ EACH SLOT IS GATED ON ITS OWN CONTENT, NOT ON A TAB-LEVEL FLAG. A callout line with
              no label and a counter row with no figures are the two things that must never draw, and
              gating them together would let one appear because the other happened to be filled.
              `filter(Boolean)` before the length check, so three empty strings read as absent rather
              than as three items. */}
          {facets[active].support ? (
            <p className="hero-support">{facets[active].support}</p>
          ) : null}

          {facets[active].callouts.filter(Boolean).length > 0 ? (
            <ul className="hero-callouts">
              {facets[active].callouts.filter(Boolean).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : null}

          {facets[active].stats.filter((st) => st.value.trim()).length > 0 ? (
            <dl className="hero-counters">
              {facets[active].stats.filter((st) => st.value.trim()).map((st, i) => (
                <div key={i}>
                  <dt>{st.value}</dt>
                  <dd>{st.unit}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </Container>

      {/* ⚠ THE ARTWORK PANEL. No motion in this pass — the pairs exist so the entrance and the
          pointer transform can never share an element, which is what would freeze one of them.

          ⚠ AND NOTHING IS EVER APPLIED TO THE ILLUSTRATION. No filter, mask, clip-path, blend or
          opacity change, in either motion, ever. An earlier version of this design shipped a duotone
          that nobody read as hiding the artwork until the owner did. `hero-illustration` asserts the
          absence rather than trusting a later polish pass not to reach for one. */}
      <div className="hero-art" aria-hidden="true">
        <div className="hero-figure">
          {/* ⚠ NEXT/IMAGE, because this repo serves rasters through the optimizer. The intrinsic
              size is the source's; the panel drives the rendered height and the width overflows and
              is clipped, which is why no `sizes` guess can be right — it is height-driven. */}
          <Image
            src="/images/hero/hero-figure.webp"
            alt=""
            width={1033}
            height={1024}
            priority
            sizes="(max-width: 1023px) 100vw, 49vw"
          />
        </div>

        {/* ⚠ INSETS FROM THE PANEL'S EMPTY EDGE, never percentages keyed to drawn shapes. The pin is
            the inner half of each pair. Positions are the contract's, expressed from the edge the
            artwork does not reach. */}
        <div className="hero-piece" style={{ left: "4%", top: "22%" }}>
          <div className="hero-pin">
            {/* ⚠ INLINED, NOT AN <img>. These are `currentColor` SVGs and an <img> cannot inherit
                it — the file would draw its own colour and stop following the ink token, which is
                the whole reason the committed icons replace the mock's CSS shapes. */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="24" height="30" role="presentation" >
  
  <path d="M1.6 1.2 L1.6 24.4 L7.9 18.6 L11.6 27.4 L15.2 25.8 L11.6 17.2 L20.1 16.6 Z"
        fill="currentColor" stroke="none"/>
</svg>
          </div>
        </div>
        {/* ⚠ BOTH CARDS TAKE THE ACCENT ROLE, NOT THE `accent-500` RUNG, AND THAT IS THE D RULING
            APPLIED. `on-accent` on the rung measures 3.24 to 3.65 on the four dark palettes because
            the rung does not remap; on the ROLE it is 6.75 to 7.52. The mock differentiates its two
            cards by a second accent — the site's ladder has no lighter step, so they are told apart
            by size, offset and content instead, which is what the parallax multipliers separate in
            motion anyway. */}
        <div className="hero-piece hero-card" style={{ left: "6%", bottom: "26%" }}>
          <div className="hero-pin">
            <span className="hero-card-dot" />
            <span className="hero-card-line" />
            <span className="hero-card-line is-short" />
          </div>
        </div>
        <div className="hero-piece hero-card is-sm" style={{ right: "8%", bottom: "14%" }}>
          <div className="hero-pin">
            <span className="hero-card-dot" />
            <span className="hero-card-line" />
          </div>
        </div>

        <div className="hero-piece" style={{ right: "6%", top: "14%" }}>
          <div className="hero-pin">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="presentation" >
  
  <path d="M20 1.5 C21.4 11.6 28.4 18.6 38.5 20 C28.4 21.4 21.4 28.4 20 38.5 C18.6 28.4 11.6 21.4 1.5 20 C11.6 18.6 18.6 11.6 20 1.5 Z"
        fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
</svg>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
