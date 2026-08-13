import type { MetadataRoute } from "next";
import { getProjectSlugs, getBlogPosts } from "@/lib/keystatic";
import { absoluteUrl, projectPath, projectLastModified, blogPath, blogLastModified } from "@/lib/site";
import { PALETTE_SLUGS } from "@/lib/palettes/compatibility";

/**
 * Dynamic sitemap built from the same content sources the pages use, so it cannot drift
 * from the real routes. The homepage, every project detail page, `/blog`, and every
 * PUBLISHED post. The bespoke `boat-crest` slug is part of the project list and resolves to
 * its literal route. Non-public routes (`/studio`, `/api`) are intentionally excluded.
 *
 * THE BLOG WAS MISSING UNTIL THE NAV LINK SHIPPED, and the comment here claimed the file
 * "can never drift from the real routes" while it did exactly that for two collections'
 * worth of PRs. The claim was true when written and decayed when a second collection was
 * added — a sitemap does not fail loudly, it just quietly omits pages.
 *
 * `getBlogPosts()` IS THE RIGHT SOURCE AND THE FILTERING IS THE REASON. It returns
 * PUBLISHED posts only (#170's fail-closed status gate), so a draft can never be
 * advertised to a crawler — which matters more here than anywhere else on the site,
 * because `/blog/<slug>` 404s for a draft and a sitemap entry pointing at a 404 is worse
 * than no entry at all. It is the same list `generateStaticParams` builds from, so the
 * sitemap and the prerendered routes cannot disagree.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, posts] = await Promise.all([getProjectSlugs(), getBlogPosts()]);

  const projects: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: absoluteUrl(projectPath(slug)),
    lastModified: projectLastModified(slug),
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(blogPath(post.slug)),
    lastModified: blogLastModified(post.slug),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects,
    // The index is listed even with no published posts — it is a real page that renders an
    // empty state, unlike a post route, which does not exist at all until one is published.
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...blogPosts,
    /* Listed on the same terms as `/blog` above: a real page that renders an empty state, so it is
       a destination whether or not anything has been authored into it yet. There is no
       `/gallery/<slug>` route to guard — the overlay is a dialog on this page, not a URL — so
       unlike blog posts there is nothing here that can 404. */
    {
      url: absoluteUrl("/gallery"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    /* ⚠ THE PLAYGROUND WAS MISSING TOO, WHICH IS THE THIRD INSTANCE OF THE DECAY THIS FILE'S OWN
       HEADER RECORDS TWICE. `/palettes` shipped with a nav link, has been public and indexed since,
       and was never listed here — exactly what the paragraph above says happened to the blog, in
       the file that says it. A sitemap does not fail loudly; it quietly omits pages, so nothing
       ever went red.

       It was found while ADDING `/oklch`, not by anyone checking. That is the shape rather than the
       incident: this file is only ever read when somebody is putting something into it, so a route
       that ships without a sitemap edit is invisible until the next route ships.

       ⚠ AND `/oklch` IS DELIBERATELY NOT BEHIND A NAV LINK. The nav carries one Playground entry
       pointing at `/palettes`, and the primer is reached by cross-links from it. So the nav is NOT
       the trigger for listing a route here — being public is. Listing only what the nav shows is
       how the two above went missing. */
    {
      url: absoluteUrl("/palettes"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/oklch"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    /* ⚠ AND THE NINE PALETTE ROUTES WERE THE FOURTH GAP, FOUND BY DERIVING THE SUBJECT RATHER THAN
       BY ANOTHER ROUTE SHIPPING. `route-coverage` reads the prerender manifest and compares it to
       what this file emits: 21 public pages against 12 listed, and the nine missing were these.

       THEY ARE SHAREABLE BY DESIGN, WHICH IS WHAT MAKES THE OMISSION A DEFECT RATHER THAN A CHOICE.
       The console's `Link` button copies exactly `/palettes/<name>` for a visitor to send somebody.
       A URL the product hands out and the sitemap does not know about is the plainest form of this
       file's recurring failure.

       ⚠ DERIVED, NEVER TYPED. Nine entries written by hand would be stale the day a tenth palette
       ships — the same shape as the omission it repairs, one level down.

       ⚠ AND IT IMPORTS `PALETTE_SLUGS` RATHER THAN RE-DERIVING IT. The first version filtered
       `THEME_NAMES` here, which is the same expression `/palettes/[slug]`'s `generateStaticParams`
       already runs — TWO SPELLINGS OF ONE FILTER THAT AGREE TODAY. That is a staler risk than any
       cache: a derivation can be correct and its output wrong because a SECOND derivation drifted,
       and nothing about the code would look off. One source, one filter, and `route-coverage` B1
       joins the emitted sitemap against the prerendered routes so a drift between them goes red
       rather than silently omitting a page. */
    ...PALETTE_SLUGS.map((name) => ({
      url: absoluteUrl(`/palettes/${name}`),
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];
}
