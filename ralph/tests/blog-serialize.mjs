// BS-3b — the blog write seam's round-trip gate.
// Run: node --experimental-strip-types ralph/tests/blog-serialize.mjs
//
// THIS IS THE GATE FOR PR 3b, and the public-DOM check is not. With one post that
// nothing edits during a build, the rendered HTML is byte-identical whether the
// serializer is correct or catastrophically broken — so the only thing that can SEE a
// serializer bug is a round-trip against the real file. That is what this is.
//
// Everything below runs against the REAL content file, not a fixture, for the same
// reason collection-image-paths asserts a real on-disk blob: a synthetic input can be
// wrong in the same direction as the code.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load, dump } from "js-yaml";
import {
  serializeBlogEntry,
  serializeBlogBlocks,
  serializeNewBlogPost,
  readBlogBlocks,
} from "../../lib/studio/blog-serialize.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const POST = path.join(root, "content/blog/what-a-data-table-teaches-you-about-trust.yaml");
const raw = readFileSync(POST, "utf8");

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
/** The 1-indexed lines that differ between two strings. */
const changedLines = (a, b) => {
  const A = a.split("\n"), B = b.split("\n"), out = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) out.push(i + 1);
  return out;
};
const bytes = (r) => (r.ok ? r.bytes : `ERROR:${r.error.code}`);

/* ---------------------------------------------- A. no-op identity (the core property) */
t("A1 serializeBlogEntry with an empty patch is BYTE-IDENTICAL", bytes(serializeBlogEntry(raw, {})), raw);
t("A2 serializeBlogBlocks with the file's own blocks is BYTE-IDENTICAL",
  bytes(serializeBlogBlocks(raw, readBlogBlocks(raw))), raw);

/* ---------------------------------------------- B. surgical single-field edits */
{
  const out = bytes(serializeBlogEntry(raw, { dek: "A brand new dek." }));
  t("B1 a dek edit changes exactly ONE line", changedLines(raw, out).length, 1);
  t("B2 …and it is the dek line", load(out).dek, "A brand new dek.");
  t("B3 …and the blocks tail is untouched", out.slice(out.indexOf("\nblocks:")), raw.slice(raw.indexOf("\nblocks:")));
}
{
  // The visibility flip — the write path behind the status gate. Must be surgical, or
  // going live rewrites the whole file.
  const out = bytes(serializeBlogEntry(raw, { status: "draft" }));
  t("B4 the status flip changes exactly ONE line", changedLines(raw, out).length, 1);
  t("B5 …and it is the status line", load(out).status, "draft");
}

/* ---------------------------------------------- C. THE DATE QUOTING (silent if wrong)
 * js-yaml single-quotes `date: '2026-07-24'` to keep it a STRING. Lose the quotes and
 * the next load() yields a Date — and the read path sorts posts with a lexical
 * localeCompare, which would then be comparing a Date against strings. */
t("C1 the source file's date loads as a string", typeof load(raw).date, "string");
{
  const out = bytes(serializeBlogEntry(raw, { dek: "x" }));
  t("C2 after a round-trip the date is STILL a string, not a Date", typeof load(out).date, "string");
  t("C3 …and its value is unchanged", load(out).date, "2026-07-24");
  t("C4 …and the quoting is preserved in the BYTES", out.includes("date: '2026-07-24'"), true);
}
{
  const out = bytes(serializeBlogEntry(raw, { date: "2026-08-01" }));
  t("C5 a NEW date is written quoted too (so it also loads as a string)",
    out.includes("date: '2026-08-01'"), true);
  t("C6 …and loads back as a string", typeof load(out).date, "string");
}

/* ---------------------------------------------- D. semantic equality */
{
  const patch = { dek: "New dek", status: "draft" };
  const out = bytes(serializeBlogEntry(raw, patch));
  t("D1 load(serialize(raw, patch)) deep-equals { ...load(raw), ...patch }",
    load(out), { ...load(raw), ...patch });
}
t("D2 a blocks write preserves the head object exactly", (() => {
  const out = bytes(serializeBlogBlocks(raw, readBlogBlocks(raw)));
  const a = load(raw), b = load(out);
  delete a.blocks; delete b.blocks;
  return JSON.stringify(a) === JSON.stringify(b);
})(), true);

