import type { Metadata } from "next";
import {
  Kaushan_Script,
  Caveat,
  Source_Serif_4,
  Work_Sans,
  Space_Grotesk,
} from "next/font/google";
import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
} from "@/lib/site";
import { getSiteSettings } from "@/lib/keystatic";
import { DEFAULT_THEME } from "@/lib/theme";
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
   THE THREE FACES THIS SITE IS SET IN. Source Serif 4 for display, Work Sans for body,
   Space Grotesk for labels.

   ⚠ EVERY ONE IS `preload: false`, AND THAT IS LOAD-BEARING RATHER THAN TIDY. Nothing reads
   these tokens yet, so a preload link would download three unused webfonts in the critical
   window and contend with the faces that ARE above the fold. Caveat's note above already
   established that reasoning for a face that IS used; it applies harder to one that is not.
   The outgoing families have since been deleted outright, so the budget holds one set.

   ⚠ ITALIC IS LOADED FOR THE SERIF AND NOT FOR THE OTHER TWO. The section headings are display
   italic 400, so the display face needs a real italic or the site ships a synthesised oblique.
   Work Sans loads normal only. Space Grotesk HAS no italic upstream, which costs nothing because
   a tracked uppercase label never sets one.
============================================================================================ */

/* ⚠ PRELOADED FROM HERE, because it IS the display face now — every h1 and h2 on every page, and
   the LCP element on the home page and every case study. */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-source-serif-loaded",
  display: "swap",
  preload: true,
});

/* ⚠ WORK SANS IS PRELOADED FROM HERE, because it IS the body face now — every paragraph on every
   page, and the family the LCP text is set in. */
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans-loaded",
  display: "swap",
  preload: true,
});

/* ⚠ NOT PRELOADED, AND THE REASON CHANGED WITHOUT THE VALUE CHANGING — WHICH IS WHY THE COMMENT
   IS REWRITTEN RATHER THAN LEFT ALONE. Through the arc it was `false` because `--font-label` had
   no consumer at all. It now has two, so the old reason is gone; the flag stays `false` for a new
   one.

   EVERY CONSUMER IS UNDER /studio, WHICH IS OWNER-GATED AND NOINDEXED — but `preload` is emitted
   from the ROOT layout, which wraps the public site too. Flipping it to `true` put a fifth font
   preload on every public page for a face no public page renders. MEASURED IN THE BUILD, 4 -> 5,
   after a comment here had already claimed the public count was unaffected. It was not.

   SO THE STUDIO TAKES A SWAP INSTEAD. The label face arrives a frame late on an owner-only
   surface, which is the cheaper side of the trade by a wide margin. */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk-loaded",
  display: "swap",
  preload: false,
});

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Akshita Singh, Product Designer",
    description: SITE_DESCRIPTION,
  },
  /* ⚠ THE SVG FIRST AND THE PNG AS A REAL FALLBACK, NOT A COURTESY. Safari did not support SVG
   * favicons until Safari 26.0 — 3.1 through 18.7 do not — and a designer's portfolio skews Mac and
   * iOS, so the PNG carries more traffic here than the 89% global figure suggests.
   *
   * TWO ASSETS IN STEP IS AN OBLIGATION ON A PERSON, and that is what lost for the eight
   * illustrations. It is acceptable here because the obligation is BOUNDED: the mark is invariant,
   * so the two are in step at ONE value forever rather than once per theme. A per-theme pair would
   * have grown with every palette; this pair does not.
   *
   * AND THE FAVICON CACHING PROBLEM STOPS APPLYING FOR THE SAME REASON. Chrome holds a favicon for
   * days regardless of HTTP headers, which only matters if the icon is supposed to change. Under an
   * invariant mark it never is. */
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
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

   ⚠ NO CLIENT SCRIPT AND NO FLASH, BECAUSE EVERY PUBLIC ROUTE IS PRERENDERED. `/` and `/blog` are
   static, `/blog/[slug]` and `/projects/[slug]` are SSG, so the attribute is baked into the HTML at
   build time. `/studio` is dynamic, which is the right side of that split — the canvas reads the
   current value per request instead of a stale build. It also confirms what the publish story
   already assumed: changing the theme needs a rebuild, which is why it is a publish.
============================================================================================ */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* `getSiteSettings` is `cache()`-wrapped and the public layout already calls it, so public routes
     pay nothing new. A null singleton resolves to the default the same way a missing field does. */
  const settings = await getSiteSettings();
  const theme = settings?.theme ?? DEFAULT_THEME;

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${kaushanScript.variable} ${caveat.variable} ${sourceSerif.variable} ${workSans.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Runs at parse time, before any hydration or browser scroll restoration.
            Manual stops the browser flashing the old position before ScrollManager takes
            over; the top reset is skipped when there is a #hash so a deep link still lands
            on its target instead of being yanked to the top. */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual';if(!location.hash){window.scrollTo(0,0);}" }} />
        {/* No-JS fallback: the scroll-reveal sections ship clipped/opacity:0 and are
            un-hidden by JS on scroll. Without JS that never fires, so force them visible
            when scripting is off. Zero effect on the JS path (the reveal still runs). */}
        <noscript>
          <style>{".reveal-panel{clip-path:none!important}.reveal-card{opacity:1!important}"}</style>
        </noscript>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
