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
// GENERIC over the item type so a caller passing a richer shape (getBlogPosts attaches
// `readingTime`) keeps that shape through the filter+sort. The runtime is unchanged from
// the plain BlogListItem version, so the blog-status-filter suite stays byte-identical.
export function selectPublishedPostsNewestFirst<T extends BlogListItem>(
  items: readonly T[]
): T[] {
  return items
    .filter(isPublishedPost)
    .slice()
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}

const WORDS_PER_MINUTE = 200;

/** Count whitespace-separated tokens in a string. Markers (**bold**, *italic*,
 *  [text](url)) ride along as part of their token — an approximation that is stable and
 *  good enough for a reading estimate; the WPM figure is itself approximate. */
function countWords(text: unknown): number {
  if (typeof text !== "string") return 0;
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Reading time in whole minutes, COMPUTED from a post's blocks (never authored) — the
 * contract's rule. Counts the words a reader actually reads: heading text, richText
 * paragraphs, pullQuote text, and a videoEmbed caption. Floors at 1 minute, so even a
 * one-line post reads as "1 min", never "0 min".
 *
 * Takes `unknown` (the reader hands blocks through untyped, and the ralph suite feeds
 * stubs) and is defensive about shape, so a malformed block contributes 0 rather than
 * throwing. Pure — no reader, unit-exercisable directly.
 */
export function readingTimeMinutes(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 1;
  let words = 0;
  for (const block of blocks) {
    if (block === null || typeof block !== "object") continue;
    const { discriminant, value } = block as { discriminant?: unknown; value?: unknown };
    if (value === null || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    switch (discriminant) {
      case "heading":
      case "pullQuote":
        words += countWords(v.text);
        break;
      case "richText":
        if (Array.isArray(v.paragraphs)) {
          for (const p of v.paragraphs) words += countWords(p);
        }
        break;
      case "videoEmbed":
        words += countWords(v.caption);
        break;
      // unknown kind — contributes nothing rather than throwing.
    }
  }
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
