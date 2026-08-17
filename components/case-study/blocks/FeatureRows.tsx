import type { Feature } from "@/lib/case-studies/types";
import DeviceImage, { isWideFrame } from "../DeviceImage";
import { renderRich } from "../rich";
import { LINE } from "../styles";
import SheetStamp from "../SheetStamp";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `.feat` — alternating image/text rows, each stamped with its index. */
export default function FeatureRows({
  features,
  editable = false,
  blockIndex,
}: {
  features: Feature[];
  /** CS-7e — studio inline canvas: make each feature image replaceable. */
  editable?: boolean;
  blockIndex?: number;
}) {
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
                ? "reveal-card relative overflow-hidden border bg-surface flex flex-col items-center gap-9 p-8 lg:px-14"
                : `reveal-card relative overflow-hidden border bg-surface flex flex-col items-center gap-9 p-8 lg:flex-row lg:gap-[52px] lg:px-14 ${
                    reversed ? "lg:flex-row-reverse" : ""
                  }`
            }
            style={{ borderColor: LINE }}
          >
            {/* ⚠ THE 15.5rem GHOST NUMERAL BECOMES A STAMP, AND THE CORNER FOLLOWS THE ROW'S OWN
                MIRRORING. The row alternates which side the image sits on and the numeral always sat
                on the empty side, so the stamp keeps that by reading the same `reversed` flag. It
                moves from vertically centred to a top corner because a mark on a print sits in a
                corner, where a 15.5rem wash sat wherever there was room. */}
            <SheetStamp text={f.index} corner={reversed ? "tl" : "tr"} />

            <div
              className={
                wide
                  ? "relative z-[1] flex w-full justify-center"
                  : "relative z-[1] flex shrink-0 justify-center lg:w-[268px]"
              }
            >
              <DeviceImage
                image={f.image}
                editable={editable}
                blockIndex={blockIndex}
                editPath={`features.${i}.image`}
              />
            </div>

            <div className="relative z-[1] flex-1 max-w-[540px]">
              <div
                {...inlineEditProps(editable, blockIndex, `features.${i}.category`, "Edit category")}
                className={`text-eyebrow tracking-[0.18em] uppercase font-semibold text-accent${
                  editable ? EDIT_AFFORD : ""
                }`}
              >
                {f.category}
              </div>
              <h3
                {...inlineEditProps(editable, blockIndex, `features.${i}.title`, "Edit title")}
                className={`font-display font-normal text-2xl text-text-primary leading-[1.07] mt-3${
                  editable ? EDIT_AFFORD : ""
                }`}
              >
                {f.title}
              </h3>
              <p
                {...inlineEditProps(editable, blockIndex, `features.${i}.body`, "Edit feature body", true)}
                className={`text-[1rem] text-text-secondary leading-[1.62] mt-3.5${editable ? EDIT_AFFORD : ""}`}
              >
                {renderRich(f.body)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
