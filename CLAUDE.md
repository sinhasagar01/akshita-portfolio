# Portfolio Project

Read TASKS.md at the start of every session to check current build progress and open items before doing anything else.

## What we are building

A custom-coded portfolio site for a product designer, replacing a Framer template that has inconsistent design language and poor storytelling across pages. The site ships four case studies told as clear narratives, in one consistent light editorial design language, with a lightweight CMS dashboard for content updates.

## Four case studies at launch

- boAt Crest redesign, the hero. App rating rose from 2.3 to 4. The most complete story.
- Fosfor AI, the on-trend piece. An AI companion across three personas. Needs a real outcome at the close.
- Fosfor Data Profiling, the enterprise piece. Needs template copy stripped and metrics reframed.
- Elevate ONE View, the current role. Confidentiality-constrained, so narrative carries the weight.

## Case study narrative spine

Every case study follows this fixed eleven-section arc.

1. Hero. One italic thesis sentence with a meta line below it (role, type, platform, timeline).
2. Summary block. Product, Problem, Details, Solution, Result.
3. Impact. Three big numbers only.
4. Context. Company background and situation.
5. Problem. One sharp statement, often over a single bold image.
6. Goals and the North Star. What winning looks like.
7. Process and key insights. The method plus two or three numbered insights.
8. Solution reveal. One confident line and a brand visual.
9. Guided design tour. One screen or interaction per section, short title and two or three sentences.
10. Reflections and what comes next.
11. A warm closing line.

## Stack

- Framework: Next.js with the App Router and TypeScript
- Styling: Tailwind CSS
  - Tailwind v4 — never use class-[--var] bracket-bare syntax; it generates no CSS. Use bare theme utilities (text-accent-500, rounded-lg) generated from @theme, or [var(--x)] with the full var() if an arbitrary value is truly needed.
- Animation: Motion for component motion, Lenis for smooth scrolling, GSAP for heavier scroll choreography
- CMS: Keystatic supplies the content SCHEMA only (keystatic.config.ts drives the reader and the derived block-kind types). Its editing UI was retired; /studio is the sole editor. Do not re-add the Keystatic UI or @keystatic/next.
- Dashboard and editor: /studio, a custom editor that commits to a draft branch and publishes to main
- Images: stored in the repo, uploaded through /studio, optimized and served by Next.js image optimization
- Hosting: Vercel Hobby tier
- Type: free variable fonts

## Build sequence

Phases 0 to 5 are DONE. They are kept here because later work refers back to them.

- Phase 0: repo, Next.js, Tailwind, Vercel, domain, fonts, design tokens
- Phase 1: design system, layout primitives, motion and scroll baseline
- Phase 2: home page
- Phase 3: case study template wired to Keystatic, all spine block types built
- Phase 4: content pour and cleanup for all four case studies
- Phase 5: performance, accessibility, motion tuning, launch

What followed Phase 5, all shipped.

- The studio editor. Every content group edits inline at /studio, writing to a draft branch
  and publishing by merge to main.
- The blog. A second collection with its own schema, public pages and three pane editor. One
  post is published and the nav link is live.
- The inline canvas. Blog prose is edited in place at the public measure, so the canvas and
  the article render through the same components.
- The lint gate. ESLint runs in CI beside ralph, and the repo sits at zero problems.

The record of what shipped, in order and with its reasoning, is docs/STATE.md. Read that
rather than inferring history from this list.

## Production domain and hosting

The production domain is akshitas.com. The canonical host is www.akshitas.com. The apex akshitas.com redirects to the www host with a 308 configured in Vercel, and the www host is the primary.

Both `metadataBase` in `app/layout.tsx` and `NEXT_PUBLIC_SITE_URL` in `.env.local` must be set to `https://www.akshitas.com`. These two values must always point to the same host. Swapping one without the other causes the canonical URL and share image URLs to resolve against a host that Vercel then redirects away from. On Vercel, the production environment variable `NEXT_PUBLIC_SITE_URL` must also be set to `https://www.akshitas.com`.

## Open items

- The five experience descriptions are still empty. Write them or decide to drop the field. The
  decision is worth as much as the copy, and leaving it undecided is what has kept it open.
- Content. Writing posts through /studio is the highest value work left, and it exercises the
  editor paths that only a real author can reach.
- **⚠ THE DEAD UTILITIES ARE CLOSED — 92, NOT 58, AND TAKEN ONE PROPERTY AT A TIME.** This item said
  58 line-heights and one change. It was **92 across four properties and two tag groups**, and one
  diff containing 92 changes is a diff where nothing can be attributed. Shipped as four PRs: `<p>`
  max-width (18, every one narrowed, largest by 584px), `<h3>` font-weight (12), line-height (58,
  all honoured, 33/33 verified in the browser) and heading letter-spacing (4). **The unlayered
  element resets are now `html`, `h1,h2`, `h3..h6`, `img` and `a`; `p` has none left.**

  **⚠ TWO FINDINGS FROM IT THAT OUTLIVE THE WORK.** A cascade contest can have **three parties** —
  lifting the `h3` weight reset promoted `.case-study .font-display` rather than the utilities, and
  22 remain dead by that rule rather than by the reset. And `cascade-public` enumerated only tags
  that still HAD a reset, so lifting the last property made the element **vanish from the census**
  along with its shadowed utilities. Both are repaired; `S2` is the assertion that says so, and it
  held at 22 across every subsequent lift.

  **WHAT IS LEFT IS `color`: SIX `<a>` SITES, AND IT IS A DIFFERENT QUESTION.** The unlayered
  `a { color: inherit }` exists so links inherit their context, and `studio-cascade`'s premise rests
  on it. Lifting it is a new sequence, not the fifth step of this one.

