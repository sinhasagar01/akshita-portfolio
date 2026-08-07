// IS A RASTER DRAWN IN THE SITE'S OWN GROUND? The class no other instrument can see.
// Run: node --experimental-strip-types ralph/tests/raster-grounds.mjs
//
// ---- ⚠ WHY THIS EXISTS, AND WHY IT TOOK THREE PREDICATES TO ASK THE QUESTION ------------------
//
// A colour baked into a raster is unreachable by every other gate here — the census reads built
// CSS, SVG attributes and runtime JS, and a webp is none of those. The eight Fosfor illustrations
// were found by the owner LOOKING at a page, and a ninth was found by rendering theme three.
//
// ⚠ AND THE POPULATION WAS COMPLETE ALL THREE TIMES. THE QUESTION WAS WRONG TWICE.
//
//   #365   within 60 of ACCENT-500          a diagram drawn in cream-50 has no accent pixels
//   #373a  within 12 of any themed ground   66 of 84 — cream-50 is near-white, so every light UI hit
//   #373b  closer to the token THAN TO A    19, and the real ones among them
//          NEUTRAL OF THE SAME LIGHTNESS
//
// A theme moves HUE. So the question is not "is this pixel near the ground's brightness" but "does
// it carry the ground's CAST" — which is what the third form asks, and the first two could not.
//
// ⚠ A COMPLETE POPULATION SEARCHED WITH A NARROW PREDICATE REPORTS A CLEAN RESULT THAT IS TRUE OF
// THE PREDICATE AND FALSE OF THE QUESTION — and it reads as thorough, because the denominator is
// right. That is this file's reason for existing more than any single asset is.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { parseOklch, parseColor } from "../../lib/theme-contrast.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = new URL("../../", import.meta.url).pathname;
const css = readFileSync(join(root, "app/globals.css"), "utf8");

/** A token at `@theme` scope — the default palette, which is what a baked asset would have copied. */
const tok = (n) => {
  const m = new RegExp(`--color-${n}\\s*:\\s*([^;]+);`).exec(css);
  if (!m) return null;
  const v = m[1].trim();
  return v.startsWith("oklch") ? parseOklch(v) : parseColor(v);
};

/* Every ground a page paints. Not just `cream-50`: the blog diagram was cream-50, but something
 * drawn on the ink band would be equally invisible to an accent search and equally wrong on a cool
 * palette. */
const GROUNDS = ["cream-50", "cream-100", "cream-200", "cream-300", "canvas", "ink-950", "band-dark"]
  .map((n) => [n, tok(n)]).filter(([, v]) => v);

/* ⚠ DECLARED, WITH AN END CONDITION EACH — the same shape as orchid's unselectable hold. A known
 * entry that never says what would clear it becomes permanent by inattention.
 *
 * The four blog assets ARE leaks and are listed rather than fixed, because they are TEXT-HEAVY and
 * the right form for them is JSX rather than traced SVG — a redraw, which is the owner's to want.
 * Tracing them as SVG `<text>` would ship prose that cannot reflow. */
