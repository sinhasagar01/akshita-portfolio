// CE-1 — pure transform + sanitizer for the experience collection write path.
//
// Mirrors site-settings-format.ts: dependency-free (no "use server", no
// next/cache, no @-alias imports, no js-yaml), so the same logic the route uses
// can be unit-exercised directly. One flat file per entry
// (content/experience/<slug>.yaml); this edits the four non-slug text fields.
import type { SaveError } from "./site-settings-format";

export type ExperienceInput = {
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
};

export type ExperienceRecord = Record<string, unknown>;

/** Canonical key order, mirroring the experience collection schema in
 *  keystatic.config.ts. company (the slug) and orderIndex are preserved but not
 *  editable in CE-1. */
export const EXPERIENCE_FIELD_ORDER = [
  "company",
  "title",
  "startDate",
  "endDate",
  "description",
  "location",
  "orderIndex",
] as const;

/** The editable fields — the non-slug text fields. company is the slug (editing
 *  it renames the file) and orderIndex is set by reorder, so both are refused
 *  here. description IS editable: the site renders it as the role's bullet lines
 *  (one per newline), and it had no editor at all, so those lines could not be
 *  written from /studio. location overrides the city parsed from the company name. */
export const EXPERIENCE_EDITABLE_FIELDS = [
  "title",
  "startDate",
  "endDate",
  "description",
  "location",
] as const;

/**
 * Validate an untrusted experience patch to a typed Partial<ExperienceInput>.
 * Same contract as the settings sanitizer: known editable keys, string-typed,
 * unknowns rejected. company and orderIndex get distinct reasons so a caller
 * knows they are intentionally not editable here (not a typo).
 */
export function sanitizeExperiencePatch(
  raw: unknown
): { ok: true; patch: Partial<ExperienceInput> } | { ok: false; error: SaveError } {
  const invalid = (message: string, field?: string) =>
    ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("patch must be an object");
  }
  const patch: Partial<ExperienceInput> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "company") {
      return invalid("company is the entry slug and cannot be edited here", key);
    }
    if (key === "orderIndex") {
      // Number field. Reorder is a separate arc; orderIndex is preserved
      // untouched, not edited through this path (a number branch lands there).
      return invalid("orderIndex is managed by ordering, not editable here", key);
    }
    if (!(EXPERIENCE_EDITABLE_FIELDS as readonly string[]).includes(key)) {
      return invalid(`unknown field ${key}`, key);
    }
    if (typeof value !== "string") {
      return invalid(`${key} must be a string`, key);
    }
    (patch as Record<string, unknown>)[key] = value;
  }
  return { ok: true, patch };
}

// F-3 — the fields a CREATE accepts. company is the slug seed (the create path
// derives the filename from it); orderIndex is assigned by the server, so it is
// NOT accepted here (the edit sanitizer above also rejects it, for editing).
export type ExperienceCreateInput = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
};

const EXPERIENCE_CREATE_FIELDS = [
  "company",
  "title",
  "startDate",
  "endDate",
  "description",
  "location",
] as const;

/**
 * F-3 — validate an untrusted experience CREATE input. The edit sanitizer rejects
 * company + orderIndex, so create needs its own gate: company is REQUIRED (it
 * seeds the slug), the other text fields are optional and default to "", every
 * present value must be a string, orderIndex is rejected (server-assigned), and
 * unknown keys are rejected. Returns a fully-populated ExperienceCreateInput.
 */
export function sanitizeExperienceCreate(
  raw: unknown
): { ok: true; value: ExperienceCreateInput } | { ok: false; error: SaveError } {
  const invalid = (message: string, field?: string) =>
    ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("create input must be an object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key === "orderIndex") {
      return invalid("orderIndex is assigned by the server on create", key);
    }
    if (!(EXPERIENCE_CREATE_FIELDS as readonly string[]).includes(key)) {
      return invalid(`unknown field ${key}`, key);
    }
    if (typeof obj[key] !== "string") {
      return invalid(`${key} must be a string`, key);
    }
  }
  if (typeof obj.company !== "string" || obj.company.trim() === "") {
    return invalid("company is required to create an experience entry", "company");
  }
  return {
    ok: true,
    value: {
      company: obj.company as string,
      title: (obj.title as string | undefined) ?? "",
      startDate: (obj.startDate as string | undefined) ?? "",
      endDate: (obj.endDate as string | undefined) ?? "",
      description: (obj.description as string | undefined) ?? "",
      location: (obj.location as string | undefined) ?? "",
    },
  };
}

/**
 * Rebuild the object in canonical schema order, including only present keys.
 * Any unexpected extra key is appended defensively.
 */
function reorderExperience(obj: ExperienceRecord): ExperienceRecord {
  const ordered: ExperienceRecord = {};
  for (const key of EXPERIENCE_FIELD_ORDER) {
    if (key in obj) ordered[key] = obj[key];
  }
  for (const key of Object.keys(obj)) {
    if (!(key in ordered)) ordered[key] = obj[key];
  }
  return ordered;
}

/**
 * Apply a sanitized patch over the loaded entry and reorder. Preserves every
 * untouched field (company, orderIndex) exactly. NO strip and NO url validation:
 * a collection entry writes all its fields, and an empty text field is written
 * as "" (not omitted) to match Keystatic — so nothing is deleted here. The
 * caller dumps with quotingType '"' for byte-compat with Keystatic's output.
 */
export function transformExperiencePatch(
  loaded: ExperienceRecord,
  patch: Partial<ExperienceInput>
): { ok: true; value: ExperienceRecord } {
  const next: ExperienceRecord = { ...loaded };
  for (const [key, value] of Object.entries(patch)) {
    next[key] = value;
  }
  return { ok: true, value: reorderExperience(next) };
}
