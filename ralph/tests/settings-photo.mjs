// Settings-photo write + path convention test.
// Run: node --experimental-strip-types ralph/tests/settings-photo.mjs
//
// The load-bearing case is BYTE-COMPAT: a photo-only write must leave every other
// settings field byte-identical on the real file (the risk is a re-dump reformatting
// a folded scalar or a nested array). Plus the path convention, which decides where
// the blob lands and what the old-file cleanup recognises.
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { serializeSettingsPhoto } from "../../lib/studio/site-settings-format.ts";
import {
  settingsPhotoYamlValue,
  settingsPhotoBlobPath,
  settingsPhotoBlobPathFromValue,
} from "../../lib/studio/settings-photo-path.ts";

let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "[PASS]" : "[FAIL]"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) fail++;
};

const raw = readFileSync("content/site-settings.yaml", "utf8");

/* ------------------------------------------- byte-compat on the real file */

console.log("a photo-only write touches ONLY the photo line");

// no-op: writing the current value back reproduces the file (it is dump-stable).
check("no-op write == file (the file is js-yaml canonical)",
  serializeSettingsPhoto(raw, "/images/photo.jpg") === raw);

const after = serializeSettingsPhoto(raw, "/images/photo.webp");
const diffLines = [];
const a = raw.split("\n"), b = after.split("\n");
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) diffLines.push(`L${i + 1}: ${JSON.stringify(a[i])} -> ${JSON.stringify(b[i])}`);
}
check("exactly one line changed", diffLines.length === 1, diffLines.slice(0, 4).join(" | "));
check("the changed line is photo", diffLines[0]?.includes("photo:") ?? false, diffLines[0]);

// every risky field byte-identical
const fieldBlock = (yaml, key) => {
  const lines = yaml.split("\n");
  const s = lines.findIndex((l) => l.startsWith(key + ":"));
  if (s < 0) return null;
  let e = s + 1;
  while (e < lines.length && /^\s/.test(lines[e])) e++;
  return lines.slice(s, e).join("\n");
};
for (const k of ["heroCopy", "aboutCopy", "aboutNote", "aboutFocusChips", "processStages", "links", "email"]) {
  check(`${k} byte-identical`, fieldBlock(raw, k) !== null && fieldBlock(raw, k) === fieldBlock(after, k));
}

// values still parse; folded scalar content preserved
const rp = load(after);
check("re-dump parses", rp !== null && typeof rp === "object");
check("photo actually changed", rp.photo === "/images/photo.webp");
check("aboutCopy folded-scalar VALUE preserved", load(raw).aboutCopy === rp.aboutCopy);

/* ------------------------------------------- clear round-trips as null */

console.log("\nclear writes photo: null (not omitted, not '')");
const cleared = serializeSettingsPhoto(raw, null);
check("cleared photo parses as null", load(cleared).photo === null);
check("clear touched only the photo line",
  (() => {
    const c = cleared.split("\n");
    let n = 0;
    for (let i = 0; i < Math.max(a.length, c.length); i++) if (a[i] !== c[i]) n++;
    return n === 1;
  })());

/* ------------------------------------------- the path convention */

console.log("\nthe fixed-path convention");
check("yaml value is /images/photo.webp", settingsPhotoYamlValue() === "/images/photo.webp");
check("blob path is public + yaml", settingsPhotoBlobPath() === "public/images/photo.webp");

console.log("\nold-blob cleanup recognises managed paths (for delete-on-replace)");
check("the current .jpg maps back (so the 6.7MB jpg gets cleaned up)",
  settingsPhotoBlobPathFromValue("/images/photo.jpg") === "public/images/photo.jpg");
check("a .webp maps back", settingsPhotoBlobPathFromValue("/images/photo.webp") === "public/images/photo.webp");
for (const [label, v] of [
  ["null", null],
  ["empty string", ""],
  ["an external url", "https://example.com/x.webp"],
  ["a project image (deeper path)", "/images/projects/fosfor-ai/heroImage.webp"],
  ["a traversal attempt", "/images/../../etc/passwd"],
  ["a nested settings path", "/images/sub/photo.webp"],
]) {
  check(`${label} is NOT a managed photo`, settingsPhotoBlobPathFromValue(v) === null);
}

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
