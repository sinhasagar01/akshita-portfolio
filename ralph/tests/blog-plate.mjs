// THE PLATE DRAWS THE TOPIC, AND THE CARD BESIDE IT DRAWS THE TITLE.
// Run: node --experimental-strip-types ralph/tests/blog-plate.mjs
//
// ---- ⚠ WHY THIS EXISTS: THE DEFECT WAS INVISIBLE FOR AS LONG AS NOTHING USED THE COMPONENT ----
//
// `.blog-plate` is the fallback a post's image slot draws when it has no hero. It set the post's
// TITLE in the display serif — correct in isolation, and correct for as long as it was a fallback
// nothing reached. **It had never rendered on this site**: all three posts carried a hero image.
//
// #376 unset two of them and the plate drew for the first time, beside a card that ALSO shows its
// title three lines away. THE TITLE READ TWICE, ADJACENT. Nothing was broken by that PR — it is what
// a title-plate does, and it is the same shape as an assertion that has never had a subject: correct
// under every test it was given, because it was never given the one that mattered.
//
// ⚠ SO THE ROWS BELOW ARE ABOUT A RELATION BETWEEN TWO COMPONENTS, which is why neither component's
// own gate would have caught it. `Shot` was right about plates. `page.tsx` was right about cards.
//
// ---- WHAT THIS CANNOT SEE, STATED ------------------------------------------------------------
//
// It reads source and content. Whether the plate LOOKS like a category rather than a headline is a
// render question — the italic is the mechanism, asserted here, but only a browser can say whether
// it worked. Rendered on cerise, fern and harbour before this file was written.
import { readFileSync, readdirSync } from "node:fs";
import { colourPattern } from "../../lib/theme-contrast.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

const shot = read("components/blog/Shot.tsx");
const index = read("app/(portfolio)/blog/page.tsx");
const css = read("app/globals.css");

console.log("\nA · the plate draws the topic");

/* ⚠ THE DENOMINATOR, AND IT IS A CONSTANT ON PURPOSE. #378 proved that a guard computing its
 * expectation from the subject it is guarding passes when the subject is empty — so this compares
 * file length against a literal rather than against anything derived from the files. */
t("A0 the three subjects were actually read — an empty file passes every row beneath it",
  [shot.length > 500, index.length > 1000, css.length > 10000], [true, true, true]);

/* The plate's text comes from a variable that prefers `topic`. Asserted as the RELATION rather than
 * as an exact expression, so a rename does not fail it and a revert to the title does. */
t("A1 ⚠ THE PLATE'S TEXT PREFERS `topic` — a plate drawing the raw title is the #376 duplication",
  /const\s+plateText\s*=\s*topic[.\w()]*\s*\|\|\s*title/.test(shot), true);
t("A2 …and the plate renders that variable, not `title` directly",
  /<span>\{plateText\}<\/span>/.test(shot), true);
t("A3 ⚠ AND THE FALLBACK SURVIVES — a post with no topic must not draw an EMPTY plate, which is worse",
  /\|\|\s*title/.test(shot), true);

console.log("\nB · every call site passes it, and the card still owns the title");

