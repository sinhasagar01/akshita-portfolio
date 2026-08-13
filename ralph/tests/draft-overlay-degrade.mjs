// What one unreadable draft entry costs the other three collections.
// Run: node --experimental-strip-types ralph/tests/draft-overlay-degrade.mjs
//
// ---- ⚠ WHY THIS SUITE EXISTS -----------------------------------------------------------------
//
// A create wrote a project-shaped file into `content/gallery/`. The Keystatic reader does not
// return null on a schema mismatch — it THROWS — and the per-collection reads sat in a bare
// `Promise.all`, which rejects on the first rejection. So the whole draft state threw, the outer
// catch returned the empty state, and the studio silently fell back to LIVE content for projects,
// experience, blog and settings as well.
//
// ⚠ THAT IS WORSE THAN THE 404 IT ALSO CAUSED, WHICH IS WHY IT IS ITS OWN UNIT. A 404 stops an
// author. A silent fallback to published content does not — they keep editing, against main,
// believing it is their draft. The only signal was one boolean.
//
// ---- ⚠ WHAT THIS SUITE CAN AND CANNOT SEE ----------------------------------------------------
//
// `getDraftBranchState` needs a GitHub token and a live draft branch, so it cannot be driven here.
// What IS testable is the property that was wrong: whether one rejecting read is isolated from its
// siblings. That is a shape — a guarded map inside a `Promise.all` — and it is reproduced here
// against the same construction rather than asserted about the source by regex.
//
// The source is then checked for the two things a rewrite could quietly undo: that every read is
// routed through the guard, and that the failure record survives to the return.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { draftStatusText, draftStatusIsProblem } from "../../lib/studio/draft-status-text.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = readFileSync(join(root, "lib/studio/draft-site-settings.ts"), "utf8");

console.log("\nA · the mechanism: one rejecting read must not take its siblings with it");
/* THE CONTROL, FIRST. An unguarded `Promise.all` is what shipped, and every row below is only
 * meaningful if this one demonstrates the failure it was fixing. Without it the suite could pass
 * against an implementation that simply never throws. */
{
  const readers = { a: async () => "A", bad: async () => { throw new Error("schema"); }, c: async () => "C" };
  let unguarded = null;
  try {
    await Promise.all(Object.values(readers).map((r) => r()));
    unguarded = "resolved";
  } catch (e) {
    unguarded = `threw: ${e.message}`;
  }
  t("A1 ⚠ THE CONTROL — a bare Promise.all loses the whole batch to one rejection",
    unguarded, "threw: schema");

  // The shipped shape: each read wrapped, failures recorded, siblings unaffected.
  const out = {}, failures = [];
  const guarded = (name, run) =>
    run().then((v) => { out[name] = v; }).catch((e) => { failures.push({ name, message: e.message }); });
  await Promise.all(Object.entries(readers).map(([k, r]) => guarded(k, r)));

  t("A2 …and the guarded shape keeps every sibling that parsed",
    Object.keys(out).sort(), ["a", "c"]);
  t("A3 …records the one that did not, BY NAME rather than as a count",
    failures, [{ name: "bad", message: "schema" }]);
  /* ⚠ THE PROPERTY THE INCIDENT TURNED ON. Two of three collections were fine and were discarded
   * anyway. A row asserting only "it did not throw" would pass on an implementation that returned
   * nothing at all, which is exactly what the empty state did. */
  t("A4 ⚠ AND THE SURVIVORS ARE REAL VALUES, not an empty state that merely did not throw",
    [out.a, out.c], ["A", "C"]);
}

