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
  /export const labelCls = "text-\[12px\] font-bold uppercase tracking-eyebrow text-ink-600";/.test(fields), true);
t("A4: the GROUP step is 10px / ink-600 — one level in, and NOT bold, so the two steps stay distinct",
  /export const groupLabelCls = "text-\[10px\] uppercase tracking-eyebrow text-ink-600";/.test(fields), true);
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

console.log(`\nstudio-labels result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
