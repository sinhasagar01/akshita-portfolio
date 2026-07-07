// SK-2 — skills singleton commit. The skills singleton lives in its OWN file
// (content/skills.yaml), so it can't ride commitSiteSettings (hardcoded to
// site-settings.yaml). It reuses the shared commitFileToDraft base with its own
// path + serializer, exactly how commit-collection-entry does for collections.
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first.
import { load, dump } from "js-yaml";
import { commitFileToDraft, type CommitResult } from "./commit-site-settings";
import type { SkillsCategory } from "./skills-format";

const SKILLS_PATH = "content/skills.yaml";

/**
 * Read-modify-write content/skills.yaml and commit to the draft branch. The
 * transform MERGE-PRESERVES: it spreads the loaded object and overrides only
 * `categories`, so any future sibling top-level key survives (and `categories`
 * keeps its position, so the default dump stays byte-compatible). Singleton
 * semantics: if the file is absent it is created (loaded defaults to {}), not
 * refused. dump() default reproduces the current file byte-for-byte.
 */
export async function commitSkillsDraft(
  categories: SkillsCategory[],
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  return commitFileToDraft({
    path: SKILLS_PATH,
    branch: opts.branch,
    message: opts.message ?? "chore(studio): update skills",
    transform: (raw) => {
      const loaded = (load(raw) ?? {}) as Record<string, unknown>;
      return { ok: true, bytes: dump({ ...loaded, categories }) };
    },
  });
}

export { SKILLS_PATH };
