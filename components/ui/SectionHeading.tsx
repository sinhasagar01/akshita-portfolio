"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

type Variant = "default" | "bleed" | "watermark" | "centered";
type Tone = "warm" | "grey";

type Props = {
  index: string;
  title: string;
  subtext: string;
  className?: string;
  variant?: Variant;
  tone?: Tone;
  reveal?: boolean;
};

const EASE = "cubic-bezier(.22,1,.36,1)";

export default function SectionHeading({
  index,
  title,
  subtext,
  className,
  variant = "default",
  tone = "warm",
  reveal = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });
  const prefersReduced = useReducedMotion();

  const settled = !reveal || prefersReduced === true || inView;
  const noAnim  = !reveal || prefersReduced === true;

  /* ⚠ BOTH BRANCHES TAKE A TOKEN NOW, AND THE SECOND THEME IS WHAT PROVED THEY HAD TO.
     The warm branch was `rgba(181,97,60,…)`, a literal, while the grey branch was already a
     `color-mix` over `--color-ink-600`. On cream both read as a warm ghost, so the two looked
     the same and the split was invisible. On harbour, five watermarks stayed terracotta while
     Process and About went cool — ONE COMPONENT, ONE PAGE, TWO ANSWERS.

     ⚠ AND THAT REVERSES #327's RULING ON PURPOSE. The watermarks went on the contrast gate's
     boundary list because I called them "closer to artwork than interface". The render says
     otherwise: A COLOUR THAT MUST AGREE WITH A SIBLING RENDERED BY THE SAME COMPONENT FROM THE
     SAME PROP IS INTERFACE. Artwork does not have to match anything. The test was wrong, not the
     application of it.

     `accent-500` RATHER THAN `ink-600` FOR THE WARM BRANCH, and it is a SNAP rather than a
     redesign: composited over cream-50 and canvas at every alpha this component uses, the token
     lands 2 to 4 bytes from the literal it replaces, inside Step 1's own Δ<5 snap threshold.
     `ink-600` would have been 10 to 17 — a redesign wearing a refactor's clothes.

     ⚠ SO `tone` KEEPS A REAL AXIS AND IS NOT DELETED. It no longer means "token or literal"; it
     means ACCENT-TONED or INK-TONED, and both follow the theme. A prop whose two values produced
     the same result would be a control that cannot do anything, which this repo has deleted four
     times — this one still does something on every palette. */
  /* ⚠ THE TWO TINTS TAKE ROLES, AND IT IS A RENAME ON LIGHT AND A REMAP ON DARK. Both were RAW
     RUNGS, so neither followed the ground — and an ink at 18% over a near-black page is ink on ink,
     the exact failure that made `etch` a role. On sapphire the ghost was all but invisible, which
     is how the owner found it.

     ⚠ AND THEN THE OWNER RULED THE WORD SOLID, WHICH IS A DESIGN DECISION AND NOT A BUG FIX. The
     ghost-following-the-ground change above was mine and it worked — 1.09 to 1.36 on sapphire, zero
     light pixels moved. The owner looked at the result and wanted the heading READ rather than
     felt. That is theirs to decide and the reasoning above is kept rather than deleted, because the
     alpha version is what every light palette shipped with for the whole arc.

     `--color-text-primary` SATISFIES BOTH HALVES OF "solid primary colour or white" WITH ONE TOKEN:
     it is the primary text role, it resolves to `ink-950` on light and to `on-dark` on dark, so the
     heading is near-black on the light palettes and near-white on the dark one WITHOUT the component
     choosing by ground. A literal white would have been a component picking a value for one ground,
     which is the C-safety violation this file's own `tone` note exists to distinguish from.

     ⚠ `tone` STAYS A REAL AXIS BECAUSE THE GLOW KEEPS IT. If both branches produced one solid colour
     the prop would be a control that cannot do anything, and this repo deletes those. The WORD is
     now ground-following and tone-independent; the HALO behind it is still accent-toned or
     ink-toned, so the six call sites still choose something visible. */
  const wordTint   = tone === "warm" ? "var(--color-accent)" : "var(--color-text-secondary)";
  const wordColor  = "var(--color-text-primary)";
  const wordShadow = `0 0 30px color-mix(in oklch, ${wordTint} ${tone === "warm" ? 22 : 20}%, transparent)`;
  const glowBg     = `radial-gradient(closest-side,color-mix(in oklch, ${wordTint} ${tone === "warm" ? 22 : 20}%, transparent),transparent 72%)`;

  const isCentered = variant === "centered";

  const idxStyle: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 500,
    letterSpacing: ".14em",
    color: "var(--color-accent-500)",
    display: "block",
    position: "relative",
    zIndex: 3,
    opacity: settled ? 1 : 0,
    transform: settled ? "none" : "translateY(8px)",
    transition: noAnim
      ? "none"
      : `opacity .7s ease .05s, transform .7s ${EASE} .05s`,
  };

  const glowStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "52%",
    transform: "translate(-50%,-50%)",
    width: "130%",
    height: "215%",
    borderRadius: "50%",
    filter: "blur(34px)",
    zIndex: 0,
    background: glowBg,
    opacity: settled ? 1 : 0,
    transition: noAnim ? "none" : "opacity 1.1s ease",
  };

  const wordStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
    margin: 0,
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "-.01em",
    color: wordColor,
    textShadow: wordShadow,
    opacity: settled ? 1 : 0,
    filter: settled ? "blur(0)" : "blur(11px)",
    transform: settled ? "none" : "translateY(10px)",
    transition: noAnim
      ? "none"
      : `opacity .9s ease, filter 1s ${EASE}, transform 1s ${EASE}`,
  };

  const subStyle: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "var(--color-text-subtle)",
    maxWidth: "430px",
    margin: isCentered ? "14px auto 0" : "14px 0 0",
    position: "relative",
    zIndex: 3,
    opacity: settled ? 1 : 0,
    transform: settled ? "none" : "translateY(8px)",
    transition: noAnim
      ? "none"
      : `opacity .7s ease .15s, transform .7s ${EASE} .15s`,
  };

  // Bleed and watermark: large word LEFT-anchored in a back layer behind index + subtext
  if (variant === "bleed" || variant === "watermark") {
    const minHeight = variant === "bleed" ? "128px" : "172px";
    const wordClass = variant === "bleed"
      ? "text-[78px] sm:text-[100px]"
      : "text-[78px] sm:text-[108px]";

    return (
      <div
        ref={ref}
        className={className}
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight,
          textAlign: "left",
        }}
      >
        {/* Back layer: word left-anchored */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            zIndex: 0,
          }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            <span aria-hidden style={glowStyle} />
            <h2 className={wordClass} style={wordStyle}>{title}</h2>
          </span>
        </div>
        {/* Front layer: index + subtext */}
        <div style={{ position: "relative", zIndex: 3 }}>
          <span style={idxStyle}>{index}</span>
          <p style={subStyle}>{subtext}</p>
        </div>
      </div>
    );
  }

  if (isCentered) {
    return (
      <div ref={ref} className={className} style={{ textAlign: "center" }}>
        <span style={idxStyle}>{index}</span>
        <span style={{ position: "relative", display: "inline-block", margin: "6px auto 2px" }}>
          <span aria-hidden style={glowStyle} />
          <h2 className="text-[42px] sm:text-[60px]" style={wordStyle}>{title}</h2>
        </span>
        <p style={{ ...subStyle, margin: "14px auto 0" }}>{subtext}</p>
      </div>
    );
  }

  // default
  return (
    <div ref={ref} className={className}>
      <span style={idxStyle}>{index}</span>
      <span style={{ position: "relative", display: "inline-block", margin: "6px 0 2px" }}>
        <span aria-hidden style={glowStyle} />
        <h2 className="text-[42px] sm:text-[60px]" style={wordStyle}>{title}</h2>
      </span>
      <p style={subStyle}>{subtext}</p>
    </div>
  );
}
