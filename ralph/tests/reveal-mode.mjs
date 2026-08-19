/* ============================================================================================
   THE REVEAL DECISION — THE REGRESSION THAT COULD NOT BE ASSERTED, AND NOW CAN.

   The Work section came back blank on every route that lands on `#work`: a direct URL, a refresh,
   and the "All work" control on a case study. It only appeared after scrolling back and forth.

   ⚠ IT WAS A DEADLOCK RATHER THAN A RACE, AND THAT DISTINCTION IS THE WHOLE FINDING. A race is
   fixed by waiting. `.reveal-panel` ships `clip-path: inset(0 0 100%)`, which leaves a ZERO-HEIGHT
   STRIP at the panel's own top, and IntersectionObserver clips the intersection rect against it —
   so with a TOP inset on the observer's root, the strip had to pass THROUGH the band to be seen.
   A hash landing puts the strip ABOVE the band. The panel was hidden by a clip that blinded the
   observer that would remove it, and scrolling DOWN moved the strip further away.

   Measured on production, panel at top 72 in an 872px viewport, before the fix:

       rootMargin "-20% 0px"          isIntersecting false    band 174..698, strip at 72
       rootMargin "0px 0px -20% 0px"  isIntersecting true     band   0..698
       clip removed, "-20% 0px"       isIntersecting true     the clip is the blocker

   ⚠ AND FOUR ACTORS HAD TO BE READ TOGETHER, WHICH IS WHY NO SINGLE FILE LOOKED WRONG.
   `PageLoader` freezes the page at scroll 0 for the loader's duration and applies the hash target
   only after it lifts — so `RevealSection` decided while `scrollY` was still 0 and read a "top
   load" that was really a deep link. The loader is once-per-session, which is exactly why the
   owner reported it as intermittent. `ScrollManager` and Lenis are the other two.

   ⚠ AND IT WAS MISREAD ONCE, BY ME, ON THE SAME DAY. The identical symptom was hit while driving
   a render protocol and written off as "programmatic scrollTo raced the reveal observer". The
   observer was never going to fire. **An instrument condition is a real diagnosis and it is also
   the most comfortable one available**, which is the reason to reproduce before ruling.

   WHAT THIS SUITE CAN AND CANNOT SEE. It calls the extracted decision with real inputs, so every
   branch is exercised by value rather than by regex. It CANNOT see IntersectionObserver — that is
   browser behaviour, and section C pins the one constant that governs it, in the ABSENCE direction
   which is the sound one for a regex.
============================================================================================ */

import { revealModeOnMount, revealModeOnScroll, REVEAL_ROOT_MARGIN } from "../../lib/reveal-mode.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* The measured geometry of the real failure, so these are the site's numbers rather than invented
   ones: an 872px viewport, `#work` 1552px tall, sitting 900px down on a top load and landing at
   top 72 after the hash jump. */
const VH = 872;
const base = { prefersReduced: false, hash: "", id: "work", innerHeight: VH };

console.log("\nA · the mount decision, by value");

/* ⚠ THE REGRESSION ROW. Every figure here is what the browser actually reported at the moment the
   effect ran: the hash present, the scroll still frozen at 0 by the loader, and the panel still
   below the fold because the jump had not been applied. Under the old rule this returned `armed`
   and the observer could never lift it. */
t("A1 ⚠ THE REPORTED DEFECT — a deep link decided while the loader still holds scroll at 0",
  revealModeOnMount({ ...base, hash: "#work", scrollY: 0, rectTop: 900, rectBottom: 900 + 1552 }),
  "instant");
t("A1a …and the same landing WITHOUT the hash is still armed, so the rule turns on the deep link rather than on the geometry",
  revealModeOnMount({ ...base, hash: "", scrollY: 0, rectTop: 900, rectBottom: 900 + 1552 }),
  "armed");
/* ⚠ THE COMPLEMENT, AND IT IS THE HALF THAT KEEPS THE RULE HONEST. A hash naming a DIFFERENT
   section must not make every panel instant — that would flatten the whole page on any deep link. */
