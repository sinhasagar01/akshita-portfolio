"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaletteCompatibility } from "@/lib/palettes/compatibility";
import {
  PREVIEW_MAX_AGE_SECONDS, applyThemeAttributes, startPreview,
} from "@/lib/palettes/preview-cookie";

/* ============================================================================================
   THE FIXED SWITCHER — THE THIRD DOOR, AND THE SAME MECHANISM AS THE OTHER TWO.

   ⚠ IT WRITES THROUGH `startPreview`, NOT ITS OWN COOKIE STRING. `/palettes`'s try button and the
   home teaser had each assembled the cookie, set both attributes and dispatched the event
   independently. They agreed, and nothing compared them. This component would have been a third
   copy, so the writer was extracted first and all three now call it — otherwise "one mechanism,
   three doors" describes an intention rather than the code.

   ---- ⚠ AN INTERSECTION OBSERVER ON THE HERO, NEVER A SCROLL HANDLER -------------------------

   A scroll handler fires on every frame of every scroll for a boolean that changes twice a page.
   It also has to know where the hero ENDS, which means reading a layout it does not own and going
   stale the moment the hero's padding changes. The observer is told to watch the element and reads
   nothing.

   ⚠ AND `!isIntersecting` ALONE IS WRONG AT THE TOP OF THE PAGE. An observer fires once on
   registration, and if the hero is taller than the viewport the entry reports NOT intersecting at
   the `rootMargin` used here — so the switcher would appear over the hero, which is the one place
   it must not be. `boundingClientRect.top < 0` distinguishes "scrolled past" from "not reached",
   and both conditions are needed because either alone is true in a state the other is not.

   ---- ⚠ HIDDEN BELOW 1200px, IN CSS RATHER THAN IN STATE ------------------------------------

   There is no gutter to sit in below that width and the panel would cover content. It is a media
   query, not a `useState` on `matchMedia`, so the first paint is already correct and there is no
   frame in which a narrow viewport shows it.

   ---- ⚠ AND ABOVE 1200px THERE WAS NO GUTTER EITHER, WHICH IS THE PART NOBODY CHECKED ---------

   "Hidden where there is no room" was written as though room existed everywhere else. Measured at
   1440 with a 1300px container, it does not: the container spans 70 to 1370 and this panel spans
   1229 to 1425, so THE PANEL COVERS THE LAST 141px OF EVERY SECTION on both playground pages.

   What that hid was not decoration. On the primer it covered the lab's contrast readout — the
   number and the whole of the "not WCAG" caveat, which is the one thing that element exists to
   say — and 59px of the sample heading the section is built to demonstrate. On the palettes page
   it sat over the component stage.

   ⚠ THE OVERLAP IS A BAND, NOT A CONSTANT, WHICH IS WHY IT SURVIVED A LOOK. Margins grow with the
   viewport: about 141px of overlap at 1440, 46px at 1600, and NONE at 1920. Anyone checking on a
   wide display sees a panel sitting politely in the margin.

   So both pages cap their measure at `min(1300px, 100vw - 460px)` above 1200px — 196px of panel,
   plus its right offset, plus twenty of clearance, doubled because the container is centred. The
   pages get narrower between 1200 and 1760 and nothing runs underneath at any width.

   ⚠ THE FIRST FIX WAS TO MOVE THE ONE COVERED SPAN, AND IT WAS THE WRONG SHAPE. It made the caveat
   readable and left the heading, the stage and everything a future section puts near a right edge
   still underneath — whack-a-mole against a collision that is a property of the geometry.

   ---- ⚠ THE FADE IS GATED ON `prefers-reduced-motion` AND THE VISIBILITY IS NOT ---------------

   The two are different questions and conflating them is how a reduced-motion setting removes
   FUNCTIONALITY rather than movement. Under the preference the switcher still appears and still
   disappears at the same scroll position; it simply arrives without a transition. This repo has
   the instance on record — a reduced-motion setting suppressing a component entirely, mistaken for
   a site condition — so the rule here is that the preference changes HOW it arrives and never
   WHETHER it does.
============================================================================================ */

type Props = {
  palettes: PaletteCompatibility[];
  /** The palette currently shown, so the pressed row matches whatever the page is drawing. */
  active: string;
  /** Told rather than discovered, because the page owns the palette state and this is a control
   *  over it. A second source of truth here is how the switcher and the page drift apart. */
  onPick: (p: PaletteCompatibility) => void;
  /** The element whose departure reveals this. The hero, on both routes. */
  heroRef: React.RefObject<HTMLElement | null>;
  /** Announced when a preview starts, so the page's own toast says it rather than this owning one. */
  onPreview?: (message: string) => void;
};

/** The six lightness stops each row draws, as a miniature of the palette's ladder. Light palettes
 *  read bright to dark and dark ones the other way, which is the ladder each actually has. */
