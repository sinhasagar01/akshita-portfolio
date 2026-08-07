// The inline blog canvas — the attribute contract, the rich/plain split, and paste.
// Run: node --experimental-strip-types ralph/tests/inline-canvas.mjs
//
// PART A IS THE ONE THAT PROTECTS THE ARTICLE. `inlineEditProps` returns `{}` when editable
// is false, which is what keeps the public render byte-identical — the entire arc rests on
// it. "True by construction" is exactly the class of claim this project has been wrong about
// four times (a name, a count, a constant, a scope estimate), so it is asserted rather than
// trusted.
//
// PART B IS THE ONE THAT PROTECTS THE CONTENT. A field tagged `rich` round-trips through
// richToMarkers; a field not tagged takes innerText. Tag `heading` rich by mistake and
// markers can appear in a field the renderer never renders them in; FAIL to tag richText and
// every `**bold**` already on disk is silently stripped the first time someone focuses a
// paragraph and blurs it. The second is the dangerous direction, because it destroys content
// that was already published.
//
// WHAT THIS SUITE CANNOT REACH. `paragraphCaret` and `placeCaret` are DOM algorithms
// (getSelection, createRange, createTreeWalker), so plain node cannot run them and their
// proof is the browser-driven gate instead. That split is deliberate and pre-existing: the
// PURE half of the same feature lives in paragraph-edits.ts precisely so the array math is
// unit-testable away from carets. Do not fake a DOM here to close the gap — a fake would
// prove the fake.
import { readFileSync } from "node:fs";
import { inlineEditProps } from "../../components/case-study/editable.ts";
import { splitParagraph, mergeParagraph, plainLength } from "../../lib/studio/paragraph-edits.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* ================================================================= A. editable OFF emits NOTHING
 * The article's guarantee. */
const off = inlineEditProps(false, 0, "paragraphs.0", "Edit paragraph", true);
t("A: editable OFF yields an EMPTY prop bag", off, {});
t("A: …with no keys at all", Object.keys(off).length, 0);
// Spelled out individually, because a partial leak is the failure that would still look
// mostly right in a diff.
for (const k of ["contentEditable", "tabIndex", "role", "aria-label", "data-edit-block-index", "data-edit-value-path", "data-edit-rich"]) {
  t(`A: editable OFF omits ${k}`, k in off, false);
}

/* ================================================================= B. editable ON, and the rich split */
const p0 = inlineEditProps(true, 2, "paragraphs.0", "Edit paragraph", true);
t("B: a paragraph is contentEditable", p0.contentEditable, true);
t("B: …carries its BLOCK index", p0["data-edit-block-index"], 2);
t("B: …carries its PARAGRAPH path", p0["data-edit-value-path"], "paragraphs.0");
t("B: …is a labelled textbox", [p0.role, p0["aria-label"]], ["textbox", "Edit paragraph"]);
t("B: …is tagged RICH", "data-edit-rich" in p0, true);

// heading: the one prose field that is NOT rich. The schema is explicit that a heading
// carries no inline marks, so its blur must take innerText.
const h = inlineEditProps(true, 1, "text", "Edit heading");
t("B: a heading is editable", h.contentEditable, true);
t("B: a heading is NOT tagged rich", "data-edit-rich" in h, false);

const q = inlineEditProps(true, 3, "text", "Edit pull quote", true);
t("B: a pull quote IS tagged rich", "data-edit-rich" in q, true);
const cap = inlineEditProps(true, 4, "caption", "Edit image caption", true);
t("B: an image caption IS tagged rich", "data-edit-rich" in cap, true);
t("B: …and points at `caption`, not a paragraph", cap["data-edit-value-path"], "caption");

/* ================================================================= C. the path scheme
 * `paragraphCaret` matches /^paragraphs\.(\d+)$/ and nothing else, so the paths the renderer
 * emits and the paths the caret reader accepts have to be the same shape. Asserted here
 * because the two live in different files and nothing types them together. */
const PARA = /^paragraphs\.(\d+)$/;
t("C: an emitted paragraph path is one the caret reader accepts",
  PARA.test(inlineEditProps(true, 0, "paragraphs.7")["data-edit-value-path"]), true);
t("C: `text` is NOT a paragraph path", PARA.test("text"), false);
t("C: `caption` is NOT a paragraph path", PARA.test("caption"), false);
// A non-paragraph field must never be treated as one, or Enter would try to split it.
t("C: the index round-trips", Number(PARA.exec("paragraphs.12")[1]), 12);

/* ================================================================= D. PASTE
 * The split rule the paste handler uses, exercised as pure list surgery. The handler
 * brackets the pasted run with the caret's own halves and routes through the same
 * splitParagraph that Enter uses, so there is ONE definition of a paragraph break. */
const splitPaste = (raw) => raw.split(/\r?\n\s*\r?\n|\r?\n/).map((x) => x.trim()).filter((x) => x !== "");
t("D: two lines become TWO entries", splitPaste("one\ntwo"), ["one", "two"]);
t("D: a blank line between them is ONE break, not two", splitPaste("one\n\ntwo"), ["one", "two"]);
t("D: CRLF splits the same as LF", splitPaste("one\r\ntwo"), ["one", "two"]);
t("D: trailing whitespace lines are dropped", splitPaste("one\n\n  \n\ntwo\n"), ["one", "two"]);
t("D: a single line stays single (the browser handles it)", splitPaste("just one").length, 1);
t("D: empty paste yields nothing", splitPaste(""), []);

