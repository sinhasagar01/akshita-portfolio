// GH-3 — draft-branch read / preview for /studio (read side, no write).
//
// In github mode, reads content/site-settings.yaml from the draft branch via
// createGitHubReader (the typed reader) and computes whether it differs from
// live. Env-split: dev / fs mode never hits the GitHub API. The homepage read
// (getHomePageData) is untouched — only /studio (getStudioData) is draft-aware.
import { dump } from "js-yaml";
import { unstable_cache, revalidateTag } from "next/cache";
import { createGitHubReader } from "@keystatic/core/reader/github";
import config from "@/keystatic.config";
import {
  mapSiteSettings,
  mapProjectListItem,
  mapExperienceListItem,
  mapSkills,
  type SiteSettingsEntry,
  type ProjectListItem,
  type ExperienceListItem,
  type SkillsEntry,
} from "@/lib/keystatic";
import {
  stripEmptyOptional,
  reorderBySchema,
  SITE_SETTINGS_FIELD_ORDER,
  type SiteSettingsRecord,
} from "./site-settings-format";
import { branchExists, compareBranches, REPO } from "./github-commit";

export const DRAFT_BRANCH = "studio/draft-site-settings";
// The repo's default branch (CLAUDE.md). Used as the compare base for the
// branch-level differs check — a constant keeps it to a single compare call.
// Exported (P4 4(a)) so the case-study draft read compares against the same base.
export const MAIN_BRANCH = "main";

export type SettingsDraftState = {
  live: SiteSettingsEntry | null;
  draft: SiteSettingsEntry | null;
  differs: boolean;
};

function githubMode(): boolean {
  return process.env.STUDIO_WRITE_MODE === "github";
}

// SiteSettingsEntry -> raw record, DERIVED from SITE_SETTINGS_FIELD_ORDER
// (review finding 8) so a field added to the schema and the order constant can
// never be silently missing here, which would make differs read false for
// drafts changing only that field. null coalesces to "" so stripEmptyOptional
// removes it (matching the omit-empty rule); arrays pass through untouched.
function entryToRecord(entry: SiteSettingsEntry): SiteSettingsRecord {
  const record: SiteSettingsRecord = {};
  for (const key of SITE_SETTINGS_FIELD_ORDER) {
    record[key] = entry[key as keyof SiteSettingsEntry] ?? "";
  }
  return record;
}

// Canonical YAML for a formatting-insensitive compare. Uses the proven
// canonicalizing helpers (strip + reorder), NOT the full transform, so a draft
// that holds an invalid URL (validation is at publish, GH-4) does not throw here.
function canonical(entry: SiteSettingsEntry | null): string {
  if (!entry) return "";
  return dump(reorderBySchema(stripEmptyOptional(entryToRecord(entry))));
}

// Exported (P4 4(a)) so the scoped case-study draft read shares this EXACT tag
// and TTL. Sharing the tag is what lets the existing invalidateDraftStateCache()
// drop that cache too, with no second invalidation seam to keep in sync.
export const DRAFT_STATE_TAG = "studio-draft-state";
export const DRAFT_STATE_TTL_SECONDS = 45;

// GH-8 — the GitHub read of the draft branch, cached cross-request (github mode
// only, ~45s TTL) so rapid /studio loads share one API call and prod stays
// rate-limit-safe. Invalidated by invalidateDraftStateCache() on the two writes
// that change draft state. It THROWS on a GitHub error so a transient outage is
// NOT cached — the caller degrades to null and retries next request. differs is
// computed fresh against live OUTSIDE the cache, so live stays accurate.
const readDraftSettingsCached = unstable_cache(
  async (): Promise<SiteSettingsEntry | null> => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[studio] draft-state cache miss — reading draft branch from GitHub");
    }
    const token = process.env.STUDIO_GITHUB_TOKEN as string;
    if (!(await branchExists(DRAFT_BRANCH))) return null;
    const reader = createGitHubReader(config, {
      repo: REPO as `${string}/${string}`,
      ref: DRAFT_BRANCH,
      token,
    });
    const raw = await reader.singletons.siteSettings.read();
    return raw ? mapSiteSettings(raw as Record<string, unknown>) : null;
  },
  ["studio-draft-settings-read"],
  { revalidate: DRAFT_STATE_TTL_SECONDS, tags: [DRAFT_STATE_TAG] }
);

