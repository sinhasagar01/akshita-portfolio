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
import { useEffect, useMemo, useRef, useState } from "react";
import type { RawSection, SectionBlockKind } from "@/lib/case-studies/sections-raw";
import { adaptSections } from "@/lib/case-studies/adapter";
import { makeDraftSrcRewriter } from "@/lib/studio/draft-image";
import { richToMarkers } from "@/lib/studio/rich-markers";
import { isSafeHref } from "@/lib/case-studies/adapter";
import SectionRenderer from "@/components/case-study/SectionRenderer";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { moveIn, removeAt, insertAt, setAt } from "./useItemList";
import { splitParagraph, mergeParagraph } from "@/lib/studio/paragraph-edits";
import { BLOCK_REGISTRY, BLOCK_LABELS, type BlockFormProps, type EditableBlockKind } from "./blocks/registry";
import { SectionShellForm, emptySection } from "./blocks/SectionShell";

/** Stable empty default — a fresh [] each render would rebuild the rewriter. */
const NO_DRAFT_IMAGES: readonly string[] = [];
import { FieldTabProvider, type FieldTab } from "./blocks/fields";
import { IconGrid, IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";

type SectionsFields = { sections: readonly RawSection[] };
/** The parallel stable ids, mirroring the sections structure exactly. */
type Ids = { sectionIds: string[]; blockIds: string[][] };

/**
 * A block kind's human name, tolerating a kind that has no editor YET.
 *
 * `videoEmbed` is in the schema from VE-1 but gets its form in VE-3, so a section
 * that already holds one still has to list, reorder and remove it. Falling back to
 * the kind itself keeps those controls labelled instead of rendering `undefined`.
 */
const blockLabel = (kind: SectionBlockKind): string =>
  (BLOCK_LABELS as Partial<Record<SectionBlockKind, string>>)[kind] ?? kind;

const sectionLabel = (s: RawSection, i: number) =>
  s.title?.split("\n")[0] || s.eyebrow || s.id || `Section ${i + 1}`;

const iconBtn =
  "grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3.5";

// CS-3 — the block kinds that carry any STYLE field (image geometry or a glow
// word). Under the Style tab, blocks NOT in this set have nothing to show, so their
// card is hidden there (the form stays mounted); every other kind is copy-only and
// lives entirely under Content. Kept next to the map in registry.tsx by review.
const KIND_HAS_STYLE = new Set<SectionBlockKind>([
  "heroCover",
  "deviceShelf",
  "featureRows",
  "beforeAfter",
  "annotatedImage",
]);

// CS-2 — coarse kind families for the board's schematic skeleton (shape by
// family, exact kind spelled out by its label). Not a live render.
const IMAGE_KINDS = new Set<SectionBlockKind>([
  "heroCover",
  "deviceShelf",
  "featureRows",
  "beforeAfter",
  "annotatedImage",
  "figureGrid",
]);
const GRID_KINDS = new Set<SectionBlockKind>([
  "glanceGrid",
  "issueList",
  "stepper",
  "statCards",
  "principleCards",
  "swatchTokens",
]);

/**
 * CS-2 — the board's per-section "needs an image" flag, derived from the SAME
 * check the publish gate uses (validate-draft-sections → adaptSections in ssg
 * mode, which throws "image src is missing" for an unset required image). Run on
 * the single section so the verdict is per-card. A non-image failure is the
 * publish gate's to report, not this flag's, so only the image message flips it.
 */
function sectionNeedsImage(section: RawSection): boolean {
  try {
    adaptSections([section], { mode: "ssg" });
    return false;
  } catch (e) {
    return e instanceof Error && /image src is missing/.test(e.message);
  }
}

/** CS-2 — a per-kind schematic skeleton (NOT a live render): a coarse glyph by
 *  kind family plus the kind's label, so the board reads as an overview. */
function BlockSkeleton({ kind }: { kind: SectionBlockKind }) {
  return (
    <span className="flex items-center gap-2 rounded border border-ink-950/6 bg-cream-100 px-2 py-1">
      <span aria-hidden className="shrink-0">
        {IMAGE_KINDS.has(kind) ? (
          <span className="block size-3.5 rounded-sm border border-ink-950/20 bg-ink-950/5" />
        ) : GRID_KINDS.has(kind) ? (
          <span className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((n) => (
              <span key={n} className="block size-1.5 rounded-[1px] bg-ink-950/20" />
            ))}
          </span>
        ) : (
          <span className="flex w-3.5 flex-col gap-0.5">
            <span className="block h-0.5 w-full rounded bg-ink-950/20" />
            <span className="block h-0.5 w-2/3 rounded bg-ink-950/20" />
          </span>
        )}
      </span>
      <span className="truncate text-[11px] text-ink-600">{blockLabel(kind)}</span>
    </span>
  );
}

/** CS-7e — immutably set `<imagePath>.src` inside a block value. `imagePath` is the
 *  dotted path to the image SPEC (e.g. "devices.0", "features.1.image",
 *  "pairs.0.before", "image"); ".src" is appended. Numeric segments address array
 *  positions. Every level on the path is copied, so untouched siblings keep their
 *  references — the surgical round-trip the sections write seam relies on. */
function setSrcAtPath(value: unknown, imagePath: string, src: string): unknown {
  const set = (node: unknown, ks: string[]): unknown => {
    if (ks.length === 0) return src;
    const [k, ...rest] = ks;
    if (/^\d+$/.test(k)) {
      const arr = Array.isArray(node) ? [...node] : [];
      arr[Number(k)] = set(arr[Number(k)], rest);
      return arr;
    }
    const obj =
      node && typeof node === "object" && !Array.isArray(node)
        ? { ...(node as Record<string, unknown>) }
        : {};
    (obj as Record<string, unknown>)[k] = set((obj as Record<string, unknown>)[k], rest);
    return obj;
  };
  return set(value, [...imagePath.split("."), "src"]);
}

/**
 * The rail's descriptor for a tagged canvas element, built from the markers already on
 * it. One implementation, shared by the click that selects a field and the rebuild that
 * has to re-select it, so those two can never disagree about which field is which.
 */
function selectedFieldFrom(el: HTMLElement | null): SelectedField | null {
  if (!el) return null;
  const label = el.getAttribute("aria-label") ?? "Field";
  const sf = el.dataset.edit;
  if (sf === "eyebrow" || sf === "title" || sf === "lead" || sf === "northStar") {
    return { kind: "section", field: sf, label };
  }
  const bi = el.dataset.editBlockIndex;
  const path = el.dataset.editValuePath;
  if (bi !== undefined && path) return { kind: "block", blockIndex: Number(bi), path, label };
  return null;
}

/**
 * A CSS selector that finds a tagged canvas field again after its DOM is rebuilt.
 *
 * Only the markers already on the element are used, so this addresses the same field
 * the writeback does. Returns null for anything untagged (the rail, chrome, <body>),
 * which is the signal that there is nothing to restore focus to.
 */
function fieldSelector(el: HTMLElement | null): string | null {
  const ds = el?.dataset;
  if (!ds) return null;
  if (ds.edit) return `[data-edit="${ds.edit}"]`;
  if (ds.editBlockIndex !== undefined && ds.editValuePath) {
    return `[data-edit-block-index="${ds.editBlockIndex}"][data-edit-value-path="${ds.editValuePath}"]`;
  }
  return null;
}

/** Read a dotted path (e.g. "stats.0.value") out of a block value, for a no-op check. */
function getAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (node, k) => (node && typeof node === "object" ? (node as Record<string, unknown>)[k] : undefined),
    value
  );
}

/** A caret sitting in a richText paragraph: which block, which array item, and the
 *  marker text on each side of it. Null for anything that is not one. */
