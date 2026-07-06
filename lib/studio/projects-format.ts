// CE-2 — pure sanitizer for the projects collection write path.
//
// Mirrors experience-format.ts: dependency-free (no js-yaml, no @-alias imports),
// so it is unit-exercisable directly. Edits the two non-slug, non-image,
// non-body fields of a project entry: `summary` (string) and `facts` (a nested
// object of four strings). The js-yaml read-modify-write (which must preserve the
// untouchable `body` block byte-for-byte) lives in commit-collection-entry.ts.
import type { SaveError } from "./site-settings-format";

export type ProjectFacts = {
  role: string;
  type: string;
  platform: string;
  timeline: string;
};

export type ProjectsInput = {
  summary: string;
  facts: ProjectFacts;
};

/** The facts sub-keys, in canonical schema order (so an unchanged facts block
 *  dumps identically to the original). */
export const PROJECT_FACTS_KEYS = ["role", "type", "platform", "timeline"] as const;

/** Validate a facts object: keys ⊆ the four known ones, all strings, unknown
 *  sub-keys / wrong types rejected. Normalized to canonical key order. */
function sanitizeFacts(
  value: unknown
): { ok: true; value: ProjectFacts } | { ok: false; message: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, message: "facts must be an object" };
  }
  const obj = value as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    if (!(PROJECT_FACTS_KEYS as readonly string[]).includes(k)) {
      return { ok: false, message: `unknown facts field ${k}` };
    }
  }
  for (const k of PROJECT_FACTS_KEYS) {
    if (obj[k] !== undefined && typeof obj[k] !== "string") {
      return { ok: false, message: `facts.${k} must be a string` };
    }
  }
  return {
    ok: true,
    value: {
      role: (obj.role as string) ?? "",
      type: (obj.type as string) ?? "",
      platform: (obj.platform as string) ?? "",
      timeline: (obj.timeline as string) ?? "",
    },
  };
}

/**
 * Validate an untrusted projects patch to a typed Partial<ProjectsInput>. Same
 * contract as the experience sanitizer: known editable keys, correctly typed,
 * unknowns rejected. title/heroImage/body/orderIndex get distinct reasons so a
 * caller knows they are intentionally not editable through this path (not a typo).
 */
export function sanitizeProjectsPatch(
  raw: unknown
): { ok: true; patch: Partial<ProjectsInput> } | { ok: false; error: SaveError } {
  const invalid = (message: string, field?: string) =>
    ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("patch must be an object");
  }
  const patch: Partial<ProjectsInput> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "title") {
      return invalid("title is the entry slug and cannot be edited here", key);
    }
    if (key === "heroImage") {
      return invalid("heroImage is an image, edited in Keystatic", key);
    }
    if (key === "body") {
      return invalid("body is the case study content, edited in Keystatic", key);
    }
    if (key === "orderIndex") {
      return invalid("orderIndex is managed by ordering, not editable here", key);
    }
    if (key === "facts") {
      const result = sanitizeFacts(value);
      if (!result.ok) return invalid(result.message, key);
      patch.facts = result.value;
      continue;
    }
    if (key === "summary") {
      if (typeof value !== "string") return invalid("summary must be a string", key);
      patch.summary = value;
      continue;
    }
    return invalid(`unknown field ${key}`, key);
  }
  return { ok: true, patch };
}
