#!/usr/bin/env node
// THE BLOCK-IMAGE COLLECTOR. Reports by default; deletes only when told to, and only from a clean tree.
//
//   node ralph/collect-images.mjs            report what is orphaned, change nothing
//   node ralph/collect-images.mjs --delete   remove them, after the refusals below pass
//
// ---- ⚠ WHY THIS IS AN OPERATOR TOOL AND NEVER A SUITE ------------------------------------------
//
// It deletes tracked files. A gate that deletes is one crash away from a tree every later gate then
// measures, which is the argument `mutate-harness` makes about its own section B and the reason
// `--verify-register` lives here rather than in `ralph/run.mjs`.
//
// ---- ⚠ THE HAZARD THIS TOOL EXISTS TO NOT COMMIT -----------------------------------------------
//
// A block image's basename IS its content hash, so identical bytes land on identical names under
// different paths — deliberately, because re-uploading an image is idempotent. TWO such pairs exist
// today and ONE HAS A LIVE SIDE:
//
//     LIVE      /images/blog/<post>/blocks/926214f008d6.webp
//     orphaned  /images/gallery/akshita/blocks/926214f008d6.webp
//
// A collector keyed on the hash — or on the basename, or on anything but the full path — collects
// the orphan and destroys the live copy with it. `blockImageReachability` is keyed on the PATH and
// reports `unsafeToDeleteByName` for exactly this reason, and section D below refuses to delete any
// file it names even though the path rule already makes it safe. Belt and braces, because the cost
// of being wrong here is somebody's uploaded photograph.
//
// ---- ⚠ AND AN ORPHAN IS NOT A DEFECT -----------------------------------------------------------
//
// It is a replaced image whose bytes stopped being referenced, which content addressing makes free
// to leave on disk. Nothing here should run on a schedule. This exists so that deleting them is a
// decision someone takes with the numbers in front of them, rather than a `rm` somebody reasons out
// at a prompt — which is the shape that once cost this repository an uncommitted registry.
import { existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { blockImageReachability } from "../lib/studio/image-reachability.ts";
import { ROOT, referencesByDir, blockImagesOnDisk } from "./image-walk.mjs";

const DELETE = process.argv.includes("--delete");
const bail = (code, headline, ...detail) => {
  console.error(`\n⚠ REFUSED — ${headline}`);
  for (const d of detail) console.error(d);
  console.error(`REFUSED, nothing was deleted: ${headline}`);
  process.exit(code);
};

const perDir = referencesByDir();
const onDisk = blockImagesOnDisk();
const referenced = [...new Set(perDir.flatMap((p) => p.paths))];

/* ⚠ A WALK THAT REACHES NOTHING MAKES EVERY FILE AN ORPHAN, WHICH IS THE ONE INPUT STATE THAT TURNS
 * THIS TOOL INTO A `rm -rf`. The census asserts this too; the collector re-asserts it rather than
 * trusting that the census ran, because the two are separate programs and only one of them
 * deletes. */
if (!onDisk.length) bail(2, "the on-disk walk found NO block images — refusing to reason about an empty population");
if (referenced.length < 10)
  bail(2, `the reference walk found only ${referenced.length} path(s), which is too few to trust`,
    "  Every orphan verdict depends on this number. A broken walk reports the whole library as dead.",
    "  Run `node ralph/tests/image-orphans.mjs` and read section A before going further.");
const emptyDirs = perDir.filter((p) => !existsSync(join(ROOT, p.dir)));
if (emptyDirs.length) bail(2, `a declared reference directory does not exist: ${emptyDirs.map((p) => p.dir).join(", ")}`);

const result = blockImageReachability({ onDisk, referenced });
const broken = referenced.filter((p) => !existsSync(join(ROOT, "public", p)));

console.log(`\nblock images   ${onDisk.length} on disk · ${result.liveCount} live · ${result.orphans.length} orphaned`);
for (const p of perDir) console.log(`  ref ${p.dir.padEnd(11)} ${String(p.paths.length).padStart(3)}   ${p.why}`);

/* A reference pointing at nothing is a BROKEN IMAGE on the site, and it also means the walk and the
 * disk disagree — which is a reason to stop rather than a reason to tidy. */
if (broken.length) {
  console.log(`\n⚠ ${broken.length} referenced path(s) do not exist on disk:`);
  for (const b of broken) console.log(`    ${b}`);
}

const unsafe = new Set(result.unsafeToDeleteByName);
const deletable = result.orphans.filter((o) => !unsafe.has(o));
let bytes = 0;
console.log(`\norphans`);
for (const o of result.orphans) {
  const abs = join(ROOT, "public", o);
  const size = existsSync(abs) ? statSync(abs).size : 0;
  if (!unsafe.has(o)) bytes += size;
  console.log(`  ${unsafe.has(o) ? "HELD  " : "delete"}  ${String(size).padStart(7)} B  ${o}`);
}
if (unsafe.size) {
  console.log(`\n⚠ ${unsafe.size} HELD — the basename is shared with a LIVE file. The name is the content`);
  console.log(`  hash, so these bytes exist under another path that something still points at. This`);
  console.log(`  tool keys on the PATH and could delete them safely; it does not, because a reader of`);
  console.log(`  a delete list cannot tell a path-keyed rule from a name-keyed one, and the next tool`);
  console.log(`  to touch this population may not be this one.`);
}

if (!DELETE) {
  console.log(`\nreport only — ${deletable.length} file(s), ${bytes} B would be freed.`);
  console.log(`Pass --delete to remove them. An orphan is not a defect; leaving them costs nothing.`);
  process.exit(0);
}

/* ⚠ A CLEAN TREE IS THE UNDO. These files are tracked, so `git checkout` restores anything this
 * removes — but only if the tree was clean enough for that to be a precise operation rather than a
 * destructive one. This repository has already lost uncommitted work to exactly that command. */
const dirty = (spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" }).stdout ?? "").trim();
if (dirty) bail(2, "the tree is dirty, and a clean tree is what makes this undoable",
  `  ${dirty.split("\n").length} file(s) carry uncommitted work.`,
  "  Commit them first — then `git checkout -- public/images` reverses this exactly.");
if (broken.length) bail(2, "a referenced path does not exist on disk, so the walk and the disk disagree",
  "  Deleting anything while those two disagree is acting on a census that is already wrong.");
if (!deletable.length) { console.log("\nnothing to delete."); process.exit(0); }

for (const o of deletable) rmSync(join(ROOT, "public", o), { force: true });
console.log(`\ndeleted ${deletable.length} file(s), ${bytes} B freed. Reverse with \`git checkout -- public/images\`.`);
console.log(`Re-run \`node ralph/tests/image-orphans.mjs\` to confirm the census agrees.`);
