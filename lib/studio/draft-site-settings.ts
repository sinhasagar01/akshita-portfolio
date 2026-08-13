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
  mapGalleryItem,
  type SiteSettingsEntry,
  type ProjectListItem,
  type ExperienceListItem,
  type SkillsEntry,
  type BlogCard,
  type GalleryItem,
} from "@/lib/keystatic";
import { mapBlogListItem, readingTimeMinutes } from "@/lib/blog/select";
/* Type-only: the failure record names its collection, and the union that defines the set of
   collections lives with the commit layer. Erased at compile, so no runtime dependency. */
import type { CollectionName } from "./commit-collection-entry";
import {
  stripEmptyOptional,
  reorderBySchema,
  SITE_SETTINGS_FIELD_ORDER,
  type SiteSettingsRecord,
} from "./site-settings-format";
import { branchExists, compareBranches, REPO } from "./github-commit";

export const DRAFT_BRANCH = "studio/draft-site-settings";
// Re-exported under its historical name so the draft reads and the write path
// share ONE definition of the published branch (see BASE_BRANCH).
export { BASE_BRANCH as MAIN_BRANCH } from "./github-commit";
import { BASE_BRANCH } from "./github-commit";

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
/** One entry the draft branch held and this reader could not parse.
 *
 *  ⚠ `collection` IS THE NAME, NOT A BOOLEAN, because the author's next action is to open that
 *  collection and look at that file. A flag can only say something is wrong somewhere. */
export type DraftReadFailure = {
  collection: CollectionName | "skills";
  slug: string;
  message: string;
};

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
  /* ⚠ WHICH ENTRIES COULD NOT BE PARSED, AND WHY. Distinct from `readError`, which means the whole
   * read failed and NOTHING is known. This means the branch was read fine and specific files did
   * not parse — every other entry is live and correct, so a UI must not say "showing published
   * content" on the strength of it. That distinction is the entire point of the split; see the
   * read loop for the incident that forced it. */
  readFailures: DraftReadFailure[];
  /**
   * ⚠ THE DRAFT BRANCH WAS DELETED WHILE THIS READ WAS IN FLIGHT — a fact about the DRAFT, not about
   * the entries. Distinct from `readError` (the read itself failed and nothing is known) and from
   * `readFailures` (the branch read fine and specific files did not parse).
   *
   * Without it, a discard in another tab surfaces as N per-entry `Failed to fetch tree: 404`
   * messages — every one true about a tree read and every one false about the author's work. The
   * three states must never render alike, which is the same requirement the publish disclosure's
   * fourth state carries.
   */
  draftGone: boolean;
  // Added + modified draft entries, read from the draft branch and keyed by slug.
  projects: Record<string, ProjectListItem>;
  experience: Record<string, ExperienceListItem>;
  // BS-3c — blog entries changed on the draft branch. Without this the studio index
  // reads main only, so a newly-created post would commit to the draft branch and then
  // VANISH from the list on reload until publish — a create flow that looks broken.
  blog: Record<string, BlogCard>;
  /** Gallery items changed on the draft branch. Same contract as `blog` above — without it a
   *  just-uploaded item would be invisible in /studio until publish. */
  gallery: Record<string, GalleryItem>;
  // F-2 — slugs the draft DELETED (status "removed"). No read needed; the status
  // is the whole signal. getStudioData subtracts these from the live list.
  removedProjects: string[];
  removedExperience: string[];
  removedBlog: string[];
  removedGallery: string[];
  // SK-4 — the draft version of the skills singleton, or null when skills.yaml
  // did not change on the draft branch (scoped like the collection overlay).
  skills: SkillsEntry | null;
};

const EMPTY_DRAFT_STATE: DraftBranchState = {
  differs: false,
  readError: false,
  draftGone: false,
  readFailures: [],
  projects: {},
  experience: {},
  blog: {},
  gallery: {},
  removedProjects: [],
  removedExperience: [],
  removedBlog: [],
  removedGallery: [],
  skills: null,
};

