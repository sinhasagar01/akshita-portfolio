// PR 3a — the collection-parameterized image paths.
// Run: node --experimental-strip-types ralph/tests/collection-image-paths.mjs
//
// WHY THIS SUITE. The three image-path sites hardcoded `public/images/projects`. For
// block images a shared prefix is byte-safe (content-addressed → a shared path implies
// shared bytes → dedupe), but for entry HEROES it is destructive: heroImageBlobPath is a
// FIXED `<slug>/heroImage.webp` with no hash, and blog/project slug-spaces are
// independent, so a blog post sharing a slug with a project would CLOBBER the project's
// hero. This suite pins the parameterization: that PROJECTS output is unchanged (G1),
// and that the two collections' paths cannot collide for the same slug (G2).
//
// THE PROJECTS EXPECTATIONS ARE PINNED FROM MAIN, NOT DERIVED FROM THE REFACTORED CODE.
// The literals below were captured by running the pre-refactor helpers on main
// (HEAD c164c85) — asserting the new helpers reproduce them proves projects is unchanged
// against a value the refactor cannot influence. One case asserts a REAL on-disk blob.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROJECTS_IMAGE_BASE,
  BLOG_IMAGE_BASE,
  GALLERY_IMAGE_BASE,
  imageBaseForCollection,
} from "../../lib/studio/collection-image-base.ts";
import { blockImageYamlValue, blockImageBlobPath, blockImageBlobPathFromValue } from "../../lib/studio/block-image-path.ts";
import { heroImageYamlValue, heroImageBlobPath, heroImageBlobPathFromValue } from "../../lib/studio/hero-image-path.ts";
// The schema-side mirrors declared in keystatic.config (it cannot runtime-import the
// leaf; see that file). Pinned equal to the runtime source below, so they cannot drift.
import { SCHEMA_IMAGE_BASES } from "../../keystatic.config.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* ---- A. the base constants equal the EXACT strings the three sites hardcoded (G4) --- */
t("A1 projects base directory", PROJECTS_IMAGE_BASE.directory, "public/images/projects");
t("A2 projects base publicPrefix", PROJECTS_IMAGE_BASE.publicPrefix, "/images/projects");
t("A3 projects base publicPath", PROJECTS_IMAGE_BASE.publicPath, "/images/projects/");
t("A4 blog base directory", BLOG_IMAGE_BASE.directory, "public/images/blog");
t("A5 blog base publicPrefix", BLOG_IMAGE_BASE.publicPrefix, "/images/blog");
t("A6 blog base publicPath", BLOG_IMAGE_BASE.publicPath, "/images/blog/");

/* ---- A'. the keystatic.config SCHEMA mirrors are pinned EQUAL to the runtime source,
 *         so the two declarations (schema vs write-path) cannot drift. --------------- */
t("A7 keystatic.config projects schema base == runtime projects base", SCHEMA_IMAGE_BASES.projects, PROJECTS_IMAGE_BASE);
t("A8 keystatic.config blog schema base == runtime blog base", SCHEMA_IMAGE_BASES.blog, BLOG_IMAGE_BASE);

/* ---- B. PROJECTS derivation byte-identical to MAIN, pinned + a REAL on-disk blob (G1) */
// A real committed artifact: public/images/projects/elevate-one-view/blocks/1dacc14060dc.webp
const REAL_SLUG = "elevate-one-view", REAL_HASH = "1dacc14060dc";
t("B1 block yaml == main (real artifact)",
  blockImageYamlValue(PROJECTS_IMAGE_BASE, REAL_SLUG, REAL_HASH),
  "/images/projects/elevate-one-view/blocks/1dacc14060dc.webp");
t("B2 block blob == main (real artifact)",
  blockImageBlobPath(PROJECTS_IMAGE_BASE, REAL_SLUG, REAL_HASH),
  "public/images/projects/elevate-one-view/blocks/1dacc14060dc.webp");
t("B3 the derived block blob EXISTS on disk (a real artifact, not a fixture)",
  existsSync(path.join(root, blockImageBlobPath(PROJECTS_IMAGE_BASE, REAL_SLUG, REAL_HASH))), true);
t("B4 hero yaml == main", heroImageYamlValue(PROJECTS_IMAGE_BASE, REAL_SLUG), "/images/projects/elevate-one-view/heroImage.webp");
t("B5 hero blob == main", heroImageBlobPath(PROJECTS_IMAGE_BASE, REAL_SLUG), "public/images/projects/elevate-one-view/heroImage.webp");
t("B6 the derived hero blob EXISTS on disk",
  existsSync(path.join(root, heroImageBlobPath(PROJECTS_IMAGE_BASE, REAL_SLUG))), true);

/* ---- C. BLOG derivation lands under /images/blog ---------------------------------- */
t("C1 blog block yaml", blockImageYamlValue(BLOG_IMAGE_BASE, "a-post", "abc123abc123"), "/images/blog/a-post/blocks/abc123abc123.webp");
t("C2 blog block blob", blockImageBlobPath(BLOG_IMAGE_BASE, "a-post", "abc123abc123"), "public/images/blog/a-post/blocks/abc123abc123.webp");
t("C3 blog hero yaml", heroImageYamlValue(BLOG_IMAGE_BASE, "a-post"), "/images/blog/a-post/heroImage.webp");
t("C4 blog hero blob", heroImageBlobPath(BLOG_IMAGE_BASE, "a-post"), "public/images/blog/a-post/heroImage.webp");

