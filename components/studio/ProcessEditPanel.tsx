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
import { useRef } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconWorkflow, IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";
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
  // After "Add tag", focus the new input. Keyed by stage + tag index.
  const pendingFocus = useRef<{ s: number; t: number } | null>(null);
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
  const editTag = (i: number, j: number, val: string) =>
    editStage(i, { tags: stages[i].tags.map((t, k) => (k === j ? val : t)) });
  const removeTag = (i: number, j: number) =>
    editStage(i, { tags: stages[i].tags.filter((_, k) => k !== j) });
  function addTag(i: number) {
    pendingFocus.current = { s: i, t: stages[i].tags.length };
    editStage(i, { tags: [...stages[i].tags, ""] });
  }
  function moveTag(i: number, j: number, dir: -1 | 1) {
    const k = j + dir;
    if (k < 0 || k >= stages[i].tags.length) return;
    const next = [...stages[i].tags];
    [next[j], next[k]] = [next[k], next[j]];
    editStage(i, { tags: next });
  }

  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-4";
  const inputCls =
    "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

  // ---- Expanded edit panel ----
  return (
    <section
      aria-label="Edit Process"
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconWorkflow />
          </span>
          <span className="font-display text-base text-ink-950">Process</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-500">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5">
        {stages.map((stage, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-ink-950/8 bg-cream-100/50 p-3.5">
            <span className="text-eyebrow uppercase tracking-eyebrow text-accent-600">
              Stage {i + 1}
            </span>

            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Name</span>
              <input
                type="text"
                value={stage.name}
                onChange={(e) => editStage(i, { name: e.target.value })}
                onBlur={saveDraft}
                placeholder="Stage name"
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Description</span>
              <input
                type="text"
                value={stage.description}
                onChange={(e) => editStage(i, { description: e.target.value })}
                onBlur={saveDraft}
                placeholder="One line describing the stage"
                className={inputCls}
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Tags</span>
              <div className="flex flex-col gap-1.5">
                {stage.tags.map((tag, j) => {
                  const name = tag.trim() || "tag";
                  return (
                    <div key={j} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tag}
                        ref={(el) => {
                          const pf = pendingFocus.current;
                          if (el && pf && pf.s === i && pf.t === j) {
                            el.focus();
                            pendingFocus.current = null;
                          }
                        }}
                        onChange={(e) => editTag(i, j, e.target.value)}
                        onBlur={saveDraft}
                        placeholder="Tag"
                        className="min-w-0 flex-1 rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => moveTag(i, j, -1)}
                        disabled={j === 0}
                        aria-label={`Move ${name} up in stage ${i + 1}`}
                        className={iconBtn}
                      >
                        <IconChevronUp />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => moveTag(i, j, 1)}
                        disabled={j === stage.tags.length - 1}
                        aria-label={`Move ${name} down in stage ${i + 1}`}
                        className={iconBtn}
                      >
                        <IconChevronDown />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeTag(i, j)}
                        aria-label={`Remove ${name} from stage ${i + 1}`}
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
                onClick={() => addTag(i)}
                className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
              >
                <IconPlus /> Add tag
              </button>
            </div>
          </div>
        ))}
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
