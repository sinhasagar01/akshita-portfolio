"use client";

// CE-1 — experience entry editor (Surface B). The first COLLECTION editor: one
// panel per existing experience entry, editing the four non-slug fields. Mirrors
// the About panel over useDraftForm (Save-draft only, no Publish) — the save
// posts { collection, slug, patch } via useDraftForm's saveExtras, and the route
// commits to the SAME draft branch as the singleton (DB-1 accumulation).
//
// company is the entry slug (editing it renames the file) and is shown read-only.
// No in-studio preview yet (CE-1): the panel seeds from live and reflects the
// edit in-session; a reload shows live until Publish.
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconBriefcase } from "./icons";

type Props = {
  itemId: string;
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  // Still passed by the page and preserved in the file, but NOT editable here
  // (Phase-1 T2) — so it is not destructured, seeded, or sent in the patch.
  description: string;
};

type ExperienceFields = {
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
};

export default function ExperienceEditPanel({
  itemId,
  slug,
  company,
  title,
  startDate,
  endDate,
  description,
  location,
}: Props) {
  const initial: ExperienceFields = { title, startDate, endDate, description, location };
  // Report differs + pending up to the page Publish bar (now in the dashboard layout).
  const { setUnpublished } = usePublishSignal();

  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<ExperienceFields>({
    initial,
    buildCommitted: (v) => ({ ...v }),
    isDirty: (v, b) =>
      v.title !== b.title ||
      v.startDate !== b.startDate ||
      v.endDate !== b.endDate ||
      v.description !== b.description ||
      v.location !== b.location,
    saveExtras: { collection: "experience", slug },
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const inputCls =
    "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

  return (
    <section
      aria-label={`Edit ${company}`}
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconBriefcase />
          </span>
          <span className="truncate font-display text-base text-ink-950">{company}</span>
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
        {/* Company is the slugField (the entry identity). Shown read-only so an
            edit here never silently fails — it is set on Add and not editable. */}
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Company</span>
          <input
            type="text"
            value={company}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
            className="w-full cursor-not-allowed rounded-md border border-ink-950/8 bg-cream-100 px-3 py-2 text-[14px] text-ink-500 outline-none"
          />
          <span className="text-[10px] text-text-subtle">
            The entry&rsquo;s identity, set when you add it. Not editable here.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Role title</span>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            onBlur={saveDraft}
            className={inputCls}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Start date</span>
            <input
              type="text"
              value={values.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              onBlur={saveDraft}
              placeholder="Aug 2022"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">End date</span>
            <input
              type="text"
              value={values.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
              onBlur={saveDraft}
              placeholder="Present"
              className={inputCls}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
            What you did
          </span>
          <textarea
            rows={4}
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={saveDraft}
            placeholder={"Led the redesign of the mechanic app.\nShipped a design system used by three teams."}
            className={`${inputCls} resize-y`}
          />
          <span className="text-[10px] text-text-subtle">
            One line per point. Each line renders as its own paragraph under the role.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Location</span>
          <input
            type="text"
            value={values.location}
            onChange={(e) => setField("location", e.target.value)}
            onBlur={saveDraft}
            placeholder="Bengaluru"
            className={inputCls}
          />
          <span className="text-[10px] text-text-subtle">
            City shown next to the company. Overrides the city parsed from the company name.
          </span>
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
