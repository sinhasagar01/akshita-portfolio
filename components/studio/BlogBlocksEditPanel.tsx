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
// SELECTION IS DUAL-SOURCE — THE STRIP AND THE CANVAS. #178 shipped the strip alone, and
// this comment said clicking the prose was "deliberately not built". #187 REVERSED THAT and
// built it (`onCanvasFocus` below sets `selectedId` from whatever gains focus), but left this
// paragraph standing, so the file carried #178's rationale and #187's implementation 350
// lines apart. The reasoning is rewritten here rather than deleted, for the same reason
// BlogIndex.tsx keeps its reversed rationale: a reversed decision whose reasoning is deleted
// leaves two contradictory records and nothing saying which won.
//
// WHY #178 WAS RIGHT TO REFUSE THE TWO MECHANISMS IT LOOKED AT. Both spent the
// canvas-to-article fidelity property. Wrapping each block in a clickable element changes the
// canvas DOM relative to the article (the editable-only-wrapper failure mode CLAUDE.md
// names), and mapping a click to a block index by counting rendered children derives the
// mapping from BlogProse's output shape — where a `richText` block emits ONE PARAGRAPH PER
// ENTRY, not one element — so a change to that shape breaks selection SILENTLY. #170's
// "reusable wholesale" decaying into #173's unsaveable post is that failure with a
// different subject.
//
// WHAT #178 DID NOT EXAMINE, AND WHY IT COSTS NOTHING. A third mechanism: THE RENDERER EMITS
// ITS OWN INDICES. Under `editable`, BlogProse writes `data-edit-block-index` onto elements
// it already emits, so the mapping is produced by the same expression that produces the
// content and cannot drift. Nothing is wrapped and nothing is counted. Measured, not argued —
// every box delta zero at four decimal places.
//
// THE STRIP STAYS, and not merely out of habit: a caption-less imageBlock or videoEmbed emits
// no editable element at all, so without the strip such a block could be added and never
// selected again. It also puts select, reorder and remove in one place on one row.
//
// STRUCTURAL OPS DO NOT CALL saveDraft(). useDraftForm's saveDraft closes over `values`, so
// calling it synchronously after setField would post the PRE-UPDATE array — every add,
// remove and reorder would reach the seam one mutation behind. (#174's host harness caught
// exactly that; a unit test and a DOM diff both missed it.) SectionsEditPanel has the same
// constraint and answers it the same way: structural changes mark the panel dirty, and the
// save happens on the next field blur or via the explicit Save control.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { moveIn, removeAt, insertAt } from "./useItemList";
import { splitParagraph, mergeParagraph } from "@/lib/studio/paragraph-edits";
import { paragraphCaret, placeCaret } from "@/lib/studio/inline-caret";
import { richToMarkers } from "@/lib/studio/rich-markers";
import { isSafeHref } from "@/lib/case-studies/adapter";
import { FieldTabProvider, type FieldTab, labelCls } from "./blocks/fields";
import {
  BLOG_BLOCK_REGISTRY,
  BLOG_BLOCK_LABELS,
  BLOG_KIND_HAS_STYLE,
  BLOG_PICKER_ORDER,
} from "./blocks/blog-registry";
import type { BlogBlockKind, BlogRawBlock } from "@/lib/blog/blocks-raw";
import BlogProse from "@/components/blog/BlogProse";
import { makeDraftSrcRewriter } from "@/lib/studio/draft-image";
import { createPreviewMap, type PreviewMap, type PreviewUpload } from "@/lib/studio/preview-map";
import { resolveHeroSrc } from "@/lib/blog/hero-fill";
import { readingTimeMinutes } from "@/lib/blog/select";
import BlogHero from "@/components/blog/BlogHero";
import BlogArticleHead from "@/components/blog/BlogArticleHead";
import ThreePaneShell from "./ThreePaneShell";
import BlogPostList from "./BlogPostList";
import SaveIndicator from "./SaveIndicator";
import BoldToolbar from "./BoldToolbar";
import { usePageWidthMin } from "./usePageWidthMin";
import { FIT_THRESHOLD_PX, INSPECTOR_FOLD_PX } from "@/lib/studio/three-pane";
import { IconChevronUp, IconChevronDown, IconX, IconPlus, IconArrowUpRight } from "./icons";
import type { BlogCard } from "@/lib/keystatic";

