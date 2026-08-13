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
  serializeSettingsPhoto,
  serializeSettingsHeroFigure,
  type SiteSettingsInput,
  type SiteSettingsRecord,
  type SaveError,
} from "./site-settings-format";
import {
  authHeaders,
  getBaseBranchHeadOid,
  getBranchHeadOid,
  createBranchRef,
  /* ⚠ `deleteBranchRef` IS DELIBERATELY NOT IMPORTED HERE ANY MORE. This module creates the
     draft branch and commits to it; nothing in a WRITE path has any business deleting it.
     The two callers that legitimately delete are `publish-site-settings` (after the merge
     lands) and `discard-site-settings` (which is the author asking). If a future edit needs
     it here, that is the signal to re-read the block at the end of `finalizeDraftCommit`. */
  commitFileToBranch,
  commitFilesToBranch,
  REPO,
} from "./github-commit";
import {
  settingsPhotoYamlValue,
  settingsPhotoBlobPath,
  settingsPhotoBlobPathFromValue,
} from "./settings-photo-path";
import {
  heroFigureYamlValue,
  heroFigureBlobPath,
  heroFigureBlobPathFromValue,
} from "./hero-figure-path";

const SETTINGS_PATH = "content/site-settings.yaml";

export type CommitResult =
  // `slug` is set ONLY by the collection CREATE path (commit-collection-entry),
  // which derives the identity from the input's slug field — the lib owns the
  // derivation, so callers (the create route) report it without re-slugifying.
  | { ok: true; sha: string; branch: string; baseOid: string; bytes: string; slug?: string }
  | { ok: false; error: SaveError };

// Result of a multi-file draft commit. DISTINCT from CommitResult: no `bytes` —
// N files have no single committed content, and nothing needs it (F-1).
export type FilesCommitResult =
  | { ok: true; sha: string; branch: string; baseOid: string }
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
type DraftBase =
  | { ok: true; baseOid: string; createFromMain: boolean }
  | { ok: false; error: SaveError };

/**
 * Resolve the base commit for a draft write: the draft branch head when it
 * exists (so partial patches ACCUMULATE across files — DB-1), else the
 * default-branch head, flagged as a fresh branch to create.
 *
 * CONCURRENCY — do NOT collapse base resolution into a multi-file wrapper's
 * callee. commitFileToDraft reads its file at THIS baseOid and then commits with
 * expectedHeadOid = THIS baseOid, so read-base and commit-base are the SAME
 * commit. That identity is what makes a racing same-file save fail loudly
 * (write_failed) instead of silently overwriting a newer head. If a single-file
 * write delegated to a multi-file function that resolved the base again, the base
 * would be read TWICE — a concurrent commit landing between the two reads would
 * let a stale-base write succeed against a moved head (silent last-write-wins),
 * weakening the DB-1 guard. So this lives here ONCE and each write path
 * (commitFileToDraft, commitFilesToDraft) calls it exactly once per commit.
 */
async function resolveDraftBase(branch: string): Promise<DraftBase> {
  try {
    const draftHead = await getBranchHeadOid(branch);
    if (draftHead) return { ok: true, baseOid: draftHead, createFromMain: false };
    const mainOid = (await getBaseBranchHeadOid()).oid;
    return { ok: true, baseOid: mainOid, createFromMain: true };
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }
}

/**
 * Create the draft branch if this call is bootstrapping it, then land the file
 * changes as ONE commit with expectedHeadOid = baseOid. Cleanup deletes ONLY a
 * branch this call just created (an existing draft is never destroyed on failure
 * — DB-1 finding 2). A single addition with no deletions goes through the
 * UNTOUCHED commitFileToBranch, so the existing writers run proven code verbatim;
 * anything multi-file or carrying deletions uses commitFilesToBranch.
 */
