# PROJECT: akshitas.com — /studio content editor

Next.js 15 App Router portfolio (repo: sinhasagar01/akshita-portfolio) with a custom
/studio dashboard that edits site content via an authenticated GitHub-commit pipeline
(draft branch → publish = merge to main → Vercel rebuild). Built by Sagar.

---

## STATE (as of THE BLOG IS FEATURE-COMPLETE — imageBlock MERGED)

**main** = `3093538` = #181 (this STATE). Pinned: `82edf03` = the owner's publish that
carried the truncation, `d5bd37a` = the hero-image write (ONE line, the splice proven a
second time), `41fc15f` = #180 (imageBlock), `f54574a` = #179 (STATE), `438bf95` = #178
merge (the 3-pane blog editor), `0f23e5d` = #178's commit,
`bbf6d3d` = CLAUDE.md blog conventions, `fe4b08d` = #177 merge (tooling + nav
fixes), `2ad4856` = #176 merge (love UI), `2d837f2` = the CLAUDE.md
proof-and-verification note. Earlier: `9a25bc0` = #174, `c9bd10d` = #173, `a6bc8b9` = #172,
`c164c85` = #171, `92f8378` = #170, `0d21a93` = #169, `7e591ae` = #168, `5839039` = #167,
`54be07e` = #166, `4228b14` = #165, `2a87d96` = #164, `e90742f` = #163.

`feat/blog-editor-3pane` and `feat/blog-image-block` are merged but NOT deleted.

**THE BLOG IS NOW FEATURE-COMPLETE FOR AUTHORING.** Five block kinds, all renderable, all
reachable from the picker. The remaining work is CONTENT and one launch switch.

