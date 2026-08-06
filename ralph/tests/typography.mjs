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
import { readFileSync, readdirSync } from "node:fs";
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
/* ⚠ C2's SUBJECT WAS DELETED, WHICH IS THE THIRD KIND OF CHANGE AND THE EASIEST TO GET WRONG.
 * It asserted the two outgoing faces were not PRELOADED. They are not LOADED at all now, so the
 * old form would read `null` for both and pass by comparing nothing to nothing — a green row
 * about two things that no longer exist. Restated as an absence: they must not be imported.
 * A gate whose subject vanishes is rewritten to assert the vanishing, never left to pass vacuously. */
t("C2: the two OUTGOING faces are gone entirely — not merely unpreloaded, but not loaded",
  [/\bFraunces\b/.test(layoutCode), /\bDM_Sans\b/.test(layoutCode)], [false, false]);
/* ⚠ C3's SUBJECT CHANGED AND ITS VALUE DID NOT, WHICH IS THE MORE INTERESTING CASE.
 * It read "Space Grotesk is not preloaded either, BECAUSE --font-label still has no consumer".
 * That reason is gone — the token has two consumers now. The assertion still says `false`, for a
 * DIFFERENT reason: every consumer is under /studio, but `preload` is emitted from the ROOT
 * layout, so `true` would put a fifth font preload on every public page for a face no public page
 * renders. Measured in the build, 4 -> 5, after a comment had already claimed otherwise.
 *
 * AN ASSERTION WHOSE SUBJECT CHANGES GETS REWRITTEN WITH ITS NEW SUBJECT; one that is merely
 * inconvenient gets loosened. This project has caught the second kind three times — a regex
 * widened under pressure, a substring check that matched its own prose, an `||` whose second
 * clause passed regardless. Keeping the same VALUE while replacing the REASON is the tell that
 * this is the first kind: nothing here got easier to satisfy.
 *
 * The "because" is carried rather than dropped, because a gate that knows why it asserts what it
 * asserts is the part worth preserving through a rewrite. */
t("C3: Space Grotesk is STILL not preloaded, now because its consumers are studio-only while preload is emitted from the root layout — public pages must not pay for a face they never render",
  preloadOf("Space_Grotesk"), false);
/* The count is what a public page actually pays. It has not moved across the whole arc: the
 * incoming faces swapped places with the outgoing ones rather than joining them. */
t("C4: exactly three faces are preloaded, the same number as before the arc began — the label face is read but not preloaded, so no public page pays for the studio",
  ["Source_Serif_4", "Work_Sans", "Kaushan_Script", "Fraunces", "DM_Sans", "Space_Grotesk", "Caveat"]
    .filter((c) => preloadOf(c) === true).length, 3);

