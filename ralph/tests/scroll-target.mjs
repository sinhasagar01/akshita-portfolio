/* ============================================================================================
   WHERE A NAVIGATION LANDS — THE SECOND HALF OF THE WORK-SECTION REPORT.

   #693 fixed the panel coming up BLANK on a hash landing. This is the other half: on a
   CLIENT-SIDE PUSH the page never travelled to the section at all. Measured on production before
   the fix, clicking nav "Work" from `/projects/fosfor-ai`:

       url /#work    scrollY 0    #work top 855    — the reader is at the hero, section revealed

   `revealed: true` in that reading is #693 working. The content was fine; the journey was not.

   ⚠ TWO MECHANISMS HAD TO BOTH BE TRUE, WHICH IS WHY IT SURVIVED THE FIRST FIX. Nothing applied
   the hash — the nav's section links carry `scroll={false}` and `handleNavClick` returns early
   when it is not home — AND `ScrollManager` then forced 0, because `usePathname()` does not carry
   a hash. Either alone would have been visible; together they produced a page that looked like it
   had simply opened at the top.

   ⚠ AND THE POPULATION WAS FIVE TIMES WHAT IT WAS BOARDED AS. The board called it "one `<Link>`
   away" on the strength of the gallery hero. Censused: every SECTION entry in `NAV` renders
   `/#<id>` from any non-home page through a real `<Link>`, so it is five entries times every
   case study, the blog, the gallery and the playground.
============================================================================================ */

import { scrollTargetFor, landingOffset } from "../../lib/scroll-target.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

console.log("\nA · the target rule, by value");

/* ⚠ THE REGRESSION ROW, WITH THE PRODUCTION FIGURES. `#work` sat 855px below a viewport at
   scrollY 0, and the old rule returned 0 regardless. */
t("A1 ⚠ THE REPORTED DEFECT — a push naming a section lands on it rather than at the top",
  scrollTargetFor({ kind: "push", hashOffset: 775, savedOffset: undefined }), 775);
t("A2 a push with no hash still opens at the hero, which is the rule the site is built on",
  scrollTargetFor({ kind: "push", hashOffset: null, savedOffset: undefined }), 0);
/* ⚠ AND A PUSH IGNORES A SAVED POSITION EVEN WHEN ONE EXISTS. Without this the row above would
   pass for a page nobody had visited and quietly change behaviour for one they had. */
t("A2a …and a push ignores any saved offset, so a second visit opens like the first",
  scrollTargetFor({ kind: "push", hashOffset: null, savedOffset: 4200 }), 0);

/* ⚠ THE ASYMMETRY, ASSERTED RATHER THAN DESCRIBED. A pop restores where the reader was; a hash
   still sitting in that history entry describes where they WERE, not what they are asking for.
   Letting it win would drag them back to a section they had scrolled away from before leaving. */
t("A3 ⚠ A POP RESTORES ITS SAVED OFFSET AND THE HASH DOES NOT OUTRANK IT",
  scrollTargetFor({ kind: "pop", hashOffset: 775, savedOffset: 4200 }), 4200);
t("A3a …and a pop with nothing saved falls to the top rather than to the hash",
  scrollTargetFor({ kind: "pop", hashOffset: 775, savedOffset: undefined }), 0);
/* The two kinds must DISAGREE on one input, or the rule collapses to "use the hash" and the
   asymmetry above is prose with nothing holding it. */
t("A3b ⚠ AND THE TWO KINDS GENUINELY DISAGREE ON ONE INPUT — otherwise A3 is describing nothing",
  [scrollTargetFor({ kind: "push", hashOffset: 775, savedOffset: 4200 }),
   scrollTargetFor({ kind: "pop",  hashOffset: 775, savedOffset: 4200 })],
  [775, 4200]);

/* A saved offset of exactly 0 is a real position — the reader was at the hero — and `??` keeps it
   where `||` would discard it. Cheap to assert and the kind of thing a later edit undoes. */
t("A4 a saved offset of 0 is a position rather than an absence",
  scrollTargetFor({ kind: "pop", hashOffset: null, savedOffset: 0 }), 0);

console.log("\nB · the landing offset honours the section's own scroll margin");

/* The site's real numbers: `scroll-mt-20` is 80px and the header is 72px tall. */
t("B1 ⚠ THE SCROLL MARGIN IS SUBTRACTED — without it every landing puts the heading under the nav",
  landingOffset(855, 0, 80), 775);
t("B1a …and a zero margin lands flush, so B1 is measuring the margin rather than the arithmetic",
  landingOffset(855, 0, 0), 855);
t("B2 it composes with the current scroll rather than assuming the page is at the top",
  landingOffset(-200, 1000, 80), 720);
/* An element above the top of the document cannot produce a negative scroll target — the browser
   would clamp it, and a negative here would be handed to Lenis as a real value. */
t("B3 …and it never returns a negative offset, which Lenis would take literally",
  landingOffset(-5000, 100, 80), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
