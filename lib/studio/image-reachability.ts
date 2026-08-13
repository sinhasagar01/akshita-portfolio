// Which uploaded block images anything still points at.
//
// ---- ⚠ THE SUBJECT IS THE PATH. THE HASH IS NOT, AND A GC THAT CONFUSES THEM DELETES LIVE FILES --
//
// `blockImageHash` is sha256 of the normalized bytes and the filename is its first twelve hex
// digits, so re-uploading the same image is idempotent. That is a FEATURE — and it means identical
// bytes carry an identical NAME under different paths, by design.
//
// Measured on this repository, there are TWO such pairs and they are different shapes:
//
//     926214f008d6   gallery/akshita  and  blog/you-find-out-what-motion-is-for-by-removing-it
//     edaa53ebfee8   gallery/akshita  and  gallery/waves
//
// The record knew about the first. The second is WITHIN one collection — the same photograph
// uploaded to two gallery items — and nobody had looked. A hash-keyed reachability check answers
// "are these bytes used anywhere", which is a question nobody asked; the question a GC needs is
// "is anything pointing at THIS FILE", and only the full path can answer it.
//
// ---- ⚠ AND THE REFERENCE SET IS NOT `content/` ------------------------------------------------
//
// A `content/`-only walk finds 20 of the 22 live paths here. The other two are in `app/dev`
// harness pages, which reference project block images directly — so a GC scoped to content would
// have deleted two files that something loads. THE WALK'S BOUNDARY IS THE DEFECT, exactly as it was
// for the `.tsx`-only sweep that missed 81 rung references and the `lib/`-only census that missed a
// field list in a component.
//
// The walk is therefore passed IN rather than assumed here, and the suite declares what it covered.

/** A file on disk that a GC could delete, and every place that might point at it. */
export type ReachabilityInput = {
  /** Public paths of on-disk block images, e.g. `/images/gallery/waves/blocks/abc123.webp`. */
  onDisk: readonly string[];
  /** Every path literal found anywhere the walk reached. */
  referenced: readonly string[];
};

export type ReachabilityResult = {
  orphans: string[];
  /** Orphans whose BASENAME is shared with a referenced file. Deleting one of these by hash — or
   *  by any name-keyed rule — takes the live copy with it. */
  unsafeToDeleteByName: string[];
  liveCount: number;
};

/** The basename is the hash prefix, so it is the identity of the BYTES rather than of the file. */
function basename(p: string): string {
  return p.slice(p.lastIndexOf("/") + 1);
}

/**
 * Split the on-disk set into live and orphaned, BY PATH.
 *
 * ⚠ `unsafeToDeleteByName` IS THE POINT OF THIS FUNCTION, NOT `orphans`. An orphan list invites a
 * `rm`, and the one hazard that list cannot express is that two paths can share a name. Any future
 * GC must key on the full path; this reports which orphans would be destroyed together with a live
 * file if it does not.
 */
export function blockImageReachability(input: ReachabilityInput): ReachabilityResult {
  const live = new Set(input.referenced);
  const orphans = input.onDisk.filter((p) => !live.has(p)).sort();
  const liveNames = new Set([...live].map(basename));
  return {
    orphans,
    unsafeToDeleteByName: orphans.filter((p) => liveNames.has(basename(p))).sort(),
    liveCount: input.onDisk.length - orphans.length,
  };
}
