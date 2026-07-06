import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ExperienceEditPanel from "@/components/studio/ExperienceEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { collectionListHref } from "@/lib/keystatic-links";

export default async function StudioExperience() {
  const { experience } = await getStudioData();

  return (
    <>
      <AreaHeader
        title="Experience"
        sub="Roles, sorted by order. Edit the title, dates, and description inline."
      />

      {experience.length === 0 ? (
        <StudioEmptyState href={collectionListHref("experience")}>
          No experience entries yet. Open the Experience collection in Keystatic to add one.
        </StudioEmptyState>
      ) : (
        <div className="flex flex-col gap-3.5">
          {experience.map((e) => (
            <ExperienceEditPanel
              key={e.slug}
              slug={e.slug}
              company={e.company}
              title={e.title}
              startDate={e.startDate}
              endDate={e.endDate}
              description={e.description}
            />
          ))}
        </div>
      )}
    </>
  );
}
