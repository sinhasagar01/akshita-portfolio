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

/* ================================================ D. THE 236px COUPLING
 *
 * ---- THIS BLOCK USED TO COUNT, AND THE COUNT WAS WRONG ------------------------------------
 *
 * It read "all five sites must still read 236" and pinned FOUR. At the time it was written that
 * was very nearly right. It is not any more: `CS_FIT_THRESHOLD_PX` and `CS_COLLAPSED_FLOOR_PX`
 * both sum the sidebar, both are BEHAVIOURAL — they decide whether the case-study list collapses
 * and whether its inspector folds — and both landed after this was written, so the count decayed
 * to four-of-seven without anything failing. Hazard 1's own text still said two.
 *
 * A COUNT IN A COMMENT IS A CLAIM WITH NO GATE UNDER IT. So this stops counting. The arithmetic
 * half now lives in `three-pane` Part A, which READS the width out of `StudioSidebar`'s class and
 * sums it into every threshold — #194's fix applied to the one term #194 left out. Nothing needs
 * to know how many sites there are once no site restates the number.
 *
 * WHAT STAYS HERE is the half that is about INK CHROME rather than arithmetic: this suite owns
 * the sidebar's appearance, so it pins that the width class still exists on the element whose
 * ground it governs. The equality with PublishBar's offset moved to `three-pane` beside the other
 * derivations, because it is a coupling between two files and not a fact about ink. */
t("D1: the sidebar's width is a custom property on the element this suite governs",
  /lg:w-\[var\(--studio-sidebar-w\)\]/.test(sidebar), true);
// THE LAST LITERAL IS GONE. #236 asserted the sidebar and PublishBar carried EQUAL literals; the
// resize PR made them consume the same property, so there is nothing left to keep in step.
t("D1: …and no literal width survives on it",
  /lg:w-\[\d+px\]/.test(sidebar), false);
t("D1: …with the bounds and the clamp owned by one module, not by this suite",
  /export function clampSidebarWidth/.test(read("lib/studio/sidebar-width.ts")), true);

/* ============================================ E. THE PANEL LANGUAGE (PR 2a) */
import { readdirSync } from "node:fs";
const studioFiles = readdirSync(new URL("../../components/studio", import.meta.url), { recursive: true })
  .map(String).filter((f) => f.endsWith(".tsx"));
const readStudio = (f) => read(`components/studio/${f}`);

/** A CONSUMER of the list-detail hook IMPORTS it; the file that DEFINES it merely exports it.
 *  `/useListItem\(/` matched both, so `ListDetailLayout` counted itself as an entry panel the
 *  moment it grew an input of its own (#248's rail search). Matching the IMPORT is the property
 *  that actually means "this file renders a panel inside the shell". */
const IMPORTS_LIST_ITEM = /import\s*\{[^}]*\buseListItem\b[^}]*\}\s*from/;

/** Inputs the 760px measure exists for: it caps a field that GROWS with the window. A file input
 *  has no visible box and a search box is chrome in a fixed-width rail, so neither has a measure
 *  to carry. Counts tags rather than testing the file, so one chrome input cannot excuse a file
 *  full of real fields. */
const contentInputs = (p) => {
  const src = code(p);
  const inputs = (src.match(/<input\b/g) ?? []).length;
  // NOT FIELDS, EXCLUDED ON WHAT THEY ARE. A file input has no visible box, a search box is
  // chrome in a fixed-width rail, and a KEY PILL shrink-wraps its text (#253) — none of the
  // three has a 760px measure to carry.
  //
  // COUNTED, NOT PARSED OUT OF THE TAG. A `<input\b[^>]*>` window stops at the FIRST `>`, so an
  // input carrying `ref={(el) => …}` ends its match at the ARROW, long before `className`. The
  // tag-filter form silently matched nothing and passed for the wrong reason.
  const files = (src.match(/type="file"/g) ?? []).length;
  const searches = (src.match(/type="search"/g) ?? []).length;
  const pills = (src.match(/className=\{`?\$?\{?KEY_PILL_CLS/g) ?? []).length;
  return inputs - files - searches - pills;
};

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
  //
  // REPINNED ON THE GROUND ALONE. This read `border-accent-500/30 bg-cream-100`, so removing the
  // panel FRAME — a change about clipping, with no bearing on the ground this assertion is named
  // for — failed a GROUND assertion in five files at once. **Third instance of "an assertion must
  // not pin its neighbours"**, after #213's padding-in-a-colour-regex and three-pane's width
  // regex. The subject is the cream-100 step; the border was never part of it.
  for (const f of ["HeroEditPanel", "AboutEditPanel", "ProcessEditPanel", "LinksEditPanel",
                   "ExperienceEditPanel", "ProjectsEditPanel"]) {
    t(`E1: ${f}'s shell is the FIELD-SURFACE step — the wells on it are only wells relative to this`,
      /bg-cream-100/.test(readStudio(`${f}.tsx`)), true);
  }
}

/* ================================================ E1b. THE PANEL FRAME, SCOPED BY DERIVATION
 *
 * Five panels lost their `overflow-hidden rounded-panel border` frame in #245, because they render
 * inside the full-height list-detail PANE and the overflow was clipping the pane's own scrolling.
 * `ProjectsEditPanel` renders the SAME markup and must KEEP it — its copy is the case-study
 * route's bespoke/loading/error fallback, a lone notice on a page that scrolls.
 *
 * A CLASS-LEVEL SWEEP WOULD HAVE TAKEN IT. Fourth firing of the shared-seam trap in this
 * sequence, so the scoping is DERIVED rather than remembered: the shell consumers are read out of
 * the three files that render `<ListDetailLayout`, and the rule is stated against that set. A new
 * panel added to a shell joins this gate by being rendered there. */
{
  const hosts = ["app/studio/(dashboard)/settings/page.tsx",
                 "components/studio/ExperienceListEditor.tsx",
                 "components/studio/SkillsEditor.tsx"];
  const rendersShell = hosts.filter((h) => /<ListDetailLayout/.test(code(h)));
  t("E1b: the three shell hosts still render the layout — if this shrinks the derivation below is reading less than it thinks",
    rendersShell.length, 3);

  // ---- THIS DERIVATION WAS A NAMING CONVENTION WEARING A DERIVATION'S CLOTHES (#248) ---------
  //
  // It used to match `/<([A-Z][A-Za-z]*EditPanel)\b/` — a NAME SUFFIX — anywhere in the host
  // file. Skills' panel is `CategoryPanel`, defined inside `SkillsEditor`, so it never entered
  // the set. The gate then asserted "the five" and passed, while the sixth panel kept the frame
  // #245 was removing. **The gate derived and still encoded the same hand-written assumption the
  // fix did**, which is why #245's sweep-by-name and this assertion missed the identical panel.
  //
  // Now it reads every capitalised component rendered BETWEEN the layout's own tags. That is the
  // property that actually defines a shell panel — it is rendered inside the shell — and it
  // still excludes `ProjectsEditPanel` by construction rather than by exception, because that
  // component is never a child of `<ListDetailLayout>`.
  const childrenOf = (src) =>
    [...(/<ListDetailLayout[\s\S]*?>([\s\S]*?)<\/ListDetailLayout>/.exec(src)?.[1] ?? "")
      .matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1]);
  const shellPanels = [...new Set(rendersShell.flatMap((h) => childrenOf(code(h))))];
  t("E1b: the derived shell-panel set now includes Skills' CategoryPanel, which the suffix match never saw",
    shellPanels.sort(), ["AboutEditPanel", "CategoryPanel", "ExperienceEditPanel", "HeroEditPanel",
      "LinksEditPanel", "ProcessEditPanel"]);
  t("E1b: …and ProjectsEditPanel is still out of it, by construction rather than by exception",
    shellPanels.includes("ProjectsEditPanel"), false);

  // E1c · THE FRAME RULE, STATED AGAINST THE DERIVED SET. A panel resolves to the file that
  // DEFINES it, which is how `CategoryPanel` resolves to `SkillsEditor.tsx` rather than to a file
  // named after it. A new panel rendered into a shell joins this gate by existing.
  const defining = (name) => studioFiles.find((f) => f === `${name}.tsx`)
    ?? studioFiles.find((f) => new RegExp(`function ${name}\\s*\\(`).test(code(`components/studio/${f}`)));
  const resolved = shellPanels.map((n) => [n, defining(n)]);
  t("E1c: every derived shell panel resolves to a defining file",
    resolved.filter(([, f]) => !f).map(([n]) => n), []);
  const framed = resolved.filter(([, f]) => {
    const sec = /<section[\s\S]{0,600}?className="([^"]*)"/.exec(code(`components/studio/${f}`))?.[1] ?? "";
    return /radius-panel|border-accent-500\/30|overflow-hidden/.test(sec);
  }).map(([n]) => n);
  t("E1c: no shell panel draws a frame — a box around a box, whose overflow clipped the pane (#245)",
    framed, []);

  /* E1d · THE SAME RULE FOR THE OTHER SHELL, AND THE GAP IT CLOSES IS REAL.
   *
   * E1b/E1c derive from `<ListDetailLayout>` hosts. `SectionsEditPanel` renders in
   * `ThreePaneShell`, so it was NEVER IN THE DERIVED SET — and it kept a card frame around its
   * whole inspector body until #262 removed it. **A derivation scoped to one shell is not a rule
   * about frames; it is a rule about that shell**, which is the #248 finding in a new costume:
   * the set was derived honestly and still described less than the rule it was enforcing.
   *
   * The property is E1c's — a body rendered inside a pane the shell already frames must not draw
   * its own — asserted on the element that carried it. */
  {
    const sep = readStudio("SectionsEditPanel.tsx");
    const wrapper = /hidden=\{selectedSectionId !== ids\.sectionIds\[i\]\}[\s\S]{0,1400}?className="([^"]*)"/
      .exec(sep)?.[1] ?? "";
    t("E1d: the section wrapper still exists, so the assertion below is reading something",
      wrapper !== "", true);
    t("E1d: …and it draws NO frame — the pane is already a bordered surface (#245's rule, other shell)",
      /rounded-\[var\(--studio-radius|border border-ink/.test(wrapper), false);

    // E1d-b — AND IT KEEPS ITS PADDING, WHICH IS A SEPARATE FACT AND WAS MEASURED.
    // The border was the extra pixel: with the frame the body's ink landed at 14 while the tabs
    // and hint sit at 13; without it, 13. Removing `p-3` as well would put it at 1 — exactly the
    // defect #257 fixed on the tab hint, reintroduced one element over.
    t("E1d-b: …while keeping p-3, so its ink lands at 13 with the tabs rather than at 1",
      /\bp-3\b/.test(wrapper), true);
  }

  // The old positive check here read `readStudio(`${name}.tsx`)`, which ASSUMED every panel lives
  // in a file named after it — the same assumption the suffix match made, one line apart. It
  // threw outright once `CategoryPanel` entered the set, which is a better failure than the
  // silent pass it gave before. E1c above supersedes it and resolves the defining file properly.
  const FRAME = /overflow-hidden rounded-\[var\(--studio-radius-panel,12px\)\] border border-accent-500\/30/;

  // AND THE NON-CONSUMER KEEPS ITS FRAME. Asserted positively, so a later sweep that "finishes
  // the job" fails here rather than silently stripping a panel that is not in a shell.
  t("E1b: ProjectsEditPanel is NOT a shell panel — it is the case-study route's fallback",
    shellPanels.includes("ProjectsEditPanel"), false);
  t("E1b: …and it KEEPS its frame, because a lone notice on a scrolling page needs one",
    FRAME.test(readStudio("ProjectsEditPanel.tsx")), true);
  // The padding #233 took away and #245 restored, for that branch only.
  t("E1b: …and its fallback carries the page padding #233 dropped from the route",
    /<div className="p-4 lg:p-6">[\s\S]{0,200}?<section/.test(readStudio("ProjectsEditPanel.tsx")), true);
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
  // #253 SPLIT THIS DELIBERATELY, AND THE SPLIT IS THE FEATURE. The Links row is a KEY and its
  // VALUE — the label NAMES the url beneath it, which is the pair the owner reported as two
  // identical boxes. The label now takes the key pill, so only the url and the add control still
  // reference the local base. Asserting 3 would be asserting the defect back. What the original
  // was protecting still holds and is what is checked: ONE well base, not two generations.
  t("E2: …and its VALUE controls reference that one base, so the panel cannot split into two well generations",
    (readStudio("LinksEditPanel.tsx").match(/\$\{inputBase\}/g) ?? []).length, 2);
  t("E2: …with the label on the KEY PILL rather than a second well — the split is by role, not a stray class",
    /KEY_PILL_CLS\} min-w-0 flex-1/.test(readStudio("LinksEditPanel.tsx")), true);
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
// ---- THE COUNT IS 2, THE PREDICTION THAT IT WOULD BE 4 WAS WRONG, AND SO WAS MY REASON ----
//
// PR 3 wrote "it becomes 4 when the case-study inspector lands, and that will be deliberate",
// and PR 7 landed that inspector. The count is still 2.
//
// **THE REASON RECORDED HERE WAS "the case-study inspector has no section HEADS to band". THAT
// IS FALSE.** Measured: it has FOURTEEN, one `<h3 className={labelCls}>` per section. The
// conclusion was right and the reason was wrong, which is the arc's own recurring shape and is
// worth correcting rather than leaving to be cited.
//
// ---- WHY THERE ARE NO BANDS, DERIVED FROM WHAT A BAND IS FOR ------------------------------
//
// A BAND DIVIDES CO-VISIBLE REGIONS. Measured in the blog inspector: two `<section>` siblings on
// screen together, "Post" at 924px and "Body · 7" at 421px, and the band is what says where one
// ends and the next begins. That is the job.
//
// THE CASE-STUDY INSPECTOR HAS NOTHING TO DIVIDE. Its 14 heads are 14 ALTERNATIVES, and exactly
// ONE is visible at a time — the other 13 are mounted and `hidden`, which is the mount discipline
// the editor depends on. Above the visible head is the tablist; below it are its own fields.
// **A divider with nothing on the other side is not a divider**, so the band would be decoration
// wearing a structural treatment's clothes.
//
// AND THE JOB IS ALREADY DONE, BY THE RAIL. What the blog does with two bands in one scrolling
// pane, the case study does with a list pane: you NAVIGATE between sections instead of scrolling
// past them. Band and rail are the same affordance at different scales, and PR 7 chose the rail.
//
// THE THIRD ARGUMENT IS THE ONE THAT WOULD HAVE MADE IT WORSE. Measured, the selected section's
// name is already on screen THREE TIMES — the rail's selected row (13.5px/500), the canvas bar
// (13.5px/500), and this `<h3>` (12px/600). Banding the inspector's copy would make the most
// redundant of the three the loudest.
//
// DECIDED, NOT DEFERRED: the case-study inspector takes no ink bands, and the by-role rule is
// unchanged — INSPECTOR PANE -> ink band still holds, for an inspector that has co-visible
// regions to separate. This one does not.
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
  // THE PROPERTY THE DECISION RESTS ON, pinned so the decision can be re-read against a fact
  // rather than a memory: the case-study inspector's section heads are ALTERNATIVES, hidden by
  // selection, so at most one is ever visible and a band would divide nothing. If that ever
  // stops being true — if two section editors become co-visible — this fails and the by-role
  // question genuinely reopens.
  {
    const cs = code("components/studio/SectionsEditPanel.tsx");
    t("E5: …because its section heads are ALTERNATIVES — hidden by selection, never co-visible",
      /hidden=\{selectedSectionId !== ids\.sectionIds\[i\]\}/.test(cs), true);
    t("E5: …and the blog's two ARE co-visible, which is what its bands divide",
      (code("components/studio/BlogBlocksEditPanel.tsx").match(/<section/g) ?? []).length >= 2, true);
  }
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
 * THE BAND COUNT IS 2 AND STAYS 2, and that is now a DECISION rather than an open question. E5
 * records why: a band divides CO-VISIBLE regions, and the case-study inspector's section heads
 * are alternatives of which one shows at a time. This comment used to promise 4; it landed at 2.
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
      return IMPORTS_LIST_ITEM.test(src) && /<section/.test(src);
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

