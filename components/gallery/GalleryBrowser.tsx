"use client";

// The gallery's client half — the filter, the masonry, and which item is open.
//
// ---- ⚠ THE FILTER DRIVES THE OVERLAY'S BROWSE ORDER, WHICH IS THE CONTRACT'S OWN SENTENCE -----
//
// "filters that drive the browse order inside the overlay". So the lightbox is handed the FILTERED
// list, not the whole collection, and arrowing from the last photograph wraps to the first
// photograph rather than escaping into a drawing the reader has filtered out. An overlay that
// browses a different set from the page behind it is two answers to "what am I looking at".
//
// ---- ⚠ THE COUNTS ARE ON THE CHIPS, AND AN EMPTY BUCKET IS SHOWN AT ZERO RATHER THAN HIDDEN ---
//
// The same argument the blog's status tabs settled: a chip reading "Drawings 0" is not a dead
// button, it is the answer to "are there any drawings?" — available without a click, on load. A
// hidden chip makes that answer reachable only by noticing an absence, which is the one thing a
// reader cannot do. What it must not do is strand them, so choosing an empty bucket lands on an
// empty state that says so in words.
import { useMemo, useState } from "react";
import GalleryTile from "./GalleryTile";
import GalleryLightbox from "./GalleryLightbox";
import { GALLERY_KINDS } from "@/lib/studio/gallery-format";
import type { GalleryItem } from "@/lib/keystatic";

/** Reader-facing names for the three machine tokens. The overlay carries its own copy for its spec
 *  grid, and they are deliberately not shared: three words with two consumers is not a module, and
 *  the two surfaces are free to word them differently if one ever needs to. */
const KIND_LABEL: Record<string, string> = {
  photo: "Photographs",
  illus: "Drawings",
  proj: "Studies",
};

/** How many tiles opt out of lazy loading. Four is one masonry row at the wide layout, so the
 *  above-the-fold row is eager and everything below it is not — which is what keeps the initial
 *  transfer proportional to what a reader can actually see. */
const EAGER_TILES = 4;

export default function GalleryBrowser({ items }: { items: readonly GalleryItem[] }) {
  const [kind, setKind] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /* ⚠ ONLY ITEMS WITH AN IMAGE REACH THE GRID. `galleryPublishBlockers` refuses to publish one
     without, so this is defence rather than a live case — but the read path must not depend on the
     write path having been correct, and a null src renders as a broken tile rather than as
     nothing. */
  const withImage = useMemo(() => items.filter((i) => i.image), [items]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: withImage.length };
    for (const k of GALLERY_KINDS) map[k] = withImage.filter((i) => i.kind === k).length;
    return map;
  }, [withImage]);

  const shown = useMemo(
    () => (kind === "all" ? withImage : withImage.filter((i) => i.kind === kind)),
    [withImage, kind]
  );

  /* ⚠ CHANGING THE FILTER CLOSES THE OVERLAY, AND THE ALTERNATIVE IS WORSE THAN IT LOOKS. The
     index addresses the FILTERED list, so re-filtering while open would leave it pointing at a
     different item, or past the end. Remapping the open item into the new list is the other
     option and it is wrong for a plainer reason: the reader just asked to see a different set, so
     holding one item from the old set in front of them ignores what they asked for. */
  function chooseKind(next: string) {
    setKind(next);
    setOpenIndex(null);
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter by kind"
          className="flex gap-0.5 rounded-full border border-border bg-surface p-[3px]"
        >
          {(["all", ...GALLERY_KINDS] as const).map((k) => {
            const on = kind === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => chooseKind(k)}
                /* ⚠ THE PRESSED PAIR IS STATED EXPLICITLY — accent fill, `on-accent` label — rather
                   than left to inherit. The work filter's own entry records why: a chip that draws
                   an accent ground and inherits its foreground is the one shape the role layer
                   cannot check, because no cascade walk reaches a ground painted by a sibling. */
                className={`rounded-full px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.13em] transition-colors ${
                  on
                    ? "bg-accent-500 font-medium text-on-accent"
                    : "text-text-subtle hover:text-text-lead"
                }`}
              >
                {k === "all" ? "All" : KIND_LABEL[k] ?? k}{" "}
                <span aria-hidden className="opacity-60">
                  {counts[k] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        {/* The live region announces the filtered count, so a screen-reader user learns the grid
            changed size without having to traverse it. */}
        <p role="status" aria-live="polite" className="text-[12px] text-text-subtle">
          {shown.length} {shown.length === 1 ? "item" : "items"}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-[14px] text-text-subtle">
          Nothing here yet in that category.
        </p>
      ) : (
        /* ⚠ `columns` MASONRY, AND EVERY TILE DECLARES ITS ASPECT — see `GalleryTile`. Without the
           declared sizes this layout reflows on every load, which is the contract's own stated
           dishonesty about its generated-SVG mock.

           ⚠ AND THE BREAKPOINT IS THE SITE'S 1024, NOT THE CONTRACT'S 760. The mock switches
           columns at 760; this project's standing rule is that the whole site goes mobile at once
           at `lg`, and a grid that reflows at a width nothing else on the page reacts to is a
           second breakpoint nobody declared. Unlike the overlay's container query — which exists
           because that component renders in a pane as well as a viewport — this grid only ever
           renders on the page, so the site's own viewport breakpoint is the right instrument. */
        <div className="mt-5 columns-2 gap-2.5 lg:columns-4 lg:gap-3.5">
          {shown.map((item, i) => (
            <div key={item.slug} className="break-inside-avoid">
              <GalleryTile item={item} index={i} onOpen={setOpenIndex} priority={i < EAGER_TILES} />
            </div>
          ))}
        </div>
      )}

      <GalleryLightbox
        items={shown}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
