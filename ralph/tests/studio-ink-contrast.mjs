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
import { readFileSync, readdirSync, statSync } from "node:fs";
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

/* ================================================ H. THE CREAM HALF — TEXT ON THE CREAM LADDER
 *
 * ---- THE COVERAGE GAP THIS CLOSES, AND HOW IT WAS FOUND -------------------------------------
 *
 * Everything above computes ON-INK ratios. `studio-labels` pins the label scale's two exports —
 * that they exist and are named by role. **Nothing measured a text token against the CREAM ground
 * it lands on**, which is where almost all studio text actually sits.
 *
 * IT WAS FOUND BY THE GAP PRODUCING A FALSE POSITIVE, not a defect. A fidelity audit reported the
 * field label as ink-400 at 3.49 on cream-100 — a live AA failure on three pages. It was not.
 * The audit's `querySelector` took the FIRST DOM match for a label-ish class, which is the
 * SIDEBAR's "Content" heading, and measured it against a cream ground. That heading sits on
 * ink-950, where it reads 5.45 and is fine. A real colour attached to the wrong surface —
 * the fourth time this project has recorded that shape, and the first time while auditing for it.
 * The field labels have read `text-ink-600` since #228 and measure 7.06.
 *
 * SO THE POINT OF THIS BLOCK IS THAT NEITHER A REAL FAILURE NOR A FALSE REPORT OF ONE CAN BE
 * ASSERTED WITHOUT MEASURING. It is the `studio-cascade` shape applied to contrast on cream:
 * derive the pairs from source, compute every ratio, and fail with the TOKEN, the GROUND and the
 * RATIO — never a count, because a count tells you something moved and not what.
 *
 * ---- WHAT IT DOES NOT COVER, STATED SO IT IS NOT READ AS COVERING MORE --------------------
 *
 * It computes from TOKENS. A colour that reaches the screen some other way is outside it, and
 * this project has four distinct mechanisms for exactly that:
 *   - an unlayered rule outranking a utility (`a { color: inherit }`, hazard 22)
 *   - a token that does not exist, generating nothing (`text-ink-500`, hazard 23)
 *   - two utilities racing on sheet order (hazard 26)
 *   - a constant crossing the server/client boundary as a throwing proxy (#240)
 * **This gate addresses none of them.** It answers "is this token legible on that ground", not
 * "is that token the one that renders". The browser-driven checks remain the only proof of the
 * second question. */
{
  const CREAMS = ["cream-50", "cream-100", "cream-200", "cream-300"];
  const FLOOR = 4.5; // WCAG AA for text under 18px / under 14px bold — the studio's whole label scale

  // The studio's small-text vocabulary, read from the exports rather than retyped, so renaming a
  // token or retuning its oklch moves this table on the next run.
  const fields = read("components/studio/blocks/fields.tsx");
  const tokenOf = (decl, label) => {
    const m = new RegExp(`export const ${decl} = "([^"]*)"`).exec(fields);
    if (!m) throw new Error(`could not find ${label}`);
    const c = /text-(ink-\d+|text-subtle)/.exec(m[1]);
    if (!c) throw new Error(`no text colour in ${label}`);
    return c[1] === "text-subtle" ? "text-subtle" : c[1];
  };
  const LABEL_TOKENS = [
    ["labelCls", tokenOf("labelCls", "labelCls")],
    ["groupLabelCls", tokenOf("groupLabelCls", "groupLabelCls")],
  ];
  t("H1: the label scale's colour is read from its export, not retyped here",
    LABEL_TOKENS.map(([, tk]) => tk), ["ink-600", "ink-600"]);

  // EVERY LABEL TOKEN ON EVERY CREAM GROUND IT CAN LAND ON. The rails, panels and wells span the
  // whole ladder — cream-50 wells inside cream-100 panes inside cream-200 rails, with cream-300
  // as the selected fill — so a label is one refactor away from any of the four.
  for (const [decl, tk] of LABEL_TOKENS) {
    for (const g of CREAMS) {
      const r = ratio(tok(tk), tok(g));
      t(`H2: ${decl} (${tk}) on ${g} is ${r} — at or above the ${FLOOR} floor`, r >= FLOOR, true);
    }
  }

  /* H3 — THE PAIR THAT HAS NOW BEEN FOUND BY HAND TWICE, PINNED.
   * `text-subtle` measures 5.52 / 5.25 / 4.78 on cream-50/100/200 and **4.03 on cream-300**.
   * #232 met it in `BlogPostList` and `SectionsRail`; #242 met it again the moment the
   * list-detail rail became a cream-200 column and its selected fill became cream-300. Both times
   * a person measured. The third time it fails here. */
  const subtleByGround = Object.fromEntries(CREAMS.map((g) => [g, ratio(tok("text-subtle"), tok(g))]));
  t("H3: text-subtle's ladder is 5.52 / 5.25 / 4.78 / 4.03 — computed, not remembered",
    CREAMS.map((g) => subtleByGround[g]), [5.52, 5.25, 4.78, 4.03]);
  t("H3: …so cream-300 is the one ground it may NOT sit on, and the other three are fine",
    CREAMS.filter((g) => subtleByGround[g] < FLOOR), ["cream-300"]);
  // The remedy both PRs reached for, asserted as adequate rather than assumed.
  t("H3: …and ink-600 IS adequate there, which is why both fixes used it",
    ratio(tok("ink-600"), tok("cream-300")) >= FLOOR, true);

  /* H4 — `ink-400` IS NOT A TEXT COLOUR ON CREAM, ON ANY STEP. It fails all four, which is what
   * #228 found when it swept 45 sites off it. It stays legal for ICONS and BORDERS — non-text,
   * where the floor is 3:1 — so this asserts the fact rather than banning the token. */
  const ink400 = CREAMS.map((g) => ratio(tok("ink-400"), tok(g)));
  // 3.33 rather than 3.32 on cream-100, and the one-hundredth is worth a line: the plan for this
  // gate carried 3.32 from a hand calculation, and the computed value is what shipped. A gate
  // whose expected values are typed from an estimate is a gate that agrees with the estimate.
  t("H4: ink-400 fails the text floor on every cream step — 3.49 / 3.33 / 3.02 / 2.55",
    ink400, [3.49, 3.33, 3.02, 2.55]);
  t("H4: …and it clears the 3:1 NON-TEXT floor on the two lightest, which is what it is for",
    ink400.slice(0, 2).every((r) => r >= 3), true);

  /* H5 — THE SELECTED ROW, DERIVED FROM THE SHELL RATHER THAN DESCRIBED.
   * The one live consumer of the cream-300 ground is a selected list row. Read its meta-line
   * colour out of `ListDetailLayout` and measure it against the fill the same file declares, so
   * the assertion tracks the component instead of restating #242's conclusion. */
  const ld = read("components/studio/ListDetailLayout.tsx");
  const selFill = /isActive\s*$[\s\S]{0,120}?bg-(cream-\d+)/m.exec(ld)?.[1]
    ?? /bg-(cream-300)/.exec(ld)?.[1];
  // PARSED PERMISSIVELY ON PURPOSE. An earlier version matched only `text-(ink-\d+)` in the
  // selected branch, so putting `text-text-subtle` back there — the exact regression this is here
  // to catch — made the MATCH fail and the gate reported "no meta colour declared". True, and
  // useless: the failure named a parse rather than the 4.03 it was standing on. A gate must fail
  // with the token, the ground and the RATIO, so it reads whatever colour is actually there.
  const metaPair = /isActive \? "text-((?:ink-\d+|text-subtle))" : "text-((?:ink-\d+|text-subtle))"/.exec(ld);
  const metaSel = metaPair?.[1];
  t("H5: the shell still declares a selected fill and a selected meta colour", [!!selFill, !!metaSel], [true, true]);
  const metaRatio = metaSel && selFill ? ratio(tok(metaSel), tok(selFill)) : 0;
  t(`H5: the selected row's meta is ${metaSel} on ${selFill} at ${metaRatio} — the ${FLOOR} floor`,
    metaRatio >= FLOOR, true);

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * H6 — HAZARD 31: THE USAGE SCAN. H4 above has always had the FACT (ink-400 fails the text
   * floor on every cream step) and nothing has ever checked the USAGE, so three sites shipped it
   * and each was caught by a person measuring. A fourth, fifth and sixth were live when this was
   * written — the blog status-tab counts at 3.49, the search result sublabels at 3.49 and 3.04,
   * the blog editor's slug at 3.33, the sidebar counts at 3.33 below `lg`, the search key at 3.49
   * below `lg`, and the search PLACEHOLDER at 3.49 below `lg`.
   *
   * ⚠ WHY THIS ONE DOES NOT MISFIRE, WHICH IS WHY IT WAS NOT BUILT BEFORE. Most `text-ink-400`
   * sites are ICON or BORDER containers where the token is correct at the 3:1 non-text floor, and
   * a naive scan flags all of them. A gate that misfires gets ignored, which is worse than none.
   * So the icon set is DERIVED STRUCTURALLY rather than listed: an occurrence is an icon site when
   * its enclosing class expression carries an svg-targeting or icon-grid marker, or when the tag
   * it sits on is an icon component. Everything else is TEXT and must be registered below WITH ITS
   * GROUND — and the ratio is recomputed here from the tokens, so an entry cannot be parked in the
   * table to silence the gate.
   *
   * ⚠ AND THE SCOPE IS ANCHORED AT BOTH ENDS, NOT A WINDOW. The enclosing expression is taken from
   * the nearest preceding `className=` or `const X =` to its balanced close. A window would be the
   * fifth unanchored match in this arc; three of the previous four passed while reading the wrong
   * element entirely. */
  const STUDIO_DIRS = ["components/studio", "app/studio"];
  const tsxFiles = (dir, out = []) => {
    for (const e of readdirSync(dir)) {
      const p = `${dir}/${e}`;
      if (statSync(p).isDirectory()) tsxFiles(p, out);
      else if (p.endsWith(".tsx")) out.push(p);
    }
    return out;
  };
  const stripComments = (s) =>
    s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  /** The class expression enclosing an occurrence, plus the tag it is applied to. */
  const enclosing = (src, at) => {
    const before = src.slice(0, at);
    const ci = before.lastIndexOf("className=");
    const km = [...before.matchAll(/\bconst\s+\w+\s*=/g)].pop();
    const start = Math.max(ci, km ? km.index : -1);
    if (start < 0) return { expr: "", tag: "?" };
    let i = src.indexOf("=", start) + 1;
    while (src[i] === " ") i++;
    let expr = "";
    if (src[i] === "{") {
      let d = 0, j = i;
      for (; j < src.length; j++) {
        if (src[j] === "{") d++;
        else if (src[j] === "}") { d--; if (!d) { j++; break; } }
      }
      expr = src.slice(i, j);
    } else if (src[i] === '"' || src[i] === "'" || src[i] === "`") {
      const q = src[i]; let j = i + 1;
      while (j < src.length && src[j] !== q) j++;
      expr = src.slice(i, j + 1);
    } else {
      const j = src.indexOf(";", i);
      expr = src.slice(i, j < 0 ? src.length : j);
    }
    const tm = [...src.slice(0, start).matchAll(/<([A-Za-z][\w.]*)/g)].pop();
    return { expr, tag: tm ? tm[1] : "?" };
  };
  // An icon grid centres its child and sizes an svg. A dotted name (`area.Icon`) is a component
  // read off a record — missing that cost one false TEXT classification on the first run.
  const ICON_MARK = /\[&>svg\]|place-items-center/;
  const ICON_TAG = /(^|\.)((svg|path)$|Icon\w*$)/i;

  const iconSites = [];
  const textSites = [];
  for (const f of STUDIO_DIRS.flatMap((d) => tsxFiles(d))) {
    const src = stripComments(read(f));
    for (const m of src.matchAll(/text-ink-400/g)) {
      const { expr, tag } = enclosing(src, m.index);
      const where = `${f.split("/").pop()}:${src.slice(0, m.index).split("\n").length}`;
      const site = { where, file: f.split("/").pop(), expr: expr.replace(/\s+/g, " ") };
      (ICON_MARK.test(expr) || ICON_TAG.test(tag) ? iconSites : textSites).push(site);
    }
  }

  /* ⚠ THE DERIVATION MUST BE PROVEN NON-VACUOUS BEFORE ANYTHING IS CONCLUDED FROM IT. An icon
   * classifier that matched NOTHING would empty `textSites` too and the gate would pass by finding
   * no work — the exact vacuous-pass shape that has bitten this arc repeatedly. */
  t("H6: the scan finds ink-400 sites at all, so nothing below passes by matching nothing",
    iconSites.length + textSites.length > 25, true);
  t("H6: …and most of them are icon containers, where ink-400 is CORRECT at the 3:1 floor",
    iconSites.length > 20, true);

  /* THE REGISTRY. Every ink-400 site that renders as TEXT, with the ground it renders on and the
   * floor its size earns. Each ratio is RECOMPUTED below — the numbers here are the claim, not the
   * evidence. A new text site that is not in this table fails, the way `studio-ink` E2 fails a
   * fourth inline form control. */
  /* ⚠ EVERY ENTRY CARRIES A `guard`, AND THAT IS THE HALF THAT NEARLY SHIPPED MISSING. The first
   * version recorded only the claimed ground, and mutation testing killed it: deleting the
   * sidebar count's `text-ink-600 lg:` scoping — putting back the exact 3.33-on-cream defect this
   * PR fixes — left the gate GREEN, because the site was still one registered text site in the
   * same file and the entry still claimed an ink ground. A registry that records a claim and never
   * checks it is a list of assertions about the past. The guard is the class-expression property
   * that MAKES the claimed ground true, matched against the real expression. */
  const INK400_TEXT_SITES = [
    // 26px display type clears the LARGE-text floor, which is the whole reason it may stay — so
    // the guard is the size that earns it.
    { at: "CaseStudyRow.tsx", ground: "cream-50", floor: 3, guard: /text-\[26px\]/,
      why: "the 26px list ordinal — large text" },
    // Ink-only, and PROVEN so: ink-400 must be `lg:`-scoped, or it paints on the cream sidebar
    // below the breakpoint at 3.33.
    { at: "StudioSidebar.tsx", ground: "ink-950", floor: FLOOR, guard: /lg:text-ink-400/,
      why: "the area count, ink-400 at `lg` only" },
    // Likewise ink-only, but by VISIBILITY rather than by colour — it does not render below `lg`.
    { at: "StudioSidebar.tsx", ground: "ink-950", floor: FLOOR, guard: /lg:block/,
      why: "the Content eyebrow, `lg:block`" },
  ];
  t("H6: every ink-400 TEXT site is registered — an unregistered one is a new AA failure",
    textSites.length, INK400_TEXT_SITES.length);
  t("H6: …and the registered files are exactly the ones the scan found",
    [...new Set(textSites.map((s) => s.file))].sort(),
    [...new Set(INK400_TEXT_SITES.map((s) => s.at))].sort());
  /* ⚠ AND EACH GUARD MUST MATCH THE REAL EXPRESSION. This is what makes the ground a fact about
   * the code rather than a note about it. */
  for (const e of INK400_TEXT_SITES) {
    const matched = textSites.some((s) => s.file === e.at && e.guard.test(s.expr));
    t(`H6: ${e.why} — its ${e.ground} ground is guaranteed by ${e.guard.source}, not just claimed`,
      matched, true);
  }
  /* ⚠ AND EACH ENTRY MUST EARN ITS PLACE. Recomputed from the tokens, so parking a failing site in
   * the table above does not silence anything. */
  for (const s of INK400_TEXT_SITES) {
    const r = ratio(tok("ink-400"), tok(s.ground));
    t(`H6: ${s.why} — ink-400 on ${s.ground} is ${r}, floor ${s.floor}`, r >= s.floor, true);
  }
  /* CROSS-CHECKED AGAINST THE BROWSER, not just against itself — the posture this suite's on-ink
   * half already takes. These are the values measured on screen with a canvas rasteriser walking
   * the real composited ground. */
  t("H6: the computed ink-400 ratios reproduce what the screen measured — 5.45 on ink, 3.49 on cream-50",
    [ratio(tok("ink-400"), tok("ink-950")), ratio(tok("ink-400"), tok("cream-50"))], [5.45, 3.49]);
  /* THE REMEDY THE SIX FIXES USED, asserted adequate rather than assumed — and on the WORST cream
   * step any of them lands on, not the friendliest. */
  t("H6: …and ink-600 is adequate on every cream step, which is why all six fixes used it",
    CREAMS.every((g) => ratio(tok("ink-600"), tok(g)) >= FLOOR), true);

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * H7 — HAZARD 30: ACCENT ON CREAM, the same gap seen from the other side. The cream half covered
   * `ink-*` and `text-subtle` only, so accent-on-cream was uncomputed while #248 had to measure it
   * by hand. The record prescribed exactly this fix — add the accent scale to the token list and
   * let it compute, a widening of an existing derivation rather than a new suite. */
  const accent500 = CREAMS.map((g) => ratio(tok("accent-500"), tok(g)));
  const accent600 = CREAMS.map((g) => ratio(tok("accent-600"), tok(g)));

  /* ⚠ THE TWO ACCENTS ARE NOT INTERCHANGEABLE AS TEXT, WHICH IS WHAT COMPUTING THIS FOUND. The
   * first version of H7 asserted that both clear the floor on every step — the reasonable
   * assumption, and wrong. accent-500 clears it on cream-50 ALONE and misses cream-100 by 0.02.
   * A two-hundredths miss is exactly the kind nobody catches by eye and everybody assumes away,
   * which is the case for computing it rather than describing it. */
  t("H7: accent-500's cream ladder is 4.7 / 4.48 / 4.07 / 3.43 — computed, not assumed",
    accent500, [4.7, 4.48, 4.07, 3.43]);
  t("H7: …so cream-50 is the ONLY step it may carry text on, and cream-100 misses by 0.02",
    CREAMS.filter((g, i) => accent500[i] >= FLOOR), ["cream-50"]);
  t("H7: accent-600's ladder is 7.22 / 6.87 / 6.25 / 5.27 — it is the accent that travels",
    accent600, [7.22, 6.87, 6.25, 5.27]);
  t("H7: …clearing the floor on every cream step, unlike accent-500",
    accent600.every((r) => r >= FLOOR), true);
  /* #248 measured accent-600 by hand at 7.22 / 6.87 / 6.25 on cream-50/100/200 and recorded the
   * gap as hazard 30. The computation reproduces the hand reading exactly, so this is tied to the
   * browser rather than only to itself. */
  t("H7: …and it reproduces #248's hand measurement, which is what hazard 30 recorded",
    accent600.slice(0, 3), [7.22, 6.87, 6.25]);

  /* THE ONE TEXT CONSUMER OF accent-500, with the ground it actually renders on. It is the
   * `tone !== "muted"` signal badge — the "Not yet created" state — which is why a DOM sweep of a
   * fully-populated studio finds nothing: the badge only exists when content is MISSING. Measured
   * on screen, its row's ground is cream-50, where accent-500 is 4.7 and legal. It would fail one
   * step darker, so the ground is the whole reason it passes and is pinned as such. */
  const overview = read("components/studio/OverviewRow.tsx");
  t("H7: the accent signal badge still exists, so the ground assertion below is not vacuous",
    /border-accent-500\/35 text-accent-500/.test(overview), true);
  t("H7: …and accent-500 is legal on the cream-50 it renders on — but only there",
    ratio(tok("accent-500"), tok("cream-50")) >= FLOOR, true);
}

console.log(`\nstudio-ink-contrast result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
