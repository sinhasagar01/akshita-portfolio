// THE BEHAVIOURAL HALF OF COLLECTION READINESS — a claim about a driven run, refused when stale.
// Run: node ralph/tests/collection-exercise.mjs
//
// ---- ⚠ WHAT THIS CAN AND CANNOT DO -----------------------------------------------------------
//
// It cannot drive /studio. That surface is owner-gated and `STUDIO_WRITE_MODE=fs` no-ops every
// write route, so the honest count of editor paths drivable from here is ZERO. Saying so is the
// point: four collections have produced four first-browser-run defects, none visible to any gate,
// and a suite that implied otherwise would be the worst possible outcome.
//
// What it does is hold a CLAIM about a driven run to rules a claim can be held to — the build was
// real, the widths straddled the fold, the messages were copied rather than described, and the
// write path has not moved since.
//
// ---- ⚠ THE PREDICATES ARE CALLED, NOT GREPPED ------------------------------------------------
//
// The record will be empty of real entries for a while, so a suite reading only the yaml would pass
// over an empty subject and report the shape of success. Every refusal below is proven against a
// CONSTRUCTED entry instead, so the rows fail for the reason they name whatever the file contains.
// A source regex over the validator would prove its words exist and nothing about which arm runs.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load } from "js-yaml";
import {
  REQUIRED_STEPS,
  applicableSteps,
  straddlesFold,
  exerciseStale,
  verbatimBlockers,
  exerciseBlockers,
  exercisedCollections,
} from "../../lib/studio/exercise-record.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const git = (...args) => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};

/** A complete entry, from which every refusal below is made by breaking exactly one thing. */
const GOOD = {
  collection: "blog",
  date: "2026-08-14",
  deployedSha: "06c1b0d",
  widths: [900, 1440],
  steps: [...REQUIRED_STEPS],
  messages: ["Draft saved", "kind must be one of photo, illus, proj"],
};
const OPTS = { fold: 1100, writePathLastChanged: "2026-08-10", orderable: true };

/* ⚠ THE ORDERING TABLE IS PARSED FROM ITS OWNER, NOT LISTED HERE. `commit-collection-entry.ts`
 * cannot be imported — its relative imports are extensionless, so Node cannot resolve them — which
 * is the standing reason a suite reads that module rather than calling it. What makes this sound
 * where a reachability regex would not be: the subject is a DATA LITERAL, so parsing it is reading
 * a value rather than guessing whether a branch runs.
 *
 * G1 asserts the parse found every collection. Without that, a changed table format yields an empty
 * map, every lookup returns undefined, and the gate quietly stops requiring anything. */
