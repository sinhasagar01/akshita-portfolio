import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudioData } from "@/lib/studio/data";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";
import { PublishProvider } from "@/components/studio/PublishProvider";
import { StudioCountsProvider } from "@/components/studio/StudioCountsProvider";
import PublishBar from "@/components/studio/PublishBar";
import { buildStudioSearchIndex } from "@/lib/studio/search-index";

// GH-6 — owner gate for the whole /studio dashboard. Runs in the Node RSC
// runtime (verifyOwnerSession uses node:crypto, which Edge middleware cannot
// run), and runs BEFORE getStudioData so an unauthenticated request never
// triggers a GitHub read and never renders any dashboard content.
//
// Known tradeoff: a layout does not re-run on client-side navigation, so a
// session expiring mid-browse is not enforced here until a hard reload. That is
// acceptable for a single-owner tool because every write endpoint keeps its own
// owner gate (defense in depth), so no action can be taken with a dead session.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    redirect("/studio/login");
  }

  const { projects, experience, skills, draftDiffers, draftReadError } = await getStudioData();
  // Client-side search index, built once from the data already loaded here.
  const searchItems = buildStudioSearchIndex({ projects, experience, skills });

  return (
    <div className="mx-auto max-w-[1900px] px-4 py-6 lg:px-6 lg:py-8">
      {/* Counts provider wraps BOTH the sidebar and the page so a list editor's
          optimistic add/remove updates the sidebar badge live (it lives in this
          layout, which does not re-run on client navigation). Seeded once from
          the server counts. */}
      <StudioCountsProvider
        initial={{ projects: projects.length, experience: experience.length }}
      >
        <div className="flex flex-col overflow-hidden rounded-xl border border-ink-950/8 bg-cream-50 lg:min-h-[640px] lg:flex-row">
          <StudioSidebar />
          <main className="min-w-0 flex-1 p-4 lg:p-6">
            <StudioTopbar searchItems={searchItems} />
            {/* The Publish bar lives at the layout level (persists across /studio
                navigation), seeded once from the branch-level differs, so a
                collection edit's "unpublished" signal shows on the page you're
                editing — not just Settings. Panels report differs + pending to it. */}
            <PublishProvider initialDiffers={draftDiffers} draftReadError={draftReadError}>
              {children}
              <div className="h-20" aria-hidden />
              <PublishBar />
            </PublishProvider>
          </main>
        </div>
      </StudioCountsProvider>
    </div>
  );
}
