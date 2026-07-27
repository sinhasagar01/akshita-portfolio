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
//      draft branch or main, at the cost of a GitHub round trip per image. A 36px thumbnail
//      can afford that; that is the entire justification.
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
// Shared by BlockImageField and SettingsPhotoField because it is purely
// presentational — unlike their commit models, which genuinely differ and stay
// separate.
import { useState } from "react";
import { IconImage } from "./icons";
import { draftImageUrl } from "@/lib/studio/draft-image";

export default function ImageThumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  // Decorative: the path is rendered as text beside it, so the image adds no
  // information a screen reader is missing.
  const showImage = src && !failed;

  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded border border-ink-950/12 bg-cream-50 text-ink-400 [&>svg]:size-3.5">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- see the header note
        <img
          src={draftImageUrl(src)}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <IconImage />
      )}
    </span>
  );
}
