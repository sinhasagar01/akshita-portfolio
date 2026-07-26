// P4-1 — pure path convention for a project's heroImage, mirroring the Keystatic
// fields.image config so a /studio upload round-trips byte-compat with Keystatic
// (verified against @keystatic/core: getSrcPrefix + the image field serialize()
// + the local writer at keystatic-core-ui). Dependency-free, so it is
// unit-exercisable directly and stays the single source for the writer.
//
// Keystatic config — keystatic.config.ts, projects.heroImage:
//   directory:  "public/images/projects"
//   publicPath: "/images/projects/"
// Verified convention:
//   yaml value = <publicPath, trailing slash stripped>/<slug>/<fieldKey>.<ext>
//   blob path  = <directory>/<slug>/<fieldKey>.<ext>   ( === "public" + yaml value )
// On a fresh upload Keystatic names the file <fieldKey>.<ext>; heroImage is a
// top-level field so the key is "heroImage". /studio always emits webp, so a
// re-upload overwrites the same heroImage.webp path (no orphan by construction);
// the deletion path only fires when replacing a differently-named prior file
// (e.g. a Keystatic-authored heroImage.png).

// PR 3a — the projects/blog PREFIX is now a REQUIRED `base` parameter. THIS is the
// destructive-collision fix: a hero path is a FIXED `<slug>/heroImage.<ext>` with no
// content hash, so under a shared prefix a blog hero and a project hero at the same slug
// resolve to the SAME path and the second upload clobbers the first. A distinct base per
// collection closes it (proven directly in collection-image-paths.mjs). The old
// HERO_IMAGE_PUBLIC_PREFIX/_DIRECTORY constants moved to collection-image-base.ts.
import type { CollectionImageBase } from "./collection-image-base";

/** The Keystatic field key, which is the fresh-upload filename stem. */
export const HERO_IMAGE_FIELD = "heroImage";

/** The yaml `heroImage` string for a collection base + slug + extension (default webp,
 *  the /studio canonical format). */
export function heroImageYamlValue(base: CollectionImageBase, slug: string, ext = "webp"): string {
  return `${base.publicPrefix}/${slug}/${HERO_IMAGE_FIELD}.${ext}`;
}

/** The repo blob path for a collection base + slug + extension (default webp). */
export function heroImageBlobPath(base: CollectionImageBase, slug: string, ext = "webp"): string {
  return `${base.directory}/${slug}/${HERO_IMAGE_FIELD}.${ext}`;
}

/**
 * Map a stored yaml `heroImage` value back to its repo blob path UNDER THE GIVEN base,
 * for deleting the previous file on replace/clear. Returns null when the value is not a
 * managed image path for that collection (null/absent, or an unexpected external path),
 * so the caller never tries to delete something it did not write.
 */
export function heroImageBlobPathFromValue(base: CollectionImageBase, value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith(`${base.publicPrefix}/`)) return null;
  return `public${value}`;
}
