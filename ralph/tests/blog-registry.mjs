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
import { readFileSync, readdirSync } from "node:fs";
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
import { validateBlogPost, hasPlaceholder } from "../../lib/studio/validate-blog-post.ts";
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
  /* ⚠ `imageBlock.diagram` JOINED THE OMITTED SET IN #375, AT THE VALUE LEVEL RATHER THAN INSIDE
   * `poster`. It names an inline JSX diagram that draws instead of the raster, and it is
   * omit-when-empty for the reason every other entry here is: every imageBlock already on disk
   * lacks the key, and a required one would reject all of them.
   *
   * Listed EXPLICITLY, like the three above and for the same stated reason — a blanket drop of
   * anything falsy would hide a sanitizer that had begun discarding a real field. */
  const OMIT_AT_VALUE = ["diagram"];
  const afterSanitize = (value) => {
    if (!value || typeof value !== "object") return value;
    const out = { ...value };
    for (const k of OMIT_AT_VALUE) {
      if (out[k] === "" || out[k] === null) delete out[k];
    }
    if (!out.poster) return out;
    const poster = { ...out.poster };
    for (const k of OMIT_WHEN_EMPTY) {
      if (poster[k] === "" || poster[k] === null) delete poster[k];
    }
    return { ...out, poster };
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

/* ============================================================================================
   M · A DRAFT MARKER CANNOT REACH A PUBLISHED POST.

   ⚠ PUBLISH IS WHOLE BRANCH. A draft carrying placeholders for sentences only the author can
   write ships those placeholders the moment the branch is published for ANY other reason — a
   settings change, an image upload, another post. Nothing here reads English, so a marker that
   looks like prose is indistinguishable from prose.

   The markers are therefore loud, and this is the gate that makes them unable to ship. Permissive
   at save and strict at publish, the same shape as the title gate beside it — a marker is CORRECT
   in a draft.

   ⚠ THE LITERAL IS ASSEMBLED IN BOTH THE GUARD AND THIS TEST, so neither file contains the string
   it forbids and a future sweep for stray markers cannot flag its own guard.

   ⚠ AND THE FIXTURE QUOTES ITS SCALARS, because YAML RESERVES A LEADING `@` — an unquoted marker
   makes the document unparseable, which would have made these rows pass for the wrong reason by
   failing at the loader instead of the gate. The real markers live inside block scalars, where the
   character is ordinary text.
============================================================================================ */
console.log(`\nM · a draft marker cannot reach a published post`);
const MARK = "@" + "@ GAP";
/* ⚠ ASSEMBLED, LIKE `MARK` ABOVE AND FOR THE SAME REASON — so this file does not contain the
 * strings it forbids, and a sweep for stray placeholders across the repo cannot flag its own
 * test. Fifth instance here of explaining a thing requiring writing it. */
const SHOUT_A = "EXAMPLE GOES" + " HERE";
const SHOUT_B = "THIS SENTENCE MUST NOT" + " SHIP";
const post = (status, extra = "") =>
  `title: A title\nstatus: ${status}\ntopic: Design systems\n${extra}blocks:\n  - discriminant: heading\n    value:\n      text: A heading\n`;

t("M0 the fixture publishes cleanly without a marker — or M1 passes for the wrong reason",
  validateBlogPost("slug", post("published"), ["Design systems"]).ok, true);
t("M1 ⚠ A PUBLISHED POST CARRYING A DRAFT MARKER IS REFUSED",
  validateBlogPost("slug", post("published", `dek: "${MARK} 1 OF 3 something"\n`), ["Design systems"]).ok, false);
t("M1a …and the refusal names the marker rather than failing generically",
  /draft marker/.test(validateBlogPost("slug", post("published", `dek: "${MARK} x"\n`), ["Design systems"]).error?.message ?? ""), true);
t("M2 ⚠ AND A DRAFT MAY CARRY ONE — strict at publish, permissive at save, or the markers are unusable",
  validateBlogPost("slug", post("draft", `dek: "${MARK} x"\n`), ["Design systems"]).ok, true);
t("M3 …and it is caught anywhere in the document, not only in one field",
  validateBlogPost("slug", post("published").replace("A heading", `"${MARK} 2 OF 3 here"`), ["Design systems"]).ok, false);

/* ⚠ THE SENTINEL IS ONE TYPO FROM GONE AND THE SHOUT IS NOT — M4 ONWARD, AND THEY ARE HERE BECAUSE
   THE ROWS ABOVE ALL PASSED WHILE A PLACEHOLDER WAS SERVED FROM THE LIVE SITE.

   M1 to M3 test the SENTINEL. A backspace at a paragraph's start merged it into the one above —
   ordinary contentEditable behaviour — and three characters landed on the opening marker. Both
   sentinels died in one keystroke, the English survived whole, and a post published carrying a
   sentence that says in capitals that it must not ship.

   ⚠ THE PREMISE WAS ALREADY IN THIS FILE'S OWN HEADER: "nothing here reads English", concluding
   that the markers are therefore LOUD. Loudness protects a human reader and does nothing for a
   gate — it made the sentinel a single point of failure that ordinary editing destroys. */
t("M4 ⚠ A DAMAGED SENTINEL WITH THE ENGLISH INTACT IS STILL REFUSED — the exact shape that shipped",
  validateBlogPost("slug", post("published", `dek: "kjhOF 3 \u2014 HER ${SHOUT_A}. ${SHOUT_B}."\n`), ["Design systems"]).ok, false);
t("M4a …and the other half alone is enough, so neither phrase carries the rule by itself",
  validateBlogPost("slug", post("published", `dek: "nothing else wrong, only ${SHOUT_A}"\n`), ["Design systems"]).ok, false);
/* ⚠ M4a's MIRROR, AND IT EXISTS BECAUSE MUTATION FOUND ITS ABSENCE. M4's fixture carries BOTH
   phrases, so deleting either one left it passing on the other — the list could have lost a member
   with nothing going red. A row per phrase, each on a fixture containing only that phrase, is what
   makes the LIST the subject rather than the pair. */
t("M4a2 …and the second phrase alone is enough too, so no member of the list is unasserted",
  validateBlogPost("slug", post("published", `dek: "nothing else wrong, only ${SHOUT_B}"\n`), ["Design systems"]).ok, false);
t("M4b …and a draft may still carry it, or the placeholders become unusable at authoring time",
  validateBlogPost("slug", post("draft", `dek: "${SHOUT_A}"\n`), ["Design systems"]).ok, true);
t("M4c ⚠ AND ORDINARY PROSE IS NOT REFUSED — the phrases are specific, and a floor row proves the check can pass",
  validateBlogPost("slug", post("published", 'dek: "An example of a heading that goes here in the body"\n'), ["Design systems"]).ok, true);

/* ⚠ AND THE CORPUS IS THE SUBJECT, NOT A FIXTURE. Every row above proves the FUNCTION refuses a
   placeholder. None of them looks at what is actually published — and that is the gap the live
   post fell through, because the validator only ever runs at publish and a document already on
   main is never re-asked. Derived by walking the collection rather than naming posts, so a fifth
   post cannot join unexamined. */
const blogDir = new URL("../../content/blog/", import.meta.url);
const posts = readdirSync(blogDir).filter((f) => f.endsWith(".yaml"))
  .map((f) => [f, readFileSync(new URL(f, blogDir), "utf8")]);
t("M5a the corpus walk found posts, against a LITERAL rather than against itself",
  posts.length >= 4, true);
const shipping = posts.filter(([, raw]) => /^status:\s*published\s*$/m.test(raw));
t("M5b …and some of them are published, or M5 passes over an empty subject",
  shipping.length >= 3, true);
t("M5 ⚠ NO PUBLISHED POST CARRIES A PLACEHOLDER BY EITHER HALF — the row that would have caught it",
  shipping.filter(([f, raw]) => hasPlaceholder(raw)).map(([f]) => f), []);

console.log(`\nblog-registry result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
