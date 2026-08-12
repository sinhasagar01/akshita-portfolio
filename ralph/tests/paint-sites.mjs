// THE PER-SITE PAINT CHECK — the ratchet's missing half.
//
// For every element that PAINTS text, does its foreground follow the ground it renders on?
//
// ⚠ THE UNIT IS THE SITE, NOT THE TOKEN, AND THAT IS THE WHOLE POINT. `role-layer`'s ratchet
// enumerated `ink-800` and `ink-950` by name the entire time they were painting invisible text on
// four dark palettes — it could not say WHICH of their 51 sites mattered, because a ceiling on
// tokens cannot. Four defects were found by a person reading an article because nothing asked this
// question of a site.
//
// ⚠ THE SUBJECT IS ELEMENTS WITH THEIR OWN TEXT NODE, not elements that merely inherit a colour.
// `cascade-public`'s fingerprint rule names the same restriction for the OPPOSITE purpose — there
// it suppressed false movement from 25 elements that inherited a colour and drew nothing; here it
// is what makes a stationary colour meaningful at all.
//
// ⚠ THE GROUND IS PIXEL-SAMPLED, NOT WALKED, AND THE FIRST VERSION PROVED WHY. An ancestor
// `background-color` walk returned "none" for EVERY element on a light palette, because the page
// ground is not on an ancestor there — so "the ground moved" was 0 by construction and the
// predicate could never fire. Making every glyph transparent turns the whole page into its own
// grounds in one full-page capture: the differencer, applied to grounds.
//
// ⚠ AND THE PREDICATE NEEDS BOTH HALVES: the ground moved AND the foreground did not. Foreground
// stationarity alone flags every label on an accent fill, which is correct behaviour rather than a
// defect.
//
// NOT RUNNABLE FROM `run.mjs` — it drives a browser against a dev server. Skipped BY NAME there,
// alongside `parity` and `upstream`, never silently dropped. Run it beside a render pass:
//     npm run dev        (in another shell)
//     node ralph/tests/paint-sites.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const YAML = "content/site-settings.yaml";
const orig = readFileSync(YAML, "utf8");
/* ⚠ A KILLED PROCESS HAS NO `finally`, AND EVERY PROBE IN THIS REPO RELIES ON ONE TO PUT THE
 * PUBLISHED THEME BACK. This suite runs long enough to be timed out — its first widened run was,
 * at ten minutes — and the kill left `site-settings.yaml` on whichever palette the loop was
 * mid-way through. That file is CONTENT WITH AN OWNER: leaving it changed is a silent
 * un-publishing, which is the exact failure the restore-from-main convention exists to prevent.
 * A `finally` covers a throw; only a signal handler covers a kill. */
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => { try { writeFileSync(YAML, orig); } catch {} process.exit(130); });
}
/* ⚠ THE SUBJECT IS THE PUBLIC SURFACE, ENUMERATED RATHER THAN SAMPLED. Every case study, a
 * published post, both indexes and the home page — because the defect this exists for was found on
 * ONE article by a person reading it, and a check that visits one page of each kind has the same
 * blind spot the ratchet had, one level up. */
const PAGES = [
  ["/", "home"],
  /* ⚠ THERE IS NO WORK INDEX ROUTE — the case studies are listed in the home page's work grid, and
     both `/work` and `/projects` render the 404 page. A2 caught it: the entry contributed 40 sites
     across 8 palettes, five per palette, which is a 404's worth of text. A 404 RETURNS 200 AND A
     FULLY DESIGNED PAGE here, so a wrong URL reads as a thin one rather than as an error — the same
     trap that produced a mislabelled hero capture earlier in this arc. */
  ["/blog", "blog index"],
  ["/blog/you-find-out-what-motion-is-for-by-removing-it", "post motion"],
  ["/blog/what-a-data-table-teaches-you-about-trust", "post table"],
  ["/projects/boat-crest", "boat"],
  ["/projects/elevate-one-view", "elevate"],
  ["/projects/fosfor-ai", "fosfor-ai"],
  ["/projects/fosfor-data-profiling", "fosfor-dp"],
  /* ⚠ THE TWO PLAYGROUND ROUTES WERE PUBLIC AND OUTSIDE THIS SUBJECT. `/palettes` had shipped an
     arc earlier and `/oklch` arrives with them; neither was in this list, so the ratchet that asks
     "does every painting element's foreground follow its ground" had never been asked of either.

     ⚠ AND THEY ARE THE PAGES MOST LIKELY TO BREAK IT, which is what makes the omission worth a
     note rather than a line. Both are ABOUT palettes: they mount real components, they override
     role tokens on a container, and they deliberately carry colours that must NOT follow the
     ground (the HSL comparison, the axis bands). A page whose whole subject is theming is the last
     place a theming ratchet should have no coverage.

     ⚠ THE SAME GAP EXISTS FOR THE SITEMAP AND IT IS THE SAME CAUSE — a list of routes that is only
     read when somebody is adding to it. The trigger for being in this list is being PUBLIC, not
     being in the nav; `/oklch` has no nav entry by design. */
  ["/palettes", "palettes"],
  ["/oklch", "oklch primer"],
];
/* ⚠ CREAM IS THE BASELINE AND EVERY OTHER PALETTE IS COMPARED TO IT, dark AND light. A light pair
 * still moves the ground — different hues — so a foreground frozen across two LIGHT palettes is a
 * hardcoded colour following no theme at all, which is the same defect one step quieter. */
