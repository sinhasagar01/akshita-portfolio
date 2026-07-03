// POST /api/studio/save-draft — GH-5b on-blur draft auto-save (owner-gated).
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub
// call. github mode only (fs = no-op). The client never holds the token — it
// posts the patch, the server commits to the DRAFT branch via the proven
// commitSiteSettings, and returns the fresh live-vs-draft differs for the badge.
// Writes the draft branch only, never main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { load } from "js-yaml";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitSiteSettings } from "@/lib/studio/commit-site-settings";
import {
  DRAFT_BRANCH,
  invalidateDraftStateCache,
  settingsDiffer,
} from "@/lib/studio/draft-site-settings";
import { getHomePageData, mapSiteSettings } from "@/lib/keystatic";
import { sanitizeSiteSettingsPatch } from "@/lib/studio/site-settings-format";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Parse and sanitize BEFORE the env-split, so a malformed body is rejected in
  // every mode (the fs no-op cannot mask it) and only a typed, known-field,
  // string-valued patch can ever reach the transform (review finding 5).
  let rawPatch: unknown;
  try {
    const body = await req.json();
    rawPatch = body?.patch ?? {};
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const sanitized = sanitizeSiteSettingsPatch(rawPatch);
  if (!sanitized.ok) {
    return NextResponse.json(sanitized, { status: 400 });
  }
  const patch = sanitized.patch;

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

  const result = await commitSiteSettings(patch, {
    branch: DRAFT_BRANCH,
    message: "chore(studio): update site settings draft",
  });
  if (!result.ok) {
    const status = result.error.code === "invalid_url" ? 422 : 500;
    return NextResponse.json(result, { status });
  }

  // The draft branch just changed, so drop the cached draft read (GH-8) for the
  // next settings-page render.
  invalidateDraftStateCache();

  // The response differs comes from the BYTES this save just committed (review
  // finding 6), never from the cache, which Next may serve stale within the
  // same request. Reads live only; never writes main.
  const live = (await getHomePageData()).settings;
  const draftEntry = mapSiteSettings((load(result.bytes) ?? {}) as Record<string, unknown>);
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    differs: settingsDiffer(live, draftEntry),
  });
}
