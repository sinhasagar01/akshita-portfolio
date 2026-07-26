// `imageBlock` — the inline figure, its alt gate, and THE PICKER/RENDERER SUBSET RULE.
// Run: node --experimental-strip-types ralph/tests/image-block.mjs
//
// PART D IS THE ONE THAT EARNS THIS FILE, and it is not about images at all.
//
// A kind can be added to the picker, the registry, the empties, the labels and the
// sanitizer — five mapped types, all compile-checked — and still not be RENDERED. Before
// this PR the renderer was a `switch` with `default: return null`, so a kind the author
// could pick, fill in and save produced a block that drew NOTHING. And because the studio
// canvas and the public article are the same component, it looked consistent and correct in
// both places. That is precisely the shape of the failure that left `videoEmbed.poster`
// authorable and invisible for three PRs before anyone noticed.
//
// The renderer's half is now a compile error: BlogProse's RENDERERS is
// `{ [K in BlogBlockKind]: … }`. This suite closes the other half — that everything OFFERED
// is something the publish gate agrees is renderable. `RENDERABLE` is deliberately NOT
// derived from the renderer (its own comment: a disagreement between them is a real bug it
// should surface rather than inherit), so the relationship needs asserting rather than
// typing away.
//
// ASSERT THE ABSENCE OF A PATTERN, NOT JUST THE PRESENCE OF A RESULT.
import { readFileSync } from "node:fs";
import { dump } from "js-yaml";
import {
  BLOG_BLOCK_EMPTIES,
  BLOG_BLOCK_LABELS,
  BLOG_KIND_HAS_STYLE,
  BLOG_PICKER_ORDER,
} from "../../components/studio/blocks/blog-empties.ts";
import { validateBlogPost, RENDERABLE } from "../../lib/studio/validate-blog-post.ts";
import { serializeBlogBlocks, readBlogBlocks } from "../../lib/studio/blog-serialize.ts";
import { makeBlogSanitizers } from "../../lib/studio/blog-format-core.ts";
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

const { sanitizeBlogBlocksPatch } = makeBlogSanitizers({
  str, obj, arrayOf, imgSpec, videoSrc, videoFrame, bool, imageSrc,
});

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const code = (p) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const img = (over = {}) => ({
  discriminant: "imageBlock",
  value: { src: "/images/blog/a-post/blocks/abc123.webp", alt: "A data table", caption: "", wide: false, decorative: false, ...over },
});
const post = (blocks, status = "published") =>
  dump({ title: "A post", dek: "d", date: "2026-07-24", topic: "t", status, heroImage: null, blocks });

/* ================================================================= A. the tables
 * Five mapped types already make a missing entry a compile error. What is asserted here is
 * the VALUES, which the types cannot see. */
t("A: the kind is in the picker", BLOG_PICKER_ORDER.includes("imageBlock"), true);
t("A: its label is 'Image'", BLOG_BLOCK_LABELS.imageBlock, "Image");
// FALSE is the imgSpecFields decision showing through. imageBlock carries no geometry, so
// there is nothing for a Style tab to hold and all five fields are Content.
t("A: it has NO style tab", BLOG_KIND_HAS_STYLE.imageBlock, false);
t("A: the empty is born unset and un-flagged", BLOG_BLOCK_EMPTIES.imageBlock(),
  { src: null, alt: "", caption: "", wide: false, decorative: false });
// src null, not "" — the imageSrc gate rejects "" precisely because it can only come from a
// form that coerced a null.
t("A: the empty's src is null, never \"\"", BLOG_BLOCK_EMPTIES.imageBlock().src, null);

/* ================================================================= B. the sanitizer
 * Permissive about half-authored drafts: a block born from the picker must SAVE. */
const ok = (blocks) => sanitizeBlogBlocksPatch(blocks);
t("B: a fresh block from the picker saves",
  ok([{ discriminant: "imageBlock", value: BLOG_BLOCK_EMPTIES.imageBlock() }]).ok, true);
