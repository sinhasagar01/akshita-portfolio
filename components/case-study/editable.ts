// CS-7d — the inline-canvas editing affordance. The case-study render components tag
// their plain-string text fields with `data-edit` markers + contentEditable ONLY when
// the studio passes `editable`; this class is the visible edit affordance (a text
// cursor, a soft accent hover/focus tint, and an accent focus ring that reads on both
// the cream cards and the dark bands). It is a leading-space suffix so it concatenates
// onto an existing className. Never applied on the public site (editable defaults off),
// so the public render stays byte-identical.
export const EDIT_AFFORD =
  " cursor-text rounded-sm outline-none transition-colors hover:bg-accent-500/5" +
  " focus-visible:bg-accent-500/5 focus-visible:outline focus-visible:outline-2" +
  " focus-visible:outline-offset-2 focus-visible:outline-accent-500";

/** The `data-edit-field` values CS-7d wires for block text (plain strings only). */
export type EditableBlockField = "text";

/**
 * Marker props for an in-place-editable PLAIN-STRING field inside a block, tagged with
 * a dotted path into the block's value (e.g. "text", "stats.0.value", "features.1.title").
 * The studio canvas reads `data-edit-value-path` on blur and deep-sets the block value.
 * Returns {} when not editable, so the public render is byte-identical. Rich `**bold**`
 * fields are NOT tagged (contenteditable would strip the markers) — they edit in the form.
 * Also carries `role="textbox"` + an accessible name so keyboard/SR users get a real,
 * labelled control.
 */
export function inlineEditProps(
  editable: boolean,
  blockIndex: number | undefined,
  path: string,
  label?: string,
) {
  if (!editable) return {} as Record<string, never>;
  return {
    contentEditable: true,
    suppressContentEditableWarning: true,
    tabIndex: 0,
    role: "textbox",
    "aria-label": label ?? `Edit ${path.split(".").pop() ?? "field"}`,
    "data-edit-block-index": blockIndex,
    "data-edit-value-path": path,
  } as const;
}
