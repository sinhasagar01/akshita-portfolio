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
import { parseColor, parseOklch } from "../../lib/theme-contrast.ts";
import { readFileSync } from "node:fs";
import {
  DEFAULT_THEME, VERIFY_THEME, SECOND_THEME, THEME_NAMES, resolveTheme, isKnownTheme,
  selectableThemes, unselectableReason, THEME_SPLASH, THEME_OG, BRAND_CHROME_COLOR,
  THEME_GROUND, THEME_COUNTERPART,
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

/* ⚠ THE COUNT ASSERTION CHANGED SUBJECT IN 6b, AND THE OLD ONE WAS A DELETION TRIGGER.
 * It read "exactly two entries", so adding a real theme made three and failed until the twin was
 * deleted. That was right while the twin's only job was exercising a one-valued reader. The twin
 * now carries the cross-theme gate's "nothing but the attribute" assertion, which no real theme
 * can provide, so it is a PERMANENT CONTROL and the trigger would have deleted something
 * load-bearing. The new assertion holds it at EXACTLY ONE beside however many real themes exist,
 * so it can be neither dropped nor multiplied — and a silent deletion, which the old shape would
 * have passed with one fewer entry, now fails. */
/* ⚠ COUNTED OVER `THEME_NAMES`, THE ARRAY, AND NOT ONLY OVER THE OBJECT'S KEYS. Mutation exposed
 * that half of this was unfalsifiable: a duplicate key in an object literal collapses, so
 * `Object.keys` can never report two twins however hard you try to add one. The array is where
 * multiplication is expressible, so that is where it is asserted. The metrics side still gets the
 * presence check, which is the half a cleanup would break.
 *
 * The "at least one real theme" assertion that stood here is deleted rather than kept. It could
 * only be falsified by removing `cream`, which crashes the module before any assertion runs — and
 * B5 already asserts ACTIVE_THEME is the default. An assertion that cannot fail without a crash is
 * the vacuous shape this repo deletes rather than documents. */
t("A1 ⚠ EXACTLY ONE TWIN AMONG THE RESOLVER'S NAMES — not zero, which a cleanup would leave",
  THEME_NAMES.filter((n) => n === VERIFY_THEME).length, 1);
t("A2 and it has an entry in the metrics, so a permanent control cannot be half-deleted",
  metricKeys.filter((k) => k === VERIFY_THEME).length, 1);
t("A3 the shipping default is one of the real themes", metricKeys.includes(DEFAULT_THEME), true);

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
/* ⚠ THE SUBJECT MOVED TWICE AND THE ASSERTION MOVED WITH IT BOTH TIMES. It read `[DEFAULT_THEME]`
 * while cream was the only palette; theme two made that false; and holding harbour back made
 * "every real theme is selectable" false in turn. The claim that survives all three is that
 * SELECTABLE IS EXACTLY THE RESOLVABLE NAMES MINUS THE ONES WITH A STATED REASON — which still
 * fails if the twin leaks in, still fails if a theme is added to the resolver and forgotten in the
 * sanitizer, and now also fails if something is excluded with no reason recorded. */
/* ⚠ A8 RESTATES THE IMPLEMENTATION, so A8a anchors it to the list a person can read. The
 * equivalence is still worth asserting — it is what fails if a theme is added to the resolver and
 * forgotten in the sanitizer — but on its own, a broken `unselectableReason` moves both sides. */
/* ⚠ SIX SINCE #394, AND THE SIXTH DOES NOT RAISE THE LIGHT CEILING. Five is still the maximum for
 * the LIGHT band — seven hues on a circle sit 51.4 degrees apart, so six light palettes plus the
 * twin cannot clear D12's 60 degree floor. Sapphire is the first member of the DARK band, which has
 * its own circle, its own count and no measured floor yet because it has one member.
 *
 * ⚠ FIVE SINCE #377, AND FIVE IS THE CEILING RATHER THAN A WAYPOINT. Seven hues on a circle sit
 * 51.4 degrees apart at perfect spacing, so six real palettes plus the twin cannot all clear D12's
 * 60 degree ground floor. A sixth requires LOWERING THAT FLOOR, which is a design decision about
 * how distinct two themes must be — not a matter of finding another good palette. */
/* ⚠ SIX SELECTABLE NOW, AND THE ROW'S OWN TITLE HAD BEEN WRONG SINCE SAPPHIRE WAS DERIVED. It said
 * "six real palettes — five light and one dark" while listing FIVE, because the dark one was held.
 * The title described the intended end state and the value described the held one, and nothing
 * compared them. Sapphire unheld on its second end condition: the work filter's defect is
 * pre-existing on light and shipped by six palettes, so it is not this theme's blocker. */
/* ⚠ TEN NOW, AND THE SIXTH LIGHT MEMBER ARRIVED WITHOUT LOWERING ANY FLOOR — WHICH THE TWO NOTES
 * ABOVE BOTH SAID WAS IMPOSSIBLE. Each states that five is the light ceiling because seven hues on
 * a circle sit 51.4 degrees apart and a sixth would require lowering D12's 60 DEGREE floor. Both
 * were correct about a floor measured in DEGREES and neither could see past that unit.
 *
 * `drawing-office` clears the band by having NO HUE AT ALL. #616 moved this band to dE for exactly
 * such a member, so the sixth light palette separates on lightness rather than on an arc, and the
 * pigeonhole those notes describe never applies to it. The ceiling was a property of the unit, not
 * of the circle. They are kept rather than corrected, because the reasoning was sound and it is the
 * unit that moved underneath them. */
t("A8a the selectable set is the ten real palettes — six light and four dark",
  selectableThemes(), ["cream", "harbour", "orchid", "cerise", "fern", "sapphire", "ink-flare", "nocturne", "basalt", "drawing-office"]);
t("A8 selectable is exactly the resolvable names that have no stated exclusion",
  selectableThemes(), THEME_NAMES.filter((n) => !unselectableReason(n)));
t("A8 ⚠ EVERY EXCLUSION CARRIES A REASON — an unexplained one is what a cleanup deletes",
  THEME_NAMES.filter((n) => !selectableThemes().includes(n) && !unselectableReason(n)), []);
/* ⚠ HARBOUR LEFT THIS SET IN #328 AND THE ASSERTION SAYS SO RATHER THAN SHRINKING QUIETLY. It was
 * held back because the render found 14 warm colours no theme could move; 12 now do.
 *
 * ⚠ AND THE ROW USED TO CONFLATE "EXCLUDED" WITH "PERMANENTLY EXCLUDED", which #372 exposed. It read
 * `filter(unselectableReason) === [VERIFY_THEME]` — true while the twin was the only member, and
 * FALSE the moment a new palette was held pending its render, which is exactly what harbour itself
 * did in #326. The assertion was tightened after that hold came off and quietly forbade the next one.
 *
 * The distinction is real and now stated: the TWIN is permanent; anything else here is TEMPORARY and
 * says so in its reason. A hold with no end condition is the thing that should not exist. */
const held = THEME_NAMES.filter((n) => unselectableReason(n));
const permanent = held.filter((n) => /permanent/i.test(unselectableReason(n) ?? ""));
t("A8 the twin is the only PERMANENT exclusion — harbour unheld in #328",
  permanent, [VERIFY_THEME]);
t("A8 ⚠ AND EVERY TEMPORARY HOLD NAMES WHAT WOULD END IT — a hold with no end condition is a deletion nobody made",
  held.filter((n) => !permanent.includes(n))
    /* ⚠ THE MATCHER WAS `render|until|pending` AND THE CONCEPT IS WIDER THAN ITS VOCABULARY. A hold
     * reading "ENDS when the two nodes clear, OR when it is ruled that…" states two checkable end
     * conditions and matched none of the three words — so the row would have failed a BETTER reason
     * than the ones it accepts. Same shape as `role-layer`'s guard whose filter was its own
     * precondition: bending the prose to fit the matcher is the wrong repair. */
    .filter((n) => !/\bends?\b|render|until|pending|when|clears?\b/i.test(unselectableReason(n) ?? "")), []);
t("A8 …and the second theme is publishable", selectableThemes().includes(SECOND_THEME), true);
t("A8 …and at least one theme is publishable, or the site has no palette at all",
  selectableThemes().length >= 1, true);

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

console.log("\nF · the PWA splash — the one place a theme's ground exists as JS, not CSS");

t("F1 every theme has a splash ground", Object.keys(THEME_SPLASH).sort(), [...THEME_NAMES].sort());
t("F2 the control's splash is byte-identical to the default's, like every value it holds",
  THEME_SPLASH[VERIFY_THEME], THEME_SPLASH[DEFAULT_THEME]);
t("F3 the real themes differ, so the field is not a constant wearing a lookup",
  THEME_SPLASH[DEFAULT_THEME] !== THEME_SPLASH[SECOND_THEME], true);
/* ⚠ THE FIELD THAT DOES NOT FOLLOW THE THEME, ASSERTED AS AN ABSENCE. `theme_color` tints a
 * surface the site does not own, so it is a single constant — and a future "finish the job" pass
 * that adds it to the per-theme map fails here rather than shipping a weekly-changing address bar. */
t("F4 the chrome colour is a single constant, NOT a per-theme value",
  typeof BRAND_CHROME_COLOR === "string" && !Object.values(THEME_SPLASH).includes(BRAND_CHROME_COLOR), true);
const manifestSrc = read("app/manifest.ts").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
t("F5 the manifest reads the splash per theme and the chrome as a constant",
  /background_color: THEME_SPLASH\[theme\]/.test(manifestSrc)
    && /theme_color: BRAND_CHROME_COLOR/.test(manifestSrc), true);

console.log("\nE · the attribute — emitted on <html>, resolved rather than literal");

/* ⚠ SOURCE-LEVEL ONLY, DELIBERATELY. Whether the attribute lands in the PRERENDERED HTML of every
 * public route is a build fact, and the cross-theme snapshot diff proves it far better than a
 * regex could — two builds differing only in the published theme, compared page by page. Asserting
 * it here from `.next` would make this suite silently vacuous whenever the build output is stale or
 * absent, which is the failure mode ralph already refuses to accept elsewhere. */
const layout = read("app/layout.tsx").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
t("E1 the root layout emits data-theme", /data-theme=\{/.test(layout), true);
t("E2 ⚠ ON <html>, WHICH IS THE HOST THAT PAINTS THE PAGE GROUND — a wrapper leaves a band",
  /<html[\s\S]{0,200}?data-theme=\{/.test(layout), true);
t("E3 the value comes from the settings read, not a literal",
  /const theme = settings\?\.theme/.test(layout) && /data-theme=\{theme\}/.test(layout), true);
t("E4 and the layout is async, so the read is awaited rather than dropped",
  /export default async function RootLayout/.test(layout), true);

console.log("\nG · every palette is reachable as a SCOPED override, not only as a page default");

/* ⚠ THE BUG THIS EXISTS FOR. "cream is the fallback" is true at the ROOT and false below a theme
 * that is not cream. The studio switcher previews palettes by putting `data-theme` on a SPAN, and
 * with harbour published `data-theme="cream"` matched no rule — so the cream swatch inherited
 * harbour and the two palettes previewed identically.
 *
 * ⚠ AND THE TWIN WAS INHERITING TOO, which means its "byte-identical to the default" assertion was
 * passing because BOTH SIDES read the ambient theme. Under harbour it was byte-identical to
 * HARBOUR. A control that agrees with whatever surrounds it is not a control.
 *
 * So every theme name that renders must have a block, and the blocks must declare the SAME TOKEN
 * SET — a palette missing one token falls through to whatever the ancestor had, which is the same
 * defect one token at a time. */
const cssSrc = read("app/globals.css");
const blockOf = (sel) => {
  const at = cssSrc.indexOf(sel);
  if (at < 0) return null;
  let d = 0, st = cssSrc.indexOf("{", at), k = st;
  for (; k < cssSrc.length; k++) { if (cssSrc[k] === "{") d++; else if (cssSrc[k] === "}") { d--; if (!d) break; } }
  return cssSrc.slice(st + 1, k);
};
const namesIn = (b) => new Set([...b.matchAll(/(--color-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const valuesIn = (b) => new Map([...b.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
  .map((m) => [m[1], m[2].trim()]));

/* ---- ⚠ DERIVED FROM `THEME_NAMES`, AND IT WAS A HARDCODED PAIR UNTIL #381 -------------------
 *
 * G4's NAME said "EVERY THEME DECLARES THE SAME TOKEN SET". Its BODY compared cream against
 * harbour. Orchid, cerise and fern were never checked — so deleting `--color-vessel-wave` from
 * fern left ralph green at 2642, which is the exact defect the row exists to catch, in three of the
 * five palettes it claims to cover.
 *
 * ⚠ AND IT WAS DOCUMENTED AND NEVER CLOSED. Section J's comment names this row by name — "Section G
 * compares cream's block to harbour's BY NAME" — written when a whole palette entered the
 * stylesheet unseen. J fixed the REGISTRATION half and left the TOKEN-SET half exactly as it found
 * it. A gap that has been written down is not a gap that has been closed, and the note reads like
 * one because it names the problem so precisely.
 *
 * ⚠ FOURTH INSTANCE OF THE FIXED-LIST SHAPE, and the worst-placed: it is the gate that would
 * enforce a token-layer ruling, so a vocabulary decision made on its evidence would have been
 * verified on two palettes out of five. */
const blocks = Object.fromEntries(THEME_NAMES.map((n) => [n, blockOf(`[data-theme="${n}"]`)]));
/* ⚠ TRUTHINESS, NOT `=== null`, AND A MUTATION IS WHY. The first version of this row read
 * `blocks[n] === null`, which is what `blockOf` returns for a selector it cannot find — but an
 * ABSENT key reads `undefined`, so emptying the map entirely left G1 GREEN while claiming every
 * theme had a block. The row whose NAME makes the claim was the one that failed to check it, and
 * G3 caught the mutation instead.
 *
 * Same family as the denominator lesson one turn earlier: a guard has to be robust to its subject
 * being absent, not merely to its subject being wrong. */
const missingBlock = THEME_NAMES.filter((n) => !blocks[n]);
t("G1 ⚠ EVERY THEME HAS A SCOPED BLOCK — without one it is unreachable below a non-cream ancestor",
  missingBlock, []);
/* ⚠ CONSTANT, NOT DERIVED FROM `THEME_NAMES`. #378: a guard that computes its expectation from the
 * subject it guards passes when the subject is empty. */
t("G2 …and there are at least five of them to compare, asserted against a literal",
  THEME_NAMES.length >= 5, true);

const nameSets = Object.fromEntries(THEME_NAMES.map((n) => [n, blocks[n] ? namesIn(blocks[n]) : new Set()]));
console.log(`         ${THEME_NAMES.map((n) => `${n} ${nameSets[n].size}`).join(", ")}`);
t("G3 every block is a real population — a zero would make G4 vacuous for that theme",
  THEME_NAMES.filter((n) => nameSets[n].size <= 20), []);

/* Cream is the reference because `@theme` IS cream and G5 pins the scoped copy to it. Differences
 * are reported PER THEME AND PER TOKEN, so a failure names what to fix rather than only that
 * something is wrong. */
const ref = nameSets[DEFAULT_THEME];
const setDrift = THEME_NAMES.filter((n) => n !== DEFAULT_THEME).flatMap((n) => [
  ...[...nameSets[n]].filter((k) => !ref.has(k)).sort().map((k) => `${n} declares ${k}, ${DEFAULT_THEME} does not`),
  ...[...ref].filter((k) => !nameSets[n].has(k)).sort().map((k) => `${n} is MISSING ${k}`),
]);
t("G4 ⚠ EVERY THEME DECLARES THE SAME TOKEN SET — one missing token silently inherits the ancestor's",
  setDrift, []);

/* The drift objection, answered. The scoped cream block is a second copy of values `@theme` already
 * holds, and the reason that was refused for so long. It is allowed here because THIS compares them
 * — a copy that cannot silently disagree is not the copy the objection was about. */
const themeVals = valuesIn(blockOf("@theme") ?? "");
const creamVals = blocks[DEFAULT_THEME] ? valuesIn(blocks[DEFAULT_THEME]) : new Map();
t("G5 ⚠ AND THE SCOPED COPY MATCHES @theme EXACTLY — the drift objection, answered by comparison",
  [...creamVals].filter(([k, v]) => themeVals.get(k) !== v).map(([k]) => k).sort(), []);

/* The twin shares cream's selector list rather than having a block of its own, so they are identical
 * by BEING ONE DECLARATION. This asserts that arrangement rather than the values, because comparing
 * a rule to itself would prove nothing. */
t("G6 the verification twin rides cream's own rule, so the two cannot drift apart",
  new RegExp('\\[data-theme="cream"\\],\\s*\\[data-theme="' + VERIFY_THEME + '"\\]').test(cssSrc), true);

/* ⚠ SECTION H IS DELETED, AND IT WAS CORRECT — ITS SUBJECT WAS REMOVED, NOT ITS REASONING.
 *
 * H asserted that no theme overrides `--color-mark`, with H1 and H3 pinning that the tokens existed
 * and had consumers so the negative could not pass over nothing. Those guards are what made the
 * deletion obvious: the owner reverted the wordmark to theming, the tokens lost their only
 * consumer, and H3 failed immediately.
 *
 * THAT IS THE ASSERTION WORKING. A gate whose subject disappears should go red, not quiet, and H3
 * existed precisely so this could not become a section passing over an empty set — the failure mode
 * G has and H was written to avoid.
 *
 * The invariance claim did not disappear with the tokens; it moved. The favicon still must not
 * follow the palette, and it now says so as a boundary row of kind `invariant` — which is the right
 * home, because the boundary file lists colours nothing MEASURES and a baked SVG literal is exactly
 * that. `colour-census` route D scans it. */

console.log("\nI · every RESOLVED HEX equals the token it was resolved from");

/* ⚠ TWO MAPS HOLD RESOLVED HEX AND NEITHER WAS EVER CHECKED AGAINST THE STYLESHEET. `THEME_SPLASH`
 * says each value "IS its theme's --color-cream-50, resolved. Not an approximation" — a claim `F1`
 * to `F3` never tested, because they assert STRUCTURE (every theme has one, the twin matches the
 * default, the real themes differ). `THEME_OG` makes the same kind of claim for four colours.
 *
 * A hex resolved by hand from an OKLCH token is exactly the shape `token-claims` was built for, one
 * layer out: the claim lives in prose and the value drifts silently. The difference is that these
 * are PER THEME, so the token must be read from that theme's own block rather than from `@theme`.
 *
 * ⚠ AND BOTH ARE FORCED, NOT PREFERRED. `ImageResponse` and a JSON manifest both render outside the
 * document and cannot read a custom property — which is why the value is duplicated at all, and why
 * the only honest guard is a comparison rather than a convention. */
const themeBlockFor = (name) => (name === DEFAULT_THEME || name === VERIFY_THEME)
  ? blockOf("@theme") : blockOf(`[data-theme="${name}"]`);
const declaredIn = (block, token) => {
  const m = new RegExp(`--color-${token}\\s*:\\s*([^;]+);`).exec(block ?? "");
  return m ? m[1].trim() : null;
};
const toRgb = (v) => (v.startsWith("oklch") ? parseOklch(v) : parseColor(v));
const hexOf = (v) => {
  const c = parseColor(v);
  return c ? c.map((n) => Math.round(n)).join(",") : null;
};
const near = (hex, decl) => {
  const a = parseColor(hex), b = decl && toRgb(decl);
  if (!a || !b) return null;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};

const drift = [];
let checked = 0;
for (const name of THEME_NAMES) {
  const block = themeBlockFor(name);
  const splash = THEME_SPLASH[name];
  if (splash) {
    checked++;
    const d = near(splash, declaredIn(block, "cream-50"));
    if (d === null || d > 1) drift.push(`${name} splash ${splash} vs cream-50 — ${d === null ? "unresolvable" : d.toFixed(1)} away`);
  }
  const og = THEME_OG[name];
  if (og) {
    for (const [key, token] of [["cream", "cream-50"], ["ink", "ink-950"], ["muted", "ink-600"], ["accent", "accent-500"]]) {
      checked++;
      const d = near(og[key], declaredIn(block, token));
      if (d === null || d > 1) drift.push(`${name} og.${key} ${og[key]} vs ${token} — ${d === null ? "unresolvable" : d.toFixed(1)} away`);
    }
  }
}
console.log(`         ${checked} resolved values compared against their own theme's declaration`);
t("I1 the population is real — a zero here means no map was read", checked >= 12, true);
t("I2 ⚠ EVERY RESOLVED HEX MATCHES ITS TOKEN — a hand-kept value is allowed only because this runs",
  drift.sort(), []);

/* The OG map must cover every theme, or a palette renders a card in another palette's colours. */
t("I3 every theme has an OG palette — a missing one would silently draw cream",
  THEME_NAMES.filter((n) => !THEME_OG[n]), []);

console.log("\nJ · every palette IN THE STYLESHEET is a palette the code knows about");

/* ⚠ A WHOLE PALETTE ENTERED `globals.css` AND NO GATE SAW IT. Theme three was written as a
 * `[data-theme="orchid"]` block with 35 tokens and ralph stayed green at 2585 — because EVERY theme
 * check here enumerates from `THEME_NAMES` or from a hardcoded pair, and none reads the stylesheet
 * to ask what is actually declared.
 *
 * Section G compares cream's block to harbour's BY NAME. Section I walks `THEME_NAMES`.
 * `colour-census` T2 checks `["harbour", "cream-verify"]` as a literal list. All three are correct
 * about the palettes they were told about, and blind to one they were not.
 *
 * ⚠ THIRD INSTANCE OF THE FIXED-LIST SHAPE IN AS MANY TASKS — `theme-contrast`'s cream-plus-overrides
 * merge, `cascade-public`'s TAG set, and now this. #371's semantic pass named it: a subject narrowed
 * by a fixed list is sound only while the world outside the list stays empty, and NOTHING INSIDE THE
 * SUITE OBSERVES THAT WORLD. This is the row that observes it. */
const declaredThemes = [...new Set(
  [...cssSrc.matchAll(/\[data-theme="([a-z-]+)"\]/g)].map((m) => m[1]),
)].sort();
console.log(`         ${declaredThemes.length} palettes declared in globals.css: ${declaredThemes.join(", ")}`);
t("J1 the stylesheet declares palettes at all — a zero would make J2 vacuous", declaredThemes.length >= 2, true);
t("J2 ⚠ EVERY PALETTE IN THE STYLESHEET IS IN `THEME_NAMES` — an unregistered one is invisible to every other row",
  declaredThemes.filter((n) => !THEME_NAMES.includes(n)), []);
t("J3 …and every registered name has a block or is the default, so the two lists agree both ways",
  THEME_NAMES.filter((n) => n !== DEFAULT_THEME && !declaredThemes.includes(n)), []);


/* ============================================================================================
   V · THE VESSEL'S TINT RULE, AND ITS REFERENCE.

   ⚠ THE RULE IS `pearl` AGAINST `glass`, NOT AGAINST ANY GROUND. It was recorded as "lightness step
   -2, hue delta 0, chroma step 0.009-0.013" with NO REFERENCE NAMED, and it reproduces against none
   of the three a reader reaches for first — `cream-50`, `canvas` and `band-dark` each return a
   spread wide enough to look like a refutation, one of them WITH SIGN CHANGES. A wrong reference
   does not produce nonsense; it produces a confident correction.

   ⚠ SO THIS SECTION EXISTS TO MAKE THE REFERENCE MECHANICAL. Prose naming a reference is a claim
   nothing reads — the `count:` and `category:` defects one more time.

   ⚠ V3 ASSERTS A SIGNED BAND, NOT A MAGNITUDE, AND A MUTATION IS WHY. The first version took
   `Math.abs`, and dropping glass's chroma below pearl's flipped the step to +0.009 — INSIDE the
   magnitude band, with the tint inverted. `pearl` is always the LESS chromatic of the two; that is
   part of the rule and a magnitude cannot say it.

   ⚠ AND V4's FIRST VERSION WAS A GUARD DERIVED FROM ITS OWN SUBJECT. It computed `glass.c + step`
   where `step` is `pearl.c - glass.c`, so it was asserting `pearl.c >= 0` — true by construction for
   any authored value, and it SURVIVED the mutation it was written for. The floor is now the RULE's
   own constant, so a palette cannot hollow it out by declaring a smaller step.
============================================================================================ */
/* The rule's own constants. A gate comparing against these cannot be satisfied by moving the subject. */
const TINT_dL = 2.00, TINT_dC_MIN = -0.013, TINT_dC_MAX = -0.009;

/* ⚠ A NAMED EXEMPTION, NOT A WIDENED BAND. `basalt` draws a ZERO-CHROMA ground by design, so its
 * vessel has no chroma for the tint's step to act on and V3 and V4 both fail — exactly as V4 was
 * written to. Widening the band to admit it would silence the tripwire for every palette, which is
 * the escape hatch this suite refuses; naming the member keeps the rule intact and the exception
 * visible.
 *
 * ⚠ SCOPED TO INDEPENDENTLY AUTHORED PRESETS AND NOT INHERITED BY PROXIMITY. A palette DERIVED from
 * the system gets no exemption here, and a future achromatic palette must be added by name with its
 * own reason rather than matching a pattern.
 *
 * ⚠ AND THE COST IS RECORDED RATHER THAN WAIVED: the four vessel tones separate on 4.0 LIGHTNESS
 * UNITS ALONE where every chromatic palette carries the separation in lightness and chroma
 * together. Whether that reads as smoke is a RENDER question, and the render is the end condition. */
const TINT_EXEMPT = {
  basalt: "owner ruling — an independently authored achromatic preset. Its ground is c 0 by design, "
        + "so the chroma step has nothing to act on. END: the exemption is reviewed if the preset's "
        + "ground ever carries chroma, or if the vessel gains an achromatic derivation of its own.",
  "drawing-office": "the SECOND member of the class basalt's exemption already describes, and it "
        + "joins that exemption rather than widening the band — V4 is the achromatic tripwire and it "
        + "fired correctly. Its whole design is zero chroma, so the tint's step has nothing to act "
        + "on, exactly as basalt's does not. ⚠ TWO MEMBERS IS THE TRIGGER RATHER THAN THE SETTLEMENT: "
        + "one exempt palette is a preset nobody derived, two is a CLASS, and a class wants the "
        + "achromatic vessel derivation this entry keeps deferring instead of a third exemption. "
        + "END: the exemption is reviewed the moment a third achromatic palette is proposed, or when "
        + "the vessel gains a derivation that separates its tones on lightness alone.",
};

const vBlocks = {};
for (const m of cssSrc.matchAll(/\[data-theme="([a-z-]+)"\]\s*\{/g)) {
  const o = cssSrc.indexOf("{", m.index); let d = 0, e = -1;
  for (let i = o; i < cssSrc.length; i++) { if (cssSrc[i] === "{") d++; else if (cssSrc[i] === "}" && --d === 0) { e = i; break; } }
  vBlocks[m[1]] = cssSrc.slice(o + 1, e);
}
{
  const at = cssSrc.indexOf("@theme"), o = cssSrc.indexOf("{", at); let d = 0, e = -1;
  for (let i = o; i < cssSrc.length; i++) { if (cssSrc[i] === "{") d++; else if (cssSrc[i] === "}" && --d === 0) { e = i; break; } }
  vBlocks[DEFAULT_THEME] = cssSrc.slice(o + 1, e);
}
const vOklch = (blk, tok) => {
  const m = blk?.match(new RegExp(`--color-${tok}\\s*:\\s*oklch\\(\\s*([\\d.]+)%?\\s+([\\d.]+)\\s+([\\d.]+)`));
  return m ? { l: +m[1], c: +m[2], h: +m[3] } : null;
};
/* The subject is DERIVED from the palettes that declare a vessel, never enumerated — an enumerated
 * subject is correct the day it is written and falls behind its population from then on. */
const vSubjects = Object.keys(vBlocks)
  .filter((n) => vOklch(vBlocks[n], "vessel-glass") && vOklch(vBlocks[n], "vessel-pearl"))
  .filter((n) => !(n in TINT_EXEMPT)).sort();
const vRows = vSubjects.map((n) => {
  const g = vOklch(vBlocks[n], "vessel-glass"), pl = vOklch(vBlocks[n], "vessel-pearl");
  return { n, dL: +(pl.l - g.l).toFixed(4), dC: +(pl.c - g.c).toFixed(4), dH: +(pl.h - g.h).toFixed(4), glassC: g.c };
});
for (const r of vRows) console.log(`         ${r.n.padEnd(12)} pearl-vs-glass  dL ${r.dL}  dC ${r.dC}  dH ${r.dH}   glass c ${r.glassC}`);

t("V0 ⚠ THE TINT SUBJECT IS NON-EMPTY AND COVERS EVERY PALETTE THAT DECLARES A VESSEL, against a literal",
  vSubjects.length >= 5, true);
t("V0b ⚠ EVERY EXEMPTED PALETTE IS REAL AND NAMES AN END CONDITION — an exemption for a palette that does not exist is a rule quietly deleted",
  Object.entries(TINT_EXEMPT).filter(([n, why]) => !(n in vBlocks) || !/END:/.test(why)).map(([n]) => n), []);
t("V0c …and every exemption is EARNED — a palette that would pass the rule must not be exempt from it",
  Object.keys(TINT_EXEMPT).filter((n) => {
    const g = vOklch(vBlocks[n], "vessel-glass");
    return g && g.c >= -TINT_dC_MIN;
  }), []);
t("V0a …and it is derived from the stylesheet rather than listed, so a new palette joins it automatically",
  vSubjects.filter((n) => !THEME_NAMES.includes(n)), []);
t("V1 ⚠ THE LIGHTNESS STEP IS EXACTLY 2.00 FROM `vessel-glass` — the reference the rule never named",
  vRows.filter((r) => Math.abs(r.dL - TINT_dL) > 0.001).map((r) => `${r.n} dL ${r.dL}`), []);
t("V2 …and the hue delta is exactly 0, so the tint is one hue at two lightnesses",
  vRows.filter((r) => r.dH !== 0).map((r) => `${r.n} dH ${r.dH}`), []);
t("V3 ⚠ AND THE CHROMA STEP IS A SIGNED BAND, -0.013 to -0.009 — a magnitude passes an inverted tint",
  vRows.filter((r) => r.dC < TINT_dC_MIN - 1e-9 || r.dC > TINT_dC_MAX + 1e-9).map((r) => `${r.n} dC ${r.dC}`), []);
/* ⚠ V4 IS THE ACHROMATIC TRIPWIRE, AND ITS FLOOR IS THE RULE'S CONSTANT. A ground at chroma 0 cannot
 * take the step at all, so the rule degenerates to lightness alone — and silence reads as a pass,
 * the same shape as a hue floor in degrees being SILENT about a palette with no hue. Fail by name. */
t("V4 ⚠ EVERY VESSEL'S GLASS CARRIES ENOUGH CHROMA FOR THE RULE'S OWN STEP — below 0.013 the tint collapses onto lightness alone",
  vRows.filter((r) => r.glassC < -TINT_dC_MIN - 1e-9).map((r) => `${r.n}: glass c ${r.glassC} < ${-TINT_dC_MIN}`), []);


console.log("\nW · the counterpart registry — completeness and structure, never the choice");
/* ⚠ THE SUBJECT OF THIS SECTION IS COMPLETENESS, NOT CORRECTNESS, AND THAT LINE IS THE WHOLE POINT.
 * A counterpart is a JUDGEMENT — `lib/theme.ts` records the two hue derivations that look obvious
 * and shows that neither reproduces the map, each failing on a different row. So a row here fails on
 * a MISSING name, a name that is not a real palette, or a name in the WRONG GROUND CLASS. It must
 * never be strengthened into checking WHICH palette was chosen: nothing here can know that, and a
 * gate that pretended to would be a hue rule with an assertion wrapped round it. */
const REAL_THEMES = THEME_NAMES.filter((n) => n !== VERIFY_THEME);
const LIGHTS = REAL_THEMES.filter((n) => THEME_GROUND[n] === "light");
const DARKS = REAL_THEMES.filter((n) => THEME_GROUND[n] === "dark");
console.log(`         ${REAL_THEMES.length} real palettes — ${LIGHTS.length} light, ${DARKS.length} dark`);
t("W0 the subject is real, against a literal — an empty registry would satisfy every row below",
  REAL_THEMES.length >= 5 && Object.keys(THEME_COUNTERPART).length >= 5, true);
t("W1 ⚠ EVERY REAL PALETTE HAS A COUNTERPART — a missing entry FAILS rather than defaulting to one nobody chose",
  REAL_THEMES.filter((n) => !(n in THEME_COUNTERPART)), []);
t("W1a …and nothing extra is in it, so a renamed palette leaves no orphan behind",
  Object.keys(THEME_COUNTERPART).filter((n) => !REAL_THEMES.includes(n)), []);
t("W1b ⚠ AND THE TWIN IS ABSENT ON PURPOSE — a control with a counterpart is a sixth light member, and the structure counts real palettes",
  VERIFY_THEME in THEME_COUNTERPART, false);
t("W2 every counterpart names a REAL palette — a typo resolves to nothing and would read as a blank line",
  Object.entries(THEME_COUNTERPART).filter(([, v]) => !REAL_THEMES.includes(v)).map(([k, v]) => `${k} -> ${v}`), []);
t("W2a ⚠ AND IT IS IN THE OPPOSITE GROUND CLASS — the one property of the CHOICE this gate can check",
  Object.entries(THEME_COUNTERPART).filter(([k, v]) => THEME_GROUND[k] === THEME_GROUND[v]).map(([k, v]) => `${k} -> ${v}`), []);
t("W2b …and no palette is its own counterpart, which W2a already forbids and which is worth failing by name",
  Object.entries(THEME_COUNTERPART).filter(([k, v]) => k === v).map(([k]) => k), []);
/* ⚠ THE ASYMMETRY IS FORCED BY THE COUNTS, NOT CHOSEN. Five light and four dark cannot pair
 * symmetrically, so exactly one light palette points at a dark one that points back elsewhere. These
 * three rows are that arithmetic, asserted so a future palette cannot quietly break the shape. */
t("W3 ⚠ EVERY DARK PALETTE ROUND-TRIPS — the four symmetric pairs are symmetric in fact, not by intent",
  DARKS.filter((d) => THEME_COUNTERPART[THEME_COUNTERPART[d]] !== d), []);
t("W3a …and the darks claim four DIFFERENT lights, so no light is recommended twice from that side",
  new Set(DARKS.map((d) => THEME_COUNTERPART[d])).size, DARKS.length);
/* ⚠ A ROW ASSERTING THE PIGEONHOLE WAS WRITTEN HERE, MUTATION-TESTED, AND REMOVED — RECORDED
 * BECAUSE THE REMOVAL IS THE FINDING. It read "exactly |light| - |dark| light palettes are
 * unreciprocated" and it PASSED, which is why it looked like a row. Nine mutations later it had
 * never died alone: W2a forces every counterpart cross-class and W3a forces the four darks onto
 * DISTINCT lights, and those two together FIX the unreciprocated count at |light| - |dark|. There is
 * no edit that reddens it while they stay green.
 *
 * So it was documentation wearing an assertion's clothes — true by construction, discriminating
 * nothing, and adding a row that would have to be re-derived by anyone auditing this section. The
 * arithmetic it stated is worth keeping and belongs in prose, which is where it now lives, beside
 * `THEME_COUNTERPART` in `lib/theme.ts`. The count is printed above so a reader still sees it.
 *
 * ⚠ THE TEST THAT CAUGHT IT IS THE ONE THIS REPO ALREADY NAMES: ask what would have to change for a
 * row to go red, and NAME IT. "Nothing a reasonable edit could do" is the answer that deletes a row,
 * and it is only reachable by mutating — reading this row makes it look like a real check. */
const unreciprocated = LIGHTS.filter((l) => !DARKS.some((d) => THEME_COUNTERPART[d] === l));
console.log(`         ${unreciprocated.length} light palette(s) no dark points back at: ${unreciprocated.join(", ") || "(none)"}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
