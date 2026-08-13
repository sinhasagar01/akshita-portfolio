import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import config from "@/keystatic.config";
import type { ProcessStage, LinkItem, HeroTab } from "@/lib/studio/site-settings-format";
import { adjacentByOrderIndex } from "@/lib/case-studies/adjacent-project";
import { resolveTheme, type ThemeName } from "@/lib/theme";
import {
  mapBlogListItem,
  selectPublishedPostsNewestFirst,
  readingTimeMinutes,
  type BlogListItem,
} from "@/lib/blog/select";

export type { ProcessStage, LinkItem };
export type { BlogListItem };

/** A list item with its computed reading time — what the index cards render. Reading
 *  time is attached HERE (not on mapBlogListItem) so the pure mapper and its suite stay
 *  untouched; the word count needs the blocks, which the reader entry carries. */
export type BlogCard = BlogListItem & { readingTime: number };

const reader = createReader(process.cwd(), config);

export type SiteSettingsEntry = {
  /** The resolved public palette. Never the raw file value — see mapSiteSettings. */
  theme: ThemeName;
  heroCopy: string;
  heroTabs: HeroTab[];
  heroRoleLabel: string;
  heroScrollCue: string;
  /** The hero's cut-out illustration. Null falls back to the shipped asset — see HeroSection. */
  heroFigure: string | null;
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
  categories: { category: string; items: { name: string; glow: string }[] }[];
};

export type ProjectListItem = {
  slug: string;
  title: string;
  summary: string;
  orderIndex: number;
  heroImage: string | null;
  facts: { role: string; type: string; platform: string; timeline: string };
  // CS-6a — the case-study template (CS-4 head field), for the Details template
  // toggle. "" when unset (the reader coalesces absent -> ""); "mobile" | "web".
  template: string;
  // Editorial taxonomy for the work-section filter (PR 1). "" when unset (reader
  // coalesces absent -> ""); "mobile" | "web". Distinct from `template` by design —
  // see keystatic.config.ts. Nothing reads it yet.
  category: string;
  /** Whether readers can zoom this study's images. ⚠ ABSENT IN CONTENT MEANS ON — see the
   *  coalesce in `mapProjectListItem`, which inverts this file's usual `?? ""` posture on
   *  purpose because a feature switch that defaults off ships disabled on every existing study. */
  imagePreview: boolean;
  /** How many sections the study has. Derived at map time from the same entry. */
  sectionCount: number;
};

export type ExperienceListItem = {
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  orderIndex: number;
};

export type HomePageData = {
  settings: SiteSettingsEntry | null;
  skills: SkillsEntry | null;
  projects: ProjectListItem[];
  experience: ExperienceListItem[];
};

