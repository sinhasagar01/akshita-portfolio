"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isStudioAreaActive } from "@/lib/studio/nav-active";
import {
  IconHome,
  IconGrid,
  IconBriefcase,
  IconLayers,
  IconFileText,
  IconSliders,
  IconSparkles,
  IconLogout,
} from "./icons";
import { useStudioCounts } from "./StudioCountsProvider";

type Area = {
  href: string;
  label: string;
  Icon: typeof IconHome;
  count?: number;
};

export default function StudioSidebar() {
  const pathname = usePathname();
  // Live counts from the shared store (seeded from server data in the layout,
  // kept in sync by each list editor's optimistic add/remove).
  const { counts } = useStudioCounts();

  const areas: Area[] = [
    { href: "/studio", label: "Homepage", Icon: IconHome },
    { href: "/studio/projects", label: "Case studies", Icon: IconGrid, count: counts.projects },
    { href: "/studio/experience", label: "Experience", Icon: IconBriefcase, count: counts.experience },
    { href: "/studio/blog", label: "Blog", Icon: IconFileText, count: counts.blog },
    { href: "/studio/skills", label: "Skills", Icon: IconLayers, count: counts.skills },
  ];

  const settings: Area = { href: "/studio/settings", label: "Site settings", Icon: IconSliders };

  // THE PINNING LIVES IN THE WRAPPER, NOT IN A PARAMETER, and that is why there is no
  // `pinned` argument here any more.
  //
  // #195 flagged `renderLink(settings, true)` as an intent stated at the call site and never
  // implemented, and hazard 19 recorded it that way. BOTH WERE WRONG ABOUT THE CAUSE. The
  // distinction IS implemented — Site settings is wrapped below in
  // `lg:mt-auto lg:border-t lg:pt-2.5` with a 12% ink border colour, which pushes it to the bottom of
  // the flex column and draws its separator. It has never rendered like the other links.
  //
  // `git log -S` puts the parameter in `ca6ab8b`, the original dashboard, ALREADY UNUSED. It
  // was vestigial from the first commit rather than aspirational, so #199 removed it and the
  // `true` with it. This is deliberately NOT the FIT_THRESHOLD_PX shape, where a name outlived
  // its consumer and deleting it would have destroyed the evidence an intent existed — here
  // the intent is on screen, in the wrapper, and the parameter was the part that never
  // carried it. Do not re-add it looking for the distinction.
  function renderLink(area: Area) {
    const active = isStudioAreaActive(area.href, pathname);
    return (
      <Link
        key={area.href}
        href={area.href}
        aria-current={active ? "page" : undefined}
        // `group` so the LABEL can react to the anchor's hover. It has to: a colour utility on
        // an anchor does nothing here — see the label's note below.
        className={[
          "group flex items-center gap-2.5 whitespace-nowrap rounded-[var(--studio-radius-control,4px)] px-2.5 py-2 text-[14px] transition-colors",
          active
            ? // THE INK PILL IS INVERTED AT `lg`, AND IT HAD TO BE. `bg-ink-950` on the ink
              // sidebar measures 1.00:1 — the pill would vanish and take the only selection
              // marker with it. The figure-ground relationship flips instead of the shape
              // changing: a white wash at 10% (1.25:1 against the ink). #165 shipped the ink
              // pill and STATE records the reversal beside the original reasoning.
              // BELOW `lg` THE PILL SURVIVES UNCHANGED, and that is not laziness — see the
              // <aside> note. On cream it is a 19.04:1 marker in a horizontally scrolling row
              // where half the items are off screen, and the wash would be 1.25:1.
              "bg-ink-950 lg:bg-white/10 font-medium"
            : "hover:bg-cream-50/70 lg:hover:bg-white/5",
        ].join(" ")}
      >
        {/* `text-ink-400` IS KEPT AT BOTH BREAKPOINTS, AND THAT IS A CHECKED DECISION RATHER
            THAN AN INHERITANCE. It measures 3.33:1 on cream-100 and 5.45:1 on ink-950, so the
            flip improves it and no class needs to change. Recorded because an unchanged class
            is indistinguishable from an overlooked one, and the next background move has to
            re-check it. */}
        <area.Icon className={`size-4 ${active ? "text-cream-50" : "text-ink-400"}`} />
        {/* The label carries its OWN colour rather than inheriting the anchor's. It used
            to be a bare <span>, and in the selected pill it computed to ink-950 on an
            ink-950 background — invisible. The icon beside it was fine precisely because
            it already had its own class, which is the tell. Every child of this pill now
            states its colour explicitly, so none of them depends on the anchor's.

            THE INACTIVE BRANCH USED TO PASS `undefined`, SO THE INVARIANT ABOVE WAS ONLY
            HALF TRUE — and the half that was missing is the half that broke here.

            A COLOUR UTILITY ON AN ANCHOR DOES NOTHING IN THIS PROJECT. globals.css:278 has an
            UNLAYERED `a { color: inherit }`, and an unlayered rule outranks `@layer
            utilities`, so `.text-ink-*` on an <a> silently loses. Measured: the same
            `text-ink-600` computes ink-600 on a <span> and ink-950 on an <a>. The anchor's
            `text-ink-600` had therefore been DEAD SINCE IT WAS WRITTEN — the label inherited
            ink-950 from body, which is 18.13:1 on cream and looks entirely correct, which is
            why nobody caught it. On ink it is 1.00:1.
            This is hazard 11's mechanism (unlayered `img,video{height:auto}` beating `h-*`)
            on a third element. Colour goes on the SPAN, and hover rides `group-hover`. */}
        <span
          className={
            active
              ? "text-cream-50"
              : "text-ink-600 group-hover:text-ink-950 lg:text-ink-200 lg:group-hover:text-cream-50"
          }
        >
          {area.label}
        </span>
        {area.count != null && (
          // The count carried a HARDCODED text-ink-400 that the active branch did not
          // override, so in the selected ink pill it sat at ink-400 on ink-950 while the
          // label beside it was cream-50 — the one element in the pill the active state
          // did not reach. The label was never the problem; it has no class of its own and
          // inherits cream-50 correctly.
          <span className={`ml-auto text-[12px] ${active ? "text-cream-50/70" : "text-ink-400"}`}>
            {area.count}
          </span>
        )}
      </Link>
    );
  }

  return (
    // INK FROM `lg` UP ONLY, AND THE BREAKPOINT IS THE DESIGN RATHER THAN A SHORTCUT.
    //
    // At `lg` this is a 236px column beside a tall cream field — chrome, plainly, and the ink
    // makes the working surface the brightest thing in the window. BELOW `lg` IT IS A
    // DIFFERENT COMPOSITION: the aside goes full width and stacks above `main`, and its nav
    // becomes a horizontal scroller. Measured at 500x860 — the band is 133px and the topbar
    // another 64, so ink there is a 197px slab, 22.9% of that viewport and nearer 30% on a
    // 667px phone. It stops reading as receding chrome and starts reading as a dark app bar,
    // which is a different idiom from the one this direction chose.
    //
    // The selection marker is the sharper half. The nav scrolls (704px of items in 476px, so
    // three of six are off screen), which makes the active pill the primary wayfinding cue —
    // and inverting it there would take it from 19.04:1 to 1.25:1. Mobile ink chrome is real
    // work with its own composition, and it is SCOPED SEPARATELY rather than absorbed here.
    // `lg:w-[var(--studio-sidebar-w)]` — THE WIDTH IS A RUNTIME VALUE NOW, and it arrives as a
    // custom property because Tailwind cannot interpolate one into a class name. That inability
    // is the original cause of the 236px hazard, so the answer must not recreate it: the value is
    // declared once on the layout root and CONSUMED here and in PublishBar, which is how those
    // two files stopped being a hand-kept pair of literals. Full `var()` form, never the
    // bracket-bare shape that names a custom property with no `var()`, which generates nothing in v4.
    //
    // AND IT IS CONSUMED ONLY INSIDE AN `lg:` UTILITY, which is what makes the below-lg answer
    // structural. Below the breakpoint this aside is full width and stacked above `main`; the
    // stored width is set on the root but never read, so it cannot leak into that composition.
    <aside id="studio-sidebar" className="flex flex-col border-b border-ink-950/12 bg-cream-100 p-3 lg:sticky lg:top-0 lg:h-screen lg:w-[var(--studio-sidebar-w)] lg:flex-none lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-white/24 lg:bg-ink-950 lg:p-4">
      <div className="flex items-center gap-2.5 px-1.5 pb-3 lg:pb-4">
        {/* 30x30 AND 20px ARE THE CONTRACT'S OWN VALUES, verified in the file rather than
            taken on trust — `.logo .mark { width:30px; height:30px }` and
            `.logo b { font-size:20px; letter-spacing:-.01em }`. The app shipped 24x24 and 17px,
            so this is an implementation gap, not a new design.

            THE RADIUS TAKES THE CARD STEP, NOT THE CONTRACT'S 7px. 7 is not a value the studio
            radius scale has, and the scale supersedes the file here exactly as it did for its
            2px input and 3px button radii — all three predate #207. 8 is the nearest step and
            the mark is a small surface rather than a control.

            THE ACCENT CHIP'S COLOUR IS UNCHANGED. accent-500 on ink-950 is 4.05:1, and rule 6
            keeps the accent discipline: this direction adds no new colour. The BOX grew; the
            fill did not move. */}
        <span className="grid size-[30px] place-items-center rounded-[var(--studio-radius-card,8px)] bg-accent-500 text-cream-50">
          <IconSparkles className="size-4" />
        </span>
        {/* 20px / -0.01em. The colour is untouched at cream-50, but SIZE PARTICIPATES IN
            LEGIBILITY even when the colour has not moved, so the ratio is re-measured on the
            ink ground rather than assumed to hold — see the PR body. */}
        <span className="font-display text-[20px] tracking-[-0.01em] text-ink-950 lg:text-cream-50">Studio</span>
      </div>

      {/* PRE-EXISTING AA FAILURE, FIXED BY THE FLIP RATHER THAN REPAIRED. This heading is
          `lg:block` — it only ever renders at the breakpoint that is now ink — and it sat at
          3.33:1 on cream-100, under AA, since it was written. `text-ink-400` on ink-950 is
          5.45:1, so it passes now because the background moved, not because anyone touched it.
          Worth stating so ink chrome is not credited with a repair it did not make. */}
      <span className="hidden px-2 pb-1 text-[10px] font-bold uppercase tracking-eyebrow text-ink-400 lg:block">
        Content
      </span>

      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {areas.map((area) => renderLink(area))}
        {/* ONE BORDER COLOUR, NOT TWO. This carried a 12% ink AND a 12% white lg border class
            — both border-color at equal specificity, so which one drew was decided by their
            order in the generated sheet. MEASURED: white/12 won and the ink class was dead.
            The render was right BY LUCK OF ORDERING, which is hazard 26 live on main rather
            than hypothetical. It stays /12 because it is an INTERIOR divider; the L's outer
            edges are the ones at /24. */}
        <div className="lg:mt-auto lg:border-t lg:border-white/12 lg:pt-2.5">
          {renderLink(settings)}
          <form action="/api/studio/logout" method="post">
            {/* Same rewrite as a nav link at rest — ink-600 would be 2.57:1 and the
                ink-950 hover 1.00:1. It is not `renderLink` because it posts a form. */}
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-[var(--studio-radius-control,4px)] px-2.5 py-2 text-[14px] text-ink-600 transition-colors hover:bg-cream-50/70 hover:text-ink-950 lg:text-ink-200 lg:hover:bg-white/5 lg:hover:text-cream-50"
            >
              <IconLogout className="size-4 text-ink-400" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
