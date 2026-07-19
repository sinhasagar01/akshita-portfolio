import type { Feature } from "@/lib/case-studies/types";
import DeviceImage, { isWideFrame } from "../DeviceImage";
import { renderRich } from "../rich";
import { LINE, GLOW } from "../styles";

/** `.feat` — alternating image/text rows, each with a giant faint number. */
export default function FeatureRows({ features }: { features: Feature[] }) {
  return (
    <div className="flex flex-col gap-[22px]">
      {features.map((f, i) => {
        const reversed = i % 2 === 1;
        // CS-6c — a wide (browser / MacBook) feature image would be crushed into the
        // 268px phone column, so a wide row stays stacked at every breakpoint: the
        // frame spans the full card width above the text. A phone row keeps the
        // alternating side-by-side layout byte-identically.
        const wide = isWideFrame(f.image.frame);
        return (
          <div
            key={f.index}
            className={
              wide
                ? "reveal-card relative overflow-hidden rounded-xl border bg-cream-50 flex flex-col items-center gap-9 p-8 lg:px-14"
                : `reveal-card relative overflow-hidden rounded-xl border bg-cream-50 flex flex-col items-center gap-9 p-8 lg:flex-row lg:gap-[52px] lg:px-14 ${
                    reversed ? "lg:flex-row-reverse" : ""
                  }`
            }
            style={{ borderColor: LINE }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none select-none absolute top-1/2 -translate-y-1/2 font-display italic font-normal leading-[0.7] z-0 text-[clamp(9rem,18vw,15.5rem)]"
              style={{ color: GLOW, [reversed ? "left" : "right"]: "38px" }}
            >
              {f.index}
            </span>

            <div
              className={
                wide
                  ? "relative z-[1] flex w-full justify-center"
                  : "relative z-[1] flex shrink-0 justify-center lg:w-[268px]"
              }
            >
              <DeviceImage image={f.image} />
            </div>

            <div className="relative z-[1] flex-1 max-w-[540px]">
              <div className="text-eyebrow tracking-[0.18em] uppercase font-semibold text-accent-500">
                {f.category}
              </div>
              <h3 className="font-display font-normal text-2xl text-ink-950 leading-[1.07] mt-3">
                {f.title}
              </h3>
              <p className="text-[1rem] text-ink-600 leading-[1.62] mt-3.5">
                {renderRich(f.body)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
