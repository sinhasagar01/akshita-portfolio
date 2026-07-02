// POST /api/studio/login — owner login for the /studio write boundary.
//
// PUBLIC, UNAUTHENTICATED endpoint. The password is compared in constant time
// and the route is throttled per IP. On success it sets the signed, httpOnly
// studio_session cookie. The session secret and password are server-side only.
//
// Throttling is per IP and durable in prod (see lib/studio/login-throttle.ts):
// backed by Upstash Redis so it survives cold starts and spans instances, with
// an in-memory fallback in dev and during a store outage.
import { NextResponse } from "next/server";
import {
  verifyOwnerPassword,
  signSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/studio/owner-session";
import { checkAndRecordAttempt } from "@/lib/studio/login-throttle";

export async function POST(req: Request) {
  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const gate = await checkAndRecordAttempt(ip);
  if (!gate.allowed) {
    const res = NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    if (gate.retryAfterSeconds) res.headers.set("Retry-After", String(gate.retryAfterSeconds));
    return res;
  }

  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!verifyOwnerPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const token = signSession(Math.floor(now / 1000));
  if (!token) {
    return NextResponse.json({ ok: false, error: "session_not_configured" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
