import { cache } from "react";
import { getHomePageData, type HomePageData } from "@/lib/keystatic";
import {
  getSiteSettingsDraftState,
  type SettingsDraftState,
} from "./draft-site-settings";

export type StudioData = HomePageData & {
  settingsDraftState: SettingsDraftState;
};

// Studio read. Draft-preferring for the settings surface (in github mode, the
// draft branch's settings win over live), still deduped per request via cache().
// The homepage's getHomePageData is untouched and never reads a draft branch, so
// the public site only ever shows published content (the read-split holds).
export const getStudioData = cache(async (): Promise<StudioData> => {
  const home = await getHomePageData();
  const settingsDraftState = await getSiteSettingsDraftState(home.settings);
  return {
    ...home,
    settings: settingsDraftState.draft ?? home.settings,
    settingsDraftState,
  };
});
