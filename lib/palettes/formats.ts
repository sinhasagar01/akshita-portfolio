/* ============================================================================================
   THE THREE COPY FORMATS. THE FIRST THING ON THIS PAGE WHOSE OUTPUT LEAVES IT.

   ⚠ EVERY FIGURE HERE COMES FROM THE REPORT THE PANEL RENDERS, NEVER FROM A SECOND CALCULATION.
   These functions take a `PaletteCompatibility` and format it. They do not import `contrastRatio`,
   they do not import `report`, and they compute no colour arithmetic of any kind — because a second
   spelling here does not merely disagree with the panel, it ships WRONG NUMBERS UNDER SOMEBODY
   ELSE'S NAME, in a file they paste into their own project.

   `ralph/tests/palette-formats.mjs` asserts that as an identity rather than trusting this
   paragraph: every ratio in every block must be `formatRatio` of a row the report produced, one
   occurrence per row. A row that compares them can fail; a comment saying they agree cannot.

   ---- ⚠ THE VALUES ARE RESOLVED LITERALS, AND THIS IS THE MOST LIKELY WAY THE FEATURE SHIPS WRONG

   `--color-surface: var(--color-cream-50)` pasted into a stranger's project resolves to NOTHING.
   That is #500's defect pointed outward: there it made a gate read cream's roles for four palettes,
   here it would hand somebody a stylesheet of dead declarations that looks complete.

   `paletteCompatibility()` already flattens every token through `resolvedPalette`, measured at zero
   unresolved across all nine palettes — and `assertLiteral` below REFUSES to emit one anyway,
   because "it is already resolved upstream" is a property of another file that this file cannot see.

   ---- ⚠ THE VALUES ARE OKLCH, AND THE HEX THAT USED TO BE HERE SHIPPED A DIFFERENT SITE ----------

   This file emitted six-digit hex for every token until #515. The page argues that OKLCH is what
   makes a palette re-themeable and then handed a stranger frozen sRGB, which is the page
   contradicting itself in the one artefact that leaves it.

   ⚠ AND IT WAS NOT ONLY A NOTATION DEFECT. Five tokens per palette — the four smoke stops and
   `glow-paper` — are authored `oklch(... / 0.74)`. `resolvedPalette` drops alpha BY DESIGN, because
   `report` composites explicitly through `over()` and honouring an embedded alpha there would
   double-apply it. Correct for measurement, and it meant a copied block drew those five OPAQUE.
   Somebody pasting cream got a site whose artwork grounds are solid where this one's are washes.

   So the fallback carries alpha as an eight-digit hex, and the values carry it as authored. A
   six-digit fallback for a translucent token is not a fallback, it is a different colour under a
   label promising equivalence.

   ---- ⚠ THE FALLBACK IS AFTER THE VALUES AND INSIDE `@supports`, WHICH IS A CHOICE ---------------

   Redeclaring hex FIRST and OKLCH SECOND is the shorter progressive-enhancement idiom and it puts
   the frozen sRGB at the top of the block a reader's eye lands on — the page's own argument,
   inverted, in the artefact. `@supports not` reads later, costs one nesting level, and is the only
   form where the authored values are the first thing in the file.

   ---- ⚠ JSON HAS NO COMMENT SYNTAX, SO THE REPORT IS DATA THERE — SAID, NOT DROPPED -------------

   CSS and Tailwind carry the report as a comment block. JSON cannot, and the failure mode to avoid
   is a format that quietly carries LESS than the others, which nobody notices until they rely on it.

   So JSON carries the report as a first-class `contrast` array and carries MORE than the comments
   do: every row's pair, ratio, floor and floor KIND, machine-readable. The comment forms state the
   floor only when a row misses it; the JSON states it always. Nothing is dropped in either
   direction, and the panel says so above the block rather than leaving a reader to notice.
============================================================================================ */
import type { PaletteCompatibility } from "@/lib/palettes/compatibility";

/* ⚠ ONE FORMATTER, SHARED WITH THE PANEL. If the panel rounds to two places and a block rounds to
 * one, the page shows a stranger a different number than it hands them — and that divergence is
 * exactly what the identity assertion is written to catch. Both call this. */
export function formatRatio(ratio: number): string {
  return ratio.toFixed(2);
}

/** The tokens a copied palette carries, in a stable order so two copies diff cleanly. */
export function tokenEntries(p: PaletteCompatibility): [string, string][] {
  return Object.keys(p.tokens).sort().map((k) => [k, p.tokens[k]]);
}

/* ⚠ REFUSES AN ALIAS RATHER THAN TRUSTING ONE. See the header — an unresolved value pasted into
 * somebody's project is a dead declaration that looks like a live one. */
