"use client";

// SK-3b — a reusable inline array editor for a string[] (add / remove / reorder /
// edit-in-place). Extracted VERBATIM from the AboutEditPanel focus-chips pattern
// so it can be shared. AboutEditPanel / ProcessEditPanel still carry their own
// inline copies for now (out of SK-3b scope); they can migrate to this later.
//
// Controlled: the parent owns the array and passes onChange; onBlur (optional)
// lets the parent auto-save on field blur, exactly like the About panel.
// P4 4(b)-ii — the row mechanics now come from useItemList, shared with the block
// forms. This file's markup is unchanged; only the four local operations moved.
import { useItemList } from "./useItemList";
import { IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";

type Props = {
  chips: string[];
  onChange: (next: string[]) => void;
  /** Fired on a chip input blur — the parent's save-on-blur (skills saveDraft). */
  onBlur?: () => void;
  /** The "Add" button label, e.g. "Add skill". */
  addLabel?: string;
  placeholder?: string;
  /** Noun for a BLANK row in the reorder/remove aria-labels (e.g. "tag", "chip").
   *  Defaults to "item" so existing callers are unchanged. */
  itemNoun?: string;
  /** Optional context noun phrase (e.g. "stage 2") appended to the control
   *  aria-labels: "Move X up in <ctx>" and "Remove X from <ctx>". Omitted → no
   *  suffix. Lets a nested caller (Process tags) restore its exact wording. */
  ariaContext?: string;
};

export default function ChipListEditor({
  chips,
  onChange,
  onBlur,
  addLabel = "Add item",
  placeholder,
  itemNoun = "item",
  ariaContext,
}: Props) {
  const inSuffix = ariaContext ? ` in ${ariaContext}` : "";
  const fromSuffix = ariaContext ? ` from ${ariaContext}` : "";
  const list = useItemList(chips, onChange, () => "");

  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-500 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-4";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-1.5">
        {chips.map((chip, i) => {
          const name = chip.trim() || itemNoun;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={chip}
                ref={list.focusRef(i)}
                onChange={(e) => list.set(i, e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder}
                // DELIBERATELY LOCAL — the FLEX-CHILD family of the deliberate locals (see
                // ralph's studio-ink suite). The shared exports hardcode a full-width
                // utility, which fights `flex-1` in this row; dropping it from the exports
                // would touch every consumer to serve two sites, and a third export whose
                // only distinction is a layout context is a constant nobody would remember.
                // Local does not mean behind: the well (height, ground, border) tracks
                // blocks/fields.tsx exactly and moves whenever it does.
                className="min-h-11 min-w-0 flex-1 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
              />
              {/* preventDefault on mousedown keeps focus on the input so the click
                  does not blur-save mid-op (the About-panel fix). */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => list.move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${name} up${inSuffix}`}
                className={iconBtn}
              >
                <IconChevronUp />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => list.move(i, 1)}
                disabled={i === chips.length - 1}
                aria-label={`Move ${name} down${inSuffix}`}
                className={iconBtn}
              >
                <IconChevronDown />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => list.remove(i)}
                aria-label={`Remove ${name}${fromSuffix}`}
                className="grid size-8 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-500 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-4"
              >
                <IconX />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={list.add}
        className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
      >
        <IconPlus /> {addLabel}
      </button>
    </div>
  );
}
