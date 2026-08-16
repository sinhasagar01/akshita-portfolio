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
- The blog. A second collection with its own schema, public pages and three pane editor. **Three
  posts are published** and the nav link is live. A fourth is back at `status: draft` with **one**
  marked gap remaining for the owner's own example, and it is the first post to use the
  `Motion in Design` topic, which had been declared in `BLOG_TOPICS` ahead of any post that used it.
  It was briefly published and has been withdrawn. **See the placeholder item in Open items** —
  gaps 2 and 3 were filled, and gap 1 shipped with its marker destroyed.
- The inline canvas. Blog prose is edited in place at the public measure, so the canvas and
  the article render through the same components.
- The lint gate. ESLint runs in CI beside ralph, and the repo sits at zero problems.

The record of what shipped, in order and with its reasoning, is docs/STATE.md. Read that
rather than inferring history from this list.

## Production domain and hosting

The production domain is akshitas.com. The canonical host is www.akshitas.com. The apex akshitas.com redirects to the www host with a 308 configured in Vercel, and the www host is the primary.

Both `metadataBase` in `app/layout.tsx` and `NEXT_PUBLIC_SITE_URL` in `.env.local` must be set to `https://www.akshitas.com`. These two values must always point to the same host. Swapping one without the other causes the canonical URL and share image URLs to resolve against a host that Vercel then redirects away from. On Vercel, the production environment variable `NEXT_PUBLIC_SITE_URL` must also be set to `https://www.akshitas.com`.

### ⚠ THE DEPLOY THROTTLE IS A LIMIT, NOT A RULE — AND ITS OWN MESSAGE MISDESCRIBES IT BY A FACTOR OF FORTY

*(This heading read "the deploy budget … EXHAUSTIBLE, SHARED, AND INVISIBLE UNTIL IT IS GONE" for one
afternoon. Both "budget" and "until it is gone" were the quota model, and the correction below is
what retired them. The heading is amended rather than left, because a title is the part a reader
takes away when they skim.)*

On **2026-08-10** Vercel refused the production deploy of a merge outright, as a commit status on
`4e03e3c`:

    context=Vercel   state=failure
    Deployment rate limited — retry in 24 hours.

**⚠ AND THE MESSAGE IS NOT A DESCRIPTION OF WHAT HAPPENS — CORRECTED THE SAME AFTERNOON, AGAINST THE
ENTRY'S OWN FIRST DRAFT.** This paragraph opened *"the Hobby tier caps deployments per day"* and
called the refusal a cap being reached. **Neither was measured.** What the day's four merges actually
did, read from the commit statuses and the deployment list:

    13:38:40Z   #477   production deploy SUCCEEDS
    13:54:16Z   #478   refused — "retry in 24 hours"
    14:07:16Z   #479   refused
    14:28:04Z   #480   production deploy SUCCEEDS     50 min after the previous success
    14:29:39Z   #481   refused                        95 SECONDS after that success

**Every refusal fell BETWEEN two successes**, the working retry interval was under an hour every
time, and the deploy refused at 13:54 reached production inside the 14:28 build. **A refused deploy is
therefore not lost work: the next successful deploy carries every merge before it**, so the exposure
window is until the next success rather than until a quota resets. **That is the one operational
sentence in this entry that has survived every correction.**

**⚠ AND THE FIGURES THAT SAT HERE WERE COUNTED FROM A `tail -6`.** This read *"six production deploys
landed that day, spaced 29 to 65 minutes apart"*. **Counted properly: 24 production deploys, 23 gaps,
minimum 1 minute and maximum 64.** The six were the last six, and the range was their range. **A
denominator computed inside a truncated view** — the defect this file names a dozen times, committed
while writing the correction to a different one.

**⚠ AND IT KILLS THE MECHANISM THIS ENTRY HAD JUST PROPOSED.** The replacement reading was *"a minimum
interval between production builds"*. **Two deploys succeeded ONE MINUTE apart that morning, and one
was refused NINETY-FIVE SECONDS after a success that afternoon.** No minimum interval produces both.

**⚠ SO TWO MECHANISMS HAVE NOW BEEN NAMED AND BOTH REFUTED, BY DATA AVAILABLE BEFORE EITHER WAS
WRITTEN — AND A THIRD IS DELIBERATELY NOT OFFERED.** What is measured: **22 production deploys had
landed before the first refusal**, and successes resumed after it. Something is counting, and it
releases within the hour. **Naming it would be the third confident framing in one afternoon**, and
the first two each read as obviously right at the time.

**WHAT IS ESTABLISHED, AND IT IS ENOUGH TO PLAN WITH:** the stated 24 hours matched nothing on the day
it was read, a refusal costs the wait to the next success rather than a day, and **the number to watch
is the latest production deployment rather than any commit status.**

**⚠ AND THE STATED FIGURE HAS NOW BEEN WRONG EVERY TIME IT HAS BEEN MEASURED — WITH THE NUMBERS,
BECAUSE AN IMPRESSION IS WHAT LET IT STAND THIS LONG.** Two days, every refusal recovered inside
the hour-and-a-half:

    2026-08-10   refused 13:54  ->  carried by the 14:28 success           34 min
                 refused 14:29  ->  next success the same afternoon
    2026-08-13   refused 13:53  ->  production deploy succeeded 14:40:57Z  85 min

**Zero observations at or near 24 hours, across every refusal anyone has timed.** The 85-minute wait
is also inside that same day's own range — it already contained a 97-minute gap between two
SUCCESSES — so a long wait is not evidence of the stated interval either.

**⚠ THE PRACTICAL COST OF BELIEVING THE MESSAGE IS A DAY OF NOT SHIPPING**, which is why this is
worth numbers rather than a note. Read the deployment list; the message is a constant, not a
measurement.

**⚠ AND THAT LAST SENTENCE NOW HAS AN OWNER RATHER THAN BEING ADVICE.** `ralph/tests/upstream.mjs`
section C reads the deployment list, walks back to the newest deployment reporting `success`, and
asserts **what production serves is on `origin/main`**. It deliberately does NOT assert that main is
deployed — that fails on every run made minutes after a merge, and a gate whose common failure is
benign is one people learn to skip. **Lag is reported; only a rollback, a promoted preview or a
divergent branch fails.** Naming the check is the repo's own rule about a fact deferred to nobody.

**A MERGE IS NOT A RELEASE, AND THAT IS THE WHOLE ENTRY.** Everything the repository can check was
green — ralph 2899 across 75 suites, `upstream` confirming a real GitHub merge, the built output
correct. **None of that reaches visitors.** The last successful production deploy stayed at
`8f8b2d0`, one merge behind, and what the refused deploy was carrying was the withdrawal of a
placeholder **live on the public site**. **The refusal landed on the one change that could not wait**,
and the placeholder stayed served for the 34 minutes until the next deploy went through.

**EVERY PR COSTS AT LEAST TWO, AND THE SECOND ONE IS THE ONE NOBODY COUNTS.** A push builds a
preview and a merge builds production, so the cost is per PUSH rather than per PR — a branch pushed
four times has spent four previews before it is even reviewed. That day registered **49 deployments,
25 preview and 24 production** — measured at 14:45Z, and still climbing when it was written down.

**AND THAT IS WHY BATCHING HELPS, THOUGH NOT FOR THE REASON FIRST WRITTEN.** This said the cadence
*"is exactly what exhausts it"*, which assumed a quota. On the corrected reading the cost of a fast
cadence is that **most merges arrive inside somebody else's interval and are simply refused** — five
PRs merged in twenty minutes produce one deploy and four failures, where the same five in one PR
produce one deploy and none.

**⚠ AND 49 IS WHAT GITHUB REGISTERED AT A MOMENT, NOT THE CAP AND NOT WHAT VERCEL COUNTED.** It is a
floor on the true figure — rebuilds and redeploys need not appear as repo deployments — and **the cap
itself was never measured here**, only the refusal. Quoting it as the limit would be the
unattached-number defect this file names a dozen times: a real figure, about a different subject than
the one a reader would take it for.

**⚠ AND IT WAS 46 IN THIS PARAGRAPH THREE HOURS EARLIER, WHICH IS THE SHARPER LESSON.** The figure is
not merely attached to the wrong subject when misread — **it is a running total that changes while
you are writing about it.** Every count in this section carries `14:45Z` for that reason. **A number
whose subject is "today" is stale before the paragraph ends.**

**⚠ NO INSTRUMENT HERE CAN WARN YOU, AND THE ASYMMETRY IS THE POINT.** The FAILURE is observable
after the fact — `gh api repos/<owner>/<repo>/commits/<sha>/status` carries the `Vercel` context and
its reason, and the deployment list gives the timing. What is NOT observable without a Vercel
credential is **how long you have to wait**, which this environment cannot ask for. **So the only
readable signal arrives after the deploy has already been refused**, and a gate built on it would
report a refusal already taken rather than one about to happen.

**⚠ AND THE CHECK THAT MATTERS IS NOT THE STATUS BUT THE DEPLOYMENT LIST.** A red Vercel status on the
newest merge means nothing on its own, because a later deploy carries it. **Ask whether the latest
PRODUCTION deployment is at or after the commit you care about** — that is the question "did my change
reach visitors", and the commit status answers a different one. Same family as
the merged-to-local-main gap that `upstream.mjs` closed, **except that one had a readable
before-state and this one does not.**

**THE RECOVERY THAT NEEDS NO BUILD: PROMOTE A SUCCESSFUL PREVIEW WHOSE TREE EQUALS `main`.** The
branch commit's preview had already built successfully, and its tree was byte-identical to the merge
commit's — checked with `git rev-parse <sha>^{tree}` on both, not assumed from the diff. Promoting
that deployment puts exactly `main` live without a rebuild. **IT WAS NEVER NEEDED — an ordinary
deploy went through 34 minutes later, which is the corrected reading arriving as a practical
consequence: waiting is usually cheaper than reaching for the escape hatch.** **Whether a promotion counts against the
same cap is UNVERIFIED here** and should be stated that way rather than repeated as fact.

**WHEN THE WORK IS URGENT, BATCH IT.** One unit per PR is the right default and it is not free. A fix
that must reach visitors today is worth combining with whatever else is ready, because the constraint
is deploys rather than commits.

## Open items

⚠ **AN ENTRY BELONGS HERE ONLY IF IT CARRIES AN ACTION.** A closed finding kept for its reasoning
goes under `Recorded` below. Without that rule this section degrades back to what it was: 46 entries
sharing no subject, of which 35 were finished work nobody could tell from unfinished work — and a
board that cannot be read is a board that gets batched, which is how a fix rides in on another fix's
gates.



- **⚠ CLOSED: THE DEV SERVER HAS ITS OWN BUILD DIRECTORY, AND THE BOARD GATE CAUGHT THIS ENTRY
  GOING STALE ON ITS SECOND RUN — ON THE UNIT THAT CLOSED IT.** The entry declared it held while
  `next.config.ts` carried no `distDir`; adding one turned `B2` red and named the entry rather than
  the code. **The gate's second-ever finding was its own author closing the item it was told to
  watch**, twenty minutes after it merged.

  `distDir` is `.next-dev` under `NODE_ENV=development` and `.next` otherwise, so the split falls
  exactly on the line that matters: **nothing a dev server does can reach what the four suites read**
  — `colour-census`, `rendered-theme`, `route-coverage` and `css-comment-trap` — and `next start`
  still serves the production directory it built. Vercel runs `next build`, which is production,
  so the deployed path does not move.

  **⚠ AND "REMEMBER TO STOP THE SERVER FIRST" WAS ALREADY WRITTEN DOWN AND DID NOT HELP**, which is
  the whole argument. It is this repository's oldest lesson about rules — reaching for the wrong
  thing is faster than remembering, which is why `mutate.mjs --edit` exists rather than a note about
  `git checkout`.

  **THE BOARDED FRAMING, KEPT BECAUSE ITS ARGUMENT IS WHY THE FIX IS A CONFIG CHANGE:**

- **⚠ SUPERSEDED: THE MEASUREMENT AND THE GATES CANNOT SHARE `.next`, AND THAT IS STRUCTURAL RATHER
  THAN A DISCIPLINE PROBLEM.** A dev server was needed to measure nine palettes from the paint; the
  bundle-reading suites need a PRODUCTION build; both use `.next`. The dev server overwrote it and
  three suites went red with **20 failed assertions** — `colour-census`, and two others reading the
  built CSS.

  **⚠ SEVENTH INSTRUMENT CONDITION IN ONE SESSION AND THE ONLY ONE WITH A MECHANICAL ANSWER.** The
  other six were a probe, a matcher, a stale manifest, a self-read comment, a suite reverting its
  own mutation, and a slice bound. Each was fixed where it happened. **This one recurs by
  construction: two consumers, one path, and no amount of remembering changes that.**

  **THE MEMORY ALREADY SAYS "stop the dev server before building".** It is correct, it was written
  down before today, and it did not help — the same shape as `git checkout` being reached for while
  applying the rule that names it. **Only a mechanism prevents a failure mode.**

  **THE CHEAP FORM IS A SEPARATE `distDir` FOR THE MEASUREMENT SERVER**, so a dev run cannot touch
  what the suites read. Whether Next's config makes that clean is the open question and is why this
  is boarded rather than done — it is a build-config change with its own blast radius, and it must
  not ride inside an unrelated unit.

  **⚠ AND THE FAILURE IS LOUD, WHICH IS THE ONLY REASON IT IS BOARDED RATHER THAN URGENT.** Twenty
  red assertions naming a missing bundle is not a silent wrong answer. **A gate that goes red for an
  environmental reason is still a gate people learn to skip**, and that is the cost being paid.



- **⚠ BOARDED: SHOULD `unchecked-joins` REACH CASTS ON SHAPE-BEARING TYPES? THE SKILLS OUTAGE IS THE
  EVIDENCE.** That census counts casts onto COLLECTION-KEYED types — `entry[1] as PreviewGroup` and
  its family — where a closed set is widened and a cast silences the check.

  **`items as string[]` IS THE SAME ACT ON A DIFFERENT KIND OF TYPE.** `SkillsCategory` declared
  `items: string[]`, the schema declared objects, and **the cast is what let it compile**. Four
  places said string, one said object, **and the type system agreed with the wrong four** — so the
  one mechanism that could have caught a two-day outage was the one silenced.

  **THE QUESTION IS WHETHER A CAST ONTO A SHAPE THE SCHEMA OWNS IS THE SAME CLASS**, and it is not
  obviously yes: `unchecked-joins` found ELEVEN casts and ruled TEN of them guarded, so a wider net
  is only worth it if the guards can still be told apart. **Not built. The instance is recorded so
  whoever answers it starts from evidence rather than from a hunch.**

- **⚠ BOARDED: AUTHORABLE-AND-INERT ON EXACTLY ONE SURFACE — A NARROWER VARIANT, AND THAT NARROWNESS
  IS WHY IT SURVIVED TWO DAYS.** The other three instances — `videoEmbed.poster`, the `imageBlock`
  kind, the gallery image fields — were inert EVERYWHERE: the UI offered a value and nothing
  anywhere persisted it.

  **THE SKILLS GLOW WORD WORKED THROUGH KEYSTATIC AND BY HAND**, which is why `content/skills.yaml`
  already carried `glow: vision` on twenty rows before /studio could save one. **Only the /studio
  write path refused it.**

  **⚠ SO THE FIELD LOOKED ALIVE FROM EVERY DIRECTION EXCEPT THE ONE AN AUTHOR USES.** A reader saw
  glow words on the public site; a developer saw them in the content, the schema and the form. The
  single surface that refused them is the single surface an owner edits through — and it announced
  itself with an error message that was CORRECT ABOUT AN OBSOLETE RULE.

  **THE CHECK THIS SUGGESTS, NOT BUILT:** for a field that exists in the schema, does EVERY write
  path accept it — not just the one that happens to be exercised. `singleton-item-shape` covers the
  shape; **it does not ask whether each surface can round-trip a value.**

- **⚠ BOARDED: THE HERO AND THE WORK SECTION ARE TWO TYPOGRAPHIC SYSTEMS ON PURPOSE, AND NOTHING SAID
  SO — WHICH IS WHY A COSMETIC REQUEST COST FOUR ROUNDS.** `components/sections/hero-fonts.ts` loads
  **three faces scoped to the hero** — Fraunces (`--font-hero-display`), DM Sans (`--font-hero-sans`)
  and JetBrains Mono (`--font-hero-mono`), all `preload: false`. The rest of the site runs on
  `--font-body`, which is Work Sans.

  **⚠ BOTH PARTIES READ THE SPLIT AS DRIFT, TWICE.** "Two typefaces in one control language" assumed
  ONE system; aligning them would either break the hero's set or charge the work section for a font
  it does not otherwise load. **AN UNRECORDED DELIBERATE DIFFERENCE IS INDISTINGUISHABLE FROM
  DRIFT**, and the cost is paid by whoever looks next — here, four rounds of measurement on a
  question that had an answer nobody had written down.

  **AND "ONE SIZE" WAS THE SAME MISTAKE WEARING A DIFFERENT NUMBER.** 10px against 12.5px is not
  drift either once the systems are separate; a shared spec across two deliberately separated systems
  is the thing to avoid, not the thing to build.

  **THE TRIGGER FOR REOPENING IT IS A DESIGN DECISION, NOT A CLEANUP:** deciding the hero should not
  have its own sans. That is a mock and three faces to reconsider.

  **⚠ AND THIS ENTRY WAS THEN USED TO RULE A LATER FINDING VOID, WHICH IS THE FIRST TIME IT HAS PAID
  FOR ITSELF.** A critique reported that the page's `h1` is outranked by a section `h2` — measured and
  true: `.hero-name` renders **46 to 66px at weight 200** while the section `h2` renders **42 or 60px
  at weight 600**, so the word `Work` is larger and four weight-steps heavier than her own name, and
  **the size relation FLIPS at 1395px** because one side is `clamp(36px, 4.3vw, 66px)` and the other
  is a fixed step.

  **RULED VOID, ON THIS ENTRY'S OWN SENTENCE:** *"a shared spec across two deliberately separated
  systems is the thing to avoid, not the thing to build."* The `h1` is in the hero's set
  (`--font-hero-display`, Fraunces, hero-scoped, `preload: false`); the `h2` is in the site's
  (`--font-display`). **Comparing their weights or their sizes as one hierarchy is the same category
  error that cost four rounds the first time**, and both the reviewer and I made it — it shipped as a
  P1 in a critique before anyone re-read this entry.

  **⚠ AND THE TWO CANDIDATE FIXES WERE MEASURED BEFORE THE RULING, WHICH IS WHY IT IS A RULING RATHER
  THAN A PREFERENCE.** Lifting the name gives 68/300 against 60/600; lowering the `h2` gives 54/200
  against 44/600. **Both reintroduce the exact cancellation `wordStyle`'s 600 was added to remove** —
  a heading whose size says "more important" and whose weight says "less". So the finding had no
  fix that was not also a regression, which is itself evidence the finding was the wrong shape.

  **WHAT WAS REAL AND SHIPPED: the `h2` stepped up at `sm` (640) against a site that goes mobile at
  `lg`.** That is a convention violation rather than a hierarchy one, it was two of seven breakpoint
  sites, and fixing it removed the worst band. **What is NOT shipped and is not owed: any change to
  the hero's weight or size to agree with a system it does not belong to.**

- **⚠ RULED: THE MOBILE HERO IS ONE VIEWPORT ON A TALL PHONE AND CANNOT BE ON A SHORT ONE, AND THE
  CUE IS THE ONLY THING THAT WAS EVER AT STAKE.** The scroll cue sat **19px below the fold at
  382x828** — the one element whose entire job is to say there is more down here was the one element
  a visitor could not see.

  **THE LADDER PAID FOR IT, NOT THE ILLUSTRATION.** The gaps below the name ran 20/22/14/20/24/26,
  **126px of air in a 573px column**. Tightened one step to 20/18/12/16/18/14, reclaiming 28px, and
  the cue now clears by **9px** with the art band untouched at 300px. The illustration is the
  strongest thing in the hero and 300px of it buys more than 28px of air.

  **⚠ AND `padding-bottom` WOULD NOT HAVE MOVED IT, WHICH IS THE NON-OBVIOUS HALF.** The copy column
  is `display: block` at mobile, so `align-self: end` is inert and the cue is placed by the SUM OF
  THE GAPS ABOVE IT. Its 26px bottom padding changes the hero's height and not the cue's position —
  the obvious lever was the one that does nothing.

  **⚠ IT DOES NOT HOLD ON A SHORT PHONE, AND THAT IS STATED RATHER THAN ROUNDED AWAY.** At **382x680**
  the hero is 845px — **165px over** — and the cue is 139px under the fold. No margin ladder reaches
  that. What DOES clear the fold there is the eyebrow, the name, the tab strip and the thesis, which
  is the right priority: identity, control, promise. The support line, the callouts, the counters and
  the cue fall below.

  **SO THE REMAINING LEVER IS CONTENT, NOT CSS** — dropping the callouts or the counters on a short
  viewport. That is an owner's decision about what a phone visitor is shown first, and it is not
  taken here.

- **⚠ BOARDED WITH ITS NUMBERS: `text-subtle` FAILS ON EVERY GROUND THAT DOES NOT INVERT, AND IT IS
  THE MID-PAGE-GROUND QUESTION RATHER THAN A CONTROL QUESTION.** Forced to sapphire on the home page,
  **38 elements paint `text-subtle` and SEVEN fall below 4.5, at 1.60 to 2.34** — the work section's
  dek, the platform chips, the about copy. They fail because the role inverts to a light grey for the
  dark page while those sections' grounds STAY LIGHT (`225,222,216`, `201,182,163`).

  **NOT LIVE. Cream is published and every one of them clears there.** It becomes real the moment a
  dark palette is published, which is one field in `/studio` — the same exposure the case-study
  entry carries.

  **⚠ AND IT IS BOARDED RATHER THAN FIXED BECAUSE OF THE MEASUREMENT RECORD BEHIND IT.** Five probe
  failures in one unit; a site-wide role change built on that would be the instrument deciding the
  design.


- **⚠ BOARDED: `SegmentedGroup` CANNOT BE REUSED ON THE PUBLIC SITE, AND "REUSE IF POSSIBLE"
  RESOLVED TO NO WITH A REASON.** It is the right shape — `role="group"`, `aria-pressed`, accent
  FILL, the same contract the hero tabs and the work filter both carry — and it lives in
  `components/studio/` painting `studio-accent-500`, `studio-cream-50`, `studio-ink-950`,
  `studio-labels`, `studio-radius-control`.

  **⚠ THOSE TOKENS ARE FROZEN AGAINST THE PUBLIC THEME**, so putting it on the home page drags
  frozen colours onto a themed surface — the freeze violation `studio-ink` C10 exists to stop.

  **THE UNIT IS A PRESENTATIONAL-CORE SPLIT:** the markup and behaviour in one place, two token
  skins over it. **Not a reuse and not a copied class string** — a copy is the parallel-list defect
  in CSS, which is what #275 named its remaining consumers to avoid.

  **THE TRIGGER IS A THIRD CONSUMER.** Two exist today and both are studio; the public site would be
  the first that cannot take the tokens, which is exactly when the split earns itself.

- **⚠ BOARDED: A DARK CASE-STUDY HERO IS A DESIGN UNIT, AND IT ONCE SHIPPED FOR TWO DAYS AND WAS NOT
  MISSED.** `isWebHero` was written to render a `template: web` hero on a dark full-bleed ground —
  its own comment says the hero "owns its whole identity". It did, from **2026-08-07** to
  **2026-08-09**, and the `:root` prefix ended it. **Nobody noticed the loss for four days: not the
  owner, not a gate, not a review.**

  **⚠ THAT ABSENCE OF NOTICE IS THE ONLY DATA ANYONE HAS ABOUT THE DESIGN, WHICH IS WHY IT IS
  RECORDED RATHER THAN LEFT IN A DIFF.** A design nobody missed is not a design being restored.

  **THE TRIGGER, IF IT IS WANTED:** a mock, an owner's eye on the hero images and the watermark
  **against a dark ground**, and five light palettes measured per region. **The images were authored
  and last looked at on a light ground** — whether they read on near-black is unmeasured and is not
  a question a token can answer, which is precisely why it did not ride inside a cascade repair.

  **THE POPULATION IT WOULD COVER IS FIVE REGIONS ON TWO PAGES**, derived: the hero and any
  sole-`pullQuote` section on `fosfor-ai` and `fosfor-data-profiling`. Both emitters are
  `template: web`-gated, which is why elevate, boAt, the blog, the gallery and the home page have
  none.

- **⚠ BOARDED: A LOCAL `github` WRITE MODE AGAINST A FORK, AND TWO PENDING DRIVES ARE THE ARGUMENT.**
  Every write route no-ops unless `STUDIO_WRITE_MODE=github`, so the drivable editor paths on
  localhost number **zero** — measured as ten routes carrying the guard, not inferred.

  **⚠ AND POINTING LOCAL `github` MODE AT THE REAL REPO IS NOT THE SHORTCUT IT LOOKS LIKE.** It
  writes to the actual draft branch and its publish merges to `main`, so **a local test run reaches
  production.** The env already names `STUDIO_GITHUB_REPO` and `STUDIO_BASE_BRANCH` for this reason
  and `.env.local.example` says to aim them at a fork or scratch repo.

  **THE COST OF NOT HAVING IT IS NOW COUNTABLE RATHER THAN THEORETICAL: two collections are waiting
  on an owner at a browser** — gallery's failure paths and blog's seven steps — and both are
  currently drivable only on production, where a mistake is live. It was offered before and declined
  when nothing was queued.

  **AND THE FOUR PATHS IT WOULD UNLOCK ARE THE SAME FOUR PRODUCTION OFFERS**, so this buys safety
  rather than coverage. That is the honest scope of it.

- **⚠ A DEPLOY STATUS IS A READING WITH A TIMESTAMP, NOT A FACT — AND SO IS "MAIN IS AHEAD OF
  PRODUCTION".** Production was reported as one merge behind `main`. It was, at that moment, and the
  build was IN FLIGHT: the deployment for that merge landed at `11:01:23Z`, minutes later, with a
  success status. **The reading was correct and the claim was a state.**

  **THE HONEST FORM CARRIES THE TIME.** "Production is at X as of 10:58Z, main is at Y" is checkable
  and invites the obvious next question; "production is one merge behind" is a fact about a system
  that changes while the sentence is being written. Same defect as the deploy-throttle counts that
  carry `14:45Z` for exactly this reason — and this one was committed by someone who had just
  re-read that entry.

  **⚠ AND IT NEARLY COST A TEST RUN, WHICH IS WHY IT IS NOT MERELY PEDANTRY.** The owner was about
  to choose where to drive a seven-case failure suite on the strength of it. Driving production on
  a stale reading would have exercised the previous build and reported the results as current —
  **the wrong-subject shape arriving in a test run rather than in an assertion.**

  **TWO INSTANCES, TWO PEOPLE, ONE HOUR, BOTH ABOUT THE SUBSTRATE RATHER THAN ANY CODE.** The other
  was a local write-mode assumption: `STUDIO_WRITE_MODE=fs` no-ops EVERY write route, so the honest
  count of editor paths drivable on localhost is **zero**, not the four that reading the routes
  suggested. Measuring the GUARDS rather than the routes is what produced the right number.

  **THE PATTERN: claims about the running system age faster than claims about code, and nothing in
  this repository instruments them.** Every gate here reads the working tree.

  **⚠ BOARDED AS A GAP RATHER THAN LEFT AS A RULE ABOUT CARE, BECAUSE A RULE IS WHAT BOTH PEOPLE
  ALREADY HAD.** No suite in this repository has the RUNNING SYSTEM as its subject. `upstream.mjs`
  comes closest and is the exception that shows the shape — it is network-bound, so `run.mjs` skips
  it BY NAME and it only runs from the pre-push hook. Everything else reads files.

  **THE CHEAP FORM IS THREE READINGS NOBODY CAN TAKE SEPARATELY AND BELIEVE: local `main`,
  `origin/main`, and the deployed sha, printed together with the time they were taken.** Each is
  available today and each is individually misleading — the two errors above were both a correct
  single reading reported as a state. Printing them as one stamped row is what makes "ahead" a
  claim with a subject.

  **⚠ AND IT IS A REPORT, NOT A GATE, WHICH IS THE DESIGN DECISION.** A gate that failed when
  production lagged `main` would go red on every legitimate merge for the minutes a build takes —
  the benign-common-failure shape `upstream`'s A1 was narrowed to avoid, and the argument
  `.githooks/pre-push` already makes. **What is missing is not a refusal, it is a reading nobody
  has to assemble by hand.**

  **⚠ AND THE THIRD INSTANCE ARRIVED WITHIN THE DAY, ON THE SAME SUBJECT, AND COST A REBASE RATHER
  THAN A CLAIM.** A unit was built against a `main` that was **47 commits stale** — the owner had
  merged this very entry and authored five gallery items while the branch was open. The push was
  refused, which is the only reason anyone looked.

  **EVERY FIGURE IN THAT UNIT'S REPORT HAD BEEN TAKEN ON A ONE-ITEM COLLECTION.** Counts, renders,
  request sizes, the fact row, the empty state. **They were re-taken rather than carried forward**,
  and one claim died in the process: *"the empty state is what ships"* — true when written, false by
  the time it was read, **because it was a fact about a MOMENT written in the present tense.** The
  same defect as this entry's own subject, arriving in a deliverable rather than in a status.

  **⚠ THE CHEAP FORM COVERS THIS TOO, WHICH IS THE ARGUMENT FOR BUILDING IT.** A stamped row of
  local `main`, `origin/main` and the deployed sha, read BEFORE a unit starts rather than when its
  push fails, is the whole remedy. The reading is available today; nobody takes it because a branch
  cut an hour ago feels current, and **"feels current" is exactly the state this entry is about.**


- **⚠ BOARDED: REPLACE AS ONE COMMIT — AND IT IS BLOB-PLUS-YAML, NOT DELETE-PLUS-WRITE, WHICH IS
  WHAT MAKES IT A UNIT RATHER THAN A FLAG.** Replacing a gallery image issues TWO commits from one
  click: `upload-block-image` commits the blob, then the panel calls `saveDraft` which commits the
  entry yaml.

  **⚠ THE OLD BLOB IS NEVER DELETED, WHICH IS WHY THE ORPHAN ITEM EXISTS.** Content addressing means
  a replaced image simply stops being referenced — so there is no deletion to pair with the write,
  and the `additions` plus `deletions` shape the commit layer already has does not apply.

  **SO ONE COMMIT MEANS THE UPLOAD ROUTE OWNING THE YAML WRITE** — it would need the entry's current
  content and the serializer, neither of which it has today. **A real change with its own scope.**

  **⚠ AND IT WOULD HAVE PREVENTED NONE OF THE THREE REPORTED DEFECTS**, which is recorded here so it
  is never picked up as a small fix that closes them.

- **⚠ A CONCLUSION FROM THE WRONG PAIR, AND IT SURVIVED BECAUSE THE NUMBER WAS REAL.** Diagnosing a
  `STALE_DATA` report, two commits were measured **19 seconds apart** and that gap was used to argue
  the race was not a same-click pair but "one session outliving the branch it holds". **Both commits
  were `update site settings draft` writes with nothing to do with the replace being diagnosed.**

  **THE REPLACE FLOW IS TWO COMMITS FROM ONE CLICK**, which is what the discarded framing had said
  and what the measurement appeared to refute. **Ratified by both parties**, because 19 seconds is a
  real interval between real commits — it was simply an interval between the wrong two.

  **⚠ THE WRONG-SUBJECT SHAPE ARRIVING IN A TIMELINE RATHER THAN IN A MEASUREMENT**, and the first
  of those recorded here. Every earlier instance was a ratio, a count or a population; this was an
  ordering. **The check is the same: name the subject beside the number** — "19 seconds between
  WHICH two commits" would have failed immediately.

- **⚠ BOARDED: U2's SUBJECT IS NOT ESTABLISHED, AND THREE CENSUSES OF IT INVERTED THE ANSWER EACH
  TIME.** An author looked for a Save button on the gallery panel. What that means has been derived
  three times and been wrong three times:

      1st  "the indicator is not communicating"     — a FEEDBACK defect
      2nd  "9 surfaces show a button, 3 do not"     — a CONSISTENCY defect, opposite to the report
      3rd  counted the wrong column entirely        — 11 of 12 already render `<SaveBar>`

  **THE THIRD KILLED A RULING THAT HAD ALREADY BEEN MADE.** "The three outliers move to the SaveBar
  shape" was ruled on the second census; measured properly, only ONE panel lacks a `SaveBar`, so the
  fix would have moved eleven panels onto a shape ten already had — **work for a subject that does
  not exist.**

  **THE HONEST STATEMENT OF WHAT WAS OBSERVED**, which is smaller than any of the three: gallery has
  ONE save control that renders in one of TWO DOCKS depending on inspector state — inside the
  inspector when expanded, docked to the canvas foot when collapsed, exclusive by design. At the
  author's width it was in the dock they were not looking at. **That is neither missing feedback nor
  missing consistency. It is one control, correctly placed twice, and an author who does not know it
  moves.**

  **⚠ NOTHING IS BUILT UNTIL SOMEBODY OPENS THE PANEL AT BOTH WIDTHS.** One browser observation
  settles whether the dock move is findable, and therefore whether there is a unit here at all —
  and this record already carries four collections' worth of evidence that only a person at a
  browser finds this class.

  **THE THREE INVERSIONS ARE NAMED SO NOBODY RE-DERIVES THE FIRST ONE.** A census that has been
  wrong three times is not a census anyone should read the top line of.

- **⚠ AND ONE PANEL OF TWELVE HAS NO `SaveBar`, WHICH IS A SEPARATE AND SMALLER FACT.**
  `BlogEditPanel` renders a `SaveIndicator` and no save bar; the other eleven render one. **Whether
  it wants one is its own question**, and stating it inside U2 is what produced the second census's
  wrong shape — a small true fact absorbed into a large false one.



- **⚠ THE GALLERY HERO TOOK `/gallery` FROM 4 ABOVE-THE-FOLD IMAGE REQUESTS TO 9, AND NO `sizes`
  FIXES THAT — BOARDED WITH THE MEASUREMENT.** The strip's five frames and the masonry's four eager
  tiles are the same ITEMS and never the same URLs, so nothing is shared between them.

      strip, sizes="170px"      5 x w=384   40,470 B      <- shipped
      strip, masonry's sizes    5 x w=640   87,215 B         the browser reads `sizes`, never the box
      EAGER_TILES = 4           4 x w=640   69,772 B

  **`EAGER_TILES` IS BELOW THE HAIRLINE AND WAS DELIBERATELY NOT TOUCHED.** Lowering it is the
  obvious claw-back and it is a masonry decision with its own reasoning — a row that is eager
  because it is the first row a reader sees. **The trigger is the collection reaching a size where
  the strip and the first row show different items**, at which point the eager row is paying for
  content the hero has already loaded.

- **⚠ THE ORPHAN POPULATION IS ELEVEN, NOT TWO — AND THE PRECONDITION FOR A GC IS NOW BUILT AND
  MEASURED RATHER THAN ARGUED.** `ralph/tests/image-orphans.mjs` walks by PATH:

      32 block images on disk   ·   21 live   ·   11 orphaned
      2 shared basenames, not 1

  **⚠ THE SECOND PAIR IS WITHIN ONE COLLECTION AND NOBODY HAD LOOKED.** `edaa53ebfee8` sits under
  `gallery/akshita` AND `gallery/waves` — the same photograph uploaded to two gallery items, bytes
  verified identical. The record knew only about `926214f008d6` crossing gallery and blog. **A
  hash-keyed GC would collect one of a pair and delete the other's copy**, and `C3` fails if that
  hazard's population ever reads empty, because a warning nobody can trigger is one the next author
  deletes.

  **⚠ AND `edaa53ebfee8` IS SAFE BY LUCK RATHER THAN BY RULE — BOTH ITS COPIES ARE ORPHANED.**
  Referencing either one makes the other unsafe, with no edit anywhere near it. The report prints
  every shared basename live-or-not for exactly that reason; `unsafeToDeleteByName` only sees pairs
  where one side is already live.

  **⚠ THE WALK'S BOUNDARY WAS THE OTHER HALF, AND A CONTENT-ONLY GC WOULD HAVE DELETED TWO LIVE
  FILES.** `app/dev` harness pages reference project block images directly — 20 live paths in
  `content`, two more in `app`. Same shape as the `.tsx`-only sweep that missed 81 rung references,
  caught here BEFORE the tool that would have acted on it existed. `A3` asserts the `app` part is
  non-empty by name.

  **⚠ AND THE CENSUS READ ITS OWN LEAF'S EXAMPLE PATH AS A LIVE REFERENCE ON ITS FIRST RUN — SECOND
  INSTANCE TODAY.** `image-reachability.ts` documents its input with `…/blocks/abc123.webp`, and the
  walk counted it. **The failure direction is the dangerous one: a comment cannot make a file an
  orphan, only make an orphan look LIVE** — so had the example named a real file, this census would
  have protected it from deletion forever and nothing would have gone red. `B2` caught it only
  because the example was invented. Third tool today to need comment-blanking, which is now the
  default for any scanner over source.

  **NOTHING IS DELETED AND THAT IS DELIBERATE.** An orphan is not a defect — it is a replaced image
  whose bytes stopped being referenced, which content addressing makes free to leave. **What was
  missing was the reachability rule, and that is what this is.**

  **THE BOARDED FRAMING, KEPT BECAUSE ITS ARGUMENT IS WHY THE RULE IS PATH-KEYED:**

- **⚠ THE SECOND ORPHANED GALLERY BLOB, BOARDED WITH THE IMAGE GC — AND CROSS-REFERENCED, BECAUSE A
  GC MATCHING ON HASHES WOULD DELETE A FILE ANOTHER COLLECTION IS USING.**
  `public/images/gallery/akshita/blocks/926214f008d6.webp` is unreferenced and stays so; the other
  orphan is recovered by re-upload at no storage cost. **Its hash is ALSO the hash of a live blog
  image**, because content addressing gives identical bytes an identical hash under different
  paths. **The path-not-hash entry is the precondition for building the GC at all** — a GC written
  against hashes would have deleted the blog's copy while "collecting" the gallery's.

- **⚠ CLOSED, AND IT WAS A FALSE CLAIM SITTING ON `main` UNTIL THE BOARD CENSUS FOUND IT.** This read
  *"blog and gallery are ABSENT from studio search"*. Measured: `buildStudioSearchIndex` takes a
  `Record<CollectionName, readonly SearchSource[]>` and the layout passes all four, so a fifth
  collection is a compile error rather than a silent omission. **The header comment was the last
  thing carrying the old scope and it was corrected in #558.**

  **⚠ EIGHTH CARRIED ITEM TO EXPIRE, AND THE FIRST FOUND BY AN INSTRUMENT RATHER THAN BY SOMEBODY
  READING.** The other seven were noticed while doing adjacent work. **This is the argument for the
  board gate stated as a result rather than as a prediction.**

  **THE ORIGINAL FINDING, KEPT BECAUSE `git log -S` IS WHAT SETTLED IT:**

- **⚠ BLOG AND GALLERY WERE ABSENT FROM STUDIO SEARCH, AND IT WAS AN OMISSION RATHER THAN A DECISION —
  SETTLED BY `git log -S` RATHER THAN BY READING THE HEADER.** `buildStudioSearchIndex` takes
  `{projects, experience, skills}`.

      search index created   2026-07-07
      blog collection added  2026-07-26   never added to it
      gallery                added later, likewise

  **`git log -S "blog"` on that file returns NOTHING — the word has never appeared in it.** So the
  header's *"Scope: settings sections + experience + projects + skills"* is not a decision anyone
  took about blog; it is a description written before blog existed and never revisited. **A comment
  describing a smaller scope reads as a boundary somebody chose**, which is the `structural()` shape
  arriving in prose rather than in a helper.

  **NOT FIXED HERE, BECAUSE THE SUBJECT IS THE SEARCH AND NOT THE GALLERY.** Two collections are
  missing and the fix is one change to a shared index; scoping it to gallery would fix it once per
  collection, which is the boarding this file already carries for `useDraftForm`'s feedback.

