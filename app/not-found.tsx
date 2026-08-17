import Link from "next/link";
import type { Metadata } from "next";

// Root 404. Renders in the bare root layout (the site header/footer live in the
// (portfolio) layout, which this is outside of), so it is a self-contained branded
// page. The html element supplies the canvas background + ink text globally.
//
// ---- ⚠ THIS PAGE WAS THE LAST OF THE OLD LANGUAGE, AND IT WAS FOUND BY A CONTROL ------------
//
// It carried a 13rem ITALIC accent `404`, an accent eyebrow, a display heading at 400 and a rounded
// accent pill — the whole retired vocabulary, on the one page nobody looks at while redesigning the
// pages people do.
//
// ⚠ AND IT WAS FOUND TWICE, BOTH TIMES BY A CHECK AIMED SOMEWHERE ELSE. A grep confirming the
// squared-box work matched this page's accent pill — a capsule corner on a filled control — in a case
// study's served HTML; a grep confirming the stamp work matched its italic watermark the same way.
// Neither renders on a case study: Next puts an error boundary's class strings in the route's flight
// payload, so both hits were THIS file, reached through a page it never draws on. The radius and
// italic censuses are scoped to `components/case-study`, a boundary they both state, and this page is
// the proof that stating it mattered.
//
// ⚠ AND THIS NOTE TRANSCRIBED THREE RETIRED CLASS STRINGS BEFORE IT STOPPED — the pill, the
// watermark, and then, in the sentence apologising for the first two, the breakpoint-prefixed eyebrow
// size from the hero as an EXAMPLE of the mistake. `css-comment-trap` A5 caught the third and named
// this file. Tenth instance of explaining-it-requires-writing-it in this repository, fourth of mine
// in this arc, and the only one committed inside the sentence describing the rule.
//
// DESCRIBE A RETIRED UTILITY. NEVER SPELL ONE — INCLUDING AS AN EXAMPLE OF NOT SPELLING ONE.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 font-body">
      <div className="w-full max-w-[560px]">
        {/* ⚠ THE NUMBER TAKES THE MONO REGISTER, WHICH IS WHERE EVERY OTHER NUMBER ON THE SITE NOW
            LIVES — the sheet marks, the card indexes, the stamps. It was 13rem of DISPLAY ITALIC in
            `accent/25`, so it was simultaneously the last slanted display type outside the hero
            thesis and a fifth accent use on a page whose direction sanctions four. Mono at this size
            reads as a plate number, which is exactly what a page identifying itself by its status
            code is. */}
        <p
          aria-hidden="true"
          className="font-mono font-medium leading-none tracking-[0.14em] text-[clamp(4.5rem,14vw,8rem)] text-text-subtle"
        >
          404
        </p>

        {/* The section rule, doing here what it does on every other page: identity one side, status
            the other, an object line between. It replaces a standalone accent eyebrow, which is the
            same construction `CaseSectionHeader` retired. */}
        <div className="sheet-rule mt-7">
          <span className="sheet-mark-text">Sheet —</span>
          <span className="sheet-rule-line" aria-hidden="true" />
          <span className="sheet-mark-text">Page not found</span>
        </div>

        <h1 className="sheet-h2 mt-[clamp(18px,2.4vw,30px)]">This page wandered off.</h1>
        <p className="sheet-lede mt-[clamp(12px,1.4vw,18px)]">
          The page you were looking for is not here. It may have moved, or the link
          was mistyped.
        </p>

        {/* ⚠ THE CONTROL KEEPS ITS ACCENT AND LOSES ITS CORNER, ON THE RESUME CONTROL'S PRECEDENT.
            The direction sanctions the accent for four things and one of them is the resume control —
            the site's single primary action, which the nav draws accent-filled and square since #635.
            This is the same kind of thing on a page that has exactly one action, so it leans on that
            precedent rather than inventing a fifth use.

            ⚠ AND ITS LABEL SAT AT 1.07 ON ITS OWN FILL, LIVE, WHICH THIS UNIT ONLY FOUND BY MEASURING
            AGAINST THE RIGHT GROUND. My first reading gave 17.27 — the label against the PAGE, not
            against the button it is drawn on. Re-measured properly: the foreground computed
            `oklch(0.15 0 0)` on an `oklch(0 0 0)` fill, near-black on pure black, against a 4.5 floor.

            THE CAUSE IS DOCUMENTED AND THE CLASS WAS NEVER APPLYING. `a { color: inherit }` is
            UNLAYERED, so it beats any colour utility in `@layer utilities`: the accent foreground on an
            anchor draws nothing and the label inherits the page's ink. Constructed rather than reasoned
            — the same two classes measure 1.07 on an `<a>`, 20.12 on a `<button>`, 20.12 on a `<span>`.

            THE REPAIR IS THIS REPOSITORY'S OWN — MOVE THE COLOUR TO A CHILD. Three accent controls were
            fixed exactly this way when `role-layer` R2b was written, and its note says why nothing but a
            measurement finds it: the class reads as working in the markup.

            ⚠ AND R2b DID NOT CATCH THIS ONE, WHICH IS WORTH MORE THAN THE FIX. Its subject is the
            accent foreground paired with the RUNG; this button pairs it with the ROLE, which is the
            CORRECT token and measures 4.63 to 7.52 on all nine palettes. The tokens were right the
            whole time. Only the element could not receive one. */}
        <Link
          href="/"
          className="mt-9 inline-flex items-center bg-accent px-6 py-3 text-[0.95rem] font-semibold transition-colors hover:bg-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        >
          <span className="text-on-accent">Back to home</span>
        </Link>
      </div>
    </main>
  );
}
