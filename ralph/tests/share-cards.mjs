// EVERY PUBLIC PAGE EMITS A SHARE CARD. The build-level fact, and it is here because a change I made
// in the same PR silently removed it from three pages.
// Run: node --experimental-strip-types ralph/tests/share-cards.mjs   (needs a production build)
//
// ---- ⚠ THE DEFECT THIS EXISTS FOR, MEASURED RATHER THAN IMAGINED --------------------------------
//
// The site's own card moved from a static PNG to a generated one. The first attempt used Next's
// `opengraph-image` FILE CONVENTION and deleted the three hand-spelled URLs that home, blog and
// gallery carried — on the theory that the convention would supply them. IT DOES NOT.
//
// Next merges metadata per TOP-LEVEL FIELD, so a page that declares its own `openGraph` object
// replaces the parent's whole object, including the `images` a convention file injected. Read off a
// real build:
//
//     /            og:image ABSENT      declares openGraph
//     /blog        og:image ABSENT      declares openGraph
//     /gallery     og:image ABSENT      declares openGraph
//     /palettes    og:image present     declares none, inherits
//     /oklch       og:image present     declares none, inherits
//
// ⚠ AND `twitter:image` SURVIVED ON ALL FIVE, which is what made it easy to miss. Those pages no
// longer declared a `twitter` object, so the twitter convention filled in — a page with a Twitter
// card and no Open Graph card previews correctly in one tool and blank in another. An asymmetric
// failure reads as a working feature from whichever side you check first.
//
// ⚠ SO THE THREE URLS THAT LOOKED REDUNDANT WERE LOAD-BEARING. They existed because the convention
// cannot reach a page that declares `openGraph`. The card is a route with a stable URL now and the
// URL lives in one helper, which is what lets four metadata objects name it.
//
// ---- ⚠ WHY THE SUBJECT IS THE BUILT HTML AND NOT THE SOURCE -------------------------------------
//
// Every part of this was correct in source. The route rendered, the helper returned a URL, the pages
// compiled. What was wrong was the RESOLUTION of four metadata objects against each other, which no
// regex over `app/` can see — the same reason `rendered-theme` reads `.next` rather than the layout.
// A source assertion says the code intends to emit a card. This says the bytes carry one.
import { readFileSync, readdirSync, existsSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);

const APP = ".next/server/app";
if (!existsSync(url(APP))) {
  console.log("  NOT RUNNABLE — no production build. Run `npm run build` first.");
  console.log("\n0 passed, 0 failed (skipped)");
  process.exit(0);
}

const pages = [];
const walk = (rel) => {
  for (const e of readdirSync(url(rel), { withFileTypes: true })) {
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child);
    else if (e.name.endsWith(".html")) pages.push(child);
  }
};
walk(APP);

/* ⚠ THE DEV HARNESS ROUTES AND THE ERROR PAGES ARE EXCLUDED BY PROPERTY, NOT BY NAME. `/dev/*` 404s
 * under `next start` and an error boundary is not a shareable page — neither is a URL anybody sends
 * to anybody. A named list would decay the moment a route was added; `route-coverage` records the
 * same rule for its own subject and states it as a property for the same reason. */
const shareable = pages.filter((p) => !/\/dev\/|_not-found|\/error\b/.test(p));

console.log("\nA · the subject is real — a build with no pages is not a pass");
t("A1 the walk found prerendered HTML at all, against a literal", pages.length >= 10, true);
t("A2 …and a real population of shareable pages after the exclusions", shareable.length >= 8, true);
/* ⚠ THE EXCLUSION MUST HAVE MEMBERS TOO. An exclusion that matches nothing is a filter nobody
 * needs, and one that matches everything is a gate that has quietly stopped requiring anything —
 * this record carries both directions. */
t("A3 …and the exclusion actually excludes something, so it is a rule rather than decoration",
  pages.length > shareable.length, true);

console.log("\nB · ⚠ EVERY SHAREABLE PAGE CARRIES A CARD, AND THE TWO TAGS NAME ONE IMAGE");
const missing = [];
const disagree = [];
for (const p of shareable) {
  const html = readFileSync(url(p), "utf8");
  const short = p.replace(`${APP}/`, "") || "index.html";
  const og = (/property="og:image"\s+content="([^"]+)"/.exec(html) ?? [])[1] ?? null;
  const tw = (/name="twitter:image"\s+content="([^"]+)"/.exec(html) ?? [])[1] ?? null;
  if (!og) missing.push(`${short} og:image`);
  if (!tw) missing.push(`${short} twitter:image`);
  if (og && tw && og !== tw) disagree.push(`${short} og ${og} vs twitter ${tw}`);
}
console.log(`         ${shareable.length} shareable pages checked, ${pages.length - shareable.length} excluded`);
t("B1 ⚠ NO SHAREABLE PAGE IS MISSING EITHER CARD TAG — three were missing `og:image`, and a convention file cannot reach a page that declares its own openGraph",
  missing.sort(), []);
/* ⚠ B2 WAS "AND NONE IS MISSING `twitter:image`", AND IT COULD NOT FAIL WHILE B1 PASSED. Two
 * mutations proved it: removing the layout's `twitter.images`, and giving a page a `twitter` object
 * with no images. Both left it GREEN, because Next DERIVES `twitter:image` from `openGraph.images`
 * whenever a page has them. Asserting both tags present is asserting one thing twice.
 *
 * ⚠ THE ASYMMETRY IN THE ORIGINAL DEFECT CAME FROM A SECOND CONVENTION FILE, NOT FROM A FALLBACK.
 * `twitter-image.png` supplied that tag directly, which is why it survived while `og:image` vanished.
 * There is no twitter convention file now, so that particular divergence is structurally gone — and
 * a row guarding a state the architecture no longer has is documentation wearing an assertion's
 * clothes, which this record keeps a register of.
 *
 * WHAT IS STILL FALSIFIABLE IS AGREEMENT. A future page can hand-supply a different `twitter.images`
 * and the two tags drift — the shape `lib/site.ts` records for the article page, which once spelled
 * one URL twice so og and twitter were two literals that happened to agree. */
t("B2 ⚠ …AND THE TWO TAGS NAME THE SAME IMAGE — twitter is DERIVED from openGraph, so a hand-supplied second URL is the only way they can diverge",
  disagree.sort(), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
