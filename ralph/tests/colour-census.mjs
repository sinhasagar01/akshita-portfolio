// EVERY COLOUR THAT REACHES A PUBLIC PAGE. The instrument the theme project was missing.
// Run: node --experimental-strip-types ralph/tests/colour-census.mjs   (needs a production build)
//
// ---- ⚠ WHY THIS EXISTS, AND IT IS NOT "ANOTHER GATE" -------------------------------------------
//
// Step 1 enumerated 125 colour literals and classified all of them. Public source holds 288, and
// STEP 1'S SUBJECT WAS 6 OF THEM. It read `className` and inline `style={{}}` in `components/`,
// which is where a component census naturally looks. The other 282 sit in CSS rule bodies (104),
// SVG attributes (75), the token block itself (67), runtime JS const arrays (28) and `@keyframes`
// (8). It was thorough about its subject.
//
// ⚠ AND E1 DID NOT COVER THE GAP, WHICH IS THE SHARPEST FINDING OF THE WHOLE ARC.
// `theme-contrast`'s E1 asserts every PUBLIC COLOUR is computed or on the boundary list, it caught
// `on-dark-line` on its first run, and it read like the repair for hazard 30. It was the repair for
// hazard 30 WITHIN ITS SUBJECT, and its subject is declarations named `--color-*`.
//
//   A COMPLETENESS ASSERTION INHERITS ITS SUBJECT'S BLIND SPOT.
//
// E1's claim was TRUE of `--color-*` and FALSE of the page. The boundary list was declared complete
// twice — in #325 and again in #328 when it shrank by three — and both statements were true and
// useless. A gate that proves a set is complete proves NOTHING about what is outside the set, and
// the danger is that it READS like it does.
//
// ---- THE SUBJECT, CHOSEN SO IT CANNOT INHERIT A NAME'S BLIND SPOT -----------------------------
//
// This enumerates COLOURS IN THE RENDERED OUTPUT rather than declarations in source. Three
// populations, because a colour reaches a public page by exactly three routes:
//
//   A · THE BUILT CSS BUNDLE. Every rule Tailwind emitted, after compilation. A literal colour in
//       a declaration VALUE is a colour no theme can move. A `var(--color-*)` reference is not —
//       that is the token layer working.
//   B · SVG PRESENTATION ATTRIBUTES in public components. `fill="#..."` never appears in a
//       stylesheet and never in a `className`.
//   C · RUNTIME-GENERATED COLOURS in public JS — const arrays, template strings, canvas draw
//       calls. They reach the page as inline style or as a paint operation.
//
// ---- ⚠ A GUARD PINNED TO A POPULATION SIZE PUNISHES THE FIX — TWICE IN THIS FILE ---------------
//
// Read this BEFORE writing a new non-empty assertion here, because the reflex that produced both
// instances is the natural one and it will produce a third.
//
//   A6, corrected in #332  `more than 10 parse` — failed once the parser was repaired.
//   A2, corrected in #360  `cssLeaks.size > 20` — failed once the aura collapse took the authored
//                          count to 16. The site improved and the gate went red.
//
// Both were written to mean "the scan is not silently matching nothing" and both encoded that as a
// MAGNITUDE OF THE PROBLEM. Those are different claims. The number of leaks is what the work is
// trying to reduce; pinning a floor to it means every success looks like a regression.
//
// ⚠ AND THE DISTINCTION IS NOT "NO THRESHOLDS". E1's `TOKEN_VALUES.size > 20` is a floor on the
// SUBJECT — how many tokens the file found to check — and that one SHOULD fail if it shrinks, which
// is the rule that a gate over generated output states its denominator. The test is which side of
// the instrument the number describes.
//
//   FLOOR ON THE SUBJECT   how much did I find to look at        — assert it, a drop is a defect
//   FLOOR ON THE FINDINGS  how much of it turned out to be bad   — do NOT, a drop is the goal
//
// Where the question is really "does the mechanism work", assert the mechanism. A2 now checks
// non-empty and leaves correctness to A2b's fallback discrimination and to J1's two-way join.
//
// ---- ⚠ WHAT THIS SUITE'S SUBJECT IS, AND WHAT FALLS OUTSIDE IT --------------------------------
//
// E1 is the cautionary precedent, so this says its own boundary out loud rather than reading like
// the stronger claim.
//
//   SUBJECT — every colour that PAINTS A PUBLIC PAGE, by the three routes above: the built CSS
//   bundle, SVG presentation attributes, and colours generated in public JS.
//
//   OUTSIDE — anything that reaches a surface ADJACENT to the page rather than the page itself.
//
// ⚠ AND WRITING THAT SENTENCE FOUND A FOURTH ROUTE, WHICH IS THE POINT OF WRITING IT.
// `app/manifest.ts` declares `background_color: "#FBF6EE"` and `theme_color: "#1c1813"` — the PWA
// splash and the mobile address-bar tint. `lib/og.tsx` holds its own hexes for the social cards.
// None of them is in the CSS bundle, in an SVG attribute, or in page-painting JS, so section D
// below REPORTS them and does not fold them into A, B or C. They are a real population with a real
// question attached (should the address bar follow the theme?) and answering it is not this
// suite's job.
//
// The general shape of a fifth route, so the next one is expected rather than discovered: a colour
// baked into a RASTER asset — the site photo, the project-card thumbnails, a video frame. No static
// analysis reaches those, and a theme cannot move them either. If a palette ever has to agree with
// a photograph, that is where the disagreement will live.
//
// ⚠ THE POINT OF ENUMERATING BY VALUE RATHER THAN BY NAME is that `--glass-fill` is caught.
// It holds `oklch(98.5% 0.012 80 / 0.58)`, which is `--color-cream-50`'s value written longhand
// with an alpha — A COLOUR THAT ALREADY HAS A NAME, SPELLED OUT WHERE THE NAME CANNOT REACH IT.
// No name-based gate can see that, because the property is not called `--color-anything`.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { load } from "js-yaml";
/* ⚠ IMPORTED RATHER THAN RE-DECLARED, AND THIS SUITE IS ITS OWN EXHIBIT. It owned a private COLOUR
 * regex until now — the same instinct that produced #338's narrower one-off, in a STANDING gate. */
import { colourPattern, colourKey, parseColor, COLOUR_FORMS } from "../../lib/theme-contrast.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);
const read = (p) => readFileSync(url(p), "utf8");

/* ⚠ NOT RUNNABLE WITHOUT A BUILD, AND IT SAYS SO RATHER THAN PASSING VACUOUSLY. `studio-type` and
 * `parity` set this precedent: a suite whose subject is absent reports that it did not run. A
 * census over an empty file set would report zero leaks, which is the exact shape this file exists
 * to stop. */
const CSS_DIR = ".next/static/css";
if (!existsSync(url(CSS_DIR))) {
  console.log("  NOT RUNNABLE — no production build. Run `npm run build` first.");
  console.log("\n0 passed, 0 failed (skipped)");
  process.exit(0);
}

/* ⚠ IMPORTED, NOT DECLARED. This suite used to own this pattern, and #338's verification step wrote
 * its own narrower copy because writing one was faster than reaching for this. One export, and the
 * one-off has nothing to be faster than. */
const COLOUR = colourPattern();

