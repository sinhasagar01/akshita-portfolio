// Contrast as a FUNCTION OF A PALETTE, so a theme can be judged before it ships.
//
// ---- ⚠ WHY THIS TAKES A USAGE MAP AND NOT JUST A PALETTE ---------------------------------------
//
// The obvious shape is `report(palette)` — every token against every ground, refuse anything under
// 4.5. It refuses the site that ships today. `accent-500`'s cream ladder is 4.7 / 4.48 / 4.07 /
// 3.43, so it MISSES `cream-100` by 0.02, and that is not a defect: accent never carries text on
// cream-100. The pair exists in the palette and not in the product.
//
// ⚠ CONTRAST IS A PROPERTY OF A PAIR IN USE, NOT OF A PALETTE. So the palette varies per theme and
// the usage map does not — it is the design's own statement of which colour sits on which ground in
// which role, and it is the half that says 4.48 is irrelevant rather than tolerated.
//
// ⚠ AND A NEAR-MISS IS DELIBERATELY NOT A THIRD VERDICT. Softening a floor by 0.02 to admit today's
// accent would let every future palette land in the same crack, and a widened-under-pressure
// assertion is a thing this repo has caught three times. A pair either clears its floor in the
// roles it holds, or its USAGE changes.
//
// ---- THE TWO KINDS OF FLOOR, AND WHY THE DIFFERENCE REACHES THE OUTPUT -------------------------
//
//   external   WCAG. 4.5 for text under 18px, 3.0 for non-text and UI. Does not move, ever, and is
//              the same for every theme.
//   internal   OURS. The 1.05 per-step ground separation, the scrollbar's rest floor, and every
//              per-pair minimum that encodes today's design rather than a standard. A theme with a
//              different ground ladder may legitimately need these retuned.
//
// ⚠ BOTH ARE REFUSALS. Naming the second as ours must NOT soften it into a warning — the palette
// does not ship either way. The distinction is about what the owner does NEXT: an external failure
// means the palette is not shippable, an internal one means either the palette moves or the floor
// does, and only the second is a design decision. A gate reporting both identically leaves the
// owner unable to tell those apart.

export type Rgb = [number, number, number];

/**
 * ⚠ THE ONE SCANNING REGEX. Import this; do not write your own.
 *
 * The `rgba` defect that corrected #338 lived in a THROWAWAY VERIFICATION REGEX — one that existed
 * for the length of a single PR, which no audit of the standing instruments could ever reach. A
 * verification step reaches for a regex because writing one is FASTER than importing something.
 *
 *   SO THE JOB OF THIS EXPORT IS NOT DEDUPLICATION. IT IS MAKING THE ONE-OFF UNNECESSARY.
 *
 * It is a getter rather than a constant so every caller gets a fresh `lastIndex` — a shared `/g`
 * regex carries state between `.test()` calls, which is its own silent-wrong-answer.
 *
 * ⚠ THE LEADING `(?<![&\w])` IS THE FALSE-POSITIVE GUARD, AND IT IS THE DIRECTION THAT MATTERS MORE
 * FOR THIS INSTRUMENT. `&#8594;` is the HTML entity for an arrow, and `#8594` is a syntactically
 * valid four-digit hex — so the pattern matched TEXT as a colour and the boundary join reported
 * `AboutSection.tsx` as holding an unclassified one.
 *
 * A MISSED COLOUR IS A LEAK THE RENDER EVENTUALLY SHOWS. A PHANTOM COLOUR IS A ROW IN A BOUNDARY
 * FILE WITH A REASON SOMEBODY INVENTED FOR A VALUE THAT WAS NEVER A COLOUR — a permanent false
 * record in the one document whose entire value is that its reasons are arguable.
 *
 * Both of this arc's earlier parser defects were things the matcher COULD NOT SEE. This is the
 * first it saw and should not have.
 */
export const colourPattern = () =>
  /(?<![&\w])#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\boklch\([^)]*\)|\bhsla?\([^)]*\)|\bcolor\(display-p3[^)]*\)/g;

/** Every colour form this matcher claims to read. The coverage fixture asserts against THIS list,
 *  so adding a form without teaching the parser fails rather than silently widening the claim. */
export const COLOUR_FORMS = [
  "hex-3", "hex-4", "hex-6", "hex-8", "rgb", "rgba", "hsl", "hsla",
  "oklch-percent", "oklch-plain", "oklch-alpha", "named", "transparent",
] as const;

/**
 * A colour's identity, independent of spelling — `14%` and `14.0%` and `#4a4239` and
 * `rgb(74,66,57)` all collapse to one key. Returns null for anything unreadable, and ⚠ NULL MEANS
 * "I CANNOT READ THIS", NOT "THIS IS NOT A COLOUR". Callers that need the difference must ask.
 */
export function colourKey(value: string): string | null {
  const rgb = parseColor(value);
  return rgb ? rgb.join(",") : null;
}

/** oklch(L C H) -> sRGB 0..255. L is a fraction, H degrees. The standard Björn Ottosson transform,
 *  and the single copy — `studio-ink-contrast` imports it rather than keeping a second. */
export function oklchToRgb(L: number, C: number, H: number): Rgb {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  const enc = (v: number) => {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };
  return lin.map((v) => Math.round(enc(v) * 255)) as Rgb;
}

/* ============================================================================================
   ⚠ THE GAMUT CHECK, AND WHY IT IS A SEPARATE FUNCTION FROM `oklchToRgb`.

   `oklchToRgb` above CLAMPS — `Math.max(0, Math.min(1, v))` — and clamping is correct for it,
   because a browser does the same thing and the clamped value is what actually paints. What is
   wrong is that the clamp is SILENT: an unreachable colour comes back as a perfectly ordinary
   RGB triple and every ratio computed from it is a real number about a colour nobody can draw.

   So this returns the OVERSHOOT the clamp swallowed, in 0-255 units, before encoding. Zero means
   the colour exists.

   ⚠ CHROMA IS NOT COMPARABLE ACROSS HUES, WHICH IS THE FACT THAT MAKES THIS NECESSARY RATHER THAN
   PEDANTIC. sRGB holds 0.289 of chroma at h300 and L .560, and 0.126 at h158 — so "c 0.16" is
   comfortable in violet and impossible in green. A number that reads as "more saturated" is a
   different proportion of the available space at every hue, and no amount of care substitutes for
   measuring it. Harbour found the green ceiling empirically and ships its accent at c 0.12.
============================================================================================ */

/** Below this, treat the overshoot as rounding rather than a real clip. */
export const CLIP_EPSILON = 0.5;

/** How far outside sRGB an OKLCH triple sits, in 0-255 units. 0 when the colour is representable. */
export function oklchOvershoot(L: number, C: number, H: number): number {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const enc = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055);
  return Math.max(0, ...[
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((v) => {
    /* ⚠ BOTH BRANCHES REPORT IN THE SAME UNIT — 0-255 BYTES — WHICH TAKES CARE. A negative linear
     * channel is the common clip, and sRGB's transfer function is LINEAR near zero with slope
     * 12.92, so the byte-equivalent of a negative linear value is `12.92 * v * 255`. Dropping that
     * factor understates the clip by an order of magnitude and makes a real one look like rounding.
     * An over-one channel is already past the linear segment, so it is encoded first and compared
     * against 255 directly.
     *
     * ⚠ AND `Math.max(0, ...)` IS LOAD-BEARING: an in-gamut colour produces two negative terms, and
     * without the floor this returns "how much headroom is left" wearing the name of an overshoot. */
    if (v < 0) return -v * 12.92 * 255;
    return enc(v) * 255 - 255;
  }));
}

