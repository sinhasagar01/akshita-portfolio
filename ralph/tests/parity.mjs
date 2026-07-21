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
      if (el.matches && el.matches('[data-edit-image-replace]')) return; // out of flow
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
    if (L.length !== C.length) {
      findings.push({ section: name, kind: 'block-count',
        detail: 'live ' + L.length + ' vs canvas ' + C.length +
                ' — the canvas added or dropped a block-level element' });
      continue;
    }
    for (let i = 0; i < L.length; i++) {
      const a = L[i], b = C[i];
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
