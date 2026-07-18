// GET /api/studio/case-study-sections?slug=<slug> — owner-gated, READ-ONLY.
//
// CS-1 — serves one project's draft-preferring `sections` so the studio detail
// view's inline "Sections" tab can lazy-load them on demand. This keeps the
// projects-list payload free of the ~15KB-per-project sections that the /body
// route was built to avoid — only the case study actually being edited pays for
// its sections. Same draft-preferring logic the /body and /preview pages use.
//
// Read-only: no GitHub write, so no STUDIO_WRITE_MODE gate. getCaseStudyDraftState
// is draft-preferring in github mode and degrades to live (and returns live in
// fs/dev), exactly like the body/preview pages. The public read-split is untouched.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { getCaseStudyData } from "@/lib/keystatic";
import { getCaseStudyDraftState } from "@/lib/studio/case-study-draft";

export async function GET(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Path-traversal guard (same bare-slug shape as save-draft / delete-entry).
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  const live = await getCaseStudyData(slug);
  if (!live) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  // Draft-preferring, mirroring the /body page: draft sections when this slug
  // changed on the draft branch, else live. Array-guarded so a missing/odd value
  // yields an empty editor rather than throwing.
  const draft = await getCaseStudyDraftState(slug);
  const rawSections = draft.source === "draft" ? draft.rawSections : live.rawSections;
  const sections = Array.isArray(rawSections) ? rawSections : [];

  return NextResponse.json({ ok: true, slug, source: draft.source, sections });
}
