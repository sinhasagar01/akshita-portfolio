// The mutation harness itself — the one tool in `ralph/` that nothing in CI ever executed.
// Run: node --experimental-strip-types ralph/tests/mutate-harness.mjs
//
// ---- ⚠ WHY THIS EXISTS: A SYNTAX ERROR IN `mutate.mjs` SHIPPED TO MAIN UNDER 3100 GREEN ASSERTIONS
//
// `ralph/run.mjs` runs the SUITES. It does not run `mutate.mjs`, because the harness is an operator
// tool rather than a gate — so the file could not load at all and every gate stayed green. The break
// was a multi-line string pasted into a `console.log("…")`, in a comment-only edit made AFTER the
// end-to-end run that had proved the tool worked, and never re-run.
//
// ⚠ TWO RULES THIS REPO ALREADY STATES, BOTH IGNORED IN ONE EDIT. "Re-run after the LAST edit" — the
// working proof was taken before the change that broke it. And "check which suites ralph actually
// runs before trusting a green" — a green suite set says nothing about a file no suite loads.
//
// ---- WHAT IT ASSERTS, AND WHY IT STOPS AT THE REFUSALS -----------------------------------------
//
// Parsing, and the four refusals. Those are PURE: each one exits before touching a file, so this
// suite can exercise the real binary without mutating the tree. The apply-and-revert round trip is
// deliberately NOT here — proving it means writing to a tracked file, and a suite that fails midway
// would leave the repo dirty for every later gate. That round trip is proved by hand and recorded
// in #513; what belongs in CI is the half that cannot damage anything.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = new URL("../../", import.meta.url).pathname;
const TOOL = "ralph/mutate.mjs";
const run = (...args) => {
  const r = spawnSync("node", [TOOL, ...args], { cwd: root, encoding: "utf8" });
  return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

console.log("\nA · the harness loads at all");
/* ⚠ THE ROW THAT WOULD HAVE CAUGHT THE SHIPPED BREAK, AND IT IS ONE LINE. `node --check` parses
 * without executing, so it catches exactly the class of defect that made the file unloadable. */
t("A0 the file exists where every mutation loop expects it", existsSync(new URL(`../../${TOOL}`, import.meta.url)), true);
const parsed = spawnSync("node", ["--check", TOOL], { cwd: root, encoding: "utf8" });
t("A1 ⚠ `mutate.mjs` PARSES — a syntax error here is invisible to every other suite, because none loads it",
  parsed.status, 0);
/* ⚠ AND PARSING IS NOT RUNNING. A file can parse and still throw on load — an import that resolves
 * to nothing, a top-level call that dies. Invoking it with no arguments exercises the module body
 * and the argument guard together, and a usage message proves it reached the end of the file. */
const bare = run();
t("A2 …and it RUNS, reaching its own usage message rather than dying during load",
  bare.status === 2 && /usage: node ralph\/mutate\.mjs/.test(bare.out), true);

console.log("\nB · the four refusals fire, exercised against the real binary");
/* ⚠ EACH ONE EXITS BEFORE TOUCHING A FILE, which is what makes them safe to run in CI. A refusal
 * that had to mutate something first would not belong in a suite. */
/* ⚠ THE FIXTURE IS DERIVED AS A **CLEAN** TRACKED FILE, NOT NAMED — AND THE NAMED ONE MADE THIS
 * SUITE GO RED FOR AN UNRELATED EDIT.
 *
 * It was `lib/palettes/teaser.ts`, a plain constant file that looked like a safe fixture. It is
 * not, because `--edit`'s refusals are ORDERED: the dirty-and-unsnapshotted check runs BEFORE the
 * anchor check. So the moment anybody edits that file for any reason, B1 and B2 stop seeing the
 * refusal they name and see the snapshot refusal instead — the suite reporting a defect in the
 * tool when the only thing that changed was the operator's working tree.
 *
 * It happened: adding a fifth palette to the teaser reddened three rows in the mutation harness.
 * AN INSTRUMENT CONDITION WEARING A CODE CONDITION'S CLOTHES, which is the shape this repo has
 * recorded eight times, and the first instance inside a suite's own fixture.
 *
 * ⚠ AND IT REPORTS UNRUN RATHER THAN PASSING WHEN NO CLEAN FILE EXISTS. A suite that cannot
 * construct its precondition must say so — `upstream` A0's posture. Silently skipping would make a
 * fully dirty tree look like three passing refusals. */
const tracked = (spawnSync("git", ["ls-files", "lib"], { cwd: root, encoding: "utf8" }).stdout ?? "")
  .split("\n").map((l) => l.trim()).filter((f) => f.endsWith(".ts"));
const dirty = new Set((spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).stdout ?? "")
  .split("\n").map((l) => l.trim()).filter(Boolean));