/* ---------------------------------------------------------------- the token layer, for reference */
const globals = read("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
const TOKEN_VALUES = new Set();
for (const m of globals.matchAll(/--color-[a-z0-9-]+:\s*([^;]+);/g)) {
  for (const c of m[1].match(COLOUR) ?? []) TOKEN_VALUES.add(c.replace(/\s+/g, ""));
}

/* ⚠ THE BOUNDARY IS DATA NOW, AND IT LIVES IN `docs/` RATHER THAN BESIDE THIS FILE. The gate reads
 * it; the gate is not its audience. Every row is a design decision with its reason in prose, and a
 * file in the test directory is a fixture while a file in docs is a record that happens to be
 * machine-readable.
 *
 * WHY IT STOPPED BEING REGEXES. The exclusions used to live inside this suite, which made the
 * SUBJECT tool-defined rather than declared — E1's shape, the thing this arc was spent repairing.
 * It produced two wrong numbers: a selector filter hid seven vessel parts, and the same filter
 * copied into a scoping script reported four remaining items when there were thirty-nine.
 * A FILTER ENCODED TWICE IS A FILTER THAT DISAGREES WITH ITSELF, AND NEITHER COPY CAN BE REVIEWED. */
const BOUNDARY = load(read("docs/colour-boundary.yaml"));

console.log("\nZ · the boundary is DATA, and this suite asserts its shape rather than defining it");
t("Z1 the record exists and parses", typeof BOUNDARY === "object" && BOUNDARY !== null, true);
t("Z2 both kinds are declared", Object.keys(BOUNDARY.kinds ?? {}).sort(), ["judgement", "mechanical"]);
/* ⚠ THE DISTINCTION THAT MATTERS MOST IS THAT THE FIRST FOUR COULD IN PRINCIPLE BE COMPUTED AND THE
 * LAST THREE NEVER CAN. Asserting it here stops a later author trying to derive "is this artwork"
 * from the value. */
/* ⚠ FIVE SINCE #341, AND THIS ASSERTION FAILING IS WHY THE WIDENING IS VISIBLE. `mechanical` read
 * "a property of the VALUE"; `ships-publicly-no-public-consumer` is a property of where a value is
 * CONSUMED. Still mechanical — a machine resolves it, nobody rules on it — but the word's boundary
 * moved, and a kind whose definition drifts silently is how a subject stops being declared. The
 * pinned list is what turned a silent drift into a deliberate edit. */
t("Z3 mechanical categories are the five decidable without a judgement",
  [...BOUNDARY.kinds.mechanical.categories].sort(),
  ["compiler-default", "derived", "mask", "not-a-colour", "ships-publicly-no-public-consumer"]);
/* ⚠ FIVE NOW, AND `signature` IS GONE. It meant "a thing that IS the design", three entries meant
 * it genuinely — cursor, loader, hero auras — and ALL THREE FAILED the ground-change test when a
 * second palette arrived. The five still wearing it each meant something else, which #365 found by
 * reading prose against label. The categories are a MAP now, keyed by name, because each one
 * declares the test its entries must answer. */
t("Z4 judgement categories are the five that never can be computed",
  Object.keys(BOUNDARY.kinds.judgement.categories).sort(),
  ["adjacent", "artwork-by-file", "forced-literal", "invariant", "near-miss-kept"]);
t("Z4b ⚠ AND `signature` IS NOT AMONG THEM — deleted with a 100% failure rate among its true members",
  "signature" in BOUNDARY.kinds.judgement.categories, false);
t("Z5 every entry declares a kind the file knows",
  BOUNDARY.entries.filter((e) => !(e.kind in BOUNDARY.kinds)).map((e) => e.id), []);
/* ⚠ THE ROW'S REASON IS THE DURABLE PART, so a row without prose is a row nobody can overturn or
 * defend. Length rather than presence, because "signature" would pass a presence check. */
t("Z6 every entry carries a REASON as prose, not a category code alone",
  BOUNDARY.entries.filter((e) => !e.reason || e.reason.trim().length < 40).map((e) => e.id), []);
t("Z7 every judgement entry names WHERE it lives, so it can be audited",
  BOUNDARY.entries.filter((e) => e.kind === "judgement" && !e.where).map((e) => e.id), []);

/* ⚠ Z8 — THE CATEGORY IS A CLAIM, NOT A LABEL, AND THIS IS WHAT MAKES IT ONE.
 *
 * Until #365 nothing read `category:`. Z4 asserted the VOCABULARY and Z5 that an entry declares a
 * KNOWN kind, and no assertion ever compared a kind to its reason — so five of five `signature`
 * entries sat in a category none of their prose argued for, for as long as the field existed.
 * A FIELD NOTHING READS DRIFTS SILENTLY AND LOOKS AUTHORITATIVE WHILE IT DOES. `count:` was the
 * first; this is the second.
 *
 * ⚠ AND IT IS DELIBERATELY NOT A LIST OF ACCEPTED PHRASES. Matching prose against known wordings
 * would put a regex in a data file, which is exactly what #339 removed when the census's exclusions
 * stopped being patterns and became rows. What is checkable without that is the SHAPE OF THE
 * ARGUMENT: the category declares a question, the entry declares its answer, and an answer nobody
 * wrote is an empty field. It forces the reasoning to exist; a person still judges whether it is
 * good, which is the same division of labour every other row here uses. */
const jc = BOUNDARY.kinds.judgement.categories;
t("Z8 every judgement category declares the TEST its entries must answer — one without it is a label",
  Object.entries(jc).filter(([, v]) => !v || typeof v.test !== "string" || v.test.trim().length < 40)
    .map(([k]) => k).sort(), []);
t("Z8b …and every judgement entry ANSWERS it, so the category is a claim rather than a tag",
  BOUNDARY.entries.filter((e) => e.kind === "judgement"
    && (typeof e.test !== "string" || e.test.trim().length < 40)).map((e) => e.id).sort(), []);
t("Z8c …and each entry's category is one the file declares — a recategorisation cannot invent a kind",
  BOUNDARY.entries.filter((e) => e.kind === "judgement" && !(e.category in jc)).map((e) => e.id).sort(), []);
/* The denominator, because Z8 and Z8b are both "nothing is missing" over a set that could be empty. */
t("Z8d the judgement population is real, so Z8 and Z8b are not passing over nothing",
  Object.keys(jc).length >= 4 && BOUNDARY.entries.filter((e) => e.kind === "judgement").length >= 8, true);
/* The tie-break is recorded as a CORRECTION to the composite rule, not an addition beside it. */
const rules = Object.fromEntries((BOUNDARY.rules ?? []).map((r) => [r.id, r]));
t("Z9 the composite rule names the rule that corrects it",
  rules["composite-not-declaration"]?.corrected_by, "base-colour-highest-alpha");
t("Z9 …and the correction says why, because the reason is the valuable half",
  (rules["base-colour-highest-alpha"]?.why ?? "").includes("TWO COLOURS WHERE THE DESIGN HAS ONE"), true);

console.log("\nM · the matcher's coverage — asked what it CANNOT see, not only what it can");

/* ⚠ THIS FIXTURE CLOSES A DOOR. IT DOES NOT FIX A BUG, AND SAYING SO IS WHY IT SURVIVES.
 * The audit found two real gaps and NEITHER IS LIVE — no `hsl` exists in this codebase and every
 * studio token is oklch. A fixture presented as a fix invites "which bug did it catch", the honest
 * answer is none, and someone deletes it on those grounds.
 *
 * ⚠ AND IT ASSERTS THE NEGATIVE SIDE, WHICH IS THE HALF THAT PREVENTS RECURRENCE. Both of this
 * arc's parser defects reported ABSENCE rather than erroring — `parseOklch` returned null for the
 * percentless form, #338's regex simply did not match `rgba()`. ABSENCE IS THE ONE ANSWER THAT
 * NEVER LOOKS WRONG, so the fixture asks what the matcher cannot read and requires the list to be
 * exactly what it claims. */
const FORM_SAMPLES = {
  "hex-3": ["#abc", [170, 187, 204]],
  "hex-4": ["#abcd", [170, 187, 204]],
  "hex-6": ["#4a4239", [74, 66, 57]],
  "hex-8": ["#4a423980", [74, 66, 57]],
  rgb: ["rgb(120, 90, 60)", [120, 90, 60]],
  rgba: ["rgba(233, 226, 214, 0.78)", [233, 226, 214]],
  hsl: ["hsl(0, 0%, 100%)", [255, 255, 255]],
  hsla: ["hsla(0, 0%, 0%, 0.5)", [0, 0, 0]],
  "oklch-percent": ["oklch(14.0% 0.018 60)", [15, 7, 3]],
  "oklch-plain": ["oklch(0.14 0.018 60)", [15, 7, 3]],
  "oklch-alpha": ["oklch(0.14 0.018 60 / 0.06)", [15, 7, 3]],
  named: ["white", [255, 255, 255]],
  transparent: ["transparent", [0, 0, 0]],
};
t("M1 the declared form list matches the fixture exactly — no form claimed without a sample",
  [...COLOUR_FORMS].sort(), Object.keys(FORM_SAMPLES).sort());
for (const [form, [sample, want]] of Object.entries(FORM_SAMPLES)) {
  t(`M2 ${form} — ${sample}`, parseColor(sample), want);
}
/* ⚠ THE NEGATIVE ROWS. A matcher that returns null for everything would pass every M2 above if the
 * samples were removed; these require it to REFUSE what is genuinely unreadable, so "reads
 * nothing" and "reads everything" are distinguishable. */
t("M3 …and it refuses what it genuinely cannot read, so null means something",
  ["#ab", "#abcde", "oklch(bananas)", "not-a-colour", ""].map((v) => parseColor(v)),
  [null, null, null, null, null]);
/* The scanner and the parser must agree: anything the scanner finds, the parser must read. */
const scanned = "a #abc b rgb(1,2,3) c oklch(0.5 0.1 60 / .5) d hsl(0,0%,100%) e".match(colourPattern()) ?? [];
t("M4 every form the SCANNER finds, the PARSER can read — a disagreement is a silent zero",
  scanned.filter((c) => parseColor(c) === null), []);

/* ⚠ M5 IS THE HALF THIS FIXTURE HAS NEVER HAD. M1..M4 all ask what the matcher CAN see; M3 asks
 * what it cannot READ. NONE of them asked what it MUST NOT MATCH.
 *
 * Both of this arc's earlier parser defects were things the matcher could not see — the percentless
 * oklch, and `rgba()` missing from a verification regex. This is the first it saw and should not
 * have: `&#8594;` is an HTML entity for an arrow, and `#8594` is a valid four-digit hex.
 *
 * ⚠ AND THE FALSE-POSITIVE DIRECTION IS THE WORSE ONE FOR THIS INSTRUMENT, WHICH IS WHY THE GUARD
 * BELONGS HERE RATHER THAN IN A CALLER.
 *
 *   A MISSED COLOUR IS A LEAK THE RENDER EVENTUALLY SHOWS.
 *   A PHANTOM COLOUR BECOMES A ROW WITH AN INVENTED REASON in the one document whose entire value
 *   is that its reasons are arguable.
 *
 * The first self-corrects the moment somebody looks at the page. The second never does — nobody
 * re-opens a boundary entry to ask whether its subject was ever a colour. */
const MUST_NOT_MATCH = [
  ["&#8594;", "HTML entity for an arrow — the one that actually got through"],
  ["hover &#8594;", "…and in the string it was found in"],
  ["&#160;", "non-breaking space entity"],
  ["x#abc", "a fragment identifier, not a colour"],
  ["#abcdefgh", "eight characters, but not all hex"],
];
t("M5 ⚠ AND IT MATCHES NOTHING THAT IS NOT A COLOUR — the half that has never been asserted",
  MUST_NOT_MATCH.filter(([str]) => (str.match(colourPattern()) ?? []).length > 0).map(([s]) => s), []);

console.log("\nA · the built CSS bundle — every colour the stylesheet actually ships");

const cssFiles = readdirSync(url(CSS_DIR)).filter((f) => f.endsWith(".css"));
t("A1 there is a built bundle to read — a zero denominator is not a pass", cssFiles.length > 0, true);

/** Split a stylesheet into declarations, keeping the property so `--color-*` can be excluded. */
function* declarations(css) {
  for (const m of css.matchAll(/([-a-zA-Z][\w-]*)\s*:\s*([^;{}]+)[;}]/g)) yield { prop: m[1], value: m[2] };
}

