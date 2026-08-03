// BS-3c — the blog block registry's completeness, and the editor->seam contract.
// Run: node --experimental-strip-types ralph/tests/blog-registry.mjs
//
// THIS IS THE GATE FOR THE DECAY CLASS THAT HAS NOW BITTEN THREE TIMES. #171 added
// `heading` to the schema and the renderer. Nothing else knew:
//   - #173 found the SANITIZER table lacked it (the post was unsaveable);
//   - 3c found the FORM table lacked it too (the editor could not create or render one).
// Both because each PR's scope stopped at its own seam and nobody swept the others.
//
// The assertion that closes it is not "heading exists" — it is that EVERY kind the
// registry offers produces a value the WRITE PATH accepts. A kind can be added to the
// picker and still be unsaveable; that is exactly what would have happened here. So each
// `empty()` is pushed through the real sanitizer and the real serializer.
//
// A MAPPED TYPE FAILS COMPILATION; A `Set<Kind>` JUST RETURNS FALSE — so
// BLOG_KIND_HAS_STYLE is asserted to be total too, since a Set-shaped version of it would
// have degraded silently to "no Style tab" instead of erroring.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
// The DATA half only. blog-registry.tsx holds the Forms and is .tsx, which node's
// type-stripping cannot load — the same constraint that kept BlogProse out of #173's
// suite. Everything this gate asserts (the kind set, the empties, the Style verdict)
// deliberately lives on the .ts side so it IS reachable.
import {
  BLOG_BLOCK_EMPTIES,
  BLOG_BLOCK_LABELS,
  BLOG_KIND_HAS_STYLE,
  BLOG_PICKER_ORDER,
  emptyHeading,
} from "../../components/studio/blocks/blog-empties.ts";
// The PROJECTS empties, to prove blog's three shared copies have not drifted. A TOTAL
// comparison of values (every key, every default), not a corpus over a function — which
// is why duplicating an empty is safe where duplicating a URL validator was not (#173).
import { BLOCK_EMPTIES } from "../../components/studio/blocks/empties.ts";
import { makeBlogSanitizers, BLOG_TOPICS } from "../../lib/studio/blog-format-core.ts";
import {
  str,
  obj,
  arrayOf,
  imgSpec,
  videoSrc,
  videoFrame,
  bool,
  imageSrc,
} from "../../lib/studio/sections-format.ts";
import { serializeBlogBlocks, readBlogBlocks } from "../../lib/studio/blog-serialize.ts";
import { validateBlogPost } from "../../lib/studio/validate-blog-post.ts";
// The publish gate takes the allowed topics as an argument (import-free so ralph can execute it).
const publishGate = (slug, raw) => validateBlogPost(slug, raw, BLOG_TOPICS);
import { entryDraftCacheKey } from "../../lib/studio/entry-draft-key.ts";

const { sanitizeBlogBlocksPatch } = makeBlogSanitizers({ str, obj, arrayOf, imgSpec, videoSrc, videoFrame, bool, imageSrc });

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const POST = path.join(root, "content/blog/what-a-data-table-teaches-you-about-trust.yaml");

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

// The four kinds the BLOG schema declares. Derived from the real content file's own
// blocks plus the schema's picker order, so this list is not a hand-copy of the source
// under test.
// FIVE since imageBlock. This list is the point of the suite — every blog table must
// cover exactly it, so adding a kind to the schema and forgetting a table fails here.
const KINDS = ["richText", "heading", "pullQuote", "imageBlock", "videoEmbed"];

/* ------------------------------------------------- A. the table is exactly the schema */
t("A1 the table offers exactly the five blog kinds", Object.keys(BLOG_BLOCK_EMPTIES).sort(), [...KINDS].sort());
t("A2 heading IS in the registry (the gap this PR closes)", Object.prototype.hasOwnProperty.call(BLOG_BLOCK_EMPTIES, "heading"), true);
t("A3 no projects-only kind leaked in", KINDS.length, Object.keys(BLOG_BLOCK_EMPTIES).length);
for (const k of ["heroCover", "deviceShelf", "statCards", "swatchTokens", "closingLine", "figureGrid"]) {
  t(`A4 ${k} is NOT offered`, Object.prototype.hasOwnProperty.call(BLOG_BLOCK_EMPTIES, k), false);
}
t("A5 labels are total", Object.keys(BLOG_BLOCK_LABELS).sort(), [...KINDS].sort());
// The Set-shaped hazard, asserted: every kind must have an explicit Style verdict.
t("A6 BLOG_KIND_HAS_STYLE is TOTAL (a Set would silently answer false)", Object.keys(BLOG_KIND_HAS_STYLE).sort(), [...KINDS].sort());
t("A7 the picker order covers every kind", [...BLOG_PICKER_ORDER].sort(), [...KINDS].sort());

/* ------------------------------------------------- B. every entry is well-formed */
for (const k of KINDS) {
  t(`B: ${k} has an empty()`, typeof BLOG_BLOCK_EMPTIES[k] === "function", true);
  t(`B: ${k} has a label`, typeof BLOG_BLOCK_LABELS[k] === "string" && BLOG_BLOCK_LABELS[k].length > 0, true);
  t(`B: ${k} has an explicit Style verdict`, typeof BLOG_KIND_HAS_STYLE[k] === "boolean", true);
}

