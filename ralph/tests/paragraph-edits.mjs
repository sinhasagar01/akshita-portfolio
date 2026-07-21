// Unit suite for the richText paragraph array surgery.
//
// Run: node --experimental-strip-types ralph/tests/paragraph-edits.mjs
//
// WHY IT EXISTS. `richText` stores prose as an ARRAY of strings, one per paragraph, so
// Enter and Backspace at a boundary change how many items there are. That is the one
// place inline editing can corrupt the SHAPE of the file rather than a value: a split
// that drops the tail loses a paragraph of copy, a merge that leaves `""` behind puts an
// empty <p> on the public page. The array math is pure, so it is exercised here away
// from carets and React.
//
// The load-bearing property is that split and merge are INVERSES: splitting at a point
// and merging back must return the original list, markers and all.
import { splitParagraph, mergeParagraph, plainLength } from "../../lib/studio/paragraph-edits.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  const ok = g === w;
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${g}\n     want ${w}`));
  ok ? pass++ : fail++;
};

console.log("split — Enter grows the array at the caret");
t("splits one item into two",
  splitParagraph(["one two"], 0, "one ", "two"), ["one ", "two"]);
t("keeps the paragraphs before and after untouched",
  splitParagraph(["a", "b c", "d"], 1, "b ", "c"), ["a", "b ", "c", "d"]);
t("Enter at the very end leaves an empty new paragraph to type into",
  splitParagraph(["done"], 0, "done", ""), ["done", ""]);
t("Enter at the very start pushes the text down",
  splitParagraph(["text"], 0, "", "text"), ["", "text"]);
t("array grows by exactly one",
  splitParagraph(["a", "b", "c"], 1, "x", "y").length, 4);

console.log("\nsplit — bold either side of the caret survives");
t("bold entirely BEFORE the caret is preserved",
  splitParagraph(["**Lead** then rest"], 0, "**Lead** then ", "rest"),
  ["**Lead** then ", "rest"]);
t("bold entirely AFTER the caret is preserved",
  splitParagraph(["intro **Bold**"], 0, "intro ", "**Bold**"),
  ["intro ", "**Bold**"]);
t("bold on BOTH sides is preserved",
  splitParagraph(["**a** mid **b**"], 0, "**a** mid ", "**b**"),
  ["**a** mid ", "**b**"]);

console.log("\nmerge — Backspace at the start folds into the paragraph above");
t("merges two items into one",
  mergeParagraph(["one ", "two"], 1).paragraphs, ["one two"]);
t("array shrinks by exactly one",
  mergeParagraph(["a", "b", "c"], 2).paragraphs.length, 2);
t("caret lands at the join, in PLAIN characters",
  mergeParagraph(["one ", "two"], 1).caret, 4);
t("caret skips markers when counting the join",
  mergeParagraph(["**bold** x", "tail"], 1).caret, 6); // "bold x" is 6 visible chars
t("neighbours are untouched",
  mergeParagraph(["keep", "a", "b", "last"], 2).paragraphs, ["keep", "ab", "last"]);

console.log("\nmerge — the empty-paragraph path (no orphan '' left behind)");
t("backspacing an EMPTY paragraph removes the item cleanly",
  mergeParagraph(["text", ""], 1).paragraphs, ["text"]);
t("  and the caret stays at the end of the kept text",
  mergeParagraph(["text", ""], 1).caret, 4);
t("merging INTO an empty paragraph keeps the text, drops the empty",
  mergeParagraph(["", "text"], 1).paragraphs, ["text"]);
t("no empty string survives either way",
  mergeParagraph(["text", ""], 1).paragraphs.includes(""), false);

console.log("\nguards — a keystroke racing a re-render must never destroy content");
t("merge at index 0 is a no-op (nothing above to merge into)",
  mergeParagraph(["a", "b"], 0).paragraphs, ["a", "b"]);
t("merge past the end is a no-op",
  mergeParagraph(["a"], 5).paragraphs, ["a"]);
t("split past the end is a no-op",
  splitParagraph(["a"], 9, "x", "y"), ["a"]);
t("split at a negative index is a no-op",
  splitParagraph(["a"], -1, "x", "y"), ["a"]);

console.log("\nsplit and merge are INVERSES — the round trip is the real guarantee");
for (const [list, i, before, after] of [
  [["one two"], 0, "one ", "two"],
  [["**a** mid **b**"], 0, "**a** mid ", "**b**"],
  [["keep", "split here", "tail"], 1, "split ", "here"],
]) {
  const splitList = splitParagraph(list, i, before, after);
  const back = mergeParagraph(splitList, i + 1).paragraphs;
  t(`round-trip ${JSON.stringify(list[i])}`, back, list);
}

console.log("\nplainLength — what the caret counts");
t("plain text", plainLength("hello"), 5);
t("markers are not characters", plainLength("**bold**"), 4);
t("mixed", plainLength("a **b** c"), 5); // "a b c"
t("empty", plainLength(""), 0);

console.log(`\n${fail === 0 ? "ALL PASS" : `${fail} FAILURE(S)`} — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
