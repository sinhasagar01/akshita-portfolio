import type { Metadata } from "next";
import { getGalleryItems } from "@/lib/keystatic";
import { absoluteUrl } from "@/lib/site";
import GalleryBrowser from "@/components/gallery/GalleryBrowser";

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
    images: [{ url: absoluteUrl("/opengraph-image.png"), width: 1200, height: 630, alt: "Gallery" }],
  },
  twitter: { images: [absoluteUrl("/opengraph-image.png")] },
};

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <div className="container-x pb-24">
      <header className="border-b border-etch/8 pb-[30px] pt-16">
        <p className="text-[12px] uppercase tracking-[0.16em] text-text-secondary">Gallery</p>
        {/* ⚠ NO FAMILY OR WEIGHT UTILITY — `cascade-public` C3 counts both inert here. The unlayered
            `h1, h2` reset already sets the display family AND the regular weight, and an unlayered
            rule beats anything in `@layer utilities`. The blog masthead this is modelled on carries
            both and they are equally dead there; they are pre-existing and pinned, so they are left
            alone rather than swept in a gallery PR — but copying them forward would have grown the
            inventory the gate exists to hold flat. The rendering is identical either way, which is
            what "inert" means and why nobody notices. */}
        <h1 className="mt-3.5 max-w-[16ch] text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.02] tracking-[-0.015em] text-text-primary">
          {MASTHEAD.title}
        </h1>
        <p className="mt-3.5 max-w-[54ch] text-base leading-[1.6] text-text-lead">{MASTHEAD.dek}</p>
      </header>

      {/* ⚠ THE EMPTY STATE IS A REAL STATE AND SHIPS WITH THE PAGE, because the collection is empty
          on the day this lands. A gallery with nothing in it is not a broken page — it is a page
          whose content has not been authored — and the alternative, holding the route back until
          somebody uploads, is how a feature ships untested and then ships its first author's
          upload untested too. The blog index made the same call and its sitemap comment says so. */}
      {items.length === 0 ? (
        <p className="mt-10 text-[14px] text-text-subtle">Nothing here yet.</p>
      ) : (
        <GalleryBrowser items={items} />
      )}
    </div>
  );
}
