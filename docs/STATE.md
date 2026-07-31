# PROJECT: akshitas.com — /studio content editor

Next.js 15 App Router portfolio (repo: sinhasagar01/akshita-portfolio) with a custom
/studio dashboard that edits site content via an authenticated GitHub-commit pipeline
(draft branch → publish = merge to main → Vercel rebuild). Built by Sagar.

---

## STATE (as of THE INK CHROME ARC, COMPLETE)

**main** = `beba883` = the card image (#211). **The ink chrome arc is finished — six PRs, #204
to #209 — and ALL ELEVEN FIDELITY ITEMS ARE NOW CLOSED**, across two further PRs.
**ralph 1521 across 44 suites** (`parity` and `studio-type` named as skipped, not dropped; the
on-ink CONTRASTS `studio-type` measured are now enforced in CI by `studio-ink-contrast`).

| items                 | where                | how                                                     |
| --------------------- | -------------------- | ------------------------------------------------------- |
| **3, 6, 7, 8, 9, 10** | **#208**             | the fidelity repaint                                    |
| **1, 2**              | **#209**             | the selection language                                  |
| **11**                | the contract         | **a bug in the file itself** (C-13), not in the build   |
| **4**                 | **#211**             | complete on BOTH components — see the mis-mapping below |
| **5**                 | deferred as **PR D** | deliberately a feature, not a styling item              |

Pinned: `beba883` = the card image (#211), `8ae96ba` = the phantom tokens (#210),
`cfa695f` = STATE for the arc, `e938c16` = the fidelity repaint (#208),
`d75eeb0` = the radius scale (#207), `37286cc` = the input dedupe (#206),
`466df8e` = the panel language (#205),
`e25a863` = the ink shell (#204), `932e59c` = #203 (every blog post gets its own social card), `de6fba0` =
STATE for #201 and #202, `6b28e91` + `01c2251` + `6ebd513` = the owner's studio hero uploads for
the two Fosfor studies and Elevate, `49a2a29` = #202 (the canvas draws a block image before it
is published), `9982db9` = #201 (the dropped save, coalesced), `50a5275` = STATE for #200 and two closed
owner-backlog items, `3e1a60a` = #200 (the Publish button names its object), `f734a7e` = the
owner's studio publish of the third post, `a397a1d` = STATE for the sweep, `bbf179f` = #199
(the deferred sweep), `d9e6b06` = STATE for the
reduced-motion arc, `fa08200` = #198 (the FAB under reduced motion), `258ee1a` = #197 (the
reduced-motion scroll), `1449487` + `54f1954` = the branch cleanup, `90b856b` = #196 (STATE),
`bec28c4` = #195 (the ESLint config), `9e3b1b2` = #194 (the inspector at 320), `d21b9a5` = #193 (the hero object-URL lifetime), `2a9c8c2` = #192 (the
imageBlock reading-time gap), `fc8c318` = #191 (STATE), `3b71ac4` = #190 (the canvas draws the
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

**THE MERGED BRANCHES ARE GONE.** 13 were deleted (12 local, 13 remote — `docs/state-3pane-complete`
existed on the remote only). **What remains is `main` and `ralph/phase1`, local and remote.**
Every deletion was verified first: each branch had a merged PR whose merge commit is an
ancestor of `main`.

**DO NOT CLEAN THEM UP WITH `git branch --merged`.** This repo squash-merges, and a squash
merge makes a NEW commit rather than making the branch an ancestor, so `--merged main`
**reports every squash-merged branch as UNMERGED even though its content is on main** and
would keep exactly the wrong set. Delete against the PR list or `gh pr list --state merged`,
never against ancestry.

_The illustration, dated because it decays — the mechanism above does not._ When this note
was written (#191, 2026-07-27) `--merged main` listed `feat/blog-editor-3pane` (a true merge
commit, `438bf95`) and `ralph/phase1`, out of the thirteen merged branches then present.
`feat/blog-editor-3pane` has since been deleted, so run today it returns `main` itself and
`ralph/phase1` — verified, not assumed, which is how this sentence's first draft was caught
claiming `ralph/phase1` alone.

**THE FIGURE ABOVE READ "ELEVEN" AND THE REAL NUMBER WAS 13.** It was right when written in
\#191 and drifted as #192 to #196 merged without deleting their branches — a count that was
accurate once and was never re-derived. See the sixth instance under the re-derive rule.

**`ralph/phase1` IS THE ONE PLACE CODE ENTERED THIS REPO WITHOUT REVIEW** — it has no PR at
all and its commits reached `main` directly, its tip `8172b4a` is an ancestor of `main` (0
commits ahead) so the code is long superseded, and the branch is deletable whenever the owner
says. **Recording that matters more than deleting it.**

**THE BLOG IS LAUNCHED.** Five block kinds all renderable and reachable, one post
PUBLISHED, the nav link shipped, and `/blog` plus the post in the sitemap. Verified on
production: `www.akshitas.com/blog` returns 200, the home page carries three `href="/blog"`
occurrences (desktop bar, scrolled sheet, mobile menu), and the sitemap lists 7 URLs.

**THE REMAINING WORK IS CONTENT.**

### RALPH IS 1332 ACROSS 37 RUNNABLE SUITES

Chain: 571 → 588 (#170) → 601 (#171) → 630 (#172) → 749 (#173) → 793 (#174) → 900 (#175)
→ 900 (#176, no suites — its subject was DOM geometry and browser cache behaviour, which
ralph structurally cannot see) → 930 (#177, `studio-nav-active` 30) → 993 (#178,
`three-pane` 43 + `blog-search` 20) → 1028 (#180, `image-block` 30 + `blog-registry`
44→49) → 1029 (`blog-serialize` 32→33, the G3 repair below) → 1068 (#187,
`inline-canvas` 39) → 1075 (#189, `inline-canvas` 39→46) → 1118 (#190, `canvas-hero` 43)
→ 1144 (#190, `canvas-head` 26) → 1151 (#192, `blog-reading-time` 13→20) → 1163 (#193, `canvas-hero` 43→55) → 1169 (#194, `three-pane` 43→49) → 1183 (#197, `reduced-motion` 14, net-new) → 1187 (#198, `reduced-motion` 14→18) → 1193 (#199, `studio-nav-active` 30→36) → 1209 (#201, `coalescing-save` 16, net-new) → 1235 (#202, `block-image-preview` 26, net-new) → 1264 (#203, `og-cards` 29, net-new) → 1289 (the ink shell, `studio-ink` 25, net-new) → 1305 (the panel language, `studio-ink` 25→41) → 1315 (the input dedupe, `studio-ink` 41→51) → 1332 (the radius scale, `studio-ink` 51→68) → 1353 (#208, `studio-cascade` 12 net-new plus `studio-ink` 68→77) → 1379 (#209, `studio-ink` 77→103) → 1385 (#210, `studio-tokens` 6, net-new) → 1385 (#211, no net-new — the card image is layout, and studio-type which covers it is not CI-runnable) → 1402 (#216, `f3-slug` 31→41, `validate-blog-post` 37→41, `blog-format` 50→52, `canvas-head` 26→27) → 1402 (#218, the +1px font bump with the 13/14 input split resolved to 14 — three assertions in `studio-ink` and `studio-nav-active` reconciled to the new sizes, no net-new) → 1410 (#219, the border-race gate, `studio-border-race` 8, net-new suite; also fixed two live races it found in the blog rows) → 1410 (hazard 23 closed, `studio-tokens` B2 revalued from pinning 40 to asserting 0 — a revalue, not net-new) → 1443 (hazard 27 closed, `studio-ink-contrast` 33, net-new suite — the on-ink ratios `studio-type` could only measure by hand, now computed statically from source and asserted in CI) → 1446 (hazard 24 closed, `radius-scale` 3, net-new suite — the declared radius ramp is monotonic and no consumer reaches an undeclared step; the two `rounded-2xl` sites were removed byte-identically) → 1456 (PR D, topic as a closed set: `validate-blog-post` 41→49 for the publish gate and the zero-migration proof, `blog-format` 52→54 for the closed-set sanitizer) → 1486 (the topic listbox + a fourth topic: `listbox-a11y` 26 net-new suite, `reduced-motion` 18→22 for the listbox's motion + #198 guard) → 1521 (PR 5, the shell's labelling + threshold seams — `three-pane` 68→72) → 1517 (PR 6, the case-study scale floor — `three-pane` 49→68) → 1498 (PR 3, the section headers — `studio-ink` 103→106 for the by-role E6 rule) → 1495 (PR 1, the label scale — `studio-labels` 9, net-new suite) → 1486 (PR 4, hazard 17 closed — a correctness fix with no new assertion, because the gate that enforces it is `eslint`'s `react-hooks/rules-of-hooks`, mutation-proven rather than pinned in ralph).

**1410 ACROSS 40 IS FROM A RUN, not from adding the deltas above.** The chain is a narrative
of where assertions came from; the total is re-derived each time this file is updated.

**THE PER-FILE LIST IS NO LONGER HERE, and that is deliberate** — `ralph/run.mjs` prints
it, so it cannot drift from the total the way it silently did before #183.

**TWO SUITES ARE NAMED AS SKIPPED, NOT DROPPED** — `parity` and, since #208, **`studio-type`**.
Both need a running dev server and are driven from a browser console, so neither can run in CI.
`studio-type` measures **rendered type and the ground ladder**, and it exists because
`studio-cascade` is blind by construction to a **wrong-but-uncontested value**: a size that
nothing competes for renders exactly as written and no parser can tell it is wrong. That is
precisely the shape of fidelity item 9, and of **PR C's thumbnail resize**.
**A PR THAT CHANGES RENDERED SIZE MUST RUN `studio-type` BY HAND. Do not read a green ralph as
covering it** — the runner reports what it did not run for exactly this reason (#183). **What
that by-hand run no longer covers alone is CONTRAST**: `studio-ink-contrast` (net-new, CI) now
recomputes every non-pointer on-ink ratio in `studio-type`'s `ON_INK` table from the same tokens
and utilities and asserts it against the same floors, so a colour regression on the ink chrome
fails in CI. `studio-type` stays the by-hand oracle that gate cross-checks against, and the only
place the two `:hover` rows can be verified. **Rendered SIZE still needs the by-hand run; rendered
CONTRAST no longer does.**

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

**PASS/FAIL IS THE EXIT CODE, never parsed text.** All runnable suites end with
`process.exit(failures === 0 ? 0 : 1)`, verified. (This line read "29" while the heading
above it read 30 — a drift of exactly the kind the committed runner exists to prevent, and
one this file introduced by hand. Both are now re-derived from a run rather than edited.) Parsing is for the count only, which is
reporting, not verdict. It also fails a suite that **exits 0 having asserted NOTHING** — a
gate that reports zero subjects is not a pass.

`parity.mjs` is excluded and NAMED as skipped, never silently dropped. It needs a running
dev server and is driven from a browser console.

### EIGHT ARCS COMPLETE

1. **Work-section rebuild — COMPLETE** (#159–#162).
2. **Studio restyle — COMPLETE** (#164–#169).
3. **Blog — COMPLETE** (#170–#176), plus #177 tooling and nav fixes.
4. **The 3-pane editor relayout — COMPLETE** (#178, merged `438bf95`).
5. **imageBlock, the last authoring gap — COMPLETE** (#180, merged `41fc15f`).
6. **The inline-editable canvas — COMPLETE** (#187, merged `2c258cd`), plus the bold
   toolbar (#189, merged `c3b30f4`).
7. **The canvas draws the whole article — COMPLETE** (#190, merged `3b71ac4`).
8. **The lint gate — COMPLETE** (#195, merged `bec28c4`), after #194 widened the inspector.

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

**Remainder (content, not code) — RE-DERIVED FROM THE FILES, and two of its three claims had
gone stale.** It read: _"`heroImage` is `null` on BOTH Fosfor studies. `boat-crest`'s is an
837KB PNG that never went through sharp. `elevate-one-view`'s is 390×988 portrait — a
STRUCTURAL TENSION."_ Carried unchanged since #160 across a dozen regenerations. What the files
say today:

| study                   | `heroImage`                        | file                                    | landed                         |
| ----------------------- | ---------------------------------- | --------------------------------------- | ------------------------------ |
| `fosfor-ai`             | ~~null~~ **set**                   | `heroImage.webp` 320×200, 2,168B        | `6b28e91` studio               |
| `fosfor-data-profiling` | ~~null~~ **set**                   | `heroImage.webp` 320×200, 2,532B        | `01c2251` studio               |
| `elevate-one-view`      | ~~390×988 portrait~~ **landscape** | `heroImage.webp` 320×200, 2,772B        | `6ebd513` studio               |
| `boat-crest`            | unchanged                          | `heroImage.png` **2074×1058, 837,714B** | `46905da`, the original commit |

- ~~**`heroImage` is null on both Fosfor studies**~~ — **CLOSED.** Both set through /studio.
- ~~**`elevate-one-view` is a 390×988 portrait STRUCTURAL TENSION**~~ — **CLOSED AT THE ASSET
  LEVEL, AND IT DID NOT NEED ANY OF THE THREE PROPOSED WAYS OUT.** No landscape composite, no
  `cardImage` field, no portrait frame. The owner simply uploaded a landscape asset, which is
  the option the list did not contain. **But see the hazard below: the code stopgap it caused
  is still in place and now describes an asset that no longer exists.**
- **`boat-crest`'s 837KB PNG IS UNTOUCHED and this item stays open.** Still the original
  2074×1058 PNG from `46905da`, never re-uploaded through /studio — which is the fix, since the
  upload route re-encodes to webp at quality 80. One studio upload closes it.
- **NEW, and it applies to all three studio heroes: they are 320×200.** `ProjectCard` renders
  them with `sizes="(min-width: 1024px) 500px, 100vw"`, so a 320px-wide source fills a 500px
  slot on desktop and the full viewport on mobile. `next/image` never upscales past the source,
  so it serves 320px into both. **The upload route did not cause this** — it is
  `withoutEnlargement: true` against a 2048 long edge, so it only ever downscales; the source
  files were 320×200. Content, not code, and a re-upload at a larger size is the whole fix.

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

  **THE INK ACTIVE PILL IS REVERSED AT `lg` BY PR 1 (ink chrome), AND THE ORIGINAL REASONING
  STAYS ABOVE RATHER THAN BEING OVERWRITTEN** — the standing rule, the one `BlogIndex.tsx`
  follows for its own reversed decision, because a reversal whose reasoning is deleted leaves
  two contradictory rationales and no record of which won.
  **#165's choice was right and is still right on cream.** Measured, `bg-ink-950` with
  `text-cream-50` is a **19.04:1** figure-ground marker — about as strong as a selection state
  can be. What changed is the ground, not the judgement: on an ink sidebar the same pill is
  **1.00:1** and would vanish, taking the only selection marker with it. So at `lg` the shape
  stays and the figure-ground flips — a white wash at 10% (**1.24:1** measured), with the label
  stepping ink-200 **10.64 → 15.30** cream-50 and `font-medium` already in place.
  **BELOW `lg` #165's PILL SHIPS UNCHANGED**, because there the nav is a horizontal scroller
  with three of six items off screen, so the pill is the primary wayfinding cue and the wash
  would be the weakest possible replacement. **One decision, two grounds, two answers.**

- **#166 overview rows** — Contact is a visually LOCKED `<div>`, proven by Tab sequence.
- **#167 ListDetailLayout** — **CONSUMERS ARE SETTINGS, EXPERIENCE, SKILLS** (now seven panels).
  Selected was the ACCENT-TINTED PILL. **The attribute-invariant gate was invented here.**

  **THE ORIGINAL REASONING, KEPT.** #167 rejected an INK fill for the selected row because the
  row carries an **accent badge** and an **accent dirty dot**, and an ink ground would have
  needed inverted variants of both. It chose an accent tint instead, so the accent elements
  inside the row kept working unchanged.

  **RESOLVED IN PR B, AND THE CONCERN WAS RIGHT — THE REMEDY WAS HALF OF ONE.** The objection
  was that a selection treatment must not fight the accent elements _inside_ the row. **A 3px
  left bar sits at the EDGE while the badge sits INLINE**, so it satisfies the objection more
  completely than the tint did: measured, the badge ends up **78px** from where the bar stops,
  and its text reads **6.00:1** on the new fill. Both accent elements survive untouched, which
  is the property #167 was protecting.

  **WHAT THE TINT ACTUALLY COST.** Measured at **1.15** against its ground — inside the same
  **1.05–1.19** band as every plain cream step, i.e. no better than no fill at all. That is why
  selection was hard to see on the blog rail (1.103) and why the owner reported it. The bar
  reads at **3.43–4.48**, roughly thirty times the separation. **The tint was never the signal;
  it only looked like a decision because it was accent-coloured.**

  This is a REWRITE, not an overwrite: #167's reasoning stands above and the resolution sits
  beside it, so nobody later reads the accent pill as live convention or the reversal as a
  contradiction.

- **#168 `StudioModal`** — **4 modals in 2 files.** Six-item delta list up front.
  **SHADOW LITERAL EXCEPTION.** **HAZARD: no portal.**
- **#169 chrome pass** — PublishBar becomes a pill. **ERROR TONE SPLIT.** All EIGHT
  PublishBar states captured. **THE COUNT WAS RECORDED AND THE LIST WAS NOT**, so "EIGHT" sat
  here as a figure nobody could check — the count variant of the re-derive rule in a milder
  form. #200 derived the list below.

  **THE EIGHT STATES, DERIVED IN #200 FROM SOURCE — not reproduced from #169.** They cannot be
  known to match #169's, and claiming they do would be the false-record failure this file
  refuses elsewhere.

  | #   | state                  | status line                                                                | Publish control                           |
  | --- | ---------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
  | 1   | idle, clean            | All changes published                                                      | disabled, no Discard                      |
  | 2   | idle, unpublished      | Unpublished changes                                                        | enabled, Discard appears                  |
  | 3   | pending (`anyPending`) | unchanged                                                                  | **both** disabled mid-save                |
  | 4   | publishing             | Publishing…                                                                | label becomes Publishing…                 |
  | 5   | published              | Published. Your site is rebuilding…                                        | disabled, badge self-heals                |
  | 6   | publish error          | four variants — fs mode, nothing to publish, invalid url, conflict/generic | enabled except "nothing"                  |
  | 7   | draft read error       | Couldn't load your draft…                                                  | server-driven, **unreachable in fs mode** |
  | 8   | confirm open           | Discard all unpublished changes?                                           | whole row replaced by Cancel + Discard    |

  Seven of the eight were FORCED individually in #200 through stubbed responses. **State 7 was
  not**, and is labelled rather than assumed: `draftReadError` is a server prop from
  `getStudioData()` and is always false in fs mode.

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

- **THE PARAMETER IS REQUIRED, NOT PROJECTS-DEFAULTED.** The bug existed _because_
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

**THREE posts, all `status: published`, and the last two were WRITTEN AND PUBLISHED THROUGH
/studio.** Read them from the files rather than from here, since this has flipped four times:

- `what-a-data-table-teaches-you-about-trust.yaml`
- `what-a-design-system-is-for-when-the-machine-can-draw.yaml`
- `ai-first-is-a-research-posture-not-a-feature.yaml`

All three render on production and are listed on `/blog`.

**ALL THREE CARRY A HERO, AND TWO CARRY A REAL `imageBlock`** — `ai-first…/blocks/d9517012efd9.webp`
(added in `0a03779`) and `what-a-design-system…/blocks/6cd6a9815c3f.webp` (added in `ba41d04`).
**Derived from the files, and the brief for this STATE pass said "one".** The count variant of
the re-derive rule, a seventh time and this time in the instruction rather than in the file —
which is the same failure whichever side of the conversation it starts on.

**THE FIRST POST WAS A DIRECT COMMIT (#184), THE OTHER TWO WERE NOT.** That distinction was
the whole reason owner-backlog items 7 and 9 stayed open, and the studio writes closed them:
the drafts land as `chore(studio): update blog/<slug> …` commits and publish as a merge
(`f734a7e`). The status write path, the hero upload, the block-image upload and the three-pane
editor have all now been exercised by a real author rather than by a gate.

`validateBlogPost` was run against the first file REWRITTEN AS PUBLISHED before flipping,
because drafts are not judged and validating it in place would have proven nothing.
`dynamicParams: false` means the BUILD decides whether an article exists, so it was proven by
building rather than by reading the diff.

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
was wrong by 190px. (#194 widened the inspector to 320, moving the threshold to **1614**.) Both numbers live once each in `lib/studio/three-pane.ts` and are read
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

| Gate                        | Result                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A1 measure equality         | **697.9296875px both sides, delta 0**                                                                          |
| G1 panes at 1560            | 264 / 801 / 244, canvas clears the 794 required                                                                |
| G2 round trip               | reorder fired **ZERO** requests; the explicit save carried the new order with the edited text at the new index |
| G3 collapsed-pane inertness | 3 controls inside, **0 accepted focus**                                                                        |
| G4 two forms                | two disjoint bodies, `{collection,slug,patch}` and `{collection,slug,blocks}`                                  |
| G5 the 1100 fold            | exactly ONE form tree, no hidden copy                                                                          |
| G6 ralph                    | 930 → 993, 28 suites, 0 failures, both new suites mutation-tested                                              |
| G7 typecheck                | clean. (NO LINT GATE EXISTED at the time; #195 added one.)                                                     |
| G8 CSS bundle               | **zero changed declarations** on any shared selector                                                           |
| G9 determinism              | two builds byte-identical through the committed normalizer                                                     |
| parity                      | RUN, not reasoned about. 3 of 4 slugs, 44 sections, 0 findings                                                 |

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

> _"There is no single-image block; `imageBlock` is net-new and needs the block-image upload
> path, **which is hardcoded to projects and is the WRITE PR's fix.**"_

Both removal sites were still marked in the markup, the figure CSS was never deleted, and
the locked decision _"figures may break wider than the measure; nothing else does"_ was still
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

| Gate             | Result                                                                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 / G2 geometry | **IDENTICAL on all three surfaces** — wrapper content box `697.9296875` on the article, the canvas with the list open, and the canvas collapsed. Normal figure `697.93`, wide figure `935.21` everywhere                                                                                                          |
| G3 CSS           | **union-of-declarations: ZERO** selectors changed. The two rules a naive diff flagged were selector-list REGROUPING (the merged `h2,blockquote` rule split when the figure CSS broke its adjacency; every declaration survives). 5 added selectors, all proven `blog-`prefixed **by grepping the emitted bundle** |
| G4 DOM           | public HTML **byte-identical**, and the honest reason is that **no post uses the kind YET**, not that nothing changed                                                                                                                                                                                             |
| G5 determinism   | two builds byte-identical                                                                                                                                                                                                                                                                                         |
| G6 ralph         | 993 → **1028**, 29 suites, 0 failures. `image-block` 30, `blog-registry` 44→49. 8 mutations, all caught                                                                                                                                                                                                           |
| G7 typecheck     | clean. (No lint gate at the time; #195 added one.)                                                                                                                                                                                                                                                                |

**D1 MEASURED, NOT DERIVED.** `BlockImageField` FITS the 244px inspector — 204px row, no
overflow, no wrap — but the path readout compresses to **27.6px**, narrower than the 38px
the arithmetic predicted. **Left as is:** `ImageThumb`'s own header already records that a
content-addressed filename _"tells the owner nothing about which image is actually set"_ and
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
epoch _"for the same reason a bold does"_ — the array changes LENGTH, so React's tree and the
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

| Gate                | Result                                                                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1 article DOM      | **ALL EIGHT public pages byte-identical to main**; the built article contains ZERO edit attributes                                                                                                                                                                                                      |
| G2 canvas DOM       | 13 elements both sides, **element tree IDENTICAL**, only attributes added                                                                                                                                                                                                                               |
| G3 A1 editable ON   | `697.9296875`                                                                                                                                                                                                                                                                                           |
| G4 ralph            | 1029 → **1068** across 30 suites; `inline-canvas` 39; five mutations, all caught                                                                                                                                                                                                                        |
| G5 extraction inert | `p4-4bii-block-forms` 132 and `paragraph-edits` 28 per-file identical                                                                                                                                                                                                                                   |
| G6 driven           | no-op blur fires **ZERO** requests; a real edit posts `{blocks,collection,slug}` with `**missing explanation**` intact; Enter splits 2→3 with the caret in the new paragraph; Backspace merges 3→2 with the caret at offset 8 (the join); paste yields THREE entries not one; selection syncs both ways |
| G7                  | two builds byte-identical; CSS union-of-declarations ZERO modified, 3 added selectors all proven `blog-`prefixed against the emitted bundle; tsc clean                                                                                                                                                  |

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

### PREVIEW ONLY — AND "title IS THE SLUG" WAS FALSE, CORRECTED IN #216

> **THE CLAIM BELOW WAS WRONG, AND IT HID A ONE-LINE FEATURE FOR THREE POSTS' WORTH OF work.**
> This section said `title` was the slug and editing it was the deferred rename arc. Measured:
> **the slug is the FILENAME** (`content/blog/<slug>.yaml`), **`title` is an ordinary
> frontmatter key**, `slugify` runs ONCE at create (`commit-collection-entry.ts:213`), and the
> commit path writes `content/blog/${slug}.yaml` with `slug` as a PARAMETER — a title patch
> **cannot reach the filename**. The read path has resolved title-then-slug since #170
> (`select.ts:55`). So the block was a POLICY nobody re-derived, wearing a false structural
> reason. **#216 deleted the one `if`, made `title` an ordinary editable field, and moved the
> read-only chip onto the SLUG** (the thing that genuinely cannot move). No schema field, no
> migration, no create-flow change; the URL / love counter / image dir / `generateStaticParams`
> are all slug-keyed and untouched. Publish REQUIRES a non-empty title
> (`validate-blog-post`, mirroring `alt`); blank falls back to the slug at read.
> **Seventh instance of the re-derive rule, and the first where the false claim was load-bearing
> enough to hide a feature.** The two OTHER collections carry the same false claim
> ("company/title is the entry slug… renames the file") — measured, editing them ALSO cannot
> move the file — but making them editable is a separate per-collection decision, **deliberately
> NOT swept here**.

**Of the head's five fields, `readingTime` and `date` stay uneditable for reasons that hold;
`title` is now editable in the INSPECTOR (not inline in the canvas — the head is preview-only).**

- ~~**`title` IS THE SLUG.**~~ **EDITABLE since #216.** It is a display field; the slug is the
  filename. It is not INLINE-editable in the canvas for the same reason nothing there is —
  the head is preview-only — but it is a normal inspector field, and the canvas tracks it live
  with a slug fallback. (A true SLUG rename — new file, moved images, a 404 on the old URL under
  `dynamicParams = false` — remains a separate, still-deferred arc, and is NOT what editing the
  title does.)
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

| Gate           | Result                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1 article DOM | **Byte-identical to main** across all 9 normalized files, re-run after BOTH commits. Two-build determinism control clean first. LCP preload and srcset survived nesting.    |
| G2 hero box    | figure `697.9297 x 392.5781`, img `695.9297 x 390.5781`, gap `44` — the article's production values, delta 0                                                                |
| G3 A1          | `697.9296875` with hero AND head present, **both pane states**                                                                                                              |
| G4 branches    | hero; no-hero **identical on both sides**; hero + zero blocks still shows the hero                                                                                          |
| G5 parity      | **3 pairs** (head 7, hero 3, prose 10 elements per side), **0 findings**, one `#blog-article-head`, zero duplicate ids                                                      |
| G6a            | the canvas renders a real `blob:` src at an unchanged box                                                                                                                   |
| G6b            | **UNVERIFIED, owner-only** — see the backlog                                                                                                                                |
| G7 projects    | DOM hash identical (`ad38db8`, 27 nodes); a real file driven through the picker hits the fs branch with ZERO JS errors                                                      |
| G8             | ralph 1075 → **1144** across 32 suites; nine mutations, all caught; **CSS bundle BYTE-IDENTICAL** — zero selectors added, which is the point of the inline style; tsc clean |

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

---

## ARC 8 — THE LINT GATE (COMPLETE)

`#195`, merged `bec28c4`, after `#194` (`9e3b1b2`) widened the inspector to 320 and moved
`FIT_THRESHOLD_PX` with it.

### IT WAS NEVER A TOOLING PROBLEM, AND THE RECORD SAID OTHERWISE FOR TWENTY PRs

STATE said in four places that "there is no lint gate because there is no ESLint config".
True, and misleading. **Every dependency was already installed** — eslint 9.39.4,
eslint-config-next 15.5.19, @typescript-eslint 8.61.1, eslint-plugin-react-hooks — and a
`lint` script already existed, pointing at `next lint`, which **with no config does not lint**.
A script whose name promises a gate that does not run is a comment describing code that does
not exist, living in package.json. Only one file was ever missing.

`next lint` is also DEPRECATED in the installed Next ("will be removed in Next.js 16", from
its own CLI), and its scaffold writes the legacy `.eslintrc.json`. So the gate is `eslint .`,
run through the npm script from both CI and a terminal — #183's rule again.

### THE COUNT DECIDED THE SHAPE, AND THE INVESTIGATION RAN FIRST

53 problems. 26 were ralph's shared `ok ? pass++ : fail++` idiom, 14 were one rule in one
file, 1 was generated. **~11 in application code across 9 files, NO locked-decision file
among them, and only 1 auto-fixable** — so there was no large mechanical diff to hide
judgement inside, and a recorded baseline would have deferred debt that could simply be paid.
**Counting before choosing is what made option (a) obviously right instead of arguably risky.**

### FOUR PREMISES FOR THIS WORK WERE WRONG, INCLUDING BOTH BUGS IT WAS SOLD ON

- **`exhaustive-deps` could NOT have caught #174's `saveDraft` bug.** That is a plain
  `async function` in the component body, not a `useCallback` — there is no dep array to
  check. The defect was calling a stale closure at the wrong moment, which no rule here sees.
- **No rule flags an unused EXPORT** like #178's `FIT_THRESHOLD_PX`. `no-unused-vars` does not
  — an export is a use by definition. That needs `import/no-unused-modules` (installed, not in
  `recommended`, not enabled) or `knip`/`ts-prune`.
- **`@next/next/no-img-element` is not in `core-web-vitals`**, is `warn` not `error`, and
  reports ZERO. **No config-level disable was needed for the locked plain-`<img>` decision.**
- The codebase already carried **13 inline disables**. It had been written as if lint were on,
  for twenty PRs, with the gate never running. **The gate confirms existing practice.**

**The real justification was a bug nobody predicted.** Sold on two it cannot see, it found two
others.

### WHAT IT FOUND

1. **AN ACTIVE, SECURITY-ADJACENT BUG — THE CONTACT HONEYPOT DID NOT WORK.** `botcheck` was
   missing from `advance`'s dep array, so the submit sent a stale value. **The repro is
   narrower than it looks:** filling the honeypot first does NOT expose it, because each
   `answers` change recreates the callback. It fires when the honeypot is filled AFTER the
   last real-field change. Driven both ways on one flow — pre-fix the POST carried
   `botcheck: ""` and the bot passed; post-fix it carried `"i-am-a-bot"`.
   **Split into its own commit because the distinction is URGENCY, not category.**
2. **A LATENT `rules-of-hooks` VIOLATION**, `ProjectsEditPanel:125` — `if (!isSelected) return
null` above a `useEffect`. **Not active:** the panel mounts outside any `ListDetailLayout`,
   so `ctx` is null, `isSelected` is always true, the early return never runs. It becomes a
   crash the moment the panel enters the shell its own comment says it is built for.
3. **AN ACCESSIBILITY GAP.** `SiteHeader` calls `useReducedMotion()` and **never consults it**,
   in a file that animates a blob menu, hides the nav row and fades a glass sheet.
4. **AN INTENT WIRED AT THE CALL SITE AND NEVER IMPLEMENTED.** `renderLink(settings, true)`
   passes `pinned`; the function ignores it.

**3 AND 4 ARE KEPT WITH A STATED REASON, NEVER DELETED.** Deleting silences lint and destroys
the only evidence the intent existed — **#178's `FIT_THRESHOLD_PX` failure in reverse, where a
constant had no consumer and here a consumer has no constant.**

### TWO THINGS THE FIXES THEMSELVES TAUGHT

- **`keystatic.config.ts`'s 14 `no-explicit-any` needed neither typing nor a disable.**
  Keystatic already types the parameter (`itemLabel?: (props: GenericPreviewProps<Schemas[K],
unknown>) => string`), so **deleting `: any` lets inference supply the real type.** Proven
  real rather than assumed: `props.fields.thesis.value.toFixed(2)` errors with `TS2551`, so
  the type is genuinely `string` and the fix is not cosmetic. The planned split was
  unnecessary.
- **A studio string was REWRITTEN, NOT ESCAPED.** The two `no-unescaped-entities` errors were
  apostrophes in `Fixed — a token's type can't be changed here`, which **also carried an em
  dash CLAUDE.md forbids and nothing had ever caught**. Those rules say rewrite rather than
  patch, so the dash and both apostrophes went together. **Lint found a writing-rule
  violation it cannot see, by pointing at the same line.**

### THE ONE ERROR IS DISABLED AT ITS SITE, NOT LEFT RED

The plan was to land with the `rules-of-hooks` error failing. **The owner reversed the
mechanism and kept the substance:** `continue-on-error` would make the gate ADVISORY from day
one, which is worse than the theatre it guards against — **a lint step that cannot fail is not
a lint step.** So the violation carries an inline disable naming the follow-up and stating its
latent severity, CI runs `npm run lint` with no escape hatch, and **every future violation
fails the build from day one.** The follow-up PR deletes the disable.

`--max-warnings 0` is deliberate: the rules that found things here are WARN by default, so
without it the gate would be advisory for exactly the class it is best at.

### GATES

| Gate                                       | Result                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| G1 the config runs                         | **0 problems**, exit 0                                                                                                                 |
| G2 behaviour-preserving                    | `ProcessSection` is a disable, not a dep change, so no effect timing moved. The honeypot is the one intended change, driven both ways. |
| G3 public DOM                              | **byte-identical to main** across all 9 normalized files; two-build control clean first                                                |
| G4 ralph + tsc + **the first LINT number** | ralph **1169** unchanged; tsc clean; lint **0 errors, 0 warnings**                                                                     |
| G5 CI                                      | `npm run lint` in `ci/ralph`, no `continue-on-error`, confirmed in the run log                                                         |

**A REVIEW CATCH WORTH KEEPING.** The PR modified `scripts/normalize-dom.mjs` — the G3 proof
tool — inside the PR G3 was gating. A broken `walk()` would silently shrink the branch
snapshot and the diff would read clean. Verified three ways: 9 files in every snapshot,
identical byte totals, and both `walk` implementations returning identical output over 123
files. **When a PR touches its own gate, prove the gate still sees.**

## #200 — THE PUBLISH BUTTON SAYS WHAT IT PUBLISHES

An author set a post's status to Published, pressed Publish, and it did not appear on `/blog`.
**Nothing was broken.** The bar merges the draft branch to main and rebuilds the whole SITE; a
post's `status` decides whether it renders. Both are right alone and ambiguous together at the
one moment an author decides they are done.

`Publish` -> **`Publish site`**, and nothing else in the bar changed. **THE REST OF IT ALREADY
KNEW** — the success message says "Your site is rebuilding" and the status line describes
CHANGES rather than an entry. The button was the only string that never named its object.

**`Publishing…` IS UNCHANGED, AND THE MEASUREMENT IS WHY.** It renders at **123.84px** against
`Publish site` at **123.77px**, so the pill does not jump mid-action. `Publishing site…` would
have. The ambiguity is in the RESTING label, which is what gets read while deciding; the
progress label appears only after the choice is made.

**THE HELPER LINE WAS THE AMBIGUITY, NOT A NEIGHBOUR TO IT.** `BlogEditPanel` read _"Live on
/blog once published"_, and by the time it shows the STATUS already reads Published — so "once
published" could only mean the site and said no such thing. An author reads it as already
live. **FIXED IN PLACE RATHER THAN EXPLAINED BESIDE**, because a second line would have
layered copy over an ambiguity instead of removing it. Same shape as #180's re-adding rather
than inventing.

`status` is untouched. Draft/Published is a universal CMS convention and breaking it would
cost more than it saves.

**NO RALPH SUITE WAS ADDED, DELIBERATELY.** These are copy strings, and a suite pinning them
would fail on every future wording change without ever catching a defect. **That is the line
between what is worth asserting and what is not, and this project has erred toward asserting
everything.**

### AN OBSERVATION, NOT A SCOPED ITEM

**`Publish site` deploys the entire site with NO confirmation, while Discard has a mandatory
one.** Publish fires straight from `onClick`; the only confirm in the bar is Discard's. That
is backwards against consequence — Discard deletes a draft branch, Publish ships everything to
production — and **hazard 13 is on record as a publish that shipped a half-finished
sentence.** Recorded because it is the kind of asymmetry that becomes invisible once you are
used to it. No fix proposed and none scoped.

---

## #201 — THE DROPPED SAVE

`useDraftForm`'s in-flight guard read `if (!dirty || savingRef.current) return;`. A save
requested while another was in flight **returned and scheduled nothing**. The author's second
edit stayed in `values` and `dirty` stayed true — **the state was honest the whole time**,
which is exactly what made it invisible — but the save never happened until some later blur,
the Save button, or never. A save takes under two seconds against GitHub, so the overlap
window is routine rather than theoretical. Shared by every studio panel.

**THE TRAP IS THE RECORD, NOT THE FIX.** The obvious `finally` retry re-invokes a closure over
stale `values` and re-posts the **pre-edit snapshot** — #174's defect, the one #187 built its
`pendingSave` machinery to dodge. Two POSTs both carrying the old body **looks like a working
retry, and a count assertion passes it.** That is the shape to remember: the wrong fix here is
indistinguishable from the right one under the gate you would reach for first.

**THE FIX IS THREE PARTS AND `saveOwedRef` ALONE IS NONE OF THEM.**

1. The guard **records an owe** instead of returning bare.
2. `saveDraft` reads **latest-value refs assigned every render**, so the retry posts what is
   on screen now. One line, so there is no list of mutation sites to keep in sync and
   therefore no site to miss.
3. `baselineRef.current = committed` is set **synchronously beside `setSavedBaseline`**,
   because the retry fires in `finally` — before that state lands — and would otherwise
   compare against a stale baseline and fire a redundant save.

**G1 ASSERTED THE SECOND BODY, NOT THE SECOND POST.** Slow-stubbed save, edit A, blur, edit B
mid-flight, blur. On `main`: **1 POST, B never reaches the wire.** On the branch: **2 POSTs,
gap 1503ms**, and `secondBody.heroRoleLabel` carried **this run's B** — a value that did not
exist when the first closure was created, so a stale closure could not have produced it.
G3 held the other side: one edit with a double blur is still exactly **one** POST, and a no-op
blur posts **zero**. Coalescing must not resurrect commit spam.

**NO SECOND GUARD IN `BlogBlocksEditPanel`, DELIBERATELY.** It clears `pendingSave` BEFORE
calling `saveDraft`, which used to lose the owe entirely — the canvas lost more than the
inspector, which at least had a next blur coming. The shared change closes that at the source,
so a guard there would be two mechanisms for one problem, and **a guard that cannot fire is a
comment describing a defence that is not defending.**

### MY PART B PREMISE WAS WRONG

The investigation was briefed on "nothing on screen says a save is in progress". **`SaveIndicator`
has had a `saving…` state since it was written** — `{saving ? "saving…" : dirty ? "unsaved" :
"saved"}`. **#178 made the LABEL required, not the state.** The real defects were two others:
the feedback sits **334.6px** from where the author types, and **below `INSPECTOR_FOLD_PX` the
canvas view rendered NO indicator at all** while being the only view where inline editing
works. Not off-screen, not scrolled away — not rendered. It now carries one, gated on **both**
`!inspectorFits` and `view === "canvas"`, because `canvasBar` renders unconditionally above the
swapped content and one condition alone would duplicate it in the inspector view.

**A RALPH SUITE WAS ADDED HERE WHERE #200 REFUSED ONE**, and the difference is the line #200
drew: a simplification back to a bare `return` **silently loses author data**, produces no
error, and nothing else in the repo would notice. It can fail for a reason.

---

## #202 — THE BLOCK-IMAGE PREVIEW

The same `draftImages` snapshot gap #190 closed for the hero, **one consumer over**.
`BlockImageField` handed its parent a PATH only; the `File` was in scope in `upload(file)` and
thrown away. Measured rather than argued: the just-uploaded path returns **404**, an
already-published one **200**.

`onChange` now carries the `File`, and a **path-keyed preview map composes AHEAD of**
`makeDraftSrcRewriter` inside the `rewriteSrc` the panel already passed — no change to
`BlogProse`, the same trick #190 used. **ONE COMPONENT**, so `imageBlock.src`,
`videoEmbed.poster` and the case-study editor's **emit half** are all fixed at once. The
widening is additive: both call sites pass one-arity arrows and a lower-arity function is
assignable to a higher-arity type, so nothing was forced to change.

### THE FIX DOES NOT TRANSFER FROM #190, AND THAT IS THE DURABLE PART

The brief for this PR said _revoke on supersede and unmount_, carrying #190's rule across. **The
precondition does not hold.**

- **The hero's key is FIXED.** One slot, one holder — a new upload replaces that key, so
  revoking the old url is correct there.
- **Block image paths are CONTENT-ADDRESSED.** `blockImageHash` is sha256 of the normalized
  bytes, so the same image in two blocks yields the same path. A new upload does not overwrite
  a key; it creates a **NEW** key and **orphans the old one, which another block may still be
  showing.**

**Under content addressing a supersede does not happen.** So the map is **APPEND-ONLY**,
`adopt` is idempotent per path, and `releaseAll` at unmount is the only revoke. Revoking on
removal _or_ on replace would rebuild #193's shared revocable resource inside the cleanup meant
to prevent a leak.

**NO PER-PATH RELEASE API EXISTS, AND THE ABSENCE IS ENFORCED RATHER THAN DOCUMENTED.** Ralph
fails if one is added under any of six spellings (`releas`, `revok`, `remov`, `delet`, `free`,
`forget`/`evict`/`drop`). The dangerous operation is not one nobody happens to call — **it does
not exist**, which is the same move as preferring a mapped type over a `Set`.

**A1, MEASURED NOT ASSUMED.** The list rail makes switching posts one click, which did not
exist in #190's world. The transition **is** client-side (a window property set before the
click survives), so the obvious guess is that the panel is reused and the map outlives the
post. It is not: **React drops the subtree and builds a new one** — `view` resets to its
initial value and the canvas node is a different element carrying none of the old one's
expandos. **`releaseAll` fires on every post switch, so the bound is uploads-per-POST.**

**G3 IS THE ASSERTION THE DESIGN EXISTS FOR.** Two blocks given the same bytes render **one**
shared blob url; remove one and the survivor still holds it and still decodes
(`naturalWidth 40`, `complete: true`). Negative control: revoking that url by hand kills a
fresh consumer, so the assertion is capable of failing.

### THREE STRATEGIES FOR ONE PROBLEM, ALL DELIBERATE

Nothing recorded this before #202, and the next person to unify them will break one.

|                      | strategy                                           | why it suits its surface                                                                              |
| -------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ImageThumb`         | proxies **every** src unconditionally              | a 36px thumb can afford a GitHub round trip per image; one code path, always correct                  |
| the canvas           | `makeDraftSrcRewriter`, the **page-load snapshot** | a full-width figure cannot afford the proxy for every image, so published paths keep the static route |
| `preview-map` (#202) | an **object URL** for a file uploaded this session | resolves what neither can, because the snapshot predates the upload                                   |

**This is why the field's thumbnail worked while the canvas showed nothing** — same upload,
different strategy. A comment at each of the three sites names the other two.

---

## #203 — EVERY BLOG POST GETS ITS OWN SOCIAL CARD

All three posts shared one image, `app/opengraph-image.png`, the brand identity plate. **Nothing
was broken** — production served complete OG tags and a valid 1200×630 PNG. The card simply said
nothing about the post. `/blog/<slug>/og` now renders the post's own, through the existing
`renderOgImage`. Topic as the eyebrow, title, dek.

**NO DATE, NO READING TIME, NO HERO.** A card is re-shared long after publication so a visible
date only ages it, and reading time is a decision aid once you are on the page rather than in a
feed. The hero refusal is the substantive one: compositing it means Satori fetching a remote
image at render time, which is a network dependency per card, a failure mode that differs per
post, **and the draft-branch 404 reappearing INSIDE the renderer** for a hero uploaded but not
published. One typographic composition. The index plate's PRINCIPLE is mirrored (_"never a
hole"_), its implementation is not — a second composition for the null case is the branch that
then drifts.

### THE ROUTE WAS FIXED RATHER THAN TWINNED, AND THAT DECIDED THE PR'S SHAPE

Investigating the case-study route to copy it found **`/projects/not-a-real-slug/og` returning
200 and a PNG on production.** Two things combined, and the first is a belief rather than a line
of code.

**`generateStaticParams` IS A BUILD MANIFEST, NOT A GATE.** It decides what gets _prerendered_;
`dynamicParams` decides what is _allowed_. With no such export it defaults to true, so the
filtered list was a hint and every other slug rendered on demand. `/blog/[slug]` has carried
`dynamicParams = false` since it was written and 404s correctly; the OG route never had it, and
**the difference was invisible because both looked like they enumerated a list.**

Second, `data?.title ?? "Case study"` turned "no such entry" into a successful render. **The
default was doing the work of a 404 while returning a 200.**

**Harmless today is not the same as correct.** Projects have no draft state, so it leaked only a
contentless card — safety that is a property of today's CONTENT rather than of this code. Blog
does have drafts, so the copy would have been a real leak. Fixed in its own commit, first.

### `dynamicParams` ON A `route.ts` WAS GENUINELY UNVERIFIED HERE

No route handler in this repo used it, and Next's docs are not the same as this repo's build.
**Proven at build level via the prerender manifest**, which is where the flag lands:

| route                 | before           | after                                                         |
| --------------------- | ---------------- | ------------------------------------------------------------- |
| `/projects/[slug]/og` | `fallback: null` | **`fallback: false`**                                         |
| `/blog/[slug]/og`     | —                | **`fallback: false`**                                         |
| `/projects/[slug]`    | `fallback: null` | unchanged — **it 404s only via its component's `notFound()`** |

That last row is why defence 3 is load-bearing rather than belt-and-braces.

### THREE DEFENCES, AND THE THIRD IS INDEPENDENT ON PURPOSE

`generateStaticParams` reads the status-filtered `getBlogPosts`; `dynamicParams = false` refuses
anything outside it; **and the handler itself refuses a non-published post.** `getBlogPost` is
UNFILTERED by design (the studio preview needs drafts), so without the third check a draft would
render its real title and dek at a guessable URL while the page 404s. **Never a `?? "Blog"`.**

**The article page's defences do not reach here.** `notFound()`, `generateMetadata` and the
component gate do not exist for a route handler — **#175's shape again**, where existing
defences are right for their own surface and silent about a new one.

### THE MEASURED CONSTANTS, AND THE FIRST ESTIMATE WAS WRONG

The investigation claimed the longest real title was "comfortably two lines" and flagged it as
arithmetic. Measured with **the exact Fraunces 600 TTF `lib/og.tsx` fetches**, loaded as a
`FontFace` and replicating Satori's greedy wrap at `maxWidth 1000`:

| size     | fits                     | overflows          |
| -------- | ------------------------ | ------------------ |
| **84px** | 3 lines, **+73px slack** | **4 lines, −15px** |
| **68px** | 4 lines, +52px           | 5 lines, −19px     |

**"What a design system is for when the machine can draw" (53 chars) is THREE lines and sits one
line from the edge.** That is the difference between a threshold that holds and one that holds
until a future post.

- **60-character step-down** to 68px. Prose first needs a 4th line at 84px at **71** characters,
  so 60 carries 11 of headroom; a long-word title was already 3 lines by 50, so it is
  conservative there too. All three current posts are ≤53 and stay at 84px, so **no card
  changed shape**.
- **100-character cap.** At 68px prose holds 4 lines to **109** and first needs a 5th at
  **116**, so 100 can never overflow, with 9 spare. **What it costs when it fires is recorded:**
  the ellipsis takes the END, so a headline whose payoff is its last clause loses exactly the
  part that earned the click. That is the argument for the step-down existing at all — it pushes
  truncation past roughly fifteen words.
- **WORD-BOUNDARY TRUNCATION, and it came from looking at a render.** A raw slice produced
  `…to draw the s…`, a cut mid-word that reads as a rendering fault rather than an elision.
- **THE EYEBROW IS UNCAPPED AND THE NUMBER IS RECORDED SO THAT IS A DECISION.** `topic` is free
  text with no schema-side set. It overflows at **51** characters against 976px of available
  width; the three real topics are 13-14 (243-272px), so the longest carries **36 characters of
  headroom**. A cap would be **a guard that cannot fire**, and a threshold constant with no
  consumer is a shape this repo has already deleted once (`FIT_THRESHOLD_PX`). The number
  belongs in the record, not in the code.

**The constants live in `lib/og-fit.ts`, a plain `.ts` leaf**, because `lib/og.tsx` is `.tsx` and
node's type-stripping cannot load it — so ralph DRIVES them rather than regexing them. Same
reason as `hero-fill.ts` and `preview-map.ts`.

**AN EMPTY `topic` IS REAL, NOT HYPOTHETICAL** — free text, and a studio-created post starts with
`""`. It used to leave the 48px accent rule floating with no label, so the whole row is dropped,
with an empty box keeping `space-between` honest. Also found by rendering it rather than
reasoning about it.

### THE DOM GATE HAD TEETH FOR ONCE

Every recent PR asserted byte-identical public HTML, where a pass means "nothing leaked". Here
the expected diff was exact: **`og:image` and `twitter:image` on the three post pages, and the
other eight files byte-identical** — so `/blog` and `/` keeping the identity plate was proven
rather than assumed. Two-build control clean first.

---

## ARC 9 — THE INK CHROME (COMPLETE)

Six PRs. The owner's design contract is `docs/studio/studio-ink-chrome.html`.

| PR                 | what it settled                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#204** `e25a863` | **The ink shell.** Sidebar and topbar recede into darkness, scoped to `lg:` and up. On-ink foregrounds taken from the existing scale — **no new `@theme` token**. |
| **#205** `466df8e` | **The panel language.** Wells, hairlines at `/12`, the ink bands. Shipped with a stated gap: 21 entry-panel inputs carried the geometry as literals.              |
| **#206** `37286cc` | **The input dedupe.** Those 21 sites consume the shared exports. The 13/14px split kept, deliberately unresolved.                                                 |
| **#207** `d75eeb0` | **The radius scale**, 12 / 8 / 4, scoped.                                                                                                                         |
| **#208** `e938c16` | **The fidelity repaint.** Items 3, 6, 7, 8, 9, 10 of eleven. Led by the dead band utilities. Produced `studio-cascade`.                                           |
| **#209** `2488500` | **The selection language.** Items 1 and 2, the last that is paint.                                                                                                |

### THE THREE SCALES — THE DURABLE OUTPUT, AND ALL THE SAME SHAPE

Each is **named by ROLE, not by value**, so a new element can be placed without reading call
sites to infer the rule.

- **RADIUS — 12 / 8 / 4.** Scoped custom properties on `.studio-chrome`, because `@theme`'s
  `4/8/16/24` **cannot express a three-step hierarchy**: halving lands on 12/8/4 and there is
  no 12, so the studio would have collapsed onto two radii. Every step an exact halving of what
  shipped before. _panel_ = a page-level shell, _card_ = a row or floating surface, _control_ =
  anything clicked or typed into.
- **GROUND — cream-200 chrome / cream-100 field surface / cream-50 well.** _Chrome_ is a header,
  footer or rail; _field surface_ is anything holding inputs; _the well_ is the input itself.
- **SELECTION — ground + 1 step, plus an identical 3px accent left bar.**

**THE RULE ALL THREE SHARE: EACH IS A RELATION, NOT A VALUE.** A fixed number across differing
grounds was attempted or nearly attempted **three times in this one arc** —

1. **#205's input colour**, set to cream-100 as an absolute, which worked on the cream-50 entry
   panels and made the input identical to its ground on the cream-100 inspector;
2. **the fidelity findings' item-3 recommendation** (mine), "inputs to cream-50, panes
   unchanged", which would have collided on the six cream-50 entry panels instead;
3. **PR B's selection fill**, where one hex across three grounds was the obvious move.

Each would have been **three bugs wearing one number** — correct on the surface its author was
looking at, arbitrary on the others, and every class string looking right in review.

### THE FILL WAS NEVER THE SIGNAL

Measured: every step on the cream ladder separates by **1.05 to 1.19**, and the accent tint the
bar replaced was **1.15 — inside that same band**. The bar reads **3.43 to 4.48**.

**That explains the original complaint rather than merely fixing it.** Selection on the blog
rail was invisible (1.103) not because the wrong cream was chosen but because _no_ cream could
have worked. Any future surface needing selection needs the **bar**; a darker fill will not do
it. Hover and selected therefore share a fill by necessity — at 1.05 per step the ladder cannot
encode three legible states.

### THE SIZES DID NOT MATTER

Item 9 read as a size problem and was a **weight** problem. Studio carried only 28 `font-medium`
and 4 `font-bold` in total against a contract asking for 500/600/700. **Re-measured after the
weights landed, three deltas remained at 0.5px — invisible — and the fourth is #199's
deliberate 13/14px split.** Nothing was changed on sizes. A delta that disappears once another
property is correct was never a problem in the property you first blamed.

### MODIFIED WAS 0, AGAINST MY PREDICTION

PR A's plan said the CSS union gate's `MODIFIED` would be non-zero **for the first time in the
arc**, because the cream values genuinely move. It came out **0**, for an instructive reason: a
ladder re-tier changes **which utilities are USED**, never **what a utility MEANS**. Both PRs'
`globals.css` changes were additive (PR A) or comment-only (PR B), so **the public site was
never reachable** — a stronger guarantee than the gate itself provides, and available by
inspection before running anything.

---

## LOCKED DECISIONS (do not change without being asked)

All prior locked decisions remain. Added across this session:

- **SECTION HEADERS, SPLIT BY ROLE — INK BAND FOR INSPECTOR PANES, CREAM-200 BAR FOR ENTRY
  PANELS.** The owner's decision, and it is neither "generalise the band" nor "declare the band
  blog-only". **The band's own reasoning is about a NARROW PANE ADJACENT TO INK CHROME** — it
  anchors the inspector to the sidebar. That reasoning does not transfer to a ~967px full-width
  form, where a band becomes a large slab of ink in the middle of a cream page. So:
  **inspector pane → ink band + `sechead`; entry panel → `bg-cream-200` bar + `font-display`.**
  `SkillsEditor`'s `CategoryPanel` gets a **cream-200 bar**, matching its five siblings — it is
  an entry panel, and its missing header is a real gap either way.
  **`studio-ink`'s band count goes 2 → 2 now, and 2 → 4 when the case-study inspector lands.**
  Both revalues are DELIBERATE; the assertion stays a COUNT because a count is what makes an
  accidental band fail. Record the rule in both places so the next header is picked by rule
  rather than by copy-paste.
  **THIS IS THE THIRD TIME THE BY-ROLE SPLIT HAS BEEN THE RIGHT ANSWER**, after
  listbox-versus-select and three-pane-versus-list-detail. When two treatments both look
  defensible, the question that resolves it has been "what ROLE does this element play", not
  "which treatment is better".

- **TWO SELECT SHAPES, SPLIT BY ROLE.** `ListboxField` (the animated custom control) is for a
  CONTENT field the author reasons about — the blog topic, its one consumer. The native
  `SelectField` (`blocks/fields.tsx`) is for a CONFIG toggle inside a block shell — variant,
  layout, frame ×2 — where a native `<select>` is keyboard- and screen-reader-correct for free
  and strictly better (`CaseStudySwitcher`'s header records this). Do NOT reach for the listbox
  for a new config toggle. The rule lives in both component headers. MIGRATION TRIGGER (named so
  the split cannot become drift): migrate the four SelectField sites to the listbox only if one
  needs that treatment, or if they begin to look wrong beside it.

- **THE STUDIO HAS THREE SCALES, ALL NAMED BY ROLE, ALL RELATIONS RATHER THAN VALUES.**
  **RADIUS** panel 12 / card 8 / control 4, scoped custom properties on `.studio-chrome`.
  **GROUND** cream-200 chrome / cream-100 field surface / cream-50 well.
  **SELECTION** ground + 1 step, plus an identical 3px accent-500 left bar.
  Placing a new element means asking **which role it plays**, never which number a neighbour
  used. **Do not collapse any of them to a fixed value across differing grounds** — that was
  attempted or nearly attempted three times in the ink chrome arc and is three bugs wearing one
  number. Full reasoning and measurements in ARC 9; the ladder's roles are also documented in
  `app/globals.css` beside the radius block, which is where someone adding a panel will look.
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
- ~~**`ThreePaneShell` STAYS BLOG-SPECIFIC** until a second consumer.~~ — **CORRECTED IN PR 5.
  The trigger was met, and THE COUPLING THIS ENTRY DESCRIBED WAS POLICY, NOT STRUCTURE.** The
  rule was right and is why nothing was generalised early. But when the second consumer arrived,
  the audit found the blog-shaped surface was FOUR THINGS, not an architecture: two `aria-label`
  strings and ONE HARDCODED BREAKPOINT. `list`, `canvas` and `inspector` were already opaque
  ReactNodes, the collapse rule was already a pure function, and the save indicators were always
  the consumer's. So PR 5 was a LABELLING SEAM PLUS A THRESHOLD SEAM, not an extraction — calling
  it an extraction would overstate what changed. **The shell now knows no collection at all**;
  it takes `fitThresholdPx` and `listNoun` and PR 7 adds the actual second consumer.
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

- **KNOWING WHICH DIRECTION AN APPROXIMATION ERRS IN IS THE WHOLE DIFFERENCE.** Proposed during
  the sidebar-resize investigation: if the sidebar becomes variable, keep the fit threshold a
  constant "derived from a MINIMUM sidebar width". **That fails in the silent direction.** With
  `T = S_min + panes`, a WIDER sidebar leaves the panes less than `T` promises, so the threshold
  says three panes fit when they do not — no error, no failure, just a canvas under its measure.
  That is #194's defect exactly.
  **The MAXIMUM is the sound version of the same idea.** `T = S_max + panes` over-collapses when
  the sidebar is narrow: it wastes space and never lies. Both approximate; only one of them
  degrades safely.
  **The general form: an approximation is not characterised by its magnitude but by its SIGN.**
  Before accepting one, say which way it is wrong and what happens when it is. A bounded error in
  the unsafe direction is still unsafe — "within 120px" is no comfort if those 120px are the ones
  that silently drop the canvas below its floor.

- **A RECORDED TRIGGER NAMES A DEFECT; ITS PRESCRIBED REMEDY IS A HYPOTHESIS FROM THE MOMENT IT
  WAS WRITTEN. RE-DERIVE THE REMEDY, NOT JUST THE DEFECT.** The arc closed with three named
  triggers. The first was "matchMedia -> a ResizeObserver on the shell", and **following it
  literally would have shipped a worse bug than the one it closed.**
  **MEASURING THE SHELL IS CIRCULAR.** Its root is a flex ROW container with `min-width: auto`,
  so its width is set by its own panes' min-content — driven at a 900px viewport it measures
  **1309px inside an 885px page**, and a threshold read off it would answer "fits" where nothing
  fits. `<main>` and the shell's parent stay at 885, being `min-w-0` or column items; only the
  shell overflows. The remedy was written while looking at the wide case, where the shell is
  constrained by its parent and the circularity is invisible.
  **AND THE DEFECT ITSELF WAS RECORDED LESS SHARPLY THAN IT COULD BE.** It is not "query vs
  measure". `matchMedia` measures the VIEWPORT; every pane divides the PAGE BOX; the constants
  were page-space sums all along. **The numbers were right and the comparison was wrong** — a
  smaller, cleaner bug than the one written down, and one that no constant had to move to fix.
  **This is the same family as the six above**, one level up: there, claims about the code decayed
  when the code moved. Here a claim about the FIX was never tested at all, because a trigger is
  written at the moment you decide not to do the work.

- **EVERY PREMISE WRITTEN ONCE AND TRUSTED LATER TURNED OUT WRONG WHEN RE-MEASURED — SIX TIMES
  IN ONE ARC.** This is the most reusable thing the studio consistency arc produced, and it is
  worth stating as a rule rather than leaving as six anecdotes:
  1. **The 4.5-screen inspector scroll.** Accurate when taken, against a full-page scroll with
     ~574px of room. #233 gave the inspector its own container and fixed most of it AS A SIDE
     EFFECT. Real worst case **3.03**, and nobody re-measured for four PRs.
  2. **PR 3's promised band count.** "It becomes 4 when the case-study inspector lands." It
     landed; the count is 2. The rule maps a treatment onto a role that exists; it does not
     conjure the role.
  3. **#233's predicted E6 self-correction.** `ProjectsEditPanel` was expected to leave the
     derived set. It stayed in, correctly. The derivation was right and the prediction about it
     was not.
  4. **#232's "the ceiling is fixed".** See the rule below — it fixed the subject, not the
     dependency.
  5. **The contract's block-collapse default.** Wrong about the DATA rather than the design: 12
     of 14 sections have one block, so the proposed default was a no-op on 86% of the content.
  6. **My own "the 15px is pane borders".** It is `scrollbar-gutter: stable`. The first reading
     of a measurement is a hypothesis, including when it is mine.
  **ALL SIX WERE CAUGHT BY RE-DERIVING, NONE BY A GATE**, which is the uncomfortable half.
  **THE COROLLARY, AND IT IS THE ACTIONABLE PART: the gates that survived are the ones that
  DERIVE FROM SOURCE rather than pinning an instance.** `studio-ink` E5 now walks every studio
  file for the ink band, because pinning it to `BlogBlocksEditPanel` is exactly what let (2) go
  unchecked for three PRs — a second inspector could have grown a band or lost one and the
  number would not have moved. Prefer a gate that recomputes the set to one that remembers it.

- **NAMING A BOX THAT MIGHT BE EMPTY IS NOT THE SAME AS NAMING WHAT IS IN IT.** The Selected
  rail's textarea caps against the canvas's height. Version 1 measured from the textarea, which
  does not exist until a field is selected, so the effect ran at mount, found nothing, and never
  re-ran — **uncapped, with nothing failing**. Version 2 anchored to the rail and DOM-walked to
  `parentElement.firstElementChild`, correct only while the rail sat in that grid. **#232 passed
  the ceiling BY REF** so a relayout could not silently retarget it, and its own comment
  predicted the exact failure that followed. It was half a fix and it was approved as a whole
  one.
  **A ref fixed the SUBJECT; the effect still keyed on the ref OBJECT, which never changes**, so
  it ran once at mount. PR 7 moved the rail into the inspector, which mounts with the page, while
  the canvas div appears only on selection — so the effect found `null`, bailed, and never
  re-ran. **Version 1's failure reached by a different road**, measured at 3166px of textarea in
  an 811px pane.
  **A callback ref versus an object ref looks like a detail and is not: the second gives the
  effect something to depend on.** An element held in state re-runs the observer the moment the
  node mounts. When an effect must react to a DOM node appearing, depend on the NODE.

- **A FLOOR THAT COVERS AN ARITHMETIC GAP IS HONEST ONLY IF THE GAP IS WRITTEN DOWN.** At the
  case-study fit threshold the panes measure `236 + 264 + 625 + 320 = 1445`, not 1460: the canvas
  gets **625 where the arithmetic promises 640**, so the raw fit is 0.488 and what lands the
  rendered transform on exactly 0.500 is `useFitToWidth`'s clamp. **The floor is load-bearing at
  the threshold, not a safety net** — delete it as a simplification and the canvas ships at 48.8%
  with nothing failing.
  **The 15px is `scrollbar-gutter: stable` on `html` (globals.css:222), not pane borders** — that
  was the first reading and it was wrong, since 264 and 320 are border-boxes with their borders
  already inside them. `matchMedia` matches the VIEWPORT while the layout receives the viewport
  minus the reserved gutter, so **every media-query threshold in the studio inherits the gap,
  blog's 1614 included.**
  **Do not close it by adding 15 to the constant.** 15 is this machine's scrollbar width, 0 where
  scrollbars are overlays, ~17 on Windows; baking one platform's value into a shared constant
  makes it wrong everywhere else. The durable fix is to make the query measure what the layout
  gets — a ResizeObserver on the shell rather than `matchMedia` on the viewport — which removes
  the discrepancy by construction. Pinned in `three-pane` Part I until then.

- **AN ASSERTION MUST NOT PIN ITS NEIGHBOURS.** `studio-ink` E6 guards a COLOUR property — the
  canvas strip sets `text-ink-600` on the row so its anchor inherits, because a `text-*` utility
  on an `<a>` is dead. Its regex read `px-4 py-2 text-ink-600"`, so #213 changing the strip's
  PADDING — a change about height, with no bearing on colour inheritance — **failed a colour
  assertion.**
  **The danger is not the false failure, it is the repair.** The cheapest fix is to widen the
  regex until it passes, and a regex widened under pressure stops guarding anything. Repinned on
  the colour and the `border-b` that identifies the strip, and on nothing about its box.
  **Match the property the assertion is named for, and nothing that merely sits beside it.**

- **MOVING A GROUND INVALIDATES EVERY VALUE MEASURED AGAINST IT — RE-MEASURE, DO NOT CARRY
  FORWARD.** #214 made the topbar solid ink-950, which changed what all eight `ON_INK` rows
  composite against. **Six of seven improved and one regressed below its floor**: the search
  well's `white/12`, derived in #211 against a bar at 51,43,39, fell **1.45 → 1.32** on the
  darker ground and had to be re-derived to `white/16`.
  **THE VALUE DID NOT CHANGE; ITS GROUND DID** — and carrying the old numbers into the table
  would have shipped a gate that agreed with itself and disagreed with the screen, which is
  worse than no gate. The improvements matter as much as the regression: had the table simply
  been re-asserted at the old floors it would have PASSED while silently under-describing six
  foregrounds.
  **This is the third face of the relation-as-value family**, after freezing a relation into a
  number and attaching a number to the wrong surface: here the number and the surface were both
  right, and the surface moved underneath it.

- **AN "AT LEAST" GATE CANNOT EXPRESS AN "EXACTLY".** The L's two halves must be the SAME
  colour, so their assertion is an equality at 1.00 and anything above it is the defect
  returning. A shared `>= min` would have passed **1.44 — precisely the value being fixed**.
  When a row means "identical", say so in the test rather than picking a floor loose enough to
  cover it.

- **A MEASURED VALUE BELONGS TO ITS CONTEXT, AND THIS IS THE MIRROR OF THE RELATION-AS-VALUE
  RULE BELOW — ONE FAMILY, SEEN FROM BOTH SIDES.** That rule says: do not freeze a relation
  into a number. This one says: **a number you measured is only true about the surface you
  measured it on.** Three findings in #211 share exactly that root, and every one was a
  CORRECT value attached to the WRONG surface:
  1. **`5.45:1` for the search placeholder** — measured against the SIDEBAR's `ink-950`, then
     applied to the TOPBAR's well, which is ink/85 over cream plus a white wash, two
     compositing steps lighter. Where it actually renders it was **3.27**, below AA.
  2. **`w-full` on the card-image plate** — correct in the 320px inspector, and **941×1255px**
     in the 967px About panel. The narrow pane had been hiding it.
  3. **A ground colour** — correct on the cream-100 inspector, colliding inside a cream-50
     nested card on the case-study editor.
     **Four instances of encoding a relation as a value, three of attaching a value to the wrong
     context.** Same failure, opposite directions: one forgets the number depends on something,
     the other forgets what it depended on.
     **Ask "measured against WHAT?" before reusing any ratio, width or colour.**

- **A COMMENT CARRYING A STALE MEASUREMENT MAKES A LATER FIX QUIETLY FALSER — the sharper half
  of the rule above.** A wrong number sitting in prose is not inert. The search comment claimed
  the placeholder was `5.45:1` and "should sit below the value in the hierarchy", which reads
  as a considered decision. It was 3.27. **And brightening the well — the correct fix, arrived
  at independently — would have driven it to 2.60, under even the 3.0 UI floor, while the
  comment still said 5.45.** The stale number would have licensed the regression by making it
  look already reasoned about.
  **When you move a surface, re-measure everything the old comments claim about it**, because a
  comment is the one thing no gate reads.

- **TESTING THE OPPOSITE DIRECTION AND LOSING ON EVIDENCE IS WORTH THE FIVE MINUTES.** "Well"
  implies recessed, so a darker well on the ink topbar seemed obviously right — the metaphor,
  the word itself, and the cream ladder's own logic all point that way. Measured, **every black
  alpha from 15% to 35% lands at 1.10–1.22 against the bar, worse than white/12's 1.45**,
  because the ink bar is already near the bottom of the range and there is no room beneath it.
  **Lighter is correct on ink for the opposite reason it is correct on cream**: on cream the
  well is lighter because it is the writable surface, on ink it is lighter because darker has
  nowhere to go. Recorded because the intuition is strong, plausible and wrong, and the next
  person will have it too.

- **A COMPONENT MOUNTED ON SEVERAL GROUNDS MUST NOT ASSERT ONE.** The ladder is relational, and
  PR C found the case where no absolute value works at all. `BlockImageField`'s container was
  `cream-100` and collided on the cream-100 blog inspector. The obvious fix was the ladder's
  well step, `cream-50` — and measured, THAT collided too: on the case-study editor the
  videoEmbed "Poster still" field is nested inside a cream-50 CARD. One absolute traded for
  another, the fourth instance in this arc.
  **The row is used on cream-100, on cream-50 panels and inside cream-50 cards, and Tailwind has
  no "one step lighter than my parent" utility.** So the container now DECLARES NOTHING: it
  inherits, its border delineates it, and the plate inside is cream-200 which reads against
  every cream step. **Declaring no ground is correct on all three by construction.**
  Ask what grounds a component can land on BEFORE giving it one.

- **GENERALISING THE ASSERTION BEATS CLOSING THE INSTANCE — THREE TIMES NOW, AND IT WON EVERY
  TIME.** The pattern is the same each time: the obvious gate encodes the bug you just found,
  and the general one derives the rule the bug broke.
  1. **`studio-cascade`** derives the unlayered element rules from `globals.css` instead of
     asserting the four known collisions. **Found five more on its first run.**
  2. **`studio-ink` G1** asserts a _ladder step_ rather than a hex, so a relation cannot be
     re-encoded as a value the way #205's input colour was.
  3. **`studio-tokens`** derives the legal colour set from `@theme` instead of banning
     `text-ink-500` and `text-ink-700` by name — so **the next invented step fails on arrival
     rather than after 51 uses**.
     The instance-specific version of each would have passed on everything except the exact bug
     already fixed. **When you find a dead class, ask what rule it violated, not what its name
     was.**
- **A FIX SCOPED TO ONE SURFACE IS NOT A LESSON LEARNED.** `globals.css:1893` documented
  hazard 11's mechanism for `h3–h6` versus `.font-display` **in full, with the reasoning** — and
  fixed it only for `.case-study`. Nobody generalised it, so **#205 walked straight into the
  `h1, h2` half** and shipped ink bands whose family, weight and letter-spacing were all dead.
  The knowledge existed, was written down, was correct, and did not travel.
  **When a fix is scoped, say what the unscoped case is**, or the next person meets the same
  trap with the documentation sitting three hundred lines away in a file they had no reason to
  open. The general form of this is now `studio-cascade`, which derives the rule instead of
  encoding the instance.

- **"GROUND + 1 STEP, PLUS AN IDENTICAL BAR" — THE FORM A SHARED VISUAL RULE SHOULD TAKE.**
  PR B paints one selection language across three surfaces sitting on three different ladder
  steps. **The shared thing is the RULE and the BAR; the fill value differs on every surface**
  — cream-100, cream-300, cream-200 — precisely so the relation holds everywhere. A single hex
  would have been **the third instance in this arc of a relation encoded as a value**, after
  #205's input colour and my own item-3 recommendation.
  **The generalisation:** when a treatment must read the same on grounds that differ, share the
  _step_ and share the _constant_ (here, the bar). Sharing the literal is what makes it three
  bugs that each look correct in isolation.

- **A SUBSTRING CHECK ANSWERS THE WRONG QUESTION, AND COMMENTS ARE PART OF THE FILE.**
  Two PR B assertions passed mutation because they used `src.includes(...)`: collapsing the
  strip onto a shared hex survived because `bg-cream-200` appears four times in that file for
  unrelated controls, and **deleting `border-l-transparent` survived because the string also
  appeared in the comment explaining why it was there — the assertion was reading my own
  prose.** This is the second time in one session a check matched documentation instead of
  code (the first tripped on the English word "rounded").
  **STANDING METHOD: strip comments, then parse the construct you are asserting about** — the
  ternary branch, the declaration — rather than asking whether a token appears anywhere.

- **A RELATIONAL RULE NEEDS A RELATIONAL GATE. ASSERTING ONE SIDE PINS THE BUG.**
  "An input sits one step lighter than its panel" was implemented twice as an absolute — #205
  set inputs to cream-100, PR A's own findings proposed cream-50 — and **each was correct on
  the surfaces its author was looking at and broken on the others.** The ralph assertion made
  it worse: `E1` checked `bg-cream-100`, so it **passed on the wrong value and would have
  failed the right one.** A gate that encodes one side of a relation preserves whichever
  mistake shipped first.
  **THE FIX IS TO SHIP THE ORDER, NOT THE VALUES** — cream-200 chrome, cream-100 field
  surface, cream-50 well — and to assert both ends plus their distinctness. An order cannot be
  half-applied the way a value can.

- **A GATE'S COVERAGE IS NOT ITS PASS RATE, AND ONLY MUTATION TESTING TELLS THEM APART.**
  `studio-cascade` matched lowercase tag names and passed clean. **Studio contains zero
  literal `<a>` tags** — every anchor is a `<Link>` — so it covered **0% of the anchor
  surface**, which is the entire hazard-22 class it was built to catch. Nothing in the output
  distinguished that from real coverage. It surfaced only when injecting a coloured anchor
  changed no result, because there was nothing to inject into.
  **MUTATE THE THING THE GATE IS SUPPOSED TO CATCH, NOT THE FILE THE GATE READS.**

- **SEPARATE INERT FROM BROKEN, OR THE GATE GETS DELETED.** A utility whose value equals the
  reset's renders correctly and drives nothing. Twelve studio sites are in that state. Failing
  on all twelve makes a gate that is right and unusable. **Report them, pin the count, do not
  fail** — and say plainly that inert is not safe, because editing one silently does nothing.

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
  This is now SIX variants of one failure, and the shape is what matters, not the
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
  - a **COUNT, AGAIN** — "ELEVEN merged branches are still present", which was 13. It was
    accurate when written in #191 and drifted as #192 to #196 merged without deleting.
    **The count variant recurring is the point:** the first one decayed as kinds were
    added, this one as branches were, and neither was ever re-derived.
  - **A COUNT THAT WAS WRONG IN KIND RATHER THAN IN DEGREE.** PR 2's plan said the input
    geometry was "five strings". Five is the number of NAMED CONSTANTS. The number of form
    controls carrying that geometry is **21**, none of which reference an export — so the
    plan counted the wrong noun and the tally was beside the point. **Every earlier count
    variant was off by an amount; this one was off by a CATEGORY**, and the tell was that
    the fix "reached the primitives" and the screen did not change.
    The same shape bit twice more inside one PR: a canvas hairline count of "6" was really
    **4** (the grep swept up a comment in a `.ts` file and a `border-ink-950/80`, a
    different value entirely), and the first version of the gate protecting it asserted
    `> 0`, which a mutation that unified ONE file walked straight through. **Count the
    thing you mean, then make the assertion able to fail for the reason it exists.**
  - **AN INSTRUCTION, TWICE, AND THIS IS A DIFFERENT ORIGIN FROM ALL FIVE ABOVE.** #203's
    brief carried two premises that were not in the record and never had been. One
    **attributed a claim to THIS FILE** — that the case-study OG route enumerates an
    unfiltered slug list — which STATE has never contained and which is also false of the
    route, since it does filter `BESPOKE_SLUGS`. The other **asserted an observation nobody
    made**, that every post shared on social showed no image; production was serving
    complete OG tags and a valid 1200×630 PNG the whole time. **Neither decayed inside the
    file. Both were invented upstream of it.**
    **SO THE RULE IS WIDER THAN ITS OWN HEADING.** "Nothing recorded in this file is
    evidence" reads as a warning about decay, and five of the six instances above are decay.
    **An instruction is not evidence either**, and a premise that arrives inside a task is
    the one least likely to be checked, because it arrives with the authority of the person
    asking.
    **KEEP THE SECOND HALF, BECAUSE IT IS THE USEFUL ONE.** The invented premise still found
    a REAL defect: `/projects/not-a-real-slug/og` returned **200 and a PNG** on production,
    a live fail-open that was fixed in #203's first commit. **The instinct was right and the
    evidence was fabricated**, and those are separable. A hunch that turns out to be correct
    does not retroactively become an observation. **Check a hunch; do not dress it as a
    fact** — the checking is what turned a wrong reason into a real fix, and stating it as a
    fact is what would have skipped the checking.
    **A scope estimate decays exactly like a name, a count, a constant or an inventory, and
    none of them is evidence.** None failed loudly; each was found only by deriving it. Three
    of the six were found in a single two-day stretch, which is a statement about the file's
    reliability, not about that stretch. **The instances keep accumulating, and that is the
    rule's value rather than an embarrassment — a rule with one example is an anecdote.**
- **TAILWIND v4 SCANS COMMENTS, SO PROSE CAN SHIP CSS.** #199's first draft of a comment
  contained the literal token `focus:border` while explaining that the class was NOT used, and
  the build emitted `.focus\:border:focus { border-width: 1px }` — a dead selector added by
  prose. **Name a utility in prose without its class spelling**, or the scanner takes it as a
  use. Found by the union-of-declarations gate; a raw diff would have buried it in the
  minifier's regrouping, which is the SECOND time in three PRs the naive diff would have
  lied. **USE UNION-OF-DECLARATIONS WITH MEDIA CONTEXT AS THE DEFAULT CSS GATE.**
- **A DEFECT CAN LIVE IN THE COMPARISON RATHER THAN IN EITHER STATE.** #198's FAB overlap was
  invisible reading either rendering on its own — reduced motion looked fine, normal motion
  looked fine — and appeared only when both were driven SIDE BY SIDE. #197's fix for one
  motion problem is what created it, one CSS rule away. **When a change is conditional on a
  media query or a mode, drive BOTH branches and compare them to each other, not just each to
  its own expectation.**
- **A HAZARD CAN BE REAL AND STILL BE WRONG ABOUT WHAT IT IS.** Hazard 18 correctly recorded
  that a hook was unused and incorrectly implied unguarded animations; the CSS was complete
  and the gap was three script-driven calls. **Re-derive the CAUSE, not just the symptom, or
  the fix lands in the wrong layer** — here it would have been CSS that needed no change.
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
- ~~**NO LINT GATE EXISTS IN THIS REPO.**~~ **THERE IS ONE SINCE #195.** Run it with
  `npm run lint` (`eslint . --max-warnings 0`), and CI runs the same command with no
  `continue-on-error`. **`next lint` IS NOT THE COMMAND** — Next 15.5's own CLI calls it
  deprecated with removal in Next 16, and it never linted here anyway. The repo sits at ZERO
  problems, so any new violation fails the build. A lint pass is now a real claim to make.
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
- **PROGRAMMATIC `.focus()` DOES NOT TRIGGER `:focus-visible`** — the **third** documented way
  this environment lies, and the most dangerous direction so far. PR B's focus-versus-selection
  check reported `outlineStyle: none` and `boxShadow: none` on a focused control, which reads as
  **the focus ring is gone**. It was not: `:focus-visible` is a heuristic that wants a real
  keyboard interaction, and pressing an actual **Tab** produced `focusVisible: true` with a
  rendered outline immediately.
  **A FALSE NEGATIVE INVITES A FIX FOR A BUG THAT IS NOT THERE**, which is worse than a false
  positive — the false positive merely wastes a check, this one would have added a
  `:focus` fallback nobody needed and quietly degraded the mouse experience the ring exists to
  stay out of. **Drive keyboard-only properties with real keys.**
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
- **A MEASUREMENT HARNESS NEEDS A SANITY PAIR, ASSERTED BEFORE THE REAL MEASUREMENT.** PR 1's
  first contrast harness read `getComputedStyle(el).color`, which returns
  **`oklch(0.14 0.018 60)` UNCONVERTED**, and the regex took `0.14, 0.018, 60` as RGB channels.
  Every colour resolved to near-black, so **every ratio came back ≈1.0 — including cream-50 on
  ink-950, which is really 19.04:1.** The output was internally consistent, plausible, and
  entirely false.
  **THE VALUE WAS NOT WRONG, IT WAS IN A DIFFERENT COLOUR SPACE**, which is why nothing looked
  broken. This is a sharper form of "driving the UI can lie too": the tool answered correctly
  and the question was wrong.
  **THE FIX IS TWO ASSERTIONS THAT CANNOT BE ARGUED WITH — white/black = 21 and red/white = 4 —
  RUN INSIDE THE GATE BEFORE ANY REAL PAIR.** Contrast is measured by rasterizing through
  canvas + `getImageData`, never by parsing a computed colour string. The same harness needed a
  second correction later, for compositing: a semi-transparent wash painted on a cleared canvas
  reads as its own colour rather than as itself over the ground, which reported the 10% active
  wash at 19.96:1 instead of 1.24:1. **Both bugs produced confident numbers.**
- **A FIX'S PRECONDITION TRAVELS WITH IT.** #190's revoke-on-supersede was correct **because
  the hero's key is FIXED** — one slot, one holder. #202 was briefed to carry that rule to
  block images, whose paths are CONTENT-ADDRESSED, where a new upload creates a NEW key and
  orphans the old one that another block may still be showing. Following the rule would have
  **rebuilt #193's shared revocable resource inside the cleanup meant to prevent a leak.**
  When reusing a fix, name the property that made it correct and check that property still
  holds. **A rule reused past its precondition is worse than no rule**, because it arrives
  carrying a successful precedent and reads as settled.

---

## HAZARDS AND KNOWN DUPLICATIONS

1. ~~**The 236px coupling**~~ (#165) — **CLOSED, BOTH HALVES (#237).** It survived from #165 to
   #237 as comment-enforced coupling, was re-derived to SEVEN sites in #236 (three display, four
   behavioural — the recorded text had said two, and `studio-ink` D had said five while pinning
   four), and is now gone rather than guarded:
   - **THE ARITHMETIC HALF** — the three composite thresholds that summed 236 were DELETED. A
     constant true only at a 236px sidebar is worse than no constant once the studio ships a
     control whose purpose is to move off 236. What replaced them is the part that was always
     constant: `PANES_SUM`, `CS_PANES_SUM`, `CS_COLLAPSED_PANES_SUM`, with the caller adding the
     live width. **Third deletion of this shape**, after `FIT_THRESHOLD_PX` shipping with zero
     consumers and `--radius-2xl` sitting below `--radius-xl`.
   - **THE DISPLAY HALF** — `StudioSidebar`'s width and `PublishBar`'s offset are now the SAME
     custom property. #236 had to assert the two literals were equal; there is nothing left to
     keep in step, so the assertion became an identity. **This half was not expected to close in
     this PR**, and it is the strongest argument for the custom property over an inline style.
   The width now lives in `lib/studio/sidebar-width.ts` and travels as `--studio-sidebar-w`.

2. **`inputCls` AND `inputClsMd` ARE BYTE-IDENTICAL, AND THE HEADER STILL ARGUES THEY MUST NOT
   BE MERGED.** Found while applying the field measure (#239); deliberately not fixed there.
   The comment says at length that the two "differ by exactly ONE token, `text-[13px]` against
   `text-[14px]`", that unifying them "CHANGES RENDERED FONT SIZE on real surfaces — four of them
   one way, two the other", and that #199 "deliberately left this split standing rather than
   silently picking a winner". **Verified programmatically: the two strings are equal.** The
   sentence that states the difference already reads `text-[14px]` on BOTH sides of itself.
   **#218's +1px bump resolved the split to 14 and the reasoning never followed.** So the file
   whose entire job is to be the single definition carries a paragraph describing code that does
   not exist — and a reader deciding whether to merge them is warned off for a reason that has
   already come true.
   **THE MERGE IS STILL #199's OPEN DECISION AND STAYS THE OWNER'S**: two exports with one value
   is a real duplication, but deleting one is an API change across seven files and which name
   survives is a naming call, not a cleanup. What is NOT open is the comment, which is false.

3. **`StudioModal`'s no-portal dependency** (#168).
4. **`keystatic.config.ts`'s mirror of the image bases** (#172) — test-enforced. **OPEN:
   does the cross-check compare the full key set in both directions?**
5. **Blog's duplicated splice** (#173) — deliberate, eight lines.
6. **Sweep gaps #2–#4** (#174) — the projects form tables still lack `heading`.
7. **`login-throttle` is unreachable by ralph** (#175) — a deliberate trade.
8. **Two `useDraftForm` instances in the blog editor** — easy to assume one form now that
   their fields DO share a 244px pane. #174's defect class. Mitigated by the two labelled
   `SaveIndicator`s and proven separate by G4, not eliminated.
9. **`lib/site.ts` imports `node:fs` at module scope and has no server-only marker** (#178).
   Any client component importing from it fails the build APP-WIDE. A `server-only` import
   there would turn a confusing webpack error into a clear one. **Not done.**
10. **`data-studio-fullheight` couples `ThreePaneShell` to the dashboard layout's `:has()`
   rule** (#178) — two files, nothing in the type system connecting them. Ralph-enforced.
11. **`boat-crest` produces ZERO parity pairs** — the gate has been blind to the hero case
    study for an unknown number of PRs. Cause not investigated. **The other three render 15,
    14 and 15.**
12. **The unlayered `img, video { height: auto }` at `app/globals.css:271`** (#180) — it
    silently beats every `h-*` utility on an `<img>`. Not removed, because the inline figure
    and other images legitimately want it; the cost is that image sizing must be authored.
    **FIRED A THIRD TIME IN #190**, and that firing is the instructive one: inside an
    `aspect-[16/9]` frame the WRONG sizing leaves every outer box correct, so A1, G2 and the
    parity walk all pass while the image crops wrong. The guard there is a string assertion
    against next/image's emitted style (`HERO_FILL_STYLE_CSS`), not a measurement. **Whenever
    this rule is in play, ask what the box gates CANNOT see.**
13. ~~**BLOG HAS NO PARITY HARNESS**~~ — **BUILT IN #187**, at `/dev/blog-parity/<slug>`.
    It cost three hand-catches first: the 48px fidelity gap (#178), the `vw` bleed bug
    (#180), and this arc's own premise. It reuses `parity.mjs`'s walker UNCHANGED and
    asserts a NON-ZERO pair count. **Still browser-driven and dev-only**, so it is a gate
    someone must run, not one CI enforces.
14. **WHOLE-BRANCH PUBLISH CAN SHIP A HALF-FINISHED EDIT** — observed, not theoretical. A
    publish carried a mid-sentence truncation into a live post (see CURRENT CONTENT STATE).
    Save-on-blur persists whatever is in the field, publish merges the whole draft branch,
    and **no gate can distinguish an in-progress edit from an intended one**: the file stays
    structurally valid and `validateBlogPost` returns ok. The mitigation today is reading the
    content diff before publishing. A per-entry publish, or a diff preview in the PublishBar,
    would be the real fix and neither is scoped.
15. ~~**`readingTimeMinutes` HAS NO `imageBlock` CASE**~~ — **FIXED in #192.** The `switch`
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
16. ~~**THE HERO OBJECT URL IS NEVER REVOKED**~~ — **FIXED in #193, by DELETING THE SHARED
    LIFETIME rather than scheduling a revoke.** `onChanged` used to hand the url up, so two
    components displayed ONE revocable resource and neither could free it. It now hands up the
    **`File`**, and each side calls `createObjectURL` on the same Blob — a distinct url, no
    copy of the bytes — so each revokes only what it created, on replace and on unmount.
    **THE OBVIOUS FIX WAS WRONG, AND THE BROWSER PROVED IT.** Revoking in `HeroImageField`'s
    unmount looks safe until you notice `BlogBlocksEditPanel` renders the inspector INSTEAD of
    the canvas below the fold (`canvas={!inspectorFits && view === "inspector" ? inspector :
canvasColumn}`), so the two holders unmount independently. Measured at 900px: the field
    and the canvas hero are **mutually exclusive in all three view states**, so an
    unmount-revoke would blank the hero on exactly the "upload it, then go look at it" flow.
    **A lifetime you cannot reason about locally is a lifetime to remove, not to manage.**
17. **THE NEXT DEV CACHE REPLAYS BUILD ERRORS FOR AN IMPORT GRAPH THAT NO LONGER EXISTS**
    (diagnosed properly in #193 after being hand-waved twice in #190). `.next` survives a dev
    SERVER restart, so a `node:fs`-in-the-client trace naming
    `lib/site.ts <- BlogBlocksEditPanel <- BlogEditPanel` kept reappearing — an edge that
    exists nowhere in the source and last existed during #178's development, which is exactly
    where `livePath` came from. An `inert` empty-string warning replayed alongside it though
    both `inert` usages are proper booleans. **`rm -rf .next` (with the dev server STOPPED)
    clears both; a fresh tab alone does not, and neither does restarting the server.** Before
    reporting a console error, check it against the source graph and a cold cache — and note
    that a production `npm run build` succeeding is itself strong evidence a client-side
    `node:fs` import is not real, since it would fail the build app-wide.
18. ~~**A LATENT `rules-of-hooks` VIOLATION IS DISABLED, NOT FIXED** (`ProjectsEditPanel:125`,
    found by #195).~~ **CLOSED — the disable is deleted and the early return moved below the
    hooks.** `if (!isSelected) return null` sat above a `useEffect`. **Latent, not active:** the
    panel mounts only outside a `ListDetailLayout`, so `isSelected` is always true and the early
    return never ran. It becomes a crash the moment the panel is placed in the shell its own
    comment says it is built for — **which is exactly what the three-pane case-study editor
    does**, so this closed FIRST, as that arc's blocker, rather than alongside it.
    **THE FIX IS TWO CHANGES, NOT ONE, AND THE SECOND IS THE POINT.** Moving the return below the
    hooks is what the hazard named. But with the return below, an UNSELECTED panel would reach
    the effect and fetch — and sections are deliberately NOT in the list payload because they are
    ~15KB per study and the index shows four, so mounting four panels in a shell would turn one
    fetch into four. So the effect BODY is gated on `isSelected` too: today it is always true and
    this fires on mount exactly as before, and in a shell it fires on first selection, with
    `sectionsStatus === "idle"` keeping it once-only. **Moving the return alone would have fixed
    the lint error and quietly created a fetch regression that only appears in the shell** — the
    same shape as the hazard itself, one step later.
    **PROVEN BY MUTATION, not by the absence of a warning:** putting the return back above the
    hooks makes `eslint` fail with `react-hooks/rules-of-hooks` on the `useEffect`, so CI
    enforces the fix rather than merely permitting it.
19. ~~**`SiteHeader` ASKS FOR REDUCED MOTION AND IGNORES THE ANSWER**~~ — **CLOSED by #197
    (`258ee1a`) and #198 (`fa08200`).** The hazard was REAL AND WRONG ABOUT WHAT IT WAS, which
    is the part worth keeping. It described unguarded animations; every CSS animation in the
    file was already handled, including the nav row deliberately KEEPING its hide behaviour
    and only losing the translate. The actual gap was three script-driven scroll calls the
    reset cannot reach, because an explicit `behavior: "smooth"` OVERRIDES
    `scroll-behavior: auto !important` — #171's R2 one layer up. **NO CSS CHANGED in #197.**
    **THE IRONY IS THE FINDING.** The reduced-motion path was the ONLY path that reached the
    bug: `SmoothScrollProvider` renders no provider under reduce, so `smoothScroll` and
    `lenis` are both null and both branches fall through to the native `else`. A
    reduced-motion reader clicking a nav link got an animated smooth scroll nobody else got.
    **THREE CALLS, NOT THE TWO THE INVESTIGATION FOUND.** The third is the logo's
    `window.scrollTo`, which a grep for `scrollIntoView` walks past. The ralph suite caught it
    before it shipped, and its count now spans the union of native scroll APIs.
    **#198 THEN CLOSED A PROBLEM THE FIRST FIX'S NEIGHBOUR HAD CREATED.** Keeping the row on
    screen under reduce is right, but `navHidden` still flips, so the FAB — whose only job is
    bringing back a nav that hid itself — appeared beside the row it replaces. Two controls
    for one nav. **A CSS FIX FOR ONE MOTION PROBLEM HAD CREATED A SECOND, UNRELATED
    AFFORDANCE PROBLEM, AND ONLY DRIVING BOTH SETTINGS SIDE BY SIDE SURFACED IT** — neither
    state is wrong on its own, and the defect is visible only in the comparison.
    **`useReducedMotion` DOES NOT LIVE-UPDATE**, whatever its docstring claims: it snapshots
    into `useState` at mount and never re-reads (the library's own TODO admits it), and
    returns `null` server-side. Emulation must be set BEFORE load; a probe that toggles it
    live reports a false pass. Playwright is the tool — it is already a devDependency and the
    in-app browser cannot emulate this.
20. ~~**`StudioSidebar`'s `pinned` IS PASSED AND IGNORED**~~ — **CLOSED by #199, AND THIS
    HAZARD'S OWN TEXT WAS WRONG.** It said Site settings "renders like every other link". IT
    DOES NOT. The pinning IS implemented, by the wrapper's
    `lg:mt-auto lg:border-t lg:border-ink-950/8 lg:pt-2.5`, which pushes it to the bottom of
    the flex column and draws its separator. `git log -S` puts the parameter in `ca6ab8b`,
    the original dashboard, **ALREADY UNUSED** — vestigial from the first commit rather than
    aspirational. So #199 removed it instead of recording it.
    **CORRECTED RATHER THAN STRUCK, deliberately.** A struck hazard that was wrong about its
    own cause teaches the wrong lesson to whoever reads the history — here it would teach
    that an unread parameter means an unbuilt feature, when the feature was built one line
    away. **THIS WAS NOT THE `FIT_THRESHOLD_PX` SHAPE** and treating it as one would have
    preserved a parameter that never carried the intent it named.
21. ~~**AN `imageBlock`'s IMAGE DOES NOT APPEAR ON THE CANVAS UNTIL A REFRESH**~~ — **CLOSED by
    #202.** Kept in full because the last two lines of it were a trap, and the correction is
    the durable part. Originally recorded as: OWNER-OBSERVED
    while writing the third post, **UNDER INVESTIGATION, NOT YET FIXED.**
    **THE SAME `draftImages` SNAPSHOT GAP #190 CLOSED FOR THE HERO, ONE CONSUMER OVER.**
    `draftImages` is read server-side at page load, so an image uploaded DURING the session is
    on the draft branch but not in that array; the rewriter leaves the committed path alone
    and it 404s against main until publish.
    #190 fixed the hero by widening `HeroImageField`'s `onChanged` to hand up the `File`, so
    each holder makes its own object URL. **`BlockImageField` was never widened** — its
    callback is `onChange: (src: string | null) => void`, a PATH only, with no `File` and no
    object URL, so the canvas has nothing fresher than the path to draw.
    That is a derivation from source, not a diagnosis of the observed symptom, and the two
    should be confirmed to match before anything is built. **The fix shape is #190's, applied
    to the block-image path.** Note the hero's own fix is verified by real use — see
    owner-backlog item 10 — so the mechanism is known to work.

    **THE MECHANISM WAS RIGHT AND THE LAST SENTENCE WAS THE TRAP.** "The fix shape is #190's"
    is what a reader would act on, and acting on it would have **rebuilt #193's shared
    revocable resource.** #190 revokes the superseded url because the hero's key is FIXED. Block
    image paths are CONTENT-ADDRESSED — the same bytes always yield the same path — so a new
    upload creates a NEW key and orphans the old one, **which another block may still be
    showing**, and revoking it blanks that block. Under content addressing a supersede does not
    happen at all. #202's map is APPEND-ONLY with `releaseAll` at unmount as the only revoke,
    and it exposes **no per-path release**, enforced by ralph rather than by comment.
    **A HAZARD CAN BE CORRECT ABOUT A CAUSE AND WRONG ABOUT THE CURE** — this is the third
    hazard in this file to be right and misleading at once (see 18 and 19), and the pattern is
    now a working rule: a fix's precondition travels with it.

22. **`HERO_IMAGE_UNSUITABLE` STILL LISTS `elevate-one-view`, AND ITS REASON NO LONGER EXISTS.**
    `components/sections/ProjectCard.tsx` carries
    `const HERO_IMAGE_UNSUITABLE = new Set<string>(["elevate-one-view"])`, so that card renders
    the hand-built mock and its uploaded hero is never drawn. The comment above it says the
    asset **"is a 390x988 PORTRAIT phone shot"** and ends **"remove the slug when the asset is
    replaced."**
    **THE ASSET WAS REPLACED IN `6ebd513` AND THE SLUG WAS NOT REMOVED.** It is now a 320×200
    landscape webp. So the stopgap works exactly as designed, states a fact that is false, and
    suppresses a real hero that would render correctly in the 16:10 frame.
    **THIS IS THE SHAPE HAZARD 19 HAD** — a component that describes content it no longer
    matches — but with the failure pointing the other way. #199's was a parameter that read as
    unbuilt while the feature existed one line away; this is a workaround that reads as
    necessary while its cause is gone. **A CONTENT STOPGAP KEYED BY SLUG OUTLIVES THE CONTENT
    IT WAS KEYED TO, silently, because nothing fails when the content changes.** The comment
    even names its own removal condition, which is the best a stopgap can do and was still not
    enough. Whoever removes the slug should check the render first — the asset is 320×200 into
    a 500px slot, so the mock may genuinely still look better, and that is a judgement rather
    than a lookup.
23. **A `text-*` COLOUR UTILITY ON AN `<a>` DOES NOTHING IN THIS PROJECT, AND TEN ANCHORS
    CARRY ONE.** `app/globals.css:278` has an **unlayered** `a { color: inherit; … }`, and an
    unlayered rule outranks `@layer utilities` **regardless of specificity**, so `.text-ink-600`
    on an anchor silently loses. Measured both ways: the same class computes **ink-600 on a
    `<span>` and ink-950 on an `<a>`**. Confirmed in the built bundle — the rule sits at a
    position where the net brace depth since `@layer utilities{` opened is **0**, i.e. after
    that layer closed.
    **IT DEFEATS ONLY `color`.** `hover:border-accent-500` on the same anchor works, because
    there is no unlayered `a { border-color }`. **`hover:text-*` is ALSO dead** — driven while
    genuinely hovered, the border went accent-500 and the colour did not move. Raising
    specificity cannot help when the loss is by layer, which is the part that reads wrong.
    **THIS IS HAZARD 11'S MECHANISM ON A THIRD ELEMENT** (after `img,video{height:auto}` beating
    `h-*`). It is invisible because it looks fine: the anchor inherits ink-950 from body, which
    is 18.13:1 on cream. It only bites when the background moves — on the ink sidebar it is
    **1.00:1**.
    **PR 1 fixed the two in the shell** — the sidebar label moved to its `<span>` with
    `group-hover`, and the topbar set the colour on the CONTAINER so the anchor inherits it,
    which needs no extra element the attribute-invariant gate would reject.
    **EIGHT REMAIN**, all on cream so all currently invisible, including a PUBLIC one: the
    `← Blog` back link in `app/(portfolio)/blog/[slug]/page.tsx` renders ink-950 where its
    `text-ink-600` intends otherwise. Others sit in `ProjectsEditPanel`, `BlogPostList`,
    `BlogBlocksEditPanel`, `not-found.tsx`, `error.tsx` and two studio project pages.
    **Do not "fix" them blind** — each renders ink-950 today and several may look better that
    way; the defect is that the code says one thing and the screen does another.

24. **TWO PHANTOM COLOUR UTILITIES: `text-ink-500` (40 uses) AND `text-ink-700` (11 uses)
    GENERATED NOTHING. NOW CLOSED — `ink-700` deleted in #210, `ink-500` re-pointed (see the
    CLOSED note below).** The `@theme` ink scale is 950/800/600/400/200 — there is no
    `--color-ink-500` and no `--color-ink-700`, and Tailwind v4 only generates utilities from
    tokens that exist. Every site carrying them renders INHERITED colour, usually ink-950 from
    body. Found by PR 2b's measurement gate: a readonly field whose class said ink-500
    measured ink-950 on screen.
    **THIS FALSIFIED A RATIONALE ONE HOUR AFTER IT WAS WRITTEN.** PR 2b's readonly-display
    family was justified partly as "consuming the export would swap ink-500 for ink-950,
    making a non-editable field look editable" — but the field has ALWAYS rendered ink-950,
    because the muting never existed. The comments and the suite were corrected in the same
    PR; the focus-ring half of the rationale stands on its own.
    **THE CLASSES ARE KEPT, DELIBERATELY.** 52 sites carry the intent, the pixels have been
    stable since each was written, and the fix is ONE decision — add the tokens, or re-point
    every site to a real value — not 52 local edits. The bracket-bare rule's cousin: a bare
    theme utility whose token does not exist fails exactly as silently.

    **RESOLVED IN #210 — THE DECISION WAS DELETE, NOT DECLARE.** Adding the tokens would widen
    a considered scale to accommodate what is almost certainly Tailwind-default muscle memory
    (every other project has a 500, so someone typed one), and would move **51 places on screen
    at once**, none of which anyone has seen render as intended. Deleting is zero visual change
    and makes the code honest.
    **THE COUNT WAS 51, NOT 52** — re-derived, and two of the 53 grep hits were comments
    describing the phantom rather than uses. 40 × `ink-500` + 11 × `ink-700`.
    **THE SPLIT FELL EXACTLY ON THE TOKEN BOUNDARY, which was not planned.** All 11 `ink-700`
    sites read correctly at full ink and were **deleted**; all 40 `ink-500` sites are **real
    defects, named and not fixed**. Not a coincidence: `ink-700` was reached for as
    "slightly muted body", where full ink is fine, and `ink-500` as "clearly muted chrome",
    where it is not.
    **MEASURED: every one of the 51 rendered ink-950**, uniformly, because nothing in the
    studio sets an intermediate colour on any of their containers.
    **THE BUNDLE IS THE PROOF THAT COVERS THE SITES BROWSING CANNOT REACH.** In the production
    CSS, `ink-600` appears 11 times and **`ink-500` and `ink-700` appear ZERO times** — no
    custom property, no rule. A class with no CSS cannot move a pixel when deleted, which
    settles the conditional sites (confirm prompts, "Saving draft…", empty states) that only
    render in transient states.

    **CLOSED — THE 40 `ink-500` SITES WERE RE-POINTED, NOT DELETED, REALISING THE INTENT.**
    The other half is now done, and done the opposite way to the `ink-700` half: those 11 read
    correctly at full ink so deleting was honest; these 40 always MEANT muted and never were, so
    deleting would have left every one looking exactly as wrong. Each was re-pointed to the muted
    token its own working, untouched neighbour already used — **13 icon buttons → `text-ink-400`**
    (the `ListDetailLayout` idiom, `place-items-center … hover:text-ink-950`), **3 inactive tabs
    and secondary controls → `text-ink-600`** (`SegmentedToggle`, `StudioSidebar`), **24 badges,
    status hints and readonly fields → `text-text-subtle`** (`SkillsEditor`'s Unsaved pill and 92
    other live uses). No value was invented; every target matches a sibling already shipping it,
    which is the same discipline as the three scales. **The neighbour proof ran per family with
    zero mismatches**, and **each target was checked on its ACTUAL ground** — `text-text-subtle`
    clears AA text (4.5) on all three cream steps down to **4.78 on cream-200**, the worst case
    (the readonly Company field's ground); `text-ink-600` clears at **6.42**; `text-ink-400` is an
    icon rest colour, a graphical UI element, and clears the **3.0** non-text floor at **3.02 on
    cream-200**, matching the working icon buttons exactly so it introduces no risk the studio was
    not already carrying. Rendered proof: `text-text-subtle` now paints **109,100,93**, not the
    inherited ink-950 (**21,17,13**) it painted for its whole life. **`studio-tokens` B2 flipped
    from pinning the count at 40 to asserting ZERO**, and it fails the day any `text-ink-500`
    returns — mutation-tested. Ralph holds at **1410** (B2 is a revalue, not a net-new assertion).

    **THE THREE MECHANISMS, AS A SET — SAME SYMPTOM, THREE DISTINCT CAUSES.** Nothing recorded
    them together, so each was re-derived from scratch when it appeared. The symptom is always
    _the code says one thing and the screen does another_:

    | #      | cause                                              | gated by                    |
    | ------ | -------------------------------------------------- | --------------------------- |
    | **11** | an unlayered element rule beats a layered utility  | `studio-cascade`            |
    | **26** | utility versus utility, decided by **sheet order** | `studio-border-race` (#219) |
    | **23** | the token does not exist, so no CSS is generated   | `studio-tokens` (#210, closed here) |

    **ALL THREE ARE NOW GATED, AND `studio-cascade` STILL CANNOT SEE 26** — that suite compares a
    utility against an _unlayered element rule_, which presumes the utility generates CSS and
    asks whether something outranks it. Utility-versus-utility has no element rule involved and
    two live declarations, so there was nothing for it to match on. #219 built the different check
    26 needed (a border-colour shorthand and a per-side longhand writing the same edge on one
    element), `studio-border-race`, which found two live races in the blog rows on its first run.

25. **`--radius-2xl` WAS SMALLER THAN `--radius-xl` — a scale inversion nobody introduced. NOW
    CLOSED, byte-identically, and gated by `radius-scale`.**
    Emitted values were `sm .25rem · md .5rem · lg 1rem · xl 1.5rem · **2xl 1rem** · full 9999px`.
    `--radius-2xl` is **not declared in globals.css**: the project overrode `sm`–`xl` in
    `@theme` and left Tailwind v4's default `2xl` (1rem) behind, so it sat **below `xl` and equal
    to `lg`**. The name said "bigger than xl"; the screen showed "equal to lg."
    **THE TWO CONSUMERS WERE PUBLIC, SO CHANGING THE TOKEN WOULD HAVE MOVED THE SITE — and the
    fix did not.** Measured, the two `rounded-2xl` sites split: `SiteFooter`'s panel rendered a
    REAL 16px corner (`overflow-hidden`, cream-50), while the blog `FeaturedCard`'s was VISUALLY
    INERT — 16px on a transparent, non-clipping grid `<Link>` that rounds an invisible box. So the
    footer was repointed to `rounded-lg` (1rem, the token it already rendered — verified 16px
    before and after) and the blog card's `rounded-2xl` was DELETED rather than repointed, the
    same zero pixels and the honest form, matching the 11 `text-ink-700` deletions and
    `.blog-editable.is-selected`. **This was hazard 23's first half in another property**: a
    Tailwind default typed from muscle memory into a project whose scale considered that step and
    declined it. "The author reached for the biggest name" was rejected as evidence of intent —
    it is an inference from a class name, and whether the footer should be ROUNDER is a design
    decision made by looking at it, kept as a separate question rather than smuggled in here.
    **`radius-scale` (net-new, whole-repo) is the durable output** STATE asked for before "a
    future PR redefines the scale and inherits the inversion silently." Two assertions: the
    declared ramp is strictly increasing (A1 — a redeclared `--radius-2xl: 1rem` fails because
    1rem is not above xl's 1.5rem, which B1 alone would miss), and no consumer uses a radius step
    `@theme` does not declare (B1 — the `studio-tokens` shape generalised from colour to radius,
    naming the token and the site, never a count; it catches the next `rounded-3xl` on arrival).
    Related and worth knowing together: **`.rounded` (bare) is a hardcoded `0.25rem` and
    dereferences no token at all** — every other radius utility resolves `var(--radius-*)`. No
    `@theme` edit and no scoped property can reach it, which is why PR 3 rewrote its 14 studio
    sites by hand. The survey for this fix confirmed **no bare `rounded` remains in use**, so the
    gate scans named steps and leaves that CSS-default case alone.

26. **HAZARD 11 IS NOW GATED, AND THE GATE FOUND FIVE MORE INSTANCES ON ITS FIRST RUN.**
    `ralph/tests/studio-cascade.mjs` parses the unlayered element rules out of `globals.css`
    and reports every studio element carrying a utility that rule overrides. It replaces the
    per-instance assertions that had accumulated for the four known cases.
    **The four known instances were each found by someone measuring what they already
    suspected**, never by review — and #205's own gate asserted the ink band `<header>`'s class
    string while the `<h2>` inside it drew Fraunces 400. A gate that reads a class cannot see a
    class that does nothing.
    **What the gate found immediately**: `<p max-w-[46ch]>` rendering 68ch, `<img h-full>`
    rendering `auto`, and **three dead-anchor sites** (six utilities) that hazard 22 had never
    caught. All fixed in PR A.
    **THE BLIND SPOT THAT NEARLY SHIPPED WITH IT.** The first version matched lowercase tag
    names only — and **studio contains zero literal `<a>` tags**, every anchor being a
    next/link `<Link>`. So it covered 0% of the anchor surface, which is hazard 22's entire
    class, while reporting a clean run. Caught by mutation-testing (injecting a coloured anchor
    changed nothing, because there was none to inject into), and fixed with a component→tag
    map. **A gate's coverage is not its pass rate.**
    **AGREEMENT IS SEPARATED FROM COLLISION.** A utility whose value equals the reset's is
    INERT — it renders correctly and drives nothing. Twelve studio sites are in that state.
    They are reported and count-pinned but do not fail, because a gate that fails on twelve
    harmless sites is a gate someone deletes. Inert is not safe, though: edit one and it will
    silently not apply.

27. **THE BORDER SHORTHAND RACES ITS OWN LONGHAND, AND NO CLASS-STRING CHECK CAN SEE IT.**
    `border-transparent` writes `border-color`; `border-l-accent-500` writes
    `border-left-color`. **Both are utilities at equal specificity**, so which one owns the left
    edge is decided by **their order in the generated sheet** — not by anything in the source.
    PR B's selection bar would have been a coin-flip dressed as a class name.
    **INVISIBLE IN REVIEW AND IN EVERY ASSERTION THIS REPO WRITES**: the markup reads correctly,
    both classes exist, both generate CSS, and `studio-cascade` does not fire because no
    _unlayered_ rule is involved — this is utility-versus-utility, a different mechanism with
    the same symptom. It happened to render correctly when measured, which is the worst
    outcome, because nothing would have flagged it before a Tailwind upgrade reordered the
    sheet.
    **THE RULE: never combine a border-colour SHORTHAND with a per-side longhand on the same
    element.** `ListDetailLayout` sets `border-y-transparent border-r-transparent` explicitly
    and leaves the left edge to the bar alone, so nothing competes. `studio-ink` G3 pins it.

    **NOW GATED — `studio-border-race`, and it found two LIVE instances PR B had missed.** The
    gate classifies every border-colour utility on an element into the edges it writes
    (`border-<c>`→all four, `border-x`→l+r, `border-l`→l …) and flags any two that overlap
    within one variant scope; the disjoint idiom passes, a shorthand-plus-longhand fails. On its
    first run it caught **`BlogBlocksEditPanel`'s block strip and `BlogPostList`'s rail** — both
    still carried `border-b border-ink-950/12 border-l-[3px]`, where the `border-ink-950/12`
    shorthand coloured the left edge and raced the accent bar. PR B fixed the ListDetailLayout
    row and left these two behind. Both changed to `border-b-ink-950/12` (colour the bottom only);
    render verified identical (accent bar left, ink hairline bottom) but now deterministic.
    **Two ways the gate almost lied, both fixed before trusting it:** its colour classifier
    missed base colours with opacity (`white/24`), so it was blind to every `border-white/24` on
    the ink chrome until fixed; and its tokeniser pooled array-style `? "a" : "b"` ternary
    branches (mutually-exclusive alternatives), a false positive on `OverviewRow`'s pill. Both
    mutation-tested after the fix.
    **ONE PUBLIC INSTANCE, REPORTED NOT SWEPT (like experience/projects):** `ContactSection`'s
    spinner is `border-2 border-white/40 border-t-white animate-spin` — the universal Tailwind
    loading-arc idiom, the same mechanism relied on deliberately. The gate is studio-scoped, so
    it does not touch it; hardening the spinner to the disjoint form is an owner call.

28. **`studio-type`'s C-9 EXCLUSION HAS TURNED INTO A GAP, AND THE MECHANISM GENERALISES. NOW
    FULLY CLOSED — the on-ink contrasts run in CI via `studio-ink-contrast`; see the closure note.**
    The suite skips the topbar search **by name**, because it is an ink surface and not part of
    the cream ladder the suite checks. **That was correct when written and is still true.**
    But #211 gave that search **four derived on-ink foregrounds** — well ground, border,
    placeholder/magnifier/kbd — each with a measured ratio, and **nothing in CI checks any of
    them.** The contrast assertions that justified the change live in a commit message and a
    source comment, which no gate reads.
    **AN EXCLUSION THAT WAS CORRECT WHEN WRITTEN CAN BECOME A HOLE WHEN THE EXCLUDED THING
    GAINS REQUIREMENTS.** The exclusion did not rot; the element grew into it. That is a
    different failure from a stale assertion and it is invisible the same way — the suite stays
    green and its denominator quietly shrinks.
    **CLOSE IT BEFORE THE NEXT ON-INK WORK, NOT AFTER.** The fix is not to delete the exclusion
    (the cream-ladder check genuinely does not apply) but to give the search its own on-ink
    contrast assertions. **Re-read every by-name exclusion when the excluded thing changes** —
    this is the third "check the denominator" instance, after the `<Link>` blind spot and the
    class-string assertions.

    **CLOSED IN #212, AND THE AUDIT CORRECTED THIS ENTRY'S OWN FRAMING.** "The suite stays green
    while its denominator shrinks" was too kind: **`studio-type` had no green.** It carried zero
    assertions, no pass/fail harness and no exit code — it returned a JSON blob for a human to
    read. So the exclusion removed one element from a _report_, not from a passing check, and
    **no contrast was asserted anywhere in the suite** — not the search, not the sidebar's
    on-ink set, not the band status. Every ratio this arc produced lived in commit messages and
    source comments, which no gate reads. **The search was simply the first surface whose
    requirements made that visible.**
    #212 gives the suite an `ON_INK` table of seven roles with the ratios #211 measured, a
    `VERDICT`, and failures that name the role and the surface. **The exclusion was NARROWED,
    not deleted** — the search is still out of the cream-ladder walk, because that reason still
    holds and always will.

    **NOW FULLY CLOSED — THE CONTRASTS RUN IN CI, NOT ONLY BY HAND.** #212 gave `studio-type` an
    `ON_INK` table with a pass/fail harness, but `studio-type` is a browser-console script and is
    STILL not CI-runnable (the runner skips it beside `parity`). So the assertions existed and CI
    ran none of them — the hole was narrowed to "checked only when a human remembers to run it,"
    which for gate-debt is not closed. **`studio-ink-contrast` (net-new, CI-runnable) removes the
    dependency** the way CLAUDE.md's proof rule prefers: it reproduces the browser's colour math in
    node — oklch to sRGB, sRGB alpha-over, WCAG contrast — computes every non-pointer `ON_INK`
    ratio from the SAME source the screen renders from (the `@theme` tokens in globals.css and the
    `lg:` utilities in the four chrome components), and asserts each against this table's floors.
    It imports `ON_INK` so there is ONE table. It earns trust the same two ways `studio-type` does
    — a sanity pair first (white on black is 21, the converter lands ink-950 and cream-50 on their
    known bytes) and a cross-check that every computed ratio is within 0.4 of the browser-measured
    oracle (they reproduce to within 0.12). **Ten of the twelve rows are computed; the two
    `topbar View site (HOVER)` rows need a real pointer node cannot supply, so they stay by-hand
    and the gate asserts the exclusion is EXACTLY those two — it cannot grow the way C-9 did.**
    Six mutations confirm it bites: a well-alpha drift, a foreground-token swap, a token retune,
    and a broken L each fail a floor or an identity, and a renamed class throws rather than passing.
    **This is the third gate this arc built by deriving from source rather than pinning an
    instance** (`studio-cascade`, `studio-tokens`, now this), and the durable lesson is the entry's
    own: an exclusion that was correct when written must be re-read when the excluded thing gains
    requirements — and a by-hand assertion is not a closed gate until CI runs it.

    **THE FULL EXCLUSION AUDIT, since this hazard implied one without stating it:**
    - `studio-type` — `type=file` (hidden, browser-painted), `checkbox`/`radio` (browser-painted,
      caught two false positives in #211), and the search. **All three reasons still hold**; only
      the search needed narrowing.
    - `studio-cascade` — capitalised components not in `COMPONENT_TAG`, skipped because their
      root element is unknowable from source. **Measured: 11 such sites, and it hides nothing.**
      One is `Link` (already mapped); the other ten render `<svg>`, `<span>` or `<div>`, and the
      guarded set is `a, body, h1–h6, img, p, video`. **An exclusion that looks alarming and
      excludes nothing is worth measuring rather than assuming** — the inverse of this hazard.
    - `studio-tokens` — `ink-500`, by TOKEN not by site. B2 now asserts the family is **ZERO**,
      not 40 — the sites were re-pointed, and the guard fails if any `text-ink-500` returns.

29. **`boat-crest` IS HAND-BUILT AND HAS NO SECTIONS BOARD, SO IT IS THE WRONG SUBJECT FOR ANY
    EDITOR MEASUREMENT.** Its sections and its work-filter category are set in code, not in the
    CMS — the editor says so on screen ("Hand-built case study … Its sections and its
    work-filter category are set in code, not here") and `BESPOKE_SLUGS` gates the fetch, so
    `ProjectsEditPanel` never loads sections for it. Opening `/studio/projects/boat-crest` shows
    the details strip and a read-only notice, **and nothing else**.
    **WHY THIS IS A HAZARD RATHER THAN A NOTE:** it is the FIRST slug alphabetically, the first
    in the index, and the canonical example everywhere in this repo — so it is the natural thing
    to reach for, and reaching for it returns a page that looks like a broken editor rather than
    a different kind of study. The consistency investigation measured it first and got an empty
    board before noticing why. **It has already cost coverage once:** `parity.mjs` lists it among
    its four slugs, so a parity run over boat-crest exercises the hand-built page, not the
    CMS-driven render the harness exists to check — and `run.mjs:89-93` records that a vacuous
    parity run once printed `sections: 0 / PARITY OK`, the same false pass in a different tool.
    **USE `elevate-one-view` (14 sections) FOR EDITOR MEASUREMENTS.** State which study a
    measurement was taken on, always — a number taken on boat-crest is not wrong, it is about a
    different thing.

---

## DEFERRED — scoped, not built

- ~~**THE 40 `text-ink-500` SITES — REAL DEFECTS, NAMED IN #210 AND DELIBERATELY NOT FIXED.**~~
  **BUILT — the sites were re-pointed to their neighbours' tokens, closing hazard 23; see that
  hazard's CLOSED note for the mapping, the per-family neighbour proof and the per-ground
  contrast.** The reasoning is kept below because it is exactly what the fix followed — the
  "match the neighbour" census was the plan, and the build executed it site for site.
  Each was a class that meant _muted_ rendering at full ink-950 beside the primary text it was
  supposed to sit behind. Deleting them would have made the code honest and left the elements
  looking exactly as wrong, so instead of deleting, the muted intent was realised.

  **THE STRONGEST EVIDENCE IS ADJACENT CODE DISAGREEING WITH ITSELF, not an inference about
  intent.** `ProjectsEditPanel:273` is the readonly Company field: phantom, rendering full ink,
  indistinguishable from an editable input. **`ProjectsEditPanel:275` is its own hint, two
  lines below, using `text-text-subtle` and rendering correctly muted.** The hint is muted and
  the field it describes is not, in the same JSX block.

  **THE FOLLOW-UP IS SMALLER THAN "which of ink-600 or ink-400".** The studio already has three
  muted tokens in heavy use — `text-text-subtle` (65 uses, 109,100,93), `text-ink-400` (68) and
  `text-ink-600` (63) — and **field hints already use `text-text-subtle`**, including the hint
  under that broken field. So for the families below the answer is **match the neighbour**, not
  a fresh judgement:
  - **B · badge pills (10)** · **D · "Saving draft…" (7)** · **E · readonly fields (2)** — take
    `text-text-subtle`, which is what the surrounding hints already use.

  **C · THE 13 ICON BUTTONS STAY A SEPARATE QUESTION.** Each is `text-ink-500 …
enabled:hover:text-ink-950`, so **the hover affordance does not exist** — rest and hover both
  render ink-950. That is about an icon's rest state against its own hover, not about muted
  text, and folding it into the above would decide thirteen sites on a rationale built for ten.

  **A · three tab/inactive pairs** and **G · four others** (chevron, empty state, the "Section"
  label, the preview page's toggle) are individually small and can ride with whichever decision
  fits.
  **`studio-tokens` B2 now asserts the count is ZERO** — the decision was made and the sites
  converted, so the guard flipped from pinning 40 to failing if any `text-ink-500` returns. The
  icon-button family (C) resolved to `text-ink-400` on exactly the reasoning above: its question
  was rest-against-hover, so it took the muted icon rest colour its working neighbours already use
  rather than a muted-text token, and the hover to ink-950 that never fired now does.

- ~~**PR C — THE CARD IMAGE (fidelity item 4)**~~ — **BUILT in #211.** Kept below for its
  reasoning; the plate is capped by HEIGHT (160px) rather than width, because the height a
  width produces depends on the aspect, and the aspect is per call site.
  **PR C — THE CARD IMAGE (fidelity item 4), as scoped.** `ImageThumb` is a **36×36 chip** (`size-9`); the
  contract draws a **full-width 16:9 plate, 164px tall** at inspector width. **NOT A REPAINT** —
  it changes the inspector's vertical rhythm, pushes fields down, and interacts with
  `INSPECTOR_FOLD_PX`. It also touches **every** `ImageThumb` consumer, `BlockImageField` and
  `SettingsPhotoField`, so it is **not blog-only**. Needs a measured height check.
  **RUN `studio-type` BY HAND** — see the note in the gate section; it is the only thing that
  catches a wrong-but-uncontested size, and resizing a thumbnail is exactly that shape.
- ~~**PR D — TOPIC AS A SET (fidelity item 5).**~~ **BUILT.** The three parts landed as scoped.
  **(1) The source of truth** is `BLOG_TOPICS` in `blog-format-core.ts`, beside `BLOG_STATUSES`
  and exactly its shape — `["AI in product", "Enterprise UX", "Design systems"] as const`, EXACTLY
  the three topics the existing posts already carry. The owner chose the three over inventing a
  taxonomy ahead of the posts that would use it, on STATE's own reasoning: a closed list of unused
  topics would be invented rather than enforced. It grows by one line when a fourth is written.
  **(2) The schema stays `fields.text`**, not `fields.select` — a select injects a default into
  every entry the reader parses, and studio is the sole editor, so the set is enforced where
  editing happens: the sanitizer refuses a non-member at SAVE (empty still allowed, a draft may be
  unset), and the publish gate `validate-blog-post` REQUIRES a member at PUBLISH, mirroring `alt`
  and the title. The editor is a `SelectField` over `BLOG_TOPICS` with an empty option read "No
  topic yet" (a dash would have used an em dash, against the writing rules), replacing the open
  datalist. Both gates and the dropdown read the one const, so they cannot disagree.
  **(3) The migration was a no-op, PROVEN not assumed** — the set was chosen to be the topics on
  disk, so `validate-blog-post` F7 reads the real post files and asserts every published one is
  already a member. Zero rewrites.
  **The empty-topic RENDER branches stay reachable** — the article head's `topic ? … : null` and
  the OG card's dropped eyebrow row still fire for a draft previewing with no topic. The publish
  gate judges published posts only, so those branches are NOT dead code.
  **`validateBlogPost` TAKES THE SET AS AN ARGUMENT, not an import**, preserving the property that
  lets ralph execute it directly (its sibling `validate-draft-sections` imports a value and so can
  only be source-inspected). The caller `publish-site-settings` passes `BLOG_TOPICS`; the suites
  pass it too. A relative value import would have broken every execution test of the gate.

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
- **A PER-ENTRY PUBLISH, or a diff preview in the PublishBar** — the real answer to hazard 13. Whole-branch publish has already shipped a half-finished sentence once.
- **The button system.** 87 buttons across 18 files.
- **Body scroll lock for modals.**
- ~~**Skills sidebar count**~~ — **BUILT in #199.** The owner chose CATEGORIES. The recorded
  scope was four edits and it was **FIVE** — `StudioSidebar`'s Skills entry had no `count`
  property at all, so the four alone would have changed nothing on screen. A count claim wrong
  about a count. `skills` is also a SINGLETON, so the seed is `skills?.categories.length ?? 0`;
  `skills.length` would have shipped `undefined` silently.
- ~~**`ContentCard.tsx` → `OverviewRow.tsx`**~~ — **DONE in #199.** #166 deferred it to
  "whichever later task opens this file" and none did, so it sat nine PRs. **A DEFERRAL
  CONDITIONAL ON SOMETHING THAT MAY NEVER HAPPEN HAS NO OWNER** — give it a trigger that
  will actually fire, or do it.
- **Home/End keys** and a standing ralph suite for `ListDetailLayout` (#167).
- ~~**`inputCls` duplicated across 8 files**~~ — **DONE in #199, AND THE COUNT AND THE PREMISE
  WERE BOTH WRONG.** SEVEN declarations, not eight, and they were **NOT IDENTICAL**: three
  distinct strings. Four panels carried `text-[14px]`, the block forms and the case-study index
  `text-[13px]`, and `LinksEditPanel` a structurally different box. **THE COPIES HAD DRIFTED,
  SO THE DEDUPE WAS NEVER A DEDUPE** — a naive merge would have resized rendered type on four
  surfaces. Only byte-identical copies were merged, into `inputCls` (13px) and `inputClsMd`
  (14px). ~~**THE SPLIT IS DELIBERATE AND UNRESOLVED**~~ — **RESOLVED TO 14px in the site-wide
  font bump on `feat/blog-editable-title` (the owner's call).** The two exports are now
  identical; `studio-nav-active` G5/G6 flipped from "they differ by the font size" to "they are
  identical at 14px", so re-opening the split now fails ralph. They stay two exports (merging
  means re-pointing every `inputClsMd` consumer — a refactor, not part of the reconcile). The
  dedupe guards G1–G4 are unchanged.
- **Post renaming** — create-new, move assets, delete-old. The title is read-only for this.
- **Blog pagination**, an OG route, RSS, the share row.
- **PublishBar centring over the canvas** rather than the work area — **13px off with the
  list open, 131px collapsed.** Accepted in #178 and the reasoning is in the component's
  hazard comment: centring over the canvas needs the list and inspector widths too, a third
  and fourth hand-coupled literal on a component ten pages share.
- ~~**CLAUDE.md staleness**~~ — **DONE in #199.** The build sequence now says phases 0 to 5
  are complete and lists what followed; Open items drops the editorial-direction question and
  names content as the real remaining work.
- ~~**An ESLint config.**~~ — **BUILT in #195.** It was never a tooling problem: every
  dependency was already installed and a `lint` script already existed, so only the config
  file was missing.
- **THE #195 FOLLOW-UPS — ONE DONE, TWO LEFT.**
  ~~1. WIRE `useReducedMotion` IN `SiteHeader`~~ — **DONE in #197 and #198**, and it was the
  one that affected a real reader. See hazard 18 for what it actually turned out to be.
  ~~**2. DELETE THE `rules-of-hooks` DISABLE** (hazard 17) by moving the early return below the
  hooks or lifting selection out of the panel.~~ — **DONE in PR 4**, the consistency arc's
  blocker. All three #195 follow-ups are now closed.
  ~~3. IMPLEMENT `pinned` IN `StudioSidebar`~~ — **REMOVED in #199**, because the intent was
  already implemented in the wrapper. See hazard 19 for why the hazard's own text was wrong.
- **PR 2b — MAKE THE 21 ENTRY-PANEL INPUTS CONSUME THE SHARED EXPORT.** PR 2a shipped the
  panel language everywhere except here, and the gap is stated rather than quiet: **block-form
  fields are 44px wells, the entry panels and the login form are still 39px flat boxes.**
  **IT IS A DEDUPE, NOT A REPAINT, and must be scoped that way.** Converting the 21 literals in
  place re-creates by hand exactly the drift #199 spent a PR removing. Do what #199 did: prove
  which copies are byte-identical before merging, and where they differ **report the difference
  and say what changes** rather than picking a winner silently — a dedupe that quietly resizes
  type on a surface is not a dedupe. The literals have already drifted: 13px against 14px, plus
  `resize-y`, `leading-relaxed` and `cursor-not-allowed`. **Some of those are legitimate** — a
  textarea wants resize-y, a disabled control wants cursor-not-allowed — and they are additive
  and compose with the export. **Only the geometry should be shared.**
- **A FIFTH INPUT GEOMETRY STRING LIVES INLINE IN `StudioSearch`, AND #199 COULD NOT REACH IT.**
  #199 deduped the shared EXPORTS into `inputCls` (13px) and `inputClsMd` (14px). `inputErrorCls`
  is a third copy of the same box, `labelCls` a fourth export that ink chrome's rule 3 changes,
  and `StudioSearch` holds a fifth as an inline literal — not an export, so no dedupe pass saw
  it. **PR 2's input work is at least three edits, not the one the contract claimed.** PR 1
  restyled the StudioSearch copy locally for the ink topbar, which is why it is recorded here
  rather than left for PR 2 to rediscover.
- **MOBILE INK CHROME IS UNBUILT AND DELIBERATELY UNSCOPED.** PR 1 scoped ink to `lg:` and up.
  Below that the aside is full width above `main` with a horizontally scrolling nav — measured
  at 500×860 the chrome is a **197px slab, 22.9%** of that viewport and ~30% on a 667px phone,
  and the active pill is the primary wayfinding cue in a scroller with three of six items off
  screen. Inverting it there costs **19.04:1 → 1.25:1**. It is a different composition, not the
  same design smaller, so it needs its own decision rather than a breakpoint sweep.
- **THE CASE-STUDY CANVAS HAS THE SAME SNAPSHOT GAP #202 CLOSED FOR BLOG.**
  `ProjectsEditPanel` fetches `draftImages` **once** inside `loadSections()` and its own
  comment says it is _"still never re-fetched once loaded"_; `SectionsEditPanel` builds
  `rewriteSrc` from that snapshot. So it is the identical bug, sourced from a client fetch
  instead of a server prop, and a case-study block image uploaded during a session 404s on
  that canvas until publish.
  **#202 LANDED THE EMIT HALF** — `ImgSpecFields` already forwards the `File` to whoever wants
  it — so the follow-up is **seven `ImgSpecFields` `set` arrows** (most nested inside
  `ItemRows` row-setters) **plus a map in `SectionsEditPanel`**. Nothing new to design; reuse
  `lib/studio/preview-map.ts` unchanged, and its append-only rule applies for the same reason.
- **THE BLOG EMITS NO STRUCTURED DATA AT ALL, and case studies do.** `lib/structured-data.ts`
  builds JSON-LD for a case study and feeds it `ogImageUrl(slug)`, which is what that helper's
  "single source for og:image, twitter:image and the JSON-LD image" note is about. A blog post
  emits none — no `Article`, no author, no date, no image. So `blogOgImageUrl` deliberately has
  only two consumers where `ogImageUrl` has three, and that asymmetry is REAL rather than an
  oversight in the OG-card PR, which is why it is written down here instead of being quietly
  evened up. Whoever adds blog JSON-LD should route its `image` through `blogOgImageUrl` for
  the same reason case studies do.
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
9. ~~**NO `imageBlock` HAS BEEN WRITTEN THROUGH THE LIVE SEAM**~~ — **CLOSED.** The owner
   authored, committed and published one through the live seam in `f734a7e`
   (`content/blog/ai-first-is-a-research-posture-not-a-feature.yaml`), an `imageBlock` with a
   real uploaded blob at `blocks/d9517012efd9.webp` among 9 blocks across 4 kinds. Open since
   #180 and closed by use rather than by a gate, which is the only way it could close.
10. ~~**#190's G6b — THE FRESH HERO UPLOAD SHOWS IN THE CANVAS WITHOUT A RELOAD.**~~ —
    **CLOSED, AND IT IS AN OWNER OBSERVATION RATHER THAN AN INFERENCE.** The owner uploaded a
    hero through `/studio` in production and confirms the canvas hero appeared **IMMEDIATELY,
    with no reload**. #190's `draftImages` snapshot fix — handing the `File` up so each holder
    makes its own object URL — is verified by real use. It was UNVERIFIED rather than
    DEV-OBSERVED because fs mode made `onChanged` unreachable locally, so only production
    could settle it, and production did.
11. ~~**#202's G8 — THE FRESH BLOCK-IMAGE UPLOAD SHOWS IN THE CANVAS WITHOUT A RELOAD.**~~ —
    **CLOSED BY REAL USE.** The owner uploaded a block image through `/studio` in production
    and the figure appeared on the canvas **IMMEDIATELY, with no refresh.** It was UNVERIFIED
    rather than DEV-OBSERVED for the same structural reason as item 10: `upload-block-image`
    returns `{ mode: "fs" }` and `BlockImageField` returns **before** `onChange` fires, so
    nothing downstream of the route can run locally. #202's browser gates drove everything
    below the route with it stubbed; **only a real deployment could settle the route itself,
    and one did.** Both halves of the `draftImages` snapshot gap — hero and block — are now
    verified by use rather than by a gate, which is the only way either could close.
    **WHICH DEPLOYMENT IS NOT DERIVABLE FROM THE REPO, so it is not claimed.** Both
    block-image blobs on `main` (`0a03779`, `ba41d04`) **predate #202's merge**, and no draft
    branch survives carrying a third, so the verifying upload was on the PR's preview
    deployment or on a draft that was never published. That does not weaken the observation —
    a preview build is production-mode and owner-authenticated — but it is the difference
    between what was seen and what this file can check, and the two are kept apart.

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
- `studio-ink-chrome.html` — **CORRECTED SIXTEEN TIMES, C-1 to C-16** (the running count across
  all reference files is now **EIGHTEEN**; C-17 is the sidebar border race, C-18 the case-study
  collapse contract below). It has now joined `studio-blog.html` as **a reference that was repeatedly wrong
  about architecture**, and the recent four are worth knowing as a group because they are four
  different ways a static design file goes stale:
  - **C-12** — the topbar search is specified against a **cream topbar the direction itself
    replaced**. When one rule moves a surface, every rule that positioned something ON that
    surface is stale, and nothing in a static document makes that visible.
  - **C-13** — **the file's own list renders in Arial.** `.item` is a `<button>`, buttons do not
    inherit `font-family`, and the file never sets one. So the mockup's most prominent column
    drew Arial while the app drew DM Sans, which **materially distorted every side-by-side
    comparison made against it** — and was a large part of "the contract reads bigger". The
    same class of bug as the ink bands: a declaration that never reached the screen. **The
    contract is not exempt from the defects it is used to find.**
  - **C-15** — its selection fills were **right, but only after PR A's re-tier**, because the
    file had assumed grounds the studio did not have until then. Right about a studio that did
    not exist. And the numbers were never the rule — the third surface, which the file never
    drew, needs a value it never names.
  - **C-16** — `.thumb` is 16:9, which is right for block figures and **wrong for the settings
    portrait**; and, in the same PR's addendum, **`.thumb` was never `ImageThumb` at all**. It
    sits under "Card image" in the POST section, which is `HeroImageField`. The file describes
    a mockup, so it names no components — and that is precisely why a rule can be mapped to the
    wrong one and nothing notices.
    **Corrected in place beside what they replace**, never silently overwritten.
- **the case-study contracts** — **THEY HAVE NOW JOINED `studio-blog.html` AND
  `studio-ink-chrome.html` as references repeatedly wrong about ARCHITECTURE**, and the arc's
  eighth PR added a kind neither of those produced:
  - **C-18 — WRONG ABOUT THE DATA, NOT THE DESIGN.** The collapse contract proposed "Section
    open, each block collapsed except the one being edited". The design is sound; the content is
    not shaped that way. **12 of the 14 sections in `elevate-one-view` have exactly ONE block**,
    so the default is a no-op on 86% of the content and on the rest it folds the only thing on
    screen. The height is stacked inside one block, in `ItemRows`. **A static file can be right
    about the shape of a solution and wrong about the shape of the problem**, and nothing in it
    can tell you which — the previous seventeen corrections were all about the file describing a
    studio that had changed; this one describes content it never looked at.
  - Also refuted: "a collapsible-group pattern already exists" (`DisclosureGroup` is field-level,
    one-way and sticky, and no `<details>` exists in `components/studio`), and "the index needs a
    bespoke row" (it already is one). See the consistency investigation, section G.
- Six untracked explorations, unrelated, left alone.

---

## SESSION PR/SHA LOG

- **#235** the thresholds measure the page box, not the viewport (`usePageWidthMin`) →1549
  (`three-pane` 78→86). **THE TRIGGER'S REMEDY WAS WRONG AND THAT IS THE DURABLE OUTPUT** — see
  the working rule. Measuring the shell is circular; it reports 1309px inside an 885px page.
  **THE DEFECT, SHARPER THAN RECORDED:** `matchMedia` matches the VIEWPORT, every pane divides
  the PAGE BOX, `scrollbar-gutter: stable` keeps them apart, and the constants were page-space
  sums all along. **The numbers were right; the comparison was wrong.** Driven: page 1460 →
  canvas exactly 640, raw fit exactly 0.500; page 1614 → blog's pane exactly 794 and its prose
  exactly 746, the 68ch measure the constant exists to protect.
  **THE CONTRACT DID NOT CHANGE, AND THAT WAS THE EXPECTED HARD PART.** A measured value normally
  cannot have a server snapshot. It can here because `documentElement` is **not a node a component
  renders** — no ref to be null, `getSnapshot` reads it during the first client render exactly as
  `matchMedia` did, no first-frame guess invented, `useSyncExternalStore` untouched. The plan
  spent most of its risk budget on a problem that does not exist in this shape.
  **#178 PROVEN RATHER THAN REASONED.** Driven at a narrow load: list width 1 on arrival,
  `transition-duration: 0s`, no transition class, **zero running animations** — then an explicit
  toggle switches it to `width, border-color` 0.3s. The gate is live, not merely unbroken.
  **ONE CONSTANT RE-DERIVED, FOR A DIFFERENT REASON.** `CS_COLLAPSED_FLOOR_PX` 1222 → 1223.
  Driven at page 1222 the canvas came out **639**, raw fit 0.499, with the clamp covering the last
  pixel — because a collapsed list pane is `w-0 border-transparent` and **a transparent border
  still occupies its 1px** (the border-COLOR is what animates, so it cannot be dropped). The 26px
  rail term was 27. Corrected by re-deriving the term, not padding the total; the gate now derives
  that pixel from the shell's own class.
  **THE FLOOR STAYS AND IS NOT INERT — the answer neither of us predicted.** On the default path it
  never binds, which is the point of getting the threshold right. On the EXPLICIT-OPEN path it
  binds hard: driven at page 1225 with the list reopened, canvas 405, raw fit 0.316, rendered
  0.500. `ListIntent = "open"` deliberately holds at every width, so the clamp stopped covering an
  arithmetic error and started guarding the one path the arithmetic does not cover.
  **`three-pane` PART I's GUTTER-GAP ASSERTIONS WERE REPLACED, NOT KEPT.** They asserted the gap
  EXISTED, so keeping them would have pinned the bug — a gate that outlives the defect it
  described is the same shape as a comment describing code that no longer exists, except that it
  fails when someone fixes the thing.
  **RENAMED `useMediaMin` → `usePageWidthMin`**, citing `StudioSidebar.tsx:52`'s `FIT_THRESHOLD_PX`
  note as the precedent for a name outliving its meaning.

- **#237** the resizable sidebar — the drag (`21ad912`..) →1575 (`three-pane` 99→113, `studio-ink`
  D re-pointed). **THE OWNER CHOSE THE DRAG KNOWING THE NUMBER**: its entire useful range below
  236 is **52px**, where collapsing to icons would have bought **129px**. The ask was for the
  CONTROL, not the room, and that is a legitimate thing to want.
  **HAZARD 1 CLOSED, BOTH HALVES — and only one of them was expected.** The arithmetic half was
  the plan; the DISPLAY half closed too, because `StudioSidebar`'s width and `PublishBar`'s offset
  became the same custom property rather than two literals asserted equal. That is the argument
  for the custom property over an inline style, and it was not the argument given for it.
  **LIVE OR ON COMMIT, SPLIT BY KIND.** The width and every pane's size are LIVE with zero React
  renders — the handle writes one CSS property on `pointermove`, the panes are flex children so
  they reflow natively, and `useFitToWidth`'s ResizeObserver makes the canvas scale track the drag
  for free. The THRESHOLD decisions commit on `pointerup`, because re-evaluating a discrete
  decision per move gives a pane that pops shut and open as the pointer crosses a boundary.
  **What stops it thrashing is structural rather than a debounce** — the only per-move write is a
  CSS property, and no threshold is consulted until the gesture ends. There is no timer to tune.
  **AND THE ONE HONEST COST LANDS ON A GUARD THAT ALREADY EXISTS**: dragging past the threshold
  leaves the canvas under 640 until release, which `useFitToWidth`'s 50% clamp covers — the guard
  #235 established for the explicit-open path, covering the mid-drag path without being told to.
  **TWO DEFECTS FOUND BY DRIVING IT, BOTH SILENT, AND THE SECOND IS THE ONE THAT MATTERED.**
  **(1)** In flow with `-mr-1`, `main` started 4px inside the handle and painted over half its hit
  area — a pointerdown at x=241 inside a 236..244 handle reported a BUTTON in main as its target
  and the drag never began. Half the affordance was dead and it looked fine.
  **(2)** An in-flow flex item CONSUMES LAYOUT WIDTH. Net 4px came off the work area, so at a
  288px sidebar the canvas measured **645 where every sum promises 649** — a term nobody put in
  the arithmetic, introduced by the control built to sit on the seam. Absolute on the seam, it
  consumes nothing. **The control built during the arithmetic arc nearly shipped the arc's own
  defect.**
  **DRIVEN AT THE CLAMP AND ACROSS IT.** At page 1521: sidebar 184 → canvas 749, 236 → 701,
  288 → **649 / 0.507**, three panes holding with 9px of headroom. And the threshold is REACTIVE:
  at page 1450, where the collapse point (sidebar > 226) falls INSIDE the clamp, 224 keeps the
  list open at canvas 642 and 232 collapses it to 871.
  **⚠ "288 IS SAFE" IS A FACT ABOUT A 1536 LAPTOP, NOT ABOUT THE CONTROL**, and it is recorded at
  the clamp's definition rather than only in the PR: on a narrower display the collapse point
  falls inside the range, and dragging to 288 there will collapse the list. That is the feature
  working and it will look like a bug to whoever meets it first.
  **THE CLAMP IS APPLIED ON THE READ**, which is what survives a future clamp change — a cookie
  written under wider bounds outlives the build that allowed it. Proven from the SERVER HTML, not
  post-hydration state: cookie 200 → 200, **320 → 288**, 50 → 184, "abc" → 236.
  **NO HYDRATION FLASH, BY CONSTRUCTION.** The layout already called `cookies()` for the session;
  it reads the width in the same call, so the first paint is correct rather than corrected.
  `localStorage` would have guaranteed the opposite. **#178 survives**, driven at a narrow load
  with a non-default cookie: sidebar 288 on arrival, list collapsed, duration 0s, **zero running
  animations**, then an explicit toggle switches the transition on.
  **KEYBOARD DRIVEN WITH REAL KEYS**, per #209: `:focus-visible` **true**, handle and outline both
  accent-500, arrows ±8, Home → 184, and **Enter toggles MINIMUM ↔ last non-minimum** rather than
  the default — binding it to 236 would hand a keyboard user the one width they already had.
  **CONTRAST**, sanity pair 21 first: accent-500 measures **4.05 on ink-950** and **4.70 on
  cream-50**, both clear of the 3:1 floor for a non-text indicator (1.4.11).

- **#239** the field measure — the four studio pages get a readable field column →1582
  (`studio-ink` 107→112). PR 1 of three; the four per-page items follow.
  **A FORM IS CONTENT AND CONTENT HAS A MEASURE.** Unbounded, a single-line field grows with the
  window: measured **1939px on a 2560 display**, 915px on the 1536 laptop. Capped at 760 the
  panel keeps its full width — 1973 unchanged — and the textareas keep theirs, 1939 unchanged,
  because "What you did" and the hero's tab lines hold paragraphs and use the room.
  **THREE PLAUSIBLE SHARED SEAMS, THREE DIFFERENT FAILURES**, and the set is the finding:
  `ListDetailLayout`'s detail pane caps the PANEL, taking its cream-200 bar and footer with it;
  the panels' body wrapper is byte-identical across five files and still wrong, because it holds
  the textareas; `inputCls` itself is used BY textareas and reaches the case-study inspector,
  which is 304px wide and has no such problem. So: ONE DEFINITION, N APPLICATIONS, with the
  applications asserted rather than trusted.
  **THE GATE'S FIRST DERIVATION WAS TOO NARROW AND THE MEASUREMENT CAUGHT IT.** Deriving entry
  panels the way E6 does — files calling `useListItem` — passed while About and Process still ran
  **1825px** fields, because `ChipListEditor` puts single-line inputs on the same stretching
  surface and is a CHILD, not a panel. The set is now the panels plus the field children they
  import, so a future shared field component joins by being imported rather than by being
  remembered.
  **TWO EXCLUSIONS, EACH ON WHAT THE THING IS RATHER THAN ON ITS NAME.** `SettingsPhotoField`'s
  only input is `type="file"` and `hidden` — a file input is not a field and has no box to cap,
  so the rule excludes hidden file inputs generally. `ProjectsEditPanel` is excluded BEFORE its
  imports are walked, or it drags in the whole three-pane case-study editor; its fields live in a
  320px inspector that never stretches.
  **AND A COMMENT NEARLY FAILED A GATE ABOUT SOMETHING ELSE.** The new constant's header
  originally wrote the two element names in angle brackets, and `studio-ink` E2 attributes an
  inline-geometry match to the last JSX-looking tag before it, over RAW source — so those two
  words re-attributed the three well constants and failed E2. Same class of trap as the class
  name a comment EMITS, which `LinksEditPanel`'s header already records. Written without the
  brackets, with the reason.
  **HAZARD 2 OPENED, NOT CLOSED:** `inputCls` and `inputClsMd` are byte-identical while their
  header argues at length that they must not be merged. See the hazard; the merge stays #199's
  open decision, the comment does not.

- **#240** homepage and skills — the visual pass →1586 (`studio-ink` 112→116). PR 2 of three.
  **THE HEADLINE IS A DEFECT NO GATE COULD HAVE CAUGHT, AND ONLY RENDERING DID.** The ordinal was
  moved onto the label scale by importing `labelCls` — and `OverviewRow` is a SERVER component
  while `blocks/fields.tsx` is `"use client"`. **Importing a plain string constant across that
  boundary does not fail to build.** Next yields a throwing proxy, a template literal stringifies
  it, and the element rendered with
  `class="w-6 shrink-0 tabular-nums function() { throw new Error("Attempted to call labelCls()…"`.
  **tsc passed, lint passed, ralph passed, the page looked plausible.** The utilities are written
  out in that file now, with the pair asserted rather than deleted — `three-pane` H's "a coupling
  you cannot remove is a coupling you assert" — plus an assertion that the import does not return.
  **THREE CONTRACT CLAIMS DID NOT SURVIVE SOURCE.** (Numbers left for the owner to assign; C-19
  and C-20 are reserved for PR 3's two.)
  **(a)** "The ordinals move off 9.5px." They were **17px Fraunces italic**; 9.5px was the LIVE
  pill's, and that pill is what this PR deletes. Right destination, wrong starting point.
  **(b)** "The rows get a content cap so a row does not run 2000px wide." They were **already
  capped at `max-w-[60rem]` = 960px** — 60px TIGHTER than the contract's own 1020. No change made;
  a cap that already exists and is stricter than the spec does not need loosening to match it.
  **(c)** The contract specifies **ink-400** for the ordinal. #228 swept 45 sites OFF ink-400
  because it measures 3.02–3.49 on cream and fails AA, so adopting it would restore the exact
  value that PR removed. Taken at the label scale's ink-600, **7.42 measured**, and pinned.
  **THE COMMENT-EMITS-CSS TRAP, SECOND TIME IN TWO PRS.** Writing the dot's class name in prose
  put a 28th pill in `studio-ink` F5's raw count. Tailwind v4 scans comments, so F5 counting raw
  source is CORRECT — a comment can ship CSS — and the comment was wrong. #239 hit the same trap
  with two element names and E2. **It is easiest to forget while explaining the very class you are
  adding**, which is exactly when a header gets written.
  **MEASURED, BEFORE AND AFTER.** Homepage row heights **101/81/81/101/81/81 — unchanged**;
  ordinal 17px Fraunces italic → **12px DM Sans 700 at 1.68px tracking**, which is the contract's
  `.14em` at 12px exactly; status 9.5px pill (38×20, success-50 fill) → 6px dot plus a 12px word.
  Skills row height **44 → 44** and **the input's own 44px well survives** — the controls were
  outside it and are now beside it; three separately bordered buttons became one bordered cluster
  with hairline dividers, 108px → 98px.
  **CONTRAST, sanity pair 21 first**, all on cream-50 because THIS is the ground — the existing
  dots were measured on the cream-200/cream-300 rails, and a ratio belongs to the ground it was
  taken on (third instance): success-700 **6.58**, ink-400 **3.49**, both clear of the 3:1
  non-text floor; the ordinal 7.42.
  **THE SKILLS SAVE BAR STAYS OUTSIDE THE PANEL**, confirmed in the DOM. #229 settled it: skills
  is a `singleton()`, one save covers every category, and moving the footer inside would render N
  save bars for one save.

**THE STUDIO CONSISTENCY ARC, EIGHT PRs. CLOSED.** **ralph 1486 → 1541 across the arc itself**;
1193 → 1541 is the span since #199, which also covers the ink-chrome arc, the hazard closures and
PR D. Both numbers are true of different things and the arc's own contribution is the smaller
one — recorded that way because a total attributed to the wrong span is the exact error the
working rule above is about.

- **#226** the hooks blocker — hazard 17 (`cc8f035`) 1486 · **#227** well = ground, six sites
  (`92c54f6`) 1486
- **#228** the label scale, two steps by role (`809dd0e`) →1495 · **#229** section headers by
  role, Skills gets its bar (`c9ef6a3`) →1499
- **#230** the case-study scale floor — 50%, threshold 1460 (`bbbeffd`) →1517 · **#231** the
  shell's labelling and threshold seams (`c549120`) →1521
- **#232** the three-pane foundation — the floor wired, the ceiling named (`18bd9bc`) 1521
- **#233** the three-pane case-study editor (`c4f78e4`) →1535 · **#234** the group-level collapse
  (`21ad912`) →1541

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
- **#191** docs: STATE for the canvas arc (`fc8c318`) · **#192** the imageBlock reading-time
  gap, fixed as a mapped type (`2a9c8c2`) →1151
- **#193** the hero object-URL lifetime, deleted rather than managed (`d21b9a5`) →1163
- **#194** the inspector at 320 + the threshold moved with it (`9e3b1b2`) →1169
- **#195** the ESLint config + every fix but one, and the honeypot (`bec28c4`) 1169
- **#196** docs: STATE for the lint gate (`90b856b`) · `54f1954` + `1449487` the branch
  cleanup, 13 deleted and the squash-merge illustration dated
- **#197** the reduced-motion scroll (`258ee1a`) →1183 · **#198** the FAB under reduced
  motion (`fa08200`) →1187
- `d9e6b06` docs: STATE closes hazard 18 · **#199** the deferred sweep — inputCls, the
  rename, the skills count, `pinned`, CLAUDE.md (`bbf179f`) →1193
- `a397a1d` docs: STATE for the sweep · **#200** the Publish button names its object
  (`3e1a60a`) 1193
- `f734a7e` **the owner's studio publish** — the third post, with a hero and a real
  imageBlock, closing owner-backlog items 9 and 10
- `50a5275` docs: STATE for #200 and the two closed backlog items
- **#201** the dropped save, coalesced rather than dropped (`9982db9`) →1209
- **#202** the canvas draws a block image before it is published (`49a2a29`) →1235,
  closing hazard 20 and owner-backlog item 11
- `0a03779` + `ba41d04` owner studio block-image uploads — the two real `imageBlock` blobs
- **#203** every blog post gets its own social card (`932e59c`) →1264, in two commits — the
  case-study route's fail-open closed first, then the blog cards
- `6b28e91` + `01c2251` + `6ebd513` **owner studio hero uploads** — fosfor-ai,
  fosfor-data-profiling and elevate-one-view, closing two thirds of the #160 remainder
- `2d837f2` docs: /dev routes are dev-only · `bbf6d3d` docs: blog conventions in CLAUDE.md
- `f54574a` #179 docs: STATE records the 3-pane arc
- **THE INK CHROME ARC — SIX PRs, COMPLETE.** **#204** the shell (`e25a863`) · **#205** the
  panel language (`466df8e`) · **#206** the entry-panel input dedupe (`37286cc`) · **#207** the
  radius scale, 12/8/4 scoped (`d75eeb0`) →1332
- **#208** the fidelity repaint (`e938c16`) →1353. Eleven mismatches were measured against
  `studio-ink-chrome.html`; this took the six that are paint. **Item 10 led it**: the ink
  bands' `font-bold` / `tracking-eyebrow` were DEAD under the unlayered `h1, h2` reset, and
  the trap was already documented at `globals.css:1893` — scoped to `.case-study` and never
  generalised, which is exactly how #205 walked into it. **The durable output is
  `studio-cascade`** (hazard 25), not the repaint. Also: the ground ladder replacing two
  failed absolute readings of rule 2 (C-14), `/22` panel edges that #205 specified and never
  applied, every contract weight now matching, and corrections **C-12, C-13, C-14**.
- **the topic listbox + a fourth topic** →1486. Two changes to the topic control. (1) A FOURTH
  topic, `"Motion in Design"`, added to `BLOG_TOPICS` — a DELIBERATE departure from PR D's rule
  (the set was exactly the three on disk so it could not be invented), authored forward before a
  post uses it and named as such. The migration stays a no-op: `validate-blog-post` F7 still passes
  because every published post remains a member. (2) The native `<select>` became a custom animated
  `ListboxField` per `docs/studio/topic-control-listbox.html` (visual spec only — no CSS ported).
  **TOPIC-ONLY; SelectField stays for the four config toggles** (variant, layout, frame ×2), the
  split by ROLE recorded in BOTH headers with a named migration trigger — `CaseStudySwitcher`
  already documents native-is-better for a config toggle, so this applies a recorded decision. The
  listbox is reusable (SelectField's API shape) so migrating the four later is a wiring change.
  **CLIP → upward flip + a DYNAMICALLY CAPPED height, no portal.** The inspector is overflow-y-auto;
  live measurement found the panel opens DOWN and fits at 900px and 700px (topic is an upper field,
  ~296px room below a 216px panel), and a bug surfaced at a 480px pane where the field centres and
  neither side fits — a fixed max-height overflowed by 32px. Fixed to cap the panel to the measured
  room on the chosen side (171.75px at 480px) and scroll internally, so it never clips. **The check,
  not the 3px selection bar** — the bar marks a persistent selection in a list you navigate; a
  dropdown option is a transient choice in a list you dismiss. **Type-ahead DROPPED as a TRIGGER not
  a count** — dropped while every option is visible without scrolling; reconsider the moment the
  panel scrolls (also when scroll-into-view starts mattering). **Motion is pure CSS** covered by the
  global reduced-motion reset; the #198 guard (the chevron's rotation is a state class, only its
  transition is motion, so reduced motion never costs the open/closed affordance) is source-proven
  and mutation-tested. `listbox-a11y` (26, net-new) proves the keyboard/aria/focus wiring in CI;
  every behaviour was ALSO driven LIVE with real keys in an authenticated studio (arrows, Home,
  End, wrap, Enter commit, Escape, :focus-visible on a real key per #209, active-descendant,
  scroll-into-view on a genuinely-scrolling short pane, per-state contrast with a sanity pair, and
  the flip). The one gate the in-app browser cannot drive is the reduced-motion EMULATED side-by-
  side (it cannot set the media query — Playwright's job); covered by construction + the source
  guard instead.
- **PR 7a · the three-pane foundation** →1521 (no net-new; `studio-ink` F5 revalued). **PR 7 was
  split so the two PREREQUISITES are verified against TODAY's layout rather than against one
  changing underneath them.** Nothing structural ships here.
  **THE GEOMETRY FINDING LEADS, because the constant is wired here.** `CS_MIN_SCALE` had NO
  CONSUMER — PR 6 derived and gated it while `useFitToWidth` still read `Math.min(1, …)` with no
  lower bound. That is the `FIT_THRESHOLD_PX` shape #178 already found and this project has named:
  a gate on an unwired constant. Wiring it is what makes that gate stop being aspirational.
  **AND WIRING IT EXPOSED THAT PR 6's 640 WAS RIGHT ABOUT A PANE THAT DOES NOT EXIST.** The 240px
  Selected rail sits INSIDE the canvas term (`lg:grid-cols-[1fr_240px]`, 18px gap), so at a 640px
  canvas pane the canvas itself gets **640 − 240 − 18 = 382px = 29.8%** — below the floor the
  constant exists to protect. **The fourth arithmetic correction in this arc**, same family as the
  190px miss and #211's three correct-values-on-the-wrong-surface. Owner's resolution: the Selected
  rail moves into the INSPECTOR in PR 7, so the canvas pane gets its full 640 and lands on exactly
  50%. It also resolves a duplication rather than moving one — a "Selected" mini-inspector made
  sense when the inspector was a TAB; with a real inspector pane always on screen, two field
  surfaces for one selection is the shape this arc has refused five times.
  **THE TWO HAZARDS THE RE-DERIVATION EARNED ITS PLACE BY FINDING, both fixed and DRIVEN:**
  **(1)** `useAutoGrow` reached its ceiling by DOM walk — `railRef.current?.parentElement?.
  firstElementChild` — so moving the rail into a pane would have left it null, the effect would
  bail, and the textarea would be UNCAPPED with nothing failing. The element is now NAMED by ref at
  the call site. A fix that depends on the layout staying still is the wrong shape in a layout PR.
  **Proven:** shrinking the ceiling to 180px moved `maxHeight` to 180px, and a textarea wanting
  2536px rendered 180 — clamped.
  **(2)** the scale floor. **Proven:** pane 640 → exactly **0.5000**; panes 500 and 380 → **0.5**
  where the naive fit would give 0.39 and 0.30; panes 700 and 900 track fit above the floor.
  **THE CONSEQUENCE, STATED:** below the floor the surface is wider than its pane, so the pane pans
  rather than shrinking the render — most visibly below `lg`, where the canvas now holds 50% and
  pans instead of collapsing to ~29% and staying complete but illegible.
  **AN AA DEFECT FOUND BY RENDERING THE RAIL IN ISOLATION, and it was PRE-EXISTING.** `text-text-
  subtle` measures 5.52 / 5.25 / 4.78 on cream-50/100/200 but only **4.03 on cream-300** — the
  SELECTED row's ground — under the 4.5 floor. **`BlogPostList` has carried it since #209.** Fixed
  in both (selected rows take `text-ink-600`, 5.41) rather than recorded, on the arc's own rule:
  a hazard is for when the fix is expensive or contested, and one conditional is neither.
  **A CORRECTION TO MY OWN EARLIER NUMBERS:** an intermediate node calc used `oklch(45%)` for
  `--color-text-subtle`; it is **51%**. The browser was right and the corrected table reproduces
  every live measurement exactly (109,100,93 → 5.52/5.25/4.78/4.03).
  **F5 REVALUED 25 → 27, AND KEPT A COUNT.** The rail's two status dots are the case-study twins of
  `BlogPostList`'s published/draft dot — exactly the shape F5 protects. **A count is what makes an
  ACCIDENTAL pill fail; `>=` would pass anything**, and a loosened assertion under pressure is a
  pattern this arc has already caught once.
  **`SectionsRail` LANDS UNCONSUMED, DELIBERATELY.** A component with no consumer is a shape this
  project deletes, so it is recorded rather than left for an audit to find and be right about.
  **NAMED TRIGGER: PR 7 consumes it.** If PR 7 does not land, this is an orphan and should go.
- **PR 8 · the group-level collapse** →1541 (`mount-discipline` 8→14). `CollapsibleGroup`, a
  titled region that folds, applied to three group kinds in the inspector.
  **THE MEASUREMENT CHANGED THE PR, AND THAT IS THE ENTRY.** Both premises it was built on were
  wrong when re-measured.
  **CORRECTION EIGHTEEN — THE CONTRACT WAS WRONG ABOUT THE DATA, NOT THE DESIGN.** It proposed
  "Section open, each block collapsed except the one being edited". Measured across
  `elevate-one-view`, **12 of 14 sections have exactly ONE block**, so that default is a no-op on
  86% of the content and on the rest it folds the only thing on screen. The height is not spread
  across blocks — it is stacked inside one, in `ItemRows`.
  **AND THE 4.5-SCREEN FIGURE WAS STALE, WHICH WAS MINE TO CARRY.** It was taken when the editor
  was a full-page scroll with ~574px of room. PR 7 gave the inspector its own scroll container at
  the full pane height and **fixed most of it as a side effect**, and nobody re-measured. The real
  worst case was **3.03 screens**, not 4.5. A number accurate when taken, decayed when the thing
  under it moved — the same family as #214's grounds and #211's surfaces, caught by the arc's own
  re-derive rule rather than by a gate.
  **MEASURED PER SECTION, DRIVEN, BEFORE AND AFTER** (expand-all then fold-all on the real
  element, inspector 811px):

  | | before | after |
  |---|---|---|
  | worst section | **3.03 screens** | **1.78** |
  | mean of 14 | 1.86 | 1.02 |
  | fitting one screen | **2 of 14** | **8 of 14** |

  **AND IT IS WIDTH-INDEPENDENT**, which corroborates the finding that started this: at the folded
  width (card 928px) the same sweep gives 1.86 → 1.01, worst 3.04 → 1.76, 2 → 8. Field count is
  the driver, exactly as the inspector-width investigation concluded and PR 6's 38px confirmed.
  **SPLIT DEFAULTS, DECIDED BY THE MEASUREMENT RATHER THAN THE CONTRACT.** `ItemRows` rows fold by
  default — they are the whole saving. The block card and Section settings get the affordance and
  stay OPEN, because closing them hides what an author opened the section for to save ~250px each.
  **THREE THINGS THIS PR GOT FOR FREE, ALL WORTH RECORDING AS SUCH:**
  **(1)** `rowLabel` ALREADY EXISTS AT ALL 16 `ItemRows` CALL SITES, content-derived with an
  ordinal fallback — "Device 1", "The core flow", "Stat 3". The summary a collapsed row needs was
  already there; this PR consumes it rather than inventing an API, which is what made C cheap.
  **(2)** NO PERSISTENCE MACHINERY. Mount discipline already requires a folded group to stay
  MOUNTED, so its `useState` survives every selection change with nothing added. A behaviour
  obtained free from a constraint enforced for another reason is worth naming as that rather than
  rebuilt.
  **(3)** A real `<button>` gives Enter, Space, the focus ring and a screen-reader name natively.
  **SECTION SETTINGS HAS NOTHING TO SUMMARISE, AND THAT IS A FINDING NOT A GAP.** Its content is
  the eyebrow and title the section header directly above already renders through `sectionLabel`,
  so a summary would restate the line above it. It keeps its name and nothing else; a placeholder
  would have been invention, and the other two groups genuinely did have one already.
  **NATIVE `<details>` WAS RULED OUT BY A STRUCTURAL CONSTRAINT, NOT A PREFERENCE.** `ItemRows`
  headers already hold three buttons, and interactive controls inside `<summary>` toggle the
  disclosure instead of firing. The pattern has to work where the height is.
  **THE DROPPED CAPABILITY IS NAMED IN THE HEADER WHERE THE DECISION LIVES**, per the listbox
  rule: `hidden="until-found"` is unavailable, so **Ctrl-F will not open a folded row.** Trigger to
  revisit — React support landing, or an author reporting a search that should have found
  something.
  **THE `focusRef` TRAP, ASSERTED RATHER THAN REMEMBERED.** `useItemList.add` records the new index
  in `pendingFocus` and `focusRef` claims it by calling `el.focus()` on mount. **Focus on a hidden
  element silently no-ops**, so a new row rendered folded would swallow it and Add would look
  broken with nothing failing — this project's recurring failure shape. `defaultOpen` reads
  `pendingFocus` at mount, so exactly the row about to claim focus opens. **Driven**, and the
  assertion is on VISIBILITY rather than on focus landing, because a folded row leaves
  `activeElement` somewhere plausible; an input that is both active and non-zero height proves
  every ancestor is open.
  **`mount-discipline` EXTENDED, BECAUSE IT DID NOT COVER THIS.** It counted inputs across VIEW
  changes and never exercised collapsing, so an unmounting group would have passed. Now: a driven
  collapse-all → expand-all cycle (**editors 14 / inputs 378 constant across all six states**),
  plus source assertions refusing `{open && …}` by name and pinning `hidden` and `open` as
  separate axes so a card hidden under Style still cannot unmount.
  **BESIDE `DisclosureGroup`, NOT REPLACING IT**, and the rule is recorded in both headers. One is
  a one-way sticky reveal over a run of FIELDS whose stickiness is the property it exists for; the
  other a two-way fold over a TITLED REGION. Making the first two-way would destroy it, so "add an
  option" was never available. The seventh by-role split in this arc.
  **CONTRAST RASTERISED, sanity pair 21 first**, all three group kinds in both states: row summary
  7.06 resting / 6.42 hover, block card 19.04 / 16.49, Section settings 7.06 / 6.42.
- **PR 7 · the three-pane case-study editor** →1535 (`mount-discipline` 8 net-new, `three-pane`
  72→78, `studio-ink` 106 with E5 rewritten). Five stacked navigators collapse into one
  `selection` value (`"board" | "details" | <id>`), `ThreePaneShell` composes rail | canvas |
  inspector, the Selected rail moves into the inspector, and the ladder is righted.
  **THE HEADLINE IS THAT THE NATURAL COMPOSITION IS THE WRONG ONE.** `{showBoard ? <Board/> :
  <Shell/>}` reads correctly and compiles. It also destroys every section editor the moment
  someone with an unsaved edit opens the Board — the shell unmounts, the inspector goes with it,
  and the draft, the caret and the id-lockstep are gone. **Nothing fails; it looks like it
  worked.** So the shell is HIDDEN, never swapped, exactly as the editors inside it are. Found by
  reasoning about the composition, because hitting it does not announce itself.
  **`mount-discipline` gates it in two halves**, since the defect is a runtime unmount rather
  than a class string: source assertions refuse the ternary BY NAME, and a browser script proves
  the property — **14 editors / 378 inputs constant across start → section → Board → Editor.**
  **#232's CEILING FIX WAS HALF A FIX AND IT WAS APPROVED AS A WHOLE ONE** — see the new working
  rule. Passing the ceiling by ref fixed the subject; the effect still keyed on the ref object,
  so it ran once at mount and found null. **Measured: 3166px of textarea in an 811px pane.** The
  ceiling is now the ELEMENT in state via a callback ref. A second bound came with the move —
  the canvas ceiling is 1034 against an 811px pane, so the JS cap alone let a `sticky` rail
  outgrow the container it sticks inside; `min(<ceiling>px, 50dvh)`.
  **THE LADDER WAS RE-DERIVED, NOT CARRIED OVER, and that matters because PR 2's note pointed at
  a section that no longer exists.** It said the rail must go cream-200 when the body section was
  righted; the shell owns the frame now and that section is gone. The value lands in the same
  place for a DIFFERENT reason — `ThreePaneShell`'s inspector pane is cream-100, so a cream-100
  rail is 1.00 against it. Radius panel → card, one `radius-panel` left at the outermost level.
  Crumb row and footer are the chrome bracketing the split and both take cream-200; the crumb row
  was cream-50, one step FURTHER inverted than the header it replaced, directly above the shell's
  cream-50 canvas column.
  **GEOMETRY, DRIVEN AT THE RENDERED TRANSFORM** and testable for the first time, because until
  the rail moved the 640 pane yielded 382px: 1600 → 0.596 · 1460 → **0.500** · 1459 → 0.671 (list
  collapses) · 1222 → **0.500** · 1221 → 0.723 (inspector folds, view toggle appears). **The two
  exact-0.500 readings are the finding** — see the new working rule on the scrollbar gutter.
  **CONTRAST RASTERISED, sanity pair 21 first**, twelve sites on the new cream-200 grounds, all
  clearing 4.5, tightest 4.70 (`text-cream-50` on accent-500).
  **`parity` RUN BY HAND on the canvas this PR restructured: elevate-one-view 14 sections / 0
  findings, fosfor-ai 15 / 0.** Not boat-crest — hazard 28.
  **E6's PREDICTED SELF-CORRECTION DID NOT HAPPEN AND DID NOT NEED TO.** PR 7 predicted
  `ProjectsEditPanel` would stop rendering a panel `<section>` and leave the derived set
  naturally. It stayed in, correctly: its bespoke, loading and error states still return a plain
  panel with the cream-200 bar, because none of them has sections to navigate. Set size 7,
  non-vacuous guard holds. **Recorded because the claim would otherwise read as confirmed.**
  **AND THE BAND COUNT DID NOT GO 2 → 4.** PR 3 promised it would when the case-study inspector
  landed. It landed; the count is 2. The prediction assumed a new inspector pane takes the ink
  band, but this inspector has no section HEADS to band — a Selected card, a Content|Style
  tablist, and fields. **The by-role rule maps a treatment onto a role that exists; it does not
  conjure the role.** E5 is now DERIVED across every studio file rather than read off
  `BlogBlocksEditPanel`, so neither the count nor its location can drift unnoticed — which is
  what let this prediction go unchecked for three PRs.
  **TWO SAVE BUTTONS, RENAMED RATHER THAN MERGED — #200's SECOND INSTANCE.** Selecting Details
  shows two footers, and they commit genuinely different drafts (facts through
  `ProjectsEditPanel`'s `useDraftForm`, sections through `SectionsEditPanel`'s). By role neither
  is wrong; the defect was identical labels CLAIMING they were the same action. **"Save details"
  and "Save sections".** As in #200 the button was the only string that never named its object,
  and as in #200 the progress label is left alone, because the ambiguity is in the RESTING label.
  **No ralph suite, also as in #200** — these are copy strings and a suite pinning them would
  fail on every wording change without catching a defect.
  **THE ATTRIBUTE-INVARIANT IS PARTLY SILENT AND HERE IS WHERE.** It is vacuous on the case-study
  editor, which is the point of restructuring it, so that surface was DRIVEN instead (mount
  discipline, the width sweep, contrast, parity). For the eight dashboard pages it would prove
  untouched, the import graph is the stronger proof: `ProjectsEditPanel` reaches the site through
  exactly one route, `SectionsEditPanel` only through it, and `BlogEditPanel`'s import of
  `HeroImageField` is a named export this PR does not touch. **No public file changed at all**,
  so the public DOM is byte-identical by construction and `globals.css` is untouched.
  **WHAT IT DOES NOT DO: the 4.5-screen inspector scroll is unimproved.** Measured in PR 6 at
  794 → 320 costing 38px, 1.5%; the scroll is field-count driven and exists today at full width.
  **PR 8, the group-level collapse, is the fix and is REQUIRED rather than polish.**
- **PR 5 · the shell's two seams — labelling, and the threshold that mattered more** →1521
  (`three-pane` 68→72). STATE recorded `ThreePaneShell` as blog-specific "until a second
  consumer". **THE TRIGGER WAS MET, AND THE COUPLING WAS POLICY RATHER THAN STRUCTURE** — see the
  corrected LOCKED DECISION.
  **THE INVESTIGATION'S OWN CLAIM WAS INCOMPLETE, AND THAT IS THIS PR'S FINDING.** It reported the
  blog-shaped surface as "two aria-label strings", which is what the brief repeated. Checked
  against source, there was a THIRD thing and it was the one that mattered: **the shell read
  `FIT_THRESHOLD_PX` (1614) directly** at its `useMediaMin` call. That is blog's canvas measure,
  so a second consumer would have inherited blog's breakpoint IN SILENCE and collapsed its list at
  the wrong width — and the case study's threshold is 1460, LOWER, because its canvas scales. The
  cosmetic strings were the visible half; the behavioural coupling was the half that would have
  shipped a bug.
  **THE INSPECTOR FOLD SEAM DID HOLD**, exactly as the brief expected: `INSPECTOR_FOLD_PX` is
  imported and read only by the consumer, never by the shell. So one breakpoint was already
  delegated and the other was not, which is why the asymmetry went unnoticed.
  **`listNoun` RATHER THAN TWO FULL LABEL STRINGS.** It reads clearest at the call site
  (`listNoun="sections"` says everything), and both consumers share identical verb phrasing, so
  passing whole strings would repeat "Show"/"Collapse" for no gain. Two template strings is a
  cheap change if a third consumer ever needs different phrasing — which is the argument for
  taking the readable shape now rather than the most general one.
  **`fitThresholdPx` IS REQUIRED, NOT DEFAULTED**, so neither consumer can forget which number it
  is on and the shell cannot silently favour blog.
  **THE GATE'S PART D WAS REVALUED DELIBERATELY, NOT WEAKENED.** It asserted "the shell imports
  FIT_THRESHOLD_PX" and "passes it to the media hook" — both true, and both exactly the defect.
  a586e98's property (the constant must be USED, not decoration) is unchanged; it moved to the
  CONSUMER, which is the only place that knows its collection. New assertions: the shell no longer
  imports it, no hardcoded collection noun survives in the shell, and **the blog host passes the
  RIGHT constant** — that last one earns its place because both breakpoints are `number`, so tsc
  cannot catch a consumer passing `INSPECTOR_FOLD_PX` by mistake. Three mutations bite, including
  that one.
  **BLOG'S BEHAVIOUR IS BYTE-IDENTICAL, WHICH IS THE WHOLE CLAIM, AND IT WAS MEASURED:** at 800px
  the pane is `w-0` + `inert` with "Show posts"; at 1620px it opens to exactly 264px, `inert`
  false, with "Collapse posts". The templated labels render the same strings they hardcoded.
  **PR 5 ADDS NO SECOND CONSUMER** — still exactly one. Shipping the seam first means PR 7 is a
  layout change rather than a layout change plus a refactor.
- **PR 6 · the case-study scale floor — 50%, threshold 1460** →1517 (`three-pane` 49→68).
  **A DIFFERENT SHAPE OF CONSTANT, NOT A DIFFERENT VALUE.** `FIT_THRESHOLD_PX` is derived from a
  canvas with a NATURAL MINIMUM WIDTH — blog's 68ch is a property of the text. The case-study
  canvas has none: it renders at 1280 (`container-x`'s cap) and SCALES. **Substituting the term
  gives 236 + 264 + 1280 + 320 = 2100**, a threshold most laptops never reach, and it answers a
  question the scaled canvas does not ask. What had to be derived was a minimum legible SCALE,
  then a pane width, then a threshold.
  **THE FLOOR IS 50% AND IT IS A ROLE DECISION, NOT A LEGIBILITY ONE. THE CANVAS IS FOR SHAPE;
  THE INSPECTOR IS FOR WORDS.** A case-study author writes every field in the inspector; what the
  canvas uniquely shows is COMPOSITION — device width, rotation, translate, stacking, glow, the
  whole surface of the Style tab. Those are spatial properties no number field can convey.
  Body-text readability is not the canvas's job, so it is not what the floor protects. **The
  fifth by-role answer in this arc**, after the section headers, the listbox, the three-pane split
  and Skills' footer.
  **AND 50% IS AN IMPROVEMENT ON WHAT SHIPS, WHICH REFRAMES THE DECISION.** Measured, the current
  single-column editor renders the canvas at **`scale(0.383)`** at a 1138px window — below every
  floor considered. The threshold is not a compromise against today; it is a floor today does not
  have.
  **MEASURED ON A REAL DENSE SECTION** (`elevate-one-view`'s featureRows tour — not the hero,
  which is mostly large type, and not boat-crest, hazard 28). Natural sizes in the 1280 space:
  heading 49.7 / row title 21 / body 16 / eyebrow 12, device 248px. At 50% those render
  24.9 / 10.5 / **8.0** / 6.0 and a 124px device — layout, rhythm, image identity and row titles
  survive; body text and small labels do not, and are read in the inspector instead.
  **WHY NOT 60:** needs 1588px, so a 13-inch laptop cannot show three panes and the rail collapses
  there anyway; it buys 9.6px prose the author reads in the inspector. **WHY NOT 40:** the row
  title drops to 8.4px and image identity degrades to "type of screen", and its real gain — the
  whole section in one view — is the BOARD's job, and the Board exists.
  **NOT REAL OPTIONS FOR THREE PANES, recorded so nobody re-derives them:** 75% needs 1780px, 100%
  needs 2100px.
  **THE COLLAPSED FLOOR IS DERIVED AND CONFIRMED RATHER THAN ASSUMED.** `CS_COLLAPSED_FLOOR_PX`
  = 236 + 26 + 640 + 320 = **1222**, the twin of blog's 1376. Collapsing the list returns
  264 − 26 = **238px** to the canvas, so at the fit threshold the collapsed canvas is **878px =
  68.6%** — comfortably above the floor, and across the whole 1222…1460 band it runs 50%…68.6%,
  so the rail collapsing never takes the canvas under the floor.
  **THE GATE PINS THE ARITHMETIC OFF THE SHELL'S OWN CLASS STRINGS**, reusing the widths Part H
  already extracts, because **#194 found the threshold and the pane widths could drift apart with
  every gate green**. It also asserts the two copies of the render width agree — `CS_CANVAS_WIDTH_PX`
  and `SectionsEditPanel`'s module-private `CANVAS_WIDTH` — and that the 640 floor is COMPUTED
  from the scale rather than spelled as a literal. Five mutations bite, including widening a pane
  in the shell without moving the threshold, and making the two `CANVAS_WIDTH` copies disagree.
  **A COUNTERINTUITIVE FACT WORTH PINNING:** the case-study canvas is WIDER than blog's yet its
  threshold is LOWER (1460 < 1614), because it scales and blog's does not — so a **1536 laptop
  fits three case-study panes where it does not fit blog's**.
  **PR 6 SHIPS NO LAYOUT.** The constant and its gate only; PR 7 consumes them.
- **PR 3 · the section headers, by role** →1498 (`studio-ink` 103→106). **THE RULE:** an
  INSPECTOR PANE takes the ink band, an ENTRY PANEL takes the cream-200 bar. The band's own
  reasoning is about a NARROW pane beside ink chrome, where it anchors the inspector to the
  sidebar; on a ~967px full-width form it would be a slab of ink mid-page. **The third time the
  by-role shape has been the right answer** after listbox-vs-select and three-pane-vs-list-detail
  — and a fourth turned up inside this PR (below).
  **THE BAND COUNT IS 2 AND STAYED 2. Nothing here added a band** — Skills got the CREAM bar — so
  **the count moving in this PR would have been a red flag, not an expected step.** It becomes 4
  when the case-study inspector lands in PR 7, and that will be deliberate.
  **SkillsEditor's `CategoryPanel` was the only one of seven `useListItem` panels with NO header
  of any kind** and now opens with the bar, byte-identical to its five siblings (measured 51px /
  243,232,216 on both). It carries no dirty pill and no Cancel, and that follows from the same
  architecture as its footer. **`ProjectsEditPanel` was the only entry-panel header missing its
  `border-b` hairline**; all six now share the header string verbatim.
  **THE ListDetailLayout QUESTION, ANSWERED BEFORE BUILDING — the bar belongs in the PANEL, so
  this is ONE edit, not seven.** The decisive fact is the one PR 4 depended on: `ProjectsEditPanel`
  is **not inside a `ListDetailLayout` at all**, so a layout-level header would have fixed six
  panels and MISSED the one whose header was also broken. Beyond that the header content is
  panel-owned (icon, title, dirty, cancel) and the layout renders ALL children, each self-hiding
  via `useListItem`, so it has no "selected panel" to decorate.
  **AND THE FOOTER FINDING REVERSED THE BRIEF, WHICH IS THE VALUABLE PART.** The investigation
  called Skills' save footer drift — "a card outside the panel while all five siblings put a
  cream-200 footer inside" — and the brief repeated it. **Measured against the architecture that
  framing is wrong.** `skills` is a `singleton()`: this component holds every category in ONE
  `useDraftForm` and `buildCommitted` posts them together, so there is **one save for N
  CategoryPanels**, while the siblings save PER ENTRY. Moving the footer inside would render **N
  save bars for a single document save**. So it is a **document-level save bar, a different ROLE**
  from a per-entry panel footer — the fourth by-role answer in this arc — and it was left in place
  AND deliberately NOT restyled to cream-200, because making it look like a panel footer would
  encode a similarity that is not there. **Recorded in source with the reasoning so the next audit
  does not re-flag it**: this arc has twice found a hazard right about a cause and wrong about a
  cure, and an unrecorded correct-but-unusual position is how a third one starts.
  **THE EXTRACTION IS A REAL PR AND NOT THIS ONE.** Six panels now share the header string
  verbatim and five share the footer string — #199's `inputCls` shape exactly. **NAMED TRIGGER,
  not a condition that may never fire: the next time a panel header or footer needs CHANGING, it
  gets extracted rather than edited in six places.**
  **E6 DERIVES THE ENTRY-PANEL SET** (any studio component calling `useListItem` that renders a
  panel `<section>`) rather than listing it, with a guard against the vacuous pass, and asserts no
  entry panel carries an ink band. Three mutations bite, including the red-flag case.
- **PR 1 · the label scale — two steps, named by role** →1495 (`studio-labels` 9, net-new suite).
  **BRIEFED AS A CONSISTENCY SWEEP; IT IS AN ACCESSIBILITY FIX.** Measured, `text-ink-400` reads
  **3.49 / 3.33 / 3.02** on cream-50 / cream-100 / cream-200, and 12px is not WCAG large text
  (that is 24px, or 18.66px bold), so the 4.5 floor applies and **every ad-hoc studio label was
  below AA**. `text-ink-600` reads 7.42 / 7.06 / 6.42. Verified live: field labels went 3.33 →
  **7.06**, and every label on screen now clears AA.
  **THREE PREMISE CORRECTIONS, ALL FOUND BY MEASURING RATHER THAN CITING:**
  **(1) THERE WERE NEVER THREE SIZES.** `--text-eyebrow` is `0.75rem`, which at the 16px root is
  exactly 12px, so `text-eyebrow` and `text-[12px]` render IDENTICALLY — browser-proven. The
  three source spellings are two rendered sizes, 12px and 10px. **So no site shrank, and the
  size decision the brief asked for did not exist.** The PR is a weight change, a colour fix and
  a two-step scale — not a resize.
  **(2) `labelCls` IS 12px, NOT 11px.** Its own doc comment said 11px; #218's site-wide font bump
  moved it and left the prose behind. Comment fixed here — a stale measurement in a comment is
  what made #211's placeholder claim quietly falser.
  **(3) "#210 MEASURED ink-600 AT 4.78 ON cream-200" IS THE WRONG TOKEN.** ink-600 measures
  **6.42** there; 4.78 is `text-text-subtle`. A correct number attached to the wrong token, the
  same family as #211's three findings.
  **THE DEPTH AXIS WAS REAL, AND IT DECIDED THE EXPORT SHAPE.** Six of the eleven 10px sites sat
  inside the IDENTICAL container — `rounded-control + border + bg-cream-100 + p-3`, a nested card
  — so the smaller step is a hierarchy somebody built, not drift. Two more (`HeroEditPanel`'s tab
  labels) were 10px in a plain tabpanel with no card at all, and moved UP to 12px. **That they
  separated cleanly is the evidence the axis is real.** So the answer is TWO exports named by
  ROLE, #199's `inputCls`/`inputClsMd` precedent exactly: `labelCls` (field) and `groupLabelCls`
  (nested-card group head). **The fourth time by-role naming has been the right answer** in this
  arc, after listbox-vs-select, three-pane-vs-list-detail and the section headers.
  **The group step keeps its 10px AND its 400 weight — only the colour moved** — so clearing the
  contrast did not flatten the hierarchy the two steps exist to hold.
  **45 SITES SWEPT ACROSS 15 FILES**; four survive by ROLE and each is recognised by its own
  shape rather than by file and line, so the exemption cannot widen into "anything left over": a
  badge (`rounded-full`, 7.10), nav chrome (`StudioSidebar`, 5.45 on the dark rail), an accent
  ordinal (`text-accent-600`, 6.25) — all three ABOVE AA — and the board card's authored
  `section.eyebrow`. **That last one measures 3.49 and is recorded in source WITH the number
  rather than fixed**, because recolouring a preview of AUTHORED CONTENT is a design decision,
  not a chrome repaint, and PR 7 restructures that board. One more was found mid-sweep and fixed
  colour-only: the canvas help line, also 3.49, which keeps its own string because it is a
  sentence and bold-700 would shout.
  **THE GATE DERIVES THE GROUP RULE RATHER THAN LISTING THE SIX** — `studio-labels` B1 finds the
  nested-card signature in source and requires `groupLabelCls` inside it, the `studio-cascade`
  shape, so a seventh nested card inherits the rule and a hand-written heading fails on arrival.
  Four mutations confirm it bites. **The token is untouched**: `--text-eyebrow` is read by 16
  non-studio files, D1/D2 pin it and the one public eyebrow, and **zero public files changed**.
- **PR 2 · well = ground, six sites** →1486 (no net-new; a relational repaint). **THIS APPLIED A
  DOCUMENTED RULE RATHER THAN MAKING ONE.** The note at `blocks/fields.tsx:151-166` named this
  defect class before any of these six shipped — "an input reads as a well because it is one step
  LIGHTER than the surface holding it, never because it is a particular colour" — and the
  investigation found all six by FOLLOWING that note, not by inspection.
  **cream-50 IS THE LADDER'S BOTTOM STEP, so every fix moved the GROUND, never the input.** That
  is the difference from the three times this arc got it wrong by reaching for a fixed value
  (#205's input colour, the item-3 recommendation, PR B's fill).
  **SIX NAMED SITES ARE FIVE CODE CHANGES**, which is itself the finding: `StudioModal` is shared
  by the projects index, the blog index and experience, so one line fixed three of the six.
  Measured before → after, per site, sanity pair (21:1) first each time:

  | site | before | after |
  |---|---|---|
  | `StudioModal` panel (×3 modals) | 1.00 | **1.05** |
  | `SkillsEditor` CategoryPanel | 1.00 | **1.05** (all 6 of its inputs) |
  | `SectionsEditPanel` Selected rail | 1.00 **twice** | **1.05** |
  | `BlogIndex` search | 1.00 | **1.05** |
  | `LoginForm` password | 1.00 | **1.05** |

  **TWO SITES NEEDED A DIFFERENT ACTION, AND THAT IS THE RULE WORKING RATHER THAN AN EXCEPTION.**
  `BlogIndex`'s search sat on the bare page with NO panel between it and `main`, so there was no
  ground to recolour — the fix had to CREATE one (a cream-100 toolbar), which matches the
  precedent next door: `BlogPostList`'s identical search reads correctly only because the rail
  holding it is darker. And `LoginForm` needed TWO steps, because moving the body to cream-100
  alone would have made it identical to its cream-100 header — one same-on-same traded for
  another — so the header moved to cream-200 and the panel now reads chrome → surface → well,
  verified monotonic (243,232,216 < 251,243,231 < 254,249,241).
  **THE SELECTED RAIL WAS A DOUBLE COLLISION**, not one: the rail was cream-50 on the cream-50
  body section (so the rail itself was invisible) AND its textarea was cream-50 on the cream-50
  rail. **It is coupled to a defect PR 7 owns** — `SectionsEditPanel:886` inverts the ladder
  (cream-50 body, cream-100 header, the mirror of its siblings). Deliberately NOT fixed here: its
  other half is a nested 12px-panel-inside-a-12px-panel, which is structure, and folding structure
  into a colour sweep is how a repaint becomes a redesign. **A note in the source tells PR 7 that
  when it rights the body to cream-100 the rail must move to cream-200 in the same change**, or
  the collision returns.
  **NOT A SEVENTH SITE, CONFIRMED AGAINST #206:** the readonly displays
  (`ExperienceEditPanel:136`, and `ProjectsEditPanel:273` — there are TWO, not one) are cream-200
  on cream-100, DARKER than their ground. That is the READONLY-DISPLAY convention, and the field's
  own comment records that the ladder is exactly why it moved cream-100 → cream-200. Left alone.
- **PR 4 · hazard 17 closed, and the consistency investigation recorded** →1486 (no net-new; a
  correctness fix and documentation). **The studio consistency arc opens here.** An investigation
  across all nine dashboard pages plus login **refuted the working claim** that the case-study
  editor was the only page needing structural work — see the C-1 correction in
  `studio-case-study.html`. The ink chrome language never left the blog editor: two ink bands in
  the whole studio, both in one file, pinned at exactly 2; `labelCls` against 36 ad-hoc eyebrows
  in 14 files; well-equals-ground on six surfaces. **Skills is structural on its own.** So the
  work is TWO TRACKS, and the divergences are systemic rather than per-page, which is what keeps
  it tractable.
  **THIS PR IS THE BLOCKER, WHICH IS WHY IT WENT FIRST**: hazard 17's `rules-of-hooks` violation
  is inert only because `ProjectsEditPanel` mounts outside any list shell — precisely what the
  three-pane editor changes. Open since #195. See hazard 17 for the two-part fix and why moving
  the early return ALONE would have traded a lint error for a fetch regression.
  **FOUR CONTRACT CLAIMS CORRECTED, beside what they replace** (the `studio-ink-chrome.html`
  convention): the scope claim; "a collapsible-group pattern already exists" (it does not —
  `DisclosureGroup` is FIELD-level, one-way and sticky, with no `aria-expanded` and no
  `<details>` anywhere in `components/studio`, so the group collapse must be BUILT); "meta facts
  stack at 320" (they do not — `grid-cols-2` is unprefixed, so the height is identical at 794 and
  320 and the children squeeze 367px → 130px); and "parity.mjs already covers it" (it is a
  paste-into-console string in `NOT_RUNNABLE`, no assertions, no exit code).
  **THE MEASUREMENT THAT CHANGES THE DESIGN:** a section's Content tab is 2559px at 794px wide
  and 2597px at 320px — **narrowing costs 38px, 1.5%**. Against ~574px of available height that
  is ~4.5 screens either way. **The 4.5-screen scroll exists TODAY at full width; width is not
  the driver, field count is.** So the inspector-width debate is the wrong argument, a wider
  case-study inspector is not the fix, and the collapsible group is a hard requirement rather
  than optional polish. Also recorded: hazard 28 (`boat-crest` is hand-built with no sections
  board, so it is the wrong subject for editor measurements — it has already cost parity
  coverage), and the by-role section-header rule in LOCKED DECISIONS.
- **PR D — topic as a closed set** →1456. `topic` was free text because no set was declared; PR D
  declared `BLOG_TOPICS` (the three topics the posts already carry) and enforced it in two places,
  each a different question. The sanitizer refuses a non-member at SAVE while still allowing empty
  (a draft may be unset); `validate-blog-post` REQUIRES a member at PUBLISH, mirroring `alt` and
  the title, the one gate an author cannot walk past. The editor became a `SelectField` over the
  const (empty option "No topic yet") replacing the open datalist. Zero migration, PROVEN — F7
  reads the real posts and asserts each published one is already a member. The validator takes the
  set as an ARGUMENT (`publish-site-settings` passes `BLOG_TOPICS`) rather than importing it, which
  keeps it execution-testable — a relative value import would have broken every suite that runs it,
  the constraint documented at `validate-draft-sections`. The empty-topic OG and head branches stay
  reachable for drafts. Owner's calls: the three existing topics (not an invented superset), and
  required-to-publish (confirming existing practice, like the lint gate).
- **hazard 24 CLOSED — the radius inversion removed byte-identically, and gated** →1446. The two
  public `rounded-2xl` consumers reached Tailwind's default 1rem (the project's `@theme` ramp stops
  at xl and never declares 2xl), so 2xl rendered EQUAL to lg and BELOW xl. Measured, they split:
  `SiteFooter`'s panel showed a real 16px corner and was repointed to `rounded-lg` (the 1rem token
  it already rendered — 16px before and after); the blog `FeaturedCard`'s was inert (16px on a
  transparent, non-clipping grid) and was DELETED, the honest zero-pixel form. Owner chose Option 1
  (byte-identical) over re-adding the dropped step or growing the footer on an inferred intent.
  `radius-scale` (net-new, whole-repo, 3 assertions) is the durable output: the declared ramp is
  strictly increasing, and no consumer uses a step `@theme` does not declare — the `studio-tokens`
  shape generalised from colour to radius, catching the next `rounded-3xl` on arrival, at the site,
  by name. Six mutations confirm it bites (a re-added 2xl, a 3xl, a below-xl redeclare, a deliberate
  re-add). The fourth derive-from-source gate this arc built.
- **hazard 27 CLOSED — the on-ink contrasts run in CI, not only by hand** →1443. `studio-type`'s
  `ON_INK` table (#212) had a pass/fail harness, but `studio-type` is a browser-console script and
  is still not CI-runnable, so CI ran none of those assertions. `studio-ink-contrast` (net-new,
  33 assertions) removes the browser dependency: it reproduces oklch to sRGB, sRGB alpha-over and
  WCAG contrast in node, computes every non-pointer `ON_INK` ratio from the SAME tokens
  (globals.css) and `lg:` utilities (the four chrome components) the screen renders from, and
  asserts each against this table's floors — importing `ON_INK` so there is one table. **Trusted
  the way `studio-type` is**: a sanity pair first (white on black is 21, the converter lands
  ink-950 on 15,7,3 and cream-50 on 254,249,241) and a cross-check that every computed ratio is
  within 0.4 of the browser-measured oracle (they reproduce to within 0.12; save-status and the
  View-site border land EXACTLY). Ten of twelve rows computed; the two hover rows need a pointer
  node cannot supply and stay by-hand, with the gate asserting the exclusion is exactly those two.
  Six mutations bite (well-alpha drift, foreground-token swap, token retune, broken L each fail a
  floor or identity; a renamed class throws). The third derive-from-source gate this arc built,
  after `studio-cascade` and `studio-tokens`.
- **hazard 23 CLOSED — the 40 `text-ink-500` sites realised, not deleted** →1410. The phantom's
  other half (the `ink-700` half was deleted in #210) is done, and done the opposite way: these
  40 always MEANT muted and never were, so each was re-pointed to the muted token its own
  untouched neighbour already uses — **13 icon buttons → `text-ink-400`** (`ListDetailLayout`),
  **3 tabs and secondary controls → `text-ink-600`** (`SegmentedToggle`), **24 badges, hints and
  readonly fields → `text-text-subtle`** (`SkillsEditor`). **No value invented; the per-family
  neighbour proof ran with zero mismatches.** Each target was checked on its ACTUAL ground —
  `text-text-subtle` clears AA text down to **4.78 on cream-200** (the readonly field's worst
  case), `text-ink-600` at **6.42**, `text-ink-400` clears the **3.0** icon floor at **3.02**,
  matching the working icon buttons exactly. Rendered proof: `text-text-subtle` paints
  **109,100,93**, not the inherited ink-950 (**21,17,13**) it had painted for its whole life.
  **`studio-tokens` B2 flipped from pinning 40 to asserting 0** and mutation-tested (it fails the
  day any `text-ink-500` returns). A revalue, not net-new, so ralph holds at 1410.
- **#219 the border-race gate** →1410. Hazard 26 (a border-colour shorthand racing a per-side
  longhand on one element, order-decided, invisible to every existing gate) is now caught by
  `studio-border-race`, its own suite because the mechanism is utility-vs-utility, not the
  unlayered-vs-layered one `studio-cascade` covers. **It found two LIVE races PR B had missed**
  — the block strip and the blog rail both kept `border-ink-950/12` (shorthand) racing the
  accent bar on the left edge; PR B fixed only the ListDetailLayout row. Both moved to
  `border-b-ink-950/12`; render verified identical, now deterministic. The gate itself nearly
  lied twice — blind to `border-white/24` (base colour with opacity), and a false positive on
  array-style ternaries — both fixed and mutation-tested before trusting it. The one public
  instance (`ContactSection`'s spinner, the same idiom used deliberately) is reported, not
  swept — the gate is studio-scoped.
- **#218** the +1px font bump, split resolved to 14 →1402. A clean site-wide +1px type bump (108
  one-line `text-[Npx]` swaps across 43 files) that collided with three assertions, plus the
  owner's decision to resolve the deferred 13/14 `inputCls`/`inputClsMd` split to **14px**. The
  fix RECONCILED the assertions to the new sizes rather than reverting the bump: `studio-ink` E4
  repinned the eyebrow literal 11→12, and `studio-nav-active` G5/G6 flipped from "the two differ
  by the font size" to "the two are now IDENTICAL at 14px." Zero net-new. **The deploy-blocking
  Ralph failure was this collision**, not a bad bump — main had reverted only #217 (the bump),
  leaving the editable-title feature (#216) live; the branch was reconciled and re-merged.
- **#216** the editable blog title →1402. **The headline is a FALSE CLAIM, not a feature.**
  STATE and five source comments said "title IS the slug"; measured, the slug is the FILENAME,
  `title` is a frontmatter key, `slugify` runs once at create and nothing re-derives — a title
  patch is STRUCTURALLY UNABLE to move the file. So the read-only block was a POLICY nobody
  re-derived (7th re-derive instance, first to hide a feature). **The change: delete one `if`
  in `blog-format-core.ts`, accept title like `dek`; no schema field, no migration, no
  create-flow change.** The slug becomes the read-only chip; publish requires a non-empty title
  (`validate-blog-post`, mirroring `alt`).
  **STEP 1 WAS AN ISOLATION TEST THAT COULD HAVE KILLED IT**: hand-edited one post's title to
  mismatch its filename, built, confirmed the reader tolerates it, the article renders the
  edited title, and `generateStaticParams` still emits the ORIGINAL slug. It passed, so step 2
  proceeded.
  **THE INVESTIGATION'S EMPTY-CASE CLAIM WAS ITSELF WRONG, caught by G2**: `resolveSlugField`
  fell back only on an ABSENT key, returning `""` for a blank string. Fixed to fall back on a
  BLANK value too (both mirror copies), defense-in-depth behind the publish gate. Experience
  and projects carry the same false "renames the file" claim — measured false — but left
  untouched, a per-collection decision deliberately NOT swept.
  **Public DOM byte-identical** modulo the per-build id (no post data edited; `resolveSlugField`
  returns the same for every non-blank title).
- **#215** the logo and the View site hover →1385. Three small chrome items, and **the contract
  check split them two ways**.
  **THE LOGO IS AN IMPLEMENTATION GAP**, verified in the file rather than taken on trust:
  `.logo .mark { width:30px; height:30px }` and `.logo b { font-size:20px; letter-spacing:-.01em }`
  are the contract's own values, and the app shipped **24×24 and 17px**. Now 30×30 and 20px.
  **The radius takes the CARD step (8px), not the contract's 7px** — 7 is not a value the scale
  has, and the scale supersedes the file exactly as it did for its 2px input and 3px button
  radii, all three predating #207.
  **MEASURED, THE HEADER ROW MOVED**: 41.5 → 46px, because a 30px mark in a row built for 24
  changes it. Expected and reported rather than discovered later. The wordmark's contrast is
  **unchanged at 19.04** — re-measured rather than assumed, because size participates in
  legibility even when colour has not moved.
  **THE HOVER IS A DEPARTURE FROM THE CONTRACT, NOT A CORRECTION TO IT.** `.btn.ghost:hover` is
  `border-color: accent; color: accent`, drawn for a cream bar — and measured, **accent on the
  ink bar reads 3.88:1**, above the 3.0 UI floor. The contract's hover transfers and works; a
  different treatment was chosen over it, so the file is not wrong and this is not correction
  eighteen.
  **TWO THINGS THE REQUEST COULD NOT HAVE ANTICIPATED.** A light border on a light fill is
  **1.00:1** against it — it extends the fill and delineates nothing, so no `hover:border-*`
  companion was added; adding a class known to render nothing is worse than the ones this arc
  has spent PRs deleting. And **`hover:text-*` on that anchor would have been DEAD** — hazard 22
  defeats a hover colour exactly as it defeats a base one, and `hover:text-accent-500` had
  already been removed from THAT SAME ELEMENT for it. The label moved into a span so
  `group-hover` could land; measured hovered, the text composites to ink-950 at **19.04:1**
  against the fill.
  **AND THE HARNESS ADMITS WHAT IT CANNOT DO.** `:hover` is not settable from script, so
  `studio-type` reports the two hover rows as **NOT MEASURED** rather than passing them. A gate
  claiming a pass it never performed is worse than one that names the gap.
- **#214** the ink L, one colour at last →1385. The owner reported the whole topbar row as
  mismatched; **four of the six items were downstream of C-9 and two were already correct** —
  the bar was always 65px and #213 had taken the button to 40. **The row was mismatched for a
  reason none of the six named**: the two halves of the L were different inks — sidebar solid
  `15,7,3`, topbar ink/85 over cream at `51,43,39`, **1.44:1 apart at the corner where they
  meet** — and its two edges were different hairlines (1.58:1) despite carrying the SAME
  declared value, differing only because their grounds did.
  **A CONTRACT COMPARISON COULD NEVER HAVE FOUND EITHER**, because the contract has no ink
  chrome to compare against. Both now 1.00.
  **THE FROST WAS REAL AND WAS GIVEN UP DELIBERATELY.** #165 built `bg-ink-950/85` +
  `backdrop-blur` so "content scrolls under the blur", and measured it was STILL LIVE — on
  `/studio/settings` at 600px, real content passes beneath. But **ink/85 composites to 51,43,39
  only by sitting over cream, so no alpha below 1.0 reaches the sidebar's 15,7,3**: the frost
  and the L match are mutually exclusive, not a trade to tune. The L won — it is chrome, on
  every page, visible at rest — and the frost is inert on the three-pane editors, which is
  where the mismatch was noticed. **The cost is real: four page-scrolling surfaces lose it, and
  restoring it means reopening the L.** `backdrop-blur` went with it at `lg` only; below `lg`
  the bar is still cream and still frosts.
  **HAZARD 26 WAS FOUND LIVE ON MAIN** — `StudioSidebar` carried `lg:border-ink-950/12
lg:border-white/12` on one element. Measured, white/12 won by sheet order and the ink class
  was dead, so the render was right BY LUCK. Contract correction **C-17**.
- **#213** the topbar button and the canvas bar →1385. Two fidelity gaps the owner spotted after
  the arc closed, and **the first time in this arc the CONTRACT WAS RIGHT AND THE BUILD WAS
  WRONG ON BOTH COUNTS** — no correction seventeen.
  **THE TOPBAR'S GROUND WAS NOT THE GAP.** Its cream is C-9 working exactly as intended, so the
  answer there was no change. The gap was geometry the reversal never covered: the contract sets
  `.btn` and `.search input` to **40px each so they align on one row**, and #211 raised the
  search to 40 without touching the button, leaving them 4px apart. Now both 40.
  **THE 55px CLAIM WAS TRUE, AND MY FIRST MEASUREMENT OF IT WAS NOT.** Measured on the contract
  file rather than read off its CSS: an initial probe said 58 because it caught the row
  mid-layout with the title box at 35px; settled, it is **55 = 11 + 32 + 11 + 1**, the tallest
  child being the button. The canvas bar was 44.3 and is now 55, its button 27.3 → 32, its title
  13/400 → 13.5/500, its button 400 → **600 — an #208 miss**, that sweep having matched on
  `text-[12px]` while this button is 11.5px.
  **TWO THINGS THAT LOOKED LIKE GAPS AND WERE NOT**: the contract's `.cv-bar` sets **no
  background at all**, so the app's cream-50 is not a mismatch; and its `.back` button is absent
  from the app correctly, because `ThreePaneShell`'s collapse rail already does that job and a
  second control for one function is worse than none.
- **#212** studio-type asserts its on-ink ratios (`3623f0c`) →1385, NARROWING hazard 27 (it gave
  the by-hand suite a harness; CI still ran none of it — fully closed later by `studio-ink-contrast`)
- **#210** the phantom tokens deleted and the class gated (`8ae96ba`) →1385
- **#211** the card image (`beba883`) →1385, no net-new assertions. Fidelity item 4, the last
  one that is LAYOUT — and **the item that closed all eleven**. Three passes.

  **PASS 1 — `ImageThumb` becomes a plate.** The 36px chip capped by HEIGHT at 160 so it stays
  a preview: a `w-full` plate measured **941×1255px** in the wide settings panel, which the
  320px inspector had hidden. Aspect derived per call site from the PUBLIC renderer; the
  settings portrait takes a stated 3:4 because its public column gives it no ratio at all.
  Correction **C-16**.

  **PASS 2 — THE MIS-MAPPING, AND IT WAS FOUND BY THE OWNER'S SCREENSHOT, NOT BY REVIEW.**
  The contract's `.thumb` sits under `<label>Card image</label>` in the POST section with the
  hint "the article hero and the card thumbnail" — **that is `HeroImageField`**. `ImageThumb`
  serves `BlockImageField` (inside a BLOCK's form, under BODY) and `SettingsPhotoField`
  (another page entirely). **Item 4's investigation mapped the rule to the wrong component**, so
  pass 1 improved one the contract was not specifying and left the specified one untouched.
  **Pass 1 stands on its own merits** — `ImageThumb`'s own header says the thumb IS the
  identification, and a 36px chip failed at that regardless of what the contract described —
  **and both halves are now done.**
  **NOTHING IN THE REPO COULD HAVE CAUGHT THIS.** Every gate checks that the code does what the
  code says; none checks that the code implements the rule someone thinks it implements. A
  contract written as a mockup does not name its components, so **"which component does this
  rule describe" is itself a claim to verify** — and it was verified only because the owner
  looked at a screenshot and asked.
  Same pass: the Post band's SaveIndicator moved INSIDE the ink bar (a #205 miss — the Body
  band always had its own inside, measured 10.64:1 on ink), and `.rowbtns` went inline.

  **PASS 3 — the topbar search, and a defect the screenshot also surfaced.**
  **TWO "View live" ANCHORS, 59px APART, WITH IDENTICAL ACCESSIBLE NAMES AND NEITHER CARRYING
  AN `aria-label`** — one to `/` (the site), one to `/blog/<slug>` (the post). Not a duplicate
  render, not an overlay: two destinations behind one name, and a screen reader announced it
  twice identically. **#200's class again** — a control that does not say what its object is.
  Now **"View site"** and **"View post"**.
  The search carried the contract's INTENT onto ink rather than its values (C-9 resolved):
  well `white/5` **1.16 → white/12 1.45**, border **1.45 → 1.98**, placeholder, magnifier and
  kbd `ink-400` **3.27 → ink-200 5.08**, height 38.5 → 40, font 13 → 13.5.

- **#209** the selection language (`2488500`) →1379. Items 1 and 2, the last of the eleven that is paint.
  ONE language on three surfaces — **ground + 1 step, plus an identical 3px accent left bar**.
  **The measurement is the headline**: every cream step separates by 1.05–1.19 and the accent
  tint it replaces was 1.15, inside that same band, so **the fill was never the signal** — which
  explains the original complaint rather than merely fixing it. The bar reads 3.43–4.48.
  **#167 is rewritten, not overwritten**: its concern was right and the tint was half a remedy.
  Both accent elements it protected survive, measured at 6.00:1 and 78px clear of the bar.
  Correction **C-15**. Two assertions were killed by mutation and rewritten to parse ternary
  branches from comment-stripped source — one had been matching its own explanatory comment.

---

## WHAT'S NEXT

**THE STUDIO CONSISTENCY ARC IS CLOSED — EIGHT PRs, TWO TRACKS, ALL SHIPPED.** **ralph 1486 →
1541 across the arc** (1193 → 1541 is the span since #199 and includes the ink-chrome arc, the
hazard closures and PR D — see the log). It opened because the consistency investigation refuted
the assumption that the studio was finished except for one page, and it ends with that page
rebuilt and the sweep complete.

**WHAT EACH PR SETTLED.**

*Track 1 — the consistency sweep, each shipping alone.*
- **#226 · the hooks blocker.** Hazard 17 closed. The `rules-of-hooks` disable was latent, never
  active, and would have become a crash the moment `ProjectsEditPanel` entered a list shell —
  which is what Track 2 does. It gated everything after it.
- **#227 · well = ground, six sites.** All 1.00 → 1.05, measured per site. **The rule is
  RELATIONAL**, not a value: a well is one step off whatever it sits on.
- **#228 · the label scale.** Briefed as a tidy-up, shipped as an ACCESSIBILITY fix — 45 sites,
  ink-400 (3.02–3.49, below AA) → ink-600 (6.42–7.42). Two exports named by role. **There were
  never three sizes.**
- **#229 · section headers by role.** Ink band for inspector panes, cream-200 bar for entry
  panels. The band count stayed 2, as it had to.

*Track 2 — the case-study editor, sequential.*
- **#231 · the shell's seams.** Briefed as two aria-labels; it was three, and the third — the
  shell reading blog's `FIT_THRESHOLD_PX` directly — was the one that would have handed a second
  consumer the wrong breakpoint in silence.
- **#230 · the scale floor.** 50%, threshold 1460, collapsed floor 1222, all derived.
- **#232 + #233 · the three-pane editor.** Five stacked navigators became one `selection` value
  and a rail | canvas | inspector shell. **#233's headline is that the natural composition is the
  wrong one** — `{showBoard ? <Board/> : <Shell/>}` destroys every mounted editor and looks like
  it worked.
- **#234 · the group collapse.** The scroll fix #233 explicitly did not deliver.

**THE ARC'S OWN LESSON IS IN THE WORKING RULES**, because it is more reusable than any of the
eight: every premise written once and trusted later turned out wrong when re-measured, six times,
all caught by re-deriving and none by a gate — and the gates that survived are the ones that
derive from source rather than pinning an instance.

**THE CASE-STUDY EDITOR'S NEW SHAPE.** Five stacked navigators in one column → a three-pane
shell. Worst section **3.03 → 1.78 screens**; sections fitting one screen **2 of 14 → 8 of 14**.
The saving is width-independent, which is the third confirmation that field count rather than
pane width drives the scroll.

**ONE NAMED TRIGGER REMAINS OPEN. The first two are closed, see below. Neither closure needed the
remedy its trigger named, which is itself the pattern.**
1. ~~**`matchMedia` → a ResizeObserver on the shell.**~~ — **CLOSED as #235, and NOT by the
   remedy this trigger named.** See the new working rule: measuring the shell is circular. The
   fix is `usePageWidthMin`, measuring `documentElement`'s box — the page the layout is handed.
   **No constant was inflated and none changed**, because they were page-space sums already; the
   canvas gets exactly 640 at page 1460 and blog's prose exactly 746 at page 1614.
   **One constant WAS re-derived, for a different reason:** `CS_COLLAPSED_FLOOR_PX` 1222 → 1223,
   because a collapsed list pane is `w-0 border-transparent` and a transparent border still
   occupies its 1px. That is correcting a term, not padding a total.
2. ~~**Whether the case-study inspector should grow banded heads.**~~ — **DECIDED: NO (#238),
   and the reason recorded for it was wrong.** E5 had said the inspector "has no section HEADS to
   band". Measured, it has FOURTEEN. Right conclusion, wrong reason — the arc's own shape again.
   **A BAND DIVIDES CO-VISIBLE REGIONS.** The blog inspector holds two `<section>` siblings on
   screen together, "Post" at 924px and "Body · 7" at 421px, and the band says where one ends and
   the next begins. The case-study inspector's 14 heads are ALTERNATIVES — one visible, thirteen
   mounted and `hidden` — so a band would divide nothing from nothing.
   **AND THE JOB IS ALREADY DONE BY THE RAIL.** What blog does with two bands in one scrolling
   pane, the case study does with a list pane. Band and rail are the same affordance at different
   scales; PR 7 chose the rail.
   **THE THIRD ARGUMENT IS THAT IT WOULD MAKE THINGS WORSE.** The selected section's name is
   already on screen three times — rail row 13.5/500, canvas bar 13.5/500, inspector `<h3>`
   12/600. Banding the inspector's copy would make the most redundant instance the loudest.
   **The by-role rule is UNCHANGED**: inspector pane → ink band still holds, for an inspector with
   co-visible regions to separate. E5 now pins the property the decision rests on, so if two
   section editors ever become co-visible the gate fails and the question genuinely reopens.
3. **`hidden="until-found"`.** Ctrl-F will not open a folded row. Named in `CollapsibleGroup`'s
   header. Revisit when React supports it, or when an author reports a search that should have
   found something.

**THE ARC, IN ORDER — NOW A RECORD RATHER THAN A PLAN. Track 1 shipped independently of the
redesign; Track 2 was sequential. Kept struck-through rather than deleted, so what each PR was
BRIEFED as stays readable beside what it turned out to be — which is where most of this arc's
findings came from.**

**Track 1 — the consistency sweep (each PR ships alone, in any order).**
- ~~**PR 4 · the hooks blocker**~~ — **SHIPPED.** Hazard 17 closed; it gates all of Track 2.
- ~~**PR 1 · THE LABEL TREATMENT.**~~ — **SHIPPED, and it was an ACCESSIBILITY fix rather than
  the tidy-up it was briefed as.** Two steps named by role (`labelCls` / `groupLabelCls`), 45
  sites across 15 files, ink-400 (3.02–3.49, below AA) → ink-600 (6.42–7.42). There were never
  three sizes — `--text-eyebrow` is 12px and renders identically to `text-[12px]` — so nothing
  shrank. See its log entry. *Left inconsistent after:* section headers (PR 3).
- ~~**PR 2 · WELL = GROUND, SIX SITES.**~~ — **SHIPPED.** Six named sites, five code changes
  (`StudioModal` covers three modals). All 1.00 → 1.05, measured per site. See its log entry for
  the two that needed a different action, and for the Selected rail's coupling to PR 7.
  *Left inconsistent after:* section headers, and `SectionsEditPanel:886`'s inversion (PR 7).
- ~~**PR 3 · THE SECTION HEADERS.**~~ — **SHIPPED. TRACK 1 IS COMPLETE.** Ink band for inspector
  panes, cream-200 bar for entry panels; Skills gained the bar, ProjectsEditPanel its hairline.
  The band count stayed 2, as it had to. The footer finding reversed the brief — see the log
  entry. *Left inconsistent after:* nothing in Track 1.

**Track 2 — the case-study editor (sequential; each depends on the last).**
- ~~**PR 5 · EXTRACT `ThreePaneShell`'s TWO aria-labels.**~~ — **SHIPPED, and it was THREE things,
  not two.** The third — the shell reading blog's `FIT_THRESHOLD_PX` directly — was the one that
  would have handed a second consumer the wrong breakpoint. See its log entry.
- ~~**PR 6 · DERIVE THE CASE-STUDY THRESHOLD.**~~ — **SHIPPED. The floor is 50%, the threshold is
  1460 = 236 + 264 + 640 + 320, and the collapsed floor is 1222.** The owner chose against a
  rendered comparison at five floors. See its log entry for the reasoning and the numbers.
- ~~**PR 7 · THE THREE-PANE CASE-STUDY EDITOR.**~~ — **SHIPPED as #232 (foundation) + #233.**
  Split so the two prerequisites were verified against today's layout rather than one changing
  underneath them. It did state plainly that it does not improve the scroll. Reorder MOVED to the
  rail from the two surfaces that shared it; add stayed on the Board; remove stayed in the
  inspector. **The band count did NOT go 2 → 4** — see its log entry and E5.
- ~~**PR 8 · THE GROUP-LEVEL COLLAPSE, BUILT NOT REUSED.**~~ — **SHIPPED as #234. TRACK 2 IS
  COMPLETE, AND SO IS THE ARC.** `CollapsibleGroup` was built, not reused, exactly as the
  investigation's section G said it would have to be. **But the target was wrong and the
  measurement moved it**: the 4.5-screen figure was stale (#233 fixed most of it as a side
  effect; the real worst case was 3.03), and the contract's block-collapse default was a no-op on
  86% of the content. The height was in `ItemRows`. See its log entry, and C-18.

0. **ALL ELEVEN FIDELITY ITEMS ARE CLOSED, AND SO IS PR D.** ~~PR C~~ shipped as #211;
   ~~**PR D**~~ — topic as a closed set — shipped too (`BLOG_TOPICS`, enforced at save and
   required at publish; see its log entry). **The board is not empty, though — the consistency
   arc above replaced it**, and that arc exists because the investigation refuted the claim that
   the studio was finished except for the case-study editor.
   **THE GATE DEBT IS PAID: hazard 27 is CLOSED.** `studio-type`'s on-ink contrasts ran only by
   hand; `studio-ink-contrast` now recomputes every non-pointer `ON_INK` ratio statically from
   source and asserts it in CI, so on-ink work no longer depends on a human remembering to run a
   browser script. On-ink work is safe to do again.
   **HAZARDS 23 AND 24 ARE BOTH NOW CLOSED.**
   **23 — FULLY CLOSED.** The `ink-700` half was deleted in #210 (those 11 read correctly at
   full ink); the **40 `text-ink-500` sites** were re-pointed to the muted token each neighbour
   already used — 13 icon buttons to `text-ink-400`, 3 tabs to `text-ink-600`, 24 badges, hints
   and readonly fields to `text-text-subtle` — so the hazard closed by REALISING the muted intent
   the sites always carried rather than by deleting it. The follow-up did inherit the answer, not
   the question: every target matched a working neighbour, checked per-family (zero mismatches)
   and per-ground (down to 4.78 on cream-200). `studio-tokens` B2 now asserts the family is ZERO
   and fails if any `text-ink-500` returns.
   **24 — FULLY CLOSED, byte-identically.** The two public `rounded-2xl` sites reached Tailwind's
   default 1rem (below xl, equal to lg). The footer's real 16px corner was repointed to
   `rounded-lg` (the token it already rendered) and the blog card's inert one was deleted, so the
   public site did not move. `radius-scale` (whole-repo) now holds the declared ramp monotonic and
   fails any consumer of a step `@theme` does not declare — the `studio-tokens` shape for radii.
   Whether the footer should be ROUNDER is a separate design question, made by looking at it, not
   folded into the hazard fix.

**THE BLOG IS LAUNCHED. WHAT REMAINS IS CONTENT.**

1. **KEEP WRITING POSTS THROUGH `/studio`.** Still the highest-value work, but the reason has
   changed: real use has now closed owner-backlog items **9, 10 and 11** and produced **three
   defects no gate found** — hazard 20's blank canvas image, #201's silently dropped save, and
   #200's ambiguous Publish button. **THAT IS THE ARGUMENT FOR IT.** Every one was invisible to
   lint, tsc and 1264 assertions, and every one surfaced within minutes of an author actually
   using the editor. Item **7** (the three-pane editor in production) is the one still open,
   and it closes by looking rather than by building.
   **READ THE CONTENT DIFF BEFORE EACH PUBLISH** until hazard 13 has a real answer — a publish
   has already shipped a half-finished sentence once, and CI cannot tell one from a finished
   one.
2. **THREE ASSET UPLOADS, EACH ONE STUDIO ACTION AND ALL OF THEM CONTENT.** Highest value per
   minute of anything on this list.
   a. **`boat-crest`'s hero** — still the original 837KB, 2074×1058 PNG that never went through
   sharp. One /studio upload re-encodes it to webp at quality 80. Open since #160.
   b. **The three studio heroes are 320×200** into a 500px card slot, so they render soft.
   Re-upload at a larger size; the route downscales to a 2048 long edge and never enlarges.
   c. **Then remove `elevate-one-view` from `HERO_IMAGE_UNSUITABLE`** (hazard 21) — but LOOK at
   the card first. Its comment describes a 390×988 portrait that no longer exists, so the
   stopgap is stale either way; whether the mock still beats a 320×200 hero is a judgement.
3. ~~**DELETE THE `rules-of-hooks` DISABLE** (hazard 17).~~ — **DONE in PR 4.** It was the only
   follow-up carrying a latent correctness bug rather than a missing affordance, and the
   consistency arc is what made it urgent: `ProjectsEditPanel` would crash the moment it is
   placed in the list shell its own comment says it is built for, which is PR 7 exactly.
4. **Optional:** `/code-review ultra` over `fa08200`. #178, #180, #185, #187, #189, #190,
   #195, #197 and #198 were all self-reviewed, and #190 and #195 are the largest.
5. **THE CASE-STUDY CANVAS PREVIEW** — the same snapshot gap #202 closed for blog, and the
   emit half already landed, so it is seven `ImgSpecFields` arrows plus a map in
   `SectionsEditPanel` reusing `lib/studio/preview-map.ts` unchanged. See DEFERRED.
6. **Later:** a per-entry publish or a PublishBar diff preview (hazard 13, the one with a real
   incident behind it); migrate other studio pages to
   `ThreePaneShell`, extracting at the SECOND consumer; investigate why `boat-crest` yields
   zero parity pairs (hazard 10).

**THREE GATES NOW, NOT TWO.** `npm run lint` · `npm run typecheck` · `npm run ralph`. CI runs
lint and ralph; the Vercel build is what typechecks. A PR that reports "typecheck only" is now
under-reporting.

Ralph pilot remains validated for MECHANICAL, bounded work only. Design decisions and new
arcs stay human-gated, one at a time. Never auto-merge, never write main unattended.
