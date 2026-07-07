"use client";

// Studio list+detail shell — a narrow tablist on the left, a fixed detail pane on
// the right that swaps content on select without moving. Replaces the in-place
// expand across the settings/experience/projects editing pages. Presentation
// only: the panels keep their exact useDraftForm wiring; they render into the
// pane instead of an expanding card and report their dirty state here for the
// per-item unsaved dot (separately from useReportPending, which still drives the
// Publish bar — both read the same panel `dirty`, so they cannot diverge).
//
// The hard invariant: every panel is passed as `children` and stays MOUNTED; an
// unselected panel returns null (see useListItem) but is never unmounted, so its
// unsaved draft survives selecting away and back.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

export type ListDetailSection = {
  id: string;
  name: string;
  // Optional status label rendered as a pill next to the name (e.g. "Currently").
  // The caller owns the label + the decision; the shell just renders it.
  badge?: string;
};

type ListDetailCtx = {
  activeId: string | null;
  select: (id: string) => void;
  dirtyIds: Set<string>;
  reportDirty: (id: string, dirty: boolean) => void;
};

const NOOP: ListDetailCtx = {
  activeId: null,
  select: () => {},
  dirtyIds: new Set(),
  reportDirty: () => {},
};

const ListDetailContext = createContext<ListDetailCtx | null>(null);

/**
 * Used by each edit panel: reports the panel's dirty state to the left list (for
 * the unsaved dot) and returns whether it is the selected item. Renders the
 * detail when selected, null otherwise — but the component stays mounted, so its
 * useDraftForm draft persists across selection. Mirrors useReportPending.
 */
export function useListItem(id: string, dirty: boolean): { isSelected: boolean } {
  const { reportDirty, activeId } = useContext(ListDetailContext) ?? NOOP;
  useEffect(() => {
    reportDirty(id, dirty);
    return () => reportDirty(id, false);
  }, [id, dirty, reportDirty]);
  return { isSelected: activeId === id };
}

const MOBILE_MQ = "(max-width: 1023px)"; // the site's 1024 (lg) breakpoint

export function ListDetailLayout({
  sections,
  children,
}: {
  sections: ListDetailSection[];
  children: React.ReactNode;
}) {
  // Deep-link support: studio search navigates to /studio/<page>?item=<id> and
  // this pre-selects that entry. `item` is validated against sections so a stale
  // param falls back to the default (first on desktop / list on mobile).
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const targetId = itemParam && sections.some((s) => s.id === itemParam) ? itemParam : null;

  // null on mobile = show the list; on desktop the first item is pre-selected
  // (activeId falls back to sections[0]). Seeded from ?item= for no-flash deep-links.
  const [selectedId, setSelectedId] = useState<string | null>(targetId);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());
  const paneRef = useRef<HTMLDivElement>(null);

  const reportDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((prev) => {
      if (dirty === prev.has(id)) return prev; // no change
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const activeId = selectedId ?? sections[0]?.id ?? null;

  const isMobile = () =>
    typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches;

  const select = useCallback((id: string) => {
    setSelectedId(id);
    if (isMobile()) requestAnimationFrame(() => paneRef.current?.focus());
  }, []);

  // Re-select when ?item= changes while this layout stays mounted (searching for
  // another entry on the same page). The initial value is already seeded above,
  // so this only fires on an actual param change. Reuses the existing select().
  useEffect(() => {
    if (targetId) select(targetId);
  }, [targetId, select]);

  const back = useCallback(() => {
    const prev = activeId;
    setSelectedId(null);
    requestAnimationFrame(() => document.getElementById(`ld-tab-${prev}`)?.focus());
  }, [activeId]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const idx = sections.findIndex((s) => s.id === activeId);
    if (idx === -1) return;
    const n = sections.length;
    const nextIdx = e.key === "ArrowDown" ? (idx + 1) % n : (idx - 1 + n) % n;
    const nextId = sections[nextIdx].id;
    select(nextId);
    requestAnimationFrame(() => document.getElementById(`ld-tab-${nextId}`)?.focus());
  }

  const value = useMemo<ListDetailCtx>(
    () => ({ activeId, select, dirtyIds, reportDirty }),
    [activeId, select, dirtyIds, reportDirty]
  );

  return (
    <ListDetailContext.Provider value={value}>
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-4">
        {/* Left list */}
        <nav
          role="tablist"
          aria-orientation="vertical"
          aria-label="Sections"
          onKeyDown={handleKey}
          className={`${selectedId === null ? "block" : "hidden"} lg:block`}
        >
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {sections.map((s) => {
              const isActive = s.id === activeId;
              const isDirty = dirtyIds.has(s.id);
              // Compose the accessible name from the visible states so the badge
              // (and the dirty dot) are announced even when both are present.
              const label = [s.name, s.badge, isDirty && "unsaved changes"]
                .filter(Boolean)
                .join(", ");
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="tab"
                    id={`ld-tab-${s.id}`}
                    aria-selected={isActive}
                    aria-controls="ld-panel"
                    aria-label={s.badge || isDirty ? label : undefined}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => select(s.id)}
                    className={[
                      "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500",
                      isActive
                        ? "border-accent-500/40 bg-accent-500/10 font-medium text-ink-950"
                        : "border-ink-950/8 bg-cream-50 text-ink-700 hover:border-accent-500/30 hover:bg-cream-100",
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{s.name}</span>
                      {s.badge && (
                        <span className="shrink-0 rounded-full bg-accent-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-accent-600">
                          {s.badge}
                        </span>
                      )}
                    </span>
                    {isDirty && (
                      <span className="size-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right detail pane */}
        <div
          id="ld-panel"
          ref={paneRef}
          role="tabpanel"
          tabIndex={-1}
          aria-labelledby={activeId ? `ld-tab-${activeId}` : undefined}
          className={`${selectedId === null ? "hidden" : "block"} outline-none lg:block`}
        >
          <button
            type="button"
            onClick={back}
            className="mb-3 inline-flex items-center gap-1 text-[13px] text-accent-600 lg:hidden"
          >
            ← All sections
          </button>
          {children}
        </div>
      </div>
    </ListDetailContext.Provider>
  );
}
