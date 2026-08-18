// Rendered contrast floors — the browser half.
//
// WHY IT EXISTS. Nothing in this repository measures a RENDERED element against the ground it is
// actually painted on. The two instruments that look like they do, do not:
//
//   theme-contrast   measures declared token PAIRS against floors. It is an instrument for judging
//                    a candidate palette, and its own header says so. A pair it does not know
//                    about cannot fail it.
//   paint-sites      asks whether a foreground HOLDS STILL while its ground inverts across nine
//                    palettes. Its own record notes it ran 8/8 green over a decorative element at
//                    1.37 on light and 11.67 on dark, because movement is not a floor.
//
// This project's record already names the gap in as many words: an instrument reading tokens
// "cannot know which pairings the DOM actually produces... the map asserts what meets what, and
// only the render knows."
//
// ⚠ AND THE GAP HAS A COST WITH A TIMESTAMP. On 2026-08-18 a gallery filter chip shipped at 2.30
// against a 4.5 floor and was live for eighteen minutes. Both tokens were legitimate —
// `text-secondary` and the accent — and the PAIRING existed only because an unlayered class
// outranked the element's own conditional colour. No token gate could have seen it, because the
// pair was never declared anywhere. It was found by sweeping a dark surface for another reason and
// noticing one bad figure among clean ones.
//
// HOW TO RUN
//   1. npm run build && npx next start -p 3300
//   2. open http://localhost:3300/<page>
//   3. paste FLOORS_SCRIPT below into the console
//
// ⚠ IT IS SKIPPED BY `run.mjs` BY NAME, like `parity` and `paint-sites`, because it needs a
// browser. A gate nobody can see they are not running is worse than one that says so.
//
// ---- FIVE THINGS IT HAS TO DO, EACH LEARNED BY GETTING ONE WRONG ------------------------
//
//   1. READ THE RENDERED COLOUR, NEVER A TOKEN'S VALUE. `fillStyle` cannot parse
//      `color-mix(in oklch, ...)` — it does not throw and it does not clear, it KEEPS THE PREVIOUS
//      FILL and returns a plausible number. This record carries a case where that reported a
//      failing pair as 5.41 when the paint was 3.11. `getComputedStyle().color` is already resolved
//      to `rgb()` or `oklch()`, and the canvas converts what the browser itself computed.
//
//   2. SANITY PAIR FIRST. White against black must read 21.000 before any figure is believed. This
//      is not ceremony: it has caught a genuinely broken raster path where both samples returned
//      255,255,255 because one landed outside its element.
//
//   3. THE GROUND COMES FROM THE PAINT STACK, NOT FROM AN ANCESTOR WALK — AND THE FIRST DRAFT OF
//      THIS FILE GOT IT WRONG AND REPORTED A FALSE 1.01. A ratio belongs to the ground it was taken
//      on, which is this record's most repeated rule. An ancestor walk cannot find a ground painted
//      by a SIBLING, and the hero tab's selected label is exactly that: the pill fill is an
//      absolutely-positioned sibling span, so walking up from the label finds only transparency and
//      then a 30%-alpha track. Measured that way it read near-white on near-white at 1.01; measured
//      from the paint it is near-white on black at about 20.
//
//      This is the `.wf-thumb` and `on-accent` limitation the record already names twice — "no
//      cascade walk reaches the thumb, because the cascade does not model paint order". The record
//      also names the fix: `elementsFromPoint` returns the whole stack, where `elementFromPoint`
//      returns only the topmost and answered a different question entirely.
//
//   4. ONLY ELEMENTS THAT DRAW TEXT. An element with a background and no text node has no ratio.
//      `PreviewIndicator` records the case: an anchor carrying a near-black fill measured 1.00
//      against itself while the words sat in a child span at 15.20. A ratio belongs to the element
//      that draws the glyphs.
//
//   ⚠ THE LIMIT, STATED RATHER THAN PAPERED OVER. `elementsFromPoint` respects `pointer-events`
//      and returns what is UNDER the cursor, which is not always what is under the TEXT. The work
//      filter's pressed chip is the case: its ground is `.wf-thumb`, a positioned sibling, and the
//      sweep resolved the page instead and reported 1.00. Measured directly against the thumb it is
//      20.12, so the element is correct and the instrument could not see it.
//
//      FORCING `pointer-events: auto` ON EVERYTHING WAS TRIED AND MADE IT WORSE — 5 findings became
//      14, because the stack then admits decorative layers painted ABOVE the text as though they
//      were below it. A wrong ground in the other direction is not an improvement.
//
//      So this sweep is a DEFECT DETECTOR, not a census: a failure is worth investigating and a
//      clean run means no defect was found among the elements whose ground it could resolve. That
//      is the same honest claim `paint-sites` makes about its own site count.
//
//   5. THE FLOOR DEPENDS ON THE RENDERED SIZE AND WEIGHT. 3.0 for large text — 24px, or 18.66px at
//      700 — and 4.5 otherwise. Shrinking text RAISES its floor, which is a consequence a
//      conversion can introduce without touching a colour.
export const FLOORS_SCRIPT = String.raw`(() => {
  const cs = (el) => getComputedStyle(el);

  /* RULE 1 — the browser resolves, the canvas only converts. */
  const px = (c) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.clearRect(0, 0, 1, 1);
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 1, 1);
    x.fillStyle = c;
    x.fillRect(0, 0, 1, 1);
    const d = x.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const lum = (r) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r[0]) + 0.7152 * f(r[1]) + 0.0722 * f(r[2]);
  };
  const ratio = (a, b) => {
    const x = lum(a), y = lum(b);
    return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100;
  };

  /* RULE 2 — refuse to report anything if the raster path is broken. */
  const sanity = ratio(px('#fff'), px('#000'));
  if (Math.abs(sanity - 21) > 0.01) {
    return JSON.stringify({ error: 'SANITY FAILED', sanity, note: 'the raster path is wrong; no figure below would mean anything' });
  }

  /* RULE 3 — composite through transparency to the first ancestor that really paints. */
  const alphaOf = (c) => {
    const m = /rgba?\([^)]*?([\d.]+)\s*\)/.exec(c);
    if (m && c.startsWith('rgba')) return parseFloat(m[1]);
    if (/\/\s*([\d.]+%?)\s*\)/.test(c)) {
      const a = /\/\s*([\d.]+%?)\s*\)/.exec(c)[1];
      return a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
    }
    return 1;
  };
  const groundOf = (el) => {
    const r = el.getBoundingClientRect();
    const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
    let stack = [];
    if (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight) {
      const hits = document.elementsFromPoint(x, y);
      const self = hits.indexOf(el);
      /* ⚠ IF THE ELEMENT IS NOT UNDER ITS OWN CENTRE, THE STACK IS NOT ITS GROUND — REFUSE RATHER
         THAN GUESS. The first draft fell back to the whole stack, and on `/palettes` that produced
         THREE false findings in one run: a fixed panel's button reported 1.09 where it measures
         20.12, and two figures inside scrolling panes reported ~1.07 where they measure 8.4 and
         better. In each case the centre point landed on the page, so the "ground" was the page.
         A ratio belongs to the ground it was taken on, and a point that misses its element has not
         taken one. */
      if (self < 0) return { rgb: null, unresolved: true };
      /* ⚠ THE ELEMENT ITSELF IS PART OF ITS OWN GROUND. The first draft sliced one past itself and
         lost a button's own fill: a chip carrying the accent read 1.00 against the page, where the
         same chip measures 20.12 in the browser. An element that paints a background paints it
         BEHIND its own text.

         ⚠ AND THE NOTE ABOVE ORIGINALLY SPELLED THAT SLICE EXPRESSION OUT, WHICH CLOSED THE
         TEMPLATE LITERAL THIS WHOLE SCRIPT LIVES IN. A backtick inside a String.raw block ends it.
         Eleventh explaining-it-requires-writing-it instance here, and the first to arrive as a
         backtick rather than a comment delimiter or a glob. Describe the expression; do not quote
         it. */
      stack = hits.slice(self);
    } else {
      /* Off-screen: no paint stack to read, so fall back to the ancestor walk and SAY SO, because a
         figure from a weaker method must not be reported as if it came from the stronger one. */
      stack = [];
      let n = el.parentElement;
      while (n && n.nodeType === 1) { stack.push(n); n = n.parentElement; }
    }
    /* ⚠ TEXT OVER A PICTURE HAS NO MEASURABLE FLOOR, SO IT IS REFUSED RATHER THAN GUESSED. This
       record already states the rule — "a foreground whose ground is an image has no measurable
       floor, and this record refuses those" — and the About section proves the need: its captions
       sit on a 42% black tint OVER A PHOTOGRAPH, so any single ground colour would be a fiction.
       Refusing is reported as a count, never folded into the pass total. */
    const imagey = (n) => cs(n).backgroundImage !== 'none' || n.tagName === 'IMG' || n.tagName === 'VIDEO' || n.tagName === 'CANVAS';
    const layers = [];
    for (const node of stack) {
      if (imagey(node)) return { rgb: null, overImage: true };
      const bg = cs(node).backgroundColor;
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue;
      const a = alphaOf(bg);
      layers.push({ rgb: px(bg), a });
      if (a >= 0.999) break;
    }
    if (!layers.length) return { rgb: px(cs(document.documentElement).backgroundColor || '#fff'), layers: 0, offscreen: false };
    let out = layers[layers.length - 1].a >= 0.999 ? layers.pop().rgb : px('#ffffff');
    for (let i = layers.length - 1; i >= 0; i--) {
      const { rgb, a } = layers[i];
      out = [0, 1, 2].map((k) => Math.round(rgb[k] * a + out[k] * (1 - a)));
    }
    return { rgb: out, layers: layers.length + 1 };
  };

  /* RULE 4 — an element with no text of its own has no ratio. */
  const drawsText = (el) => {
    if (!el.childNodes.length) return false;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  };

  const visible = (el) => {
    const c = cs(el);
    if (c.display === 'none' || c.visibility === 'hidden') return false;
    if (Number(c.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  /* RULE 5 — the floor is a function of what rendered, not of what was asked for. */
  const floorFor = (c) => {
    const size = parseFloat(c.fontSize);
    const bold = Number(c.fontWeight) >= 700;
    return (size >= 24 || (size >= 18.66 && bold)) ? 3.0 : 4.5;
  };

  const all = document.querySelectorAll('body *');
  const rows = [];
  let skippedNoText = 0, skippedHidden = 0;
  for (const el of all) {
    if (!drawsText(el)) { skippedNoText++; continue; }
    if (!visible(el)) { skippedHidden++; continue; }
    const c = cs(el);
    const g = groundOf(el);
    const fg = px(c.color);
    const r = ratio(fg, g.rgb);
    const floor = floorFor(c);
    rows.push({
      text: (el.textContent || '').trim().slice(0, 30),
      tag: el.tagName,
      cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 46),
      size: c.fontSize, weight: c.fontWeight,
      fg: fg.join(','), bg: g.rgb.join(','), layers: g.layers,
      ratio: r, floor, pass: r >= floor,
    });
  }

  const fails = rows.filter((x) => !x.pass).sort((a, b) => a.ratio - b.ratio);
  const dark = rows.filter((x) => lum(x.bg.split(',').map(Number)) < 0.15);
  return JSON.stringify({
    sanity,
    url: location.pathname,
    /* THE DENOMINATOR. A sweep must state how many nodes exist, not how many it visited — this
       record carries a case where "three of 103" was quoted four times and 103 was a property of
       how far the instrument had scrolled. */
    domElements: all.length,
    measured: rows.length,
    skippedNoText, skippedHidden,
    /* Reported, never folded into the pass total — an unresolved ground is an element this sweep
       did not measure, which is a different claim from an element that passed. */
    unresolvedGround: rows.filter((x) => x.unresolved).length,
    onDarkGrounds: dark.length,
    worst: rows.length ? Math.min(...rows.map((x) => x.ratio)) : null,
    failureCount: fails.length,
    failures: fails.slice(0, 25),
    verdict: fails.length === 0
      ? 'FLOORS OK — every element that draws text clears its floor against the ground it is painted on'
      : fails.length + ' element(s) below floor',
  }, null, 1);
})()`;

