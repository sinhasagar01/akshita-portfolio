// Owner-session gate for the /studio write boundary.
//
// This guards an INTERNET-EXPOSED repo-write endpoint. The session is an
// HMAC-SHA256 signed, httpOnly cookie. Every secret / signature comparison uses
// crypto.timingSafeEqual (never ===) to avoid a timing oracle on a public auth
// surface. Lengths are equalized by hashing both sides before the compare so
// timingSafeEqual cannot throw on a length mismatch. No dependency: node:crypto.
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "studio_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

function getSecret(): string | null {
  const s = process.env.STUDIO_SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Constant-time compare. Both sides are hashed to fixed-length digests first,
 *  so length never leaks and timingSafeEqual never throws on a length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "studio-cmp").update(a).digest();
  const hb = createHmac("sha256", "studio-cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export type OwnerSession = { owner: true; iat: number; exp: number };

/** Build a signed session token for the owner, or null if the secret is unset. */
export function signSession(nowSeconds: number): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const session: OwnerSession = {
    owner: true,
    iat: nowSeconds,
    exp: nowSeconds + MAX_AGE_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify a session token. Returns the session only if the signature is valid,
 *  it is an owner session, and it has not expired. Fails closed otherwise. */
export function verifyOwnerSession(
  token: string | undefined,
  nowSeconds: number
): OwnerSession | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload, secret))) return null;
  let parsed: OwnerSession;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (parsed.owner !== true) return null;
  if (typeof parsed.exp !== "number" || parsed.exp < nowSeconds) return null;
  return parsed;
}

/** Constant-time check of the owner password against STUDIO_OWNER_PASSWORD. */
export function verifyOwnerPassword(input: string): boolean {
  const expected = process.env.STUDIO_OWNER_PASSWORD;
  if (!expected || expected.length === 0) return false;
  return safeEqual(input, expected);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
