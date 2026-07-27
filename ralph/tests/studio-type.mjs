// THE MEASURED TYPE TABLE — the studio's rendered type against the ink chrome contract.
//
// NOT RUNNABLE HERE. Like `parity.mjs`, this exports a script to paste into a browser console
// against a running dev server, and the runner names it as skipped rather than dropping it
// silently (#183: the runner reports what it did not run).
//
// ---- WHY A SECOND GATE, WHEN studio-cascade ALREADY EXISTS -----------------------------
//
// The cascade gate is blind BY CONSTRUCTION to a wrong-but-uncontested value. It can only see
// a utility that LOSES to something; a size that is simply the wrong size, with nothing
// competing for it, renders exactly as written and is invisible to any static check.
//
// That is the whole of item 9. The studio's weights ran 100 to 300 lighter than the contract
// across titles, buttons, group headings and segmented controls — every one of them rendering
// precisely what its class said, every one of them wrong. No parser finds that. You have to
// measure the screen and compare it to a specification.
//
// Neither gate covers the other's blind spot, which is why both exist.
//
// ---- THE TWO RULES THIS SCRIPT ENCODES -------------------------------------------------
//
// 1. THE SANITY PAIR RUNS FIRST. Before any real measurement, assert that a known pair reads
//    the value it must (white on black = 21:1, and a 1px canvas round-trip returns the colour
//    it was given). An earlier pass in this arc reported every contrast ratio as ~1.0 —
//    including a genuine 19:1 — because `getComputedStyle().color` returns `oklch(...)`
//    unconverted and the regex read `0.14, 0.018, 60` as if it were RGB. The measurements
//    looked plausible and were uniformly wrong. A harness that cannot prove itself on a known
//    input cannot be trusted on an unknown one.
//
// 2. NEVER PARSE A COMPUTED COLOUR STRING. Rasterise through a 1x1 canvas and read the bytes
//    back. The browser does the colour-space conversion; the script does not guess.
//
// Run: open /studio (dev server), paste TYPE_SCRIPT into the console, on each page below.

export const PAGES = [
  "/studio",
  "/studio/settings",
  "/studio/experience",
  "/studio/projects",
  "/studio/blog",
];

/**
 * The contract's rendered roles, from docs/studio/studio-ink-chrome.html measured in place.
 * `weight` is the value the contract draws, NOT the value its CSS asks for — several of its
 * own rules are defeated by its own resets, which is the same class of bug this suite exists
 * to catch and is recorded as corrections C-9 and C-10 in that file.
 */
export const CONTRACT = {
  "field label":        { size: 11,   weight: 700, ls: 1.54 },
  "field input":        { size: 14,   weight: 400 },
  "sidebar group":      { size: 10.5, weight: 700, ls: 1.89 },
  "section head":       { size: 11.5, weight: 700, ls: 1.84, family: "DM Sans" },
  "section head status":{ size: 11,   weight: 500 },
  "list item title":    { size: 13.5, weight: 500 },
  "list item meta":     { size: 11,   weight: 400 },
  "button":             { size: 12,   weight: 600 },
  "segmented":          { size: 12.5, weight: 600 },
};

/**
 * THE ON-INK FOREGROUNDS, WITH THE RATIOS #211 MEASURED — ASSERTED, NOT RE-DERIVED.
 *
 * WHY THIS TABLE EXISTS AT ALL (hazard 27). The topbar search was excluded from the well walk
 * below by accessible name, and that exclusion was CORRECT: it is an ink surface, not a step on
 * the cream ladder. Then #211 gave that surface four derived on-ink foregrounds — and nothing
 * checked any of them. **The exclusion did not decay; the element grew into it.**
 *
 * AND THE AUDIT FOUND THE HOLE WAS LARGER THAN THAT. This suite previously asserted NOTHING —
 * no harness, no pass/fail, no exit code — it returned a blob for a human to read. So "the
 * suite stays green while its denominator shrinks" was too kind: there was no green. Every
 * contrast number this arc produced lived in commit messages and source comments, which no gate
 * reads. The search was simply the first surface whose requirements made that visible.
 *
 * `min` is the floor, set at the MEASURED value less a small tolerance for antialiasing and
 * token drift — not at the AA threshold, because the point is to catch a REGRESSION from what
 * was deliberately chosen, which is a stricter and more useful test than "still legible".
 * `aa` records which threshold the role must clear on its own terms.
 */
