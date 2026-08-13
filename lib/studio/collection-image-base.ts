// Blog PR 3a — the SINGLE SOURCE for where each collection's images live.
//
// WHY THIS EXISTS. The three image-path sites (block-image-path, hero-image-path, and
// imgSpecFields in keystatic.config) each hardcoded `public/images/projects`. That was
// the bug: imgSpecFields silently DEFAULTED to projects, so when the blog collection
// called it, blog posters were configured to land under the projects tree and nobody
// noticed. For entry heroes the same coupling is worse than untidy — hero paths are a
// FIXED `…/<slug>/heroImage.webp` with no content hash, so a blog post sharing a slug
// with a project would CLOBBER the project's hero. Latent data loss.
//
// THE FIX is not a projects-preserving default (that rebuilds the exact trap for the
// next collection); it is a REQUIRED base that every caller states explicitly. The base
// values live here, once, so they cannot re-drift, and the path helpers TAKE a base
// rather than import one — which keeps them dependency-free leaves that ralph can run
// under --experimental-strip-types.

/** Where one collection's images are stored, in the three forms the callers need:
 *  `directory` (repo path prefix, for the blob), `publicPrefix` (the yaml value's
 *  leading segment, no trailing slash), and `publicPath` (the Keystatic fields.image
 *  publicPath, WITH the trailing slash). */
export type CollectionImageBase = {
  directory: string;
  publicPrefix: string;
  publicPath: string;
};

/** Projects — the exact strings the three sites hardcoded before this PR. The projects
 *  call sites pass THIS explicitly (not a default), so the derivation is byte-identical
 *  to main (proven in ralph/tests/collection-image-paths.mjs against a real on-disk
 *  artifact). */
export const PROJECTS_IMAGE_BASE: CollectionImageBase = {
  directory: "public/images/projects",
  publicPrefix: "/images/projects",
  publicPath: "/images/projects/",
};

/** Blog — its OWN tree, matching the entry heroImage directory PR 1 already set on the
 *  blog collection. Distinct from projects so a shared slug cannot collide (heroes) or
 *  intermingle (block images). Blog has no image assets yet, so nothing migrates. */
export const BLOG_IMAGE_BASE: CollectionImageBase = {
  directory: "public/images/blog",
  publicPrefix: "/images/blog",
  publicPath: "/images/blog/",
};

/** Gallery — its own tree. A gallery item's image IS the item, so unlike projects and blog the
 *  images here are the collection's whole payload rather than illustration inside prose. Distinct
 *  base for the same reason the other two are distinct: a shared slug across collections must not
 *  collide, and `blockImageBlobPath` content-hashes within a base rather than globally. */
export const GALLERY_IMAGE_BASE: CollectionImageBase = {
  directory: "public/images/gallery",
  publicPrefix: "/images/gallery",
  publicPath: "/images/gallery/",
};

/** Map an untrusted collection name to its image base, or null when unknown — the
 *  upload routes use this to validate and reject before doing any work. */
export function imageBaseForCollection(collection: unknown): CollectionImageBase | null {
  if (collection === "projects") return PROJECTS_IMAGE_BASE;
  if (collection === "blog") return BLOG_IMAGE_BASE;
  if (collection === "gallery") return GALLERY_IMAGE_BASE;
  return null;
}
