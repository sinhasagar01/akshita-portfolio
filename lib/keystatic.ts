import { createReader } from "@keystatic/core/reader";
import config from "@/keystatic.config";

const reader = createReader(process.cwd(), config);

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
