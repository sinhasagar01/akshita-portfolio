"use client";

// BS-3c — the blog blocks host. A THIN, FLAT editor: one array of blocks, one list of
// stable ids, no section shell.
//
// WHY NOT SectionsEditPanel. That panel is bound to the section shape —
// `SectionsFields = { sections: RawSection[] }`, a two-level `Ids = { sectionIds,
// blockIds[][] }` kept in lockstep, a board of section cards, a per-section
// adaptSections canvas, and the SectionShellForm (variant/layout/eyebrow/index/glow/
// northStar). A post has none of that. #171's investigation concluded the BLOCK LAYER is
// reusable and the HOST is not, and this is that host: everything below the block is
// imported, everything about arranging blocks is flat.
//
// WHAT IS REUSED, unchanged: the block forms (via BLOG_BLOCK_REGISTRY, which holds the
// SAME objects the case-study editor uses for the three shared kinds), the field
// primitives, useDraftForm, useItemList's pure array ops, and — for the canvas —
// BlogProse, the very component the public article page renders. The canvas is therefore
// the real renderer, not a studio lookalike.
//
// THE POSTER IS HIDDEN, deliberately. `videoEmbed.poster` is in the schema (#171),
// uploadable (#172) and validated (#173), but BlogProse renders an <iframe> and never
// reads it — three PRs of investment in a field no reader shows. Wiring it is a design
// decision about video presentation that nobody has made, so the blog form hides it
// rather than letting the accretion continue. Scoped, not built.
import { useCallback, useMemo, useRef, useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal } from "./PublishProvider";
import { useReportPending } from "./PublishProvider";
import { moveIn, removeAt, insertAt } from "./useItemList";
import { FieldTabProvider, type FieldTab } from "./blocks/fields";
import {
  BLOG_BLOCK_REGISTRY,
  BLOG_BLOCK_LABELS,
  BLOG_KIND_HAS_STYLE,
  BLOG_PICKER_ORDER,
} from "./blocks/blog-registry";
import type { BlogBlockKind, BlogRawBlock } from "@/lib/blog/blocks-raw";
import BlogProse from "@/components/blog/BlogProse";
import { IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";

type BlogFields = { blocks: readonly BlogRawBlock[] };

const iconBtn =
  "grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3.5";


/** A local two-option toggle. SegmentedToggle is deliberately NOT reused: despite the
 *  name it is a projects-specific control that POSTS a template/category patch on change
 *  ({ slug, patchKey, onSaved }), not a presentational switch. */
function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5 rounded-md bg-cream-200 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded px-2.5 py-1 text-[12px] capitalize transition-colors ${
            value === o ? "bg-cream-50 text-ink-950 shadow-sm" : "text-ink-600 hover:text-ink-950"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function BlogBlocksEditPanel({
  slug,
  blocks: initialBlocks,
}: {
  slug: string;
  blocks: readonly BlogRawBlock[];
}) {
  const { setUnpublished } = usePublishSignal();

  // FLAT ids — one per block. SectionsEditPanel keeps `{ sectionIds, blockIds[][] }` in
  // lockstep with a nested array; there is nothing to nest here, so a reorder is a single
  // moveIn on one list and cannot desynchronise two structures.
  const nextId = useRef(0);
  const mint = () => `b${nextId.current++}`;
  const seedIds = (bs: readonly BlogRawBlock[]) => bs.map(mint);
  const [ids, setIds] = useState<string[]>(() => seedIds(initialBlocks));
  const [picker, setPicker] = useState(false);
  const [tab, setTab] = useState<FieldTab>("content");
  const [view, setView] = useState<"canvas" | "inspector">("canvas");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { values, setField, dirty, saveStatus, saveDraft } = useDraftForm<BlogFields>({
    initial: { blocks: initialBlocks },
    buildCommitted: (v) => ({ blocks: v.blocks }),
    isDirty: (v, b) => JSON.stringify(v.blocks) !== JSON.stringify(b.blocks),
    // The shape #173's save-draft blocks branch expects: { collection, slug, blocks }.
    saveExtras: { collection: "blog", slug },
    buildBody: (committed, extras) => ({ ...extras, blocks: committed.blocks }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  const blocks = values.blocks;

  const setBlocks = useCallback(
    (next: readonly BlogRawBlock[], nextIds: string[]) => {
      setField("blocks", next);
      setIds(nextIds);
    },
    [setField]
  );

  /** Replace one block's value, found by its stable id. */
  const setBlockValue = useCallback(
    (id: string, value: unknown) => {
      const i = ids.indexOf(id);
      if (i === -1) return;
      setField(
        "blocks",
        blocks.map((b, j) => (j === i ? ({ ...b, value } as BlogRawBlock) : b))
      );
    },
    [ids, blocks, setField]
  );

  // STRUCTURAL OPS DO NOT CALL saveDraft(). useDraftForm's saveDraft closes over
  // `values`, so calling it synchronously after setField would post the PRE-UPDATE array
  // — every add, remove and reorder would reach the seam one mutation behind. (The host
  // harness caught exactly that.) SectionsEditPanel has the same constraint and answers
  // it the same way: structural changes mark the panel dirty, and the save happens on the
  // next field blur or via the explicit Save control in the footer.
  function addBlock(kind: BlogBlockKind) {
    const block = {
      discriminant: kind,
      value: BLOG_BLOCK_REGISTRY[kind].empty(),
    } as BlogRawBlock;
    setBlocks(insertAt(blocks as BlogRawBlock[], blocks.length, block), [...ids, mint()]);
    setPicker(false);
  }

  function removeBlock(i: number) {
    setBlocks(removeAt(blocks as BlogRawBlock[], i), removeAt(ids, i));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    if (i + dir < 0 || i + dir >= blocks.length) return;
    // moveIn takes a DIRECTION, not a target index — the same call the block forms use.
    setBlocks(moveIn(blocks as BlogRawBlock[], i, dir), moveIn(ids, i, dir));
  }

  // The canvas renders through the PUBLIC component, so what the author sees is what the
  // article page will render — no studio lookalike to drift.
  const canvas = useMemo(() => <BlogProse blocks={blocks as unknown[]} />, [blocks]);

  return (
    <section className="rounded-xl border border-ink-950/8 bg-cream-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-950/8 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-medium text-ink-950">Post</h2>
          <span className="text-[12px] text-text-subtle">
            {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle
            value={view}
            onChange={setView}
            options={["canvas", "inspector"] as const}
            label="View"
          />
          <span aria-live="polite" className="text-[12px] text-text-subtle">
            {saveStatus === "saving" ? "Saving…" : dirty ? "Unsaved" : "Saved"}
          </span>
        </div>
      </header>

      {view === "canvas" ? (
        <div className="px-4 py-6">
          {blocks.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-text-subtle">
              An empty post. Add a paragraph to start writing.
            </p>
          ) : (
            <div className="mx-auto max-w-[68ch] blog-article">{canvas}</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-4">
          <FieldTabProvider tab={tab}>
            <ViewToggle
              value={tab}
              onChange={setTab}
              options={["content", "style"] as const}
              label="Fields"
            />
            {blocks.map((block, i) => {
              const id = ids[i];
              const kind = block.discriminant as BlogBlockKind;
              const entry = BLOG_BLOCK_REGISTRY[kind];
              // A kind with no Style field renders nothing under Style — the form stays
              // MOUNTED (hidden), so switching tabs never drops a caret or a value.
              const hidden = tab === "style" && !BLOG_KIND_HAS_STYLE[kind];
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              const Form = entry.Form as any;
              return (
                <div
                  key={id}
                  hidden={hidden}
                  onFocusCapture={() => setSelectedId(id)}
                  className={`rounded-lg border p-3 ${
                    selectedId === id ? "border-accent-500/40 bg-accent-500/5" : "border-ink-950/8"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                      {BLOG_BLOCK_LABELS[kind]}
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        className={iconBtn}
                        disabled={i === 0}
                        onClick={() => moveBlock(i, -1)}
                        aria-label={`Move ${BLOG_BLOCK_LABELS[kind]} up`}
                      >
                        <IconChevronUp />
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        disabled={i === blocks.length - 1}
                        onClick={() => moveBlock(i, 1)}
                        aria-label={`Move ${BLOG_BLOCK_LABELS[kind]} down`}
                      >
                        <IconChevronDown />
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => removeBlock(i)}
                        aria-label={`Remove ${BLOG_BLOCK_LABELS[kind]}`}
                      >
                        <IconX />
                      </button>
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Form
                      value={block.value}
                      onChange={(next: unknown) => setBlockValue(id, next)}
                      onBlur={saveDraft}
                      slug={slug}
                      collection="blog"
                    />
                  </div>
                </div>
              );
            })}
          </FieldTabProvider>
        </div>
      )}

      <footer className="relative flex flex-wrap items-center gap-2 border-t border-ink-950/8 px-4 py-3">
        <button
          type="button"
          onClick={() => setPicker((p) => !p)}
          aria-expanded={picker}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-2 text-[13px] text-ink-600 transition-colors hover:border-accent-500/40 hover:bg-cream-100 hover:text-ink-950 [&>svg]:size-3.5"
        >
          <IconPlus /> Add block
        </button>
        <span className="ml-3 text-[12px] text-text-subtle">
          Auto-saves to draft on blur.
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={!dirty || saveStatus === "saving"}
          className="ml-auto rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
        {picker && (
          <div className="absolute bottom-full left-4 z-10 mb-2 w-[220px] rounded-lg border border-ink-950/8 bg-cream-50 p-1.5 shadow-[0_18px_40px_-20px_rgba(60,45,30,0.45)]">
            {/* The picker offers exactly the blog kinds because BLOG_BLOCK_REGISTRY IS the
                curation — no filter, no prop, no fork of the case-study picker. */}
            {BLOG_PICKER_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => addBlock(k)}
                className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-[13px] text-ink-700 transition-colors hover:bg-cream-200 hover:text-ink-950"
              >
                {BLOG_BLOCK_LABELS[k]}
              </button>
            ))}
          </div>
        )}
      </footer>
    </section>
  );
}
