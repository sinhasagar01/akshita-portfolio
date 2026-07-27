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
import { readdirSync, readFileSync } from "node:fs";
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

/* ---------------------------------------------- G. THE INPUT CLASS STRINGS STAY DEDUPED
 * #199 collapsed SEVEN hand-copied `inputCls` declarations across seven files into two
 * exports. Without a gate they simply reappear one at a time, which is how there came to be
 * seven — and worse, they had DRIFTED: four panels carried text-[14px] and the block forms
 * carried text-[13px], so the "duplicate" was never actually duplicated.
 *
 * THE 13px/14px SPLIT IS DELIBERATE AND UNRESOLVED. Two exports, one each, and merging them
 * is an owner decision because it moves rendered type. This asserts BOTH that each is
 * declared exactly once AND that they remain distinct, so a well-meaning merge fails here
 * rather than silently resizing four panels.
 *
 * LinksEditPanel keeps its own local string on purpose — it is a flex child with per-state
 * borders, a different box rather than the same box at another size — so it is excluded by
 * name rather than by a loose count. */
{
  const files = readdirSync(new URL("../../components/studio", import.meta.url), { recursive: true })
    .filter((f) => String(f).endsWith(".tsx"))
    .map((f) => String(f));
  const decls = [];
  for (const f of files) {
    const src = readFileSync(new URL(`../../components/studio/${f}`, import.meta.url), "utf8");
    for (const m of src.matchAll(/(?:export )?const (inputCls|inputClsMd) =/g)) decls.push(`${f}:${m[1]}`);
  }
  const shared = decls.filter((d) => !d.startsWith("LinksEditPanel.tsx"));
  t("G1 `inputCls` is declared exactly once outside LinksEditPanel",
    shared.filter((d) => d.endsWith(":inputCls")).length, 1);
  t("G2 `inputClsMd` is declared exactly once",
    shared.filter((d) => d.endsWith(":inputClsMd")).length, 1);
  t("G3 both live in blocks/fields.tsx",
    shared.every((d) => d.startsWith("blocks/fields.tsx")), true);
  // LinksEditPanel's local is EXPECTED. Asserted so that deleting it becomes a deliberate
  // act rather than a silent one, and so G1 cannot be satisfied by removing the exception.
  //
  // RENAMED `inputCls` -> `inputBase` IN PR 2b, and the rename is the point: it stopped being
  // "our copy of the shared input" and became a BASE that three sites compose with the
  // okBorder/errBorder constants. PR 2a had edited the old const, which had exactly ONE
  // consumer, leaving the panel's other two inputs behind — a 44px well beside a 39px flat
  // box in every link row. One base, three compositions is what makes that impossible again.
  t("G4 LinksEditPanel keeps its own local BASE, deliberately (renamed from inputCls in PR 2b)",
    /const inputBase =/.test(readFileSync(new URL("../../components/studio/LinksEditPanel.tsx", import.meta.url), "utf8")), true);

  const fields = readFileSync(new URL("../../components/studio/blocks/fields.tsx", import.meta.url), "utf8");
  const grab = (n) => fields.match(new RegExp(`const ${n} =\\s*"([^"]*)"`))?.[1] ?? "";
  const sm = grab("inputCls"), md = grab("inputClsMd");
  t("G5 the two differ", sm !== md, true);
  // ...and by EXACTLY the font size, nothing else. If a future edit diverges them further,
  // that is a second drift and this catches it.
  const only = (a, b) => [...new Set(a.split(" "))].filter((x) => !b.split(" ").includes(x));
  t("G6 …by exactly the font size and nothing else",
    [only(sm, md), only(md, sm)], [["text-[13px]"], ["text-[14px]"]]);
}

console.log(`\nstudio-nav-active result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
