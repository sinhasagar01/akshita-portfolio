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
import { createPreviewMap, type PreviewMap } from "@/lib/studio/preview-map";
import { CS_MIN_SCALE, CS_PANES_SUM, CS_COLLAPSED_PANES_SUM } from "@/lib/studio/three-pane";
import { useSidebarWidth } from "./SidebarWidthProvider";
import { usePageWidthMin } from "./usePageWidthMin";
import ThreePaneShell from "./ThreePaneShell";
import SaveBar from "./SaveBar";
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
import { IconChevronUp, IconChevronDown, IconChevronRight, IconX, IconPlus, IconArrowUpRight, IconInfo } from "./icons";
import SectionMini from "./SectionMini";

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
    <span className="flex items-center gap-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/6 bg-cream-100 px-2 py-1 transition-[background-color,color] duration-[var(--studio-lift-t,200ms)] delay-[var(--studio-t3-delay,90ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] group-hover:bg-cream-200">
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
      <span className="truncate text-[12px] text-ink-600 transition-colors duration-[var(--studio-lift-t,200ms)] delay-[var(--studio-t3-delay,90ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] group-hover:text-ink-950">
        {blockLabel(kind)}
      </span>
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

/**
 * The same selector, built from the SELECTION rather than from an element.
 *
 * `fieldSelector` above goes element -> selector; this goes field -> selector, and the two
 * must produce the identical string or the canvas mark and anything else that looks a field up
 * would address different nodes. It was inline inside `SectionCanvas`'s marking effect and is
 * lifted here the moment a second caller appeared (Escape, which has to find the node it is
 * returning focus to) — one construction, two readers.
 */
function selectorForField(f: SelectedField): string {
  return f.kind === "section"
    ? `[data-edit="${f.field}"]`
    : `[data-edit-block-index="${f.blockIndex}"][data-edit-value-path="${f.path}"]`;
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

/** Room for the card's own ring, which `overflow-hidden` was slicing off.
 *
 *  `.section-card`'s hairline is `box-shadow: 0 0 0 1px`, spread with no offset, so it extends
 *  1px OUTSIDE the border box on every side. The card's top edge sat exactly on the pane's top
 *  edge — measured, `cardTop - paneTop` was 0 — so the ring was drawn at -0.65 and the pane's
 *  clip cut it, which reads as a slashed top border rather than as a missing one.
 *  1px IS DERIVED, NOT PICKED. The ring is 1px times the scale, and the scale is capped at 1, so
 *  a single unscaled pixel covers it at every canvas width. */
const CANVAS_PAD_TOP = 1;

/** 2rem below the card.
 *
 *  THE CARD'S OWN `margin-bottom: 28px` NEVER RENDERED HERE, which is why this is padding on the
 *  pane rather than a change to that margin. `.container-x` has padding-inline only — no
 *  padding-bottom, no border — so the last child's bottom margin COLLAPSES straight through it
 *  and out of `offsetHeight`. Measured, the gap below the card was -0.19px, not the 18.09 that
 *  28 times the scale would have given. Padding on the pane cannot collapse, and being outside
 *  the transform it is a true 2rem at every scale instead of a shrinking one. */
const CANVAS_PAD_BOTTOM = 32;

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
      // The pane's height is DRIVEN, so the padding has to be added here or it would be clipped
      // by the very height that is meant to hold it — box-sizing is border-box, so an explicit
      // height that ignored the padding would eat it rather than sit inside it.
      setHeight(surface.offsetHeight * next + CANVAS_PAD_TOP + CANVAS_PAD_BOTTOM);
      // PUBLISHED FOR THE SIBLINGS DRAWN OUTSIDE THE SCALED BOX. The help strip has to
      // line up with the section card, and the card's on-screen inset is its own margin
      // plus `container-x`'s padding TIMES this scale — so a sibling cannot derive it
      // from CSS alone. Written to the shared scope rather than lifted into React state
      // because a state write here would re-render the whole panel on every resize tick,
      // and nothing in the tree needs to re-render for a margin to change.
      pane.closest<HTMLElement>("[data-canvas-scope]")?.style.setProperty("--cs-canvas-scale", String(next));
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
 * T0 · THE REVEAL. Scroll the clicked element into view ONLY IF IT IS OUT OF VIEW.
 *
 * THE CONDITION IS THE DECISION, not an optimisation. This refines the earlier "the canvas
 * does not scroll" rule rather than reversing it: the objection was moving the pane out from
 * under someone who was already looking at the thing, and that only happens when the thing is
 * ALREADY VISIBLE. When it is off-screen there is nobody to disturb, and a mark nobody can
 * see is not a mark. Returns whether it moved, so the gate can assert BOTH directions — a
 * scroll that always fires is this decision reversed by accident.
 *
 * NO `behavior` KEY, AND THAT IS THE WHOLE REDUCED-MOTION STORY. The scroller carries
 * `scroll-smooth` in CSS (ThreePaneShell), and the global reset's
 * `scroll-behavior: auto !important` overrides it under reduce. Passing `behavior: "smooth"`
 * here would BEAT that reset — which is #198 exactly, and why this file needs no
 * `useReducedMotion`. The scroll becomes instant under reduce rather than disappearing, so
 * "you can see what you selected" survives a motion preference.
 *
 * THE SCROLLER IS FOUND BY WALKING UP rather than by holding a ref. The canvas pane is the
 * scroller above `lg`, the document is below it, and below the inspector fold the inspector
 * is mounted INSIDE the canvas slot — three arrangements, one of which ThreePaneShell owns
 * and none of which this file should encode. Walking finds whichever is real.
 */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    // DECLARED overflow only. The obvious extra condition — `scrollHeight > clientHeight`,
    // "is it actually scrolling right now" — is WRONG HERE and cost a measurement to find:
    // with the dock closed the canvas often does not overflow, so the walk skipped straight
    // past the real scroller and the reveal bailed. What then moved the pane was the BROWSER'S
    // native focus scroll on the contentEditable, which lands the element just inside the
    // pre-dock viewport — and the dock then opened underneath it and pushed it back out.
    // The element that is about to need scrolling is not the element that is scrolling now.
    if (o === "auto" || o === "scroll") return n;
  }
  return null;
}

/**
 * Where `el` would have to be scrolled to, or null when it is already in view.
 *
 * ONE DEFINITION OF "IN VIEW", TWO CALLERS. `revealIfNeeded` scrolls with it and `willReveal`
 * only asks — and the asking matters, because the caller has to decide whether to delay the mark
 * BEFORE the scroll is issued. Computing the test twice is how the two answers drift apart, and
 * a "will it scroll" that disagrees with "did it scroll" would time the mark against a scroll
 * that never happened.
 */
function revealTarget(el: HTMLElement): { scroller: HTMLElement; top: number } | null {
  const scroller = scrollParent(el);
  if (!scroller) return null;
  const e = el.getBoundingClientRect();
  const s = scroller.getBoundingClientRect();
  const pad = 16;

  // THE DOCK IS ABOUT TO EAT THE BOTTOM OF THIS VIEWPORT, AND THE REVEAL HAS TO KNOW.
  // MEASURED, NOT REASONED: the first version scrolled against the CURRENT scroller height,
  // then `setSelectedField` opened the dock, the scroller lost 113px, and the element it had
  // just revealed was pushed back out of view. T0 fired, `scrollTop` changed, every property
  // was true — and you still could not see what you clicked. The affordance is "you can see
  // it", so that is what has to be measured.
  //
  // The dock is ALWAYS MOUNTED and collapsed by `max-height` with `overflow: hidden`, so its
  // `scrollHeight` reports the height it is about to take while `clientHeight` reports the
  // height it currently occupies. The difference is exactly what this viewport is about to
  // lose — zero when the dock is already open, which is why one expression covers both.
  // AND IT APPLIES TO THE CANVAS PANE ONLY. The dock is a sibling of the CANVAS scroller; the
  // inspector is a separate aside with its own scroll, which the dock does not touch. Subtracting
  // the dock's height from the inspector's viewport would inset it by 113px of nothing and push
  // every inspector reveal too far down — the same arithmetic being right for one box and wrong
  // for another. `contains` asks the DOM which pane this scroller is in rather than assuming.
  const dockNode = document.querySelector<HTMLElement>("[data-studio-dock]");
  const dock = dockNode && dockNode.parentElement?.contains(scroller) ? dockNode : null;
  const pending = dock ? Math.max(0, dock.scrollHeight - dock.clientHeight) : 0;
  const bottom = s.bottom - pending;
  const height = s.height - pending;

  // A TARGET TALLER THAN THE VIEWPORT CANNOT BE "FULLY IN VIEW", so for those the question is
  // whether its TOP is showing. Without this branch a tall target reports out-of-view forever and
  // re-scrolls on every selection.
  const taller = e.height > height - pad * 2;
  if (taller ? e.top >= s.top && e.top <= bottom - pad : e.top >= s.top + pad && e.bottom <= bottom - pad) {
    return null;
  }

  // CENTRING IS WRONG FOR A TALL TARGET, AND THE BLOCK CARD IS WHERE THAT SHOWED.
  // `(height - e.height) / 2` goes NEGATIVE once the element is taller than the viewport, so
  // centring pushes its top ABOVE the fold — the scroll fires, `scrollTop` changes, and you land
  // in the middle of a card whose heading you cannot see. Measured on the hero: a 1351px range,
  // scrolled to 899, target out of view. Fields never showed it because a field is 44px; a card
  // is most of a pane. So a tall target aligns its TOP and a short one centres.
  const top = taller
    ? scroller.scrollTop + (e.top - s.top) - pad
    : scroller.scrollTop + (e.top - s.top) - (height - e.height) / 2;
  return { scroller, top: Math.max(0, top) };
}

