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
import type { ProjectsInput } from "./projects-format";
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
  if (patch.facts !== undefined) obj.facts = patch.facts;
  return { ok: true, bytes: dump(obj, opts) + body };
}
