// GET /api/studio/blog-blocks?slug=<slug> — owner-gated, READ-ONLY.
//
// BS-3c — the blog twin of case-study-sections, deferred from 3b precisely so the editor
// host could define its shape rather than 3b guessing it. The contract:
//
//   200 { ok, slug, source: "draft" | "live", blocks: unknown[], draftImages: string[] }
//
// TWO DELIBERATE DIFFERENCES FROM THE PROJECTS ROUTE:
//   - NO `template`. Blog has no template field and nothing in the blog canvas composes
//     on one, so returning it would be inventing a value for the client to ignore.
//   - `blocks` replaces `sections`, array-guarded the same way so a missing or odd value
//     yields an empty editor rather than throwing.
//
// `draftImages` IS kept and is load-bearing: a hero uploaded to the draft branch does not
// exist on main, so its public path 404s in the editor until publish. The editor routes
// those through the owner-gated draft-image proxy, exactly as the case-study canvas does.
//
// Read-only, so NO STUDIO_WRITE_MODE gate — getEntryDraftState is draft-preferring in
// github mode and degrades to live otherwise (and in fs/dev), matching the projects route.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { getBlogPost } from "@/lib/keystatic";
import { getEntryDraftState } from "@/lib/studio/entry-draft";

export async function GET(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Path-traversal guard (the same bare-slug shape every other studio route uses).
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  // UNFILTERED by status on purpose: the studio edits drafts, so this must not use the
  // public read's `=== "published"` gate. getBlogPost is the raw read (#170).
  const live = await getBlogPost(slug);
  if (!live) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const draft = await getEntryDraftState("blog", slug);
  const rawBlocks = draft.source === "draft" ? draft.raw : live.blocks;
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : [];

  return NextResponse.json({
    ok: true,
    slug,
    source: draft.source,
    blocks,
    draftImages: draft.draftImages,
  });
}
