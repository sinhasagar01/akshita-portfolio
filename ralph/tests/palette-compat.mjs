// The compatibility report is GENERATED, not stored — asserted as a property of the source.
// Run: node --experimental-strip-types ralph/tests/palette-compat.mjs
//
// ---- ⚠ WHAT THIS SUITE IS *NOT* FOR, WHICH DECIDED EVERY ROW IN IT ---------------------------
//
// It does NOT check the ratios. `theme-contrast` section P already computes every palette through
// the usage map and asserts P1 (no uncomputable row) and P2 (every row clears its floor), against
// a browser oracle covering all nine. A second suite recomputing those numbers would be a SECOND
// SPELLING of one claim — the thing this arc has spent four PRs removing — and the two would
// eventually disagree about which was authoritative.
//
// ⚠ SO THE SUBJECT HERE IS THE RULING RATHER THAN THE ARITHMETIC: the report is computed at build
// from each palette's own tokens, and is never checked in. A committed table is a stale manual
// boolean with more digits, which is precisely what the ruling forbade — and nothing in the numeric
// gates can see a table being pasted into a file.
//
// ⚠ AND THE UNCOMPUTABLE SET IS EMPTY, SO THERE IS NO NAMING MACHINERY AND NO ROW ASSERTING ONE.
// Measured through this exact path: 270 comparisons, 9 of 9 SHIPPABLE, zero uncomputable. What
// replaces the machinery is a THROW in the generator, so a pair that stops resolving fails the
// BUILD rather than entering an unbuilt path and rendering a blank. A3 is that throw's gate.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = new URL("../../", import.meta.url).pathname;
const MODULE = "lib/palettes/compatibility.ts";
const src = existsSync(join(root, MODULE)) ? readFileSync(join(root, MODULE), "utf8") : "";

/* ⚠ COMMENTS STRIPPED BEFORE ANY MATCH, because this file's prose deliberately quotes figures —
 * "270 comparisons", "9 of 9" — and a matcher that read them would report the explanation of the
 * rule as a violation of it. The same trap that fires on utility names in CSS comments. */
const code = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

console.log("\nA · the generator exists and computes rather than stores");
/* ⚠ ONE DENOMINATOR ROW, NOT TWO — AND THE SECOND WAS DELETED BEFORE IT SHIPPED. It read "the
 * module was found at all" beside this one, and it CANNOT FAIL WHILE THIS PASSES: a file with no
 * bytes cannot have 400 bytes of code. Implied, discriminating nothing, and the same shape as the
 * pigeonhole row deleted from `theme` section W in the commit before this one — found the same way,
 * by asking what single change reddens the row and NOTHING else rather than whether it passes.
 *
 * This one is the stronger claim in both directions: a missing file fails it, and so does a file
 * that is entirely comments, which is the likelier decay for a module this heavily annotated. */
t("A0 the generator has real code after comments are stripped — a missing or all-prose file fails here",
  src.length > 0 && code.trim().length > 400, true);

/* ⚠ THE RULING, AS A PROPERTY OF THE SOURCE. A ratio in this file would be a number somebody typed,
 * and a typed number is the stale manual boolean the ruling refused. Every figure must arrive from
 * `report()`. Decimals are the signature — 4.5, 3.0, 18.78 — so any decimal literal in CODE is the
 * violation, and there are legitimately none. */
const decimals = [...code.matchAll(/\b\d+\.\d+\b/g)].map((m) => m[0]);
t("A1 ⚠ NO RATIO IS TYPED INTO THE GENERATOR — every figure arrives from the resolver",
  decimals, []);

/* ⚠ AND IT MUST IMPORT THE GATE'S RESOLVER RATHER THAN COMPUTING ITS OWN. This row is READ FROM THE
 * IMPORT STATEMENT, not from the file, and the difference is the whole reason it works.
 *
 * ⚠ THE FIRST VERSION TESTED `new RegExp("\\b" + fn + "\\b").test(code)` — the NAME appearing
 * anywhere — and removing `report` from the import list left the CALL SITE `report(tokens, ...)`
 * behind, so the row passed a mutation that broke exactly what it claims to check. Unfalsifiable
 * for the reason it names, caught by mutating rather than by reading. The subject is the IMPORT, so
 * the matcher must be the import. */
