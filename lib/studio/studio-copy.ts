// User-facing studio sentences, as values a suite can CALL.
//
// ---- ⚠ WHY THIS EXISTS: A SOURCE REGEX CANNOT SEE REACHABILITY --------------------------------
//
// Six rows across three suites asserted that a sentence EXISTS IN A SOURCE FILE. Each proved the
// words are in the file and none proved a reader can reach them — the defect `PublishBar`'s status
// sentence produced, where setting the first-failure binding to `null` made the per-entry sentence
// unreachable while leaving every word of it in place, and three rows stayed green.
//
// PRESENCE AND RESOLUTION ARE DIFFERENT QUANTITIES. A string in a file and a string on screen are
// not the same claim. The standing repair is `bar-clearance.ts`'s and it is the default now: move
// the text into a pure function, call it with real inputs, assert the returned string.
//
// ---- ⚠ WHAT THIS DOES AND DOES NOT BUY -------------------------------------------------------
//
// It buys the SELECTION being callable — which sentence, for which state. It does not prove any
// component renders the result, and no leaf can: that is a mount question, and this repository's
// standing answer is that only a person at a browser settles those. Saying so is the point. The
// rows below are strictly stronger than a regex and strictly weaker than a render.
//
// ---- ⚠ AND THE AUTOSAVE TITLE IS THE ONE THAT WAS ALREADY A DEFECT ---------------------------
//
// `title="Auto-saves to draft on blur."` was written out in ELEVEN component files. The suite
// checked nine of them for the literal, so two carried an unchecked copy and a twelfth surface
// would have been silently untitled. That is the parallel-list shape in prose rather than in keys:
// eleven spellings of one sentence, with one gate watching nine.
//
// Only strings and pure functions here, so a ralph suite can import it directly.

/**
 * The instruction every save bar carries as its `title`.
 *
 * ⚠ IT IS A PREFIX AND A PER-SURFACE TAIL, NOT ONE SENTENCE — AND ASSUMING OTHERWISE WOULD HAVE
 * REWORDED ELEVEN SURFACES. The suite asserts `title="Auto-saves to draft on blur.` and nothing
 * more, so the shared half read as the whole thing. Measured, the eleven carry FOUR different
 * tails:
 *
 *     6  Publish from the Hero panel.        1  Publish from the bar below.
 *     3  Publish from Site settings.         1  Preview to see it.
 *
 * Each names where the publish control actually is for THAT surface, which is the useful half of
 * the sentence. A single constant would have told six panels to publish from a bar they do not
 * have. SECOND TIME IN THIS ONE UNIT that a plausible extraction would have silently changed what a
 * reader sees, after the empty state's dropped query echo — and both were caught by reading the
 * JSX rather than the assertion, because the assertion named only the invariant part.
 *
 * ⚠ THE GENERAL FORM: AN ASSERTION THAT MATCHES A PREFIX TELLS YOU NOTHING ABOUT THE REST OF THE
 * STRING, and an extraction scoped from that assertion inherits its blindness. The row was not
 * wrong; it was narrower than the sentence, and nobody had asked what the rest of it said.
 */
export const AUTOSAVE_PREFIX = "Auto-saves to draft on blur.";

/** Compose the full title. The tail is the surface's own, because it names where that surface's
 *  publish control is — see the note above. */
export function autosaveTitle(publishHint: string): string {
  return `${AUTOSAVE_PREFIX} ${publishHint}`;
}

/**
 * The case-study index's reorder subline.
 *
 * ⚠ THE BRANCH IS THE CLAIM, NOT THE WORDS. While a search is active the arrows are disabled, and
 * an author who cannot see why is the whole reason this sentence exists — so the row that matters
 * is that the filtering state selects the recovery sentence and the idle state does not.
 */
export function reorderSubline(opts: { filtering: boolean; view: "grid" | "list" }): string {
  if (opts.filtering) return "Clear the search to change the order.";
  return opts.view === "list"
    ? "in the order they appear on your homepage. Use the arrows to change it."
    : "in the order they appear on your homepage.";
}

/**
 * The case-study index's zero state.
 *
 * ⚠ TWO ZERO STATES, AND THE BRANCH IS ON WHAT THE READER ASKED FOR RATHER THAN ON WHAT CAME BACK.
 * Both render when nothing is on screen, so a count cannot tell them apart — only whether a query
 * is narrowing anything can. Saying "no case studies match" to somebody who has typed nothing
 * answers a question they never asked, which is the defect `#271` split three sentences to fix.
 *
 * ⚠ THE MATCH ARM RETURNS NO TRAILING PERIOD, AND THAT IS DELIBERATE RATHER THAN AN OVERSIGHT. The
 * component renders the QUERY after it, in its own element — `No case studies match <b>{q}</b>.` —
 * so a finished sentence here would either drop the echo or duplicate the punctuation. THE FIRST
 * DRAFT OF THIS FUNCTION RETURNED "No case studies match your search." AND WOULD HAVE SILENTLY
 * CHANGED THE COPY: an extraction that alters what a reader sees is not an extraction. Caught by
 * reading the JSX rather than the assertion, which only named the prefix.
 */
export function caseStudyEmptyState(opts: { collectionEmpty: boolean }): string {
  return opts.collectionEmpty
    ? "No case studies yet. Add one to get started."
    : "No case studies match";
}

/**
 * The sections rail's load failure and its recovery.
 *
 * ⚠ THE RETRY LABEL TRAVELS WITH THE MESSAGE BECAUSE A FAILURE WITHOUT A WAY OUT IS AN OBSTACLE.
 * They were two literals in one JSX block and nothing tied them together; separating the message
 * from its action is how a later edit removes one and leaves the other.
 */
export const SECTIONS_LOAD_ERROR = "Could not load the sections.";
export const SECTIONS_RETRY_LABEL = "Try again";
