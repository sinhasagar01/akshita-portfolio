import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { collectionItemHref, collectionListHref } from "@/lib/keystatic-links";
import { IconBriefcase } from "@/components/studio/icons";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function StudioExperience() {
  const { experience } = await getStudioData();

  return (
    <>
      <AreaHeader
        title="Experience"
        sub="Roles, sorted by order. Each opens its own editor."
      />

      {experience.length === 0 ? (
        <StudioEmptyState href={collectionListHref("experience")}>
          No experience entries yet. Open the Experience collection in Keystatic to add one.
        </StudioEmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
          {experience.map((e, i) => {
            const signals: CardSignal[] = e.description.trim()
              ? []
              : [{ label: "No description", tone: "warn" }];

            const range = [e.startDate, e.endDate].filter(Boolean).join(" – ");
            const meta = [e.title, range].filter(Boolean).join(", ");

            return (
              <ContentCard
                key={e.slug}
                index={pad(i + 1)}
                title={e.company}
                icon={<IconBriefcase />}
                status="live"
                meta={meta || undefined}
                signals={signals}
                href={collectionItemHref("experience", e.slug)}
                ariaLabel={`Edit ${e.company} in Keystatic`}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

