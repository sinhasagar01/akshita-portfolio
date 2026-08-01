"use client";

// The parts the Grid card and the List row BOTH carry — the activation contract, the reorder
// cluster, and the three meta pieces. One owner, because the two views are two presentations of
// the same content and a defect fixed in one would otherwise survive in the other.
//
// ---- ⚠ NEITHER THE CARD NOR THE ROW MAY BE A `<button>` -------------------------------------
//
// Both are clickable AND both CONTAIN buttons — two arrows and, in the list, remove. A button
// inside a button is an invalid content model: the parser closes the outer one early and the
// rest of the row becomes its SIBLING, which scatters the layout. #176 found this as a button
// inside an anchor; this is the same defect on a new surface.
//
// So each is a `div` with `role="button"` and `tabIndex={0}`. THAT DIV GETS NOTHING FOR FREE,
// and every one of these has to be authored:
//   - a focus ring. `:focus-visible` still MATCHES on a tabindexed div, but the UA stylesheet
//     draws no outline for it, so without this the keyboard path is invisible.
//   - Space AND Enter. A real button fires click on both; a role-button div fires neither.
//     Space additionally scrolls the page, so it must preventDefault.
//   - `stopPropagation` on every inner control, or a reorder click ALSO opens the study.
// No gate in this repo would catch a mouse-only card, which is why the driven check presses
// real keys rather than reading the class string.
import type { KeyboardEvent, MouseEvent } from "react";
import { draftImageUrl } from "@/lib/studio/draft-image";
import { IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight } from "./icons";

/**
 * The activation contract, in one place so the card and the row cannot disagree about it.
 * Spread onto the clickable element.
 */
export function activationProps(onOpen: () => void, label: string) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      // A real <button> fires click for both of these. This element fires neither.
      if (e.key === "Enter" || e.key === " ") {
        // Space scrolls the page by default, and the scroll happens even though the handler
        // navigates — the two are not exclusive.
        e.preventDefault();
        onOpen();
      }
    },
  };
}

/** The authored ring. A tabindexed div matches `:focus-visible` but the UA draws nothing. */
export const ITEM_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500";

/**
 * Swallow a control's click so it cannot also activate the row or card behind it.
 * Both handlers are needed: the keyboard path activates the ancestor through `onKeyDown`, which
 * `onClick` never sees.
 */
export function stopAll(e: MouseEvent | KeyboardEvent) {
  e.stopPropagation();
}

/* ============================================================================================
 * THE REORDER CLUSTER — A STATED BOX, NOT A NEGOTIATED ONE
 *
 * ⚠ THIS IS THE DEFECT THAT SHIPPED TWICE. The first attempt nested three flex contexts — the
 * row, its right-hand group and this cluster — and the cluster STRETCHED TO FILL THE ROW,
 * squeezing the title onto two lines and truncating the summary to a single word. Adding
 * `flex: 0 0 auto` at each level did not fix it, because the fragility was the STRUCTURE rather
 * than any one declaration.
 * So the box is STATED: an explicit width and height, with explicit tracks inside. It cannot
 * grow regardless of what contains it, and there is no declaration to forget.
 * THIS IS #178's `w-0` COMPUTING TO 264px, LEARNED PROPERLY — a correct class string is not a
 * correct layout. State the box; do not keep adding declarations that ask for it.
 * AND THE GATE FOR IT IS A MEASUREMENT, NOT A CLASS-STRING CHECK: a class-string assertion
 * passed on every broken version of this.
 *
 * ---- WHY THE DIRECTIONS DIFFER BY VIEW, WHICH IS NOT AN INCONSISTENCY ----------------------
 * The list is ONE COLUMN AND DOES NOT WRAP, so up and down mean exactly what they say. The grid
 * WRAPS, so the study before a row's first card is visually to its LEFT — an up arrow there
 * would move the card to the END of the previous row, which reads as a jump rather than a step.
 * Each control matches its own layout.
 * THE HANDLER IS THE SAME ONE. `useListReorder.moveItem` is index-based (`up` is i-1, `down` is
 * i+1), so only the glyph and the label change. Nothing about the move differs.
 * BOTH ENDS ARE `disabled`, NEVER ABSENT, so the cluster keeps its width at the ends of the
 * list and no control ever moves between items.
 * ========================================================================================== */
