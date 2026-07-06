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
 * Read-modify-write ONE file and commit the transformed result to the given
 * branch. The shared draft-commit machinery behind both the settings singleton
 * and the collection editors (CE-1) — the DB-1 base logic lives here ONCE so it
 * cannot drift.
 *
 * DB-1 base rule: when the branch already EXISTS, the read and the commit both
 * use the branch head, so partial patches ACCUMULATE (across files too) and
 * nothing is ever deleted on this path — a failed commit leaves the prior draft
 * exactly as it was (review finding 2). Only when the branch does not exist is
 * it created from the default-branch head, and only that freshly created branch
 * is cleaned up on a commit failure. expectedHeadOid makes a racing save fail
 * typed (write_failed) instead of clobbering. A stale draft base (main moved
 * since the first save) is deferred to publish, where the merges API three-way
 * merges or returns a typed merge_conflict.
 *
 * `transform` receives the raw file text at the base and returns the bytes to
 * commit (each caller owns its own load/transform/dump, including dump options),
 * or a typed error that aborts before any branch is created.
 */
export async function commitFileToDraft(opts: {
  path: string;
  branch: string;
  message: string;
  transform: (rawText: string) => { ok: true; bytes: string } | { ok: false; error: SaveError };
}): Promise<CommitResult> {
  const { path, branch } = opts;

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
    raw = await getFileTextAtRef(path, baseOid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  const result = opts.transform(raw);
  if (!result.ok) return result; // transform/validation error — nothing created, base untouched

  const contents = result.bytes;

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
      path,
      contents,
      message: opts.message,
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

/**
 * Read-modify-write content/site-settings.yaml and commit to the draft branch.
 * A thin wrapper over commitFileToDraft (CE-1 refactor): behavior-identical to
 * the previous inline version — same transform (transformSiteSettings), same
 * default dump, same message default, same DB-1 accumulation and cleanup.
 */
export async function commitSiteSettings(
  patch: Partial<SiteSettingsInput>,
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  return commitFileToDraft({
    path: SETTINGS_PATH,
    branch: opts.branch,
    message: opts.message ?? "chore(studio): update site settings",
    transform: (raw) => {
      const loaded = (load(raw) ?? {}) as SiteSettingsRecord;
      const result = transformSiteSettings(loaded, patch);
      if (!result.ok) return result;
      return { ok: true, bytes: dump(result.value) };
    },
  });
}

export { SETTINGS_PATH };
