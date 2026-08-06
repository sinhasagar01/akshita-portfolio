// The theme registry and the fail-closed resolver. The public site's palette becomes a value an
// author sets, and this is the module that decides what that value is allowed to be.
//
// ---- ⚠ THIS FILE IMPORTS NOTHING, AND THAT IS A CONSTRAINT RATHER THAN A STYLE ----------------
//
// `ralph` loads it raw under `node --experimental-strip-types`, which resolves a relative import
// only when the specifier carries the `.ts` extension — and `tsc` rejects that extension unless
// `allowImportingTsExtensions` is on. So a leaf that a gate loads directly cannot import a sibling
// leaf, in either spelling. `lib/studio/three-pane.ts` and `lib/studio/sidebar-width.ts` are under
// the same rule for the same reason.
//
// The consequence is that the theme NAMES appear on three surfaces that cannot see each other:
// here, `THEME_METRICS` in `lib/studio/three-pane.ts`, and `SETTINGS_THEME_VALUES` in
// `lib/studio/site-settings-format.ts`. `ralph/tests/theme.mjs` is what stops them drifting — it
// is the single source of truth by enforcement rather than by import, which is the same posture
// `SITE_SETTINGS_FIELD_ORDER` already takes toward `keystatic.config.ts`.

/** The theme that ships today, and the value every failure resolves to. */
export const DEFAULT_THEME = "cream";

/* ============================================================================================
   ⚠ `cream-verify` IS A PERMANENT CONTROL. DO NOT DELETE IT. ITS PURPOSE DOES NOT EXPIRE.

   ⚠ AND THE PREVIOUS VERSION OF THIS COMMENT SAID THE OPPOSITE, WHICH IS WHY THE CHANGE IS WRITTEN
   HERE RATHER THAN ONLY IN THE RECORD. It shipped as a verification FIXTURE with a deletion
   trigger — "when a real second theme arrives" — because its only job was exercising a reader that
   otherwise had one possible value. That job genuinely expires. The job it acquired does not.

   WHY IT CANNOT BE DELETED. The cross-theme gate compares two builds that differ only in this
   file's value and asserts the rendered output differs ONLY in the `data-theme` attribute. Any
   other diff is a leak — a colour that reached the markup instead of the stylesheet, or a studio
   surface that moved. That assertion needs a theme whose values are byte-identical to the default.

   ⚠ A REAL SECOND THEME CANNOT REPLACE IT, AND THAT IS THE WHOLE ARGUMENT. Under a real palette
   every colour legitimately differs, so the gate would have to ALLOW arbitrary difference — which
   is not an assertion. The control is the only theme that can say "nothing but the attribute".

   SO IT IS DEFINED AS A CLONE OF THE DEFAULT, tracking whatever `cream` becomes rather than
   pinning today's values. And the count assertion moved with it, from "exactly two entries" to
   "the real themes plus EXACTLY ONE twin", so it can neither be dropped nor multiplied.

   ⚠ AND IT IS STILL NOT SELECTABLE. `selectableThemes()` below excludes it, so the sanitizer
   refuses it and an author cannot publish it by accident. That is what answers the original fear —
   a control that outlives its purpose becoming a third theme nobody meant to ship. It is
   resolvable, which is what the gates need, and unpublishable, which is what keeps it a control.
============================================================================================ */
export const VERIFY_THEME = "cream-verify";

/** A real second palette. Cool ground at hue 233, teal accent at 168 — a 155-degree swing from
 *  cream, chosen to TEST the light-ground constraint rather than to sit safely inside it.
 *
 *  ⚠ IT WAS REFUSED TWICE BY `ralph/tests/theme-contrast.mjs` BEFORE IT PASSED, which is the whole
 *  reason that gate was built before any palette existed. Draft 1 failed five external rows, draft
 *  2 failed one, this is draft 3.
 *
 *  ⚠ AND IT SITS ON THE SAME THREE FLOORS CREAM DOES, with essentially no margin. SHIPPABLE and one
 *  rounding away from not. */
export const SECOND_THEME = "harbour";

/** Every name the resolver accepts. A new real theme is ADDED here; the twin stays. */
export const THEME_NAMES = [DEFAULT_THEME, SECOND_THEME, VERIFY_THEME] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

