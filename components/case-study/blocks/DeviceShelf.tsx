import type { DeviceSpec, GlowWord as GlowWordType } from "@/lib/case-studies/types";
import DeviceImage from "../DeviceImage";
import GlowWord from "../GlowWord";
import { SHELF_GRADIENT, LINE } from "../styles";

type Props = {
  devices: DeviceSpec[];
  glow?: GlowWordType;
  minHeight?: number;
};

/** `.sysduo` — gradient pedestal holding devices side by side, with theme labels. */
export default function DeviceShelf({ devices, glow, minHeight = 480 }: Props) {
  // CS-6b — a wide (browser / MacBook) frame would be cramped in the horizontal
  // phone row, so when the shelf holds any wide frame, stack the devices full-width
  // down a single column instead. A phone shelf (no wide frame — every migrated
  // project, boat-crest) keeps the horizontal row, byte-identically.
  const wide = devices.some((d) => d.frame === "browser" || d.frame === "macbook");
  return (
    <div
      className={
        wide
          ? "relative overflow-hidden rounded-xl border flex flex-col items-center gap-10 px-8 pt-11 lg:px-10"
          : "relative overflow-hidden rounded-xl border flex flex-wrap items-end justify-center gap-8 px-8 pt-11 lg:px-10"
      }
      style={{ background: SHELF_GRADIENT, borderColor: LINE, minHeight }}
    >
      {glow && <GlowWord word={glow} />}
      {devices.map((d, i) => (
        <div
          key={i}
          className={
            wide
              ? "relative z-[2] flex w-full flex-col items-center"
              : "relative z-[2] flex flex-col items-center"
          }
        >
          <DeviceImage image={d} />
          {d.label && (
            <span
              className="mt-4 -translate-y-3.5 rounded-full border bg-cream-50 px-3.5 py-1.5 text-eyebrow tracking-[0.14em] uppercase font-semibold text-text-subtle"
              style={{ borderColor: LINE }}
            >
              {d.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
