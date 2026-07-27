// Reduced motion — the scroll calls the CSS reset cannot reach.
// Run: node --experimental-strip-types ralph/tests/reduced-motion.mjs
//
// WHY THIS SUITE EXISTS. globals.css carries a blanket reduced-motion reset
// (`transition-duration: 0.01ms !important`, `scroll-behavior: auto !important`) and it
// covers every CSS animation in the header. It does NOT cover a scroll animated by script:
// passing `behavior: "smooth"` explicitly OVERRIDES `scroll-behavior: auto`, so the reset is
// silent about it. That is #171's R2 finding one layer up — the CSS `animation` reset does
// not stop SMIL, and by extension does not stop anything driven outside CSS.
//
// THE BUG THIS GUARDS WAS REACHABLE ONLY UNDER REDUCED MOTION. SmoothScrollProvider returns
// bare children when the reader prefers reduced motion, so `smoothScroll` and `lenis` are
// both null in SiteHeader and both branches fall through to the `else`. The un-gated
// `behavior: "smooth"` in that `else` animated for exactly the readers who asked it not to.
//
// STRUCTURAL, AND HONESTLY SO. Whether a scroll actually animates is a browser question and
// was driven in a browser under emulation. What a suite CAN hold is that no bare
// `behavior: "smooth"` literal survives in these files — which is the whole nature of the
// defect, an un-gated literal, and exactly the thing that decays the next time somebody adds
// a scroll call and copies the line above it.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Source with comments stripped — a `behavior: "smooth"` inside a comment explaining the
 *  bug must not fail the suite that guards it. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const header = code("components/layout/SiteHeader.tsx");
const rail = code("components/case-study/PreviewRail.tsx");
const provider = code("components/providers/SmoothScrollProvider.tsx");
const css = read("app/globals.css");

/* ================================================================= A. THE REGRESSION ITSELF
 * No un-ternaried "smooth" literal anywhere in the header. */
const SMOOTH_LITERALS = header.match(/behavior:\s*"smooth"/g) ?? [];
t("A: SiteHeader has NO bare `behavior: \"smooth\"`", SMOOTH_LITERALS.length, 0);

// Every scroll call that names a behavior must gate it on `reduced`.
const GATED = header.match(/behavior:\s*reduced\s*\?\s*"auto"\s*:\s*"smooth"/g) ?? [];
t("A: all three gated calls are present", GATED.length, 3);

// AND THE ARGUMENT-LESS CALL STAYS BARE. `el.scrollIntoView()` with no argument defaults to
// `auto`, which DOES consult the CSS reset — so it needs no ternary, and adding one would
// imply the bare form was broken when it never was.
t("A: the argument-less call is left alone", /else el\.scrollIntoView\(\);/.test(header), true);

// COUNT EVERY *NATIVE* SCROLL API, NOT JUST scrollIntoView. The investigation for this fix
// grepped `scrollIntoView`, found two sites, and walked straight past the logo's
// `window.scrollTo` — which had the identical bug. This assertion is the shape that would
// have caught it, so it counts the union of the native spellings.
//
// `lenis.scrollTo` and `smoothScroll.scrollToTarget` are deliberately NOT counted: they are
// library calls, they take no `behavior`, and under reduced motion neither object exists —
// which is the very reason the native `else` branches are the ones that matter.
const NATIVE_SCROLLS = header.match(/\.scrollIntoView\(|window\.scrollTo\(|window\.scrollBy\(/g) ?? [];
t("A: four native scroll calls — 3 gated + 1 argument-less", NATIVE_SCROLLS.length, 4);
t("A: the logo's window.scrollTo is gated too",
  /window\.scrollTo\(\{ top: 0, behavior: reduced \? "auto" : "smooth" \}\)/.test(header), true);

/* ================================================================= B. THE HOOK IS CONSULTED
 * The lint disable came off because `reduced` is genuinely read. If someone re-introduces an
 * un-gated call the disable would come back with it, and A would already have failed — this
 * pins the other half. */
t("B: `reduced` is declared from the hook",
  /const reduced\s+= useReducedMotion\(\);/.test(header), true);
t("B: …and is actually referenced", (header.match(/\breduced\b/g) ?? []).length >= 3, true);
t("B: no lint disable remains on it",
  /eslint-disable-next-line[^\n]*no-unused-vars[^\n]*\n\s*const reduced/.test(header), false);

/* ================================================================= C. THE PRECEDENT HOLDS
 * PreviewRail solved this first. If its form ever changes, this file's form should change
 * with it rather than the two drifting into different idioms for one problem. */
t("C: PreviewRail still gates its scroll the same way",
  /behavior:\s*prefersReduced\s*\?\s*"auto"\s*:\s*"smooth"/.test(rail), true);

/* ================================================================= D. WHY THE `else` IS REACHED
 * The premise of the whole fix. If the provider ever stops short-circuiting, the reduced
 * path would get Lenis instead and the reasoning in SiteHeader's comment would be stale —
 * so the premise is asserted rather than described.
 *
 * NOTE the provider names it `prefersReduced` while the header names it `reduced`; both
 * spellings exist across the codebase and neither is being standardised here. */
t("D: SmoothScrollProvider renders NO provider under reduced motion",
  /if \(prefersReduced\) return <>\{children\}<\/>;/.test(provider), true);

/* ================================================================= E. THE CSS RESET IS STILL THERE
 * The other half of the premise: the reset covers CSS motion, which is why the fix is two
 * script lines and no CSS. If the reset disappeared, this file's scope would be wrong. */
t("E: the global reduced-motion reset exists",
  /@media \(prefers-reduced-motion: reduce\)/.test(css), true);
t("E: …and neutralises transitions globally",
  /transition-duration:\s*0\.01ms\s*!important/.test(css), true);
t("E: …and scroll-behavior, which is what `behavior: \"smooth\"` overrides",
  /scroll-behavior:\s*auto\s*!important/.test(css), true);
// The nav row KEEPS its hide behaviour under reduce and only loses the translate. Asserted
// because "disable the animation" would have deleted a behaviour, and the CSS deliberately
// does not — a future cleanup that removed this rule would change what the header does.
t("E: the nav row drops its translate but stays hidden-capable",
  /\.site-header\[data-nav-hidden="true"\] \.nav-row \{ transform: none; \}/.test(css), true);

console.log(`\nreduced-motion result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
