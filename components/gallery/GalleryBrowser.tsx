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
//
// ---- ⚠ TWO ZERO STATES, TWO SENTENCES, AND THE FIRST ONE ONLY EXISTS BECAUSE THIS MOUNTS -----
//
// The page used to early-return a bare sentence when the collection was empty, so this component
// never mounted and there was NO FILTER ROW AT ALL until the first upload. The controls now ship in
// the empty state — disabled, so they say "there is nothing to filter" rather than appearing from
// nowhere later — and that mount is precisely what makes the category sentence reachable with
// nothing selected. Answering "why is this page blank" with "nothing in THAT CATEGORY" is the
// filtered message answering the unfiltered question.
import { useMemo, useState } from "react";
import GalleryTile from "./GalleryTile";
import GalleryLightbox from "./GalleryLightbox";
import {
  GALLERY_KINDS,
  galleryCounts,
  galleryChipDisabled,
  galleryEmptyMessage,
} from "@/lib/studio/gallery-format";
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
     nothing.

     ⚠ AND THE FILTER AND THE POPULATION COME FROM THE LEAF, WHICH THE HERO ALSO CALLS. The fact
     row above and these chips display the same four numbers about 40px apart; they are kept
     because they do different jobs — a claim about the collection, and controls that carry counts
     — but two jobs must not be two derivations, or the page can contradict itself in one
     screenful. */
  const { shown: withImage, all: allCount, byKind } = useMemo(() => galleryCounts(items), [items]);
  const counts = useMemo<Record<string, number>>(
    () => ({ all: allCount, ...byKind }),
    [allCount, byKind]
  );

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
      {/* ⚠ A CONTROL ROW CENTRES; A CONTENT GRID FILLS. THIS IS THE WHOLE ALIGNMENT RULE AND IT IS
          WRITTEN HERE BECAUSE THE NEXT PERSON WILL OTHERWISE CENTRE THE MASONRY FOR CONSISTENCY AND
          GET A RAGGED LAST ROW. The chips and the zero-state sentence are centred to sit under the
          centred hero — the filter row is the first thing beneath it and reads as part of it
          whatever the file boundary says. The masonry below stays left and column-based, because a
          grid that centres cannot fill its measure and its final row goes ragged. */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <div
          role="group"
          aria-label="Filter by kind"
          /* ⚠ SQUARED ON `.work-filter`'s PRECEDENT, which carries no radius at all since the nav
             ruling. Two chip groups on one site, the same contract — `role="group"` with
             `aria-pressed` and an accent fill — and they drew different corners. */
          className="flex gap-0.5 border border-border bg-surface p-[3px]"
        >
          {(["all", ...GALLERY_KINDS] as const).map((k) => {
            const on = kind === k;
            /* ⚠ THE PREDICATE TAKES THE COLLECTION COUNT, NEVER THIS CHIP'S OWN. It lives in the
               leaf so a suite can CALL it — the decision it protects is recorded at the top of
               this file, and `counts[k] === 0` is the one-liner that would silently reverse it. */
            const disabled = galleryChipDisabled(k, allCount);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => chooseKind(k)}
                /* ⚠ THE PRESSED PAIR IS STATED EXPLICITLY — accent fill, `on-accent` label — rather
                   than left to inherit. The work filter's own entry records why: a chip that draws
                   an accent ground and inherits its foreground is the one shape the role layer
                   cannot check, because no cascade walk reaches a ground painted by a sibling. */
                className={`sheet-mono-label px-3.5 py-2 transition-colors ${
                  on
                    ? "bg-accent font-medium text-on-accent"
                    : "text-text-subtle hover:text-text-lead"
                } ${disabled ? "cursor-not-allowed opacity-40 hover:text-text-subtle" : ""}`}
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
        /* ⚠ TWO ZERO STATES, AND THE BRANCH IS ON WHAT THE READER ASKED FOR RATHER THAN ON WHAT
           CAME BACK. `shown.length === 0` is true in both, so the count cannot tell them apart —
           only `kind` knows whether a filter is narrowing anything. With `all` selected the empty
           result IS the collection, and saying "in that category" would answer a question the
           reader never asked. */
        <p className="mt-10 text-center text-[14px] text-text-subtle">
          {galleryEmptyMessage(kind, (k) => KIND_LABEL[k] ?? k)}
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
           renders on the page, so the site's own viewport breakpoint is the right instrument.

           ⚠ AND IT IS NOT CENTRED, DELIBERATELY — see the alignment note on the filter row above.
           The chips centre because a control row is a cluster; this fills because a grid that
           centres cannot fill its measure and its last row goes ragged. */
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
