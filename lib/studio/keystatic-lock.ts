// P4 4(b)-i — the Keystatic lockout for /studio-owned case studies.
//
// WHY. Keystatic is DESTRUCTIVE on the sections-migrated projects. A single real
// save of elevate-one-view rewrote 137 lines: it stripped the empty-string
// scaffolding to `glow: {}`, dropped `heroImage: null`, and — the damaging part —
// RELOCATED every block image, deleting the tracked `screen-a/b/c.webp` and
// rewriting each `src` to its own index-derived path:
//
//   /images/projects/elevate-one-view/screen-a.webp
//     -> /images/projects/elevate-one-view/sections/0/blocks/0/value/devices/0/src.webp
//
// That is not a misconfiguration (`src` does set directory + publicPath). It is
// Keystatic's convention for nested image fields: you own the base directory, it
// owns the filename, deriving it from the field's PATH WITHIN THE ENTRY. So the
// filename encodes array indices, and a block reorder renames every image beneath
// it. These files are /studio-owned now (lib/studio/sections-serialize.ts is their
// one writer), so Keystatic must not write them.
//
// WHY A GUARD AND NOT CONFIG. Keystatic's collection `path` is a glob
// ("content/projects/*") with no negation, so a config-level exclusion cannot
// express "all projects except these". Moving the files out would break the
// /studio read and the public [slug] render, which the lockout must not touch.
//
// WHY DERIVED, NOT A SLUG LIST. A hardcoded set (the BESPOKE_SLUGS shape) would
// silently fail to lock the NEXT migrated project, and that failure mode is data
// loss. The signal is the file's own `sections:` key — the exact same signal
// serializeProjectSections uses to decide `unsupported_format`. One concept, one
// source.
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * True when this project is owned by the /studio sections editor rather than by
 * Keystatic. Derived from the file, so a newly migrated project locks itself.
 * A missing/unreadable file is not locked — there is nothing to protect.
 */
export function isSectionsOwnedProject(slug: string): boolean {
  if (!/^[a-z0-9-]+$/.test(slug)) return false;
  try {
    const raw = readFileSync(join(process.cwd(), "content", "projects", `${slug}.yaml`), "utf8");
    return raw.includes("\nsections:");
  } catch {
    return false;
  }
}

/**
 * The project slug a repo-relative path belongs to, or null. Covers all three
 * shapes a Keystatic projects save touches — the entry, its rich-body dir, and
 * its image directory (the last is the one that deleted the real images).
 */
export function projectSlugFromPath(path: string): string | null {
  const patterns = [
    /^content\/projects\/([a-z0-9-]+)\.yaml$/, // the entry itself
    /^content\/projects\/([a-z0-9-]+)\//, // its mdoc body dir
    /^public\/images\/projects\/([a-z0-9-]+)\//, // its images
  ];
  for (const re of patterns) {
    const m = re.exec(path);
    if (m) return m[1];
  }
  return null;
}

/** True when a Keystatic write to this path must be refused. */
export function isKeystaticLockedPath(path: string): boolean {
  const slug = projectSlugFromPath(path);
  return slug !== null && isSectionsOwnedProject(slug);
}
