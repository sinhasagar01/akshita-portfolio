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
    /@container grid grid-cols-\[1fr_auto_auto\] items-center gap-x-3 gap-y-2 border-t border-ink-950\/12 bg-cream-200 px-4 py-3 \$\{className\}/.test(bar), true);

  /* ⚠ THE ROOT IS A `footer`, AND ListDetailLayout IS THE CONSUMER OF THAT TAG NAME. Its
   * `lg:[&>section>footer]:mt-auto` is what stops a bar floating mid-air in a short panel —
   * 61px of float at 1440x820, 295px at 1076x1054. A `div` matches nothing and every
   * class-string gate would still have passed. mount-discipline B4 asserts the other end. */
  t("B2: the root is a `footer` element", /return \(\s*<footer/.test(bar) && /<\/footer>\s*\);/.test(bar), true);

  /* EXPLICIT TRACKS, NEVER NESTED FLEX FOR THE ACTIONS. The case-studies index shipped the
   * stretching defect twice and a class-string check passed every broken version of it. */
  t("B3: the actions sit in stated tracks", /grid-cols-\[1fr_auto_auto\]/.test(bar), true);

  /* ⚠ THE PLACEHOLDERS ARE GONE, AND EXPLICIT PLACEMENT IS WHY. They existed because
   * auto-placement fills cells in source order, so an absent Cancel shifted the primary a track
   * left and an absent `extra` let a FOURTH child wrap to an implicit row. Stating the cell each
   * control occupies makes source order irrelevant — and it is also what lets one row and two
   * rows be the same three tracks and the same DOM, which a spacer could not be part of.
   * ASSERTED AS AN ABSENCE, because a stray placeholder now occupies a real cell. */
  t("B4: no spacer children survive — every control states its own cell",
    (bar.match(/<span \/>/g) ?? []).length, 0);
  t("B4: …and each control does state one", {
    cancel: /className="col-start-2 row-start-2 rounded/.test(bar),
    primary: /\$\{primaryCell\} rounded/.test(bar),
  }, { cancel: true, primary: true });

  /* THE STATE ROW IS ITS OWN ROW, AND THE REASON IS ARITHMETIC RATHER THAN TASTE. The contract
   * draws one row against a 340px track and a 12-character primary. This inspector is 313px
   * inside its scrollbar and #200 requires "Save draft · Sections", which measures 167px; with
   * Cancel and the padding the state track was left 34px and rendered "Saved" as "S…". */
  /* ⚠ THE FULL-WIDTH STATE ROW IS NOW THE LOADED BAR'S ARRANGEMENT ONLY, and that distinction is
   * the correction. A bare bar — a primary and nothing else, which is seven of the nine surfaces
   * — fits one row in the SAME 313px inspector, measured: primary 99px, state track 157.7px, and
   * the longest string the formatter can produce ("Saved 59 minutes ago") needs 137px with its
   * dot and gap. Treating width as the whole answer had the blog stacking for no reason. */
  t("B5: a loaded bar takes a full state row, so no label length can crush it",
    /col-start-1 col-end-4 row-start-1 @\[520px\]:col-end-2/.test(bar), true);
  t("B5: …and a bare one does not, because there is nothing there to crush it",
    /col-start-1 col-end-2 row-start-1"/.test(bar), true);
  t("B5: …and the state wrapper composes the chosen cell rather than hard-coding one",
    /\$\{stateCell\} flex min-w-0 items-center justify-between gap-3/.test(bar), true);

  /* WHAT "LOADED" MEANS IS THE CONTROLS, NOT THE PAGE. Reading it off `extra`/`onCancel` is what
   * keeps the rule about whether the row is crowded; a per-page prop would have to be revisited
   * the next time any bar gains a control. */
  t("B5: …and `loaded` is derived from the controls present",
    /const loaded = Boolean\(extra \|\| onCancel\);/.test(bar), true);

  /* ⚠ BOTH VARIANTS ARE WRITTEN OUT IN FULL. Tailwind's scanner reads source as plain text and
   * never sees a prefix assembled at runtime, so a composed `@[520px]:` emits NO CSS and fails
   * silently — hazard 23's shape. Asserted as an absence of the pattern that would do it. */
  // ANCHORED ON THE INTERPOLATION, NOT ON A LEADING QUOTE. The first version required the
  // `@[` to open the string, so a threshold interpolated MID-string — which is exactly how it
  // would really be written — walked straight past it. Caught by mutation.
  t("B5: …and no variant prefix is built by interpolation, which would emit nothing",
    /@\[\$\{/.test(bar), false);
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
  /* ⚠ RE-ANCHORED WHEN THE BAR MOVED INTO THE COLUMN. It used to be a SIBLING of the layout,
   * which is exactly why it spanned the 300px rail — 1342px at a 1600px viewport against
   * Experience's 1042. It is now the layout's `footer` slot. WHAT THE ASSERTION PROTECTS IS
   * UNCHANGED and is #229's point: exactly ONE bar for N CategoryPanels, because one
   * `useDraftForm` holds every category. A bar in the CHILDREN would be one per panel. */
  t("C5: skills renders exactly one bar, and it is the layout's footer rather than a panel's",
    (skills.match(/<SaveBar[\s/>]/g) ?? []).length === 1 && /footer=\{\s*<SaveBar/.test(skills), true);
  t("C5: …and none of it sits in the layout's children, which would be one bar per category",
    /<\/ListDetailLayout>[\s\S]*<SaveBar/.test(skills), false);
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

/* ================================================= D. ONE ROW OR TWO IS A QUESTION ABOUT THE BOX
 *
 * The bar asks its own container rather than being told which page it is on. A boolean prop would
 * put the same decision at six call sites and encode WHICH PAGE instead of WHETHER IT FITS —
 * which is precisely the mistake the contract's one-row drawing made.
 *
 * ⚠ THE THRESHOLD IS THE PART THAT CAN BE WRONG SILENTLY. Set too low it re-creates the "S…"
 * truncation in the 313px inspector; set above a settings column it wastes a row on three pages.
 * So it is pinned against BOTH pane widths rather than merely asserted to exist. */
{
  const M = /@\[(\d+)px\]:/.exec(bar);
  t("D1: the bar declares a container and a threshold", Boolean(M) && /@container/.test(bar), true);
  const THRESHOLD = Number(M?.[1] ?? 0);

  /* THE TWO PANE WIDTHS ARE READ FROM SOURCE, NOT RETYPED. The inspector is ThreePaneShell's own
   * `w-[320px]`; a settings column is the pane left over after ListDetailLayout's `lg:w-[300px]`
   * rail, which is why the lower bound below is the rail rather than a measured 1042. */
  // RE-ANCHORED ON THE CUSTOM PROPERTY'S FALLBACK. The case-study inspector is a cookie now; the
  // fallback is what blog resolves to and is still a real width. `three-pane.mjs` splits the same
  // way and says why at length.
  const inspectorPx = Number(/w-\[var\(--studio-inspector-w,(\d+)px\)\]/.exec(
    read("components/studio/ThreePaneShell.tsx"))?.[1] ?? 0);
  const railPx = Number(/lg:w-\[(\d+)px\]/.exec(read("components/studio/ListDetailLayout.tsx"))?.[1] ?? 0);
  t("D1: …and both pane widths were actually found, so the bounds below are not vacuous",
    inspectorPx > 0 && railPx > 0, true);

  /* THE INSPECTOR MUST LAND IN THE TWO-ROW REGIME WITH ROOM TO SPARE. Measured, a fully loaded
   * one-row bar needs 567px: state 200 + Preview 61 + Cancel 56 + primary 182, three 12px gaps
   * and 32px of padding. The inspector is nowhere near it and must stay nowhere near it. */
  t("D2: the inspector is comfortably inside the two-row regime — 150px of margin, not a hair",
    THRESHOLD >= inspectorPx + 150, true);

  /* AND A ONE-ROW BAR MUST ACTUALLY BE REACHABLE. At the 1024px `lg` breakpoint, the narrowest
   * width at which the shell is side-by-side at all, the detail column is what the rail leaves. */
  t("D3: …and a settings column clears it at the narrowest supported desktop width",
    THRESHOLD < 1024 - railPx, true);

  t("D4: exactly one threshold is used, so the two rows cannot disagree about where they switch",
    [...new Set((bar.match(/@\[\d+px\]:/g) ?? []))].length, 1);

  /* D5 · THE CENSUS THE RULE PRODUCES, ASSERTED AT THE CALL SITES RATHER THAN INFERRED.
   * Exactly two surfaces are loaded — the case study's two saves, which carry Preview, Cancel and
   * a #200 suffix. The other seven are bare and take one row at every width. This is what makes
   * "blog is one row, the case-study inspector is two" a CONSEQUENCE rather than a special case,
   * and it fails the moment a bar gains a control without the row arithmetic being revisited. */
  const LOADED = ["ProjectsEditPanel", "SectionsEditPanel"];
  const SURFACE_FILES = ["AboutEditPanel", "ExperienceEditPanel", "HeroEditPanel", "LinksEditPanel",
    "ProcessEditPanel", "ProjectsEditPanel", "SectionsEditPanel", "SkillsEditor", "BlogBlocksEditPanel"];
  const actuallyLoaded = SURFACE_FILES.filter((n) => {
    const src = code(`components/studio/${n}.tsx`);
    return /onCancel=\{/.test(src) || /\n\s*extra=\{/.test(src);
  });
  t("D5: exactly the two case-study bars are loaded; the other seven are bare", actuallyLoaded, LOADED);
  t("D5: …so the blog bar is bare, which is why it is one row in the same 313px inspector",
    actuallyLoaded.includes("BlogBlocksEditPanel"), false);
}

/* ================================================= E. THE CASE-STUDY INSPECTOR SHOWS ONE SAVE
 *
 * Details used to render TWO bars stacked in a 320px column — its own, plus the sections bar the
 * pane always carried — so the screen offered a save for an object the visible form does not
 * edit. Each view now shows the save that matches what is on it, and both carry Preview. */
{
  const projects = code("components/studio/ProjectsEditPanel.tsx");
  const sections = code("components/studio/SectionsEditPanel.tsx");

  t("E1: the sections bar is absent on the Details view",
    /showDetails \|\| ins\.collapsed \? null : sectionsBarNode\}/.test(sections), true);

  /* ⚠ AND IT LEAVES THE PANE ENTIRELY WHEN THE PANE IS SHUT. A bar nested in a zero-width
   * inspector is clipped with it, which takes the save AND its state line off screen — an author
   * who collapses the pane, keeps typing and cannot see "Couldn't save" is hazard 13 and #201 in
   * one gesture. It docks to the canvas foot instead, which is a seam that already compresses the
   * canvas rather than covering it. ONE NODE, TWO PLACES, never two copies: `detailsBar` and
   * `sectionsBarNode` are each rendered in exactly one branch at a time, which is what keeps
   * #200's "two buttons claiming to be the same action" from coming back. */
  t("E6: a collapsed inspector docks its bar to the canvas rather than clipping it",
    /ins\.collapsed \? \(showDetails \? detailsBar : sectionsBarNode\) : null/.test(sections), true);
  t("E6: …and the details bar is a node this panel places, not one nested in the form",
    /detailsBar\?: ReactNode;/.test(sections) && /\{ins\.collapsed \? null : detailsBar\}/.test(sections), true);
  t("E6: …and ProjectsEditPanel hands it over rather than rendering it itself",
    /const detailsBar = \(\s*<SaveBar/.test(projects) && /detailsBar=\{detailsBar\}/.test(projects), true);

  /* BOTH BARS OPEN THE DRAFT PREVIEW, and the anchor is duplicated rather than shared: the two
   * bars are rendered by two components over two different useDraftForms, so extracting a
   * component would couple them for four lines of markup. ⚠ BOTH PUT THE COLOUR ON A WRAPPER —
   * hazard 22's unlayered `a { color: inherit }` beats a `text-*` utility on the anchor itself,
   * which studio-ink E6 caught on the details one during this arc. */
  for (const [name, src] of [["details", projects], ["sections", sections]]) {
    t(`E2: the ${name} bar offers Preview`,
      /<span className="flex items-center gap-1 text-ink-600">[\s{}]*<a/.test(src)
        && /\/studio\/projects\/\$\{slug\}\/preview/.test(src), true);
    t(`E2: …and the ${name} anchor does not colour itself, which hazard 22 would defeat`,
      /<a\b[^>]*className="[^"]*text-ink-600/.test(src), false);
  }

  /* THE DETAILS BAR PINS TO THE PANE FOOT. It was static, so it sat wherever the form ended —
   * measured at y=1027 in a 1000px viewport, which is off screen until you scroll. BOTH HALVES
   * ARE REQUIRED: `sticky bottom-0` is inert when nothing scrolls and `mt-auto` is inert when
   * something does. mount-discipline B4 is the same finding on the settings panels. */
  t("E3: the details bar is pinned with both halves", /className="sticky bottom-0 z-10 mt-auto"/.test(projects), true);

  /* AND THE HEIGHT CHAIN THAT MAKES `mt-auto` MEAN ANYTHING. Every link is load-bearing; a
   * missing one leaves the bar floating and nothing looks broken until the form is short.
   *
   * ⚠ THIS ASSERTION PASSED WHILE THE BAR SCROLLED AWAY, AND THAT IS THE LESSON IN IT. It pinned
   * the literal `flex-1` I had written, so it confirmed my own typing rather than the property I
   * needed. `flex-1` is basis ZERO — the box is sized from the container's free space, not from
   * its content — so the wrapper came out 147px short of the form inside it, and a sticky element
   * cannot be held below its containing block's bottom edge. Measured at 1600x900: pinned at
   * scrollTop 0, adrift by 147px at the end of the scroll.
   * IT NOW ASSERTS `grow` AND THE ABSENCE OF `flex-1`, because only the absence can fail if
   * someone "tidies" one into the other. A class-string gate can prove which utility is present;
   * it can never prove which one is correct, so the scroll behaviour itself is measured live and
   * reported in the PR rather than claimed here. */
  t("E3: …and the height reaches it — pane, wrapper, node, in that order", {
    inspectorNode: /flex min-h-full flex-col gap-4/.test(sections),
    detailsWrapper: /hidden=\{!showDetails\} className="flex grow flex-col"/.test(sections),
    detailsNode: /<div className="flex grow flex-col">/.test(projects),
  }, { inspectorNode: true, detailsWrapper: true, detailsNode: true });
  t("E3: …and no link in that chain uses a zero-basis `flex-1`, which cannot span its own content",
    /className="[^"]*\bflex-1\b[^"]*"[^>]*>\{detailsNode\}/.test(sections)
      || /const detailsNode = \(\s*<div className="[^"]*\bflex-1\b/.test(projects), false);

  /* ⚠ AND NOTHING MAY FOLLOW THE DETAILS FORM IN THE SCROLL CONTENT. The wrapper sizing was only
   * half the defect: the section field surface — a Content|Style tablist, its panel and the bold
   * hint — stayed in flow on the Details view, 147px of it, so the bar had content below it and
   * could not reach the pane foot however the flex boxes were sized. It is HIDDEN there now,
   * never unmounted: sixteen field trees hang off that panel and unmounting drops in-progress
   * edits, which is this panel's own stated rule. */
  t("E5: the section field surface is hidden on the Details view, so nothing follows the bar",
    /<div hidden=\{showDetails\} className="flex flex-col gap-4">/.test(sections), true);
  t("E5: …and it is hidden rather than unmounted, so no draft or caret is dropped",
    /\{!showDetails && \(\s*<div/.test(sections) || /showDetails \? null : \(\s*<div className="flex flex-col gap-4"/.test(sections), false);

  /* ⚠ THE WRAPPER KEEPS THE `hidden` ATTRIBUTE AND THAT IS ONLY SAFE BECAUSE PREFLIGHT SHOUTS.
   * Tailwind emits `[hidden]:where(:not([hidden=until-found])){display:none!important}`. The
   * `:where()` zeroes the specificity, so without the `!important` a `flex` utility on the same
   * element would out-specify the attribute and the details form would render on every section. */
  t("E4: preflight's [hidden] rule still carries !important, which is what makes `flex` safe there",
    /\[hidden\]:where\(:not\(\[hidden='until-found'\]\)\)\{display:none!important;\}/
      .test(readFileSync(new URL("../../node_modules/tailwindcss/preflight.css", import.meta.url), "utf8")
        .replace(/\s+/g, "")), true);
}

console.log(`\nstudio-save-bar result: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