// #216: FALLS BACK ON A BLANK VALUE, NOT ONLY AN ABSENT ONE — mirrors the copy in
// lib/blog/select.ts (KEEP THE TWO IN STEP). `title` (blog) is editable and blankable now, so
// an empty string must yield the slug exactly as a missing key does; blank company (experience)
// and blank title (projects) get the same robustness as a free side effect, and no existing
// entry is blank, so nothing rendered changes today. Defense-in-depth behind validate-blog-post.
function resolveSlugField(value: unknown, fallback: string): string {
  const resolved =
    typeof value === "string"
      ? value
      : value !== null && typeof value === "object" && "value" in value
        ? (value as { value: string }).value
        : null;
  return resolved !== null && resolved.trim() !== "" ? resolved : fallback;
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
    /* ⚠ THE ONE FIELD THAT IS RESOLVED RATHER THAN COALESCED. Every other line here falls back to
       an empty string, which renders as nothing and is fine. A theme cannot do that — an empty
       palette is a page with no colours — so it falls back to `cream`, the theme shipping today.
       Missing, empty, misspelt and wrong-typed all land there, silently, by design. */
    theme: resolveTheme(raw.theme),
    heroCopy: (raw.heroCopy as string) ?? "",
    /* ⚠ NORMALISED HERE RATHER THAN TRUSTED, the same posture the rest of this mapper takes. A
       tab missing `callouts` or `stats` is the ordinary state until the owner fills them, so the
       reader supplies the empty arrays instead of letting a consumer meet `undefined`. */
    heroTabs: (Array.isArray(raw.heroTabs) ? raw.heroTabs : []).map((t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      return {
        label: (o.label as string) ?? "",
        headline: (o.headline as string) ?? "",
        support: (o.support as string) ?? "",
        callouts: Array.isArray(o.callouts) ? (o.callouts as string[]) : [],
        stats: (Array.isArray(o.stats) ? o.stats : []).map((st) => {
          const so = (st ?? {}) as Record<string, unknown>;
          return { value: (so.value as string) ?? "", unit: (so.unit as string) ?? "" };
        }),
      };
    }),
    heroRoleLabel: (raw.heroRoleLabel as string) ?? "",
    heroScrollCue: (raw.heroScrollCue as string) ?? "",
    heroFigure: (raw.heroFigure as string | null) ?? null,
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
      /* ⚠ TOLERATES A BARE STRING, because a hand-edited `skills.yaml` predating the object
         shape would otherwise map to `{name: undefined}` and render blank pills with no error.
         The migration is in-repo and complete, so this branch is unreachable today — and
         "unreachable today" is a property of the content rather than of this function. */
      items: ((cat as { items?: readonly unknown[] }).items ?? []).map((i) =>
        typeof i === "string"
          ? { name: i, glow: "" }
          : { name: (i as { name?: string }).name ?? "", glow: (i as { glow?: string }).glow ?? "" }
      ),
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
    template: (entry.template ?? "") as string,
    category: (entry.category ?? "") as string,
    imagePreview: (entry.imagePreview ?? true) as boolean,
    // Free: the reader already handed us the whole entry, so the count costs no
    // extra read. The case-study index shows it so you can tell a written-up study
    // from a stub without opening it.
    sectionCount: Array.isArray(entry.sections) ? entry.sections.length : 0,
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
  /** CS-6a — the case-study template (CS-4 head field), for the adapter's frame
   *  default. "" when unset. Consumed by the studio preview; the public render
   *  path stays unwired here until CS-6b. */
  template: string;
  /** Whether this study's images open a zoomable preview. Absent in content means ON — see the
   *  coalesce in the reader below for why this one field inverts the file's usual posture. */
  imagePreview: boolean;
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
    template: ((entry as Record<string, unknown>).template ?? "") as string,
    /* ⚠ ABSENT MEANS ON, WHICH IS THE OPPOSITE OF THIS FILE'S USUAL COALESCE AND IS DELIBERATE.
       Every other optional field here falls back to "" or null because a missing value is a
       missing value. This one is a FEATURE SWITCH on four studies whose content files predate it,
       so `?? false` would ship the preview silently disabled everywhere it was asked for. The
       fail-closed posture belongs to permissions; this is not one. */
    imagePreview: ((entry as Record<string, unknown>).imagePreview ?? true) as boolean,
  };
}

export async function getProjectSlugs(): Promise<string[]> {
  return reader.collections.projects.list();
}

/**
 * The next case study after `slug`, for the next-case rail (NCR-1). Ordered by
 * `orderIndex` ascending with wrap-around, via the pure `adjacentByOrderIndex`.
 *
 * Reads through the PUBLIC path (`getHomePageData`, already sorted by orderIndex),
 * never `getStudioData` — the rail is live-content chrome, so a draft reorder must
 * not change the published page. Null when the slug is unknown or there are fewer
 * than two projects, so the caller renders no rail.
 */
export async function getAdjacentProject(
  slug: string,
): Promise<ProjectListItem | null> {
  const { projects } = await getHomePageData();
  return adjacentByOrderIndex(projects, slug);
}

// ---------------------------------------------------------------- blog (PR 1)
//
// Read path only. Nothing renders these yet (no /blog route), so they exist to be
// read by the future homepage + article pages and by the studio. The collection is
// empty at this PR, so getBlogPosts()/getBlogSlugs() return [] and getBlogPost()
// returns null for any slug — proven by G3 (the empty-glob read) and G4 (the pure
// filter over a stub).

