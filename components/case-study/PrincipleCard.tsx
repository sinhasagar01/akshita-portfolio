import type { Principle } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE } from "./styles";

/** `.pcard` — italic index, Fraunces title, description. */
export default function PrincipleCard({ principle }: { principle: Principle }) {
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
