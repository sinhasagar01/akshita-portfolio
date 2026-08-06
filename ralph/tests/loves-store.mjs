// BS-4a — the love counter's policy, exercised end to end against an in-memory Redis.
// Run: node --experimental-strip-types ralph/tests/loves-store.mjs
//
// THE GATES THAT CARRIED THIS WHOLE ARC CANNOT SEE A FAILURE HERE. Byte-identical DOM,
// CSS union diffs and serializer round-trips all read STATIC OUTPUT. A love counter is
// RUNTIME STATE in an external store: the DOM gate is not weak here, it is INAPPLICABLE —
// there is no build output in which a double-counted love, a leaked draft slug or a
// silently-disabled rate limit would appear. Reporting it as a pass would be reporting
// that a thermometer says nothing about the wind.
//
// What replaces it is this: the store takes its transport INJECTED, so a fake pipeline
// implementing the six Redis verbs it uses exercises the real policy — the key shapes, the
// dedupe, the rate limit, the clamp, the batch parse — and the COMMAND LOG becomes the
// assertion surface. Sequences are checkable, not just answers, which is the only way to
// prove a negative like "no read-modify-write".
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REDIS_KEY_PREFIXES,
  selectReadableSlugs,
  LOVE_RATE_MAX,
  LOVE_RATE_WINDOW_SECONDS,
  LOVE_DEDUPE_TTL_SECONDS,
  MAX_SLUGS_PER_READ,
  makeLoveStore,
  hashIp,
  clampCount,
  envNamespace,
  counterKey,
  dedupeKey,
  rateKey,
} from "../../lib/loves/store.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* ------------------------------------------------------------------ the fake store
 * Only the six verbs the policy uses, with Redis's real return conventions — which is the
 * part that matters. INCR answers a NUMBER, MGET answers STRINGS or null, and SET NX
 * answers null when the key already exists. Getting those types right is what makes the
 * clamp and the dedupe genuinely tested rather than tested against a convenient mock. */
function fakeRedis() {
  const data = new Map(), ttl = new Map(), log = [];
  const pipeline = async (commands) => {
    log.push(...commands);
    return commands.map(([verb, ...args]) => {
      switch (verb) {
        case "INCR": {
          const n = (Number(data.get(args[0])) || 0) + 1;
          data.set(args[0], String(n));
          return n;
        }
        case "EXPIRE": {
          const [key, secs, nx] = args;
          if (nx === "NX" && ttl.has(key)) return 0;
          ttl.set(key, Number(secs));
          return 1;
        }
        case "TTL":
          return ttl.has(args[0]) ? ttl.get(args[0]) : -1;
        case "SET": {
          const [key, value, ...opts] = args;
          if (opts.includes("NX") && data.has(key)) return null;
          data.set(key, value);
          const ex = opts.indexOf("EX");
          if (ex !== -1) ttl.set(key, Number(opts[ex + 1]));
          return "OK";
        }
        case "GET":
          return data.has(args[0]) ? data.get(args[0]) : null;
        case "MGET":
          return args.map((k) => (data.has(k) ? data.get(k) : null));
        default:
          throw new Error(`fake redis: unsupported verb ${verb}`);
      }
    });
  };
  return { pipeline, data, ttl, log, verbs: () => log.map((c) => c[0]) };
}

process.env.VERCEL_ENV = "test";
const ENV = "test";
const SECRET = "s3cret";
const H = hashIp("1.2.3.4", SECRET);

/* ================================================= A1. the two counters cannot collide
 * The loves rate limiter is the SAME SHAPE as the login throttle — a fixed-window INCR
 * keyed by IP. Calling checkAndRecordAttempt for loves would have been the obvious reuse,
 * and it would have put BLOG TRAFFIC AND OWNER LOGINS ON ONE SHARED COUNTER: a burst of
 * visitors loving posts could lock the owner out of the studio. Loves reuses the shape and
 * never the function, and this is the assertion that keeps it that way. */
{
  const all = Object.values(REDIS_KEY_PREFIXES);
  t("A1.1 all four prefixes are distinct", new Set(all).size, all.length);
  const nested = [];
  for (const a of all) for (const b of all) if (a !== b && a.startsWith(b)) nested.push([a, b]);
  // Not merely distinct: no prefix may START another, so the keyspaces stay separable even
  // if a future key is ever built without the colon.
  t("A1.2 no prefix is a prefix of another", nested, []);
  const login = `${REDIS_KEY_PREFIXES.loginThrottle}:1.2.3.4`;
  const loves = rateKey(ENV, H);
  t("A1.3 for the SAME ip the two limiter keys differ", login !== loves, true);
  t("A1.4 …and neither contains the other", [login.includes(loves), loves.includes(login)], [false, false]);
  // The login throttle is keyed on the RAW ip and loves on a HASH, so even the tail cannot
  // coincide. Stated as a property, since it is the thing that makes A1.3 non-accidental.
  t("A1.5 the loves limiter key never contains a raw IP", loves.includes("1.2.3.4"), false);
}

