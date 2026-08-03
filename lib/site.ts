import { statSync } from "node:fs";
import path from "node:path";

/**
 * Single source of truth for the site's identity and base URL. Everything that needs an
 * absolute URL (metadataBase, sitemap, robots, canonical, OG, JSON-LD) reads from here so
 * the production origin is never retyped. The base URL mirrors `metadataBase` in
 * `app/layout.tsx` and `NEXT_PUBLIC_SITE_URL` in `.env.local` — keep all three in sync.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.akshitas.com";

export const SITE_NAME = "Akshita Singh";
export const AUTHOR_NAME = "Akshita Singh";
export const AUTHOR_JOB_TITLE = "Product Designer";

/** Reused verbatim as the root metadata description. */
export const SITE_DESCRIPTION =
  "Product designer focused on enterprise and consumer experiences. Portfolio of case studies in UX, interaction design, and design systems.";

export const SITE_KEYWORDS = [
  "product design",
  "UX design",
  "interaction design",
  "design systems",
  "portfolio",
  "Akshita Singh",
];

/** Absolute URL for a site-relative path, resolved against the canonical origin. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/** Route path for a project/case-study detail page. */
export function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

/** Route path for a blog post. The blog index is `/blog`. */
export function blogPath(slug: string): string {
  return `/blog/${slug}`;
}

/**
 * Absolute URL of a case study's generated OG card (the `og` route handler). Single source
 * for og:image, twitter:image, and the JSON-LD image so they always match.
 */
export function ogImageUrl(slug: string): string {
  return absoluteUrl(`${projectPath(slug)}/og`);
}

/**
 * Absolute URL of a blog post's generated OG card. Same shape as `ogImageUrl` above, and here
 * for the same reason: the article page used to spell `/opengraph-image.png` inline and read
 * it twice in one function, so og:image and twitter:image were two literals that happened to
 * agree.
 *
 * NO JSON-LD CONSUMER, and that is a real difference rather than an omission here. Case studies
 * feed `ogImageUrl` into structured data (lib/structured-data.ts) as well as the two meta tags,
 * which is what that helper's "single source" note is about. The blog emits no structured data
 * at all — see the deferred item in docs/STATE.md.
 */
export function blogOgImageUrl(slug: string): string {
  return absoluteUrl(`${blogPath(slug)}/og`);
}

/**
 * Best-effort last-modified date for a project, used by the sitemap and JSON-LD.
 * There is no date field in the content model, so we read the file mtime: the Keystatic
 * The entry's YAML. There used to be a second candidate — a bespoke TS module for the one
 * code-driven study — and the newest of the two won; `boat-crest` became content in #292, so every
 * study now has exactly one source file. Falls back to the current date if it cannot be stat'd.
 */
export function projectLastModified(slug: string): Date {
  try {
    return new Date(statSync(path.join(process.cwd(), "content", "projects", `${slug}.yaml`)).mtimeMs);
  } catch {
    // No such entry — fall back to now rather than to a wrong date.
    return new Date();
  }
}

/**
 * A blog post's last-modified date, for the sitemap.
 *
 * THE FILE'S MTIME, NOT THE AUTHORED `date`. They answer different questions: `date` is
 * when the post was WRITTEN and is what the article displays, while a sitemap's
 * lastModified is when the content last CHANGED. A typo fix does not move the authored
 * date and should still tell a crawler to re-read the page. This mirrors
 * projectLastModified, which takes the same view for the same reason.
 */
export function blogLastModified(slug: string): Date {
  try {
    return new Date(statSync(path.join(process.cwd(), "content", "blog", `${slug}.yaml`)).mtimeMs);
  } catch {
    return new Date();
  }
}
