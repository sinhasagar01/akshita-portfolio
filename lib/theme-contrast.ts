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
