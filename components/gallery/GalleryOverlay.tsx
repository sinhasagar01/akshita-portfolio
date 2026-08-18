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
import { GALLERY_OVERLAY_CHROME_PX, GALLERY_OVERLAY_STACK_PX } from "@/lib/studio/three-pane";

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
  filmstrip,
  unoptimizedImage = false,
}: {
  item: GalleryOverlayItem;
  staticView?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  indexLabel?: string;
  /** The browse rail across the foot, supplied by whatever owns the SET. A slot rather than a
   *  built-in, because this component knows about one item and a filmstrip is a fact about many.
   *
   *  ⚠ THE STUDIO CANVAS PASSES NOTHING, AND THAT IS A REAL DIFFERENCE FROM THE PUBLIC OVERLAY —
   *  SAID PLAINLY RATHER THAN GLOSSED. The canvas claims to show "the overlay as it will appear
   *  open", and without a filmstrip the stage is taller there than a reader's. What the canvas
   *  reproduces exactly is the ITEM composition: every field the inspector edits, at the width the
   *  reader gets. The filmstrip is a browse control over a set, and the editor edits one item and
   *  already has a list pane for that job — so reproducing it would be drawing a second navigator
   *  beside the real one. The parity claim is about the item, and this is where its edge is. */
  filmstrip?: React.ReactNode;
  /** ⚠ SKIP THE IMAGE OPTIMIZER, WHICH THE STUDIO NEEDS AND THE PUBLIC PAGE MUST NOT HAVE.
   *
   *  The optimizer refetches the URL FROM THE SERVER WITHOUT THE OWNER COOKIE, so a proxied draft
   *  path 401s and a `blob:` object URL cannot be fetched at all. `ImageThumb`'s header states this
   *  rule, and the image below broke it — see the note at the element.
   *
   *  THE COMPONENT STAYS IGNORANT OF THE STUDIO. It is handed an already-resolved `image` and one
   *  boolean; it does not know what a draft branch is, and the public page passes neither. That is
   *  what keeps one node serving two consumers rather than two nodes agreeing today. */
  unoptimizedImage?: boolean;
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
      {/* ⚠ THE SHEET'S MONO SIZES, BUT NOT ITS MONO CLASSES, AND THE REASON IS THE GROUND.
          `.sheet-mark-text`, `.sheet-mono-label` and `.sheet-mono-micro` each paint
          `var(--sheet-mark)`, which is `--color-text-secondary` — a DARK ink, because every other
          consumer of those roles sits on the page. This overlay is the first surface in the arc
          whose ground is not the page's: it is a dark scrim inside a light `:root`, and nothing here
          sets `data-ground`, which only works at `:root` anyway.

          So applying the classes would paint dark grey on near-black and the markup would read as
          correct while the text vanished. The SIZES and TRACKING move to the direction's vocabulary
          — 11px at 0.2em for the mark, 10px at 0.14em for the micro labels — and the COLOUR stays
          with the `on-dark` roles that were built for this ground. `gallery-modal-scale` asserts
          both halves so neither drifts back. */}
      <div className="flex flex-none items-center gap-3.5 px-5 py-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-dark-muted">
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
              className="border border-on-dark/20 px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-on-dark"
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
              /* ⚠ WITHOUT THIS THE OPTIMISER SERVES THE TOP OF THE LADDER. `next/image` defaults to
                 `100vw`, and measured on the harness the overlay requested `w=3840` while the tiles
                 behind it correctly took `w=640` — the stage is never the full viewport, because
                 the rail and the arrow columns take a fixed 468px out of it at the desktop form.
                 So the widths are declared from the same chrome constant the reflow uses, and the
                 stacked form below the boundary genuinely is full width. */
              sizes={`(max-width: ${GALLERY_OVERLAY_STACK_PX - 1}px) 100vw, calc(100vw - ${GALLERY_OVERLAY_CHROME_PX}px)`}
              /* ⚠ `next/image` HERE AND A PLAIN `<img>` IN THE CASE-STUDY PREVIEW, and the
                 difference is who chooses the scale. That overlay zooms, so an optimiser sizing to
                 a layout slot works against it. This one fits a slot and never zooms, which is
                 exactly the case the optimiser is for.

                 ⚠ AND THAT WAS TRUE OF THE PUBLIC PAGE AND FALSE OF THE STUDIO CANVAS, WHICH IS
                 THE DEFECT THIS PROP FIXES — CORRECTED HERE IN THE SAME COMMIT AS THE CODE. The
                 header three paragraphs up already said the optimizer refetches without the owner
                 cookie; this element was `next/image` unconditionally, so in the canvas a proxied
                 draft path 401d and an object URL could not be fetched at all. The comment stated
                 the rule and the code beside it broke the rule — the fourth time in this collection
                 that prose described correct behaviour next to code that did not do it.

                 `unoptimized` renders the src as an ordinary browser request, which sends cookies
                 and understands `blob:`. The public page never passes it, so a published image
                 keeps the optimizer, its `sizes` ladder and its static path. */
              /* ⚠ NO `h-auto` AND NO `max-w-full` — the unlayered `img, video` reset already draws
                 both, so those utilities ask for what the element has and `cascade-public` counts
                 them inert. `max-h-full` and the width are NOT in that reset and are doing real
                 work, which is why only two of the four went. Same finding `ImagePreview` records
                 against the same reset. */
              unoptimized={unoptimizedImage}
              className="max-h-full w-auto object-contain"
            />
          ) : (
            <p className="border border-dashed border-on-dark/25 px-6 py-10 text-center font-mono text-[11px] text-on-dark-muted">
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
                  className="border border-on-dark/20 px-2.5 py-[5px] font-mono text-[10px] uppercase tracking-[0.14em] text-on-dark-muted"
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
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-dark-muted">
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
              className="border border-on-dark/20 px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-on-dark"
            >
              →
            </button>
          ) : null}
        </div>
      </div>

      {/* ⚠ THE FOOT ALWAYS RESERVES ITS HEIGHT, WHETHER OR NOT A FILMSTRIP FILLS IT — AND THE
          PARITY RULE DECIDED THAT RATHER THAN TASTE. A flag may ADD affordances and must never
          RESIZE A BOX; the absent filmstrip was resizing the stage.

          MEASURED ON `/dev/gallery-parity` AT 1100px, THE HARNESS'S FIRST RUN. Everything matched
          exactly — container 942, columns `64px 450px 340px 64px`, rail 340x232, the spec labels,
          the heading — except the image:

              canvas   stage 412   image 300x400
              public   stage 356   image 258x344   filmstrip 56

          Exact arithmetic rather than a layout bug: the strip is 56, the stage loses 56, and
          `object-contain` scales the image by 56. THE EDITOR WAS SHOWING AN IMAGE 14% LARGER THAN
          A VISITOR SEES, and an author crops and composes against what they see.

          ⚠ RESERVED AS EMPTY SPACE, NEVER AS A PLACEHOLDER STRIP. Drawing dummy thumbnails would
          give the editor an affordance the public page does not have, which is the same violation
          pointing the other way — the canvas would stop being a preview and start being its own
          design. 56px of empty band is the honest cost and it is meant to be visible.

          ⚠ AND NO SOURCE ASSERTION IN THIS REPOSITORY COULD HAVE SEEN THIS. Both consumers pass
          correct props, both render the same component, every gate was green. It took two boxes in
          one document and a measurement — which is the argument for hop 6 rather than a note about
          it. */}
      <div className={`flex-none ${filmstrip ? "" : "h-[var(--gallery-filmstrip-h)]"}`}>
        {filmstrip}
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
        /* ⚠ ONE NUMBER FOR THE STRIP'S HEIGHT AND THE RESERVED BAND. A 54x40 thumbnail with a 2px
           border, plus the rail's own 16px of bottom padding, is 56 — measured rather than guessed,
           and declared here so the canvas cannot reserve a height the public page does not use. */
        [data-gallery-overlay] { --gallery-filmstrip-h: 56px; }
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
