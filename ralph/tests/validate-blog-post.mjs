// BS-3b — the publish-time blog gate, and the second defence behind it.
// Run: node --experimental-strip-types ralph/tests/validate-blog-post.mjs
//
// WHAT THIS GATE IS FOR, measured rather than assumed. The Keystatic reader validates
// every entry against the schema, and it THROWS on shapes it will not accept — inside
// `reader.collections.blog.all()`, which both the blog index and generateStaticParams
// call. So one malformed post merged to main fails the build for the WHOLE SITE until
// someone reverts it. This gate refuses the publish instead.
//
// (The pre-PR analysis expected BlogProse to be the thing that throws. It is not: the
// reader coerces whatever it does accept, so nothing malformed reaches the renderer.
// BlogProse's guards are insurance against a future schema loosening, not the live
// defence — see its comment. That correction is in the PR body.)
//
// The claim to avoid: this does NOT replicate the projects gate's coverage of
// half-authored content. An empty-src videoEmbed and a missing image are legal for a
// post and render as nothing; for a case study the ssg adapter refuses them.
import { readdirSync, readFileSync } from "node:fs";
import { dump, load } from "js-yaml";
import { validateBlogPost, BLOG_POST_PATH_RE } from "../../lib/studio/validate-blog-post.ts";
import { BLOG_TOPICS } from "../../lib/studio/blog-format-core.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/** A published post file carrying the given blocks. Carries a valid `topic` for the same reason
 *  it carries a `title`: since PR D a published post also needs a member topic, so without one
 *  every block/title assertion below would fail for the wrong reason (the topic gate, not the
 *  thing under test). The topic gate has its own isolated section (F). */
const postWith = (blocks, status = "published") =>
  dump({ title: "T", dek: "D", date: "2026-08-01", topic: "Design systems", status, heroImage: null, blocks }, { noRefs: true });
const verdict = (raw) => {
  // BLOG_TOPICS is injected, not imported by the validator — see its header. The gate is a pure
  // function of (slug, raw, allowedTopics), so the suite passes the real set here.
  const r = validateBlogPost("a-post", raw, BLOG_TOPICS);
  return r.ok ? "OK" : r.error.code;
};

/* ------------------------------------------------- A. the malformed fixtures (G3)
 * [READER-THROWS] marks the shapes the Keystatic reader itself refuses. Those are the
 * SITE-BREAKING ones: the reader throws inside reader.collections.blog.all(), so merging
 * one fails every subsequent build until it is reverted. Refusing them at publish is the
 * whole point of this gate, so they must all be in the REFUSED list below.
 * The unmarked ones the reader would coerce; refusing them too is deliberate over-strictness
 * (the sanitizer already makes them unreachable from the studio). */
const FIXTURES = {
  "a null entry in the array": [null],
  "a non-object entry": ["just a string"],
  "a null value": [{ discriminant: "heading", value: null }],
  "a missing value": [{ discriminant: "heading" }],
  "richText with NO paragraphs key": [{ discriminant: "richText", value: {} }],
  "[READER-THROWS] richText whose paragraphs is not an array": [{ discriminant: "richText", value: { paragraphs: "nope" } }],
  "richText with a non-string paragraph": [{ discriminant: "richText", value: { paragraphs: [1] } }],
  "[READER-THROWS] heading whose text is not a string": [{ discriminant: "heading", value: { text: 42 } }],
  "[READER-THROWS] an unknown kind": [{ discriminant: "mystery", value: {} }],
  "[READER-THROWS] a projects-only kind": [{ discriminant: "heroCover", value: {} }],
  "[READER-THROWS] videoEmbed whose src is not a string": [{ discriminant: "videoEmbed", value: { src: 7 } }],
  "a non-array blocks value": undefined, // handled separately below
};
for (const [label, blocks] of Object.entries(FIXTURES)) {
  if (blocks === undefined) continue;
  t(`A: ${label} is REFUSED at publish`, verdict(postWith(blocks)), "invalid_blocks");
}
// title added so this isolates the BLOCKS check — since #216 a published post also needs a
// non-empty title, and without one this would fail for the wrong reason (a false pass that
// happened to return the same code).
t("A: a non-array blocks value is REFUSED", verdict(dump({ title: "T", topic: "Design systems", status: "published", blocks: "nope" })), "invalid_blocks");

/* ------------------------------------------------- B. what must still be ACCEPTED */
t("B1 the four real kinds are accepted", verdict(postWith([
  { discriminant: "heading", value: { text: "H" } },
  { discriminant: "richText", value: { paragraphs: ["a", "b"] } },
  { discriminant: "pullQuote", value: { text: "Q" } },
  { discriminant: "videoEmbed", value: { src: "https://e.com/v.mp4", caption: "c" } },
])), "OK");
t("B2 an empty blocks array is fine", verdict(postWith([])), "OK");
t("B3 a post with no blocks key at all is fine", verdict(dump({ title: "T", topic: "Design systems", status: "published" })), "OK");

// ---- THE TITLE GATE (#216), IN ITS HOME SUITE — same shape as the alt gate below ----------
// title is editable now and the read path falls back to the slug when it is blank, so an empty
// title is renderable (a post headed by its own slug) rather than a crash. That is the alt
// class of defect: permitted at save, refused at publish. Guarded both ways so it is not
// vacuous, and the draft case confirms it is a PUBLISH gate, not a save one.
t("B6 a published post with a title is fine", verdict(postWith([])), "OK"); // postWith carries title:"T"
t("B6 a published post with a BLANK title is REFUSED",
  verdict(dump({ title: "", status: "published", blocks: [] })), "invalid_blocks");
