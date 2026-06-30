// POST /api/studio/login — owner login for the /studio write boundary.
//
// PUBLIC, UNAUTHENTICATED endpoint. The password is compared in constant time
// and the route is throttled per IP. On success it sets the signed, httpOnly
// studio_session cookie. The session secret and password are server-side only.
//
// PRE-PROD TODO (mandatory): the in-memory throttle below does NOT span
// serverless instances or survive cold starts. Replace it with a durable
// rate-limiter (e.g. Upstash / KV) before this ships to production.
import { NextResponse } from "next/server";
import {
  verifyOwnerPassword,
  signSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/studio/owner-session";

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function throttled(ip: string, now: number): boolean {
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip, now)) {
    return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
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
