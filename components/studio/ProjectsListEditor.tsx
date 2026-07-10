"use client";

// Item 11 — the projects list with ADD + REMOVE, the second consumer of the
// create/delete foundation (F-1/F-2/F-3) and the first to exercise F-3's delete
// ENUMERATION for real (a project is <slug>.yaml + content/projects/<slug>/body/**
// mdocs). Mirrors ExperienceListEditor (item 13): a client wrapper owning the
// optimistic list, the SK-3a dynamic-list handlers, and the two dialogs, rendering
// ListDetailLayout with one ProjectsEditPanel per entry.
//
// KEY INVARIANTS (same as experience):
//  - An entry in the list = a file on the draft branch (capture-then-create): the
//    Add dialog captures the title, the route creates a STUB (F-3 serializeNewProject
//    — head + body: [], no mdoc; Keystatic owns the rich body), server-derived slug,
//    orderIndex = max+1. No phantom rows.
//  - The list is OPTIMISTIC client state: create appends / delete removes instantly,
//    keeping every OTHER panel's unsaved useDraftForm draft mounted (slug keys). A
//    full reload re-seeds `items` from the server overlay.
//  - Bespoke projects (boat-crest) can't be removed here — the client shows a banner
//    instead of the confirm; the route's bespoke_locked is the real backstop.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ListDetailLayout } from "./ListDetailLayout";
import ProjectsEditPanel from "./ProjectsEditPanel";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { BESPOKE_SLUGS } from "@/lib/case-studies/types";
import type { ProjectListItem } from "@/lib/keystatic";

const inputCls =
  "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

