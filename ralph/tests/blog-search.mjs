// The blog list's search filter, now shared by the index and the three-pane list pane.
// Run: node --experimental-strip-types ralph/tests/blog-search.mjs
//
// WHY IT MOVED AND WHY IT IS TESTED. The filter lived inline in BlogIndex. The three-pane
// editor's list pane needs the same behaviour, and retyping it would give the index and the
// rail two implementations of "which posts exist" to keep in step — the `[slug]/body` drift
// in miniature, where a second copy of a surface collects fixes the other never gets. One
// function, two call sites, and Part D asserts BOTH call sites actually use it rather than
// having quietly grown a local copy back.
//
// THE ONE DECISION WORTH PINNING: an empty query returns EVERYTHING. That is the opposite
// of the blog's status filter, which fails closed, and the difference is deliberate.
// `status` governs whether a post exists publicly, so silence must mean hidden. A search
// box narrows a list the author already owns, so silence must mean unfiltered — a
// fail-closed search would blank the rail the moment it took focus.
import { readFileSync } from "node:fs";
import { filterBlogPosts } from "../../lib/studio/blog-search.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const code = (p) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

// THE CAPITALS IN THIS FIXTURE ARE LOad-BEARING, in BOTH fields. A filter that lowercased
// the query but not the content is the easy mistake, and it has to be catchable
// independently on the title and on the dek — mutation-testing this suite found that with
// uppercase only in a dek, making the TITLE comparison case-sensitive changed no result and
// the suite still passed. "NPS" and "TRUST" are what close that.
const POSTS = [
  { title: "What a data table teaches you about trust", dek: "Density, and when to stop" },
  { title: "Designing for the second read", dek: "TRUST is built on the return visit" },
  { title: "Why NPS is the wrong question", dek: "A number that flatters" },
  { title: "Notes on colour", dek: "Warm greys" },
];
const titles = (r) => r.map((p) => p.title);

/* ================================================================= A. the empty query */
t("A: an empty query returns every post", titles(filterBlogPosts(POSTS, "")), titles(POSTS));
t("A: whitespace only is an empty query", titles(filterBlogPosts(POSTS, "   ")), titles(POSTS));
// By IDENTITY, not by a copy. The pane renders the same array it was given, so nothing
// downstream can be fooled into thinking the list changed.
t("A: an empty query returns the input itself", filterBlogPosts(POSTS, "") === POSTS, true);
t("A: an empty list stays empty", filterBlogPosts([], "trust"), []);

/* ================================================================= B. what it matches */
t("B: matches the title", titles(filterBlogPosts(POSTS, "colour")), ["Notes on colour"]);
t("B: matches the dek", titles(filterBlogPosts(POSTS, "warm")), ["Notes on colour"]);
t("B: matches across BOTH fields at once",
  titles(filterBlogPosts(POSTS, "trust")),
  ["What a data table teaches you about trust", "Designing for the second read"]);
t("B: is a substring match, not a prefix", titles(filterBlogPosts(POSTS, "olou")), ["Notes on colour"]);
t("B: no match returns empty", filterBlogPosts(POSTS, "zzzz"), []);

/* ================================================================= C. case and trimming
 * The dek of the second post spells TRUST in capitals on purpose: a filter that lowercased
 * only the query would match the first post and not the second, and the row above would
 * still look like it passed if it only checked a count. */
t("C: the query is case-insensitive", titles(filterBlogPosts(POSTS, "COLOUR")), ["Notes on colour"]);
t("C: uppercase CONTENT in a TITLE is matched by a lowercase query",
  titles(filterBlogPosts(POSTS, "nps")), ["Why NPS is the wrong question"]);
t("C: uppercase CONTENT in a DEK is matched by a lowercase query",
  titles(filterBlogPosts(POSTS, "trust")).includes("Designing for the second read"), true);
t("C: the query is trimmed", titles(filterBlogPosts(POSTS, "  colour  ")), ["Notes on colour"]);

/* ================================================================= D. order is preserved
 * The list pane shows posts in the order the server sent them. A filter that reordered
 * would silently reshuffle the rail on every keystroke. */
t("D: results keep their input order",
  titles(filterBlogPosts(POSTS, "e")),
  titles(POSTS).filter((x) => x.toLowerCase().includes("e")));

/* ================================================================= E. both call sites use it
 * The point of extracting it. If either grows a local `.filter(` over its own items again,
 * this fails — which is the only way to notice, because both would still work. */
for (const f of ["components/studio/BlogIndex.tsx", "components/studio/BlogPostList.tsx"]) {
  const src = code(f);
  t(`E: ${f} imports filterBlogPosts`, /import \{ filterBlogPosts \}/.test(src), true);
  t(`E: ${f} calls it`, /filterBlogPosts\(/.test(src), true);
  t(`E: ${f} has no open-coded title/dek filter`,
    /\.toLowerCase\(\)\.includes\(/.test(src), false);
}

console.log(`\nblog-search result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
