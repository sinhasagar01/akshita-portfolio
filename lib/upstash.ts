// BS-4a — the Upstash REST transport, extracted from login-throttle so the loves store
// and the login throttle send commands through ONE implementation.
//
// WHAT THIS OWNS: how to talk to Upstash. Bearer auth, the /pipeline endpoint, the
// trailing-slash normalisation, `cache: "no-store"`, and validating the response
// envelope. Nothing else.
//
// WHAT THIS DOES NOT OWN: what a failure MEANS. It throws, and each caller decides:
//   - login-throttle FAILS OPEN (degrades to its in-memory throttle) because refusing
//     would lock the owner out of their own CMS.
//   - the loves store FAILS QUIET (no number) because no permission is being granted and
//     a fabricated count is worse than none.
// Those postures are opposite, which is exactly why the decision belongs to the callers
// and the transport only reports the failure.
//
// A dependency-free leaf: only global fetch and process.env, so a ralph suite can load it
// and stub globalThis.fetch. There is still NO Upstash SDK in package.json — this is a
// hand-rolled REST call, as it was before the extraction.

/** True when both Upstash env vars are present. Callers check this BEFORE calling
 *  pipeline(), so an unconfigured environment never attempts the network. */
export function storeConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Send one or more Redis commands as a single round trip and return their results in
 * order. THROWS on a transport failure, an HTTP error, or an unexpected envelope — the
 * caller owns the recovery posture.
 *
 * `cache: "no-store"` is load-bearing: without it Next can cache the POST and a counter
 * would silently stop moving.
 */
export async function pipeline(commands: string[][]): Promise<unknown[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL as string;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN as string;

  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash HTTP ${res.status}`);

  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(data) || data.length !== commands.length) {
    throw new Error("unexpected upstash pipeline response");
  }
  // A per-command error is still a failure, even inside a 200 envelope.
  for (const entry of data) {
    if (entry && typeof entry === "object" && typeof entry.error === "string") {
      throw new Error(`upstash command error: ${entry.error}`);
    }
  }
  return data.map((entry) => entry?.result);
}

/** The shape the loves store takes INJECTED, so its policy stays a testable leaf. */
export type Pipeline = (commands: string[][]) => Promise<unknown[]>;
