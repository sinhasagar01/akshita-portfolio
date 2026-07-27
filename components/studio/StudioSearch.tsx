"use client";

// Client-side studio search — a combobox over the pre-built search index
// (settings sections + experience + projects). Filters as you type, keyboard
// navigable (up/down/enter, escape closes), and a "/" shortcut focuses it.
// Selecting a result navigates to its edit destination; the ?item= param it
// carries is read by ListDetailLayout to pre-select the entry (existing
// select-by-id, not reinvented here).
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "./icons";
import { filterStudioSearch, type SearchItem } from "@/lib/studio/search-index";

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable === true
  );
}

export default function StudioSearch({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const results = query.trim() ? filterStudioSearch(items, query) : [];
  const showDropdown = open && query.trim().length > 0;

  // Reset the active row whenever the query changes so it never points past the
  // (re-filtered) results.
  useEffect(() => {
    setActive(0);
  }, [query]);

  // "/" focuses the search field — unless the user is already typing somewhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(document.activeElement)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(item: SearchItem) {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r);
    }
  }

  const activeOptionId = showDropdown && results[active] ? `${listboxId}-opt-${active}` : undefined;

  return (
    <div className="relative flex-1">
      {/* THE ONE INPUT THIS PR TOUCHES, and it becomes a WELL at `lg` rather than staying a
          bright cream box floating on the ink topbar.
          IT IS A HAND-ROLLED GEOMETRY STRING, NOT `inputCls` — a FOURTH copy of the input box
          that #199's dedupe could not reach, because #199 merged shared EXPORTS and this one
          is inline. So restyling it here does not pre-empt PR 2, which owns `inputCls`,
          `inputClsMd` and `inputErrorCls`. It is recorded in STATE's deferred list rather than
          left for PR 2 to rediscover. */}
      <div className="flex items-center gap-2 rounded-md border border-ink-950/12 bg-cream-50 px-3 py-2 lg:border-white/12 lg:bg-white/5">
        <IconSearch className="size-4 text-ink-400" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-label="Search studio content"
          placeholder="Search content"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Delay the close so a click on an option registers first.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          // ink-600 is 2.57:1 on ink, so the typed value moves to cream-50 at `lg`. The
          // placeholder keeps ink-400 — 5.45:1 there, and placeholder SHOULD sit below the
          // value in the hierarchy.
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-600 outline-none placeholder:text-ink-400 lg:text-cream-50"
        />
        <kbd
          aria-hidden
          className="rounded border border-ink-950/12 px-1.5 py-px text-[11px] text-ink-400 lg:border-white/12"
        >
          /
        </kbd>
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-72 overflow-auto rounded-md border border-ink-950/12 bg-cream-50 py-1 shadow-[0_8px_30px_rgba(60,45,30,0.14)]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-[12px] text-text-subtle">No results</li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.href}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                // mousedown (not click) fires before the input blur, and
                // preventDefault keeps focus so go() runs cleanly.
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(r);
                }}
                className={[
                  "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px]",
                  i === active ? "bg-accent-500/10 text-ink-950" : "text-ink-700",
                ].join(" ")}
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 text-[11px] text-ink-400">{r.sublabel}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
