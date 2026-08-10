// The advisory mark and the publish wall read the SAME rule set.
//
// ⚠ THE ORIGIN IS THE ARGUMENT. The owner hit the draft-marker wall and then the alt wall on the
// same post, both on fields written days earlier — two round trips through publish to learn two
// facts the editor already had. No gate here could have produced that finding: it needed an author
// using the editor, which is why the board ranked it first.
//
// TWO HALVES, AND THEY DO DIFFERENT WORK. THE MARK moves the DISCOVERY to authoring time. THE TOAST
// makes the MOMENT legible when a wall is still hit. Neither replaces the other — the mark cannot
// catch a hand-committed file, and the toast cannot save the round trip.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const { publishBlockers, validateBlogPost, DRAFT_MARKER } = await import("../../lib/studio/validate-blog-post.ts");

console.log("A · the rule set is real, and it is the AUTHOR-REACHABLE subject");
const TOPICS = ["Motion in Design", "Systems"];
t("A1 a clean published post has no blockers",
  publishBlockers({ raw: "x", title: "T", topic: "Systems", blocks: [] }, TOPICS), []);
t("A2 …and each of the four fires on its own state",
  [
    publishBlockers({ raw: `a ${DRAFT_MARKER} b`, title: "T", topic: "Systems" }, TOPICS).map((b) => b.field),
    publishBlockers({ raw: "x", title: "  ", topic: "Systems" }, TOPICS).map((b) => b.field),
    publishBlockers({ raw: "x", title: "T", topic: "" }, TOPICS).map((b) => b.field),
    publishBlockers({ raw: "x", title: "T", topic: "Nope" }, TOPICS).map((b) => b.field),
  ], [["body"], ["title"], ["topic"], ["topic"]]);
t("A3 ⚠ AND THE ALT RULE MATCHES THE VALIDATOR'S EXACT PREDICATE — src set, not decorative, alt blank",
  [
    publishBlockers({ blocks: [{ discriminant: "imageBlock", value: { src: "a.png", alt: "" } }] }, TOPICS).length,
    publishBlockers({ blocks: [{ discriminant: "imageBlock", value: { src: "a.png", alt: "", decorative: true } }] }, TOPICS).length,
    publishBlockers({ blocks: [{ discriminant: "imageBlock", value: { src: null, alt: "" } }] }, TOPICS).length,
    publishBlockers({ blocks: [{ discriminant: "imageBlock", value: { src: "a.png", alt: "A cat" } }] }, TOPICS).length,
  ], [1, 0, 0, 0]);
/* ⚠ MALFORMED BLOCKS ARE THE SHAPE RULES' SUBJECT, NOT THIS ONE'S. A crash here would take the
 * inspector down on a file the shape rules exist to refuse politely. */
t("A4 …and malformed blocks are skipped rather than crashed on",
  publishBlockers({ blocks: [null, "x", { discriminant: "imageBlock", value: null }] }, TOPICS), []);

console.log("\nB · one source — the wall's message IS the mark's message");
/* ⚠ WHAT THESE ROWS PROVE IS DERIVATION, NOT AGREEMENT — AND THE TITLE ONCE CLAIMED THE LATTER.
 * Mutating a message inside `publishBlockers` moves BOTH sides together and every row survives:
 * with one source there is no second string to disagree with, which is the architecture working
 * rather than the test failing. So they assert the wall ROUTES THROUGH the mark's function, adding
 * only the slug prefix. The mutation that kills them is a second spelling being BORN — an inline
 * message reinstated ahead of the shared call — and that is the one that was run. */
const y = (o) => Object.entries(o).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
for (const [name, doc, field] of [
  ["blank title", { status: "published", title: "", topic: "Systems" }, "title"],
  ["unset topic", { status: "published", title: "T", topic: "" }, "topic"],
  ["off-set topic", { status: "published", title: "T", topic: "Nope" }, "topic"],
]) {
  const raw = y(doc);
  const wall = validateBlogPost("slug", raw, TOPICS);
  const mark = publishBlockers({ raw, ...doc }, TOPICS).find((b) => b.field === field);
  t(`B1 ${name}: the wall refuses, and its message is the mark's sentence slug-prefixed — derivation, not agreement`,
    [wall.ok, wall.ok ? null : wall.error.message], [false, `slug: ${mark.message}`]);
}
t("B2 ⚠ AND THE DRAFT MARKER TOO — assembled, never transcribed, in the gate that forbids it",
  (() => { const raw = y({ status: "published", title: "T", topic: "Systems" }) + `\nbody: "${DRAFT_MARKER}"`;
    const w = validateBlogPost("s", raw, TOPICS);
    return w.ok ? null : w.error.message === `s: ${publishBlockers({ raw }, TOPICS)[0].message}`; })(), true);
t("B3 …and a DRAFT is never judged, so the mark is advisory and the wall is at publish",
  validateBlogPost("s", y({ status: "draft", title: "", topic: "" }), TOPICS).ok, true);

console.log("\nC · the mark is wired, and reads the validator rather than a copy of it");
const registry = src("components/studio/blocks/blog-registry.tsx");
const panel = src("components/studio/BlogEditPanel.tsx");
const fields = src("components/studio/blocks/fields.tsx");
t("C1 both call sites import the validator's function — not a local table",
  [/import \{ publishBlockers \} from "@\/lib\/studio\/validate-blog-post"/.test(registry),
   /import \{ publishBlockers \} from "@\/lib\/studio\/validate-blog-post"/.test(panel)], [true, true]);
/* ⚠ SCOPED TO TextField'S OWN BLOCK. The first version tested the whole file and failed on a
 * `role="alert"` belonging to a different field — the wrong-subject shape inside the assertion. */
const textField = fields.slice(fields.indexOf("export function TextField("), fields.indexOf("export function TextArea("));
t("C2 …and TextField's mark is ADVISORY — described, not asserted, so a draft is not interrupted",
  [/aria-describedby=\{blocker/.test(textField), /role="alert"/.test(textField)], [true, false]);
t("C3 ⚠ AND NO SECOND SPELLING OF A RULE'S CONDITION — the call sites ask publishBlockers, they do not re-test",
  [/value\.alt/.test(registry) && !/alt\s*===\s*""/.test(registry),
   !/topic\s*===\s*""/.test(panel)], [true, true]);

console.log("\nD · the toast, both paths — the projects branch #451 never added");
const bar = src("components/studio/PublishBar.tsx");
t("D1 ⚠ BOTH REFUSAL CODES HAVE A BRANCH — invalid_sections fell through to 'something went wrong', a network error's wording for a content refusal",
  [/code === "invalid_blocks"/.test(bar), /code === "invalid_sections"/.test(bar)], [true, true]);
t("D2 …and both use the SERVER's message, the only text that knows which entry and which rule",
  (bar.match(/json\?\.error\?\.message/g) ?? []).length >= 2, true);

console.log(`\ninspector-validation result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