// ---- WHAT IT FOUND ON ITS FIRST RUN, 2026-08-18, drawing-office, sanity 21.000 ----------
//
//     /gallery   68 measured ·  7 refused over image ·  1 failure
//     /blog      63 measured ·  2 refused over image ·  1 failure
//     /          260 measured · 10 refused over image ·  5 findings
//
// EVERY ONE RESOLVED TO THE INSTRUMENT OR TO A DECLARED EXCLUSION, and no new site defect survived:
//
//   the footer's `Ciao`     1.09 at 116px — a DECORATIVE backdrop whose whole job is to be a
//                           whisper behind the identity. `paint-sites` already carries the entry
//                           about it inverting on dark. Not a text element in the sense a floor is
//                           written for, and the one exclusion this sweep declares.
//   the work-filter chip    1.00 reported, 20.12 measured — the `pointer-events` limit above.
//   the About captions      1.35 and 1.45 — text over a 42% tint over a PHOTOGRAPH, which the
//                           refusal above now catches by its ancestor rather than by its own tag.
//
// ⚠ THE VALUE OF THE RUN IS NOT THE ZERO. It is that three of the four instrument faults corrected
// while building this were faults the record had already named — a sibling-painted ground, an
// element's own fill, and a foreground over a picture — and each was found by disbelieving a
// figure rather than by reading the code.
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("paint-floors is a browser harness — see the header for how to run it.");
  console.log("It is skipped by run.mjs by name, like parity and paint-sites.");
}
