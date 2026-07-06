// CE-1/CE-2 — collection entry commit for /studio (edit-existing).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first. Reuses
// the shared commitFileToDraft machinery (DB-1 base logic + accumulation, proven
// by the settings path) — only the path and the serialization differ per
// collection. So a collection edit lands on the SAME draft branch as a settings
// edit and both publish together.
import { load, dump } from "js-yaml";
import { commitFileToDraft, type CommitResult } from "./commit-site-settings";
import {
  transformExperiencePatch,
  type ExperienceInput,
  type ExperienceRecord,
} from "./experience-format";
import { serializeProjectEntry } from "./projects-serialize";
import type { ProjectsInput } from "./projects-format";
import type { SaveError } from "./site-settings-format";

export type CollectionName = "experience" | "projects";
export type CollectionPatch = Partial<ExperienceInput> | Partial<ProjectsInput>;

const COLLECTION_PATH: Record<CollectionName, (slug: string) => string> = {
  experience: (slug) => `content/experience/${slug}.yaml`,
  projects: (slug) => `content/projects/${slug}.yaml`,
};

type Serialized = { ok: true; bytes: string } | { ok: false; error: SaveError };

// --- experience: one flat file; empty text writes as "" (quotingType '"'). ---
function serializeExperience(raw: string, patch: Partial<ExperienceInput>): Serialized {
  const loaded = (load(raw) ?? {}) as ExperienceRecord;
  const result = transformExperiencePatch(loaded, patch);
  return { ok: true, bytes: dump(result.value, { quotingType: '"' }) };
}

// --- projects: the file's rich-text `body` block is preserved VERBATIM; only the
// head is re-dumped. The split/detect/splice lives in projects-serialize.ts so it
// can be unit-tested directly. ---

/**
 * Read-modify-write a single collection entry file and commit to the draft
 * branch. Edit-only: if the file is missing at the base (getFileTextAtRef
 * returns "" on 404) it refuses with not_found rather than creating an entry.
 */
export async function commitCollectionEntry(
  collection: CollectionName,
  slug: string,
  patch: CollectionPatch,
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  const path = COLLECTION_PATH[collection](slug);
  return commitFileToDraft({
    path,
    branch: opts.branch,
    message: opts.message ?? `chore(studio): update ${collection}/${slug}`,
    transform: (raw) => {
      if (raw.trim() === "") {
        return {
          ok: false,
          error: {
            code: "not_found",
            field: slug,
            message: `${collection} entry "${slug}" not found`,
          },
        };
      }
      return collection === "projects"
        ? serializeProjectEntry(raw, patch as Partial<ProjectsInput>)
        : serializeExperience(raw, patch as Partial<ExperienceInput>);
    },
  });
}

export type { CommitResult };
