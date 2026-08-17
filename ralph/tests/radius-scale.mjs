// THE RADIUS-SCALE GATE — the declared radius ramp is monotonic, and nothing reaches off it.
// Run: node ralph/tests/radius-scale.mjs
//
// ---- THE MECHANISM (hazard 24) --------------------------------------------------------
//
// Tailwind v4 ships DEFAULT radius steps, and `@theme` OVERRIDES only the ones you redeclare.
// This project declares `sm md lg xl full` and deliberately stops the ramp at `xl` — it never
// declares `2xl`. But `rounded-2xl` still generates CSS, because Tailwind's own default
// `--radius-2xl: 1rem` is left behind. So `rounded-2xl` renders 1rem — EQUAL to `lg` and SMALLER
// than `xl` (1.5rem). The name says "bigger than xl"; the screen shows "equal to lg". The two
// public consumers (the blog featured card, visually inert, and the footer panel, a real 16px
// corner) had reached a step off the project's own scale without anyone choosing its value.
//
// This is `text-ink-500`'s FIRST HALF (hazard 23) in another property: a Tailwind default typed
// from muscle memory into a project whose scale considered that step and declined it. There it
// generated NOTHING; here it generates the WRONG thing, out of order. Same cause, same fix — do
// not accommodate the stray step, remove the reach for it, and gate so the next one fails on
// arrival rather than after a year on screen.
//
// ---- WHY TWO ASSERTIONS, NOT ONE ------------------------------------------------------
//
// B1 walks every radius UTILITY in the repo and fails any whose `--radius-<step>` @theme does not
// declare — the `studio-tokens` shape, generalised from colour to radius. That is what catches
// `rounded-2xl` today and `rounded-3xl` tomorrow, at the SITE, named, never as a count.
//
// A1 asserts the DECLARED ramp is strictly increasing. B1 alone would pass a future PR that
// re-declares `--radius-2xl: 1rem` to "fix" the undeclared-token failure while KEEPING the
// inversion — the token now exists, so B1 is satisfied, and 2xl is still below xl. A1 is the
// guard STATE asked for: "a future PR that redefines the scale and inherits the inversion
// silently." Redeclaring 2xl at 1rem fails A1 because 1rem is not greater than xl's 1.5rem.
//
// ---- SCOPE: WHOLE REPO, NOT studio -----------------------------------------------------
//
// Unlike the studio gates, this one scans app + components + lib. The radius scale is one @theme
// ramp the whole site shares, and both consumers of the defect are PUBLIC (outside studio), so a
// studio-only scan would have been blind to exactly the two sites the hazard lives in.
import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* ================================================ A. THE DECLARED RAMP, FROM @theme
 * Parsed, never listed — the same move as studio-tokens' colour set. A step retuned in globals.css
 * is picked up here on the next run. Values normalised to px (1rem = 16px) for ordering. */
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const toPx = (v) => v.endsWith("rem") ? parseFloat(v) * 16 : parseFloat(v); // rem or px
const RADIUS = {};
for (const m of css.matchAll(/--radius-([a-z0-9]+):\s*([\d.]+(?:rem|px))/g)) RADIUS[m[1]] = toPx(m[2]);

// The RAMP is the sized steps in ascending intent; `full` is the pill sentinel (a huge fixed
// value meaning "max"), not a rung, so it is excluded from the monotonic check. Only steps the
// project actually declares are asserted, in canonical order.
const RAMP_ORDER = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"];
const declaredRamp = RAMP_ORDER.filter((s) => s in RADIUS);

t("A0: the declared ramp is exactly the five the project chose — sm md lg xl full, and NOT 2xl (the step it considered and dropped)",
  { sm: "sm" in RADIUS, md: "md" in RADIUS, lg: "lg" in RADIUS, xl: "xl" in RADIUS, full: "full" in RADIUS, "2xl": "2xl" in RADIUS },
  { sm: true, md: true, lg: true, xl: true, full: true, "2xl": false });

// A1 — strictly increasing. If a future PR declares 2xl at 1rem to silence B1, this fails because
// 1rem is not > xl's 1.5rem; if it declares it at ≥1.5rem+ε it passes, which is the honest way to
// re-add the step. Reports the first inversion by name and value, never a bare boolean.
let inversion = null;
for (let i = 1; i < declaredRamp.length; i++) {
  const lo = declaredRamp[i - 1], hi = declaredRamp[i];
  if (!(RADIUS[hi] > RADIUS[lo])) { inversion = `--radius-${hi} (${RADIUS[hi]}px) is not greater than --radius-${lo} (${RADIUS[lo]}px)`; break; }
}
t(`A1: the declared radius ramp is strictly increasing${inversion ? ` — ${inversion}` : ""}`, inversion, null);

