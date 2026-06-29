import type { CaseStudy } from "./types";

// Placeholder. This study still renders its poured content through the Keystatic
// [slug] route. When migrating to the bespoke template, pour sections here, wire a
// literal route at app/(portfolio)/projects/fosfor-ai/page.tsx, and add the slug to
// BESPOKE_SLUGS. Never copy boAt content under this name.
// TODO: pour content from the Fosfor AI source panels.
export const fosforAi: CaseStudy = {
  slug: "fosfor-ai",
  title: "Fosfor AI",
  description: "An AI companion across three personas. Case study coming soon.",
  thesis: "",
  sections: [],
};
