// Unit suite for the next-case rail's data seam (NCR-1, step 1).
//
// Run: node --experimental-strip-types ralph/tests/ncr-adjacent.mjs
//
// WHY IT EXISTS. The rail links to the next case study, and the two ways that link
// can silently ship broken are (1) the order logic — an off-by-one or a reliance on
// the caller's array order instead of orderIndex would point the reader at the wrong
// study or loop them back to the same page — and (2) the route the href resolves to.
// boat-crest is served by a LITERAL route, the other three by the [slug] dynamic one,
// and both live under /projects/<slug>, so a href that assumed /work/<slug> or that
// special-cased boat-crest to a different path would 404. Part A pins the pure order
// resolver; part B proves every real slug resolves to a route that exists in the tree.
import { adjacentByOrderIndex } from "../../lib/case-studies/adjacent-project.ts";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  const ok = g === w;
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${g}\n     want ${w}`));
  ok ? pass++ : fail++;
};

// Fixtures shaped like ProjectListItem — the resolver only touches slug + orderIndex.
const three = [
  { slug: "a", orderIndex: 0 },
  { slug: "b", orderIndex: 1 },
  { slug: "c", orderIndex: 2 },
];
const slugOf = (r) => (r === null ? null : r.slug);

console.log("adjacentByOrderIndex — order + wrap-around");
t("middle: a -> b", slugOf(adjacentByOrderIndex(three, "a")), "b");
t("middle: b -> c", slugOf(adjacentByOrderIndex(three, "b")), "c");
t("wrap-around: last (c) -> first (a)", slugOf(adjacentByOrderIndex(three, "c")), "a");
t("two entries still wrap", slugOf(adjacentByOrderIndex(three.slice(0, 2), "b")), "a");

console.log("\nadjacentByOrderIndex — null guards");
t("unknown slug -> null", adjacentByOrderIndex(three, "zzz"), null);
t("single-entry collection -> null", adjacentByOrderIndex([{ slug: "a", orderIndex: 0 }], "a"), null);
t("empty collection -> null", adjacentByOrderIndex([], "a"), null);

console.log("\nadjacentByOrderIndex — resolves by orderIndex, not array position");
// Shuffled input: array order is c,a,b but orderIndex order is a,b,c. The next after
// `a` must be `b` (orderIndex 1), never `c` (which merely sits next in the array).
const shuffled = [
  { slug: "c", orderIndex: 2 },
  { slug: "a", orderIndex: 0 },
  { slug: "b", orderIndex: 1 },
];
t("shuffled: a -> b (by orderIndex)", slugOf(adjacentByOrderIndex(shuffled, "a")), "b");
t("shuffled: c -> a (wrap by orderIndex)", slugOf(adjacentByOrderIndex(shuffled, "c")), "a");

console.log("\nadjacentByOrderIndex — pure (does not mutate input order)");
const before = shuffled.map((r) => r.slug).join(",");
adjacentByOrderIndex(shuffled, "a");
t("input array untouched after call", shuffled.map((r) => r.slug).join(","), before);

console.log("\nhref/route existence — every real slug resolves to a route in the app tree");
// The four real slugs, derived from the content collection (not hardcoded, so a
// renamed/added study can't silently drift past this suite).
const contentDir = path.join(root, "content", "projects");
const slugs = readdirSync(contentDir)
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .sort();
t("exactly four content case studies", slugs.length, 4);
t("the four expected slugs", slugs, ["boat-crest", "elevate-one-view", "fosfor-ai", "fosfor-data-profiling"]);

const projectsRoute = path.join(root, "app", "(portfolio)", "projects");
const dynamicRoute = path.join(projectsRoute, "[slug]", "page.tsx");
t("the [slug] dynamic route exists", existsSync(dynamicRoute), true);

// projectPath (lib/site.ts) serves every slug at /projects/<slug>. There used to be a fork here:
// a bespoke slug was served by a literal route dir and everything else by the dynamic one. #293
// removed the concept, so there is exactly one route and every slug goes through it.
for (const slug of slugs) {
  t(`/projects/${slug} is served by the dynamic route`, existsSync(dynamicRoute), true);
}

/* ⚠ THE DECISION-#3 GUARD IS GONE, AND ITS ABSENCE IS THE ASSERTION NOW. It used to say boat-crest
 * WAS bespoke with its own literal route; #292 made it content and #293 deleted the concept
 * entirely. What is left worth checking is that no literal project route survives — a stray one
 * would silently shadow the dynamic route for that slug and nothing else would notice. */
/* ⚠ A ROUTE IS A `page.tsx`, NOT A DIRECTORY — which this asserted first and got wrong. A stray
 * `.DS_Store` was holding the deleted `boat-crest/` directory alive, and a directory with no page
 * routes nothing. Testing for the file is testing for the thing that would actually shadow. */
t("no project has a literal route — the escape hatch is gone, not merely unused",
  readdirSync(projectsRoute, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "[slug]")
    .filter((d) => existsSync(path.join(projectsRoute, d.name, "page.tsx")))
    .map((d) => d.name),
  []);
t("…and boat-crest is a real content entry served by that one route", slugs.includes("boat-crest"), true);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
