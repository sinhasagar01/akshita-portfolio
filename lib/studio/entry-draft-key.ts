// BS-3c — the draft-state cache key, split into a dependency-free leaf so ralph can
// assert it. entry-draft.ts imports next/cache and the GitHub reader, so a suite cannot
// load it; this one has no imports at all.
//
// WHY THE KEY IS WORTH A TEST. It used to be the bare string ["studio-case-study-draft"]
// with `slug` as the only argument. Blog and project slugs are INDEPENDENT namespaces, so
// a blog sibling that copied that key would let a post and a project SHARING A SLUG serve
// each other's cached draft state. That is the same class as 3a's hero-path clobber, one
// layer up, and the kind of thing a comment cannot enforce.

/** The collections that have a per-entry editing surface. */
export type DraftableCollection = "projects" | "blog";

/** The unstable_cache key parts for a collection's draft read. COLLECTION-QUALIFIED. */
export function entryDraftCacheKey(collection: DraftableCollection): string[] {
  return ["studio-entry-draft", collection];
}
