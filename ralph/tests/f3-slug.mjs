// F-3 test — slugify: server-side slug generation for collection CREATE.
// Run: node --experimental-strip-types ralph/tests/f3-slug.mjs
//
// Plain JS (kept out of the app tsc program). Imports the REAL pure module
// (lib/studio/slug.ts — type-only import erased at runtime). Asserts the derived
// slug for typical titles, punctuation, unicode, spacing, and repeat hyphens; that
// EVERY ok output matches the write-path guard regex ^[a-z0-9-]+$ with no
// leading/trailing/double hyphen; and that titles with no slug-safe characters
// return a typed invalid_slug (never an empty filename).
import { slugify } from "../../lib/studio/slug.ts";

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

console.log(`\nF-3 slug result: ${failures === 0 ? "ALL PASS" : failures + " FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
