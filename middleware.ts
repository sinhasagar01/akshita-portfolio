import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { isSectionsOwnedProject } from "@/lib/studio/keystatic-lock";

// Two jobs, both of which must run BEFORE any rendering.
//
// GH-6 — owner gate for /studio. An unauthenticated request never renders (and
// never streams) any dashboard content. Uses the Node middleware runtime because
// verifyOwnerSession relies on node:crypto, which the Edge runtime cannot run.
//
// GH-9 — /keystatic is dev-only by decision (/studio is the prod editor, and
// Keystatic's local storage cannot work on the deployed site). In production the
// /keystatic page and its API route return 404 so the editor can never render
// broken or misleading. In dev this branch no-ops and Keystatic is untouched.
export const config = {
  runtime: "nodejs",
  matcher: [
    "/studio",
    "/studio/:path*",
    "/keystatic",
    "/keystatic/:path*",
    "/api/keystatic",
    "/api/keystatic/:path*",
  ],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // GH-9 — dev-only Keystatic. A plain 404 in prod, a no-op in dev.
  if (pathname === "/keystatic" || pathname.startsWith("/keystatic/") || pathname.startsWith("/api/keystatic")) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Not Found", { status: 404 });
    }
    // P4 4(b)-i — don't let the owner OPEN a /studio-owned case study here. The
    // real lock is the update-route guard (the slug is in the write body, not the
    // URL, so it cannot live here); this is the legibility half. Without it you
    // would open the editor, type, hit Save, and lose the work to a 403.
    const item = /^\/keystatic\/collection\/projects\/item\/([a-z0-9-]+)/.exec(pathname);
    if (item && isSectionsOwnedProject(item[1])) {
      return new NextResponse(
        `This case study is edited in /studio, not here. Open /studio/projects/${item[1]}/body`,
        { status: 404, headers: { "content-type": "text/plain" } }
      );
    }
    return NextResponse.next();
  }

  // The login page must stay reachable while logged out.
  if (pathname === "/studio/login") {
    return NextResponse.next();
  }
  const session = verifyOwnerSession(
    req.cookies.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/studio/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