async function finalizeDraftCommit(opts: {
  branch: string;
  baseOid: string;
  createFromMain: boolean;
  // contents accepts binary (Uint8Array) as well as text — the F-1 binary
  // extension (P4-1 image blobs). Existing text callers pass strings unchanged.
  additions?: { path: string; contents: string | Uint8Array }[];
  deletions?: { path: string }[];
  message: string;
}): Promise<{ ok: true; sha: string } | { ok: false; error: SaveError }> {
  const { branch, baseOid, createFromMain, additions = [], deletions = [], message } = opts;

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
    const singleFile = additions.length === 1 && deletions.length === 0;
    const commit = singleFile
      ? await commitFileToBranch({
          branch,
          path: additions[0].path,
          contents: additions[0].contents,
          message,
          expectedHeadOid: baseOid,
        })
      : await commitFilesToBranch({ branch, additions, deletions, message, expectedHeadOid: baseOid });
    return { ok: true, sha: commit.oid };
  } catch (e) {
    /* ⚠ A FAILED WRITE MAY NOT DELETE A BRANCH. THIS CATCH USED TO, AND IT DESTROYED AN AUTHOR'S
       WORK IN PRODUCTION. The deleted code was:

           if (createFromMain) {
             // Clean up ONLY the branch this call just created. An existing draft is
             // never deleted, so prior saves survive any failure here.
             await deleteBranchRef(branch);
           }

       ⚠ THAT COMMENT IS FALSE UNDER CONCURRENCY AND IT IS QUOTED RATHER THAN DELETED, because it is
       the second comment in two units written to REASSURE about an unsafe path — and a comment
       written to reassure is one nobody re-checks. `createFromMain` means "the branch was absent
       when I read it". It does NOT mean "nothing else has committed to it since".

       THE LOSING INTERLEAVING, WHICH IS THE ONE THAT HAPPENED. Request A creates the branch;
       request B commits to it and the head moves; A's own commit then fails `STALE_DATA` against
       the head it expected; A's cleanup fires with `createFromMain` still true and DELETES THE
       BRANCH WITH B'S COMMIT ON IT. An owner lost a created entry and its uploaded image this way,
       and the four errors that followed were all downstream of the branch being gone.

       ⚠ THE ASYMMETRY IS THE WHOLE RULING: leaving a branch behind is a tidiness cost, deleting one
       destroys work. And the tidiness cost measured at ZERO — `resolveDraftBase` above adopts an
       existing branch as its base, so an orphan created from main with nothing committed to it is a
       ref pointing at main's head. `differs` is `files.length > 0`, which is 0 for such a branch, so
       the publish pill stays dark and the next save simply commits onto it. It is indistinguishable
       from no draft at all.

       A NARROWER GUARD WAS CONSIDERED AND REFUSED — deleting only when the head is still the commit
       this call created it at. It is correct and it buys nothing, because what it would clean up
       costs nothing to leave. */
    return {
      ok: false,
      error: { code: "write_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }
}

export async function commitFileToDraft(opts: {
  path: string;
  branch: string;
  message: string;
  transform: (rawText: string) => { ok: true; bytes: string } | { ok: false; error: SaveError };
}): Promise<CommitResult> {
  const base = await resolveDraftBase(opts.branch);
  if (!base.ok) return base;

  let raw: string;
  try {
    raw = await getFileTextAtRef(opts.path, base.baseOid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  const result = opts.transform(raw);
  if (!result.ok) return result; // transform/validation error — nothing created, base untouched

  const contents = result.bytes;
  const fin = await finalizeDraftCommit({
    branch: opts.branch,
    baseOid: base.baseOid,
    createFromMain: base.createFromMain,
    additions: [{ path: opts.path, contents }],
    message: opts.message,
  });
  if (!fin.ok) return fin;
  return { ok: true, sha: fin.sha, branch: opts.branch, baseOid: base.baseOid, bytes: contents };
}

/**
 * Commit N file changes (additions and/or deletions) to the draft branch in ONE
 * atomic commit, sharing the DB-1 base logic with commitFileToDraft via
 * resolveDraftBase + finalizeDraftCommit. Unlike commitFileToDraft this does NOT
 * read-modify-write a single file — each caller builds its own additions and
 * deletions up front (a project stub's files to add, or a directory's files to
 * delete). Returns no `bytes` (N files have no single content).
 *
 * Nothing calls this yet (F-1 is plumbing); F-3 create + delete build on it.
 */
export async function commitFilesToDraft(opts: {
  additions?: { path: string; contents: string | Uint8Array }[];
  deletions?: { path: string }[];
  branch: string;
  message: string;
}): Promise<FilesCommitResult> {
  const base = await resolveDraftBase(opts.branch);
  if (!base.ok) return base;

  const fin = await finalizeDraftCommit({
    branch: opts.branch,
    baseOid: base.baseOid,
    createFromMain: base.createFromMain,
    additions: opts.additions,
    deletions: opts.deletions,
    message: opts.message,
  });
  if (!fin.ok) return fin;
  return { ok: true, sha: fin.sha, branch: opts.branch, baseOid: base.baseOid };
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

/**
 * Commit a settings-photo upload (or clear) to the draft branch — the blob and the
 * yaml edit in ONE commit, mirroring commitProjectHeroImage. On replace the prior
 * blob is deleted when its path differs, which also cleans up the hand-authored
 * /images/photo.jpg the first webp upload supersedes.
 */
export async function commitSettingsPhoto(opts: {
  image: Uint8Array | null;
  branch: string;
  message?: string;
}): Promise<FilesCommitResult> {
  let raw: string;
  try {
    const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getBaseBranchHeadOid()).oid;
    raw = await getFileTextAtRef(SETTINGS_PATH, baseOid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  // The previous blob (from the current yaml) — deleted when the new path differs.
  const oldValue = (load(raw) as { photo?: unknown } | null)?.photo;
  const oldBlobPath = settingsPhotoBlobPathFromValue(oldValue);

  const newValue = opts.image ? settingsPhotoYamlValue() : null;
  const bytes = serializeSettingsPhoto(raw, newValue);

  const newBlobPath = opts.image ? settingsPhotoBlobPath() : null;
  const additions: { path: string; contents: string | Uint8Array }[] = [
    { path: SETTINGS_PATH, contents: bytes },
  ];
  if (opts.image && newBlobPath) additions.push({ path: newBlobPath, contents: opts.image });

  const deletions: { path: string }[] = [];
  if (oldBlobPath && oldBlobPath !== newBlobPath) deletions.push({ path: oldBlobPath });

  return commitFilesToDraft({
    additions,
    deletions,
    branch: opts.branch,
    message: opts.message ?? `chore(studio): ${opts.image ? "set" : "clear"} site photo`,
  });
}

/**
 * The `heroFigure` twin of `commitSettingsPhoto` — the hero illustration's blob and the yaml edit
 * in ONE commit, so the field is never left pointing at a blob that was not written.
 *
 * ⚠ CLEARING RESTORES THE SHIPPED ASSET RATHER THAN EMPTYING THE PANEL, and the renderer is where
 * that happens: `heroFigure: null` makes `HeroSection` fall back to `/images/hero/hero-figure.webp`,
 * which is committed to the repo and is never a deletion target here. So "clear" means "go back to
 * the one that ships", which is the only sane meaning for the single image the hero's composition
 * cannot do without.
 */
export async function commitSettingsHeroFigure(opts: {
  image: Uint8Array | null;
  branch: string;
  message?: string;
}): Promise<FilesCommitResult> {
  let raw: string;
  try {
    const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getBaseBranchHeadOid()).oid;
    raw = await getFileTextAtRef(SETTINGS_PATH, baseOid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

  // The previous blob (from the current yaml) — deleted when the new path differs. The shipped
  // asset never matches this, by construction, so it survives every replace and clear.
  const oldValue = (load(raw) as { heroFigure?: unknown } | null)?.heroFigure;
  const oldBlobPath = heroFigureBlobPathFromValue(oldValue);

  const newValue = opts.image ? heroFigureYamlValue() : null;
  const bytes = serializeSettingsHeroFigure(raw, newValue);

  const newBlobPath = opts.image ? heroFigureBlobPath() : null;
  const additions: { path: string; contents: string | Uint8Array }[] = [
    { path: SETTINGS_PATH, contents: bytes },
  ];
  if (opts.image && newBlobPath) additions.push({ path: newBlobPath, contents: opts.image });

  const deletions: { path: string }[] = [];
  if (oldBlobPath && oldBlobPath !== newBlobPath) deletions.push({ path: oldBlobPath });

  return commitFilesToDraft({
    additions,
    deletions,
    branch: opts.branch,
    message: `chore(studio): ${opts.image ? "set" : "clear"} hero illustration`,
  });
}

export { SETTINGS_PATH };
