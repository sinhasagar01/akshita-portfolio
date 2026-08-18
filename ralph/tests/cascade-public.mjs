// THE CASCADE GATE, WIDENED PAST /studio — every utility the unlayered element rules defeat.
// Run: node ralph/tests/cascade-public.mjs
//
// ---- WHY THIS EXISTS SEPARATELY FROM studio-cascade ------------------------------------------
//
// `studio-cascade` scans `components/studio` + `app/studio` and says so in its own header, with
// the note that "widening this to the whole repo is a separate decision with its own exemption
// list". This is that decision, taken because the typography arc is about to repoint
// `--font-display` and `--font-body`, and a family swap is untrustworthy while any utility naming
// a family is silently dead. A heading that looks wrong after the swap has to mean the new font,
// never a class that never worked.
//
// The two suites are kept apart rather than merged. studio-cascade holds /studio to ZERO
// collisions, which it has earned and which this suite cannot claim for the public site — 102
// collisions exist there today. Merging them would either relax the studio's clean bill or fail
// the build on a hundred pre-existing sites.
//
// ---- WHAT IT FOUND, AND THE ONE THAT MATTERS MOST --------------------------------------------
//
// The home page's `<h1>` — the site's largest element, its only h1, the signature — carries FOUR
// utilities and THREE OF THEM DRAW NOTHING. Measured in the browser, not inferred:
//
//     asked  font-script                 ->  drew  Fraunces          (the unlayered h1 rule)
//     asked  text-[--color-accent-500]   ->  drew  ink-950 inherited (the bracket-bare form)
//     asked  leading-[1]                 ->  drew  1.15              (the unlayered h1 rule)
//     asked  font-normal                 ->  drew  400               inert, agrees with the reset
//
// It is the fifth shipped instance of hazard 11 and the first on the public site's most prominent
// element. The comment above it reasons about "accent-500 on canvas" clearing a contrast bar for a
// colour that has never rendered.
//
// ---- WHY THIS SUITE COMPARES VALUES RATHER THAN STRINGS --------------------------------------
//
// studio-cascade's `agrees()` normalises token NAMES, which is enough inside /studio where the
// utilities are theme steps. It is not enough here, where the public site is full of arbitrary
// values. A name comparison reports `h-auto` against `height: auto` as a collision, and
// `max-w-[68ch]` against `max-width: 68ch` as a collision, and both are agreement. The first draft
// of this file did exactly that and reported 30 collisions that were not.
//
// So every utility is RESOLVED to the value it would compute to, through the @theme table, and
// compared against the reset resolved the same way. Arbitrary values are read out of their
// brackets. The difference is 30 false positives.
//
// ---- ⚠ AND IT COULD NOT SEE `<motion.h3>` UNTIL THE HEADING-FIX PR ---------------------------
//
// The element scanner captured `motion` from `<motion.h3` — lowercase, matching no rule, silently
// skipped. SEVEN elements sat behind that: two motion.h2, one motion.h3 and four motion.p, and one
// of them was a FOURTH font-family collision while B1 asserted there were exactly three.
//
// It was found by looking at the screen. A process-stage heading rendered the body sans while
// carrying `font-display`, and no gate disagreed. A suite that enumerates by parsing source is
// only as complete as its idea of what an element looks like, and this repo writes elements two
// ways. The census moved 97 -> 104 the moment the dotted form became visible.
//
// ---- AND SCOPED UNLAYERED REPAIRS ARE HONOURED -----------------------------------------------
//
// `.case-study .font-display` is itself an unlayered rule that re-asserts the display family, so
// inside a case study that utility DOES land. A gate blind to it would report every case-study
// card title as broken and be wrong about all of them.
import { readdirSync, readFileSync } from "node:fs";
/* ⚠ SHARED AT THE SECOND CONSUMER. `collection-dispatch` hit the identical defect one unit after
   this suite was repaired for it — see the helper's header for why the mechanism travels. */
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function topLevelOnly(src) {
  let out = "", i = 0;
  while (i < src.length) {
    if (src[i] === "@") {
      let j = i;
      while (j < src.length && src[j] !== "{" && src[j] !== ";") j++;
      if (src[j] === ";") { i = j + 1; continue; }
      let d = 1; j++;
      while (j < src.length && d > 0) { if (src[j] === "{") d++; else if (src[j] === "}") d--; j++; }
      i = j; continue;
    }
    if (src[i] === "{" || src[i] === "}") { out += src[i]; i++; continue; }
    out += src[i]; i++;
  }
  return out;
}

/* ---- the @theme table, so a utility can be resolved to a VALUE ---- */
const THEME = {};
{
  const t0 = css.slice(css.indexOf("@theme {"));
  const end = t0.indexOf("\n}\n");
  for (const m of t0.slice(0, end).matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) THEME[m[1]] = m[2].trim();
}
/** Follow `var(--a)` chains to a literal, falling back to the declared fallback. */
const deref = (v, d = 0) => {
  if (d > 6 || !v) return v;
  const m = /^var\((--[a-z0-9-]+)(?:,([^)]*))?\)$/.exec(String(v).trim());
  if (!m) return String(v).trim();
  const hit = THEME[m[1]];
  return hit ? deref(hit, d + 1) : (m[2] ? m[2].trim() : String(v).trim());
};

/* ---- the unlayered element rules, parsed. Comments stripped first, for the reason
   studio-cascade's own repair records: a comment between `}` and the selector eats the tag. */
/** Every tag this suite reasons about — the resets it finds PLUS the ones a third party can reach.
 *  Fixed rather than derived from RULES, so an element stays enumerated after its reset is lifted. */
