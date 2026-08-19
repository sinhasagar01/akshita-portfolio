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
export const DEFAULT_THEME = "drawing-office";

/* ============================================================================================
   ⚠ `drawing-office-verify` IS A PERMANENT CONTROL. DO NOT DELETE IT. ITS PURPOSE DOES NOT EXPIRE.

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
export const VERIFY_THEME = "drawing-office-verify";

/** A real second palette. Cool ground at hue 233, teal accent at 168 — a 155-degree swing from
 *  cream, chosen to TEST the light-ground constraint rather than to sit safely inside it.
 *
 *  ⚠ IT WAS REFUSED TWICE BY `ralph/tests/theme-contrast.mjs` BEFORE IT PASSED, which is the whole
 *  reason that gate was built before any palette existed. Draft 1 failed five external rows, draft
 *  2 failed one, this is draft 3.
 *
 *  ⚠ AND IT SITS ON THE SAME THREE FLOORS CREAM DOES, with essentially no margin. SHIPPABLE and one
 *  rounding away from not. */
/* ⚠ THEME THREE. Registering it here is not bookkeeping — `theme` J2 FAILS on a palette that exists
 * in `globals.css` and not in `THEME_NAMES`, because until #372 a whole 35-token block could enter
 * the stylesheet and ralph stayed green. Every theme check enumerated from this list or a hardcoded
 * pair, and none read the stylesheet to ask what was actually declared. */

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

/* ⚠ THE FIRST DARK PALETTE, AND THE FIRST MEMBER OF A SECOND GROUND CLASS. It does not compete for
 * hue with the light five — measured, hue changes the difference between a light and a dark ground
 * by 0.1% — so `theme-contrast` D12 skips those pairs and section L's dark band owns it. Its h250
 * sits 17 degrees from harbour's ground, which is a collision only under a floor calibrated for a
 * class it is not in. */
/* ⚠ SAPPHIRE DIVERGES FROM ITS OWN SOURCE ON ONE RUNG, RECORDED BEFORE ANYONE CITES EITHER.
 * It was drawn from `docs/ink-and-blue.html` — its `band-dark` is L17.0, that file's `bg` — and it
 * matches that preview on four of the five rungs the 35-token contract has a job for. It ships
 * `accent-on-dark` at L70.0 where ink-and-blue's own Sapphire blue is L64.0, and L70.0 is
 * `docs/dark-mode-studio.html`'s `a` rung. THE VALUE CAME FROM THE OTHER PREVIEW FILE.
 *
 * Not a defect and not corrected — the palette shipped, was published and was lived on at these
 * values. It matters because "sapphire follows its preview" was assumed while deriving the three
 * dark presets, and it is four of five rather than five of five. Each preset follows ITS OWN file. */
export const SIXTH_THEME = "sapphire";

/* ⚠ THREE INDEPENDENTLY AUTHORED DARK PRESETS, by owner ruling. `docs/dark-mode-studio.html` is
 * their source of truth. They are NOT derived from the light system and are exempt from the
 * cross-palette identity constraints by named entries in `theme-contrast` — see those entries for
 * the scope, which does not extend to derived palettes. */
export const SEVENTH_THEME = "ink-flare";
export const EIGHTH_THEME = "nocturne";
export const NINTH_THEME = "basalt";

/* ⚠ THE FIRST PALETTE WITH NO ACCENT HUE AT ALL, AND THE FIRST THE HUE FLOOR COULD NOT HAVE
   ADMITTED. #616 moved the light band from degrees to dE for exactly this member, after measuring
   that the old floor would have REFUSED an achromatic ground unconditionally rather than being
   silent about one — a chroma-0 ground still carries a hue DIGIT that `arc()` reads, and none of
   the 360 spellings clears 60 degrees against all five shipped hues.

   IT IS FIVE VALUES FROM `basalt`, WHICH IS WHY IT IS ITS COUNTERPART. Basalt already carried a
   fully achromatic light ladder that nothing on a basalt page drew, and this is that ladder given
   a page. Same lightnesses, so the ratios are basalt's rather than new. */
