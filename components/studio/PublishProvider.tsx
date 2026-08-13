"use client";
import type { DraftReadFailure } from "@/lib/studio/draft-site-settings";

// UX-1 — page-level publish state shared by the settings panels and the Publish
// bar. Single source for the singleton-wide "unpublished changes" (settings
// differs) signal and for whether ANY panel has unsaved / in-flight edits, so
// the page-level Publish button can gate exactly like Hero's old one did.
import {
  type Toast, TOAST_SLOW_MS,
  push as pushT, resolve as resolveT, dismiss as dismissT,
} from "@/lib/studio/toast-machine";
import {
  createContext,
  useCallback,
  useRef,
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
  draftGone: boolean;
  draftReadFailures: readonly DraftReadFailure[];
  setUnpublished: (value: boolean) => void;
  anyPending: boolean;
  reportPending: (id: string, pending: boolean) => void;

  /** Is something on the page currently occupying the pill's corner of the work area? */
  anyOccluding: boolean;
  /** Report it, keyed like `reportPending` so several reporters cannot fight. */
  reportOccluding: (id: string, occluding: boolean) => void;
  /* ⚠ THE TOASTS LIVE HERE BECAUSE TWO UNRELATED SURFACES RAISE THEM. PublishBar raises publish
     results and every panel's `useDraftForm` raises save results; they share no ancestor but this
     provider, which already carries exactly this kind of cross-component publish state. A second
     provider for one more signal is the shape this repo refuses. */
  toasts: Toast[];
  /** ⚠ `onRetry` IS THE FIX FOR A DEAD CONTROL. The slow-warning offered "Try again" before this
   *  state moved here, and the provider's signature dropped it — so nothing ever set `action.retry`
   *  and the button could not render at all. The provider cannot know HOW to retry; the caller
   *  does, so the callback rides with the operation and is keyed by its id. */
  beginToast: (title: string, message: string, onRetry?: () => void) => number;
  retryToast: (id: number) => void;
  resolveToast: (id: number, patch: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

// No-op fallback so a panel rendered outside the provider never crashes.
const NOOP: PublishSignal = {
  toasts: [],
  beginToast: () => 0,
  retryToast: () => {},
  resolveToast: () => {},
  dismissToast: () => {},
  unpublished: false,
  draftReadError: false,
  draftGone: false,
  draftReadFailures: [],
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
  draftGone = false,
  draftReadFailures = [],
  children,
}: {
  initialDiffers: boolean;
  draftReadError?: boolean;
  draftGone?: boolean;
  draftReadFailures?: readonly DraftReadFailure[];
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

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  /** Slow-warning timers, keyed by operation id — never a single "current" handle, because two
   *  operations overlap routinely and one handle resolves whichever finished last. */
  const slowTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const retryFns = useRef(new Map<number, () => void>());
  /** ⚠ ONE PLACE THAT FORGETS AN OPERATION, so a card can never leave a timer or a callback behind.
   *  Bug D was `push()` dropping the oldest card past the cap while only `dismiss`/`resolve` cleared
   *  timers — a silent slice cannot clean up after itself, so the caller has to. */
  const forget = useCallback((id: number) => {
    const h = slowTimers.current.get(id);
    if (h) { clearTimeout(h); slowTimers.current.delete(id); }
    retryFns.current.delete(id);
  }, []);
  const dismissToast = useCallback((id: number) => {
    forget(id);
    setToasts((prev) => dismissT(prev, id));
  }, [forget]);
  const retryToast = useCallback((id: number) => {
    const fn = retryFns.current.get(id);
    forget(id);
    setToasts((prev) => dismissT(prev, id));
    fn?.();
  }, [forget]);
  const resolveToast = useCallback((id: number, patch: Omit<Toast, "id">) => {
    forget(id);
    setToasts((prev) => resolveT(prev, id, patch));
  }, [forget]);
  const beginToast = useCallback((title: string, message: string, onRetry?: () => void) => {
    const id = ++toastSeq.current;
    if (onRetry) retryFns.current.set(id, onRetry);
    setToasts((prev) => {
      const next = pushT(prev, { id, kind: "pending", title, message });
      /* D · whatever the cap dropped is forgotten here, where the drop is visible. */
      for (const t of prev) if (!next.some((n) => n.id === t.id)) forget(t.id);
      return next;
    });
    slowTimers.current.set(id, setTimeout(() => {
      slowTimers.current.delete(id);
      setToasts((prev) => prev.some((t) => t.id === id && t.kind === "pending")
        ? resolveT(prev, id, {
            kind: "refusal",
            title: "Taking longer than expected",
            message: "This is still running. It may finish on its own — nothing has been lost.",
            ...(retryFns.current.has(id) ? { action: { label: "Try again", retry: true as const } } : {}),
          })
        : prev);
    }, TOAST_SLOW_MS));
    return id;
  }, [forget]);
  /* ⚠ A MALFORMED DRAFT ENTRY IS AN ERROR, NOT STANDING STATE, AND THIS EFFECT IS THAT RULING.
   *
   * These failures first went to the publish BAR, on my reading that "one file will not parse" is a
   * condition rather than an event. The owner read it the other way and the owner is right: it means
   * something is BROKEN AND NEEDS FIXING, which is a refusal — persistent, named, actionable. A
   * standing line is overwritten by the next status and carries no action; a refusal does not drain
   * (`drains()` is `ok && !sha`) and stays until it is answered.
   *
   * ⚠ THE GLOBAL FLAG STAYS ON THE BAR, AND THE SPLIT IS THE POINT. `draftReadError` means the whole
   * read failed and the studio is showing PUBLISHED content — that genuinely is standing state,
   * true of everything on screen for as long as it lasts. A per-entry failure is one broken file
   * against a working draft, which is an event with a subject.
   *
   * ONE REFUSAL PER FAILURE, RAISED ONCE. The dependency is the failure IDENTITY rather than the
   * array, because the provider re-renders on every toast change and an array literal is a new
   * reference each time — which would raise the same refusal forever. */
  const raisedFailures = useRef("");
  useEffect(() => {
    const key = draftReadFailures.map((f) => `${f.collection}/${f.slug}`).join("|");
    if (key === raisedFailures.current) return;
    raisedFailures.current = key;
    for (const f of draftReadFailures) {
      const id = ++toastSeq.current;
      setToasts((prev) => pushT(prev, {
        id,
        kind: "refusal",
        title: `Couldn\u2019t read ${f.collection}/${f.slug}`,
        /* THE SERVER'S OWN SENTENCE, UNMODIFIED — the rule the toast type's own comment states. The
           reader's message names the offending key, which is the one fact that tells an author what
           to fix rather than that something is wrong. */
        message: `${f.message} Everything else is your draft.`,
      }));
    }
  }, [draftReadFailures]);

  useEffect(() => {
    const timers = slowTimers.current;
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  }, []);
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
    () => ({ unpublished, setUnpublished, draftReadError, draftGone, draftReadFailures, anyPending: pendingIds.size > 0, reportPending,
      anyOccluding: occludingIds.size > 0, reportOccluding,
      toasts, beginToast, resolveToast, dismissToast, retryToast }),
    [unpublished, draftReadError, draftGone, draftReadFailures, pendingIds, reportPending, occludingIds, reportOccluding,
      toasts, beginToast, resolveToast, dismissToast, retryToast]
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
