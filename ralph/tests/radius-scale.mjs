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

console.log(`\nradius-scale result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
