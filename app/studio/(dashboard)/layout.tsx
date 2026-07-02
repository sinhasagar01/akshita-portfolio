import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudioData } from "@/lib/studio/data";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";

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

  const { projects, experience } = await getStudioData();

  return (
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
  );
}
