import type { Metadata } from "next";
import { getGalleryItems } from "@/lib/keystatic";
import { absoluteUrl, SITE_NAME, AUTHOR_JOB_TITLE, siteOgImageUrl } from "@/lib/site";
import GalleryBrowser from "@/components/gallery/GalleryBrowser";
import GalleryHero from "@/components/gallery/GalleryHero";

// The gallery index. The server reads the collection; everything interactive — the filter, the
// masonry's open state, the lightbox — is one client component below.
//
// ⚠ THE READ IS THE PUBLIC ONE, `getGalleryItems`, NOT THE STUDIO'S DRAFT-OVERLAID READ. Unlike
// blog there is no `status` field, so an item is public the moment it is on main — the projects
// posture. `galleryPublishBlockers` is the only thing between an unlabelled image and a reader,
// which is why alt text is a publish refusal rather than a warning.
//
// ⚠ THAT SENTENCE WAS FALSE WHEN IT WAS WRITTEN AND IS TRUE AS OF THIS COMMIT. `galleryPublishBlockers`
// existed and had ZERO CALLERS — the publish loop ran two `if`s and then a branch matching any other
// content yaml, which applied a placeholder scan and accepted the file. So this comment asserted a
// link that did not exist, in a file describing the gate it named.
//
// A GATE THAT EXISTS AND IS NEVER CALLED IS THE WORST VERSION OF THAT SHAPE, because its presence
// reads as coverage — and prose claiming it is wired reads as verification. Four project-shaped
// entries reached main and took the production build down site-wide. The wiring and this correction
// are in one commit deliberately: fixing the comment first would have left a documented gate still
// uncalled, and fixing the code first would have left a false claim standing beside it.
//
// ⚠ AND THE PAGE IS LISTED IN THE SITEMAP BECAUSE IT IS PUBLIC, NOT BECAUSE IT IS IN THE NAV.
// `app/sitemap.ts` records three separate occasions where tying listing to the nav lost a route;
// `route-coverage` now derives the subject and would fail if this were omitted.

const MASTHEAD = {
  title: "Things I made that aren't work",
  dek: "Photographs, drawings, and the odd product study that never became a case study. Mostly taken before 7am or after midnight.",
};

export const metadata: Metadata = {
  title: "Gallery",
  description: MASTHEAD.dek,
  alternates: { canonical: "/gallery" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/gallery"),
    title: "Gallery",
    description: MASTHEAD.dek,
    /* ⚠ THIS PAGE DECLARES `openGraph`, SO IT MUST NAME THE CARD ITSELF. Next merges metadata per
       top-level field: declaring this object replaces the root layout's, and an inherited image
       goes with it. Measured — removing these three entries left `og:image` ABSENT on `/`, `/blog`
       and `/gallery` while `twitter:image` survived, which is the asymmetry that makes it easy to
       miss. One helper, so the four call sites cannot drift. */
    images: [{ url: siteOgImageUrl(), width: 1200, height: 630, alt: `${SITE_NAME}, ${AUTHOR_JOB_TITLE}` }],
  },
};

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <div className="pb-24">
      <GalleryHero items={items} />

      {/* ⚠ THE EMPTY STATE IS A REAL STATE AND SHIPS WITH THE PAGE, because the collection is
          nearly empty on the day this lands. A gallery with nothing in it is not a broken page —
          it is a page whose content has not been authored — and the alternative, holding the route
          back until somebody uploads, is how a feature ships untested and then ships its first
          author's upload untested too. The blog index made the same call and its sitemap comment
          says so.

          ⚠ AND THE EARLY RETURN THAT USED TO SIT HERE IS GONE, WHICH IS A REAL FIX RATHER THAN
          TIDYING. It rendered a bare sentence and NO FILTER ROW when the collection was empty, so
          the page's own controls appeared on the first upload — and it tested `items` while
          `GalleryBrowser` tested a filtered population, so an item with a null image satisfied one
          guard and not the other and produced the FILTERED sentence on a gallery showing nothing.
          One population now, derived once in `galleryCounts`, and the browser owns both zero
          states because it is the only thing that knows which one applies. */}
      {/* ⚠ THE ANCHOR IS ON THIS WRAPPER RATHER THAN ON THE GRID, so it exists in BOTH states. A
          target inside the populated branch would leave "Browse everything" pointing at nothing on
          the empty page — a link that silently does not move, which is worse than one that is
          absent. `scroll-mt` clears the fixed nav. */}
      <div id="gallery-grid" className="container-x scroll-mt-24">
        <GalleryBrowser items={items} />
      </div>
    </div>
  );
}
