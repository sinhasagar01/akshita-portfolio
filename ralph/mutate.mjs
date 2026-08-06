// The mutation harness. Runs ONE suite and reports a verdict that cannot read a crash as a pass.
// Run: node ralph/mutate.mjs <suite-name>
//
// ---- WHY THIS EXISTS -------------------------------------------------------------------------
//
// Mutation testing is the only proof an assertion can fail, so this repo runs it on every new
// gate. The runs themselves were ad-hoc — a shell function counting `[FAIL]` lines — and that
// counter has a hole the real runner closed long ago.
//
// ⚠ A CRASH PRODUCES ZERO FAILURES, WHICH IS INDISTINGUISHABLE FROM SUCCESS TO ANYTHING COUNTING.
// #320's provenance mutation left a syntax error. The module failed to LOAD, the suite printed no
// `[FAIL]` lines at all, and the counter reported it as a surviving mutant — a gate that looked
// too weak when it was in fact never asked. The mutation was invalid and the harness could not
// say so.
//
// COUNTING FAILURES IS NOT THE SAME AS OBSERVING THEM. `ralph/run.mjs` already knows this twice
// over: "THE VERDICT IS THE EXIT CODE", and "A GATE THAT REPORTS ZERO SUBJECTS IS NOT A PASS".
// This applies both rules to a single-suite run so a mutation run cannot be misread.
//
// ---- THE THREE VERDICTS, AND WHY `INVALID` IS THE ONE THAT MATTERS ----------------------------
//
//   KILLED    the suite failed. The mutation was caught — what a mutation run wants.
//   SURVIVED  the suite passed WITH assertions. If a mutation is applied, the gate is too weak.
//   INVALID   the suite crashed OR asserted nothing. The mutation broke the code rather than
//             testing the gate, so it says NOTHING about the gate's strength.
//
// The distinction between SURVIVED and INVALID is the whole point. Both look like "no failures"
// to a counter, and they mean opposite things: one is a defect in the gate, the other is a defect
// in the mutation. Reporting the second as the first sends you rewriting a gate that was fine.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { countAssertions } from "./count.mjs";

const name = process.argv[2];
if (!name) {
  console.error("usage: node ralph/mutate.mjs <suite-name>");
  process.exit(2);
}
const file = `ralph/tests/${name.replace(/\.mjs$/, "")}.mjs`;
if (!existsSync(file)) {
  console.error(`no such suite: ${file}`);
  process.exit(2);
}

/* Type-stripping is needed by the suites that import a `.ts` leaf, and harmless for the rest —
 * the same flag `run.mjs` passes for the same reason. */
const res = spawnSync("node", ["--experimental-strip-types", file], { encoding: "utf8" });
const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;

/* ⚠ THE COUNTS COME FROM `ralph/count.mjs`, WHICH `run.mjs` ALSO USES. This file used to count
 * `[FAIL]` alone, and eleven suites print `✗ FAIL` — so a mutation that failed ten assertions in
 * `rich-markers` was reported as "KILLED · 0 assertions failed". Right verdict, false stated cause,
 * and the FOURTH member of that family in this file.
 *
 * ⚠ THE PREVIOUS THREE WERE EACH FIXED BY A COMMENT EXPLAINING THE HAZARD. This one is fixed by
 * deleting the second reader — #183's rule, applied to the harness that checks the gates. A tool
 * that reads its subject differently from the runner will drift again, and no comment prevents it. */
const { passed: passes, failed: fails } = countAssertions(out);
/* A suite's own summary wins; the marker counts are the fallback for the ones without one —
 * the same precedence run.mjs uses. */
const summary = /(\d+) passed, (\d+) failed/.exec(out);
const asserted = summary ? Number(summary[1]) + Number(summary[2]) : passes + fails;
const crashed = res.status === null || res.status > 1 || /^\s*(Error|TypeError|SyntaxError|ReferenceError):/m.test(out);

/* ⚠ ZERO ASSERTIONS IS `INVALID` WHATEVER THE EXIT CODE, and the first version of this file got
 * that wrong. It routed the #320 case to VACUOUS with the message "exited 0 having asserted
 * NOTHING" — while the process had exited 1. Both branches were non-KILLED so the verdict held,
 * but the REASON printed was false, which is the same defect one layer down: a harness that
 * reports the right answer for the wrong stated cause. A suite that asserted nothing tested
 * nothing, and how it terminated is a detail rather than the classification. */
