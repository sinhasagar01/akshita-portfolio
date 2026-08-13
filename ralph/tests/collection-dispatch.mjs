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
import {
  sanitizeGalleryCreate,
  sanitizeGalleryPatch,
  GALLERY_KINDS,
  GALLERY_SCHEMA_KEYS,
  validateGalleryEntry,
} from "../../lib/studio/gallery-format.ts";
import config from "../../keystatic.config.ts";

/** One acceptable value per field, so G4 can ask the sanitizer about each key on its own terms. */
const SAMPLES = {
  title: "T", kind: "photo", image: "/images/gallery/a.webp", width: 1600, height: 2000,
  alt: "A", description: "D", tags: ["x"], caseStudy: "boat-crest", orderIndex: 1,
};

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
const createLinks = (() => {
  const i = commit.indexOf("const CREATE_SPECS: Record<CollectionName, CreateSpec> = {");
  const body = commit.slice(i, commit.indexOf("\n};", i));
  const out = {};
  for (const m of body.matchAll(/^\s{2}([a-z]+): \{([\s\S]*?)\n\s{2}\},/gm)) {
    out[m[1]] = {
      sanitize: (m[2].match(/sanitize:\s*(\w+)/) ?? [])[1] ?? null,
      bytes: (m[2].match(/bytes: \([^)]*\) =>\s*(\w+)/) ?? [])[1] ?? null,
    };
  }
  return out;
})();
/* ⚠ BOTH LINKS PER ROW, AND THE FIRST VERSION ASSERTED ONLY THE SERIALIZER — a gap found by a
 * census of this exact shape and then CONFIRMED BY MUTATION: pointing gallery's `sanitize` at
 * `sanitizeProjectCreate` left this suite 24 of 24 green. A row carries two links and a check on
 * one of them proves half a join. */
t("A7 ⚠ EACH CREATE ROW NAMES ITS OWN COLLECTION'S SANITIZER AND SERIALIZER — both links, not one",
  createLinks,
  {
    experience: { sanitize: "sanitizeExperienceCreate", bytes: "serializeExperienceCreate" },
    projects: { sanitize: "sanitizeProjectCreate", bytes: "serializeNewProject" },
    blog: { sanitize: "sanitizeBlogCreate", bytes: "serializeNewBlogPost" },
    gallery: { sanitize: "sanitizeGalleryCreate", bytes: "serializeNewGalleryEntry" },
  });

/* ⚠ THE ORDER TABLE'S LINKS, FOR THE SAME REASON AND FOUND THE SAME WAY. `A3` asserted the table
 * NAMES every collection and `C2` asserted the round-trip through the serializer directly — so
 * pointing gallery's row at `serializeExperienceOrder`, which is the precise shipped defect, also
 * left this suite fully green. Naming a member is not the same claim as naming its target. */
