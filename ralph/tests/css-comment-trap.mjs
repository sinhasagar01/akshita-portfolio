// css-comment-trap — no utility may reach the public stylesheet because a COMMENT names it.
//
// ---- THE DEFECT THIS EXISTS FOR -------------------------------------------------------------
//
// #273 deleted an inert `min-h` floor from the studio's loading state. The class came out of the
// JSX, the build ran, and the bundle hash DID NOT MOVE — because the comment explaining the
// deletion spelled the class out, and Tailwind's scanner reads source as PLAIN TEXT. It has no
// concept of a comment. Naming a utility in prose emits it exactly as writing it in `className`
// does.
//
// THE BUILD CAUGHT THAT ONE AND RALPH COULD NOT, which is the whole reason this suite exists.
// Every other suite here reads source through `code()`, which STRIPS comments before matching —
// the durable rule this project wrote after the comment trap fired ten times. That rule is right
// and it is also exactly why ralph was blind here: stripping comments makes YOUR parser honest
// and does nothing about SOMEONE ELSE'S. Tailwind is someone else's.
//
// ---- WHY IT COSTS ANYTHING AT ALL ------------------------------------------------------------
//
// Tailwind v4 emits ONE stylesheet, and the public home page links the same chunk /studio does.
// So a class named only in a studio comment is downloaded by every visitor to the site and
// matches nothing on any page they can reach. The audit that followed #273 found 12 of these
// already in the repo, 439 raw bytes, including `invert` — which came from the word "invert" in a
// FLIP-animation comment and emitted a real `filter: invert()` rule.
//
// ---- WHY THE ORACLE IS TAILWIND ITSELF, NOT A PATTERN ----------------------------------------
//
// The hard part is telling a class from a word. `isolate`, `invert`, `ordinal` and `shrink` are
// ordinary English AND real utilities; `precisely`, `seam` and `because` are only English. No
// regex knows the difference, and a hand-kept list of utility names would be a second copy of
// Tailwind's namespace that goes stale the first time it is upgraded.
//
// So this asks TAILWIND. For each candidate that appears only inside comments, it compiles the
// project's real stylesheet with that candidate and checks whether any CSS came out. Prose
// produces nothing and a utility produces a rule, decided by the same engine that builds the
// site. Verified both directions before shipping: `the`, `because`, `precisely`, `seam`,
// `default` and `definitely-not-a-class` all produce zero bytes; `invert`, `isolate`, `z-1`,
// `h-20` and `lg:w-[236px]` all produce rules.
//
// ---- THE PRICE, STATED, BECAUSE IT IS PAID IN PROSE ------------------------------------------
//
// Some Tailwind utilities are ORDINARY ENGLISH WORDS. `shadow`, `invisible`, `rounded`, `shrink`,
// `invert`, `isolate` and `ordinal` all emit real CSS, so this suite forbids writing any of them
// bare in a comment — and the comments are the most valuable thing in this repo. Twenty-two
// existing sentences had to be reworded to turn it green, including "(149.7px) rounded up", which
// was ARITHMETIC and had nothing to do with a border radius. That one is the honest low point of
// the rule and it is recorded rather than hidden.
//
// THE NUMBER IS 2,623 RAW AND 378 BROTLI, MEASURED ON THE BUILT BUNDLE — and the first number
// this comment carried was 6,160 raw / 904 brotli, which was WRONG BY 2.4x. That figure came from
// compiling each trapped token ALONE against an empty baseline, where every one of them re-emits
// the shared `@property` blocks and `--tw-*` defaults it needs. In the real stylesheet that
// infrastructure is already there for utilities that ARE used, so removing the trapped class
// removes only its own rule. Isolated cost is not marginal cost, and only the build diff knows
// the difference. Recorded because the wrong number was in this file first.
//
// AND ONE RULE BEATS TWO. The tempting compromise is to enforce only the class-shaped tokens,
// where there is no prose cost — but that is a judgment call at every future comment, and it
// gives up 70% of the bytes. Substitutes exist for every banned word (`box-shadow`, `unseen`,
// `curved`, `contract`), so the rule is uniform: describe the value, never spell it.
//
// ---- WHAT IT DELIBERATELY DOES NOT DO --------------------------------------------------------
//
// It does not read `.next`. A gate that needs a production build cannot run in CI beside the
// others, and one that silently skips when the build is missing is the false-pass shape this
// runner already refuses. Compiling from source means it holds whether or not anything is built.
import fs from "node:fs";
import path from "node:path";
import { compile } from "tailwindcss";
import { Scanner } from "@tailwindcss/oxide";

const ROOT = process.cwd();
let failures = 0;
let passes = 0;
const t = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passes++; else failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${ok ? "" : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`}`);
};

/* ---- the source set. The same surfaces Tailwind scans, minus what globals.css already excludes
   with `@source not`. `ralph` and `docs` are excluded THERE for this exact reason, which is why
   this suite may spell a class in its own prose and a component may not. */
/* `.css` IS IN THIS LIST AND IT IS THE ONE THAT WAS MISSED FIRST. The scanner reads the
   stylesheet's own file too, so a CSS comment naming a utility emits it exactly as a TSX comment
   does. Found the hard way: `.invisible{visibility:hidden}` survived the first green run of this
   suite, and its only three occurrences in the entire repo were prose inside globals.css. A gate
   that reads a narrower set of files than the tool it is checking is a gate with a blind spot the
   shape of the difference. */
const EXTS = new Set([".tsx", ".ts", ".jsx", ".js", ".mdx", ".md", ".css"]);
const SKIP = new Set([".next", "node_modules", ".git", "public", "ralph", "docs", ".vercel", "scripts"]);
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXTS.has(path.extname(e.name))) files.push(p);
  }
})(ROOT);

