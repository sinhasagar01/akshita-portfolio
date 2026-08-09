// The canvas head — the shared component, the article-only id, and the live reading time.
// Run: node --experimental-strip-types ralph/tests/canvas-head.mjs
//
// PART A IS THE ONE THE PARITY HARNESS CANNOT MAKE. `id="blog-article-head"` is read by
// ReadingVessel via document.getElementById, and the harness renders BOTH sides on one page.
// An unconditional id would put a duplicate in the document and hand getElementById whichever
// came first. The parity walk compares BOXES, so a duplicate id is exactly the kind of defect
// it would pass clean — which is why this assertion lives here instead.
//
// PART B PROTECTS THE READ-ONLY DECISION. The head is preview only, and three of its five
// fields are not merely unimplemented but UNEDITABLE:
//   - `title` IS the slug (keystatic slugField), and sanitizeBlogPatch rejects the key, so a
//     contenteditable title would 400 on the first keystroke.
//   - `readingTime` is computed from the blocks.
//   - `date` is stored ISO and rendered long-form, so editing the rendered text means parsing
//     a display string back to ISO — a bad parse writes a WRONG date rather than failing.
// If someone later spreads inlineEditProps into this component, these assertions fail and the
// reason is right here rather than in a commit message nobody reads.
//
// PART C IS THE LIVE READING TIME. The article computes it from the blocks at build time. A
// canvas that showed a server-supplied number would drift from the article the moment a
// paragraph was added, and the drift would look like a rendering bug rather than a stale prop.
import { readFileSync } from "node:fs";
import { readingTimeMinutes } from "../../lib/blog/select.ts";
import { formatLongDate } from "../../lib/blog/format.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const head = code("components/blog/BlogArticleHead.tsx");
const article = code("app/(portfolio)/blog/[slug]/page.tsx");
const canvas = code("components/studio/BlogBlocksEditPanel.tsx");
const panel = code("components/studio/BlogEditPanel.tsx");
const harness = code("app/dev/blog-parity/[slug]/page.tsx");

/* ================================================================= A. THE ARTICLE-ONLY id */
t("A: the id is CONDITIONAL on the canvas flag",
  /id=\{canvas \? undefined : "blog-article-head"\}/.test(head), true);
/* ⚠ THE END CONDITION THIS ROW NAMED HAS FIRED, AND THE ROW IS INVERTED RATHER THAN DELETED. It
 * read: "The consumer that makes it matter. If ReadingVessel ever stops resolving by id, the
 * condition can go — but not before." Correct, and written in advance, which is the whole value of
 * writing one.
 *
 * ReadingVessel stopped resolving by that id when its scroll gate was removed — the id was read to
 * decide whether the reader was past the title, and an always-on indicator asks nobody. So the
 * consumer is gone and the assertion is now the opposite one: NOTHING resolves it, which is what
 * makes the conditional id removable.
 *
 * ⚠ THE CONDITIONAL IS LEFT IN PLACE ON PURPOSE. "Can go" is not "must go", and removing it touches
 * the canvas parity contract, which is a different unit from an indicator change. TRIGGER: it goes
 * whenever someone is already in BlogArticleHead, and this row will not object. */
t("A: ⚠ NOTHING RESOLVES THE HEAD BY THAT id ANY MORE — the condition's reason is gone and the condition is now removable",
  /getElementById\("blog-article-head"\)/.test(code("components/blog/ReadingVessel.tsx")), false);
t("A: the article renders it WITHOUT the canvas flag",
  /<BlogArticleHead[\s\S]{0,200}?\/>/.test(article) && !/<BlogArticleHead[\s\S]{0,200}?canvas[\s\S]{0,40}?\/>/.test(article), true);
t("A: the canvas renders it WITH the flag", /canvas\s*\n\s*\/>/.test(canvas), true);
// Both harness sides render the component, so a hard-coded id would duplicate.
t("A: the harness renders BOTH sides of a head pair",
  (harness.match(/<BlogArticleHead/g) ?? []).length, 2);