t("A7a …and each order row names its own collection's order serializer",
  (() => {
    const i = commit.indexOf("const ORDER_SERIALIZERS: Record<CollectionName,");
    const body = commit.slice(i, commit.indexOf("\n};", i));
    const out = {};
    for (const m of body.matchAll(/^\s{2}([a-z]+):\s*([A-Za-z_$][\w$]*),/gm)) out[m[1]] = m[2];
    return out;
  })(),
  {
    projects: "serializeProjectOrder",
    experience: "serializeExperienceOrder",
    gallery: "serializeGalleryOrder",
    blog: "null",
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

console.log("\nE · the PUBLISH loop is exhaustive — the branch that let gallery through");
/* ⚠ THE DEFECT WAS THE CATCH-ALL, NOT A MISSING ARM. The loop ran two `if`s — projects, then blog —
 * and then a branch matching any other content yaml, which applied a placeholder scan and ACCEPTED
 * the file. Gallery did not slip through a gap; it landed in the branch designed to accept the
 * unrecognised, and four project-shaped entries took the production build down site-wide.
 *
 * A THIRD `if` WOULD HAVE REPAIRED ONE INSTANCE OF A SHAPE THAT REPEATS. These rows assert the
 * `Record` instead, so a fifth collection is a compile error rather than a production one. */
{
  const pub = blankCommentBodies(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "lib/studio/publish-site-settings.ts"), "utf8")
  );
  const checkRows = (() => {
    const i = pub.indexOf("const COLLECTION_PUBLISH_CHECKS: Record<CollectionName, PublishCheck> = {");
    if (i === -1) return null;
    const body = pub.slice(i, pub.indexOf("\n};", i));
    return [...body.matchAll(/^\s{2}([a-z]+):/gm)].map((m) => m[1]).sort();
  })();
  t("E0 the publish-check table was located — a null makes every row below vacuous",
    checkRows !== null, true);
  t("E1 ⚠ EVERY COLLECTION HAS A PUBLISH CHECK — the property the catch-all could not have",
    checkRows, [...COLLECTIONS].sort());
  /* ⚠ THE WIRING IS A SOURCE ROW AND IT IS THE WEAK HALF — SECTION F CALLS THE FUNCTION. A mutation
   * replacing the whole gallery arm with a pass-through left an earlier version of this row green,
   * because the orphaned body still contained the call it was grepping for. Presence is not
   * reachability; this asserts only that the loop delegates to the leaf. */
  t("E2 ⚠ AND GALLERY'S ARM DELEGATES TO THE LEAF, which section F then calls for real",
    /gallery: \(slug, raw\) => validateGalleryEntry\(slug, raw\)/.test(pub), true);
  t("E2a …imported rather than reimplemented, so the publish gate and the editor share one rule",
    /import \{ validateGalleryEntry \} from "\.\/gallery-format"/.test(pub), true);
  /* ⚠ EXPERIENCE IS AN EXPLICIT PASS, NOT AN ABSENT ROW. E1 would be satisfied by either; this is
   * what makes "no per-entry check" a decision somebody wrote rather than one nobody noticed. */
  t("E4 …and experience says explicitly that it needs no per-entry check",
    /experience: \(\) => \(\{ ok: true \}\)/.test(pub), true);
  /* The placeholder branch survives for the singletons — it is no longer the branch a COLLECTION
     can fall into, which is the whole change. */
  t("E5 the any-other-yaml branch remains for the singletons it was written for",
    /\^content\\\/\.\+\\\.yaml\$/.test(pub) && /hasPlaceholder\(otherRaw\)/.test(pub), true);
}

console.log("\nF · the publish gate, CALLED — the rows that would have stopped the incident");
/* ⚠ NOTHING HERE READS SOURCE. Section E asserts the loop delegates; these call the function with
 * the exact bytes that reached main and read the exact refusal an author would see. */
{
  const projectShaped = "title: High Tide\nsummary: ''\norderIndex: 3\nfacts:\n  role: ''\nbody: []\n";
  const bad = validateGalleryEntry("high-tide", projectShaped);
  t("F1 ⚠ THE FILE THAT TOOK THE BUILD DOWN IS REFUSED AT PUBLISH", bad.ok, false);
  /* ⚠ AND IT NAMES EVERY OFFENDING KEY. The build's own error names ONE — `summary` — which is how
   * a red build becomes a hunt through five files for which one is wrong. */
  t("F1a …naming every key the schema does not declare, where the build names only the first",
    !bad.ok && ["summary", "facts", "body"].filter((k) => !bad.error.message.includes(k)), []);
  t("F1b …and the file, so an author knows which one to open",
    !bad.ok && bad.error.field, "content/gallery/high-tide.yaml");

  /* ⚠ `waves.yaml` IS REFUSED TOO AND THAT IS CORRECT, NOT SOFTENED. It is the owner's real item and
   * its upload never completed, so the masonry cannot place a tile for it. The remedy is to upload
   * the image; admitting it would ship a layout shift. */
  const waves = "title: Waves\nkind: photo\nimage: null\nwidth: 0\nheight: 0\nalt: Sea Waves\ndescription: Sea Waves - Morning\ntags:\n  - 35mm\ncaseStudy: ''\norderIndex: 4\n";
  const w = validateGalleryEntry("waves", waves);
  t("F2 ⚠ AN ITEM WHOSE UPLOAD NEVER FINISHED IS REFUSED — schema-valid is not publish-ready",
    w.ok, false);
  t("F2a …with both reasons, each naming an action",
    !w.ok && [w.error.message.includes("no image uploaded"), w.error.message.includes("re-upload")],
    [true, true]);

  /* THE COMPLETE ITEM PASSES — without this every row above could be satisfied by a gate that
     refuses everything, which is the empty-subject shape one direction over. */
  const good = waves.replace("image: null", "image: /images/gallery/a.webp")
    .replace("width: 0", "width: 1600").replace("height: 0", "height: 2000");
  t("F3 …and a complete item passes, so F1 and F2 are not a gate that refuses everything",
    validateGalleryEntry("waves", good).ok, true);
  t("F4 an entry that is not valid YAML is a refusal naming the file, never a throw",
    (() => { const r = validateGalleryEntry("x", "title: [unclosed"); return r.ok === false && r.error.field; })(),
    "content/gallery/x.yaml");
}

