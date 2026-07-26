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

  const { projects, experience, blog, skills, draftDiffers, draftReadError } = await getStudioData();
  // Client-side search index, built once from the data already loaded here.
  const searchItems = buildStudioSearchIndex({ projects, experience, skills });

  return (
    // Counts provider wraps BOTH the sidebar and the page so a list editor's
    // optimistic add/remove updates the sidebar badge live (it lives in this
    // layout, which does not re-run on client navigation). Seeded once from the
    // server counts.
    <StudioCountsProvider
      initial={{ projects: projects.length, experience: experience.length, blog: blog.length }}
    >
      {/* Full-bleed shell (Task 1). The outer rounded card is gone: the sidebar
          sits on cream-100, the working surface on cream-50, one hairline (the
          sidebar's border-r) between them. Page-level scroll is retained; the
          sidebar and topbar stick to the viewport (nothing here clips them). */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        <StudioSidebar />
        <main className="flex min-w-0 flex-1 flex-col bg-cream-50">
          <StudioTopbar searchItems={searchItems} />
          {/* The Publish bar lives at the layout level (persists across /studio
              navigation), seeded once from the branch-level differs, so a
              collection edit's "unpublished" signal shows on the page you're
              editing — not just Settings. Panels report differs + pending to it. */}
          <PublishProvider initialDiffers={draftDiffers} draftReadError={draftReadError}>
            {/* NO PADDING AND NO BOTTOM SPACER HERE. This used to be
                `<div className="p-4 lg:p-6">{children}</div>` plus an `h-20` spacer
                that kept the fixed PublishBar off the end of the content.
                Both assumed EVERY studio page wants a padded, page-scrolled column.
                The blog editor falsifies that — it is a full-height 3-pane layout
                whose panes scroll internally and which must reach the viewport
                edges. Each page now owns its own padding via STUDIO_PAGE (which
                folds the old spacer into a bottom pad), so the exception needs no
                negative margins to escape a shared wrapper. Negation was the
                alternative and it is the hack that decays. */}
            {children}
            <PublishBar />
          </PublishProvider>
        </main>
      </div>
    </StudioCountsProvider>
  );
}
