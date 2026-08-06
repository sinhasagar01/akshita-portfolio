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
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
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