/* ⚠ TAILWIND EMITS A HEX FALLBACK BESIDE EVERY `color-mix` UTILITY, AND COUNTING THOSE OVERSTATES
 * THE LEAK BY 40%. `border-ink-950/8` compiles to `border-color:#0f070314` in the base cascade AND
 * to `color-mix(in oklab, var(--color-ink-950) 8%, transparent)` inside
 * `@supports (color:color-mix(in lab,red,red))`. Every modern browser takes the second, so the hex
 * paints only where `color-mix` is unsupported — and a browser that cannot do `color-mix` cannot do
 * the theme either. Those are COMPILER OUTPUT, not authored colour.
 *
 * ⚠ AND THE FIRST VERSION OF THIS DISCRIMINATION RETURNED ZERO, because the regex bounding the
 * `@supports` block could not see nesting and never matched. Brace-matched here for the same reason
 * `theme-contrast` brace-matches `@theme`: a lazy pattern ends early on a nested rule and reports a
 * confident wrong number rather than failing. */
function* bracedBlocks(src, header) {
  let i = 0;
  for (;;) {
    const j = src.indexOf(header, i);
    if (j < 0) return;
    const k = src.indexOf("{", j);
    let depth = 0;
    let closed = -1;
    for (let p = k; p < src.length; p++) {
      if (src[p] === "{") depth++;
      else if (src[p] === "}" && --depth === 0) { closed = p; break; }
    }
    if (closed < 0) return;
    yield { body: src.slice(k + 1, closed), start: j, end: closed + 1 };
    i = closed + 1;
  }
}

/* ============================================================================================
   ⚠ THREE EXCLUSIONS, EACH A PROPERTY OF THE VALUE RATHER THAN A JUDGEMENT — which is what makes
   them safe to encode rather than to rule on.

   ⚠ AND THE FINDING THAT FORCED THEM: THE CENSUS COUNTED THE MOST THEMED FORM A COLOUR CAN TAKE AS
   A LITERAL. `oklch(from var(--bounce) l c h / .84)` is relative colour syntax over a token —
   strictly MORE themed than a plain `var()` — and it appeared 14 times in the pool as authored
   colour. **The instrument built to replace a NAME-blind census was DERIVATION-blind.** Step 1
   could not see where a colour lived; this one could not see what a colour is MADE OF.

   IT SURVIVED BECAUSE IT OVER-REPORTS. E1's blind spot was silent; this one was noisy, and noise
   reads as thoroughness until someone reads the rows.

   1 · DERIVED VALUES. Stripped by FORM, not by substring. ⚠ "contains var(--color-" is NOT the same
       test as "is derived" — a gradient with one token stop and one literal stop would pass a
       contains-check while carrying a real leak. So the derivation EXPRESSIONS are removed and
       whatever remains is still scanned.
   2 · MASK CHANNELS. `#000` in `mask-image` is an ALPHA CHANNEL, not a paint: black means opaque.
       ⚠ A FOURTH KIND OF BOUNDARY ENTRY — not artwork, not signature, not forced-literal, but NOT
       A COLOUR AT ALL, and so structurally unthemeable.
   3 · `--tw-*` INITIAL VALUES. Compiler defaults, the same argument as the `@supports` fallbacks.
============================================================================================ */

/** A value with its DERIVATIONS removed, so only genuinely authored colour remains.
 *
 * ⚠ `color-mix()` IS STRIPPED ONLY WHEN IT CONTAINS NO LITERAL. One token stop beside a literal
 * stop is a real leak, and a `contains var(--color-` check would have waved it through — which is
 * the precision fix buying a new blind spot with the old one. A5b asserts exactly that case. */
