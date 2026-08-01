"use client";

// PL-2b — Process edit panel (Surface B). The fifth inline-editable settings
// group. Mirrors the About panel over useDraftForm (Save-draft only, no Publish)
// and reuses the About-B array-editor pattern for each stage's tags. The save
// posts a PARTIAL patch of only { processStages }, so DB-1 accumulates it onto
// the draft without touching the other groups.
//
// A fixed four stages (the Process section owns four bespoke artifacts, so there
// is no add/remove-stage control). Each stage has a name, a description, and a
// tags array. Tags are trimmed and de-blanked at the save boundary.
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import ChipListEditor from "./ChipListEditor";
import { IconWorkflow } from "./icons";
import { inputClsMd, labelCls, FIELD_MEASURE , FieldKey} from "./blocks/fields";
import type { ProcessStage } from "@/lib/studio/site-settings-format";

type Props = { itemId: string; processStages: ProcessStage[] };
type ProcessFields = { processStages: ProcessStage[] };

const trimTags = (tags: string[]) => tags.map((t) => t.trim()).filter(Boolean);
const sameTags = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
// Array-aware, comparing the TRIMMED tags so a mid-typing empty tag row is not
// dirty while a reorder or a single edit flips it immediately (About-B pattern).
const sameStages = (a: ProcessStage[], b: ProcessStage[]) =>
  a.length === b.length &&
  a.every(
    (s, i) =>
      s.name === b[i].name &&
      s.description === b[i].description &&
      sameTags(trimTags(s.tags), b[i].tags)
  );

export default function ProcessEditPanel({ itemId, processStages }: Props) {
  const initial: ProcessFields = { processStages };
  // UX-1: report this panel's differs + pending state up to the page Publish bar.
  const { setUnpublished } = usePublishSignal();

  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<ProcessFields>({
    initial,
    buildCommitted: (v) => ({
      processStages: v.processStages.map((s) => ({
        name: s.name,
        description: s.description,
        tags: trimTags(s.tags),
      })),
    }),
    isDirty: (v, b) => !sameStages(v.processStages, b.processStages),
    syncValuesOnSave: true,
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const stages = values.processStages;
  const updateStages = (next: ProcessStage[]) => setField("processStages", next);
  const editStage = (i: number, patch: Partial<ProcessStage>) =>
    updateStages(stages.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));


  // ---- Expanded edit panel ----
  return (
    <section
      aria-label="Edit Process"
      // NO FRAME — these pages are full-height shells since #242, so a panel frame here is a box
      // drawn around a box, and its `overflow-hidden` clipped the pane's own scrolling. The full
      // reasoning and the measurements are on `AboutEditPanel`'s copy of this line.
      className="bg-cream-100"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/12 bg-cream-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconWorkflow />
          </span>
          <span className="font-display text-base text-ink-950">Process</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-text-subtle">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5">
        {stages.map((stage, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-200 p-3.5">
            <span className="text-eyebrow uppercase tracking-eyebrow text-accent-600">
              Stage {i + 1}
            </span>

            <label className="flex flex-col gap-1.5">
              <FieldKey>Name</FieldKey>
              <input
                type="text"
                value={stage.name}
                onChange={(e) => editStage(i, { name: e.target.value })}
                onBlur={saveDraft}
                placeholder="Stage name"
                className={`${inputClsMd} ${FIELD_MEASURE}`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldKey>Description</FieldKey>
              <input
                type="text"
                value={stage.description}
                onChange={(e) => editStage(i, { description: e.target.value })}
                onBlur={saveDraft}
                placeholder="One line describing the stage"
                className={`${inputClsMd} ${FIELD_MEASURE}`}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className={labelCls}>Tags</span>
              <ChipListEditor
                chips={stage.tags}
                onChange={(next) => editStage(i, { tags: next })}
                onBlur={saveDraft}
                addLabel="Add tag"
                placeholder="Tag"
                itemNoun="tag"
                ariaContext={`stage ${i + 1}`}
              />
            </div>
          </div>
        ))}
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