const shotCalls = [...index.matchAll(/<Shot\b[\s\S]*?\/>/g)].map((m) => m[0]);
console.log(`         ${shotCalls.length} <Shot> call sites in the index`);
t("B0 the call sites were found — a zero here makes B1 vacuous", shotCalls.length >= 2, true);
t("B1 ⚠ EVERY CALL SITE PASSES `topic` — a missing one silently falls back to the title again",
  shotCalls.filter((c) => !/topic=\{/.test(c)).length, 0);
/* `title` is still REQUIRED and still passed: it is the alt text when a hero IS set. Asserting it
 * stays stops a cleanup from deleting the prop along with the duplication. */
t("B2 …and still passes `title`, which is the image's alt text whenever a hero exists",
  shotCalls.filter((c) => !/title=\{/.test(c)).length, 0);
t("B3 ⚠ AND THE CARD ITSELF STILL RENDERS THE TITLE — that half was never the defect",
  (index.match(/\{post\.title\}/g) ?? []).length >= 2, true);

console.log("\nC · the topic is real content, not a hopeful field");

const posts = readdirSync(url("content/blog")).filter((f) => f.endsWith(".yaml"));
const topics = posts.map((f) => ({ post: f, topic: (/^topic:\s*(.+)$/m.exec(read(`content/blog/${f}`))?.[1] ?? "").trim() }));
console.log(`         ${posts.length} posts; topics — ${topics.map((x) => x.topic || "(none)").join(", ")}`);
t("C0 there are posts to check", posts.length >= 3, true);
t("C1 ⚠ EVERY POST CARRIES A TOPIC, so the title fallback is currently UNREACHED rather than untested",
  topics.filter((x) => !x.topic).map((x) => x.post), []);
/* ⚠ AND THE TOPIC MUST NOT BE THE TITLE. If an author typed the headline into the topic field the
 * duplication would return with every gate above still green — the relation this file exists for,
 * one layer up in the content rather than the code. */
t("C2 ⚠ NOR IS ANY TOPIC A COPY OF ITS OWN TITLE — that would restore the duplication through content",
  topics.filter((x) => {
    const title = (/^title:\s*(.+)$/m.exec(read(`content/blog/${x.post}`))?.[1] ?? "").trim();
    return x.topic && title && x.topic.toLowerCase() === title.toLowerCase();
  }).map((x) => x.post), []);

console.log("\nD · the plate is themed, and reads as a category rather than a headline");

/* ⚠ COMMENTS STRIPPED FIRST, AND THIS ROW FAILED ON ITS OWN COMMENT BEFORE THEY WERE. The note
 * above `.blog-plate span` cites "#379", and a three-digit PR reference is LEXICALLY A VALID HEX
 * COLOUR — so the gate reported the plate carrying a colour literal, correctly, about a number.
 *
 * ⚠ A CONVENTION OF THE PROSE COLLIDED WITH A COLOUR MATCHER. Citing PR numbers in comments is how
 * every note in this repository is written, and three-digit ones are indistinguishable from short
 * hex. `colour-census` was IMMUNE ONLY BY ACCIDENT — it strips block comments at its own line 120,
 * for an unrelated reason (a comment must not contribute to the census population), and that
 * happened to cover this. A defence held for a different purpose is not a defence anyone chose.
 *
 * Recorded rather than merely fixed, because the trap is invisible until a comment happens to cite
 * a PR number under 1000, and this project will keep writing them. */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, " ");
const plate = cssNoComments.slice(cssNoComments.indexOf(".blog-plate"),
  cssNoComments.indexOf("}", cssNoComments.indexOf(".blog-plate span")) + 1);
t("D0 the plate's rules were located — a miss here makes D1 to D3 vacuous", plate.length > 200, true);
t("D1 ⚠ NO COLOUR LITERAL — the plate follows the palette, which five themes now depend on",
  [...plate.matchAll(colourPattern())].map((m) => m[0]).sort(), []);
/* ⚠ THIS ROW READ "THE TEXT IS ITALIC" AND ITS COMMENT PREDICTED EXACTLY WHAT HAPPENED WHEN THE
 * SLANT CAME OFF. It said the italic is the MECHANISM separating a category from a headline, that
 * source can hold only the mechanism, and that "whether it reads that way is the render's to say."
 * The render said it. Setting the plate upright at weight 600 in the display face put it one pixel
 * from the card title directly beneath — same family, same weight, 30px against 31px — and the two
 * read as two attempts at the same sentence. The old row was right about the hazard.
 *
 * THE SEPARATION MOVES FROM SLANT TO REGISTER, which is what this direction replaced italics with
 * on every other surface. A title plate on a drawing carries mono lettering, so the plate now does,
 * and the display-face title below it no longer has a competitor in its own voice.
 *
 * The row is REWRITTEN rather than deleted, because the property it guards is unchanged: the plate
 * must not read as a second headline. Only the mechanism that achieves it moved. */
t("D2 ⚠ THE TEXT IS MONO AND UPRIGHT — the separation is REGISTER, and the slant it replaced was the old one",
  [/font-family:\s*var\(--font-mono\)/.test(plate), /font-style:\s*italic/.test(plate)], [true, false]);
t("D2a …and it is uppercase and tracked, so it reads as a technical label rather than a phrase",
  [/text-transform:\s*uppercase/.test(plate), /letter-spacing:\s*0\.18em/.test(plate)], [true, true]);
t("D2b …and it sits BELOW the title's size band, which is what stops the two competing",
  /font-size:\s*clamp\(12px,\s*1\.5vw,\s*16px\)/.test(plate), true);
/* 16ch to 18ch, and the reason is the register change rather than a preference: the same topic set
 * in uppercase mono at 0.18em tracking occupies more of its measure than a display phrase did. */
t("D3 …and the measure suits a label rather than a sentence",
  /max-width:\s*18ch/.test(plate), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
