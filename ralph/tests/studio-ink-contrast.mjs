// THE ON-INK CONTRAST GATE — every on-ink foreground ratio, computed from source, in CI.
// Run: node ralph/tests/studio-ink-contrast.mjs
//
// ---- WHAT THIS CLOSES (hazard 27) -----------------------------------------------------
//
// `studio-type` measures the RENDERED type table against the ink-chrome contract, and #212 gave
// it an `ON_INK` table of the on-ink foreground ratios this arc measured. But `studio-type` is a
// browser-console script — it needs a running dev server and is NOT RUNNABLE in CI (the runner
// names it skipped, beside `parity`). So every on-ink contrast number lived only in a table a
// human runs by hand; **CI checked none of them.** That is hazard 27: the topbar search grew
// four derived on-ink foregrounds and nothing in CI verified any of them, and the deeper #212
// finding was that the hole was larger than the search — no contrast was asserted CI-side at all.
//
// ---- HOW IT CLOSES IT: REMOVE THE DEPENDENCY, DO NOT ROUTE AROUND IT -------------------
//
// CLAUDE.md's proof rule is to prefer a fix that REMOVES the dependency being tested, the way
// #177 set a colour explicitly rather than relying on inheritance, so a dev-only proof holds in
// production by construction. The dependency here is a running browser doing the colour math.
// This suite removes it: it reproduces the browser's compositing in node — oklch -> sRGB, sRGB
// alpha-over, WCAG contrast — computes each on-ink ratio from the SAME source the screen renders
// from (the `@theme` tokens in globals.css and the `lg:` utilities in the four studio chrome
// components), and asserts each against `studio-type`'s floors. Nothing to paste, nothing to run
// by hand, no server.
//
// ---- WHY A NODE REIMPLEMENTATION IS TRUSTWORTHY HERE -----------------------------------
//
// A harness that redoes the browser's colour math is exactly the failure `studio-type`'s header
// warns about (an early pass read every ratio as ~1.0 because it parsed `oklch(...)` as RGB). So
// this suite earns trust the same two ways that one does:
//   1. THE SANITY PAIR RUNS FIRST — white on black must read 21:1, and the converter must land a
//      known token on its known bytes. A converter that cannot prove itself on a known input is
//      not trusted on an unknown one.
//   2. IT CROSS-CHECKS THE BROWSER ORACLE — every computed ratio is asserted within a tolerance
//      of the value `studio-type` MEASURED in a real browser. The static computation reproduces
//      the four search ratios (1.50, 2.15, 7.10, 12.70) to within 0.12, so it is not a parallel
//      spec that can agree with itself while disagreeing with the screen; it tracks the screen.
//
// ---- THE ONE EXCLUSION, STATED (not silent) -------------------------------------------
//
// The two `topbar View site (HOVER)` rows need a real pointer — `:hover` is not settable from
// script, let alone from node — so their ratios cannot be computed here any more than they could
// be measured in `studio-type`. They stay by-hand (#215 drove them with a real pointer) and are
// asserted below to be EXACTLY the two `needsPointer` rows, so a new hover surface cannot slip in
// unnoticed and this exclusion cannot quietly grow the way the C-9 one did. Everything the arc
// measured that a machine CAN compute is computed.
import { readFileSync } from "node:fs";
import { ON_INK } from "./studio-type.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

/* ================================================ A. THE COLOUR MATH
 * oklch(L C H) -> sRGB 0..255 (L a fraction, H degrees), the standard Björn Ottosson transform.
 * Then CSS alpha-over IN GAMMA SPACE (browsers composite `rgb(...)/a` on the encoded bytes, not
 * in linear light), and WCAG relative-luminance contrast. */
