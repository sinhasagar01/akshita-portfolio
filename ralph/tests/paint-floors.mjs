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
// ---- WHAT THE FOUR DARK PALETTES FOUND, 2026-08-18 --------------------------------------
//
// Driven on FOUR REAL BUILDS, one per palette, five pages each. Not by forcing attributes: the
// first attempt set data-theme and data-ground and asserted those were the server's whole
// contribution. THEY ARE NOT — data-published-ground is emitted too — and the nav kept its light
// answer over a near-black page. Only a build is a state a visitor can reach.
//
//     2,966 measured against a resolved ground   ·   288 unresolved   ·   52 below floor
//
// ⚠ AND THREE OF THIS FILE'S OWN DEFECTS HAD TO BE FIXED BEFORE ANY OF THAT MEANT ANYTHING.
//
//   1. THE EXPORT HAD NEVER BEEN EXECUTED. A backtick inside a comment in the raw template ended
//      it, and the constant threw on import. It had only ever been driven by pasting into a
//      console, where a live-edited revision was running. The A3 row PARSES every skipped suite
//      and a parse cannot see this — presence and resolution are different quantities.
//
//   2. THE REFUSAL PATHS RETURNED A NULL GROUND AND ratio WAS HANDED IT UNGUARDED, so the sweep
//      crashed on the first text over a picture. The unresolved count was filtered on a property
//      nothing ever set, so it would have reported 0 forever.
//
//   3. ⚠ AND THE BIG ONE — IT DOUBLE-COMPOSITED EVERY TRANSLUCENT LAYER OVER WHITE. px() fills
//      white and then paints, so on a half-alpha colour it returns that colour ALREADY over white;
//      the stack loop then composited it again. The nav's near-black glass came back as 145 rather
//      than 36 and the ground resolved to 87,87,87 where the paint is 33. THAT MANUFACTURED 140 OF
//      208 FINDINGS — every nav link on every dark palette at about 3.2, where they measure 6.9.
//      A WHITE-PAPER ASSUMPTION INSIDE THE INSTRUMENT BUILT TO FIND LIGHT-GROUND ASSUMPTIONS, and
//      it was invisible on a near-white palette because white was nearly right.
//
// THE TWELVE SURVIVING CLASSES, TRIAGED RATHER THAN COUNTED:
//
//     20  footer-ciao       1.14 against a floor of 3   DECORATIVE. Its job is to be a whisper,
//                           and this record already boards the fact that nothing here measures a
//                           ratio a consumer must stay UNDER. A ceiling question, not a floor one.
//     28  accent controls   1.04 to 1.14, layers 1      THE DOCUMENTED SIBLING LIMIT. The work
//                           filter's chip is transparent and its fill is painted by .wf-thumb, a
//                           positioned sibling this sweep cannot reach. Header rule 4 names it.
//      4  next-rail-arrow   2.92 to 3.28 against 4.5    ⚠ REAL, AND PREDICTED. It paints
//                           color: var(--color-accent-500) — the RAW RUNG, which does not remap on
//                           a dark ground. This record's rung-to-role entry says the twelve
//                           remaining rung sites are safe only because none carries a foreground,
//                           and that "the next author who puts a label on one inherits the defect".
//                           This is a thirteenth site and it carries a glyph. role-layer R2 cannot
//                           see it: R2 matches CLASS STRINGS in JSX and this is a CSS declaration.
//
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
         THAN GUESS. The first draft fell back to the whole stack, and on the playground route that produced
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
      /* ⚠ px() FILLS WHITE AND THEN PAINTS, SO ON A TRANSLUCENT COLOUR IT RETURNS THAT COLOUR
         ALREADY COMPOSITED OVER WHITE — and this line then composited it a SECOND time. The nav's
         half-alpha near-black fill came back as 145 rather than 36, and the loop below laid that
         mid-grey over the page, reporting a ground of 87,87,87 where the paint is 33. Every nav
         link on all four dark palettes read about 3.2 against a 4.5 floor; measured straight they
         are about 6.9 and clear.
         The straight colour is recovered by undoing the white the raster added. This record already
         carries a double-composited underlay returning 201,196,190 against a known ground — same
         defect, different instrument, and the white base is invisible on a near-white palette. */
      const overWhite = px(bg);
      const straight = a >= 0.999 ? overWhite
        : overWhite.map((v) => Math.max(0, Math.min(255, Math.round((v - 255 * (1 - a)) / a))));
      layers.push({ rgb: straight, a });
      if (a >= 0.999) break;
    }
    if (!layers.length) return { rgb: px(cs(document.documentElement).backgroundColor || '#fff'), layers: 0, offscreen: false };
    /* ⚠ THE BASE UNDER A STACK OF TRANSLUCENT LAYERS IS THE PAGE, NOT WHITE PAPER. This read
       px('#ffffff') and that is a LIGHT-GROUND ASSUMPTION BAKED INTO THE INSTRUMENT BUILT TO FIND
       LIGHT-GROUND ASSUMPTIONS. It was invisible on a near-white palette, where white is nearly
       right, and on the four dark palettes it manufactured 140 findings across 20 runs: the nav's
       glass is a near-black fill at half alpha, so compositing it over white returned a mid-grey
       ground of 87,87,87 and reported every nav link at about 3.2. Composited over the real page
       the same link measures about 7.5 and clears comfortably.
       The root element carries the page ground as a background-color, which is what the
       no-layers branch above already reads — so the two branches now agree on the base. */
    const base = px(cs(document.documentElement).backgroundColor || '#ffffff');
    let out = layers[layers.length - 1].a >= 0.999 ? layers.pop().rgb : base;
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
    /* ⚠ BOTH REFUSALS RETURN A NULL GROUND AND THE FIRST DRAFT HANDED IT STRAIGHT TO ratio, WHICH
       THREW ON THE FIRST TEXT OVER A PICTURE. That is how this export was found never to have been
       EXECUTED: it was driven by pasting into a console, where a live-edited revision was running,
       and the committed constant crashed on import. The mutate-harness A3 row parses every skipped suite
       and a PARSE cannot see this — presence and resolution are different quantities, which this
       record already states about a bundle grep and now states about a harness.
       An unresolved row is KEPT rather than dropped, because the count of what a sweep could not
       measure is the honest half of its coverage claim. */
    if (!g.rgb) {
      rows.push({
        text: (el.textContent || '').trim().slice(0, 30),
        tag: el.tagName,
        cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 46),
        size: c.fontSize, weight: c.fontWeight,
        fg: fg.join(','), bg: null, layers: null,
        ratio: null, floor: floorFor(c), pass: null,
        unresolved: true, why: g.overImage ? 'over-image' : 'centre-missed-element',
      });
      continue;
    }
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

  const fails = rows.filter((x) => x.ratio !== null && !x.pass).sort((a, b) => a.ratio - b.ratio);
  const dark = rows.filter((x) => x.bg && lum(x.bg.split(',').map(Number)) < 0.15);
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
    measuredGround: rows.filter((x) => !x.unresolved).length,
    unresolvedByReason: rows.filter((x) => x.unresolved)
      .reduce((a, x) => { a[x.why] = (a[x.why] || 0) + 1; return a; }, {}),
    worst: rows.some((x) => x.ratio !== null)
      ? Math.min(...rows.filter((x) => x.ratio !== null).map((x) => x.ratio)) : null,
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
//                           written for, and the FIRST exclusion this sweep declared.
//   the sheet stamps        1.72 at 24.32px against a floor of 3.0, 28 of them on every case
//                           study — RULED DECORATIVE 2026-08-19, and the ruling is recorded below
//                           rather than left for the next reader to re-derive from 28 rows.
//
// ---- ⚠ THE SHEET STAMP, RULED — AND IT IS THE OPPOSITE OF `Ciao` ON THE ONE TEST THAT MATTERS ---
//
// `Ciao` earned its exclusion despite INVERTING across the ground flip: 1.37 on light and 11.67 on
// dark, a whisper that becomes a shout, which this record boards as a CEILING question nothing here
// measures. The stamp was expected to be the same class. It is not.
//
// Measured by compositing the declared ink over the resolved ground — the browser doing the
// composite, not a white fill, because a 26% alpha over white is the double-composite fault in
// point 3 above:
//
//     drawing-office  ground 250,250,250   stamp 188,188,188   1.82      border 1.43
//     redline         ground 250,250,248   stamp 189,189,188   1.80      border 1.42
//     sapphire        ground  24, 30, 37   stamp  79, 85, 91   2.22      border 1.61
//     ink-flare       ground  35, 27, 29   stamp  89, 83, 84   2.24      border 1.60
//     nocturne        ground  27, 28, 40   stamp  84, 83, 92   2.23      border 1.60
//     basalt          ground  29, 29, 29   stamp  84, 84, 84   2.23      border 1.60
//
// ⚠ IT HOLDS ITS RELATION — 1.80 to 2.24 ACROSS THE FLIP. That is `etch` working exactly as its own
// entry says an alpha-based pigment role should: it resolves to an INK rather than a finished
// colour, so a consumer's chosen weight survives the ground change. A decorative mark that stays
// decorative on every palette is doing its job, and this sweep's own figure of 1.72 agrees with the
// token composite's 1.80 to within 0.08 by a route that shares no code with it.
//
// THE RULING RESTS ON WHAT THE DESIGN ALREADY DECLARED, NOT ON THE RATIO:
//
//   `aria-hidden="true"` on the render site — a screen reader user never receives it, so the design
//      has ALREADY ruled it not information. If the stamp carried something a reader needs, that
//      attribute would be the defect rather than the contrast.
//   `pointer-events: none` and `user-select: none` — not interactive, not selectable.
//   `color-mix(in oklch, var(--color-etch) 26%, transparent)` — faint by explicit construction.
//   desktop only; below 1024 it is `display: none` and a phone never had one.
//   0 overlap with any element that draws text, measured by `elementsFromPoint` across every stamp.
//
// ⚠ AND THE HONEST COUNTER IS RECORDED RATHER THAN ANSWERED AWAY. The component's own comment says
// "this is a small ruled mark a reader CAN read", which is an intent to be read. And censused across
// the four case studies at 1440: 30 stamps, of which 15 echo a word already in their own section —
// and the ELEVEN INDEX NUMERALS (`01` to `04`) appear NOWHERE ELSE in theirs. So for a feature row,
// the stamp is the only place its number is written.
//
// THAT IS SETTLED BY `aria-hidden` RATHER THAN BY THE RATIO. The rows are in visual order and the
// index is already withheld from assistive technology, so the page does not depend on it. A drafting
// sheet carries a corner mark; that is what this is.
//
// ⚠ NOT ENCODED AS A CODE EXCLUSION, AND THE REASON IS THAT THE OBVIOUS PREDICATE COVERS ONE OF THE
// TWO. `aria-hidden` plus `pointer-events: none` plus `user-select: none` is a real PROPERTY rather
// than a class list — and `.footer-ciao` carries only the last two, so a predicate built on it would
// silence the stamp and go on reporting `Ciao`. Whether this sweep should carry a decoration
// predicate at all is boarded as its own decision rather than smuggled in here.
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
