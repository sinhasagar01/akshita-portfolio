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
//   1. ListDetailLayout is a fixed two-column grid (`lg:grid-cols-[220px_1fr]`) with no
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
// under its 697.9296875 measure. So the rail DOES now cost the canvas something it needs,
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
import Link from "next/link";
import { StudioModal, modalGhostBtn, modalAccentBtn, modalInkBtn } from "./StudioModal";
import { useReportCount } from "./StudioCountsProvider";
import StudioEmptyState from "./StudioEmptyState";
import { IconPlus, IconX } from "./icons";
import { formatShortDate } from "@/lib/blog/format";
import { filterBlogPosts } from "@/lib/studio/blog-search";
import type { BlogCard } from "@/lib/keystatic";
import { inputCls } from "./blocks/fields";

export default function BlogIndex({ posts }: { posts: BlogCard[] }) {
  const router = useRouter();
  const [items, setItems] = useState<BlogCard[]>(posts);
  const [query, setQuery] = useState("");
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
  const shown = useMemo(() => filterBlogPosts(items, query), [items, query]);

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
        setDeleteTarget(null);
      }
    } finally {
      setBusy(false);
    }
  }

  const targetTitle = items.find((p) => p.slug === deleteTarget)?.title ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts"
          aria-label="Search posts"
          // DELIBERATELY LOCAL — the FLEX-CHILD family (see ralph's studio-ink suite). The
          // shared exports hardcode a full-width utility that fights `flex-1` in this row;
          // see ChipListEditor for the full reasoning. 13px is intent, not drift — the
          // search family (StudioSearch, BlogPostList) is 13px. The well tracks
          // blocks/fields.tsx exactly.
          className="min-h-11 min-w-0 flex-1 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
        />
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setError(null);
            setAdding(true);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-3.5 py-2 text-[12.5px] font-medium text-cream-50 transition-colors hover:bg-accent-600 [&>svg]:size-3.5"
        >
          <IconPlus /> New post
        </button>
      </div>

      {items.length === 0 ? (
        <StudioEmptyState>
          No posts yet. Write the first one. It starts as a draft, so nothing goes live
          until you say so.
        </StudioEmptyState>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {shown.map((p) => (
            <li
              key={p.slug}
              className="group flex items-center gap-3 border-b border-ink-950/12 py-3"
            >
              <span
                aria-hidden
                title={p.status === "published" ? "Published" : "Draft"}
                className={`size-1.5 shrink-0 rounded-full ${
                  p.status === "published" ? "bg-success-700" : "bg-ink-400"
                }`}
              />
              <Link href={`/studio/blog/${p.slug}`} className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] text-ink-950">{p.title}</span>
                <span className="mt-0.5 block text-[11.5px] text-text-subtle">
                  {p.status === "published" ? "Published" : "Draft"} ·{" "}
                  {p.date ? formatShortDate(p.date) : "no date"} · {p.readingTime} min
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(p.slug)}
                aria-label={`Remove ${p.title}`}
                className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 opacity-0 transition-opacity hover:bg-cream-200 hover:text-ink-950 focus-visible:opacity-100 group-hover:opacity-100 [&>svg]:size-3.5"
              >
                <IconX />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <StudioModal
          role="dialog"
          title="New post"
          describedById="new-post-desc"
          onClose={() => setAdding(false)}
          busy={busy}
          initialFocusRef={titleRef}
        >
          <p id="new-post-desc" className="mt-2 text-[14px] leading-relaxed text-ink-600">
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
              <p role="alert" className="mt-2 text-[12px] text-danger-600">
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
          <p id="delete-post-desc" className="mt-2 text-[14px] leading-relaxed text-ink-600">
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
