import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import config from "@/keystatic.config";
import type { ProcessStage, LinkItem } from "@/lib/studio/site-settings-format";

export type { ProcessStage, LinkItem };

const reader = createReader(process.cwd(), config);

type DocumentNode = { children: unknown[]; [key: string]: unknown };

export type SiteSettingsEntry = {
  heroCopy: string;
  tab1Label: string;
  tab1Line: string;
  tab2Label: string;
  tab2Line: string;
  tab3Label: string;
  tab3Line: string;
  tab4Label: string;
  tab4Line: string;
  heroRoleLabel: string;
  heroScrollCue: string;
  photo: string | null;
  aboutCopy: string;
  aboutNote: string;
  aboutFocusChips: string[];
  aboutSubtext: string;
  aboutPhotoCaption: string;
  processStages: ProcessStage[];
  email: string;
  links: LinkItem[];
};

export type SkillsEntry = {
  categories: { category: string; items: string[] }[];
};

export type ProjectListItem = {
  slug: string;
  title: string;
  summary: string;
  orderIndex: number;
  heroImage: string | null;
  facts: { role: string; type: string; platform: string; timeline: string };
};

export type ExperienceListItem = {
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
  orderIndex: number;
};

export type HomePageData = {
  settings: SiteSettingsEntry | null;
  skills: SkillsEntry | null;
  projects: ProjectListItem[];
  experience: ExperienceListItem[];
};

function resolveSlugField(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && "value" in value) {
    return (value as { value: string }).value;
  }
  return fallback;
}

/** Map a raw processStages value to ProcessStage[] in a fixed {name,
 *  description, tags} key order, so the canonical dump used by the differ is
 *  stable. Non-arrays and missing sub-fields coalesce to empty. */
function mapProcessStages(raw: unknown): ProcessStage[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = (item ?? {}) as Record<string, unknown>;
    return {
      name: (obj.name as string) ?? "",
      description: (obj.description as string) ?? "",
      tags: Array.isArray(obj.tags) ? obj.tags.map(String) : [],
    };
  });
}

/** Map a raw links value to LinkItem[] in a fixed {label, url} key order, so the
 *  canonical dump used by the differ is stable (item 10). Non-arrays and missing
 *  sub-fields coalesce to empty. */
function mapLinks(raw: unknown): LinkItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = (item ?? {}) as Record<string, unknown>;
    return { label: (obj.label as string) ?? "", url: (obj.url as string) ?? "" };
  });
}

/** Map a raw siteSettings reader entry to SiteSettingsEntry. The ONE shared
 *  mapper — used by the live read below and by the /studio draft-branch read
 *  (lib/studio/draft-site-settings.ts), so the two paths cannot drift. */
export function mapSiteSettings(raw: Record<string, unknown>): SiteSettingsEntry {
  return {
    heroCopy: (raw.heroCopy as string) ?? "",
    tab1Label: (raw.tab1Label as string) ?? "",
    tab1Line: (raw.tab1Line as string) ?? "",
    tab2Label: (raw.tab2Label as string) ?? "",
    tab2Line: (raw.tab2Line as string) ?? "",
    tab3Label: (raw.tab3Label as string) ?? "",
    tab3Line: (raw.tab3Line as string) ?? "",
    tab4Label: (raw.tab4Label as string) ?? "",
    tab4Line: (raw.tab4Line as string) ?? "",
    heroRoleLabel: (raw.heroRoleLabel as string) ?? "",
    heroScrollCue: (raw.heroScrollCue as string) ?? "",
    photo: (raw.photo as string | null) ?? null,
    aboutCopy: (raw.aboutCopy as string) ?? "",
    aboutNote: (raw.aboutNote as string) ?? "",
    aboutFocusChips: ((raw.aboutFocusChips as readonly unknown[]) ?? []).map(String),
    aboutSubtext: (raw.aboutSubtext as string) ?? "",
    aboutPhotoCaption: (raw.aboutPhotoCaption as string) ?? "",
    processStages: mapProcessStages(raw.processStages),
    email: (raw.email as string) ?? "",
    links: mapLinks(raw.links),
  };
}

/** Map the raw skills singleton to a SkillsEntry — categories, each with a name
 *  and a string[] of items. Missing sub-fields coalesce to empty, matching the
 *  other mappers. The null-singleton guard stays at the call site (as with
 *  mapSiteSettings). Exported so the skills draft read (SK-4) shares one source. */
export function mapSkills(raw: Record<string, unknown>): SkillsEntry {
  return {
    categories: ((raw.categories as readonly unknown[]) ?? []).map((cat) => ({
      category: (cat as { category?: string }).category ?? "",
      items: ((cat as { items?: readonly unknown[] }).items ?? []).map((i) => String(i)),
    })),
  };
}

