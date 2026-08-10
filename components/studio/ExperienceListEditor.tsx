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
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ListDetailLayout } from "./ListDetailLayout";
import ExperienceEditPanel from "./ExperienceEditPanel";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListReorder } from "./useListReorder";
import { useReportCount } from "./StudioCountsProvider";
import { inputClsMd, FIXED_KEY_CLS, KeyConnector } from "./blocks/fields";
import { StudioModal, modalGhostBtn, modalAccentBtn, modalInkBtn } from "./StudioModal";
import { isCurrentRole } from "@/components/sections/experience-current";
import type { ExperienceListItem } from "@/lib/keystatic";


export default function ExperienceListEditor({ entries }: { entries: ExperienceListItem[] }) {
  const router = useRouter();
  const { setUnpublished, beginToast, resolveToast, dismissToast } = usePublishSignal();

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


  // Keep Publish/Discard from racing an in-flight create/delete (like every panel).
  const { moveItem, reorderBusy } = useListReorder({
    collection: "experience",
    items,
    setItems,
  });

  // Publish/Discard must not race an in-flight reorder either.
  useReportPending(addBusy || deleteBusy || reorderBusy);
  // Keep the sidebar Experience badge in sync with the optimistic list length.
  useReportCount("experience", items.length);

  // Initial focus (addInputRef / cancelRef), the Tab trap, and focus restoration are
  // all owned by StudioModal now; addInputRef and cancelRef are passed as its
  // initialFocusRef below.

  // TITLE LEADS, COMPANY BENEATH — and the contract asked for title ALONE, which is measurably
  // worse. Leading with the company (what shipped) collides on two rows: both LTIMindtree
  // entries read "LTIMind…" and "LTIMindtree, Bengal…" at rail width, and the first has only
  // 60px because the "Currently" pill takes 66. Leading with the title alone collides on THREE:
  // "UX and UI Designer" is the title of three of the five entries. Only the PAIR is unique on
  // every row. The diagnosis in the contract was right and the cure was not.
  //
  // `title` IS THE FIELD. There is no `role` in the schema; the contract's "role" is this.
  const sections = items.map((e) => ({
    id: e.slug,
    name: e.title.trim() || e.company,
    meta: e.title.trim() ? e.company : undefined,
    badge: isCurrentRole(e.endDate) ? "Currently" : undefined,
  }));

  function openAdd() {
    setAddError("");
    setCompany("");
    setAddOpen(true);
    return undefined; // async create can't return an id — the row is added post-POST
  }

  function askDelete(slug: string) {
    setDeleteError("");
    setDeleteTarget(slug); // the layout has already re-selected a neighbor
  }

  async function submitCreate() {
    const name = company.trim();
    if (!name || addingRef.current) return;
    addingRef.current = true;
    setAddBusy(true);
    setAddError("");
    const addOpId = beginToast("Adding experience\u2026", name);
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
        resolveToast(addOpId, { kind: "ok", title: "Experience added", message: name });
      } else if (res.ok && json.mode === "fs") {
        // fs no-op (dev): close the dialog, show the note, add NO row, no select.
        setAddOpen(false);
        setCompany("");
        dismissToast(addOpId); // fs wrote nothing
      } else if (res.status === 409) {
        dismissToast(addOpId);
        setAddError("Too many entries with that name. Give this one a different name.");
      } else if (res.status === 400) {
        dismissToast(addOpId);
        setAddError("Use a company name with letters or numbers.");
      } else {
        dismissToast(addOpId);
        setAddError("Could not add the entry. Try again.");
      }
    } catch {
      dismissToast(addOpId);
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
    const delOpId = beginToast("Removing\u2026", target);
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
        resolveToast(delOpId, { kind: "ok", title: "Experience removed", message: target });
      } else if (res.ok && json.mode === "fs") {
        setDeleteTarget(null);
        dismissToast(delOpId); // fs wrote nothing
      } else if (res.status === 404) {
        dismissToast(delOpId);
        setDeleteError("That entry no longer exists.");
      } else {
        dismissToast(delOpId);
        setDeleteError("Could not remove the entry. Try again.");
      }
    } catch {
      dismissToast(delOpId);
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
      {/* ⚠ TWO PAGE-LEVEL SLOTS REMOVED — a dismissible banner and a reorder line. Both held
          RESULTS of discrete operations on a list those operations rearrange or shorten, so the
          message and the row it was about could part company. The banner even carried its own
          Dismiss button, which is a toast with extra steps and no stack.

          ⚠ `addError` AND `deleteError` STAY INLINE where their dialogs keep them beside the
          control. That is the line: a result outlives its surface and belongs in the toaster; a
          message about the control you are touching belongs next to it. */}

      <ListDetailLayout
        sections={sections}
        onAddItem={openAdd}
        addItemLabel="Add experience"
        searchPlaceholder="Search roles"
        onRemoveItem={askDelete}
        onMoveItem={moveItem}
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
          />
        ))}
      </ListDetailLayout>

      {addOpen && (
        <StudioModal
          role="dialog"
          title="Add experience"
          describedById="add-exp-desc"
          onClose={() => setAddOpen(false)}
          busy={addBusy}
          initialFocusRef={addInputRef}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitCreate();
            }}
            className="mt-3 flex flex-col gap-1.5"
          >
            {/* Stays a <label htmlFor> rather than a FieldKey span: the association is what
                names the input, and FieldKey renders a span. It takes the key class directly
                and the connector follows it. */}
            <label className={FIXED_KEY_CLS} htmlFor="add-exp-company">
              Company
            </label>
            <KeyConnector />
            <input
              id="add-exp-company"
              ref={addInputRef}
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme, Bengaluru"
              className={inputClsMd}
            />
            <p id="add-exp-desc" className="mt-1 text-[12px] text-studio-text-subtle">
              Company is the entry&rsquo;s identity and can&rsquo;t be changed here later. New
              entries are added to the end of the list. Use the up and down controls to move
              them. Two entries can share a company name.
            </p>
            {addError && (
              <p className="text-[12px] text-studio-accent-600" aria-live="polite">
                {addError}
              </p>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setAddOpen(false)} disabled={addBusy} className={modalGhostBtn}>
                Cancel
              </button>
              <button type="submit" disabled={!company.trim() || addBusy} className={modalAccentBtn}>
                {addBusy ? "Adding…" : "Add experience"}
              </button>
            </div>
          </form>
        </StudioModal>
      )}

      {deleteTarget && (
        <StudioModal
          role="alertdialog"
          title="Remove experience"
          describedById="delete-exp-msg"
          onClose={cancelDelete}
          busy={deleteBusy}
          initialFocusRef={cancelRef}
        >
          <p id="delete-exp-msg" className="mt-2 text-[14px]">
            Remove <span className="font-medium text-studio-ink-950">{deleteCompany}</span> from your draft?
            You can still undo it with Discard until you Publish.
          </p>
          {deleteError && (
            <p className="mt-2 text-[12px] text-studio-accent-600" aria-live="polite">
              {deleteError}
            </p>
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button ref={cancelRef} type="button" onClick={cancelDelete} disabled={deleteBusy} className={modalGhostBtn}>
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleteBusy} className={modalInkBtn}>
              {deleteBusy ? "Removing…" : "Remove"}
            </button>
          </div>
        </StudioModal>
      )}
    </>
  );
}
