import type { Principle } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE } from "./styles";

/** `.pcard` — italic index, Fraunces title, description. Under template=web (CS-7b),
 *  the Bold-gallery bordered card: a 2px accent top rule, a serif index, and no card
 *  fill/full border. Mobile renders the filled card, byte-identically. */
export default function PrincipleCard({
  principle,
  web = false,
}: {
  principle: Principle;
  web?: boolean;
}) {
  if (web) {
    return (
      <div className="relative z-[1] border-t-2 border-accent-500 pt-4">
        <div className="font-display text-3xl text-accent-500 leading-none">
          {principle.index}
        </div>
        <h3 className="font-display text-2xl font-normal text-ink-950 leading-[1.1] mt-3">
          {principle.title}
        </h3>
        <p className="text-[0.95rem] text-ink-600 leading-[1.56] mt-2.5">
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
      <div className="font-display italic text-3xl text-accent-500 leading-none">
        {principle.index}
      </div>
      <h3 className="font-display text-2xl font-normal text-ink-950 leading-[1.1] mt-3.5">
        {principle.title}
      </h3>
      <p className="text-[0.95rem] text-ink-600 leading-[1.56] mt-3">
        {renderRich(principle.body)}
      </p>
    </div>
  );
}
