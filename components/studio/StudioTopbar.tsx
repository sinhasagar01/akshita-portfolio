import StudioSearch from "./StudioSearch";
import { IconArrowUpRight } from "./icons";
import type { SearchItem } from "@/lib/studio/search-index";

/**
 * The studio top bar — a working client-side search over /studio content (built
 * from getStudioData in the layout) plus a link out to the live homepage.
 */
export default function StudioTopbar({ searchItems }: { searchItems: SearchItem[] }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <StudioSearch items={searchItems} />
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
