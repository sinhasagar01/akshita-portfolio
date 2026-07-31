import { getStudioData } from "@/lib/studio/data";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import SkillsEditor from "@/components/studio/SkillsEditor";

export default async function StudioSkills() {
  // skills is draft-preferred (SK-4): once a skills draft exists it shows here,
  // while the public homepage keeps reading live (the read-split).
  const { skills } = await getStudioData();

  return (
    <>
      {/* NO PAGE WRAPPER AND NO PAGE HEADER — see the experience route for the reasoning. The
          empty state keeps a padded box of its own, because it is not the shell: with no
          categories there is no rail and no detail pane, so a full-height split would be two
          empty columns beside a sentence. */}
      {!skills ? (
        <div className="p-4 lg:p-6">
          <StudioEmptyState>Skills have not been created yet.</StudioEmptyState>
        </div>
      ) : (
        <SkillsEditor categories={skills.categories} />
      )}
    </>
  );
}
