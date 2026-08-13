// The gallery's write boundary — what a patch may carry, and what publish refuses.
// Run: node --experimental-strip-types ralph/tests/gallery-format.mjs
//
// ---- ⚠ WHY THIS SUITE EXISTS BEFORE THE EDITOR DOES ------------------------------------------
//
// The sanitizer is the last thing between an HTTP body and a file on main. The owner cookie gates
// WHO can post; nothing but this gates WHAT. So it is tested at the boundary rather than through
// the UI that will eventually call it — a form can only send what its inputs allow, and this must
// refuse what a form never would.
//
// ---- ⚠ THE DIMENSION ROWS ARE THE POINT, NOT THE ENUM ONES ------------------------------------
//
// A bad `kind` renders an item in the wrong filter bucket. A bad width or height is a LAYOUT
// SHIFT: the masonry is CSS `columns` and cannot place a tile before its aspect is known, and
// boat-crest is the recorded cost of treating those as optional — 19 of 25 images in the wrong box.
import {
  sanitizeGalleryPatch, sanitizeGalleryCreate, galleryPublishBlockers, GALLERY_KINDS,
} from "../../lib/studio/gallery-format.ts";
import { serializeGalleryEntry } from "../../lib/studio/gallery-serialize.ts";
import { load } from "js-yaml";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const ok = (r) => r.ok === true;
const rejects = (r) => r.ok === false;

console.log("\nA · the subject is real");
t("A0 the kind enum has members — an empty one would make every enum row below vacuous",
  GALLERY_KINDS.length, 3);
t("A1 a full, valid patch is accepted, so the refusals below are refusing something specific",
  ok(sanitizeGalleryPatch({
    title: "Low tide", kind: "photo", image: "/images/gallery/a.webp",
    width: 1600, height: 2000, alt: "A beach", description: "d", tags: ["35mm"],
    caseStudy: "boat-crest", orderIndex: 3,
  })), true);

console.log("\nB · dimensions are required to be real pixels — a bad one is a layout shift");
/* ⚠ EACH OF THESE IS A DISTINCT WAY A NUMBER CAN BE WRONG, and they are separate rows because a
 * single `typeof value !== "number"` check passes three of them. */
for (const [label, value] of [
  ["zero", 0], ["negative", -4], ["fractional", 12.5],
  ["a numeric string", "1600"], ["NaN", Number.NaN], ["Infinity", Number.POSITIVE_INFINITY],
]) {
  t(`B1 width ${label} is refused`, rejects(sanitizeGalleryPatch({ width: value })), true);
}
t("B2 …and a real pixel width is accepted, so B1 is not refusing everything",
  ok(sanitizeGalleryPatch({ width: 1600 })), true);
t("B3 …and height takes the identical contract, which a width-only implementation would fail",
  [rejects(sanitizeGalleryPatch({ height: 0 })), ok(sanitizeGalleryPatch({ height: 900 }))],
  [true, true]);

console.log("\nC · the enum and the link");
t("C1 an unknown kind is refused rather than stored",
  rejects(sanitizeGalleryPatch({ kind: "video" })), true);
t("C2 …and every declared kind is accepted, so C1 is not refusing the whole enum",
  GALLERY_KINDS.filter((k) => !ok(sanitizeGalleryPatch({ kind: k }))), []);
/* An empty kind is DROPPED rather than refused — the omit-when-empty contract `template` uses, so
 * an item mid-edit does not 400 while the author is still choosing. */
t("C3 an empty kind is dropped rather than written",
  sanitizeGalleryPatch({ kind: "" }).patch, {});
t("C4 a caseStudy that is not a slug is refused — a path or a URL would render as a broken link",
  [rejects(sanitizeGalleryPatch({ caseStudy: "/projects/boat-crest" })),
   rejects(sanitizeGalleryPatch({ caseStudy: "Boat Crest" })),
   ok(sanitizeGalleryPatch({ caseStudy: "boat-crest" }))],
  [true, true, true]);

console.log("\nD · unknown fields are refused, never dropped");
/* ⚠ A TYPO IN A FIELD NAME IS A 400 RATHER THAN A SILENT NO-OP. Dropping it would make the editor
 * report a successful save that changed nothing — the silent-success shape this studio has
 * already shipped once, in its blog status control. */
