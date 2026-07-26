// F-2 — pure draft-overlay logic for the /studio collection lists.
//
// Extracted from getStudioData (data.ts) so the union/subtract/re-sort is
// unit-testable in isolation, the same way experience-current.ts extracts the
// "Currently" rule from ExperienceSection. Dependency-free and generic over any
// list item with a slug and an orderIndex, so ProjectListItem and
// ExperienceListItem both flow through it unchanged. No @-alias, no Next, no
// keystatic imports — importable from a plain node proof.

/**
 * Overlay a draft branch's collection state onto the live (main) list:
 *  - SUBTRACT every slug the draft removed (a delete on the draft branch),
 *  - UNION IN every draft entry — replacing a modified slug in place OR adding a
 *    draft-only created slug that live has never seen,
 *  - then RE-SORT by orderIndex, because a created entry cannot be spliced into
 *    the live order; its orderIndex decides where it lands.
 *
 * A live-preserving no-op falls out for free: with no removals and no draft
 * entries the result is just `live` re-sorted (and `live` is already
 * orderIndex-sorted upstream), so a no-draft / GitHub-error state and today's
 * edit-only case both return the same list, same order.
 */
export function overlayCollection<T extends { slug: string }>(
  live: T[],
  draftEntries: Record<string, T>,
  removedSlugs: string[],
  compare: (a: T, b: T) => number
): T[] {
  const bySlug = new Map<string, T>(live.map((e) => [e.slug, e]));
  for (const slug of removedSlugs) bySlug.delete(slug);
  for (const slug of Object.keys(draftEntries)) bySlug.set(slug, draftEntries[slug]);
  return [...bySlug.values()].sort(compare);
}

/**
 * The ordering projects and experience use. BS-3c — `orderIndex` used to be baked into
 * both the type constraint and the sort, which blog cannot satisfy: it has no
 * orderIndex, it orders by `date`, and inventing one would write a key the schema does
 * not declare.
 *
 * The comparator is REQUIRED, not defaulted, for the reason 3a made the image base
 * required: a silent default is exactly how a new collection inherits another's
 * behaviour without anyone noticing. Every caller names its ordering.
 */
export function byOrderIndex<T extends { orderIndex: number }>(a: T, b: T): number {
  return a.orderIndex - b.orderIndex;
}

/**
 * The ordering blog uses — newest first, slug as a stable tiebreak. Deliberately the
 * SAME rule as the public read's selectPublishedPostsNewestFirst, so the studio list and
 * the live list cannot disagree about what "first" means.
 */
export function byDateNewestFirst<T extends { date: string; slug: string }>(a: T, b: T): number {
  return a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date);
}
