// Blog PR 2 — the flat-blocks renderer. A post's `blocks` is a flat array (no section
// shell), so this maps each block straight to its prose element inside the `.blog-prose`
// column. It reuses the case-study rich pipeline — `parseRich` (markers -> Rich) and
// `renderRich` (Rich -> React, with render-time href safety) — but NOT the case-study
// adapter (its adaptBlock is private and its output shape carries case-study concerns).
//
// Four kinds only: heading (an <h2>, the PR-2 schema delta), richText (paragraphs with
// **bold**/*italic*/[links]), pullQuote (a <blockquote>), and videoEmbed (dormant in
// PR 2 — no authored post uses it, but the kind exists so it renders rather than crashes).
import { parseRich } from "@/lib/case-studies/adapter";
import { renderRich } from "@/components/case-study/rich";
import type { BlogRawBlock, BlogRawValue } from "@/lib/blog/blocks-raw";

function VideoEmbed({ value }: { value: BlogRawValue<"videoEmbed"> }) {
  // Same per-block defensiveness as the switch below: `src` is typed a string but is
  // read off disk, and `.trim()` on a non-string throws at build.
  const src = text(value.src).trim();
  if (src === "") return null;
  const aspect = Number(value.aspect);
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  return (
    <figure className="my-[2.3em]">
      <div
        className="relative w-full overflow-hidden rounded-[10px] border border-ink-950/8"
        style={{ aspectRatio: String(ratio) }}
      >
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

/** Render a value only when it is actually a string. The types say these are strings,
 *  but the types describe the SCHEMA and this renders whatever is on disk — see the
 *  defensiveness note on the component below. */
const text = (v: unknown): string => (typeof v === "string" ? v : "");

export default function BlogProse({ blocks }: { blocks: unknown }) {
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
        const v = value as Record<string, unknown>;

        switch ((block as { discriminant?: unknown }).discriminant) {
          case "heading":
            return <h2 key={i}>{text(v.text)}</h2>;
          case "richText":
            return Array.isArray(v.paragraphs)
              ? v.paragraphs.map((p, j) => (
                  <p key={`${i}-${j}`}>{renderRich(parseRich(text(p)))}</p>
                ))
              : null;
          case "pullQuote":
            return <blockquote key={i}>{renderRich(parseRich(text(v.text)))}</blockquote>;
          case "videoEmbed":
            return <VideoEmbed key={i} value={v as BlogRawValue<"videoEmbed">} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