- **⚠ CLOSED BY THE BOARD GATE ON ITS FIRST RUN, AND THE PREMISE WAS FALSE WHEN IT WAS WRITTEN.**
  This entry said *"There is no Save draft button on the gallery panel and none is planned — blur
  saves, per the locked convention, and blog's post panel has none either"*, and ruled **DO NOT SHIP
  A BUTTON**. Measured:

      GalleryEditPanel   renders `primary={{ label: "Save draft", onClick: form.saveDraft }}`
      arrived in         b64ec2e — #532, THE PR THIS ENTRY CITES AS THE CORRECT FIX
      panels with one    NINE, including blog's blocks panel

  **⚠ THE RULING FORBADE SHIPPING A CONTROL THAT WAS ALREADY SHIPPED, BY THE CHANGE THE ENTRY
  ITSELF HELD UP AS THE RIGHT ONE.** The convention is not blur-alone — it is a `SaveBar` carrying a
  Save draft primary AND blur saves, on nine of twelve panels. The entry described a studio that did
  not exist.

  **WHAT SURVIVES IS THE QUESTION, WHICH IS U2's AND NOT THIS ENTRY'S:** an author went looking for
  something that was on screen, which is a discoverability finding rather than a missing affordance.
  U2 already owns it, already records three inverted censuses of it, and already says the answer
  needs one person at a browser.

  **⚠ AND THIS IS THE ARGUMENT FOR THE GATE STATED AS A RESULT.** Two people read this entry
  repeatedly across an arc, one of them wrote it, and its central factual claim was refutable by a
  single grep the whole time. **Nothing had the board as its subject, so nobody ran that grep.**

  **THE ORIGINAL FRAMING, KEPT BECAUSE THE FEEDBACK ARGUMENT IS SOUND AND ONLY ITS PREMISE WAS NOT:**

- **⚠ SUPERSEDED: AN AUTHOR LOOKED FOR A SAVE BUTTON, AND THE QUESTION IS THE FINDING. THE DEFECT IS
  FEEDBACK, IT IS STUDIO-WIDE, AND IT IS NOT GALLERY'S.** There is no Save draft button on the
  gallery panel and none is planned — blur saves, per the locked convention, and blog's post panel
  has none either. **The convention is right and is not the question.**

  **THE QUESTION IS WHY SOMEONE WENT LOOKING.** If an author reaches for a button, the indicator is
  not saying clearly enough that the work is already saved. `SaveIndicator` reports `saving` and
  `dirty` and the pill reports standing state, and between them an author still could not tell that
  a blur had committed.

  **⚠ DO NOT SHIP A BUTTON. IT WOULD CLOSE THE REPORT AND LEAVE THE CAUSE** — the same trade the
  fold defect nearly got, where a Save control would have been added to a panel that already saved
  while the missing composition stayed. This arc has that shape four times now: **an owner reports
  the missing affordance, and the fix is always upstream of the symptom.**

  **THE SUBJECT IS EVERY PANEL THAT SAVES ON BLUR, NOT THE GALLERY.** Scoping it to the surface
  where it was noticed is how the same defect gets fixed once per collection — and the studio has
  three editors plus the settings panels all sharing `useDraftForm`. **The unit is a census of what
  each surface tells an author after a blur**, before any change to any of them.

- **⚠ A SOURCE REGEX CANNOT SEE REACHABILITY, AND THE STANDING ANSWER FOR ANY ASSERTION ABOUT COPY
  IS TO EXTRACT AND CALL.** `PublishBar`'s status sentence was a ternary chain guarded by regexes
  over that component. Setting the first-failure binding to `null` makes the per-entry sentence
  **unreachable while leaving every word of it in the file** — three rows stayed green.

  **PRESENCE AND RESOLUTION ARE DIFFERENT QUANTITIES**, which this file already records against a
  bundle grep that "verified" two shadowed CSS values by proving both present when the question was
  which one resolved. **A string in a file and a string on screen are not the same claim.**

  **THE REPAIR IS `bar-clearance.ts`'s AND IT IS NOW THE DEFAULT:** move the branching into a pure
  function, call it with real inputs, assert the returned string. `lib/studio/draft-status-text.ts`
  is the second instance, and the identical mutation now turns three rows red.

  **⚠ AND THE SAME QUESTION IS OWED OF EVERY OTHER MESSAGE-PRESENCE ROW. COUNTED, NOT FIXED: SIX
  ROWS ACROSS THREE SUITES** assert that a user-facing sentence exists in a source file —
  `studio-index` (four: the reorder hint, two empty states, the homepage-order line), `studio-ink`
  (the sections error and its retry), and `studio-save-bar` (the autosave title, per surface). Each
  proves the words are in the file and none proves a reader can reach them.

  **⚠ THE ASYMMETRY IS THE USEFUL PART: ABSENCE-BY-REGEX IS SOUND AND PRESENCE-BY-REGEX IS NOT.**
  `hero-contract-copy` asserts two strings are GONE, and that direction holds — if the words are not
  in the file, nothing can render them. Only the presence direction needs the extraction.

- **⚠ THE `.tsx` COMMENT STRIP IS CLOSED FOR `cascade-public`, AND THE HEADLINE IS THE ASYMMETRY
  RATHER THAN THE SEVEN INSTANCES.** One suite carried TWO scanners over two languages. The CSS side
  blanked comments before parsing and its own note called the order load-bearing, because a construct
  named inside prose reconfigures the parser. **The JSX side read raw source.** That is a coverage
  difference INSIDE A SINGLE FILE, and it produced **seven false positives against zero measured
  cost** — the last of them a note explaining that a heading's family utility was inert, which made
  the count go UP.

  **THE COST WAS MEASURED BEFORE THE CHANGE, NOT ARGUED AFTER IT.** Blanking left the census output
  byte-identical — 4 public collisions and 19 inert, unchanged — across 178 files.

  **⚠ AND IT FINDS MORE THAN IT REMOVES, WHICH WAS NOT THE POINT.** A `>` inside an
  attribute-position comment terminated the raw element match early, so a real class after it was
  never seen. Sixty files carry such a comment.

  **THE BODY IS BLANKED AND NOT DELETED, AND A MUTATION IS WHY THAT IS ASSERTED.** `line` is computed
  from the match index, so deleting would shift every reported line after the first comment in a
  file. **The first fixture could not tell the two apart** — its comment was one line, so deletion
  removed no newline and the line row passed under a mutation that replaced blanking with deletion.
  A three-line fixture fires both. That is the *assertion that cannot fail for the reason it names*,
  caught by mutation rather than by reading.

  **⚠ THE TDZ SHAPE ARRIVED FOR THE THIRD TIME, IN THE FIXTURE.** The block called `elements()` above
  `COMPONENT_TAG`'s declaration, which parses perfectly and throws at run time. `node --check` sees
  none of it. Running the row is the only thing that does.

  **SCOPED TO ONE SCANNER, DELIBERATELY.** `colour-census` also reads `.tsx` and its subject is
  colour LITERALS rather than elements — a different question with a different blast radius, and the
  precedent is `css-comment-trap`'s reverted string-blanking, which was right as an idea and broke
  five assertions that read string contents. **That half is still open and is the trigger for the
  next look: a comment naming a colour is still counted as a colour.**



- **Content. Writing posts through /studio, AND THE EXERCISE HAS NOW PAID FOR ITSELF TWICE IN ONE
  SESSION.** It was ranked highest on the argument that three defects came from an author using the
  editor and none from a gate. Both of this session's results were produced by an author using it,
  and neither could have come from anywhere else.

  **⚠ ONE IS A DEFECT IN THE EDITOR ITSELF.** The blog status control set a field and asked to save in
  the same tick, the hook's latest-values ref was only written on render, the dirty check read
  pre-click values and **returned without saving** — silently, with no Save button on that panel to
  rescue it. A post could be set to Published and stay a draft through publish and deploy. Found by
  the owner reporting the symptom, then by reading the commit history: **every studio commit touching
  that post was blocks or images and none ever changed status.**

  **⚠ THE OTHER IS `raster-grounds` A4's FIRST LIVE CATCH, AND THAT IS THE ARGUMENT MADE BY EVIDENCE.**
  A4 was built after the Fosfor illustration was found with cream's ground baked in — **pre-existing
  and revealed rather than caused.** An uploaded hero measured **50.6% within tolerance of a site
  ground**, caught **on the day it arrived and before the post published**. Not a defect in /studio,
  which worked exactly as designed: **a defect only an author using the editor can create, caught in
  the one place a gate could see it.**

  **THE RULING IS A REDRAW WITH A TRANSPARENT BACKGROUND, AND MAIN SITS RED UNTIL THE ASSET ARRIVES.**
  That is the gate working. A `KNOWN` entry to make it green would be the escape hatch, and its end
  condition would be **a promise rather than a trigger** — the one shape that registry refuses. The
  cheaper route to green is to drop `heroImage` back to null and re-upload when the redraw exists,
  since the post is a draft and the field is optional. **Removing an asset that is not ready is not an
  exemption.**

  **⚠ ALL THREE CLAIMS ABOVE ARE CLOSED, AND ALL THREE WERE STILL BEING CARRIED AS OPEN.** Measured on
  `main`: the hero was re-uploaded in `add04fb` and **`raster-grounds` passes 11 of 11**, so main is
  green and the redraw arrived. The status control **works** — `52ef514 chore(studio): update
  blog/<slug> draft`, the head-field path with no noun, is the commit that flipped `status: draft`
  to `published`, which refutes *"every studio commit touching that post was blocks or images and
  none ever changed status"* by naming the one that did. And the post was **published, not a draft**.

  **⚠ THE ITEM RANKED THE WORK AND EVERY PREMISE UNDER IT HAD EXPIRED.** Third time this pattern has
  cost an ordering, after the experience descriptions and the published-post count. **The entries
  most likely to be wrong are still the ones nobody has touched.**
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

## Recorded

⚠ **CLOSED FINDINGS, KEPT FOR THEIR REASONING RATHER THAN THEIR STATUS.** Nothing here needs doing.
Every entry is here because the REASON it was closed is worth more than the fact — the wrong turn
that was taken, the measurement that settled it, the shape it turned out to be an instance of.

⚠ **AND THEY ARE NOT ARCHIVED, DELETED OR SUMMARISED.** This file's own recurring defect is a claim
that ages into being false while still reading as verification; summarising a closed finding is how
its measurement gets separated from its conclusion. Moving one back to `Open` is legitimate the
moment it grows an action again.

- **⚠ THREE INSTRUMENTS WERE WRONG IN ONE INVESTIGATION AND EACH ONE ANSWERED A QUESTION NOBODY
  ASKED — `PORTABLE.md` RULE 37, AND THIS IS THE INSTANCE IT WAS EXTRACTED FROM.** The subject was
  whether `.palette-rail` covers the hero tab strip. Three readings, three verdicts, and the first
  two were confidently wrong in opposite directions.

      rect comparison        "2px of overlap"     REAL-LOOKING, and the rule's own comment had
                                                  already predicted a rect overlap is a false alarm
      elementFromPoint       "0 covered, clean"   FIXED BY CONSTRUCTION — see below
      elementsFromPoint      "11 covered points"  the answer, all of them `What I'm up to`

  **⚠ THE MIDDLE ONE IS THE ENTRY. `elementFromPoint` RETURNS THE TOPMOST ELEMENT**, so sweeping the
  rail's own footprint and asking whether a tab button is there is answered by the RAIL, every
  point, always. **A zero was guaranteed before the probe ran**, and it read as a clean bill of
  health — I reported *"nothing to fix"* on it. `elementsFromPoint`, which returns the whole stack,
  found the coverage on its first pass.

  **THE ASSERTION-THAT-CANNOT-FAIL SHAPE, ARRIVING IN A PROBE RATHER THAN IN A SUITE.** Every
  earlier instance in this record lives inside `ralph` and every one was found by mutation.
  **Nothing mutates a probe**, so the only defence is the question this file already states — ask
  what would have to change for this to come out differently, and if the answer is nothing, the
  reading is not a reading.

  **⚠ AND WRITING THIS ENTRY TRIPPED THE FILE'S OWN RULE 16, WHICH IS WHY THERE IS NO COUNT IN THE
  PARAGRAPH ABOVE.** It first read *"twelve instances"*, cited from the headline entry at the
  unfalsifiable-rows section. **The file disagrees with itself** — that entry says TWELVE and the
  unpublished-disclosure entry says *"thirteenth unfalsifiable row this session"*. Neither was
  re-derived here, so the number is left out rather than a contested figure being carried forward
  into a third place.

  **⚠ AND THE THIRD AROSE WHILE VERIFYING THE FIX HAD SHIPPED.** A search of the served stylesheet
  for the new custom property returned **0**, which would have meant a live `var()` resolving to
  nothing and the strip's width falling back. The home page loads **three** CSS chunks and the
  search read the first. The declaration was in the second. **Same family as the unquoted glob that
  once returned a zero with a destructive edit waiting on it** — an absence is evidence only if the
  search could have found the thing.

  **THE PAIR THAT MAKES IT A RULE RATHER THAN THREE MISTAKES IS ALREADY IN THIS FILE, FROM THE
  OPPOSITE SIDE.** A bundle grep once "verified" two shadowed CSS values by proving both PRESENT
  when the question was which one RESOLVED. **There the question was the winner and the tool
  enumerated. Here the question was the members and the tool resolved.** Every tool answers one of
  those two, and the output looks identical either way.

- **⚠ CLOSED: THE WORK CARDS ARE REDRAWN, AND THE GATE THAT SAID SO WAS THE ENTRY'S OWN CONDITION.**
  This was boarded with `holds_while: boat-crest.yaml has heroImage`, and the note predicted its own
  end — *"if the key goes, somebody has taken one of the two routes."* Four hours later the key went
  and `board-decay` B2 named the ENTRY rather than the code. **Fourth firing, and the second where the
  author closing the item is the one who tripped it.**

  **THE SPLIT THAT MADE IT BUILDABLE:** the ground and the plate edge take ROLE TOKENS and theme
  across all nine palettes; everything inside the plate is the product's own colours as literals.
  That satisfies the specificity critique and the artwork-by-file rule at once, which is why neither
  of the two remedies offered separately was right.

  **AND THE PLATE'S SHAPE CARRIES THE PLATFORM, WHICH THE UPLOADS HAD NO ROOM FOR.** Two of the four
  products are phones and two are desktop apps, so a portrait plate and a landscape plate say so
  before a reader reaches the `MOBILE` or `WEB` tag beneath. **The set reads as four products rather
  than four crops of one recipe** — which was the whole of the finding.

  **⚠ AND `colour-census` J5 CAUGHT THE SECOND HALF, WHICH NOTHING ELSE WOULD HAVE.** The boundary
  row declared `count: 77` and the census found **118**. More depiction means more literals; the
  count moved and **the row's prose, which said "77 of the site's 82" in two places, moved with it.**
  Updating only the field would have left a sentence a reader trusts stating a figure nothing checks.

  **⚠ RULED BY THE OWNER, AT TRUE SIZE, AND THE CONDITIONAL IS CLOSED.** This entry first read *"if
  the drawn cards are judged worse than the photographs"*. They were judged — all eight images shown
  before and after at identical size on a colourless ground, so neither column was flattered — and
  **the drawings are kept.** Recorded because an open conditional is an invitation for a fourth
  critique to re-litigate a decision that has already been made.

  **THE HONEST STATEMENT OF THE TRADE, WHICH THE SHEET MADE PLAIN AND PROSE COULD NOT:** the uploads
  have more FINISH — real screenshots, depth, gloss — and the drawings have more FIT. Preferring the
  photographs would have been a legitimate position, which is why the comparison was built rather
  than argued.

  **⚠ AND "THE FOUR UPLOADS ARE NOW ORPHANED" WAS HALF WRONG, IN THE MERGED COMMIT MESSAGE.** Two of
  them are still LIVE, as fixtures in the gallery dev harness:

      boat-crest/heroImage.webp     app/dev/gallery:50, app/dev/gallery-parity:60   LIVE
      fosfor-ai/heroImage.webp      app/dev/gallery:48, app/dev/gallery-parity:58   LIVE
      fosfor-data-profiling         0 references                                    orphan
      elevate-one-view              0 references                                    orphan

  **SO DELETING THE FOUR WOULD BREAK TWO DEV ROUTES**, and that is the exact hazard `image-orphans`'
  own header records — *"a GC scoped to content would delete two files something loads"* — arriving
  on a different file set within the week.

  **⚠ AND `image-orphans` COVERS NONE OF THEM, WHICH IS THE PART WORTH KEEPING.** Its `PATH_RE`
  matches `/images/**/blocks/<hash>.webp` only, so a `heroImage` was never in its subject. The census
  read **33 on disk, 22 live, 11 orphaned both before and after four files stopped being referenced**
  — an unchanged number over a changed world. A suite whose figure cannot move for the thing you just
  did is not covering it, and the tell was that the count did not move.

- **⚠ CLOSED: THE WORK FILTER WRAPS — AND THE TRIGGER THAT CLOSED IT IS NOT THE ONE THE BOARD
  NAMED.** The entry read *"three fit, four would overflow rather than wrap"* and set the trigger at
  a FOURTH CHIP. Measured at 382x828 the group is **310px wide with 28px of headroom**, so the
  board's own trigger has still never fired.

  **WHAT CLOSED IT WAS A SECOND ROUTE TO THE SAME OVERFLOW, FOUND WHILE MEASURING SOMETHING ELSE.**
  The labels carry their counts — `All 4`, `Web 2`, `Mobile 2` — so the group grows with the
  COLLECTION as well as with the category list. A fifth case study keeps every chip the same width;
  a **two-digit** count widens all three at once. At 320px they already sit within 10px of the edge.

  **⚠ A BOARD TRIGGER IS A PREDICTION, AND THIS ONE NAMED THE WRONG VARIABLE.** It watched the
  number of CATEGORIES; the thing that moves the width first is the number of PROJECTS. Both are
  latent, neither has fired, and one line closes both — `.work-filter` now carries the
  `flex-wrap: wrap` and `max-width: 100%` that `.hero-tabs` has always had.

  **AND THE GATE IS WHAT SAID SO.** `board-decay` B2 went red on this entry the moment the property
  landed, naming the ENTRY rather than the code, which is its third firing and the second where the
  author closing the item was the one who tripped it.

- **⚠ MOVED FROM `Open` BY THE BOARD'S OWN MEMBERSHIP RULE — CLOSED FINDINGS SITTING IN THE ACTION
  LIST.** Three entries were marked CLOSED and left under `Open`, each with the superseded framing it
  replaced kept beneath it. **The rule says an entry belongs in `Open` only if it carries an action**,
  and the pairing convention made them read as live work. Found by the board census, which is the
  first thing to have the board as its subject.

- **⚠ EVERY RALPH FIGURE QUOTED THIS SESSION WAS LOW BY EIGHT, AND THE CAUSE WAS A LITERAL IN A
  SUMMARY LINE.** `studio-index` ended with ``result: ${50 - failures} passed`` — a hand-maintained
  constant. **On `main` it printed 58 rows and claimed 50**, and `ralph/run.mjs` reads that number,
  so the headline every report in this session carried was understated. **3487 is the first honest
  one.**

  **⚠ AND A HAND COUNT COULD NEVER HAVE TRACKED IT, WHICH IS WHAT MAKES THIS A MECHANISM RATHER THAN
  TIDINESS.** The file has **52 line-anchored `t("` call sites and prints 60 rows**, because some are
  emitted from LOOPS. **The literal was not merely un-maintained — it was counting a different
  quantity from the one it named.** Same shape as the `rich-markers` undercount, and the same
  answer: derive it.

  **⚠ TWO OF THE THREE SUITES CARRYING THE SHAPE WERE CORRECT TODAY, WHICH IS EXACTLY HOW THE THIRD
  GOT THERE.** That is the argument for deriving all three rather than fixing the one that drifted —
  a literal that happens to be right is a literal waiting for its next row.

  **THE REACH IS BACKWARDS, WHICH IS THE PART WORTH REMEMBERING.** No gate was wrong and no assertion
  failed. A reported TOTAL was wrong, quoted forward in every report, and **nothing in this
  repository has a reported total as its subject.**

- **⚠ AN EXTRACTION MUST CARRY ITS OLD COVERAGE FORWARD — AND THIS ONE DELETED IT SILENTLY, WHICH IS
  THE FIFTH LEAF-PROVEN-CALL-UNASSERTED INSTANCE AND THE FIRST WHERE THE REFACTOR *CREATED* THE
  GAP.** Six presence rows were replaced by calls to `lib/studio/studio-copy.ts`. The sentences moved
  out of the components, **the old presence regexes went with them, and nothing replaced them.**

      inverting `filtering: true` at the call site        caught by NOTHING, 0 rows red / 99 suites
      inverting `collectionEmpty: true` at the call site  caught by NOTHING, likewise

  **TWO CALL SITES, ONE EXTRACTION, BOTH UNCOVERED — so the gap is a property of the refactor rather
  than of one careless line**, which is the argument for checking every call a new leaf gains rather
  than the one that looks risky.

  **THE SHARPER RULE: A PRESENCE ROW DELETED BY A REFACTOR IS COVERAGE REMOVED SILENTLY.** The four
  earlier instances INHERITED a gap that was already there; this one made a suite weaker while every
  row stayed green and the assertion total went UP.

- **⚠ AND TWO PLAUSIBLE EXTRACTIONS IN THAT SAME UNIT WOULD HAVE CHANGED WHAT A READER SEES, BOTH
  CAUGHT BY READING THE JSX RATHER THAN THE ASSERTION.** Byte-identical was the instruction and it
  is why they were found before shipping:

      the empty state    renders `No case studies match <b>{query}</b>.` — a finished sentence
                         would have DROPPED THE QUERY ECHO
      the autosave title is a PREFIX plus a PER-SURFACE TAIL. Measured, eleven surfaces carry FOUR
                         tails — 6 "Publish from the Hero panel.", 3 "Publish from Site settings.",
                         1 "…the bar below.", 1 "Preview to see it."

  **A SINGLE CONSTANT WOULD HAVE TOLD SIX PANELS TO PUBLISH FROM A BAR THEY DO NOT HAVE.**

  **⚠ THE ROW ONLY EVER MATCHED THE PREFIX, SO AN EXTRACTION SCOPED FROM IT INHERITED ITS
  BLINDNESS.** `C2` asserted ``title="Auto-saves to draft on blur.`` and nothing more, and the shared
  half read as the whole sentence. **An assertion that matches a PREFIX tells you nothing about the
  rest of the string** — and the useful half was the part it never looked at, since each tail names
  where that surface's publish control actually is.

- **⚠ THE `.tsx` COMMENT STRIP IS CLOSED FOR `colour-census` TOO, AND THE COUNT DID NOT MOVE WHILE
  NINE ATTRIBUTIONS DID.** Route C had stripped comments since #362; route B and the `consumersOf`
  walk read raw. Measured **by identity rather than by count**, as the `cascade-public` strip taught:

      route B (SVG colour attributes)   80 before, 80 after, IDENTICAL PAIRS — no comment in a
                                        public file carries one. A latent trap with an empty
                                        population, closed anyway because a suite carrying two
                                        scanners over one language with different comment handling
                                        is the asymmetry that arc was repaired for
      consumersOf                       410 utilities, 303 files, NINE change their consumer set,
                                        and NONE becomes an orphan

  **SO NO VERDICT MOVED AND NINE ATTRIBUTIONS WERE WRONG** — which a total could never have shown,
  and which is why the identity comparison was the instruction rather than the totals.

  **⚠ AND FOUR OF THE NINE CREDITED A STUDIO FILE FOR A PUBLIC UTILITY.** `max-w-[68ch]` was
  attributed to `BlogBlocksEditPanel.tsx` by a comment while every real consumer is public;
  `aspect-[16/9]`, `min-h-[520px]` and `mt-[44px]` are the same shape. **This census's own rule is
  that cost is an emission question and themeability a consumption one — and the consumption side
  was reading prose.**

  **THE BLANKING IS ASSERTED, BECAUSE A CHANGE THAT MOVES NO TOTAL IS ONE THE NEXT AUTHOR REVERTS BY
  ACCIDENT.** `A0a` proves the fixture still holds, `A0b` that the comment-only file is not a
  consumer, `A0c` that the class still has real ones — so the row cannot pass on an empty set.

- **⚠ A LOUD REFUSAL WHOSE LAST LINE IS BLANK IS A SILENT ONE — THE TENTH DEFECT IN `mutate.mjs`,
  AND IT IS A FORMATTING CHOICE WITH A VERDICT RIDING ON IT.** Every refusal printed a clear
  multi-line message and exited 2. Measured: **264 bytes.** An operator still read an unrun mutation
  as a result, because the command was piped to `tail -1` — this repository's standing habit — and
  the refusal's last line was **empty**.

  **THE SUITE WAS THEN RUN AND PASSED, BECAUSE NOTHING HAD BEEN APPLIED, AND THAT PASS READ AS THE
  GATE SURVIVING.** The exact false negative this tool exists to make impossible, arriving through
  the FORMATTING of a correct refusal rather than through its logic.

  **⚠ THE OPERATOR'S HABIT IS NOT THE THING TO FIX.** *"Capture the exit code"* is written down here
  and was written down before today; it has now failed three times. **Only a mechanism prevents a
  failure mode** — so the LAST LINE of every refusal is a self-contained sentence, and whatever
  slice of the output anyone looks at, the final line says the tool did nothing.

  **⚠ AND THE REPAIR NEARLY SHIPPED A TEMPORAL DEAD ZONE, THE FOURTH IN THIS FILE'S HISTORY.**
  `bail` was declared beside the edit machinery and called by `--restore` three hundred lines above.
  `node --check` **parses that perfectly**; `--restore` with no snapshot crashed with a
  `ReferenceError` instead of refusing. Caught by RUNNING the branch — the specific state that
  reaches the new code, which is the rule this file already states about guards added to branches.

  **⚠ AND THE FILE'S OWN HEADER ADVERTISED WORK THAT WAS ALREADY DONE.** It read *"NEXT UNIT ON THIS
  FILE: THE TOOL OWNS THE WHOLE EDIT. RAISED FROM BOARDED, ON THE COUNT"* and listed EIGHT defects.
  The tool has owned the edit since `--edit` began recording `before` bytes. **Re-derived one by one
  against the code: 2, 3 and 4 were all closed** — the explicit-snapshot step, `.clean-at-snapshot`,
  and a second restore refusing loudly. **So "four of nine remain in the snapshot mechanism" was a
  carried figure that had expired**, and it had already scoped a session's work.

  **⚠ A STALE COMMENT MISLEADS A READER; A STALE `NEXT UNIT` MISLEADS WHOEVER PICKS THE WORK.** And
  the inner ledger listing defect 3 as NOT CLOSED was accurate about **what one change reached** and
  was read as **what remained open** — a list scoped to one change reads as a list of the whole
  subject to everybody who arrives later. It is kept, with that named.

- **⚠ THE SUITE THAT TESTS THE MUTATION TOOL DELETED THE OPERATOR'S PENDING MUTATIONS, ON EVERY
  FULL RALPH RUN — ELEVENTH DEFECT IN THIS MECHANISM AND THE FIRST WHERE THE HARNESS WAS THE
  AGENT.** `mutate.mjs` keys its edit manifest off `TMPDIR`; `mutate-harness` section B applies real
  edits and its `finally` ran `rmSync` on that exact file; `ralph/run.mjs` runs the suite. **So an
  operator who ran the gate while holding a mutation lost the record of it — the mutation staying in
  the tree with nothing able to revert it precisely.** The tool's own worst outcome, produced by its
  test.

  **⚠ FOUND BY IT HAPPENING TWICE IN ONE SESSION, AND MISREAD THE FIRST TIME.** A mutation was
  applied to `mutate.mjs`, the harness was run to watch the new rows go red, and **they passed** —
  because the suite had reverted and forgotten the mutation before they could see it. That reads
  exactly like a weak assertion. **The second occurrence is what made it a mechanism rather than a
  fluke**, and the tell was `--revert-edit` reporting *no recorded edits* seconds after a successful
  `--edit`.

  **⚠ AND THE HEADER SAID THE OPPOSITE, IN THE AGED-OUT VARIETY.** *"The apply-and-revert round trip
  is deliberately NOT here … what belongs in CI is the half that cannot damage anything."* True when
  written; false from the moment B5 to B7 arrived. **Second aged-out instance this week**, after
  `splitAtBody`.

  **THE BOUNDS ARE NOW STATED RATHER THAN THE ABSENCE CLAIMED.** The FILE was always bounded —
  section B holds the original bytes and rewrites them in a `finally`. **The MANIFEST had no bound
  at all**, which is the half nobody wrote down because nobody had thought of it as state. Every
  invocation now runs against a sandbox `TMPDIR` and `D6` asserts the operator's was untouched.

  **⚠ AN ISOLATION CLAIM THAT CANNOT FAIL IS NOT AN ISOLATION CLAIM.** Had `TMPDIR` not been
  honoured, every row would have passed identically against the operator's manifest — which is
  precisely how this hid. `D6` names the sandbox rather than asserting an outcome that both worlds
  produce.

  **⚠ RULED: B5 TO B7 DO NOT WRITE TO A TRACKED FILE, AND THE ARGUMENT IS THE `finally` ITSELF.**
  The file bound was the suite holding the original bytes and rewriting them in a `finally` — which
  is only as good as the `finally`, **and a `finally` is exactly what a row throwing early
  defeats.** A suite that writes to a tracked path is one crash away from a dirty tree that every
  later gate then measures.

  **THE FIXTURE LIVES OUTSIDE THE REPOSITORY, so a crash at any point leaves the tree clean BY
  CONSTRUCTION rather than by cleanup.** `B4a` asserts it.

  **⚠ AND A TEMP FILE INSIDE THE REPO WOULD NOT HAVE WORKED, WHICH IS THE NON-OBVIOUS HALF.** An
  untracked file in the tree IS dirty-and-unsnapshotted, so `--edit` refuses it — correctly — and
  the rows would fail on the tool being right. **A file git has never heard of is not in
  `dirtyFiles()` at all**, so the check has nothing to object to. Measured end to end before it
  shipped rather than reasoned about: edit applied, revert exact, repo tree clean.

  **B1, B2 AND C1 KEEP THE DERIVED TRACKED FILE, because they REFUSE before writing.** Moving them
  would be widening a fix past its subject.

- **⚠ THE PRE-PUSH HOOK CAUGHT A BRANCH CUT FROM AN UNPUSHED `main` — THIRD INSTANCE OF THAT SHAPE
  AND THE FIRST MECHANICAL CATCH. EVERY OTHER ENTRY IN THIS FAMILY IS A FAILURE, WHICH IS WHY THIS
  ONE IS WRITTEN DOWN.** A wip commit went onto local `main`, a branch was cut from it, and the push
  was refused before anything reached GitHub — naming the stray commit and printing the rebase that
  fixes it.

      1st   ten merges into a local `main` never pushed, reported as merged ten times
      2nd   a unit built against a `main` 47 commits stale; the push was refused, and that
            refusal is the only reason anyone looked
      3rd   THIS — refused BEFORE the PR existed, by the guard written after the second

  **THE FIRST TWO WERE PEOPLE NOTICING AFTERWARDS.** The first cost an arc of false claims; the
  second cost a rebase and every figure in a unit's report being re-taken. **This cost one command.**

  **⚠ AND THE PREDICATE IS WHY IT FIRES AT ALL, WHICH IS THE REUSABLE HALF.** `upstream` A1's
  natural form — local `main` not ahead of `origin/main` — is FALSE on every legitimate push of
  `main`, and a gate whose common failure is benign is one people learn to skip. The narrowed
  predicate is the state that is never legitimate: **pushing a branch that is not `main` while local
  `main` is ahead.** A gate is only as good as the number of times it is right to ignore it.

  **⚠ AND THE RECOVERY COST NOTHING BECAUSE THE TREE WAS COMPARED RATHER THAN REMEMBERED.** The
  branch commit's tree and `main`'s were `91dd6f1` on both, checked with `rev-parse` before
  `reset --hard` touched anything. **A reset justified by memory is how the `--amend` incident
  rewrote a merge commit earlier today** — the same operation, the same confidence, and the only
  difference is whether one command was run first.

- **⚠ CLOSED: `projects` IS SAFE BY CONSTRUCTION RATHER THAN BY A GUARD, AND THE CENSUS'S OWN
  `ABSENT` VERDICT INVITED THE OPPOSITE CONCLUSION.** It reported no second key list, which reads as
  a gap — and reading the writer end to end gives the third outcome rather than a defect: **there is
  no key list to fall out of.**

      projects-serialize.ts:57   `const obj = (load(head) ?? {})`   loads EVERY head key
      :58-78                     assigns only the patched keys       nothing is ever deleted
      :79                        `dump(obj, opts) + body`            writes them all back

  A read-modify-write on the loaded object. The only `for` loop in the file iterates dump-option
  candidates. **A schema key neither the sanitizer nor the serializer names survives untouched, in
  the file's own position** — where experience's rebuild would append it and blog's would have
  dropped it. **It is the safest of the three, not merely the third.**

  **⚠ AND ADDING A KEY LIST WOULD CREATE THE FIXED-LIST SHAPE THE CENSUS EXISTS TO FIND.** That is
  the inverse of what an `ABSENT` row suggests to a reader, which is why the verdict is recorded
  with its lines rather than as a conclusion.

  **"NO DEFECT FOUND" IS NOT AN ANSWER, AND THESE THREE ARE WHY IT IS SAFE:**

      `facts` MERGES rather than replaces (:76-77) — `{ ...existing, ...patch.facts }`, so the
        locked `role` and `timeline` survive an edit to `type` and `platform`
      the head must ROUND-TRIP or the save is REFUSED (:28-34, :48) — `unsupported_format` rather
        than reformatting content nobody edited
      the sanitizer rejects the TAIL keys BY NAME — `title`, `heroImage`, `body`, `orderIndex`
        explicitly, then `return invalid("unknown field …")`

  **THE THIRD CLOSES THE ONE HAZARD THE SPLIT RAISED.** `splitAtBody` cuts at `body:` and its comment
  called that the last schema key — **stale**, since `sections` is declared after it, so the tail
  carries both. A patch able to write a tail key would produce a DUPLICATE. None can.

- **⚠ CLOSED: THE EXERCISE GATE WOULD HAVE REFUSED A CORRECT BLOG RUN — `galleryPublishBlockers`'
  SHAPE, ONE WEEK LATER, IN THE GATE WRITTEN BY SOMEBODY WHO HAD JUST RECORDED THAT ENTRY.**
  `REQUIRED_STEPS` demanded `reorder` of every collection. `COLLECTION_HAS_ORDER` declares
  `blog: false` deliberately — posts sort by `date`, which every post has and no author arranges —
  and `reorder-entries` returns **400 `unsupported_collection`** for blog.

  **SO BLOG'S PASSING STATE WAS UNREACHABLE**, and the failure would have landed on the first real
  entry rather than on a fixture — **latent only because the record is empty.** Found by reading the
  ordering table before the drive rather than by the drive being refused.

  **NOT-APPLICABLE IS A THIRD STATE BESIDE PERFORMED AND NOT-EXERCISED**, and the difference is
  legible to a reader: `NOT EXERCISED` says somebody could have and did not.

  **⚠ AND IT IS DERIVED, BECAUSE A HAND-WRITTEN EXEMPTION NAMING BLOG WOULD BE THE PARALLEL-LIST
  DEFECT ARRIVING INSIDE THE GATE BUILT TO FIND THEM.** `commit-collection-entry.ts` cannot be
  imported — its relative imports are extensionless, so Node cannot resolve them — so the suite
  PARSES the table and `G1` asserts the parse found all four. **An empty map would make every lookup
  undefined and the gate would quietly stop requiring anything**, which is the check-the-denominator
  rule arriving in a lookup.

  **⚠ AND THE COMPLEMENT IS ASSERTED, WHICH IS THE HALF THAT IS EASY TO SKIP.** An exemption only
  ever makes a gate MORE permissive, so without `G6` a FALSE claim would pass more easily than a
  true one — recording a reorder for a collection whose route returns 400.

  **⚠ THAT REASON GENERALISES AND IT BELONGS BESIDE THE PRECEDENCE LESSON: BOTH ARE ASSERTIONS THAT
  CHECK ONE SIDE OF A TWO-SIDED THING.** The unpublished-disclosure's `C2` claimed a read error
  *outranks* everything and tested it against one competitor, so reordering it below a different
  check survived. This claims an exemption is *correct* and tests only that the exempt case passes.

      a PRECEDENCE claim   must name every COMPETITOR, or it is a claim about one example
      an EXEMPTION claim   must name the case it must NOT cover, or it only ever loosens

  **THE DIRECTION OF THE ERROR IS WHAT MAKES THE EXEMPTION FORM WORSE.** A missing precedence
  competitor leaves a gate that is wrong in either direction; a missing exemption complement leaves
  one that is wrong in exactly the permissive direction — **so the failure it admits is always the
  false claim rather than the true one refused.** Second instance this week and the first of the
  exemption variety.

  **⚠ AND `G1` IS THE DENOMINATOR ROW, WHICH IS THE THIRD CENSUS THIS SESSION TO NEED THAT CHECK
  WRITTEN BEFORE IT RAN.** A changed table format yields an empty map, every lookup returns
  `undefined`, and **the gate quietly stops requiring anything.** The vacuous pass, arriving in a
  LOOKUP rather than in a count — and the three instances this session were a scan, a slice and now
  a map, which is the argument that the shape is about DERIVED SUBJECTS generally rather than about
  counting.

- **⚠ CLOSED: THE ROLE WAS NEVER WRONG — THE RUNG DOES NOT REMAP, AND EIGHT ELEMENTS REACHED PAST
  THE ROLE TO IT.** On the dark ground `--color-accent` becomes `accent-on-dark` and
  `--color-accent-500` stays the base mid-tone. Measured through a canvas pixel, sanity 21.000 first:

      on-accent / accent (ROLE)   4.63 – 7.52 on all nine        <- clears everywhere
      on-accent / accent-500      4.63 – 5.76 light, 3.24 – 3.65 dark
      white     / accent (ROLE)   4.82 – 6.01 light, 2.55 – 2.85 dark

  **⚠ AND `.nav-cta` IS NOT A CONTROL THAT WORKS BY NOT USING THE SYSTEM.** It fills with the RUNG
  and labels with white, and that pairing happens to clear. **White on the ROLE fails on all four
  dark palettes at 2.55 to 2.85** — so it can drop white only by moving to the role at the same
  time, and then it clears at 6.75 to 7.52. Both halves or neither, which is the opposite of what
  "a working control that bypasses the vocabulary" implied.

  **THE FIX MOVED EIGHT ELEMENTS FROM THE RUNG TO THE ROLE AND CHANGED NO TOKEN.** On the five light
  palettes `accent` IS `accent-500`, so the two columns above are identical there — **zero pixels
  moved on the light half, measured rather than argued.** The four dark palettes improved by 3.4 to
  3.9 and nothing regressed.

  **⚠ THE PROPOSED FIX WAS WRONG AND WOULD HAVE BROKEN THREE WORKING CONSUMERS TO FIX SEVEN.** Both
  parties had said "four dark values". The token's own comment already recorded the conflict —
  band-dark measures 6.75 to 7.52 against `accent` and `accent-text` and 3.24 to 3.65 against
  `accent-500` — and named `bg-accent-500` as the consumer that fails. **It shipped anyway, because
  nothing asserted the pairing.** `role-layer` R2 is that assertion, in the absence direction.

  **⚠ AND TWO CENSUSES OF THE SAME QUESTION DISAGREED BECAUSE ONE READ LINES.** A line-based scan
  reported six sites "inheriting" their ground; long Tailwind strings WRAP, so `bg-accent` and
  `text-on-accent` sat on different lines of one string. **The line was the boundary, not the
  markup** — the file-type-boundary defect arriving inside a single file. R2 flattens whitespace
  before matching for exactly that reason.

  **⚠ AND THE TWELVE REMAINING RUNG SITES ARE SAFE FOR A REASON THAT EXPIRES.** They carry no
  foreground at all — a 3px rule, a 2px dash, three dots — so there is no pair to fail. **The rung
  is still unremapped on the dark ground**, so the next author who puts a label on one inherits the
  defect exactly as the eight did. "None is a latent seventh" states the absence of a SUBJECT, not
  the presence of safety, and `role-layer` R2 is what catches it the moment one grows text.

  **THE SUPERSEDED FRAMING, KEPT BECAUSE THE MEASUREMENT IS SOUND AND ONLY ITS CONCLUSION WAS NOT:**
