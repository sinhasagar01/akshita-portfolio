import type { NextConfig } from "next";

/* ⚠ THE DEV SERVER AND THE GATES MUST NOT SHARE A BUILD DIRECTORY, AND THIS IS THE ONLY MECHANICAL
 * FIX FOR IT. Four suites read a PRODUCTION build — `colour-census` (`.next/static/css`),
 * `rendered-theme` (`.next/server/app`), `route-coverage` (the prerender manifest and the rendered
 * sitemap) and `css-comment-trap`. `next dev` wrote to the same `.next`, so a dev server started for
 * any reason silently replaced what those four read.
 *
 * ⚠ IT HAPPENED, AND THE COST WAS 20 RED ASSERTIONS ACROSS THREE SUITES that had nothing wrong with
 * them. An instrument condition wearing a code condition's clothes — the seventh in one session, and
 * the only one that recurs BY CONSTRUCTION rather than by somebody slipping.
 *
 * ⚠ AND "REMEMBER TO STOP THE SERVER FIRST" WAS ALREADY WRITTEN DOWN AND DID NOT HELP. That is this
 * repository's oldest lesson about rules: reaching for the wrong thing is faster than remembering,
 * which is why `mutate.mjs --edit` exists rather than a note about `git checkout`. ONLY A MECHANISM
 * PREVENTS A FAILURE MODE.
 *
 * `next dev` sets NODE_ENV=development and `next build` sets production, so the split is exactly
 * along the line that matters: nothing a dev server does can reach what the gates read, and
 * `next start` still serves the production directory it built.
 *
 * ⚠ VERCEL IS UNAFFECTED, ASSERTED RATHER THAN ASSUMED: it runs `next build`, which is production,
 * which is `.next`. The deployed output path does not move.
 *
 * ⚠ AND `next build` EDITS `tsconfig.json` AS A SIDE EFFECT, which this change made visible. It
 * added `.next-dev/types` to `include` and reformatted the file. That is Next's own behaviour and
 * not a choice made here — removing the entry only means the next build re-adds it and leaves a
 * dirty tree. It is committed for that reason. Worth knowing before anyone reads a `tsconfig.json`
 * diff and looks for the person who wrote it. */
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

  images: {
    formats: ["image/avif", "image/webp"],
  },
  // GH-12 — the /studio routes and the save-draft route are dynamic (cookie
  // gate), so on Vercel they run as serverless functions bundled from the
  // output file trace. The Keystatic local reader reads content/ via fs at
  // runtime, which static tracing cannot see, so without this the deployed
  // functions ship WITHOUT content and every /studio page renders empty.
  // Keys are picomatch globs matched against route paths. content/ is yaml and
  // mdoc text only (images live in public/), so the bundle cost is tiny.
  outputFileTracingIncludes: {
    "/studio{,/**}": ["./content/**/*"],
    "/api/studio/save-draft": ["./content/**/*"],
  },
};

export default nextConfig;
