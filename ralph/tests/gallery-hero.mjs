// The /gallery hero — the three elements that MUST NOT ship, and the two decisions a plausible
// one-liner would reverse.
// Run: node --experimental-strip-types ralph/tests/gallery-hero.mjs
//
// ---- ⚠ WHICH ROWS CALL AND WHICH ROWS READ, AND WHY THE SPLIT IS NOT ARBITRARY ----------------
//
// This repository's standing rule is that ABSENCE-BY-REGEX IS SOUND AND PRESENCE-BY-REGEX IS NOT.
// If a string is not in a file, nothing can render it — that direction holds. The other direction
// proves only that the words exist, and `PublishBar` is the recorded cost: three green rows over a
// sentence made unreachable by setting one binding to null, every word still in the file.
//
// So the rows below are of two kinds and never a third:
//
//   CALLED   the two decisions with a plausible wrong implementation — which zero-state sentence
//            applies, and whether a filter chip is disabled. Both are pure functions in the leaf
//            precisely so a suite can drive them with real inputs, the `bar-clearance.ts` repair.
//
//   ABSENT   the three elements that must not ship, and the vw-based `sizes` that must not return.
//            Each is a claim that something is NOT there, which a regex can settle.
//
// ⚠ THERE IS NO ROW ASSERTING THE STRIP RENDERS FIVE FRAMES, OR THAT THE FACT ROW SHOWS FOUR
// FIGURES. Those are RENDERED facts and this suite cannot render; a source regex claiming them
// would be the presence direction wearing a number. `paint-sites` visits the page and the two
// states were read side by side against the contract, which is where that claim belongs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blankCommentBodies } from "../strip-comments.mjs";
import {
  galleryCounts,
  galleryEmptyMessage,
  galleryChipDisabled,
} from "../../lib/studio/gallery-format.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");

/* ⚠ COMMENTS BLANKED BEFORE ANY SOURCE ROW RUNS. Every absence row below asks whether a word is in
 * the code, and this file's own prose necessarily contains all of them — an unblanked scan would
 * fail on the note explaining what must not ship. `unchecked-joins` records the same trap, where
 * three of fourteen hits were the comment describing the cast it had just removed. */
const hero = blankCommentBodies(read("components/gallery/GalleryHero.tsx"));
const browser = blankCommentBodies(read("components/gallery/GalleryBrowser.tsx"));
const css = blankCommentBodies(read("app/globals.css"));

const item = (slug, kind, image) => ({
  slug, title: slug, kind, image, width: 100, height: 100,
  alt: "", description: "", tags: [], caseStudy: null, orderIndex: 0,
});
const LABEL = (k) => ({ photo: "Photographs", illus: "Drawings", proj: "Studies" })[k] ?? k;

console.log("\n0 · the subjects are real — every absence row below is vacuous without this");
/* ⚠ SECTIONS D, E AND G ASK WHETHER A WORD IS *NOT* IN A FILE, AND A BLANKED OR MISSING FILE
 * SATISFIES ALL OF THEM AT ONCE. The comment stripper blanks bodies rather than deleting them, so a
 * file that is entirely prose still has length — which is why these rows check for CODE, by naming
 * a construct each file must contain, rather than checking a byte count. A denominator computed
 * inside the walk cannot see the walk's own boundary; this is the boundary. */
t("Z1 the hero source is present and is code, not a blanked shell",
  [hero.length > 2000, hero.includes("export default function GalleryHero")], [true, true]);
t("Z2 …the browser source likewise",
  [browser.length > 2000, browser.includes("export default function GalleryBrowser")], [true, true]);
/* ⚠ THE MARKER IS THE GLOW, WHICH IS DECLARED EXACTLY ONCE. This first named the frame rule, which
 * appears TWICE — once at rest and once inside the motion gate — so renaming one left the other
 * satisfying the row. A subject guard keyed to a marker with a duplicate is a guard that survives
 * the deletion of half its subject. */
t("Z3 …and the stylesheet, whose two slices section F reads",
  [css.length > 50000, css.split(".gallery-hero-glow {").length - 1], [true, 1]);

console.log("\nA · one derivation, driven — the fact row and the chips cannot disagree");
/* ⚠ THE POPULATION IS `image != null`, AND TWO GUARDS COUNTING TWO POPULATIONS IS THE DEFECT THIS
 * REPLACED. The page tested `items.length` while the browser tested a filtered length, so an item
 * with a null image satisfied one and not the other and rendered the FILTERED sentence on a gallery
 * showing nothing. */
{
  const items = [item("a", "photo", "/a.webp"), item("b", "illus", null), item("c", "photo", "/c.webp")];
  const c = galleryCounts(items);
  t("A1 ⚠ AN ITEM WITH NO IMAGE IS NOT IN THE POPULATION — the two-guard defect, driven rather than read",
    [c.all, c.shown.length], [2, 2]);
  t("A2 …and the per-kind tally is over the same population, not over the raw list",
    [c.byKind.photo, c.byKind.illus, c.byKind.proj], [2, 0, 0]);
  t("A3 …and an empty collection yields zeros rather than throwing, which is the state that ships",
    (() => { const z = galleryCounts([]); return [z.all, z.byKind.photo, z.shown.length]; })(), [0, 0, 0]);
}

