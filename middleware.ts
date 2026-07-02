import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";

// GH-6 — owner gate for /studio. Runs BEFORE any rendering, so an unauthenticated
// request never renders (and never streams) any dashboard content. Uses the Node
// middleware runtime because verifyOwnerSession relies on node:crypto, which the
// Edge runtime cannot run.
export const config = {
  runtime: "nodejs",
  matcher: ["/studio", "/studio/:path*"],
};

export function middleware(req: NextRequest) {
  // The login page must stay reachable while logged out.
  if (req.nextUrl.pathname === "/studio/login") {
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
