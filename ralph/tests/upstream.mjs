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
// C1  ⚠ AND WHAT PRODUCTION SERVES IS ON `origin/main`. A THIRD system, and the same shape: a merge
//     is not a release. Every gate in this repo can be green while visitors are served something
//     else, which on 2026-08-10 meant 34 minutes of a placeholder on the live site.
//     ⚠ NOTE WHAT C DOES *NOT* ASSERT: that main is deployed. That fails on every run made minutes
//     after a merge, and a gate whose common failure is benign is one people learn to skip. Lag is
//     REPORTED; only a production commit that is not on `origin/main` fails.
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

console.log("\nC · and it reached the PUBLIC, which is a third system again");

/* ⚠ A THIRD SYSTEM, AND THE SAME SHAPE AS THE FIRST TWO. A says the commits reached the repository.
   B says the record exists. NEITHER SAYS ANYONE CAN SEE THE WORK. A merge is not a release, and on
   2026-08-10 that gap cost 34 minutes with a placeholder served from the live site while ralph, the
   census and the build were all green — every instrument reading a system that was correct.

   ⚠ AND THE QUESTION IS THE DEPLOYMENT LIST, NEVER A COMMIT STATUS. A red Vercel status on the
   newest merge means nothing on its own, because a later deploy carries every merge before it. I
   spent an afternoon reading the status as though it answered "did my change reach visitors" and it
   answers a different question. Measured: three refused merges produced ZERO production deployment
   records, so a record means a build actually started.

   ⚠ AND THE ROW THAT LOOKS OBVIOUS IS THE ONE NOT WRITTEN — "main is deployed" would fail on every
   run made within minutes of a merge, which is normal and benign. A gate whose common failure is
   benign is a gate people learn to skip, which is the argument this repo already made about the CI
   build step. BEING AHEAD IS REPORTED, NOT ASSERTED.

   What IS asserted is the thing that is never benign: production serving something that is NOT on
   `origin/main` — a rollback, a promoted preview, a divergent branch. That state cannot arise from
   ordinary lag, so it never fails for a reason nobody cares about. */

const remote = sh("git", ["remote", "get-url", "origin"]).stdout.trim();
const nwo = (remote.match(/github\.com[:/]([^/]+\/[^/.]+)/) ?? [])[1] ?? null;
if (!nwo) {
  console.log("  NOT RUNNABLE — origin is not a github remote; C is UNVERIFIED, not passed.");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
const dep = sh("gh", ["api", `repos/${nwo}/deployments?per_page=100`, "--jq",
  '[.[] | select(.environment=="Production")] | .[0:5] | .[] | "\\(.id) \\(.sha) \\(.created_at)"']);
if (dep.status !== 0) {
  console.log("  NOT RUNNABLE — the deployments API is unreachable; C is UNVERIFIED, not passed.");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

/* ⚠ A DEPLOYMENT RECORD IS NOT A LIVE DEPLOYMENT. A build can start and fail, leaving a record whose
   sha is NOT what visitors are served — the previous success still is. So the newest records are
   walked until one reports `success`, rather than trusting position in the list. Bounded at five so
   an outage cannot turn a gate into a crawl, and the walk depth is printed. */
let live = null, walked = 0;
for (const line of dep.stdout.trim().split("\n").filter(Boolean)) {
  const [id, sha, at] = line.split(" ");
  walked++;
  const st = sh("gh", ["api", `repos/${nwo}/deployments/${id}/statuses`, "--jq", ".[0].state"]);
  if (st.status === 0 && st.stdout.trim() === "success") { live = { sha, at }; break; }
}
t("C0 a SUCCESSFUL production deployment was found — without one, C1 compares against nothing",
  live !== null, true);

if (live) {
  /* The sha must be present locally to be compared. `git fetch origin` ran in A, and a production
     deploy is a commit on main, so absence here is an instrument condition rather than a finding —
     reported as UNVERIFIED rather than failed, which is rule 25 applied to this gate's own input. */
  const present = sh("git", ["cat-file", "-e", `${live.sha}^{commit}`]).status === 0;
  t("C0a …and the deployed commit is present locally, or C1 would fail on a fetch rather than on a fact",
    present, true);
  if (present) {
    const onMain = sh("git", ["merge-base", "--is-ancestor", live.sha, "origin/main"]).status === 0;
    const undeployed = Number(sh("git", ["rev-list", "--count", `${live.sha}..origin/main`]).stdout.trim());
    const mins = Math.round((Date.now() - Date.parse(live.at)) / 60000);
    console.log(`         live: ${live.sha.slice(0, 7)} (${live.at}, ${mins} min ago, walked ${walked});  ${undeployed} merged commit(s) not yet deployed`);
    t("C1 ⚠ WHAT PRODUCTION SERVES IS ON origin/main — a rollback or a promoted preview is not ordinary lag",
      onMain, true);
    if (undeployed > 0) {
      console.log("         ⚠ AHEAD, WHICH IS REPORTED RATHER THAN FAILED. A refused or pending deploy is not");
      console.log("           lost work: the next successful deploy carries every merge before it.");
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
