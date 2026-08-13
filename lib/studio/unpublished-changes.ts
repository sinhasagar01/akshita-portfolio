/**
 * WHICH OF THE FOUR STATES THE UNPUBLISHED-CHANGES DISCLOSURE IS IN.
 *
 * ---- ⚠ WHY THIS IS A FUNCTION AND NOT A TERNARY CHAIN IN THE COMPONENT --------------------------
 *
 * `/studio` is owner-gated and `STUDIO_WRITE_MODE=fs` makes every write route a no-op, so the panel
 * cannot be driven anywhere but a real authenticated production session. A source regex over the
 * component would prove the words exist and nothing about which arm runs — `PublishBar`'s own status
 * sentence is the recorded instance, where setting one binding to `null` made a whole sentence
 * unreachable while every word stayed in the file and three rows stayed green.
 *
 * So the branching lives here, where a suite calls it with real inputs and asserts the answer. Same
 * repair as `bar-clearance.ts` and `draft-status-text.ts`.
 *
 * ---- ⚠ THE FOUR STATES, AND WHY A SPECIFICATION NAMES TWO -------------------------------------
 *
 *   nothing    the draft branch does not exist, or it exists and matches main.
 *   listing    entries to show.
 *   unreadable the whole draft read FAILED. `DraftBranchState` returns
 *              `{ ...EMPTY_DRAFT_STATE, readError: true }` for this — BYTE-IDENTICAL to "nothing"
 *              but for one flag. "Nothing to publish" and "I could not look" must never render the
 *              same, and that type's own comment records the incident where they did: an owner saw
 *              published content with the bar dark and no sign their draft had failed to load.
 *   partial    the branch read fine and SPECIFIC FILES did not parse. Every other entry is a real
 *              draft. This is the state a specification omits, and collapsing it into `unreadable`
 *              tells an author their work is unreadable when one file is.
 *
 * ⚠ AND `behind` IS NOT A STATE. A draft branch routinely falls behind main — measured at 12
 * commits behind while carrying one unpublished entry — and only AHEAD is unpublished work. "Your
 * draft is 12 behind" is the kind of true, useless, alarming line a surface like this grows.
 */
export type ChangesFetch = "idle" | "loading" | "failed";

export type DisclosureState =
  | { kind: "unreadable" }
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "nothing" }
  | { kind: "listing"; unparsed: number };

export function disclosureState(input: {
  /** The whole draft read failed and the studio is showing live as a fail-safe. */
  draftReadError: boolean;
  /** Entries that parsed but could not be read as content. */
  readFailureCount: number;
  fetchState: ChangesFetch;
  /** null until the first fetch resolves. */
  entryCount: number | null;
}): DisclosureState {
  /* ⚠ `draftReadError` OUTRANKS EVERYTHING, INCLUDING A SUCCESSFUL LIST. If the studio could not
     read the draft it is showing LIVE content, so any list built beside that is describing a state
     the author is not looking at. Ordering this below the fetch would let a working compare paint
     a confident list over a failed read. */
  if (input.draftReadError) return { kind: "unreadable" };
  if (input.fetchState === "loading") return { kind: "loading" };
  if (input.fetchState === "failed") return { kind: "failed" };
  if (input.entryCount === null || input.entryCount === 0) return { kind: "nothing" };
  /* ⚠ THE PARTIAL STATE RIDES ALONGSIDE THE LIST RATHER THAN REPLACING IT — that is the whole
     distinction. The count travels so the copy can say how many, and a zero here is an ordinary
     listing rather than a fourth branch nobody can reach. */
  return { kind: "listing", unparsed: input.readFailureCount };
}