function paragraphCaret(
  el: HTMLElement | null
): { blockIndex: number; index: number; before: string; after: string; atStart: boolean } | null {
  const ds = el?.dataset;
  if (!ds?.editValuePath || ds.editBlockIndex === undefined) return null;
  const m = /^paragraphs\.(\d+)$/.exec(ds.editValuePath);
  if (!m) return null;
  const sel = typeof window === "undefined" ? null : window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el!.contains(range.startContainer)) return null;

  // Serialize each side through the SAME serializer the blur writeback uses, by cloning
  // the two halves into detached elements. Nothing here re-implements marker rules.
  const head = range.cloneRange();
  head.selectNodeContents(el!);
  head.setEnd(range.startContainer, range.startOffset);
  const tail = range.cloneRange();
  tail.selectNodeContents(el!);
  tail.setStart(range.endContainer, range.endOffset);

  const wrap = (frag: DocumentFragment) => {
    const d = document.createElement("div");
    d.appendChild(frag);
    return richToMarkers(d, isSafeHref);
  };
  return {
    blockIndex: Number(ds.editBlockIndex),
    index: Number(m[1]),
    before: wrap(head.cloneContents()),
    after: wrap(tail.cloneContents()),
    atStart: range.collapsed && head.toString().length === 0,
  };
}

/** Put the caret at a PLAIN-TEXT offset inside a rendered field, walking its text nodes.
 *  Used after a structural edit, so a split or merge reads as one keystroke. */
function placeCaret(el: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let node: Node | null = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (seen + len >= offset) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, offset - seen));
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    seen += len;
    node = walker.nextNode();
  }
  // Past the end (or an empty paragraph): collapse to the end of the element.
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** CS-7d (extended) — immutable deep-set of a STRING at a dotted path within a block
 *  value, the plain-text counterpart to setSrcAtPath. Powers inline editing of nested
 *  fields (stat values, feature titles, glance labels, step labels, principle titles). */
function setAtPath(value: unknown, path: string, next: string): unknown {
  const set = (node: unknown, ks: string[]): unknown => {
    if (ks.length === 0) return next;
    const [k, ...rest] = ks;
    if (/^\d+$/.test(k)) {
      const arr = Array.isArray(node) ? [...node] : [];
      arr[Number(k)] = set(arr[Number(k)], rest);
      return arr;
    }
    const obj =
      node && typeof node === "object" && !Array.isArray(node)
        ? { ...(node as Record<string, unknown>) }
        : {};
    (obj as Record<string, unknown>)[k] = set((obj as Record<string, unknown>)[k], rest);
    return obj;
  };
  return set(value, path.split("."));
}

/** CS-7c — the inline canvas: a live, READ-ONLY render of one section through the
 *  preview-mode adapter (placeholder for a missing image, never fail-loud) and the
 *  real SectionRenderer with `noReveal` so it stays visible in the panel. The
 *  `.case-study` scope pulls in the real cream-card + dark-band styling, and `web`
 *  gives the Bold-gallery treatment when the project is template=web. It only reads
 *  the current draft values — no state, no writes. */
/** The live content width: `container-x`'s max-width (80rem). Rendering the canvas
 *  at exactly this and scaling down is what makes the preview proportional to the
 *  real page instead of a squeezed version of it. */
const CANVAS_WIDTH = 1280;

/**
 * Render at CANVAS_WIDTH, then scale to whatever the pane actually is.
 *
 * Only ever scales DOWN (capped at 1), so a wide pane shows the section at true
 * size rather than blown up. The pane's height is driven from the scaled content,
 * otherwise the transform would leave the original unscaled height as dead space
 * underneath.
 *
 * Mount-only, with NO content dependency: the ResizeObserver on the surface already
 * fires for anything that changes its height — switching section, editing a field,
 * an image loading. Depending on the section object instead would rebuild the
 * observer on every keystroke, since the form replaces it immutably on each edit.
 */
function useFitToWidth() {
  const paneRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const pane = paneRef.current;
    const surface = surfaceRef.current;
    if (!pane || !surface) return;
    const measure = () => {
      const next = Math.min(1, pane.clientWidth / CANVAS_WIDTH);
      setScale(next);
      setHeight(surface.offsetHeight * next);
    };
    measure();
    // Observes the pane (window/layout changes) and the surface (content growing as
    // images load or a field is edited). Writing the pane's HEIGHT cannot change
    // either observed width, so this settles rather than looping.
    const ro = new ResizeObserver(measure);
    ro.observe(pane);
    ro.observe(surface);
    return () => ro.disconnect();
  }, []);

  return { paneRef, surfaceRef, scale, height };
}

/**
 * What the Selected rail is currently editing. Either a SECTION-shell string
 * (eyebrow/title) or a plain-string field inside a block, addressed by the same
 * (blockIndex, dotted path) pair the canvas markers already carry — so the rail
 * writes through exactly the same seams the inline edit does, with no second
 * source of truth for a field's value.
 */
type SelectedField =
  | { kind: "section"; field: "eyebrow" | "title" | "lead" | "northStar"; label: string }
  | { kind: "block"; blockIndex: number; path: string; label: string };

/**
 * The design's right-hand rail: the one field you clicked, editable as a normal
 * control. It exists because inline contentEditable is great for a quick word change
 * and poor for anything longer — no wrapping control, no undo affordance, and on a
 * scaled canvas the text is small. Clicking the canvas selects; typing here writes.
 */
/**
 * Grow the rail's textarea to fit its content, bounded by the canvas beside it.
 *
 * A fixed 3-row box is wrong at both ends: a two-word stat value wastes most of it,
 * and a position statement is edited through a keyhole. So the height follows the
 * text — but it must not run past the section it belongs to, or the rail outgrows
 * the thing it is editing and the page scrolls for no reason.
 *
 * The ceiling is measured from the canvas pane (the rail's grid sibling) rather than
 * hardcoded, so it tracks whatever that section actually renders to.
 */
function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Anchored to the RAIL, not the textarea: the textarea only exists once a field is
  // selected, so measuring from it meant the effect ran on mount with nothing there,
  // bailed, and never re-ran — leaving the box uncapped.
  const railRef = useRef<HTMLElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  // Track the canvas pane's height. It changes with the section, the viewport, and
  // images loading, so it is observed rather than read once.
  useEffect(() => {
    const canvas = railRef.current?.parentElement?.firstElementChild;
    if (!canvas) return;
    const measure = () => setMaxHeight(canvas.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Reset to auto before reading scrollHeight, or the box can only ever grow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cap = maxHeight ?? Number.POSITIVE_INFINITY;
    el.style.height = `${Math.min(el.scrollHeight, cap)}px`;
  }, [value, maxHeight]);

  return { ref, railRef, maxHeight };
}

function SelectedRail({
  selected,
  value,
  onChange,
}: {
  selected: SelectedField | null;
  /** Read straight from form state on every render — see the panel's `readField`. */
  value: string;
  onChange: (v: string) => void;
}) {
  const { ref: taRef, railRef, maxHeight } = useAutoGrow(value);
  return (
    <aside ref={railRef} className="sticky top-4 rounded-xl border border-ink-950/8 bg-cream-50 p-3.5">
      <p className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
        {selected ? `Selected · ${selected.label}` : "Selected"}
      </p>
      {selected ? (
        <textarea
          key={
            selected.kind === "section"
              ? `s:${selected.field}`
              : `b:${selected.blockIndex}:${selected.path}`
          }
          ref={taRef}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={selected.label}
          // Height is driven by useAutoGrow; once it hits the ceiling the box scrolls
          // instead of pushing past the canvas. resize-none because dragging a handle
          // would fight the auto-sizing on the next keystroke.
          style={{ maxHeight }}
          className="mt-2 w-full resize-none overflow-y-auto rounded-md border border-ink-950/8 bg-cream-100 px-3 py-2 text-[13px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
        />
      ) : null}
      <p className="mt-2 text-[11px] text-text-subtle">
        {selected
          ? "Edits here and on the canvas are the same field."
          : "Click any dashed element on the canvas to edit it here. The title and facts come from Details."}
      </p>
    </aside>
  );
}

