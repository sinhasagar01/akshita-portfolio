// THE HERO'S CONTRACT-COPY FLAG, AND THE ONE STATE IT MUST NEVER REACH.
// Run: node --experimental-strip-types ralph/tests/hero-contract-copy.mjs
//
// ⚠ WHAT THIS GUARDS IS AN ACCEPTED STATE NOBODY REMEMBERS, WHICH IS THIS RECORD'S MOST EXPENSIVE
// SHAPE. `USE_CONTRACT_COPY` makes the hero draw `docs/hero-ash-contract.html`'s words and IGNORE
// the CMS. That is correct while the layout is being reviewed and wrong the moment it is public:
// measured on the branch that introduced it, 50 of the hero's 51 owner-editable fields were
// editable in /studio WITH NO EFFECT ON THE PAGE. Only `heroCopy` survived, because it is read
// outside the flag.
//
// ⚠ AND "42 of 43" WAS THE FIRST NUMBER WRITTEN HERE AND IT WAS WRONG — `C1` caught it on its first
// run, which is the denominator rule paying for itself inside the gate that states the denominator.
// Twelve fields per tab (label, headline, support, three callouts, three stats of value plus unit)
// is 48, not 40; the 40 is `hero-tabs` C1a's count of the fields the migration ADDED, and it was
// read as the total. 48 plus the three top-level slots is 51.
//
// ⚠ AND THE MEASUREMENT THAT FOUND IT NEARLY REPORTED THE OPPOSITE. A probe compared each rendered
// string against its CMS value and returned `live: true` for the scroll cue, the tab label and the
// headline — because the contract's words for tab one are IDENTICAL to the owner's. Three false
// passes out of five, agreeing for a reason that had nothing to do with the mechanism. The
// discriminating evidence was `heroRoleLabel`, the one field where the two texts differ, plus the
// support line and counters rendering while all forty CMS fields sit empty. AGREEMENT IS NOT
// EVIDENCE WHEN BOTH SIDES CAN COINCIDE, and that is why this suite reads the FLAG rather than
// diffing rendered text against content.
//
// ⚠ THE TRIGGER IS "ON main", NOT "true". A gate that fails whenever the flag is true would be red
// on the feature branch that legitimately carries it — a gate whose common failure is benign is one
// people learn to skip, which is the argument this repo already made against `continue-on-error`.
// So the subject is the TREE THAT WILL DEPLOY: main is what Vercel builds for production, so the
// flag being true and the commit being main's is the failure, and nothing before that is.
//
// ⚠ AND IT LIVES IN THE DEFAULT SUITE RATHER THAN IN `upstream.mjs`, DELIBERATELY. `upstream.mjs`
// reads the live deployment and would be the more literal subject — and `run.mjs` SKIPS it by name
// because it is network-bound, so CI never runs it. A gate for "nobody remembers" that nobody runs
// is the defect wearing the fix's clothes. This is network-free: it reads a local ref.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const git = (args) => {
  try { return execFileSync("git", args, { encoding: "utf8" }).trim(); } catch { return null; }
};

const HERO = "components/sections/HeroSection.tsx";
const src = read(HERO);

console.log("A · the flag exists and is readable — a zero here makes B vacuous");
/* ⚠ AGAINST THE DECLARATION, NOT AGAINST A MENTION. The file names the flag a dozen times in
 * prose; only the `const` line is the value, and a check that matched a comment would read the
 * documentation instead of the code. */
const decl = /^const USE_CONTRACT_COPY = (true|false);$/m.exec(
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
);
t("A1 the flag's declaration was located — without it B1 cannot fail for the reason it names",
  decl !== null, true);
const flagOn = decl?.[1] === "true";
console.log(`         USE_CONTRACT_COPY = ${decl?.[1] ?? "UNREADABLE"}`);

/* ⚠ AND THE FLAG MUST ACTUALLY GOVERN THE COPY, or A1 passes on a constant nothing reads — the
 * dead-token shape, arriving as a dead flag. Both branches are asserted present: the contract
 * source and the CMS merge. Deleting either would make the flag decorative. */
