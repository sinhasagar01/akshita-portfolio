// The save bar's state line — what it says, and how old the last save is.
//
// Pure and dependency-free on purpose, the same constraint that shapes `sidebar-width.ts` and
// `index-view.ts`: `--experimental-strip-types` can only load a leaf, and ralph asserts against
// these directly rather than rendering a bar to find out what it says.
//
// ---- WHY A STATE AND NOT AN INSTRUCTION ------------------------------------------------------
//
// The bar used to end in a permanent instruction — "Auto-saves to draft on blur. Publish from the
// Hero panel." and three siblings. An instruction is read once and is noise every time after; a
// state is read every time. So the idle string becomes a state and the instruction moves to the
// `title`, discoverable without being narrated forever.
//
// ⚠ THIS IS A NARROWER CHANGE THAN IT LOOKS, AND THE RECORD SHOULD SAY SO. The bar was never
// instruction-only: `saving`, `saved`, `error` and `fs` already rendered their own strings in all
// seven panel footers. THE INSTRUCTION WAS ONLY THE IDLE FALLBACK. What is new here is the dot,
// the age, and `dirty` becoming visible on the panels — not state reporting itself.
//
// ---- ⚠ `fs` FOLDS INTO THE FAILURE STATE RATHER THAN DISAPPEARING ----------------------------
//
// The five-state line has no slot for "the write no-oped because this dev server is not in github
// mode". Dropping it would make a local save look SUCCESSFUL when nothing was written, which is
// the shape this project refuses. A no-oped write IS a failure to save, so it takes the failure
// state and its detail moves to the title. Faithful to the drawing, and the signal survives.

/** `useDraftForm`'s status, restated here so this module imports nothing. KEEP IN STEP. */
export type SaveStatusLike = "idle" | "saving" | "saved" | "fs" | "error";

/** What the line shows. `saved` covers both the aged and un-aged forms — the age decides. */
export type SaveBarState = "saved" | "dirty" | "saving" | "error";

/**
 * The line's state, from the form's status and its dirty flag.
 *
 * ORDER MATTERS AND IT IS NOT ALPHABETICAL. `saving` wins over `dirty` because a save in flight
 * is the more specific fact about the same edit, and `error` wins over both because a failure is
 * the thing the author must act on. `dirty` only reports when nothing more urgent is true.
 */
export function deriveSaveState(status: SaveStatusLike, dirty: boolean): SaveBarState {
  if (status === "saving") return "saving";
  if (status === "error" || status === "fs") return "error";
  if (dirty) return "dirty";
  return "saved";
}

/**
 * How long ago the last save landed, or `null` when there has not been one this session.
 *
 * ⚠ THE AGE NEEDS ITS OWN TIMESTAMP AND CANNOT BE READ OFF `saveStatus`. `useDraftForm` flips
 * `saved` back to `idle` after 2500ms, so by the time "Saved 2 minutes ago" would be true the
 * status has said `idle` for nearly two minutes. The bar records when a save succeeded and
 * formats the distance from that.
 *
 * WITHOUT AN AGE THE LINE SAYS "Saved", WHICH IS A CLAIM. With one it says when, which is
 * evidence — the difference the contract is actually after.
 */
export function formatSavedAge(savedAt: number | null, now: number): string | null {
  if (savedAt === null) return null;
  const seconds = Math.floor((now - savedAt) / 1000);
  if (seconds < 0) return null; // a clock that moved backwards says nothing rather than nonsense
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

/** The phrase beside the dot. */
export function saveStateLabel(state: SaveBarState, age: string | null): string {
  switch (state) {
    case "saving":
      return "Saving…";
    case "error":
      return "Couldn't save";
    case "dirty":
      return "Unsaved changes";
    case "saved":
      return age ? `Saved ${age}` : "Saved";
  }
}
