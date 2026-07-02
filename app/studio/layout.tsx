import type { Metadata } from "next";

// Private content dashboard — keep it out of search indexes, the same way the
// Keystatic admin is handled. robots.ts also disallows /studio/. This thin
// layout wraps BOTH the login page and the gated (dashboard) route group, so the
// noindex and the page canvas apply to the login screen too. The owner gate and
// the dashboard chrome live in app/studio/(dashboard)/layout.tsx.
export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas font-body text-ink-950">{children}</div>
  );
}