function assertLiteral(name: string, value: string): string {
  if (/var\(|color-mix\(/.test(value)) {
    throw new Error(
      `token "${name}" would be copied as "${value}", which is an ALIAS rather than a literal. `
      + `A stranger pasting it gets a declaration that resolves to nothing. Resolve it before it `
      + `reaches a copy format.`
    );
  }
  return value;
}

/** The contrast report, one line per pair, as it appears inside a comment block. */
function reportLines(p: PaletteCompatibility): string[] {
  return p.rows.map((r) => {
    const miss = r.got < r.min ? `  <- below ${r.min}` : "";
    return `  ${r.key.padEnd(34)} ${formatRatio(r.got)}${miss}`;
  });
}

function header(p: PaletteCompatibility): string[] {
  return [
    `${p.name} — a palette from akshitas.com`,
    `${p.groundClass} ground. Its counterpart is ${p.counterpart}.`,
    "",
    "Values are OKLCH, as authored. Lightness carries the hierarchy, chroma the energy,",
    "hue the identity — so retheming this block is a change to the third number.",
    "",
    `measured contrast, ${p.rows.length} pairs the design actually draws`,
    ...reportLines(p),
  ];
}

/** The authored OKLCH declarations, one per token, at a given indent. */
function declarations(p: PaletteCompatibility, indent: string): string {
  return tokenEntries(p)
    .map(([k, v]) => `${indent}--color-${k}: ${assertLiteral(k, v)};`)
    .join("\n");
}

/**
 * The generated sRGB block.
 *
 * ⚠ IT SAYS GENERATED, AND THAT WORD IS DOING WORK. A reader who edits the hex and not the OKLCH
 * has changed a colour on exactly the browsers that cannot render the real one, which is the
 * hardest possible place to notice a mistake. The comment names the direction the values flow.
 */
function fallbackBlock(p: PaletteCompatibility, selector: string): string {
  const body = Object.keys(p.tokens).sort()
    .map((k) => `    --color-${k}: ${assertLiteral(k, p.fallback[k])};`)
    .join("\n");
  return [
    "",
    "/* sRGB fallback, GENERATED from the values above — do not edit it by hand, and do not treat it",
    "   as the palette. It exists for browsers with no oklch() support and is otherwise unread. The",
    "   eight-digit entries carry the alpha the six-digit form would silently drop. */",
    "@supports not (color: oklch(0% 0 0)) {",
    `  ${selector} {`,
    body,
    "  }",
    "}",
  ].join("\n");
}

/** Plain custom properties, for a project with no Tailwind. */
export function toCss(p: PaletteCompatibility): string {
  return `/*\n${header(p).map((l) => (l ? ` ${l}` : "")).join("\n")}\n*/\n`
    + `:root {\n${declarations(p, "  ")}\n}\n`
    + `${fallbackBlock(p, ":root")}\n`;
}

/**
 * Tailwind v4's `@theme`, which is how this site declares them.
 *
 * ⚠ THE FALLBACK IS A PLAIN `:root`, NOT A SECOND `@theme`, AND THAT IS NOT A STYLE CHOICE.
 * `@theme` is a build-time construct that also generates the utility classes; nesting it inside
 * `@supports` is not something Tailwind processes. A later `:root` overrides the custom properties
 * those utilities read, which is the whole mechanism, so the plain selector is the one that works.
 */
export function toTailwind(p: PaletteCompatibility): string {
  return `/*\n${header(p).map((l) => (l ? ` ${l}` : "")).join("\n")}\n*/\n`
    + `@theme {\n${declarations(p, "  ")}\n}\n`
    + `${fallbackBlock(p, ":root")}\n`;
}

/**
 * JSON, with the report as DATA rather than as a comment it cannot hold.
 *
 * ⚠ IT CARRIES MORE THAN THE COMMENT FORMS, NOT LESS. Every row keeps its floor and the KIND of
 * floor — `external` is WCAG and does not move, `internal` is this design's own and a different
 * ladder may legitimately retune it. A consumer can therefore re-check the palette rather than
 * taking these numbers on trust, which is the whole point of publishing them.
 *
 * ⚠ AND THE `srgbFallback` KEY IS NAMED FOR WHAT IT IS, because a JSON consumer has no comment to
 * read. `tokens` is the palette; `srgbFallback` is derived from it. A key called `hex` sitting
 * beside a key called `tokens` would leave a machine free to pick either.
 */
export function toJson(p: PaletteCompatibility): string {
  return JSON.stringify(
    {
      name: p.name,
      ground: p.groundClass,
      counterpart: p.counterpart,
      verdict: p.verdict,
      contrast: p.rows.map((r) => ({
        pair: r.key,
        ratio: Number(formatRatio(r.got)),
        floor: r.min,
        kind: r.kind,
      })),
      tokens: Object.fromEntries(tokenEntries(p).map(([k, v]) => [k, assertLiteral(k, v)])),
      srgbFallback: Object.fromEntries(
        Object.keys(p.tokens).sort().map((k) => [k, assertLiteral(k, p.fallback[k])])
      ),
    },
    null,
    2
  ) + "\n";
}

export type CopyFormat = "css" | "tailwind" | "json";

export const FORMATS: { id: CopyFormat; label: string; ext: string; mime: string }[] = [
  { id: "css", label: "CSS", ext: "css", mime: "text/css" },
  { id: "tailwind", label: "Tailwind", ext: "css", mime: "text/css" },
  { id: "json", label: "JSON", ext: "json", mime: "application/json" },
];

export function render(p: PaletteCompatibility, format: CopyFormat): string {
  if (format === "css") return toCss(p);
  if (format === "tailwind") return toTailwind(p);
  return toJson(p);
}
