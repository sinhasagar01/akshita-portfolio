// THE CASCADE GATE — utilities that lose to an unlayered element rule.
// Run: node ralph/tests/studio-cascade.mjs
//
// ---- THE MECHANISM -------------------------------------------------------------------
//
// Tailwind emits its utilities inside `@layer utilities`. globals.css also carries a handful
// of PLAIN ELEMENT RULES written at the top level, outside any layer. In the cascade an
// UNLAYERED rule beats a layered one REGARDLESS OF SPECIFICITY — layer order is consulted
// before specificity ever is. So `h1, h2 { font-weight: ... }` defeats `.font-bold` on an
// <h2>, and no amount of specificity on the utility side can win.
//
// The class produces NOTHING. It is in the markup, it looks correct in review, it survives
// grep, and it draws the element's inherited value.
//
// ---- WHY THIS SUITE EXISTS RATHER THAN FOUR MORE ASSERTIONS --------------------------
//
// Four instances of this have now shipped to main:
//
//   1. `a { color: inherit }`            beat `text-*` on anchors        (hazard 22)
//   2. `img, video { height: auto }`     beat `h-*` on the canvas hero   (CAUSE REMOVED — the
//      height was lifted into `@layer base`, so a height utility on an image now lands. The
//      instance is kept because the list is a record of what shipped, not of what is still live.)
//   3. `h3..h6 { font-family }`          beat `.font-display`            (fixed for .case-study only)
//   4. `h1, h2 { font-family/weight/ls }` beat `font-bold`+`tracking-*`  (#205's ink bands)
//
// EVERY ONE WAS FOUND BY SOMEONE MEASURING THE THING THEY ALREADY SUSPECTED. Not one was
// found by review, and #205's own gate asserted the band <header>'s class string while the
// <h2> inside it drew Fraunces 400 — a gate reading a class cannot see a class that does
// nothing, which is the whole failure in one sentence.
//
// So this suite does not encode the four. It derives the RULES from globals.css and the
// USAGE from the studio source, and reports every collision between them. The fifth instance
// fails here before anyone suspects it.
//
// ---- SCOPE -----------------------------------------------------------------------------
//
// components/studio + app/studio only. The public site and the canvas render through
// components/case-study and components/blog, where `.case-study` already re-asserts what it
// needs and the canvas-hero suite pins the `height` case. Widening this to the whole repo is
// a separate decision with its own exemption list.
import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

/* ================================================ A. DERIVE THE RULES FROM globals.css
 * Parsed, never hardcoded. If someone adds `blockquote { font-style: italic }` unlayered,
 * this picks it up and starts guarding blockquote on the next run — which is the difference
 * between a gate and a list of four known bugs. */

/** Strip every `@layer …{…}` / `@media …{…}` block so only TOP-LEVEL rules remain. */
function topLevelOnly(src) {
  let out = "", depth = 0, i = 0;
  while (i < src.length) {
    if (src[i] === "@") {
      // find this at-rule's block and skip it whole
      let j = i, brace = -1;
      while (j < src.length && src[j] !== "{" && src[j] !== ";") j++;
      if (src[j] === ";") { i = j + 1; continue; }
      brace = j; let d = 1; j++;
      while (j < src.length && d > 0) { if (src[j] === "{") d++; else if (src[j] === "}") d--; j++; }
      void brace; i = j; continue;
    }
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    out += src[i];
    i++;
  }
  return out;
}

/** Which CSS property each Tailwind utility FAMILY writes. Only families that can collide
 *  with a bare element rule are listed — a utility whose property no element rule sets can
 *  never lose this way. */
