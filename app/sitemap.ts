import type { MetadataRoute } from "next";
import { getProjectSlugs, getBlogPosts } from "@/lib/keystatic";
import { absoluteUrl, projectPath, projectLastModified, blogPath, blogLastModified } from "@/lib/site";

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
  ];
}
