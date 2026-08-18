import type { Stat } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE, ACCENT_RING } from "./styles";
import { EDIT_AFFORD, inlineEditProps } from "./editable";

/** `.statc`/`.icard` — big Fraunces number, body, and an accent tag. */
export default function StatCard({
  solo = false, stat,
  editable = false,
  blockIndex,
  itemIndex,
}: {
  stat: Stat;
  editable?: boolean;
  blockIndex?: number;
  itemIndex?: number;
  /** ⚠ A SOLO FIGURE IS NOT A CARD IN A ROW. When a study has exactly ONE honest outcome
   *  number, gridding it leaves two empty columns and the number reads as a fragment of a set
   *  that is not there. Default false, so every multi-stat consumer renders byte-identically. */
  solo?: boolean;
}) {
  const aff = editable ? EDIT_AFFORD : "";
  return (
    <div
      /* ⚠ SOLO BECOMES A PLATE, NOT A TALLER CARD. At full width the figure sat in the left third
         and the right sixty per cent was empty, which reads as a container missing its siblings —
         the exact impression the solo layout exists to remove. A two-column grid puts the note
         beside the figure and uses the measure. NO DOM CHANGE: the same three children are placed
         by grid, so the multi-stat render stays byte-identical and the parity contract holds. */
      className={`relative z-[1] border p-7 ${
        stat.highlighted ? "bg-cream-200" : "bg-surface"
      }${solo ? " sm:grid sm:grid-cols-[auto_1fr] sm:items-start sm:gap-x-14" : ""}`}
      style={{ borderColor: stat.highlighted ? ACCENT_RING : LINE }}
    >
      <p className={`font-display ${solo ? "text-[clamp(3.5rem,9vw,6.5rem)] sm:row-span-2 sm:self-center" : "text-5xl"} text-accent leading-none`}>
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
        className={`text-[0.95rem] text-text-primary leading-[1.52] mt-3.5${solo ? " sm:col-start-2 sm:mt-0" : ""}${aff}`}
      >
        {renderRich(stat.body)}
      </p>
      <span
        {...inlineEditProps(editable, blockIndex, `stats.${itemIndex}.tag`, "Edit stat tag")}
        className={`block text-[0.8rem] font-bold text-accent mt-4 pt-3 border-t tracking-[0.01em]${solo ? " sm:col-start-2" : ""}${aff}`}
        style={{ borderColor: LINE }}
      >
        {stat.tag}
      </span>
    </div>
  );
}