const FAMILY = [
  { property: "font-family",     test: (c) => /^font-(display|body|mono)$/.test(c) },
  { property: "font-weight",     test: (c) => /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(c) },
  { property: "letter-spacing",  test: (c) => /^-?tracking-/.test(c) },
  { property: "line-height",     test: (c) => /^leading-/.test(c) },
  { property: "color",           test: (c) => /^text-(ink|cream|accent|danger|text)-/.test(c) },
  { property: "height",          test: (c) => /^h-/.test(c) },
  { property: "max-width",       test: (c) => /^max-w-/.test(c) },
  { property: "display",         test: (c) => /^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|hidden|contents)$/.test(c) },
  { property: "text-decoration-thickness", test: (c) => /^decoration-\d/.test(c) },
  // BORDER COLOUR — added for the selection language (PR B), which paints a 3px accent left
  // bar on an <a>, a <button> and an <li>. NO unlayered rule touches border today, verified,
  // so nothing collides right now. It is here because the bar is the selection signal on three
  // surfaces, and the day someone adds `a { border-bottom: ... }` for link underlines, the
  // rail's bar would die silently on exactly the class of bug this suite exists for.
  { property: "border-color",      test: (c) => /^border-(ink|cream|accent|danger|transparent)/.test(c) },
  { property: "border-left-color", test: (c) => /^border-l-(ink|cream|accent|danger|transparent)/.test(c) },
];

