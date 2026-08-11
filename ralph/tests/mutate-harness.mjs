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
import { existsSync } from "node:fs";

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
const TARGET = "lib/palettes/teaser.ts";
const absent = run("--edit", TARGET, "a string that does not occur in that file", "x");
t("B1 ⚠ AN ABSENT ANCHOR IS REFUSED — an unrun mutation reports SURVIVED, the false negative the harness exists to prevent",
  absent.status === 2 && /occurs 0 time\(s\)/.test(absent.out), true);
const many = run("--edit", TARGET, "the", "THE");
t("B2 ⚠ A NON-UNIQUE ANCHOR IS REFUSED — the edit would land somewhere the operator did not name",
  many.status === 2 && /must occur exactly once/.test(many.out), true);
const noop = run("--edit", TARGET, "cream", "cream");
t("B3 ⚠ A NO-OP MUTATION IS REFUSED — it always reports SURVIVED and reads as a weak gate",
  noop.status === 2 && /identical to the anchor/.test(noop.out), true);
const missing = run("--edit", "lib/palettes/does-not-exist.ts", "a", "b");
t("B4 a missing file is refused rather than created",
  missing.status === 2 && /no such file/.test(missing.out), true);

console.log("\nC · the refusals NAME the way out, because a refusal nobody can satisfy is an obstacle");
t("C1 the absent-anchor refusal says why zero matches is the dangerous case",
  /reports SURVIVED/.test(absent.out), true);
t("C2 ⚠ AND THE DIRTY-AND-UNSNAPSHOTTED REFUSAL PRINTS THE SNAPSHOT COMMAND — proved by reading the source, since reaching it needs a dirty tree this suite must not create",
  /--snapshot/.test(spawnSync("cat", [TOOL], { cwd: root, encoding: "utf8" }).stdout), true);
/* ⚠ AND `--revert-edit` REFUSES AN EMPTY LOG RATHER THAN REPORTING A SUCCESS IT DID NOT PERFORM.
 * Silent success is the shape all seven earlier defects in that file had. Only exercised when no
 * edit log exists, which is the state CI is always in. */
const emptyRevert = run("--revert-edit");
t("C3 ⚠ `--revert-edit` WITH NOTHING RECORDED REFUSES — silent success is this file's oldest failure mode",
  emptyRevert.status === 2 && /no recorded edits/.test(emptyRevert.out), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