/* ================================================ C4. SELECTION TREATMENT, BY FUNCTION
 *
 * The rule was already in source and unstated, which is how a fourth treatment appeared without
 * anything failing:
 *
 *   a two-state MODE switch       -> the accent FILL  (SegmentedToggle, Board|Editor, view,
 *                                                     and Content|Style since #263)
 *   a switch between CONTENT SETS -> the UNDERLINE   (the hero tabs)
 *   a VERTICAL list rail          -> fill + left bar (ListDetailLayout)
 *
 * SUPERSEDED WORDING, KEPT BECAUSE A REVERSAL NEEDS ITS ORIGINAL. This read:
 *   role="group" + aria-pressed -> FILL / role="tablist" + aria-selected -> UNDERLINE.
 * It described two of the three tablists, which is what #263 found when the owner overruled C-29.
 *
 * The hero tabs were the only tablist wearing an accent TINT. The contract asked them to take
 * the FILL, which would have given TABLISTS TWO LANGUAGES in order to make one control match a
 * control of a DIFFERENT role — and swapping in `SegmentedToggle`, as its wording suggests, would
 * have dropped the Arrow keys, `aria-selected` and the tabpanel association. A regression wearing
 * consistency's clothes. The underline APPLIES the rule; the fill would have changed it.
 *
 * Stated here because an unstated rule is what let the tint sit there unnoticed. */
{
  const hero = code("components/studio/HeroEditPanel.tsx");
  const cs = code("components/studio/SectionsEditPanel.tsx");
  const seg = code("components/studio/SegmentedToggle.tsx");
  // THE TWO TABLISTS SHARE A SELECTION LANGUAGE, NOT A BYTE-IDENTICAL STRING, and this used to
  // pin `"border-accent-500 font-medium text-ink-950"` as one literal. **It broke for the right
  // reason in C-27**: the hero panel's weight moved to the SHARED BASE so all four tabs render
  // 500, because the public hero it mimics is 500 throughout and carries selection by colour
  // rather than by weight (see Part J). Content|Style has no such obligation and keeps its bump.
  //
  // So the weight was never part of the selection RULE — it was an incidental token riding inside
  // an assertion about selection colour, and pinning the pair meant a correct change to one
  // tablist failed a rule about both. Compared with weight excluded, and both sides read from
  // source rather than retyped here.
  const selectedOf = (src) => (/\? "(border-accent-500[^"]*)"/.exec(src)?.[1] ?? "")
    .split(/\s+/).filter((tok) => !/^font-/.test(tok)).sort();
  /* ---- C4 RESTATED: THE RULE IS BY FUNCTION, NOT BY ROLE (#263 overrules C-29) --------------
   * This pair used to assert that BOTH tablists take the underline, encoding C-20's by-role rule.
   * **That rule was already false of a third of its own subjects the day it was written**:
   * `ListDetailLayout`'s VERTICAL list rail is `role="tablist"` + `aria-selected` and takes a
   * cream fill plus a 3px accent LEFT BAR — its own comment calls that "the studio's one
   * selection language". Two of three is not a rule about roles.
   *
   * ASSERTED AS A DIFFERENCE, DELIBERATELY. The old pair said "these two are the same"; saying
   * "these two are now different" is weaker unless each side is pinned to its own treatment, so
   * all three are — otherwise a later sweep could take them to one language and still satisfy a
   * rule that only ever compared two. */
  /* SCOPED TO CONTENT|STYLE'S OWN CLASS EXPRESSION, and the first draft was NOT — it tested the
   * whole file for `? "bg-accent-500 text-cream-50"` and PASSED by matching Board|Editor at
   * :2107, a different control entirely. Mutating the real tab left it green. That is precisely
   * the lesson recorded twelve lines above for the hero tabs — "an assertion that pins more than
   * its subject fails for the wrong reason" — repeated immediately beneath its own warning.
   * The tablist's aria-label is the anchor because it appears once and only in markup. */
  const csTab = /aria-label="Section content and style"[\s\S]*?\]\.join\(" "\)\}/.exec(
    cs.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  )?.[0] ?? "";
  t("C4: the Content|Style tab's own class expression was found — nothing below is file-wide",
    csTab.length > 0, true);
  t("C4: Content|Style takes the segmented FILL — it is a two-state mode switch",
    /\?\s*"bg-accent-500 text-cream-50/.test(csTab), true);
  t("C4: …and keeps NO underline, so the two languages are not both applied",
    /border-b-2/.test(csTab), false);
  t("C4: the hero tabs KEEP the underline — they switch between content sets, so C-20 is narrowed",
    selectedOf(hero), ["border-accent-500", "text-ink-950"]);
  /* ---- C4b · THE CONTRACT'S `.seg` VALUES, DERIVED FROM THE FILE RATHER THAN RETYPED --------
   * The contract is read here so the assertion cannot drift from it silently — if someone edits
   * `.seg` the expected values move with it and this fails until the app follows. The MARGIN is
   * deliberately excluded: `.seg{margin:12px 14px 0}` carries the same 14 as `.ibody`, which
   * correction 31 recorded as the mock's own card padding. */
  {
    const contract = readFileSync(new URL("../../docs/studio/studio-field-contract.html", import.meta.url), "utf8");
    const segBtn = /\.seg button\{([^}]*)\}/.exec(contract)?.[1] ?? "";
    const wantH = /height:(\d+)px/.exec(segBtn)?.[1];
    const wantFont = /font:(\d+) (\d+)px/.exec(segBtn.replace(/\s+/g, " "));
    t("C4b: the contract still declares .seg button, so the values below are read not assumed",
      segBtn !== "", true);
    t("C4b: the button height matches the contract's", new RegExp(`h-\\[${wantH}px\\]`).test(cs), true);
    t("C4b: …and its weight and size do too",
      wantFont !== null && new RegExp(`text-\\[${wantFont[2]}px\\]`).test(cs)
        && (wantFont[1] === "600" ? /font-semibold/.test(csTab) : false), true);
    t("C4b: the container is a bordered, rounded, clipped box — the contract's .seg",
      /flex overflow-hidden rounded-\[var\(--studio-radius-control,4px\)\] border border-ink-950\/22/.test(csTab), true);
    t("C4b: …with a hairline BETWEEN the two, the contract's `.seg button+button`",
      /\[&\+&\]:border-l/.test(cs), true);
  }

  /* ---- C4c · THE FOCUS RING READS ON BOTH GROUNDS, AND THIS IS WHAT THE FILL BROKE -----------
   * An inset accent ring on the SELECTED button draws accent-on-accent — **measured at 1.00,
   * invisible**. The underline never had the problem because both tabs sat on cream; the fill is
   * what put one ring on two grounds. So the colour is per-state: cream-50 on the fill, accent on
   * the cream. Both land at 4.70.
   * ALSO NOTE, from driving it: selection follows focus here, so the focused tab is ALWAYS the
   * selected one and the rest button's ring is defensive rather than reachable. Asserted anyway,
   * because a later change to selection-follows-focus would make it reachable silently. */
  t("C4c: the ring is inset, so `overflow-hidden` cannot clip it at the container's edge",
    /focus-visible:-outline-offset-2/.test(csTab), true);
  t("C4c: …and its colour is per-state, or it draws accent on accent and vanishes",
    /bg-accent-500 text-cream-50 focus-visible:outline-cream-50/.test(csTab)
      && /bg-cream-50[^"]*focus-visible:outline-accent-500/.test(csTab), true);

  t("C4: …and the vertical list rail keeps its accent bar, the third treatment by-role missed",
    /accent-500/.test(code("components/studio/ListDetailLayout.tsx")), true);
  t("C4: …with the hero's weight in the shared base instead, so selection is not ALSO a weight step",
    /className=\{\[ "-mb-px border-b-2[^"]*font-medium/.test(hero.replace(/\s+/g, " ")), true);
  // SCOPED TO THE TAB'S OWN CLASS EXPRESSION, not to everything after the first role="tab".
  // The file legitimately holds two other accent fills — the panel header's icon chip and the
  // Save button — and an assertion that pins more than its subject fails for the wrong reason.
  // Same lesson E2's geometry regex and three-pane's width regex both learned.
  const tabCls = /className=\{\[\s*"-mb-px border-b-2[\s\S]*?\]\.join/.exec(hero)?.[0] ?? "";
  t("C4: the tab class expression was found", tabCls.length > 0, true);
  t("C4: the hero tabs carry no accent FILL or TINT — that language belongs to role=group",
    /bg-accent-500(\/\d+)?/.test(tabCls), false);
  t("C4: SegmentedToggle keeps the fill, because it is a group and picks a VALUE",
    /role="group"/.test(seg) && /bg-accent-500 text-cream-50/.test(seg), true);
  // THE SEMANTICS ARE THE REASON THE SWAP WAS REFUSED, so they are what the gate protects.
  for (const [what, re] of [
    ["aria-selected", /aria-selected=\{i === activeTab\}/],
    ["aria-controls onto a real tabpanel", /aria-controls="hero-tab-edit-panel"/],
    ["a roving tabindex", /tabIndex=\{i === activeTab \? 0 : -1\}/],
    ["Arrow key handling", /ArrowRight|ArrowLeft/],
  ]) t(`C4: the hero tabs keep ${what} — what adopting SegmentedToggle would have cost`, re.test(hero), true);
}

/* ================================================ C3. THE ORDINAL'S LABEL SCALE, ASSERTED AS A PAIR
 *
 * `OverviewRow` is a SERVER component; `labelCls` lives in `blocks/fields.tsx`, which is
 * `"use client"`. Importing the constant across that boundary does not fail to build — it yields
 * a THROWING PROXY that a template literal stringifies, so the rendered class came out as
 * `w-6 shrink-0 tabular-nums function() { throw new Error("Attempted to call labelCls()...`.
 * **tsc, lint and this whole suite passed.** Only rendering the page showed it.
 *
 * So the utilities are written out in that file, and the pair is asserted instead of deleted —
 * the rule `three-pane` H already runs on the pane widths: a coupling you cannot remove is a
 * coupling you assert. The ordinal must carry every token the label scale defines, EXCEPT its
 * colour is checked separately below because the contract asked for a different one. */
{
  const ord = readStudio("OverviewRow.tsx");
  const label = /export const labelCls = "([^"]*)";/.exec(readStudio("blocks/fields.tsx"))?.[1] ?? "";
  const ordCls = /className="(w-6 shrink-0[^"]*)"/.exec(ord)?.[1] ?? "";
  t("C3: the label scale is still a single string in the fields module", label.length > 0, true);
  t("C3: the ordinal carries every token of the label scale",
    label.split(/\s+/).filter((tok) => !ordCls.split(/\s+/).includes(tok)), []);
  // THE COLOUR IS THE HALF THE CONTRACT GOT WRONG. It specifies ink-400 for this ordinal; #228
  // swept 45 sites OFF ink-400 because it measures 3.02–3.49 on cream and fails AA. Pinned so a
  // later reading of the contract cannot quietly restore it.
  t("C3: …and it is ink-600, not the contract's ink-400 — the value #228 removed",
    /text-ink-600/.test(ordCls) && !/text-ink-400/.test(ordCls), true);
  // AND THE BOUNDARY ITSELF, so nobody re-adds the import that looked fine and rendered a proxy.
  t("C3: OverviewRow does NOT import from the client fields module — it is a server component",
    /from "\.\/blocks\/fields"/.test(ord), false);
}

