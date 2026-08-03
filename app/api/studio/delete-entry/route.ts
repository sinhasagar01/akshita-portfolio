// POST /api/studio/delete-entry — owner-gated collection DELETE (item 13 + 11).
//
// INTERNET-EXPOSED WRITE. The owner gate runs FIRST, before any GitHub call.
// github mode only (fs = no-op). Deletes a collection entry from the DRAFT branch
// via the F-3 deleteCollectionEntry. experience (item 13) is one flat file;
// projects (item 11) enumerate <slug>.yaml + content/projects/<slug>/body/** and
// delete them in ONE atomic commit, with a bespoke-slug guard (boat-crest).
// Writes the draft branch only, never main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { deleteCollectionEntry } from "@/lib/studio/commit-collection-entry";
import { DRAFT_BRANCH, invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { collection?: unknown; slug?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const collection = body?.collection;
  if (collection !== "experience" && collection !== "projects" && collection !== "blog") {
    return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
  }
  // Path-traversal guard (same as save-draft): the slug must be a bare slug.
  const slug = body.slug;
  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      saved: false,
      note: "delete needs github mode",
    });
  }
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  const result = await deleteCollectionEntry(collection, slug, { branch: DRAFT_BRANCH });
  if (!result.ok) {
    // The 409 for `bespoke_locked` went with #292: no slug is bespoke any more, so nothing can
    // return that code and a branch for it would be unreachable.
    const status = result.error.code === "not_found" ? 404 : 500;
    return NextResponse.json(result, { status });
  }

  invalidateDraftStateCache();
  return NextResponse.json({ ok: true, mode: "github", saved: true, sha: result.sha });
}
