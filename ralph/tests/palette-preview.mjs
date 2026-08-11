// `Try across portfolio` — temporary, escapable, and never a publish.
// Run: node --experimental-strip-types ralph/tests/palette-preview.mjs
import {
  PREVIEW_COOKIE, PREVIEW_MAX_AGE_SECONDS, encodePreview, decodePreview, previewHeadScript,
} from "../../lib/palettes/preview-cookie.ts";
import { THEME_NAMES, THEME_GROUND, VERIFY_THEME } from "../../lib/theme.ts";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = new URL("../../", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");
const DARK = THEME_NAMES.filter((n) => THEME_GROUND[n] === "dark");
const SCRIPT = previewHeadScript(DARK);

console.log("\nA · the deadline is DRIVEN, not merely configured");
/* ⚠ `Max-Age` IS ENFORCED BY THE BROWSER AND CANNOT BE EXERCISED WITHOUT WAITING FOR IT, so an
 * expiry that lived only there would ship as a number nobody had ever seen work. The value carries
 * its own deadline, which makes it drivable: a past deadline must be refused, here and in the head
 * script, with no clock to wait on. */
const NOW = 1_000_000_000_000;
t("A0 the max age is real and short — a zero or a year would both defeat the point",
  PREVIEW_MAX_AGE_SECONDS > 60 && PREVIEW_MAX_AGE_SECONDS <= 60 * 60, true);
t("A1 a fresh cookie decodes to its theme", decodePreview(encodePreview("sapphire", NOW), NOW), "sapphire");
t("A2 ⚠ AND THE SAME COOKIE IS REFUSED ONE MILLISECOND PAST ITS DEADLINE — the expiry, driven",
  decodePreview(encodePreview("sapphire", NOW), NOW + PREVIEW_MAX_AGE_SECONDS * 1000 + 1), null);
t("A2a …and exactly AT the deadline, so the boundary is closed rather than guessed",
  decodePreview(encodePreview("sapphire", NOW), NOW + PREVIEW_MAX_AGE_SECONDS * 1000), null);
t("A3 a malformed value is refused rather than half-read",
  ["", "sapphire", "sapphire.", ".123", "sapphire.nope", "SAPPHIRE.9999999999999"]
    .map((v) => decodePreview(v, NOW)), [null, null, null, null, null, null]);
t("A4 …and a value with no deadline cannot be smuggled past by looking like a theme",
  decodePreview("cream", NOW), null);

console.log("\nB · the /studio gate, ASSERTED rather than commented");
/* ⚠ THE CANVAS RENDERS PUBLIC COMPONENTS DELIBERATELY, so a preview reaching it would show an author
 * a palette they had not published — and they would have no reason to doubt it. The studio CHROME is
 * safe by construction (`studio-tokens` C1 asserts the frozen palette is independent of the public
 * one), so the canvas is the whole exposure and this pathname test is the whole fix. A comment
 * saying "we skip /studio" cannot fail; these rows can. */
t("B1 ⚠ THE SCRIPT RETURNS EARLY ON /studio — the exact path, not a prefix that also matches /studios",
  /location\.pathname===("|')\/studio\1/.test(SCRIPT), true);
t("B2 …and on every path beneath it",
  /location\.pathname\.indexOf\(("|')\/studio\/\1\)===0/.test(SCRIPT), true);
t("B3 ⚠ AND THE RETURN COMES BEFORE THE COOKIE IS EVEN READ — a gate after the read is a gate that ran too late",
  SCRIPT.indexOf("/studio") < SCRIPT.indexOf(PREVIEW_COOKIE), true);

console.log("\nC · the script writes BOTH attributes, from the derived dark list");
t("C0 the dark list is non-empty and derived — an empty one would make C2 vacuous", DARK.length >= 1, true);
t("C1 it sets data-theme", /dataset\.theme=/.test(SCRIPT), true);
t("C2 ⚠ AND data-ground, because the ROLE LAYER remaps on the ground and not on the theme",
  /dataset\.ground="dark"/.test(SCRIPT) && /delete r\.dataset\.ground/.test(SCRIPT), true);
t("C3 …and every dark palette is named in it, so a new one cannot render light rungs on a dark page",
  DARK.filter((n) => !SCRIPT.includes(n)), []);
t("C4 the verification twin is NOT previewable — it is a control and never shown",
  SCRIPT.includes(VERIFY_THEME), false);

console.log("\nD · the absence, WITH A SUBJECT — a preview is never a publish");
/* ⚠ AN ABSENCE WITH NO COUNT CANNOT FAIL. "Nothing under the feature imports the write layer" is
 * satisfied by a feature that does not exist; pinning the importers that DO makes both halves
 * checkable — a new caller anywhere fails D2, and a caller inside the feature fails D1. */
const WRITE_LAYER = /(commit-site-settings|publish-site-settings|sanitizeSiteSettingsPatch)/;
const walk = (d) => readdirSync(join(root, d), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const sources = ["app", "lib", "components"].flatMap(walk).filter((f) => /\.tsx?$/.test(f));
const importers = sources.filter((f) =>
  read(f).split("\n").some((l) => /^\s*import\b/.test(l) && WRITE_LAYER.test(l)));
const FEATURE = /^(lib\/palettes|components\/palettes|app\/\(portfolio\)\/palettes)/;
const featureFiles = sources.filter((f) => FEATURE.test(f));

t("D0 the sweep found the feature's own files — a zero here makes D1 vacuous", featureFiles.length >= 4, true);
t("D0a …and it found sources at all, against a literal", sources.length >= 100, true);
t("D1 ⚠ NOTHING UNDER THE PALETTES FEATURE IMPORTS THE SITE-SETTINGS WRITE LAYER",
  importers.filter((f) => FEATURE.test(f)), []);
t("D2 ⚠ AND THE IMPORTER COUNT IS UNCHANGED AT SEVEN — a new caller anywhere fails this, which is what makes D1 an assertion rather than a hope",
  importers.length, 7);
t("D2a …and every one of them is a studio write path, so the seven are the ones that SHOULD write",
  importers.filter((f) => !/^(app\/api\/studio|lib\/studio)/.test(f)), []);

console.log("\nE · the cookie is the only mechanism, and it is scoped");
const consoleSrc = read("components/palettes/PaletteConsole.tsx");
t("E1 the try action writes the cookie and calls no API — a fetch here would be a write path",
  /fetch\(/.test(consoleSrc), false);
/* ⚠ E2 AND E3 MOVED THEIR SUBJECT IN #516 AND THE PROPERTY THEY NAME DID NOT.
 *
 * Both used to read a CONSUMER's source — E2 the console, E3 the indicator — because each consumer
 * assembled its own cookie string. Three doors onto one preview state meant three copies of the
 * flags, and the rows were asserting that one of the copies was right.
 *
 * The writer is now `startPreview` and the eraser is `endPreview`, both in `preview-cookie.ts`, and
 * no consumer spells a cookie at all. THAT IS STRICTLY STRONGER THAN WHAT THESE ROWS ASSERTED —
 * E4a below now covers every door at once instead of the one that happened to be read here. The
 * rows follow the mechanism rather than being deleted, because the flags themselves still matter:
 * a cookie without `Path=/` is scoped to `/palettes` and the preview stops travelling, which is the
 * whole feature failing silently on every other route. */
const cookieSrc = read("lib/palettes/preview-cookie.ts");
/** A named function's body, brace-balanced, so a flag in a COMMENT cannot satisfy a row about
 *  behaviour. `indexOf` on a closing brace finds whichever comes first rather than the matching
 *  one — the unbalanced-matcher family this repo has five members of. */
const bodyOf = (src, name) => {
  const at = src.indexOf(`export function ${name}(`);
  if (at < 0) return "";
  let depth = 0;
  for (let i = src.indexOf("{", at); i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(at, i + 1);
  }
  return "";
};
const startBody = bodyOf(cookieSrc, "startPreview");
const endBody = bodyOf(cookieSrc, "endPreview");
t("E1b both halves of the one mechanism were FOUND — empty bodies would make E2 and E3 vacuous",
  startBody.length > 100 && endBody.length > 60, true);
t("E2 the cookie is path-scoped to the whole site and SameSite=Lax",
  /Path=\/;/.test(startBody) && /SameSite=Lax/.test(startBody), true);
t("E3 ⚠ AND EXIT CLEARS IT WITH Max-Age=0 rather than leaving it to lapse — the way out is immediate",
  /Max-Age=0/.test(endBody), true);
/* ⚠ THE ROW THE EXTRACTION MADE POSSIBLE, AND THE ONE THE OLD SHAPE COULD NOT HAVE. A consumer that
 * assembles its own cookie is a second mechanism the exit does not clear, and the visitor is
 * stranded on a palette with a button that does nothing. That was previously prevented by every
 * consumer being checked individually, which is a list — and a list goes stale when a fourth door
 * arrives. This asks the question of the DIRECTORY instead. */
const doors = readdirSync(join(root, "components/palettes"))
  .filter((f) => f.endsWith(".tsx"))
  .filter((f) => /document\.cookie\s*=/.test(read(`components/palettes/${f}`)));
t("E3a ⚠ NO SURFACE WRITES THE COOKIE ITSELF — one mechanism is a claim about the mechanism, so there must be one",
  doors, []);
/* ⚠ THIS ROW MATCHED THE STRING `published-theme` ANYWHERE IN THE INDICATOR AND SURVIVED THE ONE
 * MUTATION THAT MATTERS. Replacing `getElementById("published-theme")` with `null` leaves
 * `data-published-theme` sitting in the getAttribute call below it, so the row went on passing while
 * exit had stopped reading the published values entirely. A presence check wearing a behaviour
 * check's title — the third instance in this arc, and found by mutating rather than by reading.
 * The subject is the LOOKUP, so the matcher is the lookup. */
t("E4 ⚠ AND EXIT LOOKS THE PUBLISHED VALUES UP, not a remembered one — there is one true state to return to",
  /getElementById\(("|')published-theme\1\)/.test(read("components/palettes/PreviewIndicator.tsx")), true);
t("E4a …and the server emits them, or the lookup above would find nothing",
  /data-published-theme=/.test(read("app/layout.tsx")), true);

console.log("\nF · the preview survives leaving /palettes — the navigation defect");
/* ⚠ WHAT THIS SECTION CAN AND CANNOT SEE, SAID FIRST BECAUSE IT DECIDES THE ROWS.
 *
 * The defect was that `Try across portfolio` applied on the page where it was pressed and nowhere
 * else until a reload. Cause: `PaletteConsole`'s unmount cleanup restored the arrival theme
 * UNCONDITIONALLY, so leaving the page put the published theme back while the cookie stayed live —
 * a cream page under a banner reading "Previewing nocturne", with an Exit button.
 *
 * ⚠ THESE ROWS CANNOT DRIVE A CLIENT NAVIGATION. ralph is node and static analysis; there is no
 * router here. So they assert the GUARD — that the cleanup consults the cookie before restoring, and
 * that it consults it FIRST. What proves the behaviour is a recorded browser drive: press a dot and
 * navigate (must not leak), press Try and navigate to two routes (must travel), both on a fresh
 * document. That drive is in the PR body, and naming it here is the rule about a fact deferred to
 * nobody — a row that only ever tests a fresh document could not have caught this, which is exactly
 * why the suite passed while the defect shipped. */
const cleanup = (() => {
  const at = consoleSrc.indexOf("return () => {");
  if (at < 0) return "";
  let depth = 0;
  for (let i = consoleSrc.indexOf("{", at); i < consoleSrc.length; i++) {
    if (consoleSrc[i] === "{") depth++;
    else if (consoleSrc[i] === "}" && --depth === 0) return consoleSrc.slice(at, i + 1);
  }
  return "";
})();
t("F0 the unmount cleanup was found — an empty slice would make every row below vacuous",
  cleanup.length > 200, true);
/* ⚠ THE READER MOVED WITH THE WRITER IN #516. The cleanup used to match the cookie by hand and call
 * `decodePreview` on the result; it now calls `livePreviewTheme`, which does both in the module the
 * writer lives in. Same property, one fewer spelling — and F1a's separate claim, that the name is
 * taken from the constant rather than typed, is now true BY CONSTRUCTION rather than by assertion,
 * so it is folded in here rather than kept as a row that can no longer fail. */
t("F1 ⚠ IT CONSULTS THE PREVIEW COOKIE — without this it restores over a preview the visitor asked for",
  /livePreviewTheme\s*\(/.test(cleanup), true);
/* ⚠ THE ORDER IS THE FIX. A cookie read AFTER the restore would leave the restore in place and the
 * defect intact, and the row would still find the call in the block. */
t("F2 ⚠ AND IT RETURNS BEFORE RESTORING — a cookie read after the restore would leave the defect exactly as it was",
  cleanup.indexOf("livePreviewTheme") < cleanup.indexOf("dataset.theme = seen.theme"), true);
/* ⚠ THE CONDITION IS EXTRACTED AND THEN SEARCHED, RATHER THAN MATCHED IN ONE PATTERN. The first
 * form of this row was `livePreviewTheme\s*\([^)]*\)` and it FAILED ON CORRECT CODE, because the
 * argument is `Date.now()` and `[^)]*` cannot cross the inner `)`. Sixth member of the
 * unbalanced-matcher family in this repo, written into the row repairing a different one.
 *
 * Taking the condition first keeps the row's subject — that the RESULT guards the return rather
 * than the call merely happening. A mutation that calls it and then returns on something else
 * leaves a condition with no `livePreviewTheme` in it, and reddens. */
const guardCond = /if\s*\(([\s\S]*?)\)\s*return\s*;/.exec(cleanup);
t("F3 …and the call's RESULT is what guards the return, not merely that the call happens",
  guardCond !== null && /livePreviewTheme\s*\(/.test(guardCond[1]), true);
/* ⚠ AND THE RESTORE STILL EXISTS. Deleting it would "fix" the navigation defect by making BROWSING
 * leak instead — press a dot, navigate away, and cerise travels with no cookie and no way back. */
/* ⚠ THIS MATCHED THE ASSIGNMENT'S TEXT AND SURVIVED THE ONE MUTATION THAT MATTERS. Rewriting the
 * guard to `if (false)` leaves `dataset.theme = seen.theme` sitting there unreachable, so the row
 * passed while the restore was dead — and a dead restore means BROWSING leaks: press a dot, navigate
 * away, and cerise travels with no cookie and no way back. The subject is REACHABILITY, so the
 * matcher is the conditional, not the assignment. Fourth presence-where-behaviour-was-meant this
 * session, and found the same way as the other three. */
t("F4 ⚠ THE RESTORE IS STILL REACHABLE, so browsing palettes cannot leak without a Try",
  /if\s*\(\s*seen\.theme\s*\)\s*root\.dataset\.theme = seen\.theme/.test(cleanup), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
