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
    // THE TOPBAR SEARCH IS EXCLUDED BY NAME. It is an ink surface by design (#204) — the
    // contract specifies it against a cream topbar the direction replaced, which is recorded
    // as correction C-9 in studio-ink-chrome.html. It is not part of the cream ladder.
    if (inp.getAttribute("aria-label") === "Search studio content") continue;
    const self = flatten(stackFrom(inp));
    const g = flatten(stackFrom(inp.parentElement));
    wells.push({ label: (inp.getAttribute("aria-label") || inp.placeholder || inp.type).slice(0,30),
                 input: name(getComputedStyle(inp).backgroundColor), ground: g,
                 OK: self !== g });
  }

  /* ---------------------------------------------------------------- the bands (item 10) */
  const bands = [...document.querySelectorAll("h2.sechead")].map(read);

  return JSON.stringify({
    page: location.pathname,
    sanity: "PASS (21:1, red round-trips)",
    COLLISIONS: wells.filter((w) => !w.OK),
    wells,
    sectionHeads: bands,
  }, null, 1);
})()
`;

console.log("studio-type: not runnable here — paste TYPE_SCRIPT into a browser console.");
console.log("Pages:", PAGES.join(", "));
