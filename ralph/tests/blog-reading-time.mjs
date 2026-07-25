// Unit suite for the blog reading-time computation (blog arc, PR 2).
//
// Run: node --experimental-strip-types ralph/tests/blog-reading-time.mjs
//
// The contract says reading time is COMPUTED from the blocks, never authored. This pins
// that computation: the word count sums the words a reader reads (heading, richText
// paragraphs, pullQuote, videoEmbed caption), 200 wpm, ceil, floored at 1 minute so even
// a one-line post reads as "1 min". It is defensive about shape (the reader hands blocks
// through untyped), so a malformed block contributes 0 rather than throwing.
import { readingTimeMinutes } from "../../lib/blog/select.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got ${got}  want ${want}`));
  ok ? pass++ : fail++;
};

const words = (n) => Array.from({ length: n }, () => "word").join(" ");
const rich = (...paras) => ({ discriminant: "richText", value: { paragraphs: paras } });
const heading = (text) => ({ discriminant: "heading", value: { text } });
const quote = (text) => ({ discriminant: "pullQuote", value: { text } });
const video = (caption) => ({ discriminant: "videoEmbed", value: { caption } });

/* --------------------------------------------- floor + non-array defensiveness */
t("A1 non-array -> 1", readingTimeMinutes(undefined), 1);
t("A2 empty array -> 1", readingTimeMinutes([]), 1);
t("A3 a few words -> 1 (floor)", readingTimeMinutes([rich(words(12))]), 1);

/* --------------------------------------------- the 200-wpm boundary */
t("B1 exactly 200 words -> 1", readingTimeMinutes([rich(words(200))]), 1);
t("B2 201 words -> 2", readingTimeMinutes([rich(words(201))]), 2);
t("B3 400 words -> 2", readingTimeMinutes([rich(words(400))]), 2);
t("B4 401 words -> 3", readingTimeMinutes([rich(words(401))]), 3);

/* --------------------------------------------- multi-kind + multi-block summing */
t("C1 sums across kinds", readingTimeMinutes([
  heading(words(3)), quote(words(4)), rich(words(100), words(100)), video(words(3)),
]), 2); // 3+4+200+3 = 210 -> ceil(210/200) = 2
t("C2 sums across multiple richText blocks", readingTimeMinutes([
  rich(words(150)), rich(words(150)),
]), 2); // 300 -> 2

/* --------------------------------------------- malformed shapes contribute 0 */
t("D1 null block -> 0 words -> floor 1", readingTimeMinutes([null]), 1);
t("D2 block with null value -> floor 1", readingTimeMinutes([{ discriminant: "richText", value: null }]), 1);
t("D3 unknown kind contributes nothing", readingTimeMinutes([{ discriminant: "mystery", value: { text: words(500) } }]), 1);
t("D4 non-string paragraph ignored, string counted", readingTimeMinutes([
  { discriminant: "richText", value: { paragraphs: [words(201), 42, null] } },
]), 2);

console.log(`\nblog-reading-time result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
