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
/* ⚠ THEME THREE. Registering it here is not bookkeeping — `theme` J2 FAILS on a palette that exists
 * in `globals.css` and not in `THEME_NAMES`, because until #372 a whole 35-token block could enter
 * the stylesheet and ralph stayed green. Every theme check enumerated from this list or a hardcoded
 * pair, and none read the stylesheet to ask what was actually declared. */
export const THIRD_THEME = "orchid";

/* ⚠ THEMES FOUR AND FIVE, AND THE CEILING THEY SIT ON. Five were asked for and TWO IS WHAT THE
 * GEOMETRY ALLOWS: seven hues on a circle are 51.4 degrees apart at perfect spacing, so seven
 * palettes and `theme-contrast` D12's 60 degree ground floor cannot both be true at ANY placement.
 * With cream, harbour and orchid already placed unevenly, exactly two more fit — and both of these
 * land EXACTLY on the floor against a neighbour (cerise 60.0 from orchid, fern 60.0 from cream).
 *
 * ⚠ THE PALETTE COUNT AND THE SEPARATION FLOOR ARE ONE DECISION, NOT TWO. A sixth real theme is
 * not a matter of deriving another good palette; it requires lowering D12's floor, and that is a
 * choice about how distinct two themes must be. Nothing discovers this except counting — four
 * candidates were measured first and refused as three unrelated hue collisions, which is a diff
 * somebody tunes three hues in response to.
 *
 * `cerise` was briefed as a vermilion. h4 at shippable chroma resolves to #d12d6b, a raspberry —
 * the warm orange-red region is claimed by CREAM'S OWN ACCENT at h42, so a palette wedged between
 * orchid and cream cannot hold one. The name follows the colour. */
export const FOURTH_THEME = "cerise";
export const FIFTH_THEME = "fern";

/* ⚠ THE FIRST DARK PALETTE, AND THE FIRST MEMBER OF A SECOND GROUND CLASS. It does not compete for
 * hue with the light five — measured, hue changes the difference between a light and a dark ground
 * by 0.1% — so `theme-contrast` D12 skips those pairs and section L's dark band owns it. Its h250
 * sits 17 degrees from harbour's ground, which is a collision only under a floor calibrated for a
 * class it is not in. */
export const SIXTH_THEME = "sapphire";

/** Every name the resolver accepts. A new real theme is ADDED here; the twin stays. */
export const THEME_NAMES = [DEFAULT_THEME, SECOND_THEME, THIRD_THEME, FOURTH_THEME, FIFTH_THEME, SIXTH_THEME, VERIFY_THEME] as const;


/* ============================================================================================
   ⚠ EVERY PALETTE DECLARES ITS GROUND CLASS, AND IT IS REQUIRED RATHER THAN DEFAULTED.

   A palette IS light or dark. That is a fact about the palette, not a consequence of one of its
   tokens — and `ralph/tests/theme-contrast.mjs` section L classified palettes by reading `canvas`
   until #391, which worked only because `canvas` IS the page ground on a LIGHT palette.

   ⚠ ON A DARK PALETTE IT IS NOT. Under `[data-ground="dark"]` the page ground is `band-dark`, so a
   classifier reading `canvas` files a dark palette in the light band and compares its hue against
   grounds it does not compete with.

   ⚠ THE SAME MISTAKE TWICE IN ONE MECHANISM, BOTH TIMES BY INFERENCE FROM A VALUE THAT HAPPENED TO
   AGREE. First L's band was a single band hiding a per-class fact; then the band registry
   classified members by a token that coincided with the class. Each was found only when a second
   member arrived. A classifier that reads a VALUE rather than a DECLARATION is correct until a
   member arrives where the two come apart.

   ⚠ NO DEFAULT, ON PURPOSE. A defaulted class means a new palette silently joins the light band —
   the failure L exists to prevent, reintroduced at the declaration. `theme` section L asserts every
   name here has an entry, so a palette added without one fails rather than inheriting.

   ⚠ AND THE DECLARATION IS CROSS-CHECKED AGAINST THE GROUND IT RESOLVES. The field says the class;
   the measured lightness of that class's page-ground token must land in that class's band. A
   declaration and a measurement disagreeing is exactly the case worth catching, and the one
   inference could never surface — under inference they cannot disagree by construction.

   ---- WHAT `canvas` MEANS ON A DARK PALETTE -------------------------------------------------

   It is NOT the page ground there; `band-dark` is. `canvas` keeps its light meaning — the ground
   behind cards in a LIGHT REGION of a dark page, which the case-study hero already proves exists
   (its rating chip draws a light pill on the dark band). So it is declared, it has a job, and the
   job is smaller than on a light palette. "Declared but not the page ground" was the ambiguity that
   made this fork hard to see; naming the job is what removes it.
============================================================================================ */
export type GroundClass = "light" | "dark";

