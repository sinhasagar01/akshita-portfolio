// The fixed section list for the /studio/settings list+detail editor. Single
// source so the settings page (ListDetailLayout sections) and the studio search
// index can never drift on section ids or labels. `keywords` is extra search
// vocabulary for the fields inside each section; it is ignored by the editor.
export type StudioSettingsSection = { id: string; name: string; keywords?: string };

export const STUDIO_SETTINGS_SECTIONS: StudioSettingsSection[] = [
  { id: "hero", name: "Hero", keywords: "hero copy signature tabs role label scroll cue" },
  { id: "about", name: "About", keywords: "about bio chips note subtext photo caption" },
  { id: "links", name: "Links", keywords: "links resume email social urls" },
  { id: "process", name: "Process", keywords: "process stages discover define design validate tags" },
];
