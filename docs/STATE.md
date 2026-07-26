# PROJECT: akshitas.com — /studio content editor

Next.js 15 App Router portfolio (repo: sinhasagar01/akshita-portfolio) with a custom
/studio dashboard that edits site content via an authenticated GitHub-commit pipeline
(draft branch → publish = merge to main → Vercel rebuild). Built by Sagar.

---

## STATE (as of THE BLOG ARC COMPLETE + THE 3-PANE RELAYOUT HALF-BUILT)

**main** = `bbf6d3d` (CLAUDE.md blog conventions). Pinned: `fe4b08d` = #177 merge
(tooling + nav fixes), `2ad4856` = #176 merge (love UI), `2d837f2` = the CLAUDE.md
proof-and-verification note. Earlier: `9a25bc0` = #174, `c9bd10d` = #173, `a6bc8b9` = #172,
`c164c85` = #171, `92f8378` = #170, `0d21a93` = #169, `7e591ae` = #168, `5839039` = #167,
`54be07e` = #166, `4228b14` = #165, `2a87d96` = #164, `e90742f` = #163.

### RALPH IS 930 ACROSS 26 RUNNABLE SUITES
Chain: 571 → 588 (#170) → 601 (#171) → 630 (#172) → 749 (#173) → 793 (#174) → 900 (#175)
→ 900 (#176, no suites — its subject was DOM geometry and browser cache behaviour, which
ralph structurally cannot see) → 930 (#177, `studio-nav-active` 30).

Run each suite directly — **there is no npm script**:
`node --experimental-strip-types ralph/tests/<name>.mjs`
Per-file: blog-format 50, blog-reading-time 13, blog-registry 44, blog-serialize 32,
blog-status-filter 17, collection-image-paths 29, cs4-frame 26, f2-draft-overlay 11,
f3-slug 31, loves-store 72, ncr-adjacent 20, p4-3c-adapter 53, p4-4bi-sections-serialize 28,
p4-4bii-block-forms 132, p4-4biii-structural 58, p4-4biv-block-images 20,
paragraph-edits 28, rich-markers 63, section-label 23, settings-photo 25,
studio-nav-active 30, task1 17, task2 22, task3 14, upstash-transport 35,
validate-blog-post 37. `parity.mjs` excluded (needs a running server).
**COUNTING NOTE:** `rich-markers` reports `✓`/`63 passed` rather than `[PASS]`, so a naive
grep undercounts by 63. Read each suite's own summary line.

### THREE ARCS COMPLETE, ONE IN FLIGHT
1. **Work-section rebuild — COMPLETE** (#159–#162).
2. **Studio restyle — COMPLETE** (#164–#169).
3. **Blog — COMPLETE** (#170–#176), plus #177 tooling and nav fixes.
4. **The 3-pane editor relayout — HALF-BUILT on an unpushed branch.** See the handoff
   section at the end; that is where a fresh session starts.

---

## HISTORY BEFORE THIS SESSION — unchanged, retained in prior STATE

GH-1..GH-12, H1/H1.1 Hero, DB-1, About-A/B/C, PL-1 useDraftForm, PL-2a Links, PL-2b
Process, CE-1/2/3a/3b, UX-1/UX-2 PublishBar, LAYOUT-1 ListDetailLayout, SK-3a/3b/4/5
Skills, PR-CHIPS ChipListEditor, F-1/F-2/F-3, Items 13/11/10, PHASE 4 case-study system
complete, /keystatic RETIRED, CS-7a Editorial hero, inline rich-text arc
(#138/#144/#145), test repairs #140/#141/#142, #139 selected-rail.

**All locked decisions from that history remain in force.**

---

## ARC 1 — WORK-SECTION REBUILD (COMPLETE)

Overlay grid. Quiet grid and hover-preview stage explored and rejected.

- **#159 · category taxonomy (invisible).** `fields.text` with implicit `""`; enum
  validation in the SANITIZER. **Never derived from `template`.** **Flag-2:** the sanitizer
  ACCEPTS, the serializer WRITES; sanitizer-only = validate-then-silently-drop.
- **#160 · card rebuild.** `ProjectCard` is a block-level `<Link>`; `heroImage` renders with
  the slug-keyed SVG as FALLBACK. Collapses at `lg`.
- **#161 · platform glow.** **NO CARD MAGNIFICATION** — deleted, not zeroed. Dock mechanic
  in LIGHT: `e^(−1.2d²)`, 60ms per unit of grid distance, glow 100% + recede 28%. **Delay on
  the shot/rail, never the card.** Glow **contained inside the card's own padding**.
- **#162 · filter.** **LAST-INTENT QUEUE.** **Empty category → All only.** **No
  `?platform=` URL sync** — ScrollManager is sole scroll owner.

**Remainder (content, not code):** `heroImage` is `null` on BOTH Fosfor studies.
`boat-crest`'s is an 837KB PNG that never went through sharp. `elevate-one-view`'s is
390×988 portrait — a STRUCTURAL TENSION. Three ways out: landscape composite; a `cardImage`
field; or a platform-tinted portrait frame for mobile cards (**recommended**). **Owner's
call, still open.**

---

## ARC 2 — STUDIO RESTYLE (COMPLETE)

Six PRs, **no CSS authored in any of them**, globals.css never touched.

- **Task 0 finding:** the studio authors ZERO global class names — 100% Tailwind utilities +
  `@theme` tokens. Fonts are DM Sans + Fraunces.
- **#164 `SegmentedToggle`** — pure refactor, byte-identical. **PRESERVED QUIRK:**
  `onChange?.(prev)` fires only in the `fs`-noop revert branch. **It posts patches, so it is
  not a generic toggle** — which is why the blog status control is bespoke.
- **#165 full-bleed shell** — outer card deleted; `overflow-hidden` removal REQUIRED;
  sidebar 236px sticky; ink active pill. **HAZARD: the 236px coupling.**
- **#166 overview rows** — Contact is a visually LOCKED `<div>`, proven by Tab sequence.
- **#167 ListDetailLayout** — **CONSUMERS ARE SETTINGS, EXPERIENCE, SKILLS.** Selected stays
  the ACCENT-TINTED PILL. **The attribute-invariant gate was invented here.**
- **#168 `StudioModal`** — **4 modals in 2 files.** Six-item delta list up front.
  **SHADOW LITERAL EXCEPTION.** **HAZARD: no portal.**
- **#169 chrome pass** — PublishBar becomes a pill. **ERROR TONE SPLIT.** All EIGHT
  PublishBar states captured.

---

## ARC 3 — BLOG (COMPLETE)

### #170 · schema + read path (`92f8378`, invisible)
`blog` collection: `title` (slug), `dek`, `date` (ISO text), `topic`, `status`, `heroImage`
(own dir), flat `blocks`. `lib/blog/select.ts` is a **pure, reader-free seam**.
**THE STATUS DECISION:** publish is **whole-branch**, so an unfinished post cannot be held
at the pipeline. **FAIL CLOSED — `=== "published"`.** The deliberate OPPOSITE of #159's
`category: ""` → visible: `category` DESCRIBES, `status` GOVERNS EXISTENCE.

### #171 · public pages (`c164c85`)
`/blog` and `/blog/[slug]`, **LIVE BUT UNLINKED**.
- **DECLARED DELTA: a `heading` block kind.**
- **THREE LEAK DEFENCES:** `generateStaticParams` reads the filtered list; `dynamicParams
  = false`; the route gates on status. Proven with a temporary draft probe.
- **Pearl palette as LOCAL CUSTOM PROPERTIES scoped to `.blog-vessel`.** Prefix PROVEN.
- **R1:** `--read` via GSAP ScrollTrigger, Lenis-synced. **R2:** `feTurbulence` animates via
  SMIL, which the CSS `animation` reset does NOT stop.

### #172 · collection-parameterized image paths (`a6bc8b9`)
**"All three hardcodings are inert" was WRONG for entry heroes** — `heroImageBlobPath` is a
FIXED path with no hash, so a same-slug blog post would **CLOBBER the project's hero**.
- **THE PARAMETER IS REQUIRED, NOT PROJECTS-DEFAULTED.** The bug existed *because*
  `imgSpecFields()` silently defaulted.
- **KNOWN DUPLICATION:** the config's local mirror + `SCHEMA_IMAGE_BASES`, test-enforced.
  **OPEN: does the cross-check compare the full key set in both directions?**

### #173 · the write seam (`c9bd10d`)
`heading` had no validator and no adapter case. **#170's "reusable wholesale" was CORRECT
WHEN WRITTEN;** #171 silently invalidated it.
- **HYBRID SHAPE, decided by experiment.** The splice preserves a non-canonical tail
  verbatim where a whole-file dump reformats it.
- **The splice is DUPLICATED deliberately; the COMBINATORS are SHARED; the TABLE is blog's.**
- **VALIDATE PUBLISHED-ONLY.** A read-path pre-filter made "drafts are inert" structural.
- **`date: '2026-07-24'` is SINGLE-QUOTED** — losing the quoting yields a Date on the next
  `load`. Asserted in bytes and type.
- **THE C3 CORRECTION:** the Keystatic reader validates AND COERCES (throws on four shapes,
  coerces three), so the real hazard is a reader throw inside
  `reader.collections.blog.all()`, which fails the build **SITE-WIDE**. `BlogProse`'s guards
  are **insurance, not a live defence**.
- **STRIP-TYPES, second occurrence** — resolved by INJECTION.
- **THE FOUR TERNARIES.** Widening `CollectionName` silently rerouted four sites.

### #174 · the editor host (`9a25bc0`)
Built **index + full-width `[slug]` editor**, rejecting the 3-pane. **THAT DECISION HAS NOW
BEEN REVERSED BY THE OWNER** — see the handoff section.
- **THE SWEEP — seven structures key off the projects block union.** Gaps #2–#4 closed for
  blog, still open for projects-side reuse. #6–#7 are `Set`s and fail silently.
- **`overlayCollection` gained a REQUIRED comparator**, surfacing two call sites passing by
  accident via `sort(undefined)`.
- **Cache key now collection-qualified** — `["studio-case-study-draft"]` would have served a
  project's cached draft for a same-slug post.
- **G2 CAUGHT A REAL BUG:** `saveDraft()` closes over `values`, so every structural op
  posted the pre-update array. Invisible to a unit test and to a DOM diff. **The fix is the
  standing discipline: structural ops never call `saveDraft()`; fields save on blur.**

### #175 · the love store and endpoints
The first **runtime state** and the first **public write endpoint**.
- **LOVE IS ONE-WAY, NOT A TOGGLE.** With IP-hash dedupe and localStorage pressed-state a
  toggle is incoherent across devices.
- **IP-HASH DEDUPE, TTL'd ONE YEAR, UNDERCOUNT ACCEPTED.** Behind carrier NAT several
  visitors share a hash; a low honest number beats an inflatable one.
- **KEYS NAMESPACED BY ENVIRONMENT.** Previews use the real Redis with isolated keys.
- **CLIENT-FETCH AFTER HYDRATION**, never ISR, never a dynamic segment — the page is
  delivered before Redis is consulted, so no store failure can break it.
- **THE FOURTH LEAK PATH.** #171's three defences are page-level; none reach an API route.
  Both GET and POST gate on the published list, and unknown slugs are OMITTED from `counts`
  rather than returned as 0.
- **FAIL QUIET, NOT FAIL OPEN.** A missing `LOVES_HASH_SECRET` counts as unconfigured.
- **NEVER READ-MODIFY-WRITE**, asserted structurally by a command-recording fake.
- **THE RATE LIMITER REUSES THE SHAPE, NEVER THE FUNCTION** — sharing
  `checkAndRecordAttempt` would have put loves and logins on one counter, so blog traffic
  could lock the owner out of the studio.
- **THE TAILWIND SOURCE-SCOPE FINDING:** a utility word in a ralph ASSERTION NAME shipped a
  declaration to production CSS. Fixed in #177 by excluding `ralph/`.

### #176 · the love UI (`2ad4856`)
- **ONE PRESSABLE CONTROL SITE-WIDE** — the end-of-article pill. Counts render in five
  places, read-only in four. `<button>` inside `<a>` is an invalid content model, and a
  fixed control that appears and vanishes on scroll would drop a keyboard user's focus.
- **THE 4a CACHE-HEADER CORRECTION.** `stale-while-revalidate` is NOT shared-cache-only, so
  it licensed the browser to serve a stale body; with no `max-age` there was no explicit
  freshness either. Now `public, max-age=0, s-maxage=60`. Proven by resource timing —
  `transferSize: 0` while the store held a different number.
- **An empty `inline-block` has no line box**, which `min-width` cannot cover. The stream
  card's meta row grew 24.5 → 24.88px when the first digit arrived. Fixed with matched
  `h-[18px] leading-[18px]`.
- **Ralph unchanged at 900** — DOM geometry and browser cache behaviour are invisible to it,
  and padding the number would have been theatre.

### #177 · tooling debts + nav fixes (`fe4b08d`)
- **`ralph/` excluded from Tailwind's source detection** — closes the #175 hazard. 13
  phantom rules removed, each proven consumer-free.
- **`scripts/normalize-dom.mjs` COMMITTED and mutation-tested.** Four traps: the build-id
  doctype comment (base64url, `_` and `-` both occur); the `self.__next_f` payload (strip
  the SCRIPT TAGS, not just their args — the chunk COUNT varies); `/_next/static/*` hashes
  INCLUDING route-group paths (the old mask stopped at `)`); and JSON-LD dates, which derive
  from content-file mtime. **`touch -r` restores mtimes in the harness rather than masking
  the dates in the normalizer — masking would blind the gate to a real content change.**
- **The selected nav label was `ink-950` on `ink-950`, 1:1, literally invisible.** My
  screenshot read was right; the code-based prediction that a bare `<span>` inherits
  `cream-50` was wrong. **The asymmetry to follow was that the icon rendered because it
  carries its own class and the label did not because it inherits.**
- **The count contrast was 5.46:1 — passing AA, not failing.** Raised to `cream-50/70`
  (9.36:1) to mirror the inactive item's 2.13× dimming. Framed as a dimming-consistency
  improvement, NOT a contrast failure repaired.
- **`isStudioAreaActive` in `lib/studio/nav-active.ts`**, 30 assertions. Section items
  prefix-match; `/studio` stays exact.
- **`SegmentedToggle`'s accent-fill convention wins** over the blog panel's bespoke
  tan-fill. The shared component with two call sites and a ralph suite sets the convention;
  the one-off follows. `aria-pressed` is CORRECT for a two-state selection — it was wrong on
  the love button only because love is one-way.

### THE WRITE PATH IS OWNER-VERIFIED BY REAL USE — cite `4e900c9`
That commit changed `content/blog/….yaml` and `public/images/blog/…/heroImage.webp`
together, so: the upload route accepted `collection: "blog"`, the generalized path helper
resolved to `/images/blog`, `commitEntryHeroImage` committed the blob, `sanitizeBlogPatch`
accepted the patch, and `serializeBlogEntry` wrote it. The commit message says "clear hero
image", so the null branch ran too. **The diff touched ONE line** — `heroImage` only, with
the `blocks:` tail untouched and `date: '2026-07-24'` still single-quoted. #171's pre-image
guarantee and #173's splice both held against a real write. Publish merged twice
(`bf32503`, `3650956`). **Backlog items 7 and 8 are closed.**

### CURRENT CONTENT STATE
**One post, `status: draft`.** So `/blog` renders the EMPTY STATE in production, which is
the fail-closed filter working correctly, not a bug. `heroImage: null`, with an orphaned
`heroImage.webp` still committed — consistent with the accepted orphan posture. Flipping to
Published is a content operation through the editor and the first real exercise of the
status write path.

---

## THE 3-PANE RELAYOUT — HALF-BUILT, THIS IS WHERE A FRESH SESSION STARTS

**Branch `feat/blog-editor-3pane` at `a586e98`. LOCAL ONLY, NOT PUSHED. Push it first.**

**WHY:** the owner reversed #174's index + full-width decision. `/studio/blog/<slug>` becomes
3-pane list + canvas + inspector per `docs/studio/studio-blog.html`. Other studio pages are
intended to adopt the layout later — but **build blog-specific first and extract at the
SECOND consumer**, per #173's splice rule.

### THE ARITHMETIC WAS WRONG AND IS NOW CORRECTED
`68ch` resolves against the wrapper's font-size, which is **16px**, not the 18px prose —
so 68ch is **745.9px, not 646**. The contract's 1406 threshold was wrong by 190px.
**Corrected panes: sidebar 236 + list 264 + canvas 794 + inspector 244 = ~1538**, which
fits a 1536 laptop. `FIT_THRESHOLD_PX = 1538`.

**Editor-to-public fidelity is currently broken by 48px** and nobody knew: the public
article is `max-w-[68ch] px-6` (745.9 − 48 = 697.9 prose) while the studio canvas is
`max-w-[68ch]` with no padding (745.9). `BlogBlocksEditPanel:161`'s claim that the author
sees what the article renders is false today. **Adding `px-6` to the studio wrapper makes it
true for the first time** — and A1 requires proving the two measures EQUAL as a number.

**Two contract errors found and corrected:** `.canvas-inner` max-width must be 746, not 620
(620 would have shrunk the measure and broken fidelity); and
`.split.collapsed .canvas-inner{max-width:700px}` must be DELETED — a measure that widens on
collapse breaks the very property that justifies keeping 68ch.

### ALSO CORRECTED: THE "OFF-CENTRE CANVAS" WAS NOT A DEFECT
I reported it from a screenshot and invented three hypotheses. The canvas is `mx-auto`, no
reserved rail, and the arithmetic reproduces the measured 790px exactly. The real problem is
compositional: an unbounded head strip above a 746px column makes a centred column read as
stranded. 3-pane fixes it by construction.

### COMMITTED IN `a586e98`
1. **D1 padding move.** The layout's `p-4 lg:p-6` wrapper and the `h-20` PublishBar spacer
   are deleted; 9 pages opt in via a shared `STUDIO_PAGE` constant. Removing a layout-level
   assumption this PR falsifies, rather than negating it locally (negation decays and does
   not solve height). tsc clean.
2. **`HeroImageField` gains `label`**, defaulted `"Hero image"` so projects is unchanged;
   blog passes `"Card image"`. The duplicate label was a missing prop, not a stray string.
3. **The poster field is hidden for blog** — parameterised, not forked: `VideoEmbedForm`
   takes `showPoster = true`, blog's entry spreads the shared one overriding only `Form`.
   #174 planned this and it never shipped, so blog had an authorable field `BlogProse`
   ignores — the condition that got `imageBlock` deferred.
4. **`ThreePaneShell` drafted** with `FIT_THRESHOLD_PX = 1538`, a fixed canvas measure, and
   `inert` on the collapsed pane — the G3 fix written in from the start.

### REMAINING, IN DEPENDENCY ORDER
1. `BlogPostList` pane with its own search state; wire `BlogEditPanel` and
   `BlogBlocksEditPanel` into the **two-section inspector keyed off `selectedId`**.
2. `px-6` on the studio canvas wrapper; the editor page goes full-bleed, dropping the
   temporary `STUDIO_PAGE` added to keep `a586e98` coherent.
3. **The three prose rewrites** — each must record that the owner reversed the decision and
   WHY the earlier reasoning no longer applies, not merely delete it:
   `BlogIndex.tsx:6–15`, the `[slug]/page.tsx` header, and the CLAUDE.md bullet from
   `bbf6d3d` whose "board and canvas own the width" clause becomes false on merge.
4. Contract corrections; extend the `PublishBar.tsx:207` hazard comment to say why the
   offset was left.
5. All nine gates, A1's measure-equality number, the dev-only session route, and the
   worktree determinism control.

### DECISIONS ALREADY MADE — build to these
- **The inspector carries TWO STACKED SECTIONS**, Post then the selected block's fields.
  A literal reading of the mock would DELETE blog's only block-editing surface: the
  contract's inspector holds post fields, the shipped one holds block forms.
- **Two separate `useDraftForm` instances stay separate** (`BlogEditPanel:53`,
  `BlogBlocksEditPanel:101`). The shell owns NO form state. **Two labelled save indicators**
  — one would imply one form, which is #174's confusion. G4 proves two separate patches.
- **`dek` stays a plain input** styled to match the canvas. Blog has no contenteditable
  infrastructure and introducing the studio's second one inside a layout PR is scope creep.
- **Below 1100 the inspector collapses and the shipped `ViewToggle` takes over.** One
  mechanism at two widths; the narrow layout is the already-proven layout.
- **PublishBar's offset is ACCEPTED as-is** — 13px off canvas centre expanded, 131px
  collapsed. A third hand-coupled width literal for ≤131px of centring is the wrong trade.
- **Mock-only affordances are OUT:** the per-gap block inserter, drag handles, the hover
  kind-tag overlay, the rich-text toolbar, the nav hover nudge. Append-at-end, chevron
  reorder and the persistent inspector kind label stay as they ship.

### THE FOUR REVERSAL RISKS — carry them forward
1. **It re-adds the exact pattern the studio removed for a stated reason**, recorded in
   `BlogIndex.tsx:6–15` as a decision. The collapse control is the mitigation previously
   judged insufficient. Rewrite both prose sites or the codebase carries two contradictory
   rationales — exactly how the `[slug]/body` drift started.
2. **`ListDetailLayout` becomes a second-class shell.** Eight surfaces use a fixed
   two-column grid; blog gets a better three-pane one.
3. **The canvas/public fidelity property** is the thing to protect, which is why 68ch and
   `px-6` matter more than matching the mock's numbers.
4. **A collapsed pane is a focus trap in waiting.** `width: 0` with `overflow: hidden` keeps
   contents tabbable — #177's finding mirrored, and the contract does not mention it. G3 is
   the gate expected to fail first. **`inert` on a React element needs a cast in this TS
   version (`inert: "" as unknown as boolean`); if that causes trouble, use
   `visibility: hidden` + `pointer-events: none`.**

### CONTRACT ERROR COUNT: EIGHT
`structural()` (never existed); `imageBlock` (specified as shipped); "reuse the editor
wholesale" (true of the block layer, false of the host); the layout claim (recommended
rebuilding a removed pattern); the segmented-control convention; **the poster field claimed
hidden when #174 never shipped it; the nav hover nudge (mock-only); and the rich-text
toolbar listed as reusable when blog has none.** The reuse-wholesale overreach is now at
three occurrences.

---

## LOCKED DECISIONS (do not change without being asked)

All prior locked decisions remain. Added across this session:
- **`category` is editorial taxonomy, never derived from `template`.**
- **A new field needs BOTH the sanitizer AND the serializer.**
- **Work cards are one block-level `<Link>`.** **No card magnification.**
- **Filter: last-intent queue.** **Empty category → All only. Empty blog status → HIDDEN.**
- **The studio authors NO global CSS.** Blog authored CSS is `blog-`prefixed, proven.
- **`SegmentedToggle` posts patches** and its **accent-fill selected convention is the
  studio's**. `aria-pressed` is correct for a two-state selection.
- **The studio is full-bleed.** Login keeps its centred card.
- **`ListDetailLayout`'s consumers are Settings, Experience, Skills.**
- **`StudioModal` is the one modal.** **Add is accent, Remove is ink.**
- **Blog status fails CLOSED.** **A post's block array is named `blocks`.**
- **Image paths take a REQUIRED per-collection base. No default, ever.**
- **`overlayCollection` takes a REQUIRED comparator.** Cache keys are
  collection-qualified.
- **`/blog` ships live but unlinked.** The nav link is the launch switch.
- **Blog validates PUBLISHED files only.** **No `orderIndex`, no reorder arm.**
- **Blog's splice is duplicated deliberately.** Extract on the third collection.
- **LOVE IS ONE-WAY**, client-fetched after hydration, environment-namespaced, gated on the
  published list, and **FAILS QUIET**.
- **ONE pressable love control site-wide**, the end-of-article pill.
- **The blog editor is 3-PANE** (owner reversal of #174), canvas at **68ch with `px-6`**,
  fit threshold **1538**.
- **Structural ops NEVER call `saveDraft()`.** Fields save on blur.

---

## WORKING RULES

All prior rules remain. Added or sharpened across this session:

- **CSS-BUNDLE GATE: THE ASSERTION IS "NO EXISTING ELEMENT'S RESOLVED STYLE CHANGES."**
  Mis-specified twice. **STANDING METHOD:** selector-diff as a cheap first pass;
  **UNION-OF-DECLARATIONS** when it flags anything.
- **TAILWIND'S SCANNER IS AUTHORITATIVE — ABOUT COMPOSITION.** One dynamic-composition
  site, no safelist. **`ralph/` is now EXCLUDED** from source detection (#177), so "N added"
  counts are finally trustworthy.
- **"ZERO REMAINING CONSUMERS" REQUIRES THE UNION METHOD, NEVER A GREP.**
- **MATCH RESPONSIVE PREFIXES EXACTLY.** **SELECTOR-RULE COUNTS INFLATE.**
- **THE DOM GATE AND THE CSS GATE ARE ORTHOGONAL**, and the DOM gate is **nearly vacuous
  for a write-path or studio-only change** and **inapplicable for a no-UI change** — report
  N/A rather than a pass.
- **A MAPPED TYPE FAILS COMPILATION; A `Set<Kind>` JUST RETURNS FALSE.**
- **DRIVE THE UI TO PROVE WHAT IT PRODUCES.** #174's harness caught `saveDraft` closing over
  stale `values`. **A screenshot proves a pane is 288px; only a round-trip proves the post
  you reordered is the post that saved.**
- **A REQUIRED PARAMETER SURFACES CALL SITES RELYING ON UNSPECIFIED BEHAVIOUR.**
- **INJECT THE TRANSPORT TO MAKE A POLICY TESTABLE.** The RESPONSE to an outage is testable;
  the outage is not.
- **ASSERT THE ABSENCE OF A PATTERN, NOT JUST THE PRESENCE OF A RESULT.**
- **PIN EXPECTED VALUES FROM THE PRE-CHANGE STATE, NOT FROM THE NEW CODE.**
- **ASSERT AGAINST REAL ARTIFACTS WHERE THEY EXIST.**
- **PROVE VALIDATION ORDERING, NOT JUST VALIDATION.**
- **THE ATTRIBUTE-INVARIANT GATE** — strip ONLY `class`. Meaningless for a PR that ADDS
  behaviour.
- **WHEN BEHAVIOUR DELIBERATELY CHANGES, PUBLISH A NUMBERED DELTA LIST UP FRONT.**
- **NEVER FAKE A BASELINE.**
- **MUTATION-TEST ANY NEW HARNESS OR SUITE BEFORE TRUSTING IT.**
- **A MUTATION THAT DOES NOT FAIL MAY MEAN THE GUARD IS REDUNDANT.** Assert the REASON.
- **CARRY A HARNESS BYTE-IDENTICAL ACROSS BOTH CHECKOUTS.** Stop the dev server before
  clearing `.next`.
- **PROVE INERTNESS, DON'T INFER IT.** **RENDER THE STATE NOBODY SEES.**
- **REPORT RALPH THREE WAYS WHEN THE TOTAL MOVES**, and **do not pad it** — #176 correctly
  added no suites because its subject was invisible to ralph.
- **THE TWO-BUILD DETERMINISM CONTROL IS NOT OPTIONAL, AND IT CATCHES REAL DIFFS**, not
  only bad normalizers. Five catches in six PRs. **The normalizer is now COMMITTED** so its
  documented bugs cannot recur.
- **A DOCUMENTED BUG IN A REBUILT TOOL WILL RECUR.** Commit the tool, do not document the
  bug.
- **A NORMALIZER MUST NOT BECOME A BLINDFOLD.** Masking JSON-LD dates would hide a real
  content change; restoring mtimes in the harness keeps the gate sensitive.
- **THE STRIP-TYPES CONSTRAINT IS ARCHITECTURAL.** Five occurrences. Either a
  dependency-free leaf or inject its dependencies. **Extracting a shared module can silently
  make its CALLER untestable** — `login-throttle`, accepted deliberately.
- **WIDENING A UNION TYPE SILENTLY REROUTES ITS TERNARIES.**
- **A CONCLUSION CAN DECAY WITHOUT ANYONE TOUCHING IT.** When a PR adds to a schema, check
  what else keyed off that schema's shape.
- **VERIFY A UNIT BEFORE COMPUTING WITH IT.** `68ch` resolves against the wrapper's
  font-size, not the prose font-size — 745.9px, not 646. A whole threshold was wrong by
  190px because nobody measured. **Measure the resolved value; do not derive it.**
- **DERIVED NUMBERS DECAY QUIETLY.** The 2.13 dimming factor was read as a contrast ratio.
  State what a number IS, not just its value.
- **DESIGN REFERENCE FILES ARE VISUAL SPEC, NOT PORTABLE CODE — and specifically unreliable
  about ARCHITECTURE.** Eight errors across two files, including one that recommended
  rebuilding a deliberately removed pattern.
- **A NAME IN A STATE FILE IS NOT EVIDENCE THAT THE THING EXISTS.**
- **A GATE THAT MISFIRES GETS REWRITTEN, NOT WORKED AROUND.**
- **A SOFT CLAIM IN A MERGED PR IS WORTH RE-CHECKING.**
- **STOP RATHER THAN WORK AROUND AN IMPOSSIBLE INSTRUCTION**, and **STOP RATHER THAN SHIP
  HALF A PR WITHOUT ITS GATES** — the gates are the half that catches the mistakes.
- **REFUSE TO WRITE A FALSE RECORD.** #177: I asked for a correction my own measurements
  contradicted, and the right response was to refuse and show the numbers.
- **`/dev` ROUTES ARE DEV-ONLY** and 404 under `next start` — now in CLAUDE.md. Production
  studio verification needs a real login and is OWNER-ONLY. **Prefer fixes that remove the
  dependency being tested**, so a dev-only proof holds in production by construction.
- **Investigate before scoping.** A PR that quietly contains a feature is unreviewable.

---

## HAZARDS AND KNOWN DUPLICATIONS

1. **The 236px coupling** (#165) — comment-enforced only. **About to become a second
   literal** in the 3-pane work.
2. **`StudioModal`'s no-portal dependency** (#168).
3. **`keystatic.config.ts`'s mirror of the image bases** (#172) — test-enforced. **OPEN:
   does the cross-check compare the full key set in both directions?**
4. **Blog's duplicated splice** (#173) — deliberate, eight lines.
5. **Sweep gaps #2–#4** (#174) — the projects form tables still lack `heading`.
6. **`login-throttle` is unreachable by ralph** (#175) — a deliberate trade.
7. **Two `useDraftForm` instances in the blog editor** — easy to assume one form once their
   fields share a pane. #174's defect class.

---

## DEFERRED — scoped, not built

- **Images inside a post body — ONE question, not three deferrals.** `imageBlock`, the
  hidden poster, and inline figures are the same decision. **This is the next real gap: no
  inline images in a post body today.**
- **The button system.** 87 buttons across 18 files.
- **Body scroll lock for modals.**
- **Skills sidebar count** (#165 D3) — needs a semantic decision: categories or total.
- **`ContentCard.tsx` → `OverviewRow.tsx`** (#166) — the condition never fired.
- **Home/End keys** and a standing ralph suite for `ListDetailLayout` (#167).
- **`inputCls` duplicated across 8 files** (#168).
- **Post renaming** — create-new, move assets, delete-old. The title is read-only for this.
- **Blog pagination**, an OG route, RSS, the share row.
- **PublishBar centring over the canvas** rather than the work area (131px collapsed).
- **CLAUDE.md staleness beyond the blog bullet** — the build sequence ends at Phase 5 and
  Open items still lists confirming the editorial direction, long settled.

---

## OWNER-ONLY VERIFICATION BACKLOG

1. **#164's revert path** in github mode against a scratch repo.
2. **#159's live `/studio` category save.**
3. **Authed screenshots** across #165–#169.
4. **#175's real Upstash round trip**, the edge cache caching, real concurrency, and the
   free-tier command limit — verify in the Upstash console rather than trusting a figure.
   Note the POST is **five commands across three round trips**, not two.
5. ~~#173's write path~~ and ~~#174's editor~~ — **CLOSED by `4e900c9`.**
6. ~~#177's nav label in production~~ — **CLOSED, reads white.**

---

## DESIGN REFERENCE FILES (docs/studio/)

- `work-section-overlay-grid.html` — corrected during PRs 2, 3 and 4.
- `blog-homepage.html`, `blog-article.html` — corrected in #171.
- `studio-blog.html` — **replaced wholesale by the owner**, then edited in #177 (the `.seg`
  convention). **Needs the corrections listed in the handoff section.** Eight errors to date.
- `studio-shell.html` — corrected three times.
- Six untracked explorations, unrelated, left alone.

---

## SESSION PR/SHA LOG

- **#159–#162** work-section rebuild · **#163** NCR-1 (`e90742f`)
- **#164** SegmentedToggle (`2a87d96`) · **#165** full-bleed shell (`4228b14`)
- **#166** overview rows (`54be07e`) · **#167** ListDetailLayout (`5839039`)
- **#168** StudioModal (`7e591ae`) · **#169** chrome pass (`0d21a93`)
- **#170** blog schema (`92f8378`) 571→588 · **#171** blog public pages (`c164c85`) →601
- **#172** collection image paths (`a6bc8b9`) →630 · **#173** write seam (`c9bd10d`) →749
- **#174** editor host (`9a25bc0`) →793 · **#175** love store →900
- **#176** love UI (`2ad4856`) 900 · **#177** tooling + nav (`fe4b08d`) →930
- `2d837f2` docs: /dev routes are dev-only · `bbf6d3d` docs: blog conventions in CLAUDE.md

---

## WHAT'S NEXT

1. **PUSH `feat/blog-editor-3pane`** — `a586e98` is local only.
2. **Finish the relayout in a fresh session**, per the handoff section. The gates are the
   half that catches the mistakes; do not split them from the build again.
3. **`imageBlock`** — built once, in the final shell. The one real authoring gap.
4. **Write 3–4 posts through `/studio`**, flipping the existing draft to Published.
5. **The nav link** — one line, and the launch switch.
6. **Later:** migrate other studio pages to the 3-pane shell, extracting at the SECOND
   consumer.

Ralph pilot remains validated for MECHANICAL, bounded work only. Design decisions and new
arcs stay human-gated, one at a time. Never auto-merge, never write main unattended.
