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
t("A1: the shell is rendered under a `hidden` prop, so opening the Board cannot unmount it",
  /hidden=\{showBoard\}[\s\S]{0,120}<ThreePaneShell/.test(panel), true);
// The exact wrong shape, refused by name. A ternary putting the board and the shell in the same
// slot is the composition that destroys the inspector.
t("A2: the board and the shell are NOT alternatives of one ternary — the shape that unmounts the forms",
  /showBoard\s*\?[\s\S]{0,200}<ThreePaneShell/.test(panel), false);
t("A3: the board is rendered as its own conditional — it holds no form state, so it MAY unmount",
  /\{showBoard && boardNode\}/.test(panel), true);

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
  t("B2.3: `hidden` (the Style-tab axis) and `open` are SEPARATE — a card hidden under Style must still not unmount",
    /<div hidden=\{hidden\} className=\{className\}>/.test(grp), true);
  t("B2.4: ItemRows rows fold through the shared group rather than a local copy",
    /<CollapsibleGroup[\s\S]{0,900}summaryClassName=\{groupLabelCls\}/.test(fields), true);

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
  const shellPanels = ["AboutEditPanel", "ExperienceEditPanel", "HeroEditPanel",
                       "LinksEditPanel", "ProcessEditPanel"];
  const clipping = shellPanels.filter((f) =>
    /<section[\s\S]{0,200}?overflow-hidden/.test(code(`components/studio/${f}.tsx`)));
  t("B3.1: no panel inside the list-detail pane clips its own overflow",
    clipping, []);
  // The pane is declared the scroller; if that ever stops being true the script above has nothing
  // to check against.
  t("B3.2: …and the pane is still the declared scroller",
    /id="ld-panel"[\s\S]{0,400}?lg:overflow-y-auto/.test(code("components/studio/ListDetailLayout.tsx")), true);
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

console.log(`\nmount-discipline result: ${pass} passed, ${fail} failed`);
console.log("  (Part D is a browser script — paste MOUNT_SCRIPT at /studio/projects/<slug>.)");
process.exit(fail === 0 ? 0 : 1);
