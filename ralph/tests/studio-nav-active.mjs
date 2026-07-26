// The studio sidebar's active-route predicate.
// Run: node --experimental-strip-types ralph/tests/studio-nav-active.mjs
//
// THE BUG: `pathname === area.href`. Exact equality deselects a section the moment you
// open one of its detail routes — /studio/blog/<slug> showed Blog unselected, and
// /studio/projects/<slug> had the identical bug for Case studies long before the blog arc
// existed. Nobody noticed because you only see it once you are inside an editor.
//
// THE TRAP IN THE OBVIOUS FIX: prefix-matching everything makes `/studio` — a prefix of
// every other studio route — light Homepage up on every page. So the root is exact and
// only sections prefix-match, which is the pairing this suite exists to hold.
import { isStudioAreaActive } from "../../lib/studio/nav-active.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/** Every nav entry the sidebar renders, in order. */
const AREAS = [
  "/studio",
  "/studio/projects",
  "/studio/experience",
  "/studio/blog",
  "/studio/skills",
  "/studio/settings",
];

/** Exactly one entry must be lit on any real route — asserted as a WHOLE ROW, so a fix
 *  that lights the right item cannot also light a second one unnoticed. */
const row = (pathname) => AREAS.filter((h) => isStudioAreaActive(h, pathname));

/* ---------------------------------------------- A. the eight real routes, one lit each */
const EXPECT = [
  ["/studio", ["/studio"]],
  ["/studio/projects", ["/studio/projects"]],
  ["/studio/projects/boat-crest", ["/studio/projects"]],          // the pre-existing bug
  ["/studio/blog", ["/studio/blog"]],
  ["/studio/blog/what-a-data-table-teaches-you-about-trust", ["/studio/blog"]],
  ["/studio/experience", ["/studio/experience"]],
  ["/studio/skills", ["/studio/skills"]],
  ["/studio/settings", ["/studio/settings"]],
];
for (const [pathname, want] of EXPECT) {
  t(`A: ${pathname}`, row(pathname), want);
  t(`A: ${pathname} lights EXACTLY one entry`, row(pathname).length, 1);
}

/* ---------------------------------------------- B. the root is exact
 * The whole reason the predicate is not a plain startsWith. */
for (const p of ["/studio/blog", "/studio/projects/boat-crest", "/studio/settings"]) {
  t(`B: Homepage is NOT lit on ${p}`, isStudioAreaActive("/studio", p), false);
}
t("B: Homepage IS lit on /studio", isStudioAreaActive("/studio", "/studio"), true);

/* ---------------------------------------------- C. deeper nesting still holds */
t("C: a two-level detail route keeps its section",
  row("/studio/projects/boat-crest/preview"), ["/studio/projects"]);

/* ---------------------------------------------- D. the trailing-slash guard
 * `startsWith(href)` without the slash would make a sibling route hijack a section. These
 * routes do not exist yet, which is the point — the guard is what stops this becoming a
 * silent bug the day one is added. */
t("D1 /studio/projects-archive does NOT light Case studies",
  isStudioAreaActive("/studio/projects", "/studio/projects-archive"), false);
t("D2 /studio/blogroll does NOT light Blog",
  isStudioAreaActive("/studio/blog", "/studio/blogroll"), false);
t("D3 …and neither lights anything else either",
  [row("/studio/projects-archive"), row("/studio/blogroll")], [[], []]);

/* ---------------------------------------------- E. non-studio routes light nothing */
for (const p of ["/", "/blog", "/blog/some-post", "/projects/boat-crest", "/studiofoo"]) {
  t(`E: ${p} lights no studio entry`, row(p), []);
}

/* ---------------------------------------------- F. the predicate is not accidentally
 * symmetric — href and pathname are not interchangeable. */
t("F1 args are ordered (href, pathname)",
  [isStudioAreaActive("/studio/blog", "/studio/blog/x"), isStudioAreaActive("/studio/blog/x", "/studio/blog")],
  [true, false]);

console.log(`\nstudio-nav-active result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
