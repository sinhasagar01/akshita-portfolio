import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ProjectsListEditor from "@/components/studio/ProjectsListEditor";

export default async function StudioProjects() {
  // getStudioData().projects is F-2's draft-overlaid list — it already reflects
  // draft creates and deletes. ProjectsListEditor (client) owns the add/remove
  // handlers, the two dialogs, and the create/delete route calls. It always
  // renders the list shell (even when empty) so "Add project" stays reachable.
  const { projects } = await getStudioData();

  return (
    <>
      <AreaHeader
        title="Projects"
        sub="Case studies, sorted by order. Add or remove projects; edit the summary and facts inline."
      />
      <ProjectsListEditor entries={projects} />
    </>
  );
}
