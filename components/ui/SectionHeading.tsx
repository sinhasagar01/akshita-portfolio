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

  const wordColor  = tone === "warm" ? "rgba(181,97,60,.17)"  : "rgba(86,80,72,.18)";
  const wordShadow = tone === "warm" ? "0 0 30px rgba(181,97,60,.22)" : "0 0 30px rgba(86,80,72,.20)";
  const glowBg     = tone === "warm"
    ? "radial-gradient(closest-side,rgba(181,97,60,.22),transparent 72%)"
    : "radial-gradient(closest-side,rgba(88,82,74,.20),transparent 72%)";

  const isWatermark = variant === "watermark";
  const isCentered  = variant === "centered";

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
    width: isWatermark ? "78%" : "130%",
    height: isWatermark ? "120%" : "215%",
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

  if (variant === "bleed") {
    return (
      <div
        ref={ref}
        className={className}
        style={{ position: "relative", overflow: "hidden", minHeight: "118px", textAlign: "left" }}
      >
        {/* Word + glow anchored to right edge, clips on overflow */}
        <div style={{ position: "absolute", right: "-26px", top: "-6px", zIndex: 0 }}>
          <span aria-hidden style={glowStyle} />
          <h2 className="text-[78px] sm:text-[100px]" style={wordStyle}>{title}</h2>
        </div>
        {/* Index + subtext in front */}
        <span style={idxStyle}>{index}</span>
        <p style={subStyle}>{subtext}</p>
      </div>
    );
  }

  if (variant === "watermark") {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "172px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "left",
        }}
      >
        {/* Back: word centered behind everything */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 0,
          }}
        >
          <span aria-hidden style={glowStyle} />
          <h2 className="text-[78px] sm:text-[108px]" style={wordStyle}>{title}</h2>
        </div>
        {/* Foreground: index + subtext */}
        <div style={{ position: "relative", zIndex: 3 }}>
          <span style={idxStyle}>{index}</span>
          <p style={subStyle}>{subtext}</p>
        </div>
      </div>
    );
  }

  if (variant === "centered") {
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