/* ================================================= G3. the IP hash */
{
  t("G3.1 stable for the same input", hashIp("1.2.3.4", SECRET), H);
  t("G3.2 different IPs differ", hashIp("1.2.3.5", SECRET) !== H, true);
  // THE POINT OF THE SECRET. Without it a hash of an IP is a hash of a 32-bit space,
  // enumerable in seconds. Changing the secret must change every hash, or the secret is
  // decorative.
  t("G3.3 a different SECRET changes the hash", hashIp("1.2.3.4", "other") !== H, true);
  // Computed here, not asserted by eyeball: if hashIp were a bare sha256 of the IP, the
  // whole IPv4 space could be rainbow-tabled in seconds and the hashing would be theatre.
  const bare = createHash("sha256").update("1.2.3.4").digest("hex").slice(0, 16);
  t("G3.4 it is NOT the bare sha256 of the IP", H === bare, false);
  t("G3.5 …because the secret is mixed in before hashing, not after",
    hashIp("1.2.3.4", SECRET) !== hashIp("1.2.3.4", ""), true);
  // The obvious wording for this assertion names a Tailwind text-transform utility, and
  // Tailwind v4 auto-detects sources across the whole repo, ralph/ included. That one word
  // in a test NAME added a real declaration to the shipped production CSS bundle. Caught
  // by this PR's CSS gate, which is the only gate that could have seen it — and a standing
  // hazard for every suite in this directory, not just this one.
  t("G3.6 16 hex characters, all [0-9a-f]", /^[0-9a-f]{16}$/.test(H), true);
  // A separator, so hashIp("1.2.3", "4x") and hashIp("", "1.2.34x") cannot coincide.
  t("G3.7 secret and IP are separated", hashIp("b", "a") !== hashIp("", "a:b"), true);
}

/* ================================================= key shapes and the env namespace */
{
  t("K1 the counter key", counterKey(ENV, "post"), "loves:test:post");
  t("K2 the dedupe key", dedupeKey(ENV, "post", H), `loved:test:post:${H}`);
  t("K3 the rate key", rateKey(ENV, H), `loverate:test:${H}`);
  t("K4 VERCEL_ENV is the namespace", envNamespace(), "test");
  process.env.VERCEL_ENV = "preview";
  // The reason the namespace exists: a preview deploy can point at the real Redis without
  // any path by which preview traffic mutates a production count.
  t("K5 preview and production counters are different keys",
    counterKey(envNamespace(), "post"), "loves:preview:post");
  process.env.VERCEL_ENV = ENV;
}

/* ================================================= the missing-VERCEL_ENV warning
 * Loud exactly once, and only when the store is otherwise configured — which is true by
 * construction, because the route only builds a store when it is. */
{
  const real = console.warn, warns = [];
  console.warn = (...a) => warns.push(a.join(" "));
  delete process.env.VERCEL_ENV;
  t("W1 envNamespace falls back to dev", envNamespace(), "dev");
  t("W2 …silently when not asked to warn", warns.length, 0);
  makeLoveStore({ pipeline: fakeRedis().pipeline });
  t("W3 constructing a store with VERCEL_ENV absent warns", warns.length, 1);
  t("W4 …and says which namespace it fell back to", warns[0].includes("'dev'"), true);
  makeLoveStore({ pipeline: fakeRedis().pipeline });
  makeLoveStore({ pipeline: fakeRedis().pipeline });
  t("W5 …exactly ONCE, not once per request", warns.length, 1);
  console.warn = real;
  process.env.VERCEL_ENV = ENV;
}

/* ================================================= the clamp
 * A visible "-1 loves" or "NaN loves" is worse than a wrong-but-plausible 0, and this is
 * the only thing between a corrupted key and the page. */
{
  const cases = [
    [null, 0], [undefined, 0], ["", 0], ["abc", 0], [NaN, 0], [Infinity, 0], [-Infinity, 0],
    [-1, 0], ["-5", 0], [0, 0], ["0", 0], [7, 7], ["7", 7], [7.9, 7], ["7.9", 7],
    [{}, 0], [[], 0], [true, 0], [[3], 0],
  ];
  t("C1 every malformed stored value clamps to a sane count",
    cases.map(([v]) => clampCount(v)), cases.map(([, w]) => w));
}