- **Kaushan Script — DECIDED, KEPT. The wordmark stays; the inert class on the heading is gone.**
  The question was framed as debt left by the typography arc. It is not debt. **A wordmark in its own
  face is not an inconsistency — it is what a wordmark IS**, and a logo drawn in a display face beside
  headings in a serif is ordinary practice rather than a conflict. Two of the four live sites are the
  identity doing exactly that: `.logo-sig` pairs script "Akshita" with tracked-caps "SINGH" as a
  designed lockup, and the footer sets the full name at 42px above "PRODUCT DESIGNER" — **a signature
  sign-off, which is the one job a script face is unambiguously for.**

  ⚠ **AND THE PREMISE THAT MADE IT LOOK LIKE DEBT WAS ALREADY FALSE.** The record said the loudest
  cursive survived the arc untouched. Measured live, the home page's `h1` — the largest statement of
  the name on the site, and the page's top-level heading — **renders Source Serif**, because the
  unlayered `h1` rule beats a utility in `@layer utilities`. The cursive never held the primary slot.
  So the choice was never "script or serif for the identity"; the serif already had it, and Kaushan
  holds the mark and the signature.

  **What WAS real debt is fixed: `font-script` on that `h1` drew nothing and has been removed.** A
  class that asks for one face and draws another is a lie in the markup, and it survived only because
  the result looked right. `cascade-public`'s family-collision registry is now empty and zero is the
  assertion.

  The other cursive, Caveat in `AnnotatedImage.tsx`, is untouched and unexamined — a separate face
  with a separate job, and no evidence either way was gathered here.

Outcome numbers for Fosfor AI and Fosfor Data Profiling used to sit at the top of this list as the
one thing blocking finished copy. Both case studies now carry a statCards block with specific
figures, so that is no longer the blocker. Whether the figures are final is a judgement only the
owner can make, which is a different question from whether the fields are filled.

The light editorial direction was confirmed long ago and the tokens are set. That question is
closed.

## Conventions (must hold across sessions)

- **Tailwind v4 component styling.** The bracket-bare rule is in Stack above, do not restate it. Beyond it, model new components on `components/case-study`, which uses clean bare utilities. Do not copy `components/blocks` or `components/sections`, which still use the broken bracket-bare form. Hairlines use `border-ink-950/8` **on the public site and the canvas**, and `border-ink-950/12` **inside /studio**. That split is deliberate, not drift: the ink-chrome direction stepped the studio's hairlines up one notch because /8 read as accidental against harder chrome, and the canvas was held at /8 because it renders through the same components as the public article and must not move. **Apply /12 only under `components/studio` and `app/studio`.** Card surfaces use `bg-cream-50`, `bg-cream-100`, or `bg-cream-200`. The page canvas behind cards uses `bg-canvas`. Both `bg-canvas` and `border-border` are real tokens, the case-study convention just prefers the explicit ink and cream utilities for hairlines and card surfaces.

- **Mobile breakpoint is 1024px, Tailwind `lg`.** The whole site goes mobile at once at `lg`. globals.css switches at max-width 1023 and min-width 1024. Never default to `md` for a two-column to stacked transition.

- **/studio is the sole editor. It edits every content group inline and Keystatic's editing UI is retired.** Panels save to a draft branch through the owner-gated `/api/studio/save-draft` route (and the dedicated upload routes for images), and Publish merges the draft into main through `/api/studio/publish`, both in github mode only. Hero, About, Process, Links, and Skills each have a panel; Experience and Projects add, reorder and delete entries; the site photo, hero images, and block images upload through /studio. Do not add a new write surface without an explicit decision, and do not re-add the Keystatic UI.

- **A case study has ONE editor at ONE URL.** `/studio/projects` is the index (order, add, remove) and `/studio/projects/<slug>` is the editor, where details are a strip and the sections board and canvas own the width. The former `[slug]/body` route was a second copy of the editor that nothing linked to, and being unreachable is exactly how it drifted — it kept receiving fixes the real editor never got, until every section composed the wrong way. Do not reintroduce a second editing surface for the same content.

- **The blog is a SECOND COLLECTION with its own editor, and its shape is not the case study's.** `/studio/blog` is the index and `/studio/blog/<slug>` is the editor, following the one editor at one URL rule above. A post's body is a FLAT array named `blocks`, never the case study `sections` shape, so blog owns its own block registry and its own validator table while sharing the block layer underneath. The editor is THREE-PANE, a post list beside the canvas beside an inspector, built on `ThreePaneShell` with its geometry and collapse rule in `lib/studio/three-pane.ts`. It was full-width with no list rail until the owner reversed that, and the reasoning for the original choice is kept in `BlogIndex.tsx` rather than deleted, because a reversed decision whose reasoning is deleted leaves two contradictory rationales and no record of which won. It is still deliberately not ListDetailLayout, but for the other reason given there, that ListDetailLayout is a fixed two column grid eight panels share so a third column modifies all of them rather than reusing one. The three-pane shell stays blog-specific until a second consumer. The canvas holds the public measure exactly, `max-w-[68ch] px-6` on both sides, and that equality is the property the layout exists to protect. Image paths take a REQUIRED per collection base with no default, so a blog upload can never land in the projects directory. A post's `status` fails closed, so only an explicit published value reaches `/blog`. The public pages ship live but unlinked, and adding the nav link is the launch switch.

