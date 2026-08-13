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
import {
  commitCollectionEntry,
  isCollectionName,
  sanitizeCreateInput,
} from "@/lib/studio/commit-collection-entry";
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

  let body: { collection?: unknown; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const collection = body?.collection;
  // The DERIVED guard — see `isCollectionName`. This was a four-term `!==` chain that had to be
  // widened by hand beside the dispatch below; now the allowlist and the dispatch read the same
  // registry and cannot fall out of step.
  if (!isCollectionName(collection)) {
    return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
  }

  /* Sanitize BEFORE the env-split, so a malformed body is rejected in EVERY mode — the fs no-op
     cannot mask it. Slug derivation stays in the lib; the route never slugifies.

     ⚠ ONE SANITIZER ON THIS PATH NOW, WHERE THERE WERE TWO, AND THE SECOND ONE'S RESULT WAS THE
     DISCARDED ONE. This computed `sanitized` for the 400 above and then passed `body.input` — the
     RAW value — to `commitCollectionEntry`, which sanitized it again through its own dispatch. So
     the collection-correct result was thrown away and the bytes that reached disk came from
     whichever arm that second dispatch chose. When its `else` arm was projects, that is exactly how
     a gallery create wrote a project-shaped file.

     ⚠ AND THE REPO ALREADY HAD ONE SPELLING FOR THIS — CREATE WAS THE DEVIATION. `save-draft` hands
     the commit layer `sanitizedEntry.patch`, and the lib's EDIT path serializes it without
     re-sanitizing. Create is now the same shape, which makes this a consistency repair rather than
     a new design.

     ⚠ THE CALLER IS DERIVED, NOT ASSUMED. Each create sanitizer has exactly two production callers,
     this route and the commit layer, and no other. So removing the second call leaves every one of
     them with a single caller and nothing orphaned; the check was taken before the edit rather
     than after it. */
  const sanitized = sanitizeCreateInput(collection, body.input);
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

  const result = await commitCollectionEntry(collection, sanitized.value, {
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
