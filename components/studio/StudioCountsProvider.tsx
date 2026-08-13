"use client";

// Sidebar-count sync — the sidebar's Projects/Experience badges live in the
// dashboard LAYOUT (a server component that does not re-run on client-side
// navigation), while add/remove happens in the page's list editors as OPTIMISTIC
// client state. Without a shared client store the badge would stay stale until a
// hard reload (router.refresh() is only a best-effort reconcile of the server
// overlay, and does not reliably re-fetch in dev).
//
// This context wraps BOTH the sidebar and the page, seeded once from the server
// counts. Each list editor reports its live list length (useReportCount), so the
// badge always matches the visible list — instantly, without a reload. The
// provider lives in the layout, so it persists across /studio navigation; the
// last-reported count is retained when an editor unmounts (only one collection
// editor is mounted at a time, so there is never a conflicting report).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// `skills` is the number of CATEGORIES, not of individual skills — the owner's decision, and
// the reason SkillsEditor reports `values.categories.length`. Skills is also the one entry
// here whose source is a SINGLETON rather than a list, so the layout seeds it from
// `skills?.categories.length ?? 0` and not from a `.length` on the collection itself.
type Counts = { projects: number; experience: number; blog: number; skills: number; gallery: number };
type CountsSignal = {
  counts: Counts;
  setCount: (key: keyof Counts, value: number) => void;
};

// No-op fallback so the sidebar never crashes if rendered outside the provider.
const NOOP: CountsSignal = { counts: { projects: 0, experience: 0, blog: 0, skills: 0, gallery: 0 }, setCount: () => {} };

const CountsContext = createContext<CountsSignal | null>(null);

export function StudioCountsProvider({
  initial,
  children,
}: {
  initial: Counts;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState(initial);

  const setCount = useCallback((key: keyof Counts, value: number) => {
    setCounts((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const value = useMemo<CountsSignal>(() => ({ counts, setCount }), [counts, setCount]);

  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>;
}

export function useStudioCounts(): CountsSignal {
  return useContext(CountsContext) ?? NOOP;
}

/**
 * Keep a collection's sidebar badge in sync with a list editor's optimistic list
 * length. On mount the reported length equals the server-seeded count (the
 * setCount guard makes that a no-op, so no flash); on add/remove it updates the
 * badge immediately. No cleanup-reset — the last count is retained after unmount
 * so navigating away does not blank the badge.
 */
export function useReportCount(key: keyof Counts, count: number): void {
  const { setCount } = useStudioCounts();
  useEffect(() => {
    setCount(key, count);
  }, [key, count, setCount]);
}