t("A2 …and it governs both branches — the contract source AND the CMS merge still exist",
  [/USE_CONTRACT_COPY\s*$/m.test(src) || /USE_CONTRACT_COPY\s*\n?\s*\?/.test(src),
   /CONTRACT\.tabs/.test(src), /cms\?\.label\?\.trim\(\)/.test(src)],
  [true, true, true]);

console.log("\nB · and it is FALSE on the tree that deploys");
/* WHAT REDDENS THIS: merging the hero to main with the flag still true. Nothing else. On a feature
 * branch it is silent by design — see the header.
 *
 * ⚠ THE ANSWER "I COULD NOT TELL" IS NEVER A PASS. `git rev-parse` prints nothing for an unknown
 * ref and `execFileSync` throws, so an unresolvable `origin/main` returns null — and null read as
 * "not on main" would make this gate report success from a broken instrument, which is `A0`'s
 * archetype in `upstream.mjs`. It is reported UNVERIFIED and counted as a failure instead. */
const head = git(["rev-parse", "HEAD"]);
const originMain = git(["rev-parse", "origin/main"]);
const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);

t("B0 HEAD resolves — the comparison below has a left-hand side", head !== null, true);

if (originMain === null && branch !== "main") {
  t("B1 ⚠ UNVERIFIED — origin/main does not resolve and HEAD is not main, so 'is this the deploying tree' is UNANSWERABLE rather than false",
    "UNVERIFIED", "ANSWERABLE");
} else {
  /* Squash-merge safe: a squash makes a NEW commit, so a feature branch is never an ancestor of
   * main. The question is not "was this merged" but "IS this main", which equality answers. */
  const isDeployingTree = branch === "main" || (originMain !== null && head === originMain);
  console.log(`         branch=${branch}  head=${head?.slice(0, 7)}  origin/main=${originMain?.slice(0, 7) ?? "unresolved"}  deployingTree=${isDeployingTree}`);
  t("B1 ⚠ THE CONTRACT-COPY FLAG IS NOT TRUE ON THE TREE THAT DEPLOYS — 50 of the hero's 51 editable fields are inert while it is",
    isDeployingTree && flagOn ? "FLAG IS TRUE ON main" : "ok", "ok");
}

/* ⚠ AND THE GUARD MUST BE ABLE TO FIRE, or B1 passes because the predicate is wrong rather than
 * because the flag is off. Proved against a synthetic pair rather than against the real values —
 * a guard whose expectation is computed from its own subject cannot fail when the subject moves,
 * which this repo has on record three times. */
const fires = (onMain, on) => (onMain && on ? "FLAG IS TRUE ON main" : "ok");
t("B2 …and the predicate returns the failure string for exactly one of the four states, against literals",
  [fires(true, true), fires(true, false), fires(false, true), fires(false, false)],
  ["FLAG IS TRUE ON main", "ok", "ok", "ok"]);

console.log("\nC · the inert set is named, so the cost of the flag is not folklore");
/* The count is what makes the header's claim checkable. `heroCopy` is read OUTSIDE the flag and is
 * the one live field; the eyebrow, the cue and the four tabs' twelve fields each are bypassed. */
const tabFieldsPerTab = 1 /* label */ + 1 /* headline */ + 1 /* support */ + 3 /* callouts */ + 6 /* stats value+unit */;
t("C1 the hero's editable-field count is 51 — one live, fifty inert while the flag is on",
  1 /* heroCopy */ + 1 /* heroRoleLabel */ + 1 /* heroScrollCue */ + 4 * tabFieldsPerTab, 51);
t("C1a …and heroCopy is read outside the flag, which is what makes it the one that survives",
  /const signature = heroCopy\?\.trim\(\)/.test(src) && !/USE_CONTRACT_COPY[\s\S]{0,80}signature/.test(src), true);

console.log(`\nhero-contract-copy result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
