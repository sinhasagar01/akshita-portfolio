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
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const code = (p) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const types = code("lib/case-studies/types.ts");
const scroller = code("components/case-study/blocks/deviceScroller.ts");
const renderer = code("components/case-study/BlockRenderer.tsx");
const work = code("components/case-study/blocks/WorkStory.tsx");
const baStory = code("components/case-study/blocks/BeforeAfterStory.tsx");
const boat = code("lib/case-studies/boat-crest.ts");

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

/* ── E · ALT IS NOW POSSIBLE, AND DELIBERATELY STILL EMPTY ────────────────────────────────── */

t("E1: WorkStory's screens read alt off the spec instead of hard-coding it",
  (work.match(/alt=\{feat\.screen\.\w+\.alt\}/g) ?? []).length, 3);
t("E2: BeforeAfterStory's do too", (baStory.match(/alt=\{(after|before)\.\w*\.?alt\}/g) ?? []).length >= 3, true);

/* ⚠ THE VALUES ARE EMPTY ON PURPOSE, AND THAT IS THE GATE. Filling them would change the rendered
 * DOM and forfeit the byte-identical proof that a type change on the flagship's renderer moved
 * nothing. The FIELD now exists; the words are the owner's, and they are content. */
t("E3: every converted boat-crest asset carries an explicit empty alt",
  (boat.match(/alt: ""/g) ?? []).length >= 14, true);

/* ── F · THE INTRINSIC HEIGHTS ARE DERIVED, NOT TYPED ─────────────────────────────────────── */

/* ⚠ NOT ONE OF THESE NUMBERS IS HAND-WRITTEN. Every one reads `.height` off the static import it
 * sits beside, so the asset and its declared height cannot drift. A literal here would be a number
 * someone measured once, in a file nobody re-measures. */
t("F1: boat-crest derives every intrinsic height from its own import",
  (boat.match(/intrinsicHeight: \w+\.height/g) ?? []).length, 14);
t("F2: …and hand-typed one is nowhere in the file",
  /intrinsicHeight: \d/.test(boat), false);
t("F3: the file still holds both bespoke blocks, so the counts above are not vacuous",
  /kind: "beforeAfterStory"/.test(boat) && /variant: "story"/.test(boat), true);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
