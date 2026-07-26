"use client";

// BS-4b — the love counter's client state, shared by every control on a page.
//
// P1, THE CLIENT/SERVER SEAM. The vessel and capsule live inside ReadingVessel (a client
// component); the end-of-article pill is rendered by the server page. Sharing state across
// those needs a client context, and this is it. It takes `children`, so the server page
// wraps its ALREADY SERVER-RENDERED tree in it — BlogProse and the article body never
// reach the client bundle.
//
// P2, PER-POST BY CONSTRUCTION, NOT BY CARE. `counts` is keyed by slug and every consumer
// names its own slug. There is no ambient "the current count" to read, so on the index the
// featured card CANNOT pick up a stream card's number even in principle — not because this
// file is careful, but because there is nothing else to read. One shape serves both pages:
// the article passes one slug, the index passes all of them.
//
// P3, NOT EVERY CONTROL IS MOUNTED. Under reduced motion ReadingVessel returns null, so two
// of the three article controls do not exist. Driving a Record rather than a fixed set of
// subscribers makes "zero readouts mounted" the same code path as two.
//
// THE CONTAINMENT RULE (findings F3). A love failure must never take the page with it.
// #173 found that a reader throw fails the whole site BUILD; this is the runtime twin. So
// every fetch is wrapped, every response is shape-checked before use, and the components
// render correctly at count === null. Nothing in here may throw on bad data.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Per-device pressed state. The server's dedupe key is the integrity control; these two
 *  can disagree (a second device shows an unpressed heart) and that is accepted. */
const STORAGE_KEY = "blog:loved";

type LoveContextValue = {
  /** slug -> count, or null for "not loaded". A real, loaded 0 is stored as 0. */
  counts: Record<string, number | null>;
  loved: ReadonlySet<string>;
  love: (slug: string) => void;
};

/** A consumer rendered outside any provider degrades to countless and inert rather than
 *  throwing. Same containment rule — a missing provider is a bug, not a broken page. */
const INERT: LoveContextValue = { counts: {}, loved: new Set(), love: () => {} };

const LoveContext = createContext<LoveContextValue>(INERT);

/** Everything one control needs, for ONE slug. The slug is an argument, never ambient. */
export function useLove(slug: string) {
  const { counts, loved, love } = useContext(LoveContext);
  const count = counts[slug];
  return {
    count: typeof count === "number" ? count : null,
    loved: loved.has(slug),
    love: useCallback(() => love(slug), [love, slug]),
  };
}

function readStored(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    // Shape-checked: a hand-edited or half-written value must not crash the article.
    return Array.isArray(parsed) ? new Set(parsed.filter((s): s is string => typeof s === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function writeStored(slugs: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs]));
  } catch {
    // Private mode, quota, storage disabled. The press still counted server-side; the
    // heart just will not remember on the next visit. Not worth surfacing.
  }
}

/** The same clamp the store applies, on the way in. A count is never negative and never
 *  NaN on screen even if something upstream goes wrong. */
function clean(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : null;
}

export default function LoveProvider({ slugs, children }: { slugs: string[]; children: ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loved, setLoved] = useState<ReadonlySet<string>>(() => new Set());

  // Mirrors, so `love` can read current state without re-creating itself on every change
  // and without the read-inside-a-setter trick.
  const countsRef = useRef(counts);
  const lovedRef = useRef(loved);
  const inflight = useRef<Set<string>>(new Set());

  const commitCounts = useCallback((next: Record<string, number | null>) => {
    countsRef.current = next;
    setCounts(next);
  }, []);
  const commitLoved = useCallback((next: Set<string>) => {
    lovedRef.current = next;
    setLoved(next);
    writeStored(next);
  }, []);

  // localStorage is read in an effect, never during render: reading it during render is a
  // hydration mismatch. The cost is that a loved heart fills one frame late, which is
  // invisible next to the count arriving over the network anyway.
  useEffect(() => {
    const stored = readStored();
    lovedRef.current = stored;
    setLoved(stored);
  }, []);

  // ONE request for the whole page. Un-batching this is what would multiply the index's
  // Redis cost by the number of cards, so the join is load-bearing, not a tidiness.
  const key = slugs.join(",");
  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (list.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = list.map((s) => `slug=${encodeURIComponent(s)}`).join("&");
        const res = await fetch(`/api/loves?${qs}`);
        const body: unknown = await res.json();
        if (cancelled || !body || typeof body !== "object") return;
        const payload = body as { ok?: unknown; counts?: unknown };
        // FAIL QUIET: { ok: false } is a normal answer, not an error. No number, no
        // message, no console noise. The page is unaffected.
        if (payload.ok !== true || !payload.counts || typeof payload.counts !== "object") return;
        const source = payload.counts as Record<string, unknown>;
        const next = { ...countsRef.current };
        for (const slug of list) {
          const value = clean(source[slug]);
          // An unknown slug is OMITTED by the endpoint (the fourth leak path), so a missing
          // key stays null — "not loaded" — rather than becoming a fabricated 0.
          if (value !== null) next[slug] = value;
        }
        commitCounts(next);
      } catch {
        // Network failure, non-JSON body, anything. Countless, and the page survives.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, commitCounts]);

  /**
   * ONE-WAY. A second call for a slug this device already loved is a no-op before any
   * request is made, so there is no un-love path and no DECR anywhere in the client.
   *
   * Optimistic, with a silent revert on failure. A rejected love (429, outage, offline)
   * must not scold — the honest outcome is that the click did not count.
   */
  const love = useCallback(
    (slug: string) => {
      if (lovedRef.current.has(slug) || inflight.current.has(slug)) return;
      inflight.current.add(slug);

      const previousCount = countsRef.current[slug] ?? null;
      const optimistic = new Set(lovedRef.current);
      optimistic.add(slug);
      commitLoved(optimistic);
      commitCounts({ ...countsRef.current, [slug]: (previousCount ?? 0) + 1 });

      const revert = () => {
        const back = new Set(lovedRef.current);
        back.delete(slug);
        commitLoved(back);
        commitCounts({ ...countsRef.current, [slug]: previousCount });
      };

      (async () => {
        try {
          const res = await fetch("/api/loves", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          const body: unknown = await res.json().catch(() => null);
          const payload = (body ?? {}) as { ok?: unknown; count?: unknown };
          const authoritative = clean(payload.count);
          if (!res.ok || payload.ok !== true || authoritative === null) {
            revert();
            return;
          }
          // `counted: false` means the server had already seen this visitor — the press is
          // still correct, so the heart stays filled and the count is taken as given.
          commitCounts({ ...countsRef.current, [slug]: authoritative });
        } catch {
          revert();
        } finally {
          inflight.current.delete(slug);
        }
      })();
    },
    [commitCounts, commitLoved]
  );

  return <LoveContext.Provider value={{ counts, loved, love }}>{children}</LoveContext.Provider>;
}
