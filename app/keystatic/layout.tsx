import type { Metadata } from "next";

// The CMS admin UI is private — keep it out of search indexes (robots.ts also disallows it).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
