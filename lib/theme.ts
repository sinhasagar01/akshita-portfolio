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
   ⚠ `cream-verify` IS A VERIFICATION FIXTURE, NOT A DESIGN. IT IS DELETED WHEN THEME TWO LANDS.

   It exists because a reader with ONE possible value exercises nothing. The lookup always hits,
   the fallback never fires, and the whole mechanism reads as authoritative while proving that a
   constant equals itself. This repo has deleted that shape four times rather than document it.

   The twin is byte-identical to `cream` in every measured value and differs only in its name, so
   two keys exist, the lookup is a real lookup, and the fail-closed path has something to be
   distinguished FROM. It costs four lines and it converts an untested mechanism into a tested one.

   ⚠ THE DELETION TRIGGER IS MACHINE-ENFORCED, NOT A NOTE. `ralph/tests/theme.mjs` asserts there
   are EXACTLY TWO entries. The moment a real second theme is added the count is three and the gate
   fails, so whoever adds theme two must delete the twin in the same commit. A fixture that
   outlives its purpose becomes a third theme nobody meant to ship, and a comment asking politely
   would not have stopped that.

   ⚠ AND IT IS NOT SELECTABLE. `selectableThemes()` below excludes it, so the sanitizer refuses it
   and an author cannot publish it by accident. It is resolvable, which is what the gate needs, and
   unpublishable, which is what keeps it a fixture.
============================================================================================ */
export const VERIFY_THEME = "cream-verify";

/** Every name the resolver accepts. Adding a real theme here means deleting the twin — see above. */
export const THEME_NAMES = [DEFAULT_THEME, VERIFY_THEME] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

/** The names an author may actually set. The twin is resolvable but never selectable. */
export function selectableThemes(): string[] {
  return THEME_NAMES.filter((name) => name !== VERIFY_THEME);
}

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