const rampStops = (p: PaletteCompatibility): string[] => {
  const t = p.tokens;
  return p.groundClass === "dark"
    ? [t["band-dark"], t.surface, t["surface-well"], t["accent-500"], t["on-dark-muted"], t["on-dark"]]
    : [t.canvas, t["cream-50"], t["cream-100"], t["accent-500"], t["ink-600"], t["ink-950"]];
};

export default function PaletteSwitcher({ palettes, active, onPick, heroRef, onPreview }: Props) {
  const [shown, setShown] = useState(false);
  /* ⚠ READ ONCE INTO A REF RATHER THAN SUBSCRIBED. The preference is a paint decision made at
     reveal time; a live subscription would add a listener for a value that changes when a user
     visits their system settings mid-scroll. `matchMedia` is guarded because this runs in an
     effect, so `window` exists, but a test environment may not implement it. */
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      /* Reveal once the hero is mostly gone rather than at its exact edge, so the panel does not
         flicker in and out while a reader hovers the boundary. */
      { rootMargin: "-40% 0px 0px 0px" }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [heroRef]);

  const current = palettes.find((p) => p.name === active) ?? palettes[0];

  const press = useCallback((p: PaletteCompatibility) => {
    applyThemeAttributes(p.name, p.groundClass === "dark");
    onPick(p);
  }, [onPick]);

  const light = palettes.filter((p) => p.groundClass === "light");
  const dark = palettes.filter((p) => p.groundClass === "dark");

  const rows = (group: PaletteCompatibility[]) => group.map((p) => (
    <button
      key={p.name}
      type="button"
      aria-pressed={p.name === active}
      onClick={() => press(p)}
      className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ${
        p.name === active ? "bg-surface-well shadow-[inset_2.5px_0_0_var(--color-accent-500)]" : ""
      }`}
    >
      <span className={`w-[52px] shrink-0 text-xs ${
        p.name === active ? "font-semibold text-text-primary" : "text-text-subtle"
      }`}>
        {p.name}
      </span>
      <span className="flex flex-1 gap-[1.5px]" aria-hidden="true">
        {rampStops(p).map((c, i) => (
          <i key={i} className="h-[18px] flex-1 rounded-[2px]" style={{ background: c }} />
        ))}
      </span>
    </button>
  ));

  return (
    <aside
      /* ⚠ `hidden` BELOW 1200px AND THE BREAKPOINT IS ARBITRARY-VALUE ON PURPOSE. The site's own
         mobile breakpoint is `lg` at 1024, and this is not a mobile question — it is whether a
         gutter exists beside a 1300px measure. Reaching for `lg` because it is the house
         breakpoint would put the panel over content between 1024 and 1200. */
      className={[
        "fixed right-0 top-1/2 z-40 hidden w-[196px] -translate-y-1/2 rounded-l-xl border border-r-0",
        "border-ink-950/8 bg-surface/90 p-3 backdrop-blur-md min-[1200px]:block",
        reduced.current ? "" : "transition-opacity duration-300",
        shown ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      /* ⚠ HIDDEN FROM ASSISTIVE TECHNOLOGY WHILE IT IS INVISIBLE. `opacity-0` alone leaves every
         button in the tab order and in the accessibility tree, so a keyboard user tabbing through
         the hero would land inside a panel nobody can see. `inert` removes both in one attribute
         and is the only thing that keeps the two in step. */
      {...(shown ? {} : { inert: true })}
      aria-label="Palette switcher"
    >
      <div className="mb-2 flex items-baseline justify-between">
        <b className="text-xs font-semibold text-text-primary">Palette</b>
        <span className="font-mono text-[8px] text-text-subtle">{palettes.length} total</span>
      </div>

      <p className="mb-1.5 font-mono text-[7.5px] uppercase tracking-[0.18em] text-text-subtle">Light</p>
      <div>{rows(light)}</div>
      <p className="mb-1.5 mt-2.5 font-mono text-[7.5px] uppercase tracking-[0.18em] text-text-subtle">Dark</p>
      <div>{rows(dark)}</div>

      <div className="mt-2.5 flex flex-col gap-1.5 border-t border-ink-950/8 pt-2.5">
        <button
          type="button"
          onClick={() => {
            startPreview(current.name, current.groundClass === "dark", Date.now());
            onPreview?.(`${current.name} applied across the portfolio`);
          }}
          className="w-full rounded-full bg-accent-500 px-2.5 py-2 text-[11px] font-semibold text-on-accent"
        >
          Try across the portfolio ↗
        </button>
        <p className="text-center font-mono text-[8px] text-text-subtle">
          {PREVIEW_MAX_AGE_SECONDS / 60} minutes · nothing published
        </p>
      </div>
    </aside>
  );
}