t("B6 a published post with a WHITESPACE title is REFUSED (trim, not just empty)",
  verdict(dump({ title: "   ", status: "published", blocks: [] })), "invalid_blocks");
t("B6 a DRAFT with a blank title is NOT judged (publish gate, not save gate)",
  verdict(dump({ title: "", status: "draft", blocks: [] })), "OK");
t("B4 an EMPTY videoEmbed src is fine (BlogProse renders nothing — not a build risk)",
  verdict(postWith([{ discriminant: "videoEmbed", value: { src: "" } }])), "OK");
t("B5 an empty richText paragraphs array is fine",
  verdict(postWith([{ discriminant: "richText", value: { paragraphs: [] } }])), "OK");

/* ------------------------------------------------- C. DRAFTS ARE NOT JUDGED
 * The deciding fact: getBlogPosts filters BEFORE mapping (BS-3b), generateStaticParams
 * reads the filtered list, dynamicParams is false and the route gates on status — so a
 * draft's blocks are never touched at build. Judging them would only let one half-written
 * post block the publish of everything else under whole-branch publish. A status flip is
 * itself a file change, so the post IS validated at the publish that makes it live. */
for (const [label, blocks] of Object.entries(FIXTURES)) {
  if (blocks === undefined) continue;
  t(`C: ${label} is IGNORED while the post is a draft`, verdict(postWith(blocks, "draft")), "OK");
}
t("C: an unset status is treated as not-published (fail-closed, matching the read path)",
  verdict(dump({ blocks: [null] })), "OK");

/* ------------------------------------------------- BlogProse IS NOT TESTED HERE.
 * It cannot be, in this idiom: `node --experimental-strip-types` handles .ts but not
 * .tsx (JSX), so a ralph suite cannot import the component. It was instead probed live
 * against these same fixtures in the PR — with the guards, and again with them reverted
 * as a control — which is how we learned the reader coerces and the guards are never
 * reached. Recorded there, not asserted here. */

/* ------------------------------------------------- F. THE TOPIC GATE (PR D)
 * Same shape as the title and alt gates: closed at save, REQUIRED at publish, drafts not judged.
 * The three checks below are the whole rule — a published post needs a topic, it must be a member
 * of the set, and a draft is exempt — and each is guarded both ways so none is vacuous. */
t("F1 a published post with a member topic is fine", verdict(postWith([])), "OK"); // postWith carries topic:"Design systems"
t("F2 a published post with an EMPTY topic is REFUSED",
  verdict(dump({ title: "T", topic: "", status: "published", blocks: [] })), "invalid_blocks");
t("F3 a published post with NO topic key is REFUSED",
  verdict(dump({ title: "T", status: "published", blocks: [] })), "invalid_blocks");
t("F4 a published post with a NON-MEMBER topic is REFUSED (the set is closed, not just non-empty)",
  verdict(dump({ title: "T", topic: "Cooking", status: "published", blocks: [] })), "invalid_blocks");
t("F5 a DRAFT with an empty topic is NOT judged (publish gate, not save gate)",
  verdict(dump({ title: "T", topic: "", status: "draft", blocks: [] })), "OK");
t("F6 a DRAFT with a non-member topic is NOT judged either",
  verdict(dump({ title: "T", topic: "Cooking", status: "draft", blocks: [] })), "OK");

/* F7 · THE MIGRATION IS A NO-OP, PROVEN NOT ASSUMED. The set was chosen to be exactly the topics
 * the existing posts already carry, so no post needs rewriting — but that is a claim about live
 * content, so it is checked against the real files rather than trusted. Every PUBLISHED post on
 * disk must carry a member topic (a draft may be unset, mirroring the gate). If a post's topic is
 * not in BLOG_TOPICS, the set and the content have drifted and this names the file. */
const BLOG_DIR = new URL("../../content/blog/", import.meta.url);
const postFiles = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".yaml"));
t("F7 there are blog posts on disk to check (guards against a silent empty pass)", postFiles.length > 0, true);
const offMembers = [];
for (const f of postFiles) {
  const doc = load(readFileSync(new URL(f, BLOG_DIR), "utf8")) ?? {};
  if (doc.status !== "published") continue;               // drafts may be unset
  if (!(BLOG_TOPICS).includes(doc.topic)) offMembers.push(`${f} → ${JSON.stringify(doc.topic)}`);
}
t("F7 every PUBLISHED post on disk already carries a member topic — zero migration, verified",
  offMembers, []);

/* ------------------------------------------------- E. the publish-loop regex (G4) */
t("E1 matches a blog post path", BLOG_POST_PATH_RE.test("content/blog/my-post.yaml"), true);
t("E2 captures the slug", BLOG_POST_PATH_RE.exec("content/blog/my-post.yaml")[1], "my-post");
t("E3 does NOT match a nested path", BLOG_POST_PATH_RE.test("content/blog/my-post/x.yaml"), false);
t("E4 does NOT match a projects path", BLOG_POST_PATH_RE.test("content/projects/boat-crest.yaml"), false);
t("E5 does NOT match an image under the blog tree", BLOG_POST_PATH_RE.test("public/images/blog/my-post/heroImage.webp"), false);
t("E6 does NOT match a non-yaml", BLOG_POST_PATH_RE.test("content/blog/my-post.md"), false);
t("E7 does NOT match an uppercase slug", BLOG_POST_PATH_RE.test("content/blog/My-Post.yaml"), false);
t("E8 is anchored at both ends", BLOG_POST_PATH_RE.test("x/content/blog/my-post.yaml"), false);

console.log(`\nvalidate-blog-post result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