/* ---- D. THE COLLISION IS CLOSED — same slug, different collection, different path (G2) */
const SLUG = "fosfor-ai"; // a real project slug a blog post could also derive
// Heroes are the DESTRUCTIVE case (fixed path, no hash): prove the two never coincide.
t("D1 HERO collision closed — projects vs blog hero paths differ for the SAME slug",
  heroImageBlobPath(PROJECTS_IMAGE_BASE, SLUG) !== heroImageBlobPath(BLOG_IMAGE_BASE, SLUG), true);
t("D2 and the exact paths are the two distinct trees",
  [heroImageBlobPath(PROJECTS_IMAGE_BASE, SLUG), heroImageBlobPath(BLOG_IMAGE_BASE, SLUG)],
  ["public/images/projects/fosfor-ai/heroImage.webp", "public/images/blog/fosfor-ai/heroImage.webp"]);
// Block images too (content-addressed, so byte-safe already, but the trees still separate).
t("D3 block paths also separate by collection for the same slug + hash",
  blockImageBlobPath(PROJECTS_IMAGE_BASE, SLUG, "abc123abc123") !== blockImageBlobPath(BLOG_IMAGE_BASE, SLUG, "abc123abc123"), true);

/* ---- E. the route's collection→base mapping --------------------------------------- */
t("E1 projects maps to the projects base", imageBaseForCollection("projects"), PROJECTS_IMAGE_BASE);
t("E2 blog maps to the blog base", imageBaseForCollection("blog"), BLOG_IMAGE_BASE);
t("E2a ⚠ GALLERY MAPS TO THE GALLERY BASE — the row this table was missing",
  imageBaseForCollection("gallery"), GALLERY_IMAGE_BASE);
t("E3 an unknown collection maps to null (the route rejects it)", imageBaseForCollection("settings"), null);
t("E4 a non-string collection maps to null", imageBaseForCollection(undefined), null);

/* ---- ⚠ E5. THIS IS A WRITE PATH, AND A WRONG BASE DOES NOT FAIL ----------------------
 *
 * `imageBaseForCollection` decides WHERE UPLOADED BYTES LAND. A wrong answer does not throw and
 * does not report an error — it writes to a directory the reader never looks in, and the symptom
 * is a broken image long after the upload said it worked.
 *
 * ⚠ #172's DEFECT WAS EXACTLY THIS, AND ITS CAUSE WAS A SILENT DEFAULT: a same-slug entry in one
 * collection would have clobbered another's hero, because the helper fell through to a base
 * instead of refusing. So the rows below assert the ABSENCE OF A DEFAULT as well as the mapping —
 * the fix and the reason it was needed.
 *
 * THE SUBJECT IS DERIVED FROM `CollectionName`, so a fifth collection joins this check rather than
 * inheriting whichever base the last `if` happened to return. */
const COLLECTIONS = ["projects", "blog", "gallery", "experience"];
t("E5 every collection answers — the denominator, against a literal",
  COLLECTIONS.length, 4);
t("E5a ⚠ NO COLLECTION FALLS BACK TO ANOTHER'S BASE — every answer is its own base or an explicit null",
  COLLECTIONS.map((c) => {
    const b = imageBaseForCollection(c);
    return b === null ? null : b.directory;
  }),
  ["public/images/projects", "public/images/blog", "public/images/gallery", null]);
/* ⚠ AND NO TWO COLLECTIONS SHARE A TREE, which is the property that makes a same-slug upload safe.
 * Asserted as a SET SIZE rather than pairwise, so a fifth collection is covered automatically. */
t("E5b ⚠ AND NO TWO SHARE A DIRECTORY — the same-slug clobber #172 found",
  (() => {
    const dirs = COLLECTIONS.map((c) => imageBaseForCollection(c)?.directory).filter(Boolean);
    return [dirs.length, new Set(dirs).size];
  })(), [3, 3]);
/* Experience is an explicit null rather than an absent case: it has no image upload at all, and
   saying so is what stops it silently acquiring one collection's tree later. */
t("E5c …and experience refuses rather than defaulting, because it uploads nothing",
  imageBaseForCollection("experience"), null);

/* ---- F. fromValue matches ONLY its own collection's prefix ------------------------- */
// A projects hero value is not a blog blob, and vice versa — so a per-collection GC or
// delete never mistakes one collection's image for another's.
t("F1 a projects hero value is a projects blob under the projects base",
  heroImageBlobPathFromValue(PROJECTS_IMAGE_BASE, "/images/projects/fosfor-ai/heroImage.webp"),
  "public/images/projects/fosfor-ai/heroImage.webp");
t("F2 a projects hero value is NOT recognised under the blog base",
  heroImageBlobPathFromValue(BLOG_IMAGE_BASE, "/images/projects/fosfor-ai/heroImage.webp"), null);
t("F3 a blog block value is NOT recognised under the projects base",
  blockImageBlobPathFromValue(PROJECTS_IMAGE_BASE, "/images/blog/a-post/blocks/abc123abc123.webp"), null);
t("F4 a blog block value IS recognised under the blog base",
  blockImageBlobPathFromValue(BLOG_IMAGE_BASE, "/images/blog/a-post/blocks/abc123abc123.webp"),
  "public/images/blog/a-post/blocks/abc123abc123.webp");

console.log(`\ncollection-image-paths result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
