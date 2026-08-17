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
  // ADDITIVE ONLY. The Replace affordance used to live in a wrapper span around the
  // image, which inserted a new box into the layout chain: a frame sized as a
  // percentage then resolved against the wrapper instead of its real parent, and
  // collapsed. Instead the markers and the button are handed to the element that is
  // ALREADY position:relative, so the editable render adds an absolutely-positioned
  // button and nothing else. Out of flow means it cannot affect layout by
  // construction, rather than by picking the right width.
  const editProps = editable
    ? { "data-edit-block-index": blockIndex, "data-edit-image-path": editPath }
    : undefined;

  /* ⚠ ATTRIBUTES, NOT A WRAPPER — the same rule the paragraph above states for the edit markers,
     and for the same reason. They ride the element that is ALREADY positioned, so a previewable
     image and a plain one produce identical boxes.

     ⚠ AND NOT IN THE CANVAS. `editable` is the studio inline canvas, where a click already means
     "replace this image"; opening a zoom overlay on top of that would put two meanings on one
     gesture. The public page previews, the canvas edits. */
  /* ⚠ THE IMAGE CARRIES ITS OWN ANSWER NOW, so the `preview` prop is gone and no call site opts
     in. Eleven `<DeviceImage preview />` sites said "this block's images are previewable", which
     could never express "this one is and that one is not" — the grain the editor actually needs.
     Absent means true; only an explicit false from the editor turns it off. */
  const previewSrc = !editable && image.preview !== false ? srcOf(image.src) : null;
  const previewProps = previewSrc
    ? { "data-preview-src": previewSrc, "data-preview-alt": image.alt }
    : undefined;

  const overlay = editable ? <ReplaceImageButton /> : previewSrc ? <PreviewHint /> : null;
  return (
    <DeviceImageInner
      image={image}
      className={className}
      priority={priority}
      editProps={{ ...editProps, ...previewProps }}
      overlay={overlay}
    />
  );
}

/** A `next/image` src is either a static import or a path string; the overlay wants the URL. */
function srcOf(src: import("next/image").StaticImageData | string): string {
  return typeof src === "string" ? src : src.src;
}

/** The hover badge. Absolutely positioned like the Replace button, and `pointer-events-none` so
 *  the click target stays the whole image rather than this. Shown by CSS on hover only — see
 *  `.cs-preview-hint`, which also hides it where there is no hover to speak of. */
function PreviewHint() {
  return (
    <span aria-hidden="true" className="cs-preview-hint">
      Click to zoom
    </span>
  );
}

/** The Replace affordance. Absolutely positioned, so it never participates in layout. */
function ReplaceImageButton() {
  return (
    <button
      type="button"
      data-edit-image-replace
      aria-label="Replace image"
      className="absolute right-2 top-2 z-[20] bg-accent px-2.5 py-1 text-[12px] font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
    >
      Replace image
    </button>
  );
}

function DeviceImageInner({
  image,
  className,
  priority = false,
  editProps,
  overlay,
}: {
  image: ImgSpec;
  className?: string;
  priority?: boolean;
  /** Studio-only edit markers, spread onto the already-positioned outer element. */
  editProps?: Record<string, unknown>;
  /** Studio-only absolutely-positioned affordance, rendered inside that element. */
  overlay?: React.ReactNode;
}) {
  // CS-5 — a wide frame (browser / MacBook) is a whole different chrome and aspect.
  // Phone and absent fall through to the existing markup UNTOUCHED (the byte-identical
  // gate), so every existing image and all of boat-crest render exactly as before.
  if (isWideFrame(image.frame)) {
    return (
      <WideFrame
        image={image}
        className={className}
        variant={image.frame as "browser" | "macbook"}
        priority={priority}
        editProps={editProps}
        overlay={overlay}
      />
    );
  }

  const { src, alt, width, height, rotate, translate, z, unoptimized, intrinsicWidth, intrinsicHeight } = image;
  const hasTransform = rotate != null || translate != null;
  const transform = hasTransform
    ? `rotate(${rotate ?? 0}deg) translate(${translate?.[0] ?? 0}px, ${translate?.[1] ?? 0}px)`
    : undefined;

  if (typeof src === "string") {
    // Size the wrapper by the given dimension; the other derives from the aspect.
    const sizing = height != null ? { height } : { width: width ?? 248 };
    // ⚠ THE TRUE ASPECT WHEN CONTENT SUPPLIES IT, the canonical bezel only as a fallback. A static
    // import knows its own shape; a path string does not, so this used to force EVERY content
    // image into a phone-shaped box. Measured on boat-crest, 19 of 25 images are a different shape
    // from that box and two of them are wide footer strips at 4.33 and 3.77 — `object-contain`
    // stops the distortion but not the letterboxing. Absent dims keep the old behaviour exactly,
    // so nothing already shipped moves.
    const aspect =
      intrinsicWidth != null && intrinsicHeight != null
        ? `${intrinsicWidth} / ${intrinsicHeight}`
        : `${BEZEL_W} / ${BEZEL_H}`;
    return (
      <span
        {...editProps}
        className={`cs-flatten relative block max-w-full drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)] ${className ?? ""}`}
        style={{ ...sizing, aspectRatio: aspect, transform, zIndex: z }}
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
        {overlay}
      </span>
    );
  }

  // Size by height when given (before/after pairs), otherwise by width.
  const sizing = height != null ? { height, width: "auto" } : { width: width ?? 248, height: "auto" };

  const staticImage = (
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
  // Only this path needs a wrapper: a bare <Image> is not a positioned ancestor. It is
  // reachable only for STATIC imports (boat-crest, whose sections are empty, so it is
  // never editable) and it is fixed-width, so shrink-wrapping cannot collapse anything.
  if (!overlay && !editProps) return staticImage;
  return (
    <span {...editProps} className="relative inline-block">
      {staticImage}
      {overlay}
    </span>
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
  editProps,
  overlay,
}: {
  image: ImgSpec;
  className?: string;
  variant: "browser" | "macbook";
  priority?: boolean;
  editProps?: Record<string, unknown>;
  overlay?: React.ReactNode;
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
      {...editProps}
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
          {/* ⚠ RAW `ink-950` ON PURPOSE — A BEZEL IS A DEPICTED OBJECT, NOT TEXT. The #383 sweep
              gave this a background painted from the primary TEXT role, because the mechanical rule
              saw a rung that had one. (The class is not spelled here: naming it would make it
              compile from this comment alone, which `css-comment-trap` exists to catch.)
              A phone frame is near-black because PHONES ARE, so under a dark ground `text-primary`
              would flip light and the bezel would turn white. Same category as HeroCover's on-dark
              constants: the component is not choosing a colour for its context, it is drawing a
              thing that has one. */}
          <span className="block overflow-hidden rounded-lg border-[3px] border-ink-950/80 bg-ink-950">
            {screen}
          </span>
          <span aria-hidden className="relative block h-2.5 rounded-b-lg bg-ink-950/80">
            <span className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-md bg-ink-950/50" />
          </span>
        </span>
      )}
      {overlay}
    </span>
  );
}