/* `redline` — Drawing Office marked up. One signal doing correction, so it needs no new role. */
const ELEVENTH_THEME = "redline";
/* ⚠ THE LIT SERVICE PANEL, AND THE FIRST PALETTE WHOSE SEPARATION CLASS IS NOT ITS GROUND CLASS.
   Its ground is dark, so `data-ground="dark"` fires and the ground layer remaps exactly as it does
   for the other four. What it does not share is a BAND: at L 0.2242 it sits above the dark band's
   0.200 ceiling, and widening that band to hold it drops the swing test from 28.1% to 13.6%. See
   `THEME_BAND`. */
const TWELFTH_THEME = "machine-room";

/** Every name the resolver accepts. A new real theme is ADDED here; the twin stays. */
export const THEME_NAMES = [DEFAULT_THEME, SIXTH_THEME, SEVENTH_THEME, EIGHTH_THEME, NINTH_THEME, ELEVENTH_THEME, TWELFTH_THEME, VERIFY_THEME] as const;


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
  /* ⚠ THE ONLY DARK MEMBER. Its page ground is `band-dark`, not `canvas`. */
  [SIXTH_THEME]: "dark",
  /* Declared, never inferred — a classifier reading a value files a dark palette in the light band. */
  [SEVENTH_THEME]: "dark",
  [EIGHTH_THEME]: "dark",
  [NINTH_THEME]: "dark",
  /* Light, and the only member of that class carrying zero chroma. Its page ground is `canvas`
     like every other light palette; what it does not have is a hue anywhere. */
  [DEFAULT_THEME]: "light",
  /* Warm proof paper. Light for the same reason drawing-office is — the page ground is `canvas`. */
  [ELEVENTH_THEME]: "light",
  /* ⚠ DARK, AND ITS BAND IS ELSEWHERE. The ground class answers "which token is the page ground and
     does the ground layer fire", and for this palette both answers are the dark ones. Its lightness
     band is a separate question and a separate map. */
  [TWELFTH_THEME]: "dark",
  /* The twin is byte-identical to the default, so it is light for the same reason cream is. */
  [VERIFY_THEME]: "light",
};

/* ============================================================================================
   ⚠ THE BAND IS A SEPARATE AXIS FROM THE GROUND CLASS, AND ONE PALETTE IS WHY.

   These were one thing until `machine-room`. `THEME_GROUND` answers two questions at once — which
   token carries the page ground, and whether `data-ground="dark"` is emitted — and the separation
   registry then keyed its BANDS off the same label, so a palette's lightness class and its ground
   class could not differ.

   ⚠ MACHINE ROOM IS A DARK GROUND THAT BELONGS TO NEITHER SHIPPED BAND. At L 0.2242 it sits above
   the dark band's 0.200 ceiling and below the light band's 0.950 floor — the between-bands state
   `theme-contrast` L1d refuses by name. It cannot join the dark band: widening that to 0.2242 takes
   L2's swing from 28.1% to 13.6% against a 25 floor, and L2 exists precisely to stop a band being
   stretched to admit a member.

   ⚠ AND RELABELLING ITS GROUND CLASS WOULD HAVE BROKEN THE PALETTE OUTRIGHT, WHICH IS THE TRAP
   WORTH RECORDING. `app/layout.tsx` emits the ground attribute on `ground === "dark"`, so a palette
   labelled anything else never gets the remap and every role stays at its light value on a
   near-black page. The two concepts had to come apart rather than one being renamed.

   A band with one member enforces no separation, and the registry already says so in as many words.
   ============================================================================================ */
export type GroundBand = "light" | "dark" | "panel";

export const THEME_BAND: Record<string, GroundBand> = {
  [DEFAULT_THEME]: "light",
  [ELEVENTH_THEME]: "light",
  [VERIFY_THEME]: "light",
  [SIXTH_THEME]: "dark",
  [SEVENTH_THEME]: "dark",
  [EIGHTH_THEME]: "dark",
  [NINTH_THEME]: "dark",
  /* The only member. Named for what the medium is rather than for where it sits, because "dark two"
     would invite the next palette to join it without measuring. */
  [TWELFTH_THEME]: "panel",
};

