"use client";

// A LABELLED save indicator. The label is required, and that is the whole point of the
// component existing.
//
// The blog editor runs TWO useDraftForm instances — the head fields in BlogEditPanel and
// the block array in BlogBlocksEditPanel — posting two different request bodies to two
// different branches of the save-draft seam. That separation is deliberate and locked. It
// was also invisible: both panels rendered a bare "Saved", and once the three-pane layout
// stacks them in one 320px inspector, two unlabelled "Saved" strings a few hundred pixels
// apart read as one form reporting itself twice.
//
// That misreading is #174's exact defect class, the one that let `saveDraft()` close over
// stale `values` unnoticed, and it is listed as standing hazard 7. So the label is not
// decoration and it is not optional in the type. "Post saved" and "Body saved" say there
// are two forms, which is true, and G4 proves it by capturing two distinct patches.
export default function SaveIndicator({
  label,
  saving,
  dirty,
  onInk = false,
}: {
  /** Which form this reports on. Required — an unlabelled indicator is the bug. */
  label: string;
  saving: boolean;
  dirty: boolean;
  /**
   * Drawn on an ink band rather than on cream.
   *
   * THE COMPONENT TAKES ITS GROUND RATHER THAN ASSUMING ONE. `text-text-subtle` resolves to a
   * value chosen against cream; on the inspector's ink band it drops to 1.72:1 — unreadable,
   * and invisible in review because the markup looks unchanged. A boolean is enough here
   * because there are exactly two grounds in this app and no third is proposed; if a third
   * ever appears, this becomes a ground name, not another boolean.
   */
  onInk?: boolean;
}) {
  // aria-live on the wrapper rather than the text node, so the label is read WITH the state
  // when it changes. An announcement of "Saved" alone tells a screen reader user which of
  // the two forms saved exactly as poorly as the visual version did.
  return (
    <span
      aria-live="polite"
      className={`shrink-0 text-[11.5px] font-medium ${onInk ? "text-ink-200" : "text-text-subtle"}`}
    >
      {label} {saving ? "saving…" : dirty ? "unsaved" : "saved"}
    </span>
  );
}
