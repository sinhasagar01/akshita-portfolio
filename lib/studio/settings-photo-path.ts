// P4 follow-up — the path convention for the site-settings `photo` (the portrait
// rendered on Hero and About). The sibling of hero-image-path.ts, and the last
// Keystatic-only field to gain a /studio writer, which is what unblocks the
// Keystatic retirement.
//
// Mirrors the Keystatic config so a /studio upload lands where Keystatic would
// have put it — keystatic.config.ts, siteSettings.photo:
//   directory:  "public/images"
//   publicPath: "/images/"
// Keystatic names a fresh upload after the FIELD KEY, so the stem is "photo".
//
// FIXED PATH, not content-addressed. There is exactly one settings photo, so a
// re-upload overwrites the same `/images/photo.webp` and no orphan can accumulate
// (the content-hash scheme block images use exists only because a project has many
// images and reorder must not rename them — neither applies here). The one-time
// exception is the current `/images/photo.jpg`: a webp upload lands at a different
// path, so the old jpg is deleted on replace, exactly as heroImage deletes a
// prior differently-named file.
//
// Dependency-free, so it is unit-exercisable and stays the single source for the
// writer.

/** The publicPath prefix (no trailing slash) — the yaml value's leading segment. */
export const SETTINGS_PHOTO_PUBLIC_PREFIX = "/images";
/** The repo directory the blob lives under. `public` + publicPath. */
export const SETTINGS_PHOTO_DIRECTORY = "public/images";
/** The Keystatic field key, which is the fresh-upload filename stem. */
export const SETTINGS_PHOTO_FIELD = "photo";

/** The yaml `photo` string (default webp, the /studio canonical format). */
export function settingsPhotoYamlValue(ext = "webp"): string {
  return `${SETTINGS_PHOTO_PUBLIC_PREFIX}/${SETTINGS_PHOTO_FIELD}.${ext}`;
}

/** The repo blob path (default webp). `public` + the yaml value. */
export function settingsPhotoBlobPath(ext = "webp"): string {
  return `${SETTINGS_PHOTO_DIRECTORY}/${SETTINGS_PHOTO_FIELD}.${ext}`;
}

/**
 * Map a stored yaml `photo` value back to its repo blob path, for deleting the
 * previous file on replace. Returns null when the value is not a managed
 * settings-image path (null/absent, or an unexpected external path), so the
 * caller never deletes something it did not write. Any extension is accepted, so
 * the current hand-authored `/images/photo.jpg` is recognised and cleaned up when
 * the first webp upload replaces it.
 */
export function settingsPhotoBlobPathFromValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Exactly `/images/photo.<ext>` — a single path segment after the prefix, so a
  // deeper path (e.g. a project image) is never mistaken for the settings photo.
  const m = new RegExp(`^${SETTINGS_PHOTO_PUBLIC_PREFIX}/${SETTINGS_PHOTO_FIELD}\\.[a-z0-9]+$`).exec(value);
  return m ? `public${value}` : null;
}
