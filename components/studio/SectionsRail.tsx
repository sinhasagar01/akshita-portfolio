"use client";

// The case-study editor's list pane — Details, then the sections.
//
// MODELLED ON BlogPostList, AND THE DIFFERENCES ARE THE DECISIONS.
//
// NAVIGATE + REORDER + STATUS, AND NOT ADD OR REMOVE. BlogPostList is navigate-only because
// create and delete are WRITE surfaces and CLAUDE.md wants an explicit decision before a second
// one exists — rebuilding them in a rail would be the `[slug]/body` failure in miniature. The
// same rule sorts this rail's four candidates three different ways:
//
//   REORDER   moves HERE, and only here. Order is a property of the LIST, so it belongs where
//             the list is. It previously existed in TWO places — the board cards and the
//             inspector's section header — both calling `moveSection`, and nobody noticed. Two
//             surfaces for one operation is precisely how they drift apart, so this is one
//             implementation replacing two rather than a third being added.
//   STATUS    the publish gate's "needs an image" is a READ, so it comes here as a marker on the
//             row — the same shape as BlogPostList's published/draft dot. It means you see which
//             sections need work WHILE NAVIGATING, where today it is visible only on a surface
//             you have to switch to.
//   ADD       stays on the Board. It is a write, and the Board is already its one implementation.
//   REMOVE    stays in the inspector, with its confirm. Also a write, and — corrected during the
//             re-derivation — it was never on the Board, so moving it here would be a migration
//             wearing a keep's clothes.
//
// SEARCH IS LOCAL AND INLINE, NOT A lib MODULE YET. `blog-search.ts` exists because the blog
// INDEX and the blog RAIL both needed it; here only this rail does, so a lib module would be
// generalising at the first consumer — the same rule ThreePaneShell itself was held to. Sections
// carry an eyebrow AND a title, so there are two fields to match and "the one about personas" is
// a real lookup. The state being LOCAL is also why the shell collapses this pane by width
// transition rather than unmounting it.
//
// SELECTION IS A PROP, NOT LOCAL STATE. The panel owns `selection` because the canvas and the
// inspector read it too; a rail with its own copy is a second source of truth for one answer.
import { useMemo, useState } from "react";
import type { RawSection } from "@/lib/case-studies/sections-raw";
import { sectionDisplayLabel } from "@/lib/case-studies/section-label";
import { IconChevronUp, IconChevronDown } from "./icons";
import { inputCls, labelCls } from "./blocks/fields";

/** What the rail is pointing at. `"details"` is the pinned first entry; a string is a section id. */
export type RailSelection = "details" | string;

const rowBase =
  "group relative flex w-full items-start gap-2 border-b border-b-ink-950/12 border-l-[3px] py-2.5 pl-[9px] pr-2 text-left transition-colors";

