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
  // Only the EDITABLE facts subset (type + platform) is ever written through this
  // path; role + timeline are preserved from the file by the serializer's merge.
  facts: Partial<ProjectFacts>;
  // heroImage is a HEAD path string, written ONLY by the P4-1 image-upload route
  // (server-derived path, never from a client text patch — sanitizeProjectsPatch
  // still rejects it). null clears the image. Optional so the text path omits it.
  heroImage?: string | null;
  // CS-4 — the case-study template that derives the default image frame. Optional
  // and omit-when-empty: the sanitizer drops "" so it is never written for a project
  // that has no template. No /studio surface sets it yet (CS-5 wires the UI).
  template?: "mobile" | "web";
  // Editorial taxonomy for the work-section filter (PR 1). Same optional +
  // omit-when-empty contract as `template`, enum enforced below. A separate axis
  // from `template` on purpose — see keystatic.config.ts.
  category?: "mobile" | "web";
  // Whether readers can click this study's images to zoom them. A BOOLEAN, so unlike the two
  // above it has no "unset" spelling and is written on both values — see the sanitizer.
  imagePreview?: boolean;
};

/** CS-4 — the case-study template enum. The template->frame MAPPING is the
 *  adapter's single source; this const only validates the value on the write path. */
export const TEMPLATES = ["mobile", "web"] as const;

/** Editorial taxonomy enum for the work-section filter (PR 1). Same values as
 *  TEMPLATES but a deliberately separate axis — see keystatic.config.ts. Only
 *  validates the write path; nothing reads it yet. */
export const CATEGORIES = ["mobile", "web"] as const;

/** The full facts sub-keys, in canonical schema order. role + timeline remain
 *  valid data but are NOT editable through /studio (Phase-1 T1). */
export const PROJECT_FACTS_KEYS = ["role", "type", "platform", "timeline"] as const;

/** The facts sub-keys that stay EDITABLE through the /studio panel. */
export const EDITABLE_FACTS_KEYS = ["type", "platform"] as const;

/** Validate a facts patch: only type + platform are accepted. role + timeline
 *  are known-but-locked (rejected with a distinct reason so a caller knows they
 *  are intentionally not editable, not a typo); any other key is unknown. All
 *  accepted values must be strings. Returns only the provided editable keys, so
 *  the serializer merges them over the file and leaves role + timeline intact. */
function sanitizeFacts(
  value: unknown
): { ok: true; value: Partial<ProjectFacts> } | { ok: false; message: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, message: "facts must be an object" };
  }
  const obj = value as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    if (!(EDITABLE_FACTS_KEYS as readonly string[]).includes(k)) {
      const locked = (PROJECT_FACTS_KEYS as readonly string[]).includes(k);
      return {
        ok: false,
        message: locked ? `facts.${k} is not editable here` : `unknown facts field ${k}`,
      };
    }
  }
  for (const k of EDITABLE_FACTS_KEYS) {
    if (obj[k] !== undefined && typeof obj[k] !== "string") {
      return { ok: false, message: `facts.${k} must be a string` };
    }
  }
  const out: Partial<ProjectFacts> = {};
  for (const k of EDITABLE_FACTS_KEYS) {
    if (typeof obj[k] === "string") out[k] = obj[k] as string;
  }
  return { ok: true, value: out };
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
      // Rejected on the TEXT path by design: heroImage is written only by the
      // owner-gated image-upload route, which derives the path server-side. A
      // client text patch can never inject an arbitrary image path.
      return invalid("heroImage is uploaded through the image route, not this patch", key);
    }
    if (key === "body") {
      return invalid("body is legacy and unused, the case study renders from sections", key);
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
    if (key === "template") {
      // Strict enum, omit-when-empty: "" is dropped (never written), a non-empty
      // value must be a valid template, anything else is rejected.
      if (typeof value !== "string") return invalid("template must be a string", key);
      if (value !== "" && !(TEMPLATES as readonly string[]).includes(value)) {
        return invalid(`template must be one of ${TEMPLATES.join(", ")}`, key);
      }
      if (value !== "") patch.template = value as ProjectsInput["template"];
      continue;
    }
    if (key === "category") {
      // Strict enum, omit-when-empty — the exact contract as `template` above.
      if (typeof value !== "string") return invalid("category must be a string", key);
      if (value !== "" && !(CATEGORIES as readonly string[]).includes(value)) {
        return invalid(`category must be one of ${CATEGORIES.join(", ")}`, key);
      }
      if (value !== "") patch.category = value as ProjectsInput["category"];
      continue;
    }
    if (key === "imagePreview") {
      /* ⚠ A BOOLEAN, AND IT IS ACCEPTED WHEN FALSE — which is why it does NOT follow the
         omit-when-empty contract `template` and `category` use. Those two drop "" because an empty
         enum means "unset"; here BOTH states are meaningful and `false` is the one the owner is
         actually reaching for. Dropping it would make the off switch silently do nothing, which is
         the shape this studio has already shipped once in its blog status control. */
      if (typeof value !== "boolean") return invalid("imagePreview must be a boolean", key);
      patch.imagePreview = value;
      continue;
    }
    return invalid(`unknown field ${key}`, key);
  }
  return { ok: true, patch };
}

