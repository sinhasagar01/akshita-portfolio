// P4 4(a) — the case-study draft read, for the /studio preview surface ONLY.
//
// THE READ-SPLIT INVARIANT (the whole point, do not blur it): the public
// case-study page and its og route read main via getCaseStudyData and STAY
// main-only, so a draft edit can never leak to the live site. This module is the
// draft-preferring twin, reachable only from the owner-gated /studio preview —
// exactly the getHomePageData(main) vs getStudioData(draft) split that CE-3b and
// SK-4 established.
//
// SCOPED, deliberately its own read rather than a field on DraftBranchState:
// that state is fetched on EVERY studio page load (sidebar counts + the Publish
// bar), and a project's `sections` is ~15KB. Putting it there would make every
// page pay for data only this one preview needs. So this read is per-slug, and
// it first asks compareBranches whether THIS slug's file changed at all — when
// it did not, it returns live without reading the draft branch.
//
// It shares DRAFT_STATE_TAG with the settings/branch-state reads, so the
// existing invalidateDraftStateCache() already drops it — no new seam.
//
// Fail-safe posture, copied from getSiteSettingsDraftState: the cached fn THROWS
// on a GitHub error (so a transient outage is never cached), and the exported
// wrapper catches and degrades to live. The preview shows live content rather
// than an error page.
import { unstable_cache } from "next/cache";
import { createGitHubReader } from "@keystatic/core/reader/github";
import config from "@/keystatic.config";
import { compareBranches, REPO } from "./github-commit";
import {
  DRAFT_BRANCH,
  MAIN_BRANCH,
  DRAFT_STATE_TAG,
  DRAFT_STATE_TTL_SECONDS,
} from "./draft-site-settings";

export type CaseStudyDraftState = {
  /** Which branch the sections below came from. "live" means either no draft
   *  exists, this slug is unchanged on it, or the read degraded. */
  source: "draft" | "live";
  /** The RAW sections value (unmapped, exactly like CaseStudyData.rawSections),
   *  or null when source is "live" — the caller then uses the live read. */
  rawSections: unknown;
};

const LIVE: CaseStudyDraftState = { source: "live", rawSections: null };

const projectFile = (slug: string) => `content/projects/${slug}.yaml`;

const readCaseStudyDraftCached = unstable_cache(
  async (slug: string): Promise<CaseStudyDraftState> => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[studio] case-study draft read — comparing branches for ${slug}`);
    }
    const cmp = await compareBranches(MAIN_BRANCH, DRAFT_BRANCH);
    if (cmp === null) return LIVE; // no draft branch

    // SCOPE GATE — only read the draft when THIS slug's entry actually changed
    // on it. A settings-only (or other-slug) draft never touches the reader, so
    // the preview costs one compare call and nothing more.
    const file = projectFile(slug);
    const changed = cmp.files.find((f) => f.filename === file);
    if (!changed || changed.status === "removed") return LIVE;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[studio] case-study draft read — reading ${file} from the draft branch`);
    }
    const reader = createGitHubReader(config, {
      repo: REPO as `${string}/${string}`,
      ref: DRAFT_BRANCH,
      token: process.env.STUDIO_GITHUB_TOKEN as string,
    });
    const entry = await reader.collections.projects.read(slug);
    if (!entry) return LIVE;
    return { source: "draft", rawSections: (entry as Record<string, unknown>).sections };
  },
  ["studio-case-study-draft"],
  { revalidate: DRAFT_STATE_TTL_SECONDS, tags: [DRAFT_STATE_TAG] }
);

/**
 * The draft version of one project's `sections`, or live. github mode only; any
 * GitHub error degrades to live rather than breaking the preview.
 */
export async function getCaseStudyDraftState(slug: string): Promise<CaseStudyDraftState> {
  if (process.env.STUDIO_WRITE_MODE !== "github" || !process.env.STUDIO_GITHUB_TOKEN) {
    return LIVE; // fs / dev — never hits the GitHub API
  }
  try {
    return await readCaseStudyDraftCached(slug);
  } catch {
    return LIVE;
  }
}
