// THE HERO ILLUSTRATION AS CONTENT — the field that existed nowhere, and the two properties that
// make adding it safe.
// Run: node --experimental-strip-types ralph/tests/hero-figure-field.mjs
//
// ⚠ THE HERO'S LARGEST ELEMENT WAS THE ONE HOMEPAGE IMAGE WITH NO CMS FIELD. `HeroSection.tsx`
// carried `src="/images/hero/hero-figure.webp"` as a literal, so /studio could neither preview it
// nor replace it — the owner found it missing while auditing the editor. Every other homepage
// image (the About portrait, project heroes, block images) already had a writer.
//
// ⚠ AND THE DANGEROUS PART OF ADDING A FIELD IS NOT THE FIELD, IT IS THE EXISTING DATA. The live
// settings file has no `heroFigure` key and must keep rendering byte-identically, so the field is
// OPTIONAL and the renderer falls back to the shipped asset. That is asserted here rather than
// trusted, because the failure mode is a blank hero on a file nobody edited.
//
// ⚠ AND `heroFigure` MUST HAVE EXACTLY ONE WRITER, which is the property `photo` already has and
// the reason `WRITABLE_FIELDS` excludes it. A text patch that could carry an image path would let
// a save point the field at a blob nobody uploaded — the field would name a 404 and the hero would
// draw nothing. Asserted on the exclusion LIST rather than on a comment.
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import {
  heroFigureYamlValue,
  heroFigureBlobPath,
  heroFigureBlobPathFromValue,
} from "../../lib/studio/hero-figure-path.ts";
import { serializeSettingsHeroFigure } from "../../lib/studio/site-settings-format.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const decomment = (b) => b.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const hero = decomment(read("components/sections/HeroSection.tsx"));
const page = decomment(read("app/(portfolio)/page.tsx"));
const panel = decomment(read("components/studio/HeroEditPanel.tsx"));
const field = decomment(read("components/studio/HeroFigureField.tsx"));
const fmt = decomment(read("lib/studio/site-settings-format.ts"));
const schema = decomment(read("keystatic.config.ts"));
const reader = decomment(read("lib/keystatic.ts"));

console.log("A · the field exists on every layer — a gap in any one makes it uneditable or unread");
/* Six layers, because this is exactly the kind of change that half-lands: a schema field nothing
 * reads, or a panel control whose value never reaches the page. Each is named so a failure says
 * WHICH layer is missing rather than that "the field is broken". */
t("A1 the schema declares heroFigure as an image in the hero's own directory",
  [/heroFigure: fields\.image\(/.test(schema), /publicPath: "\/images\/hero\/"/.test(schema)],
  [true, true]);
t("A2 the reader exposes it, defaulting to null rather than throwing on an absent key",
  /heroFigure: \(raw\.heroFigure as string \| null\) \?\? null/.test(reader), true);
t("A3 the page passes it to the hero", /figure=\{settings\?\.heroFigure \?\? null\}/.test(page), true);
t("A4 the hero accepts it and renders it", [/figure\?: string \| null/.test(hero), /src=\{figureSrc\}/.test(hero)], [true, true]);
t("A5 the studio panel mounts the control", /<HeroFigureField/.test(panel), true);
t("A6 …and the control posts to its own route", /"\/api\/studio\/upload-hero-figure"/.test(field), true);

console.log("\nB · existing data is untouched — the property that makes this safe to add");
/* WHAT REDDENS THIS: making the field required, or dropping the fallback. Either turns every
 * settings file written before today into a hero with no artwork. */
const settingsRaw = read("content/site-settings.yaml");
const settings = load(settingsRaw) ?? {};
t("B0 the live settings file genuinely has no heroFigure key — without that B1 proves nothing",
  "heroFigure" in settings, false);
t("B1 ⚠ AND THE RENDERER FALLS BACK TO THE SHIPPED ASSET, so a file with no key draws what it always drew",
  /const figureSrc = figure\?\.trim\(\) \? figure\.trim\(\) : HERO_FIGURE_FALLBACK/.test(hero), true);
t("B1a …and the fallback is the path that shipped, exported once so the studio preview cannot drift from it",
  /export const HERO_FIGURE_FALLBACK = "\/images\/hero\/hero-figure\.webp"/.test(hero), true);
/* ⚠ AND THE SHIPPED ASSET MUST STILL BE ON DISK, or the fallback is a 404 and B1 is a green row
 * describing a broken page. The one row here that reads the filesystem rather than source. */
let shippedExists = true;
try { readFileSync(new URL("../../public/images/hero/hero-figure.webp", import.meta.url)); }
catch { shippedExists = false; }
t("B2 ⚠ THE SHIPPED ASSET IS ON DISK — the fallback resolves to a real file, not a 404",
  shippedExists, true);

console.log("\nC · one writer, which is what keeps the field pointing at a blob that exists");
t("C1 ⚠ heroFigure IS EXCLUDED FROM THE WRITABLE TEXT PATCH, exactly as photo is",
  /const SETTINGS_IMAGE_FIELDS = \["photo", "heroFigure"\]/.test(fmt), true);
t("C1a …and the transform skips every image field rather than naming one",
  /SETTINGS_IMAGE_FIELDS as readonly string\[\]\)\.includes\(key\)\) continue/.test(fmt), true);
