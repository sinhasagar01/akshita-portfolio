import type { Stat } from "@/lib/case-studies/types";
import StatCard from "../StatCard";
import { renderRich } from "../rich";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

type Props = { heading?: string; stats: Stat[]; web?: boolean; editable?: boolean; blockIndex?: number };

/** Grid of `.statc` cards with an optional small heading. Under template=web
 *  (CS-7b), the Bold-gallery treatment: oversized serif numerals in a row with a
 *  bold label, no card chrome. Mobile renders the existing cards, byte-identically. */
/** ⚠ THE COLUMN COUNT DERIVES FROM THE STAT COUNT, IT IS NOT A CONSTANT. A single honest figure
 *  in a three-column grid sits in a third of the row with two empty columns beside it, and it
 *  reads as a set with members missing rather than as one number given its weight.
 *
 *  boAt Crest has exactly ONE outcome number in its content — the store rating — and the audit
 *  that found it also found the other three studies filling their Impact sections with research
 *  INPUTS. Inventing two more to fill the grid is the defect, not the fix, so the layout tells the
 *  truth about the count instead. */
export default function StatCards({ heading, stats, web = false, editable = false, blockIndex }: Props) {
  return (
    <div>
      {heading && (
        <p className="text-eyebrow tracking-[0.16em] uppercase font-semibold text-accent mb-5">
          {heading}
        </p>
      )}
      {web ? (
        <div className="grid grid-cols-1 items-start gap-x-10 gap-y-9 sm:grid-cols-3">
          {stats.map((s, i) => (
            <div key={i} className="reveal-card">
              <p className="font-display text-[clamp(3rem,6vw,4rem)] text-accent leading-[0.9]">
                {/* The value is wrapped in an editable span ONLY when editable, so the
                    public render stays byte-identical (a bare text node otherwise). */}
                {editable ? (
                  <span {...inlineEditProps(editable, blockIndex, `stats.${i}.value`, "Edit stat value")} className={EDIT_AFFORD}>
                    {s.value}
                  </span>
                ) : (
                  s.value
                )}
                {s.suffix && <span className="text-[0.42em] align-baseline">{s.suffix}</span>}
              </p>
              <div
                {...inlineEditProps(editable, blockIndex, `stats.${i}.body`, "Edit stat body", true)}
                className={`text-[1rem] font-medium text-text-primary leading-[1.4] mt-3 max-w-[28ch]${editable ? EDIT_AFFORD : ""}`}
              >
                {renderRich(s.body)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-[18px] ${stats.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {stats.map((s, i) => (
            <div key={i} className="reveal-card">
              <StatCard stat={s} solo={stats.length === 1} editable={editable} blockIndex={blockIndex} itemIndex={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
