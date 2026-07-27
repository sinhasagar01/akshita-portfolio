"use client";

// P4 4(b)-ii — the field primitives the 14 block forms are built from, so each form
// is a declaration of its schema rather than fourteen copies of the same markup.
//
// Every control is CONTROLLED and preserves what it was given. None of them trim,
// coalesce, or drop an empty value — a field that reads "" writes "" back. That is
// the hard requirement at the form layer: Keystatic writes every key including the
// empty ones, so a form that tidies them up rewrites blocks the owner never
// touched, which is exactly what the surgical bar fails on.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useItemList } from "../useItemList";
import { IconChevronUp, IconChevronDown, IconX, IconPlus } from "../icons";
import ImageThumb from "../ImageThumb";

// CS-3 — the Content | Style split. A section's fields are grouped into two tabs;
// this context carries which tab is active, and TabGroup wraps a run of fields so
// they show only under their tab. Presentational only — the wrapper is a hidden
// toggle, so both tabs' fields stay MOUNTED (no lost input, no field renames, no
// change to what any field posts).
export type FieldTab = "content" | "style";
const FieldTabContext = createContext<FieldTab>("content");

export function FieldTabProvider({ tab, children }: { tab: FieldTab; children: ReactNode }) {
  return <FieldTabContext.Provider value={tab}>{children}</FieldTabContext.Provider>;
}

/** Show `children` only when the active field-tab matches `group`. Hidden (not
 *  unmounted) otherwise, so a field keeps its value and caret across a tab switch. */
export function TabGroup({
  group,
  className = "flex flex-col gap-2",
  children,
}: {
  group: FieldTab;
  className?: string;
  children: ReactNode;
}) {
  const tab = useContext(FieldTabContext);
  return (
    <div hidden={tab !== group} className={className}>
      {children}
    </div>
  );
}

// CS-3 progressive disclosure — empty OPTIONAL inputs collapse behind a per-group
// reveal so a section is not a wall of blank boxes. This HIDES the input only: the
// value stays in form state and is still posted (the 4b-ii empties-preserved rule
// and the sanitizer, which requires every key, are untouched → save shape stays
// byte-identical). Required or already-filled fields always render.
//
// "blank" reuses the studio's trim-based non-blank notion (LinksEditPanel.nonBlank).
// "optional" is declared per field by the form, from the renderer's opt()/num()
// types — a required field never passes `optional`, so it never collapses.
const isBlankText = (v: string) => v.trim() === "";

type DisclosureCtx = {
  revealed: boolean;
  reveal: () => void;
  report: (id: string, collapsed: boolean) => void;
};
const DisclosureContext = createContext<DisclosureCtx | null>(null);

/**
 * Wraps a run of fields: required/filled ones render inline; when any OPTIONAL field
 * in it is blank (and it is not yet revealed), a reveal control shows the rest. The
 * reveal is STICKY for the session — once shown, a field never disappears mid-edit.
 */
