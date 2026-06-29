import { LINE } from "../styles";

type Props = { items: { label: string; value: string }[] };

/** `.glance` — summary grid with thin hairline separators (via a 1px gap). */
export default function GlanceGrid({ items }: Props) {
  return (
    <div
      className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4"
      style={{ background: LINE, borderColor: LINE }}
    >
      {items.map((it) => (
        <div key={it.label} className="reveal-card bg-cream-50 p-6">
          <b className="block text-eyebrow tracking-[0.15em] uppercase font-semibold text-text-subtle">
            {it.label}
          </b>
          <span className="block text-[1.05rem] font-semibold text-ink-950 leading-[1.35] mt-2.5">
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}
