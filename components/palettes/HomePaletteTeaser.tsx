"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { arrivalNote } from "@/lib/palettes/teaser";
import {
  PREVIEW_COOKIE, PREVIEW_MAX_AGE_SECONDS, encodePreview,
} from "@/lib/palettes/preview-cookie";

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

type Props = {
  /** The theme on `content/site-settings.yaml`, server-read. Decides the arrival note. */
  publishedTheme: string;
  /** The four, in order, with their colours already resolved to literals. */
  swatches: readonly TeaserSwatch[];
};

export default function HomePaletteTeaser({ publishedTheme, swatches }: Props) {
  const [pastHero, setPastHero] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const noteRef = useRef(arrivalNote(publishedTheme));

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

  const press = useCallback((theme: string) => {
    document.cookie =
      `${PREVIEW_COOKIE}=${encodeURIComponent(encodePreview(theme, Date.now()))}`
      + `; Path=/; Max-Age=${PREVIEW_MAX_AGE_SECONDS}; SameSite=Lax`;
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (swatches.find((s) => s.name === theme)?.isDark) root.dataset.ground = "dark";
    else delete root.dataset.ground;
    setActive(theme);
    /* The one indicator is global and polls; this makes it notice now rather than in fifteen
       seconds. Same event `/palettes` dispatches — one listener, one state. */
    window.dispatchEvent(new Event("palette-preview-changed"));
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

  const note = noteRef.current;

  return (
    <>
      {/* ---- DESKTOP: the pill, bottom-left, revealed past the hero ---- */}
      <div
        className={`palette-pill${pastHero ? " is-past" : ""}`}
        aria-hidden={!pastHero}
        aria-label={note ? `${note}. See all nine palettes.` : undefined}
      >
        <span className="palette-pill-label">{note ?? "Theme"}</span>
        <span className="palette-sep" />
        <span className="palette-dots">{dots}</span>
        <span className="palette-sep" />
        <Link href="/palettes" className="palette-more">
          All nine <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* ---- MOBILE: the edge rail, right edge, mid-height, present from the first frame ----
          ⚠ THE PILL IS NOT SHRUNK, IT IS REPLACED. A phone's bottom-left is the thumb's home
          position, and Safari's toolbar occupies that edge and animates on scroll — a control there
          is either under the thumb by accident or under the browser's furniture. The right edge at
          mid-height is the one region this hero leaves empty at every phone size, and vertical is
          what makes four dots and an arrow fit in 19px of width. */}
      {/* ⚠ THE ARRIVAL NOTE CANNOT BE THE SAME STRING HERE, AND SHORTENING IT TO "Nine" WAS WRONG.
          A 28px rail with vertical text cannot carry "Published: orchid — not one of these four",
          and the first attempt simply dropped the meaning — which is the arrival case going
          silently wrong on the screen where it is hardest to notice, the exact failure the note
          exists to prevent. What fits AND still says something true is the published palette's
          NAME: four dots, none of them the one named beside them, and an arrow to all nine. The
          full sentence rides on `aria-label`, so a screen reader gets the whole claim. */}
      <div className="palette-rail" aria-label={note ? `${note}. See all nine palettes.` : undefined}>
        <span className="palette-rail-label">{note ? publishedTheme : "Theme"}</span>
        <span className="palette-dots">{dots}</span>
        <Link href="/palettes" className="palette-more" aria-label="See all nine palettes">
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </>
  );
}
