import type { Principle } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE } from "./styles";
import { EDIT_AFFORD, inlineEditProps } from "./editable";

/** `.pcard` — index, title, description. Under template=web (CS-7b), the bordered card: a 2px
 *  accent top rule and no card fill. Mobile renders the filled card.
 *
 *  ⚠ THE INDEX IS A MARK, SO IT TAKES THE MONO LABEL REGISTER — AND IT DROPS FROM 30px TO 11px,
 *  WHICH IS A COMPOSITION CHANGE AND IS SAID RATHER THAN BURIED. It was the display face at
 *  `text-3xl` in the accent, and on the mobile branch it was the only strong element in a filled
 *  card. In a sheet set a card's number is a small tracked mark and the TITLE carries the weight —
 *  which is what `CaseSectionHeader` did to the same construction when `Sheet 01` replaced an
 *  italic accent numeral, and what `IssueList` did in #630 at 17px.
 *
 *  ⚠ AND BOTH BRANCHES MOVE THOUGH ONLY ONE WAS ITALIC. Web drew this index upright and mobile drew
 *  it slanted — one job, two branches, the exact split the hero had. Converting only the italic one
 *  would leave two studies numbering their cards in mono and two in the display face.
 *
 *  THE ACCENT GOES WITH IT, ON BOTH. The direction sanctions the accent for four things — the
 *  current floor, the readout figures, the outcome column and the resume control — and a card index
 *  is none of them. The web card keeps its 2px accent top rule, which is the boundary weight the
 *  readout device already uses, so the accent still marks the card without being spent on a number. */
export default function PrincipleCard({
  principle,
  web = false,
  editable = false,
  blockIndex,
  itemIndex,
}: {
  principle: Principle;
  web?: boolean;
  /** CS-7d (extended) — tag index/title as in-place editable; itemIndex is this card's
   *  position in the block's `cards` array, for the dotted write path. */
  editable?: boolean;
  blockIndex?: number;
  itemIndex?: number;
}) {
  const aff = editable ? EDIT_AFFORD : "";
  const idxProps = inlineEditProps(editable, blockIndex, `cards.${itemIndex}.index`, "Edit index");
  const titleProps = inlineEditProps(editable, blockIndex, `cards.${itemIndex}.title`, "Edit title");
  const bodyProps = inlineEditProps(editable, blockIndex, `cards.${itemIndex}.body`, "Edit principle body", true);
  if (web) {
    return (
      <div className="relative z-[1] border-t-2 border-accent pt-4">
        <div {...idxProps} className={`sheet-mono-label${aff}`}>
          {principle.index}
        </div>
        <h3 {...titleProps} className={`font-display text-2xl text-text-primary leading-[1.1] mt-3${aff}`}>
          {principle.title}
        </h3>
        <p {...bodyProps} className={`text-[0.95rem] text-text-secondary leading-[1.56] mt-2.5${aff}`}>
          {renderRich(principle.body)}
        </p>
      </div>
    );
  }
  return (
    <div
      className="relative z-[1] border bg-cream-200 p-7"
      style={{ borderColor: LINE }}
    >
      <div {...idxProps} className={`sheet-mono-label${aff}`}>
        {principle.index}
      </div>
      <h3 {...titleProps} className={`font-display text-2xl text-text-primary leading-[1.1] mt-3.5${aff}`}>
        {principle.title}
      </h3>
      <p {...bodyProps} className={`text-[0.95rem] text-text-secondary leading-[1.56] mt-3${aff}`}>
        {renderRich(principle.body)}
      </p>
    </div>
  );
}
