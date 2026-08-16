"use client";

import type { CSSProperties } from "react";

/* ============================================================================================
   ⚠ THE HEADING IS NOT PART OF THE SCROLL REVEAL, AND THAT IS THE POINT OF THE COMPONENT.

   It used to carry its OWN `useInView` at `amount: 0.55`, entirely separate from `RevealSection`'s
   observer — two reveal mechanisms on one section, with different triggers, and nothing keeping
   them in order.

   MEASURED ON THE WORK SECTION, scrolling down at 1440x900, sampling opacity every 60px:

       section top at 47%   heading 0.20   cards 0
       section top at 40%   heading 0.54   cards 0.03
       section top at 33%   heading 0.77   cards 0.34
       section top at 27%   heading 0.90   cards 0.68
       section top at 13%   heading 1.00   cards 0.96

   The heading led by about 14% of a viewport and the two climbed TOGETHER — so for most of the
   travel the section title was half-drawn while its content was already arriving. A reader could
   not tell which section they were in until both had finished, which is the reverse of what a
   heading is for. `RevealSection` fires at `rootMargin: -20%`; the heading needed 55% of ITSELF in
   view, which happens later.

   ⚠ THE `reveal` PROP IS GONE RATHER THAN DEFAULTED TO FALSE. Nothing passed `true` — six homepage
   sections took the default and three surfaces passed `false` — so a prop kept "for flexibility"
   would have had one reachable value. This repo deletes a control that cannot do anything.

   The content below a heading still reveals on scroll. Only the label stops moving.
============================================================================================ */
type Variant = "default" | "bleed" | "watermark" | "centered";
type Tone = "warm" | "grey";

type Props = {
  index: string;
  title: string;
  subtext: string;
  className?: string;
  variant?: Variant;
  tone?: Tone;
  /**
   * Attributes spread onto the title `<h2>`. Empty by default, so every existing render is
   * byte-identical and no public page changes.
   *
   * ⚠ A PASS-THROUGH RATHER THAN AN `editable` PROP, DELIBERATELY. `/palettes` needs the headline
   * to be `contentEditable` so a visitor can type their own words and watch a palette hold them —
   * but "editable" is a concept belonging to the studio's edit system, and encoding it here would
   * put a second, unrelated meaning of that word into a presentational component. The console
   * passes the two attributes it needs and this file stays about headings.
   */
  titleProps?: React.HTMLAttributes<HTMLHeadingElement>;
};

export default function SectionHeading({
  index,
  title,
  subtext,
  className,
  variant = "default",
  tone = "warm",
  titleProps,
}: Props) {

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
    color: "var(--color-accent)",
    display: "block",
    position: "relative",
    zIndex: 3,
    opacity: 1,
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
    opacity: 1,
  };

  const wordStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
    margin: 0,
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    /* ⚠ 600, AND IT WAS 400 WHILE THE HEADING WAS TWICE THE SIZE OF ITS OWN SUBORDINATE. Measured:
       this h2 renders at 60px/400 and the `Discover` h3 beneath it at 30px/600 — SIZE SAID "more
       important" AND WEIGHT SAID "less", so the two axes cancelled and the pair read as one level.

       ⚠ NOTHING WAS BROKEN BY MAKING THE WORD SOLID. At 18% alpha this was background texture and
       nothing ever compared the two, so THE HIERARCHY HAD BEEN RESTING ON OPACITY the whole time —
       and opacity is exactly the mechanism that cannot survive a change of ground. The solid ruling
       did not cause this; it revealed it. Same failure as `etch` and `text-subtle`, arriving in the
       type scale instead of the colour tokens.

       A section heading must not be lighter in weight than the heading it outranks. Size and weight
       are ground-independent; colour and alpha are not. */
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-.01em",
    color: wordColor,
    textShadow: wordShadow,
    opacity: 1,
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
    opacity: 1,
  };

  // Bleed and watermark: large word LEFT-anchored in a back layer behind index + subtext
  if (variant === "bleed" || variant === "watermark") {
    const minHeight = variant === "bleed" ? "128px" : "172px";
    /* ⚠ `lg`, NOT `sm` — THIS FILE HELD THE FIFTH AND SIXTH BREAKPOINT SPLITS. The site goes mobile
     at ONE breakpoint (1024) and these headings stepped up at 640, so between 640 and 1023 a
     visitor got the desktop heading scale under a mobile menu.

     ⚠ AND IT MADE A TYPE INVERSION WORSE IN ITS WORST BAND. `.hero-name` is
     `clamp(34px, 10cqw, 46px)` below 1024 while this h2 was already 60px there — so the section
     label outranked the page's own `h1` by 14px. Moving the step to `lg` removes that band. It does
     NOT close the whole finding: between 1024 and 1395 the name is 44 to 60px against this 60, and
     the weights are 200 against 600 everywhere. Whether the hero's thin display voice should change
     is a design decision and is deliberately not taken here. */
  const wordClass = variant === "bleed"
      ? "text-[78px] lg:text-[100px]"
      : "text-[78px] lg:text-[108px]";

    return (
      <div
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
            <h2 className={wordClass} style={wordStyle} {...titleProps}>{title}</h2>
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
      <div className={className} style={{ textAlign: "center" }}>
        <span style={idxStyle}>{index}</span>
        <span style={{ position: "relative", display: "inline-block", margin: "6px auto 2px" }}>
          <span aria-hidden style={glowStyle} />
          <h2 className="text-[42px] lg:text-[60px]" style={wordStyle} {...titleProps}>{title}</h2>
        </span>
        <p style={{ ...subStyle, margin: "14px auto 0" }}>{subtext}</p>
      </div>
    );
  }

  // default
  return (
    <div className={className}>
      <span style={idxStyle}>{index}</span>
      <span style={{ position: "relative", display: "inline-block", margin: "6px 0 2px" }}>
        <span aria-hidden style={glowStyle} />
        <h2 className="text-[42px] lg:text-[60px]" style={wordStyle} {...titleProps}>{title}</h2>
      </span>
      <p style={subStyle}>{subtext}</p>
    </div>
  );
}
