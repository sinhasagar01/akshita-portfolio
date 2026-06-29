import type { BeforeAfterPair } from "@/lib/case-studies/types";
import DeviceImage from "../DeviceImage";
import { LINE } from "../styles";

/** `.bacard` — before→after device pairs with a change list; alternates side. */
export default function BeforeAfter({ pairs }: { pairs: BeforeAfterPair[] }) {
  return (
    <div className="flex flex-col gap-[18px]">
      {pairs.map((p, i) => (
        <div
          key={p.title}
          className={`reveal-card flex flex-col items-center gap-9 rounded-xl border bg-cream-50 p-8 lg:flex-row lg:items-center lg:gap-12 ${
            i % 2 === 1 ? "lg:flex-row-reverse" : ""
          }`}
          style={{ borderColor: LINE }}
        >
          {/* Before → After pair */}
          <div className="flex shrink-0 items-center justify-center gap-4">
            <figure className="flex flex-col items-center gap-2">
              <figcaption className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-text-subtle">
                Before
              </figcaption>
              <DeviceImage image={p.before} className="grayscale-[0.2]" />
            </figure>
            <span aria-hidden="true" className="text-accent-500 text-2xl font-display">
              →
            </span>
            <figure className="flex flex-col items-center gap-2">
              <figcaption className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-accent-500">
                After
              </figcaption>
              <DeviceImage image={p.after} />
            </figure>
          </div>

          {/* Change list */}
          <div className="flex-1">
            <h3 className="font-display font-normal text-2xl text-ink-950 leading-[1.1]">
              {p.title}
            </h3>
            <p className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-text-subtle mt-1.5">
              {p.tag}
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {p.changes.map((c, ci) => (
                <li key={ci} className="flex items-baseline gap-2.5">
                  <span aria-hidden="true" className="mt-1.5 size-[6px] shrink-0 rounded-full bg-accent-500" />
                  <span className="text-[0.95rem] text-ink-600 leading-[1.5]">
                    <b className="font-bold text-ink-950">{c.emphasis}</b> {c.rest}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
