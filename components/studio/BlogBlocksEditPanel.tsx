"use client";

// BS-3c — the blog post editor's body, and since the three-pane relayout, its HOST.
//
// A THIN, FLAT EDITOR: one array of blocks, one list of stable ids, no section shell.
//
// WHY NOT SectionsEditPanel. That panel is bound to the section shape —
// `SectionsFields = { sections: RawSection[] }`, a two-level `Ids = { sectionIds,
// blockIds[][] }` kept in lockstep, a board of section cards, a per-section adaptSections
// canvas, and the SectionShellForm (variant/layout/eyebrow/index/glow/northStar). A post
// has none of that. #171's investigation concluded the BLOCK LAYER is reusable and the HOST
// is not, and this is that host: everything below the block is imported, everything about
// arranging blocks is flat.
//
// WHAT IS REUSED, unchanged: the block forms (via BLOG_BLOCK_REGISTRY, which holds the SAME
// objects the case-study editor uses for the three shared kinds), the field primitives,
// useDraftForm, useItemList's pure array ops, and — for the canvas — BlogProse, the very
// component the public article page renders. The canvas is therefore the real renderer, not
// a studio lookalike.
//
// THE POSTER IS NO LONGER HIDDEN. `videoEmbed.poster` sat in the schema (#171), uploadable
// (#172) and validated (#173) while no reader showed it, so the blog form hid it rather than
// let the accretion continue. BlogProse draws images now, so the field feeds a real reader
// and blog uses the shared form unmodified again — `showPoster` and its export are gone with
// the gap they papered over. The same closure applies to imageBlock, which was deferred for
// exactly this reason and is the reason this panel now offers five kinds.
//
// ---- THE THREE-PANE LAYOUT ------------------------------------------------------------
//
// THE INSPECTOR CARRIES TWO STACKED SECTIONS, Post then the selected block's fields. The
// design contract's inspector holds only post fields, and building it literally would have
// DELETED blog's only block-editing surface. So `postSection` arrives as a prop from
// BlogEditPanel — which keeps its own useDraftForm — and this panel stacks it above its own
// section. Two forms, two save indicators, both labelled. See SaveIndicator.
//
// SELECTION IS THE BLOCK STRIP, NOT THE CANVAS. The mock selects by clicking the prose, and
// that is deliberately not built. The canvas renders through BlogProse at the public
// measure so that what the author sees is what the article ships, and the only two ways to
// click prose both spend that property: wrapping each block in a clickable element changes
// the canvas DOM relative to the article (the editable-only-wrapper failure mode CLAUDE.md
// names), and mapping a click to a block index by counting rendered children derives the
// mapping from BlogProse's output shape — where a `richText` block emits ONE PARAGRAPH PER
// ENTRY, not one element — so a change to that shape breaks selection SILENTLY. #170's
// "reusable wholesale" decaying into #173's unsaveable post is that failure with a
// different subject. The strip costs the canvas nothing, and it puts select, reorder and
// remove in one place on one row.
//
// STRUCTURAL OPS DO NOT CALL saveDraft(). useDraftForm's saveDraft closes over `values`, so
// calling it synchronously after setField would post the PRE-UPDATE array — every add,
// remove and reorder would reach the seam one mutation behind. (#174's host harness caught
// exactly that; a unit test and a DOM diff both missed it.) SectionsEditPanel has the same
// constraint and answers it the same way: structural changes mark the panel dirty, and the
// save happens on the next field blur or via the explicit Save control.
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
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
import { makeDraftSrcRewriter } from "@/lib/studio/draft-image";
import ThreePaneShell from "./ThreePaneShell";
import BlogPostList from "./BlogPostList";
import SaveIndicator from "./SaveIndicator";
import { useMediaMin } from "./useMediaMin";
import { INSPECTOR_FOLD_PX } from "@/lib/studio/three-pane";
import { IconChevronUp, IconChevronDown, IconX, IconPlus, IconArrowUpRight } from "./icons";
import type { BlogCard } from "@/lib/keystatic";

type BlogFields = { blocks: readonly BlogRawBlock[] };

const iconBtn =
  "grid size-6 shrink-0 place-items-center rounded border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3";