/** Which page-ground token a class resolves. `theme` L cross-checks the declaration against it. */
export const GROUND_TOKEN: Record<GroundClass, string> = {
  light: "canvas",
  dark: "band-dark",
};

export const THEME_GROUND: Record<string, GroundClass> = {
  [DEFAULT_THEME]: "light",
  [SECOND_THEME]: "light",
  [THIRD_THEME]: "light",
  [FOURTH_THEME]: "light",
  [FIFTH_THEME]: "light",
  /* ⚠ THE ONLY DARK MEMBER. Its page ground is `band-dark`, not `canvas`. */
  [SIXTH_THEME]: "dark",
  /* The twin is byte-identical to the default, so it is light for the same reason cream is. */
  [VERIFY_THEME]: "light",
};

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
  /* ⚠ HELD, AND THE RENDER IS WHY. Sapphire's 35 tokens are correct, in gamut, and every dark-page
     floor clears. What does not work yet is the PAGE: `globals.css` holds 81 raw rung references —
     `.hero-ground` paints `var(--color-cream-50)` directly — and a rung does not remap under
     `[data-ground="dark"]`. So a dark palette paints a dark ground and is then covered by light
     sections.

     ⚠ THE ROLE MIGRATION'S SUBJECT WAS `.tsx` FILES AND NEVER INCLUDED THE STYLESHEET. Four PRs of
     denominators, all asserting the subject was non-empty and counted per directory, and the FILE
     TYPE was narrowed at the walk and never questioned. The render found it in one screenshot.

     ⚠ THAT IS FIXED IN #395 AND THE PAGE NOW RENDERS DARK — 34 public references migrated, the
     roles remap, and NOT ONE COMPONENT BRANCHES. Shape C is proven on a shipped surface.

     WHAT HOLDS IT NOW IS THE GLASS NAV. Its links measure 1.29 against a 4.5 floor on a dark page,
     because `data-nav-tone="dark"` is never set: that trigger watches the dark HERO, and a dark
     PAGE satisfies the same predicate with nothing computing it. `--glass-fill` stays the light
     cream at 58%, composites over the dark ground to a mid grey, and the light links vanish on it.

     ⚠ THE TWO-PREDICATE DESIGN IS VINDICATED RATHER THAN QUESTIONED BY THIS. `data-nav-tone` means
     "what is behind my translucent surface is dark", and on a dark page that is TRUE — the fix is
     in the TRIGGER, not the vocabulary. Clears when the nav retones on a dark page. */
  /* ⚠ THE PREVIOUS CONDITION WAS MET AND THE THEME WAS STILL NOT SHIPPABLE, WHICH IS WHY THIS IS
     REWRITTEN RATHER THAN DELETED. It read "held until the glass nav retones on a dark PAGE — its
     links measure 1.29 there". #396's predicate fixed that: swept at rest, `data-nav-tone` is dark
     and the links measure 7.68 against a 4.5 floor.

     ⚠ A HOLD IS A GATE WRITTEN IN PROSE AND IT HAS THE SAME FAILURE MODE — a stated condition
     narrower than the real one, satisfied while the thing it protects against remains. Unholding on
     the old text would have been technically correct and would have shipped AA failures on the home
     page. Same shape as the usage map's negative product claims, in a different medium.

     THE REAL CONDITION, IN A FORM THAT CAN BE CHECKED: 103 visible text nodes sweep clean on the
     dark home page. TEN FAIL TODAY, and every one is a `role-layer` RATCHET member — the eleven raw
     rungs whose ceiling only falls. So the ratchet and this hold are ONE unit, and the count is the
     clearing condition.

     ⚠ AND THE TEN ARE TWO DIFFERENT KINDS, WHICH THE REPAIR MUST NOT CONFLATE. The 2.13 eyebrows are
     raw accent rungs that never remap — straightforward members. The 2.60 experience rows are
     `text-subtle` CORRECTLY REMAPPED, failing on a ground that is still light — a correctly-migrated
     foreground on an un-migrated ground, where fixing the foreground would be the wrong repair.

     ⚠ AND THAT GROUND IS NOT YET IDENTIFIED. It was reported as `reveal-sand`'s start state, and
     `reveal-sand` was remapped in #399 — so that diagnosis is wrong or incomplete and the real
     ground has not been found. Third time in this arc a ground resolving elsewhere has produced a
     failure that looks like a foreground defect, and the first where the wrong ground was named. */
  sapphire: "held until the dark home page sweeps clean — 10 of 103 text nodes fail today, all "
    + "role-layer ratchet members, and the ground under the 2.60 rows is unidentified",
  /* ⚠ ORCHID WAS HELD HERE AND IS UNHELD IN #374. THE HOLD IS KEPT IN THE RECORD RATHER THAN
     DELETED, because a hold whose reasoning vanishes leaves no way to tell a considered release
     from a forgotten one.

     IT READ: "render not yet run — SHIPPABLE is the instrument's claim, not the eye's." That was
     the right condition and it named itself, which is what `A8`'s temporary-hold row now requires
     of every entry here.

     THE CONDITION IS MET. The full home page, the blog index, an article and all four signature
     surfaces were rendered on orchid and looked at — the glass nav, the work cards, the hero ground
     and the Pearl Smoke vessel all read correctly, the vessel measuring 15.8 and 6.01 with the
     sanity pair first.

     ⚠ AND THE ONE THING THE RENDER FOUND WAS ABOUT THE SITE RATHER THAN THE PALETTE — a blog
     illustration baked in cream's ground, pre-existing and revealed rather than caused. Holding
     orchid for it would punish the palette that exposed it, and harbour ships with the same leak
     unnoticed. `raster-grounds` now watches that class. */
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
/* ============================================================================================
   THE OG CARD PALETTE, PER THEME — AND WHY IT IS RESOLVED HEX LIKE THE SPLASH ABOVE.

   `ImageResponse` renders OUTSIDE the document. It cannot read a CSS custom property, exactly as a
   favicon cannot — so a social card's colours must exist as literals in JavaScript. That is the same
   forced form as `THEME_SPLASH`, for the same mechanical reason.

   ⚠ AND UNTIL #370 THE CARDS WERE NOT THEMED AT ALL — `lib/og.tsx` held four module constants, three
   of which named a token and were 26.7, 34.8 and 30.7 away from it. #368 corrected the values against
   cream; this makes them follow the published palette.

   Measured, sanity pair 21.000 first: the accent on its own card ground is 4.70 on cream and 4.87 on
   harbour. Both clear AA, and harbour's had never been measured because it had never been drawn.

   ⚠ THE GROUND IS THEMED TOO, which is easy to miss — `cream-50` differs per palette (#fef9f1 against
   #f5fbff), so theming only the accent would have drawn a teal mark on a warm card.

   `theme` section I asserts every value here equals its theme's declaration in `globals.css`. That
   check did not exist for `THEME_SPLASH` either; it now covers both, which is how a hand-kept
   resolved value is allowed to be hand-kept. */