- **⚠ CLOSED: THREE LIVE SITES WERE STILL ON THE RUNG, ON TWO PUBLIC PAGES, AND `role-layer` R2 WAS
  GREEN THE WHOLE TIME.** The boarded item said the fix was four dark values. **It was not** —
  `--color-on-accent` already remaps to `band-dark`, and the fix was the same role move the other
  eight got. Measured from the paint on all nine, sanity 21.000 first:

      BEFORE   dark  sapphire 3.32  ink-flare 3.32  nocturne 3.24  basalt 3.65   <- all fail 4.5
      AFTER    dark  sapphire 6.99  ink-flare 6.84  nocturne 6.75  basalt 7.52
      LIGHT    cream 4.70  harbour 4.87  orchid 5.76  cerise 4.66  fern 4.63 — IDENTICAL BEFORE
               AND AFTER, because the role and the rung resolve to THE SAME PAINT on all five
               (cream 182,83,41 · harbour 0,126,91 · orchid 153,63,148 · cerise 209,45,107 ·
               fern 75,127,32). **Improvements on four, regressions on none, zero pixels moved on
               the light half** — the constraint the ruling set, met by construction rather than by
               luck.

  **⚠ AND R2 MISSED THEM FOR A REASON THAT WILL RECUR, WHICH IS THE FINDING RATHER THAN THE FIX.**
  R2 matches one QUOTED STRING containing both classes. These three put the ground on an anchor and
  the foreground on a child span —

      <a className="… bg-accent-500 …"><span className="text-on-accent">…</span></a>

  — and **that split is FORCED, not stylistic**: `a { color: inherit }` is unlayered, so
  `text-on-accent` on the anchor draws nothing. **THE CASCADE RULE THAT FORCES THE SPLIT IS WHAT
  MADE THEM INVISIBLE TO THE GATE.** Two documented facts, each correct, each recorded in this file,
  combining into a blind spot neither predicted.

  **R2's CONCEPT WAS "NO ELEMENT PAIRS THEM"; ITS VOCABULARY WAS "NO ONE CLASS STRING CONTAINS
  BOTH".** Narrower-than-its-concept, inside the gate written for this exact defect — and it caught
  eight of eleven, which is why nobody looked. `R2b` covers the nested form and **the mutation is the
  proof: putting one site back leaves R2 GREEN and R2b RED.**

  **⚠ SEVENTH CARRIED ITEM TO EXPIRE THIS SESSION, AND THE BOARD IS NOW THE THING DECAYING.** The
  seven: the experience descriptions, the published-post count, the three status claims, the search
  index, `mutate.mjs`'s "four of nine", the `img` height reset, and this. **Three of the seven scoped
  work before anyone re-derived them.** Six or seven in one session is not bad luck — **a board entry
  is a claim about the present, and nothing in this repository has the board as its subject.**

  **THE BOARDED FRAMING, KEPT BECAUSE ITS MEASUREMENT WAS SOUND AND ONLY ITS PROPOSED FIX WAS NOT:**
- **⚠ `on-accent` ON `accent-500` MEASURES 3.24 TO 3.65 ON THE FOUR DARK PALETTES, AGAINST A 4.5
  FLOOR — PRE-EXISTING, TOKEN-LEVEL, AND FOUND BY A HERO THAT MERELY JOINED IT.** Measured from the
  paint through a canvas pixel, sanity pair 21.000 first:

      sapphire   10,16,22  on  73,91,203    3.32        cream     254,249,241 on 182,83,41   4.70
      ink-flare  20,13,10  on  162,78,2     3.32        harbour   245,251,255 on 0,126,91    4.87
      nocturne   13,14,25  on  115,79,185   3.24        orchid    252,249,253 on 153,63,148  5.76
      basalt     15,15,15  on  82,119,0     3.65        cerise/fern                    4.66 / 4.63

  **THE PAIR IS THE TOKENS THEMSELVES**, not any one consumer — read straight off
  `--color-on-accent` against `--color-accent-500` it gives the identical figures. The shipped
  gallery filter chip measures exactly the same, so this predates the hero.

  **⚠ AND `.nav-cta` CLEARS ON ALL NINE — 4.93 TO 5.92 — BECAUSE IT USES WHITE RATHER THAN THE
  ROLE.** That is the tell: the one accent-filled control that passes is the one not using the
  vocabulary. `paint-sites`' own ALLOW entry records its figures and never asked the role the same
  question.

  **⚠ AND `.nav-cta` BYPASSING THE ROLE IS ITSELF THE FINDING, NOT THE ESCAPE HATCH.** A working
  control that works BY NOT USING THE SYSTEM is evidence about the system rather than about the
  control. Its white is defended in `paint-sites`' ALLOW as ground-independent by argument, which is
  true — and the argument was never turned around to ask why the ROLE built for that exact job could
  not make it. **The one accent-filled control that passes on all nine is the one not using the
  vocabulary.** Any repair should make `on-accent` able to replace that white, or admit the role does
  not cover its own case.

  **THE HERO'S CTA KEEPS `on-accent` DELIBERATELY.** Pointing it at white would fix one element,
  hide a token defect behind it and make the vocabulary wrong — the trade this project has spent
  twelve sessions removing. **Denominator: 17 `text-on-accent` sites across 9 components, plus 3
  `var(--color-on-accent)` readers in the stylesheet.** The fix is four dark values, which is a
  palette change and not a component one.
- **⚠ CLOSED, AND IT WAS ALREADY CLOSED WHEN THIS ITEM WAS LAST READ: `height` IS LIFTED.** The
  unlayered rule now declares `max-width: 100%` and `display: block` and nothing else —
  `img, video { height: auto }` sits in `@layer base` with its blast radius enumerated first: **8
  sites, every one `h-auto`, 0 collisions, not one rendered box moved.** `max-width` and `display`
  stay boarded as separate questions with separate blast radii, which is what the item asked for.

  **⚠ SIXTH CARRIED ITEM TO EXPIRE THIS SESSION, and the second to have had work scoped from it.**
  The others were the experience descriptions, the published-post count, the three status claims,
  the search index, and `mutate.mjs`'s "four of nine". **The entries most likely to be wrong are
  still the ones nobody has touched**, and a board is a claim about the present.

  **THE SUPERSEDED FRAMING, KEPT FOR ITS MEASUREMENT:**
- **⚠ NEXT UNIT: THE UNLAYERED `img` RESET HAS FIRED FIVE TIMES — ASK WHETHER IT CAN BE LAYERED,
  RATHER THAN LOGGING A SIXTH.** `img, video { max-width: 100%; height: auto; display: block }` sits
  unlayered, so all three properties beat any utility in `@layer utilities`. Hazard 11's instances:
  a `max-w-full` on the case-study preview, a full-height class on the gallery tile, and three inert
  classes on the gallery overlay and tile. **An instance list this long is a question nobody has
  asked.**

  **THE MEASUREMENT THAT DECIDES IT, AND IT POINTS AT "ALWAYS AUTHORED".** Of 50 `<Image>`/`<img>`
  elements in the tree, **12 already bypass the reset entirely** through `next/image`'s `fill`, which
  Next writes as an INLINE style — the one thing that outranks an unlayered rule. Another 23 elements
  carry an inline `height` or `aspectRatio`. **So the escape hatch is already the majority
  mechanism**, and the reset is mostly serving elements that never argue with it.

  **⚠ THE ANSWER IS PROBABLY NOT "LAYER ALL THREE", AND THE PRECEDENT SAYS WHY.** The dead-utilities
  arc lifted 92 utilities across four properties and shipped it as **four PRs, one property at a
  time**, because one diff containing 92 changes is a diff where nothing can be attributed. Lifting
  `height` alone is the first unit; `max-width` and `display` are separate questions with separate
  blast radii.

  **THE OPEN QUESTION TO ANSWER FIRST:** whether lifting `height` changes any rendered box. Every
  consumer relying on `height: auto` would keep it — nothing else sets a default — so the change is
  only visible where a utility currently loses. **That set is exactly what `cascade-public` already
  enumerates**, which means the blast radius is knowable before the edit rather than after it.

- **⚠ A COMMENT THAT HAD ALREADY BEEN CAUGHT MAKING A PRECISE MECHANICAL CLAIM MADE ANOTHER ONE, ONE
  PARAGRAPH ABOVE ITS OWN CORRECTION.** `SiteHeader`'s route-entry note read *"every consumer guards
  on it (four sites, lines 87, 277, 350 and 462)"*. **Counted: SEVEN `isRoute(` call sites, and not
  one of the four line numbers was right.**

  **AND THE PARAGRAPH DIRECTLY BELOW IT IS THAT SAME COMMENT CORRECTING ITSELF** for naming a
  `SECTION_IDS` constant that does not exist — *"it read as a precise mechanical claim, and nothing
  reads prose"*. **It then made a precise mechanical claim.**

  **⚠ LINE NUMBERS IN PROSE ARE THE MOST DECAY-PRONE CLAIM A COMMENT CAN CARRY.** Every edit above
  them moves them and nothing re-reads the number — this file had grown by hundreds of lines since
  those four were written, so all four were guaranteed wrong long before anyone looked.

  **THE COUNT IS DELETED RATHER THAN CORRECTED, AND THAT IS THE RULE.** A fresh number would be
  wrong by the next commit. What a reader needs is the PROPERTY — a route entry has an `href`, so
  guard on `isRoute` — and `git grep isRoute` is exact and never stale.

- **⚠ AND THE CLAIM THAT SENT ME LOOKING WAS NOT IN THE REPOSITORY AT ALL.** The instruction said the
  record had held "NAV is the only surface, with three render sites" since #185 and asked me to
  correct it there. **Grepped: it is nowhere** — not in `CLAUDE.md`, not in `STATE.md`, not in the
  component; #185 is `feat(nav): the Blog link, the sitemap, and one dead component`.

  **THE SUBSTRATE-CLAIM SHAPE, FROM THE OTHER SIDE.** This record already carries four instances of
  ME asserting something was recorded when it was not. **This is the same act by the other party**,
  and the correction is identical: **grep before citing the record, including when you are the one
  who wrote it.** Reporting "there is nothing to fix here" is the honest outcome; inventing a
  correction to a line nobody can find would have put a false citation into the record to settle a
  false citation about it.

- **⚠ A DECLARED VALUE READ AS A RENDERED ONE — A NEW SHAPE, AND EVERY EARLIER INSTANCE WAS A PROBE
  MEASURING THE WRONG SUBJECT.** Asked to change four button radii, I reported that two same-label
  buttons on `/oklch` "now differ": one `rounded-xl`, one `rounded-full`.

  **THEY ARE THE SAME PIXELS.** CSS clamps border-radius to half the box, and both buttons are 42px
  tall:

      rounded-full   9999px declared  ->  21px effective
      rounded-xl       24px declared  ->  21px effective

  **NOTHING WAS MISMEASURED. A CLASS STRING WAS TRUSTED TO DESCRIBE THE SCREEN**, which is the same
  rule this record keeps reaching from new directions — **read the computed value** — arriving in a
  radius rather than in a colour, and in a report rather than in a probe.

  **⚠ AND THE REQUEST PRODUCED A UNIFORM PAGE BY ACCIDENT, WHICH IS THE HALF WORTH KEEPING.** Before
  the change the top pair was `rounded-lg` = **16px effective** against the closing pair's **21px** —
  **a real 5px difference nobody had named, in neither the request nor the diff.** Taking the top
  pair to `xl` clamped it to 21px, which is the closing pair's value. **The stated goal was
  cosmetic; the actual effect was to close a gap nobody had seen.**

  **THE `rounded-full` SPELLING STAYS, WITH ITS REASON AT THE LINE.** A class edit with no observable
  effect is churn — the same ruling made against `display: flex` on the work filter — and the reason
  sits in the component rather than in a commit body so the next person to notice the mismatch does
  not pay a diff to find out. **They diverge only if the button exceeds 48px tall**, which is a
  height change rather than a radius one.

  **AND THE ONE PIXEL ON `Explore the work` IS ITS HEIGHT.** 40px against 42px gives 20px against
  21px. **Matching heights to equalise a clamped radius would move a button's box to change a corner**
  — a number nobody can see, fixed by a change everybody can.

- **⚠ A NOTE ABOUT A RUNG FAILING ON DARK WAS USED TO RULE OUT A ROLE ON LIGHT, AND NINE PALETTES
  PAID FOR FOUR.** `.wf-thumb` records `ink-950` measuring **1.17 on sapphire** — a raw rung, which
  does not remap. The repair chose `text-primary`/`surface`, an inverted ink pair, and took the
  affordance to 15.20.

  **⚠ ACCENT WAS NEVER MEASURED HERE.** Asked to match the hero's selected pill, I quoted that note
  to rule accent out. It does not say accent fails on this control's tan ground on a light palette,
  and nobody had asked. Measured, sanity 21.000 first:

      accent as the fill   label 4.70 4.87 5.76 4.66 4.63 · 6.99 6.84 6.75 7.52   floor 4.5
                           fill  4.70 4.87 5.76 4.66 4.63 · 6.13 5.99 5.94 6.62   floor 3.0

  **BOTH FLOORS, ALL NINE.** The selected chip was near-black on a cream page where nothing else is,
  for four rounds of investigation, because a true note about a different question was treated as
  settling this one.

  **⚠ AND THE RECORD'S OWN PREDICTION CAME TRUE IN THE OPPOSITE DIRECTION.** The `.wf-thumb` comment
  closes: *"if a third such consumer appears, THE ROLE IS MISSING rather than the consumers being
  odd."* **Nothing was missing.** `accent`/`on-accent` resolved correctly on both grounds the whole
  time — the layer did not need a new role, it needed this element to use one. The prediction was
  right that the answer lay in the role layer and wrong about the direction.

  **THE TRADE IS STATED RATHER THAN ROUNDED AWAY:** the ink pair gave 15 to 19 and accent gives ~4.6
  on the tightest light palettes. Both pass. **The filter is now as tight as the hero rather than
  tighter, so a future accent retune moves both controls at once** — which it did not before.

  **AND THE HERO'S REST LABEL SHIPPED IN THE SAME UNIT**, because a matched pair with one failing
  half is the shape this record refuses. `text-subtle` measured 3.11 / 3.82 / 4.26 against the tab
  track on three dark palettes; `text-secondary` gives 7.42 to 8.95 light and 7.43 to 7.50 dark.
  **Role to role — the hero already took a role, and the choice of RUNG was the defect.** Scoped to
  `--hx-tab-faint` because `--hx-faint` has four consumers and three were never measured.
- **⚠ A `transition-colors` CAUGHT MID-FLIGHT REPORTED A CONTROL AT 1.15, AND IT WOULD HAVE SENT THE
  INVESTIGATION SOMEWHERE ELSE ENTIRELY.** Switching palette and sampling after 90ms read the hero's
  selected label at **1.15 / 2.41 / 2.43** on the dark palettes — a catastrophic-looking failure in
  the control being used as the reference. The button carries `transition-colors`, so the computed
  colour was partway between the old value and the new one.

  **A 1500ms settle gives 6.75 to 7.52, AND THAT MATCHES AN INDEPENDENT MEASUREMENT TAKEN EARLIER
  THE SAME DAY** in a different unit. **The agreement with a figure nobody was trying to reproduce
  is what makes the corrected run trustworthy** — not the fact that it looks more sensible.

  **THE RULE: ANY PROBE THAT SWITCHES THEME MUST OUTLAST THE LONGEST TRANSITION ON THE ELEMENTS IT
  READS.** Sixth measurement failure in one unit, and the only one whose wrong answer was worse than
  the truth rather than better — every other one this session flattered the code.
- **⚠ AN UNPARSEABLE COLOUR MAKES CANVAS KEEP ITS PREVIOUS FILL AND RETURN A PLAUSIBLE NUMBER — AND
  IT REPORTED THAT A DEFECT DID NOT EXIST.** `fillStyle` cannot parse `color-mix(in oklch, …)`. It
  does not throw and it does not clear; **it silently keeps whatever was there**, so a probe that
  feeds a raw token value to it reads the previous colour and computes a real-looking ratio.

  Measured: the hero's rest ink read **5.41 on sapphire — a PASS** — where the rendered colour gives
  **3.11**. The defect was declared absent by an instrument that had never looked at it.

  **⚠ EVERY OTHER FAILURE THAT SESSION ANNOUNCED ITSELF AND THIS ONE DID NOT.** A double-composited
  underlay gave `201,196,190` against a known ground; a hand un-premultiply gave `432,422,410`, and
  **a channel above 255 is not a colour**. Those are visibly impossible. **A false pass is not.**

  **THE RULE: NEVER FEED A TOKEN'S VALUE TO `fillStyle`. Read the RENDERED colour** — 
  `getComputedStyle(el).color` is already resolved to rgb — **from an element that actually uses the
  token.** A role is root-level, so any element using it will do, which is how the final derivation
  was taken without mutating anything.

- **⚠ THE SCROLL SPY IS A FOURTH ITERATION SITE NOTHING NAMED, AND IT IS THE ONLY THING ON THE HOME
  PAGE THAT READS ORDER RATHER THAN IDENTITY.** The record names three `NAV` render sites — the bar,
  the scrolled sheet, the mobile menu. `getActiveSection()` is the fourth:

      for (const item of NAV) { … if (top <= HEADER_H + 2) current = item.id; }

  It keeps the LAST entry above the header, **which is only correct while the array is in DOM
  order.** Everything else keys on identity: `ScrollManager` holds a pixel offset and knows no ids,
  `RevealSection` keys on its own viewport entry at `rootMargin: "-20% 0px"`, the hero observer looks
  up `#hero`, the sitemap enumerates routes.

  **MEASURED ON THE MOVED PAGE RATHER THAN ARGUED**, which is the one behaviour no class-string check
  can see:

      reader is in     NAV moved     NAV STALE
      work             work          work
      process          process       WORK        <- the defect
      about            about         about

  **A MOVE IS FREE IF EVERYTHING KEYS ON IDS AND EXPENSIVE IF ANYTHING KEYS ON SEQUENCE**, and
  exactly one thing did. `nav-order` A3 is the assertion, and it is a RELATIVE-order claim rather
  than an equality one — `#skills` sits between `about` and `contact` and is deliberately not in the
  nav, so demanding equality would have been a gate asserting more than its subject needs.

  **⚠ AND THE FIRST DRAFT OF THAT GATE CARRIED A HARDCODED `{ ProjectsSection: "work", … }` MAP THAT
  WAS MISSING `ContactSection`** — a fixed list inside the gate written to stop two lists
  disagreeing. Caught on its first run by its own output printing the two rows side by side. The ids
  are read out of each component now.

- **⚠ THE HERO CUE'S COPY AND ITS DESTINATION CAME FROM DIFFERENT PLACES AND NOTHING TIED THEM —
  THE SAME SHAPE THAT HAD JUST COST TWO LIVE PAGES A 1.09, CAUGHT LATENT.**

      copy    content/site-settings.yaml   heroScrollCue   AUTHOR-EDITABLE in /studio's hero panel
      target  HeroSection                  href + getElementById, TWICE, hardcoded

  They agreed by coincidence. **An author could rename the cue tomorrow and the destination would
  stay**, which is the editable-string-and-hardcoded-destination pair this record now carries twice.

  **⚠ THE COPY CANNOT DERIVE THE TARGET AND THAT IS WHY THE PAIR IS ASSERTED RATHER THAN TIED.** The
  cue is free text — "Take a look below" yields no id — so `nav-order` C2 and C3 assert both strings
  agree with each other and with the page's first section. **An author renaming the cue cannot break
  where it goes; what they can still do is describe it wrongly**, and that is an authoring error no
  gate can see. Naming the half it does not reach is the point.

- **⚠ THE WORK FILTER AND THE HERO TABS ALREADY AGREE, AND THE RULE KEYS ON MARKUP RATHER THAN ON
  FUNCTION — WHICH INVERTED THE PREMISE THE QUESTION WAS ASKED FROM.** The request was to match
  them, reasoned as *"the filter switches CONTENT SETS, so it takes the underline"*. Measured, both
  are `role="group"` with `aria-pressed`, and `SegmentedGroup`'s own header states the rule:

      role="group"   + aria-pressed    -> the accent FILL
      role="tablist" + aria-selected   -> the UNDERLINE

  **THE RULE IS ABOUT THE CONTRACT, NOT ABOUT WHAT THE CONTROL DOES**, so the filter takes the fill —
  and both already draw a `width: max-content` pill group, `gap: 2px`, `padding: 3px`, a hairline
  track and a filled selected state. **Not two languages. One language, two chromes.**

  **⚠ AND THE FUNCTION READING WAS REFUSED FOR A CONCRETE REASON RATHER THAN A PREFERENCE.** Making
  the filter a tablist rewrites the contract that `WorkFilter`'s last-intent queue manipulates
  imperatively (`aria-pressed` at `:54` and `:69`), and **a tablist with DISABLED tabs is a shape
  ARIA does not have** — which the empty-category rule requires. **A styling request must not become
  a semantics rewrite**, and both #162 rules were confirmed untouched.

- **⚠ SPECIFICITY ONLY BREAKS TIES BETWEEN RULES MATCHING THE SAME ELEMENT — AND NOBODY WROTE THAT
  DOWN, WHICH IS WHY A CORRECT FIX SILENTLY REMOVED A CAPABILITY FOR FOUR DAYS.**

  `[data-ground="dark"]` at 0-1-0 TIED `:root` at 0-1-0 and lost to a `:root` block four hundred
  lines below on source order. Prefixing it to `:root[data-ground="dark"]` at 0-2-0 fixed that, and
  was right.

  **⚠ AND `:root` MATCHES `<html>` ALONE**, so from that moment a `<section data-ground="dark">`
  could never take the values. `SectionRenderer` went on declaring dark on five regions across two
  case studies; they painted `--color-surface`. `SiteHeader`'s predicate reads
  `[data-ground="dark"]` on ANY element, believed them, and retoned the nav to white links over a
  near-white hero:

      BEFORE  light  cream 1.09 · harbour 1.09 · orchid 1.10 · cerise 1.09 · fern 1.09
      AFTER   light  cream 19.04 · harbour 18.78 · orchid 18.90 · cerise 18.88 · fern 18.82
      dark    sapphire 15.20 · ink-flare 15.26 · nocturne 15.24 · basalt 15.19 — IDENTICAL both ways

  **1.09 AGAINST A 4.5 FLOOR, ON TWO LIVE PAGES, ON ALL FIVE LIGHT PALETTES** — the owner reported
  cream because cream is published, and it was live on every one.

  **⚠ THE FACT THAT WOULD HAVE PRICED THE PREFIX: a mid-page block never needed one.** A `:root`
  block declares custom properties on `<html>`; a section block declares them on the section. **They
  never compete** — the section inherits until it declares its own, and then its own wins for it and
  its descendants regardless of source order. So the prefix was free for the root case and total for
  the mid-page one, **and the asymmetry is invisible unless somebody states the rule.**

  **THE FIX IS THE DELETION, NOT THE FULFILMENT.** Three options were priced: make the remap reach
  sections (ships a design nobody has seen, on two live pages, with the hero images unmeasured
  against a dark ground); make the nav's predicate resolve the actual paint (leaves the false
  declaration standing and teaches the codebase to distrust a declaration); or **delete the
  declaration** — zero visible change, matches the reference the owner named, and removes a lie.

  **⚠ THE ATTRIBUTE HAD EXACTLY ONE CONSUMER AND THAT CONSUMER WAS THE DEFECT.** No CSS rule read
  it — all three `[data-ground="dark"]` selectors are `:root`-prefixed — and the single JS reader is
  the nav predicate. **That singleton is what made the deletion provably invisible** rather than
  merely likely to be.

  **AND `SectionRenderer`'s COMMENT CLAIMED THE OPPOSITE, WHICH IS THE NINTH PROSE INSTANCE THIS
  SESSION.** It said the attribute *"resolves the foreground for both scopes, which is what made
  those seven utilities deletable"* — measured, **no resolution happened in either scope**, because
  the studio canvas's `<html>` is light too and both fell through to the inherited colour at 19.04.
  **It died in the same commit**, or the next reader re-adds the attribute to fix a lie that is no
  longer there.

  **⚠ AND `SiteHeader`'s OWN COMMENT PREDICTED THIS IN AS MANY WORDS AND NAMED THE WRONG INSTANCE.**
  It says *"the dark QUOTE BAND has carried the attribute mid-page since #387, so scrolling the nav
  over it has the same defect TODAY on the light site."* Correct, written down, and **nobody asked
  whether the hero in front of it was the same class.** First instance this session of correct prose
  naming a DIFFERENT member of the shape it describes while missing the one at hand.

  `role-layer` S2 is the mechanism: **an emission and a remap must agree.** If any non-root element
  declares a ground, some non-`:root` block must be able to remap it. Either side alone is fine; the
  pair is what lies.

- **⚠ THE TENTH MATCHER FINDING OF THE SESSION AND THE ONLY ONE WITH THE OPPOSITE CAUSE: A
  VOCABULARY NARROWER BY BEING MORE PRECISE.** Every other one this session was a matcher whose
  words covered less than its concept. This one was a matcher that was *exact where it should have
  been general*.

      consumer-count   `/^(node_modules|\.next|\.git|public)$/` on the NAME    descended into `.next-dev`
      theme-contrast   `/node_modules|\.next|\.git|…/` on the PATH             unaffected, 112 passed

  **THE ANCHORED, EXACT, CAREFULLY-WRITTEN ONE WAS WRONG AND THE LOOSE ONE WAS RIGHT** — because
  `.next-dev` *contains* `.next`, so the sloppy substring match happened to express the concept and
  the precise one expressed a name.

  **⚠ THE EXCLUSION NAMED A DIRECTORY WHERE IT MEANT "BUILD OUTPUT".** That is the whole entry. Both
  matchers had the same concept; one encoded it as a property of the string and one as a membership
  list, and **a membership list is correct exactly until the population grows** — which this
  repository has now recorded for palettes, pairs, themes, routes, collections, and now directories.

  **⚠ AND IT WAS CREATED BY THE FIX AND CAUGHT BY AN EXISTING GATE**, which is the good half. The
  `distDir` split made a second build directory exist for the first time; `consumer-count` reported
  13 Tailwind-internal properties as orphaned public tokens within the minute. **Censused across
  every walk in `ralph/` rather than repaired where it fired** — one descended, one was immune, and
  knowing which is why the repair is one line rather than a sweep.

  **THE PRACTICAL FORM: WHEN A MATCHER EXCLUDES SOMETHING, ASK WHETHER IT NAMES THE THING OR
  DESCRIBES IT.** Precision is not the virtue here; the right generality is.

- **⚠ FIVE MATCHER ERRORS IN ONE EMITTER, AND THE EMITTER WAS THE ONE WRITTEN TO PREVENT THEM — WITH
  ITS OWN DENOMINATOR REQUIREMENT WRITTEN INTO ITS HEADER BEFORE IT EVER RAN.** `collection-readiness`
  was built because "I audited the hand-keyed lists" is a claim and "here are the eleven, ten
  guarded, one not" is a measurement. Its header says a census with a broken subject is worse than
  none. Then:

      1  section D reported SIX defects, of which ZERO were defects — the guard was out of window
         every time: a return type, the literal's own type, a DIFFERENT mapped type, or the
         CALLEE'S PARAMETER in another file
      2  two of those six were not collection tables at all — they key four collections PLUS
         `skills`, a singleton. A table over a different key set, reported as an unguarded one
         over this one
      3  section C matched by NAME — `<COLLECTION>_SCHEMA_KEYS`, which is what gallery's happens
         to be called — and reported blog ABSENT while `BLOG_HEAD_KEYS` sat in its serializer
      4  the census READ ITS OWN COMMENT as evidence and reported blog COMPARED
      5  the ordering detector's 900-character window was 21 short, because the COMMENT explaining
         the fallthrough had pushed the fallthrough to 921

  **⚠ THE NAME ONE IS THE WORST, AND PROXIMITY IS NOT PROTECTION — SECOND INSTANCE OF THAT EXACT
  SENTENCE.** The name-blind then form-blind then fold-blind entry sits FOUR HUNDRED LINES from this
  file, and was read before it was written. The first instance was a comment contradicting the rule
  stated in its own file's header. **Reading the record does not transfer the record**, because
  applying an entry requires noticing that THIS is an instance, and an instance does not announce
  itself.

  **⚠ THE SELF-READING ONE IS THE SECOND VERBATIM INSTANCE OF THE `[data-ground="dark"]` CASE**,
  where an `indexOf` found the construct inside a comment written about it one turn earlier. **Four
  tools deep now**, and the rule is general: a parser over source whose comments discuss its subject
  must exclude itself, and must blank the comments of everything else.

  **⚠ AND `compared` BEING A FALSE JOIN — some suite names the constant, some suite reads a schema,
  the two tied by nothing — IS THIS ARC'S SHAPE IN A FIFTH INSTRUMENT.** Gallery's suite reading
  gallery's schema satisfied the second half for every collection. Same lesson, fifth tool.

  **⚠ AND THE FIFTH IS A NEW VARIANT WORTH ITS OWN NAME: THE EXPLANATION DISPLACED ITS OWN SUBJECT.**
  Every earlier explaining-it-requires-writing-it instance was prose that BECAME the thing being
  matched — a delimiter, a glob, an OKLCH literal, an ARIA role. This is prose that MOVED the thing
  out of reach. **A fixed character window is a guess about how far apart two statements sit, and a
  comment is precisely what changes that distance.** Bounded by the enclosing function now, with
  `C4` asserting the slice is genuinely bounded — and C4 caught a sixth on its first run, an anchor
  of `of <NAME>` that assumed every list is consumed by a for-of when gallery's is consumed by
  `.includes`.

  **THE HONEST CONCLUSION IS NOT "BE MORE CAREFUL", BECAUSE CARE IS WHAT WAS BEING EXERCISED.** Each
  error was found by ONE thing: pointing the census at a question from outside it — a grep run for a
  different reason, a mutation, a measured character distance. **The emitter cannot audit its own
  subject**, which is this file's `A DOCUMENT CANNOT AUDIT ITSELF` entry arriving in a gate rather
  than in a data file.

- **⚠ CLOSED: BLOG'S SERIALIZER FILTERED, AND A KEY ADDED TO THE SCHEMA WAS DROPPED ON SAVE
  SILENTLY.** `BLOG_HEAD_KEYS` named six of seven top-level keys and the loop built `head` from
  those six with nothing following. **Gallery's exact mechanism, in the collection with no browser
  run on record.** Found by `collection-readiness` C2 on its first honest run.

  **THE FIX IS THE MECHANISM AND NOT A GATE, WHICH REMOVES THE SUBJECT RATHER THAN WATCHING IT.**
  `serializeExperience` has had the shape all along — known keys first, then append the rest — so
  the collection reporting ORDERING ONLY is the one that proved the answer. A gate would have left a
  filtering serializer in place with a suite standing over it.

  **⚠ AND THE SECOND FILTER GUARDED NOTHING, WHICH IS WHY THE FIX IS A DELETION.** The hazard raised
  against the fallthrough was the cast at `commit-collection-entry.ts:232`, where `patch` is a union
  of four input types. Measured: `PATCH_SANITIZERS[collection]` and `commitCollectionEntry(collection,
  …)` are indexed by ONE variable, so the cast is guarded — the tenth-of-eleven shape
  `unchecked-joins` records — and `sanitizeBlogPatch` is a per-key allowlist that rejects `blocks` by
  name and ends `return bad("unknown field …")` with a 400. **There was no key for the list to stop.**

  **THE COST IS NAMED BECAUSE A FILTERING LIST IS ALSO A FORMATTING DECISION: a FUTURE schema key is
  APPENDED rather than placed in schema position.** Add it to the list and it sits where the schema
  says; forget, and the file is correct with one key out of order. **Before, forgetting lost the
  value.** A formatting cost traded for a data cost, and `blog-serialize` I3 asserts the trade rather
  than only describing it.

  **AND IT RECOVERS THE HAND-EDIT ROUTE THIS REPOSITORY HAS ALREADY SEEN** — four project-shaped
  files carrying a key the schema never had reached main by a path nobody expected. A post
  hand-edited to hold an extra key used to lose it on the owner's next save.

- **⚠ CLOSED: AN UNKINDED ITEM IS REFUSED AT PUBLISH — AND THE MIGRATION THAT HELD THIS UNIT BACK
  DID NOT EXIST.** The gate was deferred because "the gate and the content move together or publish
  breaks on live pieces". **Measured, `publish-site-settings.ts:192` iterates `cmp.files`** — the
  files changed on the draft branch — so it judges what is being PUBLISHED, not everything on main.
  An unkinded item already on main blocks nothing until somebody edits it.

  **⚠ SO THE UNIT COULD HAVE LANDED AS SOON AS IT WAS PROPOSED, AND THE REASON IT DID NOT WAS A
  PREMISE NOBODY CHECKED.** Both parties held it, neither read the loop. The cost was one arc of
  deferral on a one-line gate — cheap this time, and the shape is the expensive one: **a constraint
  asserted about a mechanism, believed by everyone, blocking work that was never blocked.**

  **⚠ THE HONEST REASON TO KIND THE LIVE ITEM ANYWAY IS THE TRAP, WHICH IS A BETTER ARGUMENT THAN
  THE ONE THAT DEFERRED IT.** It is not about correctness — the gate is correct either way. It is
  that the next person editing `light-through-leaves` for an unrelated reason gets refused for
  something they did not cause, and **that is how a good gate earns a reputation for being in the
  way.** A refusal an author cannot connect to their own action is the shape this record already
  carries from `galleryPublishBlockers` firing on every item.

  **UNKNOWN IS REFUSED ALONGSIDE EMPTY, AND THE HAND-EDIT ROUTE IS WHY.** Scoping the gate to the
  state the editor can produce assumes the editor is the only writer — and this collection has
  disproved that: four project-shaped files carrying a `summary` key the schema never had reached
  main by a path nobody expected and took the production build down.

  **⚠ AND `sony-camera` IS THE FIRST EVIDENCE THE EDITOR PRODUCES VALID ITEMS UNASSISTED**, authored
  during the drive with a real kind and a real alt. The unkinded population was **one, not two**, and
  it predates every fix this week.

  **THE ORIGINAL FINDING, KEPT BECAUSE THE OBSERVATION IS THE DURABLE PART:**

- **⚠ A GALLERY ITEM WITH AN EMPTY `kind` PASSES BOTH GATES AND NO FILTER CAN REACH IT — LIVE ON
  MAIN, AND THE HERO IS ONLY WHAT MADE IT VISIBLE.** `light-through-leaves` carries `kind: ''`.
  Measured against the collection as it stands:

      items 5   ·   all 5   ·   byKind {photo: 3, illus: 1, proj: 0}   ·   the kinds sum to FOUR
      validateGalleryEntry     ok on all five
      galleryPublishBlockers   []

  **THE ITEM IS REACHABLE ONLY THROUGH `All`.** Every chip filters by kind, and it has none, so
  choosing any bucket hides it — while the masonry under `All` shows it, so nothing on screen says
  it is unreachable. **A reader can see the piece and cannot narrow to it.**

  **⚠ AND THE COUNTS DID NOT LIE BEFORE THE HERO; THEY WERE JUST NEVER ADDED UP.** The chips have
  always read `All 5 · Photographs 3 · Drawings 1 · Studies 0`, and nobody sums a control row. The
  fact row states the same four numbers as a CLAIM ABOUT THE COLLECTION, one line apart, where 5
  against 3+1+0 is arithmetic a reader does perform. **Surfacing a number is what made an old
  inconsistency into a visible one** — the defect is upstream and the hero is the instrument.

  **⚠ THE GENERAL FORM, AND IT IS THE REASON THIS ENTRY EXISTS RATHER THAN A BUG REPORT: A DEFECT CAN
  BE VISIBLE FOR ITS WHOLE LIFE AND ONLY BECOME LEGIBLE WHEN IT MOVES INTO A CONTEXT THAT INVITES
  ARITHMETIC.** Nothing about the item changed. Nothing about the counts changed. The same four
  numbers moved from a control row, where they are labels on buttons, into a fact row, where they are
  a CLAIM ABOUT THE COLLECTION — and a reader sums a claim. **Legibility is a property of the
  context, not of the data**, so "this was always on screen" is not evidence that anyone could have
  seen it.

  **⚠ AND THE FIX THE NEXT PERSON WILL REACH FOR IS THE WRONG ONE, SO IT IS NAMED HERE.** Excluding
  the unkinded item from the fact row makes 5 become 4 and the sum work. **It would hide a real item
  to protect a number, and the piece would STILL be reachable only through `All`** — the defect
  intact, the instrument that revealed it destroyed. Same trade as shipping a Save button to close a
  report about feedback, which this file already carries twice.

  **NOT FIXED HERE, AND THE CHOICE IS THE OWNER'S. Three answers exist and they are three different
  products:** refuse an empty kind at publish, give the schema a default, or add a fourth bucket for
  the unclassified — **and the third invents a category**, which this record deletes on sight.

  **⚠ THE OWNER'S LEAN IS REFUSE-AT-PUBLISH, AND THE ARGUMENT IS A CLASS RATHER THAN A PREFERENCE.**
  `galleryPublishBlockers` already refuses an empty alt and a missing dimension, and **an unkinded
  item is the same class of incomplete** — a field the reader's experience depends on, left blank.
  **It waits because it is a ruling with a MIGRATION attached:** one item on main already fails it, so
  the gate and the content have to move together or publish breaks on a piece that is live.

