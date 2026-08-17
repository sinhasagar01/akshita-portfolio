"use client";

import Link from "next/link";

// Error boundary for the public site. Renders in place of a failed page, WITHIN the
// (portfolio) layout (header + footer stay), so a thrown error shows a recoverable
// branded surface instead of the unstyled Next default. `reset` re-renders the segment.
//
// ⚠ IT MOVES WITH THE 404 BECAUSE IT SHARES THE 404's CONTROL, WHICH IS ALSO HOW IT WAS FOUND. A
// grep confirming the squared-box work matched an accent pill — a capsule corner on a filled
// control — in a case study's served HTML; the same pill was in both this file and `not-found.tsx`,
// which is why they move together. (The class string is described rather than spelled: transcribing
// it is what made the comment the only thing generating it, twice already in this arc.)
// Converting one and leaving the other would put the retired language on the page a reader reaches by
// ERROR while the page they reach by TYPO speaks the new one.
//
// `app/global-error.tsx` is deliberately NOT in this unit and its own header says why: it renders when
// the stylesheet may not have loaded, so its colour literals are the only correct implementation. A
// `sheet-*` class is a stylesheet class, which is exactly the dependency that file exists to avoid —
// so this direction cannot reach it, and that is a property rather than an omission.
export default function PortfolioError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[62vh] flex-col items-center justify-center px-6 pt-[var(--hero-nav-runway)] font-body">
      <div className="w-full max-w-[560px]">
        {/* The rule replaces a standalone accent eyebrow — the construction the direction retires by
            name, carrying an accent use that is none of its sanctioned four. */}
        <div className="sheet-rule">
          <span className="sheet-mark-text">Sheet —</span>
          <span className="sheet-rule-line" aria-hidden="true" />
          <span className="sheet-mark-text">Something went wrong</span>
        </div>

        <h1 className="sheet-h2 mt-[clamp(18px,2.4vw,30px)]">This page hit a snag.</h1>
        <p className="sheet-lede mt-[clamp(12px,1.4vw,18px)]">
          An unexpected error stopped this page from loading. You can try again, or head
          back home.
        </p>

        {/* Two controls, both squared. The primary keeps its accent on the resume control's
            precedent; the secondary already drew a hairline on a surface and only loses a corner. */}
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center bg-accent px-6 py-3 text-[0.95rem] font-semibold text-on-accent transition-colors hover:bg-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            Try again
          </button>
          {/* ⚠ THE SECONDARY'S FOREGROUND WAS ALSO INERT AND HAPPENED TO BE RIGHT, WHICH IS WHY IT
              MOVES TOO. `a { color: inherit }` is unlayered and beats any colour utility, so this
              anchor's text class drew nothing — and it asked for the primary ink, which is what it
              inherits anyway, so the correct value landed by coincidence. A class that renders nothing
              while looking like it works is a lie in the markup even when the pixels agree; the 404's
              sibling is the same shape with the pixels disagreeing at 1.07.

              The hover colour is left on the anchor DELIBERATELY: it is inert for the same reason, and
              moving it to the child would need the hover to be authored on the parent and read by the
              child, which is a mechanism this page does not need. Named rather than silently kept. */}
          <Link
            href="/"
            className="inline-flex items-center border border-etch/12 bg-surface px-6 py-3 text-[0.95rem] font-semibold transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <span className="text-text-primary">Back to home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
