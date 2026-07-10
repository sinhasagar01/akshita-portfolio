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
export function overlayCollection<T extends { slug: string; orderIndex: number }>(
  live: T[],
  draftEntries: Record<string, T>,
  removedSlugs: string[]
): T[] {
  const bySlug = new Map<string, T>(live.map((e) => [e.slug, e]));
  for (const slug of removedSlugs) bySlug.delete(slug);
  for (const slug of Object.keys(draftEntries)) bySlug.set(slug, draftEntries[slug]);
  return [...bySlug.values()].sort((a, b) => a.orderIndex - b.orderIndex);
}