// content/<collection>/<slug>.yaml and the skills singleton. BOTH NOW COME FROM ONE HOME rather
// than being declared here: the publish preview classifies the same filenames off the same compare
// response, and two patterns over one filename shape drift the moment a fourth collection lands —
// which is a live possibility, and exactly why the dispatch below is a named record rather than a
// ternary. `publish-preview.ts` is the leaf that holds them, importing nothing itself.
import { COLLECTION_FILE_RE, SKILLS_FILE } from "./publish-preview";

const readDraftBranchStateCached = unstable_cache(
  async (): Promise<DraftBranchState> => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[studio] draft-branch-state cache miss — comparing branches + reading changed entries");
    }
    const cmp = await compareBranches(BASE_BRANCH, DRAFT_BRANCH);
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
    const blogSlugs: string[] = [];
    const removedProjects: string[] = [];
    const removedExperience: string[] = [];
    const gallerySlugs: string[] = [];
    const removedBlog: string[] = [];
    const removedGallery: string[] = [];
    // BS-3c — an explicit three-way branch, not a projects-or-else ternary. Widening the
    // regex to a third collection is exactly what made the two-way ternaries in the
    // commit layer route blog wrong in 3b; every arm is named so a fourth collection is
    // a visible hole rather than a silent misfile.
    const CHANGED: Record<string, { added: string[]; removed: string[] }> = {
      projects: { added: projectSlugs, removed: removedProjects },
      experience: { added: experienceSlugs, removed: removedExperience },
      blog: { added: blogSlugs, removed: removedBlog },
      gallery: { added: gallerySlugs, removed: removedGallery },
    };
    for (const file of cmp.files) {
      const m = file.filename.match(COLLECTION_FILE_RE);
      if (!m) continue;
      const bucket = CHANGED[m[1]];
      if (!bucket) continue;
      (file.status === "removed" ? bucket.removed : bucket.added).push(m[2]);
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
    if (
      projectSlugs.length === 0 &&
      experienceSlugs.length === 0 &&
      blogSlugs.length === 0 &&
      gallerySlugs.length === 0 &&
      !skillsChanged
    ) {
      return { differs, readError: false, draftGone: false, readFailures: [], projects: {}, experience: {}, blog: {}, gallery: {}, removedProjects, removedExperience, removedBlog, removedGallery, skills: null };
    }

    const token = process.env.STUDIO_GITHUB_TOKEN as string;
    const reader = createGitHubReader(config, {
      repo: REPO as `${string}/${string}`,
      ref: DRAFT_BRANCH,
      token,
    });
    const projects: Record<string, ProjectListItem> = {};
    const experience: Record<string, ExperienceListItem> = {};
    const blog: Record<string, BlogCard> = {};
    const gallery: Record<string, GalleryItem> = {};
    let skills: SkillsEntry | null = null;

    /* ⚠ EVERY READ IS ISOLATED, AND ONE THROW NO LONGER COSTS THE OTHER THREE COLLECTIONS.
     *
     * THE INCIDENT. A create wrote a project-shaped file into `content/gallery/`, and the reader
     * does not return null on a schema mismatch — it THROWS ("Key on object value \"summary\" is
     * not allowed"). These reads sat in a bare `Promise.all`, which rejects on the first rejection,
     * so the whole cached function threw, the outer catch returned `EMPTY_DRAFT_STATE`, and the
     * studio silently fell back to LIVE for projects, experience, blog and settings as well.
     *
     * ⚠ THAT IS WORSE THAN THE 404 IT CAUSED, WHICH IS WHY IT IS ITS OWN UNIT. A 404 stops an
     * author. A silent fallback to published content does not — they go on editing, against main,
     * believing it is their draft. One malformed file in one collection, and the other three are
     * degraded with nothing on screen naming them.
     *
     * ⚠ AND THE SPLIT IS DERIVED RATHER THAN CHOSEN: A FAILURE TO READ ONE ENTRY IS NOT A FAILURE
     * TO READ THE BRANCH. `differs` comes from the COMPARE, not from these reads, so it stays
     * correct whatever happens here. The other entries are unrelated files that parsed fine, and
     * throwing them away discards work that was never in question. So a per-entry failure omits
     * THAT ENTRY and records it; only a compare, auth or network failure — where nothing is known —
     * still degrades globally through the outer catch.
     *
     * A RECORD RATHER THAN A COUNT, because "one entry failed" cannot tell an author which file to
     * fix, and this failure's whole character is that it is invisible. */
    const readFailures: DraftReadFailure[] = [];
    /* The denominator for the all-failed test below. Counted rather than inferred from the arrays,
       because a read that succeeds and finds nothing leaves no entry either. */
    let totalReads = 0;
    const guarded = <T>(collection: DraftReadFailure["collection"], slug: string, run: () => Promise<T>) =>
      (totalReads++, run()).catch((e: unknown) => {
        readFailures.push({
          collection,
          slug,
          message: e instanceof Error ? e.message : String(e),
        });
        return undefined;
      });

    await Promise.all([
      ...projectSlugs.map((slug) => guarded("projects", slug, async () => {
        const entry = await reader.collections.projects.read(slug);
        if (entry) projects[slug] = mapProjectListItem(slug, entry as Record<string, unknown>);
      })),
      ...experienceSlugs.map((slug) => guarded("experience", slug, async () => {
        const entry = await reader.collections.experience.read(slug);
        if (entry) experience[slug] = mapExperienceListItem(slug, entry as Record<string, unknown>);
      })),
      ...blogSlugs.map((slug) => guarded("blog", slug, async () => {
        const entry = await reader.collections.blog.read(slug);
        if (!entry) return;
        const e = entry as Record<string, unknown>;
        // The same shape (and the same readingTime derivation) the studio list read
        // produces, so an overlaid draft row is indistinguishable from a live one.
        blog[slug] = { ...mapBlogListItem(slug, e), readingTime: readingTimeMinutes(e.blocks) };
      })),
      ...gallerySlugs.map((slug) => guarded("gallery", slug, async () => {
        const entry = await reader.collections.gallery.read(slug);
        if (entry) gallery[slug] = mapGalleryItem(slug, entry as Record<string, unknown>);
      })),
      ...(skillsChanged
        ? [
            guarded("skills", "skills", async () => {
              const raw = await reader.singletons.skills.read();
              skills = raw ? mapSkills(raw as Record<string, unknown>) : null;
            }),
          ]
        : []),
    ]);
    /* ⚠ A BRANCH THAT VANISHED BETWEEN THE COMPARE AND THE READS IS ONE FACT, NOT N FAILURES.
     *
     * `compareBranches` above returns null for an absent branch and this function returns
     * `EMPTY_DRAFT_STATE` — so the branch-gone case IS handled, at the top. What is not handled is
     * the branch disappearing AFTER that check: every per-entry read then fails with Keystatic's
     * `Failed to fetch tree: 404`, and an author is told their entries are unreadable when what
     * actually happened is that somebody discarded the draft, possibly in another tab.
     *
     * An owner saw exactly that: "Couldn't read gallery/sony · Failed to fetch tree: 404 …
     * Everything else is your draft." The second sentence is the per-entry degrade working
     * correctly; the first is a true statement about a tree read and a false one about their work.
     *
     * ⚠ SO IT RE-ASKS BEFORE REPORTING, and only when every read failed — which is what a vanished
     * branch produces and what a single malformed file cannot. One extra request in the one case
     * that is already an error, and none on the happy path.
     *
     * ⚠ AND IF THE RE-ASK ITSELF FAILS, THE PER-ENTRY FAILURES STAND. A read that cannot run is not
     * permission to claim a different cause — the same guard-on-the-guard as `mergeBranch`'s
     * confirmation, and for the same reason. */
    if (readFailures.length > 0 && readFailures.length === totalReads) {
      const stillThere = await branchExists(DRAFT_BRANCH).catch(() => true);
      if (!stillThere) return { ...EMPTY_DRAFT_STATE, draftGone: true };
    }

    return { differs, readError: false, draftGone: false, readFailures, projects, experience, blog, gallery, removedProjects, removedExperience, removedBlog, removedGallery, skills };
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
