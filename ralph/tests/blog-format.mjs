// BS-3b — the blog sanitizer's contract.
// Run: node --experimental-strip-types ralph/tests/blog-format.mjs
//
// WHY THE FIRST CASE MATTERS MOST. #170 concluded the block sanitizer was "reusable
// wholesale" for blog, and that was CORRECT WHEN WRITTEN — blog had three kinds, all
// shared with projects. #171 then added `heading` to the schema and the renderer, and
// silently invalidated the conclusion: the projects VALIDATORS table has no `heading`, so
// feeding it one returns `unknown block kind "heading"` and the one existing post — which
// contains TWO heading blocks — is unsaveable. A conclusion decayed without anyone
// touching it. A2 below is the assertion that would have caught it, and it is the first
// mutation target.
//
// The cases marked [MUTANT n] are the ones the PR's mutation test flips the
// implementation against; each must FAIL when its mutation is applied.
// INJECTION, not duplication. blog-format-core is a dependency-free leaf that takes the
// shared combinators; blog-format.ts wires the real ones in for the routes. Here the
// suite does the same wiring with the SAME combinators, imported from sections-format
// with a `.ts` specifier — legal in a .mjs suite, which sits outside the tsc program.
// So the code under test is the one implementation the routes run, and imgSpec/videoSrc
// cannot drift between the two collections because there is only one of each.
import { makeBlogSanitizers, BLOG_STATUSES, BLOG_TOPICS } from "../../lib/studio/blog-format-core.ts";
import {
  str,
  obj,
  arrayOf,
  imgSpec,
  videoSrc,
  videoFrame,
} from "../../lib/studio/sections-format.ts";

const { sanitizeBlogPatch, sanitizeBlogCreate, sanitizeBlogBlocksPatch } = makeBlogSanitizers({
  str,
  obj,
  arrayOf,
  imgSpec,
  videoSrc,
  videoFrame,
});

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const okOf = (r) => Boolean(r && r.ok);
// Tolerant of a MALFORMED result on purpose. A sanitizer bug can return something that is
// neither ok nor a typed error (the `in`-instead-of-hasOwnProperty mutation makes
// VALIDATORS["constructor"] the Object constructor, whose return value is neither), and a
// gate that CRASHES on that reports less than one that names it.
const codeOf = (r) =>
  r && r.ok ? "ACCEPTED" : r && r.error && r.error.code ? r.error.code : "MALFORMED_RESULT";
/** The rejection REASON, so a test can prove a key is refused deliberately rather than
 *  falling through to the unknown-field catch-all. */
const msgOf = (r) => (r && r.ok ? "ACCEPTED" : r && r.error ? r.error.message : "MALFORMED_RESULT");

const IMG = { src: null, alt: "", width: null, rotate: null, translateX: null, translateY: null, z: null };
const VIDEO = { src: "", poster: IMG, caption: "", frame: "browser", aspect: "", eyebrow: "", title: "" };

/* ------------------------------------------- A. the four kinds, and the heading gap */
t("A1 richText accepted", okOf(sanitizeBlogBlocksPatch([{ discriminant: "richText", value: { paragraphs: ["a", "b"] } }])), true);
// [MUTANT 1] drop `heading` from the blog VALIDATORS table -> this must FAIL.
t("A2 heading accepted  [MUTANT 1]", okOf(sanitizeBlogBlocksPatch([{ discriminant: "heading", value: { text: "H" } }])), true);
t("A3 pullQuote accepted", okOf(sanitizeBlogBlocksPatch([{ discriminant: "pullQuote", value: { text: "Q" } }])), true);
t("A4 videoEmbed accepted", okOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: VIDEO }])), true);
t("A5 an empty blocks array is accepted", sanitizeBlogBlocksPatch([]), { ok: true, blocks: [] });
t("A6 a non-array is rejected", codeOf(sanitizeBlogBlocksPatch({})), "invalid_patch");

// The PROJECTS-only kinds must NOT be accepted into a post — the table is blog's own.
for (const kind of ["heroCover", "deviceShelf", "statCards", "swatchTokens", "closingLine"]) {
  t(`A7 a projects-only kind (${kind}) is rejected`, codeOf(sanitizeBlogBlocksPatch([{ discriminant: kind, value: {} }])), "invalid_patch");
}

