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
   the migration.

   ⚠ PINNED TO A COMMIT, NOT TO `origin/main`, BECAUSE THE FIRST VERSION READ A MOVING REF AND
   INVALIDATED ITSELF THE HOUR IT MERGED. Once the migration landed on main the flat keys were gone
   from that ref, so C1 had nothing to compare against and went red on a change that was correct.
   C0 is what caught it — it exists to say "the before-state is unavailable" rather than let C1
   report a false diff — and it did that on its first real outing.

   The pin is the last commit whose settings still carried the eight flat keys. `upstream.mjs`'s
   KNOWN_UNCOVERED_TIP is the precedent, down to the row asserting the pin still resolves. */
const gitOr = (args, fallback) => {
  try { return execFileSync("git", args, { encoding: "utf8" }); } catch { return fallback; }
};
const PRE_MIGRATION = "580618a";
const beforeRaw = gitOr(["show", `${PRE_MIGRATION}:content/site-settings.yaml`], "");
const before = load(beforeRaw) ?? {};
/* ⚠ CAUGHT BY MUTATION: `execFileSync` THROWS on a non-zero exit, so a pin that stopped resolving
   crashed the suite instead of failing this row — and a crash reports no row at all. The whole
   point of C0a is to name the cause when the pin dies, which it cannot do from inside a stack
   trace. Both git reads are wrapped for the same reason. */
t("C0a the pinned pre-migration commit still resolves — a rewritten history fails C1 for the wrong reason",
  gitOr(["cat-file", "-t", `${PRE_MIGRATION}^{commit}`], "").trim(), "commit");
t("C0 the pre-migration file still carries the eight flat keys — without them C1 compares nothing",
  [1, 2, 3, 4].every((n) => typeof before[`tab${n}Label`] === "string" && typeof before[`tab${n}Line`] === "string"), true);

/* ⚠ THE FOUR LABELS ARE STILL COMPARED LIVE AND THE FOUR HEADLINES ARE NOT, WHICH IS A SPLIT THE
   MIGRATION DID NOT NEED AND THE ADOPTION FORCED. This row proved all eight values survived the flat
   keys byte-identically. The labels still do, so they are still checked against the pre-migration
   file — a drift there would be a real loss.

   The four HEADLINES were deliberately replaced when the owner adopted the contract's copy, so
   comparing them against the pre-migration file would now fail for the one reason that is not a
   defect. What is asserted instead is that the migration's fidelity is still TRUE AS HISTORY: the
   eight values are compared at the migration commit rather than in the working tree, so the claim
   cannot go stale again the next time the copy is edited. */
const movedLabels = [];
for (let i = 0; i < 4; i++) {
  if (tabs[i]?.label !== before[`tab${i + 1}Label`]) movedLabels.push(`tab${i + 1}.label`);
}
t("C1 ⚠ THE FOUR LABELS STILL MATCH THE PRE-MIGRATION FILE BYTE-IDENTICALLY",
  movedLabels, []);

const AT_MIGRATION = "22b0681";
const atMigrationRaw = gitOr(["show", `${AT_MIGRATION}:content/site-settings.yaml`], "");
const atMigration = load(atMigrationRaw) ?? {};
const atMigrationTabs = Array.isArray(atMigration.heroTabs) ? atMigration.heroTabs : [];
t("C1b the migration-commit file still resolves and carries four tabs — without it C1c compares nothing",
  atMigrationTabs.length, 4);
const movedAtMigration = [];
for (let i = 0; i < 4; i++) {
  if (atMigrationTabs[i]?.label !== before[`tab${i + 1}Label`]) movedAtMigration.push(`tab${i + 1}.label`);
  if (atMigrationTabs[i]?.headline !== before[`tab${i + 1}Line`]) movedAtMigration.push(`tab${i + 1}.headline`);
}
t("C1c ⚠ ALL EIGHT VALUES ARRIVED BYTE-IDENTICALLY AT THE MIGRATION — asserted as history, so later edits cannot make it stale",
  movedAtMigration, []);

const newFields = tabs.flatMap((x, i) => [
  [`tab${i + 1}.support`, x.support],
  ...x.callouts.map((c, j) => [`tab${i + 1}.callouts[${j}]`, c]),
  ...x.stats.flatMap((s, j) => [[`tab${i + 1}.stats[${j}].value`, s.value], [`tab${i + 1}.stats[${j}].unit`, s.unit]]),
]);
t("C1a …and there are exactly forty new fields, against a LITERAL rather than against themselves",
  newFields.length, 40);
/* ⚠ THIS ROW ASSERTED ALL FORTY WERE EMPTY AND ITS SUBJECT HAS MOVED. Empty was the correct state
   for the migration — the fields had just been created and a value in one could only have been
   invented. The hero layout then shipped with the contract's copy hardcoded behind a flag, which
   made the same forty **editable with no effect on the page**, and the owner ruled that copy correct.
   It is now CONTENT, so the expectation inverts: the forty are FILLED, and the flag is deleted.

   ⚠ AND THE INVERSION IS ASSERTED RATHER THAN THE ROW BEING DROPPED, because "no longer empty" and
   "never checked again" leave the same green tick. A field silently reverting to blank is still a
   defect; it is now the OPPOSITE defect. */
t("C2 ⚠ AND EVERY ONE OF THE FORTY IS NOW FILLED — the migration's emptiness inverted when the copy became content",
  newFields.filter(([, v]) => v === "").map(([k]) => k), []);

