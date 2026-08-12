"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/* ============================================================================================
   THE CASE-STUDY IMAGE PREVIEW — ONE CLIENT COMPONENT FOR A WHOLE PAGE OF IMAGES.

   ⚠ IT IS A DELEGATED LISTENER, NOT A WRAPPER PER IMAGE, AND THE PARITY RULE IS WHY. The canvas
   and the public page share `SectionRenderer` and must render identically; an editable-only or
   preview-only WRAPPER ELEMENT is the named failure mode, because a new box in the layout chain
   resolves percentages against itself and collapses the frame inside it. `DeviceImage`'s own
   header records that exact incident.

   So no image gains an element. Each one gains ATTRIBUTES on the element that is already
   `position: relative`, and this component — mounted once at the case-study root — listens on the
   document. A page with forty images mounts one listener and zero extra React trees.

   ---- ⚠ HOVER IS THE AFFORDANCE AND CLICK IS THE ACTION, WHICH IS NOT A DETAIL ----------------

   The ask was "a preview option on hover". A preview that OPENS on hover would fire while a reader
   is on their way somewhere else, cover the page they were reading, and be impossible to use on a
   touch screen, which has no hover at all. So hover reveals a badge — pure CSS, see
   `.cs-preview-hint` — and the click opens the overlay. On touch there is no badge and the tap
   still works, which is the same behaviour without the affordance rather than a dead feature.

   ---- ⚠ ZOOM IS A TRANSFORM ON A STATIC `<img>`, NOT `next/image` ------------------------------

   The overlay renders a plain `<img>` at the source's natural size. `next/image` optimises for a
   LAYOUT slot, and the whole point here is that the reader chooses the scale — an optimiser sizing
   to a box the user is about to change is working against the feature. The tiles on the page stay
   `next/image`; only the overlay opts out, and it is the one place the full-resolution file is
   wanted.

   ---- WHAT IS DELIBERATELY NOT HERE ----------------------------------------------------------

   No next/previous, no filmstrip, no gallery. `docs/gallery-lightbox.html` specifies those for a
   separate `/gallery` page with its own collection and its own three open questions. This is a
   reader inspecting the image in front of them, and a browse control would imply a set that this
   feature does not have.
============================================================================================ */

/** What a previewable image carries. Read off the DOM, so a server component can opt in with
 *  attributes alone and nothing here needs to know which block rendered it. */
type Shot = { src: string; alt: string };

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const STEP = 0.5;