/*
 * EVERY ROW HERE WAS RE-MEASURED IN #214, NOT CARRIED FORWARD. That PR made the topbar SOLID
 * ink-950 to fix the L, which moved the ground every one of these composites against — and
 * six of seven IMPROVED while one REGRESSED below its floor. Carrying the old numbers would
 * have shipped a table that agreed with itself and disagreed with the screen.
 * The `was` column is what each read on the old 51,43,39 bar, kept so the direction is legible.
 */
export const ON_INK = [
  { surface: "topbar search well",   role: "ground vs the composited bar", min: 1.45, measured: 1.50, was: 1.45, aa: null,
    why: "the ONE that regressed: white/12 fell 1.45 -> 1.32 on the darker bar, so the well was re-derived to white/16" },
  { surface: "topbar search border", role: "border vs the well",           min: 2.00, measured: 2.15, was: 1.98, aa: null,
    why: "white/12 measured 1.45 and barely delineated the well" },
  { surface: "topbar search",        role: "placeholder",                  min: 6.5,  measured: 7.10, was: 5.08, aa: 4.5,
    why: "ink-400 measured 3.27 on the old bar — BELOW AA — while a comment claimed 5.45, a number taken from the sidebar's ink-950" },
  { surface: "topbar search",        role: "magnifier",                    min: 6.5,  measured: 7.10, was: 5.08, aa: 3.0 },
  { surface: "topbar search",        role: "kbd",                          min: 6.5,  measured: 7.10, was: 5.08, aa: 3.0 },
  { surface: "topbar search",        role: "typed value",                  min: 11.0, measured: 12.70, was: 9.10, aa: 4.5 },
  { surface: "ink band",             role: "save status",                  min: 9.5,  measured: 10.64, aa: 4.5,
    why: "#211 moved it onto ink; this is the #177 shape — a colour correct on cream and possibly 1:1 on ink" },
  { surface: "topbar View site",     role: "border vs the bar",            min: 1.95, measured: 2.05, was: 2.17, aa: null,
    why: "#213 raised it white/12 -> white/24 to match the search well beside it; two adjacent controls on one ink bar had disagreed about their edge" },
  { surface: "the L",                role: "sidebar ground vs topbar ground", min: 1.00, measured: 1.00, was: 1.44, aa: null,
    why: "#214: the two halves of one chrome frame, meeting at a corner, had been 1.44:1 apart. 1.00 means IDENTICAL and is the assertion — anything above it is the defect returning" },
  { surface: "the L",                role: "sidebar edge vs topbar edge",     min: 1.00, measured: 1.00, was: 1.58, aa: null,
    why: "same declared value on both (white/24) rendering differently only because the grounds differed; identical grounds make it identical" },

  /* THESE TWO NEED A REAL POINTER AND THIS HARNESS CANNOT PROVIDE ONE.
   *
   * `:hover` is not settable from script — `el.matches(":hover")` reads it, nothing sets it,
   * and dispatching a mouseover event does not move the CSS state. So the script below reports
   * them as NOT MEASURED rather than passing, because a gate that claims a pass it never
   * performed is worse than one that admits the gap. #215 drove them with a real pointer and
   * recorded the values here; re-verifying needs the same.
   *
   * WHY THEY ARE LISTED AT ALL: the hover fill is a NEW SURFACE. Anything on it composites
   * against cream-50, not against the ink bar, and "measured against what?" is the question
   * this table exists to keep answerable. */
  { surface: "topbar View site (HOVER)", role: "fill vs the bar",     min: 18.0, measured: 19.04, aa: null, needsPointer: true,
    why: "the swing IS the affordance — a light fill on ink at 19:1 is unmistakable" },
  { surface: "topbar View site (HOVER)", role: "label vs the fill",   min: 18.0, measured: 19.04, aa: 4.5, needsPointer: true,
    why: "measured against the FILL, not the bar. And it only lands because the label is in a SPAN — `hover:text-*` on the <a> would be dead under hazard 22, exactly as `hover:text-accent-500` was on this same element" },
];

