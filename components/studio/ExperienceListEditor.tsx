"use client";

// Item 13 — the experience list with ADD + REMOVE, the first consumer of the
// create/delete foundation (F-1/F-2/F-3). Mirrors how the skills page renders
// SkillsEditor: a client wrapper that owns the list, the dynamic-list handlers,
// and the two dialogs, rendering ListDetailLayout with one ExperienceEditPanel
// per entry.
//
// KEY INVARIANTS:
//  - An entry in the list = a file on the draft branch (capture-then-create): the
//    Add dialog captures the company, the route creates the file (server-derived
//    slug, orderIndex = max+1), THEN the row is added. No phantom rows (F-2's
//    overlay couldn't represent them). The slug is the stable id — no synthetic
//    ids (unlike Skills).
//  - The list is OPTIMISTIC client state (like SkillsEditor's categories): a
//    successful create appends the row, a delete removes it — instantly and
//    without a full reload, so every OTHER panel's unsaved useDraftForm draft
//    stays mounted (slug keys). The row's data mirrors exactly what the route
//    committed. router.refresh() is a best-effort reconcile of the server overlay;
//    a full reload re-seeds `items` from the server (which holds the same draft).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ListDetailLayout } from "./ListDetailLayout";
import ExperienceEditPanel from "./ExperienceEditPanel";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { isCurrentRole } from "@/components/sections/experience-current";
import type { ExperienceListItem } from "@/lib/keystatic";

const inputCls =
  "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

