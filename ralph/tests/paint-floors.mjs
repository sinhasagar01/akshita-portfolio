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

  /* ⚠ RULE 2b — A PENDING TRANSITION MAKES getComputedStyle REPORT THE STALE ENDPOINT RATHER
     THAN THE PAINT, AND THIS SWEEP'S WHOLE PREMISE IS THAT THOSE TWO ARE THE SAME THING. Measured
     on the nav pill at scrollY 0 on a published dark palette, settled for eight seconds:

         getAnimations()  bg reported                     bg painted
         5                oklab(0.985 … / 0.58)  LIGHT    dark, ~#242424 by screenshot
         0                color(srgb 0.1427 … / 0.5)      the same dark

     Same element, same scroll position, same class list. **The element's own --glass-fill
     resolved DARK in both readings** — so the var was right and the property that reads it was
     not. Nine nav rows per page reported 1.02 to 1.25 against a 4.5 floor on four of five pages,
     and every one is refuted by a screenshot of the pill.

     ⚠ THE FIRST DIAGNOSIS WAS THE VIEWPORT AND IT WAS THE CORRELATION RATHER THAN THE CAUSE. The
     board entry this was raised as said "a sweep must run where its elements are painted", because
     the loudest run had measured a nav translated out of view. Off-screen was merely WHERE
     transitions had most recently been kicked; the same disagreement reproduces at scrollY 0 with
     the pill fully visible. **Refusing off-viewport elements would have cost most of the sweep's
     coverage and left the defect**, which is the wrong-noun shape this record names a dozen times,
     and it was caught by testing the proxy against the state it was meant to explain.

     THE TARGETS ARE COLLECTED ONCE. document.getAnimations() is a single call; per-element it
     would be one call per ancestor per node. The ground stack is what matters rather than the
     element alone, because a transitioning ANCESTOR is the ground being misreported. */
  const animatingTargets = (() => {
    const set = new Set();
    for (const a of document.getAnimations()) {
      const t = a.effect && a.effect.target;
      /* ONLY A LIVE ANIMATION. A FINISHED ONE HAS REACHED ITS ENDPOINT, WHICH IS THE VALUE
         getComputedStyle SHOULD REPORT — so counting it refuses an element for the opposite of
         this refusal's own reason. document.getAnimations() returns finished animations too, and
         on a settled home page ELEVEN of them are: nine finished entry animations and two
         infinite ambient loops. Not one is mid-transition. */
      if (t && t.nodeType === 1 && a.playState !== 'finished' && a.playState !== 'idle') set.add(t);
    }
    return set;
  })();
  const pendingOn = (stack) => {
    for (const n of stack) if (animatingTargets.has(n)) return n;
    return null;
  };

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
    let method = 'paint-stack';
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
      if (self < 0) return { rgb: null, unresolved: true, stack };
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
         figure from a weaker method must not be reported as if it came from the stronger one.

         ⚠ AND IT STARTS AT THE ELEMENT, NOT AT ITS PARENT — WHICH IT DID NOT, AND THAT COST TEN
         FALSE FINDINGS IN ONE RUN. The strong path above slices the hit list FROM SELF, so it has
         always included the element's own fill. This path began at parentElement, so a button that
         paints its own accent had that fill dropped and was measured against the page instead.
         Every one came back near 1.0 because the text is on-accent and the page is near-white, and
         all ten measure 6.53 to 6.65 when the element is in view. The two paths disagreed about
         whether an element is part of its own ground, and only one of them was right.

         An element that paints a background paints it BEHIND its own text whether or not a visitor
         has scrolled to it. What this path genuinely cannot see is a POSITIONED SIBLING, which is a
         limit rather than a defect, and the method flag below is what makes it visible. */
      method = 'ancestor-walk';
      stack = [el];
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
      if (imagey(node)) return { rgb: null, overImage: true, stack };
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
    if (!layers.length) return { rgb: px(cs(document.documentElement).backgroundColor || '#fff'), layers: 0, method, stack };
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
    return { rgb: out, layers: layers.length + 1, method, stack };
  };

  /* ⚠ RULE 6 — WHAT THE DESIGN HAS DECLARED DECORATIVE, WHICH IS A PROPERTY RATHER THAN A LIST.
     Three attributes together, and all three are load-bearing:

         aria-hidden true    a screen reader never receives it, so the design has already ruled it
                             not information. If it carried something a reader needs, THAT would be
                             the defect rather than the contrast.
         pointer-events none not interactive
         user-select none    not selectable

     MEASURED BEFORE IT WAS WRITTEN, across seven public pages:

         aria-hidden alone                    312 elements, 74 of them drawing text
         plus pointer-events and user-select   25 elements, ALL 25 drawing text

     The 25 are the footer Ciao, the sheet stamps and the hero watermark — every one already ruled
     decorative with its numbers in the triage above. Everything the predicate does NOT catch is a
     real affordance: arrows, a hover hint, a back control, a zoom hint. So aria-hidden alone is
     exactly the over-wide rule SkillsBody warned about when it recorded 8 of 17 such nodes being
     real prose, and the third part is what makes the rule honest.

     ⚠ AND THE COUNT IS REPORTED RATHER THAN DROPPED. An exclusion nobody can see is one nobody
     chose, which is why this returns a number beside the measured total instead of quietly
     shrinking it. Before this the sweep stood at 47 findings across the public surface of which 6
     were live, and a gate whose common output is benign is one people learn to skip. */
  const decorative = (el) => {
    /* ⚠ THE SECOND FORM IS A MARKER BUILT FOR EXACTLY THIS AND HONOURED BY NOTHING UNTIL NOW.
       SkillsBody carries data-texture on its ghost word, and its own comment says the previous
       sweep "excluded this by accident rather than by intent" and that aria-hidden CANNOT carry the
       meaning — because 17 nodes wear that attribute and EIGHT are real prose. So the codebase
       already drew this distinction and wrote down why; the population is one site, and a marker
       whose whole purpose is to be read is not a fixed list. */
    if (el.getAttribute('data-texture') === 'true') return true;
    if (el.getAttribute('aria-hidden') !== 'true') return false;
    const s = cs(el);
    return s.pointerEvents === 'none'
      && (s.userSelect === 'none' || s.webkitUserSelect === 'none');
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

  /* Rounded so a row stays readable, and both halves kept: a rect alone does not say whether the
     viewport it was measured against had scrolled. */
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  };
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };

  /* RULE 5 — the floor is a function of what rendered, not of what was asked for. */
  const floorFor = (c) => {
    const size = parseFloat(c.fontSize);
    const bold = Number(c.fontWeight) >= 700;
    return (size >= 24 || (size >= 18.66 && bold)) ? 3.0 : 4.5;
  };

  const all = document.querySelectorAll('body *');
  const rows = [];
  let skippedNoText = 0, skippedHidden = 0, skippedDecorative = 0;
  /* ⚠ THE DECLARED-DECORATIVE POPULATION, RECORDED RATHER THAN ONLY COUNTED — THE LAST FIELD OF
     THIS KIND IN THE REPORT. skippedDecorative was a number with no way to see what was in it,
     which is exactly the state the REFUSALS were in until somebody asked what the unresolved half
     contained and the answer was "the instrument cannot say".

     ⚠ AND THIS POPULATION IS NOT INERT, WHICH IS WHY IT EARNS THE FIELD RATHER THAN INHERITING IT.
     Every decorative-ceiling finding this record carries came out of exactly these rows: the
     footer's Ciao, which inverted 1.37 to 11.67 before it was repaired; the sheet stamps, ruled
     decorative on evidence; and the hero watermark, which measured 5.52 on a dark ground against
     1.24 on a light one and was fixed by binding its alpha to the ground. **Three findings, one
     skipped set, and the skip is what kept it out of every run's output.**

     THE ROWS ARE KEPT WITH THEIR RATIO UNCOMPUTED, because a decorative mark has no floor to fail —
     what it has is a BAND it should stay inside across the ground flip, and nothing here measures a
     ceiling. Naming the members is what lets somebody take that question up without re-deriving the
     population first. */
  const decorativeRows = [];
  /* ⚠ THE DENOMINATOR, BECAUSE THE CENSUS ABOVE ONLY EVER SEES WHAT IS LAID OUT RIGHT NOW.
     skippedDecorative sits behind the visibility gate, so a decorative mark inside an unrevealed
     panel is counted as HIDDEN and never reaches it. Measured on a case study: eight sheet stamps
     are declared decorative and draw text, and the sweep censused ONE — the other seven return a
     zero-size rect while their panel is still clipped.

     REPORTING THE VISIBLE COUNT ALONE WOULD HAVE BEEN A PARTIAL VIEW PRESENTED AS A POPULATION,
     which is precisely the state the refusal half was in before it was enumerated. So both figures
     are returned and the gap between them is the reader's to see rather than to discover. */
  let decorativeVisible = 0, decorativeDeclared = 0;
  for (const el of all) {
    if (drawsText(el) && decorative(el)) decorativeDeclared++;
    if (!drawsText(el)) { skippedNoText++; continue; }
    if (!visible(el)) { skippedHidden++; continue; }
    if (decorative(el)) {
      skippedDecorative++;
      decorativeVisible++;
      const dc = cs(el);
      decorativeRows.push({
        text: (el.textContent || '').trim().slice(0, 24),
        tag: el.tagName,
        cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 40),
        size: dc.fontSize,
        /* The DECLARED ink and its alpha, not a composited ratio — see the note above on why there
           is no figure here. fillStyle cannot parse every token form, so this is the string the
           browser resolved rather than anything this sweep converted. */
        color: dc.color,
        why: el.getAttribute('data-texture') === 'true' ? 'data-texture' : 'aria-hidden+inert-ink',
      });
      continue;
    }
    const c = cs(el);
    const g = groundOf(el);
    /* ⚠ A TRANSLUCENT FOREGROUND HAD TO BE COMPOSITED OVER ITS GROUND, AND THIS READ IT OVER WHITE.
       Point 3 in the header records px() filling white and then painting, and records the ground
       loop being repaired for it. The SAME call was left on the foreground, one line apart, and it
       fails in the opposite and worse direction.

       The sheet stamp paints its ink at 26 per cent alpha. Measured on a real build:

           redline    px() 193,193,193   true 189,189,188    1.72 fails   1.80 FAILS
           sapphire   px() 251,252,253   true  69, 74, 80   18.61 PASSES  2.14 FAILS
           basalt     px() 252,252,252   true  74, 74, 74   18.68 PASSES  2.16 FAILS

       On a near-white palette the error is small and the row still surfaced. On a dark ground the
       same call returns a near-white ink, so a genuinely sub-floor element reads about 18 and
       PASSES. A ground fault MANUFACTURES findings and is caught by being loud. A foreground fault
       HIDES them, and this record's own asymmetry rule says a false pass is the one nobody sees.

       The straight ink is recovered by undoing the white the raster added, then composited over the
       resolved ground — which is what the eye receives. An unresolved row keeps the straight ink,
       because there is no ground to composite onto and reporting one would be a fiction. */
    const fgAlpha = alphaOf(c.color);
    const fgOverWhite = px(c.color);
    const fgStraight = fgAlpha >= 0.999 ? fgOverWhite
      : fgOverWhite.map((v) => Math.max(0, Math.min(255, Math.round((v - 255 * (1 - fgAlpha)) / fgAlpha))));
    const fg = (fgAlpha >= 0.999 || !g.rgb) ? fgStraight
      : [0, 1, 2].map((k) => Math.round(fgStraight[k] * fgAlpha + g.rgb[k] * (1 - fgAlpha)));
    /* ⚠ BOTH REFUSALS RETURN A NULL GROUND AND THE FIRST DRAFT HANDED IT STRAIGHT TO ratio, WHICH
       THREW ON THE FIRST TEXT OVER A PICTURE. That is how this export was found never to have been
       EXECUTED: it was driven by pasting into a console, where a live-edited revision was running,
       and the committed constant crashed on import. The mutate-harness A3 row parses every skipped suite
       and a PARSE cannot see this — presence and resolution are different quantities, which this
       record already states about a bundle grep and now states about a harness.
       An unresolved row is KEPT rather than dropped, because the count of what a sweep could not
       measure is the honest half of its coverage claim. */
    /* ⚠ RULE 2b APPLIED. A live transition anywhere in the ground stack means the reported colour
       may be the stale endpoint rather than the paint, so the row is REFUSED rather than reported.
       The element itself is tested alongside its stack, because a centre-miss returns an empty one
       and a refusal that cannot see its own subject is no refusal at all. */
    const animating = pendingOn([el, ...(g.stack || [])]);
    if (animating) {
      rows.push({
        text: (el.textContent || '').trim().slice(0, 30),
        tag: el.tagName,
        cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 46),
        size: c.fontSize, weight: c.fontWeight,
        fg: fg.join(','), bg: null, layers: null,
        ratio: null, floor: floorFor(c), pass: null,
        rect: rectOf(el), onScreen: onScreen(el),
        unresolved: true, why: 'transition-pending',
        animatingOn: animating === el ? 'self'
          : animating.tagName + '.' + String(animating.className).split(' ')[0],
      });
      continue;
    }
    if (!g.rgb) {
      rows.push({
        text: (el.textContent || '').trim().slice(0, 30),
        tag: el.tagName,
        cls: el.className.toString().replace(/\s+/g, ' ').slice(0, 46),
        size: c.fontSize, weight: c.fontWeight,
        fg: fg.join(','), bg: null, layers: null,
        ratio: null, floor: floorFor(c), pass: null,
        rect: rectOf(el), onScreen: onScreen(el),
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
      /* ⚠ WHICH METHOD PRODUCED THIS FIGURE, BECAUSE THE ROW DID NOT SAY AND THE COMMENT CLAIMED IT
         DID. The fallback's own note promised that a figure from a weaker method must not be
         reported as if it came from the stronger one, and nothing carried that to the output — so a
         reader triaging a run could not tell a paint-stack reading from an ancestor walk. */
      method: g.method,
      /* ⚠ WHERE THE ELEMENT WAS WHEN THIS WAS READ, BECAUSE THREE REFUTED RUNS COST THREE ROUNDS
         AND ONE GLANCE AT A RECT WOULD HAVE CLOSED EACH. A finding on an element sitting above the
         fold at a scroll position deep in the page is the first thing to disbelieve, and nothing in
         the output said so. It is INFORMATION rather than a predicate — off-screen was tested as a
         refusal and rejected, because the same defect reproduces in full view. */
      rect: rectOf(el), onScreen: onScreen(el),
      ratio: r, floor, pass: r >= floor,
    });
  }

  const fails = rows.filter((x) => x.ratio !== null && !x.pass).sort((a, b) => a.ratio - b.ratio);
  const refused = rows.filter((x) => x.unresolved);
  const dark = rows.filter((x) => x.bg && lum(x.bg.split(',').map(Number)) < 0.15);
  return JSON.stringify({
    sanity,
    url: location.pathname,
    /* THE DENOMINATOR. A sweep must state how many nodes exist, not how many it visited — this
       record carries a case where "three of 103" was quoted four times and 103 was a property of
       how far the instrument had scrolled. */
    domElements: all.length,
    measured: rows.length,
    /* The honest half of a coverage claim — how many figures came from the weaker method. */
    byMethod: rows.filter((x) => !x.unresolved)
      .reduce((a, x) => { a[x.method] = (a[x.method] || 0) + 1; return a; }, {}),
    skippedNoText, skippedHidden,
    /* Declared decoration, counted rather than silently dropped. See rule 6. */
    skippedDecorative,
    /* ⚠ AND NOW SHOWN. A count with no way to enumerate it is a population nobody can triage, which
       is the lesson the refusal half already taught this report. */
    decorativeByKind: decorativeRows
      .reduce((a, x) => { const k = x.cls.split(' ')[0] || x.tag; a[k] = (a[k] || 0) + 1; return a; }, {}),
    decorative: decorativeRows.slice(0, 40),
    /* Declared decorative AND drawing text anywhere on the page, laid out or not. The pair is the
       honest claim: the rows above are what this run could see, this is what exists. */
    decorativeDeclared,
    decorativeSeenShare: decorativeDeclared
      ? Math.round((decorativeVisible / decorativeDeclared) * 100) + '%' : 'n/a',
    /* WHERE THE SWEEP WAS STANDING. Every rect below is relative to this, and a rect without it is
       half a reading. */
    scrollY: Math.round(window.scrollY),
    viewport: [innerWidth, innerHeight],
    /* Reported, never folded into the pass total — an unresolved ground is an element this sweep
       did not measure, which is a different claim from an element that passed.

       ⚠ THIS FIELD KEEPS ITS EXACT OLD MEANING AND A NEW ONE SITS BESIDE IT. Folding the
       transition refusals in here would have moved a number every earlier run is quoted against —
       the running-total defect this record carries against a deploy count and a ralph headline —
       so GROUND refusals stay ground refusals and the total is its own field. */
    unresolvedGround: rows.filter((x) => x.unresolved && x.why !== 'transition-pending').length,
    refusedTransitionPending: rows.filter((x) => x.why === 'transition-pending').length,
    /* ⚠ THE TWO HALVES ARE REPORTED SEPARATELY AND THE COMBINED SHARE CARRIES ITS OWN WARNING,
       BECAUSE ONE HALF IS A PROPERTY OF THE PAGE AND THE OTHER IS A READING OF A MOMENT.

       Measured on the home page, same palette, three sweeps 2.5s apart, then across palettes:

           centre-missed + over-image     9 and 1 on EVERY run, and identical across four
                                          palettes on three pages — twelve runs, byte-identical
                                          kind maps. STRUCTURAL.
           transition-pending             18, then 58, then 30 on the SAME page. VOLATILE.

       So refusedTotal is a number that moves while nothing about the site does, and a reader
       quoting it — or the share below — is quoting the instrument. This record already carries the
       running-total defect against a deploy count and a ralph headline; this is the same shape in a
       sweep's own output, and the split is what stops it being quotable as a fact. */
    refusedStructural: rows.filter((x) => x.unresolved && x.why !== "transition-pending").length,
    refusedTotal: rows.filter((x) => x.unresolved).length,
    refusedTotalNote: "structural + transition-pending; the second half is a reading of a moment, not a property — quote refusedStructural",
    onDarkGrounds: dark.length,
    measuredGround: rows.filter((x) => !x.unresolved).length,
    /* ⚠ THE VACUITY GUARD, BECAUSE A NEW REFUSAL IS A NEW WAY FOR THE SUBJECT TO EMPTY. A run that
       refuses almost everything reports a clean zero and looks like a pass; this record already
       carries that shape from a gate passing over an empty subject three times. The share is
       printed so the reader sees it without doing the division. */
    /* The share of the STABLE half, which is the one that means something across runs. The combined
       share moved 24% to 44% on one page with nothing changed, so it is not reported at all. */
    refusedStructuralShare: rows.length
      ? Math.round((rows.filter((x) => x.unresolved && x.why !== "transition-pending").length / rows.length) * 100) + '%'
      : 'n/a',
    /* How many of the elements that were measured were actually in view when they were read. Not a
       predicate — see the rect note above — but the figure that tells a reader how much of this
       run is a reading of the page they are looking at. */
    measuredOnScreen: rows.filter((x) => !x.unresolved && x.onScreen).length,
    unresolvedByReason: rows.filter((x) => x.unresolved)
      .reduce((a, x) => { a[x.why] = (a[x.why] || 0) + 1; return a; }, {}),
    worst: rows.some((x) => x.ratio !== null)
      ? Math.min(...rows.filter((x) => x.ratio !== null).map((x) => x.ratio)) : null,
    failureCount: fails.length,
    failures: fails.slice(0, 25),
    /* ⚠ THE REFUSALS WERE COUNTED AND NEVER SHOWN, WHICH IS WHY NOBODY HAD LOOKED AT THEM. The
       board carried "nobody has looked at the unresolved half" as an open item for arcs, and the
       reason was the instrument rather than anybody's attention: this object returned a COUNT and a
       breakdown by reason, and no way to see WHICH elements were in it. A population you cannot
       enumerate is one nobody can triage.

       A clean run means no defect among the elements it could resolve, and that sentence is only
       worth anything while somebody can read the other half. Same shape as the byMethod field —
       the honest half of a coverage claim has to be inspectable, not just countable. */
    refusedByTag: refused
      .reduce((a, x) => { const k = x.tag + (x.cls ? '.' + x.cls.split(' ')[0] : ''); a[k] = (a[k] || 0) + 1; return a; }, {}),
    refused: refused.slice(0, 40).map((x) => ({
      why: x.why, text: x.text, tag: x.tag, cls: x.cls,
      size: x.size, fg: x.fg, rect: x.rect, onScreen: x.onScreen,
      animatingOn: x.animatingOn,
    })),
    /* ⚠ THE VERDICT NAMES WHAT WAS REFUSED, BECAUSE "FLOORS OK" OVER A MOSTLY-REFUSED RUN IS THE
       claim this record refuses. A clean run means no defect among the elements it could resolve,
       and that sentence is only honest while it says how many it could not. */
    verdict: fails.length === 0
      ? 'FLOORS OK — every element that draws text clears its floor against the ground it is painted on'
        + ' (' + rows.filter((x) => x.unresolved && x.why !== "transition-pending").length
        + ' of ' + rows.length + ' refused structurally, unmeasured; plus '
        + rows.filter((x) => x.why === "transition-pending").length + ' mid-transition this run)'
      : fails.length + ' element(s) below floor',
  }, null, 1);
})()`;

// ---- ⚠ THE TRANSITION REFUSAL COUNTED FINISHED ANIMATIONS, AND THE MOBILE SWEEP FOUND IT -----
//
// `document.getAnimations()` RETURNS FINISHED ANIMATIONS TOO, and `animatingTargets` added every
// target with no `playState` filter. A finished animation has reached its endpoint, which is the
// value `getComputedStyle` SHOULD report — so counting it refused an element for the exact opposite
// of this refusal's own reason.
//
// MEASURED ON A SETTLED HOME PAGE, photostat, after a full wheel-scroll pass:
//
//     11 animations   9 FINISHED   2 running   and BOTH running ones are iterations: Infinity
//                                              (`hero-ping` on .hero-scroll, `footer-beat` on an svg)
//
// So on a settled page there was NO GENUINE PENDING TRANSITION AT ALL, and every one of the 13
// refusals was false. The predicate now takes only a live animation.
//
// ⚠ AND THIS EXPLAINS THE VOLATILITY THE SPLIT WAS BUILT AROUND, WHICH IS THE PART WORTH KEEPING.
// That unit measured 18, then 58, then 30 on the same page and called the half VOLATILE. It is —
// but the volatility was the FINISHED half accumulating and being collected at unpredictable rates,
// not a live transition coming and going. Narrowed, four runs 2.5s apart on one page:
//
//     base      trans 13   12   12   12      struct 18 throughout
//     narrowed  trans  2    1    1    1      struct 22 throughout
//
// The structural count RISES by 4, which is the second half of the finding: those rows were
// refusable for `centre-missed-element` or `over-image` all along and `transition-pending` was
// merely the reason checked first. **A refusal reported under the wrong reason is the wrong-subject
// defect arriving in a breakdown rather than in a number.**
//
// ⚠ AND THE NARROWING IS PROVED IN BOTH DIRECTIONS, BECAUSE A LOOSENED REFUSAL THAT STILL PASSES
// IS INDISTINGUISHABLE FROM ONE THAT HAS STOPPED WORKING. Swept INSIDE the load window rather than
// after it, at 1920 on a real build:
//
//     t=300ms   nav bg oklab(0.9539 …) vs a DARK --glass-fill   logo-sig and logo-singh REFUSED
//     t=450ms   nav bg oklab(0.2669 …)  mid-flight              REFUSED, animatingOn DIV.nav-glass
//     t=600ms   nav bg color(srgb 0.1427 …)  correct            MEASURED, not refused
//     t=1500ms  the same                                        MEASURED
//
// Zero failures at every step. **The rows did not vanish, they resolved** — the property this file
// claims for the refusal, now demonstrated on one page in both directions rather than across pages.
//
// A per-frame trace of the load window says the same thing from the other side: every frame in
// which the computed background disagreed with `--glass-fill` carried `running:background-color` on
// the nav's own stack, and the disagreement ended in the frame the transition did. **The stale
// endpoint and a RUNNING animation are the same event.**
//
// ⚠ WHAT REMAINS REFUSED IS AN AMBIENT LOOP, AND IT IS BOARDED RATHER THAN NARROWED FURTHER. The
// residual 1 to 2 per page is `hero-ping` and `footer-beat`, both `iterations: Infinity`, both
// permanently `running` and therefore permanently refused. Neither animates a COLOUR, so neither
// can produce a stale colour endpoint. Narrowing to colour properties would fix it and is a second
// decision with its own blast radius — an opacity animation on an ancestor genuinely does change
// what an element composites to. **The trigger is a page where the ambient residue hides something
// worth measuring; today it is two elements of 911.**

// ---- ⚠ THE MOBILE SWEEP, AND THE BOARD'S OWN PREDICTION WAS WRONG ------------------------------
//
// The width axis was boarded as unreached for arcs, on the honest ground that the browser this
// repository drives reports `outerWidth: 0` and a resize does not reach `innerWidth`. **That was an
// instrument limit, not an open question**, and the driver above closes it: playwright was already
// a dependency and `paint-sites` already launches chromium.
//
// FIVE PAGES, photostat, both widths, sanity 21.000 every run, narrowed predicate:
//
//     page                    1920x928                     390x844
//                          meas struct trans fail       meas struct trans fail
//     /                     252     22     2    2        236     15     1    2
//     /projects/boat-crest  213      6     0    0        198      7     0    0
//     /blog/<motion>         71     14     0    0         50      9     0    0
//     /gallery               72     13     0    0         57     14     0    0
//     /palettes             303     20     0    0        274      7     0    0
//     TOTAL                 911     75     2    2        815     52     1    2
//
// **THE TWO FAILURES ARE THE SAME TWO AT BOTH WIDTHS, AND BOTH ARE THIS FILE'S DOCUMENTED
// `pointer-events` LIMIT** — the work filter's chip and its count, resolving through `.wf-thumb`,
// a positioned sibling, and clearing at 6.65 measured directly. **No mobile defect exists.**
//
// ⚠ AND THE BOARD PREDICTED THE WRONG POPULATION, WHICH IS THE FINDING RATHER THAN THE ZERO. It
// said the 25 mobile-menu social chips "are exactly the class most likely to change". Measured:
//
//     A.header-mob-soc-chip    25 refused at 1920    25 refused at 390    delta +0
//
// **They are refused at both widths because the menu is CLOSED at both.** It becomes reachable when
// somebody OPENS it, which is a STATE and not a width — so a sweep at any viewport would have gone
// on refusing them forever. Driven with the menu open at 390, after clicking `button.nav-morph`:
//
//     measured 123 · worst 4.79 · 0 failures · the five chips resolve at oklch(0.6862 0 0)
//
// **A prediction about a population is a claim about what SELECTS it**, and this one named the axis
// that does not. The class that actually moved with width is the sheet stamps, `display: none`
// below 1024: boAt Crest reads 8 of 10 decoratives seen at 1920 and 1 of 10 at 390.
//
// ⚠ AND THE DEEP SCROLL IS WHY THE DESKTOP FIGURES DISAGREE WITH EVERY EARLIER RUN IN THIS FILE.
// The home page reads 252 here against the 131 recorded above, and 8 decoratives against 2 — not
// because anything changed, but because a wheel-scrolled page has revealed its panels and a page at
// rest has not. **Every figure in this file taken by the paste-in method is a reading of the first
// screen plus whatever happened to be unclipped.** The earlier numbers are not wrong; they are
// about a smaller subject than their labels suggest.

// ---- ⚠ THE REFUSAL POPULATION, ENUMERATED FOR THE FIRST TIME, 2026-08-19 ------------------
//
// The board carried "nobody has looked at the unresolved half" for arcs, and THE REASON WAS THIS
// INSTRUMENT RATHER THAN ANYBODY'S ATTENTION. The report returned a COUNT and a breakdown by
// reason, and no way to see WHICH elements were in it. A population you cannot enumerate is one
// nobody can triage, so the fix was a field rather than a study.
//
// 64 GROUND REFUSALS ACROSS FIVE PAGES ON A PUBLISHED photostat BUILD, and they fall into four
// classes with nothing left over:
//
//     31   DELIBERATELY HIDDEN CHROME     25 mobile-menu social chips (the menu is moved out of
//                                         view at desktop rather than display:none — the off-screen
//                                         container route this record already names), 5 skip links
//                                         at clip-path: inset(50%), 3 palette-pill controls at
//                                         opacity 0 until past the hero
//     16   TEXT OVER PICTURES             the blog's figure labels and values, the hero fig label,
//                                         7 case-study block captions — correct by the stated rule
//     14   THE /palettes SWITCHER PANEL   a FIXED panel over the page, so elementsFromPoint returns
//                                         the panel at the label's own centre
//      3   one case-study block title, and two /palettes labels of the same shape
//
// ⚠ EVERY ONE IS CORRECT, WHICH IS THE RESULT RATHER THAN A DISAPPOINTMENT. The honest claim a
// clean run makes has always been "no defect among the elements it could resolve"; this is the
// first time anyone can say what the other half contained. **Not one is an element a visitor is
// looking at**, and the two largest classes are things the design deliberately hides.
//
// ⚠ AND IT DOES NOT CLOSE THE GENERAL QUESTION, SAID RATHER THAN IMPLIED. This is five pages at
// one width on one palette. The record's older figure was 288 unresolved of 3,254 across four dark
// palettes and five pages each — a different and larger run. What is established is the SHAPE of
// the population and that the instrument can now show it, not that every refusal on every page is
// benign.
//
// ---- ⚠ THE DECORATIVE CEILING — THE TRIGGER FIRED, AND THE SECOND INSTANCE IS THE CREST -------
//
// Every floor in this repository is a MINIMUM. A decorative mark needs a MAXIMUM: its whole job is
// to stay a whisper, and nothing here measures a ratio a consumer must stay UNDER. The board's
// trigger was a SECOND instance of a whisper inverting across the ground flip.
//
// Measured on `boat-crest` at 1920 wide, all eight palettes, sanity 21.000, each palette settled
// and verified by its own resolved ink before reading. The ground is the first OPAQUE ancestor and
// the ink is un-premultiplied before compositing, because these are all alpha-based pigments:
//
//     palette          class    Ciao      sheet stamp     crest
//     drawing-office   light    1.09      1.80 - 1.82     1.31
//     redline          light    1.00      1.80            1.24
//     sapphire         dark     1.14      2.17 - 2.23     3.17
//     ink-flare        dark     1.14      2.18 - 2.25     3.39
//     nocturne         dark     1.14      2.19 - 2.25     3.34
//     machine-room     dark     1.12      2.09 - 2.10     3.91
//     blueprint        dark     1.15      2.11 - 2.14     4.62
//     photostat        dark     1.12      2.14 - 2.23     5.52
//
//     band across all eight     x1.15     x1.25           x4.45
//
// ⚠ CIAO HAS STOPPED BEING AN INSTANCE, AND IT WAS REPAIRED BY WORK NOBODY FILED AGAINST THIS
// ENTRY. The recorded figures were 1.37 on light and 11.67 on dark — a whisper becoming a shout.
// It now paints `--color-background`, which is `canvas` on light and `band-dark` on dark, so the
// word reads as the page showing through a raised panel and is ALWAYS darker than the panel.
// 1.00 to 1.15 across eight palettes. `SiteFooter.tsx` carries that reasoning at the line.
//
// ⚠ AND THE CREST IS THE SECOND INSTANCE, MEASURED HERE FOR THE FIRST TIME. 1.24 on redline
// against 5.52 on photostat — a whisper on the light media and a legible 176px mark on the darkest
// one. It is `etch` at 55% alpha where the stamp is `etch` at 26%, and that is the whole difference:
// the same pigment role at twice the weight amplifies the ground flip instead of surviving it.
//
// **SO THE POPULATION IS REAL AND THE REGISTRY HAS EARNED ITSELF.** Three decorative consumers,
// two holding inside x1.25 and one spanning x4.45.
//
// ⚠ NO GATE IS BUILT HERE, AND THE REASON IS THAT EVERY AVAILABLE ONE WOULD DECIDE A DESIGN
// QUESTION NOBODY HAS RULED. Pinning today's bands blesses x4.45 as acceptable — the
// pin-the-current-state trap. Failing on x4.45 rules that a 176px watermark must be as quiet on
// near-black as on paper, which is an owner's call about a mark they have looked at on five
// palettes and not on the other three. **The measurement is the deliverable; the ruling is owed.**
//
// THE TWO CANDIDATE RULINGS, PRICED, so whoever takes it starts from evidence:
//   drop the crest's alpha toward the stamp's    — one value, and it makes the mark quieter on
//                                                  EVERY palette including the light ones where it
//                                                  is already 1.24
//   scope the alpha to the ground class          — a second value, and it is the honest shape if
//                                                  the mark is meant to read equally on both
//
// ---- ⚠ THE STALE-COMPUTED-VALUE REFUSAL, 2026-08-19, photostat, sanity 21.000 ------------
//
// THIRTY-SIX FALSE FINDINGS ACROSS FOUR PAGES, NINE PER PAGE, EVERY ONE THE NAV. They read 1.02 to
// 1.25 against a 4.5 floor on a ground of 156,156,156, and the pill paints dark with plainly
// legible links — confirmed by screenshot on five local pages and on the published site.
//
// THE MECHANISM, MEASURED RATHER THAN REASONED. Same element, same scroll position, same class
// list, eight seconds apart on a settled page:
//
//     getAnimations()   backgroundColor reported          --glass-fill on the element
//     5                 oklab(0.985 … / 0.58)   LIGHT     dark, correct
//     0                 color(srgb 0.1427 … / 0.5) DARK   dark, correct
//
// The var was right in both readings and the property that reads it was not. A pending transition
// makes getComputedStyle report the stale endpoint, and this sweep's entire premise is that the
// computed value IS the paint.
//
// ⚠ THE FIRST DIAGNOSIS WAS THE VIEWPORT AND IT WAS THE CORRELATION RATHER THAN THE CAUSE. The
// loudest run had measured a nav translated out of view, so this was boarded as "a sweep must run
// where its elements are painted". Off-screen was merely where transitions had most recently been
// kicked: the identical disagreement reproduces at scrollY 0 with the pill fully visible. REFUSING
// OFF-VIEWPORT ELEMENTS WOULD HAVE COST MOST OF THE SWEEP'S COVERAGE AND LEFT THE DEFECT — the
// wrong-noun shape, caught by testing the proxy against the state it was meant to explain.
//
// SO THE RECT IS INFORMATION AND THE ANIMATION IS THE PREDICATE. Every row now carries its rect
// and an onScreen flag, and the report carries scrollY and the viewport, because three refuted
// runs cost three rounds and one glance at a rect would have closed each. Nothing is refused for
// being off screen.
//
// PROVED IN BOTH DIRECTIONS ON ONE PAGE, WHICH IS WHAT A REFUSAL NOBODY HAS SEEN STAND DOWN IS
// WORTH NOTHING WITHOUT:
//
//     nav mid-transition   18 refused, the nav not reported     0 findings
//     nav settled          12 refused, the nav MEASURED         0 findings, and it passes
//
// ⚠ AND THE POPULATION IT SELECTS IS THE ONE THIS RECORD ALREADY NAMES. The animating targets on
// the home page are .nav-glass, .wf-thumb and the hero's SVG paths — the nav and the work-filter
// thumb being the two elements this file already carries false-ground entries about, and the paths
// drawing no text. A detector that lands on the known population rather than a wide one is the
// evidence that it is narrow.
//
// FIVE PAGES ON A PUBLISHED photostat BUILD, sanity 21.000 each run:
//
//     page                    measured   ground   unres-ground   transition   worst   findings
//     /                            131      105             14           12    4.79          0
//     /projects/boat-crest         119      113              6            0    5.24          0
//     /blog/<the motion post>       71       57             14            0    5.24          0
//     /gallery                      72       59             13            0    5.24          0
//     /palettes                    303      283             20            0    7 pct         0
//     TOTAL                        696      617             67           12              **0**
//
// TWELVE REFUSALS ACROSS 696 ELEMENTS REMOVED THIRTY-SIX FALSE FINDINGS, and on the four pages
// where the transition count is zero the nav was MEASURED and PASSED — so the rows did not vanish,
// they resolved. That distinction is the whole difference between a refusal and a suppression.
//
// ⚠ AND unresolvedGround KEEPS ITS EXACT OLD MEANING, WITH THE NEW TOTAL BESIDE IT. Folding the
// transition refusals into it would have moved a number every earlier run is quoted against, which
// is the running-total defect this record carries against a deploy count and a ralph headline.
// refusedTotal, refusedShare and a verdict that names what it could not measure are the additions.
//
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
// ⚠ NOT ENCODED AS A CODE EXCLUSION — AND THE REASON FIRST GIVEN HERE WAS WRONG. It read that the
// obvious predicate "covers one of the two", because `.footer-ciao` supposedly carried only two of
// the three parts. It carries all three. That was read off the className, where `aria-hidden` is an
// ATTRIBUTE and was sitting one line above it in the source the whole time.
//
// MEASURED FROM THE DOM ACROSS SEVEN PUBLIC PAGES:
//
//     aria-hidden alone                  312 elements, 74 of them drawing text
//     plus pointer-events and user-select  25 elements, ALL 25 drawing text
//
// The 25 are `footer-ciao`, the sheet stamps, and the hero's `crest` watermark. Everything that
// would still be reported is a real affordance — arrows, `hover ->`, `<- back`, `Click to zoom`.
// So the three-part predicate is exactly right and `aria-hidden` alone is exactly the over-wide
// rule `SkillsBody` already warned about. Whether to encode it is still its own decision rather
// than something smuggled in beside a correctness fix.
//   the work-filter chip    1.00 reported, 20.12 measured — the `pointer-events` limit above.
//   the About captions      1.35 and 1.45 — text over a 42% tint over a PHOTOGRAPH, which the
//                           refusal above now catches by its ancestor rather than by its own tag.
//
// ⚠ THE VALUE OF THE RUN IS NOT THE ZERO. It is that three of the four instrument faults corrected
// while building this were faults the record had already named — a sibling-painted ground, an
// element's own fill, and a foreground over a picture — and each was found by disbelieving a
// figure rather than by reading the code.
/* ---- THE DRIVER, AND IT EXISTS BECAUSE THE PASTE-IN METHOD CANNOT REACH A SECOND VIEWPORT ----
 *
 * The header said "paste FLOORS_SCRIPT into the console", and for an arc every figure in this file
 * was taken at ONE width, because the console this repository drives renders at a fixed viewport
 * and a resize call does not reach `innerWidth`. The mobile half was boarded as unreached for that
 * reason alone — an instrument limit wearing the clothes of an open question.
 *
 * playwright is already a dependency and `paint-sites` already launches chromium, so the driver is
 * a consumer of what exists rather than a new capability. It changes nothing about the script: the
 * same FLOORS_SCRIPT is evaluated, and pasting it still works.
 *
 * ⚠ IT SCROLLS WITH REAL WHEEL INPUT, WHICH IS NOT A STYLE CHOICE. Lenis overrides
 * `window.scrollTo` and fires no scroll event, so a programmatic scroll leaves every `.reveal-panel`
 * clipped and its contents at a zero-size rect. Measured on the home page: the paste-in method at
 * rest reads 131 elements and this driver reads 252, because half the page had never been revealed.
 * `page.mouse.wheel` dispatches an event the site actually listens to.
 *
 *   node ralph/tests/paint-floors.mjs 390 844        one width, five pages
 *   node ralph/tests/paint-floors.mjs 1920 928
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const W = Number(process.argv[2]);
  const H = Number(process.argv[3] || 900);
  if (!W) {
    console.log("paint-floors is a browser harness. Two ways to run it:");
    console.log("  node ralph/tests/paint-floors.mjs <width> <height>   drives chromium itself");
    console.log("  or paste FLOORS_SCRIPT into a console — see the header");
    console.log("It is skipped by run.mjs by name, like parity and paint-sites.");
  } else {
    const { chromium } = await import("playwright");
    const BASE = process.env.FLOORS_BASE || "http://localhost:3300";
    const PAGES = [
      "/",
      "/projects/boat-crest",
      "/blog/you-find-out-what-motion-is-for-by-removing-it",
      "/gallery",
      "/palettes",
    ];
    const b = await chromium.launch();
    const page = await (await b.newContext({
      viewport: { width: W, height: H }, deviceScaleFactor: 2,
    })).newPage();
    const rows = [];
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      const step = Math.floor(H * 0.8);
      const full = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < full; y += step) {
        await page.mouse.wheel(0, step);
        await page.waitForTimeout(120);
      }
      await page.mouse.wheel(0, -full * 2);
      await page.waitForTimeout(1500);
      const r = JSON.parse(await page.evaluate(FLOORS_SCRIPT));
      rows.push([p, r]);
    }
    await b.close();

    const pad = (v, n) => String(v).padStart(n);
    console.log(`paint-floors @ ${W}x${H}`);
    console.log("page                                 san  meas onScr struct share trans   dec  worst fail");
    let mT = 0, sT = 0, tT = 0, fT = 0;
    for (const [p, r] of rows) {
      mT += r.measured; sT += r.refusedStructural;
      tT += r.refusedTransitionPending; fT += r.failureCount;
      console.log(
        p.slice(0, 36).padEnd(37) + pad(r.sanity, 4) + pad(r.measured, 6) +
        pad(r.measuredOnScreen, 6) + pad(r.refusedStructural, 7) +
        pad(r.refusedStructuralShare, 6) + pad(r.refusedTransitionPending, 6) +
        pad(r.skippedDecorative + "/" + r.decorativeDeclared, 6) +
        pad(r.worst, 7) + pad(r.failureCount, 5));
    }
    console.log("TOTAL".padEnd(37) + pad("", 4) + pad(mT, 6) + pad("", 6) +
      pad(sT, 7) + pad("", 6) + pad(tT, 6) + pad("", 6) + pad("", 7) + pad(fT, 5));
    for (const [p, r] of rows) {
      for (const f of r.failures || []) {
        console.log("  FAIL " + p + "  " + JSON.stringify(f));
      }
    }
    /* ⚠ A NON-ZERO EXIT, BECAUSE A HARNESS THAT ONLY PRINTS IS ONE NOBODY CAN GATE ON. */
    if (fT > 0) process.exitCode = 1;
  }
}
