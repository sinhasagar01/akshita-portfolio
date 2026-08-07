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

/** Grid of `.pcard` cards with an optional display heading and subhead. */
export default function PrincipleCards({ heading, subhead, cards, web = false, editable = false, blockIndex }: Props) {
  return (
    <div>
      {heading && (
        <h3 className="font-display italic font-normal text-3xl text-text-primary leading-[1.15]">
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
