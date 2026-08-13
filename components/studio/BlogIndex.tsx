"use client";

// BS-3c — the blog index. Create, delete and browse every post. Mirrors CaseStudyIndex.
//
// THE OWNER REVERSED #174'S DECISION AND THE EDITOR IS NOW THREE-PANE. This file used to
// argue that the editor should have no list rail at all. That argument is kept below rather
// than deleted, because deleting the reasoning behind a reversed decision is exactly how the
// `[slug]/body` drift began — a surface nobody could reach kept collecting fixes while the
// codebase carried two contradictory rationales and no record of which had won.
//
// WHAT WAS ARGUED, and it was argued honestly:
//   1. ListDetailLayout is a fixed two-column grid (220px beside 1fr, at lg) with no
//      third column and no collapse control, so "the existing ListDetailLayout with a
//      third column" is a modification to a shell eight panels share, not a reuse.
//   2. THE STUDIO ALREADY REMOVED THIS PATTERN. The case-study editor used to be a detail
//      pane beside a list, and it was deleted because "that rail cost most of the
//      horizontal room the canvas needs to render a page faithfully". The contract's
//      collapse control was judged a mitigation for exactly the problem that caused the
//      removal, so having no rail at all was judged to deliver what it reached for.
//
// WHY THAT NO LONGER DECIDES IT. Point 1 is still true and is why the three-pane editor
// does NOT use ListDetailLayout — it has its own shell in ThreePaneShell, and that shell is
// blog-specific until a second consumer teaches us what varies. Point 2 rested on an
// arithmetic claim that turned out to be false. The rail was believed to cost the canvas
// its measure, and the measure is 68ch, which resolves to 745.9px against the wrapper's
// 16px font. Sidebar 236 plus list 264 plus canvas 794 plus inspector 244 was 1538px, and
// the laptop this is authored on is 1536 wide. The rail did not cost the canvas anything it
// needed, so the objection the removal rested on did not apply here. The owner weighed that
// and chose the rail.
//
// THAT ARITHMETIC CHANGED IN #194 AND THE CONCLUSION CHANGED WITH IT — recorded rather than
// silently renumbered, because the sentence above is the whole reason the rail exists. The
// inspector went 244 -> 320, so the sum is now 1614. On a 1536 laptop with the list OPEN the
// canvas gets 1536 - 236 - 264 - 320 = 716px against the 794 it needs, and the column drops
// under its measure (676.736px under Work Sans; the 697.93 often quoted is the DM Sans figure). So the rail DOES now cost the canvas something it needs,
// below 1614 and only when the author opens it explicitly — by default the list collapses
// there and the measure holds. The decision stands; its justification is narrower than it
// was. See lib/studio/three-pane.ts for the full arithmetic.
//
// THIS PAGE REMAINS THE ONLY PLACE POSTS ARE CREATED AND DELETED. The editor's list pane
// searches and navigates and does nothing else, so those two write operations keep one
// implementation each.
//
// NO REORDER. Blog has no orderIndex — posts order by `date`, edited in the post's own
// inspector — and commitCollectionOrder refuses an order-less collection at the lib
// boundary (#173). A reorder control here would be a lie.
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StudioModal, modalGhostBtn, modalAccentBtn, modalInkBtn } from "./StudioModal";
import { useReportCount } from "./StudioCountsProvider";
import { usePublishSignal } from "./PublishProvider";
import StudioEmptyState from "./StudioEmptyState";
import { IconPlus } from "./icons";
import { filterBlogPosts } from "@/lib/studio/blog-search";
import type { BlogCard } from "@/lib/keystatic";
import { inputCls } from "./blocks/fields";
import AreaHeader from "./AreaHeader";
import SegmentedGroup from "./SegmentedGroup";
import BlogPostCard from "./BlogPostCard";
import BlogPostRow from "./BlogPostRow";
import BlogStatusTabs, { type StatusFilter } from "./BlogStatusTabs";
import { isPublished } from "./BlogStatusChip";
import { indexViewCookie, type IndexView } from "@/lib/studio/index-view";
import { IconGrid, IconInfo, IconList } from "./icons";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid", icon: <IconGrid /> },
  { value: "list" as const, label: "List", icon: <IconList /> },
];

