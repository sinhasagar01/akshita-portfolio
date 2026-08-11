/* ============================================================================================
   THE CONTRAST REPORT FOR EVERY PALETTE, COMPUTED AT BUILD FROM EACH PALETTE'S OWN TOKENS.

   ⚠ GENERATED, NEVER CHECKED IN. A committed table is a stale manual boolean with more digits —
   it is right on the day it is written and silently wrong from the next palette tune onward, which
   is exactly what the ruling behind this page forbade. Nothing here is stored; the numbers exist
   only for the length of a build.

   ⚠ AND IT CALLS THE GATE'S RESOLVER RATHER THAN A SECOND ONE. `report`, `usageFor`, `layerPalette`
   and `paletteResolver` all come from `lib/theme-contrast.ts`, which is the same code
   `ralph/tests/theme-contrast.mjs` refuses palettes with. A page that publishes contrast figures
   and a gate that refuses palettes must not be able to disagree, and two implementations of one
   arithmetic is how they would.

   ---- ⚠ THIS MODULE MAY USE `@/` IMPORTS AND THE LEAF MAY NOT --------------------------------

   `lib/theme-contrast.ts` and `lib/theme.ts` are loaded RAW by ralph under
   `--experimental-strip-types`, so they cannot import each other in any spelling `tsc` also
   accepts. THIS file is never loaded that way — it runs only inside Next's build — so it is the
   right place for the composition those two cannot perform on each other, and it is the reason the
   leaf takes the stylesheet text and the ground class as arguments.

   ---- ⚠ THE UNCOMPUTABLE SET IS EMPTY, AND THERE IS DELIBERATELY NO MACHINERY FOR IT ----------

   Measured through this exact path: 9 palettes x 30 rows = 270 comparisons, 9 of 9 SHIPPABLE,
   ZERO uncomputable. So there is no "pairs we could not compute" list, no empty container, and no
   unbuilt branch for one to enter silently — a container with no members is the shape this repo
   deletes rather than ships.

   ⚠ WHAT REPLACES IT IS A THROW, AND THAT IS THE POINT. If a pair ever stops resolving, the BUILD
   FAILS by name rather than the page rendering a blank ratio nobody notices. `report()` already
   ranks UNCOMPUTABLE above SHIPPABLE for the same reason — a skipped row is a pair nobody knows is
   unchecked. This is that rule at the consumer.
============================================================================================ */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  readPaletteSource, layerPalette, paletteResolver, report, usageFor,
  type Palette, type RowResult, type Verdict,
} from "@/lib/theme-contrast";
import {
  THEME_NAMES, VERIFY_THEME, DEFAULT_THEME, THEME_GROUND, GROUND_TOKEN, THEME_COUNTERPART,
  type GroundClass,
} from "@/lib/theme";

/** One palette's compatibility, as the console renders it. */
export type PaletteCompatibility = {
  name: string;
  groundClass: GroundClass;
  /** The palette's counterpart in the opposite ground class — authored, see `THEME_COUNTERPART`. */
  counterpart: string;
  verdict: Verdict;
  /** Every pair the design draws, with the ratio it measures on THIS palette. */
  rows: { key: string; fg: string; bg: string; min: number; kind: string; got: number }[];
  /** The palette's tokens, resolved to literals — what the copy block emits. */
  tokens: Palette;
};

/** Every real palette. The verification twin is excluded because it is never shown. */
export const PALETTE_SLUGS: string[] = THEME_NAMES.filter((n) => n !== VERIFY_THEME);

/**
 * Compute every palette's report, at build.
 *
 * ⚠ THE STYLESHEET IS READ FROM DISK, WHICH IS SAFE ONLY BECAUSE EVERY CONSUMER IS PRERENDERED.
 * `/palettes` and `/palettes/[slug]` are static with `dynamicParams = false`, so this runs during
 * `next build` where the repo is present, and never in a request. A dynamic consumer would be
 * reading a source file at runtime, which is a different and worse thing — check that before
 * adding one.
 */
export function paletteCompatibility(): PaletteCompatibility[] {
  const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
  const source = readPaletteSource(css);
  const { resolvedPalette } = paletteResolver(source.rawDecl);

  return PALETTE_SLUGS.map((name) => {
    const groundClass = THEME_GROUND[name];
    const tokens = resolvedPalette(
      layerPalette(source, name, { defaultTheme: DEFAULT_THEME, groundClass })
    );
    const result = report(tokens, usageFor(GROUND_TOKEN[groundClass]));

    /* ⚠ THE THROW THAT REPLACES THE MACHINERY. Empty today across all 270 comparisons; the day it
     * is not, this stops the build with the pair named instead of the page drawing a blank. */
    if (result.uncomputable.length) {
      throw new Error(
        `palette "${name}" has ${result.uncomputable.length} uncomputable row(s), so its contrast `
        + `report would be published with holes: ${result.uncomputable.join(", ")}. `
        + `A pair that stops resolving is a pair nobody knows is unchecked — fix the token or the `
        + `usage map rather than rendering a blank ratio.`
      );
    }

    return {
      name,
      groundClass,
      counterpart: THEME_COUNTERPART[name],
      verdict: result.verdict,
      rows: result.rows.map((r: RowResult) => ({
        key: r.key, fg: r.fg, bg: r.bg, min: r.min, kind: r.kind, got: r.got as number,
      })),
      tokens,
    };
  });
}
