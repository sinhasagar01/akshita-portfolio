import type { Metadata } from "next";
import { getStudioData } from "@/lib/studio/data";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";

// Private content dashboard — keep it out of search indexes, the same way the
// Keystatic admin is handled. robots.ts also disallows /studio/.
export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projects, experience } = await getStudioData();

  return (
    <div className="min-h-screen bg-canvas font-body text-ink-950">
      <div className="mx-auto max-w-[1100px] px-4 py-6 lg:px-6 lg:py-8">
        <div className="flex flex-col overflow-hidden rounded-xl border border-ink-950/8 bg-cream-50 lg:min-h-[640px] lg:flex-row">
          <StudioSidebar
            projectCount={projects.length}
            experienceCount={experience.length}
          />
          <main className="min-w-0 flex-1 p-4 lg:p-6">
            <StudioTopbar />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
