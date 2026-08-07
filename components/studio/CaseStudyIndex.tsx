"use client";

// The case-study index — the agreed flow's step 1 (docs/studio/case-study-nav-final.html).
//
// Replaces the list-detail layout, where a rail of all four studies sat beside the
// editor and ate the width the canvas needs to render a page faithfully. Here the
// list IS the page; editing happens at /studio/projects/<slug> with the full width.
//
// This screen owns the LIST operations — order, add, remove — so the editor can be
// purely about one study. Reuses the proven add/delete routes and the reorder hook
// rather than reimplementing any of it.
//
// ---- TWO VIEWS, BECAUSE THE PAGE ANSWERS TWO QUESTIONS -------------------------------------
//
// GRID answers "what do they look like" and LIST answers "what order are they in". They are two
// presentations of THE SAME CONTENT, which is what decides the control: correction 20's rule is
// role by shape, and same-content-two-presentations is a GROUP — so `role="group"` with
// `aria-pressed` and the accent FILL, the same language as Board|Editor. A tablist would claim
// these are two different panels of content, which they are not.
// The two item renderers live in their own files so neither view's markup sits inside the
// other's branch, and everything they share is in `CaseStudyItem.tsx`.
//
// THE VIEW IS SERVER-KNOWN. `initialView` arrives already resolved from the cookie, so the first
// HTML is the right view and there is no hydration correction to animate away — see
// `lib/studio/index-view.ts` for why that rules out localStorage.
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectListItem } from "@/lib/keystatic";
import { indexViewCookie, type IndexView } from "@/lib/studio/index-view";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListReorder } from "./useListReorder";
import { inputCls, FieldKey} from "./blocks/fields";
import { StudioModal, modalGhostBtn, modalAccentBtn, modalInkBtn } from "./StudioModal";
import AreaHeader from "./AreaHeader";
import SegmentedGroup from "./SegmentedGroup";
import CaseStudyCard from "./CaseStudyCard";
import CaseStudyRow from "./CaseStudyRow";
import { IconGrid, IconInfo, IconList, IconPlus } from "./icons";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid", icon: <IconGrid /> },
  { value: "list" as const, label: "List", icon: <IconList /> },
];

