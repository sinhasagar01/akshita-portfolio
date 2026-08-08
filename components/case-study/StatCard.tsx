import type { Stat } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE, ACCENT_RING } from "./styles";
import { EDIT_AFFORD, inlineEditProps } from "./editable";

/** `.statc`/`.icard` — big Fraunces number, body, and an accent tag. */
export default function StatCard({
  stat,
  editable = false,
  blockIndex,
  itemIndex,
}: {
  stat: Stat;
  editable?: boolean;
  blockIndex?: number;
  itemIndex?: number;
}) {
  const aff = editable ? EDIT_AFFORD : "";
  return (
    <div
      className={`relative z-[1] rounded-lg border p-7 ${
        stat.highlighted ? "bg-cream-200" : "bg-surface"
      }`}
      style={{ borderColor: stat.highlighted ? ACCENT_RING : LINE }}
    >
      <p className="font-display text-5xl text-accent leading-none">
        {/* Editable span only when editable, so the public render is byte-identical. */}
        {editable ? (
          <span {...inlineEditProps(editable, blockIndex, `stats.${itemIndex}.value`, "Edit stat value")} className={EDIT_AFFORD}>
            {stat.value}
          </span>
        ) : (
          stat.value
        )}
        {stat.suffix && <span className="text-[0.42em] align-baseline">{stat.suffix}</span>}
      </p>
      <p
        {...inlineEditProps(editable, blockIndex, `stats.${itemIndex}.body`, "Edit stat body", true)}
        className={`text-[0.95rem] text-text-primary leading-[1.52] mt-3.5${aff}`}
      >
        {renderRich(stat.body)}
      </p>
      <span
        {...inlineEditProps(editable, blockIndex, `stats.${itemIndex}.tag`, "Edit stat tag")}
        className={`block text-[0.8rem] font-bold text-accent mt-4 pt-3 border-t tracking-[0.01em]${aff}`}
        style={{ borderColor: LINE }}
      >
        {stat.tag}
      </span>
    </div>
  );
}