/* ================================================ C5. EVERY ROLE TOKEN IS READ BY SOMETHING
 * ⚠ PER TOKEN, NOT OVER THE SET, AND THAT IS THE WHOLE POINT. #260 found `--studio-t0` declared
 * with zero consumers for two PRs while a gate written to prevent exactly that passed — because
 * it counted the SET and the set was non-empty. A token nobody reads is a name that reads as
 * authoritative and drives nothing; the FIT_THRESHOLD_PX shape, deleted three times in this repo.
 *
 * `--font-label` was in that state from the PR that declared it until the PR that read it. The
 * additive-first sequence was right and is not what this catches — what it catches is the state
 * PERSISTING, which is only visible if each token is asked about by name. */
{
  const files = [];
  const walk = (rel) => {
    for (const e of readdirSync(new URL(`../../${rel}`, import.meta.url), { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const child = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(child); else if (/\.(tsx?|css)$/.test(child)) files.push(child);
    }
  };
  walk("app"); walk("components");
  /* ⚠ COMMENTS STRIPPED, BECAUSE THE FIRST VERSION READ ITS OWN PROSE. The note beside these
   * constants explains that they "carry `font-label`", and that sentence satisfied the consumer
   * count — so the gate stayed green with both real consumers deleted. `studio-ink` G1 records the
   * identical failure: an assertion that matched the comment four lines above the code it meant to
   * check. Found by mutation, which is the only thing that finds it. */
  const src = files
    .map((f) => code(readFileSync(new URL(`../../${f}`, import.meta.url), "utf8")))
    .join("\n");
  /* ⚠ THE DECLARATION IS NOT A CONSUMER, and the first version of this counted it. `--font-label:`
   * contains the string `font-label`, so a naive word match found the token's own definition and
   * reported it as used — a gate that would have passed with zero real consumers, which is the
   * exact false pass it exists to prevent. Caught by mutation: stripping BOTH consumers still left
   * it green. The class token must not be preceded by `--`. */
  const consumers = (role) =>
    (src.match(new RegExp(`(^|[^-\\w])font-${role}\\b`, "gm")) ?? []).length
    + (src.match(new RegExp(`var\\(--font-${role}\\)`, "g")) ?? []).length;
  for (const role of ["display", "body", "label"]) {
    t(`C5: --font-${role} is READ by something — a role token with no consumer is a name that drives nothing`,
      consumers(role) > 0, true);
  }
  /* ⚠ AND EVERY DECLARED FACE TOKEN TOO, NOT ONLY THE THREE ROLES — which is the generalisation
   * the cleanup earned. `--font-fraunces` and `--font-dm-sans` sat in @theme with zero consumers
   * for two PRs after the swap, and the role-only loop above could not see them: they are faces,
   * not roles. That is the FIT_THRESHOLD_PX shape one level down, and the same list this repo has
   * deleted from four times — the unused 2xl radius token, the eleven ink-700 sites, a threshold
   * with no caller, a selected-state class nothing set.
   * Derived from @theme rather than listed, so a NEW face declared and never wired fails here on
   * arrival instead of after a year. */
  const declaredFaces = [...cssCode.matchAll(/^\s*--font-([a-z0-9-]+):/gm)]
    .map((m) => m[1])
    /* `--font-weight-*` is a different namespace and is excluded by name, not by accident. The
     * first version swept it in and reported `weight-light`, `weight-bold` and `weight-black` as
     * stale faces. They are not faces, and THAT REPORT WAS ALSO WRONG ON ONE OF THE THREE:
     * `--font-weight-bold` is read by the `font-bold` utility at 19 sites. The utility is
     * `font-bold`, not `font-weight-bold`, so a check written against the TOKEN name could not
     * see it. Two were genuinely unconsumed, `light` and `black`, and both are deleted. */
    .filter((n) => !/-loaded$/.test(n) && !/^weight-/.test(n)
                   && !["display", "body", "label"].includes(n));
  t("C5: the face tokens were derived from @theme — a zero denominator is not a pass",
    declaredFaces.length > 0, true);
  const stale = declaredFaces.filter((f) => consumers(f) === 0);
  t("C5: …and every declared FACE token is read by a role or by a component — none is a name with nothing behind it",
    stale, []);
  /* ⚠ THE LABEL ROLE IS READ TWICE IN SOURCE AND RENDERED AT 47 SITES, and conflating those two
   * numbers is a mistake this assertion nearly shipped. `font-label` appears in exactly two
   * places — `labelCls` and `groupLabelCls` — because the label scale is centralised, which is
   * the shape #199 built. So a raw occurrence count is the WRONG measure of "in use": two is
   * both the healthy number and, in a different world, the abandoned one.
   * The honest measure is that both CONSTANTS carry it and that the constants are used, so that
   * is what is asserted. "At least one occurrence" was true of --studio-t0 the day before it was
   * deleted too. */
  const fields = readFileSync(new URL("../../components/studio/blocks/fields.tsx", import.meta.url), "utf8");
  t("C5: both label constants carry the label face — the role is read through the scale, not sprinkled",
    [/export const labelCls =\s*\n?\s*"font-label /.test(fields),
     /export const groupLabelCls =\s*\n?\s*"font-label /.test(fields)], [true, true]);
  const uses = (n) => (src.match(new RegExp(`\\b${n}\\b`, "g")) ?? []).length;
  t("C5: …and those constants are genuinely applied rather than merely exported",
    uses("labelCls") > 20 && uses("groupLabelCls") > 5, true);
}

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
