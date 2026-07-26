// BS-4a — the love counter's POLICY. Keys, hashing, clamping, dedupe, rate limiting.
//
// THE TRANSPORT IS INJECTED (makeLoveStore({ pipeline })), which is the move that makes
// everything below testable: an in-memory fake pipeline exercises the whole policy — GET,
// POST, dedupe, the rate limit, the clamp, the batch parse, and the failure behaviour —
// with no Upstash and no network. This is the FOURTH time the strip-types constraint has
// shaped architecture (3a's keystatic mirror, 3b's injected combinators, 3c's .tsx split,
// and now this): a module ralph must unit-test cannot be .tsx and cannot carry an
// extensionless relative TS import. Injection is how a module keeps a dependency and
// stays a leaf.
//
// ONE FILE, NOT TWO — a deviation from the plan, forced by that same constraint. The plan
// had a separate lib/loves/keys.ts so the hash could be tested without a store. But
// store.ts importing "./keys" is an extensionless relative TS import, which would make
// store.ts unloadable by ralph and defeat the whole design. So the pure helpers live here
// and are exported individually; a suite imports `hashIp` without ever calling
// makeLoveStore, which is what the split was for.
//
// FAIL QUIET, NOT FAIL OPEN. login-throttle fails OPEN — on a store outage it degrades to
// an in-memory throttle, because refusing would lock the owner out of their own CMS. That
// frame does not transfer: loves grants no permission, so there is nothing to open. On any
// store failure the read reports unavailable and the UI shows NO NUMBER. A memory-backed
// count in production would be a fabricated number that resets on every cold start, which
// is worse than none — the same reasoning that made PR 2 refuse to render a static 0.
import { createHash } from "node:crypto";
import type { Pipeline } from "../upstash";

/**
 * EVERY Redis key prefix this app uses, declared in ONE place.
 *
 * The login-throttle prefix lives here, which looks like the wrong home until you see
 * what it prevents. login-throttle is a fixed-window counter keyed by IP; so is the loves
 * rate limiter. Calling `checkAndRecordAttempt` for loves — the obvious "reuse" — would
 * have put BLOG TRAFFIC AND OWNER LOGINS ON ONE SHARED COUNTER, so a burst of visitors
 * loving posts could lock the owner out of the studio. Loves therefore reuses the SHAPE
 * (INCR + EXPIRE NX + TTL), never the function, and the two prefixes are asserted
 * mutually non-colliding in ralph. That assertion needs both names from one source, and
 * this is the only ralph-loadable leaf of the two modules.
 */
export const REDIS_KEY_PREFIXES = {
  /** Mirrored INTO login-throttle.ts, not copied FROM it — that module imports this. */
  loginThrottle: "login-throttle",
  lovesCounter: "loves",
  lovesDedupe: "loved",
  lovesRate: "loverate",
} as const;

/** Fixed window for the loves rate limit. Deliberately NOT login-throttle's constants:
 *  a visitor loving several posts quickly is normal; five failed logins is not. */
export const LOVE_RATE_WINDOW_SECONDS = 60;
export const LOVE_RATE_MAX = 10;
/** Dedupe retention. Bounded rather than indefinite, so a visitor's hashed IP is not kept
 *  forever; the practical effect is that a love can be re-cast after a year. */
export const LOVE_DEDUPE_TTL_SECONDS = 31_536_000; // 365 days
/** Ceiling on how many slugs one GET may ask for, so a crafted query string cannot force
 *  an unbounded MGET. The index shows a bounded page; this is comfortably above it. */
export const MAX_SLUGS_PER_READ = 50;

let warnedMissingEnv = false;

/**
 * The environment namespace. Keys are `loves:<env>:<slug>`, so a PREVIEW deploy can use
 * the real Redis — real round trip, real owner verification — with no path by which
 * preview traffic mutates production counts. One database, isolated keyspaces.
 *
 * Locally VERCEL_ENV is absent and the store is unconfigured, so "dev" is never actually
 * used against a real Redis. On a MISCONFIGURED DEPLOY (store configured, VERCEL_ENV
 * missing) it would be, and that is the one case worth shouting about — it is the only
 * signal that production and some other environment might be sharing a namespace.
 */
export function envNamespace(warnIfMissing = false): string {
  const env = process.env.VERCEL_ENV;
  if (!env) {
    if (warnIfMissing && !warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(
        "[loves] VERCEL_ENV is not set but the store IS configured — keys will use the " +
          "'dev' namespace. If this is a deployment, production and this environment may " +
          "share counters."
      );
    }
    return "dev";
  }
  return env;
}

/**
 * A visitor's identity for dedupe purposes: sha256 of the IP under a SERVER-SIDE SECRET.
 *
 * The secret is what makes this non-reversible. A bare sha256 of an IP is not private —
 * the entire IPv4 space is 4 billion hashes, enumerable in seconds — so hashing without a
 * secret would look like a privacy measure while providing none. login-throttle does NOT
 * hash at all today (it keys on the raw IP); this is new work, and more warranted here,
 * because these are public visitors' addresses retained as dedupe markers rather than the
 * owner's own address held for sixty seconds.
 *
 * Truncated to 16 hex characters (64 bits): far beyond collision range for this volume,
 * and short enough to keep keys readable.
 */