t("D1 an unknown key is refused", rejects(sanitizeGalleryPatch({ widht: 1600 })), true);
t("D2 …and the refusal names the field, so the editor can say which one",
  sanitizeGalleryPatch({ widht: 1600 }).field, "widht");
t("D3 a non-object patch is refused", rejects(sanitizeGalleryPatch([1, 2])), true);

console.log("\nE · publish refuses what a reader would meet as a defect");
/* ⚠ THE SPLIT: alt is optional at SAVE and required at PUBLISH — `validate-blog-post`'s exact
 * contract. A freshly added item legitimately has no alt, so refusing it at save would make the
 * kind unaddable; a PUBLISHED image without alt is the one accessibility failure this feature can
 * uniquely produce. */
const item = (over) => ({
  slug: "x", title: "T", kind: "photo", image: "/images/gallery/a.webp",
  width: 1600, height: 2000, alt: "A beach", description: "", tags: [], caseStudy: null,
  orderIndex: 0, ...over,
});
t("E0 a complete item blocks nothing — so every row below is refusing something specific",
  galleryPublishBlockers([item({})]), []);
t("E1 ⚠ AN EMPTY ALT BLOCKS PUBLISH — the failure a gallery can uniquely produce",
  galleryPublishBlockers([item({ alt: "" })]).length, 1);
t("E1a …and whitespace is not alt text", galleryPublishBlockers([item({ alt: "   " })]).length, 1);
t("E2 a missing image blocks publish", galleryPublishBlockers([item({ image: null })]).length, 1);
t("E3 ⚠ AND A ZERO DIMENSION BLOCKS PUBLISH — machine-written, so a zero is an upload that never finished",
  [galleryPublishBlockers([item({ width: 0 })]).length,
   galleryPublishBlockers([item({ height: 0 })]).length], [1, 1]);
t("E4 …and the blocker names the slug, so an owner knows which item to fix",
  galleryPublishBlockers([item({ alt: "" })])[0].startsWith("x:"), true);
/* The empty subject. A gate over an empty list must not read as a pass for a full one. */
t("E5 an empty gallery blocks nothing, and that is not the same as a gallery that passed",
  galleryPublishBlockers([]), []);

console.log("\nF · the serializer rebuilds in declared order and refuses to reformat");
const RAW = "title: Low tide\nkind: photo\nimage: /images/gallery/a.webp\nwidth: 1600\nheight: 2000\nalt: A beach\ndescription: ''\ntags: []\norderIndex: 0\n";
t("F0 the fixture round-trips — a fixture the serializer cannot read makes F1 and F2 vacuous",
  serializeGalleryEntry(RAW, {}).ok, true);
t("F1 ⚠ A NO-OP SAVE IS A NO-OP DIFF — the property that lets a reviewer read a gallery commit",
  serializeGalleryEntry(RAW, {}).bytes, RAW);
t("F2 a one-field edit changes that field and nothing else",
  (() => {
    const out = serializeGalleryEntry(RAW, { alt: "A cold beach" });
    const before = load(RAW), after = load(out.bytes);
    const moved = Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
    return moved;
  })(), ["alt"]);
/* ⚠ `hasOwnProperty` RATHER THAN TRUTHINESS, asserted: a cleared image is `null` and a failed
 * upload leaves `width: 0`, and both must survive a save that does not mention them. A truthiness
 * check would drop the key and the publish gate would then see an ABSENT dimension rather than a
 * zero — the same defect wearing a missing key. */
t("F3 a null image and a zero width survive a save that does not mention them",
  (() => {
    const raw = "title: T\nimage: null\nwidth: 0\nheight: 0\nalt: ''\n";
    const out = serializeGalleryEntry(raw, { alt: "x" });
    const after = load(out.bytes);
    return [after.image, after.width, after.height];
  })(), [null, 0, 0]);

console.log("\nG · create takes the title alone");
t("G1 a title creates", ok(sanitizeGalleryCreate({ title: "Low tide" })), true);
t("G2 a blank title is refused", rejects(sanitizeGalleryCreate({ title: "   " })), true);
/* ⚠ THE IMAGE IS NOT ACCEPTED AT CREATE, and that is the sequence rather than an omission: an
 * upload is a multipart POST that needs a slug to name its path, so the entry must exist first. */
t("G3 an image at create is refused — the entry must exist before its image has a path",
  rejects(sanitizeGalleryCreate({ title: "T", image: "/images/gallery/a.webp" })), true);

console.log(`\ngallery-format result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