const commitSrc = readFileSync(join(root, "lib/studio/commit-collection-entry.ts"), "utf8");
const orderBlock = (commitSrc.match(/COLLECTION_HAS_ORDER[^{]*\{([\s\S]*?)\n\};/) ?? ["", ""])[1];
const ORDERABLE = new Map(
  [...orderBlock.matchAll(/^\s*([a-z-]+):\s*(true|false)\s*,/gm)].map((m) => [m[1], m[2] === "true"])
);

// ---------------------------------------------------------------------------------------------
console.log("\nA · the validator has a subject and accepts a complete entry");
/* ⚠ THE FIRST ROW IS THE DENOMINATOR. Every refusal below breaks ONE field of `GOOD`; if `GOOD`
 * itself were refused, all of them would pass for the wrong reason and the suite would read as
 * thorough while proving nothing. */
t("A1 a complete entry is accepted, so every refusal below is caused by the field it names",
  exerciseBlockers(GOOD, OPTS), []);
t("A2 …and the required steps are the eight, so a shortened list cannot pass quietly",
  [...REQUIRED_STEPS], ["create", "upload", "edit", "reorder", "delete", "preview", "publish", "failure-path"]);

// ---------------------------------------------------------------------------------------------
console.log("\nG · reorder is derived per collection, because not-applicable is a third state");
/* ⚠ THIS SECTION EXISTS BECAUSE THE FIRST VERSION OF THIS GATE WOULD HAVE REFUSED A CORRECT BLOG
 * RUN. `COLLECTION_HAS_ORDER` declares `blog: false` deliberately — posts sort by `date` — and
 * `REQUIRED_STEPS` demanded reorder of everything, so blog's passing state was unreachable. The
 * `galleryPublishBlockers` shape one week later, latent only because the record is empty. */
t("G1 the ordering table PARSED, and found every collection — an empty map would silently require nothing",
  [...ORDERABLE.keys()].sort(), ["blog", "experience", "gallery", "projects"]);
t("G2 …and blog is the non-orderable one, read rather than assumed", ORDERABLE.get("blog"), false);
t("G3 reorder is NOT required of a non-orderable collection",
  applicableSteps(false).includes("reorder"), false);
t("G4 …and IS required of an orderable one, so the exemption is not blanket",
  applicableSteps(true).includes("reorder"), true);
t("G5 ⚠ A CORRECT BLOG RUN — seven steps, no reorder — IS ACCEPTED",
  exerciseBlockers({ ...GOOD, collection: "blog", steps: REQUIRED_STEPS.filter((s) => s !== "reorder") },
    { ...OPTS, orderable: false }), []);
/* ⚠ THE COMPLEMENT. Without it the exemption only ever makes the gate MORE permissive, so a false
 * claim would pass more easily than a true one. */
t("G6 …and CLAIMING a reorder blog cannot perform is refused",
  exerciseBlockers({ ...GOOD, collection: "blog" }, { ...OPTS, orderable: false }).length, 1);
t("G7 …while the same seven steps on an ORDERABLE collection are still short by reorder",
  exerciseBlockers({ ...GOOD, steps: REQUIRED_STEPS.filter((s) => s !== "reorder") }, OPTS).length, 1);
/* ⚠ AND AN UNREADABLE TABLE IS NOT A PASS, the posture every other read here takes. */
t("G8 …and an unknown orderability is refused rather than assumed either way",
  exerciseBlockers(GOOD, { ...OPTS, orderable: null }).length, 1);
t("G9 …and a typo in a step name is refused, because it reads as coverage of a step nobody ran",
  exerciseBlockers({ ...GOOD, steps: [...REQUIRED_STEPS, "publsh"] }, OPTS).length, 1);

console.log("\nB · the fold, which is the geometric fact a single width cannot see");
/* ⚠ THE CONSTANT IS READ FROM ITS OWNER RATHER THAN RETYPED. `three-pane.ts` declares the fold and
 * a copy here would be a second spelling that drifts — the parallel-list defect this whole unit is
 * about, arriving inside the gate for it. */
const threePane = readFileSync(join(root, "lib/studio/three-pane.ts"), "utf8");
const FOLD = Number((threePane.match(/INSPECTOR_FOLD_PX\s*=\s*(\d+)/) ?? [])[1]);
t("B1 the fold was READ from three-pane.ts, not retyped here", Number.isFinite(FOLD) && FOLD > 0, true);
t("B2 two widths on the same side of the fold are REFUSED — below it the shell passes no inspector",
  exerciseBlockers({ ...GOOD, widths: [1200, 1440] }, { ...OPTS, fold: FOLD }).length, 1);
t("B3 …and so are two below it",
  exerciseBlockers({ ...GOOD, widths: [700, 900] }, { ...OPTS, fold: FOLD }).length, 1);
/* ⚠ THE BOUNDARY IS INCLUSIVE ON THE UPPER SIDE, ASSERTED because an off-by-one here silently
 * accepts a pair that never rendered the folded layout. `three-pane` folds AT the value. */
t("B4 a width exactly AT the fold counts as the wide side", straddlesFold([900, FOLD], FOLD), true);
t("B5 …and one pixel under it does not", straddlesFold([900, FOLD - 1], FOLD), false);

// ---------------------------------------------------------------------------------------------
console.log("\nC · staleness — an exercise is a claim about a build, and builds move");
t("C1 an entry driven BEFORE the write path changed is STALE",
  exerciseStale({ ...GOOD, date: "2026-08-01" }, "2026-08-10"), true);
t("C2 …one driven after is not", exerciseStale({ ...GOOD, date: "2026-08-14" }, "2026-08-10"), false);
t("C3 …and the same day is not, because a day is the resolution the record keeps",
  exerciseStale({ ...GOOD, date: "2026-08-10" }, "2026-08-10"), false);
t("C4 ⚠ A STALE ENTRY IS REFUSED BY THE VALIDATOR, not merely reported",
  exerciseBlockers({ ...GOOD, date: "2026-08-01" }, OPTS).length, 1);
/* ⚠ AND AN UNREADABLE GIT IS NOT A PASS. A read that cannot run is not permission to claim the
 * exercise is current — the shape where an instrument reports success because it could not look. */
t("C5 …and an unknown last-change is refused too, rather than assumed current",
  exerciseBlockers(GOOD, { ...OPTS, writePathLastChanged: null }).length, 1);
/* ⚠ THE FIXTURE EXEMPTION, ASSERTED IN BOTH DIRECTIONS. A conditional assertion needs its
 * complement, or the exemption is where the value and its documentation come apart. */
t("C6 a FIXTURE is exempt from staleness, because it claims no coverage to invalidate",
  exerciseBlockers({ ...GOOD, date: "2026-08-01", fixture: true }, OPTS), []);
t("C7 …and the SAME entry without the flag is refused, so the exemption cannot hide the check",
  exerciseBlockers({ ...GOOD, date: "2026-08-01" }, OPTS).length, 1);

// ---------------------------------------------------------------------------------------------
console.log("\nD · verbatim, because a paraphrase already cost three prompts here");
t("D1 a described message is refused", verbatimBlockers(["it showed an error"]).length, 1);
t("D2 …including the passive forms", verbatimBlockers(["the screen said something went wrong"]).length, 1);
t("D3 …and a real message is accepted", verbatimBlockers(["Something went wrong"]), []);
/* ⚠ THAT PAIR IS THE ENTRY. `Something went wrong` is EVIDENCE — it is what the studio actually
 * rendered when a validator correctly refused a draft marker, and reporting it as "it showed an
 * error" is what cost three prompts of diagnosis. The two strings are one word apart and only one
 * of them can be searched for in the source. */
t("D4 an entry with no messages at all is refused — a run producing no readable output is uncheckable",
  exerciseBlockers({ ...GOOD, messages: [] }, OPTS).length, 1);

// ---------------------------------------------------------------------------------------------
console.log("\nE · the sha names a real build, which is what a shape check cannot establish");
t("E1 a non-hex sha is refused by shape", exerciseBlockers({ ...GOOD, deployedSha: "HEAD" }, OPTS).length, 1);
t("E2 …and a too-short one", exerciseBlockers({ ...GOOD, deployedSha: "06c" }, OPTS).length, 1);

// ---------------------------------------------------------------------------------------------
console.log("\nF · the record itself");
const RECORD = "docs/collection-exercises.yaml";
t("F1 the record exists", existsSync(join(root, RECORD)), true);
const doc = load(readFileSync(join(root, RECORD), "utf8")) ?? {};
const entries = Array.isArray(doc.exercises) ? doc.exercises : [];
t("F2 …and parses to a list, so F3 onward are not asserting over a parse failure",
  entries.length > 0, true);

/* ⚠ THE WRITE PATH PER COLLECTION, DERIVED FROM THE FILESYSTEM RATHER THAN LISTED. A hand-written
 * list here would go stale the moment a collection gains a file — which is the exact defect the
 * structural half spent five matcher errors learning. The shared files are named because every
 * collection's write goes through them. */
const SHARED = [
  "lib/studio/commit-collection-entry.ts",
  "app/api/studio/save-draft/route.ts",
  "app/api/studio/create-entry/route.ts",
];
const writePathFor = (c) => {
  const own = ["format", "format-core", "serialize"]
    .map((s) => `lib/studio/${c}-${s}.ts`)
    .filter((p) => existsSync(join(root, p)));
  return [...own, ...SHARED];
};
const lastChanged = (c) => {
  const dates = writePathFor(c)
    .map((p) => git("log", "-1", "--format=%cs", "--", p))
    .filter(Boolean);
  return dates.length ? dates.sort().at(-1) : null;
};

const failures = [];
for (const e of entries) {
  const blockers = exerciseBlockers(e, {
    fold: FOLD,
    writePathLastChanged: lastChanged(e.collection),
    orderable: ORDERABLE.has(e.collection) ? ORDERABLE.get(e.collection) : null,
  });
  const tag = e.fixture ? "FIXTURE" : "exercise";
  console.log(`      ${tag.padEnd(9)} ${String(e.collection).padEnd(11)} ${e.date}  ${blockers.length === 0 ? "ok" : "REFUSED"}`);
  for (const b of blockers) console.log(`                  ${b}`);
  failures.push(...blockers);
}
t("F3 ⚠ EVERY ENTRY IN THE RECORD HOLDS", failures, []);

/* ⚠ EVERY SHA IN THE RECORD RESOLVES AND IS AN ANCESTOR OF `main`. The shape check above catches a
 * typo; only this catches a FICTION. An exercise naming a build that never existed is the strongest
 * form of a claim nobody can check, and it would read exactly like coverage. */
/* ⚠ `main` OR `origin/main`, AND CI IS WHY — THE ROW WENT RED THERE WHILE GREEN LOCALLY.
 * `actions/checkout` leaves a detached HEAD with no local `main` branch, so `rev-parse main` failed
 * and F4a refused to let F4 pass in silence. That is the row working: the history was present the
 * whole time (`fetch-depth: 0` is already set for a different suite's sake) and only the REF NAME
 * was absent. A local-only check would have been a check that never runs where it matters. */
const MAIN = ["main", "origin/main"].find((r) => git("rev-parse", "--verify", r) !== null) ?? null;
const shaProblems = [];
for (const e of entries) {
  const resolved = git("rev-parse", "--verify", `${e.deployedSha}^{commit}`);
  if (!resolved) { shaProblems.push(`${e.collection}: ${e.deployedSha} does not resolve`); continue; }
  const merged = MAIN !== null && git("merge-base", "--is-ancestor", resolved, MAIN) !== null;
  if (!merged) shaProblems.push(`${e.collection}: ${e.deployedSha} is not an ancestor of ${MAIN ?? "main"}`);
}
/* ⚠ AND IT FAILS RATHER THAN PASSING WHEN NO SUCH REF EXISTS, because "no problems found" and
 * "I could not look" must never render the same. This is the one row here that is allowed to be
 * environment-sensitive, and it says which environment it could not read. */
const gitWorks = MAIN !== null;
t("F4a a main ref resolves (main or origin/main), so F4 is a check rather than a silence", gitWorks, true);
t("F4 ⚠ EVERY RECORDED SHA RESOLVES AND IS AN ANCESTOR OF MAIN — a shape check cannot catch a fiction",
  gitWorks ? shaProblems : ["UNRUN"], []);

/* ⚠ AND THE ABSENT SET IS REPORTED BY NAME AND NOT FAILED. A gate that reddens main until an owner
 * drives four collections has a passing state nobody reading it can reach — the shape
 * `galleryPublishBlockers` had when it refused every item because the editor could not produce a
 * passing one. Absent is a different state from failed, exactly as in the structural half. */
const commit = readFileSync(join(root, "lib/studio/commit-collection-entry.ts"), "utf8");
const COLLECTIONS = [...((commit.match(/export type CollectionName =([^;]+);/) ?? ["", ""])[1]).matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
const done = exercisedCollections(entries);
const notDone = COLLECTIONS.filter((c) => !done.includes(c));
console.log(`\n      exercised: ${done.length ? done.join(", ") : "NONE"}`);
if (notDone.length) {
  console.log(`      ⚠ ${notDone.length} collection(s) have NO driven run on record: ${notDone.join(", ")}`);
  console.log("        Four collections have produced four first-browser-run defects and not one was");
  console.log("        visible to a gate. This is REPORTED rather than failed, because a gate whose");
  console.log("        passing state needs an owner at a browser is one that reddens main on somebody");
  console.log("        else's schedule — and the fifth collection will do this too.");
}
t("F5 the collection set was derived from the union, so a fifth appears here without an edit",
  COLLECTIONS.length >= 4, true);
/* ⚠ A FIXTURE IS NOT COVERAGE, ASSERTED. Without this row a fixture keyed to a real collection
 * would quietly move it out of the not-done list — a record claiming a run nobody made. */
t("F6 ⚠ A FIXTURE COUNTS AS NO COVERAGE — gallery's fixture must not mark gallery exercised",
  exercisedCollections([{ ...GOOD, collection: "gallery", fixture: true }]), []);

console.log(`\ncollection-exercise result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
