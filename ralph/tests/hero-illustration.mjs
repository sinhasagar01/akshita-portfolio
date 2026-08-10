// The hero's two structural invariants — both of them ABSENCES, which is why they need a gate.
//
// ⚠ NEITHER OF THESE FAILS VISIBLY WHEN IT BREAKS, AND THAT IS THE WHOLE ARGUMENT. A collapsed pair
// renders identically until motion lands, then reads as a motion bug in a file nobody suspects. A
// filter on the illustration looks like a design choice. Both are invisible at review.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const decomment = (b) => b.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const tsx = decomment(read("components/sections/HeroSection.tsx"));
const css = decomment(read("app/globals.css"));

console.log("A · the subject exists — a zero here makes every row below vacuous");
t("A1 the hero section is real and carries the shell", /className="hero-shell"/.test(tsx), true);
t("A2 …and the artwork panel and its figure are both present",
  [/className="hero-art"/.test(tsx), /className="hero-figure"/.test(tsx)], [true, true]);

console.log("\nB · the pair invariant — two elements each, never one");
/* ⚠ WHY THIS IS A RULE AND NOT A STYLE. The entrance is a CSS animation with a forwards fill and the
 * pointer parallax is a plain transform on the same property. `forwards` WINS, so an element carrying
 * both freezes at its entrance value and never moves again. The outer element takes the pointer
 * transform and the inner takes the entrance, which is why `.hero-figure` wraps its image and
 * `.hero-piece` wraps `.hero-pin` rather than either being one element with two jobs.
 *
 * ⚠ AND THE FAILURE IS INVISIBLE UNTIL MOTION EXISTS. Collapsing a pair changes nothing today — the
 * skeleton renders the same — so a simplification lands green and surfaces later as a motion defect
 * in a component nobody connects to it. That is the gap this row closes.
 *
 * WHAT REDDENS IT: any collapse. Putting the image directly in `.hero-art`, or the pin's content
 * directly in `.hero-piece`, or dropping either wrapper's class. */
const figurePair = /className="hero-figure"[\s\S]{0,400}?<Image/.test(tsx);
const piecePair = (tsx.match(/className="hero-piece[^"]*"[\s\S]{0,200}?className="hero-pin"/g) ?? []).length;
t("B0 the figure wrapper and at least one piece were located, or B1 and B2 pass over nothing",
  [/hero-figure/.test(tsx), /hero-piece/.test(tsx)], [true, true]);
t("B1 ⚠ THE FIGURE IS A PAIR — an outer wrapper around the image, never the image alone",
  figurePair, true);
/* Every piece, not one: a single un-paired piece is the same defect and would hide behind the others. */
t("B2 ⚠ AND EVERY PIECE WRAPS A PIN — counted, so one collapsed piece cannot hide behind three intact ones",
  piecePair, (tsx.match(/className="hero-piece/g) ?? []).length);

console.log("\nC · nothing is ever applied to the illustration");
/* ⚠ THE ABSENCE IS THE ASSERTION, AND IT IS INVITED BY EXACTLY THE KIND OF CHANGE THAT LOOKS LIKE AN
 * IMPROVEMENT. An earlier version of this design shipped a duotone over the artwork, and nobody read
 * it as HIDING the illustration until the owner did — it looked like a treatment. A later polish pass
 * reaching for a filter, a mask, a blend or an opacity is the predicted move, so the rule is written
 * as a gate rather than as a comment somebody has to have read.
 *
 * Scoped to the figure's own rules: the panel around it may do as it likes, and the pieces are not
 * the illustration. `.hero-figure` and `.hero-figure img` are the two selectors that reach it.
 *
 * WHAT REDDENS IT: any of the five properties appearing in either rule, in CSS or as an inline style
 * on the image. `transform` is deliberately NOT on the list — the entrance settles a scale and the
 * pointer translates and tilts, and those are the motions the design is made of. */
const FORBIDDEN = ["filter", "mask", "clip-path", "mix-blend-mode", "background-blend-mode", "opacity"];
const ruleOf = (sel) => {
  const i = css.indexOf(sel + " {");
  if (i < 0) return null;
  return css.slice(i, css.indexOf("}", i));
};
const figRule = ruleOf(".hero-figure");
const imgRule = ruleOf(".hero-figure img");
t("C0 both figure rules were located, or C1 passes over two empty strings",
  [figRule !== null, imgRule !== null], [true, true]);
t("C1 ⚠ NO FILTER, MASK, CLIP-PATH, BLEND OR OPACITY ON THE ILLUSTRATION — the absence a polish pass will reach for",
  FORBIDDEN.filter((prop) => new RegExp(`(^|[^-])${prop}\\s*:`).test((figRule ?? "") + (imgRule ?? ""))), []);
/* And the same properties must not arrive as an inline style on the image element itself, which is
   the route that would bypass a CSS-only check entirely. */
const imgTag = /<Image[\s\S]{0,400}?\/>/.exec(tsx)?.[0] ?? "";
/* ⚠ BOTH SPELLINGS, BECAUSE THE FIRST VERSION KNEW ONLY ONE AND A MUTATION WALKED PAST IT. JSX
   inline styles are camelCase, so `mixBlendMode` slipped through a check written in kebab-case —
   the vocabulary was narrower than the concept, in the row whose whole job is catching the route
   that bypasses CSS. */
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
t("C2 …and none of them arrives as an inline style on the image, in either spelling, which would bypass a CSS-only check",
  FORBIDDEN.filter((prop) => imgTag.includes(prop) || imgTag.includes(camel(prop))), []);
/* ⚠ AND THE CHECK MUST BE ABLE TO FIRE, or C1 passes because the matcher is wrong rather than because
   the illustration is clean. Proved against a synthetic rule carrying every forbidden property. */
/* ⚠ AGAINST A LITERAL, BECAUSE THE FIRST VERSION BUILT ITS TEST STRING FROM `FORBIDDEN` ITSELF — so
   any list passed, including one with every real property removed. A guard whose expectation is
   derived from its own subject cannot fail when the subject moves; this repo has that shape on
   record and it survived a mutation here before being caught. The sample and the count are both
   fixed text now, so shrinking `FORBIDDEN` reddens this row. */
const SAMPLE = ".x { filter: blur(1px); mask: url(#m); clip-path: inset(0); "
  + "mix-blend-mode: multiply; background-blend-mode: screen; opacity: 0.5; }";
t("C3 …and the matcher detects all six in a fixed sample, so C1's empty list is a finding rather than a broken regex",
  FORBIDDEN.filter((prop) => new RegExp(`(^|[^-])${prop}\\s*:`).test(SAMPLE)).length, 6);

console.log(`\nhero-illustration result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
