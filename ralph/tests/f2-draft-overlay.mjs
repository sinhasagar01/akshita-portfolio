// F-2 test — overlayCollection: the /studio draft overlay (union / subtract /
// re-sort). Run: node --experimental-strip-types ralph/tests/f2-draft-overlay.mjs
//
// Plain JS (kept out of the app tsc program). Imports the REAL pure module
// (lib/studio/draft-overlay.ts — no deps, no @-alias). Asserts that getStudioData
// shows draft-branch creates and deletes honestly before publish:
//  (1) empty draft            -> live order unchanged (fail-safe / no-draft / edit-only baseline)
//  (2) modify-only            -> identical slugs+order to live, content replaced (behavior-preserving gate)
//  (3) add mid orderIndex     -> lands in the MIDDLE, not appended
//  (4) add low orderIndex     -> lands first
//  (5) remove                 -> slug dropped
//  (6) add + remove together  -> both applied, re-sorted
//  (7) remove non-existent    -> no-op
//  (8) TIE orderIndex         -> two entries sharing an orderIndex keep LIVE order
//                                (Array.sort is stable, and the Map is built in live order)
import { overlayCollection, byOrderIndex } from "../../lib/studio/draft-overlay.ts";

let failures = 0;
function check(name, cond, detail = "") {
  const status = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// live is orderIndex-sorted upstream (getHomePageData sorts), mirror that here.
const live = [
  { slug: "a", orderIndex: 1, v: "liveA" },
  { slug: "b", orderIndex: 2, v: "liveB" },
  { slug: "c", orderIndex: 3, v: "liveC" },
];
const order = (xs) => xs.map((x) => x.slug).join(",");

// (1) empty draft -> live unchanged
{
  const r = overlayCollection(live, {}, [], byOrderIndex);
  check("empty draft -> live order unchanged", order(r) === "a,b,c", order(r));
  check("empty draft -> live values untouched", r.every((x, i) => x.v === live[i].v));
}
// (2) modify-only -> identical order, replaced content
{
  const r = overlayCollection(live, { b: { slug: "b", orderIndex: 2, v: "DRAFT-B" } }, [], byOrderIndex);
  check("modify-only -> identical order to live", order(r) === "a,b,c", order(r));
  check("modify-only -> b content replaced", r.find((x) => x.slug === "b").v === "DRAFT-B");
}
// (3) add with a MID orderIndex -> inserted in the middle
{
  const r = overlayCollection(live, { m: { slug: "m", orderIndex: 2.5, v: "NEW" } }, [], byOrderIndex);
  check("add mid orderIndex -> lands in the middle (not end)", order(r) === "a,b,m,c", order(r));
}
// (4) add with a LOW orderIndex -> lands first
{
  const r = overlayCollection(live, { z: { slug: "z", orderIndex: 0, v: "NEW" } }, [], byOrderIndex);
  check("add low orderIndex -> lands first", order(r) === "z,a,b,c", order(r));
}
// (5) remove -> slug dropped
{
  const r = overlayCollection(live, {}, ["b"], byOrderIndex);
  check("remove -> slug dropped", order(r) === "a,c", order(r));
}
// (6) add + remove together -> both applied, re-sorted
{
  const r = overlayCollection(live, { m: { slug: "m", orderIndex: 2.5, v: "NEW" } }, ["a"], byOrderIndex);
  check("add+remove together -> both applied", order(r) === "b,m,c", order(r));
}
// (7) remove non-existent slug -> no-op
{
  const r = overlayCollection(live, {}, ["nope"], byOrderIndex);
  check("remove non-existent slug -> no-op", order(r) === "a,b,c", order(r));
}
// (8) TIE orderIndex -> shared orderIndex preserves LIVE order (stable sort + live-order Map)
{
  const tied = [
    { slug: "x", orderIndex: 5, v: "liveX" },
    { slug: "y", orderIndex: 5, v: "liveY" }, // same orderIndex as x, after it in live
    { slug: "w", orderIndex: 9, v: "liveW" },
  ];
  const r = overlayCollection(tied, {}, [], byOrderIndex);
  check("tie orderIndex -> live order preserved (x before y)", order(r) === "x,y,w", order(r));
  // and a modify that keeps the tied orderIndex must not reshuffle the tie
  const r2 = overlayCollection(tied, { x: { slug: "x", orderIndex: 5, v: "DRAFT-X" } }, [], byOrderIndex);
  check("tie orderIndex -> modify keeps tie order (x still before y)", order(r2) === "x,y,w", order(r2));
}

console.log(`\nF-2 overlay result: ${failures === 0 ? "ALL PASS" : failures + " FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
