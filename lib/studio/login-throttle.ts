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
function storeConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstashCheck(ip: string): Promise<ThrottleResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL as string;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN as string;
  const key = `login-throttle:${ip}`;

  // One round-trip: INCR the counter, set the window only on the first attempt
  // (EXPIRE ... NX, so the window is fixed from the first attempt like the
  // in-memory path), and read the TTL for the retry-after.
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(WINDOW_SECONDS), "NX"],
      ["TTL", key],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash HTTP ${res.status}`);

  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(data) || data.length < 3 || typeof data[0]?.result !== "number") {
    throw new Error("unexpected upstash pipeline response");
  }

  const count = data[0].result as number;
  const ttl = typeof data[2]?.result === "number" ? data[2].result : WINDOW_SECONDS;
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