console.log("\nG · the schema and the key list, BOTH DIRECTIONS");
/* ⚠ DERIVATION WAS TRIED FIRST AND IS BLOCKED BY THE LEAF DISCIPLINE — measured, not assumed.
 * `Object.keys(config.collections.gallery.schema)` enumerates cleanly and in declaration order, so
 * the schema CAN be the source. What it cannot be is the source AT RUNTIME: `gallery-format.ts` is
 * a leaf, a leaf may only value-import packages, and the config is reachable only through an alias
 * (`@/keystatic.config`) or an extensionless relative path — the first is invisible to Node, the
 * second to `tsc` without `allowImportingTsExtensions`.
 *
 * SO THE COMPARISON IS A CONSIDERED SECOND-BEST WITH ITS REASON RECORDED, not a default. The unit's
 * real result is the count: SIX parallel key lists became FOUR. The serializer's copy was folded
 * into the sanitizer's, and `mapGalleryItem` moved into the leaf so the publish gate stopped
 * carrying its own `readEntry`.
 *
 * ⚠ AND BOTH DIRECTIONS ARE ASSERTED, BECAUSE THEY ARE DIFFERENT DEFECTS. A key in the schema and
 * not the list is SILENTLY DROPPED on save — the author types it, the serializer's rebuild omits
 * it, and nothing says so. A key in the list and not the schema is the RED BUILD that just
 * happened. One check catches one of them. */
{
  const schemaKeys = Object.keys(config.collections.gallery.schema);
  t("G0 the schema enumerates — a zero here makes both directions vacuous",
    schemaKeys.length, 10);
  t("G1 ⚠ EVERY SCHEMA KEY IS IN THE LIST — one missing is a field silently dropped on save",
    schemaKeys.filter((k) => !GALLERY_SCHEMA_KEYS.includes(k)), []);
  t("G2 ⚠ EVERY LISTED KEY IS IN THE SCHEMA — one extra is the red build this arc just fixed",
    GALLERY_SCHEMA_KEYS.filter((k) => !schemaKeys.includes(k)), []);
  /* ⚠ ORDER, NOT JUST MEMBERSHIP. The list exists to make a save's bytes stable; two sets can agree
   * while the rebuild reorders every key and turns a one-field edit into a whole-file diff. */
  t("G3 …and in the same ORDER, which is what makes a one-field save a one-line diff",
    [...GALLERY_SCHEMA_KEYS], schemaKeys);
  /* The sanitizer's arms are per-key TYPE logic and cannot be derived from names — that is the
     fourth list, and it is irreducible rather than unnoticed. This asserts it covers the same set. */
  t("G4 …and the sanitizer accepts exactly those keys, no more and no fewer",
    (() => {
      const accepted = schemaKeys.filter((k) => sanitizeGalleryPatch({ [k]: SAMPLES[k] }).ok);
      return schemaKeys.filter((k) => !accepted.includes(k));
    })(), []);
  t("G4a …and refuses one that is not in the schema, which is how the bad files got in",
    sanitizeGalleryPatch({ summary: "" }).ok, false);
  /* ⚠ THE FORCED COPY IN THE SERIALIZER, COMPARED. It cannot import the list — a leaf may
   * value-import packages only, and both files must stay loadable — so the array is duplicated and
   * this is what makes the duplication safe rather than a promise. Read as source because that is
   * the only way to see a `const` a module does not export. */
  t("G5 ⚠ THE SERIALIZER'S FORCED COPY MATCHES, IN MEMBERSHIP AND ORDER",
    (() => {
      const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "lib/studio/gallery-serialize.ts"), "utf8");
      const i = src.indexOf("const GALLERY_KEYS = [");
      if (i === -1) return null;
      return [...src.slice(i, src.indexOf("] as const;", i)).matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]);
    })(),
    [...GALLERY_SCHEMA_KEYS]);
}

