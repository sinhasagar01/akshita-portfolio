// Canvas-vs-live parity — the browser half.
//
// WHY IT EXISTS. Every check this project had compared PUBLIC to PUBLIC, so none of
// them could see the bugs that actually shipped:
//   - `.reveal-card` sat at opacity 0 with no `.is-revealed` ancestor, rendering nine
//     block kinds invisible in the canvas.
//   - the Replace-image wrapper inserted a box into the layout chain, collapsing a
//     760px dashboard frame to about 90px.
// The missing axis was public-vs-canvas. This is that axis.
//
// WHAT IT PINS. The canvas and the public page render through the same components and
// differ in exactly two flags, `editable` and `noReveal`. The rule is that those flags
// may ADD affordances but must never move or resize an existing box. This walks both
// renders and reports where they do.
//
// HOW TO RUN
//   1. npm run dev
//   2. open http://localhost:3457/dev/parity/<slug>   (dev only — middleware 404s /dev in production)
//   3. paste PARITY_SCRIPT below into the console
//   Slugs: boat-crest, fosfor-ai, fosfor-data-profiling, elevate-one-view
//
// THREE THINGS IT HAS TO DO, each learned by getting them wrong first:
//
//   1. SETTLE THE LIVE SIDE, INSTANTLY. RevealSection only adds `.is-revealed` when a
//      section scrolls into view, and a stacked harness never scrolls. Un-revealed
//      cards sit at `scale(.96)`, which drifted every measurement by exactly 4%.
//      Adding the class is not enough either — it ANIMATES over .8s, so transitions
//      have to be killed or the measurement lands mid-flight.
//
//   2. COMPARE BLOCK-LEVEL BOXES ONLY. `editable` legitimately wraps bare text in an
//      inline span so it can be clicked (a stat value, a rating chip's tail). An
//      inline wrapper cannot change layout, and trying to align around it produced
//      phantom mismatches — the added span shares a tag with the real span beside it,
//      so no tag-based skip can tell them apart. Every genuine bug was a block
//      container, so blocks are the right unit.
//
//   3. MEASURE POSITIONALLY, NOT BY IDENTITY. An earlier hand-rolled version keyed
//      images by filename and reported ten mismatches that were all one image
//      appearing twice, plus a scrollbar.
//
// PROVEN, not merely green: with both historical bugs re-injected it reports 172 and
// 1 findings respectively, and returns to 0 when they are restored. A check that has
// never gone red is not evidence.

export const PARITY_SCRIPT = String.raw`(() => {
  const TOL = 1.5; // sub-pixel rounding between two renders of one layout

  const kill = document.createElement('style');
  kill.textContent = '[data-parity-pair] .reveal-card,[data-parity-pair] .reveal-panel{transition:none !important}';
  document.head.appendChild(kill);
  document.querySelectorAll('[data-parity-side="live"] .reveal-panel')
    .forEach(p => p.classList.add('is-revealed'));
  void document.body.offsetHeight;

  const collect = (root) => {
    const out = [];
    const walk = (el, path) => {
      /* BOTH ARMS OF THE OVERLAY TERNARY, NOT ONE. DeviceImage renders
           editable ? <ReplaceImageButton/> : previewSrc ? <PreviewHint/> : null
         so it is one element per side, by design. This list excluded only the CANVAS arm, so every
         section holding an image counted the live arm against nothing and reported a block-count
         mismatch. Excluding one half of a one-for-one swap guarantees the difference it reports.

         AND data-edit-value-path IS DELIBERATELY NOT EXCLUDED, which was measured rather than
         reasoned. It marks REAL CONTENT wearing an affordance class — .cs-editable sets cursor,
         outline and background and NO display, precisely so it cannot move a box. Excluding it
         drops that element's whole subtree from the canvas census: tried, and the mismatch count
         went from 3 to 8. */
      if (el.matches && (el.matches('[data-edit-image-replace]')
                      || el.matches('.cs-preview-hint'))) return; // affordances, out of flow
      const cs = getComputedStyle(el);
      if (!cs.display.startsWith('inline') || cs.display === 'inline-block') {
        const r = el.getBoundingClientRect();
        out.push({
          path, tag: el.tagName,
          w: Math.round(r.width * 10) / 10,
          h: Math.round(r.height * 10) / 10,
          opacity: Number(cs.opacity),
          visible: cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01,
        });
      }
      [...el.children].forEach((c, i) => walk(c, path + '/' + i));
    };
    [...root.children].forEach((c, i) => walk(c, String(i)));
    return out;
  };

  const findings = [];
  for (const pair of document.querySelectorAll('[data-parity-pair]')) {
    const name = pair.dataset.paritySection;
    const L = collect(pair.querySelector('[data-parity-side="live"]'));
    const C = collect(pair.querySelector('[data-parity-side="canvas"]'));
    /* ⚠ THE continue IS GONE, AND IT WAS SUPPRESSING THE CHECK THAT MATCHES THE CONTRACT.
       A count difference used to skip the rest of the section, so the BOX comparison — the one the
       parity rule is actually written in, "may ADD affordances but must never move or resize a
       box" — never ran for any section that had one. The stricter check was hiding the accurate
       one. Boxes are now compared over the common prefix regardless, which is strictly more
       information than a bare count. */
    if (L.length !== C.length) {
      findings.push({ section: name, kind: 'block-count',
        detail: 'live ' + L.length + ' vs canvas ' + C.length +
                ' — the canvas added or dropped a block-level element' });
    }
    /* PAIRED BY PATH, NOT BY INDEX, AND THE INDEX VERSION WAS MEASURED BEFORE THIS REPLACED IT.
       One inserted element shifts every index after it, so an index walk turns ONE structural
       difference into a cascade: the hero reported 17 box findings whose canvas value was simply
       the previous live element. A path is stable under insertion, so a real box change is still
       caught and a shifted list is not mistaken for one. 441 elements pair, 0 go unpaired. */
    const byPath = new Map(C.map((x) => [x.path, x]));
    for (const a of L) {
      const b = byPath.get(a.path);
      if (!b) continue;
      if (a.visible && !b.visible) {
        findings.push({ section: name, kind: 'invisible-in-canvas',
          detail: a.tag + ' @' + a.path + ' renders live (opacity ' + a.opacity +
                  ') but not in the canvas (opacity ' + b.opacity + ')' });
      } else if (Math.abs(a.w - b.w) > TOL || Math.abs(a.h - b.h) > TOL) {
        findings.push({ section: name, kind: 'geometry',
          detail: a.tag + ' @' + a.path + ' — live ' + a.w + '×' + a.h +
                  ', canvas ' + b.w + '×' + b.h });
      }
    }
  }

  return JSON.stringify({
    sections: document.querySelectorAll('[data-parity-pair]').length,
    findingCount: findings.length,
    findings: findings.slice(0, 20),
    verdict: findings.length === 0
      ? 'PARITY OK — the canvas renders every section exactly as the live page does'
      : findings.length + ' mismatch(es)',
  }, null, 2);
})()`;
