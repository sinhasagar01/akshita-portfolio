import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import config from "@/keystatic.config";
import type { ProcessStage, LinkItem } from "@/lib/studio/site-settings-format";

export type { ProcessStage, LinkItem };

const reader = createReader(process.cwd(), config);

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

export type CaseStudyData = {
  slug: string;
  title: string;
  summary: string;
  heroImage: string | null;
  facts: { role: string; type: string; platform: string; timeline: string };
  /** The RAW `sections` value (the P4 3(b) schema), passed through unmapped.
   *  The [slug] page maps it via the 3(c) adapter into CaseStudyView — the one
   *  renderer every case study shares (P4 3(d) step 5 deleted the legacy
   *  `blocks` path). An absent/empty value adapts to [] and renders the
   *  "Coming soon" placeholder (a fresh studio-created stub). */
  rawSections: unknown;
};

export async function getCaseStudyData(slug: string): Promise<CaseStudyData | null> {
  const entry = await reader.collections.projects.read(slug);
  if (!entry) return null;

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
    rawSections: (entry as Record<string, unknown>).sections,
  };
}

export async function getProjectSlugs(): Promise<string[]> {
  return reader.collections.projects.list();
}
