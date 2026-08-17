import { LINE } from "../styles";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

type Props = {
  items: { label: string; value: string }[];
  web?: boolean;
  /** CS-7d (extended) — tag label/value as in-place editable in the studio canvas. */
  editable?: boolean;
  blockIndex?: number;
};

/** `.glance` — summary grid with thin hairline separators (via a 1px gap). Under
 *  template=web (CS-7b), the Bold-gallery bordered cards: a 2px accent top rule, the
 *  label as a serif heading over its value, no fill. Mobile renders the joined
 *  hairline grid, byte-identically. */
export default function GlanceGrid({ items, web = false, editable = false, blockIndex }: Props) {
  const aff = editable ? EDIT_AFFORD : "";
  if (web) {
    return (
      <div className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <div key={i} className="reveal-card border-t-2 border-accent pt-4">
            <h3
              {...inlineEditProps(editable, blockIndex, `items.${i}.label`, "Edit label")}
              className={`font-display text-2xl font-normal text-text-primary leading-[1.1]${aff}`}
            >
              {it.label}
            </h3>
            <p
              {...inlineEditProps(editable, blockIndex, `items.${i}.value`, "Edit value")}
              className={`text-[0.95rem] text-text-secondary leading-[1.56] mt-2.5${aff}`}
            >
              {it.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-1 gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4"
      style={{ background: LINE, borderColor: LINE }}
    >
      {items.map((it, i) => (
        <div key={i} className="reveal-card bg-surface p-6">
          <b
            {...inlineEditProps(editable, blockIndex, `items.${i}.label`, "Edit label")}
            className={`block text-eyebrow tracking-[0.15em] uppercase font-semibold text-text-subtle${aff}`}
          >
            {it.label}
          </b>
          <span
            {...inlineEditProps(editable, blockIndex, `items.${i}.value`, "Edit value")}
            className={`block text-[1.05rem] font-semibold text-text-primary leading-[1.35] mt-2.5${aff}`}
          >
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}
