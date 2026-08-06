"use client";

// The LIST view's item. List answers "WHAT ORDER ARE THEY IN" — so the ordinal leads, the
// arrows are beside it, and the row is one line per study with no wrap.
//
// ---- ⚠ THE ROW IS ONE GRID WITH SEVEN EXPLICIT TRACKS, NOT NESTED FLEX ----------------------
//
//     auto  auto  auto  1fr   auto  auto  auto
//     grip  ord   thumb TEXT  meta  order remove
//
// SIX CONTENT TRACKS AND EXACTLY ONE FLEXIBLE ONE. Every element is either its own content width
// or the single flexible column, so there is NO SECOND PLACE FOR SPACE TO GO and nothing
// negotiates. The first attempt nested three flex contexts and the reorder cluster stretched to
// fill the row — see `CaseStudyItem.tsx`, where the cluster's stated box lives with the full
// account of why declarations could not fix it.
//
// `min-w-0` ON THE TEXT TRACK IS LOAD-BEARING, not defensive. A grid item's automatic minimum
// size is its CONTENT, so a long title would push the `1fr` track wider than its share and the
// truncation would never engage — the row would simply overflow instead. This is the one place
// where the flexible track needs a floor stated, and it is why `truncate` below works at all.
import type { ProjectListItem } from "@/lib/keystatic";
import {
  activationProps,
  HeroPlate,
  ITEM_FOCUS,
  PlatformTag,
  ReorderCluster,
  SectionCount,
  stopAll,
} from "./CaseStudyItem";
import { IconX } from "./icons";

export default function CaseStudyRow({
  item,
  index,
  total,
  ordinal,
  busy,
  onOpen,
  onMove,
  onRemove,
}: {
  item: ProjectListItem;
  index: number;
  total: number;
  /** Pre-formatted "01".."04" — the page's subject, so it reads as a rank rather than a count. */
  ordinal: string;
  busy: boolean;
  onOpen: () => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {

  return (
    <div
      {...activationProps(onOpen, `Edit ${item.title}`)}
      className={`grid cursor-pointer items-center gap-[15px] rounded-[var(--studio-radius-card,8px)] border-0 border-l-[3px] border-l-transparent bg-studio-cream-50 py-3 pl-2.5 pr-3.5 [grid-template-columns:auto_auto_auto_1fr_auto_auto_auto] shadow-[var(--studio-lift-rest,0_1px_2px_oklch(14%_0.018_60/0.06))] transition-[box-shadow,transform,border-color] duration-[var(--studio-lift-t,200ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] hover:-translate-y-[2px] hover:shadow-[var(--studio-lift-hover,0_2px_4px_oklch(14%_0.018_60/0.07))] motion-reduce:hover:translate-y-0 ${ITEM_FOCUS}`}
    >
      {/* 1 · THE GRIP IS DECORATIVE TODAY AND THAT IS DELIBERATE, NOT AN OVERSIGHT.
             This project has no drag anywhere, and real drag is pointer capture, a drop
             indicator, touch, and a keyboard equivalent. The ARROWS ALREADY ARE that keyboard
             equivalent, which is why they stay rather than being replaced — and why drag can be
             deferred without the list losing a capability. `aria-hidden` so no assistive tech
             announces a control that does nothing; the track stays so wiring it later is
             additive rather than a re-layout. Recorded in STATE as deferred. */}
      <span aria-hidden className="grid grid-cols-2 gap-[3px] p-0.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="size-[3px] rounded-full bg-studio-ink-400" />
        ))}
      </span>

      {/* 2 · the ordinal — the page's subject, so it leads */}
      <span className="w-[34px] text-center font-display text-[26px] italic leading-none text-studio-ink-400">
        {ordinal}
      </span>

      {/* 3 · the thumbnail */}
      <HeroPlate
        src={item.heroImage}
        className="h-[40px] w-[64px] rounded-[var(--studio-radius-control,4px)]"
      />

      {/* 4 · the text — the only flexible track, with the floor its truncation depends on */}
      <div className="min-w-0">
        {/* NO `font-display font-normal leading-tight` HERE. globals.css's unlayered `h1, h2`
            rule already sets all three — plus `opsz 144` and `tracking-tight`, which no utility
            here was replicating — so those classes were INERT: correct on screen, and an edit to
            them would have done nothing. `studio-cascade` C2 exists to catch exactly that, and
            deleting them is the honest answer rather than adding three more to its inventory. */}
        <h2 className="truncate text-[17px] text-studio-ink-950">
          {item.title}
        </h2>
        {/* A `span` for the same reason the card's is — the unlayered `p` reset would override
            `leading-snug` and also impose its own `max-width: 68ch`, which is a second measure
            fighting the one this page already states. */}
        <span className="block truncate text-[12.5px] leading-snug text-studio-text-subtle">
          {item.summary || "No summary yet"}
        </span>
      </div>

      {/* 5 · the meta — its own grid, so the chips cannot stretch either */}
      <div className="hidden items-center gap-3 whitespace-nowrap md:grid md:grid-flow-col">
        <PlatformTag template={item.template} />
        <SectionCount count={item.sectionCount} className="text-[11.5px] leading-none" />
      </div>

      {/* 6 · reorder */}
      <ReorderCluster
        orientation="column"
        title={item.title}
        atStart={index === 0}
        atEnd={index === total - 1}
        busy={busy}
        onMove={onMove}
      />

      {/* 7 · remove */}
      <button
        type="button"
        aria-label={`Remove ${item.title}`}
        onClick={(e) => {
          stopAll(e);
          onRemove();
        }}
        onKeyDown={stopAll}
        className={`grid size-[26px] place-items-center rounded-[var(--studio-radius-control,4px)] text-studio-ink-400 transition-colors [&>svg]:size-3.5 ${
          "hover:bg-studio-cream-200 hover:text-studio-ink-950"
        }`}
      >
        <IconX />
      </button>
    </div>
  );
}