export default function CaseStudyIndex({
  entries,
  initialView,
}: {
  entries: ProjectListItem[];
  initialView: IndexView;
}) {
  const router = useRouter();
  const { setUnpublished } = usePublishSignal();
  // Optimistic list, same pattern the previous editor used: a create or delete shows
  // immediately and router.refresh() reconciles against the server overlay.
  const [items, setItems] = useState(entries);

  // SEEDED FROM THE SERVER, PERSISTED ON CHANGE. The cookie is written here rather than in an
  // effect, because an effect would fire on mount too and rewrite the value the server just
  // read. One year, SameSite=Lax, not httpOnly — a UI preference on a single-owner tool, the
  // same terms `SidebarWidthProvider` sets for the same kind of value.
  const [view, setView] = useState<IndexView>(initialView);
  function chooseView(next: IndexView) {
    setView(next);
    document.cookie = `${indexViewCookie("projects")}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  /* ---- SEARCH IS LOCAL AND INLINE, WHICH IS THE RULE THIS PROJECT ALREADY WROTE DOWN --------
   * `SectionsRail` states it: `blog-search.ts` is a lib module because the blog INDEX and the
   * blog RAIL both needed the same filter, and generalising at the FIRST consumer is the thing
   * ThreePaneShell was held back from. Only this page searches studies, so the filter stays here
   * until something else needs it.
   * MATCHES TITLE OR SUMMARY, the two fields a study is recognised by. An empty query returns the
   * list unfiltered — a search box narrows a list the author already owns, so it fails OPEN. The
   * blog's `status` fails closed because it governs whether a post exists publicly; these are
   * different kinds of filter and the difference is deliberate. */
  /* ⚠ REORDER LOCKS WHILE A SEARCH IS ACTIVE, AND THAT IS THE POINT OF THE FLAG.
   * `moveItem` swaps a study with its neighbour in the FULL list. Filtered, that neighbour is
   * usually not on screen — so pressing ▼ would commit a real move whose only visible effect is
   * nothing at all, and pressing it twice would silently move a study two places. A control that
   * appears to do nothing while quietly changing the homepage order is worse than a disabled one,
   * so the arrows disable and the subline says how to get them back. */
  const [query, setQuery] = useState("");
  const filtering = query.trim() !== "";
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return items;
    return items.filter(
      (p) => p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)
    );
  }, [items, query]);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [banner, setBanner] = useState("");

  // Initial-focus targets — StudioModal focuses these on open (the add input, the
  // delete Cancel), replacing the old autoFocus attributes.
  const addTitleRef = useRef<HTMLInputElement>(null);
  const delCancelRef = useRef<HTMLButtonElement>(null);

  const { moveItem, reorderBusy, reorderError } = useListReorder({
    collection: "projects",
    items,
    setItems,
  });
  useReportPending(addBusy || deleteBusy || reorderBusy);

  async function createStudy() {
    const name = title.trim();
    if (!name) return;
    setAddBusy(true);
    setAddError("");
    try {
      const res = await fetch("/api/studio/create-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "projects", input: { title: name } }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        setUnpublished(true);
        setAddOpen(false);
        setTitle("");
        // Straight into the new study — creating one is always followed by writing it.
        router.push(`/studio/projects/${json.slug}`);
        return;
      }
      if (res.ok && json.mode === "fs") {
        setAddOpen(false);
        setTitle("");
        setBanner("Add needs github mode (dev).");
        return;
      }
      setAddError(
        res.status === 409
          ? "Too many case studies with that name. Give this one a different name."
          : res.status === 400
            ? "Use a title with letters or numbers."
            : "Could not add it. Try again."
      );
    } catch {
      setAddError("Could not add it. Try again.");
    } finally {
      setAddBusy(false);
    }
  }

  async function confirmDelete() {
    const slug = deleteTarget;
    if (!slug) return;
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/studio/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "projects", slug }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        setItems((prev) => prev.filter((p) => p.slug !== slug));
        setUnpublished(true);
        router.refresh();
      } else if (res.ok && json.mode === "fs") {
        setBanner("Remove needs github mode (dev).");
      } else {
        setBanner("Could not remove it. Try again.");
      }
    } catch {
      setBanner("Could not remove it. Try again.");
    } finally {
      setDeleteBusy(false);
      setDeleteTarget(null);
    }
  }

  const targetTitle = items.find((p) => p.slug === deleteTarget)?.title ?? "";

  return (
    <div className="flex flex-col gap-4">
      {/* ---- THE HEAD ROW — TITLE AND CONTROLS ON ONE LEVEL -----------------------------------
          The search, the switcher and Add sit on the SAME LINE as "Case studies" rather than in a
          band beneath it. Two rows of chrome above a grid of cards reads as two headers, and the
          second one was carrying a sentence that is not a control.
          `AreaHeader` IS RENDERED HERE, NOT BY THE ROUTE, and that is what makes the row possible:
          the controls need client state, the title does not, and one flex row cannot span a server
          and a client component. `AreaHeader` is presentational with no hooks, so a client parent
          renders it unchanged — and #244's rule still holds, since nothing here caps it. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <AreaHeader title="Case studies" sub="Pick one to edit its details and sections." />
        {/* `shrink-0` ON THE CLUSTER AND `whitespace-nowrap` ON THE BUTTON, and both are needed.
            Without them the flex children contract before the row wraps, and at full width the
            Add button collapsed to a three-line column reading "Add / case / study" — the label
            broke rather than the layout, which is the failure mode that does not look like one.
            (The word above is "contract" rather than the obvious one because the obvious one is
            itself a utility, and naming it here would emit a rule — #274's trap, on the PR that
            built the gate for it.) */}
        <div className="flex shrink-0 items-center gap-2.5">
          <SegmentedGroup
            options={VIEW_OPTIONS}
            value={view}
            onChange={chooseView}
            ariaLabel="View"
          />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500 px-3.5 py-2 text-[14px] font-medium text-studio-cream-50 transition-colors hover:bg-studio-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> Add case study
          </button>
        </div>
      </div>

      {/* ---- THE STATE OF THE LIST, IN AN INFORMATION STRIP ------------------------------------
          This sentence is not a control and it was sitting in the control band, where it read as
          a label for the buttons beside it. It is a STATUS — how many studies there are, what
          their order means, and while filtering, why the arrows are off — so it takes the strip
          the studio already uses for exactly that.
          THE SAME STRIP AS #264's LIVE-PREVIEW NOTE, not a second flavour of one: `border-ink-950/12`
          + the cream-100 ground + the control radius, with `IconInfo` at the same size and inset. A new
          strip shape here would be the third, and the studio keeps its left accent bars for
          selection markers.
          `aria-live` BECAUSE THE TEXT CHANGES UNDER THE AUTHOR. Typing in the search rewrites it
          from a count to a result count plus the reason the arrows went quiet, and a status that
          only sighted users receive is the half-fix. */}
      <div className="flex flex-wrap items-stretch gap-2.5">
      {/* THE SEARCH SITS ON THE LEFT, BESIDE THE STATUS IT DRIVES, NOT IN THE HEAD CLUSTER.
          Search, view and Add in one group put three unrelated jobs shoulder to shoulder — a
          FILTER, a PRESENTATION and a WRITE — and the row read as a toolbar of equals. The view
          switcher and Add belong to the page, so they stay with the title; the search belongs to
          the list, so it comes down to the list and takes the left edge.
          BESIDE THE STRIP RATHER THAN ABOVE IT, because the strip is the ANSWER: type here and the
          sentence to the right becomes "2 of 4 studies". Stacking them would put a row of chrome
          between the question and its reply. */}
      {/* THE WIDTH IS STATED ON A WRAPPER, NOT ADDED TO `inputCls`. That constant already carries
          `w-full`, and two width utilities on one element are decided by their order in the
          GENERATED sheet rather than in the class string — so `w-[220px]` next to it is a coin
          flip, and here it lost: the field took the whole row and pushed the strip below it.
          Sizing the box and letting the input fill it is the same lesson as the reorder cluster,
          one element up. */}
      <div className="w-[220px] min-w-0 flex-none">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search case studies"
          aria-label="Search case studies"
          className={inputCls}
        />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-100 px-3 py-2.5 text-[12px] leading-relaxed text-studio-ink-600"
      >
        <IconInfo className="mt-[3px] h-3.5 w-3.5 flex-none text-studio-ink-400" />
        <span>
          {filtering ? (
            <>
              <strong className="font-semibold text-studio-ink-950">
                {shown.length} of {items.length} {items.length === 1 ? "study" : "studies"}.
              </strong>{" "}
              Clear the search to change the order.
            </>
          ) : (
            <>
              <strong className="font-semibold text-studio-ink-950">
                {items.length} {items.length === 1 ? "study" : "studies"},
              </strong>{" "}
              in the order they appear on your homepage.
              {view === "list" ? " Use the arrows to change it." : ""}
            </>
          )}
        </span>
      </div>
      </div>

      {/* One slot, two sources. Reorder errors win because they belong to the action
          you just took; a banner is cleared when a new action starts, so a stale
          message can never sit on top of a fresh one. */}
      {(reorderError || banner) && (
        <p className="text-[12px] text-studio-accent-600" role="status" aria-live="polite">
          {reorderError || banner}
        </p>
      )}

      {/* ---- TWO ZERO STATES, NOT ONE, AND #271 IS WHY --------------------------------------
          "No case studies match that search" answered three different questions in the sections
          rail until #271 separated them: none exist, none match, none at all. The same trap is
          available here the moment a search box arrives, so the two states are split at the
          source rather than after someone reports it. */}
      {shown.length === 0 ? (
        <div className="grid min-h-[30vh] place-items-center rounded-[var(--studio-radius-card,8px)] bg-studio-cream-100 px-4 py-10 text-center">
          {items.length === 0 ? (
            <p className="text-[13px] text-studio-text-subtle">
              No case studies yet. Add one to get started.
            </p>
          ) : (
            <p className="text-[13px] text-studio-text-subtle">
              No case studies match <b className="text-studio-ink-950">{query.trim()}</b>.
            </p>
          )}
        </div>
      ) : view === "grid" ? (
        /* THE WELL. cream-100 under cream-50 cards, because a card on the same ground as the
           page has nothing to lift off — see CaseStudyCard for the ladder.
           FLUID COLUMNS, NOT A BREAKPOINT LADDER, the Board's answer to the same question: a
           272px floor fits as many columns as the width allows and degrades to one without a
           single media query. It is what lets this page take the full width without a ladder. */
        <div className="grid gap-4 rounded-[var(--studio-radius-card,8px)] bg-studio-cream-100 p-4 [grid-template-columns:repeat(auto-fill,minmax(272px,1fr))]">
          {shown.map((p) => {
            /* ⚠ THE POSITION COMES FROM THE FULL LIST, NEVER FROM THE FILTERED ONE. The ordinal
               and the disabled ends both describe where a study sits in the HOMEPAGE ORDER, and
               a filtered view renumbering 1..n would state a rank that does not exist. */
            const at = items.findIndex((x) => x.slug === p.slug);
            return (
              <CaseStudyCard
                key={p.slug}
                item={p}
                index={at}
                total={items.length}
                busy={reorderBusy || filtering}
                onOpen={() => router.push(`/studio/projects/${p.slug}`)}
                onMove={(direction) => {
                  setBanner(""); // a stale banner would mask this action's own error
                  moveItem(p.slug, direction);
                }}
              />
            );
          })}
          {/* The add tile sits where the next card would appear. It opens the same dialog as
              the head button — one action, two doors, which is not #200's defect: that was two
              buttons with DIFFERENT labels disagreeing about scope. These say the same words
              and do the same thing.
              HIDDEN WHILE FILTERING, because a search result set is an ANSWER and a create
              affordance inside it reads as one of the results. The head button never moves. */}
          {!filtering && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="grid min-h-[180px] place-items-center rounded-[var(--studio-radius-card,8px)] border border-dashed border-studio-ink-950/22 text-[12px] font-semibold text-studio-ink-800 transition-[color,border-color,background-color] duration-[var(--studio-lift-t,200ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] hover:border-solid hover:border-studio-accent-500 hover:bg-studio-cream-50 hover:text-studio-accent-600"
            >
              + Add case study
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {shown.map((p) => {
            const at = items.findIndex((x) => x.slug === p.slug);
            return (
              <CaseStudyRow
                key={p.slug}
                item={p}
                index={at}
                total={items.length}
                ordinal={String(at + 1).padStart(2, "0")}
                busy={reorderBusy || filtering}
                onOpen={() => router.push(`/studio/projects/${p.slug}`)}
                onMove={(direction) => {
                  setBanner("");
                  moveItem(p.slug, direction);
                }}
                onRemove={() => setDeleteTarget(p.slug)}
              />
            );
          })}
        </div>
      )}

      {addOpen && (
        <StudioModal
          role="dialog"
          title="Add case study"
          describedById="add-cs-desc"
          onClose={() => setAddOpen(false)}
          busy={addBusy}
          initialFocusRef={addTitleRef}
        >
          <label className="mt-3 flex flex-col gap-1.5">
            <FieldKey>Title</FieldKey>
            <input
              ref={addTitleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <p id="add-cs-desc" className="mt-1 text-[12px] text-studio-text-subtle">
            The title is the case study&rsquo;s identity and can&rsquo;t be changed here later. It
            starts as a stub, added to the end of the list. Use the arrows to move it.
          </p>
          {addError && (
            <p className="mt-2 text-[12px] text-studio-accent-600" aria-live="polite">
              {addError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAddOpen(false)} className={modalGhostBtn}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void createStudy()}
              disabled={addBusy || !title.trim()}
              className={modalAccentBtn}
            >
              {addBusy ? "Adding…" : "Add"}
            </button>
          </div>
        </StudioModal>
      )}

      {deleteTarget && (
        <StudioModal
          role="alertdialog"
          title="Remove case study"
          describedById="del-cs-msg"
          onClose={() => setDeleteTarget(null)}
          busy={deleteBusy}
          initialFocusRef={delCancelRef}
        >
          <p id="del-cs-msg" className="text-[14px]">
            Remove <b>{targetTitle}</b> from your draft? You can still undo it with Discard
            until you publish.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button ref={delCancelRef} type="button" onClick={() => setDeleteTarget(null)} className={modalGhostBtn}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteBusy}
              className={modalInkBtn}
            >
              {deleteBusy ? "Removing…" : "Remove"}
            </button>
          </div>
        </StudioModal>
      )}
    </div>
  );
}
