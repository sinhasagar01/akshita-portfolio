// The theme seam: the content field, both halves of the write path, the fail-closed reader, and
// the four surfaces that hold theme names and cannot import each other.
// Run: node --experimental-strip-types ralph/tests/theme.mjs
//
// ---- WHY THIS SUITE EXISTS ---------------------------------------------------------------------
//
// PART A — THE TWIN, WHICH IS THE ONLY REASON ANY OF THIS IS PROVABLE. A reader with ONE possible
// value exercises nothing: the lookup always hits, the fallback never fires, and the mechanism
// reads as authoritative while proving a constant equals itself. That is the `FIT_THRESHOLD_PX`
// shape, which this repo has deleted four times rather than documented. `cream-verify` is a second
// entry identical to `cream` in every measured value, so the lookup is a real lookup and the
// fail-closed path has something to be distinguished FROM.
//
// ⚠ AND THE COUNT ASSERTION IS THE FIXTURE'S DELETION TRIGGER, NOT A TIDINESS CHECK. Exactly two
// entries. Add a real theme and the count is three and this suite fails until the twin is deleted,
// so the trigger lives in the code rather than in a PR body nobody re-reads. Without the count a
// carelessly-added third theme would pass the identity check by simply not being compared — which
// is the specific hole the owner named when ruling on this.
//
// PART B — THE THREE-SURFACE AGREEMENT. `lib/theme.ts`, `THEME_METRICS` in three-pane.ts, and
// `SETTINGS_THEME_VALUES` in site-settings-format.ts each hold theme names, and NONE of them can
// import another: ralph loads all three raw under --experimental-strip-types, which resolves a
// relative import only WITH the `.ts` extension, and tsc rejects that extension without
// `allowImportingTsExtensions`. So the single source of truth here is enforced rather than
// imported — the same posture SITE_SETTINGS_FIELD_ORDER already takes toward keystatic.config.ts.
//
// PART C — BOTH HALVES, VIA A ROUND TRIP. #159's flag-2 is the precedent: a field wired into the
// sanitizer and not the serializer validates cleanly and then vanishes on write, and the bug looks
// like the editor ignoring you. ⚠ THE ASSERTION THAT WOULD MISS THAT IS "EACH FUNCTION MENTIONS
// THE FIELD" — a silent drop passes it. So C runs a patch through sanitize -> transform and asserts
// the value SURVIVES to the object that gets dumped.
//
// PART D — THE FAIL-CLOSED ASYMMETRY. Silent on the public site, loud in the studio. A visitor must
// never see an unthemed page; an author must never be left wondering why their choice did nothing.
// Both directions are asserted, because either one alone is a defect.
import { readFileSync } from "node:fs";
import {
  DEFAULT_THEME, VERIFY_THEME, THEME_NAMES, resolveTheme, isKnownTheme, selectableThemes,
} from "../../lib/theme.ts";
import { THEME_METRICS, ACTIVE_THEME } from "../../lib/studio/three-pane.ts";
import {
  sanitizeSiteSettingsPatch, transformSiteSettings, SITE_SETTINGS_FIELD_ORDER,
} from "../../lib/studio/site-settings-format.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

console.log("\nA · the verification twin, and the count that deletes it");

const metricKeys = Object.keys(THEME_METRICS).sort();
t("A1 exactly two theme entries — a third means theme two landed, delete the twin",
  metricKeys.length, 2);
t("A2 one of them is the twin", metricKeys.includes(VERIFY_THEME), true);
t("A3 the other is the shipping default", metricKeys.includes(DEFAULT_THEME), true);

/* ⚠ IDENTITY IS ASSERTED OVER THE WHOLE ENTRY, not over the one number the layout reads. A twin
 * that matched on `measure68chPx` and drifted on `bodyFont` would still be a fixture pretending to
 * be a theme, and the layout would agree with it right up until something else read the font. */
t("A4 the twin resolves identically to the default, in every field",
  THEME_METRICS[VERIFY_THEME], THEME_METRICS[DEFAULT_THEME]);
t("A5 they are distinct objects, so identity is a property of the VALUES not a shared reference",
  THEME_METRICS[VERIFY_THEME] === THEME_METRICS[DEFAULT_THEME], false);

/* The twin exists to be resolved and NOT to be shipped. Both halves of that. */
t("A6 the twin is resolvable", resolveTheme(VERIFY_THEME), VERIFY_THEME);
t("A7 the twin is NOT selectable, so it cannot be published by accident",
  selectableThemes().includes(VERIFY_THEME), false);
t("A8 the shipping default IS selectable", selectableThemes(), [DEFAULT_THEME]);

console.log("\nB · three surfaces holding theme names, none able to import another");

t("B1 lib/theme.ts and THEME_METRICS agree on the key set",
  [...THEME_NAMES].sort(), metricKeys);

