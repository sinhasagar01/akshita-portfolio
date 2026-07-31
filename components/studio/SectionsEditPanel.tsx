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
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import CaseStudySwitcher from "./CaseStudySwitcher";
import type { RawSection, SectionBlockKind } from "@/lib/case-studies/sections-raw";
import { adaptSections } from "@/lib/case-studies/adapter";
import { sectionDisplayLabel } from "@/lib/case-studies/section-label";
import { makeDraftSrcRewriter } from "@/lib/studio/draft-image";
import { CS_MIN_SCALE, CS_PANES_SUM, CS_COLLAPSED_PANES_SUM } from "@/lib/studio/three-pane";
import { useSidebarWidth } from "./SidebarWidthProvider";
import { usePageWidthMin } from "./usePageWidthMin";
import ThreePaneShell from "./ThreePaneShell";
import SectionsRail from "./SectionsRail";
import CollapsibleGroup from "./blocks/CollapsibleGroup";
import { richToMarkers } from "@/lib/studio/rich-markers";
import { isSafeHref, isHttpUrl } from "@/lib/case-studies/adapter";
import SectionRenderer from "@/components/case-study/SectionRenderer";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { moveIn, removeAt, insertAt, setAt } from "./useItemList";
import { splitParagraph, mergeParagraph } from "@/lib/studio/paragraph-edits";
// CS-7d — the two caret primitives, EXTRACTED to be shared with the blog canvas.
// Byte-identical moves; `isSafeHref` is injected into paragraphCaret exactly as
// richToMarkers already takes it, so the shared module holds no URL opinion of its own.
import { paragraphCaret, placeCaret } from "@/lib/studio/inline-caret";
// CS-7d — the rich-text toolbar, EXTRACTED so blog runs the same one. Byte-identical move.
import BoldToolbar from "./BoldToolbar";
import { BLOCK_REGISTRY, BLOCK_LABELS, type BlockFormProps, type EditableBlockKind } from "./blocks/registry";
import { SectionShellForm, emptySection } from "./blocks/SectionShell";

/** Stable empty default — a fresh [] each render would rebuild the rewriter. */
const NO_DRAFT_IMAGES: readonly string[] = [];
import { FieldTabProvider, inputCls, type FieldTab, labelCls, groupLabelCls } from "./blocks/fields";
import { IconChevronUp, IconChevronDown, IconX, IconPlus, IconArrowUpRight } from "./icons";

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

// The label chain lives in one shared place (title -> eyebrow -> humanized id ->
// "Section N") so the board, the focused editor, and the public rail agree and none of
// them ever prints a raw slug. Previously this fell straight to `s.id`, which surfaced
// `hero` / `final-video` / `closing` verbatim.
/** What the editor is pointing at. `"board"` is the overview, `"details"` the study's own
 *  fields, and a tagged id a section. Tagged because every member would otherwise be a string. */
type Selection = "board" | "details" | { id: string };

const sectionLabel = (s: RawSection, i: number) =>
  sectionDisplayLabel({ title: s.title, eyebrow: s.eyebrow, id: s.id }, i);

