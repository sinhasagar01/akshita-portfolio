// The save bar — one shape, one derivation, nine surfaces.
// Run: node --experimental-strip-types ralph/tests/studio-save-bar.mjs
//
// WHY THIS SUITE EXISTS
//
// Nine surfaces used to spell their own save state in their own prose. That is nine copies of a
// five-way conditional, and the way you find out they have drifted is by opening all nine. The
// bar is now one component over one pure derivation, and this file guards the two properties
// that makes true: THE DERIVATION IS TOTAL (Part A) and NO SURFACE RE-IMPLEMENTS IT (Part C).
//
// ⚠ PART A IS THE ONLY PART THAT CAN PROVE BEHAVIOUR. Everything else here reads source text, so
// it proves a string is present and nothing about what renders. That is stated rather than
// implied, because a suite that looks behavioural and is not is worse than one that admits it —
// the live measurements are in the PR body, and they are where the rendered claims are settled.
import { readFileSync } from "node:fs";
import {
  deriveSaveState,
  formatSavedAge,
  saveStateLabel,
} from "../../lib/studio/save-state.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Source with comments stripped — these assertions are about CODE. This file's own comments
 *  quote class names and copy at length, and a comment is not a second implementation. */
const code = (p) =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const bar = code("components/studio/SaveBar.tsx");

/* ================================================================= A. THE DERIVATION IS TOTAL
 *
 * Five status values crossed with two dirty values is ten inputs, and all ten are asserted
 * rather than sampled. A derivation with a hole does not throw — it returns undefined and the
 * bar renders a dot with no colour and a phrase with no words, which reads as a bar that has
 * nothing to say rather than as a bug. */
{
  const STATUSES = ["idle", "saving", "saved", "fs", "error"];
  const table = {};
  for (const s of STATUSES) for (const d of [false, true]) table[`${s}/${d}`] = deriveSaveState(s, d);
  t("A1: every status × dirty pair maps to a state — all ten, not a sample", table, {
    "idle/false": "saved",   "idle/true": "dirty",
    "saving/false": "saving", "saving/true": "saving",
    "saved/false": "saved",  "saved/true": "dirty",
    "fs/false": "error",     "fs/true": "error",
    "error/false": "error",  "error/true": "error",
  });

  /* THE PRECEDENCE IS THE PART THAT CAN BE WRONG WITHOUT LOOKING WRONG. Each of these three
   * pairs has the SAME `dirty`, so only the ordering inside `deriveSaveState` decides them. A
   * plausible rewrite that checks `dirty` first passes A1's shape and fails all three. */
  t("A2: `saving` outranks `dirty` — a save in flight is the more specific fact about one edit",
    deriveSaveState("saving", true), "saving");
  t("A2: `error` outranks `dirty` — a failure is the thing to act on",
    deriveSaveState("error", true), "error");
  t("A2: …and `fs` does too, because a no-oped write IS a failure to save",
    deriveSaveState("fs", true), "error");

  /* ⚠ `fs` DOES NOT VANISH, AND THIS IS THE ASSERTION THAT SAYS SO. The five-state line has no
   * slot for "the write no-oped because this dev server is not in github mode". Dropping it into
   * silence would make a local save look SUCCESSFUL when nothing was written. It takes the
   * failure state instead. Driven live: a save on the dev server renders "Couldn't save". */
  t("A3: `fs` is not silently the saved state — that would report a write that never happened",
    deriveSaveState("fs", false) === "saved", false);
}

/* ---- A4 · THE AGE, WHICH IS WHY `savedAt` EXISTS AT ALL ------------------------------------
 * `useDraftForm` flips `saved` back to `idle` after 2500ms, so by the time "Saved 2 minutes ago"
 * would be true the status has read `idle` for nearly two minutes. The age cannot be derived
 * from the status and needs its own timestamp. */
{
  const T = 1_000_000_000_000;
  t("A4: no timestamp means no age — the line says `Saved`, not a made-up duration",
    formatSavedAge(null, T), null);
  t("A4: under 45s reads as `just now`", formatSavedAge(T, T + 44_000), "just now");
  t("A4: …and 45s is where the wording changes", formatSavedAge(T, T + 45_000), "1 minute ago");
  t("A4: the singular is not `1 minutes ago`", formatSavedAge(T, T + 60_000), "1 minute ago");
  t("A4: minutes read as minutes", formatSavedAge(T, T + 8 * 60_000), "8 minutes ago");
  t("A4: and roll over to hours", formatSavedAge(T, T + 3 * 3_600_000), "3 hours ago");
  t("A4: a clock that moved backwards says nothing rather than nonsense",
    formatSavedAge(T, T - 5000), null);
}

