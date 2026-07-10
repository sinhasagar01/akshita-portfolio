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
  // `body:` is the last top-level key in the schema, always at column 0. A folded
  // scalar's continuation lines are indented, so "\nbody:" matches only the key.
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
        message: "this project file cannot be safely edited here; edit it in Keystatic",
      },
    };
  }
  const obj = (load(head) ?? {}) as Record<string, unknown>;
  if (patch.summary !== undefined) obj.summary = patch.summary;
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
 * F-3 — serialize a NEW project STUB: head fields plus an empty `body: []`, no
 * mdoc files (locked decision — /studio creates the head, Keystatic authors the
 * rich body). facts is a full four-key block ("" for the ones not provided), in
 * canonical order. heroImage is omitted (the reader coalesces a missing image to
 * null; it is uploaded later in Keystatic). Default js-yaml dump — there is no
 * existing file to match, so this is what a fresh Keystatic entry would look like.
 */
export function serializeNewProject(
  input: ProjectCreateInput,
  orderIndex: number
): SerializeResult {
  const entry = {
    title: input.title,
    summary: input.summary,
    orderIndex,
    facts: { role: "", type: "", platform: "", timeline: "", ...input.facts },
    body: [] as unknown[],
  };
  return { ok: true, bytes: dump(entry) };
}
