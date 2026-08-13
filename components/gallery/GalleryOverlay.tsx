// The gallery overlay — one item, full-bleed, with its metadata rail.
//
// ---- ⚠ IT IS PRESENTATIONAL, AND THAT IS WHAT MAKES THE CANVAS HONEST ------------------------
//
// This component takes an item and draws it. It owns no dialog, no key handling, no focus trap
// and no index — the public page will wrap it in those, and the studio canvas renders it bare.
// That split is the case study's `SectionRenderer` rule arriving in a second collection: the
// editor and the reader must see the same pixels, and the only way to guarantee that is for both
// to call the same function.
//
// ⚠ THE ALTERNATIVE WAS A STUDIO-ONLY "PREVIEW" COMPONENT, and it is the failure this repository
// has already paid for once. `/studio/projects/[slug]/body` was a second copy of an editor that
// nothing linked to, and being unreachable is exactly how it drifted — it kept receiving fixes the
// real editor never got. A preview that approximates the reader's view is the same shape with a
// shorter fuse, because nobody notices an approximation getting worse.
//
// ---- ⚠ WHY THE CANVAS SHOWS THIS AND NOT THE TILE ---------------------------------------------
//
// The gallery editor's inspector edits alt, tags, description and the optional case-study link.
// EVERY ONE OF THOSE RENDERS HERE AND NONE RENDERS ON THE TILE. A canvas showing the masonry tile
// would show none of what the inspector changes, so an author would edit four fields and watch a
// picture that cannot move. The tile's only editable-relevant property is its aspect ratio, and
// that is machine-written from the upload — better stated as a read-only figure in the panel than
// drawn as a picture nobody can adjust.
//
// ---- ⚠ THE CHROME IS DARK ON EVERY PALETTE, WHICH IS A DECISION AND NOT A LEAK ----------------
//
// The contract draws the overlay dark and says so in its own caveat: "the dark chrome is a second
// visual language on a site that themes everything". It is kept, because the subject is a
// photograph and a photograph wants a neutral surround rather than a tinted one — the same
// argument that put the favicon on a neutral ground rather than a themed one. It is expressed in
// ROLE tokens (`band-dark`, `on-dark`, `on-dark-muted`) rather than raw values, so a dark palette
// still resolves it through the ground layer instead of painting a second hard-coded black.
import Image from "next/image";
import { GALLERY_OVERLAY_STACK_PX } from "@/lib/studio/three-pane";

/** What the overlay draws. A structural subset of `GalleryItem`, declared here rather than
 *  imported whole, so this component cannot quietly start depending on a field it does not
 *  render — which is how the tile and the overlay would drift into needing the same shape. */
export type GalleryOverlayItem = {
  title: string;
  kind: string;
  image: string | null;
  width: number;
  height: number;
  alt: string;
  description: string;
  tags: readonly string[];
  caseStudy: string | null;
};

/** The kind enum's reader-facing names. The enum itself is three short machine tokens because it
 *  is a filter value and a file field; this is the only place they become English. */
const KIND_LABEL: Record<string, string> = {
  photo: "Photograph",
  illus: "Illustration",
  proj: "Product study",
};

/** A pixel pair as a ratio an author recognises. Two decimals, because 3:2 and 1.5 are the same
 *  fact and only one of them survives an unusual crop. */
function aspectLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "—";
  return `${(width / height).toFixed(2)}:1`;
}

