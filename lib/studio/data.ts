import { cache } from "react";
import { getHomePageData, type HomePageData } from "@/lib/keystatic";
import {
  getSiteSettingsDraftState,
  getDraftBranchState,
  type SettingsDraftState,
} from "./draft-site-settings";

export type StudioData = HomePageData & {
  settingsDraftState: SettingsDraftState;
  // CE-3a — branch-level "unpublished changes": true when the draft branch is
  // ahead of main in ANY file, so a collection-only edit lights the Publish bar.
  draftDiffers: boolean;
};

// Studio read. Draft-preferring for the settings singleton (CE-3) AND the
// collection entries (CE-3b): in github mode, a changed entry's draft version
// wins over live, so a saved edit previews in the panel. Deduped per request via
// cache(). The homepage's getHomePageData is untouched and never reads a draft
// branch, so the public site only ever shows published content (read-split holds).
export const getStudioData = cache(async (): Promise<StudioData> => {
  const home = await getHomePageData();
  const settingsDraftState = await getSiteSettingsDraftState(home.settings);
  const draft = await getDraftBranchState();
  return {
    ...home,
    settings: settingsDraftState.draft ?? home.settings,
    // Overlay the draft versions of changed entries; unchanged entries stay live.
    // Edit-only means same slugs and orderIndex, so the list + order are preserved.
    projects: home.projects.map((p) => draft.projects[p.slug] ?? p),
    experience: home.experience.map((e) => draft.experience[e.slug] ?? e),
    settingsDraftState,
    draftDiffers: draft.differs,
  };
});