/**
 * Inline formatting for the focused Rich field: bold, italic, link.
 *
 * THREE marks, and only three. The model is a plain string that `parseRich` reads for
 * `**bold**`, `*italic*` and `[text](url)` — there is no underline, size, colour or list
 * in `RichRun`, and those are deliberately absent rather than shown disabled. A greyed
 * button advertises a capability that does not exist; docs/studio/richtext-roadmap.md
 * carries that reasoning instead.
 *
 * execCommand is deprecated but is still the only cross-browser way to toggle a mark
 * inside contentEditable without shipping an editor library. It produces <b>/<strong>
 * and <i>/<em> depending on engine, and richToMarkers maps all four.
 *
 * THE LINK POPOVER REPLACES window.prompt(). A native prompt is modal, unstyled, cannot
 * show why a URL was refused, and on some platforms is suppressed entirely — so the one
 * control that needs to explain itself was the one that could not. The popover is
 * `docs/studio/link-popover.html` built with the real tokens.
 */
function BoldToolbar({
  at,
  onCommand,
}: {
  at: { top: number; left: number } | null;
  /** Fired after a command ran, so the panel knows the DOM has diverged from React. */
  onCommand?: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  /** Set when the selection sits inside an existing <a>, which is what shows Remove. */
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * The selection AT THE MOMENT the popover opened, plus the field it lived in.
   *
   * Focus moves to the URL input, which collapses the selection the link is supposed to
   * wrap — so it is captured on the way in and restored immediately before the command.
   * Without this, Apply links nothing at all.
   */
  const saved = useRef<{ range: Range; field: HTMLElement } | null>(null);
  /** Set when a close should hand focus back to the field the popover came from. */
  const wantsRefocus = useRef(false);

  // A new field took focus (or the toolbar hid) — an open popover belongs to the old
  // selection, so it must not survive into the new one.
  useEffect(() => {
    setLinkOpen(false);
  }, [at?.top, at?.left]);

  useEffect(() => {
    if (linkOpen) {
      inputRef.current?.focus();
      return;
    }
    if (!wantsRefocus.current) return;
    wantsRefocus.current = false;
    restoreSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkOpen]);

  if (!at) return null;

  const trimmed = url.trim();
  // Empty is ALLOWED and means "no link" (Apply removes it); only a non-empty unsafe
  // value is a rejection. Same allowlist as the parser and the renderer.
  const rejected = trimmed !== "" && !isSafeHref(trimmed);

  const restoreSelection = () => {
    const s = saved.current;
    if (!s) return false;
    s.field.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(s.range);
    return true;
  };

  const closePopover = () => {
    // The focus restore is an EFFECT, not a call here. Restoring while the input is
    // still mounted loses the race — React removes the focused node a moment later and
    // the browser falls back to <body>, which leaves the toolbar floating over a field
    // nobody is editing, with no further focusout to hide it. The effect below runs
    // after the DOM update, which is the only point the field is focusable again.
    wantsRefocus.current = true;
    setLinkOpen(false);
  };

  const apply = () => {
    if (rejected) return;
    if (!restoreSelection()) return;
    // Empty clears the link rather than writing an empty href, so Apply on a blank field
    // is the same gesture as Remove.
    if (trimmed === "") document.execCommand("unlink");
    else document.execCommand("createLink", false, trimmed);
    setLinkOpen(false);
    onCommand?.();
  };

  const remove = () => {
    if (!restoreSelection()) return;
    document.execCommand("unlink");
    setLinkOpen(false);
    onCommand?.();
  };

  const btn =
    "grid size-[30px] place-items-center rounded-[7px] text-[15px] text-ink-950 transition-colors hover:bg-cream-200";
  // Layout only. Colour is per-button, because a shared `bg-white` here and a
  // `bg-accent-500` on the primary are the same Tailwind property — the generated sheet
  // decides which wins, not the order they appear in the string, and the primary loses.
  const action =
    "h-[30px] rounded-[7px] border border-[0.5px] px-[13px] text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-45";
  const actionQuiet = `${action} border-ink-950/16 bg-white text-ink-950 hover:bg-cream-100`;
  const actionPrimary = `${action} border-accent-500 bg-accent-500 text-white hover:bg-accent-600`;

  return (
    <div
      // Marks the whole toolbar as part of the edit surface. The canvas hides the
      // toolbar when focus leaves for anything that is not a rich field, and the URL
      // input is not one — without this, opening the popover would close the toolbar
      // that contains it.
      data-rich-toolbar
      style={{ position: "fixed", top: at.top, left: at.left, zIndex: 60 }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && linkOpen) {
          e.preventDefault();
          closePopover();
        }
      }}
    >
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="inline-flex items-center gap-0.5 rounded-[10px] border border-[0.5px] border-ink-950/16 bg-cream-50 p-1 shadow-[0_6px_20px_-8px_rgba(60,50,38,0.4)]"
      >
        <button
          type="button"
          // mousedown, not click: the default would blur the field and end the selection
          // before the command could apply to it. Every button here does the same.
          onMouseDown={(e) => {
            e.preventDefault();
            document.execCommand("bold");
            onCommand?.();
          }}
          aria-label="Bold"
          title="Bold"
          className={`${btn} font-display font-bold`}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            document.execCommand("italic");
            onCommand?.();
          }}
          aria-label="Italic"
          title="Italic"
          className={`${btn} font-display italic`}
        >
          I
        </button>
        <span aria-hidden className="mx-[3px] h-[18px] w-px bg-ink-950/16" />
        <button
          type="button"
          aria-label="Link"
          title="Link"
          aria-expanded={linkOpen}
          onMouseDown={(e) => {
            // preventDefault BEFORE reading the selection: the default mousedown would
            // collapse it, and the selection is the link text.
            e.preventDefault();
            if (linkOpen) {
              closePopover();
              return;
            }
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const node = range.startContainer;
            const el = (node.nodeType === 1 ? node : node.parentNode) as HTMLElement | null;
            const field = el?.closest?.("[data-edit-rich]") as HTMLElement | null;
            if (!field) return;
            const anchor = el?.closest?.("a") as HTMLAnchorElement | null;
            // Editing an existing link works from a caret INSIDE it; creating a new one
            // needs words to wrap.
            if (!anchor && sel.isCollapsed) return;
            saved.current = {
              range: anchor ? selectWholeAnchor(anchor) : range.cloneRange(),
              field,
            };
            setEditing(Boolean(anchor));
            setUrl(anchor?.getAttribute("href") ?? "");
            setLinkOpen(true);
          }}
          className={`${btn} underline ${linkOpen ? "bg-accent-500 text-white hover:bg-accent-500" : ""}`}
        >
          &#128279;
        </button>
      </div>

      {linkOpen && (
        <div
          className="mt-1.5 w-[280px] rounded-[10px] border border-[0.5px] border-ink-950/16 bg-cream-50 p-2.5 shadow-[0_10px_30px_-10px_rgba(60,50,38,0.45)]"
          role="dialog"
          aria-label="Link URL"
        >
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            aria-label="Link URL"
            aria-invalid={rejected}
            placeholder="https://, mailto: or /path"
            className={`h-[34px] w-full rounded-[7px] border border-[0.5px] bg-white px-2.5 text-[13px] text-ink-950 outline-none ${
              rejected
                ? "border-danger-600 ring-2 ring-danger-600/12"
                : "border-ink-950/16 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/15"
            }`}
          />
          <div className="mt-[9px] flex items-center justify-end gap-2">
            {rejected && (
              <span role="alert" className="mr-auto text-[11px] text-danger-600">
                Only http, https, mailto, or relative links
              </span>
            )}
            {editing && !rejected && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={remove} className={actionQuiet}>
                Remove
              </button>
            )}
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closePopover} className={actionQuiet}>
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={apply}
              disabled={rejected}
              className={`${actionPrimary} disabled:hover:bg-accent-500`}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A range covering an entire anchor, so editing an existing link replaces all of it
 *  rather than the few characters the caret happened to sit in. */