export default function GalleryOverlay({
  item,
  /** Rendered without the arrow columns. The studio canvas passes this because it shows ONE item
   *  and has a list pane of its own; the public page leaves it off and gets the browse controls.
   *  It removes CONTROLS, never layout: the grid keeps its columns so the stage width an author
   *  previews is the stage width a reader gets. */
  staticView = false,
  /** The stage's left and right controls, supplied by whatever owns the index. Absent in the
   *  studio, so the columns render empty rather than collapsing. */
  onPrev,
  onNext,
  indexLabel,
}: {
  item: GalleryOverlayItem;
  staticView?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  indexLabel?: string;
}) {
  const specs: [string, string][] = [
    ["KIND", KIND_LABEL[item.kind] ?? "Unset"],
    ["ASPECT", aspectLabel(item.width, item.height)],
    ["SOURCE", item.width > 0 && item.height > 0 ? `${item.width} × ${item.height}` : "—"],
    ["LINKED", item.caseStudy ?? "—"],
  ];

  return (
    <div
      data-gallery-overlay
      className="flex h-full min-h-0 w-full flex-col bg-band-dark text-on-dark"
      /* The stacking width, from the ONE constant the canvas floor also reads. A container query
         rather than a viewport query, because in the studio this box is a pane and not the page —
         a `lg:` breakpoint here would key off the window and show the desktop form inside a narrow
         canvas, which is the parity break this whole component exists to avoid. */
      style={{ containerType: "inline-size" }}
    >
      <div className="flex flex-none items-center gap-3.5 px-5 py-4">
        <span className="font-mono text-[10.5px] tracking-[0.18em] text-on-dark-muted">
          {indexLabel ?? (item.title || "Untitled").toUpperCase()}
        </span>
      </div>

      {/* THE STAGE. Four columns at the desktop form, one at the stacked form — see the container
          query below. `min-h-0` on every level, because a grid row defaults to `min-content` and
          an image inside it would push the row past the pane instead of fitting inside it. */}
      <div className="gallery-stage min-h-0 flex-1 px-3 pb-3">
        <div className="flex items-center justify-center">
          {!staticView && onPrev ? (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous item"
              className="rounded-full border border-on-dark/20 px-3 py-2 font-mono text-[12px] text-on-dark"
            >
              ←
            </button>
          ) : null}
        </div>

        <div className="flex h-full min-h-0 items-center justify-center">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.alt}
              width={item.width || 1600}
              height={item.height || 1200}
              /* ⚠ `next/image` HERE AND A PLAIN `<img>` IN THE CASE-STUDY PREVIEW, and the
                 difference is who chooses the scale. That overlay zooms, so an optimiser sizing to
                 a layout slot works against it. This one fits a slot and never zooms, which is
                 exactly the case the optimiser is for. */
              className="h-auto max-h-full w-auto max-w-full rounded-[10px] object-contain"
            />
          ) : (
            <p className="rounded-[10px] border border-dashed border-on-dark/25 px-6 py-10 text-center font-mono text-[11px] text-on-dark-muted">
              No image uploaded yet
            </p>
          )}
        </div>

        <div className="gallery-rail min-w-0 self-center px-[22px]">
          {/* ⚠ THE LEVEL CARRIES THE FACE AND NO FAMILY UTILITY APPEARS HERE, WHICH IS TWO
              FINDINGS FROM `cascade-public` RATHER THAN A STYLE CHOICE.

              FIRST: this was a lower heading level carrying a display-family utility, and the
              utility drew NOTHING. The lower levels take the body family from an UNLAYERED reset,
              which beats anything in `@layer utilities`. The top two levels take the display
              family from their own unlayered reset, so moving the level lands the face with no
              class at all — and the level is the more correct one anyway, since this is the top
              heading of an overlay that has no `h1`.

              SECOND, AND IT COST A ROUND: the note explaining the first finding NAMED the tag and
              the class, and the census reads `.tsx` prose — so the comment describing the dead
              utility BECAME one, and the count went up rather than down. That is this project's
              explaining-it-requires-writing-it defect, which is why nothing above is transcribed.

              THE WEIGHT IS THE RESET'S, deliberately. The unlayered rule that hands over the face
              also fixes the weight, so a weight utility here is inert for the same reason the
              family one was. The contract draws this heavier; the face is what carries a display
              title, and one unlayered re-assert for one heading is not worth a new global rule. */}
          <h2 className="m-0 text-[26px] tracking-[-0.035em] text-on-dark">
            {item.title || "Untitled"}
          </h2>
          {item.description ? (
            <p className="mt-3 text-[13.5px] leading-[1.65] text-on-dark-muted">{item.description}</p>
          ) : null}

          {item.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-on-dark/20 px-2.5 py-[5px] font-mono text-[8.5px] uppercase tracking-[0.16em] text-on-dark-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* THE SPECS ARE READ-ONLY EVERYWHERE, INCLUDING HERE. They are the machine-written
              half of the item, and drawing them beside the authored half is what makes the
              distinction visible to whoever is editing. */}
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-on-dark/15 pt-4">
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-on-dark-muted">
                  {label}
                </dt>
                <dd className="m-0 font-mono text-[11px] text-on-dark">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex items-center justify-center">
          {!staticView && onNext ? (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next item"
              className="rounded-full border border-on-dark/20 px-3 py-2 font-mono text-[12px] text-on-dark"
            >
              →
            </button>
          ) : null}
        </div>
      </div>

      {/* ⚠ A CONTAINER QUERY, BECAUSE THIS IS ONE COMPONENT IN TWO CONTEXTS. That is the whole
          reason, and it is a stronger one than the site's breakpoint convention it might look like
          it is arguing with.

          THE TWO CONTEXTS. The same node renders as a PUBLIC DIALOG, where its box is the viewport,
          and as the STUDIO CANVAS PANE, where its box is a pane inside a much wider window. A media
          query answers "how big is the window", and in exactly one of those two contexts that is
          not the question. There is no window width at which the right answer is right for both:
          in the studio the canvas runs roughly 832 to 1100px inside a window well over 1024, so a
          `lg:` rule would render the desktop form at every canvas width — including ones it does
          not fit — and the stacked form would never appear in the editor at all. The author would
          be previewing a layout by luck, which is precisely the parity failure this component's
          shared-node design exists to prevent.

          A container query asks "how big is MY box", which is the same question in both contexts.
          The component does not need to know which one it is in, and that is what makes one node
          serving two consumers correct rather than merely convenient.

          ⚠ SO THIS IS NOT A SECOND SITE BREAKPOINT, AND THE SITE'S ONE-BREAKPOINT RULE IS
          UNTOUCHED. That rule governs when the SITE goes mobile, and it is a statement about the
          viewport. 832 governs one grid inside one box, is derived in `three-pane.ts` from the
          contract's own chrome, and nothing else on any page reads it. globals.css already
          describes containment and viewport as different coordinate systems, beside `.hero-ground`.

          THE STYLE TAG IS FORCED BY THE CONSTANT. A class name cannot carry a value computed in
          JS, so a utility would mean writing 832 a second time — the duplication the constant
          exists to prevent, and the shape that let two route allowlists drift in this same PR. */}
      <style>{`
        .gallery-stage { display: grid; grid-template-columns: 1fr; align-items: center; gap: 0; }
        .gallery-stage > .gallery-rail { padding-top: 18px; }
        @container (min-width: ${GALLERY_OVERLAY_STACK_PX}px) {
          .gallery-stage { grid-template-columns: 64px 1fr 340px 64px; }
          .gallery-stage > .gallery-rail { padding-top: 0; }
        }
      `}</style>
    </div>
  );
}
