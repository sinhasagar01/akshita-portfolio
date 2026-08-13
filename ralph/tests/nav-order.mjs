// THE NAV ARRAY IS DOM ORDER, AND ONE FUNCTION READS IT THAT WAY.
// Run: node ralph/tests/nav-order.mjs
//
// ---- ⚠ WHY THIS EXISTS: THE FOURTH ITERATION SITE ----------------------------------------------
//
// `SiteHeader`'s `NAV` is the only enumeration of home-page sections, and the record names THREE
// render sites — the bar, the scrolled sheet, the mobile menu. There is a fourth, and nothing named
// it: `getActiveSection()`, the scroll spy.
//
//     for (const item of NAV) { … if (el.getBoundingClientRect().top <= HEADER_H + 2) current = item.id; }
//
// It keeps the LAST entry whose top is above the header, which is only correct while the array is in
// DOM ORDER. Every other consumer on that page keys on IDENTITY — `ScrollManager` holds a pixel
// offset and knows no ids, `RevealSection` keys on its own viewport entry, the hero observer looks
// up `#hero`, the sitemap enumerates routes. THE SPY IS THE ONLY THING THAT READS SEQUENCE.
//
// So moving a section on the home page is two edits or a silent defect: with `NAV` stale the spy
// sets `current` to the section you are in and then OVERWRITES it with one further down the array,
// and the nav highlights the wrong link. Nothing goes red, and no class-string check can see it.
//
// ---- ⚠ AND THE CUE'S TARGET IS ASSERTED RATHER THAN DERIVED, WITH ITS REASON -------------------
//
// The hero's scroll cue is an anchor into the first section. Its COPY is `heroScrollCue` in
// site-settings — author-editable in /studio's hero panel — and its DESTINATION is hardcoded in
// `HeroSection`, twice. They agreed by coincidence.
//
// The copy CANNOT derive the target: it is free text, and "Take a look below" yields no id. So the
// pair is asserted. An author renaming the cue cannot break where it goes; what they can still do is
// describe it wrongly, and that is an authoring error no gate can see. Saying so is the point —
// this closes the mechanical half and names the half it does not reach.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/* ⚠ COMMENTS BLANKED IN ALL THREE. Every one of these files discusses the ids it declares — the NAV
 * array's entries carry paragraphs naming `work`, `process` and `gallery`, and the hero's cue note
 * quotes its own href. Three separate tools in this repository have matched their own prose. */
const read = (p) => blankCommentBodies(readFileSync(join(root, p), "utf8"));

const header = read("components/layout/SiteHeader.tsx");
const page = read("app/(portfolio)/page.tsx");
const hero = read("components/sections/HeroSection.tsx");

console.log("\nA · the two orders are real before they are compared");
/* NAV's non-route entries, in array order. A route has an `href`; `isRoute` derives that, and this
 * mirrors it rather than listing which entries are routes. */
const navBlock = (header.match(/const NAV = \[([\s\S]*?)\n\] as const/) ?? header.match(/const NAV = \[([\s\S]*?)\n\];/) ?? ["", ""])[1];
const navEntries = [...navBlock.matchAll(/\{\s*id:\s*"([a-z-]+)"[^}]*\}/g)].map((m) => ({ id: m[1], route: /href:/.test(m[0]) }));
const navSections = navEntries.filter((e) => !e.route).map((e) => e.id);

/* The page's section order, DERIVED — each component is opened and its own id read out of it.
 *
 * ⚠ THE FIRST VERSION OF THIS WAS A HARDCODED `{ ProjectsSection: "work", … }` MAP, and it was
 * missing `ContactSection`. NAV carries four sections and the map covered three, so `contact` went
 * unchecked while the row read as covering everything. A fixed list inside the gate written to stop
 * two lists disagreeing — caught on this gate's first run, by its own output printing the two rows
 * side by side. */