console.log("\nH · every gallery image surface resolves a DRAFT path, and none uses the optimizer");
/* ⚠ THE REPORTED DEFECT WAS "THE UPLOADED IMAGE DOES NOT APPEAR UNTIL REFRESH", AND IT WAS TWO
 * FAILURES BEHIND ONE BLANK FRAME. The rail and index passed a RAW draft path to `next/image`,
 * which 404s until publish. The canvas held an object URL and passed THAT to `next/image`, which
 * cannot fetch a `blob:` at all. Neither could work, and the two looked like one intermittent bug.
 *
 * ⚠ AND THE OPTIMIZER IS THE HALF A READER WILL MISS. `ImageThumb`'s header states it: `next/image`
 * refetches from the server WITHOUT the owner cookie, so even a correctly proxied path 401s. So
 * every row here checks BOTH — the src is resolved, and the optimizer is off — because either alone
 * still renders nothing. */
{
  const SURFACES = [
    ["components/studio/GalleryItemList.tsx", "rail"],
    ["components/studio/GalleryIndex.tsx", "index"],
  ];
  t("H0 both thumbnail surfaces were located — an empty set is not a pass", SURFACES.length, 2);
  for (const [file, name] of SURFACES) {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", file), "utf8");
    t(`H1 ${name}: the src goes through the draft proxy, not the raw path`,
      /src=\{draftImageUrl\(item\.image\)\}/.test(blankCommentBodies(src)), true);
    /* ⚠ A PLAIN `<img>`, ASSERTED AS THE ABSENCE OF THE OTHER. `next/image` with a proxied src is
     * the 401, so this is not a style preference — it is the same claim as H1 from the other side. */
    t(`H1a ${name}: …and renders a plain <img>, because the optimizer drops the owner cookie`,
      /<Image\b/.test(blankCommentBodies(src)), false);
  }

  const panel = blankCommentBodies(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components/studio/GalleryEditPanel.tsx"), "utf8"));
  /* The canvas keeps the object URL FIRST — it is the only thing that resolves bytes the browser
     already holds — and falls back to the proxy, which resolves draft and main. */
  t("H2 canvas: the session's object URL first, then the proxy — never a raw path",
    /shot\.preview \?\? \(shot\.src \? draftImageUrl\(shot\.src\) : null\)/.test(panel), true);
  t("H2a …and it tells the overlay to skip the optimizer, which can fetch neither of those",
    /unoptimizedImage/.test(panel), true);

  const overlay = blankCommentBodies(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components/gallery/GalleryOverlay.tsx"), "utf8"));
  /* ⚠ AND THE PUBLIC PAGE MUST NOT INHERIT IT. The default is the whole point: a published image
   * keeps the optimizer, its `sizes` ladder and its static path. A prop that defaulted the other
   * way would fix the studio by making every visitor download an unoptimized original. */
  t("H3 the overlay's prop DEFAULTS OFF, so the public page keeps the optimizer",
    /unoptimizedImage = false/.test(overlay), true);
  t("H3a …and the public page passes nothing, so it takes that default",
    /unoptimizedImage/.test(blankCommentBodies(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components/gallery/GalleryLightbox.tsx"), "utf8"))), false);
}

console.log(`\ncollection-dispatch result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
