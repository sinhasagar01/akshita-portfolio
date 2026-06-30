import type { SiteSettingsEntry } from "@/lib/keystatic";
import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  AUTHOR_JOB_TITLE,
  absoluteUrl,
  projectPath,
  ogImageUrl,
} from "@/lib/site";

/**
 * Typed JSON-LD builders. Each returns a self-contained schema.org node (with `@context`)
 * to be serialized into a single `<script type="application/ld+json">`. All copy and URLs
 * come from the same sources as the page metadata and OG cards, so structured data never
 * diverges from what's visible or shared.
 */
type JsonLdNode = Record<string, unknown>;

const CONTEXT = "https://schema.org";

/** Inline Person node (no `@context`) for embedding as an `author`. */
function authorNode(): JsonLdNode {
  return {
    "@type": "Person",
    name: AUTHOR_NAME,
    url: SITE_URL,
  };
}

/** The portfolio owner. Socials/photo/email are pulled from site settings when present. */
export function personSchema(settings: SiteSettingsEntry | null): JsonLdNode {
  const sameAs = [
    settings?.linkedinUrl,
    settings?.dribbbleUrl,
    settings?.behanceUrl,
  ].filter((u): u is string => Boolean(u));

  return {
    "@context": CONTEXT,
    "@type": "Person",
    name: AUTHOR_NAME,
    jobTitle: AUTHOR_JOB_TITLE,
    url: SITE_URL,
    ...(settings?.photo ? { image: absoluteUrl(settings.photo) } : {}),
    ...(settings?.email ? { email: `mailto:${settings.email}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function webSiteSchema(): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    publisher: authorNode(),
  };
}

/** A case study as a CreativeWork authored by the portfolio owner. */
export function caseStudySchema({
  title,
  description,
  slug,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished: Date;
  dateModified: Date;
}): JsonLdNode {
  const url = absoluteUrl(projectPath(slug));
  return {
    "@context": CONTEXT,
    "@type": "CreativeWork",
    name: title,
    headline: title,
    description,
    url,
    image: ogImageUrl(slug),
    author: authorNode(),
    datePublished: datePublished.toISOString(),
    dateModified: dateModified.toISOString(),
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
