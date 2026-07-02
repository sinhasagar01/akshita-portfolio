import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
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
        <EmptyState />
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

function EmptyState() {
  return (
    <a
      href={collectionListHref("experience")}
      className="block max-w-sm rounded-lg border border-ink-950/8 bg-cream-50 p-5 text-[13px] text-ink-600 hover:border-accent-500/40"
    >
      No experience entries yet. Open the Experience collection in Keystatic to add
      one.
    </a>
  );
}