export const TYPE_SCRIPT = String.raw`
(async () => {
  await document.fonts.ready;

  /* ---------------------------------------------------------------- THE SANITY PAIR.
     Runs BEFORE any real measurement and aborts the whole run on failure. See the header:
     a harness that cannot prove itself on a known input cannot be trusted on an unknown one. */
  const cvs = document.createElement("canvas"); cvs.width = cvs.height = 1;
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  const px = (c) => {
    ctx.clearRect(0,0,1,1); ctx.fillStyle = "#fff"; ctx.fillRect(0,0,1,1);
    ctx.fillStyle = c; ctx.fillRect(0,0,1,1);
    const d = ctx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]];
  };
  const lum = ([r,g,b]) => { const f = (v) => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b); };
  const ratio = (a,b) => { const [x,y] = [lum(a), lum(b)].sort((m,n)=>n-m); return (x+0.05)/(y+0.05); };

  const sane = Math.round(ratio(px("#fff"), px("#000")));
  if (sane !== 21) return "SANITY PAIR FAILED — white/black read " + sane + ", not 21. Every number below would be garbage. STOP.";
  if (px("#ff0000").join() !== "255,0,0") return "SANITY PAIR FAILED — red did not round-trip. STOP.";

  /* ---------------------------------------------------------------- name the cream tokens */
  const probe = document.createElement("div"); document.body.appendChild(probe);
  const T = {};
  for (const n of ["cream-50","cream-100","cream-200","cream-300","canvas"]) {
    probe.className = "bg-" + n; T[px(getComputedStyle(probe).backgroundColor).join()] = n;
  }
  probe.remove();
  const name = (c) => T[px(c).join()] || px(c).join();

  const read = (el) => { if (!el) return null; const s = getComputedStyle(el);
    return { size: parseFloat(s.fontSize), weight: Number(s.fontWeight),
             ls: s.letterSpacing === "normal" ? 0 : Math.round(parseFloat(s.letterSpacing)*100)/100,
             family: s.fontFamily.split(",")[0].replace(/["']/g,""), color: s.color }; };

  /* ---------------------------------------------------------------- THE GROUND LADDER.
     Every input must be a DIFFERENT colour from the surface holding it. This is the property
     the ladder exists to hold, and it is relational — asserting a literal colour per input is
     exactly the mistake that shipped twice. */
  /* WALK UNTIL FULLY OPAQUE, COMPOSITING AS YOU GO. Stopping at the first background that is
     merely non-transparent is wrong: the ink topbar's search is a 5% white wash on an 85% ink
     bar on cream, and a walk that halts at the first layer reports it as pure white sitting on
     pure white — a false collision on a surface that is correct. Alpha over alpha over a token
     only reads right if every layer is painted. */
  const alphaOf = (css) => { const m = css.match(/\/\s*([\d.]+)\s*\)/); if (m) return parseFloat(m[1]);
    const r = css.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/); return r ? parseFloat(r[1]) : 1; };
  const stackFrom = (el) => { const s = []; let p = el;
    while (p) { const b = getComputedStyle(p).backgroundColor;
      if (b !== "rgba(0, 0, 0, 0)" && alphaOf(b) > 0) { s.push(b); if (alphaOf(b) === 1) break; }
      p = p.parentElement; }
    s.push("rgb(255,255,255)"); return s; };
  const flatten = (stack) => { ctx.clearRect(0,0,1,1);
    for (let i = stack.length - 1; i >= 0; i--) { ctx.fillStyle = stack[i]; ctx.fillRect(0,0,1,1); }
    const d = ctx.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]].join(); };

  const wells = [];
  for (const inp of document.querySelectorAll("input, textarea")) {
    if (inp.type === "file") continue;
    // NATIVE CHECKBOXES AND RADIOS ARE NOT WELLS AND NEVER WERE. The browser paints them
    // itself; they carry no cream background, so the stack walk reports the UA's white
    // against the panel's cream and calls it a collision. Two of them fired on the blog
    // inspector the first time this ran against PR C — a false positive that would have sent
    // someone looking for a ground bug in a control the ladder does not govern.
    if (inp.type === "checkbox" || inp.type === "radio") continue;
    // THE TOPBAR SEARCH IS EXCLUDED FROM THE LADDER WALK ONLY — NOT FROM THE SUITE.
    // It is an ink surface by design (#204); the contract specifies it against a cream topbar
    // the direction replaced (C-9), so the cream-ladder comparison genuinely does not apply to
    // it and never will. THAT REASON STILL HOLDS, which is why this line survives.
    // What changed is that the exclusion used to mean "unchecked". Its four on-ink foregrounds
    // are now asserted below against the ratios #211 measured. NARROWED, NOT DELETED.
    if (inp.getAttribute("aria-label") === "Search studio content") continue;
    const self = flatten(stackFrom(inp));
    const g = flatten(stackFrom(inp.parentElement));
    wells.push({ label: (inp.getAttribute("aria-label") || inp.placeholder || inp.type).slice(0,30),
                 input: name(getComputedStyle(inp).backgroundColor), ground: g,
                 OK: self !== g });
  }

  /* ---------------------------------------------------------------- the bands (item 10) */
  const bands = [...document.querySelectorAll("h2.sechead")].map(read);

  /* ---------------------------------------------------------------- THE ON-INK ASSERTIONS.
     Every ratio COMPOSITED over its real ground, never against ink-950. #211 found the topbar
     search well measures 1.16 against the composited bar (ink/85 over cream) and would have
     read very differently against the raw token — which is the whole reason the stack walk
     above exists and is reused here. */
  const lum2 = (rgb) => { const f=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
    return 0.2126*f(rgb[0]) + 0.7152*f(rgb[1]) + 0.0722*f(rgb[2]); };
  const rgbOf = (s) => s.split(",").map(Number);
  const contrast = (a, b) => { const [x,y]=[lum2(rgbOf(a)),lum2(rgbOf(b))].sort((m,n)=>n-m);
    return Math.round(((x+0.05)/(y+0.05))*100)/100; };
  /** A foreground composited over the full stack of everything behind it. */
  const fgOn = (colour, el) => flatten([colour, ...stackFrom(el)]);

  const EXPECT = __ON_INK__;
  const search = document.querySelector('input[aria-label="Search studio content"]');
  const searchWell = search ? search.closest("div") : null;
  const bandStatus = document.querySelector("h2.sechead") &&
    document.querySelector("h2.sechead").parentElement.querySelector("span[aria-live]");

  const probes = {};
  if (searchWell) {
    const wellBg = flatten(stackFrom(searchWell));
    const barBg  = flatten(stackFrom(searchWell.parentElement));
    const kbd = searchWell.querySelector("kbd");
    const svg = searchWell.querySelector("svg");
    probes["topbar search well|ground vs the composited bar"] = contrast(wellBg, barBg);
    probes["topbar search border|border vs the well"] =
      contrast(fgOn(getComputedStyle(searchWell).borderTopColor, searchWell), wellBg);
    probes["topbar search|placeholder"] =
      contrast(fgOn(getComputedStyle(search, "::placeholder").color, searchWell), wellBg);
    if (svg) probes["topbar search|magnifier"] = contrast(fgOn(getComputedStyle(svg).color, searchWell), wellBg);
    if (kbd) probes["topbar search|kbd"] = contrast(fgOn(getComputedStyle(kbd).color, searchWell), wellBg);
    probes["topbar search|typed value"] =
      contrast(fgOn(getComputedStyle(search).color, searchWell), wellBg);
  }
  if (bandStatus) {
    const bandBg = flatten(stackFrom(bandStatus.parentElement));
    probes["ink band|save status"] = contrast(fgOn(getComputedStyle(bandStatus).color, bandStatus), bandBg);
  }
  const viewSite = [...document.querySelectorAll("a")].find((a) => /View site/.test(a.textContent));
  if (viewSite) {
    const btnBg = flatten(stackFrom(viewSite));
    probes["topbar View site|border vs the bar"] =
      contrast(fgOn(getComputedStyle(viewSite).borderTopColor, viewSite), btnBg);
  }
  /* THE L ITSELF — the two halves of one chrome frame, asserted as IDENTICAL rather than as
     "close enough". 1.00 is the only passing value: the defect this replaces was 1.44, which
     looks small as a number and is a visible two-tone at the corner where they meet. */
  const topbar = document.querySelector("div.sticky.top-0");
  const homeLink = [...document.querySelectorAll("a")].find((a) => /Homepage/.test(a.textContent));
  let sidebar = homeLink;
  while (sidebar && getComputedStyle(sidebar).backgroundColor === "rgba(0, 0, 0, 0)") sidebar = sidebar.parentElement;
  if (topbar && sidebar) {
    probes["the L|sidebar ground vs topbar ground"] =
      contrast(flatten(stackFrom(sidebar)), flatten(stackFrom(topbar)));
    probes["the L|sidebar edge vs topbar edge"] = contrast(
      fgOn(getComputedStyle(sidebar).borderRightColor, sidebar),
      fgOn(getComputedStyle(topbar).borderBottomColor, topbar));
  }

  /* THE FAILURE NAMES THE FOREGROUND AND THE SURFACE, NEVER A COUNT — a ratio that has slipped
     is only actionable if you know which thing on which ground slipped, and by how much
     against what it was. "2 contrast failures" sends the next person back to re-measure
     everything. Same rule the cascade and token suites follow. */
  const onInk = [];
  for (const e of EXPECT) {
    const key = e.surface + "|" + e.role;
    const got = probes[key];
    if (got === undefined) { onInk.push({ ...e, got: null, status: "NOT FOUND ON THIS PAGE" }); continue; }
    /* THE L ROWS INVERT THE TEST, and that is not a special case bolted on — it is what the
       row means. Every other row wants a MINIMUM: a foreground must be at least this legible.
       The L wants an EQUALITY: two halves of one frame must be the same colour, so 1.00 is the
       target and anything ABOVE it is the two-tone defect returning. A shared ">= min" would
       have passed 1.44, the exact value being fixed. */
    if (e.needsPointer) {
      onInk.push({ surface: e.surface, role: e.role, got: null, measured: e.measured,
        status: "NOT MEASURED — :hover cannot be set from script. Drive it with a real pointer; "
          + "#215 measured " + e.measured + ":1" });
      continue;
    }
    const isEquality = e.surface === "the L";
    const ok = isEquality ? got <= 1.005 : got >= e.min;
    onInk.push({ surface: e.surface, role: e.role, got, min: e.min, measured: e.measured,
      status: ok ? "ok"
        : isEquality
          ? "FAIL — " + e.role + " on " + e.surface + " reads " + got + ":1. These must be IDENTICAL (1.00); "
            + got + " means the two halves of the frame have drifted apart again (was " + e.was + " before #214)"
          : "FAIL — " + e.role + " on the " + e.surface + " reads " + got + ":1, below its floor of "
            + e.min + " (measured " + e.measured + " when it was chosen"
            + (e.aa ? "; AA for this role is " + e.aa : "") + ")" });
  }
  const onInkFailures = onInk.filter((r) => String(r.status).startsWith("FAIL"));
  const onInkUnmeasured = onInk.filter((r) => String(r.status).startsWith("NOT MEASURED"));

  return JSON.stringify({
    page: location.pathname,
    sanity: "PASS (21:1, red round-trips)",
    COLLISIONS: wells.filter((w) => !w.OK),
    ON_INK_FAILURES: onInkFailures,
    ON_INK_NOT_MEASURED: onInkUnmeasured.map((r) => r.surface + " / " + r.role),
    onInk,
    wells,
    sectionHeads: bands,
    VERDICT: (wells.some((w) => !w.OK) || onInkFailures.length) ? "FAIL" : "PASS",
  }, null, 1);
})()
`.replace("__ON_INK__", JSON.stringify(ON_INK));

console.log("studio-type: not runnable here — paste TYPE_SCRIPT into a browser console.");
console.log("Pages:", PAGES.join(", "));