export const THEME_OG: Record<string, { cream: string; ink: string; muted: string; accent: string }> = {
  [DEFAULT_THEME]: { cream: "#fef9f1", ink: "#0f0703", muted: "#59514a", accent: "#b65329" },
  [SECOND_THEME]: { cream: "#f5fbff", ink: "#040d12", muted: "#4c575e", accent: "#007e5b" },
  [THIRD_THEME]: { cream: "#fcf9fd", ink: "#0f0812", muted: "#5a525d", accent: "#993f94" },
  [FOURTH_THEME]: { cream: "#fef8f8", ink: "#190405", muted: "#574141", accent: "#d12d6b" },
  [FIFTH_THEME]: { cream: "#f4fdf1", ink: "#020f03", muted: "#3e4c3f", accent: "#4b7f20" },
  [SIXTH_THEME]: { cream: "#f7fbff", ink: "#040c16", muted: "#404952", accent: "#6980f4" },
  /* Byte-identical to the default, like every other value the control holds. */
  [VERIFY_THEME]: { cream: "#fef9f1", ink: "#0f0703", muted: "#59514a", accent: "#b65329" },
};

export const THEME_SPLASH: Record<string, string> = {
  [DEFAULT_THEME]: "#FEF9F1",
  [SECOND_THEME]: "#F5FBFF",
  [THIRD_THEME]: "#FCF9FD",
  [FOURTH_THEME]: "#FEF8F8",
  [FIFTH_THEME]: "#F4FDF1",
  [SIXTH_THEME]: "#F7FBFF",
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
