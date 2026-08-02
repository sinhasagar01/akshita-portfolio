// MOUNT DISCIPLINE — the case-study editor's forms stay in the tree, always.
// Run: node --experimental-strip-types ralph/tests/mount-discipline.mjs
//
// ---- THE DEFECT THIS EXISTS FOR, AND WHY IT IS WORTH A SUITE --------------------------
//
// The three-pane editor has three views — the Board, the Details form and a section — and every
// one of them is a different thing to LOOK at while the SAME forms stay live underneath. Each
// section editor and each block card is `hidden`, never unmounted, because unmounting a form
// drops its dirty edit, its caret, and the parallel-id lockstep `structural()` maintains.
//
// THE NATURAL WAY TO COMPOSE THIS IS THE WRONG WAY, and that is the whole point:
//
//     {showBoard ? <Board/> : <ThreePaneShell …/>}      // reads correctly. compiles. works.
//
// It works right up until someone with an unsaved edit opens the Board — the shell unmounts, the
// inspector goes with it, and every section editor inside it is destroyed. The draft is gone and
// NOTHING FAILS. It looks like it worked. That is why this was found by reasoning about the
// composition rather than by hitting it: hitting it does not announce itself.
//
// So the shell is HIDDEN, never swapped, exactly as the editors inside it are hidden.
//
// ---- WHY PART A IS SOURCE AND PART B IS A BROWSER SCRIPT ------------------------------
//
// The defect is a RUNTIME UNMOUNT, not a class string, so a source check cannot prove the
// property — it can only refuse the specific edit most likely to break it, which is worth doing
// because that edit is the one a reasonable person writes. The PROOF is Part B, driven in a real
// browser, counting nodes in the tree across every view transition. Same split as `parity` and
// `studio-type`: the runnable half guards the shape, the driven half proves the behaviour.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const panel = code("components/studio/SectionsEditPanel.tsx");

/* ================================================ A. THE SHELL IS HIDDEN, NOT SWAPPED */
// WIDENED FOR THE BESPOKE GUARD, WHICH IS A CONJUNCT AND NOT A CHANGE OF SHAPE. A hand-built
// study has no Board, so the hidden expression gained `!bespoke &&`. The PROPERTY this asserts is
// unchanged and is what the regex still pins: the shell is rendered under `hidden`, never as the
// other arm of a ternary. A2 below is the assertion that actually refuses the dangerous shape, and
// it did not move.
t("A1: the shell is rendered under a `hidden` prop, so opening the Board cannot unmount it",
  /hidden=\{[^}]*showBoard\}[\s\S]{0,120}<ThreePaneShell/.test(panel), true);
// The exact wrong shape, refused by name. A ternary putting the board and the shell in the same
// slot is the composition that destroys the inspector.
t("A2: the board and the shell are NOT alternatives of one ternary — the shape that unmounts the forms",
  /showBoard\s*\?[\s\S]{0,200}<ThreePaneShell/.test(panel), false);
t("A3: the board is rendered as its own conditional — it holds no form state, so it MAY unmount",
  /\{(?:!bespoke && )?showBoard && boardNode\}/.test(panel), true);

/* A4 — THE BESPOKE DENOMINATOR, AND THIS SUITE COULD NOT SEE IT BEFORE.
 * B1-B3 below are regexes over this file's SOURCE: they assert the string
 * `hidden={selectedSectionId !== ids.sectionIds[i]}` exists, which is true whatever the runtime
 * section count is. On a hand-built study that count is ZERO, so every one of them passes having
 * asserted nothing about a page with no section editors at all. The driven proof in Part D is a
 * paste-in script the runner never executes, and its own header excludes boat-crest.
 * That is `run.mjs`'s false-pass shape one level down — a gate whose denominator is zero and which
 * cannot say so. It is named here rather than left implicit: a bespoke study mounts zero section
 * editors BY CONSTRUCTION, because it is handed an empty array, and the suite records that this is
 * the intended zero rather than a silent one. */
