// GitHub commit delivery for the /studio write path (reused unchanged in GH-2).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate before any
// function here runs. The write token is SERVER-SIDE ONLY
// (process.env.STUDIO_GITHUB_TOKEN); it is never sent to the client. Uses raw
// fetch to the GitHub API: REST git refs + the GraphQL createCommitOnBranch
// mutation (the same mutation Keystatic uses), so GH-2 can commit real content.
// The repo studio reads and writes. CONFIGURABLE, because it used to be a hard
// constant — which meant running dev in github mode (the only mode where any
// write actually happens) pointed straight at the production repo's draft branch.
// There was no way to exercise save, create, delete, upload, or publish without
// touching the real thing, so in practice they went unexercised.
//
// Point it at a fork or a scratch repo to work safely. Unset, it is the
// production repo exactly as before.
const PRODUCTION_REPO = "sinhasagar01/akshita-portfolio";
const REPO = (() => {
  const configured = process.env.STUDIO_GITHUB_REPO?.trim();
  if (!configured) return PRODUCTION_REPO;
  // Each segment must START with an alphanumeric and contain no "..", so the
  // value can never be a relative path. It is interpolated straight into the API
  // URL, and a permissive character class alone would let "../other" walk out of
  // /repos/ — config is trusted, but a guard with a hole in it is not a guard.
  const validSegment = /^[A-Za-z0-9][\w.-]*$/;
  const segments = configured.split("/");
  if (
    segments.length !== 2 ||
    configured.includes("..") ||
    !segments.every((seg) => validSegment.test(seg))
  ) {
    throw new Error(`STUDIO_GITHUB_REPO must be "owner/name", got "${configured}"`);
  }
  return configured;
})();

/**
 * The branch studio treats as published — the compare base for drafts and the
 * merge target for publish.
 *
 * ONE definition, deliberately. Reads used to compare against a literal "main"
 * while writes resolved the repo's default branch through a separate API call,
 * so the two could disagree about what "published" meant. Now they cannot.
 */
export const BASE_BRANCH = process.env.STUDIO_BASE_BRANCH?.trim() || "main";

/** True when studio is pointed at the real production repo. Used to warn in dev. */
export const IS_PRODUCTION_REPO = REPO === PRODUCTION_REPO;
const API = "https://api.github.com";
const GRAPHQL = `${API}/graphql`;

// Warned once, lazily, on the first call that actually needs credentials — so it
// fires exactly when a dev session is about to touch a real repo, and never
// during a build or an fs-mode run that makes no API call at all.
let warnedProductionRepo = false;

