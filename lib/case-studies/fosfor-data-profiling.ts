import type { CaseStudy } from "./types";

// Placeholder. This study still renders its poured content through the Keystatic
// [slug] route. When migrating to the bespoke template, pour sections here, wire a
// literal route at app/(portfolio)/projects/fosfor-data-profiling/page.tsx, and add
// the slug to BESPOKE_SLUGS. Never copy boAt content under this name.
// TODO: pour content from the Fosfor Data Profiling source.
export const fosforDataProfiling: CaseStudy = {
  slug: "fosfor-data-profiling",
  title: "Fosfor Data Profiling",
  description: "The enterprise data-profiling story. Case study coming soon.",
  thesis: "",
  sections: [],
};
