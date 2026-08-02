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
  INSPECTOR_BOUNDS,
  INSPECTOR_FALLBACK_PX,
  CS_INSPECTOR_COLLAPSED_PX,
} from "../../lib/studio/inspector-width.ts";
import { CS_CANVAS_MIN_PX, BLOG_CANVAS_MIN_PX } from "../../lib/studio/three-pane.ts";

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
  t("A1: each surface carries its own measured floor and its own by-role ceiling", INSPECTOR_BOUNDS, {
    cs:   { min: 267, max: 640, fallback: 320, cookie: "studio-inspector-w-cs" },
    blog: { min: 185, max: 794, fallback: 320, cookie: "studio-inspector-w-blog" },
  });

  /* ⚠ TWO COOKIES, BECAUSE THE BOUNDS DIFFER. One cookie would force the wider floor on both, so
   * blog would lose the 185…266 band its content can legitimately use, and a width set on one
   * surface would silently narrow the other. Asserted as DISTINCT rather than as present. */
  t("A1: the two cookies are distinct, so neither surface can clamp the other's width",
    INSPECTOR_BOUNDS.cs.cookie !== INSPECTOR_BOUNDS.blog.cookie, true);

  /* EACH CEILING IS THAT SURFACE'S OWN CANVAS FLOOR — one by-role sentence, two numbers, because
   * the canvases differ: the case study's floor is a SCALE (1280 × 0.5) and blog's is its MEASURE
   * (68ch + padding). THESE ASSERTIONS ARE THE ONLY THING HOLDING THEM TOGETHER — see below for
   * why the import that would have done it cannot exist. */
  t("A1: the ceilings ARE the canvas floors, not two invented numbers",
    [INSPECTOR_BOUNDS.cs.max === CS_CANVAS_MIN_PX, INSPECTOR_BOUNDS.blog.max === BLOG_CANVAS_MIN_PX],
    [true, true]);

  t("A1: the shipped default is unchanged on both, so no author's geometry moved",
    [INSPECTOR_BOUNDS.cs.fallback, INSPECTOR_BOUNDS.blog.fallback, INSPECTOR_FALLBACK_PX],
    [320, 320, 320]);

  /* ⚠ AND THE MODULE DOES NOT IMPORT THOSE FLOORS, WHICH IS WHY THE ASSERTION ABOVE IS
   * LOAD-BEARING RATHER THAN DECORATIVE. Importing them is the obvious move and it does not
   * survive: ralph loads this as a raw `.ts` leaf, Node's ESM needs the extension, and `tsc`
   * rejects a `.ts` extension without `allowImportingTsExtensions`. The property that makes this
   * file testable forbids the import. So the maxima are second copies — the #194 shape — and A1
   * is the gate that catches them drifting. Asserted as an ABSENCE so nobody "tidies" the import
   * back in and breaks every ralph suite that loads this file. */
  t("A1: …and it stays a leaf, because an import here would break the loader that tests it",
    /^import /m.test(code("lib/studio/inspector-width.ts")), false);

  for (const [surface, min, max] of [["cs", 267, 640], ["blog", 185, 794]]) {
    const table = {};
    for (const v of [0, 1, Math.floor(min / 2), Math.floor(min / 2) + 1, min - 1, min, min + 1, 320, max, max + 1, 9999, -40, "abc", null])
      table[String(v)] = clampInspectorWidth(v, surface);
    t(`A2: ${surface} — every input resolves, and the hole between 0 and ${min} is real`, table, {
      "0": 0, "1": 0,
      [String(Math.floor(min / 2))]: 0,            // at or below half the floor → collapsed
      [String(Math.floor(min / 2) + 1)]: min,      // above it → snapped up
      [String(min - 1)]: min, [String(min)]: min, [String(min + 1)]: min + 1,
      "320": 320, [String(max)]: max, [String(max + 1)]: max, "9999": max,
      "-40": 0, "abc": 320, "null": 320,
    });

    /* ⚠ NOTHING MAY LAND IN THE GAP, whatever the input. Asserted across the whole span rather
     * than at its edges, because an off-by-one in the snap is invisible where people test. */
    const inGap = [];
    for (let v = -50; v <= max + 60; v++) {
      const r = clampInspectorWidth(v, surface);
      if (r !== 0 && (r < min || r > max)) inGap.push([v, r]);
    }
    t(`A2: ${surface} — …and no input resolves into the forbidden band`, inGap, []);
  }

  /* ⚠ THE SURFACE IS REQUIRED, WITH NO DEFAULT. A default would silently apply one surface's
   * floor to the other — the exact failure two cookies exist to prevent, one layer down. */
  t("A2: the two surfaces really do resolve differently at the same input",
    [clampInspectorWidth(200, "cs"), clampInspectorWidth(200, "blog")], [267, 200]);

  /* ⚠ AND THE ARGUMENT MUST STAY REQUIRED, ASSERTED AS AN ABSENCE — the one hole mutation found
   * in this part. Giving it a default changes NOTHING at runtime, because every call site passes
   * a surface, so no behavioural assertion can see it. What it removes is the TYPE error that
   * makes a forgotten surface impossible: with a default, a new call site silently clamps blog's
   * pane to the case study's 267 floor. The protection is compile-time, so the gate has to be
   * about the source. */
  t("A2: …and the surface argument carries no default, or a forgotten one clamps to the wrong floor",
    /surface: InspectorSurface\s*=/.test(code("lib/studio/inspector-width.ts")), false);

  t("A3: collapse is a width, not a flag, so the arithmetic needs no special case",
    [isInspectorCollapsed(0), isInspectorCollapsed(185), isInspectorCollapsed(320)], [true, false, false]);
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
  t("D3: the pane's width is the property, with a fallback that is the shipped default",
    /lg:w-\[var\(--studio-inspector-w,320px\)\]/.test(shell), true);

  /* ⚠ BOTH SURFACES NOW RESIZE, AND THE DECLARATION MOVED INTO THE SHELL BECAUSE OF IT. #283 put
   * it on the case study's own wrapper, when only that surface resized; blog resizing makes two,
   * and two is when a pattern moves into the seam — this repo's "extract at the SECOND consumer"
   * rule rather than a preference. The SSR value and the per-move write must land on the same
   * element, and the shell root is the nearest shared ancestor of the aside. */
  t("D3: the shell root carries the declaration, so both surfaces share one seam",
    /<div ref=\{rootRef\} style=\{rootStyle\} data-studio-fullheight/.test(shell), true);
  for (const host of ["SectionsEditPanel", "BlogBlocksEditPanel"]) {
    t(`D3: …and ${host} hands the shell its width and its handle`,
      /rootRef=\{ins\.rootRef\}/.test(code(`components/studio/${host}.tsx`))
        && /rootStyle=\{ins\.styleVar\}/.test(code(`components/studio/${host}.tsx`))
        && /<InspectorResizer/.test(code(`components/studio/${host}.tsx`)), true);
  }
}