- **The canvas and the public page must render identically.** They share `SectionRenderer`, differing only in the `editable` and `noReveal` flags, and those flags may ADD affordances but must never move or resize a box. An editable-only wrapper element is the failure mode to avoid: put markers and overlays on an element that is already positioned. `/dev/parity/<slug>` plus `ralph/tests/parity.mjs` checks this — run it after touching anything under `components/case-study`.

- **Ask where a cost is EMITTED, not where the feature is USED.** A studio-only feature can charge
  every public page, and the two questions look identical until something is measured. `preload` on
  a font is declared per family but emitted from the ROOT layout, which wraps the public site — so
  giving the label face `preload: true` put a fifth font preload on every public page for a face no
  public page renders, while every consumer sat under the owner-gated `/studio`. Caught in the
  build at 4 -> 5, after a comment had already claimed the public count was unaffected.

  Same family as the CSS bundle being one chunk the public site downloads, which #274 measured at
  23.4% studio-only. **The consumers were scoped and the cost was not.** Scoping a feature does not
  scope what shipping it emits, and only a build diff can tell you which.

- **⚠ AND THE MIRROR OF THAT RULE, because half a rule is what caused the confusion twice.** "Ask where a cost is emitted" was written for a studio-only preload charging every public page. The colour census hit the same seam from the other side: it reads what is EMITTED and cannot tell who USES it, so two studio status dots and a studio gradient sat in the public bundle looking exactly like public colours. **Both directions give a wrong answer and neither is visible from where you are standing.** So the rule is not "use emission" or "use consumption" — it is **ASK WHICH ONE THE QUESTION IS ABOUT. Cost is an emission question. Themeability is a consumption question.** A bundle that merges the two is why they keep being confused, and the repair is to RESOLVE the consumer rather than exclude by lookup, because excluding buries the judgement inside a filter.

- **⚠ AN ASSERTION CAN PASS TRIVIALLY ON AN EMPTY SUBJECT *AND* KEEP PASSING IF THE SUBJECT ARRIVES
  WRONG.** `theme` G asserts every theme declares the same token SET. A token declared by NO theme
  satisfies it — and **a token declared by BOTH would satisfy it too.** So G would have gone on
  passing if a palette started overriding the invariant mark, because the moment both blocks
  declared it, they would AGREE. **Invariance is unrepresentable in that assertion's model**, which
  is why it needed its own category (section H) rather than an exception inside G.

  **SAME FAMILY AS `theme-contrast`'s MERGE**, found the same week: `{ ...CREAM, ...harbour }` made a
  missing override unrepresentable, and the gate reported agreement rather than absence. **Both gates
  were correct about what they modelled.** The question to ask of a gate is not "is it right" but
  **"can the property I care about even be expressed in what it looks at"** — and a category the
  vocabulary has no word for is one no gate is watching.

- **⚠ THE PALETTE'S EXTREMES ARE WHERE A THEME HAS LEAST TO SAY.** Near-black grounds differ between
  palettes by 25.1 and near-white by 16.8, and **neither hue is visible at any size.** So a surface
  whose ground lives at either end is one where theming buys nothing — and **that is a property of
  the GROUND, not of the surface's importance.**

  It decided two surfaces at once. The favicon sits on near-black, so a themed ground was
  imperceptible and neutral won at **16.49 against 6.52**; the PWA splash sits on near-white, so a
  neutral mark against a themed splash is **not unfinished — it is a pairing where the theme was
  never visible** (18.42 against 18.50). **The favicon ruling was therefore not a trade: the surface
  had nothing to trade.** Ask where a surface's ground sits before pricing a build that would theme
  it.

- **⚠ A REPORTED ARTEFACT IS A CLAIM ABOUT A STATE, AND THREE OF THEM WERE TRUE OF THE WRONG ONE.**
  A merge that never pushed, a ralph count taken before a `git checkout` reverted the change, and a
  card screenshot labelled "cream" that was built on harbour. **Each was true of something, and none
  was true of what it was offered as.**

  **THE REPAIR THAT WORKS IS PROVENANCE IN THE ARTEFACT ITSELF.** A capture verified by measuring its
  own dominant chromatic pixel cannot be mislabelled; a screenshot with a caption can. Prefer a
  measurement the artefact carries over an assertion made beside it — `upstream.mjs` does this for
  the repository, and the theme captures now do it for renders.

- **⚠ EVERY PLACE A TOKEN'S VALUE IS COPIED OUT OF CSS INTO JS NEEDS A COMPARISON**, because the copy
  is where the claim lives and the stylesheet is where the truth does. Two maps have now carried an
  unchecked claim of exactness — `THEME_SPLASH` ("resolved. Not an approximation") and `THEME_OG` —
  and `lib/og.tsx` carried three drifted constants beside comments naming their tokens. **The copy is
  forced** in each case: `ImageResponse` and a JSON manifest both render outside the document. So the
  duplication is allowed and the comparison is what allows it — `theme` section I and
  `token-claims.mjs`.