/** Read just the siteSettings singleton (mapped). Split out so the site chrome
 *  (SiteHeader/SiteFooter, PL-2a) can source its links without reading the
 *  projects/experience/skills collections it never uses. cache() dedupes the
 *  layout + page reads within a request. */
export const getSiteSettings = cache(
  async (): Promise<SiteSettingsEntry | null> => {
    const raw = await reader.singletons.siteSettings.read();
    return raw ? mapSiteSettings(raw as Record<string, unknown>) : null;
  }
);

/** Map one project reader entry to a ProjectListItem. Extracted so the studio
 *  draft-branch read (CE-3b) maps entries identically to the live read — one
 *  source of truth. Behavior-identical to the previous inline map. */
export function mapProjectListItem(slug: string, entry: Record<string, unknown>): ProjectListItem {
  return {
    slug,
    title: resolveSlugField(entry.title, slug),
    summary: (entry.summary ?? "") as string,
    orderIndex: (entry.orderIndex ?? 99) as number,
    heroImage: entry.heroImage as string | null,
    facts: {
      role: ((entry.facts as Record<string, string> | null)?.role) ?? "",
      type: ((entry.facts as Record<string, string> | null)?.type) ?? "",
      platform: ((entry.facts as Record<string, string> | null)?.platform) ?? "",
      timeline: ((entry.facts as Record<string, string> | null)?.timeline) ?? "",
    },
  };
}

