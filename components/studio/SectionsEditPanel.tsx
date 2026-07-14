"use client";

// P4 4(b)-iii — the case-study body editor: field forms (4b-ii) plus STRUCTURAL
// edits at two levels (sections, and blocks within a section).
//
// THE ADDRESSING MODEL (4b-i), and the hazard 4(b)-iii introduces:
//  - The form value holds the WHOLE sections array. The owner edits one field;
//    every other block is carried in state exactly as it was read and written back
//    untouched. That is what makes the surgical round-trip STRUCTURAL — an unedited
//    block is never retyped, only re-dumped from the value it came in as. A REORDER
//    therefore moves already-read values; it cannot re-serialize them differently.
//  - Blocks and sections are addressed by STABLE CLIENT IDS held in a parallel
//    structure OUTSIDE the form values (SK-3b), so the POST shape stays the id-less
//    raw sections the file holds.
//
// THE HAZARD: those ids are a PARALLEL array. `setBlockValue` finds a block through
// `ids.blockIds[i][j]`, so if a structural op changes `sections` without applying the
// same change to the ids, the mapping silently slips and edits land on the WRONG
// BLOCK. Every structural op therefore goes through `structural()` below, which
// applies the SAME pure primitive (moveIn / removeAt / insertAt) at the SAME index
// to both — there is no second implementation for them to drift apart.
//
// NOT SK-3a's ListDetailLayout: that has no reorder (its only "move" is the
// substring in onRemoveItem) and is a URL-driven page shell keyed to `?item=`, so
// two nested instances would fight over one param. The composition that works here
// is useItemList's primitives, already proven two levels deep in 4(b)-ii.
import { useRef, useState } from "react";
import type { RawSection, SectionBlockKind } from "@/lib/case-studies/sections-raw";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { moveIn, removeAt, insertAt, setAt } from "./useItemList";
import { BLOCK_REGISTRY, BLOCK_LABELS, type BlockFormProps } from "./blocks/registry";
import { SectionShellForm, emptySection } from "./blocks/SectionShell";
import { IconGrid, IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";

type SectionsFields = { sections: readonly RawSection[] };
/** The parallel stable ids, mirroring the sections structure exactly. */
type Ids = { sectionIds: string[]; blockIds: string[][] };

const sectionLabel = (s: RawSection, i: number) =>
  s.title?.split("\n")[0] || s.eyebrow || s.id || `Section ${i + 1}`;

const iconBtn =
  "grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3.5";

export default function SectionsEditPanel({
  slug,
  sections: initialSections,
}: {
  slug: string;
  sections: readonly RawSection[];
}) {
  const { setUnpublished } = usePublishSignal();

  const nextId = useRef(0);
  const mint = () => `x${nextId.current++}`;
  const [ids, setIds] = useState<Ids>(() => ({
    sectionIds: initialSections.map(mint),
    blockIds: initialSections.map((s) => s.blocks.map(mint)),
  }));
  const [picker, setPicker] = useState<string | null>(null);

  const { values, setField, dirty, saveStatus, saveDraft, cancel } = useDraftForm<SectionsFields>({
    initial: { sections: initialSections },
    buildCommitted: (v) => ({ sections: v.sections }),
    isDirty: (v, b) => JSON.stringify(v.sections) !== JSON.stringify(b.sections),
    saveExtras: { collection: "projects", slug },
    buildBody: (committed, extras) => ({ ...extras, sections: committed.sections }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  /**
   * The ONE place a structural edit happens. Both states are set in the same event,
   * so React batches them and they can never be observed apart.
   */
  function structural(fn: (s: readonly RawSection[], d: Ids) => { sections: RawSection[]; ids: Ids }) {
    const next = fn(values.sections, ids);
    setField("sections", next.sections);
    setIds(next.ids);
  }

  /* ----------------------------------------------------------- section ops */

  const moveSection = (i: number, dir: -1 | 1) =>
    structural((s, d) => ({
      sections: moveIn(s, i, dir),
      ids: { sectionIds: moveIn(d.sectionIds, i, dir), blockIds: moveIn(d.blockIds, i, dir) },
    }));

  const removeSection = (i: number) =>
    structural((s, d) => ({
      sections: removeAt(s, i),
      ids: { sectionIds: removeAt(d.sectionIds, i), blockIds: removeAt(d.blockIds, i) },
    }));

  function addSection() {
    // `id` is a DOM anchor, so it must be unique — mint one that is not taken.
    const used = new Set(values.sections.map((s) => s.id));
    let n = values.sections.length + 1;
    while (used.has(`section-${n}`)) n++;
    structural((s, d) => ({
      sections: [...s, emptySection(`section-${n}`)],
      ids: { sectionIds: [...d.sectionIds, mint()], blockIds: [...d.blockIds, []] },
    }));
  }

  const setSection = (i: number, next: RawSection) =>
    setField("sections", setAt(values.sections, i, next));

  /* ------------------------------------------------------------- block ops */

  const moveBlock = (si: number, bi: number, dir: -1 | 1) =>
    structural((s, d) => ({
      sections: setAt(s, si, { ...s[si], blocks: moveIn(s[si].blocks, bi, dir) }),
      ids: { ...d, blockIds: setAt(d.blockIds, si, moveIn(d.blockIds[si], bi, dir)) },
    }));

  const removeBlock = (si: number, bi: number) =>
    structural((s, d) => ({
      sections: setAt(s, si, { ...s[si], blocks: removeAt(s[si].blocks, bi) }),
      ids: { ...d, blockIds: setAt(d.blockIds, si, removeAt(d.blockIds[si], bi)) },
    }));

  function addBlock(si: number, kind: SectionBlockKind) {
    const block = { discriminant: kind, value: BLOCK_REGISTRY[kind].empty() } as RawSection["blocks"][number];
    structural((s, d) => ({
      sections: setAt(s, si, { ...s[si], blocks: insertAt(s[si].blocks, s[si].blocks.length, block) }),
      ids: { ...d, blockIds: setAt(d.blockIds, si, [...d.blockIds[si], mint()]) },
    }));
    setPicker(null);
  }

  /** Replace ONE block's value, addressed by its stable id. */
  function setBlockValue(id: string, nextValue: unknown) {
    setField(
      "sections",
      values.sections.map((s, i) => {
        if (!ids.blockIds[i].includes(id)) return s; // untouched section, same reference
        return {
          ...s,
          blocks: s.blocks.map((b, j) => (ids.blockIds[i][j] === id ? { ...b, value: nextValue } : b)),
        };
      }) as readonly RawSection[]
    );
  }

  const dupeIds = new Set(
    values.sections.map((s) => s.id).filter((id, i, a) => id !== "" && a.indexOf(id) !== i)
  );
  const addableKinds = (Object.keys(BLOCK_REGISTRY) as SectionBlockKind[]).filter(
    (k) => !BLOCK_REGISTRY[k].addBlockedUntilUpload
  );
  const blockedKinds = (Object.keys(BLOCK_REGISTRY) as SectionBlockKind[]).filter(
    (k) => BLOCK_REGISTRY[k].addBlockedUntilUpload
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
          <div key={ids.sectionIds[i]} className="flex flex-col gap-3 rounded-lg border border-ink-950/8 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                {sectionLabel(section, i)}
              </h3>
              <div className="flex gap-1">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label={`Move section ${sectionLabel(section, i)} up`} className={iconBtn}>
                  <IconChevronUp />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveSection(i, 1)} disabled={i === values.sections.length - 1} aria-label={`Move section ${sectionLabel(section, i)} down`} className={iconBtn}>
                  <IconChevronDown />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeSection(i)} aria-label={`Remove section ${sectionLabel(section, i)}`} className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5">
                  <IconX />
                </button>
              </div>
            </div>

            <SectionShellForm
              value={section}
              onChange={(next) => setSection(i, next)}
              onBlur={saveDraft}
              duplicateId={dupeIds.has(section.id)}
            />

            {section.blocks.map((block, j) => {
              const kind = block.discriminant as SectionBlockKind;
              const entry = BLOCK_REGISTRY[kind];
              const id = ids.blockIds[i][j];
              // The registry is keyed by discriminant and each Form is typed to its
              // own kind's value; the lookup cannot express that correlation to the
              // compiler, so it is asserted once, here.
              const Form = entry.Form as React.ComponentType<BlockFormProps<typeof kind>>;
              return (
                <div key={id} className="rounded-lg border border-ink-950/8 bg-cream-50 p-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-medium text-ink-950">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(entry.label as (v: any) => string)(block.value)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-subtle">{BLOCK_LABELS[kind]}</span>
                      <div className="flex gap-1">
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, j, -1)} disabled={j === 0} aria-label={`Move ${BLOCK_LABELS[kind]} up`} className={iconBtn}>
                          <IconChevronUp />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, j, 1)} disabled={j === section.blocks.length - 1} aria-label={`Move ${BLOCK_LABELS[kind]} down`} className={iconBtn}>
                          <IconChevronDown />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeBlock(i, j)} aria-label={`Remove ${BLOCK_LABELS[kind]}`} className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5">
                          <IconX />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Form
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      value={block.value as any}
                      onChange={(next) => setBlockValue(id, next)}
                      onBlur={saveDraft}
                      slug={slug}
                    />
                  </div>
                </div>
              );
            })}

            {picker === ids.sectionIds[i] ? (
              <div className="flex flex-col gap-2 rounded-md border border-accent-500/30 bg-cream-100 p-3">
                <span className="text-[10px] uppercase tracking-eyebrow text-ink-400">Add a block</span>
                <div className="flex flex-wrap gap-1.5">
                  {addableKinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => addBlock(i, k)}
                      className="rounded-md border border-ink-950/8 bg-cream-50 px-2.5 py-1.5 text-[12px] text-ink-700 transition-colors hover:border-accent-500/40 hover:text-accent-600"
                    >
                      {BLOCK_LABELS[k]}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-subtle">
                  {blockedKinds.map((k) => BLOCK_LABELS[k]).join(" and ")} need image upload, which is
                  coming. Each requires an image, and a case study with a missing image cannot be
                  published.
                </p>
                <button type="button" onClick={() => setPicker(null)} className="w-fit rounded-md px-2 py-1 text-[11px] text-ink-600 hover:text-ink-950">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPicker(ids.sectionIds[i])}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
              >
                <IconPlus /> Add a block
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
        >
          <IconPlus /> Add a section
        </button>

        <p className="text-[10px] text-text-subtle">Wrap words in **double asterisks** to bold them.</p>
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
