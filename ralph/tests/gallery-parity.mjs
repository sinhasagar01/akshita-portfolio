// The gallery parity harness's SUBJECT — is there enough on the page for it to prove anything?
// Run: node --experimental-strip-types ralph/tests/gallery-parity.mjs
//
// ---- ⚠ WHY THIS SUITE IS ABOUT THE SUBJECT AND NOT ABOUT THE GEOMETRY -------------------------
//
// The geometry comparison needs a browser: two boxes, one document, measured. That is what
// `/dev/gallery-parity` is for, and it is driven by hand exactly as `/dev/parity` is.
//
// WHAT A SUITE CAN DO IS STOP THE HARNESS BEING VACUOUS. `parity` once printed `sections: 0 /
// PARITY OK` — a pass over nothing, which reads identically to a pass over everything. The gallery
// is worse placed for that than the case study was: `content/gallery` holds ONE item, so a harness
// wired to the real collection would render one overlay, no filmstrip, no arrows and a single-column
// masonry, and report parity over a page that cannot express most of the claim.
//
// ⚠ A HARNESS THAT IS TECHNICALLY NON-ZERO AND PRACTICALLY EMPTY IS THE SAME FALSE PASS WEARING A
// NUMBER. So these rows assert the FIXTURE COUNT — the half of the page that does not depend on
// what anyone has authored — and assert that the two halves of the claim are separated in prose
// where a reader will meet them.
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
const raw = readFileSync(join(root, "app/dev/gallery-parity/page.tsx"), "utf8");
const src = blankCommentBodies(raw);

console.log("\nA · the subject cannot be vacuous");
/* ⚠ FOUR IS NOT A ROUND NUMBER, IT IS THE SMALLEST SET THAT EXERCISES EVERY n>3 CLAIM. The filmstrip
 * only renders above one item, the arrows only wrap above one, and `columns: 4` has nothing to
 * balance below four. A fixture set of two would satisfy "non-zero" and prove none of them. */
const fixtures = (src.match(/^  F\(/gm) ?? []).length;
t("A1 ⚠ THE HARNESS CARRIES ITS OWN FIXTURES — it does not depend on what anyone has authored",
  fixtures >= 4, true);
t("A1a …and the count is exactly the smallest set that exercises the n>3 claims",
  fixtures, 4);
/* The three kinds must all appear or the filter has nothing to do, and the filter is what decides
   the overlay's browse order — the contract's own sentence. */
t("A2 …spanning all three kinds, so the filter has something to select",
  ["photo", "illus", "proj"].filter((k) => !new RegExp(`"${k}"`).test(src)), []);
/* ⚠ MIXED ASPECTS, because a masonry whose items share one ratio is a grid and proves nothing about
 * column balance — the property `columns` exists to have. */
t("A3 …and mixed aspects, or the masonry is a grid and proves nothing",
  new Set((src.match(/, (\d{3,4}), (\d{3,4}),/g) ?? [])).size >= 3, true);

console.log("\nB · both consumers are rendered, and they differ only in the props");
t("B1 the canvas form is rendered with staticView",
  /data-parity="canvas"[\s\S]{0,400}?staticView/.test(src), true);
t("B2 …and the public form with the props its consumer passes",
  /data-parity="public"[\s\S]{0,600}?filmstrip=\{/.test(src), true);
/* ⚠ ONE DOCUMENT, ONE WIDTH. `/dev/parity`'s header records that comparing two documents at two
 * scroll positions produced ten false positives; both boxes here are the same fixed width. */
t("B3 ⚠ AND BOTH BOXES ARE THE SAME WIDTH, or the only variable is not the flag",
  (src.match(/width: "1100px"/g) ?? []).length, 2);

console.log("\nC · the n=1 limit is stated where a reader meets it");
/* ⚠ THIS IS A PROSE ROW AND IT IS DELIBERATE. The harness will be read by someone deciding whether
 * a green run means anything, and the honest answer depends on which half they exercised. A limit
 * that lives only in a PR body is one nobody re-reads — `paint-sites`' census drift is recorded the
 * same way, in the file. */
t("C1 the harness separates what it proves at n=1 from what needs n>3",
  /AT n=1 IT PROVES/.test(raw) && /IT PROVES NOTHING ABOUT/.test(raw), true);
t("C2 …and names the real collection's size on the page, so a run cannot be misread",
  /real collection: \{real\.length\}/.test(src), true);

console.log(`\ngallery-parity result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
