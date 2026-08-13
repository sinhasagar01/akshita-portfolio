// THE BOARD ITSELF — the one subject nothing in this repository had.
// Run: node ralph/tests/board-decay.mjs
//
// ---- ⚠ WHY THIS EXISTS -----------------------------------------------------------------------
//
// Seven `Open items` entries expired in a single session and THREE OF THEM SCOPED WORK before
// anyone re-derived them: a unit was sized from "four of nine remain", a palette change was ruled
// on for a token that already remapped, and a content item was ranked first on a schema field that
// had been deleted months earlier. Every other census here exists for a smaller subject — colours,
// keys, joins, routes. The board is what ranks the work, and nothing looked at it.
//
// ---- ⚠ THE PREDICATE BOTH PARTIES WOULD HAVE REACHED FOR CATCHES ZERO OF SEVEN ----------------
//
// "Does the symbol this entry names still exist" was measured BEFORE anything was built: 18 of 20
// entries named a path or symbol and ALL 18 still resolved. It would have printed 20/20 GREEN over
// a board carrying seven dead entries — because every expired entry named things that still exist.
// THEY EXPIRED WHEN THE WORK LANDED, NOT WHEN SOMETHING VANISHED.
//
// That is the "mostly works" failure at its limit: nought per cent effective, reporting a hundred.
// The kind of claim that CAN go false mechanically is an ABSENCE or a STRUCTURAL fact, because
// filling the gap is exactly what makes the sentence untrue.
//
// ⚠ AND THE PREDICATE WAS VALIDATED AGAINST TWO KNOWN EXPIRATIONS BEFORE THIS WAS WRITTEN, which
// is the step the existence check never got. Entry 13 claimed blog and gallery were ABSENT from
// studio search — false on `main` at the time, and this predicate flags it. Entry 18 claimed the
// `img` reset sat unlayered — `height` had been lifted into `@layer base`, and it flags that too.
// Two of two. Without that step this would have shipped as a plausible gate, which is precisely
// what the existence check was.
//
// ---- ⚠ WHAT IT CANNOT DO, AND THIS IS NOT A HEDGE ---------------------------------------------
//
// IT CANNOT TELL A TRUE ENTRY FROM A CHECKABLE ONE. The `REPLACE AS ONE COMMIT` entry says a single
// commit would have prevented none of the three reported defects; that is almost certainly right
// and has no mechanical form, because nothing here can weigh a counterfactual.
//
// SO: THIS GATE MAKES STALENESS VISIBLE FOR HALF THE BOARD AND IS SILENT ABOUT CORRECTNESS
// EVERYWHERE. An entry it verifies is an entry whose stated absence still holds — not an entry
// anybody has confirmed is right, and not one whose reasoning still applies.
//
// ---- ⚠ AND THE UNVERIFIABLE HALF IS NAMED EVERY RUN, INDIVIDUALLY ------------------------------
//
// Printing "10 verified" over a 16-entry board is the third-of-the-board report reading as
// coverage, and this record carries that shape four times. Every measurement and judgement entry
// is listed BY TITLE with the reason a machine cannot reach it.
import { readFileSync, existsSync } from "node:fs";
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

const MD = read("CLAUDE.md");
const OPEN = MD.slice(MD.indexOf("## Open items"), MD.indexOf("## Recorded"));
/* A top-level entry is a bullet at column zero. Nested bullets are part of their parent's body. */
const entries = OPEN.split(/\n(?=- \*\*)/).filter((e) => e.startsWith("- **"))
  .map((e) => ({ title: e.split("**")[1].replace(/\s+/g, " ").trim(), body: e }));
const REG = load(read("docs/board-checks.yaml"))?.entries ?? [];

console.log("\nA · the two lists bind to each other, in both directions");
t("A1 the board section was found and holds entries — an empty parse would verify nothing and pass",
  entries.length > 5, true);
t("A2 …and the registry parsed", REG.length > 5, true);
/* ⚠ BOTH DIRECTIONS, BECAUSE THIS IS A PARALLEL LIST AND THIS REPOSITORY HAS BEEN BITTEN BY EVERY
 * ONE IT HAS EVER HAD. A registry key matching nothing is a check watching a deleted entry; an
 * entry matching no key is an entry nobody classified. Neither may pass silently. */