/** The overshoot of a declared CSS value, or 0 for forms that are representable by construction
 *  (a hex or an `rgb()` cannot be out of gamut — it is already sRGB). */
export function gamutOvershoot(value: string): number {
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/.exec(value.trim());
  if (!m) return 0;
  const L = m[2] === "%" ? Number(m[1]) / 100 : Number(m[1]);
  return oklchOvershoot(L, Number(m[3]), Number(m[4]));
}

/** CSS alpha-over IN GAMMA SPACE — browsers composite `rgb(...)/a` on the encoded bytes, not in
 *  linear light. Compositing in linear light reads several ratios high. */
export function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return fg.map((f, i) => Math.round(alpha * f + (1 - alpha) * bg[i])) as Rgb;
}

export function luminance([r, g, b]: Rgb): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

/**
 * Parse `oklch(92.0% 0.022 78)` or `oklch(0.92 0.022 78)`, with or without an alpha. Returns null
 * for anything else, so an unparseable entry surfaces as an uncomputable ROW rather than a silent
 * zero.
 *
 * ⚠ THE PERCENTLESS FORM WAS UNREADABLE UNTIL #333, AND THIS CODEBASE USES IT. `--color-smoke-1`
 * is `oklch(0.84 0.014 58 / 0.74)` — valid CSS, and the `%` was MANDATORY in the old pattern, so
 * every smoke stop parsed as null. It went unnoticed because those tokens sit on the contrast
 * gate's boundary list, and a listed token is never asked to parse. **A value the instrument cannot
 * read looks exactly like a value nothing needed to read**, which is the sixth measurement defect of
 * this arc wearing a new hat.
 *
 * The alpha is PARSED AND DISCARDED rather than rejected. Callers composite explicitly through
 * `over()`, so silently honouring an embedded alpha would double-apply it.
 */
export function parseOklch(value: string): Rgb | null {
  const m = /^\s*oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+\s*)?\)\s*$/.exec(value);
  if (!m) return null;
  const raw = Number(m[1]);
  /* `50%` and `0.5` are the same lightness; `50` without a unit is not valid CSS but would be
     ambiguous, so the percent sign decides rather than a magnitude heuristic. */
  return oklchToRgb(m[2] === "%" ? raw / 100 : raw, Number(m[3]), Number(m[4]));
}

/**
 * Parse any colour spelling the token layer actually uses. Returns null for anything unrecognised,
 * so an unparseable entry surfaces as an uncomputable ROW rather than as a silent zero.
 *
 * ⚠ HEX AND `rgb()` ARE HERE BECAUSE A BYTE-IDENTICAL RENAME REQUIRES THEM. Naming a colour the
 * design has always drawn means declaring it AT ITS CURRENT VALUE, and re-expressing `#4a4239` as
 * oklch lands on [71,64,56] against a target of [74,66,57] — close, and not identical. A token that
 * shifts a colour while claiming to name it is the visible-change-as-cleanup this PR exists to
 * avoid, so the declaration keeps the literal and the parser learns to read it.
 */
export function parseColor(value: string): Rgb | null {
  const v = value.trim();
  const oklch = parseOklch(v);
  if (oklch) return oklch;

  /* Hex in all four lengths. 3 and 4 digit expand by doubling; 8 and 4 carry an alpha this drops,
     because callers composite explicitly through `over()` and honouring it here would double it. */
  const hex = /^#([0-9a-fA-F]{3,8})$/.exec(v);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      return [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16)) as Rgb;
    }
    if (h.length === 6 || h.length === 8) {
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
    }
    return null;                                   // 5 and 7 are not valid CSS
  }

  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(v);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as Rgb;

  const hsl = /^hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%/.exec(v);
  if (hsl) return hslToRgb(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100);

  if (v === "transparent") return [0, 0, 0];
  const named = NAMED_COLOURS[v.toLowerCase()];
  return named ?? null;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(((h % 360) + 360) % 360 / 60);
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][seg];
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as Rgb;
}

/** The handful of CSS keywords this codebase actually writes. Not the full 148 — a matcher that
 *  claims coverage it does not have is the defect this file exists to stop. */
const NAMED_COLOURS: Record<string, Rgb> = {
  white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0],
  currentcolor: [0, 0, 0],
};

/** A theme's colours: token name (without the `--color-` prefix) to a colour literal. */
export type Palette = Record<string, string>;

export type FloorKind = "external" | "internal";

/** One pair the design actually draws. `alpha` composites the foreground over the ground first,
 *  which is how every hairline and scrim on this site is specified. */
export type UsageRow = {
  key: string;
  fg: string;
  bg: string;
  min: number;
  kind: FloorKind;
  alpha?: number;
  note?: string;
  /** What draws this pair, REQUIRED on a non-text row and PROSE rather than a list — `Z-ui` checks
   *  its length, so a row that merely names a component fails. Three UI rows have existed and all
   *  three were false, so a row must say what draws it and on what ground that was measured. */
  draws?: string;
};

export type RowResult = UsageRow & { got: number | null; ok: boolean; missing?: string[] };

export type Verdict =
  | "SHIPPABLE" | "REFUSED_EXTERNAL" | "REFUSED_INTERNAL" | "UNCOMPUTABLE" | "UNREPRESENTABLE";

export type Report = {
  verdict: Verdict;
  rows: RowResult[];
  failures: RowResult[];
  /** Failure keys split by floor kind, so a caller can say WHAT the owner does next. */
  external: string[];
  internal: string[];
  /** Rows whose tokens the palette does not define. Never silently skipped — see UNCOMPUTABLE. */
  uncomputable: string[];
  /** Tokens sRGB cannot hold, with how far outside they sit. See `UNREPRESENTABLE`. */
  unrepresentable: { token: string; overshoot: number }[];
};

/**
 * Judge a palette against the roles the design draws it in.
 *
 * ⚠ `UNCOMPUTABLE` OUTRANKS `SHIPPABLE`, AND THAT IS THE HAZARD-30 RULE APPLIED HERE. A palette
 * missing a token the usage map names produces a row that cannot be computed, and a gate that
 * skipped it would report SHIPPABLE having checked fewer pairs than it claims. A colour nobody
 * knows is uncomputed is exactly the shape this project keeps finding.
 *
 * ⚠ AND `REFUSED_EXTERNAL` OUTRANKS `REFUSED_INTERNAL`, because a palette failing WCAG is not
 * shippable whatever else is true, and the owner should be told the non-negotiable thing first.
 *
 * ⚠ AND `UNREPRESENTABLE` OUTRANKS BOTH, BECAUSE THE INSTRUMENT COULD NOT TELL "FAILS CONTRAST"
 * FROM "DOES NOT EXIST" AND BOTH ARRIVED AS A RATIO. A candidate green measured 4.320 against a
 * 4.5 floor and read as a palette needing a darker accent. It was not: its red channel computed to
 * MINUS 129, `oklchToRgb` clamped it to zero, and 4.320 was the contrast of a colour sRGB cannot
 * draw. Tuning the lightness in response would have been a correct measurement of a quantity that
 * does not exist.
 *
 * Same shape as parse-before-exclude in #334 — the instrument must say what it CANNOT REPRESENT
 * rather than return a plausible value for it. So the gamut check runs BEFORE the contrast check
 * and outranks its verdicts.
 */