const iconBtn =
  "grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3.5";

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
  // VE-3 — the frame select, aspect and the optional poster live on the Style tab.
  "videoEmbed",
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
// EXPORTED FOR THE RAIL (PR 7). The flag is a READ, not a write, so it belongs where you
// navigate — the rail row carries it exactly as BlogPostList's row carries published/draft.
// Lifted rather than re-derived: it is string-coupled to the adapter's "image src is missing",
// and a second copy would drift the moment that message changes.
export function sectionNeedsImage(section: RawSection): boolean {
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
    <span className="flex items-center gap-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/6 bg-cream-100 px-2 py-1">
      <span aria-hidden className="shrink-0">
        {IMAGE_KINDS.has(kind) ? (
          <span className="block size-3.5 rounded-[var(--studio-radius-control,4px)] border border-ink-950/20 bg-ink-950/5" />
        ) : GRID_KINDS.has(kind) ? (
          <span className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((n) => (
              <span key={n} className="block size-1.5 rounded-[1px] bg-ink-950/20" />
            ))}
          </span>
        ) : (
          <span className="flex w-3.5 flex-col gap-0.5">
            <span className="block h-0.5 w-full rounded-[var(--studio-radius-control,4px)] bg-ink-950/20" />
            <span className="block h-0.5 w-2/3 rounded-[var(--studio-radius-control,4px)] bg-ink-950/20" />
          </span>
        )}
      </span>
      <span className="truncate text-[12px] text-ink-600">{blockLabel(kind)}</span>
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
      // THE FLOOR IS APPLIED HERE, AND UNTIL NOW NOTHING CONSUMED IT. PR 6 derived
      // `CS_MIN_SCALE` from a rendered comparison and gated it, but this hook still read
      // `Math.min(1, …)` with no lower bound — a gate on an unwired constant, which is the
      // `FIT_THRESHOLD_PX` shape that shipped with zero consumers. Wiring it is what makes
      // that gate stop being aspirational.
      // THE CONSEQUENCE, STATED: below the floor the surface is WIDER than its pane, so the
      // pane pans (overflow-x-auto) instead of shrinking the render. The three-pane
      // thresholds keep the pane at or above 640 at every width the layout claims to fit, so
      // panning is the narrow-viewport path — most visibly below `lg`, where the canvas now
      // holds 50% and pans rather than collapsing to ~29% and staying complete but illegible.
      const next = Math.max(CS_MIN_SCALE, Math.min(1, pane.clientWidth / CANVAS_WIDTH));
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
function useAutoGrow(value: string, ceiling: HTMLElement | null) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  // Track the canvas pane's height. It changes with the section, the viewport, and
  // images loading, so it is observed rather than read once.
  //
  // ---- THE CEILING IS AN ELEMENT, NOT A REF, AND THAT DISTINCTION WAS EARNED --------------
  //
  // Three versions, each fixing the previous one's blind spot, and it is worth keeping the
  // sequence because each looked complete:
  //
  //   1. `textareaRef.current?...` — the textarea only exists once a field is selected, so the
  //      effect ran on mount with nothing there, bailed, and never re-ran. Uncapped.
  //   2. Anchored to the RAIL, which always existed, and walked
  //      `railRef.current?.parentElement?.firstElementChild` to reach the canvas. Correct while
  //      the rail sat in a grid beside the canvas; a DOM walk is a layout assumption.
  //   3. (7a) The ceiling passed in BY REF, named rather than walked to, so a relayout could not
  //      silently retarget it.
  //
  // Moving the rail into the inspector broke 3, and MEASURED IT DOING SO — 3166px of textarea
  // in an 811px pane. A ref only fixed the SUBJECT; the effect still keyed on the ref object,
  // which never changes, so it ran once at mount. The rail now lives in the inspector, which
  // mounts with the page, while the canvas div appears only once a section is selected. So the
  // effect ran, found `null`, bailed, and never re-ran — the exact failure of version 1, reached
  // by a different road. Version 3's own comment predicted this shape and still did not prevent
  // it, because naming a BOX that might be empty is not the same as naming what is in it.
  //
  // So the ceiling is the ELEMENT, held in state by a callback ref at the call site. The effect
  // keys on the node, so it re-runs the moment one mounts or unmounts. There is no ordering left
  // to get wrong.
  useEffect(() => {
    if (!ceiling) return; // keeps the LAST measurement — see the call site
    const measure = () => setMaxHeight(ceiling.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ceiling);
    return () => ro.disconnect();
  }, [ceiling]);

  // Reset to auto before reading scrollHeight, or the box can only ever grow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cap = maxHeight ?? Number.POSITIVE_INFINITY;
    el.style.height = `${Math.min(el.scrollHeight, cap)}px`;
  }, [value, maxHeight]);

  return { ref, maxHeight };
}

