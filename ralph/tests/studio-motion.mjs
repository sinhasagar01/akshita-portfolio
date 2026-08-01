// STUDIO MOTION TIERS — the token block, and every rule that makes it honest.
//
// Modelled on `studio-ink` section F, which polices the radius scale, because this block is the
// radius scale's twin: scoped custom properties in `.studio-chrome`, consumed through arbitrary
// values with a literal fallback, never leaking into public code. The failure modes are the
// same three, so the assertions are the same three.
//
// WHAT THIS SUITE EXISTS TO CATCH, in the order the mistakes were actually available:
//
//   1. A SECOND NAME FOR A VALUE THAT ALREADY HAS ONE. `--ease-glide` in the contract is
//      byte-identical to @theme's `--ease-out-expo`. Declaring it would have been undetectable
//      by any existing gate and would have left two names drifting apart.
//   2. A SHADOWING REDEFINITION. `--ease-spring` exists in @theme with a DIFFERENT value.
//      Declaring it inside `.studio-chrome` would silently redefine it for the whole studio.
//      Nothing consumes it today, which is why this would have gone unnoticed rather than why
//      it would have been harmless.
//   3. A UTILITY THAT EMITS NOTHING. `--duration-*` is not a Tailwind v4 namespace; four public
//      elements already ship `duration-[--duration-base]` compiling to an invalid declaration.
//      D below is the studio's half of that, and the public half is a recorded hazard.
//
// Every value is read from source. Nothing here is a list of the sites that happen to exist.
import { readFileSync, readdirSync } from "node:fs";

let pass = 0;
let fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) {
    pass++;
    console.log(`  [PASS] ${name}`);
  } else {
    fail++;
    console.log(`  [FAIL] ${name}`);
    console.log(`     got  ${JSON.stringify(got)}`);
    console.log(`     want ${JSON.stringify(want)}`);
  }
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
// Comments are stripped before any census. THE COMMENT TRAP HAS FIRED FOUR TIMES in this repo
// (#239, #240, #248, and the radius scale's own `rounded` prose), and this file's own header
// names every token it is about — so reading raw source here would count the documentation.
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// BALANCED EXTRACTION, BECAUSE `[^)]` AND `[\s\S]*?\}` BOTH LIE ON NESTED INPUT.
// Two of this suite's own assertions shipped wrong on the first run and were caught here:
// a fallback regex using `[^)]+` truncated `cubic-bezier(0.34,1.35,0.5,1)` at its inner paren,
// and a block regex using `[\s\S]*?\n\}` closed the @media at the FIRST nested rule's brace
// and then asserted on the fragment. Same family as `studio-ink` C2's `<input\b[^>]*>` stopping
// at the `=>` inside a ref arrow. A matcher that cannot see nesting reports confidently on the
// wrong text, so both are balanced counts now rather than patterns.
const balanced = (src, startIdx, open, close) => {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) {
      depth--;
      if (depth === 0) return src.slice(startIdx, i + 1);
    }
  }
  return "";
};
const blockAt = (src, re) => {
  const m = re.exec(src);
  if (!m) return "";
  const brace = src.indexOf("{", m.index);
  return brace < 0 ? "" : balanced(src, brace, "{", "}");
};
const css = read("app/globals.css");
const cssNoComments = strip(css);

