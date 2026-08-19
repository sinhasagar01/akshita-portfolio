import type { Metadata } from "next";
import {
  Kaushan_Script,
  Caveat,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Space_Grotesk,
} from "next/font/google";
import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  AUTHOR_JOB_TITLE,
  siteOgImageUrl,
} from "@/lib/site";
import { getSiteSettings } from "@/lib/keystatic";
import { DEFAULT_THEME, THEME_GROUND, THEME_NAMES } from "@/lib/theme";
import { previewHeadScript } from "@/lib/palettes/preview-cookie";
import "./globals.css";

const kaushanScript = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script-loaded",
  display: "swap",
  preload: true,
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-doodle-loaded",
  display: "swap",
  // Not preloaded: Caveat is the annotation/doodle face, used below the fold and never
  // the LCP element, so preloading it only makes it contend with the three above-the-fold
  // faces (the display serif, the body sans, Kaushan) for bandwidth during the critical window.
  preload: false,
});

/* ============================================================================================
   THE FACES THIS SITE IS SET IN. IBM Plex Sans for display AND body, IBM Plex Mono for the
   sheet's marks and labels, Space Grotesk for the studio's own label role.

   ⚠ THE SERIF IS GONE AND SO IS THE SECOND SANS, WHICH IS THE DIRECTION RATHER THAN A CLEANUP.
   Source Serif 4 was the display face and Work Sans the body one. The sheet-set direction sets
   NO SERIF ANYWHERE, and it names one system for both roles, so two families collapse into one.
   Display and body still take SEPARATE role tokens even though both resolve to Plex today — the
   roles are the vocabulary, and keeping them distinct means a future divergence is one edit rather
   than a search.

   ⚠ AND PLEX MONO IS AN ADDITION RATHER THAN A REPOINT, BECAUSE `--font-mono` HAD NO FILE.
   That token was a bare `ui-monospace` stack, so every sheet mark and plate number on the page has
   been rendering in whatever mono the operating system supplies — measured as `ui-monospace` in the
   browser. The direction leans on three mono sizes for its whole label system, so leaving that to
   the platform means the labels differ per visitor. Plex Mono also carries real tabular figures,
   which the readout band and the plate numbers both want.

   WHY PLEX AND NOT THE OBVIOUS ALTERNATIVES, recorded because they are the tempting ones. Inter is
   named on the AI-cluster list as the safe default, so adopting it to escape a default is the same
   mistake in new clothes. Space Grotesk is on that list too and already loads here. Geist is
   excellent, purpose-built and OFL — and it is the current dev-tool default, which is the identical
   failure one generation later. Plex is a SYSTEM rather than a face, drawn together so the sans and
   the mono harmonise by construction, and its flared terminals come from a typewriter, which is
   this direction's own subject. The paid answer, named because it is the honest one, is ABC Diatype
   with Diatype Mono.

   ⚠ EVERY ONE IS `preload: false`, AND THAT IS LOAD-BEARING RATHER THAN TIDY. Nothing reads
   these tokens yet, so a preload link would download three unused webfonts in the critical
   window and contend with the faces that ARE above the fold. Caveat's note above already
   established that reasoning for a face that IS used; it applies harder to one that is not.
   The outgoing families have since been deleted outright, so the budget holds one set.

   ⚠ ITALIC IS STILL LOADED, AND IT IS NOT FOR HEADINGS ANY MORE. The sheet grammar made every
   stage head and section head UPRIGHT, so the reason the old serif carried an italic is gone. But
   italic prose survives in four places the grammar has not reached — About's lead paragraph and
   its note, Experience's role titles and its inline "acquired by" — and without a real italic the
   browser synthesises an oblique by shearing the upright. Dropping the style would trade a font
   file for a worse glyph on live copy, so it stays until those four are decided.

   Plex Mono loads normal only: a tracked uppercase mark never sets an italic. Space Grotesk has
   none upstream, which costs nothing for the same reason.
============================================================================================ */

/* ⚠ PRELOADED, because it IS the display AND the body face — every heading and every paragraph on
   every page, and the family the LCP text is set in. One family now serves both roles, so this is
   ONE preload where the outgoing pair was two.
 *
 * ⚠ AND THE WEIGHTS ARE ENUMERATED RATHER THAN LEFT TO A VARIABLE AXIS, WHICH IS A FACT ABOUT THE
 * UPSTREAM FILE RATHER THAN A CHOICE. Plex Sans is served as static instances, so `next/font`
 * requires the set. Four are declared because four are used: 400 body, 500 for the studio's
 * incumbent mid-weight sites, 600 for every sheet head, 700 for the hero's own heavy sites. */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-sans-loaded",
  display: "swap",
  preload: true,
});

