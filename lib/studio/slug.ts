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

/**
 * The maximum `-N` suffix tried before giving up. Far above any real collection,
 * and bounded so a pathological input cannot spin.
 */
const MAX_SLUG_ATTEMPTS = 50;

/**
 * The first free slug for `base`, suffixing `-2`, `-3`, … past the taken ones.
 *
 * WHY THIS EXISTS. The slug is derived from the entry's human name (company for
 * experience, title for projects), so two genuinely different entries can derive
 * the same slug — two roles at one company is an ordinary CV, and it used to be
 * rejected outright as `slug_taken`. Suffixing keeps the identity unique (it is
 * the filename) while letting both entries keep the same display name, which is
 * what the owner actually typed.
 *
 * Starts at `-2` rather than `-1`, so the pair reads "acme, acme-2" — the first
 * one is not retroactively renamed, and the numbering matches how a person would
 * count them.
 */
export function freeSlug(
  base: string,
  taken: ReadonlySet<string>
): { ok: true; slug: string } | { ok: false; error: SaveError } {
  if (!taken.has(base)) return { ok: true, slug: base };
  for (let n = 2; n <= MAX_SLUG_ATTEMPTS; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return { ok: true, slug: candidate };
  }
  return {
    ok: false,
    error: {
      code: "slug_taken",
      field: base,
      message: `too many entries named like "${base}"`,
    },
  };
}
