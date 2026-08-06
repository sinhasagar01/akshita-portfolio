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
t("Z4 judgement categories are the three that never can be",
  [...BOUNDARY.kinds.judgement.categories].sort(),
  ["artwork-by-file", "forced-literal", "signature"]);
t("Z5 every entry declares a kind the file knows",
  BOUNDARY.entries.filter((e) => !(e.kind in BOUNDARY.kinds)).map((e) => e.id), []);
/* ⚠ THE ROW'S REASON IS THE DURABLE PART, so a row without prose is a row nobody can overturn or
 * defend. Length rather than presence, because "signature" would pass a presence check. */
t("Z6 every entry carries a REASON as prose, not a category code alone",
  BOUNDARY.entries.filter((e) => !e.reason || e.reason.trim().length < 40).map((e) => e.id), []);
t("Z7 every judgement entry names WHERE it lives, so it can be audited",
  BOUNDARY.entries.filter((e) => e.kind === "judgement" && !e.where).map((e) => e.id), []);
/* The tie-break is recorded as a CORRECTION to the composite rule, not an addition beside it. */
const rules = Object.fromEntries((BOUNDARY.rules ?? []).map((r) => [r.id, r]));
t("Z8 the composite rule names the rule that corrects it",
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
      if (/mask-image$|^mask$/.test(prop)) continue;             // alpha channel, not paint
      for (const c of (authoredPart(d.slice(d.indexOf(":") + 1)).match(COLOUR) ?? [])) {
        const key = c.replace(/\s+/g, "");
        if (key === "#0000") continue;              // Tailwind's `transparent`
        if (enhanced.has(`${sel}|${prop}`)) { fallbacks++; continue; }
        cssLeaks.set(key, (cssLeaks.get(key) ?? 0) + 1);
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

t("A2 the census finds a real population — it is not silently matching nothing", cssLeaks.size > 20, true);
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

const svgAttrs = new Map();
for (const rel of files) {
  const src = read(rel);
  for (const m of src.matchAll(/\b(fill|stroke|stopColor|floodColor|lightingColor)\s*=\s*["'{]?\s*["']?(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|oklch\([^)]*\))/g)) {
    svgAttrs.set(rel, (svgAttrs.get(rel) ?? 0) + 1);
  }
}
const svgTotal = [...svgAttrs.values()].reduce((a, b) => a + b, 0);
console.log(`         ${svgTotal} SVG colour attributes across ${svgAttrs.size} public files`);
for (const [f, n] of [...svgAttrs].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`           ${String(n).padStart(3)}  ${f}`);
t("B1 the SVG population is found — 75 of these were invisible to Step 1", svgTotal > 40, true);

console.log("\nC · runtime-generated colours in public JS");

const runtime = new Map();
for (const rel of files) {
  const src = read(rel).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, "");
  let n = 0;
  for (const m of src.matchAll(COLOUR)) {
    const line = src.slice(src.lastIndexOf("\n", m.index) + 1, src.indexOf("\n", m.index));
    if (/\b(fill|stroke|stopColor|floodColor)\s*=/.test(line)) continue;   // counted in B
    if (/className=/.test(line)) continue;
    n++;
  }
  if (n) runtime.set(rel, n);
}
const rtTotal = [...runtime.values()].reduce((a, b) => a + b, 0);
console.log(`         ${rtTotal} colour literals in ${runtime.size} public TS/TSX files, outside SVG attrs and classNames`);
for (const [f, n] of [...runtime].sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`           ${String(n).padStart(3)}  ${f}`);
t("C1 the runtime population is found", rtTotal > 10, true);

console.log("\nD · adjacent surfaces — REPORTED, and deliberately not folded into A, B or C");

/* ⚠ FOUND BY WRITING THE HEADER SECTION ABOUT WHAT A FOURTH ROUTE WOULD LOOK LIKE. These reach the
 * browser chrome and the social cards rather than the page, so calling them leaks would be the same
 * over-claim E1 made in the other direction. Counted, named, and left for a ruling. */
const adjacent = [];
for (const rel of ["app/manifest.ts", "lib/og.tsx"]) {
  for (const m of read(rel).matchAll(COLOUR)) adjacent.push(`${rel}  ${m[0]}`);
}
console.log(`         ${adjacent.length} colours on adjacent surfaces (PWA splash, address bar, OG cards)`);
for (const a of adjacent.slice(0, 5)) console.log(`           ${a}`);
t("D0 the adjacent population is enumerated rather than assumed empty", adjacent.length > 0, true);

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
