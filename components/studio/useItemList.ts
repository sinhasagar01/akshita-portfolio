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
import type { PreviewUpload } from "@/lib/studio/preview-map";

import { useRef } from "react";

/* ------------------------------------------------------- pure array primitives
 *
 * P4 4(b)-iii — extracted so a structural edit can be applied to the sections array
 * AND to the parallel stable-id array with the SAME function at the SAME index.
 * That identity is the lockstep guarantee: the ids cannot drift from the values
 * they name, because there is no second implementation to drift from. `setBlockValue`
 * locates a block through those ids, so a drift would silently edit the wrong block.
 */

/** Swap the item at `i` with its neighbour. A move off either end is a no-op. */
export const moveIn = <T,>(arr: readonly T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return [...arr];
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export const removeAt = <T,>(arr: readonly T[], i: number): T[] => arr.filter((_, idx) => idx !== i);

export const insertAt = <T,>(arr: readonly T[], i: number, v: T): T[] => [
  ...arr.slice(0, i),
  v,
  ...arr.slice(i),
];

export const setAt = <T,>(arr: readonly T[], i: number, v: T): T[] =>
  arr.map((x, idx) => (idx === i ? v : x));

// `items` is readonly because the Keystatic-derived raw types are readonly all the
// way down — which is a feature: it makes an in-place mutation of content a
// compile error, so the only way to change a value is to build a new one.
export function useItemList<T>(
  items: readonly T[],
  /** THE SECOND ARGUMENT CARRIES AN IMAGE PREVIEW UP, and it is optional so every existing
   *  caller compiles unchanged. A row that holds an image (deviceShelf, featureRows,
   *  beforeAfter) has to get the uploaded bytes from `ImgSpecFields` all the way to the panel
   *  that owns the preview map — three hops, of which this is the innermost. Dropping it here
   *  is why the case-study canvas showed a blank image until publish. See lib/studio/preview-map.ts. */
  onChange: (next: T[], upload?: PreviewUpload) => void,
  empty: () => T
) {
  // After "Add", focus the new row's first input without a layout effect: the row
  // records the index it wants, and the ref callback claims it on mount (the
  // About-B pattern).
  const pendingFocus = useRef<number | null>(null);

  return {
    pendingFocus,
    set: (i: number, v: T, upload?: PreviewUpload) => onChange(setAt(items, i, v), upload),
    remove: (i: number) => onChange(removeAt(items, i)),
    add: () => {
      pendingFocus.current = items.length;
      onChange([...items, empty()]);
    },
    move: (i: number, dir: -1 | 1) => {
      if (i + dir < 0 || i + dir >= items.length) return;
      onChange(moveIn(items, i, dir));
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