/* ⚠ NOT PRELOADED, AND THE ASYMMETRY IS DELIBERATE. Plex Mono sets the sheet marks, the plate
   numbers and the readout keys — all small, none of them the LCP element, and every one of them
   legible in the fallback mono while the file arrives. Preloading it would put a second font in
   the critical window to improve a 10px label, which is the trade the label face already lost. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono-loaded",
  display: "swap",
  preload: false,
});


/* ⚠ NOT PRELOADED, AND THE REASON CHANGED WITHOUT THE VALUE CHANGING — WHICH IS WHY THE COMMENT
   IS REWRITTEN RATHER THAN LEFT ALONE. Through the arc it was `false` because `--font-label` had
   no consumer at all. It now has two, so the old reason is gone; the flag stays `false` for a new
   one.

   EVERY CONSUMER IS UNDER /studio, WHICH IS OWNER-GATED AND NOINDEXED — but `preload` is emitted
   from the ROOT layout, which wraps the public site too. Flipping it to `true` put a fifth font
   preload on every public page for a face no public page renders. MEASURED IN THE BUILD, 4 -> 5,
   after a comment here had already claimed the public count was unaffected. It was not.

   ⚠ AND "EVERY CONSUMER IS UNDER /studio" IS FALSE, MEASURED FROM THE PAINT DURING THE FACE SWAP.
   Walking every leaf element on the live home page and reading its computed family finds TWO public
   consumers: `.palette-pill-label` and `.palette-rail-label`, the palette teaser's two "Theme"
   labels. The flag is still `false` and now for a fourth reason — two 10px labels on one control do
   not earn a slot in the critical window — but the sentence above overstated the case and would have
   told the next reader this face never reaches a visitor. It reaches every one of them.

   THIS WAS ALREADY WRONG BEFORE THE SWAP. The teaser predates it; the swap is only what made
   somebody census the families. A claim about WHERE a face renders cannot be checked by reading the
   file that loads it, which is why it took a browser to find.

   SO EVERY CONSUMER TAKES A SWAP INSTEAD. The label face arrives a frame late — on the studio for
   the many consumers there, and on two 10px teaser labels for the public ones. That is the cheaper
   side of the trade by a wide margin either way. */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk-loaded",
  display: "swap",
  preload: false,
});

/** The site's own share card, spelled ONCE. Four metadata objects need it and a fifth copy is
 *  how the three that existed before drifted from each other in their `alt` text. */
