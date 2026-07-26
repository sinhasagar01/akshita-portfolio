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
      <div className="flex-none border-b border-ink-950/8 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts"
          aria-label="Search posts"
          className="w-full min-w-0 rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[13px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
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
                    // aria-current is the accessible half of the accent pill. #167 settled
                    // that the selected row is the accent-tinted pill, so this follows the
                    // convention rather than inventing a third selected treatment.
                    aria-current={current ? "page" : undefined}
                    className={`flex items-start gap-2.5 border-b border-ink-950/8 px-3 py-2.5 transition-colors ${
                      current ? "bg-accent-500/8" : "hover:bg-cream-100"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        p.status === "published" ? "bg-success-700" : "bg-ink-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[13px] ${
                          current ? "text-ink-950" : "text-ink-700"
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

      <div className="flex-none border-t border-ink-950/8 p-3">
        <Link
          href="/studio/blog"
          className="block rounded-md border border-ink-950/8 px-3 py-2 text-center text-[12px] text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500"
        >
          All posts
        </Link>
      </div>
    </div>
  );
}
