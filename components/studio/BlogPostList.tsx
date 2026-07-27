"use client";

// The three-pane editor's list pane. Search, and navigate to another post.
//
// READ AND NAVIGATE ONLY, and that is a decision rather than an unfinished edge. Creating
// and deleting posts stay on /studio/blog, where they already work — the capture-then-create
// modal, its server-derived slug, and the delete confirmation are a WRITE SURFACE, and
// CLAUDE.md's rule is that a new write surface needs an explicit decision. Rebuilding them
// here would give the same two operations two implementations to keep in step, which is the
// `[slug]/body` failure in miniature. The pane's footer links back to the index for both.
//
// SEARCH STATE IS THIS COMPONENT'S OWN, which is the entire reason the shell collapses the
// pane by width transition instead of unmounting it. Unmounting resets the query, so an
// author who collapsed the rail to read a wide canvas would lose their filter every time.
//
// SELECTION IS THE ROUTE. Each row is a <Link> to /studio/blog/<slug> and the current post
// comes in as a prop, so "which post am I editing" has exactly one answer and the back
// button works. No local selected state to fall out of step with the URL.
import { useMemo, useState } from "react";
import Link from "next/link";
import { filterBlogPosts } from "@/lib/studio/blog-search";
import { formatShortDate } from "@/lib/blog/format";
import type { BlogCard } from "@/lib/keystatic";
import { inputCls } from "./blocks/fields";

export default function BlogPostList({
  posts,
  currentSlug,
}: {
  posts: readonly BlogCard[];
  /** The post open in the canvas. Drives the selected row, and comes from the route. */
  currentSlug: string;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterBlogPosts(posts, query), [posts, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-none border-b border-ink-950/12 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts"
          aria-label="Search posts"
          className={`${inputCls} min-w-0`}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-text-subtle">
            No posts match that search.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {shown.map((p) => {
              const current = p.slug === currentSlug;
              return (
                <li key={p.slug}>
                  <Link
                    href={`/studio/blog/${p.slug}`}
                    // aria-current is the accessible half of the selection language.
                    //
                    // THIS USED TO BE THE ACCENT PILL, AND #167's CONCERN IS RESOLVED RATHER
                    // THAN OVERRULED. #167 rejected an ink fill because a selected row carries
                    // an accent badge and an accent dirty dot, and an ink ground would have
                    // needed inverted variants of both. A 3px bar sits at the EDGE while a
                    // badge sits INLINE, so it marks selection without competing with anything
                    // in the row. The accent tint was the half-measure: measured at 1.103
                    // against this rail's cream-200 ground, it was inside the same 1.05–1.19
                    // band as every plain cream step, which is why selection here was hard to
                    // see at all. The bar reads at 3.43.
                    //
                    // GROUND + 1 STEP. This rail is cream-200 (PR A), so the fill is cream-300.
                    // The value differs per surface because the RULE is what is shared; see
                    // ListDetailLayout for why a fixed hex would have been three bugs.
                    //
                    // `border-l-[3px]` is in the base with `pl-[9px]` absorbing it, so 3 + 9
                    // matches the old 0 + 12 and selection causes no reflow.
                    aria-current={current ? "page" : undefined}
                    className={`flex items-start gap-2.5 border-b border-ink-950/12 border-l-[3px] py-2.5 pl-[9px] pr-3 transition-colors ${
                      current ? "border-l-accent-500 bg-cream-300" : "border-l-transparent hover:bg-cream-100"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        p.status === "published" ? "bg-success-700" : "bg-ink-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      {/* THE INACTIVE BRANCH IS EMPTY BECAUSE IT CARRIED A PHANTOM. It was
                          `text-ink-700`, a token that does not exist (hazard 23), so both
                          branches rendered ink-950 and the distinction this ternary claims
                          has never been on screen. The class is deleted rather than replaced:
                          a post title reads correctly at full ink, and since #209 selection
                          is carried by the fill and the accent bar, not by colour. */}
                      <span
                        className={`block truncate text-[14px] font-medium ${
                          current ? "text-ink-950" : ""
                        }`}
                      >
                        {p.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-text-subtle">
                        {p.status === "published" ? "Published" : "Draft"} ·{" "}
                        {p.date ? formatShortDate(p.date) : "no date"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex-none border-t border-ink-950/12 p-3">
        <Link
          href="/studio/blog"
          // THE COLOUR IS ON THE SPAN, NOT THE LINK — hazard 22. `Link` renders an <a>, and
          // the unlayered `a { color: inherit }` beats any layered text-* utility, so both
          // `text-ink-600` and `hover:text-accent-500` rendered nothing here. A <span> is not
          // named by that reset, so the colour lands and `group-hover` carries the hover.
          className="group block rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-3 py-2 text-center text-[12px] font-semibold transition-colors hover:border-accent-500"
        >
          <span className="text-ink-600 transition-colors group-hover:text-accent-500">All posts</span>
        </Link>
      </div>
    </div>
  );
}
