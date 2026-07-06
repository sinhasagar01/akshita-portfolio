// GH-2 — real content-commit delivery for /studio (glue only).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first.
// Reuses the PROVEN transform (site-settings-format) and the PROVEN GitHub
// delivery (github-commit) unchanged. The only new code here is the read-at-ref
// glue and the read-modify-write orchestration. The write token is server-side
// only (process.env.STUDIO_GITHUB_TOKEN) and is never sent to the client.
import { load, dump } from "js-yaml";
import {
  transformSiteSettings,
  type SiteSettingsInput,
  type SiteSettingsRecord,
  type SaveError,
} from "./site-settings-format";
import {
  authHeaders,
  getDefaultBranchHeadOid,
  getBranchHeadOid,
  createBranchRef,
  deleteBranchRef,
  commitFileToBranch,
  REPO,
} from "./github-commit";

const SETTINGS_PATH = "content/site-settings.yaml";

export type CommitResult =
  | { ok: true; sha: string; branch: string; baseOid: string; bytes: string }
  | { ok: false; error: SaveError };

/** Read the raw file TEXT at a ref (commit oid or branch) via the contents API.
 *  Raw bytes — not Keystatic's parsed entry — so the fs and github paths load
 *  identical input and produce identical output. */
export async function getFileTextAtRef(path: string, ref: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (res.status === 404) return ""; // file missing at ref -> empty base
  if (!res.ok) throw new Error(`contents fetch failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (typeof json.content !== "string") throw new Error("contents response missing content");
  return Buffer.from(json.content, "base64").toString("utf8");
}

/**
 * Read-modify-write content/site-settings.yaml and commit the transformed
 * result to the given branch. DB-1 base rule: when the branch already EXISTS,
 * the read and the commit both use the branch head, so partial patches
 * ACCUMULATE and nothing is ever deleted on this path — a failed commit leaves
 * the prior draft exactly as it was (review finding 2). Only when the branch
 * does not exist is it created from the default-branch head, and only that
 * freshly created branch is cleaned up on a commit failure. expectedHeadOid
 * makes a racing save fail typed (write_failed) instead of clobbering.
 * A stale draft base (main moved since the first save) is deferred to publish,
 * where the merges API three-way merges or returns a typed merge_conflict.
 */
export async function commitSiteSettings(
  patch: Partial<SiteSettingsInput>,
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  const branch = opts.branch;

  let baseOid: string;
  let createFromMain = false;
  let raw: string;
  try {
    const draftHead = await getBranchHeadOid(branch);
    if (draftHead) {
      baseOid = draftHead;
    } else {
      baseOid = (await getDefaultBranchHeadOid()).oid;
      createFromMain = true;
    }
    raw = await getFileTextAtRef(SETTINGS_PATH, baseOid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  const loaded = (load(raw) ?? {}) as SiteSettingsRecord;
  const result = transformSiteSettings(loaded, patch);
  if (!result.ok) return result; // validation error — nothing created, base untouched

  const contents = dump(result.value);

  try {
    if (createFromMain) {
      await createBranchRef(branch, baseOid);
    }
  } catch (e) {
    return {
      ok: false,
      error: { code: "write_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  try {
    const commit = await commitFileToBranch({
      branch,
      path: SETTINGS_PATH,
      contents,
      message: opts.message ?? "chore(studio): update site settings",
      expectedHeadOid: baseOid,
    });
    return { ok: true, sha: commit.oid, branch, baseOid, bytes: contents };
  } catch (e) {
    if (createFromMain) {
      // Clean up ONLY the branch this call just created. An existing draft is
      // never deleted, so prior saves survive any failure here.
      try {
        await deleteBranchRef(branch);
      } catch {
        /* non-fatal — a dangling fresh branch self-heals on the next save */
      }
    }
    return {
      ok: false,
      error: { code: "write_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }
}

export { SETTINGS_PATH };
