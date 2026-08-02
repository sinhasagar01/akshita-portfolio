import StudioSearch from "./StudioSearch";
import { IconArrowUpRight } from "./icons";
import type { SearchItem } from "@/lib/studio/search-index";

/**
 * The studio top bar — a working client-side search over /studio content (built
 * from getStudioData in the layout) plus a link out to the live homepage.
 */
export default function StudioTopbar({ searchItems }: { searchItems: SearchItem[] }) {
  return (
    // Full-bleed shell (Task 1): a sticky bar with a hairline bottom. Spans the full width
    // of main (which no longer pads it), so the hairline reaches both edges.
    //
    // SOLID INK AT `lg`, AND THE FROST IS DELIBERATELY GIVEN UP THERE. The bar was
    // an 85% ink surface at lg with `backdrop-blur`, and #165 built that on purpose: "content
    // scrolls under the blur". MEASURED, IT WAS STILL LIVE — on /studio/settings at a 600px
    // viewport, real page content passes beneath it.
    //
    // BUT INK/85 COMPOSITES TO 51,43,39 ONLY BECAUSE IT SITS OVER CREAM, while the sidebar
    // beside it is solid ink-950 at 15,7,3. The two halves of one L, meeting at a corner,
    // 1.44:1 apart. NO ALPHA BELOW 1.0 CLOSES THAT — the frost and the L match are mutually
    // exclusive, not a trade to be tuned. The L wins: it is chrome, it is on every studio
    // page, and it is visible at rest without scrolling, whereas the frost is transient and
    // INERT on the three-pane editors, which is where the mismatch was noticed.
    //
    // `lg:backdrop-blur-none` GOES WITH IT because a blur behind an opaque layer does
    // nothing, and a property describing a behaviour that no longer happens is the shape
    // this project has removed repeatedly. BELOW `lg` NOTHING CHANGES — the bar is still
    // cream-50/85 and still frosts, because there is no ink L down there to protect.
    // StudioSearch is untouched (its own ARIA combobox + "/").
    // INK AT `lg`, WITH THE SIDEBAR, BECAUSE THE TWO ARE ONE FRAME. A cream bar to the right
    // of an ink column breaks the L and is exactly the half-converted reading the direction
    // warns about. Below `lg` the sidebar stays cream and so does this — see StudioSidebar.
    // THE COLOUR SITS ON THIS CONTAINER, NOT ON THE LINK, and that is forced rather than
    // stylistic. globals.css carries an unlayered `a { color: inherit }`, which outranks
    // `@layer utilities`, so a `text-*` utility on the <a> below does nothing — its
    // `text-ink-600` has never applied and the link has always drawn ink-950 inherited from
    // body (18.13:1 on cream, so it looked right). Setting it here works WITH that rule
    // instead of fighting it, and needs no extra element, which the repaint's
    // attribute-invariant gate would reject. Same finding as StudioSidebar's label.
    <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-ink-950/12 bg-cream-50/85 px-4 py-3 text-ink-600 backdrop-blur lg:border-white/24 lg:bg-ink-950 lg:px-6 lg:text-ink-200 lg:backdrop-blur-none">
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
        // HEIGHT 40 TO MATCH THE SEARCH FIELD BESIDE IT. The contract sets `.btn` and
        // `.search input` to 40px each so they align on one row; #211 brought the search to 40
        // and did not touch this, leaving them 4px apart. `min-h-10` rather than padding —
        // the inputCls precedent, and padding would also move the label off centre.
        // The GROUND is untouched: the bar is ink by design (C-9), so no colour moves except
        // the border, which follows its NEIGHBOUR rather than this element's own history:
        // #211 measured white/12 at 1.45:1 on the search well beside this and raised it to
        // white/24. Two adjacent controls on one ink bar disagreeing about their edge is the
        // inconsistency, so this takes the same step. Derived from the measurement next to it.
        //
        // AND IT IS ONE UTILITY, NOT TWO. The first draft left `lg:border-white/12` in place
        // beside the new value — two border-color utilities at equal specificity, decided by
        // sheet order. That is hazard 26 exactly, in the same session it was documented.
        // THE HOVER INVERTS THE BUTTON — a light fill on the ink bar, dark text on the fill.
        // A DEPARTURE FROM THE CONTRACT, NOT A CORRECTION TO IT. `.btn.ghost:hover` is
        // `border-color: accent; color: accent`, drawn for a cream bar — and measured, accent
        // on THIS ink bar reads 3.88:1, above the 3.0 UI floor. The contract's hover transfers
        // and works; this is a different treatment chosen over it, so the file is not wrong.
        //
        // cream-50 RATHER THAN RAW WHITE, because the ladder has a lightest step and this is
        // it — the same value the wordmark uses on ink. Measured 19.04:1 against the bar
        // versus white's 19.96, which is imperceptible, and it keeps a solid fill inside the
        // palette. (The white/16 and white/24 elsewhere here are ALPHA WASHES, not fills.)
        //
        // NO `hover:border-*` COMPANION. A light border on a light fill is 1.00:1 against it —
        // it would extend the fill by one pixel and delineate nothing. This arc has spent
        // several PRs deleting classes that render nothing; adding one knowingly is worse.
        className="group inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-3 py-2 text-[12px] font-semibold transition-colors hover:border-accent-500 lg:border-white/24 lg:hover:border-cream-50 lg:hover:bg-cream-50"
      >
        {/* "VIEW SITE", NOT "VIEW LIVE". This goes to `/` — the whole site. The blog editor's
            canvas bar has its OWN link, 59px below this one, going to the current article.
            Both said "View live", with no aria-label or title on either, so two different
            destinations sat behind one name and a screen reader read it twice identically.
            #200's rule: a control says what its object is.

            THE LABEL IS IN A SPAN SO THE HOVER COLOUR CAN LAND. `hover:text-*` on this <a>
            would be DEAD — hazard 22's unlayered `a { color: inherit }` defeats a hover colour
            exactly as it defeats a base one, and `hover:text-accent-500` was removed from THIS
            ELEMENT for that reason. A span is not named by that reset, so `group-hover` works.
            Same shape as BlogPostList's All-posts link. */}
        <span className="transition-colors lg:group-hover:text-ink-950">View site</span>
        <IconArrowUpRight className="size-3.5 transition-colors lg:group-hover:text-ink-950" />
      </a>
    </div>
  );
}
