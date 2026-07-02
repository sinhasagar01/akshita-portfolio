// Typed deep-link helpers into the Keystatic admin UI.
//
// The names are unioned to the real config keys in keystatic.config.ts, so a
// typo cannot silently produce a 404 link. No basePath is configured in
// next.config.ts, so the prefix is the literal "/keystatic". Keystatic exposes
// no stable URL below item granularity, so the helper intentionally stops there.

type CollectionName = "projects" | "experience";
type SingletonName = "siteSettings" | "skills";

const KEYSTATIC_BASE = "/keystatic";

/** The list view of a collection, e.g. /keystatic/collection/projects */
export function collectionListHref(name: CollectionName): string {
  return `${KEYSTATIC_BASE}/collection/${name}`;
}

/** A single collection item, e.g. /keystatic/collection/projects/item/boat-crest */
export function collectionItemHref(name: CollectionName, slug: string): string {
  return `${KEYSTATIC_BASE}/collection/${name}/item/${encodeURIComponent(slug)}`;
}

/** A singleton editor, e.g. /keystatic/singleton/siteSettings */
export function singletonHref(name: SingletonName): string {
  return `${KEYSTATIC_BASE}/singleton/${name}`;
}