- **⚠ EXPLAINING A DELIMITER REQUIRES WRITING IT, AND WRITING IT IS THE DEFECT.** While documenting
  that `keystatic.config.ts`'s `path:` glob contains a slash-star that ralph's comment-stripper reads
  as an opener, **I wrote that sequence into the explanation twice** — once as a block comment whose
  closer terminated it early and turned the rest into a syntax error, once as a line comment whose
  opener re-paired with the glob and swallowed the schema. **Both times the note about the trap was
  the trap.**

  **Spell delimiters out** — "slash-star", `<star>` — in any comment describing them. And when a
  fix suggests itself, check it against the consumers first: blanking string bodies before stripping
  comments was written and **reverted**, because five assertions in that suite READ STRING CONTENTS.
  **A stripper serving consumers that care about strings cannot discard them**, so the trap is
  recorded with its trigger named rather than removed by a change that breaks its own suite.

- **⚠ A COMMENT NAMING A TOKEN IS A CLAIM, AND EVERY GATE HERE READS VALUES.** The claim lives in
  prose, which nothing reads, so the two drift while the comment goes on asserting equality.
  **Three instances, one mechanism:** `accent-400`'s comments called it load-bearing while nothing
  referenced it; the cursor's `#B5613C` was a near-copy at 23.6; `lib/og.tsx`'s
  `#C0673E // --color-accent-500` was 30.7 away and asserted equality outright.

  **⚠ ALL THREE WERE FOUND BY MEASURING SOMETHING ELSE**, never by looking — which is the argument
  for an instrument rather than for more care. `ralph/tests/token-claims.mjs` is it, and its first
  run found `lib/og.tsx` had **three** drifted constants rather than the one under investigation.

- **⚠ A SAFETY NET THAT RESTORES THE WRONG STATE IS WORSE THAN AN ABSENT ONE, BECAUSE IT IS
  TRUSTED.** Same argument as `continue-on-error` making a lint step advisory and as a gate passing
  on an empty subject — **but the snapshot case is the strongest form, because those two merely fail
  to catch and this one actively hands back the wrong tree while reporting success.** The first
  version of `mutate.mjs --restore` snapshotted at RUN time, after the operator had already edited,
  so it returned the mutation. **A snapshot taken at restore time is a snapshot of the damage**, and
  only the operator knows when the tree held the intent — so the pre-step is explicit and a run
  without one warns rather than offering a restore that would lie.

- **⚠ A FIELD NOTHING READS DRIFTS SILENTLY AND LOOKS AUTHORITATIVE WHILE IT DOES.** Twice now in
  `docs/colour-boundary.yaml`: `count:` sat on sixteen rows unread until #363, and `category:` was a
  LABEL AND NOT A CLAIM until #365 — **five of five `signature` entries sat in a category none of
  their prose argued for.** `Z4` asserted the vocabulary and `Z5` that an entry declares a known
  kind; **no assertion ever compared a kind to its reason.**

  The repair generalises: **have the schema declare the QUESTION and the entry declare its ANSWER**,
  then assert both exist. Not a list of accepted phrases — that is a regex in a data file, the shape
  #339 removed. It forces the reasoning to be written; a person still judges whether it is good.

- **⚠ A DIAGNOSIS STATED AS A FACT CARRIES THE AUTHORITY OF WHOEVER STATES IT, AND THAT IS
  ORTHOGONAL TO WHETHER IT IS TRUE.** Three instances: "Harbour is published" (it was, but on no
  evidence at the time), the `loves-store` mismatches dismissed as a probe artefact (right about two
  rows, wrong about two), and "`mutate.mjs` performs the destructive checkout" (it does not touch
  the tree at all). **In every case the instinct about WHERE the problem lived was right and the
  claim about WHAT CAUSED it was wrong, and those are separable.** Separating them is what makes the
  fix correct rather than cosmetic — check the mechanism even when the conclusion is obviously
  right, and especially when the person asserting it is the one who would know.

- **⚠ A MEASUREMENT IS ABOUT THE TREE THAT EXISTED WHEN IT RAN.** Every gate figure in this project
  is a claim about a state, and a state that changes after the run **silently invalidates it — no
  error, no warning, and the number stays quotable.** #362 reported ralph green at 2567, measured
  before a `git checkout` that reverted the change being shipped; the commit went out with gates
  asserting tokens that did not exist and a STATE entry claiming a ruling was implemented.

  **SO: RE-RUN AFTER THE LAST EDIT, AND CHECK THE STAGED SET AGAINST WHAT THE PR CLAIMS.** The
  second half is the one that catches it — `git status` would have shown `app/globals.css` absent,
  exactly as `Merge #N —` showed the merge format was wrong. **Twice the evidence was in the tool
  output and was not read.**

  **AND A MUTATION TEST IS THE SPECIFIC HAZARD, because reverting one is a DESTRUCTIVE OPERATION RUN
  AS PART OF VERIFICATION.** `git checkout <file>` reverts to the last COMMIT, not to the last
  INTENT, so it discards the change the mutation was proving. Use
  `node ralph/mutate.mjs --snapshot` before mutating and `--restore` after; a run with no snapshot
  now says so.

