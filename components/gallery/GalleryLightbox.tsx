"use client";

// The dialog around `GalleryOverlay` — index, keyboard, swipe, focus and the filmstrip.
//
// ---- ⚠ WHY THE BEHAVIOUR IS HERE AND THE COMPOSITION IS NOT ---------------------------------
//
// `GalleryOverlay` draws ONE item and owns no dialog, no key handling and no index. That split is
// what lets the studio canvas render the same node bare, so the editor and the reader see the same
// composition rather than two implementations that agree today. Everything in this file is a fact
// about a SET or about being modal, and neither is true in the canvas.
//
// ---- ⚠ FOCUS IS TRAPPED AND RESTORED, WHICH IS THE PART THAT IS EASY TO SHIP BROKEN -----------
//
// A dialog covering the page with a focusable document behind it is a keyboard reader tabbing into
// content they cannot see, with no way back. The trap wraps within this subtree's own controls and
// the restore returns focus to the TILE that opened it — not to the top of the document, which
// would make a reader re-traverse the whole grid to get back to where they were.
//
// `ImagePreview` in the case-study layer solves the same problem for a different subject, and the
// two are deliberately NOT shared: that one zooms and pans a single image with no set to browse,
// this one browses a set and never zooms. Their overlap is a focus trap and an Esc key, which is
// twenty lines, and merging them would put a filmstrip and a pan gesture in one component to save
// it. The threshold for extraction in this repo is a second consumer of the SAME behaviour.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import GalleryOverlay from "./GalleryOverlay";
import type { GalleryItem } from "@/lib/keystatic";

/** How far a touch must travel before it counts as a swipe rather than a tap or a scroll. The
 *  contract's own figure, kept because it is a human threshold rather than a derived one. */
const SWIPE_PX = 50;

export default function GalleryLightbox({
  items,
  openIndex,
  onClose,
  onIndexChange,
}: {
  /** The FILTERED set, in the order the grid is showing. The overlay browses what the reader is
   *  looking at — arrowing out of the current filter into a hidden item would be the overlay
   *  disagreeing with the page behind it. */
  items: readonly GalleryItem[];
  /** Null when closed. The index is the caller's, so the grid and the overlay cannot disagree
   *  about which item is open. */
  openIndex: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [strip, setStrip] = useState<HTMLDivElement | null>(null);

  const open = openIndex !== null;
  const item = open ? items[openIndex] : null;

  /* ⚠ WRAPPING, NOT CLAMPING. A set of twelve photographs has no first or last in any meaningful
     sense, and an arrow that stops dead at the end reads as broken rather than as a boundary. */
  const step = useCallback(
    (delta: number) => {
      if (openIndex === null || items.length === 0) return;
      onIndexChange((openIndex + delta + items.length) % items.length);
    },
    [openIndex, items.length, onIndexChange]
  );

  /* ⚠ THE OPENING ELEMENT IS CAPTURED WHEN THE DIALOG OPENS, NOT WHEN IT CLOSES. By close time the
     document has moved on and `document.activeElement` is whatever the dialog last focused. */
  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      restoreFocus.current?.focus();
      restoreFocus.current = null;
    };
  }, [open]);

  /* ⚠ THE PAGE MUST NOT SCROLL BEHIND THE DIALOG, AND THE RESTORE IS UNCONDITIONAL. An early
     return between setting and clearing this leaves the whole site unscrollable, which is the
     worst failure this component can have and the cheapest to prevent. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      /* THE TRAP. Without it, Tab walks out of a dialog covering the page and into a document the
         reader cannot see. Queried live rather than cached, because the filmstrip's buttons change
         with the filtered set. */
      if (e.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>("[data-gallery-dialog] button")
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  /* ⚠ THE ACTIVE THUMBNAIL IS SCROLLED INTO VIEW, because a filmstrip of forty items shows about
     eight and arrowing past the eighth would otherwise move a highlight nobody can see. `nearest`
     rather than `center`, so the strip only moves when it has to. */
  useEffect(() => {
    if (!strip || openIndex === null) return;
    strip.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [strip, openIndex]);

  if (!open || !item) return null;

  return (
    <div
      data-gallery-dialog
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} — ${openIndex + 1} of ${items.length}`}
      className="fixed inset-0 z-[100]"
      /* Clicking the backdrop closes. The guard is what stops a click that started inside the
         composition from closing on mouse-up outside it. */
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      <GalleryOverlay
        item={item}
        indexLabel={`${String(openIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}
        onPrev={items.length > 1 ? () => step(-1) : undefined}
        onNext={items.length > 1 ? () => step(1) : undefined}
        filmstrip={
          /* ⚠ ONE ITEM GETS NO FILMSTRIP. A browse rail over a set of one is a control that cannot
             do anything, which this project deletes on sight rather than shipping inert. */
          items.length > 1 ? (
            <div
              ref={setStrip}
              className="flex justify-center gap-[7px] overflow-x-auto px-5 pb-4"
              role="tablist"
              aria-label="Gallery items"
            >
              {items.map((thumb, i) =>
                thumb.image ? (
                  <button
                    key={thumb.slug}
                    type="button"
                    role="tab"
                    aria-selected={i === openIndex}
                    aria-label={thumb.title}
                    data-active={i === openIndex}
                    onClick={() => onIndexChange(i)}
                    className={`relative h-10 w-[54px] flex-none overflow-hidden border-2 p-0 transition-opacity ${
                      i === openIndex
                        ? "border-on-dark opacity-100"
                        : "border-transparent opacity-45 hover:opacity-80"
                    }`}
                  >
                    <Image src={thumb.image} alt="" fill sizes="54px" className="object-cover" />
                  </button>
                ) : null
              )}
            </div>
          ) : null
        }
      />

      {/* THE CLOSE CONTROL IS THE DIALOG'S, NOT THE OVERLAY'S, for the same reason the arrows are
          the caller's — a composition that draws one item has no opinion about being dismissable.
          It is FIRST in the focus order by being focused on open, and it is positioned rather than
          in flow so it cannot alter the stage geometry the canvas reproduces. */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-4 border border-on-dark/20 bg-on-dark/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-on-dark transition-colors hover:bg-on-dark/20"
      >
        Esc
      </button>
    </div>
  );
}