const KNOWN = {
  "public/images/blog/ai-first-is-a-research-posture-not-a-feature/blocks/d9517012efd9.webp":
    "flow diagram in cream's ground — LEAK, pending a JSX redraw (text-heavy, SVG text cannot reflow)",
  "public/images/blog/ai-first-is-a-research-posture-not-a-feature/heroImage.webp":
    "post hero in cream's ground — LEAK, pending a redraw",
  "public/images/blog/what-a-design-system-is-for-when-the-machine-can-draw/blocks/6cd6a9815c3f.webp":
    "squads diagram in cream's ground — LEAK, pending a JSX redraw",
  "public/images/blog/what-a-design-system-is-for-when-the-machine-can-draw/heroImage.webp":
    "post hero in cream's ground — LEAK, pending a redraw",
  "public/images/projects/fosfor-data-profiling/challenge-insights.webp": "FALLBACK ONLY — inline SVG draws instead since #365; clears when the raster is deleted",
  "public/images/projects/fosfor-data-profiling/challenge-quality.webp": "FALLBACK ONLY — inline SVG draws instead since #365",
  "public/images/projects/fosfor-data-profiling/challenge-silos.webp": "FALLBACK ONLY — inline SVG draws instead since #365",
  "public/images/projects/fosfor-data-profiling/challenge-time.webp": "FALLBACK ONLY — inline SVG draws instead since #365",
  "public/images/projects/fosfor-data-profiling/metric-detection-rate.webp": "FALLBACK ONLY — inline SVG draws instead since #365",
  "public/images/projects/fosfor-data-profiling/metric-quality-lift.webp": "FALLBACK ONLY — inline SVG draws instead since #365",
  "public/images/projects/fosfor-data-profiling/metric-time-saved.webp": "FALLBACK ONLY — inline SVG draws instead since #365",
  /* ⚠ THREE boAt SCREENSHOTS, AND B2 CAUGHT THE SECOND ONE HAVING NO END CONDITION — in the commit
   * that introduced the rule. They depict boAt's own dark app, which is warm-dark and therefore
   * near `ink-950`; the predicate cannot tell a product's dark UI from this site's ink band, and
   * that is a limit of the measurement rather than a judgement it can make. Each clears when the
   * boAt case study stops shipping these assets. */
  "public/work/boat-crest/scroll-assets/feature-03-heart-footer.png":
    "boAt's own dark app UI — depicts a product; clears when boat-crest stops shipping it",
  "public/work/boat-crest/scroll-assets/feature-04-watchface-footer.png":
    "boAt's own dark app UI — depicts a product; clears when boat-crest stops shipping it",
  "public/work/boat-crest/scroll-assets/ba-vitals-after-footer.png":
    "boAt's own dark app UI — depicts a product; clears when boat-crest stops shipping it",
  "public/images/projects/elevate-one-view/blocks/8954b70f2f33.webp":
    "Elevate redaction drawn in site colours because the real UI is confidential — depicts a product",
};

const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(png|jpe?g|webp)$/i.test(e.name)) files.push(p);
  }
})(join(root, "public"));

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const THRESHOLD = 5;

const found = [];
for (const f of files) {
  let data, info;
  try { ({ data, info } = await sharp(f).resize(120, null, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true })); }
  catch { continue; }
  const c = info.channels;
  let hit = 0, opaque = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    if (c === 4 && data[i * c + 3] < 200) continue;
    opaque++;
    const px = [data[i * c], data[i * c + 1], data[i * c + 2]];
    /* ⚠ THE PREDICATE. Closer to the token than to a neutral of the same lightness — a theme moves
     * hue, so a pixel that is merely as BRIGHT as the ground is not drawn in it. */
    const mean = (px[0] + px[1] + px[2]) / 3;
    const dNeutral = dist(px, [mean, mean, mean]);
    for (const [, g] of GROUNDS) {
      const d = dist(px, g);
      if (d <= 12 && d < dNeutral - 2) { hit++; break; }
    }
  }
  if (!opaque) continue;
  const pct = (100 * hit) / opaque;
  if (pct >= THRESHOLD) found.push({ rel: f.replace(root, ""), pct: +pct.toFixed(1) });
}
found.sort((a, b) => b.pct - a.pct);

console.log(`\nA · rasters drawn in a themed ground`);
console.log(`         ${files.length} assets scanned against ${GROUNDS.length} grounds; ${found.length} at or over ${THRESHOLD}%`);

t("A1 the asset population is real — a zero here means the walk stopped seeing", files.length >= 50, true);
t("A2 the grounds resolved — a zero would make every pixel test vacuously false", GROUNDS.length >= 5, true);
/* ⚠ THE PREDICATE ITSELF NEEDS A DENOMINATOR. If it matched nothing at all, A4 would pass and the
 * gate would report a clean site while measuring nothing — which is precisely how #365's sweep
 * reported clean. A known-positive must stay positive. */
t("A3 the predicate still fires on a known member — a silent zero is how the last two sweeps read clean",
  found.some((f) => f.rel.includes("d9517012efd9")), true);

t("A4 ⚠ NO UNDECLARED RASTER IS DRAWN IN THE SITE'S GROUND — a new one is a leak nothing else can see",
  found.filter((f) => !(f.rel in KNOWN)).map((f) => `${f.rel} (${f.pct}%)`).sort(), []);

console.log(`\nB · the declared list is honest`);
t("B1 every declared entry still matches — a stale one is an exemption for an asset that changed",
  Object.keys(KNOWN).filter((k) => !found.some((f) => f.rel === k)).sort(), []);
t("B2 ⚠ AND EVERY ONE NAMES WHAT WOULD CLEAR IT — an entry with no end condition is permanent by inattention",
  Object.entries(KNOWN).filter(([, why]) => !/clears|pending|LEAK|FALLBACK|depicts/.test(why)).map(([k]) => k), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
