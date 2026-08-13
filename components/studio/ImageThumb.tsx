"use client";

// The small image preview that sits at the head of an image field.
//
// WHY IT EXISTS. Both image fields used to show a bare path — a content-addressed
// filename like `.../blocks/9f21c4ab77e0.webp`, which tells the owner nothing
// about which image is actually set. This shows the image.
//
// WHY IT GOES THROUGH THE PROXY. A just-uploaded image lives only on the draft
// branch, so its public path 404s until publish. draftImageUrl routes the request
// through the owner-gated proxy, which tries draft then main — so one src is
// correct whether the image is newly uploaded or already published. It is a plain
// <img>, NOT next/image, deliberately: the optimizer refetches the URL from the
// server WITHOUT the owner cookie, so an optimized proxy URL would 401.
//
// UNCONDITIONAL IS A DELIBERATE CHOICE, NOT THE ONLY ONE THE PROJECT MAKES. There are three
// draft-image strategies and this is the bluntest of them:
//
//   1. THIS — proxy every src, always. One code path, correct whether the image is on the
//      draft branch or main, at the cost of a GitHub round trip per image.
//      **THE SIZE WAS NEVER THE VARIABLE, AND THIS SENTENCE USED TO SAY IT WAS.** It read
//      "a 36px thumbnail can afford that; that is the entire justification" — which reads as
//      contradicted the moment the thumb becomes a 143px plate. It is not. The proxy fetches
//      THE SAME FILE at any display size: bytes and round trips are identical at 36px and at
//      143px, because nothing here resizes anything. The real question the sentence was
//      answering is whether a round trip is worth it for something BARELY VISIBLE, and the
//      plate is the answer to that question rather than a violation of it — same cost, far
//      more value returned. What would genuinely change the calculus is proxying MANY images
//      at once, which is why the canvas still uses strategy 2.
//   2. makeDraftSrcRewriter — proxy only the paths in the page-load snapshot, so published
//      images keep their static path and the optimized route. What the canvas uses, because
//      a full-width figure cannot afford the proxy for every image.
//   3. lib/studio/preview-map.ts — an object URL for a file uploaded THIS session, which
//      neither of the others can resolve because the snapshot predates it.
//
// This component needs none of 2 or 3: it is handed the committed path and the proxy tries
// draft then main, so a just-uploaded image resolves without a preview. That is why the
// thumbnail has always worked while the canvas showed nothing — same upload, different
// strategy. Unifying them means breaking one of the three.
//
// ---- ⚠ GALLERY IS A FOURTH ROW IN THIS TABLE, NOT A FOURTH STRATEGY -------------------
//
// It shipped with one anyway, and the symptom was "the uploaded image does not appear until
// refresh". Its rail and index passed a RAW draft path to `next/image`, which 404s until publish;
// its canvas held an object URL and passed THAT to `next/image`, which cannot fetch a `blob:` at
// all. Two different failures behind one blank frame, which is why it read as a refresh problem
// rather than as never working.
//
// ALL THREE SURFACES NOW TAKE STRATEGY 1, AND THE TWO REASONS ARE DIFFERENT — which is the part
// worth reading, because taking the same answer for the same reason everywhere is how a fourth
// strategy gets invented next time:
//
//   RAIL AND INDEX   the size class this strategy was written for. The index is genuinely the
//                    MANY case named above — forty items is forty round trips — and it is taken
//                    anyway because strategy 2 needs a snapshot AND strategy 3 beside it to
//                    resolve a same-session upload. Its comment carries a count as the trigger to
//                    revisit rather than a feeling.
//   CANVAS           the COUNT, not the size. The overlay shows exactly ONE image, so the
//                    many-images objection that sends the case-study canvas to strategy 2 is not
//                    in play. Strategy 2's failure mode IS the reported defect: a page-load
//                    snapshot cannot see a file uploaded after the page loaded.
//
// AND THE OPTIMIZER IS OFF ON ALL THREE, which is this file's own rule applied rather than
// restated: `next/image` refetches from the server WITHOUT the owner cookie, so a proxied path
// 401s. `GalleryOverlay` took an `unoptimizedImage` prop for it, so the public page keeps the
// optimizer and its `sizes` ladder on a published static path.
//
// Shared by BlockImageField and SettingsPhotoField because it is purely
// presentational — unlike their commit models, which genuinely differ and stay
// separate.
//
// ---- IT IS A PLATE, NOT A CHIP, AND THE HEADER ABOVE IS THE ARGUMENT ------------------
//
// This was a 36x36 chip. The first paragraph says the whole reason the component exists is
// that a content-addressed filename tells the owner nothing about which image is set — SO
// THE THUMB IS THE IDENTIFICATION. At 36px it identified almost nothing, which meant the
// component failed at the only job it has. Measured, the plate costs +88.9px per field,
// 5.8% more inspector scroll, and pushes ZERO fields below the fold at 900px or 700px.
//
// ---- THE ASPECT IS OPTIONAL, AND ABSENT MEANS "WHATEVER THE IMAGE IS" -----------------
//
// Each consumer takes its answer from THE PUBLIC RENDERER for that image, so the plate shows
// the author the shape that will actually ship. TYPE-CHECKING CORRECTED THE FIRST VERSION OF
// THIS: the plan said to read `value.aspect` for block images, but `aspect` belongs to
// `videoEmbed`, NOT `imageBlock` — tsc rejected it, and the correction is the better answer.
//
//   imageBlock     -> NO ASPECT. `BlogProse` renders it as a bare <img> inside `.blog-figure`
//                     with no ratio at all, so the image sizes itself. The plate does the
//                     same: omit the prop and it lets the image be its own shape, which is
//                     both the true derivation and a plate that never crops.
//   settings photo -> 3/4, a STATED DEFAULT rather than a derivation, because the public
//                     About column gives that image no ratio either — `.ab-img` is inset-0
//                     inside a flexible grid column. Justified by shipping evidence instead:
//                     the asset is 1536x2048 and the field's own placeholder says 900 x 1200.
//
// THE ONE PLACE A FALLBACK IS UNAVOIDABLE IS THE EMPTY STATE, and it is confined to exactly
// there. With no image there is no natural shape to adopt, and a zero-height plate is not a
// plate — so the placeholder reserves 16/9. That is a stated default for a case with nothing
// to derive from, not a house ratio leaking back in.
//
// A fixed 16/9 everywhere would have cropped the 3:4 portrait to a letterbox strip on the one
// surface where the author most needs to recognise the image.
import { useState } from "react";
import { IconImage } from "./icons";
import { draftImageUrl } from "@/lib/studio/draft-image";

