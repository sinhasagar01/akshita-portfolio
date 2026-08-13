// EVERY LIST OF ROUTES IN THIS REPO, JOINED AGAINST THE ROUTES THAT ACTUALLY EXIST.
// Run: node --experimental-strip-types ralph/tests/route-coverage.mjs   (needs a production build)
//
// ---- ⚠ THREE ROUTE LISTS DECAYED THE SAME WAY AND NOTHING COULD SEE IT ------------------------
//
// `app/sitemap.ts` missed `/blog` until a nav link shipped, then missed `/palettes` for an entire
// arc. `ralph/tests/paint-sites.mjs` had never visited either playground route, so the visual
// ratchet — does every painting element's foreground follow its ground — had never been asked of
// the two pages that are ABOUT theming.
//
//   A ROUTE LIST IS ONLY EVER READ BY SOMEBODY PUTTING SOMETHING INTO IT.
//
// So a route that ships without an edit to the list stays invisible until the NEXT route ships,
// and the discovery is always accidental. Both were found in one hour, by a brief that sent
// somebody to one of the suites for an unrelated reason.
//
// ---- ⚠ THE RULE, AND WHY IT IS NOT "REMEMBER TO ADD IT" --------------------------------------
//
// The sitemap's own header recorded the decay TWICE and stated the rule as "until the nav link
// shipped" — right about what happened, and TOO NARROW, because it tied listing to the nav.
// `/oklch` is public, prerendered and indexable, and has NO nav entry by design; under that rule
// it would be correctly omitted and wrongly invisible.
//
//   MEMBERSHIP IS A PROPERTY OF THE ROUTE — being a public prerendered page — NOT A PROPERTY OF
//   WHERE IT IS LINKED FROM.
//
// ---- ⚠ WHY THE LISTS ARE NOT SIMPLY REPLACED BY THE DERIVATION -------------------------------
//
// The obvious move is to delete both lists and generate them. It is right for the SITEMAP, whose
// membership is exactly "is a public page", and wrong for `paint-sites`, which drives a browser
// across nine palettes at two viewports — 21 pages would roughly double a run already long enough
// to be timed out once.
//
// So the subject is DERIVED and the exclusions are DECLARED WITH REASONS, which is the shape
// `docs/colour-boundary.yaml` already uses for colours. An exclusion that names a property can be
// argued with; a list that names routes cannot fall out of date without this going red.
// ---- ⚠ MUTATION-TESTING THIS SUITE REQUIRES A REBUILD BETWEEN MUTATIONS ----------------------
//
// Section B reads `.next/server/app/sitemap.xml.body` — BUILT output. `mutate.mjs --revert-edit`
// restores SOURCE, which is exactly what it promises and is not enough here: the previous
// mutation's sitemap stays in `.next` until something rebuilds it.
//
// Proving these rows cost one confusing round because of it. Three mutations were run in
// sequence with a single build, and the failures ACCUMULATED — B1 stayed red under the mutation
// aimed at C1, and both stayed red under the one aimed at C3, which reads as three rows
// entangled rather than three rows each catching their own defect.
//
//   A REVERTED SOURCE AND A STALE ARTEFACT LOOK IDENTICAL TO A GATE THAT READS THE ARTEFACT.
//
// Rebuilt from a clean tree, each mutation reddens ONLY its own row. This is the stale-build
// hazard this repo records against `colour-census` and `rendered-theme`, arriving inside a
// MUTATION LOOP, where the wrong conclusion is about the assertions rather than about the code.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");