function authoredPart(value) {
  /* `oklch(from var(--x) …)` is always a derivation — the `from` keyword names its source. */
  let v = value.replace(/oklch\(\s*from\s+var\(--[^)]*\)[^)]*\)/g, " ");
  let out = "", i = 0;
  while (i < v.length) {
    const j = v.indexOf("color-mix(", i);
    if (j < 0) { out += v.slice(i); break; }
    out += v.slice(i, j);
    let depth = 0, end = v.length;
    for (let p = j + "color-mix".length; p < v.length; p++) {
      if (v[p] === "(") depth++;
      else if (v[p] === ")" && --depth === 0) { end = p + 1; break; }
    }
    const body = v.slice(j, end);
    const withoutVars = body.replace(/var\(--[^)]*\)/g, " ");
    /* A literal survives inside -> keep the body so it is scanned. Otherwise drop it. */
    out += new RegExp(COLOUR.source).test(withoutVars) ? withoutVars : " ";
    i = end;
  }
  return out;
}

const SUPPORTS = "@supports (color:color-mix(in lab,red,red))";
const cssLeaks = new Map();
const cssPairs = new Set();
let fallbacks = 0;
for (const f of cssFiles) {
  const css = readFileSync(url(`${CSS_DIR}/${f}`), "utf8");

  /* Which selector+property pairs have a `var(--color-*)` form that supersedes the base one. */
  const enhanced = new Set();
  const spans = [];
  for (const { body, start, end } of bracedBlocks(css, SUPPORTS)) {
    spans.push([start, end]);
    for (const r of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const d of r[2].split(";")) {
        if (d.includes(":") && d.includes("var(--color-")) enhanced.add(`${r[1].trim()}|${d.split(":")[0].trim()}`);
      }
    }
  }
  let base = "", last = 0;
  for (const [s, e] of spans) { base += css.slice(last, s); last = e; }
  base += css.slice(last);

  for (const r of base.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const sel = r[1].trim();
    for (const d of r[2].split(";")) {
      if (!d.includes(":")) continue;
      const prop = d.slice(0, d.indexOf(":")).trim();
      if (prop.startsWith("--color-")) continue;
      if (prop.startsWith("--tw-")) continue;                    // compiler default
      /* ⚠ AND INSIDE AN `@property` BLOCK the "property" is `property --tw-…`, which the prefix
         test above cannot reach. Same compiler default, one syntax further out. */
      if (/^property\s+--tw-/.test(prop)) continue;
      if (/mask-image$|^mask$/.test(prop)) continue;             // alpha channel, not paint
      for (const c of (authoredPart(d.slice(d.indexOf(":") + 1)).match(COLOUR) ?? [])) {
        const key = c.replace(/\s+/g, "");
        if (key === "#0000") continue;              // Tailwind's `transparent`
        if (enhanced.has(`${sel}|${prop}`)) { fallbacks++; continue; }
        cssLeaks.set(key, (cssLeaks.get(key) ?? 0) + 1);
        cssPairs.add({ v: key, sel });                 // the join's left-hand side
      }
    }
  }
}

/* ⚠ REPORTED, NOT ASSERTED TO ZERO — YET. This suite's first job is to MEASURE, because the number
 * is the finding and nobody knows it. The assertion that this set equals a reviewed boundary list
 * lands once the owner has ruled on the categories; asserting zero today would fail on 200+ rows
 * and tell nobody anything. What IS asserted is that the census found a real population and that
 * the instrument works. */
const cssTotal = [...cssLeaks.values()].reduce((a, b) => a + b, 0);
console.log(`         ${cssLeaks.size} distinct AUTHORED literals, ${cssTotal} occurrences, in built CSS`);
console.log(`         ${fallbacks} compiler @supports fallbacks EXCLUDED — superseded by a var() form`);

/* THE NAMED-PROPERTY SUB-POPULATION, which is where 8 of the owner's 11 live. */
const customProps = new Map();
for (const m of globals.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
  if (m[1].startsWith("--color-")) continue;
  /* ⚠ RAW, NOT WHITESPACE-STRIPPED. The first version stored `c.replace(/\s+/g,"")`, which turned
     `oklch(98.5% 0.012 80 / .72)` into a string A3's parser — which requires whitespace BETWEEN the
     components — could never match. A3 then compared an empty set to an empty set and passed on
     every mutation. Found by mutation, and it is the vacuous shape one more time: the assertion was
     correct, its input had been destroyed upstream by a normalisation nobody re-read. */
  const lits = m[2].match(COLOUR) ?? [];
  if (lits.length) customProps.set(m[1], lits);
}
const publicProps = [...customProps.keys()].filter((n) => !n.startsWith("--studio-"));
console.log(`         ${customProps.size} custom properties hold a literal colour — ${publicProps.length} public, ${customProps.size - publicProps.length} studio`);

/* ⚠ NON-EMPTY, NOT A MAGNITUDE — AND THE THRESHOLD VERSION FAILED THE DAY THE SITE IMPROVED. This
 * read `> 20`, which was true while the leaks were many and became false when the aura collapse in
 * #360 took the authored count to 16. A GUARD THAT FAILS WHEN THE DEFECT IS REPAIRED PUNISHES THE
 * FIX — exactly what A6 read before #332 corrected it, arriving a second time in the same file.
 *
 * The job here is "the scan is not silently matching nothing". That is a question about the
 * MECHANISM, and A2b's fallback discrimination plus J1's join are what test its correctness. The
 * count only has to be non-zero. */
t("A2 the census finds a real population — it is not silently matching nothing", cssLeaks.size > 0, true);
t("A2b ⚠ AND IT SEPARATES COMPILER OUTPUT FROM AUTHORED COLOUR — a zero here means the brace matcher stopped seeing nesting again",
  fallbacks > 50, true);
/* ⚠ THE WITNESS BECAME THE CATEGORY, BECAUSE #332 FIXED THE THING A3 POINTED AT. A3 pinned
 * `--glass-fill` holding `--color-cream-50`'s value longhand. That property now derives from the
 * token, so pinning it would assert a defect that no longer exists — and deleting the row would
 * lose the only check for the SHAPE. So the assertion generalises: NO custom property outside the
 * token namespace may hold a colour a token already names.
 *
 * ⚠ COMPARED NUMERICALLY, NOT AS STRINGS, AND THAT IS NOT A DETAIL. The first classification of
 * these 22 compared spellings — `14%` against `14.0%` — and reported ONE longhand duplicate where
 * there were ELEVEN. A census whose premise is "enumerate by value, not by name" was name-based one
 * layer in. */
/* ⚠ THE SHARED KEY ON BOTH SIDES, AND THE OLD ONE WAS OKLCH-ONLY ON BOTH. `tokenByValue` was built
 * from `--color-*: oklch(…)` and the comparison ran through a local oklch parser, so FOUR PUBLIC
 * TOKENS THIS ARC ITSELF CREATED were invisible to A3: `--color-text-body` (#4a4239),
 * `--color-rule`, `--color-vessel-ink` and `--color-vessel-capsule`, all declared as hex or rgb
 * BECAUSE #327 measured that re-expressing them as oklch shifted the colour.
 *
 * A3's wording claimed "no custom property holds a colour A TOKEN already names". Its reach was
 * "…a colour an OKLCH-DECLARED token already names". The gap was live and in a STANDING gate, which
 * overturns the handoff's provisional finding that only a throwaway regex was affected. */
const okl = colourKey;
const themeSrc = globals.slice(globals.indexOf("@theme"), globals.indexOf('[data-theme="harbour"]'));
const tokenByValue = new Map();
for (const m of themeSrc.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
  const k = colourKey(m[2].trim());
  if (k && !tokenByValue.has(k)) tokenByValue.set(k, m[1]);
}
const longhand = [];
for (const [name, lits] of customProps) {
  if (name.startsWith("--studio-")) continue;
  for (const c of lits) {
    const k = okl(c);
    if (k && tokenByValue.has(k)) longhand.push(`${name} = --color-${tokenByValue.get(k)}`);
  }
}
t("A3 ⚠ NO CUSTOM PROPERTY HOLDS A COLOUR A TOKEN ALREADY NAMES — named, not counted",
  [...new Set(longhand)].sort(), []);
