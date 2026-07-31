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

/* ================================================ C. THE INSPECTOR RENDERS EXACTLY ONCE
 * Above the fold it mounts in the shell's inspector slot, below it in the canvas slot. Two copies
 * would be two form trees sharing one onChange, with colliding ids and two carets — the reason
 * `useMediaMin` exists rather than a CSS answer. */
t("C1: `inspectorNode` is built once and placed by the fold, never rendered twice",
  (panel.match(/const inspectorNode = \(/g) ?? []).length, 1);
t("C2: the fold chooses the PARENT — inspector in the canvas slot below it, its own slot above",
  /canvas=\{!inspectorFits && view === "inspector" \? inspectorNode : canvasNode\}/.test(panel)
    && /inspector=\{inspectorFits \? inspectorNode : null\}/.test(panel), true);

/* ================================================ D. THE DRIVEN PROOF
 * Paste into the console at /studio/projects/<slug> (a CMS-driven study — NOT boat-crest, which
 * is hand-built with no sections at all, hazard 28). It counts form nodes in the tree across
 * every view transition; the counts must not move. */
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
  const stable = ['onSection','onBoard','onEditor'].every(k =>
    snap[k].editors === snap.start.editors && snap[k].inputs === snap.start.inputs);
  return JSON.stringify({ snap, MOUNT_DISCIPLINE_HOLDS: stable,
    verdict: stable ? 'PASS' : 'FAIL — a view change unmounted a form' }, null, 1);
})()
`;

console.log(`\nmount-discipline result: ${pass} passed, ${fail} failed`);
console.log("  (Part D is a browser script — paste MOUNT_SCRIPT at /studio/projects/<slug>.)");
process.exit(fail === 0 ? 0 : 1);
