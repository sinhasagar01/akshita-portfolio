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
import { mapSiteSettings, type SiteSettingsEntry } from "@/lib/keystatic";
import {
  stripEmptyOptional,
  reorderBySchema,
  type SiteSettingsRecord,
} from "./site-settings-format";
import { branchExists, REPO } from "./github-commit";

export const DRAFT_BRANCH = "studio/draft-site-settings";

export type SettingsDraftState = {
  live: SiteSettingsEntry | null;
  draft: SiteSettingsEntry | null;
  differs: boolean;
};

function githubMode(): boolean {
  return process.env.STUDIO_WRITE_MODE === "github";
}

// SiteSettingsEntry -> raw record; null coalesced to "" so stripEmptyOptional
// removes it (matching the omit-empty rule). Arrays pass through.
function entryToRecord(entry: SiteSettingsEntry): SiteSettingsRecord {
  return {
    heroCopy: entry.heroCopy,
    positioningLine: entry.positioningLine,
    photo: entry.photo ?? "",
    aboutCopy: entry.aboutCopy,
    aboutNote: entry.aboutNote,
    aboutFocusChips: entry.aboutFocusChips,
    discoverText: entry.discoverText,
    defineText: entry.defineText,
    developText: entry.developText,
    deliverText: entry.deliverText,
    resumeUrl: entry.resumeUrl ?? "",
    email: entry.email,
    linkedinUrl: entry.linkedinUrl ?? "",
    dribbbleUrl: entry.dribbbleUrl ?? "",
    behanceUrl: entry.behanceUrl ?? "",
  };
}

// Canonical YAML for a formatting-insensitive compare. Uses the proven
// canonicalizing helpers (strip + reorder), NOT the full transform, so a draft
// that holds an invalid URL (validation is at publish, GH-4) does not throw here.
function canonical(entry: SiteSettingsEntry | null): string {
  if (!entry) return "";
  return dump(reorderBySchema(stripEmptyOptional(entryToRecord(entry))));
}

const DRAFT_STATE_TAG = "studio-draft-state";
const DRAFT_STATE_TTL_SECONDS = 45;

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

/**
 * Invalidate the cached draft read. Called by the save-draft and publish routes
 * so the settings page never shows a stale differs badge after a write.
 */
export function invalidateDraftStateCache(): void {
  revalidateTag(DRAFT_STATE_TAG);
}