export default function ExperienceListEditor({ entries }: { entries: ExperienceListItem[] }) {
  const router = useRouter();
  const { setUnpublished } = usePublishSignal();

  // The list — seeded once from the server overlay, then mutated optimistically on
  // create/delete. Not synced from props during the session (that would clobber an
  // optimistic add before router.refresh() catches up); a full reload re-seeds it.
  const [items, setItems] = useState(entries);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [company, setCompany] = useState("");
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

  // Transient banner for the fs-mode dev note (no row is added in fs mode).
  const [banner, setBanner] = useState("");

  // Keep Publish/Discard from racing an in-flight create/delete (like every panel).
  useReportPending(addBusy || deleteBusy);

  useEffect(() => {
    if (addOpen) addInputRef.current?.focus();
  }, [addOpen]);
  useEffect(() => {
    if (deleteTarget) cancelRef.current?.focus();
  }, [deleteTarget]);

  const sections = items.map((e) => ({
    id: e.slug,
    name: e.company,
    badge: isCurrentRole(e.endDate) ? "Currently" : undefined,
  }));

  function openAdd() {
    setAddError("");
    setCompany("");
    setBanner("");
    setAddOpen(true);
    return undefined; // async create can't return an id — the row is added post-POST
  }

  function askDelete(slug: string) {
    setDeleteError("");
    setBanner("");
    setDeleteTarget(slug); // the layout has already re-selected a neighbor
  }

  async function submitCreate() {
    const name = company.trim();
    if (!name || addingRef.current) return;
    addingRef.current = true;
    setAddBusy(true);
    setAddError("");
    try {
      const res = await fetch("/api/studio/create-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "experience", input: { company: name } }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        // Optimistic append — mirrors exactly what the route committed (company +
        // empty editable fields; orderIndex = max+1, so it sorts to the end).
        const orderIndex = items.reduce((m, e) => Math.max(m, e.orderIndex), -1) + 1;
        const created: ExperienceListItem = {
          slug: json.slug,
          company: name,
          title: "",
          startDate: "",
          endDate: "",
          description: "",
          location: "",
          orderIndex,
        };
        setItems((prev) => [...prev, created]);
        setUnpublished(true);
        setAddOpen(false);
        setCompany("");
        // Select the new row via ?item (client-reactive; the list renders from
        // `items`, which already includes it). router.refresh() reconciles the
        // server overlay + sidebar count best-effort. Both soft — panels stay mounted.
        router.replace(`/studio/experience?item=${json.slug}`);
        router.refresh();
      } else if (res.ok && json.mode === "fs") {
        // fs no-op (dev): close the dialog, show the note, add NO row, no select.
        setAddOpen(false);
        setCompany("");
        setBanner("Add needs github mode (dev).");
      } else if (res.status === 409) {
        setAddError("An entry for that company already exists.");
      } else if (res.status === 400) {
        setAddError("Use a company name with letters or numbers.");
      } else {
        setAddError("Could not add the entry. Try again.");
      }
    } catch {
      setAddError("Could not add the entry. Try again.");
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
        body: JSON.stringify({ collection: "experience", slug: target }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        // Optimistic removal — the layout already selected a neighbor before this.
        setItems((prev) => prev.filter((e) => e.slug !== target));
        setUnpublished(true);
        setDeleteTarget(null);
        router.refresh(); // reconcile server overlay + sidebar count best-effort
      } else if (res.ok && json.mode === "fs") {
        setDeleteTarget(null);
        setBanner("Delete needs github mode (dev).");
      } else if (res.status === 404) {
        setDeleteError("That entry no longer exists.");
      } else {
        setDeleteError("Could not remove the entry. Try again.");
      }
    } catch {
      setDeleteError("Could not remove the entry. Try again.");
    } finally {
      deletingRef.current = false;
      setDeleteBusy(false);
    }
  }

  function cancelDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleteError("");
    // The layout moved selection to a neighbor on the remove click — restore the
    // original selection now that the delete was cancelled.
    if (target) router.replace(`/studio/experience?item=${target}`);
  }

  const deleteCompany = items.find((e) => e.slug === deleteTarget)?.company ?? "this entry";

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
        addItemLabel="Add experience"
        onRemoveItem={askDelete}
      >
        {items.map((e) => (
          <ExperienceEditPanel
            key={e.slug}
            itemId={e.slug}
            slug={e.slug}
            company={e.company}
            title={e.title}
            startDate={e.startDate}
            endDate={e.endDate}
            location={e.location}
            description={e.description}
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
            aria-label="Add experience"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !addBusy) setAddOpen(false);
            }}
            className="w-full max-w-[420px] rounded-xl border border-ink-950/10 bg-cream-50 p-5 shadow-[0_8px_30px_rgba(60,45,30,0.16)]"
          >
            <h2 className="font-display text-base text-ink-950">Add experience</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
              className="mt-3 flex flex-col gap-1.5"
            >
              <label className="text-eyebrow uppercase tracking-eyebrow text-ink-400" htmlFor="add-exp-company">
                Company
              </label>
              <input
                id="add-exp-company"
                ref={addInputRef}
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme, Bengaluru"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-text-subtle">
                Company is the entry&rsquo;s identity and can&rsquo;t be changed here later. New entries
                are added to the end of the list (the oldest position); reordering isn&rsquo;t available
                here yet.
              </p>
              {addError && (
                <p className="text-[12px] text-accent-600" aria-live="polite">
                  {addError}
                </p>
              )}
              <div className="mt-3 flex items-center justify-end gap-2">
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
                  disabled={!company.trim() || addBusy}
                  className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {addBusy ? "Adding…" : "Add experience"}
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
            aria-label="Remove experience"
            aria-describedby="delete-exp-msg"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !deleteBusy) cancelDelete();
            }}
            className="w-full max-w-[420px] rounded-xl border border-ink-950/10 bg-cream-50 p-5 shadow-[0_8px_30px_rgba(60,45,30,0.16)]"
          >
            <h2 className="font-display text-base text-ink-950">Remove experience</h2>
            <p id="delete-exp-msg" className="mt-2 text-[13px] text-ink-700">
              Remove <span className="font-medium text-ink-950">{deleteCompany}</span> from your draft?
              You can still undo it with Discard until you Publish.
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
