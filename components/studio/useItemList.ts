"use client";

// P4 4(b)-ii — add / remove / reorder / edit-in-place / focus-the-new-row for an
// array field, extracted from ChipListEditor so the block forms reuse the proven
// mechanics rather than re-deriving them fourteen times.
//
// THE LOGIC IS SHARED, THE MARKUP IS NOT — deliberately, and this is why it is a
// hook and not a generalized ChipListEditor. A chip row is a single-line input with
// its controls inline; a block's array row (a stat, a card, a callout) is a
// multi-field card with its controls stacked. One component serving both would need
// a layout variant prop and would serve neither well. What they genuinely share is
// these four operations, which is ~15 lines and easy to get subtly wrong (the
// move-at-the-edge guard, the focus-after-add without a layout effect).
//
// `empty` is the caller's, because only the caller knows the field's shape — and it
// MUST return every key the schema declares, including "" and false. A new row that
// omits a key would drop it from the committed file. The strict sanitizer backstops
// this: its per-kind validators require every field, so an `empty` that forgets one
// fails the save loudly rather than corrupting the yaml.
import { useRef } from "react";

// `items` is readonly because the Keystatic-derived raw types are readonly all the
// way down — which is a feature: it makes an in-place mutation of content a
// compile error, so the only way to change a value is to build a new one.
export function useItemList<T>(
  items: readonly T[],
  onChange: (next: T[]) => void,
  empty: () => T
) {
  // After "Add", focus the new row's first input without a layout effect: the row
  // records the index it wants, and the ref callback claims it on mount (the
  // About-B pattern).
  const pendingFocus = useRef<number | null>(null);

  return {
    pendingFocus,
    set: (i: number, v: T) => onChange(items.map((x, idx) => (idx === i ? v : x))),
    remove: (i: number) => onChange(items.filter((_, idx) => idx !== i)),
    add: () => {
      pendingFocus.current = items.length;
      onChange([...items, empty()]);
    },
    move: (i: number, dir: -1 | 1) => {
      const j = i + dir;
      if (j < 0 || j >= items.length) return;
      const next = [...items];
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    },
    /** Ref callback for a row's first input — claims a pending focus on mount. */
    focusRef: (i: number) => (el: HTMLElement | null) => {
      if (el && pendingFocus.current === i) {
        el.focus();
        pendingFocus.current = null;
      }
    },
  };
}