export function report(palette: Palette, usage: readonly UsageRow[]): Report {
  const unrepresentable = Object.entries(palette)
    .map(([token, value]) => ({ token, overshoot: gamutOvershoot(value) }))
    .filter((x) => x.overshoot > CLIP_EPSILON)
    .sort((a, b) => b.overshoot - a.overshoot);

  const rgb = (name: string): Rgb | null => {
    const v = palette[name];
    return v ? parseColor(v) : null;
  };

  const rows: RowResult[] = usage.map((row) => {
    const fg = rgb(row.fg), bg = rgb(row.bg);
    const missing = [
      ...(fg ? [] : [row.fg]),
      ...(bg ? [] : [row.bg]),
    ];
    if (!fg || !bg) return { ...row, got: null, ok: false, missing };
    const front = row.alpha === undefined ? fg : over(fg, row.alpha, bg);
    const got = contrastRatio(front, bg);
    return { ...row, got, ok: got >= row.min };
  });

  const uncomputable = rows.filter((r) => r.got === null).map((r) => r.key);
  const failures = rows.filter((r) => !r.ok && r.got !== null);
  const external = failures.filter((r) => r.kind === "external").map((r) => r.key);
  const internal = failures.filter((r) => r.kind === "internal").map((r) => r.key);

  const verdict: Verdict = uncomputable.length ? "UNCOMPUTABLE"
    : unrepresentable.length ? "UNREPRESENTABLE"
    : external.length ? "REFUSED_EXTERNAL"
    : internal.length ? "REFUSED_INTERNAL"
    : "SHIPPABLE";

  return { verdict, rows, failures, external, internal, uncomputable, unrepresentable };
}

/* ============================================================================================
   ⚠ THE PALETTE SOURCE AND THE LAYERING — LIFTED OUT OF `ralph/tests/theme-contrast.mjs` SO THAT
   `/palettes` COMPUTES COMPATIBILITY THROUGH THE GATE'S OWN RESOLVER RATHER THAN A SECOND ONE.

   A page that publishes contrast figures and a gate that refuses palettes must not disagree, and
   two implementations of one arithmetic is exactly how they would. This is pure motion — the suite
   below imports these and its output is unchanged, which is the claim the lift is proved on.

   ---- ⚠ WHY THIS FILE STILL IMPORTS NOTHING, INCLUDING `node:fs` -----------------------------

   Two constraints meet here and only one shape satisfies both.

   ONE. `ralph` loads this raw under `node --experimental-strip-types`, which resolves a relative
   import only when the specifier carries `.ts` — and `tsc` rejects that extension because
   `allowImportingTsExtensions` is off under `moduleResolution: "bundler"`. So this leaf cannot
   import a sibling leaf in EITHER spelling, the same rule `lib/theme.ts` documents.

   TWO. `node:fs` is a builtin and WOULD satisfy both loaders — and it is still not imported here,
   because this file would then be unusable from a client component and the failure would arrive as
   a bundler error in whatever imported it three months from now. READING A FILE IS NOT THE
   RESOLVER. Each caller passes the stylesheet text in, which is one line at each of two call sites
   and keeps this module pure.

   THE CONSEQUENCE IS THAT THE THEME REGISTRY IS PASSED IN RATHER THAN IMPORTED. `layerPalette`
   cannot read `THEME_GROUND` or `DEFAULT_THEME` from `lib/theme.ts`, so the caller resolves those
   two facts and hands them over as data. That is deliberate: policy stays with the registry that
   owns it, and this file stays arithmetic.
============================================================================================ */

/** The OKLCH components of a colour, in the 0..1 lightness form the stylesheet is authored in. */
export type Oklch = { L: number; C: number; H: number };

export type PaletteSource = {
  /** The `@theme` block's body, verbatim.
   *
   *  ⚠ TWO READERS OF ONE BLOCK, DELIBERATELY, AND UNIFYING THEM IS A SILENT SEMANTIC SWAP.
   *  `rawDecl` below is FIRST-WINS and is the palette. The gamut scan reads this body in source
   *  order LAST-WINS and is a census — it wants every declaration, including a token declared
   *  twice and including the studio names `rawDecl` filters out. Handing it `rawDecl` changes both
   *  the semantics and the declaration count, AND EVERY ASSERTION STILL PASSES, because no row
   *  compares the two. A derived view must not replace its own source; that is why the raw text is
   *  exposed rather than the map being reused. */
  themeBody: string;
  /** Every `--color-*` declared in `@theme`, RAW — an alias keeps its `var()` form. */
  rawDecl: Record<string, string>;
  /** The non-studio subset of those names. The studio palette is frozen and outside every theme. */
  publicTokens: string[];
  /** `@theme`'s values with aliases FOLLOWED, which is cream. Only tokens `parseColor` can read. */
  defaults: Palette;
  /** Tokens that did not parse, kept enumerated so none is filtered away silently. */
  unparseable: { name: string; value: string; derived: boolean }[];
  /** `:root[data-ground="dark"]`'s `--color-*` overrides. */
  groundDark: Record<string, string>;
  /** One theme's `[data-theme="…"]` block. Cream has none by design — `@theme` IS cream. */
  overridesOf: (name: string) => Record<string, string>;
  /** The dark ladder's per-role knobs for one palette. Not colours — see `scalarDeclarations`. */
  scalarsOf: (name: string) => Record<string, string>;
  /** The token an alias points at, or null when the declaration is a literal. */
  aliasOf: (name: string) => string | null;
};

/** The comment spans in a stylesheet, as [start, end) pairs over the raw text. Used to keep
 *  `blockBodyAt` from matching a selector that a comment merely NAMES. */
function commentSpans(src: string): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < src.length - 1; i++) {
    if (src[i] === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*" + "/", i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out.push([i, stop]);
      i = stop - 1;
    }
  }
  return out;
}

/** The body of the first brace-matched block starting at `marker`. Brace-matched rather than
 *  regex-bounded, so a nested rule cannot end it early.
 *
 *  ⚠ AND THE MARKER IS SKIPPED WHERE A COMMENT MERELY NAMES IT, WHICH COST NINE ROWS. This was a
 *  bare `indexOf`, so the first mention of the dark-ground selector won — and the stylesheet
 *  discusses that selector in prose above the rule that declares it. A comment added inside the
 *  defaults block, explaining which selector outranks which, made this function slice from the
 *  wrong brace and hand back a light palette's body as the dark ground's. Every dark palette then
 *  merged the same overrides and D12 reported every ground pair 0.0 dE apart.
 *
 *  ⚠ THE PRE-EXISTING MENTION SURVIVED ONLY BY LUCK, WHICH IS WHY THIS IS A MECHANISM AND NOT A
 *  RULE ABOUT COMMENT WORDING. There has long been a comment naming the same selector thirteen
 *  lines above the real rule, and it was harmless because it happens to contain no opening brace
 *  before the real one. A defence held for a different purpose is not a defence anyone chose.
 *
 *  This file cannot import ralph's comment blanker — it is read by app routes as well as by
 *  suites — so the span test is local and deliberately narrow. It asks only whether an index sits
 *  inside a comment, rather than rewriting the source. */
function blockBodyAt(src: string, marker: string): string {
  const spans = commentSpans(src);
  const inComment = (i: number) => spans.some(([a, b]) => i >= a && i < b);
  let at = src.indexOf(marker);
  while (at >= 0 && inComment(at)) at = src.indexOf(marker, at + 1);
  if (at < 0) return "";
  const open = src.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(open + 1, i);
  }
  return "";
}

