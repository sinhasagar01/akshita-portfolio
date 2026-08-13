// THE UNPUBLISHED-CHANGES DISCLOSURE — four states, and the two a naive implementation collapses.
// Run: node --experimental-strip-types ralph/tests/unpublished-changes.mjs
//
// ---- ⚠ WHY THESE ROWS CALL RATHER THAN READ ---------------------------------------------------
//
// `/studio` is owner-gated and `STUDIO_WRITE_MODE=fs` no-ops every write route, so this panel
// cannot be driven outside a real authenticated production session. That is precisely the condition
// under which a source regex proves the WORDS exist and nothing about which arm runs — `PublishBar`'s
// own status sentence is the recorded instance, where setting one binding to `null` made a sentence
// unreachable while every word stayed in the file and three rows stayed green.
//
// So the branching lives in a leaf and these rows drive it. Same repair as `bar-clearance.ts`.
import { disclosureState } from "../../lib/studio/unpublished-changes.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const S = (over) => disclosureState({
  draftReadError: false, draftGone: false, readFailureCount: 0, fetchState: "idle", entryCount: 0, ...over,
});

console.log("\nA · nothing unpublished, and it is not the same claim as a failure");
t("A1 an absent or matching draft branch shows nothing", S({ entryCount: 0 }).kind, "nothing");
/* Before the first fetch resolves there is no list, and that must read as nothing rather than as an
   empty result — the panel opens into a loading state, so this arm is only reached when idle. */
t("A2 …and so does an unfetched list, rather than rendering an empty one", S({ entryCount: null }).kind, "nothing");

console.log("\nB · a real list");
t("B1 entries produce a listing", S({ entryCount: 3 }), { kind: "listing", unparsed: 0 });

console.log("\nC · ⚠ THE TWO STATES THAT ARE BYTE-IDENTICAL BUT FOR ONE FLAG");
/* ⚠ `DraftBranchState` returns `{ ...EMPTY_DRAFT_STATE, readError: true }` for a failed read, which
 * differs from "nothing unpublished" in exactly one boolean. Its own comment records the incident:
 * an owner saw published content with the bar dark and no sign their draft had failed to load. */
t("C1 ⚠ A FAILED DRAFT READ IS NOT `nothing` — 'nothing to publish' and 'I could not look' must never render the same",
  S({ draftReadError: true, entryCount: 0 }).kind, "unreadable");
/* ⚠ AND IT OUTRANKS A SUCCESSFUL LIST. If the studio could not read the draft it is showing LIVE
 * content, so a list built beside that describes a state the author is not looking at. Ordering this
 * below the fetch would let a working compare paint a confident list over a failed read. */
/* ⚠ AND IT OUTRANKS EVERY OTHER ARM, ASSERTED ONE BY ONE RATHER THAN ONCE. The first version of
 * this row named the ordering and tested it against a LIST alone — so moving the read-error check
 * below the LOADING check survived the mutation, because no row exercised that pair. An assertion
 * about precedence has to name every competitor; "outranks" with one example is a claim about one
 * example. */
t("C2 ⚠ AND IT OUTRANKS A LIST THAT ARRIVED — the author is looking at live content either way",
  S({ draftReadError: true, entryCount: 5, readFailureCount: 1 }).kind, "unreadable");
t("C2a …and it outranks LOADING, which is the pair the first version of C2 could not fail on",
  S({ draftReadError: true, fetchState: "loading", entryCount: null }).kind, "unreadable");
t("C2b …and it outranks a FAILED fetch",
  S({ draftReadError: true, fetchState: "failed", entryCount: 2 }).kind, "unreadable");

console.log("\nG · ⚠ THE FIFTH STATE — the draft was discarded, which is a CAUSE rather than a failure");
/* ⚠ A DISCARD IN ANOTHER TAB USED TO SURFACE AS N PER-ENTRY `Failed to fetch tree: 404` MESSAGES —
 * every one true about a tree read and every one false about the author's work. The branch-gone case
 * IS handled at the top of the draft read; what was not handled is the branch vanishing AFTER that
 * check, which is a race an ordinary discard produces. */
