// POST /api/studio/create-entry — owner-gated collection CREATE (item 13 + 11).
//
// INTERNET-EXPOSED WRITE. The owner gate runs FIRST, before any GitHub call, the
// same boundary as save-draft/publish/discard. github mode only (fs = no-op).
// Creates a new collection entry file on the DRAFT branch via the F-3 guarded
// create path (commitCollectionEntry intent:"create"), which DERIVES the slug
// from the input's slug field — the route never accepts a client-supplied slug.
// experience (item 13) + projects (item 11, a body:[] stub); writes the draft
// branch only, never main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitCollectionEntry } from "@/lib/studio/commit-collection-entry";
import { DRAFT_BRANCH, invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";
import { sanitizeExperienceCreate } from "@/lib/studio/experience-format";
import { sanitizeProjectCreate } from "@/lib/studio/projects-format";
import { sanitizeGalleryCreate } from "@/lib/studio/gallery-format";
import { sanitizeBlogCreate } from "@/lib/studio/blog-format";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { collection?: unknown; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const collection = body?.collection;
  if (
    collection !== "experience" &&
    collection !== "projects" &&
    collection !== "blog" &&
    collection !== "gallery"
  ) {
    return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
  }

  // Sanitize BEFORE the env-split, so a malformed body is rejected in EVERY mode
  // (the fs no-op cannot mask it). The lib re-sanitizes defensively; this is the
  // mode-independent gate. slug derivation lives in the lib (no route slugify).
  // Explicit per-collection arms — a two-way ternary would have routed blog into the
  // experience sanitizer once the allowlist widened.
  // ⚠ THE LAST ARM IS A FALLTHROUGH — see save-draft's note. The allowlist is what makes it safe,
  // so widening one without the other silently routes a new collection into experience.
  const sanitized =
    collection === "projects"
      ? sanitizeProjectCreate(body.input)
      : collection === "blog"
        ? sanitizeBlogCreate(body.input)
        : collection === "gallery"
          ? sanitizeGalleryCreate(body.input)
          : sanitizeExperienceCreate(body.input);
  if (!sanitized.ok) {
    return NextResponse.json(sanitized, { status: 400 });
  }

  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      saved: false,
      note: "create needs github mode",
    });
  }
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  const result = await commitCollectionEntry(collection, body.input, {
    branch: DRAFT_BRANCH,
    intent: "create",
  });
  if (!result.ok) {
    const status =
      result.error.code === "slug_taken"
        ? 409
        : result.error.code === "invalid_slug"
          ? 400
          : 500;
    return NextResponse.json(result, { status });
  }

  invalidateDraftStateCache();
  // result.slug is the server-derived identity (set by the create path).
  return NextResponse.json({ ok: true, mode: "github", saved: true, sha: result.sha, slug: result.slug });
}
