import type { Metadata } from "next";
import { paletteCompatibility } from "@/lib/palettes/compatibility";
import { getSiteSettings } from "@/lib/keystatic";
import { DEFAULT_THEME } from "@/lib/theme";
import OklchPrimer from "@/components/palettes/OklchPrimer";

/* ============================================================================================
   `/oklch` — THE PRIMER, AND A SIBLING OF `/palettes` RATHER THAN A CHILD OF IT.

   ⚠ `/palettes/oklch` WORKS BY A PRECEDENCE RULE AND THAT IS WHY IT WAS REFUSED. A static segment
   beats a dynamic sibling in Next, so it would have resolved — correctly, today, and for a reason
   nobody would re-derive when they add the tenth palette. `rendered-theme` A2 has already caught
   one page in that directory being overwritten, by a case-variant request landing on a
   case-insensitive filesystem; putting a hand-authored route into the same directory as nine
   generated ones adds a second way for the two to collide.

   ⚠ AND THERE IS STILL NO `/playground` INDEX. The nav comment in `SiteHeader` named its own
   trigger — "if a second playground piece ever ships, THAT is when an index earns its existence" —
   and the trigger is now met. The index still loses: a section index with two cards is a container
   with two items, and every visitor pays a click to reach either. The two pages cross-link from
   their heroes and their closing blocks, which is the thing an index would have been standing in
   for. That comment is updated in this commit rather than left describing a decision that has now
   been made twice.

   ⚠ NO THEME SCRIPT ON THIS ROUTE, for the same reason `/palettes` has none. The root layout baked
   the published theme into `<html>` at build, and this page opens on the site the visitor is
   actually on so that every press is a departure from it and exit is a real return. A fixed
   default here would put the visitor inside a preview they never asked for.
============================================================================================ */
export const metadata: Metadata = {
  title: "Learn OKLCH",
  description:
    "A colour written in OKLCH answers three questions. How light, how colourful, which hue. "
    + "Change the third and you have a new theme.",
};

export default async function OklchPage() {
  const settings = await getSiteSettings();
  return (
    <OklchPrimer
      palettes={paletteCompatibility()}
      /* ⚠ THE PUBLISHED VALUE, NOT A NAME TYPED HERE. A convention naming a specific theme is the
         fixed-list shape, and it goes stale the moment the owner publishes a different one. */
      initialSlug={settings?.theme ?? DEFAULT_THEME}
    />
  );
}
