// The mutation harness. Runs ONE suite and reports a verdict that cannot read a crash as a pass.
// Run: node ralph/mutate.mjs <suite-name>
//
// ═════════════════════════════════════════════════════════════════════════════════════════════
// ⚠ NEXT UNIT ON THIS FILE: THE TOOL OWNS THE WHOLE EDIT. RAISED FROM BOARDED, ON THE COUNT.
//
// EIGHT DEFECTS HAVE NOW BEEN FOUND IN THIS ONE MECHANISM, AND THREE OF THEM ARE THE SAME GAP:
// the tool does not own the operation end to end, so the operator supplies the missing half and
// the missing half is where the damage happens.
//
//   the `git checkout` incident   the operator reverted by hand and DESTROYED UNCOMMITTED WORK
//   the empty replacement          the operator chose a mutation shape the revert cannot locate
//   the phantom manifest           a restore left edit records describing damage that was gone
//
// THREE OF EIGHT, ONE MECHANISM. Every one is prevented by the same change: the tool applies the
// edit, records where it landed by POSITION rather than by searching for its own output, and
// reverts from that record. `--edit` and `--revert-edit` were the first half of it and stopped
// short — they own the apply, and the revert still works by string search, which is why an empty
// replacement is unrevertable at all.
//
// ⚠ THE FIVE REFUSALS ARE NOT THAT CHANGE AND SHOULD NOT BE MISTAKEN FOR IT. Each closes a state
// the tool cannot recover from, which is the right posture and is still a guard rather than a
// mechanism — this repo's own rule is that ONLY A MECHANISM PREVENTS A FAILURE MODE, and the
// refusals exist precisely because the mechanism is missing.
//
// The counter-argument is real and is why this was boarded rather than built: position-based
// records shift under any other edit to the same file, so the tool would need to refuse a second
// edit to a file it has already touched, or re-anchor. That is the design question to answer.
// ═════════════════════════════════════════════════════════════════════════════════════════════
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
import { existsSync, mkdirSync, copyFileSync, readdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { countAssertions } from "./count.mjs";

/* ---- ⚠ THE FIFTH DEFECT, AND THE ONLY ONE THAT DESTROYED WORK -------------------------------
 *
 * The other four in this file misreported a verdict. This one lost a change.
 *
 * ⚠ AND IT WAS NOT IN THIS FILE'S CODE — `mutate.mjs` touches the working tree NOWHERE. The damage
 * came from the operator reverting a mutation with `git checkout <file>`, which discards EVERY
 * uncommitted change in that file, not just the mutation. In #362 that file also held the entire
 * change the mutation was proving, and the commit went out without it: gates asserting tokens that
 * did not exist, a STATE entry claiming a ruling was implemented, and a wordmark still theming.
 *
 * SO THE FIX BELONGS HERE ANYWAY, because this tool is what makes an operator reach for a revert.
 * A mutation run is BY CONSTRUCTION performed on a dirty tree — the mutation IS the dirt — so
 * refusing to run on one would refuse every legitimate run. What it can do is make the safe path
 * the default: SNAPSHOT EVERY DIRTY FILE BEFORE THE RUN, and restore from the snapshot rather than
 * from HEAD. `git checkout` reverts to the last COMMIT; this reverts to the last INTENT.
 *
 *   node ralph/mutate.mjs <suite>     snapshots, runs, prints the restore command
 *   node ralph/mutate.mjs --restore   puts every snapshotted file back
 */
const SNAP = join(process.env.TMPDIR ?? "/tmp", "ralph-mutate-snapshot");

/* ⚠ DECLARED BESIDE `SNAP` RATHER THAN BESIDE `--edit`, BECAUSE `--restore` CLEARS IT TOO.
 * It sat below the `--edit` block until the restore needed it, and a `const` referenced above its
 * declaration is a TEMPORAL DEAD ZONE error that `node --check` PARSES CLEANLY — the exact shape
 * that shipped a broken harness under 3100 green assertions, arriving in the repair for that same
 * file. Proved by RUNNING the restore, not by checking it. */
const EDITS = join(process.env.TMPDIR ?? "/tmp", "ralph-mutate-edits.json");

/* ⚠ UNTRACKED FILES COUNT, AND THE FIRST VERSION MISSED THEM. `git diff --name-only HEAD` lists
 * MODIFICATIONS TO TRACKED FILES ONLY, so a brand-new suite being mutation-tested was never
 * snapshotted and `--restore` silently left it mutated — discovered while mutation-testing
 * `token-claims.mjs`, the first new file to use this. The restore reported success and restored
 * nothing, which is the shape #364 was written about, one file later and in my own fix. */
function dirtyFiles() {
  const modified = spawnSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }).stdout ?? "";
  const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" }).stdout ?? "";
  return [...new Set(`${modified}\n${untracked}`.split("\n").map((l) => l.trim()).filter(Boolean))];
}

