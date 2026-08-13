// Every place the type system offered to check a collection-keyed join and was told not to.
// Run: node --experimental-strip-types ralph/tests/unchecked-joins.mjs
//
// ---- ⚠ WHY THIS IS A CENSUS AND NOT AN AUDIT -------------------------------------------------
//
// Five gallery defects were found by a person at a browser, each after the previous was declared
// fixed, and every one was TWO CORRECT PARTS THAT NEVER MET. A hand audit found two more — and the
// audit's own stated limit was that there is no list of joins to be exhaustive against, so
// "I found the joins" was never a claim it could make. One finding came from a question nothing
// prompted.
//
// ⚠ BUT THAT FINDING NAMED ITS OWN ENABLER: `entry[1] as PreviewGroup`. THE JOIN WAS CHECKABLE AND
// A CAST SILENCED THE CHECK. So the list is derivable after all, at least in part — an `as` onto a
// collection-keyed type is a place someone told the compiler to stop checking exactly the thing
// that broke. That does not depend on anyone thinking of the right question.
//
// ---- ⚠ AND A CAST IS NOT A DEFECT, WHICH IS THE HALF THAT KEEPS THIS HONEST -------------------
//
// Measured across all eleven: every one is GUARDED, usually one or two lines above, by a
// `hasOwnProperty` check or a truthiness test on the lookup. The compiler cannot see the guard, so
// the cast is how the author says "I already checked". Reporting eleven defects here would be the
// wrong-noun error this repository names a dozen times.
//
// ONE WAS UNGUARDED AND IT IS THE ONE THAT SHIPPED A DEFECT. `classifyFile` cast a name straight out
// of a regex, the regex was widened to admit gallery, the union was not, and `KIND[group]` reached
// the publish dialog as `undefined`. That cast IS the check it replaced.
//
// ---- WHAT THIS SUITE DOES --------------------------------------------------------------------
//
// It pins the inventory. A NEW cast onto one of these types fails, and the way to make it pass is
// to add it here with its guard named — so each is a decision somebody wrote rather than one nobody
// noticed. Same shape as `docs/colour-boundary.yaml`: the census is derived, the exemptions are
// declared with reasons.
import { readdirSync, readFileSync } from "node:fs";
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

const walk = (rel, out = []) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const c = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(c, out);
    else if (/\.(ts|tsx)$/.test(c)) out.push(c);
  }
  return out;
};

/** The types whose members are a CLOSED SET the code branches on. A cast onto one of these asserts
 *  membership, which is exactly the claim a widened set invalidates. */
const KEYED = /\b(CollectionName|PreviewGroup|InspectorSurface|ZoomSurface|SectionBlockKind|EditableBlockKind|BlogBlockKind)\b/;

const files = [...walk("lib"), ...walk("app"), ...walk("components")];
const found = [];
for (const rel of files) {
  /* ⚠ COMMENTS BLANKED WITH THE SHARED HELPER, AND THE FIRST VERSION OF THIS CENSUS DID NOT —
   * it stripped `//` and inline blocks only, so three of its fourteen hits were the prose in
   * `publish-preview.ts` EXPLAINING the cast it had just removed. Eighth instance of
   * explaining-it-requires-writing-it, inside the census written to find unchecked joins. */
  const src = blankCommentBodies(readFileSync(join(root, rel), "utf8"));
  src.split("\n").forEach((line, i) => {
    const m = line.match(/\bas\s+([A-Z][\w<>[\]|\s]*)/);
    if (m && KEYED.test(m[1])) found.push(`${rel}:${i + 1}`);
  });
}

/**
 * The declared inventory. Each entry names WHERE THE GUARD IS, because that is the only thing that
 * makes a cast safe — and writing it down is what turns "the compiler was told not to check" into
 * "a person checked and said where".
 */
