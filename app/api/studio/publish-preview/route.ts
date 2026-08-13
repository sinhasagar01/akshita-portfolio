// GET /api/studio/publish-preview — what a publish would change, before it changes it.
//
// ⚠ INTERNET-EXPOSED AND IT READS UNPUBLISHED CONTENT, so the owner gate runs FIRST, before any
// GitHub call, exactly as `publish/route.ts` does. A draft is content the owner has deliberately
// not made public yet, and this endpoint hands back its text.
//
// ⚠ IT IS A READ, AND IT IS THE ONLY THING IT DOES. The publish gate's own validation and its
// fail-closed truncation posture live in `publishSiteSettings` and are untouched — this route
// cannot merge, cannot commit, and cannot change a branch. That separation is the reason a preview
// failure is allowed to be non-blocking (see the client's posture in `PublishBar`).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { compareBranches } from "@/lib/studio/github-commit";
import { BASE_BRANCH } from "@/lib/studio/github-commit";
import { DRAFT_BRANCH } from "@/lib/studio/draft-site-settings";
import { getStudioData } from "@/lib/studio/data";
import { buildPreview } from "@/lib/studio/publish-preview";

export async function GET() {
  // Owner gate — reject before any GitHub call.
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Same env split every write route carries. fs mode has no branches to compare, so it reports
  // not_applicable rather than erroring — the dialog then says so plainly instead of looking broken
  // to someone running the studio locally.
  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({ ok: true, reason: "not_applicable" });
  }

  try {
    const cmp = await compareBranches(BASE_BRANCH, DRAFT_BRANCH, { withPatches: true });
    if (cmp === null) {
      // No draft branch at all. Not an error — there is simply nothing to publish.
      return NextResponse.json({
        ok: true,
        preview: { entries: [], fileCount: 0, truncated: false },
      });
    }

    // Titles come from getStudioData(), which CLAUDE.md names as the single studio read seam. It is
    // cache()d, so on a studio request this is already warm.
    //
    // ⚠ A DELETED ENTRY IS ABSENT FROM IT BY DESIGN — the draft overlay subtracts a deletion — so
    // its slug is the fallback. Stated here rather than papered over, because the alternative is a
    // second read against the live branch to resolve a name for something being removed.
    const data = await getStudioData();
    const titles: Record<string, string> = {};
    for (const p of data.projects) titles[p.slug] = p.title;
    for (const b of data.blog) titles[b.slug] = b.title;
    for (const e of data.experience) titles[e.slug] = `${e.title}, ${e.company}`;
    /* ⚠ GALLERY WAS MISSING FROM THIS MAP, so every gallery entry in the preview fell back to its
       slug — the fix-once-per-collection shape, in a map that names three of four collections. It
       is invisible until somebody reads a preview containing a gallery item, which is why it
       survived the collection's whole build. */
    for (const g of data.gallery) titles[g.slug] = g.title;

    return NextResponse.json({
      ok: true,
      preview: buildPreview(cmp.files, titles, cmp.truncated),
    });
  } catch {
    // The preview could not be built. The client keeps Publish enabled and says so — see the
    // posture note in PublishBar. A read failure must never lock the owner out of their own site.
    return NextResponse.json({ ok: false, error: "preview_failed" }, { status: 502 });
  }
}
