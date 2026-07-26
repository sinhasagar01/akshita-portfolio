// BS-3c — the draft-preferring per-entry read, for the /studio editing surfaces ONLY.
// Parameterized out of case-study-draft.ts (which is now a thin wrapper over it).
//
// THE READ-SPLIT INVARIANT (unchanged, do not blur it): the public pages read main via
// getCaseStudyData / getBlogPost and STAY main-only, so a draft edit can never leak to
// the live site. This is the draft-preferring twin, reachable only from the owner-gated
// studio.
//
// WHY PARAMETERIZED RATHER THAN A SIBLING. 3b's serializer stayed a sibling because it
// had to remain ralph-unit-testable, and a runtime lib->lib import would have broken
// that. THAT CONSTRAINT IS ABSENT HERE: this module imports next/cache and hits the
// GitHub API, so it is untestable in ralph either way. What is left is a lot of shared
// MECHANISM that is dangerous to duplicate — the scope gate, the cache tag wiring, and
// the fail-safe degrade-to-live. A sibling that forgot the outer try/catch would turn a
// transient GitHub blip into a broken editor, and nothing would catch it.
//
// THE CACHE-KEY COLLISION THIS FIXES. The key used to be the bare string
// ["studio-case-study-draft"] with `slug` as the only argument. Blog and project slugs
// are independent namespaces, so a blog sibling that copied that key would let a post
// and a project SHARING A SLUG serve each other's cached draft state. Same class as 3a's
// hero-path clobber, one layer up — and the reason the collection is folded into the key
// below rather than left implicit. Asserted in ralph/tests/blog-registry.mjs (F1/F2).
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
// The key lives in its own leaf so a ralph suite can assert the two collections cannot
// collide — this module imports next/cache and is unloadable by one.
import { entryDraftCacheKey, type DraftableCollection } from "./entry-draft-key";

export { entryDraftCacheKey, type DraftableCollection };

/** The shared namespace both collections' keys start with. */
const KEY_NAMESPACE = entryDraftCacheKey("projects")[0];

export type EntryDraftState = {
  /** Which branch `raw` came from. "live" means either no draft exists, this slug is
   *  unchanged on it, or the read degraded. */
  source: "draft" | "live";
  /** The RAW body value for this collection — `sections` for projects, `blocks` for
   *  blog — unmapped, or null when source is "live" (the caller then uses live). */
  raw: unknown;
  /** PUBLIC paths (/images/**) of images that changed on the draft branch, so the editor
   *  can route just those through the draft-image proxy. Free — it comes from the
   *  compare response this function already fetches. */
  draftImages: string[];
  /** The draft's `template`, or null. PROJECTS ONLY — blog has no template. Kept on the
   *  shared shape rather than split into two return types because exactly one consumer
   *  reads it and a second type would cost every caller a narrow. */
  template: string | null;
};

const LIVE: EntryDraftState = { source: "live", raw: null, draftImages: [], template: null };

/** public/images/x.webp -> /images/x.webp, for image files only. */
const IMAGE_FILE_RE = /^public(\/images\/.+\.(?:webp|png|jpe?g|svg))$/i;

/** Everything that differs per collection, in one place. */
const SPEC: Record<
  DraftableCollection,
  { file: (slug: string) => string; bodyField: "sections" | "blocks"; hasTemplate: boolean }
> = {
  projects: { file: (s) => `content/projects/${s}.yaml`, bodyField: "sections", hasTemplate: true },
  blog: { file: (s) => `content/blog/${s}.yaml`, bodyField: "blocks", hasTemplate: false },
};

const readEntryDraftCached = unstable_cache(
  async (collection: DraftableCollection, slug: string): Promise<EntryDraftState> => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[studio] entry draft read — comparing branches for ${collection}/${slug}`);
    }
    const cmp = await compareBranches(MAIN_BRANCH, DRAFT_BRANCH);
    if (cmp === null) return LIVE; // no draft branch

    // SCOPE GATE — only read the draft when THIS entry's file actually changed on it. A
    // settings-only (or other-entry) draft never touches the reader, so the editor costs
    // one compare call and nothing more.
    const spec = SPEC[collection];
    const file = spec.file(slug);
    const changed = cmp.files.find((f) => f.filename === file);
    if (!changed || changed.status === "removed") return LIVE;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[studio] entry draft read — reading ${file} from the draft branch`);
    }
    const reader = createGitHubReader(config, {
      repo: REPO as `${string}/${string}`,
      ref: DRAFT_BRANCH,
      token: process.env.STUDIO_GITHUB_TOKEN as string,
    });
    const entry = await reader.collections[collection].read(slug);
    if (!entry) return LIVE;

    // Same compare response, no extra request. A removed image is skipped: it is gone
    // from the draft, so the live path is the only one that can still serve.
    const draftImages = cmp.files
      .filter((f) => f.status !== "removed")
      .map((f) => IMAGE_FILE_RE.exec(f.filename)?.[1])
      .filter((p): p is string => p !== undefined);

    const record = entry as Record<string, unknown>;
    return {
      source: "draft",
      raw: record[spec.bodyField],
      draftImages,
      template: spec.hasTemplate
        ? typeof record.template === "string"
          ? record.template
          : ""
        : null,
    };
  },
  // The key NAMESPACE. `collection` is a function argument, which unstable_cache folds
  // into each entry's key, so the two collections cannot share a cache entry even for the
  // same slug — entryDraftCacheKey() states that pairing explicitly for the suite to
  // assert, and is what any future caller should read the key from.
  [KEY_NAMESPACE],
  { revalidate: DRAFT_STATE_TTL_SECONDS, tags: [DRAFT_STATE_TAG] }
);

/**
 * The draft version of one entry's body, or live. github mode only; any GitHub error
 * degrades to live rather than breaking the editor.
 *
 * NOTE FOR TESTING: outside github mode this returns LIVE unconditionally, so in dev the
 * editor ALWAYS reads live and the draft-preferring behaviour is structurally
 * unexercisable locally.
 */
export async function getEntryDraftState(
  collection: DraftableCollection,
  slug: string
): Promise<EntryDraftState> {
  if (process.env.STUDIO_WRITE_MODE !== "github" || !process.env.STUDIO_GITHUB_TOKEN) {
    return LIVE; // fs / dev — never hits the GitHub API
  }
  try {
    return await readEntryDraftCached(collection, slug);
  } catch {
    return LIVE;
  }
}
