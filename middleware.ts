import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";

// GH-6 — owner gate for /studio. An unauthenticated request never renders (and
// never streams) any dashboard content. Uses the Node middleware runtime because
// verifyOwnerSession relies on node:crypto, which the Edge runtime cannot run.
//
// The GH-9 /keystatic dev-only guard was removed when /keystatic itself was
// retired (/studio is the sole editor now). With the route files deleted, Next
// 404s /keystatic by default in every environment, so no middleware branch is
// needed for it. /dev DOES need one — see below.
export const config = {
  runtime: "nodejs",
  matcher: ["/studio", "/studio/:path*", "/dev", "/dev/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /dev holds local-only harnesses (the canvas-vs-live parity page). The page
  // itself also notFound()s in production; this makes the whole prefix unreachable
  // there rather than relying on every future page under it remembering to.
  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return process.env.NODE_ENV === "production"
      ? new NextResponse(null, { status: 404 })
      : NextResponse.next();
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