/* ⚠ AND THE EXCLUSION MUST ACTUALLY BITE. Asserted through the exported order rather than by
 * re-reading the regex above — a comment and a filter can disagree, which is the defect that held
 * a whole branch unmergeable this week. */
const order = [...fmt.matchAll(/^\s*"([a-zA-Z]+)",$/gm)].map((m) => m[1]);
t("C2 the schema order carries heroFigure, so the serializer can place it",
  order.includes("heroFigure"), true);

console.log("\nD · the path helper never deletes what it did not write");
/* ⚠ THE SHIPPED ASSET AND AN UPLOAD ARE DIFFERENT FILES ON PURPOSE. If an upload landed on
 * `hero-figure.webp` it would overwrite the fallback, so a later reset would restore whatever was
 * uploaded last rather than the original. The stem is the FIELD KEY, so the two can never collide
 * — asserted by value, not by reading the comment. */
t("D1 an upload's yaml value and blob path use the field-key stem",
  [heroFigureYamlValue(), heroFigureBlobPath()],
  ["/images/hero/heroFigure.webp", "public/images/hero/heroFigure.webp"]);
t("D2 ⚠ THE SHIPPED ASSET IS NEVER A DELETION TARGET — it does not match the managed pattern",
  heroFigureBlobPathFromValue("/images/hero/hero-figure.webp"), null);
t("D3 …but a managed upload is, so a replace cleans up after itself",
  heroFigureBlobPathFromValue("/images/hero/heroFigure.webp"), "public/images/hero/heroFigure.webp");
t("D4 …and nothing else is, so a stray value cannot make the writer delete a file it does not own",
  [heroFigureBlobPathFromValue(null), heroFigureBlobPathFromValue("/images/photo.webp"),
   heroFigureBlobPathFromValue("/images/hero/deep/heroFigure.webp")],
  [null, null, null]);

console.log("\nE · the round trip does not re-key the file");
/* The serializer value-reuses strip + reorder, so an image commit must not reorder or drop
 * anything. Compared against the LIVE file, and the cleared form is compared to the set form's
 * key list rather than to a literal, so this cannot pass by both being empty. */
const set = serializeSettingsHeroFigure(settingsRaw, "/images/hero/heroFigure.webp");
const topKeys = (y) => y.split("\n").filter((l) => /^[a-zA-Z]/.test(l)).map((l) => l.split(":")[0]);
const before = topKeys(settingsRaw), after = topKeys(set);
t("E0 the live file parsed into a real key list — a zero here makes E1 vacuous", before.length > 10, true);
t("E1 ⚠ SETTING THE FIELD ADDS EXACTLY ONE KEY AND MOVES NO OTHER",
  after.filter((k) => k !== "heroFigure"), before);
t("E2 …and it lands in its schema position rather than being appended",
  after[after.indexOf("heroScrollCue") + 1], "heroFigure");
/* ⚠ CLEARING WRITES null RATHER THAN REMOVING THE KEY, WHICH IS `photo`'s BEHAVIOUR AND IS
 * ASSERTED SO THE TWO CANNOT DIVERGE SILENTLY. `stripEmptyOptional` removes empty STRINGS only, so
 * null survives — checked against the sibling rather than declared correct. */
const cleared = serializeSettingsHeroFigure(set, null);
t("E3 clearing writes null, the same shape photo's writer produces", /^heroFigure: null$/m.test(cleared), true);

console.log(`\nhero-figure-field result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