// The merge the handler performs: caret halves bracket the pasted run.
const pasteInto = (list, index, before, after, parts) => {
  const merged = [before + parts[0], ...parts.slice(1, -1), parts[parts.length - 1] + after];
  return [...list.slice(0, index), ...merged, ...list.slice(index + 1)];
};
t("D: pasting 2 paragraphs mid-line keeps the text either side",
  pasteInto(["AB"], 0, "A", "B", ["one", "two"]), ["Aone", "twoB"]);
t("D: pasting 3 paragraphs yields 3 entries",
  pasteInto(["x"], 0, "", "", ["a", "b", "c"]), ["a", "b", "c"]);
t("D: surrounding entries are untouched",
  pasteInto(["first", "AB", "last"], 1, "A", "B", ["one", "two"]),
  ["first", "Aone", "twoB", "last"]);

/* ================================================================= E. split/merge still invert
 * paragraph-edits has its own 28-assertion suite; this asserts only the property THIS arc
 * depends on — that Enter followed by Backspace is a no-op, which is what makes the caret
 * restoration read as one keystroke rather than a jump. */
{
  const list = ["hello world"];
  const afterSplit = splitParagraph(list, 0, "hello ", "world");
  t("E: Enter splits into two", afterSplit, ["hello ", "world"]);
  const { paragraphs: back, caret } = mergeParagraph(afterSplit, 1);
  t("E: Backspace merges back to the original", back, ["hello world"]);
  /* ⚠ 6, NOT `plainLength("hello ")`. Computing the expectation with the production helper means a
   * broken `plainLength` moves both sides and the row passes. The literal is the whole point of a
   * fixture whose input is also a literal. */
  t("E: …with the caret at the join", caret, 6);
}
// THE CARET MUST COUNT VISIBLE CHARACTERS, NOT MARKER CHARACTERS, and this case is the only
// one that can tell the difference. Mutation-testing this suite found the first version
// used a marker-FREE prefix, where plainLength(s) and s.length are equal — so a caret that
// counted `**` would have passed. The caret lives in the rendered DOM, where `**bold**` is
// four characters of bold text and not eight of syntax.
{
  const split = splitParagraph(["**bold** and more"], 0, "**bold** ", "and more");
  const { caret } = mergeParagraph(split, 1);
  t("E: the join offset counts RENDERED characters, not markers", caret, 5);
  t("E: …which is NOT the marker-string length", caret === "**bold** ".length, false);
}
// Markers survive a split that does not cut through them.
t("E: bold entirely on one side survives a split",
  splitParagraph(["**bold** tail"], 0, "**bold** ", "tail"), ["**bold** ", "tail"]);
// And the caret offset counts VISIBLE characters, not marker characters.
t("E: the join offset ignores marker syntax", plainLength("**bold**"), 4);

/* ================================================================= F. ONE TOOLBAR, TWO CANVASES
 * The toolbar was module-private inside SectionsEditPanel until the blog canvas needed it.
 * Extracting it rather than copying it is what keeps ONE definition of which marks exist —
 * bold, italic and link, because those are what RichRun can express. A second copy would
 * drift the first time a mark was added to one collection.
 *
 * Structural assertions, because the toolbar itself is DOM-and-execCommand and plain node
 * cannot run it. These prove the WIRING, not the behaviour; the behaviour is browser-driven. */
const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const toolbar = code("components/studio/BoldToolbar.tsx");
const sections = code("components/studio/SectionsEditPanel.tsx");
const blog = code("components/studio/BlogBlocksEditPanel.tsx");

t("F: the toolbar is its own module with a default export",
  /export default function BoldToolbar/.test(toolbar), true);
t("F: SectionsEditPanel IMPORTS it rather than defining it",
  [/import BoldToolbar from "\.\/BoldToolbar"/.test(sections), /function BoldToolbar\(/.test(sections)],
  [true, false]);
t("F: the blog canvas imports the SAME module",
  /import BoldToolbar from "\.\/BoldToolbar"/.test(blog), true);
// Three marks, no more. A greyed button advertises a capability RichRun cannot express.
t("F: it offers exactly bold, italic and link",
  ["Bold", "Italic", "Link"].filter((l) => toolbar.includes(`aria-label="${l}"`)).length, 3);
t("F: …and nothing the parser cannot round-trip",
  /aria-label="(Underline|Strikethrough|Heading|List)"/.test(toolbar), false);
// Both canvases must mark the tree untrusted after a command, or the rebuild never fires.
t("F: both canvases pass an onCommand that sets boldDirty",
  [/onCommand=\{\(\) => \{?\s*boldDirty\.current = true/.test(sections),
   /onCommand=\{\(\) => \{ boldDirty\.current = true/.test(blog)], [true, true]);
// The attribute contract the hide-logic keys off, in both hosts.
t("F: both hosts treat the toolbar as part of the edit surface",
  [sections.includes("data-rich-toolbar"), blog.includes("data-rich-toolbar")], [true, true]);

console.log(`\ninline-canvas result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
