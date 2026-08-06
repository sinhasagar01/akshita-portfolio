"use client";

// The LIST view's post. List answers "what state is everything in" — denser, and it fits a dozen
// posts where the grid fits four. A blog grows; the list is what it grows into.
//
// ---- ⚠ ONE GRID, FOUR EXPLICIT TRACKS, NOT NESTED FLEX ---------------------------------------
//
//     auto   1fr    auto     auto      auto
//     thumb  TEXT   status   meta      remove
//
// ONE FLEXIBLE TRACK AND NO MORE. Every other element is its own content width, so there is no
// second place for space to go and nothing negotiates. The case-studies index shipped the
// opposite twice: nested flex let a control expand to fill its row, squeezing the title onto two
// lines and truncating the summary to one word, and `flex: 0 0 auto` at each level did not fix
// it because the fragility was the structure.
// `min-w-0` ON THE TEXT TRACK IS LOAD-BEARING. A grid item's automatic minimum size is its
// CONTENT, so without the floor a long title pushes the `1fr` track past its share and the
// truncation never engages — the row just overflows instead.
//
// THE CONTRACT DRAWS FOUR TRACKS; THIS HAS FIVE, and the fifth is not an embellishment. The row
// carries a REMOVE button today — it is in the index this replaces — so the control needs a track
// of its own rather than being folded into the meta, which is exactly the fold that let a cluster
// stretch next door.
import type { BlogCard } from "@/lib/keystatic";
import { formatShortDate } from "@/lib/blog/format";
import { activationProps, HeroPlate, ITEM_FOCUS, stopAll } from "./CaseStudyItem";
import BlogStatusChip, { isPublished } from "./BlogStatusChip";
import { IconX } from "./icons";

export default function BlogPostRow({
  post,
  onOpen,
  onRemove,
}: {
  post: BlogCard;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const draft = !isPublished(post.status);
  return (
    <div
      {...activationProps(onOpen, `Edit ${post.title}`)}
      className={`group grid cursor-pointer items-center gap-[15px] rounded-[var(--studio-radius-card,8px)] border-0 border-l-[3px] bg-studio-cream-50 py-2.5 pl-2.5 pr-3.5 [grid-template-columns:auto_1fr_auto_auto_auto] ${
        draft ? "border-l-draft-600" : "border-l-transparent"
      } shadow-[var(--studio-lift-rest,0_1px_2px_oklch(14%_0.018_60/0.06))] transition-[box-shadow,transform,border-color] duration-[var(--studio-lift-t,200ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] hover:-translate-y-[2px] hover:shadow-[var(--studio-lift-hover,0_2px_4px_oklch(14%_0.018_60/0.07))] motion-reduce:hover:translate-y-0 ${ITEM_FOCUS}`}
    >
      {/* 1 · the thumb, with the same empty marker the card uses */}
      <span className="relative block">
        <HeroPlate
          src={post.heroImage}
          className="h-[44px] w-[64px] rounded-[var(--studio-radius-control,4px)]"
        />
        {!post.heroImage && (
          <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="size-[15px] rounded-[3px] border-[1.5px] border-dashed border-studio-ink-400" />
          </span>
        )}
      </span>

      {/* 2 · the text — the only flexible track, with the floor its truncation depends on */}
      <div className="min-w-0">
        <h2 className="truncate text-[16.5px] text-studio-ink-950">{post.title}</h2>
        {/* A `span`, not a `p` — the unlayered `p` reset would override `leading-snug` and impose
            its own `max-width: 68ch`, a second measure fighting the row's own track. */}
        <span className="block truncate text-[12px] leading-snug text-studio-text-subtle">
          {post.dek || "No summary yet"}
        </span>
      </div>

      {/* 3 · status */}
      <BlogStatusChip status={post.status} />

      {/* 4 · the meta — its own grid, so it cannot stretch either */}
      <div className="hidden grid-flow-col items-center gap-2.5 whitespace-nowrap text-[11.5px] leading-none text-studio-ink-600 md:grid">
        <span>{post.date ? formatShortDate(post.date) : "No date"}</span>
        <span>{post.readingTime} min</span>
        {post.topic && <span>{post.topic}</span>}
      </div>

      {/* 5 · remove. `stopPropagation` on BOTH handlers, or removing a post also opens it — and
             the keyboard path activates the row through its own `onKeyDown`, which `onClick`
             never sees. */}
      <button
        type="button"
        aria-label={`Remove ${post.title}`}
        onClick={(e) => {
          stopAll(e);
          onRemove();
        }}
        onKeyDown={stopAll}
        className="grid size-[26px] place-items-center rounded-[var(--studio-radius-control,4px)] text-studio-ink-400 opacity-0 transition-opacity hover:bg-studio-cream-200 hover:text-studio-ink-950 focus-visible:opacity-100 group-hover:opacity-100 [&>svg]:size-3.5"
      >
        <IconX />
      </button>
    </div>
  );
}
