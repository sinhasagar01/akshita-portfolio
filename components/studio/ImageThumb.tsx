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
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded border border-ink-950/8 bg-cream-50 text-ink-400 [&>svg]:size-3.5">
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
