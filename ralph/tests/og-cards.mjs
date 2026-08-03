// The OG cards — the three defences, and the title fit whose numbers were MEASURED.
// Run: node --experimental-strip-types ralph/tests/og-cards.mjs
//
// PART A IS A LEAK GATE and it asserts SHAPE, not behaviour, on purpose. Whether a draft's
// card is reachable is a build-and-serve question that only the browser gates can settle, and
// they do. What a suite can hold is that the three defences are all still PRESENT and still
// spelled the way that makes them work — because each one is a single line whose removal
// looks like a tidy-up and reads as harmless.
//
// THE ONE THAT WOULD SLIP QUIETEST IS THE FAIL-OPEN DEFAULT. `data?.title ?? "Case study"`
// shipped to production and returned 200 for a slug that does not exist. It is a defensive-
// looking idiom, it silences a type complaint, and it turns "no such entry" into a successful
// render. A5/A6 forbid it in both routes by name.
//
// PART B IS THE MEASUREMENT. The constants are not round numbers someone liked: they come
// from rendering the real SOURCE SERIF 4 TTF this file's subject fetches and replicating Satori's
// greedy wrap. 84px holds 3 lines with 73px to spare and OVERFLOWS BY 15px at 4. The longest
// real title is already 3 lines. Change a constant and the card silently clips — nothing else
// in this repo can see that, which is what earns this suite its place.
//
// The vertical figures survived the family swap unchanged, because they are line count times size
// times line-height and a face changes how many CHARACTERS fit, never how tall a line is. What
// moved was the character thresholds, re-derived in og-fit.ts's header.
import { readFileSync } from "node:fs";
import {
  truncateAtWord, fitTitle,
  TITLE_SIZE_PX, TITLE_STEP_DOWN_CHARS, TITLE_SMALL_SIZE_PX, TITLE_MAX_CHARS,
} from "../../lib/og-fit.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Comment-stripped — every file here documents the idioms below, including the one it bans. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const blogOg = code("app/(portfolio)/blog/[slug]/og/route.ts");
const csOg = code("app/(portfolio)/projects/[slug]/og/route.ts");
const og = code("lib/og.tsx");
const site = code("lib/site.ts");
const page = code("app/(portfolio)/blog/[slug]/page.tsx");