/* The sanitizer's local copy is the SELECTABLE list, which is the names minus the twin. */
const settingsSrc = read("lib/studio/site-settings-format.ts");
const declared = /const SETTINGS_THEME_VALUES = \[([^\]]*)\]/.exec(settingsSrc);
t("B2 SETTINGS_THEME_VALUES is declared in the sanitizer's module", Boolean(declared), true);
const settingsValues = declared
  ? [...declared[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort()
  : [];
t("B3 the sanitizer's local copy equals selectableThemes()", settingsValues, selectableThemes().sort());

t("B4 ACTIVE_THEME is a name the resolver knows", isKnownTheme(ACTIVE_THEME), true);
/* ⚠ AND IT IS THE DEFAULT, NOT MERELY KNOWN. Pointing the shipped layout constant at the twin
 * would make the fixture load-bearing, which is the failure mode the twin's own comment warns of. */
t("B5 ACTIVE_THEME is the shipping default, never the fixture", ACTIVE_THEME, DEFAULT_THEME);

console.log("\nC · both halves — the field survives a full round trip");

t("C1 the serializer's field order carries theme",
  SITE_SETTINGS_FIELD_ORDER.includes("theme"), true);
t("C2 theme leads the order, because it governs every other field's rendering",
  SITE_SETTINGS_FIELD_ORDER[0], "theme");

/* ⚠ THIS IS THE ASSERTION #159's FLAG-2 WOULD HAVE FAILED. Sanitize then transform, and read the
 * value off the object that gets dumped — a field dropped by either half never arrives. */
const sanitized = sanitizeSiteSettingsPatch({ theme: DEFAULT_THEME });
t("C3 the sanitizer accepts a known theme", sanitized.ok, true);
t("C4 and carries it into the patch", sanitized.ok && sanitized.patch.theme, DEFAULT_THEME);

/* ⚠ THE LOADED OBJECT HAS NO THEME, AND THAT IS THE WHOLE ASSERTION. The first version of C6
 * seeded `loaded` with the theme it then asserted, so the value arrived from the FILE and the
 * patch was never the thing being tested — teaching the serializer to skip `theme` the way it
 * skips `photo` passed it cleanly. Mutation caught that, which is the only reason it is not still
 * here. Starting from a file that predates the field is also the real first-write case. */
const loaded = { heroCopy: "x", email: "a@b.co" };
const round = sanitized.ok ? transformSiteSettings(loaded, sanitized.patch) : { ok: false };
t("C5 the serializer transform succeeds", round.ok, true);
t("C6 ⚠ AND THE VALUE SURVIVES TO THE OBJECT THAT IS DUMPED — the silent-drop assertion",
  round.ok && round.value.theme, DEFAULT_THEME);
t("C7 theme is first in the serialized key order too",
  round.ok && Object.keys(round.value)[0], "theme");

/* The field must also be in the schema the reader parses, or the write round-trips to a key the
 * reader never looks at. Read from source: the config imports @keystatic/core, which does not load
 * under bare strip-types. */
const configSrc = read("keystatic.config.ts");
const settingsBlock = configSrc.slice(configSrc.indexOf("siteSettings: singleton("));
t("C8 the keystatic schema declares theme", /^\s*theme: fields\./m.test(settingsBlock), true);
/* ⚠ `text`, NOT `select`. A select would give the reader a second opinion about validity, and an
 * unknown value must fall closed rather than throw and take a public page down with it. */
t("C9 and declares it as text, so validity has ONE owner",
  /^\s*theme: fields\.text\(/m.test(settingsBlock), true);

const yaml = read("content/site-settings.yaml");
t("C10 the content file carries a theme the resolver knows",
  isKnownTheme((/^theme:\s*(\S+)/m.exec(yaml) ?? [])[1]), true);

console.log("\nD · fail closed — silent on the public site, loud in the studio");

for (const [label, input] of [
  ["missing", undefined], ["null", null], ["empty", ""], ["whitespace", "   "],
  ["misspelt", "crema"], ["wrong-typed", 42], ["object", {}], ["array", ["cream"]],
  ["case-shifted", "Cream"], ["padded", " cream "],
]) {
  t(`D1 ${label} resolves silently to the shipping default`, resolveTheme(input), DEFAULT_THEME);
}
t("D2 a known theme is returned unchanged", resolveTheme(DEFAULT_THEME), DEFAULT_THEME);

/* ⚠ THE OTHER HALF OF THE PAIR. The same bad value the reader swallows must be REFUSED at write
 * time, or an author gets a silent no-op instead of an error. */
const badWrite = sanitizeSiteSettingsPatch({ theme: "crema" });
t("D3 the sanitizer REJECTS an unknown theme", badWrite.ok, false);
t("D4 and names the field, so the studio can point at it",
  !badWrite.ok && badWrite.error.field, "theme");
t("D5 and says what was wrong", !badWrite.ok && /unknown theme/.test(badWrite.error.message), true);
t("D6 the twin is refused at write time even though it resolves",
  sanitizeSiteSettingsPatch({ theme: VERIFY_THEME }).ok, false);

/* The reader is the module the public page calls. Assert it calls the resolver rather than
 * coalescing the raw value the way every other field does. */
const readerSrc = read("lib/keystatic.ts").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
t("D7 the reader resolves the theme rather than coalescing it",
  /theme:\s*resolveTheme\(raw\.theme\)/.test(readerSrc), true);
t("D8 and nothing in the reader falls back to a bare string for it",
  /theme:\s*\(raw\.theme as string\)/.test(readerSrc), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
