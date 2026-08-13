// The gallery overlay's reflow harness. DEV ONLY — middleware 404s /dev in production.
//
// WHAT IT EXISTS FOR. `GalleryOverlay` reflows on a CONTAINER query, not a viewport one, because
// it renders inside the studio canvas (a pane) as well as on the public page (a viewport). A
// container query cannot be checked by resizing the window, so there is nothing a normal browser
// pass can do with it — the box has to be given several widths at once.
//
// ⚠ AND THE OVERLAY IS OTHERWISE UNREACHABLE UNTIL TWO OTHER THINGS EXIST. Its only consumer today
// is the studio canvas, which sits behind the owner gate; the public page that will mount it is
// the next unit. Without this harness the component would ship having been compiled and never
// rendered, which is the state every "it builds, so it works" defect starts from.
//
// THE WIDTHS ARE CHOSEN AROUND THE ONE CONSTANT. `GALLERY_OVERLAY_STACK_PX` is imported rather
// than typed, so if the derivation moves, the boundary pair moves with it and this page keeps
// testing the boundary rather than a number that used to be it.
import GalleryOverlay from "@/components/gallery/GalleryOverlay";
import { GALLERY_OVERLAY_STACK_PX } from "@/lib/studio/three-pane";

export const metadata = { robots: { index: false, follow: false } };

/** A fixture rather than real content, because `content/gallery` is empty by design at this point
 *  and a harness that needs authored content cannot run until somebody authors some. Every field
 *  is populated so the meta rail has something in each slot. */
const ITEM = {
  title: "Low tide, Muttukadu",
  kind: "photo",
  // A remote-free placeholder: the overlay's no-image branch, which is also a real state an
  // author sees between creating an entry and uploading to it.
  image: null,
  width: 1600,
  height: 2000,
  alt: "A wide beach at low tide with a single figure walking",
  description:
    "Taken about twenty minutes before sunrise, when the water had pulled back far enough to walk out on what is normally seabed.",
  tags: ["35mm", "before 7am", "chennai"],
  caseStudy: "boat-crest",
};

/** The boundary and a width either side of it, plus the two real consumers' typical widths. */
const WIDTHS = [
  { px: GALLERY_OVERLAY_STACK_PX - 1, note: "one under the boundary — must be STACKED" },
  { px: GALLERY_OVERLAY_STACK_PX, note: "exactly the boundary — must be the DESKTOP form" },
  { px: 1100, note: "a typical studio canvas" },
  { px: 1440, note: "a typical public viewport" },
];

export default function GalleryOverlayHarness() {
  return (
    <main className="bg-cream-100 p-6">
      <h1 className="mb-4 text-[20px]">Gallery overlay — container reflow</h1>
      <p className="mb-6 max-w-[70ch] text-[13px] leading-relaxed">
        Each box below is a different WIDTH containing the same component. The reflow is a
        container query, so the window width is irrelevant — what matters is the box.
      </p>
      <div className="flex flex-col gap-8">
        {WIDTHS.map(({ px, note }) => (
          <section key={px}>
            <p className="mb-1.5 font-mono text-[11px]">
              {px}px — {note}
            </p>
            {/* A fixed height, because the overlay is a full-height flex column and an
                unconstrained one collapses to its content. The real consumers both give it a
                bounded box. */}
            {/* ⚠ `outline`, NOT `border`, AND THE FIRST VERSION USED A BORDER AND LIED. A container
                query measures the CONTENT box, so a 1px border each side made the container 830
                inside a box labelled 832 — and the boundary row reported the STACKED form at a
                width that should have been the first desktop one. That reads exactly like the
                component being off by two pixels, and the component is fine: the frame this
                harness draws for legibility was inside the thing it was measuring.

                An outline is painted outside the box and takes no layout, so the container's
                inline-size is the number in the label. Instrument condition, not site condition —
                and it is only visible because the boundary pair was measured rather than a single
                comfortable width. */}
            <div
              data-harness-width={px}
              style={{ width: `${px}px`, height: "460px", maxWidth: "100%" }}
              className="overflow-hidden rounded-[6px] outline outline-1 outline-ink-950/8"
            >
              <GalleryOverlay item={ITEM} staticView />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