/* ================================================= G1. the batched read */
{
  const r = fakeRedis();
  const store = makeLoveStore({ pipeline: r.pipeline });
  r.data.set(counterKey(ENV, "a"), "12");
  r.data.set(counterKey(ENV, "c"), "-4"); // corrupted on purpose
  const counts = await store.getCounts(["a", "b", "c"]);
  t("G1.1 ONE round trip for the whole page, not one per card", r.log.length, 1);
  /* ⚠ THE KEY FORMAT IS SPELLED OUT, NOT BUILT BY `counterKey`. Using the production builder on
   * both sides means a change to the key SHAPE moves the expectation with the actual, and this is
   * the one place in the repo where a silent regression costs real stored data: a renamed key does
   * not error, it reads zero and every existing count disappears. G1.2b keeps the builder in the
   * picture so the literal cannot drift out of date silently either — one row anchors the format,
   * the other anchors the builder to it. */
  t("G1.2 …and it is a single MGET of the three counter keys",
    r.log[0], ["MGET", "loves:test:a", "loves:test:b", "loves:test:c"]);
  t("G1.2b ⚠ AND THE BUILDER STILL PRODUCES THAT EXACT FORMAT — a rename reads zero, it does not error",
    counterKey(ENV, "a"), "loves:test:a");
  t("G1.3 absent keys read as 0 and a corrupted one clamps", counts, { a: 12, b: 0, c: 0 });
  t("G1.4 …positionally aligned, not sorted or shifted", Object.keys(counts), ["a", "b", "c"]);
  const empty = fakeRedis();
  t("G1.5 an empty slug list makes NO request",
    [await makeLoveStore({ pipeline: empty.pipeline }).getCounts([]), empty.log.length], [{}, 0]);
  // A crafted query string must not be able to force an unbounded MGET.
  const big = fakeRedis();
  const many = Array.from({ length: MAX_SLUGS_PER_READ + 25 }, (_, i) => `s${i}`);
  const capped = await makeLoveStore({ pipeline: big.pipeline }).getCounts(many);
  t("G1.6 the slug count is capped", Object.keys(capped).length, MAX_SLUGS_PER_READ);
  t("G1.7 …at the MGET too, not just in the answer", big.log[0].length - 1, MAX_SLUGS_PER_READ);
}

/* ================================================= G2. NEVER read-modify-write
 * INCR is atomic; a GET-then-SET is not. Under exactly the traffic this feature is for,
 * two simultaneous visitors would lose a love and nothing would report it. This asserts
 * the SEQUENCE, which is the only way to prove the hazard is absent rather than merely
 * currently-unhit. */
{
  const r = fakeRedis();
  const store = makeLoveStore({ pipeline: r.pipeline });
  await store.addLove("post", H);
  const ck = counterKey(ENV, "post");
  const touching = r.log.filter((c) => c.includes(ck));
  t("G2.1 the counter is touched exactly once on a first love", touching.length, 1);
  t("G2.2 …and that touch is an INCR", touching[0], ["INCR", ck]);
  t("G2.3 the counter is NEVER written with SET",
    r.log.some((c) => c[0] === "SET" && c[1] === ck), false);
  t("G2.4 no read of the counter precedes the INCR",
    r.log.findIndex((c) => (c[0] === "GET" || c[0] === "MGET") && c.includes(ck)), -1);
  // The dedupe claim is itself atomic — SET NX, not EXISTS-then-SET.
  /* Same reasoning as G1.2 — the shape is literal, and G2.5b pins the builder to it. */
  t("G2.5 the dedupe claim is a single atomic SET NX",
    r.log.filter((c) => c[0] === "SET")[0],
    ["SET", `loved:test:post:${H}`, "1", "NX", "EX", String(LOVE_DEDUPE_TTL_SECONDS)]);
  t("G2.5b ⚠ AND THE DEDUPE BUILDER PRODUCES THAT FORMAT — a silent rename un-dedupes every visitor",
    dedupeKey(ENV, "post", H), `loved:test:post:${H}`);
  t("G2.6 …with no EXISTS probe before it", r.verbs().includes("EXISTS"), false);
  t("G2.7 a first love sends only these four verbs — nothing crept in",
    [...new Set(r.verbs())].sort(), ["EXPIRE", "INCR", "SET", "TTL"]);
}

