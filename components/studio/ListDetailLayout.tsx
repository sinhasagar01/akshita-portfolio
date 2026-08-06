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
  /** Extra search vocabulary, matched by the rail filter but never rendered.
   *
   *  IT EXISTS BECAUSE A NAME IS NOT ALWAYS THE WORD YOU LOOK FOR. Site settings has four fixed
   *  sections — Hero, About, Links, Process — and the field an author is hunting is usually named
   *  nothing like the section holding it: "resume" lives under Links, "photo" under About,
   *  "scroll cue" under Hero. Filtering names alone returns nothing for every one of those.
   *  `STUDIO_SETTINGS_SECTIONS` HAS ALREADY AUTHORED THIS VOCABULARY for the global studio search,
   *  so the rail reads the same words rather than a second list that could drift from it. */
  keywords?: string;
  // Optional status label rendered as a pill next to the name (e.g. "Currently").
  // The caller owns the label + the decision; the shell just renders it.
  badge?: string;
  /** Optional second line beneath the name.
   *
   *  A ROW WITH A META LINE IS A DIFFERENT SHAPE, so it renders differently — see the row markup.
   *  Consumers that pass no meta get byte-identical markup to before; this is a capability the
   *  shell gained, not a change to the rows that already existed.
   *
   *  IT EXISTS BECAUSE ONE FIELD COULD NOT DISCRIMINATE. Experience rows led with the company,
   *  and two entries share "LTIMindtree, Bengaluru" — at rail width they read "LTIMind…" and
   *  "LTIMindtree, Bengal…". Leading with the title instead is WORSE, not better: three entries
   *  share "UX and UI Designer", so it trades a two-row collision for a three-row one. Only the
   *  PAIR discriminates every row, which is what a second line is for. */
  meta?: string;
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
  "grid size-5 place-items-center rounded-[var(--studio-radius-control,4px)] text-studio-ink-400 transition-colors hover:bg-studio-cream-200 hover:text-studio-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500 disabled:pointer-events-none disabled:opacity-30 [&>svg]:size-3.5";

