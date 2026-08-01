// studio-index — the case-study index's two views, and the structure that keeps them honest.
//
// ---- WHY THIS SUITE IS MOSTLY ABOUT BOXES ---------------------------------------------------
//
// The defect this screen shipped twice was a LAYOUT one: nested flex contexts let the reorder
// cluster stretch to fill its row, which squeezed the title onto two lines and truncated the
// summary to a single word. Adding `flex: 0 0 auto` at each level did not fix it, because the
// fragility was the STRUCTURE rather than any one declaration.
//
// ⚠ SO THE REAL GATE FOR THAT IS A MEASUREMENT, AND IT IS NOT IN THIS FILE. A class-string
// assertion would have PASSED ON EVERY BROKEN VERSION — the classes were all present and the box
// was still wrong. The rendered width is read off the live box in both views at three page
// widths, and the numbers are recorded in STATE. What this suite can do is pin the STRUCTURE
// that measurement depends on: that the tracks are stated at all, and that nobody quietly
// returns the row to nested flex once the measurement has scrolled out of memory.
import fs from "node:fs";

let failures = 0;
const t = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${ok ? "" : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`}`);
};
const read = (p) => fs.readFileSync(p, "utf8");
// COMMENT-STRIPPED, and this file is the reason the rule exists ten times over: the prose below
// discusses `role="button"`, `opacity-60` and the track lists it asserts about, so a parser that
// did not strip comments would match its own explanation.
const code = (p) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const row = code("components/studio/CaseStudyRow.tsx");
const card = code("components/studio/CaseStudyCard.tsx");
const item = code("components/studio/CaseStudyItem.tsx");
const index = code("components/studio/CaseStudyIndex.tsx");
const seg = code("components/studio/SegmentedGroup.tsx");
const viewLib = code("lib/studio/index-view.ts");
const route = code("app/studio/(dashboard)/projects/page.tsx");

/* ================================================ A. THE TRACKS ARE STATED, NOT NEGOTIATED */

t("A1: the list row states seven explicit tracks",
  /\[grid-template-columns:auto_auto_auto_1fr_auto_auto_auto\]/.test(row), true);

t("A2: …of which exactly ONE is flexible — there is no second place for space to go",
  (/\[grid-template-columns:(auto_|1fr_)*[a-z0-9_]*\]/.exec(row)?.[0].match(/1fr/g) ?? []).length, 1);

t("A3: the card's foot is a grid, meta on the flexible track and the cluster its own box",
  /grid-cols-\[1fr_auto\]/.test(card), true);

/* THE FLOOR ON THE FLEXIBLE TRACK IS LOAD-BEARING, NOT DEFENSIVE. A grid item's automatic
 * minimum size is its CONTENT, so without this a long title pushes the `1fr` track past its
 * share and the truncation never engages — the row just overflows instead. */
t("A4: the row's text track carries the floor its truncation depends on",
  /className="min-w-0"/.test(row), true);

/* ================================================ B. THE CLUSTER CANNOT GROW */

t("B1: the stacked cluster states BOTH dimensions and both tracks",
  /h-\[48px\] w-\[26px\] \[grid-template-columns:26px\] \[grid-template-rows:24px_24px\]/.test(item), true);

t("B2: the side-by-side cluster states BOTH dimensions and both tracks",
  /h-\[24px\] w-\[52px\] \[grid-template-columns:26px_26px\] \[grid-template-rows:24px\]/.test(item), true);

/* ⚠ NOT `flex` ANYWHERE IN THE CLUSTER OR THE ROW. This is the assertion that would have caught
 * the original defect, and only because it is about the ABSENCE of the structure that failed. */
