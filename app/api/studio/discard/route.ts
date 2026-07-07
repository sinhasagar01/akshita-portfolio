// POST /api/studio/discard — owner-gated discard-all (delete the draft branch).
//
// INTERNET-EXPOSED WRITE. The owner gate runs FIRST, before any GitHub call, the
// same boundary as publish/save-draft. Discard deletes ONLY the draft branch
// (studio/draft-site-settings) via discardSiteSettingsDraft — it can never touch
// main. env-split is handled inside discardSiteSettingsDraft (fs mode returns a
// safe not_applicable no-op).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { discardSiteSettingsDraft } from "@/lib/studio/discard-site-settings";
import { invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";

export async function POST() {
  // Owner gate — reject before any GitHub call.
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await discardSiteSettingsDraft();
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  // The draft branch is now gone (deleted, or never existed), so drop the cached
  // draft read — the next /studio render must find no draft and fall back to live.
  if (result.discarded || result.reason === "no_draft") {
    invalidateDraftStateCache();
  }
  return NextResponse.json(result);
}