/* ⚠ BOTH SIDES OF THE BREAKPOINT, BECAUSE MOBILE IS A DIFFERENT SUBJECT AND NOT A NARROWER ONE.
 * The site goes mobile all at once at `lg` (1024) — the nav becomes a morph and a sheet, columns
 * stack, and several sites exist at exactly one of the two widths. A check that runs at 1440 alone
 * has the ratchet's blind spot in a second dimension: complete over what it visits, silent about
 * what it never renders. 390 is a phone rather than a hair under the breakpoint, so the mobile
 * layout is measured where people actually meet it. */
const WIDTHS = [[1440, "desktop"], [390, "mobile"]];
const BASELINE = "cream";
const AGAINST = ["harbour", "orchid", "cerise", "fern", "sapphire", "ink-flare", "nocturne", "basalt"];

/* ⚠ EXEMPT ONLY WITH A REASON THAT SAYS WHEN IT ENDS — the shape `role-layer` section L refuses for
 * ground-invariant tokens, and the shape that let `on-accent`'s exemption outlive its own blocking
 * condition by an entire arc. */
const ALLOW = {
  "a.nav-cta": "the Resume pill's label is white on the ACCENT, not on the page ground. The accent's"
    + " VALUE moves per palette, which is why this site is flagged, and the PAIRING is safe: measured"
    + " 4.93 to 5.92 across all nine palettes through a canvas pixel, against a 4.5 floor. Ends if the"
    + " pill ever stops filling with the accent, or if any palette's accent-500 drops that pair below"
    + " 4.5.",
};

const collect = (pg) => pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    let own = "";
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim().length > 1) { own = n.nodeValue.trim(); break; }
    if (!own) continue;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    let p = el, s = [], i = 0;
    while (p && i++ < 3) { s.unshift(p.tagName.toLowerCase() + (typeof p.className === "string" && p.className.trim() ? "." + p.className.trim().split(/\s+/)[0] : "")); p = p.parentElement; }
    out.push({ key: s.join(">") + "|" + own.slice(0, 20), color: cs.color,
               x: Math.round(r.x + r.width / 2 + scrollX), y: Math.round(r.y + r.height / 2 + scrollY) });
  }
  return out;
});

async function grounds(pg, sites) {
  await pg.evaluate(() => { const st = document.createElement("style"); st.id = "gk";
    st.textContent = "*,*::before,*::after{color:transparent!important;text-shadow:none!important}";
    document.head.appendChild(st); });
  await pg.waitForTimeout(400);
  const buf = await pg.screenshot({ fullPage: true });
  await pg.evaluate(() => document.getElementById("gk")?.remove());
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => { if (x < 0 || y < 0 || x >= info.width || y >= info.height) return null;
    const i = (y * info.width + x) * info.channels; return `${data[i]},${data[i + 1]},${data[i + 2]}`; };
  return sites.map((s) => ({ ...s, ground: at(s.x, s.y) }));
}

const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const goto = async (u) => { for (let i = 0; i < 3; i++) { try { await pg.goto(u, { waitUntil: "domcontentloaded", timeout: 25000 }); return true; } catch { await pg.waitForTimeout(1500); } } return false; };

