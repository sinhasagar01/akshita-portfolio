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
import SaveBar from "./SaveBar";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconBriefcase } from "./icons";
import { inputClsMd, FIELD_MEASURE , FieldKey} from "./blocks/fields";

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
};

type ExperienceFields = {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
};

export default function ExperienceEditPanel({
  itemId,
  slug,
  company,
  title,
  startDate,
  endDate,
  location,
}: Props) {
  const initial: ExperienceFields = { title, startDate, endDate, location };
  // Report differs + pending up to the page Publish bar (now in the dashboard layout).
  const { setUnpublished } = usePublishSignal();

  const {
    values,
    setField,
    dirty,
    saveStatus,
    savedAt,
    saveDraft,
    cancel,
  } = useDraftForm<ExperienceFields>({
    toastLabel: "Experience",
    initial,
    buildCommitted: (v) => ({ ...v }),
    isDirty: (v, b) =>
      v.title !== b.title ||
      v.startDate !== b.startDate ||
      v.endDate !== b.endDate ||
      v.location !== b.location,
    saveExtras: { collection: "experience", slug },
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item


  return (
    <section
      aria-label={`Edit ${company}`}
      // NO FRAME — these pages are full-height shells since #242, so a panel frame here is a box
      // drawn around a box, and its `overflow-hidden` clipped the pane's own scrolling. The full
      // reasoning and the measurements are on `AboutEditPanel`'s copy of this line.
      className="bg-studio-cream-100"
    >
      <header className="flex items-center justify-between gap-3 border-b border-studio-ink-950/12 bg-studio-cream-200 px-4 py-[19px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500/10 text-studio-accent-500 [&>svg]:size-3.5">
            <IconBriefcase />
          </span>
          <span className="truncate font-display text-base text-studio-ink-950">{company}</span>
          {dirty && (
            <span className="rounded-full border border-studio-ink-950/15 px-2 py-0.5 text-[10px] text-studio-text-subtle">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-studio-ink-600 transition-colors hover:bg-studio-cream-200 hover:text-studio-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        {/* Company is the slugField (the entry identity). Shown read-only so an
            edit here never silently fails — it is set on Add and not editable. */}
        <label className="flex flex-col gap-1.5">
          <FieldKey>Company</FieldKey>
          <input
            type="text"
            value={company}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
            // DELIBERATELY LOCAL — the READONLY-DISPLAY family (see ralph's studio-ink
            // suite), and the reason is SEMANTIC rather than layout: the shared export
            // carries focus styling, which is dead on a tabIndex={-1} control that cannot
            // be focused, and this field wants cursor-not-allowed. Height tracks the well.
            //
            // READONLY IS DARKER, AND THE LADDER IS WHY IT MOVED. readonly-is-darker predates
            // the ground ladder, and it used to mean cream-100 against a cream-50 panel. The
            // ladder put the panel body ON cream-100, which would have made this field the
            // same colour as its ground and inverted the convention into nothing. cream-200
            // is the only step that keeps it darker than a normal input (now cream-50) AND
            // visible against the body. It sits with the chrome, which is right — a readonly
            // field is chrome that happens to hold text.
            //
            // `text-text-subtle`, NOT the phantom `text-ink-500` — hazard 23, now closed. There
            // is no --color-ink-500 token, so Tailwind v4 generated nothing for it and this field
            // rendered inherited ink-950 for its whole life, same as an editable one. The muted
            // intent this field always meant never reached the screen. The 40 phantom sites were
            // re-pointed to the token each already stood next to, so the hazard closed by
            // realising the original intent rather than by deleting the muting. This field muted
            // against cream-200, the worst-case ground, still clears AA at 4.78.
            className={`min-h-11 w-full ${FIELD_MEASURE} cursor-not-allowed rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-200 px-3 py-2 text-[14px] text-studio-text-subtle outline-none`}
          />
          <span className="text-[10px] text-studio-text-subtle">
            The entry&rsquo;s identity, set when you add it. Not editable here.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldKey>Role title</FieldKey>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <FieldKey>Start date</FieldKey>
            <input
              type="text"
              value={values.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              onBlur={saveDraft}
              placeholder="Aug 2022"
              className={`${inputClsMd} ${FIELD_MEASURE}`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldKey>End date</FieldKey>
            <input
              type="text"
              value={values.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
              onBlur={saveDraft}
              placeholder="Present"
              className={`${inputClsMd} ${FIELD_MEASURE}`}
            />
          </label>
        </div>

        {/* ⚠ THE "WHAT YOU DID" TEXTAREA WAS HERE AND IS DELETED. It asked for four rows of copy
            per entry, on five entries, and its hint promised "each line renders as its own paragraph
            under the role" — WHICH WAS FALSE. `ExperienceSection` never read the field and
            `ExperienceEntry`, which would have, was imported by nothing.

            Keeping it and correcting the hint was the alternative, and it was the worst of the three:
            it would have DOCUMENTED the lie rather than removed it — a field kept alive by a control
            describing behaviour that does not exist. Role descriptions remain worth wanting; they are
            a design change to the experience row, not five blanks. */}

        <label className="flex flex-col gap-1.5">
          <FieldKey>Location</FieldKey>
          <input
            type="text"
            value={values.location}
            onChange={(e) => setField("location", e.target.value)}
            onBlur={saveDraft}
            placeholder="Bengaluru"
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
          <span className="text-[10px] text-studio-text-subtle">
            City shown next to the company. Overrides the city parsed from the company name.
          </span>
        </label>
      </div>

      {/* ONE SHAPE — see SaveBar. The instruction that used to be the idle string is now its
          `title`, and the line reports state. `sticky` is preserved: this bar rides the bottom of a
          scrolling panel and always did. */}
      <SaveBar
        className="sticky bottom-0 z-10"
        status={saveStatus}
        dirty={dirty}
        savedAt={savedAt}
        title="Auto-saves to draft on blur. Publish from the Hero panel."
        primary={{ label: "Save draft", onClick: saveDraft, disabled: !dirty || saveStatus === "saving" }}
      />
    </section>
  );
}
