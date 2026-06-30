// GH-4 — publish = merge the draft branch into main (the FIRST write to main).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first.
// Validation runs at publish (the gate the draft model deferred): an invalid
// draft can never reach main. The merge uses the conflict-safe REST merges API,
// so a draft that conflicts with a moved main returns a typed merge_conflict
// and main is never force-pushed or corrupted. Reuses the proven transform,
// commit, and read modules unchanged.
import { load } from "js-yaml";
import {
  transformSiteSettings,
  type SiteSettingsRecord,
} from "./site-settings-format";
import {
  branchExists,
  deleteBranchRef,
  getDefaultBranchHeadOid,
  mergeBranch,
} from "./github-commit";
import { getFileTextAtRef, SETTINGS_PATH } from "./commit-site-settings";
import { DRAFT_BRANCH } from "./draft-site-settings";

export type PublishResult =
  | { ok: true; merged: true; sha: string; deployPending: true }
  | { ok: true; merged: false; reason: "no_draft" | "not_applicable" | "no_changes" }
  | {
      ok: false;
      error: {
        code: "invalid_url" | "merge_conflict" | "merge_failed" | "read_failed" | "write_failed";
        field?: string;
        message: string;
      };
    };

function githubMode(): boolean {
  return process.env.STUDIO_WRITE_MODE === "github";
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Promote the draft branch to main. Returns merged:true with the merge commit
 * SHA and deployPending:true (the live site updates only after the Vercel
 * rebuild, ~1-5 min — GH-5's UI uses deployPending for a "Publishing…" state).
 */
export async function publishSiteSettings(): Promise<PublishResult> {
  if (!githubMode() || !process.env.STUDIO_GITHUB_TOKEN) {
    return { ok: true, merged: false, reason: "not_applicable" };
  }

  // 1. A draft must exist.
  let base: { branch: string; oid: string };
  try {
    if (!(await branchExists(DRAFT_BRANCH))) {
      return { ok: true, merged: false, reason: "no_draft" };
    }
    base = await getDefaultBranchHeadOid();
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: messageOf(e) } };
  }

  // 2. Validate at publish — the deferred gate. An invalid draft never merges.
  let raw: string;
  try {
    raw = await getFileTextAtRef(SETTINGS_PATH, DRAFT_BRANCH);
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: messageOf(e) } };
  }
  const loaded = (load(raw) ?? {}) as SiteSettingsRecord;
  const validation = transformSiteSettings(loaded, {});
  if (!validation.ok) {
    // main untouched, draft left in place so it can be fixed.
    return { ok: false, error: validation.error };
  }

  // 3. Merge draft -> main (conflict-safe; never forces main).
  let merge: Awaited<ReturnType<typeof mergeBranch>>;
  try {
    merge = await mergeBranch({
      base: base.branch,
      head: DRAFT_BRANCH,
      message: "studio: publish site settings",
    });
  } catch (e) {
    return { ok: false, error: { code: "merge_failed", message: messageOf(e) } };
  }
  if (merge.status === "conflict") {
    return {
      ok: false,
      error: { code: "merge_conflict", message: "draft conflicts with main; rebase the draft" },
    };
  }
  if (merge.status === "noop") {
    return { ok: true, merged: false, reason: "no_changes" };
  }

  // 4. Promote-then-clear: delete the draft branch (non-fatal — merge landed).
  try {
    await deleteBranchRef(DRAFT_BRANCH);
  } catch {
    /* merge already landed; a leftover draft is harmless and self-heals */
  }

  // 5. Merge landed; the live site updates after the Vercel rebuild.
  return { ok: true, merged: true, sha: merge.oid, deployPending: true };
}