t("A4 …and the comparison is NUMERIC, so `14%` and `14.0%` cannot read as different colours",
  okl("oklch(14% 0.018 60)") === okl("oklch(14.0% 0.018 60 / 0.06)"), true);
/* ⚠ THE GUARD ON THE PRECISION FIX ITSELF. A derivation must vanish; a literal sitting BESIDE a
 * derivation must not. Without this, "strip anything mentioning a token" would silently delete
 * half of a gradient. */
t("A5b a pure derivation is stripped", authoredPart("oklch(from var(--bounce) l c h / .84)").match(COLOUR), null);
t("A5b …and a literal BESIDE a token in one value survives the strip",
  (authoredPart("linear-gradient(var(--color-canvas), #ff0000)").match(COLOUR) ?? []), ["#ff0000"]);
t("A5b …and a color-mix carrying a literal is not mistaken for a derivation",
  (authoredPart("color-mix(in oklch, #2e1a47 52%, transparent)").match(COLOUR) ?? []), ["#2e1a47"]);
t("A5b …while a color-mix over a token alone is",
  authoredPart("color-mix(in srgb, var(--color-ink-950) 8%, transparent)").match(COLOUR), null);

t("A5b the token index now sees NON-OKLCH tokens — four of them, all created by this arc",
  ["#4a4239", "rgb(120, 90, 60)", "rgb(23, 20, 18)", "rgb(222, 213, 199)"]
    .every((v) => tokenByValue.has(colourKey(v))), true);

t("A5 the token index is populated — a zero here would make A3 pass by comparing against nothing",
  tokenByValue.size > 15, true);
/* ⚠ AND THE OTHER SIDE OF THE COMPARISON, WHICH IS THE SIDE THAT WAS EMPTY. Asserting only the
 * token index is what let the vacuous version through — A3 compared a populated set against
 * nothing and passed on every mutation.
 *
 * ⚠ BUT A POPULATION THRESHOLD IS THE WRONG GUARD, AND ITS FIRST VERSION PROVED THAT WITHIN THE
 * SAME PR. It read "more than 10 parse", which was true while the duplicates existed and FALSE
 * once they were fixed — a guard that fails when the defect is repaired is a guard that punishes
 * the fix. So it asserts the MECHANISM instead: every `oklch()` a custom property holds must
 * survive into a parseable key. That holds at any population size, including zero, and it is the
 * actual thing the whitespace normalisation broke. */
