"use client";

// P4 4(b)-ii — the case-study body editor, scaled from one kind to the registry.
//
// THE ADDRESSING MODEL (established in 4(b)-i on pullQuote, unchanged here):
//  - The form value holds the WHOLE sections array. The owner edits one field;
//    every other block is carried in state exactly as it was read and written back
//    untouched. That is what makes the surgical round-trip STRUCTURAL — an unedited
//    block is never retyped, only re-dumped from the value it came in as.
//  - Blocks are addressed by a STABLE CLIENT ID from a parallel array kept OUTSIDE
//    the form values (the SK-3b pattern), never by array index. Indices move under
//    reorder (4b-iii); ids do not.
//
// Each block's form comes from BLOCK_REGISTRY, keyed by discriminant and exhaustive
// against the Keystatic-derived union. A kind with no Form yet (tier 3) renders a
// preserved-untouched note; its value still round-trips verbatim, exactly as every
// non-pullQuote kind did in 4(b)-i.
import { useRef, useState } from "react";
import type { RawSection } from "@/lib/case-studies/sections-raw";
import type { SectionBlockKind } from "@/lib/case-studies/sections-raw";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { BLOCK_REGISTRY, BLOCK_LABELS, type BlockFormProps } from "./blocks/registry";
import { IconGrid } from "./icons";

type SectionsFields = { sections: readonly RawSection[] };

const sectionLabel = (s: RawSection, i: number) =>
  s.title?.split("\n")[0] || s.eyebrow || s.id || `Section ${i + 1}`;

export default function SectionsEditPanel({
  slug,
  sections: initialSections,
}: {
  slug: string;
  sections: readonly RawSection[];
}) {
  const { setUnpublished } = usePublishSignal();

  // SK-3b — stable ids in a parallel structure, EXTERNAL to the form values, so the
  // POST shape stays the id-less raw sections the file holds.
  const nextId = useRef(0);
  const [ids] = useState<string[][]>(() =>
    initialSections.map((s) => s.blocks.map(() => `b${nextId.current++}`))
  );

  const { values, setField, dirty, saveStatus, saveDraft, cancel } = useDraftForm<SectionsFields>({
    initial: { sections: initialSections },
    buildCommitted: (v) => ({ sections: v.sections }),
    // A deep compare, because 4(b)-ii can change any field of any block — the 4(b)-i
    // shortcut (compare pullQuote texts) would now miss most edits. ~15KB of
    // stringify per keystroke is immaterial next to being wrong.
    isDirty: (v, b) => JSON.stringify(v.sections) !== JSON.stringify(b.sections),
    saveExtras: { collection: "projects", slug },
    buildBody: (committed, extras) => ({ ...extras, sections: committed.sections }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  /** Replace ONE block's value, addressed by its stable id. Every other block and
   *  section object is carried through by reference — never rebuilt, never retyped. */
  function setBlockValue(id: string, nextValue: unknown) {
    setField(
      "sections",
      values.sections.map((s, i) => {
        if (!ids[i].includes(id)) return s; // untouched section, same reference
        return {
          ...s,
          blocks: s.blocks.map((b, j) => (ids[i][j] === id ? { ...b, value: nextValue } : b)),
        };
      }) as readonly RawSection[]
    );
  }

  const notEditableYet = values.sections.reduce(
    (n, s) => n + s.blocks.filter((b) => !BLOCK_REGISTRY[b.discriminant].Form).length,
    0
  );

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

      <div className="flex flex-col gap-6 px-4 py-5">
        {values.sections.map((section, i) => (
          <div key={section.id || i} className="flex flex-col gap-3">
            <h3 className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
              {sectionLabel(section, i)}
            </h3>
            {section.blocks.map((block, j) => {
              const kind = block.discriminant as SectionBlockKind;
              const entry = BLOCK_REGISTRY[kind];
              const id = ids[i][j];
              // The registry is keyed by discriminant and each entry's Form is typed
              // to its own kind's value; the lookup cannot express that correlation
              // to the compiler, so it is asserted once, here, rather than in each
              // of the fourteen forms.
              const Form = entry.Form as React.ComponentType<BlockFormProps<typeof kind>> | undefined;
              return (
                <div key={id} className="rounded-lg border border-ink-950/8 bg-cream-50 p-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-medium text-ink-950">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(entry.label as (v: any) => string)(block.value)}
                    </span>
                    <span className="text-[10px] text-text-subtle">{BLOCK_LABELS[kind]}</span>
                  </div>
                  {Form ? (
                    <div className="flex flex-col gap-2">
                      <Form
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        value={block.value as any}
                        onChange={(next) => setBlockValue(id, next)}
                        onBlur={saveDraft}
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-subtle">
                      Not editable here yet. Preserved exactly as it is.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <p className="text-[10px] text-text-subtle">
          Wrap words in **double asterisks** to bold them.
          {notEditableYet > 0 && (
            <>
              {" "}
              {notEditableYet} block{notEditableYet === 1 ? " is" : "s are"} not editable here yet.
              They are preserved exactly as they are.
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
