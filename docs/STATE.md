# PROJECT: akshitas.com — /studio content editor

Next.js 15 App Router portfolio (repo: sinhasagar01/akshita-portfolio) with a custom
/studio dashboard that edits site content via an authenticated GitHub-commit pipeline
(draft branch → publish = merge to main → Vercel rebuild). Built by Sagar.

---

## STATE (as of THE CANVAS DRAWS THE WHOLE ARTICLE)

**main** = `fc8c318` = #191 (STATE). Pinned: `3b71ac4` = #190 (the canvas draws the
head, the hero and the body),
`c3b30f4` = #189 (the bold toolbar, extracted), `f233acc` = #188 (STATE + the two rewrites
#187 missed), `2c258cd` = #187 (the inline canvas), `f7426a5` = #186 (STATE),
`198e503` = #185 (nav link, sitemap, dead component), `4bc1573` = #184
(the post published), `1e3e433` = #183 (ralph in CI), `db907ed` = #182 (the truncated
sentence restored), `3093538` = #181 (STATE), `82edf03` = the owner's publish that carried
the truncation, `d5bd37a` = the hero-image write (ONE line, the splice proven a second
time), `41fc15f` = #180 (imageBlock), `f54574a` = #179 (STATE), `438bf95` = #178 merge (the
3-pane blog editor), `0f23e5d` = #178's commit, `bbf6d3d` = CLAUDE.md blog conventions, `fe4b08d` = #177 merge (tooling + nav
fixes), `2ad4856` = #176 merge (love UI), `2d837f2` = the CLAUDE.md
proof-and-verification note. Earlier: `9a25bc0` = #174, `c9bd10d` = #173, `a6bc8b9` = #172,
`c164c85` = #171, `92f8378` = #170, `0d21a93` = #169, `7e591ae` = #168, `5839039` = #167,
`54be07e` = #166, `4228b14` = #165, `2a87d96` = #164, `e90742f` = #163.