const oklLits = [...customProps.values()].flat().filter((c) => /^oklch\(/.test(c));
t("A6 …and nothing is silently dropped between reading a colour and parsing it",
  oklLits.filter((c) => !okl(c)), []);

console.log("\nA-c · utility classes resolved back to the file that USES them");

/* ⚠ RESOLVED, NOT EXCLUDED BY LOOKUP — AND THE DIFFERENCE IS THE WHOLE POINT. Excluding studio
 * utilities by a name lookup would bury a JUDGEMENT INSIDE A FILTER, which is the shape
 * categories-as-data was built to fix. Resolving the consumer produces a ROW a person can disagree
 * with: "components/studio/CaseStudyItem.tsx — ships publicly, no public consumer."
 *
 * ⚠ AND THIS IS THE MIRROR OF THE PROJECT'S EMISSION RULE. "Ask where a cost is EMITTED, not where
 * the feature is USED" was written when a studio-only font preload charged every public page. The
 * census reads what is EMITTED and cannot tell who USES it. Both directions give a wrong answer, so
 * the rule is not "use emission" or "use consumption" — it is ASK WHICH ONE THE QUESTION IS ABOUT.
 * Cost is an emission question. Themeability is a consumption question. A bundle that merges the
 * two is why they keep being confused. */
const sourceFiles = [];
const walkSrc = (rel) => {
  for (const e of readdirSync(url(rel), { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walkSrc(child);
    else if (/\.tsx?$/.test(e.name)) sourceFiles.push({ rel: child, src: read(child) });
  }
};
["components", "app", "lib"].forEach(walkSrc);


/** A Tailwind-escaped selector back to the class an author typed. */
const unescapeClass = (sel) => sel.replace(/^\./, "").replace(/\\/g, "");
const consumersOf = (cls) => sourceFiles.filter((f) => f.src.includes(cls)).map((f) => f.rel);

/* Only COLOUR-bearing utilities — this census is about colour. The wider population (122 of 342
 * arbitrary utilities are studio-only, including spacing and position) is #274's 23.4% seam at full
 * granularity, and it is a bundle-size question rather than a theme one. */
const arbitrary = [...new Set(cssFiles.flatMap((f) =>
  [...readFileSync(url(`${CSS_DIR}/${f}`), "utf8").matchAll(/(\.[a-z-]+\\\[[^{]*?\\\])\{([^}]*)\}/g)]
    .filter((m) => COLOUR.test(m[2]) && (COLOUR.lastIndex = 0, true))
    .map((m) => m[1])))];
const resolved = arbitrary.map((sel) => ({ sel, cls: unescapeClass(sel), files: consumersOf(unescapeClass(sel)) }))
  .filter((r) => r.files.length);
const studioOnly = resolved.filter((r) => r.files.every((f) => f.includes("/studio")));

console.log(`         ${resolved.length} COLOUR-bearing arbitrary utilities resolved to a consumer`);
console.log(`         ${studioOnly.length} of them ship PUBLICLY with NO PUBLIC CONSUMER`);
for (const r of studioOnly.slice(0, 4)) console.log(`           ${r.cls.slice(0, 40)}  <-  ${r.files[0]}`);

t("Ac1 utility classes resolve to a consuming file — the lookup is recoverable, not a guess",
  resolved.length > 0, true);
/* ⚠ THE FINDING ASSERTED, NOT JUST REPORTED. #274 measured 23.4% of the stylesheet as studio-only
 * rules the public site downloads; these are the same seam at colour granularity. They are
 * unthemeable AND unreachable — a theme cannot move them and no visitor sees them — so they are not
 * a leak in either direction. Recording them is honest; fixing them is not this arc's work. */
t("Ac2 the studio-only public utilities are found, so the mirror is measured rather than asserted",
  studioOnly.length > 0, true);

console.log("\nB · SVG presentation attributes — never in a stylesheet, never in a className");

const files = [];
const walk = (rel) => {
  for (const e of readdirSync(url(rel), { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) { if (!child.includes("studio")) walk(child); }
    else if (/\.tsx?$/.test(e.name)) files.push(child);
  }
};
["components", "app", "lib"].forEach(walk);

/* ⚠ EXCLUDED BY WHAT THE FILE IS FOR, NOT BY DIRECTORY. `lib/theme-contrast.ts` is the INSTRUMENT:
 * its `FORM_SAMPLES` are the coverage fixture, the evidence that the matcher reads every colour
 * form. Scanning it made the census report those samples as unclassified page colours.
 *
 * AN INSTRUMENT THAT SCANS ITS OWN EVIDENCE REPORTS ITS OWN CORRECTNESS AS A DEFECT. That is the
 * cleanest contaminated input this arc produced — not the record of a defect, but the proof of a
 * repair, read as the thing it repaired.
 *
 * ⚠ AND `lib/` IS NOT THE EXCLUSION, BECAUSE `lib/` HOLDS REAL PAGE COLOUR. `lib/theme.ts` carries
 * the PWA splash map and `lib/og.tsx` the social-card hexes, both live and both boundary-listed.
 * Excluding the neighbourhood would buy a new blind spot in exactly the place the last four came
 * from. */
const INSTRUMENT = new Set(["components/../lib/theme-contrast.ts", "lib/theme-contrast.ts"]);
const isInstrument = (rel) => INSTRUMENT.has(rel.replace(/^\.?\//, ""));

for (let i = files.length - 1; i >= 0; i--) if (isInstrument(files[i])) files.splice(i, 1);
t("B0 the instrument itself is not scanned as a page — its fixture is evidence, not colour",
  files.some(isInstrument), false);

const srcPairs = new Set();          // the join's left side for populations B and C
const svgAttrs = new Map();
for (const rel of files) {
  const src = read(rel);
  for (const m of src.matchAll(/\b(fill|stroke|stopColor|floodColor|lightingColor)\s*=\s*["'{]?\s*["']?(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|oklch\([^)]*\))/g)) {
    svgAttrs.set(rel, (svgAttrs.get(rel) ?? 0) + 1);
    srcPairs.add({ v: m[2].replace(/\s+/g, ""), file: rel });
  }
}
const svgTotal = [...svgAttrs.values()].reduce((a, b) => a + b, 0);
console.log(`         ${svgTotal} SVG colour attributes across ${svgAttrs.size} public files`);
for (const [f, n] of [...svgAttrs].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`           ${String(n).padStart(3)}  ${f}`);
t("B1 the SVG population is found — 75 of these were invisible to Step 1", svgTotal > 40, true);

console.log("\nC · runtime-generated colours in public JS");

const runtime = new Map();
for (const rel of files) {
  /* ⚠ TRAILING `//` COUNTS TOO, AND IT DID NOT UNTIL #362. This stripped block comments and
   * FULL-LINE `//` only, so `[+0.023, -0.020, +1.7],   // was #B5613C` reported a colour site that
   * is a note about a colour that no longer exists. PageLoader read 16 where the file holds 8.
   *
   * ⚠ AND THE CSS ROUTES ARE COMMENT-SAFE BY ACCIDENT RATHER THAN BY DESIGN — they read the BUILT
   * bundle, where the minifier has already removed comments. Nothing in this suite strips a CSS
   * comment, and nothing needs to; the consequence is that route C was the only place the question
   * was live, so it was the only place it went unanswered.
   *
   * The guard on the left is what keeps `https://` from being read as a comment: a `//` is only a
   * comment here when it does not follow a colon, a word character or a quote. Measured across every
   * public TS/TSX file before it shipped — exactly one file's count changed, and by exactly the
   * eight annotations. */
  const src = read(rel).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\w"'`])\/\/.*$/gm, "$1");
  let n = 0;
  for (const m of src.matchAll(COLOUR)) {
    const line = src.slice(src.lastIndexOf("\n", m.index) + 1, src.indexOf("\n", m.index));
    if (/\b(fill|stroke|stopColor|floodColor)\s*=/.test(line)) continue;   // counted in B
    if (/className=/.test(line)) continue;
    n++;
    srcPairs.add({ v: m[0].replace(/\s+/g, ""), file: rel });
  }
  if (n) runtime.set(rel, n);
}
const rtTotal = [...runtime.values()].reduce((a, b) => a + b, 0);
console.log(`         ${rtTotal} colour literals in ${runtime.size} public TS/TSX files, outside SVG attrs and classNames`);
for (const [f, n] of [...runtime].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`           ${String(n).padStart(3)}  ${f}`);
t("C1 the runtime population is found", rtTotal > 10, true);

console.log("\nC-svg · standalone SVG assets under public/ and app/");

/* ⚠ A `.svg` FILE UNDER `public/` WAS IN NO POPULATION AT ALL, WHICH IS THE EIGHT WEBPS' SHAPE. It
 * is not built CSS (A), not an SVG attribute inside a component (B), and not runtime JS (C) — so
 * every route missed it and nothing could have said so. `public/favicon.svg` ships the site's mark
 * with four baked literals.
 *
 * ⚠ AND IT GOES INTO `srcPairs` RATHER THAN ONLY BEING REPORTED, because a boundary row that joins
 * against nothing FAILS J3 — which is exactly what happened when the favicon row was written before
 * this route existed. #356 said the join covers every population; it covered A, B and C, and route
 * D's adjacent surfaces were never in it. This closes the half of that claim that was not true. */
/* ⚠ `app/` AS WELL AS `public/`, because the icon moved to the Next FILE CONVENTION in #367 — an
 * explicit `metadata.icons` had been overriding it while duplicate files sat in both places. A route
 * scanning only `public/` would have gone quiet the moment the asset moved, reporting zero and
 * passing, which is this suite's own recurring failure mode. */
const svgAssetFiles = [
  ...readdirSync(url("public")).filter((f) => f.endsWith(".svg")).map((f) => `public/${f}`),
  ...readdirSync(url("app")).filter((f) => /^(icon|apple-icon)\d*\.svg$/.test(f)).map((f) => `app/${f}`),
];
const publicSvgs = svgAssetFiles;
let svgAssetColours = 0;
for (const rel of publicSvgs) {
  for (const m of read(rel).matchAll(COLOUR)) { svgAssetColours++; srcPairs.add({ v: m[0].replace(/\s+/g, ""), file: rel }); }
}
console.log(`         ${svgAssetColours} colours in ${publicSvgs.length} standalone SVG asset file(s)`);
t("Csvg1 the standalone-SVG population is enumerated rather than assumed empty",
  publicSvgs.length > 0 && svgAssetColours > 0, true);

console.log("\nJ · ⚠ EMPTINESS — the join, asserted BOTH WAYS");

/* ⚠ A JOIN, NOT A REGEX EVALUATION. Every row names a colour's LOCATION — the selector the census
 * already extracts — and emptiness is a JOIN against those. A matcher in the YAML would be exactly
 * as unreviewable as one in this file, and this arc has already produced two filters that
 * disagreed with each other.
 *
 * THREE THINGS THE JOIN BUYS THAT A PATTERN CANNOT.
 *   · A STALE ROW FAILS. If a colour is refactored away its entry matches nothing, and an entry
 *     matching nothing is a decision that outlived its subject — reported rather than silently
 *     satisfied.
 *   · AN ENTRY CANNOT OVER-MATCH. A regex written for one hero aura silently covers a second
 *     colour that arrives later; a selector list cannot. That is the exact mechanism by which E1's
 *     subject shrank and nobody noticed.
 *   · THE PROSE STAYS THE POINT. The reason is what a person reads and the join is what the gate
 *     reads, and neither pretends to be the other.
 *
 * ⚠ THE ESCAPED-UTILITY ROW IS THE ONE EXCEPTION AND IT IS DECLARED, NOT ASSUMED. A Tailwind
 * arbitrary utility's selector IS its value, so listing them would restate the pool. That row says
 * `selectors_match: escaped-arbitrary-utility` — a named shape rather than a regex, and the one
 * place a row is matched structurally instead of by name. */
/* ⚠ THE LEFT SIDE WAS THE BUILT CSS ALONE, AND J1's WORDING WAS NOT. "Every authored colour is
 * claimed by exactly one row" read as total and covered 4 of 15 entries — the SVG and runtime
 * populations were COUNTED in B and C and never joined, so eleven rows including the cursor and the
 * loader could go stale with nothing to say so.
 *
 * ⚠ THAT IS THIS ARC'S CENTRAL DEFECT SITTING IN ITS FINAL GATE: a completeness assertion whose
 * subject is narrower than it reads. E1 was caught four times for exactly this and the join
 * inherited it, because nobody asked what its LEFT SIDE was.
 *
 * NOW: CSS pairs join on SELECTOR, source pairs join on FILE, and every entry must be joinable or
 * declare itself a CATEGORY — a mechanical rule about a value's form rather than a place. */
const rows = BOUNDARY.entries.filter((e) => e.selectors || e.selectors_match || e.files);
const categories = BOUNDARY.entries.filter((e) => e.entry_kind === "category");
t("J0 ⚠ EVERY BOUNDARY ENTRY IS JOINABLE OR DECLARES ITSELF A CATEGORY — the coverage of the join, asserted rather than assumed",
  BOUNDARY.entries.filter((e) => !rows.includes(e) && !categories.includes(e)).map((e) => e.id), []);
t("J0b …and both kinds exist, so J0 cannot pass by everything being one of them",
  rows.length > 5 && categories.length === 3, true);
const matchRow = (e, sel) =>
  e.selectors_match === "escaped-arbitrary-utility" ? /\\\[/.test(sel)
    : (e.selectors ?? []).includes(sel);

const matchFile = (e, file) => (e.files ?? []).some((f) => file === f || file.startsWith(f));
const poolPairs = [...cssPairs];
const filePairs = [...srcPairs];
const unclaimed = poolPairs.filter((p) => !rows.some((e) => matchRow(e, p.sel)));
t("J1 ⚠ EVERY AUTHORED COLOUR IN THE BUILT CSS IS CLAIMED BY EXACTLY ONE BOUNDARY ROW",
  unclaimed.map((p) => `${p.v} in ${p.sel}`).sort(), []);
t("J1b ⚠ AND EVERY COLOUR IN THE SVG AND RUNTIME POPULATIONS TOO — the half the join could not see until #356",
  [...new Set(filePairs.filter((p) => !rows.some((e) => matchFile(e, p.file)))
    .map((p) => p.file))].sort(), []);
t("J2 …and none is claimed TWICE, which would make one of the two reasons a lie",
  poolPairs.filter((p) => rows.filter((e) => matchRow(e, p.sel)).length > 1)
    .map((p) => `${p.v} in ${p.sel}`), []);

/* ⚠ THE DIRECTION NOTHING IN THIS PROJECT HAS EVER CHECKED. Every boundary list this arc produced
 * was declared complete and was not — but none could go STALE, because none was ever joined against
 * anything. This is the first assertion here that can catch a decision outliving its subject.
 *
 * WHEN IT FAILS THE REPAIR IS PER ROW, and the three causes have different answers: the colour was
 * refactored away and the row should go; the colour moved file and the location is stale; or THE
 * CENSUS CANNOT SEE IT AND THE ROW IS FINE WHILE THE INSTRUMENT IS NOT. The third is the dangerous
 * one — deleting a row because the census cannot find its subject is how a real exclusion becomes a
 * silent leak. */
const stale = rows.filter((e) =>
  !poolPairs.some((p) => matchRow(e, p.sel)) && !filePairs.some((p) => matchFile(e, p.file)));
t("J3 ⚠ EVERY BOUNDARY ROW STILL MATCHES SOMETHING — a row matching nothing has outlived its subject",
  stale.map((e) => e.id).sort(), []);
/* ⚠ THIS SUITE READS THE BUILT BUNDLE, SO A SOURCE MUTATION NEEDS A REBUILD BEFORE IT IS VISIBLE.
 * J1 reported SURVIVED against an edited `globals.css` until the bundle was rebuilt — the mutation
 * had applied to the SOURCE but not to the SUBJECT. That is the never-applied family in a new
 * guise, and `mutate.mjs` cannot see it because it does not know a suite's subject is build output.
 * Rebuild, then mutate. */
/* ⚠ `count:` WAS A SIXTEEN-ROW FIGURE NOTHING READ, AND IT WOULD HAVE CAUGHT THE ONE DEFECT #362
 * FOUND. The census reported 16 colours in `PageLoader.tsx` where the file holds 8 — the other
 * eight were `// was #B5613C` annotations the stripper missed. The row said `count: 8` the whole
 * time. A number in the record and a number in the instrument disagreed by a factor of two, and
 * NOTHING COMPARED THEM, because the join matched on file and never on quantity.
 *
 * ⚠ AND IT IS COUNTED PER ROW, NOT PER FILE. The first probe written for this counted every colour
 * in a row's FILES and reported two mismatches that were not real — `pwa-chrome-colour` and
 * `adjacent-surfaces` share `lib/theme.ts`, so each was charged for the other's colours. THAT IS THE
 * SUBJECT-SCOPED-BY-INSTRUMENT SHAPE ONE MORE TIME, in the probe written to check the record. A row's
 * count is about ITS OWN subject, and the join already holds exactly those pairs — so they are
 * counted there rather than re-derived from the filesystem.
 *
 * Rows without a `count:` are skipped rather than assumed zero, and J5b asserts that the counted set
 * is most of the rows, so this cannot go quiet by the field falling out of the file. */
/* ⚠ SUMMED PER FILE, BECAUSE A FILE CAN HOST TWO ROWS AND A COUNT IS PER SUBJECT. The first build
 * of this charged each row for every colour in its files, so `pwa-chrome-colour` (1 colour, ruled)
 * and `pwa-splash-ground` (3, ruled) each read as claiming all 4 of `lib/theme.ts` — TWO FALSE
 * MISMATCHES CREATED BY THE INSTRUMENT, which is the subject-scoped-by-instrument shape appearing
 * inside the check written to audit the record. Adding the missing row made it WORSE rather than
 * better, which is the tell.
 *
 * The units are what disagreed. `count` is per SUBJECT and the source join is per FILE, so the only
 * expression that is exact in both is the SUM over a file. It needs no new key in the boundary, and
 * a per-file total that is short by one is precisely a colour no row rules on. */
const counted = rows.filter((e) => typeof e.count === "number");
const byFile = new Map();
for (const p of filePairs) byFile.set(p.file, (byFile.get(p.file) ?? 0) + 1);

/* ⚠ THE UNIT IS A CONNECTED COMPONENT, AND THIS INSTRUMENT WAS WRONG THREE TIMES BEFORE IT WAS
 * RIGHT — each time by choosing a unit the RECORD does not use.
 *
 *   per row   charged each row for every colour in its files → two false mismatches on a shared file
 *   per file  charged every file a multi-file row's TOTAL    → five false mismatches
 *   per group exact
 *
 * A row's count is one number covering ALL its files, and a file may host several rows. So neither
 * side is the unit: the smallest region where "what was ruled" and "what is there" are both
 * well-defined is the COMPONENT of files linked by shared rows. Every other choice double-counts in
 * one direction or the other.
 *
 * ⚠ AND EVERY ONE OF THE THREE WRONG VERSIONS PRODUCED CONFIDENT, SPECIFIC, FALSE FINDINGS — file
 * names and numbers, indistinguishable from the one real defect sitting among them. The real one
 * (ProcessSection) was present in all three runs and would have been dismissed with the noise. */
const parent = new Map();
const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
const link = (a, b) => { const [ra, rb] = [find(a), find(b)]; if (ra !== rb) parent.set(ra, rb); };
for (const f of byFile.keys()) parent.set(f, f);
for (const e of counted) {
  const fs = (e.files ?? []).filter((f) => parent.has(f));
  for (let k = 1; k < fs.length; k++) link(fs[0], fs[k]);
}
const found = new Map(), says = new Map();
for (const [f, n] of byFile) found.set(find(f), (found.get(find(f)) ?? 0) + n);
for (const e of counted) {
  const fs = (e.files ?? []).filter((f) => parent.has(f));
  if (!fs.length) continue;
  says.set(find(fs[0]), (says.get(find(fs[0])) ?? 0) + e.count);
}
const members = (g) => [...byFile.keys()].filter((f) => find(f) === g).join(", ");
const fileGaps = [...says].filter(([g, n]) => found.get(g) !== n)
  .map(([g, n]) => `${members(g)}: rows declare ${n}, census finds ${found.get(g) ?? 0}`);
console.log(`         ${counted.length} of ${rows.length} rows declare a count, covering ${says.size} file groups`);
t("J5 ⚠ EVERY FILE GROUP'S DECLARED COUNTS SUM TO THE COLOURS THE CENSUS FINDS IN IT",
  fileGaps.sort(), []);

/* Selector-keyed rows are exact one-to-one, so those ARE checked per row. */
const selGaps = counted.filter((e) => e.selectors)
  .map((e) => ({ id: e.id, says: e.count, finds: poolPairs.filter((p) => matchRow(e, p.sel)).length }))
  .filter((c) => c.says !== c.finds)
  .map((c) => `${c.id} says ${c.says}, finds ${c.finds}`);
t("J5b …and a selector-keyed row, which joins one-to-one, matches its count exactly", selGaps.sort(), []);

t("J5c …and counts cover most rows and a real set of files, so J5 cannot pass by the field vanishing",
  counted.length >= Math.ceil(rows.length / 2) && says.size >= 3, true);

t("J4 the join has subjects on both sides, so J1 and J3 cannot pass by comparing two empty sets",
  poolPairs.length > 10 && filePairs.length > 10 && rows.length >= 4, true);


console.log("\nD · adjacent surfaces — REPORTED, and deliberately not folded into A, B or C");

/* ⚠ FOUND BY WRITING THE HEADER SECTION ABOUT WHAT A FOURTH ROUTE WOULD LOOK LIKE. These reach the
 * browser chrome and the social cards rather than the page, so calling them leaks would be the same
 * over-claim E1 made in the other direction. Counted, named, and left for a ruling. */
const adjacent = [];
/* ⚠ `public/favicon.svg` JOINS THIS ROUTE IN #366, AND IT WAS IN NO POPULATION BEFORE THAT — the
 * same shape the eight Fosfor webps had. A standalone `.svg` under `public/` is not built CSS, not
 * an SVG attribute in a component, and not runtime JS, so routes A, B and C all miss it. The
 * browser tab is an adjacent surface by the same test the OG card is: rendered by someone else's
 * chrome, never by this page. */
for (const rel of ["app/manifest.ts", "lib/og.tsx", ...svgAssetFiles]) {
  for (const m of read(rel).matchAll(COLOUR)) adjacent.push(`${rel}  ${m[0]}`);
}
console.log(`         ${adjacent.length} colours on adjacent surfaces (PWA splash, address bar, OG cards)`);
for (const a of adjacent.slice(0, 5)) console.log(`           ${a}`);
t("D0 the adjacent population is enumerated rather than assumed empty", adjacent.length > 0, true);

console.log("\nT · every theme defines the same TOKEN SET");

/* ⚠ A TOKEN CAN EXIST ON ONE PALETTE AND NOT THE OTHER, AND ONLY THE BUILD SHOWS IT.
 * `--color-accent-400` was declared for cream inside `@theme` and for harbour inside a plain
 * `[data-theme]` block. Tailwind PRUNES an `@theme` token nothing references; it does not touch a
 * plain block. So the shipped bundle held the token under harbour and nowhere at `:root` — one
 * asymmetry among 35 overrides, and nothing rendered wrong because nothing consumed it.
 *
 * ⚠ `theme-contrast` CANNOT CATCH THIS, AND NOT BY OVERSIGHT. It reads `app/globals.css`, where both
 * declarations plainly exist, and builds harbour as cream-plus-overrides — a merge that ASSUMES the
 * parity this asserts. THE DEFECT IS CREATED BY THE BUILD, so a source-level reader is structurally
 * blind to it, the same way `mutate.mjs` can confirm a source changed and not that the subject did.
 *
 * The failure this prevents is quiet: a `var(--color-x)` that resolves on one theme and silently
 * inherits on the other, appearing only when someone finally consumes it. */
const bundle = cssFiles.map((f) => readFileSync(url(`${CSS_DIR}/${f}`), "utf8")).join("\n");

/* ⚠ THE CSS BUNDLE IS THEME-INVARIANT, AND THAT FACT HAS HAD ITS MEANING INVERTED UNDER IT.
 *
 * #324 measured `css__all` IDENTICAL between two builds and explained it as "the expected
 * consequence of shipping NO token blocks" — true then, because no `[data-theme]` block existed.
 * #366 re-measured it identical and the reason is now the OPPOSITE: **ALL theme blocks ship in one
 * bundle and the HTML attribute selects among them.**
 *
 * SAME NUMBER, OPPOSITE CAUSE, AND NOTHING IN THE OUTPUT SIGNALS THE CHANGE. A measurement whose
 * value never moves while its meaning inverts cannot be cited without re-deriving it, which is
 * exactly what a record is supposed to save you from.
 *
 * ⚠ AND UNTIL NOW IT LIVED ONLY IN A HAND-RUN SNAPSHOT PROTOCOL, so the property depended on
 * somebody remembering to compare two builds. The property is real and it can break — a build that
 * emitted per-theme stylesheets, or dropped a theme's block from the bundle, would be caught by
 * nothing. So it is asserted here, where the reason travels with it. */
const themeBlockCount = [...bundle.matchAll(/\[data-theme=["']?[a-z-]+["']?\]/g)]
  .map((m) => m[0]).filter((v, i, a) => a.indexOf(v) === i);
console.log(`         ${themeBlockCount.length} distinct [data-theme] selectors in the single bundle`);
t("T0 ⚠ EVERY THEME'S BLOCK SHIPS IN ONE BUNDLE — the attribute selects, the bytes do not change",
  themeBlockCount.length >= 2, true);
t("T0b …and the published theme is not the only one present, which is what makes it switchable",
  themeBlockCount.some((s) => /harbour/.test(s)) && themeBlockCount.some((s) => /cream/.test(s)), true);


/* ⚠ EVERY MATCHING BLOCK, NOT THE FIRST. The first draft took `css.indexOf` / `css.search` and read
 * whichever block came first in the concatenated bundle — which was a `:root` holding no colour at
 * all, so the base palette measured ZERO and T2 passed over an empty set. T3 is what reported it.
 * That is the same last-wins/first-wins error `theme-contrast` made in #325 and `studio-ink-contrast`
 * made again later, arriving a third time; a bundle has many blocks with the same selector and the
 * palette is their UNION. */
const blocksFor = (re) => {
  const out = [];
  for (const m of bundle.matchAll(re)) {
    let d = 0, st = bundle.indexOf("{", m.index), k = st;
    if (st < 0) continue;
    for (; k < bundle.length; k++) { if (bundle[k] === "{") d++; else if (bundle[k] === "}") { d--; if (!d) break; } }
    out.push(bundle.slice(st + 1, k));
  }
  return out;
};
const themeBlock = (name) => {
  const bs = blocksFor(new RegExp(`\\[data-theme=["']?${name}["']?\\]`, "g"));
  return bs.length ? bs.join("\n") : null;
};
const rootBlock = blocksFor(/:root\b[^{]*/g).join("\n");
const tokenNames = (b) => new Set([...b.matchAll(/(--color-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const rootTokens = tokenNames(rootBlock);
console.log(`         :root defines ${rootTokens.size} --color-* tokens in the built bundle`);
t("T1 the base palette is a real population — a zero here means the block matcher stopped seeing",
  rootTokens.size > 30, true);

const orphans = [];
let checkedThemes = 0;
for (const name of ["harbour", "cream-verify"]) {
  const b = themeBlock(name);
  if (!b) continue;
  checkedThemes++;
  const names = tokenNames(b);
  console.log(`         [data-theme="${name}"] overrides ${names.size}`);
  for (const n of names) if (!rootTokens.has(n)) orphans.push(`${name} defines ${n}, :root does not`);
}
t("T2 ⚠ NO THEME DEFINES A TOKEN THE BASE PALETTE LACKS — a var() that resolves on one theme only",
  orphans.sort(), []);
t("T3 …and a theme block was actually found and read, so T2 cannot pass over nothing",
  checkedThemes >= 1, true);

console.log("\nE · the instrument's own honesty");
t("E1 it enumerates by VALUE, so a colour is caught regardless of what it is named",
  TOKEN_VALUES.size > 20 && cssLeaks.size > 0, true);
/* ⚠ THE ASSERTION THAT WOULD MAKE THIS SUITE A LIE is one that passes because the regex matched
 * nothing. Every population above is asserted non-empty, and the CSS one is asserted against a
 * known member rather than only a count. */
t("E2 every population is non-empty, so no section can pass by finding nothing",
  [cssLeaks.size, svgTotal, rtTotal].every((n) => n > 0), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
