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

/** Parse `oklch(92.0% 0.022 78)`. Returns null for anything else, so an unparseable entry surfaces
 *  as an uncomputable ROW rather than as a silent zero. */
export function parseOklch(value: string): Rgb | null {
  const m = /^\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)\s*$/.exec(value);
  return m ? oklchToRgb(Number(m[1]) / 100, Number(m[2]), Number(m[3])) : null;
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
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as Rgb;
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(v);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as Rgb;
  return null;
}

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

export type Verdict = "SHIPPABLE" | "REFUSED_EXTERNAL" | "REFUSED_INTERNAL" | "UNCOMPUTABLE";

export type Report = {
  verdict: Verdict;
  rows: RowResult[];
  failures: RowResult[];
  /** Failure keys split by floor kind, so a caller can say WHAT the owner does next. */
  external: string[];
  internal: string[];
  /** Rows whose tokens the palette does not define. Never silently skipped — see UNCOMPUTABLE. */
  uncomputable: string[];
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
 */
export function report(palette: Palette, usage: readonly UsageRow[]): Report {
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
    : external.length ? "REFUSED_EXTERNAL"
    : internal.length ? "REFUSED_INTERNAL"
    : "SHIPPABLE";

  return { verdict, rows, failures, external, internal, uncomputable };
}