/** Would a reveal move anything? Asked before the scroll is issued, to time the mark. */
function willReveal(el: HTMLElement): boolean {
  return revealTarget(el) !== null;
}

function revealIfNeeded(el: HTMLElement): boolean {
  const t = revealTarget(el);
  if (!t) return false;
  t.scroller.scrollTo({ top: t.top });
  return true;
}

/**
 * Where a selection lands in the INSPECTOR. One builder, so the echo and the reveal can never
 * address different nodes — the same rule `selectorForField` follows on the canvas side.
 *
 * TWO GRANULARITIES, AND THE DIFFERENCE IS DELIBERATE. A section-shell field is addressed
 * exactly; a block is addressed at its CARD rather than at its field. Field-level for blocks
 * would mean threading `blockIndex` through ~15 form components and then 64 `fieldId` props,
 * where a mistyped path fails SILENTLY. The card is one attribute and takes the editable surface
 * from 77% silent to responding. The dock already holds the exact field, so the finer mark buys
 * precision that has already been supplied.
 */
function inspectorSelectorFor(f: SelectedField): string {
  return f.kind === "section"
    ? `[data-studio-field="${f.field}"]`
    : `[data-studio-block="${f.blockIndex}"]`;
}

/** Read a studio motion token as milliseconds. Scoped to `.studio-chrome`, so it is read from an
 *  element inside it rather than from the root — the value does not exist on `:root` by design. */
function readStudioMs(name: string): string {
  const host = document.querySelector(".studio-chrome");
  return host ? getComputedStyle(host).getPropertyValue(name).trim() : "";
}

/**
 * Open every collapsed group between `el` and the panel, USING THE CONTROL A PERSON WOULD USE.
 *
 * `CollapsibleGroup` keeps `open` in local `useState` — #234's decision, taken so the fold needs
 * no persistence layer and no id registry. Reaching in from outside would mean lifting that state
 * or building a registry to address it, which is the machinery #234 deliberately did not build.
 * **So this clicks the toggle.** The group already exposes exactly what is needed: the header is a
 * `<button aria-expanded aria-controls={bodyId}>` and the body is `<div id={bodyId} hidden={!open}>`,
 * so a hidden ancestor with an id names its own controller. Nothing new is stored, nothing is
 * lifted, and the group's own handler runs — which is also why the open survives exactly as long
 * as a hand-opened one would.
 *
 * REACT COMMITS THE OPEN ASYNCHRONOUSLY, so callers must wait a frame before measuring. That is
 * not incidental: scrolling before the commit is #258's third T0 bug exactly — the range that
 * exists when the scroll is issued is smaller than the one that exists after the group expands,
 * and the browser clamps to the former.
 */
function openEnclosingGroups(el: HTMLElement): boolean {
  let opened = false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    if (!n.hasAttribute("hidden") || !n.id) continue;
    const btn = document.querySelector<HTMLElement>(
      `[aria-controls="${CSS.escape(n.id)}"][aria-expanded="false"]`
    );
    if (btn) {
      btn.click();
      opened = true;
    }
  }
  return opened;
}

/**
 * THE DOCK — the one field you clicked, at the canvas foot.
 *
 * It exists for the reason the Selected rail existed: inline contentEditable is fine for a
 * quick word change and poor for anything longer — no wrapping control, no undo affordance,
 * and on a canvas scaled to 50% the text is small. Clicking the canvas selects; typing here
 * writes.
 *
 * WHAT CHANGED IS WHERE IT LIVES, NOT WHAT IT DOES. The rail sat at the top of the inspector
 * holding a SECOND control for a value the form below it already had, with a sentence
 * explaining they were the same thing, and it held that space whether or not anything was
 * selected. Here it is absent until you select, and it sits beside the thing it edits.
 *
 * IT IS THE CONFIRMATION, AND THAT IS LOAD-BEARING RATHER THAN DECORATIVE. `ItemRows` rows
 * fold by default (#234), so for most block fields the inspector's own field is HIDDEN when
 * you click its element on the canvas. T3's echo cannot mark what is not rendered. The dock
 * is what tells you the click landed, which is why it earns its place instead of being a
 * rail in a new position. See `revealIfNeeded` for the same finding applied to T0.
 *
 * NO `useAutoGrow`, AND ITS DELETION IS THE POINT. The rail's textarea was capped by an
 * observed measurement of the CANVAS's content height — a bound that was already wrong for a
 * foot-anchored surface, and the thing that broke twice (#233 shipped 3166px of textarea in
 * an 811px pane; #235 fixed it again by keying the effect on the node rather than the ref).
 * A dock at the pane's foot has a fixed budget, so it takes fixed min/max heights and the
 * hook, the ceiling state and the wrapper div that existed only to be measured all go.
 */