/* ============================================================================================
   ⚠ EACH PALETTE'S COUNTERPART IN THE OPPOSITE GROUND CLASS — AUTHORED, AND THE TWO DERIVATIONS
   THAT LOOK OBVIOUS ARE WRITTEN DOWN HERE SO NOBODY REACHES FOR THEM AGAIN.

   `/palettes` shows a light-and-dark counterpart line beside each palette. A hand-written map
   invites the next reader to replace it with a rule, so BOTH RULES WERE MEASURED FIRST. Neither
   reproduces this map, and — the part that matters — EACH FAILS ON A DIFFERENT ROW, so there is no
   third rule sitting between them waiting to be found.

   Measured over all nine real palettes, both directions, against the tokens each palette declares:

     nearest ACCENT hue    reproduces 7 of 9   fails harbour and sapphire (that pair, both ways)
     nearest GROUND  hue   reproduces 5 of 9   fails cerise, fern, ink-flare and basalt

   ⚠ AND BASALT IS WHY THE GROUND RULE CANNOT WORK AT ALL. Its ground chroma is 0.000 — measured,
   not rounded — so it HAS no ground hue, and the value 0 that a parser returns is an artefact
   rather than a colour. The ground rule then puts cerise's h15 fifteen degrees from basalt's
   non-existent h0 and calls it the nearest match. A rule whose input does not exist for one member
   is not a rule that member is an exception to.

   ⚠ THE ACCENT RULE'S FAILURE IS DIFFERENT AND WORTH ITS OWN SENTENCE. Harbour's teal accent at
   h165.3 is nearest basalt's h128 at 37.3 degrees, and sapphire's h272 is nearest orchid's h330 at
   58. Both are true and both ignore that harbour and sapphire are the same palette in two grounds —
   which is a fact about how they were DRAWN, and hue distance cannot see it.

   ---- ⚠ THE ASYMMETRY IS FORCED, NOT AN ERROR IN THE MOCK ------------------------------------

   Five light palettes, four dark. A symmetric pairing needs equal counts, so by pigeonhole exactly
   one light palette must point at a dark one that points back somewhere else. That is cerise. The
   contract's table showing `cerise -> ink-flare` while `ink-flare -> cream` is therefore the
   STRUCTURE rather than an accident, and a registry that "fixed" it would be encoding a symmetry
   the counts forbid.

   So this is a DIRECTED RECOMMENDATION — "if you like this one, try that one" — and not a pairing.
   What holds, and what `theme` section W asserts:

     every DARK palette round-trips           4 of 4
     every dark palette's target is distinct  so the four darks claim four different lights

   ⚠ AND THE THIRD LINE THAT BELONGS HERE IS PROSE RATHER THAN A ROW, DELIBERATELY. "Exactly
   |light| - |dark| light palettes are unreciprocated" — one, and it is cerise — is TRUE and was
   written as an assertion, then removed: cross-class plus distinct-targets together FIX that count,
   so no edit could redden it while those two stayed green. It discriminated nothing. The reasoning
   is kept here and the count is printed by the suite; `theme` section W says why at the deletion.

   ---- ⚠ WHAT THE GATE CAN AND CANNOT KNOW ----------------------------------------------------

   A counterpart is a JUDGEMENT. The gate's subject is COMPLETENESS and STRUCTURE — every real
   palette has an entry, every entry names a real palette in the opposite class, and the round-trip
   arithmetic above holds. It must never be strengthened into checking WHICH palette was chosen,
   because nothing here can know that, and a gate that pretends to would be a hue rule again with
   an assertion wrapped round it.

   ⚠ NO DEFAULT, FOR THE REASON `THEME_GROUND` HAS NONE. A defaulted counterpart means a new palette
   silently acquires one nobody chose, and it would read as a decision in the interface. A missing
   entry fails instead.

   ⚠ AND THE TWIN IS DELIBERATELY ABSENT. `drawing-office-verify` is a control, never selectable and never
   shown, so giving it a counterpart would add a sixth light member and break the count the
   structure rests on. The domain is the REAL palettes.
============================================================================================ */
export const THEME_COUNTERPART: Record<string, string> = {
  /* ⚠ THE UNRECIPROCATED ONE, AND IT IS FORCED RATHER THAN CHOSEN — see the pigeonhole above.
   * `ink-flare` points back at cream, which is the closer accent match at 10 degrees against 48. */
  /* ⚠ REPOINTED BY THE RETIREMENT. sapphire and nocturne answered to harbour and orchid, which
     are gone. `cream` is the only light palette left carrying an accent HUE, so it is the only
     candidate a hue-distance pairing can name at all. */
  [SIXTH_THEME]: ELEVENTH_THEME,
  [SEVENTH_THEME]: DEFAULT_THEME,
  /* ⚠ THE UNRECIPROCATED ONE, AND IT IS PIGEONHOLE RATHER THAN CHOICE. Four darks and three
     lights means exactly one dark cannot have its partner point back. nocturne takes it, pointing
     at the nearest light accent while cream answers to ink-flare. */
  [EIGHTH_THEME]: ELEVENTH_THEME,
  /* basalt keeps drawing-office, which its own note already calls the exact rather than nearest
     match — the two share a ladder and both carry zero chroma. */
  [NINTH_THEME]: DEFAULT_THEME,
  /* ⚠ THE ONE PAIR WHERE THE MATCH IS EXACT RATHER THAN NEAREST. Every other entry pairs on accent
     hue distance and the pigeonhole above forces one unreciprocated. These two share a ladder and
     both carry zero chroma, so there is no hue to be near — basalt IS this palette on a dark
     ground. Unreciprocated by the same rule as cerise, since basalt answers to fern on accent. */
  [DEFAULT_THEME]: NINTH_THEME,
  /* ⚠ THE PAIR THIS ENTRY SAID COULD NOT YET EXIST. It read that redline's red sits at h27 with
     `ink-flare` the nearest dark accent at h52, unreciprocated by the pigeonhole rule — and closed
     with "the artifact's own map pairs Redline with Machine Room, and that pair can only exist once
     Machine Room does." Machine Room exists, so the artifact's pairing is taken and the two
     reciprocate. The previous target, sapphire, was the nearest-accent fallback rather than a
     choice, which is exactly what a directed recommendation should stop being once the intended
     partner is buildable. */
  [ELEVENTH_THEME]: TWELFTH_THEME,
  [TWELFTH_THEME]: ELEVENTH_THEME,
};

