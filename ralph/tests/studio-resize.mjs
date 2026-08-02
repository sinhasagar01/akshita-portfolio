// The resize grip, and the case-study inspector's bounds.
// Run: node --experimental-strip-types ralph/tests/studio-resize.mjs
//
// WHY THIS SUITE EXISTS
//
// Part A is the only part that can prove behaviour: `clampInspectorWidth` is a pure function with
// a HOLE in its range, and a hole is the kind of thing that looks like an off-by-one until you
// drive it. Everything else reads source text and proves a string is present, never what renders —
// stated rather than implied, because the rendered claims live in the PR body where they were
// measured. The two that cannot be gated at all are named at the bottom.
import { readFileSync } from "node:fs";
import {
  clampInspectorWidth,
  isInspectorCollapsed,
  CS_INSPECTOR_MIN_PX,
  CS_INSPECTOR_MAX_PX,
  CS_INSPECTOR_DEFAULT_PX,
  CS_INSPECTOR_COLLAPSED_PX,
} from "../../lib/studio/inspector-width.ts";
import { CS_CANVAS_MIN_PX } from "../../lib/studio/three-pane.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const grip = code("components/studio/StudioResizeGrip.tsx");
const sidebarRz = code("components/studio/SidebarResizer.tsx");
const inspRz = code("components/studio/InspectorResizer.tsx");
const shell = code("components/studio/ThreePaneShell.tsx");

/* ================================================= A. THE BOUNDS, WHICH HAVE A HOLE IN THEM
 *
 * ⚠ THE RANGE IS `0` OR `MIN…MAX`, AND NOTHING BETWEEN. Everything in 1…266 is a pane whose own
 * content overflows it — 267 is the MEASURED `min-content` of the case-study inspector — so the
 * clamp does not merely bound, it SNAPS across the gap. A plain `Math.max(MIN, …)` would make the
 * collapse unreachable by drag, which is the defect this shape exists to prevent. */
{
  t("A1: the bounds are the measured floor and a by-role ceiling",
    [CS_INSPECTOR_MIN_PX, CS_INSPECTOR_MAX_PX, CS_INSPECTOR_DEFAULT_PX, CS_INSPECTOR_COLLAPSED_PX],
    [267, 640, 320, 0]);

  /* THE CEILING IS THE CANVAS FLOOR. The inspector may never be wider than the canvas's own
   * minimum: the canvas is the subject and the inspector is the apparatus, and an apparatus wider
   * than its subject has the roles backwards. THIS ASSERTION IS THE ONLY THING HOLDING THEM
   * TOGETHER — see the note below for why the import that would have done it cannot exist. */
  t("A1: the ceiling IS the canvas floor, not a second copy of 640",
    CS_INSPECTOR_MAX_PX === CS_CANVAS_MIN_PX, true);
  /* ⚠ AND THE MODULE DOES NOT IMPORT IT, WHICH IS WHY THE ASSERTION ABOVE IS LOAD-BEARING RATHER
   * THAN DECORATIVE. Importing the constant is the obvious move and it does not survive: ralph
   * loads these as raw `.ts` leaves, Node's ESM needs the extension, and `tsc` rejects a `.ts`
   * extension without `allowImportingTsExtensions`. The property that makes these files testable
   * forbids the import. So this is a second copy of one measurement — the #194 shape — and A1 is
   * the gate that catches it drifting. Asserted as an ABSENCE so nobody "tidies" the import back
   * in and breaks every ralph suite that loads this file. */
  t("A1: …and it stays a leaf, because an import here would break the loader that tests it",
    /^import /m.test(code("lib/studio/inspector-width.ts")), false);

  const table = {};
  for (const v of [0, 1, 133, 134, 200, 266, 267, 268, 320, 460, 640, 641, 9999, -40, "320", "abc", null, undefined, NaN])
    table[String(v)] = clampInspectorWidth(v);
  t("A2: every input resolves, and the hole is real", table, {
    "0": 0, "1": 0, "133": 0,          // at or below half the minimum → collapsed
    "134": 267, "200": 267, "266": 267, // above it → snapped up to the minimum
    "267": 267, "268": 268, "320": 320, "460": 460, "640": 640,
    "641": 640, "9999": 640,           // the ceiling holds
    "-40": 0,                          // negative is collapsed, never a wrap
    "320": 320, "abc": 320,            // unparseable → the default, never a throw
    "null": 320, "undefined": 320, "NaN": 320,
  });

  /* ⚠ NOTHING MAY LAND IN THE GAP, whatever the input. Asserted over the whole span rather than at
   * its edges, because an off-by-one in the snap is invisible at the boundaries people test. */
  const inGap = [];
  for (let v = -50; v <= 700; v++) {
    const r = clampInspectorWidth(v);
    if (r !== 0 && (r < CS_INSPECTOR_MIN_PX || r > CS_INSPECTOR_MAX_PX)) inGap.push([v, r]);
  }
  t("A2: …and no input in -50…700 resolves into the forbidden band", inGap, []);

  t("A3: collapse is a width, not a flag, so the arithmetic needs no special case",
    [isInspectorCollapsed(0), isInspectorCollapsed(267), isInspectorCollapsed(320)], [true, false, false]);
}