t("A1b …and a hash naming a DIFFERENT section does not claim this one",
  revealModeOnMount({ ...base, hash: "#about", scrollY: 0, rectTop: 900, rectBottom: 900 + 1552 }),
  "armed");
t("A1c …and a panel with no id can never match a hash, however the hash reads",
  revealModeOnMount({ ...base, id: undefined, hash: "#work", scrollY: 0, rectTop: 900, rectBottom: 900 + 1552 }),
  "armed");

/* ⚠ THE ROW THE FIX MUST NOT BREAK. A reader opening the site at the top and travelling down is
   the on-load intro, and it has to stay armed so the stagger plays. A fix that returned `instant`
   here would close the report and delete the animation. */
t("A2 ⚠ A TOP LOAD WITH NO HASH STAYS ARMED — the downward journey must still animate",
  revealModeOnMount({ ...base, scrollY: 0, rectTop: 900, rectBottom: 900 + 1552 }),
  "armed");
t("A3 a mid-page refresh with it already on screen is instant — nothing may replay under the reader",
  revealModeOnMount({ ...base, scrollY: 420, rectTop: 480, rectBottom: 480 + 1552 }),
  "instant");
t("A4 scrolled clean past on arrival is instant",
  revealModeOnMount({ ...base, scrollY: 4493, rectTop: -3593, rectBottom: -2041 }),
  "instant");
t("A5 reduced motion is always instant, before any geometry is read",
  revealModeOnMount({ ...base, prefersReduced: true, scrollY: 0, rectTop: 900, rectBottom: 2452 }),
  "instant");
/* Reduced motion outranks the armed case specifically, which one example cannot show — a
   precedence claim has to name the competitor it beats. */
t("A5a …and it outranks the ARMED case rather than agreeing with an already-instant one",
  [revealModeOnMount({ ...base, prefersReduced: false, scrollY: 0, rectTop: 900, rectBottom: 2452 }),
   revealModeOnMount({ ...base, prefersReduced: true, scrollY: 0, rectTop: 900, rectBottom: 2452 })],
  ["armed", "instant"]);

console.log("\nB · the scroll fallback, which must not pre-empt the animation it guards");

t("B1 a panel scrolled clean past goes instant rather than waiting to animate on the way back up",
  revealModeOnScroll(-3593, -2041), "instant");
/* ⚠ THE ARM ADDED FOR THIS DEFECT. A still-armed panel whose top is above the fold means the
   observer never got its chance — a landing scroll applied after the mount decision. */
t("B2 ⚠ TOP ABOVE THE FOLD WHILE STILL ARMED IS INSTANT — the observer was never given its chance",
  revealModeOnScroll(-40, 1512), "instant");
/* ⚠ AND THE ROW THAT PROVES B2 CANNOT FIRE ON A DOWNWARD JOURNEY. The strip crosses the observer's
   band at 80% of the viewport, so every position a reader passes through on the way down still
   returns null and leaves the animation to the observer. Without this, B2 would be a licence to
   flatten the intro and nothing would say so. */
t("B3 …and every position on a normal downward journey still waits, so B2 cannot flatten the intro",
  [900, 698, 500, 200, 1].map((top) => revealModeOnScroll(top, top + 1552)),
  [null, null, null, null, null]);

console.log("\nC · the observer's root margin — the constant that caused the deadlock");

/* ⚠ ASSERTED IN THE ABSENCE DIRECTION, WHICH IS THE SOUND ONE FOR A CHECK LIKE THIS. "It has no top
   inset" cannot pass by a matcher failing to find something it was never going to find: the value
   is parsed into four sides and the top one is compared to zero. A presence check would prove the
   string exists and nothing about what it means. */
const sides = REVEAL_ROOT_MARGIN.trim().split(/\s+/);
t("C1 the margin parses into four sides, or C2 would rule on something it did not read", sides.length, 4);
t("C2 ⚠ NO TOP INSET — a negative top is the deadlock, because the clipped panel's only visible strip sits at its top",
  parseFloat(sides[0]), 0);
t("C3 …and the BOTTOM inset survives, because that is what governs when a downward reader triggers the reveal",
  parseFloat(sides[2]) < 0, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
