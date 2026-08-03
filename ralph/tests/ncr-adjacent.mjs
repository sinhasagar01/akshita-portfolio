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
import { BESPOKE_SLUGS } from "../../lib/case-studies/types.ts";
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

// projectPath (lib/site.ts) serves every slug at /projects/<slug>. A bespoke slug has a
// LITERAL route dir at that same path; every other slug is served by the [slug] dynamic
// route. We assert the actual file that serves /projects/<slug> exists, per slug.
const projectsRoute = path.join(root, "app", "(portfolio)", "projects");
const dynamicRoute = path.join(projectsRoute, "[slug]", "page.tsx");
t("the [slug] dynamic route exists", existsSync(dynamicRoute), true);
for (const slug of slugs) {
  const bespoke = BESPOKE_SLUGS.has(slug);
  const literal = path.join(projectsRoute, slug, "page.tsx");
  const served = bespoke ? existsSync(literal) : existsSync(dynamicRoute);
  t(`/projects/${slug} is served (${bespoke ? "literal" : "dynamic"} route)`, served, true);
}

/* ⚠ THE DECISION-#3 GUARD, INVERTED — boat-crest is no longer bespoke, and that is the point.
 * These two used to assert it WAS: a member of BESPOKE_SLUGS with its own literal route dir. Its
 * body is now `content/projects/boat-crest.yaml` and it renders through the ordinary `[slug]`
 * route like every other study, so both facts are deliberately false and are asserted as such
 * rather than deleted — a removed assertion leaves no record that the thing it guarded moved.
 *
 * The SET survives, empty, because it is the mechanism that made the literal-route escape hatch
 * safe. The invariant below is the one worth keeping and it now holds vacuously, which is why the
 * emptiness is asserted first: without that, "every bespoke slug is real content" would pass by
 * having nothing to check and nobody would know the difference. */
t("BESPOKE_SLUGS is empty — the escape hatch survives with no user", BESPOKE_SLUGS.size, 0);
t("…so boat-crest is no longer bespoke", BESPOKE_SLUGS.has("boat-crest"), false);
t("…and its literal route is gone", existsSync(path.join(projectsRoute, "boat-crest", "page.tsx")), false);
t("…while it is still a real content entry served by the dynamic route", slugs.includes("boat-crest"), true);
for (const b of BESPOKE_SLUGS) {
  t(`bespoke slug "${b}" is a real content entry`, slugs.includes(b), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
