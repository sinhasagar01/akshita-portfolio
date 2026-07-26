import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import SkillsEditor from "@/components/studio/SkillsEditor";
import { STUDIO_PAGE } from "@/lib/studio/page-class";

export default async function StudioSkills() {
  // skills is draft-preferred (SK-4): once a skills draft exists it shows here,
  // while the public homepage keeps reading live (the read-split).
  const { skills } = await getStudioData();

  return (
    <div className={STUDIO_PAGE}>
      <AreaHeader
        title="Skills"
        sub="Categories and the skills in each, edited here and published from the Publish bar."
      />

      {!skills ? (
        <StudioEmptyState>Skills have not been created yet.</StudioEmptyState>
      ) : (
        <SkillsEditor categories={skills.categories} />
      )}
    </div>
  );
}