/* Needs prose in it: B2's anchor must occur MANY times, which a file of bare exports may not give. */
const TARGET = tracked.find((f) => !dirty.has(f)
  && (readFileSync(new URL(`../../${f}`, import.meta.url), "utf8").match(/\bthe\b/g) ?? []).length > 3);
if (!TARGET) {
  console.log("  [UNRUN] B1, B2 and C1 need a CLEAN tracked file under lib/ and the tree has none.");
  console.log("          Not a pass — the refusals were never exercised. Commit or stash, then re-run.");
  fail++;
}
const absent = TARGET ? run("--edit", TARGET, "a string that does not occur in that file", "x") : { status: 0, out: "" };
if (TARGET) t("B1 ⚠ AN ABSENT ANCHOR IS REFUSED — an unrun mutation reports SURVIVED, the false negative the harness exists to prevent",
  absent.status === 2 && /occurs 0 time\(s\)/.test(absent.out), true);
const many = TARGET ? run("--edit", TARGET, "the", "THE") : { status: 0, out: "" };
if (TARGET) t("B2 ⚠ A NON-UNIQUE ANCHOR IS REFUSED — the edit would land somewhere the operator did not name",
  many.status === 2 && /must occur exactly once/.test(many.out), true);
/* ⚠ B3, B4 AND B5 FIRE ON ARGUMENT SHAPE AND NEVER READ THE FILE, which is why their anchor need
 * not exist in the derived target. `--edit` refuses an identical replacement, a missing file and an
 * empty replacement BEFORE it inspects contents — so these three are also the rows proving that
 * ordering. Only B1 and B2 depend on what the file holds, which is what the derivation above is for. */
const noop = TARGET ? run("--edit", TARGET, "cream", "cream") : { status: 0, out: "" };
if (TARGET) t("B3 ⚠ A NO-OP MUTATION IS REFUSED — it always reports SURVIVED and reads as a weak gate",
  noop.status === 2 && /identical to the anchor/.test(noop.out), true);
const missing = run("--edit", "lib/palettes/does-not-exist.ts", "a", "b");
t("B4 a missing file is refused rather than created",
  missing.status === 2 && /no such file/.test(missing.out), true);
/* ⚠ THE FIFTH REFUSAL, ADDED AFTER AN EMPTY REPLACEMENT LEFT THIS SUITE'S OWN C3 RED.
 *
 * `--revert-edit` locates what it applied by searching for the REPLACEMENT, and the empty string
 * matches at every character — a 15,788-character file reported 15,787 hits. The revert refused
 * correctly, which meant the mutation stayed in the tree AND the manifest stayed un-cleared, so
 * `C3` below then found recorded edits where it expects none.
 *
 * ⚠ THE TOOL WAS RIGHT AND UNHEARD: the operator had piped its output to /dev/null. That is why
 * the refusal moved to the EDIT, where it is knowable — the same posture as the other four. */
const emptyRepl = TARGET ? run("--edit", TARGET, "cream", "") : { status: 0, out: "" };
if (TARGET) t("B5 ⚠ AN EMPTY REPLACEMENT IS REFUSED — the revert searches for it and the empty string matches everywhere",
  emptyRepl.status === 2 && /empty replacement cannot be reverted/.test(emptyRepl.out), true);

console.log("\nC · the refusals NAME the way out, because a refusal nobody can satisfy is an obstacle");
if (TARGET) t("C1 the absent-anchor refusal says why zero matches is the dangerous case",
  /reports SURVIVED/.test(absent.out), true);
t("C2 ⚠ AND THE DIRTY-AND-UNSNAPSHOTTED REFUSAL PRINTS THE SNAPSHOT COMMAND — proved by reading the source, since reaching it needs a dirty tree this suite must not create",
  /--snapshot/.test(spawnSync("cat", [TOOL], { cwd: root, encoding: "utf8" }).stdout), true);
/* ⚠ AND `--revert-edit` REFUSES AN EMPTY LOG RATHER THAN REPORTING A SUCCESS IT DID NOT PERFORM.
 * Silent success is the shape all seven earlier defects in that file had. Only exercised when no
 * edit log exists, which is the state CI is always in. */
const emptyRevert = run("--revert-edit");
t("C3 ⚠ `--revert-edit` WITH NOTHING RECORDED REFUSES — silent success is this file's oldest failure mode",
  emptyRevert.status === 2 && /no recorded edits/.test(emptyRevert.out), true);
if (TARGET) t("C4 …and the empty-replacement refusal names a findable alternative, so a deletion mutation is still expressible",
  /mutated away/.test(emptyRepl.out), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
