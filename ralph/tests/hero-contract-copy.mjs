// THE HERO'S COPY COMES FROM CONTENT, AND NO BYPASS MAY COME BACK.
// Run: node --experimental-strip-types ralph/tests/hero-contract-copy.mjs
//
// ⚠ THIS SUITE GUARDED A FLAG AND NOW GUARDS ITS ABSENCE, WHICH IS THE DURABLE FORM OF THE SAME
// RULE. `USE_CONTRACT_COPY` made the hero draw `docs/hero-ash-contract.html`'s words and IGNORE the
// CMS. Measured while it was true: **50 of the hero's 51 owner-editable fields were editable in
// /studio WITH NO EFFECT ON THE PAGE**, and only `heroCopy` survived because it is read outside the
// flag. The owner then ruled the contract's copy correct, so it moved into
// `content/site-settings.yaml` and the flag was deleted rather than set to false.
//
// ⚠ A GATE WHOSE SUBJECT IS DELETED IS USUALLY DELETED WITH IT, AND THIS ONE IS NOT — BECAUSE THE
// DEFECT WAS NEVER THE FLAG. It was a SECOND SOURCE for strings the CMS already owns. Any hardcoded
// answer, eyebrow or figure put back into this component recreates it under a different name, and
// nothing else in the suite set would notice: the page would look right, the editor would look
// right, and editing would do nothing. That is the shape this repo has four instances of.
//
// ⚠ AND THE MEASUREMENT THAT FOUND IT NEARLY REPORTED THE OPPOSITE. A probe compared each rendered
// string against its CMS value and returned `live: true` for the scroll cue, the tab label and the
// headline — because the contract's words for tab one are IDENTICAL to the owner's. Three false
// passes out of five, agreeing for a reason that had nothing to do with the mechanism. The
// discriminating evidence was `heroRoleLabel`, the one field where the two texts differed, plus the
// support line and counters rendering while all forty CMS fields sat empty. AGREEMENT IS NOT
// EVIDENCE WHEN BOTH SIDES CAN COINCIDE, which is why this reads STRUCTURE rather than diffing
// rendered text against content.
//
// ⚠ AND "42 of 43" WAS THE FIRST COUNT WRITTEN HERE AND IT WAS WRONG — `C1` caught it on its first
// run, which is the denominator rule paying for itself inside the gate that states the denominator.
// Twelve fields per tab (label, headline, support, three callouts, three stats of value plus unit)
// is 48, not 40; the 40 is `hero-tabs` C1a's count of the fields the migration ADDED, and it was
// read as the total. 48 plus the three top-level slots is 51.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const decomment = (b) => b.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const HERO = "components/sections/HeroSection.tsx";
const raw = read(HERO);
const src = decomment(raw);

console.log("A · the subject exists — a zero here makes everything below vacuous");
t("A1 the hero component was read and still renders the four slots",
  [/hero-eyebrow/.test(src), /hero-line/.test(src), /hero-support/.test(src), /hero-counters/.test(src)],
  [true, true, true, true]);

console.log("\nB · the bypass is gone, and no replacement has taken its name");
/* WHAT REDDENS THIS: reintroducing a module-level switch that chooses between CMS copy and copy
 * written in this file. Matched on the SHAPE — a boolean const whose name mentions copy, content,
 * contract or a fallback mode — rather than on the one identifier that used to exist, because the
 * next one will not be called `USE_CONTRACT_COPY`. */
const bypassConst = src.match(/^const\s+([A-Z][A-Z0-9_]*(?:COPY|CONTENT|CONTRACT|MOCK|FIXTURE|PLACEHOLDER)[A-Z0-9_]*)\s*=\s*(?:true|false)\s*;/gm) ?? [];
t("B1 ⚠ NO COPY-SOURCE BYPASS CONSTANT — the flag is deleted and no successor has appeared",
  bypassConst, []);
/* ⚠ AND THE MATCHER MUST BE ABLE TO FIRE, or B1 passes because the regex is wrong rather than
 * because the component is clean. Proved against a fixed sample carrying four plausible successors,
 * against a LITERAL count — a guard whose expectation is derived from its own subject cannot fail
 * when the subject moves, which this repo has on record three times. */
const SAMPLE = [
  "const USE_CONTRACT_COPY = true;",
  "const USE_MOCK_CONTENT = false;",
  "const CONTRACT_COPY_ENABLED = true;",
  "const HERO_PLACEHOLDER_MODE = false;",
].join("\n");
t("B2 …and the matcher finds all four plausible successors in a fixed sample, so B1 is a finding rather than a broken regex",
  (SAMPLE.match(/^const\s+([A-Z][A-Z0-9_]*(?:COPY|CONTENT|CONTRACT|MOCK|FIXTURE|PLACEHOLDER)[A-Z0-9_]*)\s*=\s*(?:true|false)\s*;/gm) ?? []).length, 4);

console.log("\nC · every visible string arrives as a prop, which is what makes the editor real");
/* The four owner-editable slots and the one derived from them. A hardcoded answer would not trip B1
 * — it needs no flag — so the props are asserted to be the source directly. */
t("C1 the hero's editable-field count is 51 — the three top-level slots plus twelve per tab",
  1 /* heroCopy */ + 1 /* heroRoleLabel */ + 1 /* heroScrollCue */
  + 4 * (1 /* label */ + 1 /* headline */ + 1 /* support */ + 3 /* callouts */ + 6 /* stats */), 51);
t("C2 ⚠ ALL FOUR PROPS ARE READ — signature, eyebrow, cue and the tab array, each from its prop",
  [/heroCopy\?\.trim\(\)/.test(src), /roleLabel\?\.trim\(\)/.test(src),
   /scrollCue\?\.trim\(\)/.test(src), /tabs\?\.\[i\]/.test(src)],
  [true, true, true, true]);
/* ⚠ THE FALLBACKS ARE ASYMMETRIC ON PURPOSE AND THAT IS ASSERTED, not left to a comment. A tab NAME
 * and a headline fall back, because a tab must be pressable and a blank answer is a blank hero.
 * Support, callouts and figures must NOT — a blank there has nothing to fall back to, and inventing
 * one puts words on the page the owner never wrote. */
t("C3 ⚠ SUPPORT, CALLOUTS AND FIGURES HAVE NO INVENTED FALLBACK — empty stays empty and the slot does not draw",
  [/support:\s*cms\?\.support\?\.trim\(\)\s*\?\?\s*""/.test(src),
   /calls:\s*\(cms\?\.callouts\s*\?\?\s*\[\]\)/.test(src),
   /stats:\s*\(cms\?\.stats\s*\?\?\s*\[\]\)/.test(src)],
  [true, true, true]);

console.log("\nD · and the content the owner adopted is actually there");
/* ⚠ THE COPY LIVING IN CONTENT IS THE WHOLE POINT, so its absence is the failure this suite exists
 * to catch now. `hero-tabs` D1 asserts the three adopted headlines by substring; this asserts the
 * two top-level slots, which that suite does not reach. */
const settings = read("content/site-settings.yaml");
t("D1 the eyebrow and the scroll cue are in site settings, not in the component",
  [/heroRoleLabel:\s*\S/.test(settings), /heroScrollCue:\s*\S/.test(settings)], [true, true]);
t("D1a …and neither string is hardcoded in the hero, which is how the bypass used to supply them",
  [/UI\/UX product designer/.test(raw), /Scroll to process/.test(raw)], [false, false]);

console.log(`\nhero-contract-copy result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
