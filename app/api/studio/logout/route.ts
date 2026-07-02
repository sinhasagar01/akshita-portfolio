// POST /api/studio/logout — clear the owner session and return to the login page.
//
// Clears the httpOnly studio_session cookie by overwriting it with an expired
// value using the SAME attributes the login route set (path "/", httpOnly,
// sameSite lax, secure in prod), then redirects to /studio/login. No session
// logic, so it mirrors the login route. A plain form POST works without JS.
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/studio/login", req.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