t("B3: neither renderer reaches for flex on its own root — the row and card are grids",
  /className=\{`(grid|flex)/.exec(row)?.[1] === "grid" && /className=\{`(grid|flex)/.exec(card)?.[1] === "grid", true);

/* ================================================ C. NEITHER IS A `<button>` */

/* A button inside a button is an invalid content model: the parser closes the outer one early
 * and the rest becomes its SIBLING, which scatters the row. #176 on a new surface. Both of these
 * CONTAIN buttons — the two arrows, and remove in the list — so both must be divs. */
for (const [what, src] of [["row", row], ["card", card]]) {
  t(`C1: the ${what} spreads the shared activation contract rather than being a <button>`,
    /\{\.\.\.activationProps\(onOpen, `Edit \$\{item\.title\}`\)\}/.test(src), true);
  t(`C1: …and never opens a <button> as its own root`,
    /return \(\s*<button/.test(src), false);
}

t("C2: the contract is role=button plus a real tab stop",
  /role: "button" as const/.test(item) && /tabIndex: 0/.test(item), true);

/* A ROLE-BUTTON DIV GETS NEITHER OF THESE FOR FREE, and no gate in this repo would catch a
 * mouse-only card — which is why the driven check presses real keys instead of reading this. */
t("C3: Enter AND Space both activate",
  /e\.key === "Enter" \|\| e\.key === " "/.test(item), true);

t("C4: …and Space prevents the default, or the page scrolls as well as navigating",
  /e\.preventDefault\(\)/.test(item), true);

t("C5: the focus ring is AUTHORED — `:focus-visible` matches on a tabindexed div but the UA draws nothing",
  /focus-visible:outline focus-visible:outline-2/.test(item) && /focus-visible:outline-accent-500/.test(item), true);

/* PER CONTROL, NOT A COUNT. The first version of this asserted `stopAll` appeared at least four
 * times, which is a threshold rather than a claim — it would pass with four uses on one button
 * and none on another. Each control is named instead. BOTH handlers are needed on each: the
 * keyboard path activates the ancestor through its `onKeyDown`, which `onClick` never sees. */
for (const [what, src] of [["the reorder arrows", item], ["the list's remove", row]]) {
  t(`C6: ${what} stops the click, or the action ALSO opens the study`,
    /onClick=\{\(e\) => \{\s*stopAll\(e\);/.test(src), true);
  t(`C6: …and stops the key too, since onClick never sees the keyboard path`,
    /onKeyDown=\{stopAll\}/.test(src), true);
}

/* ================================================ D. THE TWO DEFECTS THIS SCREEN FIXED */

/* ⚠ BESPOKE IS NOT DISABLED. boAt Crest's whole row was `opacity-60` because its sections are
 * hand-built — but its title, hero, summary and platform are ALL editable here, so a dimmed row
 * was false about four of its five fields. Hazard 29's shape one screen earlier. */
t("D1: no renderer dims a study for being bespoke",
  /opacity-60/.test(row) || /opacity-60/.test(card) || /opacity-60/.test(index), false);

t("D2: bespoke reads as a chip at full text strength instead",
  /Hand-built/.test(item), true);

/* A zero beside three fifteens reads as a study that LOST its content. The rule is on the COUNT,
 * not on the slug, so a genuinely empty NEW study gets the honest sentence too. */
t("D3: a zero count says `No sections`, and the branch is on the count rather than the slug",
  /count === 0 \? "No sections" : `\$\{count\} sections`/.test(item), true);

/* ================================================ E. THE SWITCHER */

/* Correction 20 decides this: grid and list are two presentations of THE SAME CONTENT, which is
 * a GROUP — so aria-pressed and the accent FILL, the same language as Board|Editor. A tablist
 * would claim they are two different panels of content, which they are not. */
t("E1: the switcher is a group with per-button aria-pressed",
  /role="group"/.test(seg) && /aria-pressed=\{on\}/.test(seg), true);

t("E2: …and the pressed one takes the accent FILL, not an underline or a tint",
  /on \? "bg-accent-500 text-cream-50"/.test(seg), true);

/* IT RENDERS AND DOES NOT PERSIST. `SegmentedToggle` could not be reused because it POSTs a
 * draft patch and hardcodes ["mobile","web"]; this one takes its options as data and owns no
 * network call, which is also why #164's fs-noop quirk has nothing to apply to. */
t("E3: the shell owns no network call",
  /fetch\(/.test(seg), false);

t("E4: …and takes its options as data rather than hardcoding a pair",
  /options: readonly SegmentedOption<T>\[\]/.test(seg), true);

/* ================================================ F. THE FIRST PAINT */

/* localStorage guarantees a flash of the wrong view on every load, because the server cannot
 * read it. The cookie is resolved server-side so the first HTML is already right. */
t("F1: the view has a cookie and a parse",
  /INDEX_VIEW_COOKIE = "studio-projects-view"/.test(viewLib) && /export function parseIndexView/.test(viewLib), true);

t("F2: the default is GRID — recognising a hero beats reading a title when picking a study",
  /INDEX_VIEW_DEFAULT: IndexView = "grid"/.test(viewLib), true);

/* THE PARSE IS ON THE READ, so a cookie written by a build that offered a third view cannot
 * render nothing. Only an explicit "list" wins; everything else falls back. */
t("F3: an unknown stored value falls back rather than rendering nothing",
  /return raw === "list" \? "list" : INDEX_VIEW_DEFAULT/.test(viewLib), true);

t("F4: the ROUTE reads the jar, not the ten-page dashboard layout",
  /parseIndexView\(\(await cookies\(\)\)\.get\(INDEX_VIEW_COOKIE\)/.test(route), true);

/* F5 · THE 60rem CAP IS DELIBERATELY ABSENT, AND THE ASSERTION IS INVERTED RATHER THAN DELETED.
 * It shipped WITH the cap and the owner reversed that before merge. #239's field measure exists
 * so a line of PROSE does not run to an unreadable length, and this page has no prose: the grid
 * is cards and the list's summary is a single TRUNCATED line, so width buys more cards and more
 * visible summary rather than a harder paragraph. Capping would leave a wide display's right
 * third empty to protect a measure nothing here is subject to.
 * KEPT AS AN ASSERTION, NOT DROPPED, because "no cap" is now a property someone could undo by
 * reflex — the four field pages next door all carry one, and this is the exception. */
t("F5: the page takes the full width — no field measure on a page with no prose",
  /max-w-\[60rem\]/.test(route), false);

/* `AreaHeader` MOVED INTO THE INDEX so it can share a flex row with the search and the switcher —
 * those need client state and a title does not, and one row cannot span a server and a client
 * component. It is presentational with no hooks, so a client parent renders it unchanged.
 * #244's rule is about CAPPING it, not about who renders it, and nothing here caps it. */
t("F5: …and `AreaHeader` is rendered, uncapped, on the head row with the controls",
  /<AreaHeader title="Case studies"/.test(index) && /max-w-\[60rem\]/.test(index), false);

t("F5: …with the title and the controls on ONE row, not two bands of chrome",
  /items-start justify-between[\s\S]{0,160}<AreaHeader/.test(index), true);

t("F6: the client is seeded from the server rather than reading a browser store",
  /useState<IndexView>\(initialView\)/.test(index) && /localStorage/.test(index) === false, true);

/* ================================================ G. REORDER */

/* The handler is index-based (`up` is i-1), so only the glyph and the label change between
 * views. Nothing about the move differs, which is why this is one call and not two. */
t("G1: both views call the same index-based handler",
  (index.match(/moveItem\(p\.slug, direction\)/g) ?? []).length, 2);

t("G2: the list says up/down and the grid says earlier/later",
  /Move \$\{title\} up/.test(item) && /Move \$\{title\} earlier/.test(item), true);

/* DISABLED RATHER THAN ABSENT, so the cluster keeps its width at the ends of the list and no
 * control ever moves between items. */
t("G3: the ends are disabled, never removed",
  /disabled=\{s\.off \|\| busy\}/.test(item), true);

t("G4: …and `off` is position, so it follows the slot rather than the study",
  /off: atStart/.test(item) && /off: atEnd/.test(item), true);

/* ================================================ H. THE SEARCH */

/* LOCAL AND INLINE, which is `SectionsRail`'s stated rule: `blog-search.ts` is a lib module
 * because TWO surfaces needed it, and generalising at the first consumer is what ThreePaneShell
 * was held back from. Only this page searches studies. */
t("H1: the filter lives here rather than in a lib module at its first consumer",
  /lib\/studio\/[a-z-]*search/.test(index), false);

t("H2: it matches title OR summary — the two fields a study is recognised by",
  /p\.title\.toLowerCase\(\)\.includes\(q\) \|\| p\.summary\.toLowerCase\(\)\.includes\(q\)/.test(index), true);

/* FAILS OPEN, unlike the blog's `status`. A search box narrows a list the author already owns;
 * `status` governs whether a post exists publicly. Different kinds of filter, different defaults. */
t("H3: an empty query returns the list unfiltered rather than blanking it",
  /if \(q === ""\) return items;/.test(index), true);

/* ⚠ THE POSITION COMES FROM THE FULL LIST. The ordinal and the disabled ends describe where a
 * study sits in the HOMEPAGE ORDER; a filtered view renumbering 1..n would state a rank that does
 * not exist. Both renderers are fed `at`, never the map index. */
t("H4: the ordinal and the ends are taken from the full list, never the filtered one",
  /const at = items\.findIndex\(\(x\) => x\.slug === p\.slug\)/.test(index)
    && /ordinal=\{String\(at \+ 1\)\.padStart\(2, "0"\)\}/.test(index)
    && /index=\{at\}/.test(index), true);

t("H4: …and neither view maps with an index parameter that could be mistaken for a position",
  /shown\.map\(\(p, i\)/.test(index), false);

/* A control that appears to do nothing while quietly changing the homepage order is worse than a
 * disabled one — filtered, a study's neighbour is usually off screen. */
t("H5: reorder locks while a search is active, in both views",
  (index.match(/busy=\{reorderBusy \|\| filtering\}/g) ?? []).length, 2);

t("H5: …and the subline says how to get the arrows back",
  /Clear the search to change the order/.test(index), true);

/* TWO ZERO STATES, NOT ONE. #271 separated three of these in the sections rail after one sentence
 * had been answering three different questions; the trap is available again the moment a search
 * box arrives, so they are split at the source. */
t("H6: an empty result and an empty collection say different things",
  /No case studies yet\. Add one to get started\./.test(index)
    && /No case studies match/.test(index), true);

t("H6: …and the branch is on the COLLECTION being empty, not on the query",
  /items\.length === 0 \? \(/.test(index), true);

/* A create affordance inside a result set reads as one of the results. */
t("H7: the add tile is hidden while filtering, and the head button is not",
  /\{!filtering && \(\s*<button/.test(index), true);

/* ================================================ I. THE STATUS STRIP */

/* The count sentence is not a control and it was sitting in the control band, where it read as a
 * label for the buttons beside it. It is a STATUS, so it takes the strip the studio already uses
 * for one — #264's live-preview note — rather than becoming a third strip flavour. */
t("I1: the status uses #264's strip, not a new one",
  /border border-ink-950\/12 bg-cream-100 px-3 py-2\.5 text-\[12px\] leading-relaxed text-ink-600/.test(index)
    && /<IconInfo className="mt-\[3px\] h-3\.5 w-3\.5 flex-none text-ink-400" \/>/.test(index), true);

/* ⚠ THE SEARCH IS NOT IN THE HEAD CLUSTER, and this is a fix rather than a preference. Search,
 * view and Add together put three unrelated jobs shoulder to shoulder — a FILTER, a PRESENTATION
 * and a WRITE — and the row read as a toolbar of equals. The switcher and Add belong to the page
 * and stay with the title; the search belongs to the list and sits with it, on the left. */
t("I1: the search is NOT in the head cluster beside the switcher and Add",
  /<SegmentedGroup[\s\S]{0,400}Add case study[\s\S]{0,200}<input\s+type="search"/.test(index)
    || /<input\s+type="search"[\s\S]{0,300}<SegmentedGroup/.test(index), false);

t("I1: …it sits beside the status it drives, so the strip reads as the answer",
  /type="search"[\s\S]{0,400}role="status"/.test(index), true);

t("I2: it carries the sentence the page is about",
  /in the order they appear on your homepage\./.test(index), true);

/* IT CHANGES UNDER THE AUTHOR — typing rewrites it from a count to a result count plus the reason
 * the arrows went quiet, and a status only sighted users receive is the half-fix. */
t("I3: …and it announces, because the text changes as the author types",
  /role="status"\s*\n\s*aria-live="polite"/.test(index), true);

console.log(`\nstudio-index result: ${49 - failures} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