export function authHeaders(): Record<string, string> {
  if (
    !warnedProductionRepo &&
    IS_PRODUCTION_REPO &&
    process.env.NODE_ENV !== "production"
  ) {
    warnedProductionRepo = true;
    console.warn(
      `[studio] github mode is pointed at the PRODUCTION repo (${REPO}). ` +
        "Writes land on its draft branch. Set STUDIO_GITHUB_REPO to a fork or " +
        "scratch repo to work safely."
    );
  }
  const token = process.env.STUDIO_GITHUB_TOKEN;
  if (!token) throw new Error("STUDIO_GITHUB_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Raw BYTES of a file at a ref, or null when it does not exist there.
 *
 * The binary sibling of getFileTextAtRef (which base64-decodes the JSON contents
 * response). This uses the RAW media type instead, because the JSON form omits
 * `content` entirely for blobs over 1 MB — fine for yaml, wrong for images, which
 * is the only thing that reads bytes. Returns null rather than empty on 404, so
 * "missing here" is distinguishable from "empty file" and the caller can fall
 * back to another ref.
 */
export async function getFileBytesAtRef(path: string, ref: string): Promise<Uint8Array | null> {
  const res = await fetch(
    `${API}/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`,
    {
      headers: { ...authHeaders(), Accept: "application/vnd.github.raw" },
      cache: "no-store",
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`contents fetch failed: ${res.status} ${await res.text()}`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * BASE_BRANCH and its current head commit oid.
 *
 * It used to ask the API for the repo's default_branch first, which cost an extra
 * request per write AND was a second, independent answer to "what is published"
 * — the reads never asked, they assumed "main". Both now come from BASE_BRANCH,
 * so a repo whose published branch is not "main" is one env var, not a mismatch.
 */
export async function getBaseBranchHeadOid(): Promise<{ branch: string; oid: string }> {
  const refRes = await fetch(`${API}/repos/${REPO}/git/ref/heads/${BASE_BRANCH}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!refRes.ok) throw new Error(`ref fetch failed: ${refRes.status} ${await refRes.text()}`);
  const oid = (await refRes.json()).object.sha as string;
  return { branch: BASE_BRANCH, oid };
}

export async function branchExists(branch: string): Promise<boolean> {
  const res = await fetch(`${API}/repos/${REPO}/git/ref/heads/${branch}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return res.ok;
}

/** The head commit oid of a branch, or null when the branch does not exist.
 *  One GET where an exists-check plus head-read would take two (DB-1). */
export async function getBranchHeadOid(branch: string): Promise<string | null> {
  const res = await fetch(`${API}/repos/${REPO}/git/ref/heads/${branch}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`ref fetch failed: ${res.status} ${await res.text()}`);
  return (await res.json()).object.sha as string;
}

export async function createBranchRef(branch: string, oid: string): Promise<void> {
  const res = await fetch(`${API}/repos/${REPO}/git/refs`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: oid }),
  });
  if (!res.ok) throw new Error(`createRef failed: ${res.status} ${await res.text()}`);
}

export async function deleteBranchRef(branch: string): Promise<void> {
  const res = await fetch(`${API}/repos/${REPO}/git/refs/heads/${branch}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  // 404/422 means the ref is already gone — treat as success for idempotent cleanup.
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    throw new Error(`deleteRef failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Merge `head` into `base` via the REST merges API (GH-4). Conflict-safe by
 * construction: 201 merges cleanly (returns the merge commit oid), 204 means
 * nothing to merge, 409 is a conflict. It never force-pushes or rewrites base.
 */
export async function mergeBranch(opts: {
  base: string;
  head: string;
  message: string;
}): Promise<{ status: "merged"; oid: string } | { status: "noop" } | { status: "conflict" }> {
  const res = await fetch(`${API}/repos/${REPO}/merges`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ base: opts.base, head: opts.head, commit_message: opts.message }),
  });
  if (res.status === 201) return { status: "merged", oid: (await res.json()).sha as string };
  if (res.status === 204) return { status: "noop" };
  if (res.status === 409) return { status: "conflict" };

  /* ⚠ THE SAME ASSUMPTION AS THE GRAPHQL SITES ABOVE, ON THE HIGHEST-STAKES WRITE THERE IS. This
     threw outright, so an unexpected status reported a FAILED PUBLISH — and a publish is the one
     write whose result an author acts on immediately, by publishing again.

     A non-2xx is not evidence the merge did not land. So before reporting failure this ASKS: does
     `base` now contain `head`? If it does, the merge happened and the status was the only thing
     that went wrong.

     ⚠ THE CONFIRMATION IS A COMPARE, NOT A GUESS. `compareBranches(base, head)` reports `ahead_by`
     for head relative to base; zero means base already carries every commit head has, which is
     exactly what a completed merge produces. A second publish would return 204 `noop` anyway, so
     this does not change what a retry does — it changes what the author is TOLD the first time.

     ⚠ AND IF THE CONFIRMATION ITSELF FAILS, THE ORIGINAL ERROR IS THROWN. A read that cannot run is
     not permission to claim success; this repository's oldest failure mode is an instrument that
     reports the shape of success when it could not look. */
  const status = res.status;
  const text = await res.text();
  try {
    const cmp = await compareBranches(opts.base, opts.head);
    if (cmp && cmp.aheadBy === 0) return { status: "noop" };
  } catch {
    /* fall through to the original error — see the note above */
  }
  throw new Error(`merge failed: ${status} ${text}`);
}

// GitHub's per-file change status in a compare response. F-2 keeps this alongside
// the filename so the draft overlay can tell a CREATE (added) and a DELETE
// (removed) apart from an edit (modified) — studio writes only ever produce
// added/removed/modified, the rest are here for completeness.
export type CompareFileStatus =
  | "added"
  | "removed"
  | "modified"
  | "renamed"
  | "copied"
  | "changed"
  | "unchanged";

/**
 * Compare two branches via the REST compare API. Returns how many commits `head`
 * is ahead of `base`, the overall status, and the changed files WITH their
 * per-file status, or null when either ref is missing (404). Backs the
 * branch-level "unpublished changes" signal (CE-3a: aheadBy > 0) and, via the
 * per-file status, the draft add/delete overlay (F-2).
 */
/** GitHub returns at most this many files from a compare, and says so nowhere in
 *  the payload — hitting it exactly is the only signal available. */
export const COMPARE_FILE_CAP = 300;

export async function compareBranches(
  base: string,
  head: string,
  /**
   * ⚠ OPT-IN, AND IT DEFAULTS OFF ON PURPOSE. GitHub already sends each file's unified `patch` in
   * this very response, and the map below has always thrown it away — the publish preview's whole
   * cost is un-discarding it. But this function also backs the draft-state read, which runs
   * `unstable_cache`d on EVERY studio page load, and a case study's full-file patch is ~24KB. So
   * the hot path keeps exactly the payload it has today and only the preview asks for more. One
   * function still owns the compare URL and the cap, so there is no second place that knows how to
   * compare two branches.
   */
  opts: { withPatches?: boolean } = {}
): Promise<
  | {
      aheadBy: number;
      status: string;
      files: { filename: string; status: CompareFileStatus; patch?: string | null }[];
      /**
       * GitHub caps a compare's `files` at COMPARE_FILE_CAP, with no flag saying so.
       * Surfaced rather than thrown, because the two callers need OPPOSITE postures:
       * F-2's draft overlay fails SAFE (a truncated list costs a stale badge, so it
       * degrades), while the publish gate must fail CLOSED (a truncated list means a
       * project goes unvalidated, which is the wedge it exists to prevent). Same
       * reasoning as F-1's getTreeRecursive, which throws because a partial tree
       * must never drive a delete — a partial list must never drive a correctness
       * decision either.
       */
      truncated: boolean;
    }
  | null
> {
  const res = await fetch(
    `${API}/repos/${REPO}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
    { headers: authHeaders(), cache: "no-store" }
  );
  if (res.status === 404) return null; // a missing draft branch = nothing to publish
  if (!res.ok) throw new Error(`compare failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const files = Array.isArray(json.files)
    ? (json.files as { filename: string; status: CompareFileStatus; patch?: string }[]).map((f) => ({
        filename: f.filename,
        status: f.status,
        // `?? null` rather than left undefined: GitHub WITHHOLDS `patch` for binaries and for very
        // large files, and the preview must tell a withheld diff apart from an empty one. Absent
        // and empty are the same value in JSON, so the distinction has to survive here.
        ...(opts.withPatches ? { patch: f.patch ?? null } : {}),
      }))
    : [];
  return {
    aheadBy: json.ahead_by as number,
    status: json.status as string,
    files,
    truncated: files.length >= COMPARE_FILE_CAP,
  };
}

/**
 * List every path in a commit's tree, recursively (F-3). Resolves the commit oid
 * to its root tree, then reads the tree with ?recursive=1. THROWS if GitHub
 * truncated the response (>100k entries / 7MB) — a partial tree must never drive a
 * delete, or files would be silently orphaned. This repo's content tree is tiny,
 * so truncation never happens in practice; the guard is a correctness backstop.
 * Backs projects delete-enumeration and the create orderIndex scan.
 */
export async function getTreeRecursive(
  commitOid: string
): Promise<{ path: string; type: "blob" | "tree" }[]> {
  const commitRes = await fetch(`${API}/repos/${REPO}/git/commits/${commitOid}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!commitRes.ok) throw new Error(`commit fetch failed: ${commitRes.status} ${await commitRes.text()}`);
  const treeSha = (await commitRes.json()).tree.sha as string;
  const treeRes = await fetch(`${API}/repos/${REPO}/git/trees/${treeSha}?recursive=1`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!treeRes.ok) throw new Error(`tree fetch failed: ${treeRes.status} ${await treeRes.text()}`);
  const json = await treeRes.json();
  if (json.truncated) throw new Error("git tree truncated — refusing to enumerate a partial tree");
  return (json.tree as { path: string; type: "blob" | "tree" }[]).map((t) => ({
    path: t.path,
    type: t.type,
  }));
}

const CREATE_COMMIT = `
mutation ($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) { commit { oid url } }
}`;

/**
 * Encode file contents to the base64 the createCommitOnBranch `additions` field
 * requires. A string is UTF-8 encoded (unchanged from the original text-only
 * behaviour, so every existing text caller produces a byte-identical mutation).
 * A Uint8Array/Buffer is base64'd DIRECTLY — no UTF-8 round-trip, which would
 * corrupt binary bytes (P4-1: image blobs). This is the whole binary extension.
 */
function encodeContents(contents: string | Uint8Array): string {
  return typeof contents === "string"
    ? Buffer.from(contents, "utf8").toString("base64")
    : Buffer.from(contents).toString("base64");
}

/** Commit a single file to an existing branch via createCommitOnBranch. */
export async function commitFileToBranch(opts: {
  branch: string;
  path: string;
  contents: string | Uint8Array;
  message: string;
  expectedHeadOid: string;
}): Promise<{ oid: string; url: string }> {
  const input = {
    branch: { repositoryNameWithOwner: REPO, branchName: opts.branch },
    message: { headline: opts.message },
    expectedHeadOid: opts.expectedHeadOid,
    fileChanges: {
      additions: [{ path: opts.path, contents: encodeContents(opts.contents) }],
    },
  };
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query: CREATE_COMMIT, variables: { input } }),
  });
  if (!res.ok) throw new Error(`graphql http ${res.status}: ${await res.text()}`);
  const json = await res.json();
  /* ⚠ AN ERROR IS NOT EVIDENCE THAT NOTHING HAPPENED, AND THIS THREW BEFORE LOOKING.

     `if (json.errors) throw` fired AHEAD of reading `json.data`, so a response carrying BOTH a
     committed oid and a non-fatal error was discarded and the caller was told "nothing was
     written". An author who retries then gets a duplicate — or `slug_taken` for their own
     successful create.

     ⚠ AND THIS API REALLY DOES RETURN BOTH, MEASURED ON THE REAL ENDPOINT rather than read off the
     spec, because a documented behaviour and a measured one have been different things twice this
     week. One query asking for `viewer` and a bogus node id returns
     `data: {viewer: {…}, bogus: null}` AND `errors: […]` in the same response.

     SO THE DATA IS READ FIRST AND THE ERROR ONLY DECIDES THE MESSAGE. A REFUSED commit — STALE_DATA,
     say — carries no `commit` node, so the check below still throws and a genuine race is still
     reported as the failure it is. ⚠ THAT CASE IS UNFORCED: producing one needs a live branch and a
     deliberate bad write, so it follows from a refused commit having no commit node rather than
     from an observation. */
  const commit = json.data?.createCommitOnBranch?.commit;
  if (!commit?.oid) {
    throw new Error(
      json.errors ? `graphql errors: ${JSON.stringify(json.errors)}` : "no commit oid returned"
    );
  }
  return { oid: commit.oid as string, url: commit.url as string };
}

/**
 * Commit N file changes (additions and/or deletions) to an existing branch in
 * ONE atomic commit via the same createCommitOnBranch mutation. Deletions are
 * PATH-ONLY — no blob sha, unlike the REST Contents API DELETE — and share the
 * expectedHeadOid concurrency guard. fileChanges is built conditionally, so a
 * single-addition/no-deletion call produces the exact same mutation input as
 * commitFileToBranch (which stays the single-file path for the existing writers).
 */
export async function commitFilesToBranch(opts: {
  branch: string;
  additions?: { path: string; contents: string | Uint8Array }[];
  deletions?: { path: string }[];
  message: string;
  expectedHeadOid: string;
}): Promise<{ oid: string; url: string }> {
  const fileChanges: {
    additions?: { path: string; contents: string }[];
    deletions?: { path: string }[];
  } = {};
  if (opts.additions?.length) {
    fileChanges.additions = opts.additions.map((a) => ({
      path: a.path,
      contents: encodeContents(a.contents),
    }));
  }
  if (opts.deletions?.length) {
    fileChanges.deletions = opts.deletions.map((d) => ({ path: d.path }));
  }
  const input = {
    branch: { repositoryNameWithOwner: REPO, branchName: opts.branch },
    message: { headline: opts.message },
    expectedHeadOid: opts.expectedHeadOid,
    fileChanges,
  };
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query: CREATE_COMMIT, variables: { input } }),
  });
  if (!res.ok) throw new Error(`graphql http ${res.status}: ${await res.text()}`);
  const json = await res.json();
  /* Same handling as `commitFileToBranch` above, and for the same reason — see the note there. */
  const commit = json.data?.createCommitOnBranch?.commit;
  if (!commit?.oid) {
    throw new Error(
      json.errors ? `graphql errors: ${JSON.stringify(json.errors)}` : "no commit oid returned"
    );
  }
  return { oid: commit.oid as string, url: commit.url as string };
}

export { REPO };