**ELEVEN MERGED BRANCHES ARE STILL PRESENT**, local and remote. `feat/blog-canvas-hero`
(#190) was deleted on merge; nothing before it was.

**DO NOT CLEAN THEM UP WITH `git branch --merged`.** This repo squash-merges, and a squash
merge makes a NEW commit rather than making the branch an ancestor, so `--merged main` lists
only `feat/blog-editor-3pane` (a true merge commit, `438bf95`) and `ralph/phase1` —
**every squash-merged branch reports as UNMERGED even though its content is on main**. The
command would keep exactly the wrong set. Delete against the PR list or `gh pr list --state
merged`, never against ancestry.

**THE BLOG IS LAUNCHED.** Five block kinds all renderable and reachable, one post
PUBLISHED, the nav link shipped, and `/blog` plus the post in the sitemap. Verified on
production: `www.akshitas.com/blog` returns 200, the home page carries three `href="/blog"`
occurrences (desktop bar, scrolled sheet, mobile menu), and the sitemap lists 7 URLs.

**THE REMAINING WORK IS CONTENT.**

### RALPH IS 1151 ACROSS 32 RUNNABLE SUITES
Chain: 571 → 588 (#170) → 601 (#171) → 630 (#172) → 749 (#173) → 793 (#174) → 900 (#175)
→ 900 (#176, no suites — its subject was DOM geometry and browser cache behaviour, which
ralph structurally cannot see) → 930 (#177, `studio-nav-active` 30) → 993 (#178,
`three-pane` 43 + `blog-search` 20) → 1028 (#180, `image-block` 30 + `blog-registry`
44→49) → 1029 (`blog-serialize` 32→33, the G3 repair below) → 1068 (#187,
`inline-canvas` 39) → 1075 (#189, `inline-canvas` 39→46) → 1118 (#190, `canvas-hero` 43)
→ 1144 (#190, `canvas-head` 26) → 1151 (#192, `blog-reading-time` 13→20).

**THE PER-FILE LIST IS NO LONGER HERE, and that is deliberate** — `ralph/run.mjs` prints
it, so it cannot drift from the total the way it silently did before #183.

**RUN IT WITH `npm run ralph`** (or `node ralph/run.mjs`). The runner is COMMITTED, so CI
and humans use the same tool and cannot disagree. "There is no npm script" was true until
`ci/ralph` and is no longer.

**THE COUNTING NOTE IS RETIRED.** STATE carried this for six PRs: "`rich-markers` reports
`✓`/`63 passed` rather than `[PASS]`, so a naive grep undercounts by 63." The runner reads
each suite's OWN summary line and falls back to `[PASS]` only for the eleven suites that
print none, so `rich-markers` counts correctly with no special case. That is #177's rule
applied again — **COMMIT THE TOOL, DO NOT DOCUMENT THE BUG.** Do not reintroduce an ad-hoc
shell loop; it is what re-learned this trap every session.

The runner prints the per-file list, the sum and the suite count from the SAME rows, so the
list and the total cannot drift apart — they did once, undetected for six PRs.

**PASS/FAIL IS THE EXIT CODE, never parsed text.** All 32 runnable suites end with
`process.exit(failures === 0 ? 0 : 1)`, verified. (This line read "29" while the heading
above it read 30 — a drift of exactly the kind the committed runner exists to prevent, and
one this file introduced by hand. Both are now re-derived from a run rather than edited.) Parsing is for the count only, which is
reporting, not verdict. It also fails a suite that **exits 0 having asserted NOTHING** — a
gate that reports zero subjects is not a pass.

`parity.mjs` is excluded and NAMED as skipped, never silently dropped. It needs a running
dev server and is driven from a browser console.

### SEVEN ARCS COMPLETE
1. **Work-section rebuild — COMPLETE** (#159–#162).
2. **Studio restyle — COMPLETE** (#164–#169).
3. **Blog — COMPLETE** (#170–#176), plus #177 tooling and nav fixes.
4. **The 3-pane editor relayout — COMPLETE** (#178, merged `438bf95`).
5. **imageBlock, the last authoring gap — COMPLETE** (#180, merged `41fc15f`).
6. **The inline-editable canvas — COMPLETE** (#187, merged `2c258cd`), plus the bold
   toolbar (#189, merged `c3b30f4`).
7. **The canvas draws the whole article — COMPLETE** (#190, merged `3b71ac4`).

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
BEEN REVERSED BY THE OWNER** and superseded by #178 — see ARC 4.
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
**One post, `status: published`, with a hero image set.** This has flipped three times, so
read it from the file rather than from here:
`content/blog/what-a-data-table-teaches-you-about-trust.yaml`. `/blog` renders one card and
the article renders; both are now LINKED from the nav and listed in the sitemap.

**PUBLISHING IT WAS A DIRECT COMMIT (#184), NOT A STUDIO WRITE**, so the status write path is
STILL unexercised and owner-backlog items 7 and 9 stay open. `validateBlogPost` was run
against the file REWRITTEN AS PUBLISHED before flipping, because drafts are not judged and
validating it in place would have proven nothing. `dynamicParams: false` means the BUILD
decides whether the article exists, so it was proven by building rather than by reading the
diff.

**`heroImage` IS NOW SET** to `/images/blog/what-a-data-table-teaches-you-about-trust/heroImage.webp`.
The previously-orphaned webp became the referenced hero, so the accepted orphan posture no
longer describes this file. `date: '2026-07-24'` is still SINGLE-QUOTED, so #173's splice
invariant has survived every write since — including two real ones (see below).

### A REAL PUBLISH LOST A SENTENCE — RESTORED, AND THE WRITE PATH WAS NOT AT FAULT
The owner set the hero image through `/studio` and published, in `d5bd37a` then `82edf03`.
**The publish carried a TRUNCATED PARAGRAPH into main**: the opening block ended
`"morning, for as long as "` — mid-sentence, with a trailing space — instead of
`"morning, for as long as anyone could remember."` Restored byte-identically from `41fc15f`.

**THE WRITE ROUTE IS EXONERATED BY THE COMMIT SHAPE, and this is why the surgical bar
matters.** `d5bd37a`, the hero-image write, touched **exactly one line** — `heroImage: null`
to the path — with the whole `blocks:` tail untouched. That is #173's splice doing precisely
what it promises, on a second real commit after `4e900c9`. The truncation is not in it. It
arrived through the PUBLISH MERGE, which means the editor had saved a field in that state
onto the draft branch earlier.

**THE LIKELY MECHANISM IS SAVE-ON-BLUR CAPTURING A MID-EDIT STATE** — the discipline working
as designed, preserving a half-deleted sentence because a blur fired while the text was
partially removed. **PUBLISH IS WHOLE-BRANCH** (#170), so everything sitting on the draft
branch ships together, and a half-finished edit is indistinguishable from a finished one.
The draft branch `studio/draft-site-settings` no longer exists on origin, so nothing else was
queued — but **this is the first observed cost of whole-branch publish, and it is a content
risk with no gate on it.** Ralph cannot see it: the file was structurally valid and
`validateBlogPost` returned ok throughout.

**#178's gates wrote NOTHING to content.** `STUDIO_WRITE_MODE=fs` locally, so every
save-draft branch no-ops; the editor was driven through real edits and `git status content/`
stayed clean, with `topic` still `Enterprise UX` rather than the gate's test value. That is
also the reason G2 and G4 could assert on REQUEST BODIES rather than on committed files.

---

## ARC 4 — THE 3-PANE BLOG EDITOR (COMPLETE)

Two commits. `a586e98` was groundwork on a branch; `0f23e5d` finished it; `438bf95` is the
#178 merge. The owner reversed #174's index-plus-full-width decision, so
`/studio/blog/<slug>` is now list + canvas + inspector.

### THE POINT OF THE ARC, AND IT WAS A REAL BUG
The canvas renders the article's own components at the PUBLIC measure, so what the author
sees is what the article ships. THE SCOPE IS THE HEAD, THE HERO AND THE BODY — the back link
and the love block are not drawn, which is a composition choice rather than a fidelity gap.
(It read "through `BlogProse`" until #190 added the hero and the head.)
`BlogBlocksEditPanel` has CLAIMED the fidelity property since #174 and it was
**FALSE BY 48px**: the public article is `max-w-[68ch] px-6`, the studio canvas was
`max-w-[68ch]` with no padding. Adding `px-6` makes it true for the first time.
**A1 measured both content boxes at `697.9296875px`, delta 0.** Proven as a NUMBER, not as
matching class strings, because `68ch` resolves against each element's own font-size.

### THE ARITHMETIC, CORRECTED AND NOW LOAD-BEARING
`68ch` is **745.9px at the wrapper's 16px font**, not 646 from the 18px prose.
**sidebar 236 + list 264 + canvas 794 + inspector 244 = 1538.** The contract said 1406 and
was wrong by 190px. Both numbers live once each in `lib/studio/three-pane.ts` and are read
through `matchMedia`, never as Tailwind variants — see the new working rule.

### COMMITTED IN `a586e98` (groundwork)
D1 padding move across 9 pages via `STUDIO_PAGE`; `HeroImageField` gains `label`; the blog
poster field hidden by parameterising `VideoEmbedForm` with `showPoster`; `ThreePaneShell`
drafted.

### COMMITTED IN `0f23e5d` (the relayout)
- **`ThreePaneShell` mounted.** Geometry and the collapse rule in `lib/studio/three-pane.ts`.
  `isListCollapsed` takes a THREE-STATE intent, because a boolean cannot distinguish
  "nobody chose" from "the author chose open" — and an author who reopened the rail on a
  narrow screen did so knowing it was narrow.
- **`BlogPostList` — SEARCH AND NAVIGATE ONLY.** Create and delete stay on `/studio/blog`,
  so those two write surfaces keep one implementation each.
- **The inspector is TWO STACKED SECTIONS**, Post then the selected block. Building the
  contract literally would have deleted blog's only block-editing surface.
- **Selection is a BLOCK STRIP, and clicking the prose is MOCK-ONLY.**
  **SUPERSEDED BY #187 — see ARC 6.** The reasoning below was sound about the two mechanisms
  it examined and simply did not consider a third. Both ways to make the
  canvas clickable spend the property the PR exists to protect. A per-block wrapper changes
  the canvas DOM relative to the article (CLAUDE.md's editable-only-wrapper failure mode).
  Counting rendered children derives the mapping from `BlogProse`'s output shape, where a
  `richText` block emits **one paragraph PER ENTRY** rather than one element, so a change to
  that shape breaks selection SILENTLY.
- **Two LABELLED save indicators** via `SaveIndicator`, whose `label` is required in the
  type. Two unlabelled ones read as one form, which is #174's defect class and hazard 7.
- **`lib/studio/blog-search.ts`** — one filter, used by the index and the rail.
- `useMediaMin` via `useSyncExternalStore`, server snapshot always WIDE.

### FOUR CORRECTIONS TO THE RECORD, two of them this file's
1. **`FIT_THRESHOLD_PX` HAD ZERO CONSUMERS** repo-wide, including its own file, while the
   shell's comment described max-width variants that did not exist. The collapse ran off a
   boolean and the layout never responded to width. **STATE said the collapse was built.**
   A comment describing absent code is exactly how `structural()` became a name people
   believed in. Code and comment were fixed TOGETHER.
2. **The branch was already pushed.** "LOCAL ONLY, push it first" was stale.
3. **"A fixed canvas measure" was not in the shell.** The canvas arrives as an opaque
   `ReactNode`; the measure lives in the panel.
4. **The inspector comment's caret claim was wrong.** `display:none` keeps React state and
   drops the caret.

### FOUR BUGS THE GATES FOUND, NONE VISIBLE IN SOURCE REVIEW
- **`inert: "" as unknown as boolean` WAS THE BUG, not the workaround.** React 19 supports
  `inert` as a real boolean and treats `""` as FALSY, so React dropped the attribute
  entirely and all three controls in the collapsed pane stayed tabbable — the exact focus
  trap the line existed to prevent, introduced by the code written to prevent it. G3
  settled it: plain `inert={collapsed}`, no cast, and the documented `visibility: hidden`
  fallback is not needed.
- **`w-0` computed to 264px.** A flex item defaults to `min-width: auto`, floored at
  min-content by the inner `min-w-[264px]`. Needed `min-w-0`. The class was right and the
  box ignored it.
- **The height chain did not hold.** `overflow-hidden` does NOT remove a box's own content
  from intrinsic sizing, and `flex-1` divides free space only when the container's height is
  already resolved. The shell measured 1230px in a 960px viewport. Fixed in the layout with
  a viewport height at `lg`, **scoped by `:has([data-studio-fullheight])`** — applied
  unconditionally it made the bottom of every OTHER studio page unreachable at a short
  viewport (measured on `/studio/projects` at 420px: body clientHeight 420 against
  scrollHeight 520, and neither the window nor body would scroll the last 100px).
- **The width transition animated the HYDRATION CORRECTION**, so the rail visibly slid shut
  on every narrow page load. Now it runs on explicit toggles only.

### TWO HAZARDS SURFACED
- **`lib/site.ts` IMPORTS `node:fs` AT MODULE SCOPE and carries no server-only marker.**
  Importing `blogPath` into a client component pulled fs into the client bundle and failed
  the build **APP-WIDE**, with a webpack `UnhandledSchemeError` far from the import that
  caused it. The href is now computed on the server and passed down as a prop.
- **THE #175 TAILWIND SOURCE-SCOPE HAZARD RECURRED, from COMMENT TEXT.** Three phantom
  rules reached production CSS because comments quoted utility names verbatim. #177 fixed
  the `ralph/` case by excluding the directory; `components/` cannot be excluded, so the
  comments were reworded. **Caught by the CSS gate, not by review.**

### THE CONTRACT IS CORRECTED — TEN ERRORS TO DATE
Applied to `docs/studio/studio-blog.html`: the 1406 arithmetic and its five literals, the
620 measure, and **THREE** widening sites rather than the two previously listed (the third
sat inside the fit media query, so deleting the named two would have left the measure still
moving). Also the pane widths (288/262 → the shipped 264/244), the `transition:max-width`
that existed only to animate a change that must not happen, the mock-only nav hover nudge,
and the rich-text toolbar listed as reusable when the studio's only toolbar is in
`SectionsEditPanel`. **Error 6 self-resolved** — the poster field was claimed hidden before
#174 shipped it and `a586e98` made the claim true, which is recorded rather than deleted.
**Error 9 is click-the-prose selection. Error 10 is the third widening site.**

### GATES
| Gate | Result |
|---|---|
| A1 measure equality | **697.9296875px both sides, delta 0** |
| G1 panes at 1560 | 264 / 801 / 244, canvas clears the 794 required |
| G2 round trip | reorder fired **ZERO** requests; the explicit save carried the new order with the edited text at the new index |
| G3 collapsed-pane inertness | 3 controls inside, **0 accepted focus** |
| G4 two forms | two disjoint bodies, `{collection,slug,patch}` and `{collection,slug,blocks}` |
| G5 the 1100 fold | exactly ONE form tree, no hidden copy |
| G6 ralph | 930 → 993, 28 suites, 0 failures, both new suites mutation-tested |
| G7 typecheck | clean. **NO LINT GATE EXISTS** — the repo has no ESLint config, so `next lint` only offers to create one |
| G8 CSS bundle | **zero changed declarations** on any shared selector |
| G9 determinism | two builds byte-identical through the committed normalizer |
| parity | RUN, not reasoned about. 3 of 4 slugs, 44 sections, 0 findings |

**G1–G5 are DEV-OBSERVED**, driven through a temporary dev-only session route deleted before
commit. Per CLAUDE.md they carry NO production claim.

**`boat-crest` renders 0 parity pairs** on this checkout while the other three render 15, 14
and 15. Pre-existing and unrelated to this arc, but it means the parity gate has been blind
to the hero case study for an unknown number of PRs. **Worth investigating.**


---

## ARC 5 — imageBlock, THE LAST AUTHORING GAP (COMPLETE)

`#180`, squash-merged `41fc15f`. One PR, because STATE framed `imageBlock`, the hidden
`videoEmbed.poster` and inline figures as ONE question and that framing held.

### RE-ADDING, NOT INVENTING — the investigation's strongest finding
`blog-article.html` DREW two inline figures. #171 REMOVED them and recorded why:

> *"There is no single-image block; `imageBlock` is net-new and needs the block-image upload
> path, **which is hardcoded to projects and is the WRITE PR's fix.**"*

Both removal sites were still marked in the markup, the figure CSS was never deleted, and
the locked decision *"figures may break wider than the measure; nothing else does"* was still
in force. **#172 made that path take a required per-collection base, so the blocker expired
and nobody noticed.** A DEFERRAL'S STATED BLOCKER CAN EXPIRE WITHOUT ANYONE REVISITING IT.

### THE GATE MATTERS MORE THAN THE FEATURE
`BlogProse` dispatched through a `switch` with `default: return null`. A kind in the picker
and the registry but missing there produces a block the author can add, fill in and save
that renders as **NOTHING** — and because the canvas and the article are the SAME component,
it looks consistent and correct in both. **That is the shape of the failure that left
`videoEmbed.poster` authorable and invisible for three PRs.**

**A `satisfies never` in the default arm CANNOT fix it, and this is the durable rule.** The
discriminant arrives as `unknown`, TypeScript cannot exhaustiveness-check a switch over
`unknown`, and narrowing with `as BlogBlockKind` to reach a `never` arm DEFEATS the check —
it would compile forever and prove nothing. The dispatch is now
`RENDERERS: { [K in BlogBlockKind]: … }`, which makes a missing kind a real compile error
and deletes the silent default.

**`RENDERABLE` STAYS HAND-WRITTEN rather than derived from that table.** Its own comment
says it asks what the renderer handles and that a disagreement is a real bug it should
SURFACE rather than inherit. Deriving it would launder exactly that disagreement. Ralph
asserts `BLOG_PICKER_ORDER ⊆ RENDERABLE`; the type system does not paper over it.

### THE SCHEMA — five fields, and NOT `imgSpecFields`
`src`, `alt`, `caption`, `wide`, `decorative`. `imgSpecFields` would drag
`width/rotate/translateX/translateY/z/frame` into a prose column. Those exist because a
case-study image is **COMPOSED** on a free canvas; a figure in a 68ch measure is **PLACED**.
Six authorable fields the renderer ignores is the poster condition six times over.

**ALT IS OPTIONAL AT SAVE, ENFORCED AT PUBLISH.** A block is born `src: null, alt: ""`, so
refusing empty at save makes the kind unaddable — `videoSrc`'s own reasoning, applied to a
second field. `validate-blog-post` judges published posts only, so it is the one gate an
author cannot walk past and therefore the only place "required" can be real. **A required
field the author can leave empty is not required.**

**`decorative` IS THE DELIBERATE EXEMPTION.** Without it an author facing the gate types
`"image"` into alt to clear it, which is WORSE than empty: empty is an absence a screen
reader skips, `"image"` is confidently wrong. Renders `alt=""`, the correct HTML.

### THE BLEED WAS A REAL BUG AND A1 COULD NOT SEE IT
The contract used `clamp(0px, 7vw, 120px)`. **`vw` resolves against the VIEWPORT**, but the
canvas and the article give the same column different room around it, so a wide figure
behaved differently on each **while A1 still passed — because A1 measures the WRAPPER, not
the child.** Now `margin-inline: -17%`, a percentage of the column, identical on both.

**A CORRECTION TO THE PLAN'S OWN PREDICTION.** The plan expected a wide figure to CLIP in
the editor and accepted that as a trade. **It does not clip.** The canvas scroller is
`overflow-y-auto`, and CSS computes the other axis to `auto`, so the pane scrolls
horizontally instead — measured with the list open: `clientWidth 786, scrollWidth 861,
maxScrollLeft 74.5`. Nothing is unreachable; collapsing the list removes the scroll.

### THE POSTER BUG — FOUND IN REVIEW, NOT BY A TEST
Un-hiding the poster meant `BlogProse` renders it publicly for the first time. It rendered
**927.9px tall inside a 392.6px frame**, overflowing by 535px and clipped by the frame's
`overflow-hidden`, so it looked like a badly CROPPED image rather than a broken one.

**CAUSE, AND IT GENERALISES:** `app/globals.css:271` carries an UNLAYERED
`img, video { max-width:100%; height:auto; display:block }`. **Unlayered rules beat
`@layer utilities`, so `h-full` SILENTLY LOSES on every `<img>` in this project.** The
identical classes worked on the `<iframe>` beside it, which is what made it read as a
component bug rather than a cascade one. An inline `height: 100%` resolving to 390.578px
identified it. Fixed with a `blog-`prefixed authored rule; measured after, poster
695.9×390.6, exactly matching the iframe. The inline figure was NOT changed — it WANTS
`height: auto`.

### GATES
| Gate | Result |
|---|---|
| A1 / G2 geometry | **IDENTICAL on all three surfaces** — wrapper content box `697.9296875` on the article, the canvas with the list open, and the canvas collapsed. Normal figure `697.93`, wide figure `935.21` everywhere |
| G3 CSS | **union-of-declarations: ZERO** selectors changed. The two rules a naive diff flagged were selector-list REGROUPING (the merged `h2,blockquote` rule split when the figure CSS broke its adjacency; every declaration survives). 5 added selectors, all proven `blog-`prefixed **by grepping the emitted bundle** |
| G4 DOM | public HTML **byte-identical**, and the honest reason is that **no post uses the kind YET**, not that nothing changed |
| G5 determinism | two builds byte-identical |
| G6 ralph | 993 → **1028**, 29 suites, 0 failures. `image-block` 30, `blog-registry` 44→49. 8 mutations, all caught |
| G7 typecheck | clean. No ESLint config, so no lint gate |

**D1 MEASURED, NOT DERIVED.** `BlockImageField` FITS the 244px inspector — 204px row, no
overflow, no wrap — but the path readout compresses to **27.6px**, narrower than the 38px
the arithmetic predicted. **Left as is:** `ImageThumb`'s own header already records that a
content-addressed filename *"tells the owner nothing about which image is actually set"* and
that the thumb is the identification, so nothing informative is lost and projects is
untouched.

**UNVERIFIED:** no `imageBlock` has been written through the LIVE seam. `STUDIO_WRITE_MODE=fs`
locally, so every save-draft branch no-ops. Ralph covers the serializer against the real
content file, including that `date: '2026-07-24'` stays single-quoted and the head splices
byte-identical — but that is not a commit. Browser measurements are DEV-OBSERVED.


---

## THE LAUNCH — #182 to #185

Four small PRs that turned a feature-complete blog into a launched one, plus one incident.

### #182 · the truncated sentence, restored (`db907ed`)
Recorded in CURRENT CONTENT STATE and hazard 13. A publish carried a half-finished edit
into a live post; the write route was exonerated by `d5bd37a` touching exactly one line.

**It also found `main` RED and unnoticed.** `blog-serialize`'s G3 read the live post and
pinned the literal `heroImage: null`; the owner set a hero image and the suite had been
failing since `82edf03`. The PROPERTY never broke, only the hardcoded expectation. Repaired
by splitting it — a FIXTURE owns the null case, the live file is asserted for INVARIANCE.

### #183 · ralph in CI (`1e3e433`)
`.github/workflows/ralph.yml`, on every PR and every push to main, **no paths filter** —
the break that prompted it was a CONTENT commit.

**`ralph/run.mjs` IS THE LARGER HALF.** One tool for CI and humans, so they cannot disagree.
It retires the counting note by reading each suite's own summary; it reports the per-file
list, the sum and the suite count from the SAME rows so they cannot drift; **pass/fail is
the EXIT CODE, never parsed text** (four summary formats are in use); and it **fails a
suite that exits 0 having asserted NOTHING**. Mutation-tested three ways.

**CI CAUGHT A HIDDEN DEPENDENCY ON ITS FIRST RUN.** `upstash-transport.mjs` does
`git show 9a25bc0:…` to pin the PRE-EXTRACTION source, so it needs GIT HISTORY, and
`actions/checkout` shallow-clones by default. Fixed with `fetch-depth: 0` and a comment
saying why, since the obvious optimisation is to delete it. Reproduced both ways before
fixing rather than inferred from the error.

### #184 · the post published (`4bc1573`)
`/blog` showed "Coming soon" because the only post was a draft. **Not a bug** — #170's
status gate and #171's three leak defences, both working. One line, `draft` → `published`.
Pre-flighted by validating the file REWRITTEN AS PUBLISHED, and proven by BUILDING, because
`dynamicParams: false` means the build decides whether the article exists at all.

### #185 · the nav link, the sitemap, and a dead component (`198e503`)

**THE NAV LINK WAS NEVER "ONE LINE".** The site nav was built for ANCHORS ONLY — `NAV` is
`{ id, label }` where `id` is a home-page section, rendered `#id`, `preventDefault`'d,
scrolled to `getElementById(id)`, and fed to a scroll-spy. The naive entry would have
produced `href="/#blog"`, an anchor to a section that does not exist, plus a handler that
CANCELS the navigation and then scrolls nowhere — a link that renders perfectly and does
nothing, in all three render sites. `href` is now the discriminator; both handlers return
early for a route; the spy skips routes; and `SectionId` is
`Exclude<NavItem, { href: string }>["id"]`, so a route id reaching a scroll handler is a
TYPE ERROR rather than a silent no-op.

**THE SITEMAP HAD NO BLOG AT ALL**, and its own comment claimed it "can never drift from
the real routes" — true when written, false the moment a second collection existed. **A
SITEMAP DOES NOT FAIL LOUDLY; IT QUIETLY OMITS PAGES.** Now 7 URLs. **Fail-closed BY
CONSTRUCTION, not by a new test:** it calls the SAME `getBlogPosts()` that
`generateStaticParams` calls, so it can only list routes that were actually prerendered, and
`blog-status-filter` already proves that seam drops drafts. That matters more here than
anywhere — `/blog/<slug>` 404s for a draft, and a sitemap entry pointing at a 404 is worse
than no entry. `blogLastModified` mirrors `projectLastModified` (file mtime, not the
authored `date`), with the SHARED known limitation that a CI checkout sets mtimes to
checkout time.

**`FooterExplore.tsx` WAS DEAD CODE AND IS DELETED.** The string appeared exactly ONCE in
the repo, in its own function declaration. Nothing imported it, nothing rendered it;
`SiteFooter` is the only footer and shows social links. Confirmed in the browser on `/` and
`/blog`: zero section anchors, no "Explore" heading. **The inconsistency it was asked to fix
did not exist**, and adding an entry would have changed nothing while letting the PR claim
the header and footer now agree. `tsc` clean after deletion is the proof nothing referenced
it.

### THE SURFACE AUDIT — keep this list
Everything that enumerates home-page sections, after #185:
- `components/layout/SiteHeader.tsx` — `NAV`, **three** render sites (bar, scrolled sheet,
  mobile menu). The only one.
- `app/sitemap.ts` enumerates ROUTES, not sections, and is the one that decays silently.
- NOT surfaces: `SkipLink.tsx` (`#main-content`), `HeroSection.tsx` (a single `#process`
  anchor), `SectionsEditPanel.tsx` (`selectedSectionId` is a case study's own sections).


---

## ARC 6 — THE INLINE-EDITABLE CANVAS (COMPLETE)

`#187`, merged `2c258cd`. The owner reversed #178's selection decision. Both reversed
records are rewritten rather than deleted — see LOCKED DECISIONS and
`docs/studio/studio-blog.html` correction 9.

### THE THIRD MECHANISM, AND WHY IT WAS AVAILABLE ALL ALONG
#178 examined two ways to make the canvas clickable and rejected both correctly. It did not
examine a third: **THE RENDERER EMITS ITS OWN INDICES.** Under an `editable` flag the
elements `BlogProse` already emits gain `contentEditable` and `data-edit-*` at render time.
Nothing is wrapped, nothing is counted, and the mapping cannot drift because it is emitted by
the same expression that emits the content. The same shape as #180's `rewriteSrc` — an
attribute on an element that already exists.

**THE GEOMETRY WAS MEASURED BEFORE ANY CODE WAS WRITTEN**, on production CSS: nine prose
elements editable, focused and selected states, figure captions — every delta ZERO at four
decimal places, A1 at `697.9296875`, wide figure at `935.2109`. `.cs-editable` uses an
OUTLINE precisely so it cannot shift layout, and `contentEditable` has no box-model effect.
**An investigation that measures the blocking gate first is what let this arc start at all.**

### A CORRECTION TO THE APPROVED PLAN, CAUGHT BY CHECKING ITS PREMISE
The plan assumed deferring the bold toolbar removed the `renderEpoch` / refocus / caret
machinery. **IT DOES NOT.** `SectionsEditPanel:1490` states that split and merge bump the
epoch *"for the same reason a bold does"* — the array changes LENGTH, so React's tree and the
contentEditable DOM disagree about how many `<p>`s exist while the author's typed DOM is
still in the subtree. Bold makes the tree untrusted by MUTATING it; a structural paragraph
edit does it by changing the element COUNT. Different cause, identical requirement.
Deferring the toolbar removes `boldDirty`, `execCommand` and the bold-then-unbold cleanup,
and nothing else. **This is the second time in three arcs that checking an approved plan's
premise changed its scope.**

### richToMarkers IS REQUIRED WITHOUT THE TOOLBAR — the sharper half
Existing posts already contain `**bold**`, which `renderRich` renders as real `<b>`. A blur
taking `innerText` would silently strip every marker **already on disk**. No toolbar means
bold cannot be AUTHORED inline; it does not mean bold can be ignored. Proven against the real
post, not a fixture.

### SAVE ON THE NEXT RENDER, NEVER IN THE BLUR HANDLER
`saveDraft` closes over `values`, so calling it beside `setBlockValue` posts the PRE-EDIT
array — #174's exact defect. The inspector's fields survive `onBlur={saveDraft}` only because
their `onChange` fired on an earlier render; an inline edit has none. A `pendingSave` ref plus
an effect keyed on `values.blocks` fires it one render later. **Structural ops never set the
flag**, so #174's rule is intact.

### WHAT WAS BUILT, EXTRACTED, AND DUPLICATED
- **Extracted, byte-identical:** `paragraphCaret` and `placeCaret` → `lib/studio/inline-caret.ts`.
  Both were module-private and entirely generic. `fieldSelector` deliberately NOT extracted —
  its block branch is one template string each caller builds inline, and its other branch is
  section-shell-specific, so extracting it would drag section concepts into a shared module.
- **`.blog-editable` is a DELIBERATE DUPLICATE** of `.cs-editable` — #173's splice precedent,
  not the combinator precedent: twelve lines with no algorithm that can drift, where a rename
  would touch case-study CSS and drag the bundle gate onto an untouched surface.
  `inlineEditProps` is imported UNCHANGED. **Extract if a third collection needs it.**
- **MULTI-LINE PASTE, net-new to the repo.** No `onPaste` or `clipboardData` existed anywhere,
  so the case-study canvas has the same gap and KEEPS it. The asymmetry is deliberate: blog is
  THE paste surface, and the browser default collapses two paragraphs into one array item with
  a `<br>`, rendering as a run-on paragraph in the most common workflow there is.
- **A BLOG PARITY HARNESS** at `/dev/blog-parity/<slug>` — hazard 12's answer after three
  hand-catches. Reuses `parity.mjs`'s walker UNCHANGED and asserts a NON-ZERO pair count,
  because #180 found `sections: 0, verdict: PARITY OK` is a false pass.

### GATES
| Gate | Result |
|---|---|
| G1 article DOM | **ALL EIGHT public pages byte-identical to main**; the built article contains ZERO edit attributes |
| G2 canvas DOM | 13 elements both sides, **element tree IDENTICAL**, only attributes added |
| G3 A1 editable ON | `697.9296875` |
| G4 ralph | 1029 → **1068** across 30 suites; `inline-canvas` 39; five mutations, all caught |
| G5 extraction inert | `p4-4bii-block-forms` 132 and `paragraph-edits` 28 per-file identical |
| G6 driven | no-op blur fires **ZERO** requests; a real edit posts `{blocks,collection,slug}` with `**missing explanation**` intact; Enter splits 2→3 with the caret in the new paragraph; Backspace merges 3→2 with the caret at offset 8 (the join); paste yields THREE entries not one; selection syncs both ways |
| G7 | two builds byte-identical; CSS union-of-declarations ZERO modified, 3 added selectors all proven `blog-`prefixed against the emitted bundle; tsc clean |

**THE NO-OP BLUR IS TWO PROOFS IN ONE.** Focusing the paragraph that carries the real
`**bold**` and blurring without typing fires ZERO requests — which proves the skip holds AND
that `richToMarkers` round-tripped the on-disk markers byte-identically, because a strip would
have differed and fired.

### THREE THINGS FOUND WHILE BUILDING
1. **A mutation found a gap in the new suite.** The caret assertion used a marker-FREE string,
   where `plainLength(s)` and `s.length` are equal, so a marker-counting bug was invisible.
   Strengthened with a marker-bearing case. **Mutation testing earned its place again.**
2. **A CSS rule was written and then removed in the same PR.** `.blog-editable.is-selected`
   had no consumer, because nothing in the blog canvas applies that class. Shipping it would
   have been the authorable-but-inert condition this project keeps catching. **Consequence:
   clicking a chip gives no canvas highlight** — closing that needs `selectedId` threaded into
   `BlogProse`, deferred.
3. **BOTH MANDATORY REWRITES WERE MISSED IN #187 ITSELF** and landed one PR later. They were
   named in the approved plan as "the standing rule, not a footnote", and the build still
   shipped without them. A rewrite that lives only in a plan is a rewrite that does not
   happen — see the working rules.

### #189 · THE BOLD TOOLBAR, EXTRACTED RATHER THAN COPIED (`c3b30f4`)
`BoldToolbar` was module-private inside `SectionsEditPanel` until blog needed it. Extracted
byte-identically with `selectWholeAnchor`, so ONE definition owns which marks exist — bold,
italic and link, because those are what `RichRun` can express. A second copy would drift the
first time a mark was added to one collection. **Self-contained Tailwind, proven by a
byte-identical CSS bundle.** Ralph `inline-canvas` 39 → 46.

---

## ARC 7 — THE CANVAS DRAWS THE WHOLE ARTICLE (COMPLETE)

`#190`, merged `3b71ac4`. Two commits on one branch: the hero, then the head. The canvas
scope is now **the head, the hero and the body** — the back link and the love block stay out
as navigation and interaction rather than content.

### THE INVESTIGATION'S DECISIVE FINDING WAS A READ OF THE BUILT HTML
`next/image` with `fill` emits a **BARE `<img>` and no wrapper element**. That single fact
decided the arc. Had it emitted a wrapper, a canvas hero would have been a different element
tree by construction and CLAUDE.md's named failure mode; because it emits none, the
substitution is **same-element, different-attributes** — the identical shape as `rewriteSrc`.
The `relative aspect-[16/9]` frame is authored by the PAGE, not by next/image.
**Read from `.next`, not reasoned about**, and it is the reason there was anything to build.

### HAZARD 11 FIRED A THIRD TIME, AND THIS TIME NO BOX COULD SEE IT
The canvas `<img>` carries next/image's own inline fill style. The obvious cleanup —
`absolute inset-0 h-full w-full object-cover` — renders **391.664px against the article's
390.5781px**, because the unlayered `img, video { height: auto }` outranks `h-full`.

**The dangerous part is that the outer box is unaffected.** `aspect-[16/9]` holds the frame,
so the figure still measures `392.5781`, the prose still starts at the same y, and **A1, G2
and the parity walk all report PASS**. Only the crop inside the frame is wrong, by an amount
that scales with the source aspect's distance from 16/9 — 1.086px here, grossly more for a
portrait hero.

So the protection is **a string assertion against next/image's emitted output**, not a
measurement: `HERO_FILL_STYLE_CSS` in `lib/blog/hero-fill.ts`. The mutation that writes the
cleanup fails the suite. **This is the pattern whenever a defect is invisible to the gate
family you would reach for first — change the gate family, do not add another measurement.**

### THE COLUMN WAS HOISTED, NOT THE HERO — a catch that would have been silent
The measured 44px gap depends on `<figure>` and `<BlogProse>` being **SIBLINGS inside one
wrapper**, exactly as they are inside the article's `<main>`. Rendering the hero in its own
wrapper above the empty-post branch would have introduced a margin-collapse boundary the
article does not have. **And the figure's outer box would still have measured correctly**, so
nothing would have caught it. One column, hero and body inside it, declared ONCE — two copies
of the class string A1 pins is how the measure drifts.

### THE DEFECT THE PARITY WALK STRUCTURALLY CANNOT SEE
`id="blog-article-head"` is resolved by `ReadingVessel` through `document.getElementById`,
and the harness renders **both sides on one page**. An unconditional id would put a duplicate
in the document and hand `getElementById` whichever came first. **The walk compares BOXES, so
it would report that clean.** The id is conditioned on the `canvas` flag — an attribute
difference on an element present on both sides — and the assertion lives in ralph. A second
instance of the general rule above.

### PREVIEW ONLY, AND THE READ-ONLY TITLE HAS A SCHEMA REASON
Three of the head's five fields are not unimplemented, they are **uneditable**:
- **`title` IS THE SLUG.** `keystatic.config.ts` declares `slugField: "title"` with
  `fields.slug`, and `sanitizeBlogPatch` rejects the key — *"title is the entry slug and
  cannot be edited here"*. A contenteditable title would **400 on the first keystroke**.
  Changing it is a RENAME (new file at the new slug, move `public/images/blog/<slug>/`,
  delete the old, and the published URL HARD-404s because the article sets
  `dynamicParams = false`). That is the deferred renaming arc, not a field.
- **`readingTime` is COMPUTED** from the blocks.
- **`date` is stored `2026-07-24`, rendered `24 JULY 2026`.** Editing the rendered text means
  parsing a display format back to ISO, where a bad parse **writes a wrong value rather than
  failing loudly**.

That leaves `dek` and `topic` as the only two that could ever be inline, and a head where two
of five fields carry a dashed outline teaches no rule at all. So none of it is editable and
the inspector stays the one place the head is written.

### READING TIME IS RECOMPUTED, NOT PASSED DOWN
The article computes it from the blocks, so a canvas showing a server-supplied number would
drift the moment a paragraph was added — **and the drift would read as a rendering bug rather
than a stale prop.** `readingTimeMinutes` and `formatLongDate` are both dependency-free (zero
imports), so the canvas runs the same functions the article does. The head's `dek`, `date`
and `topic` come from `useDraftForm`'s working copy, so the canvas tracks the inspector as it
is typed. **Driven: removing blocks moved it 2 min → 1 min.**

### THE draftImages SNAPSHOT GAP, CLOSED
`draftImages` is read server-side at page load, so a hero uploaded DURING the session is on
the draft branch but not in that array — the rewriter leaves the path alone, it 404s against
main, and the canvas shows a broken frame. **The bug the draft proxy exists to prevent,
reappearing one layer up because the proxy's input is a snapshot.** `onChanged` was widened to
carry `{ heroImage, previewUrl }` and the object URL wins.

**The widening was additive.** Both call sites pass zero-arg arrows, and a lower-arity
function is assignable to a higher-arity type, so projects compiled untouched — the check that
decided it was safe to widen a shared component rather than fork it. Proven, not inferred: the
projects hero field's DOM hashes identically before and after.

### GATES
| Gate | Result |
|---|---|
| G1 article DOM | **Byte-identical to main** across all 9 normalized files, re-run after BOTH commits. Two-build determinism control clean first. LCP preload and srcset survived nesting. |
| G2 hero box | figure `697.9297 x 392.5781`, img `695.9297 x 390.5781`, gap `44` — the article's production values, delta 0 |
| G3 A1 | `697.9296875` with hero AND head present, **both pane states** |
| G4 branches | hero; no-hero **identical on both sides**; hero + zero blocks still shows the hero |
| G5 parity | **3 pairs** (head 7, hero 3, prose 10 elements per side), **0 findings**, one `#blog-article-head`, zero duplicate ids |
| G6a | the canvas renders a real `blob:` src at an unchanged box |
| G6b | **UNVERIFIED, owner-only** — see the backlog |
| G7 projects | DOM hash identical (`ad38db8`, 27 nodes); a real file driven through the picker hits the fs branch with ZERO JS errors |
| G8 | ralph 1075 → **1144** across 32 suites; nine mutations, all caught; **CSS bundle BYTE-IDENTICAL** — zero selectors added, which is the point of the inline style; tsc clean |

### THREE THINGS FOUND WHILE BUILDING
1. **A COMMENT OF MINE WAS WRONG AND THE MEASUREMENT CAUGHT IT.** I wrote that the empty-post
   message "stays centred". It was never pane-centred — the unlayered `p { max-width: 68ch }`
   caps it at `599.5234px` — and moving it inside the column brings it **51.5313px CLOSER**,
   not further. The comment now carries the numbers. **A plausible claim in a comment is still
   a claim; measure it.**
2. **CONSOLE ERRORS THAT WERE STALE, NOT REAL.** A `node:fs`-in-the-client trace and an
   `inert` empty-string warning both appeared mid-session and both were buffer artifacts of a
   stash/unstash rebuild. Confirmed from three directions: no client component imports
   `lib/site`, `ThreePaneShell` has the correct `inert={collapsed}`, a fresh tab logs nothing,
   and the production build (which fails HARD on a real client `node:fs` import) succeeded.
   **Read a console error's provenance before reporting it.**
3. **`readingTimeMinutes` HAS NO `imageBlock` CASE** — found while wiring the live count, not
   fixed. See hazards.

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
- ~~**`/blog` ships live but unlinked**~~ — **THE SWITCH IS THROWN** (#185). It is linked
  from all three header render sites and is in the sitemap.
- **Blog validates PUBLISHED files only.** **No `orderIndex`, no reorder arm.**
- **Blog's splice is duplicated deliberately.** Extract on the third collection.
- **LOVE IS ONE-WAY**, client-fetched after hydration, environment-namespaced, gated on the
  published list, and **FAILS QUIET**.
- **ONE pressable love control site-wide**, the end-of-article pill.
- **The blog editor is 3-PANE** (owner reversal of #174), canvas at **68ch with `px-6`**,
  fit threshold **1538**.
- **Structural ops NEVER call `saveDraft()`.** Fields save on blur.
- **THE CANVAS MEASURE EQUALS THE ARTICLE MEASURE, AS A NUMBER.** `697.9296875px` today.
  It never widens on collapse. A measure that moves when you hide a pane is a measure that
  lies, and it is the property the whole layout exists to protect.
- ~~**BLOCK SELECTION IS THE INSPECTOR STRIP. Clicking the prose is mock-only.**~~
  **REVERSED BY THE OWNER, BUILT IN #187.** The reasoning is kept rather than deleted,
  because a reversed decision whose reasoning is deleted leaves two contradictory rationales
  and no record of which won.
  **WHY IT WAS RIGHT:** the two mechanisms #178 considered BOTH spent the fidelity property
  — a per-block wrapper changes the canvas DOM relative to the article, and counting rendered
  children derives the mapping from `BlogProse`'s output shape and breaks silently when that
  shape changes.
  **WHY IT NO LONGER DECIDES IT:** a THIRD mechanism exists that #178 did not consider. The
  RENDERER EMITS ITS OWN INDICES — the elements BlogProse already emits gain `contentEditable`
  and `data-edit-*` at render time, so nothing is wrapped and nothing is counted. That it
  costs no geometry is **MEASURED, not argued**: nine prose elements, focused and selected
  states, and figure captions, every delta zero at four decimal places.
  **STILL TRUE:** the strip stays, as A selection mechanism rather than THE one. It cannot be
  retired — a caption-less `imageBlock` or `videoEmbed` emits NO editable element at all,
  because `<figcaption>` is conditionally rendered. It shows the KIND LABEL and position,
  never a body excerpt.
- **THE LIST PANE SEARCHES AND NAVIGATES ONLY.** Create and delete live on `/studio/blog`.
- **A SAVE INDICATOR'S LABEL IS REQUIRED IN THE TYPE.** Two unlabelled indicators read as
  one form.
- **THE THREE-PANE BREAKPOINTS LIVE ONCE EACH**, in `lib/studio/three-pane.ts`, read through
  `matchMedia`. No Tailwind arbitrary variant may restate them, and ralph asserts the
  ABSENCE of a second literal.
- **A FULL-HEIGHT STUDIO PAGE OPTS IN** with `data-studio-fullheight`, and the layout keys
  off it with `:has()`. The layout never learns a route list.
- **`ThreePaneShell` STAYS BLOG-SPECIFIC** until a second consumer.
- **BLOG HAS FIVE BLOCK KINDS** — richText, heading, pullQuote, imageBlock, videoEmbed.
- **`imageBlock` CARRIES FIVE FIELDS AND NO GEOMETRY** — src, alt, caption, wide,
  decorative. **It does NOT reuse `imgSpecFields`.** A case-study image is COMPOSED on a
  free canvas; a figure in a 68ch column is PLACED.
- **ALT IS OPTIONAL AT SAVE AND REQUIRED AT PUBLISH**, with `decorative` as the explicit
  exemption. The publish gate is the only place "required" can be real.
- **THE WIDE BLEED IS COLUMN-RELATIVE, NEVER `vw`.** Same fraction of the same measure on
  both surfaces.
- **BLOG IMAGES ARE A PLAIN `<img>`, NEVER `next/image`.** The optimizer refetches without
  the owner cookie, so an optimized proxy URL 401s in the canvas.
- **`rewriteSrc` DEFAULTS TO IDENTITY** and is the ONLY way `BlogProse` diverges between the
  two surfaces — an attribute value on the same element, never a different element.

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
  about ARCHITECTURE.** **TEN errors across two files**, including one that recommended
  rebuilding a deliberately removed pattern, and a whole threshold that was wrong by 190px
  because a unit was estimated rather than measured.
- **NOTHING RECORDED IN THIS FILE IS EVIDENCE. RE-DERIVE BEFORE YOU BUILD ON IT.**
  This is now FIVE variants of one failure, and the shape is what matters, not the
  instances:
    - a **NAME** — `structural()`, a function that never existed;
    - a **COUNT** — "the 14 block-kind union", which was 16 and had decayed silently as
      kinds were added;
    - a **CONSTANT** — `FIT_THRESHOLD_PX`, exported with ZERO consumers while a comment
      described variants that were never written;
    - a **SCOPE ESTIMATE** — "the nav link is one line", which had sat unexamined since
      #171 and was false because the nav was anchor-only;
    - a **SURFACE** — `FooterExplore`, an inventory entry for a component nothing had
      rendered in a long time.
  **A scope estimate decays exactly like a name, a count, a constant or an inventory, and
  none of them is evidence.** None failed loudly; each was found only by deriving it. Three
  of the five were found in a single two-day stretch, which is a statement about the file's
  reliability, not about that stretch.
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
- **A COMMENT DESCRIBING CODE THAT DOES NOT EXIST IS THE `structural()` FAILURE.** #178
  found an exported constant with ZERO consumers whose own file described Tailwind variants
  that were never written, and STATE had recorded the behaviour as built. **Fix the code and
  the comment TOGETHER** — fixing only the comment leaves a documented behaviour unbuilt,
  and fixing only the code leaves the next reader hunting a variant they cannot find.
- **ASSERT A DUPLICATE AWAY, DON'T ASSERT IT CONSISTENT.** Tailwind cannot interpolate a
  constant into a class name, so a breakpoint naturally gets written twice and coupled by
  hand — the 236px hazard again. Reading the width through `matchMedia` leaves ONE literal,
  and the suite asserts no second one exists. **This is the precedent for the next literal
  that wants two homes.**
- **A CAST WRITTEN TO SATISFY THE TYPE CHECKER CAN BE THE BUG.** `inert: "" as unknown as
  boolean` type-checked, read as defensive, and silently disabled the very protection it
  was written for, because React 19 treats `""` as falsy. **Verify the RUNTIME EFFECT of a
  cast, not just that it compiles.**
- **CSS DOES NOT MEAN THE BOX OBEYED.** `w-0` computed to 264px under `min-width: auto`,
  and `overflow-hidden` did not make a flex parent's height definite. **Read the computed
  value off the live box; a correct class string is not a correct layout.**
- **A SHARED-LAYOUT FIX NEEDS A NON-CONSUMER TESTED TOO.** The viewport-height change looked
  right on the page it was for and made every OTHER studio page's bottom unreachable.
  **Scope it so non-consumers are untouched BY CONSTRUCTION**, then measure one.
- **DON'T ANIMATE A HYDRATION CORRECTION.** A server that must guess renders one layout and
  the client corrects it; with a transition on, that correction plays as an animation on
  every load and makes the box unmeasurable while it runs.
- **A MODULE WITH A TOP-LEVEL `node:fs` IMPORT IS SERVER-ONLY AND NOTHING SAYS SO.**
  `lib/site.ts` is one. Importing from it in a client component fails the build APP-WIDE
  with an error far from the cause. **Compute on the server, pass the value down.**
- **THE TAILWIND SOURCE-SCOPE HAZARD READS COMMENTS.** Quoting a utility name in a comment
  ships a rule to production CSS. #177 excluded `ralph/`; `components/` cannot be excluded,
  so **do not write literal utility strings in prose you do not want compiled.**
- **RUN THE GATE, DO NOT REASON ABOUT IT.** Parity was expected to be unchanged and it was —
  but running it surfaced that `boat-crest` produces ZERO pairs, which no amount of
  reasoning about the diff would have shown.
- **A GATE THAT REPORTS ZERO SUBJECTS IS NOT A PASS.** `sections: 0, verdict: PARITY OK` is
  a false pass. **Check the denominator.**
- **A MUTATION THAT DOES NOT FAIL MAY BE AN INVALID MUTATION.** Two of thirteen "survivors"
  had edited a COMMENT rather than the code, because the suite strips comments and the
  first regex match landed there. **Confirm the mutation changed what you think it did**
  before concluding the guard is weak — and one of the real survivors was a genuine gap.
- **DRIVING THE UI CAN LIE TOO.** Three probe results were wrong before the code was: reads
  taken before React flushed, and a query that hit the topbar's search box instead of the
  panel's. **Scope selectors by accessible name and await the render.**
- **NO LINT GATE EXISTS IN THIS REPO.** There is no ESLint config, so `next lint` only
  offers to create one. Do not claim a lint pass.
- **`h-*` UTILITIES DO NOT WORK ON AN `<img>` IN THIS PROJECT.** `app/globals.css:271`
  carries an UNLAYERED `img, video { height: auto }`, and an unlayered rule beats
  `@layer utilities`. Any component sizing an image must author the rule or use an inline
  style. The identical classes work on a sibling `<iframe>`, which is what makes this read
  as a component bug rather than a cascade one.
- **A SWITCH OVER `unknown` CANNOT BE EXHAUSTIVENESS-CHECKED**, and casting to reach a
  `never` arm DEFEATS the check rather than performing it. **Use a mapped-type dispatch
  table.** A MAPPED TYPE FAILS COMPILATION; A SET, AND A `default:` ARM, JUST RETURN.
- **DO NOT DERIVE A CROSS-CHECK FROM THE THING IT CHECKS.** `RENDERABLE` exists to surface a
  disagreement with the renderer; deriving it from the renderer would launder exactly that.
  Assert the relationship in ralph instead.
- **A DEFERRAL'S STATED BLOCKER CAN EXPIRE WITHOUT ANYONE REVISITING IT.** `imageBlock` was
  deferred because the upload path was "hardcoded to projects". #172 fixed that and the
  deferral stood for six more PRs. **When a PR removes a constraint, grep for what was
  deferred because of it.**
- **CHECK WHETHER A DESIGN CONTRACT ALREADY SOLVED IT BEFORE INVENTING.** blog-article.html
  still held the figure CSS, a `.wide` variant, a responsive reset and two marked insertion
  points. This was RE-ADDING, not designing.
- **REVIEW THE THING THE PR CHANGES ABOUT AN EXISTING FEATURE**, not only the feature it
  adds. The poster bug was in the one hunk that altered an already-shipped kind, it had zero
  test coverage, and it was found by driving the browser after several clean reads of the
  diff.
- **A SURGICAL COMMIT IS EVIDENCE YOU CAN REASON WITH LATER.** When a sentence went missing
  from a published post, the hero-image commit `d5bd37a` touching EXACTLY ONE LINE is what
  exonerated the write route and located the loss in the publish merge instead. The surgical
  bar is not only about avoiding churn; it makes each commit a usable witness.
- **PUBLISH IS WHOLE-BRANCH, SO A HALF-FINISHED EDIT SHIPS LIKE A FINISHED ONE.** Save-on-blur
  can persist a mid-edit state to the draft branch, and nothing distinguishes it from an
  intended one at publish time. **No gate can see this** — the file stays structurally valid
  and `validateBlogPost` returns ok. **Read the content diff before publishing.**
- **NEVER PIN AN EXPECTED VALUE READ FROM LIVE CONTENT.** `blog-serialize`'s G3 read the real
  post and asserted `heroImage` equalled the literal `null`. The owner set a hero image
  through /studio and the suite went red on main — the PROPERTY never broke, only the
  hardcoded expectation. Content is the thing the studio exists to change, so a fixture owns
  the specific case and the live file is asserted for INVARIANCE, not for a value.
- ~~**RALPH IS NOT IN CI**~~ — **FIXED.** `.github/workflows/ralph.yml` runs
  `node ralph/run.mjs` on every PR and every push to main. **NO PATHS FILTER, deliberately:**
  the break that prompted it was a CONTENT commit, and a suite that reads a real content file
  is exactly the kind a content commit breaks. Types and the build stay covered by Vercel,
  which runs `next build`; a second tsc job would duplicate that without adding signal.
- **A REWRITE THAT LIVES ONLY IN A PLAN DOES NOT HAPPEN.** #187's plan named two mandatory
  record rewrites as "the standing rule, not a footnote", and the PR shipped without either.
  They landed one PR later, only because the next session went looking. **If a plan requires
  a rewrite, do it in the same commit as the code that falsifies the record** — the window
  between merging the code and updating the record is exactly when the record is wrong and
  nobody knows.
- **CHECK AN APPROVED PLAN'S PREMISE BEFORE BUILDING TO IT.** Twice in three arcs a premise
  the owner and I both accepted turned out to be false in source — #185's "one line" nav link,
  #187's "no toolbar means no rebuild machinery". Both changed the size of the work.
  Approval is agreement about intent, not evidence about the code.
- **`document.hasFocus()` IS FALSE IN THE BROWSER PANE**, so `.focus()` moves
  `activeElement` WITHOUT firing focus, focusin or blur. Several #187 probes read as "the
  handler is broken" when the handler was fine. Dispatch `focusin`/`focusout` explicitly.
  **This is the second documented way the automation environment lies** — #178's CSS
  transition never advancing is the first. When a driven gate says something is broken,
  suspect the harness once before suspecting the code.
- **A CONDITIONALLY-RENDERED ELEMENT CANNOT CARRY AN AFFORDANCE.** A caption-less
  `imageBlock` or `videoEmbed` emits no `<figcaption>` at all, so it has nothing to make
  editable and is unreachable from the canvas. That single fact is why the block strip
  survived the reversal. **Ask what a feature renders in its EMPTY state before making that
  render the only way to reach it.**
- **A COMMITTED RUNNER RETIRES A DOCUMENTED COUNTING BUG.** #177 committed
  `scripts/normalize-dom.mjs` for the same reason. `ralph/run.mjs` is the second instance:
  it reads each suite's own summary, so the `rich-markers` undercount stops being something
  every session re-learns. **COMMIT THE TOOL, DO NOT DOCUMENT THE BUG.**
- **CI FOUND A HIDDEN ENVIRONMENTAL DEPENDENCY ON ITS FIRST RUN.**
  `upstash-transport.mjs` does `git show 9a25bc0:lib/studio/login-throttle.ts` — pinning the
  PRE-EXTRACTION source, which is the right thing to assert — so it needs GIT HISTORY.
  `actions/checkout` shallow-clones by default, and the suite died with
  `fatal: invalid object name '9a25bc0'`. It had never surfaced locally, where the clone is
  always complete. Fixed with `fetch-depth: 0` and a comment saying why, since the obvious
  "optimisation" is to remove it. **A SUITE CAN DEPEND ON THE SHAPE OF THE CHECKOUT, NOT
  ONLY ON THE FILES IN IT.**

---

## HAZARDS AND KNOWN DUPLICATIONS

1. **The 236px coupling** (#165) — comment-enforced only, in `StudioSidebar` and
   `PublishBar`. **It did NOT become a second literal in #178**: the three-pane widths live
   once in `lib/studio/three-pane.ts` and ralph asserts no duplicate exists. That is the
   pattern the 236px should follow whenever it is next touched.
2. **`StudioModal`'s no-portal dependency** (#168).
3. **`keystatic.config.ts`'s mirror of the image bases** (#172) — test-enforced. **OPEN:
   does the cross-check compare the full key set in both directions?**
4. **Blog's duplicated splice** (#173) — deliberate, eight lines.
5. **Sweep gaps #2–#4** (#174) — the projects form tables still lack `heading`.
6. **`login-throttle` is unreachable by ralph** (#175) — a deliberate trade.
7. **Two `useDraftForm` instances in the blog editor** — easy to assume one form now that
   their fields DO share a 244px pane. #174's defect class. Mitigated by the two labelled
   `SaveIndicator`s and proven separate by G4, not eliminated.
8. **`lib/site.ts` imports `node:fs` at module scope and has no server-only marker** (#178).
   Any client component importing from it fails the build APP-WIDE. A `server-only` import
   there would turn a confusing webpack error into a clear one. **Not done.**
9. **`data-studio-fullheight` couples `ThreePaneShell` to the dashboard layout's `:has()`
   rule** (#178) — two files, nothing in the type system connecting them. Ralph-enforced.
10. **`boat-crest` produces ZERO parity pairs** — the gate has been blind to the hero case
    study for an unknown number of PRs. Cause not investigated. **The other three render 15,
    14 and 15.**
11. **The unlayered `img, video { height: auto }` at `app/globals.css:271`** (#180) — it
    silently beats every `h-*` utility on an `<img>`. Not removed, because the inline figure
    and other images legitimately want it; the cost is that image sizing must be authored.
    **FIRED A THIRD TIME IN #190**, and that firing is the instructive one: inside an
    `aspect-[16/9]` frame the WRONG sizing leaves every outer box correct, so A1, G2 and the
    parity walk all pass while the image crops wrong. The guard there is a string assertion
    against next/image's emitted style (`HERO_FILL_STYLE_CSS`), not a measurement. **Whenever
    this rule is in play, ask what the box gates CANNOT see.**
12. ~~**BLOG HAS NO PARITY HARNESS**~~ — **BUILT IN #187**, at `/dev/blog-parity/<slug>`.
    It cost three hand-catches first: the 48px fidelity gap (#178), the `vw` bleed bug
    (#180), and this arc's own premise. It reuses `parity.mjs`'s walker UNCHANGED and
    asserts a NON-ZERO pair count. **Still browser-driven and dev-only**, so it is a gate
    someone must run, not one CI enforces.
13. **WHOLE-BRANCH PUBLISH CAN SHIP A HALF-FINISHED EDIT** — observed, not theoretical. A
    publish carried a mid-sentence truncation into a live post (see CURRENT CONTENT STATE).
    Save-on-blur persists whatever is in the field, publish merges the whole draft branch,
    and **no gate can distinguish an in-progress edit from an intended one**: the file stays
    structurally valid and `validateBlogPost` returns ok. The mitigation today is reading the
    content diff before publishing. A per-entry publish, or a diff preview in the PublishBar,
    would be the real fix and neither is scoped.
14. ~~**`readingTimeMinutes` HAS NO `imageBlock` CASE**~~ — **FIXED in #192.** The `switch`
    became a mapped type over `BlogBlockKind`, so the omission that survived three PRs is now
    a COMPILE error (`TS2741` on a missing kind, `TS2353` on an invented one, both driven).
    **The published post did NOT change — 2 min before and after**, because it contains no
    `imageBlock`; the concern that deferred this turned out not to apply, which is why it was
    checked rather than assumed. `alt` is deliberately still uncounted: it describes an image
    for a screen reader, it is not text in the reading order.
    **THE ENFORCEMENT SPLIT IS WORTH KNOWING.** `ci/ralph` runs only `node ralph/run.mjs`, and
    `--experimental-strip-types` ERASES types without checking them, so the mapped type is not
    enforced by that job — the Vercel build's `next build` is what typechecks it. Ralph catches
    a missing entry too, but at RUNTIME through the E-section assertions, which is why both
    exist.
15. **THE HERO OBJECT URL IS NEVER REVOKED** (`HeroImageField`, pre-existing, confirmed in
    #190). `URL.revokeObjectURL` runs on the three FAILURE paths and on none of the success
    paths, and there is no unmount cleanup, so each successful upload leaks one object URL
    until the document unloads. Since #190 the value is held in TWO places — the field's own
    thumbnail and `BlogEditPanel` for the canvas hero — so **revoking on either side alone
    shows a broken frame on the other**, which is the symptom the canvas hero exists to fix,
    arriving from the other direction. Bounded by uploads-per-page-visit. Documented at the
    owning site.

---

## DEFERRED — scoped, not built

- ~~**Images inside a post body**~~ — **BUILT in #180.** `imageBlock`, the hidden poster and
  inline figures closed together, as the framing said they would.
- ~~**THE BOLD TOOLBAR for the blog canvas**~~ — **BUILT in #189** (`c3b30f4`). `BoldToolbar`
  was extracted from `SectionsEditPanel` byte-identically rather than copied, so ONE module
  owns which marks exist. Bold, italic and link are now applicable from the canvas.
- ~~**THE CANVAS DOES NOT DRAW THE HERO OR THE HEAD**~~ — **BUILT in #190** (`3b71ac4`).
- **INLINE-EDITING `dek` AND `topic` IN THE CANVAS HEAD.** #190 made the head preview-only,
  and the reasoning is in `BlogArticleHead`: three of its five fields are structurally
  uneditable, so a head with outlines on the other two teaches no rule. If it is ever wanted,
  those two are the only candidates and `inlineEditProps` is the mechanism.
- **CLICK-TO-FOCUS ON THE CANVAS HERO** — routing a click to the inspector's uploader. An
  `onClick` on the existing `<figure>` costs no element and no box. Deliberately not built in
  #190; note it if the absence of an affordance turns out to confuse.
- **THE CASE-STUDY PASTE GAP.** #187 gave blog a multi-line paste handler and deliberately
  left case studies without one. The asymmetry is honest, not an oversight.
- **CANVAS HIGHLIGHT ON CHIP CLICK.** Selection is dual-source, but clicking a chip gives no
  visual feedback in the canvas because nothing applies an `is-selected` class. Needs
  `selectedId` threaded into `BlogProse`; the CSS rule was written and removed in #187
  rather than shipped without a consumer.
- **A PER-ENTRY PUBLISH, or a diff preview in the PublishBar** — the real answer to hazard
  13. Whole-branch publish has already shipped a half-finished sentence once.
- **The button system.** 87 buttons across 18 files.
- **Body scroll lock for modals.**
- **Skills sidebar count** (#165 D3) — needs a semantic decision: categories or total.
- **`ContentCard.tsx` → `OverviewRow.tsx`** (#166) — the condition never fired.
- **Home/End keys** and a standing ralph suite for `ListDetailLayout` (#167).
- **`inputCls` duplicated across 8 files** (#168).
- **Post renaming** — create-new, move assets, delete-old. The title is read-only for this.
- **Blog pagination**, an OG route, RSS, the share row.
- **PublishBar centring over the canvas** rather than the work area — **13px off with the
  list open, 131px collapsed.** Accepted in #178 and the reasoning is in the component's
  hazard comment: centring over the canvas needs the list and inspector widths too, a third
  and fourth hand-coupled literal on a component ten pages share.
- **CLAUDE.md staleness beyond the blog bullet** — the build sequence ends at Phase 5 and
  Open items still lists confirming the editorial direction, long settled.
- **An ESLint config.** There is none, so there is no lint gate.
- **Migrating other studio pages to `ThreePaneShell`**, extracting the shared shell at the
  SECOND consumer. `data-studio-fullheight` and the `:has()` scoping already make the
  layout side reusable.

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
7. **#178's three-pane editor in PRODUCTION.** Every one of A1 and G1–G5 is **DEV-OBSERVED**,
   driven through a temporary dev-only session route that was deleted before commit. `/dev`
   routes 404 under `next start`, so this cannot be closed without a real owner login on
   www.akshitas.com. **Open a post and check: three panes, the collapse control, Tab not
   entering the collapsed rail, and both save indicators reading separately.**
8. **#178 AND #180 WERE SELF-REVIEWED.** The same session wrote and reviewed both.
   `/code-review ultra` is user-triggered and billed and would be a genuinely independent
   pass over `41fc15f`. #180's self-review DID find a real defect (the poster sizing), but
   it found it by driving the browser, not by reading the diff — after several clean reads.
9. **NO `imageBlock` HAS BEEN WRITTEN THROUGH THE LIVE SEAM** (#180).
   `STUDIO_WRITE_MODE=fs` locally, so every save-draft branch no-ops. Ralph covers the
   serializer against the real content file, but that is not a commit. **Closes the first
   time a post with an image is authored through `/studio` in github mode.**
10. **#190's G6b — THE FRESH HERO UPLOAD SHOWS IN THE CANVAS WITHOUT A RELOAD.** Labelled
    **UNVERIFIED rather than DEV-OBSERVED**, because dev cannot observe it at all: in fs mode
    `upload-hero-image` no-ops and returns `{ mode: "fs" }`, so `HeroImageField` takes its
    middle branch and `onChanged` **never fires**. `STUDIO_GITHUB_REPO` is unset and defaults
    to the PRODUCTION repo, so github mode is not a local option without a scratch repo — a
    detour the owner declined, correctly, since `4e900c9` shows real uploads already happen.
    What IS proven: the precedence rule in ralph, and the canvas rendering a real `blob:` src.
    **Closes the first time a hero is uploaded through `/studio` in production** — watch that
    the canvas hero updates immediately rather than after a refresh.

---

## DESIGN REFERENCE FILES (docs/studio/)

- `work-section-overlay-grid.html` — corrected during PRs 2, 3 and 4.
- `blog-homepage.html` — corrected in #171.
- `blog-article.html` — corrected in #171, then **AGAIN in #180**: the two struck inline
  figures RESTORED, and the `.wide` bleed changed from `clamp(0px,7vw,120px)` to a
  column-relative `-17%`. The `vw` form was a real bug that gate A1 structurally could not
  see, because A1 measures the wrapper and the bleed is on the child.
- `studio-blog.html` — **replaced wholesale by the owner**, then edited in #177 (the `.seg`
  convention), then **CORRECTED IN #178**. **TEN errors to date**, and the file now carries
  each correction beside what it replaced rather than silently overwritten. Error 6 (the
  poster field) became TRUE when `a586e98` shipped what #174 had only planned, which is
  recorded as such — a claim that becomes true by the code catching up is not a claim that
  was right.
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
- **#178** the 3-pane blog editor (`438bf95` merge, `0f23e5d` commit, `a586e98` groundwork) →993
- **#180** imageBlock, the inline figure (`41fc15f` squash-merge) →1028
- `d5bd37a` + `82edf03` owner studio writes — hero image set, then published
- **#181** docs: STATE for imageBlock (`3093538`) · **#182** restore the truncated
  sentence + unpin blog-serialize (`db907ed`) →1029
- **#183** ralph in CI + the committed runner (`1e3e433`) — the counting note retired
- **#184** the post published (`4bc1573`) · **#185** nav link + sitemap + delete
  FooterExplore (`198e503`)
- **#186** docs: STATE for the launch (`f7426a5`) · **#187** the inline canvas (`2c258cd`) →1068
- **#188** docs: STATE + the two rewrites #187 missed (`f233acc`)
- **#189** the bold toolbar, extracted rather than copied (`c3b30f4`) →1075
- **#190** the canvas draws the head, the hero and the body (`3b71ac4` squash-merge) →1144
- `2d837f2` docs: /dev routes are dev-only · `bbf6d3d` docs: blog conventions in CLAUDE.md
- `f54574a` #179 docs: STATE records the 3-pane arc

---

## WHAT'S NEXT

**THE BLOG IS LAUNCHED. WHAT REMAINS IS CONTENT.**

1. **WRITE POSTS THROUGH `/studio`**, with images and a hero, EDITING ON THE CANVAS. The
   highest-value next step by a wide margin: it closes owner-backlog items **7, 9 and 10**
   together, exercises the status write path for the first time, and is the first real load
   on the editor — now including inline editing and the full article preview, whose gates are
   all DEV-OBSERVED or UNVERIFIED. **When you upload the hero, watch whether the canvas
   updates immediately or only after a refresh** — that single observation closes item 10.
   **READ THE CONTENT DIFF BEFORE EACH PUBLISH** until hazard 13 has a real answer — a publish
   has already shipped a half-finished sentence once, and CI cannot tell one from a finished
   one.
2. **Optional:** `/code-review ultra` over `3b71ac4`. #178, #180, #185, #187, #189 and #190
   were all self-reviewed, and #190 is the largest of them.
3. **Later:** a per-entry publish or a PublishBar diff preview (hazard 13, the one with a
   real incident behind it); migrate other studio pages to `ThreePaneShell`, extracting at the
   SECOND consumer; investigate why `boat-crest` yields zero parity pairs (hazard 10); the
   never-revoked hero object URL (hazard 15).

Ralph pilot remains validated for MECHANICAL, bounded work only. Design decisions and new
arcs stay human-gated, one at a time. Never auto-merge, never write main unattended.
