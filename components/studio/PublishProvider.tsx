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

  /** Is something on the page currently occupying the pill's corner of the work area? */
  anyOccluding: boolean;
  /** Report it, keyed like `reportPending` so several reporters cannot fight. */
  reportOccluding: (id: string, occluding: boolean) => void;
};

// No-op fallback so a panel rendered outside the provider never crashes.
const NOOP: PublishSignal = {
  unpublished: false,
  draftReadError: false,
  setUnpublished: () => {},
  anyPending: false,
  reportPending: () => {},
  anyOccluding: false,
  reportOccluding: () => {},
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

  /* THE SAME SHAPE AS `reportPending`, KEYED BY ID FOR THE SAME REASON: several reporters must
     not be able to overwrite each other, and a reporter that unmounts must take its own claim
     with it rather than leaving the pill hidden forever. */
  const [occludingIds, setOccludingIds] = useState<ReadonlySet<string>>(new Set());
  const reportOccluding = useCallback((id: string, occluding: boolean) => {
    setOccludingIds((prev) => {
      const has = prev.has(id);
      if (has === occluding) return prev;
      const next = new Set(prev);
      if (occluding) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo<PublishSignal>(
    () => ({ unpublished, setUnpublished, draftReadError, anyPending: pendingIds.size > 0, reportPending,
      anyOccluding: occludingIds.size > 0, reportOccluding }),
    [unpublished, draftReadError, pendingIds, reportPending, occludingIds, reportOccluding]
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

/**
 * Report that this panel is occupying the space the publish pill floats in, so the pill can get
 * out of the way rather than being cleared around.
 *
 * ⚠ THIS IS THE OTHER ANSWER TO THE OVERLAP, AND IT IS THE BETTER ONE WHERE IT APPLIES. The
 * clearance property raises the pill above the docked furniture, which is right for a save bar —
 * that bar is permanent, and an author needs both it and Publish. The SELECTED RAIL is not
 * permanent: it appears because a field was clicked, it is the thing being worked in, and it is
 * transient. Raising the pill above it stacks two floating things in one corner; hiding the pill
 * for its duration gives the rail the room and costs nothing, because an author editing a field
 * is not reaching for Publish in the same gesture. The pill returns the moment the rail closes.
 */
export function useReportOccluding(occluding: boolean): void {
  const { reportOccluding } = usePublishSignal();
  const id = useId();
  useEffect(() => {
    reportOccluding(id, occluding);
    return () => reportOccluding(id, false);
  }, [id, occluding, reportOccluding]);
}
