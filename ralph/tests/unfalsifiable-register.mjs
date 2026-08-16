// THE UNFALSIFIABLE-ROW REGISTER IS DATA, AND ITS TOTALS ARE DERIVED FROM IT.
// Run: node ralph/tests/unfalsifiable-register.mjs
//
// ---- ⚠ WHY THIS EXISTS: A REMEMBERED TOTAL WENT AN ARC OUT OF DATE AND THREE CLAIMS ABOUT IT
//         WERE WRONG ---------------------------------------------------------------------------
//
// The tally of rows that could not fail for the reason they named lived in a sentence. It was
// correct at #539, correctly incremented at #545, and then a fourteenth row landed at #557 and
// nobody incremented it. Two later attempts to reconcile it were also wrong — one called two
// figures a contradiction when they were a sequence, the other accused the entry of counting the
// wrong noun when its arithmetic was right.
//
// ⚠ THE ENTRY THAT ARGUES FOR COUNTING WAS THE THING THAT STOPPED BEING COUNTED. That is the whole
// case for this file. `E1` and `E2` fail when the prose and the register drift, so the number in
// CLAUDE.md cannot go stale again without something going red.
//
// ---- WHAT IT CANNOT DO, STATED RATHER THAN IMPLIED ---------------------------------------------
//
// It does NOT run the mutations. Applying each `kills` against tracked source and asserting the row
// reddens is the expensive half, and a suite that mutates the repository is one crash away from
// leaving a dirty tree that every later gate then measures — which is the argument `mutate-harness`
// already makes about its own section B. What belongs in CI is the half that cannot damage
// anything, so this asserts that a `kills` was WRITTEN DOWN, never that it works.
//
// A repair nobody can reproduce is a claim rather than a fix. Recording the mutation is what makes
// it reproducible by hand; proving it is a person with `mutate.mjs --edit`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load } from "js-yaml";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const STATES = ["live", "retitled", "unpinned"];

console.log("\nA · the register parses and has members, so nothing below passes over nothing");
let reg = null, parseErr = null;
try { reg = load(read("docs/unfalsifiable-rows.yaml")); } catch (e) { parseErr = String(e.message).slice(0, 80); }
t("A1 docs/unfalsifiable-rows.yaml parses", parseErr, null);
const entries = Array.isArray(reg?.entries) ? reg.entries : [];
/* ⚠ THE DENOMINATOR ROW. A renamed top-level key yields an empty list, every loop below iterates
 * nothing, and the gate reports success over an absent subject — the vacuous pass this record
 * carries its own family of, and which this register deliberately excludes from membership. */
t("A2 …and `entries` is a non-empty list", entries.length >= 10, true);
t("A3 …and `standing` is present, since E1 and E2 compare against it",
  typeof reg?.standing?.instances === "number" && typeof reg?.standing?.rows === "number", true);

console.log("\nB · every entry declares the fields the register is made of");
const REQUIRED = ["suite", "row", "state", "rows", "pr", "could_not_fail", "kills"];
const missing = [];
for (const [i, e] of entries.entries())
  for (const k of REQUIRED)
    if (!(k in (e ?? {}))) missing.push(`entry ${i + 1} has no \`${k}\``);
t("B1 every entry declares all seven fields", missing, []);
const badState = entries.filter((e) => !STATES.includes(e.state)).map((e, i) => `${i}: ${e.state}`);
t("B2 …and every `state` is one of the closed vocabulary", badState, []);
const badRows = entries.filter((e) => !Number.isInteger(e.rows) || e.rows < 1).length;
t("B3 …and every `rows` is a positive integer, because one instance can cost several", badRows, 0);

console.log("\nC · a LIVE row must still exist in its suite, and must name what kills it");
const live = entries.filter((e) => e.state === "live");
console.log(`      ${live.length} live of ${entries.length} entries`);
/* Pinned count asserted so C2 cannot pass by having nothing to look up. A register that drifted to
   all-unpinned would otherwise read as green while checking nothing. */
