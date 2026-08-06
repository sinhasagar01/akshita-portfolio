import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import OverviewRow, { type CardSignal } from "@/components/studio/OverviewRow";
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
      {/* ONE CAP, DECLARED ONCE, AROUND THE HEAD AND THE LIST TOGETHER.
          The head used to sit outside it, so its box ran the full 1237px while the list capped
          at 960 — a 277px overhang. TIDYING RATHER THAN A FIX: measured, nothing actually
          overhangs, because the `h1` renders 80px ("Homepage") and the lede carries its own
          650.926px cap, so the two boxes disagreed without anything showing it. It would only
          become visible if a page title exceeded 960px, which none does.
          NOT ON `AreaHeader` ITSELF, which is shared: the blog and projects indexes render it
          too and their content is UNCAPPED, so capping the component would create the inverse
          misalignment on two pages to fix it on one. Same shared-seam trap #239 and #240 both
          found. Wrapping both children here also means the 60rem is stated once, so the head and
          the list cannot drift apart again. */}
      <div className="max-w-[60rem]">
      <AreaHeader title="Homepage" sub="What feeds the homepage." />

      <div className="border-t border-studio-ink-950/12">
        <OverviewRow
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
        <OverviewRow
          index="02"
          title="Work"
          icon={<IconGrid />}
          status="live"
          meta={`${projectCount} projects`}
          href={projectsPanel}
          ariaLabel="Open the Projects panel in the studio"
        />
        <OverviewRow
          index="03"
          title="About"
          icon={<IconUser />}
          status="live"
          meta="Site settings, copy and chips"
          signals={settingsMissing}
          href={settingsPanel}
          ariaLabel="Edit About in the studio settings panel"
        />
        <OverviewRow
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
        <OverviewRow
          index="05"
          title="Contact"
          icon={<IconCode />}
          status="code"
          meta="Form steps managed in source"
        />
        <OverviewRow
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

      <p className="mt-5 text-[12px] text-studio-text-subtle">
        Hero facets, Process stage visuals, and Contact steps are code-managed and
        edited in source, not here.
      </p>
      </div>
    </div>
  );
}