/** Every `--color-*` declaration in a block body, first-wins. */
function colourDeclarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    if (!(m[1] in out)) out[m[1]] = m[2].trim();
  }
  return out;
}

/** ⚠ THE DARK LADDER'S PER-ROLE KNOBS, WHICH ARE NOT COLOURS AND SO ESCAPED EVERY READER HERE.
 *  `--dk-*` carries the mix PERCENTAGE for one semantic band, and a palette overrides the bands its
 *  ground cannot take at the shared value. They are deliberately kept out of the colour maps — G4
 *  compares token SETS and a scalar joining that set would read as a palette declaring a colour
 *  nobody else declares. */
function scalarDeclarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--(dk-[a-z0-9-]+):\s*([^;]+);/g)) {
    if (!(m[1] in out)) out[m[1]] = m[2].trim();
  }
  return out;
}

/**
 * Read the palette layer out of `globals.css`.
 *
 * ⚠ THE DEFAULTS ARE SCOPED TO `@theme`, WHICH IS THE DEFAULT PALETTE. Unscoped, a first-wins scan
 * happens to read cream correctly only because `@theme` precedes the theme blocks in the file, and
 * a gate that is right by file ordering is one reorder from being wrong.
 *
 * ⚠ AND IT PARSES EVERYTHING BEFORE EXCLUDING ANYTHING. The reverse order silently drops whatever
 * `parseColor` cannot read, which makes an exclusion list a SHIELD FOR CAPABILITY rather than a
 * statement of POLICY — a parser defect on a listed value is then silent by construction.
 */
