"use client";

// The GRID view's item. Grid answers "WHAT DO THEY LOOK LIKE" — so the hero is the card, at the
// 16:10 the case-study heroes are actually stored at.
//
// ---- THE CARD IS ELEVATED, NOT BORDERED -----------------------------------------------------
//
// Cream-50 cards on a cream-100 well, because a card on the SAME ground has nothing to lift off.
// The studio page is cream-50 (`layout.tsx`'s `<main>`), so the ladder here is
// cream-50 page -> cream-100 well -> cream-50 card: the card returns to the page's own value but
// sits on a step down from it. That is the Board's language exactly, so the two surfaces agree,
// and it is what the ground ladder means by a field surface holding cards.
//
// THE ELEVATION IS ALREADY DECLARED AND NOTHING NEW IS ADDED HERE. #267 declared
// `--studio-lift-rest / -hover / -active` by ROLE, and their values are byte-identical to what
// this card wants. Declaring a second scale beside them is the duplicate-token shape; the
// warning about three literals was already answered from the other side.
//
// ---- ⚠ THE FOOT IS A GRID, `1fr auto` -------------------------------------------------------
//
// The meta takes the flexible track and the reorder cluster is its own stated box. Nothing
// negotiates — see `CaseStudyItem.tsx` for why nested flex could not be repaired by adding
// declarations to it.
//
// ---- THE SUMMARY RESERVES ITS TWO LINES -----------------------------------------------------
//
// `line-clamp-2` sets the budget and `h-[36px]` (12px x 1.5 x 2) RESERVES it whether or not the
// text fills it, so a short summary cannot shorten its card and misalign the row.
// MEASURED AGAINST REAL CONTENT: the four summaries are 114 / 140 / 150 / 165 characters, and
// two lines at this width hold roughly 95. So ALL FOUR clamp today and the box is always full —
// the reserve is guarding the NEXT summary, not these. Worth knowing that the contract's own
// mock quietly shortened the Data Profiling summary; the real one ellipsises.
import type { ProjectListItem } from "@/lib/keystatic";
import {
  activationProps,
  HeroPlate,
  ITEM_FOCUS,
  PlatformTag,
  ReorderCluster,
  SectionCount,
} from "./CaseStudyItem";

export default function CaseStudyCard({
  item,
  index,
  total,
  busy,
  onOpen,
  onMove,
}: {
  item: ProjectListItem;
  index: number;
  total: number;
  busy: boolean;
  onOpen: () => void;
  onMove: (direction: "up" | "down") => void;
}) {

  return (
    <div
      {...activationProps(onOpen, `Edit ${item.title}`)}
      // `border-0 border-l-[3px]` is per-side longhand ON PURPOSE. The shorthand `border` plus a
      // per-side colour is hazard 26 — two declarations for one property whose winner is decided
      // by sheet order. The Board card carries the same pair for the same reason.
      className={`grid cursor-pointer grid-rows-[auto_1fr] overflow-hidden rounded-[var(--studio-radius-card,8px)] border-0 border-l-[3px] border-l-transparent bg-studio-cream-50 shadow-[var(--studio-lift-rest,0_1px_2px_oklch(14%_0.018_60/0.06))] transition-[box-shadow,transform,border-color] duration-[var(--studio-lift-t,200ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] hover:-translate-y-[3px] hover:shadow-[var(--studio-lift-hover,0_2px_4px_oklch(14%_0.018_60/0.07))] motion-reduce:hover:translate-y-0 ${ITEM_FOCUS}`}
    >
      <HeroPlate src={item.heroImage} className="aspect-[16/10] w-full" />

      <div className="grid content-start gap-1.5 px-3.5 pb-3.5 pt-3">
        {/* See CaseStudyRow — the unlayered `h1, h2` rule already supplies the family, weight and
            leading, so stating them again would be three utilities that cannot be edited. */}
        <h2 className="truncate text-[17px] text-studio-ink-950">
          {item.title}
        </h2>
        {/* A `span`, NOT A `p`, AND THE RESERVE IS WHY. globals.css carries an UNLAYERED
            `p { line-height: var(--leading-relaxed) }`, which beats any `leading-*` utility — so
            as a `p` this rendered 1.7, two lines came to 40.8px, and the 36px box CLIPPED THE
            SECOND LINE. The height was derived from a line-height that never applied.
            `studio-cascade` C1 found it, and it is the exact failure that suite exists for: the
            class string was right and the box was wrong. */}
        <span className="line-clamp-2 block h-[36px] text-[12px] leading-[1.5] text-studio-text-subtle">
          {item.summary || "No summary yet"}
        </span>

        <div className="mt-[5px] grid grid-cols-[1fr_auto] items-center gap-2.5">
          <div className="grid min-w-0 grid-flow-col justify-start gap-2 overflow-hidden whitespace-nowrap">
            <PlatformTag template={item.template} />
            <SectionCount count={item.sectionCount} className="text-[11px] leading-none" />
          </div>
          <ReorderCluster
            orientation="row"
            title={item.title}
            atStart={index === 0}
            atEnd={index === total - 1}
            busy={busy}
            onMove={onMove}
          />
        </div>
      </div>
    </div>
  );
}
