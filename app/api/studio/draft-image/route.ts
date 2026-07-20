// GET /api/studio/draft-image?path=/images/... — serve an image from the DRAFT
// branch so /studio can see it before publish.
//
// OWNER-GATED READ. The gate runs FIRST, before the path is even parsed, because
// this route reads repo bytes with the server-side token. It is a READ ONLY —
// there is no write path here at all — but it must not become an unauthenticated
// window onto the repo, so it is gated exactly like every other studio surface.
//
// THE CLIENT NEVER PICKS A REPO PATH. It supplies a PUBLIC path (/images/**),
// which isSafeImagePath re-validates on the untrusted value, and the route
// derives the repo path itself by prefixing `public`. So `path` cannot escape the
// image tree, and cannot name content/, .env, or a workflow file.
//
// DRAFT FIRST, THEN MAIN. An image the owner just uploaded exists only on the
// draft branch; an image already published exists only on main. Trying draft then
// falling back to main means one URL is correct for both, so callers (the image
// fields, and later the preview canvas) never need to know which branch a given
// image is on.
//
// fs MODE REDIRECTS. In dev the file is on local disk and the dev server already
// serves it, so the route 302s to the plain path rather than calling GitHub. That
// keeps a single URL shape working in both modes.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { getFileBytesAtRef } from "@/lib/studio/github-commit";
import { DRAFT_BRANCH, MAIN_BRANCH } from "@/lib/studio/draft-site-settings";
import { isSafeImagePath, imageContentType } from "@/lib/studio/draft-image";

export async function GET(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!isSafeImagePath(path)) {
    return NextResponse.json({ ok: false, error: "invalid_path" }, { status: 400 });
  }

  // Dev — the file is on disk and already served. No GitHub call.
  if (process.env.STUDIO_WRITE_MODE !== "github" || !process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.redirect(new URL(path, req.url));
  }

  const repoPath = `public${path}`;
  let bytes: Uint8Array | null = null;
  try {
    bytes = await getFileBytesAtRef(repoPath, DRAFT_BRANCH);
    if (bytes === null) bytes = await getFileBytesAtRef(repoPath, MAIN_BRANCH);
  } catch {
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 502 });
  }
  if (bytes === null) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": imageContentType(path),
      // Draft content changes under a stable path (heroImage.webp is overwritten
      // in place), and it is owner-only, so it must never be cached by a shared
      // cache or held across an upload.
      "Cache-Control": "private, no-store",
    },
  });
}
