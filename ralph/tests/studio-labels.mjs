// THE LABEL-SCALE GATE — two steps, named by role, and nothing ad-hoc between them.
// Run: node ralph/tests/studio-labels.mjs
//
// ---- WHAT THIS HOLDS -------------------------------------------------------------------
//
// The studio has TWO label steps and they are chosen by ROLE, not by eye:
//   labelCls       a FIELD label             12px / 700 / ink-600
//   groupLabelCls  a nested-card GROUP head  10px / 400 / ink-600
//
// Before this gate there were 45 hand-written eyebrow strings across 15 files and NOTHING
// stopped a 46th. The rule they drifted from is not "use a constant" — it is that the smaller
// step means ONE LEVEL IN. Six sites carried 10px and all six sat inside the identical
// container, so the size was a hierarchy somebody built; two more carried 10px in a plain
// tabpanel and were simply drift. A gate that pinned a COUNT could not tell those apart.
//
// ---- SO THE GROUP RULE IS DERIVED, NOT LISTED ------------------------------------------
//
// B1 finds the nested-card CONTAINER SIGNATURE in the source and asserts that any eyebrow
// heading inside one uses `groupLabelCls`. That is the `studio-cascade` shape: derive the
// condition, do not enumerate today's instances. A seventh nested card gets the rule for free,
// and a group heading written by hand inside one fails on arrival.
//
// ---- AND THE EXCEPTIONS ARE BY SHAPE, WITH THEIR REASON --------------------------------
//
// Four eyebrow strings survive the sweep because they are NOT field labels. Each is recognised
// by its own shape rather than by file and line, so the exemption describes a ROLE and cannot
// quietly widen into "anything left over":
//   badge   `rounded-full`      a pill, not a label      (CaseStudyIndex's "Bespoke")
//   nav     StudioSidebar       a nav group heading
//   accent  `text-accent-600`   an accent ordinal        (ProcessEditPanel's "Stage n")
//   content renders a data expression, not literal chrome (the board card's section.eyebrow)
// The first three MEASURE ABOVE AA on their own grounds (6.25, 7.10, 5.45). The fourth does
// NOT — 3.49 — and is recorded in source with the number rather than fixed, because
// recolouring a preview of AUTHORED CONTENT is a design decision and PR 7 restructures that
// board. A gate that let it pass silently would be the thing this suite exists to prevent.
import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const files = [];
const walk = (rel) => {
  for (const e of readdirSync(new URL(`../../${rel}`, import.meta.url), { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${rel}/${e.name}`);
    else if (e.name.endsWith(".tsx")) files.push(`${rel}/${e.name}`);
  }
};
walk("components/studio");
walk("app/studio");
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

/* ================================================ A. THE SCALE ITSELF
 * Both steps declared exactly once, in one file, with their values pinned — so moving a step is
 * a deliberate edit here rather than a drift somewhere else. */
const fields = read("components/studio/blocks/fields.tsx");
t("A1: `labelCls` is declared exactly once",
  (fields.match(/export const labelCls =/g) ?? []).length, 1);
t("A2: `groupLabelCls` is declared exactly once",
  (fields.match(/export const groupLabelCls =/g) ?? []).length, 1);
t("A3: the FIELD step is 12px / 700 / ink-600",
  /export const labelCls =\s*\n?\s*"font-label text-\[12px\] font-bold uppercase tracking-eyebrow text-ink-600";/.test(fields), true);
t("A4: the GROUP step is 10px / ink-600 — one level in, and NOT bold, so the two steps stay distinct",
  /export const groupLabelCls =\s*\n?\s*"font-label text-\[10px\] uppercase tracking-eyebrow text-ink-600";/.test(fields), true);
// A5 · the size literal stays LOCAL. `--text-eyebrow` is read by 16 non-studio files, so sizing
// the studio label through the token would move the canvas and two public pages. The two values
// coincide at 12px today; they are kept independent precisely so that stays a coincidence.
t("A5: neither step reaches for the shared `--text-eyebrow` token",
  /export const (labelCls|groupLabelCls) = "text-eyebrow/.test(fields), false);

/* ================================================ B. THE GROUP RULE, DERIVED
 * The nested-card signature, taken from source rather than from a list of sites. Any eyebrow
 * heading inside such a container must be the GROUP step. */
const NESTED_CARD = /rounded-\[var\(--studio-radius-control,4px\)\][^"]*border[^"]*bg-cream-100[^"]*p-3\b/;
const EYEBROW_LITERAL = /className="[^"]*uppercase tracking-eyebrow[^"]*"/g;

const groupViolations = [];
for (const f of files) {
  const src = read(f);
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (!NESTED_CARD.test(line)) return;
    // the heading is the next non-empty markup line inside the card
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const l = lines[j];
      if (!/uppercase tracking-eyebrow/.test(l)) continue;
      if (/groupLabelCls/.test(l)) break;         // correct
      groupViolations.push(`${f}:${j + 1}`);
      break;
    }
  });
}
if (groupViolations.length) {
  console.log("\n  A HEADING INSIDE A NESTED CARD IS WRITTEN BY HAND:\n");
  for (const v of groupViolations) {
    console.log(`    ${v}`);
    console.log(`      This span sits inside the nested-card container`);
    console.log(`      (rounded-control + border + bg-cream-100 + p-3), so it is a GROUP heading.`);
    console.log(`      Use {groupLabelCls} — the 10px step means "one level in", and writing it`);
    console.log(`      by hand is how the six original sites drifted apart.\n`);
  }
}
t(`B1: every eyebrow heading inside a nested card uses \`groupLabelCls\`${groupViolations.length ? " — see above" : ""}`,
  groupViolations, []);

/* ================================================ C. NOTHING AD-HOC SURVIVES
 * Every remaining hand-written eyebrow string must match one of the four ROLE shapes. Reports
 * the file and the site, never a count. */
const isException = (line, file) =>
  /rounded-full/.test(line) ||                    // a badge/pill
  file.endsWith("StudioSidebar.tsx") ||           // nav group heading
  /text-accent-600/.test(line) ||                 // the accent ordinal
  /text-ink-400/.test(line) && /truncate/.test(line); // the board card's authored section.eyebrow

const adhoc = [];
for (const f of files) {
  const src = read(f);
  if (f.endsWith("blocks/fields.tsx")) continue;  // the declarations themselves
  src.split("\n").forEach((line, i) => {
    if (!EYEBROW_LITERAL.test(line)) return;
    EYEBROW_LITERAL.lastIndex = 0;
    if (isException(line, f)) return;
    // help text keeps its own string on purpose, but must not be ink-400 (it failed AA)
    if (/text-ink-600/.test(line)) return;
    adhoc.push(`${f}:${i + 1}`);
  });
}
if (adhoc.length) {
  console.log("\n  AD-HOC EYEBROW LABELS — a hand-written label string outside the scale:\n");
  for (const a of adhoc) {
    console.log(`    ${a}`);
    console.log(`      A field label uses {labelCls}; a heading inside a nested card uses`);
    console.log(`      {groupLabelCls}. If this is neither — a badge, nav chrome, an accent`);
    console.log(`      ordinal or authored content — it needs its ROLE stated, not a new string,`);
    console.log(`      and its colour measured against its own ground (ink-400 is 3.49 on`);
    console.log(`      cream-50, below the 4.5 AA floor for 12px text).\n`);
  }
}
t(`C1: no ad-hoc eyebrow label survives in the studio${adhoc.length ? " — see above" : ""}`, adhoc, []);

/* ================================================ D. THE PUBLIC SIDE IS UNTOUCHED
 * The token is shared. This arc may never move it, and the one public eyebrow is out of scope
 * by definition — a diff there is a defect, not a sweep. */
const tokenDecl = read("app/globals.css").match(/--text-eyebrow:\s*([^;]+);/);
t("D1: `--text-eyebrow` is still 0.75rem — the studio never sizes itself through the shared token",
  tokenDecl?.[1].trim(), "0.75rem");
t("D2: the one PUBLIC eyebrow (VideoEmbed's pill) still uses the token, untouched by the sweep",
  /text-eyebrow uppercase tracking-eyebrow/.test(read("components/case-study/blocks/VideoEmbed.tsx")), true);

/* ================================================ E. THE KEY ROW IS THE FIELD LABEL NOW (#254)
 *
 * #253 gave author-typed keys the pill and left fixed schema labels on `labelCls`, on a measured
 * height cost. The audit that followed measured the quantity #253 never asked about: **as loaded,
 * the case-study inspector rendered 121 captions and ZERO pills**, because the eight pill sites
 * are `metaFacts` and `glanceGrid`, both inside `ItemRows` rows that #234 folds by default. A
 * correct measurement of the wrong quantity. So the fixed key takes the contract's `.s-key` —
 * the pill's height, padding, type and connector, with no ground.
 *
 * WHAT THIS SECTION PROTECTS IS THE SEAM, because `labelCls` was NOT mutated and must not be.
 * It still has non-field consumers whose meaning is "a heading", and turning it into a key row
 * would repeat the trap that has fired four times. */
{
  const fields = read("components/studio/blocks/fields.tsx");

  // E1 — the two key kinds are the SAME SHAPE and differ only in the ground, which is item A's
  // whole rule: "a box you cannot type in should not look like one".
  const pill = /export const KEY_PILL_CLS =\s*([\s\S]*?);/.exec(fields)?.[1] ?? "";
  const fixed = /export const FIXED_KEY_CLS =\s*([\s\S]*?);/.exec(fields)?.[1] ?? "";
  t("E1: both key classes exist", [pill.length > 0, fixed.length > 0], [true, true]);
  for (const tok of ["h-[26px]", "px-2.5", "text-[10.5px]", "font-bold", "uppercase", "tracking-[0.13em]", "text-ink-600"])
    t(`E1: …and share ${tok}`, [pill.includes(tok), fixed.includes(tok)], [true, true]);
  t("E1: …and ONLY the editable one carries a ground and a radius",
    [pill.includes("bg-cream-200"), pill.includes("rounded-full"),
     fixed.includes("bg-cream-200"), fixed.includes("rounded-full")],
    [true, true, false, false]);

  // E2 — every field component renders the key row. Derived from the components that render a
  // `<label className="flex flex-col">` wrapper, so a new field component joins by existing.
  // Derived from the wrapper: a field component is one that opens `<label className="flex flex-col
  // gap-1">`. The very next label-bearing element must be the key row.
  const comps = [...fields.matchAll(/<label className="flex flex-col gap-1"[^>]*>\s*\{?\s*(<FieldKey>|<span className=\{labelCls\}>)/g)]
    .map((m) => m[1]);
  t("E2: the field wrappers were found", comps.length >= 3, true);
  t("E2: none of them still labels a field with `labelCls` — that is what left the pill invisible",
    comps.filter((k) => k !== "<FieldKey>"), []);

  // E3 — THE SEAM. `labelCls` keeps its value and its non-field consumers, untouched.
  t("E3: `labelCls` itself is unchanged — the pill is a NEW export, not a mutation",
    /export const labelCls =\s*\n?\s*"font-label text-\[12px\] font-bold uppercase tracking-eyebrow text-ink-600";/.test(fields), true);
  // OverviewRow is NOT in this list, and that is #240's fix rather than an omission: it is a
  // SERVER component, and importing `labelCls` across the client boundary yields a THROWING PROXY
  // that a template literal stringifies into the class attribute. It writes the utilities out as
  // literals, with `studio-ink` asserting the pair agrees.
  const NON_FIELD = ["SegmentedToggle", "SectionsRail", "SettingsPhotoField", "BlogBlocksEditPanel"];
  t("E3: …and every pure non-field consumer still uses it, so the seam did not sweep them",
    NON_FIELD.filter((f) => !/className=\{`?\$?\{?labelCls/.test(read(`components/studio/${f}.tsx`))), []);
  t("E3: …and OverviewRow still writes the label utilities out rather than importing them (#240)",
    /from "\.\/blocks\/fields"/.test(read("components/studio/OverviewRow.tsx")), false);

  // E4 — CheckField is excluded on what it IS. Its label sits INLINE beside a checkbox, naming
  // the control rather than a value beneath it; a key row needs a value under the key.
  t("E4: CheckField keeps its inline label — a checkbox has no value beneath its key",
    /export function CheckField[\s\S]{0,400}?<label className="flex w-fit items-center gap-2"/.test(fields), true);
}

/* ================================================ F. THE UNIT LIVES IN THE WELL (#255)
 *
 * Contract 5b: a numeric field carries its unit INSIDE the well, muted and right-aligned, so the
 * LABEL says what the field IS and the field says what it HOLDS. "Width, px" became "Width".
 *
 * A UNIT, NOT A FORMAT, AND NOT AN EXAMPLE — the distinction is the whole of item 1 and the
 * contract's own 5b agrees, listing "px, deg and the stacking index". `hex` is a FORMAT, and a
 * muted "hex" inside a colour field reads as a value rather than an affordance. "e.g. 03" and
 * "e.g. 1.7778" are EXAMPLES. None of the three takes a suffix. */
{
  const fields = read("components/studio/blocks/fields.tsx");
  const reg = read("components/studio/blocks/registry.tsx");

  // F1 — every unit passed anywhere is a real unit of measure. Derived from the call sites, so a
  // new `unit="hex"` fails here rather than being caught in review.
  const units = [...reg.matchAll(/unit="([^"]+)"/g)].map((m) => m[1]);
  t("F1: the unit call sites were found", units.length >= 5, true);
  t("F1: every unit is a UNIT OF MEASURE — a format or an example would fail here",
    units.filter((u) => !["px", "deg"].includes(u)), []);

  // F2 — the three that must NOT take one, asserted by name because each was a judgement.
  t("F2: `Dot colour, hex` keeps its label — hex is a FORMAT, and a muted hex reads as a value",
    /label="Dot colour, hex"/.test(reg) && !/label="Dot colour"[^>]*unit=/.test(reg), true);
  t("F2: `Stacking order` takes no suffix — the contract draws `z`, which names the PROPERTY rather than measuring anything",
    /label="Stacking order"/.test(reg) && !/label="Stacking[^"]*"[^>]*unit=/.test(reg), true);
  t("F2: the two `e.g.` labels are examples, not units, and keep their labels",
    [/label="Index, e\.g\. 03"/.test(read("components/studio/blocks/SectionShell.tsx")),
     /label="Aspect ratio, e\.g\. 1\.7778 \(optional\)"/.test(reg)], [true, true]);

  // F3 — THE DEAD ZONE. `pointer-events-none` is what keeps a click at the right edge landing in
  // the input. Without it the field grows an unclickable strip that reads as a broken input.
  t("F3: the suffix is pointer-events-none — otherwise the field grows a dead zone at its right edge",
    /aria-hidden\s*\n?\s*className="pointer-events-none absolute right-3/.test(fields), true);
  t("F3: …and the input reserves room for it, so a long value cannot run underneath",
    /unit \? "pr-\[34px\] tabular-nums" : ""/.test(fields), true);

  // F4 — THE UNIT LEFT THE VISIBLE LABEL, SO IT MUST SURVIVE IN THE ACCESSIBLE NAME. The span is
  // aria-hidden, so without this a screen reader hears "Width" where it used to hear "Width, px".
  // Caught by measuring the rendered a11y name, not by reading the diff.
  t("F4: the accessible name still carries the unit the visible label gave up",
    /aria-label=\{unit \? `\$\{label\}, \$\{unit\}` : undefined\}/.test(fields), true);

  // F5 — THE COLOUR. The contract says ink-400; on the cream-50 well that is 3.49, and
  // `studio-ink-contrast` H4 already asserts ink-400 fails the text floor on EVERY cream step.
  // `text-subtle` is 5.52 there. The rule was already the project's; the contract had not caught up.
  t("F5: the suffix uses text-subtle, not the contract's ink-400 — 5.52 against 3.49 on the well",
    /text-\[12px\] font-medium text-text-subtle/.test(fields), true);
  t("F5: …and no ink-400 survives on the suffix",
    /right-3[^"]*text-ink-400/.test(fields), false);
}

/* ================================================ G. THE TAB HINT (PR 4)
 * MEASURED, NOT READ. The contract's `.tabhint{margin:8px 14px 0}` looked like one spacing value
 * among several. Measuring where the INK STARTS relative to the pane's left edge is what separated
 * it from the rest: header ink 16, tab ink 13, section-card content 13, and this paragraph at
 * **1** — the only child of the body sitting flush against the pane's border.
 *
 * THE INSET IS ASSERTED AS A RELATIONSHIP, NOT A NUMBER. The hint sits directly beneath the
 * tablist, so it takes the TABS' inset. Pinning `px-3` would keep passing while the tabs moved out
 * from under it; deriving both fails the moment they disagree, which is the property the alignment
 * actually rests on. */
{
  const sections = read("components/studio/SectionsEditPanel.tsx");
  /* ⚠ THE HINT WAS REMOVED IN `545f2ac`, DELIBERATELY, AND THE OLD DERIVATION DID NOT GO EMPTY —
   * IT SILENTLY RETARGETED. It read `<div id="cs-fieldtab-panel">[\s\S]*?</p>` and took the first
   * `<p className>` inside. With the hint deleted the non-greedy window simply ran on to the next
   * `</p>` in the file — 7,526 characters away — and started reporting an UNRELATED paragraph's
   * classes. So the three assertions built on it were not merely stale, they were describing a
   * different element, and G4's absence check was being applied to that one too.
   * **A WINDOW THAT ENDS AT "THE NEXT X" WILL ALWAYS FIND ONE. It cannot report absence, only a
   * wrong answer**, which is the same shape as the prefix match that survived a mutation in
   * `studio-save-bar` and the `\bhidden\b` that matched `overflow-hidden` in `three-pane`.
   *
   * WHAT THE RETIRED ASSERTIONS SAID, kept because the reasoning outlives the element: the hint
   * was 11px, INSET rather than flush against the pane border at 1px, and its inset was DERIVED
   * from the tablist container's `mx-` so the two could not drift. `leading-[1.5]` was in the
   * contract and deliberately absent, because studio-cascade C1 proved it inert against the
   * studio reset — that finding is about the RESET and C1 still holds it. If a hint ever returns
   * under this tablist, those are the properties it needs.
   *
   * WHAT REPLACES THEM IS AN ABSENCE PLUS A LIVENESS CHECK. The absence is the real assertion —
   * copy deleted for being useless should not reappear without a decision. The liveness check is
   * what stops THIS block repeating the mistake it documents: if the tablist itself ever goes,
   * the absence would pass for the wrong reason and nobody would know. */
  const sectionsBare = sections.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const tablistPad = sectionsBare
    .match(/aria-label="Section content and style"[\s\S]{0,300}?className="([^"]+)"/)?.[1]
    ?.match(/\bmx-(\d)\b/)?.[1] ?? null;

  t("G1: the tab hint's copy is gone and stays gone — removed deliberately in 545f2ac",
    /Copy for this section, including the Rich|double asterisks/.test(sectionsBare), false);
  t("G2: …and the tablist it sat under is still here, so G1 is an absence rather than a vacuous pass",
    tablistPad !== null, true);
  t("G3: …and the panel it sat in is still here too", /id="cs-fieldtab-panel"/.test(sectionsBare), true);
}

/* ---- G5 · THE LIVE-PREVIEW HINT IS A SENTENCE, SO IT IS NOT SET LIKE A LABEL ----------------
 * `tracking-eyebrow` is 0.14em, sized for the two-word labels `labelCls` and `groupLabelCls` set.
 * This line is 130 characters; uppercase at that tracking stretched it past the canvas and slowed
 * reading, which is the opposite of what help text does. The strip around it is the studio's
 * EXISTING neutral one — the same border/fill/radius triple as the no-editor-yet strip and
 * `ExperienceListEditor`'s banner — so this adds a frame without adding a pattern.
 * Comments are stripped before matching: this hint's own comment names `tracking-eyebrow` and
 * `bg-cream-100` while explaining them, and an un-stripped regex matches the PROSE. That trap has
 * now fired six times in this suite's history, which is why it is defended by default. */
{
  const src = read("components/studio/SectionsEditPanel.tsx")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const strip = /<div className="([^"]*)">\s*<IconInfo/.exec(src)?.[1] ?? "";

  t("G5: the live-preview strip was found — nothing below is a vacuous pass", strip !== "", true);
  t("G5: it is NOT set like a label — a 130-char sentence takes neither uppercase nor eyebrow",
    /uppercase|tracking-eyebrow/.test(strip), false);
  t("G5: …and it reuses the EXISTING neutral strip rather than inventing a third flavour",
    /border border-ink-950\/12/.test(strip) && /bg-cream-100/.test(strip)
      && /rounded-\[var\(--studio-radius-control,4px\)\]/.test(strip), true);
  t("G5: …with no left accent bar, which the studio keeps for selection markers",
    /border-l/.test(strip), false);

  /* THE STATUS LINE IS OUTSIDE THE STRIP, and that is the assertion that matters most here.
   * Inside a framed strip an upload ERROR reads as part of the instructions. The old markup put
   * both spans in the hint's container, each carrying `normal-case tracking-normal` to escape the
   * uppercase it inherited — the reset was the tell that they never belonged there. */
  t("G5: upload status is NOT inside the help strip — an error there reads as instructions",
    /<IconInfo[\s\S]*?imageBusy/.test(/<div className="[^"]*">\s*<IconInfo[\s\S]*?<\/div>/.exec(src)?.[0] ?? ""),
    false);
  t("G5: …and it announces, which it never did while it was a bare span",
    /role="status" aria-live="polite"[^>]*>\s*\{imageBusy/.test(src.replace(/\n\s*/g, " ")), true);
  t("G5: …so the escape hatches those spans needed are gone with the uppercase",
    /normal-case tracking-normal/.test(src), false);
}

/* ---- G6 · THE STRIP'S INSET IS DERIVED FROM THE CANVAS SCALE, NEVER A MEASURED PIXEL ---------
 * The canvas renders at 1280 and is scaled to fit the pane, so anything drawn OUTSIDE the scaled
 * box cannot line up with the section card by copying the card's own margin. The card's on-screen
 * inset is `(1.5rem + clamp(0.75rem, 2vw, 2rem)) * scale`, and TWO of those move independently —
 * the clamp tracks the VIEWPORT, the scale tracks the PANE. Measured once it was 34px; at
 * viewport 1180 the true value is 32.8 and at 1760 it is 39.8. A hardcoded pixel is therefore
 * correct at exactly one window size, which is why this asserts the expression and not a number. */
{
  const src = read("components/studio/SectionsEditPanel.tsx")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const css = read("app/globals.css");
  const strip = /<div className="([^"]*)">\s*<IconInfo/.exec(src)?.[1] ?? "";

  t("G6: the strip's inset is the derived var, not a pixel someone measured once",
    /mx-\[var\(--cs-card-inset\)\]/.test(strip), true);
  t("G6: …and no hardcoded horizontal margin survives beside it",
    /\bmx-\[\d/.test(strip) || /\bmx-\d/.test(strip), false);
  t("G6: `--cs-card-inset` multiplies BOTH of the canvas's own numbers by the runtime scale",
    /--cs-card-inset:\s*calc\(\(1\.5rem \+ clamp\(0\.75rem, 2vw, 2rem\)\) \* var\(--cs-canvas-scale, 1\)\)/
      .test(css), true);
  t("G6: the scale is published by the hook that already computes it",
    /setProperty\("--cs-canvas-scale", String\(next\)\)/.test(src), true);
  t("G6: …onto an EXPLICIT scope, not `parentElement` — a later wrapper would silently retarget",
    /closest<HTMLElement>\("\[data-canvas-scope\]"\)/.test(src), true);
  t("G6: …and that scope carries the class the var resolves through",
    /<div data-canvas-scope className="cs-canvas-scope">/.test(src), true);
}

console.log(`\nstudio-labels result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