/* ------------------------------------------- B. the untrusted-discriminant guards */
// [MUTANT 2] change hasOwnProperty to `in` -> this must FAIL ("constructor" is in every object).
t("B1 a prototype key is not a kind  [MUTANT 2]", codeOf(sanitizeBlogBlocksPatch([{ discriminant: "constructor", value: {} }])), "invalid_patch");
t("B2 a non-string discriminant is rejected", codeOf(sanitizeBlogBlocksPatch([{ discriminant: 1, value: {} }])), "invalid_patch");
t("B3 a null block is rejected", codeOf(sanitizeBlogBlocksPatch([null])), "invalid_patch");
t("B4 a null value is rejected", codeOf(sanitizeBlogBlocksPatch([{ discriminant: "heading", value: null }])), "invalid_patch");
t("B5 an extra block-level field is rejected", codeOf(sanitizeBlogBlocksPatch([{ discriminant: "heading", value: { text: "H" }, extra: 1 }])), "invalid_patch");

/* ------------------------------------------- C. the empties-preserved rule */
// [MUTANT 3] make obj()'s declared fields optional -> this must FAIL.
t("C1 a block MISSING a declared key is rejected  [MUTANT 3]",
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, eyebrow: undefined } }])), "invalid_patch");
t("C2 an UNKNOWN key inside value is rejected",
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "heading", value: { text: "H", extra: "" } }])), "invalid_patch");
t("C3 an empty string IS preserved, not stripped",
  sanitizeBlogBlocksPatch([{ discriminant: "heading", value: { text: "" } }]).blocks,
  [{ discriminant: "heading", value: { text: "" } }]);

/* ------------------------------------------- D. the shared combinators still bite */
// [MUTANT 4] accept "" in imageSrc / numOrNull -> these must FAIL.
t('D1 a poster src of "" is rejected (null means unset)  [MUTANT 4]',
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, poster: { ...IMG, src: "" } } }])), "invalid_patch");
t('D2 a poster geometry of "" is rejected  [MUTANT 4]',
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, poster: { ...IMG, rotate: "" } } }])), "invalid_patch");
t("D3 a non-http video src is rejected",
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, src: "javascript:alert(1)" } }])), "invalid_patch");
t("D4 an EMPTY video src is accepted (a block is born without one; publish is the gate)",
  okOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, src: "" } }])), true);
t("D5 an https video src is accepted",
  okOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, src: "https://example.com/v.mp4" } }])), true);
t("D6 an unknown video frame is rejected",
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "videoEmbed", value: { ...VIDEO, frame: "cinema" } }])), "invalid_patch");
t("D7 a non-string paragraph is rejected",
  codeOf(sanitizeBlogBlocksPatch([{ discriminant: "richText", value: { paragraphs: ["a", 2] } }])), "invalid_patch");

