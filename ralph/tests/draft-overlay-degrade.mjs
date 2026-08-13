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
  t("C2 …and the global empty state carries an empty list rather than omitting it",
    /readError: false,\s*\n\s*readFailures: \[\],/.test(src), true);
  /* The early return — nothing changed to read — is a third construction site and was missed once
     already in this file's history. */
  t("C3 …and the nothing-to-read early return carries one too",
    /return \{ differs, readError: false, readFailures: \[\],/.test(src), true);
  t("C4 the failure names its collection and slug, so an author knows which file to open",
    /collection: CollectionName \| "skills";\s*\n\s*slug: string;/.test(src), true);
}

console.log("\nD · the screen reads the failure list at all");
{
  const bar = readFileSync(join(root, "components/studio/PublishBar.tsx"), "utf8");
  /* ⚠ WHAT IS LEFT HERE IS THE WIRING, NOT THE WORDS. The words were regexes over this file, and a
   * mutation proved that useless: making the per-entry sentence unreachable left every word of it
   * in the source and the rows passed. The sentence is a pure function now and section E calls it.
   * These two rows only assert that the component still hands it the real inputs. */
  t("D1 the bar builds its status from the shared function rather than a local ternary",
    /draftStatusText\(statusInput\)/.test(bar), true);
  t("D2 …and feeds it the live failure list, which is the binding the mutation cut",
    /failures: draftReadFailures,/.test(bar), true);
  /* The tone and the words come from ONE input object, so a future edit cannot make the pill say
     something is wrong and paint it as though nothing is. */
  t("D3 …and the tone is derived from the same input, so words and colour cannot disagree",
    /draftStatusIsProblem\(statusInput\)/.test(bar), true);
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

  /* ⚠ THE INCIDENT'S OWN STATE. One malformed gallery entry, branch read fine. The sentence must
   * NAME the file and must NOT claim the studio fell back to published content. */
  t("E3 ⚠ ONE UNREADABLE ENTRY NAMES ITS FILE",
    draftStatusText({ ...base, failures: one }),
    "Couldn't read gallery/low-tide. Everything else is your draft.");
  t("E3a …and does NOT claim a fallback to published content, which would be false",
    draftStatusText({ ...base, failures: one }).includes("Showing published content"), false);
  t("E3b …and says the rest is the draft, which is what stops a needless re-edit",
    draftStatusText({ ...base, failures: one }).includes("Everything else is your draft"), true);

  t("E4 several failures give a count AND still name one, so the message is actionable",
    draftStatusText({ ...base, failures: two }),
    "Couldn't read 2 draft entries, including gallery/low-tide. Everything else is your draft.");

  /* The global failure keeps the strong sentence — nothing is known, and saying anything softer
     would be the confident lie the original comment refused. */
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