export type BlogPostData = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  topic: string;
  status: string;
  heroImage: string | null;
  /** Reading time in whole minutes, computed from the blocks (never authored). */
  readingTime: number;
  /** The RAW `blocks` value, passed through unmapped — the blog renderer reads it
   *  directly (parseRich/renderRich on the strings), and readingTimeMinutes counts it. */
  blocks: unknown;
};

/**
 * The PUBLIC blog list: published posts only, newest first, each with its computed
 * reading time. The status filter lives in the pure lib/blog/select.ts seam
 * (selectPublishedPostsNewestFirst), so the one line that decides public visibility is
 * unit-tested rather than inlined here. This is the status-gated read A3 found existed
 * nowhere in the codebase before the blog arc.
 *
 * readingTime is attached in the map (not in mapBlogListItem) because the word count
 * needs the entry's blocks, which the list item does not carry — keeping the pure mapper
 * and its suite untouched. The selector is generic, so the richer BlogCard rides through.
 */
export async function getBlogPosts(): Promise<BlogCard[]> {
  const raw = await reader.collections.blog.all();
  // BS-3b — FILTER BEFORE MAPPING. This used to map every entry (computing readingTime
  // from its blocks) and filter afterwards, so a DRAFT's blocks were read at build time.
  // Nothing broke, because readingTimeMinutes is defensive — but that made "an
  // unpublished post is inert at build" a property of one function staying careful
  // rather than a property of the structure. Filtering first means a draft's blocks are
  // never touched at all, which is what lets the publish gate skip drafts (see
  // validate-blog-post.ts) instead of validating them forever.
  //
  // The pure selector below still filters, deliberately: it is the tested definition of
  // "published" (blog-status-filter.mjs) and keeping it here means the gate survives
  // even if this pre-filter is ever refactored away. Filtering twice is free.
  const published = (raw as Awaited<typeof raw>).filter(
    ({ entry }) => (entry as Record<string, unknown>).status === "published"
  );
  const items: BlogCard[] = published.map(({ slug, entry }) => {
    const e = entry as Record<string, unknown>;
    return { ...mapBlogListItem(slug, e), readingTime: readingTimeMinutes(e.blocks) };
  });
  return selectPublishedPostsNewestFirst(items);
}

/**
 * Read ONE post by slug, UNFILTERED by status — the raw entry, or null. Deliberately
 * not status-gated: the studio preview and the (future) article page both need to read
 * a draft, and the article route applies the public gate itself. Leaving that gate to
 * the caller keeps the draft reachable in the editor; the article PR must apply it so a
 * draft URL does not leak (tracked in that PR's scope, not here).
 */
export async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  const entry = await reader.collections.blog.read(slug);
  if (!entry) return null;
  const e = entry as Record<string, unknown>;
  return {
    slug,
    title: resolveSlugField(e.title, slug),
    dek: (e.dek ?? "") as string,
    date: (e.date ?? "") as string,
    topic: (e.topic ?? "") as string,
    status: (e.status ?? "") as string,
    heroImage: (e.heroImage ?? null) as string | null,
    readingTime: readingTimeMinutes(e.blocks),
    blocks: e.blocks,
  };
}

/** Every blog slug — for generateStaticParams. Returns [] while the collection is empty. */
export async function getBlogSlugs(): Promise<string[]> {
  return reader.collections.blog.list();
}

/**
 * BS-3c — EVERY post, published and draft, newest first. The STUDIO list read.
 *
 * Deliberately NOT getBlogPosts(): that one filters to `status === "published"`, which is
 * right for the public site and wrong here — the studio index must show drafts, since
 * being able to see and flip an unpublished post is the entire point of the status field.
 * Two reads with opposite postures rather than one with a flag, so a public caller can
 * never accidentally opt into seeing drafts.
 *
 * Sorted by the SAME rule the public list uses (newest first, slug as a stable tiebreak),
 * so the studio order and the live order cannot disagree.
 */
export async function getStudioBlogPosts(): Promise<BlogCard[]> {
  const raw = await reader.collections.blog.all();
  return (raw as Awaited<typeof raw>)
    .map(({ slug, entry }) => {
      const e = entry as Record<string, unknown>;
      return { ...mapBlogListItem(slug, e), readingTime: readingTimeMinutes(e.blocks) };
    })
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}
