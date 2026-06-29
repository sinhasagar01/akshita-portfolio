import Image from "next/image";
import type { ImgSpec } from "@/lib/case-studies/types";
import { LINE } from "./styles";

/**
 * Plain media for non-device studies (the B2B case studies use this instead of
 * DeviceImage). Renders a bordered, rounded figure that fills its column.
 */
export default function ImageFigure({
  image,
  className,
}: {
  image: ImgSpec;
  className?: string;
}) {
  return (
    <figure
      className={`relative z-[1] overflow-hidden rounded-lg border ${className ?? ""}`}
      style={{ borderColor: LINE }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        placeholder={typeof image.src === "string" ? "empty" : "blur"}
        sizes="(max-width: 1023px) 100vw, 50vw"
        className="h-auto w-full"
      />
    </figure>
  );
}
