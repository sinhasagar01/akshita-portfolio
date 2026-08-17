/* Shared inline values for the case-study template. Single source of truth so the
   warm hairline, glow, and shelf gradient do not drift across block components.
   These map the panels' raw values onto our theme tokens (the "adapt" decision). */

/** Warm hairline — spec `border-ink-950/8` (panel `--line rgba(120,90,60,.14)`). */
export const LINE = "color-mix(in oklch, var(--color-ink-950) 8%, transparent)";

/** Softer hairline for inner dividers — panel `--line2`. */
export const LINE_SOFT = "color-mix(in oklch, var(--color-ink-950) 6%, transparent)";

/* ⚠ `GLOW` WAS HERE AND IS DELETED, BECAUSE ITS LAST THREE CONSUMERS LEFT IN ONE UNIT. It was the
   accent at 10% and it coloured all three case-study watermarks — the section word, the feature
   numeral and the pinned story's numeral. All three became the STAMP device, which takes `etch`, the
   pigment role built for an ink at an alpha.

   ⚠ AND IT IS DELETED RATHER THAN LEFT, WHICH IS THIS RECORD'S OWN RULING ABOUT `accent-400`: ZERO
   CONSUMERS IS A REASON TO DELETE A THING, NOT TO KEEP IT AND EXEMPT IT. That token survived review
   for as long as its exemption did, and comments describing it as load-bearing were the only thing
   referencing it. The two comments that still name `GLOW` — in `GlowWord` and `SheetStamp` — speak of
   it in the past tense on purpose, because the comparison is why `etch` was the right replacement. */

/** Highlighted card border — spec `the accent edge at 35%` (panel `.icard.hl`). */
export const ACCENT_RING = "color-mix(in oklch, var(--color-accent-500) 35%, transparent)";

/** Pedestal gradient — panel `linear-gradient(180deg,#FBF6EE,#F3EADB)`. */
export const SHELF_GRADIENT =
  "linear-gradient(180deg, var(--color-cream-50), var(--color-cream-200))";