/* ---- A5 · THE WORDS ------------------------------------------------------------------------ */
{
  t("A5: the four phrases are the contract's, with the age folded into `saved`", {
    saving: saveStateLabel("saving", null),
    error: saveStateLabel("error", null),
    dirty: saveStateLabel("dirty", null),
    savedBare: saveStateLabel("saved", null),
    savedAged: saveStateLabel("saved", "2 minutes ago"),
  }, {
    saving: "Saving…", error: "Couldn't save", dirty: "Unsaved changes",
    savedBare: "Saved", savedAged: "Saved 2 minutes ago",
  });
  /* WITHOUT AN AGE THE LINE SAYS "Saved", WHICH IS A CLAIM; with one it says when, which is
   * evidence. The two must not collapse into each other. */
  t("A5: the aged and un-aged forms are different strings",
    saveStateLabel("saved", null) === saveStateLabel("saved", "2 minutes ago"), false);
}

/* ================================================================= B. ONE SHAPE, STATED
 *
 * The bar's own look is not overridable by a consumer — `className` is positioning only. That is
 * what keeps "one shape" true across nine surfaces rather than aspirational. */
{
  t("B1: the ground, the hairline and the padding are the bar's, not the caller's",
    /grid grid-cols-\[1fr_auto_auto\] items-center gap-x-3 gap-y-2 border-t border-ink-950\/12 bg-cream-200 px-4 py-3 \$\{className\}/.test(bar), true);

  /* ⚠ THE ROOT IS A `footer`, AND ListDetailLayout IS THE CONSUMER OF THAT TAG NAME. Its
   * `lg:[&>section>footer]:mt-auto` is what stops a bar floating mid-air in a short panel —
   * 61px of float at 1440x820, 295px at 1076x1054. A `div` matches nothing and every
   * class-string gate would still have passed. mount-discipline B4 asserts the other end. */
  t("B2: the root is a `footer` element", /return \(\s*<footer/.test(bar) && /<\/footer>\s*\);/.test(bar), true);

  /* EXPLICIT TRACKS, NEVER NESTED FLEX FOR THE ACTIONS. The case-studies index shipped the
   * stretching defect twice and a class-string check passed every broken version of it. */
  t("B3: the actions sit in stated tracks", /grid-cols-\[1fr_auto_auto\]/.test(bar), true);

  /* ⚠ THREE TRACKS NEED THREE CHILDREN. `{extra}` rendering nothing when undefined put FOUR
   * children against three tracks and the primary wrapped to an implicit fourth row — measured
   * on the details bar, which is the one surface with a Preview link. Cancel and the primary
   * already had placeholders; the third is the spacer that holds the flexible track. */
  const placeholders = (bar.match(/<span \/>/g) ?? []).length;
  t("B4: the actions row always has three children, absent controls included", placeholders, 3);

  /* THE STATE ROW IS ITS OWN ROW, AND THE REASON IS ARITHMETIC RATHER THAN TASTE. The contract
   * draws one row against a 340px track and a 12-character primary. This inspector is 313px
   * inside its scrollbar and #200 requires "Save draft · Sections", which measures 167px; with
   * Cancel and the padding the state track was left 34px and rendered "Saved" as "S…". */
  t("B5: the state takes a full row of its own, so no label length can crush it",
    /col-span-3 flex min-w-0 items-center justify-between gap-3/.test(bar), true);
  t("B5: …and `extra` rides on that row rather than holding the 1fr track open below it",
    /\{extra \? <span className="flex-none">\{extra\}<\/span> : null\}/.test(bar), true);
}

