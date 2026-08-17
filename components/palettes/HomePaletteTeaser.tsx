"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { startPreview } from "@/lib/palettes/preview-cookie";
import { selectableCountWord } from "@/lib/theme";

/* ============================================================================================
   THE HOMEPAGE PALETTE TEASER — `Try across portfolio` ARRIVING FROM A DIFFERENT DOOR.

   ⚠ IT WRITES THE SAME COOKIE `/palettes` WRITES, THROUGH THE SAME ENCODER. There is exactly one
   preview state on this site and it must have exactly one mechanism — the cookie from
   `lib/palettes/preview-cookie.ts`, read at parse time by the head script in `app/layout.tsx`, and
   escaped through the one `PreviewIndicator` already mounted in the portfolio layout. TWO
   MECHANISMS FOR ONE STATE IS HOW AN EXIT ACTION STOPS WORKING: the second writer sets something
   the exit does not clear, and the visitor is stranded on a palette with a button that does
   nothing. Nothing here duplicates that layer; these dots are a new door onto it.

   ---- ⚠ TWO PLACEMENTS, TWO REVEAL RULES, AND THEY DIFFER BECAUSE THE SCREEN DOES ---------------

   THE PILL IS ABSENT UNTIL THE HERO HAS LEFT, because the scroll cue owns that corner. Measured on
   the shipped hero at 1440x900: `.hero-scroll` paints at left 62, 32px up from the hero's bottom
   edge, and a pill at the viewport's bottom-left overlaps it while the hero is on screen. Scrolled
   past, the cue sits at top -494 — off screen — and the pill's box is clear. Nothing is ever in the
   same place at the same time, so this needs NO collision rule, which is the strongest thing about
   the placement given this site has spent two PRs on floating furniture colliding.

   THE RAIL IS PRESENT FROM THE FIRST FRAME, because below the breakpoint `.hero-scroll` is
   `display: none` — there is no cue, so there is nothing to wait for.

   ⚠ DO NOT UNIFY THESE. They look like one rule with an inconsistency and they are two rules with
   one reason each. Making the rail wait would hide it behind a scroll on the screen where it is
   least discoverable; making the pill appear immediately would put it on top of the cue.

   ⚠ AND THE PILL IS `fixed`, NOT `absolute` — THE CONTRACT'S IS ABSOLUTE AND THAT CANNOT WORK. The
   hero is `min-height: 100svh`, so a pill positioned inside it scrolls away WITH it and can never be
   visible past the fold, which is the one place it is supposed to live. The contract's mock hides
   this because its stand-in hero is 640px in a page that does not scroll it away.

   ---- ⚠ THE GROUND BOTH CONTROLS ACTUALLY PAINT ON IS `surface`, AND I ASSUMED WRONG TWICE -----

   The first contrast pass measured the pill's glass over `canvas` (the page ground) and the rail's
   over `surface-well` (the hero's art plate). `elementsFromPoint` says otherwise, and it is the only
   thing that could:

     pill   section.section-card   oklch(0.985 0.012 80)   the PROCESS CARD, opaque, above `html`
     rail   section.hero-ground    oklch(0.985 0.012 80)   the HERO GROUND, not the art panel

   Both are `--color-surface`. The page ground sits BEHIND the process card and is never what the
   pill composites onto; the art plate is a sibling region the rail does not overlap at mid-height.

   ⚠ SIXTH INSTANCE OF A RATIO BELONGING TO A GROUND NOBODY CHECKED, and the first where the element
   had already MOVED before it was measured — the pill only exists past the hero, so the ground it
   was assumed to have is one it is never on. Re-measured against `surface` per palette, sanity pair
   21.000 first: nothing below 4.5, lowest 5.35 on sapphire and basalt. The conclusion survived and
   every figure in it changed, which are two different facts and both are stated.

   ---- ⚠ THE OBSERVER, NOT A SCROLL HANDLER, AND THERE IS A THIRD REASON HERE ------------------

   Beyond not writing style per scroll event: THIS SITE'S SCROLL POSITION IS NOT `window.scrollY`.
   Lenis drives `document.body` as the scroll container, and `window.scrollY` reads 0 while the page
   is scrolled — a probe that trusted it reported the cue visible at every offset, which was the
   instrument rather than the site. An IntersectionObserver asks about intersection with the
   viewport and never asks who scrolled, so it is immune to all of that.
============================================================================================ */

/** One dot's depicted palette, resolved at build by `paletteCompatibility()`. */
export type TeaserSwatch = { name: string; ground: string; accent: string; isDark: boolean };

