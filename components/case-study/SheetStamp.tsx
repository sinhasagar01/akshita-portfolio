import type { GlowWord } from "@/lib/case-studies/types";

/** DEVICE — THE STAMP. One device, three consumers: a section's authored word, a feature row's
 *  index, and the pinned story's index.
 *
 *  ⚠ IT REPLACES `GlowWord`, WHICH WAS A GIANT SLANTED WORD, AND THE OWNER CHOSE THE REPLACEMENT
 *  FROM FOUR STATES SHOWN AT FULL SIZE — as built, deleted, a large mono stamp, and this. A drawing
 *  print does carry a mark across it, so the DEVICE was never foreign to the direction; the display
 *  face at 9rem in italic was.
 *
 *  ⚠ AND IT IS NOT A WATERMARK, WHICH IS THE ONE THING TO KEEP STRAIGHT. A watermark is a wash a
 *  reader looks past; this is a small ruled mark a reader can read. The name changed with the thing,
 *  because `GlowWord` describing a stamp would be the stale-comment defect built into an identifier.
 *
 *  ---- WHY ONE COMPONENT RATHER THAN THREE STYLED SPANS -------------------------------------
 *
 *  The three sites drew the same idea three times: `GlowWord` took an authored word, `FeatureRows`
 *  inlined its own span for a numeral, `WorkStory` inlined another. All three read the same `GLOW`
 *  constant and set their own size, and two of them positioned by hand. Three consumers is this
 *  repository's own threshold for lifting a thing to one place, and the alternative is what the
 *  record calls the parallel-list defect wearing JSX.
 *
 *  The GEOMETRY lives in `.sheet-stamp` beside the other sheet devices, not here. A device's tokens
 *  are a vocabulary, and this file's job is only to pick a corner. */

export type StampCorner = "tl" | "tr" | "bl" | "br";

/** ⚠ THE CORNER IS DERIVED FROM WHICH SIDES THE AUTHOR SET, NOT FROM THEIR VALUES. The authored
 *  offsets were written for a word that bleeds off the edge — `bottom: -30px` — so their magnitudes
 *  cannot be reused by a mark that must sit inside. Which corner was left free is a real choice made
 *  per section and it survives; how far off the edge the old word hung does not.
 *
 *  Absent on both axes falls to the bottom-left, which is where the majority of the authored words
 *  already sat. */
export function cornerOf(word: Pick<GlowWord, "top" | "right" | "bottom" | "left">): StampCorner {
  const vertical = word.top ? "t" : "b";
  const horizontal = word.left ? "l" : word.right ? "r" : "l";
  return `${vertical}${horizontal}` as StampCorner;
}

export default function SheetStamp({
  text,
  corner = "bl",
  elementRef,
}: {
  text: string;
  /** Which corner of the nearest positioned ancestor to sit in. */
  corner?: StampCorner;
  /** ⚠ NAMED RATHER THAN `ref`, AND ONE CONSUMER IS WHY IT EXISTS AT ALL. `WorkStory` drives its
   *  stamp imperatively from a scroll handler — it writes `opacity` and a `scale` as the pinned
   *  story enters — so that node has to be reachable. React 19 would forward a bare `ref` here, and
   *  an explicit prop says out loud that ONE site animates this and the others do not, which a
   *  forwarded ref would leave for the next reader to discover. */
  elementRef?: React.Ref<HTMLSpanElement>;
}) {
  if (!text) return null;
  return (
    <span ref={elementRef} aria-hidden="true" className={`sheet-stamp sheet-stamp--${corner}`}>
      {text}
    </span>
  );
}