t("A4: a bespoke study is handed ZERO sections, so B1-B3 below have no subjects on that page",
  /sections=\{bespoke \? \[\] : \(sectionsData \?\? \[\]\)\}/.test(read("components/studio/ProjectsEditPanel.tsx")), true);
t("A4: …and it renders no Board, so the composition B1-B3 guard is never entered there",
  /\{!bespoke && showBoard && boardNode\}/.test(panel), true);

/* ================================================ B. THE FORMS ARE HIDDEN, NOT CONDITIONAL */
t("B1: each section editor is hidden by selection rather than filtered out of the map",
  /hidden=\{selectedSectionId !== ids\.sectionIds\[i\]\}/.test(panel), true);
// The `.map` must render EVERY section, or the ones not selected never mount in the first place.
t("B2: every section is mapped, not just the selected one",
  /values\.sections\.map\(\(section, i\) =>/.test(panel), true);
t("B3: the details form is hidden rather than conditionally rendered — it carries draft state too",
  /hidden=\{!showDetails\}/.test(panel), true);

/* ================================================ B2. THE COLLAPSED GROUP, one level down
 * PR 8 folds three group kinds inside the inspector. A folded group is the same defect surface
 * as a hidden pane: unmount it and a dirty edit inside it is gone, with nothing failing. */
{
  const grp = code("components/studio/blocks/CollapsibleGroup.tsx");
  const fields = code("components/studio/blocks/fields.tsx");
  t("B2.1: a folded group hides its body — it does not stop rendering it",
    /<div id=\{bodyId\} hidden=\{!open\}/.test(grp), true);
  // The wrong shape, refused by name, exactly as A2 refuses the board ternary.
  t("B2.2: the body is NOT behind `{open && …}` — the shape that drops a dirty edit on collapse",
    /\{\s*open\s*&&/.test(grp), false);
  // THE ANCHOR MOVED WHEN THE BLOCK ADDRESS LANDED ON THIS SAME ELEMENT (the T0/T3 echo target),
  // and the PROPERTY is unchanged: `hidden` is still its own attribute on the root, separate from
  // `open`, so a card hidden under Style still renders. Matched on the two attributes rather than
  // on the whole tag, so the next prop added here does not break it again.
  t("B2.3: `hidden` (the Style-tab axis) and `open` are SEPARATE — a card hidden under Style must still not unmount",
    /<div hidden=\{hidden\}[^>]*className=\{className\}/.test(grp), true);
  // #253 SPLIT THE HEAD INTO A STATIC NAME PLUS A LIVE SUMMARY, so the prop this anchored on
  // moved from `summaryClassName` to `nameClassName`. The property is unchanged — ItemRows folds
  // through the SHARED group rather than a local copy — so the anchor moves with it.
  t("B2.4: ItemRows rows fold through the shared group rather than a local copy",
    /<CollapsibleGroup[\s\S]{0,900}nameClassName=\{groupLabelCls\}/.test(fields), true);
  t("B2.4: …and the head carries BOTH an ordinal name and a content summary, not one slot doing two jobs",
    /name=\{rowName\}[\s\S]{0,120}summary=\{rowSummary\}/.test(fields), true);

  /* THE ADD-THEN-FOCUS TRAP, PINNED IN SOURCE AND DRIVEN BELOW.
   * `useItemList.add` records the new index in `pendingFocus`; `focusRef` claims it by calling
   * `el.focus()` when the row's first input mounts. FOCUS ON A HIDDEN ELEMENT SILENTLY NO-OPS,
   * so a new row rendered folded swallows the focus and Add looks broken while nothing fails —
   * this project's recurring failure shape. `defaultOpen` is read once at mount and a new row
   * mounts fresh, so reading `pendingFocus` there opens exactly the row about to claim focus. */
  t("B2.5: a newly added row opens, because focus on a hidden element is a silent no-op",
    /defaultOpen=\{list\.pendingFocus\.current === i\}/.test(fields), true);
  t("B2.6: …and `useItemList` still exposes the ref that assertion depends on",
    /pendingFocus,/.test(code("components/studio/useItemList.ts")), true);
}

/* ================================================ B3. NOTHING INSIDE THE PANE MAY CLIP
 * The source half of the reachability rule. `overflow-hidden` on a box that is as tall as its
 * scroll container is a box that clips with nowhere to scroll — see REACHABILITY_SCRIPT. */
{
  // THIS LIST USED TO BE FIVE NAMES TYPED BY HAND, AND THAT IS EXACTLY THE DEFECT #248 FOUND.
  // #245 removed the frame from five panels chosen by hand; Skills' `CategoryPanel` was never in
  // the list, kept its frame, and this assertion could not see it either. Derived now: the panels
  // are whatever the three shell hosts render BETWEEN the layout's tags. See `studio-ink` E1b/E1c,
  // which derives the same set for the frame rule.
  const hosts = ["app/studio/(dashboard)/settings/page.tsx",
                 "components/studio/ExperienceListEditor.tsx",
                 "components/studio/SkillsEditor.tsx"];
  const shellPanels = [...new Set(hosts.flatMap((h) =>
    [...(/<ListDetailLayout[\s\S]*?>([\s\S]*?)<\/ListDetailLayout>/.exec(code(h))?.[1] ?? "")
      .matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1])))];
  t("B3.1: the derived shell-panel set is non-empty and includes the panel the by-name sweep missed",
    shellPanels.includes("CategoryPanel") && shellPanels.length >= 6, true);
  const fileFor = (n) => (n === "CategoryPanel" ? "SkillsEditor" : n);
  const clipping = shellPanels.filter((f) =>
    /<section[\s\S]{0,200}?overflow-hidden/.test(code(`components/studio/${fileFor(f)}.tsx`)));
  t("B3.1: no panel inside the list-detail pane clips its own overflow",
    clipping, []);
  // The pane is declared the scroller; if that ever stops being true the script above has nothing
  // to check against.
  // ANCHORED ON THE EXTRACTED CLASS EXPRESSION, NOT ON A CHARACTER WINDOW FROM `id="ld-panel"`.
  // The window was 400 chars and #248's comment pushed the class past it — comment-stripping
  // removes the text but leaves the newlines and indentation. A window that measures distance in
  // characters fails when someone writes a paragraph, which is the wrong reason to fail.
  const paneCls = /id="ld-panel"[\s\S]*?className=\{`([^`]*)`\}/.exec(code("components/studio/ListDetailLayout.tsx"))?.[1] ?? "";
  t("B3.2: …and the pane is still the declared scroller",
    paneCls.includes("lg:overflow-y-auto"), true);

  /* ---- B4 · THE UNDERFLOW REGIME, WHICH IS THE INVERSE OF EVERYTHING ABOVE ------------------
   *
   * B3 AND THE REACHABILITY SCRIPT ONLY ASK WHAT HAPPENS WHEN CONTENT IS TALLER THAN THE PANE.
   * #245 verified at 600 and 700px and passed, and the save bar was still wrong at every size the
   * owner uses — because the bug lives in the OPPOSITE regime. When the content is SHORTER than
   * the pane there is no scrolling, and `position: sticky` never offsets an element from its
   * static position unless scrolling would carry it out of the sticky region. So `sticky` was
   * present, `bottom: 0` was set, the offset measured correctly, and the bar floated anyway:
   * 61px at 1440x820, 295px at 1076x1054. BIGGER SCREEN, WORSE BUG — backwards from where anyone
   * tests, which is why three reports preceded any failing assertion.
   *
   * NEITHER HALF IS SUFFICIENT ALONE, and that is the finding rather than a footnote:
   *   overflow  -> `sticky bottom-0` pins the bar to the scrollport. `mt-auto` is inert.
   *   underflow -> `mt-auto` in a flex column consumes the free space. `sticky` is inert.
   * Both must be present, so both are asserted, together with the `grow` that gives the section
   * the pane's height in the first place. Growing the section alone does NOT fix it — measured,
   * the section filled the pane at 755 and the bar still sat at 759. */
  {
    const ld = code("components/studio/ListDetailLayout.tsx");
    const pane = /id="ld-panel"[\s\S]*?className=\{`([^`]*)`\}/.exec(ld)?.[1] ?? "";
    t("B4: the pane's class expression was found", pane.length > 0, true);
    for (const [what, cls] of [
      ["the section is given the pane's height", "lg:[&>section]:grow"],
      ["…as a flex COLUMN, so its footer can be pushed", "lg:[&>section]:flex"],
      ["…column direction, not row", "lg:[&>section]:flex-col"],
      ["…and the footer takes the free space above it — the UNDERFLOW half", "lg:[&>section>footer]:mt-auto"],
    ]) t(`B4: ${what}`, pane.includes(cls), true);

    // The OVERFLOW half still has to be there, on every derived panel, or scrolling regresses.
    const notSticky = shellPanels.filter((n) =>
      !/<footer[^>]*className="sticky bottom-0/.test(code(`components/studio/${fileFor(n)}.tsx`))
      && /<footer/.test(code(`components/studio/${fileFor(n)}.tsx`)));
    t("B4: every shell panel's footer keeps `sticky bottom-0` — the OVERFLOW half, which mt-auto does not replace",
      notSticky, ["CategoryPanel"]);
    t("B4: …and CategoryPanel is the one exception, because Skills' save bar is DOCUMENT-level (#229) and sits outside the shell",
      /<\/ListDetailLayout>[\s\S]*<footer/.test(code("components/studio/SkillsEditor.tsx")), true);

    /* ---- B5 · THE CHAIN ABOVE THE SHELL, WHICH IS WHERE SKILLS BROKE --------------------
     *
     * `data-studio-fullheight` was present on Skills and the layout's `:has()` rule DID match,
     * and the rail was still 489px in a 1054px viewport. The attribute proves the shell OPTED
     * IN; it proves nothing about whether anything gave it a height. The chain broke one level
     * ABOVE the shell, in the host's own wrapper.
     *
     * THE RULE DERIVES FROM A REAL STRUCTURAL DIFFERENCE, not from naming the page. A host that
     * renders the layout as its only content lets it inherit `<main>`'s flex context directly —
     * `ExperienceListEditor` and the settings route both do, and both were always correct. The
     * moment a host renders a SIBLING alongside the shell it must wrap them, and that wrapper
     * becomes the load-bearing flex item. So: sibling => the wrapper must stretch. */
    const hosts2 = ["app/studio/(dashboard)/settings/page.tsx",
                    "components/studio/ExperienceListEditor.tsx",
                    "components/studio/SkillsEditor.tsx"];
    const withSibling = hosts2.filter((h) => {
      const after = code(h).split("</ListDetailLayout>")[1] ?? "";
      // A MODAL IS NOT A SIBLING IN THE LAYOUT SENSE. Experience renders dialogs after the shell;
      // they are overlays that take no space in the column, so they cannot starve it of height.
      return /<[a-z]/.test(after.replace(/<StudioModal[\s\S]*?\/StudioModal>/g, ""));
    });
    t("B5: exactly one host renders a space-taking sibling beside the shell",
      withSibling, ["components/studio/SkillsEditor.tsx"]);
    const notStretching = withSibling.filter((h) => {
      const before = code(h).split("<ListDetailLayout")[0];
      const wrapper = [...before.matchAll(/className="([^"]*)"/g)].pop()?.[1] ?? "";
      return !(wrapper.includes("lg:flex-1") && wrapper.includes("lg:min-h-0"));
    });
    t("B5: …and its wrapper stretches, or the shell inside it has only content height to fill",
      notStretching, []);

    /* ---- B6 · THE RAIL FOOTER, PINNED BY STRUCTURE AND PAINTED FROM THE CONTRACT ----------
     *
     * THE PINNING WAS ALREADY CORRECT WHEN THIS WAS REPORTED, AND IT IS WORTH SAYING WHY IT DID
     * NOT NEED #248's FIX. The row list is `flex-1` with its OWN `overflow-y-auto`, and the
     * footer is its SIBLING in a flex column — so the rows scroll inside their own box and the
     * footer cannot move. Driven both ways before any edit: with the rows scrolled fully to the
     * end the button's bottom was unchanged. No sticky rule was needed or added.
     *
     * WHAT WAS ACTUALLY WRONG WAS THE SEPARATOR, and not in the way it looks. There was no
     * footer rule at all; the only line near that edge was the LAST ROW's `border-b`, which
     * lands on the list's bottom edge ONLY when the rows are scrolled to the end — measured, at
     * the edge scrolled-down and 147px below it scrolled-up. The rail therefore appeared to have
     * a footer rule exactly when it did not need one. **A separator that belongs to the content
     * is not a separator, it is a coincidence**, so these assert the rule is on the FOOTER.
     *
     * The three structural facts below are what make the pinning true. Break any one and the
     * footer starts travelling with the rows. */
    const rail = /role="tablist"[\s\S]*?<\/nav>/.exec(code("components/studio/ListDetailLayout.tsx"))?.[0] ?? "";
    t("B6: the rail markup was found", rail.length > 0, true);
    const list = /<ul className="([^"]*)"/.exec(rail)?.[1] ?? "";
    t("B6: the ROW LIST owns the scrolling — `flex-1` so it takes the free height, `overflow-y-auto` so it consumes it",
      list.includes("flex-1") && list.includes("overflow-y-auto"), true);
    // NO `||` HERE. This assertion originally offered a second way to pass ("the footer exists and
    // carries a border-t"), which is true whether or not the footer is inside the list — so the
    // mutation that moves it inside, the one defect this assertion exists to catch, passed. An
    // alternative clause in a structural assertion is a way for the structure to stop being
    // checked. The order of the two tags IS the property: `</ul>` must close before the footer.
    t("B6: …and the add control is the list's SIBLING, not inside it — inside, it would scroll away with the rows",
      rail.indexOf("</ul>") > 0 && rail.indexOf("</ul>") < rail.indexOf("onAddItem &&"), true);
    const footer = /onAddItem && \([\s\S]*?<div className="([^"]*)"/.exec(rail)?.[1] ?? "";
    t("B6: the separator is the FOOTER's own border-top, so it does not depend on where the rows happen to be scrolled",
      footer.includes("border-t"), true);

    /* THE PAINT IS COMPARED TO THE CONTRACT FILE, not retyped here. Both page contracts carry a
     * byte-identical `.lf` block; that equality is asserted first, so a divergence between them
     * fails loudly instead of one silently winning. */
    const lfRule = (p) => /\.ldrail \.lf button\{([^}]*)\}/.exec(read(p))?.[1] ?? "";
    const [expRule, skRule] = ["docs/studio/studio-page-experience.html",
                               "docs/studio/studio-page-skills.html"].map(lfRule);
    t("B6: both page contracts specify the same footer button — if they diverge, neither is 'the' contract",
      expRule === skRule && expRule.length > 0, true);
    const num = (prop) => new RegExp(`${prop}:\\s*([\\d.]+)px`).exec(expRule)?.[1];
    const btnCls = /onAddItem && \([\s\S]*?<button[\s\S]*?className="([^"]*)"/.exec(rail)?.[1] ?? "";
    // The contract's px values, mapped to the utility that produces them. The map is the only
    // hand-written part and every entry is one number; the VALUES come from the file.
    const AS_UTILITY = { "36": "h-9", "12": "text-[12px]", "600": "font-semibold" };
    t("B6: the contract still asks for a 36px button at 12px/600 — if it changes, the row below must too",
      [num("height"), /font:\s*(\d+)/.exec(expRule)?.[1], /font:\s*\d+\s+([\d.]+)px/.exec(expRule)?.[1]],
      ["36", "600", "12"]);
    for (const [what, cls] of [
      ["height", AS_UTILITY["36"]], ["size", AS_UTILITY["12"]], ["weight", AS_UTILITY["600"]],
      ["the ink-800 the contract names", "text-ink-800"],
      ["the cream-50 fill", "bg-cream-50"],
      ["the dashed rule-edge border", "border-dashed"], ["…at /22, which IS rule-edge", "border-ink-950/22"],
      ["the control radius, not the card radius", "rounded-[var(--studio-radius-control,4px)]"],
      ["#246's hover, unchanged by the restyle", "hover:border-solid"],
    ]) t(`B6: the footer button carries ${what}`, btnCls.includes(cls), true);
    t("B6: …and NOT the card radius it used to have — that step belongs to a card, not a control",
      btnCls.includes("--studio-radius-card"), false);
  }
}

