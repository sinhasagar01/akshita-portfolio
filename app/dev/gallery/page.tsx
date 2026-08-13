// The gallery browser's harness. DEV ONLY — middleware 404s /dev in production.
//
// ⚠ WHY FIXTURES RATHER THAN CONTENT. `content/gallery` is empty on the day this ships, and
// authoring items to test with would put the developer's placeholder photographs into the owner's
// collection — content with an owner, committed by somebody testing a layout. The public page
// renders its empty state correctly and that is all it can currently show, so the masonry, the
// filters, the overlay, the keyboard and the focus behaviour would otherwise ship having been
// compiled and never exercised.
//
// ⚠ THE IMAGES ARE REAL FILES ALREADY IN THE REPO AND THE DIMENSIONS ARE THEIR TRUE ONES, read
// with sharp rather than typed. That matters more here than anywhere: the whole layout-stability
// claim rests on the declared aspect matching the file, so a fixture with invented dimensions
// would test the masonry against a lie and report it stable.
//
// The three kinds are spread across the fixtures so the filter has something to do, and the
// aspects are deliberately mixed — tall, wide and near-square — because a masonry whose items all
// share one ratio is a grid and proves nothing.
import GalleryBrowser from "@/components/gallery/GalleryBrowser";
import type { GalleryItem } from "@/lib/keystatic";

export const metadata = { robots: { index: false, follow: false } };

const F = (
  slug: string,
  kind: string,
  image: string,
  width: number,
  height: number,
  title: string,
  tags: string[]
): GalleryItem => ({
  slug,
  title,
  kind,
  image,
  width,
  height,
  alt: `${title} — a harness fixture`,
  description:
    "A fixture standing in for authored content, so the layout can be exercised before the collection has anything in it.",
  tags,
  caseStudy: null,
  orderIndex: 0,
});

const ITEMS: GalleryItem[] = [
  F("a", "photo", "/images/photo.webp", 1536, 2048, "Portrait, tall", ["35mm"]),
  F("b", "proj", "/images/projects/fosfor-ai/heroImage.webp", 1600, 1000, "Wide study", ["ui"]),
  F("c", "illus", "/images/projects/fosfor-ai/blocks/2661133ae869.webp", 1440, 1024, "Near square", ["drawing"]),
  F("d", "photo", "/images/projects/boat-crest/heroImage.webp", 1600, 1000, "Wide photograph", ["dusk"]),
  F("e", "proj", "/images/projects/fosfor-ai/workflow-after.webp", 1024, 728, "Workflow after", ["ui"]),
  F("f", "illus", "/images/projects/elevate-one-view/blocks/d722bd4b5811.webp", 390, 988, "Very tall", ["mobile"]),
  F("g", "photo", "/images/projects/fosfor-ai/home-companion.webp", 1902, 1352, "Large wide", ["dusk"]),
  F("h", "proj", "/images/projects/fosfor-ai/sales-view.webp", 1024, 728, "Sales view", ["ui"]),
  F("i", "photo", "/images/projects/fosfor-ai/auto-ecom-view.webp", 1024, 764, "Auto ecom", ["35mm"]),
  F("j", "illus", "/images/projects/fosfor-ai/feedback-loop.webp", 1024, 764, "Feedback loop", ["drawing"]),
];

export default function GalleryHarness() {
  return (
    <div className="container-x pb-24">
      <header className="border-b border-etch/8 pb-[30px] pt-16">
        {/* No family utility — the unlayered `h1, h2` reset draws the display face already. */}
        <h1 className="text-[32px]">Gallery harness</h1>
        <p className="mt-2 text-[13px] text-text-lead">
          Ten fixtures with true dimensions. Click a tile, then try the arrows, Esc and Tab.
        </p>
      </header>
      <GalleryBrowser items={ITEMS} />
    </div>
  );
}
