// Blog PR 2 — a post's image slot: the hero image when set, else the typographic
// plate on a raised surface (never a hole). Used by both the featured slot and the
// stream cards. The plate is `.blog-plate` in globals.css.
//
// ---- ⚠ THE PLATE CARRIES THE TOPIC, NOT THE TITLE, AND #376 IS WHY -------------------------
//
// It set the post's TITLE in the display serif. That was correct while it was a fallback
// nothing used — and `.blog-plate` had never drawn on this site, because all three posts
// carried a hero image. #376 unset two of them and the plate rendered for the first time,
// beside a card that ALSO shows its title. THE TITLE READ TWICE, ADJACENT.
//
// Not a defect introduced by that PR. It is what a title-plate does, and it was invisible for
// as long as nothing used one — the same shape as an assertion that has never had a subject.
//
// ⚠ AND THE REPLACEMENT ADDS INFORMATION RATHER THAN REMOVING IT. `topic` is rendered on the
// ARTICLE (BlogArticleHead's eyebrow, and the vessel's readout) and NOWHERE on the index — the
// featured card shows "Latest · date" and the stream cards show date and reading time. So the
// index gains a field it never carried, in the slot that was repeating one it already had.
import Image from "next/image";

export default function Shot({
  heroImage,
  title,
  topic,
  sizes,
  priority = false,
  className = "",
}: {
  heroImage: string | null;
  /** Still required — it is the image's alt text when a hero IS set. */
  title: string;
  /** The eyebrow the plate draws. Empty is tolerated: the plate falls back to the title
   *  rather than rendering an empty box, because a post with no topic is a content state
   *  the schema permits and a blank plate is worse than a repeated word. */
  topic: string;
  /** next/image `sizes` — the slot's rendered width across breakpoints. */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const plateText = topic.trim() || title;
  return (
    <div className={`relative overflow-hidden bg-cream-100 ${className}`}>
      {heroImage ? (
        <Image
          src={heroImage}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="blog-plate">
          <span>{plateText}</span>
        </div>
      )}
    </div>
  );
}
