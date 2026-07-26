// BS-4a — the public love endpoints. GET reads counts, POST records one love.
//
// PUBLIC AND UNAUTHENTICATED, by design: a visitor loves a post without an account. That
// makes this the first endpoint in the project with no owner gate, so the three things
// standing in for one are the PUBLISHED-SLUG ALLOWLIST, the per-IP rate limit, and the
// per-visitor dedupe. All three live in lib/loves/store.ts and are unit-tested there.
//
// THE FOURTH LEAK PATH. The article page has three defences against a draft URL resolving
// (status-filtered generateStaticParams, dynamicParams = false, and a notFound() gate).
// NONE of them reach an API route — this endpoint has its own slug space, so an ungated
// `GET /api/loves?slug=some-draft` would confirm a draft exists by answering differently
// for a real-but-unpublished slug than for a nonexistent one. Both verbs therefore gate on
// getBlogPosts(), the same status-filtered read the pages use, and an unknown slug is
// OMITTED FROM `counts` ENTIRELY rather than answered with 0 — so a draft and a typo
// produce byte-identical responses.
//
// FAIL QUIET. Every failure answers `{ ok: false, reason }` and the UI shows NO NUMBER. It
// never invents a count, and it never falls back to memory the way login-throttle does:
// there is no permission here to keep open, and a per-instance count that resets on cold
// start would be a fabricated number, which is worse than none.
import { NextResponse } from "next/server";
import { getBlogPosts } from "@/lib/keystatic";
import { pipeline, storeConfigured } from "@/lib/upstash";
import { hashIp, makeLoveStore, selectReadableSlugs } from "@/lib/loves/store";

/** Counts move on POST, so a build-time answer would be permanently stale. */
export const dynamic = "force-dynamic";

/** Cached at the edge, not in the browser: a shared 60s window absorbs the traffic while
 *  a visitor who just loved a post still sees their own number move (the POST response
 *  carries the new count, so the UI never waits on this). */
const READ_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

/** Never cache a failure — a 60s window on an outage would outlive the outage. */
function unavailable() {
  return NextResponse.json(
    { ok: false, reason: "unavailable" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

/** Both verbs need the same two things: a working store and the published allowlist. */
async function ready() {
  // The secret is REQUIRED, not optional. Hashing an IP under an empty secret produces a
  // bare sha256 of the IPv4 space, which is enumerable in seconds — it would look like a
  // privacy measure while providing none. Missing secret means the feature is off.
  if (!storeConfigured() || !process.env.LOVES_HASH_SECRET) return null;
  const store = makeLoveStore({ pipeline });
  const published = new Set((await getBlogPosts()).map((p) => p.slug));
  return { store, published, secret: process.env.LOVES_HASH_SECRET };
}

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/**
 * GET /api/loves?slug=a&slug=b — counts for the requested published slugs.
 *
 * One MGET for the whole page, not one request per card. Unknown slugs are absent from
 * `counts`; the caller renders nothing for them rather than a zero.
 */
export async function GET(req: Request) {
  const ctx = await ready();
  if (!ctx) return unavailable();

  // Dedupe, allowlist, cap — in lib/loves/store.ts so the line that decides what leaks is
  // ralph-testable, which a route importing the Keystatic reader can never be.
  const slugs = selectReadableSlugs(new URL(req.url).searchParams.getAll("slug"), ctx.published);

  try {
    const counts = await ctx.store.getCounts(slugs);
    return NextResponse.json({ ok: true, counts }, { headers: { "Cache-Control": READ_CACHE } });
  } catch (err) {
    console.warn("[loves] read failed:", err instanceof Error ? err.message : err);
    return unavailable();
  }
}

/**
 * POST /api/loves { slug } — record one love from this visitor.
 *
 * Returns the count either way. `counted: false` means this visitor had already loved the
 * post, which the UI shows as the settled state rather than as an error.
 */
export async function POST(req: Request) {
  const ctx = await ready();
  if (!ctx) return unavailable();

  let slug = "";
  try {
    const body = await req.json();
    slug = typeof body?.slug === "string" ? body.slug : "";
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  // Same answer for a draft and for a slug that was never written.
  if (!ctx.published.has(slug)) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  try {
    const res = await ctx.store.addLove(slug, hashIp(clientIp(req), ctx.secret));
    if (!res.ok) {
      const out = NextResponse.json({ ok: false, reason: res.reason }, { status: 429 });
      out.headers.set("Retry-After", String(res.retryAfterSeconds));
      return out;
    }
    return NextResponse.json(
      { ok: true, count: res.count, counted: res.counted },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.warn("[loves] write failed:", err instanceof Error ? err.message : err);
    return unavailable();
  }
}
