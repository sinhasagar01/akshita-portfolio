// HOW MANY ASSERTIONS A SUITE RAN, read the same way by every tool that asks.
//
// ---- ⚠ WHY THIS IS A FILE RATHER THAN A FUNCTION IN EACH CALLER -----------------------------
//
// `run.mjs` has read counts correctly since #183: a suite's OWN SUMMARY wins, and marker counting
// is only the fallback for the suites that print none. `mutate.mjs` grew its own copy of the same
// idea and got it wrong — it counted `[FAIL]` only, and ELEVEN OF THE SUITES PRINT `✗ FAIL`.
//
// The visible cost was small and the shape was not. A mutation that made ten assertions fail in
// `rich-markers` was reported as **"KILLED · 0 assertions failed"** — the right verdict with a
// stated cause that was false, which is the FOURTH defect of exactly that family in `mutate.mjs`.
//
// ⚠ AND #183's RULE IS WHAT SAYS TO FIX IT HERE RATHER THAN ANNOTATE IT THERE: COMMIT THE TOOL, DO
// NOT DOCUMENT THE BUG. A comment in `mutate.mjs` warning that its counts are approximate would
// have been the fourth comment about the same family. One reader, imported by both, cannot
// disagree with itself.
//
// ---- THE PRECEDENCE, AND WHY THE FALLBACK STILL MATTERS -------------------------------------
//
// TWELVE suites print no `N passed, N failed` line at all — `parity`, `task1..3`, `f2`, `f3` and
// the `p4-*` family among them. For those the markers ARE the count, so the fallback is not
// vestigial and must recognise every marker form in use.
//
//   [PASS] / [FAIL]   the 53-suite majority
//   ✓ / ✗ FAIL        `rich-markers` and its neighbours
//
// A marker form that appears in a suite and not here reads as zero assertions, which `run.mjs`
// already refuses to accept as a pass and `mutate.mjs` classifies as INVALID. Both behaviours are
// correct ONLY if this function can see the markers.

/**
 * @param {string} stdout combined stdout+stderr of one suite run
 * @returns {{passed:number, failed:number, from:"summary"|"markers"}}
 */
export function countAssertions(stdout) {
  const summary = [...stdout.matchAll(/(\d+) passed, (\d+) failed/g)].pop();
  if (summary) return { passed: Number(summary[1]), failed: Number(summary[2]), from: "summary" };
  /* ⚠ `✗ FAIL` IS MATCHED BEFORE `✓`, and the `✓` pattern excludes it, because a naive `✓|✗`
   * pair would count a line reading "✓ FAIL-CLOSED: …" as a failure. `rich-markers` has exactly
   * such a line — it is a PASS whose subject is a fail-closed behaviour. */
  const failed = (stdout.match(/\[FAIL\]|✗\s*FAIL/g) ?? []).length;
  const passed = (stdout.match(/\[PASS\]|✓(?!\s*FAIL)/g) ?? []).length;
  return { passed, failed, from: "markers" };
}
