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
import { IconGrid } from "./icons";
import type { ProjectFacts } from "@/lib/studio/projects-format";

type Props = {
  slug: string;
  title: string;
  summary: string;
  facts: ProjectFacts;
};

// Nested to match the posted patch shape { summary, facts } exactly.
type ProjectsFields = {
  summary: string;
  facts: ProjectFacts;
};

const FACTS: { key: keyof ProjectFacts; label: string; placeholder: string }[] = [
  { key: "role", label: "Role", placeholder: "Sole product designer" },
  { key: "type", label: "Type", placeholder: "Mobile app redesign" },
  { key: "platform", label: "Platform", placeholder: "Android and iOS" },
  { key: "timeline", label: "Timeline", placeholder: "10 weeks" },
];

export default function ProjectsEditPanel({ slug, title, summary, facts }: Props) {
  const initial: ProjectsFields = { summary, facts };
  // UX-1: report differs + pending up to a page Publish bar if one is present
  // (the projects page has none in CE-2; the no-op fallback makes this harmless).
  const { setUnpublished } = usePublishSignal();

  const {
    expanded,
    setExpanded,
    values,
    setField,
    savedBaseline,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<ProjectsFields>({
    initial,
    buildCommitted: (v) => ({ summary: v.summary, facts: { ...v.facts } }),
    isDirty: (v, b) =>
      v.summary !== b.summary ||
      v.facts.role !== b.facts.role ||
      v.facts.type !== b.facts.type ||
      v.facts.platform !== b.facts.platform ||
      v.facts.timeline !== b.facts.timeline,
    saveExtras: { collection: "projects", slug },
    onSaved: (json) => setUnpublished(Boolean(json.differs)),
  });

  useReportPending(dirty || saveStatus === "saving");

  const setFact = (key: keyof ProjectFacts, val: string) =>
    setField("facts", { ...values.facts, [key]: val });

  // ---- Collapsed card ----
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
        className="group block w-full overflow-hidden rounded-xl border border-ink-950/8 bg-cream-50 text-left transition-colors hover:border-accent-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
      >
        <div className="relative flex h-16 items-center justify-center bg-cream-200 text-accent-500">
          <span className="absolute right-2 top-2 rounded-full bg-accent-500/10 px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide text-accent-600">
            Editable
          </span>
          <span className="[&>svg]:size-5" aria-hidden>
            <IconGrid />
          </span>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-display text-[15px] leading-snug text-ink-950">{title}</span>
            <span className="shrink-0 text-[11px] text-accent-500 opacity-0 transition-opacity group-hover:opacity-100">
              Edit →
            </span>
          </div>
          <p className="mt-1.5 truncate text-[12px] text-ink-600">{savedBaseline.summary || "No summary"}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-400">
            {[savedBaseline.facts.type, savedBaseline.facts.platform].filter(Boolean).join(" · ") || "No facts"}
          </p>
        </div>
      </button>
    );
  }

  const inputCls =
    "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

  // ---- Expanded edit panel ----
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
