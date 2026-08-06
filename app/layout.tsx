import type { Metadata } from "next";
import {
  Fraunces,
  DM_Sans,
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

/* ⚠ FRAUNCES IS NO LONGER THE DISPLAY FACE. `--font-display` points at Source Serif 4 as of this
   commit, so preloading Fraunces would spend the critical window on a face nothing reads. It stays
   LOADED rather than deleted for one more step, because `--font-fraunces` is still a declared face
   and deleting both outgoing families belongs in a cleanup PR rather than in the one that has to
   prove the serif changed. Its SOFT and WONK axes go with it when it goes — Source Serif 4 has
   neither, which is the "drops the calligraphy" half of the contract. */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
  preload: false,
});

/* ⚠ DM SANS IS NO LONGER THE BODY FACE AND IS NO LONGER PRELOADED. `--font-body` points at Work
   Sans as of this commit. It is still LOADED rather than deleted because `--font-dm-sans` remains
   a declared face and the display side of the arc has not shipped, so the two families are
   deliberately co-present for one more step. Preloading a face nothing reads would spend the
   critical window on it — the argument Caveat's note below already makes. It comes out with the
   display swap, not here, because deleting it in the same commit as the measure would put an
   unrelated change in a diff that exists to prove three numbers. */
const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-body-loaded",
  display: "swap",
  preload: false,
});

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
  // faces (Fraunces, DM Sans, Kaushan) for bandwidth during the critical window.
  preload: false,
});

/* ============================================================================================
   THE THREE INCOMING FACES — loaded, unconsumed, and that is the whole point of this step.
   Source Serif 4 for display, Work Sans for body, Space Grotesk for labels.

   ⚠ EVERY ONE IS `preload: false`, AND THAT IS LOAD-BEARING RATHER THAN TIDY. Nothing reads
   these tokens yet, so a preload link would download three unused webfonts in the critical
   window and contend with the three faces that ARE above the fold. Caveat's note below
   already established that reasoning for a face that IS used; it applies harder to one that
   is not. The PR that repoints `--font-display` and `--font-body` flips these to `true` and
   flips Fraunces and DM Sans to `false`, in the same commit, so the preload budget never
   holds both sets at once.

   ⚠ SOURCE SERIF 4 TAKES `opsz` AND ITS AXIS MAXES AT 60, where Fraunces goes to 144. So
   `font-variation-settings: "opsz" 144` at globals.css:270 cannot carry over — it would clamp
   silently, which is a value that renders and is not the value anyone asked for. The contract's
   scale states an opsz per step, and :270 takes that step's value rather than "something valid".

   ⚠ ITALIC IS LOADED FOR THE SERIF AND NOT FOR THE OTHER TWO. The section headings are Fraunces
   italic 400 today, so the display face needs a real italic or the swap ships a synthesised
   oblique. Work Sans mirrors DM Sans, which loads normal only. Space Grotesk HAS no italic
   upstream, which costs nothing because a tracked uppercase label never sets one.
============================================================================================ */

/* ⚠ PRELOADED FROM HERE, because it IS the display face now — every h1 and h2 on every page, and
   the LCP element on the home page and every case study. It swaps places with Fraunces above
   rather than joining it, so a public page's preload count does not move. */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-source-serif-loaded",
  display: "swap",
  preload: true,
});

/* ⚠ WORK SANS IS PRELOADED FROM HERE, because it IS the body face now — every paragraph on every
   page, and the family the LCP text is set in. It swaps places with DM Sans above rather than
   joining it, so the preload count on a public page is unchanged. */
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
      className={`${fraunces.variable} ${dmSans.variable} ${kaushanScript.variable} ${caveat.variable} ${sourceSerif.variable} ${workSans.variable} ${spaceGrotesk.variable}`}
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