/* ============================================================================================
   A · THE DERIVED SUBJECT — every public page the build actually produced.

   ⚠ THE FOUR EXCLUSIONS ARE PROPERTIES OF THE ROUTE, NOT NAMES. A file extension makes it an
   asset rather than a page; an `/og` suffix makes it a generated share image; `/_not-found` is the
   error page, which is reachable and is not a destination; and a route the MIDDLEWARE refuses in
   production is not public however thoroughly the build prerendered it. Each is a shape a future
   route can match or not match on its own, which is what stops this list becoming the thing it
   replaces.

   ⚠ THE FOURTH ARRIVED WITH A DEV HARNESS AND THE GATE CAUGHT IT, WHICH IS WORTH RECORDING
   BECAUSE THE FAILURE READ AS A SITEMAP BUG. `/dev/gallery-overlay` is a static page, so the build
   prerenders it and the manifest lists it exactly like `/blog` — B1 then reported a public page
   missing from the sitemap, and the correct answer was neither to list it nor to name it in an
   exclusion. `middleware.ts` returns 404 for the whole `/dev` prefix when NODE_ENV is production.
   THAT is the property, and it is READ FROM THE MIDDLEWARE rather than restated here, so a change
   to the prefix or to the refusal cannot leave this filter quietly describing the old behaviour.
============================================================================================ */
const manifest = JSON.parse(read(".next/prerender-manifest.json"));
const allRoutes = Object.keys(manifest.routes ?? {});
const isAsset = (r) => /\.[a-z0-9]+$/i.test(r);
const isOgImage = (r) => r.endsWith("/og");
const isErrorPage = (r) => r === "/_not-found";

/* The prefix the middleware refuses in production, parsed from the middleware itself. A literal
   here would be a fifth fixed list — and the one thing this file exists to argue against. */
const middleware = read("middleware.ts");
const devPrefixMatch = middleware.match(/pathname\.startsWith\("([^"]+)"\)/);
const DEV_PREFIX = devPrefixMatch?.[1] ?? null;
const isProdRefused = (r) => DEV_PREFIX !== null && r.startsWith(DEV_PREFIX);

const PAGES = allRoutes
  .filter((r) => !isAsset(r) && !isOgImage(r) && !isErrorPage(r) && !isProdRefused(r))
  .sort();

console.log("\nA · the derived subject is real");
/* ⚠ A LITERAL FLOOR, NOT A COUNT DERIVED FROM THE SAME MANIFEST. A guard computed from its own
 * subject cannot fail when the subject hollows out — this repo has two recorded instances of
 * exactly that, and both looked finished. A missing `.next` gives zero and must go red. */
t("A1 the build produced a page set — a stale or absent .next reads as zero defects otherwise",
  PAGES.length >= 12, true);
t("A2 …and the exclusions removed something, so the filter is doing work rather than passing everything",
  allRoutes.length > PAGES.length, true);
/* The three known-good anchors. If these ever fall out, the manifest shape changed under us and
 * every row below is measuring something else. */
t("A3 …and it holds the routes every other row depends on",
  ["/", "/blog", "/palettes", "/oklch"].filter((r) => !PAGES.includes(r)), []);
/* ⚠ THE PRODUCTION-REFUSED EXCLUSION IS PARSED, NOT ASSUMED, AND ITS SUBJECT IS ASSERTED. If the
 * middleware stops matching this shape the parse yields null, the filter silently excludes
 * NOTHING, and a dev route would rejoin the public set as a sitemap failure nobody could explain.
 * A2 would still pass, because the other three exclusions keep removing something. */
t("A3a the production-refused prefix is readable from the middleware, not restated here",
  DEV_PREFIX, "/dev/");
/* ⚠ AND IT HAS MEMBERS, so the rule is not passing by selecting nothing — C3's discipline applied
 * to the subject's own filter rather than to the ratchet's. A build with no dev harness would make
 * this row red, which is correct: the exclusion would then be unexercised and should be removed. */
t("A3b …and it excludes real routes, so the rule is exercised rather than merely declared",
  allRoutes.filter(isProdRefused).length >= 1, true);

/* ============================================================================================
   B · THE SITEMAP LISTS EVERY PUBLIC PAGE.

   ⚠ READ FROM THE EMITTED XML, NOT FROM THE SOURCE. `app/sitemap.ts` awaits the content reader and
   imports through `@/`, neither of which ralph's raw loader can follow — and a source grep would
   be a proxy for the output rather than the output. The build writes the real thing.
============================================================================================ */
const xml = read(".next/server/app/sitemap.xml.body");
const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(/^https?:\/\/[^/]+/, "") || "/")
  .sort();