/* ⚠ `[^}]*` RATHER THAN `[\s\S]*?`, AND THE LAZY VERSION WAS WRONG IN A WAY THAT LOOKED RIGHT. A
 * lazy any-character run starts at the FIRST `import {` in the file — `node:fs` — and happily spans
 * two earlier imports to reach this one's closing brace, so the captured "specifier list" contained
 * three import statements and the split-on-comma produced garbage. It reported `readPaletteSource`
 * missing while the import plainly declared it. A matcher that must not cross a delimiter cannot be
 * written with a pattern that does not count — the fifth instance of that family in this repo. */
const leafImport = /import\s*\{([^}]*)\}\s*from\s*"@\/lib\/theme-contrast"/.exec(code);
t("A2-0 the leaf import was found at all — a null here would make every A2 row below vacuous",
  leafImport !== null, true);
const imported = new Set((leafImport?.[1] ?? "").split(",")
  .map((x) => x.replace(/\btype\b/, "").trim()).filter(Boolean));
t("A2 ⚠ THE GENERATOR IMPORTS THE GATE'S RESOLVER, so the page and the gate cannot disagree",
  ["report", "usageFor", "layerPalette", "paletteResolver", "readPaletteSource"]
    .filter((fn) => !imported.has(fn)), []);

/* ⚠ THE THROW THAT REPLACES THE NAMING MACHINERY. The uncomputable set is empty, so there is no
 * list to render and no empty container to ship — but a pair that stops resolving must not enter an
 * unbuilt path silently. The generator throws, which fails the BUILD with the pair named.
 *
 * ⚠ THIS ROW IS A SOURCE CHECK AND SAYS SO. It cannot execute the module — `@/` aliases do not
 * resolve under ralph's raw loader — so it asserts the guard is PRESENT and reads the uncomputable
 * set, not that it fires. What proves it fires is `report()`'s own verdict ranking, which
 * `theme-contrast` B8 already exercises with a palette missing a token. Naming the other check is
 * the rule about a fact deferred to nobody. */
/* ⚠ AND THIS ROW HAD THE SAME DEFECT, FOUND BY THE SAME MUTATION. It tested for `uncomputable.length`
 * and `throw new Error` ANYWHERE in the file — and the throw's own message interpolates
 * `${result.uncomputable.length}`, so neutering the guard to `if (false)` left both strings in place
 * and the row passed. Two matchers, one file, both satisfied by text the mutation did not touch.
 * The guard must be matched as a GUARD: a condition naming the set, with the throw inside it. */
t("A3 ⚠ THE THROW SITS INSIDE A CONDITION ON THE UNCOMPUTABLE SET — no machinery for an empty set, and no silent path either",
  /if\s*\([^)]*uncomputable[^)]*\)\s*\{[\s\S]{0,600}?throw new Error/.test(code), true);

console.log("\nB · nothing is stored");
/* ⚠ THE FAILURE THIS SUITE EXISTS FOR: somebody runs the generator once, pastes the output into a
 * file "so the page does not have to compute it", and the table is stale from the next palette tune
 * onward while looking authoritative. No numeric gate can see that happen. */
const dir = join(root, "lib/palettes");
const members = existsSync(dir) ? readdirSync(dir) : [];
t("B0 the directory has members — an empty one would make B1 pass over nothing", members.length >= 1, true);
t("B1 ⚠ NOTHING BUT SOURCE LIVES BESIDE THE GENERATOR — a cached report is the stale table the ruling refused",
  members.filter((f) => !/\.tsx?$/.test(f)), []);
t("B2 …and no palette data file was added elsewhere under content/",
  existsSync(join(root, "content/palettes")), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