t("A1: the source sweep found files to read — a zero denominator is not a pass",
  files.length > 50, true);

/* ---- EXTRACTION IS TAILWIND'S OWN SCANNER, NOT A REGEX -------------------------------------
 * A hand-rolled tokeniser was tried first and it had a hole, which is the argument for this.
 * Its character class included `.` and `,`, so "nearly invisible." yielded `invisible.` and the
 * check never asked about `invisible`. The suite went green while `.invisible{visibility:hidden}`
 * sat in the shipped bundle — a FALSE PASS, the exact failure this runner refuses everywhere else.
 * The real defect was subtler still: oxide splits at the variant separator, so `invisible:` in
 * "was also invisible: both panels" produces the candidate `invisible`, while a period or comma
 * after the same word produces nothing. No regex I would have written encodes that, and guessing
 * at it is how the hole got there.
 * So both halves now come from Tailwind — oxide decides what a candidate IS, and the compiler
 * decides which candidates are REAL. Nothing in between is mine to get wrong. */
const scanOf = (content, ext) => new Set(new Scanner({ sources: [] }).scanFiles([{ content, extension: ext }]));
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const commentOnly = new Map(); // candidate -> first file that names it
const everInCode = new Set();
const perFile = [];
for (const f of files) {
  const ext = path.extname(f).slice(1);
  const raw = fs.readFileSync(f, "utf8");
  const inCode = scanOf(stripComments(raw), ext);
  for (const c of inCode) everInCode.add(c);
  perFile.push([path.relative(ROOT, f), scanOf(raw, ext), inCode]);
}
for (const [rel, all, inCode] of perFile) {
  for (const c of all) if (!inCode.has(c) && !commentOnly.has(c)) commentOnly.set(c, rel);
}
// A candidate written in one file's comment is fine if another file really uses it.
for (const c of [...commentOnly.keys()]) if (everInCode.has(c)) commentOnly.delete(c);

t("A2: comment-only candidates were actually collected — the extractor is not returning nothing",
  commentOnly.size > 0, true);

/* ---- ask Tailwind which of them are real ---- */
const cssEntry = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
const mkCompiler = () =>
  compile(cssEntry, {
    base: path.join(ROOT, "app"),
    loadStylesheet: async (id, base) => {
      const p = id === "tailwindcss"
        ? path.join(ROOT, "node_modules/tailwindcss/index.css")
        : path.resolve(base, id);
      return { path: p, base: path.dirname(p), content: fs.readFileSync(p, "utf8") };
    },
    loadModule: async () => ({ module: {}, base: "" }),
  });

const baseline = (await mkCompiler()).build([]).length;
/* A WHOLE BATCH AT ONCE, because the answer for a green tree is one compile rather than twelve
   thousand. Asking per candidate cost 65 SECONDS on this repo and would have made the suite the
   slowest of the 47 by two orders of magnitude — a gate nobody wants to run is a gate that gets
   skipped. */
const emits = async (cands) => (await mkCompiler()).build(cands).length > baseline;

/* THE CONTROL PAIR RUNS FIRST, and it is not ceremony. If the compile ever returns the same
   length for everything — a changed API, a stylesheet that failed to load — every check below
   would report "no trapped classes" and the suite would pass having tested nothing. This is the
   rasteriser's white/black sanity pair in a different tool. */
t("A3: the oracle is live — a real utility compiles to CSS", await emits(["z-1"]), true);
t("A4: …and prose does not", await emits(["definitely-not-a-class-at-all"]), false);

/* Bisect only when the batch says something is in there. Clean tree: ONE compile. Dirty tree:
   about k·log(n), paid only when there is a real finding to name — and naming it is the point,
   since "something in 12,000 candidates emits CSS" is not an actionable failure message. */
async function bisect(list) {
  if (list.length === 0 || !(await emits(list.map((x) => x[0])))) return [];
  if (list.length === 1) return [`${list[0][0]}  (${list[0][1]})`];
  const mid = list.length >> 1;
  return [...(await bisect(list.slice(0, mid))), ...(await bisect(list.slice(mid)))];
}
const trapped = await bisect([...commentOnly.entries()]);

/* THE MESSAGE HAS TO SAY WHAT TO DO, or this becomes the gate people disable. A bare failure
   list reads as "these words are banned" with no reason and no fix. */
if (trapped.length) {
  console.log(
    `\n        Each token below is named in a COMMENT and used in no className anywhere, yet it\n` +
    `        compiles to real CSS that ships in the stylesheet the public site downloads.\n` +
    `        FIX: reword the comment to describe the value instead of spelling the class —\n` +
    `        \`box-shadow\` not \`shadow\`, "unseen" not "invisible", "curved" not "rounded",\n` +
    `        "a 10px left pad" not \`pl-[10px]\`. Do not add the class to the markup to satisfy it.\n`
  );
}
t("A5: no utility reaches the stylesheet only because a comment names it",
  trapped.sort(), []);

/* ⚠ THE PASS COUNT IS DERIVED. It was a LITERAL — `${50 - failures}` — and on main this suite
 * printed 58 rows while claiming 50, understating `ralph/run.mjs`'s headline figure by eight for
 * however long. A number that must be edited by hand every time a row is added is a number that
 * silently stops describing its subject, which is this repository's oldest recurring defect
 * arriving in a suite's own summary line.
 *
 * Two of the three suites carrying this shape happened to be CORRECT when it was found. That is
 * not a reason to leave them: correct-today-by-coincidence is how the third one got here. */
console.log(`\ncss-comment-trap result: ${passes} passed, ${failures} failed` +
  `  ·  ${files.length} files, ${commentOnly.size} comment-only candidates tested`);
process.exit(failures === 0 ? 0 : 1);