/* ⚠ NO `publishedTheme` HERE ANY MORE, AND ITS REMOVAL IS THE POINT OF THE ARRIVAL STRIP. This
   component used to carry the "published theme is not one of these four" note in its own label,
   because it was the only surface that showed the four. The strip in `PreviewIndicator` now says it
   on EVERY page, so keeping it here too put the identical sentence twice on the homepage, forty
   pixels apart. ONE STATEMENT, ONE OWNER. */
type Props = {
  /** The four, in order, with their colours already resolved to literals. */
  swatches: readonly TeaserSwatch[];
};

export default function HomePaletteTeaser({ swatches }: Props) {
  const [pastHero, setPastHero] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  /* ⚠ THE FADE IS MOTION; THE PRESENCE IS NOT. Under `prefers-reduced-motion: reduce` the pill still
     appears at exactly the same moment — it simply arrives without the transition. Gating the
     PRESENCE would remove a control from the people most likely to want a calmer palette. */
  useEffect(() => {
    const hero = document.querySelector(".hero-ground");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  /* ⚠ ONE WRITER, SHARED. This assembled the cookie, set both attributes and dispatched the event
     itself until #516, and so did `/palettes`'s try button — two spellings of one decision that
     happened to agree, with nothing comparing them. Adding the fixed switcher as a third door is
     what forced the extraction: "one mechanism, three doors" is a claim about the MECHANISM, and it
     is only true if there is one function. The event name moved into the module for the same
     reason — a typo in any copy is a door that silently stops raising the indicator, which reads as
     slowness rather than as a defect. */
  const press = useCallback((theme: string) => {
    startPreview(theme, swatches.find((s) => s.name === theme)?.isDark ?? false, Date.now());
    setActive(theme);
  }, [swatches]);

  /* ⚠ THE FILL IS A RESOLVED LITERAL FROM THE BUILD, NOT A TOKEN, AND A SWATCH IS WHY. It DEPICTS a
     specific palette, so it must not follow the page's current one — the depiction discriminator,
     the same one that keeps the OKLCH axis ramps on `/palettes` out of the theme. A role would paint
     the published palette on all four dots; a scoped rung would work but would add three raw rung
     references to a ratchet that may only fall. These come from `paletteCompatibility()`, the same
     generator the console reads, so the page and the console cannot disagree about a colour. */
  const dots = swatches.map((sw) => (
    <button
      key={sw.name}
      type="button"
      aria-pressed={active === sw.name}
      aria-label={`Preview the ${sw.name} palette across the site`}
      title={sw.name}
      onClick={() => press(sw.name)}
      className={`palette-dot${active === sw.name ? " is-on" : ""}`}
      style={{
        background: `linear-gradient(90deg, ${sw.ground} 0 52%, ${sw.accent} 52% 100%)`,
      }}
    />
  ));

  return (
    <>
      {/* ---- DESKTOP: the pill, bottom-left, revealed past the hero ---- */}
      {/* ⚠ `inert` TRAVELS WITH `aria-hidden`, AND THE SIX CONTROLS INSIDE ARE WHY. `aria-hidden`
          removes this from the accessibility TREE and does nothing to the TAB ORDER — measured, the
          five swatches and the "All nine" link took focus at both 1280x800 and 390x844 while the
          pill was at `opacity: 0`. A keyboard visitor reached six invisible controls before the
          hero's own tabs. The two attributes answer different questions and must share a condition. */}
      <div
        className={`palette-pill${pastHero ? " is-past" : ""}`}
        aria-hidden={!pastHero}
        inert={!pastHero || undefined}
      >
        <span className="palette-pill-label">Theme</span>
        <span className="palette-sep" />
        <span className="palette-dots">{dots}</span>
        <span className="palette-sep" />
        <Link href="/palettes" className="palette-more">
          All {selectableCountWord()} <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* ---- MOBILE: the edge rail, right edge, mid-height, present from the first frame ----
          ⚠ THE PILL IS NOT SHRUNK, IT IS REPLACED. A phone's bottom-left is the thumb's home
          position, and Safari's toolbar occupies that edge and animates on scroll — a control there
          is either under the thumb by accident or under the browser's furniture. The right edge at
          mid-height is the one region this hero leaves empty at every phone size, and vertical is
          what makes four dots and an arrow fit in 19px of width. */}
      <div className="palette-rail">
        <span className="palette-rail-label">Theme</span>
        <span className="palette-dots">{dots}</span>
        <Link href="/palettes" className="palette-more" aria-label={`See all ${selectableCountWord()} palettes`}>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </>
  );
}