console.log("\nB · two zero states, two sentences — CALLED, because a count cannot tell them apart");
/* ⚠ `shown.length === 0` IS TRUE IN BOTH STATES. Only the reader's request distinguishes them, so
 * this is the one branch where reading the source would prove nothing about which arm runs. */
t("B1 ⚠ WITH NO FILTER THE EMPTY RESULT IS THE COLLECTION — not a category",
  galleryEmptyMessage("all", LABEL), "Nothing here yet.");
t("B2 …and with a filter it names the category the reader actually chose",
  galleryEmptyMessage("illus", LABEL), "No drawings yet.");
t("B3 …and an unknown kind degrades to its own token rather than to the unfiltered sentence",
  galleryEmptyMessage("zzz", (k) => k), "No zzz yet.");

console.log("\nC · the chip predicate — the one-liner that would reverse a written decision");
/* ⚠ THE DECISION IS AT THE TOP OF `GalleryBrowser`: a chip reading `Drawings 0` STAYS PRESSABLE
 * because it answers "are there any drawings" without a click. `counts[k] === 0` is the obvious
 * implementation and it is the reversal. */
t("C1 ⚠ A ZERO BUCKET IN A NON-EMPTY COLLECTION STAYS PRESSABLE — the recorded decision, driven",
  galleryChipDisabled("illus", 3), false);
t("C2 …and every kind chip is disabled only when there is nothing to filter at all",
  ["photo", "illus", "proj"].map((k) => galleryChipDisabled(k, 0)), [true, true, true]);
t("C3 …and `all` is never disabled, so the group still reports which view is current",
  [galleryChipDisabled("all", 0), galleryChipDisabled("all", 5)], [false, false]);

