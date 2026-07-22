import type { Section } from "./types";
import type { RailItem } from "@/components/case-study/PreviewRail";

/**
 * Derive the preview rail's items from a study's sections. Chrome from already-editable
 * data — id/index/eyebrow/title from the section shell, plus the first block's kind for
 * the schematic thumbnail. Not a new content surface; one source so the two public route
 * pages cannot drift. A section with no blocks (a fresh stub) falls back to a prose thumb.
 */
export function railItems(sections: Section[]): RailItem[] {
  return sections.map((s) => ({
    id: s.id,
    index: s.index,
    eyebrow: s.eyebrow,
    title: s.title,
    kind: s.blocks[0]?.kind ?? "richText",
  }));
}
