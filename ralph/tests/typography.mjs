// THE TYPOGRAPHY SEAM — which face each role points at, and the axis hazard that has no other guard.
// Run: node ralph/tests/typography.mjs
//
// ---- WHY IT EXISTS ---------------------------------------------------------------------------
//
// Before this file NOTHING asserted a font family anywhere. The arc that repointed all three roles
// could have pointed one at the wrong face, or left a variation axis pinned to a value the new
// family cannot reach, and every gate would have stayed green. Two of those were live risks in the
// same week, so both are pinned here.
//
// ---- THE AXIS HAZARD, WHICH IS THE REASON THIS IS A SUITE AND NOT A COMMENT -------------------
//
// `font-variation-settings: "opsz" 144` sat on the unlayered `h1, h2` rule. Fraunces carries
// opsz 9..144, so 144 was its top. **Source Serif 4 carries opsz 8..60.** The same declaration
// against the new face CLAMPS to 60 — it renders, nothing errors, no build warns, and the value
// drawn is not the value written. It is the token-that-does-not-exist failure in a different
// property: the code says one thing and the screen says another.
//
// The repair was the MECHANISM rather than another number. `font-optical-sizing: auto` computes
// opsz per element from the rendered size, which is exactly what the contract's per-step table
// describes, and it cannot exceed whatever axis the live face exposes. So the durable assertion is
// that no explicit opsz comes back — B2 below — with B3 as the general form for anyone who
// reintroduces one deliberately.
//
// ---- THE ORACLE IS next/font's OWN FONT DATA -------------------------------------------------
//
// Axis ranges are read from `font-data.json`, the table next/font itself resolves against, rather
// than from a number typed here. A hand-kept copy of a font's axis bounds is a second source of
// truth that goes stale on the first upgrade — the same argument `css-comment-trap` makes for
// asking Tailwind instead of keeping a class list.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
/** Source with comment bodies blanked, so prose describing the OLD value is not read as the value. */
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/.*$/gm, "$1");
const cssCode = code(css), layoutCode = code(layout);

/* ================================================ A. THE ROLES POINT AT THE RIGHT FACES
 * One line each, and they are the only lines the family swap edits. Read from CODE so the
 * migration notes in the surrounding comments cannot satisfy the match. */
const role = (name) => (new RegExp(`--font-${name}:\\s*var\\((--font-[a-z0-9-]+)\\)`).exec(cssCode) ?? [])[1] ?? null;
t("A1: --font-display points at Source Serif 4", role("display"), "--font-source-serif");
t("A2: --font-body points at Work Sans", role("body"), "--font-work-sans");
t("A3: --font-label points at Space Grotesk", role("label"), "--font-space-grotesk");
/* The faces themselves still resolve through next/font, with a metric-matched stack behind them
 * and never a bare generic — a generic drops to Times or Arial and reflows every measured box. */
for (const [face, loaded] of [["source-serif", "--font-source-serif-loaded"],
                              ["work-sans", "--font-work-sans-loaded"],
                              ["space-grotesk", "--font-space-grotesk-loaded"]]) {
  const decl = (new RegExp(`--font-${face}:\\s*var\\(${loaded},([^;]+)\\);`).exec(cssCode) ?? [])[1];
  t(`A4: --font-${face} reads its next/font variable and carries a named fallback stack`,
    Boolean(decl) && !/^\s*(serif|sans-serif)\s*$/.test(decl), true);
}

/* ================================================ B. THE AXIS HAZARD */
const require_ = createRequire(import.meta.url);
const FONT_DATA = require_("next/dist/compiled/@next/font/dist/google/font-data.json");
const axisMax = (family, tag) => {
  const f = FONT_DATA[family];
  const a = (f?.axes ?? []).find((x) => x.tag === tag);
  return a ? a.max : null;
};
/* B1 · THE ORACLE IS LIVE. If font-data ever stops resolving, every check below would read `null`
 * and pass by comparing nothing — the false-pass shape this runner refuses everywhere. */
t("B1: the font-data oracle answers, and it is the fact the whole hazard rests on — Fraunces reaches 144, Source Serif 4 stops at 60",
  [axisMax("Fraunces", "opsz"), axisMax("Source Serif 4", "opsz")], [144, 60]);

/* B2 · NO EXPLICIT opsz SURVIVES. The mechanism replaced the number, so the durable form of
 * "144 must not come back" is "no pinned optical size at all". */
const opszPins = [...cssCode.matchAll(/font-variation-settings\s*:\s*([^;]*opsz[^;]*)/g)].map((m) => m[1].trim());
t("B2: no rule pins an optical size — `font-optical-sizing: auto` computes it per element instead",
  opszPins, []);
