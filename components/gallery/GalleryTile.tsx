// One masonry tile. A button, because clicking it opens a dialog rather than navigating.
//
// ---- ⚠ THE INTRINSIC SIZE IS THE WHOLE POINT OF THIS COMPONENT ------------------------------
//
// `columns` masonry cannot place a tile until it knows the tile's height, and it does not know
// that until the image decodes — so a masonry built from images with no declared size REFLOWS on
// load, every load, and the reflow is proportional to how many images are above the fold. That is
// the layout-shift half of the contract's own caveat that "a real gallery is the heaviest page on
// the site by an order of magnitude".
//
// `width` and `height` come from the collection, where the upload route wrote them from the bytes
// it committed. They are REQUIRED at publish (`galleryPublishBlockers` refuses a zero), so a
// published tile always has them and the column height is known before a single byte of image
// arrives. The aspect box below is what turns that into reserved space.
import Image from "next/image";
import type { GalleryItem } from "@/lib/keystatic";

export default function GalleryTile({
  item,
  /** Index in the CURRENT filtered order, handed back on click. The overlay browses the filtered
   *  set, not the whole collection — see `GalleryBrowser` for why that is the contract. */
  index,
  onOpen,
  /** The first few tiles are the LCP candidates and opt out of lazy loading. Everything else stays
   *  lazy, which is what keeps the initial transfer to the top of the page. */
  priority,
}: {
  item: GalleryItem;
  index: number;
  onOpen: (index: number) => void;
  priority: boolean;
}) {
  if (!item.image) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      /* ⚠ THE ACCESSIBLE NAME IS THE ALT PLUS THE VERB, because the alt alone describes the
         picture and says nothing about what the control does. A screen-reader user hearing only
         "a wide beach at low tide" has no idea it is actionable. */
      aria-label={`${item.alt || item.title} — open larger`}
      /* A box around content, so it loses its corner on the radius ruling — the same corner the
         work cards, the blog cards and the prose figures lost. */
      className="gallery-tile group relative mb-3.5 block w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 text-left"
      style={{
        /* ⚠ `aspect-ratio` FROM THE STORED PIXELS, AS AN INLINE STYLE, because the value is per
           item and a utility class cannot carry a number computed from content. This is what
           reserves the column height before decode — without it the browser has no box until the
           image arrives and every tile below jumps. */
        aspectRatio: `${item.width} / ${item.height}`,
      }}
    >
      {/* ⚠ `fill`, AND A HEIGHT UTILITY HERE DRAWS NOTHING — `cascade-public` C1 CAUGHT IT. The
          unlayered `img, video` reset sets `height: auto`, which beats any layered utility, so a
          full-height class on this element is inert exactly as the display and max-width ones are.
          `fill` is not a workaround for that: Next writes it as an INLINE style, which is the only
          thing that outranks an unlayered reset, and it is the correct tool anyway — the wrapper
          above declares the aspect box and this image's job is to cover it.

          The three inert classes that came off with it were `block`, `h-auto` and `max-w-full`,
          every one of them asking for something the same reset already draws. */}
      <Image
        src={item.image}
        alt={item.alt}
        fill
        /* The rendered width is a column of the masonry, not the viewport — four columns above the
           site's breakpoint and two below, so the served file is roughly a quarter or a half of the
           page width rather than all of it. */
        sizes="(max-width: 1023px) 50vw, 25vw"
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      {/* THE CAPTION IS HOVER AND FOCUS, NOT HOVER ALONE. A keyboard reader tabbing the grid gets
          the same information a pointer user gets, which is the same rule the case-study preview
          badge follows. */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1.5 bg-[linear-gradient(to_top,var(--color-band-dark),transparent)] px-3.5 pb-3 pt-9 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <span className="block truncate text-[13px] font-medium text-on-dark">{item.title}</span>
      </span>
    </button>
  );
}