/* ================================================= B. THE GRIP — ONE RULE, TWO GROUNDS */
{
  /* ⚠ THE GROUND IS A PROP, NOT A COLOUR. A single colour for both is what makes the control look
   * broken on the sidebar: cream-50 on ink-950 is a bright chip on the darkest surface in the
   * product, and white/12 on cream is nothing at all. Passing colours IN would put the rule at
   * every call site, which is how two call sites become two designs. */
  t("B1: both grounds are declared here, in one place",
    /ink: "bg-white\/12 border-white\/22"/.test(grip) && /cream: "bg-cream-50 border-ink-950\/22"/.test(grip)
      && /ink: "bg-white\/55"/.test(grip) && /cream: "bg-ink-400"/.test(grip), true);
  t("B1: …and each seam names its own ground",
    /ground="ink"/.test(sidebarRz) && /ground="cream"/.test(inspRz), true);

  t("B2: the mark is 8px over four 2px dots at 3px gaps — the contract's geometry",
    /w-2 justify-items-center gap-\[3px\]/.test(grip) && /size-0\.5 rounded-full/.test(grip)
      && /\[0, 1, 2, 3\]\.map/.test(grip), true);

  /* ⚠ THE RING IS AN `outline`, NOT THE PROPERTY studio-ink's C10 FORBIDS RAW. A focus ring is not
   * an elevation, so it does not belong to the `--studio-lift-*` family and does not want a token
   * in it — C10 caught the first attempt and it was right to. */
  t("B2: the focus ring is an outline, so no raw elevation literal is invented",
    /group-focus-visible\/rz:outline-2 group-focus-visible\/rz:outline-accent-500\/30/.test(grip), true);

  /* IT IS NOT FOCUSABLE AND HAS NO HANDLERS. Two focusable things on one seam is two tab stops for
   * one control, and the outer element is already a `separator` with a full keymap. */
  t("B3: the grip is inert decoration — the hit area owns the role and the keys",
    /aria-hidden/.test(grip) && /pointer-events-none/.test(grip)
      && /onClick|onPointer|tabIndex/.test(grip) === false, true);
}

/* ================================================= C. BOTH SEAMS, ONE SHAPE
 *
 * ⚠ #237 SHIPPED TWO DEFECTS HERE AND BOTH APPLY AGAIN. An in-flow handle CONSUMES LAYOUT WIDTH —
 * its first version took 4px off the work area, so at a 288px sidebar the canvas measured 645
 * where every sum promised 649, a term nobody put in the arithmetic. And half the hit area was
 * DEAD: `-mr-1` let `main` paint over it, so a pointerdown at the seam reported a button in main
 * and the drag never began. IT LOOKED FINE. The live band is measured by pointerdown in the PR;
 * these assert the two properties that make it possible. */
{
  for (const [name, src, edge] of [["sidebar", sidebarRz, "left"], ["inspector", inspRz, "right"]]) {
    t(`C1: the ${name} handle is absolute and consumes no layout width`,
      /\babsolute\b/.test(src) && /\bflex-none\b/.test(src) === false, true);
    t(`C1: …and it is a 12px target, centred on the seam`,
      new RegExp(`\\bw-3\\b`).test(src) && /-?translate-x-1\.5/.test(src), true);
    t(`C1: …and it rides the same property it drags, so it cannot drift off the seam`,
      new RegExp(`lg:${edge}-\\[var\\(--studio-`).test(src), true);
    t(`C1: …and it is a separator with a value, not a nameless div`,
      /role="separator"/.test(src) && /aria-orientation="vertical"/.test(src)
        && /aria-valuenow=/.test(src) && /tabIndex=\{0\}/.test(src), true);
    /* ⚠ THE WAY BACK MUST BE KEYBOARD-REACHABLE. A drag-only affordance is a pane a keyboard user
     * can close and never reopen. And ENTER TOGGLES AGAINST THE LAST WIDTH, never a fixed default:
     * binding it to the default hands a keyboard user the one width they already had. */
    t(`C1: …and every key is bound, with Enter toggling against the last width`,
      /ArrowLeft/.test(src) && /ArrowRight/.test(src) && /"Home"/.test(src) && /"End"/.test(src)
        && /"Enter"/.test(src) && /last(Wide|Open)\.current/.test(src), true);
  }
}

