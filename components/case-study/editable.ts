// CS-7d — the inline-canvas editing affordance. The case-study render components tag
// their plain-string text fields with `data-edit` markers + contentEditable ONLY when
// the studio passes `editable`; this class is the visible affordance. The rules live in
// globals.css as `.cs-editable` rather than as utilities, because the affordance needs
// a dashed OUTLINE (a border would shift the canvas layout) and a currentColor-derived
// ring so it reads on both the cream cards and the dark hero band.
//
// It is a leading-space suffix so it concatenates onto an existing className. Never
// applied on the public site (editable defaults off), so the public render stays
// byte-identical.
export const EDIT_AFFORD = " cs-editable";

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
