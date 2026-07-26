// GH-7 — per-IP login throttle with a durable backing store.
//
// Same policy as the original in-memory throttle (a fixed WINDOW_SECONDS window
// from the first attempt, MAX_ATTEMPTS allowed, then lockout), but backed by
// Upstash Redis in prod so it survives serverless cold starts and spans
// instances. Server-side only.
//
// Env-split: with no store vars this is the in-memory throttle unchanged, so dev
// needs no setup. Failure policy: if the store is configured but unreachable we
// FAIL OPEN, degrading to the in-memory throttle with a logged warning, so a
// store outage never locks the single owner out of their own CMS while still
// keeping per-instance brute-force protection on. Never silent.
//
// BS-4a — THE POLICY BELOW IS UNCHANGED. Only the transport moved out, into
// lib/upstash.ts, so the loves store and this module send commands through one
// implementation instead of two hand-rolled copies of the same fetch.
//
// A COST TAKEN KNOWINGLY: this module had no relative imports, which made it
// loadable by a ralph suite (it never had one). Importing the transport and the
// key prefix makes it permanently UNREACHABLE by ralph, because a suite cannot
// resolve an extensionless relative TS import. Injecting the transport here the
// way the loves store does would have kept that door open, but it would also
// have let any caller of a security-adjacent function substitute its store —
// and the throttle is the one place where that is worth refusing. The transport
// itself is now covered by ralph/tests/upstash-transport.mjs, which is more
// coverage of this code path than existed before the extraction, not less.
import { pipeline, storeConfigured } from "../upstash";
import { REDIS_KEY_PREFIXES } from "../loves/store";

const WINDOW_SECONDS = 60;
const WINDOW_MS = WINDOW_SECONDS * 1000;
const MAX_ATTEMPTS = 5;

export type ThrottleResult = { allowed: boolean; retryAfterSeconds?: number };

// ---- In-memory throttle (dev default + outage fallback) ----
// Fixed window from the first attempt, exactly the original route policy.
const memory = new Map<string, { count: number; first: number }>();

function memoryCheck(ip: string, nowMs: number): ThrottleResult {
  const rec = memory.get(ip);
  if (!rec || nowMs - rec.first > WINDOW_MS) {
    memory.set(ip, { count: 1, first: nowMs });
    return { allowed: true };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rec.first + WINDOW_MS - nowMs) / 1000));
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

// ---- Upstash Redis REST (prod) ----
async function upstashCheck(ip: string): Promise<ThrottleResult> {
  // The prefix is imported, not written, so the loves rate limiter can be
  // ASSERTED never to collide with this counter. Both are fixed-window INCRs
  // keyed by IP; sharing one key would let blog traffic lock the owner out of
  // the studio. See ralph/tests/loves-store.mjs (A1).
  const key = `${REDIS_KEY_PREFIXES.loginThrottle}:${ip}`;

  // One round-trip: INCR the counter, set the window only on the first attempt
  // (EXPIRE ... NX, so the window is fixed from the first attempt like the
  // in-memory path), and read the TTL for the retry-after.
  const results = await pipeline([
    ["INCR", key],
    ["EXPIRE", key, String(WINDOW_SECONDS), "NX"],
    ["TTL", key],
  ]);
  // The transport already rejects a bad envelope and per-command errors. This
  // is the one check it cannot make for us: the counter must be a number, or we
  // would compare undefined against MAX_ATTEMPTS and silently allow forever.
  if (typeof results[0] !== "number") {
    throw new Error("unexpected upstash pipeline response");
  }

  const count = results[0];
  const ttl = typeof results[2] === "number" ? results[2] : WINDOW_SECONDS;
  if (count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS };
  }
  return { allowed: true };
}

/**
 * Record a login attempt for this IP and report whether it is allowed. Uses the
 * durable store when configured, otherwise (or on a store error) the in-memory
 * throttle. Callers await this before the password check, same order as before.
 */
export async function checkAndRecordAttempt(ip: string): Promise<ThrottleResult> {
  if (!storeConfigured()) {
    return memoryCheck(ip, Date.now());
  }
  try {
    return await upstashCheck(ip);
  } catch (err) {
    // Fail open, degrade to in-memory, and say so. Never silent.
    console.warn(
      "[login-throttle] durable store unreachable, falling back to in-memory throttle:",
      err instanceof Error ? err.message : err
    );
    return memoryCheck(ip, Date.now());
  }
}