export default function ImagePreview() {
  const [shot, setShot] = useState<Shot | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const prefersReduced = useReducedMotion();

  const close = useCallback(() => {
    setShot(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    /* Focus goes back where it came from. A dialog that dumps focus at the top of the document
       makes a keyboard reader re-traverse the whole page to get back to the image they opened. */
    restoreFocus.current?.focus();
    restoreFocus.current = null;
  }, []);

  /* ⚠ THE PROVIDER DECLARES THE FEATURE, AND THE BADGE IS GATED ON THAT DECLARATION. Images emit
     `data-preview-src` unconditionally — a server component cannot know whether the study opted in
     without threading a flag through six block components — so the switch lives here instead. The
     hover badge is `display: none` unless this attribute is present, which means THE BADGE CANNOT
     APPEAR WITHOUT THE THING THAT MAKES IT WORK.

     ⚠ THE ALTERNATIVE WAS A PROP THREADED THROUGH `SectionRenderer` AND EVERY BLOCK, and it would
     have been six files of plumbing for a boolean, with six chances to miss one — a badge on an
     image whose click does nothing, which is worse than no badge. */
  useEffect(() => {
    document.documentElement.dataset.imagePreview = "on";
    return () => { delete document.documentElement.dataset.imagePreview; };
  }, []);

  /* ⚠ ONE DELEGATED LISTENER ON THE DOCUMENT. `closest` walks up from whatever was clicked, so the
     hit target is the whole image box rather than a badge a reader has to aim at. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const host = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-preview-src]");
      if (!host) return;
      /* An image inside a link would otherwise navigate AND open the overlay. */
      e.preventDefault();
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setShot({
        src: host.dataset.previewSrc ?? "",
        alt: host.dataset.previewAlt ?? "",
      });
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* ⚠ THE PAGE MUST NOT SCROLL BEHIND THE OVERLAY, and the restore is unconditional. An early
     return between setting and clearing this leaves the whole site unscrollable, which is the
     worst failure this component can have and the cheapest to prevent. */
  useEffect(() => {
    if (!shot) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [shot]);

  useEffect(() => {
    if (!shot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "+" || e.key === "=") { setZoom((z) => Math.min(MAX_ZOOM, z + STEP)); return; }
      if (e.key === "-" || e.key === "_") { setZoom((z) => Math.max(MIN_ZOOM, z - STEP)); return; }
      if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); return; }
      /* ⚠ FOCUS IS TRAPPED BY WRAPPING WITHIN THE DIALOG'S OWN CONTROLS. Without this, Tab walks
         out of an overlay covering the page and into a document the reader cannot see. */
      if (e.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>("[data-preview-dialog] button")
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shot, close]);

  /* Zoom resets the pan when it returns to fit, so a reader cannot end up at 1x looking at an
     offset that has nowhere to go. */
  const setZoomSafe = useCallback((next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoom(z);
    if (z === 1) setPan({ x: 0, y: 0 });
  }, []);

  if (!shot) return null;

  return (
    <div
      data-preview-dialog
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt || "Image preview"}
      className="fixed inset-0 z-[100] flex flex-col bg-band-dark/95 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <span className="mr-auto truncate font-mono text-[11px] text-on-dark-muted">
          {shot.alt || "Image"}
        </span>
        {([
          ["Zoom out", () => setZoomSafe(zoom - STEP), zoom <= MIN_ZOOM, "−"],
          ["Reset zoom", () => setZoomSafe(1), zoom === 1, `${Math.round(zoom * 100)}%`],
          ["Zoom in", () => setZoomSafe(zoom + STEP), zoom >= MAX_ZOOM, "+"],
        ] as const).map(([label, fn, disabled, glyph]) => (
          <button
            key={label}
            type="button"
            onClick={fn}
            disabled={disabled}
            aria-label={label}
            className="min-w-[44px] rounded-full border border-on-dark/20 px-3 py-1.5 font-mono text-[12px] text-on-dark disabled:opacity-40"
          >
            {glyph}
          </button>
        ))}
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close preview"
          className="rounded-full border border-on-dark/20 px-3 py-1.5 font-mono text-[12px] text-on-dark"
        >
          Esc
        </button>
      </div>

      <div
        className="flex flex-1 items-center justify-center overflow-hidden p-4"
        style={{ cursor: zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "default" }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          dragging.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setPan({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
        }}
        onPointerUp={() => { dragging.current = null; }}
        /* ⚠ CTRL-WHEEL ONLY, so an ordinary trackpad scroll still reaches the page's own
           scroll-lock rather than silently zooming an image the reader was scrolling past. */
        onWheel={(e) => { if (e.ctrlKey) setZoomSafe(zoom - Math.sign(e.deltaY) * STEP); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- see the header: the overlay wants
            the full-resolution file at a scale the READER chooses, which is the one thing an
            optimiser sizing to a layout slot cannot give. */}
        <img
          src={shot.src}
          alt={shot.alt}
          draggable={false}
          /* ⚠ NO `max-w-full` — the unlayered `img, video` reset at globals.css:1597 already sets
             `max-width: 100%`, so the utility asks for what the element already draws and
             `cascade-public` counts it as inert. `max-h-full` is NOT in that reset and is doing
             real work, which is why only one of the pair goes. */
          className="max-h-full select-none object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: prefersReduced || dragging.current ? "none" : "transform .18s ease-out",
          }}
        />
      </div>

      <p className="shrink-0 px-4 pb-3 text-center font-mono text-[10px] text-on-dark-muted">
        scroll with ctrl to zoom · drag to pan · + − 0 · esc to close
      </p>
    </div>
  );
}
