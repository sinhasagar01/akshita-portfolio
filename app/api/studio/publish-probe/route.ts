// POST /api/studio/publish-probe — GH-4 gated publish (merge draft -> main).
//
// INTERNET-EXPOSED WRITE ENDPOINT and the FIRST that can change main. The owner
// gate runs FIRST, before any GitHub call. Publishing validates the draft and
// merges it into main via the conflict-safe merges API. GH-5 replaces this probe
// route with the real UI (using deployPending for a "Publishing…" state).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { publishSiteSettings } from "@/lib/studio/publish-site-settings";

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

  const result = await publishSiteSettings();
  if (!result.ok) {
    const status =
      result.error.code === "merge_conflict"
        ? 409
        : result.error.code === "invalid_url"
          ? 422
          : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