// F-3 — what a project CREATE accepts. title is the slug seed (the create path
// derives the filename from it) and the human name in the yaml. orderIndex, body,
// and heroImage are NOT accepted: orderIndex is server-assigned, body is the
// Keystatic-owned rich content (the stub writes body: []), heroImage is uploaded
// through /studio. facts is limited to the same editable subset as an edit.
export type ProjectCreateInput = {
  title: string;
  summary: string;
  facts: Partial<ProjectFacts>;
  // Optional editorial taxonomy (PR 1). Omit-when-empty like the patch path, so a
  // create that does not send it produces a project with no `category` key.
  category?: "mobile" | "web";
  // Whether readers can click this study's images to zoom them. A BOOLEAN, so unlike the two
  // above it has no "unset" spelling and is written on both values — see the sanitizer.
  imagePreview?: boolean;
};

/**
 * F-3 — validate an untrusted project CREATE input. title is REQUIRED (it seeds
 * the slug and is the entry name), summary is optional and defaults to "", facts
 * reuses the editable-subset gate, and orderIndex/body/heroImage are rejected as
 * server- or Keystatic-owned. Returns a fully-populated ProjectCreateInput.
 */
export function sanitizeProjectCreate(
  raw: unknown
): { ok: true; value: ProjectCreateInput } | { ok: false; error: SaveError } {
  const invalid = (message: string, field?: string) =>
    ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("create input must be an object");
  }
  const obj = raw as Record<string, unknown>;
  let facts: Partial<ProjectFacts> = {};
  let category: ProjectCreateInput["category"];
  for (const [key, value] of Object.entries(obj)) {
    if (key === "orderIndex") return invalid("orderIndex is assigned by the server on create", key);
    if (key === "body") return invalid("body is a legacy field, created empty and unused", key);
    if (key === "heroImage") return invalid("heroImage is uploaded after create, not on create", key);
    if (key === "facts") {
      const result = sanitizeFacts(value);
      if (!result.ok) return invalid(result.message, key);
      facts = result.value;
      continue;
    }
    if (key === "category") {
      // Strict enum, omit-when-empty — the same contract as the edit path.
      if (typeof value !== "string") return invalid("category must be a string", key);
      if (value !== "" && !(CATEGORIES as readonly string[]).includes(value)) {
        return invalid(`category must be one of ${CATEGORIES.join(", ")}`, key);
      }
      if (value !== "") category = value as ProjectCreateInput["category"];
      continue;
    }
    if (key === "title" || key === "summary") {
      if (typeof value !== "string") return invalid(`${key} must be a string`, key);
      continue;
    }
    return invalid(`unknown field ${key}`, key);
  }
  if (typeof obj.title !== "string" || obj.title.trim() === "") {
    return invalid("title is required to create a project", "title");
  }
  return {
    ok: true,
    value: {
      title: obj.title as string,
      summary: (obj.summary as string | undefined) ?? "",
      facts,
      ...(category !== undefined ? { category } : {}),
    },
  };
}
