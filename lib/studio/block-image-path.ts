// P4 4(b)-iv — the path convention for a case-study BLOCK image, the sibling of
// hero-image-path.ts.
//
// WHY IT CANNOT MIRROR heroImage'S CONVENTION. P4-1 names the blob after its FIELD
// KEY (`<slug>/heroImage.webp`), which works because a project has exactly one
// heroImage — a re-upload overwrites the same path and no orphan can exist. A
// project has MANY block images, so the name needs a per-image component, and every
// obvious candidate is unsafe:
//
//   - the array index          -> renames on reorder. This is exactly what Keystatic
//                                 does (it derives nested image filenames from the
//                                 field's path within the entry), and exactly why it
//                                 is locked out of these files (4b-i).
//   - the stable client id     -> `useRef(0)` counters (`x0, x1…`) reseeded on every
//                                 mount. Stable across reorders WITHIN a session,
//                                 which is all SK-3b needed — but the same id names a
//                                 different block after a reload, and every project
//                                 reuses x0..xN. Sessions would silently overwrite
//                                 each other's images, permanently, in git.
//   - <section-id>-<block-id>  -> section.id is USER-EDITABLE (the 4b-iii shell form)
//                                 and is a DOM anchor, so the path would drift the
//                                 moment someone renames it.
//
// SO: CONTENT-ADDRESSED. The name is a hash of the NORMALIZED webp bytes, which
// depends on nothing but the image itself — not position, not session, not any
// editable field. A reorder therefore cannot rename a blob (4b-iii proved that
// property is what keeps reorder safe), and uploading the same image twice is
// idempotent.
//
// ORPHANS ARE ACCEPTED, DELIBERATELY. Replacing an image points `src` at a new hash
// and leaves the old blob. Deleting it would need REFCOUNTING, because dedupe means
// two blocks can legitimately share one blob, so a naive delete-on-replace could
// break an unrelated block. A stale blob is inert — it costs repo size, not
// correctness — and a GC sweep can reclaim them later.
//
// Dependency-free apart from node:crypto, so it is unit-exercisable directly and
// stays the single source for the writer.
import { createHash } from "node:crypto";

/** The publicPath prefix (no trailing slash) — shared with heroImage, since both
 *  live under a project's image directory. */
export const BLOCK_IMAGE_PUBLIC_PREFIX = "/images/projects";
/** The repo directory the blobs live under. `public` + the publicPath. */
export const BLOCK_IMAGE_DIRECTORY = "public/images/projects";
/** The subdirectory that separates block images from `heroImage.webp`. */
export const BLOCK_IMAGE_SEGMENT = "blocks";
/**
 * Hex characters of the sha256 kept. 12 hex = 48 bits: for the low thousands of
 * images a project could plausibly hold, collision probability is ~1e-9. Short
 * enough to stay readable in a diff.
 */
export const BLOCK_IMAGE_HASH_LENGTH = 12;

/** The content hash of the NORMALIZED bytes — the blob's whole identity. */
export function blockImageHash(normalized: Uint8Array): string {
  return createHash("sha256").update(normalized).digest("hex").slice(0, BLOCK_IMAGE_HASH_LENGTH);
}

/** The yaml `src` string for a slug + content hash. */
export function blockImageYamlValue(slug: string, hash: string): string {
  return `${BLOCK_IMAGE_PUBLIC_PREFIX}/${slug}/${BLOCK_IMAGE_SEGMENT}/${hash}.webp`;
}

/** The repo blob path for a slug + content hash. `public` + the yaml value. */
export function blockImageBlobPath(slug: string, hash: string): string {
  return `${BLOCK_IMAGE_DIRECTORY}/${slug}/${BLOCK_IMAGE_SEGMENT}/${hash}.webp`;
}

/**
 * Map a stored `src` back to its repo blob path, or null when it is not a managed
 * block image (an unmigrated path, an external URL, or null). Mirrors
 * heroImageBlobPathFromValue: a value this does not recognise is never deleted.
 */
export function blockImageBlobPathFromValue(value: string | null): string | null {
  if (!value) return null;
  const m = new RegExp(
    `^${BLOCK_IMAGE_PUBLIC_PREFIX}/([a-z0-9-]+)/${BLOCK_IMAGE_SEGMENT}/([0-9a-f]{${BLOCK_IMAGE_HASH_LENGTH}})\\.webp$`
  ).exec(value);
  return m ? blockImageBlobPath(m[1], m[2]) : null;
}
