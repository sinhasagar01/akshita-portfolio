// Blog arc PR 1 — the PURE read seam for the blog collection.
//
// Dependency-free AT RUNTIME by design, so it is unit-exercisable directly under
// `node --experimental-strip-types` — the same idiom as lib/case-studies/adjacent-project.ts,
// which splits the next-case resolver out of lib/keystatic.ts so ralph can test it without
// constructing the reader. It is also why the studio canvas can call readingTimeMinutes
// client-side to keep the head's estimate live.
//
// ONE `import type` WAS ADDED, and the distinction matters enough to state. `BlogBlockKind`
// comes from blocks-raw.ts, which does reach @keystatic/core/reader and the @-alias — but
// only as TYPES, and `import type` is ERASED before the module is loaded, so nothing here
// resolves at runtime and the strip-types property is intact (asserted in blog-reading-time,
// which imports this file and would fail to load if it were not). The header used to read
// "no @-alias" flatly; that was true of the runtime and is now stated as such rather than
// broadened into a claim the file no longer meets.
import type { BlogBlockKind } from "./blocks-raw";
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
 *  reader-free; mirrors resolveSlugField there — KEEP THE TWO IN STEP.
 *
 *  #216: FALLS BACK ON A BLANK VALUE, NOT ONLY AN ABSENT ONE. `title` is editable and
 *  blankable now, and an empty string is a blank heading — it must yield the slug exactly as
 *  a missing key does. This is defense-in-depth behind validate-blog-post, which already
 *  forbids PUBLISHING a blank title; this keeps the read path robust regardless. Before #216
 *  the fields were never blankable, so `""` -> `""` never surfaced. */
function resolveSlugField(value: unknown, fallback: string): string {
  const resolved =
    typeof value === "string"
      ? value
      : value !== null && typeof value === "object" && "value" in value
        ? (value as { value: string }).value
        : null;
  return resolved !== null && resolved.trim() !== "" ? resolved : fallback;
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
 * Which strings each block kind contributes to the word count — one entry per kind.
 *
 * A MAPPED TYPE, NOT A SWITCH, AND THAT IS THE WHOLE POINT. This was a `switch` with four
 * cases and a comment reading "unknown kind — contributes nothing rather than throwing".
 * When #180 added `imageBlock`, nothing failed: the new kind fell through to the default and
 * its caption silently counted zero words. The omission survived three PRs and was found by
 * reading, not by a gate. `{ [K in BlogBlockKind]: ... }` makes the SAME mistake a
 * compilation error — add a sixth kind to keystatic.config and this object stops compiling
 * until it is handled. Same discipline as `BlogProse`'s RENDERERS, for the same reason.
 *
 * WHAT COUNTS IS WHAT A READER READS IN FLOW. Captions count because they are prose on the
 * page. `alt` does NOT — it is an accessible description of an image, not text in the
 * reading order, and counting it would inflate the estimate for sighted and screen-reader
 * readers alike. `src`, `wide` and `decorative` are not prose at all.
 *
 * The VALUES stay `Record<string, unknown>` rather than the typed per-kind value, because
 * this reads whatever is on disk — see the defensiveness note on the function below.
 */
const COUNTED: { [K in BlogBlockKind]: (v: Record<string, unknown>) => number } = {
  heading: (v) => countWords(v.text),
  richText: (v) =>
    Array.isArray(v.paragraphs)
      ? v.paragraphs.reduce<number>((n, p) => n + countWords(p), 0)
      : 0,
  pullQuote: (v) => countWords(v.text),
  imageBlock: (v) => countWords(v.caption),
  videoEmbed: (v) => countWords(v.caption),
};

/**
 * Reading time in whole minutes, COMPUTED from a post's blocks (never authored) — the
 * contract's rule. Counts the words a reader actually reads: heading text, richText
 * paragraphs, pullQuote text, and image and video captions. Floors at 1 minute, so even a
 * one-line post reads as "1 min", never "0 min".
 *
 * Takes `unknown` (the reader hands blocks through untyped, and the ralph suite feeds
 * stubs) and is defensive about shape, so a malformed block contributes 0 rather than
 * throwing. Pure — no reader, unit-exercisable directly.
 *
 * THE RUNTIME LOOKUP STAYS DEFENSIVE even though the table is exhaustive. The table makes a
 * MISSING kind a compile error; it cannot make a file on disk well-formed, and a hand-edited
 * or future-branch entry can still carry a discriminant this build has never heard of. An
 * unknown key yields `undefined` and contributes 0, exactly as before.
 */
export function readingTimeMinutes(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 1;
  let words = 0;
  for (const block of blocks) {
    if (block === null || typeof block !== "object") continue;
    const { discriminant, value } = block as { discriminant?: unknown; value?: unknown };
    if (value === null || typeof value !== "object") continue;
    const count = COUNTED[discriminant as BlogBlockKind];
    if (count) words += count(value as Record<string, unknown>);
  }
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