t("A: …and the id is not hard-coded anywhere outside the component",
  [/"blog-article-head"/.test(article), /"blog-article-head"/.test(canvas)], [false, false]);

/* ================================================================= B. PREVIEW ONLY */
t("B: nothing in the head is contentEditable", /contentEditable/.test(head), false);
t("B: …and it does not import the edit props", /inlineEditProps/.test(head), false);
t("B: …and carries no edit affordance class", /EDIT_AFFORD|blog-editable/.test(head), false);
// The three fields that CANNOT be edited, each for its own reason. Asserted against the
// source of truth rather than the comment.
const kconfig = code("keystatic.config.ts");
t("B: title SEEDS the slug at create (slugField), but that is a create-time derivation, not a lock", /slugField: "title"/.test(kconfig), true);
t("B: …declared as fields.slug", /title: fields\.slug\(/.test(kconfig), true);
// #216 — the write path ACCEPTS a title patch now. It used to reject it on the false claim
// that title IS the slug; the slug is the filename and this is a frontmatter key. The old
// rejection string must be GONE, not merely unmatched, so a copy does not linger elsewhere.
t("B: the write path ACCEPTS a title patch (it is a display field, not the slug)",
  /patch\.title = value;/.test(code("lib/studio/blog-format-core.ts")), true);
t("B: …and the old 'title is the entry slug' rejection is gone from the blog sanitizer",
  /title is the entry slug and cannot be edited here/.test(code("lib/studio/blog-format-core.ts")), false);
t("B: the date is rendered long-form, not in its stored ISO shape",
  /formatLongDate\(date\)/.test(head), true);
t("B: …and the stored shape is what the sanitizer validates",
  /date must be formatted YYYY-MM-DD/.test(code("lib/studio/blog-format-core.ts")), true);

/* ================================================================= C. THE LIVE READING TIME */
t("C: the canvas RECOMPUTES it from the current blocks",
  /readingTime=\{readingTimeMinutes\(blocks\)\}/.test(canvas), true);
t("C: …importing the same function the article's reader uses",
  /import \{ readingTimeMinutes \} from "@\/lib\/blog\/select"/.test(canvas), true);
// The head fields come from the LIVE form, not the server props, or typing in the inspector
// would not move the canvas.
t("C: the head values are the form's working copy",
  [/headDek=\{values\.dek\}/.test(panel), /headDate=\{values\.date\}/.test(panel), /headTopic=\{values\.topic\}/.test(panel)],
  [true, true, true]);
// The title is NOT among them: it is the slug, already a prop, and read-only.
t("C: the title is not threaded as a head form value", /headTitle/.test(panel), false);

/* ================================================================= D. readingTimeMinutes ITSELF
 * The function the canvas now runs on every keystroke. Its behaviour is the article's too. */
t("D: a non-array yields the floor of 1", readingTimeMinutes(null), 1);
t("D: an empty post is 1 minute, never 0", readingTimeMinutes([]), 1);
{
  const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
  const post = (n) => [{ discriminant: "richText", value: { paragraphs: [words(n)] } }];
  t("D: 200 words is 1 minute", readingTimeMinutes(post(200)), 1);
  t("D: 201 words rounds UP to 2", readingTimeMinutes(post(201)), 2);
  t("D: adding a paragraph can move the number", readingTimeMinutes(post(400)), 2);
}
// AN UNKNOWN KIND CONTRIBUTES NOTHING RATHER THAN THROWING, which is what keeps a canvas
// keystroke from crashing the editor on a block shape the counter has not met.
t("D: an unknown kind does not throw", readingTimeMinutes([{ discriminant: "nope", value: {} }]), 1);

/* ================================================================= E. THE DATE RENDERING
 * Shared by both surfaces, so the canvas cannot show a different date format. */
t("E: an ISO date renders long-form", formatLongDate("2026-07-24"), "24 July 2026");
t("E: a malformed date passes through rather than throwing", formatLongDate("nonsense"), "nonsense");

console.log(`\ncanvas-head result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
