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
import { compile } from "tailwindcss";
import { Scanner } from "@tailwindcss/oxide";
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
t("A1: --font-display points at IBM Plex Sans", role("display"), "--font-ibm-plex-sans");
/* ⚠ DISPLAY AND BODY RESOLVE TO ONE FAMILY NOW, AND BOTH ROWS STAY. Asserting them separately is
 * what keeps the two ROLES distinct in the vocabulary; collapsing to one row would make the day
 * they diverge a row nobody wrote. */
t("A2: --font-body points at IBM Plex Sans", role("body"), "--font-ibm-plex-sans");
t("A3: --font-label points at Space Grotesk", role("label"), "--font-space-grotesk");
/* The faces themselves still resolve through next/font, with a metric-matched stack behind them
 * and never a bare generic — a generic drops to Times or Arial and reflows every measured box. */
for (const [face, loaded] of [["ibm-plex-sans", "--font-ibm-plex-sans-loaded"],
                              ["ibm-plex-mono", "--font-ibm-plex-mono-loaded"],
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
/* ⚠ THIS HARDCODED THE OUTGOING FACE AND WOULD HAVE PASSED VACUOUSLY WHILE SAYING SO OUT LOUD.
 * It read `--font-source-serif` directly, so after the swap `liveDisplay` resolved null, `max`
 * resolved null, the filter could never fire, and the row printed "null tops out at null" as a
 * PASS. A row naming its own subject as null is the vacuous pass this runner refuses everywhere.
 * The family is now looked up FROM the role token, so the next swap updates one map entry.
 *
 * ⚠ AND THE NO-AXIS CASE IS A DEFECT RATHER THAN A SKIP, WHICH IS WHAT THE SWAP EXPOSED. Plex Sans
 * is a static family and exposes NO opsz axis, so the old `n > max` test — with `max` null — could
 * not flag anything at all. Against a face with no axis, ANY pinned optical size is inert: the
 * declaration is written, nothing reads it, and the screen disagrees with the code. That is the
 * exact failure this whole suite was built for, so it is asserted rather than skipped. */
const DISPLAY_FAMILY = {
  "--font-ibm-plex-sans": "IBM Plex Sans",
  "--font-source-serif": "Source Serif 4",
  "--font-fraunces": "Fraunces",
};
const liveDisplay = DISPLAY_FAMILY[role("display")] ?? null;
const max = liveDisplay ? axisMax(liveDisplay, "opsz") : null;
const pinned = opszPins
  .map((p) => Number((/opsz"?\s*,?\s*(\d+(?:\.\d+)?)/.exec(p) ?? [])[1]))
  .filter((n) => Number.isFinite(n));
const overAxis = max == null ? pinned : pinned.filter((n) => n > max);
t("B3a: the live display family is RESOLVED, not assumed — a null here makes B3 vacuous",
  liveDisplay, "IBM Plex Sans");
t(`B3: every pinned optical size fits the live display face's axis (${liveDisplay} exposes ${max == null ? "NO opsz axis, so any pin is inert" : `opsz up to ${max}`})`,
  overAxis, []);

/* ================================================ C. THE PRELOAD BUDGET FOLLOWS THE LIVE FACES
 * A preloaded face nothing reads spends the critical window on nothing; a live face that is not
 * preloaded arrives late and swaps under the reader. Both are silent, so both are pinned.
 * Read per-declaration rather than by counting `preload:` lines, which would not say WHICH. */
const preloadOf = (ctor) => {
  const m = new RegExp(`${ctor}\\(\\{([\\s\\S]*?)\\}\\)`).exec(layoutCode);
  return m ? /preload:\s*true/.test(m[1]) : null;
};
/* ⚠ TWO WHERE THERE WERE THREE, AND THE FACE COUNT FELL BECAUSE ONE FAMILY TOOK TWO ROLES.
 * Display and body were Source Serif 4 and Work Sans; both are IBM Plex Sans now, so the page pays
 * ONE preload for what cost two. A real reduction rather than bookkeeping, and C4 pins the total. */
t("C1: the LIVE preloaded faces are IBM Plex Sans for display AND body, and Kaushan for the wordmark",
  [preloadOf("IBM_Plex_Sans"), preloadOf("Kaushan_Script")], [true, true]);
/* ⚠ AND THE MONO IS ASSERTED NOT PRELOADED, WHICH IS THE HALF THAT COULD DRIFT SILENTLY. It is a
 * LIVE face — every sheet mark, plate number and readout key reads it — so C1's rule would naively
 * demand it. It stays false because none of those is the LCP element and all are legible in the
 * fallback mono while the file arrives, the same trade the label face lost. Asserting it means a
 * future author cannot flip it without meeting that argument. */
t("C1a: IBM Plex Mono is LIVE and deliberately NOT preloaded — small marks, never the LCP element",
  preloadOf("IBM_Plex_Mono"), false);
/* ⚠ C2's SUBJECT WAS DELETED, WHICH IS THE THIRD KIND OF CHANGE AND THE EASIEST TO GET WRONG.
 * It asserted the two outgoing faces were not PRELOADED. They are not LOADED at all now, so the
 * old form would read `null` for both and pass by comparing nothing to nothing — a green row
 * about two things that no longer exist. Restated as an absence: they must not be imported.
 * A gate whose subject vanishes is rewritten to assert the vanishing, never left to pass vacuously. */
/* ⚠ AND IT HAS TWO MORE MEMBERS NOW, ADDED UNDER C2's OWN RULE. Source Serif 4 and Work Sans are
 * this swap's outgoing pair, so by the sentence directly above they belong here rather than being
 * left to pass as `null`. Four names, one absence claim, and the direction is the safe one: if any
 * of them is reimported this goes red, where a preload check on a face nobody loads cannot. */
t("C2: every OUTGOING face is gone entirely — not merely unpreloaded, but not loaded",
  [/\bFraunces\b/.test(layoutCode), /\bDM_Sans\b/.test(layoutCode),
    /\bSource_Serif_4\b/.test(layoutCode), /\bWork_Sans\b/.test(layoutCode)],
  [false, false, false, false]);
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
/* ⚠ AND THE REASON IS WRONG FOR THE THIRD TIME, CAUGHT BY A FONT CENSUS RATHER THAN BY READING.
 * This row said public pages "must not pay for a face they never render". Measured on the live home
 * page by walking every leaf element and reading its computed family: SPACE GROTESK PAINTS TWO
 * PUBLIC ELEMENTS — `.palette-pill-label` and `.palette-rail-label`, both reading "Theme". So the
 * consumers are NOT studio-only and the page does render it.
 *
 * THE VALUE IS STILL `false` AND NOW FOR A FOURTH REASON, WHICH IS THE POINT OF REWRITING RATHER
 * THAN DELETING. Two 10px labels on one control do not justify a preload in the critical window —
 * the same trade Plex Mono loses at C1a. The flag has now survived four different justifications
 * without moving, and each rewrite has made the claim narrower and truer.
 *
 * ⚠ AND THIS WAS ALREADY FALSE BEFORE THE FACE SWAP. The teaser predates it, so nothing in this
 * change caused the drift — the swap is only what made someone census the families. A claim about
 * WHERE a face renders cannot be checked by reading the file that loads it. */
t("C3: Space Grotesk is STILL not preloaded — it has two tiny PUBLIC consumers in the palette teaser, and two 10px labels do not earn a slot in the critical window",
  preloadOf("Space_Grotesk"), false);
/* The count is what a public page actually pays.
 *
 * ⚠ IT HELD AT THREE FOR THE WHOLE ARC AND HAS NOW FALLEN TO TWO, WHICH IS THE FIRST TIME THIS ROW
 * HAS MOVED. Every previous swap traded one face for another, so the total was the invariant and the
 * row read as a budget. This swap collapsed TWO ROLES INTO ONE FAMILY, so the budget genuinely
 * shrank — display and body are the same file. Verified against the built output as well as the
 * source: the emitted preload links went 4 to 3, one fewer than the face count because Plex Sans
 * ships normal and italic as separate files while Kaushan is one.
 *
 * THE LIST KEEPS THE RETIRED NAMES ON PURPOSE. A face that is not imported reads `null`, which the
 * filter drops, so leaving them in costs nothing and means a reimport shows up in the TOTAL rather
 * than only in C2's absence check. */
t("C4: exactly two faces are preloaded — one family now serves display AND body, so the budget fell rather than held",
  ["IBM_Plex_Sans", "IBM_Plex_Mono", "Kaushan_Script", "Source_Serif_4", "Work_Sans",
    "Fraunces", "DM_Sans", "Space_Grotesk", "Caveat"]
    .filter((c) => preloadOf(c) === true).length, 2);

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
  /* ---- ⚠ THE ORACLE IS THE COMPILER, NOT THE TOKEN'S NAME ------------------------------------
   *
   * The three versions before this one all matched STRINGS, and each failed differently:
   *   1. `font-label` matched the token's own DECLARATION, so it passed with zero consumers.
   *   2. Fixed, it matched the COMMENT beside the constants explaining that they carry it.
   *   3. Fixed again, it still could not see a utility named differently from its token —
   *      `--font-weight-bold` is read by `font-bold`, and a check built from the token name
   *      looks for `font-weight-bold`, which appears nowhere. I reported that token as stale in
   *      #310 on exactly that reasoning. It has NINETEEN consumers.
   *
   * All three are the same mistake: guessing how a token is reached instead of asking.
   *
   * TAILWIND TREE-SHAKES `@theme`, so a declared token reaches the compiled stylesheet ONLY if
   * something uses it — whatever that something is named. Verified on the real bundle before this
   * was built on: it carries `bold`, `medium`, `regular` and `semibold` and no others, which is
   * exactly the consumed set. So "is this token consumed" is answered by compiling the project and
   * looking, and the utility's name never enters the question.
   *
   * SCANNED FROM COMMENT-STRIPPED SOURCE, which is the one deliberate difference from what the
   * build does. Tailwind reads prose as source, so a comment naming a utility would emit its token
   * and satisfy this check — trap 2 again, one level down. C5 asks whether CODE consumes a token;
   * `css-comment-trap` asks whether PROSE emits one. Two questions, two gates, neither doing the
   * other's job. */
  /* ⚠ THE `@theme` BLOCK IS REMOVED BEFORE SCANNING, AND SKIPPING THIS PUT TRAP 1 BACK.
   * The scanner reads `.css` too, so `--font-fraunces:` yields the candidate `font-fraunces`,
   * which compiles to a rule referencing the var, WHICH EMITS THE TOKEN. The declaration becomes
   * its own consumer through the compiler — the same false pass as version 1, arriving by a
   * completely different route. Caught by mutation: a re-declared dead token stayed green.
   * The rest of the stylesheet is still scanned, because a hand-written rule reading
   * `var(--font-script)` IS a real consumer and dropping `.css` would lose it. */
  const scanned = files.map((f) => {
    let content = code(readFileSync(new URL(`../../${f}`, import.meta.url), "utf8"));
    if (f.endsWith(".css")) {
      const i = content.indexOf("@theme {");
      if (i !== -1) {
        const end = content.indexOf("\n}", i);
        content = content.slice(0, i) + content.slice(end === -1 ? i : end + 2);
      }
    }
    return { content, extension: f.slice(f.lastIndexOf(".") + 1) };
  });
  const candidates = [...new Set(new Scanner({ sources: [] }).scanFiles(scanned))];
  const ROOT = new URL("../../", import.meta.url).pathname;
  const compiled = (await compile(readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8"), {
    base: `${ROOT}app`,
    loadStylesheet: async (id, base) => {
      const p = id === "tailwindcss" ? `${ROOT}node_modules/tailwindcss/index.css` : `${base}/${id}`;
      return { path: p, base: p.slice(0, p.lastIndexOf("/")), content: readFileSync(p, "utf8") };
    },
    loadModule: async () => ({ module: {}, base: "" }),
  })).build(candidates);

  /* THE ORACLE IS LIVE. If the compile ever returns nothing useful, every check below would read
   * "absent" and the suite would fail loudly rather than pass — but a token KNOWN to be consumed
   * proves the positive direction too, which is the half a false-pass hides in. */
  t("C5: the compiler oracle is live — a token with real consumers reaches the stylesheet",
    /--font-display\s*:/.test(compiled), true);
  t("C5: …and one with none does not, which is the property the whole check rests on",
    /--font-weight-black\s*:/.test(compiled), false);

  const consumed = (tok) => new RegExp(`--${tok}\\s*:`).test(compiled);

  /* ⚠ AND THE WEIGHT NAMESPACE IS NO LONGER EXCLUDED. It was excluded by name precisely because
   * the string check could not read it; the compiler can, so the exclusion goes and every declared
   * font token is covered by one rule. `-loaded` names are next/font's own and are set on <html>
   * rather than consumed through a utility, so they are the one genuine exemption. */
  const declared = [...cssCode.matchAll(/^\s*(--font-[a-z0-9-]+)\s*:/gm)]
    .map((m) => m[1].slice(2))
    .filter((n) => !/-loaded$/.test(n));
  t("C5: the token set was derived from @theme — a zero denominator is not a pass",
    declared.length > 5, true);
  for (const role of ["font-display", "font-body", "font-label"]) {
    t(`C5: --${role} is consumed — a role token with no consumer is a name that drives nothing`,
      consumed(role), true);
  }
  const stale = declared.filter((tok) => !consumed(tok));
  t("C5: EVERY declared font token is consumed — roles, faces and weights alike, asked of the compiler rather than of the token's name",
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
  t("D1: the OG card names its face in ONE constant, not three string literals", brand, "IBM Plex Sans");
  t("D2: …and that face is the one --font-display resolves to, so a card and its page cannot disagree",
    brand && role("display") === `--font-${brand.toLowerCase().replace(/ /g, "-").replace("-4", "")}`, true);
  t("D3: the Google query, the applied family and Satori's registration all read the constant",
    [/family=\$\{BRAND_FONT/.test(og), /fontFamily = font \? BRAND_FONT/.test(og), /name: BRAND_FONT/.test(og)],
    [true, true, true]);
  t("D4: no literal Fraunces survives in the card renderer", /"Fraunces"/.test(og), false);
}

console.log(`\ntypography result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