/** Reserved height for the EMPTY plate only — see the header. Nothing else reads it. */
const EMPTY_PLATE_ASPECT = 16 / 9;

/**
 * THE PLATE IS A PREVIEW, SO IT IS CAPPED BY HEIGHT — AND THE CAP IS WHAT KEEPS IT ONE.
 *
 * MEASURED FAILURE THAT PUT THIS HERE. `w-full` alone is correct in the 320px inspector, where
 * the pane caps the plate at 254x143. In the SETTINGS panel the container is 967px wide, so
 * the same `w-full` at 3:4 produced a **941 x 1255px** plate that swallowed the entire panel.
 * The inspector had hidden the bug by being narrow.
 *
 * Capping the WIDTH would not fix it either, because the height a given width produces depends
 * on the aspect — the whole reason the aspect is per-call-site. So the cap is on HEIGHT, which
 * is the dimension that actually costs vertical rhythm and the dimension the whole layout
 * analysis was about, and the max WIDTH is derived from it: `height x ratio`.
 *
 * 160 is the measured blog plate (149.7px) taken up to the next ten, so the case that shipped first is
 * unaffected — at ~1.7 the derived max width is 272px against 254px available, and nothing
 * moves. Every other aspect now lands at the same visual weight instead of a different one.
 */
const MAX_PLATE_H = 160;

export default function ImageThumb({
  src,
  aspect,
  className = "",
}: {
  src: string | null;
  /** width / height. OMIT to let the image keep its own shape, which is what the public
   *  renderer does for `imageBlock`. See the header for the per-call-site derivation. */
  aspect?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Decorative: the path is rendered as text beneath it, so the image adds no
  // information a screen reader is missing.
  const showImage = src && !failed;

  return (
    <span
      className={`relative block overflow-hidden rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-200 ${className}`}
      style={{
        aspectRatio: String(aspect ?? (showImage ? "auto" : EMPTY_PLATE_ASPECT)),
        // Derived from the height cap, never written as a width — see MAX_PLATE_H. With no
        // aspect the ratio is unknown until the image loads, so the cap goes on the image
        // itself below and the plate simply wraps it.
        maxWidth: aspect ? MAX_PLATE_H * aspect : undefined,
        maxHeight: aspect ? undefined : MAX_PLATE_H,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- see the header note
        <img
          src={draftImageUrl(src)}
          alt=""
          loading="lazy"
          decoding="async"
          // TWO LAYOUTS, AND THE UNLAYERED RESET IS WELCOME IN ONE OF THEM.
          //
          // WITH an aspect the parent owns the box, so the image is taken out of flow and
          // sized by INSETS — never `h-full`, because the unlayered `img, video {height:auto}`
          // reset beats any layered height utility and the image would merely be clipped by
          // overflow-hidden, which looks close enough to hide the bug. Same form as the
          // ProjectsEditPanel plate; studio-cascade fails the build if this reverts.
          //
          // WITHOUT an aspect the image must GIVE the parent its height, so it stays in normal
          // flow — and here `height: auto` from that same reset is exactly what is wanted. The
          // rule that is a trap in one layout is the correct behaviour in the other, which is
          // why this is a branch rather than one clever class string.
          // `w-full` only in the natural case — NOT `block w-full`. The first draft had
          // `block`, and studio-cascade immediately reported it as INERT: the same
          // `img, video` reset already sets `display: block`, so the utility drives nothing.
          // The gate PR A built caught a redundant class in new code on its first exposure to
          // it, which is the whole point of reporting inert sites rather than only failures.
          // In the natural case the image also carries the height cap, because it is the thing
          // giving the plate its height. `object-contain` so a tall image shrinks rather than
          // crops — the natural branch exists precisely to avoid cropping.
          className={aspect ? "absolute inset-0 w-full object-cover" : "w-full object-contain"}
          style={aspect ? undefined : { maxHeight: MAX_PLATE_H }}
          onError={() => setFailed(true)}
        />
      ) : (
        // THE EMPTY PLATE IS COMPOSED, NOT LEFT BLANK. A 36px empty chip read as a control
        // awaiting input; a 143px empty plate reads as a hole unless it says what it is.
        // Icon plus label, centred, on the ladder's chrome step — the same pattern the
        // ProjectsEditPanel plate already uses for its own empty state.
        <span className="absolute inset-0 grid place-items-center gap-1 text-studio-text-subtle [&>svg]:size-4">
          <IconImage />
          <span className="text-[10px]">No image</span>
        </span>
      )}
    </span>
  );
}