export type ThemeName = (typeof THEME_NAMES)[number];

/* ============================================================================================
   ⚠ RESOLVABLE BUT NOT SELECTABLE, AND THE TWO ENTRIES ARE HERE FOR DIFFERENT REASONS.

   A theme in this map exists, renders, and is gated — it simply cannot be PUBLISHED. Keeping the
   reason beside the name is the point: "not selectable" with no explanation is indistinguishable
   from an oversight, and the twin already taught us that an unexplained exclusion is what a future
   cleanup deletes.

   `drawing-office-verify` — a permanent control. Never selectable, ever. See its block above.

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
  /* ⚠ THE THREE DARK PRESETS WERE HELD HERE AND ARE NOT ANY MORE, AND THE HOLD'S REASONING IS KEPT.
   * It read: "built and rendered, awaiting the owner's visual approval" — with basalt's adding that
   * its achromatic vessel is the case the pigment model has never met. Both were correct and BOTH
   * END CONDITIONS WERE MET, which is the point of writing one.
   *
   * The renders were taken and looked at. Basalt was judged against a criterion fixed BEFORE
   * looking — a translucent body, a visible meniscus, and an edge carrying more of the vessel's
   * read than its tint — and passes on all three, with sapphire beside it as the control. Its tint
   * collapsing to 4.0 lightness units did not break the vessel because the edge and the meniscus
   * carry the read, which is what the earlier finding predicted rather than what it feared. */
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
  /* ⚠ SAPPHIRE WAS HELD HERE AND IS UNHELD — THE SECOND END CONDITION WAS MET, NOT THE FIRST.
     Its hold read "ENDS when the work filter's two nodes clear on dark, OR when it is ruled that a
     pre-existing failure common to all six palettes does not block one theme."

     The work filter's defect is PRE-EXISTING ON LIGHT, shipped by six palettes, and unrelated to
     this theme — the pressed chip measures 2.03 on harbour and has since it was built. A HOLD
     EXISTS TO STOP A BROKEN DARK THEME SHIPPING, not to make a dark theme wait on a defect every
     light theme already carries. The original condition, "the dark page sweeps clean", was written
     before anyone knew the remainder would be that, and a hold that outlives its premise is a
     deletion nobody made.

     ⚠ UNHOLDING IS NOT FIXING. The defect is recorded as its own open item with everything measured
     — pressed at 2.03 on light with three foregrounds tested and the FILL never varied; unpressed at
     1.30 and 1.90 on dark with two grounds in the pixel strip and the PAINTED foreground still
     unestablished. Two decisions, taken separately. */
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

