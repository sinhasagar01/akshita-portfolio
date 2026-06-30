// POST /api/studio/commit-probe — GH-2 gated content-commit probe (no UI).
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner-session gate (reused from GH-1)
// runs FIRST, before any GitHub call. The write token is SERVER-SIDE ONLY and is
// never sent to the client. Env-split: the GitHub commit path runs only when
// STUDIO_WRITE_MODE=github. The transformed content is committed to a throwaway
// branch (left for the proof to fetch + delete); it NEVER commits to main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitSiteSettings } from "@/lib/studio/commit-site-settings";
import type { SiteSettingsInput } from "@/lib/studio/site-settings-format";

export async function POST(req: Request) {
  // 1. Owner gate — reject before any GitHub call.
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. Env-split — github commit path is off by default (fs in dev).
  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      note: "github write path disabled (STUDIO_WRITE_MODE != github); no commit attempted",
    });
  }

  // 3. Token is read only server-side. Never returned to the client.
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  // 4. Patch from the request body.
  let patch: Partial<SiteSettingsInput>;
  try {
    const body = await req.json();
    patch = (body?.patch ?? {}) as Partial<SiteSettingsInput>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // 5. Reuse the proven transform + GitHub delivery.
  const result = await commitSiteSettings(patch);
  if (!result.ok) {
    const status = result.error.code === "invalid_url" ? 422 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
