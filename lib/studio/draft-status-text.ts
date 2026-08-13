// What the publish pill says about draft state. One pure function, no imports.
//
// ---- ⚠ WHY THIS LEFT THE COMPONENT --------------------------------------------------------
//
// It was a ternary chain inside `PublishBar`, and a mutation proved that chain untestable in the
// only way that mattered. Setting `firstFailure` to null makes the per-entry sentence UNREACHABLE
// while leaving every word of it in the source — and the rows guarding it were regexes over that
// source, so they went on passing against a message nobody could ever see.
//
// THAT IS PRESENCE VERSUS RESOLUTION, which this project has paid for before: a bundle grep once
// "verified" two shadowed CSS values by proving both were present, when the question was which one
// resolved. A string in a file and a string on screen are different quantities.
//
// `bar-clearance.ts` made this same split for the same reason and its header says the arithmetic it
// separated out was the part that was wrong. So the branching lives here, where a suite can call it
// with real inputs and read the real answer, and the component is left with a call.
//
// DEPENDENCY-FREE ON PURPOSE, so ralph can load it as a raw `.ts` leaf.

/** One entry the draft branch held and the reader could not parse. Structural, not imported: this
 *  file must stay loadable by a leaf runner, and the owning type lives in a module that reaches
 *  GitHub. `draft-overlay-degrade` asserts the two agree. */
export type DraftFailure = { collection: string; slug: string };

export type DraftStatusInput = {
  publishing: boolean;
  /** The WHOLE read failed — nothing is known and the studio is showing published content. */
  readError: boolean;
  /** Specific entries that would not parse. The branch was read fine; everything else is a draft. */
  failures: readonly DraftFailure[];
  /** The draft branch differs from the published one. */
  unpublished: boolean;
};

/**
 * The pill's standing sentence.
 *
 * ⚠ THE TWO FAILURE STATES MEAN OPPOSITE THINGS AND MUST NOT SHARE A SENTENCE. `readError` means
 * the studio is showing PUBLISHED content and the author should not trust what they see. A
 * `failures` entry means the studio is showing their DRAFT everywhere except one file. Telling an
 * author "showing published content" when only one entry failed would send them re-editing work
 * that was never lost — the same lie as the old message, pointing the other way.
 *
 * ⚠ AND THE ORDER IS LOAD-BEARING. `readError` is checked FIRST, because when nothing could be read
 * the failure list is empty and the weaker sentence would never fire anyway — but a future edit
 * that populated both must still show the stronger one. Asserted rather than left to reading.
 */
export function draftStatusText(input: DraftStatusInput): string {
  if (input.publishing) return "Publishing…";
  if (input.readError) {
    return "Couldn't load your draft. Showing published content. Reload to try again.";
  }
  const first = input.failures[0];
  if (first) {
    const where = `${first.collection}/${first.slug}`;
    return input.failures.length === 1
      ? `Couldn't read ${where}. Everything else is your draft.`
      : `Couldn't read ${input.failures.length} draft entries, including ${where}. Everything else is your draft.`;
  }
  return input.unpublished ? "Unpublished changes" : "All changes published";
}

/** Whether the sentence above is reporting a problem, which is what the pill tones on. Derived from
 *  the same two inputs rather than recomputed at the call site, so the words and the colour cannot
 *  disagree about whether anything is wrong. */
export function draftStatusIsProblem(input: DraftStatusInput): boolean {
  return !input.publishing && (input.readError || input.failures.length > 0);
}
