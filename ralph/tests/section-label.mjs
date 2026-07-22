// Unit suite for the section label fallback chain.
//
// Run: node --experimental-strip-types ralph/tests/section-label.mjs
//
// WHY IT EXISTS. A section's id is a DOM anchor the owner edits, not a label. Three
// sections ship with no authored eyebrow or title (hero, final-video, closing), and the
// label used to fall straight to the id, printing the bare slug on the studio board and,
// via the preview rail, the public page. The chain is the one place that name is derived,
// so the board, the focused editor, and the rail can never disagree — and the
// load-bearing property is that a RAW SLUG never survives to a label.
import { humanizeId, sectionDisplayLabel } from "../../lib/case-studies/section-label.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  const ok = g === w;
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${g}\n     want ${w}`));
  ok ? pass++ : fail++;
};

console.log("humanizeId — slug becomes a sentence-case label");
t("hyphenated id", humanizeId("final-video"), "Final video");
t("single word id", humanizeId("hero"), "Hero");
t("closing", humanizeId("closing"), "Closing");
t("underscores too", humanizeId("before_after"), "Before after");
t("collapses repeated separators", humanizeId("a--b__c"), "A b c");
t("already capitalised / spaced id is left readable", humanizeId("Fosfor AI"), "Fosfor AI");
t("undefined id -> empty", humanizeId(undefined), "");
t("blank id -> empty", humanizeId(""), "");
t("all-separator id -> empty", humanizeId("--"), "");

console.log("\nchain — title > eyebrow > humanized id > Section N");
t("title wins over everything", sectionDisplayLabel({ title: "T", eyebrow: "E", id: "x" }, 0), "T");
t("multi-line title flattens to one line (not truncated)", sectionDisplayLabel({ title: "Line one\nLine two", id: "x" }, 0), "Line one Line two");
t("eyebrow when no title", sectionDisplayLabel({ eyebrow: "Goals", id: "goals" }, 4), "Goals");
t("whitespace-only title falls through to eyebrow", sectionDisplayLabel({ title: "   ", eyebrow: "Goals" }, 0), "Goals");
t("humanized id when no title/eyebrow — final-video", sectionDisplayLabel({ id: "final-video" }, 10), "Final video");
t("humanized id — hero", sectionDisplayLabel({ id: "hero" }, 0), "Hero");
t("humanized id — closing", sectionDisplayLabel({ id: "closing" }, 13), "Closing");
t("positional fallback when everything is blank", sectionDisplayLabel({}, 4), "Section 5");
t("positional fallback with all-separator id", sectionDisplayLabel({ id: "--" }, 0), "Section 1");

console.log("\ninvariant — a raw slug NEVER survives as a label");
for (const id of ["hero", "final-video", "closing", "before-after", "my_slug"]) {
  const label = sectionDisplayLabel({ id }, 0);
  t(`"${id}" is not printed verbatim`, label === id, false);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