if (process.argv[2] === "--snapshot") {
  rmSync(SNAP, { recursive: true, force: true });
  /* ⚠ CREATED UNCONDITIONALLY, AND ITS ABSENCE IS THE SEVENTH DEFECT IN THIS MECHANISM. `SNAP` used
   * to be created only as a side effect of copying a dirty file, so ON A CLEAN TREE the copy loop
   * never ran, the manifest write below threw ENOENT, and no snapshot existed at all. `--restore`
   * then exited 2 saying there was nothing to restore.
   *
   * ⚠ THE CRASHING CASE WAS THE ONE THE MANIFEST EXISTS FOR. #379 added the clean-file manifest so a
   * mutation to a previously-CLEAN file could be reverted — and a tree with no dirty files is
   * exactly when every mutated file is clean at snapshot. The repair and the case it repairs could
   * not both be present. Six rounds of mutation testing never hit it because the operator's tree was
   * always already dirty. */
  mkdirSync(SNAP, { recursive: true });
  const files = dirtyFiles();
  for (const rel of files) {
    if (!existsSync(rel)) continue;
    const dest = join(SNAP, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(rel, dest);
  }
  /* ⚠ THE MANIFEST IS THE OTHER HALF, AND WITHOUT IT `--restore` CANNOT UNDO THE MUTATION ITSELF.
   * THIS IS THE SIXTH DEFECT IN THIS MECHANISM — after the run-time snapshot that returned the
   * mutation, the missed untracked files, the consumed snapshot, and the destructive `git checkout`
   * the whole thing exists to replace. Six in one safety net is the argument the net was making all
   * along: A TOOL THAT RESTORES THE WRONG STATE IS WORSE THAN AN ABSENT ONE, BECAUSE IT IS TRUSTED.
   * The snapshot above captures files ALREADY DIRTY — the operator's work in progress. A mutation
   * to a file that was CLEAN at snapshot time creates a dirty file the snapshot never held, so the
   * restore had nothing to put back and said "restored N file(s)" anyway.
   *
   * ⚠ THAT IS EXACTLY BACKWARDS FROM WHAT AN OPERATOR ASSUMES. It reads as "snapshot, mutate,
   * restore", and it only ever worked when the mutated file happened to be one already edited that
   * session. ⚠ SO IT ONLY EVER WORKED BY COINCIDENCE — every prior use happened to mutate a file
   * the operator had already edited, which is why five rounds of mutation testing across four PRs
   * never exposed it. Found mutating a content YAML in #379: three mutations restored, the fourth
   * silently did not, and the restore reported success for all four.
   *
   * Recording which files were CLEAN lets restore revert them with `git checkout`, which is safe
   * BY CONSTRUCTION here: clean at snapshot time means HEAD held the intended state. That is the
   * distinction #364 turned on — `git checkout` is destructive when the tree holds unsaved intent,
   * and correct precisely when it does not. */
  writeFileSync(join(SNAP, ".clean-at-snapshot"), spawnSync("git", ["ls-files"], { encoding: "utf8" }).stdout
    .split("\n").map((l) => l.trim()).filter(Boolean).filter((f) => !files.includes(f)).join("\n"));

  console.log(`snapshotted ${files.length} dirty file(s) — mutate freely, then \`--restore\`:`);
  for (const f of files) console.log(`  ${f}`);
  if (!files.length) console.log("  (tree was clean — every tracked file will be reverted by `--restore`)");
  process.exit(0);
}

if (process.argv[2] === "--restore") {
  if (!existsSync(SNAP)) {
    console.error("no snapshot to restore from — nothing was run, or it was already cleaned");
    process.exit(2);
  }
  const walk = (d, base = "") => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name), join(base, e.name)) : [join(base, e.name)]);
  const files = walk(SNAP).filter((f) => f !== ".clean-at-snapshot");
  for (const rel of files) { mkdirSync(dirname(rel) || ".", { recursive: true }); copyFileSync(join(SNAP, rel), rel); }
  console.log(`restored ${files.length} file(s) from the pre-mutation snapshot:`);
  for (const f of files) console.log(`  ${f}`);

  /* ⚠ AND THE FILES THAT WERE CLEAN — the ones the mutation itself dirtied. `git checkout` on
   * these is safe because they were clean when the snapshot ran, so HEAD is their intended state.
   * Reverted ONE BY ONE and named, because a blanket checkout is the destructive operation this
   * whole mechanism exists to avoid. */
  const manifest = join(SNAP, ".clean-at-snapshot");
  const wasClean = existsSync(manifest)
    ? readFileSync(manifest, "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : [];
  const nowDirty = new Set(dirtyFiles());
  const mutated = wasClean.filter((f) => nowDirty.has(f));
  for (const f of mutated) spawnSync("git", ["checkout", "--", f]);
  if (mutated.length) {
    console.log(`reverted ${mutated.length} file(s) the mutation itself dirtied (clean at snapshot, so HEAD is the intent):`);
    for (const f of mutated) console.log(`  ${f}`);
  }
  if (!existsSync(manifest)) {
    console.log("⚠ no clean-file manifest — this snapshot predates #379, so a mutation to a");
    console.log("  previously-clean file has NOT been reverted. Check `git status`.");
  }
  /* ⚠ THE EIGHTH DEFECT, AND THE MOST DANGEROUS SHAPE THIS MECHANISM HAS PRODUCED. `--restore` put
   * the tree back and left the EDIT MANIFEST untouched, so it went on recording mutations that no
   * longer existed anywhere.
   *
   * A stale manifest is worse than a stale snapshot. The next `--revert-edit` acts on records whose
   * damage is already gone: at best it refuses and the operator loses a round to a phantom, at worst
   * it FINDS THE REPLACEMENT STRING BY COINCIDENCE in restored source and rewrites a line nobody
   * mutated. It also reddens `mutate-harness` C3, which asserts that a revert with nothing recorded
   * refuses — the harness catching contamination from its own tool.
   *
   * A RESTORE SUPERSEDES EVERY PENDING EDIT RECORD BY DEFINITION, so it clears them. Same reasoning
   * as the seven above: the tool must not leave behind a claim it has just made false. */
  rmSync(EDITS, { force: true });
  /* ⚠ AND THE RESTORE VERIFIES ITSELF, BECAUSE THE FAILURE MODE HERE HAS ALWAYS BEEN SILENT SUCCESS.
   * Every one of the seven defects in this mechanism reported "restored N file(s)" while leaving a
   * mutation in the tree. A tool that cannot confirm its own effect is what produced all of them, and
   * this repo already prefers an instrument that fails loudly over one that returns a plausible
   * result.
   *
   * The check is the whole claim: after restoring, NO FILE THIS RUN TOUCHED MAY STILL DIFFER from
   * what it was at snapshot. Snapshotted files must match their copy; clean-at-snapshot files must
   * match HEAD. Anything else is named and the exit code is non-zero. */
  const stillWrong = [];
  for (const rel of files) {
    if (!existsSync(rel) || readFileSync(rel, "utf8") !== readFileSync(join(SNAP, rel), "utf8")) {
      stillWrong.push(`${rel} (does not match its snapshot)`);
    }
  }
  const dirtyAfter = new Set(dirtyFiles());
  for (const f of mutated) if (dirtyAfter.has(f)) stillWrong.push(`${f} (still differs from HEAD)`);
  if (stillWrong.length) {
    console.error("⚠ RESTORE FAILED — the tree does not match the snapshot. Do NOT trust any mutation");
    console.error("  result from this run; a survivor may have been measured against a mutated tree.");
    for (const f of stillWrong) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log("verified: every file this run touched matches its pre-mutation state");
  rmSync(SNAP, { recursive: true, force: true });
  process.exit(0);
}

/* ============================================================================================
   ⚠ `--edit` — THE TOOL OWNS THE MUTATION, AND THAT CLOSES THE ONE GAP THIS FILE STILL HAD.

   Everything above snapshots, restores and verifies. NONE of it performed the edit: every mutation
   in this repo was applied by hand with an editor or a script, so the tool never learned what the
   target was, could not refuse anything, and could not revert precisely. The operator held the one
   piece of information the safety net needed.

   ⚠ THE INCIDENT THAT NAMED IT. Mutation-testing a registry, the restore step inside the loop was
   written as `git checkout <file>` — the destructive operation this whole mechanism exists to
   replace — reached for while applying the rule that names it, in a loop whose first line was
   `--snapshot`. The registry was uncommitted, so the checkout discarded it. It was recoverable only
   because the file happened to be dirty when the snapshot ran, which is the case the snapshot covers
   BY CONSTRUCTION rather than by luck — but the luck was in the ordering.

   ⚠ AND THE REASON A RULE WAS NOT ENOUGH IS THE ONE THIS REPO KEEPS RE-LEARNING: ONLY A MECHANISM
   PREVENTS A FAILURE MODE. The interim rule — "`--restore` is the only restore path in a mutation
   loop" — was written down and is still true. It did not stop the next person reaching for
   `git checkout`, because reaching for it is faster than remembering the rule.

   ---- WHAT IT REFUSES, AND WHY EACH REFUSAL IS THE POINT ---------------------------------------

     dirty and unsnapshotted   The tree holds intent nothing has recorded. This is EXACTLY the
                               state the incident destroyed, and it is the only one the tool
                               cannot recover from. Refused with the command that fixes it.

     anchor not unique         A replacement applied to the wrong occurrence mutates something the
                               operator did not name, and the verdict then describes a different
                               edit than the one intended. Zero matches is a mutation that never
                               ran and would report SURVIVED — the false-negative this file exists
                               to make impossible.

     replacement === anchor    A no-op mutation cannot kill anything, so it ALWAYS reports SURVIVED
                               and reads as a weak gate. It is a test of the test that cannot fail,
                               which is the defect this repo has deleted four rows for.

   ---- AND `--revert-edit` UNDOES WHAT IT APPLIED, NOT WHAT HEAD HOLDS ---------------------------

   It replaces each recorded replacement with its anchor, newest first, and verifies the residue is
   gone. That is precise where `git checkout` is total: a file carrying both a mutation and the
   operator's uncommitted work comes back with the work intact. The edits are recorded outside the
   snapshot so a clean-tree mutation is revertible without one.
============================================================================================ */
/* ============================================================================================
   ⚠ WHICH OF THE NINE THE OWNERSHIP CHANGE ACTUALLY CLOSES — DERIVED, ONE BY ONE.

   The estimate carried into this unit was "four of nine", stated as unmeasured. Measured, it is
   TWO CLOSED AND ONE NARROWED, and the seven it does not touch are listed because a fix credited
   with more than it did is how the next reader stops looking.

     CLOSED — the locate step was their whole cause, and there is no locate step now

       8  the EMPTY REPLACEMENT. `--revert-edit` searched for the replacement; the empty string
          matches at every character, so a deletion mutation could never be found again. The revert
          restores recorded bytes, so an empty replacement is ordinary — the refusal that guarded
          this is retired above, with its cause stated.
       9  the NON-UNIQUE REPLACEMENT. `--edit` checked the ANCHOR's uniqueness while the revert
          searched for the REPLACEMENT, which nothing checked. Same removal, same reason.

     NARROWED, NOT CLOSED — say which half

       •  the PHANTOM MANIFEST. Entries went stale because a refused revert left them recorded, and
          a later run acted on them. The common trigger is gone (a revert can no longer fail to
          LOCATE), but a revert can still refuse when the fingerprint says the operator edited a
          mutated file — and that refusal still leaves the manifest populated, by design, because
          the edits really are outstanding. `mutate-harness` C3 remains the detector and its header
          still names the recovery.

     NOT CLOSED — a different mechanism, and this change does not reach them

       1  the `git checkout` INCIDENT. Closed earlier, by `--edit`/`--revert-edit` existing at all.
          This change makes hand-reverting unnecessary in more cases; it did not cause that.
       2  the SNAPSHOT TAKEN AT RUN TIME — `--snapshot`/`--restore`, untouched here.
       3  the SNAPSHOT COVERING FILES ALREADY EDITED rather than the ones a mutation will dirty —
          same mechanism, same distance.
       4  `--restore` CONSUMING ITS SNAPSHOT — same.
       5  the SYNTAX ERROR that shipped under 3,100 green assertions — closed by `node --check` in
          the harness, which is a parse and has nothing to do with edits.
       6  the TEMPORAL DEAD ZONE in that repair — closed by RUNNING the branch, likewise.
       7  the CLEAN-FILE NO-OP, where `--restore` reported success over files it had never copied.

   ⚠ SO THE SNAPSHOT MECHANISM STILL CARRIES FOUR OF THE NINE, and this change does not relieve it.
   `--snapshot` before a batch is still the rule, and it is now the rule for a NARROWER reason: it
   covers the operator's whole tree, where `--edit` covers only what the tool wrote.

   ---- ⚠ WHY THE RECORD IS CONTENT AND NOT POSITION, WHICH WAS THE OPEN DESIGN QUESTION ---------

   This stayed boarded on one question: a position record shifts under any later edit to the same
   file, so the tool must either refuse a second edit or re-anchor. A CONTENT record dissolves it —
   each edit stores the state it found, so unwinding newest-first walks back through states that
   actually existed.

   ⚠ AND THE VERIFY LOOP IS THE ARGUMENT, BECAUSE IT IS WHERE POSITION WOULD HAVE FAILED SILENTLY.
   Two edits to one file record A→B and B→C. After unwinding, the file holds A — the FIRST edit's
   `before`, not the second's. A per-edit check compares the settled file against B and reports a
   failure on a revert that worked; a position record cannot even express which state is correct.
   The first draft of the verify loop had exactly that bug and it was caught by driving two edits
   through, not by reading it.
============================================================================================ */
const readEdits = () => (existsSync(EDITS) ? JSON.parse(readFileSync(EDITS, "utf8")) : []);

if (process.argv[2] === "--edit") {
  const [, , , rel, anchorArg, replacementArg] = process.argv;
  if (!rel || anchorArg === undefined || replacementArg === undefined) {
    console.error("usage: node ralph/mutate.mjs --edit <file> <anchor> <replacement>");
    process.exit(2);
  }
  if (!existsSync(rel)) {
    console.error(`no such file: ${rel}`);
    process.exit(2);
  }
  if (anchorArg === replacementArg) {
    console.error("⚠ REFUSED — the replacement is identical to the anchor.");
    console.error("  A no-op mutation always reports SURVIVED and says nothing about the gate.");
    process.exit(2);
  }
  /* ⚠ THE EMPTY-REPLACEMENT REFUSAL IS RETIRED, AND ITS CAUSE IS WHAT WENT — NOT THE RULE'S NERVE.
   *
   * It existed because `--revert-edit` located what it had applied by SEARCHING FOR THE REPLACEMENT,
   * and the empty string matches at every character, so a deletion mutation could never be found
   * again. The revert below no longer searches for anything: `--edit` records the file's exact
   * bytes BEFORE it writes, and the revert restores them. An empty replacement is now as revertible
   * as any other, so a deletion mutation is expressible directly rather than through the
   * `// mutated away` workaround the refusal used to recommend.
   *
   * ⚠ A REFUSAL WHOSE CAUSE IS GONE IS A ROW MATCHING NOTHING, which this repository deletes on
   * sight. It is recorded here rather than silently dropped because the NEXT reader will meet an
   * eighth-defect entry that says empty replacements are unrevertable, and that entry is now history
   * rather than a live hazard. */

  /* ⚠ THE REFUSAL THE INCIDENT ASKED FOR. Clean is safe because HEAD holds the intent, and
   * snapshotted is safe because the copy does. Dirty-and-unsnapshotted is the one state where
   * nothing but the working tree knows what the operator meant.
   *
   * ⚠ AND THERE IS NOW A FOURTH SAFE STATE, FOUND BY DRIVING THE TOOL RATHER THAN READING IT: the
   * file is dirty BECAUSE OF THIS TOOL'S OWN RECORDED EDIT. Before the ownership change that was
   * indistinguishable from an operator's work; now the manifest holds the bytes and a fingerprint of
   * what was written, so "did I do this" is a question with an answer. Without this clause a SECOND
   * edit to the same file is impossible without a snapshot — the tool refusing to touch dirt it
   * created itself, which is the workflow the content record exists to support.
   *
   * THE CHECK IS THE FINGERPRINT, NOT THE FILENAME. A file this tool mutated AND the operator then
   * edited hashes to neither state, so it falls through to the refusal exactly as it should. */
  const dirtyNow = new Set(dirtyFiles());
  const snapshotHasIt = existsSync(join(SNAP, rel));
  const priorForFile = readEdits().filter((e) => e.file === rel && typeof e.afterSha === "string");
  const toolOwnsTheDirt = priorForFile.length > 0
    && priorForFile[priorForFile.length - 1].afterSha
       === createHash("sha256").update(readFileSync(rel, "utf8")).digest("hex");
  if (dirtyNow.has(rel) && !snapshotHasIt && !toolOwnsTheDirt) {
    console.error(`⚠ REFUSED — ${rel} has uncommitted changes and is not in a snapshot.`);
    console.error("  Nothing but the working tree knows what those changes were, so this edit");
    console.error("  would not be revertible. Take a snapshot first:");
    console.error("\n    node ralph/mutate.mjs --snapshot\n");
    process.exit(2);
  }

  const before = readFileSync(rel, "utf8");
  const hits = before.split(anchorArg).length - 1;
  if (hits !== 1) {
    console.error(`⚠ REFUSED — the anchor occurs ${hits} time(s) in ${rel}; it must occur exactly once.`);
    console.error(hits === 0
      ? "  Zero matches is a mutation that never runs, and an unrun mutation reports SURVIVED."
      : "  Several matches means the edit would land somewhere the operator did not name.");
    process.exit(2);
  }

  /* ⚠ THE TOOL OWNS THE EDIT, WHICH MEANS IT RECORDS WHAT IT REPLACED RATHER THAN HOW TO FIND ITS
   * OWN OUTPUT AGAIN. `before` is the file's exact bytes at the moment of writing and `afterSha`
   * fingerprints what this tool then wrote. The revert restores `before` — it searches for nothing,
   * so a replacement that is empty, non-unique, or identical to text elsewhere in the file is
   * simply not a category any more.
   *
   * ⚠ AND THIS IS WHY A SECOND EDIT TO THE SAME FILE NEEDS NO RE-ANCHORING, which was the open
   * design question that kept this boarded. A position record shifts under any later edit; a
   * CONTENT record does not. Each edit stores the state it found, so unwinding newest-first walks
   * back through exactly the states that existed, and the `afterSha` check below proves each step
   * is standing where it thinks it is. */
  const after = before.replace(anchorArg, replacementArg);
  writeFileSync(rel, after);
  const edits = readEdits();
  edits.push({
    file: rel,
    anchor: anchorArg,
    replacement: replacementArg,
    wasClean: !dirtyNow.has(rel),
    before,
    afterSha: createHash("sha256").update(after).digest("hex"),
  });
  writeFileSync(EDITS, JSON.stringify(edits, null, 2));
  console.log(`edited ${rel} — 1 site. Revert with \`node ralph/mutate.mjs --revert-edit\``);
  process.exit(0);
}

if (process.argv[2] === "--revert-edit") {
  const edits = readEdits();
  if (!edits.length) {
    console.error("no recorded edits to revert — nothing was applied through `--edit`");
    process.exit(2);
  }
  const failed = [];
  /* ⚠ NEWEST FIRST, AND EACH STEP PROVES IT IS STANDING WHERE IT THINKS IT IS BEFORE IT WRITES.
   *
   * The revert no longer SEARCHES for the replacement. That search was the ninth defect: `--edit`
   * validated the ANCHOR's uniqueness while the revert looked for the REPLACEMENT, whose uniqueness
   * nothing ever checked — so a replacement occurring twice made the edit unrevertable, the entry
   * stayed in the manifest, and a later run found the string by coincidence and REWROTE LINES NOBODY
   * MUTATED. It restores recorded bytes instead, which has no locate step to get wrong.
   *
   * ⚠ THE FINGERPRINT ENFORCES "THE OPERATOR NEVER EDITS A MUTATED FILE" RATHER THAN TRUSTING IT.
   * If the file no longer hashes to what this tool wrote, something else changed it and restoring
   * `before` would destroy that change — the `git checkout` incident's shape, arriving inside the
   * mechanism built to replace it. So it REFUSES and names the file, which is the one state where
   * only a human knows what was meant. */
  for (const e of [...edits].reverse()) {
    if (!existsSync(e.file)) { failed.push(`${e.file} (gone)`); continue; }
    if (typeof e.before !== "string" || typeof e.afterSha !== "string") {
      failed.push(`${e.file} (recorded by an older version of this tool, without the bytes it replaced)`);
      continue;
    }
    const cur = readFileSync(e.file, "utf8");
    const curSha = createHash("sha256").update(cur).digest("hex");
    if (curSha !== e.afterSha) {
      failed.push(`${e.file} (changed since the mutation — restoring would destroy that change)`);
      continue;
    }
    writeFileSync(e.file, e.before);
  }
  /* ⚠ VERIFIED, BECAUSE THE FAILURE MODE IN THIS FILE HAS ALWAYS BEEN SILENT SUCCESS. Eight defects
   * above each reported a restore that had not happened. A revert that cannot confirm its own effect
   * is the same instrument again — so the check is that the file now holds the recorded bytes, which
   * is the whole claim rather than a proxy for it. */
  /* ⚠ THE ORIGINAL STATE OF A FILE IS THE **FIRST** EDIT'S `before`, NOT EVERY EDIT'S. Two edits to
   * one file record A→B and B→C; unwinding restores B then A, so the finished file holds A. Checking
   * each edit's own `before` would compare the settled file against B and report a failure on a
   * revert that worked perfectly — an assertion that cannot pass for the reason it names, which is
   * the shape this session found twice in one suite. Verified once per FILE, against the earliest
   * state recorded for it. */
  const original = new Map();
  for (const e of edits) if (typeof e.before === "string" && !original.has(e.file)) original.set(e.file, e.before);
  for (const [file, before] of original) {
    if (!existsSync(file)) continue;
    if (readFileSync(file, "utf8") !== before) {
      failed.push(`${file} (the file does not hold the bytes this tool replaced)`);
    }
  }
  if (failed.length) {
    console.error("⚠ REVERT FAILED — do NOT trust any verdict from this run:");
    for (const f of failed) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`reverted ${edits.length} edit(s); every mutation this run applied is gone:`);
  for (const e of edits) console.log(`  ${e.file}`);
  rmSync(EDITS, { force: true });
  process.exit(0);
}

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

/* ⚠ NO SNAPSHOT IS TAKEN HERE, AND THE FIRST VERSION OF THIS FIX TOOK ONE — WHICH WAS WORSE THAN
 * NOTHING. By the time this runs the operator has ALREADY edited the file, so a snapshot at run
 * time captures the MUTATED state and `--restore` hands the mutation straight back. Tested against
 * the real scenario and it failed: the mutation survived the restore.
 *
 * A SAFETY NET THAT RESTORES THE WRONG STATE IS WORSE THAN AN ABSENT ONE, because it is trusted.
 * So the snapshot is an EXPLICIT step taken before mutating, and a run with no snapshot says so
 * rather than quietly offering a restore that would lie. */
const haveSnapshot = existsSync(SNAP);

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
if (haveSnapshot) {
  console.log("          revert with `--revert-edit` if the edit was applied through `--edit`,");
  console.log("          otherwise `--restore` — NEVER `git checkout`, which reverts to the last");
  console.log("          COMMIT and discards uncommitted work along with the mutation.");
} else if (!treeClean) {
  console.log("          ⚠ NO PRE-MUTATION SNAPSHOT. `git checkout <file>` will discard EVERY");
  console.log("             uncommitted change in it, not just the mutation — that is how #362");
  console.log("             shipped gates whose tokens did not exist. Next time run");
  console.log("             `node ralph/mutate.mjs --snapshot` BEFORE editing.");
}
if (verdict === "INVALID") {
  const line = out.split("\n").find((l) => /^\s*\w*(Error):/.test(l));
  if (line) console.log(`          ${line.trim().slice(0, 140)}`);
}
/* ⚠ ONLY `KILLED` EXITS 0. A mutation run is asking "was this caught", so the shell's idea of
 * success is "yes". SURVIVED and INVALID both exit non-zero, for different reasons that the line
 * above names — which is what stops the two being conflated again. */
process.exit(verdict === "KILLED" ? 0 : 1);