/* ================================================= E. THE COOKIE, CLAMPED ON THE READ
 *
 * Clamping only on write is the bug this shape exists to avoid: a cookie written while the max was
 * wider outlives the build that allowed it. Clamping on READ makes the stored value ADVISORY. */
{
  /* ⚠ EACH ROUTE READS ITS OWN COOKIE AND NAMES ITS OWN SURFACE. `clampInspectorWidth` takes the
   * surface with NO DEFAULT precisely so this cannot be got wrong silently: a missing argument is
   * a type error rather than one pane quietly clamped to the other's floor. */
  for (const [route, surface] of [["projects/[slug]", "cs"], ["blog/[slug]", "blog"]]) {
    const page = code(`app/studio/(dashboard)/${route}/page.tsx`);
    t(`E1: ${surface} — the width is read and clamped on the SERVER against its own bounds`,
      new RegExp(`clampInspectorWidth\\(\\s*\\(await cookies\\(\\)\\)\\.get\\(INSPECTOR_BOUNDS\\.${surface}\\.cookie\\)\\?\\.value,\\s*"${surface}",?\\s*\\)`).test(page), true);
    t(`E1: ${surface} — …and travels as a prop rather than being read again on the client`,
      /inspectorWidth=\{inspectorWidth\}/.test(page), true);
  }
  t("E1: …and the client writes the cookie rather than reading one",
    /document\.cookie = `\$\{cookie\}=/.test(code("components/studio/useInspectorWidth.ts")), true);

  /* TWO COOKIES, ONE PER SURFACE. Asserted by COUNT as well as by name, because "both names exist"
   * would still pass if a third crept in. */
  t("E2: exactly two cookies, one per resizable inspector",
    (code("lib/studio/inspector-width.ts").match(/cookie: "/g) ?? []).length, 2);
}

/* ================================================= F. THE PILL CLEARS THE SAVE BAR
 *
 * The publish pill is fixed near the foot, centred over the work area; every save bar is
 * `sticky bottom-0` inside a pane. So the pill floated in the band the bar occupies and landed ON
 * it — measured at 124 × 40px on the three list-detail pages, where the bar is a 1042px detail
 * column and the centred pill sits inside it, and again on the case study below its fold. */
{
  const pub = code("components/studio/PublishBar.tsx");
  const clear = code("lib/studio/bar-clearance.ts");
  const bar = code("components/studio/SaveBar.tsx");

  /* ⚠ THE PROPERTY NAME IS TWO COPIES — a module constant the bar writes, and a literal inside a
   * class the pill reads, because Tailwind cannot interpolate one into a class name. That is the
   * #194 shape again and it is closed the same way, by asserting the class contains the module's
   * own string rather than by hoping. */
  const VAR = /BAR_CLEARANCE_VAR = "([^"]+)"/.exec(clear)?.[1];
  t("F1: the clearance property is declared once, in its own module", VAR, "--studio-bar-clearance");
  t("F1: …and the pill's class names that exact property, with a 0px fallback",
    pub.includes(`bottom-[calc(var(${VAR},0px)+1.25rem)]`), true);

  /* THE FALLBACK IS WHAT KEEPS THE INDEX PAGES UNCHANGED. They have no save bar, so nothing writes
   * the property and the pill keeps exactly the offset it had. A fixed offset would have had to
   * clear the tallest bar — 117px — and would then float the pill that far up on every page that
   * has none. Driven: /studio/projects computes 20px, byte-for-byte its old value. */
  t("F1: …and no literal offset survives beside it, which would be a second source",
    /bottom-5/.test(pub), false);

  /* ⚠ THE MAXIMUM ACROSS MOUNTED BARS, NOT THE LAST WRITER. Two bars are mounted on the case
   * study — the details form's and the sections form's — with one inside a `hidden` wrapper. A
   * last-writer-wins property lets the hidden one, height 0, clobber the visible one and the pill
   * drops back onto the bar with nothing looking wrong. Driven at 1180: two mounted, one at 0 and
   * invisible, clearance correctly 62. */
  t("F2: the clearance is the tallest VISIBLE bar, so a hidden one cannot clobber it",
    /tallest = Math\.max\(tallest, el\.getBoundingClientRect\(\)\.height\)/.test(clear)
      && /el\.offsetParent === null/.test(clear), true);
  t("F2: …and bars register and unregister, so an unmounted one stops counting",
    /mounted\.add\(el\)/.test(clear) && /mounted\.delete\(el\)/.test(clear), true);

  /* MEASURED, NOT ASSUMED: the height changes when the container query flips the bar between one
   * and two rows, which no interval would catch at the right moment. */
  t("F3: the bar observes its own height rather than measuring once",
    /new ResizeObserver\(republishBarClearance\)/.test(bar) && /registerBar\(el\)/.test(bar), true);
}

/* ================================================= G. THE BLOG FIELDS WRAP RATHER THAN CLIP
 *
 * ⚠ MEASURED IN THE 320px INSPECTOR: the post title needed 299px in a 289px box and the dek 305,
 * so neither could be read without scrolling inside its own field — and they are the two an
 * author writes first.
 * ⚠ RAISING THE PANE'S DEFAULT WAS THE OTHER OPTION AND IT IS WRONG. Blog's canvas has a hard
 * 794px floor, so at a 1585 page a 340px inspector leaves it 738 and the ARTICLE would narrow —
 * the one property that layout exists to protect. The pane cannot widen there, so the field has
 * to stop clipping instead. */
{
  const fields = code("components/studio/blocks/fields.tsx");
  const blog = code("components/studio/BlogEditPanel.tsx");

  t("G1: the wrapping field exists and keeps the shared well's geometry",
    /export function WrappingField/.test(fields) && /className = inputCls/.test(fields), true);

  /* ⚠ THE VALUE STAYS ONE LINE EVEN THOUGH THE BOX HAS TWO. These round-trip to YAML as
   * single-line scalars, so Enter is suppressed and pasted newlines collapse to spaces. Asserted
   * as BOTH halves: blocking the key alone still lets a paste through. */
  t("G1: …and the VALUE cannot gain a newline, by key or by paste",
    /e\.target\.value\.replace\(\/\[\\r\\n\]\+\/g, " "\)/.test(fields)
      && /if \(e\.key === "Enter"\) \{ e\.preventDefault\(\); e\.currentTarget\.blur\(\); \}/.test(fields), true);

  t("G2: both blog head fields use it, and neither is a single-line input any more",
    (blog.match(/<WrappingField/g) ?? []).length === 2
      && /<input\s+type="text"\s+value=\{values\.(title|dek)\}/.test(blog) === false, true);

  /* ⚠ AND IT SITS BELOW THE THREE WELL CONSTANTS, which is not tidiness. studio-ink's E2
   * attributes an inline-geometry match to the last JSX-looking tag before it over RAW source, so
   * a component with a tag in it placed ABOVE them re-attributes all three and fails a gate about
   * something else. The file's header records that trap for a comment; a real tag does it too.
   * Asserted by ORDER, because the failure is positional. */
  t("G3: …and it is declared after the well constants, or E2 re-attributes them to its tag",
    read("components/studio/blocks/fields.tsx").indexOf("export function WrappingField")
      > read("components/studio/blocks/fields.tsx").indexOf("export const inputErrorCls"), true);
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