/* ============================================================================================
   ⚠ RESOLVABLE BUT NOT SELECTABLE, AND THE TWO ENTRIES ARE HERE FOR DIFFERENT REASONS.

   A theme in this map exists, renders, and is gated — it simply cannot be PUBLISHED. Keeping the
   reason beside the name is the point: "not selectable" with no explanation is indistinguishable
   from an oversight, and the twin already taught us that an unexplained exclusion is what a future
   cleanup deletes.

   `cream-verify` — a permanent control. Never selectable, ever. See its block above.

   ⚠ `harbour` WAS HERE AND IS NOT ANY MORE. It shipped unselectable because the render found 14
   warm colours that no theme could move, and it unholds because 12 of them now do — two were
   NAMED (#327, body copy and the warm hairline) and the watermarks TOOK THE ACCENT TOKEN (#328).
   The cursor and `.ab-tint` stay on the contrast gate's boundary list, with measured reasons
   rather than asserted ones.

   THE CRITERION WAS THE RENDER, NOT THE INSTRUMENT. `SHIPPABLE` was always the narrower claim —
   every token PAIR clears its floor — and it was true of harbour on the day the render showed
   five terracotta watermarks beside two cool ones.
============================================================================================ */
const UNSELECTABLE: Record<string, string> = {
  [VERIFY_THEME]: "permanent verification control — never publishable",
};

/** The names an author may actually set. */
export function selectableThemes(): string[] {
  return THEME_NAMES.filter((name) => !(name in UNSELECTABLE));
}

/** Why a resolvable theme cannot be published, or undefined if it can. */
export function unselectableReason(name: string): string | undefined {
  return UNSELECTABLE[name];
}

/* ============================================================================================
   THE PWA SPLASH GROUND, PER THEME — AND WHY IT LIVES IN JS AT ALL.

   `manifest.webmanifest` is JSON. It cannot hold a `var()`, so the splash colour is the one place
   a theme's ground has to exist as a literal in JavaScript rather than as a token in CSS.

   ⚠ EACH VALUE IS ITS THEME'S `--color-cream-50`, RESOLVED. Not an approximation: the field held
   `#FBF6EE` for years, which is 5 from cream-50 — an approximation of a colour that already had a
   name, spelled out where the name could not reach it. #327's shape, on the last surface that had
   it.

   ⚠ AND AN INSTALLED APP CACHES ITS MANIFEST, SO THE SPLASH CAN LAG THE THEME BY DAYS. That is an
   argument FOR theming it rather than against: the lag means an occasionally-stale ground, and the
   status quo is a ground that is never right after the first theme change. Themed-and-sometimes-
   stale beats never-right. Recorded here so nobody reports the lag as a bug.
============================================================================================ */
export const THEME_SPLASH: Record<string, string> = {
  [DEFAULT_THEME]: "#FEF9F1",
  [SECOND_THEME]: "#F5FBFF",
  /* Byte-identical to the default, like every other value the control holds. */
  [VERIFY_THEME]: "#FEF9F1",
};

/**
 * ⚠ `theme_color` IS DELIBERATELY NOT HERE, AND IT IS NOT AN OVERSIGHT. It tints the Android
 * address bar and the task-switcher card — the site's identity in SOMEONE ELSE'S FRAME. At 20 from
 * every token it is its own near-black rather than a misspelling of one, and a colour on a surface
 * the site does not own does not follow the site's palette. The same test that keeps the case-study
 * mock glows in their products' brand colours.
 *
 * It also has a practical half: an address bar that changes weekly reads as instability rather than
 * refreshment, on the one surface a user sees BEFORE the site loads.
 */
export const BRAND_CHROME_COLOR = "#1c1813";

export function isKnownTheme(raw: unknown): raw is ThemeName {
  return typeof raw === "string" && (THEME_NAMES as readonly string[]).includes(raw);
}

/**
 * Resolve an untrusted theme value to a name the token layer can use.
 *
 * ⚠ FAILS CLOSED TO `cream`, AND SILENTLY. Missing, empty, misspelt, wrong-typed — every one of
 * them resolves to the theme that ships today. The blog's `status` field set this precedent in the
 * other direction (only an explicit `published` reaches `/blog`) and the shared principle is that
 * only a known value is honoured.
 *
 * ⚠ THE ASYMMETRY IS DELIBERATE — LOUD IN THE STUDIO, SILENT ON THE PUBLIC SITE. This function is
 * the public half and says nothing, because a visitor must never see an unthemed page. The loud
 * half is `sanitizeSiteSettingsPatch`, which REJECTS an unknown theme at write time, so an author
 * is told immediately rather than left wondering why their choice did nothing. An unknown value
 * can therefore only arrive by hand-editing the YAML, and that is the case this fallback is for.
 */
export function resolveTheme(raw: unknown): ThemeName {
  return isKnownTheme(raw) ? raw : DEFAULT_THEME;
}
