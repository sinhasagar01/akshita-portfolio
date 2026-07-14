"use client";

// P4 4(b)-i — the case-study body editor, VERTICAL SLICE: pullQuote only.
//
// THE ADDRESSING MODEL (the irreducible core, established here on the simplest
// block so the hard part is proven cheaply):
//  - The form value holds the WHOLE sections array. The owner edits one field;
//    every other block is carried in state exactly as it was read and written
//    back untouched. That is what makes the surgical round-trip STRUCTURAL — an
//    unedited block is never retyped, only re-dumped from the value it came in
//    as. The 13 other kinds render no form yet (4b-ii) but are never dropped.
//  - Blocks are addressed by a STABLE CLIENT ID from a parallel array kept
//    OUTSIDE the form values (the SK-3b pattern), never by array index. Indices
//    move under reorder (4b-iii); ids do not. Editing by id today is what makes
//    reorder safe tomorrow.
//
// The POST body is `{ collection, slug, sections }` — sections is its own
// top-level key, so the route's dispatch is unambiguous and `sections` keeps
// exactly ONE writer (sanitizeProjectsPatch still rejects it on the text path).
import { useRef, useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { IconGrid } from "./icons";

/** The raw section/block shape as it comes off the reader (and goes back). Kept
 *  deliberately loose: 4(b)-i only ever reaches into pullQuote's `value.text`,
 *  and everything else must pass through untyped and untouched. */
type RawBlock = { discriminant: string; value: Record<string, unknown> };
type RawSection = {
  variant: string;
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  lead: string;
  northStar: string;
  layout: string;
  glow: Record<string, string>;
  blocks: RawBlock[];
};
type SectionsFields = { sections: RawSection[] };

/** One editable target: a pullQuote, its stable id, and the section context that
 *  makes it identifiable to a human (three anonymous quotes would be a puzzle). */
type Target = {
  id: string;
  sectionIndex: number;
  blockIndex: number;
  sectionLabel: string;
  text: string;
};

const sectionLabel = (s: RawSection, i: number) =>
  s.title?.split("\n")[0] || s.eyebrow || s.id || `Section ${i + 1}`;

export default function SectionsEditPanel({
  slug,
  sections: initialSections,
}: {
  slug: string;
  sections: RawSection[];
}) {
  const { setUnpublished } = usePublishSignal();

  // SK-3b — stable ids in a parallel structure, EXTERNAL to the form values, so
  // the POST shape stays the id-less raw sections the file holds. Seeded
  // deterministically; a ref counter would mint ids for blocks added in 4(b)-iii.
  const nextId = useRef(0);
  const [ids] = useState<string[][]>(() =>
    initialSections.map((s) => s.blocks.map(() => `b${nextId.current++}`))
  );

  const { values, setField, dirty, saveStatus, saveDraft, cancel } = useDraftForm<SectionsFields>({
    initial: { sections: initialSections },
    // Identity: the WHOLE sections array is the payload. Unedited blocks ride
    // through byte-for-byte as the values they were read as.
    buildCommitted: (v) => ({ sections: v.sections }),
    // Compare only what this slice can change — a pullQuote's text, by id. Any
    // other difference is impossible here, and a deep compare of ~15KB on every
    // keystroke would be wasteful.
    isDirty: (v, b) =>
      v.sections.some((s, i) =>
        s.blocks.some(
          (blk, j) =>
            blk.discriminant === "pullQuote" &&
            blk.value.text !== b.sections[i].blocks[j].value.text
        )
      ),
    saveExtras: { collection: "projects", slug },
    buildBody: (committed, extras) => ({ ...extras, sections: committed.sections }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  const targets: Target[] = [];
  values.sections.forEach((s, i) =>
    s.blocks.forEach((b, j) => {
      if (b.discriminant === "pullQuote") {
        targets.push({
          id: ids[i][j],
          sectionIndex: i,
          blockIndex: j,
          sectionLabel: sectionLabel(s, i),
          text: typeof b.value.text === "string" ? b.value.text : "",
        });
      }
    })
  );

  const otherCount = values.sections.reduce(
    (n, s) => n + s.blocks.filter((b) => b.discriminant !== "pullQuote").length,
    0
  );

  /** Edit ONE pullQuote's text, addressed by its stable id. Every other block
   *  object is carried through by reference — never rebuilt, never retyped. */
  function setText(id: string, text: string) {
    const next = values.sections.map((s, i) => {
      if (!ids[i].includes(id)) return s; // untouched section, same reference
      return {
        ...s,
        blocks: s.blocks.map((b, j) =>
          ids[i][j] === id ? { ...b, value: { ...b.value, text } } : b
        ),
      };
    });
    setField("sections", next);
  }

  return (
    <section
      aria-label="Edit case study body"
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconGrid />
          </span>
          <span className="font-display text-base text-ink-950">Case study body</span>
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
        {targets.length === 0 ? (
          <p className="text-[12px] text-text-subtle">This case study has no pull quotes.</p>
        ) : (
          targets.map((t) => (
            <label key={t.id} className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                Pull quote &middot; {t.sectionLabel}
              </span>
              <textarea
                rows={3}
                value={t.text}
                onChange={(e) => setText(t.id, e.target.value)}
                onBlur={saveDraft}
                className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
              />
            </label>
          ))
        )}

        <p className="text-[10px] text-text-subtle">
          Wrap words in **double asterisks** to bold them.
          {otherCount > 0 && (
            <>
              {" "}
              This case study has {otherCount} other block{otherCount === 1 ? "" : "s"} that are not
              editable here yet. They are preserved exactly as they are.
            </>
          )}
        </p>
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
            <span className="text-text-subtle">Auto-saves to draft on blur. Preview to see it.</span>
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