const mainBlock = (page.match(/<main[\s\S]*?<\/main>/) ?? ["", ""])[0];
const idOfComponent = (name) => {
  for (const dir of ["components/sections", "components"]) {
    try {
      const src = blankCommentBodies(readFileSync(join(root, `${dir}/${name}.tsx`), "utf8"));
      const m = src.match(/<(?:RevealSection|section)[^>]*\sid="([a-z-]+)"/);
      if (m) return m[1];
    } catch { /* not in this directory */ }
  }
  return null;
};
const rendered = [...mainBlock.matchAll(/<([A-Z][A-Za-z]*Section)\b/g)].map((m) => m[1]);
const pageSections = rendered.map(idOfComponent).filter(Boolean);

console.log(`      NAV sections : ${navSections.join(" → ")}`);
console.log(`      page order   : ${pageSections.join(" → ")}`);
t("A1 the NAV array was parsed and holds section entries, so A3 is not comparing empties",
  navSections.length >= 3, true);
t("A2 …and the page's section order was parsed too", pageSections.length >= 3, true);
/* ⚠ EVERY NAV SECTION MUST BE FOUND ON THE PAGE, which is the direction that matters. The reverse is
 * NOT required and asserting it was wrong: `SkillsSection` renders `#skills` and is deliberately not
 * in the nav, and `ExperienceSection` carries no id at all. NAV IS THE NAV, NOT A TABLE OF CONTENTS.
 * The first draft demanded equality and went red on both — a gate asserting more than its subject
 * needs, which is how an exemption list gets born. */
t("A2a …and every NAV section is actually rendered — a nav entry with no section is a dead link",
  navSections.filter((id) => !pageSections.includes(id)), []);
/* ⚠ THE ROW THE MOVE EXISTS FOR, AND IT IS A RELATIVE-ORDER CLAIM RATHER THAN AN EQUALITY ONE.
 * `getActiveSection()` iterates NAV and keeps the LAST entry above the header, so what it needs is
 * that NAV's sections appear in the page in the SAME RELATIVE ORDER. Sections the nav does not list
 * are irrelevant to it — `#skills` sits between `about` and `contact` and changes nothing.
 * Compared as a SEQUENCE, never as a set: a set comparison passes on exactly the defect. */
const navPositions = navSections.map((id) => pageSections.indexOf(id));
t("A3 ⚠ NAV's SECTIONS APPEAR IN PAGE ORDER — the spy reads NAV as DOM order and nothing else on the page does",
  navPositions, [...navPositions].sort((a, b) => a - b));

console.log("\nB · the spy still reads order, so A3 is guarding something");
/* ⚠ IF THE SPY EVER STOPS ITERATING NAV, A3 BECOMES A RULE ABOUT NOTHING. A gate whose subject has
 * quietly gone away is one this record has found four times; it must fail rather than pass. */
t("B1 `getActiveSection` still iterates NAV rather than keying on identity",
  /for \(const item of NAV\)/.test(header), true);
t("B2 …and still keeps the LAST match, which is what makes the order load-bearing",
  /top <= HEADER_H \+ 2\) current = item\.id/.test(header), true);

console.log("\nC · the hero cue points at the first section");
const cueHrefs = [...hero.matchAll(/href="#([a-z-]+)"\s*\n\s*className="hero-scroll"/g)].map((m) => m[1]);
const cueLookups = [...hero.matchAll(/getElementById\("([a-z-]+)"\)/g)].map((m) => m[1]);
console.log(`      cue href : ${cueHrefs.join(", ") || "none"}   ·   lookups in file: ${cueLookups.join(", ")}`);
t("C1 the cue anchor was found, so C2 and C3 are not asserting over nothing", cueHrefs.length, 1);
/* ⚠ BOTH HALVES, BECAUSE THE ANCHOR AND THE HANDLER ARE SEPARATE STRINGS. Changing one and not the
 * other gives a link that goes somewhere different depending on whether smooth scrolling is on. */
t("C2 ⚠ THE CUE'S href AND ITS getElementById AGREE — two strings, one destination",
  cueLookups.includes(cueHrefs[0]), true);
t("C3 ⚠ …AND IT IS THE FIRST SECTION ON THE PAGE — an author can rename the cue's words in /studio, and this is what stops the destination drifting from them",
  cueHrefs[0], pageSections[0]);

console.log(`\nnav-order result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
