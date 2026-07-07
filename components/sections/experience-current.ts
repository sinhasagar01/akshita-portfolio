// Phase-1 T3 — pure "Currently" selection for the experience section.
//
// Extracted from ExperienceSection so the behavioral rule is unit-testable
// (the section itself is JSX and cannot be imported by a plain node test).
// Dependency-free and generic over `{ endDate }`, so no @-alias or type imports.

/** An entry is "current" when its endDate is empty/whitespace OR equals
 *  "Present" (case-insensitive). No other value counts (Phase-1 T3). */
export function isCurrentRole(endDate: string): boolean {
  const d = endDate.trim().toLowerCase();
  return d === "" || d === "present";
}

/**
 * Pick the single current entry (the first that isCurrentRole) as the feature,
 * or null when none is current — there is NO forced experience[0] fallback, so
 * when nothing is current no badge shows and every entry renders under Previously.
 */
export function selectCurrentExperience<T extends { endDate: string }>(
  experience: T[]
): { feature: T | null; previous: T[] } {
  const feature = experience.find((e) => isCurrentRole(e.endDate)) ?? null;
  const previous = feature ? experience.filter((e) => e !== feature) : experience;
  return { feature, previous };
}
