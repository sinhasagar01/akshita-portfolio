// P4 4(b)-iv test — the block-image naming convention.
// Run: node --experimental-strip-types ralph/tests/p4-4biv-block-images.mjs
//
// The convention is the whole point of this sub-gate, because every OBVIOUS name is
// unsafe and the unsafety is invisible until it has already corrupted git history:
//   - the array index      -> renames on reorder (this is what Keystatic does, and
//                             why it is locked out of these files)
//   - the stable client id -> `useRef(0)` counters reseeded every mount; the same id
//                             names a different block after a reload, and every
//                             project reuses x0..xN
//   - <section-id>-<...>   -> section.id is user-editable (the 4b-iii shell form)
//
// So the name is a hash of the NORMALIZED bytes: it depends on the image and nothing
// else. These assert the properties that buys.
import { createHash } from "node:crypto";
import {
  blockImageHash,
  blockImageYamlValue,
  blockImageBlobPath,
  blockImageBlobPathFromValue,
  BLOCK_IMAGE_HASH_LENGTH,
} from "../../lib/studio/block-image-path.ts";

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    failures++;
    console.log(`  [FAIL] ${name} — ${e.message}`);
  }
}

const bytesA = new Uint8Array([1, 2, 3, 4, 5]);
const bytesB = new Uint8Array([9, 9, 9]);

console.log("the content-addressed name");

check("the hash is the sha256 of the bytes, truncated — nothing else", () => {
  const want = createHash("sha256").update(bytesA).digest("hex").slice(0, BLOCK_IMAGE_HASH_LENGTH);
  if (blockImageHash(bytesA) !== want) throw new Error("not the documented derivation");
});

check("the same bytes always give the same name (idempotent re-upload)", () => {
  if (blockImageHash(bytesA) !== blockImageHash(new Uint8Array([1, 2, 3, 4, 5])))
    throw new Error("not deterministic");
});

check("different bytes give a different name", () => {
  if (blockImageHash(bytesA) === blockImageHash(bytesB)) throw new Error("collision on trivial input");
});

check("THE PROPERTY THAT MATTERS: the name has no index, session or field in it", () => {
  // The hash is a pure function of the bytes, so there is no argument through which
  // a position, a session counter, or an editable field could reach it. A reorder
  // therefore cannot rename a blob — the 4(b)-iii safety, by construction.
  if (blockImageHash.length !== 1) throw new Error("the hash takes something besides the bytes");
  const h = blockImageHash(bytesA);
  if (!/^[0-9a-f]+$/.test(h)) throw new Error("not plain hex");
  if (h.length !== BLOCK_IMAGE_HASH_LENGTH) throw new Error("unexpected length");
});

check("the yaml value and the blob path agree — blob = 'public' + yaml", () => {
  const h = blockImageHash(bytesA);
  const yaml = blockImageYamlValue("fosfor-ai", h);
  const blob = blockImageBlobPath("fosfor-ai", h);
  if (blob !== `public${yaml}`) throw new Error(`${blob} != public${yaml}`);
});

check("the path is under the project's own directory, in a blocks/ segment", () => {
  const h = blockImageHash(bytesA);
  if (blockImageYamlValue("fosfor-ai", h) !== `/images/projects/fosfor-ai/blocks/${h}.webp`)
    throw new Error(blockImageYamlValue("fosfor-ai", h));
});

check("blocks/ keeps block images clear of heroImage.webp", () => {
  const h = blockImageHash(bytesA);
  if (blockImageBlobPath("x", h).includes("/heroImage")) throw new Error("collides with the hero path");
  if (!blockImageBlobPath("x", h).includes("/blocks/")) throw new Error("no blocks segment");
});

console.log("\nmapping a stored src back to its blob (for a future GC sweep)");

check("a managed src maps back to its blob path", () => {
  const h = blockImageHash(bytesA);
  const v = blockImageYamlValue("fosfor-ai", h);
  if (blockImageBlobPathFromValue(v) !== blockImageBlobPath("fosfor-ai", h))
    throw new Error("round-trip broke");
});

// Anything unrecognised must map to null — the heroImage precedent: a value this
// does not understand is never a deletion target.
for (const [label, v] of [
  ["null", null],
  ["an empty string", ""],
  ["an unmigrated path", "/images/projects/fosfor-ai/screen-a.webp"],
  ["a heroImage", "/images/projects/fosfor-ai/heroImage.webp"],
  ["an external url", "https://example.com/x.webp"],
  ["a traversal attempt", "/images/projects/../../etc/passwd"],
  ["a non-hex name", "/images/projects/fosfor-ai/blocks/zzzzzzzzzzzz.webp"],
  ["a wrong-length hash", "/images/projects/fosfor-ai/blocks/abc.webp"],
  ["a non-webp", "/images/projects/fosfor-ai/blocks/abc123abc123.png"],
]) {
  check(`${label} is NOT treated as a managed blob`, () => {
    if (blockImageBlobPathFromValue(v) !== null) throw new Error(`mapped to ${blockImageBlobPathFromValue(v)}`);
  });
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
