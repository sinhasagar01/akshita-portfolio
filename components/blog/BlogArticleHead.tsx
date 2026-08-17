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
    // ⚠ THE SPACING IS A COLUMN GAP AND NOT A MARGIN, BECAUSE A MARGIN HERE DRAWS NOTHING. The
    // sheet type roles declare `margin: 0` as a SHORTHAND and they are UNLAYERED, so any `mt-*` on
    // one is a class that reads as working and resolves to zero — measured, not reasoned: the first
    // draft of this head asked for 30px above the title and rendered the title's top edge one pixel
    // from the rule's baseline.
    //
    // A column gap cannot be overruled that way, because `gap` belongs to the PARENT and no role
    // declares it. It is also the convention this project already states — lay sibling groups out
    // with flex and `gap`, not per-element margins that silently collapse or double.
    //
    // The rule keeps a bottom margin because `.sheet-rule` declares no margin of its own, so that
    // one is live. 18px of gap throughout plus 12px under the rule is the 30 / 18 the head wants.
    <header
      id={canvas ? undefined : "blog-article-head"}
      className="flex flex-col gap-[clamp(12px,1.4vw,18px)] pt-11"
    >
      {/* THE META ROW BECOMES THE SECTION RULE, WHICH IS WHAT IT ALREADY WAS. Three tracked-caps
          fields in a wrapping flex row is a title block that had never been drawn as one, so the
          conversion adds an object line and changes nothing about what the head says.
          Topic left, because it is the identity of the sheet. Date and reading time right, because
          they are its issue data. That is the same left-identity, right-status split the rule
          carries on every case-study section, on the 404 and on the error boundary.

          ⚠ THE TOPIC IS OPTIONAL AND THE RULE COLLAPSES RATHER THAN INVENTING A WORD. With no
          topic there is no left mark, the line takes the whole slack, and the issue data sits
          right. All four published posts carry a topic, so this branch is latent — which is
          exactly the kind of branch that ships wrong, so it is a real state of one device rather
          than a fallback string nobody chose.

          ⚠ AND THE TWO RIGHT FIELDS ARE SEPARATE MARKS RATHER THAN ONE STRING JOINED BY A DOT,
          BECAUSE OF MOBILE. At the mark's wider tracking the worst case runs 31 characters, about
          257px, and the article measure at a 390px viewport is 342px wide. One joined mark
          overflows there. Two marks under `flex-wrap` each keep their own box and the second drops
          to a new row, and the row gap does the separating, which is what a title block does. */}
      <div className="sheet-rule mb-[clamp(2px,1vw,12px)] flex-wrap">
        {topic ? <span className="sheet-mark-text">{topic}</span> : null}
        <span className="sheet-rule-line" aria-hidden="true" />
        <span className="sheet-mark-text">{formatLongDate(date)}</span>
        <span className="sheet-mark-text">{readingTime} min read</span>
      </div>

      {/* ⚠ THE TITLE TAKES THE ROLE'S OWN 24ch MEASURE, AND THE OVERRIDE THAT WAS HERE WAS BOTH
          INERT AND UNNECESSARY. It asked for 30ch on the reasoning that the four published titles
          run 41 to 53 characters and the longest would set three lines of 40px type inside the
          article's 640px column. Two things were wrong with that. The role declares `max-width`
          and is unlayered, so the utility resolved to nothing — and the render sets the longest
          title in TWO lines at 24ch anyway, so there was no third line to prevent.

          A CHARACTER COUNT IS NOT A LINE COUNT. `ch` is the advance of the digit zero and the
          display face is proportional, so 53 characters of this title occupy about 41 zeroes. The
          arithmetic said three lines, the paint says two, and the paint is the authority. */}
      <h1 className="sheet-h2">{title}</h1>

      {dek ? <p className="sheet-lede">{dek}</p> : null}
    </header>
  );
}
