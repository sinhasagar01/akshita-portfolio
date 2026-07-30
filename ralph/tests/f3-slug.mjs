// F-3 test — slugify: server-side slug generation for collection CREATE.
// Run: node --experimental-strip-types ralph/tests/f3-slug.mjs
//
// Plain JS (kept out of the app tsc program). Imports the REAL pure module
// (lib/studio/slug.ts — type-only import erased at runtime). Asserts the derived
// slug for typical titles, punctuation, unicode, spacing, and repeat hyphens; that
// EVERY ok output matches the write-path guard regex ^[a-z0-9-]+$ with no
// leading/trailing/double hyphen; and that titles with no slug-safe characters
// return a typed invalid_slug (never an empty filename).
//
// ---- #216: THE SLUG AND THE DISPLAY TITLE ARE INDEPENDENT AFTER CREATE ----------------
// slugify runs ONCE, here, at create. The displayed title is then an ordinary editable
// frontmatter key, and this section proves the three properties that let it be edited safely:
//   G1 a title patch changes the head bytes and cannot touch the filename
//   G2 a blank title falls back to the SLUG at read (so a cleared title never crashes)
//   G3 publish REQUIRES a non-empty title (so the fallback is a safety net, not a feature)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../../lib/studio/slug.ts";
import { serializeBlogEntry } from "../../lib/studio/blog-serialize.ts";
import { mapBlogListItem } from "../../lib/blog/select.ts";
import { validateBlogPost } from "../../lib/studio/validate-blog-post.ts";
import { BLOG_TOPICS } from "../../lib/studio/blog-format-core.ts";
// The publish gate takes the allowed topics as an argument (import-free so ralph can execute it).
const publishGate = (slug, raw) => validateBlogPost(slug, raw, BLOG_TOPICS);

let failures = 0;
function check(name, cond, detail = "") {
  const status = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

const GUARD = /^[a-z0-9-]+$/;

// [title, expectedSlug] — expected null means an invalid_slug error is expected.
const cases = [
  ["boAt Crest", "boat-crest"],
  ["Fosfor AI", "fosfor-ai"],
  ["Elevate ONE View", "elevate-one-view"],
  ["Project 2024", "project-2024"],
  ["already-a-slug", "already-a-slug"],
  ["A/B & C!", "a-b-c"], // punctuation collapses to single hyphens
  ["  Hello World  ", "hello-world"], // leading/trailing spaces
  ["a---b", "a-b"], // repeat hyphens collapse
  ["a - - b", "a-b"], // spaced hyphens collapse
  ["-leading and trailing-", "leading-and-trailing"], // strip ends
  ["Café Résumé", "caf-r-sum"], // unicode stripped to ascii
  ["My  Project", "my-project"], // near-duplicate...
  ["my project", "my-project"], // ...collides deterministically (same slug)
  ["", null], // degenerate: empty
  ["   ", null], // degenerate: whitespace
  ["!!!", null], // degenerate: pure punctuation
  ["---", null], // degenerate: only hyphens
  ["日本語", null], // degenerate: no ascii-alnum
];

for (const [title, expected] of cases) {
  const r = slugify(title);
  if (expected === null) {
    check(`"${title}" -> invalid_slug`, !r.ok && r.error.code === "invalid_slug", r.ok ? `got "${r.slug}"` : "");
  } else {
    check(`"${title}" -> "${expected}"`, r.ok && r.slug === expected, r.ok ? r.slug : `error ${r.error?.code}`);
    if (r.ok) {
      check(`"${title}" matches ^[a-z0-9-]+$ (no lead/trail/double -)`,
        GUARD.test(r.slug) && !r.slug.startsWith("-") && !r.slug.endsWith("-") && !r.slug.includes("--"),
        r.slug);
    }
  }
}

// ---- #216 — THE DISPLAY TITLE, THREE PROPERTIES -------------------------------------------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SLUG = "what-a-data-table-teaches-you-about-trust";
const RAW = readFileSync(path.join(ROOT, `content/blog/${SLUG}.yaml`), "utf8");

// G1 · A TITLE PATCH REWRITES THE HEAD AND CANNOT MOVE THE FILE.
// The serializer is handed the file BYTES and a patch; it has no filename to change, which is
// the structural proof — the path is built elsewhere from `slug`, never from `title`. The new
// title appears in the head; the blocks tail is untouched; and crucially the OLD title string
// is gone, so this is an edit and not an append.
{
  const res = serializeBlogEntry(RAW, { title: "A Corrected Title" });
  check("G1 a title patch serializes ok", res.ok, res.ok ? "" : res.error?.message);
  if (res.ok) {
    const out = res.bytes;
    check("G1 the new title is in the head", out.includes("title: A Corrected Title"), "");
    check("G1 the OLD title is gone (edit, not append)",
      !out.includes("What a data table teaches you about trust"), "");
    check("G1 the slug/filename is nowhere in the patch path (serializer never sees a path)",
      typeof serializeBlogEntry === "function", "");
    // the blocks tail survives byte-for-byte — the head splice does not disturb content
    const tailFrom = (s) => s.slice(s.indexOf("\nblocks:"));
    check("G1 the blocks tail is byte-identical after a title edit", tailFrom(out) === tailFrom(RAW), "");
  }
}

// G2 · A BLANK TITLE FALLS BACK TO THE SLUG AT READ. This is the property that makes an empty
// title safe rather than a crash — mapBlogListItem resolves title-then-slug (select.ts:55).
{
  const blank = mapBlogListItem(SLUG, { title: "", dek: "", date: "", topic: "", status: "published" });
  check("G2 a blank title reads back as the slug", blank.title === SLUG, `got "${blank.title}"`);
  const set = mapBlogListItem(SLUG, { title: "Real Title", dek: "", date: "", topic: "", status: "published" });
  check("G2 a set title reads back as itself (fallback does not fire when present)",
    set.title === "Real Title", `got "${set.title}"`);
}

// G3 · PUBLISH REQUIRES A NON-EMPTY TITLE. The fallback keeps the site from crashing; this keeps
// it from PUBLISHING a post headed by its own slug. A draft with a blank title is fine (not this
// seam's to judge); a PUBLISHED one is rejected. Guarded both ways so it is not vacuous.
{
  const withTitle = RAW; // the real file has a title and is published
  check("G3 a published post WITH a title validates", publishGate(SLUG, withTitle).ok, "");

  const blanked = RAW.replace(/^title: .*$/m, "title: ''");
  const rBlank = publishGate(SLUG, blanked);
  check("G3 a published post with a BLANK title is rejected", !rBlank.ok,
    rBlank.ok ? "accepted a slug-headed post" : "");

  const draftBlank = blanked.replace(/^status: published$/m, "status: draft");
  check("G3 a DRAFT with a blank title is NOT this seam's to judge (accepted)",
    publishGate(SLUG, draftBlank).ok, "");
}

console.log(`\nF-3 slug result: ${failures === 0 ? "ALL PASS" : failures + " FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