console.log("\nB · the sitemap lists every public page");
t("B0 the sitemap was read and parsed — an empty match set would make B1 vacuous",
  listed.length >= 10, true);
/* ⚠ NO EXCLUSIONS HERE, AND THAT IS THE FINDING RATHER THAN A CONVENIENCE. Every public page
 * belongs in a sitemap; there is no property that makes one of them not want a crawler. The nine
 * `/palettes/<slug>` routes were the last holdout and they are SHAREABLE BY DESIGN — the console's
 * `Link` button hands exactly those URLs to visitors. */
t("B1 ⚠ EVERY PUBLIC PAGE IS IN THE SITEMAP — the omission this file exists to make impossible",
  PAGES.filter((p) => !listed.includes(p)), []);
t("B2 …and it advertises nothing that was not built, which would be a crawler pointed at a 404",
  listed.filter((l) => !PAGES.includes(l)), []);

/* ============================================================================================
   C · THE VISUAL RATCHET VISITS EVERY PUBLIC PAGE, OR SAYS WHY NOT.

   ⚠ THE EXCLUSION IS ONE PROPERTY WITH ONE REASON, and it is stated so it can be argued with.
============================================================================================ */
const paintSrc = read("ralph/tests/paint-sites.mjs");
const pagesBlock = paintSrc.slice(
  paintSrc.indexOf("const PAGES = ["),
  paintSrc.indexOf("];", paintSrc.indexOf("const PAGES = ["))
);
const visited = [...pagesBlock.matchAll(/\["([^"]+)",/g)].map((m) => m[1]).sort();

/**
 * ⚠ A PALETTE SLUG ROUTE RENDERS THE IDENTICAL COMPONENT TREE TO `/palettes`, differing only in
 * which palette it opens on — and `paint-sites` ALREADY VARIES THE PALETTE across all nine on
 * `/palettes` itself. Visiting the slug routes would re-render the same page 81 more times to
 * measure the dimension the suite controls.
 *
 * ⚠ THIS IS A PROPERTY, NOT A NAME, WHICH IS THE WHOLE POINT. It reads "a route whose only
 * difference from a page already visited is the palette it opens on". A tenth palette matches it
 * automatically; a genuinely new page under `/palettes/` would not, because it would render
 * something else. Excluding the nine by listing them would be the fixed-list shape returning
 * inside the gate written to remove it.
 */
const opensAPaletteOnly = (r) => /^\/palettes\/[a-z-]+$/.test(r);
const shouldVisit = PAGES.filter((p) => !opensAPaletteOnly(p));

console.log("\nC · the visual ratchet's subject is every public page, minus a declared property");
t("C0 the PAGES block was found and parsed — an empty slice would make C1 vacuous",
  visited.length >= 8, true);
t("C1 ⚠ EVERY PUBLIC PAGE IS UNDER THE RATCHET — `/palettes` sat outside it for an entire arc",
  shouldVisit.filter((p) => !visited.includes(p)), []);
t("C2 …and it visits nothing that was not built, which would render the 404 page and read as thin",
  visited.filter((v) => !PAGES.includes(v)), []);
/* ⚠ AND THE EXCLUSION MATCHES SOMETHING. A property that selects nothing is a rule with no
 * subject, and C1 would pass identically whether the reasoning were sound or not. */
t("C3 …and the declared exclusion has real members, so C1 is not passing over an empty rule",
  PAGES.filter(opensAPaletteOnly).length, 9);

console.log(`\nroute-coverage result: ${pass} passed, ${fail} failed  ·  ${PAGES.length} public pages, ${listed.length} in sitemap, ${visited.length} under the ratchet`);
process.exit(fail === 0 ? 0 : 1);