/** The tabs control this element, and a tablist that names no panel is decoration. */
const PANEL_ID = "blog-post-panel";

export default function BlogIndex({
  posts,
  initialView,
}: {
  posts: BlogCard[];
  initialView: IndexView;
}) {
  const router = useRouter();
  /* See the note at the delete below — this index never marked the site unpublished. */
  const { setUnpublished } = usePublishSignal();
  const [items, setItems] = useState<BlogCard[]>(posts);
  const [query, setQuery] = useState("");

  // SEEDED FROM THE SERVER, PERSISTED ON CHANGE — #237's mechanism, so the first HTML is the
  // right view and there is nothing for hydration to correct.
  const [view, setView] = useState<IndexView>(initialView);
  function chooseView(next: IndexView) {
    setView(next);
    document.cookie = `${indexViewCookie("blog")}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  /* ⚠ THE STATUS FILTER IS DELIBERATELY NOT REMEMBERED, and that asymmetry is the point.
   * The VIEW is a preference — how you like to look at a list — and it is safe to restore.
   * The FILTER is a transient question about right now. An author who filtered to Drafts last
   * week and returns to a page showing one post out of four would read it as posts MISSING, not
   * as a filter still applied. So it resets to "all" on every load and lives only in state. */
  const [status, setStatus] = useState<StatusFilter>("all");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useReportCount("blog", items.length);

  // The filter moved to lib/studio/blog-search.ts when the three-pane list pane needed the
  // same behaviour. Same function, not a second copy — two search filters is how the index
  // and the rail start disagreeing about which posts exist.
  const searched = useMemo(() => filterBlogPosts(items, query), [items, query]);
  const shown = useMemo(
    () =>
      status === "all"
        ? searched
        : searched.filter((p) => (status === "published" ? isPublished(p.status) : !isPublished(p.status))),
    [searched, status]
  );

  /* ---- THE TABLIST IS ALWAYS PRESENT ---------------------------------------------------------
   *
   * ⚠ THIS REVERSES A LOCKED DECISION, AND THE ORIGINAL REASONING STAYS RATHER THAN BEING
   * DELETED — the standing rule this file already follows for its own reversed layout decision,
   * because a reversal whose reasoning is deleted leaves two contradictory rationales and no
   * record of which won.
   *
   * WHAT IT SHIPPED AS, AND WHY. STATE held "Empty blog status -> HIDDEN", and #276 implemented
   * it as hiding the WHOLE strip: with zero drafts, "All" and "Published" show an identical set,
   * so all three tabs are inert rather than just "Drafts", and a control that cannot do anything
   * is the shape this project has deleted four times.
   *
   * WHY THE OWNER OVERRULED IT. That argument is about the tabs as CONTROLS and misses what they
   * also are: a READOUT. "Drafts 0" is not a dead button, it is the answer to "is anything
   * unpublished?" — and it answers WITHOUT a click, every time the page loads. Hiding the strip
   * makes that answer available only by noticing an absence, which is the one thing an author
   * cannot notice. The count is the feature; the filtering is what you do after reading it.
   * So the strip is unconditional, "Drafts" sits at 0, and choosing it lands on an empty state
   * that says so in words.
   *
   * THE COUNTS STILL FOLLOW THE SEARCH, so a tab never promises posts the search already
   * excluded — that half was right and is unchanged. */
  const counts: Record<StatusFilter, number> = useMemo(
    () => ({
      all: searched.length,
      published: searched.filter((p) => isPublished(p.status)).length,
      draft: searched.filter((p) => !isPublished(p.status)).length,
    }),
    [searched]
  );

  // CAPTURE-THEN-CREATE, identical to Experience and Projects: title only, the slug is
  // DERIVED SERVER-SIDE and echoed back, the entry is created immediately, then straight
  // into the editor. Never a blank-row append.
  async function create() {
    const name = title.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/create-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "blog", input: { title: name } }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.saved && json.slug) {
        /* ⚠ BEFORE THE PUSH, NOT AFTER — the navigation is not a refresh. `CaseStudyIndex`
           has always done this and is the only reason case studies flip; gallery and blog
           both shipped without it, so it was two collections rather than one. */
        setUnpublished(true);
        router.push(`/studio/blog/${json.slug}`);
        return;
      }
      if (res.ok && json.mode === "fs") {
        setError("Creating a post needs github mode (dev).");
        return;
      }
      setError(
        json?.error?.code === "invalid_slug"
          ? "Use a title with letters or numbers."
          : json?.error?.code === "slug_taken"
            ? "A post with that title already exists."
            : "Could not create the post. Try again."
      );
    } catch {
      setError("Could not create the post. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    const slug = deleteTarget;
    if (!slug || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/studio/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "blog", slug }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.saved) {
        setItems((prev) => prev.filter((p) => p.slug !== slug));
      /* ⚠ THE SITE IS NOW UNPUBLISHED, AND NOTHING SAID SO — A SHARED DEFECT GALLERY SURFACED.
         `CaseStudyIndex` and `ExperienceListEditor` both mark this; this index and the blog's did
         not, so after a delete the publish pill kept its PAGE-LOAD value and an author could not
         publish a removal that had already happened on the draft branch.

         ⚠ AND THE COMMENT THAT USED TO SIT HERE CAUSED A SECOND DEFECT, WHICH IS WHY IT IS QUOTED
         RATHER THAN DELETED. It read: "a create navigates straight to the new entry, so the bar is
         re-rendered from fresh server data and the stale flag is never seen." EVERY CLAUSE IS
         FALSE, and it was written as the REASON NOT TO ADD THE CALL TO CREATE — so create shipped
         without one and an owner found it at a browser.

         `PublishProvider` seeds `useState(initialDiffers)` ONCE AT MOUNT and never re-seeds from
         props; `initialDiffers` is read in the (dashboard) LAYOUT, and a layout does not re-render
         on a client navigation inside its own segment. A push from the index to the editor stays
         inside that segment, so the provider never remounts and the navigation refreshes nothing.

         ⚠ A COMMENT THAT JUSTIFIES AN OMISSION IS THE MOST DANGEROUS KIND, because it closes the
         question for every later reader including the one who wrote it. Nothing re-derives a
         reason. */
        setUnpublished(true);
        setDeleteTarget(null);
      }
    } finally {
      setBusy(false);
    }
  }

  const targetTitle = items.find((p) => p.slug === deleteTarget)?.title ?? "";

  return (
    <div className="flex flex-col gap-4">
      {/* ---- THE HEAD ROW — TITLE AND CONTROLS ON ONE LEVEL, matching the case-studies index.
          `AreaHeader` is rendered HERE rather than by the route so it can share a flex row with
          controls that need client state; it is presentational with no hooks, and #244's rule is
          about not CAPPING it rather than about who renders it. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <AreaHeader
          title="Blog"
          sub="Short posts. A new post starts as a draft and stays off /blog until you publish it."
        />
        <div className="flex shrink-0 items-center gap-2.5">
          <SegmentedGroup
            options={VIEW_OPTIONS}
            value={view}
            onChange={chooseView}
            ariaLabel="View"
          />
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setError(null);
              setAdding(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500 px-3.5 py-2 text-[14px] font-medium text-studio-cream-50 transition-colors hover:bg-studio-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> New post
          </button>
        </div>
      </div>

      {/* The search sits on the LEFT beside the status it drives, not in the head cluster —
          search, view and New post together would put a FILTER beside a PRESENTATION beside a
          WRITE, which reads as a toolbar of equals. The strip is the answer: type, and the
          sentence to its right becomes "2 of 4 posts". */}
      <div className="flex flex-wrap items-stretch gap-2.5">
        {/* The width is stated on a WRAPPER — `inputCls` already carries `w-full`, and two width
            utilities on one element are decided by their order in the generated sheet rather
            than in the class string. */}
        <div className="w-[220px] min-w-0 flex-none">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            aria-label="Search posts"
            className={inputCls}
          />
        </div>
        <div
          role="status"
          aria-live="polite"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-100 px-3 py-2.5 text-[12px] leading-relaxed text-studio-ink-600"
        >
          <IconInfo className="h-3.5 w-3.5 flex-none text-studio-ink-400" />
          <span>
            <strong className="font-semibold text-studio-ink-950">
              {shown.length === items.length
                ? `${items.length} ${items.length === 1 ? "post" : "posts"}`
                : `${shown.length} of ${items.length} ${items.length === 1 ? "post" : "posts"}`}
              .
            </strong>{" "}
            A post stays off /blog until you publish it.
          </span>
        </div>
      </div>

      {/* ALWAYS PRESENT — the count is a readout, not only a control. See above. */}
      <BlogStatusTabs value={status} onChange={setStatus} counts={counts} panelId={PANEL_ID} />

      {/* The panel the tabs name. Unconditional now, because the tablist is. */}
      <div id={PANEL_ID} role="tabpanel" aria-label={`${status} posts`}>
        {items.length === 0 ? (
          <StudioEmptyState>
            No posts yet. Write the first one. It starts as a draft, so nothing goes live
            until you say so.
          </StudioEmptyState>
        ) : shown.length === 0 ? (
          /* THE ZERO STATES ARE SEPARATED AT THE SOURCE — #271's lesson, where one sentence had
             been answering three different questions in the sections rail.
             THREE ANSWERS, NOT ONE. A search that matched nothing is a different fact from a tab
             that is genuinely empty, and an empty "Drafts" is the ordinary healthy state of a
             blog with nothing unpublished — it is the answer the tab exists to give, so it says
             so in words rather than showing a blank pane.
             THE `all` ARM IS UNREACHABLE TODAY (every post passes "all" when there is no query)
             and is still written honestly rather than left to say something false if it ever
             becomes reachable. */
          <div className="grid min-h-[30vh] place-items-center rounded-[var(--studio-radius-card,8px)] bg-studio-cream-100 px-4 py-10 text-center">
            <p className="text-[13px] text-studio-text-subtle">
              {query.trim() ? (
                <>
                  No posts match <b className="text-studio-ink-950">{query.trim()}</b>
                  {status !== "all" ? ` under ${status === "draft" ? "Drafts" : "Published"}` : ""}.
                </>
              ) : (
                status === "draft"
                  ? "No drafts. Everything you have written is published."
                  : status === "published"
                    ? "No published posts yet."
                    : "No posts yet."
              )}
            </p>
          </div>
        ) : view === "grid" ? (
          /* THE WELL. cream-100 under cream-50 cards, because a card on the same ground as the
             page has nothing to lift off. Fluid columns off one floor — no breakpoint ladder. */
          <div className="grid gap-4 rounded-[var(--studio-radius-card,8px)] bg-studio-cream-100 p-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {shown.map((p) => (
              <BlogPostCard
                key={p.slug}
                post={p}
                onOpen={() => router.push(`/studio/blog/${p.slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {shown.map((p) => (
              <BlogPostRow
                key={p.slug}
                post={p}
                onOpen={() => router.push(`/studio/blog/${p.slug}`)}
                onRemove={() => setDeleteTarget(p.slug)}
              />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <StudioModal
          role="dialog"
          title="New post"
          describedById="new-post-desc"
          onClose={() => setAdding(false)}
          busy={busy}
          initialFocusRef={titleRef}
        >
          <p id="new-post-desc" className="mt-2 text-[14px] leading-relaxed text-studio-ink-600">
            Give it a title. The slug is derived server-side and locked once created, and
            everything else can change later. It starts as a draft.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className={`${inputCls} mt-4`}
            />
            {error && (
              <p role="alert" className="mt-2 text-[12px] text-studio-danger-600">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(false)} className={modalGhostBtn}>
                Cancel
              </button>
              <button type="submit" disabled={busy || !title.trim()} className={modalAccentBtn}>
                {busy ? "Creating…" : "Create & start writing"}
              </button>
            </div>
          </form>
        </StudioModal>
      )}

      {deleteTarget && (
        <StudioModal
          role="alertdialog"
          title="Remove post"
          describedById="delete-post-desc"
          onClose={() => setDeleteTarget(null)}
          busy={busy}
          initialFocusRef={cancelRef}
        >
          <p id="delete-post-desc" className="mt-2 text-[14px] leading-relaxed text-studio-ink-600">
            Remove “{targetTitle}”? This deletes the post on the draft branch. It goes for
            good when you publish.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setDeleteTarget(null)}
              className={modalGhostBtn}
            >
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={busy} className={modalInkBtn}>
              {busy ? "Removing…" : "Remove"}
            </button>
          </div>
        </StudioModal>
      )}
    </div>
  );
}
