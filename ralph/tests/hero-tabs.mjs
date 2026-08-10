// The hero tabs as ONE array, and the migration of live owner copy into it.
//
// ⚠ THE MIGRATION IS THE ONLY OPERATION IN THIS CHANGE THAT CAN LOSE CONTENT, AND IT CANNOT FAIL
// LOUDLY. `tabNLabel` and `tabNLine` are the owner's own words. Moving them into `heroTabs` either
// carries them or drops them, and a DROPPED FIELD READS AS AN EMPTY FIELD — which is also the
// intended state of the ten new ones. One shape check would be satisfied by both outcomes.
//
// So the proof is TWO assertions with opposite expectations, never one: the eight existing values
// arrive BYTE-IDENTICALLY (C1), and the forty new ones are EMPTY (C2). A migration that dropped the
// copy fails C1; a migration that pasted filler fails C2. Neither can hide inside the other.
//
// F7 in `validate-blog-post` is the precedent for reading the REAL content file rather than a
// fixture, and for the same reason: this is a claim about live content, not about a function.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { load } from "js-yaml";
import { sanitizeSiteSettingsPatch, transformSiteSettings, SITE_SETTINGS_FIELD_ORDER } from "../../lib/studio/site-settings-format.ts";
import { dump } from "js-yaml";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const decomment = (b) => b.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const doc = load(read("content/site-settings.yaml")) ?? {};
const tabs = doc.heroTabs;

console.log("A · the array is the shape, and the flat keys are gone");
t("A1 heroTabs is an array of four — the subject exists before anything below reads it",
  Array.isArray(tabs) && tabs.length === 4, true);
/* ⚠ THE OLD KEYS MUST BE ABSENT, NOT MERELY UNREAD. A flat `tab1Label` left beside the array is the
   two-sources shape this restructure exists to remove, and nothing else would notice it. */
t("A2 ⚠ NO FLAT tabNLabel OR tabNLine SURVIVES — a leftover is a second place describing one tab",
  Object.keys(doc).filter((k) => /^tab[1-4](Label|Line)$/.test(k)), []);
t("A3 …and the field order names the array rather than the eight it replaced",
  [SITE_SETTINGS_FIELD_ORDER.includes("heroTabs"),
   SITE_SETTINGS_FIELD_ORDER.some((k) => /^tab[1-4]/.test(k))], [true, false]);

console.log("\nB · every tab carries all twelve fields");
/* The twelve, named rather than counted: label, headline, support, three callouts, and three stats
   of value plus unit. Ten of them are new — everything except label and headline. */
const shape = tabs.map((x, i) => {
  const bad = [];
  for (const k of ["label", "headline", "support"]) if (typeof x?.[k] !== "string") bad.push(`tab${i + 1}.${k}`);
  if (!Array.isArray(x?.callouts) || x.callouts.length !== 3) bad.push(`tab${i + 1}.callouts`);
  if (!Array.isArray(x?.stats) || x.stats.length !== 3) bad.push(`tab${i + 1}.stats`);
  else x.stats.forEach((s, j) => {
    if (typeof s?.value !== "string") bad.push(`tab${i + 1}.stats[${j}].value`);
    if (typeof s?.unit !== "string") bad.push(`tab${i + 1}.stats[${j}].unit`);
  });
  return bad;
}).flat();
t("B1 every tab has label, headline, support, three callouts and three stats of value plus unit", shape, []);

console.log("\nC · the migration, as two assertions with opposite expectations");
/* ⚠ READ FROM GIT RATHER THAN FROM A FIXTURE. The pre-migration file is the only honest source for
   what the owner's copy WAS, and a fixture would be a copy of it made by the same hand that wrote
   the migration. `git show` against the commit before this branch is the real before-state. */
const beforeRaw = execFileSync("git", ["show", "origin/main:content/site-settings.yaml"], { encoding: "utf8" });
const before = load(beforeRaw) ?? {};
t("C0 the pre-migration file still carries the eight flat keys — without them C1 compares nothing",
  [1, 2, 3, 4].every((n) => typeof before[`tab${n}Label`] === "string" && typeof before[`tab${n}Line`] === "string"), true);

const moved = [];
for (let i = 0; i < 4; i++) {
  if (tabs[i]?.label !== before[`tab${i + 1}Label`]) moved.push(`tab${i + 1}.label`);
  if (tabs[i]?.headline !== before[`tab${i + 1}Line`]) moved.push(`tab${i + 1}.headline`);
}
t("C1 ⚠ ALL EIGHT EXISTING VALUES ARRIVED BYTE-IDENTICALLY — label from tabNLabel, headline from tabNLine",
  moved, []);

const newFields = tabs.flatMap((x, i) => [
  [`tab${i + 1}.support`, x.support],
  ...x.callouts.map((c, j) => [`tab${i + 1}.callouts[${j}]`, c]),
  ...x.stats.flatMap((s, j) => [[`tab${i + 1}.stats[${j}].value`, s.value], [`tab${i + 1}.stats[${j}].unit`, s.unit]]),
]);
t("C1a …and there are exactly forty new fields, against a LITERAL rather than against themselves",
  newFields.length, 40);
t("C2 ⚠ AND EVERY ONE OF THE FORTY IS EMPTY — the opposite expectation, so a drop cannot hide as a default",
  newFields.filter(([, v]) => v !== "").map(([k]) => k), []);

