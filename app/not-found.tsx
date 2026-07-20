import Link from "next/link";
import type { Metadata } from "next";

// Root 404. Renders in the bare root layout (the site header/footer live in the
// (portfolio) layout, which this is outside of), so it is a self-contained branded
// page. The html element supplies the canvas background + ink text globally.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center font-body">
      <p
        aria-hidden="true"
        className="font-display italic font-normal leading-[0.8] text-accent-500/25 text-[clamp(7rem,22vw,13rem)]"
      >
        404
      </p>
      <p className="text-eyebrow tracking-[0.18em] uppercase font-semibold text-accent-600 mt-2">
        Page not found
      </p>
      <h1 className="font-display font-normal text-[clamp(1.9rem,4.5vw,2.75rem)] text-ink-950 leading-[1.1] mt-4">
        This page wandered off.
      </h1>
      <p className="text-[1rem] text-ink-600 leading-[1.6] mt-4 max-w-[42ch]">
        The page you were looking for is not here. It may have moved, or the link
        was mistyped.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-full bg-accent-500 px-6 py-3 text-[0.95rem] font-semibold text-cream-50 mt-9 transition-colors hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      >
        Back to home
      </Link>
    </main>
  );
}
