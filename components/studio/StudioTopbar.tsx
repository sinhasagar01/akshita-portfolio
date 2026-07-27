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
    // INK AT `lg`, WITH THE SIDEBAR, BECAUSE THE TWO ARE ONE FRAME. A cream bar to the right
    // of an ink column breaks the L and is exactly the half-converted reading the direction
    // warns about. Below `lg` the sidebar stays cream and so does this — see StudioSidebar.
    // THE COLOUR SITS ON THIS CONTAINER, NOT ON THE LINK, and that is forced rather than
    // stylistic. globals.css:278 carries an unlayered `a { color: inherit }`, which outranks
    // `@layer utilities`, so a `text-*` utility on the <a> below does nothing — its
    // `text-ink-600` has never applied and the link has always drawn ink-950 inherited from
    // body (18.13:1 on cream, so it looked right). Setting it here works WITH that rule
    // instead of fighting it, and needs no extra element, which the repaint's
    // attribute-invariant gate would reject. Same finding as StudioSidebar's label.
    <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-ink-950/12 bg-cream-50/85 px-4 py-3 text-ink-600 backdrop-blur lg:border-white/12 lg:bg-ink-950/85 lg:px-6 lg:text-ink-200">
      <StudioSearch items={searchItems} />
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        // `hover:text-accent-500` WAS HERE AND WAS DEAD. Measured while genuinely hovered:
        // the border goes accent-500 and the colour stays put. LAYER ORDER BEATS SPECIFICITY,
        // so the unlayered `a { color: inherit }` outranks a `:hover` colour utility too —
        // raising specificity does not help when the loss is by layer. It defeats ONLY
        // `color`, which is exactly why `hover:border-accent-500` on the same element works.
        // The border hover is a real affordance and stays; the dead colour is removed rather
        // than left looking like it does something.
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-ink-950/12 px-3 py-2 text-[12px] transition-colors hover:border-accent-500 lg:border-white/12"
      >
        View live
        <IconArrowUpRight className="size-3.5" />
      </a>
    </div>
  );
}
