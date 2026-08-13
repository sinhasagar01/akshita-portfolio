"use client";

// The gallery editor's list pane. Search, and navigate to another item.
//
// READ AND NAVIGATE ONLY, exactly as `BlogPostList` is, and for the same recorded reason: create
// and delete live on /studio/gallery where they already work, and rebuilding them here would give
// two operations two implementations to keep in step — the `[slug]/body` failure in miniature.
//
// SELECTION IS THE ROUTE. Each row links to /studio/gallery/<slug> and the current slug arrives as
// a prop, so "which item am I editing" has one answer and the back button works.
//
// ⚠ THE ROW CARRIES A THUMBNAIL, WHICH THE OTHER TWO LISTS DO NOT, AND IT IS NOT DECORATION. A
// blog row is identified by its title and a section row by its kind; a gallery item's title is
// often the weakest thing about it — "Low tide", "Untitled 4" — and the picture is the identity.
// A list of forty photographs distinguished only by filename is a list nobody can navigate.
import { useMemo, useState } from "react";
import Link from "next/link";
import { draftImageUrl } from "@/lib/studio/draft-image";
import type { GalleryItem } from "@/lib/keystatic";
import { inputCls } from "./blocks/fields";

/** Title, tag and kind, lowercased. Local rather than a `lib/studio/gallery-search.ts`, because it
 *  is four lines with one consumer — `filterBlogPosts` earned its own module by being called from
 *  the index AND the rail, and this collection's index does not filter. Extract at the second
 *  consumer, which is this repository's threshold rather than a preference. */
function matches(item: GalleryItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return (
    item.title.toLowerCase().includes(q) ||
    item.kind.toLowerCase().includes(q) ||
    item.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export default function GalleryItemList({
  items,
  currentSlug,
}: {
  items: readonly GalleryItem[];
  /** The item open in the canvas. Drives the selected row, and comes from the route. */
  currentSlug: string;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => items.filter((i) => matches(i, query)), [items, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-none border-b border-studio-ink-950/12 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items"
          aria-label="Search items"
          className={`${inputCls} min-w-0`}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-studio-text-subtle">
            No items match that search.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {shown.map((item) => {
              const current = item.slug === currentSlug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/studio/gallery/${item.slug}`}
                    aria-current={current ? "page" : undefined}
                    /* `border-b-studio-ink-950/12`, NOT the shorthand — hazard 26. The shorthand
                       colours all four sides and races `border-l-studio-accent-500` at equal
                       specificity, so sheet order picks the winner. `studio-border-race` pins it. */
                    className={`flex items-center gap-2.5 border-b border-b-studio-ink-950/12 border-l-[3px] py-2.5 pl-[9px] pr-3 transition-colors ${
                      current
                        ? "border-l-studio-accent-500 bg-studio-cream-300"
                        : "border-l-transparent hover:bg-studio-cream-100"
                    }`}
                  >
                    {/* A FIXED BOX WITH `object-cover`, so forty items of forty aspects make one
                        even column. The masonry is where aspect matters; a rail where every row is
                        a different height is a rail that is harder to scan, not more honest. */}
                    <span className="relative size-9 flex-none overflow-hidden rounded-[3px] bg-studio-cream-100">
                      {/* ⚠ STRATEGY 1 — PROXY EVERY SRC, ALWAYS, AND A PLAIN `<img>` RATHER THAN
                          `next/image`. A just-uploaded image lives only on the draft branch, so its
                          public path 404s until publish; `draftImageUrl` tries draft then main, so
                          ONE src is correct in both cases and during the session that created it.

                          THE OPTIMIZER CANNOT BE USED HERE AT ALL: it refetches from the server
                          WITHOUT the owner cookie, so an optimized proxy URL 401s. That is
                          `ImageThumb`'s rule and this is the same call.

                          COST, STATED: one round trip per row. These are 36px thumbs and the trip
                          is the same size at any display size — nothing here resizes anything — so
                          what is being bought is a rail that is CORRECT rather than one that shows
                          broken frames until publish. */}
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={draftImageUrl(item.image)}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[14px] font-medium ${
                          current ? "text-studio-ink-950" : ""
                        }`}
                      >
                        {item.title}
                      </span>
                      {/* A VALUE BELONGS TO ITS GROUND — `text-text-subtle` measures 4.78 on this
                          rail's cream-200 and 4.03 on the SELECTED row's cream-300, under the 4.5
                          floor. The conditional is the same one BlogPostList carries. */}
                      <span
                        className={`mt-0.5 block truncate text-[12px] ${
                          current ? "text-studio-ink-600" : "text-studio-text-subtle"
                        }`}
                      >
                        {item.kind || "no kind"}
                        {item.alt.trim() === "" ? " · needs alt" : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex-none border-t border-studio-ink-950/12 p-3">
        <Link
          href="/studio/gallery"
          /* THE COLOUR IS ON THE SPAN, NOT THE LINK — hazard 22. `Link` renders an `<a>`, and the
             unlayered `a { color: inherit }` beats any layered text-* utility, so a colour set
             here would draw nothing. */
          className="group block rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-3 py-2 text-center text-[12px] font-semibold transition-colors hover:border-studio-accent-500"
        >
          <span className="text-studio-ink-600 transition-colors group-hover:text-studio-accent-500">
            All items
          </span>
        </Link>
      </div>
    </div>
  );
}