/* ================================================= G4. dedupe */
{
  const r = fakeRedis();
  const store = makeLoveStore({ pipeline: r.pipeline });
  const first = await store.addLove("post", H);
  const second = await store.addLove("post", H);
  const third = await store.addLove("post", H);
  t("G4.1 the first love counts", first, { ok: true, count: 1, counted: true });
  t("G4.2 the second does NOT increment", second, { ok: true, count: 1, counted: false });
  t("G4.3 …nor the third", third, { ok: true, count: 1, counted: false });
  // Idempotent, not an error: the UI shows the settled state, not a failure.
  t("G4.4 a repeat still reports the true count", second.count, first.count);
  t("G4.5 a repeat reads the counter, never writes it",
    r.log.filter((c) => c[1] === counterKey(ENV, "post")).map((c) => c[0]),
    ["INCR", "GET", "GET"]);
  // Dedupe is per POST, not per visitor — loving a second post must still count.
  const other = await store.addLove("other", H);
  t("G4.6 the same visitor can love a DIFFERENT post", other, { ok: true, count: 1, counted: true });
  // …and per visitor, not global.
  const someoneElse = await store.addLove("post", hashIp("9.9.9.9", SECRET));
  t("G4.7 a different visitor can love the SAME post", someoneElse, { ok: true, count: 2, counted: true });
  t("G4.8 the dedupe marker is bounded, not kept forever",
    r.ttl.get(dedupeKey(ENV, "post", H)), LOVE_DEDUPE_TTL_SECONDS);
}

/* ================================================= G5. the rate limit */
{
  const r = fakeRedis();
  const store = makeLoveStore({ pipeline: r.pipeline });
  const results = [];
  for (let i = 0; i < LOVE_RATE_MAX + 3; i++) results.push(await store.addLove(`p${i}`, H));
  t("G5.1 the first LOVE_RATE_MAX are allowed",
    results.slice(0, LOVE_RATE_MAX).every((x) => x.ok), true);
  t("G5.2 the next one is refused", results[LOVE_RATE_MAX].ok, false);
  t("G5.3 …with a reason and a retry-after inside the window",
    [results[LOVE_RATE_MAX].reason,
     results[LOVE_RATE_MAX].retryAfterSeconds > 0 &&
     results[LOVE_RATE_MAX].retryAfterSeconds <= LOVE_RATE_WINDOW_SECONDS],
    ["rate_limited", true]);
  t("G5.4 the window is fixed from the first attempt (EXPIRE NX)",
    r.log.filter((c) => c[0] === "EXPIRE").every((c) => c[3] === "NX"), true);
  t("G5.5 …at the loves window, not the login one",
    r.log.find((c) => c[0] === "EXPIRE")[2], String(LOVE_RATE_WINDOW_SECONDS));
  // THE ORDERING THAT MATTERS: a throttled request must not consume the visitor's one and
  // only love for that post. If the dedupe were claimed first, the refusal would be
  // permanent for that post.
  t("G5.6 a REFUSED love did not claim the dedupe key",
    r.data.has(dedupeKey(ENV, `p${LOVE_RATE_MAX}`, H)), false);
  t("G5.7 …and did not touch that post's counter",
    r.data.has(counterKey(ENV, `p${LOVE_RATE_MAX}`)), false);
  // Once the window passes, the visitor is allowed again.
  r.data.delete(rateKey(ENV, H));
  r.ttl.delete(rateKey(ENV, H));
  t("G5.8 the limit lifts when the window expires",
    (await store.addLove(`p${LOVE_RATE_MAX}`, H)).ok, true);
  // Per visitor, not global — one prolific reader must not mute the site.
  const fresh = await store.addLove("p0", hashIp("5.5.5.5", SECRET));
  t("G5.9 the limit is per visitor", fresh.ok, true);
}