/* ================================================ B. EVERY RADIUS UTILITY RESOLVES TO A DECLARED STEP
 * Walk app + components + lib. A `rounded[-side]-<step>` utility whose `--radius-<step>` is not in
 * @theme is the hazard — it reaches a Tailwind default off the project's ramp. Arbitrary values
 * (`rounded-[9px]`) are literal and skipped; `rounded-none` is 0 and needs no token. */
const roots = ["app", "components", "lib"];
const files = [];
const walk = (rel) => {
  for (const e of readdirSync(new URL(`../../${rel}`, import.meta.url), { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child);
    else if (/\.(tsx?|css)$/.test(e.name)) files.push(child);
  }
};
for (const r of roots) walk(r);

// A radius CLASS is parsed STRUCTURALLY, not by one greedy regex — a side-only utility with an
// arbitrary value (`rounded-r-[4px]`) must not have its side letter misread as a step. Find each
// `rounded…` class token, strip any variant prefix (`lg:`, `hover:`), then split into an optional
// SIDE and an optional SIZE. Skip when the size is absent (bare or side-only default), arbitrary
// (`[..]`), or `none` (0). Only a NAMED size is looked up against the declared ramp.
const SIDES = new Set(["t", "r", "b", "l", "tl", "tr", "br", "bl", "ss", "se", "es", "ee", "s", "e", "x", "y"]);
const CLASS = /(?:^|[\s"'`{])((?:[a-z-]+:)*rounded(?:-[a-z0-9\][#(),.%_-]+)*)/g;
const offenders = [];
for (const rel of files) {
  // Blank comment CONTENT but keep newlines, so reported line numbers match the real file.
  const src = readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, "");
  src.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(CLASS)) {
      const bare = m[1].replace(/^(?:[a-z-]+:)*/, "");     // drop variant prefixes
      let rest = bare.slice("rounded".length);              // "", "-r", "-lg", "-r-lg", "-[4px]", "-r-[4px]"
      if (rest === "") continue;                            // bare `rounded` = default, no named step
      rest = rest.replace(/^-/, "");
      const parts = rest.split("-");
      if (SIDES.has(parts[0])) parts.shift();               // consume a leading side
      const size = parts.join("-");                          // "" | named step | "[..]"
      if (size === "" || size.startsWith("[")) continue;    // side-only default, or arbitrary literal
      if (size === "none") continue;                        // rounded-none = 0
      if (size === "full") { if (!("full" in RADIUS)) offenders.push({ where: `${rel}:${i + 1}`, utility: bare, step: size }); continue; }
      if (!(size in RADIUS)) offenders.push({ where: `${rel}:${i + 1}`, utility: bare, step: size });
    }
  });
}

if (offenders.length) {
  console.log("\n  UNDECLARED RADIUS STEPS — these utilities reach a Tailwind default off the project's ramp:\n");
  for (const o of offenders) {
    console.log(`    ${o.where}`);
    console.log(`      \`${o.utility}\` reads \`--radius-${o.step}\`, which @theme does NOT declare (the ramp stops at xl).`);
    console.log(`      Tailwind's own default fills it in, so it renders a value nobody chose and can sit out of scale order.`);
    console.log(`      Fix: use a declared step (sm md lg xl full), or declare --radius-${o.step} above xl if the ramp really needs it.\n`);
  }
}
t(`B1: every radius utility in app + components + lib resolves to a declared @theme step${offenders.length ? " — see above" : ""}`,
  offenders.map((o) => `${o.where} ${o.utility} (--radius-${o.step} undeclared)`), []);

