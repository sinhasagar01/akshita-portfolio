/* ⚠ THE CONTRACT'S OWN THREE FACES, SCOPED TO THE HERO AND NOWHERE ELSE.
 *
 * docs/hero-ash-contract.html is set in Fraunces, DM Sans and JetBrains Mono, and the ruling on
 * this pass is exact fidelity — the hero renders the contract's typography verbatim, and mapping
 * onto the site's Source Serif and Work Sans is what the owner reversed. So the three families
 * load here, from the module the hero alone imports, and their variables are applied on the hero's
 * own section element rather than on <html>.
 *
 * ⚠ `preload: false` ON ALL THREE, AND THAT IS THE COST RULE, NOT A STYLE CHOICE. `preload` is
 * emitted where the loader is INSTANTIATED into the tree, and the hero sits on the home page — a
 * `true` here would put three more font preloads ahead of the LCP. The build was measured at four
 * public preloads when that rule was written, and this file must not move it.
 *
 * ⚠ NO ITALIC SUBSETS, DELIBERATELY. The contract's stylesheet loads Fraunces normal only and lets
 * the browser synthesise the obliques its two `<em>`s use. Loading the real italic would render
 * DIFFERENTLY from the contract this pass exists to match.
 */
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";

/* ⚠ THREE FACES SCOPED TO THE HERO, ON PURPOSE — AND SAYING SO HERE IS THE POINT.
 *
 * The rest of the site runs on `--font-body` (Work Sans). The hero runs on these: Fraunces for
 * display, DM Sans for sans, JetBrains Mono for mono. It is a self-contained typographic system,
 * not a leftover — DM Sans was the site's old body font and its survival here is deliberate.
 *
 * ⚠ NOTHING RECORDED THAT, AND IT COST FOUR ROUNDS. A request to align the hero's tabs with the
 * work filter read as removing drift, twice, by two people — because an unrecorded deliberate
 * difference is indistinguishable from drift. Aligning the families would either break this set or
 * charge the work section for a face it does not otherwise load; all three are `preload: false`.
 *
 * Changing this is a DESIGN decision with a mock, not a cleanup. */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-hero-display",
  display: "swap",
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-hero-sans",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-hero-mono",
  display: "swap",
  preload: false,
});

export const heroFontVariables = `${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable}`;
