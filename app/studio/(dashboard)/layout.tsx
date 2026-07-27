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
      initial={{ projects: projects.length, experience: experience.length, blog: blog.length, skills: skills?.categories.length ?? 0 }}
    >
      {/* Full-bleed shell (Task 1). The outer rounded card is gone: the sidebar
          sits on cream-100, the working surface on cream-50, one hairline (the
          sidebar's border-r) between them. Page-level scroll is retained; the
          sidebar and topbar stick to the viewport (nothing here clips them). */}
      {/* A VIEWPORT HEIGHT AT `lg` MAKES THE WORK AREA'S HEIGHT DEFINITE, which is what a full-height page
          needs and what `min-h-screen` alone could never give it. A `flex-1 min-h-0` child
          only divides free space when its container has a resolved height; under
          `min-h-screen` the container sizes to its content, so the free space is indefinite,
          `flex-grow` does nothing, and the child sizes to ITS content instead. The blog
          editor measured 1230px tall inside a 960px viewport for exactly that reason, and
          `overflow-hidden` on the child did not help — overflow makes a box a scroll
          container, it does not remove the box's own content from intrinsic sizing.
          Deriving the height this way is also why nothing here hardcodes the topbar's 64px.

          THE OTHER NINE PAGES ARE UNAFFECTED because nothing here clips. `main` keeps
          `overflow: visible`, so a page taller than the viewport still overflows into the
          document's scroll region and the window scrolls exactly as before. Only a child
          that opts in with `flex-1 min-h-0` and its own overflow gets the app-shell
          behaviour, and today that is the blog editor alone.

          Below `lg` this is deliberately NOT applied. The sidebar stacks above the work
          area there, so a 100dvh main would push its own bottom off screen. Narrow widths
          keep ordinary document flow.

          IT IS SCOPED WITH `:has()` AND THAT IS NOT DECORATION. Applied unconditionally,
          a viewport-height rule BREAKS THE OTHER NINE PAGES: measured on /studio/projects at a 420px
          viewport, body went from clientHeight 520 (grown to fit, window scrolls) to
          clientHeight 420 against a scrollHeight of 520, and the last 100px became
          UNREACHABLE — neither the window nor body would scroll to it. A page-scrolled
          column and a full-height app shell are different layouts, and the layout cannot
          know which one it is holding. So the PAGE declares it: the blog editor's shell
          root carries `data-studio-fullheight`, this rule keys off it, and every page that
          does not opt in keeps exactly the box it had before. No route list here to fall
          out of step with the routes. */}
      <div className="flex min-h-screen flex-col lg:flex-row lg:has-[[data-studio-fullheight]]:h-dvh">
        <StudioSidebar />
        <main className="flex min-w-0 flex-1 flex-col bg-cream-50 lg:has-[[data-studio-fullheight]]:min-h-0">
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
