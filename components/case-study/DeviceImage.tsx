import Image from "next/image";
import type { ImgSpec } from "@/lib/case-studies/types";

/**
 * A phone screenshot. Desktop rotation/translate is a layout device, flattened at
 * the mobile breakpoint via `.cs-flatten` (see globals.css) — not gated on reduced
 * motion, since it is static positioning, not animation.
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

  // Size by height when given (before/after pairs), otherwise by width.
  const sizing = height != null ? { height, width: "auto" } : { width: width ?? 248, height: "auto" };

  return (
    <Image
      src={src}
      alt={alt}
      placeholder={typeof src === "string" ? "empty" : "blur"}
      sizes="(max-width: 1023px) 60vw, 288px"
      className={`cs-flatten max-w-full drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)] ${className ?? ""}`}
      style={{ ...sizing, transform, zIndex: z }}
    />
  );
}
