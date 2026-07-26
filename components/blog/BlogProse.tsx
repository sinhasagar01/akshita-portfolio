// Blog PR 2 — the flat-blocks renderer. A post's `blocks` is a flat array (no section
// shell), so this maps each block straight to its prose element inside the `.blog-prose`
// column. It reuses the case-study rich pipeline — `parseRich` (markers -> Rich) and
// `renderRich` (Rich -> React, with render-time href safety) — but NOT the case-study
// adapter (its adaptBlock is private and its output shape carries case-study concerns).
//
// FIVE KINDS: heading (an <h2>), richText (paragraphs with **bold**/*italic*/[links]),
// pullQuote (a <blockquote>), imageBlock (an inline <figure>) and videoEmbed.
//
// ---- THE DISPATCH IS A MAPPED TABLE, NOT A SWITCH, AND THAT IS THE POINT ---------------
//
// This used to be a `switch` with `default: return null`. That default is a SILENT HOLE: a
// kind present in the picker and the registry but missing here produces a block the author
// can add, fill in and save, which renders as NOTHING — and because the studio canvas and
// the public article are both this component, it looks consistent and correct in both. That
// is the failure that let `videoEmbed.poster` sit authorable and invisible for three PRs.
//
// A `satisfies never` in the default arm could not fix it. The discriminant arrives as
// `unknown` (this reads whatever is on disk), TypeScript cannot exhaustiveness-check a
// switch over `unknown`, and narrowing with `as BlogBlockKind` to reach a never arm defeats
// the check — it would compile forever and prove nothing.
//
// `{ [K in BlogBlockKind]: … }` makes a missing kind a REAL COMPILE ERROR, and it is the
// mechanism every other blog table already uses: BLOG_BLOCK_EMPTIES, BLOG_BLOCK_LABELS,
// BLOG_KIND_HAS_STYLE, BLOG_BLOCK_REGISTRY and the sanitizer's VALIDATORS are all mapped
// types for exactly this reason. A MAPPED TYPE FAILS COMPILATION; A Set JUST RETURNS FALSE.
//
// `RENDERABLE` in lib/studio/validate-blog-post.ts is deliberately NOT derived from this
// table. Its own comment is explicit that it asks what the renderer handles and that a
// disagreement between the two is a real bug it should SURFACE rather than inherit.
// Deriving it would launder exactly the disagreement it exists to catch, so ralph asserts
// the relationship instead and the type system does not paper over it.
import type { ReactNode } from "react";
import { parseRich } from "@/lib/case-studies/adapter";
import { renderRich } from "@/components/case-study/rich";
import type { BlogBlockKind, BlogRawBlock, BlogRawValue } from "@/lib/blog/blocks-raw";

/** Rewrite an image `src` before it is rendered.
 *
 *  THE ONLY WAY THE TWO SURFACES DIVERGE, and it is an attribute value on the same element,
 *  never a different element — box geometry is identical, so the parity rule holds. The
 *  studio canvas passes `makeDraftSrcRewriter(draftImages)` so an image uploaded to the
 *  draft branch resolves through the owner-gated proxy instead of 404ing against main; the
 *  public article passes nothing. Defaulting to identity rather than taking an `editable`
 *  boolean is deliberate: a boolean invites unrelated behaviour to accrete behind it. */
type RewriteSrc = (src: string) => string;

const identity: RewriteSrc = (src) => src;

