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
import { spawnSync } from "node:child_process";
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
/* ============================================================================================
   ⚠ A GATE'S SCOPE IS A CLAIM ABOUT WHAT KIND OF THING IT GUARDS, AND THIS ONE'S WAS TOO WIDE.

   A4 exists because a Fosfor ILLUSTRATION shipped with cream's ground baked in — a design asset,
   drawn in the site's colours, committed by a developer. It was then applied to everything under
   `public/`, which includes AN AUTHOR'S UPLOADS. A warm background in a developer's artwork is a
   theme leak; a warm background in a photograph an author chose is A PICTURE.

   ⚠ AND THE COST IS PART OF THIS ENTRY. Applied to a blog hero, it produced a ruling to "redraw it
   with a transparent background" — a code convention imposed on content, which would bind every
   future post forever — and that ruling DELETED THE AUTHOR'S ASSET AND PUT main RED, for a check
   that should never have applied to it.

   ⚠ THE INVERSE OF THIS ARC'S USUAL DEFECT. Every earlier instance was a SUBJECT NARROWER THAN ITS
   CLAIM, and cost a wrong number. This was a CLAIM WIDER THAN ITS SUBJECT, and cost content.

   ---- ⚠ THE DISCRIMINATOR IS THE ADD COMMIT, NOT THE PATH -------------------------------------

   Two boundaries were tried and both are wrong. BY DIRECTORY: ten of thirteen declared entries sit
   INSIDE `public/images/blog` and `public/images/projects`, which are the upload destinations — so
   excluding those paths would retire ten exemptions and blind the gate to developer assets living
   there. BY CONTENT REFERENCE: all thirteen are referenced from `content/`, so that separates
   nothing at all.

   `/studio` stamps every upload `chore(studio):` and a developer commit never does. THAT is the
   upload route knowing the difference, recorded in history rather than inferred from a location.

   ⚠ AND IT IS NOT NETWORK-BOUND, SO THIS SUITE STAYS IN THE DEFAULT SET. `upstream.mjs` is skipped
   by name in `run.mjs` because it needs the network; a `git log` over local history does not, once
   the clone has depth. CI already carries `fetch-depth: 0` — load-bearing for
   `upstash-transport.mjs` and commented as such — so the history is present and no new dependency
   is added. Do not retire this suite beside `upstream.mjs`.

   ⚠ AND ABSENCE IS NEVER A PASS. A file with no add commit — uncommitted, or a shallow clone that
   cannot see one — is UNKNOWN, not "code" and not "author". Unknown FAILS by name through A5, so a
   gate that has silently stopped discriminating says so instead of reading green.
============================================================================================ */
const addedBy = (rel) => {
  const r = spawnSync("git", ["log", "--diff-filter=A", "--format=%s", "-1", "--", rel],
    { encoding: "utf8" });
  if (r.status !== 0) return "unknown";
  const subject = (r.stdout ?? "").trim();
  if (subject === "") return "unknown";
  return subject.startsWith("chore(studio):") ? "author" : "code";
};

