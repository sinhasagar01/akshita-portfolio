"use client";

// The gallery index — create, arrange and remove. Editing happens at /studio/gallery/<slug>.
//
// THIS PAGE IS THE ONLY PLACE ITEMS ARE CREATED AND DELETED, matching the blog and case-study
// indexes. The editor's list pane searches and navigates and does nothing else, so those two
// write operations keep one implementation each.
//
// ---- ⚠ IT IS A GRID AND ONLY A GRID, WHERE BLOG OFFERS GRID OR LIST -------------------------
//
// Blog persists a view preference because a post is identified by its title, and a title reads
// equally well in a card or a row. A gallery item is identified by its PICTURE — the titles are
// "Low tide" and "Untitled 4" — so a list view would be a column of filenames beside forty
// thumbnails the size of a favicon. The control is omitted rather than shipped inert, which is
// this studio's standing rule about a control that cannot usefully do anything.
//
// ---- ⚠ AND IT REORDERS, WHERE BLOG CANNOT --------------------------------------------------
//
// `COLLECTION_HAS_ORDER` says gallery is orderable and blog is not, and that difference is the
// content's rather than the UI's: posts sort by `date`, which every post has and nobody arranges,
// while a gallery has no natural order at all — a 2022 photograph may belong beside a 2025 one.
// The arrangement IS the authoring, so the index is where it happens.
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StudioModal, modalGhostBtn, modalAccentBtn, modalInkBtn } from "./StudioModal";
import { useReportCount } from "./StudioCountsProvider";
import { usePublishSignal } from "./PublishProvider";
import StudioEmptyState from "./StudioEmptyState";
import { useListReorder } from "./useListReorder";
import { IconPlus, IconInfo, IconChevronUp, IconChevronDown, IconX } from "./icons";
import AreaHeader from "./AreaHeader";
import { inputCls } from "./blocks/fields";
import type { GalleryItem } from "@/lib/keystatic";