/* ================================================ C. THE CASE-STUDY RADIUS CENSUS
 * ⚠ THE SHEET GRAMMAR'S RADIUS RESET CANNOT REACH A UTILITY, WHICH IS WHY THIS IS A LIST AND NOT A
 * RULE. `.sheet-scope * { border-radius: 0 }` sits in `@layer base`, and every radius utility sits
 * in `@layer utilities`, which comes later and wins. The home page's radius unit therefore did
 * BOTH — the layered reset for CSS-declared corners and a removal at SOURCE for utilities — and the
 * four utilities it left behind are the tell: a radial glow, a 6px dot, a spinner ring and a 46px
 * icon circle. Every one of them IS a circle.
 *
 * ⚠ SO THE RULING IS DERIVED FROM WHAT SHIPPED RATHER THAN FROM A PREFERENCE, and it is one
 * sentence: A BOX AROUND CONTENT LOSES ITS RADIUS. A CIRCLE KEEPS IT BECAUSE IT IS ONE. A DEPICTED
 * OBJECT KEEPS IT BECAUSE THE THING IT DRAWS IS ROUND. A CONTROL WAITS FOR THE NAV DECISION.
 *
 * The depicted half is the artwork rule this repository already states against a mechanical sweep:
 * a phone bezel is near-black AND round because phones are, and the same six characters on a bezel
 * and on a dark card mean different things. A blanket `.case-study *` reset would square the phone
 * mockups and the browser windows, so the reset was NOT extended and 15 sites were judged instead.
 *
 * ⚠ AND THE CONTROLS ARE DEFERRED RATHER THAN FORGOTTEN. The nav is still a pill on every page and
 * that is a standing owner decision; squaring a case study's buttons while the site's primary
 * control stays round would answer it by accident, in the wrong place.
 *
 * ---- ⚠ THE BOUNDARY THIS WALK CANNOT SEE, STATED SO THE CENSUS IS NOT READ AS COMPLETE ---------
 *
 * THIS SECTION'S SUBJECT IS UTILITIES IN `.tsx`. Case-study corners also arrive from CSS, and those
 * are a DIFFERENT POPULATION this walk is blind to by construction — measured on the rendered page:
 * `.pr-card` at 12px and `.pr-dash` at 2px in the preview rail, `.pr-tick:focus-visible` at 3px,
 * `.cs-preview-hint` as a pill, and `HeroAura`'s three 50% circles. The rail is a navigation
 * CONTROL and the hint is an affordance, so both fall under the deferral above, and the aura
 * circles are circles.
 *
 * A denominator computed inside a walk cannot see the walk's own edge, which this repository
 * records against a `.tsx`-only sweep that missed 81 references in `globals.css`. Naming the second
 * route here is the whole remedy: a reader who wants "every corner in a case study" needs both. */
{
  const dir = new URL("../../components/case-study/", import.meta.url).pathname;
  const walkCs = (d, out = []) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = d + e.name;
      if (e.isDirectory()) walkCs(p + "/", out);
      else if (/\.tsx$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const blank = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
  /* ⚠ EVERY SURVIVOR IS NAMED WITH WHAT IT DRAWS, not merely counted. A total goes green when one
     corner is retired and another added; a list fails ON ARRIVAL with the file that added it — the
     shape `typography` section E was built for after three miscounts of a different population. */
  const EXPECTED = {
    "Annotation.tsx": ["CIRCLE — the 11px callout dot, which is a dot"],
    "DeviceImage.tsx": [
      "CONTROL — the studio Replace affordance, deferred with the nav decision",
      "DEPICTED — the browser window frame the mock draws",
      "DEPICTED — a chrome dot in the mock's title bar",
      "DEPICTED — a chrome dot in the mock's title bar",
      "DEPICTED — a chrome dot in the mock's title bar",
      "DEPICTED — the url pill in the mock's chrome",
      "DEPICTED — the laptop screen bezel, round because devices are",
      "DEPICTED — the laptop's base bar, whose bottom corners are round because the case is",
      "DEPICTED — the trackpad notch cut into that base bar",
    ],
    "ImagePreview.tsx": [
      "CONTROL — a lightbox button, deferred with the nav decision",
      "CONTROL — a lightbox button, deferred with the nav decision",
    ],
    "blocks/BeforeAfter.tsx": ["CIRCLE — the 6px bullet dot"],
    "blocks/BeforeAfterStory.tsx": [
      "CIRCLE — the 9px rail stop, drawn as a ring",
      "CIRCLE — the 3px progress capsule, whose ends are round because it is a capsule",
    ],
    "blocks/FigureGrid.tsx": ["CONTROL — the studio Replace affordance, deferred with the nav decision"],
    "blocks/Stepper.tsx": ["CIRCLE — the 9px step dot"],
    "blocks/VideoEmbed.tsx": [
      "DEPICTED — the browser window frame, sharing DeviceImage's ruling by design",
      "DEPICTED — a chrome dot in the mock's title bar",
      "DEPICTED — a chrome dot in the mock's title bar",
      "DEPICTED — a chrome dot in the mock's title bar",
      "DEPICTED — the url pill in the mock's chrome",
      "DEPICTED — the video frame inside the same mock",
      "CIRCLE — the 1.5px tag dot",
    ],
    "blocks/WorkStory.tsx": [
      "CONTROL — the previous-feature button, deferred with the nav decision",
      "CIRCLE — the 1.5px live dot",
      "CONTROL — the next-feature button, deferred with the nav decision",
    ],
  };
  /* ⚠ THE DIRECTIONAL VARIANTS ARE IN THE PATTERN, AND THE FIRST DRAFT LEFT THEM OUT — a matcher
     narrower than its concept, inside the census written to stop exactly that, on the same day. It
     read `rounded-(none|sm|…|full|[…])` and so could not see `rounded-b-lg` or `rounded-b-md`, which
     is the laptop's base bar and its trackpad notch. Both are DEPICTED and neither ruling changed;
     the COUNT was wrong by two and the census would have reported DeviceImage as complete.
     Found by looking at the rendered page and asking where the bezels were. */
  const RADIUS_UTIL = /\brounded(?:-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\])/g;
  const found = {};
  const csFiles = walkCs(dir);
  for (const f of csFiles) {
    const rel = f.slice(dir.length);
    const hits = blank(readFileSync(f, "utf8")).match(RADIUS_UTIL);
    if (hits) found[rel] = hits.length;
  }
  const expectedCounts = Object.fromEntries(Object.entries(EXPECTED).map(([k, v]) => [k, v.length]));
  t("C1 ⚠ THE CASE-STUDY RADIUS SURVIVORS ARE NAMED PER FILE — a new corner on a box fails here with the file that added it",
    found, expectedCounts);
  /* ⚠ THE DENOMINATOR, because a walk that reads nothing reports the same empty object as a
     surface with no corners, and this section's subject IS a directory. */
  t("C1a the case-study walk read real files, against a literal", csFiles.length >= 20, true);
  t("C2 …and every survivor declares WHAT IT DRAWS in one of the three kinds a reader can disagree with",
    Object.entries(EXPECTED).flatMap(([k, v]) =>
      v.filter((r) => !/^(CIRCLE|DEPICTED|CONTROL) — .{12,}/.test(r)).map(() => k)), []);
  /* ⚠ THE COMPLEMENT, AND IT IS THE HALF A MEMBERSHIP LIST ALWAYS NEEDS. A named list only ever
     loosens — add a file and its corners become "expected" — so the files this unit squared are
     asserted as ones it must NOT cover. Same shape as the italic census's E3. */
  t("C3 ⚠ NO BOX GETS ITS CORNER BACK — the files this unit squared must not reappear",
    ["StatCard.tsx", "PrincipleCard.tsx", "blocks/GlanceGrid.tsx", "blocks/FeatureRows.tsx",
     "blocks/DeviceShelf.tsx", "blocks/SwatchTokens.tsx", "blocks/HeroCover.tsx"]
      .filter((f) => f in found), []);
  /* ⚠ AND THE KINDS ARE PINNED, so a category that drains cannot sit in the vocabulary unnoticed —
     the defect `typography` E4 was added for one unit ago, on a different list in the same week. */
  t("C4 the surviving kinds are exactly CIRCLE, CONTROL and DEPICTED — a fourth needs a decision, not a word",
    [...new Set(Object.values(EXPECTED).flat().map((r) => r.split(" ")[0]))].sort(),
    ["CIRCLE", "CONTROL", "DEPICTED"]);
}

