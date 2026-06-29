import type { Callout } from "@/lib/case-studies/types";

/**
 * `.call` — a dot, a connector line, and a label. Absolutely positioned on desktop
 * (the `position` style), collapsing to a static caption row at the mobile
 * breakpoint. The dot and connector are decorative.
 */
export default function Annotation({ callout }: { callout: Callout }) {
  return (
    <div
      className="lg:absolute flex items-center gap-0"
      style={{
        top: callout.top,
        right: callout.right,
        bottom: callout.bottom,
        left: callout.left,
      }}
    >
      <span
        aria-hidden="true"
        className="hidden lg:block size-[11px] shrink-0 rounded-full bg-accent-500 -ml-1.5"
        style={{ boxShadow: "0 0 0 4px color-mix(in oklch, var(--color-accent-500) 16%, transparent)" }}
      />
      <span
        aria-hidden="true"
        className="hidden lg:block h-px w-[84px] shrink-0 bg-accent-500 opacity-50 mx-4"
      />
      <span className="max-w-[300px]">
        <b className="block text-[1rem] font-bold text-ink-950">{callout.title}</b>
        <span className="block text-[0.875rem] text-ink-600 leading-[1.42] mt-0.5">
          {callout.note}
        </span>
      </span>
    </div>
  );
}
