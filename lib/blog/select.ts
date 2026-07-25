// Blog arc PR 1 — the PURE read seam for the blog collection.
//
// Dependency-free by design (no @keystatic/core/reader import, no @-alias), so it is
// unit-exercisable directly under `node --experimental-strip-types` — the same idiom
// as lib/case-studies/adjacent-project.ts, which splits the next-case resolver out of
// lib/keystatic.ts so ralph can test it without constructing the reader.
//
// It is also the honest home for the status predicate, which is the ONE thing standing
// between a draft post and the public site. lib/keystatic.ts's getBlogPosts() composes
// reader.collections.blog.all() -> mapBlogListItem -> selectPublishedPostsNewestFirst,
// so the filter that decides public visibility lives here, pure and tested, not inline
// next to the reader.

/** One blog post as the homepage and the list need it. `blocks` is NOT here — the
 *  card never renders block content, and getBlogPost carries the raw blocks for the
 *  (future) article page. */
export type BlogListItem = {
  slug: string;
  title: string;
  dek: string;
  /** Authored ISO date, YYYY-MM-DD. Sorts lexically newest-first. "" when unset. */
  date: string;
  topic: string;
  /** "draft" | "published" | "" (unset). Only an explicit "published" renders. */
  status: string;
  heroImage: string | null;
};

/** Resolve a Keystatic slug field, which the reader may hand back as a bare string or
 *  as `{ value }`. Inlined (not imported from lib/keystatic.ts) to keep this module
 *  reader-free; mirrors resolveSlugField there. */
function resolveSlugField(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && "value" in value) {
    return (value as { value: string }).value;
  }
  return fallback;
}

/** Map one raw blog reader entry to a BlogListItem, coalescing every absent field to
 *  its empty spelling — the same posture as mapProjectListItem. Pure. */
export function mapBlogListItem(slug: string, entry: Record<string, unknown>): BlogListItem {
  return {
    slug,
    title: resolveSlugField(entry.title, slug),
    dek: (entry.dek ?? "") as string,
    date: (entry.date ?? "") as string,
    topic: (entry.topic ?? "") as string,
    status: (entry.status ?? "") as string,
    heroImage: (entry.heroImage ?? null) as string | null,
  };
}

/**
 * The public-visibility gate. FAILS CLOSED: only an entry whose status is EXACTLY
 * "published" renders. "" (unset / authored before the field), "draft", and any
 * unknown value are hidden.
 *
 * This is deliberately the OPPOSITE of the projects `category` (#159), whose "" meant
 * "visible under All". category describes a post; status governs whether it exists
 * publicly — so given the site's whole-branch publish (an unfinished post reaches main
 * the next time anything is published), the default MUST be hidden, and a typo'd or
 * legacy "" must not leak an unfinished post.
 */
export function isPublishedPost(item: BlogListItem): boolean {
  return item.status === "published";
}

/**
 * The public list: only published posts, newest first. ISO dates sort lexically, so a
 * plain reverse string compare on `date` orders newest-first; ties fall back to slug
 * for a stable, deterministic order (the byte-stable-output discipline the read path
 * shares with everything else here). Pure — the reader read happens in getBlogPosts.
 */
export function selectPublishedPostsNewestFirst(items: readonly BlogListItem[]): BlogListItem[] {
  return items
    .filter(isPublishedPost)
    .slice()
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}