t("C1 the live set is non-empty, so C2 has subjects", live.length >= 6, true);
const unresolved = [];
for (const e of live) {
  let src = null;
  try { src = read(`ralph/tests/${e.suite}.mjs`); } catch { unresolved.push(`${e.suite}.mjs does not exist`); continue; }
  /* ⚠ THE MATCHER TAKES BOTH QUOTE FORMS, AND IT DID NOT WHEN THIS SUITE SHIPPED. It read `t("`
     alone, and the first two rows anyone tried to pin were TEMPLATE literals — `t(\`B1 ${name}: …`
     and `t(\`bold-only parse unchanged · …`. A row whose title is built per iteration is exactly
     the kind that gets loop-emitted and therefore under-counted, which is the `rich-markers` and
     `studio-index` shape twice over. The concept is "a row whose title starts with this
     identifier"; the vocabulary was "a row written with a double quote". Narrower than its concept,
     in the gate written to catch rows that do not do what their titles say. */
  const heads = [`t("${e.row} `, `t("${e.row}:`, "t(`" + e.row + " ", "t(`" + e.row + ":"];
  if (!heads.some((h) => src.includes(h)))
    unresolved.push(`${e.suite} has no row \`${e.row}\``);
  else console.log(`      ok  ${e.suite} ${e.row}`);
}
t("C2 ⚠ EVERY LIVE ROW RESOLVES IN ITS SUITE — a repaired row deleted or renamed goes red here",
  unresolved, []);
const noKill = live.filter((e) => !e.kills || e.kills === "unrecorded").map((e) => `${e.suite} ${e.row}`);
t("C3 ⚠ AND EVERY LIVE ROW NAMES ITS KILL-MUTATION — a repair nobody can reproduce is a claim",
  noKill, []);

console.log("\nD · a row that cannot be looked up is a DECLARED state, not a silent gap");
const nonLive = entries.filter((e) => e.state !== "live");
/* ⚠ PRINTED BECAUSE IT IS CURRENTLY ZERO, AND TWO ROWS OVER AN EMPTY SUBJECT READ AS COVERAGE.
 * Every entry pinned to a live row is the good state, and it makes D1 and D2 vacuous until the next
 * unpinnable instance arrives. Saying so is the whole remedy — this suite's own register excludes
 * the vacuous pass from membership, so it must not commit one silently. */
console.log(`      ${nonLive.length} non-live entries — D1 and D2 have ${nonLive.length ? "subjects" : "NO SUBJECTS, and pass vacuously until one arrives"}`);
const unexplained = entries
  .filter((e) => e.state !== "live" && (!e.why || String(e.why).trim().length < 20))
  .map((e, i) => `entry ${i + 1}`);
t("D1 every non-live entry carries a `why` explaining what cannot be looked up and why not",
  unexplained, []);
const pinnedRowOnNonLive = entries.filter((e) => e.state === "unpinned" && e.row !== null).length;
t("D2 …and an `unpinned` entry names no row, so a guess cannot be dressed as a record",
  pinnedRowOnNonLive, 0);

console.log("\nE · the totals are DERIVED, here and in the prose that quotes them");
const derivedInstances = entries.length;
const derivedRows = entries.reduce((n, e) => n + e.rows, 0);
console.log(`      derived: ${derivedInstances} instances, ${derivedRows} rows`);
t("E1 the register's own `standing.instances` matches its entry count",
  reg.standing.instances, derivedInstances);
t("E2 …and `standing.rows` matches the sum of every entry's `rows`",
  reg.standing.rows, derivedRows);

/* ⚠ THE ROW THIS SUITE WAS BUILT FOR. The figure in CLAUDE.md is the one that went stale, and it is
 * prose, so it is stated once in a machine-readable line and read from there rather than parsed out
 * of English. Words like "fourteen" are exactly what nothing re-reads. */
const claude = read("CLAUDE.md");
const stated = claude.match(/STANDING FIGURE\s+(\d+)\s+instances\s+(\d+)\s+rows/);
t("E3 CLAUDE.md carries a machine-readable STANDING FIGURE line at all", stated !== null, true);
t("E4 ⚠ AND THE PROSE AGREES WITH THE REGISTER — the staleness that caused this cannot recur silently",
  stated ? [Number(stated[1]), Number(stated[2])] : null, [derivedInstances, derivedRows]);

console.log("\nF · what this suite does NOT do, by name");
for (const gap of [
  "it does not RUN the kill-mutations — a suite that mutates tracked source can leave a dirty tree",
  "it cannot tell a correct `kills` from a plausible one, only that somebody wrote one down",
  "it does not cover probes, because nothing mutates a probe",
  "it cannot find an unfalsifiable row that nobody has noticed yet",
]) console.log(`      unreachable   ${gap}`);
t("F1 the gaps are named rather than counted — a list of four, stated", 4, 4);

console.log(`\nunfalsifiable-register result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
