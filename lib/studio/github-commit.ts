// GitHub commit delivery for the /studio write path (reused unchanged in GH-2).
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate before any
// function here runs. The write token is SERVER-SIDE ONLY
// (process.env.STUDIO_GITHUB_TOKEN); it is never sent to the client. Uses raw
// fetch to the GitHub API: REST git refs + the GraphQL createCommitOnBranch
// mutation (the same mutation Keystatic uses), so GH-2 can commit real content.
const REPO = "sinhasagar01/akshita-portfolio";
const API = "https://api.github.com";
const GRAPHQL = `${API}/graphql`;

export function authHeaders(): Record<string, string> {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  if (!token) throw new Error("STUDIO_GITHUB_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** The repo default branch and its current head commit oid. */
export async function getDefaultBranchHeadOid(): Promise<{ branch: string; oid: string }> {
  const repoRes = await fetch(`${API}/repos/${REPO}`, { headers: authHeaders(), cache: "no-store" });
  if (!repoRes.ok) throw new Error(`repo fetch failed: ${repoRes.status} ${await repoRes.text()}`);
  const branch = (await repoRes.json()).default_branch as string;
  const refRes = await fetch(`${API}/repos/${REPO}/git/ref/heads/${branch}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!refRes.ok) throw new Error(`ref fetch failed: ${refRes.status} ${await refRes.text()}`);
  const oid = (await refRes.json()).object.sha as string;
  return { branch, oid };
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
  throw new Error(`merge failed: ${res.status} ${await res.text()}`);
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
export async function compareBranches(
  base: string,
  head: string
): Promise<
  | { aheadBy: number; status: string; files: { filename: string; status: CompareFileStatus }[] }
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
    ? (json.files as { filename: string; status: CompareFileStatus }[]).map((f) => ({
        filename: f.filename,
        status: f.status,
      }))
    : [];
  return { aheadBy: json.ahead_by as number, status: json.status as string, files };
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

/** Commit a single file to an existing branch via createCommitOnBranch. */
export async function commitFileToBranch(opts: {
  branch: string;
  path: string;
  contents: string;
  message: string;
  expectedHeadOid: string;
}): Promise<{ oid: string; url: string }> {
  const input = {
    branch: { repositoryNameWithOwner: REPO, branchName: opts.branch },
    message: { headline: opts.message },
    expectedHeadOid: opts.expectedHeadOid,
    fileChanges: {
      additions: [
        { path: opts.path, contents: Buffer.from(opts.contents, "utf8").toString("base64") },
      ],
    },
  };
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query: CREATE_COMMIT, variables: { input } }),
  });
  if (!res.ok) throw new Error(`graphql http ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`graphql errors: ${JSON.stringify(json.errors)}`);
  const commit = json.data?.createCommitOnBranch?.commit;
  if (!commit?.oid) throw new Error("no commit oid returned");
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
  additions?: { path: string; contents: string }[];
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
      contents: Buffer.from(a.contents, "utf8").toString("base64"),
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
  if (json.errors) throw new Error(`graphql errors: ${JSON.stringify(json.errors)}`);
  const commit = json.data?.createCommitOnBranch?.commit;
  if (!commit?.oid) throw new Error("no commit oid returned");
  return { oid: commit.oid as string, url: commit.url as string };
}

export { REPO };
