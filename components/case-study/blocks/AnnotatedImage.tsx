import { Fragment } from "react";
import type { ImgSpec, Scrawl, Callout } from "@/lib/case-studies/types";
import DeviceImage from "../DeviceImage";
import Annotation from "../Annotation";

type Props = { image: ImgSpec; scrawl?: Scrawl; callouts?: Callout[] };

/**
 * A device screenshot with optional handwritten scrawl (Caveat) and dot-line
 * callouts. On desktop these are absolutely positioned; at the mobile breakpoint
 * the scrawl reads as a caption above the image and callouts stack as rows.
 */
export default function AnnotatedImage({ image, scrawl, callouts }: Props) {
  return (
    <div className="relative flex flex-col items-center gap-5 lg:min-h-[560px] lg:justify-center">
      {scrawl && (
        <span
          className="font-doodle font-bold text-2xl text-accent-500 leading-tight z-[5] lg:absolute lg:-rotate-[5deg]"
          style={{ top: scrawl.top, right: scrawl.right, bottom: scrawl.bottom, left: scrawl.left }}
        >
          {scrawl.text.split("\n").map((line, i, arr) => (
            <Fragment key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </span>
      )}

      <DeviceImage image={image} />

      {callouts?.map((c, i) => (
        <Annotation key={i} callout={c} />
      ))}
    </div>
  );
}
