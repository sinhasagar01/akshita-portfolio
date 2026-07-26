import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import CaseStudyIndex from "@/components/studio/CaseStudyIndex";
import { STUDIO_PAGE } from "@/lib/studio/page-class";

export default async function StudioProjects() {
  // getStudioData().projects is F-2's draft-overlaid list — it already reflects
  // draft creates and deletes. CaseStudyIndex (client) owns order, add and remove;
  // editing one study happens at /studio/projects/<slug>, where it gets the full
  // width instead of sharing it with a rail of every other study.
  const { projects } = await getStudioData();

  return (
    <div className={STUDIO_PAGE}>
      <AreaHeader
        title="Case studies"
        sub="Pick one to edit its details and sections."
      />
      <CaseStudyIndex entries={projects} />
    </div>
  );
}