console.log("\nD · the mock's filler copy never reached content");
/* ⚠ A POSITIVE CHECK, NOT A HOPE. The contract's headlines for tabs 2 to 4 are FILLER the mock's
   author wrote, not the owner's words — tab 1 is the only one that matches live copy. Pasting them
   in would look like a finished migration and would silently replace the owner's voice. Asserted by
   substring against the whole file, because the danger is the words landing ANYWHERE in settings,
   not only in the slot they were drafted for. */
const FILLER = [
  "End-to-end design for",
  "Close to research. Closer to",
  "Open to roles, and",
];
const settingsRaw = read("content/site-settings.yaml");
t("D1 none of the mock's three filler headlines appears anywhere in site settings",
  FILLER.filter((f) => settingsRaw.includes(f)), []);
/* ⚠ AND THE SEARCH MUST BE ABLE TO FIND SOMETHING, or D1 passes because the strings are wrong. The
   owner's OWN tab-1 headline is in the file, so the same method finds it. Without this row, a typo
   in FILLER would read exactly like a clean migration. */
t("D1a …and the same search finds the owner's real headline, so D1 is not passing on bad needles",
  settingsRaw.includes(tabs[0].headline), true);

console.log("\nE · the sanitizer and the serializer both, not one of them");
/* ⚠ SANITIZER-ONLY IS validate-then-silently-drop, which is Flag 2 from #159 and the first entry in
   this record. A patch that validates and then fails to serialize loses the edit with no error. */
const full = { heroTabs: tabs };
const okPatch = sanitizeSiteSettingsPatch(full);
t("E1 the sanitizer accepts the live array unchanged", okPatch.ok, true);
t("E1a …and returns it byte-identically, so acceptance is not quiet normalisation",
  JSON.stringify(okPatch.ok ? okPatch.patch.heroTabs : null), JSON.stringify(tabs));
t("E2 ⚠ AND IT REFUSES A WRONG TYPE — a value that is not an array, a tab that is not an object",
  [sanitizeSiteSettingsPatch({ heroTabs: "four" }).ok,
   sanitizeSiteSettingsPatch({ heroTabs: [null] }).ok,
   sanitizeSiteSettingsPatch({ heroTabs: [{ label: 7 }] }).ok,
   sanitizeSiteSettingsPatch({ heroTabs: [{ stats: [{ value: 7 }] }] }).ok,
   sanitizeSiteSettingsPatch({ heroTabs: [{ nope: "x" }] }).ok],
  [false, false, false, false, false]);
/* Missing sub-keys DEFAULT rather than fail, because ten of twelve are empty on the day this lands
   and refusing an absent `support` would make the shape unwritable by its own migration. */
t("E2a …but a missing sub-key defaults, which is the state the migration itself creates",
  sanitizeSiteSettingsPatch({ heroTabs: [{ label: "x" }] }).ok, true);

/* ⚠ AND THE WRITE PATH, WHICH SECTION E's TITLE CLAIMED AND ITS FIRST ROWS DID NOT TEST. Everything
   above exercises the SANITIZER. A patch that validates and is then dropped on the way to disk is
   Flag 2 from #159 — validate-then-silently-drop — and it is invisible from the sanitizer's side.
   So the real file goes through `transformSiteSettings` and the same `dump` the commit layer uses,
   and comes back compared to what went in.

   ⚠ `stripEmptyOptional` IS THE SPECIFIC HAZARD HERE, because forty of these values ARE the empty
   string and a strip pass that reached inside the array would silently flatten the shape the
   migration just created. E4 is that check, not a general one. */
const wrote = transformSiteSettings(load(settingsRaw), {});
t("E3 the write path accepts the live settings — without this E4 compares against a refusal",
  wrote.ok, true);
const roundTripped = wrote.ok ? load(dump(wrote.value)) : {};
t("E4 ⚠ heroTabs SURVIVES transform AND dump UNCHANGED — including the forty empty strings",
  JSON.stringify(roundTripped.heroTabs), JSON.stringify(tabs));
t("E4a …and it lands in its schema position rather than being appended, so the file does not re-key",
  Object.keys(roundTripped).indexOf("heroTabs"), SITE_SETTINGS_FIELD_ORDER.indexOf("heroTabs") - 0);

console.log("\nF · the empty state renders, because that is the state on the day this lands");
/* ⚠ AN EMPTY STATE THAT WAS NEVER RENDERED IS THE POSTER CONDITION. Forty fields are empty right
   now, so the consumers must already be written for it. Asserted on the CONSUMERS rather than on a
   render, because the layout that draws callouts and figures does not exist yet — what must hold
   today is that nothing reads them assuming presence. */
const page = decomment(read("app/(portfolio)/page.tsx"));
t("F1 the home page maps the array and tolerates its absence, rather than indexing four fixed slots",
  /settings\?\.heroTabs \?\? \[\]/.test(page), true);
const panel = decomment(read("components/studio/HeroEditPanel.tsx"));
t("F2 the studio panel reads a tab through a helper that tolerates a short or absent array",
  /const tabAt = /.test(panel) && /tabAt\(values\.heroTabs, activeTab\)/.test(panel), true);
const reader = decomment(read("lib/keystatic.ts"));
t("F3 the reader normalises callouts and stats to arrays, so no consumer meets undefined",
  /Array\.isArray\(o\.callouts\)/.test(reader) && /Array\.isArray\(o\.stats\)/.test(reader), true);

console.log(`\nhero-tabs result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