/** element tag -> Set(properties its unlayered rule sets) */
const RULES = new Map();
{
  /* ⚠ COMMENTS ARE STRIPPED BEFORE THE SPLIT, AND THIS LINE IS A REPAIR RATHER THAN A TIDY.
   * The split below anchors each rule to the `}` that ended the previous one, so anything
   * BETWEEN that brace and the selector is read as part of the selector. A comment there makes
   * the tag list fail the bare-tag test and the rule never enters RULES — it is dropped
   * silently, and a dropped rule means A0 reports `undefined` while C1 goes on passing because
   * it has nothing left to check.
   *
   * It was already costing coverage before anything triggered it: `html` sits behind a banner
   * comment and has ALWAYS been missing from this map, and it sets `font-family` and `color`,
   * two of the families guarded below. That was recorded in docs/DESIGN-SYSTEM.md as a known
   * blind spot with no live consequence.
   *
   * THE TYPOGRAPHY ARC IS WHAT MADE IT CONSEQUENTIAL. Documenting the `opsz` hazard put a
   * comment immediately above `h1, h2` — and that rule is the one this suite exists for, the
   * one #205's ink bands lost to. The gate went from guarding it to reporting `undefined`,
   * which is the exact failure shape this file's own header calls out: a suite that quietly
   * checks nothing. Fixed here rather than deferred, because the family swap lands next. */
  /* ⚠ COMMENTS FIRST, THEN THE SCAN — AND `cascade-public` HAD THE SAME LINE THE SAME WAY ROUND.
   * `topLevelOnly` skips at-rules by finding `@` and consuming to its balanced `}`. Over raw
   * source, an `@layer` NAMED IN A COMMENT fires that skip and swallows every rule after it: #350
   * wrote one sentence mentioning `@layer base` in globals.css and both suites promptly lost the
   * `a` and `img, video` resets their whole premise rests on.
   *
   * ⚠ TWO SUITES, ONE DEFECT, AND THEY AGREED WITH EACH OTHER — which is why nothing caught it
   * until a comment happened to contain the trigger. The css-comment-trap suite exists one level
   * up from this: it stops a comment ADDING a utility, and this stops a comment REMOVING a rule. */
  const flat = topLevelOnly(css.replace(/\/\*[\s\S]*?\*\//g, " "));
  // `h1,\n h2 { … }` — a selector list of BARE TAG NAMES only. A rule with a class or an
  // id in it is not an element reset and cannot be defeated by specificity alone.
  //
  // SPLIT ON `}` RATHER THAN MATCHING A PRECEDING ONE. The obvious regex anchors each rule to
  // the `}` that ended the previous one — but a global regex CONSUMES that brace, so every
  // second rule fails to match and is silently skipped. Written that way this suite missed
  // both `a` and `h1, h2`, the two resets it exists to guard, while still passing on `h3..h6`
  // and `img` and therefore looking healthy. Caught by A0.
  for (const chunk of flat.split("}")) {
    const i = chunk.indexOf("{");
    if (i === -1) continue;
    const tags = chunk.slice(0, i).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!tags.length || !tags.every((s) => /^[a-z][a-z0-9]*$/.test(s))) continue;
    const decls = chunk.slice(i + 1)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(";")
      .map((d) => {
        const c = d.indexOf(":");
        return c === -1 ? null : [d.slice(0, c).trim().toLowerCase(), d.slice(c + 1).trim().toLowerCase()];
      })
      .filter(Boolean);
    for (const tag of tags) {
      if (!RULES.has(tag)) RULES.set(tag, new Map());
      for (const [p, v] of decls) RULES.get(tag).set(p, v);
    }
  }
}

/**
 * AGREEMENT IS NOT A COLLISION, and telling them apart is what keeps this gate alive.
 *
 * `p { line-height: var(--leading-relaxed) }` versus `leading-relaxed` on a <p> is the SAME
 * VALUE arriving twice. The utility is inert, but nothing renders wrong. Eight studio sites
 * are in exactly that state, and a gate that fails on all eight is a gate someone deletes in
 * a week — so those are reported as INERT and do not fail.
 *
 * A DIFFERENT value is a real defect: the element draws the reset and the author's intent
 * never reaches the screen. Those fail.
 *
 * Both are reported, because inert is not the same as safe: change `leading-relaxed` to
 * `leading-tight` on one of those <p>s and it will silently not apply. Knowing which sites
 * are inert is how you find out before, rather than after.
 */
const norm = (s) =>
  s.replace(/^var\(--/, "").replace(/\)$/, "")
   .replace(/^font-weight-/, "font-").replace(/^color-/, "text-")
   .replace(/\bregular\b/, "normal");

/** Does this utility carry the same value the reset already sets? */
function agrees(cls, resetValue) {
  if (resetValue == null) return false;
  return norm(resetValue) === norm(cls);
}

// A0 · the four known resets are still here. If one is deleted the guard below silently
// stops guarding, and a suite that quietly checks nothing is worse than no suite.
t("A0: the unlayered `a` reset is still in globals.css — this suite's whole premise",
  RULES.get("a")?.has("color"), true);
t("A0: the unlayered `h1, h2` reset still sets font-weight — #205's bands lost to exactly this",
  RULES.get("h2")?.has("font-weight"), true);
t("A0: the unlayered `h3..h6` reset still sets font-family — the trap .case-study re-asserts against",
  RULES.get("h4")?.has("font-family"), true);
/* ⚠ `max-width`, NOT `height`, AND THE SWAP IS A DELIBERATE CHANGE RATHER THAN A REPAIR. This row
 * read `has("height")` and was correct for as long as that property sat unlayered. It has been
 * lifted into `@layer base`, so a height utility on an image now WINS — which is the whole point of
 * the lift and makes the old premise false rather than broken.
 *
 * THE ROW STILL HAS A JOB, because two of the three properties stayed unlayered. `max-width` is the
 * one this guard now watches, and it fails the day that leaves too — which is what keeps the
 * collision detector below from silently having nothing to detect. */
t("A0: the unlayered `img, video` reset still sets max-width — height was lifted, this was not",
  RULES.get("img")?.has("max-width"), true);
/* ⚠ AND THE COMPLEMENT IS ASSERTED, because a lift that silently reverted would leave this suite
 * passing on a premise nobody re-checked. The height must be ABSENT from the unlayered map. */
t("A0: …and the height is GONE from the unlayered map, so the lift cannot silently revert",
  RULES.get("img")?.has("height") ?? false, false);
/* ⚠ THE PARSER REPAIR, PINNED, because a fix with no assertion regresses the moment someone
 * reorders this file. `html` sits behind a banner comment and was dropped by the old split for
 * the whole life of this suite; `h1, h2` joined it the day a comment was written above it. Both
 * are here now, and this is the row that fails if the comment strip is ever removed. */
t("A0: `html` is in the map at all — it sits behind a comment, and the old split lost every rule that did",
  RULES.get("html")?.has("font-family"), true);
t("A0: …and it carries `color` too, the second family this suite guards",
  RULES.get("html")?.has("color"), true);

/* ================================================ B. DERIVE THE USAGE FROM THE SOURCE */

const dir = new URL("../../components/studio/", import.meta.url);
const appDir = new URL("../../app/studio/", import.meta.url);
const files = [
  ...readdirSync(dir, { recursive: true }).map((f) => ({ rel: `components/studio/${f}`, url: new URL(String(f), dir) })),
  ...readdirSync(appDir, { recursive: true }).map((f) => ({ rel: `app/studio/${f}`, url: new URL(String(f), appDir) })),
].filter((f) => f.rel.endsWith(".tsx"));

// THERE IS NO EXEMPTION LIST, AND THAT IS DELIBERATE.
//
// The first draft carried four by name — AreaHeader's <h1> and StudioModal's <h2>, each
// asking for the value its reset already sets. Then `agrees()` arrived and made all four fall
// out of a RULE instead: they are inert, like the eight <p> line-heights, and they are
// classified as such automatically.
//
// A hand-maintained exemption list is a second place the truth lives. It goes stale silently,
// it is the obvious lever for anyone who wants the gate quiet, and every entry is a claim
// nobody re-checks. A principle that produces the same answer needs no list.

/**
 * COMPONENTS THAT RENDER A GUARDED ELEMENT. Without this the gate has a silent blind spot
 * exactly where it is needed most.
 *
 * STUDIO CONTAINS ZERO LITERAL `<a>` TAGS — every anchor is a next/link `<Link>`. So a gate
 * that matches only lowercase tag names covers 0% of the anchor surface, and the anchor
 * surface IS hazard 22: `a { color: inherit }` versus `text-*`, the very first instance of
 * this bug and the one #205's E6 had to hand-patch at two sites. Matching literal tags only,
 * this suite would have reported a clean run while covering none of it.
 *
 * Found by mutation-testing — injecting a `text-ink-600` anchor changed nothing, because
 * there was no `<a>` in the source to inject into.
 */
const COMPONENT_TAG = new Map([["Link", "a"], ["Image", "img"], ["NextImage", "img"]]);

/** Every `<tag className="…">` / `className={`…`}` occurrence, with the line it sits on. */
function* elements(src, rel) {
  // opening tag, then the className that belongs to it (stop at the tag's own `>`)
  const re = /<([A-Za-z][A-Za-z0-9]*)\s([^>]*?)>/gis;
  let m;
  while ((m = re.exec(src))) {
    const raw0 = m[1];
    const tag = COMPONENT_TAG.get(raw0) ?? raw0.toLowerCase();
    // a capitalised name that is not a known element-rendering component is a React
    // component whose root element we cannot know from source — skip rather than guess
    if (/^[A-Z]/.test(raw0) && !COMPONENT_TAG.has(raw0)) continue;
    if (!RULES.has(tag)) continue;
    const attrs = m[2];
    // className="…" or className={`…`} or className={`… ${x ? "a" : "b"}`}
    const cn = attrs.match(/className=(?:"([^"]*)"|\{`([\s\S]*?)`\}|\{([^}]*)\})/);
    if (!cn) continue;
    const raw = (cn[1] ?? cn[2] ?? cn[3] ?? "");
    // Collect literal class tokens: bare words, plus the contents of any "…" inside a
    // template expression (the ternary branches).
    const tokens = [];
    for (const lit of raw.match(/"[^"]*"/g) ?? []) tokens.push(...lit.slice(1, -1).split(/\s+/));
    tokens.push(...raw.replace(/\$\{[\s\S]*?\}/g, " ").split(/\s+/));
    const line = src.slice(0, m.index).split("\n").length;
    yield { tag, tokens: tokens.filter(Boolean), line, rel };
  }
}

const collisions = [];
const inert = [];
for (const f of files) {
  const src = readFileSync(f.url, "utf8");
  for (const el of elements(src, f.rel)) {
    const owned = RULES.get(el.tag);
    for (const cls of el.tokens) {
      // strip variants (hover:, lg:, focus-visible:) — a variant utility is still layered
      const bare = cls.includes(":") ? cls.slice(cls.lastIndexOf(":") + 1) : cls;
      for (const fam of FAMILY) {
        if (!fam.test(bare)) continue;
        if (!owned.has(fam.property)) continue;
        const hit = { where: `${el.rel}:${el.line}`, tag: el.tag, cls: bare, property: fam.property };
        (agrees(bare, owned.get(fam.property)) ? inert : collisions).push(hit);
      }
    }
  }
}

/* ================================================ C. REPORT
 * THE FAILURE NAMES THE ELEMENT AND THE PROPERTY FAMILY, NEVER A COUNT.
 * "3 collisions found" tells the next person nothing they can act on — it does not say which
 * file, which element, or which of its classes is the dead one, so the first move is always
 * to re-derive the whole thing by hand. #199's count assertions taught this: an assertion
 * that reports a number is an assertion someone has to re-investigate from scratch. */
if (collisions.length) {
  console.log("\n  COLLISIONS — the element draws the reset and the author's value never lands:\n");
  for (const c of collisions) {
    const reset = RULES.get(c.tag).get(c.property);
    console.log(`    ${c.where}  <${c.tag}> carries \`${c.cls}\`, which the unlayered`);
    console.log(`      \`${c.tag} { ${c.property}: ${reset} }\` rule in globals.css overrides.`);
    console.log(`      It renders ${reset}, not what \`${c.cls}\` asks for.`);
    console.log(`      Fix: re-assert unlayered under .studio-chrome (see .sechead), or move the`);
    console.log(`      utility to a child element the reset does not touch.\n`);
  }
}
t(`C1: no studio element carries a utility whose value its unlayered element rule overrides${collisions.length ? ` — see the ${collisions.length} above` : ""}`,
  collisions.map((c) => `${c.where} <${c.tag}> ${c.cls} (${c.property})`), []);

// C2 · the INERT list is reported, not failed. It is a standing inventory of utilities that
// happen to agree with their reset today and would silently stop working if edited. Pinned as
// an exact count so the list cannot grow unnoticed — a new inert site is a new place someone
// can be misled, even though nothing renders wrong right now.
if (inert.length) {
  console.log(`  INERT — same value as the reset, so nothing renders wrong, but the utility does`);
  console.log(`  NOT drive the result. Editing one of these will not take effect:\n`);
  for (const c of inert) console.log(`    ${c.where}  <${c.tag}> \`${c.cls}\` (${c.property})`);
  console.log("");
}
/* ⚠ 11 -> 3 IN #354, AND NOT ONE STUDIO PIXEL MOVED. The eight that left were seven `<p>`
 * line-heights and one heading, all of which AGREED with the reset they could not beat. #354
 * layered the paragraph leading for the PUBLIC site; the reset is global, so the studio's
 * paragraphs stopped losing to it too — and since they were asking for the value they were already
 * drawing, they now win and draw the same number.
 *
 * C1 STILL PASSES, WHICH IS THE PROOF: no studio element carries a utility its reset overrides. A
 * change that emptied this inventory while C1 held is a reclassification, not a repair and not a
 * regression. */
t("C2: the inert inventory is exactly the 11 utilities that agree with their reset (7 <p> line-heights, plus AreaHeader and StudioModal headings) — a NEW one means a new place an edit will silently do nothing. 12 before #293: the 8th <p> was the rail's hand-built notice, removed with the bespoke concept",
  inert.length, 3);

/* ================================================ D. THE FIX ITSELF IS PRESENT
 * C1 passes just as well if the bands are deleted. These pin the shape of the repair. */
{
  const panel = readFileSync(new URL("../../components/studio/BlogBlocksEditPanel.tsx", import.meta.url), "utf8");
  t("D1: both ink bands use `.sechead` — the class exists because four properties must land together and one is an arbitrary tracking",
    (panel.match(/<h2 className="sechead text-studio-cream-50">/g) ?? []).length, 2);
  t("D2: the dead utilities are GONE from the bands, not merely overridden — a class that renders nothing must not stay in the markup implying it works",
    /<h2 className="[^"]*\bfont-bold\b/.test(panel), false);
  t("D3: `.studio-chrome .sechead` is declared OUTSIDE @layer — inside one it would lose to the very reset it exists to beat",
    /\.studio-chrome \.sechead \{/.test(topLevelOnly(css)), true);
  const rule = css.match(/\.studio-chrome \.sechead \{([^}]*)\}/)?.[1] ?? "";
  for (const [prop, want] of [["font-family", "var(--font-body)"], ["font-weight", "700"], ["letter-spacing", "0.16em"]]) {
    t(`D4: .sechead sets ${prop} — the property #205 lost to the reset`,
      new RegExp(`${prop}\\s*:\\s*${want.replace(/[()\-]/g, "\\$&")}`).test(rule), true);
  }
}

console.log(`\nstudio-cascade result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
