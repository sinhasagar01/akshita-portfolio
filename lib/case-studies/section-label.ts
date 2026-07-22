/**
 * The one place a section's DISPLAY name is derived, so the studio board, the focused
 * editor, and the public preview rail can never disagree — and none of them ever shows a
 * raw slug. The chain is title, then eyebrow, then a humanized id, then a positional
 * fallback. The humanized-id step is what keeps `final-video` from surfacing as the bare
 * slug it is in the id field: an id is a DOM anchor the owner edits, not a label.
 */

/** "final-video" -> "Final video". Blank / all-separator ids collapse to "". */
export function humanizeId(id?: string): string {
  if (!id) return "";
  const t = id.replace(/[-_]+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

/**
 * title -> eyebrow -> humanized id -> "Section N". Never a raw slug. `index` is 0-based;
 * the positional fallback shows 1-based. A title's explicit line breaks are flattened to
 * spaces so a two-line display title reads as one label (the rail's existing behaviour,
 * kept so this unification does not truncate multi-line titles).
 */
export function sectionDisplayLabel(
  fields: { title?: string; eyebrow?: string; id?: string },
  index: number,
): string {
  return (
    fields.title?.replace(/\s*\n\s*/g, " ").trim() ||
    fields.eyebrow?.trim() ||
    humanizeId(fields.id) ||
    `Section ${index + 1}`
  );
}