export default function GalleryIndex({ items: initial }: { items: GalleryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ⚠ ONE MECHANISM FOR FAILURE, AND THIS PANEL WAS THE FOURTH SURFACE. Saves already toast through
     `useDraftForm`'s `toastLabel`, publish refusals toast from the bar, and draft read failures now
     toast too — while create and delete reported into a modal-local `setError` that vanished with
     the modal. Three surfaces reporting failure three ways is how a refusal gets missed, which is
     exactly what happened during the 404: the owner saw "Could not create the item. Try again."
     and the real cause was a dispatch writing the wrong schema.

     A REFUSAL, NOT A PENDING THAT RESOLVES. There is no in-flight card to update here — the button
     carries its own busy state — and `drains()` is `ok && !sha`, so this stays until answered. */
  const { beginToast, resolveToast } = usePublishSignal();
  const refuse = useCallback((title: string, message: string) => {
    resolveToast(beginToast(title, message), { kind: "refusal", title, message });
  }, [beginToast, resolveToast]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useReportCount("gallery", items.length);

  const { moveItem, reorderBusy } = useListReorder({ collection: "gallery", items, setItems });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.kind.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, query]);

  /* ⚠ THE ARROWS ARE HIDDEN WHILE A SEARCH IS ACTIVE, and the reason is NOT the one I first wrote
     down. My first note claimed the hook computes from the visible list and would commit an order
     skipping the filtered-out items — reading `useListReorder` refutes that: `moveItem` takes a
     SLUG, finds it in the full `items` array and swaps with the true neighbour, so the committed
     order is correct at any filter.

     WHAT IS WRONG IS THE FEEDBACK, WHICH IS ENOUGH ON ITS OWN. The item it swaps with may not be
     on screen, so an author clicking "later" sees a card jump past something invisible, or sees
     nothing move at all. A control whose effect is correct and unobservable is worse than one that
     is absent, because the author cannot tell it worked. */
  const filtered = shown.length !== items.length;

  // CAPTURE-THEN-CREATE, identical to Blog, Experience and Projects: title only, the slug is
  // DERIVED SERVER-SIDE and echoed back, the entry is created immediately, then straight into
  // the editor. Never a blank-row append.
  async function create() {
    const name = title.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/create-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "gallery", input: { title: name } }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.saved && json.slug) {
        router.push(`/studio/gallery/${json.slug}`);
        return;
      }
      if (res.ok && json.mode === "fs") {
        refuse("Couldn\u2019t create the item", "Creating an item needs github mode (dev). Nothing was written.");
        return;
      }
      /* ⚠ THE SERVER'S OWN SENTENCE WHEN IT HAS ONE, and only a generic line when it does not.
         "Could not create the item. Try again." is what the owner saw during the 404, and it told
         them nothing — the route had a typed reason and this discarded it. */
      refuse("Couldn\u2019t create the item",
        json?.error?.code === "invalid_slug"
          ? "Use a title with letters or numbers."
          : json?.error?.code === "slug_taken"
            ? "An item with that title already exists."
            : typeof json?.error?.message === "string"
              ? json.error.message
              : "The server refused the create and gave no reason. Nothing was written.");
    } catch {
      refuse("Couldn\u2019t create the item", "The request did not reach the server. Nothing was written.");
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
        body: JSON.stringify({ collection: "gallery", slug }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.saved) {
        setItems((prev) => prev.filter((i) => i.slug !== slug));
        setDeleteTarget(null);
        return;
      }
      /* ⚠ A DELETE THAT FAILED USED TO DO NOTHING AT ALL — no branch, no message, and the modal
         simply stayed open. An author cannot tell that from a slow network. */
      refuse("Couldn\u2019t remove the item",
        typeof json?.error?.message === "string"
          ? json.error.message
          : "The server refused the delete. Nothing was removed.");
    } catch {
      refuse("Couldn\u2019t remove the item", "The request did not reach the server. Nothing was removed.");
    } finally {
      setBusy(false);
    }
  }

  const targetTitle = items.find((i) => i.slug === deleteTarget)?.title ?? "";
  const missingAlt = items.filter((i) => i.alt.trim() === "").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <AreaHeader
          title="Gallery"
          sub="Photographs, drawings and studies. An item is public the moment you publish, so alt text is required before it can go out."
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
          <IconPlus /> New item
        </button>
      </div>

      <div className="flex flex-wrap items-stretch gap-2.5">
        <div className="w-[220px] min-w-0 flex-none">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items"
            aria-label="Search items"
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
                ? `${items.length} ${items.length === 1 ? "item" : "items"}`
                : `${shown.length} of ${items.length} ${items.length === 1 ? "item" : "items"}`}
              .
            </strong>{" "}
            {/* ⚠ THE COUNT THAT MATTERS IS THE BLOCKING ONE, stated here rather than left to be
                discovered at publish. `galleryPublishBlockers` refuses an item with no alt text,
                so this sentence is the same rule read forwards. */}
            {missingAlt > 0
              ? `${missingAlt} ${missingAlt === 1 ? "item needs" : "items need"} alt text before publishing.`
              : "Every item has alt text."}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <StudioEmptyState>
          No items yet. Add your first photograph, drawing or study — you will upload the image
          inside the editor.
        </StudioEmptyState>
      ) : shown.length === 0 ? (
        <p className="rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-100 px-4 py-8 text-center text-[13px] text-studio-text-subtle">
          No items match that search.
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 p-0">
          {shown.map((item, i) => (
            <li
              key={item.slug}
              className="group relative flex flex-col overflow-hidden rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-50"
            >
              <button
                type="button"
                onClick={() => router.push(`/studio/gallery/${item.slug}`)}
                className="block w-full text-left"
              >
                {/* A FIXED 4:3 PLATE WITH `object-cover`. The masonry on the public page is where
                    aspect ratio does its work; an index whose rows are all different heights is
                    harder to scan, and this grid's job is finding an item rather than previewing
                    the page. */}
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-studio-cream-200">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 190px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center font-mono text-[10px] uppercase tracking-[0.16em] text-studio-text-subtle">
                      No image
                    </span>
                  )}
                </span>
                <span className="block px-3 pb-2.5 pt-2">
                  <span className="block truncate text-[13.5px] font-medium text-studio-ink-950">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-studio-text-subtle">
                    {item.kind || "no kind"}
                    {item.alt.trim() === "" ? " · needs alt" : ""}
                  </span>
                </span>
              </button>

              <div className="flex items-center gap-0.5 border-t border-studio-ink-950/12 px-1.5 py-1">
                {!filtered ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveItem(item.slug, "up")}
                      disabled={i === 0 || reorderBusy}
                      aria-label={`Move ${item.title} earlier`}
                      className="grid size-7 place-items-center rounded-[3px] text-studio-ink-400 transition-colors enabled:hover:bg-studio-cream-200 enabled:hover:text-studio-ink-950 disabled:opacity-30 [&>svg]:size-3.5"
                    >
                      <IconChevronUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.slug, "down")}
                      disabled={i === shown.length - 1 || reorderBusy}
                      aria-label={`Move ${item.title} later`}
                      className="grid size-7 place-items-center rounded-[3px] text-studio-ink-400 transition-colors enabled:hover:bg-studio-cream-200 enabled:hover:text-studio-ink-950 disabled:opacity-30 [&>svg]:size-3.5"
                    >
                      <IconChevronDown />
                    </button>
                  </>
                ) : (
                  <span className="px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-studio-text-subtle">
                    clear search to arrange
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item.slug)}
                  aria-label={`Delete ${item.title}`}
                  className="ml-auto grid size-7 place-items-center rounded-[3px] text-studio-ink-400 transition-colors hover:bg-studio-cream-200 hover:text-studio-ink-950 [&>svg]:size-3.5"
                >
                  <IconX />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <StudioModal
          role="dialog"
          title="New gallery item"
          describedById="new-item-desc"
          onClose={() => setAdding(false)}
          busy={busy}
          initialFocusRef={titleRef}
        >
          <p id="new-item-desc" className="mt-2 text-[14px] leading-relaxed text-studio-ink-600">
            Give it a title. The slug is derived server-side and locked once created, and
            everything else can change later.
          </p>
          {/* THE IMAGE IS NOT HERE, AND THAT IS THE SEQUENCE RATHER THAN AN OMISSION. An upload is
              a multipart POST that needs a slug to name its path, so the entry must exist first —
              `sanitizeGalleryCreate` refuses an image at create by name for exactly this reason. */}
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
              placeholder="Low tide"
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
                {busy ? "Creating…" : "Create & add the image"}
              </button>
            </div>
          </form>
        </StudioModal>
      )}

      {deleteTarget && (
        <StudioModal
          role="alertdialog"
          title="Remove item"
          describedById="delete-item-desc"
          onClose={() => setDeleteTarget(null)}
          busy={busy}
          initialFocusRef={cancelRef}
        >
          <p id="delete-item-desc" className="mt-2 text-[14px] leading-relaxed text-studio-ink-600">
            Remove “{targetTitle}”? This deletes the item on the draft branch. It goes for good
            when you publish.
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