/* ---------------------------------------------- E. transport independence (noRefs)
 * js-yaml emits &ref_0/*ref_0 anchors when two keys hold the SAME OBJECT REFERENCE, a
 * property of the input GRAPH not its values. load() restores the file's shared refs;
 * the route's JSON.parse has none. Without noRefs the same edit serializes two ways. */
{
  const fromLoad = readBlogBlocks(raw);                        // may carry shared refs
  const fromJson = JSON.parse(JSON.stringify(fromLoad));       // as the route receives it
  t("E1 load()-derived and JSON-parsed blocks serialize IDENTICALLY",
    bytes(serializeBlogBlocks(raw, fromLoad)), bytes(serializeBlogBlocks(raw, fromJson)));
  t("E2 …and neither emits a yaml anchor", /[&*]ref_\d/.test(bytes(serializeBlogBlocks(raw, fromJson))), false);
}
{
  // The hazard, made real: two blocks sharing ONE object reference.
  const shared = { discriminant: "heading", value: { text: "Shared" } };
  const out = bytes(serializeBlogBlocks(raw, [shared, shared]));
  t("E3 two blocks that ARE the same object still dump by value, not as an anchor",
    /[&*]ref_\d/.test(out), false);
}

/* ---------------------------------------------- F. refuse, do not reformat */
t("F1 a file with no blocks key is REFUSED",
  bytes(serializeBlogEntry("title: x\ndek: y\n", {})), "ERROR:unsupported_format");
t("F2 …and the blocks writer refuses it too",
  bytes(serializeBlogBlocks("title: x\ndek: y\n", [])), "ERROR:unsupported_format");
{
  // A HAND-AUTHORED post: double-quoted strings, 4-space indent, a literal | scalar.
  // Valid yaml, none of it js-yaml's output shape. The head cannot be reproduced, so an
  // edit must REFUSE rather than silently reformat content nobody asked it to touch.
  const hand = [
    'title: "Hand authored"',
    'dek: "typed by a person"',
    'date: "2026-08-01"',
    "status: draft",
    "heroImage: null",
    "blocks:",
    "    - discriminant: richText",
    "      value:",
    "          paragraphs:",
    "              - |",
    "                A literal block scalar.",
    "",
  ].join("\n");
  t("F3 a non-canonical HEAD is refused by the head writer",
    bytes(serializeBlogEntry(hand, { dek: "x" })), "ERROR:unsupported_format");
  // The blocks writer does NOT re-dump the head, so it is legitimately safe here — and
  // it preserves the hand-authored head verbatim.
  const out = bytes(serializeBlogBlocks(hand, [{ discriminant: "heading", value: { text: "H" } }]));
  t("F4 the blocks writer preserves a non-canonical HEAD verbatim",
    out.startsWith(hand.slice(0, hand.indexOf("\nblocks:") + 1)), true);
}

/* ---------------------------------------------- G. key order + optional-key insertion */
{
  // A post with no `topic` gains one: it must land in SCHEMA position (4th), not appended
  // after heroImage, or every subsequent no-op save would churn the key order.
  const noTopic = dump(
    { title: "T", dek: "D", date: "2026-08-01", status: "draft", heroImage: null, blocks: [] },
    { noRefs: true }
  );
  const out = bytes(serializeBlogEntry(noTopic, { topic: "Craft" }));
  t("G1 a newly-added optional key lands in schema order",
    Object.keys(load(out)), ["title", "dek", "date", "topic", "status", "heroImage", "blocks"]);
  t("G2 a second no-op save after that is byte-stable", bytes(serializeBlogEntry(out, {})), out);
}
t("G3 heroImage: null SURVIVES a head edit (null is a value, not an absence)",
  load(bytes(serializeBlogEntry(raw, { dek: "x" }))).heroImage, null);

/* ---------------------------------------------- H. the create path */
{
  const out = bytes(serializeNewBlogPost({ title: "A New Post", dek: "", date: "2026-08-02" }));
  const doc = load(out);
  t("H1 a new post is born a DRAFT (never published)", doc.status, "draft");
  t("H2 …with an empty blocks array", doc.blocks, []);
  t("H3 …heroImage null", doc.heroImage, null);
  t("H4 …in schema order", Object.keys(doc), ["title", "dek", "date", "status", "heroImage", "blocks"]);
  t("H5 …its date is a string, not a Date", typeof doc.date, "string");
  // The file it produces must be editable by the very next call — the canonical-form
  // guarantee #171 established for the seed post, now guaranteed for every new post.
  t("H6 a fresh post round-trips through the head writer byte-identically",
    bytes(serializeBlogEntry(out, {})), out);
  t("H7 …and through the blocks writer", bytes(serializeBlogBlocks(out, [])), out);
}

console.log(`\nblog-serialize result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