/** A local two-option toggle. SegmentedToggle is deliberately NOT reused: despite the name
 *  it is a projects-specific control that POSTS a template/category patch on change
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
  title,
  livePath,
  blocks: initialBlocks,
  draftImages,
  posts,
  postSection,
}: {
  slug: string;
  title: string;
  /** The public article's href, COMPUTED ON THE SERVER and passed down.
   *
   *  Not `blogPath(slug)` called here, and the reason is worth stating because nothing
   *  marks it: `lib/site.ts` imports `node:fs` at module scope, so importing anything from
   *  it into a client component pulls fs into the client bundle and fails the build for the
   *  WHOLE APP, not just this route. It has no "server-only" marker and the failure is a
   *  webpack UnhandledSchemeError far from the import that caused it. Keeping the one
   *  definition of the path on the server and passing the string is the fix that does not
   *  duplicate it. */
  livePath: string;
  blocks: readonly BlogRawBlock[];
  /** Draft-branch image paths. An image uploaded to the draft branch 404s against main
   *  until publish, so the canvas rewrites those srcs through the owner-gated proxy. The
   *  public article does not, which is the ONLY way the two surfaces differ — an attribute
   *  value on the same element, never a different element, so box geometry is identical. */
  draftImages: readonly string[];
  /** Every post, for the list pane. Draft-overlaid, from getStudioData. */
  posts: readonly BlogCard[];
  /** BlogEditPanel's head fields, rendered as the inspector's first section. */
  postSection: ReactNode;
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

  // The inspector pane folds below this width and the view toggle takes over. Read HERE
  // rather than inside the shell because the answer decides which PARENT the single
  // inspector node mounts under, and the shell handing it back up would mean setting parent
  // state during render.
  const inspectorFits = useMediaMin(INSPECTOR_FOLD_PX);

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
  const selectedIndex = selectedId === null ? -1 : ids.indexOf(selectedId);

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

  function addBlock(kind: BlogBlockKind) {
    const block = {
      discriminant: kind,
      value: BLOG_BLOCK_REGISTRY[kind].empty(),
    } as BlogRawBlock;
    const id = mint();
    setBlocks(insertAt(blocks as BlogRawBlock[], blocks.length, block), [...ids, id]);
    // Select what you just added, so the form for it is already open. Appending a block
    // and then having to click it is a step that exists only because the code forgot.
    setSelectedId(id);
    setTab("content");
    setPicker(false);
  }

  function removeBlock(i: number) {
    // Selection must not survive its block. Falling back to the PREVIOUS block rather than
    // to nothing keeps the inspector on the paragraph you were working near, and the empty
    // case is the only one that clears it.
    if (ids[i] === selectedId) {
      const next = ids.length > 1 ? ids[i === 0 ? 1 : i - 1] : null;
      setSelectedId(next);
    }
    setBlocks(removeAt(blocks as BlogRawBlock[], i), removeAt(ids, i));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    if (i + dir < 0 || i + dir >= blocks.length) return;
    // moveIn takes a DIRECTION, not a target index — the same call the block forms use.
    // Selection needs no adjustment: it is keyed by id, and the id moves with its block.
    setBlocks(moveIn(blocks as BlogRawBlock[], i, dir), moveIn(ids, i, dir));
  }

  // The canvas renders through the PUBLIC component, so what the author sees is what the
  // article page will render — no studio lookalike to drift.
  const rewriteSrc = useMemo(() => makeDraftSrcRewriter(draftImages), [draftImages]);
  const prose = useMemo(
    () => <BlogProse blocks={blocks as unknown[]} rewriteSrc={rewriteSrc} />,
    [blocks, rewriteSrc]
  );

  /* ------------------------------------------------------------------ the canvas column */
  // `max-w-[68ch] px-6` MATCHES app/(portfolio)/blog/[slug]/page.tsx EXACTLY, and the px-6
  // is new. The panel has claimed since #174 that the author sees what the article renders;
  // the public article is `max-w-[68ch] px-6` and this was `max-w-[68ch]` with no padding,
  // so the two measures differed by 48px and the claim was false. Gate A1 proves them equal
  // as a NUMBER rather than as matching class strings, because 68ch resolves against each
  // element's own inherited font-size and identical classes on differently-sized ancestors
  // are not identical measures.
  //
  // THE MEASURE NEVER CHANGES WITH THE LAYOUT. The design contract widened it from 620 to
  // 700 when the list collapsed. A measure that moves when you hide a pane is a measure
  // that lies, and it would break the one property the 68ch is here to hold.
  const canvasColumn = (
    <div className="py-10">
      {blocks.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-text-subtle">
          An empty post. Add a paragraph to start writing.
        </p>
      ) : (
        <div className="mx-auto max-w-[68ch] px-6 blog-article">{prose}</div>
      )}
    </div>
  );

  /* --------------------------------------------------------------------- the inspector */
  const selectedBlock = selectedIndex === -1 ? null : blocks[selectedIndex];
  const selectedKind =
    selectedBlock === undefined || selectedBlock === null
      ? null
      : (selectedBlock.discriminant as BlogBlockKind);

  const inspector = (
    <div className="flex flex-col">
      {/* SECTION 1 — the post's own fields, owned by BlogEditPanel's form. */}
      <section>
        <header className="flex items-center justify-between gap-2 border-b border-ink-950/8 px-3 py-2">
          <h2 className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Post</h2>
        </header>
        {postSection}
      </section>

      {/* SECTION 2 — the block strip and the selected block's fields. */}
      <section className="border-t border-ink-950/8">
        <header className="flex items-center justify-between gap-2 border-b border-ink-950/8 px-3 py-2">
          <h2 className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
            Body · {blocks.length}
          </h2>
          <SaveIndicator label="Body" saving={saveStatus === "saving"} dirty={dirty} />
        </header>

        {/* THE BLOCK STRIP. The chip shows the KIND LABEL and the position, never a body
            excerpt — four paragraphs would otherwise read as four near-identical chips,
            and the registry's own `label()` is exactly that excerpt, so it is deliberately
            not called here. Kind plus position is unambiguous. */}
        {blocks.length === 0 ? (
          <p className="px-3 py-4 text-[12px] text-text-subtle">
            No blocks yet. Add one below.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {blocks.map((block, i) => {
              const id = ids[i];
              const kind = block.discriminant as BlogBlockKind;
              const isSelected = id === selectedId;
              return (
                <li
                  key={id}
                  className={`flex items-center gap-1 border-b border-ink-950/8 px-2 py-1.5 ${
                    isSelected ? "bg-accent-500/10" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(id);
                      setTab("content");
                    }}
                    aria-current={isSelected ? "true" : undefined}
                    // FOCUS IS A RING, SELECTION IS A FILL, and they must stay visibly
                    // different — the strip is the only way to select a block, so a
                    // keyboard user who cannot tell "focused" from "selected" cannot tell
                    // whether pressing Enter would change anything. #177 drew the same
                    // distinction for the sidebar's hover against its selected pill. The
                    // ring is ink rather than accent so it reads on the accent fill too.
                    className={`min-w-0 flex-1 rounded px-1.5 py-1 text-left text-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink-950 ${
                      isSelected ? "text-ink-950" : "text-ink-600 hover:text-ink-950"
                    }`}
                  >
                    <span className="block truncate">
                      <span className="tabular-nums text-text-subtle">{i + 1}.</span>{" "}
                      {BLOG_BLOCK_LABELS[kind]}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    disabled={i === 0}
                    onClick={() => moveBlock(i, -1)}
                    aria-label={`Move ${BLOG_BLOCK_LABELS[kind]} ${i + 1} up`}
                  >
                    <IconChevronUp />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    disabled={i === blocks.length - 1}
                    onClick={() => moveBlock(i, 1)}
                    aria-label={`Move ${BLOG_BLOCK_LABELS[kind]} ${i + 1} down`}
                  >
                    <IconChevronDown />
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => removeBlock(i)}
                    aria-label={`Remove ${BLOG_BLOCK_LABELS[kind]} ${i + 1}`}
                  >
                    <IconX />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Add is APPEND-AT-END. The mock's per-gap inserter is a mock-only affordance and
            is not built; reorder moves a block to where you want it. */}
        <div className="relative flex items-center gap-2 border-b border-ink-950/8 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setPicker((p) => !p)}
            aria-expanded={picker}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-2.5 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:bg-cream-50 hover:text-ink-950 [&>svg]:size-3"
          >
            <IconPlus /> Add block
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || saveStatus === "saving"}
            className="ml-auto rounded-md bg-accent-500 px-3 py-1.5 text-[12px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </button>
          {picker && (
            // The picker offers exactly the blog kinds because BLOG_BLOCK_REGISTRY IS the
            // curation — no filter, no prop, no fork of the case-study picker.
            <div className="absolute bottom-full left-3 z-10 mb-1.5 w-[190px] rounded-lg border border-ink-950/8 bg-cream-50 p-1.5 shadow-[0_18px_40px_-20px_rgba(60,45,30,0.45)]">
              {BLOG_PICKER_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => addBlock(k)}
                  className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-ink-700 transition-colors hover:bg-cream-200 hover:text-ink-950"
                >
                  {BLOG_BLOCK_LABELS[k]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* THE SELECTED BLOCK'S FIELDS. One form, not all of them. The previous full-width
            editor stacked every block's form and kept them all mounted so a tab switch
            never dropped a caret; with one form at a time that tradeoff is gone, and
            changing selection blurs the active field first, which is what commits it. */}
        {selectedKind === null || selectedBlock === null || selectedBlock === undefined ? (
          <p className="px-3 py-5 text-[12px] leading-relaxed text-text-subtle">
            Select a block above to edit it.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              {/* The kind label is PERSISTENT here, not a hover overlay on the canvas.
                  The overlay is mock-only. */}
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                {BLOG_BLOCK_LABELS[selectedKind]} {selectedIndex + 1}
              </span>
              {/* The Style tab appears only for a kind that HAS style fields. BLOG_KIND_HAS_STYLE
                  is a mapped type rather than a Set, so a new kind missing from it fails
                  compilation instead of silently never showing its Style tab. */}
              {BLOG_KIND_HAS_STYLE[selectedKind] ? (
                <ViewToggle
                  value={tab}
                  onChange={setTab}
                  options={["content", "style"] as const}
                  label="Fields"
                />
              ) : null}
            </div>
            <FieldTabProvider tab={BLOG_KIND_HAS_STYLE[selectedKind] ? tab : "content"}>
              {(() => {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                const Form = BLOG_BLOCK_REGISTRY[selectedKind].Form as any;
                return (
                  <Form
                    // Keyed by the block's stable id so switching selection remounts the
                    // form rather than feeding one instance a different block's value.
                    key={selectedId}
                    value={selectedBlock.value}
                    onChange={(next: unknown) => setBlockValue(selectedId as string, next)}
                    onBlur={saveDraft}
                    slug={slug}
                    collection="blog"
                  />
                );
              })()}
            </FieldTabProvider>
          </div>
        )}
      </section>
    </div>
  );

  /* -------------------------------------------------------------------------- the shell */
  return (
    <ThreePaneShell
      list={<BlogPostList posts={posts} currentSlug={slug} />}
      canvasBar={
        <>
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-950">{title}</span>
          <a
            href={livePath}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-1.5 rounded-md border border-ink-950/8 px-2.5 py-1 text-[11.5px] text-ink-600 transition-colors hover:border-accent-500 hover:text-accent-500 sm:inline-flex [&>svg]:size-3"
          >
            View live <IconArrowUpRight />
          </a>
          {/* The toggle exists ONLY below the fold, where the inspector pane is gone and
              this is the route to those fields. Above the fold both are on screen at once
              and a toggle between them would be a control with nothing to do. */}
          {!inspectorFits ? (
            <ViewToggle
              value={view}
              onChange={setView}
              options={["canvas", "inspector"] as const}
              label="View"
            />
          ) : null}
        </>
      }
      canvas={!inspectorFits && view === "inspector" ? inspector : canvasColumn}
      // NULL, not a hidden copy. Below the fold the SAME node above is rendered inside the
      // canvas instead. Two copies would be two field trees posting through one onChange,
      // with colliding ids and two carets.
      inspector={inspectorFits ? inspector : null}
    />
  );
}
