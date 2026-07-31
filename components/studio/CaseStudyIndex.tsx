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
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectListItem } from "@/lib/keystatic";
import { BESPOKE_SLUGS } from "@/lib/case-studies/types";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListReorder } from "./useListReorder";
import { inputCls, labelCls } from "./blocks/fields";
import { StudioModal, modalGhostBtn, modalAccentBtn, modalInkBtn } from "./StudioModal";
import { IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";


export default function CaseStudyIndex({ entries }: { entries: ProjectListItem[] }) {
  const router = useRouter();
  const { setUnpublished } = usePublishSignal();
  // Optimistic list, same pattern the previous editor used: a create or delete shows
  // immediately and router.refresh() reconciles against the server overlay.
  const [items, setItems] = useState(entries);

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[14px] text-text-subtle">
          Use the arrows to set the order they appear on your homepage.
        </p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-3.5 py-2 text-[14px] font-medium text-cream-50 transition-colors hover:bg-accent-600 [&>svg]:size-3.5"
        >
          <IconPlus /> Add case study
        </button>
      </div>

      {/* One slot, two sources. Reorder errors win because they belong to the action
          you just took; a banner is cleared when a new action starts, so a stale
          message can never sit on top of a fresh one. */}
      {(reorderError || banner) && (
        <p className="text-[12px] text-accent-600" role="status" aria-live="polite">
          {reorderError || banner}
        </p>
      )}

      <ul className="overflow-hidden rounded-[var(--studio-radius-panel,12px)] border border-ink-950/22 bg-cream-50">
        {items.map((p, i) => {
          // boat-crest's sections are hand-built in code, so it is shown but dimmed:
          // present in the order (it still ranks on the homepage) and not removable.
          // The route refuses the delete too — this is the friendly half of that.
          const bespoke = BESPOKE_SLUGS.has(p.slug);
          return (
            <li
              key={p.slug}
              className={`group relative flex items-center gap-3 border-b border-ink-950/12 px-3 py-2.5 last:border-b-0 ${
                bespoke ? "opacity-60" : ""
              }`}
            >
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => {
                    setBanner(""); // a stale banner would mask this action's own error
                    moveItem(p.slug, "up");
                  }}
                  disabled={i === 0 || reorderBusy}
                  aria-label={`Move ${p.title} up`}
                  className="grid size-5 place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors enabled:hover:text-ink-950 disabled:opacity-25 [&>svg]:size-3"
                >
                  <IconChevronUp />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBanner("");
                    moveItem(p.slug, "down");
                  }}
                  disabled={i === items.length - 1 || reorderBusy}
                  aria-label={`Move ${p.title} down`}
                  className="grid size-5 place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors enabled:hover:text-ink-950 disabled:opacity-25 [&>svg]:size-3"
                >
                  <IconChevronDown />
                </button>
              </div>

              {/* The whole row is the link — a bigger target than the title alone. */}
              <Link
                href={`/studio/projects/${p.slug}`}
                className="flex min-w-0 flex-1 items-center gap-4 rounded-[var(--studio-radius-card,8px)] px-1 py-1 transition-colors hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[15px] text-ink-950">
                    {p.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-text-subtle">
                    {p.summary || "No summary yet"}
                  </span>
                </span>
                <span className="hidden shrink-0 rounded-full border border-ink-950/12 px-2 py-0.5 text-[10px] uppercase tracking-eyebrow text-text-subtle sm:inline">
                  {p.template === "web" ? "Web" : "Mobile"}
                </span>
                <span className="hidden w-[86px] shrink-0 text-[11.5px] text-text-subtle lg:inline">
                  {p.sectionCount} sections
                </span>
                <span className="w-[72px] shrink-0 text-right text-[12px]">
                  {bespoke ? (
                    <span className="rounded-full border border-dashed border-ink-950/20 px-2 py-0.5 text-text-subtle">
                      Bespoke
                    </span>
                  ) : null}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (bespoke) {
                    setBanner(`${p.title} is a featured case study and can't be removed here.`);
                    return;
                  }
                  setDeleteTarget(p.slug);
                }}
                aria-label={`Remove ${p.title}`}
                aria-disabled={bespoke}
                className={`grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors [&>svg]:size-3.5 ${
                  bespoke ? "opacity-25" : "hover:bg-cream-200 hover:text-ink-950"
                }`}
              >
                <IconX />
              </button>
            </li>
          );
        })}
      </ul>

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
            <span className={labelCls}>Title</span>
            <input
              ref={addTitleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <p id="add-cs-desc" className="mt-1 text-[12px] text-text-subtle">
            The title is the case study&rsquo;s identity and can&rsquo;t be changed here later. It
            starts as a stub, added to the end of the list. Use the arrows to move it.
          </p>
          {addError && (
            <p className="mt-2 text-[12px] text-accent-600" aria-live="polite">
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