/**
 * Read the draft branch's Site Settings (cached) and compare it to live. Returns
 * { live, draft, differs }. github mode only; otherwise (and on any GitHub
 * error) fails safe to no-draft so /studio never breaks.
 */
export async function getSiteSettingsDraftState(
  live: SiteSettingsEntry | null
): Promise<SettingsDraftState> {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  if (!githubMode() || !token) {
    return { live, draft: null, differs: false };
  }
  try {
    const draft = await readDraftSettingsCached();
    // No draft (branch absent or unreadable) means nothing to publish. Without
    // the null guard canonical(null) is "" and never equals canonical(live), so
    // every no-draft state would read as differs (review finding 1).
    return { live, draft, differs: draft !== null && canonical(live) !== canonical(draft) };
  } catch {
    // Fail safe — a GitHub outage must not break /studio. Not cached (the cached
    // read throws on error), so recovery is immediate on the next request.
    return { live, draft: null, differs: false };
  }
}

// CE-3a/CE-3b — one cached read of the draft branch's state vs main: the
// branch-level differs (CE-3a: is it ahead of main in ANY file?) AND the
// draft-preferred collection entries (CE-3b). Scoped by the compare's `files`:
// only entries that actually changed on the draft branch are read, so a
// settings-only edit does zero collection reads. Cached under the SAME
// DRAFT_STATE_TAG as the settings draft read, so the existing
// invalidateDraftStateCache() — fired after every save-draft (settings AND
// collection) and on publish — invalidates it with no new wiring.
export type DraftBranchState = {
  differs: boolean;
  /**
   * The draft read FAILED and this state is a fail-safe stand-in, not the truth.
   *
   * Studio degrades to live content on a GitHub error, which keeps it usable, but
   * silently — the owner saw their published content with the bar dark and no
   * indication that their unpublished draft simply could not be loaded. Surfaced
   * so the UI can say so. Never true on the success path.
   */
  readError: boolean;
  // Added + modified draft entries, read from the draft branch and keyed by slug.
  projects: Record<string, ProjectListItem>;
  experience: Record<string, ExperienceListItem>;
  // F-2 — slugs the draft DELETED (status "removed"). No read needed; the status
  // is the whole signal. getStudioData subtracts these from the live list.
  removedProjects: string[];
  removedExperience: string[];
  // SK-4 — the draft version of the skills singleton, or null when skills.yaml
  // did not change on the draft branch (scoped like the collection overlay).
  skills: SkillsEntry | null;
};

const EMPTY_DRAFT_STATE: DraftBranchState = {
  differs: false,
  readError: false,
  projects: {},
  experience: {},
  removedProjects: [],
  removedExperience: [],
  skills: null,
};

// content/<collection>/<slug>.yaml — the top-level entry file (not the body subdir).
const COLLECTION_FILE_RE = /^content\/(projects|experience)\/([a-z0-9-]+)\.yaml$/;
// The skills singleton is one flat file (not content/<coll>/<slug>.yaml).
const SKILLS_FILE = "content/skills.yaml";

