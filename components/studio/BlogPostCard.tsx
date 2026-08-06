"use client";

// The GRID view's post. Grid answers "which post is this" — hero-led, so the index reads like
// the blog it edits.
//
// ---- IT IS THE ONLY ARRANGEMENT WHERE A MISSING HERO IS VISIBLE ------------------------------
//
// A draft with no hero shows an empty plate rather than a word. That is a real authoring fact
// the old index could not show at all, because it showed no hero on any post — every one of them
// has a `heroImage` field and none of them rendered it.
// THE PLATE IS ALREADY THE BEHAVIOUR, NOT A NEW BRANCH: `HeroPlate` renders its cream-200 box
// when `src` is null, so a null hero was never a broken image. What is added is the dashed inner
// square, so the empty state reads as "no hero yet" rather than "still loading".
//
// ---- THE BODY IS THREE STATED ROWS, SO A SHORT DEK CANNOT SHORTEN ITS CARD -------------------
//
// `line-clamp-2` sets the budget and the height RESERVES it whether or not the text fills it.
// Without the reserve a one-line dek makes its card shorter than its neighbours and the grid's
// rows stop aligning.
// ⚠ A `span`, NOT A `p`. globals.css carries an UNLAYERED `p { line-height: var(--leading-relaxed) }`
// that beats any `leading-*` utility, so as a `p` the two lines would render at 1.7 and overflow
// a box measured at 1.5 — the second line clipped. That is not hypothetical: it shipped in #275's
// first draft and `studio-cascade` C1 caught it.
import type { BlogCard } from "@/lib/keystatic";
import { formatShortDate } from "@/lib/blog/format";
import { activationProps, HeroPlate, ITEM_FOCUS } from "./CaseStudyItem";
import BlogStatusChip, { isPublished } from "./BlogStatusChip";

export default function BlogPostCard({ post, onOpen }: { post: BlogCard; onOpen: () => void }) {
  const draft = !isPublished(post.status);
  return (
    <div
      {...activationProps(onOpen, `Edit ${post.title}`)}
      // `border-0 border-l-[3px]` is per-side longhand ON PURPOSE — the shorthand plus a per-side
      // colour is hazard 26, two declarations for one property decided by sheet order.
      // THE AMBER BAR IS WHY A DRAFT READS AS DIFFERENT UNDER "All", so the state is legible
      // without reaching for the filter at all.
      className={`grid cursor-pointer grid-rows-[auto_auto] overflow-hidden rounded-[var(--studio-radius-card,8px)] border-0 border-l-[3px] bg-studio-cream-50 ${
        draft ? "border-l-draft-600" : "border-l-transparent"
      } shadow-[var(--studio-lift-rest,0_1px_2px_oklch(14%_0.018_60/0.06))] transition-[box-shadow,transform,border-color] duration-[var(--studio-lift-t,200ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] hover:-translate-y-[3px] hover:shadow-[var(--studio-lift-hover,0_2px_4px_oklch(14%_0.018_60/0.07))] motion-reduce:hover:translate-y-0 ${ITEM_FOCUS}`}
    >
      <span className="relative block">
        <HeroPlate src={post.heroImage} className="aspect-[2/1] w-full" />
        {!post.heroImage && (
          // The empty marker, centred over the plate. `aria-hidden` because the chip beside it
          // already says Draft and the title says which post — a screen reader gains nothing from
          // "there is no image here" that the absence of an image does not already convey.
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <span className="size-[26px] rounded-[4px] border-[1.5px] border-dashed border-studio-ink-400" />
          </span>
        )}
        {/* ⚠ THE CHIP SITS OVER A PHOTOGRAPH, SO IT IS GIVEN A GROUND RATHER THAN INHERITING ONE.
            Measured: the published chip's element behind it is the `<img>` itself, so its 12%
            fill left the label sitting on ARBITRARY PIXELS — a contrast that cannot be measured
            because it changes with every hero. The contract draws it this way and does not say
            what is under it.
            An opaque cream-50 backing makes the ground KNOWN and identical to the list's, so one
            measurement covers both views: 5.4 draft, 6.6 published. */}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-studio-cream-50">
          <BlogStatusChip status={post.status} />
        </span>
      </span>

      <div className="grid content-start gap-1.5 px-3.5 pb-3.5 pt-3">
        {/* No `font-display font-normal leading-tight` — the unlayered `h1, h2` rule already sets
            all three, plus `opsz 144` and `tracking-tight` that no utility here replicates, so
            stating them again would be three utilities that cannot be edited. */}
        <h2 className="line-clamp-2 text-[17px] text-studio-ink-950">{post.title}</h2>
        <span className="line-clamp-2 block h-[36px] text-[12px] leading-[1.5] text-studio-text-subtle">
          {post.dek || "No summary yet"}
        </span>
        <div className="mt-[2px] grid grid-flow-col justify-start gap-2.5 overflow-hidden whitespace-nowrap text-[11px] leading-none text-studio-ink-600">
          <span>{post.date ? formatShortDate(post.date) : "No date"}</span>
          <span>{post.readingTime} min</span>
          {post.topic && <span className="truncate">{post.topic}</span>}
        </div>
      </div>
    </div>
  );
}
