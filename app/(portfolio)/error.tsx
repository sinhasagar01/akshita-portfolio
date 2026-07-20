"use client";

import Link from "next/link";

// Error boundary for the public site. Renders in place of a failed page, WITHIN the
// (portfolio) layout (header + footer stay), so a thrown error shows a recoverable
// branded surface instead of the unstyled Next default. `reset` re-renders the segment.
export default function PortfolioError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[62vh] flex-col items-center justify-center px-6 text-center font-body">
      <p className="text-eyebrow tracking-[0.18em] uppercase font-semibold text-accent-600">
        Something went wrong
      </p>
      <h1 className="font-display font-normal text-[clamp(1.9rem,4.5vw,2.75rem)] text-ink-950 leading-[1.1] mt-4">
        This page hit a snag.
      </h1>
      <p className="text-[1rem] text-ink-600 leading-[1.6] mt-4 max-w-[44ch]">
        An unexpected error stopped this page from loading. You can try again, or head
        back home.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full bg-accent-500 px-6 py-3 text-[0.95rem] font-semibold text-cream-50 transition-colors hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-ink-950/12 bg-cream-50 px-6 py-3 text-[0.95rem] font-semibold text-ink-950 transition-colors hover:border-accent-500 hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