- **⚠ NOTHING REPORTED IS EVIDENCE, INCLUDING A REPORT ABOUT THE REPOSITORY, INCLUDING ONE YOU WROTE
  YOURSELF.** Ten units of work were merged into LOCAL `main` with the branch deleted, never pushed
  and never opened as a pull request, and reported as merged ten consecutive times. **Every colour,
  contrast ratio and shape diff in that arc was measured. "Merged" was the one claim taken on
  report.**

  **⚠ AND THE TELL WAS IN THE OUTPUT TWENTY-TWO TIMES.** Every real merge here ends with GitHub's
  `(#N)` suffix; every one of those begins `Merge #N —`. `git merge` prints nothing on success, so
  "it worked" was **a signal supplied rather than observed** — the same act as citing a figure
  without re-deriving it, and the same family as a mutation reporting SURVIVED because it never
  applied to its subject.

  **AND NO GATE COULD SEE IT, FOR A REASON WORTH KEEPING: EVERY INSTRUMENT IN THIS REPO READS THE
  WORKING TREE, AND THE WORKING TREE WAS CORRECT.** ralph passed, the census passed, the build was
  green. The claim that failed was about a system none of them look at, so the absence of a check
  was invisible from inside every check that exists. `ralph/tests/upstream.mjs` is the repair; it is
  network-bound, so it is skipped BY NAME in `run.mjs` rather than silently absent.

- **⚠ A GATE'S OWN PASSING MESSAGE IS THE MOST DANGEROUS THING IT CAN PRINT, AND `A0` IS THE
  ARCHETYPE.** `git rev-list --count origin/main..main` prints NOTHING for an unknown ref, and
  `Number("")` is `0`. So **a misspelled remote reads as "0 ahead — perfectly in sync"** — a gate
  built to catch a false *merged* report would have produced a false *in sync* report from a typo,
  in the exact words that mean success. `A0` asserts `origin/main` resolves before `A1` counts
  anything.

  **AND ABSENCE IS THE ONE ANSWER THAT NEVER LOOKS WRONG, SO IT MUST NEVER BE A PASS.** A failed
  `git fetch` reports **UNRUN**; an unavailable `gh` marks its section **UNVERIFIED**. Same rule as
  the empty-subject assertions, one layer out: an instrument that cannot run must say so rather than
  return the shape of success.

- **⚠ A COMPARATOR'S CONTRACT SHAPES THE ASSERTIONS WRITTEN AGAINST IT, AND THE DEFECT LANDS THREE
  FILES FROM ITS CAUSE.** `rich-markers.mjs` compared with `got === want` — reference equality —
  where 53 other suites compare `JSON.stringify` of both sides. Under `===` **every honest structural
  expectation fails**, so the author stringified both sides, and the `want` side then had nowhere to
  get a value except by repeating the `got` expression. The result was
  `t(name, JSON.stringify(parseRich(s)), JSON.stringify(parseRich(s)))` — **a value compared to
  itself, three times, unable to fail for any implementation.**

  It reads as carelessness and it was not. **It was the only form that compiled.**

  **THE PRACTICAL TEST: when a suite's assertions are shaped oddly, read its harness before judging
  its author.** A tautology, a stringify on both sides, an assertion that restates its subject — each
  is more often a comparator forcing the shape than a mistake in the row. Audited all 64 suites
  afterwards: 42 use the standard compare, 4 stringify inside the helper, 3 use a renamed variant,
  and **`rich-markers` was the only true `===`. One instance, and it had produced three dead rows.**