/* ================================================ D. THE NAV RADIUS CENSUS
 * ⚠ THIS ONE IS CSS RATHER THAN UTILITIES, WHICH IS THE OTHER HALF SECTION C NAMES AND CANNOT SEE.
 * C walks `.tsx` for `rounded-*`; the nav declares every corner in `globals.css`, so a census of one
 * says nothing about the other. Both routes are now covered and each says which it is.
 *
 * THE DECISION: the owner was shown three states of the nav at full size over live page content —
 * the capsule as built, a squared capsule, and a title block with no material at all — and chose the
 * SQUARED CAPSULE. So this section pins a corner that was deliberately changed and a material that
 * was deliberately kept, which is a pairing a value check alone cannot express.
 *
 * THE RULE IS THE SITE'S OWN, from #634: a BOX around content loses its corner, a CIRCLE keeps it
 * because it is one. Seven boxes and eight circles, and both halves are asserted — squaring the
 * circles would be as wrong as rounding the boxes, and only naming both directions says so. */
{
  const header = css.slice(css.indexOf(".nav-glass {"), css.indexOf(".header-mob-resume-pill") + 900);
  /* ⚠ COMMENTS BLANKED, because the note above this rule DESCRIBES the retired 999px capsule and a
     raw read would count the prose as a declaration — the presence-versus-resolution defect this
     repository records against a bundle grep, arriving in a stylesheet. */
  const code = header.replace(/\/\*[\s\S]*?\*\//g, " ");
  const radii = [...code.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim());
  /* ⚠ AND THE DENOMINATOR, because a slice that missed its end anchor reports an empty list and an
     empty list satisfies every assertion below it. This repository already carries an extractor
     whose end ran to the end of the file and whose guard was satisfied by the whole stylesheet. */
  t("D0 the header slice is real and bounded — an empty slice would satisfy every row below it",
    radii.length === 15 && header.length < 30000, true);

  const squared = radii.filter((r) => r === "0").length;
  const circles = radii.filter((r) => r === "50%").length;
  const inherits = radii.filter((r) => r === "inherit").length;
  const caps = radii.filter((r) => r === "2px").length;
  const capsules = radii.filter((r) => /^999px$|^18px$|^11px$/.test(r));

  t("D1 ⚠ THE NAV'S BOXES ARE SQUARE — the capsule, the link hit area, the hover highlight, the Resume control, the mobile sheet, a sheet row and the mobile Resume",
    squared, 7);
  /* ⚠ THE COMPLEMENT, AND IT IS THE HALF THAT PROTECTS THE OTHER DIRECTION. A future sweep reading
     "the nav is square now" would take the morph button and the separator dot with it. They are
     round because they ARE round, which is the same ruling the phone bezel gets in section C.
     ⚠ AND THIS ROW WANTED 5 ON ITS FIRST RUN BECAUSE I COUNTED ELEMENTS WHERE IT COUNTS
     DECLARATIONS. The morph's three bars share ONE rule, so they are one `border-radius`, not
     three — the wrong-unit defect this repository records a dozen times, caught by the row going
     red rather than by the prose being re-read. */
  t("D2 …and its circles are still circles — the 3px separator dot, the morph button, its halo, and the one rule its three bars share",
    circles, 4);
  /* The morph's OPEN state swaps its bars for an X, whose 1.8px strokes take a 2px cap. A line end,
     not a box corner, and it lives on a button that is itself a circle. */
  t("D2a …and the two line caps on the morph's open X are untouched",
    caps, 2);
  t("D3 the two sheens still follow the box by `inherit`, so a specular can never keep a corner the box has lost",
    inherits, 2);
  /* ⚠ THE ROW THAT WOULD CATCH A REVERT, stated as an ABSENCE because that direction is sound by
     regex: if the string is not in the file, nothing can render it. */
  t("D4 ⚠ NO CAPSULE SURVIVES IN THE NAV — a 999px, 18px or 11px corner here means the decision was undone",
    capsules, []);
  /* ⚠ AND THE MATERIAL IS ASSERTED KEPT, WHICH IS THE OTHER HALF OF THE CHOICE. The option the owner
     picked was "square it, keep the glass"; a later unit that squared the corner AND stripped the
     blur would satisfy D1 to D4 completely while shipping the option they did not choose.
     ⚠ SCOPED TO THE BASE RULE, AND THE FIRST DRAFT WAS NOT — IT COULD NOT FAIL FOR THE REASON IT
     NAMES. It searched the whole header slice, and `.nav-glass.is-ghost` inside the desktop media
     query RE-DECLARES the fill and the blur to restore the material there. So stripping both from
     the base rule left the row green: it was reading the restore block and reporting the base one.
     Caught by mutation and by nothing else, in a row written the same hour, which is what the
     unfalsifiable-row register in this repository exists to say happens to everyone. */
  const base = code.slice(0, code.indexOf("\n}"));
  /* ⚠ AND THIS GUARD DOES NOT TEST D5's OWN SUBJECT, WHICH ITS FIRST DRAFT DID. It also asserted the
     slice contains the fill token — so it failed for the SAME reason as D5, which is a denominator
     derived from the thing it guards and therefore no guard at all. It now asserts only what a slice
     can be wrong about: that it is non-empty, that it stopped at the first close, and that the ghost
     block whose re-declaration caused the original defect is OUTSIDE it. */
  t("D5a the base-rule slice is bounded and stops before the ghost block — a runaway slice is what made D5 unfalsifiable",
    base.length > 200 && base.length < 2400 && !base.includes("is-ghost"), true);
  t("D5 …and the glass is untouched — the fill, the blur, the stroke and the shadow are all still declared on the capsule ITSELF",
    [/background:\s*var\(--glass-fill\)/, /backdrop-filter:\s*var\(--glass-blur\)/,
     /border:\s*0?\.5px solid var\(--glass-stroke\)/, /box-shadow:\s*var\(--glass-shadow\)/]
      .map((re) => re.test(base)), [true, true, true, true]);
}

console.log(`\nradius-scale result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