function SelectionDock({
  selected,
  value,
  onChange,
  onDismiss,
  hidden,
}: {
  selected: SelectedField | null;
  /** Read straight from form state on every render — see the panel's `readField`. There is
   *  no second copy of the value here, which is why the rail's data-loss bug cannot return. */
  value: string;
  onChange: (v: string) => void;
  onDismiss: () => void;
  /** Hidden under Details, never unmounted — see the call site. */
  hidden?: boolean;
}) {
  const open = !!selected && !hidden;
  return (
    // T2 · THE STRUCTURE. The only tier that springs, because it is the only element
    // travelling far enough for a settle to read — a 6px detail on a spring is a wobble, a
    // 20px panel is weight.
    //
    // `max-h` RATHER THAN `hidden`, so the dock is always mounted and the canvas COMPRESSES
    // as it arrives instead of being covered. Mount discipline, and also the only way the
    // transition has a from-state to run from.
    <div
      // Named for `revealIfNeeded`, which has to know how much of the canvas viewport this is
      // about to take. A data attribute rather than a ref because the reveal runs from a click
      // handler several components away, and threading a ref through the shell to reach it
      // would make ThreePaneShell learn what a dock is.
      data-studio-dock=""
      aria-hidden={!open}
      // `inert` when closed: a max-height:0 box still keeps its textarea tabbable, which is
      // #177's finding in mirror form and the same reason ThreePaneShell inerts its collapsed
      // list rather than hiding it.
      inert={!open}
      className={[
        "flex-none overflow-hidden border-t bg-cream-100",
        open
          ? "max-h-[124px] translate-y-0 border-ink-950/22 opacity-100 duration-[var(--studio-t2,340ms)] ease-[var(--studio-ease-settle,cubic-bezier(0.34,1.35,0.5,1))] delay-[var(--studio-t2-delay,40ms)]"
          : "max-h-0 translate-y-[var(--studio-rise,20px)] border-transparent opacity-0 duration-[var(--studio-out,130ms)] ease-[var(--ease-out-expo)] delay-0",
        "transition-[max-height,opacity,transform,border-color]",
      ].join(" ")}
    >
      <div className="px-3.5 pb-3 pt-2.5">
        <div className="mb-1.5 flex items-center gap-2">
          <span className={labelCls}>Editing</span>
          {/* T4a · the tag. 6px, and it lands AFTER the dock has arrived, so the surface
              reads as arriving and then filling rather than appearing whole. */}
          <span
            className={[
              "rounded-full border border-accent-500/30 bg-accent-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-600",
              "transition-[opacity,transform] duration-[var(--studio-t4,280ms)] ease-[var(--ease-out-expo)]",
              open
                ? "translate-y-0 opacity-100 delay-[var(--studio-t4a,150ms)]"
                : "translate-y-[var(--studio-detail,6px)] opacity-0 delay-0",
            ].join(" ")}
          >
            {/* THE LABEL COMES FROM `inlineEditProps`, WHICH SPELLS IT "Edit hero title" — every
                one of them starts with "Edit ", because that string was written to be an
                ACCESSIBLE NAME on a contentEditable, where "Edit hero title" is exactly right.
                Beside the word "Editing" it reads twice. Stripped for DISPLAY only.
                THE ACCESSIBLE NAME IS UNTOUCHED — the textarea below still carries the full
                label. This is #255's lesson in the other direction: there, shortening the
                visible label silently shortened the accessible one too. Here the visible text
                loses a word and the accessible name keeps it, which is the whole distinction. */}
            {(selected?.label ?? "").replace(/^Edit /, "")}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Stop editing this field"
            className={[
              "grid size-[22px] flex-none place-items-center rounded-[var(--studio-radius-control,4px)] text-ink-400 transition-colors hover:bg-cream-200 hover:text-ink-950",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500",
              open ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <IconX className="size-3" />
          </button>
        </div>
        {/* T4b · the field, the last thing to resolve.
            FIXED min/max RATHER THAN useAutoGrow — see the header. 46 and 104 are the
            contract's, and a foot-anchored surface can afford a fixed budget in a way a
            sticky one in a scrolling pane could not. */}
        <textarea
          key={
            selected
              ? selected.kind === "section"
                ? `s:${selected.field}`
                : `b:${selected.blockIndex}:${selected.path}`
              : "none"
          }
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={selected?.label ?? "Selected field"}
          className={[
            inputCls,
            "block max-h-[104px] min-h-[46px] resize-none overflow-y-auto",
            "transition-[opacity,transform] duration-[var(--studio-t4,280ms)] ease-[var(--ease-out-expo)]",
            open
              ? "translate-y-0 opacity-100 delay-[var(--studio-t4b,190ms)]"
              : "translate-y-[var(--studio-detail,6px)] opacity-0 delay-0",
          ].join(" ")}
        />
      </div>
    </div>
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
  /** A tagged field was clicked — drives the dock.
   *  The ELEMENT comes with it so the caller can run T0's conditional reveal. This component
   *  only reports what was clicked; whether that causes a scroll is the caller's decision. */
  onSelectField?: (f: SelectedField, el: HTMLElement | null) => void;
  /** The field the dock is bound to, so the canvas can mark it as selected. */
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
    // uses, so the dock can never disagree with the canvas about which field is which.
    const el = target.closest?.("[data-edit-value-path], [data-edit]") as HTMLElement | null;
    const f = selectedFieldFrom(el);
    if (f) onSelectField?.(f, el);
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
    root.querySelector(selectorForField(selectedField))?.classList.add("is-selected");
  });
  return (
    // `canvas-static` is the visibility scope: the canvas is a static panel, so the
    // in-view reveal that normally un-hides `.reveal-card` items never fires here.
    // It sits on the WRAPPER rather than inside SectionRenderer so it covers every
    // one of that component's branches (hero, web hero, quote band, standard) at
    // once, and so no public component has to change to fix a studio-only bug.
    //
    // `canvas-surface` AND THE BORDER UTILITY ARE BOTH GONE, and they were removed
    // together because each was only propping the other up. The rule had been reduced to
    // `background-color: transparent; border: 0`, and NEITHER declaration did anything on
    // its own: nothing else paints this element, so `transparent` was the default it
    // already had, and `border: 0` existed only to cancel the `border border-ink-950/12`
    // written right here. Two declarations fighting to arrive at the browser default.
    // Deleting one alone would have CHANGED the render — drop the rule and the border
    // comes back, drop the utility and nothing moves — which is why that was one edit.
    //
    // THIS ELEMENT PAINTS NOTHING, AND THAT IS DELIBERATE. The card needs a ground to
    // separate from — it is cream-50 on what was a cream-50 pane, contrast 1.00, the same
    // colour — but the ground belongs to the CANVAS PANE, not to the card's own wrapper.
    // Painting it here tinted a box that hugs the scaled card and stops at its edge, so
    // the tone ended at the card rather than filling the surface the card sits on. The
    // ground is passed to `ThreePaneShell` as `canvasGround` instead; see the call below.
    <div
      ref={paneRef}
      className="case-study canvas-static overflow-hidden rounded-[var(--studio-radius-card,8px)] pt-px pb-8"
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
  detailsCanvas,
  bespoke,
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
  /** What the CANVAS shows while Details is selected. Until this existed the canvas went blank
   *  there — a full inspector beside an empty pane — which is the gap PR 2 closes. Passed in
   *  rather than built here for the same reason `detailsNode` is: this panel owns the sections,
   *  and the details fields belong to the panel above it. */
  detailsCanvas?: ReactNode;
  /** A hand-built study: its sections and work-filter category are set in code, `BESPOKE_SLUGS`
   *  gates the fetch, and there is nothing to arrange. It still has a title, a hero, a summary and
   *  a platform, which still render a project card — so it gets the SAME three panes, with the
   *  sections machinery suppressed rather than a second editor composed beside this one. That
   *  distinction matters: "a case study has ONE editor at ONE URL" is a locked decision, and the
   *  `[slug]/body` route is what happens when a second surface for the same content drifts. */
  bespoke?: boolean;
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

  // ---- THE SESSION PREVIEW MAP — the same gap #202 closed for blog, closed here --------------
  //
  // `draftImages` is a SNAPSHOT. `ProjectsEditPanel` fetches it once inside `loadSections()` and
  // its own comment says it is "still never re-fetched once loaded", so a path created AFTER that
  // fetch is not in it, the rewriter leaves it alone, and the plain path 404s against main until
  // publish. That is why a freshly uploaded block image stayed blank on this canvas.
  //
  // Created through a ref rather than useState so the identity is stable for the lifetime of the
  // panel — see `BlogBlocksEditPanel`, which does the same. `releaseAll` at unmount is the ONLY
  // revoke, and the map's header explains at length why there is no per-path release.
  const previewsRef = useRef<PreviewMap>(undefined);
  previewsRef.current ??= createPreviewMap();
  const previews = previewsRef.current;
  useEffect(() => () => previews.releaseAll(), [previews]);

  // A STABLE IDENTITY IS CORRECT even though the map mutates: it is read at CALL time, not
  // captured, and every adoption happens in the same handler as a block edit — so the canvas
  // recomputes on `values` and the fresh call sees the new entry. Adding the map to these deps
  // would churn the function identity for no render that needs it.
  const rewriteSrc = useMemo(() => {
    const draft = makeDraftSrcRewriter(draftImages);
    return (src: string) => previews.get(src) ?? (draft ? draft(src) : src);
  }, [draftImages, previews]);

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

  const { values, setField, dirty, saveStatus, savedAt, saveDraft, cancel, savedBaseline } = useDraftForm<SectionsFields>({
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
  // A CASE STUDY OPENS ON THE EDITOR, NOT THE BOARD. Opening on the Board shows the SHAPE when
  // what an author came here to do is write. `"details"` rather than a section id because it is
  // the one landing that exists before anything is selected, and it is already what
  // `lastEditedRef` defaults to below — so the open state and the returned-to state agree by
  // construction rather than by two constants that have to be kept in step.
  const [selection, setSelection] = useState<Selection>("details");
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
    /* THE GRID IS cream-100 AND THE CARDS ARE cream-50, AND THAT IS LOAD-BEARING RATHER THAN
       DECORATIVE. A cream-50 card on a cream-50 page has nothing to lift off, so the ground move
       is what makes the elevation legible at all. It also reads correctly against the ladder — a
       field surface holding wells is exactly what cream-100 is for.
       THE DOUBLE PADDING IS GONE. `px-4 py-5` was applied here AND on the inner column, insetting
       the board 32px horizontally and 40px vertically. One inset now. */
    <div className="min-h-0 flex-1 overflow-y-auto bg-cream-100">
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* FLUID COLUMNS, NOT A BREAKPOINT LADDER. `auto-fill` with a 300px floor fits as many
            columns as the pane can hold and adds one when it grows, so the Board is not capped at
            three on a wide screen and does not need a breakpoint invented for each step.
            THE 300px FLOOR IS THE TITLE'S, MEASURED. All six of the long real titles need a 222px
            title column at Fraunces 15px; with the arrows at the card foot the title gets
            `card - 67`, so 300 leaves it 233 and the two-line clamp holds at the narrowest track
            the grid will ever create. A smaller floor would let the grid produce a column the
            clamp cannot survive, which is the failure this number exists to prevent. */}
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {values.sections.map((section, i) => {
            const name = sectionLabel(section, i);
            const count = section.blocks.length;
            const needsImage = sectionNeedsImage(section);
            const selected = selectedSectionId === ids.sectionIds[i];
            const firstKind = (section.blocks[0]?.discriminant as SectionBlockKind) ?? null;
            return (
              /* A FIXED 320px HEIGHT, AND THE MINI TAKES THE SLACK. The height is fixed rather
                 than derived from an aspect ratio, so a fluid column count cannot make the cards
                 taller as it makes them wider — a square would have grown to 372px tall at three
                 columns and 300 at five, changing how much board fits on screen every time the
                 pane resized. `max-w-[340px]` keeps the card near its intended proportion when a
                 track is generous. The head and the foot are fixed and the mini is the only
                 `flex-1`, so a one-block card and a three-block card are the same size and the
                 sparse one gives its shape more room rather than leaving dead space.
                 HAZARD 26 IS LIVE HERE AND IS SIDESTEPPED BY CONSTRUCTION. There is NO border
                 shorthand on this element — `border-0` plus one left declaration — so there is no
                 shorthand/longhand pair for sheet order to arbitrate. `studio-border-race` should
                 confirm that rather than this comment asserting it.
                 THE LEFT EDGE IS ALWAYS 3px AND ONLY ITS COLOUR MOVES, so selection cannot shift
                 the grid by a pixel and nothing reflows between states. */
              <div
                key={ids.sectionIds[i]}
                data-board-card
                className={`group relative flex h-[320px] max-w-[340px] flex-col overflow-hidden rounded-[var(--studio-radius-card,8px)] border-0 border-l-[3px] bg-cream-50 p-3.5 ${
                  selected ? "border-l-accent-500" : "border-l-transparent"
                } shadow-[var(--studio-lift-rest,0_1px_2px_oklch(14%_0.018_60/0.06))] ${
                  selected
                    ? "shadow-[var(--studio-lift-active,0_2px_5px_oklch(14%_0.018_60/0.08))]"
                    : "hover:-translate-y-[3px] hover:shadow-[var(--studio-lift-hover,0_2px_4px_oklch(14%_0.018_60/0.07))]"
                } transition-[box-shadow,transform,border-color,background-color] duration-[var(--studio-lift-t,200ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] motion-reduce:hover:translate-y-0`}
              >
                {/* THE SHEEN — a single diagonal pass, once per hover, never repeating. The only
                    thing on this card that is decoration rather than feedback, kept because it
                    measured free: 0.2ms of style and layout for a real hover against a 16.7ms
                    frame, and below the noise floor when isolated from the rest.
                    It is `motion-reduce:hidden` rather than duration-zeroed, because a pass with
                    no duration is a flash rather than an absence. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[2] -translate-x-[120%] rounded-[inherit] bg-[linear-gradient(115deg,transparent_30%,oklch(100%_0_0/.5)_46%,transparent_62%)] opacity-0 transition-none group-hover:translate-x-[120%] group-hover:opacity-100 group-hover:transition-[transform,opacity] group-hover:duration-[var(--studio-lift-sheen,620ms)] motion-reduce:hidden"
                />
                {/* The whole card selects; the reorder arrows are SIBLINGS of this button, never
                    nested, so the markup stays valid. The overlay sits under the content, which is
                    pointer-transparent, so a click anywhere but the arrows opens the section.
                    NO COUNT IN THE VISIBLE CARD ANY MORE — the chips ARE the count — but it stays
                    in the ACCESSIBLE NAME, because a screen reader has no chips to count. */}
                <button
                  type="button"
                  onClick={() => setSelection({ id: ids.sectionIds[i] })}
                  aria-label={`Edit section ${name}, ${count} ${count === 1 ? "block" : "blocks"}${needsImage ? ", needs an image" : ""}`}
                  className="absolute inset-0 z-0 rounded-[var(--studio-radius-card,8px)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500"
                />

                {/* HEAD — fixed height. The arrows are NOT here; see the foot. */}
                <div className="pointer-events-none relative z-[1] flex flex-none items-start gap-2.5">
                  {/* THE ORDINAL trails the card by the follower tier rather than moving with it,
                      which is what makes the card read as an object rather than an image that
                      changed. Selected, it takes the accent and turns upright — one mark, two
                      jobs. cream-100 on the cream-50 card, NOT cream-50: the contract drew it at
                      the card's own colour, which measures 1.00 and leaves a hairline doing all
                      the work. One step off whatever it sits on. */}
                  <span
                    className={`grid size-[30px] flex-none place-items-center rounded-[var(--studio-radius-control,4px)] text-[13px] ${
                      selected
                        ? "bg-accent-500 font-semibold text-cream-50"
                        : "bg-cream-100 font-display italic text-ink-600 group-hover:bg-cream-200"
                    } transition-[background-color,color,transform] duration-[var(--studio-lift-follow,240ms)] delay-[var(--studio-t2-delay,40ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] group-hover:-translate-y-px motion-reduce:group-hover:translate-y-0`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {/* ink-600, NOT ink-400, AND THIS IS THE PR THAT WAS TOLD TO DO IT. The old
                        comment here deferred a measured 3.49 against cream-50 — below the 4.5 AA
                        floor — to "PR 7 restructures this board". This is that restructure. 7.42. */}
                    {section.eyebrow && (
                      <span className="truncate text-[10px] uppercase tracking-eyebrow text-ink-600">
                        {section.eyebrow}
                      </span>
                    )}
                    {/* TWO LINES, AND THE AUTHOR'S OWN BREAK IS HONOURED. Five of the six longest
                        real titles already carry a newline the author wrote, so `whitespace-pre-line`
                        makes the clamp a backstop rather than a competing opinion. */}
                    <span className="line-clamp-2 whitespace-pre-line font-display text-[15px] leading-[1.25] text-ink-950">
                      {name}
                    </span>
                  </div>
                </div>

                {/* THE SHAPE — the flexible middle, and the only `flex-1` on the card. */}
                <div className="pointer-events-none relative z-[1] my-2.5 flex min-h-0 flex-1 flex-col justify-center rounded-[var(--studio-radius-control,4px)] bg-cream-100 p-3 transition-colors duration-[var(--studio-lift-follow,240ms)] delay-[var(--studio-t2-delay,40ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))] group-hover:bg-cream-200">
                  {count === 0 ? (
                    <span className="w-full text-center text-[12px] text-text-subtle">No blocks yet</span>
                  ) : (
                    <SectionMini kind={firstKind} />
                  )}
                </div>

                {/* FOOT — fixed height. The chips say what the blocks ARE; the shape above says
                    what they look like. THE ARROWS LIVE HERE, and that is a measured move rather
                    than a preference: in the head they cost the title 46px, which took the longest
                    real title to three lines in a 323px card. Here they also sit at the same place
                    on every card instead of shifting with the title's length. */}
                <div className="relative z-[1] flex flex-none items-end justify-between gap-2">
                  <div className="pointer-events-none flex min-w-0 flex-wrap items-center gap-1">
                    {section.blocks.slice(0, 3).map((block, j) => (
                      <BlockSkeleton
                        key={ids.blockIds[i][j]}
                        kind={block.discriminant as SectionBlockKind}
                      />
                    ))}
                    {count > 3 && (
                      <span className="text-[11px] text-text-subtle">+{count - 3}</span>
                    )}
                    {needsImage && (
                      <span className="inline-flex w-fit items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                        Needs an image
                      </span>
                    )}
                  </div>
                  {/* Reorder — the SAME moveSection/structural() choke point the focused editor
                      uses, so {sectionIds, blockIds} and sections move in lockstep.
                      LEFT AND RIGHT, NOT UP AND DOWN, AND ONLY THE LABELS CHANGED. Document order
                      runs left-to-right and wraps, so the section before this one is visually to
                      its LEFT; `up` on the first card of a row moved it to the END of the previous
                      row, a jump rather than a step. `moveSection(i, dir)` was already
                      "previous/next index" rather than "up/down", so the handler is untouched.
                      DISABLED AT THE ENDS RATHER THAN ABSENT, so the control never moves between
                      cards. */}
                  <div className="flex flex-none items-center gap-1">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move section ${name} earlier`}
                      className={`pointer-events-auto ${iconBtn} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500`}
                    >
                      <IconChevronRight className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => moveSection(i, 1)}
                      disabled={i === values.sections.length - 1}
                      aria-label={`Move section ${name} later`}
                      className={`pointer-events-auto ${iconBtn} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500`}
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-solid hover:border-accent-500 hover:text-accent-600 [&>svg]:size-3.5"
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
  // ESCAPE DISMISSES, and focus goes back to the canvas element it was marking rather than
  // being left on a box that has just faded out. Bound to the document because the key must
  // work from the canvas, the dock and the inspector alike, and `keydown` rather than `keyup`
  // so it beats nothing else — there is no other Escape handler in this editor.
  //
  // GUARDED ON `selectedField`, so Escape stays available to anything else that wants it when
  // nothing is selected, and the effect re-binds when the selection changes so the handler
  // never closes over a stale one.
  useEffect(() => {
    if (!selectedField) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = document.querySelector<HTMLElement>(selectorForField(selectedField));
      setSelectedField(null);
      // Focus lands on the element the mark is leaving, which is a real node that stays in the
      // document. Sending it nowhere would drop the caret to <body> and lose the reading place.
      el?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedField]);

  // T0's INSPECTOR HALF. **THIS OVERRULES #258, WHICH SHIPPED T0 CANVAS-ONLY ON PURPOSE.**
  //
  // THE REASONING #258 GAVE HAS NOT STOPPED BEING TRUE — `ItemRows` folds by default, and a
  // scroll to a folded row lands on nothing and looks exactly like the scroll not firing. What
  // changed is the remedy: instead of declining to scroll, OPEN the group first, then scroll,
  // then mark. The owner saw the canvas-only result and wanted the pane to follow.
  //
  // ONLY ADDRESSED FIELDS HAVE A TARGET, which is the same limit T3 has and for the same reason:
  // a block field has no `data-studio-field`, so there is no node to scroll to. It docks and
  // marks the canvas as usual and the inspector does not move. Stated here rather than left to
  // be discovered, because "the pane sometimes scrolls" is otherwise indistinguishable from a bug.
  //
  // RETURNS SYNCHRONOUSLY WHETHER IT WILL SCROLL, and scrolls asynchronously. The caller needs
  // the answer now to time the mark at 55% of T0; the scroll itself must wait for React to commit
  // the group's open, or it is clamped to the pre-expansion range — #258's third T0 bug, on a
  // different scroller.
  const revealInspectorField = (f: SelectedField): boolean => {
    const root = inspectorRef.current;
    if (!root) return false;
    // The SHOWN section panel. Every section editor is mounted and hidden, so the address matches
    // once per section and the field must be taken from the panel on screen — the same filter T3
    // applies, for the same reason.
    const panel = [...root.querySelectorAll<HTMLElement>("#cs-fieldtab-panel > div")].find(
      (d) => d.offsetParent !== null
    );
    const target = panel?.querySelector<HTMLElement>(inspectorSelectorFor(f));
    if (!target) return false;

    // HIDDEN BY ITSELF vs HIDDEN BY AN ANCESTOR, AND THE DIFFERENCE DECIDES WHETHER TO MOVE.
    // A block card carries `hidden` DIRECTLY under the Style tab when its kind has no style
    // fields — there is nothing to show and nothing to open, so the honest response is to leave
    // the pane alone. A target hidden by an ANCESTOR is a folded group, which can be opened.
    // Measured: without this the pane scrolled to 153 on the Style tab with zero cards rendered,
    // landing on a neighbour's card. Scrolling to the wrong thing is worse than not scrolling,
    // and it is the failure the header fallback was written to avoid rather than to cause.
    if (target.hasAttribute("hidden")) return false;

    const folded = target.offsetParent === null;
    if (!folded && !willReveal(target)) return false;

    openEnclosingGroups(target);
    // Two frames: one for React to commit the open, one for layout to settle at the new height.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (target.offsetParent !== null) {
          revealIfNeeded(target);
          return;
        }
        // COULD NOT OPEN IT — scroll to the closed group's header instead. Landing on the row you
        // would have to expand is honest; landing on nothing is not, and is the failure mode
        // #258 chose not to ship at all.
        // AND THE FALLBACK HAS TO BE VISIBLE ITSELF. A block card carries `hidden` directly
        // under the Style tab when its kind has no style fields, so `closest("[hidden]")` can be
        // the card, whose previous sibling is a DIFFERENT card — scrolling there would take you
        // to the wrong block confidently. Checked rather than trusted.
        const hider = target.closest("[hidden]");
        if (!hider || hider === target) return; // nothing to fall back to — see the guard above
        const header = hider.previousElementSibling as HTMLElement | null;
        if (header && header.offsetParent !== null) revealIfNeeded(header);
      })
    );
    return true;
  };

  // T3 · THE ECHO. The inspector field's mark, applied imperatively for the same reason the
  // canvas mark is: the marked node is rendered deep inside the shared field components, which
  // know nothing about studio selection, and threading a prop to reach them would touch every
  // one of `TextField`'s ~40 call sites to serve four.
  //
  // ---- THIS IS THE PIECE #258 CLAIMED AND DID NOT BUILD -------------------------------------
  // That PR's body said "T3 fires only when the field is visible" and gave a reason for the
  // narrowing. There was no mark, no rule to render one, no application and no visibility test —
  // the conditionality was a property of nothing. Recorded as a `structural()` variant; the
  // reason it survived review is that the REASONING was sound and only its subject was absent.
  //
  // ---- VISIBLE MEANS RENDERED, NOT SCROLLED INTO VIEW, AND THAT IS A DECISION ----------------
  // `offsetParent === null` is true exactly when an ancestor is `display: none` — which is how
  // BOTH things that legitimately hide a field work: a section editor for a section you are not
  // looking at (mounted, `hidden`) and a folded `ItemRows` row or `CollapsibleGroup` body. It is
  // NOT true for a field that is merely scrolled past, and that is deliberate: an echo below the
  // fold of a scrolling pane is still there when you scroll to it, so marking it is right. A
  // field inside `display: none` can never be seen, so marking it is the confirmation nobody can
  // see that #234's fold made the whole question.
  //
  // NOT A SCROLL TEST, THEREFORE NOT #258's `scrollParent` BUG. That one walked past a scroller
  // which had not yet overflowed; the same class of error here would read every field as hidden
  // and reproduce exactly the behaviour this fixes — so the test is rendered-ness, which has no
  // scroller in it at all.
  const inspectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = inspectorRef.current;
    if (!root) return;
    root.querySelectorAll(".is-echoed").forEach((n) => n.classList.remove("is-echoed"));
    if (!selectedField) return;
    const matches = [...root.querySelectorAll<HTMLElement>(inspectorSelectorFor(selectedField))];
    // EVERY SECTION EDITOR IS MOUNTED AND HIDDEN, so this selector matches once per section.
    // Filtering on rendered-ness picks the one on screen; without it the mark lands in a panel
    // nobody is looking at and the visible field stays bare — indistinguishable from no T3.
    const shown = matches.find((n) => n.offsetParent !== null);
    shown?.classList.add("is-echoed");
  });

  // DISMISS CLEARS THE FIELD, NOT THE SECTION. "Stop editing this paragraph" and "leave this
  // section" are different intents, and the section selection is what the whole inspector is
  // bound to — collapsing both onto one key would make Escape throw away the pane you are
  // working in. Escape and the dock's close button do the same thing.
  const dismissField = () => setSelectedField(null);
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
  // grid of 1fr beside 240px at lg, which spent 240 of the pane's 640 on a textarea — so the
  // canvas rendered into 382px and PR 6's 50% floor was a claim about a pane that did not exist.
  // With the rail gone to the inspector the pane is the canvas, and the floor becomes measurable.
  //
  // It holds no form state — it is a render — so unmounting it below the fold (where the
  // inspector takes this slot) costs nothing. That is the asymmetry that makes the fold safe:
  // the INSPECTOR is the one that must render exactly once, and it does.
  const canvasNode = (
    <div className="min-w-0">
        {/* DETAILS TAKES THE CANVAS WHEN IT IS SELECTED, and the section canvas is HIDDEN rather
            than swapped — the same discipline the forms below it follow. The section render holds
            no form state, but the dock beside it does, and a ternary here would have been the one
            composition mount-discipline exists to refuse. */}
        {detailsCanvas ? <div hidden={!showDetails}>{detailsCanvas}</div> : null}
        <div hidden={showDetails}>
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
          // dock cannot show something form state no longer holds.
          //
          // T0 · THE REVEAL fires here, BEFORE the mark, because marking something off-screen
          // wastes the lead. It is CONDITIONAL, and that is the whole decision: this refines the
          // earlier "do not scroll" rule rather than reversing it. The objection was moving the
          // pane out from under someone already looking at it — which only happens when the thing
          // is ALREADY VISIBLE. A mark nobody can see is not a mark.
          //
          // CANVAS ONLY, AND THE INSPECTOR HALF IS DELIBERATELY NOT DRIVEN. `ItemRows` rows fold
          // by default (#234), so for every `items.N.*`, `stats.N.*`, `cards.N.*`, `features.N.*`
          // and `steps.N.*` field — most of the block-level editable surface — the inspector's
          // counterpart is HIDDEN. Scrolling a pane to show something folded away moves it to
          // show nothing. The contract's script drives both while its own prose says the
          // inspector does not scroll; the prose was written for the pre-T0 version and never
          // updated. Correction 32. The dock is what confirms the click instead.
          const selectField = (f: SelectedField, el?: HTMLElement | null) => {
            // BOTH PANES ARE IN SCOPE NOW. The inspector half schedules its own scroll (it may
            // have to open a group first) but answers synchronously whether it will move, because
            // the mark's timing depends on whether ANY scroll fired.
            const movedInspector = revealInspectorField(f);
            let movedCanvas = false;
            if (el) {
              movedCanvas = revealIfNeeded(el);
              // AND AGAIN ONCE THE DOCK HAS TAKEN ITS SPACE, because the first call's scroll is
              // CLAMPED TO THE RANGE THAT EXISTS WHEN IT IS ISSUED. Measured: the reveal asked
              // for 264, the browser clamped it to 151 — exactly `scrollHeight - clientHeight`
              // for the pre-dock viewport — and then the dock opened, the viewport lost 113px,
              // the reachable range grew to 264, and the element was left below the fold. Every
              // property was true. The scroll fired, `scrollTop` changed, the maths was right
              // for the box that existed at the time, and you still could not see what you
              // clicked. Centring for the FUTURE viewport (see `revealIfNeeded`) fixes the
              // arithmetic and cannot fix the clamp, because the range is not the maths.
              //
              // THE SECOND CALL IS FREE WHEN THE FIRST SUFFICED — `revealIfNeeded` returns early
              // when the target is already in view, which is the same conditionality T0 is built
              // on. So this is not "scroll twice", it is "check again once the box is final".
              const dock = document.querySelector<HTMLElement>("[data-studio-dock]");
              if (dock) {
                const again = () => {
                  dock.removeEventListener("transitionend", again);
                  revealIfNeeded(el);
                };
                dock.addEventListener("transitionend", again);
              }
            }
            // THE MARK STARTS AT 55% OF T0 — OVERLAPPED, NOT QUEUED. Waiting for the scroll to
            // finish would read as two events; starting with it would waste the lead on something
            // still travelling. 55% is the contract's, and it is read from the TOKEN rather than
            // retyped, which is also what finally gives `--studio-t0` a consumer: it shipped in
            // #258 declared and used by nothing, the `FIT_THRESHOLD_PX` shape, and my own C1
            // passed it because that assertion tested the SET rather than each token.
            //
            // NO `matchMedia` HERE. Under reduce the token itself is 0ms (see globals.css), so
            // this reads zero and the mark is immediate — the same CSS-decides-it route the
            // scroll takes, and the reason `reduced-motion` A2d can keep asserting the studio
            // reaches for no motion hook.
            const scrolled = movedCanvas || movedInspector;
            const t0 = scrolled ? parseFloat(readStudioMs("--studio-t0")) || 0 : 0;
            const lead = t0 * 0.55;
            if (lead > 0) window.setTimeout(() => setSelectedField(f), lead);
            else setSelectedField(f);
          };

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
            /* `data-canvas-scope` is what `useFitToWidth` writes `--cs-canvas-scale` onto, and
               `cs-canvas-scope` is what turns that scale into `--cs-card-inset`. Both sit here
               because this is the nearest element that contains BOTH the strip and the scaled
               canvas — the strip has to align with a card it is not inside. */
            <div data-canvas-scope className="cs-canvas-scope">
              {/* HELP TEXT, NOT A LABEL — so it keeps its own string rather than taking
                  `labelCls`: it is a sentence, and setting it bold-700 would shout. Only the
                  COLOUR moved, ink-400 -> ink-600, because ink-400 measured 3.49 here against
                  cream-50 and 12px is not WCAG large text, so it was below the 4.5 floor.
                  THE UPPERCASE AND THE EYEBROW TRACKING ARE GONE, AND THAT WAS THE REAL DEFECT.
                  `tracking-eyebrow` is 0.14em, sized for the two-word labels `labelCls` and
                  `groupLabelCls` set. On a 130-character SENTENCE it stretched the line past the
                  canvas and slowed reading, which is the opposite of what help text is for.
                  THE STRIP IS THE STUDIO'S EXISTING NEUTRAL ONE, NOT A NEW PATTERN — the same
                  `border-ink-950/12` + `bg-cream-100` + control radius already used by the
                  no-editor-yet strip below and by `ExperienceListEditor`'s banner. A left accent
                  bar was the alternative and was NOT taken: it would have been a third strip
                  flavour, and the studio keeps its left bars for selection markers. */}
              {/* THE INSET IS DERIVED, NOT MEASURED AND RETYPED. Flush to the pane the strip
                  overhung the card by 34px a side, but 34 is correct at exactly one window
                  size: it is `(1.5rem + clamp(0.75rem, 2vw, 2rem)) * scale`, where the clamp
                  tracks the VIEWPORT and the scale tracks the PANE. `--cs-card-inset` carries
                  the whole expression, so the two edges cannot drift apart on a resize. */}
              <div className="mx-[var(--cs-card-inset)] mb-3 mt-3 flex items-start gap-2.5 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-100 px-3 py-2.5 text-[12px] leading-relaxed text-ink-600">
                <IconInfo className="mt-[3px] h-3.5 w-3.5 flex-none text-ink-400" />
                <span>
                  <strong className="font-semibold text-ink-950">Live preview.</strong> Click any dashed
                  element to edit it, here or in the panel beside it. Rich text with{" "}
                  {/* MONO, because `**bold**` is syntax the author TYPES, not emphasis. Set in the
                      running face it reads as a typo. */}
                  <code className="rounded-[3px] bg-cream-200 px-1 py-px font-mono text-[11px] text-accent-600">
                    **bold**
                  </code>{" "}
                  edits under Inspector.
                </span>
              </div>
              {/* UPLOAD STATUS IS ITS OWN LINE NOW, AND THAT IS NOT COSMETIC. These two used to
                  render INSIDE the help text's container, each carrying `normal-case
                  tracking-normal` to escape the uppercase it inherited — the reset itself was the
                  tell that they never belonged there. Framing the help text would have put an
                  upload ERROR inside a strip that reads as instructions. Out here it also gets the
                  `role="status"` it always needed, so a screen reader is told when an upload
                  finishes or fails rather than only sighted users. */}
              {(imageBusy || imageError) && (
                <p role="status" aria-live="polite" className="mx-[var(--cs-card-inset)] mb-3 flex flex-wrap gap-2 text-[12px] text-accent-600">
                  {imageBusy && <span>Uploading image…</span>}
                  {imageError && <span>{imageError}</span>}
                </p>
              )}
              {/* No grid. The pane IS the canvas — see the note on `canvasNode`.
                  THE CEILING WRAPPER THAT USED TO SIT HERE IS GONE. It existed only to be
                  measured, as the bound for the Selected rail's auto-growing textarea. The dock
                  at the canvas foot takes a fixed budget instead, so the wrapper, the
                  `canvasCeiling` state and `useAutoGrow` all went with the rail. */}
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
    </div>
  );

  // THE INSPECTOR PANE, AND IT MUST RENDER EXACTLY ONCE. Every section editor and every block
  // card lives in here, hidden rather than unmounted, so a second copy would be two form trees
  // sharing one onChange with colliding ids and two carets. Above the fold it mounts in the
  // shell's inspector slot; below it, in the canvas slot. One node, one parent, chosen in JS.
  const inspectorNode = (
    // ⚠ `min-h-full` IS WHAT LETS THE SAVE BAR BELOW REACH THE PANE'S FOOT. B4's finding in
    // mount-discipline: `sticky bottom-0` only offsets an element when scrolling would carry it
    // out of the sticky region, so with a short inspector the bar floats in mid-air — 61px at
    // 1440x820, 295px at 1076x1054, bigger screen worse bug. The height comes from the aside and
    // `mt-auto` on the bar eats the slack. Both halves, or neither works.
    <div ref={inspectorRef} className="flex min-h-full flex-col gap-4">
      {/* THE SELECTED RAIL USED TO MOUNT HERE, AT THE TOP OF THE INSPECTOR, and it is now the
          dock at the canvas foot — see `SelectionDock`. The reasoning for putting it here is
          kept rather than deleted, because it was right about the thing it was arguing:
          "it edits the field the canvas has selected, so it belongs with the fields rather than
          on top of the render — and beside the canvas it was costing that render 240 of its 640."
          Both halves still hold. What that argument could not see is that the rail took the top
          of this pane whether or not anything was selected, and that the inspector's own field is
          FOLDED for most block selections (#234), so "belongs with the fields" put the
          confirmation next to a field you cannot see. The dock is beside the canvas without
          costing it width, because it costs height instead. */}

      {/* THE DETAILS FORM, MOUNTED AND HIDDEN like every section editor beside it — it carries
          its own draft state, so a conditional render here would drop an in-progress edit the
          moment you clicked a section. This is also what makes Save draft reachable again: it
          used to live INSIDE the collapsed disclosure, so closing the strip hid the only control
          that saved it. */}
      {/* `flex-1` PASSES THE PANE'S HEIGHT DOWN so the details save bar can pin to its foot.
          THE `hidden` ATTRIBUTE STILL WINS over these utilities — preflight emits
          `[hidden]:where(:not([hidden=until-found])){display:none!important}`, and the
          `!important` is what makes adding `flex` here safe. Without it a display utility would
          out-specify the attribute and the form would be visible on every section. */}
      {detailsNode ? (
        <div hidden={!showDetails} className="flex min-h-0 flex-1 flex-col">{detailsNode}</div>
      ) : null}
        {/* CS-3's Content|Style field split, now nested UNDER the Inspector view (the
            top-level Canvas|Inspector switch sits above). Restored to its honest
            labels: it splits FIELDS, not views, and calling its content half "Canvas"
            while a real canvas sat above it was the confusing part. Same
            roving-tabindex tablist; both panels stay mounted so switching loses no
            input, caret, or draft. */}
        {/* ---- THE SEGMENTED FILL, AND IT OVERRULES CORRECTION 29 (MINE) --------------------
            C-29 recorded the CONTRACT as wrong: it draws `.seg` — a segmented accent FILL — on a
            control that is a genuine `role="tablist"`, and C-20's by-role rule says tablists take
            the UNDERLINE. The owner has seen both and wants the fill. That is a change to the
            rule, not an application of it, so the rule moves with it.

            AND THE RULE WAS ALREADY FALSE AS WRITTEN, WHICH IS WHAT SETTLED IT. There are THREE
            tablists in the studio, not two. The third is `ListDetailLayout`'s VERTICAL list rail,
            whose rows take a cream fill plus a 3px accent LEFT BAR — its own comment calls that
            "the studio's one selection language", shared with the blog rail and the block strip.
            So "role=tablist -> underline" described two of three the day it was written. The role
            was never what decided the treatment; SHAPE and FUNCTION were.

            THE RULE RESTATED, AND NOTHING ELSE MOVES:
              a two-state MODE switch       -> the segmented accent FILL
                                               (SegmentedToggle, Board|Editor, Canvas|Inspector,
                                                and now this)
              a switch between CONTENT SETS -> the UNDERLINE   (the hero tabs, unchanged)
              a VERTICAL list rail          -> fill + left bar (unchanged)
            Content|Style filters WHICH FIELDS of one section show. It is a mode over one object,
            in the same pane as Board|Editor and Canvas|Inspector, both already fills. The hero
            tabs switch between three personas' content and stay on the underline, so C-20 is
            NARROWED rather than contradicted and nothing needs sweeping.

            THE ROLE DOES NOT CHANGE. This keeps `role="tablist"`, `aria-selected`, `aria-controls`,
            the roving tabindex and the Arrow keys. #251 already found that swapping in
            `SegmentedToggle` outright would drop all four — a regression wearing consistency's
            clothes. This is the fill's LOOK on a tablist's SEMANTICS.

            THE CONTRACT'S MARGIN IS NOT TAKEN. `.seg{margin:12px 14px 0}` carries the same 14 as
            `.ibody`, which correction 31 recorded as the MOCK'S OWN CARD PADDING. The border,
            radius, divider, height, type and both grounds are the contract's exactly. */}
        <div
          role="tablist"
          aria-label="Section content and style"
          className="mx-3 mt-2 flex overflow-hidden rounded-[var(--studio-radius-control,4px)] border border-ink-950/22"
        >
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
                  // 34px, 600/12px, flex-1, and a hairline BETWEEN the two — the contract's
                  // `.seg button` and `.seg button+button` exactly.
                  "h-[34px] flex-1 text-[12px] font-semibold transition-colors",
                  // THE RING IS INSET, and that is the first difference a filled tab has from an
                  // underlined one: an outset ring would draw at the container's own curved edge,
                  // where `overflow-hidden` clips it. The negative outline offset keeps it inside.
                  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2",
                  // AND ITS COLOUR FOLLOWS ITS GROUND, WHICH IS THE SECOND AND THE ONE THAT BIT.
                  // An inset accent ring on the SELECTED button draws accent-on-accent —
                  // **measured at 1.00, completely unreadable**. The underline never had this
                  // problem because both tabs sat on cream; the fill is what put a ring on two
                  // different grounds. So the selected button's ring takes the label's colour
                  // (cream-50 on accent, 4.70) and the rest keeps accent on cream (4.70).
                  // Same value both ways, which is the point: one ring, two grounds.
                  "[&+&]:border-l [&+&]:border-ink-950/22",
                  selected
                    ? "bg-accent-500 text-cream-50 focus-visible:outline-cream-50"
                    : "bg-cream-50 text-ink-600 hover:text-ink-950 focus-visible:outline-accent-500",
                ].join(" ")}
              >
                {t === "content" ? "Content" : "Style"}
              </button>
            );
          })}
        </div>
        <FieldTabProvider tab={contentStyleTab}>
        <div id="cs-fieldtab-panel" role="tabpanel" tabIndex={-1} className="flex flex-col outline-none">
        {/* ---- THE TAB HINT (contract 5c) ---------------------------------------------------
            11px, and INSET to match its neighbours. Measured, this paragraph was the only child
            of the body starting flush against the pane's left border: header ink at 16, tab text
            at 13, group cards at 14, and this at **1**. It sits directly under the tablist, so it
            takes the tabs' own inset rather than the cards'.
            THE CONTRACT'S `.ibody{padding:12px 14px 20px}` IS NOT THE FIX AND IS NOT BUILT — see
            correction 31. Its 14px appears three times in the mock (`.ibody`, `.seg`, `.tabhint`)
            because `.insp` is a floating card with no padding of its own; in the real pane every
            child already carries its own inset, so a body padding would push the cards to 28. */}
        {/* NO `leading-[1.5]` — the contract asks for it, but studio-cascade C1 proves it INERT here:
            the studio reset already sets that line-height on <p>, so the utility would not drive
            the result and editing it would do nothing. The contract's value is already the value. */}
        <p className="px-3 text-[11px] text-text-subtle">
          {contentStyleTab === "content"
            ? "Copy for this section, including the Rich **bold** fields the canvas cannot edit."
            : "Layout, glow, frames, and image geometry for this section."}
        </p>
        {values.sections.map((section, i) => (
          <div
            key={ids.sectionIds[i]}
            hidden={selectedSectionId !== ids.sectionIds[i]}
            /* NO FRAME. This drew a card around the WHOLE inspector body, inside a pane that is
               already a bordered surface — a box around a box. Same finding as #245, where the
               panel <section>'s frame became redundant once the shell owned it; that sweep was
               scoped to `ListDetailLayout` hosts and this panel renders in `ThreePaneShell`, so
               it was never in the derived set and the frame survived. The contract draws none.
               `p-3` STAYS, AND THAT IS MEASURED RATHER THAN ASSUMED. It was not compensating for
               the border: with the frame the ink inside landed at 14 while the tabs and hint sit
               at 13, so the border WAS the extra pixel. Dropping it alone puts this body's ink at
               13 with its neighbours. Removing the padding too would take it to 1, which is
               exactly the defect #257 fixed on the tab hint.
               THE GROUPS INSIDE DO NOT LOSE THEIR SEPARATION — measured, every one carries its
               own 1px hairline, so none was relying on this frame. That is the question #256
               raised when moving a ground one level up made nested rows vanish into their parent,
               asked here of a border instead of a fill. */
            className="flex flex-col gap-3 p-3"
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
                  // THE BLOCK'S ADDRESS FOR T0 AND T3, and it is `j` — THE SAME INDEX the canvas
                  // emits as `data-edit-block-index`, because both derive from this section's
                  // block array order and this line sits beside `ids.blockIds[i][j]`. Taking it
                  // from anywhere else would be a second numbering that agrees until it does not.
                  //
                  // BLOCK-LEVEL RATHER THAN FIELD-LEVEL, DELIBERATELY. Addressing each field
                  // means threading `blockIndex` through ~15 form components and then 64
                  // `fieldId` props, and a mistyped path there fails SILENTLY — which is the
                  // exact failure this whole thread has been about. The card is one attribute,
                  // it takes 77% of the editable surface from silent to responding, and for T0
                  // "bring the right block into view" is arguably the correct granularity: the
                  // dock already holds the exact field, so the finer mark buys precision that
                  // has already been supplied. Revisit if an author scrolls to a card and then
                  // has to hunt for the field inside it — that trigger fires from USE, which is
                  // the only thing that has caught any of this.
                  blockAddress={j}
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
                      // THE ADOPTION POINT. Everything below this line existed already; the
                      // upload is what #202's emit half forwards and this panel used to drop.
                      onChange={(next, upload) => {
                        if (upload) previews.adopt(upload.src, upload.file);
                        setBlockValue(id, next);
                      }}
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
                className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-solid hover:border-accent-500 hover:text-accent-600 [&>svg]:size-3.5"
              >
                <IconPlus /> Add a block
              </button>
            )}
          </div>
        ))}
        </div>
        </FieldTabProvider>
      <p className="text-[10px] text-text-subtle">Wrap words in **double asterisks** to bold them.</p>

        {/* NO SECTIONS BAR ON A BESPOKE STUDY, AND THIS ONE IS #200 INVERTED. A normal study shows TWO
            saves at once when Details is selected — "Save draft · Details" and "Save draft · Sections" —
            suffixed rather than merged because they commit genuinely different drafts. A bespoke study
            has no sections draft to commit, so a second bar would offer to save an object that does not
            exist. #200's defect was two buttons claiming to be the same action; this would be one button
            naming an object with nothing behind it.
            AND THE WRITE PATH WOULD NOT HAVE STOPPED IT HONESTLY. Only `delete-entry` carries a
            `BESPOKE_SLUGS` guard; `save-draft` has none. The serializer does refuse — `p4-4bi` asserts
            boat-crest is REFUSED because it has `body` and no `sections` — but that surfaces as a
            generic failure, which reads as a broken editor. The honest answer is not to offer the save.
            `detailsNode` brings its own bar, so a bespoke study keeps exactly the one save it can do.

            ⚠ THE VALIDATION MESSAGE IS NOT A SAVE STATE and travels as its own prop rather than folded
            into the line. "A video URL must be http:// or https://" is a fact about the CONTENT; the
            five-state line has no slot for it, and swallowing it to fit the drawing would have deleted
            the only signal saying why the save is refusing. */}
      {bespoke || showDetails ? null : (
        <SaveBar
          className="sticky bottom-0 z-10 mt-auto"
          status={saveStatus}
          dirty={dirty}
          savedAt={savedAt}
          title="Auto-saves to draft on blur. Preview to see it."
          validation={hasBadVideoSrc ? "A video URL must be http:// or https://." : null}
          onCancel={handleCancel}
          extra={
            /* ⚠ THE COLOUR SITS ON THE WRAPPER, NOT ON THE ANCHOR — HAZARD 22. An unlayered
               `a { color: inherit }` beats the utility layer, so `text-ink-600` on the <a> emits
               a rule that loses. This is the second copy of that shape and it is deliberate: the
               details bar has its own in ProjectsEditPanel, because the two bars are rendered by
               two different components over two different useDraftForms. Extracting a shared
               Preview would couple them for four lines of markup. */
            <span className="flex items-center gap-1 text-ink-600">
              <a
                href={`/studio/projects/${slug}/preview`}
                target="_blank"
                rel="noopener"
                title="Opens the draft preview in a new tab."
                className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-cream-100"
              >
                Preview
              </a>
            </span>
          }
          primary={{
            label: "Save draft · Sections",
            onClick: saveDraft,
            disabled: !dirty || saveStatus === "saving" || hasBadVideoSrc,
            title: "Commits this study's section blocks.",
          }}
        />
      )}
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
        {/* THE STUDY ANNOUNCES WHAT IT IS BEFORE ANYONE GOES LOOKING FOR WHAT IS MISSING. A
            reader who opens boat-crest and finds one rail item should learn why from the header,
            not by inferring it from an absence. Accent-tinted rather than the neutral template
            chip beside it, because it is a different KIND of fact — the template chip says how it
            renders, this says who renders it. */}
        {bespoke && (
          <span className="shrink-0 rounded-full border border-accent-500/35 bg-accent-500/[0.07] px-2 py-0.5 text-[10px] uppercase tracking-eyebrow text-accent-600">
            Hand-built
          </span>
        )}
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
        {/* NO TOGGLE ON A BESPOKE STUDY, BECAUSE THERE IS NO BOARD TO TOGGLE TO. The Board
            arranges sections; with none it is an empty grid whose Add button cannot work, since
          `BESPOKE_SLUGS` gates the write path. A CONTROL THAT CANNOT DO ANYTHING IS WORSE THAN
            AN ABSENT ONE — this repo has deleted that shape four times (FIT_THRESHOLD_PX, the 2xl
            radius, the ink-700 sites, .blog-editable.is-selected). ABSENT, NOT DISABLED: a
            disabled toggle still asserts a Board exists. */}
        {!bespoke && (
        <>
        {/* EDITOR | BOARD. Not new machinery — `selection` already encoded the board as a state,
            so this is that state getting a control instead of a back link.
            EDITOR IS FIRST, AND THE ORDER IS THE ONLY THING THAT CHANGED. It reads left to right
            as what the panel opens on, so the control agrees with the default beside it rather
            than listing the states in the order they were built. */}
        <div role="group" aria-label="View" className="inline-flex shrink-0 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 p-0.5">
          {([["editor", "Editor"], ["board", "Board"]] as const).map(([v, label]) => {
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
        </>
        )}
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
      {!bespoke && showBoard && boardNode}

      <div hidden={!bespoke && showBoard} className="flex min-h-0 flex-1">
        <ThreePaneShell
          fitThresholdPx={sidebarPx + CS_PANES_SUM}
          listNoun="sections"
          /* THE CANVAS PANE IS THE GROUND, NOT THE CARD'S WRAPPER. The section card is
             cream-50 and sat on a cream-50 pane at contrast 1.00 — the same colour — so its
             only edge was a 1px @ 8% hairline that the 0.646 canvas scale renders at
             0.646px. Cream-100 puts it at 1.05.
             NOTE WHAT THIS COSTS, because it is a real trade rather than a free win: the
             inspector is ALREADY cream-100, so the three panes now step 200 / 100 / 100
             instead of 200 / 50 / 100 and the canvas no longer differs in tone from the
             inspector. They stay divided by the inspector's own `border-l border-ink-950/22`,
             which is the harder of the studio's two hairlines and was already carrying that
             edge on its own.
             Blog passes nothing and keeps the cream-50 default, so its article-measure canvas
             is untouched — the reason this is a prop and not an edit to the shell. */
          canvasGround="bg-cream-100"
          list={
            <SectionsRail
              sections={values.sections}
              sectionIds={ids.sectionIds}
              selection={selection === "details" ? "details" : (selectedSectionId ?? "")}
              onSelect={(next: string) => setSelection(next === "details" ? "details" : { id: next })}
              onMove={moveSection}
              needsImage={sectionNeedsImage}
              detailsDirty={detailsDirty}
              bespoke={bespoke}
            />
          }
          canvasDock={
            /* THE DOCK, at the canvas pane's foot. It is a SIBLING of the scroll region rather
               than a child, so it compresses the canvas instead of covering it — nothing is ever
               hidden behind it — and it stays outside the subtree `useFitToWidth` observes.
               HIDDEN UNDER DETAILS, NEVER UNMOUNTED, for the reason everything else in this
               editor is: Details has no canvas to select from, so a dock there would name a field
               you cannot click, but unmounting it would throw away the caret of whoever is
               mid-word when they glance at Details. */
            <SelectionDock
              hidden={showDetails}
              selected={selectedField}
              value={selectedField ? readField(selectedField) : ""}
              onChange={writeSelected}
              onDismiss={dismissField}
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

    </>
  );
}
