// The ralph runner. Runs every runnable suite, reports three ways, exits non-zero on any
// failure. Used by CI and by humans — the same tool, so they cannot disagree.
//
// Run: node ralph/run.mjs        (or `npm run ralph`)
//
// ---- WHY THIS EXISTS AT ALL -----------------------------------------------------------
//
// `main` was RED for three commits and nobody knew. A content commit (`82edf03`, an owner
// publish through /studio) broke `blog-serialize`, whose G3 read the live post and pinned a
// literal value. Only Vercel ran on a PR, and Vercel builds the site — it does not run
// ralph. So the suite failed silently until someone ran it by hand.
//
// ---- IT ALSO RETIRES THE COUNTING NOTE, WHICH IS THE POINT ----------------------------
//
// STATE has carried this warning for six PRs: "`rich-markers` reports `✓`/`63 passed`
// rather than `[PASS]`, so a naive grep undercounts by 63." Every session then re-derived
// the total with an ad-hoc shell loop and re-learned the same trap.
//
// That is a DOCUMENTED BUG IN A REBUILT TOOL, and #177 settled what to do about those:
// COMMIT THE TOOL, DO NOT DOCUMENT THE BUG. `scripts/normalize-dom.mjs` was committed for
// exactly this reason after its four traps kept recurring. This is the same move for the
// same class of problem. A suite's OWN summary line is authoritative; the `[PASS]` count is
// only a fallback for the eleven suites that print no summary.
//
// ---- WHAT IT KEYS OFF ------------------------------------------------------------------
//
// PASS/FAIL IS THE EXIT CODE, never the parsed text. Every runnable suite ends with
// `process.exit(failures === 0 ? 0 : 1)` (verified across all 29), so correctness does not
// depend on matching a human-readable string that varies between suites — four different
// summary formats are in use. Parsing is for the COUNT only, which is reporting, not
// verdict. If a suite's wording changes, the count degrades to the fallback; the verdict
// does not move.
//
// `parity.mjs` is EXCLUDED. It is not a runnable suite — it exports a PARITY_SCRIPT to
// paste into a browser console at /dev/parity/<slug>, needs a running dev server, and has
// no `process.exit`. It is skipped by name and reported as skipped, never silently dropped.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { countAssertions } from "./count.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TESTS = path.join(HERE, "tests");

/** Needs a running server and is driven from a browser console, so it is not runnable here.
 *  BOTH are reported as skipped rather than dropped. `studio-type` measures rendered type and
 *  the ground ladder, which no static check can see — a size that is simply wrong, with
 *  nothing competing for it, renders exactly as written. Naming it here is what stops "not in
 *  CI" from quietly becoming "nobody knows it exists". */
const NOT_RUNNABLE = new Set(["parity", "studio-type"]);

const suites = readdirSync(TESTS)
  .filter((f) => f.endsWith(".mjs"))
  .map((f) => f.replace(/\.mjs$/, ""))
  .sort();

const runnable = suites.filter((s) => !NOT_RUNNABLE.has(s));
const skipped = suites.filter((s) => NOT_RUNNABLE.has(s));

/* Moved to `ralph/count.mjs` in #369 so `mutate.mjs` reads counts the same way. It had its own
 * copy that recognised `[FAIL]` only, and eleven suites print `✗ FAIL` — the fourth "right verdict,
 * wrong stated cause" defect in that file. #183's rule: commit the tool, do not document the bug. */

let totalPassed = 0;
let totalFailed = 0;
const broken = [];
const rows = [];

for (const name of runnable) {
  const res = spawnSync(
    process.execPath,
    ["--experimental-strip-types", path.join(TESTS, `${name}.mjs`)],
    { encoding: "utf8", cwd: path.join(HERE, "..") }
  );
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  const { passed, failed, from } = countAssertions(out);
  totalPassed += passed;
  totalFailed += failed;

  // THE VERDICT IS THE EXIT CODE. A suite that crashes before printing anything exits
  // non-zero with zero parsed assertions, and must still fail the run.
  const ok = res.status === 0;

  // A GATE THAT REPORTS ZERO SUBJECTS IS NOT A PASS. A suite that exits 0 having asserted
  // nothing has been silently neutered — an import that resolved to an empty module, a
  // fixture that vanished, a loop over an empty list. #180's parity run printed
  // `sections: 0, verdict: PARITY OK`, which is the same false pass in a different tool.
  const vacuous = ok && passed === 0;

  if (!ok || vacuous) broken.push({ name, out, status: res.status, vacuous });
  rows.push({ name, passed, failed, ok: ok && !vacuous, from, vacuous });
}

const width = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) {
  const mark = r.ok ? "ok  " : "FAIL";
  const note = r.vacuous ? "  <- exited 0 with ZERO assertions" : r.from === "markers" ? "  (no summary line; counted [PASS])" : "";
  console.log(`  ${mark} ${r.name.padEnd(width)}  ${String(r.passed).padStart(4)}${note}`);
}

// Reported THREE WAYS, which is the standing rule when the total moves: the per-file list,
// the sum, and the suite count. The sum is computed from the same rows printed above, so
// the list and the total cannot disagree — they did once, and nobody noticed for six PRs.
console.log("");
console.log(`  suites run   ${runnable.length}` + (skipped.length ? `  (skipped, not runnable: ${skipped.join(", ")})` : ""));
console.log(`  assertions   ${totalPassed}`);
if (totalFailed) console.log(`  FAILED       ${totalFailed}`);

for (const b of broken) {
  console.log(`\n----- ${b.name} ${b.vacuous ? "(exited 0 with ZERO assertions)" : `(exit ${b.status})`} -----`);
  console.log(b.out.trimEnd());
}

if (broken.length || totalFailed) {
  console.log(`\nRALPH FAILED — ${broken.length} suite(s) broken, ${totalFailed} failed assertion(s)`);
  process.exit(1);
}
console.log(`\nRALPH OK — ${totalPassed} assertions across ${runnable.length} suites`);
