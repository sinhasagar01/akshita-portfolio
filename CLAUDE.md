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
- **The 58 dead line-heights, and the one change that would make them all live.** `cascade-public`
  counts 99 collisions outside `/studio`, and **58 of them are `line-height`** — a utility on an
  element whose unlayered rule sets the same property, so the utility draws nothing. Moving the
  unlayered element rules into `@layer base` fixes all 58 at once, because a layered rule loses to
  `@layer utilities` in the normal way. **One change, and a large visual change: 58 line-heights
  becoming live is 58 boxes moving.**

  **⚠ AND IT IS NOT "RESTORING INTENT", WHICH IS THE PART THAT MAKES IT RISKY.** Every one of those
  58 is currently inert, so the values were written and have never taken effect. Making them live
  applies numbers **nobody has ever seen render**. That is a larger claim than the three headings
  below, where a heading simply draws the wrong face — it needs measuring per site, not a sweep.
  Recorded with the number so it is not re-derived. Its own PR, not a corner of the typography arc.

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

- **`lib/studio/data.ts` is the single READ seam for /studio, `lib/studio/commit-site-settings.ts` is the write seam.** All studio reads go through `getStudioData()`, a `cache()` wrapper over `getHomePageData` plus the draft-branch state, draft-preferring for settings. Writes go through the owner-gated commit layer, with the pure transforms in `lib/studio/*-format.ts`.

- **Keystatic is schema-only.** `keystatic.config.ts` drives the reader (`createReader`, `createGitHubReader`) that parses all content, and `lib/case-studies/sections-raw.ts` derives the 16 block-kind union from it, so the config and `@keystatic/core` are load-bearing and stay. There is no Keystatic editor route any more.

- **The studio's GitHub target is configurable, and dev should not point at production.** `STUDIO_GITHUB_REPO` and `STUDIO_BASE_BRANCH` select the repo and the published branch, defaulting to the production repo and `main`. Every write route no-ops unless `STUDIO_WRITE_MODE=github`, so github mode is the only way to exercise the write paths, and it must be aimed at a fork or scratch repo when developing. `BASE_BRANCH` is the single definition of the published branch for both the draft compares and the publish merge, so reads and writes cannot disagree. See `.env.local.example` for the setup.

- **The public palette is CONTENT, and the theme name has one owner per direction.** `theme` in `site-settings.yaml` is read through `resolveTheme()` in `lib/theme.ts`, which fails closed to `cream` silently, and written through `sanitizeSiteSettingsPatch`, which rejects an unknown value loudly. That asymmetry is deliberate. A visitor never sees an unthemed page and an author is never left wondering why their choice did nothing. Theme names live on three surfaces that cannot import each other (`lib/theme.ts`, `THEME_METRICS`, `SETTINGS_THEME_VALUES`) because ralph loads all three raw, so `ralph/tests/theme.mjs` enforces their agreement. `cream-verify` is a VERIFICATION FIXTURE, not a design, and the gate's exactly-two-entries assertion is its deletion trigger. Adding a real second theme means deleting the twin in the same commit.

- **⚠ A SUBSTITUTION DEFINED BY VALUE CROSSES EVERY BOUNDARY DEFINED BY SCOPE**, because a value has no idea where it lives. A blanket `ink-950` conversion in #332 caught three `--studio-lift-*` tokens and would have made the studio's shadows follow the public theme — the freeze violation #323 exists to prevent. Third instance this session, after #314's hairline rename and 6a's census. **Any sweep over a colour, a token or a utility must be bounded by DIRECTORY before it is bounded by PATTERN.** `studio-ink` C10 caught this one, which is also the first time the freeze actively stopped something rather than merely holding.

- **ARTWORK IS EXCLUDED BY WHAT THE FILE IS FOR, NOT BY WHERE THE COLOUR SITS.** `ProjectCardSvgs.tsx` holds 77 of the site's 82 SVG colour attributes and is excluded whole, because it is an illustration file. The case-study watermarks were converted in the same breath, because they are interface drawn decoratively. **The test is the file's purpose, not the syntax the colour is written in** — a `fill=` in an illustration and a `fill=` in a UI icon are different questions.

- **⚠ ASKING WHAT THE NEXT BLIND SPOT WOULD LOOK LIKE IS ITSELF A SEARCH.** `theme-contrast`'s E1 declared its subject and stopped, and its completeness claim was true of `--color-*` and false of the page. `colour-census` declares its subject AND what falls outside it — and writing that second half found a real fourth route (`manifest.ts`'s PWA splash and address-bar colours). **A gate that proves a set complete proves nothing about what is outside the set, and the danger is that it reads like it does.** Every census here states its populations and names the shape of the one it cannot see.

