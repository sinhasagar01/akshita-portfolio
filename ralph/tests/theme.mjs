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
  DEFAULT_THEME, VERIFY_THEME, SECOND_THEME, THEME_NAMES, resolveTheme, isKnownTheme,
  selectableThemes, unselectableReason, THEME_SPLASH, BRAND_CHROME_COLOR,
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
t("A8 selectable is exactly the resolvable names that have no stated exclusion",
  selectableThemes(), THEME_NAMES.filter((n) => !unselectableReason(n)));
t("A8 ⚠ EVERY EXCLUSION CARRIES A REASON — an unexplained one is what a cleanup deletes",
  THEME_NAMES.filter((n) => !selectableThemes().includes(n) && !unselectableReason(n)), []);
/* ⚠ HARBOUR LEFT THIS SET IN #328 AND THE ASSERTION SAYS SO RATHER THAN SHRINKING QUIETLY. It was
 * held back because the render found 14 warm colours no theme could move; 12 now do. The twin is
 * the only permanent member, and a second entry appearing here again means something else is being
 * held — which should be visible in a diff, not absorbed by a `.length` check. */
t("A8 the twin is the ONLY permanent exclusion — harbour unheld in #328",
  THEME_NAMES.filter((n) => unselectableReason(n)), [VERIFY_THEME]);
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

const creamBlock = blockOf('[data-theme="cream"]');
const harbBlock = blockOf('[data-theme="harbour"]');
t("G1 cream has a scoped block — without one it is unreachable below a non-cream ancestor",
  creamBlock !== null, true);
t("G2 …and so does harbour, so G3 compares two real sets", harbBlock !== null, true);

const creamNames = creamBlock ? namesIn(creamBlock) : new Set();
const harbNames = harbBlock ? namesIn(harbBlock) : new Set();
console.log(`         cream declares ${creamNames.size}, harbour ${harbNames.size}`);
t("G3 the population is real — a zero would make G4 and G5 vacuous", creamNames.size > 20, true);
t("G4 ⚠ EVERY THEME DECLARES THE SAME TOKEN SET — one missing token inherits the ancestor's",
  [...harbNames].filter((n) => !creamNames.has(n)).sort()
    .concat([...creamNames].filter((n) => !harbNames.has(n)).sort()), []);

/* The drift objection, answered. The scoped cream block is a second copy of values `@theme` already
 * holds, and the reason that was refused for so long. It is allowed here because THIS compares them
 * — a copy that cannot silently disagree is not the copy the objection was about. */
const themeVals = valuesIn(blockOf("@theme") ?? "");
const creamVals = creamBlock ? valuesIn(creamBlock) : new Map();
t("G5 ⚠ AND THE SCOPED COPY MATCHES @theme EXACTLY — the drift objection, answered by comparison",
  [...creamVals].filter(([k, v]) => themeVals.get(k) !== v).map(([k]) => k).sort(), []);

/* The twin shares cream's selector list rather than having a block of its own, so they are identical
 * by BEING ONE DECLARATION. This asserts that arrangement rather than the values, because comparing
 * a rule to itself would prove nothing. */
t("G6 the verification twin rides cream's own rule, so the two cannot drift apart",
  new RegExp('\\[data-theme="cream"\\],\\s*\\[data-theme="' + VERIFY_THEME + '"\\]').test(cssSrc), true);

console.log("\nH · the mark is INVARIANT — the one category no theme may move");

/* ⚠ SECTION G ASSERTS EVERY THEME DECLARES THE SAME TOKEN SET, AND THAT IS NOT THIS CLAIM. G says
 * the palettes AGREE with each other. A token absent from every block satisfies G trivially, so G
 * would go on passing if a theme quietly started overriding the mark — because the moment BOTH
 * blocks declared it, they would agree.
 *
 * So invariance is its own category rather than an exception to G, exactly as the ruling framed it.
 * The mark is the one thing whose job is to NOT move: the cursor, the loader and the hero auras all
 * failed the signature test because they were decoration that happened to be warm, and a logo that
 * changes colour weekly is not a themed logo but an unreliable one.
 *
 * ⚠ AND THE ASSERTION IS NEGATIVE, WHICH IS WHY THE POPULATION IS STATED. "No block declares it" is
 * true of a token that does not exist at all, so H1 pins that the tokens ARE declared in `@theme`
 * and H3 pins that they have real consumers. Without both, deleting the mark would make this
 * section greener. */
const INVARIANT = ["--color-mark", "--color-mark-on-dark"];
const themeDecl = namesIn(blockOf("@theme") ?? "");
t("H1 the invariant tokens are declared in @theme — a missing token satisfies H2 for free",
  INVARIANT.filter((n) => !themeDecl.has(n)), []);

const overriders = [];
for (const name of THEME_NAMES) {
  const b = blockOf(`[data-theme="${name}"]`);
  if (!b) continue;
  const names = namesIn(b);
  for (const n of INVARIANT) if (names.has(n)) overriders.push(`${name} overrides ${n}`);
}
t("H2 ⚠ NO THEME OVERRIDES THE MARK — this is the one category section G cannot express",
  overriders.sort(), []);

/* A token nothing uses is not invariant, it is dead — and this repo has just deleted one of those
 * (`accent-400`, whose comment claimed it was load-bearing while nothing referenced it). */
const markUses = (cssSrc.match(/var\(--color-mark(-on-dark)?\)/g) ?? []).length;
console.log(`         ${markUses} consumers of the invariant tokens`);
t("H3 …and they have real consumers, so H2 is not passing over a dead pair", markUses >= 5, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