/* ================================================= FAIL QUIET
 * login-throttle fails OPEN because refusing would lock the owner out of their own CMS.
 * That frame does not transfer: a love grants no permission, so there is nothing to open.
 * The store THROWS and the route turns it into "no number" — it never invents a count and
 * never degrades to memory, because a count that resets on cold start is a fabricated
 * number, which is worse than none. */
{
  const boom = async () => { throw new Error("upstash HTTP 503"); };
  const store = makeLoveStore({ pipeline: boom });
  let readErr = null, writeErr = null;
  try { await store.getCounts(["a"]); } catch (e) { readErr = e.message; }
  try { await store.addLove("a", H); } catch (e) { writeErr = e.message; }
  t("F1 a read failure propagates (it does not answer 0)", readErr, "upstash HTTP 503");
  t("F2 a write failure propagates (it does not answer 'counted')", writeErr, "upstash HTTP 503");
  // A malformed-but-successful reply must not become a fabricated count either.
  const junk = makeLoveStore({ pipeline: async (cmds) => cmds.map(() => ({ weird: true })) });
  t("F3 a nonsense reply clamps to 0 rather than leaking an object",
    await junk.getCounts(["a"]), { a: 0 });
  const noArray = makeLoveStore({ pipeline: async () => ["not-an-array"] });
  t("F4 a non-array MGET reply degrades to zeros, not a crash",
    await noArray.getCounts(["a", "b"]), { a: 0, b: 0 });
}

/* ================================================= L. THE FOURTH LEAK PATH
 * /blog/[slug] has three defences against a draft URL resolving. NONE of them reach an API
 * route, because this endpoint has its own slug space. If it answered `{ "draft": 0 }` for
 * a real-but-unpublished slug and `{}` for one that was never written, that difference
 * alone would confirm the draft exists — a slower version of the leak PR 2 spent its whole
 * scope closing.
 *
 * So the assertion is on the WHOLE response, not on "it did not return the count": a draft
 * and a typo must be indistinguishable byte for byte. */
{
  const published = new Set(["live-one", "live-two"]);
  const r = fakeRedis();
  const store = makeLoveStore({ pipeline: r.pipeline });
  // A draft's counter EXISTS in Redis (it was published once, then unpublished), which is
  // the case where an ungated read would actually differ.
  r.data.set(counterKey(ENV, "secret-draft"), "99");

  const respond = async (asked) => ({
    ok: true,
    counts: await store.getCounts(selectReadableSlugs(asked, published)),
  });
  const draft = await respond(["secret-draft"]);
  const typo = await respond(["never-was-a-post"]);
  t("L1 a DRAFT slug and a NONEXISTENT slug give byte-identical responses",
    JSON.stringify(draft), JSON.stringify(typo));
  t("L2 …and that response is the empty one, not a zero", draft, { ok: true, counts: {} });
  t("L3 the draft's real count never reaches the response", JSON.stringify(draft).includes("99"), false);
  t("L4 an unknown slug is OMITTED, never answered with 0",
    Object.prototype.hasOwnProperty.call(draft.counts, "secret-draft"), false);
  t("L5 no Redis key for an unpublished slug is even read",
    r.log.some((c) => c.some((a) => String(a).includes("secret-draft"))), false);
  // Mixed queries: the published slugs still answer, the draft still vanishes.
  const mixed = await respond(["live-one", "secret-draft", "live-two"]);
  t("L6 a mixed query answers only the published slugs", mixed, { ok: true, counts: { "live-one": 0, "live-two": 0 } });
  // The allowlist runs BEFORE the cap, or a padded query could push real slugs out.
  const padded = Array.from({ length: MAX_SLUGS_PER_READ + 10 }, (_, i) => `junk${i}`).concat("live-one");
  t("L7 a query padded past the cap cannot displace a real slug",
    selectReadableSlugs(padded, published), ["live-one"]);
  t("L8 duplicates collapse rather than multiplying the MGET",
    selectReadableSlugs(["live-one", "live-one", "live-one"], published), ["live-one"]);
}

/* ---- and the route really does gate BOTH verbs, asserted from its source ---- */
{
  const src = readFileSync(
    path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), "app/api/loves/route.ts"),
    "utf8"
  );
  t("L9 the route exports exactly GET and POST (a third verb would be ungated)",
    (src.match(/^export async function (\w+)/gm) || []).map((m) => m.split(" ").pop()).sort(),
    ["GET", "POST"]);
  t("L10 GET routes its slugs through selectReadableSlugs", src.includes("selectReadableSlugs("), true);
  t("L11 POST gates on the same published set", src.includes("if (!ctx.published.has(slug))"), true);
  t("L12 the published set is the STATUS-FILTERED read, not the unfiltered one",
    [src.includes("getBlogPosts()"), src.includes("getStudioBlogPosts")], [true, false]);
  t("L13 the secret is required before anything else happens",
    src.includes("!process.env.LOVES_HASH_SECRET) return null"), true);
  t("L14 a failure response is never cached", src.includes('"Cache-Control": "no-store"'), true);
}

console.log(`\nloves-store result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