/* ⚠ `html` AND `body` HAVE UNLAYERED RULES AND ARE DELIBERATELY NOT HERE — SOUND TODAY, AND THE
 * REASON IS A PROPERTY OF THE MARKUP RATHER THAN OF THE CSS.
 *
 * The semantic pass in #371 asked of every suite: what is excluded before the comparison, and could
 * the defect live in the excluded part? This is the one place the answer was "not yet".
 *
 * `html { background-color; color; font-family }` and `body { min-height; overflow-x }` are both
 * unlayered, so a utility on either element would lose to them exactly as `h3`'s weight utilities
 * did — the collision this suite exists to find. It cannot happen because `<html>` carries ONLY
 * next/font variable classes, which declare `--font-*` and set no property the reset owns, and
 * `<body>` carries no className at all. Checked, not assumed.
 *
 * ⚠ SO THE TRIGGER IS NAMED: THE DAY `<html>` OR `<body>` GAINS A TYPOGRAPHY OR COLOUR UTILITY,
 * ADD IT HERE. Nothing else will notice — the census enumerates tags that HAVE resets, and both do,
 * so they look covered from inside this file. */
const TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "img", "video"]);
const RULES = new Map();
{
  /* ⚠ COMMENTS ARE STRIPPED BEFORE THE SCAN, NOT AFTER, AND THE ORDER IS LOAD-BEARING.
   * `topLevelOnly` skips at-rules by finding `@` and consuming to its balanced `}`. Run over raw
   * source, an `@layer` mentioned INSIDE A COMMENT fires that skip and swallows every rule after it
   * — #350 wrote "`@layer base` puts it where preflight sits" in a comment and A0 promptly reported
   * `img` and `a` missing, because both had been eaten.
   *
   * THIS IS THE css-comment-trap ONE LAYER DOWN: that suite exists because a comment between `}`
   * and a selector eats the tag, and here a comment's CONTENT reconfigures the parser. A scanner
   * that reads prose as syntax will always find something eventually. */
  const flat = topLevelOnly(css.replace(/\/\*[\s\S]*?\*\//g, " "));
  for (const chunk of flat.split("}")) {
    const i = chunk.indexOf("{");
    if (i === -1) continue;
    const tags = chunk.slice(0, i).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!tags.length || !tags.every((s) => /^[a-z][a-z0-9]*$/.test(s))) continue;
    for (const d of chunk.slice(i + 1).split(";")) {
      const c = d.indexOf(":");
      if (c === -1) continue;
      const p = d.slice(0, c).trim().toLowerCase(), v = d.slice(c + 1).trim().toLowerCase();
      for (const tag of tags) { if (!RULES.has(tag)) RULES.set(tag, new Map()); RULES.get(tag).set(p, v); }
    }
  }
}

/* ⚠ `p` LEFT THIS LIST IN #354 AND THAT IS THE POINT OF THE PR, NOT A CASUALTY OF IT. Its last
 * unlayered property — the leading — moved into `@layer base`, so the element has no unlayered rule
 * at all. Every OTHER tag here still does, and the day one of them empties, its name comes out with
 * a line saying why. A premise list that quietly shrinks is how a suite stops testing what it
 * claims. */
t("A0: the unlayered rules were found — html, h1/h2, h3..h6, img, a (p is fully layered since #354)",
  ["html", "h1", "h2", "h3", "h6", "img", "a"].filter((x) => !RULES.has(x)), []);
t("A0: …and `p` is NOT among them, because its leading was the last thing it owned",
  RULES.has("p"), false);

/* ---- utility -> the value it resolves to. `null` means "not a utility of this family". */
const arb = (c) => { const m = /\[(.+)\]$/.exec(c); return m ? m[1].replace(/_/g, " ") : null; };
const WEIGHTS = { "font-thin": "100", "font-extralight": "200", "font-light": "300", "font-normal": "400",
  "font-medium": "500", "font-semibold": "600", "font-bold": "700", "font-extrabold": "800", "font-black": "900" };
const UTIL = [
  { p: "font-family", f: (c) => /^font-(display|body|mono|label|script|doodle)$/.test(c) ? deref(`var(--font-${c.slice(5)})`) : null },
  { p: "font-weight", f: (c) => WEIGHTS[c] ?? null },
  { p: "letter-spacing", f: (c) => { if (!/^-?tracking-/.test(c)) return null; const a = arb(c); if (a) return a;
      const v = deref(`var(--tracking-${c.replace(/^-?tracking-/, "")})`); return c.startsWith("-") && v ? `-${v}` : v; } },
  { p: "line-height", f: (c) => { if (!/^leading-/.test(c)) return null; const a = arb(c); if (a) return a;
      if (c === "leading-none") return "1"; return deref(`var(--leading-${c.slice(8)})`); } },
  { p: "color", f: (c) => /^text-(ink|cream|accent|danger|text|on)-/.test(c) ? deref(`var(--color-${c.slice(5)})`) : null },
  { p: "height", f: (c) => { if (!/^h-/.test(c)) return null; const a = arb(c); if (a) return a;
      return c === "h-auto" ? "auto" : c === "h-full" ? "100%" : null; } },
  { p: "max-width", f: (c) => { if (!/^max-w-/.test(c)) return null; const a = arb(c); if (a) return a;
      return c === "max-w-full" ? "100%" : c === "max-w-none" ? "none" : null; } },
];

/* A0b · THE RESOLVER IS LIVE. Without this every lookup could return null and the suite would
 * report a clean site having tested nothing — the false-pass shape this runner refuses. */
t("A0b: the resolver turns a theme utility into a value", UTIL[3].f("leading-relaxed"), "1.7");
t("A0b: …and reads an arbitrary value out of its brackets", UTIL[3].f("leading-[1.02]"), "1.02");
t("A0b: …and knows agreement from collision", [UTIL[6].f("max-w-full"), UTIL[5].f("h-auto")], ["100%", "auto"]);



const COMPONENT_TAG = new Map([["Link", "a"], ["Image", "img"], ["NextImage", "img"]]);
/* ⚠ THE DOTTED FORM IS MATCHED TOO, AND MISSING IT WAS A REAL BLIND SPOT. `<motion.h3>` renders a
 * literal <h3> and is subject to the unlayered reset exactly as a plain tag is — but the element
 * name captured from `<motion.h3` is `motion`, which is lowercase, matches no rule, and was
 * silently skipped. Seven elements sat behind it: two motion.h2, one motion.h3 and four motion.p.
 *
 * IT WAS FOUND BY LOOKING AT THE SCREEN, NOT AT THE GATE. A process-stage heading rendered the
 * body sans while carrying `font-display`, and the registry below claimed the font-family
 * collisions were "exactly three". They were four. A gate that enumerates by parsing source is
 * only as complete as its idea of what an element looks like, and this repo writes elements two
 * ways. */
/* ⚠ COMMENT BODIES ARE BLANKED BEFORE THE JSX SCAN, AND THE ASYMMETRY IS WHY.
 *
 * THIS SUITE HAD TWO SCANNERS AND ONLY ONE OF THEM STRIPPED. The CSS side blanks comments before
 * parsing and its own note calls the order load-bearing, because a construct named inside prose
 * reconfigures the parser. The JSX side read raw source — so a comment DESCRIBING an element and
 * its class was indistinguishable from the element, and the census counted the description.
 *
 * IT HAS HAPPENED SEVEN TIMES ACROSS THIS REPOSITORY, and the seventh was a note explaining that a
 * heading's family utility was inert: writing that sentence made the count go UP rather than down.
 * The standing remedy was a rule asking authors never to spell a class in prose. A rule is what
 * this file already had, seven times.
 *
 * ⚠ THE BODY IS BLANKED, NOT DELETED, AND THAT IS NOT TIDINESS. `line` below is computed from
 * `m.index`, so removing characters would shift every reported line number in the file. Every
 * non-newline character becomes a space and every newline survives, which leaves offsets and line
 * counts identical — asserted by A0c.
 *
 * ⚠ SCOPED TO THIS SCANNER, DELIBERATELY. `colour-census` also reads `.tsx` and its subject is
 * colour LITERALS rather than elements, which is a different question with a different blast
 * radius; the precedent is `css-comment-trap`'s reverted string-blanking, which was correct as an
 * idea and broke five assertions that read string contents. One scanner, measured, proved.
 *
 * ⚠ AND IT FINDS MORE THAN IT REMOVES, WHICH WAS NOT THE POINT AND IS WORTH KNOWING. A `>` inside
 * an attribute-position comment terminated the raw element match early, so a real `className`
 * after it was never seen. Blanking removes those closers, so some elements now yield the class
 * they always carried. */

function* elements(rawSrc, rel) {
  const src = blankCommentBodies(rawSrc);
  const re = /<([A-Za-z][A-Za-z0-9]*(?:\.[a-z][a-zA-Z0-9]*)?)\s([^>]*?)>/gis;
  let m;
  while ((m = re.exec(src))) {
    const raw0 = m[1];
    // `motion.h3` -> `h3`. A namespaced element renders the tag after the dot.
    const dotted = raw0.includes(".") ? raw0.slice(raw0.indexOf(".") + 1).toLowerCase() : null;
    const tag = dotted ?? COMPONENT_TAG.get(raw0) ?? raw0.toLowerCase();
    if (!dotted && /^[A-Z]/.test(raw0) && !COMPONENT_TAG.has(raw0)) continue;
    /* ⚠ ELEMENT DISCOVERY IS DECOUPLED FROM RESET OWNERSHIP, AND THAT IS #353's WHOLE POINT.
       This read `if (!RULES.has(tag)) continue` — enumerate only tags that still have an UNLAYERED
       reset. Which means the moment a reset is fully lifted, the element LEAVES THE CENSUS, taking
       any third-party shadowing with it: lifting the paragraph leading dropped S2 from 22 to 16 and
       the six that vanished were `<p>`. THE COUNT WENT DOWN AND NOTHING WAS FIXED.
       That is the shape #352 repaired, arriving through the one door it did not close. */
    if (!TAGS.has(tag)) continue;
    const cn = m[2].match(/className=(?:"([^"]*)"|\{`([\s\S]*?)`\}|\{([^}]*)\})/);
    if (!cn) continue;
    const raw = cn[1] ?? cn[2] ?? cn[3] ?? "";
    const tokens = [];
    for (const lit of raw.match(/"[^"]*"/g) ?? []) tokens.push(...lit.slice(1, -1).split(/\s+/));
    tokens.push(...raw.replace(/\$\{[\s\S]*?\}/g, " ").split(/\s+/));
    yield { tag, tokens: [...new Set(tokens.filter(Boolean))], line: src.slice(0, m.index).split("\n").length, rel };
  }
}

/* ⚠ THIS BLOCK SITS BELOW `elements` AND `COMPONENT_TAG` BECAUSE IT CALLS THEM, and its first
 * placement was above both. `const` does not hoist, so that raised a ReferenceError at RUN time
 * while parsing perfectly — the temporal-dead-zone shape this repository has now recorded three
 * times, twice in `mutate.mjs`. `node --check` is a PARSE and sees none of it. Running the row is
 * the only thing that does, which is the rule these fixtures exist to honour. */
/* A0c · THE JSX SCANNER IGNORES COMMENTS, PROVED BOTH WAYS ON ONE FIXTURE.
 *
 * ⚠ BOTH DIRECTIONS, BECAUSE EITHER ALONE IS SATISFIED BY A BROKEN SCANNER. A scanner that found
 * nothing at all would pass the "commented element is not counted" row; a scanner that stripped
 * nothing would pass the "real element is counted" row. Only the pair says the discriminator is
 * the COMMENT rather than the element, and the two fixtures differ by exactly the delimiters. */
{
  /* Built from parts, so this file never contains the element-and-class shape it exists to prove
     is ignored — writing that shape here is the very defect being closed, in the row closing it. */
  const T = "h" + "3", C = "font-" + "display";
  const EL = `<${T} className="${C}">x</${T}>`;
  const live = `<div>\n  ${EL}\n</div>`;
  const inJsx = `<div>\n  {/* was ${EL} */}\n  <p className="mt-2">y</p>\n</div>`;
  const inBlock = `<div>\n  /* was ${EL} */\n  <p className="mt-2">y</p>\n</div>`;
  const inLine = `<div>\n  // was ${EL}\n  <p className="mt-2">y</p>\n</div>`;
  const tagsOf = (src) => [...elements(src, "fixture")].map((e) => e.tag);

  t("A0c: a REAL element is found — without this the rows below pass by finding nothing",
    tagsOf(live), [T]);
  t("A0c: …the same element inside a JSX comment is NOT counted",
    tagsOf(inJsx), ["p"]);
  t("A0c: …nor inside a block comment", tagsOf(inBlock), ["p"]);
  t("A0c: …nor inside a line comment", tagsOf(inLine), ["p"]);
  /* ⚠ OFFSETS AND LINE NUMBERS SURVIVE, which is what makes blanking rather than deleting the
     right operation — `line` is computed from the match index, so a shortened source would
     misreport every element after the first comment in a file. */
  t("A0c: blanking preserves length, so every reported line number is still true",
    blankCommentBodies(inJsx).length === inJsx.length, true);
  t("A0c: …and the surviving element keeps its true line number",
    [...elements(inJsx, "fixture")][0].line, 3);
  /* A protocol in a string is not a comment, and a scanner that thought so would blank the rest
     of the line — including a className sitting after an href. */
  t("A0c: a URL is not a line comment",
    tagsOf(`<div>\n  <a href="https://x.test" className="underline">l</a>\n</div>`), ["a"]);
}

const files = [];
const walk = (rel) => {
  for (const e of readdirSync(new URL(`../../${rel}`, import.meta.url), { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child); else if (child.endsWith(".tsx")) files.push(child);
  }
};
walk("app"); walk("components");
t("A1: the sweep found files — a zero denominator is not a pass", files.length > 100, true);
/* ⚠ THE DECOUPLING, ASSERTED. `TAGS` must be a SUPERSET of the tags that still have resets — if it
 * were derived from `RULES` again, lifting a reset would silently shrink the census, which is the
 * defect #353 exists to close. Proved by emptying the `p` reset and confirming S2 still reported
 * 22: before this change it fell to 16 and the six that vanished were `<p>`. */
t("A1b: every tag with an unlayered reset is enumerated, and the set is not derived from the resets",
  /* `html` and `body` are excluded: they carry resets but no component writes utilities on them,
     so enumerating them would add subjects with nothing to test rather than coverage. */
  [...RULES.keys()].filter((t) => !TAGS.has(t) && t !== "html" && t !== "body"), []);

/* ============================================================================================
   ⚠ THE THIRD PARTY. A CASCADE CONTEST HERE HAS THREE SIDES, NOT TWO — AND THIS SUITE MODELLED
   ONLY ONE PROPERTY OF ONE OF THEM UNTIL #352.

   The old helper was `repairedHere`, and it knew exactly one fact: inside a case study,
   `.case-study .font-display` is unlayered, so `font-display` on a heading LANDS rather than losing
   to the element reset. True — and that rule sets TWO properties, and only `font-family` was
   modelled.

   ⚠ #351 PAID FOR THE OTHER HALF. Layering the `h3` weight reset was supposed to let twelve
   `font-normal` utilities draw 400. Ten of them are inside `.case-study`, where that same third
   rule sets `font-weight: 500` and outranks a utility on specificity — so removing the reset
   PROMOTED THE SECOND CONTENDER and they went 600 to 500. **The census reported "repaired" for ten
   rows that were still inert.** The number moved and the defect did not.

   SO THE MODEL NAMES THE RULE AND ITS PROPERTIES, AND CLASSIFIES THE OUTCOME RATHER THAN ASSUMING
   IT. A third party that agrees with the utility repairs it; one that differs SHADOWS it, which is
   still dead and must not read as fixed. */
const THIRD_PARTY = [
  {
    id: ".case-study .font-display",
    /* ⚠ KEYED ON THE ELEMENT'S CLASSES, NOT THE UTILITY BEING TESTED. The rule fires because the
       element carries `font-display`; what it then SHADOWS is a different utility on that same
       element — `font-normal`. Checking the utility's own class found nothing, which is how the
       first two attempts at this model reported zero. */
    applies: (rel, tokens) => rel.startsWith("components/case-study/") && tokens.includes("font-display"),
    /* ⚠ THE RAW DECLARATIONS, RESOLVED THROUGH THE SAME `deref` THE RESET GOES THROUGH — because
       the two sides of this comparison must be the same KIND of thing. The first version stored
       class names against resolved values and reported fourteen honoured `font-family` sites as
       shadowed, which is the compare-spellings-not-values defect this repo has now made four
       times. Read from globals.css rather than retyped, so a retune moves this with it. */
    gives: { "font-family": "var(--font-display)", "font-weight": "var(--font-weight-medium)" },
  },
];

/** What wins for this element+utility if the element reset were not there, or null if the reset is
 *  the only other contender. */
const thirdPartyFor = (rel, tokens, prop) => {
  for (const r of THIRD_PARTY) if (r.applies(rel, tokens) && prop in r.gives) return r;
  return null;
};

const collisions = [], inert = [], shadowed = [];
for (const rel of files) {
  const src = readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");
  for (const el of elements(src, rel)) {
    /* An element with no unlayered reset left owns nothing — which is a valid state now, not a
       reason to skip it. The third party is still consulted below. */
    const owned = RULES.get(el.tag) ?? new Map();
    for (const cls of el.tokens) {
      const bare = cls.includes(":") ? cls.slice(cls.lastIndexOf(":") + 1) : cls;
      for (const u of UTIL) {
        const want = u.f(bare);
        if (want == null) continue;
        /* ⚠ THE THIRD PARTY IS CONSULTED EVEN WHEN THE RESET NO LONGER OWNS THE PROPERTY, and that
           ordering is the whole repair. The old loop skipped unless `owned.has(u.p)` — so the
           moment #351 layered the `h3` weight reset, `font-weight` left `RULES` and those ten
           utilities STOPPED BEING CONSIDERED AT ALL. Not reported as repaired: reported as absent.
           A suite that only looks where it already knows a contest exists cannot see one move. */
        if (!owned.has(u.p) && !thirdPartyFor(rel, el.tokens, u.p)) continue;
        /* ⚠ THE THIRD PARTY IS RESOLVED BEFORE THE RESET, because it beats the reset. If it
           agrees with what the utility asks, the utility is effectively honoured and there is no
           defect. If it DIFFERS, the utility is SHADOWED — dead, but by a different rule, and
           counting it as repaired is exactly the false green #351 shipped. */
        const third = thirdPartyFor(rel, el.tokens, u.p);
        if (third) {
          const gives = deref(third.gives[u.p]);
          if (String(gives).toLowerCase() === String(want).toLowerCase()) continue;   // honoured
          shadowed.push({ where: `${rel}:${el.line}`, tag: el.tag, cls: bare, property: u.p,
            want, got: gives, by: third.id });
          continue;
        }
        if (!owned.has(u.p)) continue;   // third party handled above; no reset left to compare
        const got = deref(owned.get(u.p));
        const hit = { where: `${rel}:${el.line}`, tag: el.tag, cls: bare, property: u.p, want, got };
        (String(want).toLowerCase() === String(got).toLowerCase() ? inert : collisions).push(hit);
      }
    }
  }
}
const outside = (h) => !/\/studio\//.test(h.where);

/* ================================================ S. SHADOWED — THE THIRD PARTY'S VICTIMS
 * ⚠ A UTILITY THAT LOSES TO A RULE THAT IS NOT THE ELEMENT RESET. Neither a collision (the reset
 * does not win) nor inert (nothing agrees) — DEAD BY A DIFFERENT HAND, and the category this suite
 * lacked until #352.
 *
 * IT WAS INVISIBLE FOR THE WORST POSSIBLE REASON. Before #351 these sites WERE collisions, counted
 * among the twelve `font-weight` rows. Layering the reset moved them out of `RULES` entirely, so
 * they stopped being considered and the census read "repaired". The number went to zero and not one
 * of them changed to what it asked for. */
const shadowedPub = shadowed.filter(outside);
t("S1: every shadowed utility is `font-weight` under `.case-study .font-display` — a NEW shape here means a third party nobody has modelled",
  [...new Set(shadowedPub.map((h) => `${h.property} by ${h.by}`))], ["font-weight by .case-study .font-display"]);
/* ⚠ 22 -> 21, AND IT IS A REPAIR RATHER THAN A LOSS, WHICH IS THE DISTINCTION THIS ROW EXISTS TO
 * FORCE. C1 below states the rule: a change here is a dead utility GAINED or REPAIRED, and the number
 * alone cannot say which. This one is a repair, and the mechanism is checkable rather than asserted.
 *
 * `CaseSectionHeader`'s section head carried `font-display` and `font-normal` together, so it asked
 * for 400 while `.case-study .font-display` drew 500 — one of the 22. The sheet grammar moved that
 * element onto `.sheet-h2`, which sets its weight directly and carries NEITHER class, so the rule no
 * longer matches it and there is no utility left to shadow. The weight that renders is the declared
 * 600 rather than a silently-promoted 500.
 *
 * SO THE POPULATION SHRANK BY REMOVING A CONSUMER, NOT BY WEAKENING THE MATCHER. S1 still pins the
 * SHAPE to one party and S3 still pins every member to the same 400-asks-500 form, so a loosened
 * detector could not produce this number.
 *
 * ⚠ 21 -> 14, AND ALL SEVEN ARE ATTRIBUTED BY NAME, BECAUSE A SEVEN-STEP DROP IS EXACTLY THE SIZE
 * WHERE "IT LOOKS LIKE A REPAIR" STOPS BEING GOOD ENOUGH. The case-study statement italics moved to
 * `.sheet-h3`, which carries neither `font-display` nor `font-normal`:
 *
 *     PullQuote           3   its three branches, all `font-display italic font-normal`
 *     ClosingLine         2   both branches, same string
 *     SectionRenderer     1   the north star
 *     SectionRenderer     1   the retired quote band's own `h2`
 *
 * Seven consumers removed, 21 - 7 = 14, and the arithmetic reconciles against the diff rather than
 * against an expectation. `IssueList`'s index is deliberately NOT among them — it carried
 * `font-display italic` with no `font-normal`, so it never asked 400 and was never in this
 * population, which is the kind of thing only counting finds.
 *
 * ⚠ 14 -> 10, AND THIS DROP WAS PREDICTED BEFORE THE RUN RATHER THAN EXPLAINED AFTER IT. The
 * case-study HEADING italics moved to `.sheet-h3`, and four of them paired the display class with
 * the weight class:
 *
 *     PrincipleCards   1   the block's own heading
 *     FigureGrid       1   the identical string, in a second file
 *     Stepper          1   the WEB branch's stage name
 *     CaseStudyView    1   the `Coming soon` empty-state h1
 *
 * `Stepper`'s MOBILE branch is deliberately not among them — it carried the display class without
 * the weight class, so it asked nothing and was never a member. The same distinction `IssueList`
 * made above, in the same suite, one unit later: reading the diff is what separates a repair from a
 * coincidence, and the number alone still cannot. */
/* ⚠ 10 -> 2, AND THE ELEVEN THAT LEFT WERE DELETED RATHER THAN CONVERTED. Every one asked 400 and
 * drew 500, so removing the class moved nothing: `PrincipleCard` x2, `BeforeAfter`, `BeforeAfterStory`
 * x2, `FeatureRows`, `FigureGrid`, `GlanceGrid`, `VideoEmbed`, `WorkStory`, and one `font-medium` on
 * `BeforeAfterStory`'s after-rating that asked 500 and drew 500.
 *
 * ⚠ THAT LAST ONE CARRIED AN INTENT THAT HAS NEVER RENDERED, which only counting found. The two
 * rating glyphs are `text-lg` with no weight and `text-3xl font-medium`; the 0-2-0 rule gives BOTH
 * 500, so the weight contrast the author wrote was decided by the cascade before it was asked for.
 * The size contrast is live and is what a reader sees. Removed rather than replaced, because making
 * the after-rating genuinely heavier is a design change.
 *
 * ⚠ AND THE TWO SURVIVORS ARE A FALSE POSITIVE IN THIS SUITE'S MODEL, NAMED RATHER THAN DELETED.
 * They are `HeroCover`'s two `h1` branches. This suite resolves them as shadowed because they carry
 * `font-display` inside a case-study component — but the hero renders under `SECTION.hero-ground`,
 * OUTSIDE the `.case-study` wrapper, so the 0-2-0 rule never matches them. Measured in the DOM:
 * `closest('.case-study')` is null and the computed weight is 400, exactly what the class asks for.
 *
 * SO THEY ARE LIVE UTILITIES AND MUST NOT BE DELETED, and S2a is here so the next person to read a
 * count of 2 does not go looking for two more classes to remove. Correcting the resolver is a change
 * to this suite's cascade model with its own blast radius, and it is not smuggled into a cleanup. */
t("S2: ⚠ 2 REMAIN AND BOTH ARE THIS SUITE'S OWN FALSE POSITIVE — the eleven real ones were deleted",
  shadowedPub.length, 2);
t("S2a …and they are the hero's, which renders OUTSIDE `.case-study` and draws the 400 it asks for",
  [...new Set(shadowedPub.map((h) => h.where.replace(/:\d+$/, "")))].sort(),
  ["components/case-study/blocks/HeroCover.tsx"]);
/* ⚠ S3 USED `.every()`, WHICH RETURNS TRUE ON AN EMPTY ARRAY — so the row written to stop S1 and S2
 * passing on nothing would itself have passed on nothing the moment this population drained. It came
 * within two members of that. The length check is what makes it a measurement. */
t("S3: …and the population is real, so S1 and S2 cannot pass by finding nothing",
  [shadowedPub.length > 0, shadowedPub.every((h) => h.want === "400" && h.got === "500")], [true, true]);

const pub = collisions.filter(outside);

/* ================================================ B. THE FAMILY COLLISIONS
 * ⚠ THESE ARE THE ONES THAT MAKE A FAMILY SWAP UNTRUSTWORTHY, so they are registered by name
 * with the value each one actually draws. A fourth fails on arrival.
 *
 * REGISTERED RATHER THAN FIXED, AND THAT IS DELIBERATE. Making any of these live CHANGES WHAT
 * RENDERS on the public site — the home h1 would become Kaushan Script in terracotta, the blog
 * card titles and the contact heading would become the display serif. Each is a design decision
 * about the site's most visible type, not a cascade repair, and this arc is not the place to take
 * it silently. Deleting them instead would erase the evidence of intent. So they are pinned, with
 * what they ask for and what they draw, and the choice is recorded as the owner's.
 *
 * ⚠ EVERY ENTRY CARRIES A `guard`, the shape studio-ink-contrast H6 had to learn: a registry that
 * records a claim and never checks it is a list of assertions about the past. The guard is the
 * class expression that MAKES the claim true, matched against the real source. */
/* ⚠ EMPTY SINCE #349, AND THE ENTRY WAS DELETED RATHER THAN LOOSENED. It held the home page's `h1`,
 * which asked for `font-script` and drew the display serif, and its `why` said DEFERRED ON PURPOSE
 * — the Kaushan brand question, not to be settled inside a font swap.
 *
 * THE DEFERRAL WAS RESOLVED, SO THE DEFERRAL RECORD GOES. The owner took the wordmark decision:
 * Kaushan stays, and the inert class came off the heading. A registry entry whose stated reason is
 * "waiting on a decision" is finished when the decision arrives — keeping it with a softened
 * assertion would leave a record claiming something is pending that is not.
 *
 * ZERO IS NOW THE ASSERTION. A family utility that draws nothing is a defect again, with no
 * standing exception. */
const FAMILY_COLLISIONS = [];
const familyHits = pub.filter((h) => h.property === "font-family");
t("B1: ZERO font-family collisions — the last one was the home h1's inert `font-script`, removed in #349 when the Kaushan decision was taken. A NEW one means a family utility that draws nothing",
  familyHits.map((h) => `${h.where.split(":")[0]} <${h.tag}> ${h.cls}`).sort(),
  FAMILY_COLLISIONS.map((e) => `${e.at} <${e.tag}> ${e.cls}`).sort());
for (const e of FAMILY_COLLISIONS) {
  const src = readFileSync(new URL(`../../${e.at}`, import.meta.url), "utf8");
  t(`B2: ${e.at} still carries the expression that makes it true — ${e.why}`,
    e.guard.test(src), true);
}

/* ================================================ C. THE REST, INVENTORIED
 * Line-height, letter-spacing, colour and width collisions are real and are NOT the family swap's
 * problem. Pinned as exact counts so the number cannot grow unnoticed, reported so the next person
 * does not re-derive it. THE COUNTS ARE THE ASSERTION — a new dead utility fails here. */
const byProp = {};
for (const h of pub) (byProp[h.property] ??= []).push(h);
const census = Object.fromEntries(Object.keys(byProp).sort().map((k) => [k, byProp[k].length]));
t("C1: the public collision census is exactly this — a change here is a dead utility gained or repaired",
  /* ⚠ `font-family` LEFT THIS CENSUS ENTIRELY rather than dropping to 0 — a property with no
     collisions has no key, which is the map's own shape and not a special case.

     ⚠ AND `max-width` LEFT IT IN #350, WHICH IS THE FIRST TIME A GROUP WAS REPAIRED RATHER THAN
     RECORDED. `p`'s rule was split so the measure sits in `@layer base` and the leading stays
     unlayered, so the 18 arbitrary measure utilities now draw and the 34 leading ones still do not.

     THE SPLIT WAS THE POINT. Moving the whole `p` rule — the shape CLAUDE.md described as "one
     change" — would have made 92 utilities live at once across four properties and two tag groups,
     in a single diff where nothing could be attributed. The record called it 58. It was 92, and 34
     of them were not line-height.

     ⚠ AND `font-weight` LEFT IN #351 — BUT NOT BECAUSE TWELVE UTILITIES STARTED DRAWING, AND THIS
     SUITE CANNOT TELL THE DIFFERENCE. It models a TWO-PARTY contest: a utility against the element
     reset, and it reports which wins. The cascade has THREE parties. Ten of those twelve `<h3>`
     elements sit inside `.case-study`, where an unlayered `.case-study .font-display` sets weight
     500 and outranks the utility on specificity — so layering the reset promoted the SECOND
     contender rather than the utility. They went 600 -> 500, not 600 -> 400.

     ⚠ SO THIS CENSUS NOW READS "REPAIRED" FOR TEN ROWS THAT ARE STILL INERT. Recorded rather than
     papered over: the honest fix is a third-party model, and it is not in this PR. Measured in the
     browser — every `<h3>` asking `font-normal` on a case study computes 500.

     ⚠ AND `line-height` LEFT IN #354 — THE LARGEST GROUP AND THE THIRD PROPERTY LIFTED. 58 rows,
     53 of which asked for tighter type than the reset gave. **S2 held at 22 across the change**,
     which is the check #353 exists to make: before it, lifting the paragraph leading dropped
     shadowed from 22 to 16 and the census would have read this as a clean repair.

     ⚠ AND `letter-spacing` LEFT IN #355, WHICH CLOSES THE SEQUENCE. Four heading sites, all asking
     LOOSER tracking than the reset's -0.03em. 18 measures, 12 weights, 58 leadings, 4 trackings —
     the item said 58 and one change, and it was 92 across four properties.

     ⚠ WHAT REMAINS IS `color`: `<a>` SITES, AND IT IS A DIFFERENT QUESTION. The unlayered
     `a { color: inherit }` exists so links inherit their context rather than turning blue, and
     `studio-cascade`'s whole premise rests on it. Lifting it is not the fifth step of this
     sequence — it is a new one, with its own reason to exist.

     ⚠ 4 -> 1, AND THREE OF THE FOUR PUBLIC COLOUR COLLISIONS IN THE WHOLE REPOSITORY WERE ON TWO
     PAGES NOBODY LOOKS AT. The 404 and the public error boundary each drew an accent-filled anchor
     whose colour utility lost to that unlayered rule, plus a hover colour on the same element:

       not-found   the accent foreground on the primary control   MEASURED 1.07 ON ITS OWN FILL
       error       the primary-ink foreground on the secondary    inert, and CORRECT BY COINCIDENCE
       error       the hover colour on that same anchor           inert, removed

     ⚠ THE FIRST ONE WAS LIVE, AND THE SECOND IS THE MORE INSTRUCTIVE. `text-on-accent` on an anchor
     computed `oklch(0.15 0 0)` on an `oklch(0 0 0)` fill — near-black on pure black, against a 4.5
     floor — because the class never applied and the label inherited the page's ink. The secondary
     asked for the ink it inherits ANYWAY, so an equally inert class drew the right pixels and nothing
     could have found it except this census.

     ⚠ AND THE TOKENS WERE RIGHT THE WHOLE TIME, WHICH IS WHY `role-layer` R2b MISSED IT. That row's
     subject is the accent foreground paired with the RUNG; these paired it with the ROLE, which is the
     correct token and measures 4.63 to 7.52 on all nine palettes. Not a colour defect. An ELEMENT that
     cannot receive a colour, which is a different question and the one this `color` row is about.

     All three were repaired the way R2b's own three sites were: the colour moved to a child span. */
  census, { color: 1 });
t("C2: /studio still has ZERO collisions — studio-cascade's clean bill, re-checked by a second instrument",
  collisions.filter((h) => !outside(h)), []);
t("C3: the inert inventory outside /studio is pinned too — inert is not safe, it is a place an edit will silently do nothing",
  /* ⚠ 40 -> 37, AND THE THREE THAT LEFT ARE NOT A REPAIR. They were `<p>` utilities asking for
     exactly `68ch` — the reset's own value — so they were INERT-AND-AGREEING. Now that the measure
     is layered they simply WIN, drawing the same number, and a utility that wins is neither a
     collision nor inert: there is nothing left to record. The inventory shrank because three
     entries stopped being a category, not because three defects were fixed.

     ⚠ 37 -> 36 IN #351, FOR THE SAME REASON ONE MORE TIME. One `<h3>` carried `font-semibold`,
     agreeing with the reset it could not beat. Layered, it wins and draws 600 — the same weight,
     and no longer a category. A number falling because a thing stopped being classifiable is not a
     repair, and both times it has been worth saying so rather than letting the count read as one.

     ⚠ 36 -> 31 IN #352, AND THIS ONE IS A RECLASSIFICATION RATHER THAN A CHANGE TO THE SITE. Five
     `font-display` utilities inside case studies were counted INERT — agreeing with a reset they
     could not beat. The third-party model now resolves them against `.case-study .font-display`
     FIRST, which honours them, so they are not a category either. Nothing on screen moved; the
     suite simply stopped mis-filing them.

     ⚠ 31 -> 24 IN #354, AND THIS TIME SEVEN OF THEM ARE A REAL REPAIR. They were utilities agreeing
     with a leading they could not beat; now they win and draw the same number. The count falls for
     the same reason it fell twice before — a thing stopped being classifiable — but the underlying
     state changed too: seven utilities that drew nothing now draw.

     ⚠ 24 -> 21 IN #355, three more of the same kind: heading tracking utilities that agreed with
     the reset and can now simply win. Four times this count has fallen and four times it has been
     worth writing down which kind it was — a reclassification, a repair, or both.

     ⚠ 21 -> 20 IN #369, AND THIS ONE IS NEITHER — A WHOLE FILE LEFT THE REPO. `ExperienceEntry.tsx`
     was deleted as dead: it rendered the experience `description` field and NOTHING IMPORTED IT,
     which is exactly how that field came to have no consumer for its entire life. Its inert utility
     went with it. A fifth kind of fall, and the reason to keep recording them — the number moving
     says nothing about which of five things happened.

     ⚠ 20 -> 19 IN THE ASH-CONTRACT HERO. The old centred hero's h1 carried a weight utility that
     agreed with the unlayered h1 reset at 400 — inert since the day hazard 11 was written down.
     The contract rebuild deleted that markup outright and the new `.hero-name` sets its face and
     weight on the CLASS, which beats the element reset instead of losing to it. The site the entry
     described no longer exists, which is the ExperienceEntry kind of fall arriving one element at
     a time rather than a file at a time.

     ⚠ 19 -> 11 WITH THE `img, video` HEIGHT LIFT, AND THE MOVEMENT IS ATTRIBUTED RATHER THAN
     ACCEPTED. A prediction agreeing with an outcome is not evidence — this file's own rule — so
     the departures were diffed BY IDENTITY: exactly eight left, all eight `h-auto` on an `<img>`,
     four in BeforeAfterStory and four in WorkStory, and ZERO joined. Nothing changed category.

     AND NOT ONE RENDERED BOX MOVED. All eight read `want=auto got=auto`, so every consumer already
     agreed with the value the reset gave; the utility simply became the thing that supplies it.
     That is why this lift could be taken whole where the four type lifts each had to be split.

     ⚠ 11 -> 7 WITH THE 404 AND THE ERROR BOUNDARY, AND ALL FOUR ARE ONE PAIR TWICE. Each page's `h1`
     carried the display class with a weight utility and a line-height utility, both agreeing with the
     unlayered `h1, h2` reset they could not beat — two inert utilities per file, two files, four.
     Both headings moved to `.sheet-h2`, which sets its own weight and line-height on the CLASS, so
     there is nothing left to lose to the element rule.

     THE SIXTH KIND OF FALL, AND IT IS THE `CaseSectionHeader` KIND: a heading leaving the element
     reset's reach entirely by taking a class that beats it, rather than a utility starting to win.
     Same mechanism that moved S2 from 21 to 14, counted in the other inventory. Seven times this
     count has moved and seven times which kind it was has been worth writing down — the number alone
     still cannot say.

     ⚠ 7 -> 3 WITH THE BLOG'S HEADS, AND IT IS THE SAME PAIR-TWICE SHAPE A THIRD TIME. The article
     head's `h1` and the index masthead's `h1` each carried the display family class and a weight
     utility, both agreeing with the unlayered `h1, h2` reset they could not beat — two per element,
     two elements, four. Both took `.sheet-h2`, which declares its own family and weight on the
     CLASS, so there is nothing left for the element rule to win.

     ⚠ AND THE DEPARTURES WERE DIFFED BY MEASUREMENT RATHER THAN BY READING THE DIFF, because a count
     that falls by exactly the number you predicted is the pre-confirmed hypothesis this repository
     refuses. The two files were checked out at the parent commit and the suite re-run: 7 before, 3
     after, with 183 files and 1 public collision unchanged on both sides. The fall is entirely those
     two files and nothing else changed category.

     ⚠ AND FIVE OTHER MENTIONS OF THE DISPLAY FAMILY CLASS IN THOSE FILES DID NOT COUNT, WHICH IS WHY
     THE FIGURE IS FOUR RATHER THAN MORE. Four of them sit on a `<p>`, and the `p` reset declares
     `max-width` and `line-height` and NO family — so those were live utilities all along. An inert
     count is per PROPERTY, never per class name, and reading the diff would have given five.

     THE EIGHTH MOVE, AND STILL THE SIXTH KIND.

     ⚠ 3 -> 1 WITH THE BLOG CARDS, AND IT IS THE PAIR-TWICE SHAPE A FOURTH TIME. The featured card's
     `h2` carried the display family class and a weight utility, both agreeing with the unlayered
     `h1, h2` reset they could not beat. It took `.sheet-h3`, which declares its own family and
     weight on the CLASS, so there is nothing left for the element rule to win.

     Diffed by checkout-and-remeasure rather than read off the diff — the three changed files were
     restored at the parent commit and the suite re-run: 3 before, 1 after, with 183 files and 1
     public collision unchanged on both sides.

     THE NINTH MOVE. Four of the nine have now been this one kind, which is what a conversion arc
     looks like from inside this inventory: headings leaving the element reset's reach by taking a
     class that beats it. */
  inert.filter(outside).length, 1);

if (pub.length) {
  console.log(`\n  ${pub.length} PUBLIC COLLISIONS — the element draws the reset, the author's value never lands.`);
  console.log(`  The three font-family ones are registered above and are the owner's decision.`);
  console.log(`  Fix for the rest: delete the utility, or re-assert it UNLAYERED the way`);
  console.log(`  \`.studio-chrome .sechead\` does. Do not leave a class that renders nothing.\n`);
}

console.log(`\ncascade-public result: ${pass} passed, ${fail} failed  ·  ${files.length} files, ${pub.length} public collisions, ${inert.filter(outside).length} inert`);
process.exit(fail === 0 ? 0 : 1);