const readDraftBranchStateCached = unstable_cache(
  async (): Promise<DraftBranchState> => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[studio] draft-branch-state cache miss — comparing branches + reading changed entries");
    }
    const cmp = await compareBranches(MAIN_BRANCH, DRAFT_BRANCH);
    if (cmp === null) return EMPTY_DRAFT_STATE; // no draft branch

    // CONTENT, not commit count. This used to be `aheadBy > 0`, which asks "did
    // the owner save?" rather than "would publishing change anything?" — so
    // editing a field and then putting it back across two saves left the bar lit
    // and offered a publish with no net change.
    //
    // `files` is the NET diff from the merge base to the draft head, so a field
    // that was changed and reverted has no entry in it at all. An empty list
    // therefore means the draft and main hold the same content, however many
    // commits it took to get there. Truncation cannot fool this: a capped list is
    // non-empty by definition, so it can only ever say "there are changes".
    const differs = cmp.files.length > 0;

    // F-2 — classify each changed collection file by its per-file status. A
    // "removed" file is a DELETE: record the slug (no read — the file is gone on
    // the draft, and the status is the whole signal). Everything else (added or
    // modified) is READ from the draft branch below and overlaid.
    const projectSlugs: string[] = [];
    const experienceSlugs: string[] = [];
    const removedProjects: string[] = [];
    const removedExperience: string[] = [];
    for (const file of cmp.files) {
      const m = file.filename.match(COLLECTION_FILE_RE);
      if (!m) continue;
      const isProjects = m[1] === "projects";
      if (file.status === "removed") {
        (isProjects ? removedProjects : removedExperience).push(m[2]);
      } else {
        (isProjects ? projectSlugs : experienceSlugs).push(m[2]);
      }
    }
    // Skills is a SINGLETON, so unlike collection entries it gets no removed-slug
    // tracking: `some` matches added/modified/removed alike. A removed skills.yaml
    // is not a studio operation (SK-4 edits it, never deletes) — and if it somehow
    // happened, the read below returns null and getStudioData's `draft.skills ??
    // home.skills` falls back to live, which is the correct graceful outcome.
    const skillsChanged = cmp.files.some((f) => f.filename === SKILLS_FILE);
    // Read nothing when there is nothing to READ (only removals, settings-only, or
    // nothing) — a skills-only edit must still fall through, so the guard includes
    // !skillsChanged. Removed slugs need no read, so they are returned here too.
    if (projectSlugs.length === 0 && experienceSlugs.length === 0 && !skillsChanged) {
      return { differs, readError: false, projects: {}, experience: {}, removedProjects, removedExperience, skills: null };
    }

    const token = process.env.STUDIO_GITHUB_TOKEN as string;
    const reader = createGitHubReader(config, {
      repo: REPO as `${string}/${string}`,
      ref: DRAFT_BRANCH,
      token,
    });
    const projects: Record<string, ProjectListItem> = {};
    const experience: Record<string, ExperienceListItem> = {};
    let skills: SkillsEntry | null = null;
    await Promise.all([
      ...projectSlugs.map(async (slug) => {
        const entry = await reader.collections.projects.read(slug);
        if (entry) projects[slug] = mapProjectListItem(slug, entry as Record<string, unknown>);
      }),
      ...experienceSlugs.map(async (slug) => {
        const entry = await reader.collections.experience.read(slug);
        if (entry) experience[slug] = mapExperienceListItem(slug, entry as Record<string, unknown>);
      }),
      ...(skillsChanged
        ? [
            (async () => {
              const raw = await reader.singletons.skills.read();
              skills = raw ? mapSkills(raw as Record<string, unknown>) : null;
            })(),
          ]
        : []),
    ]);
    return { differs, readError: false, projects, experience, removedProjects, removedExperience, skills };
  },
  ["studio-draft-branch-state"],
  { revalidate: DRAFT_STATE_TTL_SECONDS, tags: [DRAFT_STATE_TAG] }
);

/**
 * The draft branch's state vs main: branch-level differs + the draft versions of
 * any changed collection entries. github mode only; a GitHub error degrades to
 * the empty state (no differs, no overlay → panels/bar show live, never break) —
 * the same fail-safe posture as getSiteSettingsDraftState. The cached fn throws
 * on error so a transient outage is not cached.
 */
export async function getDraftBranchState(): Promise<DraftBranchState> {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  if (!githubMode() || !token) return EMPTY_DRAFT_STATE;
  try {
    return await readDraftBranchStateCached();
  } catch {
    // Still degrades to live so /studio never breaks — but says so now.
    return { ...EMPTY_DRAFT_STATE, readError: true };
  }
}

/** CE-3a compat: branch-level differs, now derived from the unified state read. */
export async function getDraftBranchDiffers(): Promise<boolean> {
  return (await getDraftBranchState()).differs;
}

/**
 * Invalidate the cached draft read. Called by the save-draft and publish routes
 * so the settings page never shows a stale differs badge after a write.
 */
export function invalidateDraftStateCache(): void {
  revalidateTag(DRAFT_STATE_TAG);
}

/**
 * Formatting-insensitive compare of two settings entries, the same canonical
 * compare the draft state uses. Exported so the save route can compute its
 * response differs from the bytes it just committed instead of re-reading
 * through the tag-invalidated cache in the same request (review finding 6).
 */
export function settingsDiffer(
  a: SiteSettingsEntry | null,
  b: SiteSettingsEntry | null
): boolean {
  return canonical(a) !== canonical(b);
}
