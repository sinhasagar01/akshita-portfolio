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
- **The 61 dead line-heights, and the one change that would make them all live.** `cascade-public`
  counts 102 collisions outside `/studio`, and **61 of them are `line-height`** — a utility on an
  element whose unlayered rule sets the same property, so the utility draws nothing. Moving the
  unlayered element rules into `@layer base` fixes all 61 at once, because a layered rule loses to
  `@layer utilities` in the normal way. **One change, and a large visual change: 61 line-heights
  becoming live is 61 boxes moving.**

  **⚠ AND IT IS NOT "RESTORING INTENT", WHICH IS THE PART THAT MAKES IT RISKY.** Every one of those
  61 is currently inert, so the values were written and have never taken effect. Making them live
  applies numbers **nobody has ever seen render**. That is a larger claim than the three headings
  below, where a heading simply draws the wrong face — it needs measuring per site, not a sweep.
  Recorded with the number so it is not re-derived. Its own PR, not a corner of the typography arc.

- **Kaushan Script, the wordmark face. A brand decision, deliberately outside the typography arc.**
  The Source Serif and Work Sans swap replaces a display serif and a body sans. It does not touch
  either face that is literally cursive, so after that arc ships, the loudest cursive on the site
  is still there. Kaushan Script renders at seven sites, and two of them are the identity.

  | Site | What it draws |
  |---|---|
  | `globals.css` `.logo-sig` with `SiteHeader.tsx` | the wordmark "Akshita" in the nav, 29px, every page |
  | `SiteFooter.tsx` | "Akshita Singh", 42px |
  | `HeroCover.tsx`, twice | the watermark word behind each case-study hero |
  | `HeroSection.tsx`, `ProcessSection.tsx` | two inline-styled script words |

  **⚠ AND ONE SITE ASKS FOR IT AND DOES NOT GET IT, WHICH CORRECTS AN EARLIER VERSION OF THIS
  LIST.** The home page's single `h1` in `HeroSection.tsx` carries `font-script` and **renders
  Fraunces**, because the unlayered `h1` rule outranks the utility. Measured in the browser, not
  inferred. So the brand question is smaller than six sites plus a heading — the heading is
  already not cursive, and has never been. Making it cursive would be a change, not a
  restoration. `cascade-public` registers it.

  Caveat is the other cursive face and is a single component, the handwritten scrawl in
  `AnnotatedImage.tsx`. Changing either is a question about the brand rather than about the
  type system, which is why it is recorded here rather than folded in. **The typography arc
  finishing does not mean this was considered and declined. It means it was never in scope.**

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

- **`lib/studio/data.ts` is the single READ seam for /studio, `lib/studio/commit-site-settings.ts` is the write seam.** All studio reads go through `getStudioData()`, a `cache()` wrapper over `getHomePageData` plus the draft-branch state, draft-preferring for settings. Writes go through the owner-gated commit layer, with the pure transforms in `lib/studio/*-format.ts`.

- **Keystatic is schema-only.** `keystatic.config.ts` drives the reader (`createReader`, `createGitHubReader`) that parses all content, and `lib/case-studies/sections-raw.ts` derives the 16 block-kind union from it, so the config and `@keystatic/core` are load-bearing and stay. There is no Keystatic editor route any more.

- **The studio's GitHub target is configurable, and dev should not point at production.** `STUDIO_GITHUB_REPO` and `STUDIO_BASE_BRANCH` select the repo and the published branch, defaulting to the production repo and `main`. Every write route no-ops unless `STUDIO_WRITE_MODE=github`, so github mode is the only way to exercise the write paths, and it must be aimed at a fork or scratch repo when developing. `BASE_BRANCH` is the single definition of the published branch for both the draft compares and the publish merge, so reads and writes cannot disagree. See `.env.local.example` for the setup.

- **Admin surfaces sit outside the `(portfolio)` route group.** `app/studio` lives outside it, so it carries no site chrome, sets page-level noindex plus a robots disallow, and is owner-gated in middleware. Any new internal or admin surface follows the same placement.

## Proof and verification

- **`/dev` harness routes are DEV-ONLY.** They 404 under `next start`, so any proof gate that needs a production build cannot use them. Production verification of studio UI requires a real authenticated login, so it is owner-only. State it as UNVERIFIED rather than routing around it. Prefer fixes that remove the dependency being tested, the way #177 set the nav label colour explicitly rather than relying on inheritance, so that a dev-only proof holds in production by construction.

## Writing rules

These rules apply to all site copy and all documentation written in this project.

No colons. No semicolons. No em dashes. No forward slashes.

Use plain sentence structure. If a sentence needs a colon to introduce a list, rewrite it so it does not. If two clauses feel connected by an em dash, split them into two sentences or use a conjunction. If a forward slash is joining two words, pick one or rewrite the phrase.