/* ================================================ C2. THE FIELD MEASURE
 *
 * A form is content and content has a measure. Unbounded, a single-line field grows with the
 * window — MEASURED at **1939px on a 2560 display**, 915px on the 1536 laptop. The panel keeps
 * its full width; only the field is capped.
 *
 * THIS IS ONE DEFINITION AND N APPLICATIONS, so the applications are what need asserting.
 * Three plausible shared seams were rejected, each for a different reason, and the reasons are
 * worth keeping because each looked like the obvious answer:
 *
 *   ListDetailLayout's detail pane   caps the PANEL — its cream-200 bar and footer would shrink
 *   the panels' body wrapper         byte-identical in five panels, and holds the TEXTAREAS
 *   `inputCls` itself                textareas use it, and it reaches the case-study inspector
 *
 * DERIVED, NOT LISTED: every entry panel that renders a single-line `<input>` must carry the
 * measure on it, and no `<textarea>` may. The set comes from the same `useListItem` derivation
 * E6 uses, so a new entry panel joins this gate by existing rather than by being remembered. */
{
  // THE SET IS THE PANELS **AND THE CHILDREN THEY RENDER FIELDS THROUGH**, and the second half
  // was a real miss. `ChipListEditor` puts single-line inputs on the same stretching surface but
  // calls no `useListItem` — it is a child, not a panel — so a panels-only derivation passed
  // while About and Process still ran 1825px fields. Derived from the panels' own local imports,
  // so a future shared field component joins this gate by being imported rather than remembered.
  const panels = readdirSync(new URL("../../components/studio", import.meta.url))
    .map(String).filter((f) => f.endsWith(".tsx"))
    .filter((f) => IMPORTS_LIST_ITEM.test(readStudio(f)) && /<input\b/.test(code(`components/studio/${f}`)))
    // Excluded HERE rather than at the end, so it cannot drag its children in either: it imports
    // SectionsEditPanel, the whole three-pane case-study editor, whose fields are in a 320px
    // inspector. See the note below for why the panel itself is out.
    .filter((f) => f !== "ProjectsEditPanel.tsx");
  const fieldChildren = [...new Set(panels.flatMap((f) =>
    [...code(`components/studio/${f}`).matchAll(/from "\.\/([A-Za-z][A-Za-z0-9]*)"/g)].map((m) => `${m[1]}.tsx`)))]
    .filter((f) => { try { return /<input\b/.test(code(`components/studio/${f}`)); } catch { return false; } })
    // A FILE INPUT IS NOT A FIELD, AND NEITHER IS A SEARCH BOX. Counted rather than pattern-
    // excluded, because "the file contains a file input" was always the weaker form of the rule:
    // it drops a whole file on one non-field input. `contentInputs` counts the inputs the measure
    // is actually FOR, so a panel holding a search box AND real fields still has its fields
    // checked. SettingsPhotoField (only `type="file"`, no visible box) and ListDetailLayout (only
    // the rail's `type="search"`, in a `lg:w-[300px] lg:flex-none` column that cannot stretch)
    // both fall out with zero — on what they are, not on their names.
    .filter((f) => contentInputs(`components/studio/${f}`) > 0);
  // ProjectsEditPanel is in E6's entry-panel set through its bespoke/loading/error fallback, but
  // the fields it renders belong to the case-study DETAILS form, which lives in the three-pane
  // inspector — a 320px pane that never stretches. The measure exists for a field that grows with
  // the window; that one cannot. Excluded above with its reason, rather than by bending the
  // derivation until it agreed.
  const entryPanels = [...new Set([...panels, ...fieldChildren])];
  t("C2: the measure is declared once, in the shared fields module",
    /export const FIELD_MEASURE = "max-w-\[760px\]";/.test(readStudio("blocks/fields.tsx")), true);
  // Non-vacuous: if the derivation stops matching, this empties and the checks below pass proving
  // nothing — the failure mode E6 already names.
  t("C2: …and the derived set of entry panels with fields is not empty", entryPanels.length >= 5, true);
  t("C2: …and it reaches the shared field CHILDREN, not just the panels", entryPanels.includes("ChipListEditor.tsx"), true);

  // EVERY single-line input carries it. Counted per file rather than asserted globally, so the
  // failure names the panel that grew an uncapped field.
  const uncapped = entryPanels.filter((f) => {
    const src = code(`components/studio/${f}`);
    const inputs = contentInputs(`components/studio/${f}`);
    const capped = Math.max(0, (src.match(/FIELD_MEASURE/g) ?? []).length - 1); // minus the import
    return inputs !== capped;
  });
  t("C2: every single-line input in an entry panel carries the measure", uncapped, []);

  // AND NO TEXTAREA DOES. This is the half that keeps the rule honest: the textareas hold
  // paragraphs and the room is the point, so a well-meaning sweep must not catch them.
  const cappedTextarea = entryPanels.filter((f) =>
    /<textarea[\s\S]{0,400}?FIELD_MEASURE/.test(code(`components/studio/${f}`)));
  t("C2: …and no textarea does — the room is why they are excluded", cappedTextarea, []);
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
    // COMMENT-STRIPPED, AND IT WAS NOT UNTIL NOW — WHICH IS THE SAME BUG THE ASSERTION TWENTY
    // LINES BELOW ALREADY CARRIES A NOTE ABOUT. That one strips comments because it once tripped
    // on the English word "rounded" in a layout comment; this one counted RAW SOURCE, so a
    // comment that so much as names `rounded-full` in backticks inflated the pill count and the
    // suite reported a pill nobody had added. An assertion about class strings that reads prose
    // is asserting about prose — the file's own words, applied to the line that needed them.
    const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const all = strip(studioFiles.map(readStudio).join("") + appStudio.join(""));
    // REVALUED 25 -> 27 IN PR 7, DELIBERATELY. The sections rail carries two status dots — the
    // needs-an-image marker and the details dirty marker — and a status dot is exactly the shape
    // this assertion protects: `BlogPostList`'s published/draft dot is already among the 25, and
    // these are its case-study twins. The count stays a COUNT rather than becoming a floor,
    // because a count is what makes an ACCIDENTAL pill fail; a `>=` would let the next one in
    // silently, which is the whole reason this assertion exists.
    // REVALUED 27 -> 28 IN #253, AND THE POINT IS THAT IT IS DECLARED. The key pill is the fourth
    // shape where roundness carries meaning, after the status dots, the PublishBar and the sidebar
    // nav items. Its justification: it reads as A KEY rather than a field, and reading as
    // not-a-field is its entire job. The count stays a COUNT rather than a floor — a `>=` would
    // let the next pill in silently, which is what this exists to prevent — so bumping it by hand
    // IS the declaration, and F5b names the site so the number cannot rise without one.
    // REVALUED 29 -> 30 IN THE BOARD PR, AND IT IS A NET OF THREE MOVES RATHER THAN ONE ADDITION.
    // The Board's "N blocks" count pill is GONE — the chips are the count, so the pill restated
    // what sat beside it — and the section mini adds TWO dots: the stepper's ordinal marker and
    // the annotated image's callout pins. Both are the status-dot family this assertion already
    // protects. Every RULE in the mini takes a 2px radius instead, because at 3px tall a full
    // round and a 2px radius are the same pixels and a pill spent on something indistinguishable
    // dilutes the count. F5d names the two sites.
    // REVALUED 30 -> 31 IN THE DETAILS CANVAS PR. The filter-row preview draws the work
    // section's three tabs, and a filter tab is a pill on the public site — `.work-filter button`
    // is `border-radius: 99px`. So this is the shape being COPIED faithfully rather than a new
    // one appearing: the preview would be wrong with square tabs. One literal, inside a map over
    // the three filters. F5e names the site.
    // REVALUED 31 -> 32 IN THE BESPOKE PR. The "Hand-built" chip in the crumb row is a pill
    // because it sits BESIDE the template chip, which has always been one — two chips in a row,
    // one shape. Its ground is accent-tinted rather than neutral, because it is a different KIND
    // of fact: the template chip says how the study renders, this says who renders it. F5f names it.
    // REVALUED 32 -> 33 IN THE INDEX PR, AND THE NET HIDES THREE ARRIVALS AND TWO DEPARTURES.
    // ARRIVED: the index's "Hand-built" chip and its platform DOT (both in CaseStudyItem), and
    // the list row's drag-handle dot. All three are the shapes this count protects — a status
    // chip and two dots, the same family as BlogPostList's published marker.
    // LEFT: the old index row's template pill and its dashed "Bespoke" badge, both deleted with
    // the row that carried them. So a naive `+3` would have been wrong and a `>=` would have hidden
    // the removals entirely. F5g names all five movements.
    t("F5: the 33 full pills survive — the shape carries meaning", (all.match(/rounded-full/g) ?? []).length, 33);
    t("F5g: …and the three arrivals are the index's chip, its platform dot and the drag dot",
      (code("components/studio/CaseStudyItem.tsx").match(/rounded-full/g) ?? []).length === 2
        && (code("components/studio/CaseStudyRow.tsx").match(/rounded-full/g) ?? []).length === 1, true);
    t("F5g: …and the two departures are the old row's template pill and Bespoke badge",
      (code("components/studio/CaseStudyIndex.tsx").match(/rounded-full/g) ?? []).length, 0);
    t("F5f: …and the 32nd is the Hand-built chip, beside the template chip it matches in shape",
      /rounded-full border border-accent-500\/35[\s\S]{0,120}Hand-built/.test(
        code("components/studio/SectionsEditPanel.tsx")), true);
    t("F5e: …and the 31st is the filter-row preview, which copies the public tab's own radius",
      /rounded-full border px-3 py-1 text-\[12px\] font-semibold capitalize/.test(
        code("components/studio/DetailsCanvas.tsx")), true);
    t("F5d: …and the two new ones are the mini's DOTS, the stepper's marker and the annotated pins",
      /numbered \? "rounded-full"/.test(code("components/studio/SectionMini.tsx"))
        && /absolute size-\[7px\] rounded-full bg-accent-500/.test(code("components/studio/SectionMini.tsx")), true);
    t("F5d: …and the Board's count pill is gone, because the chips ARE the count",
      /\{count\} \{count === 1 \? "block" : "blocks"\}\s*<\/span>/.test(readStudio("SectionsEditPanel.tsx")), false);
    t("F5b: …and the 28th is the key pill, a DECLARED exception rather than an undeclared fourth step",
      /export const KEY_PILL_CLS =[\s\S]{0,240}?rounded-full/.test(readStudio("blocks/fields.tsx")), true);
    // F5c — THE 29th IS THE DOCK'S TAG, and it is named here for the same reason the key pill is:
    // this census only means something if every rise in it has a site attached. A pill shape on a
    // one-word status tag is the shape doing its job, not a fourth radius step sneaking in.
    t("F5c: …and the 29th is the selection dock's field tag, declared rather than drifted",
      /function SelectionDock\b[\s\S]*?rounded-full border border-accent-500\/30/.test(
        readStudio("SectionsEditPanel.tsx")), true);
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
    // GROUND MOVED IN #242, RELATION DID NOT. The rail became a declared cream-200 column when
    // the list-detail pages went full-height, so its selected fill is cream-300. G1 checks that
    // the fill is ONE STEP from the surface's own ground, which is exactly the property that
    // survived the move — the table row changes, the rule does not.
    { file: "ListDetailLayout.tsx", ground: "cream-200", fill: "bg-cream-300", surface: "the shared list row (3 pages)" },
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

  // G3 · NOTHING MAY WRITE `border-color` ON THESE ROWS. The bar writes `border-left-color`;
  // a shorthand at equal specificity would race it and the left edge would be decided by the
  // generated sheet's order. A coin-flip dressed as a class.
  //
  // THE SHAPE CHANGED IN #242 AND THE PROPERTY DID NOT. The row used to neutralise three sides
  // explicitly (`border-y-transparent border-r-transparent`) because it carried an all-sides
  // `border`. Full-bleed rows carry only a BOTTOM rule and the left bar, so there is no
  // shorthand to neutralise — the race cannot occur rather than being prevented. Asserted as the
  // absence of the shorthand, which is the real rule; the old assertion pinned one way of
  // obeying it.
  {
    const rowCls = /className=\{\[[\s\S]{0,700}?"flex w-full justify-between[\s\S]{0,900}?\]\.join/.exec(readStudio("ListDetailLayout.tsx"))?.[0] ?? "";
    t("G3: the row class expression was found", rowCls.length > 0, true);
    t("G3: no bare `border-transparent` shorthand on the row — it would race the bar's border-left-color",
      /(^|[^-])\bborder-transparent\b/.test(rowCls), false);
    t("G3: …and the two edges it DOES draw are named per-side, so neither can race the other",
      /border-b-ink-950\/12/.test(rowCls) && /border-l-\[3px\]/.test(rowCls), true);
  }

  // G4 · THE GROUND IS DECLARED NOW, AND THAT IS THE DELIBERATE ACT THIS ASSERTION WAS WAITING
  // FOR. It used to pin the ABSENCE of a background: the column inherited cream-50 from whatever
  // page hosted it, measured constant but true by accident, so a future page on a different
  // ground would have broken the selection step with every class still correct and nothing
  // failing. The pin existed so that adding a background "becomes a deliberate act that has to
  // come with a decision about the selection step".
  //
  // #242 IS THAT ACT, and it came with that decision: the column declares cream-200 and the fill
  // moved to cream-300 with it (see G1). So the assertion inverts — from "no ground is declared"
  // to "the ground IS declared, and the fill is one step from THAT" — which is strictly stronger,
  // because the step is now derivable from source instead of from whatever the host happens to be.
  t("G4: ListDetailLayout's list column DECLARES its ground — the selection step no longer depends on what the host page happens to be",
    /role="tablist"[\s\S]{0,400}?lg:bg-cream-200/.test(readStudio("ListDetailLayout.tsx")), true);
  t("G4: …and it is the ground G1's table names for this surface, so the two cannot drift",
    PAIRS.find((p) => p.file === "ListDetailLayout.tsx")?.ground, "cream-200");
}

/* ================================== H. THE DASHED AFFORDANCES, AND WHERE THEIR HOVER MAY LAND */
//
// THIS PART EXISTS BECAUSE THE PR THAT ADDED IT PUT THE HOVER ON THE WRONG ELEMENT THREE TIMES
// OUT OF SEVEN. The seven dashed adds carry BYTE-IDENTICAL class strings across four files, so
// a fragment-anchored edit resolves to the first match rather than the intended one. Two of the
// three strays landed on solid-bordered REMOVE icon buttons, where `hover:border-solid` is a
// dead class AND the border silently firmed from accent/40 to full accent; the third landed on
// DisclosureGroup's reveal, which had been excluded by name in the same breath. tsc and lint
// were clean throughout, and only a grep of the finished tree caught it.
//
// The whole table below is DERIVED — every `border-dashed` site under components/studio, with
// its element tag and its enclosing component resolved from source. Nothing here is a pinned
// file or line, so a new dashed affordance joins the table by existing.
//
// THE ONE EXCLUSION IS NAMED BY COMPONENT, NOT BY LINE. DisclosureGroup's reveal is dashed and
// uses the same IconPlus, so no structural signal separates it from an add — it opens fields
// that already exist rather than creating one. Excluding it by enclosing component means the
// exclusion survives the file moving, and means a SECOND dashed button inside DisclosureGroup
// would be excluded too, which is the correct reading of the rule.
{
  const blank = (m) => m.replace(/[^\n]/g, " ");
  /** Comment-stripped like `code()`, but line-preserving — H reports file:line in its failures.
   *  A comment containing a class string has re-attributed a match twice in this project. */
  const codeLines = (p) => read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank).replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/(^|[^:])\/\/.*$/gm, (m, p1) => p1 + " ".repeat(m.length - p1.length))
    .split("\n");

  const SOLID_HOVER = "hover:border-solid";
  const sites = [];
  const strays = [];
  for (const f of studioFiles) {
    codeLines(`components/studio/${f}`).forEach((line, i) => {
      const at = `${f}:${i + 1}`;
      if (line.includes(SOLID_HOVER) && !line.includes("border-dashed")) strays.push(at);
      if (!line.includes("border-dashed")) return;
      let tag = null;
      for (let j = i; j >= 0 && j > i - 14 && !tag; j--) {
        const m = [...codeLines(`components/studio/${f}`)[j].matchAll(/<([a-zA-Z][\w.]*)/g)];
        if (m.length) tag = m[m.length - 1][1];
      }
      let comp = null;
      for (let j = i; j >= 0 && !comp; j--) {
        const m = /^(?:export\s+)?(?:default\s+)?function\s+([A-Za-z_]\w*)/.exec(codeLines(`components/studio/${f}`)[j]);
        if (m) comp = m[1];
      }
      sites.push({ at, tag, comp, solid: line.includes(SOLID_HOVER), hovers: line.includes("hover:") });
    });
  }

  // H1 · THE STRAY CHECK, AND IT NEEDS NO EXCEPTION LIST. `hover:border-solid` only means
  // anything on an element that is dashed at rest; anywhere else it is dead weight that arrived
  // with a live colour change riding alongside it. This is the assertion that would have caught
  // two of the three strays with no knowledge of which elements were meant to change.
  t("H1: `hover:border-solid` never lands on an element that is not dashed at rest", strays, []);

  // H2 · THE DERIVATION HAS TO BE HONEST BEFORE THE REST CAN LEAN ON IT. If the tag or the
  // enclosing component fails to resolve, every assertion below is quietly measuring nothing.
  t("H2: every dashed site resolved to an element and a component",
    sites.filter((s) => !s.tag || !s.comp).map((s) => s.at), []);
  t("H2: …and the table is non-empty, so a bad glob cannot pass this part vacuously",
    sites.length >= 9, true);

  // H3 · THE RULE. Every dashed BUTTON is an add and firms to solid on hover — except the one
  // reveal, excluded by its component. A new dashed add that forgets the hover fails here, and
  // the failure names the component so the fix is obvious.
  t("H3: every dashed button firms to solid on hover, and the only exception is DisclosureGroup's reveal",
    sites.filter((s) => s.tag === "button" && !s.solid).map((s) => s.comp), ["DisclosureGroup"]);
  // REVALUED 7 -> 8 IN THE INDEX PR. The grid view's add tile is a dashed add that firms to solid
  // on hover — the same shape as the other seven, on a new surface. The count stays a COUNT so a
  // dashed add that FORGETS the hover still fails; a floor would let it in silently.
  t("H3: …and eight of them carry it, which is the count the page contracts specify",
    sites.filter((s) => s.solid).length, 8);

  // H4 · THE REVEAL KEEPS A HOVER. Excluding it from the solid rule must not leave it inert —
  // it is still a control and still has to answer the pointer.
  t("H4: the excluded reveal still has a hover treatment of its own",
    sites.find((s) => s.comp === "DisclosureGroup")?.hovers, true);

  // H5 · RETIRED IN THE INDEX PR, CONSCIOUSLY, BECAUSE ITS SUBJECT WAS DELETED.
  //
  // It pinned ONE element: CaseStudyIndex's dashed "Bespoke" badge, a status pill inside a link
  // that must not carry a hover or it reads as separately clickable. The index's two-view rebuild
  // removed that badge — the bespoke signal is now the "Hand-built" chip, which is SOLID, not
  // dashed, so it is not in this part's population at all.
  //
  // ⚠ SO THE HONEST MOVE IS TO RETIRE IT, NOT TO REVALUE IT TO `[]`. `sites.filter(...)` now
  // returns an empty array, and asserting that an empty set has no bad members PASSES WITHOUT
  // TESTING ANYTHING — the run.mjs false-pass shape, one assertion down. An empty expectation
  // reads as "checked and clean" when it means "there is nothing to check".
  //
  // THE RULE ITSELF IS NOT REPEALED. If a dashed NON-button ever appears again it must stay
  // inert, and H1 still catches the inverse — a `hover:border-solid` on something not dashed at
  // rest. What is gone is the instance, and a gate with no instance is prose.
  t("H5 (retired): there is no dashed non-button left to pin — the Bespoke badge was deleted",
    sites.filter((s) => s.tag !== "button").length, 0);
}

