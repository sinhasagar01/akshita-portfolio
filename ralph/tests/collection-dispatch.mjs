// Every per-collection dispatch in the commit layer, and the bytes a create actually writes.
// Run: node --experimental-strip-types ralph/tests/collection-dispatch.mjs
//
// ---- ⚠ WHY THIS SUITE EXISTS ----------------------------------------------------------------
//
// One file held FOUR per-collection dispatches. One was a `switch` with a real `case "gallery"`
// and was correct. THREE WERE TERNARIES AND ALL THREE WERE WRONG FOR GALLERY:
//
//   createEntry            else -> projects       wrote a project-shaped file into content/gallery
//   serializeOrder         else -> experience     a reorder would rebuild to another schema
//   deleteCollectionEntry  else -> projects       a delete would enumerate a body subdir
//
// ⚠ THE SECOND AND THIRD ARE INDEPENDENT LIVE DEFECTS, NOT FALLOUT FROM THE FIRST. Neither depends
// on the create bug in any way; both were reachable and both are unhit only because the collection
// is empty. A gate that framed them as consequences would be recording one bug where there are
// three.
//
// ⚠ AND THE SWITCH IS THE EVIDENCE. Adding a collection makes a switch's gap visible AT the gap;
// a ternary's `else` absorbs the new member silently and keeps compiling. Three ternaries hid what
// one switch made obvious, in one file, under a comment claiming explicit arms.
//
// ---- ⚠ AND THE ROWS THAT MATTER ARE THE BYTES, NOT THE SHAPE ---------------------------------
//
// Section D drives a create end to end — sanitize, dispatch, serialize — and reads the YAML that
// would land on disk. That is the join every earlier gate skipped: `gallery-format` proved
// `sanitizeGalleryCreate` correctly, and the create path did not call it.
//
// ---- ⚠ WHAT THIS SUITE CAN AND CANNOT LOAD, STATED RATHER THAN WORKED AROUND ------------------
//
// `commit-collection-entry.ts` is NOT leaf-loadable: its value imports are extensionless relative
// paths, which Node's ESM cannot resolve, and adding extensions is what `tsc` refuses without
// `allowImportingTsExtensions`. Test-only exports were written to get around that and deleted —
// they moved the problem without solving it, and shipped two exports whose only caller was a suite.
//
// SO THE SPLIT IS HONEST: the SERIALIZERS are leaf-loadable and are driven for real, which is where
// the bytes come from and where the defect landed. The DISPATCH TABLES are read as source, which is
// a weaker instrument and is said so here — their real guard is the `Record<CollectionName, …>`
// type, which fails the BUILD on a missing member and does not need a suite to notice.
import { readFileSync } from "node:fs";
import { blankCommentBodies } from "../strip-comments.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load } from "js-yaml";
import {
  serializeGalleryOrder,
  serializeGalleryEntry,
  serializeNewGalleryEntry,
} from "../../lib/studio/gallery-serialize.ts";
import { sanitizeGalleryCreate, GALLERY_KINDS } from "../../lib/studio/gallery-format.ts";

/* ⚠ COMMENT BODIES ARE BLANKED, AND THIS SUITE IS THE EIGHTH INSTANCE OF WHY. `A5` asserts three
   ternaries are GONE from that file — and the comments explaining each removal QUOTE the ternary
   they removed, so two of the three rows failed against prose describing their own success. One
   unit after the same defect was fixed in `cascade-public`, by the same hand, in a new suite.
   That is the argument for the shared mechanism over the rule, made by the rule failing again. */
const commit = blankCommentBodies(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "lib/studio/commit-collection-entry.ts"),
    "utf8"
  )
);
/** The rows of a `Record<CollectionName, …>` literal, by name. Weak by construction — see above. */
const rowsOf = (declaration) => {
  const i = commit.indexOf(declaration);
  if (i === -1) return null;
  const body = commit.slice(i, commit.indexOf("\n};", i));
  return [...body.matchAll(/^\s{2}([a-z]+):/gm)].map((m) => m[1]).sort();
};

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const COLLECTIONS = ["experience", "projects", "blog", "gallery"];

console.log("\nA · every registry names every collection — the property a ternary cannot have");
/* ⚠ A LITERAL DENOMINATOR. A registry that lost a member would otherwise agree with a COLLECTIONS
 * list that lost the same one, and both would pass. */
t("A0 there are four collections — against a literal, not against another list",
  COLLECTIONS.length, 4);
