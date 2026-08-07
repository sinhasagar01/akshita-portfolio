// The blog post's head — meta row, title and dek — rendered by BOTH the public article and
// the studio canvas. The third shared piece, after BlogProse (#187) and BlogHero (#190).
//
// SAME REASON AS BlogHero: /dev/blog-parity renders components, so a head written inline in
// the page and again in the panel would be structurally unseen by the harness, which
// would go on reporting a clean pass. Sharing it is what makes it gateable.
//
// ------------------------------------------------------------------------- PREVIEW ONLY
// Nothing here is contenteditable, and that is a decision rather than an omission. Of the
// five things the head shows, only two could ever take an inline edit:
//
//   title        EDITABLE — in the INSPECTOR, not here. The old note in this slot claimed it
//                was the slug and would 400 on the first keystroke. That was FALSE and #216
//                fixed it: the slug is the FILENAME, `title` is an ordinary frontmatter key,
//                and editing it moves nothing the URL/images/loves key on. It is a normal
//                inspector field now, previewed here like dek and topic. (A SLUG rename — new
//                file, moved images, a 404 on the old URL under dynamicParams = false — is a
//                different, still-deferred arc, and is not what editing the title does.)
//                It is not INLINE-editable in the canvas for the same reason nothing here is:
//                the head is preview-only, per the decision below.
//   readingTime  COMPUTED from the blocks. There is nothing to edit.
//   date         STORED as `2026-07-24`, RENDERED as `24 JULY 2026`. Editing the rendered
//                text would mean parsing a display format back to ISO, and a bad parse
//                writes a wrong date rather than failing loudly. It stays in the inspector,
//                where the field holds the stored form and ISO_DATE validates it.
//   dek, topic   Plain strings, and the only two that could be inline.
//
// A head where two of five fields are editable would teach the wrong rule — the dashed
// outline would appear on some text and not on other text with no visible logic. So none of
// it is editable, and the inspector stays the one place the head is written.
//
// THE ID IS ARTICLE-ONLY. ReadingVessel does `document.getElementById("blog-article-head")`,
// and the parity harness renders both sides on ONE page, so an unconditional id would put a
// duplicate in the document and hand getElementById whichever came first. Conditioning it is
// an ATTRIBUTE difference on an element that exists on both sides — the same shape as
// rewriteSrc, and never a different element.
import { formatLongDate } from "@/lib/blog/format";

export default function BlogArticleHead({
  date,
  readingTime,
  topic,
  title,
  dek,
  canvas = false,
}: {
  date: string;
  /** Computed from the blocks. The article gets it from the reader; the canvas recomputes it
   *  live, so it tracks what the author is writing rather than showing a stale build value. */
  readingTime: number;
  topic: string;
  title: string;
  dek: string;
  /** Studio canvas only. Drops the `id` (see the header) and nothing else. */
  canvas?: boolean;
}) {
  return (
    <header id={canvas ? undefined : "blog-article-head"} className="pt-11">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] uppercase tracking-[0.13em] text-text-secondary">
        <span>{formatLongDate(date)}</span>
        <span>{readingTime} min read</span>
        {topic ? <span>{topic}</span> : null}
      </div>
      <h1 className="mt-[18px] font-display text-[clamp(2.25rem,5vw,3.125rem)] font-normal leading-[1.06] tracking-[-0.018em] text-text-primary">
        {title}
      </h1>
      {dek ? (
        <p className="mt-[18px] font-display text-xl leading-[1.55] text-text-lead">{dek}</p>
      ) : null}
    </header>
  );
}
