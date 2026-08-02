"use client";

// About-A — About edit panel (Surface B), the second inline-editable settings
// group after Hero. Mirrors the Hero panel's proven save-draft pattern but
// carries only the save half: this panel has NO Publish. Publish is
// singleton-wide (it merges the whole settings draft into main) and lives on the
// Hero panel, which ships this panel's edits too via the DB-1 accumulating draft.
//
// The save posts a PARTIAL patch of only { aboutCopy, aboutNote } — DB-1 commits
// on top of the existing draft, so this never clobbers the Hero form's edits.
// (A shared useDraftForm hook is deferred to the third form — rule of three.)
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import ChipListEditor from "./ChipListEditor";
import SettingsPhotoField from "./SettingsPhotoField";
import { IconUser } from "./icons";
import { inputClsMd, labelCls, FIELD_MEASURE , FieldKey} from "./blocks/fields";

type Props = {
  itemId: string;
  aboutCopy: string;
  aboutNote: string;
  aboutFocusChips: string[];
  aboutSubtext: string;
  aboutPhotoCaption: string;
  // The site photo renders on the About section, so its upload control lives in
  // this panel. It is NOT an AboutFields value: photo has its own writer (the
  // upload route), never the text patch, so it rides as a plain prop like it did in
  // the Hero panel before it moved here.
  photo: string | null;
};

type AboutFields = {
  aboutCopy: string;
  aboutNote: string;
  aboutFocusChips: string[];
  aboutSubtext: string;
  aboutPhotoCaption: string;
};

// Chips are trimmed and de-blanked at the save boundary, so a blank row is never
// committed. dirty and the patch both use the trimmed form.
const trimChips = (chips: string[]) => chips.map((c) => c.trim()).filter(Boolean);
const sameChips = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export default function AboutEditPanel({
  itemId,
  aboutCopy,
  aboutNote,
  aboutFocusChips,
  aboutSubtext,
  aboutPhotoCaption,
  photo,
}: Props) {
  const initial: AboutFields = {
    aboutCopy,
    aboutNote,
    aboutFocusChips,
    aboutSubtext,
    aboutPhotoCaption,
  };
  // UX-1: report this panel's differs + pending state up to the page Publish bar.
  const { setUnpublished } = usePublishSignal();

  // Shared save/dirty/expand machine. About posts a PARTIAL patch of only its
  // fields; DB-1 accumulates them onto the draft without touching Hero's edits.
  // buildCommitted trims and de-blanks the chips, and syncValuesOnSave replaces
  // the form values with it on success so an empty chip row drops. dirty is
  // array-aware: it compares the TRIMMED chips, so a mid-typing empty row is not
  // dirty while a reorder or a single-chip edit flips it immediately.
  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<AboutFields>({
    initial,
    buildCommitted: (v) => ({ ...v, aboutFocusChips: trimChips(v.aboutFocusChips) }),
    isDirty: (v, b) =>
      v.aboutCopy !== b.aboutCopy ||
      v.aboutNote !== b.aboutNote ||
      v.aboutSubtext !== b.aboutSubtext ||
      v.aboutPhotoCaption !== b.aboutPhotoCaption ||
      !sameChips(trimChips(v.aboutFocusChips), b.aboutFocusChips),
    syncValuesOnSave: true,
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const edit = setField;
  const updateChips = (next: string[]) => setField("aboutFocusChips", next);

  return (
    <section
      aria-label="Edit About"
      // NO FRAME, AND THIS IS A BUG FIX RATHER THAN THE TIDY-UP IT WAS FILED AS.
      //
      // This carried `overflow-hidden rounded-panel border` — a panel frame, which was right
      // while these pages were padded cards. #242 made them full-height shells, and two things
      // changed at once: a frame inside a pane became a box drawn around a box, AND the
      // `overflow-hidden` that the radius requires started CLIPPING.
      //
      // The section is now exactly as tall as the pane, so the pane has nothing to scroll while
      // the section clips its own overflow with no scrollbar and no gesture that reaches it.
      // Measured before this change: 61px unreachable at a 700px viewport, 161px at 600, with
      // the last field sitting behind the save bar. #178's shape, reintroduced by the PR that
      // cited #178.
      //
      // Dropping the radius is what lets the overflow go, and dropping the overflow is what
      // makes the PANE the scroller it was already declared to be.
      className="bg-cream-100"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/12 bg-cream-200 px-4 py-[19px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconUser />
          </span>
          <span className="font-display text-base text-ink-950">About</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-text-subtle">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          // preventDefault on mousedown keeps focus on the edited field, so the
          // blur auto-save never fires for edits the click is about to discard
          // (H1.1). Keyboard Tab still blur-saves by design.
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <FieldKey>About bio</FieldKey>
          <textarea
            rows={7}
            value={values.aboutCopy}
            onChange={(e) => edit("aboutCopy", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} resize-y leading-relaxed`}
          />
          <span className="text-[10px] text-text-subtle">
            The first paragraph is the large lead. A blank line starts a new paragraph.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldKey>About note</FieldKey>
          <input
            type="text"
            value={values.aboutNote}
            onChange={(e) => edit("aboutNote", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Focus chips</span>
          <ChipListEditor
            chips={values.aboutFocusChips}
            onChange={updateChips}
            onBlur={saveDraft}
            addLabel="Add chip"
            placeholder="Focus area"
            itemNoun="chip"
          />
          {values.aboutFocusChips.length === 0 && (
            <span className="text-[10px] text-text-subtle">
              No focus chips. The About section renders without them.
            </span>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <FieldKey>About subtext</FieldKey>
          <input
            type="text"
            value={values.aboutSubtext}
            onChange={(e) => edit("aboutSubtext", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>

        <SettingsPhotoField photo={photo} onUploaded={() => setUnpublished(true)} />

        <label className="flex flex-col gap-1.5">
          <FieldKey>Photo caption</FieldKey>
          <input
            type="text"
            value={values.aboutPhotoCaption}
            onChange={(e) => edit("aboutPhotoCaption", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>
      </div>

      <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-ink-950/12 bg-cream-200 px-4 py-3">
        <span className="text-[12px]" aria-live="polite">
          {saveStatus === "saving" ? (
            <span className="text-text-subtle">Saving draft…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-accent-600">Draft saved</span>
          ) : saveStatus === "error" ? (
            <span className="text-accent-600">Save failed. Try again.</span>
          ) : saveStatus === "fs" ? (
            <span className="text-text-subtle">Draft save needs github mode (dev)</span>
          ) : (
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish from the Hero panel.</span>
          )}
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={!dirty || saveStatus === "saving"}
          className="rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[14px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
    </section>
  );
}
