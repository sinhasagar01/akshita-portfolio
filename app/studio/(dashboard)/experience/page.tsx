import { getStudioData } from "@/lib/studio/data";
import ExperienceListEditor from "@/components/studio/ExperienceListEditor";

export default async function StudioExperience() {
  // getStudioData().experience is F-2's draft-overlaid list — it already reflects
  // draft creates and deletes. ExperienceListEditor (client) owns the add/remove
  // handlers, the two dialogs, and the create/delete route calls. It always
  // renders the list shell (even when empty) so "Add experience" stays reachable.
  const { experience } = await getStudioData();

  // NO PAGE WRAPPER AND NO PAGE HEADER, and the second half is the visible change.
  // A full-height shell has no padded page for an `h1` to sit in, so keeping one would mean
  // inventing a fourth horizontal band or floating a header over a pane — neither of which the
  // contract draws. And the title is ALREADY ON SCREEN TWICE: the sidebar's active nav item
  // names the area, and the detail pane's bar names the entry being edited. An `h1` between them
  // is the third statement of a fact nobody was unsure about. The blog and case-study editors
  // have worked this way since #178 and #233 and no page title has been missed there.
  return <ExperienceListEditor entries={experience} />;
}