/* ⚠ C1 TO C3 PROVE THE FUNCTION AND PROVED NOTHING ABOUT THE CALL. Measured: swapping the call
 * site's second argument from the collection total to `counts[k] ?? 0` — the exact reversal those
 * three rows exist to prevent — left the suite FULLY GREEN. That is `run.mjs`'s own standing rule
 * arriving in the suite written to honour it: a gate on a component proves nothing about a flow
 * that does not call it, and here the flow was one argument wide.
 *
 * ⚠ THE ARGUMENT LIST IS EXTRACTED BY BALANCING PARENS, NOT BY `[^)]*`. A lazy class stops at the
 * first close, so a nested call in the argument would truncate the match and the row would pass on
 * text it never saw — the unbalanced-matcher family, which has seven recorded members here. */
{
  const at = browser.indexOf("galleryChipDisabled(");
  let args = "";
  if (at >= 0) {
    const open = browser.indexOf("(", at);
    let d = 0;
    for (let i = open; i < browser.length; i++) {
      if (browser[i] === "(") d++;
      else if (browser[i] === ")") { d--; if (d === 0) { args = browser.slice(open + 1, i); break; } }
    }
  }
  t("C3a the call site was found and its arguments extracted, so C4 is not reading an empty string",
    args.length > 3, true);
  t("C4 ⚠ AND THE CALL PASSES THE COLLECTION TOTAL — a per-kind count here reverses the decision with the leaf still correct",
    [/\ballCount\b/.test(args), /counts\s*\[|byKind/.test(args)], [true, false]);
}

console.log("\nD · the three elements that must not ship — ABSENCE, which is the sound direction");
/* ⚠ ONE ABSENCE, THREE ELEMENTS. The schema carries no date of any kind, and the data is not merely
 * missing — `upload-block-image` runs sharp without `.withMetadata()`, so EXIF is stripped at
 * upload for every image the studio has ever accepted. A chip, a per-frame year label and the word
 * "recent" all rest on the same absent source. */
t("D1 ⚠ NO YEAR IS READ FROM AN ITEM — there is no field, and inventing a range is the thing this record deletes",
  /\byear\b/i.test(hero), false);
t("D2 …and no date is derived by any other route either",
  /\b(getFullYear|Date\.|toISOString|earliest|latest)\b/.test(hero), false);
/* ⚠ AND THE WORD ITSELF, BECAUSE THE CONTRACT USES IT AND A COMMENT REPEATING IT WOULD BE PROSE
 * DESCRIBING BEHAVIOUR THE CODE DOES NOT HAVE — a shape this arc has found four times, every one
 * written by the author of the code in the same sitting. `orderIndex` is curated position and
 * carries no time information at all. */
t("D3 ⚠ AND THE STRIP IS NEVER CALLED `recent` IN CODE — `orderIndex` is author order, not recency",
  /recent/i.test(hero), false);

console.log("\nE · the strip is decorative, and the request size is the honest cost");
/* ⚠ THE BROWSER PICKS FROM `sizes` AND NEVER FROM THE RENDERED BOX. Measured: a 168px frame under
 * the masonry's vw-based value fetches w=640 at 17,443 bytes, against w=384 at 8,094 — five times
 * over, 45.7 KB above the fold for pixels nothing can display. The ABSENCE of a vw unit is the
 * sound half of that claim; a present `170px` proves only that the string is in the file. */
t("E1 ⚠ NO VIEWPORT-RELATIVE `sizes` IN THE HERO — a vw value here re-buys 45.7 KB above the fold",
  /sizes=\{?["'][^"']*vw/.test(hero), false);
/* ⚠ ABSENCE AGAIN: nothing in the strip may be focusable. Every frame is repeated in the masonry
 * below where it already opens the lightbox with a composed name, so linking them would give five
 * items two tab stops and two names each — a cost paid by exactly the readers who can least afford
 * it. A row asserting `aria-hidden` is PRESENT would not catch a focusable child added beside it. */
{
  const strip = hero.slice(hero.indexOf("gallery-hero-strip"), hero.indexOf("The fact row"));
  t("E0 …and the strip block was actually located, so E2 cannot pass over an empty string",
    strip.length > 400, true);
  t("E2 ⚠ NOTHING IN THE STRIP IS FOCUSABLE OR CLICKABLE — decorative or a link, never a thing that looks pressable",
    /<a\b|<button\b|tabIndex|onClick|role=/.test(strip), false);
}

console.log("\nF · the motion is gated and the rest state is not");
/* ⚠ THE ROTATION AT REST IS NOT MOTION. Nothing animates into it, so gating it would leave the fan
 * flat for a reader who asked only that things not move. The STRAIGHTENING is the motion. */
/* ⚠ THE BLOCK IS BOUNDED BY BALANCING BRACES, AND THE FIRST VERSION OF THIS WAS NOT. It sliced from
 * the at-rule TO THE END OF THE FILE, so `css.replace(block, "")` deleted the whole tail — and the
 * mutation that moves the straighten OUT of the gate lands in that tail and became invisible. F1
 * reported PASS on the exact edit it exists to catch.
 *
 * Caught by mutation and not by reading, which is the eighth member of the unbalanced-matcher
 * family here: a matcher that must know where a construct ENDS cannot be written with something
 * that does not count. */
const blockAt = css.indexOf("@media (prefers-reduced-motion: no-preference) {\n  .gallery-hero-frame");
let noPref = "";
if (blockAt >= 0) {
  const open = css.indexOf("{", blockAt);
  let d = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") d++;
    else if (css[i] === "}") { d--; if (d === 0) { noPref = css.slice(blockAt, i + 1); break; } }
  }
}
/* ⚠ THE CEILING IS THE ROW, NOT THE `endsWith`. This first read `noPref.trimEnd().endsWith("}")`,
 * which THE WHOLE FILE SATISFIES — globals.css ends with a brace — so it passed under the exact
 * slice-to-EOF regression it was written to catch. An assertion that cannot fail for the reason it
 * names, found by mutating it rather than by reading it. A bounded block is a few hundred bytes and
 * the file's tail is hundreds of thousands, so the SIZE is what discriminates. */
t("F0 the gated block was located and BOUNDED — a slice running to the file's tail fails here",
  [noPref.length > 200, noPref.length < 1000], [true, true]);
t("F1 ⚠ THE STRAIGHTEN APPEARS NOWHERE OUTSIDE THE `no-preference` BLOCK — absence, over the whole rest of the file",
  css.split(noPref).join("").includes(".gallery-hero-strip:hover"), false);
t("F2 …and the rest rotation is NOT inside it, or a reader who declines motion gets a flat strip",
  noPref.includes("rotate(var(--f-rotate))"), false);

console.log("\nG · the page mounts the browser in both states");
/* ⚠ THE EARLY RETURN IS THE DEFECT, NOT A TIDINESS QUESTION. It rendered a bare sentence and NO
 * FILTER ROW on an empty collection, so the controls appeared from nowhere on the first upload —
 * and it is what made the category sentence the only one a reader could reach. */
const page = blankCommentBodies(read("app/(portfolio)/gallery/page.tsx"));
t("G1 ⚠ NO LENGTH-GUARDED EARLY RETURN — the browser mounts at zero so the filters exist to be disabled",
  /items\.length === 0 \?/.test(page), false);
t("G2 …and the browser is handed the whole collection, which is the only population there is",
  /<GalleryBrowser items=\{items\} \/>/.test(page), true);
/* Absence direction: the filtered sentence must not be reachable with nothing selected, and the
   only way that happens is the browser owning both arms. */
t("G3 …and the old single sentence is gone from the browser",
  /Nothing here yet in that category/.test(browser), false);

console.log(`\ngallery-hero result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