/* ------------------------------------------------- B2. no drift from the projects empties */
for (const k of ["richText", "pullQuote", "videoEmbed"]) {
  t(`B2: blog's ${k} empty deep-equals the projects one`, BLOG_BLOCK_EMPTIES[k](), BLOCK_EMPTIES[k]());
}

/* ------------------------------------------------- C. THE REAL GATE — every empty()
 * round-trips the write path. A kind offered by the picker but rejected by the sanitizer
 * is exactly the failure #173 found for `heading`, and this is what would have caught it
 * on day one. */
/** The ONE documented transformation the sanitizer applies to a fresh block: an image
 *  spec's `frame` is OMIT-WHEN-EMPTY, so `frame: ""` is dropped rather than written. An
 *  empty is otherwise expected to survive byte-for-byte (the empties-preserved rule). */
  /** ⚠ THE OMIT-WHEN-EMPTY SET, NAMED. `frame` was the only one; `intrinsicWidth` and
   *  `intrinsicHeight` join it — the source asset's own dimensions, which a static import carries
   *  implicitly and a content path cannot. All three are dropped rather than written as empties,
   *  because every image already on disk lacks them and a required key would reject all of it.
   *  An empty is otherwise expected to survive byte-for-byte (the empties-preserved rule).
   *
   *  The list is EXPLICIT rather than a filter over "anything falsy": a blanket drop would hide a
   *  sanitizer that had started discarding a real field, which is the failure this gate exists for. */
  const OMIT_WHEN_EMPTY = ["frame", "intrinsicWidth", "intrinsicHeight"];
  const afterSanitize = (value) => {
    if (!value || typeof value !== "object" || !value.poster) return value;
    const poster = { ...value.poster };
    for (const k of OMIT_WHEN_EMPTY) {
      if (poster[k] === "" || poster[k] === null) delete poster[k];
    }
    return { ...value, poster };
  };
for (const k of KINDS) {
  const block = { discriminant: k, value: BLOG_BLOCK_EMPTIES[k]() };
  const res = sanitizeBlogBlocksPatch([block]);
  t(`C1: a fresh ${k} PASSES the sanitizer`, res.ok, true);
  if (res.ok) {
    t(`C2: a fresh ${k} survives the sanitizer intact (bar the omit-when-empty frame)`,
      res.blocks[0], { discriminant: k, value: afterSanitize(block.value) });
  }
}
{
  // All four together, then through the serializer against the real file's head.
  const all = KINDS.map((k) => ({ discriminant: k, value: BLOG_BLOCK_EMPTIES[k]() }));
  const res = sanitizeBlogBlocksPatch(all);
  t("C3 all four fresh blocks pass together", res.ok, true);
  const raw = readFileSync(POST, "utf8");
  const out = serializeBlogBlocks(raw, res.ok ? res.blocks : []);
  t("C4 …and serialize without error", out.ok, true);
  if (out.ok) {
    t("C5 …and load back as the same four blocks",
      load(out.bytes).blocks,
      all.map((b) => ({ discriminant: b.discriminant, value: afterSanitize(b.value) })));
    t("C6 …preserving the file's head byte-for-byte", out.bytes.startsWith(raw.slice(0, raw.indexOf("\nblocks:") + 1)), true);
  }
}

/* ------------------------------------------------- D. an empty post is publishable
 * A freshly created post is `blocks: []` and `status: draft`; adding one empty block of
 * each kind must not make it unpublishable either, or the editor could paint the author
 * into a corner the publish gate then refuses. */
{
  const all = KINDS.map((k) => ({ discriminant: k, value: BLOG_BLOCK_EMPTIES[k]() }));
  const yaml = `title: T\ndek: d\ndate: '2026-08-01'\ntopic: Design systems\nstatus: published\nheroImage: null\n` +
    serializeBlogBlocks(`x: 1\nblocks: []\n`, all).bytes.slice("x: 1\n".length);
  t("D1 a published post of fresh blocks passes the publish gate", publishGate("p", yaml).ok, true);
}

/* ------------------------------------------------- E. the heading empty, specifically */
t("E1 emptyHeading is the schema's shape", emptyHeading(), { text: "" });
t("E2 the real post's heading blocks match that shape", (() => {
  const blocks = readBlogBlocks(readFileSync(POST, "utf8"));
  const headings = blocks.filter((b) => b.discriminant === "heading");
  return headings.length > 0 && headings.every((h) => Object.keys(h.value).join() === "text");
})(), true);

/* ------------------------------------------------- F. G4 — the cache keys cannot collide
 * The draft-state read used to be keyed ["studio-case-study-draft"] with `slug` as the
 * only argument. Blog and project slugs are INDEPENDENT namespaces, so a sibling that
 * copied that key would let a post and a project sharing a slug serve each other's cached
 * draft state — the same class as 3a's hero-path clobber, one layer up. The collection is
 * folded into the key; this asserts it, rather than trusting the comment. */
t("F1 the projects and blog draft-state cache keys DIFFER",
  entryDraftCacheKey("projects").join("|") !== entryDraftCacheKey("blog").join("|"), true);
t("F2 …and each names its collection", [entryDraftCacheKey("projects"), entryDraftCacheKey("blog")],
  [["studio-entry-draft", "projects"], ["studio-entry-draft", "blog"]]);

console.log(`\nblog-registry result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
