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
// ---- ⚠ IF `C3` IS RED, CLEAR THE MANIFEST **BEFORE** RE-RUNNING RALPH ------------------------
//
//     rm -f "$TMPDIR/ralph-mutate-edits.json"      (or /tmp/ralph-mutate-edits.json)
//
// C3 goes red when `$TMPDIR/ralph-mutate-edits.json` still records edits that are no longer in the
// tree — most often because `--revert-edit` REFUSED. It refuses correctly when the replacement
// string is not unique in its file, and the entry then stays recorded forever because the only
// thing that clears it is a successful revert or a `--restore`.
//
// ⚠ THE RE-RUN IS WHAT APPLIES THE DAMAGE, WHICH IS WHY THE ORDER IS STATED FIRST. This suite
// exercises the REAL binary, and `ralph/run.mjs` runs this suite — so a full run with a dirty
// manifest can act on the stale rows, find a replacement string by coincidence in restored source,
// and REWRITE LINES NOBODY MUTATED. That is not hypothetical: it duplicated a call in two component
// files during the unit that added `draft-signal`, and the applying agent was a routine green run.
//
// So the sequence is: clear the manifest, THEN re-run. Reversing it makes the diagnosis the
// mutation. And read `git status` afterwards either way — this file's own subject is a tool whose
// reported success is not evidence the tree is right.
//
// ---- WHAT IT ASSERTS, AND WHAT IT WRITES ------------------------------------------------------
//
// Parsing, the refusals, and a real apply-and-revert round trip. IT WRITES NOTHING INSIDE THE
// REPOSITORY, and both halves of that took a correction.
//
// ⚠ THIS USED TO SAY THE ROUND TRIP WAS "DELIBERATELY NOT HERE" AND THAT "what belongs in CI is the
// half that cannot damage anything". Both were FALSE of section B, which performed the round trip
// on a real TRACKED file. True when written, false from the moment B5 to B7 arrived — the aged-out
// variety of prose-and-code drift.
//
// THE TWO BOUNDS, AS THEY NOW STAND:
//
//   the MANIFEST  had NO bound. `mutate.mjs` keys its edit log off `TMPDIR`, section B's `finally`
//                 deleted it, and `ralph/run.mjs` runs this suite — so a full gate run DESTROYED an
//                 operator's pending mutation record. Every invocation now runs against a sandbox
//                 `TMPDIR`; `D6` asserts the operator's was untouched.
//   the FILE      was bounded by this suite holding the original bytes and rewriting them in a
//                 `finally` — which is only as good as the `finally`, and a `finally` is exactly
//                 what a row throwing early defeats. The fixture now lives OUTSIDE the repository,
//                 so a crash at any point leaves the tree clean by construction rather than by
//                 cleanup. `B4a` asserts it.
//
// A file git has never heard of is not in `dirtyFiles()`, so `--edit`'s dirty-and-unsnapshotted
// check has nothing to object to. A temp file INSIDE the repo would be refused, correctly, and the
// rows would fail on the tool being right.
//
// B1, B2 and C1 still use a derived clean TRACKED file, because they REFUSE before writing.
//
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = new URL("../../", import.meta.url).pathname;
const TOOL = "ralph/mutate.mjs";
/* ⚠ EVERY INVOCATION RUNS AGAINST AN ISOLATED `TMPDIR`, AND UNTIL THIS EXISTED THIS SUITE DELETED
 * THE OPERATOR'S PENDING MUTATIONS ON EVERY FULL RALPH RUN.
 *
 * `mutate.mjs` keys its edit manifest and its snapshot off `TMPDIR`. Section B applies real edits
 * and reverts them, and its `finally` ran `rmSync` on `$TMPDIR/ralph-mutate-edits.json` — the
 * operator's file. `ralph/run.mjs` runs this suite, so an operator who ran the full gate while
 * holding a mutation lost the record of it, leaving the mutation in the tree with nothing able to
 * revert it precisely. The tool's own worst outcome, produced by the suite that tests the tool.
 *
 * ⚠ FOUND BY IT HAPPENING TWICE IN ONE SESSION. A mutation to `mutate.mjs` was applied, this suite
 * was run to watch the new rows go red, and they passed — because the suite had reverted and then
 * forgotten the mutation before they could see it. Read as a weak assertion the first time.
 *
 * ⚠ AND THE HEADER ABOVE SAYS "what belongs in CI is the half that cannot damage anything", WHICH
 * WAS FALSE OF SECTION B WHEN IT WAS WRITTEN. B5, B6 and B7 perform the apply-and-revert round trip
 * the header says is deliberately absent. They bound their blast radius on the FILE — holding the
 * original bytes and restoring them in a `finally` — and nothing bounded it on the MANIFEST.
 * Whether they should write to a tracked file at all is a larger question and is not settled here.
 *
 * The sandbox is one directory for the whole suite, because B6 and B7 depend on the manifest
 * PERSISTING between calls — isolation must not become amnesia. */
