import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import {
  IconSparkles,
  IconGrid,
  IconUser,
  IconWorkflow,
  IconCode,
  IconLayers,
} from "@/components/studio/icons";
import { STUDIO_PAGE } from "@/lib/studio/page-class";

// Hero/About/Process are edited inline in the studio settings panel; Work in the
// projects panel; Skills in the skills panel (SK-4). All are real /studio editors.
const settingsPanel = "/studio/settings";
const projectsPanel = "/studio/projects";
const skillsPanel = "/studio/skills";

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
    <div className={STUDIO_PAGE}>
      <AreaHeader title="Homepage" sub="What feeds the homepage." />

      <div className="max-w-[60rem] border-t border-ink-950/8">
        <ContentCard
          index="01"
          title="Hero"
          icon={<IconSparkles />}
          status="live"
          meta="Site settings, copy and photo"
          note="facet labels in code"
          signals={settingsMissing}
          href={settingsPanel}
          ariaLabel="Edit Hero in the studio settings panel"
        />
        <ContentCard
          index="02"
          title="Work"
          icon={<IconGrid />}
          status="live"
          meta={`${projectCount} projects`}
          href={projectsPanel}
          ariaLabel="Open the Projects panel in the studio"
        />
        <ContentCard
          index="03"
          title="About"
          icon={<IconUser />}
          status="live"
          meta="Site settings, copy and chips"
          signals={settingsMissing}
          href={settingsPanel}
          ariaLabel="Edit About in the studio settings panel"
        />
        <ContentCard
          index="04"
          title="Process"
          icon={<IconWorkflow />}
          status="live"
          meta="Site settings, 4 copy fields"
          note="stage visuals in code"
          signals={settingsMissing}
          href={settingsPanel}
          ariaLabel="Edit Process in the studio settings panel"
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
          href={skillsPanel}
          ariaLabel="Edit Skills in the studio panel"
        />
      </div>

      <p className="mt-5 text-[12px] text-text-subtle">
        Hero facets, Process stage visuals, and Contact steps are code-managed and
        edited in source, not here.
      </p>
    </div>
  );
}
