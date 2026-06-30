// POST /api/studio/save-draft — GH-5b on-blur draft auto-save (owner-gated).
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub
// call. github mode only (fs = no-op). The client never holds the token — it
// posts the patch, the server commits to the DRAFT branch via the proven
// commitSiteSettings, and returns the fresh live-vs-draft differs for the badge.
// Writes the draft branch only, never main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitSiteSettings } from "@/lib/studio/commit-site-settings";
import { DRAFT_BRANCH, getSiteSettingsDraftState } from "@/lib/studio/draft-site-settings";
import { getHomePageData } from "@/lib/keystatic";
import type { SiteSettingsInput } from "@/lib/studio/site-settings-format";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      saved: false,
      note: "draft save needs github mode",
    });
  }
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  let patch: Partial<SiteSettingsInput>;
  try {
    const body = await req.json();
    patch = (body?.patch ?? {}) as Partial<SiteSettingsInput>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const result = await commitSiteSettings(patch, {
    branch: DRAFT_BRANCH,
    message: "chore(studio): update site settings draft",
  });
  if (!result.ok) {
    const status = result.error.code === "invalid_url" ? 422 : 500;
    return NextResponse.json(result, { status });
  }

  // Recompute the live-vs-draft differs for the badge. Reads live only; never writes main.
  const live = (await getHomePageData()).settings;
  const draftState = await getSiteSettingsDraftState(live);
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    differs: draftState.differs,
  });
}
