// POST /api/studio/draft-state-probe — GH-3 gated proof of the draft read-split.
//
// Owner-gated. Returns the { live, draft, differs } shape (slimmed to aboutNote)
// so the read-split can be verified via curl without any UI. GH-5 replaces this
// with the real settings UI. This reads only; it never writes.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { getStudioData } from "@/lib/studio/data";

export async function POST() {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const data = await getStudioData();
  const st = data.settingsDraftState;
  return NextResponse.json({
    ok: true,
    mode: process.env.STUDIO_WRITE_MODE === "github" ? "github" : "fs",
    hasDraft: st.draft !== null,
    differs: st.differs,
    // draft-preferred value the /studio surface actually sees:
    studioAboutNote: data.settings?.aboutNote ?? null,
    liveAboutNote: st.live?.aboutNote ?? null,
    draftAboutNote: st.draft?.aboutNote ?? null,
  });
}