/* ⚠ A FAILURE BEFORE A CRASH IS STILL A KILL, AND THIS IS THE THIRD DEFECT IN THIS HARNESS OF THE
 * SAME FAMILY — a verdict describing the run less accurately than the run described itself.
 *
 * #344's S4 mutation made an assertion FAIL BY NAME and then crashed the suite at a pre-existing
 * `throw`. The old order put `crashed` first, so it reported INVALID: correct by the rule as
 * written, and WRONG ABOUT WHAT HAPPENED. Left alone, a future mutation that genuinely kills an
 * assertion would be read as never having applied, and someone would go looking for a gate that
 * was working.
 *
 * SO THE FAILURE IS READ FIRST. A crash after a `[FAIL]` says the gate caught the mutation and the
 * code then fell over downstream — which is a KILL with a footnote, not an invalid run. A crash
 * with NO failures still means the mutation broke the code rather than testing the gate. */
let verdict;
if (fails > 0) verdict = "KILLED";
else if (crashed || asserted === 0) verdict = "INVALID";
else if (res.status !== 0) verdict = "KILLED";
else verdict = "SURVIVED";

/* ⚠ THE THIRD MEMBER OF THE SAME FAMILY, FOUND BY THE #322 RUN AND CLOSED HERE. A mutation whose
 * regex did not match produces a SURVIVED that is indistinguishable from a weak gate — the same
 * shape as a crash producing zero failures, one step earlier in the pipeline. It cost a wrong
 * conclusion about the keystatic schema assertion, which was fine and looked broken.
 *
 * ⚠ AND A FOURTH DEFECT IS RECORDED HERE RATHER THAN FIXED, BECAUSE FIXING IT NEEDS A CONCEPT THIS
 * HARNESS DOES NOT HAVE. A suite whose SUBJECT IS BUILD OUTPUT needs a REBUILD between the mutation
 * and the run. `colour-census` reads `.next/static/css`, and #345's J1 reported SURVIVED against an
 * edited `globals.css` until the bundle was rebuilt — THE MUTATION HAD APPLIED TO THE SOURCE BUT NOT
 * TO THE SUBJECT.
 *
 * The working-tree check below confirms the SOURCE changed. That is necessary and, for such a
 * suite, NOT SUFFICIENT — and this harness cannot tell the difference because it has no concept of
 * a suite's subject.
 *
 * THE PRACTICAL RULE UNTIL IT IS FIXED: when mutation-testing a suite that reads the bundle,
 * REBUILD BEFORE RUNNING, and treat a SURVIVED verdict from such a suite as UNPROVEN rather than as
 * evidence. A footnote rather than a hazard — but it is the exact shape that made J1 look weak when
 * it was fine.
 *
 * A clean working tree PROVES no mutation was applied, so the harness can say so instead of
 * leaving it to the operator to remember. It cannot go further than that — it does not know which
 * file you meant to edit, so a dirty tree is necessary evidence and not sufficient. The wording
 * below claims exactly that much. */
const treeClean = spawnSync("git", ["diff", "--quiet", "HEAD"], { encoding: "utf8" }).status === 0;

const detail = { KILLED: `${fails} assertion${fails === 1 ? "" : "s"} failed`
    + (crashed && fails > 0 ? " — then the code crashed downstream, which does not change the kill" : ""),
  /* ⚠ SURVIVED ONLY MEANS ANYTHING WITH A MUTATION APPLIED. Where the tree is dirty the harness
   * still cannot see whether the edit touched the code this suite reads, so the wording states the
   * condition rather than the conclusion. */
  SURVIVED: treeClean
    ? `NO MUTATION APPLIED — the working tree matches HEAD, so this says nothing about the gate`
    : `all ${asserted} passed — if a mutation IS applied, the gate is too weak`,
  INVALID: asserted === 0 && !crashed
    ? `asserted NOTHING (exit ${res.status}) — the mutation broke the code, not the gate, so this says nothing about it`
    : "the suite crashed — the mutation broke the code, not the gate, so this says nothing about it",
}[verdict];

console.log(`${verdict.padEnd(9)} ${name}  ·  ${detail}  (exit ${res.status}, ${asserted} assertions)`);
if (verdict === "INVALID") {
  const line = out.split("\n").find((l) => /^\s*\w*(Error):/.test(l));
  if (line) console.log(`          ${line.trim().slice(0, 140)}`);
}
/* ⚠ ONLY `KILLED` EXITS 0. A mutation run is asking "was this caught", so the shell's idea of
 * success is "yes". SURVIVED and INVALID both exit non-zero, for different reasons that the line
 * above names — which is what stops the two being conflated again. */
process.exit(verdict === "KILLED" ? 0 : 1);