export function readPaletteSource(cssText: string): PaletteSource {
  const themeBody = blockBodyAt(cssText, "@theme");
  if (!themeBody) throw new Error("no @theme block in the stylesheet");
  const rawDecl = colourDeclarations(themeBody);

  const aliasOf = (name: string): string | null => {
    const m = /^var\(\s*--color-([a-z0-9-]+)\s*\)$/.exec(rawDecl[name] ?? "");
    return m ? m[1] : null;
  };
  const follow = (name: string, depth = 0): string | undefined => {
    const a = aliasOf(name);
    return a && depth < 5 ? follow(a, depth + 1) : rawDecl[name];
  };

  const publicTokens = Object.keys(rawDecl).filter((k) => !k.startsWith("studio-"));
  const defaults: Palette = {};
  const unparseable: { name: string; value: string; derived: boolean }[] = [];
  for (const k of publicTokens) {
    const v = follow(k);
    if (!v) continue;
    if (parseColor(v)) defaults[k] = v;
    else unparseable.push({ name: k, value: v, derived: /var\(--/.test(v) });
  }

  return {
    themeBody,
    rawDecl,
    publicTokens,
    defaults,
    unparseable,
    groundDark: colourDeclarations(blockBodyAt(cssText, ':root[data-ground="dark"]')),
    overridesOf: (name: string) => colourDeclarations(blockBodyAt(cssText, `[data-theme="${name}"]`)),
    /** The knob defaults, plus whatever a palette overrides. Later wins, as the cascade does. */
    scalarsOf: (name: string) => ({
      ...scalarDeclarations(themeBody),
      ...scalarDeclarations(blockBodyAt(cssText, `[data-theme="${name}"]`)),
    }),
    aliasOf,
  };
}

/**
 * One theme's palette — defaults, then its own block, then the dark ground block.
 *
 * ⚠ A THEMED PALETTE IS RUNGS OVER *ALIASES*, NOT RUNGS OVER CREAM'S RESOLVED ROLES, AND THE
 * OBVIOUS SPREAD IS THE DEFECT THIS FUNCTION EXISTS TO PREVENT. A `[data-theme]` block declares 35
 * tokens and every one is a RUNG — harbour declares `cream-50` and does not declare `surface`. The
 * roles live once in `@theme` spelled `--color-surface: var(--color-cream-50)`, and `defaults`
 * above stores them ALREADY FOLLOWED against cream. So `{ ...defaults, ...overrides }` layers a
 * palette's rungs over cream's resolved roles, and seven tokens the usage map names keep cream's
 * value on every light palette that is not cream. Fixed in #500 with the before-and-after figures
 * on the record; the aliases are followed through the MERGED map here instead.
 *
 * ⚠ A KEY ANY LATER LAYER DECLARES IS LEFT EXACTLY AS THAT LAYER WROTE IT. The dark ground block
 * redeclares those same roles as fresh `var()` and `color-mix()` expressions, and following
 * `@theme`'s alias for one of them would overwrite the dark answer with the light one. That is also
 * why the four dark palettes passed the browser oracle while the defect was live — the ground block
 * repaired them by accident, on exactly the palettes the oracle covered.
 *
 * ⚠ THE GROUND CLASS AND THE DEFAULT NAME ARE PASSED IN, NOT IMPORTED, because this leaf cannot
 * import `lib/theme.ts` — see the header. The caller owns the registry; this owns the arithmetic.
 */
export function layerPalette(
  src: PaletteSource,
  name: string,
  opts: { defaultTheme: string; groundClass: "light" | "dark" }
): Palette {
  const overrides = name === opts.defaultTheme ? {} : src.overridesOf(name);
  const ground = opts.groundClass === "dark" ? src.groundDark : {};
  const merged: Palette = { ...src.defaults, ...overrides, ...ground };
  /* ⚠ THE KNOBS RIDE ALONG UNDER A RESERVED PREFIX RATHER THAN JOINING THE PALETTE. They are mix
   * percentages, not colours, and every consumer of a palette map assumes every value is a colour —
   * so they are namespaced and skipped by the two functions that walk the map. */
  for (const [k, v] of Object.entries(src.scalarsOf(name))) merged[`__${k}`] = v;
  const follow = (value: string | undefined, depth = 0): string | undefined => {
    const m = /^var\(\s*--color-([a-z0-9-]+)\s*\)$/.exec(String(value ?? "").trim());
    return m && depth < 8 ? follow(merged[m[1]], depth + 1) : value;
  };
  for (const k of Object.keys(merged)) {
    if (!src.aliasOf(k) || k in overrides || k in ground) continue;
    const v = follow(src.rawDecl[k]);
    if (v !== undefined) merged[k] = v;
  }
  return merged;
}

/**
 * The value-following half, bound to a defaults map so a token a palette omits still resolves.
 *
 * ⚠ A RESOLVER THAT WALKS ALIASES HAS FOUR WAYS TO RETURN A PLAUSIBLE WRONG COLOUR — the wrong
 * palette's copy of a re-declared token, a chain that stops one hop early, a mix in the wrong space,
 * and a mix whose weights are swapped. Every one produces a confident number, which is why the
 * suite's `R` section exercises all four before any real palette is read through it.
 */
export function paletteResolver(rawDecl: Record<string, string>) {
  /** The raw declaration a name resolves to, following `var()` through the palette then the
   *  defaults. Returns `undefined` when nothing declares it, so an unfollowable value stays
   *  UNCOMPUTABLE rather than becoming a guess. */
  const rawIn = (pal: Palette, name: string, depth = 0): string | undefined => {
    const v = pal[name] ?? rawDecl[name];
    if (v === undefined || depth > 8) return v;
    const m = /^var\(\s*--color-([a-z0-9-]+)\s*\)$/.exec(v.trim());
    return m ? rawIn(pal, m[1], depth + 1) : v;
  };

  /** A value that may be a var(), a color-mix() or a literal, reduced to a raw literal string. */
  const deref = (pal: Palette, value: string, depth = 0): string | null | undefined => {
    if (depth > 8) return null;
    const v = value.trim();
    const m = /^var\(\s*--color-([a-z0-9-]+)\s*\)$/.exec(v);
    if (m) return rawIn(pal, m[1], depth + 1);
    return v;
  };

  /** `color-mix(in oklch, A P%, B)` — interpolated in OKLCH, which is the space the declaration
   *  names. Mixing in sRGB would return a plausible different colour, so the space is honoured
   *  rather than approximated. Hue takes the shorter arc, as CSS specifies. */
  const mixIn = (pal: Palette, raw: string, depth: number): Rgb | null => {
    /* ⚠ THE PERCENTAGE MAY BE A var(), AND REQUIRING A LITERAL MADE SEVEN ROWS UNCOMPUTABLE. The
     * dark ladder's rungs became `--dk-*` knobs so a palette can answer per semantic band, and this
     * pattern demanded digits — so P1 correctly refused every dark role rather than guessing. A
     * refusal is the right failure and it is still a failure; the reader had to learn the form. */
    const m = /^color-mix\(\s*in\s+oklch\s*,\s*(.+?)\s+(var\(\s*--[a-z0-9-]+\s*\)|[\d.]+%)\s*,\s*(.+?)\s*\)$/.exec(raw.trim());
    if (!m) return null;
    const a = oklchOf(deref(pal, m[1], depth + 1)), b = oklchOf(deref(pal, m[3], depth + 1));
    if (!a || !b) return null;
    const pctRaw = /^var\(/.test(m[2])
      ? pal[`__${/--([a-z0-9-]+)/.exec(m[2])?.[1] ?? ""}`]
      : m[2];
    const pct = Number(String(pctRaw ?? "").replace("%", "").trim());
    if (!Number.isFinite(pct)) return null;
    const wa = pct / 100, wb = 1 - wa;
    let dh = b.H - a.H;
    if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    return oklchToRgb(a.L * wa + b.L * wb, a.C * wa + b.C * wb, a.H + dh * wb);
  };

  /** One token of one palette, as bytes, or null when it genuinely cannot be followed. */
  const rgbIn = (pal: Palette, name: string): Rgb | null => {
    const raw = rawIn(pal, name);
    if (raw === undefined) return null;
    if (/^color-mix\(/.test(raw.trim())) return mixIn(pal, raw, 0);
    return parseColor(raw);
  };

  /** A palette with every token reduced to bytes, so `report` parses literals rather than
   *  expressions. A token that cannot be followed keeps its raw value, so the row still reports
   *  UNCOMPUTABLE rather than silently vanishing. */
  const resolvedPalette = (pal: Palette): Palette => {
    const out: Palette = {};
    for (const k of Object.keys(pal)) {
      if (k.startsWith("__")) continue;
      const v = rgbIn(pal, k);
      out[k] = v ? hexOf(v) : pal[k];
    }
    return out;
  };

  /**
   * A palette with every token as an OKLCH literal — the AUTHORED form, for publication.
   *
   * ⚠ THIS IS A SECOND OUTPUT, NEVER A REPLACEMENT FOR `resolvedPalette`. `report` parses literals
   * and every contrast figure on this site comes from the byte form above. Two resolutions of one
   * palette is exactly the second-spelling hazard this file is written against, so the two are
   * bound by construction rather than by care: an authored value that does not re-parse to the
   * SAME BYTES the byte form produced is refused by `oklchLiteralOf` below. A published colour and
   * a measured colour therefore cannot come apart.
   *
   * ⚠ AND AN ALREADY-OKLCH TOKEN IS COPIED VERBATIM, WHICH IS THE POINT RATHER THAN AN
   * OPTIMISATION. Measured across the nine palettes, 47 of 50 tokens on a light palette are
   * authored in OKLCH. Round-tripping them through bytes turns `oklch(56% 0.14 42)` into
   * `oklch(56.02% 0.1399 41.97)` — a different string for the same colour, which publishes noise
   * as if it were precision.
   *
   * ⚠ IT ALSO CARRIES THE ALPHA, AND THAT IS A DEFECT FIX RATHER THAN A FEATURE. Five tokens per
   * palette are authored `oklch(... / 0.74)`. The byte form drops alpha by design — callers
   * composite explicitly through `over()` — so a copied block handed a stranger OPAQUE smoke where
   * this site draws translucent smoke. Verbatim is what returns it.
   */
  const authoredPalette = (pal: Palette): Palette => {
    const out: Palette = {};
    for (const k of Object.keys(pal)) {
      if (k.startsWith("__")) continue;
      const raw = rawIn(pal, k);
      /* Unfollowable keeps its raw value, the same posture `resolvedPalette` takes, so the token
         surfaces as an alias a consumer can see rather than vanishing into a plausible colour. */
      if (raw === undefined) { out[k] = pal[k]; continue; }
      if (/^\s*oklch\(/i.test(raw)) { out[k] = raw.trim(); continue; }
      const bytes = rgbIn(pal, k);
      out[k] = bytes ? (oklchLiteralOf(bytes) ?? raw.trim()) : raw.trim();
    }
    return out;
  };

  return { rawIn, deref, mixIn, rgbIn, resolvedPalette, authoredPalette };
}

/**
 * Bytes as an OKLCH literal that re-parses to those exact bytes.
 *
 * ⚠ THE ROUND TRIP IS ASSERTED, NOT ASSUMED, AND THE PRECISION IS FOUND RATHER THAN CHOSEN. This
 * file already records the defect: a search reported margins for values that were outside sRGB,
 * because the overshoot was computed on the unrounded number and the ROUNDED STRING was what
 * shipped. The rule that came out of it is measure through the string that gets written — so this
 * formats, re-parses its own output through `parseOklch`, and escalates decimals until the bytes
 * come back identical.
 *
 * Returns null when no precision in range reproduces the bytes, so a caller keeps the raw value
 * rather than publishing a colour half a byte away from the one that paints. Measured across all
 * nine palettes and every non-OKLCH token, the first precision always sufficed and null never
 * occurred — which is a reason to keep the guard rather than to drop it.
 */
export function oklchLiteralOf(rgb: Rgb): string | null {
  const target = rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))));
  const o = rgbToOklch(target as Rgb);
  for (const p of [2, 3, 4, 5]) {
    const css = `oklch(${(o.L * 100).toFixed(p - 1)}% ${o.C.toFixed(p + 1)} ${o.H.toFixed(p - 1)})`;
    const back = parseOklch(css);
    if (back && back.every((c, i) => Math.round(c) === target[i])) return css;
  }
  return null;
}

/** sRGB bytes back to OKLCH — the inverse of `oklchToRgb`, needed because a mix operand may be any
 *  colour form. Four palettes declare their inks as `rgb()`, so without this every `color-mix` on
 *  them stayed uncomputable and the rows they feed went on being unmeasured. */
export function rgbToOklch([r, g, b]: Rgb): Oklch {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s2 = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s2;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s2;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s2;
  const H = (Math.atan2(Bb, A) * 180) / Math.PI;
  return { L, C: Math.hypot(A, Bb), H: H < 0 ? H + 360 : H };
}

/** A value's OKLCH components, from an oklch literal directly or from any other parseable form. */
export function oklchOf(raw: string | null | undefined): Oklch | null {
  const m = /^\s*oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+\s*)?\)\s*$/.exec(raw ?? "");
  if (m) return { L: m[2] === "%" ? Number(m[1]) / 100 : Number(m[1]), C: Number(m[3]), H: Number(m[4]) };
  const rgb = raw == null ? null : parseColor(raw);
  return rgb ? rgbToOklch(rgb) : null;
}

