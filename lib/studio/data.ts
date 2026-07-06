import { cache } from "react";
import { getHomePageData, type HomePageData } from "@/lib/keystatic";
import {
  getSiteSettingsDraftState,
  getDraftBranchDiffers,
  type SettingsDraftState,
} from "./draft-site-settings";

export type StudioData = HomePageData & {
  settingsDraftState: SettingsDraftState;
  // CE-3a — branch-level "unpublished changes": true when the draft branch is
  // ahead of main in ANY file, so a collection-only edit lights the Publish bar.
  draftDiffers: boolean;
};

// Studio read. Draft-preferring for the settings surface (in github mode, the
// draft branch's settings win over live), still deduped per request via cache().
// The homepage's getHomePageData is untouched and never reads a draft branch, so
// the public site only ever shows published content (the read-split holds).
export const getStudioData = cache(async (): Promise<StudioData> => {
  const home = await getHomePageData();
  const settingsDraftState = await getSiteSettingsDraftState(home.settings);
  const draftDiffers = await getDraftBranchDiffers();
  return {
    ...home,
    settings: settingsDraftState.draft ?? home.settings,
    settingsDraftState,
    draftDiffers,
  };
});