const createRows = rowsOf("const CREATE_SPECS: Record<CollectionName, CreateSpec> = {");
const diskRows = rowsOf('const ENTRY_ON_DISK: Record<CollectionName, "flat-file" | "directory"> = {');
const orderRows = rowsOf("const ORDER_SERIALIZERS: Record<CollectionName,");
t("A0a all three tables were located — a null makes every row below vacuous",
  [createRows, diskRows, orderRows].filter((r) => r === null), []);
t("A1 the create table names every collection", createRows, [...COLLECTIONS].sort());
t("A2 the on-disk table names every collection", diskRows, [...COLLECTIONS].sort());
t("A3 the order table names every collection, including the one that REFUSES",
  orderRows, [...COLLECTIONS].sort());
/* ⚠ A REFUSAL IS AN ANSWER AND MUST BE WRITTEN DOWN. Blog carries no orderIndex; to a ternary an
 * absent row and a refusing row are the same thing, and to a reader they are opposites. */
t("A4 …and blog's order answer is an explicit null rather than an absent row",
  /^\s{2}blog: null,/m.test(commit), true);
/* The three ternaries are gone. Named individually, because "no ternary anywhere" would be a claim
   about the whole file and would go red for reasons that have nothing to do with this. */
t("A5 ⚠ AND NONE OF THE THREE TERNARIES SURVIVES — the shapes that hid gallery three times",
  [/collection === "projects"\s*\n?\s*\?/.test(commit),
   /collection === "experience" \|\| collection === "blog"/.test(commit),
   /} else \{\n\s*const sanitized = sanitizeProjectCreate/.test(commit)],
  [false, false, false]);
/* ⚠ WHICH SERIALIZER EACH CREATE ROW NAMES — AND THIS ROW EXISTS BECAUSE A MUTATION SURVIVED
 * WITHOUT IT. Pointing gallery's row at the projects serializer reinstates the exact 404, and every
 * row in section D stayed green: those call the serializer DIRECTLY, so they never touch the table
 * that chooses it.
 *
 * ⚠ THAT IS THE ORIGINAL DEFECT COMMITTED INSIDE THE SUITE WRITTEN TO CATCH IT. `gallery-format`
 * proved a sanitizer the create path did not call; section D proved a serializer the dispatch did
 * not have to choose. A gate on a component proves nothing about a flow that does not call it, and
 * the flow here is the table.
 *
 * IT IS A SOURCE READ AND THAT IS A STATED LIMIT, NOT A PREFERENCE. `commit-collection-entry.ts` is
 * not leaf-loadable, and neither is `blog-format`, so the table cannot be imported and called. What
 * this asserts is the LINK — row names function — while section D asserts what that function
 * WRITES. Together they cover the join; neither alone does. */
t("A7 ⚠ EACH CREATE ROW NAMES ITS OWN COLLECTION'S SERIALIZER — the link the 404 broke",
  (() => {
    const i = commit.indexOf("const CREATE_SPECS: Record<CollectionName, CreateSpec> = {");
    const body = commit.slice(i, commit.indexOf("\n};", i));
    const out = {};
    for (const m of body.matchAll(/^\s{2}([a-z]+): \{[\s\S]*?bytes: \([^)]*\) =>\s*(\w+)/gm)) out[m[1]] = m[2];
    return out;
  })(),
  {
    experience: "serializeExperienceCreate",
    projects: "serializeNewProject",
    blog: "serializeNewBlogPost",
    gallery: "serializeNewGalleryEntry",
  });

/* ⚠ AND THE ONE THAT WAS ALREADY CORRECT IS ASSERTED TO STILL BE. `editEntry`'s switch is the
 * evidence for this whole PR: it named gallery from the day gallery existed. */