### RALPH IS 1029 ACROSS 29 RUNNABLE SUITES
Chain: 571 → 588 (#170) → 601 (#171) → 630 (#172) → 749 (#173) → 793 (#174) → 900 (#175)
→ 900 (#176, no suites — its subject was DOM geometry and browser cache behaviour, which
ralph structurally cannot see) → 930 (#177, `studio-nav-active` 30) → 993 (#178,
`three-pane` 43 + `blog-search` 20) → 1028 (#180, `image-block` 30 + `blog-registry`
44→49) → 1029 (`blog-serialize` 32→33, the G3 repair below).

Run each suite directly — **there is no npm script**:
`node --experimental-strip-types ralph/tests/<name>.mjs`
Per-file: blog-format 50, blog-reading-time 13, blog-registry 49, blog-search 20,
blog-serialize 33, blog-status-filter 17, collection-image-paths 29, cs4-frame 26,
f2-draft-overlay 11, f3-slug 31, image-block 30, loves-store 72, ncr-adjacent 20,
p4-3c-adapter 53, p4-4bi-sections-serialize 28, p4-4bii-block-forms 132,
p4-4biii-structural 58, p4-4biv-block-images 20, paragraph-edits 28, rich-markers 63,
section-label 23, settings-photo 25, studio-nav-active 30, task1 17, task2 22, task3 14,
three-pane 43, upstash-transport 35, validate-blog-post 37.
**These sum to exactly 1029 across 29 files** — verified, not asserted, and the first time
this list has been checked against its own total. `parity.mjs` is excluded from the count
(it needs a running server), but **RUN IT ANYWAY and report the number** — see the working
rules.
**COUNTING NOTE:** `rich-markers` reports `✓`/`63 passed` rather than `[PASS]`, so a naive
grep undercounts by 63. The grep total is 966 and the real total is 1029. Read each suite's
own summary line.

### FIVE ARCS COMPLETE
1. **Work-section rebuild — COMPLETE** (#159–#162).
2. **Studio restyle — COMPLETE** (#164–#169).
3. **Blog — COMPLETE** (#170–#176), plus #177 tooling and nav fixes.
4. **The 3-pane editor relayout — COMPLETE** (#178, merged `438bf95`).
5. **imageBlock, the last authoring gap — COMPLETE** (#180, merged `41fc15f`).

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
**One post, `status: draft`, with a hero image set.** This has now flipped twice, so read it
from the file rather than from here: `content/blog/what-a-data-table-teaches-you-about-trust.yaml`.
`/blog` renders the EMPTY STATE while it is a draft, which is the fail-closed filter working.
Both public routes remain UNLINKED from the nav, still the launch switch.

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
The canvas renders through `BlogProse` at the PUBLIC measure, so what the author sees is
what the article ships. `BlogBlocksEditPanel` has CLAIMED that since #174 and it was
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
- **Selection is a BLOCK STRIP, and clicking the prose is MOCK-ONLY.** Both ways to make the
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
- **THE CANVAS MEASURE EQUALS THE ARTICLE MEASURE, AS A NUMBER.** `697.9296875px` today.
  It never widens on collapse. A measure that moves when you hide a pane is a measure that
  lies, and it is the property the whole layout exists to protect.
- **BLOCK SELECTION IS THE INSPECTOR STRIP.** Clicking the prose is mock-only and stays
  unbuilt. The strip shows the KIND LABEL and position, never a body excerpt.
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
- **A NAME IN A STATE FILE IS NOT EVIDENCE THAT THE THING EXISTS**, and neither is a
  RECORDED BEHAVIOUR. #178 found STATE claiming a collapse was built when only a boolean
  was wired. **Verify the record against source before planning on it.**
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
- **RALPH IS NOT IN CI, SO MAIN CAN BE RED AND NOBODY KNOWS.** Only Vercel runs on a PR.
  `blog-serialize` was failing on `main` from `82edf03` until it was noticed by hand. **Run
  ralph after any content commit, not only after a code change.**

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
12. **BLOG HAS NO PARITY HARNESS.** `parity.mjs` compares the case-study canvas to the
    case-study page only. Both the 48px fidelity gap (#178) and the `vw` bleed bug (#180)
    had to be caught by hand. **Worth its own decision.**
13. **WHOLE-BRANCH PUBLISH CAN SHIP A HALF-FINISHED EDIT** — observed, not theoretical. A
    publish carried a mid-sentence truncation into a live post (see CURRENT CONTENT STATE).
    Save-on-blur persists whatever is in the field, publish merges the whole draft branch,
    and **no gate can distinguish an in-progress edit from an intended one**: the file stays
    structurally valid and `validateBlogPost` returns ok. The mitigation today is reading the
    content diff before publishing. A per-entry publish, or a diff preview in the PublishBar,
    would be the real fix and neither is scoped.

---

## DEFERRED — scoped, not built

- ~~**Images inside a post body**~~ — **BUILT in #180.** `imageBlock`, the hidden poster and
  inline figures closed together, as the framing said they would.
- **A BLOG PARITY HARNESS.** The case-study one does not cover blog. See hazard 12.
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
- **#181** docs: STATE for imageBlock (`3093538`)
- `2d837f2` docs: /dev routes are dev-only · `bbf6d3d` docs: blog conventions in CLAUDE.md
- `f54574a` #179 docs: STATE records the 3-pane arc

---

## WHAT'S NEXT

**THE BLOG IS FEATURE-COMPLETE. WHAT REMAINS IS CONTENT AND ONE SWITCH.**

1. **WRITE POSTS THROUGH `/studio`**, with images. This is now the highest-value next step
   and it closes three things at once — backlog items 7 and 9, and the first real exercise
   of the editor under load. **READ THE CONTENT DIFF BEFORE EACH PUBLISH** until hazard 13
   has a real answer — a publish has already shipped a half-finished edit once.
2. **DECIDE THE POST'S STATUS.** It is back to `draft`, so `/blog` shows the empty state.
   Flipping it to published is a content call, not a code one.
3. **OPEN THE THREE-PANE EDITOR IN PRODUCTION** and confirm it. Backlog item 7; every gate
   on it is DEV-OBSERVED and only the owner can close it.
4. **THE NAV LINK** — one line, and the launch switch for `/blog`.
5. **Optional:** `/code-review ultra` over `41fc15f`, since #178 and #180 were self-reviewed.
6. **Later:** a blog parity harness (hazard 12); migrate other studio pages to
   `ThreePaneShell`, extracting the shared shell at the SECOND consumer; investigate why
   `boat-crest` yields zero parity pairs (hazard 10).

Ralph pilot remains validated for MECHANICAL, bounded work only. Design decisions and new
arcs stay human-gated, one at a time. Never auto-merge, never write main unattended.
