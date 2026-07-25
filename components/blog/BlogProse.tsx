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
  const src = (value.src ?? "").trim();
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
          title={value.title || "Embedded video"}
          loading="lazy"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {value.caption ? (
        <figcaption className="mt-[11px] text-[13px] leading-[1.55] text-ink-600">
          {renderRich(parseRich(value.caption))}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function BlogProse({ blocks }: { blocks: unknown }) {
  const list: BlogRawBlock[] = Array.isArray(blocks) ? (blocks as BlogRawBlock[]) : [];
  return (
    <div className="blog-prose">
      {list.map((block, i) => {
        switch (block.discriminant) {
          case "heading":
            return <h2 key={i}>{block.value.text}</h2>;
          case "richText":
            return block.value.paragraphs.map((p, j) => (
              <p key={`${i}-${j}`}>{renderRich(parseRich(p))}</p>
            ));
          case "pullQuote":
            return <blockquote key={i}>{renderRich(parseRich(block.value.text))}</blockquote>;
          case "videoEmbed":
            return <VideoEmbed key={i} value={block.value} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
