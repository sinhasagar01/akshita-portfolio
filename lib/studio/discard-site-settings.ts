// Discard = delete the whole draft branch (the inverse of publish). Symmetric
// with publishSiteSettings: publish MERGES the draft into main; discard DELETES
// the draft, wiping all unpublished edits so /studio falls back to live.
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first.
//
// HARD INVARIANT — main is NEVER touched. The ONLY GitHub write here is
// deleteBranchRef(DRAFT_BRANCH), i.e. DELETE git/refs/heads/studio/draft-site-settings.
// This module never reads the default-branch head, never merges, never commits,
// and never names any branch other than DRAFT_BRANCH — so it is impossible for a
// discard to modify, reset, or force-push main.
import { branchExists, deleteBranchRef } from "./github-commit";
import { DRAFT_BRANCH } from "./draft-site-settings";

export type DiscardResult =
  | { ok: true; discarded: true }
  | { ok: true; discarded: false; reason: "no_draft" | "not_applicable" }
  | { ok: false; error: { code: "delete_failed"; message: string } };

function githubMode(): boolean {
  return process.env.STUDIO_WRITE_MODE === "github";
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Delete the draft branch. github mode only; fs/dev returns a safe no-op. If no
 * draft branch exists, returns no_draft (already at live). On a genuine delete
 * failure returns a typed delete_failed and the draft is left intact — the caller
 * must surface the error and NOT show a false "discarded" state.
 */
export async function discardSiteSettingsDraft(): Promise<DiscardResult> {
  if (!githubMode() || !process.env.STUDIO_GITHUB_TOKEN) {
    return { ok: true, discarded: false, reason: "not_applicable" };
  }

  try {
    if (!(await branchExists(DRAFT_BRANCH))) {
      return { ok: true, discarded: false, reason: "no_draft" };
    }
  } catch (e) {
    return { ok: false, error: { code: "delete_failed", message: messageOf(e) } };
  }

  try {
    // The ONLY write. deleteBranchRef treats 404/422 (already gone) as success,
    // which is correct: "gone" IS the desired end state. Only real failures throw.
    await deleteBranchRef(DRAFT_BRANCH);
  } catch (e) {
    return { ok: false, error: { code: "delete_failed", message: messageOf(e) } };
  }

  return { ok: true, discarded: true };
}
