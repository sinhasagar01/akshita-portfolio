// Which uploaded block images nothing points at — and which of those a name-keyed delete would
// destroy a live file to remove.
// Run: node ralph/tests/image-orphans.mjs
//
// ---- ⚠ THIS IS A CENSUS AND NOT A GC, AND THE DIFFERENCE IS DELIBERATE ------------------------
//
// Deleting is destructive and irreversible in a way nothing here should do on its own. What this
// establishes is the PRECONDITION a GC needs and does not have: the reachability rule, keyed on the
// full path, with the population it walked declared.
//
// ---- ⚠ THE HAZARD THIS EXISTS TO MAKE VISIBLE --------------------------------------------------
//
// `blockImageHash` is sha256 of the normalized bytes and the filename is its first twelve hex
// digits, so identical bytes get an identical NAME under different paths. Measured here, two pairs:
//
//     926214f008d6   gallery/akshita  and  a blog post
//     edaa53ebfee8   gallery/akshita  and  gallery/waves
//
// The record knew about the first. The second is within ONE collection and nobody had looked. A GC
// matching on hashes would "collect" one and delete the other's copy.
//
// ---- ⚠ AND THE WALK'S BOUNDARY IS THE OTHER HALF ----------------------------------------------
//
// A `content/`-only walk finds 20 live paths. Two more are referenced from `app/dev` harness pages,
// so a GC scoped to content would delete two files something loads. Section A declares what was
// walked and asserts each part found something, because a walk that silently reaches nothing turns
// every live file into an orphan — the most dangerous possible false positive for this subject.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blockImageReachability } from "../../lib/studio/image-reachability.ts";
/* ⚠ THE WALK IS SHARED WITH THE COLLECTOR RATHER THAN COPIED. If this census and
 * `ralph/collect-images.mjs` ever disagreed about where a reference can live, the collector
 * would delete a file this census calls live — and this census would go on passing, because it
 * never sees what was deleted. Every assertion below is unchanged and still runs on the walk it
 * always ran on; only the definition moved. */
import { REFERENCE_DIRS, referencesByDir, blockImagesOnDisk, walkFiles } from "../image-walk.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

console.log("\nA · the walk, declared — because a walk that reaches nothing makes every file an orphan");
const perDir = referencesByDir(root);
for (const p of perDir) console.log(`      ${p.dir.padEnd(11)} ${String(p.paths.length).padStart(3)} path(s)   ${p.why}`);
t("A1 every declared part of the walk is real — a missing directory would silently orphan its files",
  perDir.filter((p) => !existsSync(join(root, p.dir))).map((p) => p.dir), []);
/* ⚠ NOT EVERY DIRECTORY MUST CARRY REFERENCES, but the walk as a whole must, or the orphan list is
 * the entire population and a GC reading it would delete everything. */
t("A2 …and the walk as a whole found references, so the orphan list is not simply everything",
  perDir.reduce((n, p) => n + p.paths.length, 0) > 10, true);
/* ⚠ THE `app` PART IS ASSERTED SEPARATELY BECAUSE IT IS THE ONE A NARROWER WALK WOULD HAVE MISSED.
 * A content-only census finds 20 of the live paths; `app/dev` carries the other two. If this ever
 * reaches zero, either the harness pages changed or the matcher did — and both are worth a look
 * before anything is deleted. */
t("A3 …and `app` carries references a content-only walk would have missed, which is why it is in the set",
  perDir.find((p) => p.dir === "app").paths.length > 0, true);

console.log("\nB · reachability, keyed on the PATH");
const onDisk = blockImagesOnDisk(root);
const referenced = [...new Set(perDir.flatMap((p) => p.paths))];
const result = blockImageReachability({ onDisk, referenced });
console.log(`      ${onDisk.length} on disk   ·   ${result.liveCount} live   ·   ${result.orphans.length} orphaned`);
t("B1 the on-disk population is real, so B2 and C are not ruling on an empty set", onDisk.length > 10, true);
t("B2 …and every referenced path resolves to a file that exists — a reference to nothing is a broken image",
  referenced.filter((p) => !existsSync(join(root, "public", p))), []);

console.log("\nC · the orphans, and which of them a name-keyed delete would take a live file to remove");
for (const o of result.orphans) {
  const unsafe = result.unsafeToDeleteByName.includes(o);
  console.log(`      ${unsafe ? "⚠ SHARED NAME" : "orphan       "}  ${o}`);
}
if (result.unsafeToDeleteByName.length) {
  console.log("\n      ⚠ THE MARKED FILES SHARE A BASENAME WITH A LIVE FILE. The basename IS the hash");
  console.log("        prefix, so identical bytes get identical names under different paths — by");
  console.log("        design, because re-uploading an image is idempotent. A GC keyed on the hash");
  console.log("        would collect one of these and DELETE THE LIVE COPY.");
}
/* ⚠ EVERY SHARED BASENAME IN THE WHOLE POPULATION, live or not — because `unsafeToDeleteByName`
 * only sees pairs where ONE side is live, and a pair where BOTH are orphaned is safe by LUCK rather
 * than by rule. If either copy is later referenced, the other becomes unsafe with no edit anywhere
 * near it. Printing both pairs is what makes that visible before it matters. */
{
  const byName = new Map();
  for (const p of onDisk) {
    const n = p.slice(p.lastIndexOf("/") + 1);
    byName.set(n, [...(byName.get(n) ?? []), p]);
  }
  const pairs = [...byName].filter(([, ps]) => ps.length > 1);
  console.log(`\n      ${pairs.length} basename(s) shared across paths — identical bytes, by design:`);
  for (const [n, ps] of pairs) {
    for (const p of ps) console.log(`        ${referenced.includes(p) ? "LIVE    " : "orphaned"}  ${p}`);
    console.log(`        └─ ${n}: ${ps.every((p) => !referenced.includes(p)) ? "both orphaned — safe by LUCK; referencing either makes the other unsafe" : "one side is LIVE — a name-keyed delete destroys it"}`);
  }
  t("C0 shared basenames exist at all, so C2 and C3 are ruling on a real population",
    pairs.length > 0, true);
}

/* ⚠ THIS IS A REPORT, NOT A REFUSAL. An orphan is not a defect — it is a replaced image whose bytes
 * stopped being referenced, which content addressing makes free to leave. Failing on a count would
 * redden main every time somebody replaces a picture. */
t("C1 the orphan set was computed by PATH — no orphan is also a referenced path",
  result.orphans.filter((o) => referenced.includes(o)), []);
/* ⚠ AND THE ROW THAT MATTERS: the shared-name population is REPORTED rather than assumed empty. It
 * is asserted to be a subset of the orphans, so the field cannot quietly start meaning something
 * else — the `count:`-field defect, where a value nothing reads drifts while looking authoritative. */
t("C2 ⚠ EVERY SHARED-NAME ENTRY IS AN ORPHAN — the field is a subset of the list it warns about",
  result.unsafeToDeleteByName.filter((p) => !result.orphans.includes(p)), []);
/* ⚠ AND THE HAZARD IS PROVEN TO BE REAL RATHER THAN HYPOTHETICAL. If this ever returns zero the
 * warning above is describing something that cannot happen, and a warning nobody can trigger is one
 * the next author deletes. Today it is 1: `926214f008d6` in gallery/akshita, whose bytes are live
 * under a blog post's path. */
t("C3 …and the hazard has at least one live instance, so the warning is not describing an empty set",
  result.unsafeToDeleteByName.length > 0, true);

console.log(`\nimage-orphans result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