function SelectedRail({
  selected,
  value,
  onChange,
  ceiling,
  hidden,
}: {
  selected: SelectedField | null;
  /** Read straight from form state on every render — see the panel's `readField`. */
  value: string;
  onChange: (v: string) => void;
  /** The element whose height caps this textarea — the NODE, not a ref to it, so the observer
   *  re-runs when it mounts. See `useAutoGrow` for why that distinction cost a measurement. */
  ceiling: HTMLElement | null;
  /** Hidden under Details, never unmounted — see the call site. */
  hidden?: boolean;
}) {
  const { ref: taRef, maxHeight } = useAutoGrow(value, ceiling);
  return (
    // THE RAIL IS THE SURFACE ITS TEXTAREA SITS ON, so it takes the ground one step up from the
    // pane it sits in while the textarea keeps `inputCls`'s cream-50. That relation is the rule;
    // the VALUE follows from wherever the rail currently lives, which is why moving it changed it.
    //
    // PR 2 left a note here saying this must become cream-200 when the body section was righted.
    // The body section is GONE — the shell owns the frame now — so the value is re-derived rather
    // than carried over, and it lands in the same place: ThreePaneShell's inspector pane is
    // `bg-cream-100` (:232), so a cream-100 rail would be 1.00 against it and invisible, exactly
    // the collision PR 2 measured on the old ground. cream-200 it is, for a new reason.
    //
    // AND radius-card, NOT radius-panel. It used to be a panel inside a panel inside a panel;
    // with the shell as the frame it is a card in a pane, the same level as the block cards it
    // sits above, so one radius-panel is left at the outermost level where it belongs.
    <aside
      hidden={hidden}
      className="sticky top-0 z-10 rounded-[var(--studio-radius-card,8px)] border border-ink-950/22 bg-cream-200 p-3.5"
    >
      <p className={labelCls}>
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
          //
          // AND `50dvh`, WHICH THE MOVE MADE NECESSARY. The JS ceiling is the CANVAS height,
          // which was the right and only bound while the rail sat beside the canvas. In the
          // inspector it is no longer the thing the rail must not overflow — measured on a tall
          // section, the canvas is 1034 and the pane is 811, so the JS cap alone let the rail
          // grow past the container it is `sticky` inside, which makes sticky meaningless. The
          // second term is the rail's new home expressed as the half-screen it may not exceed,
          // so the fields under it stay reachable. CSS `min()` rather than another observer:
          // `dvh` already tracks the viewport the pane fills.
          style={{ maxHeight: maxHeight ? `min(${maxHeight}px, 50dvh)` : undefined }}
          className={`${inputCls} mt-2 resize-none overflow-y-auto`}
        />
      ) : null}
      <p className="mt-2 text-[12px] text-text-subtle">
        {selected
          ? "Edits here and on the canvas are the same field."
          : "Click any dashed element on the canvas to edit it here. The title and facts come from Details."}
      </p>
    </aside>
  );
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
      className="case-study canvas-static canvas-surface overflow-hidden rounded-[var(--studio-radius-card,8px)] border border-ink-950/12"
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
        const at = paragraphCaret(e.target as HTMLElement, (d) => richToMarkers(d, isSafeHref));
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
          <p className="px-4 py-6 text-center text-[12px] text-text-subtle">
            This section can’t be previewed yet — finish its required fields.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SectionsEditPanel({
  slug,
  title,
  sections: initialSections,
  template = "",
  draftImages = NO_DRAFT_IMAGES,
  detailsNode,
  detailsDirty = false,
  livePath,
  studies,
}: {
  slug: string;
  /** The study's name, for the crumb row — identity lives there once now. */
  title: string;
  sections: readonly RawSection[];
  /** The study's own fields, rendered by ProjectsEditPanel and mounted in the INSPECTOR when
   *  the rail's Details entry is selected. Passed as a node so that panel keeps its own
   *  useDraftForm — two forms, two save seams, exactly as before. */
  detailsNode?: ReactNode;
  /** Whether that form has unsaved edits, for the rail's Details marker. */
  detailsDirty?: boolean;
  /** Resolved server-side; see the route. */
  livePath: string;
  /** Every study, for the crumb row's switcher. */
  studies: { slug: string; title: string }[];
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
  // CS-2/PR 7 — ONE STATE, THREE ANSWERS. The board/section split was already toggle-driven
  // (`selectedSectionId === null` meant the board); PR 7 extends that same state with `details`
  // rather than adding a second one beside it. A tagged section keeps the union honest — every
  // member is a string otherwise, so `"details"` and a section id would be indistinguishable.
  //
  // `selectedSectionId` REMAINS, DERIVED. Ten call sites read it and none of them care how the
  // rail spells its selection, so it stays a `string | null` and only the SETTERS moved.
  const [selection, setSelection] = useState<Selection>("board");
  const selectedSectionId = typeof selection === "object" ? selection.id : null;
  const showBoard = selection === "board";
  const showDetails = selection === "details";
  // Below this the inspector pane folds and the crumb row's view toggle becomes the route to
  // those fields. Its own DERIVED sum rather than blog's chosen 1100, because below it
  // the canvas drops under its 50% floor even with the rail collapsed, which is the width at
  // which folding the inspector is the only lever left.
  // THE SIDEBAR IS ADJUSTABLE, SO THE THRESHOLD IS A SUM RATHER THAN A CONSTANT. The composite
  // constants were deleted in the resize PR: a number true only at a 236px sidebar is worse than
  // no number once the studio ships a control whose purpose is to move off 236. What stayed
  // constant is the panes; the sidebar term arrives live.
  const sidebarPx = useSidebarWidth();
  const inspectorFits = usePageWidthMin(sidebarPx + CS_COLLAPSED_PANES_SUM);
  // Where the Editor toggle returns to. Without it, leaving the Board would have to guess, and
  // guessing "the first section" loses the place an author was working in.
  const lastEditedRef = useRef<Selection>("details");
  if (!showBoard) lastEditedRef.current = selection;
  const selIdxTop = selectedSectionId === null ? -1 : ids.sectionIds.indexOf(selectedSectionId);
  // The Selected rail's height ceiling, held as the ELEMENT so its observer re-runs when the
  // canvas mounts — see `useAutoGrow`. When the canvas is absent (Details, the Board, or below
  // the fold with the inspector in the canvas slot) this goes null and the hook KEEPS its last
  // measurement rather than uncapping. That is safe rather than lucky: a textarea only renders
  // when `selectedField` is set, and the only way to set it is to click a field on the canvas,
  // so a measurement always precedes the box it caps.
  const [canvasCeiling, setCanvasCeiling] = useState<HTMLDivElement | null>(null);

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
    setSelection("board");
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
    if (ids.sectionIds[i] === selectedSectionId) setSelection("board");
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
    setSelection({ id: newId }); // jump straight into the new section
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
  // The registry's keys ARE the offerable set, so the picker follows it with no filter
  // to maintain. Every kind has a form now (VE-3), so all of them are offered.
  const addableKinds = Object.keys(BLOCK_REGISTRY) as EditableBlockKind[];

  // VE-3 — a videoEmbed whose src is NON-EMPTY but not an http(s) URL blocks Save, the
  // same verdict the form shows inline. An EMPTY src does not: a born-empty block is a
  // valid draft state, refused only at publish. This is the one block field where a bad
  // value is worth stopping before the server round-trip, because the server would
  // reject the whole patch and the owner would not know which block.
  const hasBadVideoSrc = values.sections.some((s) =>
    s.blocks.some((b) => {
      if (b.discriminant !== "videoEmbed") return false;
      const src = String((b.value as { src?: unknown }).src ?? "");
      return src.trim() !== "" && !isHttpUrl(src);
    })
  );

  // THE BOARD. Presentational and edit-state-free — no form state lives here — so it is the ONE
  // thing in this file that may be conditionally rendered. Its job narrowed with the rail: the
  // rail navigates while you work, the Board shows the shape of the whole study at once, which
  // a 264px rail cannot. Reached from the crumb row rather than a back link.
  const boardNode = (
    <div className="overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-4 px-4 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {values.sections.map((section, i) => {
              const name = sectionLabel(section, i);
              const count = section.blocks.length;
              const needsImage = sectionNeedsImage(section);
              return (
                <div
                  key={ids.sectionIds[i]}
                  className="relative flex flex-col gap-2 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-50 p-3 transition-colors hover:border-accent-500/40 hover:bg-cream-100"
                >
                  {/* The whole card selects; the reorder arrows are SIBLINGS of this
                      button, never nested, so the markup stays valid. The overlay sits
                      under the content, which is pointer-transparent, so a click anywhere
                      but the arrows opens the section. */}
                  <button
                    type="button"
                    onClick={() => setSelection({ id: ids.sectionIds[i] })}
                    aria-label={`Edit section ${name}, ${count} ${count === 1 ? "block" : "blocks"}${needsImage ? ", needs an image" : ""}`}
                    className="absolute inset-0 z-0 rounded-[var(--studio-radius-card,8px)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
                  />
                  <div className="pointer-events-none relative z-[1] flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      {/* THE AUTHOR'S OWN CONTENT, NOT CHROME — this renders `section.eyebrow`,
                          text the author wrote, so it is out of the label sweep by role. It is
                          left at ink-400 DELIBERATELY AND THE NUMBER IS RECORDED: measured 3.49
                          against this card's cream-50, which is below the 4.5 AA floor. It is
                          not fixed here because recolouring a preview of authored content is a
                          design decision about how content reads in the editor, not a chrome
                          repaint — and PR 7 restructures this board. Fix it there, with intent. */}
                      {section.eyebrow && (
                        <span className="truncate text-[10px] uppercase tracking-eyebrow text-ink-400">
                          {section.eyebrow}
                        </span>
                      )}
                      <span className="truncate font-display text-[14px] text-ink-950">{name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="rounded-full border border-ink-950/10 px-2 py-0.5 text-[10px] text-text-subtle">
                        {count} {count === 1 ? "block" : "blocks"}
                      </span>
                      {/* Reorder — the SAME moveSection/structural() choke point the
                          focused editor uses, so {sectionIds, blockIds} and sections move
                          in lockstep and ids can never drift. */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => moveSection(i, -1)}
                        disabled={i === 0}
                        aria-label={`Move section ${name} up`}
                        className={`pointer-events-auto ${iconBtn} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500`}
                      >
                        <IconChevronUp />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => moveSection(i, 1)}
                        disabled={i === values.sections.length - 1}
                        aria-label={`Move section ${name} down`}
                        className={`pointer-events-auto ${iconBtn} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500`}
                      >
                        <IconChevronDown />
                      </button>
                    </div>
                  </div>
                  <div className="pointer-events-none relative z-[1] flex flex-col gap-1">
                    {count === 0 ? (
                      <span className="text-[12px] text-text-subtle">No blocks yet</span>
                    ) : (
                      section.blocks.map((block, j) => (
                        <BlockSkeleton
                          key={ids.blockIds[i][j]}
                          kind={block.discriminant as SectionBlockKind}
                        />
                      ))
                    )}
                  </div>
                  {needsImage && (
                    <span className="pointer-events-none relative z-[1] inline-flex w-fit items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                      Needs an image
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> Add a section
          </button>
        </div>
    </div>
  );

  // THE SELECTED FIELD'S ACCESSORS, AT PANEL SCOPE. They were local to the canvas IIFE while the
  // rail lived beside the canvas; the rail is in the INSPECTOR now, so the two nodes that need
  // them no longer share a closure. Hoisting is not a rewrite — `selIdx` inside the IIFE was
  // defined byte-for-byte as `selIdxTop` is here, so the same index reaches the same seams. The
  // duplicate derivation went with it, since one answer with two definitions is how they drift.
  //
  // The rail edits the SAME field the canvas does, so it reads and writes through these rather
  // than keeping its own copy. Read on render, write through on change, no commit step — there
  // is nothing that can go stale between selecting a field and leaving it.
  const readField = (f: SelectedField): string => {
    // No section selected — Details, or the Board. `selectedField` can still be set from the
    // last section visited, and `values.sections[-1]` would throw on the very next line. This
    // guard is new because the rail is now mounted in a pane that outlives the selection that
    // filled it; beside the canvas it only ever existed inside a `selIdx < 0` early return.
    if (selIdxTop < 0) return "";
    if (f.kind === "section") {
      const cur = values.sections[selIdxTop] as unknown as Record<string, unknown>;
      return String(cur[f.field] ?? "");
    }
    const curVal = (values.sections[selIdxTop].blocks[f.blockIndex]?.value ?? {}) as Record<string, unknown>;
    return String(getAtPath(curVal, f.path) ?? "");
  };
  const writeSelected = (value: string) => {
    const f = selectedField;
    if (!f || selIdxTop < 0) return; // same reason as `readField`'s guard

    if (readField(f) === value) return; // no-op, never dirty the draft
    if (f.kind === "section") {
      setSection(selIdxTop, { ...values.sections[selIdxTop], [f.field]: value } as RawSection);
      return;
    }
    const curVal = (values.sections[selIdxTop].blocks[f.blockIndex]?.value ?? {}) as Record<string, unknown>;
    setBlockValue(
      ids.blockIds[selIdxTop][f.blockIndex],
      setAtPath(curVal, f.path, value) as Record<string, unknown>
    );
  };

  // THE CANVAS PANE, AND NOW IT IS ONLY THE CANVAS. The Selected rail used to sit beside it in a
  // `lg:grid-cols-[1fr_240px]` grid, which spent 240 of the pane's 640 on a textarea — so the
  // canvas rendered into 382px and PR 6's 50% floor was a claim about a pane that did not exist.
  // With the rail gone to the inspector the pane is the canvas, and the floor becomes measurable.
  //
  // It holds no form state — it is a render — so unmounting it below the fold (where the
  // inspector takes this slot) costs nothing. That is the asymmetry that makes the fold safe:
  // the INSPECTOR is the one that must render exactly once, and it does.
  const canvasNode = (
    <div className="min-w-0">
        {/* CS-7c — the inline canvas: a live, read-only render of the selected
            section above the forms. The forms stay the edit surface (CS-7d moves
            editing onto the canvas). */}
        {(() => {
          const selIdx = selIdxTop;
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
          return (
            <div>
              {/* HELP TEXT, NOT A LABEL — so it keeps its own string rather than taking
                  `labelCls`: it is a sentence, and setting it bold-700 would shout. Only the
                  COLOUR moved, ink-400 -> ink-600, because ink-400 measured 3.49 here against
                  cream-50 and 12px is not WCAG large text, so it was below the 4.5 floor. */}
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] uppercase tracking-eyebrow text-ink-600">
                <span>Live preview — click any dashed element to edit it, here or in the panel beside it. Rich text with **bold** edits under Inspector.</span>
                {imageBusy && <span className="text-accent-600 normal-case tracking-normal">Uploading image…</span>}
                {imageError && <span className="text-accent-600 normal-case tracking-normal">{imageError}</span>}
              </div>
              {/* No grid. The pane IS the canvas — see the note on `canvasNode`. This div stays
                  because it is the height ceiling the Selected rail's textarea clamps against from
                  its new home in the inspector, captured by callback ref. */}
              <div ref={setCanvasCeiling} className="min-w-0">
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
  );

  // THE INSPECTOR PANE, AND IT MUST RENDER EXACTLY ONCE. Every section editor and every block
  // card lives in here, hidden rather than unmounted, so a second copy would be two form trees
  // sharing one onChange with colliding ids and two carets. Above the fold it mounts in the
  // shell's inspector slot; below it, in the canvas slot. One node, one parent, chosen in JS.
  const inspectorNode = (
    <div className="flex flex-col gap-4">
      {/* THE SELECTED RAIL, AT THE TOP OF THE INSPECTOR. It edits the field the canvas has
          selected, so it belongs with the fields rather than on top of the render — and beside
          the canvas it was costing that render 240 of its 640. Changing parent is all this is:
          same `readField`/`writeSelected`, same textarea, same `useAutoGrow` ceiling.
          It is HIDDEN under Details rather than dropped, for the reason everything else in this
          pane is: Details has no canvas to select from, so a rail there would name a field you
          cannot click, but unmounting it would throw away the caret of whoever is mid-word when
          they glance at Details. Hidden, like its neighbours. */}
      <SelectedRail
        hidden={showDetails}
        ceiling={canvasCeiling}
        selected={selectedField}
        value={selectedField ? readField(selectedField) : ""}
        onChange={writeSelected}
      />

      {/* THE DETAILS FORM, MOUNTED AND HIDDEN like every section editor beside it — it carries
          its own draft state, so a conditional render here would drop an in-progress edit the
          moment you clicked a section. This is also what makes Save draft reachable again: it
          used to live INSIDE the collapsed disclosure, so closing the strip hid the only control
          that saved it. */}
      {detailsNode ? <div hidden={!showDetails}>{detailsNode}</div> : null}
        {/* CS-3's Content|Style field split, now nested UNDER the Inspector view (the
            top-level Canvas|Inspector switch sits above). Restored to its honest
            labels: it splits FIELDS, not views, and calling its content half "Canvas"
            while a real canvas sat above it was the confusing part. Same
            roving-tabindex tablist; both panels stay mounted so switching loses no
            input, caret, or draft. */}
        <div role="tablist" aria-label="Section content and style" className="flex gap-1 border-b border-ink-950/12">
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
                    : "border-transparent text-ink-600 hover:text-ink-950",
                ].join(" ")}
              >
                {t === "content" ? "Content" : "Style"}
              </button>
            );
          })}
        </div>
        <FieldTabProvider tab={contentStyleTab}>
        <div id="cs-fieldtab-panel" role="tabpanel" tabIndex={-1} className="flex flex-col gap-6 outline-none">
        <p className="text-[12px] text-text-subtle">
          {contentStyleTab === "content"
            ? "Copy for this section, including the Rich **bold** fields the canvas cannot edit."
            : "Layout, glow, frames, and image geometry for this section."}
        </p>
        {values.sections.map((section, i) => (
          <div
            key={ids.sectionIds[i]}
            hidden={selectedSectionId !== ids.sectionIds[i]}
            className="flex flex-col gap-3 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 p-3"
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
                className="flex items-center justify-between gap-2 rounded-[var(--studio-radius-control,4px)] border border-accent-500/30 bg-accent-500/5 px-2.5 py-1.5"
              >
                <span id={`rm-msg-${ids.sectionIds[i]}`} className="min-w-0 flex-1 text-[12px]">
                  Remove this section and its blocks? You can still undo it with Discard until you
                  publish.
                </span>
                <button
                  ref={confirmCancelRef}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setConfirmRemove(null)}
                  className="shrink-0 rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
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
                  className="shrink-0 rounded-[var(--studio-radius-control,4px)] border border-accent-500/40 bg-accent-500/10 px-2.5 py-1 text-[12px] text-accent-600 transition-colors hover:bg-accent-500/20"
                >
                  Remove
                </button>
              </div>
            ) : (
            <div className="flex items-center justify-between gap-2">
              <h3 className={labelCls}>
                {sectionLabel(section, i)}
              </h3>
              <div className="flex gap-1">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label={`Move section ${sectionLabel(section, i)} up`} className={iconBtn}>
                  <IconChevronUp />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveSection(i, 1)} disabled={i === values.sections.length - 1} aria-label={`Move section ${sectionLabel(section, i)} down`} className={iconBtn}>
                  <IconChevronDown />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setConfirmRemove(ids.sectionIds[i])} aria-label={`Remove section ${sectionLabel(section, i)}`} className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5">
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
                  <div key={ids.blockIds[i][j]} className="rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-100 px-3 py-2">
                    <p className="text-[12px] text-ink-600">
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
                <CollapsibleGroup
                  key={id}
                  // CS-3 — under the Style tab, a copy-only block has nothing to show,
                  // so its card is hidden here (the form stays MOUNTED). Content shows all.
                  hidden={contentStyleTab === "style" && !KIND_HAS_STYLE.has(kind)}
                  className="rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-50 p-3"
                  // OPEN BY DEFAULT, AND THE DATA IS WHY. The contract asked for every block to
                  // fold except the one being edited; measured, 12 of the 14 sections in
                  // elevate-one-view have exactly ONE block, so that default is a no-op on 86%
                  // of the content and on the other 14% it folds the only thing on screen.
                  // The affordance is still worth having for the two multi-block sections —
                  // it just is not worth having on by default.
                  defaultOpen
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  summary={(entry.label as (v: any) => string)(block.value)}
                  summaryClassName="text-[12px] font-medium text-ink-950"
                  controls={
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-subtle">{blockLabel(kind)}</span>
                      <div className="flex gap-1">
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, j, -1)} disabled={j === 0} aria-label={`Move ${blockLabel(kind)} up`} className={iconBtn}>
                          <IconChevronUp />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => moveBlock(i, j, 1)} disabled={j === section.blocks.length - 1} aria-label={`Move ${blockLabel(kind)} down`} className={iconBtn}>
                          <IconChevronDown />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => removeBlock(i, j)} aria-label={`Remove ${blockLabel(kind)}`} className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5">
                          <IconX />
                        </button>
                      </div>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-2">
                    <Form
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      value={block.value as any}
                      onChange={(next) => setBlockValue(id, next)}
                      onBlur={saveDraft}
                      slug={slug}
                      /* PR 3a — this panel edits case studies, so its uploads land in the
                         projects image tree. The blog editor (PR 3c) passes "blog". */
                      collection="projects"
                    />
                  </div>
                </CollapsibleGroup>
              );
            })}

            {picker === ids.sectionIds[i] ? (
              <div className="flex flex-col gap-2 rounded-[var(--studio-radius-control,4px)] border border-accent-500/30 bg-cream-100 p-3">
                <span className={groupLabelCls}>Add a block</span>
                <div className="flex flex-wrap gap-1.5">
                  {addableKinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => addBlock(i, k)}
                      className="rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:border-accent-500/40 hover:text-accent-600"
                    >
                      {blockLabel(k)}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setPicker(null)} className="w-fit rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] text-ink-600 hover:text-ink-950">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPicker(ids.sectionIds[i])}
                className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
              >
                <IconPlus /> Add a block
              </button>
            )}
          </div>
        ))}
        </div>
        </FieldTabProvider>
      <p className="text-[10px] text-text-subtle">Wrap words in **double asterisks** to bold them.</p>
    </div>
  );
  return (
    <>
      {/* THE CRUMB ROW — identity and actions, once, and ALWAYS RENDERED. It is `flex-none` and
          sits above the split, so the Board/Editor toggle survives at every width including
          below the fold. That matters because add and remove live on the Board: if the toggle
          could scroll away or collapse with a pane, those two operations would become
          unreachable on a narrow screen.

          CREAM-200, BECAUSE THIS IS THE HEADER THE LADDER WAS ABOUT. The body section PR 2 left a
          note against is gone, so "header cream-100 -> cream-200" has to land on whatever plays
          that role now, and this row does. It was cream-50 — one step further inverted than the
          header it replaced — sitting directly above the shell's cream-50 canvas column, which is
          the collision the ladder exists to prevent. Chrome is cream-200, the same value the
          shell's own list pane takes (:169). The footer below takes it for the same reason. */}
      <div className="flex flex-none items-center gap-3 border-b border-ink-950/12 bg-cream-200 px-[18px] py-[11px]">
        {/* BACK, SWITCHER AND VIEW LIVE, RE-HOMED FROM THE ROUTE. They sat in a padded bar the
            route drew above the panel; that bar went with STUDIO_PAGE, because a full-height
            shell has to reach the viewport edges and a second header above it would compete
            with this one. Same controls, same hrefs, one row. */}
        <Link
          href="/studio/projects"
          // Colour on the span, not the Link — hazard 22. `a { color: inherit }` is unlayered
          // and beats text-* on the anchor; see BlogPostList for the full note.
          className="group shrink-0 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-2.5 py-1 text-[12px] font-semibold transition-colors hover:bg-cream-100"
        >
          <span className="text-ink-600 transition-colors group-hover:text-ink-950">← Case studies</span>
        </Link>
        <span className="truncate font-display text-[17px] text-ink-950">{title}</span>
        <span className="shrink-0 rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] uppercase tracking-eyebrow text-ink-600">
          {template === "web" ? "Web" : "Mobile"}
        </span>
        <span className="flex-1" />
        <CaseStudySwitcher current={slug} options={studies} />
        <a
          href={livePath}
          target="_blank"
          rel="noreferrer"
          className="hidden shrink-0 items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-2.5 py-1 text-[12px] font-semibold transition-colors hover:border-accent-500 sm:inline-flex [&>svg]:size-3"
        >
          <span className="text-ink-600">View live</span> <IconArrowUpRight />
        </a>
        {/* BOARD | EDITOR. Not new machinery — `selection` already encoded the board as a state,
            so this is that state getting a control instead of a back link. */}
        <div role="group" aria-label="View" className="inline-flex shrink-0 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 p-0.5">
          {([["board", "Board"], ["editor", "Editor"]] as const).map(([v, label]) => {
            const on = v === "board" ? showBoard : !showBoard;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => setSelection(v === "board" ? "board" : lastEditedRef.current)}
                className={`rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                  on ? "bg-accent-500 text-cream-50" : "text-ink-600 hover:text-ink-950"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* THE BOARD SHOWS **OVER** THE SHELL, NEVER INSTEAD OF IT, AND THIS IS THE ONE THING IN
          THIS PR MOST LIKELY TO BE WRITTEN WRONG. The natural composition —
          `{showBoard ? <Board/> : <Shell/>}` — reads correctly, compiles, and works, right up
          until someone with a dirty edit opens the Board: the shell unmounts, every section
          editor and block card in the inspector goes with it, and the draft, the caret and the
          id-lockstep are gone. It would look like it worked. So the shell is HIDDEN, never
          swapped — exactly as the section editors inside it are hidden rather than unmounted.
          `mount-discipline` in ralph drives this rather than reading the class string, because
          the defect is a runtime unmount. */}
      {showBoard && boardNode}

      <div hidden={showBoard} className="flex min-h-0 flex-1">
        <ThreePaneShell
          fitThresholdPx={sidebarPx + CS_PANES_SUM}
          listNoun="sections"
          list={
            <SectionsRail
              sections={values.sections}
              sectionIds={ids.sectionIds}
              selection={selection === "details" ? "details" : (selectedSectionId ?? "")}
              onSelect={(next: string) => setSelection(next === "details" ? "details" : { id: next })}
              onMove={moveSection}
              needsImage={sectionNeedsImage}
              detailsDirty={detailsDirty}
            />
          }
          canvasBar={
            <>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-950">
                {showDetails ? "Details" : selIdxTop < 0 ? "" : sectionLabel(values.sections[selIdxTop], selIdxTop)}
              </span>
              {/* The view toggle exists ONLY below the fold, where the inspector pane is gone and
                  this is the route to those fields — the same rule the blog shell uses. */}
              {!inspectorFits && (
                <div role="group" aria-label="Editor view" className="inline-flex shrink-0 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 p-0.5">
                  {(["canvas", "inspector"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={`rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] font-semibold capitalize transition-colors ${
                        view === v ? "bg-accent-500 text-cream-50" : "text-ink-600 hover:text-ink-950"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </>
          }
          canvas={!inspectorFits && view === "inspector" ? inspectorNode : canvasNode}
          inspector={inspectorFits ? inspectorNode : null}
        />
      </div>

      {/* CREAM-200 for the same reason as the crumb row. Two chrome bars bracketing the split
          must be the same ground, or the page has two answers to one question. */}
      <footer className="flex flex-none items-center justify-between gap-3 border-t border-ink-950/12 bg-cream-200 px-4 py-3">
        <span className="text-[12px]" aria-live="polite">
          {saveStatus === "saving" ? (
            <span className="text-text-subtle">Saving draft…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-accent-600">Draft saved</span>
          ) : saveStatus === "error" ? (
            <span className="text-accent-600">Save failed. Try again.</span>
          ) : saveStatus === "fs" ? (
            <span className="text-text-subtle">Draft save needs github mode (dev)</span>
          ) : hasBadVideoSrc ? (
            <span className="text-danger-600">A video URL must be http:// or https://.</span>
          ) : (
            <span className="text-text-subtle">Auto-saves to draft on blur. Preview to see it.</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {/* CANCEL, RE-HOMED. It lived in the body panel's header, which the crumb row replaced.
              It reverts this form's draft, so it belongs beside the save it undoes rather than
              disappearing with the bar that happened to hold it. */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancel}
            className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || saveStatus === "saving" || hasBadVideoSrc}
            className="rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[14px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {/* "Save sections" — the other half of #200's second instance; see the note on
                ProjectsEditPanel's footer button. */}
            {saveStatus === "saving" ? "Saving…" : "Save sections"}
          </button>
        </div>
      </footer>
    </>
  );
}