export function hashIp(ip: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 16);
}

export const counterKey = (env: string, slug: string) =>
  `${REDIS_KEY_PREFIXES.lovesCounter}:${env}:${slug}`;
export const dedupeKey = (env: string, slug: string, iphash: string) =>
  `${REDIS_KEY_PREFIXES.lovesDedupe}:${env}:${slug}:${iphash}`;
export const rateKey = (env: string, iphash: string) =>
  `${REDIS_KEY_PREFIXES.lovesRate}:${env}:${iphash}`;

/**
 * Coerce a stored value to a count. A Redis reply can be a number, a numeric string, null
 * (absent key), or — if something ever wrote nonsense — anything at all. Everything that
 * is not a finite non-negative integer reads as 0.
 *
 * Never negative and never NaN: a visible "-1 loves" or "NaN loves" is a worse failure
 * than a wrong-but-plausible 0, and the clamp is the only thing standing between a
 * corrupted key and the page.
 */
export function clampCount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/**
 * THE FOURTH LEAK PATH, closed here rather than in the route.
 *
 * The article page has three defences against a draft URL resolving (status-filtered
 * generateStaticParams, dynamicParams = false, a notFound() gate). NONE of them reach an
 * API route — this endpoint has its own slug space. An ungated read would answer
 * differently for a real-but-unpublished slug than for a slug that was never written, and
 * that difference alone confirms a draft exists.
 *
 * So unknown slugs are DROPPED, not answered with 0: a draft and a typo produce the
 * identical response. The allowlist is applied BEFORE the cap so a query padded with junk
 * cannot push the real slugs past the limit and silently drop them. Deduplicated so the
 * same slug repeated fifty times is one entry, not fifty MGET arguments.
 *
 * It lives in this module and not in the route because a route imports the Keystatic
 * reader and is unreachable by ralph, and this is the line that decides what leaks.
 */
export function selectReadableSlugs(asked: string[], published: Set<string>): string[] {
  return [...new Set(asked)].filter((s) => published.has(s)).slice(0, MAX_SLUGS_PER_READ);
}

export type LoveStore = {
  /** Counts for the given slugs. Callers MUST pass an already-allow-listed set. */
  getCounts(slugs: string[]): Promise<Record<string, number>>;
  /** Record a love. Idempotent: a second call for the same visitor and slug is a no-op. */
  addLove(
    slug: string,
    iphash: string
  ): Promise<
    | { ok: true; count: number; counted: boolean }
    | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
  >;
};

export function makeLoveStore({ pipeline }: { pipeline: Pipeline }): LoveStore {
  // Warn here rather than at module load: the route only constructs a store when the
  // store is configured, so reaching this line IS the "configured" half of the condition.
  const env = envNamespace(true);

  return {
    async getCounts(slugs: string[]): Promise<Record<string, number>> {
      const wanted = slugs.slice(0, MAX_SLUGS_PER_READ);
      if (wanted.length === 0) return {};
      // ONE round trip for the whole page. Un-batching this is what would multiply the
      // index's Redis cost by the number of cards.
      const [values] = await pipeline([["MGET", ...wanted.map((s) => counterKey(env, s))]]);
      const list = Array.isArray(values) ? values : [];
      const out: Record<string, number> = {};
      wanted.forEach((slug, i) => {
        out[slug] = clampCount(list[i]);
      });
      return out;
    },

    async addLove(slug, iphash) {
      // 1. RATE LIMIT — the same INCR + EXPIRE NX + TTL shape login-throttle uses, on its
      //    OWN key. Checked before the dedupe so a throttled request does not consume the
      //    visitor's one-and-only love for this post.
      const rk = rateKey(env, iphash);
      const [count, , ttl] = await pipeline([
        ["INCR", rk],
        ["EXPIRE", rk, String(LOVE_RATE_WINDOW_SECONDS), "NX"],
        ["TTL", rk],
      ]);
      if (clampCount(count) > LOVE_RATE_MAX) {
        const secs = clampCount(ttl);
        return {
          ok: false,
          reason: "rate_limited",
          retryAfterSeconds: secs > 0 ? secs : LOVE_RATE_WINDOW_SECONDS,
        };
      }

      // 2. DEDUPE — SET NX is the atomic "was this visitor's first love for this post?".
      //    A null reply means the key already existed.
      const [claimed] = await pipeline([
        ["SET", dedupeKey(env, slug, iphash), "1", "NX", "EX", String(LOVE_DEDUPE_TTL_SECONDS)],
      ]);
      const isFirst = claimed !== null && claimed !== undefined;

      // 3. COUNT — INCR only when the dedupe was newly claimed; otherwise just read.
      //
      //    NEVER READ-MODIFY-WRITE. INCR is atomic, so two simultaneous visitors cannot
      //    lose a love. A GET-then-SET would, silently, under exactly the traffic this
      //    feature is for. The GET below is read-only — no write follows it — which is
      //    why it is not the hazard.
      const cmd = isFirst ? "INCR" : "GET";
      const [value] = await pipeline([[cmd, counterKey(env, slug)]]);
      return { ok: true, count: clampCount(value), counted: isFirst };
    },
  };
}
