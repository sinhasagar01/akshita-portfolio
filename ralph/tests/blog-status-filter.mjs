// Unit suite for the blog read seam's PUBLIC-VISIBILITY GATE (blog arc, PR 1).
//
// Run: node --experimental-strip-types ralph/tests/blog-status-filter.mjs
//
// WHY IT EXISTS, AND WHY IT IS LOAD-BEARING. lib/blog/select.ts holds the one line
// standing between a draft post and the public site. The site publishes whole-branch —
// an unfinished post reaches main the next time ANYTHING is published — so nothing at
// the pipeline holds it back; only this filter does. The gate FAILS CLOSED: exactly
// "published" renders, and "" (unset / authored before the field existed), "draft", and
// any unknown value are hidden. That "" case is the whole point (a legacy or typo'd
// status must not leak), so it is asserted on its own below and is the mutation target.
//
// Part A pins the predicate. Part B pins the list selector (filter + newest-first sort +
// no-mutation). Part C pins the mapper's coalescing, since a field the mapper dropped
// would reach the gate as undefined.
import {
  isPublishedPost,
  mapBlogListItem,
  selectPublishedPostsNewestFirst,
} from "../../lib/blog/select.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  const ok = g === w;
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${g}\n     want ${w}`));
  ok ? pass++ : fail++;
};

const item = (over = {}) => ({
  slug: "s", title: "T", dek: "", date: "2026-07-01", topic: "", status: "published",
  heroImage: null, ...over,
});

/* ----------------------------------------- Part A — the fail-closed predicate (D1) */
t("A1 published renders", isPublishedPost(item({ status: "published" })), true);
t("A2 draft hidden", isPublishedPost(item({ status: "draft" })), false);
// The load-bearing case AND the mutation target: an unset/legacy status must hide.
t("A3 empty-string status hidden", isPublishedPost(item({ status: "" })), false);
t("A4 wrong-case Published hidden", isPublishedPost(item({ status: "Published" })), false);
t("A5 typo 'publish' hidden", isPublishedPost(item({ status: "publish" })), false);
t("A6 unknown 'archived' hidden", isPublishedPost(item({ status: "archived" })), false);

/* ----------------------------------------- Part B — the list selector */
// A draft, a published, and an "" entry — only the published one survives.
const mixed = [
  item({ slug: "draft-one", status: "draft", date: "2026-07-09" }),
  item({ slug: "live-one", status: "published", date: "2026-07-08" }),
  item({ slug: "legacy-empty", status: "", date: "2026-07-10" }),
];
t("B1 only published survives the mix",
  selectPublishedPostsNewestFirst(mixed).map((p) => p.slug), ["live-one"]);

// Newest first by ISO date (lexical), across several published posts.
const many = [
  item({ slug: "jun-30", status: "published", date: "2026-06-30" }),
  item({ slug: "jul-22", status: "published", date: "2026-07-22" }),
  item({ slug: "jul-14", status: "published", date: "2026-07-14" }),
];
t("B2 published sort newest-first",
  selectPublishedPostsNewestFirst(many).map((p) => p.slug), ["jul-22", "jul-14", "jun-30"]);

// Tie on date -> stable slug order.
const tied = [
  item({ slug: "beta", status: "published", date: "2026-07-14" }),
  item({ slug: "alpha", status: "published", date: "2026-07-14" }),
];
t("B3 same-date tie breaks by slug",
  selectPublishedPostsNewestFirst(tied).map((p) => p.slug), ["alpha", "beta"]);

t("B4 empty input -> []", selectPublishedPostsNewestFirst([]), []);
t("B5 all-draft input -> []",
  selectPublishedPostsNewestFirst([item({ status: "draft" }), item({ status: "" })]), []);

// The selector must not mutate its input (it .slice()s before sorting).
const input = [
  item({ slug: "a", status: "published", date: "2026-01-01" }),
  item({ slug: "b", status: "published", date: "2026-12-31" }),
];
const before = input.map((p) => p.slug);
selectPublishedPostsNewestFirst(input);
t("B6 input array not mutated", input.map((p) => p.slug), before);

/* ----------------------------------------- Part C — mapper coalescing */
t("C1 absent fields coalesce to empty",
  mapBlogListItem("my-post", {}),
  { slug: "my-post", title: "my-post", dek: "", date: "", topic: "", status: "", heroImage: null });

t("C2 slug field as { value }",
  mapBlogListItem("fallback", { title: { value: "Real Title" } }).title, "Real Title");

t("C3 slug field as bare string",
  mapBlogListItem("fallback", { title: "Plain Title" }).title, "Plain Title");

t("C4 heroImage passes through",
  mapBlogListItem("p", { heroImage: "/images/blog/p/hero.webp" }).heroImage,
  "/images/blog/p/hero.webp");

t("C5 full entry maps every field",
  mapBlogListItem("data-tables", {
    title: { value: "What a data table teaches you" },
    dek: "Nobody trusts a number they can't trace.",
    date: "2026-07-24",
    topic: "Enterprise UX",
    status: "published",
    heroImage: "/images/blog/data-tables/hero.webp",
  }),
  {
    slug: "data-tables",
    title: "What a data table teaches you",
    dek: "Nobody trusts a number they can't trace.",
    date: "2026-07-24",
    topic: "Enterprise UX",
    status: "published",
    heroImage: "/images/blog/data-tables/hero.webp",
  });

console.log(`\nblog-status-filter result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