- **⚠ SHIPPED: THE UNPUBLISHED-CHANGES DISCLOSURE, AND THE PLACEMENT DERIVATION REVERSED ITSELF ON
  A CACHE.** It lives in the publish bar as a disclosure under the pill — the bar's standing state is
  a boolean, and a permanently open list would change the chrome on every studio page to answer a
  question most visits do not ask.

  **⚠ PER-INDEX WAS REFUSED FOR A STRONGER REASON THAN FIX-ONCE-PER-COLLECTION: IT CANNOT REPRESENT
  THE SUBJECT.** `readDraftBranchStateCached` returns `skills` and the settings singleton, and
  **those belong to no collection index at all** — so four per-index sections would each be silent
  about the parts they do not own, while claiming to show unpublished work.

  **⚠ AND THE FIRST DESIGN WAS WRONG IN A WAY ONLY A SECOND MEASUREMENT FOUND.** The derivation said
  the list could render from `StudioData`, because the per-entry draft records are already computed
  on every page load. True, and not enough: **`useDraftForm` calls `onSaved` and never
  `router.refresh()`**, so a field save does not re-render the layout. The publish PILL is fixed
  client-side because a boolean can be set optimistically; **a list cannot be.** Rendering membership
  from layout props would omit the entry the author just saved, at the exact moment they asked what
  changed.

  **SO THE ROUND TRIP IS NOT BEHIND A QUESTION ALREADY ANSWERED IN MEMORY.** Memory answers *is there
  anything unpublished* — the boolean. *Exactly what* is a different question whose answer goes stale
  on every save. It reuses `publish-preview` rather than growing a second route: the two callers
  differ in MOMENT, not in data.

  **⚠ AND THE FOURTH STATE IS THE ONE A SPECIFICATION OMITS.** `readFailures` non-empty with
  `readError` FALSE — the branch read fine and specific files did not parse, so every other entry is
  a real draft. Collapsing it into the failure case tells an author their work is unreadable when one
  file is. **States A and C are byte-identical but for one flag** (`{ ...EMPTY_DRAFT_STATE,
  readError: true }`), so "nothing to publish" and "I could not look" must never render the same.

  **THE SELECTION IS A LEAF FUNCTION BECAUSE THE PANEL CANNOT BE DRIVEN.** `/studio` is owner-gated
  and `STUDIO_WRITE_MODE=fs` no-ops every write route, so a ternary chain there could only be
  asserted by a source regex — which proves the words exist and nothing about which arm runs.

  **⚠ AND ONE OF ITS OWN ROWS COULD NOT FAIL FOR THE REASON IT NAMED.** `C2` asserted the read error
  *outranks* everything and tested it against a LIST alone, so reordering it below the LOADING check
  survived. **A precedence claim has to name every competitor**; "outranks" with one example is a
  claim about one example. Thirteenth unfalsifiable row this session, found by mutation.

  **AND `behind` IS NEVER SHOWN** — measured at 12 commits behind while carrying one unpublished
  entry. Only AHEAD is unpublished work, and "your draft is 12 behind" is the kind of true, useless,
  alarming line a surface like this grows.

  **THE BOARDED FRAMING, KEPT BECAUSE THE NAMING ARGUMENT IS THE DURABLE PART:**

- **⚠ BOARDED: A STUDIO-WIDE "UNPUBLISHED CHANGES" SURFACE, AND IT MUST NOT BE CALLED DRAFTS.** An
  owner asked for a drafts section on the gallery index "like blog's". **The premise does not
  transfer, and deriving that is the whole entry.**

      blog's drafts     answers "which posts carry `status: draft`" — a CONTENT field, visible on
                        main, SURVIVING publish
      gallery's would   answer "which entries are on the draft branch and not on main" — a BRANCH
                        question, EMPTIED by publish

  **Different lifetime, different subject, same word.** Gallery deliberately has no `status` field
  and the audit ruled that correct, so there is no draft state to list; what an author actually
  wants to see is unpublished work.

  **⚠ AND IT IS NOT GALLERY'S, BECAUSE THE BRANCH IS NOT GALLERY'S.** One draft branch carries every
  collection's edits plus the settings singleton. A per-collection section would answer the same
  question four times over the same underlying diff, and each would be wrong about the others —
  the fix-it-once-per-collection shape this file already carries three times.

  **THE SUBJECT IS THE DIFF, WHICH ALREADY EXISTS.** `publish-preview` classifies every changed file
  off one compare response and `PreviewGroup` already derives its collection half from
  `CollectionName`. A surface listing what publish would carry is a rendering of a value the studio
  computes on every page load — **and it would have shown `camera` right up until the branch was
  deleted**, which is the strongest argument for building it.

- **⚠ A CENSUS OF UNCHECKED JOINS IS DERIVABLE, AND IT IS WHAT AN AUDIT CANNOT BE.** The gallery
  audit's honest limit was that **there is no list of joins to be exhaustive against** — its best
  finding came from a question nothing prompted, so *"I found the joins"* was never a claim it could
  make.

  **THAT FINDING NAMED ITS OWN ENABLER: `entry[1] as PreviewGroup`.** The join was checkable and a
  cast silenced the check. So the list is derivable in part — **every `as` onto a type whose members
  are a closed set the code branches on** is a place someone told the compiler to stop checking
  exactly the thing that breaks when the set is widened. That does not depend on anyone asking the
  right question, which is the whole difference from an audit.

  **⚠ AND A CAST IS NOT A DEFECT, WHICH IS WHAT KEEPS THE CENSUS USABLE.** Eleven were found and
  **ten are guarded**, usually one or two lines above, by a `hasOwnProperty` check or a truthiness
  test the compiler cannot see. Reporting eleven defects would be the wrong-noun error. **One was
  unguarded — the cast WAS the check — and it is the one that shipped.**

  `ralph/tests/unchecked-joins.mjs` pins the inventory with each guard NAMED, so a new cast is a
  decision somebody wrote rather than one nobody noticed.

- **⚠ UNDER CONTENT ADDRESSING THE PATH IS THE SUBJECT AND THE HASH IS NOT — A HASH GREP ANSWERS A
  QUESTION NOBODY ASKED.** Identical bytes carry an identical hash under DIFFERENT PATHS, by design.
  Asked whether two uploaded gallery images were orphaned, a grep for `926214f008d6` returned a hit
  in a **blog** entry — the same photograph had been uploaded to a post, and
  `/images/blog/<post>/blocks/926214f008d6.webp` shares its hash with
  `/images/gallery/akshita/blocks/926214f008d6.webp` and nothing else. **One orphan would have been
  reported as recovered.**

  **THE HASH IS AN IDENTITY OF BYTES; REACHABILITY IS A PROPERTY OF A PATH.** `blockImageHash` is
  sha256 of the normalized file precisely so that re-uploading the same image is idempotent, which
  is a feature — and the same property makes a hash useless for "is anything pointing at this file".

  **ANYWHERE THIS REPO REASONS ABOUT BLOCK-IMAGE REACHABILITY — orphan checks, a future image GC,
  a delete that enumerates assets — THE SUBJECT IS THE FULL PATH.** The boarded image-GC item is the
  one most likely to meet this, and a GC that matched on hashes would delete a file another
  collection is using.

  **⚠ AND RECOVERY RESTORES THE ENTRY, NOT ITS DURABILITY — A RECOVERED ITEM LIVES ON THE DRAFT
  BRANCH, SO THE NEXT DISCARD TAKES IT.** `camera` was recovered onto the draft branch and went out
  with the next discard 29 minutes later, as designed. **Discard does not distinguish recovered work
  from any other unpublished change**, and nothing warns an author that discarding one collection's
  edits also drops work somebody just restored for them. Recovery buys the bytes back; it does not
  buy them a different lifetime.

  **AND THE GOOD HALF OF THE SAME PROPERTY: RECOVERY COSTS NO STORAGE.** Re-uploading an orphaned
  image yields the same path and commits no new blob; the entry is simply pointed at bytes already
  there.

- **⚠ A DENOMINATOR COMPUTED INSIDE A WALK CANNOT SEE THE WALK'S OWN BOUNDARY — AND THE STRONGEST
  INSTANCE IS THE CENSUS THAT EXISTED TO CLOSE THAT DEFECT MISSING A LIST ONE DIRECTORY OVER.**
  Hop 3 counted the gallery's parallel key lists, found six, and brought them to five. **The seventh
  was `Fields` in `GalleryEditPanel`**, and it was missed because that census walked `lib/` while a
  form's field set lives in a component.

  **THE COST WAS NOT A WRONG NUMBER. IT WAS THAT A GALLERY ITEM COULD NOT HOLD AN IMAGE AT ALL** —
  `image`, `width` and `height` were absent from the form, so the upload route committed bytes to
  the draft branch and the entry was never told.

  **⚠ AND EVERY EARLIER INSTANCE OF THIS SHAPE WAS ALSO A CENSUS BEING SURE OF ITSELF:** a
  `.tsx`-only walk missing 81 rung references in `globals.css`, a `.css`-bounded sweep missing a JSX
  inline style, a `box-shadow`-bounded one missing eleven backgrounds. **The census is always
  complete within its walk. That is what makes the boundary invisible from inside it.**

  **THE ONLY QUESTION THAT HELPS: what KIND of file could hold another instance, and does the walk
  reach it?** Asked of hop 3, the answer was "a component can hold a field list", and it was not
  asked.

- **⚠ A GATE CAN BE RIGHT, WIRED, FIRING, AND STILL MEASURING A STATE THE PRODUCT CANNOT LEAVE.**
  `galleryPublishBlockers` refuses an item with no image and zero dimensions. It was correct, it was
  wired in hop 8, and it fired — **on every gallery item, because the editor could not persist an
  image and therefore could not produce an item that satisfies it.**

  **THE GATE WAS NOT WRONG AND ITS SUBJECT WAS UNREACHABLE.** A refusal an author cannot act on
  reads as a broken gate, and the instinct is to soften it; softening would have admitted
  `image: null` to production and made the reader's experience the defect instead of the author's.

  **THE CHECK: when a gate refuses everything, ask whether the passing state is REACHABLE before
  asking whether the gate is too strict.** Same family as an assertion that cannot fail for the
  reason it names, inverted — here the assertion could not PASS for the reason it named.

- **⚠ A GUARD SCOPED TO A FILE MAY NAME THAT FILE'S LOCALS; A GUARD THAT ITERATES MAY NOT. THE
  PROPERTY IS THE ITERATION, NOT THE NAMING.** A `three-pane` row meant to check every shell
  consumer matched on `inspectorFits ? inspector : null` — blog's local name. The case study calls
  its node `inspectorNode`, so **two of three consumers were checked while the row read as covering
  all three.**

  **A SILENT SKIP AND A PASS ARE THE SAME OUTPUT**, which is the whole hazard. Nothing distinguishes
  "this consumer is fine" from "this consumer was never looked at" in a green run.

  **⚠ AND THE CENSUS SAYS THE RULE IS ABOUT ITERATION RATHER THAN ABOUT NAMES.** Two other guards in
  this family name a consumer's locals — `three-pane`'s D rows and `mount-discipline`'s — and **both
  are correct, because each is scoped to ONE NAMED FILE.** Zero others iterate. The iterating guard
  was the only one that skipped, and it was the only iterating guard.

  **THE SECTION ONLY BECAME TRUSTWORTHY BECAUSE IT WENT RED ON THINGS THAT TURNED OUT TO BE FINE.**
  Widening the guard made the case study fail two more rows, and both were the matcher again — an
  inline toggle rather than an imported one, and a dock spelled differently. Three matcher failures
  in one section, each found only by the row going red.

- **⚠ THE RECORD IS ONLY TRUE OF `main`, AND A CLAIM ABOUT THE RECORD IS THE ONE NOBODY CHECKS —
  BECAUSE CHECKING IT FEELS LIKE CHECKING YOURSELF.** Three PR bodies asserted *"`ralph/run.mjs`'s
  header now states that a source regex cannot see reachability"*. **It did not.** The rule existed
  only in #526, approved and unmerged, and three PRs were built on top of it citing it as standing.

  **⚠ THE MEASURED THINGS GOT MEASURED AND THE RECORD GOT ASSUMED — AND THAT IS THE SHARP FORM.**
  Every other claim in those bodies was instrumented: assertion counts run, byte figures read off a
  build, mutation results produced by mutating. **Nobody skipped a check.** They checked everything
  except the SUBSTRATE — the claim about what the repository already contains, which is the one that
  reads as background rather than as an assertion.

  **THAT IS WHY IT SURVIVED THREE PRs.** A skipped check leaves a gap somebody notices; this leaves a
  body full of verified figures with one sentence among them that nothing produced. The verified
  figures are what make it credible.

  **⚠ AND IT HAPPENED AGAIN WHILE THIS VERY ENTRY WAS BEING WRITTEN, WHICH IS THE INSTANCE WORTH
  KEEPING.** The commit carrying this sharpening was reported to the owner as *"record sharpened"*.
  **The push had been refused by the pre-push hook** — ralph was red against a dev `.next` — and the
  branch was later deleted on merge, so the text existed nowhere but a reflog entry. It was
  recovered by `git cherry-pick` from a dangling commit.

  **THE REPORT WAS MADE FROM THE WORKING TREE.** The file said what it should say, so the claim felt
  observed rather than assumed — and the exit code that would have refuted it had been printed one
  command earlier and read as a push retry rather than as a lost commit. **A `git commit` is not a
  claim about the repository; a push that returns zero is.**

  **⚠ AND THE OPPOSITE ERROR FOLLOWED WITHIN THE HOUR, WHICH IS WHY THE RULE IS NOT "TRUST THE
  RECORD LESS".** Checking whether this entry had landed, a `grep` for a phrase containing a
  backtick returned **0** — and the entry was there. **The zero was the MATCHER.** Reported as a
  loss, it would have been a second false claim about the record, in the opposite direction, inside
  the entry about false claims regarding the record.

  **SO THE INSTRUMENT AND THE SUBSTRATE CAN EACH BE THE WRONG ONE.** The first instance measured the
  working tree and reported it as `main`; the second measured `main` correctly with a broken pattern
  and nearly reported an absence. Distrusting the record harder would have produced the second error
  faster.

  **THE ONLY DEFENCE THAT COVERS BOTH IS NAMING WHICH ONE YOU MEASURED.** "0 on `main` via grep" is
  checkable and would have prompted the obvious next question; "it is not in the record" is not.
  Same discipline as stating the subject beside a number, arriving in a claim about the repository
  rather than in a measurement of a colour. Same family as *nothing reported is evidence*, where ten merges
  were reported into a local `main` that had never been pushed — **an instrument was available and
  the claim felt too obvious to instrument.**

  **⚠ AND IT COMPOUNDED WITH A SECOND MISS, WHICH IS WHY IT IS RECORDED AS A SHAPE RATHER THAN A
  SLIP.** The owner approved three PRs on top of the open one without noticing it was open. **Two
  people, one unmerged branch, three false claims** — so it is not a lapse of attention that a
  reminder fixes. A branch that is approved reads as landed to everyone looking at it.

  **THE CHECK: before citing a rule, a constant or a gate as recorded, grep it on `main`.** Not on
  the working tree, which carries whatever the current branch added.

- **⚠ A COMMENT WRITTEN TO REASSURE IS A COMMENT NOBODY RE-CHECKS — SECOND IN TWO UNITS, AND THIS
  ONE COST AN AUTHOR THEIR WORK.** A failed write deleted the draft branch, taking a created entry
  and its uploaded image with it. The code was defended by:

      // Clean up ONLY the branch this call just created. An existing draft is
      // never deleted, so prior saves survive any failure here.

  **FALSE UNDER CONCURRENCY.** `createFromMain` means *the branch was absent when I read it*, not
  *nothing has committed to it since*. Request A creates the branch, request B commits to it, A's
  own commit fails `STALE_DATA` against the head it expected, and **A's cleanup deletes the branch
  with B's commit on it.**

  **⚠ THE TWO COMMENTS ARE THE SAME SHAPE FROM OPPOSITE ENDS.** The pill defect's comment explained
  why a call was UNNECESSARY; this one explained why a deletion was SAFE. Both were written by the
  author of the code, in the same sitting, believing them — and both closed the question for every
  later reader. **A comment that describes behaviour gets checked when the behaviour is doubted. A
  comment that reassures is read as the reason not to doubt it.**

  **THE RULING WAS THE ASYMMETRY, NOT THE MECHANISM: leaving a branch behind is a tidiness cost,
  deleting one destroys work.** And the tidiness cost measured at ZERO — `resolveDraftBase` adopts
  an existing branch as its base, so an orphan created from main with nothing on it is a ref at
  main's head, `differs` is `files.length > 0` which is 0, the pill stays dark, and the next save
  commits onto it. **A narrower guard was available and refused: it would correctly clean up
  something that costs nothing to leave.**

  **⚠ AND THE RACE IS NOT THE DEFECT — `STALE_DATA` IS THE GUARD WORKING.** Two writes, one head,
  and the loser is told. Removing the cleanup does not stop an author seeing a refusal; it stops the
  refusal destroying anything. **The refusal is now recoverable by re-trying the action**, because
  the branch and the winning commit are still there — which is exactly what it was not before.

- **⚠ THE GUARD ON THE GUARD, STATED ONCE AS A RULE: IF A CONFIRMING READ FAILS, THE ORIGINAL STATE
  STANDS.** Two consecutive units grew a confirmation — `mergeBranch` asking whether a merge landed
  before reporting a failed publish, and the draft read asking whether the branch still exists before
  blaming N entries. **Both then had to answer the same second question**, and answering it wrongly
  turns each fix into the inverse defect it was written to remove.

  **A READ THAT CANNOT RUN IS NOT PERMISSION TO CLAIM A DIFFERENT OUTCOME.** The confirmation makes a
  claim HONEST rather than OPTIMISTIC; falling back to the original error is what keeps it honest
  when the confirmation is the thing that broke. **This file's oldest failure mode is an instrument
  reporting the shape of success when it could not look**, and a confirmation without a fallback is
  that failure mode wearing a fix's clothes.

- **⚠ FIELD ORDER IN AN OBJECT LITERAL IS NOT A CONTRACT — TWO INSTANCES, AND BOTH WOULD HAVE BEEN
  "FIXED" BY PINNING THE ORDER.** `publish-preview` I1 compared object literals and failed on KEY
  ORDER; `draft-overlay-degrade` C2 and C3 matched two fields as ADJACENT and went red when a third
  arrived between them. **In all three the literal still carried everything the row named.**

  **THE TELL IS THAT THE ROW FAILS ON AN ADDITION RATHER THAN A REMOVAL.** A row that goes red
  because a field was ADDED is asserting a shape nobody agreed to — and the repair that suggests
  itself, pinning the order, cements an implementation detail as a contract. **Compare as sorted
  pairs, or match the fields independently.**

- **⚠ AN ESTABLISHED MECHANISM AND AN UNATTRIBUTED INSTANCE ARE DIFFERENT CLAIMS, AND THE SECOND
  STAYS UNATTRIBUTED.** The deletion mechanism above is established from code. **Which of the day's
  nine branch deletions was that cleanup and which was the author's own discard is NOT**, because
  the events API reports the token owner for every path — a studio write, a discard and a publish
  are indistinguishable in it.

  **THE TEMPTATION IS TO PICK THE ONE THAT FITS THE STORY**, since the timeline has a delete 17
  seconds before a create and 30 before another. **It fits and it is not evidence.** Recording the
  mechanism as established and the instance as unknown is the whole discipline; a plausible
  attribution written down becomes a fact the next reader inherits.

- **⚠ SIX INSTANCES OF PROSE THAT WAS CORRECT AND UNENFORCED, AND THE SIXTH INVERTS THE PATTERN —
  WHICH IS WHAT MAKES IT A CLAIM ABOUT THIS CODEBASE RATHER THAN ABOUT SIX COMMENTS.**

      SaveIndicator's header   "two unlabelled `Saved` strings a few hundred pixels apart"
      SaveBar's header         `Saved` truncating to `S…` in a 34px track
      the on-accent token      names `bg-accent-500` as the consumer that FAILS while three pass
      createFromMain's cleanup "an existing draft is never deleted, so prior saves survive"
      the create-navigates comment  "the bar is re-rendered from fresh server data"

  **FIVE PROBLEMS WRITTEN DOWN BEFORE THEY WERE ENCOUNTERED, AND EVERY ONE HAPPENED ANYWAY.** Two of
  the five were false and three were TRUE — the `on-accent` comment described the exact failing pair
  and shipped, because describing a defect is not the same act as refusing it.

  **⚠ AND THE SIXTH IS THE CONTROL CASE THE OTHER FIVE LACK.** `GalleryEditPanel:376` says the save
  bar must not render inside a collapsed pane "or it would be clipped into a zero-width pane along
  with the only save control on the surface" — and the `canvasDock` on the very next lines DOES
  something about it. **That comment is correct AND enforced, and nothing went wrong.**

  **SO THE DIFFERENCE IS NOT THE QUALITY OF THE PROSE. IT IS WHETHER ANYTHING BESIDE IT ACTS.** All
  six were written by people who understood the hazard; the five that failed had no mechanism beside
  them and the one that held did. **In every one of the five, the eventual fix was a gate rather
  than a better comment** — which is the actionable half, because the instinct on meeting a stale
  comment is to rewrite it.

- **⚠ "I RECORDED IT" IS A CLAIM ABOUT THE REPOSITORY, AND THE SUBSTRATE IS THE THING NOBODY
  MEASURES — FOUR INSTANCES IN ONE ARC, AND THE FOURTH WAS FOUND BY CHECKING.** A report ended with
  `Recorded:` and a summary of two entries. **Neither had been written.** A grep for each returned
  zero, run only because the same message had just finished diagnosing a stale reading — so the
  habit was fresh and got pointed at its own author.

      the `run.mjs` citation   asserted as standing in THREE PR bodies; the rule existed only in an
                               approved, unmerged branch
      the sharpened entry      committed, push REFUSED, branch deleted — the text lived nowhere but
                               a reflog and was recovered by cherry-picking a dangling commit
      the deploy reading       taken once, quoted forward through four reports over ninety minutes
                               while production deployed three more times
      `Recorded:`              claimed in the message that diagnosed the one above it, with nothing
                               written

  **⚠ EVERY ONE WAS SURROUNDED BY MEASURED CLAIMS.** Those reports carried assertion counts run,
  byte figures read off a build, contrast ratios rasterised from a pixel, mutation results produced
  by mutating. **Nobody skipped a check.** What went unchecked each time was the claim about what
  the repository already contains — the one that reads as background rather than as an assertion.

  **⚠ AND A CLAIM ABOUT YOUR OWN WORK IS THE LEAST LIKELY OF ALL TO BE CHECKED, PRECISELY BECAUSE IT
  IS YOURS.** "I wrote that entry" feels observed, in the way "the file says X" does not. It is the
  same act as citing a figure without re-deriving it, applied to the thing you did five minutes ago.

  **THE CHECK IS ONE COMMAND AND IT IS THE ONLY DEFENCE THAT HAS WORKED: grep for the words before
  saying they are there.** Not on the working tree when the claim is about `main`, and not on
  memory when the claim is about the working tree.

- **⚠ A STAMPED ROW LOOKS LIKE A FACT AND IS A READING, AND THE REMEDY MADE THE ERROR EASIER TO
  MAKE.** The three-reading row was built so "production is behind" would carry its time. It was
  then **quoted forward through four reports over ninety minutes**, by both parties, while
  production deployed three more times — and the timestamp was in the row each time and neither
  person read it.

  **⚠ A FORMATTED ROW READS AS AUTHORITATIVE IN A WAY A SENTENCE DOES NOT.** "Production is at X as
  of 14:40Z" invites the question; a monospaced block of aligned readings looks like state. The
  remedy for a stale claim became a better vehicle for one.

  **THE ACTIONABLE HALF IS THE WATCH.** It was armed on one sha, fired correctly, exited — and
  nothing re-armed it, so every later quotation cited an instrument that had stopped. **A ONE-SHOT
  WATCH QUOTED AFTER IT FIRES IS A DEAD INSTRUMENT REPORTING LIVE.**

  **AND THE FIX IS AT THE QUOTATION, NOT THE WATCH — the watch was not wrong.** The row carries the
  AGE OF ITS SOURCE, so a copied row visibly ages and a re-read one says so. `re-read, not copied`
  is the form.

- **⚠ A COMMENT THAT JUSTIFIES AN OMISSION IS THE MOST DANGEROUS KIND, AND IT IS THE FIFTH INSTANCE
  OF PROSE AND CODE MOVING APART — BUT THE FIRST WHERE THE PROSE CAUSED THE DEFECT.** The other four
  described behaviour the code did not have. **This one explained why a call was not needed, and so
  the call was never written.**

      "a create navigates straight to the new entry, so the bar is re-rendered from fresh
       server data and the stale flag is never seen"

  **EVERY CLAUSE IS FALSE.** `PublishProvider` does `useState(initialDiffers)` — seeded once at mount
  and never re-seeded from props — and `initialDiffers` is read in the `(dashboard)` LAYOUT, which
  **does not re-render on a client navigation inside its own segment.** A push from the index to the
  editor stays in that segment, so the provider never remounts and the navigation refreshes nothing.

  **⚠ IT CLOSED THE QUESTION FOR EVERY LATER READER INCLUDING ITS AUTHOR.** #537 added the mark to
  DELETE in both indexes and skipped CREATE, citing this. Two collections shipped without it —
  gallery, where an owner found it at a browser, and **blog, which nobody has driven.**
  `CaseStudyIndex` has always marked before its push, and that ordering is the entire difference.

  **THE COMMENT IS QUOTED IN BOTH FILES RATHER THAN DELETED**, because the retraction is the useful
  artefact and a later reader who meets only the correct code learns nothing. **Nothing re-derives a
  reason**, which is why prose that forbids work is worse than prose that describes it.

- **⚠ AND THE DIAGNOSIS OF THAT DEFECT CONTAINED ONE OF ITS OWN, IN THE SAME SHAPE THIS FILE NAMES A
  DOZEN TIMES: A MATCHER NARROWER THAN ITS CONCEPT.** The report claimed `create-entry` never
  invalidates the cached draft state, so a hard refresh would keep under-reporting for 45 seconds.
  **It does invalidate, on the success path.** The grep searched
  `revalidateTag|revalidatePath|DRAFT_STATE_TAG` — the IMPLEMENTATION vocabulary — while the route
  calls the exported wrapper `invalidateDraftStateCache()`.

  **THE OWNER RULED ON IT BEFORE IT WAS REFUTED** — *"part 3 must ship with part 1"* — so a false
  finding directed a unit's scope for one exchange. **Derived properly, every POST route but the two
  session routes invalidates exactly once, and all five that do not are GET.** The server half was
  never broken.

  **THE CHECK: WHEN GREPPING FOR A BEHAVIOUR, GREP FOR THE EXPORTED NAME CALLERS USE, NOT THE
  PRIMITIVE IT WRAPS.** A wrapper exists precisely so callers do not name the primitive.

- **⚠ A COMMENT IS WRITTEN WHEN THE INTENT IS FRESHEST AND CHECKED NEVER — FOUR INSTANCES IN ONE
  COLLECTION, WHICH MAKES IT A PATTERN RATHER THAN A FOURTH ANECDOTE.** Every one described correct
  behaviour beside code that did not do it, and every one was written by the author of the code, in
  the same sitting, believing it:

      the publish loop's "explicit per-collection arms"   the last arm was a fallthrough
      "the only thing between an unlabelled image and     `galleryPublishBlockers` had zero callers
       a reader"
      `createEntry`'s "explicit per-collection arms"      same false claim, second file
      `GalleryOverlay`'s "a plain <img> … the optimizer   its own image is `next/image`, and the
       refetches without the owner cookie"                 header states the rule it breaks

  **THE MECHANISM IS THE TIMING.** A comment is written at the moment the intent is clearest, which
  is BEFORE the code has been driven — so it records what the author meant. Nothing re-reads it
  against what shipped, because prose is not a subject any gate has. **The claim ages into being
  false and reads as verification the whole time.**

  **⚠ AND THE FOURTH IS THE SHARPEST: THE RULE IT BROKE WAS STATED IN ITS OWN HEADER.** Proximity is
  not protection. Reading the file does not surface the contradiction, because the comment and the
  code are read as one thing by whoever wrote both.

  **WHAT ACTUALLY CATCHES THESE: grep the callers, run the branch, drive the flow.** Three of the
  four were found by a person using the feature and the fourth by a browser measurement. None was
  found by reading, including by re-reading.

- **⚠ "NO SAVE DRAFT" WAS THE OUTSIDE VIEW OF A FORM THAT DOES NOT EXIST IN TWO STATES, AND THE
  REPORT NAMED A MISSING BUTTON.** Saves were wired throughout: blur called `saveDraft` on every
  field, `SaveIndicator` rendered, structural ops posted their own bodies. **The defect was a
  missing composition.** `inspector={inspectorFits ? inspector : null}` is correct and is half a
  fold — the canvas needs the other half, and gallery gave it none, so below 1100px the author saw
  a preview and no form at all. A dragged-shut inspector produced the same symptom by a different
  route, because a save control nested in a zero-width `inert` pane goes off screen with it.

  **THE LESSON IS ABOUT REPORTS RATHER THAN ABOUT FOLDS: AN OWNER REPORTS THE MISSING AFFORDANCE,
  NOT THE MISSING MECHANISM.** "No save draft" and "the image needs a refresh" are both descriptions
  of a SURFACE, and both had causes one layer down that the wording pointed away from. **Establish
  whether the thing is happening before adding a control for it** — the alternative here would have
  been shipping a Save button into a panel that already saved, leaving the real defect intact and
  the report closed.

- **⚠ KNOWING DOES NOT PREVENT — THE RULE WAS WRITTEN, THEN BROKEN TWO UNITS LATER BY THE HAND THAT
  WROTE IT, AND ONLY MUTATION CAUGHT IT.** `ralph/run.mjs`'s header now states that a source regex
  cannot see reachability. Two units on, the gallery publish check was asserted with a regex over
  `publish-site-settings.ts` — a module that reaches GitHub and therefore cannot be loaded — and
  **replacing the whole arm with a pass-through left that regex matching the orphaned body and the
  suite fully green.**

  **THAT IS THE NINTH INSTANCE OF THIS SHAPE IN THIS PROJECT AND IT IS THE ARGUMENT FOR THE MUTATION
  STEP EXISTING.** Every earlier one was found the same way: the mutation, never the reading. A rule
  in a header is a thing the author agrees with and then does not apply, because applying it requires
  noticing that THIS row is an instance — and the whole difficulty is that an instance does not
  announce itself.

  **THE DURABLE HALF IS STRUCTURAL RATHER THAN A REMINDER: A MODULE THAT REACHES THE NETWORK CANNOT
  BE LOADED, SO ANY ASSERTION ABOUT IT IS A REGEX, AND A REGEX CANNOT SEE REACHABILITY. THE ANSWER IS
  ALWAYS EXTRACTION.** What is not free is the DIRECTION, and the leaf discipline decides it: a leaf
  may value-import PACKAGES ONLY, so the blockers could not move to the validator and the validator
  moved to the blockers.

- **⚠ SIX PARALLEL KEY LISTS BECAME FIVE, AND THE HONEST NUMBER IS FIVE RATHER THAN THE FOUR I
  AIMED AT.** The gallery's field names were written down six times: the Keystatic schema, the
  sanitizer's per-key arms, `GALLERY_SCHEMA_KEYS`, the serializer's `GALLERY_KEYS`, the `GalleryItem`
  type, and a `readEntry` I added knowingly in the publish gate. **The success condition was that
  the count go DOWN, not that a gate watch six lists agree.**

  **WHAT ACTUALLY CAME OUT: `mapGalleryItem` MOVED INTO THE LEAF**, which deleted `readEntry` — one
  function now serves the public read and the publish gate.

  **⚠ AND THE SECOND COLLAPSE WAS TRIED AND REVERTED, WITH THE MEASUREMENT.** Importing the key list
  into the serializer made that file value-import another relative module, and **Node cannot resolve
  an extensionless `.ts` while `tsc` rejects the extension** — so two leaves cannot share a runtime
  value, and both must stay loadable because suites drive them. The copy is restored with a gate
  rather than a promise, the third forced copy in this codebase after `INSPECTOR_BOUNDS` and
  `COLLECTION_FILE_RE`.

  **⚠ DERIVATION WAS MEASURED BEFORE THE COMPARISON WAS ACCEPTED.**
  `Object.keys(config.collections.gallery.schema)` enumerates cleanly, in declaration order, ten
  keys. **The schema CAN be the source and cannot be the runtime source**, for the same leaf reason.
  So the comparison is a considered second-best with its cause recorded, rather than the default.

  **AND BOTH DIRECTIONS ARE GATED, BECAUSE THEY ARE DIFFERENT DEFECTS.** A key in the schema and not
  the list is **silently dropped on save**; a key in the list and not the schema is **the red build**.
  One check catches one of them, and mutation confirms each fires on its own.

- **⚠ FOUR JOINS, FOUR DEFECTS, ZERO FOUND BY A SUITE. A COLLECTION IS NOT DONE WHEN ITS SUITES ARE
  GREEN — IT IS DONE WHEN A PERSON HAS DRIVEN CREATE-TO-PUBLISH AND A FAILURE PATH IN A BROWSER.**
  Creating the first gallery item took three PRs and then broke production. Every one of its defects
  lived in a JOIN, and every part on either side of that join had a passing gate:

      a dispatch table nothing selected through          #525
      a route computing a sanitized value, passing raw   #525
      a sanitizer and a schema that never met            open, hop 3
      a publish gate that exists and is never called     this unit

  **THE GATES PROVED EVERY PART AND NOTHING PROVED THEY WERE CONNECTED.** `gallery-format` proved
  `sanitizeGalleryCreate` while the create path called `sanitizeProjectCreate`. `galleryPublishBlockers`
  refused an empty alt, a missing image and a zero dimension — exactly what shipped — with **zero
  callers**, while a comment in the public page called it "the only thing between an unlabelled image
  and a reader".

  **⚠ THE PUBLISH LOOP'S DEFECT WAS THE CATCH-ALL, NOT A MISSING ARM.** It ran two `if`s and then a
  branch matching *any other content yaml*, which applied a placeholder scan and ACCEPTED the file.
  **Gallery did not slip through a gap; it landed in the branch designed to accept the
  unrecognised**, which is why a third `if` would have repaired one instance of a shape that repeats.
  It is a `Record<CollectionName, …>` now, so a fifth collection is a compile error.

  **THE STANDING RULE THIS CHANGES:** suites green is not the finish line. Create, upload, edit,
  reorder, delete, preview, publish and build — driven by a person — is. Four collections have now
  produced four first-browser-run defects, and the fifth will too.

- **⚠ A GATE THAT EXISTS AND IS NEVER CALLED IS WORSE THAN ONE THAT DOES NOT EXIST, BECAUSE ITS
  PRESENCE READS AS COVERAGE.** `galleryPublishBlockers` was written with the collection, tested by
  eight rows, and wired to nothing. Every reader of that file — including the author — saw a publish
  gate. **And prose made it worse:** a comment asserted the link, so the claim was documented as well
  as absent.

  **THE `structural()` SHAPE IN ITS WORST FORM.** A dead helper is inert; a dead GATE is inert while
  advertising that something is guarded. The tell is cheap and this arc used it twice:
  **grep the callers before trusting a gate**, and treat a validator whose only mentions are comments
  as unwired until proven otherwise.

  **⚠ AND THE COMMENT WAS CORRECTED IN THE SAME COMMIT AS THE WIRING, DELIBERATELY.** Fixing the
  prose first would have left a documented gate still uncalled; fixing the code first would have left
  a false claim standing beside a true mechanism. The code and the claim move together.

- **⚠ WHEN A MAP'S VALUE TYPE HAS TO WIDEN TO ADMIT ONE MEMBER, ASK WHY THAT MEMBER DIFFERS BEFORE
  WIDENING. A `Record` THAT WILL NOT TYPE WITHOUT A UNION IS THE TYPE SYSTEM REPORTING AN
  INCONSISTENCY.** Converting the create dispatch to `Record<CollectionName, …>` would not compile,
  because three sanitizers returned `{ ok: true, value }` and one returned `{ ok: true, patch }`.
  **The annotation was widened to a union of both shapes and it compiled.** I wrote that union
  myself and did not read it as a finding.

  **THE UNION IS THE EASIEST WAY TO SILENCE THE REPORT AND IT PRESERVES THE DEFECT.** It says "these
  four are allowed to disagree" — which is exactly what the mapped type was introduced to stop, so
  the widening undoes the change while leaving it in place. **Same session, same file, one PR
  apart:** the identical shape had already been found in the error half, where gallery returned
  `{ error: string }` against three `{ error: SaveError }` and a mapped type refused to build until
  all four agreed.

  **THE TELL IS THE `|` IN A MAP'S VALUE TYPE.** A registry exists to say its members are
  interchangeable at that key; a union in its value type says they are not. Either the odd member
  should join the others, or it does not belong in the map — and both are decisions, where widening
  is a decision disguised as a type annotation.

- **⚠ A GATE ON A COMPONENT PROVES NOTHING ABOUT A FLOW THAT DOES NOT CALL IT — AND THE SECOND HALF
  IS THE ONE THAT SHOULD CHANGE BEHAVIOUR.** `gallery-format` G1 to G3 proved `sanitizeGalleryCreate`
  correctly, and **the create path did not call it.** The route computed a sanitized value for its
  400 check and passed the RAW one on; the commit layer re-sanitized through a ternary whose `else`
  arm was projects, so the bytes that reached disk came from `sanitizeProjectCreate`. Three green
  rows about a function with no caller on the path they described.

  **⚠ AND THE SAME DEFECT WAS THEN COMMITTED INSIDE THE SUITE WRITTEN TO CATCH IT.**
  `collection-dispatch` section D drove the gallery serializer directly and asserted the exact bytes.
  Pointing the dispatch table's gallery row back at the projects serializer — reinstating the precise
  404 — left **every row green**, because those rows call the serializer and never touch the table
  that chooses it. Caught by mutation, not by reading, in a suite whose header claims to test the
  join.

  **THE ONLY THING THAT HAS EVER FOUND THIS CLASS IS A PERSON USING THE FEATURE. FOUR COLLECTIONS,
  FOUR FOR FOUR:** the blog's dropped status save, the canvas image that 404s before publish, the
  ambiguous publish refusal, and now a create that 404s. **Not one was visible to a gate**, and each
  arrived on the first browser run.

  **⚠ SO THE CONCLUSION IS NOT ANOTHER SUITE.** Suites verified every part of the gallery write path
  and the path was broken end to end. **The rule is that a collection is not done until a create has
  been driven through a browser** — create, upload, save, reorder, delete, publish — and that step
  is owed BEFORE the collection is called finished rather than after an owner reports a 404.

  **⚠ AND FOUR FOR FOUR IS A PREDICTION, NOT A TALLY.** The fifth collection will do this too. The
  cost of the browser run is minutes; the cost of skipping it has now been one production 404 and a
  silent draft-overlay degrade that nothing on screen named.

- **⚠ THE HERO'S SCROLL CUE WAS A 665px ANCHOR AROUND 140px OF TEXT — CLOSED, AND THE STRIPS WERE
  NEVER THE DEFECT.** `.hero-copy` is a grid and a grid item stretches its column by default, so
  this link's box spanned the copy column while its words stopped early. Two fixed strips at the
  bottom edge both landed on the blank tail.

      before   box 62 -> 727   665px, hittable across all of it, text ending at 202
      after    box 62 -> 202   140px, blank tail 14px (the dot marker and its gap)

  **ONE PROPERTY, `justify-self: start`, AND NOTHING VISIBLE MOVED** — the content was already
  left-aligned inside the stretched box. Probes at x 222, 494 and 700 no longer reach it.

  **⚠ THE TEMPTING FIX WAS TO MOVE THE STRIPS, AND IT WOULD HAVE BEEN WRONG.** They sit at
  `fixed bottom-4 left-1/2` and are where they should be; what was wrong was an anchor five times
  wider than the thing it labels. **Asking which element was at fault rather than which two
  overlapped is the whole of this entry.**

  **⚠ AND IT HAS NO GATE, SAID RATHER THAN IMPLIED.** The assertion that matters is a RENDERED WIDTH,
  which ralph cannot measure; a declaration check would go on passing if the grid changed underneath
  it. The trigger for re-measuring is any change to `.hero-copy`'s layout mode.