const DECLARED = {
  "lib/blog/select.ts": "guarded by `if (count)` on the next line — an unknown kind yields undefined and is skipped. MEASURED: readingTimeMinutes returns 1 rather than throwing.",
  "lib/studio/blog-format-core.ts": "guarded by a hasOwnProperty check on VALIDATORS above the lookup, the untrusted-key posture its own comment states.",
  "lib/studio/sections-format.ts": "same guard as blog-format-core. MEASURED: an unknown discriminant is refused with `unknown block kind` rather than reaching the cast.",
  "lib/studio/publish-preview.ts": "`sources[name as CollectionName]` in buildTitleIndex, where `name` comes from `Object.keys(COLLECTION_GROUPS)` — a `Record<CollectionName, true>`, so every key IS a CollectionName by construction and the cast only restates what the Record's own type guarantees. TypeScript types `Object.keys` as `string[]` and cannot carry that. MEASURED: a collection absent from `sources` is REPORTED in `missing` rather than reaching the cast as undefined — `publish-preview` I2 drives it.",
  "components/blog/BlogProse.tsx": "guarded by an explicit hasOwnProperty two lines above, and its comment says the exhaustiveness is proven at the table's declaration.",
  "components/studio/BlogBlocksEditPanel.tsx": "the discriminant comes from blocks already validated by sanitizeBlogBlocksPatch at the write boundary.",
  "components/studio/SectionsEditPanel.tsx": "same — sections reaching the editor have been through sanitizeSectionsPatch. Two of these are widening casts with a `?? kind` fallback rather than membership claims.",
};

console.log("\nA · the census is real");
t("A1 the walk found files — a zero subject is not a pass", files.length > 100, true);
t("A2 …and casts onto a keyed type exist, so the matcher is not silently matching nothing",
  found.length > 0, true);

console.log("\nB · every cast is declared, with its guard named");
const undeclared = [...new Set(found.map((f) => f.split(":")[0]))].filter((f) => !(f in DECLARED));
/* ⚠ THE ROW THAT MATTERS. A new cast onto one of these types is a new place the compiler was told
 * to stop checking a closed set — which is precisely how `classifyFile` shipped a label of
 * `undefined` to the publish dialog. Adding it here with its guard named is the whole cost. */
t("B1 ⚠ NO UNDECLARED CAST ONTO A COLLECTION-KEYED TYPE — a new one names its guard or fails here",
  undeclared, []);
/* ⚠ AND THE INVENTORY MUST NOT OUTLIVE ITS SUBJECT. A declared file whose cast has gone is a row
 * matching nothing, which this repo deletes on sight. */
t("B2 …and no declared file has stopped carrying one, or the inventory is stale",
  Object.keys(DECLARED).filter((f) => !found.some((x) => x.startsWith(f + ":"))), []);

console.log("\nC · the one that was NOT guarded is gone, and cannot come back");
{
  const preview = blankCommentBodies(readFileSync(join(root, "lib/studio/publish-preview.ts"), "utf8"));
  /* `classifyFile` cast a name straight out of the regex — the cast WAS the check. It is a
     narrowing guard now, and the union derives its collection half from `CollectionName`. */
  t("C1 ⚠ `classifyFile` NARROWS RATHER THAN CASTS — the cast was the only check there was",
    /as PreviewGroup/.test(preview), false);
  t("C2 …and it asks a guard instead", /isCollectionGroup\(entry\[1\]\)/.test(preview), true);
  /* ⚠ DERIVED, SO A SIXTH COLLECTION IS A COMPILE ERROR RATHER THAN A MISSING LABEL. Adding the
   * arm would have repaired one instance; this repairs the shape. */
  t("C3 …and the union derives its collection half rather than listing it",
    /export type PreviewGroup =\s*\n\s*\|\s*CollectionName/.test(preview), true);
  t("C4 …and the label map is a Record over it, so a new member must be named",
    /const KIND: Record<PreviewGroup, string>/.test(preview), true);
}

console.log(`\nunchecked-joins result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
