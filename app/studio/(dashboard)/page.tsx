import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import { singletonHref, collectionListHref } from "@/lib/keystatic-links";
import {
  IconSparkles,
  IconGrid,
  IconUser,
  IconWorkflow,
  IconCode,
  IconLayers,
} from "@/components/studio/icons";

const settingsLink = singletonHref("siteSettings");

export default async function StudioHomepage() {
  const { settings, skills, projects } = await getStudioData();

  const projectCount = projects.length;
  const categoryCount = skills?.categories.length ?? 0;
  const settingsMissing: CardSignal[] = settings
    ? []
    : [{ label: "Not yet created", tone: "warn" }];
  const skillsMissing: CardSignal[] = skills
    ? []
    : [{ label: "Not yet created", tone: "warn" }];

  return (
    <>
      <AreaHeader title="Homepage" sub="What feeds the homepage. Edit in Keystatic." />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        <ContentCard
          index="01"
          title="Hero"
          icon={<IconSparkles />}
          status="live"
          meta="Site settings, copy and photo"
          note="facet labels in code"
          signals={settingsMissing}
          href={settingsLink}
          ariaLabel="Edit Hero copy in Keystatic site settings"
        />
        <ContentCard
          index="02"
          title="Work"
          icon={<IconGrid />}
          status="live"
          meta={`${projectCount} projects`}
          href={collectionListHref("projects")}
          ariaLabel="Open the Projects collection in Keystatic"
        />
        <ContentCard
          index="03"
          title="About"
          icon={<IconUser />}
          status="live"
          meta="Site settings, copy and chips"
          signals={settingsMissing}
          href={settingsLink}
          ariaLabel="Edit About copy in Keystatic site settings"
        />
        <ContentCard
          index="04"
          title="Process"
          icon={<IconWorkflow />}
          status="live"
          meta="Site settings, 4 copy fields"
          note="stage visuals in code"
          signals={settingsMissing}
          href={settingsLink}
          ariaLabel="Edit Process copy in Keystatic site settings"
        />
        <ContentCard
          index="05"
          title="Contact"
          icon={<IconCode />}
          status="code"
          meta="Form steps managed in source"
        />
        <ContentCard
          index="06"
          title="Skills"
          icon={<IconLayers />}
          status="live"
          meta={`${categoryCount} categories`}
          signals={skillsMissing}
          href={singletonHref("skills")}
          ariaLabel="Edit Skills in Keystatic"
        />
      </div>

      <p className="mt-5 text-[12px] text-text-subtle">
        Hero facets, Process stage visuals, and Contact steps are code-managed and
        edited in source, not here.
      </p>
    </>
  );
}