const matchesFor = (m) => entries.filter((e) => e.body.includes(m));
t("A3 ⚠ EVERY REGISTRY KEY MATCHES EXACTLY ONE ENTRY — a rewritten title fails here rather than silently unbinding",
  REG.filter((r) => matchesFor(r.match).length !== 1).map((r) => `${r.match} → ${matchesFor(r.match).length}`), []);
const classified = new Set(REG.flatMap((r) => matchesFor(r.match).map((e) => e.title)));
t("A4 …and every board entry is classified — an unclassified entry is one nobody decided about",
  entries.filter((e) => !classified.has(e.title)).map((e) => e.title.slice(0, 60)), []);

console.log("\nB · the in-scope entries, re-derived");
const KINDS = ["absence", "structural", "measurement", "judgement"];
t("B0 every entry declares a known kind", REG.filter((r) => !KINDS.includes(r.kind)).map((r) => r.match), []);
const inScope = REG.filter((r) => r.kind === "absence" || r.kind === "structural");
/* ⚠ THE DENOMINATOR ROW. A schema change that stopped matching would empty this set, and an empty
 * set makes B2 pass over nothing — a clean board reported for a board nobody read. Fourth instance
 * of this shape in one session. */
t("B1 ⚠ THE IN-SCOPE SET IS NON-EMPTY — a gate that verifies nothing must not report a clean board",
  inScope.length >= 5, true);

const stale = [];
for (const r of inScope) {
  const h = r.holds_while ?? {};
  if (!h.file || !h.pattern || !["present", "absent"].includes(h.expect)) {
    stale.push(`${r.match}: malformed holds_while`); continue;
  }
  if (!existsSync(join(root, h.file))) { stale.push(`${r.match}: ${h.file} does not exist`); continue; }
  const found = new RegExp(h.pattern).test(read(h.file));
  const holds = h.expect === "present" ? found : !found;
  console.log(`      ${holds ? "holds  " : "STALE  "} ${r.kind.padEnd(10)} ${r.match.slice(0, 62)}`);
  if (!holds) {
    stale.push(`${r.match}: ${h.expect === "absent" ? "the absence it states is now FILLED" : "the structure it states no longer holds"} (${h.file} :: ${h.pattern})`);
  }
}
/* ⚠ THE ENTRY IS STALE, NOT THE CODE. Every failure here means somebody did the work and the board
 * still says it is open — which is the whole subject. The fix is always to close or rewrite the
 * entry, never to undo the change that made it false. */
t("B2 ⚠ EVERY IN-SCOPE ENTRY'S STATED ABSENCE OR STRUCTURE STILL HOLDS — a failure means the ENTRY is stale, not the code",
  stale, []);

console.log("\nC · what this gate cannot reach, BY NAME — never a count");
/* ⚠ NAMED INDIVIDUALLY AND NEVER SUMMARISED. "10 verified" over a 16-entry board is a third-of-the
 * -board report reading as coverage, and this record carries that shape four times. A reader of
 * this output must be able to see exactly which entries nothing checked. */
const unreachable = REG.filter((r) => r.kind === "measurement" || r.kind === "judgement");
for (const r of unreachable) {
  console.log(`      ${r.kind.padEnd(12)} ${r.match.slice(0, 60)}`);
  console.log(`                   ${(r.why ?? "").replace(/\s+/g, " ").trim().slice(0, 96)}`);
}
console.log(`\n      ${inScope.length} of ${REG.length} entries are mechanically checkable. THE OTHER ${unreachable.length} ARE NOT,`);
console.log("      and they are listed above rather than counted. This gate makes STALENESS visible");
console.log("      for half the board and is SILENT ABOUT CORRECTNESS EVERYWHERE — an entry it");
console.log("      verifies is one whose stated absence still holds, not one anybody has confirmed.");
t("C1 every unreachable entry says WHY, so the exclusion is a reason rather than a shrug",
  unreachable.filter((r) => !r.why || r.why.trim().length < 20).map((r) => r.match), []);
/* ⚠ AND THE UNREACHABLE SET MUST NOT BE EMPTY EITHER. If it ever is, either the board has become
 * uniformly mechanical — which would be remarkable and worth checking — or the classifier has
 * stopped recognising a kind. Both deserve a look; neither should read as full coverage. */
t("C2 …and the unreachable set is non-empty, or this gate is claiming coverage it has never had",
  unreachable.length > 0, true);

console.log(`\nboard-decay result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
