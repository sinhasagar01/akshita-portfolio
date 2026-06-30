import { IconSearch, IconArrowUpRight } from "./icons";

/**
 * The studio top bar — a non-functional search field with a "/" hint and a
 * link out to the live homepage. Search is intentionally disabled for now.
 */
export default function StudioTopbar() {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex flex-1 items-center gap-2 rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2">
        <IconSearch className="size-4 text-ink-400" />
        <input
          type="search"
          disabled
          aria-label="Search content (coming soon)"
          placeholder="Search content"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-600 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed"
        />
        <kbd
          aria-hidden
          className="rounded border border-ink-950/8 px-1.5 py-px text-[11px] text-ink-400"
        >
          /
        </kbd>
      </div>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-accent-500/35 px-3 py-2 text-[12px] text-accent-500 transition-colors hover:bg-accent-500/5"
      >
        View live
        <IconArrowUpRight className="size-3.5" />
      </a>
    </div>
  );
}
