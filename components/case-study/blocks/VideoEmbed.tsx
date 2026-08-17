"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import type { VideoEmbed as VideoEmbedBlock } from "@/lib/case-studies/types";
import { renderRich } from "../rich";

/**
 * VE-2 — the final-design video section.
 *
 * ONE component, two frames. `browser` (the chosen Variation B) puts the video in the
 * same window chrome the wide DeviceImage frames use; `plain` (Variation A) is the
 * bare card with a radius. They are a branch rather than two block kinds because the only
 * difference is the chrome — the eyebrow, title, caption, aspect and every safety rule
 * are shared, and splitting them would mean keeping two of everything in step.
 *
 * THE CHROME IS THE PROJECT'S, NOT THE MOCK'S. `fosfor-video-section-browser.html`
 * draws a dark macOS window with red/amber/green traffic lights, which is a fine way
 * to say "browser" in a flat mock and wrong here: every other framed screenshot in a
 * case study sits in the cream chrome from DeviceImage's WideFrame. Two window
 * treatments on one page would read as two systems. The mock supplied the STRUCTURE —
 * chrome bar, dots, url pill, video beneath at aspect — and the tokens supply the look.
 *
 * The video is an EXTERNALLY HOSTED URL (VE-1's locked decision), so the src is
 * re-checked here. The parser and the sanitiser both gate it already; this is the
 * third place, for the same reason the link mark has three — a render-time check is
 * the last thing standing between a bad scheme and the DOM, and it is the only one
 * that sees hand-authored content that never passed through the editor.
 */
export default function VideoEmbed({
  src,
  poster,
  caption,
  frame,
  aspect,
  eyebrow,
  title,
}: Omit<VideoEmbedBlock, "kind">) {
  const reduce = useReducedMotion();

  // http(s) only. A <video> needs a fetchable media URL, so unlike the link mark there
  // is no mailto or site-relative case to allow. Anything else — including the empty
  // src a block is born with — renders NO <video> at all: the poster still shows if
  // there is one, so a half-authored block reads as "video coming" instead of a broken
  // player or, worse, an unsafe source.
  // The strip is written with ESCAPES, not the characters themselves: a raw control
  // byte in source makes git classify the whole file as binary, which costs every
  // diff, blame and review of it. Same range and spelling as isSafeHref in adapter.ts.
  const playable = /^https?:\/\//i.test(src.trim().replace(/[\s\u0000-\u0020]/g, ""));

  // The accessible name. A <video> with no text alternative is an unlabelled control;
  // the title is the natural label, the caption the fallback, and the generic string
  // only if the block carries neither.
  const label = title ?? (typeof caption === "string" ? caption : undefined) ?? "Prototype walkthrough";

  const media = (
    <div className="relative w-full bg-cream-100" style={{ aspectRatio: aspect }}>
      {playable ? (
        <video
          // REDUCED MOTION: a muted loop is still motion, and an autoplaying one is
          // exactly the kind a motion-sensitive reader cannot escape. Under the
          // preference the poster stands in and `controls` gives a play affordance, so
          // the content is reachable on purpose rather than unavailable.
          key={reduce ? "reduced" : "motion"}
          src={src}
          poster={poster?.src as string | undefined}
          aria-label={label}
          // The video carries the ASPECT ITSELF rather than stretching to fill an
          // absolutely-positioned box. A <video> with a poster takes that poster's
          // intrinsic ratio whenever its height is not explicitly resolved, so the
          // element grew to the still's shape (1060x754 for a 16/9 slot) and was
          // silently cropped by the frame's overflow. Owning the ratio makes the box
          // the authored one whatever the poster happens to be.
          style={{ aspectRatio: aspect }}
          className="block w-full object-cover"
          playsInline
          muted
          loop
          autoPlay={!reduce}
          controls={Boolean(reduce)}
          preload={reduce ? "metadata" : "auto"}
        />
      ) : poster ? (
        // No usable source, but a poster exists — show the still rather than a gap.
        <Image
          src={poster.src}
          alt={poster.alt}
          fill
          sizes="(max-width: 1023px) 90vw, 760px"
          className="object-cover"
          unoptimized={poster.unoptimized}
        />
      ) : null}
    </div>
  );

  return (
    <div className="reveal-card">
      {eyebrow && (
        <p className="text-eyebrow tracking-eyebrow uppercase font-semibold text-accent-500">
          {eyebrow}
        </p>
      )}
      {title && (
        <h3 className="font-display text-4xl font-normal text-text-primary leading-[1.05] tracking-snug mt-2">
          {title}
        </h3>
      )}

      <div className="mt-6">
        {frame === "browser" ? (
          <div className="overflow-hidden rounded-xl border border-ink-950/10 bg-cream-50 drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)]">
            {/* Window chrome — decorative, and the same shape WideFrame draws, so a
                video and a screenshot read as the same kind of object on the page. */}
            <div
              aria-hidden
              className="flex items-center gap-1.5 border-b border-ink-950/8 bg-cream-100 px-3.5 py-2.5"
            >
              <span className="size-2.5 rounded-full bg-ink-950/15" />
              <span className="size-2.5 rounded-full bg-ink-950/15" />
              <span className="size-2.5 rounded-full bg-ink-950/15" />
              <span className="ml-3 h-4 w-full max-w-[240px] rounded-full bg-ink-950/5" />
            </div>
            {media}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-950/8 drop-shadow-[0_18px_40px_rgba(33,28,22,0.16)]">
            {media}
          </div>
        )}
      </div>

      {/* The caption stays VISIBLE rather than becoming the video's only label: it is
          content, and a reader who cannot hear or play the clip still gets the sentence. */}
      {(caption || playable) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.9375rem] text-text-secondary leading-relaxed max-w-[68ch]">
            {caption ? renderRich(caption) : null}
          </p>
          {playable && !reduce && (
            <span className="inline-flex shrink-0 items-center gap-1.5 border border-ink-950/8 bg-cream-50 px-2.5 py-1 text-eyebrow uppercase tracking-eyebrow text-ink-600">
              <span aria-hidden className="size-1.5 rounded-full bg-accent-500" />
              Loops · muted
            </span>
          )}
        </div>
      )}
    </div>
  );
}