- **⚠ A WRONG UNIT DOES NOT PRODUCE OBVIOUS NONSENSE. IT PRODUCES SPECIFIC, CONFIDENT,
  CHECKABLE-LOOKING CLAIMS, AND THE TRUE ONE HIDES AMONG THEM.** The boundary count gate was built
  three times. Per row it reported 2 mismatches; per file, 5; per connected component of files linked
  by rows, 0 false ones. Every wrong version emitted real file names and real numbers.
  **FIVE PLAUSIBLE FINDINGS WITH ONE TRUE ONE AMONG THEM IS INDISTINGUISHABLE FROM FIVE TRUE ONES** —
  and the real defect (`ProcessSection`'s unruled aura) was present in all three runs.

  **⚠ AND IT WAS DISMISSED, WHICH IS WHAT MAKES THIS A RULE RATHER THAN AN ANECDOTE.** The first
  mismatches were reported, then written off as a probe artefact — right about two rows and wrong
  about two. **THE DISMISSAL WAS AS CONFIDENT AS THE FINDING AND EQUALLY UNMEASURED.** Before
  dismissing a gate's output as instrument error, check the instances one at a time; "my probe was
  coarse" explains away true findings exactly as well as false ones.

  The practical form: when a record and an instrument disagree, **ask what UNIT each side counts in
  before believing either.** A count that covers several files and a file that hosts several rows have
  no common unit but the group, and picking either side alone double-counts in one direction.

- **⚠ ZERO CONSUMERS IS A REASON TO DELETE A TOKEN, NOT TO EXEMPT IT FROM A FLOOR FOREVER.**
  `theme-contrast` carried `"accent-400": "zero public consumers"` — **a true observation with the
  wrong conclusion attached.** The exemption is what let a dead token survive review for as long as
  the list did. It was also alive on one palette and not the other, because `@theme` prunes an
  unreferenced token while a plain `[data-theme]` block does not.

  **⚠ AND `theme-contrast` COULD NOT HAVE SEEN THAT — ITS MODEL OF A THEME MADE THE DEFECT
  UNREPRESENTABLE.** It reads `globals.css`, where both declarations plainly exist, and constructs
  harbour as cream-plus-overrides: **a merge that ASSUMES the parity the defect breaks.** Not
  oversight. Reading the built bundle is the repair (`colour-census` section T), and T3 catching T2
  passing over an empty subject is the denominator rule paying for itself a fourth time.

- **`lib/studio/data.ts` is the single READ seam for /studio, `lib/studio/commit-site-settings.ts` is the write seam.** All studio reads go through `getStudioData()`, a `cache()` wrapper over `getHomePageData` plus the draft-branch state, draft-preferring for settings. Writes go through the owner-gated commit layer, with the pure transforms in `lib/studio/*-format.ts`.

- **Keystatic is schema-only.** `keystatic.config.ts` drives the reader (`createReader`, `createGitHubReader`) that parses all content, and `lib/case-studies/sections-raw.ts` derives the 16 block-kind union from it, so the config and `@keystatic/core` are load-bearing and stay. There is no Keystatic editor route any more.

- **The studio's GitHub target is configurable, and dev should not point at production.** `STUDIO_GITHUB_REPO` and `STUDIO_BASE_BRANCH` select the repo and the published branch, defaulting to the production repo and `main`. Every write route no-ops unless `STUDIO_WRITE_MODE=github`, so github mode is the only way to exercise the write paths, and it must be aimed at a fork or scratch repo when developing. `BASE_BRANCH` is the single definition of the published branch for both the draft compares and the publish merge, so reads and writes cannot disagree. See `.env.local.example` for the setup.

- **The public palette is CONTENT, and the theme name has one owner per direction.** `theme` in `site-settings.yaml` is read through `resolveTheme()` in `lib/theme.ts`, which fails closed to `cream` silently, and written through `sanitizeSiteSettingsPatch`, which rejects an unknown value loudly. That asymmetry is deliberate. A visitor never sees an unthemed page and an author is never left wondering why their choice did nothing. Theme names live on three surfaces that cannot import each other (`lib/theme.ts`, `THEME_METRICS`, `SETTINGS_THEME_VALUES`) because ralph loads all three raw, so `ralph/tests/theme.mjs` enforces their agreement. `cream-verify` is a VERIFICATION FIXTURE, not a design, and the gate's exactly-two-entries assertion is its deletion trigger. Adding a real second theme means deleting the twin in the same commit.

- **⚠ A SUBSTITUTION DEFINED BY VALUE CROSSES EVERY BOUNDARY DEFINED BY SCOPE**, because a value has no idea where it lives. A blanket `ink-950` conversion in #332 caught three `--studio-lift-*` tokens and would have made the studio's shadows follow the public theme — the freeze violation #323 exists to prevent. Third instance this session, after #314's hairline rename and 6a's census. **Any sweep over a colour, a token or a utility must be bounded by DIRECTORY before it is bounded by PATTERN.** `studio-ink` C10 caught this one, which is also the first time the freeze actively stopped something rather than merely holding.

- **ARTWORK IS EXCLUDED BY WHAT THE FILE IS FOR, NOT BY WHERE THE COLOUR SITS.** `ProjectCardSvgs.tsx` holds 77 of the site's 82 SVG colour attributes and is excluded whole, because it is an illustration file. The case-study watermarks were converted in the same breath, because they are interface drawn decoratively. **The test is the file's purpose, not the syntax the colour is written in** — a `fill=` in an illustration and a `fill=` in a UI icon are different questions.

- **⚠ ASKING WHAT THE NEXT BLIND SPOT WOULD LOOK LIKE IS ITSELF A SEARCH.** `theme-contrast`'s E1 declared its subject and stopped, and its completeness claim was true of `--color-*` and false of the page. `colour-census` declares its subject AND what falls outside it — and writing that second half found a real fourth route (`manifest.ts`'s PWA splash and address-bar colours). **A gate that proves a set complete proves nothing about what is outside the set, and the danger is that it reads like it does.** Every census here states its populations and names the shape of the one it cannot see.

- **⚠ A SIGNATURE READS AS SIGNATURE ON CREAM AND AS A LEAK ON HARBOUR, BECAUSE THE SITE MOVED AND IT DID NOT.** Before ruling anything a signature component — a thing that IS the design rather than a skin on it — **ask whether it holds when the ground around it changes.** The custom cursor, the page loader and the case-study hero auras were all ruled signature on a one-theme site, which is to say **the test was never run**. A second palette ran it and all three failed. The argument for each was good — *"the brand arriving, not the site's surface"* — and a second theme is what refutes it.

- **⚠ A DOCUMENT CANNOT AUDIT ITSELF.** `docs/colour-boundary.yaml` listed "the nine Δ≥10 nears" in its header from the day it was written and **never gave them an entry**. The header said the list was complete; the data had never held it — **and both statements were made by the same file.** It survived until something outside it joined against the data. **Prose and data in one file look like one claim and are two**, and only a third thing can tell you they disagree. This is the last instance of this arc's central defect, found in the file built to stop exactly that.

- **⚠ ANY GATE READING GENERATED OUTPUT ASSERTS HOW MANY SUBJECTS IT FOUND.** A gate over a built bundle, prerendered HTML or a derived token map passes trivially when its subject is empty — the output moved, the scan matched nothing, and zero failures reads as success. Three instances this arc: `studio-ink-contrast`'s S4 (a token silently absent from its map), C-9's exclusion, and `rendered-theme`'s page count. **Each would have passed on an empty subject.** State the count and assert a floor, so a shrunken subject fails rather than agreeing.

