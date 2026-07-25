import StudioSearch from "./StudioSearch";
import { IconArrowUpRight } from "./icons";
import type { SearchItem } from "@/lib/studio/search-index";

/**
 * The studio top bar — a working client-side search over /studio content (built
 * from getStudioData in the layout) plus a link out to the live homepage.
 */
export default function StudioTopbar({ searchItems }: { searchItems: SearchItem[] }) {
  return (
    // Full-bleed shell (Task 1): a sticky bar with a hairline bottom, translucent
    // over the cream-50 working surface. Spans the full width of main (which no
    // longer pads it), so the hairline reaches both edges and content scrolls
    // under the blur. StudioSearch is untouched (its own ARIA combobox + "/").
    <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-ink-950/8 bg-cream-50/85 px-4 py-3 backdrop-blur lg:px-6">
      <StudioSearch items={searchItems} />
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-ink-950/8 px-3 py-2 text-[12px] text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500"
      >
        View live
        <IconArrowUpRight className="size-3.5" />
      </a>
    </div>
  );
}
