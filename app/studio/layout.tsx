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
    // `studio-chrome` carries the STUDIO RADIUS SCALE (globals.css) — three custom
    // properties, scoped rather than added to @theme because the design needs a 12px step
    // the theme scale cannot express. THIS layout is the right host precisely because of
    // the note above: it wraps the login page AND the dashboard, so login inherits the
    // scale instead of falling back to the literals baked into each utility.
    <div className="studio-chrome min-h-screen bg-canvas font-body text-studio-ink-950">
      {children}
    </div>
  );
}
