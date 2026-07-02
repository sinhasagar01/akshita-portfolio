import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import { singletonHref } from "@/lib/keystatic-links";
import { IconLayers } from "@/components/studio/icons";

const pad = (n: number) => String(n).padStart(2, "0");
const skillsLink = singletonHref("skills");

export default async function StudioSkills() {
  const { skills } = await getStudioData();

  const categories = skills?.categories ?? [];

  return (
    <>
      <AreaHeader
        title="Skills"
        sub="Categories live in one singleton. Every card opens the same editor."
      />

      {!skills || categories.length === 0 ? (
        <a
          href={skillsLink}
          className="block max-w-sm rounded-lg border border-ink-950/8 bg-cream-50 p-5 text-[13px] text-ink-600 hover:border-accent-500/40"
        >
          {skills
            ? "No categories yet. Open Skills in Keystatic to add one."
            : "Skills not yet created. Open Skills in Keystatic to set it up."}
        </a>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
          {categories.map((cat, i) => {
            const count = cat.items.length;
            const signals: CardSignal[] =
              count === 0 ? [{ label: "Empty category", tone: "warn" }] : [];

            return (
              <ContentCard
                key={cat.category}
                index={pad(i + 1)}
                title={cat.category}
                icon={<IconLayers />}
                status="live"
                meta={`${count} ${count === 1 ? "skill" : "skills"}`}
                signals={signals}
                href={skillsLink}
                ariaLabel={`Edit Skills in Keystatic`}
              >
                {count > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item) => (
                      <span
                        key={item}
                        className="inline-block rounded-full border border-ink-950/8 bg-cream-200 px-2 py-0.5 text-[10px] text-ink-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </ContentCard>
            );
          })}
        </div>
      )}
    </>
  );
}