- **⚠ A DEFERRAL WITHOUT A NAMED OWNER IS A DEFERRAL TO NOBODY.** `theme`'s E-section says the build-level fact "belongs to a snapshot diff rather than a regex over `.next`" — correct, and it named no check. #326 then proved that fact once, by hand, and nothing asserted it again for twenty-one PRs. **A claim can fall between two correct scopes: from inside either, the gap is invisible, because the other side appears to have it.** This is not a mis-measurement and not an exclusion — the claim simply had no owner. When a gate's comment defers a fact to another check, NAME THAT CHECK.

- **⚠ `mutate.mjs` CONFIRMS THE SOURCE CHANGED AND CANNOT CONFIRM THE SUBJECT DID**, and the subject is sometimes the bundle and sometimes the rendered DOM. Two instances: a mutation to `globals.css` that needed a rebuild before `colour-census` could see it, and `data-theme` moved onto a React component that never forwards it to the DOM — **the attribute simply never appeared, so the assertion had nothing to find and reported SURVIVED**. A mutation that lands in JSX and not in the DOM looks exactly like a mutation the gate withstood. **Rebuild first, and check the mutation reached the subject rather than only the file.**

- **⚠ A DENOMINATOR GUARD DERIVED FROM ITS OWN SUBJECT GUARDS NOTHING.** D12b asserted
  `PAIRS.length === n(n-1)/2` where `n` came from the same list `PAIRS` did — so emptying that list
  made **both sides 0 and the row passed**, and five of D12's six rows passed with it, because
  nothing to iterate is indistinguishable from nothing wrong. **Only a comparison against a CONSTANT
  catches an empty subject.** The closed form is still worth asserting, as a separate row that
  cannot absorb the other's failure. Found by mutation, in the assertion written to prevent exactly
  this.

- **⚠ MEASURE THROUGH THE STRING THAT GETS WRITTEN, NOT THE VARIABLE THAT PRODUCED IT.** A search
  for an in-gamut colour reported margins of +0.49 and +0.00 for values that were **2.65 and 1.7
  outside sRGB**, because `(l * 100).toFixed(1)` rounded 49.55 to "49.6" AFTER the overshoot had
  been computed on 49.55. **The number was true of a colour, and not of the colour it was written
  beside.** Round first, then measure the rounded form — `gamutOvershoot(css)` on the literal string
  — so the value tested and the value shipped cannot differ. **And review did not catch it; the gate
  did, because it reads the artefact rather than the search's report.**

- **⚠ A CONVENTION THAT NAMES A SPECIFIC THEME IS THE FIXED-LIST SHAPE.** "Revert `theme:` to
  `cream` before committing" went stale the moment the owner published harbour through /studio, and
  following it would have **silently un-published their choice while looking like tidying up**.
  Restore to the PUBLISHED value, read from `git show main:content/site-settings.yaml`. The
  published theme is CONTENT with an owner, so the file is the only correct source — same defect as
  D12's hardcoded pair list and `SETTINGS_THEME_VALUES` before ralph tied it to `THEME_NAMES`.

- **⚠ THE PALETTE COUNT IS BOUNDED BY THE SEPARATION FLOOR, AND THE TWO ARE ONE DECISION.** Seven
  hues on a circle sit **51.4 degrees apart at perfect spacing**, so seven palettes and D12's 60
  degree ground floor **cannot both be true at ANY placement**. Cream, harbour and orchid are
  already placed unevenly, so exactly two more fit and both shipped ones land EXACTLY on 60.
  **FIVE REAL PALETTES IS THE CEILING THIS FLOOR IMPLIES.** Whoever wants a sixth is choosing to
  lower the floor, and `theme-contrast` D12d is where that gets written.

  **⚠ NOTHING DISCOVERS THIS EXCEPT COUNTING.** Four candidates measured first came back as three
  unrelated hue collisions — **a result somebody tunes three hues in response to.** The bound is the
  finding and the refusals were its symptom. Same family as the wrong-unit rule: a correct
  measurement of the wrong quantity, arriving as a value where the truth was a limit. **When several
  refusals share a shape, ask whether they are one constraint before fixing them one at a time.**

- **⚠ AN INSTRUMENT THAT CANNOT SAY "THIS DOES NOT EXIST" WILL RETURN A PLAUSIBLE NUMBER INSTEAD.**
  A candidate accent measured 4.320 against a 4.5 floor and read as needing to be darker. Its red
  channel computed to **minus 129** and `oklchToRgb` clamped it to zero — 4.320 was the contrast of
  a colour sRGB cannot draw. **"Fails contrast" and "does not exist" both arrive as a ratio.** So
  the gamut check runs BEFORE the contrast check and `UNREPRESENTABLE` outranks both refusals. Same
  shape as parse-before-exclude in #334.

  **⚠ AND CHROMA IS NOT COMPARABLE ACROSS HUES, WHICH IS WHY CARE IS NO SUBSTITUTE FOR MEASURING.**
  The prediction was that two accents at c 0.215 would clip; both were fine and the one that clipped
  was at **c 0.160, the lowest of the four**. sRGB holds 0.289 of chroma at h300 and 0.126 at h158.
  **A number that reads as "more saturated" is a different proportion of the available space at
  every hue** — and any chroma rule stated as a RATIO (`ground.c x 1.20`) is blind to that, which is
  how a ground rung ended up at two and a half times its ceiling.

  **⚠ AND ITS FIRST RUN FOUND THE SHIPPED SITE.** Harbour's `accent-500` is 60.7 outside sRGB and has
  painted clamped since it shipped — with **a witness already in the repo that never knew it was
  one**: `THEME_OG.harbour.accent` is `#007e5b`, a red channel of exactly zero, which IS the clamp.

