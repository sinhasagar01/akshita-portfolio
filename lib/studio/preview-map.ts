// The session preview map — how the blog canvas draws an image uploaded THIS session.
//
// THE PROBLEM. `makeDraftSrcRewriter` (draft-image.ts) rewrites only the paths in
// `draftImages`, and that array is a SNAPSHOT taken server-side at page load. A path created
// after the snapshot is not in it, so the rewriter leaves it alone, and the plain path 404s
// against main until publish. That is why a freshly uploaded figure stayed blank on the
// canvas until a refresh.
//
// THIS IS THE THIRD OF THREE DRAFT-IMAGE STRATEGIES, and the project runs all three on
// purpose. See the note at the foot of this header.
//
// ---------------------------------------------------------------- THE MAP IS APPEND-ONLY
//
// THERE IS NO `release(path)` AND ITS ABSENCE IS THE DESIGN, NOT AN OVERSIGHT. If you are
// here to add one for tidiness, this paragraph is for you.
//
// `blockImageHash` is sha256 of the normalized bytes, so a path IS its image: one path means
// one image, forever, and the SAME file uploaded into two blocks yields the SAME path. A
// path-keyed entry can therefore be on screen in more than one place at once, and no holder
// can know whether it is the last one. Revoking on block removal blanks the survivor — #193's
// shared revocable resource, rebuilt by the cleanup meant to be tidy.
//
// AND NEITHER IS "SUPERSEDE" SAFE HERE, which is where this parts company with the hero.
// #190 revokes the old hero url on replacement, and that is correct THERE because the hero
// has a FIXED key — one slot, one holder, a new upload genuinely replaces it. Block images
// are content-addressed, so replacing a block's image does not overwrite a key; it ADDS one
// and leaves the old path behind, possibly still shown by another block. Under content
// addressing a supersede is not a thing that happens.
//
// So `adopt` is IDEMPOTENT PER PATH — the same bytes twice returns the url already held and
// creates no second one — and `releaseAll` at unmount is the only revoke. The cost is one
// live object URL per distinct image uploaded before the holder unmounts. Measured: the blog
// panel REMOUNTS on navigation between posts (the App Router transition is client-side, but
// React drops the subtree and builds a new one), so `releaseAll` fires on every post switch
// and the bound is uploads-per-POST, not per session.
//
// A leak bounded by one post's editing beats a blank image caused by a clever sweep.
//
// ------------------------------------------------------- THE THREE STRATEGIES, DELIBERATE
//
//   1. ImageThumb            proxies EVERY src unconditionally. A 36px thumbnail can afford
//                            a GitHub round trip per image; correctness with one code path
//                            is worth more than the fetch.
//   2. makeDraftSrcRewriter  proxies only the snapshot's paths, so published images keep
//                            their static path and the fast route. A full-width figure
//                            cannot afford the proxy for every image.
//   3. this map              resolves what neither can: a file that exists only in the
//                            browser, because the snapshot predates it.
//
// Whoever unifies them is choosing to break one of those three, and should know it.
//
// Dependency-free (no react, no next) so the lifetime is DRIVEN by ralph rather than regexed
// out of a component — the same reason `resolveHeroSrc` lives in hero-fill.ts.

/** What an image field hands up when an upload succeeds: the server-derived path, and the
 *  bytes the browser already has. Shared by both block registries so there is one shape. */
export type PreviewUpload = {
  /** The path the server derived from the bytes. The map's key. */
  src: string;
  /** A `File` from the picker. Typed `Blob` because that is all the map needs — a second
   *  createObjectURL on the same Blob yields a distinct url with no copy of the bytes. */
  file: Blob;
};

export type PreviewMap = {
  /** Hold a preview for `path` and return its url. Idempotent: the same path returns the url
   *  already held and creates nothing. */
  adopt(path: string, file: Blob): string;
  /** The url held for `path`, or undefined. */
  get(path: string): string | undefined;
  /** Free every url and empty the map. The ONLY revoke — see the header. */
  releaseAll(): void;
};

/** `create` and `revoke` are injected so a test can count them. They default to the real
 *  object-URL pair, so a caller passes nothing. */
export function createPreviewMap(io?: {
  create?: (file: Blob) => string;
  revoke?: (url: string) => void;
}): PreviewMap {
  const create = io?.create ?? ((file: Blob) => URL.createObjectURL(file));
  const revoke = io?.revoke ?? ((url: string) => URL.revokeObjectURL(url));
  const urls = new Map<string, string>();

  return {
    adopt(path, file) {
      const held = urls.get(path);
      if (held !== undefined) return held; // same path means same bytes — see the header
      const url = create(file);
      urls.set(path, url);
      return url;
    },
    get: (path) => urls.get(path),
    releaseAll() {
      for (const url of urls.values()) revoke(url);
      urls.clear();
    },
  };
}
