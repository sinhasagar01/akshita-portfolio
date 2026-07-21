// Structural edits to a richText block's `paragraphs` array.
//
// WHY THESE ARE STRUCTURAL. `richText` stores prose as an ARRAY of strings, one per
// paragraph, and the renderer emits one <p> per item. So Enter cannot be a character:
// pressing it has to grow the array, and Backspace at a paragraph's start has to shrink
// it. Typing a newline into a single item instead would look right in the canvas and be
// wrong on disk — one <p> containing a line break rather than two paragraphs — and the
// public page would render it as one run-on paragraph.
//
// Kept pure and dependency-free so the array math is exercised in plain node, away from
// carets, selections and React. The DOM half (where the caret is, what the text either
// side of it serializes to) lives in the panel; everything below is just list surgery.

/**
 * Split paragraph `index` into two items at the caret.
 *
 * `before` and `after` are the marker strings for the text on each side, already
 * serialized by `richToMarkers` — so bold that sits entirely on one side survives, and
 * bold the caret lands inside is closed off on both sides by the serializer rather than
 * here. Out-of-range indices return the array untouched rather than throwing, because a
 * keystroke racing a re-render must never destroy content.
 */
export function splitParagraph(
  paragraphs: readonly string[],
  index: number,
  before: string,
  after: string
): string[] {
  if (index < 0 || index >= paragraphs.length) return [...paragraphs];
  return [...paragraphs.slice(0, index), before, after, ...paragraphs.slice(index + 1)];
}

/**
 * Merge paragraph `index` into `index - 1`, the inverse of a split.
 *
 * Returns the new array plus `caret`, the PLAIN-TEXT offset of the join — where the
 * caret has to land so the merge reads as a single Backspace rather than a jump. Plain
 * text, not marker text, because the caret lives in the rendered DOM where `**` is bold
 * and not characters.
 *
 * An empty paragraph merges to a no-op join, which is what removes it: the item goes,
 * the previous text is untouched, and no `""` is left behind to sit in the yaml.
 */
export function mergeParagraph(
  paragraphs: readonly string[],
  index: number
): { paragraphs: string[]; caret: number } {
  if (index <= 0 || index >= paragraphs.length) {
    return { paragraphs: [...paragraphs], caret: 0 };
  }
  const prev = paragraphs[index - 1];
  const merged = prev + paragraphs[index];
  return {
    paragraphs: [...paragraphs.slice(0, index - 1), merged, ...paragraphs.slice(index + 1)],
    // The join sits after the previous paragraph's VISIBLE characters, so the markers
    // are stripped to count it.
    caret: plainLength(prev),
  };
}

/** Visible length of a marker string — what the caret counts in the rendered DOM. */
export function plainLength(marker: string): number {
  return marker.replace(/\*\*(.+?)\*\*/g, "$1").length;
}