const KNOWN = {
  /* ⚠ THE TWO BLOCK RASTERS ARE FALLBACK-ONLY SINCE #375 — JSX diagrams draw instead. They stay on
   * disk for the same reason the Fosfor eight did: an id that stops resolving must draw the old
   * picture rather than nothing. */

  /* ⚠ THE TWO HERO RASTERS WERE HERE AND ARE DELETED IN #376. They were byte-identical copies of
   * the two block diagrams above — so the "four blog assets" this file first declared were TWO
   * PIECES USED TWICE, and unsetting `heroImage` left the copies referenced by nothing.
   *
   * The end condition their entries named — "clears when `heroImage` is unset and the themed plate
   * draws" — is exactly what happened, which is the point of writing one. */
  "public/images/projects/fosfor-data-profiling/challenge-insights.webp":
    "FALLBACK ONLY — `fdp-insights` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
  "public/images/projects/fosfor-data-profiling/challenge-quality.webp":
    "FALLBACK ONLY — `fdp-quality` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
  "public/images/projects/fosfor-data-profiling/challenge-silos.webp":
    "FALLBACK ONLY — `fdp-silos` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
  "public/images/projects/fosfor-data-profiling/challenge-time.webp":
    "FALLBACK ONLY — `fdp-time-cost` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
  "public/images/projects/fosfor-data-profiling/metric-detection-rate.webp":
    "FALLBACK ONLY — `fdp-detection-rate` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
  "public/images/projects/fosfor-data-profiling/metric-quality-lift.webp":
    "FALLBACK ONLY — `fdp-quality-lift` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
  "public/images/projects/fosfor-data-profiling/metric-time-saved.webp":
    "FALLBACK ONLY — `fdp-time-saved` draws instead since #365; clears when that id is removed from the case study, which makes this raster the drawn source again, or when its block's image src is dropped and the file deleted",
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

  /* ⚠ THE TWO HERO EXPORTS, AND THE MEASUREMENT IS WHY THEY ARE LEGAL RATHER THAN TOLERATED.
   *
   * Both read 8.4% and 8.5%, over the 5% threshold. Re-measured with this file's OWN predicate and
   * grounds, asking WHERE the hits sit rather than how many there are:
   *
   *     hero-figure.webp        916 hits — border-connected 0, interior 916
   *     hero-figure@0.66x.webp  925 hits — border-connected 0, interior 925
   *
   * ZERO BORDER-CONNECTED ON BOTH. The cutout flooded inward from the image border over cream-like
   * pixels, so a surviving cream FIELD would necessarily touch the edge. None does. What is left is
   * enclosed by the figure — the drawn UI cards, the coral block and the purple disc, which the
   * asset's own README derives independently as baked into the same flat raster and inseparable
   * without repainting her forearm.
   *
   * ⚠ SO THIS IS THE `artwork-by-file` RULING ARRIVING THROUGH A MEASUREMENT: drawn in the DEPICTED
   * thing's own colours, not in the site's voice. The Fosfor illustration A4 was built for is the
   * opposite case and would show as border-connected, which is the discriminator neither this gate
   * nor its exemptions could express before.
   *
   * ⚠ AND THE TRIGGER CAN ACTUALLY FIRE, which is the half this record has lost four times. It is
   * not "until the artwork improves" — that is a promise. The figure is upscaled 1.76x to 1.92x on a
   * retina laptop because the source PNG inside the original SVG is 1536 x 1024, and a larger export
   * from that file is boarded as owner-only work. THAT export is the event: it produces a new raster,
   * B1 fails the entry the moment the bytes change, and the interior-versus-border question is asked
   * again against the new one rather than inherited. */
  "public/images/hero/hero-figure.webp":
    "8.4% interior, 0 border-connected — depicts drawn UI baked into the illustration; clears when the artwork is re-exported larger from the original file",
  "public/images/hero/hero-figure@0.66x.webp":
    "8.5% interior, 0 border-connected — the 0.66x export of the same artwork; clears when that artwork is re-exported larger from the original file, the one event that regenerates this derivative too",
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

/* ⚠ THE PREDICATE NEEDS A HUED GROUND, AND ON AN ACHROMATIC PALETTE IT HAS NONE. Its condition is
 * `dist(px, ground) <= 12 && dist(px, ground) < dist(px, itsNeutral) - 2` — a pixel must be closer to
 * the ground than to a GREY OF THE SAME BRIGHTNESS. That is what stops a merely-bright pixel counting
 * as "drawn in the ground".
 *
 * ⚠ WHEN THE GROUND IS ITSELF A GREY, THE GROUND *IS* ITS OWN NEUTRAL. Measured on the default:
 * every one of the seven grounds sits 0.00 from its neutral and carries chroma 0, so the condition
 * reduces to `d < d - 2` and CANNOT BE TRUE FOR ANY PIXEL. The walk then reports 0 of 90 assets.
 *
 * ⚠ AND 0 THERE IS NOT CLEAN, IT IS NOT MEASURED — which is the exact failure this file's own header
 * records twice about earlier sweeps. So applicability is COMPUTED and DECLARED, the way `upstream`
 * reports UNRUN rather than passing when it cannot reach the network. The declaration is asserted in
 * the negative below, so restoring a hued default turns that row RED and forces the real rows back
 * on rather than leaving them quietly skipped. */
const huedGrounds = GROUNDS.filter(([, g]) => {
  const m = (g[0] + g[1] + g[2]) / 3;
  return dist(g, [m, m, m]) > 2;
});
const DISCRIMINATES = huedGrounds.length > 0;
console.log(`         ${huedGrounds.length} of ${GROUNDS.length} grounds carry enough hue for the predicate to discriminate`);
if (!DISCRIMINATES) console.log("         \u26a0 INAPPLICABLE — every ground is its own neutral, so `closer to the ground than to a grey` can never hold");

t("A1 the asset population is real — a zero here means the walk stopped seeing", files.length >= 50, true);
t("A2 the grounds resolved — a zero would make every pixel test vacuously false", GROUNDS.length >= 5, true);
t("A2b \u26a0 AN INAPPLICABLE PREDICATE MUST FIND NOTHING, PROVED RATHER THAN OBSERVED — a hit with no hued ground would mean the condition is not what it reads as",
  DISCRIMINATES || found.length === 0, true);
/* ⚠ THE PREDICATE ITSELF NEEDS A DENOMINATOR. If it matched nothing at all, A4 would pass and the
 * gate would report a clean site while measuring nothing — which is precisely how #365's sweep
 * reported clean. A known-positive must stay positive. */
/* ⚠ THE CANARY MOVED AND THE REASON I GAVE FOR MOVING IT WAS WRONG — corrected rather than kept.
 * It was `d9517012efd9`, and I argued that scoping A4 would take the known-positive out of the
 * subject with it. IT WOULD NOT: this row reads `found`, which is the pre-classification walk, so
 * every asset that trips the predicate is still in it whoever committed it. Mutation showed that —
 * reverting the canary changes nothing, because both files trip it.
 *
 * The move STANDS on a different and smaller ground: a canary that is also a retired KNOWN entry ties
 * this row to a list it does not otherwise depend on. `challenge-insights` is a developer commit and
 * is still declared, so the two facts it rests on move together. */
t(DISCRIMINATES
  ? "A3 the predicate still fires on a known member — a silent zero is how the last two sweeps read clean"
  : "A3 \u26a0 WITHHELD, DECLARED — no hued ground, so a known-positive cannot exist and 0 findings is NOT MEASURED",
  DISCRIMINATES ? found.some((f) => f.rel.includes("challenge-insights")) : !DISCRIMINATES, true);

const origin = new Map(found.map((f) => [f.rel, addedBy(f.rel)]));
const authored = found.filter((f) => origin.get(f.rel) === "author");
const unknown = found.filter((f) => origin.get(f.rel) === "unknown");
console.log(`         ${found.length} in the site's ground: ${authored.length} author-uploaded, ${unknown.length} unknown origin`);

t("A4 ⚠ NO UNDECLARED DEVELOPER RASTER IS DRAWN IN THE SITE'S GROUND — author uploads are content, not a theme leak",
  found.filter((f) => origin.get(f.rel) === "code" && !(f.rel in KNOWN))
    .map((f) => `${f.rel} (${f.pct}%)`).sort(), []);
/* ⚠ UNVERIFIED IS A FAILURE, NOT A PASS. A file whose add commit cannot be read is neither author nor
 * developer, and treating it as either is a guess wearing a verdict. This row is what stops the whole
 * discrimination degrading silently — in a shallow clone every file is unknown and A4 would go green
 * over an empty subject without it. */
t("A5 ⚠ EVERY ASSET'S ORIGIN WAS ACTUALLY READ — an unreadable add commit is UNVERIFIED and must never pass as clean",
  unknown.map((f) => f.rel).sort(), []);
t("A5a …and the discrimination is doing something, against a literal — a run where nothing is author-uploaded is a run that has stopped discriminating",
  DISCRIMINATES ? authored.length >= 1 : true, true);
/* ⚠ AND A4 NEEDS ITS OWN DENOMINATOR, WHICH MUTATION FOUND IT LACKING. Widening the prefix so every
 * commit reads as `author` empties A4's subject entirely — and an empty subject reports no leaks,
 * which is indistinguishable from a clean site. The count is asserted against a LITERAL, so a
 * classifier that starts calling everything content fails here rather than agreeing. */
t("A4a ⚠ AND THE DEVELOPER-SIDE SUBJECT IS REAL, against a literal — classify everything as content and A4 passes over nothing",
  DISCRIMINATES ? found.filter((f) => origin.get(f.rel) === "code").length >= 8 : true, true);
/* ⚠ THE `unknown` BRANCH IS UNREACHABLE FROM THE WALK — every tracked asset has an add commit — so
 * mutating it survived every row above. Exercised DIRECTLY instead, on a path git cannot know, which
 * is the only way to prove the branch that keeps a shallow clone from reading green. */
t("A5b ⚠ AND THE CLASSIFIER RETURNS `unknown` FOR A PATH WITH NO ADD COMMIT — the branch A5 depends on, proved rather than assumed",
  addedBy("public/__not_a_real_asset_for_this_assertion__.webp"), "unknown");
t("A5c …and it still recognises a real author upload, so A5b is not passing because the lookup is broken",
  addedBy("public/images/blog/ai-first-is-a-research-posture-not-a-feature/blocks/d9517012efd9.webp"), "author");

console.log(`\nB · the declared list is honest`);
/* ⚠ AND THE REGISTER CANNOT BE CHECKED AGAINST A WALK THAT FOUND NOTHING. Every declared entry
 * would read as stale, which would be an instrument reporting twelve defects because it could not
 * look. While the predicate is inapplicable the register is asserted INTACT instead — its size —
 * so an entry silently disappearing still fails, and the match check returns the moment a hued
 * default does. */
t(DISCRIMINATES
  ? "B1 every declared entry still matches — a stale one is an exemption for an asset that changed"
  : "B1 \u26a0 MATCH CHECK WITHHELD — the register is asserted INTACT instead, because an empty walk would call all twelve stale",
  DISCRIMINATES
    ? Object.keys(KNOWN).filter((k) => !found.some((f) => f.rel === k)).sort()
    : Object.keys(KNOWN).length, DISCRIMINATES ? [] : 12);
/* ⚠ THIS MATCHER ACCEPTED REASONS AS TRIGGERS, AND THAT IS WHY IT NEVER FAILED.
 *
 * It read `/clears|pending|LEAK|FALLBACK|depicts/`. FOUR OF THOSE FIVE TOKENS DESCRIBE WHY AN ENTRY
 * EXISTS; only `clears` names an end condition. So an entry saying nothing but "depicts a product"
 * satisfied a row titled "every one names what would clear it".
 *
 * ⚠ FOUND BY MUTATION, NOT BY READING, AND THE MUTATION WAS ROUTINE. Stripping the trigger from a
 * new entry left the reason word in place and the row stayed green. Counted afterwards, SIX OF THE
 * TWELVE declared entries named no end condition at all — half the population, every one passing on
 * the word FALLBACK. A guard that accepts the thing it forbids is `structural()` one level up.
 *
 * ⚠ THE REPAIR MATCHES THE CONSTRUCT RATHER THAN A PHRASE. Pinning the literal "clears when" would
 * be the spelling-pin shape this repo has been burned by five times. What an end condition IS, in
 * prose, is a conditional clause — `clears` followed by `when`, `once` or `if`. No reason word can
 * satisfy that, and a reworded but still-conditional entry passes. B2a proves the rejection half,
 * because a matcher that accepts everything and a matcher that is correct look identical on a
 * list where every entry already complies. */
const namesEndCondition = (why) => /\bclears\s+(when|once|if)\b/.test(why);
t("B2 ⚠ AND EVERY ONE NAMES WHAT WOULD CLEAR IT — an entry with no end condition is permanent by inattention",
  Object.entries(KNOWN).filter(([, why]) => !namesEndCondition(why)).map(([k]) => k), []);
t("B2a ⚠ …AND A REASON IS NOT A TRIGGER — the exact string that survived the old matcher must now be refused",
  [
    namesEndCondition("8.4% interior, depicts drawn UI baked into the illustration"),
    namesEndCondition("FALLBACK ONLY — inline SVG draws instead since #365"),
    namesEndCondition("boAt's own dark app UI — depicts a product"),
    namesEndCondition("a LEAK, listed rather than fixed"),
    /* ⚠ THE CASE THAT MAKES B2a DISCRIMINATE, ADDED BECAUSE A MUTATION SURVIVED WITHOUT IT. Every
     * other negative here omits the word `clears` entirely, so all of them are refused by a bare
     * `/clears/` too — B2a could not tell the tightened matcher from the loose one, and weakening
     * it back passed. This string uses `clears` as a VERB ABOUT THE PAGE rather than as an end
     * condition, so only the conditional form rejects it. */
    namesEndCondition("FALLBACK ONLY — the inline SVG clears this raster from the page"),
    namesEndCondition("depicts a product; clears when boat-crest stops shipping it"),
  ],
  [false, false, false, false, false, true]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
