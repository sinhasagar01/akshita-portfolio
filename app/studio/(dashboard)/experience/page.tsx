import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ExperienceListEditor from "@/components/studio/ExperienceListEditor";

export default async function StudioExperience() {
  // getStudioData().experience is F-2's draft-overlaid list — it already reflects
  // draft creates and deletes. ExperienceListEditor (client) owns the add/remove
  // handlers, the two dialogs, and the create/delete route calls. It always
  // renders the list shell (even when empty) so "Add experience" stays reachable.
  const { experience } = await getStudioData();

  return (
    <>
      <AreaHeader
        title="Experience"
        sub="Roles, sorted by order. Add or remove entries; edit the title, dates, and location inline."
      />
      <ExperienceListEditor entries={experience} />
    </>
  );
}
