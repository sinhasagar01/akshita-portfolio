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
  getDefaultBranchHeadOid,
  branchExists,
  createBranchRef,
  deleteBranchRef,
  commitFileToBranch,
  REPO,
} from "./github-commit";

const SETTINGS_PATH = "content/site-settings.yaml";
const DEFAULT_PROBE_BRANCH = "studio/gh2-content-probe";

export type CommitResult =
  | { ok: true; sha: string; branch: string; baseOid: string; bytes: string }
  | { ok: false; error: SaveError };

// Local auth headers, kept here (not imported from github-commit) so that proven
// module stays byte-for-byte unchanged. Same server-side PAT, never client-side.
function authHeaders(): Record<string, string> {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  if (!token) throw new Error("STUDIO_GITHUB_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

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
 * Read-modify-write content/site-settings.yaml from the repo default-branch head
 * and commit the transformed result to a throwaway branch. Same load / transform
 * / dump as the fs path, so the bytes are identical. On a validation error it
 * returns BEFORE creating any branch (base untouched). On a commit failure it
 * deletes the branch it created (no dangling ref). On success the branch PERSISTS
 * so the caller/proof can verify it and then delete it.
 */
export async function commitSiteSettings(
  patch: Partial<SiteSettingsInput>,
  opts?: { branch?: string; message?: string }
): Promise<CommitResult> {
  let base: { branch: string; oid: string };
  let raw: string;
  try {
    base = await getDefaultBranchHeadOid();
    raw = await getFileTextAtRef(SETTINGS_PATH, base.oid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  const loaded = (load(raw) ?? {}) as SiteSettingsRecord;
  const result = transformSiteSettings(loaded, patch);
  if (!result.ok) return result; // validation error — no branch created, base untouched

  const contents = dump(result.value);
  const branch = opts?.branch ?? DEFAULT_PROBE_BRANCH;

  if (await branchExists(branch)) {
    await deleteBranchRef(branch); // clear a dangling ref from a prior run
  }
  await createBranchRef(branch, base.oid);

  try {
    const commit = await commitFileToBranch({
      branch,
      path: SETTINGS_PATH,
      contents,
      message: opts?.message ?? "chore(studio): update site settings",
      expectedHeadOid: base.oid,
    });
    return { ok: true, sha: commit.oid, branch, baseOid: base.oid, bytes: contents };
  } catch (e) {
    await deleteBranchRef(branch); // no dangling ref on failure
    return {
      ok: false,
      error: { code: "write_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }
}

export { DEFAULT_PROBE_BRANCH, SETTINGS_PATH };
