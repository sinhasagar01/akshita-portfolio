import type { ReactNode } from "react";
import { IconChevronRight } from "./icons";

export type CardSignal = { label: string; tone?: "warn" | "muted" };

type Props = {
  /** Display index, e.g. "01". Decorative. */
  index: string;
  title: string;
  /** Inline SVG icon element. Rendered decorative. */
  icon: ReactNode;
  status: "live" | "code";
  meta?: string;
  /** Small sub-note under the meta, e.g. "facet labels in code". */
  note?: string;
  signals?: CardSignal[];
  /** Link target (a /studio route). When omitted the row is a visually LOCKED,
   *  non-interactive row (Contact): a plain div, never a link/button, no hover,
   *  shift or chevron. */
  href?: string;
  /** Accessible name for the link, e.g. "Edit Hero in Settings". */
  ariaLabel?: string;
};

function StatusBadge({ status }: { status: "live" | "code" }) {
  const live = status === "live";
  return (
    <span
      className={[
        "shrink-0 rounded-full px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide",
        live ? "bg-success-50 text-success-700" : "bg-cream-300 text-ink-600",
      ].join(" ")}
    >
      {live ? "Live" : "In code"}
    </span>
  );
}

// Overview row (Task 2). Was a filled card; now a hairline row shared by the six
// homepage-overview entries.
//
// RENAMED FROM ContentCard.tsx IN #199. #166 deferred the rename to "whichever later task
// opens this file", and no later task did — so the condition never fired and the filename
// stayed wrong for the whole arc. A deferral conditional on something that may never happen
// is a deferral with no owner; this one sat for nine PRs. The name now says what it is.
export default function OverviewRow({
  index,
  title,
  icon,
  status,
  meta,
  note,
  signals = [],
  href,
  ariaLabel,
}: Props) {
  const isCode = status === "code";

  const inner = (
    <>
      <span
        className="w-6 shrink-0 font-display text-[17px] italic tabular-nums text-ink-400"
        aria-hidden
      >
        {index}
      </span>
      <span
        className={[
          "grid size-5 shrink-0 place-items-center [&>svg]:size-[19px]",
          isCode ? "text-ink-400" : "text-accent-500",
        ].join(" ")}
        aria-hidden
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block font-display text-[20px] leading-tight",
            isCode ? "text-ink-600" : "text-ink-950",
          ].join(" ")}
        >
          {title}
        </span>
        {meta && <span className="mt-1 block text-[13px] text-ink-600">{meta}</span>}
        {note && <span className="mt-0.5 block text-[11px] text-text-subtle">{note}</span>}
        {signals.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <span
                key={s.label}
                className={[
                  "inline-block rounded-full border px-2 py-0.5 text-[10px]",
                  s.tone === "muted"
                    ? "border-ink-950/12 text-text-subtle"
                    : "border-accent-500/35 text-accent-500",
                ].join(" ")}
              >
                {s.label}
              </span>
            ))}
          </span>
        )}
      </span>

      <StatusBadge status={status} />

      {href && (
        <span
          className="shrink-0 -translate-x-1 text-ink-400 opacity-0 transition duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 [&>svg]:size-4"
          aria-hidden
        >
          <IconChevronRight />
        </span>
      )}
    </>
  );

  // Navigable rows: ONE block-level <a> (no nested interactive element), with the
  // hover lift + right-shift + chevron reveal.
  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className="group flex items-center gap-4 rounded-lg border-b border-ink-950/12 py-4 pl-3.5 pr-3.5 transition-[background-color,padding-left] duration-200 ease-out hover:bg-cream-100 hover:pl-6"
      >
        {inner}
      </a>
    );
  }

  // LOCKED row (Contact): a plain div — not a link/button, not focusable, no hover,
  // no shift, no chevron. A row that looks clickable and isn't is worse than one
  // that admits it.
  return (
    <div className="flex items-center gap-4 border-b border-ink-950/12 py-4 pl-3.5 pr-3.5">
      {inner}
    </div>
  );
}
