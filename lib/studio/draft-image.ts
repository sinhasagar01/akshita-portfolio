// The draft-image proxy convention — how /studio views an image that exists only
// on the draft branch.
//
// THE PROBLEM IT SOLVES. Image uploads commit their blob to the DRAFT branch
// (upload-block-image, upload-hero-image, upload-settings-photo all do), but the
// running app serves /images/** from the deployed `public/` directory, which is
// built from MAIN. So between upload and publish the owner's own image 404s
// everywhere in /studio — the field shows a path to a file the browser cannot
// fetch, and the preview renders a broken frame. The blob is committed and
// correct; it is simply not on the branch the file server is reading.
//
// THE FIX. An owner-gated route that reads the bytes from the draft branch and
// streams them back, so /studio can see draft-only images before publish. The
// PUBLIC site never uses this — it reads main, where the file is a real static
// asset, so the fast path is untouched.
//
// Dependency-free (no next, no node) so it is importable from both the client
// components that build the URL and the server route that validates it, and so
// the guard is unit-exercisable on its own.

/** The proxy route path. */
export const DRAFT_IMAGE_ROUTE = "/api/studio/draft-image";

/**
 * The public paths the proxy will serve. Deliberately narrow: it must be a
 * rooted /images/** path with an image extension, and `..` is rejected outright
 * so a traversal can never reach outside the image tree even if a future caller
 * forgets to encode. The route re-runs this on the untrusted query value — the
 * client never picks what gets read.
 */
export function isSafeImagePath(path: string): boolean {
  if (path.includes("..")) return false;
  return /^\/images\/[a-zA-Z0-9._/-]+\.(webp|png|jpe?g|svg)$/i.test(path);
}

/** The proxy URL for a public image path. */
export function draftImageUrl(path: string): string {
  return `${DRAFT_IMAGE_ROUTE}?path=${encodeURIComponent(path)}`;
}

/** Content type for the extensions isSafeImagePath admits. */
export function imageContentType(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  return (
    {
      webp: "image/webp",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
    }[ext] ?? "application/octet-stream"
  );
}
