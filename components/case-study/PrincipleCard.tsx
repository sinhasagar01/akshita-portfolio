import type { Principle } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE } from "./styles";
import { EDIT_AFFORD, inlineEditProps } from "./editable";

/** `.pcard` — italic index, Fraunces title, description. Under template=web (CS-7b),
 *  the Bold-gallery bordered card: a 2px accent top rule, a serif index, and no card
 *  fill/full border. Mobile renders the filled card, byte-identically. */
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
      <div className="relative z-[1] border-t-2 border-accent-500 pt-4">
        <div {...idxProps} className={`font-display text-3xl text-accent-500 leading-none${aff}`}>
          {principle.index}
        </div>
        <h3 {...titleProps} className={`font-display text-2xl font-normal text-text-primary leading-[1.1] mt-3${aff}`}>
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
      className="relative z-[1] rounded-lg border bg-cream-200 p-7"
      style={{ borderColor: LINE }}
    >
      <div {...idxProps} className={`font-display italic text-3xl text-accent-500 leading-none${aff}`}>
        {principle.index}
      </div>
      <h3 {...titleProps} className={`font-display text-2xl font-normal text-text-primary leading-[1.1] mt-3.5${aff}`}>
        {principle.title}
      </h3>
      <p {...bodyProps} className={`text-[0.95rem] text-text-secondary leading-[1.56] mt-3${aff}`}>
        {renderRich(principle.body)}
      </p>
    </div>
  );
}
