// POST /api/studio/reorder-entries — owner-gated collection REORDER.
//
// INTERNET-EXPOSED WRITE. The owner gate runs FIRST, before any GitHub call.
// github mode only (fs = no-op). Writes each entry's orderIndex on the DRAFT
// branch in ONE atomic commit, never main.
//
// THE BODY IS THE FULL ORDER, NOT A SWAP. The client sends every slug in the
// order it wants; the server assigns positions from the array. So the stored
// indices come out a clean 0..N-1 regardless of the gaps published entries have,
// and a request can only ever express a permutation — never an arbitrary index.
//
// The slug list is validated for shape AND for duplicates before anything is
// read. A duplicate would silently collapse two entries onto one position, which
// is precisely the corruption the atomic commit exists to prevent.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitCollectionOrder, isOrderedCollection } from "@/lib/studio/commit-collection-entry";
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

  let body: { collection?: unknown; slugs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const collection = body?.collection;
  /* ⚠ THE DERIVED SUBSET — see `isOrderedCollection`. This read `!== "experience" && !==
     "projects"`, which was correct when written and had already fallen behind: `COLLECTION_HAS_ORDER`
     declares the gallery orderable, and this chain would have refused it. The registry and the
     route now answer from the same place. */
  if (!isOrderedCollection(collection)) {
    return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
  }

  const slugs = body.slugs;
  // Same bare-slug guard as the other collection routes (path traversal), plus a
  // non-empty check and a duplicate check.
  if (
    !Array.isArray(slugs) ||
    slugs.length === 0 ||
    !slugs.every((s) => typeof s === "string" && /^[a-z0-9-]+$/.test(s))
  ) {
    return NextResponse.json({ ok: false, error: "invalid_slugs" }, { status: 400 });
  }
  if (new Set(slugs as string[]).size !== slugs.length) {
    return NextResponse.json({ ok: false, error: "duplicate_slugs" }, { status: 400 });
  }

  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      saved: false,
      note: "reorder needs github mode",
    });
  }
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  const result = await commitCollectionOrder(collection, slugs as string[], {
    branch: DRAFT_BRANCH,
  });

  if (!result.ok) {
    // A reorder that matches what is already stored is not a failure — nothing
    // needed committing. Reported as a successful no-op so the client does not
    // light an error for a harmless double-submit.
    if (result.error.code === "no_changes") {
      return NextResponse.json({
        ok: true,
        mode: "github",
        saved: false,
        note: "the order is unchanged",
      });
    }
    return NextResponse.json(result, {
      status: result.error.code === "not_found" ? 404 : 500,
    });
  }

  invalidateDraftStateCache();
  return NextResponse.json({ ok: true, mode: "github", saved: true, sha: result.sha });
}
