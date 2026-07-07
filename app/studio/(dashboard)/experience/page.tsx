import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ExperienceEditPanel from "@/components/studio/ExperienceEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { ListDetailLayout } from "@/components/studio/ListDetailLayout";
import { isCurrentRole } from "@/components/sections/experience-current";
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
        <ListDetailLayout
          sections={experience.map((e) => ({
            id: e.slug,
            name: e.company,
            // Same source of truth as the live site's Currently indicator: label
            // each entry that isCurrentRole (endDate empty/whitespace or "Present").
            badge: isCurrentRole(e.endDate) ? "Currently" : undefined,
          }))}
        >
          {experience.map((e) => (
            <ExperienceEditPanel
              key={e.slug}
              itemId={e.slug}
              slug={e.slug}
              company={e.company}
              title={e.title}
              startDate={e.startDate}
              endDate={e.endDate}
              location={e.location}
              description={e.description}
            />
          ))}
        </ListDetailLayout>
      )}
    </>
  );
}