/* ------------------------------------------- E. the head patch */
t("E1 dek accepted", sanitizeBlogPatch({ dek: "x" }), { ok: true, patch: { dek: "x" } });
t("E2 a valid ISO date accepted", sanitizeBlogPatch({ date: "2026-08-01" }), { ok: true, patch: { date: "2026-08-01" } });
t("E3 a malformed date is rejected", codeOf(sanitizeBlogPatch({ date: "1 Aug 2026" })), "invalid_patch");
t("E4 a date with a time is rejected", codeOf(sanitizeBlogPatch({ date: "2026-08-01T00:00:00Z" })), "invalid_patch");
t("E5 both statuses accepted", BLOG_STATUSES.every((s) => sanitizeBlogPatch({ status: s }).ok), true);
// [MUTANT 5] drop the status enum check -> this must FAIL. A typo'd status silently
// hides a post forever, because the public read filters `=== "published"`.
t("E6 a TYPO'd status is rejected  [MUTANT 5]", codeOf(sanitizeBlogPatch({ status: "publsihed" })), "invalid_patch");
t("E7 a wrong-case status is rejected  [MUTANT 5]", codeOf(sanitizeBlogPatch({ status: "Published" })), "invalid_patch");
// [MUTANT 5b] topic is a CLOSED set now (PR D), but the sanitizer still allows EMPTY — the
// write boundary a draft saves through. What it refuses is a NON-EMPTY non-member, so junk
// cannot reach disk. "Required" is validate-blog-post's job, not this one's. Guarded three ways
// so dropping the membership check fails E8c, and dropping the empty-allowance fails E8b.
t("E8a a MEMBER topic is accepted", sanitizeBlogPatch({ topic: BLOG_TOPICS[0] }), { ok: true, patch: { topic: BLOG_TOPICS[0] } });
t("E8b an EMPTY topic is accepted (a draft may be unset)", sanitizeBlogPatch({ topic: "" }), { ok: true, patch: { topic: "" } });
t("E8c a NON-MEMBER topic is REJECTED  [MUTANT 5b]", codeOf(sanitizeBlogPatch({ topic: "Anything At All" })), "invalid_patch");
// [MUTANT 6] let the text path accept `blocks` -> these must FAIL. blocks has ONE writer.
// The REASON is asserted, not just the rejection: without the named guard `blocks` would
// still be refused by the unknown-field catch-all, so a code-only assertion would pass
// even with the guard deleted. Naming it proves the refusal is deliberate.
t("E9 blocks is rejected on the text path  [MUTANT 6]", codeOf(sanitizeBlogPatch({ blocks: [] })), "invalid_patch");
t("E9b …for the STATED reason, not as an unknown field  [MUTANT 6]",
  msgOf(sanitizeBlogPatch({ blocks: [] })), "blocks are saved through the blocks path, not this patch");
t("E10 heroImage is rejected on the text path (the image route owns it)", codeOf(sanitizeBlogPatch({ heroImage: "/x.webp" })), "invalid_patch");
// E11 — TITLE IS EDITABLE (#216). It was rejected on the false claim that it is the slug; the
// slug is the FILENAME and this is a frontmatter key that moves nothing when patched. It now
// sanitizes exactly like dek: a string is accepted, a non-string is rejected. A blank string
// is accepted HERE (the read path falls back to the slug); publish is where it is required —
// see validate-blog-post and f3-slug.
t("E11 title is now ACCEPTED as a string (it is a display field, not the slug)",
  sanitizeBlogPatch({ title: "New" }), { ok: true, patch: { title: "New" } });
t("E11b a blank title is accepted at SAVE (the read path falls back to the slug; publish requires it)",
  sanitizeBlogPatch({ title: "" }), { ok: true, patch: { title: "" } });
t("E11c a non-string title is still rejected, like dek",
  codeOf(sanitizeBlogPatch({ title: 5 })), "invalid_patch");
t("E12 an unknown field is rejected", codeOf(sanitizeBlogPatch({ nope: 1 })), "invalid_patch");
t("E13 a non-object patch is rejected", codeOf(sanitizeBlogPatch([])), "invalid_patch");
t("E14 an empty patch is accepted", sanitizeBlogPatch({}), { ok: true, patch: {} });

/* ------------------------------------------- F. the create path */
t("F1 title is required", codeOf(sanitizeBlogCreate({})), "invalid_patch");
t("F2 a blank title is rejected", codeOf(sanitizeBlogCreate({ title: "   " })), "invalid_patch");
t("F3 title alone is enough", sanitizeBlogCreate({ title: "A Post" }), { ok: true, value: { title: "A Post", dek: "", date: "" } });
t("F4 status is REJECTED on create (a new post is always a draft)", codeOf(sanitizeBlogCreate({ title: "A", status: "published" })), "invalid_patch");
t("F5 blocks rejected on create", codeOf(sanitizeBlogCreate({ title: "A", blocks: [] })), "invalid_patch");
t("F6 heroImage rejected on create", codeOf(sanitizeBlogCreate({ title: "A", heroImage: null })), "invalid_patch");
t("F7 a malformed date is rejected on create too", codeOf(sanitizeBlogCreate({ title: "A", date: "nope" })), "invalid_patch");
t("F8 an empty date is allowed on create", okOf(sanitizeBlogCreate({ title: "A", date: "" })), true);
t("F9 topic is omitted when empty", sanitizeBlogCreate({ title: "A", topic: "" }).value.topic, undefined);

console.log(`\nblog-format result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