- **⚠ THE NINTH DEFECT IN `mutate.mjs`, AND IT SHARPENS THE BOARDED ITEM BELOW RATHER THAN JOINING
  IT: `--edit` VALIDATES THE ANCHOR'S UNIQUENESS AND `--revert-edit` SEARCHES FOR THE REPLACEMENT,
  WHOSE UNIQUENESS IS NEVER CHECKED.** A mutation removed a line by replacing

      setUnpublished(true);\n        router.push(`/studio/gallery/     ->     router.push(`/studio/gallery/

  The anchor was unique, so the edit was accepted. **The replacement was not** — that file pushes to
  the same route from a row click a hundred lines below — so the revert refused, correctly, and
  **the edit became unrevertable by the tool.**

  **⚠ AND THE REFUSAL LEFT THE ENTRY IN THE MANIFEST, WHICH IS HOW IT SPREADS — AND THE `at worst`
  BRANCH THIS FILE ONLY HYPOTHESISED ACTUALLY HAPPENED.** The phantom-manifest entry was recorded as
  costing "at best a round to a phantom, at worst it finds the replacement string by coincidence in
  restored source and rewrites a line nobody mutated." **It found it and rewrote it** — a duplicated
  `setUnpublished(true);` in two files that were already correct.

  **⚠ AND THE AGENT THAT APPLIED IT WAS `ralph` ITSELF.** `mutate-harness` is one of the 94 suites and
  it exercises the real binary, so **running the full suite with a dirty manifest mutates the working
  tree.** A gate that edits source when its own tool's state is stale is the sharpest form of the
  harness catching contamination produced by its own tool — the second such instance, and the first
  where a routine green run was the vector.

  **THE OPERATIONAL RULE UNTIL THE MECHANISM LANDS: IF `mutate-harness` C3 IS RED, CLEAR THE MANIFEST
  BEFORE RE-RUNNING RALPH**, not after — the re-run is what applies the damage.

  **THE CHEAP HALF IS ONE MORE REFUSAL AT EDIT TIME: reject a replacement that already occurs in the
  file**, because unrevertability is knowable before the edit, which is the posture the other five
  refusals already take. **The expensive half is the boarded item below** — recording position
  rather than searching for its own output, which removes the question entirely.

  **AND THE RECOVERY THAT WORKED IS THE ONE THE RECORD ALREADY PRESCRIBES: COMMIT BEFORE A MUTATION
  BATTERY.** HEAD held the intent, so `git checkout` on the two files was precise rather than
  destructive — the exact condition under which this file permits it.

- **⚠ CLOSED: `mutate.mjs` OWNS THE EDIT — AND THE "FOUR OF NINE" ESTIMATE WAS WRONG. IT IS TWO
  CLOSED AND ONE NARROWED.** Derived one by one in the tool's own header rather than estimated
  again: the empty replacement and the non-unique replacement are gone, because both were the
  *locate step* and there is no locate step now. The phantom manifest is NARROWED — a revert can no
  longer fail to locate, but it can still refuse on the fingerprint, and that refusal still leaves
  entries recorded. **The other six belong to the snapshot mechanism or to parsing, and this change
  does not reach them.**

  **⚠ A FIX CREDITED WITH MORE THAN IT DID IS HOW THE NEXT READER STOPS LOOKING**, which is why the
  not-closed list is written out beside the closed one. The snapshot mechanism still carries four of
  the nine.

  **⚠ AND THE OPEN DESIGN QUESTION DISSOLVED RATHER THAN BEING ANSWERED.** It was: a position record
  shifts under a later edit to the same file, so refuse a second edit or re-anchor. A CONTENT record
  makes the question disappear — each edit stores the state it found. **The verify loop is the
  argument**: two edits to one file record A→B and B→C, and after unwinding the file holds the FIRST
  edit's `before`. A per-edit check compares the settled file against B and fails a revert that
  worked; a position record cannot express which state is correct at all. That bug was in the first
  draft and was caught by driving two edits through, not by reading.

  **⚠ AND DRIVING IT FOUND A FOURTH SAFE STATE NOTHING HAD NAMED.** The dirty-and-unsnapshotted
  refusal fired on a file the tool had mutated ITSELF, so a second edit was impossible without a
  snapshot — the tool refusing to touch its own dirt. Its premise was "nothing but the working tree
  knows what those changes were", and after the ownership change the tool knows. The check is the
  fingerprint rather than the filename, so a file the tool mutated AND the operator then edited still
  falls through to the refusal.

  **THE SUPERSEDED FRAMING, KEPT BECAUSE THE COUNT WAS THE ARGUMENT FOR DOING IT:** Three of the
  nine are data loss or silent damage, and **the ninth rewrites lines nobody mutated on a LATER
  run**, applied by a routine green ralph rather than by an operator.

  **A VERIFICATION HARNESS THAT DAMAGES THE TREE IS WORSE THAN NONE**, which is the same argument
  this file makes about a safety net that restores the wrong state: the danger is not that it fails,
  it is that it is trusted while failing.

  **⚠ AND THE TAKE IS AFTER THE DRIVE, NOT INSTEAD OF IT.** The drive is the only thing that has ever
  found this class of defect; the harness is what proves the fixes. Fixing the harness first would
  spend the session on the instrument while the collection with five real items sits undriven.

  Eight defects had been found in this one mechanism when this item was first raised and **three were
  the same gap** — the tool does not own the operation end to end, so the operator supplies the missing
  half and the missing half is where the damage happens.

      the `git checkout` incident   reverted by hand, DESTROYED UNCOMMITTED WORK
      the empty replacement          a mutation shape the revert cannot locate
      the phantom manifest           a restore left records describing damage that was gone

  **THREE OF EIGHT, ONE MECHANISM.** All three are prevented by the same change: the tool applies
  the edit, records where it landed **by position rather than by searching for its own output**,
  and reverts from that record. `--edit` and `--revert-edit` were the first half and stopped short —
  they own the apply, and the revert still works by string search, which is why an empty replacement
  is unrevertable at all.

  **⚠ THE FIVE REFUSALS ARE NOT THAT CHANGE.** Each closes a state the tool cannot recover from,
  which is right and is still a guard. **This file's own rule is that only a mechanism prevents a
  failure mode**, and the refusals exist precisely because the mechanism is missing.

  **THE OPEN DESIGN QUESTION, WHICH IS WHY IT WAS BOARDED RATHER THAN BUILT:** position records
  shift under any other edit to the same file, so the tool must either refuse a second edit to a
  file it has already touched, or re-anchor. Answer that first.

- **⚠ A SYNTAX ERROR SHIPPED IN `mutate.mjs` UNDER 3,100 GREEN ASSERTIONS, AND ITS REPAIR NEARLY
  SHIPPED A TEMPORAL DEAD ZONE ERROR — RUNNING IS THE ONLY CHECK THAT SEES EITHER.** The predecessor
  was a multi-line string pasted into a `console.log`, invisible because `run.mjs` runs SUITES and
  no suite imports the harness. `node --check` was the repair, and it is a PARSE.

  **A `const` referenced above its declaration parses perfectly.** Moving `EDITS` beside `SNAP` so
  `--restore` could clear it put a use at line ~145 and the declaration at ~230, and `--check`
  reported clean. Only executing the branch raises `ReferenceError`.

  **⚠ AND THE FIRST RUN DID NOT REACH IT, WHICH IS THE HALF WORTH REMEMBERING.** `--restore` exits
  early when no snapshot exists, so the first execution returned exit 2 without ever evaluating the
  new line — **a run that proves nothing looks exactly like a run that proves it works.** Proving it
  meant taking a snapshot first to construct the state that reaches the line.

  **THE RULE: for a guard added to a branch, run the branch.** Not the file, not the parser, not the
  common path — the specific state that reaches the new code.

- **⚠ THE MUTATION PATH IS NOW OWNED BY THE MUTATION TOOL — CLOSED, AND THE RULE THAT PRECEDED IT
  IS WHY A MECHANISM WAS NEEDED.** `mutate.mjs` snapshotted, restored and verified itself, and did
  **not** perform the edit: every mutation was applied by hand, so the tool never learned the target,
  could not refuse anything, and could not revert precisely.

  **THE INCIDENT.** Mutation-testing the counterpart registry, the restore step inside the loop was
  written as `git checkout lib/theme.ts` — the destructive operation this whole mechanism exists to
  replace — reached for while applying the rule that names it, in a loop whose first line was
  `--snapshot`. The registry was uncommitted, so the checkout discarded it.

  **⚠ THE INTERIM RULE WAS WRITTEN DOWN, WAS CORRECT, AND DID NOT STOP IT HAPPENING AGAIN.**
  "`--restore` is the only restore path in a mutation loop" is still true and still worth knowing.
  It did not help, because reaching for `git checkout` is faster than remembering a rule. **ONLY A
  MECHANISM PREVENTS A FAILURE MODE** — the same conclusion `theme-contrast`'s header reached about
  its own hazard 5, and the argument for building this rather than being careful next time.

  **`--edit <file> <anchor> <replacement>` AND `--revert-edit`.** Four refusals, each proved on a
  constructed state rather than argued:

      dirty and unsnapshotted   REFUSED, and it names the snapshot command that fixes it. This is
                                the incident's exact state and the only one nothing can recover.
      anchor absent             REFUSED — an unrun mutation reports SURVIVED, the false negative
                                this file exists to make impossible.
      anchor not unique         REFUSED — the edit would land somewhere nobody named.
      replacement === anchor    REFUSED — a no-op mutation always survives and reads as a weak gate.

  **AND THE REVERT IS PRECISE WHERE `git checkout` IS TOTAL.** Proved end to end: a file carrying
  BOTH a mutation and uncommitted work came back with the mutation gone and the work intact —
  `git checkout` would have destroyed the second. An empty revert refuses rather than reporting a
  success it did not perform, which is the silent-success shape all seven earlier defects here had.

  **⚠ IT DOES NOT REPLACE `--snapshot`/`--restore` AND MUST NOT.** Those cover the operator's whole
  tree; this covers the edits the tool applied. A mutation loop wants both, and the verdict's own
  hint now names the right one.

- **⚠ THE WORK FILTER IS CLOSED, AND WHAT IT WAS IS NOT WHAT THE RECORD SAID.** The item here read
  *"THE WORK FILTER FAILS CONTRAST ON EVERY PALETTE... The pressed chip measures 2.03... The
  unpressed chips measure 1.30 and 1.90 on dark."* **None of those figures reproduce.** Measured from
  the paint, in scope, sanity pair 21.000 first, the two text floors clear on all six palettes —
  18.78 to 19.04 pressed and 7.11 to 8.95 unpressed — and **the glyph reaches its declared colour
  exactly, Δ0.0 on every sample.** Two named causes: `getComputedStyle(btn).color` returns
  `oklch(0.985 0.007 250)` here rather than an `rgb()` string and a digit-run parse of it yields
  0, 985, 0; and the "two grounds" was **an antialiased edge**, `rgb(52,58,64)` being 2 pixels of
  8880 at ~20% coverage.

  **THE REAL DEFECT WAS THE AFFORDANCE AND IT WAS SAPPHIRE-ONLY: the thumb measured 1.17 against the
  control's surface**, 18.78 to 19.04 on the five light palettes. Fixed by making the pair explicit —
  fill `text-primary`, label `surface` — which is **byte-identical to the shipped pair on every
  light palette** and takes sapphire to 15.20. One `ink-950` ratchet member discharged.

  **⚠ THE ELEMENT IS AN INVERTED GROUND AND NO ROLE NAMES ONE**, so both roles are used against their
  names — a text role draws a fill and a ground role draws text. **Recorded rather than resolved**,
  and it is the second such consumer. **If a third appears the role is missing rather than the
  consumers being odd**, and it gets weighed against #382's test then: a role invented for one or two
  sites is a second spelling entering the layer at birth. `role-layer` section O asserts the PAIR.

- **⚠ THE FORCED-ATTRIBUTE MECHANISM TEST IS RETIRED, DELIBERATELY, AND THE TWO HALVES RETIRE FOR
  DIFFERENT REASONS.** It would have forced `data-ground="dark"` onto each palette and checked that the
  role layer remapped. **This is a retirement with its reasoning, not a lapse** — which matters,
  because four items closed this week had lapsed silently and were indistinguishable from ones nobody
  had looked at.

  **ONE. THE DARK PATH IS PROVEN BY USE, WHICH IS STRICTLY MORE THAN THE TEST PROVES.** Sapphire was
  built, gated, rendered, published and lived on. A forced attribute proves a mechanism responds; a
  shipped palette proves the mechanism, the values, the components and the author's own reading of
  them. The larger evidence subsumes the smaller.

  **TWO. THE RESIDUE — THE FOUR LIGHT PALETTES' OWN VALUES UNDER A DARK GROUND — IS NOT REACHABLE.**
  `data-ground` is emitted in `app/layout.tsx` from the published theme's declared class, so a light
  palette never resolves under it. There is no visitor state to test.

  **⚠ AND THE EVIDENCE FOR THE SECOND HALF IS BETTER THAN THE ARGUMENT, BECAUSE THE STATE WAS REACHED
  BY ACCIDENT AND MISREAD AS A MEASUREMENT.** A probe set `data-theme` without `data-ground`, cream
  resolved through a dark ground, and it produced clean, plausible, internally consistent figures —
  which described **a state no visitor can see.** That is the argument demonstrated rather than
  asserted, and it is why the residue is not worth a gate.

  **⚠ AND THE TEST ITSELF EXISTED ONLY AS A CARRIED CONVERSATIONAL ITEM**, named in no file. **A test
  that lives only in conversation cannot lapse visibly** — it simply stops being mentioned, and
  nothing distinguishes that from a decision. Recording the retirement here is the whole remedy.

- **⚠ THE NEAR-MISS CATEGORY IS EMPTY AND ITS ROW IS DELETED, ON `J3`'s RULING.** `step-1b-near-literals`
  held every colour kept as "close enough to a token to leave alone". All three members have moved —
  `#5F584E` to `text-secondary`, `#9C9182` to `text-subtle`, and the contact glow's middle stop to a
  `color-mix` of the accent — so the row matched nothing and **a row matching nothing has outlived its
  subject.** The boundary file holds claims about live colours; the reasoning lives here.

  **⚠ AND THE "OTHER EIGHT" NEVER EXISTED AS LIVE MEMBERS.** The row claimed nine such literals were
  *"named in this file's header from the day it was written"*. **The header names no such list** — it
  was rewritten and the claim was not. Derived rather than counted: it was the only `near-miss-kept`
  row of twenty-two, and `J1`, `J1b` and `J3` all pass, so every live colour is claimed by exactly one
  row and no other row is a near miss. **Zero unexamined, not eight.** The population had drained and
  the prose kept counting it.

- **⚠ A GUARD THAT CORRECTLY ESTABLISHES NO FLOOR APPLIES CAN CLOSE A QUESTION IT NEVER ASKED.** The
  glow stop was kept because it is *"decorative at 10% alpha, so no contrast floor applies"* — **true,
  and exactly why nobody looked further.** It was the accent frozen at cream's hue, sitting inside the
  same `radial-gradient` declaration as `var(--color-accent)`, 57 to 149 degrees from every other
  palette's accent.

  **Establishing that one class of check does not apply is not the same as establishing that nothing is
  wrong**, and the second reads exactly like the first in a record.

  **⚠ AND THE RENDER CORRECTED THE MECHANISM.** The prediction was two hues fading into each other. At
  10% alpha under a 46px blur the orange does not band, it **NEUTRALISES** — harbour read grey-blue
  rather than teal, fern grey-green rather than green, sapphire's glow nearly invisible. **Right that
  something was wrong, wrong about what**, and only the render could tell them apart.

- **⚠ THREE STALE RECORD CLAIMS WERE CLOSED IN ONE SESSION, WHICH IS ITSELF THE FINDING.** The
  experience descriptions, the published-post count, and this entry. None was wrong about the code.
  Each was a claim about the present that had quietly stopped being true, and **one of them directed
  a session's ordering** — the descriptions were ranked first for content work on the strength of
  being open, months after the schema had closed them.

  **A RECORD DECAYING FASTER THAN ANYONE RE READS IT IS THE PROBLEM, NOT ANY ONE ENTRY.** `PORTABLE.md`
  rule 15 states the portable half. The local half is that this file is long enough that re reading it
  is itself work, so the entries most likely to be wrong are the ones nobody has touched — and those
  are exactly the ones that get carried.

- **⚠ THE EXPERIENCE DESCRIPTIONS ARE CLOSED, AND WERE CLOSED BEFORE THIS ITEM WAS LAST READ.** It
  said *"the five are still empty. Write them or decide to drop the field. The decision is worth as
  much as the copy."* **The decision was made and executed.** `description` is deleted from
  `keystatic.config.ts`, no content file carries it, all five entries are complete without it, and
  **no consumer exists anywhere** — `ExperienceSection` is the live renderer and never read it, and
  `ExperienceEntry`, the one component that would have, was imported by nothing.

  **⚠ THE RECORD-AND-THE-WORK GAP, IN THE LIST THAT RANKS THE WORK.** Nothing here is wrong about the
  code. The open list simply went on carrying an item its own schema had closed, and it was ranked
  first for content on the strength of that. **A carried item is a claim about the present**, and this
  one aged into being false the moment the field was dropped.

  If role descriptions are ever wanted they are **a design change to the experience row** — where
  bullets sit in a row that is currently one line per role — rather than five blanks to fill. The
  reasoning is kept beside the schema where the deletion happened.
- **⚠ A PLACEHOLDER REACHED THE LIVE SITE, AND THE GATE BUILT TO STOP IT WAS CORRECT THE WHOLE TIME.**
  `www.akshitas.com/blog/you-find-out-what-motion-is-for-by-removing-it` served, twice in its HTML,
  a sentence reading **HER EXAMPLE GOES HERE. THIS SENTENCE MUST NOT SHIP.** It was found by reading
  the content, not by any instrument.

  **A PLACEHOLDER HAS TWO HALVES AND ONLY ONE WAS LOAD-BEARING.** `DRAFT_MARKER` is the machine's
  half; the shouted English is the author's. A backspace at a paragraph's start **merged it into the
  paragraph above** — ordinary `contentEditable` behaviour — and three characters landed on the
  opening sentinel. **Both `@@` sentinels died in one keystroke and every word of the shout
  survived.** `publishBlockers` found no marker, refused nothing, and was right by its own rule.

  **⚠ THE PREMISE WAS WRITTEN DOWN YEARS BEFORE THE FAILURE, IN THE GATE'S OWN SUITE.**
  `blog-registry` section M says *"nothing here reads English, so a marker that looks like prose is
  indistinguishable from prose"*, and concludes **"the markers are therefore loud."** Loudness
  protects a human reader and does nothing for a gate — it made the sentinel **a single point of
  failure that ordinary editing destroys.** The conclusion did not follow from the premise, and the
  premise was correct.

  **THE REPAIR IS THAT THE GATE READS THE ENGLISH TOO** — `hasPlaceholder` matches either half, so
  damaging one no longer disarms both. **AND THE CORPUS IS NOW A SUBJECT**: `M5` walks
  `content/blog` and fails if any **published** post carries a placeholder by either half. Every
  fixture row passed while the real document was live, because **the validator only runs at publish
  and a document already on main is never re-asked.** `M5` was proven by running it against the
  exact shipped document — red — rather than asserted to have caught it.

  **⚠ AND THE EDITOR CAN STILL FUSE TWO PARAGRAPHS, WHICH IS RECORDED RATHER THAN FIXED.** The
  keystroke that destroyed the sentinel is legitimate editing behaviour and the canvas has no reason
  to refuse it. **What changed is that the damage is no longer silent.** If a second fusion defect
  appears the canvas's own handling is the subject; one instance is not evidence the editor is wrong.

  **⚠ AND THE SAME RULE HELD IN ONE COLLECTION AND NOWHERE ELSE — THE CASE-STUDY SEAM, NOW CLOSED.**
  `validate-draft-sections.ts` knew nothing about placeholders, at publish or anywhere, while the
  blog's rule had existed for arcs. **The collection with no gate was the more exposed one:** the
  projects schema declares **no `status` field**, so a case study is public the moment it is on main
  and there is no draft state to be permissive about. `content/projects/` measured clean by both
  halves, so this was a seam rather than an incident.

  **THE CHECK READS THE RAW DOCUMENT AND RUNS BEFORE THE SECTIONS GUARD**, because a placeholder sits
  in `summary` or `facts` as easily as in a block, and that guard exempts any project with no
  `sections` array. `ralph/tests/draft-placeholder.mjs` is named for the RULE rather than a
  collection, since the defect was a rule holding in one place and not the other — which is invisible
  from inside either validator.

  **⚠ AND THE THIRD ASKING CLOSED THE QUESTION BY REFUSING TO ANSWER IT PER COLLECTION.** Asked
  whether `experience/` and `site-settings.yaml` wanted the rule, the measurement was that **seven of
  fifteen content files were validated by NOTHING at publish** — and the two named were two of the
  seven. **`skills.yaml` sat in the identical position and nobody thought to ask.** The publish loop
  now checks *any other* yaml under `content`, and the corpus row walks all of it.

  **⚠ AND THE SENTENCE ABOVE ORIGINALLY SPELLED THAT AS A GLOB, WHICH BROKE `css-comment-trap` AND
  BLOCKED ITS OWN PUSH.** A double-star glob contains a slash-star, `stripComments` read it as an
  opener, nothing closed it, and **every line after it in this file stopped counting as code** —
  including the hairline convention four hundred lines below, whose utility then compiled purely
  because prose named it. **The fourth instance of explaining-it-requires-writing-it, arriving in a
  GLOB rather than in a delimiter**, and the same shape as `keystatic.config.ts`'s `path:` value.
  Describe the pattern in words here; never write the glob.

  **THE TWO NAMED FILES DESERVED OPPOSITE ANSWERS, WHICH IS WHY THE DERIVED SUBJECT IS THE RIGHT ONE.**
  `site-settings.yaml` carries the longest prose on the site outside blog and projects — `aboutCopy`
  at 352 characters, `aboutNote`, four hero tab lines, each edited through a /studio panel and public
  the moment it is on main. Experience is five short structured scalars with **no prose field at all**,
  its one prose field having been deliberately deleted. **It is covered because the subject is derived,
  not because it earned a row.**

  **⚠ AND BLOG IS THE ONE EXCLUSION, ASSERTED RATHER THAN CLAIMED.** A marker is CORRECT in a blog
  draft, so blog needs the status-aware check that `blog-registry` M5 already is. That exclusion is
  only safe while blog is the only collection with a status field, so `D2` reads that from the schema
  and **fails if a second collection ever gains one** — where a prose exclusion would simply have gone
  stale.

  **⚠ AND THE OBVIOUS EXTRACTION WAS TRIED AND REVERTED, WITH THE FILE'S OWN COMMENT ALREADY SAYING
  WHY.** A second consumer is this repo's threshold for lifting something to a leaf. Doing it would
  cost `validate-blog-post.ts` the property its header names — **dependency-free beyond js-yaml and
  type-only imports, which is what lets a ralph suite EXECUTE it.** So the import runs from the file
  that can afford it to the file that cannot. **The comment forbidding it was already there and the
  suite failed within a minute of ignoring it.**

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

## Portable conventions

`docs/PORTABLE.md` holds the rules and limits from this project that are **not about this project**.
Each entry is tested against whether it survives without its example. It is
the extraction of what the arc below cost, and it is deliberately separate because the entries here
are entangled with `.wf-thumb`, `pearl` against `glass` and `D12e`, and the ones there are not.

**A limit is not a rule waiting to be implemented.** Part two names five things no instrument can
see, and writing them down is the whole remedy. A reader who cannot tell a rule from a limit will
build a gate for the limit and then believe it.

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

- **⚠ `docs/colour-boundary.yaml` IS JOINED BY VALUE-AND-LOCATION, NEVER BY FILE.** #345 built it
  that way deliberately, and **the first probe to reach for it reached for the file** —
  `boundary.includes(rel)` credited **19 migration sites** to rows that rule on entirely different
  colours in the same files. `process-diagram-fills` is three tan hex fills, not ProcessSection's
  seven ladder sites. **The corrected count was ZERO, not nineteen-minus-something**: a file-level
  join against a colour-level record over-attributes totally, every time. The wrong-unit rule, in a
  probe written one turn after citing it.

- **⚠ A RUNG WITH TWO ROLES CANNOT BE MIGRATED BY A RUNG-TO-ROLE MAP.** `cream-50` is both
  `surface` and `on-accent`; the map has one answer per rung and the site needs two, so #383's sweep
  sent all four accent-badge labels to the wrong role — **the exact bug `on-accent` had been created
  one PR earlier to prevent, described in that PR's own comment.** Any mechanical substitution over
  a many-to-one mapping needs a human-shaped review of the ambiguous rungs, and `role-layer` E is
  the gate.

  **⚠ AND THE GUARD THAT SHOULD HAVE CAUGHT IT HAD A NARROWER VOCABULARY THAN ITS CONCEPT.** It
  skipped elements carrying both a ground and a foreground — but recognised grounds only from the
  cream/ink ladder, and an accent ground is in neither. **The concept was "this element brings its
  own ground"; the implementation was "this element uses a ladder background".** When a guard is
  written to express an idea, check that its vocabulary covers the idea and not just the common case.

- **⚠ A FORECAST IS A HYPOTHESIS THAT ARRIVES PRE-CONFIRMED.** A prediction that a number will move
  makes any movement look like the predicted one. The collision census was forecast to shift as role
  names replaced raw ones; it shifted 6 to 5 — **and that was two distinct collisions collapsing into
  one name because both had been given the wrong role**, not the reclassification predicted.
  Repairing the sites restored it.

  **⚠ THE SUITE ALREADY CARRIED THE RIGHT WARNING AND IT NEARLY FAILED ANYWAY**, which is the whole
  point: `cascade-public` says the number moving cannot tell you WHICH of five things happened, and
  **a forecast supplies the which for free.** This is a defect in the READER rather than in the
  instrument, so no assertion can catch it.

  **The repair: when a predicted number moves, establish WHY before accepting it, and treat
  agreement with the forecast as NO EVIDENCE AT ALL.**

- **⚠ A POPULATION CAN BE COMPLETE, MEASURED, AND STILL BE THE WRONG NOUN.** Every earlier miscount
  in this arc was a subject too SMALL — a class-only sweep dropping 54 of 198, a file-level join
  over-attributing 19. This one was **correctly sized and wrongly named**: "54 sites to migrate",
  when 34 were `color-mix` hairlines, illustration constants and a ternary belonging to another PR.
  **20 were migratable and the count was never wrong.**

  **⚠ AND THE TELL WAS ONLY AVAILABLE BY LOOKING AT WHAT EACH SITE DREW** — the same question that
  separated the process diagram's accent OUTLINE from its depicted FILLS. A denominator check
  confirms you counted everything; **it cannot tell you that the thing you counted is the thing you
  named.**

- **⚠ THE STUDIO FREEZE PROTECTS VALUES, NOT NAMES — A LIMIT ON #314, NOT AN INCIDENT.** The
  studio's sites are frozen against a theme moving their colours. They are **not** frozen against
  the public site changing what a utility MEANS to the scanner. Removing the last public use of a
  colour utility turned ten comments into `css-comment-trap` failures, **five of them inside
  `/studio`**, because the utility namespace is shared and **neither side owns it**.

  **NOTHING WAS MISCOLOURED, AND THAT IS THE POINT.** The coupling is real, invisible from either
  side, and the next public migration will meet it again. Expect it; it is not a defect in the
  freeze.

- **⚠ A COMPONENT MAY CHOOSE WHAT KIND OF THING IT IS; IT MAY NOT CHOOSE WHERE IT LIVES.** That is
  the sharp form of the C-safety rule. `SectionHeading`'s `tone` picks accent-toned or ink-toned —
  a KIND, both branches follow the theme, six call sites use it deliberately. `PullQuote`'s `dark`
  picks by GROUND, which is the violation. **They look identical in source and are opposites**: I
  cited `tone` as the precedent for the violation and it is the precedent for the exception.

- **⚠ A ROLE THAT RESOLVES THE PIGMENT LETS EVERY CONSUMER KEEP ITS OWN ALPHA — AND IT IS WHY ONE
  ROLE SUFFICED WHERE SEVEN WOULD HAVE BEEN NEEDED.** `etch` resolves to an INK, not to a finished
  colour, so `border-etch/8`, `bg-etch/15` and `bg-etch/5` are all one role at three weights. A role
  resolving a finished value would have needed a token per weight — seven are in use.

  **THIS IS A GENERAL PROPERTY OF ALPHA-BASED ROLES AND `etch` IS THE VOCABULARY'S ONLY INSTANCE.**
  It works because the weights are ground-independent: measured, each lands within 6% of its light
  separation on a dark ground, so a consumer's choice survives the ground change untouched. **Check
  that before reaching for the pattern again** — a pigment role whose alphas did NOT survive would
  push the problem into every call site instead of solving it.

- **⚠ THE DISCRIMINATOR FOR A CONSTANT: IS IT DRAWN IN THE SITE'S VOICE, OR IN THE DEPICTED THING'S
  OWN COLOURS?** A browser mock uses browser-chrome grey; a blog diagram uses the site's ink, cream
  and hairlines. **That is the rule.**

  **⚠ "WHAT DOES IT DRAW" GAVE THE WRONG ANSWER AND IS THE WEAKER FORM.** The blog diagrams DEPICT
  four squads' form UIs — by that test they are constants — yet they were deliberately built to
  theme, with `blog-diagrams` A2 asserting no colour literal *so that all of it themes*. **Two
  depicting things, opposite rulings, both correct.**

  The finer test **supersedes artwork-by-file's phrasing without moving any of its outcomes** —
  checked: `ProjectCardSvgs` is 77 hex literals against 11 token refs (the depicted products' own
  colours, excluded whole), and `ProcessSection` splits 28 token refs in the accent OUTLINE against
  3 hex fills in the depicted wireframe. **It explains the split WITHIN one file, which
  artwork-by-file could not.**

  A component naming a rung because the thing it depicts IS that colour is a constant; one naming a
  rung because that is where it happens to sit is a migration. **In source they are identical** —
  which is why a mechanical sweep cannot tell them apart and a reader can.

- **⚠ A RUNG-TO-ROLE MAP IS A FUNCTION, AND A MULTI-ROLE RUNG IS NOT.** `cream-50` is both `surface`
  and `on-accent`, so the map is **the wrong SHAPE and no correction to its entries fixes that.**
  Identify which rungs are multi-role BEFORE applying any substitution, and treat those sites as
  **manual by construction** rather than as a map with exceptions — an exception list on a function
  that cannot represent the domain is the fixed-list shape one more time.

- **⚠ RUN `css-comment-trap` WHENEVER A TOKEN IS ADDED, NOT ONLY WHEN A COMMENT IS WRITTEN.** A new
  role name plus an existing utility prefix can make **old prose compile**: a comment describing a
  ring drawing the accent over the accent had been inert English for months, and declaring
  `--color-on-accent` turned it into a real utility that shipped in the public bundle. **The comment
  did not change; the vocabulary grew under it.** Mirror of the PR-number-as-hex trap.

  **⚠ AND THE MIRROR FIRES ON REMOVAL, WHICH COST TWO ROUNDS IN ONE SESSION.** The rule above says
  run it when a token is ADDED. **Deleting the last real use of a utility is the same event from the
  other side**: every comment naming it becomes the only thing generating it, so the class ships in
  the public bundle purely because prose mentions it. Removing `resize-y` from one textarea and the
  full-height max-height utility from one modal each failed `A5` on the very comment explaining the
  removal. **Run it after a DELETION too, and describe the retired utility rather than spelling it.**

  **⚠ AND THE FIRST NOTE RECORDING THIS SPELLED THE PHRASE OUT AND BECAME THE DEFECT IT DESCRIBED**
  — third instance of *"explaining it requires writing it"*, after the two comment delimiters.
  **Describe such a collision; never transcribe it.**

- **⚠ A SORT SURFACES WHAT THE DATA CONTAINS, NOT WHAT YOU MEANT — AND IT IS CORRECT IN SOURCE AND
  WRONG ON SCREEN.** `/palettes` shows four summary figures under its component stage. They were
  `[...rows].sort((a,b) => a.got - b.got).slice(0,4)`, which reads as "the four tightest" and
  returned **1.05, 1.10, 1.13 and 1.19 — all four `ground step` rows**, rendered large and
  unlabelled directly beneath a headline reading *tightest text pair 4.56*.

  Those are LADDER floors, saying two adjacent grounds must be separable. As big numbers under a
  contrast headline they read as legibility figures scraping a floor, which is the exact misreading
  the verdict bar above them exists to prevent — **the page's own rule, broken by the page, in the
  element that states it.**

  **⚠ NOTHING IN THE SOURCE LOOKS WRONG, WHICH IS THE WHOLE ENTRY.** A sort is not a filter and does
  not claim to be; the defect is that the population contained a KIND the label did not cover. The
  repair is to filter by the same predicate the headline uses — `min >= TEXT_FLOOR`, one constant,
  one meaning — rather than to sort more carefully.

  **THE GENERAL FORM: WHEN A SORT FEEDS A LABEL, THE LABEL IS A CLAIM ABOUT THE POPULATION AND THE
  SORT DOES NOT ENFORCE IT.** Same family as the wrong-noun rule, arriving through an ordering
  rather than a count — and only the render can catch it, because what a sort returns is a property
  of the data rather than of the code.

- **⚠ `RevealSection` NEVER RUNS IN A GRID CELL, AND A START STATE IS A CORRECT VALUE.** Three of
  the nine kit parts on `/palettes` painted **empty cells**. `Stepper`, `GlanceGrid` and `IssueList`
  stagger their items behind `.reveal-card`, which is `opacity: 0` until `.is-revealed` arrives, and
  nothing adds that class outside a case-study section.

  **EVERY INSTRUMENT WAS GREEN.** Every component rendered, every token resolved, `tsc` and `eslint`
  were clean, and a third of the kit was blank. There is no wrong value to find — `opacity: 0` is
  exactly right given a reveal that comes.

  **THE STUDIO CANVAS FOUND THIS FIRST AND ITS FIX WAS ALREADY IN THE FILE.** `.canvas-static
  .reveal-card` forces the end state, written for the inline canvas, later used by `/dev/parity`,
  and now by the kit — **third consumer, and the name is under-descriptive rather than wrong.** It
  means *this container does not scroll-reveal, so show the end state*; it does not mean canvas.
  Renaming is a three-consumer sweep and its own decision.

  **THE TRIGGER TO REMEMBER: mounting a case-study block component anywhere that is not a case-study
  section.** The kit, a preview, a specimen page, a future style guide — all four have this.

- **⚠ THE UNBALANCED-MATCHER FAMILY GAINS AN EIGHTH, AND IT IS A NEW VARIANT: THE EXTRACTOR'S END
  ANCHOR MATCHED SOMEWHERE ELSE, SO THE ASSERTION'S WINDOW AND THE MUTATION'S TARGET WERE DISJOINT.**
  A row asserting that the gallery hero's hover-straighten lives ONLY inside a
  `prefers-reduced-motion: no-preference` block sliced the block from its at-rule **to the end of the
  file**, then asked whether the remainder contained the rule. Its companion guard checked the slice
  "closed" by testing `endsWith("}")` — **which the whole stylesheet satisfies.**

  **SO THE MUTATION THAT MOVES THE RULE OUT OF THE GATE LANDED INSIDE THE TAIL THE ROW HAD ALREADY
  DELETED, AND THE ROW REPORTED PASS ON THE EDIT IT EXISTS TO CATCH.** Repaired by balancing braces
  and by replacing the `endsWith` with a SIZE CEILING — a bounded block is a few hundred bytes and
  the file's tail is hundreds of thousands, so magnitude is what discriminates.

  **⚠ THIS IS NOT PRESENCE-VERSUS-REACHABILITY AND MUST NOT BE FILED THERE.** That family is about a
  string being in a file while nothing can render it. Here the extractor's END was unanchored, so the
  region examined and the region changed never overlapped — the same defect as a lazy class walking
  past a construct's close, arriving in a SLICE rather than in a regex. **An extractor needs its end
  anchored as hard as its start, and a guard on that extractor must fail when the end runs long.**

- **⚠ THE UNBALANCED-MATCHER FAMILY REACHED SEVEN, AND THE LAST TWO ARRIVED FROM PLACES NOBODY
  AUDITS.** The rule is old — a matcher that must know where a construct ENDS cannot be written with
  a pattern that does not count. The new members are about WHERE they were.

  **THE SIXTH WAS INSIDE THE ROW REPAIRING A DIFFERENT ONE.** `palette-preview` F3 was retargeted to
  assert that a cleanup guards on `livePreviewTheme`'s result, written as
  `livePreviewTheme\s*\([^)]*\)` — and the argument is `Date.now()`, so `[^)]*` cannot cross the
  inner close. **It failed on correct code**, in an assertion being fixed for an unrelated reason.
  The repair is to EXTRACT the condition and then search it, which keeps the row's subject.

  **⚠ THE SEVENTH IS IN `colourPattern` ITSELF, WHICH MEANS IT AFFECTS EVERY CENSUS THIS REPO
  RUNS.** `\boklch\([^)]*\)` starts at a literal `oklch(` **rendered as page text** and runs across
  newlines and JSX elements to whatever close comes first — a ninety-character match spanning three
  expressions. Both playground pages display OKLCH strings as content, so both produce these.

  **IT IS NOT FIXED AND THE REASON IS STATED: A PATTERN THAT COUNTED WOULD STILL BE RIGHT TO MATCH.**
  The page really does display an OKLCH string; the honest claim is that it is not a colour anything
  paints, which is a `not-a-colour` row rather than a parser change. **Splitting the string to dodge
  the matcher was considered and refused** — it would make the gate green while changing nothing
  about what ships, which is how an exclusion becomes a leak.

- **⚠ EXPLAINING-IT-REQUIRES-WRITING-IT REACHED SIX, AND FIVE AND SIX WERE ONE UNIT APART.** The
  first four were comment delimiters and a `path:` glob. **The fifth and sixth are OKLCH literals in
  comments about not typing OKLCH literals** — one in `PaletteConsole` explaining that the hero
  formula must be parsed from the live token rather than typed, one in `OklchPrimer` explaining that
  an off-palette value cannot reach the preview cookie.

  **⚠ THE SIXTH WAS COMMITTED ONE UNIT AFTER THE FIFTH WAS RECORDED, BY THE SAME HAND.** That is the
  argument for the mechanism over the rule, made against a rule this file already states in capitals.
  **`.tsx` COMMENTS ARE NOT STRIPPED BY THE CENSUS**, so prose alone can take a component's colour
  count from zero to three. Describe the form; never transcribe it.

- **⚠ A FIXED PANEL'S OVERLAP IS A BAND, NOT A CONSTANT, WHICH IS WHY IT SURVIVES A LOOK.** The
  playground switcher is 196px at the right edge and shows from 1200px up. It was written as "hidden
  where there is no room", as though room existed above that width. Measured against a 1300px
  container:

      1440   container  70 -> 1370   panel 1229 -> 1425   overlap 141px
      1600   container 150 -> 1450   panel 1404 -> 1600   overlap  46px
      1920   container 310 -> 1610   panel 1724 -> 1920   overlap   0

  **ANYONE CHECKING ON A WIDE DISPLAY SEES A PANEL SITTING POLITELY IN THE MARGIN.** What it hid at
  1440 was the lab's contrast readout — the number and the whole of its *not WCAG* caveat, the one
  thing that element exists to say — plus 59px of the sample heading the section demonstrates.

  **⚠ THE FIRST FIX WAS TO MOVE THE ONE COVERED SPAN AND IT WAS THE WRONG SHAPE.** It made the caveat
  readable and left the heading, the stage and anything a future section puts near a right edge still
  underneath. **A collision that is a property of the geometry needs a geometry fix**: both pages cap
  their measure at `min(1300px, 100vw - 460px)` above 1200px, verified by resolved value at 965px
  rather than by the utility being present in the bundle.

- **⚠ THE TRIGGER FOR LISTING A ROUTE IS BEING PUBLIC, NOT BEING IN THE NAV.** That is the durable
  half and it is the correction, not the incident. `app/sitemap.ts` already carried a paragraph
  about the blog having gone missing **"until the nav link shipped"** — the header was right about
  what happened and **the rule it stated was too narrow**, because it tied listing to the nav.

  **`/palettes` was missing from that same file**, had been public and nav-linked for an entire arc,
  and was found only while adding `/oklch`. Third instance, against a header that records the decay
  twice.

  **⚠ AND `/oklch` IS THE CASE THAT PROVES THE NARROW RULE WRONG RATHER THAN MERELY MISSED.** It is
  public, prerendered and indexable, and it has **no nav entry by design** — the Playground link
  goes to `/palettes` and the primer is reached by cross-links. Under "list what the nav shows" it
  would be correctly omitted and wrongly invisible.

  **THE SHAPE: a route list is only ever read by somebody putting something into it**, so a route
  that ships without an edit to it stays invisible until the next route ships. Same cause as
  `paint-sites`'s `PAGES`, which had never visited either playground route — **two route lists, one
  omission, found in the same hour.** Any list of routes needs its membership rule stated as a
  PROPERTY OF THE ROUTE, or it decays to whatever the last author happened to be looking at.

  **⚠ AND WHEN THE LIST WAS ACTUALLY DERIVED, BOTH WERE WORSE THAN ANYONE THOUGHT.** The prerender
  manifest names every public page the build produced. Joined against it:

      21 public pages derived   ·   12 in the sitemap   ·   10 under the visual ratchet

  **Nine more sitemap omissions and two more unvisited blog posts**, none of which any earlier count
  had shown. `route-coverage` is the gate. The nine were `/palettes/<slug>` — **shareable by
  design**, because the console's `Link` button hands exactly those URLs to visitors, so a URL the
  product gives out was one the sitemap did not know about.

  **⚠ THE DERIVATION REPLACES ONE LIST AND NOT THE OTHER, AND THE ASYMMETRY IS THE USEFUL PART.**
  The sitemap's membership IS "is a public page", so it takes the derived set whole and needs no
  exclusions. `paint-sites` drives a browser across nine palettes at two viewports, where 21 pages
  would roughly double a run already long enough to be timed out once — so its subject is derived
  and its exclusions are DECLARED WITH REASONS, the shape `docs/colour-boundary.yaml` uses for
  colours.

  **⚠ AN EXCLUSION MUST BE A PROPERTY OR IT IS THE LIST RETURNING IN DISGUISE.** The one exclusion
  reads *"a route whose only difference from a page already visited is the palette it opens on"* —
  a tenth palette matches it automatically, and a genuinely new page under `/palettes/` would not.
  Naming the nine would have been the fixed-list shape reappearing **inside the gate written to
  remove it**, and `C3` asserts the property has members so the rule cannot pass by selecting
  nothing.

- **⚠ THE EIGHTH DEFECT IN `mutate.mjs`, AND IT CAME FROM SUPPRESSING THE TOOL'S OWN OUTPUT.** A
  mutation was applied with an EMPTY replacement to delete a line. `--revert-edit` locates what it
  applied by **searching for the replacement**, and the empty string matches at every character —
  a 15,788-character file reported **15,787 hits**. The revert refused, correctly and loudly, and
  the operator had piped the command to `/dev/null`.

  **⚠ THE TOOL WAS RIGHT AND UNHEARD, WHICH IS A DIFFERENT FAILURE FROM THE SEVEN BEFORE IT.** Those
  were the instrument lying. This one was the instrument telling the truth into a closed pipe —
  and this file's own rule already covers it: **capture the exit code, and read `git status` after
  every restore.** Neither was done.

  **TWO REPAIRS, AND BOTH MOVE THE FAILURE EARLIER.** `--edit` now REFUSES an empty replacement,
  because unrevertability is knowable at edit time and that is the posture of its other four
  refusals. And `--restore` now CLEARS THE EDIT MANIFEST, which it never did.

  **⚠ THE SECOND IS THE DANGEROUS ONE AND IT EXISTED SILENTLY THE WHOLE TIME.** A restore put the
  tree back and left records describing mutations that no longer existed. The next `--revert-edit`
  acts on them: at best it refuses and costs a round to a phantom, **at worst it finds the
  replacement string by coincidence in restored source and rewrites a line nobody mutated.** It
  also reddened `mutate-harness` C3 — the harness catching contamination produced by its own tool.

  **⚠ AND THE FIX FOR IT NEARLY SHIPPED A TEMPORAL DEAD ZONE ERROR THAT `node --check` PARSES
  CLEANLY.** `EDITS` was declared below the block that now uses it. That is the exact shape of the
  syntax error which shipped in this same file under 3100 green assertions — **arriving inside the
  repair for it** — and it was caught only by RUNNING the restore rather than checking it. A first
  run exited early on a missing snapshot without reaching the line, so proving it required
  constructing the state that reaches it.

- **⚠ A WRONG SUBJECT IN A REPORT IS WORSE THAN ONE IN AN ASSERTION, BECAUSE NOBODY RE-DERIVES A
  REPORT.** The kit census probe printed a row reading **`Density read as noise    8`** — as though
  the kit contained a part by that name. It does not. The probe read each cell's first `<b>`, which
  for `GlanceGrid` and `IssueList` is the part's own CONTENT rather than the footer label.

  **NO FIGURE MOVED.** The count and the movement key off cell INDEX, so `9 parts, all 9 move` was
  correct throughout. **That is exactly what makes it dangerous** — every number was right, so
  nothing looked wrong, and a reader of that output would have carried away a part name that does
  not exist.

  **⚠ AN ASSERTION THAT MISNAMES ITS SUBJECT USUALLY ALSO MISMEASURES IT AND GOES RED. A REPORT
  JUST PRINTS.** There is no failing state for a label, no gate over probe output, and the artefact
  outlives the session it was produced in. **The repair is the same discipline as stating the
  subject beside the number** — check that a label names what you think it names, before the output
  becomes the record.

- **⚠ A TRIGGER THAT RENEWS ITSELF ON EVERY MISS IS A TRIGGER THAT NEVER FIRES.** The nav comment
  said *"if a second playground piece ever ships, THAT is when an index earns its existence"*. The
  second piece shipped, and the index still lost — a section index with two cards is a container
  with two items and every visitor pays a click, where cross-links cost nothing to whoever wanted
  the first page.

  **THE TEMPTING EDIT WAS TO WRITE "three pieces" AND IT WAS REFUSED.** That is the same guess
  wearing a different digit, and a threshold rewritten each time it is reached can never be met.
  **The trigger is restated as a PROPERTY instead**: an index earns its existence when a piece
  CANNOT be reached from the others. Two pages about one subject, each linking the other, is not
  that — and the new form can actually be evaluated rather than deferred.

- **⚠ A NUMBER WITHOUT ITS SUBJECT IS AN INVITATION TO SUPPLY ONE.** "Near-black grounds differ
  between palettes by 25.1" was **correct and unattached**. A reader — the one who had written the
  surrounding rules — attached it to the `band-dark` token, measured 26.3, and **spent a turn chasing
  a discrepancy that did not exist.** The 25.1 was always the two favicon candidate grounds.

  **⚠ THIS IS THE COMPLEMENT OF "a ratio belongs to the ground it was taken on", WHICH THIS FILE
  STATES FIVE TIMES.** That rule is about **reusing** a number on the wrong surface. This one is
  about a number that **never named a surface at all**, so there was nothing to check it against and
  no way for the misreading to fail. **Naming the subject is what makes an observation citable
  rather than merely true** — an unattached figure survives every review, because every review has to
  guess the same way.

  **⚠ AND IT IS NOW COUNTABLE, WHICH MAKES IT THE SIGNATURE FAILURE RATHER THAN AN ANECDOTE.** Seven
  instances share one shape — **a number that described a different subject than the one claimed**:
  the 25.1 above; the mislabelled theme capture; the ratio between two colours that never meet; and
  **four probes in a single session** — an `opacity` filter that missed alpha carried in the COLOUR,
  a `:scope > img` widened to `img` so one image excluded the whole page, a `.tsx`-only walk, and an
  `indexOf` that found `[data-ground="dark"]` **inside a comment written about it one turn earlier**.
  Each produced a confident, checkable-looking figure. **Three of the four read as PASSES.**

  **THE REPAIR IS THE SAME EVERY TIME AND IT IS CHEAP: STATE THE SUBJECT BESIDE THE NUMBER.** Not
  "1.24 fails" but "1.24, on this element, on this ground". **Every one of the seven would have been
  visible at the moment it was written**, which is why this is a writing discipline rather than a
  measurement problem.

- **⚠ WHAT CANNOT SURVIVE A GROUND CHANGE IS NOT A MATERIAL — IT IS A FINISHED COLOUR THAT BAKES THE
  DIRECTION IN.** Pale glass shows its thickness as **shadow**; dark glass shows it as **transmitted
  light**. Both are glass. **The CSS forced a choice the physics does not**, by storing the tint as a
  pale finished value instead of as an ink the ground could invert.

  **PREDICTED BEFORE THE TEST AND CONFIRMED ON ALL SIX PALETTES.** Re-expressed as ink plus alpha at
  2.5–3.4%, the tint reproduces today's light appearance exactly and **flips direction on dark
  without a second value** — darkens on light, lightens on dark, six for six. So the vessel's
  "redraw" is **zero new tokens**, the fourth time resolving the PIGMENT rather than the finished
  value has collapsed a problem to nothing.

  **One honest asymmetry: the dark magnitudes land ~11% below the light ones** (7.0–14.0 against
  6.2–12.4), wider than `etch`'s 6% bar. Not enough to need a second token, and it is stated rather
  than rounded away.

  **A confirmed prediction is worth more than the same outcome discovered** — it means the model is
  right, not just the answer.

  **⚠ RULED, 2026-08-10: THE EVEN RIM IS DARK GLASS'S HONEST FORM — DERIVED, NOT CHOSEN.** Cream's
  grounding is −27.51 of drop beneath the element; on the dark band, darkening is capped at ~1.61 for
  drops and insets alike, so pure black at full alpha reaches 6% of the target. **The thing
  unavailable is what sits BENEATH the element, and nothing inside it supplies that** — a new edge
  design would still be a mark, subject to the same arithmetic. **The nav and the vessel reached this
  independently: two components, one arithmetic**, which is what upgrades it from a judgement about
  two renders to a property of the band.

- **⚠ THE INERT TEST IS PER CONSUMER, NOT PER TOKEN — a token can be load-bearing at one alpha and
  dead at another.** `bounce` measured 33.9 as a streak on the glass pane and 2.0 as a radial on
  `cream-50`, in the same component. Applied per token it would have been kept wholesale or deleted
  wholesale, and both would have been wrong about most of its consumers.

  **⚠ AND A THIRD VERDICT WAS NEEDED: GROUND-CONTINGENT.** The rule deletes what drives nothing
  ANYWHERE. Three `bounce` consumers drive nothing on light — 1.2, 4.5, 5.5 against the 20.8 of the
  faintest shipped mark — **and measure 76.0, 98.8 and 361.1 on dark.** They are not inert; deleting
  them would strip the mechanic from the ground it works best on. **Measure both grounds before
  calling anything dead**, or the rule removes the thing it exists to protect.

- **⚠ THE ANSWER WAS CHEAP AND THE SUBJECT WAS EXPENSIVE — TRUE OF TWO COMPONENTS NOW, AND IT
  PREDICTS THE THIRD.** The CTA's fix is one value. Reaching it cost a token split that was refused, a
  remap that broke a second consumer, a revert, a coupling visible only in a render, and a
  verification that measured the wrong pair. The vessel's fix was one raw rung; reaching it cost two
  arcs and five invalidated measurements.

  **⚠ THE COMMON CAUSE IS ONE QUESTION ANSWERED BY THE WRONG AUTHORITY: "WHAT IS THIS DRAWN ON."** It
  was answered by the cascade, by an anatomy table, by a DOM walk, and by a sibling no walk can see.
  **THE PAINT IS THE ONLY AUTHORITY AND IT WAS CONSULTED LAST BOTH TIMES.**

  The practical form: when a colour question turns on a ground, **sample the pixel before reasoning
  about the ground** — not after the reasoning fails. Every cheaper method is a model of the paint,
  and this project has now found two components where the models disagree with it.

- **⚠ A RULE WHOSE REFERENCE IS UNNAMED WILL BE "CORRECTED" BY THE NEXT PERSON TO CHECK IT.** The
  vessel's tint rule was recorded as *"every palette declares it identically: lightness step −2, hue
  delta 0, chroma step 0.009–0.013"* — **correct, exact, and referenced to nothing.** It is `pearl`
  against `glass`, a relation INSIDE the vessel.

  **⚠ CHECKED AGAINST THE THREE REFERENCES A READER REACHES FOR FIRST, ALL THREE DISAGREE
  CONVINCINGLY** — against `cream-50` the lightness steps spread −2.0 to −6.5 and the chroma steps
  −0.006 to 0.018 **with sign changes on fern**; against `canvas`, 0.0 to 4.5 and −0.010 to 0.009;
  against `band-dark`, 74.5 to 79.5 and −0.022 to 0.003. **Against `glass` it is dL 2.00, dH 0.00 and
  dC −0.009 to −0.013 on all six palettes, exact on every component.**

  **⚠ SO THIS IS THE MISSING-SUBJECT DEFECT ARRIVING FROM THE READER'S SIDE.** Every earlier instance
  was a number that described the wrong thing. **This one was RIGHT, and three plausible refutations
  of it were available to anyone who checked.** A wrong reference does not produce nonsense — it
  produces a confident correction, which is worse, because a correction gets written down.

  **THE REPAIR IS THE SAME AS EVER AND IT IS STILL CHEAP: NAME THE REFERENCE BESIDE THE RULE.**
  `theme` section V now asserts the relation, so the reference is mechanical rather than prose.

  **⚠ AND THE RULE NAMED THE WRONG FORM, FOUND A WEEK LATER BY THE SAME ROUTE.** It is written as the
  vessel's rule and cited as one. `ReadingVessel.tsx` renders **two forms** across the 1200px boundary
  — the fixed aside above it and a docked bar at or below — and derived from consumers, `pearl` is
  used by `.blog-bead` **alone** while `glass` is used by `.blog-bead` and `.blog-liquid`. **The
  relation lives in the docked bar's bead.** The aside owns `smoke-1` to `4`, `glass`, `ink` and
  `bounce`. The rule holds and its subject was wrong.

  **⚠ AND THE CHROMA TERM IS WHAT BLOCKS AN ACHROMATIC PALETTE.** At chroma 0 the step goes negative
  and clamps, collapsing the four vessel tones onto **4.0 lightness units alone** where every shipped
  palette carries the separation in lightness and chroma together. `V4` fails by name rather than
  letting it render flat and be judged by eye.

- **⚠ THREE CEILINGS WERE DERIVED CORRECTLY, CITED THREE TIMES AS CONSTRAINTS, AND BOUND NOTHING.**
  Ink & Flare's `onA` at 0.045, Nocturne's `aTxt` at 0.127 and Basalt's `onA` at 0.046 are exact — and
  they are ceilings for **preview rungs the 35-token vocabulary does not carry.** The preview's `onA`
  sits at L 17% and its `aTxt` at L 78%; measured against a shipped palette's accent-hue family
  (`on-dark-quote` 74.5, `accent-on-dark` 70.0, `glow-paper` 63.0, `accent-500` 52.0, `accent-600`
  45.0), **nothing lands within ±2 of either.**

  **⚠ AND THE ENUMERATION THAT PRODUCED THEM IS STILL CITED AS WHY THE THREE PALETTES ARE "MEASURED
  AND SPECIFIED".** That phrase is weaker than it reads. What was measured was a preview's ladder;
  what a palette needs is a different vocabulary, and the hue-aware cap did its real work on
  `accent-500` and `accent-600` — rungs that exist. **A ceiling for a token no palette declares is the
  wrong-subject defect in a figure both parties had stopped checking.**

- **⚠ AN IDENTITY CLAIM ATTACHED TO THE WRONG PROPERTY, BY BOTH OF US, AND THEN HANDED BACK AS A
  CONSTRAINT.** Nocturne's *"saturated all the way down"* was read as its **14 degree ground-accent
  gap** and used to argue a redraw must preserve that gap. It is a **CHROMA** claim — the ground
  carries c0.024, second-highest of the six candidates, so chroma survives to the darkest rung. The
  gap is a separate property.

  **The recommendation preserved the real property anyway**, which is luck rather than method. **A
  prose identity turned into a numeric constraint is where a design gets quietly redefined** — ask
  which property the sentence actually names before treating it as a bound.

- **⚠ A DRAWING ROTATED TO SATISFY A GATE IS A PALETTE NOBODY DESIGNED.** All three candidate dark
  palettes collide — Nocturne on its ground at dE 6.0, Ink & Flare on its accent at 10 degrees from
  cream, Basalt on its accent at 6 degrees from fern — because all three were drawn before most of the
  shipped palette existed. **The fix is not to move them.** The four drawn numbers are the design, and
  moving them to satisfy a gate inverts which of the two is authoritative.

  **⚠ AND THE CIRCLE IS NOT FULL, WHICH WAS FORECAST AND IS FALSE.** Measured at the 24 degree floor
  there is room for **six more accents** in three open arcs — **h66–h110, h189–h248, h296–h306** —
  twelve palettes before the accent constraint shuts. The forecast was that the accent circle had
  reached the ground circle's state; agreeing with it would have been the pre-confirmed hypothesis.
  **Nothing is lost by deferring while six arcs are open, and a palette drawn INTO an open arc will be
  better than one rotated OUT of a collision.** The windows are recorded so the next one starts from
  an arc rather than from a drawing that has to be checked against one.

- **⚠ TWELVE UNFALSIFIABLE ROWS NOW, EVERY ONE FOUND BY MUTATION AND NONE BY READING — AND THE
  COUNT IS THE ARGUMENT.** The newest two came from one suite written by an author who had just
  re-read this entry. One was `A7`'s shape a fourth time — **the leaf proven and the call
  unasserted**, where swapping a call site's argument to the exact reversal the rows existed to
  prevent left the suite fully green. The other is the extractor variant recorded above.

  **THE TALLY MATTERS BECAUSE THE INSTINCT IT REFUTES IS "I WOULD SEE THAT ONE".** Twelve times the
  reading passed and the mutation did not. **Ask what would have to change for this row to go red,
  and then MAKE that change** — the asking is not the test, and this file has now been wrong about
  that twelve times.

- **⚠ AN ASSERTION THAT CANNOT FAIL FOR THE REASON IT NAMES — FOUR IN ONE UNIT, ONE SHAPE.** Each
  passed, each was checkable-looking, and none tested the property in its own title.

  **THE CLEAREST IS THE ARCHITECTURE'S OWN CONSEQUENCE.** A row asserted the inspector's mark and
  the publish wall *agree* on their copy. They read ONE exported function, so **no mutation to a
  message can make them disagree** — the title claimed agreement between two things, and there is
  only one thing. True by construction, and proving nothing. Retitled to what it proves,
  **derivation**, and mutation-tested with the one mutation that can kill it: a second spelling
  being BORN, an inline message reinstated ahead of the shared call.

  **THE OTHER THREE ARE THE SAME FAMILY IN DIFFERENT COSTUMES.** A whole-file check for an ARIA role
  matched a **different field's** — the wrong-subject shape inside an assertion. The comment
  explaining why that role is not used **contained the role name**, so it failed the check it
  existed to explain — explaining-it-requires-writing-it, arriving on an ARIA role rather than a
  comment delimiter, its fourth instance. And a presence rule — *absent is skipped rather than
  guessed* — was applied to **one field of four** by its own author, in the same function, in the
  same hour.

  **⚠ AND ONE OF THEM FIRST REPORTED SURVIVED WHILE BEING INVALID.** The kill-mutation was placed
  AFTER the check it was meant to replace, so it never ran. **A mutation must be shown to reach its
  subject**, which this repo already says of `mutate.mjs` and which a hand-placed edit needs just as
  much.

  **THE TEST TO APPLY: ask what would have to change for this row to go red, and name it.** If the
  answer is "nothing a reasonable edit could do", the row is documentation wearing an assertion's
  clothes. All four were found by running the suite against its own subject rather than by reading
  it.

- **⚠ `paint-sites` ASKS WHETHER A FOREGROUND MOVES, NOT WHETHER IT HOLDS ITS RELATION — AND IT RAN
  8/8 GREEN OVER A DEFECT ON EVERY PAGE IT VISITS.** The footer's `Ciao` backdrop measured **1.37
  against its panel on light and 11.67 on dark**, sitting behind a name at 15.24. A decorative word
  that was a whisper became a shout, and the identity in front of it was unreadable.

  **THE PREDICATE NEEDS THE GROUND TO MOVE AND THE FOREGROUND TO HOLD STILL.** `cream-300` is
  declared per palette, so the foreground **did** move — different hue on every one — and the row
  never entered the flagged set. **The relation inverted while the value moved**, which is a state
  that predicate cannot express.

  **⚠ AND THE PROOF IS NOT AN ARGUMENT: the suite was run 8/8 with this exact defect live**, on the
  footer, which sits in the portfolio layout and therefore on all ten pages it visits.

  **THIS IS THE CROSS-GROUND RULE BELOW ARRIVING IN AN INSTRUMENT RATHER THAN IN A REPORT.** That
  rule says to state the absolute delta AND the ratio against the local backdrop; `paint-sites`
  states neither — it states a boolean about movement. **A decorative element's job is a RATIO, and
  nothing here measures a ratio a consumer must stay UNDER.** Every floor in this repo is a minimum.

  **RECORDED AS A LIMIT RATHER THAN A TODO.** A ceiling gate would need each decorative consumer to
  declare the band it must stay in, which is a per-consumer registry for a population nobody has
  counted. The trigger for building one is a SECOND instance — if another whisper inverts, the
  population is real and the registry earns itself.

- **⚠ A FIXED VALUE CANNOT HOLD A RELATION, AND THE TOKEN IS USUALLY NOT THE THING TO FIX.** The
  `Ciao` backdrop asked for `cream-300` when it wanted *one step off the panel it sits on*.
  `globals.css` already carried that sentence about that token, and the obvious repair — remap
  `cream-300` in the dark block the way `cream-200` is — **would have been wrong.**

  Its only other public consumers are the process diagram's depicted wireframe and the case-study
  illustrations, **both boundary-listed as artwork that must not follow the ground.** Remapping the
  rung would have moved two things deliberately fixed in order to move one that is not.

  **ASK HOW MANY CONSUMERS A RUNG HAS AND WHAT EACH ONE WANTS BEFORE REMAPPING IT.** A rung with one
  consumer that needs a relation and two that need a constant is not a broken rung — it is a
  consumer reaching for the wrong layer.

- **⚠ STATE BOTH FIGURES ON ANY CROSS-GROUND COMPARISON — THE ABSOLUTE DELTA AND THE RATIO AGAINST
  THE LOCAL BACKDROP.** An absolute delta is a whisper on light and a glow on dark: the smoke blobs
  measured +5 to +6 on BOTH grounds and were passed as "comparable", and as ratios they were 1.04–1.07
  on cream against **1.7–2.0 on nocturne — a near-doubling of luminance**, which was the haze the
  owner reported twice while the census said fine. **It would have caught this a session earlier**,
  which is what makes it a number rather than a note.

  **⚠ THE RULE'S FIRST APPLICATION RAN BEFORE IT WAS RECORDED, AND FOUND TWO LIVE MEMBERS.** Every
  cross-ground figure passed this arc was re-examined: the blobs (caught, fixed), the liquid glows
  (caught, fixed), **the bubbles — passed as "comparable" at +1.4 to +4.3 absolute, measured 1.01–1.04
  cream against 2.17–2.55 nocturne** — and the nav sheen (1.03–1.04 against 1.26–1.39, standing on
  renders the owner ruled on with it present). The three derived lit-edges used absolute cream
  contributions as targets BY METHOD; each stands on an accepted render, and that is stated rather
  than silently re-based. **The bubbles are the open member** — points of light rather than washes,
  possibly the bounce mechanic doing its job, and that is an eye's call, not a ratio's.

- **⚠ A LAYER LIST ASSEMBLED FROM SOURCE IS NOT THE PAINT ORDER — EVIDENCED THREE WAYS IN ONE
  COMPONENT.** The vessel's census missed three layers for three different reasons: **the glint was
  dead by occlusion** (a sibling painted its only row), **the capsule sat in an unopened board item**
  (in the stack, outside the census), and **the pearlescent glows fell outside the sample geometry**
  (an 18px edge blur reads 0.00 at the centre). All three were found the same way — **re-deriving the
  subject from the rendered element, candidates removed one at a time** — which is now the method, not
  a recovery. A source list answers "what is declared"; only the render answers "what paints where".

- **⚠ AN OKLCH SERIALISATION READ AS RGB BYTES — the signature defect, caught by inconsistency inside
  one table.** A probe regexed `getComputedStyle().backgroundColor` and six palettes returned
  `oklch()` strings whose components became "rgb" values, producing white-on-accent ratios up to
  20.93 beside three honest rows near 2.8. **The spread between rows sharing one claim is what caught
  it.** Repaired by painting a 1×1 canvas and reading the pixel — the browser does the conversion, so
  the value measured is the value drawn.

- **⚠ `paint-sites` IS A RELIABLE DEFECT DETECTOR AND AN UNRELIABLE CENSUS — A LIMIT, NOT A TODO.**
  Two runs against unchanged pages returned **15,031 and 14,857** site-comparisons, with `elevate`
  down 151 on desktop and `home` down 81. Nothing moved in those pages: **the count is sensitive to
  what has MOUNTED when the capture fires** — reveal animations, lazy content, scroll-driven
  sections that had not settled.

  **⚠ THE DRIFT CANNOT PRODUCE A FALSE FINDING, AND THAT IS WHY IT IS TOLERABLE.** `B1` compares only
  keys present in BOTH palettes, so a site that failed to mount is absent from the comparison rather
  than mismatched. **What it can produce is a false ABSENCE**: a real defect sitting unmeasured in a
  given run, with nothing saying so. `A1` through `A3a` catch a COLLAPSED subject — an error page, a
  dead viewport, a palette that never rendered — and none of them catches a 1% sample drift.

  **⚠ AND THE ONE-LINE FORM, EARNED BY A SIXTH INSTRUMENT CONDITION IN ONE SESSION: A RATCHET THAT
  DRIFTS BETWEEN RUNS ON AN UNCHANGED TREE IS MEASURING THE MACHINE AS MUCH AS THE SITE.** Four blog
  pages flagged `A2` on one run and contributed 420, 505, 576 and 544 on the next, with nothing
  between the two but a restarted dev server — and the totals moved 21,828 to 24,167. **A2 was right
  both times**: it caught a collapsed subject, and the subject collapsed because the machine was
  loaded. **Confirmed by re-measurement rather than dismissed as flake**, which is the only move that
  separates the two.

  **SO A SITE COUNT FROM THIS SUITE IS AN ORDER OF MAGNITUDE, NEVER A FIGURE TO QUOTE.** Citing
  "15,031 sites" as the size of the public surface is the unattached-number defect waiting to happen,
  and this entry is where a reader finds that out before quoting it.

  **THE OBVIOUS CLOSURE IS REFUSED, WITH ITS REASON.** Asserting per-page counts against literals
  would catch the drift and would also fail on every legitimate content change — a gate whose common
  failure is benign is a gate people learn to skip, which is the argument the CI build step already
  made. **A pass here means no defect was found among the sites that mounted**, and that sentence is
  the honest claim rather than a weaker version of a stronger one.

- **⚠ `data-nav-tone` IS UNSET FOR THE FIRST HALF-SECOND AT EVERY WIDTH, AND THAT WINDOW EXPLAINS
  BOTH OF THIS ARC'S NAV ANOMALIES.** Traced from before page scripts run:

      @1100  unset -> dark at 522ms      @1440  unset -> dark at 486ms
      @1284  unset -> dark at 751ms      settled dark at all three, and dark after a resize

  **The 1284 reading that sat "unexplained" for three units was a load-window sample**, taken right
  after a navigation. 1284 is not special — it merely took 751ms. Proven at that exact width rather
  than inferred from another, which is the difference between dropping a loose end and forgetting it.

  **⚠ AND THE WINDOW IS REAL, VISIBLE, AND VARIES — 486 to 751ms.** It is not a probe artefact to
  route around: for that half-second a dark palette renders with the nav tone absent, so anything
  keyed to `[data-nav-tone="dark"]` alone is unstyled while a user is looking. That is exactly why
  the in-pill morph painted `rgb(239,239,239)` and needed `--glass-fill-strong` ground-scoped, and
  exactly why `--glass-fill` and `--glass-stroke` did NOT — `.is-ghost` zeroes them for the whole
  window. **One mechanism, three tokens, three correct and different outcomes.**

  **THE PRACTICAL FORM: a measurement taken immediately after navigation can land inside it.** Settle
  past ~800ms, or assert the tone before sampling anything that depends on it.

- **⚠ A KILLED PROCESS HAS NO `finally`, AND A PROBE THAT SWAPS `theme:` IS EDITING CONTENT WITH AN
  OWNER.** `paint-sites` runs long enough to be timed out — its first widened run was, at ten
  minutes — and the kill left `content/site-settings.yaml` on whichever palette the loop was
  mid-way through. **Leaving it changed is a silent un-publishing**, the exact failure the
  restore-from-main convention exists to prevent. A `finally` covers a throw; only a signal handler
  covers a kill. Any future probe that mutates a tracked file must trap `SIGINT`, `SIGTERM` and
  `SIGHUP`, not just wrap a `try`.

  **⚠ AND THE CLASS HAS ONE MEMBER, WHICH I ASSERTED WITHOUT COUNTING.** I claimed "the vessel and
  theme-render harnesses have the identical exposure" and proposed adding handlers to them. Censused:
  **no other repo script swaps the theme or restores a tracked file through a `finally`** —
  `mutate.mjs` uses an explicit snapshot-and-restore, `normalize-dom` writes an output directory,
  `capture.mjs` writes screenshots. The harnesses I named were **scratchpad probes, which are
  throwaway and not in the repo at all.** A one-member class needs a rule and not a helper; building
  shared plumbing for a single consumer is the shape this repo refuses.

  **The general form: a claim that "this class of thing is also affected" is a COUNT, and it is
  cheap to take.** Mine was an inference from having just written five probes, none of which
  survived the session.

- **⚠ RULED: `--glass-fill` AND `--glass-stroke` KEEP THEIR TONE-ONLY DARK ANSWERS. A REACHABILITY
  RULING, NOT A STYLE ONE.** Both remap under `[data-nav-tone="dark"]` and nowhere else, which reads
  as the same latent split that made `--glass-fill-strong` paint light. **It is not, because they are
  never visible while unmapped.**

      36 steady states (3 pages x 4 widths x 3 scrolls)   non-ghost AND tone-unset: NONE
      260 load frames from 16.1ms                          painting-and-unmapped:    NONE

  `data-nav-tone` really is unset for the first **555ms** — the load window is real — and
  `.nav-glass` carries `.is-ghost` for every frame of it, which sets `background: transparent;
  border-color: transparent`. Measured `rgba(0,0,0,0)` on both. Where the tokens paint, the tone is
  always present.

  **⚠ AND THE SAME WINDOW CONDEMNED A THIRD TOKEN, WHICH IS WHY THE MEASUREMENT WAS WORTH TAKING.**
  `.is-ghost`'s transparency targets `.nav-glass` and **NOT ITS CHILDREN**, so the in-pill morph
  paints throughout that 555ms using `--glass-fill-strong` — light, on a dark page. Same window,
  opposite rulings, and the discriminator is **which element the ghost rule covers**, not which
  token is tone-scoped.

  **THE GENERAL FORM: A TOKEN'S SCOPE IS ONLY A DEFECT WHERE THE TOKEN IS VISIBLE.** Ask what paints
  it and in which states before ground-scoping anything — three tokens shared one apparent flaw and
  only one had it. **The trigger for revisiting is `.is-ghost` ceasing to zero the fill or stroke**,
  or the nav gaining a non-ghost state before the tone reader runs.

  **⚠ AND THE INSTRUMENT HAD TO BE INSTALLED BEFORE THE THING IT MEASURED.** A post-load poll cannot
  see a window that closes during load; the trace starts in an init script, before page scripts run.
  Two earlier readings of "tone unset" were taken inside that window by accident and were treated as
  contradictions of the steady state — they were both, and neither was wrong.

- **⚠ WHEN TWO PATHS CAN PRODUCE THE SAME RESULT, VERIFYING THE OUTCOME DOES NOT ESTABLISH WHICH PATH
  PRODUCED IT.** The arc's best output, above its nine fixes. `data-nav-tone="dark"` fires site-wide
  on nocturne at 0-2-0, so every nav measurement showed the dark repair working — **through the tone
  path, while the ground path beneath it was inert.** Five values shipped shadowed AND verified,
  because the verification measured the outcome and the outcome had two suppliers.

  **A working high-specificity path over a broken low one is invisible from every page the high path
  covers.** The check that distinguishes them is cheap once named: disable or avoid the masking path
  and measure again, or verify on an element only the suspect path serves. **Same family as the
  evidence-produced-by-its-own-subject rule — here the evidence was produced by a SIBLING mechanism**,
  which nothing in the reasoning modelled.

- **⚠ FIVE DARK VALUES WERE DECLARED, SHADOWED BY A LATER `:root` AT EQUAL SPECIFICITY, AND VERIFIED
  BY A CHECK THAT PROVED THE WRONG QUANTITY.** `[data-ground="dark"]` at 0-1-0 tied every `:root`
  block, and one `:root` sits 400 lines below it — so `--glass-shadow`, `--glass-shadow-hi`,
  `--vessel-edge`, `--vessel-lit-edge` and `--hero-tab-lit-edge` all lost on source order.
  **A bundle grep then "verified" them: it proved both values PRESENT, and the property in question
  was which one RESOLVES.** Presence and resolution are different quantities and only one is the
  appearance. The commit that claimed "applied and verified by value" shipped two inert values, and
  this entry is that correction — declared and shadowed, not applied.

  **THE FIX IS SPECIFICITY, NOT ORDER: `:root[data-ground="dark"]` at 0-2-0** beats every plain
  `:root` wherever either sits, so the next inserted block cannot re-break it. `ground-block` is the
  gate, mutation-tested on the selector reverting and on either half of a pair vanishing.

  **⚠ AND THE MASK THAT HID IT: THE NAV-TONE PATH WORKED THE WHOLE TIME.** On nocturne,
  `data-nav-tone="dark"` fires site-wide (measured on home AND blog), and that selector is 0-2-0 —
  so every nav measurement showed the repair working while the ground-block path underneath was
  inert. **A working high-specificity path over a broken low-specificity one is invisible from every
  page the high path covers.** Verify by resolved value on an element the SPECIFIC block serves,
  not on one that several blocks serve.

- **⚠ THE WHITE-ALPHA PARTITION, AS MEASURED — MOST ARE FINE, WHICH WAS THE PREDICTION.** Of the 33
  sites: **paired and working** — the eight inside the four `--glass-shadow*` tokens, the two
  strokes, the four in the nav-tone block (they ARE the dark answers), the sheen (measured 3.12
  cream / 1.88 nocturne through its nav-tone override), `--hero-facts-line`, and the six vessel and
  hero-tab pairs from this arc. **Ground-independent by argument** — `.nav-cta`'s four whites sit on
  the ACCENT fill, which stays mid-tone on every palette. **State-gated, unmeasured** — `.nav-ind`
  (has a nav-tone override), the hover glint, the sheet hover wash. **Unresolved** — `.blog-capsule`'s
  85% inset measured ~0 on BOTH grounds at my sample row, which on the y+1 lesson means THE ROW IS
  NOT ESTABLISHED, not that the layer is dead; and the two markup sites (ContactSection,
  SwatchTokens) are unexamined. **Nothing is condemned; the unresolved four are the open remainder.**

- **⚠ TWO FIGURES ABOUT DIFFERENT SUBJECTS, MISTAKEN FOR ONE — THE TWENTIETH INSTANCE, IN A NEW
  COSTUME.** A line-regex sweep counted **33** `--color-white` sites. A real parser then counted **33**
  — 31 alpha sites across 25 parsed declarations, plus 2 in markup. **They are not the same 33.** One
  counts LINES MATCHING A PATTERN, the other counts ALPHA SITES IN DECLARATIONS, and a multi-line
  `box-shadow` carrying two alphas is one line and two sites.

  **AGREEMENT BETWEEN UNITS IS NOT AGREEMENT.** Every earlier instance here was a figure attached to the
  wrong subject; this one is two correct figures about different subjects landing on the same number.
  **It would have read as confirmation to anyone who had not changed the unit deliberately** — and the
  parser was written to fix an unrelated problem, so the coincidence was found by accident.

  Same family as the boundary count built three times in three units, and the practical form is
  unchanged: **ask what unit each side counts in before believing either**, including when they agree.

- **⚠ A FIXED `--color-white` AT A FIXED ALPHA IS THE DEFECT, AND `box-shadow` WAS ONLY WHERE IT WAS
  LOOKED FOR.** Scoped to shadows the census found 6 members. Widened to every property it is **31 alpha
  sites in `globals.css` plus 2 in markup** — and **`background` is the largest bucket at 11, entirely
  unexamined**, while the arc spent itself on 13 shadow sites.

  **⚠ THE FILE-TYPE BOUNDARY AND THE PROPERTY BOUNDARY ARE ONE DEFECT.** A `.css`-bounded sweep missed a
  JSX inline style; a `box-shadow`-bounded sweep missed a border and eleven backgrounds. **Both are a
  denominator computed inside a walk that cannot see the walk's own edge**, and this population sits
  across both at once.

  **⚠ AND THE PARTITION IS THE DELIVERABLE, NOT THE COUNT — MOST OF THE 31 ARE PROBABLY FINE.**
  `--glass-stroke` at 72% needs `--glass-stroke-dark` at 15%; a 4% sheen may be genuinely
  ground-independent the way `etch`'s alphas measured. **A census that condemns all 33 is as wrong as one
  that found 6**, and only the inert test on BOTH grounds, per consumer, separates them.

  **⚠ AND `--glass-stroke-dark` IS THE PRECEDENT THE VESSEL'S BORDER LACKS.** The nav's stroke carries a
  dark answer three hundred lines from a vessel border that carries one value for both grounds — which
  is evidence the border is an OMISSION rather than a decision.

- **⚠ A DERIVATION CAN BE CORRECT AND AIMED AT A LAYER THAT CANNOT PRODUCE THE APPEARANCE.** The nav's
  dark top inset was derived twice — 13% shipped, 22% from a differencer that isolates the layer — and
  **rendered side by side against cream, a 1.7x alpha difference produced no perceptual change.** Both
  dark variants trace the whole pill equally; **cream carries a top highlight AND a bottom shadow, and
  the ASYMMETRY is the appearance.**

  **13% STANDS AS SHIPPED, RECORDED AS UNDER-POWERED RATHER THAN UNDER-WEIGHT.** The ground affords
  1.61 of darkening against cream's 27.51, so the drop cannot ground the pill on dark, and **a rim with
  no shadow under it reads as a stroke at any alpha.** No top-inset weight fixes that.

  **⚠ THE NO-CHANGE RESULT IS THE EVIDENCE, AND IT IS THE KIND MOST EASILY DISCARDED.** Two honest
  derivations disagreeing by 1.7x invites picking one; **the render says the axis is wrong.** Before
  refining a value, check that the layer it belongs to can express the difference being chased — the
  measure-versus-look split arriving in the LEVER rather than in the instrument.

- **⚠ A ZERO FROM A SEARCH IS ONLY EVIDENCE IF THE SEARCH COULD HAVE FOUND SOMETHING — AND THIS ONE HAD
  A DESTRUCTIVE EDIT WAITING ON IT.** A confirmation grep reported `0 var() reads` for four tokens
  about to be deleted. **The shell had failed on an unquoted glob**, so the zero was the instrument, not
  the code. Every earlier instance of this shape cost a wrong number; this one would have removed live
  declarations.

  **⚠ AND THE RE-RUN STILL MISSED ONE, FOR A DIFFERENT REASON.** `--studio-t0` has no `var()` reader and
  IS read — `readStudioMs("--studio-t0")` through `getPropertyValue`. **Two consumption routes, and a
  gate whose concept is "nothing reads it" had the vocabulary of only one.** Fourth subject error in a
  single gate before it ever ran green, and `consumer-count` A3a is the row that now fails if the JS
  route is dropped.

- **⚠ THE OVERLAY SCALE WAS DECLARED AND THE COPIES WERE NEVER COLLECTED — SIX WHITE-INSET LITERALS
  SIT OUTSIDE IT, AND FOUR HAVE DRIFTED.** `--glass-shadow` is read by five sites, all nav. The blog
  vessel, the blog capsule, `.nav-ind`, `.nav-cta` at rest and on hover, and the home hero's tab pill
  each carry their own.

      .blog-vessel      globals.css:4133   85%   byte copy of the scale
      .blog-capsule     globals.css:4277   85%   byte copy of the scale
      .nav-ind          globals.css:2343   90%   drifted
      .nav-cta          globals.css:2360   35%   drifted
      .nav-cta hover    globals.css:2367   45%   drifted
      hero tab pill     HeroSection.tsx:290 70%  drifted, AND A JSX INLINE STYLE

  **#268 FOUND SEVEN LITERALS ACROSS SEVEN FILES WITH TWO DRIFTED AND DECLARED THE SCALE. This is six
  across five selectors with four drifted, one arc later** — declaring a scale does not collect what
  already exists, and nothing has ever asserted that it did.

  **⚠ AND THE HERO TAB'S DROP IS A DIFFERENT DEFECT WEARING THE SAME CLOTHES:**
  `0 3px 12px oklch(30% 0.018 60 / 0.12)` — a raw OKLCH at **hue 60, cream's warm hue**, themeing on
  none of the nine palettes. **That is a themeing repair and must not ride inside a shadow-weight
  change**, which would ship two unrelated fixes under one justification.

- **⚠ THE FILE-TYPE BOUNDARY'S THIRD INSTANCE, AND THE FIRST WHERE A PERSON SUPPLIED WHAT THE
  INSTRUMENT COULD NOT REACH.** A `.css`-bounded sweep finds **five of the six** literals above. The
  sixth is a JSX inline style, and it was found **because the owner named the element**, not because
  the sweep arrived at it.

  **HAD ONLY THE VESSEL BEEN NAMED, THE REPORT WOULD HAVE BEEN FIVE — COMPLETE-LOOKING, DENOMINATED,
  AND SHORT BY THE INTERESTING ONE.** The two earlier instances were a `.tsx`-only walk missing 81
  rung references in `globals.css` and a sweep whose subject was bounded by directory. **This one is
  the mirror: bounded by stylesheet, missing the markup.** A denominator computed inside a walk cannot
  see the walk's own boundary, in either direction.

- **⚠ `/work/<slug>` RENDERS THE 404 PAGE RATHER THAN FAILING, SO A CAPTURE FROM A WRONG ROUTE LOOKS
  LIKE A REAL PAGE.** The case-study route is **`/projects/<slug>`**. A screenshot taken at `/work/…`
  returns 200 with a fully designed, correctly themed page, and **a hero capture from it would have
  been captioned as a hero.**

  Same family as the stalled full-page capture and the `nextjs-portal` badge — **an instrument
  condition mistaken for a site condition, in the medium nobody thought to apply the rule to.** The
  distinguishing check is cheap and was what caught it: **assert the page title, or assert the subject
  element was found**, rather than trusting the status code.

- **⚠ THE GLASS PANE CONTRIBUTES ALMOST NO SEPARATION ON ANY PALETTE — +0.37 TO +0.45 ON ALL FIVE,
  INCLUDING CREAM.** The nav pill's fill is a wash whose lightness sits within half a unit of the page
  behind it everywhere, so **the pill has always been defined by its EDGES rather than by its body**,
  on light as much as on dark. Nobody had measured it in either direction.

  **⚠ AND THAT REFRAMES THE DARK REPAIR FROM RESTORING A SHADOW TO DECIDING WHAT THE EDGE IS.** On
  cream the edge is overwhelmingly the drop, at 27.51 against the top inset's 3.37. On a near-black
  ground **the drop cannot exist**: the page sits at relative luminance 1.61, so the deepest darkening
  any pigment can produce is 1.61 — a **17x ceiling set by the ground, not by the choice of colour.**

  **⚠ SO `rule` WAS THE RIGHT PRECEDENT TO CHECK AND ITS REASONING DOES NOT TRANSFER.** It is the
  mid-tone built because an extreme must invert and a mid-tone must not, and it holds OKLCH 48.5% on
  every palette — **correct for a hairline, which must READ on both grounds.** A shadow must be DARKER
  than its backdrop, and 48.5% is lighter than a near-black page, so `rule` would glow exactly as
  `etch` does. **A mid-tone solves "must remain visible"; it cannot solve "must remain below".**

  The resolution is this file's own glass rule arriving in the nav: **pale glass shows its thickness
  as shadow, dark glass shows it as transmitted light.** The edge moves to the lit inset, derived at
  13% against the dark pane rather than inherited at 85%.

- **⚠ 1.23 AND 1.37 SHIPPED WITH THE DARK PRESETS AND NO GATE SAW THEM, BECAUSE BOTH VALUES ARE
  CORRECT ON LIGHT.** The blog body painted `ink-800` and the hero rating chip's label inherited
  `ink-950` — raw rungs that do not remap — so **every article and every case-study hero carried
  invisible text on all four dark palettes.** They were found by a person reading one article.

  **⚠ THE TELL WAS INSIDE ONE ELEMENT.** The chip's figure takes `accent-text`, a role, and stayed
  legible; the label beside it set no colour at all and inherited a rung. **One element, two
  foregrounds, one following the ground and one not** — which is the whole defect class visible in a
  single screenshot.

  Repaired to `text-body` and `text-secondary`, chosen by JOB and not by distance: 9.75 to 9.79 and
  7.09 to 7.15 on dark. **The light side moves and that was accepted rather than dodged** — pointing
  body copy at `text-lead` would have been byte-identical and would have made the vocabulary wrong
  forever, which is the trade this project has spent twelve sessions removing.

- **⚠ THE ELEMENT THAT MADE THE GROUND WAS THE ELEMENT BEING MEASURED — SEVENTH INSTANCE OF *A RATIO
  BELONGS TO THE GROUND IT WAS TAKEN ON*, AND THE FIRST OF THIS SHAPE.** The gallery hero's dek took
  the quiet text role to match its mock, and measured **3.79 to 4.17 on the five light palettes**
  against a 4.5 floor. The role is not wrong and is not wrong anywhere else on the site.

  **THE HERO'S OWN ACCENT WASH IS THE GROUND.** `.gallery-hero-glow` is a radial at 17% accent behind
  the copy, so the dek sits on `228,205,187` while the fact row **300px lower in the same component**
  sits on `237,227,213` — and the SAME quiet role clears there at 4.56. One element, two grounds, one
  role, opposite verdicts.

  **⚠ EVERY EARLIER INSTANCE WAS A RATIO BORROWED FROM ANOTHER SURFACE.** A dark foreground measured
  against `canvas`, a pressed chip measured against a token it never composites onto, a figure
  attached to the wrong pair. **This one borrows nothing: the ground did not exist until the
  component created it**, so no amount of checking the token, the role or any other page could have
  predicted it. Only sampling the paint under THIS element could.

  **THE PRACTICAL FORM: A COMPONENT THAT PAINTS ITS OWN BACKDROP HAS INVALIDATED EVERY RATIO ITS
  FOREGROUNDS INHERITED.** Adding a wash, a gradient, a tint or an image behind copy is a
  contrast-invalidating change even when no foreground moved — and nothing in this repo will say so,
  because every instrument reads tokens and this is a composite. Repaired by restoring `text-lead`,
  the masthead's own choice, at 9.70 to 11.43 on all nine.

- **⚠ THE GROUND IS PER CLASS — THIRD INSTANCE, AND IT PRODUCED FALSE FAILURES THIS TIME.** Measuring
  the new dark foregrounds against `canvas` gave **1.55 with failure marks**. `canvas` IS the page
  ground on a light palette and is NOT on a dark one, where `band-dark` is, so the comparison was
  against a token the dark page never paints. The true figures are 9.75 to 9.79.

  The first instance cost a token split, the second a ruling. **This one nearly cost a correct repair
  being reported as broken.**

- **⚠ RULE 25's EIGHTH INSTANCE, AND THE FIRST WHERE THE FALSE READING AGREED WITH THE TRUE ONE.** A
  resolver checking whether a role equals the rung it replaced looked **inside palette blocks only** —
  and roles are declared once in `@theme` while rungs are re-declared per palette, so **every role
  returned null and null read as MOVES on all five rows.**

  **It was right about four of the five.** Every earlier instance produced a reading that was wrong
  throughout; this one coincided with the truth almost everywhere, which is exactly what made it
  credible. **A false instrument that mostly agrees is harder to catch than one that is plainly
  broken.**

- **⚠ AN ITEM NOBODY CAN LOCATE IS NOT AN ITEM, AND CLOSING IT AS UNDEFINED IS A DIFFERENT ACT FROM
  CLOSING IT AS DONE.** "Beats 7 to 9 of the case-study page" sat on the board for months. The term
  appeared **once**, in the line that carried it, and nowhere else in the repository — and three
  derivations produced incompatible readings.

  **⚠ ONE OF THEM WOULD HAVE CLOSED IT FALSELY.** Read against the eleven-part spine, beats 7 to 9 are
  `processSteps`, `keyInsights` and `solutionReveal` — **all present and populated**, so anyone
  inferring from the repo alone would have marked the item done and been wrong about why.

  **Record which closure it was.** "The work was not completed, the item was never specifiable" and
  "the work is finished" leave the same strikethrough and mean opposite things to whoever reads it
  next.

- **⚠ AN INSTRUMENT CONDITION MISTAKEN FOR A SITE CONDITION — SEVENTH THIS WEEK, AND THE FIRST IN A
  SCREENSHOT.** A full-page capture stalled on a pinned section and produced several empty
  screen-heights that read exactly like missing content. The six before it were probes; **this one was
  an image**, which is worse, because a screenshot is the artefact everyone trusts without asking how
  it was made.

  Same family as the `nextjs-portal` badge and the 0x0 vessel. **Rule 25 covers it and needs no
  amendment** — the point is that the rule now has an instance in the one medium nobody thought to
  apply it to.

- **⚠ RULE 25's FIRST APPLICATION AFTER BEING WRITTEN, AND IT PAID IMMEDIATELY.** A 1024 survey found
  the docked reading indicator's date sitting under a dark circular badge in the bottom-left corner —
  a clean, visible, screenshot-backed collision. **It was `nextjs-portal`, the dev overlay.** No site
  element occupies that corner at all.

  **SIXTH INSTANCE THIS WEEK OF ONE SHAPE — AN INSTRUMENT CONDITION NEVER CHECKED**, after reduced
  motion suppressing a component, a mask selecting the viewport, a viewport on an inclusive boundary,
  a box reporting zero size, and a suite run against a stale build. The rule was written from the
  first five; **this is the first time it was applied before reporting rather than after.**

- **⚠ AN ABSENCE IS EVIDENCE ONLY IF THE SEARCH COULD HAVE FOUND THE THING.** *"No save-draft request
  fires"* directed three prompts of diagnosis. It came from searching git history for a head-field
  commit — **and the commit did not exist yet when the search ran.** It exists now, as
  `chore(studio): update blog/<slug> draft`, sitting unmerged on the draft branch, and it is exactly
  what the search was looking for.

  **⚠ AND THE WHOLE DIAGNOSIS INVERTED ON IT.** The status save worked. The control was reading the
  draft branch, which genuinely says `published`, so it was telling the truth and `isDirty` was right
  to treat a second click as a no-op. **There was no read-path defect and no lying control** — there
  was a validator correctly refusing to publish a post with a draft marker in it, reported as
  *"something went wrong"*.

  **A null result carries a timestamp and nothing displays it.** Before treating an absence as a
  finding, ask what would have had to exist at the moment the search ran — and re-run it before
  building on the answer.

- **⚠ A CLAIM ABOUT A DEFAULT, MADE FROM ONE OF TWO DEFAULTS — AND THE FAILURE WAS QUESTIONING A GOOD
  SIGNATURE WRONGLY RATHER THAN NOT AT ALL.** Tracing a publish defect, the signature was *"no studio
  commit ever carried a status change"*, read from `git log` subjects. It had produced a correct
  diagnosis once before, so it was trusted — then doubted, on the grounds that
  `commitCollectionEntry` defaults the blog message to `blocks draft` **regardless of what changed**.

  **That doubt was false.** There are TWO writers with TWO defaults — the shared head-field path emits
  `update blog/<slug> draft` with **no noun**, and the dedicated blocks writer emits
  `update blog/<slug> blocks draft`. **The generalisation came from reading line 345 and never
  looking at line 157.** The messages discriminate and always did.

  **⚠ AND THE CORRECTION IS WHAT LOCALISED THE DEFECT.** Head-field saves for another post appear in
  history three times; **not one has ever fired for the post that will not publish.** So the path
  works and one post does not reach it — which is a far narrower fault than "the save is broken", and
  it was only visible once the signature was trusted again.

  **A signature that has been right once is the hardest kind to question**, and the trap is not
  failing to question it. It is questioning it from a partial read and discarding a working
  instrument.

- **⚠ AND THE DEFECT'S REAL SHAPE IS A CONTROL THAT REPORTS A STATE IT HAS NOT PERSISTED.** Whether
  `saveDraft` returns early on its dirty check or the control was never mounted, **the author sees
  the same thing**: the control reads Published and nothing happens. Neither case is distinguishable
  from the other by looking, and neither is distinguishable from a successful save.

  **THAT IS WHY IT SURVIVED A FIX.** `#438` repaired a real defect in the same control, and the
  symptom is unchanged — so the previous diagnosis is now the main obstacle to seeing this one.

- **⚠ A FIGURE CITED ACROSS A CHANGE THAT WAS SUPPOSED TO MOVE IT, AND NOBODY RE-COUNTED.** "110
  declarations" was the vessel's token cost, counted BEFORE the indicator was reworked and then
  carried through four prompts by both parties as the size of the removal that would follow.

  **Re-derived against the post-change source, every one of the eleven tokens is LIVE.** The change
  removed a SMIL filter and a scroll gate, and **neither consumed a vessel token** — so it could
  never have moved the figure. What it actually made dead was a two-state reveal on two selectors,
  which nobody had counted at all.

  **⚠ THIS IS RULE 15 IN A NUMBER RATHER THAN IN A CLAIM, and the seventh instance this week.** A
  carried item is a claim about the present; **so is a carried figure**, and a figure is worse,
  because it looks like a measurement and gets quoted without its date. The repair is the same and
  it is still cheap: **re-derive a number before scoping work from it**, especially when the work is
  supposed to change it.

- **⚠ THE UNBALANCED-MATCHER FAMILY HAS FIVE MEMBERS, AND THE LAST TWO CAME FROM ONE ROW.** A lazy
  regex asked whether an element sat inside a block and walked straight past the block's close; the
  structural replacement then used `indexOf(")}")`, which finds whichever close comes first rather
  than the MATCHING one — and a mutation that DELETED the close survived it.

  **Both were caught by mutation and neither by reading**, which is the whole argument for testing
  every new row. The general form: **a matcher that needs to know where a construct ENDS cannot be
  written with a pattern that does not count.** Balance the delimiter, or the row is a guess that
  usually agrees.

- **⚠ A GUARD DERIVED FROM THE THING IT GUARDS LOWERS ITSELF WHEN THAT THING IS LOWERED — TWICE IN
  ONE SESSION, THE SECOND WRITTEN AFTER THE FIRST WAS RECORDED.** `theme` V4 computed
  `glass.c + step` where `step` is `pearl.c − glass.c`, which is `pearl.c >= 0` — true by
  construction. `theme-contrast` D12e-a asserted `gaMin > D12E_FLOOR * 3`, so halving the floor would
  have halved the guard and the row would go on calling the floor comfortable.

  **BOTH LOOKED CORRECT, BOTH PASSED THEIR OWN SUBJECT, AND BOTH WERE CAUGHT BY MUTATION AND NEITHER
  BY READING.** That is the argument for mutation-testing EVERY new row rather than the ones that
  look risky — the two that needed it were the two that looked finished.

  The repair is the same both times and it is one word: **compare against a LITERAL.** A guard whose
  expectation is computed from its subject cannot fail when the subject moves, which is the
  denominator rule arriving inside the guard instead of inside the count.

- **⚠ A STATED FLOOR THAT NAMES THE WRONG SUBJECT IS THE SIGNATURE DEFECT, AND `L3c` IS THE FIRST
  GATE TO STAND IN FRONT OF IT.** The dark band's floor was set to **10.5** — the smallest separation
  among the five `band-dark` values, judged full-bleed and ruled distinguishable. Defensible, honestly
  arrived at, **and calibrated on the LIGHT band.** `L3c` requires a floor to name what it was
  measured ON, and refused it.

  **⚠ AND THE REFUSAL FORCED THE DISTINCTION THAT MATTERED: WHAT THIS BAND PROVES IS A CEILING ON THE
  FLOOR, NOT THE FLOOR.** One in-band judgement exists — sapphire and nocturne at dE 6.0, rendered
  full-bleed with the accent held out, read as one colour. So **everything at or below 6.0 is refused
  on evidence and nothing above it has been judged.** The floor is 6.1 until an in-band series is
  read, and the row says so.

  **⚠ IF A LATER IN-BAND READ LANDS NEAR 10.5, THAT IS TWO BANDS CONVERGING BY INDEPENDENT ROUTES —
  NOT CONFIRMATION.** The distinction is the whole value: one borrowed number that happens to be right
  is worth nothing, and two independent series agreeing is worth more than either alone. **It is only
  worth that if the independence is said out loud**, because a converging number reads as a confirmed
  number to everyone who arrives later.

- **⚠ BEFORE SEARCHING A MULTI-VARIABLE SPACE, CHECK WHETHER THE OBJECTIVE DEPENDS ON EVERY
  VARIABLE.** The work filter's two floors are `legibility = ratio(label, fill)` and
  `affordance = ratio(fill, surface)`. **The label appears nowhere in the second.** Three sessions
  varied the FOREGROUND against a defect that is a function of the FILL ALONE — a search that could
  not have succeeded at any value, and every attempt "regressed something" because it was moving the
  only variable the objective did not contain.

  **⚠ AND THE FACTORISATION IS WHAT MADE THE SEARCH TRIVIAL.** Solve affordance over fills first —
  four of ten survive — then legibility over the survivors. **Ten pairs clear both floors on all six
  palettes**, in one pass, after three sessions of one-at-a-time attempts found none.

  **THE TELL IS A SEQUENCE OF ATTEMPTS THAT EACH FIX ONE THING AND BREAK ANOTHER.** That reads as a
  hard trade-off and is often a variable being moved that the objective does not depend on. Same
  family as *"ask what the measurement is a measurement of"*, arriving in the SEARCH rather than in
  the instrument.

- **⚠ AN ASSERTION WHOSE PROSE AND WHOSE DATA DESCRIBE DIFFERENT THINGS, WITH NOTHING COMPARING
  THEM.** `A8a` read *"the selectable set is the six real palettes — five light and one dark"* and
  asserted a list of **five**. The title described the intended end state; the value described the
  held one. **It passed for an entire arc.**

  **⚠ DISTINCT FROM THE SIX GATE-VOCABULARY INSTANCES THIS SESSION**, which were matchers too narrow
  for their concept — a wider regex fixed each. This one has no matcher to widen: **both halves were
  written together, by the same hand, in the same moment, and neither was ever checked against the
  other.** That is the record-and-the-work gap compressed into a single line.

  A title is prose and nothing reads prose, which is the `count:`-field defect and the
  `category:`-as-label defect arriving inside an assertion rather than beside one. **When a row's
  title states a quantity, the row should compute it** — or the title should not state one.

- **⚠ SIX GATES IN ONE SESSION WERE RIGHT ABOUT THEIR CONCEPT AND SHORT IN THEIR VOCABULARY** — `A8`'s
  end-condition matcher, `role-layer`'s filter, `E3`'s floor, the ghost-ink filter, the sweep's
  denominator, and the `aria-hidden` discriminator. **Every one was repaired by widening to the
  concept and never by bending the subject to fit.**

  **That is not six bugs. It is one property of gates written against the cases that existed when they
  were written** — and it is the strongest argument this arc has produced for **deriving a subject
  rather than enumerating one.** An enumerated subject is correct on the day it is written and decays
  from then on; a derived one cannot fall behind its own population.

- **⚠ A SWEEP MUST STATE HOW MANY NODES EXIST, NOT HOW MANY IT VISITED.** The dark-page sweep
  reported **103** nodes across four sessions and **169** the moment its scroll reached further —
  same page, same instrument, deeper reach. **"Three of 103" was quoted four times, including in
  rulings, and it was a count of the instrument rather than of the page.**

  Every figure derived from it described a subset nobody had bounded. **A denominator that changes
  with scroll depth is not a denominator** — state the total the DOM holds and assert the visited
  count against it, or the sweep reports its own diligence as a property of the site.

- **⚠ "DOES EVERY CONSUMER SIT ON THE GROUND THE ROLE'S NAME CLAIMS" IS NOT COMPUTABLE, AND THAT IS A
  LIMIT RATHER THAN A TODO.** `on-accent` asserts a ground in its name. The work filter's pressed chip
  draws it over `.wf-thumb` — **a positioned SIBLING under it by z-index, not an ancestor** — so a
  chip with `background: transparent` walks past the thumb to the container's surface. **No cascade
  walk reaches the thumb, because the cascade does not model paint order.**

  **Second component in this arc whose ground only a pixel can answer**, after the vessel's blended
  stack. Both were diagnosed confidently from the DOM first, and both diagnoses were wrong — including
  a per-consumer verification that measured `on-accent` against a token the chip never composites
  onto, which is the never-meet error committed *inside* the check meant to prove the fix.

- **⚠ THE SANITY PAIR CAUGHT SOMETHING FOR THE FIRST TIME, AND THAT IS THE ARGUMENT FOR IT.** It has
  run before every rasterised measurement here as a formality. In the `N`-curve run the raster path
  was **genuinely broken** — white and black both read `255,255,255`, because the black sample landed
  outside its div after `setContent` layout — and the check is the only reason nothing was reported.
  **Evidence rather than discipline.**

  **⚠ AND ITS OWN FAILURE MODE IS THE SAME ONE IT GUARDS AGAINST: A SANITY PAIR THAT SAMPLES THE
  WRONG POINTS RETURNS A PLAUSIBLE PAIR.** `255/255` is only obviously wrong because the expected
  values are known — sample two points inside a gradient and the pair looks fine. So **assert the
  sample points fall inside their targets**, not merely that the values differ.

- **⚠ A CONSTRAINT CAN BE SATISFIED IN LETTER AND VIOLATED IN SUBSTANCE.** The `N` curve was sampled
  from a pinned region, as required — and **a fixed region is only correct if it is the RIGHT
  region.** The response was flat (39.27 to 40.42 across a 15× change in `N`) and **both samples moved
  together**: tinted pane 32→63, mid pane 9→40. If `N` shifted the tint relative to its backdrop the
  two would diverge; they tracked, which says **`N` is moving something beneath both.**

  So either `N` does not control the tint, or the region does not contain it. **Establish which layer
  a parameter reaches before sampling a curve against it** — otherwise the curve is of the wrong
  quantity, arriving through a constraint that was met.

- **⚠ THE VESSEL WAS NEVER READ FROM WHAT IT PAINTS — FIVE INVALIDATIONS, ONE CAUSE.** Four
  derivations came from an anatomy table, one from source, **none from a pixel**, in a component
  whose entire behaviour is compositing. The first four were wrong about WHICH BODY; the fifth is
  wrong about HOW THE LAYERS COMBINE — `.blog-liquid` declares `background-blend-mode` with an
  **overlay** in it, and every vessel figure in this arc assumed linear `a·fg + (1−a)·bg`.

  **Sampled at rest** (`opacity: 1`, stable five frames): tinted upper pane **34,38,43**, mid pane
  11,16,21, lower body 10,15,20 against a page ground of **10,16,22** — the pass-through confirmed
  from pixels. The tint's real separation is ~28 and it LIGHTENS; every analytic figure had it at
  9–14.

  **⚠ AND THE SOLVE CANNOT BE ANALYTIC.** Overlay is piecewise and depends on the backdrop, so
  changing the tint's `N` does not move the result linearly. **It must be sampled at several values
  and read off the curve** — and the curve must be sampled from THE SAME REGION each time, since the
  panes differ by 20 units and a curve assembled from drifting regions is the same error in a new
  costume.

- **⚠ THE VESSEL'S EDGES ARE UNEXAMINED AND CARRY MORE OF ITS READ THAN THE TINT.** Measured
  **61–71** against a body of 10–15 — brighter than anything the four-mechanic anatomy contained.
  **Nobody has asked what they are or whether they theme.**

  **THE ANATOMY NAMED FOUR MECHANICS AND NEVER WEIGHTED THEM.** That is the error that hid the smoke
  stops — a taxonomy correct by KIND and never weighted by EFFECT — **recurring in the same component
  on the same axis**, now hiding the rim. Ask before building any achromatic palette: Basalt has no
  hue, and a rim carrying the vessel's read is exactly where that matters.

- **⚠ THE VESSEL'S BODY IS THE ARC'S RECURRING WRONG SUBJECT — IT HAS INVALIDATED FOUR MEASUREMENTS
  NOW.** The tint's `N`, the shadow's 0.09× and the highlight's 76.0 were all solved against an
  assumed body and had to be re-derived when the real one turned out to be the PAGE. The anatomy
  table called the body "a surface that must invert"; it is a **pass-through** — a wash at 78% over
  whatever is behind, so on light it IS the page. **That error survived two arcs.**

  **⚠ AND THE FOURTH IS OPEN AS THIS IS WRITTEN.** A re-solve used `canvas` where an earlier probe
  used `vessel-pearl`, so its two moved values (harbour 5→11, cerise 4→12) are either a real
  near-edge finding or an artefact of my changing the subject between runs. **Neither reading is
  available until the body is settled** — so derive it FROM THE RENDERED STACK rather than from any
  table, and re-solve once against that.

- **⚠ A UNANIMOUS RESULT ON THE WRONG QUANTITY READS AS OVERWHELMING EVIDENCE.** The pigment model's
  direction test **passed six for six** and was blind by construction: it measured the shift's
  direction against the BODY, where the failure is the pigment's position relative to the SURFACE.
  Two quantities one step apart, and the passing one was the one chosen.

  **Every earlier instance in this arc had at least one figure that looked odd.** Six-for-six had
  none, which is what made it persuasive — so **a clean sweep is a reason to re-read the predicate,
  not to stop checking.**

- **⚠ AND A CONTROL IS WHAT MAKES A FAILURE DIAGNOSABLE RATHER THAN SWEEPING.** Basalt's zero-chroma
  ground broke the vessel's tint and **left `rule` untouched** — 43.0 / 69.8 / 80.5 light and
  22.2 / 36.0 / 41.6 dark, within 1% of cream's figures. One mechanic held and one failed **under the
  same condition**, so the cause is the tint's derivation rather than achromacy.

  **Without the control, "Basalt breaks the pigment model" would have been the conclusion, and it is
  false.** When a new member breaks something, check what it did NOT break before naming the cause.

- **⚠ EIGHTEEN INSTANCES OF ONE GAP, AND IT CARRIES FORWARD AS A LIMIT RATHER THAN A BACKLOG ITEM:
  NOTHING HERE CHECKS THAT A MEASUREMENT'S STATED SUBJECT IS THE ONE IT WAS TAKEN AGAINST.** Every
  instrument in this repo checks VALUES. None checks PROVENANCE. The variants have been a wrong
  element, a wrong threshold, a wrong predicate, a wrong property, a wrong population, a subject
  supplied by a shell, and a count inflated by a join.

  **⚠ THE LAST SEVERAL WERE FOUND BY READING A DOCUMENT RATHER THAN BY RUNNING ANYTHING** — the
  unwired dark roles in a render, the unmeasured body in my own anatomy table, the split walk in a
  census. **That is not a gap a gate can close**, and a gate for it would be the fourth form rule
  wearing new clothes: it would check that a stated subject matches a declared one, and the defect is
  always that the declaration was never written down.

  The only thing that has reliably worked is **stating the subject beside the number** — "1.24, on
  this element, on this ground" — which makes the mismatch visible at the moment of writing rather
  than three turns later.

  **⚠ AND THE EIGHTEENTH'S PLACEMENT IS THE WARNING:** a count inflated by a join, **inside a probe
  written to fix a wrong-subject defect** — 24 candidates for 11 sites, because six rows sharing two
  foregrounds were iterated per row rather than per declaration. **What proved the fix was the
  reconciliation** (8 = 11 minus the three that had been moved), not the corrected number. A count
  that merely looks better is not a count that has been checked.

- **⚠ A UNIFORM RULE MEASURED IN THE WRONG SPACE REPORTS ITSELF AS SIX DIFFERENT RULES.** The
  vessel's tint was carried as a defect — *"7.0 to 14.0, a 2× spread, and no per-palette audit finds
  it because every palette is individually correct."* Measured properly, **every palette declares it
  identically**: lightness step −2, hue delta 0, chroma step 0.009–0.013.

  **The spread was in the instrument.** Separation was taken as euclidean sRGB distance, and a fixed
  OKLCH step maps to different sRGB distances at different hues — sRGB holds ~0.289 of chroma at h300
  and ~0.126 at h158. Orchid (most room) reports the smallest at 7.0; fern (least) the largest at
  14.0, which is the exact inverse relationship. **This is "chroma is not comparable across hues"
  arriving in separation rather than in gamut.**

  **⚠ AND THE FRAMING WAS THE DEFECT, NOT JUST THE NUMBER.** It was stated as *a uniform rule
  producing six different results*. It is **a uniform rule producing one result, measured in a space
  that reports it six ways** — and the first framing is the more interesting claim, which is why it
  survived unexamined and nearly bought a round of renders and a by-eye ruling for a unit with no
  subject.

- **⚠ A DISTANCE IS NOT A DIRECTION, AND A ROTATION IS NOT AN APPEARANCE.** Two figures, one gap.
  The first measured a tint's SEPARATION from its body and offered it as colour IDENTITY — five
  palettes would have shifted by 3.7 to 9.5 under a claim of "zero pixels move". The second measured
  the ROTATION OF THE SHIFT the tint applies and read it as the tint's own rotation: fern's 79° said
  "possibly a different material", and the two renders are unmistakably one object.

  **BOTH NUMBERS WERE CORRECT ABOUT A QUANTITY NOBODY WAS LOOKING AT.**

  **⚠ AND THE ACTIONABLE HALF IS THAT THE RIGHT NUMBER WAS ALREADY AVAILABLE: fern's TOKEN hue moves
  138 → 145.7, under eight degrees.** That figure would have answered it without a render. So the
  render confirmed what a better-chosen measurement would also have shown — **ask what the
  measurement is a measurement of**, arriving once more from the far side.

  The control is what makes the ruling safe rather than lucky: harbour at 0° and sapphire at 7° read
  as one material across both grounds, so fern is the model's **limit** and not its refutation. **A
  model that stretched everywhere would be a model that was wrong.**

- **⚠ EVERY EARLIER INSTANCE PRODUCED A FALSE VALUE. THIS ONE WOULD HAVE PRODUCED A FALSE LIMIT.**
  A probe evaluating whether built colours could be traced to source **dropped the source colour's
  own alpha** — `--color-smoke-3` is declared at .74, mixed at 72%, folds to .5328 — and reported
  `NOT TRACED`. The conclusion it supported was *"the census cannot trace built colours, and the
  limit is the deliverable."* **The trace was available the whole time.**

  **⚠ THE ASYMMETRY IS THE POINT: A WRONG VALUE GETS CAUGHT BY THE NEXT MEASUREMENT; A WRONG LIMIT
  GETS CITED.** It closes a question permanently and reads as rigour rather than as error. And it was
  available because a limit had been named as an acceptable answer — **which is worth doing and
  raises the cost of getting it wrong.** When the answer "this cannot be done" is on the table,
  verify the probe that produces it at least as hard as one producing a value.

- **⚠ NAME-BLIND, THEN DERIVATION-BLIND, THEN FOLD-BLIND — THREE FIXES, EACH CORRECT, EACH BLIND ONE
  COMPILER PASS DEEPER THAN THE LAST.** The census began matching colours by NAME and missed everything
  spelled differently. #336 replaced that with matching by FORM, and it counted 14 relative-colour
  values as authored literals because it could not see derivation. The form rule then went blind to
  the BUILD: `color-mix(in srgb, var(--vessel-capsule) 88%, transparent)` contains no literal when
  written and **is** a literal — `#ded5c7e0` — by the time the census reads the bundle.

  **THE COMMON CAUSE IS THAT THE CENSUS CLASSIFIES BY FORM AND FORM IS NOT PRESERVED THROUGH A
  BUILD.** That is a property of the pipeline, not a bug in the instrument, and **a fourth form rule
  would go blind one pass deeper again.** The honest question is whether a built colour can be traced
  to its source at all: if it can, that is the mechanism; **if it cannot, the census has a stated
  limit rather than a fix, and saying so beats a fourth form rule.**

  **⚠ THE REPAIR IS EVALUATION RATHER THAN MATCHING, AND THAT IS WHY IT SURVIVES.** The tracer
  recomputes what the compiler computed — resolve the token chain, compound the alphas, derive the
  literal. It does not depend on form surviving the build, which is what made the previous three
  blind. A literal and a fold are indistinguishable by value, so a collision is **reported rather
  than resolved by preference**, and asserted empty today so the first one fails on arrival.

  **⚠ AND THE EXPOSURE IS NOT COLOUR-SPECIFIC — NAME THE FOURTH BLINDNESS BEFORE IT HAPPENS.**
  `linear-gradient(to bottom, …)` lost its direction keyword in the same bundle. **The compiler
  normalises far more than colour**, so anything the census infers from built output — selector
  shape, property order, at-rule nesting, shorthand expansion — carries the identical blindness with
  no equivalent repair, because recomputation only works where the source value can be re-derived.
  Colour happens to be re-derivable. Most of the rest is not.

  **⚠ AND `J1`'s WORDING IS FALSE OF ITS OWN SUBJECT.** It asserts *"every AUTHORED colour in the
  built CSS"*. The built CSS contains authored colours, compiler folds and fallbacks — **three kinds
  it names as one**, which is the wrong-noun shape inside the assertion that reports it.

- **⚠ AGREEMENT ON A BOUNDARY IS NOT AGREEMENT ON WHAT IS INSIDE IT.** Two independent routes found
  the vessel's eleven tokens — a classification from the render, and section L's derivation from
  consumption — and that corroboration was cited as making the deferred redraw *"a fact about the
  system rather than a judgement about a screenshot"*. **It was a fact about the system and the
  judgement inside it was still wrong.** Measured per mechanic, **only three of the eleven invert**;
  the shadow takes `etch`'s treatment and the highlight is kept untouched. **The redraw was three
  tokens wearing eleven's clothes for two arcs**, and neither route asked whether the eleven were one
  kind, because both were answering "which tokens" rather than "how many mechanics".

  **⚠ AND THE INSTRUMENT THAT SPLIT THEM ALREADY EXISTED.** `etch`'s comparator — separation from the
  surface beneath, at each consumer's own alpha — was reused to ask **which mechanics depend on being
  LIGHTER than their backdrop rather than merely DIFFERENT from it.** That is the move that settled
  `rule` (*an extreme must invert, a mid-tone must not*) **generalised from a token to a mechanic**.
  Nothing had to be built; naming the quantity first is what found it.

- **⚠ THERE IS A STEP BETWEEN MEASURE AND LOOK, AND IT IS THE ONE THIS ARC KEPT SKIPPING: ASK WHAT
  THE MEASUREMENT IS A MEASUREMENT OF.** Every earlier decision here split into *"the instrument is
  silent, so look"* — the card lift, the palette renders, the vessel. **The `text-subtle` fold split
  differently: the instrument was pointed at the wrong quantity.** It reported 1.09× confidently and
  the number was correct; it was a measurement of value distance where the question was about
  population.

  **Only the second kind is fixable by measuring better**, and telling them apart is what the step
  buys. **Twice now the deciding number has been a count nobody had thought to take** — pills per
  section at the default fold, and elements per level before a merge. Neither is exotic; both were
  invisible because the obvious instrument was already answering something.

  So before running the obvious comparator, **name the quantity the decision actually turns on.** If
  the comparator does not measure that quantity, it will still return a number, and that number will
  be right about something else.

- **⚠ BEFORE MERGING TWO TOKENS, COUNT THE ELEMENTS AT EACH LEVEL. IF THE MERGE COLLAPSES TWO
  POPULATIONS INTO ONE, THEY WERE A HIERARCHY — however close their values sit.** Folding
  `text-subtle` onto `text-secondary` took the count of visible elements painting the quiet colour
  from **49 to 89**. The quiet layer does not get darker; **it stops existing**, and a timestamp and
  a body caption become the same thing. **49 → 89 is what losing a level looks like as a number.**

  **⚠ AND THE RATIO WAS NOT WRONG — IT WAS ANSWERING A DIFFERENT QUESTION.** #386's comparator put
  the two at **1.09× to 1.16×** apart on all six palettes, against the **1.98×** that proved `border`
  and `etch` distinct. That says the two VALUES are close. **It says nothing about whether two ROLES
  are one, because a role is defined by what reads at it, not by how far apart the values sit.**
  `border` versus `etch` was a STRENGTH question; this was a HIERARCHY question; the same instrument
  was applied to both. **The precedent held and its subject differed** — the arc's most repeated
  shape, arriving in a comparator rather than in a count.

  A future reader meeting the same 1.09× will otherwise reach the same wrong conclusion. **This is
  the check #103 did not have**, and it would have caught `text-muted` and `text-subtle` being
  clamped to one AA-safe value four hundred PRs ago.

- **⚠ EVIDENCE PRODUCED BY THE THING IT IS OFFERED AS EVIDENCE FOR.** `text-subtle` and
  `text-secondary` resolve differently on a dark ground, and that was cited as evidence the two roles
  were distinct. **They differ because two PRs earlier I had given them different dark values** —
  authored, then cited. `rule`'s dark difference was the real form: measured on tokens that already
  shipped.

  Same family as a round-trip assertion seeding its own value, **one level up — in the reasoning
  rather than in a gate**, where nothing mechanical is watching. The test: ask whether the
  difference existed before you went looking for it.

- **⚠ A REFUSAL CAN BE RIGHT ON ITS OTHER GROUNDS AND WRONG ON ITS STATED ONE — SECOND INSTANCE.**
  The `text-subtle` fold was forbidden citing `ink-600`'s three values across six palettes. That is
  still true and **it was never the deciding evidence**: the separation straddled its threshold only
  because the two tokens were compared TO EACH OTHER, where #386 compared each to the surface it sits
  on. **The straddle was an artefact of the wrong comparison**, offered by me and accepted without
  either of us asking which comparator the precedent had used. The refusal survived on the population
  test instead. Same shape as the `text-body` correction.

- **⚠ A WRONG PREMISE AND A WASTED INVESTIGATION ARE SEPARABLE, AND THIS ARC HAS NOW SEPARATED THEM
  FOUR TIMES.** "Sapphire gets the ladder repaint on top of the dark step" was stated by me and
  endorsed in the ruling that asked for its render. **It was false for a structural reason available
  before either of us reasoned about it: a dark-ground palette never paints `canvas`**, so the
  surface ladder is entirely a light-ground change and sapphire's dark page saw only the derived
  step. Neither of us checked.

  **THE RENDER WAS STILL WORTH TAKING**, because it answered the question that actually mattered —
  whether 1.21 holds on a dark ground — and it does. **Judge the premise and the investigation
  separately**: a check run for a wrong reason can still be the check that was needed, and killing it
  because its justification collapsed would have left the real question unanswered.

- **⚠ HIERARCHY RIDES ON SIZE AND WEIGHT, NEVER ON COLOUR OR OPACITY — because the first pair is
  ground-independent and the second is not.** The section `h2` rendered at **60px/400** above an `h3`
  at **30px/600**: size said "more important", weight said "less", and the two axes cancelled. It
  read as one level.

  **⚠ AND NOTHING BROKE IT — MAKING THE WORD SOLID REVEALED IT.** At 18% alpha the `h2` was
  background texture, so nothing ever compared the two, and **the hierarchy had been resting on
  opacity the whole time.** Opacity is exactly the mechanism that cannot survive a change of ground,
  so on the dark palette the heading vanished and the latent defect surfaced looking like a
  regression the palette had caused. **Same failure as `etch` and `text-subtle`, arriving in the type
  scale instead of the colour tokens** — which is why it is recorded here rather than in the
  component.

  The concrete form: **a heading must not be lighter in weight than the heading it outranks.** Anything
  separating two levels by tint alone will collapse the first time a palette changes ground.

- **⚠ A RULING'S EVIDENCE CAN BE PARTLY FALSE WHILE THE RULING SURVIVES — SAY BOTH.** The fold of
  `text-subtle` into `text-secondary` was refused partly on "`text-body` is the article's entire body
  copy at 1.24". **That figure was mine and the reasoning built on it was the owner's, and neither
  was checked.** The prose paints `var(--color-ink-800)`, a raw rung, and still does; `text-body` has
  two consumers, both `style` objects in About and Contact.

  **THE RULING STANDS ON ITS OTHER EVIDENCE** — `ink-600` holds three values across six palettes, so
  the fold had no palette-independent justification, and that measurement is intact. **But a correct
  ruling must not keep a wrong justification.** A ruling that survives its evidence being corrected
  should be **seen to have survived it**, because the alternative is a true conclusion propped up by
  a reason nobody can reproduce — which is indistinguishable from luck the next time it is cited.

- **⚠ GATE THE OBVIOUS WORKAROUND, NOT ONLY THE THING ITSELF.** `theme-contrast` L1 requires every
  ground to sit in the light band; **L2 requires the band to stay narrow enough that hue still
  matters across it.** Widening the band to make L1 pass therefore fails — the escape hatch is
  closed, and closing it cost one row.

  **THIS IS RARE HERE AND IT SHOULD NOT BE.** Most of this arc's gates could be satisfied by
  loosening the very thing they measure, and **three were**: the exemption list that let a dead token
  survive a contrast floor, the hardcoded pair list that stayed at three while the subject grew, and
  the denominator guard that computed its expectation from the subject it guarded. **When writing a
  constraint, ask what the cheapest way to satisfy it would be, and whether that way is also
  measured.**

- **⚠ A COMPUTED-STYLE COMPARISON IS NOT A RENDER COMPARISON.** It reports every MECHANISM change,
  including ones no pixel expresses — so it is the right tool for proving a mechanism moved and the
  **wrong one for proving an appearance did not.** #387's fingerprint reported two scopes MOVED when
  nothing on screen had changed.

  **⚠ THE CLEANEST POSSIBLE EXAMPLE IS THE 25 ELEMENTS INHERITING AN UNUSED COLOUR:** their computed
  `color` went from `ink-950` to `on-dark`, and **not one of them paints text of its own.** The value
  changed, nothing draws it, and **only asking WHICH ELEMENTS PAINT TEXT separated the two.** Restrict
  the fingerprint to elements that actually paint, or a passing comparison is luck and a failing one
  means nothing.

- **⚠ THE PALETTE'S EXTREMES ARE WHERE A THEME HAS LEAST TO SAY — AT SMALL SIZES.** The two FAVICON
  candidate grounds (`#211C16` and `#0B1A22`) differ by **25.1**, and the two PWA SPLASH grounds
  (each theme's `cream-50`) by **16.8** — and neither hue is visible **at 16 to 64px, which is the
  size those two surfaces are.**

  **⚠ THE ORIGINAL WORDING SAID "AT ANY SIZE" AND THAT IS FALSE, MEASURED AT PAGE SCALE IN #388.**
  Rendered as full-bleed grounds, the five `band-dark` values are **plainly distinguishable — warm
  black, blue black, violet black, red black, green black — and each reads as its own hue ALONE,
  with no neighbour to compare against.** Their pairwise separations are 10.5 to 30.2, so seven of
  ten pairs sit BELOW the 25.1 that was ruled invisible, **and the render refutes the number.** The
  ruling was right about its subject and overgeneralised by three words.

  **⚠ THOSE SUBJECTS ARE NAMED HERE BECAUSE THE LINE DID NOT NAME THEM AND I SUPPLIED THE WRONG
  ONES.** Re-deriving these figures in #380 I read "near-black grounds" as the `band-dark` TOKEN,
  measured 26.3, and reported a 1.2 discrepancy against a figure that was never about `band-dark`.
  Both numbers were right about different pairs. **A measurement recorded without its subject invites
  a reader to supply one**, and the reader who did it here is the one who wrote the surrounding
  rules. So a surface
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

- **⚠ A CLASSIFIER THAT READS A VALUE RATHER THAN A DECLARATION IS CORRECT UNTIL A MEMBER ARRIVES
  WHERE THE VALUE AND THE CLASS COME APART.** Section L classified a palette by reading its `canvas`
  lightness. That works for every LIGHT palette because `canvas` IS the page ground there — and
  breaks for a dark one, where the page ground is `band-dark` and `canvas` is something else.

  **⚠ THIS IS THE SAME MISTAKE TWICE IN ONE MECHANISM, BOTH TIMES BY INFERENCE FROM A VALUE THAT
  HAPPENED TO AGREE.** First the band itself was a single band hiding a per-class fact; then the
  band registry classified members by a token that happened to coincide with the class. **Each was
  found only when a second member arrived.** A palette IS light or dark — that is a fact about the
  palette, not a consequence of one of its tokens — so it is DECLARED and the measurement
  cross-checks it.

  **AND THE DECLARATION MUST BE REQUIRED RATHER THAN DEFAULTED**, or a new palette silently joins
  the majority class, which is the failure L exists to prevent reintroduced at the declaration.

- **⚠ A DENOMINATOR PROVES YOU COUNTED EVERYTHING YOU LOOKED AT, NOT THAT YOU LOOKED AT
  EVERYTHING.** The role migration ran four PRs with sound per-directory and per-category
  denominators, each asserting its subject was non-empty — **and its file walk collected `.tsx`
  only.** `globals.css` holds 81 raw rung references and was never in the subject, so a dark ground
  paints and every section covers it. **Every check verified the count within a population whose
  boundary nobody stated.**

  **⚠ THE ACTIONABLE FORM: WHEN A SWEEP IS BOUNDED BY DIRECTORY, ASK WHAT BOUNDS IT BY FILE TYPE —
  AND ASK IT OF THE OTHER SWEEPS TOO.** The census reads built CSS, SVG attributes and runtime JS;
  the role migration read `.tsx`; `raster-grounds` walks `public/`. **Any sweep whose subject is a
  file walk has a boundary its denominators cannot see**, because a denominator is computed inside
  the walk.

- **⚠ A DERIVATION PROVEN, MEASURED ACROSS FIVE PALETTES, AND NEVER WIRED — THE SHARPEST STRUCTURAL
  GAP IN THIS ARC.** #389 derived the four missing dark role values, proved them `color-mix` of
  tokens every palette already declares, and measured the relation on all five. **Nothing ever
  referenced them from the `[data-ground="dark"]` block.** Every part was checked and **nothing
  checked the join.**

  **⚠ AND NO EXISTING GATE COULD SEE IT.** A token that resolves correctly and is referenced by
  nothing produces **no wrong value, no failing ratio, no missing declaration** — the whole
  instrument set reads values and declarations. Same family as a completeness assertion whose
  subject excludes the thing that broke, arriving as **an absent connection rather than an absent
  subject.**

  **The check that catches it is a CONSUMER COUNT on the block that is supposed to remap** — assert
  every role the dark ground must redirect is actually referenced there, because the same gap exists
  for every role the block is meant to cover.

- **⚠ A RATIO BETWEEN TWO COLOURS THAT NEVER MEET IS AS MEANINGLESS AS A RATIO INVOLVING A COLOUR
  THAT CANNOT EXIST.** Both return plausible, checkable-looking numbers. Jade's was a clipped colour
  measured at 4.320; `accent-600` on `band-dark` measures 2.16 to 2.64 across five palettes and
  **those two never appear together on any page** — `SectionRenderer` gates the dark ground on
  `isWebHero`, so the h1 that uses `accent-600` falls through to a light card.

  **⚠ JADE'S WAS REFUSED ONCE THE GAMUT CHECK RAN BEFORE THE CONTRAST CHECK. THIS ONE HAS NO
  EQUIVALENT GUARD**, because an instrument reading tokens cannot know which pairings the DOM
  actually produces. **That is the usage map's deepest limit, now named twice from opposite sides:**
  grounds that resolve at a distance, and pairings that never occur. **The map asserts what meets
  what, and only the render knows.**

- **⚠ A LABEL THAT NAMES A CAUSE RATHER THAN A THRESHOLD INVITES A GATE TO ASSERT THE CAUSE.**
  `theme-contrast`'s 3.0 rows were called **non-text** — a claim about what elements ARE — when the
  checkable claim is **"3.0 applies"**, a claim about which floor governs. A gate written from the
  label reported two non-violations (`text-3xl` and `text-5xl` accent text, where 3.0 IS the WCAG
  floor for large type). **The floor was right and the label was wrong**, and only the threshold form
  is verifiable.

- **⚠ AND THAT MAP IS UNVERIFIED RATHER THAN MOSTLY SOUND — SAY THE DENOMINATOR.** It holds **37
  rows**. **Two have been checked against a real consumer and BOTH WERE FALSE** — accent-500's
  non-text row (the rating chip) and ink-400's (the love readout). **35 have never been checked.**
  A 100% failure rate on a sample of two is not evidence the rest are fine; it is evidence nobody
  has looked.

  Every TEXT row's foreground does have a consumer, so the mirror defect — a floor enforced on
  nothing — is absent. **The standing risk is the other one: a row whose ground is resolved several
  components away cannot be checked statically at all**, which is how the chip was found by accident
  and how the readout escapes its own gate. **The map is protected by prose in more places than
  anyone has counted.**

- **⚠ A GUARD WHOSE FILTER IS ITS OWN PRECONDITION CAN ONLY FAIL IN ONE DIRECTION.** `L3a` selected
  rows where `hueFloor === null` and then checked their stated reason — so a row that GAINED a floor
  **left the selection entirely and took its stale reason with it.** The mutation that matters is the
  one that moves a row OUT of the guard's subject, and **that is invisible from inside the filter.**

  **THE GENERAL FORM: A CONDITIONAL ASSERTION NEEDS ITS COMPLEMENT ASSERTED TOO** — not because the
  complement is also true, but because **the complement is where a value and its documentation come
  apart.** L3b and L3c close both directions.

- **⚠ A DENOMINATOR GUARD DERIVED FROM ITS OWN SUBJECT GUARDS NOTHING — AND THIS IS THE ARC'S LAST
  WORD ON DENOMINATORS.** D12b existed *solely* to catch an empty run, and computed its expected
  count from the list it was checking: `PAIRS.length === n(n-1)/2` with `n` from that same list. **An
  empty list satisfied it exactly**, and five of D12's six rows passed with it, because nothing to
  iterate is indistinguishable from nothing wrong. **Only the CONSTANT floor row caught the
  mutation.**

  **THE REPAIR IS THE CONSTANT.** A denominator assertion must compare against something **the
  subject cannot hollow out** — a literal, or a count arrived at by an independent route. That is
  **D3b's two-readers rule arriving one level down**, and it is the **sixth** place "check the
  denominator" has turned up wearing new clothes. The closed form is still worth asserting, as a
  separate row that cannot absorb the other's failure.

- **⚠ MEASURE THROUGH THE STRING THAT GETS WRITTEN, NOT THE VARIABLE THAT PRODUCED IT.** A search
  for an in-gamut colour reported margins of +0.49 and +0.00 for values that were **2.65 and 1.7
  outside sRGB**, because `(l * 100).toFixed(1)` rounded 49.55 to "49.6" AFTER the overshoot had
  been computed on 49.55. **The number was true of a colour, and not of the colour it was written
  beside.** Round first, then measure the rounded form — `gamutOvershoot(css)` on the literal string
  — so the value tested and the value shipped cannot differ.

  **⚠ SAME FAMILY AS THE MISLABELLED THEME CAPTURE: the number was real and it described a different
  colour than the one beside it.** And **the gate outranked the author because it reads the
  STYLESHEET rather than the report** — which is precisely why **a gate that RECOMPUTES beats one
  that PINS**, and why K2 caught what review could not.

- **⚠ A FETCH IS PART OF THE READ — `git show main:...` ANSWERS FROM THE LAST FETCH, NOT FROM
  GITHUB.** The restore-from-main convention below says read the published theme from the file. For
  an entire arc that read returned `nocturne` — **correct about a local main last fetched before
  `73c7855`, the studio publish that set cream at 21:39 the previous evening.** Every "restore to
  the published value" in that arc restored to a value that had stopped being published, and the
  post-merge verification is what caught it — first read as a broken probe un-publishing the theme,
  then corrected by the history to an authored change my stale ref had never seen.

  **⚠ THE STALE-RECORD SHAPE INSIDE A RULE WRITTEN TO PREVENT STALENESS — second time this week**,
  after the file-type rule whose own walk ignored it. A rule that names the authoritative source
  must also name how fresh the source is, or it inherits the staleness it was written against.
  `git fetch origin main` before the read, or read `origin/main` and say so.

  **⚠ AND THE ARC'S COMMIT BODIES CARRY THE STALE CLAIM, WHICH CANNOT BE EDITED, SO IT IS CORRECTED
  HERE BY NAME.** Several #457 commit messages assert "`theme: nocturne` clean" as verification.
  Each was true of the working tree against a stale local main; **the published value was cream from
  `73c7855` onward.** No content was harmed — the branch never committed the file, and the merge
  carried main's own value through — but the record's claims described yesterday's main, and this
  entry is where a reader of those bodies finds that out.

- **⚠ A CONVENTION THAT NAMES A SPECIFIC THEME IS THE FIXED-LIST SHAPE.** "Revert `theme:` to
  `cream` before committing" went stale the moment the owner published harbour through /studio, and
  following it would have **silently un-published their choice while looking like tidying up**.
  Restore to the PUBLISHED value, read from `git show main:content/site-settings.yaml`. The
  published theme is CONTENT with an owner, so the file is the only correct source — same defect as
  D12's hardcoded pair list and `SETTINGS_THEME_VALUES` before ralph tied it to `THEME_NAMES`.

- **⚠ THE FOUR MISSING DARK ROLES ARE ZERO NEW TOKENS, AND THAT DISSOLVED A CONTRADICTION RATHER
  THAN RESOLVING IT.** `surface`, `surface-well`, `border` and `text-lead` had no dark values; all
  four are `color-mix` of `band-dark`, `on-dark` and `on-dark-muted`, **which every palette already
  declares.** So they are per-palette BY CONSTRUCTION, G4 stays at 35, and no light palette carries
  an inert token.

  **The ruling had said "only dark palettes carry the four" while G4 says every theme declares the
  same set — incompatible, until it turned out THERE IS NOTHING TO CARRY.** Measured, the relation
  is identical across all five palettes: `surface` at 1.130 from the ground, `surface-well` at
  1.060. **Fourth reduction in this arc and the largest: eight tokens to four to zero.**

- **⚠ A DARK SURFACE STEP IS ~1.13, DERIVED — AND IT IS NOT THE LIGHT FLOOR.** Rendered at four
  strengths and looked at: **1.050 does not read as elevation on a dark ground** — barely a boundary
  — while 1.130 reads clearly as a raised card. The light 1.05 was derived from cream's shipped
  ladder; there was no dark ladder to derive from, so it was built and measured the same way.

  **⚠ IT LANDS NEAR THE MOCK'S CHOSEN 1.12, AND THAT IS A DIFFERENT FINDING FROM "THE SAME NUMBER
  FOR A DIFFERENT REASON".** The chosen number was approximately right AND IS NOW DERIVED RATHER
  THAN INHERITED. Both phrasings are worth keeping separate: one says two derivations agree, the
  other says a guess survived measurement.

- **⚠ A DARK THEME IS NOT A SIXTH PALETTE — IT IS THE FIRST OF A DIFFERENT CLASS, AND THE COUNTING
  BOUND DOES NOT APPLY TO IT.** Measured: at ground chroma .020, the share of the difference between
  two grounds that hue can contribute is **38% across the whole light band** (dL .042) and **0.1%
  between a light ground and a dark one** (dL .75). So light and dark grounds do not compete for
  hue; the dark class has its own circle and its own count, and *"seven themes cannot clear 60
  degrees"* is a statement about **light** themes.

  **⚠ AND THE MIDDLE IS NOT EMPTY, SO THIS IS A CONSTRAINT RATHER THAN A RULE.** The transition is
  gradual — 38% at dL .042, 10% at dL .088, 1% at dL .283 — and a ground at L.83 against one at L.92
  is genuinely ambiguous and an entirely plausible design. **It would be false to claim no ground
  will ever sit there.** So the system states a constraint instead: every ground sits in the band
  the shipped palettes occupy (L .920 to .962), and **one proposed outside REOPENS the separation
  question rather than inheriting an answer.** `theme-contrast` section L enforces it and fails by
  name, because the alternative is a mid-band ground being silently judged under a floor calibrated
  for a band it is not in.

- **⚠ AND THE MODEL UNDERNEATH ALL OF THIS IS UNRESOLVED. SAY SO RATHER THAN PICKING A WINNER.**

    OKLab   a 60 degree rotation at chroma .020 is dE 0.0200 at EVERY lightness — L is irrelevant
    sRGB    the same rotation emits 15.68 units at L.920 and 10.30 at L.170 — 34% less signal

  A hue floor stated in DEGREES rests on OKLab's uniformity. **That claim is contradicted by an
  observation this project made BY LOOKING** — the favicon's two candidate grounds and the two PWA
  splash grounds are both invisible in hue, and OKLab rates both ends identical to a mid-lightness
  ground at the same chroma. **A model that contradicts something someone saw is wrong about
  something, and here the render outranks the reasoning.**

  **BUT THAT DISQUALIFIES OKLab WITHOUT CROWNING sRGB**, which is device space and whose 34% is not
  a perceptual claim either — it merely agrees with the observation, which is weak evidence and not
  none. **So the question is open, and every ruling built on it is written to hold under either
  model.** Section L asserts band MEMBERSHIP, which is true whichever is right.

- **⚠ THE PALETTE COUNT IS BOUNDED BY THE SEPARATION FLOOR, AND THE TWO ARE ONE DECISION.** Seven
  hues on a circle sit **51.4 degrees apart at perfect spacing**, so seven palettes and D12's 60
  degree ground floor **cannot both be true at ANY placement**. Cream, harbour and orchid are
  already placed unevenly, so exactly two more fit and both shipped ones land EXACTLY on 60.
  **FIVE REAL PALETTES IS THE CEILING THIS FLOOR IMPLIES.** Whoever wants a sixth is choosing to
  lower the floor, and `theme-contrast` D12d is where that gets written.

  **⚠ AND THE TIGHTEST ACCENT PAIR IS 31.3 DEGREES — TRUE, AND MISLEADING AS A MEASURE OF ROOM.**
  `harbour` h165.3 and `fern` h134 sit 1.3 degrees above D12d's floor, which reads as almost none.
  **Measured in perceptual distance it is 91.5 against a 47.2 reference — nearly double.** Accents
  carry roughly SEVEN TIMES the chroma of grounds, and separation scales with chroma, so degrees
  understate accent room as badly as they overstate ground room. **Do not read the degree figure as
  the space available**; it is the gate's unit, not the eye's.

  **⚠ AND DEGREES IGNORE CHROMA AND LIGHTNESS, WHICH COSTS IN THE OTHER DIRECTION ON GROUNDS.** Two
  of the ten shipped ground pairs deliver LESS than 60 degrees was calibrated to buy — both cerise,
  whose ground chroma is forced to 0.016 by the gamut rather than chosen. They are safe only because
  the lightness ladder covers the gap, which is **luck rather than rule**. `theme-contrast` D12 names
  the trigger for changing units: a future palette whose ground chroma is forced low again.

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

  **⚠ AND ITS FIRST RUN FOUND THE SHIPPED SITE — CLOSED IN `ea87038`, AND THE PRESENT TENSE HERE WAS
  STALE FROM THAT COMMIT ONWARD.** This read *"Harbour's `accent-500` **is** 60.7 outside sRGB and
  **has painted clamped** since it shipped"*, offering `THEME_OG.harbour.accent` at `#007e5b` as a
  witness whose red channel of exactly zero IS the clamp. **Every word was true and none of it is
  now.**

  Measured across all nine palettes and every one of their 450 tokens, **zero sit outside sRGB.**
  Harbour's three offenders were re-expressed to the values they were already painting —

      accent-500  oklch(52.0% 0.12  168) +60.7 out  ->  oklch(52.5% 0.110 165.3)    +0.25
      accent-600  oklch(43.0% 0.11  168) +64.3 out  ->  oklch(43.9% 0.094 163.7)    +0.46
      glow-web    oklch(48.0% 0.115 205) +286  out  ->  oklch(49.44% 0.0852 209.0)  +0.00

  — all three inside `CLIP_EPSILON`, and **zero pixels moved**, which is what makes it a declaration
  repair rather than a colour change. `#007e5b` is still harbour's accent and has stopped being a
  witness to anything. It is now simply what the declaration says.

  **⚠ AND THE STALENESS NEARLY BOUGHT A CAVEAT THAT WOULD HAVE BEEN FALSE.** #515 publishes every
  token as OKLCH and read this entry to decide whether the page must warn that an authored value and
  a painted value can differ. **On this text, yes. Measured, there is nothing to warn about.** A
  fixed hazard left in the present tense is worse than one never recorded, because nobody re-derives
  a hazard and the warning it buys reads as rigour. Fourth carried claim in this file to expire
  unnoticed, second to nearly direct work.

- **⚠ THE GROUND-CHANGE TEST REFUTES *SIGNATURE* CLAIMS AND CANNOT TOUCH *DEPICTION* CLAIMS.** The
  cursor, the loader and the hero auras were ruled signature — *this IS the design* — and a second
  palette refuted all three, because a claim about IDENTITY is exactly what a moving ground tests.
  The process diagram's tan fills and `.ab-tint`'s warm wash read equally foreign on cerise and fern
  and **hold anyway**, because they are ruled `artwork-by-file`: the fills depict somebody else's
  interface and the tint composites over a photograph. **A claim about SUBJECT does not depend on
  the ground.** Knowing which kind of argument an exclusion makes tells you in advance whether a new
  theme can overturn it — so read the `test:` field before re-litigating an entry that merely looks
  wrong on a new palette.

- **⚠ `mutate.mjs`'s SNAPSHOT COVERS THE FILES YOU ALREADY EDITED, NOT THE ONES THE MUTATION WILL
  DIRTY — AND THAT IS BACKWARDS FROM HOW IT READS.** `dirtyFiles()` captures work in progress, so a
  mutation to a file that was **CLEAN** at snapshot time was never restorable, and `--restore`
  printed "restored N file(s)" regardless. **It only ever worked when the mutated file happened to
  be one you had already edited that session — SO IT ONLY EVER WORKED BY COINCIDENCE**, which is why
  five rounds of mutation testing across four PRs never exposed it. **Sixth defect in this one
  mechanism**, which is the argument it was built to make: a safety net that restores the wrong
  state is worse than an absent one, because it is trusted. Fixed in #379 by recording the clean set and
  reverting exactly those with `git checkout` — safe by construction, because clean at snapshot
  means HEAD held the intent. **Read `git status` after every restore anyway**; the tool reporting
  success is not evidence the tree is right.

- **⚠ A THREE-DIGIT PR REFERENCE IS LEXICALLY A VALID HEX COLOUR.** `#379` in a CSS comment made a
  new gate report a colour literal — correctly, about a number. **Every note in this repo cites PR
  numbers** — **a convention of the prose collided with a colour matcher.** Any matcher run over CSS
  must strip comments first. `colour-census` was **immune only by accident**: it strips them at its
  line 120 for an unrelated reason, and that happened to cover this. **A defence held for a different
  purpose is not a defence anyone chose**, and the next matcher will not inherit it.

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

- **⚠ A COLLECTION IS DONE WHEN SOMEBODY HAS DRIVEN IT, AND THAT CLAIM NOW HAS A FILE.** The rule
  was written down for arcs and nothing recorded whether it was followed, so it was followed when
  somebody remembered. `docs/collection-exercises.yaml` holds the driven runs and
  `ralph/tests/collection-exercise.mjs` refuses a claim that has gone stale.

  **AN ENTRY IS EVIDENCE RATHER THAN A TICK.** The messages are copied off the screen — a paraphrase
  is refused, because "it showed an error" is what a real `Something went wrong` was reported as, and
  it cost three prompts. The sha is what PRODUCTION WAS SERVING, read from the deployment list, and
  it must resolve and be an ancestor of `main`, because a shape check cannot catch a fiction. The
  widths must straddle `INSPECTOR_FOLD_PX`, since below it the shell passes no inspector and a
  single-width run cannot see the fold defect whichever width it picks.

  **⚠ AND AN ENTRY EXPIRES WHEN THE COLLECTION'S WRITE PATH MOVES.** A claim about a build that has
  since changed reads exactly like coverage while being about a program nobody ran. **The record is
  currently EMPTY of real entries and carries one fixture**, which is the honest state — writing four
  from memory is the fabrication this file deletes on sight.

- **Admin surfaces sit outside the `(portfolio)` route group.** `app/studio` lives outside it, so it carries no site chrome, sets page-level noindex plus a robots disallow, and is owner-gated in middleware. Any new internal or admin surface follows the same placement.

## Proof and verification

- **⚠ A SYNTAX ERROR SHIPPED TO MAIN UNDER 3100 GREEN ASSERTIONS, BECAUSE NOTHING IN CI LOADED THE
  FILE.** `ralph/mutate.mjs` became unparseable — a multi-line string pasted into a
  `console.log("…")` — and every gate stayed green, because `run.mjs` runs the SUITES and the
  mutation harness is an operator tool that no suite imports.

  **⚠ AND IT WAS A COMMENT-ONLY EDIT MADE AFTER THE PROOF.** The full loop had been run end to end
  and worked: snapshot, edit, `KILLED`, revert, restore, clean tree. The hint text was then changed
  and never re-run. **"Re-run after the LAST edit" is a rule this file states, and the edit that
  broke it was the one that looked too small to re-check.**

  **THE SECOND RULE IT IGNORED IS THE SHARPER ONE: A GREEN SUITE SET SAYS NOTHING ABOUT A FILE NO
  SUITE LOADS.** Before trusting a green, ask what it actually ran — the same question that found
  `upstream` skipped by name, and `parity` and `studio-type` before it.

  **THE REPAIR IS ONE ROW AND IT WOULD HAVE CAUGHT IT: `node --check`.** `ralph/tests/mutate-harness.mjs`
  parses the harness, invokes it to prove it reaches its own usage message rather than dying during
  load, and exercises its four refusals against the real binary. Proved by reintroducing the exact
  break — four rows go red.

  **⚠ AND IT STOPS AT THE REFUSALS, DELIBERATELY.** Each one exits before touching a file, so the
  suite can run the real tool without mutating the tree. The apply-and-revert round trip is proved by
  hand and recorded instead, because a suite that failed midway through it would leave the repository
  dirty for every gate after it. **What belongs in CI is the half that cannot damage anything.**

- **⚠ `--restore` ROLLED BACK REAL WORK AND `git status` SHOWED NOTHING WRONG, BECAUSE A FILE COUNT
  IS NOT A CONTENT CHECK.** A snapshot was taken, two functions were then added to a leaf and wired
  into a component, and a later `--restore` — reached for as tidying at the end of a mutation batch
  — put the tree back to the snapshot and **took both functions and all three call sites with it.**

  **THE RECORD ALREADY SAYS `--restore` CONSUMES ITS SNAPSHOT AND TO SNAPSHOT BEFORE EACH MUTATION.
  THAT IS NOT THE NEW HALF.** The new half is that the check performed afterwards was
  `git status --short | grep -c "^ M"` — **six, exactly as before, because the files were still
  modified, just to an earlier version.** A count is invariant under the damage.

  **⚠ AND THE FAILURE SURFACED THREE STEPS LATER AS A SYNTAX ERROR IN AN UNRELATED SUITE** — an
  import of a name that no longer existed — which reads as a broken mutation rather than as lost
  work. Two mutations were diagnosed as instrument problems before the cause was found.

  **THE RULE THAT WOULD HAVE CAUGHT IT: COMMIT BEFORE A MUTATION BATCH, NOT SNAPSHOT.** A commit
  makes the recovery `git diff` rather than memory, and makes `--restore` harmless. The snapshot
  mechanism is for an operator's uncommitted work in progress; using it as the safety net for work
  that is finished is using it against its own design.

- **⚠ A PROBE FOR A CAPITALISED PATH OVERWRITES THE REAL PAGE'S BUILD OUTPUT ON macOS, SO THE PROBE
  MANUFACTURES THE FAILURE IT THEN REPORTS.** Verifying that `/palettes/[slug]` refuses an unknown
  slug, `/palettes/Sapphire` returned **200** — the `/work/<slug>` shape exactly, and it is not a
  route defect.

  **BOTH HALVES ARE ONE MECHANISM AND THE SECOND IS THE DANGEROUS ONE.** The filesystem is
  case-insensitive, so `.next/server/app/palettes/Sapphire.html` resolves to `sapphire.html`.
  Requesting the capitalised path made Next render an error page and **write it to what the
  filesystem considers the same file** — so `sapphire.html` became `<html id="__next_error__">` and
  `rendered-theme` A2 then failed naming that page. **The check was reporting damage the check's own
  setup had caused**, and on a clean build with no capitalised request all nine are real pages.

  **THE DISTINGUISHING EVIDENCE WAS CHEAP: `/palettes/NOPE` 404s.** It has no case-variant on disk,
  so the difference is the filesystem rather than the routing. `fallback: false` is correctly set in
  the prerender manifest, which is the thing worth checking and the thing `#203` was about.

  **⚠ LINUX IS UNVERIFIED HERE AND MUST BE SAID THAT WAY.** There is no case-sensitive host in this
  environment. The MECHANISM is established; whether production behaves differently is not, and
  assuming either way would be the wrong-subject defect in a new costume.

  **THE PRACTICAL FORM: a probe that writes to the build output is not a read.** `next start` serves
  and CACHES, so any request made while diagnosing can change what the next gate reads. Stop the
  server before running a suite that reads `.next`, and never diagnose a build from a tree a probe
  has been served from.

  **⚠ AND IT HAS A SECOND INSTANCE, SO IT IS A MECHANISM RATHER THAN AN ANECDOTE: A SERVER THAT IS
  SERVING IS ALSO WRITING.** A build run while `next start` was still up emitted a fourth CSS chunk,
  `app/(portfolio)/page.css`, nested one level below the flat directory every CSS union figure in
  this arc had been computed over — a denominator computed inside a walk that could not see its own
  boundary, arriving from the SERVER rather than from the walk. Clean builds of both sides emit
  three files, so the earlier figures stood. **That was established by rebuilding BOTH sides, not by
  assuming the baseline held**, and rebuilding both is the only step that separates a real change
  from a contaminated one. `PORTABLE.md` rule 36 carries the portable half.

- **⚠ A GATE THAT CANNOT RUN IS NOT A GATE, AND `upstream` A1 SAT SILENT WHILE THE DEFECT IT
  DESCRIBES WAS COMMITTED.** A `docs:` commit sat unpushed on local `main`, a gate-repair branch was
  cut from it, and the PR opened with **two files instead of one** — costing a rebase and a
  force-push over an already-open PR. `upstream.mjs` A1 exists for exactly this, is correct, and is
  **network-bound**, so `ralph/run.mjs` skips it by name. **Same family as `parity` and
  `studio-type`: a by-hand gate is not a closed gate until something runs it.**

  **⚠ AND A1's OWN PREDICATE COULD NOT BE THE FIX.** It asserts local `main` is not ahead of
  `origin/main`, which is **false on every legitimate push of `main`** — including the push that
  finally sent that very commit. **A gate whose common failure is benign is one people learn to
  skip**, which `.githooks/pre-push`'s own header already argues. The narrowed predicate is the one
  that is never legitimate: **pushing a branch that is not `main` while local `main` is ahead of
  `origin/main`.**

  It lives in the **hook, not in `run.mjs`** — ralph stays offline-runnable, which is why `upstream`
  is skipped there in the first place. **A failed fetch reports UNRUN rather than passing**, A0's
  posture: a stale `origin/main` makes `main` look MORE ahead, never less, so the fetch is what
  keeps it from crying wolf offline. Proved on four constructed states — fires on the defect and
  blocks **before** ralph, silent on a `main` push, silent on a feature push from a clean `main`,
  and UNRUN with the remote unreachable.

- **⚠ A MOVE IS NOT MOTION IF IT CHANGES WHAT IS WATCHING THE FILE.** Lifting the palette resolver
  from `ralph/tests/theme-contrast.mjs` to `lib/theme-contrast.ts` changed nothing about the code
  and two things about its audience. **Tailwind scans `lib` and not `ralph/tests`**, so three
  comments spelling an accent-text background utility no markup uses compiled that class into the
  **public bundle** — +58 raw bytes, caught by `css-comment-trap` A5. And **`tsc` and eslint watch
  `.ts` and not `.mjs`**, so a dead binding beside the usage map failed `no-unused-vars` within a
  minute of arriving, after however long of being indistinguishable from a live one.

  **⚠ THIS IS A NEW MEMBER OF THE COMMENT-TRAP FAMILY AND THE OTHERS DO NOT COVER IT.** Every
  earlier instance was a comment being WRITTEN, or a token being added or removed UNDER an existing
  comment. **Here the prose did not change — its file did.** So the trigger list is not only "run it
  when a token is added" and "run it after a deletion", it is also **run it when a file changes
  directory**, and check the lint reach at the same time.

- **⚠ CAPTURE THE EXIT CODE BEFORE ANY PIPE TOUCHES IT.** A pipeline's status is the LAST command's,
  so `node ralph/run.mjs | tail -3 && git commit` gates on **`tail`**, which always succeeds. The
  gate exists, is wired to the wrong subject, and reports success — and a commit goes out on a red
  suite.

  **THIRD OCCURRENCE, AND THE FIRST WHERE THE MECHANISM WAS IN PLACE.** The earlier two were fixed by
  intention — remember to look — which is why they recurred. This one had the `&&` and lost it to a
  pipe. Use `node ralph/run.mjs > /tmp/r.txt 2>&1; echo $?` and read the code, or `set -o pipefail`.

  **It is the arc's own shape in a shell**: a check whose subject is not the one it appears to have.

- **⚠ TWO GROUND-WALKS DISAGREE BY A FACTOR OF TWO, AND GROUND-WALKING IS HOW EVERY CONTRAST FIGURE
  IN THIS PROJECT IS PRODUCED.** A sweep that composites through semi-transparent ancestors reported
  `text-subtle` at **2.60**; a walk that stops at the first opaque ancestor finds a ground on which
  it should measure about **5**. The usage map's grounds, the next-case rail's mix, the vessel's
  stack and section M's candidates all rest on one or the other.

  **⚠ THE TWO OUTCOMES ARE OPPOSITE AND BOTH ARE ACTIONABLE.** If the sweep is compositing a layer
  the walk skips, some findings were real and **some passes are false**. If the walk is right, the
  sweep has been **inventing failures**. Nobody knows which.

  **RECONCILE BY PRINTING THE LAYERS, NOT THE VERDICTS** — which element each stops at and what it
  composited on the way. A number from either is what misled all day, and both numbers are already
  known. **And reconcile on a node both instruments agree they are looking at**: a `startsWith` match
  found a `<strong>` while the sweep's row was a different node with the text "LTIMindtree ·
  Bengaluru", so the disagreement may be two correct answers about two elements.

- **⚠ SEVEN MEASUREMENTS PRODUCED AND SEVEN WITHHELD IN ONE SESSION, AND THREE WERE ABOUT THE SAME
  SIX ROWS — EACH SUPERSEDING THE LAST.** `reveal-sand`'s start state, then an un-migrated ground,
  then a ground that turned out to be correct. **Every one would have read as a finding.**

  **THE COMPONENT DID NOT GET HARDER; THE REPORTING GOT SLOWER** — and that is the only reason none
  of the three is in the record as fact. A wrong diagnosis costs a session; a wrong diagnosis written
  down as a cause costs however long it takes the next person to stop believing it.

- **⚠ SIX MEASUREMENTS WERE PRODUCED AND WITHHELD IN THE VESSEL IN ONE SESSION, EACH FOR A REASON THE
  PREVIOUS ONE TAUGHT — AND THAT IS THE POINT, NOT THE COST.** The tint's `N` against an assumed
  body, the shadow's 0.09×, the highlight's 76.0, a re-solve whose subject changed between runs, a
  closed-form solve against a non-linear blend, and an `N` curve whose instrument failed its own
  sanity check.

  **EVERY ONE OF THOSE SIX WOULD HAVE PASSED REVIEW. FOUR OF THEM RECONCILED WITH THEIR
  NEIGHBOURS.** They were internally consistent, checkable-looking, and produced by working
  instruments pointed one step to the side of the question.

  **The difference between this component's history and its present is not that the measurements got
  better — it is that they stopped being reported before they were understood.** Five earlier
  invalidations shipped as confident numbers and cost two arcs; the six above cost one session and
  nothing else. **Withholding is the cheaper half of that trade every time**, and it does not feel
  like it in the moment, which is why it is written here rather than left to judgement.


- **`/dev` harness routes are DEV-ONLY.** They 404 under `next start`, so any proof gate that needs a production build cannot use them. Production verification of studio UI requires a real authenticated login, so it is owner-only. State it as UNVERIFIED rather than routing around it. Prefer fixes that remove the dependency being tested, the way #177 set the nav label colour explicitly rather than relying on inheritance, so that a dev-only proof holds in production by construction.

## Writing rules

These rules apply to all site copy and all documentation written in this project.

No colons. No semicolons. No em dashes. No forward slashes.

Use plain sentence structure. If a sentence needs a colon to introduce a list, rewrite it so it does not. If two clauses feel connected by an em dash, split them into two sentences or use a conjunction. If a forward slash is joining two words, pick one or rewrite the phrase.
