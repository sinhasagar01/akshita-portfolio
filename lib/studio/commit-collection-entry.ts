// CE-1 — collection entry commit for /studio (experience only, edit-existing).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first. Reuses
// the shared commitFileToDraft machinery (DB-1 base logic + accumulation, proven
// by the settings path) — only the path and the transform/dump differ per
// collection. So an experience edit lands on the SAME draft branch as a settings
// edit and both publish together.
import { load, dump } from "js-yaml";
import { commitFileToDraft, type CommitResult } from "./commit-site-settings";
import {
  transformExperiencePatch,
  type ExperienceInput,
  type ExperienceRecord,
} from "./experience-format";

export type CollectionName = "experience";

const COLLECTION_PATH: Record<CollectionName, (slug: string) => string> = {
  experience: (slug) => `content/experience/${slug}.yaml`,
};

/**
 * Read-modify-write a single collection entry file and commit to the draft
 * branch. Edit-only: if the file is missing at the base (getFileTextAtRef
 * returns "" on 404) it refuses with not_found rather than creating an entry —
 * create/delete/reorder are separate arcs. Dumps with quotingType '"' so the
 * bytes match Keystatic's output (empty text fields as "" not '').
 */
export async function commitCollectionEntry(
  collection: CollectionName,
  slug: string,
  patch: Partial<ExperienceInput>,
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
      const loaded = (load(raw) ?? {}) as ExperienceRecord;
      const result = transformExperiencePatch(loaded, patch);
      return { ok: true, bytes: dump(result.value, { quotingType: '"' }) };
    },
  });
}

export type { CommitResult };