export function DisclosureGroup({
  revealLabel = "More options",
  className = "flex flex-col gap-2",
  children,
}: {
  revealLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const report = useCallback((id: string, isCollapsed: boolean) => {
    setCollapsed((prev) => {
      if (isCollapsed === prev.has(id)) return prev;
      const next = new Set(prev);
      if (isCollapsed) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const ctx = useMemo<DisclosureCtx>(
    () => ({ revealed, reveal: () => setRevealed(true), report }),
    [revealed, report]
  );
  return (
    <DisclosureContext.Provider value={ctx}>
      <div className={className}>
        {children}
        {!revealed && collapsed.size > 0 && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> {revealLabel}
          </button>
        )}
      </div>
    </DisclosureContext.Provider>
  );
}

/**
 * For an OPTIONAL field: whether it should render. It collapses when it is optional,
 * blank, its group is not revealed, AND it has not been shown yet this session (the
 * shownRef latch is the "never re-collapse once it had a value" rule). It reports its
 * collapsed state up to the nearest DisclosureGroup so the reveal control appears.
 * Outside a DisclosureGroup, or when not optional, it always renders.
 */
function useFieldVisible(optional: boolean | undefined, blank: boolean): boolean {
  const ctx = useContext(DisclosureContext);
  const id = useId();
  const shownRef = useRef(false);
  const visible = !optional || !ctx ? true : ctx.revealed || !blank || shownRef.current;
  if (visible) shownRef.current = true;
  const collapsed = Boolean(optional) && ctx !== null && !visible;
  useEffect(() => {
    if (!ctx) return;
    ctx.report(id, collapsed);
    return () => ctx.report(id, false);
  }, [ctx, id, collapsed]);
  return visible;
}

// Exported so a bespoke field (VE-3's video URL input, which owns an inline error the
// shared TextField has no slot for) can match every other input to the pixel instead of
// re-deriving the class string and drifting.
// THE WELL — cream-50, the bottom step of the STUDIO GROUND LADDER (globals.css).
//
// THE RULE IS RELATIONAL AND IT HAS NOW BEEN READ AS AN ABSOLUTE TWICE. An input reads as a
// well because it is one step LIGHTER than the surface holding it, never because it is a
// particular colour. #205 measured `bg-cream-50` on a `bg-cream-50` panel, correctly saw that
// the input and its ground were identical, and fixed it by darkening THE INPUT to cream-100 —
// which inverted the relation and reproduced the identical collision on the cream-100
// inspector. The fidelity pass then proposed "inputs to cream-50", another absolute, which
// would have collided on the six cream-50 entry panels instead.
//
// The ladder fixes it as an ORDER rather than a value: cream-200 chrome, cream-100 field
// surface, cream-50 well. This string is the bottom step, and the panel that holds it is the
// middle one. Change either and you must check the other.
//
// HEIGHT IS 44px VIA `min-h-11`, NOT VIA PADDING. Measured, the box was 39px (21px line-height
// + 8/8 padding + 2 border), not the 36 the direction assumed. Deriving 44 from padding would
// mean two different padding values for the 13px and 14px variants, which would make them
// differ by more than the font size and break `studio-nav-active` G6 — the gate that keeps
// #199's dedupe honest. A min-height lands both on exactly 44 and leaves the ONE token of
// difference intact.
export const inputCls =
  "w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-3 py-2 text-[13px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

/**
 * The same box at 14px, for the ENTRY PANELS rather than the block forms.
 *
 * THE 13px/14px SPLIT IS DELIBERATE AND UNRESOLVED — DO NOT MERGE THESE TWO. They were seven
 * hand-copied strings across seven files until #199 collapsed them, and the copies had
 * DRIFTED: four panels carried 14px, the block forms and the case-study index carried 13px.
 * The two differ by exactly ONE token, `text-[14px]` against `text-[13px]`, and nothing else.
 *
 * Unifying them CHANGES RENDERED FONT SIZE on real surfaces — four of them one way, two the
 * other — so it is a design decision and the owner's call, not a cleanup. #199 deduped only
 * what was byte-identical and deliberately left this split standing rather than silently
 * picking a winner. Read as an accident and merged, it would move type on screen.
 *
 * NAMED FOR WHAT DIFFERS, not for a surface, because it spans four unrelated panels.
 */
export const inputClsMd =
  "w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

/** The same box, in the rejection state — a danger border and ring.
 *
 *  IT CARRIES THE GEOMETRY INDEPENDENTLY, which is why it moves with the other two by hand.
 *  It is not derived from `inputCls`, so it is the copy that silently keeps the OLD shape when
 *  the well changes — and its only visible moment is a rejected value, so nobody would notice
 *  for a long time. There are FIVE strings with this geometry; see the ralph suite, which
 *  enumerates them so a sixth is loud. */
export const inputErrorCls =
  "w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-danger-600 bg-cream-50 px-3 py-2 text-[13px] text-ink-950 outline-none ring-1 ring-danger-600/20 transition-colors";

/**
 * The field label — STRUCTURE, not a caption. 11px / 700 / 0.14em / ink-600.
 *
 * `--text-eyebrow` IS DELIBERATELY NOT EDITED, AND THE SIZE IS A LOCAL UTILITY INSTEAD.
 * That token is read by ELEVEN files in components/case-study — canvas code — plus
 * components/ui/SectionLabel, app/not-found and app/(portfolio)/error. Changing it to get an
 * 11px studio label would move the case-study canvas and two public pages, which is the one
 * thing this arc must not do. `tracking-eyebrow` STAYS because 0.14em is already the value
 * this label wants, so nothing is gained by localising it too.
 */
export const labelCls = "text-[11px] font-bold uppercase tracking-eyebrow text-ink-600";

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  inputRef?: (el: HTMLElement | null) => void;
  /** Optional field — collapses behind its DisclosureGroup's reveal while blank. */
  optional?: boolean;
}) {
  const visible = useFieldVisible(optional, isBlankText(value));
  return (
    <label className="flex flex-col gap-1" hidden={!visible}>
      <span className={labelCls}>{label}</span>
      <input
        type="text"
        value={value}
        ref={inputRef}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={inputCls}
      />
    </label>
  );
}

/** Multiline. Also the "Rich" editor: `**bold**` is plain text in the raw file —
 *  the adapter parses it into Rich runs at render, so there is nothing richer to
 *  build here, and building one would produce markup the schema cannot hold. */
export function TextArea({
  label,
  value,
  onChange,
  onBlur,
  rows = 3,
  inputRef,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  rows?: number;
  inputRef?: (el: HTMLElement | null) => void;
  /** Optional field — collapses behind its DisclosureGroup's reveal while blank. */
  optional?: boolean;
}) {
  const visible = useFieldVisible(optional, isBlankText(value));
  return (
    <label className="flex flex-col gap-1" hidden={!visible}>
      <span className={labelCls}>{label}</span>
      <textarea
        rows={rows}
        value={value}
        ref={inputRef}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${inputCls} resize-y leading-relaxed`}
      />
    </label>
  );
}

/**
 * A `number | null` field — the tier-3 null hazard.
 *
 * NULL AND ZERO ARE DIFFERENT VALUES and the file distinguishes them: the same
 * device carries `rotate: -6` while its sibling carries `rotate: null`, and there
 * are 106 nulls across the three case studies. A form that renders null as "" and
 * saves "" — or renders 0 as blank via `||` and saves null — has changed content
 * the owner never touched. So:
 *   - `value ?? ""` (never `||`): a real 0 shows "0", only null shows blank.
 *   - blank -> null, never "" and never 0.
 *   - unparseable -> no write at all, so the previous value stands.
 *
 * It keeps the raw text locally rather than deriving it from `value`, because a
 * controlled numeric input cannot hold the intermediate states of typing a real
 * value here: "-" parses to NaN, so a purely controlled field would reject the
 * keystroke and wipe the minus sign — and `rotate: -6` means negatives must be
 * typable. The parent still only ever sees `number | null`.
 */
export function NumberField({
  label,
  value,
  onChange,
  onBlur,
  optional,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  onBlur?: () => void;
  /** Optional field — collapses behind its DisclosureGroup's reveal while blank
   *  (null). A real 0 is NOT blank, matching the null-vs-zero discipline below. */
  optional?: boolean;
}) {
  const visible = useFieldVisible(optional, value === null);
  const toText = (v: number | null) => (v === null ? "" : String(v));
  const [text, setText] = useState(() => toText(value));
  const seen = useRef(value);

  // Adopt the parent's value when IT changed (Cancel, a reload) — but not while
  // the user is mid-edit, or typing "1." would be rewritten to "1". Comparing
  // against `seen` distinguishes "the parent moved" from "we moved it".
  if (seen.current !== value) {
    seen.current = value;
    const parsed = text.trim() === "" ? null : Number(text);
    if (parsed !== value) setText(toText(value));
  }

  return (
    <label className="flex flex-col gap-1" hidden={!visible}>
      <span className={labelCls}>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (next.trim() === "") {
            seen.current = null;
            onChange(null);
            return;
          }
          const n = Number(next);
          if (!Number.isFinite(n)) return; // "-", "1e", "abc" — hold, don't write
          seen.current = n;
          onChange(n);
        }}
        onBlur={onBlur}
        placeholder="auto"
        className={inputCls}
      />
    </label>
  );
}

/**
 * A block image field — P4 4(b)-iv. The single choke point every one of the six
 * image field paths flows through, which is why wiring upload here lights up all
 * five image-bearing kinds at once.
 *
 * The client NEVER names the file. It posts the bytes; the server normalizes to
 * webp, hashes THOSE bytes, derives the path, and returns it. So the path depends on
 * the image and nothing else — not the array position (which is how Keystatic names
 * nested images, and why it is locked out of these files), not the session, not any
 * editable field.
 *
 * Clearing writes `null`, never "" — the PR-B null discipline. `src` is
 * `string | null`, null is how "no image" is spelled, and the sanitizer rejects "".
 *
 * `alt` is NOT here — it stays an editable TextField beside this. It is text, it is
 * real accessibility work, and it is independent of the binary.
 */
export function BlockImageField({
  label,
  src,
  slug,
  collection,
  onChange,
}: {
  label: string;
  src: string | null;
  slug: string;
  /** PR 3a — which collection's image tree the upload lands in ("projects" | "blog").
   *  Threaded parallel to `slug` and REQUIRED: the server maps it to a base and rejects
   *  an unknown one, so a caller that forgets it is a compile error here, not a silent
   *  mis-scope. */
  collection: string;
  /** Receives the server-derived path, or null on clear.
   *
   *  IT ALSO HANDS UP THE `File`, and that second argument is what lets a canvas draw the
   *  image before publish. The path 404s until then, and `draftImages` — the array the
   *  canvas rewriter consults — is a snapshot taken before this upload existed. Only the
   *  bytes the browser already holds can resolve it. See lib/studio/preview-map.ts.
   *
   *  THE `File`, NOT AN OBJECT URL, which is #190's finding restated. Handing up a url makes
   *  two components share one revocable resource that neither can safely free. Handing up the
   *  File lets each holder make its own from the same Blob and free exactly that.
   *
   *  ADDITIVE, AND THAT IS WHAT MADE IT SAFE TO DO HERE RATHER THAN FORK THE COMPONENT. Both
   *  call sites pass one-arity arrows, and TypeScript accepts a lower-arity function where a
   *  higher-arity one is expected. Adding a parameter changes nothing about the first one, so
   *  a caller that does not want the File simply does not name it. */
  onChange: (src: string | null, file?: File) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("collection", collection);
      body.append("slug", slug);
      body.append("file", file);
      const res = await fetch("/api/studio/upload-block-image", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setError("Image upload needs github mode (dev)");
        return;
      }
      if (res.ok && json.ok && typeof json.src === "string") {
        // The File goes up WITH the path. It has been in scope here since this component was
        // written and was thrown away, which is the whole of the bug: the path is not
        // fetchable until publish, and the bytes that are were sitting right here.
        onChange(json.src, file);
        return;
      }
      setError(
        {
          unsupported_type: "That file type is not supported. Use a PNG, JPEG or WebP.",
          file_too_large: "That image is too large. The limit is 12 MB.",
          image_processing_failed: "That image could not be processed.",
        }[json.error as string] ?? "Upload failed. Try again."
      );
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
      // Let the same file be chosen again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-100 px-3 py-2">
        <ImageThumb src={src} />
        {src ? (
          <code className="min-w-0 flex-1 truncate text-[11px] text-ink-600">{src}</code>
        ) : (
          <span className="flex-1 text-[11px] text-text-subtle">No image set</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-2.5 py-1 text-[11px] transition-colors hover:border-accent-500/40 hover:text-accent-600 disabled:opacity-40"
        >
          {busy ? "Uploading…" : src ? "Replace" : "Upload"}
        </button>
        {src && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(null)}
            aria-label={`Clear ${label}`}
            className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
          >
            <IconX />
          </button>
        )}
      </div>
      {/* Announced: an upload failure is the one thing here a screen-reader user
          cannot otherwise notice, since the visible change is a small line of text. */}
      {error && (
        <span role="alert" className="text-[10px] text-accent-600">
          {error}
        </span>
      )}
    </div>
  );
}

/** A closed set of options — the section shell's `variant` and `layout`. The
 *  options come from the caller, which reads them from the same const the
 *  sanitizer validates against, so the two cannot disagree. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  onBlur,
  hint,
  optionLabel,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  onBlur?: () => void;
  hint?: string;
  /** Human label per option value. Defaults to the value itself, so existing
   *  callers (variant/layout) are byte-identical; the CS-6a frame picker uses it to
   *  show "Default (from template)" for the "" option. */
  optionLabel?: (v: T) => string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        onBlur={onBlur}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabel ? optionLabel(o) : o}
          </option>
        ))}
      </select>
      {hint && <span className="text-[10px] text-text-subtle">{hint}</span>}
    </label>
  );
}

export function CheckField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="flex w-fit items-center gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        className="size-3.5 accent-accent-500"
      />
      <span className="text-[12px] text-ink-600">{label}</span>
    </label>
  );
}

/**
 * A block's nested array (stats, cards, items, steps) — add / remove / reorder,
 * with each row a card of arbitrary fields.
 *
 * Rows key off the index, matching ChipListEditor. That is safe here and NOT a
 * violation of the SK-3b stable-id rule: that rule governs the ADDRESSING model
 * (which block an edit targets, which must survive a reorder), whereas these rows
 * hold no state of their own — every value is controlled by the panel's `sections`
 * — so an index key is a render detail, not an identity.
 */
export function ItemRows<T>({
  items,
  onChange,
  empty,
  addLabel,
  itemNoun,
  rowLabel,
  noAdd = false,
  noRemove = false,
  addNote,
  children,
}: {
  items: readonly T[];
  onChange: (next: T[]) => void;
  /** MUST return every key the schema declares, including "" and false — a new row
   *  that omits one drops it from the file. The sanitizer rejects the save if so. */
  empty: () => T;
  addLabel: string;
  itemNoun: string;
  rowLabel?: (item: T, i: number) => string;
  /**
   * Hide "add". Two different reasons need it, and both end the same way — an
   * added row would produce content the FAIL-LOUD SSG adapter refuses, so the
   * owner could add it, preview it happily (preview mode substitutes a
   * placeholder), publish, and get a failed build. Worse, one such row blocks the
   * WHOLE publish, including unrelated edits, until it is found and removed.
   *   - heroCover.devices: the schema validates exactly two, and the adapter
   *     re-validates when narrowing to its tuple, so a third throws at SSG.
   *   - any array whose row REQUIRES an image (deviceShelf.devices,
   *     featureRows.features, beforeAfter.pairs): a new row's src is null, and
   *     nothing can set it until 4(b)-iv, so it can never be published.
   * `addNote` explains which, so the missing button is not a mystery.
   */
  noAdd?: boolean;
  /** Hide "remove". Only heroCover.devices needs this (exactly two). Removing is
   *  otherwise always safe, and is the escape hatch for a bad row. */
  noRemove?: boolean;
  /** Shown in place of the add button when noAdd. */
  addNote?: string;
  children: (args: {
    item: T;
    set: (next: T) => void;
    focusRef: (el: HTMLElement | null) => void;
  }) => ReactNode;
}) {
  const list = useItemList(items, onChange, empty);
  const iconBtn =
    "grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3.5";

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const name = rowLabel?.(item, i) || `${itemNoun} ${i + 1}`;
        return (
          <div key={i} className="rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-100 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-eyebrow text-ink-400">{name}</span>
              <div className="flex gap-1">
                {/* preventDefault on mousedown keeps focus off these controls so the
                    click cannot blur-save mid-op (the About-panel fix). */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => list.move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${name} up`}
                  className={iconBtn}
                >
                  <IconChevronUp />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => list.move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label={`Move ${name} down`}
                  className={iconBtn}
                >
                  <IconChevronDown />
                </button>
                {!noRemove && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => list.remove(i)}
                    aria-label={`Remove ${name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
                  >
                    <IconX />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {children({ item, set: (v) => list.set(i, v), focusRef: list.focusRef(i) })}
            </div>
          </div>
        );
      })}
      {noAdd ? (
        addNote ? (
          <p className="text-[10px] text-text-subtle">{addNote}</p>
        ) : null
      ) : (
        <button
          type="button"
          onClick={list.add}
          className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
        >
          <IconPlus /> {addLabel}
        </button>
      )}
    </div>
  );
}
