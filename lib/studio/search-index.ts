// Client-side studio search index. Built from data already loaded via
// getStudioData (no new fetch, no backend). Each item deep-links to its edit
// destination; settings/experience/projects carry a ?item=<id> that
// ListDetailLayout reads to pre-select the entry.
//
// Scope: settings sections + experience + projects + skills categories (SK-5 —
// skills got a real /studio panel in SK-4). The code-managed Homepage cards are
// excluded (Hero/About/Process/Work already deep-link to settings/projects;
// Contact has no navigation destination).
import type { ProjectListItem, ExperienceListItem, SkillsEntry } from "@/lib/keystatic";
import { STUDIO_SETTINGS_SECTIONS } from "./settings-sections";

export type SearchItem = {
  label: string;
  sublabel: string;
  keywords: string; // pre-lowercased match blob
  href: string;
};

export function buildStudioSearchIndex({
  projects,
  experience,
  skills,
}: {
  projects: ProjectListItem[];
  experience: ExperienceListItem[];
  skills: SkillsEntry | null;
}): SearchItem[] {
  const items: SearchItem[] = [];

  for (const s of STUDIO_SETTINGS_SECTIONS) {
    items.push({
      label: s.name,
      sublabel: "Site settings",
      keywords: `${s.name} ${s.keywords ?? ""}`.toLowerCase(),
      href: `/studio/settings?item=${s.id}`,
    });
  }

  for (const e of experience) {
    items.push({
      label: e.company,
      sublabel: "Experience",
      keywords: `${e.company} ${e.title} ${e.location}`.toLowerCase(),
      href: `/studio/experience?item=${encodeURIComponent(e.slug)}`,
    });
  }

  for (const p of projects) {
    items.push({
      label: p.title,
      sublabel: "Projects",
      keywords: `${p.title} ${p.summary}`.toLowerCase(),
      href: `/studio/projects?item=${encodeURIComponent(p.slug)}`,
    });
  }

  // Skills: one result per category, matchable by the category name OR any skill
  // in it. Categories have no server-stable id (SkillsEditor's ids are runtime
  // client-only), so these link to the panel without a ?item= pre-select.
  for (const c of skills?.categories ?? []) {
    items.push({
      label: c.category.trim() || "Untitled category",
      sublabel: "Skills",
      keywords: `${c.category} ${c.items.join(" ")}`.toLowerCase(),
      href: "/studio/skills",
    });
  }

  return items;
}

/**
 * Case-insensitive AND-substring filter: the query is split on whitespace and an
 * item matches only if EVERY term is a substring of its keyword blob. Empty query
 * returns nothing (no dropdown). Results keep index order (settings, then
 * experience, then projects) and are capped.
 */
export function filterStudioSearch(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return items.filter((it) => terms.every((t) => it.keywords.includes(t))).slice(0, limit);
}
