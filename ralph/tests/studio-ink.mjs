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

// E1 · THE WELL, AND THE ASSERTION THAT ENCODED THE BUG.
//
// This checked `bg-cream-100` — an ABSOLUTE VALUE — and that is precisely the error #205 made.
// The contract's rule is RELATIONAL: an input reads as a well because it is one step lighter
// than the surface holding it, not because it is any particular colour. #205 set the input to
// cream-100 against the cream-50 entry panels, which worked there and made the input identical
// to its ground on the cream-100 inspector. This assertion then held the mistake in place: it
// passed on the wrong value and would have FAILED the correct one.
//
// It now asserts the well's step in the LADDER (globals.css) plus the property that actually
// matters — that the well and every surface that hosts it are different steps. A gate for a
// relational rule has to be relational, or it pins one side of the relation and calls it done.
{
  const fields = readStudio("blocks/fields.tsx");
  const WELL = "bg-cream-50";       // the ladder's bottom step
  const FIELD_SURFACE = "bg-cream-100"; // what holds inputs
  for (const n of ["inputCls", "inputClsMd", "inputErrorCls"]) {
    const lit = fields.match(new RegExp(`const ${n} =\\s*\\n?\\s*"([^"]*)"`))?.[1] ?? "";
    t(`E1: ${n} sits on the ladder's WELL step — asserted as a step, not a colour, because the rule it serves is relational`,
      lit.includes(WELL), true);
    t(`E1: ${n} is NOT the field-surface step — an input the same colour as its panel is the exact defect this arc has now shipped twice`,
      lit.includes(FIELD_SURFACE), false);
    t(`E1: ${n} is 44px via min-h-11, so the 13/14px pair keeps ONE token of difference`,
      lit.includes("min-h-11"), true);
  }
  // The other half of the relation. Six entry panels host fields directly on their shell, so
  // the shell must be the FIELD SURFACE step — if one drifts back to cream-50 the wells on it
  // collide again, and the input strings above would still look perfectly correct.
  for (const f of ["HeroEditPanel", "AboutEditPanel", "ProcessEditPanel", "LinksEditPanel",
                   "ExperienceEditPanel", "ProjectsEditPanel"]) {
    t(`E1: ${f}'s shell is the FIELD-SURFACE step — the wells on it are only wells relative to this`,
      /border-accent-500\/30 bg-cream-100/.test(readStudio(`${f}.tsx`)), true);
  }
}

