// THE ONE WALK THAT FINDS BLOCK-IMAGE REFERENCES, SHARED BY THE CENSUS AND THE COLLECTOR.
//
// ---- ⚠ WHY THIS IS EXTRACTED RATHER THAN COPIED ------------------------------------------------
//
// `image-orphans` reports which files nothing points at. The collector DELETES them. If those two
// ever disagree about where a reference can live, the collector removes a file the census would
// have called live — and the census would go on passing, because it never sees what was deleted.
//
// A copied walk is the parallel-list defect with a `rm` on the end of it. This repository already
// carries six instances of two lists drifting apart; none of them deleted anything.
//
// ---- ⚠ THE TWO FACTS THE WALK EXISTS TO CARRY --------------------------------------------------
//
// ONE. THE SUBJECT IS THE PATH, NEVER THE HASH. A basename IS the content hash, so identical bytes
// get identical names under different paths — by design, because re-uploading an image is
// idempotent. Two such pairs exist today, and one has a LIVE side. A GC keyed on the hash would
// collect the orphan and destroy the live copy with it.
//
// TWO. `content` IS NOT THE WHOLE WALK. `app/dev` harness pages reference project block images
// directly — two live paths that a content-only sweep misses, and that a content-only collector
// would therefore delete. That was found before any tool could act on it, which is the only reason
// it is a comment rather than an incident.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blankCommentBodies } from "./strip-comments.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** ⚠ EVERY DIRECTORY THAT MAY HOLD A REFERENCE, DECLARED WITH ITS REASON. Adding a place that can
 *  point at an uploaded image means adding it here, and the census asserts each declared part is
 *  real — so a directory that stops carrying references is a decision somebody makes rather than a
 *  silent narrowing that widens the orphan list. */
export const REFERENCE_DIRS = [
  ["content", "the entries themselves — where an author's upload is recorded"],
  ["app", "route and harness pages; `app/dev` references project block images directly"],
  ["components", "a component may hardcode an illustration path"],
  ["lib", "a leaf may carry a default or a fixture path"],
];

export const PATH_RE = /\/images\/[a-zA-Z0-9/_-]+\/blocks\/[0-9a-f]+\.(?:webp|png|jpg|jpeg|avif)/g;

export const walkFiles = (rel, out = [], root = ROOT) => {
  const abs = join(root, rel);
  if (!existsSync(abs)) return out;
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walkFiles(child, out, root);
    else out.push(child);
  }
  return out;
};

/**
 * Every referenced block-image path, grouped by the directory it was found in.
 *
 * ⚠ COMMENTS ARE BLANKED, AND THE FAILURE DIRECTION IS WHY IT IS NOT OPTIONAL. `image-reachability`
 * documents its input with an EXAMPLE path, and the first run of the census read that example as a
 * live reference. A comment cannot make a file an orphan — it can only make an orphan look LIVE.
 * Had that example named a real file, the census would have protected it forever and nothing would
 * have gone red. Here the same mistake would keep a dead file, which is harmless; the mirror
 * mistake, reading a reference as absent, is what deletes something.
 */
export function referencesByDir(root = ROOT) {
  return REFERENCE_DIRS.map(([dir, why]) => {
    const found = new Set();
    for (const f of walkFiles(dir, [], root)) {
      if (/\.(png|jpe?g|webp|avif|ico|woff2?|mp4)$/i.test(f)) continue;
      let src;
      try { src = blankCommentBodies(readFileSync(join(root, f), "utf8")); } catch { continue; }
      for (const m of src.matchAll(PATH_RE)) found.add(m[0]);
    }
    return { dir, why, paths: [...found] };
  });
}

/** Public paths of every block image on disk, e.g. `/images/gallery/waves/blocks/abc123.webp`. */
export function blockImagesOnDisk(root = ROOT) {
  return walkFiles("public/images", [], root)
    .filter((f) => f.includes("/blocks/") && /\.(webp|png|jpe?g|avif)$/i.test(f))
    .map((f) => f.replace(/^public/, ""));
}