function selectWholeAnchor(anchor: HTMLAnchorElement): Range {
  const r = document.createRange();
  r.selectNodeContents(anchor);
  return r;
}

function SectionCanvas({
  section,
  web,
  template,
  rewriteSrc,
  editable = false,
  onBlur,
  onReplaceImage,
  onSelectField,
  selectedField,
  onRichFocus,
  onParagraphSplit,
  onParagraphMerge,
  renderEpoch = 0,
}: {
  section: RawSection;
  web: boolean;
  /** Routes draft-only image srcs through the owner-gated proxy — see the panel. */
  rewriteSrc?: (src: string) => string;
  template: string;
  /** CS-7d — activate in-place text editing on the rendered plain-string fields. */
  editable?: boolean;
  /** CS-7d — delegated blur: fires for any contentEditable field inside; the panel
   *  reads the target's data-edit markers and writes back through the seams. */
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** CS-7e — a Replace-image affordance was clicked; the panel resolves the image's
   *  block index + dotted path and starts the content-addressed upload. */
  onReplaceImage?: (blockIndex: number, imagePath: string) => void;
  /** A tagged field was clicked — drives the Selected rail. */
  onSelectField?: (f: SelectedField) => void;
  /** The field the rail is bound to, so the canvas can mark it as selected. */
  selectedField?: SelectedField | null;
  /** A rich field gained (or lost) focus — drives the bold control's position. */
  onRichFocus?: (at: { top: number; left: number } | null) => void;
  /** Enter inside a richText paragraph — grow the array at the caret. */
  onParagraphSplit?: (blockIndex: number, index: number, before: string, after: string) => void;
  /** Backspace at the start of a richText paragraph — fold it into the one above. */
  onParagraphMerge?: (blockIndex: number, index: number) => void;
  /**
   * Bumped by the panel after a bold command's value is committed. Used as the
   * SectionRenderer key, so the rendered section is rebuilt from state instead of
   * being reconciled against a DOM `execCommand` edited behind React's back. See the
   * panel's `boldDirty` for why that reconciliation cannot be trusted.
   */
  renderEpoch?: number;
}) {
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const btn = target.closest?.("[data-edit-image-replace]");
    if (btn) {
      const container = btn.closest("[data-edit-image-path]") as HTMLElement | null;
      const bi = container?.dataset.editBlockIndex;
      const path = container?.dataset.editImagePath;
      if (container && bi !== undefined && path) onReplaceImage?.(Number(bi), path);
      return;
    }
    // Clicking a tagged field selects it. Reads the SAME markers the blur writeback
    // uses, so the rail can never disagree with the canvas about which field is which.
    const f = selectedFieldFrom(target.closest?.("[data-edit-value-path], [data-edit]") as HTMLElement | null);
    if (f) onSelectField?.(f);
  };
  let adapted: ReturnType<typeof adaptSections> = [];
  try {
    adapted = adaptSections([section], { mode: "preview", template, rewriteSrc });
  } catch {
    adapted = [];
  }
  const s = adapted[0];
  const { paneRef, surfaceRef, scale, height } = useFitToWidth();

  // Mark the selected field in the canvas. Applied imperatively rather than through
  // props because the marked node is rendered deep inside the case-study components,
  // which know nothing about studio selection — and re-applied after every render, so
  // an edit that re-renders the canvas cannot drop the highlight.
  useEffect(() => {
    const root = surfaceRef.current;
    if (!root) return;
    root.querySelectorAll(".is-selected").forEach((n) => n.classList.remove("is-selected"));
    if (!selectedField) return;
    const sel =
      selectedField.kind === "section"
        ? `[data-edit="${selectedField.field}"]`
        : `[data-edit-block-index="${selectedField.blockIndex}"][data-edit-value-path="${selectedField.path}"]`;
    root.querySelector(sel)?.classList.add("is-selected");
  });
  return (
    // `canvas-static` is the visibility scope: the canvas is a static panel, so the
    // in-view reveal that normally un-hides `.reveal-card` items never fires here.
    // It sits on the WRAPPER rather than inside SectionRenderer so it covers every
    // one of that component's branches (hero, web hero, quote band, standard) at
    // once, and so no public component has to change to fix a studio-only bug.
    //
    // `canvas-surface` paints the case-study route's own backdrop, so the card sits
    // on the same colour it does live rather than on the global canvas beige.
    <div
      ref={paneRef}
      className="case-study canvas-static canvas-surface overflow-hidden rounded-lg border border-ink-950/8"
      style={{ height }}
      onBlur={onBlur}
      onClick={onClick}
      onFocusCapture={(e) => {
        const el = (e.target as HTMLElement).closest?.("[data-edit-rich]") as HTMLElement | null;
        if (!el) return onRichFocus?.(null);
        const r = el.getBoundingClientRect();
        // Above the field, nudged in. getBoundingClientRect is post-transform, which
        // is what fixed positioning needs — so the CSS-scaled canvas is handled.
        onRichFocus?.({ top: Math.max(8, r.top - 34), left: r.left });
      }}
      // Hide the toolbar when focus leaves a rich field for anything that is not
      // another rich field.
      //
      // onFocusCapture alone could not do this: it only fires when focus ENTERS
      // something in the pane, so clicking empty chrome — which sends focus to <body>
      // and fires no focus event here at all — left the toolbar floating over
      // unrelated content with nothing being edited.
      //
      // focusout carries relatedTarget (the element about to receive focus) and fires
      // BEFORE the matching focusin, so rich-to-rich is safe: this sees a rich
      // relatedTarget and leaves the toolbar up, then onFocusCapture moves it to the
      // new field. Clicking the Bold button is also safe — it preventDefaults its
      // mousedown, so focus never leaves the field and no focusout fires.
      //
      // The TOOLBAR counts as staying in the edit surface. Its link popover has a real
      // text input, so opening it genuinely moves focus out of the field — and hiding
      // the toolbar at that moment would close the popover the owner just opened, with
      // the selection it was about to link.
      onBlurCapture={(e) => {
        const next = e.relatedTarget as HTMLElement | null;
        if (!next?.closest?.("[data-edit-rich], [data-rich-toolbar]")) onRichFocus?.(null);
      }}
      // richText paragraphs are ARRAY ITEMS, so the two keys that change how many
      // paragraphs there are have to be intercepted. Left to the browser, Enter inserts
      // a <br> or splits a <div> INSIDE one item — which looks right on the canvas and
      // is wrong on disk, one <p> with a line break instead of two paragraphs.
      //
      // Only these two, and only in a richText paragraph. Every other key, and every
      // other field, is untouched: Shift+Enter, a non-collapsed selection, and Backspace
      // anywhere but the very start all fall through to normal editing.
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== "Backspace") return;
        if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
        const at = paragraphCaret(e.target as HTMLElement);
        if (!at) return;
        if (e.key === "Enter") {
          e.preventDefault();
          onParagraphSplit?.(at.blockIndex, at.index, at.before, at.after);
          return;
        }
        // Backspace only merges from the very start of a paragraph that has one above
        // it. Anywhere else it is an ordinary character delete.
        if (at.atStart && at.index > 0) {
          e.preventDefault();
          onParagraphMerge?.(at.blockIndex, at.index);
        }
      }}
    >
      {/* The section renders at the LIVE content width and is then scaled to fit the
          pane, rather than being rendered into whatever width the pane happens to be.
          The site's breakpoints key off the WINDOW, so a narrow pane still gets the
          desktop rules — it was just squeezing a ~1064px layout into ~700px, which is
          why multi-column blocks looked nothing like the page. `container-x` supplies
          the same max-width and padding the live <main> does. */}
      <div
        ref={surfaceRef}
        className="container-x"
        style={{ width: CANVAS_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {s ? (
          <SectionRenderer key={renderEpoch} section={s} web={web} noReveal editable={editable} />
        ) : (
          <p className="px-4 py-6 text-center text-[12px] text-ink-500">
            This section can’t be previewed yet — finish its required fields.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SectionsEditPanel({
  slug,
  sections: initialSections,
  template = "",
  draftImages = NO_DRAFT_IMAGES,
}: {
  slug: string;
  sections: readonly RawSection[];
  /** CS-7c — the case-study template, so the inline canvas renders the same
   *  Bold-gallery web treatment (or the mobile composition) the live page shows. */
  template?: string;
  /** PUBLIC paths of images that changed on the draft branch. An image uploaded
   *  since the last publish exists only there, so its plain path 404s in the
   *  canvas; these are routed through the owner-gated draft-image proxy instead. */
  draftImages?: readonly string[];
}) {
  const { setUnpublished } = usePublishSignal();
  const web = template === "web";
  const rewriteSrc = useMemo(() => makeDraftSrcRewriter(draftImages), [draftImages]);

  const nextId = useRef(0);
  const mint = () => `x${nextId.current++}`;
  // The mount-seed for the parallel stable ids. Reused by handleCancel so a
  // Cancel restores ids from the SAME sections snapshot the values revert to,
  // keeping sectionIds/blockIds length-matched to sections.
  const seedIds = (sections: readonly RawSection[]): Ids => ({
    sectionIds: sections.map(mint),
    blockIds: sections.map((s) => s.blocks.map(mint)),
  });
  const [ids, setIds] = useState<Ids>(() => seedIds(initialSections));
  const [picker, setPicker] = useState<string | null>(null);

  const { values, setField, dirty, saveStatus, saveDraft, cancel, savedBaseline } = useDraftForm<SectionsFields>({
    initial: { sections: initialSections },
    buildCommitted: (v) => ({ sections: v.sections }),
    isDirty: (v, b) => JSON.stringify(v.sections) !== JSON.stringify(b.sections),
    saveExtras: { collection: "projects", slug },
    buildBody: (committed, extras) => ({ ...extras, sections: committed.sections }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  // CS-2 — the ONLY new state: which section is focused (null = the board).
  // Keyed by the STABLE section id (not an index), so a reorder keeps the same
  // section focused and the id-lockstep is untouched. Every editor stays mounted
  // regardless (rendered hidden), so switching views never drops a dirty edit.
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // CS-3 — Content | Style split. One tab state for the focused section's fields,
  // provided to the shell + block forms via FieldTabProvider; each field's TabGroup
  // shows only under its tab. Default Content.
  const [contentStyleTab, setContentStyleTab] = useState<FieldTab>("content");

  // The approved design's top-level split. "Canvas" is the render plus the Selected
  // rail; "Inspector" is the full field stack, which keeps every field that cannot be
  // edited inline (Rich **bold** copy, style, geometry) reachable. The Content|Style
  // tabs live INSIDE Inspector, unchanged — this adds a view switch above them rather
  // than replacing them.
  const [view, setView] = useState<"canvas" | "inspector">("canvas");

  // WHICH field the Selected rail is bound to. Deliberately NOT its text.
  //
  // The rail used to also hold `selectedDraft`, a copy of the value seeded once when
  // the field was selected, committed on blur. That copy could not see a canvas edit
  // to the same field, so the sequence canvas-edit -> blur -> rail-edit -> blur wrote
  // the pre-canvas text back and silently destroyed the canvas edit. A rail that
  // shows one value while form state holds another is the bug; there is now no second
  // copy to go stale. The rail reads form state on every render and writes through on
  // change, exactly like the Inspector's own fields.
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
  // Where to float the bold control — set when a RICH field takes focus, cleared when
  // it leaves. Only rich fields get it; a plain field has nothing to format.
  const [boldAt, setBoldAt] = useState<{ top: number; left: number } | null>(null);

  // execCommand edits the contentEditable DOM directly, so after a bold the real DOM
  // and React's element tree disagree about that field's children. `renderRich` emits
  // those children as index-keyed <b> and text nodes, so the next render reconciles
  // against nodes React did not create and can leave execCommand's raw <b> behind —
  // the duplicated word. Plain typing does not do this, because it only changes text
  // node CONTENT, which React updates in place.
  //
  // So a bold marks the tree untrusted, and the writeback that commits its value bumps
  // renderEpoch. That keys SectionRenderer, discarding the edited subtree and building
  // a fresh one from state — React owns the DOM again, with no orphan to reconcile.
  //
  // Deliberately at the WRITEBACK, not at the command: remounting mid-edit would drop
  // focus and the selection, breaking select -> bold -> unbold. At the writeback the
  // field is already losing focus, so the remount costs nothing.
  const boldDirty = useRef(false);
  const [renderEpoch, setRenderEpoch] = useState(0);
  /** Field to re-focus once the rebuilt tree is committed, if focus was moving to one. */
  const refocusAfterRebuild = useRef<string | null>(null);
  /** ...and the rail binding that came with it, which the rebuild also interrupts. */
  const reselectAfterRebuild = useRef<SelectedField | null>(null);
  /** ...and where the caret goes, for a structural edit that has to read as one key. */
  const caretAfterRebuild = useRef<number | null>(null);

  // Runs AFTER the rebuild is on screen, which is the whole point: the node to focus
  // does not exist until then. An earlier version used requestAnimationFrame from the
  // blur handler and focused the OLD node, which the rebuild then threw away.
  //
  // The rail is restored too. Selection is normally driven by the click on the field,
  // but that click's target is destroyed mid-gesture by the rebuild, so without this
  // the caret sits in the new field while the rail still names the old one.
  useEffect(() => {
    const sel = refocusAfterRebuild.current;
    const field = reselectAfterRebuild.current;
    const caret = caretAfterRebuild.current;
    refocusAfterRebuild.current = null;
    reselectAfterRebuild.current = null;
    caretAfterRebuild.current = null;
    if (!sel) return;
    const el = document.querySelector<HTMLElement>(sel);
    el?.focus();
    // A split or merge has to land the caret where the keystroke implied, or it reads
    // as a jump rather than as Enter/Backspace.
    if (el && caret !== null) placeCaret(el, caret);
    if (field) setSelectedField(field);
  }, [renderEpoch]);

  // Clear the selection whenever the focused section changes.
  //
  // The rail addresses a field by (blockIndex, path) WITHIN the focused section, so a
  // selection that outlives a section switch points at the same address in a
  // different section. Leaving it bound would point the rail at whatever happens to
  // live at that address in the new section, so the next keystroke would edit content
  // the owner never opened.
  useEffect(() => {
    setSelectedField(null);
  }, [selectedSectionId]);

  // Cancel discards local edits; return to the board so selection can't point at
  // a section the revert removed.
  const handleCancel = () => {
    cancel(); // reverts values.sections to the saved baseline
    // Re-seed the parallel ids from that SAME baseline via the mount-seed logic,
    // so sectionIds/blockIds match the restored sections. Without this, a
    // structural edit (add/remove/reorder) followed by Cancel leaves the arrays
    // different lengths and id-addressing throws.
    setIds(seedIds(savedBaseline.sections));
    setSelectedSectionId(null);
  };

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

  // Which section's remove is awaiting confirmation, by stable section id (never
  // the index — a reorder would move the confirm onto a different section).
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  // Focus lands on Cancel, so the destructive button is never the default target.
  useEffect(() => {
    if (confirmRemove) confirmCancelRef.current?.focus();
  }, [confirmRemove]);

  const removeSection = (i: number) => {
    // If the focused section is going, drop back to the board (its id will be gone).
    if (ids.sectionIds[i] === selectedSectionId) setSelectedSectionId(null);
    structural((s, d) => ({
      sections: removeAt(s, i),
      ids: { sectionIds: removeAt(d.sectionIds, i), blockIds: removeAt(d.blockIds, i) },
    }));
  };

  function addSection() {
    // `id` is a DOM anchor, so it must be unique — mint one that is not taken.
    const used = new Set(values.sections.map((s) => s.id));
    let n = values.sections.length + 1;
    while (used.has(`section-${n}`)) n++;
    // Mint the stable id outside structural() so we can focus the new section.
    const newId = mint();
    structural((s, d) => ({
      sections: [...s, emptySection(`section-${n}`)],
      ids: { sectionIds: [...d.sectionIds, newId], blockIds: [...d.blockIds, []] },
    }));
    setSelectedSectionId(newId); // jump straight into the new section
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

  // Narrowed to the kinds that HAVE an editor: the picker maps over BLOCK_REGISTRY's
  // keys, so it can only ever offer one of these, and a kind without a form (VE-1's
  // videoEmbed) is unreachable here by construction rather than by a runtime guard.
  function addBlock(si: number, kind: EditableBlockKind) {
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

  /* --------------------------------------------------- CS-7e image replace */
  // A Replace affordance was clicked on a canvas image; a hidden file input is
  // triggered, and its chosen file is uploaded through the SAME content-addressed
  // block-image route the forms use. The server hashes the bytes and returns the
  // path, which is written into the block value at the image's dotted path via
  // setBlockValue (id-lockstep) — so reordering never changes a path and the write
  // seam stays the single sections writer.
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingImage = useRef<{ selIdx: number; blockIndex: number; path: string } | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function uploadReplacement(file: File) {
    const pending = pendingImage.current;
    if (!pending) return;
    setImageBusy(true);
    setImageError(null);
    try {
      const body = new FormData();
      body.append("slug", slug);
      body.append("file", file);
      const res = await fetch("/api/studio/upload-block-image", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setImageError("Image upload needs github mode (dev)");
        return;
      }
      if (res.ok && json.ok && typeof json.src === "string") {
        const { selIdx, blockIndex, path } = pending;
        const curVal = values.sections[selIdx]?.blocks[blockIndex]?.value;
        setBlockValue(ids.blockIds[selIdx][blockIndex], setSrcAtPath(curVal, path, json.src));
        return;
      }
      setImageError(
        {
          unsupported_type: "That file type is not supported. Use a PNG, JPEG or WebP.",
          file_too_large: "That image is too large. The limit is 12 MB.",
          image_processing_failed: "That image could not be processed.",
        }[json.error as string] ?? "Upload failed. Try again."
      );
    } catch {
      setImageError("Upload failed. Try again.");
    } finally {
      setImageBusy(false);
      pendingImage.current = null;
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  const dupeIds = new Set(
    values.sections.map((s) => s.id).filter((id, i, a) => id !== "" && a.indexOf(id) !== i)
  );
  // The registry's keys ARE the offerable set, so a kind whose form is not built yet
  // (VE-1's videoEmbed) is absent from the picker without a filter to maintain.
  const addableKinds = Object.keys(BLOCK_REGISTRY) as EditableBlockKind[];

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
          onClick={handleCancel}
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      {/* CS-2 — BOARD view (selectedSectionId === null): one card per section, a
          per-kind schematic (not a live render), block count, and the publish
          gate's needs-image flag. Presentational and edit-state-free, so it is
          conditionally rendered while every editor below stays MOUNTED. */}
      {selectedSectionId === null && (
        <div className="flex flex-col gap-4 px-4 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {values.sections.map((section, i) => {
              const name = sectionLabel(section, i);
              const count = section.blocks.length;
              const needsImage = sectionNeedsImage(section);
              return (
                <button
                  key={ids.sectionIds[i]}
                  type="button"
                  onClick={() => setSelectedSectionId(ids.sectionIds[i])}
                  aria-label={`Edit section ${name}, ${count} ${count === 1 ? "block" : "blocks"}${needsImage ? ", needs an image" : ""}`}
                  className="flex flex-col gap-2 rounded-lg border border-ink-950/8 bg-cream-50 p-3 text-left transition-colors hover:border-accent-500/40 hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 flex-col">
                      {section.eyebrow && (
                        <span className="truncate text-[10px] uppercase tracking-eyebrow text-ink-400">
                          {section.eyebrow}
                        </span>
                      )}
                      <span className="truncate font-display text-[14px] text-ink-950">{name}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-ink-950/10 px-2 py-0.5 text-[10px] text-ink-500">
                      {count} {count === 1 ? "block" : "blocks"}
                    </span>
                  </span>
                  <span className="flex flex-col gap-1">
                    {count === 0 ? (
                      <span className="text-[11px] text-text-subtle">No blocks yet</span>
                    ) : (
                      section.blocks.map((block, j) => (
                        <BlockSkeleton
                          key={ids.blockIds[i][j]}
                          kind={block.discriminant as SectionBlockKind}
                        />
                      ))
                    )}
                  </span>
                  {needsImage && (
                    <span className="inline-flex w-fit items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                      Needs an image
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> Add a section
          </button>
        </div>
      )}

      {/* CS-2 — FOCUSED nav (a section is selected): back to board + a native
          dropdown to jump sections. Edit-state-free, so conditionally rendered. */}
      {selectedSectionId !== null && (
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setSelectedSectionId(null)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-accent-600 transition-colors hover:bg-cream-200"
          >
            ← Board
          </button>
          <label className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-ink-500">Section</span>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              aria-label="Jump to section"
              className="rounded-md border border-ink-950/8 bg-cream-50 px-2 py-1 text-[12px] text-ink-950 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
            >
              {values.sections.map((section, i) => (
                <option key={ids.sectionIds[i]} value={ids.sectionIds[i]}>
                  {sectionLabel(section, i)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* The editors — ALWAYS MOUNTED. The container is hidden on the board and each
          section is hidden unless it is the focused one, so no editor ever unmounts
          and the id-lockstep + every dirty edit survive a view/section switch. */}
      <div className="flex flex-col gap-4 px-4 py-5" hidden={selectedSectionId === null}>
        {/* The design's top-level split. Both regions stay MOUNTED (hidden, never
            unmounted) so switching view keeps every dirty edit, caret and id-lockstep
            intact — the same discipline the board/section switch uses. */}
        <div role="tablist" aria-label="Editor view" className="flex gap-1 border-b border-ink-950/8">
          {(["canvas", "inspector"] as const).map((v) => {
            const on = view === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                id={`cs-view-${v}`}
                aria-selected={on}
                aria-controls={`cs-view-panel-${v}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setView(v)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const other = v === "canvas" ? "inspector" : "canvas";
                  setView(other);
                  requestAnimationFrame(() => document.getElementById(`cs-view-${other}`)?.focus());
                }}
                className={[
                  "-mb-px border-b-2 px-3 py-1.5 text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500",
                  on
                    ? "border-accent-500 font-medium text-ink-950"
                    : "border-transparent text-ink-500 hover:text-ink-950",
                ].join(" ")}
              >
                {v === "canvas" ? "Canvas" : "Inspector"}
              </button>
            );
          })}
        </div>

        <div id="cs-view-panel-canvas" role="tabpanel" aria-labelledby="cs-view-canvas" hidden={view !== "canvas"}>
        {/* CS-7c — the inline canvas: a live, read-only render of the selected
            section above the forms. The forms stay the edit surface (CS-7d moves
            editing onto the canvas). */}
        {(() => {
          const selIdx = selectedSectionId === null ? -1 : ids.sectionIds.indexOf(selectedSectionId);
          if (selIdx < 0) return null;
          // CS-7d — the blur writeback. A contentEditable plain-string field lost focus;
          // route its new text to the SAME seams the forms use (setSection for the
          // section header, setBlockValue by stable id for a block), skipping a no-op
          // so a focus-then-blur never marks the draft dirty.
          const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
            const t = e.target as HTMLElement;
            const ds = t?.dataset;
            if (!ds) return;
            // A RICH field renders its `**bold**` as real bold, so innerText would
            // return the words with every marker silently stripped. Serialize the DOM
            // back to markers instead; a field with no bold yields its plain string
            // unchanged, so tagging plain prose introduces no drift.
            const isRich = ds.editRich !== undefined;
            const raw = isRich ? richToMarkers(t, isSafeHref) : (t.innerText ?? "");
            // A bold ran in this field, so its DOM is no longer React's — rebuild the
            // section from state on the way out. Done BEFORE the no-op guards below,
            // because bold-then-unbold leaves the VALUE unchanged while still leaving
            // execCommand's node behind, and that path must clean up too.
            //
            // The rebuild replaces every node in the section, including the field the
            // owner is moving TO, which would silently drop the focus they just gave
            // it. So when focus is heading somewhere addressable, it is restored once
            // the new tree is on screen.
            if (isRich && boldDirty.current) {
              boldDirty.current = false;
              const next = e.relatedTarget as HTMLElement | null;
              refocusAfterRebuild.current = fieldSelector(next);
              reselectAfterRebuild.current = selectedFieldFrom(next);
              setRenderEpoch((n) => n + 1);
            }
            const sf = ds.edit; // "eyebrow" | "title" | "lead" | "northStar"
            if (sf === "eyebrow" || sf === "title" || sf === "lead" || sf === "northStar") {
              // Rich prose keeps its internal newlines; only the single-line shell
              // fields collapse them.
              const value = isRich
                ? raw.replace(/\n{3,}/g, "\n\n").trim()
                : sf === "title"
                  ? raw.replace(/\n{2,}/g, "\n").trim()
                  : raw.replace(/\s*\n\s*/g, " ").trim();
              const cur = values.sections[selIdx] as unknown as Record<string, unknown>;
              if ((cur[sf] ?? "") === value) return;
              setSection(selIdx, { ...values.sections[selIdx], [sf]: value } as RawSection);
              return;
            }
            if (ds.editBlockIndex !== undefined && ds.editValuePath) {
              // A plain-string block field lost focus. Deep-set it at its dotted path
              // (e.g. "text", "stats.0.value", "features.1.title") through the same
              // setBlockValue seam the forms use; skip a no-op so a focus-then-blur
              // never dirties the draft.
              const value = isRich
                ? raw.replace(/\n{3,}/g, "\n\n").trim()
                : raw.replace(/\s*\n\s*/g, " ").trim();
              const blockIndex = Number(ds.editBlockIndex);
              const path = ds.editValuePath;
              const curVal = (values.sections[selIdx].blocks[blockIndex]?.value ?? {}) as Record<string, unknown>;
              if ((getAtPath(curVal, path) ?? "") === value) return;
              setBlockValue(
                ids.blockIds[selIdx][blockIndex],
                setAtPath(curVal, path, value) as Record<string, unknown>
              );
            }
          };
          // The rail edits the SAME field the canvas does, so it reads and writes
          // through the same accessors rather than keeping its own copy.
          const readField = (f: SelectedField): string => {
            if (f.kind === "section") {
              const cur = values.sections[selIdx] as unknown as Record<string, unknown>;
              return String(cur[f.field] ?? "");
            }
            const curVal = (values.sections[selIdx].blocks[f.blockIndex]?.value ?? {}) as Record<string, unknown>;
            return String(getAtPath(curVal, f.path) ?? "");
          };
          // Selecting only records WHICH field. The value is read on render, so the
          // rail cannot show something form state no longer holds.
          const selectField = (f: SelectedField) => setSelectedField(f);

          /**
           * Enter and Backspace in a richText paragraph, the two keys that change how
           * MANY paragraphs a block has.
           *
           * Both write the whole `paragraphs` array through `setBlockValue` keyed by the
           * block's stable id — the same seam every other edit uses. Nothing addresses a
           * block by position here, so the id-lockstep is untouched and a structural
           * edit cannot land on the wrong block.
           *
           * Both then bump renderEpoch, for the same reason a bold does: the array
           * changed length, so React's tree and the contentEditable DOM no longer agree
           * about how many <p>s exist. The rebuild settles it and the caret is restored
           * on the other side.
           */
          const paragraphsOf = (blockIndex: number) => {
            const v = (values.sections[selIdx].blocks[blockIndex]?.value ?? {}) as Record<string, unknown>;
            return { value: v, list: (Array.isArray(v.paragraphs) ? v.paragraphs : []).map(String) };
          };
          const commitParagraphs = (
            blockIndex: number,
            list: string[],
            focusIndex: number,
            caret: number
          ) => {
            const { value } = paragraphsOf(blockIndex);
            setBlockValue(ids.blockIds[selIdx][blockIndex], { ...value, paragraphs: list });
            refocusAfterRebuild.current =
              `[data-edit-block-index="${blockIndex}"][data-edit-value-path="paragraphs.${focusIndex}"]`;
            reselectAfterRebuild.current = {
              kind: "block",
              blockIndex,
              path: `paragraphs.${focusIndex}`,
              label: "Edit paragraph",
            };
            caretAfterRebuild.current = caret;
            setRenderEpoch((n) => n + 1);
          };
          const onParagraphSplit = (blockIndex: number, index: number, before: string, after: string) => {
            const { list } = paragraphsOf(blockIndex);
            // Caret 0: the start of the newly created paragraph, which is where the text
            // after the caret now lives.
            commitParagraphs(blockIndex, splitParagraph(list, index, before, after), index + 1, 0);
          };
          const onParagraphMerge = (blockIndex: number, index: number) => {
            const { list } = paragraphsOf(blockIndex);
            const { paragraphs: next, caret } = mergeParagraph(list, index);
            commitParagraphs(blockIndex, next, index - 1, caret);
          };
          // Write-through on change, the same seams the canvas blur and the Inspector
          // fields use. There is no commit step, so there is nothing to go stale
          // between selecting a field and leaving it.
          const writeSelected = (value: string) => {
            const f = selectedField;
            if (!f) return;
            if (readField(f) === value) return; // no-op, never dirty the draft
            if (f.kind === "section") {
              setSection(selIdx, { ...values.sections[selIdx], [f.field]: value } as RawSection);
              return;
            }
            const curVal = (values.sections[selIdx].blocks[f.blockIndex]?.value ?? {}) as Record<string, unknown>;
            setBlockValue(
              ids.blockIds[selIdx][f.blockIndex],
              setAtPath(curVal, f.path, value) as Record<string, unknown>
            );
          };
          return (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-eyebrow text-ink-400">
                <span>Live preview — click any dashed element to edit it, here or in the panel beside it. Rich text with **bold** edits under Inspector.</span>
                {imageBusy && <span className="text-accent-600 normal-case tracking-normal">Uploading image…</span>}
                {imageError && <span className="text-accent-600 normal-case tracking-normal">{imageError}</span>}
              </div>
              {/* The approved layout: canvas beside a sticky rail for the selected
                  field. Collapses to one column below the studio's lg breakpoint. */}
              <div className="grid items-start gap-[18px] lg:grid-cols-[1fr_240px]">
              <SectionCanvas
                section={values.sections[selIdx]}
                web={web}
                template={template}
                rewriteSrc={rewriteSrc}
                editable
                onBlur={onBlur}
                onSelectField={selectField}
                selectedField={selectedField}
                onRichFocus={setBoldAt}
                onParagraphSplit={onParagraphSplit}
                onParagraphMerge={onParagraphMerge}
                renderEpoch={renderEpoch}
                onReplaceImage={(blockIndex, path) => {
                  pendingImage.current = { selIdx, blockIndex, path };
                  setImageError(null);
                  imageInputRef.current?.click();
                }}
              />
              <BoldToolbar
                at={boldAt}
                onCommand={() => {
                  boldDirty.current = true;
                }}
              />
              <SelectedRail
                selected={selectedField}
                value={selectedField ? readField(selectedField) : ""}
                onChange={writeSelected}
              />
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadReplacement(f);
                }}
              />
            </div>
          );
        })()}
        </div>

        <div id="cs-view-panel-inspector" role="tabpanel" aria-labelledby="cs-view-inspector" hidden={view !== "inspector"} className="flex flex-col gap-4">
        {/* CS-3's Content|Style field split, now nested UNDER the Inspector view (the
            top-level Canvas|Inspector switch sits above). Restored to its honest
            labels: it splits FIELDS, not views, and calling its content half "Canvas"
            while a real canvas sat above it was the confusing part. Same
            roving-tabindex tablist; both panels stay mounted so switching loses no
            input, caret, or draft. */}
        <div role="tablist" aria-label="Section content and style" className="flex gap-1 border-b border-ink-950/8">
          {(["content", "style"] as const).map((t) => {
            const selected = contentStyleTab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                id={`cs-fieldtab-${t}`}
                aria-selected={selected}
                aria-controls="cs-fieldtab-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setContentStyleTab(t)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const other = t === "content" ? "style" : "content";
                  setContentStyleTab(other);
                  requestAnimationFrame(() => document.getElementById(`cs-fieldtab-${other}`)?.focus());
                }}
                className={[
                  "-mb-px border-b-2 px-3 py-1.5 text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500",
                  selected
                    ? "border-accent-500 font-medium text-ink-950"
                    : "border-transparent text-ink-500 hover:text-ink-950",
                ].join(" ")}
              >
                {t === "content" ? "Content" : "Style"}
              </button>
            );
          })}
        </div>
        <FieldTabProvider tab={contentStyleTab}>
        <div id="cs-fieldtab-panel" role="tabpanel" tabIndex={-1} className="flex flex-col gap-6 outline-none">
        <p className="text-[11px] text-text-subtle">
          {contentStyleTab === "content"
            ? "Copy for this section, including the Rich **bold** fields the canvas cannot edit."
            : "Layout, glow, frames, and image geometry for this section."}
        </p>
        {values.sections.map((section, i) => (
          <div
            key={ids.sectionIds[i]}
            hidden={selectedSectionId !== ids.sectionIds[i]}
            className="flex flex-col gap-3 rounded-lg border border-ink-950/8 p-3"
          >
            {confirmRemove === ids.sectionIds[i] ? (
              // Removing a section discards every block in it, and the control sits
              // right beside the reorder arrows — a misclick used to be silent and
              // unrecoverable. Confirms in place, mirroring the PublishBar pattern.
              <div
                role="alertdialog"
                aria-label={`Remove section ${sectionLabel(section, i)}`}
                aria-describedby={`rm-msg-${ids.sectionIds[i]}`}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setConfirmRemove(null);
                }}
                className="flex items-center justify-between gap-2 rounded-md border border-accent-500/30 bg-accent-500/5 px-2.5 py-1.5"
              >
                <span id={`rm-msg-${ids.sectionIds[i]}`} className="min-w-0 flex-1 text-[11px] text-ink-700">
                  Remove this section and its blocks? You can still undo it with Discard until you
                  publish.
                </span>
                <button
                  ref={confirmCancelRef}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setConfirmRemove(null)}
                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setConfirmRemove(null);
                    removeSection(i);
                  }}
                  className="shrink-0 rounded-md border border-accent-500/40 bg-accent-500/10 px-2.5 py-1 text-[11px] text-accent-600 transition-colors hover:bg-accent-500/20"
                >
                  Remove
                </button>
              </div>
            ) : (
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
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmRemove(ids.sectionIds[i])} aria-label={`Remove section ${sectionLabel(section, i)}`} className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5">
                  <IconX />
                </button>
              </div>
            </div>
            )}

            <SectionShellForm
              value={section}
              onChange={(next) => setSection(i, next)}
              onBlur={saveDraft}
              duplicateId={dupeIds.has(section.id)}
            />

            {section.blocks.map((block, j) => {
              const kind = block.discriminant as SectionBlockKind;
              // A kind can exist in the schema before it has a form (VE-1 declares
              // videoEmbed; VE-3 builds its editor). Such a block still has to be
              // listed, reordered and removable, so the row renders with a note where
              // the form would be rather than crashing on a missing registry entry.
              const entry = (BLOCK_REGISTRY as Record<string, (typeof BLOCK_REGISTRY)[EditableBlockKind] | undefined>)[kind];
              if (!entry) {
                return (
                  <div key={ids.blockIds[i][j]} className="rounded-md border border-ink-950/8 bg-cream-100 px-3 py-2">
                    <p className="text-[11px] text-ink-600">
                      {blockLabel(kind)} — no editor yet. It renders on the page once built.
                    </p>
                  </div>
                );
              }
              const id = ids.blockIds[i][j];
              // The registry is keyed by discriminant and each Form is typed to its
              // own kind's value; the lookup cannot express that correlation to the
              // compiler, so it is asserted once, here.
              const Form = entry.Form as React.ComponentType<BlockFormProps<typeof kind>>;
              return (
                <div
                  key={id}
                  // CS-3 — under the Style tab, a copy-only block has nothing to show,
                  // so its card is hidden here (the form stays MOUNTED). Content shows all.
                  hidden={contentStyleTab === "style" && !KIND_HAS_STYLE.has(kind)}
                  className="rounded-lg border border-ink-950/8 bg-cream-50 p-3"
                >
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-medium text-ink-950">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(entry.label as (v: any) => string)(block.value)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-subtle">{blockLabel(kind)}</span>
                      <div className="flex gap-1">
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, j, -1)} disabled={j === 0} aria-label={`Move ${blockLabel(kind)} up`} className={iconBtn}>
                          <IconChevronUp />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, j, 1)} disabled={j === section.blocks.length - 1} aria-label={`Move ${blockLabel(kind)} down`} className={iconBtn}>
                          <IconChevronDown />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeBlock(i, j)} aria-label={`Remove ${blockLabel(kind)}`} className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5">
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
                      {blockLabel(k)}
                    </button>
                  ))}
                </div>
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
        </div>
        </FieldTabProvider>
        </div>

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
