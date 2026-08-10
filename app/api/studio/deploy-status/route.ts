// GET /api/studio/deploy-status?sha=… — is the merge that just landed actually LIVE?
//
// ⚠ A PUBLISH RETURNING ok MEANS THE MERGE LANDED, NOT THAT THE SITE IS LIVE. `publishSiteSettings`
// has returned `{ merged: true, sha, deployPending: true }` since GH-5c and NOTHING HAS EVER READ
// EITHER FIELD — a contract built for this question and left unjoined. Vercel joins on the same
// value: a deployment carries `meta.githubCommitSha`, so the merge SHA identifies the deployment
// without anything having to be threaded through.
//
// ⚠ SERVER-SIDE ONLY, BECAUSE THE TOKEN MUST NEVER REACH THE CLIENT. The toast polls this route;
// the route holds the credential. Owner-gated first, before any outbound call, exactly as the
// publish route is.
//
// ⚠ AND IT FAILS QUIET, NOT OPEN — #175's rule, unchanged. Without a credential this route CANNOT
// know whether the site is live, so it says `unavailable` and the toast stays at "published,
// rebuilding": the weaker true thing rather than the stronger false one. It never claims READY it
// has not seen, and it never hangs waiting for an answer that cannot come.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";

/** What the toast is allowed to believe. `unavailable` is a real answer, not an error. */
export type DeployState = "building" | "ready" | "error" | "unavailable";

/** Vercel's own vocabulary, mapped to ours. Anything unrecognised is treated as still building
 *  rather than as ready — an unknown state must never resolve the optimistic direction. */
function mapState(v: unknown): DeployState {
  switch (v) {
    case "READY": return "ready";
    case "ERROR":
    case "CANCELED": return "error";
    default: return "building";
  }
}

export async function GET(req: Request) {
  // Owner gate — reject before any outbound call, the same shape as the publish route.
  const jar = await cookies();
  const session = verifyOwnerSession(jar.get(SESSION_COOKIE_NAME)?.value, Math.floor(Date.now() / 1000));
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const sha = new URL(req.url).searchParams.get("sha");
  if (!sha) return NextResponse.json({ ok: true, state: "unavailable", reason: "no_sha" });

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  /* ⚠ THE DEGRADE PATH IS THE DEFAULT, NOT THE EXCEPTION. Production needs these set in Vercel and
     that is owner-only configuration; until it is, every caller gets `unavailable` and the UI is
     correct rather than merely quiet. */
  if (!token || !projectId) {
    return NextResponse.json({ ok: true, state: "unavailable", reason: "no_credential" });
  }

  try {
    const teamQ = process.env.VERCEL_TEAM_ID ? `&teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectId)}` +
        `&meta-githubCommitSha=${encodeURIComponent(sha)}&target=production&limit=1${teamQ}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) {
      /* An API that answers badly is the same epistemic position as no API at all: we do not know.
         Reported as `unavailable` rather than `error`, because `error` means THE DEPLOY failed. */
      return NextResponse.json({ ok: true, state: "unavailable", reason: `api_${res.status}` });
    }
    const json = (await res.json()) as { deployments?: Array<{ state?: string; url?: string }> };
    const d = json.deployments?.[0];
    if (!d) return NextResponse.json({ ok: true, state: "building", reason: "not_seen_yet" });
    return NextResponse.json({
      ok: true,
      state: mapState(d.state),
      ...(d.url ? { url: `https://${d.url}` } : {}),
    });
  } catch {
    return NextResponse.json({ ok: true, state: "unavailable", reason: "unreachable" });
  }
}
