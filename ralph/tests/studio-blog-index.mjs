// studio-blog-index — the blog index's two controls, its two views, and the structure under both.
//
// ---- WHAT THIS CAN AND CANNOT SEE ------------------------------------------------------------
//
// The defect this page's sibling shipped TWICE was a LAYOUT one, and a class-string assertion
// passed every broken version of it. So the row's real gate is a MEASUREMENT, driven in a
// browser and recorded in STATE — thumb 64 / status 76 / meta 180 / remove 26 constant while only
// the text track moves, at 900, 1280 and 1800. What this suite pins is the STRUCTURE that
// measurement rests on, plus the things a rendered box cannot show: which control wears which
// selection language, and whether a tablist owes what a tablist owes.
import fs from "node:fs";

let failures = 0;
const t = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}${ok ? "" : `\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`}`);
};
// COMMENT-STRIPPED, and this file needs it more than most: the prose below quotes the very class
// strings and roles it asserts about, so an unstripped parser would match its own explanation.
const code = (p) =>
  fs.readFileSync(p, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const index = code("components/studio/BlogIndex.tsx");
const card = code("components/studio/BlogPostCard.tsx");
const row = code("components/studio/BlogPostRow.tsx");
const tabs = code("components/studio/BlogStatusTabs.tsx");
const chip = code("components/studio/BlogStatusChip.tsx");
const route = code("app/studio/(dashboard)/blog/page.tsx");
const globals = fs.readFileSync("app/globals.css", "utf8");

/* ================================================ A. TWO CONTROLS, TWO LANGUAGES, BY FUNCTION */

/* ⚠ THE MOST LIKELY THING TO GET WRONG, because both are "a row of buttons above a list".
 * `studio-ink` C4 holds the rule and it is BY FUNCTION, not by role — #263 replaced the older
 * role-based wording when the owner overruled correction 29:
 *     a two-state MODE switch       -> the accent FILL
 *     a switch between CONTENT SETS -> the UNDERLINE
 * STATUS swaps WHICH posts are shown, so it is the underline. VIEW shows the SAME posts arranged
 * differently, so it is the fill. Two languages side by side is the rule being APPLIED. */
t("A1: status is a real tablist with aria-selected",
  /role="tablist"/.test(tabs) && /role="tab"/.test(tabs) && /aria-selected=\{on\}/.test(tabs), true);

/* TWO ASSERTIONS, NOT ONE `&&`, AND MUTATION IS WHY. This was written as
 *   `underlinePresent && fillPresent === false`
 * which PASSES when the underline is REPLACED by the fill — `false && true` is false, the
 * expected value. The mutation that swapped the underline for `bg-accent-500` survived it. A
 * conjunction compared to `false` cannot say WHICH half failed, and here it did not need either
 * half to be right. */
t("A2: …and it takes the UNDERLINE — the selected tab carries the accent border",
  /border-accent-500 text-ink-950/.test(tabs), true);

t("A2: …and never the FILL, which belongs to the control beside it",
  /bg-accent-500/.test(tabs), false);

t("A3: view is a group with aria-pressed and takes the FILL — a different control, a different language",
  /<SegmentedGroup/.test(index) && /ariaLabel="View"/.test(index), true);

/* ⚠ NOTHING REACHES INSIDE `SegmentedToggle`. It posts draft patches and hardcodes ["mobile","web"],
 * which STATE states directly — "it is not a generic toggle, which is why the blog status control
 * is bespoke". `SegmentedGroup` is the presentational shell #275 extracted for exactly this. */
t("A4: the view switcher uses the shell, not the patch-posting toggle",
  /SegmentedToggle/.test(index), false);

/* ================================================ B. A TABLIST OWES MORE THAN AN ATTRIBUTE */

t("B1: it names the panel it controls",
  /aria-controls=\{panelId\}/.test(tabs) && /id=\{PANEL_ID\}/.test(index), true);

/* A ROVING tabIndex IS WHAT MAKES THE STRIP ONE TAB STOP. Without it every tab is its own stop
 * and the Arrow keys below have nothing to do. */
t("B2: the tabIndex roves, so the group is ONE tab stop",
  /tabIndex=\{on \? 0 : -1\}/.test(tabs), true);

/* AND ARROW KEYS ARE THE OTHER HALF: with a roving tabIndex, Tab cannot reach the other two, so
 * without Arrow handling they are unreachable from the keyboard ENTIRELY. */
t("B3: Arrow keys move within the group, in both directions, with wrap",
  /e\.key === "ArrowRight" \? 1 : e\.key === "ArrowLeft" \? -1 : 0/.test(tabs)
    && /\(i \+ step \+ tabs\.length\) % tabs\.length/.test(tabs), true);

t("B4: …and focus follows selection, or the ring is left on a tab that is no longer chosen",
  /\?\.focus\(\)/.test(tabs), true);

/* THE PANEL IS UNCONDITIONAL BECAUSE THE TABLIST IS. It was conditional while the strip could be
 * absent — a tabpanel with no tablist is an orphan in the accessibility tree — and the owner's
 * reversal removed the case that made it conditional, not the rule that the two go together. */
t("B5: the panel the tabs name is always present, exactly as the tablist is",
  /<div id=\{PANEL_ID\} role="tabpanel"/.test(index), true);

/* ================================================ C. THE TABLIST IS ALWAYS PRESENT */

/* ⚠ THIS REVERSES A LOCKED DECISION, AND BOTH SIDES ARE KEPT.
 * SHIPPED AS: STATE's "Empty blog status -> HIDDEN", implemented in #276 as hiding the whole
 * strip, because with zero drafts "All" and "Published" show an identical set — so all three tabs
 * were inert, not just "Drafts", and an inert control is the shape this project deletes.
 * OVERRULED BECAUSE THAT ARGUMENT TREATS THE TABS ONLY AS CONTROLS. They are also a READOUT:
 * "Drafts 0" answers "is anything unpublished?" without a click, on every load. Hiding the strip
 * makes that answer available only by noticing an ABSENCE, which is the one thing an author
 * cannot notice.
 * The reasoning above is kept rather than replaced — a reversal whose reasoning is deleted leaves
 * two contradictory rationales and no record of which won. */
t("C1: the tablist is unconditional — the count is a readout, not only a control",
  /\{anyDrafts && \(\s*<BlogStatusTabs/.test(index), false);

t("C1: …and it is actually rendered, so C1 above is not passing on an absent component",
  /<BlogStatusTabs value=\{status\} onChange=\{setStatus\} counts=\{counts\} panelId=\{PANEL_ID\} \/>/.test(index), true);

/* AND THE EMPTY BUCKET SAYS SO IN WORDS. A zero tab that lands on a blank pane would move the
 * defect rather than remove it — the strip answers the question and the panel confirms it. */
t("C2: choosing an empty Drafts lands on a sentence, not a blank pane",
  /No drafts\. Everything you have written is published\./.test(index), true);

t("C2: …and each of the three tabs has its own honest empty sentence",
  /status === "published"\s*\?\s*"No published posts yet\."\s*:\s*"No posts yet\."/.test(index), true);

/* THE COUNTS ARE OFF THE SEARCHED SET, so a tab never promises posts the search already excluded.
 * That half of #276 was right and is unchanged by the reversal. */
t("C4: neither control is conditional now — and `anyDrafts` is gone rather than left unused",
  /anyDrafts/.test(index), false);

/* ================================================ D. THE STRUCTURE THE MEASUREMENT RESTS ON */

t("D1: the row states five explicit tracks",
  /\[grid-template-columns:auto_1fr_auto_auto_auto\]/.test(row), true);

t("D2: …of which exactly ONE is flexible — there is no second place for space to go",
  (/\[grid-template-columns:[a-z0-9_]*\]/.exec(row)?.[0].match(/1fr/g) ?? []).length, 1);

/* `min-w-0` IS LOAD-BEARING, NOT DEFENSIVE. A grid item's automatic minimum is its CONTENT, so
 * without the floor a long title pushes the 1fr track past its share and truncation never
 * engages — the row overflows instead. */
t("D3: the text track carries the floor its truncation depends on",
  /className="min-w-0"/.test(row), true);

t("D4: the card's body reserves its two lines, so a short dek cannot shorten its card",
  /line-clamp-2 block h-\[36px\]/.test(card), true);

/* A `span`, NOT a `p` — globals.css's unlayered `p { line-height }` beats any leading utility, so
 * as a `p` the reserve would be measured at one line-height and rendered at another. It shipped
 * that way once and `studio-cascade` C1 caught it. */
t("D5: …on a span, because the unlayered `p` rule would override the leading the reserve assumes",
  /<p className="line-clamp-2/.test(card), false);

/* ================================================ E. NEITHER RENDERER IS A BUTTON */

for (const [what, src] of [["card", card], ["row", row]]) {
  t(`E1: the ${what} spreads the shared activation contract rather than being a <button>`,
    /\{\.\.\.activationProps\(onOpen, `Edit \$\{post\.title\}`\)\}/.test(src), true);
  t(`E1: …and carries the authored focus ring`, /\$\{ITEM_FOCUS\}/.test(src), true);
}

/* THE ROW CONTAINS A REAL BUTTON — remove — which is why it cannot be one. #176's finding. */
t("E2: the row's remove stops both the click and the key, or removing a post also opens it",
  /onClick=\{\(e\) => \{\s*stopAll\(e\);/.test(row) && /onKeyDown=\{stopAll\}/.test(row), true);

/* ================================================ F. THE DRAFT COLOUR IS DECLARED */

/* ⚠ HAZARD 23's SHAPE: a bare theme utility generates CSS only when its token exists, so an
 * undeclared `text-draft-600` would emit NOTHING and fail silently. `studio-tokens` gates the
 * general case; this pins that THIS token is the one the chip and the bar actually use. */
t("F1: the draft colour is a declared @theme token",
  /--color-draft-600:\s*oklch\(/.test(globals), true);

t("F2: …and it is ONE token with two alphas, not three tokens with one consumer each",
  /--color-draft-(bg|edge)/.test(globals), false);

/* 48%, NOT THE CONTRACT'S 52%. At 52% the chip's text over its own fill measured 4.36 on
 * cream-100 — under the 4.5 a 9px/600 label needs. The rasteriser corrected the contract. */
t("F3: …at the lightness the rasteriser settled on, not the one the contract drew",
  /--color-draft-600:\s*oklch\(48\.0% 0\.100 75\)/.test(globals), true);

/* ⚠ THE CHIP OVER A HERO IS GIVEN A GROUND. Measured, the element behind it is the `<img>`, so
 * its 12% fill left the label on arbitrary pixels — a contrast that changes with every hero. */
t("F4: the card's chip sits on an opaque ground, not on the photograph",
  /rounded-full bg-cream-50">\s*<BlogStatusChip/.test(card), true);

/* ================================================ G. THE WORD REPLACED THE DOT */

t("G1: the status dot is gone from the index",
  /size-1\.5 shrink-0 rounded-full/.test(index), false);

t("G2: …and only an explicit `published` counts as published — the same fail-closed rule /blog uses",
  /status === "published"/.test(chip), true);

/* ================================================ H. VIEW REMEMBERED, FILTER NOT */

t("H1: the view is seeded from the server and written to a per-collection cookie",
  /useState<IndexView>\(initialView\)/.test(index) && /indexViewCookie\("blog"\)/.test(index), true);

t("H2: the ROUTE reads the jar, not the ten-page dashboard layout",
  /parseIndexView\(\(await cookies\(\)\)\.get\(indexViewCookie\("blog"\)\)/.test(route), true);

/* THE FILTER IS DELIBERATELY TRANSIENT. An author who filtered to Drafts last week and returns to
 * one post out of four would read it as posts MISSING, not as a filter still applied. */
t("H3: the status filter is NOT persisted — it resets to all on every load",
  /useState<StatusFilter>\("all"\)/.test(index)
    && /indexViewCookie\("blog"\)=\$\{status\}/.test(index) === false, true);

console.log(`\nstudio-blog-index result: ${34 - failures} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
