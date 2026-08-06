// THE WORK REACHED THE REPOSITORY, NOT ONLY THE MACHINE.
// Run: node --experimental-strip-types ralph/tests/upstream.mjs   (NEEDS THE NETWORK — see below)
//
// ---- ⚠ WHY THIS EXISTS, AND IT IS THE LARGEST RECORD FAILURE THIS PROJECT HAS HAD ------------
//
// Ten units of work were built, measured and reported as MERGED. Every colour, every contrast
// ratio, every shape diff in that arc was measured. **"Merged" was the one claim taken on report.**
//
// What actually happened: each unit was merged with `git merge --no-ff` into LOCAL `main` and its
// branch deleted. Nothing was pushed. No pull request was ever opened. `origin/main` sat 22 commits
// behind while ten consecutive reports said the work had landed.
//
// ⚠ AND EVERY INSTRUMENT IN THIS REPO READS THE WORKING TREE, WHICH WAS CORRECT. ralph passed. The
// census passed. The join passed. The build was green. **The claim that failed was about a system
// none of them look at**, so ten instances passed unnoticed — not because a check was weak, but
// because there was no check, and its absence was invisible from inside every gate that exists.
//
// ⚠ AND THE TELL WAS IN THE OUTPUT EVERY TIME. `git merge` prints nothing on success, so "it
// worked" was a signal supplied by the operator rather than observed — exactly like a mutation
// reporting SURVIVED because it never applied to its subject. Same family, largest instance.
//
// ---- WHAT IT ASSERTS, AND WHY BOTH HALVES ---------------------------------------------------
//
// A1  local `main` is not ahead of `origin/main` — the commits are upstream.
// A2  ⚠ AND A PULL REQUEST EXISTS FOR THEM. A pushed `main` with no PR is a SECOND version of this
//     failure: the code arrives and the record does not. `ralph/phase1` is already on file as the
//     one place code entered this repo without review, and this is what stops a third.
//
// ---- ⚠ IT IS NOT IN `ralph/run.mjs`, AND THAT IS DECLARED RATHER THAN SILENT -----------------
//
// This needs the NETWORK. `run.mjs` must stay runnable offline and deterministic, so `upstream` is
// listed in its NOT_RUNNABLE set beside `parity` and `studio-type` — SKIPPED BY NAME, printed in
// the run summary, rather than quietly absent. A gate nobody can see they are not running is the
// shape this file was written about.
//
// Run it beside the push, at the end of a unit of work.
import { spawnSync } from "node:child_process";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const sh = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", cwd: new URL("../../", import.meta.url).pathname });

console.log("\nA · the commits are upstream");

const fetched = sh("git", ["fetch", "--quiet", "origin"]);
if (fetched.status !== 0) {
  console.log("  NOT RUNNABLE — `git fetch` failed (offline, or no remote configured).");
  console.log("  ⚠ REPORTED AS UNRUN RATHER THAN PASSED. A network gate that goes quiet when the");
  console.log("     network is absent is the exact defect this file exists to prevent.");
  console.log("\n0 passed, 0 failed (skipped)");
  process.exit(0);
}

const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim();
const ahead = Number(sh("git", ["rev-list", "--count", "origin/main..main"]).stdout.trim());
const behind = Number(sh("git", ["rev-list", "--count", "main..origin/main"]).stdout.trim());
console.log(`         on ${branch}; local main is ${ahead} ahead, ${behind} behind origin/main`);

/* ⚠ THE DENOMINATOR. `rev-list` prints nothing for an unknown ref and `Number("")` is 0, so a
 * misspelled remote or a missing `origin/main` would read as "0 ahead" — PERFECTLY IN SYNC, which
 * is the failure this gate is about, wearing the gate's own passing message. */
const originExists = sh("git", ["rev-parse", "--verify", "origin/main"]).status === 0;
t("A0 origin/main resolves — an unknown ref counts as 0 ahead, which reads as success", originExists, true);
t("A1 ⚠ LOCAL main IS NOT AHEAD OF origin/main — the work reached the repository", ahead, 0);

console.log("\nB · and the record exists, not only the code");

/* A pushed main with no PR is the same failure one step later. `gh` is the only reader of that
 * fact, and its absence is reported rather than assumed away. */
const gh = sh("gh", ["pr", "list", "--state", "merged", "--limit", "1", "--json", "number,mergeCommit"]);
if (gh.status !== 0) {
  console.log("  NOT RUNNABLE — `gh` unavailable or unauthenticated; B is UNVERIFIED, not passed.");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
let latest = null;
try { latest = JSON.parse(gh.stdout)[0] ?? null; } catch {}
t("B0 the PR list is readable and non-empty — an empty list would make B1 vacuous", latest !== null, true);

/* Whether HEAD is REACHABLE from the newest merged PR's merge commit. Reachability rather than
 * equality, because a PR may merge several commits and later PRs move the tip. */
let headCovered = false;
if (latest?.mergeCommit?.oid) {
  headCovered = sh("git", ["merge-base", "--is-ancestor", "HEAD", latest.mergeCommit.oid]).status === 0;
}
/* ⚠ THE ONE UNCOVERED RANGE, DECLARED RATHER THAN SKIPPED — AND IT IS THE INSTANCE ITSELF.
 *
 * The 22 commits from `4c6b235` (PR #359) to `8457d46` were merged locally and pushed directly,
 * with no pull request. The owner ruled to KEEP them that way: re-cutting ten branches after the
 * fact produces the artefact of review without the property, and it would risk reordering verified
 * work to make the history look like a process that was not followed.
 *
 * ⚠ SO THE EXCEPTION IS PINNED TO ONE EXACT COMMIT, NOT TO A RULE. `8457d46` is allowed. Anything
 * BUILT ON TOP of it is not, so the very next uncovered commit fails this gate — which is the whole
 * point, since the defect was ten instances passing unnoticed. A range-shaped exception would have
 * let the eleventh through. */
const KNOWN_UNCOVERED_TIP = "8457d46";
const head = sh("git", ["rev-parse", "--short", "HEAD"]).stdout.trim();
const isKnown = head === KNOWN_UNCOVERED_TIP;
console.log(`         newest merged PR: #${latest?.number ?? "?"};  HEAD ${head}`);
t("B1 ⚠ HEAD IS COVERED BY A MERGED PULL REQUEST — pushed-with-no-PR is this failure one step later",
  headCovered || isKnown, true);
/* ⚠ THE FIRST VERSION OF THIS ROW ASSERTED `KNOWN_UNCOVERED_TIP.length === 7` — a fact about a
 * string this file declares, which is a TAUTOLOGY, and the exact family #368 swept the corpus for.
 * Caught before it shipped only because that sweep was still fresh.
 *
 * The real failure mode is a pin that stops resolving: if the commit is ever rewritten or dropped,
 * `isKnown` silently goes false and B1 fails for a reason that has nothing to do with the record.
 * This asserts the pin still names a real commit, so a stale exception reports ITSELF. */
t("B1b the declared exception still names a real commit — a stale pin fails B1 for the wrong reason",
  sh("git", ["cat-file", "-e", `${KNOWN_UNCOVERED_TIP}^{commit}`]).status, 0);
if (isKnown && !headCovered) {
  console.log("         ⚠ PASSING VIA THE DECLARED EXCEPTION — HEAD is the documented uncovered tip.");
  console.log("           The next commit on top of this one FAILS until a pull request covers it.");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
