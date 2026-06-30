import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/keystatic";
import { absoluteUrl, projectPath, projectLastModified } from "@/lib/site";

/**
 * Dynamic sitemap built from the same content source the pages use (`getProjectSlugs`),
 * so it can never drift from the real routes. Includes the homepage and every project
 * detail page; the bespoke `boat-crest` slug is part of that list and resolves to its
 * literal route. Non-public routes (`/keystatic`, `/api`) are intentionally excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProjectSlugs();

  const projects: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: absoluteUrl(projectPath(slug)),
    lastModified: projectLastModified(slug),
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects,
  ];
}
