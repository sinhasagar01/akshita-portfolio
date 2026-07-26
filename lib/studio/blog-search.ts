// The blog list's search filter, in one place.
//
// It existed inline in BlogIndex and the three-pane list pane needs the same behaviour, so
// it moved here rather than being retyped. Two copies of a filter is how the index and the
// rail start disagreeing about which posts exist — a small version of the `[slug]/body`
// drift, where an unreachable second copy of a surface kept receiving fixes the real one
// never got.
//
// A dependency-free leaf so `--experimental-strip-types` can load it directly. It takes the
// two fields it reads rather than a BlogCard, so ralph never has to build a whole entry.

/** The searchable shape. Structural, not nominal, so BlogCard satisfies it as-is. */
export type BlogSearchable = { title: string; dek: string };

/**
 * Posts matching `query`, in their original order.
 *
 * MATCHES TITLE OR DEK, case-insensitively, on a trimmed query. An empty or
 * whitespace-only query returns the input UNFILTERED and by identity — the pane renders
 * every post rather than none, which is the opposite of the blog's status filter and
 * deliberately so. `status` governs whether a post EXISTS publicly and so fails closed;
 * a search box is a narrowing convenience over a list the author already owns, and a
 * fail-closed search would blank the rail on focus.
 */
export function filterBlogPosts<T extends BlogSearchable>(items: readonly T[], query: string): readonly T[] {
  const q = query.trim().toLowerCase();
  if (q === "") return items;
  return items.filter(
    (p) => p.title.toLowerCase().includes(q) || p.dek.toLowerCase().includes(q)
  );
}
