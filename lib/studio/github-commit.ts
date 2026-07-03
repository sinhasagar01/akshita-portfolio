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

export { REPO };
