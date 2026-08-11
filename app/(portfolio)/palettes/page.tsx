import type { Metadata } from "next";
import { paletteCompatibility } from "@/lib/palettes/compatibility";
import { getSiteSettings } from "@/lib/keystatic";
import { DEFAULT_THEME } from "@/lib/theme";
import PaletteConsole from "@/components/palettes/PaletteConsole";

/* ============================================================================================
   `/palettes` — THE CONSOLE, AND THE ENTRY POINT OF THE PLAYGROUND.

   ⚠ IT LIVES INSIDE `(portfolio)`, SO THE REAL SITE CHROME IS ABOVE IT. That is not incidental —
   the page's whole claim is that the palettes are the live system, and the nav sitting over it IS
   the demonstration. `SiteHeader` is `fixed inset-x-0` with document-level listeners and its own
   `data-nav-tone` computation, so a second instance inside the preview panel would overlay the
   viewport and double every listener. It is therefore NOT rebuilt as a facsimile and NOT imported
   into the panel: the page's own nav is the thing being shown. A copy would drift, and this page
   cannot afford a drifting copy of the component it is arguing about.

   ⚠ THE DEFAULT IS THE PUBLISHED THEME, AND THE REASON IS NOT AESTHETIC — IT IS THAT A FIXED
   DEFAULT BREAKS `Try across portfolio`. If arriving here silently repaints the site to a palette
   the owner did not publish, the visitor is ALREADY INSIDE A PREVIEW THEY DID NOT ASK FOR: the
   try action then has nothing to offer, and the exit action has no true state to return to. The
   whole mechanism is coherent only when the page opens on the site the visitor is actually on, so
   every press is a departure from it and exit is a real return.

   It also makes the headline honest. "Press one, watch what does not change" is a comparison
   against the visitor's own current experience, not against an arbitrary starting point.

   ⚠ SO THERE IS NO THEME SCRIPT ON THIS ROUTE. The root layout already baked the published theme
   into `<html>` at build, and this page deliberately does not touch it. `/palettes/[slug]` is the
   one that overrides, because a slug IS a request for a specific palette. Do not "improve" this to
   a fixed default — that is the change the paragraph above exists to refuse.
============================================================================================ */
export const metadata: Metadata = {
  title: "Palettes",
  description:
    "Nine curated palettes as role tokens. Press one and the whole page moves, while the structure stays put.",
};

export default async function PalettesPage() {
  const settings = await getSiteSettings();
  return (
    <PaletteConsole
      palettes={paletteCompatibility()}
      /* ⚠ THE PUBLISHED VALUE, NOT A NAME TYPED HERE. A convention naming a specific theme is the
         fixed-list shape, and it goes stale the moment the owner publishes a different one. */
      initialSlug={settings?.theme ?? DEFAULT_THEME}
      ownsRootTheme={false}
    />
  );
}
