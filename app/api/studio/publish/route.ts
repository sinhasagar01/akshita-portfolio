// POST /api/studio/publish — GH-5c gated publish (merge draft -> main).
//
// INTERNET-EXPOSED WRITE ENDPOINT and the only one that can change main. The
// owner gate runs FIRST, before any GitHub call. Publishing validates the draft
// and merges it into main via the conflict-safe merges API, then the live site
// updates after the Vercel rebuild (publishSiteSettings returns deployPending so
// the UI can show a "rebuilding" state). env-split is handled inside
// publishSiteSettings (fs mode returns not_applicable, a safe no-op).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { publishSiteSettings } from "@/lib/studio/publish-site-settings";
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

  const result = await publishSiteSettings();
  if (!result.ok) {
    const status =
      result.error.code === "merge_conflict"
        ? 409
        : // invalid_sections joins invalid_url: an unpublishable draft is refused
          // here rather than failing the Vercel build (P4 4b-iv).
          result.error.code === "invalid_url" || result.error.code === "invalid_sections"
          ? 422
          : 500;
    return NextResponse.json(result, { status });
  }
  // The merge deleted the draft branch (GH-4 promote-then-clear), so drop the
  // cached draft read (GH-8) — the next settings render must find no draft.
  if (result.merged) {
    invalidateDraftStateCache();
  }
  return NextResponse.json(result);
}
