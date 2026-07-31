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
import { FIELD_MEASURE } from "./blocks/fields";
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
    // INSIDE THE GROUP, SO NO BORDER AND NO RADIUS OF ITS OWN. Three separately bordered boxes
    // beside an input read as three unrelated controls; one bordered cluster with hairline
    // dividers reads as what it is — the row's controls. The contract's `.seg` is exactly this
    // shape (one border, `overflow:hidden`, `button+button{border-left}`), and it is also how
    // the studio's other grouped controls already draw.
    "grid size-8 shrink-0 place-items-center text-ink-400 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-4";

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
                // The measure applies here too. This is the FLEX-CHILD family (E2) — it stays
                // local because it needs `flex-1` where the shared export forces `w-full` — but
                // that is a MIN-width concern and the measure is a MAX one, so they compose.
                // Uncapped, these ran 1825px on a 2560 display inside About and Process.
                className={`min-h-11 min-w-0 flex-1 ${FIELD_MEASURE} rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30`}
              />
              {/* BORDERLESS, 2px APART — the contract's `.skrow .ctl`, and #240 used the WRONG
                  SPEC HERE. Its brief said the row controls should come "inline rather than
                  sitting in separate bordered boxes", which was the right direction; the shape I
                  reached for was `.seg` — one border, `overflow:hidden`, hairline dividers. But
                  `.seg` is the SITE-SETTINGS segmented toggle, a control that picks a VALUE and
                  wears a group border because its members are alternatives. These are a row's
                  ACTIONS: move up, move down, remove. They are not alternatives and do not want
                  a box drawn round them.
                  `.skrow .ctl` is `display:flex; gap:2px` with 32x32 borderless buttons — the
                  controls simply sit beside the field, which is what "inline" meant.
                  preventDefault on mousedown keeps focus on the input so the click does not
                  blur-save mid-op (the About-panel fix). */}
              <span className="inline-flex shrink-0 gap-0.5">
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
                // Hover is accent TEXT on a cream-200 wash, matching its siblings. It carries no
                // border of its own and neither does the cluster, so there is nothing for a
                // border-colour hover to draw on.
                className="grid size-8 shrink-0 place-items-center text-ink-400 transition-colors hover:bg-cream-200 hover:text-accent-600 [&>svg]:size-4"
              >
                <IconX />
              </button>
              </span>
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
