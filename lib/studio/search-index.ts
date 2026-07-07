// Client-side studio search index. Built from data already loaded via
// getStudioData (no new fetch, no backend). Each item deep-links to its edit
// destination; settings/experience/projects carry a ?item=<id> that
// ListDetailLayout reads to pre-select the entry.
//
// Scope: settings sections + experience + projects. Skills is excluded (no
// /studio panel yet — a Skills hit would 404 via Keystatic in prod), and the
// code-managed Homepage cards are excluded too (Hero/About/Process/Work already
// deep-link to settings/projects; Contact has no navigation destination).
import type { ProjectListItem, ExperienceListItem } from "@/lib/keystatic";
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
}: {
  projects: ProjectListItem[];
  experience: ExperienceListItem[];
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
