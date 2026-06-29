/* Shared inline values for the case-study template. Single source of truth so the
   warm hairline, glow, and shelf gradient do not drift across block components.
   These map the panels' raw values onto our theme tokens (the "adapt" decision). */

/** Warm hairline — spec `border-ink-950/8` (panel `--line rgba(120,90,60,.14)`). */
export const LINE = "color-mix(in oklch, var(--color-ink-950) 8%, transparent)";

/** Softer hairline for inner dividers — panel `--line2`. */
export const LINE_SOFT = "color-mix(in oklch, var(--color-ink-950) 6%, transparent)";

/** Faint watermark / glow — panel `rgba(181,97,60,.10)` → accent at 10%. */
export const GLOW = "color-mix(in oklch, var(--color-accent-500) 10%, transparent)";

/** Highlighted card border — spec `border-accent-500/35` (panel `.icard.hl`). */
export const ACCENT_RING = "color-mix(in oklch, var(--color-accent-500) 35%, transparent)";

/** Pedestal gradient — panel `linear-gradient(180deg,#FBF6EE,#F3EADB)`. */
export const SHELF_GRADIENT =
  "linear-gradient(180deg, var(--color-cream-50), var(--color-cream-200))";
