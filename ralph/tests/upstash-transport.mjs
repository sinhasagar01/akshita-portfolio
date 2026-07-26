// BS-4a — the extracted Upstash transport, and the proof that extracting it changed
// nothing about the login throttle.
// Run: node --experimental-strip-types ralph/tests/upstash-transport.mjs
//
// WHY THIS SUITE EXISTS AT ALL. lib/studio/login-throttle.ts is the one security-adjacent
// module in the project and it has NEVER had a ralph suite — it was loadable (no relative
// imports) and simply untested. This PR takes its fetch out into lib/upstash.ts, which
// makes login-throttle permanently UNLOADABLE by ralph (it now carries two extensionless
// relative TS imports). That is a real cost, taken knowingly, and this suite is the reason
// it is still a net gain: the extracted code path is now tested where it never was.
//
// THE PROOF IS IN THREE PARTS, because "I refactored it carefully" is not evidence:
//   1. EQUIVALENCE — the request the new transport puts on the wire is pinned against the
//      PRE-EXTRACTION SOURCE, read out of git at a fixed commit rather than retyped from
//      the new code. Pinning against the new code would only prove it equals itself.
//   2. POLICY UNCHANGED — the parts of login-throttle that decide anything (the window,
//      the attempt ceiling, the in-memory fallback, the fail-open catch) are compared
//      byte-for-byte against that same pre-extraction source.
//   3. FAILURE BEHAVIOUR — the throw paths the callers' opposite postures depend on.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline, storeConfigured } from "../../lib/upstash.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** The last commit BEFORE the transport was extracted (BS-3c, "the blog editor host").
 *  Fixed on purpose: this is the baseline the extraction must reproduce, so it must not
 *  drift to whatever HEAD happens to be. */
const PRE_EXTRACTION = "9a25bc0";
const OLD = execFileSync("git", ["show", `${PRE_EXTRACTION}:lib/studio/login-throttle.ts`], {
  cwd: root,
  encoding: "utf8",
});
const NEW = readFileSync(path.join(root, "lib/studio/login-throttle.ts"), "utf8");

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
/** Slice a source region by markers, so a comparison is of CODE and not of comments. */
const region = (src, start, end) => {
  const a = src.indexOf(start);
  const b = src.indexOf(end, a);
  return a === -1 || b === -1 ? null : src.slice(a, b + end.length);
};

/* =================================================== part 1 — EQUIVALENCE
 * The old source is the specification. Every property asserted against the new request is
 * first asserted to have been true of the old code, so this cannot pass by agreeing with
 * itself. */
t("P1.0 the pre-extraction source was actually fetched", OLD.includes("await fetch("), true);

const oldRequest = {
  endpoint: OLD.includes("}/pipeline`"),
  trailingSlashStripped: OLD.includes('url.replace(/\\/$/, "")'),
  method: OLD.includes('method: "POST"'),
  bearer: OLD.includes("Authorization: `Bearer ${token}`"),
  contentType: OLD.includes('"Content-Type": "application/json"'),
  noStore: OLD.includes('cache: "no-store"'),
  bodyIsTheCommands: OLD.includes("body: JSON.stringify(["),
};
t("P1.1 the OLD code had all seven request properties", oldRequest, {
  endpoint: true, trailingSlashStripped: true, method: true, bearer: true,
  contentType: true, noStore: true, bodyIsTheCommands: true,
});

/** Capture one real call through the new transport with fetch stubbed. */
async function capture(commands, respond) {
  const seen = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    seen.push({ url, init });
    return respond();
  };
  try {
    const results = await pipeline(commands);
    return { seen, results, threw: null };
  } catch (err) {
    return { seen, results: null, threw: err.message };
  } finally {
    globalThis.fetch = real;
  }
}
const ok = (body) => ({ ok: true, status: 200, json: async () => body });

process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "tok-123";

// The exact three commands login-throttle sends, so the pinned body is the real one.
const THROTTLE_COMMANDS = [
  ["INCR", "login-throttle:1.2.3.4"],
  ["EXPIRE", "login-throttle:1.2.3.4", "60", "NX"],
  ["TTL", "login-throttle:1.2.3.4"],
];
{
  const { seen, results } = await capture(
    THROTTLE_COMMANDS,
    () => ok([{ result: 3 }, { result: 1 }, { result: 42 }])
  );
  t("P1.2 exactly one round trip for three commands", seen.length, 1);
  const [{ url, init }] = seen;
  t("P1.3 the endpoint", url, "https://example.upstash.io/pipeline");
  t("P1.4 the method", init.method, "POST");
  t("P1.5 the bearer header", init.headers.Authorization, "Bearer tok-123");
  t("P1.6 the content type", init.headers["Content-Type"], "application/json");
  t("P1.7 cache no-store (without it Next can cache the POST and the counter stops moving)",
    init.cache, "no-store");
  t("P1.8 the body IS the commands, unwrapped", JSON.parse(init.body), THROTTLE_COMMANDS);
  t("P1.9 results come back unwrapped, in order", results, [3, 1, 42]);
}
{
  // The old code's url.replace(/\/$/, ""). A double slash is a 404 at Upstash.
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io/";
  const { seen } = await capture([["PING"]], () => ok([{ result: "PONG" }]));
  t("P1.10 a trailing slash on the URL is stripped", seen[0].url, "https://example.upstash.io/pipeline");
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
}

/* =================================================== part 2 — POLICY UNCHANGED
 * Byte-for-byte on everything that DECIDES. If a refactor had moved a boundary — >= for >,
 * a different window, a fallback dropped — these fail. */
t("P2.1 the window constant is byte-identical",
  region(NEW, "const WINDOW_SECONDS", "const MAX_ATTEMPTS = 5;"),
  region(OLD, "const WINDOW_SECONDS", "const MAX_ATTEMPTS = 5;"));
