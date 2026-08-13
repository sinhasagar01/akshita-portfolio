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

/** One skill row. `glow` is the word the public section reveals on hover; an empty string is a
 *  DEFINED state (no glow) rather than a missing one, which is why it is not optional. */
export type SkillItem = { name: string; glow: string };
export type SkillsCategory = { category: string; items: SkillItem[] };
export type SkillsInput = { categories: SkillsCategory[] };

const CATEGORY_KEYS = ["category", "items"] as const;
/** The keys of one skill row, mirroring the schema's `fields.object({ name, glow })`. */
const ITEM_KEYS = ["name", "glow"] as const;

/** Validate an untrusted categories value to a normalized SkillsCategory[]: an array of plain
 *  objects with only {category, items}, category a string, items an array of {name, glow}.
 *
 *  ---- ⚠ THIS ASSERTED `items` WAS AN ARRAY OF STRINGS, AND EVERY SKILLS SAVE FAILED FOR TWO DAYS
 *
 *  `47e59f1` (2026-08-12) made a skill an OBJECT — `{ name, glow }` — and moved THREE of the four
 *  places that describe the shape: `keystatic.config.ts`, `SkillsEditor.tsx` and
 *  `content/skills.yaml`. It did not touch this file, BECAUSE THE CHANGE HAD NO REASON TO OPEN IT.
 *
 *  The form has posted objects ever since, so `items.some(i => typeof i !== "string")` refused
 *  EVERY save — not only ones adding a glow word. The owner found it adding a glow word; the panel
 *  had been unable to save anything since.
 *
 *  ⚠ AND THE ERROR MESSAGE WAS CORRECT THE WHOLE TIME. "category items must be an array of strings"
 *  names the right field and the right rule; the rule had simply stopped being true. A message that
 *  accurately describes an obsolete contract is the hardest kind to diagnose from, because nothing
 *  about it looks wrong.
 *
 *  ⚠ NOTE THE TYPE WAS ON THE STRING SHAPE TOO — `items: string[]` — which is what let
 *  `items as string[]` compile. FOUR lists said string, ONE said object, and TypeScript was on the
 *  wrong side, so the coercion silenced the only check that could have caught it. */
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
    /* ⚠ EACH ITEM IS AN OBJECT, VALIDATED FIELD BY FIELD — the same posture the rest of this file
       takes for a category. Unknown sub-keys are refused rather than dropped, so a fifth field
       added to the schema fails loudly here instead of being silently discarded on save. */
    const cleanItems: SkillItem[] = [];
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return { ok: false, message: "category items must be an array" };
      }
      for (const raw of items) {
        if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
          return { ok: false, message: "each skill must be an object with a name and a glow word" };
        }
        const it = raw as Record<string, unknown>;
        for (const k of Object.keys(it)) {
          if (!(ITEM_KEYS as readonly string[]).includes(k)) {
            return { ok: false, message: `unknown skill field ${k}` };
          }
        }
        /* ⚠ `null` IS THE EMPTY STATE ON DISK AND MUST BE ACCEPTED, NOT REFUSED. A blank value in
           YAML loads as `null`, not `""` — `content/skills.yaml` carries two of them today
           ("Claude Design" and "Claude Code" have `glow:` with nothing after it). A first draft of
           this fix demanded a string and REFUSED THE LIVE CONTENT, which would have traded a loud
           failure for a quieter one: the panel would save only for an owner who had never left a
           glow blank. Caught by driving the real file through it rather than a fixture.
           Both fields normalise to "" so the form, which types both as `string`, gets what it
           expects — an empty glow is a DEFINED state, and `SkillsEditor` drops a row on a blank
           NAME rather than a blank glow. */
        if (it.name !== undefined && it.name !== null && typeof it.name !== "string") {
          return { ok: false, message: "skill name must be a string" };
        }
        if (it.glow !== undefined && it.glow !== null && typeof it.glow !== "string") {
          return { ok: false, message: "skill glow word must be a string" };
        }
        cleanItems.push({
          name: typeof it.name === "string" ? it.name : "",
          glow: typeof it.glow === "string" ? it.glow : "",
        });
      }
    }
    categories.push({
      category: (category as string) ?? "",
      items: cleanItems,
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