export function ReorderCluster({
  orientation,
  title,
  atStart,
  atEnd,
  busy,
  onMove,
}: {
  /** `column` is the list's ▲/▼; `row` is the grid's ◀/▶. */
  orientation: "column" | "row";
  title: string;
  atStart: boolean;
  atEnd: boolean;
  busy: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  const column = orientation === "column";
  const steps = [
    {
      dir: "up" as const,
      icon: column ? <IconChevronUp /> : <IconChevronLeft />,
      label: column ? `Move ${title} up` : `Move ${title} earlier`,
      off: atStart,
    },
    {
      dir: "down" as const,
      icon: column ? <IconChevronDown /> : <IconChevronRight />,
      label: column ? `Move ${title} down` : `Move ${title} later`,
      off: atEnd,
    },
  ];
  return (
    <div
      // The stated box. 26x48 stacked, 52x24 side by side — width AND height, with the tracks
      // written out, so nothing here can be resolved by whatever contains it.
      className={`grid shrink-0 overflow-hidden rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 ${
        column
          ? "h-[48px] w-[26px] [grid-template-columns:26px] [grid-template-rows:24px_24px]"
          : "h-[24px] w-[52px] [grid-template-columns:26px_26px] [grid-template-rows:24px]"
      }`}
    >
      {steps.map((s, i) => (
        <button
          key={s.dir}
          type="button"
          disabled={s.off || busy}
          aria-label={s.label}
          onClick={(e) => {
            stopAll(e);
            onMove(s.dir);
          }}
          onKeyDown={stopAll}
          className={`grid h-[24px] w-[26px] place-items-center bg-cream-50 text-ink-600 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:text-ink-400/45 [&>svg]:size-3 ${
            i === 1 ? (column ? "border-t border-ink-950/12" : "border-l border-ink-950/12") : ""
          }`}
        >
          {s.icon}
        </button>
      ))}
    </div>
  );
}

/* ============================================================================================
 * THE META — three pieces, both views, same words
 * ========================================================================================== */

/**
 * ⚠ BESPOKE IS NOT DISABLED, AND THE OLD ROW SAID IT WAS.
 *
 * boAt Crest's whole row was `opacity-60` because its sections are hand-built in code. But its
 * TITLE, HERO, SUMMARY and PLATFORM are all editable here — only the BODY is in code. A dimmed
 * row says "you cannot touch this", which is false about four of its five fields.
 * That is HAZARD 29'S SHAPE ONE SCREEN EARLIER: #271 fixed the editor reading as broken, and
 * this is the same claim being made by the index that leads to it. So it is a CHIP at FULL TEXT
 * STRENGTH — the study is different, not lesser.
 */
export function BespokeChip() {
  return (
    <span className="shrink-0 rounded-full border border-accent-500/34 bg-accent-500/[0.07] px-2 py-[3px] text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-accent-600">
      Hand-built
    </span>
  );
}

/** The platform, with its dot. Normalised "web else mobile", the same rule `SegmentedToggle` uses. */
export function PlatformTag({ template }: { template: string }) {
  const web = template === "web";
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[9.5px] font-medium uppercase leading-none tracking-[0.13em] text-ink-600">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${web ? "bg-[oklch(62%_0.13_285)]" : "bg-[oklch(58%_0.17_30)]"}`}
      />
      {web ? "Web" : "Mobile"}
    </span>
  );
}

/**
 * ⚠ "0 SECTIONS" BECOMES "NO SECTIONS", and the difference is what it claims.
 * A zero sitting beside three fifteens reads as a study that LOST its content. "No sections"
 * reads as one built differently — which, for the only study that has none, is the true reading.
 * The rule is on the COUNT, not on the slug, so a genuinely empty new study gets the honest
 * sentence too rather than a zero that looks like a failed load.
 */
export function SectionCount({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`shrink-0 tabular-nums text-ink-600 ${className}`}>
      {count === 0 ? "No sections" : `${count} sections`}
    </span>
  );
}

/**
 * The hero plate. A PLAIN `<img>` THROUGH THE DRAFT PROXY, never `next/image`.
 *
 * STATE:1660's rule: the optimizer refetches the URL server-side WITHOUT the owner cookie, so an
 * optimized proxy URL 401s and the browser sees a 400. `draftImageUrl` tries draft then main, so
 * a hero uploaded this session shows here instead of 404ing until publish.
 * THE COST IS ONE GITHUB ROUND TRIP PER STUDY, which `ImageThumb`'s own comment names as the
 * case that would change its calculus — "proxying MANY images". Four studies is not many. If
 * this index ever holds dozens, the snapshot rewriter (strategy 2) is the answer, not this.
 */
export function HeroPlate({
  src,
  className,
}: {
  src: string | null;
  className: string;
}) {
  return (
    <span className={`relative block overflow-hidden bg-cream-200 ${className}`}>
      {src ? (
        // Decorative: the title sits beside it and says the same thing.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draftImageUrl(src)} alt="" className="absolute inset-0 size-full object-cover" />
      ) : null}
    </span>
  );
}