t("B: a blank alt is ACCEPTED at save", ok([img({ alt: "" })]).ok, true);
t("B: a full block saves", ok([img()]).ok, true);
t("B: src \"\" is REJECTED (a coerced null)", ok([img({ src: "" })]).ok, false);
t("B: a non-boolean `wide` is rejected", ok([img({ wide: "yes" })]).ok, false);
t("B: a non-boolean `decorative` is rejected", ok([img({ decorative: 1 })]).ok, false);
t("B: an unknown field is rejected", ok([{ discriminant: "imageBlock", value: { ...img().value, zoom: 2 } }]).ok, false);
t("B: a missing field is rejected", ok([{ discriminant: "imageBlock", value: { src: null, alt: "" } }]).ok, false);

/* ================================================================= C. the alt gate
 * STRICT about what may go live. This is the only gate an author cannot walk past, and
 * therefore the only place "required" can actually be required. */
t("C: a PUBLISHED post with an image and a blank alt is REJECTED",
  validateBlogPost("a-post", post([img({ alt: "" })])).ok, false);
t("C: the same post as a DRAFT is ACCEPTED",
  validateBlogPost("a-post", post([img({ alt: "" })], "draft")).ok, true);
t("C: a published post with real alt text is ACCEPTED",
  validateBlogPost("a-post", post([img()])).ok, true);
// The deliberate exemption. Without it an author types "image" into alt to clear the gate,
// which is worse than empty: empty is an absence a screen reader skips, "image" is
// confidently wrong.
t("C: `decorative` permits a blank alt on a published post",
  validateBlogPost("a-post", post([img({ alt: "", decorative: true })])).ok, true);
// Whitespace is not alt text.
t("C: a whitespace-only alt is REJECTED",
  validateBlogPost("a-post", post([img({ alt: "   " })])).ok, false);
// No image set means nothing to describe, so the gate does not fire.
t("C: an UNSET image with a blank alt is ACCEPTED",
  validateBlogPost("a-post", post([img({ src: null, alt: "" })])).ok, true);
t("C: the failure names the field",
  /alt/.test(validateBlogPost("a-post", post([img({ alt: "" })])).error?.message ?? ""), true);

/* ================================================================= D. picker ⊆ renderable
 * THE GATE THAT WOULD HAVE CAUGHT THE ORIGINAL BUG. */
const unrenderable = BLOG_PICKER_ORDER.filter((k) => !RENDERABLE.has(k));
t("D: EVERY kind the picker offers is one the renderer draws", unrenderable, []);
// Stated as a whole row so a future kind added to one and not the other fails loudly.
t("D: the two agree exactly", [...BLOG_PICKER_ORDER].sort(), [...RENDERABLE].sort());
// And the renderer's own table must be a MAPPED TYPE, not a switch with a silent default —
// a switch over an `unknown` discriminant cannot be exhaustiveness-checked, so a
// `satisfies never` there would compile forever and prove nothing.
const prose = code("components/blog/BlogProse.tsx");
t("D: the renderer dispatches through a mapped table",
  /RENDERERS:\s*\{\s*\[K in BlogBlockKind\]/.test(prose), true);
t("D: the renderer has NO silent default arm", /default:\s*\n?\s*return null/.test(prose), false);

/* ================================================================= E. the round trip
 * Through the REAL serializer, so the splice is exercised, not a fixture of it. */
const RAW = readFileSync(
  new URL("../../content/blog/what-a-data-table-teaches-you-about-trust.yaml", import.meta.url),
  "utf8"
);
const withImage = serializeBlogBlocks(RAW, [...readBlogBlocks(RAW), img()]);
t("E: serializing a post with an imageBlock succeeds", withImage.ok, true);
if (withImage.ok) {
  const out = withImage.bytes;
  // #173's invariant, re-asserted because this PR writes through the same splice.
  t("E: `date` stays SINGLE-QUOTED", out.includes("date: '2026-07-24'"), true);
  // The head is spliced through untouched, never re-dumped.
  t("E: the head is byte-identical", out.slice(0, out.indexOf("\nblocks:")), RAW.slice(0, RAW.indexOf("\nblocks:")));
  // And it reads back as the same block.
  const back = readBlogBlocks(out);
  t("E: the imageBlock reads back unchanged", back[back.length - 1], img());
  t("E: the existing blocks are untouched", back.slice(0, -1), readBlogBlocks(RAW));
  // A published post containing what we just wrote still passes the gate.
  t("E: the serialized post validates", validateBlogPost("a-post", post(back)).ok, true);
}

console.log(`\nimage-block result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
