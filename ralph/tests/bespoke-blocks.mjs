// The two bespoke case-study blocks, and the seams that let them ever reach the CMS.
// Run: node --experimental-strip-types ralph/tests/bespoke-blocks.mjs
//
// ---- WHAT THIS IS FOR -------------------------------------------------------------------------
//
// `boat-crest` is the only case study its owner cannot edit: its body is TypeScript while the other
// three are YAML. That is hazard 10, and MEASURED it is much narrower than "bespoke" suggests —
// 12 of its 14 section instances were already in the studio's 16-kind vocabulary. Exactly two were
// not, and both were held out by their TYPES rather than by their content:
//
//   StoryScreen          = { full: StaticImageData } | { body: StaticImageData; footer: … }
//   BeforeAfterStoryPair = { before: StaticImageData; after: { body: …; footer: … } }
//
// A `StaticImageData` is a build-time static import. Content cannot express one, and it carries no
// `alt`, so all 8 images in these two components rendered `alt=""` with no field that could hold
// anything else. This suite pins the conversion to `ImgSpec` and the two traps it walked past.
//
// ---- ⚠ WHAT IT DOES NOT COVER ----------------------------------------------------------------
//
// The CMS half — the Keystatic schema for `beforeAfterStory` and a `variant` selector on
// `featureRows` — is NOT in this PR. Both need the sanitizer's omit-when-empty treatment (the one
// `frame` gets), because every existing block would otherwise be rejected for a missing key. So
// the renderer supports the variant and content cannot yet select it, which is exactly the state
// the two blocks were already in. Named here so "asserted" is not read as "finished".
import { readFileSync, existsSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
// ⚠ A LATENT TRAP LIVES HERE AND THE OBVIOUS FIX IS WORSE THAN IT. `keystatic.config.ts` holds
// `path: "content/projects/<star>"`, and the slash-star inside that STRING reads as a comment opener
// to the regex below. It is harmless only while no later closing delimiter pairs with it — #369
// added one block comment further down that file and the match swallowed everything between,
// turning `G5` red with the claim that `beforeAfterStory` had left the schema. It had not.
//
// THE FIX THAT SUGGESTS ITSELF IS BLANKING STRING BODIES BEFORE STRIPPING COMMENTS. It was written
// and reverted: five assertions here READ STRING CONTENTS — `G3` matches `omitEmpty: ["variant"]`,
// `C2` and `C4` match literal block kinds — so blanking strings breaks the suite it was meant to
// protect. A stripper serving consumers that care about strings cannot discard them.
//
// SO THE TRAP IS RECORDED RATHER THAN REMOVED, with the trigger named: DO NOT ADD A BLOCK COMMENT
// TO `keystatic.config.ts` BELOW A `path:` GLOB — use line comments, as #369's entry there does. A
// real repair needs a tokenizer rather than a regex, which is a larger change than this suite
// warrants and is stated here so the next person meets the reason and not just the breakage.
const code = (p) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const types = code("lib/case-studies/types.ts");
const scroller = code("components/case-study/blocks/deviceScroller.ts");
const renderer = code("components/case-study/BlockRenderer.tsx");
const work = code("components/case-study/blocks/WorkStory.tsx");
const baStory = code("components/case-study/blocks/BeforeAfterStory.tsx");
const boatYaml = readFileSync(new URL("../../content/projects/boat-crest.yaml", import.meta.url), "utf8");

/* ── A · THE CONVERSION ────────────────────────────────────────────────────────────────────── */

t("A1: story screens carry ImgSpec, not a raw static import",
  /export type ScreenAsset = ImgSpec & \{ intrinsicHeight: number \}/.test(types), true);
t("A2: …and no StoryScreen arm still holds a bare StaticImageData",
  /StoryScreen =[\s\S]{0,160}StaticImageData/.test(types), false);
t("A3: the before/after story pair likewise",
  /BeforeAfterStoryPair = \{[\s\S]{0,220}before: ImgSpec;/.test(types), true);

/* ⚠ THE SHAPE IS EXTRACTED, NOT RESTATED. `after` and `StoryScreen`'s scrollable arm are the same
 * thing — both are handed to `unitGeo` — so a second structurally-identical literal would be one
 * the geometry could drift away from. */
t("A4: `after` is derived from StoryScreen rather than re-declared",
  /after: Extract<StoryScreen, \{ body: ScreenAsset \}>/.test(types), true);

/* ── B · THE TRAP ─────────────────────────────────────────────────────────────────────────── */

/* ⚠ THE FAILURE THIS SUITE MOSTLY EXISTS FOR. `ImgSpec.height` is a RENDERED height in CSS px;
 * `unitGeo` needs the asset's INTRINSIC pixel height and divides by it to get `scrollPct`. Both are
 * numbers, so reading the wrong one compiles perfectly and silently computes a scroll ratio from a
 * layout value — a correct measurement of the wrong quantity. What caught it during the build was
 * `ImgSpec.height` being OPTIONAL, so the compiler objected to `undefined` rather than to meaning.
 * A required field would have shipped it silently. */
t("B1: the scroller reads the INTRINSIC height",
  /const bodyH = screen\.body\.intrinsicHeight;/.test(scroller), true);
t("B2: …and the footer's too", /const footerH = screen\.footer\.intrinsicHeight;/.test(scroller), true);
t("B3: …and never the rendered `.height`, which is a different quantity with the same type",
  /screen\.(body|footer)\.height\b/.test(scroller), false);
t("B4: the two are separate names on the type, so they cannot be confused by assignment",
  /intrinsicHeight: number/.test(types) && /height\?: number/.test(types), true);

/* ── C · ONE KIND, TWO PRESENTATIONS ──────────────────────────────────────────────────────── */

t("C1: `featureStory` is gone from the block union", /kind: "featureStory"/.test(types), false);
t("C2: …folded into featureRows as a variant",
  /kind: "featureRows"; features: Feature\[\]; variant\?: "rows" \| "story"/.test(types), true);
t("C3: …and the renderer has no featureStory case left", /case "featureStory"/.test(renderer), false);

/* ⚠ ABSENT MUST MEAN ROWS. Three shipped `featureRows` blocks across the other three case studies
 * carry no `variant` at all. Testing `=== "story"` is what makes absent fall to rows; testing
 * `=== "rows"` instead would silently restyle all three. */
t("C4: the dispatch tests for STORY, so absent falls through to rows",
  /block\.variant === "story" \? \(/.test(renderer), true);
t("C5: …and never tests for \"rows\", which would invert the default",
  /variant === "rows"/.test(renderer), false);

/* ── D · REACHABLE FROM AN EDITABLE CANVAS ────────────────────────────────────────────────── */

/* Neither component took `editable`/`blockIndex`, so neither could render in the studio canvas the
 * way the public page does — parity was unreachable by construction rather than by defect. */
/* ⚠ THE COUNT, NOT THE PRESENCE — and mutation is what forced that. The first version asked only
 * whether `inlineEditProps` appeared at all, so deleting one of WorkStory's three wirings left it
 * green: two others still matched. "At least one exists" is the assertion shape that passes while
 * most of the work is undone. WorkStory wires category, title and body; BeforeAfterStory wires a
 * title and a tag in each of its two panel branches (pinned desktop and static fallback), which
 * render the same pair and therefore take the same edit path. */
const WIRED = { WorkStory: 3, BeforeAfterStory: 4 };
for (const [name, src] of [["WorkStory", work], ["BeforeAfterStory", baStory]]) {
  t(`D1: ${name} accepts the editing props`, /editable\?: boolean;/.test(src) && /blockIndex\?: number;/.test(src), true);
  t(`D2: ${name} wires ${WIRED[name]} fields — a count, so removing one is caught`,
    (src.match(/inlineEditProps\(editable, blockIndex,/g) ?? []).length, WIRED[name]);
}
/* `inlineEditProps` returns {} when not editable, which is why adding it left the public DOM
 * byte-identical — the property the whole PR rests on. */
t("D3: the helper is the one that no-ops off the edit path",
  /if \(!editable\) return \{\} as Record<string, never>;/.test(code("components/case-study/editable.ts")), true);

/* ── E · ALT IS NOW POSSIBLE, AND THE ASSETS MOVED TO CONTENT ────────────────────────────── */

t("E1: WorkStory's screens read alt off the spec instead of hard-coding it",
  (work.match(/alt=\{feat\.screen\.\w+\.alt\}/g) ?? []).length, 3);
t("E2: BeforeAfterStory's do too", (baStory.match(/alt=\{(after|before)\.\w*\.?alt\}/g) ?? []).length >= 3, true);

/* ⚠ THE SUBJECT MOVED FROM CODE TO CONTENT, which is the point of the port. These used to read
 * `lib/case-studies/boat-crest.ts` and assert that every converted asset carried `alt: ""` and that
 * every intrinsic height was DERIVED from its static import rather than typed. That file is gone.
 *
 * The derived-not-typed rule cannot survive the move and should not: content has no imports to
 * derive from, so the numbers ARE literals now, written by a generator that read the real PNGs.
 * What survives is the property that still means something — every image carries the alt FIELD
 * (empty, waiting for the owner) and every scroller asset carries its intrinsic height. */
t("E3: the study is content now, not code",
  /^sections:/m.test(boatYaml) && !existsSync(new URL("../../lib/case-studies/boat-crest.ts", import.meta.url)), true);
/* ⚠ EXACT COUNTS, NOT `>=`. The first version of these used thresholds, and mutation killed none
 * of them: stripping ONE alt or ONE dimension still cleared `>= 25`. A threshold answers "did the
 * generator run at all", which was never the question — the question is whether every asset kept
 * what it was given. 28 images, and all three fields are per-image, so all three counts are 28. */
const IMAGES = 28;
t(`E4: all ${IMAGES} images carry an alt field, so the words are the only thing missing`,
  (boatYaml.match(/^\s+alt: /gm) ?? []).length, IMAGES);
t(`E5: …and all ${IMAGES} carry their source height`,
  (boatYaml.match(/intrinsicHeight: \d+/g) ?? []).length, IMAGES);
/* ⚠ AND THE WIDTHS TOO — this is the pair that killed the first attempt at this port. Without them
 * `DeviceImage` falls back to the canonical bezel aspect, which 19 of these 25 source files are
 * NOT: the scroller footers are 4.33 and 3.77, wide strips rendered in a tall phone box. */
t(`E6: …and all ${IMAGES} carry their source width`,
  (boatYaml.match(/intrinsicWidth: \d+/g) ?? []).length, IMAGES);

/* And the consumer, which is the other half of that defect — content carrying the dims is useless
 * if the component ignores them. */
{
  const dev = code("components/case-study/DeviceImage.tsx");
  t("E7: DeviceImage prefers the source aspect when content supplies it",
    /\? `\$\{intrinsicWidth\} \/ \$\{intrinsicHeight\}`/.test(dev), true);
  t("E8: …and falls back to the canonical bezel only when it does not, so nothing shipped moves",
    /: `\$\{BEZEL_W\} \/ \$\{BEZEL_H\}`/.test(dev), true);
}

/* ── F · EVERY STORY IMAGE RESERVES ITS SPACE ────────────────────────────────────────────── */

/* ⚠ THE REGRESSION THIS EXISTS FOR, AND HOW IT GOT PAST THE GATE. A static import carries its
 * dimensions implicitly; a path string does not, so after #292 these six `<Image>`s emitted NO
 * `width`/`height` — 23 of the flagship's 30 images stopped reserving space, which is layout shift
 * on the page that matters most. `next/image` throws a clear error for this in DEV and renders it
 * silently in production, so the build passed and the studio canvas was the thing that broke.
 *
 * IT WAS NOT THAT THE GATE WAS WEAK — IT WAS THAT THE GATE WAS NOT RE-RUN. #292 compared the DOM
 * byte for byte, then changed the code to add intrinsic dimensions, then verified the CHANGE with
 * narrower proxies (aspect ratios, image counts) instead of running the comparison again. A gate
 * answers for the code it was run against and nothing later. */
{
  const bothStories = work + baStory;
  /* Each string-src image must take explicit dimensions. `bezel` is a static import and needs
   * none, which is why this counts the six rather than asserting a blanket rule. */
  t("F1: every story image is given an explicit width",
    (bothStories.match(/width=\{(?:feat\.screen|after|before)[^}]*intrinsicWidth\}/g) ?? []).length, 6);
  t("F2: …and an explicit height",
    (bothStories.match(/height=\{(?:feat\.screen|after|before)[^}]*intrinsicHeight\}/g) ?? []).length, 6);
  /* And the pair must come from the SOURCE dimensions, not the rendered ones — the same distinction
   * `deviceScroller` turns on. A rendered width here would reserve the wrong box. */
  t("F3: …from the SOURCE dimensions, never the rendered ones",
    /width=\{[^}]*\.width\}/.test(bothStories), false);
}

/* ── G · THE CMS SEAM (A2) ────────────────────────────────────────────────────────────────── */

const fmt = code("lib/studio/sections-format.ts");
const cfg = code("keystatic.config.ts");
const adapter = code("lib/case-studies/adapter.ts");
const registry = code("components/studio/blocks/registry.tsx");

/* ⚠ `omitEmpty` IS WHAT MAKES ADDING A FIELD POSSIBLE AT ALL. Every key in a shape is REQUIRED
 * (the empties-preserved rule) and the sanitised object is dumped straight back to disk, so a new
 * key rejects all existing content for being absent. Adding `variant` and `height` naively failed
 * 147 assertions — that is the measured cost of not having this. */
t("G1: obj() supports omit-when-empty keys", /omitEmpty\?: readonly \(keyof S & string\)\[\]/.test(fmt), true);
t("G2: …and skips them only when absent or \"\", never when they carry a value",
  /if \(omit\.has\(k\) && \(raw\[k\] === undefined \|\| raw\[k\] === ""\)\) continue;/.test(fmt), true);
t("G3: featureRows' variant uses it, so the three shipped blocks never gain a `variant:` line",
  /\{ omitEmpty: \["variant"\] \}/.test(fmt), true);
/* ⚠ AND IT IS DECLARED FIRST, because `obj` rebuilds in DECLARED order — a key in the wrong
 * position re-keys every block it touches and churns files nobody edited. */
t("G4: …declared before `features`, matching the schema, so a present value lands in position",
  /variant: str,\s*features: arrayOf/.test(fmt), true);

t("G5: beforeAfterStory is in the schema", /beforeAfterStory: \{/.test(cfg), true);
t("G6: …in the sanitizer's table", /beforeAfterStory: obj\(\{/.test(fmt), true);
t("G7: …in the adapter's policed kind list", /"beforeAfterStory",/.test(adapter), true);
t("G8: …and it has a real form, not a placeholder",
  /beforeAfterStory: \{ empty: BLOCK_EMPTIES\.beforeAfterStory/.test(registry), true);

/* ⚠ THE INTRINSIC HEIGHT SURVIVES THE ROUND TRIP AS ITS OWN FIELD. If it were folded into
 * ImgSpec's rendered `height`, the scroll ratio would be computed from a layout number — the trap
 * Part B pins on the render side, asserted here on the content side. */
t("G9: the screen asset carries intrinsicHeight through the sanitizer",
  /const screenAsset = imageObj\(\{ intrinsicHeight: numOrNull \}\);/.test(fmt), true);
t("G10: …and the adapter nests the flat schema into the render shape rather than the components doing it",
  /after: \{ body: screen\(o2\.afterBody, "afterBody"\), footer: screen\(o2\.afterFooter, "afterFooter"\) \}/.test(adapter), true);
t("G11: …with an unset height falling to 0, which unitGeo already treats as non-scrollable",
  /intrinsicHeight: num\(rec\(raw\)\.intrinsicHeight\) \?\? 0/.test(adapter), true);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
