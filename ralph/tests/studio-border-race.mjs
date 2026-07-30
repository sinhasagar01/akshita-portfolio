// THE BORDER-RACE GATE — a border-color shorthand and a per-side longhand on one element.
// Run: node ralph/tests/studio-border-race.mjs
//
// ---- THE MECHANISM (hazard 26) --------------------------------------------------------
//
// `border-transparent` writes the CSS property `border-color` (all four sides). `border-l-accent-500`
// writes `border-left-color` (one side). Put both on one element and the LEFT edge is written
// twice — once by the shorthand, once by the longhand — at EQUAL specificity (each is a single
// class). CSS then resolves the tie by SOURCE ORDER in the generated stylesheet, and that order
// is Tailwind's to decide, not the source's. So the rendered edge is a coin-flip that happens to
// land one way today and can flip on a Tailwind upgrade that reorders utilities. It renders
// correctly right now, which is the worst case: nothing catches it.
//
// PR B's selection bar was exactly this — `border-transparent` + `border-l-accent-500` — and the
// fix was to write the three non-bar sides EXPLICITLY (`border-y-transparent border-r-transparent`)
// so no two utilities ever touch the same edge. That disjoint-edges idiom is what this gate holds.
//
// ---- WHY THE OTHER GATES ARE BLIND TO IT ----------------------------------------------
//
// `studio-cascade` catches an unlayered element rule beating a layered utility (hazard 11). This
// is utility-VERSUS-utility: both are layered, both generate CSS, no element rule is involved, so
// cascade never fires. A class-string grep sees two valid classes and shrugs. The race lives in
// the RELATIONSHIP between two utilities on one element, which only a per-element edge analysis
// can see — this suite.
//
// ---- SCOPE, AND THE ONE PUBLIC EXCEPTION ----------------------------------------------
//
// components/studio + app/studio, matching studio-cascade. A whole-repo scan finds exactly one
// instance of the mechanism OUTSIDE studio, and it is why the scope stops here:
// ContactSection's spinner is `border-2 border-white/40 border-t-white animate-spin` — the
// universal Tailwind loading-arc idiom, where the top edge is DELIBERATELY brighter than the
// other three. It relies on the same side-longhand-wins-over-shorthand ordering this gate
// forbids, but it is idiomatic public code, not the studio selection-bar pattern the hazard
// was found in. Reported in STATE rather than rewritten. Inside studio the disjoint idiom is
// the rule; the marketing site keeps its spinner.
import { readdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* ================================================ A. CLASSIFY ONE BORDER-COLOR UTILITY
 * Returns { variant, edges } for a border-COLOR utility, or null for anything else (widths,
 * radii, non-border). The edge set is what this utility writes; two utilities RACE when their
 * edge sets intersect within the same variant scope. */
const SIDE_EDGES = { "": ["t", "r", "b", "l"], x: ["l", "r"], y: ["t", "b"], t: ["t"], r: ["r"], b: ["b"], l: ["l"] };
// A COLOUR value: a keyword, a BASE colour (white/black, which take an /opacity but no shade),
// a palette shade (`ink-950`, optional /opacity), or an arbitrary [#hex]/[rgb…]. NOT a length —
// `border-l-[3px]` is a WIDTH and must not match. The base-colour case (`white/24`) is separate
// from the shade case because `white` has no numeric shade; missing it once made the gate blind
// to every `border-white/24` on the ink chrome, which is precisely where a race could hide.
const COLOUR = /^((transparent|current|inherit|white|black|[a-z]+-\d{2,3})(\/\d+)?|\[(#|rgb|hsl|oklch|oklab|var\()[^\]]*\])$/;

function classifyBorderColour(cls) {
  const i = cls.lastIndexOf(":");
  const variant = i === -1 ? "" : cls.slice(0, i + 1); // includes the trailing ":", "" for base
  const bare = i === -1 ? cls : cls.slice(i + 1);
  const m = bare.match(/^border-(?:([xytrbl])-)?(.+)$/);
  if (!m) return null;                       // not `border-<side?>-<something>`
  const side = m[1] ?? "";
  if (!(side in SIDE_EDGES)) return null;
  if (!COLOUR.test(m[2])) return null;       // a width/other, not a colour
  return { variant, edges: SIDE_EDGES[side], cls: bare };
}

/* ================================================ B. THE PER-ELEMENT EDGE CHECK
 * Given the border-colour utilities that are simultaneously present on ONE element (one variant
 * scope at a time), a race exists when two DISTINCT utilities write an overlapping edge. */
function raceIn(utils) {
  const byVariant = new Map();
  for (const u of utils) {
    if (!byVariant.has(u.variant)) byVariant.set(u.variant, []);
    byVariant.get(u.variant).push(u);
  }
  for (const [variant, list] of byVariant) {
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        if (list[a].cls === list[b].cls) continue; // identical utility, no contest
        const overlap = list[a].edges.filter((e) => list[b].edges.includes(e));
        if (overlap.length) {
          return { variant, a: list[a].cls, b: list[b].cls, edges: overlap.join("+") };
        }
      }
    }
  }
  return null;
}

/* ================================================ C. WALK EVERY ELEMENT
 * className is `"…"`, `{`…`}`, or `{…}`. The KEY correctness point: TERNARY BRANCHES ARE
 * ALTERNATIVES, not simultaneous. The safe row carries `border-l-accent-500` in one branch and
 * `border-l-transparent` in the other; pooling them would falsely see two left-edge writers. So
 * the base tokens are checked WITH EACH BRANCH SEPARATELY (base ∪ branchₙ), never branch ∪ branch. */
function* elementUtilSets(src, rel) {
  const re = /<([A-Za-z][A-Za-z0-9]*)\s([^>]*?)>/gis;
  let m;
  while ((m = re.exec(src))) {
    const attrs = m[2];
    const cn = attrs.match(/className=(?:"([^"]*)"|\{`([\s\S]*?)`\}|\{([^}]*)\})/);
    if (!cn) continue;
    const raw = cn[1] ?? cn[2] ?? cn[3] ?? "";
    const line = src.slice(0, m.index).split("\n").length;

    // TERNARY BRANCHES ARE MUTUALLY-EXCLUSIVE, and they appear in TWO syntaxes — a template
    // interpolation `${x ? "a" : "b"}` and a bare array element `[…, x ? "a" : "b"]`. The
    // OverviewRow false positive came from handling only the first: its pill uses the array
    // form, so its two colour branches were pooled and read as one racing element. Match the
    // `? "…" : "…"` shape DIRECTLY, wherever it sits, and pull each side as a separate branch.
    const branches = [];
    const baseText = raw
      .replace(/\?\s*(["'`])([^"'`]*)\1\s*:\s*(["'`])([^"'`]*)\3/g, (_w, _q1, a, _q3, b) => {
        branches.push(a, b);
        return " "; // the ternary is removed from the base; its branches are checked separately
      })
      .replace(/\$\{[\s\S]*?\}/g, " ");
    const baseTokens = [
      ...(baseText.match(/["'`]([^"'`]*)["'`]/g) ?? []).flatMap((l) => l.slice(1, -1).split(/\s+/)),
      ...baseText.replace(/["'`][^"'`]*["'`]/g, " ").split(/\s+/),
    ].filter(Boolean);

    const asUtils = (toks) => toks.map(classifyBorderColour).filter(Boolean);
    const base = asUtils(baseTokens);
    // Candidate simultaneous sets: base alone, and base ∪ each single branch.
    const candidates = branches.length ? branches.map((br) => [...base, ...asUtils(br.split(/\s+/))]) : [base];
    yield { rel, line, candidates };
  }
}

/* ================================================ D. THE ASSERTIONS */
const dirs = [
  { rel: "components/studio", url: new URL("../../components/studio/", import.meta.url) },
  { rel: "app/studio", url: new URL("../../app/studio/", import.meta.url) },
];
const files = [];
for (const d of dirs) {
  for (const f of readdirSync(d.url, { recursive: true })) {
    if (String(f).endsWith(".tsx")) files.push({ rel: `${d.rel}/${f}`, url: new URL(String(f), d.url) });
  }
}

// A0 · THE CLASSIFIER IS RIGHT — the distinctions the whole gate rests on. A width is not a
// colour, a two-side utility spans the right edges, the safe disjoint trio does not race.
t("A0: `border-l-[3px]` is a WIDTH, classified as not-a-colour (else every reserved-bar row false-positives)",
  classifyBorderColour("border-l-[3px]"), null);
t("A0: `border-transparent` writes all four edges",
  classifyBorderColour("border-transparent")?.edges, ["t", "r", "b", "l"]);
t("A0: `border-x-transparent` writes left+right",
  classifyBorderColour("border-x-transparent")?.edges, ["l", "r"]);
t("A0: `lg:border-white/24` keeps its variant scope",
  classifyBorderColour("lg:border-white/24")?.variant, "lg:");
t("A0: the disjoint trio does NOT race — {t,b} {r} {l} never overlap",
  raceIn([classifyBorderColour("border-y-transparent"), classifyBorderColour("border-r-transparent"), classifyBorderColour("border-l-accent-500")]), null);
t("A0: a shorthand + a per-side longhand DOES race on the shared edge",
  raceIn([classifyBorderColour("border-transparent"), classifyBorderColour("border-l-accent-500")])?.edges, "l");
t("A0: same edge in DIFFERENT variant scopes does NOT race (base vs lg: is an intended override)",
  raceIn([classifyBorderColour("border-l-transparent"), classifyBorderColour("lg:border-l-accent-500")]), null);

/* C1 · NO ELEMENT MIXES A SHORTHAND WITH AN OVERLAPPING LONGHAND. Reports the element, the two
 * utilities, and the contested edge — never a bare count, so the fix is obvious from the message. */
const races = [];
for (const f of files) {
  const src = readFileSync(f.url, "utf8");
  for (const el of elementUtilSets(src, f.rel)) {
    for (const set of el.candidates) {
      const r = raceIn(set);
      if (r) { races.push({ where: `${el.rel}:${el.line}`, ...r }); break; }
    }
  }
}
if (races.length) {
  console.log("\n  BORDER-COLOUR RACES — two utilities write the same edge, order decides which wins:\n");
  for (const r of races) {
    console.log(`    ${r.where}  ${r.variant}\`${r.a}\` and ${r.variant}\`${r.b}\` both write the ${r.edges} edge.`);
    console.log(`      Equal specificity, so the generated sheet's order decides — a Tailwind-version coin flip.`);
    console.log(`      Fix: write every side as a per-side longhand so no two utilities touch one edge`);
    console.log(`      (border-y-… border-r-… border-l-…), the ListDetailLayout idiom.\n`);
  }
}
t(`C1: no studio element combines a border-colour shorthand with an overlapping per-side longhand${races.length ? ` — see the ${races.length} above` : ""}`,
  races.map((r) => `${r.where} ${r.a}+${r.b}(${r.edges})`), []);

console.log(`\nstudio-border-race result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