/* ================================================ C. THE INSPECTOR RENDERS EXACTLY ONCE
 * Above the fold it mounts in the shell's inspector slot, below it in the canvas slot. Two copies
 * would be two form trees sharing one onChange, with colliding ids and two carets — the reason
 * `usePageWidthMin` exists rather than a CSS answer. */
t("C1: `inspectorNode` is built once and placed by the fold, never rendered twice",
  (panel.match(/const inspectorNode = \(/g) ?? []).length, 1);
t("C2: the fold chooses the PARENT — inspector in the canvas slot below it, its own slot above",
  /canvas=\{!inspectorFits && view === "inspector" \? inspectorNode : canvasNode\}/.test(panel)
    && /inspector=\{inspectorFits \? inspectorNode : null\}/.test(panel), true);

/* ================================================ D. THE DRIVEN PROOF
 * Paste into the console at /studio/projects/<slug> (a CMS-driven study — NOT boat-crest, which
 * is hand-built with no sections at all, hazard 28). It counts form nodes in the tree across
 * every view transition; the counts must not move. */
/* ---- REACHABILITY. A NEW ASSERTION, NOT A STRONGER VERSION OF AN EXISTING ONE ---------------
 *
 * #242 made the list-detail pane the scroller, and #245 found that 61px of the Experience form
 * was unreachable at a 700px viewport and 161px at 600 — the panel `<section>` carried
 * `overflow-hidden` for its rounded corners, sat exactly as tall as the pane, and clipped with no
 * scrollbar and no gesture that reached it. The last field sat behind the save bar.
 *
 * WHY NOTHING CAUGHT IT, WHICH IS THE USEFUL HALF. #242's gates measured two things: that the
 * save bar was reachable without scrolling, and how much content ROOM the pane had. **Neither
 * asked whether the content EXCEEDED the room.** A pane can have 422px of room, a save bar
 * perfectly placed, and 161px of form below the fold with no way down — every existing assertion
 * passes and the page is broken. So this is a new question, not a tighter answer to an old one:
 *
 *     if content is taller than its pane, SOMETHING must be able to scroll.
 *
 * Driven, because the defect is a computed-style interaction — an ancestor's `overflow` against a
 * height chain — and no class string states it. */
export const REACHABILITY_SCRIPT = String.raw`
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const pane = document.getElementById('ld-panel');
  if (!pane) return JSON.stringify({ skipped: 'not a list-detail page' });
  const scrollableAncestorOf = (el) => {
    let n = el;
    while (n && n !== document.body) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
      n = n.parentElement;
    }
    return document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight
      ? document.scrollingElement : null;
  };
  const rows = [];
  for (const h of [900, 700, 600]) {
    // The harness cannot resize the window from script; the caller sets each height and re-runs.
    // When run once, it reports the CURRENT height only — which is why the gate drives three.
    if (window.innerHeight !== h) continue;
    const fields = [...pane.querySelectorAll('input, textarea')].filter(f => f.offsetParent);
    const last = fields[fields.length - 1];
    const overflow = Math.max(0, pane.scrollHeight - pane.clientHeight);
    const clippedInside = [...pane.querySelectorAll('*')]
      .filter(e => { const o = getComputedStyle(e).overflowY;
                     return o === 'hidden' && e.scrollHeight > e.clientHeight + 1; })
      .map(e => ({ tag: e.tagName.toLowerCase(), clipped: e.scrollHeight - e.clientHeight }));
    rows.push({ viewportH: h,
      paneScrolls: pane.scrollHeight > pane.clientHeight,
      lastFieldReachable: last ? !!scrollableAncestorOf(last) || last.getBoundingClientRect().bottom <= window.innerHeight : null,
      clippedByAHiddenAncestor: clippedInside,
      REACHABLE: clippedInside.length === 0 });
  }
  return JSON.stringify({ rows, verdict: rows.every(r => r.REACHABLE) ? 'PASS' : 'FAIL — content is clipped with no scroller' }, null, 1);
})()
`;

export const MOUNT_SCRIPT = String.raw`
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const count = () => ({
    editors: document.querySelectorAll('#cs-fieldtab-panel > div').length,
    inputs:  document.querySelectorAll('#cs-fieldtab-panel input, #cs-fieldtab-panel textarea').length,
  });
  const byText = (t) => [...document.querySelectorAll('button')].find(b => (b.textContent||'').trim() === t);
  const rows = [...document.querySelectorAll('[aria-current]')];
  const snap = {};
  snap.start = count();
  const firstSection = [...document.querySelectorAll('li button[aria-current], li button')][0];
  if (firstSection) { firstSection.click(); await wait(250); }
  snap.onSection = count();
  byText('Board')?.click();  await wait(250); snap.onBoard  = count();
  byText('Editor')?.click(); await wait(250); snap.onEditor = count();

  // PR 8 — the collapse cycle. Folding a group must not remove one field from the tree.
  const card = [...document.getElementById('cs-fieldtab-panel').children]
    .find(c => c.tagName === 'DIV' && !c.hidden);
  const toggles = () => [...card.querySelectorAll('button[aria-expanded]')];
  toggles().filter(b => b.getAttribute('aria-expanded') === 'true').forEach(b => b.click());
  await wait(300); snap.allCollapsed = count();
  toggles().filter(b => b.getAttribute('aria-expanded') === 'false').forEach(b => b.click());
  await wait(300); snap.allExpanded = count();

  const keys = ['onSection','onBoard','onEditor','allCollapsed','allExpanded'];
  const stable = keys.every(k =>
    snap[k].editors === snap.start.editors && snap[k].inputs === snap.start.inputs);

  // PR 8 — the add-then-focus trap, driven. A new row must render OPEN and take focus.
  let addVerdict = 'no Add control on this section';
  const add = [...card.querySelectorAll('button')].find(b => /^Add /.test((b.textContent||'').trim()));
  if (add) {
    const before = toggles().length;
    add.click(); await wait(400);
    const grown = toggles().length > before;
    // THE ASSERTION IS ON VISIBILITY, AND THAT IS THE POINT. The trap is that focus on a hidden
    // element no-ops SILENTLY, so "did focus land" is not enough — a folded row would leave
    // activeElement on <body> or on whatever held focus before. An input that is BOTH the active
    // element and non-zero height proves every ancestor group is open, which is the property.
    const a = document.activeElement;
    const landed = !!a && /INPUT|TEXTAREA/.test(a.tagName) && card.contains(a);
    const visible = landed && a.getBoundingClientRect().height > 0;
    addVerdict = { rowAdded: grown, focusLandedOnAField: landed, andItIsVisible: visible,
      PASS: grown && visible };
  }

  return JSON.stringify({ snap, MOUNT_DISCIPLINE_HOLDS: stable, addThenFocus: addVerdict,
    verdict: stable ? 'PASS' : 'FAIL — a view change or a collapse unmounted a form' }, null, 1);
})()
`;

/* ---- E · THE RAIL FILTER READS THE VOCABULARY IT WAS GIVEN --------------------------------
 * Site settings opted into the rail search, and its four sections are FIXED — Hero, About,
 * Links, Process — so a name-only filter would be near-useless: the field an author hunts is
 * usually named nothing like its section. "resume" is under Links, "photo" under About,
 * "scroll cue" under Hero.
 * `STUDIO_SETTINGS_SECTIONS` HAD ALREADY AUTHORED THAT VOCABULARY for the global studio search,
 * so the rail reads the same `keywords` rather than a second list that could drift. Driven:
 * "resume" returns Links, "photo" returns About, "scroll cue" returns Hero, and a name still
 * matches by name. */
{
  const ldl = code("components/studio/ListDetailLayout.tsx");
  const settings = code("app/studio/(dashboard)/settings/page.tsx");
  const sections = code("lib/studio/settings-sections.ts");

  t("E1: the rail filter matches keywords, not just the name and meta",
    /`\$\{s\.name\} \$\{s\.meta \?\? ""\} \$\{s\.keywords \?\? ""\}`/.test(ldl), true);

  t("E2: …and `keywords` is a declared, optional field on the section type",
    /keywords\?: string;/.test(ldl), true);

  /* THE OPT-IN IS UNCHANGED. A default placeholder would put a search box on every consumer,
   * which is what the prop's original reasoning refused; settings now opts in explicitly. */
  t("E3: settings opts in by naming what it searches, rather than a default appearing",
    /searchPlaceholder="Search settings"/.test(settings), true);

  t("E4: …and the vocabulary is the one the global search already uses — not a second copy",
    /keywords: "hero copy signature tabs role label scroll cue"/.test(sections)
      && /keywords: "links resume email social urls"/.test(sections), true);
}

/* ---- F · THE HEADER BAND IS ONE HEIGHT, AND IT IS STATED ----------------------------------
 * Three bars sit in the row under the crumb: the rail's search, the canvas header, and the
 * details toggles. Their bottom borders are meant to land on one pixel, and they did not —
 * measured at 197 / 191.3 / 219 before this.
 * ⚠ THE LITERAL FIX WAS NOT AVAILABLE. Bringing the toggles down to the canvas header's 59.3px
 * would have needed ~1px of padding around 56px of content, because the toggles stack a label
 * over a switch. So both moved to 65 — the height the entry-panel headers and the rail search
 * already sit at, measured, so it is the band's existing value rather than a new one.
 * STATED, NOT DERIVED. Both carry `h-[65px]` rather than a padding pair tuned to today's content.
 * The toggles' content is 56px and the canvas header's is 20.3px; a padding computed from either
 * would drift the moment a label's leading or a chip's padding moved, and the bar would silently
 * stop aligning with nothing to say so. Same rule the reorder cluster and the search field were
 * both fixed to follow: state the box, do not negotiate for it. */
{
  const shell = code("components/studio/ThreePaneShell.tsx");
  const panel = code("components/studio/ProjectsEditPanel.tsx");

  t("F1: the canvas header states its height rather than deriving it from padding",
    /className="flex h-\[65px\] flex-none items-center gap-2\.5 border-b border-ink-950\/12 px-\[18px\]/.test(shell), true);

  t("F2: the details toggles bar states the same height",
    /className="flex h-\[65px\] items-center gap-3 border-b border-ink-950\/12 bg-cream-200 px-4"/.test(panel), true);

  t("F3: …and neither reverted to a vertical padding, which is what drifts",
    /h-\[65px\][^"]*py-\[/.test(shell) || /h-\[65px\][^"]*py-\[/.test(panel), false);

  /* PREVIEW AND CANCEL LEFT THE TOGGLES UNIT. In it they wrapped onto a second line — the toggles
   * take `w-full` — so two ACTIONS sat under two SWITCHES on one ground with nothing between
   * them. They belong with the save, which is what a footer is. */
  t("F4: Preview and Cancel are in the footer, not in the toggles bar",
    /<footer[\s\S]*?Preview[\s\S]*?Cancel[\s\S]*?Save details/.test(panel), true);

  t("F5: …and their hover moved to cream-100, because the footer IS cream-200",
    /hover:bg-cream-100[\s\S]{0,400}Preview/.test(panel)
      && /hover:bg-cream-200[\s\S]{0,200}Preview/.test(panel) === false, true);
}

console.log(`\nmount-discipline result: ${pass} passed, ${fail} failed`);
console.log("  (Part D is a browser script — paste MOUNT_SCRIPT at /studio/projects/<slug>.)");
process.exit(fail === 0 ? 0 : 1);