function VideoEmbed({ value, rewriteSrc }: { value: BlogRawValue<"videoEmbed">; rewriteSrc: RewriteSrc }) {
  // Same per-block defensiveness as the table below: `src` is typed a string but is
  // read off disk, and `.trim()` on a non-string throws at build.
  const src = text(value.src).trim();
  if (src === "") return null;
  const aspect = Number(value.aspect);
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const poster = text(value.poster?.src);
  return (
    <figure className="my-[2.3em]">
      <div
        className="relative w-full overflow-hidden rounded-[10px] border border-ink-950/8"
        style={{ aspectRatio: String(ratio) }}
      >
        {/* THE POSTER, FINALLY READ. It has been in the schema since #171, uploadable
            since #172 and validated since #173, and no reader showed it — which is why the
            blog form hid it. Rendered BEFORE the iframe so ordinary stacking puts the embed
            on top: the still shows while the embed loads and is covered once it paints,
            which is the whole job of a poster. Decorative — the caption and the iframe
            title carry the meaning, so an empty alt is correct. */}
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rewriteSrc(poster)}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <iframe
          src={src}
          title={text(value.title) || "Embedded video"}
          loading="lazy"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {text(value.caption) ? (
        <figcaption className="mt-[11px] text-[13px] leading-[1.55] text-ink-600">
          {renderRich(parseRich(text(value.caption)))}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** The inline figure.
 *
 *  A PLAIN <img>, NOT next/image, and the proxy forces it: the optimizer refetches the URL
 *  from the server WITHOUT the owner cookie, so an optimized proxy URL 401s in the canvas
 *  (ImageThumb records the same finding). next/image would also wrap the element in some
 *  configurations, which is the editable-only-wrapper failure mode. One component rendering
 *  both surfaces is worth more than optimizing body images on a blog with few figures.
 *  Explicit width/height would need intrinsic dimensions the schema does not carry, so
 *  aspect is left to the CSS and `loading="lazy"` keeps it off the critical path.
 *
 *  `alt=""` FOR A DECORATIVE IMAGE is the correct HTML — an empty alt tells a screen reader
 *  to skip it, whereas omitting the attribute makes it announce the filename. */
function ImageBlock({ value, rewriteSrc }: { value: BlogRawValue<"imageBlock">; rewriteSrc: RewriteSrc }) {
  const src = text(value.src).trim();
  if (src === "") return null;
  const caption = text(value.caption);
  return (
    <figure className={value.wide ? "blog-figure blog-figure-wide" : "blog-figure"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={rewriteSrc(src)} alt={value.decorative ? "" : text(value.alt)} loading="lazy" />
      {caption ? <figcaption>{renderRich(parseRich(caption))}</figcaption> : null}
    </figure>
  );
}

/** Render a value only when it is actually a string. The types say these are strings,
 *  but the types describe the SCHEMA and this renders whatever is on disk — see the
 *  defensiveness note on the component below. */
const text = (v: unknown): string => (typeof v === "string" ? v : "");

/** Kind -> renderer. Exhaustive by construction; see the header. */
const RENDERERS: {
  [K in BlogBlockKind]: (v: BlogRawValue<K>, key: number, rewriteSrc: RewriteSrc) => ReactNode;
} = {
  heading: (v, i) => <h2 key={i}>{text(v.text)}</h2>,
  richText: (v, i) =>
    Array.isArray(v.paragraphs)
      ? v.paragraphs.map((p, j) => <p key={`${i}-${j}`}>{renderRich(parseRich(text(p)))}</p>)
      : null,
  pullQuote: (v, i) => <blockquote key={i}>{renderRich(parseRich(text(v.text)))}</blockquote>,
  imageBlock: (v, i, rewriteSrc) => <ImageBlock key={i} value={v} rewriteSrc={rewriteSrc} />,
  videoEmbed: (v, i, rewriteSrc) => <VideoEmbed key={i} value={v} rewriteSrc={rewriteSrc} />,
};

export default function BlogProse({
  blocks,
  rewriteSrc = identity,
}: {
  blocks: unknown;
  rewriteSrc?: RewriteSrc;
}) {
  const list: BlogRawBlock[] = Array.isArray(blocks) ? (blocks as BlogRawBlock[]) : [];
  return (
    <div className="blog-prose">
      {list.map((block, i) => {
        // BS-3b — PER-BLOCK DEFENSIVENESS. Honest scope: this is INSURANCE, not a gate
        // with a currently-reachable failure behind it.
        //
        // It was added believing a malformed block could reach here and throw. Probing
        // proved otherwise: every path to this component goes through a Keystatic reader
        // (createReader public, createGitHubReader draft), which validates against the
        // schema and COERCES what it accepts — a null block, a missing paragraphs key and
        // a null value all arrive already normalised, and the shapes it will not coerce
        // it THROWS on, upstream of here, before this renders at all. Verified by
        // reverting these guards and re-rendering the same fixtures: still fine.
        //
        // Kept anyway because it is free and the assumption it protects is load-bearing:
        // "the reader always normalises" is a property of Keystatic, not of this repo,
        // and a schema loosened to an optional field would quietly change it. Degrading
        // (skip the block) is the right failure either way. Do NOT cite this as the
        // reason a malformed post is safe — the reader is that reason.
        if (block === null || typeof block !== "object") return null;
        const value: unknown = (block as { value?: unknown }).value;
        if (value === null || typeof value !== "object") return null;

        const kind = (block as { discriminant?: unknown }).discriminant;
        // hasOwnProperty, never `in`: the discriminant is read off disk, and
        // `"constructor" in RENDERERS` is true on any plain object.
        if (typeof kind !== "string" || !Object.prototype.hasOwnProperty.call(RENDERERS, kind)) {
          return null;
        }
        // The cast is confined to this one line and is load-bearing nowhere: the table's
        // exhaustiveness is proven by its mapped type at the declaration, not here.
        const render = RENDERERS[kind as BlogBlockKind] as (
          v: unknown,
          key: number,
          rewriteSrc: RewriteSrc
        ) => ReactNode;
        return render(value, i, rewriteSrc);
      })}
    </div>
  );
}
