import type { Stat } from "@/lib/case-studies/types";
import StatCard from "../StatCard";

type Props = { heading?: string; stats: Stat[] };

/** Grid of `.statc` cards with an optional small heading. */
export default function StatCards({ heading, stats }: Props) {
  return (
    <div>
      {heading && (
        <p className="text-eyebrow tracking-[0.16em] uppercase font-semibold text-accent-500 mb-5">
          {heading}
        </p>
      )}
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <div key={i} className="reveal-card">
            <StatCard stat={s} />
          </div>
        ))}
      </div>
    </div>
  );
}
