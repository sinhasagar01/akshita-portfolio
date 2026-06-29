import type { Stat } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { LINE, ACCENT_RING } from "./styles";

/** `.statc`/`.icard` — big Fraunces number, body, and an accent tag. */
export default function StatCard({ stat }: { stat: Stat }) {
  return (
    <div
      className={`relative z-[1] rounded-lg border p-7 ${
        stat.highlighted ? "bg-cream-200" : "bg-cream-50"
      }`}
      style={{ borderColor: stat.highlighted ? ACCENT_RING : LINE }}
    >
      <p className="font-display text-5xl text-accent-500 leading-none">
        {stat.value}
        {stat.suffix && <span className="text-[0.42em] align-baseline">{stat.suffix}</span>}
      </p>
      <p className="text-[0.95rem] text-ink-950 leading-[1.52] mt-3.5">
        {renderRich(stat.body)}
      </p>
      <span
        className="block text-[0.8rem] font-bold text-accent-500 mt-4 pt-3 border-t tracking-[0.01em]"
        style={{ borderColor: LINE }}
      >
        {stat.tag}
      </span>
    </div>
  );
}
