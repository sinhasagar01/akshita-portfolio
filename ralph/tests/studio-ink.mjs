// The ink shell — the traps that must stay closed, and the breakpoint that scopes them.
// Run: node --experimental-strip-types ralph/tests/studio-ink.mjs
//
// PART A EXISTS BECAUSE A COLOUR UTILITY ON AN ANCHOR DOES NOTHING IN THIS PROJECT, and that
// is invisible in review. globals.css carries an UNLAYERED `a { color: inherit }`, and an
// unlayered rule outranks `@layer utilities` regardless of specificity, so `.text-ink-*` on an
// <a> silently loses — measured, the same `text-ink-600` computes ink-600 on a <span> and
// ink-950 on an <a>. The sidebar's `text-ink-600` had been dead since it was written; on cream
// the inherited ink-950 is 18.13:1 and looks entirely correct, which is why nobody caught it.
// On ink it is 1.00:1. Hazard 11's mechanism on a third element.
//
// So the rule this suite protects is: THE SIDEBAR LINK'S COLOUR LIVES ON THE SPAN. Move it back
// onto the anchor and the label goes invisible at `lg` with no error anywhere.
//
// PART B IS THE BREAKPOINT. Ink is `lg:`-only, and that is a design decision with a
// measurement behind it, not a shortcut — below `lg` the aside is a full-width band whose nav
// scrolls horizontally, so the ink pill is the primary wayfinding cue at 19.04:1 and the wash
// that replaces it at `lg` would be 1.25:1. An unprefixed ink utility here would silently
// repaint the phone layout this PR deliberately left alone.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Comment-stripped — every file here explains the idioms it bans. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const sidebar = code("components/studio/StudioSidebar.tsx");
const topbar = code("components/studio/StudioTopbar.tsx");
const search = code("components/studio/StudioSearch.tsx");
const globals = read("app/globals.css");

/* ================================================ A. THE ANCHOR CANNOT CARRY A COLOUR */
// The precondition. If this rule is ever layered or deleted, Part A stops being necessary —
// and the assertions below would then be pinning a workaround with no cause.
t("A0: globals.css still has the unlayered `a { color: inherit }` these rules exist for",
  /\na\s*\{[^}]*color:\s*inherit/.test(globals), true);

{
  // The <Link> className is the array-joined string; the colour must NOT be in it.
  const linkCls = sidebar.slice(sidebar.indexOf("className={["), sidebar.indexOf("].join("));
  t("A1: the sidebar link carries NO text colour utility",
    /text-(ink|cream)-\d/.test(linkCls), false);
  t("A1: …and no hover text colour either",
    /hover:text-/.test(linkCls), false);
  // These two are the exact strings that were dead, named so a revert is loud.
  t("A2: the dead `text-ink-600` is gone from the link", /\btext-ink-600\b/.test(linkCls), false);
  t("A2: the dead `hover:text-ink-950` is gone from the link",
    /hover:text-ink-950/.test(linkCls), false);
}
// The colour moved to the span, and BOTH branches must set it — the inactive branch used to
// pass `undefined`, which is precisely the half that broke.
t("A3: the label span colours the ACTIVE branch",
  /active\s*\?\s*"text-cream-50"/.test(sidebar), true);
t("A3: …and the INACTIVE branch, which used to be `undefined`",
  /:\s*"text-ink-600 group-hover:text-ink-950 lg:text-ink-200 lg:group-hover:text-cream-50"/.test(sidebar), true);
t("A3: …so `undefined` no longer appears as a label colour",
  /<span className=\{active \? "text-cream-50" : undefined\}>/.test(sidebar), false);
