import type { ReactNode } from "react";

export type CardSignal = { label: string; tone?: "warn" | "muted" };

type Props = {
  /** Display index, e.g. "01". Decorative. */
  index: string;
  title: string;
  /** Inline SVG icon element. Rendered decorative inside the thumbnail. */
  icon: ReactNode;
  status: "live" | "code";
  meta?: string;
  /** Small sub-note under the meta, e.g. "facet labels in code". */
  note?: string;
  signals?: CardSignal[];
  /** Keystatic deep-link. When omitted the card is non-interactive (e.g. Contact). */
  href?: string;
  /** Accessible name for the link, e.g. "Edit boAt Crest in Keystatic". */
  ariaLabel?: string;
  /** Optional extra body content, e.g. read-only skill pills. */
  children?: ReactNode;
};

function StatusPill({ status }: { status: "live" | "code" }) {
  const live = status === "live";
  return (
    <span
      className={[
        "absolute top-2 right-2 rounded-full px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide",
        live ? "bg-success-50 text-success-700" : "bg-cream-300 text-ink-600",
      ].join(" ")}
    >
      {live ? "Live" : "In code"}
    </span>
  );
}

export default function ContentCard({
  index,
  title,
  icon,
  status,
  meta,
  note,
  signals = [],
  href,
  ariaLabel,
  children,
}: Props) {
  const isCode = status === "code";
  const hasWarn = signals.some((s) => s.tone !== "muted");

  const base = [
    "block overflow-hidden rounded-lg border bg-cream-50 transition-colors",
    isCode ? "bg-cream-100" : "",
    hasWarn ? "border-accent-500/40" : "border-ink-950/8",
    href ? "hover:border-accent-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500" : "",
  ].join(" ");

  const inner = (
    <>
      <div
        className={[
          "relative flex h-16 items-center justify-center",
          isCode ? "bg-cream-200 text-ink-400" : "bg-cream-200 text-accent-500",
        ].join(" ")}
      >
        <span
          className="absolute left-3 top-2 font-display text-sm italic text-ink-400"
          aria-hidden
        >
          {index}
        </span>
        <StatusPill status={status} />
        <span className="[&>svg]:size-5" aria-hidden>
          {icon}
        </span>
      </div>

      <div className="px-3.5 pb-3 pt-2.5">
        <div
          className={[
            "font-display text-[15px] leading-snug",
            isCode ? "text-ink-600" : "text-ink-950",
          ].join(" ")}
        >
          {title}
        </div>
        {meta && <p className="mt-1 text-[11px] text-ink-400">{meta}</p>}
        {note && <p className="mt-0.5 text-[10px] text-text-subtle">{note}</p>}

        {signals.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <span
                key={s.label}
                className={[
                  "inline-block rounded-full border px-2 py-0.5 text-[10px]",
                  s.tone === "muted"
                    ? "border-ink-950/8 text-text-subtle"
                    : "border-accent-500/35 text-accent-500",
                ].join(" ")}
              >
                {s.label}
              </span>
            ))}
          </div>
        )}

        {children && <div className="mt-2.5">{children}</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className={`group ${base}`}>
        {inner}
      </a>
    );
  }

  return <div className={base}>{inner}</div>;
}
