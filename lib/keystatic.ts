import { createReader } from "@keystatic/core/reader";
import config from "@/keystatic.config";

const reader = createReader(process.cwd(), config);

type DocumentNode = { children: unknown[]; [key: string]: unknown };

export type SiteSettingsEntry = {
  heroCopy: string;
  positioningLine: string;
  photo: string | null;
  aboutCopy: string;
  discoverText: string;
  defineText: string;
  developText: string;
  deliverText: string;
  resumeUrl: string | null;
  email: string;
  linkedinUrl: string | null;
  dribbbleUrl: string | null;
  behanceUrl: string | null;
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

export async function getHomePageData(): Promise<HomePageData> {
  const [settingsRaw, skillsRaw, projectsRaw, experienceRaw] =
    await Promise.all([
      reader.singletons.siteSettings.read(),
      reader.singletons.skills.read(),
      reader.collections.projects.all(),
      reader.collections.experience.all(),
    ]);

  const settings: SiteSettingsEntry | null = settingsRaw
    ? {
        heroCopy: settingsRaw.heroCopy ?? "",
        positioningLine: settingsRaw.positioningLine ?? "",
        photo: settingsRaw.photo as string | null,
        aboutCopy: settingsRaw.aboutCopy ?? "",
        discoverText: settingsRaw.discoverText ?? "",
        defineText: settingsRaw.defineText ?? "",
        developText: settingsRaw.developText ?? "",
        deliverText: settingsRaw.deliverText ?? "",
        resumeUrl: settingsRaw.resumeUrl ?? null,
        email: settingsRaw.email ?? "",
        linkedinUrl: settingsRaw.linkedinUrl ?? null,
        dribbbleUrl: settingsRaw.dribbbleUrl ?? null,
        behanceUrl: settingsRaw.behanceUrl ?? null,
      }
    : null;

  const skills: SkillsEntry | null = skillsRaw
    ? {
        categories: (skillsRaw.categories ?? []).map((cat) => ({
          category: (cat as { category?: string }).category ?? "",
          items: ((cat as { items?: readonly unknown[] }).items ?? []).map(
            (i) => String(i)
          ),
        })),
      }
    : null;

  const projects: ProjectListItem[] = (projectsRaw as Awaited<typeof projectsRaw>)
    .map(({ slug, entry }) => ({
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
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const experience: ExperienceListItem[] = (
    experienceRaw as Awaited<typeof experienceRaw>
  )
    .map(({ slug, entry }) => ({
      slug,
      company: resolveSlugField(entry.company, slug),
      title: (entry.title ?? "") as string,
      startDate: (entry.startDate ?? "") as string,
      endDate: (entry.endDate ?? "") as string,
      description: (entry.description ?? "") as string,
      orderIndex: (entry.orderIndex ?? 0) as number,
    }))
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
  };
}

export async function getProjectSlugs(): Promise<string[]> {
  return reader.collections.projects.list();
}
