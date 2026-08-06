import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudioData } from "@/lib/studio/data";
import { resolveTheme } from "@/lib/theme";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";
import { PublishProvider } from "@/components/studio/PublishProvider";
import { StudioCountsProvider } from "@/components/studio/StudioCountsProvider";
import PublishBar from "@/components/studio/PublishBar";
import { buildStudioSearchIndex } from "@/lib/studio/search-index";
import SidebarWidthProvider from "@/components/studio/SidebarWidthProvider";
import SidebarResizer from "@/components/studio/SidebarResizer";
import { clampSidebarWidth, SIDEBAR_COOKIE } from "@/lib/studio/sidebar-width";

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

  // THE WIDTH COMES OFF THE SAME JAR AS THE SESSION, which is the whole reason there is no
  // hydration flash: the server renders the sidebar at the stored width, so the first paint is
  // correct rather than corrected. CLAMPED ON THE READ — a cookie written while the bounds were
  // wider outlives the build that allowed it, so the stored value is advisory and the clamp is
  // always today's. See lib/studio/sidebar-width.ts.
  const sidebarWidth = clampSidebarWidth(jar.get(SIDEBAR_COOKIE)?.value);

  const { projects, experience, blog, skills, settings, draftDiffers, draftReadError } = await getStudioData();
  /* THE PENDING THEME, WHICH IS THE DRAFT'S AND NOT THE PUBLISHED ONE. `getStudioData()` is
     draft-preferring for settings, so a theme saved but not yet published resolves here while
     `<html>` still carries the live value from the root layout's published read. */
  const canvasTheme = resolveTheme(settings?.theme);
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
      {/* Full-bleed shell (Task 1). The outer card and its corner radius are gone: the sidebar
          sits on cream-100, the working surface on cream-50, one hairline (the
          sidebar's border-r) between them. Page-level scroll is retained; the
          sidebar and topbar stick to the viewport (nothing here clips them). */}
      {/* A VIEWPORT HEIGHT AT `lg` MAKES THE WORK AREA'S HEIGHT DEFINITE, which is what a full-height page
          needs and what `min-h-screen` alone could never give it. A `flex-1 min-h-0` child
          only divides free space when its container has a resolved height; under
          `min-h-screen` the container sizes to its content, so the free space is indefinite,
          the grow factor does nothing, and the child sizes to ITS content instead. The blog
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
      {/* The provider RENDERS this div rather than wrapping it — the custom property has to be
          declared on the element the server already emits, or the SSR value and the client's
          per-move write would land on two different ancestors and the nearer one would win.
          The DOM is unchanged; only who renders it moved. */}
      <SidebarWidthProvider
        initial={sidebarWidth}
        className="flex min-h-screen flex-col lg:flex-row lg:has-[[data-studio-fullheight]]:h-dvh"
      >
        <StudioSidebar />
        {/* A SIBLING OF THE ASIDE, NOT A CHILD. The aside is `lg:overflow-y-auto`, so a handle
            inside it would scroll with the nav and disappear. It sits in the flex row between
            the sidebar and main, where the seam it drags actually is. */}
        <SidebarResizer />
        {/* ⚠ THE PENDING-THEME PREVIEW, AND IT IS ONE ATTRIBUTE RATHER THAN A SECOND MECHANISM.
            6b put `data-theme` on `<html>` from the PUBLISHED settings; this nested attribute
            overrides it for the dashboard subtree with the DRAFT value, by the ordinary cascade.
            So an author who switches theme and saves sees it on real content — the canvas renders
            public components at the public measure — before anything is published.

            ⚠ AND IT SITS THIS HIGH SAFELY ONLY BECAUSE OF THE FREEZE, WHICH IS THE POINT OF #323.
            `studio-palette` B1 asserts ZERO live references to the public palette anywhere in
            studio source, and `studio-tokens` C1 asserts every frozen colour is a literal rather
            than an alias reaching back. So the chrome cannot move when this attribute changes —
            immune BY CONSTRUCTION, not by threading the value carefully down to a canvas wrapper
            and hoping nothing else picked it up. The canvas is the only thing under here that
            draws from the public palette, so the attribute reaches exactly it. */}
        <main data-theme={canvasTheme} className="flex min-w-0 flex-1 flex-col bg-studio-cream-50 lg:has-[[data-studio-fullheight]]:min-h-0">
          <StudioTopbar searchItems={searchItems} />
          {/* The Publish bar lives at the layout level (persists across /studio
              navigation), seeded once from the branch-level differs, so a
              collection edit's "unpublished" signal shows on the page you're
              editing — not just Settings. Panels report differs + pending to it. */}
          <PublishProvider initialDiffers={draftDiffers} draftReadError={draftReadError}>
            {/* NO PADDING AND NO BOTTOM SPACER HERE. This used to be
                the page padding wrapper plus a 5rem tail spacer
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
      </SidebarWidthProvider>
    </StudioCountsProvider>
  );
}
