// AN ERROR IS NOT EVIDENCE THAT NOTHING HAPPENED.
// Run: node ralph/tests/error-is-not-evidence.mjs
//
// ---- ⚠ THE DEFECT, WHICH IS THE INVERSE OF EVERY OTHER ONE THIS WEEK -------------------------
//
// `commitFileToBranch` threw on `json.errors` BEFORE reading `json.data`, so a GraphQL response
// carrying both a committed oid and a non-fatal error was discarded and the caller reported
// "nothing was written". An author who retries then gets a duplicate, or `slug_taken` for their own
// successful create.
//
// EVERY OTHER DEFECT THIS WEEK FAILED LOUDLY. THIS ONE SUCCEEDED QUIETLY AND LIED.
//
// ---- ⚠ WHY THIS SUITE READS SOURCE RATHER THAN CALLING --------------------------------------
//
// `github-commit.ts` reaches the network on every path, so no suite can load it — the standing rule
// is that an assertion about such a module is a regex, and a regex cannot see reachability. The
// answer is normally extraction; it is NOT taken here, and the reason is worth stating: the fix is
// an ORDERING inside a function whose every other line is a fetch, and extracting the ordering
// would leave the fetch beside it untested while implying otherwise.
//
// So these rows assert the ORDER OF TWO STATEMENTS — data read before the error decides — which is
// a structural claim a regex CAN settle, and they assert the absence of the old shape, which is the
// sound direction. What they cannot prove is that the response ever carries both; that was measured
// on the live endpoint instead and the measurement is recorded in the fix's own comment.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/* ⚠ COMMENTS BLANKED. The fix's own note quotes the defective line verbatim so a later reader meets
 * it, and an unblanked scan would match that quotation as though it were live code. */
const src = blankCommentBodies(readFileSync(join(root, "lib/studio/github-commit.ts"), "utf8"));

console.log("\nA · the subject is real");
t("A1 the module was read and is code, not a blanked shell",
  [src.length > 4000, src.includes("createCommitOnBranch")], [true, true]);
const graphqlSites = (src.match(/createCommitOnBranch\?\.commit/g) ?? []).length;
t("A2 …and both commit paths are present, so B cannot pass over one",
  graphqlSites, 2);

console.log("\nB · the data is read before the error decides");
/* ⚠ ABSENCE IS THE SOUND DIRECTION AND THIS IS THE WHOLE ROW. The defective shape was a bare
 * `if (json.errors) throw` standing alone, ahead of the data read. If that statement is not in the
 * file, nothing can execute it. */
t("B1 ⚠ NO BARE `if (json.errors) throw` REMAINS — that statement IS the defect, and it ran before the data was read",
  /if\s*\(json\.errors\)\s*throw/.test(src), false);
/* ⚠ AND THE COMPLEMENT, because absence alone is satisfied by deleting the error handling
 * altogether — which would turn a lying failure into a silent one. The error must still decide the
 * MESSAGE when there is no oid. */
t("B2 …and the error still decides the message when no oid came back, so a refused commit is still a failure",
  (src.match(/json\.errors\s*\?\s*`graphql errors:/g) ?? []).length, 2);
t("B3 …and the oid check is what throws, at both sites",
  (src.match(/if\s*\(!commit\?\.oid\)/g) ?? []).length, 2);

console.log("\nC · the merge confirms before reporting a failed publish");
/* ⚠ THE SAME ASSUMPTION ON THE HIGHEST-STAKES WRITE. A publish is the one write an author acts on
 * immediately, by publishing again — so reporting a failure for a merge that landed is the costliest
 * form of this defect. */
{
  /* ⚠ THE END ANCHOR IS THE NEXT TOP-LEVEL DECLARATION, NOT `\n}`. The first version sliced to the
     next line starting with a brace — which is the close of the `opts: { … }` TYPE LITERAL in the
     signature, 92 characters in, so the function body was never in the slice and C1 to C3 failed on
     a region they had already discarded. Brace-DEPTH counting has the same flaw here: the type
     literal opens and closes before the body does, returning the depth to zero early.

     Ninth member of the unbalanced-matcher family, written minutes after recording the eighth. */
  const at = src.indexOf("export async function mergeBranch");
  const rest = at < 0 ? "" : src.slice(at + 10);
  const stops = [rest.indexOf("\nexport "), rest.indexOf("\n/**")].filter((i) => i >= 0);
  const body = at < 0 ? "" : rest.slice(0, stops.length ? Math.min(...stops) : rest.length);
  t("C0 the merge body was located AND BOUNDED — a slice ending at the signature's type literal is the trap this row exists for",
    [body.length > 400, body.includes("merge failed"), body.length < 4000], [true, true, true]);
  t("C1 ⚠ AN UNEXPECTED STATUS ASKS WHETHER THE MERGE LANDED RATHER THAN ASSUMING IT DID NOT",
    /compareBranches\(opts\.base, opts\.head\)/.test(body), true);
  t("C2 …and a base that already contains head reports `noop` rather than an error",
    /aheadBy === 0[\s\S]{0,40}status: "noop"/.test(body), true);
  /* ⚠ AND IF THE CONFIRMATION CANNOT RUN, THE ORIGINAL ERROR STANDS. A read that fails is not
   * permission to claim success — this file's oldest failure mode is an instrument reporting the
   * shape of success when it could not look. */
  /* ⚠ THE CATCH BODY IS THE SUBJECT, NOT WHAT FOLLOWS IT. The first version asserted that a `throw`
     came AFTER the catch — which stays true when the catch returns success first, so the mutation
     that makes a failed confirmation report `noop` survived it. An assertion about what a block does
     has to look inside the block. */
  const catchBody = (body.match(/catch\s*\{([\s\S]*?)\}/) ?? ["", "MISSING"])[1];
  t("C3a the catch block was located, so C3 is not testing an empty string",
    catchBody !== "MISSING", true);
  t("C3 ⚠ AND A FAILED CONFIRMATION RETURNS NOTHING — a read that cannot run is not permission to claim success",
    /\breturn\b/.test(catchBody), false);
  t("C3b …and the original error is what is thrown afterwards",
    /throw new Error\(`merge failed/.test(body), true);
}

console.log("\nD · the read paths are untouched, because there the assumption is sound");
/* ⚠ A READ THAT ERRORS GENUINELY WROTE NOTHING. Widening the fix to them would be the wrong-noun
 * error: this defect is about WRITES whose outcome an error does not settle. */
t("D1 the ref and contents reads still throw on a non-2xx, and their 404 arms still return null",
  [(src.match(/if\s*\(res\.status === 404\) return null;/g) ?? []).length >= 2,
   /ref fetch failed/.test(src), /contents fetch failed/.test(src)], [true, true, true]);
/* ⚠ AND `deleteBranchRef` ALREADY HAD THE RIGHT POSTURE, which is why it is not in the fix. It
 * treats 404 and 422 as success because a ref that is already gone is the outcome it wanted. */
t("D2 …and deleteBranchRef still treats an already-gone ref as success, which it did before this",
  /res\.status !== 404 && res\.status !== 422/.test(src), true);

console.log(`\nerror-is-not-evidence result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
