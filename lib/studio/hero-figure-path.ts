// The path convention for the site-settings `heroFigure` — the hero's cut-out illustration.
//
// ⚠ A SIBLING OF `settings-photo-path.ts` RATHER THAN A GENERALISATION OF IT, AND THAT IS THE
// REPO'S OWN CALL AT THIS COUNT. `SettingsPhotoField`'s header already says a shared component
// "would need a behavioral mode flag for that fork; at two occurrences that is not yet worth the
// abstraction". The same reasoning applies one layer down: parameterising the photo writer would
// mean editing a working, owner-gated write path to add a second caller, and the two differ only
// in three constants. ⚠ IF A THIRD SETTINGS IMAGE APPEARS, THE SLICE IS THE THING TO LIFT — not
// this file, and not the field component alone.
//
// Mirrors the Keystatic config so a /studio upload lands where Keystatic would have put it —
// keystatic.config.ts, siteSettings.heroFigure:
//   directory:  "public/images/hero"
//   publicPath: "/images/hero/"
// Keystatic names a fresh upload after the FIELD KEY, so the stem is "heroFigure".
//
// ⚠ THE STEM IS NOT `hero-figure`, AND THE COLLISION IS THE REASON. `/images/hero/hero-figure.webp`
// is the SHIPPED asset, committed to the repo and the renderer's fallback. Writing uploads to that
// exact path would make an upload overwrite the fallback, so a later "clear" would restore an image
// the owner had already replaced — the fallback would silently become whatever was uploaded last.
// The uploaded file therefore lives beside it at `heroFigure.webp` and the shipped asset is never
// written to.
//
// FIXED PATH, not content-addressed. There is exactly one hero illustration, so a re-upload
// overwrites the same file and no orphan accumulates — the content-hash scheme block images use
// exists because a project has many images and reorder must not rename them, neither of which
// applies here.
//
// Dependency-free, so it is unit-exercisable and stays the single source for the writer.

/** The publicPath prefix (no trailing slash) — the yaml value's leading segment. */
export const HERO_FIGURE_PUBLIC_PREFIX = "/images/hero";
/** The repo directory the blob lives under. `public` + publicPath. */
export const HERO_FIGURE_DIRECTORY = "public/images/hero";
/** The Keystatic field key, which is the fresh-upload filename stem. */
export const HERO_FIGURE_FIELD = "heroFigure";

/** The yaml `heroFigure` string (default webp, the /studio canonical format). */
export function heroFigureYamlValue(ext = "webp"): string {
  return `${HERO_FIGURE_PUBLIC_PREFIX}/${HERO_FIGURE_FIELD}.${ext}`;
}

/** The repo blob path (default webp). `public` + the yaml value. */
export function heroFigureBlobPath(ext = "webp"): string {
  return `${HERO_FIGURE_DIRECTORY}/${HERO_FIGURE_FIELD}.${ext}`;
}

/**
 * Map a stored yaml `heroFigure` value back to its repo blob path, for deleting the previous file
 * on replace. Returns null when the value is not a managed upload — absent, an unexpected external
 * path, or the SHIPPED asset — so the caller never deletes something it did not write.
 *
 * ⚠ THE SHIPPED ASSET IS EXCLUDED BY CONSTRUCTION, not by a name check bolted on afterwards: the
 * pattern matches the field-key stem only, and the shipped file is `hero-figure.webp`. A value
 * pointing at it therefore returns null and survives every replace and every clear.
 */
export function heroFigureBlobPathFromValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Exactly `/images/hero/heroFigure.<ext>` — one path segment after the prefix, so a deeper path
  // is never mistaken for the hero figure, and `hero-figure.webp` never matches.
  const m = new RegExp(`^${HERO_FIGURE_PUBLIC_PREFIX}/${HERO_FIGURE_FIELD}\\.[a-z0-9]+$`).exec(value);
  return m ? `public${value}` : null;
}