console.log("\nD · the mock's copy reached content BY RULING, and the ruling is what is recorded");
/* ⚠ THIS ROW FORBADE THESE THREE STRINGS AND NOW REQUIRES THEM. It read "the contract's headlines
   for tabs 2 to 4 are FILLER the mock's author wrote, not the owner's words — pasting them in would
   look like a finished migration and would silently replace the owner's voice." That was correct
   while nobody had ruled on them. The owner has now reviewed the rendered hero and ruled the copy
   correct, so the words are the owner's by adoption and the danger the row named is spent.

   ⚠ WHAT REPLACES IT IS NOT NOTHING. The failure mode that remains is the copy DISAPPEARING — a
   sanitizer bug, a bad publish, a half-written patch — which is invisible from the editor because an
   empty field looks like an unfilled one. So the same three needles are asserted PRESENT. The row
   changed direction rather than being deleted, and the reason it changed is here rather than in a
   commit message nobody will read. */
const ADOPTED = [
  "End-to-end design for",
  "Close to research. Closer to",
  "Open to roles, and",
];
const settingsRaw = read("content/site-settings.yaml");
t("D1 ⚠ THE THREE ADOPTED HEADLINES ARE IN SITE SETTINGS — the row that forbade them now requires them",
  ADOPTED.filter((f) => !settingsRaw.includes(f)), []);
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

console.log("\nG · the ten new fields are editable, which is what makes the empty state fillable");
/* ⚠ THE SCOPING PREMISE WAS FALSE AND RE-DERIVING IT IS WHY THIS IS A SMALL PR. It was written as
   "giving them UI needs the layout to define what they look like". The ten are a support line,
   three labels, three figures and three units — ALL PLAIN TEXT — and `TextArea`, `KeyRow` and the
   shared field exports already render exactly that shape. What the layout decides is how they look
   ON THE PAGE, not what an author types. A premise accepted rather than checked would have deferred
   this behind the hero and forced the hero to be judged on empty copy.

   ⚠ AND EDITORS BEFORE LAYOUT IS THE ORDER FOR A REASON THIS ARC KEEPS PROVING: every design
   question here was settled by a render of the REAL thing. With no editor the hero could only be
   judged on the mock's filler, which section D asserts must never reach content. */
const G_panel = decomment(read("components/studio/HeroEditPanel.tsx"));
t("G1 the panel is real and still table-driven over the array — a zero here makes G2 vacuous",
  G_panel.length > 4000 && /tabAt\(values\.heroTabs, activeTab\)/.test(G_panel), true);
/* Each of the ten reaches a writer. Asserted by the WRITER it calls rather than by counting inputs,
   because an input that renders and writes nowhere is the defect, not a missing input. */
t("G2 ⚠ ALL TEN NEW FIELDS WRITE — support through editTab, the callouts and figures through their own writers",
  [/editTab\(activeTab, "support"/.test(G_panel),
   /editCallout\(activeTab, i, e\.target\.value\)/.test(G_panel),
   /editStat\(activeTab, i, "value"/.test(G_panel),
   /editStat\(activeTab, i, "unit"/.test(G_panel)],
  [true, true, true, true]);
/* ⚠ THE PADDING IS THE PROPERTY, NOT A DETAIL. A tab whose `callouts` is short must still accept a
   value at index 2, and `next[2] = v` on a one-element array leaves a hole that serialises as null
   — which the schema's own shape row would then refuse. Both writers fill three slots first. */
/* ⚠ THE FIRST VERSION COUNTED `[0, 1, 2].map` OCCURRENCES AND A MUTATION SURVIVED IT. The panel
   contains that expression FIVE times — two writers and three render loops — so removing a writer's
   padding left the count comfortably over its floor. A count cannot say WHICH site has the property.
   Sliced per writer instead, which is the same repair T2 needed in the toaster suite. */
const bodyOf = (name) => {
  const at = G_panel.indexOf(`const ${name} = `);
  if (at < 0) return "";
  const open = G_panel.indexOf("{", at);
  let d = 0;
  for (let i = open; i < G_panel.length; i++) {
    if (G_panel[i] === "{") d++;
    else if (G_panel[i] === "}" && --d === 0) return G_panel.slice(open, i);
  }
  return "";
};
t("G3a both writers were located, or G3 compares two empty strings",
  [bodyOf("editCallout").length > 40, bodyOf("editStat").length > 40], [true, true]);
t("G3 ⚠ BOTH WRITERS PAD TO THREE BEFORE WRITING, so an index-2 edit on a short array cannot leave a hole",
  [/\[0, 1, 2\]\.map/.test(bodyOf("editCallout")), /\[0, 1, 2\]\.map/.test(bodyOf("editStat"))],
  [true, true]);
/* ⚠ FIXED SLOTS RATHER THAN `ItemRows`, which is a decision and not an omission. The hero draws
   exactly three callout lines and exactly three figures, so an Add button would promise a fourth
   the layout cannot render. This asserts the absence, because the obvious "improvement" later is to
   reach for the list control that every other repeated field here uses. */
t("G4 …and they are fixed slots, not an add-and-remove list the hero could not draw",
  /ItemRows/.test(G_panel), false);
t("G5 …and every input carries an accessible name, since three identical boxes have no visible label each",
  (G_panel.match(/aria-label=\{`(Callout|Figure|Unit) \$\{i \+ 1\}`\}/g) ?? []).length, 3);

console.log(`\nhero-tabs result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
