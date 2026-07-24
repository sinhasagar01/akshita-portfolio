import type { Section } from "./types";
import type { RailItem } from "@/components/case-study/PreviewRail";

/**
 * Derive the preview rail's items from a study's sections. Chrome from already-editable
 * data — id/index/eyebrow/title from the section shell, plus the first block's kind for
 * the schematic thumbnail. Not a new content surface; one source so the two public route
 * pages cannot drift. A section with no blocks (a fresh stub) falls back to a prose thumb.
 *
 * The HERO is excluded: it is the page's ground (a sibling of <main>), not a child of
 * article.case-study, and the rail navigates the BODY. This is the SAME split CaseStudyView
 * uses for the article, so PreviewRail's positional resolution (i-th article child) stays
 * aligned with these items.
 */
export function railItems(sections: Section[]): RailItem[] {
  return sections
    .filter((s) => s.variant !== "hero")
    .map((s) => ({
    id: s.id,
    index: s.index,
    eyebrow: s.eyebrow,
    title: s.title,
    kind: s.blocks[0]?.kind ?? "richText",
  }));
}
