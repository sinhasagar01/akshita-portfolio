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
      {/* THE CONTRACT'S VALUES ARE FOR A CREAM TOPBAR THAT WAS DELIBERATELY REPLACED (C-9), so
          its INTENT transfers and its two colours do not. Intent: a legible well, a visible
          border, 40px tall, control radius, 13.5px, magnifier left and `/` right. Everything
          but the two colours already transferred; the colours are derived below.

          MEASURED, over the topbar's composited ink (51,43,39):
            well  white/5  -> 1.16:1   LESS than the sidebar's 10% wash at 1.25, which STATE
                                       already records as nearly invisible. Now white/12 -> 1.45.
            border white/12 -> 1.45:1  Now white/24 -> 1.96.

          THE WELL IS white/16, NOT #211's white/12, AND THE REASON IS THE RULE THIS ARC KEEPS
          RELEARNING. #211 derived white/12 against a topbar that composited to 51,43,39 — ink
          at 85% over cream. #214 made that bar SOLID ink-950 to fix the L, and the same
          white/12 over the darker ground fell to 1.32, BELOW the floor it had cleared. THE
          VALUE DID NOT CHANGE; ITS GROUND DID. Re-derived on the new bar, white/16 reads 1.50,
          above the 1.45 that shipped. Everything else on this well IMPROVED with the darker
          ground — placeholder 5.08 -> 7.10, typed value 9.10 -> 12.70 — which is why this is
          the only number that moved.

          A RECESSED WELL WAS TESTED AND REJECTED ON EVIDENCE. "Well" implies recessed, so
          black/15 through black/35 were measured: every one lands at 1.10-1.22 against the bar,
          WORSE than white/12, because the bar is already near the bottom of the range. Lighter
          is the right direction here even though the cream ladder's well is lighter for the
          opposite reason. Only the magnitude was wrong.

          THE TRADE THIS MAKES, STATED: brightening the well LOWERS the contrast of everything
          drawn on it. That is why the foregrounds below had to move in the same change. */}
      <div className="flex min-h-10 items-center gap-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-3 py-2 lg:border-white/24 lg:bg-white/16">
        {/* ink-200 at `lg` for the same reason as the placeholder — see below. */}
        <IconSearch className="size-4 text-ink-400 lg:text-ink-200" />
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
          // ink-600 is 2.57:1 on ink, so the typed value moves to cream-50 at `lg` — 9.1:1 on
          // the new well, still the strongest thing in the control.
          //
          // THE PLACEHOLDER MOVES ink-400 -> ink-200, AND THE OLD COMMENT'S NUMBER WAS
          // MEASURED ON THE WRONG GROUND. It claimed "ink-400 — 5.45:1 there", but 5.45 is
          // ink-400 against the SIDEBAR's ink-950. This placeholder sits on the TOPBAR's well,
          // which is ink/85 over cream plus a white wash — two compositing steps lighter.
          // Measured where it actually renders, ink-400 was 3.27:1, BELOW AA's 4.5 for text,
          // and the brighter well would have taken it to 2.60 — under even the 3.0 UI floor.
          // ink-200 measures 5.08:1 there and is PR 1's own on-ink set, not a new value.
          //
          // "Placeholder should sit below the value" still holds and is unaffected: 5.08
          // against the value's 9.1 is a clear hierarchy, and a hierarchy is a ratio between
          // two legible things rather than a licence for one of them to fail.
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink-600 outline-none placeholder:text-ink-400 lg:text-cream-50 lg:placeholder:text-ink-200"
        />
        <kbd
          aria-hidden
          className="rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-1.5 py-px text-[12px] text-ink-400 lg:border-white/24 lg:text-ink-200"
        >
          /
        </kbd>
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-72 overflow-auto rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 py-1 shadow-[0_8px_30px_rgba(60,45,30,0.14)]"
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
                // The inactive branch is empty because it carried `text-ink-700`, a phantom
                // (hazard 23) that generated no CSS — so active and inactive rows have always
                // rendered the same ink. The accent fill is what marks the active row and
                // always was; deleting the class changes nothing on screen.
                className={[
                  "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[14px]",
                  i === active ? "bg-accent-500/10 text-ink-950" : "",
                ].join(" ")}
              >
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 text-[12px] text-ink-400">{r.sublabel}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