export function ListDetailLayout({
  sections,
  children,
  onAddItem,
  addItemLabel,
  searchPlaceholder,
  onRemoveItem,
  onMoveItem,
  footer,
}: {
  sections: ListDetailSection[];
  children: React.ReactNode;
  // Optional dynamic-list capability (SK-3a). All absent = static list (today's
  // behavior, byte-identical). onAddItem renders an "Add" control and, if it
  // returns an id, selects the new item. onRemoveItem renders a per-item remove
  // control; the layout re-selects a live neighbor BEFORE the consumer deletes.
  onAddItem?: () => string | undefined;
  addItemLabel?: string;
  // The rail's own filter (the contract's `.rt` block). OPT-IN BY PLACEHOLDER, with no default:
  // the placeholder names what is being searched ("Search roles", "Search categories").
  // Absent = no search row, exactly as before.
  //
  // ⚠ THIS COMMENT USED TO ARGUE SITE SETTINGS HAD NOTHING TO FILTER, and the original reasoning
  // is kept rather than deleted: "a generic default would put an unlabelled box on Site settings,
  // whose four fixed panels have nothing to filter."
  // IT WAS RIGHT ABOUT THE NAMES AND WRONG ABOUT THE CONTENT. Four fixed names are not worth a
  // filter — but `keywords` above carries the vocabulary of the FIELDS inside them, so searching
  // "resume" now surfaces Links. The opt-in stays; settings opts in.
  searchPlaceholder?: string;
  onRemoveItem?: (id: string) => void;
  // Reorder capability. Renders per-item up/down controls; the consumer applies
  // the move and persists the new order. Absent = no reorder controls, exactly
  // as before. The list order is the consumer's `sections` order, so the layout
  // re-renders from it rather than holding an order of its own.
  onMoveItem?: (id: string, direction: "up" | "down") => void;
  /** A bar pinned to the DETAIL COLUMN's foot, below the panels. See where it renders. */
  footer?: React.ReactNode;
}) {
  const hasRowControls = Boolean(onRemoveItem || onMoveItem);

  // THE RAIL FILTER. It narrows the ROWS ONLY — never the children, which stay mounted under
  // mount discipline, and never `sections`, which the deep-link and selection logic read. So
  // filtering to nothing cannot orphan the open panel: the detail pane keeps rendering whatever
  // is selected while the rail shows no match, which is the behaviour a filter should have.
  // Matches the name and the meta line, because the meta is what distinguishes three entries
  // titled "UX and UI Designer" from each other (C-24's finding, and the reason meta exists).
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visibleSections = q
    ? sections.filter((s) =>
        `${s.name} ${s.meta ?? ""} ${s.keywords ?? ""}`.toLowerCase().includes(q)
      )
    : sections;

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
    // THE FILTER LIVES INSIDE THE `role="tablist"` NAV, SO THE ARROW KEYS HAVE TO YIELD TO IT.
    // Without this the rail would change the selected panel while the author is typing — the
    // keys reach the nav's handler before any tab is focused. Guarded on the ORIGIN rather than
    // on a flag, so a second control added to the rail later inherits the same protection.
    if ((e.target as HTMLElement)?.tagName === "INPUT") return;
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const idx = visibleSections.findIndex((s) => s.id === activeId);
    if (idx === -1) return;
    const n = visibleSections.length;
    const nextIdx = e.key === "ArrowDown" ? (idx + 1) % n : (idx - 1 + n) % n;
    const nextId = visibleSections[nextIdx].id;
    select(nextId);
    requestAnimationFrame(() => document.getElementById(`ld-tab-${nextId}`)?.focus());
  }

  const value = useMemo<ListDetailCtx>(
    () => ({ activeId, select, dirtyIds, reportDirty }),
    [activeId, select, dirtyIds, reportDirty]
  );

  return (
    <ListDetailContext.Provider value={value}>
      {/* ---- A FULL-HEIGHT SHELL, NOT A PADDED CARD --------------------------------------
          `data-studio-fullheight` is how this opts into the dashboard layout's viewport-height
          rule — the same mechanism `ThreePaneShell` has used since #178, not a new one. Both of
          the layout's `:has()` rules are `lg:`-prefixed, so BELOW `lg` this is ordinary document
          flow and the stacked list-then-detail behaviour is untouched. That prefix is the whole
          of #178's protection and the reason a viewport-height rule here cannot make a short
          page's bottom unreachable the way an unconditional one did.

          THE THREE PAGES THIS REACHES are Site settings, Experience and Skills — the only three
          that RENDER this component. Six other panels import `useListItem` from this file, but a
          hook is not a layout: they sit inside the pane and read none of its geometry. */}
      <div data-studio-fullheight className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Left list — a 300px column on cream-200, its own scroll region. */}
        <nav
          role="tablist"
          aria-orientation="vertical"
          aria-label="Sections"
          onKeyDown={handleKey}
          className={`${selectedId === null ? "flex" : "hidden"} min-h-0 flex-col lg:flex lg:w-[300px] lg:flex-none lg:border-r lg:border-studio-ink-950/22 lg:bg-studio-cream-200`}
        >
          {/* THE CONTRACT'S `.rt` BLOCK — a 12px pad over a hairline, a 40px well inside it.
              The 40px matches the TOPBAR search rather than the 44px `inputCls` wells: this is
              chrome that filters a list, not a field that edits content, and #205 already set
              that height for the topbar's search. `placeholder:text-studio-text-subtle` rather than the
              topbar's `ink-400` — the topbar's placeholder sits on INK at `lg` where ink-200
              carries it, this one is always on cream, where ink-400 is 3.49 and fails. */}
          {searchPlaceholder && (
            <div className="border-b border-studio-ink-950/12 p-3">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-10 w-full rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-50 px-3 text-[13px] text-studio-ink-950 outline-none placeholder:text-studio-text-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500"
              />
            </div>
          )}
          {/* FULL-BLEED ROWS: no gap and no radius, because the rows now ABUT and a 1px rule
              separates them. A gap plus a radius made each row a floating card, which is the
              card idiom this shell is leaving. */}
          <ul className="m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
            {visibleSections.map((s, i) => {
              const isActive = s.id === activeId;
              const isDirty = dirtyIds.has(s.id);
              // Compose the accessible name from the visible states so the badge
              // (and the dirty dot) are announced even when both are present.
              const label = [s.name, s.meta, s.badge, isDirty && "unsaved changes"]
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
                    aria-label={s.meta || s.badge || isDirty ? label : undefined}
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
                    // inactive, and a 10px left pad absorbs it so 3 + 10 matches the old 1 + 12.
                    // The reserved width keeps the box metrics constant — selection never
                    // reflows the row. Do not "simplify" it to drop the base border.
                    //
                    // NO `border-transparent` SHORTHAND ANYWHERE HERE. `border-transparent`
                    // writes `border-color` and `border-l-studio-accent-500` writes
                    // `border-left-color`; both are utilities at equal specificity, so which
                    // one owns the left edge is decided by their order in the generated sheet.
                    // That is a coin-flip dressed as a class name, and the same family of bug
                    // as the dead utilities PR A removed. The three sides are set explicitly
                    // instead, so nothing competes.
                    //
                    // THE INACTIVE BRANCH NO LONGER SETS A COLOUR, AND NEVER EFFECTIVELY DID.
                    // It carried `text-ink-700`, a token with no `@theme` declaration (hazard
                    // 23), so Tailwind generated nothing for it. MEASURED before deletion:
                    // active and inactive rows both rendered ink-950 — `DISTINCTION_EXISTS:
                    // false` — so the pair this ternary appears to draw has never existed on
                    // screen. Deleting is zero visual change. A row label reads correctly at
                    // full ink, and selection is carried by the fill and the bar below.
                    //
                    // HOVER AND SELECTED SHARE THE FILL, BY NECESSITY. cream-100 on cream-50 is
                    // 1.05, so the cream ladder cannot encode rest, hover AND selected as three
                    // legible fills — a half-step hover would be ~1.02 and invisible. THE BAR IS
                    // WHAT SEPARATES THEM, at ~4:1, which is the same reason the fill is not the
                    // signal anywhere in this language. A hovered row is a preview of the
                    // selected fill without the bar.
                    className={[
                      // THE FILL MOVED BECAUSE THE GROUND DID, and the RELATION is what stayed.
                      // This rail used to sit on cream-50 and fill cream-100 — ground + 1 step.
                      // It sits on cream-200 now, so the fill is cream-300. Encoding the old hex
                      // would have been the fourth time in this arc a RELATION was frozen into a
                      // VALUE; the rule is unchanged and only the ground moved under it.
                      "flex w-full justify-between gap-2 border-b border-b-studio-ink-950/12 border-l-[3px] py-3 pl-[9px] text-left text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500",
                      s.meta ? "items-start" : "items-center",
                      onMoveItem ? "pr-[4.5rem]" : "pr-3",
                      isActive
                        ? "border-l-studio-accent-500 bg-studio-cream-300 font-medium text-studio-ink-950"
                        : "border-l-transparent hover:bg-studio-cream-300",
                    ].join(" ")}
                  >
                    {/* TWO SHAPES, AND THE ONE-LINE SHAPE IS UNTOUCHED. A row with no meta line
                        renders exactly the markup it always did, so the seven other consumers of
                        this shell are byte-identical.

                        THE NAME CLAMPS TO TWO LINES rather than truncating to one: the Experience
                        titles that need discriminating differ only in a TRAILING parenthetical,
                        and truncation eats the end first, so one clamped line would hide the only
                        part that distinguishes them.

                        13.5px, AND IT WENT 13.5 -> 13 -> 13.5, WHICH IS NOT A MISTAKE BEING
                        UNDONE. #241 measured the real column at the rail's then-width of 220px
                        (134px of content) and found the longest title needed THREE lines at 13.5
                        and exactly two at 13, so it shipped 13. The rail is 300px now — 276px of
                        content — and measured there EVERY title fits on ONE line at 13.5,
                        parentheticals included. The correction was right about a narrow rail and
                        wrong about a wide one, and the rail moving is what made it wrong.
                        The meta line keeps 11.5px, which is `BlogPostList` and `SectionsRail`.

                        The clamp stays as a guard for a title longer than today's data holds; on
                        current content it does not engage.

                        `items-start` in this shape so the badge sits against the FIRST line
                        rather than floating against the block's centre. */}
                    {s.meta ? (
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="min-w-0 text-[13.5px] leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                          {s.name}
                        </span>
                        {/* A VALUE BELONGS TO ITS GROUND — third instance, and this one was
                            found by the ground moving under it. `text-text-subtle` measures
                            5.52 / 5.25 / 4.78 on cream-50/100/200 but only **4.03 on the SELECTED
                            row's cream-300**, under the 4.5 floor. #232 met this exactly in
                            `BlogPostList` and `SectionsRail` and fixed it the same way; the meta
                            line here was fine on the old cream-100 fill and stopped being fine
                            the moment the rail became a cream-200 column. Selected rows take
                            ink-600 (5.41); everything else keeps the muted token. */}
                        <span className={`truncate text-[11.5px] ${isActive ? "text-studio-ink-600" : "text-studio-text-subtle"}`}>{s.meta}</span>
                        {/* THE BADGE IS BACK ON ITS OWN LINE, AND FOR THE SAME REASON THE SIZE
                            WENT BACK. #241 moved it beside the meta because at a 134px column it
                            was taking 66px from the one title that most needed the room. At 276px
                            it costs that title nothing — measured, the longest still fits on one
                            line with the badge below it — so it returns to where the contract
                            draws it, on its own line under the meta. */}
                        {s.badge && (
                          <span className="mt-1.5 inline-block w-fit rounded-full border border-studio-accent-500/30 bg-studio-accent-500/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-studio-accent-600">
                            {s.badge}
                          </span>
                        )}
                      </span>
                    ) : (
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{s.name}</span>
                      {s.badge && (
                        <span className="shrink-0 rounded-full bg-studio-accent-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-studio-accent-600">
                          {s.badge}
                        </span>
                      )}
                    </span>
                    )}
                    {isDirty && (
                      <span className="size-1.5 shrink-0 rounded-full bg-studio-accent-500" aria-hidden="true" />
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
            // ---- THE RAIL FOOTER (the contract's `.lf`) --------------------------------------
            //
            // Placed after the tab list; it is an action, not a tab, so it is Tab-reachable but
            // NOT part of the arrow-key cycle (which walks sections only). It lives inside the
            // role="tablist" nav, as the search row above it does.
            //
            // THE PINNING WAS ALREADY CORRECT AND STAYS THAT WAY BY STRUCTURE, NOT BY A RULE.
            // The row list is `flex-1` with its own `overflow-y-auto`, and this is its SIBLING in
            // a flex column — so the rows scroll inside their own box and this never moves.
            // Driven both ways before touching it: with the rows scrolled fully to the end the
            // button's bottom is unchanged. This is NOT #248's shape, and nothing here needed a
            // sticky rule; adding one would have been a fix for a bug that was not present.
            //
            // THE SEPARATOR IS THE REAL DEFECT, AND IT IS NOT THAT THE LINE WAS MISSING-LOOKING.
            // There was no footer rule at all. The only line near this edge was the LAST ROW's
            // own `border-b`, which coincides with the list's bottom edge ONLY when the rows
            // happen to be scrolled to the end — measured, it sat at the list edge scrolled-down
            // and 147px below it scrolled-up. So the rail appeared to have a footer rule exactly
            // when it did not need one, and lost it the moment anyone scrolled up. The rule
            // belongs to the FOOTER, which does not move.
            <div className="border-t border-studio-ink-950/12 px-3 py-[12.5px]">
              <button
                type="button"
                onClick={handleAdd}
                // `border-studio-ink-950/22` is the contract's `--rule-edge`, and it makes this the one
                // dashed add whose REST border differs from the other six (which are /15). That is
                // deliberate: those six sit inside a form on cream-100, this one is rail chrome on
                // cream-200 and needs the extra step to read against a darker ground. #246's hover
                // is unchanged and still shared by all seven — the uniformity that PR established
                // is the hover, not the rest border.
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-studio-ink-950/22 bg-studio-cream-50 text-[12px] font-semibold text-studio-ink-800 transition-colors hover:border-solid hover:border-studio-accent-500 hover:text-studio-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500 [&>svg]:size-3.5"
              >
                <IconPlus />
                {addItemLabel ?? "Add"}
              </button>
            </div>
          )}
        </nav>

        {/* Right detail pane */}
        <div
          id="ld-panel"
          ref={paneRef}
          role="tabpanel"
          tabIndex={-1}
          aria-labelledby={activeId ? `ld-tab-${activeId}` : undefined}
          // ---- THE PANEL SECTION MUST FILL THIS PANE, AND THAT IS WHY THE FIX IS HERE -------
          //
          // `position: sticky` is bounded by its CONTAINING BLOCK, not by the scrollport. A
          // panel's save bar is `sticky bottom-0` inside its own section element, and a section is
          // (that name is written without angle brackets ON PURPOSE — E6 and C2 derive the entry
          // panel set from RAW source, so a comment mentioning the tag enrols this file in both.
          // Third firing of the comment trap here, after #239's input/textarea and #240's pill.)
          // an ordinary block sized to its content — so when the content is SHORTER than this
          // pane, the bar pins to the section's bottom and floats in mid-air with cream below it.
          // Measured at 1440x820: 61px of float. At 1076x1054: 295px. BIGGER SCREEN, WORSE BUG.
          //
          // `lg:[&>section]:grow` gives every panel section the pane's own height when there is
          // free space, and changes nothing when there is not (no free space to distribute), so
          // a section that already overflows is untouched.
          //
          // GROWING THE SECTION IS NOT SUFFICIENT ON ITS OWN, and this is the half that is easy
          // to get wrong: a sticky element only OFFSETS from its static position when scrolling
          // would otherwise carry it out of the sticky region. With no overflow there is no
          // scrolling, so the bar stays exactly where flow put it — measured, the section filled
          // the pane at 755 and the bar still sat at 759 with 61px below it. The section must
          // therefore also be a flex COLUMN whose footer takes `mt-auto`, which consumes the free
          // space above the bar. `mt-auto` is inert when there is no free space, so the overflow
          // regime keeps behaving exactly as `sticky bottom-0` already made it behave.
          //
          // THIS SEAM IS GENUINELY SHARED, WHICH IS NOT THE USUAL FINDING HERE. Three times in
          // this arc a shared seam was the WRONG home because the change was true for pages that
          // never asked for it (#244's `AreaHeader`, #245's `ProjectsEditPanel` fallback, and the
          // E1 ground assertion). This is the opposite: all five consumers want their section to
          // fill the pane, and About and Process look unchanged only because they already
          // overflow. Same fix, same intent, five consumers — so it belongs at the seam.
          className={`${selectedId === null ? "hidden" : "flex"} min-h-0 flex-1 flex-col outline-none lg:flex lg:overflow-y-auto lg:bg-studio-cream-100 lg:[&>section]:flex lg:[&>section]:grow lg:[&>section]:flex-col lg:[&>section>footer]:mt-auto`}
        >
          <button
            type="button"
            onClick={back}
            className="mb-3 inline-flex items-center gap-1 text-[14px] text-studio-accent-600 lg:hidden"
          >
            ← All sections
          </button>
          {children}
          {/* A DOCUMENT-LEVEL BAR FOR THE DETAIL COLUMN, and only Skills passes one.
              ⚠ IT EXISTS SO A BAR CAN BE COLUMN-WIDTH WITHOUT SPANNING THE RAIL. Skills' save
              was a sibling of this whole layout, so it ran the full width of the page and sat
              under the 300px list — measured 1342px at a 1600px viewport, against Experience's
              1042. Experience looks right because its bar is inside its own panel section, which
              is inside this column; Skills has no per-entry panel to put one in, because one
              `useDraftForm` holds every category and `buildCommitted` posts them together.
              So the slot is HERE rather than in the panels: rendering it per panel would give N
              bars for a single document save, which is #229's point and still holds.
              A CHILD OF THE SCROLLER, NOT A SIBLING — the same arrangement the five entry
              panels' footers already use, `sticky bottom-0` for the overflow regime and
              `mt-auto` for the underflow one. See mount-discipline B4.
              ⚠ BELOW `lg` IT FOLLOWS THIS COLUMN, so with nothing selected the bar is off screen
              where it used to be on. That is what the five entry panels have always done, so
              Skills now matches them rather than being the exception. */}
          {footer}
        </div>
      </div>
    </ListDetailContext.Provider>
  );
}
