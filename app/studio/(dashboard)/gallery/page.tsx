// The gallery index — the list IS the page. Editing happens at /studio/gallery/<slug> with the
// full width, mirroring /studio/blog and /studio/projects.
import { getStudioData } from "@/lib/studio/data";
import GalleryIndex from "@/components/studio/GalleryIndex";
import { STUDIO_PAGE } from "@/lib/studio/page-class";

export const metadata = { robots: { index: false, follow: false } };

export default async function StudioGalleryPage() {
  // Draft-preferring: getStudioData overlays the draft branch, so a just-created item shows
  // immediately rather than after a publish.
  const { gallery } = await getStudioData();

  /* ⚠ NO `indexViewCookie` READ, AND THAT IS THE ABSENCE OF A CONTROL RATHER THAN OF A FEATURE.
     Blog persists grid-or-list because a post is identified by its title, which reads equally well
     either way. A gallery item is identified by its picture, so a list view would be a column of
     filenames beside favicon-sized thumbnails. See GalleryIndex's header. */

  return (
    <div className={STUDIO_PAGE}>
      {/* NO 60rem CAP AND NO `AreaHeader` HERE — the field measure is for pages of PROSE, and this
          one is a grid of pictures, so width buys more items per row. The header is rendered by
          the index so it can share a row with controls that need client state. Both match the
          blog and case-study indexes next door. */}
      <GalleryIndex items={gallery} />
    </div>
  );
}