/* ---- B6 · THE DOT AND THE PHRASE BOTH CARRY THE STATE --------------------------------------
 * A lone colour dot is a non-text indicator and fails for anyone who cannot separate the hues.
 * The phrase says the same thing in words, so neither is doing it alone. */
{
  for (const state of ["saved", "dirty", "saving", "error"]) {
    t(`B6: \`${state}\` has both a dot colour and a phrase colour`,
      new RegExp(`${state}: "bg-`).test(bar) && new RegExp(`${state}: "text-`).test(bar), true);
  }
  /* MOTION IS GATED, AND THE RESTING STATE IS NOT INSIDE THE GATE. The pulse is the only thing
   * reduced motion removes; measured, the dot carries no transform and opacity 1 at rest, so
   * its appearance is identical either way. The failure mode being avoided is a final position
   * trapped inside a no-preference block. */
  t("B6: only `saving` animates, and the animation is motion-gated",
    /saving: "bg-accent-500 motion-safe:animate-pulse"/.test(bar), true);
  t("B6: …and no other state carries an animation utility",
    (bar.match(/animate-/g) ?? []).length, 1);
}

/* ================================================================= C. NO SURFACE RE-IMPLEMENTS IT
 *
 * ⚠ THIS IS THE ASSERTION THE FILE IS FOR. Nine hand-written five-way conditionals is what the
 * bar replaces, and the way they come back is one panel growing "just one more state" locally.
 * Asserting the old strings are ABSENT beats asserting the new ones are present: a present-check
 * passes while a stale copy sits beside it. */
{
  const SURFACES = [
    "AboutEditPanel", "ExperienceEditPanel", "HeroEditPanel", "LinksEditPanel",
    "ProcessEditPanel", "ProjectsEditPanel", "SectionsEditPanel", "SkillsEditor",
    "BlogBlocksEditPanel",
  ];
  t("C1: nine surfaces, which is the census this change was scoped against", SURFACES.length, 9);

  const missing = SURFACES.filter((n) => !/<SaveBar/.test(code(`components/studio/${n}.tsx`)));
  t("C1: …and every one of them renders the shared bar", missing, []);

  /* THE RETIRED STRINGS. Each was a hand-rolled branch of the same five-way conditional. The
   * instruction itself is NOT here — it survives as the bar's `title`, which is the whole point
   * of the change, so it is `Publish from…` that must still appear and these that must not. */
  const RETIRED = ["Saving draft…", "Draft saved", "Save failed. Try again.", "Draft save needs github mode"];
  const relapsed = [];
  for (const n of SURFACES) {
    const src = code(`components/studio/${n}.tsx`);
    for (const s of RETIRED) if (src.includes(s)) relapsed.push(`${n}: ${s}`);
  }
  t("C1: …and no surface still spells a save state in its own prose", relapsed, []);

  /* THE INSTRUCTION MOVED, IT DID NOT DIE. #255 shipped the opposite — a suffix left a label,
   * was aria-hidden, and a screen reader heard less than before. Every instruction that left the
   * screen is a `title` on the bar it left. */
  const untitled = SURFACES.filter((n) => !/title="Auto-saves to draft on blur\./.test(code(`components/studio/${n}.tsx`)));
  t("C2: every bar carries its old instruction as the `title`, so nothing was merely deleted", untitled, []);
}

/* ---- C3 · #200, WHICH THIS CHANGE COULD HAVE UNDONE BY UNIFYING THE VERB --------------------
 * The case study shows TWO saves at once when Details is selected, committing genuinely
 * different drafts. The verb unifies to "Save draft"; the OBJECT is what stops two identical
 * labels claiming to be the same action. Unifying the copy is exactly how that gets lost. */
{
  const projects = code("components/studio/ProjectsEditPanel.tsx");
  const sections = code("components/studio/SectionsEditPanel.tsx");
  t("C3: the details save names its object", /label: "Save draft · Details"/.test(projects), true);
  t("C3: the sections save names its object", /label: "Save draft · Sections"/.test(sections), true);
  t("C3: …and neither collapsed to the bare verb the other seven use",
    /label: "Save draft",/.test(projects) || /label: "Save draft",/.test(sections), false);

  /* THE SCOPE FACT IS IN THE ACCESSIBLE NAME, NOT ONLY THE TOOLTIP. A title alone is a tooltip;
   * the aria-label is what a screen reader hears, and #255 is the precedent for checking. */
  t("C3: the primary's scope fact reaches the accessible name",
    /aria-label=\{primary\.title \? `\$\{primary\.label\}\. \$\{primary\.title\}` : undefined\}/.test(bar), true);
}

/* ---- C4 · THE VALIDATION STATE, WHICH IS NOT A SAVE STATE ----------------------------------
 * The sections bar refuses on `hasBadVideoSrc` with "A video URL must be http:// or https://."
 * That is a fact about the CONTENT rather than about the commit, the five-state line has no slot
 * for it, and a design that swallowed it to fit the drawing would have deleted the only signal
 * saying WHY the save is refusing. It is its own branch and it outranks the save state. */
{
  const sections = code("components/studio/SectionsEditPanel.tsx");
  t("C4: the validation message travels as its own prop, not folded into the line",
    /validation=\{hasBadVideoSrc \? "A video URL must be http:\/\/ or https:\/\/\." : null\}/.test(sections), true);
  t("C4: …and it outranks the save state, because it is the thing blocking the save",
    /\{validation \? \(/.test(bar), true);
  t("C4: …and the save is actually refused, not merely annotated",
    /disabled: !dirty \|\| saveStatus === "saving" \|\| hasBadVideoSrc/.test(sections), true);
}

/* ---- C5 · THE TWO SURFACES THAT ARE NOT DRIFT ----------------------------------------------
 * SKILLS keeps its position. It is a SINGLETON — one useDraftForm holds every category and
 * `buildCommitted` posts them together — so there is one save for N CategoryPanels and the bar
 * stays outside them. #229's other half, the cream-100 card frame, is retired: it argued the bar
 * must not LOOK like a sibling because it BEHAVES differently, and it is now the same component
 * rendering the same states, so the resemblance is real.
 *
 * BLOG is NET-NEW. It had no footer and no state line at all, so the contract's census — "a bar
 * with no explicit save" — was wrong twice. Its explicit Save is real, has a dirty guard, and
 * stays on the owner's call. */
{
  const skills = code("components/studio/SkillsEditor.tsx");
  /* ⚠ ANCHORED ON THE TAG BOUNDARY, and the reason is a mutation that SURVIVED. This read
   * `<SaveBar` with no boundary, so renaming the component to `<SaveBarMoved` still matched on
   * the prefix — the check passed against markup that no longer rendered the shared bar at all.
   * A prefix is not a tag name. It now also asserts the bar appears EXACTLY once after the
   * layout closes, which is what "one save for N CategoryPanels" actually means. */
  t("C5: skills' bar is still outside the panels — one save for N of them",
    (skills.split("</ListDetailLayout>")[1] ?? "").match(/<SaveBar[\s/>]/g)?.length ?? 0, 1);
  t("C5: …and there is none inside the layout, which would be one bar per category",
    /<SaveBar[\s/>]/.test(skills.split("</ListDetailLayout>")[0]), false);
  t("C5: …and its scope fact says so on the control that does it",
    /title: "Saves every category together/.test(skills), true);
  t("C5: …and the cream-100 card frame is gone, because the bar it distinguished from is now this one",
    /rounded-\[var\(--studio-radius-card,8px\)\] border border-ink-950\/12 bg-cream-100 px-4 py-3/.test(skills), false);

  const blogSrc = code("components/studio/BlogBlocksEditPanel.tsx");
  t("C5: the blog's explicit Save is kept — it has a dirty guard and is never inert",
    /onClick=\{saveDraft\}\s*disabled=\{!dirty \|\| saveStatus === "saving"\}/.test(blogSrc), true);
  t("C5: …and the new bar is pinned with BOTH halves, because either alone leaves it floating",
    /className="sticky bottom-0 z-10 mt-auto"/.test(blogSrc), true);
}

/* ---- C6 · THE TIMESTAMP IS RECORDED WHERE A SAVE IS KNOWN TO HAVE LANDED --------------------
 * Not on click, and not on `dirty` clearing. ⚠ MEASURED CONSEQUENCE: a dev server is not in
 * github mode, the write no-ops, and the age therefore NEVER appears there. That is correct —
 * an age is a claim that something was written. */
{
  const form = code("components/studio/useDraftForm.ts");
  t("C6: `savedAt` is stamped immediately before the status says saved",
    /setSavedAt\(Date\.now\(\)\);\s*setSaveStatus\("saved"\);/.test(form), true);
  t("C6: …and it is not stamped anywhere else, so it cannot mark a failed write",
    (form.match(/setSavedAt\(/g) ?? []).length, 1);
  t("C6: …and it is handed to the bar", /savedAt,/.test(form), true);
}

console.log(`\nstudio-save-bar result: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