const BRAND_CARD = { url: siteOgImageUrl(), width: 1200, height: 630, alt: `${SITE_NAME}, ${AUTHOR_JOB_TITLE}` };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s · ${SITE_NAME}`,
    default: "Akshita Singh, Product Designer",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
  creator: AUTHOR_NAME,
  keywords: SITE_KEYWORDS,
  openGraph: {
    title: "Akshita Singh, Product Designer",
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    /* ⚠ THE CARD LIVES HERE SO EVERY ROUTE THAT DECLARES NO `openGraph` OF ITS OWN INHERITS IT —
     * `/palettes`, its eleven slug pages and `/oklch`. It is NOT the file convention, and the
     * difference is measured: Next merges per top-level field, so a page declaring `openGraph`
     * replaces this object entirely and would lose the image. The three that declare one name the
     * same helper. See `app/(portfolio)/og/route.ts`. */
    images: [BRAND_CARD],
  },
  twitter: {
    card: "summary_large_image",
    title: "Akshita Singh, Product Designer",
    description: SITE_DESCRIPTION,
    images: [BRAND_CARD],
  },
  /* ⚠ NO `icons` KEY, DELIBERATELY — the Next FILE CONVENTION is the single source of truth.
   *
   * An explicit `metadata.icons` OVERRIDES the convention, and this file used to carry one while
   * `app/icon.svg` and `app/apple-icon.png` also existed. They built into live routes that NOTHING
   * LINKED — byte-identical duplicates of the `public/` copies, two sources of truth for one asset.
   *
   * The convention wins for a reason beyond tidiness: it HASHES THE URL. Chrome caches favicons in
   * a separate database for days regardless of HTTP headers, so a changed icon at a stable path can
   * stay stale indefinitely — and a hashed path is a different asset, which is the only thing that
   * reliably busts it. `metadata.icons` at `/favicon.svg` had no hash. */
  robots: { index: true, follow: true },
};

/* ============================================================================================
   ⚠ THE THEME IS EMITTED HERE, ON `<html>`, AND THE HOST WAS MEASURED RATHER THAN CHOSEN.

   `html { background-color: var(--color-background) }` in globals.css paints the PAGE GROUND.
   Probed in the browser with red on `<html>` and blue on a wrapper inside `<body>`, content 40px
   tall in a 1060px viewport: THE WRAPPER PAINTED 40px AND `<html>` PAINTED THE OTHER 1020. So a
   theme scoped to any element below `<html>` leaves the ground on the old palette — a visible band
   on every short page and every overscroll, in every theme.

   ⚠ AND THIS ROOT WRAPS /studio TOO, WHICH IS WHY #323 HAD TO SHIP FIRST. The editor's chrome
   draws from the frozen `--color-studio-*` palette and nothing else — asserted as an absence, so a
   new panel reaching for a public colour fails on arrival. The one site that still drew from the
   public scale was the editor's own ground, the largest painted area in the product. Without that
   PR this attribute would repaint the chrome the freeze exists to protect.

   THE CANVAS IS THE OTHER HALF AND IT COSTS NOTHING. It renders public components, so it inherits
   from here and shows the ACTIVE theme with no second mechanism. That was the ruling, and the root
   placement satisfies it by construction rather than by wiring.

   ⚠ THIS PARAGRAPH SAID "NO CLIENT SCRIPT AND NO FLASH" AND THE FIRST HALF IS NO LONGER TRUE.
   `Try across portfolio` reads its cookie from an inline head script below, because a server read
   would make every public route dynamic. THE SECOND HALF STILL HOLDS — the script runs during
   parse, before body paint. Amended rather than left, because a comment claiming something the
   file stopped doing is the defect this repo keeps finding in its own record.

   ⚠ EVERY PUBLIC ROUTE IS STILL PRERENDERED, WHICH IS THE PROPERTY THAT MATTERED. `/` and `/blog` are
   static, `/blog/[slug]` and `/projects/[slug]` are SSG, so the attribute is baked into the HTML at
   build time. `/studio` is dynamic, which is the right side of that split — the canvas reads the
   current value per request instead of a stale build. It also confirms what the publish story
   already assumed: changing the theme needs a rebuild, which is why it is a publish.
============================================================================================ */
/* ⚠ DERIVED FROM THE REGISTRY, NOT LISTED. The head script needs to know which palettes carry a
   dark ground, and a typed list would be correct on the day it was written. */
const DARK_THEMES = THEME_NAMES.filter((n) => THEME_GROUND[n] === "dark");

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* `getSiteSettings` is `cache()`-wrapped and the public layout already calls it, so public routes
     pay nothing new. A null singleton resolves to the default the same way a missing field does. */
  const settings = await getSiteSettings();
  const theme = settings?.theme ?? DEFAULT_THEME;
  /* ⚠ THE GROUND CLASS COMES FROM THE PALETTE, NOT FROM A SECOND SETTING. A palette IS light or
     dark; there is no visitor toggle and no orthogonal preference. `data-ground="dark"` is emitted
     only for a dark palette, which is what makes the roles resolve to the on-dark vocabulary. */
  const ground = THEME_GROUND[theme] ?? "light";

  return (
    <html
      lang="en"
      data-theme={theme}
      data-ground={ground === "dark" ? "dark" : undefined}
      className={`${kaushanScript.variable} ${caveat.variable} ${plexSans.variable} ${plexMono.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Runs at parse time, before any hydration or browser scroll restoration.
            Manual stops the browser flashing the old position before ScrollManager takes
            over; the top reset is skipped when there is a #hash so a deep link still lands
            on its target instead of being yanked to the top. */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual';if(!location.hash){window.scrollTo(0,0);}" }} />
        {/* ⚠ `Try across portfolio`, READ AT PARSE TIME SO EVERY PUBLIC ROUTE STAYS STATIC.
            Reading `cookies()` here instead would make `/`, `/blog`, `/blog/[slug]`,
            `/projects/[slug]` and both `og` routes dynamic — the whole public surface, for a
            feature a visitor uses once. This runs before body paint, so there is no window in
            which the wrong ground is visible, on first load or on a later navigation.

            ⚠ AND THE COMMENT ABOVE THE `<html>` TAG SAYING "NO CLIENT SCRIPT AND NO FLASH" WAS
            AMENDED RATHER THAN LEFT, because the file no longer does what it claimed. The
            scrollRestoration script beside this one is the precedent that makes the timing
            honest; the departure is now stated where a reader meets it. */}
        <script dangerouslySetInnerHTML={{ __html: previewHeadScript(DARK_THEMES) }} />
        {/* No-JS fallback: the scroll-reveal sections ship clipped/opacity:0 and are
            un-hidden by JS on scroll. Without JS that never fires, so force them visible
            when scripting is off. Zero effect on the JS path (the reveal still runs). */}
        <noscript>
          <style>{".reveal-panel{clip-path:none!important}.reveal-card{opacity:1!important}"}</style>
        </noscript>
      </head>
      <body>
        {/* ⚠ THE PUBLISHED VALUES, SERVER-RENDERED, SO EXIT HAS A TRUE STATE TO RETURN TO. The head
            script may already have overwritten `<html>`'s attributes by the time anything reads
            them, so the published theme cannot be recovered from the live DOM — it has to be
            carried separately. Rendered here rather than passed as a prop because the indicator
            lives in the portfolio layout and this is the only place that knows the published
            value without a second settings read. */}
        <span
          id="published-theme"
          hidden
          data-published-theme={theme}
          data-published-ground={ground === "dark" ? "dark" : ""}
        />
        {children}
      </body>
    </html>
  );
}