/* ================================================= D. THE COLLAPSED PANE
 *
 * ⚠ COLLAPSED IS NOT UNMOUNTED. 14 editors and 378 inputs hang off the inspector, and unmounting
 * destroys an unsaved draft, its caret and its id-lockstep — #233 found the natural composition
 * does exactly that, and "it looks like it worked". */
{
  t("D1: the pane is inerted rather than removed",
    /inert=\{inspectorCollapsed\}/.test(shell), true);

  /* ⚠ `inert` AS A REAL BOOLEAN. #178 shipped `"" as unknown as boolean` for this exact prop, and
   * an empty string is FALSY, so React dropped the attribute entirely and the pane it was written
   * to protect stayed fully tabbable. Asserted as the ABSENCE of the cast that did it. */
  t("D1: …and the boolean is real, not the empty-string cast that silently disabled #178's",
    /inert=\{[^}]*as unknown as boolean/.test(shell), false);

  /* ⚠ `border-l-0`, NOT `border-transparent`. A transparent border still OCCUPIES ITS PIXEL —
   * measured, the collapsed pane came out 1px rather than 0. That is the same term `three-pane.ts`
   * records as `27 = 26 + 1`, and it was found the same way both times: by driving it. */
  t("D2: a shut pane has no border, so zero means zero",
    /inspectorCollapsed\s*\?\s*"overflow-hidden border-l-0"/.test(shell), true);

  /* THE WIDTH IS A CUSTOM PROPERTY WITH A FALLBACK, and the fallback is the whole of blog's
   * geometry: blog never declares the property, so its pane resolves to 320 and does not move. */
  t("D3: the pane's width is the property, with the fallback blog rides",
    /lg:w-\[var\(--studio-inspector-w,320px\)\]/.test(shell), true);
  t("D3: …and blog does not declare it — the fixed pane stays fixed",
    /--studio-inspector-w/.test(code("components/studio/BlogBlocksEditPanel.tsx")), false);
  t("D3: …and blog is handed no resizer, because a grip on a fixed seam announces something false",
    /inspectorResizer/.test(code("components/studio/BlogBlocksEditPanel.tsx")), false);
}

/* ================================================= E. THE COOKIE, CLAMPED ON THE READ
 *
 * Clamping only on write is the bug this shape exists to avoid: a cookie written while the max was
 * wider outlives the build that allowed it. Clamping on READ makes the stored value ADVISORY. */
{
  const page = code("app/studio/(dashboard)/projects/[slug]/page.tsx");
  t("E1: the width is read and clamped on the SERVER, so the first render carries it",
    /clampInspectorWidth\(\(await cookies\(\)\)\.get\(CS_INSPECTOR_COOKIE\)\?\.value\)/.test(page), true);
  t("E1: …and travels as a prop rather than being read again on the client",
    /inspectorWidth=\{inspectorWidth\}/.test(page)
      && /document\.cookie/.test(code("components/studio/useInspectorWidth.ts")), true);
  t("E2: ONE cookie, because there is one resizable inspector",
    (code("lib/studio/inspector-width.ts").match(/COOKIE = "/g) ?? []).length, 1);
}

/* ---- ⚠ WHAT THIS SUITE CANNOT PROVE, NAMED RATHER THAN LEFT TO LOOK COVERED ----------------
 *
 *  1. THE LIVE HIT BAND. #237's dead half was a class string that read perfectly; only a
 *     pointerdown returning the handle can tell. Driven in the PR at three page widths, both seams.
 *  2. INERTNESS. `inert` being present is not `inert` working — G3's whole finding. Driven by
 *     attempting focus on every control inside the shut pane and counting zero.
 * Both are in the PR body with their numbers. A suite that implied it covered them would be
 * worse than one that says it does not. */

console.log(`\nstudio-resize result: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
