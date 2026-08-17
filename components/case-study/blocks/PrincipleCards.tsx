import type { Principle } from "@/lib/case-studies/types";
import PrincipleCard from "../PrincipleCard";

type Props = {
  heading?: string;
  subhead?: string;
  cards: Principle[];
  web?: boolean;
  editable?: boolean;
  blockIndex?: number;
};

/** Grid of `.pcard` cards with an optional heading and subhead.
 *
 *  ⚠ THIS HEADING AND `FigureGrid`'s WERE BYTE-IDENTICAL STRINGS — the display face, slanted, at the
 *  third heading step, in the primary ink, with a tight line-height — which is two files agreeing by
 *  COPY rather than by a role. Both take `sheet-h3` now, so the agreement is a shared declaration
 *  instead of a shared accident, and the next edit to one cannot silently diverge from the other.
 *
 *  ⚠ AND THE FIRST DRAFT OF THAT SENTENCE TRANSCRIBED THE STRING, WHICH MADE THIS COMMENT THE ONLY
 *  THING GENERATING ITS LINE-HEIGHT UTILITY. `css-comment-trap` A5 went red naming this file —
 *  EIGHTH instance of explaining-it-requires-writing-it, and the SECOND I have committed in this
 *  arc, two units after writing "describe a retired utility, never transcribe it" into `HeroCover`.
 *  Knowing the rule is not applying it; the gate is what applies it. */
export default function PrincipleCards({ heading, subhead, cards, web = false, editable = false, blockIndex }: Props) {
  return (
    <div>
      {heading && (
        <h3 className="sheet-h3">
          {heading}
        </h3>
      )}
      {subhead && (
        <p className="text-[1rem] text-text-secondary leading-normal mt-2">
          {subhead}
        </p>
      )}
      <div className={`grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 ${heading || subhead ? "mt-7" : ""}`}>
        {cards.map((c, i) => (
          <div key={i} className="reveal-card">
            <PrincipleCard principle={c} web={web} editable={editable} blockIndex={blockIndex} itemIndex={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