/** Bytes as a hex literal, clamped — the form `report` parses. */
export function hexOf(v: Rgb): string {
  return "#" + v.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

/**
 * The alpha an authored colour carries, or null when it is opaque or unreadable.
 *
 * ⚠ `parseColor` PARSES ALPHA AND DISCARDS IT, DELIBERATELY — callers composite through `over()`
 * and honouring it there would double-apply it. That is right for measurement and wrong for
 * PUBLICATION, where an opaque copy of a translucent token is a different site. So the alpha is
 * read separately, by the one consumer that needs it, rather than by changing what `parseColor`
 * means to the thirty-odd rows that depend on it.
 */
export function alphaOf(css: string): number | null {
  /* The `%` is CAPTURED rather than sniffed for elsewhere in the string. `oklch(92.0% 0.02 78)`
     contains a percent sign and carries no alpha at all, so any test that looks outside this
     group answers a question about the LIGHTNESS unit and reports it as an alpha unit. */
  const ok = /^\s*oklch\([^/)]*\/\s*([\d.]+)(%?)\s*\)\s*$/.exec(css);
  if (ok) return ok[2] === "%" ? Number(ok[1]) / 100 : Number(ok[1]);
  const hex = /^#([0-9a-fA-F]{4}|[0-9a-fA-F]{8})$/.exec(css.trim());
  if (hex) {
    const h = hex[1];
    return h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : parseInt(h.slice(6, 8), 16) / 255;
  }
  const fn = /^\s*(?:rgba?|hsla?)\([^/)]*[,/]\s*([\d.]+)%?\s*\)\s*$/.exec(css);
  return fn ? Number(fn[1]) : null;
}

/**
 * An sRGB fallback for an authored colour — hex, carrying the alpha when there is one.
 *
 * ⚠ A SIX-DIGIT FALLBACK FOR A TRANSLUCENT TOKEN IS NOT A FALLBACK, IT IS A DIFFERENT COLOUR. Five
 * tokens per palette are authored with alpha, and the byte form drops it. Publishing that as the
 * fallback line would hand a stranger opaque smoke under a label promising equivalence — the exact
 * defect this pair of functions exists to close, arriving inside the repair for it.
 */
export function srgbFallbackOf(bytes: Rgb, authored: string): string {
  const a = alphaOf(authored);
  if (a === null || a >= 1) return hexOf(bytes);
  const byte = Math.max(0, Math.min(255, Math.round(a * 255))).toString(16).padStart(2, "0");
  return hexOf(bytes) + byte;
}

/* ============================================================================================
   THE USAGE MAP — WHICH COLOUR SITS ON WHICH GROUND IN WHICH ROLE.

   ⚠ LIFTED FROM THE GATE UNCHANGED, AND IT BELONGS HERE FOR THE REASON THE GATE'S OWN HEADER
   GIVES: the palette varies per theme and THIS DOES NOT. It is the design's statement about its
   own product, so a page that publishes contrast figures and a gate that refuses palettes must
   read the same one. Two copies of this map is the defect the lift exists to make impossible.

   Every foreground below was confirmed to have public consumers by count before it was written
   down, so no row is invented. The reasoning per row moved with the rows.

   ⚠ AND ONE COMMENT HAD TO BE REWORDED IN TRANSIT, WHICH IS THE COMMENT TRAP ARRIVING AS A SIDE
   EFFECT OF A MOVE RATHER THAN OF AN EDIT. Tailwind scans this file now that it is under `lib`,
   and three comments spelled an accent-text BACKGROUND utility that no markup uses — so the class
   compiled into the PUBLIC bundle purely because prose named it, +58 raw bytes measured in the
   build. The prose did not change meaning; it changed FILE, and the file was newly scanned.
   `css-comment-trap` A5 caught it. Describe such a utility in words here; never spell it.
============================================================================================ */
/* ---- THE USAGE MAP. Which colour sits on which ground in which role. The palette varies per
 * theme; THIS DOES NOT. Every foreground below was confirmed to have public consumers by count
 * before it was written down, so no row is invented. */
const TEXT = (fg: string, bgs: string[], note?: string): UsageRow[] =>
  bgs.map((bg) => ({ key: `${fg} on ${bg}`, fg, bg, min: 4.5, kind: "external", note }));
/* ⚠ A UI ROW NAMES ITS CONSUMER, AND `draws` IS REQUIRED. Three UI rows have existed and ALL THREE
 * WERE FALSE — accent-500's "non-text everywhere else" (the rating chip), ink-400's "never text"
 * (the love readout), and ink-400 again (the next-case rail's eyebrow and link). That is the
 * population, not a sample.
 *
 * ⚠ THE ASYMMETRY IS STRUCTURAL RATHER THAN STATISTICAL. A TEXT row claims a pair IS text and its
 * foreground is drawn, so the claim is checkable against the thing it describes. A UI row in the old
 * form claimed an element is NOT text — a claim about everywhere it is not, which nothing in this
 * map can falsify. So the negative form is gone: a row states WHAT DRAWS IT and ON WHAT GROUND THAT
 * WAS MEASURED, and `Z-ui` fails a row that does not. A fourth row cannot be written in the old
 * shape by someone who has not read this. */
const UI = (fg: string, bgs: string[], draws?: string): UsageRow[] =>
  bgs.map((bg) => ({ key: `${fg} on ${bg} (non-text)`, fg, bg, min: 3.0, kind: "external", draws }));

