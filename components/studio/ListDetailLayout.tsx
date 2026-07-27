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
import { IconX, IconPlus, IconChevronUp, IconChevronDown } from "./icons";

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
  const ctx = useContext(ListDetailContext);
  const { reportDirty, activeId } = ctx ?? NOOP;
  useEffect(() => {
    reportDirty(id, dirty);
    return () => reportDirty(id, false);
  }, [id, dirty, reportDirty]);
  // OUTSIDE a list shell the panel IS the page — there is no selection to lose to,
  // so it is always showing. Without this a panel rendered on its own route
  // mounted and then returned null, drawing nothing at all.
  return { isSelected: ctx === null ? true : activeId === id };
}

const MOBILE_MQ = "(max-width: 1023px)"; // the site's 1024 (lg) breakpoint

const rowControlCls =
  "grid size-5 place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors hover:bg-cream-200 hover:text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 disabled:pointer-events-none disabled:opacity-30 [&>svg]:size-3.5";

export function ListDetailLayout({
  sections,
  children,
  onAddItem,
  addItemLabel,
  onRemoveItem,
  onMoveItem,
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
  // Reorder capability. Renders per-item up/down controls; the consumer applies
  // the move and persists the new order. Absent = no reorder controls, exactly
  // as before. The list order is the consumer's `sections` order, so the layout
  // re-renders from it rather than holding an order of its own.
  onMoveItem?: (id: string, direction: "up" | "down") => void;
}) {
  const hasRowControls = Boolean(onRemoveItem || onMoveItem);
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
            {sections.map((s, i) => {
              const isActive = s.id === activeId;
              const isDirty = dirtyIds.has(s.id);
              // Compose the accessible name from the visible states so the badge
              // (and the dirty dot) are announced even when both are present.
              const label = [s.name, s.badge, isDirty && "unsaved changes"]
                .filter(Boolean)
                .join(", ");
              return (
                <li key={s.id} className={hasRowControls ? "group relative" : undefined}>
                  <button
                    type="button"
                    role="tab"
                    id={`ld-tab-${s.id}`}
                    aria-selected={isActive}
                    aria-controls="ld-panel"
                    aria-label={s.badge || isDirty ? label : undefined}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => select(s.id)}
                    // SELECTION IS A CREAM FILL PLUS A 3px ACCENT LEFT BAR — the studio's one
                    // selection language, shared with the blog list rail and the block strip.
                    //
                    // THE FILL IS NOT THE SIGNAL AND NEVER WAS. Measured, every available cream
                    // step separates by 1.05 to 1.19, and the accent tint this replaces was
                    // 1.15 — inside that same band, which is why selection was hard to see at
                    // all. The BAR carries it at 3.4 to 4.1 against these grounds, ~30x the
                    // fill. The fill is a supporting wash; do not treat it as the cue.
                    //
                    // THE FILL IS `ground + 1 STEP`, NOT A FIXED COLOUR. This row's ground is
                    // cream-50 so the fill is cream-100; the rail sits on cream-200 and fills
                    // cream-300; the strip sits on cream-100 and fills cream-200. A single hex
                    // across three grounds would have been the third time in this arc a
                    // RELATION was encoded as a VALUE. Same rule and same bar is what makes it
                    // one language — the same hex would have made it three bugs.
                    //
                    // THE ACCENT TINT IS GONE, DELIBERATELY. #167 objected to a fill competing
                    // with the accent badge and dirty dot inside the row. A bar at the edge does
                    // not compete with a badge inline, so the bar delivers what #167 wanted;
                    // keeping the tint underneath would have preserved the problem beside its
                    // own solution.
                    //
                    // `border-l-[3px]` LIVES IN THE BASE with `border-l-transparent` when
                    // inactive, and `pl-[10px]` absorbs it so 3 + 10 matches the old 1 + 12.
                    // The reserved width keeps the box metrics constant — selection never
                    // reflows the row. Do not "simplify" it to drop the base border.
                    //
                    // NO `border-transparent` SHORTHAND ANYWHERE HERE. `border-transparent`
                    // writes `border-color` and `border-l-accent-500` writes
                    // `border-left-color`; both are utilities at equal specificity, so which
                    // one owns the left edge is decided by their order in the generated sheet.
                    // That is a coin-flip dressed as a class name, and the same family of bug
                    // as the dead utilities PR A removed. The three sides are set explicitly
                    // instead, so nothing competes.
                    //
                    // HOVER AND SELECTED SHARE THE FILL, BY NECESSITY. cream-100 on cream-50 is
                    // 1.05, so the cream ladder cannot encode rest, hover AND selected as three
                    // legible fills — a half-step hover would be ~1.02 and invisible. THE BAR IS
                    // WHAT SEPARATES THEM, at ~4:1, which is the same reason the fill is not the
                    // signal anywhere in this language. A hovered row is a preview of the
                    // selected fill without the bar.
                    className={[
                      "flex w-full items-center justify-between gap-2 rounded-[var(--studio-radius-card,8px)] border border-y-transparent border-r-transparent border-l-[3px] py-2.5 pl-[10px] text-left text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500",
                      onMoveItem ? "pr-[4.5rem]" : "pr-3",
                      isActive
                        ? "border-l-accent-500 bg-cream-100 font-medium text-ink-950"
                        : "border-l-transparent text-ink-700 hover:bg-cream-100",
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
                  {hasRowControls && (
                    // One cluster for every per-row control. Roving like the tabs:
                    // only the active item's controls are in the Tab order; reach
                    // another via arrow-select then Tab. opacity-0 (not
                    // display:none) keeps them focusable, revealed on hover or
                    // when the row holds focus.
                    <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100">
                      {onMoveItem && (
                        <>
                          <button
                            type="button"
                            tabIndex={isActive ? 0 : -1}
                            aria-label={`Move ${s.name} up`}
                            disabled={i === 0}
                            onClick={() => onMoveItem(s.id, "up")}
                            className={rowControlCls}
                          >
                            <IconChevronUp />
                          </button>
                          <button
                            type="button"
                            tabIndex={isActive ? 0 : -1}
                            aria-label={`Move ${s.name} down`}
                            disabled={i === sections.length - 1}
                            onClick={() => onMoveItem(s.id, "down")}
                            className={rowControlCls}
                          >
                            <IconChevronDown />
                          </button>
                        </>
                      )}
                      {onRemoveItem && (
                        <button
                          type="button"
                          tabIndex={isActive ? 0 : -1}
                          aria-label={`Remove ${s.name}`}
                          onClick={() => handleRemove(s.id)}
                          className={rowControlCls}
                        >
                          <IconX />
                        </button>
                      )}
                    </span>
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
              className="mt-1.5 flex w-full items-center gap-1.5 rounded-[var(--studio-radius-card,8px)] border border-dashed border-ink-950/15 px-3 py-2 text-[13px] text-ink-600 transition-colors hover:border-accent-500/40 hover:bg-cream-100 hover:text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 [&>svg]:size-3.5"
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
