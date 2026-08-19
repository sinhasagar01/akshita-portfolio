import { renderBrandCard } from "@/lib/og";
import { getSiteSettings } from "@/lib/keystatic";
import { resolveTheme, THEME_OG } from "@/lib/theme";

/* THE SITE'S OWN SHARE CARD — the identity lockup, generated, in the published palette.
 *
 * ⚠ IT WAS A STATIC PNG AND THAT PNG WAS IN A PALETTE THE SITE RETIRED. Sampled before deletion:
 * ground `251,246,238`, ink `28,24,19`, accent `181,97,60` — the cream palette, committed in
 * `cd1c658` long before the media. Why it is redrawn rather than re-exported is stated in
 * `lib/og.tsx` above `renderBrandCard`.
 *
 * ⚠ A ROUTE WITH A STABLE URL RATHER THAN THE `opengraph-image` FILE CONVENTION, AND THAT IS A
 * CORRECTION MADE MID-CHANGE RATHER THAN A PREFERENCE. The convention was built first and it
 * SILENTLY DROPPED `og:image` on three pages. Next merges metadata per top-level FIELD, so a page
 * that declares its own `openGraph` object replaces the parent's whole object — including the
 * `images` the convention injected. Measured on a real build:
 *
 *     /            og:image ABSENT      declares openGraph
 *     /blog        og:image ABSENT      declares openGraph
 *     /gallery     og:image ABSENT      declares openGraph
 *     /palettes    og:image present     declares none, inherits
 *     /oklch       og:image present     declares none, inherits
 *
 * `twitter:image` survived on all five, because those pages no longer declare a `twitter` object —
 * which is what made the failure ASYMMETRIC and easy to miss: a page with a twitter card and no OG
 * card looks fine in one preview tool and blank in another.
 *
 * ⚠ SO THE THREE HAND-SPELLED URLS THIS CHANGE DELETED WERE LOAD-BEARING RATHER THAN REDUNDANT.
 * They existed because the convention cannot reach a page that declares `openGraph`, and a generated
 * card's convention URL carries a build hash that no page can name. A stable route is what lets the
 * URL live in ONE helper and be referenced from the four places that need it.
 *
 * The read is build-time and `cache()`-deduped with every page's, and the route prerenders. */
export const dynamic = "force-static";

export async function GET() {
  return renderBrandCard({ palette: THEME_OG[resolveTheme((await getSiteSettings())?.theme)] });
}
