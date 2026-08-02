// The post's status, as a WORD.
//
// ---- WHAT IT REPLACES, AND WHY A DOT WAS NOT ENOUGH -----------------------------------------
//
// The index showed a 6px dot — `bg-success-700` published, `bg-ink-400` otherwise — and then
// spent the first word of the meta line saying the same thing again. So status cost two places
// and read at neither: a 6px mark is not a state anyone parses at a glance, and the grey draft
// dot is the same grey as every other muted mark on the page, which says DISABLED rather than
// NOT PUBLISHED YET.
// The word becomes the chip and the dot goes. The meta line gets its word back and spends it on
// the topic instead.
//
// ---- THE DRAFT COLOUR IS DECLARED, NOT ASSUMED ----------------------------------------------
//
// `--color-draft-600` is a real `@theme` token, added for this. It had to be: a bare theme
// utility generates CSS only when the token behind it exists, so an undeclared `text-draft-600`
// would have emitted NOTHING and failed silently — hazard 23's shape, which `studio-tokens`
// gates by deriving its legal set from `@theme`.
// ONE TOKEN, TWO ALPHAS. The fill and the border are the same value at 12% and 34%, the way the
// Hand-built chip derives its pair from accent-500. Declaring `-bg` and `-edge` siblings would
// have shipped two tokens with one consumer each.
//
// PUBLISHED KEEPS THE EXISTING GREEN, which was already the only green in the palette and
// already meant exactly this. A new token for a state that had one is how a palette doubles.
import type { ReactNode } from "react";

/** Only an explicit "published" is published — the same fail-closed rule `/blog` renders by. */
export const isPublished = (status: string) => status === "published";

const BASE =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-[3px] text-[9px] font-semibold uppercase leading-none tracking-[0.12em]";

export default function BlogStatusChip({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}): ReactNode {
  const live = isPublished(status);
  return (
    <span
      className={`${BASE} ${
        live
          ? "border-success-700/34 bg-success-700/[0.10] text-success-700"
          : "border-draft-600/34 bg-draft-600/[0.12] text-draft-600"
      } ${className}`}
    >
      {live ? "Published" : "Draft"}
    </span>
  );
}
