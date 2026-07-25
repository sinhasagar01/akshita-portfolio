// Blog PR 2 — a post's image slot: the hero image when set, else the typographic
// plate (the title in the display serif on a raised surface — never a hole). Used by
// both the featured slot and the stream cards. The plate is `.blog-plate` in globals.css.
import Image from "next/image";

export default function Shot({
  heroImage,
  title,
  sizes,
  priority = false,
  className = "",
}: {
  heroImage: string | null;
  title: string;
  /** next/image `sizes` — the slot's rendered width across breakpoints. */
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
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
          <span>{title}</span>
        </div>
      )}
    </div>
  );
}