/* ⚠ THE COUNT AS A WORD, BECAUSE THREE USER-FACING STRINGS SAID "nine" WHILE TEN WERE SELECTABLE.
 * `All nine`, `See all nine` and an `aria-label` of `See all nine palettes` were live on the home
 * page after the tenth palette shipped — a hardcoded count that drifts the moment the population
 * grows, which is the same defect as the store rating stated three ways in five files.
 *
 * ⚠ AND THE aria-label IS THE ONE THAT MATTERS MOST, because a sighted reader can see the dots and
 * count them while a screen-reader user is told a number and has nothing to check it against.
 *
 * The map stops at twelve deliberately and falls back to digits rather than throwing. A missing
 * word must degrade to "All 13" — correct and plain — rather than to a blank or a crash on a page
 * whose only job is to link elsewhere. `theme` section A8b asserts the current count HAS a word, so
 * the fallback is a safety net rather than the thing that ships. */
const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve"] as const;

/** A small count spelled for prose. Digits past twelve. */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** How many palettes an author may choose from, spelled for prose. Digits past twelve. */
export function selectableCountWord(): string {
  return countWord(selectableThemes().length);
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
/* ⚠ THE GROUND IS THE PALETTE'S PAGE GROUND, WHICH IS WHAT THE KEY `cream` NO LONGER MEANS. Every
   entry below used to be `cream-50 / ink-950 / ink-600 / accent-500` — the LIGHT ladder, on all seven
   palettes — so a card for a dark palette rendered near-white in front of a near-black site. Five of
   the seven are dark, so that was five cards of seven describing a site that does not look like them.

   ⚠ IT IS THE `cream-50` READ AS "THE PAGE GROUND" DEFECT, WHICH THIS RECORD ALREADY CARRIES TWICE
   AS A CONTRAST ERROR AND ONCE IN THE MANIFEST. `cream-50` IS the page ground on a light palette and
   is NOT on a dark one, where `band-dark` is. The four keys now read per ground class:

       light   cream-50    ink-950    ink-600          accent-500
       dark    band-dark   on-dark    on-dark-muted    accent-on-dark

   Measured against the card's own ground, sanity 21.000 first — every pair clears 4.5 on every
   palette, and the tightest is the lit panel's own muted step:

       drawing-office  18.86  8.76  20.12      sapphire   17.32  8.45  6.99
       redline         18.08  8.95   6.65      ink-flare  17.41  8.48  6.84
                                               nocturne   17.32  8.43  6.75
                                               basalt     17.27  8.44  7.52
                                               machine-room 13.38 5.84 8.11

   ⚠ THE TWO LIGHT PALETTES MOVE ZERO BYTES, and that is by construction rather than by luck — their
   existing values already WERE the light map. Only the five dark ones change.

   ⚠ AND THE KEY NAMES ARE KEPT DELIBERATELY. `cream`, `ink`, `muted` and `accent` name the card's
   ROLES rather than the rungs they resolve from, so renaming them would touch `lib/og.tsx`, both
   routes and `theme` I for no gain. `cream` is the one that reads oddly and the table above is why.

   `theme` section I asserts every value here equals its theme's declaration in `globals.css`, and its
   token list is now DERIVED FROM THE GROUND CLASS — it was a fixed four-pair list, which would have
   gone on comparing a dark palette's card ground against its `cream-50` and passing. */
export const THEME_OG: Record<string, { cream: string; ink: string; muted: string; accent: string }> = {
  [SIXTH_THEME]: { cream: "#0a1016", ink: "#f1f4f7", muted: "#a8adb2", accent: "#8097f6" },
  [SEVENTH_THEME]: { cream: "#140d0a", ink: "#f6f3f1", muted: "#b1aba8", accent: "#e87e34" },
  [EIGHTH_THEME]: { cream: "#0d0e19", ink: "#f2f3f8", muted: "#ababb5", accent: "#a984fb" },
  [NINTH_THEME]: { cream: "#0f0f0f", ink: "#f3f3f3", muted: "#acacac", accent: "#80b12c" },
  /* ⚠ THE ACHROMATIC PAIR NO LONGER SHARES THREE VALUES, BECAUSE THEY ARE NO LONGER IN THE SAME
     GROUND CLASS. Both palettes read the same achromatic ladder, so under the old light-only map
     `cream-50`, `ink-950` and `ink-600` resolved to the same paint on both and only the accent
     differed. Basalt is DARK, so it now takes `band-dark / on-dark / on-dark-muted` and
     drawing-office keeps the light three. The values diverge and the derivation is unchanged —
     what moved is which ladder each end reads. */
  [DEFAULT_THEME]: { cream: "#fafafa", ink: "#0b0b0b", muted: "#484848", accent: "#000000" },
  [ELEVENTH_THEME]: { cream: "#fafaf8", ink: "#111110", muted: "#474741", accent: "#b01c14" },
  /* ⚠ THE ACCENT IS THE MEDIUM'S AMBER NOW, AND THE NOTE HERE SAID THE OPPOSITE FOR A REASON THAT
     HAS EXPIRED. It read: "the accent is the mid-lightness rung rather than the medium's amber — the
     rung is what an OG card paints, since that surface has no dark ground to remap against." THE
     CARD HAS A DARK GROUND NOW, so the premise is gone and the rung would be the wrong end: the mid
     rung `#966302` measures 3.32 on `band-dark` where the amber measures 8.11. A true note whose
     condition changed, corrected in the commit that changed it. */
  [TWELFTH_THEME]: { cream: "#151d20", ink: "#dee5e4", muted: "#8b9a98", accent: "#f0a31f" },
  /* Byte-identical to the default, like every other value the control holds. */
  /* ⚠ THE TWIN IS A CLONE OF WHATEVER THE DEFAULT IS, so it holds the DEFAULT'S values rather
     than a copy of one particular palette's. It carried cream's until the default moved. */
  [VERIFY_THEME]: { cream: "#fafafa", ink: "#0b0b0b", muted: "#484848", accent: "#000000" },
};

export const THEME_SPLASH: Record<string, string> = {
  [SIXTH_THEME]: "#F7FBFF",
  [SEVENTH_THEME]: "#FEF9F7",
  [EIGHTH_THEME]: "#F9FAFF",
  [NINTH_THEME]: "#FAFAFA",
  [DEFAULT_THEME]: "#FAFAFA",
  [ELEVENTH_THEME]: "#FAFAF8",
  /* Machine Room's `cream-50`. A near-white with the medium's own cool cast, which is what the
     splash surface takes on every palette — the ground it eventually paints is dark, and the record
     already rules that a surface whose ground sits at an extreme buys nothing from theming. */
  [TWELFTH_THEME]: "#F4FCFB",
  /* Byte-identical to the default, like every other value the control holds. */
  [VERIFY_THEME]: "#FAFAFA",
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
