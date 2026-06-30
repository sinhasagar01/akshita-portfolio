import { statSync } from "node:fs";
import path from "node:path";
import { BESPOKE_SLUGS } from "@/lib/case-studies/types";

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

/**
 * Absolute URL of a case study's generated OG card (the `og` route handler). Single source
 * for og:image, twitter:image, and the JSON-LD image so they always match.
 */
export function ogImageUrl(slug: string): string {
  return absoluteUrl(`${projectPath(slug)}/og`);
}

/**
 * Best-effort last-modified date for a project, used by the sitemap and JSON-LD.
 * There is no date field in the content model, so we read the file mtime: the Keystatic
 * YAML for content-driven studies, plus the bespoke TS module for code-driven ones — the
 * newest of the two. Falls back to the current date if neither file can be stat'd.
 */
export function projectLastModified(slug: string): Date {
  const candidates = [
    path.join(process.cwd(), "content", "projects", `${slug}.yaml`),
  ];
  if (BESPOKE_SLUGS.has(slug)) {
    candidates.push(
      path.join(process.cwd(), "lib", "case-studies", `${slug}.ts`),
    );
  }

  let newest = 0;
  for (const file of candidates) {
    try {
      newest = Math.max(newest, statSync(file).mtimeMs);
    } catch {
      // missing file — ignore, fall through to other candidates
    }
  }

  return newest > 0 ? new Date(newest) : new Date();
}