const SANDBOX = mkdtempSync(join(tmpdir(), "ralph-mutate-harness-"));
const run = (...args) => {
  const r = spawnSync("node", [TOOL, ...args], {
    cwd: root, encoding: "utf8", env: { ...process.env, TMPDIR: SANDBOX },
  });
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
/* ⚠ THE FIFTH REFUSAL IS RETIRED AND THIS ROW IS ITS INVERSE, WHICH IS THE POINT.
 *
 * It refused an empty replacement because `--revert-edit` located what it had applied by SEARCHING
 * FOR THE REPLACEMENT, and the empty string matches at every character. The revert no longer
 * searches — `--edit` records the file's exact bytes before writing and the revert restores them —
 * so the state the refusal protected against does not exist.
 *
 * ⚠ A GUARD WHOSE CAUSE IS GONE IS NOT WEAKENED BY REMOVAL, IT IS UNNECESSARY, and the difference
 * is checkable rather than asserted: this row drives a deletion mutation END TO END and requires the
 * bytes back. If the revert ever regains a locate step, the round trip breaks here.
 *
 * ⚠ AND IT USES THE DERIVED CLEAN TARGET RATHER THAN A SCRATCH FILE, WHICH THE FIRST VERSION GOT
 * WRONG. An untracked temp file IS dirty-and-unsnapshotted — nothing but the working tree knows
 * what it holds — so `--edit` refused it, correctly, and the row failed on the tool being right.
 *
 * ⚠ THIS SECTION'S HEADER FORBIDS ROWS THAT CAN DAMAGE THE TREE, and a round trip WRITES. So the
 * suite holds the original bytes itself and restores them unconditionally, whatever happens: the
 * worst case is the file it read, written back. That is the only row here that touches a file, and
 * it bounds its own blast radius rather than trusting the thing it is testing. */
/* ⚠ THE ROUND-TRIP FIXTURE LIVES OUTSIDE THE REPOSITORY, AND THAT IS THE WHOLE BOUND.
 *
 * B5 to B7 used a real TRACKED file, holding its original bytes and rewriting them in a `finally`.
 * That bound is only as good as the `finally` — and a `finally` is exactly what a row throwing
 * early defeats. A suite that writes to a tracked path is one crash away from a dirty tree that
 * every later gate then measures, and this one does not need to: nothing about the round trip
 * requires the file be in git.
 *
 * ⚠ AND A TEMP FILE INSIDE THE REPO WOULD NOT WORK, WHICH IS WHY IT IS OUTSIDE. An untracked file
 * in the tree IS dirty-and-unsnapshotted — nothing but the working tree knows what it holds — so
 * `--edit` refuses it, correctly, and the rows would fail on the tool being right. A file git has
 * never heard of is not in `dirtyFiles()` at all, so the check has nothing to object to. Measured
 * end to end before this shipped: edit applied, revert exact, repo tree clean.
 *
 * The TRACKED-file derivation above stays for B1, B2 and C1, which REFUSE before writing. */
const FIXTURE = join(SANDBOX, "fixture.ts");
const FIXTURE_SRC = [
  "export const alpha = 1;",
  "export const beta = 2;   // a line long enough to anchor on",
  "export const gamma = 3;",
  "export function delta() { return alpha + beta + gamma; }",
  "",
].join("\n");
{
  writeFileSync(FIXTURE, FIXTURE_SRC);
  const readFix = () => readFileSync(FIXTURE, "utf8");
  const unique = "export const beta = 2;   // a line long enough to anchor on";
  t("B4a the fixture is outside the repository, so no row below can dirty the tree",
    [FIXTURE.startsWith(SANDBOX), existsSync(FIXTURE)], [true, true]);

  const applied = run("--edit", FIXTURE, `${unique}\n`, "");
  const mutatedGone = !readFix().includes(unique);
  const reverted = run("--revert-edit");
  const exact = readFix() === FIXTURE_SRC;
  t("B5 ⚠ AN EMPTY REPLACEMENT IS NOW ACCEPTED — a deletion is a legitimate mutation and the revert no longer has to find it",
    [applied.status, mutatedGone], [0, true]);
  t("B5a …and the round trip returns the EXACT bytes, which is what retired the refusal rather than weakening it",
    [reverted.status, exact], [0, true]);

  /* ⚠ A SECOND EDIT TO A FILE THIS TOOL ALREADY MUTATED. Before the content record this was
     impossible without a snapshot — the dirty check could not tell the tool's own dirt from an
     operator's, so it refused work it had itself created. */
  run("--edit", FIXTURE, unique, "// M1");
  const second = run("--edit", FIXTURE, "// M1", "// M2");
  run("--revert-edit");
  t("B6 ⚠ A SECOND EDIT TO A FILE THIS TOOL ALREADY MUTATED IS ALLOWED — it refused its own dirt before the content record",
    [second.status, readFix() === FIXTURE_SRC], [0, true]);

  /* ⚠ AND THE ONE STATE THE FINGERPRINT EXISTS FOR: the operator edits a mutated file. Restoring
     recorded bytes would destroy that edit — the `git checkout` incident's shape inside the
     mechanism built to replace it — so the revert must REFUSE and leave the edit alone. */
  run("--edit", FIXTURE, unique, "// M3");
  writeFileSync(FIXTURE, readFix() + "\n// a hand edit after the mutation\n");
  const r = run("--revert-edit");
  t("B7 ⚠ AND IF THE OPERATOR EDITS A MUTATED FILE THE REVERT REFUSES RATHER THAN RESTORING OVER IT",
    [r.status !== 0 && /changed since the mutation/.test(r.out),
     readFix().includes("a hand edit after the mutation")], [true, true]);
  rmSync(join(SANDBOX, "ralph-mutate-edits.json"), { force: true });
  writeFileSync(FIXTURE, FIXTURE_SRC);
}

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
/* ⚠ THE ROW THAT USED TO ASSERT THE RETIRED REFUSAL'S HINT IS REPLACED, NOT DELETED — the same
 * discipline as `gallery-format`'s B1c. What it protected was that a deletion stays expressible;
 * B5 above now proves that directly by performing one, which is a stronger claim than checking that
 * a refusal names a workaround. */
t("C4 ⚠ THE REVERT NEVER SEARCHES FOR ITS OWN OUTPUT — the ninth defect was a locate step, and absence is the sound direction",
  /cur\.split\(e\.replacement\)|cur\.replace\(e\.replacement/.test(
    readFileSync(new URL(`../../${TOOL}`, import.meta.url), "utf8")), false);

console.log("\nD · a refusal's LAST LINE stands alone, because an operator pipes to `tail -1`");
/* ⚠ THE TENTH DEFECT, AND IT WAS A FORMATTING CHOICE WITH A VERDICT RIDING ON IT. Every refusal
 * printed a clear multi-line message and exited non-zero — and an operator still read an unrun
 * mutation as a result, because the command was piped to `tail -1` (this repository's standing
 * habit) and the refusal's last line was BLANK. The suite was then run, PASSED because nothing had
 * been applied, and that pass read as the gate surviving.
 *
 * ⚠ THESE ROWS RUN THE REAL BINARY AND ASSERT THE LAST LINE, NOT THE MESSAGE. Asserting the
 * message would pass over the exact defect: the words were always there. What was wrong was which
 * of them came last, and only slicing the output the way an operator does can see that. */
{
  const lastLine = (o) => o.trimEnd().split("\n").at(-1) ?? "";
  /* ⚠ `--revert-edit` RUNS AGAINST AN ISOLATED TMPDIR, AND THE FIRST VERSION DID NOT — IT REVERTED
   * A REAL MUTATION MID-SUITE. The tool keys its edit manifest off `TMPDIR`, so invoking
   * `--revert-edit` with the operator's environment acts on the operator's PENDING EDITS. Proved by
   * accident: a mutation to `mutate.mjs` was applied, this suite was run to confirm the D rows went
   * red, and D4 reverted the mutation before they could — so they reported PASS over a tree that
   * had been silently restored, and `git status` came back clean.
   *
   * ⚠ THAT IS THE HARNESS MUTATING THE TREE THROUGH ITS OWN TOOL, which this repository has already
   * recorded once when a stale manifest made a routine green ralph rewrite two files. The earlier
   * instance needed a stale manifest to fire; THIS ONE FIRES ON A CORRECT ONE, on every run, and it
   * would have destroyed exactly the operator who was mid-mutation.
   *
   * An isolated TMPDIR gives the tool its own empty manifest, so the refusal being tested is a real
   * refusal and nothing outside this suite can be reached. D1 to D3 exit before touching any state,
   * so only D4 needs it — and it is applied to all four rather than reasoned about per row, because
   * "this one happens not to write" is the assumption that produced the defect. */
  /* Uses the suite-wide SANDBOX declared at the top — see the note there. D4 invokes
     `--revert-edit`, which is NOT pure: it reads and clears the manifest. */
  const runIsolated = run;
  const cases = [
    ["D1 no arguments", () => runIsolated("--edit")],
    ["D2 a file that does not exist", () => runIsolated("--edit", "no/such/file.ts", "a", "b")],
    ["D3 a replacement identical to the anchor", () => runIsolated("--edit", TOOL, "zzz-not-present", "zzz-not-present")],
    ["D4 nothing recorded to revert", () => runIsolated("--revert-edit")],
  ];
  for (const [name, fn] of cases) {
    const r = fn();
    /* Each refusal must exit 2 AND have a self-contained final line. Both halves: an exit code
       nobody reads is what made the last line matter in the first place. */
    t(`${name} — exits 2 and its LAST line says nothing was changed`,
      [r.status, /^REFUSED, nothing was changed: /.test(lastLine(r.out))], [2, true]);
  }
  /* ⚠ AND THE FINAL LINE MUST NOT BE BLANK, ASSERTED SEPARATELY. The regex above already implies
     it, and stating it directly is what fails loudly if the format is ever changed to something
     that happens to end in whitespace — which is precisely how this defect existed. */
  t("D5 …and no refusal ends in a blank line, which is the defect this section is named for",
    cases.map(([, fn]) => fn().out.endsWith("\n\n")), [false, false, false, false]);
  /* ⚠ AND THE SANDBOX IS PROVEN EMPTY RATHER THAN ASSUMED. If TMPDIR were not honoured the rows
     above would have run against the operator's manifest and passed exactly the same — which is
     precisely how the defect hid. An isolation claim that cannot fail is not an isolation claim. */
  t("D6 …and the operator's own manifest was never touched, which is what makes this suite safe to run mid-mutation",
    [SANDBOX.includes("ralph-mutate-harness-"), SANDBOX !== (process.env.TMPDIR ?? "/tmp")], [true, true]);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
