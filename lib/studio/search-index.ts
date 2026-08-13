// Client-side studio search index. Built from data already loaded via
// getStudioData (no new fetch, no backend). Each item deep-links to its edit
// destination; settings/experience/projects carry a ?item=<id> that
// ListDetailLayout reads to pre-select the entry.
//
// ---- ⚠ SCOPE, AND THIS PARAGRAPH IS WHY BLOG AND GALLERY WERE MISSING FOR MONTHS ------------
//
// It read "Scope: settings sections + experience + projects + skills categories" — a description
// written on 2026-07-07, when those WERE every collection. Blog landed 2026-07-26 and gallery
// later, and neither was added. `git log -S "blog"` on this file returns NOTHING: the word had
// never appeared in it.
//
// ⚠ SO IT WAS AN OMISSION AND NOT A DECISION, AND ONLY THE HISTORY COULD TELL THEM APART. A comment
// describing a smaller scope reads as a boundary somebody chose — the `structural()` shape arriving
// in prose rather than in a helper. Search worked the whole time; it simply could not find half the
// content, and nothing said so.
//
// The scope is now DERIVED: `collections` is a `Record<CollectionName, …>`, so a fifth collection
// fails to compile at the call site rather than being silently unsearchable.
//
// Still excluded, and these ARE decisions: the code-managed Homepage cards (Hero/About/Process/Work
// already deep-link to settings/projects; Contact has no navigation destination).
import type { SkillsEntry } from "@/lib/keystatic";
import type { CollectionName } from "./commit-collection-entry";

/** One searchable row, shaped by its collection at the call site. The collections differ in what
 *  they are called and what is worth matching on; they do not differ in whether they belong. */
export type SearchSource = {
  label: string;
  sublabel: string;
  keywords: string;
  href: string;
};
import { STUDIO_SETTINGS_SECTIONS } from "./settings-sections";

export type SearchItem = {
  label: string;
  sublabel: string;
  keywords: string; // pre-lowercased match blob
  href: string;
};

/**
 * ⚠ THE COLLECTIONS ARE A `Record<CollectionName, …>` SO A FIFTH IS A COMPILE ERROR, because two of
 * the four were missing for months and nothing said so.
 *
 * The index was created 2026-07-07 with three collections; blog landed 2026-07-26 and gallery later,
 * and neither joined. `git log -S "blog"` on this file returns NOTHING — the word has never appeared
 * in it — so the header's old scope line was not a decision anybody took about blog. It was a
 * DESCRIPTION WRITTEN BEFORE BLOG EXISTED, and a comment describing a smaller scope reads as a
 * boundary somebody chose.
 *
 * ⚠ AND THE OMISSION WAS INVISIBLE FROM INSIDE THE FEATURE. Search worked; it simply could not find
 * half the content, and only an author looking for a post they knew existed would notice. Adding the
 * two arms fixes today; the mapped type is what stops the fifth collection repeating it.
 */
export function buildStudioSearchIndex({
  collections,
  skills,
}: {
  collections: Record<CollectionName, readonly SearchSource[]>;
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

  /* ⚠ ONE LOOP OVER A DERIVED SET, NOT FOUR HAND-WRITTEN ARMS. Each collection supplies its own
     label, sublabel and keyword blob at the call site, where the shapes differ — an experience row
     reads "Company" and carries a title and a location, a gallery item reads its title. What must
     NOT differ is MEMBERSHIP, and that is what the Record enforces. */
  for (const name of Object.keys(collections) as CollectionName[]) {
    for (const row of collections[name]) {
      items.push({
        label: row.label,
        sublabel: row.sublabel,
        keywords: row.keywords.toLowerCase(),
        href: row.href,
      });
    }
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