const per = [];
let flagged = [];
try {
  /* Capture each palette ONCE per page, then compare every palette to the baseline — so the page
     loads scale with palettes rather than with palette PAIRS. */
  for (const [W, wname] of WIDTHS) {
  await pg.setViewportSize({ width: W, height: 1000 });
  for (const [url, pname] of PAGES) {
    const name = `${pname} @${wname}`;
    const snap = {};
    for (const th of [BASELINE, ...AGAINST]) {
      writeFileSync(YAML, orig.replace(/^theme:.*$/m, `theme: ${th}`));
      if (!(await goto("http://localhost:3457" + url))) { snap[th] = null; continue; }
      await pg.waitForTimeout(1100);
      for (const y of [1200, 2600, 4000]) { await pg.evaluate((v) => scrollTo(0, v), y); await pg.waitForTimeout(320); }
      await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(550);
      snap[th] = await grounds(pg, await collect(pg));
    }
    const base = snap[BASELINE];
    if (!base) { per.push({ name, sites: 0, moved: 0, pairs: 0 }); continue; }
    const L = new Map(base.map((r) => [r.key, r]));
    let sites = 0, moved = 0, pairs = 0;
    for (const th of AGAINST) {
      if (!snap[th]) continue;
      pairs++;
      const D = new Map(snap[th].map((r) => [r.key, r]));
      const common = [...L.keys()].filter((k) => D.has(k) && L.get(k).ground && D.get(k).ground);
      const mv = common.filter((k) => L.get(k).ground !== D.get(k).ground);
      sites += common.length; moved += mv.length;
      flagged = flagged.concat(mv.filter((k) => L.get(k).color === D.get(k).color)
        .map((k) => ({ page: name, palette: th, key: k, color: L.get(k).color })));
    }
    per.push({ name, sites, moved, pairs });
  }
  }
} finally { writeFileSync(YAML, orig); await b.close(); }

const sites = per.reduce((a, p) => a + p.sites, 0), moved = per.reduce((a, p) => a + p.moved, 0);
for (const p of per) console.log(`         ${p.name.padEnd(12)} sites ${String(p.sites).padStart(5)}  ground-moved ${String(p.moved).padStart(5)}  palettes ${p.pairs}/${AGAINST.length}`);
console.log(`         TOTAL ${sites} site-comparisons, ${moved} on a moved ground, ${flagged.length} flagged`);

console.log("A · the subject is real — an error page has zero sites and would read as zero defects");
/* ⚠ THE ROW THAT WOULD HAVE CAUGHT THE DAY THIS WAS BUILT. Two versions of this probe reported
 * "0 defects" against an `Internal Server Error` page — 1137 bytes, no text — because a dev server
 * had been wiped mid-session. A zero denominator is not a pass, and this is where that is enforced
 * rather than remembered. Floors are LITERALS: a guard derived from its own subject cannot fail. */
t("A1 ⚠ THE SITE COUNT CLEARS A LITERAL FLOOR — a served error page reads as zero defects otherwise",
  sites > 6000, true);
t("A2 …and EVERY page contributed, so one silently empty page cannot hide behind the total",
  per.filter((p) => p.sites < 100).map((p) => p.name), []);
/* ⚠ AND EVERY PALETTE LOADED. A palette that fails to render contributes no pairs and its sites
 * simply never enter the total — an absent comparison is indistinguishable from a clean one. */
t("A2a …and every page compared against every palette, so a failed render cannot read as clean",
  per.filter((p) => p.pairs !== AGAINST.length).map((p) => `${p.name} ${p.pairs}/${AGAINST.length}`), []);
t("A3 …and the palettes genuinely differ, or 'ground moved' is vacuous",
  moved > 6000, true);
/* ⚠ EACH WIDTH CARRIES A REAL SUBJECT. Summing across widths lets one viewport render nothing while
 * the total still clears its floor — the emptiness defect one dimension out, and the reason A2
 * exists per page rather than per run. */
t("A3a ⚠ AND BOTH SIDES OF THE BREAKPOINT MEASURED SOMETHING — a viewport that renders nothing cannot hide in the total",
  WIDTHS.map(([, w]) => [w, per.filter((p) => p.name.endsWith("@" + w)).reduce((a, p) => a + p.sites, 0)])
    .filter(([, n]) => n < 1000).map(([w]) => w), []);

console.log("\nB · no site paints a frozen foreground on a ground that moved");
t("B1 ⚠ THE DEFECT ink-800 AND ink-950 WERE — a foreground that holds still while its ground inverts",
  flagged.filter((f) => !Object.keys(ALLOW).some((a) => f.key.includes(a))).map((f) => `${f.page}/${f.palette}: ${f.key} ${f.color}`).sort().filter((v,i,a)=>a.indexOf(v)===i), []);
t("B2 …and every exemption states when it ends, so 'known' cannot mean 'unexamined'",
  Object.entries(ALLOW).filter(([, why]) => !/\bEnds\b/i.test(why)).map(([k]) => k), []);
t("B3 …and no exemption outlives its subject — an entry nothing flags is stale",
  Object.keys(ALLOW).filter((a) => !flagged.some((f) => f.key.includes(a))), []);

console.log(`\npaint-sites result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
