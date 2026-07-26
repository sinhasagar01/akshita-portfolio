import { cache } from "react";
import {
  getHomePageData,
  getStudioBlogPosts,
  type HomePageData,
  type BlogCard,
} from "@/lib/keystatic";
import {
  getSiteSettingsDraftState,
  getDraftBranchState,
  type SettingsDraftState,
} from "./draft-site-settings";
import { overlayCollection, byOrderIndex, byDateNewestFirst } from "./draft-overlay";

export type StudioData = HomePageData & {
  /** BS-3c — EVERY post, published and draft, draft-overlaid and newest first. Not in
   *  HomePageData because the PUBLIC read must never see drafts; the studio index must. */
  blog: BlogCard[];
  settingsDraftState: SettingsDraftState;
  // CE-3a — branch-level "unpublished changes": true when the draft branch is
  // ahead of main in ANY file, so a collection-only edit lights the Publish bar.
  draftDiffers: boolean;
  /** The draft read failed, so the studio is showing LIVE as a fail-safe. The bar
   *  says so, rather than reading as "nothing to publish". */
  draftReadError: boolean;
};

// Studio read. Draft-preferring for the settings singleton (CE-3) AND the
// collection entries (CE-3b): in github mode, a changed entry's draft version
// wins over live, so a saved edit previews in the panel. Deduped per request via
// cache(). The homepage's getHomePageData is untouched and never reads a draft
// branch, so the public site only ever shows published content (read-split holds).
export const getStudioData = cache(async (): Promise<StudioData> => {
  const home = await getHomePageData();
  // Unfiltered on purpose — the studio shows drafts (getStudioBlogPosts, not getBlogPosts).
  const blogLive = await getStudioBlogPosts();
  const settingsDraftState = await getSiteSettingsDraftState(home.settings);
  const draft = await getDraftBranchState();
  return {
    ...home,
    settings: settingsDraftState.draft ?? home.settings,
    // F-2 — overlay the draft branch onto the live list: union in draft-created
    // entries, subtract draft-deleted slugs, re-sort by orderIndex. A modify-only
    // draft (or no draft / a GitHub error → EMPTY_DRAFT_STATE) yields the live
    // list, same order, so this is behavior-preserving for the edit-only case.
    projects: overlayCollection(home.projects, draft.projects, draft.removedProjects, byOrderIndex),
    experience: overlayCollection(home.experience, draft.experience, draft.removedExperience, byOrderIndex),
    // BS-3c — blog orders by `date`, not orderIndex (it has none), so it names its own
    // comparator. The comparator is required rather than defaulted precisely so this
    // could not silently inherit the projects ordering.
    blog: overlayCollection(blogLive, draft.blog, draft.removedBlog, byDateNewestFirst),
    // SK-4 — draft-prefer the skills singleton (null unless skills.yaml changed).
    skills: draft.skills ?? home.skills,
    settingsDraftState,
    draftDiffers: draft.differs,
    draftReadError: draft.readError,
  };
});