/** Map one experience reader entry to an ExperienceListItem (see mapProjectListItem). */
export function mapExperienceListItem(slug: string, entry: Record<string, unknown>): ExperienceListItem {
  return {
    slug,
    company: resolveSlugField(entry.company, slug),
    title: (entry.title ?? "") as string,
    startDate: (entry.startDate ?? "") as string,
    endDate: (entry.endDate ?? "") as string,
    description: (entry.description ?? "") as string,
    location: (entry.location ?? "") as string,
    orderIndex: (entry.orderIndex ?? 0) as number,
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  const [settings, skillsRaw, projectsRaw, experienceRaw] =
    await Promise.all([
      getSiteSettings(),
      reader.singletons.skills.read(),
      reader.collections.projects.all(),
      reader.collections.experience.all(),
    ]);

  const skills: SkillsEntry | null = skillsRaw
    ? mapSkills(skillsRaw as Record<string, unknown>)
    : null;

  const projects: ProjectListItem[] = (projectsRaw as Awaited<typeof projectsRaw>)
    .map(({ slug, entry }) => mapProjectListItem(slug, entry as Record<string, unknown>))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const experience: ExperienceListItem[] = (
    experienceRaw as Awaited<typeof experienceRaw>
  )
    .map(({ slug, entry }) => mapExperienceListItem(slug, entry as Record<string, unknown>))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return { settings, skills, projects, experience };
}

export type HeroBlockData = { discriminant: "heroBlock"; value: { thesis: string } };
export type SummaryGridData = { discriminant: "summaryGrid"; value: { product: string; problem: string; details: string; solution: string; result: string } };
export type ImpactNumbersData = { discriminant: "impactNumbers"; value: { stat1Number: string; stat1Label: string; stat2Number: string; stat2Label: string; stat3Number: string; stat3Label: string } };
export type ContextBlockData = { discriminant: "context"; value: { body: DocumentNode[] } };
export type ProblemBlockData = { discriminant: "problem"; value: { statement: string; image: string | null } };
export type GoalsBlockData = { discriminant: "goals"; value: { northStar: string; goals: string[] } };
export type ProcessStepsData = { discriminant: "processSteps"; value: { steps: { phase: string; description: string }[] } };
export type KeyInsightsData = { discriminant: "keyInsights"; value: { insights: { number: string; insight: string }[] } };
export type SolutionRevealData = { discriminant: "solutionReveal"; value: { headline: string; image: string | null } };
export type GuidedDesignStepData = { discriminant: "guidedDesignStep"; value: { title: string; caption: string; image: string | null } };
export type ImageGalleryData = { discriminant: "imageGallery"; value: { image1: string | null; image2: string | null; image3: string | null; caption: string } };
export type ComparisonData = { discriminant: "comparison"; value: { beforeImage: string | null; afterImage: string | null; caption: string } };
export type QuoteBlockData = { discriminant: "quote"; value: { text: string; attribution: string } };
export type ReflectionBlockData = { discriminant: "reflection"; value: { body: DocumentNode[] } };
export type ClosingLineData = { discriminant: "closingLine"; value: { line: string } };

export type CaseStudyBlock =
  | HeroBlockData | SummaryGridData | ImpactNumbersData | ContextBlockData
  | ProblemBlockData | GoalsBlockData | ProcessStepsData | KeyInsightsData
  | SolutionRevealData | GuidedDesignStepData | ImageGalleryData | ComparisonData
  | QuoteBlockData | ReflectionBlockData | ClosingLineData;

export type CaseStudyData = {
  slug: string;
  title: string;
  summary: string;
  heroImage: string | null;
  facts: { role: string; type: string; platform: string; timeline: string };
  blocks: CaseStudyBlock[];
  /** P4 3(d) — the RAW `sections` value (the 3(b) schema), passed through
   *  unmapped. The [slug] page's fallback switch renders via the 3(c) adapter +
   *  CaseStudyView when this is a non-empty array, else via the legacy `blocks`
   *  path above. Removed with the old path once all three projects migrate. */
  rawSections: unknown;
};

async function resolveBlock(raw: { discriminant: string; value: Record<string, unknown> }): Promise<CaseStudyBlock | null> {
  const { discriminant, value } = raw;
  switch (discriminant) {
    case "heroBlock":
      return { discriminant, value: { thesis: (value.thesis as string) ?? "" } };
    case "summaryGrid":
      return { discriminant, value: { product: (value.product as string) ?? "", problem: (value.problem as string) ?? "", details: (value.details as string) ?? "", solution: (value.solution as string) ?? "", result: (value.result as string) ?? "" } };
    case "impactNumbers":
      return { discriminant, value: { stat1Number: (value.stat1Number as string) ?? "", stat1Label: (value.stat1Label as string) ?? "", stat2Number: (value.stat2Number as string) ?? "", stat2Label: (value.stat2Label as string) ?? "", stat3Number: (value.stat3Number as string) ?? "", stat3Label: (value.stat3Label as string) ?? "" } };
    case "context": {
      const nodes = await (value.body as () => Promise<unknown[]>)();
      return { discriminant, value: { body: nodes as DocumentNode[] } };
    }
    case "problem":
      return { discriminant, value: { statement: (value.statement as string) ?? "", image: value.image as string | null } };
    case "goals": {
      const goalsRaw = value.goals as readonly unknown[];
      return { discriminant, value: { northStar: (value.northStar as string) ?? "", goals: goalsRaw.map((g) => String(g)) } };
    }
    case "processSteps": {
      const stepsRaw = value.steps as readonly Record<string, unknown>[];
      return { discriminant, value: { steps: stepsRaw.map((s) => ({ phase: (s.phase as string) ?? "", description: (s.description as string) ?? "" })) } };
    }
    case "keyInsights": {
      const insightsRaw = value.insights as readonly Record<string, unknown>[];
      return { discriminant, value: { insights: insightsRaw.map((i) => ({ number: (i.number as string) ?? "", insight: (i.insight as string) ?? "" })) } };
    }
    case "solutionReveal":
      return { discriminant, value: { headline: (value.headline as string) ?? "", image: value.image as string | null } };
    case "guidedDesignStep":
      return { discriminant, value: { title: (value.title as string) ?? "", caption: (value.caption as string) ?? "", image: value.image as string | null } };
    case "imageGallery":
      return { discriminant, value: { image1: value.image1 as string | null, image2: value.image2 as string | null, image3: value.image3 as string | null, caption: (value.caption as string) ?? "" } };
    case "comparison":
      return { discriminant, value: { beforeImage: value.beforeImage as string | null, afterImage: value.afterImage as string | null, caption: (value.caption as string) ?? "" } };
    case "quote":
      return { discriminant, value: { text: (value.text as string) ?? "", attribution: (value.attribution as string) ?? "" } };
    case "reflection": {
      const nodes = await (value.body as () => Promise<unknown[]>)();
      return { discriminant, value: { body: nodes as DocumentNode[] } };
    }
    case "closingLine":
      return { discriminant, value: { line: (value.line as string) ?? "" } };
    default:
      return null;
  }
}

export async function getCaseStudyData(slug: string): Promise<CaseStudyData | null> {
  const entry = await reader.collections.projects.read(slug);
  if (!entry) return null;

  const rawBlocks = (entry.body ?? []) as readonly { discriminant: string; value: Record<string, unknown> }[];
  const resolved = await Promise.all(rawBlocks.map(resolveBlock));
  const blocks = resolved.filter((b): b is CaseStudyBlock => b !== null);

  return {
    slug,
    title: resolveSlugField(entry.title, slug),
    summary: (entry.summary ?? "") as string,
    heroImage: entry.heroImage as string | null,
    facts: {
      role: ((entry.facts as Record<string, string> | null)?.role) ?? "",
      type: ((entry.facts as Record<string, string> | null)?.type) ?? "",
      platform: ((entry.facts as Record<string, string> | null)?.platform) ?? "",
      timeline: ((entry.facts as Record<string, string> | null)?.timeline) ?? "",
    },
    blocks,
    rawSections: (entry as Record<string, unknown>).sections,
  };
}

export async function getProjectSlugs(): Promise<string[]> {
  return reader.collections.projects.list();
}