export default function SectionsRail({
  sections,
  sectionIds,
  selection,
  onSelect,
  onMove,
  needsImage,
  detailsDirty,
  bespoke,
}: {
  sections: readonly RawSection[];
  /** Stable ids, parallel to `sections` — the same array the panel keys everything from. */
  sectionIds: readonly string[];
  selection: RailSelection;
  onSelect: (next: RailSelection) => void;
  /** Reorder. The panel's `moveSection`, which routes through `structural()` so `sections` and
   *  `ids` stay in lockstep — the rail never reorders anything itself. */
  onMove: (index: number, dir: -1 | 1) => void;
  /** The publish gate's per-section flag, computed by the panel so this rail stays presentational. */
  needsImage: (section: RawSection) => boolean;
  detailsDirty: boolean;
  /** A hand-built study has no sections and cannot gain any. The rail then holds ONE item and has
   *  to SAY it holds one — see the zero state below, which is the whole of hazard 29. */
  bespoke?: boolean;
}) {
  const [query, setQuery] = useState("");

  // Matches the eyebrow AND the title, because a section is found by either. Trimmed and
  // case-insensitive, mirroring filterBlogPosts' shape without importing it.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = sections.map((s, i) => ({ s, i, id: sectionIds[i] }));
    if (!q) return rows;
    return rows.filter(
      ({ s, i }) =>
        sectionDisplayLabel({ title: s.title, eyebrow: s.eyebrow, id: s.id }, i).toLowerCase().includes(q) ||
        (s.eyebrow ?? "").toLowerCase().includes(q)
    );
  }, [sections, sectionIds, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-none border-b border-ink-950/12 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sections"
          aria-label="Search sections"
          className={`${inputCls} min-w-0`}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* DETAILS IS THE RAIL'S FIRST ENTRY, pinned above the sections and separated by a rule.
            Selecting it puts title, hero, summary, type, platform, template and category in the
            inspector — which is what removes the old top strip and its inline expansion together,
            and what makes ONE navigator reach everything. */}
        <button
          type="button"
          onClick={() => onSelect("details")}
          aria-current={selection === "details" ? "true" : undefined}
          className={`${rowBase} ${
            selection === "details"
              ? "border-l-accent-500 bg-cream-300"
              : "border-l-transparent hover:bg-cream-100"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-ink-950">Details</span>
            {/* A VALUE BELONGS TO ITS GROUND. `text-text-subtle` measures 5.52/5.25/4.78 on
                cream-50/100/200 but only 4.03 on the SELECTED row's cream-300 — below the 4.5 AA
                floor. The selected row is a different ground, so it takes a different value. */}
            <span className={`mt-0.5 block truncate text-[11.5px] ${selection === "details" ? "text-ink-600" : "text-text-subtle"}`}>
              Title, hero, summary, type, platform
            </span>
          </span>
          {detailsDirty && (
            <span
              aria-hidden
              title="Unsaved changes"
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-500"
            />
          )}
        </button>

        <p className={`${labelCls} px-3 pb-1 pt-3`}>
          {bespoke ? "Sections \u00b7 none" : `Sections \u00b7 ${sections.length}`}
        </p>

        {/* AN EMPTY LIST UNDER A COUNT HEADING IS WHAT A BROKEN FETCH LOOKS LIKE, and that is the
            whole of hazard 29 — boat-crest is the first slug alphabetically and the canonical
            example in this repo, so it is the natural thing to reach for, and reaching for it
            returned a page that read as a broken editor rather than a different kind of study.
            THREE ZERO STATES, NOT ONE, because "none exist", "none match" and "none at all" are
            three different facts and the old copy answered all three with the search one. A rail
            reading "No sections match that search" when there is no search is the hazard restated
            in new words, and it was reachable on any empty study, not just this one. */}
        {bespoke ? (
          <div className="mx-3 mb-3 mt-1 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-100 px-3 py-3">
            <p className="text-[12.5px] font-medium text-ink-950">Hand-built case study</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-600">
              This study&rsquo;s sections and its work-filter category are set in code, not here.
              Nothing failed to load — there is nothing to load. The details above stay editable.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-text-subtle">
            {sections.length === 0
              ? "No sections yet. Add one from the Board."
              : "No sections match that search."}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {shown.map(({ s, i, id }) => {
              const current = selection === id;
              const label = sectionDisplayLabel({ title: s.title, eyebrow: s.eyebrow, id: s.id }, i);
              const count = s.blocks?.length ?? 0;
              const flag = needsImage(s);
              return (
                <li key={id} className="relative">
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    aria-current={current ? "true" : undefined}
                    className={`${rowBase} ${
                      current
                        ? "border-l-accent-500 bg-cream-300"
                        : "border-l-transparent hover:bg-cream-100"
                    }`}
                  >
                    {/* The needs-an-image marker. A dot, not the board's pill: at rail width a
                        pill would truncate the title it sits beside, and the row already has a
                        place for a status glyph — BlogPostList's. */}
                    <span
                      aria-hidden
                      title={flag ? "Needs an image" : undefined}
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        flag ? "bg-accent-500" : "bg-transparent"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      {s.eyebrow ? (
                        <span className="block truncate text-[10px] uppercase tracking-eyebrow text-ink-600">
                          {s.eyebrow}
                        </span>
                      ) : null}
                      <span className="block truncate text-[13.5px] font-medium text-ink-950">
                        {label}
                      </span>
                      <span className={`mt-0.5 block truncate text-[11.5px] ${current ? "text-ink-600" : "text-text-subtle"}`}>
                        {count === 1 ? "1 block" : `${count} blocks`}
                        {flag ? " · needs an image" : ""}
                      </span>
                    </span>
                  </button>

                  {/* REORDER. Siblings of the row button, never nested inside it — a button
                      inside a button is an invalid content model and the inner one stops
                      receiving clicks. Same reason the board card puts its arrows beside the
                      full-card overlay rather than within it. */}
                  <span className="absolute right-1.5 top-1.5 flex flex-col opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onMove(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move section ${label} up`}
                      className="grid size-5 place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors enabled:hover:text-ink-950 disabled:opacity-25 [&>svg]:size-3"
                    >
                      <IconChevronUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(i, 1)}
                      disabled={i === sections.length - 1}
                      aria-label={`Move section ${label} down`}
                      className="grid size-5 place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors enabled:hover:text-ink-950 disabled:opacity-25 [&>svg]:size-3"
                    >
                      <IconChevronDown />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