export const USAGE: readonly UsageRow[] = [
  /* ⚠ `cream-200` JOINED ink-800's ROW IN #379, WITH A CONSUMER BEHIND IT. `.blog-plate` draws its
     text on a `cream-100 -> cream-200` gradient, so the DARKER end is a real text-on-ground pair
     that this map did not name — the plate had never rendered (every post carried a hero), so the
     pair had no consumer to be counted until #376 unset two. Measured across all five palettes
     before adding: 12.87 / 12.45 / 12.66 / 11.76 / 11.63, worst margin +7.13. */
  /* ⚠ `ink-950`, `ink-600` AND `accent-600` HAD NO TEXT ROWS' WORTH OF CONSUMERS — THE ROWS ARE
     DELETED AND THE ABSENCE IS ASSERTED INSTEAD (Q1). Censused across the public tree, as a Tailwind
     `text-*` utility, a JSX `color:` and a `color:` declaration in globals.css: ink-950 = 0,
     ink-600 = 0, accent-600 = 0. A floor enforced on an empty set is a pass nobody should be
     reassured by, and on the dark palettes these read 1.01 to 1.66 against grounds nothing paints
     them on.

     ⚠ `ink-800` KEEPS ITS LIGHT GROUNDS AND LOSES `cream-200`. Its one consumer is `.blog-plate
     span`, and the plate's ground is a `cream-100 -> cream-200` GRADIENT where only cream-200
     remaps. On a dark palette that runs near-white to near-black and NO foreground clears both ends
     — ink-800 measures 14.12 / 1.01, text-body 1.79 / 7.80. Choosing a role would be choosing which
     end to fail on, so the plate is boarded as a SURFACE question and this row stops asserting a
     pair whose ground is itself broken.

     ⚠ AND THE CODE DID NOT MATCH THIS COMMENT UNTIL NOW, WHICH IS THE WHOLE REASON P2 WAS RED. The
     paragraph above was written with the removal reasoned out and `cream-200` STAYED IN THE ARRAY —
     prose and data in one file, looking like one claim and being two. It cost a branch that could not
     be merged, and a report that named FOUR consumers when the pair has ONE: the four are sites
     drawing `cream-200` as a GROUND, and this row is about `ink-800` drawn as TEXT on it, which only
     `.blog-plate span` does. Counting the ground's consumers instead of the pair's is the
     wrong-subject error this file names a dozen times.

     `cream-200` KEEPS ITS COVERAGE AS A COLOUR through `text-subtle`'s row below, so `E1` does not
     lose it — which is exactly the distinction shape 2 in this header exists to protect. */
  ...TEXT("ink-800", ["cream-50", "cream-100"]),
  /* ⚠ `ink-600` HAD ZERO CONSUMERS AND NOW HAS ONE, SO ITS BOUNDARY ENTRY IS DELETED AND ITS ROW IS
     BACK. VideoEmbed's caption pill took a FIXED ink because its ground is a fixed rung — the device
     bezel is depiction and stays light, so its foreground must stay light-appropriate too. A
     remapping role on a non-remapping rung was the mix. 7.11 on cream-50, 6.60 on cream-100. */
  ...TEXT("ink-600", ["cream-50", "cream-100"],
    "VideoEmbed's caption pill inside the device bezel — a fixed ink on a deliberately fixed rung."),
  ...TEXT("text-primary", ["canvas"]),
  ...TEXT("text-secondary", ["canvas"]),
  /* ⚠ THE HOME HERO PAINTS THESE THREE ON `surface`, NOT ON `canvas`, AND NOTHING ASSERTED IT. The
     ash hero's ground is `--color-surface` — the base `.hero-ground` rule — while every row above
     names `canvas`, so its name, answer, support, tab labels and connector labels were protected by
     prose alone. `surface` and `canvas` differ on BOTH grounds, so this is a real second pairing
     rather than a rounding into the rows above.

     Found by measuring the hero across all nine palettes rather than by reading: the values pass
     comfortably — text-primary 15.19 to 19.04, text-secondary 7.11 to 8.95, text-subtle 5.35 to
     6.15 — which is exactly why nothing complained and exactly why the rows were missing. A pairing
     that happens to be fine is still unasserted until something says so. */
  ...TEXT("text-primary", ["surface"],
    "the home hero's name (`.hero-name`) and its answer line (`.hero-line`), which paint on the hero ground."),
  ...TEXT("text-secondary", ["surface"],
    "the home hero's support line and the connector-line labels in `.hero-lines`."),
  ...TEXT("text-subtle", ["surface"],
    "the home hero's unselected tab labels, counter units, figure label and scroll cue."),
  /* `text-muted` stood beside this and is deleted — it held the same value, so its rows were a
     second copy of these. One name, one set of rows. */
  /* ⚠ NARROWED TO THE GROUNDS IT STILL MEETS. `cream-50` and `cream-100` left with the bezel repair:
     VideoEmbed's caption pill was the only public element pairing this role with either, and it now
     takes a fixed ink because its ground is a deliberately fixed rung. Censused after the change —
     no public element pairs `text-subtle` or `text-body` with a cream-50/100 ground (Q4). */
  ...TEXT("text-subtle", ["canvas", "cream-200"]),

  /* ⚠ `reference` LOOKS LIKE A SECOND COPY OF `text-secondary`'s ROWS AND IS THE OPPOSITE OF ONE.
     `text-muted` was deleted for exactly that reason — it held the same value, so its rows restated
     these. This role RESOLVES to `text-secondary` on six of seven palettes and diverges on the
     seventh, so a shared row could not express the thing it exists to check. On machine-room the
     teal reads 7.18 on the page ground and 6.38 on the surface against the grey's 5.84 and 5.19.

     THE CONSUMERS ARE `--sheet-mark`'s — the sheet marks, the plate numbers and the corner ticks,
     drawn at 10px and 11px mono, which is why the floor is the text one rather than 3.0. The tick
     is a 1px border on the same token and rides along under the tighter of the two. */
  ...TEXT("reference", ["canvas", "surface"],
    "the sheet marks, plate numbers and corner ticks — every `--sheet-mark` consumer."),

  /* ⚠ `accent-text`'s FOUR ROWS, AND THE CONSUMERS ARE NAMED BECAUSE A ROW WITHOUT ITS SUBJECTS IS
     HOW THE `accent-500` ROW OUTLIVED ITS OWN. That row said "the work-card category tint and the
     process diagram's accent outline"; the outline had migrated to the accent ROLE and the tint did
     not exist, and nothing noticed because nobody could check a claim against a source it did not
     cite. Censused here: 19 `text-accent-text`, 2 `color:` declarations, 4 accent-text BACKGROUND fills (named in words — see below).

     ⚠ AND THE GROUNDS GENUINELY DIFFER, WHICH IS WHY THIS IS FOUR ROWS AND NOT ONE. Three sites read
     as "inherited" until the element painting beneath them was named — `.section-card` paints
     `surface`, so two of the three sit there while the blog's LoveButton has no surface-painting
     ancestor and sits on the page ground. `surface-well` differs from `surface` on BOTH grounds
     (cream-100 against cream-50 on light, on-dark 3% against 8% on dark), so it is a fourth row
     rather than a rounding into the first. */
  ...TEXT("accent-text", ["surface"],
    "HeroCover's label, Stepper's active step (components/case-study/blocks/Stepper.tsx), PullQuote and ClosingLine inside `.section-card`, "
    + "and the Fosfor illustration index — all on the surface the card paints."),
  ...TEXT("accent-text", ["surface-well"],
    "the blog diagram index (components/blog/diagrams/index.tsx) — one site, kept its own row because "
    + "surface-well differs from surface on both grounds."),
  /* `canvas` here is the LIGHT page ground; `usageFor` narrows it to `band-dark` on a dark palette,
     which is the ground LoveButton actually sits on there. */
  ...TEXT("accent-text", ["canvas"],
    "the blog's LoveButton count, which has no surface-painting ancestor and sits on the page."),
  /* ⚠ AND THE FOURTH ROW WAS WRONG, CAUGHT BY M1 ON ITS FIRST RUN. It read
     `UI("accent-text", ["surface"])` for the four accent-text background fills — and M1 refuses a non-text
     claim for a token that IS drawn as text on that same ground, which `accent-text` is at nineteen
     sites. The two rows contradicted each other.

     ⚠ THE REAL ERROR IS THAT A FILL IS A GROUND, NOT A MARK ON ONE. An accent-text fill makes
     accent-text the BACKGROUND; what owes a floor there is whatever text sits ON it, which is a
     different pairing with a different foreground. Asserting the fill against `surface` measured the
     colour against the thing it covers. Left unwritten rather than guessed — naming that pairing
     needs the four fills' own foregrounds censused, which is a separate pass. */
  ...TEXT("on-dark", ["band-dark"]), ...TEXT("on-dark-muted", ["band-dark"]),
  ...TEXT("on-dark-quote", ["band-dark"]),
  /* The case-study h1 on a wide hero. It is the accent in its heading ROLE on ink, so it is
   * computed here rather than excused anywhere — the h1 is the largest text on the page. */
  ...TEXT("accent-on-dark", ["band-dark"]),
  /* Long-form prose. Named in #327 — it is 9.41 on cream-50, between text-primary and
     text-secondary, which is what made it a role rather than a spelling. */
  ...TEXT("text-body", ["canvas"]),

  /* ⚠ NINE CONSUMERS AND NO ROW UNTIL NOW, WHICH IS WHY SIX PALETTES SHIPPED UNCHECKED. `on-accent`
   * is drawn ON `accent-500` at every accent fill — the stepper, two badges, two CTAs, the veil
   * label, the filter chip, the submit button. The pair is as real as any in this map and nobody
   * wrote it down, so CI passed while a manual sweep of a fourth dark palette found it.
   *
   * ⚠ A MISSING ROW IS SILENT BY CONSTRUCTION. This map enumerates pairs SOMEBODY WROTE, so its
   * complement is unknown and cannot be counted — the same shape as the file-type boundary and the
   * negative product claims, arriving in the map's own index.
   *
   * ⚠ AND NO FULL DERIVATION IS AVAILABLE, WHICH IS THE HONEST ANSWER RATHER THAN A TODO. Deriving
   * "every token on every token it is drawn on" needs to know which foregrounds MEET which grounds,
   * and this project has already established that a ground resolving several components away cannot
   * be determined statically. THE RENDER IS THE ONLY ENUMERATOR — a swept page reports actual pairs,
   * which is exactly how this one surfaced. So the map stays hand-written with an unknown
   * complement, and the sweep is what closes the gap rather than a better parser. */
  /* ⚠ THE ROLE, NOT THE RUNG — AND THE REASON IS HERE BECAUSE THE NEXT PERSON WILL MEASURE 3.24 AND
   * REACH FOR THE TOKEN, EXACTLY AS I DID.
   *
   * This row named `accent-500` and reported 3.24 to 3.65 on the four dark palettes once the ground
   * layer let it see them. That number is real and it is a pairing THE DESIGN DELIBERATELY LEFT.
   * `--color-on-accent`'s dark declaration in globals.css records the migration and the figures: on a
   * dark palette `accent` resolves to `accent-on-dark`, a LIGHT accent, and `band-dark` on it
   * measures 6.75 to 7.52. The rung does not remap, so `on-accent` on `accent-500` is dark-on-dark.
   *
   * The live consumers use the ROLE. `ProcessSection` pairs `var(--color-on-accent)` with
   * `background: var(--color-accent)`; `ContactSection`'s button and check icon do the same. Moving
   * the token to rescue the rung pairing would have broken the pairing that ships — which is what
   * that declaration's comment means by "a value decided while one consumer sat on a different rung
   * fits three and breaks the fourth". */
  ...TEXT("on-accent", ["accent"]),

  /* ⚠ THE ROW THAT PROVES THE USAGE MAP IS LOAD-BEARING. accent-500's cream ladder is
     4.7 / 4.48 / 4.07 / 3.43, so it clears the text floor on cream-50 ALONE and misses cream-100
     by 0.02. A palette-only gate — every token against every ground — would refuse the site that
     ships today.

     ⚠ AND THE SENTENCE THAT USED TO FOLLOW WAS FALSE, WHICH IS THE MORE IMPORTANT HALF. It read
     "it is text on ONE step and a non-text mark everywhere else, and that is a fact about the
     product rather than a tolerance in the gate." A CLAIMED PRODUCT FACT, STATED WITH UNUSUAL
     CONFIDENCE, THAT NOTHING CHECKED AND THAT WAS WRONG. `HeroCover`'s rating chip drew accent-500
     as TEXT on cream-200 at 14.4px — failing AA on four of five shipped palettes, on all four case
     studies, since the chip was built.

     ⚠ THE GATE WAS NOT WRONG. IT WAS TOLD THE WRONG THING, in prose, by someone who was certain.
     That is the token-claim shape moved from TOKENS to USAGE, and it is worse: a wrong token claim
     mislabels a colour, a wrong usage claim mislabels WHAT AN ELEMENT IS — and the floor follows
     from that.

     ⚠ THE `ink-400` ROW BELOW CARRIED THE SAME DEFECT AND WAS FOUND BY ENUMERATING RATHER THAN BY
     ACCIDENT. It said "never text"; the blog's love readout drew it at 12.5px, failing on ALL FIVE
     palettes. Two rows in this section, two false product facts, one found by a new palette's
     refusal and one by checking its neighbour.

     Both elements moved rather than the tokens — accent-500 and ink-400 are correct everywhere else
     they land, which is what makes a single-site fix honest rather than a patch. Section M asserts
     every non-text row against a real consumer, so the claim cannot be false again in silence. */
  ...TEXT("accent-500", ["cream-50"], "text on cream-50 only — misses cream-100 by 0.02"),
  /* ⚠ `cream-200` IS DROPPED FROM THIS ROW BECAUSE BOTH DECLARED CONSUMERS HAVE GONE, AND THE NOTE
     IS WHY THE ROW OUTLIVED THEM. The process diagram's outline is `stroke="var(--color-accent)"`
     — the ROLE, migrated — while a comment three lines under it still said it takes `accent-500`.
     THE ROW WAS DERIVED FROM THE COMMENT RATHER THAN FROM THE RENDER, so the comment kept the row
     alive after the code left. The work-card category tint has no `accent-500` in source at all.
     The three live marks (PullQuote's rule, VideoEmbed's dot, HeroCover's dash) sit on an inherited
     ground and on cream-50 — none on cream-200, where the row measured 2.60 against a 3.0 floor on
     a pairing nothing draws. */
  ...UI("accent-500", ["canvas", "cream-100"],
    "PullQuote's rule and HeroCover's dash on the inherited page ground, VideoEmbed's dot on the "
    + "cream-50 pill — marks, not glyphs. Its ONE text consumer is the row above, on cream-50."),
  ...UI("ink-400", ["cream-50", "cream-100", "cream-200"],
    "icon rests — the stepper's inactive dots and the device-shelf marks. NOT the next-case rail, "
    + "which drew it as text at 3.36 to 4.32 until the eyebrow took text-subtle and the link text-secondary."),

  /* ⚠ INTERNAL. THE GROUND LADDER IS THIS DESIGN'S OWN NUMBER, NOT WCAG'S. cream-50/cream-100 sits
     at exactly 1.05, which is where the floor came from, so a theme with a different ladder may
     legitimately need it retuned — and that is the whole reason the verdict is typed. */
  ...[["cream-50", "cream-100"], ["cream-100", "cream-200"], ["cream-200", "cream-300"],
      ["cream-300", "canvas"]].map(([a, b]) => ({
    key: `ground step ${a} / ${b}`, fg: a, bg: b, min: 1.05, kind: "internal" as const,
  })),
];

/**
 * The map as it applies to one palette's page ground.
 *
 * ⚠ IT TAKES THE GROUND TOKEN, NOT THE THEME NAME, because this leaf cannot import the theme
 * registry — see the header. The caller reads `GROUND_TOKEN[THEME_GROUND[name]]` and passes the
 * answer, which also makes the substitution visible at the call site rather than buried here.
 *
 * ⚠ AND THE ROWS NAMING `canvas` ARE REBOUND RATHER THAN DROPPED. `canvas` IS the page ground on a
 * light palette and is NOT on a dark one, where `band-dark` is — so a dark palette measured against
 * `canvas` is measured against a token it never paints.
 */
export function usageFor(pageGround: string): readonly UsageRow[] {
  if (pageGround === "canvas") return USAGE;
  return USAGE.map((row) =>
    row.bg === "canvas" ? { ...row, bg: pageGround, key: `${row.fg} on ${pageGround}` } : row);
}