export default function ProjectsListEditor({ entries }: { entries: ProjectListItem[] }) {
  const router = useRouter();
  const { setUnpublished } = usePublishSignal();

  // Optimistic list — seeded once, mutated on create/delete (see item 13 rationale).
  const [items, setItems] = useState(entries);

  // Add dialog (title required, summary optional)
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const addingRef = useRef(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deletingRef = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Transient banner: fs-mode dev note AND the bespoke "can't remove" message.
  const [banner, setBanner] = useState("");

  useReportPending(addBusy || deleteBusy);

  useEffect(() => {
    if (addOpen) addInputRef.current?.focus();
  }, [addOpen]);
  useEffect(() => {
    if (deleteTarget) cancelRef.current?.focus();
  }, [deleteTarget]);

  const sections = items.map((p) => ({ id: p.slug, name: p.title }));

  function openAdd() {
    setAddError("");
    setTitle("");
    setSummary("");
    setBanner("");
    setAddOpen(true);
    return undefined; // async create can't return an id — the row is added post-POST
  }

  function askDelete(slug: string) {
    setDeleteError("");
    setBanner("");
    // Bespoke guard: boat-crest has a literal route + hardcoded case-study module,
    // so it can't be removed here. Show an intentional message, never the confirm.
    // (The delete route's bespoke_locked is the real backstop.)
    if (BESPOKE_SLUGS.has(slug)) {
      const name = items.find((p) => p.slug === slug)?.title ?? slug;
      setBanner(`${name} is a featured case study and can’t be removed here.`);
      return;
    }
    setDeleteTarget(slug); // the layout has already re-selected a neighbor
  }

  async function submitCreate() {
    const name = title.trim();
    if (!name || addingRef.current) return;
    addingRef.current = true;
    setAddBusy(true);
    setAddError("");
    try {
      const res = await fetch("/api/studio/create-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "projects", input: { title: name, summary: summary.trim() } }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        const orderIndex = items.reduce((m, e) => Math.max(m, e.orderIndex), -1) + 1;
        const created: ProjectListItem = {
          slug: json.slug,
          title: name,
          summary: summary.trim(),
          orderIndex,
          heroImage: null,
          facts: { role: "", type: "", platform: "", timeline: "" },
        };
        setItems((prev) => [...prev, created]);
        setUnpublished(true);
        setAddOpen(false);
        setTitle("");
        setSummary("");
        router.replace(`/studio/projects?item=${json.slug}`);
        router.refresh();
      } else if (res.ok && json.mode === "fs") {
        setAddOpen(false);
        setTitle("");
        setSummary("");
        setBanner("Add needs github mode (dev).");
      } else if (res.status === 409) {
        setAddError("A project with that title already exists.");
      } else if (res.status === 400) {
        setAddError("Use a title with letters or numbers.");
      } else {
        setAddError("Could not add the project. Try again.");
      }
    } catch {
      setAddError("Could not add the project. Try again.");
    } finally {
      addingRef.current = false;
      setAddBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deletingRef.current) return;
    const target = deleteTarget;
    deletingRef.current = true;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/studio/delete-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "projects", slug: target }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        setItems((prev) => prev.filter((e) => e.slug !== target));
        setUnpublished(true);
        setDeleteTarget(null);
        router.refresh();
      } else if (res.ok && json.mode === "fs") {
        setDeleteTarget(null);
        setBanner("Delete needs github mode (dev).");
      } else if (res.status === 409) {
        // bespoke_locked backstop (the UI guard above normally prevents reaching here)
        setDeleteError("This project can’t be removed here.");
      } else if (res.status === 404) {
        setDeleteError("That project no longer exists.");
      } else {
        setDeleteError("Could not remove the project. Try again.");
      }
    } catch {
      setDeleteError("Could not remove the project. Try again.");
    } finally {
      deletingRef.current = false;
      setDeleteBusy(false);
    }
  }

  function cancelDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleteError("");
    if (target) router.replace(`/studio/projects?item=${target}`);
  }

  const deleteTitle = items.find((p) => p.slug === deleteTarget)?.title ?? "this project";

  return (
    <>
      {banner && (
        <div
          className="mb-3 flex items-center justify-between gap-3 rounded-md border border-ink-950/10 bg-cream-100 px-3 py-2 text-[12px] text-ink-600"
          role="status"
        >
          <span>{banner}</span>
          <button
            type="button"
            onClick={() => setBanner("")}
            className="rounded px-2 py-0.5 text-ink-500 hover:bg-cream-200 hover:text-ink-950"
          >
            Dismiss
          </button>
        </div>
      )}

      <ListDetailLayout
        sections={sections}
        onAddItem={openAdd}
        addItemLabel="Add project"
        onRemoveItem={askDelete}
      >
        {items.map((p) => (
          <ProjectsEditPanel
            key={p.slug}
            itemId={p.slug}
            slug={p.slug}
            title={p.title}
            summary={p.summary}
            facts={p.facts}
          />
        ))}
      </ListDetailLayout>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/20 p-4"
          onClick={() => !addBusy && setAddOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add project"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !addBusy) setAddOpen(false);
            }}
            className="w-full max-w-[440px] rounded-xl border border-ink-950/10 bg-cream-50 p-5 shadow-[0_8px_30px_rgba(60,45,30,0.16)]"
          >
            <h2 className="font-display text-base text-ink-950">Add project</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
              className="mt-3 flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Title</span>
                <input
                  ref={addInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acme Redesign"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                  Summary <span className="normal-case tracking-normal text-text-subtle">(optional)</span>
                </span>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One sentence shown on the project card"
                  className={inputCls.replace("text-[14px]", "resize-y text-[14px] leading-relaxed")}
                />
              </label>
              <p className="text-[11px] text-text-subtle">
                A new project starts as a stub — the title is its identity and can&rsquo;t be changed
                here later; the hero image and case-study body are added in Keystatic. New projects are
                added to the end of the list (the oldest position); reordering isn&rsquo;t available here yet.
              </p>
              {addError && (
                <p className="text-[12px] text-accent-600" aria-live="polite">
                  {addError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  disabled={addBusy}
                  className="rounded-md px-3 py-2 text-[13px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || addBusy}
                  className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {addBusy ? "Adding…" : "Add project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/20 p-4"
          onClick={() => !deleteBusy && cancelDelete()}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Remove project"
            aria-describedby="delete-proj-msg"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !deleteBusy) cancelDelete();
            }}
            className="w-full max-w-[440px] rounded-xl border border-ink-950/10 bg-cream-50 p-5 shadow-[0_8px_30px_rgba(60,45,30,0.16)]"
          >
            <h2 className="font-display text-base text-ink-950">Remove project</h2>
            <p id="delete-proj-msg" className="mt-2 text-[13px] text-ink-700">
              Remove <span className="font-medium text-ink-950">{deleteTitle}</span> from your draft?
              This removes the project and its case-study body. You can still undo it with Discard until
              you Publish.
            </p>
            {deleteError && (
              <p className="mt-2 text-[12px] text-accent-600" aria-live="polite">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={cancelDelete}
                disabled={deleteBusy}
                className="rounded-md px-3 py-2 text-[13px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="rounded-md bg-ink-950 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteBusy ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