t("G1 ⚠ A DISCARDED DRAFT IS ITS OWN STATE, NOT A READ FAILURE",
  S({ draftGone: true, entryCount: 0 }).kind, "gone");
/* ⚠ AND IT OUTRANKS `unreadable`, BECAUSE IT IS THE MORE SPECIFIC TRUE STATEMENT. Both mean the list
 * cannot be built; only one tells the author what happened. Asserted against EVERY competitor, which
 * is what C2's first version failed to do. */
t("G2 …and it outranks a failed read", S({ draftGone: true, draftReadError: true }).kind, "gone");
t("G3 …and a list that arrived", S({ draftGone: true, entryCount: 4 }).kind, "gone");
t("G4 …and loading", S({ draftGone: true, fetchState: "loading", entryCount: null }).kind, "gone");
t("G5 …and a failed fetch", S({ draftGone: true, fetchState: "failed", entryCount: 2 }).kind, "gone");
/* The complement: without the flag nothing changes, so G1 cannot pass by the arm always firing. */
t("G6 …and with the flag false every other state is unaffected",
  [S({ entryCount: 0 }).kind, S({ entryCount: 2 }).kind, S({ draftReadError: true }).kind],
  ["nothing", "listing", "unreadable"]);

console.log("\nD · ⚠ THE FOURTH STATE, WHICH A SPECIFICATION OMITS");
/* ⚠ The branch read fine and SPECIFIC FILES did not parse. Every other entry is a real draft, so
 * this rides ALONGSIDE the list rather than replacing it. Collapsing it into `unreadable` tells an
 * author their work is unreadable when one file is. */
t("D1 ⚠ UNPARSED ENTRIES RIDE WITH THE LIST — the branch read fine and one file did not",
  S({ entryCount: 3, readFailureCount: 2 }), { kind: "listing", unparsed: 2 });
t("D2 …and the count travels, so the copy can say how many rather than 'some'",
  S({ entryCount: 1, readFailureCount: 1 }).unparsed, 1);
/* ⚠ THE COMPLEMENT. A zero here must be an ordinary listing rather than a fourth branch nobody can
 * reach — the conditional-assertion shape, where the filter is where a value and its documentation
 * come apart. */
t("D3 …and zero unparsed is an ordinary listing rather than a state of its own",
  S({ entryCount: 2, readFailureCount: 0 }), { kind: "listing", unparsed: 0 });
/* ⚠ AND UNPARSED-WITH-NO-ENTRIES IS `nothing`, NOT A LISTING OF NOTHING. Every draft file failing to
 * parse leaves a branch that differs and a list that is empty; the honest answer is that there is
 * nothing to show, and the bar's own status line already carries the parse failure. */
t("D4 …and unparsed entries with an empty list is `nothing`, not an empty listing",
  S({ entryCount: 0, readFailureCount: 2 }).kind, "nothing");

console.log("\nE · the fetch states are distinct from the content states");
t("E1 loading is its own state", S({ fetchState: "loading", entryCount: null }).kind, "loading");
t("E2 …and a failed LIST is not a failed DRAFT — publish still works",
  S({ fetchState: "failed", entryCount: null }).kind, "failed");
/* ⚠ AND A FAILED FETCH DOES NOT OUTRANK A FAILED READ, because the read failure is the larger
 * claim: it means the studio is showing live content, which the list failing does not. */
t("E3 …and a failed draft read still outranks a failed fetch",
  S({ draftReadError: true, fetchState: "failed", entryCount: null }).kind, "unreadable");

console.log("\nF · every state is reachable — a branch nothing can reach is documentation");
{
  const reached = new Set([
    S({ entryCount: 0 }).kind,
    S({ entryCount: 3 }).kind,
    S({ draftReadError: true }).kind,
    S({ fetchState: "loading", entryCount: null }).kind,
    S({ fetchState: "failed", entryCount: null }).kind,
    S({ draftGone: true }).kind,
  ]);
  t("F1 ⚠ ALL SIX KINDS ARE REACHABLE FROM REAL INPUTS — an unreachable arm cannot fail for the reason it names",
    [...reached].sort(), ["failed", "gone", "listing", "loading", "nothing", "unreadable"]);
}

console.log(`\nunpublished-changes result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
