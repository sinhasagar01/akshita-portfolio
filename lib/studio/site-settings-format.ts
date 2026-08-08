// Pure transform helpers for the Site Settings write seam.
//
// NODE-RUNNABLE by design: no "use server", no next/cache, and every RELATIVE
// import is type-only, so the ralph proofs can exercise this logic directly under
// `node --experimental-strip-types` rather than copying it. js-yaml is imported
// (serializeSettingsPhoto needs load/dump), which is fine — it is an npm package
// node resolves; only extensionless relative VALUE imports would break that.
import { load, dump } from "js-yaml";

/** One Process stage. The Process section renders a fixed four of these; the
 *  panel edits name, description, and the tags array per stage. */
export type ProcessStage = {
  name: string;
  description: string;
  tags: string[];
};

/** One owner-managed link (item 10). `label` is the display text; `url` is a full
 *  URL. The array replaces the old fixed resume/linkedin/dribbble/behance fields. */
export type LinkItem = {
  label: string;
  url: string;
};

export type SiteSettingsInput = {
  theme: string;
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
  email: string;
  links: LinkItem[];
};

export type SaveErrorCode =
  | "invalid_url"
  // P4 4(b)-iv — a draft whose case-study sections the SSG renderer would refuse
  // (an image the owner added but never uploaded). Caught at publish, never merged.
  | "invalid_sections"
  // BS-3b — a draft blog post whose blocks BlogProse would throw on (a null block, a
  // null value, a richText whose paragraphs is not an array). Caught at publish, never
  // merged. Narrower than invalid_sections by design — see validate-blog-post.ts.
  | "invalid_blocks"
  | "invalid_patch"
  | "read_failed"
  | "write_failed"
  | "not_found"
  | "unsupported_format"
  // F-3 — collection create/delete guards.
  | "invalid_slug" // title has no slug-safe characters
  | "slug_taken" // create against an already-existing entry
  // A reorder whose requested order already matches the stored one. Not a
  // failure — the route reports it as a successful no-op — but it is typed so
  // the lib never has to invent a commit that did not happen.
  | "no_changes";

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
  "theme",
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
  "email",
  "links",
] as const;

/** The writable patch keys — the schema order minus the excluded photo. */
const WRITABLE_FIELDS = SITE_SETTINGS_FIELD_ORDER.filter((k) => k !== "photo");

/** The allowed sub-keys of a process stage object. Extra keys are rejected so a
 *  typo fails loudly, the same contract as the top-level field list. */
const STAGE_KEYS = ["name", "description", "tags"] as const;

/** The allowed sub-keys of a link object (item 10). */
const LINK_KEYS = ["label", "url"] as const;

/**
 * The theme names an author may SET. Mirrors `selectableThemes()` in lib/theme.ts, which this
 * module cannot import for the same plain-Node reason SITE_SETTINGS_FIELD_ORDER is local — it is
 * loaded raw by ralph/tests/settings-photo.mjs. `ralph/tests/theme.mjs` asserts the two agree.
 *
 * ⚠ THE VERIFICATION TWIN IS ABSENT ON PURPOSE. `cream-verify` resolves but is not selectable, so
 * the fixture cannot be published by accident.
 */
/* ⚠ ONE OF THE THREE SURFACES THAT CANNOT IMPORT `lib/theme.ts`, so `ralph/tests/theme.mjs`
 * enforces their agreement. Themes four and five are wedged onto D12's 60 degree floor and a
 * SIXTH CANNOT BE ADDED without lowering it — see FOURTH_THEME in lib/theme.ts. */
const SETTINGS_THEME_VALUES = ["cream", "harbour", "orchid", "cerise", "fern", "sapphire", "nocturne"] as const;
/* ⚠ SAPPHIRE IS ABSENT ON PURPOSE — it is HELD in `lib/theme.ts` until globals.css's raw rungs
 * migrate to roles, so it is resolvable but not publishable. `theme` B3 asserts this list equals
 * `selectableThemes()`, which is what keeps a held palette out of the author's reach. */

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
 * Validate an untrusted links value to a normalized LinkItem[] (item 10). The
 * value must be an array of plain objects with only {label, url}, both strings.
 * Missing sub-keys default to "" (the panel always sends both); wrong types and
 * unknown sub-keys are rejected — the same contract as sanitizeProcessStages.
 * URL FORMAT is validated separately (validateUrlFields), at commit.
 */