type BlogFields = { blocks: readonly BlogRawBlock[] };

const iconBtn =
  "grid size-6 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3";

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
    <div role="group" aria-label={label} className="flex items-center gap-0.5 rounded-[var(--studio-radius-control,4px)] bg-cream-200 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] font-semibold capitalize transition-colors ${
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
  heroImage,
  heroPreviewUrl,
  headDek,
  headDate,
  headTopic,
  posts,
  postSection,
  postStatus,
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
  /** The post's committed hero path, or null. LIFTED out of HeroImageField so the canvas can
   *  draw it — see BlogEditPanel. */
  heroImage: string | null;
  /** A session-only object URL for a hero uploaded THIS session. It takes precedence over the
   *  committed path because `draftImages` above is a page-load snapshot and cannot contain a
   *  file uploaded after it was taken. See resolveHeroSrc. */
  heroPreviewUrl: string | null;
  /** The head fields, LIVE from BlogEditPanel's useDraftForm rather than from the server, so
   *  the canvas head tracks the inspector as it is typed. `title` (a separate prop) IS live
   *  too since #216 — BlogEditPanel passes `values.title.trim() || slug`, so it tracks the
   *  inspector and falls back to the slug when blank, exactly as the public read path does. */
  headDek: string;
  headDate: string;
  headTopic: string;
  /** Every post, for the list pane. Draft-overlaid, from getStudioData. */
  posts: readonly BlogCard[];
  /** BlogEditPanel's head fields, rendered as the inspector's first section. */
  postSection: ReactNode;
  /** The Post form's SaveIndicator, rendered INSIDE the ink band beside the heading — the
   *  contract's `.sechead` is space-between with the status on the right. It arrives as a node
   *  because the form that owns its state is BlogEditPanel, not this panel. */
  postStatus?: ReactNode;
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

  // ---- THE REBUILD CYCLE, AND IT IS REQUIRED WITHOUT ANY TOOLBAR ------------------------
  //
  // A split, a merge or a multi-line paste CHANGES HOW MANY <p> ELEMENTS A BLOCK HAS while
  // the author's typed DOM is still sitting in that subtree. React's tree and the
  // contentEditable DOM then disagree about how many paragraphs exist, and reconciling
  // against a subtree React does not own duplicates or drops text.
  //
  // The case-study panel bumps its epoch "for the same reason a bold does", and that
  // reasoning is what was checked here: the plan assumed deferring the bold toolbar removed
  // this machinery, and it does not. Bold makes the tree untrusted because execCommand
  // mutates it; a structural paragraph edit makes it untrusted because the element COUNT
  // changes. Different cause, identical requirement.
  //
  // What deferring the toolbar DOES remove is `boldDirty`, execCommand, and the
  // bold-then-unbold cleanup path. Not this.
  const [renderEpoch, setRenderEpoch] = useState(0);
  /** The element to re-focus once the rebuilt tree is on screen. */
  const refocusAfterRebuild = useRef<string | null>(null);
  /** ...and where the caret lands, so a split or merge reads as ONE keystroke rather than
   *  as a jump. */
  const caretAfterRebuild = useRef<number | null>(null);
  /** ...and the block the strip should still be pointing at. */
  const reselectAfterRebuild = useRef<string | null>(null);
  /** Set by a FIELD blur only. Structural ops never set it, which is how #174's rule
   *  survives: a split, a merge or a paste marks the panel dirty and waits. */
  const pendingSave = useRef(false);

  /** Where the rich-text toolbar floats, or null when nothing rich has focus. */
  const [boldAt, setBoldAt] = useState<{ top: number; left: number } | null>(null);
  /** THE TREE IS NO LONGER REACT'S. execCommand edits the contentEditable DOM directly, so
   *  after a bold, italic or link the subtree and React's vdom have diverged — reconciling
   *  against it duplicates or drops text. The writeback rebuilds from state on the way out.
   *
   *  Deliberately at the WRITEBACK, not at the command: remounting mid-edit would drop the
   *  selection, breaking select -> bold -> unbold. At the writeback the field is already
   *  losing focus, so the remount costs nothing. */
  const boldDirty = useRef(false);


  // Runs AFTER the rebuild paints, which is the whole point: the node to focus does not
  // exist until then. Focusing from the keydown handler would target the node the rebuild
  // is about to discard.
  useEffect(() => {
    const sel = refocusAfterRebuild.current;
    const caret = caretAfterRebuild.current;
    const reselect = reselectAfterRebuild.current;
    refocusAfterRebuild.current = null;
    caretAfterRebuild.current = null;
    reselectAfterRebuild.current = null;
    if (reselect) setSelectedId(reselect);
    if (!sel) return;
    const el = document.querySelector<HTMLElement>(sel);
    el?.focus();
    if (el && caret !== null) placeCaret(el, caret);
  }, [renderEpoch]);

  // The inspector pane folds below this width and the view toggle takes over. Read HERE
  // rather than inside the shell because the answer decides which PARENT the single
  // inspector node mounts under, and the shell handing it back up would mean setting parent
  // state during render.
  const inspectorFits = usePageWidthMin(INSPECTOR_FOLD_PX);

  // THIS PANEL HOLDS THE SESSION PREVIEWS FOR ITS POST, and holds nothing else's.
  //
  // A REF, NOT STATE, because a revocable url is a side effect on a resource rather than
  // something render reads — and because `adopt` must land SYNCHRONOUSLY beside the block
  // edit that caused it, so the canvas never paints one frame of the 404ing committed path
  // first. That was #190's finding for the hero and it holds here unchanged.
  //
  // ITS LIFETIME IS ONE POST, MEASURED RATHER THAN ASSUMED. Switching posts in the list rail
  // is a client-side App Router transition, so the obvious guess is that this component is
  // reused and the map outlives the post. It is not: React drops the subtree and builds a new
  // one (`view` resets to "canvas", and the canvas DOM node is a different element that
  // carries none of the old one's expandos). So this cleanup fires on every post switch and
  // the map never carries one post's entries into another.
  const previewsRef = useRef<PreviewMap | null>(null);
  previewsRef.current ??= createPreviewMap();
  const previews = previewsRef.current;
  // Unmount only. Under StrictMode's dev double-invoke this runs once at mount, when the map
  // is empty and there is nothing to free.
  useEffect(() => () => previews.releaseAll(), [previews]);

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
  // Fires one render AFTER the value landed, so `saveDraft` closes over the NEW blocks.
  // Keyed on the blocks themselves rather than on saveDraft, which is a fresh function
  // every render and would loop.
  //
  // CLEARING THE FLAG BEFORE THE CALL IS SAFE, AND IT IS `useDraftForm` THAT MAKES IT SAFE.
  // It did not used to be. `saveDraft` returned silently when a save was already in flight,
  // so a dropped call left `pendingSave` already false and NOTHING recorded that a save was
  // owed — the canvas lost more than the inspector did, because the inspector at least had a
  // next blur coming. `useDraftForm.saveDraft` now records the owe itself and fires it when
  // the in-flight save settles, so the ordering here no longer decides anything.
  //
  // DO NOT ADD A SECOND GUARD HERE. Two mechanisms for one problem is the shape this project
  // keeps removing, and a guard that cannot fire is a comment describing a defence that is
  // not defending. If the coalescing in `useDraftForm` is ever removed, THAT is the thing to
  // restore — not a belt here.
  useEffect(() => {
    if (!pendingSave.current) return;
    pendingSave.current = false;
    void saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.blocks]);

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

  /* ------------------------------------------------------ the inline canvas edit surface */

  /** Set one field of a block value by the SHALLOW paths BlogProse emits: `text`,
   *  `caption`, or `paragraphs.N`. Deliberately not a generic deep-set — three shapes is
   *  not enough to justify one, and a generic setter would accept paths the renderer never
   *  emits. */
  const setByPath = useCallback(
    (value: Record<string, unknown>, path: string, next: string): Record<string, unknown> => {
      const m = /^paragraphs\.(\d+)$/.exec(path);
      if (m) {
        const list = (Array.isArray(value.paragraphs) ? value.paragraphs : []).map(String);
        const i = Number(m[1]);
        if (i < 0 || i >= list.length) return value;
        return { ...value, paragraphs: list.map((p, j) => (j === i ? next : p)) };
      }
      return { ...value, [path]: next };
    },
    []
  );

  const readByPath = (value: Record<string, unknown>, path: string): string => {
    const m = /^paragraphs\.(\d+)$/.exec(path);
    if (m) {
      const list = Array.isArray(value.paragraphs) ? value.paragraphs : [];
      return String(list[Number(m[1])] ?? "");
    }
    return typeof value[path] === "string" ? (value[path] as string) : "";
  };

  /** DELEGATED, one handler on the canvas wrapper rather than a prop per element — the
   *  editable elements are emitted by BlogProse, which the panel does not own. */
  const onCanvasBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const ds = t?.dataset;
    if (!ds?.editValuePath || ds.editBlockIndex === undefined) return;
    const i = Number(ds.editBlockIndex);
    const block = blocks[i];
    if (!block) return;

    // A RICH field renders its `**bold**` as real <b>, so innerText would hand back the
    // words with every marker silently stripped — including markers that were already in
    // the file before anyone edited anything. This is why richToMarkers is in scope even
    // though the bold TOOLBAR is not: authoring bold inline is deferred, reading the bold
    // that already exists is not optional.
    const isRich = ds.editRich !== undefined;
    const next = isRich ? richToMarkers(t, isSafeHref) : (t.innerText ?? "");

    // A COMMAND RAN IN THIS FIELD, so its DOM is no longer React's — rebuild from state on
    // the way out. BEFORE the no-op guard below, because bold-then-unbold leaves the VALUE
    // unchanged while still leaving execCommand's node behind, and that path must clean up
    // too. Focus is restored on the other side when it is heading somewhere addressable.
    if (isRich && boldDirty.current) {
      boldDirty.current = false;
      const to = e.relatedTarget as HTMLElement | null;
      const tds = to?.dataset;
      refocusAfterRebuild.current =
        tds?.editBlockIndex !== undefined && tds?.editValuePath
          ? `[data-edit-block-index="${tds.editBlockIndex}"][data-edit-value-path="${tds.editValuePath}"]`
          : null;
      setRenderEpoch((n) => n + 1);
    }

    const value = (block.value ?? {}) as Record<string, unknown>;
    // NO-OP SKIP. A focus-then-blur with no typing must not dirty the draft — otherwise
    // merely reading a post marks it changed, and every post anyone clicked into would
    // publish as modified. It also means a rich field whose markers round-trip unchanged
    // is silent, which is the assertion that catches an innerText regression.
    if (readByPath(value, ds.editValuePath) === next) return;
    setBlockValue(ids[i], setByPath(value, ds.editValuePath, next));
    // SAVE ON THE NEXT RENDER, NEVER HERE. `saveDraft` closes over `values`, so calling it
    // in this handler would post the array as it was BEFORE the line above — #174's exact
    // defect, which a unit test and a DOM diff both missed and only a request count caught.
    // The inspector's fields get away with `onBlur={saveDraft}` because their onChange fired
    // on an earlier render; an inline edit has no earlier render to rely on.
    pendingSave.current = true;
  };

  /** Focus inside the canvas selects the block, so the inspector always describes what is
   *  being edited. The strip's chips set the same state — DUAL-SOURCE selection over one
   *  piece of state, not two that can disagree. */
  const onCanvasFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const ds = (e.target as HTMLElement)?.dataset;
    if (ds?.editBlockIndex === undefined) return;
    const id = ids[Number(ds.editBlockIndex)];
    if (id && id !== selectedId) setSelectedId(id);
  };

  /** Commit a new paragraphs array and queue the focus + caret restoration. STRUCTURAL, so
   *  it does NOT call saveDraft — #174's rule, because saveDraft closes over `values` and
   *  would post the pre-update array. The panel is dirty and the save rides the next blur
   *  or the explicit Save control. */
  const commitParagraphs = (
    blockIndex: number,
    list: string[],
    focusIndex: number,
    caret: number
  ) => {
    const block = blocks[blockIndex];
    if (!block) return;
    setBlockValue(ids[blockIndex], { ...(block.value as Record<string, unknown>), paragraphs: list });
    refocusAfterRebuild.current =
      `[data-edit-block-index="${blockIndex}"][data-edit-value-path="paragraphs.${focusIndex}"]`;
    caretAfterRebuild.current = caret;
    reselectAfterRebuild.current = ids[blockIndex] ?? null;
    setRenderEpoch((n) => n + 1);
  };

  const paragraphsOf = (blockIndex: number): string[] => {
    const v = (blocks[blockIndex]?.value ?? {}) as Record<string, unknown>;
    return (Array.isArray(v.paragraphs) ? v.paragraphs : []).map(String);
  };

  const serialize = (d: Parameters<typeof richToMarkers>[0]) => richToMarkers(d, isSafeHref);

  /** Enter and Backspace are the two keys that change how MANY paragraphs a block has.
   *  Left to the browser, Enter puts a <br> or a <div> INSIDE one array item — which looks
   *  right on the canvas and is wrong on disk, one <p> with a line break where the file
   *  should hold two entries. */
  const onCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== "Backspace") return;
    if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    const at = paragraphCaret(e.target as HTMLElement, serialize);
    if (!at) return;
    if (e.key === "Enter") {
      e.preventDefault();
      const list = paragraphsOf(at.blockIndex);
      commitParagraphs(at.blockIndex, splitParagraph(list, at.index, at.before, at.after), at.index + 1, 0);
      return;
    }
    // Backspace merges ONLY from the very start of a paragraph that has one above it.
    // Anywhere else it is an ordinary character delete.
    if (at.atStart && at.index > 0) {
      e.preventDefault();
      const list = paragraphsOf(at.blockIndex);
      const { paragraphs: nextList, caret } = mergeParagraph(list, at.index);
      commitParagraphs(at.blockIndex, nextList, at.index - 1, caret);
    }
  };

  /** MULTI-LINE PASTE — net-new, and net-new to this repo: no paste handler existed
   *  anywhere, so the case-study canvas has the same gap and keeps it for now.
   *
   *  Blog is THE paste surface. People draft elsewhere and paste in, and the browser
   *  default collapses a two-paragraph paste into one array item with a <br> in it — the
   *  post then renders as one run-on paragraph, silently, in the most common workflow
   *  there is. Splitting on blank-line-or-newline and routing through the same
   *  splitParagraph the Enter key uses keeps one definition of what a paragraph break is. */
  const onCanvasPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const at = paragraphCaret(e.target as HTMLElement, serialize);
    if (!at) return;
    const raw = e.clipboardData?.getData("text/plain") ?? "";
    const parts = raw.split(/\r?\n\s*\r?\n|\r?\n/).map((x) => x.trim()).filter((x) => x !== "");
    // One line (or none) is ordinary typing — let the browser insert it.
    if (parts.length < 2) return;
    e.preventDefault();
    const list = paragraphsOf(at.blockIndex);
    // The caret's own halves bracket the paste, so text either side of the cursor survives.
    const merged = [at.before + parts[0], ...parts.slice(1, -1), parts[parts.length - 1] + at.after];
    const next = [...list.slice(0, at.index), ...merged, ...list.slice(at.index + 1)];
    const lastIndex = at.index + merged.length - 1;
    commitParagraphs(at.blockIndex, next, lastIndex, parts[parts.length - 1].length);
  };

  // The canvas renders the article's own components at the article's own measure, so what the
  // author sees is what the article page will render — no studio lookalike to drift.
  //
  // THE SCOPE IS THE HEAD, THE HERO AND THE BODY, not the whole article. The back link and
  // the love block are not drawn here — both are navigation or interaction rather than
  // content — and that is a composition choice rather than a fidelity gap. What the canvas
  // DOES draw, it draws at the public measure, proven as a number and not as matching class
  // strings. The head is preview only; see BlogArticleHead for why.
  // THE SESSION PREVIEW GOES AHEAD OF THE SNAPSHOT, and the order is the whole fix.
  //
  // `draftImages` is taken server-side at page load, so it CANNOT contain a path uploaded
  // after it — the rewriter would leave that path alone and the plain path 404s against main
  // until publish. The map is the only thing that can resolve it. Behind the map, the
  // snapshot still handles every image uploaded in an EARLIER session, and an image already
  // on main falls through both and keeps its static path.
  //
  // This is the same precedence resolveHeroSrc has always used for the hero, one line below.
  //
  // A STABLE IDENTITY IS CORRECT HERE even though the map mutates. The map is read at call
  // time, not captured, and every adoption happens in the same handler as a `blocks` edit —
  // so `prose` below recomputes on `blocks` and the fresh call sees the new entry. Adding the
  // map to these deps would only make the function identity churn for no render that needs it.
  const rewriteSrc = useMemo(() => {
    const draft = makeDraftSrcRewriter(draftImages);
    return (src: string) => previews.get(src) ?? (draft ? draft(src) : src);
  }, [draftImages, previews]);
  const heroSrc = resolveHeroSrc({ heroImage, previewUrl: heroPreviewUrl, rewriteSrc });
  // KEYED BY renderEpoch. A structural paragraph edit discards the subtree the author has
  // been typing into and builds a fresh one from state, so React owns the DOM again. The
  // post-rebuild effect above puts focus and the caret back.
  const prose = useMemo(
    () => <BlogProse key={renderEpoch} blocks={blocks as unknown[]} rewriteSrc={rewriteSrc} editable />,
    [blocks, rewriteSrc, renderEpoch]
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
    // The edit handlers are DELEGATED here rather than passed per element: BlogProse emits
    // the editable elements and the panel does not own them. `onFocus`/`onBlur` are the
    // React bubbling forms of focusin/focusout, so they see events from the whole subtree.
    <div
      className="py-10"
      onFocus={onCanvasFocus}
      onBlur={onCanvasBlur}
      onKeyDown={onCanvasKeyDown}
      onPaste={onCanvasPaste}
      // Position the toolbar above whichever RICH field has focus. getBoundingClientRect is
      // post-transform, which is what `position: fixed` needs.
      onFocusCapture={(e) => {
        const el = (e.target as HTMLElement).closest?.("[data-edit-rich]") as HTMLElement | null;
        if (!el) return setBoldAt(null);
        const r = el.getBoundingClientRect();
        setBoldAt({ top: Math.max(8, r.top - 34), left: r.left });
      }}
      // Hide it when focus leaves a rich field for anything that is not another rich field
      // or the toolbar itself. onFocusCapture alone cannot do this: it only fires when focus
      // ENTERS the pane, so clicking empty chrome would leave the toolbar floating over
      // nothing. focusout carries relatedTarget and fires BEFORE the matching focusin, so
      // rich-to-rich is safe. THE TOOLBAR COUNTS AS THE EDIT SURFACE — its link popover has
      // a real text input, so opening it moves focus out of the field, and hiding at that
      // moment would close the popover the author just opened.
      onBlurCapture={(e) => {
        const to = e.relatedTarget as HTMLElement | null;
        if (!to?.closest?.("[data-edit-rich], [data-rich-toolbar]")) setBoldAt(null);
      }}
    >
      {/* THE COLUMN IS HOISTED ABOVE THE EMPTY-POST BRANCH, not just the hero, and the
          reason is margin collapsing rather than tidiness.
          On the article the <figure> and <BlogProse> are SIBLINGS inside one <main>, and the
          44px gap between the hero and the first paragraph is the figure's own bottom margin
          resolving against that sibling. Rendering the hero in its own wrapper above this
          branch would put a boundary between them that the article does not have, changing
          the gap — and it would have been silent, because the figure's OUTER box is held by
          `aspect-[16/9]` and would still measure the same.
          The hero must also survive `blocks.length === 0`: a post with a hero and no blocks
          is not hypothetical, it is the state every new post passes through.
          The empty-post message now sits inside the 68ch column, and MEASURED rather than
          assumed: its box is unchanged at 599.5234px wide (the unlayered `p { max-width: 68ch }`
          caps it, not the column) and it still renders on ONE line. It was never pane-centred
          — that same cap left it 100.7383px left of centre — and moving it inside the column
          brings it 51.5313px CLOSER, to -49.207px. So the change is small and in the right
          direction, which is worth stating because the obvious guess is the opposite.
          The alternative was duplicating the column class string — the exact string A1 pins —
          across two branches, which is a drift risk for no gain. */}
      <div className="mx-auto max-w-[68ch] px-6 blog-article">
        {/* THE HEAD IS PREVIEW ONLY — see BlogArticleHead for why none of it is editable.
            The BACK LINK is deliberately not rendered: it is navigation rather than content,
            and in the canvas it would be a live link out of /studio to the public index. The
            canvas already omits the love block and the reading vessel on the same grounds.
            READING TIME IS RECOMPUTED HERE, not passed in. The article computes it from the
            blocks at build time, so a canvas showing a server-supplied number would drift
            from the article the moment the author added a paragraph. readingTimeMinutes is
            dependency-free, so the canvas can run the SAME function on the CURRENT blocks. */}
        <BlogArticleHead
          date={headDate}
          readingTime={readingTimeMinutes(blocks)}
          topic={headTopic}
          title={title}
          dek={headDek}
          canvas
        />
        <BlogHero src={heroSrc} canvas />
        {blocks.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-text-subtle">
            An empty post. Add a paragraph to start writing.
          </p>
        ) : (
          prose
        )}
      </div>
      {/* `position: fixed`, so it sits outside the measured column and cannot affect it.
          Rendered inside the canvas wrapper only so the blur capture above treats it as part
          of the same edit surface. */}
      <BoldToolbar at={boldAt} onCommand={() => { boldDirty.current = true; }} />
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
        {/* THE INK BAND. A filled bar rather than a serif whisper, which is the single largest
            gain in perceived structure and, on ink chrome, anchors the inspector to the
            sidebar. Foregrounds come from the EXISTING scale PR 1 established — cream-50 /
            ink-200 / ink-400 on ink-950 — so this adds no token.

            THE BAND STOPS AT THE HEADER, and that boundary is load-bearing. The block strip
            below is still cream, which is why the strip's `focus-visible:ring-ink-950` is
            untouched: that ring is ink ON PURPOSE so it reads against the accent SELECTION
            fill, and it is not on this band. If the strip is ever given an ink treatment, the
            ring goes with it — at 1:1 it would be invisible, and a focus ring fails silently
            because nothing looks wrong until someone tabs. */}
        <header className="flex items-center justify-between gap-2 bg-ink-950 px-3 py-2">
          {/* `sechead` carries family, weight, size, tracking and case together — see globals.css.
              The utilities that used to be here (font-bold, uppercase, tracking-eyebrow) WERE DEAD:
              the unlayered `h1, h2` reset outranks @layer utilities, so this band drew Fraunces 400
              at -0.33em from #205 until the fidelity pass measured it. */}
          <h2 className="sechead text-cream-50">Post</h2>
          {postStatus}
        </header>
        {postSection}
      </section>

      {/* SECTION 2 — the block strip and the selected block's fields. */}
      <section className="border-t border-ink-950/12">
        {/* The second band. Its SaveIndicator sits ON the ink, so the indicator carries its own
            on-ink colour — see SaveIndicator, which now takes the ground it is drawn on rather
            than assuming cream. */}
        <header className="flex items-center justify-between gap-2 bg-ink-950 px-3 py-2">
          <h2 className="sechead text-cream-50">Body · {blocks.length}</h2>
          <SaveIndicator label="Body" saving={saveStatus === "saving"} dirty={dirty} onInk />
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
                  // The studio's one selection language — cream fill plus a 3px accent left
                  // bar. This strip sits on the inspector's cream-100, so GROUND + 1 STEP is
                  // cream-200. See ListDetailLayout for why the rule travels and the value
                  // does not.
                  //
                  // `border-l-[3px]` in the base with `pl-[5px]` absorbing it: 3 + 5 matches
                  // the old 0 + 8, so selecting a block never reflows the strip.
                  //
                  // THE ACCENT TINT IS GONE AND THE FOCUS RING IS UNTOUCHED. The button's ring
                  // is ink BECAUSE it had to read against an accent fill; on cream-200 it reads
                  // at least as well, and focus-versus-selection is the property that keeps a
                  // keyboard user able to tell whether Enter would change anything.
                  // `border-b-ink-950/12`, NOT the `border-ink-950/12` shorthand — hazard 26.
                  // The shorthand colours all four sides, so it wrote the LEFT edge too and raced
                  // the accent bar's `border-l-accent-500` there; equal specificity means the
                  // generated sheet's order decides the winner, a Tailwind-version coin flip that
                  // renders accent today. Colouring only the bottom leaves the left to the bar.
                  // `studio-border-race` pins this; the render is unchanged.
                  className={`flex items-center gap-1 border-b border-b-ink-950/12 border-l-[3px] py-1.5 pl-[5px] pr-2 ${
                    isSelected ? "border-l-accent-500 bg-cream-200" : "border-l-transparent"
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
                    className={`min-w-0 flex-1 rounded-[var(--studio-radius-control,4px)] px-1.5 py-1 text-left text-[12px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink-950 ${
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
        <div className="relative flex items-center gap-2 border-b border-ink-950/12 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setPicker((p) => !p)}
            aria-expanded={picker}
            className="inline-flex items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-2.5 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:bg-cream-50 hover:text-ink-950 [&>svg]:size-3"
          >
            <IconPlus /> Add block
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || saveStatus === "saving"}
            className="ml-auto rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-3 py-1.5 text-[12px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </button>
          {picker && (
            // The picker offers exactly the blog kinds because BLOG_BLOCK_REGISTRY IS the
            // curation — no filter, no prop, no fork of the case-study picker.
            <div className="absolute bottom-full left-3 z-10 mb-1.5 w-[190px] rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-50 p-1.5 shadow-[0_18px_40px_-20px_rgba(60,45,30,0.45)]">
              {BLOG_PICKER_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => addBlock(k)}
                  className="flex w-full items-center rounded-[var(--studio-radius-control,4px)] px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-cream-200 hover:text-ink-950"
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
              <span className={labelCls}>
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
                    // ADOPT BEFORE THE STATE EDIT, in the same handler. The map is a ref, so
                    // this lands synchronously and the re-render `setBlockValue` schedules
                    // already sees the entry — the canvas never paints the committed path,
                    // which would 404 for the one frame it was up.
                    onChange={(next: unknown, upload?: PreviewUpload) => {
                      if (upload) previews.adopt(upload.src, upload.file);
                      setBlockValue(selectedId as string, next);
                    }}
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
      // BOTH BREAKPOINTS ARE THE CONSUMER'S NOW. The inspector fold always was; the FIT
      // threshold moved here in PR 5, because the shell had been reading blog's 1614
      // directly and a second consumer would have inherited blog's breakpoint silently.
      fitThresholdPx={FIT_THRESHOLD_PX}
      listNoun="posts"
      list={<BlogPostList posts={posts} currentSlug={slug} />}
      canvasBar={
        <>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-950">{title}</span>
          <a
            href={livePath}
            target="_blank"
            rel="noreferrer"
            // `text-ink-600` and `hover:text-accent-500` WERE HERE AND BOTH WERE DEAD — an unlayered
            // `a { color: inherit }` outranks the utility layer. The colour is inherited from
            // ThreePaneShell's strip now; the BORDER hover survives because no unlayered rule
            // claims border-color, which is exactly the asymmetry that made this hard to see.
            // 32px VIA min-h-8, the contract's `.cv-bar .btn` height and the term that makes the
            // bar 55. AND font-semibold: #208 swept action controls to 600, but it matched on
            // `text-[12px]` and this button is 11.5px, so the sweep passed straight over it —
            // the same shape as the Post band's SaveIndicator being an #205 miss.
            className="hidden min-h-8 shrink-0 items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:border-accent-500 sm:inline-flex [&>svg]:size-3"
          >
            {/* "VIEW POST", NOT "VIEW LIVE" — this goes to THIS article, while the topbar's
                link goes to the site root. See StudioTopbar for the full note. */}
            View post <IconArrowUpRight />
          </a>
          {/* THE SAVE STATE, WHERE THE EDITING IS. Below the fold the canvas and the
              inspector are mutually exclusive, so the ONE view in which inline editing works
              rendered no save indicator at all — not scrolled away, not rendered. Driven at
              1000x800: canvas view, zero indicators, canvas editable.
              BOTH CONDITIONS ARE LOAD-BEARING. `canvasBar` renders unconditionally in the
              strip ABOVE the swapped content, so `!inspectorFits` alone would show this
              beside the inspector's own copy in the inspector view — two "Body" indicators,
              which is the misreading #178's required label exists to prevent.
              Above the fold nothing changes: the inspector's copy is on screen, 334px to the
              right, and that distance is accepted rather than fixed here.
              Same reasoning as the ViewToggle below — a control that exists only where the
              other route to it is gone. */}
          {!inspectorFits && view === "canvas" ? (
            <SaveIndicator label="Body" saving={saveStatus === "saving"} dirty={dirty} />
          ) : null}
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
