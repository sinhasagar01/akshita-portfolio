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
import { adaptSections } from "@/lib/case-studies/adapter";
import SectionRenderer from "@/components/case-study/SectionRenderer";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { moveIn, removeAt, insertAt, setAt } from "./useItemList";
import { BLOCK_REGISTRY, BLOCK_LABELS, type BlockFormProps } from "./blocks/registry";
import { SectionShellForm, emptySection } from "./blocks/SectionShell";
import { FieldTabProvider, type FieldTab } from "./blocks/fields";
import { IconGrid, IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";

type SectionsFields = { sections: readonly RawSection[] };
/** The parallel stable ids, mirroring the sections structure exactly. */
type Ids = { sectionIds: string[]; blockIds: string[][] };

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
      <span className="truncate text-[11px] text-ink-600">{BLOCK_LABELS[kind]}</span>
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

/** CS-7c — the inline canvas: a live, READ-ONLY render of one section through the
 *  preview-mode adapter (placeholder for a missing image, never fail-loud) and the
 *  real SectionRenderer with `noReveal` so it stays visible in the panel. The
 *  `.case-study` scope pulls in the real cream-card + dark-band styling, and `web`
 *  gives the Bold-gallery treatment when the project is template=web. It only reads
 *  the current draft values — no state, no writes. */
function SectionCanvas({
  section,
  web,
  template,
  editable = false,
  onBlur,
  onReplaceImage,
}: {
  section: RawSection;
  web: boolean;
  template: string;
  /** CS-7d — activate in-place text editing on the rendered plain-string fields. */
  editable?: boolean;
  /** CS-7d — delegated blur: fires for any contentEditable field inside; the panel
   *  reads the target's data-edit markers and writes back through the seams. */
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** CS-7e — a Replace-image affordance was clicked; the panel resolves the image's
   *  block index + dotted path and starts the content-addressed upload. */
  onReplaceImage?: (blockIndex: number, imagePath: string) => void;
}) {
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest?.("[data-edit-image-replace]");
    if (!btn) return;
    const container = btn.closest("[data-edit-image-path]") as HTMLElement | null;
    const bi = container?.dataset.editBlockIndex;
    const path = container?.dataset.editImagePath;
    if (container && bi !== undefined && path) onReplaceImage?.(Number(bi), path);
  };
  let adapted: ReturnType<typeof adaptSections> = [];
  try {
    adapted = adaptSections([section], { mode: "preview", template });
  } catch {
    adapted = [];
  }
  const s = adapted[0];
  return (
    <div className="case-study overflow-hidden rounded-lg border border-ink-950/8 bg-canvas" onBlur={onBlur} onClick={onClick}>
      {s ? (
        <SectionRenderer section={s} web={web} noReveal editable={editable} />
      ) : (
        <p className="px-4 py-6 text-center text-[12px] text-ink-500">
          This section can’t be previewed yet — finish its required fields.
        </p>
      )}
    </div>
  );
}

export default function SectionsEditPanel({
  slug,
  sections: initialSections,
  template = "",
}: {
  slug: string;
  sections: readonly RawSection[];
  /** CS-7c — the case-study template, so the inline canvas renders the same
   *  Bold-gallery web treatment (or the mobile composition) the live page shows. */
  template?: string;
}) {
  const { setUnpublished } = usePublishSignal();
  const web = template === "web";

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
            const raw = t.innerText ?? "";
            const sf = ds.edit; // "eyebrow" | "title"
            if (sf === "eyebrow" || sf === "title") {
              const value =
                sf === "title" ? raw.replace(/\n{2,}/g, "\n").trim() : raw.replace(/\s*\n\s*/g, " ").trim();
              const cur = values.sections[selIdx] as unknown as Record<string, unknown>;
              if ((cur[sf] ?? "") === value) return;
              setSection(selIdx, { ...values.sections[selIdx], [sf]: value } as RawSection);
              return;
            }
            if (ds.editBlockIndex !== undefined && ds.editField === "text") {
              const value = raw.replace(/\s*\n\s*/g, " ").trim();
              const blockIndex = Number(ds.editBlockIndex);
              const curVal = (values.sections[selIdx].blocks[blockIndex]?.value ?? {}) as Record<string, unknown>;
              if ((curVal.text ?? "") === value) return;
              setBlockValue(ids.blockIds[selIdx][blockIndex], { ...curVal, text: value });
            }
          };
          return (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-eyebrow text-ink-400">
                <span>Live preview — click a title, eyebrow, quote, or image to edit it in place</span>
                {imageBusy && <span className="text-accent-600 normal-case tracking-normal">Uploading image…</span>}
                {imageError && <span className="text-accent-600 normal-case tracking-normal">{imageError}</span>}
              </div>
              <SectionCanvas
                section={values.sections[selIdx]}
                web={web}
                template={template}
                editable
                onBlur={onBlur}
                onReplaceImage={(blockIndex, path) => {
                  pendingImage.current = { selIdx, blockIndex, path };
                  setImageError(null);
                  imageInputRef.current?.click();
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

        {/* CS-7f — the CS-3 Content|Style split, reframed as Canvas | Inspector. The
            live canvas above is the content surface (inline text + image editing);
            "Canvas" holds the fallback forms for content that isn't inline-editable
            yet, and "Inspector" holds the style fields (variant, layout, glow, frame,
            geometry). Same roving-tabindex tablist; both panels stay mounted so
            switching loses no input, caret, or draft. */}
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
                {t === "content" ? "Canvas" : "Inspector"}
              </button>
            );
          })}
        </div>
        <FieldTabProvider tab={contentStyleTab}>
        <div id="cs-fieldtab-panel" role="tabpanel" tabIndex={-1} className="flex flex-col gap-6 outline-none">
        <p className="text-[11px] text-text-subtle">
          {contentStyleTab === "content"
            ? "Most text and images edit directly on the preview above. These fields cover the rest."
            : "Layout, glow, frames, and image geometry for this section."}
        </p>
        {values.sections.map((section, i) => (
          <div
            key={ids.sectionIds[i]}
            hidden={selectedSectionId !== ids.sectionIds[i]}
            className="flex flex-col gap-3 rounded-lg border border-ink-950/8 p-3"
          >
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
        </div>
        </FieldTabProvider>

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
