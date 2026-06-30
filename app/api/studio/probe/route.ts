// POST /api/studio/probe — GH-1 authenticated write boundary (NO real content).
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner-session gate is MANDATORY and runs
// FIRST, before any GitHub call. The write token is SERVER-SIDE ONLY and is
// never sent to the client. This performs a reversible NO-OP commit to a
// throwaway branch and then deletes the branch. It never touches main and never
// writes content/site-settings.yaml or any real content. The real content
// commit is GH-2; this only proves the gated commit works end to end.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import {
  getDefaultBranchHeadOid,
  branchExists,
  createBranchRef,
  deleteBranchRef,
  commitFileToBranch,
} from "@/lib/studio/github-commit";

const PROBE_BRANCH = "studio/write-probe";
const PROBE_FILE = ".studio-write-probe.txt";

export async function POST() {
  // 1. Owner gate — reject before touching GitHub or reading the token.
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. Env-split — the GitHub write path is off by default (fs/no-op in dev).
  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      note: "github write path disabled (STUDIO_WRITE_MODE != github); no commit attempted",
    });
  }

  // 3. Token is read only here, server-side. Never returned to the client.
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  // 4. Reversible no-op commit to a throwaway branch, with guaranteed cleanup.
  try {
    const { branch: defaultBranch, oid: base } = await getDefaultBranchHeadOid();

    // Clear a dangling probe ref from a prior failed run so create cannot 422.
    if (await branchExists(PROBE_BRANCH)) {
      await deleteBranchRef(PROBE_BRANCH);
    }
    await createBranchRef(PROBE_BRANCH, base);

    try {
      const commit = await commitFileToBranch({
        branch: PROBE_BRANCH,
        path: PROBE_FILE,
        contents: `studio write probe ${new Date().toISOString()}\n`,
        message: "chore(studio): GH-1 write probe",
        expectedHeadOid: base,
      });
      return NextResponse.json({
        ok: true,
        mode: "github",
        defaultBranch,
        baseOid: base,
        sha: commit.oid,
        branch: PROBE_BRANCH,
        branchDeleted: true,
      });
    } finally {
      // Always remove the throwaway branch, even if the commit failed.
      await deleteBranchRef(PROBE_BRANCH);
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "commit_failed", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
