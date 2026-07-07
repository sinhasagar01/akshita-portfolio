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
import { IconX, IconPlus } from "./icons";

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
  onAddItem,
  addItemLabel,
  onRemoveItem,
}: {
  sections: ListDetailSection[];
  children: React.ReactNode;
  // Optional dynamic-list capability (SK-3a). All absent = static list (today's
  // behavior, byte-identical). onAddItem renders an "Add" control and, if it
  // returns an id, selects the new item. onRemoveItem renders a per-item remove
  // control; the layout re-selects a live neighbor BEFORE the consumer deletes.
  onAddItem?: () => string | undefined;
  addItemLabel?: string;
  onRemoveItem?: (id: string) => void;
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

  // SK-3a — dynamic list. Add: let the consumer append an item; if it returns the
  // new id, select it (reusing select()).
  function handleAdd() {
    const newId = onAddItem?.();
    if (newId) select(newId);
  }

  // Remove: if the SELECTED item is going, pick a live neighbor (next, else prev,
  // else none) and set it BEFORE the consumer deletes — both updates batch into
  // one render, so there is no frame where the selection points at a removed
  // item (no flash/stale). Removing a non-selected item leaves selection intact.
  function handleRemove(id: string) {
    if (id === activeId) {
      const idx = sections.findIndex((s) => s.id === id);
      const neighbor = sections[idx + 1] ?? sections[idx - 1] ?? null;
      setSelectedId(neighbor ? neighbor.id : null);
      if (neighbor) {
        requestAnimationFrame(() => document.getElementById(`ld-tab-${neighbor.id}`)?.focus());
      }
    }
    onRemoveItem?.(id);
  }

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
                <li key={s.id} className={onRemoveItem ? "group relative" : undefined}>
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
                  {onRemoveItem && (
                    <button
                      type="button"
                      // Roving like the tabs: only the active item's remove is in
                      // the Tab order; reach any other via arrow-select then Tab.
                      // opacity-0 keeps it focusable (not display:none), revealed on
                      // hover or when the item holds focus.
                      tabIndex={isActive ? 0 : -1}
                      aria-label={`Remove ${s.name}`}
                      onClick={() => handleRemove(s.id)}
                      className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-ink-400 opacity-0 transition-opacity hover:bg-cream-200 hover:text-ink-950 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 group-hover:opacity-100 group-focus-within:opacity-100 [&>svg]:size-3.5"
                    >
                      <IconX />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {onAddItem && (
            // Placed after the tab list; it is an action, not a tab, so it is
            // Tab-reachable but NOT part of the arrow-key cycle (which walks
            // sections only). See the a11y note in the PR: it lives inside the
            // role="tablist" nav to keep the static markup byte-identical.
            <button
              type="button"
              onClick={handleAdd}
              className="mt-1.5 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-ink-950/15 px-3 py-2 text-[13px] text-ink-600 transition-colors hover:border-accent-500/40 hover:bg-cream-100 hover:text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 [&>svg]:size-3.5"
            >
              <IconPlus />
              {addItemLabel ?? "Add"}
            </button>
          )}
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
