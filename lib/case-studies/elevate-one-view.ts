import type { CaseStudy } from "./types";

// Placeholder. This study still renders its poured content through the Keystatic
// [slug] route. When migrating to the bespoke template, pour sections here, wire a
// literal route at app/(portfolio)/projects/elevate-one-view/page.tsx, and add the
// slug to BESPOKE_SLUGS. Never copy boAt content under this name.
// TODO: pour content from the Elevate ONE View source.
export const elevateOneView: CaseStudy = {
  slug: "elevate-one-view",
  title: "Elevate ONE View",
  description: "The current-role, confidentiality-constrained story. Case study coming soon.",
  thesis: "",
  sections: [],
};
