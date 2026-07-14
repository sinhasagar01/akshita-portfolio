"use client";

// P4 4(b)-ii — the field primitives the 14 block forms are built from, so each form
// is a declaration of its schema rather than fourteen copies of the same markup.
//
// Every control is CONTROLLED and preserves what it was given. None of them trim,
// coalesce, or drop an empty value — a field that reads "" writes "" back. That is
// the hard requirement at the form layer: Keystatic writes every key including the
// empty ones, so a form that tidies them up rewrites blocks the owner never
// touched, which is exactly what the surgical bar fails on.
import { useRef, useState, type ReactNode } from "react";
import { useItemList } from "../useItemList";
import { IconChevronUp, IconChevronDown, IconX, IconPlus, IconImage } from "../icons";

const inputCls =
  "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[13px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

const labelCls = "text-eyebrow uppercase tracking-eyebrow text-ink-400";

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  inputRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  rows?: number;
  inputRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
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
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  onBlur?: () => void;
}) {
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
    <label className="flex flex-col gap-1">
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
 * An image field, READ-ONLY — the inert seam to 4(b)-iv.
 *
 * There is deliberately no input bound to `src` and no onChange: this component
 * CANNOT emit a src, so no edit path can disturb one. Upload lands in 4(b)-iv,
 * where the image and its geometry want one visual affordance rather than a path
 * string and five number boxes.
 *
 * `alt` is NOT here — it stays an editable TextField beside this. It is text, it
 * is real accessibility work, and it is independent of the binary.
 */
export function ReadOnlyImage({ label, src }: { label: string; src: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-2 rounded-md border border-dashed border-ink-950/15 bg-cream-100 px-3 py-2">
        <span className="grid size-6 shrink-0 place-items-center rounded text-ink-400 [&>svg]:size-3.5">
          <IconImage />
        </span>
        {src ? (
          <code className="min-w-0 flex-1 truncate text-[11px] text-ink-600">{src}</code>
        ) : (
          <span className="flex-1 text-[11px] text-text-subtle">No image set</span>
        )}
        <span className="shrink-0 text-[10px] text-text-subtle">Replacing images is coming</span>
      </div>
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
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  onBlur?: () => void;
  hint?: string;
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
            {o}
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
    "grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-3.5";

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const name = rowLabel?.(item, i) || `${itemNoun} ${i + 1}`;
        return (
          <div key={i} className="rounded-md border border-ink-950/8 bg-cream-100 p-3">
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
                    className="grid size-7 shrink-0 place-items-center rounded-md border border-ink-950/8 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
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
          className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
        >
          <IconPlus /> {addLabel}
        </button>
      )}
    </div>
  );
}
