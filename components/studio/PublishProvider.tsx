"use client";

// UX-1 — page-level publish state shared by the settings panels and the Publish
// bar. Single source for the singleton-wide "unpublished changes" (settings
// differs) signal and for whether ANY panel has unsaved / in-flight edits, so
// the page-level Publish button can gate exactly like Hero's old one did.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

type PublishSignal = {
  unpublished: boolean;
  /** The draft read failed; the bar shows a warning instead of a status. */
  draftReadError: boolean;
  setUnpublished: (value: boolean) => void;
  anyPending: boolean;
  reportPending: (id: string, pending: boolean) => void;
};

// No-op fallback so a panel rendered outside the provider never crashes.
const NOOP: PublishSignal = {
  unpublished: false,
  draftReadError: false,
  setUnpublished: () => {},
  anyPending: false,
  reportPending: () => {},
};

const PublishContext = createContext<PublishSignal | null>(null);

export function PublishProvider({
  initialDiffers,
  draftReadError = false,
  children,
}: {
  initialDiffers: boolean;
  draftReadError?: boolean;
  children: React.ReactNode;
}) {
  const [unpublished, setUnpublished] = useState(initialDiffers);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const reportPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((prev) => {
      if (pending === prev.has(id)) return prev; // no change
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo<PublishSignal>(
    () => ({ unpublished, setUnpublished, draftReadError, anyPending: pendingIds.size > 0, reportPending }),
    [unpublished, draftReadError, pendingIds, reportPending]
  );

  return <PublishContext.Provider value={value}>{children}</PublishContext.Provider>;
}

export function usePublishSignal(): PublishSignal {
  return useContext(PublishContext) ?? NOOP;
}

/**
 * Report this panel's pending (unsaved or in-flight) state to the page Publish
 * bar. Publish stays disabled while ANY panel is pending, so it can never merge
 * a draft that omits an unsaved edit — the multi-panel equivalent of Hero's old
 * `!dirty && saveStatus !== "saving"` gate.
 */
export function useReportPending(pending: boolean): void {
  const { reportPending } = usePublishSignal();
  const id = useId();
  useEffect(() => {
    reportPending(id, pending);
    return () => reportPending(id, false);
  }, [id, pending, reportPending]);
}
