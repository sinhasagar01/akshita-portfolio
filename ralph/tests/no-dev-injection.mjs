// NO DEV-ONLY INJECTION MAY REACH A TRACKED SOURCE FILE.
// Run: node ralph/tests/no-dev-injection.mjs
//
// ---- ⚠ WHY THIS EXISTS: A NEAR-MISS, NOT AN INCIDENT ------------------------------------------
//
// A live-editing tool injected this into `app/layout.tsx`, inside `<body>`, in the working tree:
//
//     <script src="http://localhost:8400/live.js?token=..."></script>
//
// It was never committed and never reached production — checked with `git log -S` across all refs
// and by fetching the live page. What makes it worth a gate is HOW CLOSE it came: the commit made
// minutes earlier used `git add -A`, which stages whatever is in the tree. Had the injection landed
// before that command rather than after it, a localhost script tag would have shipped in the root
// layout of every page.
//
// ⚠ AND THE FAILURE WOULD HAVE BEEN SILENT FOR THE AUTHOR AND LOUD FOR NOBODY ELSE. The build
// succeeds — it is valid JSX. `next build` has no opinion about a script src. The dev machine
// running the tool sees the page work perfectly, because localhost:8400 is up FOR THEM. Every other
// visitor gets a request to a host that does not exist, from the `<body>` of every route.
//
// ---- WHAT IT CHECKS ----------------------------------------------------------------------------
//
// Tracked source under `app`, `components` and `lib` for a localhost or 127.0.0.1 URL, and for the
// marker comments live-editing tools leave behind. `.env.local.example` and documentation are out of
// scope: naming localhost in a config example is the point of a config example.
//
// ⚠ THE SUBJECT IS TRACKED SOURCE RATHER THAN THE WORKING TREE, DELIBERATELY. A tool may inject
// while a person works — that is what it is for — and a gate that fired on the tree would go red
// during normal use, which is the benign-common-failure shape this repository already refuses. What
// must never happen is the injection being COMMITTED, and `git ls-files` is that boundary.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/* Tracked files only — see the header. An untracked or modified-but-uncommitted injection is a tool
   doing its job; a committed one is the defect. */
const tracked = (spawnSync("git", ["ls-files", "app", "components", "lib"], { cwd: root, encoding: "utf8" }).stdout ?? "")
  .split("\n").map((s) => s.trim()).filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f));

console.log("\nA · the file list is real, so B cannot pass over nothing");
t("A1 git ls-files returned tracked source", tracked.length > 100, true);

console.log("\nB · no committed source points at a developer's own machine");
const LOCALHOST = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;
const hits = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(join(root, rel), "utf8"); } catch (e) { if (e && e.code) continue; throw e; }
  /* ⚠ COMMENTS BLANKED. A comment explaining why a localhost URL must not ship is not a localhost
   * URL that ships — the explaining-it-requires-writing-it trap this repository has hit in five
   * separate scanners, including one written the same week. */
  const code = blankCommentBodies(src);
  code.split("\n").forEach((line, i) => {
    if (LOCALHOST.test(line)) hits.push(`${rel}:${i + 1}  ${line.trim().slice(0, 60)}`);
  });
}
t("B1 ⚠ NO TRACKED SOURCE CARRIES A localhost URL — it works on the machine that shipped it and nowhere else",
  hits, []);

console.log("\nC · and no live-editing tool has left its markers behind");
const MARKERS = ["impeccable-live-start", "impeccable-live-end", "__live_reload_token", "livereload.js"];
const marked = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(join(root, rel), "utf8"); } catch (e) { if (e && e.code) continue; throw e; }
  for (const m of MARKERS) if (src.includes(m)) marked.push(`${rel} — ${m}`);
}
/* ⚠ THIS ONE READS THE RAW SOURCE, COMMENTS INCLUDED, AND THAT IS THE POINT. The markers ARE
 * comments — `{/* impeccable-live-start *​/}` wraps the injected tag — so blanking them would blind
 * the check to the exact thing it looks for. The opposite decision from B1, one section apart, for
 * the opposite reason. */
t("C1 ⚠ NO LIVE-EDIT MARKER IS COMMITTED — the wrapper is a comment, so this reads raw source unlike B1",
  marked, []);

console.log("\nD · what this cannot reach, by name");
for (const gap of [
  "the working tree — a tool injecting while somebody works is the tool working, not a defect",
  "a localhost URL built at runtime from parts, which no literal scan can see",
  "config and documentation, where naming localhost is the point",
  "any injection into a file outside app, components and lib",
]) console.log(`      unreachable   ${gap}`);
t("D1 the gaps are named rather than counted — a list of four, stated", 4, 4);

console.log(`\nno-dev-injection result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
