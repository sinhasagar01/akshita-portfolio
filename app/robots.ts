import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * Allow general crawling of all public pages; block the CMS admin UI, the
 * private content dashboard, and the API. Points crawlers at the absolute sitemap URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/keystatic/", "/studio/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
