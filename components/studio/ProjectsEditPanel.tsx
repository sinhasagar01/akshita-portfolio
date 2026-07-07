"use client";

// CE-2 — project entry editor (Surface B). Mirrors the CE-1 experience panel:
// one panel per existing project, editing the two non-slug/non-image/non-body
// fields — summary and the four facts. The save posts { collection, slug, patch }
// via useDraftForm's saveExtras; the route commits to the SAME draft branch as
// the singleton (DB-1 accumulation). title is the slug (read-only); heroImage and
// body are out of scope and not shown (edited in Keystatic). No in-studio
// preview yet (CE-2): reflects the edit in-session; a reload shows live.
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconGrid } from "./icons";
import type { ProjectFacts } from "@/lib/studio/projects-format";

type Props = {
  itemId: string;
  slug: string;
  title: string;
  summary: string;
  facts: ProjectFacts;
};

// Only type + platform are editable here (Phase-1 T1). role + timeline stay in
// the file as valid data but are not part of the form, so the posted facts patch
// is { type, platform } and the serializer merges it (role/timeline preserved).
type EditableFacts = { type: string; platform: string };
type ProjectsFields = {
  summary: string;
  facts: EditableFacts;
};

const FACTS: { key: keyof EditableFacts; label: string; placeholder: string }[] = [
  { key: "type", label: "Type", placeholder: "Mobile app redesign" },
  { key: "platform", label: "Platform", placeholder: "Android and iOS" },
];

export default function ProjectsEditPanel({ itemId, slug, title, summary, facts }: Props) {
  const initial: ProjectsFields = {
    summary,
    facts: { type: facts.type, platform: facts.platform },
  };
  // Report differs + pending up to the page Publish bar (in the dashboard layout).
  const { setUnpublished } = usePublishSignal();

  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<ProjectsFields>({
    initial,
    buildCommitted: (v) => ({ summary: v.summary, facts: { ...v.facts } }),
    isDirty: (v, b) =>
      v.summary !== b.summary ||
      v.facts.type !== b.facts.type ||
      v.facts.platform !== b.facts.platform,
    saveExtras: { collection: "projects", slug },
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const setFact = (key: keyof EditableFacts, val: string) =>
    setField("facts", { ...values.facts, [key]: val });

  const inputCls =
    "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

  return (
    <section
      aria-label={`Edit ${title}`}
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconGrid />
          </span>
          <span className="truncate font-display text-base text-ink-950">{title}</span>
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

      <div className="flex flex-col gap-5 px-4 py-5">
        <p className="text-[11px] text-text-subtle">
          Title, hero image, and the case study body are edited in Keystatic.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Summary</span>
          <textarea
            rows={3}
            value={values.summary}
            onChange={(e) => setField("summary", e.target.value)}
            onBlur={saveDraft}
            className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
          <span className="text-[10px] text-text-subtle">One sentence shown on the project card.</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {FACTS.map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">{label}</span>
              <input
                type="text"
                value={values.facts[key]}
                onChange={(e) => setFact(key, e.target.value)}
                onBlur={saveDraft}
                placeholder={placeholder}
                className={inputCls}
              />
            </label>
          ))}
        </div>
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
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish from Site settings.</span>
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