function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  const enc = (v) => { v = Math.max(0, Math.min(1, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; };
  return lin.map((v) => Math.round(enc(v) * 255));
}
const over = (fg, alpha, bg) => fg.map((f, i) => Math.round(alpha * f + (1 - alpha) * bg[i])); // sRGB-space alpha over
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratioRaw = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const ratio = (a, b) => Math.round(ratioRaw(a, b) * 100) / 100;

/* ================================================ B. THE TOKENS, PARSED FROM @theme
 * Same source the screen renders from — a token whose oklch is retuned is picked up here on the
 * next run, so a contrast that moves because a token moved fails on arrival. */
const css = read("app/globals.css");
const TOKEN = {};
for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/g)) {
  TOKEN[m[1]] = oklchToRgb(Number(m[2]) / 100, Number(m[3]), Number(m[4]));
}
const tok = (name) => {
  if (!TOKEN[name]) throw new Error(`token --color-${name} not found in globals.css`);
  return TOKEN[name];
};
const WHITE = [255, 255, 255];

/* ---- THE SANITY PAIR, FIRST. Abort trust if a known input reads wrong. */
t("S1: white on black is 21:1 — the contrast math is sound", Math.round(ratio(WHITE, [0, 0, 0])), 21);
t("S2: the oklch converter lands ink-950 on its known bytes (15,7,3), so it is not misreading the colour space",
  tok("ink-950"), [15, 7, 3]);
t("S3: …and cream-50 on its known bytes (254,249,241)", tok("cream-50"), [254, 249, 241]);

/* ================================================ C. THE SOURCE UTILITIES, PARSED FROM THE CHROME
 * The gate is tied to the ACTUAL classes, not the intended ones: change `lg:bg-white/16` to
 * `/10` and the well recomputes 1.32 and fails its floor; swap the placeholder `lg:text-ink-200`
 * for `ink-400` and it recomputes ~3.3 and fails. Each grab throws with a named message if the
 * class it anchors on is gone, so a rename surfaces as a clear failure rather than a silent skip. */
const search = read("components/studio/StudioSearch.tsx");
const topbar = read("components/studio/StudioTopbar.tsx");
const sidebar = read("components/studio/StudioSidebar.tsx");
const saveInd = read("components/studio/SaveIndicator.tsx");

const grab = (src, re, label) => { const m = src.match(re); if (!m) throw new Error(`could not find ${label}`); return m[1]; };

// The bar and the sidebar are SOLID ink (the #214 fix). Assert the token, then use it as ground.
const barToken = grab(topbar, /lg:bg-(ink-\d+)\b/, "topbar bar background");
const sidebarBgToken = grab(sidebar, /lg:bg-(ink-\d+)\b/, "sidebar background");
const BAR = tok(barToken);

// The search well: white at its parsed alpha over the bar. The border: white at its parsed alpha
// seen against the well. The foregrounds: opaque tokens over the well.
const wellAlpha = Number(grab(search, /lg:bg-white\/(\d+)\b/, "search well alpha")) / 100;
const searchBorderAlpha = Number(grab(search, /lg:border-white\/(\d+)\b/, "search border alpha")) / 100;
const WELL = over(WHITE, wellAlpha, BAR);
const searchBorderColour = over(WHITE, searchBorderAlpha, WELL);

const magnifierTok = grab(search, /IconSearch[^>]*lg:text-(ink-\d+)/s, "search magnifier colour");
const placeholderTok = grab(search, /lg:placeholder:text-(ink-\d+)/, "search placeholder colour");
const valueTok = grab(search, /className="min-w-0 flex-1[^"]*lg:text-(cream-\d+)/, "search typed-value colour");
const kbdTok = grab(search, /<kbd[\s\S]*?lg:text-(ink-\d+)/, "search kbd colour");

// Save status on the ink band: its onInk branch, on solid ink-950 (the band ground).
const saveOnInkTok = grab(saveInd, /onInk\s*\?\s*"text-(ink-\d+)"/, "save-status on-ink colour");

