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

/** The publicPath prefix (no trailing slash) — the yaml value's leading segment. */
export const HERO_IMAGE_PUBLIC_PREFIX = "/images/projects";
/** The repo directory the blobs live under. `public` + publicPath. */
export const HERO_IMAGE_DIRECTORY = "public/images/projects";
/** The Keystatic field key, which is the fresh-upload filename stem. */
export const HERO_IMAGE_FIELD = "heroImage";

/** The yaml `heroImage` string for a slug + extension (default webp, the /studio
 *  canonical format). */
export function heroImageYamlValue(slug: string, ext = "webp"): string {
  return `${HERO_IMAGE_PUBLIC_PREFIX}/${slug}/${HERO_IMAGE_FIELD}.${ext}`;
}

/** The repo blob path for a slug + extension (default webp). */
export function heroImageBlobPath(slug: string, ext = "webp"): string {
  return `${HERO_IMAGE_DIRECTORY}/${slug}/${HERO_IMAGE_FIELD}.${ext}`;
}

/**
 * Map a stored yaml `heroImage` value back to its repo blob path, for deleting
 * the previous file on replace/clear. Returns null when the value is not a
 * managed project-image path (null/absent, or an unexpected external path), so
 * the caller never tries to delete something it did not write.
 */
export function heroImageBlobPathFromValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith(`${HERO_IMAGE_PUBLIC_PREFIX}/`)) return null;
  return `public${value}`;
}