t("A6 …while editEntry's switch still names gallery, which is why it was never wrong",
  /switch \(collection\) \{[\s\S]*?case "gallery":/.test(commit), true);

console.log("\nB · the on-disk shape is a PROPERTY, not a list of names");
/* The delete branched on "is it experience or blog", so gallery joined the directory walk by
 * default. The discriminator is what the entry IS on disk. */
t("B1 gallery is a flat file — one yaml, no body subdirectory to enumerate",
  /^\s{2}gallery: "flat-file",/m.test(commit), true);
t("B2 …and the delete branches on that property rather than on a name list",
  /ENTRY_ON_DISK\[collection\] === "flat-file"/.test(commit), true);

console.log("\nC · the order serializer round-trips rather than rebuilding to another schema");
{
  const raw = "title: Low tide\nkind: photo\nimage: /images/gallery/a.webp\nwidth: 1600\nheight: 2000\nalt: A beach\ndescription: ''\ntags: []\ncaseStudy: ''\norderIndex: 0\n";
  const moved = serializeGalleryOrder(raw, 3);
  t("C0 the fixture round-trips unchanged — a fixture the serializer cannot read makes C1 vacuous",
    serializeGalleryEntry(raw, {}).bytes, raw);
  t("C1 a reorder writes the new position", moved.ok && load(moved.bytes).orderIndex, 3);
  /* ⚠ THE ROW THE OLD TERNARY WOULD HAVE FAILED. Sent through the experience serializer, this file
   * came back rebuilt to another collection's key order and fields. Only `orderIndex` may move. */
  t("C2 ⚠ AND NOTHING ELSE MOVES — the defect was a reorder rebuilding to another schema",
    (() => {
      const before = load(raw), after = load(moved.bytes);
      return Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
    })(), ["orderIndex"]);
  t("C3 …and the key order survives, so a reorder is a one-line diff",
    moved.ok && Object.keys(load(moved.bytes)), Object.keys(load(raw)));
}

console.log("\nD · the create, driven END TO END — the join no earlier gate tested");
/* ⚠ THIS IS THE SECTION THAT WOULD HAVE CAUGHT THE 404. `gallery-format` proved
 * `sanitizeGalleryCreate` and the create path did not call it; the bytes came from
 * `sanitizeProjectCreate` through a fallthrough. A gate on a component proves nothing about a flow
 * that does not call it, so these rows call the flow. */
{
  /* ⚠ THE SANITIZER AND THE SERIALIZER, CHAINED — which is the join, and the join is what was
   * missing. `gallery-format` proved this sanitizer and the create path did not call it; the bytes
   * came from `sanitizeProjectCreate` through a fallthrough. Here the output of one is the input of
   * the other, so a shape mismatch between them cannot pass. */
  const g = sanitizeGalleryCreate({ title: "Low tide" });
  t("D0 the create sanitizer returns `value`, the shape the other three return",
    g.ok && "value" in g, true);
  const built = g.ok ? serializeNewGalleryEntry(g.value, 1) : null;
  t("D1 …and its value serializes without a second sanitize step", built?.ok, true);
  const doc = built && built.ok ? load(built.bytes) : null;

  /* ⚠ THE EXACT SHAPE OF THE BUG, ASSERTED. A project stub carries `summary`, `facts` and `body`,
   * and the Keystatic gallery schema refuses every one of them — which is what threw, degraded the
   * whole draft overlay and produced the 404. */
  t("D2 ⚠ A GALLERY CREATE WRITES NO PROJECT KEYS — summary, facts and body are what threw",
    ["summary", "facts", "body"].filter((k) => doc && k in doc), []);
  t("D3 …and it writes exactly the gallery schema's keys, in the declared order",
    doc && Object.keys(doc),
    ["title", "kind", "image", "width", "height", "alt", "description", "tags", "caseStudy", "orderIndex"]);
  /* The publish gate reads FIELDS, so an absent key and a zero are the same defect in different
     clothes — and only one of them is visible to a reader of the file. */
  t("D4 …with the machine-written dimensions present as zeros rather than absent",
    doc && [doc.width, doc.height], [0, 0]);
  t("D5 …and an empty kind, which is a value the enum accepts before an author chooses",
    doc && doc.kind === "" && !GALLERY_KINDS.includes(doc.kind), true);
  t("D6 …and the order it was assigned", doc && doc.orderIndex, 1);

  /* ⚠ THE ROUND TRIP CLOSES IT. A created file must be readable by the EDIT path, or the first save
   * after a create refuses. This is the join on the other side. */
  t("D7 ⚠ AND THE CREATED FILE IS READABLE BY THE EDIT PATH — the first save must not refuse",
    built && built.ok ? serializeGalleryEntry(built.bytes, { alt: "A beach" }).ok : false, true);
  t("D7a …and that first edit moves only the field it names",
    (() => {
      if (!built || !built.ok) return null;
      const after = load(serializeGalleryEntry(built.bytes, { alt: "A beach" }).bytes);
      return Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(doc[k]));
    })(), ["alt"]);
}

console.log(`\ncollection-dispatch result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
