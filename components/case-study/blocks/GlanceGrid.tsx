import { LINE } from "../styles";

type Props = { items: { label: string; value: string }[]; web?: boolean };

/** `.glance` — summary grid with thin hairline separators (via a 1px gap). Under
 *  template=web (CS-7b), the Bold-gallery bordered cards: a 2px accent top rule, the
 *  label as a serif heading over its value, no fill. Mobile renders the joined
 *  hairline grid, byte-identically. */
export default function GlanceGrid({ items, web = false }: Props) {
  if (web) {
    return (
      <div className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="reveal-card border-t-2 border-accent-500 pt-4">
            <h3 className="font-display text-2xl font-normal text-ink-950 leading-[1.1]">
              {it.label}
            </h3>
            <p className="text-[0.95rem] text-ink-600 leading-[1.56] mt-2.5">{it.value}</p>
          </div>
        ))}
      </div>
    );
  }
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