/* ============================ J. THE MIMIC, WHICH SAID IT COULD NOT DRIFT AND THEN COULD (C-27) */
//
// `HeroEditPanel` states TWICE that its tab strip "mimics the real Hero tablist" so that "the
// mimic cannot drift" — and until this part, NOTHING ENFORCED IT. The claim was a comment.
//
// WHY THAT MATTERED. The four page contracts specify `.seg` for this control: sentence case,
// 12.5px, weight 600. The public hero renders the same author-edited labels UPPERCASE at 12px /
// 500, so all three contract values would have moved the panel AWAY from the thing it exists to
// mirror. **The contract is not wrong about the current state (like C-21..23) and not wrong about
// the design (like C-19..20) — it is wrong about WHAT THE ELEMENT IS FOR.** First correction of
// that shape in twenty-seven, and the reason the reference here is the PUBLIC RENDER rather than
// the contract.
//
// SO THE AXES ARE READ FROM BOTH FILES AND COMPARED TO EACH OTHER. Nothing below names a value:
// change the hero's tracking and this fails until the panel follows, which is the only form of
// this assertion that is worth having. Comment-stripped, and that is not decorative here — the
// panel's own comment now quotes `px-3 py-1.5`, `tracking-wide` and `0.10em` while explaining
// the change, and an unstripped match would read the history instead of the code.
//
// TWO TRAPS THIS PART WALKED INTO WHILE BEING WRITTEN, BOTH CAUGHT BY J1 RATHER THAN BY READING.
// (1) THE PUBLIC HERO HAS TWO TABLISTS WITH THE SAME `aria-label="Designer facets"` — the mobile
// dot indicators at `flex lg:hidden` come FIRST in source, so anchoring on the label picked the
// dots, which carry no type utilities at all. The anchor is the DESKTOP container's own
// `hidden lg:inline-flex`, which is the variant the studio's `lg:` chrome sits beside.
// (2) Stripping comments leaves their whitespace, so a character-count window from `role="tab"`
// to `className` overran. Whitespace is collapsed before matching.
// Both failures presented as J2 PASSING — on two empty strings. **That is exactly why J1 exists,
// and why it asserts the axes RESOLVED rather than merely that a string was found.**
{
  const flat = (p) => code(p).replace(/\s+/g, " ");
  const heroPub = flat("components/sections/HeroSection.tsx");
  const heroStudio = flat("components/studio/HeroEditPanel.tsx");

  const pubCls = /className="hidden lg:inline-flex[\s\S]{0,400}?aria-pressed=\{[\s\S]{0,200}?className="([^"]*)"/
    .exec(heroPub)?.[1] ?? "";
  const studioCls = /role="tab" [\s\S]{0,400}?className=\{\[ "([^"]*)"/.exec(heroStudio)?.[1] ?? "";

  /** The axes a mimic must share. Selection language is NOT among them — see J3. */
  const axes = (cls) => ({
    padX: /(?:^|\s)(px-[\w.[\]/-]+)/.exec(cls)?.[1] ?? null,
    padY: /(?:^|\s)(py-[\w.[\]/-]+)/.exec(cls)?.[1] ?? null,
    size: /(?:^|\s)(text-\[[\d.]+px\])/.exec(cls)?.[1] ?? null,
    weight: /(?:^|\s)(font-(?:normal|medium|semibold|bold|\[\d+\]))/.exec(cls)?.[1] ?? null,
    transform: /(?:^|\s)(uppercase|lowercase|capitalize|normal-case)/.exec(cls)?.[1] ?? null,
    tracking: /(?:^|\s)(tracking-[\w.[\]%-]+)/.exec(cls)?.[1] ?? null,
  });

  t("J1: both tab class strings were found — the comparison below is not vacuous",
    [pubCls.length > 0, studioCls.length > 0], [true, true]);
  t("J1: …and every axis resolved on both sides",
    [axes(pubCls), axes(studioCls)].map((a) => Object.values(a).filter((v) => v === null)), [[], []]);

  // J2 · THE MIMIC ITSELF. Six axes, compared file to file, no literal in this suite.
  t("J2: the studio hero tabs match the PUBLIC hero on every shared type axis — the mimic cannot drift",
    axes(studioCls), axes(pubCls));

  // J3 · AND THE ONE AXIS THAT DELIBERATELY DIFFERS, WHICH IS C-20 CONFIRMING ITSELF ON A CASE
  // NEITHER SIDE CONSTRUCTED FOR IT. The rule is role="group" -> FILL, role="tablist" -> UNDERLINE.
  // The public hero is a `group` with `aria-pressed` and an animated pill; the panel is a real
  // `tablist` with `aria-selected` driving a tabpanel. The roles differ, so the languages differ —
  // that is the rule working, not an exception to it. Asserted so that "make them match" cannot
  // quietly take the selection language with it.
  t("J3: the public hero is a GROUP and carries the fill",
    [/role="group"/.test(heroPub), /layoutId="hero-tab-pill"/.test(heroPub), /rounded-full/.test(pubCls)],
    [true, true, true]);
  t("J3: the studio panel is a real TABLIST and carries the underline",
    [/role="tablist"[\s\S]{0,200}?aria-label="Hero tabs"/.test(heroStudio),
      /aria-controls="hero-tab-edit-panel"/.test(heroStudio), /border-b-2/.test(studioCls)],
    [true, true, true]);
  t("J3: …and the panel does NOT wear the fill, which is what C-20 forbids for a tablist",
    /rounded-full/.test(studioCls), false);

  // J4 · SELECTION IS CARRIED BY COLOUR AND THE RULE, NOT BY WEIGHT. The hero is 500 throughout;
  // the panel used to bump the selected tab to 500 from a 400 rest, which is a third signal the
  // hero does not have. Neither branch may set a weight now — it lives in the shared base.
  const branches = /role="tab" [\s\S]{0,900}?\? "([^"]*)" : "([^"]*)"/.exec(heroStudio);
  t("J4: the selected/rest branches were found", Boolean(branches), true);
  t("J4: neither branch sets a font weight — selection is the underline plus the ink step, as on the hero",
    [branches?.[1], branches?.[2]].map((b) => /\bfont-(?:normal|medium|semibold|bold)\b/.test(b ?? "")),
    [false, false]);
}

/* ---- C6 · THE GROUND IS THE CANVAS PANE'S, AND `.canvas-surface` MUST NOT COME BACK -------
 * The old rule died reduced to `background-color: transparent; border: 0`, where NEITHER
 * declaration did anything alone: nothing else painted that element, and `border: 0` existed only
 * to cancel a `border` utility on the same element. Two declarations fighting to reach the browser
 * default, neither wrong on its own — which is how it survived.
 * THE GROUND IS ON THE PANE, NOT THE CARD'S WRAPPER, and the first attempt got that wrong. The
 * card is cream-50 and sat on a cream-50 pane at contrast 1.00, the SAME COLOUR, leaving a 1px @
 * 8% hairline that the 0.646 canvas scale renders at 0.646px as its only edge. Painting the
 * card's own wrapper tinted a box that hugs the scaled card and stops at its edge, so the tone
 * ended AT the card instead of filling the surface it sits on. Cream-100 on the pane measures 1.05.
 * IT IS A PROP AND NOT AN EDIT TO THE SHELL because blog is the other consumer and its canvas
 * holds the public article measure. The default is blog's existing cream-50, so silence stays the
 * neutral answer rather than the case study's. */
{
  const panel = code("components/studio/SectionsEditPanel.tsx");
  const shell = code("components/studio/ThreePaneShell.tsx");
  const blog = code("components/studio/BlogBlocksEditPanel.tsx");
  const pane = /className="case-study canvas-static([^"]*)"/.exec(panel)?.[1] ?? "";

  t("C6: the canvas pane's class list was found — nothing below is a vacuous pass",
    pane !== "", true);
  t("C6: the card's own wrapper paints NO ground — the tone would stop at the card",
    /\bbg-(?:cream|canvas|ink)/.test(pane), false);
  t("C6: …and the border utility that `border: 0` used to cancel is still gone",
    /\bborder\b/.test(pane), false);
  t("C6: the ground is passed to the shell, so it fills the whole pane and not a box inside it",
    /canvasGround="bg-cream-100"/.test(panel), true);
  t("C6: the shell applies it to the canvas COLUMN, bar included, not just the scroll region",
    /flex min-w-0 min-h-0 flex-1 flex-col lg:overflow-hidden \$\{canvasGround\}/.test(shell), true);

  /* THE DEFAULT IS THE ASSERTION THAT PROTECTS BLOG. `fitThresholdPx` is required precisely
   * because silence there meant inheriting blog's breakpoint — a wrong answer. Here silence must
   * yield what both panes already rendered, so the default is cream-50 and blog passes nothing. */
  t("C6: the shell defaults to cream-50, so a consumer that says nothing gets the neutral ground",
    /canvasGround = "bg-cream-50"/.test(shell), true);
  t("C6: …and blog says nothing, so its article-measure canvas is untouched",
    /canvasGround/.test(blog), false);

  t("C6: NO `.canvas-surface` rule anywhere — a rule here is what let the last split hide",
    /\.canvas-surface\s*\{/.test(globals), false);
  t("C6: …and globals declares no background for the canvas pane at all",
    /\.canvas-static\s*\{/.test(globals), false);

  /* `.canvas-static .reveal-card` is UNRELATED and stays — it suppresses the in-view reveal
   * because the canvas is a static panel. Asserted so a later sweep for "canvas rules" that reads
   * the two names as one family cannot take it out with them. */
  t("C6: the reveal-suppression rule survives, which is a different concern entirely",
    /\.canvas-static \.reveal-card\s*\{/.test(globals), true);
}

/* ---- C7 · THE PANE MAKES ROOM FOR THE RING IT WAS CLIPPING -----------------------------------
 * `.section-card`'s hairline is `box-shadow: 0 0 0 1px` — spread, no offset — so it extends 1px
 * OUTSIDE the border box. The card's top edge sat exactly on the pane's, measured `cardTop -
 * paneTop` = 0, so the ring drew at -0.65 and `overflow-hidden` cut it. That reads as a SLASHED
 * top border, not a missing one, which is why it looked like a shadow bug rather than a spacing
 * one.
 * 1px IS DERIVED. The ring renders at 1px times the scale and the scale is capped at 1, so one
 * unscaled pixel covers it at every canvas width — verified at 0.646 (clearance 0.354) and at
 * 0.836 (clearance 0.164), the widest the ring gets in practice.
 * THE BOTTOM IS PADDING, NOT THE CARD'S MARGIN, and that distinction is the whole fix. The card
 * declares `margin-bottom: 28px`, but `.container-x` has padding-inline only — no padding-bottom,
 * no border — so that margin COLLAPSES straight through and out of `offsetHeight`. Measured, the
 * gap below the card was -0.19px, never the 18.09 that 28 times the scale would give. Padding on
 * the pane cannot collapse, and sitting outside the transform it is a true 2rem at every scale
 * rather than a shrinking one. */
{
  const panel = code("components/studio/SectionsEditPanel.tsx");

  t("C7: the pane reserves the ring's own width at the top",
    /className="case-study canvas-static[^"]*\bpt-px\b/.test(panel), true);
  t("C7: …and 2rem below the card",
    /className="case-study canvas-static[^"]*\bpb-8\b/.test(panel), true);
  t("C7: both are folded into the DRIVEN height, or the height would eat the padding",
    /surface\.offsetHeight \* next \+ CANVAS_PAD_TOP \+ CANVAS_PAD_BOTTOM/.test(panel), true);
  t("C7: the top constant is the 1px the ring needs, stated as a number not a guess",
    /const CANVAS_PAD_TOP = 1;/.test(panel), true);
  t("C7: …and the bottom constant is 2rem in px, outside the transform so it does not scale",
    /const CANVAS_PAD_BOTTOM = 32;/.test(panel), true);

  /* THE CARD'S OWN MARGIN IS UNTOUCHED — it is shared with the public route, where it does not
   * collapse and does real work between stacked sections. Changing it to fix a studio clip would
   * have moved every section gap on the live page. */
  t("C7: `.section-card`'s shared margin-bottom is untouched — the public page stacks on it",
    /margin-bottom: var\(--section-gap\);/.test(globals), true);
}

/* ---- C8 · THE SCROLLBAR HAIRLINE ------------------------------------------------------------
 * Modelled on studio-motion's exists / scoped / not-global triple rather than on studio-cascade,
 * which GENUINELY DOES NOT APPLY here and is worth saying rather than leaving implied. That suite
 * arbitrates a Tailwind utility losing to an unlayered element rule; its parser accepts bare tag
 * names only (studio-cascade.mjs:114), and NO TAILWIND UTILITY TARGETS A SCROLLBAR PSEUDO-ELEMENT,
 * so there is no race for it to referee. Widening it would mean inventing a second mechanism, not
 * extending the existing one. */
{
  /* ANCHORED ON THE COMMENT'S OPENING `/*`, NOT ON THE TEXT INSIDE IT, and the first draft was
   * not — it started the slice at "STUDIO SCROLLBARS", which sits INSIDE the banner comment, so
   * the opening delimiter was outside the slice and the comment-stripper had nothing to match.
   * Every sentence of the prose then parsed as CSS, and two assertions failed on their own
   * documentation. That is the comment trap for the SEVENTH time in this repo, committed here in
   * the very gate written to catch a scrollbar regression. */
  const sb = /\/\*[\s\S]{0,120}?STUDIO SCROLLBARS[\s\S]*$/.exec(globals)?.[0] ?? "";
  const sbCode = sb.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors = [...sbCode.matchAll(/([^{}]+?)\s*\{/g)]
    .map((m) => m[1].trim().replace(/\s+/g, " "))
    .filter((x) => x && !x.startsWith("@"));

  t("C8: the scrollbar block was found — nothing below is a vacuous pass", sb !== "", true);
  t("C8: 6px, the floor below which a thumb is a target you miss",
    /::-webkit-scrollbar \{\s*width: 6px;\s*height: 6px;/.test(sb), true);
  t("C8: no track and no buttons — there is no trough, which is the whole defect on ink",
    /scrollbar-track,[\s\S]*?scrollbar-corner \{\s*background: transparent/.test(sb)
      && /scrollbar-button \{\s*display: none/.test(sb), true);

  /* THE FENCE IS THE LOAD-BEARING ASSERTION. Chrome supports `scrollbar-width`, and setting it
   * DISCARDS every ::-webkit-scrollbar rule on the element — measured, webkit alone renders 6px
   * while `scrollbar-width: thin` + webkit renders 11px and `scrollbar-color` + webkit renders 15.
   * The contract's own CSS writes both, so an unfenced standard property silently reverts the
   * whole design to a platform bar. This is the regression that would look like nothing changed. */
  t("C8: the standard properties are FENCED behind @supports not selector(::-webkit-scrollbar)",
    /@supports not selector\(::-webkit-scrollbar\) \{/.test(sb), true);
  {
    const fenceAt = sbCode.indexOf("@supports not selector(::-webkit-scrollbar)");
    const outsideFence = fenceAt >= 0 ? sbCode.slice(0, fenceAt) : sbCode;
    t("C8: …and NEITHER `scrollbar-width` NOR `scrollbar-color` appears outside it — in Chromium either one reverts the bar to 11px or 15px",
      /scrollbar-(width|color)\s*:/.test(outsideFence), false);
  }

  /* THE GUTTER. Styling html's own scrollbar moves `scrollbar-gutter: stable`'s reserved width
   * from 15 to 6 and documentElement.clientWidth by 9px, which `usePageWidthMin` reads — #235's
   * discrepancy re-opened by a cosmetic change. `.studio-chrome` cannot reach html, so the scope
   * IS the protection; these assert nothing widened it. */
  t("C8: the block declares selectors at all — an empty parse would pass every check below",
    selectors.length >= 6, true);
  t(`C8: EVERY selector is .studio-chrome-scoped — the document scroller is excluded BY the scope${
      selectors.filter((x) => !x.startsWith(".studio-chrome")).length
        ? ` — stray: ${selectors.filter((x) => !x.startsWith(".studio-chrome")).join(" | ")}` : ""}`,
    selectors.filter((sel) => !sel.split(",").every((one) => one.trim().startsWith(".studio-chrome"))), []);
  /* `.studio-chrome *` IS scoped and must not be read as the bare universal selector — the first
   * draft's regex flagged it, which would have forced the Firefox fence to be written worse to
   * satisfy a gate that was wrong. */
  t("C8: no BARE `html`, `:root` or `*` — that is the gutter, and every studio threshold rides on it",
    selectors.some((sel) => /^(html|:root|\*)\b/.test(sel)), false);
  t("C8: `scrollbar-gutter: stable` on html is untouched, and still on line 222",
    globals.split("\n")[221].trim(), "scrollbar-gutter: stable;");

  /* THE INK RULE TARGETS THE ELEMENT, NOT ITS DESCENDANTS, and that is a measured requirement.
   * The sidebar CONTAINS a second scroller — the horizontal nav row — which scrolls only below
   * `lg`, where the sidebar is bg-cream-100 rather than bg-ink-950. A descendant selector puts a
   * white thumb on a cream ground at exactly the widths where that row is the one scrolling. */
  t("C8: the ink rule is on #studio-sidebar ITSELF, never its descendants",
    /\.studio-chrome #studio-sidebar::-webkit-scrollbar-thumb/.test(sb)
      && !/#studio-sidebar [^:{,]*::-webkit-scrollbar/.test(sb), true);
  t("C8: …and that id still exists on the element the rule names",
    /id="studio-sidebar"/.test(code("components/studio/StudioSidebar.tsx")), true);

  /* THE ALPHAS, WHICH studio-tokens CANNOT SEE. Its regex strips the opacity modifier
   * non-capturing (studio-tokens.mjs:83-85) and it scans TSX utilities, not authored CSS, so both
   * of these are outside it. Asserted here rather than left as a silent gap.
   * THE TWO SIDES DO NOT SHARE AN ALPHA ON PURPOSE — the luminance curve is not symmetric, so
   * equal alphas would not give equal separation. Tuned until the MEASURED separation matched:
   * 1.63 on ink, 1.64-1.65 on the three creams. The relation is the separation, not the number. */
  t("C8: the cream thumb is ink-950 at the studio's own hairline alpha, resolved through the token",
    /color-mix\(in oklch, var\(--color-ink-950\) 22%, transparent\)/.test(sb), true);
  t("C8: …and its base token is declared, which studio-tokens cannot check for authored CSS",
    /--color-ink-950\s*:/.test(globals) && /--color-ink-400\s*:/.test(globals), true);
  t("C8: the ink thumb is white/18 at rest and white/40 on hover — 34 measured 2.99 and missed 3:1",
    /white 18%, transparent\)/.test(sb) && /white 40%, transparent\)/.test(sb), true);
  t("C8: …and 34% is gone rather than left beside its replacement",
    /white 34%/.test(sb.replace(/\/\*[\s\S]*?\*\//g, "")), false);
}

/* ---- C9 · THE BOARD -------------------------------------------------------------------------
 * Two changes: a case study opens on the EDITOR, and the Board becomes fluid columns of elevated
 * cards. Both are asserted here because both are one-line reversions away. */
{
  const panel = code("components/studio/SectionsEditPanel.tsx");
  const mini = code("components/studio/SectionMini.tsx");

  /* THE DEFAULT AND THE ORDER AGREE, AND THAT IS THE ASSERTION. Opening on the Board showed the
   * SHAPE when what an author came to do is write. The toggle's tuple order is the DOM order, so
   * a control reading "Board | Editor" beside a panel that opens on Editor is the same defect in
   * a second place. */
  t("C9: a case study opens on the EDITOR, not the Board",
    /useState<Selection>\("details"\)/.test(panel), true);
  t("C9: …and the toggle reads Editor first, so the control agrees with the default",
    /\[\["editor", "Editor"\], \["board", "Board"\]\]/.test(panel), true);

  /* FLUID COLUMNS. `auto-fill` adds a column when the pane grows rather than capping at a number
   * someone picked, and the 300px floor is the TITLE's: measured, the six long real titles need a
   * 222px title column, and with the arrows at the card foot the title gets `card - 67`. A
   * smaller floor lets the grid create a track the two-line clamp cannot survive. */
  t("C9: the grid is fluid — auto-fill, not a breakpoint ladder",
    /grid-template-columns:repeat\(auto-fill,minmax\(300px,1fr\)\)/.test(panel), true);
  t("C9: …and no fixed column count survives beside it",
    /\b(sm|md|lg|xl):grid-cols-\d/.test(panel), false);
  t("C9: the card's height is FIXED, so a wider pane cannot make the board taller",
    /h-\[320px\] max-w-\[340px\]/.test(panel), true);

  /* HAZARD 26. There is no border SHORTHAND on this element at all — `border-0` plus one left
   * declaration — so there is no shorthand/longhand pair for sheet order to arbitrate.
   * studio-border-race confirms it independently; this asserts the construction that makes it
   * true rather than trusting the other suite to notice. */
  const cardCls = /data-board-card\s*\n\s*className=\{`([^`]*)`/.exec(panel)?.[1] ?? "";
  t("C9: the card's class expression was found — nothing below is a vacuous pass", cardCls !== "", true);
  t("C9: the card carries NO border shorthand — hazard 26 sidestepped by construction, not by care",
    /\bborder-\[?\d|\bborder\s|\bborder"/.test(cardCls.replace(/border-0|border-l-/g, "")), false);
  t("C9: …and the left edge is always 3px with only its COLOUR moving, so selection cannot reflow",
    /border-l-\[3px\]/.test(cardCls) && /border-l-accent-500/.test(cardCls)
      && /border-l-transparent/.test(cardCls), true);

  /* THE ELEVATION SCALE — THREE STEPS, THREE CONSUMERS. The contract's own guard: if only one
   * step is ever used, do not declare three. rest, hover and active all live on this card. */
  t("C9: the elevation scale is declared, scoped to .studio-chrome and named by role",
    /--studio-lift-rest:/.test(globals) && /--studio-lift-hover:/.test(globals)
      && /--studio-lift-active:/.test(globals), true);
  t("C9: …and ALL THREE have a consumer — a scale with one caller is the shape this repo has deleted three times",
    /--studio-lift-rest,/.test(panel) && /--studio-lift-hover,/.test(panel)
      && /--studio-lift-active,/.test(panel), true);

  /* THE HOVER DURATIONS. Three, not four — the contract's 150ms mark is byte-identical to
   * @theme's --duration-fast, and a second name for a value that has an honest one is what #258
   * refused for --ease-glide. */
  t("C9: three hover durations declared, each with a consumer",
    ["--studio-lift-t", "--studio-lift-follow", "--studio-lift-sheen"]
      .every((n) => new RegExp(`${n}:`).test(globals) && new RegExp(`${n},`).test(panel + mini)), true);
  t("C9: …and NO --studio-lift-mark, because --duration-fast is already exactly 150ms",
    /--studio-lift-mark/.test(globals), false);
  t("C9: …and no bare var() — every use carries its literal fallback, as studio-motion demands",
    /var\(\s*--studio-lift-[a-z-]+\s*\)/.test(panel + mini), false);

  /* THE MINIS. A mapped type, so a 17th kind is a compile error rather than a silent fallback —
   * the shape STATE records as having let videoEmbed.poster stay invisible for three PRs. */
  t("C9: the mini table is keyed by the UNION, not a Record with a fallback",
    /const MINI: \{ \[K in SectionBlockKind\]: \(\) => React\.ReactElement \} = \{/.test(mini), true);
  t("C9: …and it reads the kind directly rather than through a `??` default",
    /MINI\[kind\]/.test(mini) && !/MINI\[[^\]]*\]\s*\?\?/.test(mini), true);

  /* THE DEFERRED DEBT, PAID HERE BECAUSE IT WAS ASSIGNED HERE. The old comment deferred a
   * measured 3.49 eyebrow to "PR 7 restructures this board". */
  /* SCOPED TO THE BOARD'S OWN EYEBROW, and the first draft was not — it tested the whole file for
   * `tracking-eyebrow text-ink-600`, which `labelCls` also contains, so reverting the board to
   * ink-400 left it GREEN. That is #263's C4 in a third costume: an assertion that names one
   * element and matches any. Anchored on `section.eyebrow &&`, which appears once. */
  const boardEyebrow = /\{section\.eyebrow && \([\s\S]{0,220}?<\/span>/.exec(panel)?.[0] ?? "";
  t("C9: the board's eyebrow was found — nothing below is a vacuous pass", boardEyebrow !== "", true);
  t("C9: the board's eyebrow is ink-600 — the 3.49 AA failure deferred to this PR is paid",
    /text-ink-600/.test(boardEyebrow) && !/text-ink-400/.test(boardEyebrow), true);
  t("C9: …and the count pill is gone, because the chips ARE the count",
    /rounded-full border border-ink-950\/10 px-2 py-0\.5/.test(panel), false);

  /* REORDER. The handler is untouched — `dir` was always "previous/next index" rather than
   * "up/down" — so only the labels and the glyphs moved. The accessible names say EARLIER and
   * LATER rather than left and right, which stays true at one column as well as five. */
  t("C9: reorder still routes through the one moveSection choke point",
    /moveSection\(i, -1\)/.test(panel) && /moveSection\(i, 1\)/.test(panel), true);
  t("C9: …with earlier/later labels, which survive a one-column grid where left/right would not",
    /Move section \$\{name\} earlier/.test(panel) && /Move section \$\{name\} later/.test(panel), true);
  t("C9: …and the ends are DISABLED rather than absent, so the control never moves between cards",
    /disabled=\{i === 0\}/.test(panel) && /disabled=\{i === values\.sections\.length - 1\}/.test(panel), true);

  /* REDUCED MOTION. The rise and the sheen go; shadow, ground and colour are deliberately NOT in
   * any reduce rule, so the final state stays identical. A motion fix must not cost an affordance. */
  t("C9: reduce kills the card's rise and the ordinal's trail",
    /motion-reduce:hover:translate-y-0/.test(panel) && /motion-reduce:group-hover:translate-y-0/.test(panel), true);
  t("C9: …and hides the sheen outright, because a pass with no duration is a flash not an absence",
    /motion-reduce:hidden/.test(panel), true);
}

/* ---- C10 · THE OVERLAY FAMILY, AND NO RAW SHADOW LITERAL LEFT IN STUDIO --------------------
 * Seven copy-pasted literals across seven files, five distinct values, two of them already
 * drifted off the tiers they belonged to. #168 recorded the modal's as an exception; six sites
 * later it was a convention nobody had declared.
 * THEY ARE NOT THE LIFT STEPS, AND MEASURING IS WHAT SETTLED IT. Darkening against cream-100,
 * reach = blur+spread: modal 2.845/36, floating 2.530/20, popover 1.306/30 — against the card
 * scale's heaviest, lift-active at 1.584/20. Repointing the modal there would have cut its
 * darkening 44% and halved its reach. And every legacy literal uses rgb(60,45,30) where ink-950
 * is rgb(15,7,3), a distance of 65, with NO declared token closer than ink-800 at 20 — so the
 * literal ink stays rather than rounding every floating surface onto a token that is not it. */
{
  /* COMMENT-STRIPPED, AND I WROTE THIS BUG ONE PR AFTER FIXING IT IN F5. The drift assertions
   * below are ABSENCE checks, and the sites that changed carry comments NAMING the old values so
   * a reader can see what moved — so raw source contains `60,50,38` in prose forever and the
   * assertion fails on its own documentation. F5 was comment-stripped last PR for precisely this,
   * with a note explaining it. Reading that note did not stop me writing it again; the mutation
   * did. Absence assertions over source that documents what is absent MUST strip comments. */
  const studioSrc = studioFiles.map((f) => code(`components/studio/${f}`)).join("");

  t("C10: NO raw shadow literal survives anywhere in studio — that is the whole point of the sweep",
    (studioSrc.match(/shadow-\[0_/g) ?? []).length, 0);
  t("C10: the three overlay steps are declared, scoped to .studio-chrome and named by role",
    /--studio-lift-popover:/.test(globals) && /--studio-lift-floating:/.test(globals)
      && /--studio-lift-modal:/.test(globals), true);

  /* EVERY STEP HAS A CONSUMER. The modal has exactly one and that is declared on the token — a
   * modal is a distinct role, not a step someone might one day use. */
  ["popover", "floating", "modal"].forEach((role) => {
    t(`C10: --studio-lift-${role} has at least one consumer`,
      new RegExp(`--studio-lift-${role},`).test(studioSrc), true);
  });

  /* THE INK STAYS LITERAL, AND ASSERTING IT IS WHAT STOPS A LATER TIDY-UP FROM "FIXING" IT ONTO
   * ink-950 and shifting every floating surface in the studio by a distance of 65. */
  t("C10: the overlay steps keep rgb(60,45,30) — no token is within 20 of it",
    /--studio-lift-popover: 0 8px 30px rgba\(60, 45, 30, 0\.14\)/.test(globals), true);
  t("C10: …and the card steps keep ink-950, so the two families stay distinguishable",
    /--studio-lift-rest: 0 1px 2px oklch\(14% 0\.018 60/.test(globals), true);

  /* THE TWO DRIFTS ARE GONE. BoldToolbar carried the only 60,50,38 in the studio and the only
   * -18px spread; both are now the floating tier. Asserted as ABSENCE, because a drift returning
   * is exactly what this sweep exists to prevent. */
  t("C10: BoldToolbar's 60,50,38 ink is gone — it was the only one in the studio",
    /60,\s*50,\s*38/.test(studioSrc), false);
  t("C10: …and so is its -18px spread, the seventh value nobody had called a tier",
    /40px_-18px/.test(studioSrc), false);

  /* THE FALLBACKS EQUAL THE DECLARED VALUES, which is what studio-motion's C3 demands of the
   * motion tokens and is just as load-bearing here: a fallback that disagrees renders a second
   * shadow wherever the token fails to resolve. */
  t("C10: every overlay use carries a literal fallback — no bare var()",
    /var\(\s*--studio-lift-(popover|floating|modal)\s*\)/.test(studioSrc), false);
  t("C10: …and the floating fallback matches its declaration exactly",
    (studioSrc.match(/--studio-lift-floating,0_18px_40px_-20px_rgba\(60,45,30,0\.45\)/g) ?? []).length,
    (studioSrc.match(/--studio-lift-floating,/g) ?? []).length);
}

/* ---- C11 · THE TEMPLATE / CATEGORY ROW -------------------------------------------------------
 * Each label sits ABOVE its switch, and the two toggles share one line spread across it.
 * THE SPREAD NEEDED A WRAPPER, NOT A CLASS ON THE ROW, and measuring is what showed it. The row
 * has three children and the actions sit on `ml-auto`; an auto margin absorbs the free space
 * BEFORE justify-content is consulted, so `justify-between` on the row renders nothing — measured,
 * Category stayed at 72px — and removing `ml-auto` to make it bite drops Category in the CENTRE at
 * 393px. Neither is the drawing. A wrapper holding only the two toggles has two children, which is
 * the shape space-between was drawn for.
 * AND THE STACK IS WHAT MAKES THE SPREAD POSSIBLE. Beside its switch a toggle was ~193px wide, so
 * at the inspector's 313px the row wrapped into three lines. Stacked it is ~111px and two fit with
 * 59px between them. */
{
  const seg = code("components/studio/SegmentedToggle.tsx");
  const panel = code("components/studio/ProjectsEditPanel.tsx");

  t("C11: the toggle stacks its label above its switch",
    /<div className="flex flex-col items-start gap-1\.5">\s*<span className=\{labelCls\}>/.test(seg), true);

  /* THE NOTE KEEPS ITS OWN ROW BESIDE THE SWITCH. Under a bare flex-col it would drop BELOW the
   * switch, moving where "Save failed" and "needs github mode (dev)" appear — a behavioural change
   * smuggled inside a layout one. Driven in the fs-noop branch: note at top 24, switch at 38. */
  t("C11: …and the switch keeps a row with its note, so the note did not drop below the switch",
    /<div className="flex items-center gap-2">\s*<div\s*\n\s*role="group"/.test(seg), true);
  t("C11: the note is still the last child of that inner row, not a sibling of the label",
    /\{note && <span className="text-\[10px\] text-text-subtle">\{note\}<\/span>\}\s*<\/div>\s*<\/div>/.test(seg), true);

  t("C11: the two toggles share a wrapper that spreads them",
    /<div className="flex w-full items-start justify-between gap-3">/.test(panel), true);
  /* `w-full` RATHER THAN `flex-1`. The row is flex-wrap inside a 313px inspector; a full-width
   * child takes its own line and the actions wrap beneath exactly as before. `flex-1` would share
   * the line and squeeze both toggles into 179px. */
  t("C11: …and it is w-full, so the actions still wrap beneath rather than sharing the line",
    /flex w-full items-start justify-between/.test(panel) && !/flex flex-1 items-start justify-between/.test(panel), true);

  /* THE ROW ITSELF DID NOT GAIN justify-between, because it would render nothing there and a class
   * that provably does nothing is the shape this repo has deleted four times. */
  t("C11: the row itself did NOT gain an inert justify-between",
    /flex flex-wrap items-center gap-3 border-b border-ink-950\/12 bg-cream-200 px-4 py-2\.5/.test(panel), true);

  /* #164's PRESERVED QUIRK IS UNTOUCHED. `onChange?.(prev)` fires only in the fs-noop revert
   * branch, never in the network-failure else/catch. Its header says a change there "should be a
   * decision, not a cleanup" — and it sits directly above the JSX this PR edited, which is the
   * trap. Asserted so a later tidy-up cannot quietly symmetrise it. */
  t("C11: #164's asymmetric revert survives — onChange fires in the fs branch only",
    (seg.match(/onChange\?\.\(prev\)/g) ?? []).length, 1);
  t("C11: …and the two silent reverts stay silent",
    /setValue\(prev\);\s*setNote\("Save failed"\);/.test(seg), true);
}

/* ---- C12 · THE DETAILS CANVAS ----------------------------------------------------------------
 * The canvas renders `ProjectCard` ITSELF with draft values — #178's rule — and draws it in BOTH
 * states side by side, because the summary is invisible at rest. */
{
  const canvas = code("components/studio/DetailsCanvas.tsx");
  const card = code("components/sections/ProjectCard.tsx");

  t("C12: the canvas renders the PUBLIC component, not a lookalike",
    /import ProjectCard from "@\/components\/sections\/ProjectCard"/.test(canvas)
      && /<ProjectCard project=\{project\}/.test(canvas), true);
  t("C12: …and draws BOTH states, because the summary lives only in the hover veil",
    /\["rest", "At rest"[\s\S]{0,120}?\["hover", "On hover"/.test(canvas), true);

  /* THE DRAWN HOVER MUST CHANGE EXACTLY WHAT THE REAL ONE CHANGES. `:hover` cannot be set from
   * script, so the second card is drawn by re-asserting the hover declarations against a data
   * attribute — and the failure mode is a hover property added publicly and not mirrored, after
   * which the canvas silently previews something the page does not do. The two property SETS are
   * compared rather than a hand-written list, so a new property fails here on the day it lands.
   * Finding them by hand is exactly what went wrong first: the initial block mirrored four rules
   * and missed `--gl` and the rail dot. */
  /* COMPARED BY TARGET, NOT BY PROPERTY SET, AND THE FIRST VERSION WAS THE LOOSER ONE. It
   * gathered every property each side declares and diffed those — which passes when a whole rule
   * goes missing, because `opacity` and `transform` are each declared by more than one rule.
   * Deleting the rail-dot mirror left the property set identical and the gate green; the mutation
   * is what showed it. What actually matters is that every ELEMENT the public hover reaches has a
   * drawn counterpart, so the targets are what get compared. */
  /* COMMENT-STRIPPED, AND THAT IS THE TENTH FIRING OF THIS TRAP IN THIS REPO. The prose above
   * these rules NAMES `.work-card` and the attribute selector while explaining them, so a parser
   * over raw CSS reads the explanation as selectors — it produced targets like "both easy to miss
   * precisely because neither is the thing you are looking at". Every previous firing was the
   * same shape and each fix was local; the durable form is that ANY parser over source whose
   * comments discuss the thing being parsed must strip them first.
   * `:focus-visible` SIBLINGS ARE DROPPED, and that is correct rather than convenient: the public
   * rules list hover and focus-visible together in one declaration block, so they are the same
   * declarations reached two ways. The drawn state mirrors the hover half by design — a drawn
   * card has no focus — so counting the focus selectors would demand mirrors for a state the
   * canvas cannot enter. */
  const cssCode = globals.replace(/\/\*[\s\S]*?\*\//g, "");
  const targetsOf = (re) => {
    const out = new Set();
    for (const m of cssCode.matchAll(re)) {
      for (const sel of m[0].slice(0, m[0].indexOf("{")).split(",")) {
        const raw = sel.trim();
        if (/:focus-visible/.test(raw)) continue;
        const t = raw.replace(/^\.studio-chrome\s+/, "")
          .replace(/\.work-card:hover\s*/, "").replace(/\[data-card-state="hover"\]\s*/, "")
          .replace(/^\.work-card$/, "").trim();
        out.add(t === "" ? "(the card itself)" : t);
      }
    }
    return [...out].sort();
  };
  const pubT = targetsOf(/\.work-card:hover[^{]*\{[^}]*\}/g);
  const drawnT = targetsOf(/\[data-card-state="hover"\][^{]*\{[^}]*\}/g);
  t("C12: both hover blocks parse to real targets — an empty parse would pass the diff below",
    pubT.length >= 5 && drawnT.length >= 5, true);
  t(`C12: every element the public hover reaches has a drawn counterpart${
      pubT.filter((x) => !drawnT.includes(x)).length
        ? ` — missing: ${pubT.filter((x) => !drawnT.includes(x)).join(" | ")}` : ""}`,
    pubT.filter((x) => !drawnT.includes(x)), []);

  /* EVERY drawn rule scoped, not just one. The first version asked whether `.studio-chrome
   * [data-card-state=` appeared ANYWHERE, which one scoped rule satisfies while its siblings leak. */
  const drawnRules = [...cssCode.matchAll(/[^{}\n]*\[data-card-state="hover"\][^{]*\{/g)].map((m) => m[0]);
  t("C12: the drawn rules were found — nothing below is vacuous", drawnRules.length >= 5, true);
  t("C12: …and EVERY one is .studio-chrome-scoped, so the public card is untouched",
    drawnRules.filter((r) => !r.trim().startsWith(".studio-chrome")).map((r) => r.trim().slice(0, 60)), []);

  /* THE CARD WIDTH IS MEASURED, NOT DERIVED. The container arithmetic gives 600 — 1280 capped,
   * 24 padding a side, `(1232-32)/2`. The page gives 516, because the grid is inside
   * `.section-card`, which takes its own margin and then 52px of padding a side. A preview at 600
   * would reflow the veil body the author is editing, at a width no browser produces. */
  t("C12: the card is drawn at the MEASURED slot width, not the derived one",
    /const CARD_W = 516;/.test(canvas), true);

  /* THE OPTIMIZER SEAM. A committed hero optimizes; the draft proxy and a blob do not — the
   * optimizer's own refetch of the proxy 401s, and the browser sees its 400. One optional prop,
   * defaulting to undefined so the public render is byte-identical. */
  t("C12: ProjectCard takes an optional unoptimized, defaulting to undefined",
    /unoptimized\?: boolean;/.test(card) && /unoptimized=\{unoptimized\}/.test(card), true);
  t("C12: …and the canvas sets it only when the src is not a plain public path",
    /const unoptimized = src !== heroImage;/.test(canvas), true);

  /* TWO FIELDS DO NOT RENDER AND THAT IS STATED. `category` gets the filter row because it has a
   * real public consequence; `type` gets nothing, because it renders nowhere. */
  t("C12: category's preview is the filter row",
    /FILTERS\.map/.test(canvas) && /Filter row/.test(canvas), true);
  t("C12: …and NO surface is invented for `type`",
    /facts: \{ role: "", type: "", platform, timeline: "" \}/.test(canvas), true);
}

/* ---- C13 · THE BESPOKE THREE-PANE — HAZARD 29 --------------------------------------------
 * boat-crest is hand-built, `BESPOKE_SLUGS` gates the fetch, and opening it showed "the details
 * strip and a read-only notice, AND NOTHING ELSE" — on the FIRST slug alphabetically, the
 * canonical example everywhere in this repo. It read as a broken editor rather than a different
 * kind of study, and it had already cost coverage once. */
{
  const panel = code("components/studio/SectionsEditPanel.tsx");
  const projects = code("components/studio/ProjectsEditPanel.tsx");
  const rail = code("components/studio/SectionsRail.tsx");

  /* DERIVED FROM `BESPOKE_SLUGS`, NEVER A SECOND LIST. A second list of bespoke slugs is the
   * derivation-keyed-on-a-list failure E1b already produced once. */
  t("C13: bespoke is read from BESPOKE_SLUGS, not re-listed",
    /BESPOKE_SLUGS\.has\(slug\)/.test(projects)
      && !/\["boat-crest"\]/.test(panel) && !/\["boat-crest"\]/.test(rail), true);

  /* ONE SHELL, NOT A SECOND EDITOR. "A case study has ONE editor at ONE URL" is locked, and the
   * `[slug]/body` route is what a second surface for the same content becomes. */
  t("C13: a bespoke study goes through the SAME shell, with the sections machinery suppressed",
    /bespoke=\{bespoke\}/.test(projects) && /bespoke\?: boolean;/.test(panel), true);
  t("C13: …and it is handed an empty sections array rather than a faked load",
    /sections=\{bespoke \? \[\] : \(sectionsData \?\? \[\]\)\}/.test(projects), true);

  /* NO BOARD, SO NO TOGGLE. A control that cannot do anything is worse than an absent one —
   * ABSENT, not disabled, because a disabled toggle still asserts a Board exists. */
  t("C13: no Editor|Board toggle on a bespoke study",
    /\{!bespoke && \(\s*<>/.test(panel), true);
  t("C13: …and no Board either, since BESPOKE_SLUGS gates the write path its Add button would need",
    /\{!bespoke && showBoard && boardNode\}/.test(panel), true);

  /* ONE SAVE, NOT TWO. #200 INVERTED: its defect was two buttons claiming to be the same action;
   * this would be one button naming an object with nothing behind it. The write path would not
   * have refused it honestly — only `delete-entry` carries a BESPOKE_SLUGS guard, and the
   * serializer's refusal surfaces as a generic "Save failed. Try again.". */
  t("C13: the sections save bar is absent on a bespoke study — it has no sections draft to commit",
    /\{!bespoke && \(\s*<footer/.test(panel), true);

  /* THE ZERO STATE IS THE WHOLE HAZARD. An empty list under a count heading is what a broken
   * fetch looks like, so the rail states its zero and says why. */
  t("C13: the rail states `none` rather than a bare 0 under a count heading",
    /bespoke \? "Sections \\u00b7 none"/.test(rail) || /bespoke \? "Sections · none"/.test(rail), true);
  t("C13: …and the notice lives in the RAIL, where an author looks for sections",
    /Hand-built case study/.test(rail) && !/Hand-built case study/.test(projects), true);
  t("C13: …and it says nothing FAILED, which is the difference the hazard turns on",
    /Nothing failed to load/.test(rail), true);

  /* THE SEARCH COPY WAS REACHABLE ON ANY EMPTY STUDY, not just this one. "No sections match that
   * search" answered three different questions — none exist, none match, none at all. */
  t("C13: the three zero states are separated, so an empty study is not told about a search",
    /sections\.length === 0\s*\?\s*"No sections yet/.test(rail), true);

  t("C13: the study announces what it is in the crumb row, before anyone looks for what is missing",
    /\{bespoke && \([\s\S]{0,220}?Hand-built/.test(panel), true);
}

/* ---- C14 · THE LOADING WINDOW IS NOT A PAGE --------------------------------------------------
 * MEASURED on the click path an author actually takes — from the index into a study: the framed
 * fallback appeared at 426ms and the shell at 695ms, so **269ms of a completely different page**,
 * with the details form rendered in a bordered panel and then moving into the inspector. It reads
 * as the old editor flashing up because it WAS the old editor.
 * PRE-EXISTING, NOT NEW. The guard evaluated identically before the Details arc; what changed is
 * that boat-crest stopped flashing, which made the contrast obvious.
 * AND THE OBVIOUS FIX WOULD HAVE BEEN WORSE. "Mount the shell early with `sections={[]}` and fill
 * it in" cannot work — `useDraftForm` is `useState(initial)`, so a form mounted empty IGNORES the
 * sections that arrive after and stays empty. That trades a flash for silent data loss. */
{
  const projects = code("components/studio/ProjectsEditPanel.tsx");
  const loadingReturn = /sectionsStatus !== "error" && \(sectionsStatus !== "loaded"[\s\S]{0,700}?\n  \}/.exec(projects)?.[0] ?? "";

  t("C14: the loading state returns before the panel branch — nothing below is a vacuous pass",
    loadingReturn !== "", true);
  t("C14: …and it renders NO details form, so nothing has to move when the shell arrives",
    /detailsNode/.test(loadingReturn), false);
  t("C14: …and NO panel frame, so the loading window is not a second page shape",
    /rounded-\[var\(--studio-radius-panel/.test(loadingReturn), false);
  t("C14: …and it announces itself, because a quiet state still has to reach a screen reader",
    /role="status" aria-live="polite"/.test(loadingReturn), true);

  /* AND NO HEIGHT FLOOR, WHICH IS A MEASUREMENT RATHER THAN A TIDY-UP. `min-h-[40vh]` looks like
   * what a loading box needs and was inert at every width driven: the layout's `min-h-screen`
   * gives the flex row a definite height, `<main>` stretches to it, and this `flex-1` child takes
   * the free space — 835px at 1440x900, 494 at 900x700, 335 at 1440x400, against floors of 360,
   * 280 and 160. It never bound once.
   * IT WAS ALSO NOT FREE. Tailwind v4 emits ONE stylesheet and the public home page loads that
   * chunk, so a studio-only arbitrary utility ships a rule to every visitor of the site. Verified
   * against the built bundle: dropping it returns the public CSS to byte-identical with `1f16ee6`.
   * The general rule this stands for — an arbitrary value used in one studio branch costs the
   * public bundle a rule, so it has to earn its place by actually applying.
   * SPELLING THE CLASS OUT IS SAFE *HERE* AND NOWHERE ELSE. globals.css carries
   * `@source not "../ralph"`, so this suite's class-name literals never reach the scanner. A
   * component comment has no such exclusion, and the first draft of this fix proved it — the
   * comment explaining the deletion re-emitted the rule and the bundle hash did not move. Do not
   * copy this phrasing into a .tsx. */
  t("C14: …and it sets no height floor, because `flex-1` already fills and a floor never bound",
    /min-h-/.test(loadingReturn), false);

  /* ERROR KEEPS THE PANEL, and that is the distinction rather than a leftover: a failed load is
   * persistent and actionable — it needs a frame, a retry, and the details still editable. A slow
   * load is none of those. It is also what keeps E1b's subject alive honestly. */
  t("C14: the error state still gets the framed panel, with its retry and the details form",
    /sectionsStatus !== "error"/.test(projects)
      && /Could not load the sections\./.test(projects) && /Try again/.test(projects), true);
  t("C14: …and the loading copy is gone from that panel, since only error reaches it now",
    (projects.match(/Loading sections…/g) ?? []).length, 1);
}

console.log(`\nstudio-ink result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
