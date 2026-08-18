// Rendered geometry — the browser half.
//
// WHY IT EXISTS. Every instrument in this repository measures COLOUR, SIZE or WEIGHT. Nothing
// measures WHERE A BOX SITS, and on 2026-08-18 the owner reported seven defects in one session that
// were all geometry: six corners and a heading standing hard left inside a centred column.
//
// ⚠ THE FLOOR SWEEP WOULD HAVE PASSED THAT HEADING AT 17.27 WHILE IT SAT IN THE WRONG PLACE. That
// is the shape of the gap — an element can be perfectly legible and perfectly misplaced, and every
// other check here looks only at the first half.
//
// HOW TO RUN
//   1. npm run build && npx next start -p 3500
//   2. open http://localhost:3500/<page>
//   3. paste GEOMETRY_SCRIPT below into the console
//
// ⚠ SKIPPED BY `run.mjs` BY NAME, like `parity`, `paint-sites` and `paint-floors`, because it needs
// a browser. `mutate-harness` A3 parses it anyway — a suite nothing imports is a suite whose syntax
// errors are invisible, which this repository has now shipped twice.
//
// ---- CHECK A · A BLOCK STRANDED INSIDE A CENTRED PARENT ---------------------------------
//
// `text-align: center` centres INLINE content inside a block. It does nothing to a block-level
// child's BOX. So a narrower block inside a centred parent, with no auto margin, sits hard left
// while its own lines centre inside it — which reads as "nearly centred" and is why it survived
// review. `.sheet-h2` caps its measure at 24ch, so taking the role is exactly how an element
// acquires a box narrower than its column.
//
// ⚠ THE FIRST DRAFT REPORTED 14 FINDINGS ON ONE PAGE AND EVERY ONE WAS THE LAYOUT WORKING. It
// omitted the parent's display, so every `.sheet-rule` mark and every flex cell was flagged —
// `text-align` does not position a flex or grid item, and a flex child sitting left is correct.
// Both the parent AND the child must be block containers for the defect to be possible at all.
//
// ---- CHECK B · A RADIUS CENSUS THAT BELONGS TO NO SURFACE --------------------------------
//
// The radius work ran three times and each pass was scoped to a SURFACE — the case studies, the
// nav, the blog, the gallery. Six elements belonging to no surface were never anybody's subject and
// the owner found all six by looking. **This check's subject is the rendered page**, so an element
// cannot escape it by belonging to nothing.
//
// ⚠ ITS FIRST RUN FOUND SIX MORE, ON EVERY PAGE: the skip link and the five mobile-menu social
// chips, all in shared chrome. Squared in the same unit.
//
// ⚠ AND THE CLASSIFIER TOOK FOUR DRAFTS, WHICH IS THE HONEST WORK IN A CENSUS. A radius is not one
// thing, and the ruling — "a box around content loses its corner, a circle keeps it because it IS
// one" — only decides between kinds it can tell apart:
//
//     circle       a percentage radius, or a radius at least half the short side, on a SQUARE box
//     ellipse      the same on a NON-square box. `cursor-glow` at 820x820 is a circle; a 305x903
//                  wash at 50% is an ellipse, and calling either a cornered box is the wrong noun
//     capsule      a full radius on a non-square box that is not a decorative wash
//     line-cap     2.5px or less — the nav morph's open X, the swatch strips
//     CORNER       everything else, and the only kind the ruling refuses
//
// The first draft called a 6x6 dot a capsule, because it tested the radius before the squareness.
// The second called every wash a cornered box. Both would have reported real elements under a name
// that decides their fate.
//
// ⚠ AND ARTWORK KEEPS ITS CORNERS, WHICH IS A JUDGEMENT NO PREDICATE MAKES. Four 18px boxes on the
// home page are the process diagram's DEPICTED interface — a drawn phone and browser, whose rounded
// corners are the thing being drawn rather than this site's chrome. That is `artwork-by-file`'s rule
// and it is why check B prints its findings rather than failing on them.
export const GEOMETRY_SCRIPT = String.raw`(() => {
  const cs = (el) => getComputedStyle(el);
  const vis = (el) => {
    const c = cs(el);
    if (c.display === 'none' || c.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const BLOCKISH = new Set(['block', 'flow-root', 'list-item']);

  /* ---- A · stranded blocks ---------------------------------------------------------- */
  const stranded = [];
  let considered = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const p = el.parentElement;
    if (!p || p === document.body) continue;
    const c = cs(el), pc = cs(p);
    if (pc.textAlign !== 'center') continue;
    if (!BLOCKISH.has(pc.display) || !BLOCKISH.has(c.display)) continue;
    if (c.position === 'absolute' || c.position === 'fixed') continue;
    considered++;
    const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const padL = parseFloat(pc.paddingLeft) || 0, padR = parseFloat(pc.paddingRight) || 0;
    const inner = pr.width - padL - padR;
    if (!(r.width < inner - 2)) continue;                                  // fills its column
    if (c.marginLeft === 'auto' || c.marginRight === 'auto') continue;      // already centred
    const leftGap = r.left - (pr.left + padL), rightGap = (pr.right - padR) - r.right;
    if (Math.abs(leftGap - rightGap) <= 2) continue;                        // centred some other way
    stranded.push({
      tag: el.tagName, cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 44),
      text: (el.textContent || '').trim().slice(0, 26),
      width: Math.round(r.width), column: Math.round(inner),
      gaps: Math.round(leftGap) + '|' + Math.round(rightGap),
    });
  }

  /* ---- B · the radius census -------------------------------------------------------- */
  const radii = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const c = cs(el);
    const raw = c.borderTopLeftRadius;
    const tl = parseFloat(raw) || 0;
    if (tl <= 0) continue;
    const r = el.getBoundingClientRect();
    const short = Math.min(r.width, r.height);
    const square = Math.abs(r.width - r.height) <= 1.5;
    const full = raw.trim().endsWith('%') || tl >= short / 2 - 0.5;
    const kind = full ? (square ? 'circle' : 'ellipse-or-capsule')
               : tl <= 2.5 ? 'line-cap' : 'CORNER';
    radii.push({
      kind, radius: raw, box: Math.round(r.width) + 'x' + Math.round(r.height),
      tag: el.tagName, cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 44),
      text: (el.textContent || '').trim().slice(0, 20),
    });
  }
  const tally = {};
  radii.forEach((x) => { tally[x.kind] = (tally[x.kind] || 0) + 1; });
  const corners = [...new Set(radii.filter((x) => x.kind === 'CORNER')
    .map((x) => x.radius + ' ' + x.box + ' ' + x.tag + '.' + x.cls + ' "' + x.text + '"'))];

  return JSON.stringify({
    url: location.pathname,
    /* THE DENOMINATOR, both halves. A walk that reads nothing reports the same clean answer as a
       clean page — this record carries that shape in a scan, a slice, a map and a lookup. */
    domElements: document.querySelectorAll('body *').length,
    checkA: {
      consideredPairs: considered,
      findings: stranded.length,
      stranded,
      note: 'zero here is only worth something if the detector has been seen to fire — reintroduce '
          + 'an auto margin removal on a role-capped heading and it names exactly that element',
    },
    checkB: {
      withRadius: radii.length,
      tally,
      corners,
      note: 'CORNER is the only kind the ruling refuses. Depicted interface keeps its corners; that '
          + 'is artwork-by-file and no predicate decides it, which is why this prints rather than fails',
    },
  }, null, 1);
})()`;

// ---- WHAT IT FOUND ON ITS FIRST RUN, 2026-08-18, six pages -------------------------------
//
//     check A   0 findings, 33 pairs considered across five pages
//               PROVED to fire: removing the auto margin from the playground heading reports
//               `H1.sheet-h2 w=576/960 gaps 0|384` and nothing else. Clean, dirty, clean.
//
//     check B   6 CORNERs on EVERY page — the skip link at 8px and five mobile-menu social chips
//               at 9px, all shared chrome belonging to no surface. Squared in this unit.
//               4 more on the home page at 18px: the process diagram's depicted phone and browser,
//               kept as artwork.
//
// ⚠ AND CHECK B IS WHY THIS FILE IS NOT JUST CHECK A. The owner's seven reports were one alignment
// and SIX corners, and the six shared one cause — three censuses, each complete within its own walk,
// none of which had the rendered page as its subject.
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("geometry is a browser harness — see the header for how to run it.");
  console.log("It is skipped by run.mjs by name, like parity, paint-sites and paint-floors.");
}
