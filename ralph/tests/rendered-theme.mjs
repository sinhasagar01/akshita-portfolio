// THE PUBLISHED THEME REACHES THE RENDERED HTML. The build-level fact, asserted at last.
// Run: node --experimental-strip-types ralph/tests/rendered-theme.mjs   (needs a production build)
//
// ---- ⚠ WHY THIS DID NOT EXIST UNTIL NOW, WHICH IS THE POINT OF IT ------------------------------
//
// `theme`'s E1–E4 assert the ROOT LAYOUT emits `data-theme` from the resolver. That is SOURCE-level
// and deliberately so — its own comment says the build fact belongs to a snapshot diff rather than
// a regex over `.next`.
//
// #326 then proved the build fact ONCE, BY HAND: two builds differing only in the content file,
// compared page by page, 10 files and 20 lines all `data-theme`. **It was never asserted again.**
//
// ⚠ AND IT TOOK A CONTROL RUN TO NOTICE. #346 ran every gate with harbour published, all 2520
// passed, and the honest reading was that the CSS bundle is byte-identical between themes so 58
// suites had an unchanged subject. THE ONE THING A CONTROL RUN SHOULD HAVE BEEN ABLE TO CONFIRM —
// that publishing a theme changes what ships — WAS THE ONE THING NOTHING CHECKED.
//
// A source assertion says the code intends to emit it. This says the bytes carry it.
//
// ---- ⚠ AND THE DENOMINATOR IS ASSERTED, BECAUSE THAT IS HOW THIS ONE WOULD GO QUIET ------------
//
// A gate reading prerendered HTML passes trivially if the build output moves and it finds no files.
// `A1` and `A4` make an empty or shrunken page set a FAILURE rather than a silent success — the
// shape `studio-ink-contrast`'s S4 was given for the same reason, and the shape C-9's exclusion and
// the vacuous parity run both had.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolveTheme } from "../../lib/theme.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const url = (p) => new URL(`../../${p}`, import.meta.url);

const APP = ".next/server/app";
if (!existsSync(url(APP))) {
  console.log("  NOT RUNNABLE — no production build. Run `npm run build` first.");
  console.log("\n0 passed, 0 failed (skipped)");
  process.exit(0);
}

/* The published value, read from the content file exactly as the site does — through the resolver,
 * so a malformed file fails closed here the same way it does for a visitor. */
const yaml = readFileSync(url("content/site-settings.yaml"), "utf8");
const published = resolveTheme((/^theme:\s*(\S+)/m.exec(yaml) ?? [])[1]);

const pages = [];
const walk = (rel) => {
  for (const e of readdirSync(url(rel), { withFileTypes: true })) {
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(child);
    else if (e.name.endsWith(".html")) pages.push(child);
  }
};
walk(APP);

console.log("\nA · every prerendered page carries the PUBLISHED theme");

t("A1 there are prerendered pages to check — an empty set is not a pass", pages.length >= 8, true);

const attr = (html) => (/<html[^>]*\sdata-theme="([a-z-]+)"/.exec(html) ?? [])[1] ?? null;
const read = (p) => readFileSync(url(p), "utf8");

const missing = pages.filter((p) => attr(read(p)) === null);
t("A2 ⚠ NO PAGE SHIPS WITHOUT THE ATTRIBUTE — named, so a regression says which page",
  missing.map((p) => p.replace(`${APP}/`, "")).sort(), []);

const wrong = pages
  .map((p) => ({ p, v: attr(read(p)) }))
  .filter((r) => r.v !== null && r.v !== published);
t(`A3 ⚠ AND EVERY ONE CARRIES "${published}", THE VALUE THE CONTENT FILE PUBLISHES`,
  wrong.map((r) => `${r.p.replace(`${APP}/`, "")} = ${r.v}`).sort(), []);

/* ⚠ THE ATTRIBUTE MUST BE ON `<html>`, NOT MERELY PRESENT SOMEWHERE IN THE DOCUMENT. #324 measured
 * that `html` paints the page ground — a 40px wrapper painted 40px of a 1060px viewport while
 * `<html>` painted the other 1020 — so the attribute landing on any other element is a theme that
 * leaves a band on every short page. `attr` above only matches inside the `<html …>` tag, and this
 * asserts the distinction is real rather than incidental. */
const onWrapper = pages.filter((p) => {
  const html = read(p);
  return attr(html) === null && /data-theme="/.test(html);
});
t("A4 …and it is on <html>, not on some wrapper below it — the host that paints the ground",
  onWrapper.map((p) => p.replace(`${APP}/`, "")).sort(), []);

/* The denominator, stated rather than implied: a build that stops emitting most pages would leave
 * A2 and A3 passing over a handful. */
console.log(`         ${pages.length} prerendered pages, all carrying data-theme="${published}"`);
t("A5 the page count is the whole prerendered surface, not a subset that happens to agree",
  pages.length >= 10, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
