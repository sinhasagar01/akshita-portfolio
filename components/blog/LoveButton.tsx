// Blog PR 2 — the love affordance, DISABLED and COUNTLESS.
//
// The love count is runtime state (Upstash), which is PR 4. Rendering a static "0" here
// would be a fabricated fact ("nobody loved this"); rendering nothing leaves holes in the
// vessel, capsule and end-of-article block that the design is built around. So PR 2 ships
// the affordance itself — a non-interactive heart with no number — and PR 4 wires the
// count and the optimistic toggle over the existing login-throttle Upstash REST pattern.
import type { ReactNode } from "react";

const HEART_PATH =
  "M12 20.5S3.5 14.8 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.6-8.5 11.3-8.5 11.3Z";

function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={HEART_PATH} fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/**
 * `bare` — a lone heart (stream card, vessel, capsule). `pill` — a bordered pill with a
 * label (the end-of-article block). Always `disabled`; the label never carries a count.
 */
export default function LoveButton({
  variant = "bare",
  label,
}: {
  variant?: "bare" | "pill";
  label?: ReactNode;
}) {
  if (variant === "pill") {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-label="Loving posts is coming soon"
        className="inline-flex items-center gap-3 rounded-full border border-ink-400 px-7 py-3.5 text-[15px] text-ink-600 disabled:cursor-not-allowed"
      >
        <Heart className="size-[22px]" />
        {label ?? "Love this"}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="Loving posts is coming soon"
      className="inline-flex items-center text-ink-400 disabled:cursor-not-allowed"
    >
      <Heart className="size-[18px]" />
    </button>
  );
}