/* ============================================================ A. THE THREE DEFENCES */
t("A1: blog og prerenders from the STATUS-FILTERED read",
  /generateStaticParams\(\)\s*\{\s*const posts = await getBlogPosts\(\);/.test(blogOg), true);
// The unfiltered read is the one-word change that reopens the leak.
t("A1: …and getBlogSlugs appears NOWHERE in it", /getBlogSlugs/.test(blogOg), false);
t("A2: blog og disallows params outside that list",
  /export const dynamicParams = false;/.test(blogOg), true);
t("A3: blog og refuses a non-published post IN THE HANDLER",
  /if \(!post \|\| post\.status !== "published"\) return new Response\(null, \{ status: 404 \}\);/.test(blogOg), true);
// Defence 3 is load-bearing BECAUSE it is independent of 1 and 2 — it must not be reachable
// only after the other two have already let the request through.
t("A3: …and it reads the UNFILTERED getBlogPost, so the check is doing real work",
  /const post = await getBlogPost\(slug\)/.test(blogOg), true);

t("A4: the case-study og route now disallows unknown params too",
  /export const dynamicParams = false;/.test(csOg), true);
t("A5: the case-study fail-open default is GONE",
  /\?\?\s*"Case study"/.test(csOg), false);
t("A5: …replaced by a refusal",
  /if \(!data\) return new Response\(null, \{ status: 404 \}\);/.test(csOg), true);
// The blog route must never grow the same idiom.
t("A6: the blog route has no substituting default of any kind",
  /\?\?\s*"/.test(blogOg), false);

/* ============================================================ B. THE MEASURED FIT */
t("B1: the title starts at 84px", TITLE_SIZE_PX, 84);
t("B1: …steps down above 60 characters", TITLE_STEP_DOWN_CHARS, 60);
t("B1: …to 68px", TITLE_SMALL_SIZE_PX, 68);
t("B1: …and is capped at 100", TITLE_MAX_CHARS, 100);
// The leaf must keep the derivation beside the numbers — a bare constant is the thing this
// project deletes, and the 190px estimate is why.
t("B1: …and the leaf records that they were MEASURED, not chosen",
  /MEASURED|measured/.test(read("lib/og-fit.ts")) && /OVERFLOWS/.test(read("lib/og-fit.ts")), true);

// THE CONSTANTS ARE ASSERTED AGAINST THE REAL TITLES THEY WERE MEASURED FOR, not in the
// abstract. All three current posts must stay on the large size — the step-down exists for a
// future post, and if a constant ever moves under them the cards change silently.
const REAL_TITLES = [
  "AI first is a research posture, not a feature",              // 45
  "What a data table teaches you about trust",                  // 41
  "What a design system is for when the machine can draw",      // 53 — already THREE lines
];
const sizeFor = (title) => fitTitle(title).sizePx;
t("B2: every current post renders at the large size",
  REAL_TITLES.map(sizeFor), [84, 84, 84]);
t("B2: …with headroom — the longest is 53 against a 60 threshold",
  Math.max(...REAL_TITLES.map((s) => s.length)) < TITLE_STEP_DOWN_CHARS, true);
t("B3: a 61-character title steps down", sizeFor("x".repeat(61)), 68);

/* ------------------------------------------------ truncation, driven through the real fn */
t("B4: a short title is untouched",
  truncateAtWord("What a data table teaches you about trust", 100),
  "What a data table teaches you about trust");
t("B4: a title at exactly the cap is untouched",
  truncateAtWord("y".repeat(100), 100), "y".repeat(100));
{
  const long =
    "What a design system is really for in the years after the machine finally learned how to draw the screen for you";
  const cut = truncateAtWord(long, 100);
  t("B5: an over-long title is cut to at most the cap", cut.length <= 100, true);
  t("B5: …ends with an ellipsis", cut.endsWith("…"), true);
  // THE RENDER IS WHY THIS ASSERTION EXISTS. A raw slice produced "…to draw the s…", a cut
  // mid-word that reads as a rendering fault rather than an elision.
  t("B5: …and does NOT end mid-word", /\s\S{1,2}…$/.test(cut), false);
  t("B5: …the exact cut, so a change to the rule is visible here",
    cut, "What a design system is really for in the years after the machine finally learned how to draw the…");
}
// No space to fall back to — the raw cut must still be honoured rather than returning "…".
t("B6: a title with no word boundary still truncates",
  truncateAtWord("z".repeat(140), 100), `${"z".repeat(99)}…`);

/* ============================================================ C. WIRING */
t("C1: the blog page uses the helper, not a literal path",
  /const ogImage = blogOgImageUrl\(slug\)/.test(page), true);
t("C1: …and the old hardcoded site plate is gone from it",
  /absoluteUrl\("\/opengraph-image\.png"\)/.test(page), false);
t("C2: the helper points at the post's own route",
  /return absoluteUrl\(`\$\{blogPath\(slug\)\}\/og`\)/.test(site), true);
t("C3: the eyebrow is a real parameter the blog feeds from topic",
  /eyebrow: post\.topic/.test(blogOg), true);
// `topic` is free text and a studio-created post starts with "", so the empty case is REAL.
// The whole row goes, or the accent rule is left floating with no label beside it.
t("C4: an empty eyebrow drops the whole row, not just the text",
  /const showEyebrow = eyebrow\.trim\(\) !== "";/.test(og) && /\{showEyebrow \? \(/.test(og), true);

console.log(`\nog-cards result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
