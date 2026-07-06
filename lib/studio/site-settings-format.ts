// Pure transform helpers for the Site Settings write seam.
//
// This module is intentionally dependency-free: no "use server", no next/cache,
// no @-alias imports, no js-yaml. That keeps it importable from plain Node
// (e.g. a proof script run with `node --experimental-strip-types`), so the same
// logic the server action uses can be exercised directly rather than copied.

/**
 * Writable Site Settings fields. `photo` is deliberately excluded so the write
 * path can never touch or clear the image field.
 */
/** One Process stage. The Process section renders a fixed four of these; the
 *  panel edits name, description, and the tags array per stage. */
export type ProcessStage = {
  name: string;
  description: string;
  tags: string[];
};

export type SiteSettingsInput = {
  heroCopy: string;
  tab1Label: string;
  tab1Line: string;
  tab2Label: string;
  tab2Line: string;
  tab3Label: string;
  tab3Line: string;
  tab4Label: string;
  tab4Line: string;
  heroRoleLabel: string;
  heroScrollCue: string;
  aboutCopy: string;
  aboutNote: string;
  aboutFocusChips: string[];
  aboutSubtext: string;
  aboutPhotoCaption: string;
  processStages: ProcessStage[];
  resumeUrl: string;
  email: string;
  linkedinUrl: string;
  dribbbleUrl: string;
  behanceUrl: string;
};

export type SaveErrorCode = "invalid_url" | "invalid_patch" | "read_failed" | "write_failed";

export type SaveError = {
  code: SaveErrorCode;
  field?: string;
  message: string;
};

export type SaveResult = { ok: true } | { ok: false; error: SaveError };

/** The loaded YAML is an arbitrary record; we operate on it structurally. */
export type SiteSettingsRecord = Record<string, unknown>;

/**
 * Canonical key order, mirroring the siteSettings schema in keystatic.config.ts.
 * Kept as a local constant (not imported from the config) so this module stays
 * plain-Node importable. If the schema field order changes, update this too.
 */
export const SITE_SETTINGS_FIELD_ORDER = [
  "heroCopy",
  "tab1Label",
  "tab1Line",
  "tab2Label",
  "tab2Line",
  "tab3Label",
  "tab3Line",
  "tab4Label",
  "tab4Line",
  "heroRoleLabel",
  "heroScrollCue",
  "photo",
  "aboutCopy",
  "aboutNote",
  "aboutFocusChips",
  "aboutSubtext",
  "aboutPhotoCaption",
  "processStages",
  "resumeUrl",
  "email",
  "linkedinUrl",
  "dribbbleUrl",
  "behanceUrl",
] as const;

/** The fields.url() fields in the schema — validated as URLs when present. */
export const URL_FIELDS = [
  "resumeUrl",
  "linkedinUrl",
  "dribbbleUrl",
  "behanceUrl",
] as const;

/** The writable patch keys — the schema order minus the excluded photo. */
const WRITABLE_FIELDS = SITE_SETTINGS_FIELD_ORDER.filter((k) => k !== "photo");

/** The allowed sub-keys of a process stage object. Extra keys are rejected so a
 *  typo fails loudly, the same contract as the top-level field list. */
const STAGE_KEYS = ["name", "description", "tags"] as const;

/**
 * Validate an untrusted processStages value to a normalized ProcessStage[].
 * The nested analogue of the aboutFocusChips array check: the value must be an
 * array of plain objects with only {name, description, tags}, name/description
 * strings, and tags an array of strings. Missing sub-keys default (the panel
 * always sends all three); wrong types and unknown sub-keys are rejected.
 */
function sanitizeProcessStages(
  value: unknown
): { ok: true; value: ProcessStage[] } | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return { ok: false, message: "processStages must be an array" };
  }
  const stages: ProcessStage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { ok: false, message: "each process stage must be an object" };
    }
    const obj = item as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      if (!(STAGE_KEYS as readonly string[]).includes(k)) {
        return { ok: false, message: `unknown process stage field ${k}` };
      }
    }
    const { name, description, tags } = obj;
    if (name !== undefined && typeof name !== "string") {
      return { ok: false, message: "process stage name must be a string" };
    }
    if (description !== undefined && typeof description !== "string") {
      return { ok: false, message: "process stage description must be a string" };
    }
    if (
      tags !== undefined &&
      (!Array.isArray(tags) || tags.some((t) => typeof t !== "string"))
    ) {
      return { ok: false, message: "process stage tags must be an array of strings" };
    }
    stages.push({
      name: (name as string) ?? "",
      description: (description as string) ?? "",
      tags: (tags as string[]) ?? [],
    });
  }
  return { ok: true, value: stages };
}