- **⚠ THE GROUND-CHANGE TEST REFUTES *SIGNATURE* CLAIMS AND CANNOT TOUCH *DEPICTION* CLAIMS.** The
  cursor, the loader and the hero auras were ruled signature — *this IS the design* — and a second
  palette refuted all three, because a claim about IDENTITY is exactly what a moving ground tests.
  The process diagram's tan fills and `.ab-tint`'s warm wash read equally foreign on cerise and fern
  and **hold anyway**, because they are ruled `artwork-by-file`: the fills depict somebody else's
  interface and the tint composites over a photograph. **A claim about SUBJECT does not depend on
  the ground.** Knowing which kind of argument an exclusion makes tells you in advance whether a new
  theme can overturn it — so read the `test:` field before re-litigating an entry that merely looks
  wrong on a new palette.

- **⚠ `mutate.mjs --restore` CONSUMES ITS SNAPSHOT — SNAPSHOT BEFORE *EACH* MUTATION.** A second
  restore in one session reports "no snapshot to restore from" and **leaves the mutation in the
  tree**, which then fails assertions for reasons unrelated to what was being proved. **And the
  obvious repair is the dangerous one**: `git checkout` reverts to the last COMMIT and destroys
  every uncommitted change in the work in progress. Reverse by hand. **Then rebuild** — the census
  and rendered-theme gates read the BUILT bundle, so a stale `.next` fails them independently of the
  mutation and reads as a broken restore.

- **⚠ A CANDIDATE PALETTE IS MEASURED FROM SCRATCH, NEVER DERIVED FROM A SHIPPED ONE.** Cream sits inside 0.1 of **five** floors and Harbour of **three**, so both ship with almost no margin — which is not a defect, it is what "ground plus one step" means as a relation. The consequence is that copying either ladder and then moving a hue produces a palette the instrument REFUSES, which is exactly what happened to Harbour's first two drafts against the retired "ground lightness above roughly 85%" figure. **The two shipped palettes are evidence that no template exists, not the template.** This sits beside the render protocol for the same reason that one is here rather than only in `docs/STATE.md`: it is the fact a designer reaching for a starting point would most want to skip, and a convention is read before work begins while a record is read when someone goes looking.

- **A CANDIDATE PALETTE IS JUDGED BY THE INSTRUMENT AND THEN BY THE RENDER, IN THAT ORDER, AND NEITHER STEP IS OPTIONAL.** Run `ralph/tests/theme-contrast.mjs` first — it answers whether every token PAIR clears its floor, which is the narrow claim. Then set `theme:` in `content/site-settings.yaml`, render the FULL home page and the four signature components (the work card, the glass nav, the hero ground, the Pearl Smoke vessel), and look. Only then judge. **`SHIPPABLE` is not "the site looks right"** and never was. Two palettes have now found defects no gate could reach: the dark render found the glass nav and the vessel are structurally light-ground at 1.15 and 1.20, and Harbour found `SectionHeading`'s two `tone` branches disagreeing on the same page. The second was invisible on cream because both branches looked the same there, which is the general rule — **a single-theme site cannot reveal an inconsistency between two ways of producing the same colour.**

  **⚠ RESTORE `theme:` TO THE PUBLISHED VALUE BEFORE COMMITTING — READ IT FROM `git show main:content/site-settings.yaml`, DO NOT TYPE A NAME.** This line said "revert to `cream`" and was stale: the owner published harbour through /studio (`chore(studio): update site settings draft`), so following it would have silently un-published their choice while looking like tidying up. **A convention naming a specific theme is the fixed-list shape again** — the same defect as D12's hardcoded pair list and `SETTINGS_THEME_VALUES` before ralph tied it to `THEME_NAMES`. The published theme is CONTENT with an owner, so the only correct source is the file.

- **Admin surfaces sit outside the `(portfolio)` route group.** `app/studio` lives outside it, so it carries no site chrome, sets page-level noindex plus a robots disallow, and is owner-gated in middleware. Any new internal or admin surface follows the same placement.

## Proof and verification

- **`/dev` harness routes are DEV-ONLY.** They 404 under `next start`, so any proof gate that needs a production build cannot use them. Production verification of studio UI requires a real authenticated login, so it is owner-only. State it as UNVERIFIED rather than routing around it. Prefer fixes that remove the dependency being tested, the way #177 set the nav label colour explicitly rather than relying on inheritance, so that a dev-only proof holds in production by construction.

## Writing rules

These rules apply to all site copy and all documentation written in this project.

No colons. No semicolons. No em dashes. No forward slashes.

Use plain sentence structure. If a sentence needs a colon to introduce a list, rewrite it so it does not. If two clauses feel connected by an em dash, split them into two sentences or use a conjunction. If a forward slash is joining two words, pick one or rewrite the phrase.
