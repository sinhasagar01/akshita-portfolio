// SK-2 — pure sanitizer for the skills singleton write path.
//
// Mirrors experience-format.ts / projects-format.ts: dependency-free (no js-yaml,
// no @-alias imports), so it is unit-exercisable directly. The js-yaml
// read-modify-write lives in commit-skills.ts.
//
// The skills singleton is edited as a WHOLE: each save carries the full
// `categories` array (the locked patch shape), so the sanitizer validates the
// entire nested array-of-objects-with-inner-array — the same shape sanitizeProcessStages
// validates, minus the description field.
import type { SaveError } from "./site-settings-format";

export type SkillsCategory = { category: string; items: string[] };
export type SkillsInput = { categories: SkillsCategory[] };

const CATEGORY_KEYS = ["category", "items"] as const;

/** Validate an untrusted categories value to a normalized SkillsCategory[]: an
 *  array of plain objects with only {category, items}, category a string, items
 *  an array of strings. Wrong types and unknown sub-keys are rejected. */
function sanitizeCategories(
  value: unknown
): { ok: true; value: SkillsCategory[] } | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return { ok: false, message: "categories must be an array" };
  }
  const categories: SkillsCategory[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { ok: false, message: "each category must be an object" };
    }
    const obj = item as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      if (!(CATEGORY_KEYS as readonly string[]).includes(k)) {
        return { ok: false, message: `unknown category field ${k}` };
      }
    }
    const { category, items } = obj;
    if (category !== undefined && typeof category !== "string") {
      return { ok: false, message: "category name must be a string" };
    }
    if (
      items !== undefined &&
      (!Array.isArray(items) || items.some((i) => typeof i !== "string"))
    ) {
      return { ok: false, message: "category items must be an array of strings" };
    }
    categories.push({
      category: (category as string) ?? "",
      items: (items as string[]) ?? [],
    });
  }
  return { ok: true, value: categories };
}

/**
 * Validate an untrusted skills patch. The body is an object whose ONLY key is
 * `categories` (any other top-level key is rejected, not silently dropped).
 * Returns the clean categories array. Same contract as the other sanitizers:
 * unknown keys and wrong-typed values fail loudly.
 */
export function sanitizeSkillsPatch(
  raw: unknown
): { ok: true; categories: SkillsCategory[] } | { ok: false; error: SaveError } {
  const invalid = (message: string, field?: string) =>
    ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("patch must be an object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key !== "categories") return invalid(`unknown field ${key}`, key);
  }
  if (obj.categories === undefined) {
    return invalid("categories is required", "categories");
  }
  const result = sanitizeCategories(obj.categories);
  if (!result.ok) return invalid(result.message, "categories");
  return { ok: true, categories: result.value };
}
