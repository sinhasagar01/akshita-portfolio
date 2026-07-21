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

- Phase 0: repo, Next.js, Tailwind, Vercel, domain, fonts, design tokens
- Phase 1: design system, layout primitives, motion and scroll baseline
- Phase 2: home page
- Phase 3: case study template wired to Keystatic, all spine block types built
- Phase 4: content pour and cleanup for all four case studies
- Phase 5: performance, accessibility, motion tuning, launch

## Production domain and hosting

The production domain is akshitas.com. The canonical host is www.akshitas.com. The apex akshitas.com redirects to the www host with a 308 configured in Vercel, and the www host is the primary.

Both `metadataBase` in `app/layout.tsx` and `NEXT_PUBLIC_SITE_URL` in `.env.local` must be set to `https://www.akshitas.com`. These two values must always point to the same host. Swapping one without the other causes the canonical URL and share image URLs to resolve against a host that Vercel then redirects away from. On Vercel, the production environment variable `NEXT_PUBLIC_SITE_URL` must also be set to `https://www.akshitas.com`.

## Open items

- Real outcome numbers for Fosfor AI and Fosfor Data Profiling
- Confirmation on the light editorial direction before tokens are set

## Conventions (must hold across sessions)

- **Tailwind v4 component styling.** The bracket-bare rule is in Stack above, do not restate it. Beyond it, model new components on `components/case-study`, which uses clean bare utilities. Do not copy `components/blocks` or `components/sections`, which still use the broken bracket-bare form. Hairlines use `border-ink-950/8`. Card surfaces use `bg-cream-50`, `bg-cream-100`, or `bg-cream-200`. The page canvas behind cards uses `bg-canvas`. Both `bg-canvas` and `border-border` are real tokens, the case-study convention just prefers the explicit ink and cream utilities for hairlines and card surfaces.

- **Mobile breakpoint is 1024px, Tailwind `lg`.** The whole site goes mobile at once at `lg`. globals.css switches at max-width 1023 and min-width 1024. Never default to `md` for a two-column to stacked transition.

- **/studio is the sole editor. It edits every content group inline and Keystatic's editing UI is retired.** Panels save to a draft branch through the owner-gated `/api/studio/save-draft` route (and the dedicated upload routes for images), and Publish merges the draft into main through `/api/studio/publish`, both in github mode only. Hero, About, Process, Links, and Skills each have a panel; Experience and Projects add, reorder and delete entries; the site photo, hero images, and block images upload through /studio. Do not add a new write surface without an explicit decision, and do not re-add the Keystatic UI.

- **A case study has ONE editor at ONE URL.** `/studio/projects` is the index (order, add, remove) and `/studio/projects/<slug>` is the editor, where details are a strip and the sections board and canvas own the width. The former `[slug]/body` route was a second copy of the editor that nothing linked to, and being unreachable is exactly how it drifted — it kept receiving fixes the real editor never got, until every section composed the wrong way. Do not reintroduce a second editing surface for the same content.

- **The canvas and the public page must render identically.** They share `SectionRenderer`, differing only in the `editable` and `noReveal` flags, and those flags may ADD affordances but must never move or resize a box. An editable-only wrapper element is the failure mode to avoid: put markers and overlays on an element that is already positioned. `/dev/parity/<slug>` plus `ralph/tests/parity.mjs` checks this — run it after touching anything under `components/case-study`.

- **`lib/studio/data.ts` is the single READ seam for /studio, `lib/studio/commit-site-settings.ts` is the write seam.** All studio reads go through `getStudioData()`, a `cache()` wrapper over `getHomePageData` plus the draft-branch state, draft-preferring for settings. Writes go through the owner-gated commit layer, with the pure transforms in `lib/studio/*-format.ts`.

- **Keystatic is schema-only.** `keystatic.config.ts` drives the reader (`createReader`, `createGitHubReader`) that parses all content, and `lib/case-studies/sections-raw.ts` derives the 14 block-kind union from it, so the config and `@keystatic/core` are load-bearing and stay. There is no Keystatic editor route any more.

- **The studio's GitHub target is configurable, and dev should not point at production.** `STUDIO_GITHUB_REPO` and `STUDIO_BASE_BRANCH` select the repo and the published branch, defaulting to the production repo and `main`. Every write route no-ops unless `STUDIO_WRITE_MODE=github`, so github mode is the only way to exercise the write paths, and it must be aimed at a fork or scratch repo when developing. `BASE_BRANCH` is the single definition of the published branch for both the draft compares and the publish merge, so reads and writes cannot disagree. See `.env.local.example` for the setup.

- **Admin surfaces sit outside the `(portfolio)` route group.** `app/studio` lives outside it, so it carries no site chrome, sets page-level noindex plus a robots disallow, and is owner-gated in middleware. Any new internal or admin surface follows the same placement.

## Writing rules

These rules apply to all site copy and all documentation written in this project.

No colons. No semicolons. No em dashes. No forward slashes.

Use plain sentence structure. If a sentence needs a colon to introduce a list, rewrite it so it does not. If two clauses feel connected by an em dash, split them into two sentences or use a conjunction. If a forward slash is joining two words, pick one or rewrite the phrase.
