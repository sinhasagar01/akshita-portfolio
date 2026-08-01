import { cookies } from "next/headers";
import { getStudioData } from "@/lib/studio/data";
import CaseStudyIndex from "@/components/studio/CaseStudyIndex";
import { STUDIO_PAGE } from "@/lib/studio/page-class";
import { INDEX_VIEW_COOKIE, parseIndexView } from "@/lib/studio/index-view";

export default async function StudioProjects() {
  // getStudioData().projects is F-2's draft-overlaid list — it already reflects
  // draft creates and deletes. CaseStudyIndex (client) owns order, add and remove;
  // editing one study happens at /studio/projects/<slug>, where it gets the full
  // width instead of sharing it with a rail of every other study.
  const { projects } = await getStudioData();

  // THE VIEW IS RESOLVED HERE, ON THE SERVER, so the first HTML is already the right one and
  // there is nothing for hydration to correct.
  // READ IN THE ROUTE RATHER THAN THE DASHBOARD LAYOUT: that layout serves ten pages and this
  // value belongs to one, so putting it there would thread a projects-only prop through nine
  // surfaces that never read it. Same shared-seam question #239, #240 and #244 each answered
  // the same way. The route is already dynamic — it awaits getStudioData — so the jar is free.
  const view = parseIndexView((await cookies()).get(INDEX_VIEW_COOKIE)?.value);

  return (
    <div className={STUDIO_PAGE}>
      {/* NO 60rem CAP HERE, AND THAT IS A DECISION RATHER THAN AN OMISSION.
          #239's field measure exists so a line of PROSE does not run to an unreadable length, and
          it is right on the four pages of fields it was written for. This page has no prose: the
          grid is cards, and the list's summary is a SINGLE TRUNCATED LINE, so extra width buys
          more cards per row and a longer visible summary rather than a harder-to-read paragraph.
          Capping it here would leave the page's right third empty on a wide display to protect a
          measure nothing on the page is subject to.
          `AreaHeader` was never capped either — #244 established it must not be, since the blog
          index renders it uncapped too. */}
      {/* `AreaHeader` IS RENDERED BY THE INDEX, NOT HERE, so it can share a flex row with the
          search and the switcher — those need client state and a title does not, and one row
          cannot span a server and a client component. It is still uncapped, which is all #244
          asks of the shared component. */}
      <CaseStudyIndex entries={projects} initialView={view} />
    </div>
  );
}
