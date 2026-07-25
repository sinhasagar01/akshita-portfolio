/**
 * Pure next-by-orderIndex resolver for the next-case rail (NCR-1, step 1).
 *
 * The rail links to the following case study in the `projects` collection, ordered
 * by `orderIndex` ascending and wrapping last -> first. This is the ONE place that
 * order is derived, and it is deliberately pure: it sorts a COPY of the input (never
 * mutating it, never trusting the caller's order) so the async reader wrapper and the
 * unit suite exercise the exact same logic.
 *
 * Returns null when the slug is unknown or the collection has fewer than two entries,
 * so a caller renders no rail rather than a link to itself.
 */
export function adjacentByOrderIndex<T extends { slug: string; orderIndex: number }>(
  projects: readonly T[],
  slug: string,
): T | null {
  if (projects.length < 2) return null;
  const sorted = [...projects].sort((a, b) => a.orderIndex - b.orderIndex);
  const i = sorted.findIndex((p) => p.slug === slug);
  if (i === -1) return null;
  return sorted[(i + 1) % sorted.length];
}
