// CE-2 — projects read-modify-write serialization.
//
// A project file carries a big rich-text `body` block with folded scalars that
// no serializer reproduces byte-for-byte (the files are format-inconsistent). So
// the body is preserved VERBATIM: split at the top-level `body:` key, re-dump
// only the small head (title, summary, orderIndex, heroImage, facts) under the
// js-yaml option that reproduces THIS file's head (auto-detected), then splice
// the original body back. A no-op patch reproduces the file exactly, and
// body/heroImage/orderIndex/title stay byte-identical.
//
// Only js-yaml + type-only imports, so it is unit-exercisable directly.
import { load, dump, type DumpOptions } from "js-yaml";
import type { ProjectsInput, ProjectCreateInput } from "./projects-format";
import type { SaveError } from "./site-settings-format";

export type SerializeResult = { ok: true; bytes: string } | { ok: false; error: SaveError };

const HEAD_DUMP_CANDIDATES: DumpOptions[] = [{}, { lineWidth: -1, quotingType: '"' }];

function splitAtBody(raw: string): { head: string; body: string } {
  // `body:` is at column 0. A folded scalar's continuation lines are indented, so "\nbody:"
  // matches only the key itself.
  //
  // ⚠ THIS SAID "the last top-level key in the schema" AND THAT STOPPED BEING TRUE. `sections` is
  // declared after `body` in keystatic.config.ts, so the tail this returns carries BOTH — which is
  // fine, because the tail is spliced back verbatim and never re-dumped. The split does not depend
  // on `body` being last; it depends on everything after it being preserved untouched, and that is
  // what the name `body` under-describes rather than what the code gets wrong.
  //
  // ⚠ THE HAZARD THE OLD CLAIM HID, MEASURED AND CLOSED ELSEWHERE: if a patch could write a key
  // that lives in the TAIL, the head dump would emit it and the splice would emit it again — a
  // duplicate key. It cannot. `sanitizeProjectsPatch` rejects `body` and `orderIndex` by name and
  // ends `return invalid("unknown field …")`, so `sections` never reaches this function; sections
  // are written by `serializeProjectSections`, which owns the tail.
  //
  // Seventh instance in this repository of correct-looking prose beside code, and the first where
  // the prose was TRUE WHEN WRITTEN and aged out. The other six were false as authored — a
  // DIFFERENT CAUSE with the identical outcome, and the pair of them is the argument that
  // PROXIMITY TO CORRECT CODE IS NO PROTECTION AT ALL. Being written beside the split does not help
  // when the thing that moved is the SCHEMA, three files away and edited by somebody who never
  // opened this one.
  //
  // Nothing depended on this claim, which is exactly why it survived — a claim nothing reads is a
  // claim nothing re-checks.
  const i = raw.indexOf("\nbody:");
  if (i === -1) return { head: raw, body: "" };
  return { head: raw.slice(0, i + 1), body: raw.slice(i + 1) };
}

function detectHeadOptions(head: string): DumpOptions | null {
  const loaded = load(head) ?? {};
  for (const opts of HEAD_DUMP_CANDIDATES) {
    if (dump(loaded, opts) === head) return opts;
  }
  return null;
}

/**
 * Apply a sanitized projects patch (summary and/or facts) to the file text,
 * preserving the body verbatim and every unchanged head field byte-for-byte.
 * Returns unsupported_format if neither candidate reproduces the head — we refuse
 * rather than reformat unchanged content.
 */
export function serializeProjectEntry(
  raw: string,
  patch: Partial<ProjectsInput>
): SerializeResult {
  const { head, body } = splitAtBody(raw);
  const opts = detectHeadOptions(head);
  if (!opts) {
    return {
      ok: false,
      error: {
        code: "unsupported_format",
        message: "this project file has not been migrated to the sections format",
      },
    };
  }
  const obj = (load(head) ?? {}) as Record<string, unknown>;
  if (patch.summary !== undefined) obj.summary = patch.summary;
  // CS-4 — template is a HEAD field. Written only when a valid non-empty value is
  // patched (the sanitizer drops ""), so an existing project with no template is
  // never given one here.
  if (patch.template !== undefined) obj.template = patch.template;
  // Editorial taxonomy (PR 1) — a HEAD field, written only when a valid non-empty
  // value is patched (the sanitizer drops ""), exactly like `template`. Without this
  // line a category patch would validate and then be silently dropped on write.
  if (patch.category !== undefined) obj.category = patch.category;
  // heroImage is a HEAD field (P4-1). The upload route derives the path; clear
  // sets it to null. Keystatic writes an absent image as `heroImage: null`, so
  // null (not delete/omit) keeps the file byte-compatible with Keystatic.
  if (patch.heroImage !== undefined) obj.heroImage = patch.heroImage;
  if (patch.facts !== undefined) {
    // MERGE, not replace: the patch carries only the editable facts (type +
    // platform). Spreading over the existing block keeps the file's other facts
    // (role, timeline) and their key order byte-for-byte, so a locked field is
    // never dropped and an unchanged block still round-trips (Phase-1 T1).
    const existing = (obj.facts ?? {}) as Record<string, unknown>;
    obj.facts = { ...existing, ...patch.facts };
  }
  return { ok: true, bytes: dump(obj, opts) + body };
}

/**
 * Set ONLY `orderIndex`, preserving the body verbatim and every other head field
 * byte-for-byte — the reorder counterpart to serializeProjectEntry.
 *
 * It is a separate function rather than an extra key on the edit patch on
 * purpose: the edit sanitizer explicitly REFUSES orderIndex ("managed by
 * ordering, not editable here"), because a client must never be able to smuggle
 * a position into a content save. Reorder is its own capability with its own
 * server-computed value, exactly as create is.
 */
export function serializeProjectOrder(raw: string, orderIndex: number): SerializeResult {
  const { head, body } = splitAtBody(raw);
  const opts = detectHeadOptions(head);
  if (!opts) {
    return {
      ok: false,
      error: {
        code: "unsupported_format",
        message: "this project file has not been migrated to the sections format",
      },
    };
  }
  const obj = (load(head) ?? {}) as Record<string, unknown>;
  obj.orderIndex = orderIndex;
  return { ok: true, bytes: dump(obj, opts) + body };
}

/**
 * F-3 — serialize a NEW project STUB: head fields plus an empty `body: []`, no
 * mdoc files (locked decision — /studio creates the head, Keystatic authors the
 * rich body). facts is a full four-key block ("" for the ones not provided), in
 * canonical order. heroImage is omitted (the reader coalesces a missing image to
 * null; it is uploaded through /studio). Default js-yaml dump — there is no
 * existing file to match, so this is what a fresh Keystatic entry would look like.
 */
export function serializeNewProject(
  input: ProjectCreateInput,
  orderIndex: number
): SerializeResult {
  const entry: Record<string, unknown> = {
    title: input.title,
    summary: input.summary,
    orderIndex,
    facts: { role: "", type: "", platform: "", timeline: "", ...input.facts },
    // Editorial taxonomy (PR 1), written only when the create provided one, kept in
    // schema order (after facts, before body). Omitted otherwise, matching heroImage.
    ...(input.category !== undefined ? { category: input.category } : {}),
    body: [] as unknown[],
  };
  return { ok: true, bytes: dump(entry) };
}
