// GH-3 — draft-branch read / preview for /studio (read side, no write).
//
// In github mode, reads content/site-settings.yaml from the draft branch via
// createGitHubReader (the typed reader) and computes whether it differs from
// live. Env-split: dev / fs mode never hits the GitHub API. The homepage read
// (getHomePageData) is untouched — only /studio (getStudioData) is draft-aware.
import { dump } from "js-yaml";
import { createGitHubReader } from "@keystatic/core/reader/github";
import config from "@/keystatic.config";
import type { SiteSettingsEntry } from "@/lib/keystatic";
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

// Mirrors getHomePageData's settings mapping (lib/keystatic.ts lines 75-89).
// Duplicated to keep lib/keystatic.ts untouched; DRY later via a shared mapper.
function mapDraftSettings(s: Record<string, unknown>): SiteSettingsEntry {
  return {
    heroCopy: (s.heroCopy as string) ?? "",
    positioningLine: (s.positioningLine as string) ?? "",
    photo: (s.photo as string | null) ?? null,
    aboutCopy: (s.aboutCopy as string) ?? "",
    aboutNote: (s.aboutNote as string) ?? "",
    aboutFocusChips: ((s.aboutFocusChips as readonly unknown[]) ?? []).map(String),
    discoverText: (s.discoverText as string) ?? "",
    defineText: (s.defineText as string) ?? "",
    developText: (s.developText as string) ?? "",
    deliverText: (s.deliverText as string) ?? "",
    resumeUrl: (s.resumeUrl as string | null) ?? null,
    email: (s.email as string) ?? "",
    linkedinUrl: (s.linkedinUrl as string | null) ?? null,
    dribbbleUrl: (s.dribbbleUrl as string | null) ?? null,
    behanceUrl: (s.behanceUrl as string | null) ?? null,
  };
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

/**
 * Read the draft branch's Site Settings and compare it to live. Returns
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
    if (!(await branchExists(DRAFT_BRANCH))) {
      return { live, draft: null, differs: false };
    }
    const reader = createGitHubReader(config, {
      repo: REPO as `${string}/${string}`,
      ref: DRAFT_BRANCH,
      token,
    });
    const raw = await reader.singletons.siteSettings.read();
    const draft = raw ? mapDraftSettings(raw as Record<string, unknown>) : null;
    const differs = canonical(live) !== canonical(draft);
    return { live, draft, differs };
  } catch {
    // Fail safe — a GitHub outage must not break /studio.
    return { live, draft: null, differs: false };
  }
}
