"use client";

// Jump between case studies from inside the editor.
//
// A native <select> on purpose: it is keyboard- and screen-reader-correct for free,
// it cannot trap focus, and on mobile it gets the platform picker. A custom menu
// would be more styleable and strictly worse at all three.
import { useRouter } from "next/navigation";

export default function CaseStudySwitcher({
  current,
  options,
}: {
  current: string;
  options: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const title = options.find((o) => o.slug === current)?.title ?? current;

  return (
    <label className="relative min-w-0">
      {/* The visible label is the title in the display face; the select sits on top,
          transparent, so it stays a real control rather than a div pretending. */}
      <span className="pointer-events-none flex min-w-0 items-center gap-1.5 rounded-md border border-ink-950/8 bg-cream-50 px-3 py-1.5">
        <span className="truncate font-display text-base text-ink-950">{title}</span>
        <span aria-hidden className="shrink-0 text-[10px] text-ink-500">
          ▾
        </span>
      </span>
      <select
        aria-label="Switch case study"
        value={current}
        onChange={(e) => router.push(`/studio/projects/${e.target.value}`)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.title}
          </option>
        ))}
      </select>
    </label>
  );
}
