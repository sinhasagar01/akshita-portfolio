// THE RECORD'S TWO SECTIONS, AND THE RULE THAT KEEPS THEM APART.
// Run: node ralph/tests/record-sections.mjs
//
// ---- ⚠ WHY THIS EXISTS ------------------------------------------------------------------------
//
// `Open items` reached 46 entries of which 35 were finished work. Nothing distinguished a closed
// finding from unfinished work, so the board could not be read — and a board that cannot be read is
// a board that gets batched, which is how a fix rides in on another fix's gates.
//
// The split is done. What this suite protects is the RULE, because the split decays the first time
// somebody files a closed finding under `Open` and nothing says so.
//
// ---- ⚠ WHAT THIS CANNOT CHECK, SAID RATHER THAN IMPLIED ---------------------------------------
//
// Whether a given entry carries an action is a JUDGEMENT. No regex settles it: "BOARDED" appears in
// entries that are closed and "CLOSED" appears inside entries that are open, because these entries
// quote their own history. A heuristic run over the 46 misclassified in BOTH directions — it put a
// live contrast defect under Recorded and a superseded item under Open — which is why the split was
// done from a reviewed list rather than a pattern.
//
// So this asserts the STRUCTURE and the STATED RULE, which are mechanical, and leaves membership to
// a person. A gate that guessed membership would be worse than none: it would be wrong quietly.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = readFileSync(join(root, "CLAUDE.md"), "utf8");

/* ⚠ AN ENTRY ENDS AT THE NEXT ENTRY **OR THE NEXT HEADING**. The proof that verified the original
 * move stopped only at the next entry, so the last entry of a section absorbed the heading after it
 * and reported a difference the file did not contain — the verifier being the defect it existed to
 * catch. Stated here because this parser is the same shape. */
const sectionEntries = (from, to) => {
  const body = src.slice(src.indexOf(from), src.indexOf(to));
  return body
    .split(/\n(?=- \*\*)/)
    .filter((p) => p.trimStart().startsWith("- **"))
    .map((p) => p.split(/\n(?=## )/)[0].trim());
};

console.log("\nA · both sections exist and both carry entries");
t("A1 the record still has an `Open items` heading", src.includes("\n## Open items\n"), true);
t("A2 …and a `Recorded` heading", src.includes("\n## Recorded\n"), true);
const open = sectionEntries("## Open items", "## Recorded");
const rec = sectionEntries("## Recorded", "## Portable conventions");
t("A3 …and both have members, so B cannot pass over an empty section",
  [open.length > 0, rec.length > 0], [true, true]);
/* ⚠ A FLOOR RATHER THAN A PINNED COUNT. Entries move between the two sections legitimately — that is
 * the whole point of the rule — so pinning either number would make ordinary bookkeeping fail. What
 * is not legitimate is a section emptying out, which would mean the split had been undone. */
t("A4 …and neither has collapsed — a pinned count would fail on ordinary bookkeeping, an empty section is the real regression",
  [open.length >= 3, rec.length >= 10], [true, true]);

console.log("\nB · each heading states its own membership rule");
/* ⚠ THIS IS THE ROW THAT MATTERS. The split does not decay because entries move; it decays because
 * the next person files a closed finding under `Open` and nothing at the heading says not to. */
const openHead = src.slice(src.indexOf("## Open items"), src.indexOf("- **"));
const recHead = src.slice(src.indexOf("## Recorded"), src.indexOf("- **", src.indexOf("## Recorded")));
t("B1 ⚠ `Open items` SAYS AN ENTRY MUST CARRY AN ACTION — without it the section degrades back to 46 entries sharing no subject",
  /CARRIES AN ACTION/i.test(openHead), true);
t("B2 ⚠ AND `Recorded` SAYS ITS ENTRIES ARE CLOSED AND KEPT FOR THEIR REASONING",
  /CLOSED FINDINGS, KEPT FOR THEIR REASONING/i.test(recHead), true);
/* ⚠ AND THE WAY BACK IS STATED, because a one-way section is an archive and an archive is where a
 * finding goes to stop being re-read. An entry that grows an action again belongs in Open. */
t("B3 …and `Recorded` states the way back, so it is a section rather than an archive",
  /Moving one back to `Open` is legitimate/i.test(recHead), true);
/* ⚠ AND IT REFUSES SUMMARISING, which is the specific decay this record is prone to: a claim that
 * ages into being false while still reading as verification. */
t("B4 …and refuses summarising, which is how a measurement gets separated from its conclusion",
  /NOT ARCHIVED, DELETED OR SUMMARISED/i.test(recHead), true);

console.log("\nC · the sections do not overlap");
/* A single entry appearing in both slices would mean the headings are out of order or one is
   missing, which A1/A2 would not catch on their own. */
const both = open.filter((o) => rec.includes(o));
t("C1 no entry is in both sections — which would mean the headings are ordered wrongly",
  both.map((b) => b.slice(0, 60)), []);

console.log(`\nrecord-sections result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