// Hover has to ride the group, since the anchor cannot carry the colour itself.
t("A4: the link is a `group` so the span can react to its hover",
  /"group flex items-center/.test(sidebar), true);

// The topbar solves the same problem the other way: the colour sits on the CONTAINER and the
// anchor inherits it, which needs no extra element the attribute-invariant gate would reject.
t("A5: the topbar container carries the colour",
  /text-ink-600[^"]*lg:text-ink-200/.test(topbar), true);
t("A5: …and the View live anchor carries no dead hover colour",
  /hover:text-accent-500/.test(topbar), false);

/* ================================================ B. INK IS `lg:`-ONLY */
const shell = sidebar + topbar + search;
// `text-cream-50` is deliberately absent from this list: it legitimately appears UNPREFIXED on
// the accent chip and on the active label, where it is correct at both breakpoints.
const inkOnly = ["bg-white/10", "bg-white/5", "border-white/12", "text-ink-200"];
for (const u of inkOnly) {
  // THE ASSERTION IS "NO BARE OCCURRENCE", not a count comparison. An earlier version of this
  // compared bare-count to prefixed-count, but the lookbehind already excludes the prefixed
  // ones, so it was comparing 0 against N and failing on correct code. A gate that fails on
  // correct code gets deleted, which is worse than not having it.
  const bare = [...shell.matchAll(new RegExp(`(?<![\\w:/-])${u.replace("/", "\\/")}(?![\\w/-])`, "g"))];
  t(`B1: no unprefixed \`${u}\` in the shell — ink is lg-only`, bare.length, 0);
}
// `bg-ink-950` is the one that MUST still appear bare, because that is the mobile pill.
t("B1: `bg-ink-950` DOES appear unprefixed — it is the pill below `lg`",
  /(?<![\w:/-])bg-ink-950(?![\w/-])/.test(sidebar), true);
// The pill must survive below lg, or the phone loses its only selection marker.
t("B2: the ink pill still ships below `lg`", /"bg-ink-950 lg:bg-white\/10 font-medium"/.test(sidebar), true);
t("B2: the cream sidebar background still ships below `lg`",
  /bg-cream-100[^"]*lg:bg-ink-950/.test(sidebar), true);

/* ================================================ C. NO NEW TOKENS */
// The contract invented --on-ink / --on-ink-hi / --on-ink-dim. The existing scale covers all
// three within 0.04 of a contrast ratio, so PR 1 adds none — which is also what keeps @theme
// untouched and the public gates vacuous.
for (const invented of ["--on-ink", "--color-on-ink"]) {
  t(`C1: \`${invented}\` was never added to the theme`, globals.includes(invented), false);
}
t("C1: ink-200 is a pre-existing token, not one this PR introduced",
  /--color-ink-200:\s*oklch\(80\.0% 0\.010 60\)/.test(globals), true);

/* ================================================ D. THE 236px COUPLING IS UNMOVED */
// Layout is unchanged, so all five sites must still read 236 — and one of them is behavioural.
t("D1: the sidebar is still 236px", /lg:w-\[236px\]/.test(sidebar), true);
t("D1: PublishBar's hand-coupled offset still matches",
  /lg:left-\[236px\]/.test(code("components/studio/PublishBar.tsx")), true);
// THE BEHAVIOURAL ONE. This decides whether the blog inspector folds, so a sidebar width
// change moves a behaviour rather than an offset — which is why "236 moves twice" understates
// it at five sites. The constant is a LITERAL; the arithmetic that derives it lives in the
// comment above it, so both are pinned.
{
  const tp = read("lib/studio/three-pane.ts");
  t("D1: FIT_THRESHOLD_PX is still 1614", /export const FIT_THRESHOLD_PX = 1614;/.test(tp), true);
  t("D1: …and its derivation still starts from a 236px sidebar",
    /sidebar 236 \+ list 264 \+ canvas 794 \+ inspector 320 = 1614/.test(tp), true);
}

/* ============================================ E. THE PANEL LANGUAGE (PR 2a) */
import { readdirSync } from "node:fs";
const studioFiles = readdirSync(new URL("../../components/studio", import.meta.url), { recursive: true })
  .map(String).filter((f) => f.endsWith(".tsx"));
const readStudio = (f) => read(`components/studio/${f}`);

// E1 · THE WELL. The box used to be cream-50 ON a cream-50 panel — the same colour as its
// ground, which is why it read as floating rather than recessed.
{
  const fields = readStudio("blocks/fields.tsx");
  for (const n of ["inputCls", "inputClsMd", "inputErrorCls"]) {
    const lit = fields.match(new RegExp(`const ${n} =\\s*\\n?\\s*"([^"]*)"`))?.[1] ?? "";
    t(`E1: ${n} is a well — darker than its panel, not the same colour as it`,
      lit.includes("bg-cream-100"), true);
    t(`E1: ${n} is 44px via min-h-11, so the 13/14px pair keeps ONE token of difference`,
      lit.includes("min-h-11"), true);
  }
}

// E2 · THE COUNT THAT WAS WRONG IN KIND. The plan said "five geometry strings"; five is the
// number of NAMED CONSTANTS. There are 21 form controls carrying the geometry inline and
// referencing no export, which is why PR 2a could not make the inputs coherent.
{
  const sig = /rounded-md border[^"`]*?px-3 py-2/g;
  let formControls = 0;
  for (const f of studioFiles) {
    const src = readStudio(f);
    for (const m of src.matchAll(sig)) {
      const before = src.slice(0, m.index);
      const tags = before.match(/<([A-Za-z][A-Za-z0-9]*)/g) ?? [];
      const tag = tags.length ? tags[tags.length - 1].slice(1) : "";
      if (tag === "input" || tag === "textarea") formControls++;
    }
  }
  // The number is pinned so a 22nd is LOUD. If this fails high, someone hand-copied the box
  // again and #199's dedupe is decaying a second time; if it fails low, PR 2b landed and this
  // assertion should be retired rather than edited down.
  t("E2: still 21 inline form-control geometries — a 22nd means the dedupe is decaying again, and fewer means PR 2b landed and this should be retired",
    formControls, 21);
}

// E3 · THE HAIRLINE SCOPE. The failure has to say WHY, because the tempting fix is to make the
// numbers match.
{
  const count = (dir) => {
    const out = [];
    const walk = (d) => { for (const e of readdirSync(new URL(`../../${d}`, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${d}/${e.name}`); else if (e.name.endsWith(".tsx")) out.push(`${d}/${e.name}`); } };
    walk(dir);
    return out.reduce((n, f) => n + (read(f).match(/border-ink-950\/8\b/g) ?? []).length, 0);
  };
  // THE COUNTS ARE EXACT, AND `> 0` WAS NOT ENOUGH. The first version of these two asserted
  // "still some /8 left", which a mutation that unified ONE case-study file walked straight
  // through — the other files kept the count above zero. An assertion has to be able to fail
  // for the reason it exists, and the reason here is a single file drifting to /12.
  // FOUR, not the six a first grep suggested: that count included a comment in styles.ts and a
  // `border-ink-950/80`, a different value that a careless s|/8|/12| would have corrupted into
  // `/120`. The `\b` in the pattern is what keeps them apart, here and in the sweep itself.
  t("E3: components/case-study must STAY at exactly 4 uses of /8 — it is canvas code, rendered by the public article, and /12 there would move the published page",
    count("components/case-study"), 4);
  t("E3: components/blog must STAY at exactly 2 for the same reason — the canvas and the article share these components",
    count("components/blog"), 2);
  t("E3: components/studio carries NO /8 — the studio stepped to /12 and a leftover /8 is a hairline that did not move with its neighbours",
    count("components/studio"), 0);
}

// E4 · labelCls must not reach for the SHARED size token.
t("E4: labelCls sizes itself locally — `--text-eyebrow` is read by 11 case-study files plus two public pages, so editing the token to get an 11px studio label would move the canvas",
  /export const labelCls = "text-\[11px\] font-bold uppercase tracking-eyebrow text-ink-600";/
    .test(readStudio("blocks/fields.tsx")), true);

// E5 · THE BANDS, and the boundary that keeps hazard 22 shut.
{
  const panel = code("components/studio/BlogBlocksEditPanel.tsx");
  t("E5: both inspector section heads are ink bands",
    (panel.match(/<header className="flex items-center justify-between gap-2 bg-ink-950 px-3 py-2">/g) ?? []).length, 2);
  t("E5: the SaveIndicator on the band takes its ground — text-text-subtle is chosen against cream and drops to 1.72:1 on ink",
    /<SaveIndicator label="Body"[^>]*onInk\s*\/>/.test(panel), true);
  // The strip is NOT on ink, which is the only reason its ink focus ring is still correct.
  t("E5: the block strip keeps its ink focus ring — it sits BELOW the band on cream, and the ring is ink so it reads against the accent SELECTION fill",
    /focus-visible:ring-ink-950/.test(panel), true);
}

// E6 · THE DEAD ANCHORS. Colour cannot live on an <a> here; it lives on a parent or a child.
t("E6: the blog canvas strip colours its own row, so the View live anchor inherits — a text-* utility on an <a> is defeated by the unlayered `a { color: inherit }`",
  /px-4 py-2 text-ink-600"/.test(code("components/studio/ThreePaneShell.tsx")), true);
t("E6: the projects header row colours itself, so its Preview anchor inherits — that anchor and the Cancel button next to it once carried byte-identical classes and only the button's worked",
  /flex items-center gap-1 text-ink-600"/.test(code("components/studio/ProjectsEditPanel.tsx")), true);

console.log(`\nstudio-ink result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
