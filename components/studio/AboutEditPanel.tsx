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
import { useRef } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconUser, IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";

type Props = {
  itemId: string;
  aboutCopy: string;
  aboutNote: string;
  aboutFocusChips: string[];
  aboutSubtext: string;
  aboutPhotoCaption: string;
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
}: Props) {
  const initial: AboutFields = {
    aboutCopy,
    aboutNote,
    aboutFocusChips,
    aboutSubtext,
    aboutPhotoCaption,
  };
  // After "Add chip", focus the new input without a layout effect.
  const pendingFocus = useRef<number | null>(null);
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
  const editChip = (i: number, v: string) =>
    updateChips(values.aboutFocusChips.map((c, idx) => (idx === i ? v : c)));
  const removeChip = (i: number) =>
    updateChips(values.aboutFocusChips.filter((_, idx) => idx !== i));
  function addChip() {
    pendingFocus.current = values.aboutFocusChips.length;
    updateChips([...values.aboutFocusChips, ""]);
  }
  function moveChip(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= values.aboutFocusChips.length) return;
    const next = [...values.aboutFocusChips];
    [next[i], next[j]] = [next[j], next[i]];
    updateChips(next);
  }

  return (
    <section
      aria-label="Edit About"
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconUser />
          </span>
          <span className="font-display text-base text-ink-950">About</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-500">
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
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">About bio</span>
          <textarea
            rows={7}
            value={values.aboutCopy}
            onChange={(e) => edit("aboutCopy", e.target.value)}
            onBlur={saveDraft}
            className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
          <span className="text-[10px] text-text-subtle">
            The first paragraph is the large lead. A blank line starts a new paragraph.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">About note</span>
          <input
            type="text"
            value={values.aboutNote}
            onChange={(e) => edit("aboutNote", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Focus chips</span>
          <div className="flex flex-col gap-1.5">
            {values.aboutFocusChips.map((chip, i) => {
              const name = chip.trim() || "chip";
              // Reorder/remove buttons preventDefault on mousedown so clicking
              // them does not blur the focused chip input and fire a save mid-op.
              const iconBtn =
                "grid size-8 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-4";
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={chip}
                    ref={(el) => {
                      if (el && pendingFocus.current === i) {
                        el.focus();
                        pendingFocus.current = null;
                      }
                    }}
                    onChange={(e) => editChip(i, e.target.value)}
                    onBlur={saveDraft}
                    placeholder="Focus area"
                    className="min-w-0 flex-1 rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => moveChip(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${name} up`}
                    className={iconBtn}
                  >
                    <IconChevronUp />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => moveChip(i, 1)}
                    disabled={i === values.aboutFocusChips.length - 1}
                    aria-label={`Move ${name} down`}
                    className={iconBtn}
                  >
                    <IconChevronDown />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => removeChip(i)}
                    aria-label={`Remove ${name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-4"
                  >
                    <IconX />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addChip}
            className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> Add chip
          </button>
          {values.aboutFocusChips.length === 0 && (
            <span className="text-[10px] text-text-subtle">
              No focus chips. The About section renders without them.
            </span>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">About subtext</span>
          <input
            type="text"
            value={values.aboutSubtext}
            onChange={(e) => edit("aboutSubtext", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Photo caption</span>
          <input
            type="text"
            value={values.aboutPhotoCaption}
            onChange={(e) => edit("aboutPhotoCaption", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/8 bg-cream-100 px-4 py-3">
        <span className="text-[11px]" aria-live="polite">
          {saveStatus === "saving" ? (
            <span className="text-ink-500">Saving draft…</span>
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
          className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
    </section>
  );
}
