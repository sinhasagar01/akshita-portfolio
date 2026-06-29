import type { GlowWord as GlowWordType } from "@/lib/case-studies/types";
import { GLOW } from "./styles";

/** Faint Fraunces italic watermark. Decorative, hidden at the mobile breakpoint. */
export default function GlowWord({ word }: { word: GlowWordType }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none select-none absolute font-display italic font-normal leading-[0.8] tracking-[-0.02em] hidden lg:block z-0"
      style={{
        color: GLOW,
        top: word.top,
        right: word.right,
        bottom: word.bottom,
        left: word.left,
        fontSize: word.size ?? "clamp(7rem, 13vw, 12rem)",
      }}
    >
      {word.text}
    </span>
  );
}