function sanitizeLinks(
  value: unknown
): { ok: true; value: LinkItem[] } | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return { ok: false, message: "links must be an array" };
  }
  const links: LinkItem[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { ok: false, message: "each link must be an object" };
    }
    const obj = item as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      if (!(LINK_KEYS as readonly string[]).includes(k)) {
        return { ok: false, message: `unknown link field ${k}` };
      }
    }
    const { label, url } = obj;
    if (label !== undefined && typeof label !== "string") {
      return { ok: false, message: "link label must be a string" };
    }
    if (url !== undefined && typeof url !== "string") {
      return { ok: false, message: "link url must be a string" };
    }
    links.push({ label: (label as string) ?? "", url: (url as string) ?? "" });
  }
  return { ok: true, value: links };
}

/**
 * Validate an untrusted request-body patch down to a typed Partial
 * <SiteSettingsInput>. Unknown keys and wrong-typed values are REJECTED, not
 * silently dropped, so a typo'd field name fails loudly instead of vanishing
 * and a non-string value can never reach the YAML (review finding 5).
 * aboutFocusChips must be an array of strings, processStages an array of stage
 * objects, links an array of {label,url} objects, every other field a string.
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
    if (key === "links") {
      const result = sanitizeLinks(value);
      if (!result.ok) return invalid(result.message, key);
      patch.links = result.value;
      continue;
    }
    if (typeof value !== "string") {
      return invalid(`${key} must be a string`, key);
    }
    /* ⚠ THE LOUD HALF OF THE THEME'S FAIL-CLOSED PAIR. resolveTheme() falls back SILENTLY on the
       public site so a visitor never sees an unthemed page; here the same bad value is REJECTED,
       so an author who misspells a theme is told rather than left wondering why their choice did
       nothing. The two halves are the same rule pointed at two audiences, and one without the
       other is either a broken page or a silent no-op. */
    if (key === "theme" && !(SETTINGS_THEME_VALUES as readonly string[]).includes(value)) {
      return invalid(`unknown theme ${value}`, key);
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
 * Validate the URL of every link (item 10). Each link's `url`, if present and
 * non-empty, must parse with the URL constructor. Returns the first failure, or
 * ok. (email is fields.text, not a url, so it is not validated here.)
 */
export function validateUrlFields(obj: SiteSettingsRecord): SaveResult {
  const links = obj.links;
  if (!Array.isArray(links)) return { ok: true };
  for (const item of links) {
    const url = (item as Record<string, unknown>)?.url;
    if (typeof url === "string" && url.trim() !== "") {
      try {
        new URL(url);
      } catch {
        return {
          ok: false,
          error: {
            code: "invalid_url",
            field: "links",
            message: `"${url}" is not a valid URL`,
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

/**
 * Write ONLY the `photo` field, preserving every other field verbatim — the sole
 * writer for photo. transformSiteSettings skips photo on the patch path and
 * sanitizeSiteSettingsPatch rejects it, so the text editor can never touch the
 * portrait (heroImage's posture on projects). This reuses the SAME strip + reorder
 * pipeline as transformSiteSettings but sets photo, kept apart from that function so
 * the text path's photo-skip stays unconditional.
 *
 * BYTE-SAFE BY THE FILE'S OWN CANONICAL FORM. site-settings.yaml is all head (no
 * body/sections tail to splice around), and commitSiteSettings already re-dumps the
 * whole file on every settings save, so it is js-yaml-dump stable — changing one key
 * and re-dumping touches only that key's line. Proved on the real file against
 * heroCopy's scalar, aboutCopy/aboutNote's folded scalars, the aboutFocusChips and
 * links arrays, and processStages' nested objects (ralph/tests/settings-photo.mjs).
 * Default dump options, matching commitSiteSettings.
 *
 * `photo` is a path to set, or null to clear (stripEmptyOptional leaves null alone,
 * so a cleared photo round-trips as `photo: null`, matching an unset Keystatic image).
 *
 * Lives here, not in a *-serialize sibling, because it must value-reuse strip +
 * reorder AND stay runnable under node --experimental-strip-types for its byte-compat
 * proof; a cross-module value import of those helpers would not resolve there.
 */
export function serializeSettingsPhoto(raw: string, photo: string | null): string {
  const loaded = (load(raw) ?? {}) as SiteSettingsRecord;
  const next: SiteSettingsRecord = { ...loaded, photo };
  stripEmptyOptional(next);
  return dump(reorderBySchema(next));
}