t("B2: …and the mechanism that replaced it is actually present on the h1/h2 reset",
  /h1,\s*h2\s*\{[^}]*font-optical-sizing:\s*auto/.test(cssCode), true);

/* B3 · THE GENERAL FORM, so a deliberate future pin is still checked rather than trusted. Any
 * `"opsz" N` in the stylesheet must fall inside the LIVE display face's axis. With none present
 * this passes vacuously, which is why B2 above pins the absence separately. */
const liveDisplay = /--font-source-serif:/.test(cssCode) && role("display") === "--font-source-serif"
  ? "Source Serif 4" : null;
const max = axisMax(liveDisplay ?? "", "opsz");
const overAxis = opszPins
  .map((p) => Number((/opsz"?\s*,?\s*(\d+(?:\.\d+)?)/.exec(p) ?? [])[1]))
  .filter((n) => Number.isFinite(n) && max != null && n > max);
t(`B3: every pinned optical size fits the live display face's axis (${liveDisplay} tops out at ${max})`,
  overAxis, []);

/* ================================================ C. THE PRELOAD BUDGET FOLLOWS THE LIVE FACES
 * A preloaded face nothing reads spends the critical window on nothing; a live face that is not
 * preloaded arrives late and swaps under the reader. Both are silent, so both are pinned.
 * Read per-declaration rather than by counting `preload:` lines, which would not say WHICH. */
const preloadOf = (ctor) => {
  const m = new RegExp(`${ctor}\\(\\{([\\s\\S]*?)\\}\\)`).exec(layoutCode);
  return m ? /preload:\s*true/.test(m[1]) : null;
};
t("C1: the three LIVE faces are preloaded — Source Serif 4, Work Sans, and Kaushan for the wordmark",
  [preloadOf("Source_Serif_4"), preloadOf("Work_Sans"), preloadOf("Kaushan_Script")], [true, true, true]);
t("C2: the two OUTGOING faces are not — nothing reads Fraunces or DM Sans any more",
  [preloadOf("Fraunces"), preloadOf("DM_Sans")], [false, false]);
t("C3: Space Grotesk is not preloaded either, because --font-label still has no consumer",
  preloadOf("Space_Grotesk"), false);
/* The count is what a public page actually pays. It has not moved across the whole arc: the
 * incoming faces swapped places with the outgoing ones rather than joining them. */
t("C4: exactly three faces are preloaded, the same number as before the arc began",
  ["Source_Serif_4", "Work_Sans", "Kaushan_Script", "Fraunces", "DM_Sans", "Space_Grotesk", "Caveat"]
    .filter((c) => preloadOf(c) === true).length, 3);

/* ================================================ D. THE CARD AND THE PAGE AGREE
 * ⚠ THIS IS THE ONE DEFECT THE ARC ACTUALLY SHIPPED, BRIEFLY. `--font-display` repointed to
 * Source Serif 4 while `lib/og.tsx` went on fetching Fraunces from Google, so for one PR every
 * article page rendered one serif and every social card rendered another — the same title looking
 * like two different sites depending on whether you arrived from a link or from a feed.
 *
 * Nothing could see it. The card is generated server-side by Satori from its own font buffer, so
 * no stylesheet, no token and no cascade gate touches it; it is the one surface where the site's
 * type can drift without anything in the repo disagreeing. Hence this pair.
 *
 * MATCHED ON THE FAMILY NAME, which is the value all three of the card's sites share — the Google
 * query, the applied `fontFamily`, and the `fonts` entry Satori registers. A mismatch between the
 * registered name and the applied one falls back silently to the built-in face, so the card still
 * renders and renders in something nobody chose. */
{
  const og = code(readFileSync(new URL("../../lib/og.tsx", import.meta.url), "utf8"));
  const brand = (/const BRAND_FONT = "([^"]+)"/.exec(og) ?? [])[1] ?? null;
  t("D1: the OG card names its face in ONE constant, not three string literals", brand, "Source Serif 4");
  t("D2: …and that face is the one --font-display resolves to, so a card and its page cannot disagree",
    brand && role("display") === `--font-${brand.toLowerCase().replace(/ /g, "-").replace("-4", "")}`, true);
  t("D3: the Google query, the applied family and Satori's registration all read the constant",
    [/family=\$\{BRAND_FONT/.test(og), /fontFamily = font \? BRAND_FONT/.test(og), /name: BRAND_FONT/.test(og)],
    [true, true, true]);
  t("D4: no literal Fraunces survives in the card renderer", /"Fraunces"/.test(og), false);
}

console.log(`\ntypography result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