t("P2.2 memoryCheck is byte-identical (the fallback that must survive an outage)",
  region(NEW, "function memoryCheck", "\n}"),
  region(OLD, "function memoryCheck", "\n}"));
t("P2.3 checkAndRecordAttempt is byte-identical (the fail-OPEN posture)",
  region(NEW, "export async function checkAndRecordAttempt", "\n}"),
  region(OLD, "export async function checkAndRecordAttempt", "\n}"));
t("P2.4 the lockout comparison is still strictly-greater, both paths",
  (NEW.match(/count > MAX_ATTEMPTS/g) || []).length,
  (OLD.match(/count > MAX_ATTEMPTS/g) || []).length);
t("P2.5 the retry-after still falls back to the full window",
  NEW.includes("ttl > 0 ? ttl : WINDOW_SECONDS"), true);
// Indentation is the ONE licensed difference here: the array used to sit inside
// `JSON.stringify([`, two levels deep, and now sits inside `pipeline([`. Whitespace is
// collapsed so this compares the COMMANDS; every character that carries meaning — the verb
// order, the NX, the window — still has to match exactly.
const squash = (s) => (s === null ? null : s.replace(/\s+/g, " "));
t("P2.6 the same three commands, in the same order",
  squash(region(NEW, '["INCR", key]', '["TTL", key],')),
  squash(region(OLD, '["INCR", key]', '["TTL", key],')));
// The key STRING must be unchanged or every locked-out IP silently resets on deploy.
t("P2.7 the OLD key was the literal `login-throttle:${ip}`",
  OLD.includes("const key = `login-throttle:${ip}`;"), true);
t("P2.8 the NEW key composes to exactly that string",
  NEW.includes("const key = `${REDIS_KEY_PREFIXES.loginThrottle}:${ip}`;"), true);
// …and the constant it composes from really is "login-throttle". Asserted from the leaf
// rather than from this file's own expectation.
const { REDIS_KEY_PREFIXES } = await import("../../lib/loves/store.ts");
t("P2.9 …and REDIS_KEY_PREFIXES.loginThrottle is that prefix",
  `${REDIS_KEY_PREFIXES.loginThrottle}:1.2.3.4`, "login-throttle:1.2.3.4");
// The transport no longer type-checks the counter, so the caller must — otherwise a
// non-numeric reply compares as NaN > 5 === false and the throttle allows forever.
t("P2.10 login-throttle still rejects a non-numeric counter itself",
  NEW.includes('if (typeof results[0] !== "number") {'), true);
t("P2.11 the OLD code made that same check", OLD.includes('typeof data[0]?.result !== "number"'), true);
// The extraction must not have left a second copy of the fetch behind.
t("P2.12 login-throttle no longer calls fetch at all", NEW.includes("fetch("), false);

/* =================================================== part 3 — FAILURE BEHAVIOUR
 * The transport THROWS and never decides. login-throttle turns a throw into fail-open; the
 * loves store turns it into fail-quiet. Both depend on the throw actually happening. */
{
  const { threw } = await capture([["PING"]], () => ({ ok: false, status: 503, json: async () => [] }));
  t("P3.1 a non-2xx throws, with the status in the message", threw, "upstash HTTP 503");
}
{
  const { threw } = await capture([["PING"], ["PING"]], () => ok([{ result: "PONG" }]));
  t("P3.2 a short envelope throws (a dropped command must not read as null)",
    threw, "unexpected upstash pipeline response");
}
{
  const { threw } = await capture([["PING"]], () => ok({ result: "PONG" }));
  t("P3.3 a non-array envelope throws", threw, "unexpected upstash pipeline response");
}
{
  // The case a 200 hides: Upstash reports per-command errors INSIDE a successful response.
  const { threw } = await capture(
    [["INCR", "k"]],
    () => ok([{ error: "WRONGTYPE Operation against a key holding the wrong kind of value" }])
  );
  t("P3.4 a per-command error inside a 200 still throws",
    threw?.startsWith("upstash command error: WRONGTYPE"), true);
}
{
  const real = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("ECONNREFUSED"); };
  let threw = null;
  try { await pipeline([["PING"]]); } catch (e) { threw = e.message; }
  globalThis.fetch = real;
  t("P3.5 a transport-level failure propagates unchanged", threw, "ECONNREFUSED");
}
{
  // A null result is legitimate (SET NX on an existing key) and must NOT be an error —
  // the whole loves dedupe is built on telling that null apart from a failure.
  const { results, threw } = await capture([["SET", "k", "1", "NX"]], () => ok([{ result: null }]));
  t("P3.6 a null result passes through as null, not as a failure", [threw, results], [null, [null]]);
}

/* ---- storeConfigured, the guard both callers check before ever calling pipeline ---- */
{
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const set = (u, tk) => {
    u === null ? delete process.env.UPSTASH_REDIS_REST_URL : (process.env.UPSTASH_REDIS_REST_URL = u);
    tk === null ? delete process.env.UPSTASH_REDIS_REST_TOKEN : (process.env.UPSTASH_REDIS_REST_TOKEN = tk);
  };
  set(null, null);       t("P3.7 neither var set", storeConfigured(), false);
  set("https://u", null); t("P3.8 URL only", storeConfigured(), false);
  set(null, "t");        t("P3.9 token only", storeConfigured(), false);
  set("", "t");          t("P3.10 an EMPTY url is not configured", storeConfigured(), false);
  set("https://u", "");  t("P3.11 an EMPTY token is not configured", storeConfigured(), false);
  set("https://u", "t"); t("P3.12 both set", storeConfigured(), true);
  set(url, token);
}

console.log(`\nupstash-transport result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