// E2 · THE DELIBERATE LOCALS, EACH WITH ITS FAMILY NAMED IN THE FAILURE. PR 2b made 15 sites
// consume the shared exports; exactly these remain inline, in THREE families, and every one is
// a DECISION rather than a missed site. A count that fails bare teaches nothing (#199's
// lesson), so each assertion says which family a site belongs to and why it is local — a
// future sweep that wants to "finish the job" reads the reason, not a number.
{
  // THE RADIUS IS A WILDCARD ON PURPOSE. This pinned `rounded-md` and broke when PR 3 swept
  // the studio onto a scoped scale — a legitimate change with nothing to do with the box
  // GEOMETRY this detector exists to find. Same lesson three-pane's width regex learned: an
  // assertion that pins more than its subject fails for the wrong reason.
  const sig = /rounded-\S+ border[^"`]*?px-3 py-2/g;
  const inline = [];
  for (const f of studioFiles) {
    const src = readStudio(f);
    for (const m of src.matchAll(sig)) {
      const before = src.slice(0, m.index);
      const tags = before.match(/<([A-Za-z][A-Za-z0-9]*)/g) ?? [];
      const tag = tags.length ? tags[tags.length - 1].slice(1) : "";
      if (tag === "input" || tag === "textarea") inline.push(f);
    }
  }
  // FAMILY 1 — COMPOSED BORDER: LinksEditPanel. Not in `inline` because its three controls
  // share ONE local base composed with the ok/err border constants per validation state,
  // which the shared string cannot express. PR 2a proved the cost of anything less: it edited
  // a one-consumer const and left a 44px well beside a 39px flat box in every link row.
  t("E2: LinksEditPanel composes ONE local base — COMPOSED-BORDER family; importing the export and appending borders would leave two competing declarations the generated sheet decides",
    /const inputBase =/.test(readStudio("LinksEditPanel.tsx")), true);
  t("E2: …and its three controls all reference that base, so the panel cannot split into two generations again",
    (readStudio("LinksEditPanel.tsx").match(/\$\{inputBase\}/g) ?? []).length, 3);
  // FAMILY 2 — FLEX CHILDREN: the shared exports hardcode a full-width utility that fights
  // flex-1 in a row; dropping it would touch every consumer to serve two sites, and a third
  // export whose only distinction is a layout context is a constant nobody would remember.
  t("E2: ChipListEditor stays inline — FLEX-CHILD family, not a missed site; it must keep flex-1 where the export forces full width",
    inline.filter((f) => f === "ChipListEditor.tsx").length, 1);
  t("E2: BlogIndex's search stays inline — FLEX-CHILD family, and 13px is the search family's size, not drift",
    inline.filter((f) => f === "BlogIndex.tsx").length, 1);
  // FAMILY 3 — READONLY DISPLAYS: the reason is SEMANTIC. The export carries focus styling,
  // which is dead on a tabIndex={-1} control, and these fields want cursor-not-allowed.
  // (The colour half of the original rationale was FALSE: their text-ink-500 is a phantom —
  // no --color-ink-500 token exists, so it generates nothing and they have always rendered
  // inherited ink-950. Hazard 23. The focus-ring half stands on its own.)
  t("E2: ExperienceEditPanel's Company stays inline — READONLY-DISPLAY family; the export's focus styling is dead on a control that cannot be focused",
    inline.filter((f) => f === "ExperienceEditPanel.tsx").length, 1);
  t("E2: ProjectsEditPanel's Title stays inline — READONLY-DISPLAY family, same reasoning",
    inline.filter((f) => f === "ProjectsEditPanel.tsx").length, 1);
  // And NOTHING ELSE. A fifth inline form control means a new hand-written copy — the decay
  // #199 removed, starting again — OR a new local with no stated family. Either way it needs
  // a reason here, not just a body there.
  t("E2: exactly these four files carry an inline form-control geometry — a fifth means a new copy with no stated family",
    [...inline].sort(), ["BlogIndex.tsx", "ChipListEditor.tsx", "ExperienceEditPanel.tsx", "ProjectsEditPanel.tsx"]);
  // All four locals carry the WELL — local means a different REASON, never an older design.
  for (const f of ["ChipListEditor.tsx", "BlogIndex.tsx", "ExperienceEditPanel.tsx", "ProjectsEditPanel.tsx"]) {
    const src = readStudio(f);
    const ok = [...src.matchAll(sig)].every((m) => {
      const before = src.slice(0, m.index);
      const tags = before.match(/<([A-Za-z][A-Za-z0-9]*)/g) ?? [];
      const tag = tags.length ? tags[tags.length - 1].slice(1) : "";
      if (tag !== "input" && tag !== "textarea") return true;
      const lit = src.slice(src.lastIndexOf('"', m.index) + 1, src.indexOf('"', m.index + m[0].length));
      return lit.includes("min-h-11");
    });
    t(`E2: ${f}'s local carries the well — staying local does not mean staying behind`, ok, true);
  }
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
// The size moved 11px -> 12px in the site-wide font bump; what E4 actually guards is that the
// label sizes itself with a LOCAL literal, never by editing the shared `--text-eyebrow` token
// (read by 11 case-study files + two public pages, so touching it would move the canvas). The
// literal is still local, so the invariant holds at 12px; only the pinned number changes.
t("E4: labelCls sizes itself with a LOCAL literal, not the shared `--text-eyebrow` token — editing that token to size the studio label would move the canvas",
  /export const labelCls = "text-\[12px\] font-bold uppercase tracking-eyebrow text-ink-600";/
    .test(readStudio("blocks/fields.tsx")), true);

// E5 · THE BANDS, and the boundary that keeps hazard 22 shut.
//
// ---- THE COUNT IS 2 AND THE PREDICTION THAT IT WOULD BE 4 WAS WRONG ----------------------
//
// PR 3 wrote "it becomes 4 when the case-study inspector lands, and that will be deliberate",
// and PR 7 landed that inspector. The count is still 2. The prediction assumed a new inspector
// pane would take the ink band because the by-role rule says INSPECTOR PANE -> ink band, but
// the case-study inspector has no section HEADS to band: its structure is a Selected-field card,
// a Content|Style tablist, and the per-section fields. The rule maps a treatment onto a role
// that exists; it does not conjure the role.
//
// Recorded rather than quietly dropped, because a number that was promised and did not arrive
// is the shape this arc keeps getting wrong — a claim written once and trusted later. Whether
// the case-study inspector SHOULD grow banded heads is a live by-role question and a visual
// change, so it is not settled by a layout PR.
//
// AND THE COUNT IS NOW DERIVED, not read off one file. Pinning it to BlogBlocksEditPanel is
// what let the prediction go unchecked for three PRs: a second inspector could grow a band, or
// lose one, without this number moving. The set below is every studio file carrying the band,
// so both the count AND its location have to stay true.
{
  const bandRe = /<header className="flex items-center justify-between gap-2 bg-ink-950 px-3 py-2">/g;
  const withBands = readdirSync(new URL("../../components/studio", import.meta.url))
    .map(String).filter((f) => f.endsWith(".tsx"))
    .map((f) => [f, (code(`components/studio/${f}`).match(bandRe) ?? []).length])
    .filter(([, n]) => n > 0);
  t("E5: the ink band lives in exactly one file — the blog inspector — and the case-study inspector deliberately has none",
    withBands, [["BlogBlocksEditPanel.tsx", 2]]);
  const panel = code("components/studio/BlogBlocksEditPanel.tsx");
  t("E5: the SaveIndicator on the band takes its ground — text-text-subtle is chosen against cream and drops to 1.72:1 on ink",
    /<SaveIndicator label="Body"[^>]*onInk\s*\/>/.test(panel), true);
  // The strip is NOT on ink, which is the only reason its ink focus ring is still correct.
  t("E5: the block strip keeps its ink focus ring — it sits BELOW the band on cream, and the ring is ink so it reads against the accent SELECTION fill",
    /focus-visible:ring-ink-950/.test(panel), true);
}

/* E6 · SECTION HEADERS ARE CHOSEN BY ROLE, and this is the assertion that keeps the two
 * treatments from converging.
 *
 *   INSPECTOR PANE -> ink band      narrow, beside ink chrome, anchors to the sidebar
 *   ENTRY PANEL    -> cream-200 bar a full-width form on a cream page
 *
 * The band's own reasoning is about a NARROW PANE next to ink chrome. On a ~967px full-width
 * form it would be a slab of ink mid-page, which is why generalising it was rejected. Same
 * by-role shape as ink-band-vs-cream-bar's siblings: listbox-vs-select, three-pane-vs-list-
 * detail, and the document-level save bar vs the per-entry panel footer.
 *
 * THE BAND COUNT IS 2 AND STAYS 2. E5 pins it, and E5 now also records that this comment used
 * to promise 4 once the case-study inspector landed. It landed; the count did not move. See E5.
 *
 * DERIVED, NOT LISTED: an entry panel is any studio component that calls `useListItem` and
 * renders a panel `<section>`. Each must open with the cream-200 bar, byte-identical.
 *
 * PR 7 PREDICTED THIS DERIVATION WOULD SELF-CORRECT AND IT DID NOT NEED TO. The prediction was
 * that ProjectsEditPanel would stop rendering a panel `<section>` once the crumb row replaced
 * its header, and so leave the set naturally. It stayed in, and correctly: its bespoke, loading
 * and error states still return a plain panel with the bar, because none of them has sections to
 * navigate and a three-pane shell would be two empty panes beside a notice. The derived set is 7,
 * unchanged. A derivation that describes reality did not need rescuing — which is the argument
 * for deriving, but is NOT the self-correction that was claimed, and the difference is recorded
 * because the claim would otherwise read as confirmed. */
{
  const entryPanels = readdirSync(new URL("../../components/studio", import.meta.url))
    .filter((f) => String(f).endsWith(".tsx"))
    .map((f) => String(f))
    .filter((f) => {
      const src = readStudio(f);
      return /useListItem\(/.test(src) && /<section/.test(src);
    });
  const BAR = 'className="flex items-center justify-between gap-3 border-b border-ink-950/12 bg-cream-200 px-4 py-3"';
  const missing = entryPanels.filter((f) => !readStudio(f).includes(BAR));
  t("E6: every entry panel opens with the cream-200 bar, byte-identical — the by-role counterpart to the inspector's ink band",
    missing, []);
  // Guards the derivation itself: if `useListItem` is renamed or the panels stop matching, the
  // set silently empties and the assertion above passes while proving nothing.
  t("E6: …and the derived entry-panel set is not empty (a vacuous pass is the failure mode here)",
    entryPanels.length >= 6, true);
  // The band belongs ONLY to the inspector. An entry panel that grows one has crossed the rule.
  const bandOutsideInspector = entryPanels.filter((f) => /bg-ink-950 px-3 py-2/.test(readStudio(f)));
  t("E6: no entry panel carries an ink band — that treatment is the inspector's alone",
    bandOutsideInspector, []);
}

// E6 · THE DEAD ANCHORS. Colour cannot live on an <a> here; it lives on a parent or a child.
// PINNED ON THE COLOUR, NOT ON THE PADDING BESIDE IT. This regex used to read
// `px-4 py-2 text-ink-600"`, so #213 changing the strip's padding to 11px/18px — a change
// about HEIGHT, with no bearing on colour inheritance — failed a COLOUR assertion. An
// assertion that pins its neighbours fails for reasons it does not care about, and the next
// person's cheapest move is to re-widen the regex until it passes, which is how a gate stops
// guarding anything. It now matches the strip's `text-ink-600` and the `border-b` that marks
// it as the strip, and nothing about its box.
t("E6: the blog canvas strip colours its own row, so the View live anchor inherits — a text-* utility on an <a> is defeated by the unlayered `a { color: inherit }`",
  /border-b border-ink-950\/12[^"]*text-ink-600"/.test(code("components/studio/ThreePaneShell.tsx")), true);
t("E6: the projects header row colours itself, so its Preview anchor inherits — that anchor and the Cancel button next to it once carried byte-identical classes and only the button's worked",
  /flex items-center gap-1 text-ink-600"/.test(code("components/studio/ProjectsEditPanel.tsx")), true);

/* ================================================ F. THE RADIUS SCALE (PR 3) */
// The scale is SCOPED, not a @theme token, and the reason is the design rather than tidiness:
// @theme is sm 4 / md 8 / lg 16 / xl 24, so halving lands on 12/8/4 and THERE IS NO 12. The
// studio would collapse onto sm + full — two radii — and rule 1 asks for three steps.
{
  const css = read("app/globals.css");
  const val = (role) => css.match(new RegExp(`--studio-radius-${role}:\\s*(\\d+)px`))?.[1];
  const SCALE = { panel: "12", card: "8", control: "4" };
  for (const [role, px] of Object.entries(SCALE)) {
    t(`F1: --studio-radius-${role} is ${px}px — an exact halving of what shipped before, nothing invented`,
      val(role), px);
  }
  // 12 is the whole justification. If it ever equals a @theme step, the block has no reason
  // to exist and someone should ask why it is still here.
  t("F1: the panel step is a value @theme cannot express — that is why this block exists rather than a token",
    ["4", "8", "16", "24"].includes(val("panel")), false);

  // THE SCOPE HOST. The OUTER studio layout, because it wraps the login page as well as the
  // dashboard — scoping to (dashboard) would leave login on fallbacks only.
  t("F2: the scale is hosted on the outer studio layout, so LOGIN inherits it too",
    /className="studio-chrome /.test(read("app/studio/layout.tsx")), true);
  t("F2: …and the block is scoped to that class, never :root",
    /\.studio-chrome\s*\{/.test(css), true);

  // F3 — THE FALLBACK IS A SECOND PLACE THE NUMBER LIVES, which is the 236px hazard's shape.
  // Every fallback must equal its scoped value or the duplicate has drifted.
  {
    const uses = [];
    for (const f of studioFiles) {
      for (const m of readStudio(f).matchAll(/--studio-radius-(panel|card|control),(\d+)px/g)) {
        uses.push({ file: f, role: m[1], px: m[2] });
      }
    }
    const wrong = uses.filter((u) => u.px !== SCALE[u.role]);
    t("F3: every fallback equals its scoped value — the fallback duplicates the number, so it can drift",
      wrong.map((u) => `${u.file}:${u.role}=${u.px}`), []);
    // A BARE USE IS `var(--studio-radius-X)` WITH NO COMMA. The first version of this
    // excluded both `,` and `)` after the name, so it matched NOTHING and could never fire —
    // a guard that cannot fail, caught by mutation-testing rather than by reading it.
    const bare = studioFiles.flatMap((f) =>
      [...readStudio(f).matchAll(/var\(--studio-radius-(?:panel|card|control)\)/g)].map(() => f));
    t("F3: …and every studio radius utility carries a fallback — bare var() computes to 0, giving SQUARE corners rather than the old value",
      bare, []);
  }

  // F4 — THE NESTED RADIUS. BoldToolbar's shell and buttons are a RELATIONSHIP: the button
  // radius was chosen to sit concentrically inside the shell (inner = outer - padding). It was
  // 10/7 against p-1, off by one from true concentric; at card 8 with the same p-1 the inner
  // is EXACTLY 4, the control step. An accidental approximation landed on the scale. No
  // per-site assertion can see a relationship, which is why this one exists.
  {
    const bt = readStudio("BoldToolbar.tsx");
    t("F4: BoldToolbar's shell is the card step", /gap-0\.5 rounded-\[var\(--studio-radius-card,8px\)\]/.test(bt), true);
    t("F4: …with p-1, so concentric inner = 8 - 4 = the control step, EXACTLY rather than approximately",
      /rounded-\[var\(--studio-radius-card,8px\)\][^"]*\bp-1\b/.test(bt), true);
    t("F4: …and its buttons ARE the control step", (bt.match(/rounded-\[var\(--studio-radius-control,4px\)\]/g) ?? []).length, 3);
  }

  // F5 — WHAT MUST NOT MOVE. Pills carry meaning; the 1px dot is deliberate on a 6px handle.
  {
    // BOTH swept directories, because the sweep covered both — one pill lives in app/studio.
    const appStudio = [];
    const walkApp = (d) => { for (const e of readdirSync(new URL(`../../${d}`, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) walkApp(`${d}/${e.name}`); else if (e.name.endsWith(".tsx")) appStudio.push(read(`${d}/${e.name}`)); } };
    walkApp("app/studio");
    const all = studioFiles.map(readStudio).join("") + appStudio.join("");
    // REVALUED 25 -> 27 IN PR 7, DELIBERATELY. The sections rail carries two status dots — the
    // needs-an-image marker and the details dirty marker — and a status dot is exactly the shape
    // this assertion protects: `BlogPostList`'s published/draft dot is already among the 25, and
    // these are its case-study twins. The count stays a COUNT rather than becoming a floor,
    // because a count is what makes an ACCIDENTAL pill fail; a `>=` would let the next one in
    // silently, which is the whole reason this assertion exists.
    t("F5: the 27 full pills survive — the shape carries meaning", (all.match(/rounded-full/g) ?? []).length, 27);
    t("F5: the 1px drag dot survives — the control step would visibly round a 6px handle",
      (all.match(/rounded-\[1px\]/g) ?? []).length, 1);
    // COMMENT-STRIPPED, and it has to be: this first ran against raw source and tripped on the
    // ENGLISH WORD "rounded" in a layout comment ("the outer rounded card is gone"). An
    // assertion about class strings that reads prose is asserting about prose.
    const codeOnly = studioFiles.map((f) => code(`components/studio/${f}`)).join("");
    t("F5: no legacy radius token survives in studio — a leftover is a corner that did not move with its neighbours",
      /(?<![\w-])rounded(?:-(?:sm|md|lg|xl|2xl))?(?![\w[-])/.test(codeOnly.replace(/rounded-\[var\([^)]*\)\]/g, "")), false);
  }

  // F6 — THE CANVAS CENSUS, EXACT COUNTS. `> 0` walks straight through a one-file mutation;
  // PR 2a proved that. The canvas renders through the PUBLIC article components, so a studio
  // radius reaching it would move the published page.
  {
    const dirCount = (dir) => {
      const out = [];
      const walk = (d) => { for (const e of readdirSync(new URL(`../../${d}`, import.meta.url), { withFileTypes: true })) {
        if (e.isDirectory()) walk(`${d}/${e.name}`); else if (e.name.endsWith(".tsx")) out.push(`${d}/${e.name}`); } };
      walk(dir);
      return out.reduce((n, f) => n + (read(f).match(/--studio-radius-/g) ?? []).length, 0);
    };
    for (const d of ["components/blog", "components/case-study", "app/(portfolio)"]) {
      t(`F6: ${d} carries ZERO studio radius vars — it is canvas/public code and a studio corner there would move the published page`,
        dirCount(d), 0);
    }
  }
}

/* ================================================ G. THE SELECTION LANGUAGE (PR B)
 * ONE language across three surfaces: a cream fill one step darker than that surface's own
 * ground, plus an IDENTICAL 3px accent-500 left bar.
 *
 * THE RULE IS SHARED; THE VALUE IS NOT, AND THAT IS THE POINT. The three grounds are three
 * different ladder steps — ListDetailLayout sits on cream-50, the blog rail on cream-200, the
 * block strip on cream-100 — so a single fill colour would be one step from its ground on one
 * surface and wrong on the other two. That would have been the THIRD time in this arc a
 * relation was encoded as a value, after #205's input colour and the fidelity findings' own
 * item-3 recommendation. Assert the STEP, never the hex.
 *
 * MEASURED, and the numbers are why the bar exists: every cream step separates by 1.05–1.19,
 * and the accent tint this replaces was 1.15 — inside the same band. The bar reads at
 * 3.43–4.48. The fill was never the signal. */
{
  const PAIRS = [
    { file: "ListDetailLayout.tsx", ground: "cream-50",  fill: "bg-cream-100", surface: "the shared list row (7 panels)" },
    { file: "BlogPostList.tsx",     ground: "cream-200", fill: "bg-cream-300", surface: "the blog list rail" },
    { file: "BlogBlocksEditPanel.tsx", ground: "cream-100", fill: "bg-cream-200", surface: "the block strip" },
  ];
  // The ladder, so "one step darker" is checked against a declared order rather than a guess.
  const LADDER = ["cream-50", "cream-100", "cream-200", "cream-300"];

  /**
   * THE SELECTED AND INACTIVE BRANCHES, PARSED — NOT `src.includes(...)`.
   *
   * MUTATION TESTING KILLED THE FIRST VERSION OF THIS BLOCK, TWICE, AND BOTH FAILURES ARE
   * WORTH KEEPING WRITTEN DOWN:
   *
   *   - Changing the strip's selected fill from cream-200 to cream-100 — collapsing it onto a
   *     SHARED HEX, the exact bug these assertions exist to prevent — still PASSED, because
   *     `bg-cream-200` appears four times in that file for unrelated controls.
   *   - Deleting `border-l-transparent` from the inactive branch still PASSED, because the
   *     string also appears IN THE COMMENT four lines above explaining why it is there. The
   *     assertion was reading my own prose.
   *
   * A file-wide substring check answers "does this token appear anywhere", which is not the
   * question. Comments are stripped and the ternary branches are parsed, so each assertion
   * reads the branch it names.
   */
  const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const branches = (src) => {
    const m = stripComments(src).match(/\?\s*"([^"]*border-l-accent-500[^"]*)"\s*:\s*"([^"]*)"/);
    return m ? { selected: m[1], inactive: m[2] } : null;
  };

  for (const p of PAIRS) {
    const src = readStudio(p.file);
    const b = branches(src);
    t(`G1: ${p.surface} has a parseable selected/inactive pair — if this fails every assertion below it is reading nothing`,
      b !== null, true);
    if (!b) continue;
    t(`G1: ${p.surface} fills ${p.fill} IN ITS SELECTED BRANCH — GROUND + 1 STEP from its own ${p.ground}, not a shared hex`,
      b.selected.split(/\s+/).includes(p.fill), true);
    t(`G1: …and ${p.fill} really is one step below ${p.ground} on the ladder`,
      LADDER.indexOf(p.fill.replace("bg-", "")) - LADDER.indexOf(p.ground), 1);
    t(`G2: ${p.surface} carries the 3px bar — identical width on all three, which is what makes it ONE language`,
      /border-l-\[3px\]/.test(stripComments(src)), true);
    t(`G2: ${p.surface} paints the bar accent-500 when selected`,
      b.selected.split(/\s+/).includes("border-l-accent-500"), true);
    t(`G2: ${p.surface} reserves the bar IN ITS INACTIVE BRANCH — border-l-transparent is what keeps selection from reflowing the row`,
      b.inactive.split(/\s+/).includes("border-l-transparent"), true);
    // THE TINT IS GONE FROM THE SELECTED BRANCH. #167's objection was a fill competing with the
    // accent badge and dot inside the row; leaving the tint under the bar would keep the
    // problem beside its own fix.
    //
    // SCOPED TO THE BRANCH THAT PAINTS THE BAR, NOT THE FILE. A file-wide check fails on
    // ListDetailLayout's BADGE, which is `bg-accent-500/10` and MUST STAY — it is one of the
    // two accent elements #167 protected, and the bar was chosen precisely so it could. An
    // assertion that cannot tell the selection fill from the badge would force deleting the
    // thing this design exists to preserve.
    t(`G2: ${p.surface}'s SELECTED branch carries no accent fill — the bar is the only accent on the row itself`,
      /bg-accent/.test(b.selected), false);
  }

  // G2b · THE TWO ACCENT ELEMENTS #167 PROTECTED MUST SURVIVE. This is the positive half of
  // the assertion above, and it is the whole reason the bar was chosen over an ink fill:
  // #167 rejected ink because the row carries an accent badge and an accent dirty dot that
  // would each have needed an inverted variant. A bar at the EDGE leaves both untouched.
  // Measured on the new cream-100 fill: badge text 6.00:1 (AA needs 4.5), and the badge sits
  // 78px from where the bar ends — not adjacent, so the row never reads as two accent marks.
  {
    const ld = readStudio("ListDetailLayout.tsx");
    t("G2b: the accent BADGE survives the repaint — the bar exists so it could, and deleting it would answer #167 by removing the thing #167 protected",
      /rounded-full bg-accent-500\/10[^"]*text-accent-600/.test(ld), true);
    t("G2b: the accent DIRTY DOT survives too — the other element #167 named",
      /size-1\.5 shrink-0 rounded-full bg-accent-500/.test(ld), true);
  }

  // G3 · NO `border-transparent` SHORTHAND ON THESE ROWS. It writes `border-color` while the
  // bar writes `border-left-color`; both are utilities at equal specificity, so the left edge
  // would be decided by their order in the generated sheet. A coin-flip dressed as a class.
  t("G3: ListDetailLayout sets the three non-bar sides explicitly — the border-color shorthand would race border-left-color for the bar's edge",
    /border-y-transparent border-r-transparent/.test(readStudio("ListDetailLayout.tsx")), true);

  // G4 · THE INHERITED GROUND, PINNED — AND WHY IT IS PINNED RATHER THAN JUST STATED.
  // ListDetailLayout's list column declares NO background of its own; it inherits cream-50
  // from whatever page hosts it. Measured constant on /studio/experience and /studio/skills,
  // but by accident rather than by construction. A future page that mounts the layout on a
  // different ground silently breaks surface 1's step — the fill would no longer be one step
  // from anything — AND NOTHING WOULD FAIL, because every class involved is still correct.
  // This asserts the absence, so adding a background here becomes a deliberate act that has to
  // come with a decision about the selection step.
  t("G4: ListDetailLayout's list column still declares NO ground — the selection step DEPENDS on it inheriting cream-50, and that is inherited, not declared",
    /<nav[\s\S]{0,400}?className=\{`\$\{selectedId === null \? "block" : "hidden"\} lg:block`\}/.test(readStudio("ListDetailLayout.tsx")), true);
  t("G4: …and no cream ground has been added to it since",
    /role="tablist"[\s\S]{0,300}?bg-cream/.test(readStudio("ListDetailLayout.tsx")), false);
}

console.log(`\nstudio-ink result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