console.log("\nB · the source still routes every read through the guard");
/* A regex over source is a weak instrument and is used here for one narrow thing: that no read was
 * added later OUTSIDE the guard. The mechanism itself is proved above; this is the drift check. */
{
  /* ⚠ THE END ANCHOR IS SEARCHED FROM THE START INDEX, NOT FROM ZERO, AND THE FIRST VERSION WAS
   * NOT — so it matched the NOTHING-TO-READ EARLY RETURN forty lines ABOVE the loop, the slice came
   * back empty, and B3 passed vacuously against nothing. That is the find-the-first-close-rather-
   * than-the-matching-one shape this repository has recorded seven times, and B0 is the row that
   * caught it. A denominator row earns its place about once per suite; this was that once. */
  const loopStart = src.indexOf("const readFailures: DraftReadFailure[] = [];");
  const loop = src.slice(loopStart, src.indexOf("return { differs, readError: false, readFailures,", loopStart));
  t("B0 the read loop was located — an empty slice would make every row below vacuous",
    loop.length > 400, true);
  const reads = loop.match(/reader\.(collections\.[a-z]+|singletons\.[a-z]+)\.read\(/g) ?? [];
  t("B1 every collection and the singleton are read here — five subjects, not a subset",
    reads.length, 5);
  const guards = loop.match(/guarded\(/g) ?? [];
  /* ⚠ A RELATION, NOT A LITERAL, AND MY FIRST VERSION WAS A LITERAL AND WAS WRONG. It expected six
   * — five calls plus the declaration — and the declaration reads `guarded = ` and matches nothing.
   * The number was arrived at by reasoning about the source instead of counting it.
   *
   * THE RELATION IS ALSO THE BETTER ASSERTION. "As many guards as reads" is the property; a fifth
   * collection joins both sides at once and this row keeps holding, where a literal would have to
   * be edited by whoever adds it — which is the fixed-list shape this arc spent two PRs removing.
   * It cannot pass on an empty subject because B1 pins the read count against a literal. */
  t("B2 ⚠ AND EVERY ONE OF THEM IS INSIDE A `guarded` CALL — as many guards as reads",
    guards.length, reads.length);
  t("B3 …and no bare `.map(async` survives, which is the shape that shipped",
    /\.map\(async \(slug\)/.test(loop), false);
}

console.log("\nC · the two failure states stay distinct, because they mean opposite things");
{
  t("C1 the state declares a per-entry failure list beside the global flag",
    /readFailures: DraftReadFailure\[\];/.test(src), true);
  /* ⚠ THE EMPTY STATE MUST CARRY AN EMPTY LIST, NOT AN ABSENT ONE. A consumer reading
   * `draftReadFailures[0]` on `undefined` throws, and the global-failure path is exactly when the
   * studio must still render. */
  /* ⚠ NOT ADJACENCY. This matched `readError: false` IMMEDIATELY followed by `readFailures: []`, so
     adding a third field between them turned the row red on a literal that still carried both —
     failing for a reason it does not name. The claim is that the empty state carries BOTH, not that
     they are neighbours; field order in an object literal is not a contract. */
  t("C2 …and the global empty state carries an empty list rather than omitting it",
    /const EMPTY_DRAFT_STATE[\s\S]{0,400}?readError: false[\s\S]{0,400}?readFailures: \[\]/.test(src), true);
  /* The early return — nothing changed to read — is a third construction site and was missed once
     already in this file's history. */
  t("C3 …and the nothing-to-read early return carries one too",
    /return \{ differs, readError: false,[^}]{0,120}?readFailures: \[\],/.test(src), true);
  t("C4 the failure names its collection and slug, so an author knows which file to open",
    /collection: CollectionName \| "skills";\s*\n\s*slug: string;/.test(src), true);
}

console.log("\nD · the failure reaches a surface that persists and names the file");
{
  const bar = readFileSync(join(root, "components/studio/PublishBar.tsx"), "utf8");
  const prov = readFileSync(join(root, "components/studio/PublishProvider.tsx"), "utf8");
  t("D1 the bar builds its status from the shared function rather than a local ternary",
    /draftStatusText\(statusInput\)/.test(bar), true);
  t("D2 …and feeds it the live failure list, which is the binding a mutation once cut",
    /failures: draftReadFailures,/.test(bar), true);
  t("D3 …and the tone is derived from the same input, so words and colour cannot disagree",
    /draftStatusIsProblem\(statusInput\)/.test(bar), true);
  /* ⚠ THE ROUTING, WHICH IS THE OWNER'S RULING MADE CHECKABLE. A malformed entry is an error, so it
   * must reach the surface that PERSISTS and carries an action. `drains()` is `ok && !sha`, so a
   * refusal never auto-dismisses — that is the property being relied on. */
  t("D4 ⚠ A PER-ENTRY FAILURE IS RAISED AS A REFUSAL, which is the kind that never drains",
    /kind: "refusal"[\s\S]{0,200}?Couldn\\u2019t read \$\{f\.collection\}\/\$\{f\.slug\}/.test(prov), true);
  t("D5 …and it carries the reader's own sentence, which names the offending key",
    /message: `\$\{f\.message\}/.test(prov), true);
  /* ⚠ RAISED ONCE. The provider re-renders on every toast change, and an array dependency is a new
   * reference each time — which would re-raise the same refusal forever. The dependency is the
   * failure IDENTITY, and this row is what stops that regressing into a loop. */
  t("D6 …and it is raised once, keyed on the failure identity rather than the array",
    /raisedFailures\.current/.test(prov), true);
}

console.log("\nE · the sentence itself, called with real inputs and read as a real answer");
/* ⚠ THIS SECTION EXISTS BECAUSE SECTION D COULD NOT SEE A REACHABILITY BUG. Every row below runs
 * the function; none of them looks at source. That is the whole difference between proving a
 * string is present and proving an author would read it. */
{
  const base = { publishing: false, readError: false, failures: [], unpublished: false };
  const one = [{ collection: "gallery", slug: "low-tide" }];
  const two = [...one, { collection: "blog", slug: "a-post" }];

  t("E1 the quiet state says so",
    draftStatusText(base), "All changes published");
  t("E2 …and an unpublished draft says that instead",
    draftStatusText({ ...base, unpublished: true }), "Unpublished changes");

  /* ⚠ THE INCIDENT'S OWN STATE MOVED SURFACE, AND THESE ROWS MOVED WITH IT RATHER THAN BEING
   * DELETED. E3, E3a, E3b and E4 asserted that ONE unparseable entry produced a named sentence on
   * the publish LINE. On the owner's ruling a malformed entry is an ERROR rather than standing
   * state, so it is now a non-draining refusal toast and the line says nothing about it.
   *
   * THE CLAIM SURVIVES AND ITS SUBJECT CHANGED. What must still hold is that the line does NOT
   * claim a fallback that did not happen — the reader IS looking at their draft everywhere except
   * one file — so the row that mattered most is kept and pointed at the new behaviour. */
  t("E3 ⚠ A PER-ENTRY FAILURE NO LONGER CLAIMS THE STUDIO FELL BACK TO PUBLISHED CONTENT",
    draftStatusText({ ...base, failures: one }).includes("Showing published content"), false);
  /* ⚠ AND IT DOES NOT SILENTLY BECOME "everything is fine" EITHER — the line reports the draft
   * state it still knows, and the refusal carries the failure. A row asserting only the absence
   * above would pass on a function that returned an empty string. */
  t("E3a …and still reports the draft state it does know",
    [draftStatusText({ ...base, failures: one }),
     draftStatusText({ ...base, failures: one, unpublished: true })],
    ["All changes published", "Unpublished changes"]);
  t("E4 …and several failures read the same way, since the line is no longer their surface",
    draftStatusText({ ...base, failures: two }), "All changes published");

  t("E5 a whole-read failure still says the studio is showing published content",
    draftStatusText({ ...base, readError: true }),
    "Couldn't load your draft. Showing published content. Reload to try again.");
  /* ⚠ THE ORDER, ASSERTED RATHER THAN LEFT TO READING. Today a global failure yields an empty
   * failure list, so this state is unreachable — but an edit that populated both must still show
   * the stronger sentence, and nothing else in the file says so. */
  t("E5a ⚠ AND IT OUTRANKS A PER-ENTRY FAILURE when both are somehow set",
    draftStatusText({ ...base, readError: true, failures: two }).includes("Showing published content"), true);

  t("E6 publishing outranks everything, because it is the only transient state here",
    draftStatusText({ ...base, publishing: true, readError: true, failures: two }), "Publishing…");

  /* The tone must agree with the words in every state, which is why it is derived rather than
     recomputed at the call site. */
  t("E7 the problem flag agrees with the sentence in every state",
    [base, { ...base, unpublished: true }, { ...base, failures: one }, { ...base, readError: true }, { ...base, publishing: true }]
      .map(draftStatusIsProblem),
    [false, false, true, true, false]);
}

console.log(`\ndraft-overlay-degrade result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