- **⚠ ANY GATE READING GENERATED OUTPUT ASSERTS HOW MANY SUBJECTS IT FOUND.** A gate over a built bundle, prerendered HTML or a derived token map passes trivially when its subject is empty — the output moved, the scan matched nothing, and zero failures reads as success. Three instances this arc: `studio-ink-contrast`'s S4 (a token silently absent from its map), C-9's exclusion, and `rendered-theme`'s page count. **Each would have passed on an empty subject.** State the count and assert a floor, so a shrunken subject fails rather than agreeing.

- **⚠ A DEFERRAL WITHOUT A NAMED OWNER IS A DEFERRAL TO NOBODY.** `theme`'s E-section says the build-level fact "belongs to a snapshot diff rather than a regex over `.next`" — correct, and it named no check. #326 then proved that fact once, by hand, and nothing asserted it again for twenty-one PRs. **A claim can fall between two correct scopes: from inside either, the gap is invisible, because the other side appears to have it.** This is not a mis-measurement and not an exclusion — the claim simply had no owner. When a gate's comment defers a fact to another check, NAME THAT CHECK.

- **⚠ `mutate.mjs` CONFIRMS THE SOURCE CHANGED AND CANNOT CONFIRM THE SUBJECT DID**, and the subject is sometimes the bundle and sometimes the rendered DOM. Two instances: a mutation to `globals.css` that needed a rebuild before `colour-census` could see it, and `data-theme` moved onto a React component that never forwards it to the DOM — **the attribute simply never appeared, so the assertion had nothing to find and reported SURVIVED**. A mutation that lands in JSX and not in the DOM looks exactly like a mutation the gate withstood. **Rebuild first, and check the mutation reached the subject rather than only the file.**

- **⚠ A CANDIDATE PALETTE IS MEASURED FROM SCRATCH, NEVER DERIVED FROM A SHIPPED ONE.** Cream sits inside 0.1 of **five** floors and Harbour of **three**, so both ship with almost no margin — which is not a defect, it is what "ground plus one step" means as a relation. The consequence is that copying either ladder and then moving a hue produces a palette the instrument REFUSES, which is exactly what happened to Harbour's first two drafts against the retired "ground lightness above roughly 85%" figure. **The two shipped palettes are evidence that no template exists, not the template.** This sits beside the render protocol for the same reason that one is here rather than only in `docs/STATE.md`: it is the fact a designer reaching for a starting point would most want to skip, and a convention is read before work begins while a record is read when someone goes looking.

- **A CANDIDATE PALETTE IS JUDGED BY THE INSTRUMENT AND THEN BY THE RENDER, IN THAT ORDER, AND NEITHER STEP IS OPTIONAL.** Run `ralph/tests/theme-contrast.mjs` first — it answers whether every token PAIR clears its floor, which is the narrow claim. Then set `theme:` in `content/site-settings.yaml`, render the FULL home page and the four signature components (the work card, the glass nav, the hero ground, the Pearl Smoke vessel), and look. Only then judge. **`SHIPPABLE` is not "the site looks right"** and never was. Two palettes have now found defects no gate could reach: the dark render found the glass nav and the vessel are structurally light-ground at 1.15 and 1.20, and Harbour found `SectionHeading`'s two `tone` branches disagreeing on the same page. The second was invisible on cream because both branches looked the same there, which is the general rule — **a single-theme site cannot reveal an inconsistency between two ways of producing the same colour.** Revert `theme:` to `cream` before committing.

- **Admin surfaces sit outside the `(portfolio)` route group.** `app/studio` lives outside it, so it carries no site chrome, sets page-level noindex plus a robots disallow, and is owner-gated in middleware. Any new internal or admin surface follows the same placement.

## Proof and verification

- **`/dev` harness routes are DEV-ONLY.** They 404 under `next start`, so any proof gate that needs a production build cannot use them. Production verification of studio UI requires a real authenticated login, so it is owner-only. State it as UNVERIFIED rather than routing around it. Prefer fixes that remove the dependency being tested, the way #177 set the nav label colour explicitly rather than relying on inheritance, so that a dev-only proof holds in production by construction.

## Writing rules

These rules apply to all site copy and all documentation written in this project.

No colons. No semicolons. No em dashes. No forward slashes.

Use plain sentence structure. If a sentence needs a colon to introduce a list, rewrite it so it does not. If two clauses feel connected by an em dash, split them into two sentences or use a conjunction. If a forward slash is joining two words, pick one or rewrite the phrase.
