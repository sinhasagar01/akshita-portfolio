// F-3 — server-side slug generation for collection CREATE.
//
// The create identity is DERIVED here from the entry's slug field (a project's
// title, an experience's company), never taken from the client — so a caller can
// never choose or spoof the filename a create writes to. Pure and dependency-free
// (only a type import, erased at runtime), so it is unit-testable in isolation.
import type { SaveError } from "./site-settings-format";

/**
 * Derive a filesystem-safe slug from a human title: lowercase, then map every run
 * of non-`[a-z0-9]` characters (spaces, punctuation, unicode) to a single hyphen,
 * and strip leading/trailing hyphens. The output always satisfies the write-path
 * guard regex `^[a-z0-9-]+$` (save-draft/route.ts) — or, when the title has no
 * slug-safe characters at all (empty, whitespace, pure punctuation/unicode), it
 * returns a typed `invalid_slug` rather than an empty filename.
 */
export function slugify(
  title: string
): { ok: true; slug: string } | { ok: false; error: SaveError } {
  const slug = (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // spaces/punctuation/unicode -> hyphen (also collapses runs)
    .replace(/^-+|-+$/g, ""); // strip leading/trailing hyphens
  if (slug === "") {
    return {
      ok: false,
      error: {
        code: "invalid_slug",
        field: "title",
        message: "title has no slug-safe characters",
      },
    };
  }
  return { ok: true, slug };
}