/**
 * Validate an untrusted request-body patch down to a typed Partial
 * <SiteSettingsInput>. Unknown keys and wrong-typed values are REJECTED, not
 * silently dropped, so a typo'd field name fails loudly instead of vanishing
 * and a non-string value can never reach the YAML (review finding 5).
 * aboutFocusChips must be an array of strings, processStages an array of stage
 * objects, every other field a string.
 */
export function sanitizeSiteSettingsPatch(
  raw: unknown
): { ok: true; patch: Partial<SiteSettingsInput> } | { ok: false; error: SaveError } {
  const invalid = (message: string, field?: string) =>
    ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("patch must be an object");
  }
  const patch: Partial<SiteSettingsInput> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(WRITABLE_FIELDS as readonly string[]).includes(key)) {
      return invalid(`unknown field ${key}`, key);
    }
    if (key === "aboutFocusChips") {
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
        return invalid("aboutFocusChips must be an array of strings", key);
      }
      patch.aboutFocusChips = value as string[];
      continue;
    }
    if (key === "processStages") {
      const result = sanitizeProcessStages(value);
      if (!result.ok) return invalid(result.message, key);
      patch.processStages = result.value;
      continue;
    }
    if (typeof value !== "string") {
      return invalid(`${key} must be a string`, key);
    }
    (patch as Record<string, unknown>)[key] = value;
  }
  return { ok: true, patch };
}

/**
 * Delete every string key whose value is empty or whitespace only. Every
 * siteSettings field is optional, and Keystatic omits empty optional fields
 * from the file (serialize() returns undefined, which "will generally not be
 * written"), so to stay byte-compatible we remove the key rather than write ""
 * or null. Arrays and other non-string values are left untouched. Mutates and
 * returns the same object.
 */
export function stripEmptyOptional(obj: SiteSettingsRecord): SiteSettingsRecord {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "string" && value.trim() === "") {
      delete obj[key];
    }
  }
  return obj;
}

/**
 * Validate the url fields. Each one, if present and non-empty, must parse with
 * the URL constructor. Returns the first failure, or ok.
 */
export function validateUrlFields(obj: SiteSettingsRecord): SaveResult {
  for (const field of URL_FIELDS) {
    const value = obj[field];
    if (typeof value === "string" && value.trim() !== "") {
      try {
        new URL(value);
      } catch {
        return {
          ok: false,
          error: {
            code: "invalid_url",
            field,
            message: `${field} is not a valid URL`,
          },
        };
      }
    }
  }
  return { ok: true };
}

/**
 * Rebuild the object with keys in the canonical schema order. js-yaml preserves
 * insertion order, so this keeps a first-time-set of a previously-absent field
 * in the position Keystatic would use, rather than appended at the end. Only
 * present keys are emitted; any unexpected extra key is appended defensively.
 */
export function reorderBySchema(obj: SiteSettingsRecord): SiteSettingsRecord {
  const ordered: SiteSettingsRecord = {};
  for (const key of SITE_SETTINGS_FIELD_ORDER) {
    if (key in obj) ordered[key] = obj[key];
  }
  for (const key of Object.keys(obj)) {
    if (!(key in ordered)) ordered[key] = obj[key];
  }
  return ordered;
}

/**
 * Apply a patch over the loaded object, then strip empties, validate urls, and
 * reorder. Pure: never reads or writes the filesystem. Returns the object to
 * serialize, or a validation error. `photo` is never applied from the patch, so
 * the loaded photo value is always preserved.
 */
export function transformSiteSettings(
  loaded: SiteSettingsRecord,
  patch: Partial<SiteSettingsInput>
): { ok: true; value: SiteSettingsRecord } | { ok: false; error: SaveError } {
  const next: SiteSettingsRecord = { ...loaded };

  for (const [key, value] of Object.entries(patch)) {
    if (key === "photo") continue; // defensive: never let the patch touch photo
    if (value !== undefined) next[key] = value;
  }

  stripEmptyOptional(next);

  const urlCheck = validateUrlFields(next);
  if (!urlCheck.ok) return urlCheck;

  return { ok: true, value: reorderBySchema(next) };
}
