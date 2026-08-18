// THE SHEET-ROLE UTILITY GATE — a utility on a sheet type role is inert if the role declares that
// property, and eighteen such classes are live on the site today.
// Run: node ralph/tests/sheet-role-utilities.mjs
//
// ---- THE MECHANISM ---------------------------------------------------------------------
//
// The sheet type roles — `.sheet-h2`, `.sheet-h3`, `.sheet-lede`, the three mono sizes and the
// mark — are declared UNLAYERED in `app/globals.css`. Tailwind's utilities live in
// `@layer utilities`, and an unlayered rule outranks every layer, so for any property a role
// declares, a utility asking for that property on the same element RESOLVES TO NOTHING.
//
// ⚠ AND THIS IS NOT THE RADIUS RESET'S SITUATION, WHICH IS THE PART THAT MISLEADS. Four hundred
// lines above the roles, `.sheet-scope *`'s radius reset was DELIBERATELY put inside `@layer base`,
// and its comment says why — so that a deliberate utility can still win. The roles were left
// unlayered. Two adjacent blocks in one file, opposite cascade behaviour, and only one of them
// says which it is.
//
// ⚠ THE FINDING IS A LIVE LAYOUT DEFECT AND NOT A TIDINESS ONE, BECAUSE `margin` IS DECLARED AS A
// SHORTHAND. `.sheet-h2`, `.sheet-h3` and `.sheet-lede` each declare `margin: 0`, so every `mt-*`,
// `mb-*` and `mx-auto` on one of them draws nothing. Measured from the paint rather than derived:
// the first draft of the blog article head asked for 30px above its title and rendered the title's
// top edge ONE PIXEL from the rule's baseline. Fifteen of the eighteen instances below are that
// shape, on the home page's sections, the case-study section header, the 404 and the error
// boundary.
//
// ⚠ AND NOTHING HERE FIXES THEM, WHICH IS DELIBERATE AND IS WHY THE COUNT IS PINNED RATHER THAN
// ZEROED. Deleting `margin` from the three roles restores all fifteen at once — Tailwind's
// preflight still zeroes the element margins from `@layer base`, so the utilities would simply
// start applying. That is a one-line change that alters spacing on the home page, four case
// studies and two error surfaces simultaneously, and the appearance those pages were reviewed and
// approved at is the CURRENT one. It is an owner's ruling, not a cleanup, so it is a named
// population with its measurement rather than a diff that rides in on a blog unit's gates.
//
// ---- WHAT THIS GATE ASSERTS -----------------------------------------------------------
//
// The subject is DERIVED — the role list and each role's property set are parsed out of
// `globals.css`, so a role gaining or losing a property moves the census without anyone editing
// a list here. A hand-written property table would be the parallel-list defect inside the gate
// written to find inert declarations.
//
// The complement is what makes it worth running: a NEW inert utility fails on arrival, and the
// blog surface is asserted at ZERO so the conversion that found this cannot reintroduce it.
//
// ⚠ COMMENTS ARE BLANKED ON BOTH SIDES, AND THE TWO SIDES ARE NOT IN THE SAME STATE — WHICH IS A
// CORRECTION TO THIS HEADER'S OWN FIRST DRAFT. It claimed both were load-bearing "for the same
// reason" and cited the `mb-4` this unit walked into. Mutation refuted the `.tsx` half: removing
// that blanking leaves all twelve rows green.
//
//   CSS side    LOAD-BEARING, proved. The prose in `globals.css` names `margin: 0` and
//               `max-width: 24ch` while explaining them, so without blanking the role table
//               reads its own explanation and six rows go red. Fifth scanner in this repository
//               to need this, and the only one where the prose IS the subject.
//   .tsx side   POPULATION MEASURED EMPTY. No comment in the tree currently spells a role and a
//               competing utility inside one `className` shape — the `mb-4` above is discussed in
//               a sentence, which the matcher never looks at, so citing it was wrong.
//
// IT IS KEPT ANYWAY, AND SECTION D IS WHY THAT IS NOT A FREE PASS. A change that moves no total
// is a change the next author reverts by accident, and this repository already carries that exact
// ruling from two earlier comment strips. The trigger is one comment away: `not-found.tsx`'s
// header quotes retired class strings by design, and the moment one of them is quoted as markup
// rather than as prose the blanking becomes the only thing keeping it out of the census. D1 and D2
// assert it against a constructed fixture, in both directions, so the guard cannot pass by
// guarding nothing.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const ROOT = process.cwd();
const blank = (s, re) => s.replace(re, (m) => " ".repeat(m.length));
const blankCss = (s) => blank(s, /\/\*[\s\S]*?\*\//g);
const blankTsx = (s) => blank(blank(s, /\/\*[\s\S]*?\*\//g), /\/\/[^\n]*/g);

// ---- THE ROLE TABLE, DERIVED -----------------------------------------------------------

const css = blankCss(readFileSync(join(ROOT, "app/globals.css"), "utf8"));
const roles = new Map();
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const props = m[2].split(";").filter((d) => d.includes(":")).map((d) => d.split(":")[0].trim());
  for (const sel of m[1].split(",").map((s) => s.trim())) {
    if (!/^\.sheet-[a-z0-9-]+$/.test(sel)) continue;
    const key = sel.slice(1);
    if (!roles.has(key)) roles.set(key, new Set());
    for (const p of props) roles.get(key).add(p);
  }
}

// Only the TYPE roles compete with type utilities. The devices (`.sheet-rule`, `.sheet-plate`,
// `.sheet-stamp`, the ticks) are containers, and a utility on a container is a layout decision
// rather than an override — the blog head's `mb-*` on its rule is live for exactly that reason.
const TYPE_ROLES = ["sheet-h2", "sheet-h3", "sheet-lede", "sheet-mark-text", "sheet-mono-label", "sheet-mono-micro", "sheet-mono-text"];

// ⚠ THE MAP IS PROPERTY-TO-UTILITY AND NOT UTILITY-TO-PROPERTY, WHICH IS THE DIRECTION THAT
// CANNOT GO STALE AGAINST THE CSS. A role declares CSS properties; the question is which Tailwind
// spellings reach the same property. `margin` covers every side and axis because the roles declare
// the SHORTHAND, which is the whole reason `mx-auto` and `mb-6` are inert.
const COMPETE = {
  "margin": /\b-?m[trblxy]?-\S+/g,
  "max-width": /\bmax-w-\S+/g,
  "line-height": /\bleading-\S+/g,
  "font-size": /\btext-(?:xs|sm|base|lg|xl|\dxl|\[[^\]]+\])/g,
  "letter-spacing": /\btracking-\S+/g,
  "font-weight": /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,
  "font-family": /\bfont-(?:display|mono|body|sans|serif)\b/g,
  "text-transform": /\b(?:uppercase|lowercase|capitalize|normal-case)\b/g,
  "text-wrap": /\btext-(?:balance|pretty|nowrap)\b/g,
};

const walk = (dir, out = []) => {
  for (const e of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${e}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (e.endsWith(".tsx")) out.push(rel);
  }
  return out;
};
const files = [...walk("app"), ...walk("components")].sort();

// ⚠ ONE FUNCTION, TWO CALLERS, AND THE SPLIT IS WHY THAT MATTERS NOW. Section D used to carry its
// own copy of this logic so it could be driven with fixture strings. That was tolerable while the
// registry had members — the file walk proved the matcher fired on real code. The registry is now
// EMPTY, so every row that reads it is asserting a zero, and a zero from a matcher nothing has
// exercised is worth nothing. Sharing the function makes D2's fixture the proof that the walk's
// zero is a measurement, which is the parallel-list defect removed rather than described.
const inertUtilitiesIn = (src) => {
  const out = [];
  for (const m of blankTsx(src).matchAll(/className\s*=\s*\{?[`"']([^`"']*)/g)) {
    const cls = m[1].replace(/\s+/g, " ");
    const used = TYPE_ROLES.filter((r) => new RegExp(`\\b${r}\\b`).test(cls));
    if (used.length === 0) continue;
    const declared = new Set(used.flatMap((r) => [...(roles.get(r) ?? [])]));
    for (const [prop, re] of Object.entries(COMPETE)) {
      if (!declared.has(prop)) continue;
      for (const hit of cls.match(re) ?? []) {
        if (used.some((u) => hit.startsWith(u))) continue;
        out.push({ hit, prop });
      }
    }
  }
  return out;
};

const census = new Map();
for (const rel of files) {
  for (const { hit, prop } of inertUtilitiesIn(readFileSync(join(ROOT, rel), "utf8"))) {
    if (!census.has(rel)) census.set(rel, new Set());
    census.get(rel).add(`${hit} vs ${prop}`);
  }
}
const counts = Object.fromEntries([...census].map(([k, v]) => [k, v.size]).sort());
const total = Object.values(counts).reduce((a, b) => a + b, 0);

// ---- THE NAMED POPULATION -------------------------------------------------------------
//
// Eighteen instances, eleven files, each with what it loses and why it is still there. Every one
// predates the unit that found them. The `kind` is the QUESTION the remediation would answer, not
// a severity — `SPACING` means the markup asks for a gap the page does not have, `MEASURE` means a
// width cap that never applied, `LEADING` means a line-height that never applied.
// ⚠ THE REGISTRY IS EMPTY, AND THAT IS THE FIRST TIME. It opened at eighteen across eleven files.
// Fifteen were margin utilities losing to a `margin: 0` shorthand, drained when the three type roles
// stopped declaring it. The last three were `leading-*` losing to a `line-height` the mono roles do
// declare — and those were DELETED rather than made to win, because the appearance nobody asked to
// change is the role's, which is what shipped and what was reviewed. A class that draws nothing is
// removed; a class that would change the page is a design decision and not a cleanup.
const EXPECTED = {};
const EXPECTED_TOTAL = 0;

// ⚠ THE MARGIN CATEGORY IS DRAINED, AND IT IS ASSERTED BY NAME RATHER THAN BY ABSENCE FROM THE
// REGISTRY ABOVE. Fifteen of the eighteen were `mt-*`, `mb-*` and `mx-auto` losing to a `margin: 0`
// shorthand the three type roles no longer declare. A category that empties silently is a category
// the next author refills, so section E asks the question directly.
const MARGIN_PROP = "margin";

console.log("\n--- A. THE DERIVED SUBJECT ---");
t("A1 the role table parses at least the seven type roles, so the census has a subject",
  TYPE_ROLES.every((r) => roles.has(r)), true);
t("A1a …and every type role declares at least one property, so no lookup is a silent empty set",
  TYPE_ROLES.filter((r) => (roles.get(r) ?? new Set()).size === 0), []);
t("A2 ⚠ NO TYPE ROLE DECLARES `margin` ANY MORE — the drain, asserted at its cause rather than at its symptom",
  TYPE_ROLES.filter((r) => roles.get(r)?.has(MARGIN_PROP)), []);
t("A2a …and the two that own `max-width` are the two whose measure cannot be overridden",
  TYPE_ROLES.filter((r) => roles.get(r)?.has("max-width")), ["sheet-h2", "sheet-lede"]);
t("A3 the property map covers `margin` and `max-width`, the two that shipped live defects",
  ["margin", "max-width"].every((p) => p in COMPETE), true);
t("A3a …and the file walk is non-empty, so a broken walk cannot pass as a clean census",
  files.length > 100, true);

console.log("\n--- B. THE PINNED POPULATION ---");
t("B1 ⚠ NOT ONE INERT UTILITY REMAINS ON ANY TYPE ROLE — the registry opened at eighteen",
  total, EXPECTED_TOTAL);
t("B2 …and no file carries one, so the registry and the walk agree",
  counts, EXPECTED);
t("B2a …and the registry's own arithmetic reconciles, so the total is derived from the members",
  Object.values(EXPECTED).reduce((a, b) => a + b, 0), EXPECTED_TOTAL);

console.log("\n--- C. THE COMPLEMENT ---");
// ⚠ THE BLOG IS ASSERTED AT ZERO RATHER THAN LEFT OUT OF THE REGISTRY. An absent key and a key
// holding zero read identically in `EXPECTED`; only a row naming the surface says somebody checked
// it. This is the surface whose conversion found the mechanism, so it is the one most likely to
// reintroduce it.
const blogInert = Object.keys(counts).filter((f) => /blog/.test(f));
t("C1 the blog surface carries none — its heads take their spacing from a column gap instead",
  blogInert, []);
t("C1a …and the blog surface is genuinely in the walk, so C1's zero is a measurement",
  files.filter((f) => /blog/.test(f)).length > 4, true);
t("C2 no file carries one, so a new instance fails on arrival",
  Object.keys(counts).filter((f) => !(f in EXPECTED)), []);

console.log("\n--- D. THE .tsx COMMENT STRIP, ASSERTED AGAINST A FIXTURE ---");
// The census reduced to a pure function of one source string, so the guard can be driven with
// inputs rather than inferred from a total that does not move. Both directions are asserted
// because a strip that removed everything would satisfy D1 alone.
const inertIn = (src) => inertUtilitiesIn(src).map((x) => x.hit);
// ⚠ THE FIXTURE IS THREE LINES RATHER THAN ONE, WHICH THIS REPOSITORY LEARNED THE HARD WAY. A
// one-line comment cannot tell BLANKING from DELETION, because deleting it removes no newline and
// every position after it still lines up. `cascade-public`'s A0c is the entry that records it.
// ⚠ THE FIXTURE MOVED FROM `mt-8` TO `max-w-[40ch]`, AND THE REASON IS THIS UNIT. `sheet-h2` no
// longer declares `margin`, so `mt-8` competes with nothing and BOTH fixtures would return an empty
// list — D1 would pass while asserting nothing and D2 would fail. A fixture has to name a property
// the role still owns, or the strip is being proved against a subject that no longer exists.
const FIXTURE_COMMENTED = [
  "/* a retired head, quoted as markup:",
  '   <h2 className="sheet-h2 max-w-[40ch]"> */',
  '<h2 className="sheet-h2">Live</h2>',
].join("\n");
const FIXTURE_REAL = '<h2 className="sheet-h2 max-w-[40ch]">Live</h2>';
t("D1 a competing utility quoted inside a comment is NOT counted",
  inertIn(FIXTURE_COMMENTED), []);
t("D2 …and the same string in real markup IS counted, so D1 cannot pass by counting nothing",
  inertIn(FIXTURE_REAL), ["max-w-[40ch]"]);
// ⚠ THE LEADING DETECTOR GETS ITS OWN FIXTURE BECAUSE ITS CATEGORY JUST EMPTIED. E2 asserts no
// category survives; if `line-height` fell out of the COMPETE map, E2 would go on passing and the
// deletion this unit made would stop being watched. A drained category needs a live detector more
// than a populated one does.
t("D2a a `leading-*` on a mono role IS detected — the exact pair this unit deleted",
  inertIn('<span className="sheet-mono-label leading-none">x</span>'), ["leading-none"]);
t("D2b …and an arbitrary leading value too, which is the other spelling that was deleted",
  inertIn('<span className="sheet-mono-micro leading-[1.5]">x</span>'), ["leading-[1.5]"]);
t("D3 …and a line comment is stripped too, which is the form every note in this repository uses",
  inertIn('// <h2 className="sheet-h2 max-w-[40ch]">\n<h2 className="sheet-h2">Live</h2>'), []);

console.log("\n--- E. THE DRAINED CATEGORY ---");
// ⚠ ASKED OF THE WHOLE TREE RATHER THAN OF THE REGISTRY, because the registry is a list of what IS
// and this is a claim about what IS NOT. A margin utility on a type role used to be the single
// largest inert category on the site — fifteen of eighteen, across every case-study section head,
// two home-page headings, the 404 and the error boundary. It is now unrepresentable: the roles
// declare no margin, so the base reset supplies the zero and any utility beats it.
// ⚠ `census` IS A Map. The first draft of these two rows used `Object.entries` on it, which returns
// an EMPTY ARRAY — so E1 passed while looking at nothing, in the section written to prove a category
// is empty. Caught because E2 wanted a NON-empty answer from the same expression and went red; had
// both rows expected emptiness, both would have passed vacuously and the drain would be unproven.
// An assertion that something is absent needs a sibling that demands something present.
const censusEntries = [...census.entries()];
const marginInert = censusEntries.flatMap(([f, set]) =>
  [...set].filter((s) => s.endsWith(`vs ${MARGIN_PROP}`)).map((s) => `${f} :: ${s}`));
t("E0 the census structure E1 reads agrees with the registry, empty or not",
  censusEntries.length, Object.keys(EXPECTED).length);
t("E1 ⚠ NOT ONE MARGIN UTILITY ON A TYPE ROLE IS INERT — was 15, and this is the unit's whole claim",
  marginInert, []);
t("E1a …and margin utilities on type roles genuinely EXIST, so E1 is a measurement and not an empty set",
  (() => {
    let n = 0;
    for (const rel of files) {
      const src = blankTsx(readFileSync(join(ROOT, rel), "utf8"));
      for (const m of src.matchAll(/className\s*=\s*\{?[`"\']([^`"\']*)/g)) {
        const cls = m[1].replace(/\s+/g, " ");
        if (!TYPE_ROLES.some((r) => new RegExp(`\\b${r}\\b`).test(cls))) continue;
        if (/(?:^|\s)-?m[trblxy]?-\S+/.test(cls)) n++;
      }
    }
    return n > 10;
  })(), true);
t("E2 …and NO category survives — margin, measure and leading are all empty",
  [...new Set([...census.values()].flatMap((s) => [...s].map((x) => x.split(" vs ")[1])))].sort(),
  []);

console.log("\n--- F. THE THIRD ROUTE — AN INLINE MARGIN ON A TYPE ROLE ---");
// ⚠ A UTILITY IS NOT THE ONLY WAY TO ASK A ROLE FOR A MARGIN, AND THE OTHER WAY WAS WHAT THE SITE
// ACTUALLY USED. While the roles declared `margin: 0` unlayered, an INLINE style was the single
// spelling that reached the element — it outranks every rule, layered or not. `SheetSectionHead`
// used one, which is why the home page's six ledes had their gaps while 53 case-study sections did
// not. The roles stopped declaring margin, so the inline styles were converted to the same two
// utility classes the case-study head already emits, and this row keeps that route shut.
//
// ⚠ AND ONE OF THE TWO CONSTANTS NEVER NEEDED TO BE INLINE, WHICH IS THE PART WORTH KEEPING.
// `LEDE_GAP` sat on a `<p className="sheet-lede">` and was a forced workaround. `RULE_GAP` sat on a
// plain `<div>` carrying no role at all, where a utility would always have won — it was inline by
// IMITATION of its neighbour. A workaround spreads to places that never had the problem, and from
// the file it reads as one deliberate pattern rather than one repair and one copy.
//
// THE ROW IS SCOPED TO THE ROLE CASE, DELIBERATELY. An inline margin on an element with no role is
// a style preference the project states elsewhere (lay siblings out with gap, not margins), and
// three legitimate ones survive: a group wrapper, a decorative centring by negative margin, and
// `app/global-error.tsx`, whose own header forbids it from depending on the stylesheet at all.
const inlineMarginOnRole = (src) => {
  const out = [];
  // an opening tag carrying BOTH a type role in className and a margin in a style object
  for (const m of blankTsx(src).matchAll(/<[A-Za-z][^>]*>/g)) {
    const tag = m[0];
    if (!TYPE_ROLES.some((r) => new RegExp(`\\b${r}\\b`).test(tag))) continue;
    if (/style\s*=\s*\{[^}]*margin/i.test(tag)) out.push(tag.replace(/\s+/g, " ").slice(0, 70));
  }
  return out;
};
const inlineHits = files.flatMap((rel) =>
  inlineMarginOnRole(readFileSync(join(ROOT, rel), "utf8")).map((t) => `${rel} :: ${t}`));
t("F1 ⚠ NO ELEMENT CARRYING A TYPE ROLE SETS AN INLINE MARGIN — the third route, shut",
  inlineHits, []);
t("F1a …and the matcher fires on a constructed instance, so F1's zero is a measurement",
  inlineMarginOnRole('<p className="sheet-lede" style={{ marginTop: "18px" }}>x</p>').length, 1);
t("F1b …and it does NOT fire on an inline margin without a role, which is a style choice and not this defect",
  inlineMarginOnRole('<div className="relative" style={{ marginTop: "28px" }}>x</div>'), []);
t("F1c …nor on a role with a NON-margin inline style, so the row keys on the property",
  inlineMarginOnRole('<p className="sheet-lede" style={{ paddingTop: "18px" }}>x</p>'), []);
t("F1d …and a commented-out instance is not counted, on the same strip section D proves",
  inlineMarginOnRole('// <p className="sheet-lede" style={{ marginTop: "18px" }}>x</p>'), []);

console.log("\n--- G. A MONO ROLE'S COLOUR OUTRANKING A CONDITIONAL ONE ---");
// ⚠ THIS SECTION EXISTS BECAUSE THE DEFECT SHIPPED AND WAS LIVE. The gallery filter chip took
// `.sheet-mono-label` for its size and tracking. That class is UNLAYERED and paints
// `var(--sheet-mark)`, so it outranked both arms of the chip's own ternary — the PRESSED chip drew
// `text-secondary` on the accent fill and measured 2.30 against a 4.5 floor on production.
//
// THE MONO ROLES CARRY THEIR COLOUR. That is fine wherever the element's colour is the role's, and
// wrong in two situations this repository now has one instance of each:
//
//   a CONDITIONAL colour   the chip, whose colour depends on `aria-pressed`
//   a foreign GROUND       the gallery modal, a dark scrim inside a light `:root`, where the
//                          role's dark ink would vanish and nothing sets `data-ground` — which
//                          only works at `:root` anyway
//
// Both take the direction's SIZE and TRACKING as utilities and keep their own colour. The rule is
// not "never use the roles" — it is that a role which supplies colour cannot sit on an element
// whose colour is decided by something else.
const MONO_ROLES = ["sheet-mono-label", "sheet-mono-micro", "sheet-mono-text", "sheet-mark-text"];
// A colour utility that only makes sense against a ground the page does not supply, or that is
// chosen per state. `on-*` covers the inverted roles; the ternary case is caught by a role and a
// `text-*` colour appearing in one class expression at all, since the role would always win.
const FOREIGN_COLOUR = /\btext-(on-[a-z-]+|accent[a-z-]*)\b/;
// ⚠ THE ATTRIBUTE IS EXTRACTED BY COUNTING, AND TWO EARLIER DRAFTS OF THIS ROW GOT IT WRONG IN
// OPPOSITE DIRECTIONS. The first matched `className=` then a lazy run to the next quote — and a
// template literal's `${...}` contains quotes, so the capture stopped INSIDE the interpolation and
// never reached the colour on the other side of the ternary. Reintroducing the exact expression
// that shipped left the section green. The second used a fixed 400-character window instead, which
// ran PAST the element into its siblings and reported six false positives, every one a role on one
// element and an accent hover on the next.
//
// Too short and it misses the defect; too long and it invents one. A class expression is delimited
// by balanced braces, so this counts them — the rule this repository has now written down six times
// about matchers that need to know where a construct ends.
const classExpr = (src, at) => {
  let i = src.indexOf("=", at) + 1;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] === '"' || src[i] === "'") {
    const q = src[i], end = src.indexOf(q, i + 1);
    return end < 0 ? "" : src.slice(i + 1, end);
  }
  if (src[i] !== "{") return "";
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return src.slice(i + 1, j); }
  }
  return "";
};
const clash = [];
for (const rel of files) {
  const src = blankTsx(readFileSync(join(ROOT, rel), "utf8"));
  for (const m of src.matchAll(/className\s*=/g)) {
    const expr = classExpr(src, m.index).replace(/\s+/g, " ");
    if (!expr) continue;
    if (!MONO_ROLES.some((r) => new RegExp(`\\b${r}\\b`).test(expr))) continue;
    if (FOREIGN_COLOUR.test(expr)) clash.push(`${rel} :: ${expr.slice(0, 78)}`);
  }
}
t("G1 ⚠ NO MONO ROLE SITS BESIDE A COLOUR IT WOULD SILENTLY OUTRANK — the 2.30 that shipped",
  clash, []);
t("G1a …and the EXTRACTOR reproduces the expression that shipped, ternary and all",
  (() => {
    const shipped = 'className={`sheet-mono-label px-3.5 py-2 ${on ? "bg-accent text-on-accent" : "text-text-subtle"}`}';
    const e = classExpr(shipped, 0);
    return [MONO_ROLES.some((r) => new RegExp(`\\b${r}\\b`).test(e)), FOREIGN_COLOUR.test(e)];
  })(), [true, true]);
t("G1b ⚠ …and it STOPS at the element's own attribute — the 400-character window ran into siblings",
  (() => {
    const two = 'className="sheet-mono-label">x</p><h2 className="text-on-accent">y</h2>';
    return FOREIGN_COLOUR.test(classExpr(two, 0));
  })(), false);
t("G1c …and a role with no competing colour is the ordinary correct use and is not reported",
  FOREIGN_COLOUR.test(classExpr('className="sheet-mono-label"', 0)), false);
t("G2 …and the roles still declare `color`, so G1 has a subject",
  MONO_ROLES.every((r) => (roles.get(r) ?? new Set()).has("color")), true);

console.log(`\nsheet-role-utilities result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