// View site button border: white at its parsed alpha over the bar.
const viewSiteBorderAlpha = Number(grab(topbar, /group inline-flex[^"]*lg:border-white\/(\d+)/, "View site border alpha")) / 100;
const viewSiteBorderColour = over(WHITE, viewSiteBorderAlpha, BAR);

// The L: the sidebar and topbar edges are both white at a parsed alpha. Identity is the assertion.
const sidebarBorderAlpha = Number(grab(sidebar, /lg:border-white\/(\d+)/, "sidebar edge alpha")) / 100;

/* ================================================ D. THE COMPUTED RATIO PER ON_INK ROLE
 * Keyed by `${surface}|${role}` so it maps 1:1 onto studio-type's ON_INK table — the single
 * source of the floor (`min`) and the browser oracle (`measured`). */
const COMPUTED = {
  "topbar search well|ground vs the composited bar": ratio(WELL, BAR),
  "topbar search border|border vs the well": ratio(searchBorderColour, WELL),
  "topbar search|placeholder": ratio(tok(placeholderTok), WELL),
  "topbar search|magnifier": ratio(tok(magnifierTok), WELL),
  "topbar search|kbd": ratio(tok(kbdTok), WELL),
  "topbar search|typed value": ratio(tok(valueTok), WELL),
  "ink band|save status": ratio(tok(saveOnInkTok), BAR),
  "topbar View site|border vs the bar": ratio(viewSiteBorderColour, BAR),
  // The L — identity, computed as the ratio of one declared ground/edge to the other. Both are
  // ink-950 (ground) and white at the same alpha (edge), so the ratio is 1.00 BY CONSTRUCTION,
  // and any value above 1.00 is the #214 defect (the two halves disagreeing) returning.
  "the L|sidebar ground vs topbar ground": ratio(tok(sidebarBgToken), BAR),
  "the L|sidebar edge vs topbar edge": ratio(over(WHITE, sidebarBorderAlpha, BAR), over(WHITE, searchBorderAlpha, BAR)),
};

/* ================================================ E. THE ASSERTIONS, DRIVEN BY ON_INK
 * For every computable row: it clears its floor AND it reproduces the browser oracle within
 * tolerance. Two failures with different meanings — below-floor is a real regression on screen;
 * off-oracle means the static math drifted from the browser and the gate can no longer be
 * trusted, which is worse and must also fail. */
const ORACLE_TOL = 0.4; // the four search ratios reproduce within 0.12; 0.4 leaves headroom without hiding a real drift
const computable = ON_INK.filter((r) => !r.needsPointer);
const hover = ON_INK.filter((r) => r.needsPointer);

t("D0: every non-pointer ON_INK role has a computed ratio here — none silently uncovered",
  computable.map((r) => `${r.surface}|${r.role}`).filter((k) => !(k in COMPUTED)), []);

for (const r of computable) {
  const key = `${r.surface}|${r.role}`;
  const got = COMPUTED[key];
  if (got == null) continue; // D0 already failed for this row
  t(`floor · ${key} computes ${got} ≥ ${r.min}`, got >= r.min, true);
  t(`oracle · ${key} computes ${got}, within ${ORACLE_TOL} of the browser-measured ${r.measured}`,
    Math.abs(got - r.measured) <= ORACLE_TOL, true);
  if (r.aa != null) {
    t(`aa · ${key} at ${got} also clears its own AA floor ${r.aa}`, got >= r.aa, true);
  }
}

/* F. THE HOVER EXCLUSION IS EXACTLY THE TWO POINTER ROWS — it cannot quietly grow. */
t("F1: exactly two ON_INK rows are excluded, and both are the pointer-only View-site hovers",
  hover.map((r) => `${r.surface}|${r.role}`),
  ["topbar View site (HOVER)|fill vs the bar", "topbar View site (HOVER)|label vs the fill"]);

/* G. STRUCTURAL TRUTHS THE COMPOSITION RESTS ON — asserted so a change to them is not silent. */
t("G1: the topbar bar and the sidebar are the SAME solid ink token (the L is one ground, #214)",
  barToken === sidebarBgToken, true);
t("G2: that token is ink-950 — the darkest step, the worst case every on-ink foreground composites against",
  barToken, "ink-950");
t("G3: the search edge and the sidebar edge are the same white alpha (the L edge is one line)",
  searchBorderAlpha === sidebarBorderAlpha, true);

console.log(`\nstudio-ink-contrast result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
