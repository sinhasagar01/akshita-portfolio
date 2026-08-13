// Gallery canvas-vs-public parity. DEV ONLY — middleware 404s /dev in production.
//
// ---- WHAT IT PINS -----------------------------------------------------------------------------
//
// `GalleryOverlay` draws one item and is mounted by two consumers: the studio canvas renders it
// bare with `staticView`, and the public page renders it inside `GalleryLightbox`. The parity claim
// is that both draw the SAME ITEM COMPOSITION — every field the inspector edits, at the same
// geometry — so an author is editing what a reader will see.
//
// Both renders sit in ONE document at ONE width, for the reason `/dev/parity` states: comparing
// /studio to /gallery means comparing two documents at two scroll positions with two scrollbars,
// which is how a hand-rolled version produced ten false positives.
//
// ---- ⚠ WHAT THIS PROVES AT n=1, AND WHAT IT ONLY PROVES AT n>3 -------------------------------
//
// `content/gallery` holds ONE item today, and a harness that is technically non-zero and
// practically empty is a false pass wearing a number. So the two are separated here rather than
// left for a reader to assume:
//
//   AT n=1 IT PROVES        the meta rail renders the same fields in both contexts; the stage
//                           geometry matches at one container width; the spec grid reads the same
//                           machine-written values; the dark ground and the type scale agree.
//
//   IT PROVES NOTHING ABOUT the filmstrip (needs >1 to render at all — `GalleryLightbox` omits it
//                           for a single item deliberately), arrow wrapping (needs >1), the
//                           masonry's column balance (needs >3 before `columns: 4` has anything to
//                           balance), or the order the filter presents.
//
// ⚠ THE FIXTURES ARE THEREFORE PART OF THE HARNESS, NOT A CONVENIENCE. It renders a fixture set
// large enough to exercise the n>3 half, beside the real collection, so the run is honest about
// which half it is exercising. `ralph/tests/gallery-parity.mjs` asserts the fixture count rather
// than trusting this comment.
import GalleryOverlay from "@/components/gallery/GalleryOverlay";
import GalleryBrowser from "@/components/gallery/GalleryBrowser";
import { getGalleryItems } from "@/lib/keystatic";
import type { GalleryItem } from "@/lib/studio/gallery-format";

export const metadata = { robots: { index: false, follow: false } };

/** The fixture set. Real files already in the repo with their TRUE dimensions, so the aspect the
 *  masonry reserves is the aspect the file has — a fixture with invented dimensions would test the
 *  layout against a lie and report it stable. */
const F = (slug: string, kind: string, image: string, width: number, height: number, title: string): GalleryItem => ({
  slug, title, kind, image, width, height,
  alt: `${title} — a parity fixture`,
  description: "A fixture standing in for authored content, so the n>3 half can be exercised.",
  tags: ["fixture"], caseStudy: null, orderIndex: 0,
});

/** FOUR, WHICH IS THE SMALLEST SET THAT EXERCISES EVERY n>3 CLAIM ABOVE: the filmstrip renders,
 *  the arrows wrap, and `columns: 4` has one item per column to balance. */
/* ⚠ NOT EXPORTED, AND THE BUILD IS WHY. A Next page module may only export a fixed set of names —
 *  `default`, `metadata`, `generateStaticParams` and a handful more — and anything else fails the
 *  route's generated type check. It was exported out of habit and took the build red; the suite
 *  reads it from SOURCE rather than importing it, so nothing needed the export in the first place. */
const PARITY_FIXTURES: GalleryItem[] = [
  F("p1", "photo", "/images/photo.webp", 1536, 2048, "Tall"),
  F("p2", "proj", "/images/projects/fosfor-ai/heroImage.webp", 1600, 1000, "Wide"),
  F("p3", "illus", "/images/projects/fosfor-ai/blocks/2661133ae869.webp", 1440, 1024, "Near square"),
  F("p4", "photo", "/images/projects/boat-crest/heroImage.webp", 1600, 1000, "Second wide"),
];

export default async function GalleryParityHarness() {
  const real = await getGalleryItems();

  return (
    <main className="bg-cream-100 p-6">
      <h1 className="mb-2 text-[20px]">Gallery parity — canvas against public</h1>
      <p className="mb-6 max-w-[74ch] text-[13px] leading-relaxed">
        The same <code>GalleryOverlay</code> node, twice: as the studio canvas mounts it
        (<code>staticView</code>, no filmstrip) and as the public dialog does. Both boxes are the
        same width, so the only variable is the flag.
      </p>

      <p className="mb-4 font-mono text-[11px]">
        real collection: {real.length} item{real.length === 1 ? "" : "s"} · fixtures:{" "}
        {PARITY_FIXTURES.length}
      </p>

      <section className="mb-8">
        <p className="mb-1.5 font-mono text-[11px]">A · canvas form (staticView)</p>
        <div
          data-parity="canvas"
          style={{ width: "1100px", height: "460px", maxWidth: "100%" }}
          className="overflow-hidden rounded-[6px] outline outline-1 outline-ink-950/8"
        >
          <GalleryOverlay item={PARITY_FIXTURES[0]} staticView />
        </div>
      </section>

      <section className="mb-8">
        {/* ⚠ THE PUBLIC FORM IS RENDERED WITHOUT ITS DIALOG WRAPPER ON PURPOSE. `GalleryLightbox`
            is `position: fixed`, which would take it out of this document's flow and make the two
            boxes incomparable — the wrapper's job is modality, and modality is not what parity is
            about. What differs between the two sections below is exactly the props the public
            consumer passes: the arrows, the index label and the filmstrip. */}
        <p className="mb-1.5 font-mono text-[11px]">B · public form (arrows, index, filmstrip)</p>
        <div
          data-parity="public"
          style={{ width: "1100px", height: "460px", maxWidth: "100%" }}
          className="overflow-hidden rounded-[6px] outline outline-1 outline-ink-950/8"
        >
          <GalleryOverlay
            item={PARITY_FIXTURES[0]}
            indexLabel="01 / 04"
            onPrev={undefined}
            onNext={undefined}
            filmstrip={
              <div className="flex justify-center gap-[7px] px-5 pb-4">
                {PARITY_FIXTURES.map((f) => (
                  <span key={f.slug} className="h-10 w-[54px] rounded-[6px] bg-on-dark/20" />
                ))}
              </div>
            }
          />
        </div>
      </section>

      <section>
        <p className="mb-1.5 font-mono text-[11px]">
          C · the masonry at n={PARITY_FIXTURES.length}, which is what n=1 cannot exercise
        </p>
        <GalleryBrowser items={PARITY_FIXTURES} />
      </section>
    </main>
  );
}
