import Image from "next/image";
import type { ImgSpec } from "@/lib/case-studies/types";
import { BEZEL_W, BEZEL_H } from "./blocks/deviceScroller";

/**
 * A phone screenshot. Desktop rotation/translate is a layout device, flattened at
 * the mobile breakpoint via `.cs-flatten` (see globals.css) — not gated on reduced
 * motion, since it is static positioning, not animation.
 *
 * P4 3(c) — two sizing modes, one component:
 *  - A STATIC IMPORT carries intrinsic dims, so next/image sizes itself from the
 *    width/height style exactly as before (this path is byte-identical to the
 *    pre-3(c) markup — the boat-crest gate).
 *  - A CONTENT PATH (bare string src) has no intrinsic dims, so it renders as
 *    `fill` inside a wrapper sized by the same width/height logic plus a phone
 *    aspect-ratio. The aspect is the canonical bezel ratio from deviceScroller
 *    (every DeviceImage consumer renders phone screenshots); a per-image aspect
 *    field is a flagged 3(d) question if real migrated images disagree.
 */
export default function DeviceImage({
  image,
  className,
}: {
  image: ImgSpec;
  className?: string;
}) {
  const { src, alt, width, height, rotate, translate, z } = image;
  const hasTransform = rotate != null || translate != null;
  const transform = hasTransform
    ? `rotate(${rotate ?? 0}deg) translate(${translate?.[0] ?? 0}px, ${translate?.[1] ?? 0}px)`
    : undefined;

  if (typeof src === "string") {
    // Size the wrapper by the given dimension; the other derives from the aspect.
    const sizing = height != null ? { height } : { width: width ?? 248 };
    return (
      <span
        className={`cs-flatten relative block max-w-full drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)] ${className ?? ""}`}
        style={{ ...sizing, aspectRatio: `${BEZEL_W} / ${BEZEL_H}`, transform, zIndex: z }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1023px) 60vw, 288px"
          className="object-contain"
        />
      </span>
    );
  }

  // Size by height when given (before/after pairs), otherwise by width.
  const sizing = height != null ? { height, width: "auto" } : { width: width ?? 248, height: "auto" };

  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      sizes="(max-width: 1023px) 60vw, 288px"
      className={`cs-flatten max-w-full drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)] ${className ?? ""}`}
      style={{ ...sizing, transform, zIndex: z }}
    />
  );
}