const studioFiles = [];
const walk = (dir) => {
  for (const e of readdirSync(new URL(`../../${dir}`, import.meta.url), { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${dir}/${e.name}`);
    else if (/\.tsx?$/.test(e.name)) studioFiles.push(`${dir}/${e.name}`);
  }
};
walk("components/studio");
walk("app/studio");

console.log("\nstudio-motion");

/* ================================================================= A. THE BLOCK ITSELF */

// The declared block, taken as text so every later section derives from it rather than from a
// list written here.
const BLOCK = blockAt(cssNoComments, /\.studio-chrome\s*\{(?=[^}]*--studio-ease-settle)/);
const declared = [...BLOCK.matchAll(/(--studio-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [
  m[1],
  m[2].trim(),
]);
const names = declared.map(([n]) => n);

t("A1: the motion block exists and is scoped to .studio-chrome, not :root", BLOCK !== "", true);
t("A2: it declares every tier — t0 through t4, the dismiss, both distances, one easing",
  names.length, 13);

// A3 — THE TIER RAMP. The tiers are an ORDER before they are durations, so the order is what is
// asserted: the lead is quicker than the structure, the echo sits between them, and the dismiss
// is decisively faster than the entrance it undoes. A drawing can be copied wrong; a ramp cannot
// be satisfied by accident.
const ms = (n) => Number((declared.find(([k]) => k === n)?.[1] ?? "").replace("ms", ""));
t("A3: T1 is quicker than T2 — the lead resolves before the structure it leads",
  ms("--studio-t1") < ms("--studio-t2"), true);
t("A3: T3 sits between them — an echo, not an event",
  ms("--studio-t3") > ms("--studio-t1") && ms("--studio-t3") < ms("--studio-t2"), true);
t("A3: the delays are a strict ramp — t2 < t3 < t4a < t4b, so the eye is given an order",
  [ms("--studio-t2-delay"), ms("--studio-t3-delay"), ms("--studio-t4a"), ms("--studio-t4b")],
  [40, 90, 150, 190]);
t("A3: dismiss is under half of T2 — an exit that mirrors its entrance reads as undoing",
  ms("--studio-out") * 2 < ms("--studio-t2"), true);

/* ================================================================= B. WHAT IS DELIBERATELY ABSENT
 * The two easings the contract asked for and neither of which is declared. This section is the
 * reason the suite exists: both would have been invisible to every other gate. */

t("B1: `--ease-glide` is NOT declared — it is byte-identical to @theme's --ease-out-expo",
  /--ease-glide\s*:/.test(cssNoComments), false);

// B2 — AND THE VALUE IT WOULD HAVE DUPLICATED IS STILL THERE, unchanged. Asserting only the
// absence would pass just as well if someone deleted --ease-out-expo instead, which is the
// opposite of the intent.
t("B2: …and --ease-out-expo still holds that value, so the tiers have something to point at",
  /--ease-out-expo:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/.test(cssNoComments), true);

// B3 — THE SHADOWING ONE. `--ease-spring` may exist in @theme; it must NOT be redeclared inside
// the studio block, where it would silently redefine the theme token for every descendant.
t("B3: the studio block does NOT redeclare `--ease-spring` — that would shadow @theme's",
  /--ease-spring\s*:/.test(BLOCK), false);
t("B3b: …and the studio's own spring is named distinctly",
  /--studio-ease-settle:\s*cubic-bezier\(/.test(BLOCK), true);

// B4 — THE TWO SPRINGS ARE GENUINELY DIFFERENT VALUES. If they ever converge, B3's distinct name
// becomes the very duplication B1 forbids, and the honest fix flips to reusing @theme's.
const themeSpring = css.match(/--ease-spring:\s*(cubic-bezier\([^)]*\))/)?.[1]?.replace(/\s/g, "");
const studioSpring = BLOCK.match(/--studio-ease-settle:\s*(cubic-bezier\([^)]*\))/)?.[1]?.replace(/\s/g, "");
t("B4: the two springs differ — a distinct name is only honest while the value is distinct",
  themeSpring !== undefined && studioSpring !== undefined && themeSpring !== studioSpring, true);

/* ================================================================= C. EVERY USE CARRIES ITS FALLBACK
 * `studio-ink` F3's rule, and F3's lesson: its own first regex could never fire and only mutation
 * testing caught it. A bare `var(--studio-t1)` degrades to NOTHING when the token is out of
 * scope; with the literal it degrades to the right number. */

const uses = [];
for (const f of studioFiles) {
  const src = strip(read(f));
  for (const m of src.matchAll(/var\(\s*(--studio-(?:t\d|out|rise|detail|ease-settle)[a-z0-9-]*)\s*([,)])/g)) {
    uses.push({ file: f, token: m[1], hasFallback: m[2] === "," });
  }
}

// C1 — PER TOKEN, NOT OVER THE SET. The first version asserted `uses.length > 0`, which is true
// the moment ANY token is read — and `--studio-t0` shipped in #258 declared and consumed by
// NOTHING while this passed. That is the `FIT_THRESHOLD_PX` shape (a constant with zero
// consumers) and the same "an existence check over a set proves nothing about a member" mistake
// G5 made. Every declared token must have a reader, and the reader may be JS: T0 is read through
// `getComputedStyle` to time the mark, not through a CSS transition.
{
  const jsReads = studioFiles.map((f) => strip(read(f))).join("\n");
  const unconsumed = names.filter(
    (n) => !uses.some((u) => u.token === n) && !jsReads.includes(`"${n}"`) && !cssNoComments.includes(`var(${n},`)
  );
  t("C1: EVERY declared token has a consumer — a token nothing reads is a constant with no callers",
    unconsumed, []);
}
t("C2: EVERY use carries a literal fallback — no bare `var(--studio-…)` anywhere in studio",
  uses.filter((u) => !u.hasFallback).map((u) => `${u.file} — ${u.token}`), []);

// C3 — AND THE FALLBACK EQUALS THE DECLARED VALUE. A fallback that disagrees is worse than none:
// it renders one number in the studio and a different one anywhere the scope does not reach,
// which is precisely the drift the literal was added to prevent.
const wrongFallback = [];
const norm = (v) => v.replace(/\s/g, "");
for (const f of studioFiles) {
  const src = strip(read(f));
  for (const m of src.matchAll(/var\(\s*(--studio-[a-z0-9-]+)\s*,/g)) {
    const declaredValue = declared.find(([k]) => k === m[1])?.[1];
    if (declaredValue === undefined) continue;
    // Take the whole var(...) by balance, then everything after the first comma is the fallback.
    const whole = balanced(src, src.indexOf("(", m.index), "(", ")");
    const fallback = whole.slice(whole.indexOf(",") + 1, -1).trim();
    if (norm(fallback) !== norm(declaredValue)) {
      wrongFallback.push(`${f} — ${m[1]} falls back to ${fallback}, declared ${declaredValue}`);
    }
  }
}
t("C3: every fallback equals its declared value — a disagreeing fallback renders two numbers",
  wrongFallback, []);

/* ================================================================= D. NO DEAD UTILITY FAMILY
 * `duration-*` resolves from --transition-duration-*, `delay-*` from --transition-delay-*. A
 * `duration-[--studio-t1]` — bracket-bare, no var() — compiles to an INVALID declaration the
 * browser drops, and no existing gate catches it. Four public sites ship exactly that shape
 * today; this keeps the studio out of that set. */

const bareBracket = [];
for (const f of studioFiles) {
  const src = strip(read(f));
  for (const m of src.matchAll(/(duration|delay|ease|translate-y)-\[--[a-z0-9-]+\]/g)) {
    bareBracket.push(`${f} — ${m[0]} emits an invalid declaration, use [var(--…,fallback)]`);
  }
}
t("D1: no bracket-bare motion utility in studio — that shape compiles to nothing", bareBracket, []);

/* ================================================================= E. REDUCED MOTION, BOTH HALVES
 * The global `*` reset zeroes transition-duration and NOT transition-delay. With four delay
 * tokens that is a dead pause followed by a snap. */

// ANCHORED ON THE FIRST SELECTOR, not on "contains .studio-chrome within N chars". There are 17
// reduced-motion blocks in this stylesheet, and a proximity lookahead matched a BLOG one whose
// neighbour happened to hold the string — then every E assertion ran against the wrong block and
// reported false. `{` immediately followed by the selector is the only reading that cannot drift
// with what sits nearby.
const reduceBlock = blockAt(cssNoComments, /@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\.studio-chrome)/);
t("E1: a studio-scoped reduce block exists", reduceBlock !== "", true);
t("E2: it zeroes transition-delay, which the global `*` reset does not",
  /transition-delay:\s*0ms\s*!important/.test(reduceBlock), true);
t("E2b: …and animation-delay with it", /animation-delay:\s*0ms\s*!important/.test(reduceBlock), true);

// E3 — THE DISTANCES ZERO TOO, and this is the half that keeps the final state pixel-identical.
// Zeroing a duration makes a translate INSTANT, not ABSENT; the offset has to stop existing.
t("E3: both distances zero under reduce — a duration of 0 lands an offset instantly, not nowhere",
  /--studio-rise:\s*0px/.test(reduceBlock) && /--studio-detail:\s*0px/.test(reduceBlock), true);

// E4 — SCOPED, NOT GLOBAL. Widening the `*` reset would change PUBLIC reduced-motion behaviour
// from inside a studio change. The shared seam is the obvious home and the wrong one.
t("E4: the delay reset is scoped to .studio-chrome, not added to the global `*` rule",
  /\.studio-chrome \*/.test(reduceBlock), true);
const globalReset = blockAt(cssNoComments, /@media \(prefers-reduced-motion: reduce\)\s*\{(?=\s*\*,)/);
t("E4b: …and the global reset is left alone, still zeroing duration and scroll-behavior only",
  /transition-duration/.test(globalReset) &&
    /scroll-behavior:\s*auto\s*!important/.test(globalReset) &&
    !/transition-delay/.test(globalReset),
  true);

/* ================================================================= F. NO LEAK INTO PUBLIC CODE
 * `studio-ink` F6's rule. A studio token reaching a case-study or blog component would move a
 * corner — or here, a duration — on the live site from a block scoped to an admin surface. */

const PUBLIC_DIRS = ["components/case-study", "components/blog", "app/(portfolio)"];
const leaks = [];
for (const dir of PUBLIC_DIRS) {
  const files = [];
  const w = (d) => {
    for (const e of readdirSync(new URL(`../../${d}`, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) w(`${d}/${e.name}`);
      else if (/\.tsx?$/.test(e.name)) files.push(`${d}/${e.name}`);
    }
  };
  w(dir);
  for (const f of files) if (/--studio-t\d|--studio-out|--studio-rise|--studio-detail|--studio-ease/.test(read(f))) leaks.push(f);
}
t("F1: zero studio motion tokens in public component code", leaks, []);

// F2 — THE ONE DELIBERATE EXCEPTION, STATED. `.cs-editable` lives in globals.css and is studio-
// only by emission (the case-study components add the class only when `editable`), but the RULE
// is global, so it reads --studio-t1 with a fallback. That fallback is what makes it correct
// outside `.studio-chrome` — on /dev/parity, which renders `editable` with no studio shell.
t("F2: the canvas mark reads the tier WITH its fallback, so it holds outside .studio-chrome too",
  /background-size var\(--studio-t1,\s*220ms\)/.test(cssNoComments), true);

/* ================================================================= G. T3, THE ECHO
 * THE TWO HALVES ARE ASSERTED SEPARATELY, AND THAT IS THE WHOLE POINT OF THIS SECTION.
 *
 * #258's PR body claimed "T3 fires only when the field is visible" and T3 DID NOT EXIST — no
 * mark, no rule, no application, no visibility test. **A condition that never fires and a mark
 * that renders nothing are indistinguishable from outside**, so a single assertion spanning both
 * would have passed on an empty feature just as happily as on a working one. G1-G3 assert the
 * TREATMENT exists; G4-G7 assert it is APPLIED. Neither implies the other.
 *
 * A gate reading class strings could not have caught the original failure, because the failure
 * was the ABSENCE of a class string. What makes these assertions real is that each one names a
 * concrete artefact that must be present — a rule, an attribute, a filter — rather than checking
 * that some existing text is well-formed. */
{
  const sections = strip(read("components/studio/SectionsEditPanel.tsx"));
  const shell = strip(read("components/studio/blocks/SectionShell.tsx"));
  const fields = strip(read("components/studio/blocks/fields.tsx"));

  /* ---- THE MARK EXISTS AND RENDERS SOMETHING ---- */
  const markRule = blockAt(cssNoComments, /\.studio-chrome \[data-studio-field\]\.is-echoed\s*\{/);
  t("G1: the echo has a rule of its own — it is not the canvas's `.cs-editable.is-selected`",
    markRule !== "", true);
  t("G2: …and it declares BOTH halves of the treatment, the ground step and the bar",
    /background-color:\s*var\(--color-cream-200\)/.test(markRule) &&
      /box-shadow:\s*inset var\(--studio-echo-bar\) 0 0 0 var\(--color-accent-500\)/.test(markRule), true);

  // G2b — THE BAR'S WIDTH HAS ONE SOURCE. It is read by the shadow that DRAWS the bar and by the
  // inset that clears room for it; two literals would be two places to drift, and the failure
  // would be a control sitting proud of its own mark by a pixel or two — visible, and the kind
  // of thing nobody files.
  const base = blockAt(cssNoComments, /\.studio-chrome \[data-studio-field\]\s*\{/);
  t("G2b: the bar width is declared once and read by both the mark and the flush inset",
    /--studio-echo-bar:\s*3px/.test(base) &&
      (cssNoComments.match(/var\(--studio-echo-bar\)/g) ?? []).length >= 4, true);

  // G3 — NO BORDER AND NO WIDTH. `box-shadow: inset` cannot participate in layout; a
  // `border-left: 3px` would push every field's content 3px right on selection, and THE
  // INSPECTOR HAS NO PARITY HARNESS to catch it. Same constraint that made T1 a background
  // rather than a pseudo-element, and the constraint DeviceImage's wrapper <span> ignored when
  // it collapsed a 760px frame to ~90px.
  t("G3: the mark moves nothing — no border, no width, no padding in the rule",
    /border|width|padding|margin/.test(markRule), false);

  // G3b — AND IT FADES RATHER THAN DRAWS. T1 wipes (background-size), T3 fades (colour only).
  // If the echo drew itself the eye would not know which of the two was the answer.
  t("G3b: the echo is a colour fade at T3's timing, not a wipe",
    /transition:[\s\S]*?background-color var\(--studio-t3, 260ms\)[\s\S]*?var\(--studio-t3-delay, 90ms\)/.test(markRule),
    true);

  /* ---- THE MARK IS APPLIED, AND ONLY TO SOMETHING RENDERED ---- */
  t("G4: the class is applied from an effect rooted at the INSPECTOR, not the canvas surface",
    /inspectorRef\.current[\s\S]{0,400}?querySelectorAll\("\.is-echoed"\)/.test(sections), true);
  // G5 — BOTH components, and BOTH optional. The first version of this tested `.test()` for a
  // single `fieldId?: string;`, which appears TWICE — so making ONE of them required left the
  // other to satisfy the regex and the mutation survived. Counting is the fix, and it is the
  // same "require both sides to resolve" rule that #257 recorded: an existence check over a
  // set of two proves nothing about the second one.
  t("G5: BOTH field components take the address, and BOTH keep it optional so unset call sites are untouched",
    [(fields.match(/fieldId\?: string;/g) ?? []).length,
     (fields.match(/data-studio-field=\{fieldId\}/g) ?? []).length], [2, 2]);

  // G6 — EVERY SECTION EDITOR IS MOUNTED AND HIDDEN, so the address matches once per section.
  // Without the rendered-ness filter the mark lands in a panel nobody is looking at and the
  // visible field stays bare — which looks EXACTLY like no T3 at all, i.e. the bug being fixed.
  t("G6: the applied node is filtered on rendered-ness — the selector matches once per section",
    /\.find\(\(n\) => n\.offsetParent !== null\)/.test(sections), true);

  /* ---- THE FLUSH CONTROL. A DELIBERATE GEOMETRY CHANGE, WHICH IS WHY IT IS ASSERTED APART
   * FROM G3. G3 says the MARK moves nothing; this rule moves the CONTROL on purpose, 3px, so
   * that it sits against the bar rather than beside it. The two claims would contradict each
   * other if they shared an assertion. */
  const flush = blockAt(cssNoComments,
    /\.studio-chrome \[data-studio-field\]\.is-echoed :is\(input, textarea, select\)\s*\{/);
  t("G8: the flush rule exists and insets the control by the bar, not by a literal",
    /margin-left:\s*var\(--studio-echo-bar\)/.test(flush), true);

  // G8b — THE WIDTH IS DERIVED FROM THE CONTAINER. A pinned px would be correct at one pane
  // width and wrong at every other, and the sidebar drag moves every pane. The studio ships no
  // literal widths; this is that rule applied to a rule that could easily have carried one.
  t("G8b: the width is `container minus bar`, so it tracks the pane instead of pinning it",
    /width:\s*calc\(100% - var\(--studio-echo-bar\)\)/.test(flush), true);
  t("G8c: …and no literal px width crept in beside it",
    /width:\s*\d+px/.test(flush), false);

  // G9 — ONLY THE LEFT EDGE IS FLATTENED. `border-radius: 0` and `border-left: 0` as shorthands
  // would kill the control's other three corners and its other three edges, which is a different
  // control rather than a flush one. The longhands are the whole difference.
  t("G9: only the LEFT corners and the LEFT border are removed, not all four",
    /border-top-left-radius:\s*0/.test(flush) &&
      /border-bottom-left-radius:\s*0/.test(flush) &&
      /border-left-width:\s*0/.test(flush), true);
  t("G9b: …and no shorthand that would flatten the other three edges with them",
    /border-radius:\s*0|border:\s*0|border-left:\s*0[^-]/.test(flush), false);

  // G7 — THE ADDRESSES ARE THE CANVAS'S SET, derived rather than listed. The canvas can select
  // exactly four section fields; advertising a fifth would promise an echo that can never fire.
  const wired = [...shell.matchAll(/fieldId="([a-zA-Z]+)"/g)].map((m) => m[1]).sort();
  t("G7: the four wired addresses are exactly the four the canvas can select",
    wired, ["eyebrow", "lead", "northStar", "title"]);
}

/* ================================================================= H. T0's INSPECTOR HALF
 * **THIS OVERRULES #258, WHICH SHIPPED T0 CANVAS-ONLY DELIBERATELY.** The reasoning it gave has
 * not stopped being true — a scroll to a folded row lands on nothing and looks exactly like the
 * scroll not firing — so the remedy changed rather than the reasoning: OPEN the group, then
 * scroll, then mark. These assertions pin the parts that make that safe. */
{
  const sections = strip(read("components/studio/SectionsEditPanel.tsx"));

  // H1 — THE GROUP IS OPENED THROUGH ITS OWN CONTROL. #234 kept `CollapsibleGroup`'s state local
  // on purpose, so it needs no persistence layer and no id registry. Lifting that state or
  // building a registry to address it is the machinery #234 declined to build; clicking the
  // toggle needs neither, and the group's own handler runs.
  t("H1: folded groups are opened by clicking their own toggle, not by new state machinery",
    /\[aria-controls="\$\{CSS\.escape\(n\.id\)\}"\]\[aria-expanded="false"\]/.test(sections), true);
  t("H1b: …and nothing lifted CollapsibleGroup's state to do it",
    /defaultOpen|openGroups|setGroupOpen/.test(strip(read("components/studio/blocks/CollapsibleGroup.tsx")))
      && /useState\(defaultOpen\)/.test(strip(read("components/studio/blocks/CollapsibleGroup.tsx"))), true);

  // H2 — THE SCROLL WAITS FOR THE COMMIT. React commits the open asynchronously, and a scroll
  // issued before it is clamped to the PRE-EXPANSION range — #258's third T0 bug on a different
  // scroller. Two frames: one for the commit, one for layout at the new height.
  t("H2: the scroll is deferred two frames, so it cannot be clamped to the pre-expansion range",
    /requestAnimationFrame\(\(\) =>\s*requestAnimationFrame\(/.test(sections), true);

  // H3 — THE HONEST FALLBACK. If the group cannot be opened, scroll to its header rather than to
  // a field that is not rendered. Landing on the row you would have to expand is honest; landing
  // on nothing is the failure #258 chose not to ship at all.
  t("H3: an unopenable group scrolls to its header rather than to nothing",
    /closest\("\[hidden\]"\)\?\.previousElementSibling/.test(sections), true);

  // H4 — THE DOCK'S INSET IS CANVAS-ONLY. The dock is a sibling of the CANVAS scroller; the
  // inspector is a separate aside the dock never touches. Subtracting 113px from the inspector's
  // viewport would push every inspector reveal too far down — the same arithmetic being right
  // for one box and wrong for another.
  t("H4: the dock's pending height insets the CANVAS viewport only, asked of the DOM not assumed",
    /dockNode\.parentElement\?\.contains\(scroller\)/.test(sections), true);

  // H5 — THE MARK IS TIMED FROM THE TOKEN. 55% of T0, read rather than retyped — and this is what
  // finally gives `--studio-t0` a consumer (see C1).
  t("H5: the mark starts at 55% of T0, read from the token",
    /readStudioMs\("--studio-t0"\)/.test(sections) && /\* 0\.55/.test(sections), true);

  // H6 — AND UNDER REDUCE THE TOKEN ITSELF IS ZERO. A token read by JS is a number, not a
  // transition, so the global `transition-duration` reset cannot reach it. Zeroing it in CSS is
  // what keeps the studio free of `matchMedia` — the same CSS-decides route the scroll takes.
  t("H6: --studio-t0 is zeroed under reduce, so the JS read needs no motion query",
    /--studio-t0:\s*0ms/.test(reduceBlock), true);

  // H7 — ONE DEFINITION OF "IN VIEW". `willReveal` and `revealIfNeeded` both go through
  // `revealTarget`; computing the test twice is how "will it scroll" and "did it scroll" drift,
  // and the mark would then be timed against a scroll that never happened.
  t("H7: the in-view test has ONE definition, shared by the asker and the scroller",
    (sections.match(/function revealTarget\(/g) ?? []).length === 1 &&
      /return revealTarget\(el\) !== null;/.test(sections) &&
      /const t = revealTarget\(el\);/.test(sections), true);
}

console.log(`\nstudio-motion result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
