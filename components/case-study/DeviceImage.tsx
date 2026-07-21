import Image from "next/image";
import type { ImgSpec } from "@/lib/case-studies/types";
import { BEZEL_W, BEZEL_H } from "./blocks/deviceScroller";

// CS-5 — the wide-frame geometry. ONE aspect for the browser + MacBook screen
// (16:10, the standard laptop / dashboard ratio) so a dashboard renders full-size
// instead of cramped in a phone, and one max render width. Named + documented
// because no wide constant existed to reuse (the only image dims today are the
// portrait BEZEL_W/BEZEL_H and WorkStory's PHONE_W).
const WIDE_ASPECT = "16 / 10";
const WIDE_MAX_W = 760;

/** CS-6c — the single wide-frame test. A wide frame (browser / MacBook) renders
 *  a landscape dashboard, so its consumers give it a full-width slot instead of
 *  the phone row/column. Phone / absent is never wide. Shared by DeviceImage's own
 *  render branch and by the block renderers (deviceShelf, featureRows, beforeAfter,
 *  heroCover) so the "is this wide" rule lives in one place. */
export function isWideFrame(frame?: string): boolean {
  return frame === "browser" || frame === "macbook";
}

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
  editable = false,
  blockIndex,
  editPath,
  priority = false,
}: {
  image: ImgSpec;
  className?: string;
  /** CS-7e — studio inline canvas: overlay a Replace affordance on this image and
   *  tag it with its block index + the dotted path to its image spec within the
   *  block value (e.g. "devices.0", "features.1.image"). Off by default → public
   *  render byte-identical. */
  editable?: boolean;
  blockIndex?: number;
  editPath?: string;
  /** Phase 5 — mark the case-study hero device as the LCP image so next/image
   *  preloads it instead of lazy-loading. Off by default (below-the-fold images stay
   *  lazy). */
  priority?: boolean;
}) {
  const inner = <DeviceImageInner image={image} className={className} priority={priority} />;
  if (!editable) return inner;
  // The Replace affordance needs a positioned wrapper, but a plain `block` span
  // BROKE the width chain for wide frames: the frame inside is `w-full` capped at
  // WIDE_MAX_W, so with a width-less wrapper between it and its flex parent, 100%
  // resolved against nothing and the dashboard collapsed to about 90px — the canvas
  // showed a thumbnail where the live page shows a full-width screenshot.
  //
  // So for a wide frame the wrapper takes over BOTH jobs its parent was doing: carry
  // the full width, and centre the capped frame inside it. A phone frame has an
  // intrinsic width and shrink-wraps correctly, so it keeps the plain block.
  const wideFrame = isWideFrame(image.frame);
  return (
    <span
      className={wideFrame ? "relative flex w-full justify-center" : "relative block"}
      data-edit-block-index={blockIndex}
      data-edit-image-path={editPath}
    >
      {inner}
      <button
        type="button"
        data-edit-image-replace
        aria-label="Replace image"
        className="absolute right-2 top-2 z-[20] rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-medium text-cream-50 shadow-sm transition-colors hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
      >
        Replace image
      </button>
    </span>
  );
}

function DeviceImageInner({
  image,
  className,
  priority = false,
}: {
  image: ImgSpec;
  className?: string;
  priority?: boolean;
}) {
  // CS-5 — a wide frame (browser / MacBook) is a whole different chrome and aspect.
  // Phone and absent fall through to the existing markup UNTOUCHED (the byte-identical
  // gate), so every existing image and all of boat-crest render exactly as before.
  if (isWideFrame(image.frame)) {
    return <WideFrame image={image} className={className} variant={image.frame as "browser" | "macbook"} priority={priority} />;
  }

  const { src, alt, width, height, rotate, translate, z, unoptimized } = image;
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
          priority={priority}
          unoptimized={unoptimized}
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
      priority={priority}
      unoptimized={unoptimized}
    />
  );
}

/**
 * CS-5 — a wide device frame: a browser window or a MacBook, showing a dashboard
 * screenshot at real size. The chrome is presentational (token-driven, aria-hidden);
 * the image keeps its alt. Rendered as `fill` + object-contain inside a wide-aspect
 * screen, so a content-path STRING src (migrated projects) works the same as a
 * StaticImageData — the whole image shows, wide, never cropped to a phone.
 */
function WideFrame({
  image,
  className,
  variant,
  priority = false,
}: {
  image: ImgSpec;
  className?: string;
  variant: "browser" | "macbook";
  priority?: boolean;
}) {
  const { src, alt, z, unoptimized } = image;

  const screen = (
    <span className="relative block bg-cream-100" style={{ aspectRatio: WIDE_ASPECT }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1023px) 90vw, 760px"
        // StaticImageData carries a blur placeholder; a content-path string has none.
        placeholder={typeof src === "string" ? undefined : "blur"}
        className="object-contain"
        priority={priority}
        unoptimized={unoptimized}
      />
    </span>
  );

  return (
    <span
      className={`cs-flatten relative block w-full drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)] ${className ?? ""}`}
      style={{ maxWidth: WIDE_MAX_W, zIndex: z }}
    >
      {variant === "browser" ? (
        <span className="block overflow-hidden rounded-xl border border-ink-950/10 bg-cream-50">
          {/* browser chrome — decorative: three dots and a url pill */}
          <span
            aria-hidden
            className="flex items-center gap-1.5 border-b border-ink-950/8 bg-cream-100 px-3.5 py-2.5"
          >
            <span className="size-2.5 rounded-full bg-ink-950/15" />
            <span className="size-2.5 rounded-full bg-ink-950/15" />
            <span className="size-2.5 rounded-full bg-ink-950/15" />
            <span className="ml-3 h-4 w-full max-w-[240px] rounded-full bg-ink-950/5" />
          </span>
          {screen}
        </span>
      ) : (
        <span className="block">
          {/* MacBook — a dark bordered screen over a base bar with a trackpad notch */}
          <span className="block overflow-hidden rounded-lg border-[3px] border-ink-950/80 bg-ink-950">
            {screen}
          </span>
          <span aria-hidden className="relative block h-2.5 rounded-b-lg bg-ink-950/80">
            <span className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-md bg-ink-950/50" />
          </span>
        </span>
      )}
    </span>
  );
}
