# Build Progress

Read this file at the start of every session before doing anything else.

## Phase 0 Setup (done)

- [x] Git repo initialised with CLAUDE.md and docs
- [x] Next.js 15 with App Router and TypeScript
- [x] Tailwind v4 with design tokens in app/globals.css
- [x] Free variable fonts configured via next/font/google
- [x] Keystatic CMS in local mode with full case study block schema
- [x] Placeholder home page and Keystatic dashboard route
- [x] TypeScript clean, production build passing
- [x] Initial commit on master

### What was decided in Phase 0

**Fonts.** Fraunces as display serif with the SOFT, WONK, and opsz variable axes, and DM Sans as body text with the opsz axis. Both are downloaded at build time by next/font/google and self-hosted. No runtime requests go to Google Fonts. Kaushan Script was later added for the signature, and Caveat for occasional doodle accents. Fonts sit behind CSS custom properties so swapping is a one-line change.

**Palette.** Warm cream background at oklch(98.5% 0.012 80), warm near-black ink text at oklch(14% 0.018 60), and a muted terracotta rust accent at oklch(56% 0.14 42). All values use oklch. Every token lives in the @theme block in app/globals.css as a CSS custom property.

**Keystatic API corrections.** The route handler is exported from @keystatic/next/route-handler, not the api path. The dashboard page uses the named export makePage(config) from the ui app path, not a default export. There is no withKeystaticConfig wrapper in Keystatic v0.5, so next.config.ts is a plain NextConfig with no Keystatic import.

**Dev port.** Port 3000 is occupied on this machine by the job-fit-extension dev server. Run the portfolio dev server on 3457 with npm run dev -- -p 3457. This is the port used for all browser checks. (Earlier notes said 3456, 3457 is the one in active use, keep them aligned.)

---

## Phase 1 Design system and motion baseline (done)

- [x] Layout primitives (container, grid, section wrapper)
- [x] Site header shell with navigation
- [x] Site footer shell
- [x] Lenis smooth scroll initialised in a Client Component
- [x] Motion spring baseline for reveals
- [x] GSAP ScrollTrigger wired up for heavier choreography
- [x] Reduced motion respected throughout

---

## Phase 2 Home page (done)

- [x] Hero section with display serif and hero photo
- [x] Project grid with ProjectCard component
- [x] About section with bio copy and photo, anchored to /#about
- [x] Process section with four Discover Define Develop Deliver steps
- [x] Experience timeline with date-range rows
- [x] Skills section with category groups
- [x] Contact section with email, resume, and social links
- [x] All sections return null gracefully when CMS data is absent
- [x] Nav anchor links and scroll-mt offsets to clear the sticky header
- [x] TypeScript clean, production build static

Page order. Hero, Work, About, Process, Experience, Skills, Contact. (Note, the home sections were heavily reworked in Phase 5 below, and Experience and Skills were later removed from the nav while keeping their sections on the page.)

---

## Phase 3 Case study template (done)

- [x] Case study page route wired to Keystatic reader
- [x] All fifteen block types built (hero, summaryGrid, impactNumbers, context, problem, goals, processSteps, keyInsights, solutionReveal, guidedDesignStep, imageGallery, comparison, quote, reflection, closingLine)
- [x] Dynamic route at app/projects/[slug]/page.tsx with generateStaticParams
- [x] getCaseStudyData resolves async document fields before returning typed data
- [x] CaseStudyBlockRenderer dispatches via a switch on block discriminant
- [x] ProjectCard links to the project route

---

## Phase 4 Content (done)

- [x] boAt Crest case study poured and cleaned
- [x] Fosfor AI case study poured and cleaned
- [x] Fosfor Data Profiling case study poured and cleaned
- [x] Elevate ONE View case study poured and cleaned
- [x] Experience entries entered
- [x] Skills entered
- [x] Site settings filled in

Still pending inside content. Real outcome numbers for Fosfor AI and Fosfor Data Profiling, and the real portrait plus real screen exports uploaded through Keystatic.

### Content gaps (surfaced by /studio)

- All 5 experience entries have empty descriptions. Write or decide to drop the field.
- 3 of 4 projects have no hero image (fosfor-ai, fosfor-data-profiling, elevate-one-view).
- Fosfor AI and Fosfor Data Profiling bodies are still poured-but-thin (real outcome numbers pending).

---

## Phase 5 Identity, navigation, footer, and interaction polish (this session)

### Shipped and confirmed

- [x] Unified section-heading glow system. Faint italic Fraunces title with a blurred glow behind, terracotta index, subtle subtext, reveal once on scroll-in, per-section warm and grey tones, variants kept in the component.
- [x] Reload-lands-on-Process scroll bug root-caused and fixed. Removed the built-in ScrollTrigger snap, gated the custom Lenis snap behind a real userScrolled ref, set manual scroll restoration before paint, added a loader scroll-lock guard. Page opens on the hero every reload.
- [x] Experience section redesigned to the featured-now layout. Current role in a warm glow block, compact previously list, acquisition notes as terracotta italic. Feature-card styling bug fixed and locations corrected to Bengaluru.
- [x] Logo redesigned to the Kaushan signature with a draw-on construction grid and a hover recolor.
- [x] Identity assets produced from the folded-ribbon mark. favicon.svg, app icons, apple touch icon, avatar, and the OG card. Icons on an ink tile for contrast, OG on cream using the signature lockup with the Ciao-free brand wordmark.
- [x] Programmatic-scroll fix. A shared scrollToTarget helper and isProgrammaticRef in the smooth-scroll provider, with the Process snap and the nav scrollspy gated on the flag, so nav clicks and back-to-top no longer get stuck in Process. Plan reviewed and approved with the safety-timer, no-regression, scrollspy-gate, and stepper-reconcile feedback folded in.

- [x] Skills hover background word (soft glow swap, warm word behind the pills).
- [x] Hero headline readability (upright Fraunces, fainter backdrop word).
- [x] Hero facet refinement (eyebrow, sparkle divider, outline active pill, scroll cue).
- [x] Custom cursor (terracotta dot with trailing ring, hover and input gating, reduced-motion fallback).
- [x] Footer rebuild (Ciao backdrop, Kaushan name, Designed by Me and Built by Sagar credit, aligned chip-and-label social grid, stacked live chip clock, Built in Bengaluru with love pulsing heart, back to top).
- [x] Header Resume CTA (text link with divider) and mobile circle-reveal burger menu with focus trap, scroll lock via Lenis, and reduced-motion fade.
- [x] Header fixes (burger hidden on desktop, burger morphs to a tappable X, Experience and Skills removed from nav, centered mobile menu links).
- [x] Hero facet tabs become a dot-grows-to-bar indicator below the mobile breakpoint, labelled tabs on desktop.
- [x] Footer credit line and local-time block hidden below the mobile breakpoint.
- [x] Work section mobile contained cards.
- [x] Hero mobile touch-swipe facet switcher with no auto-advance.

### Notes for this phase

**One mobile breakpoint.** Header burger, hero dots, and footer hides all swap at the same width. Confirm the real value in the header and reuse it everywhere so the site goes mobile all at once.

**Scrolls go through the helper.** Never call lenis.scrollTo directly. Route every programmatic scroll through scrollToTarget so the Process snap and scrollspy stay gated.

**Tune against real cream.** The section-heading and Ciao backdrop alphas are faint by design and were approximated on cream. Tune them in the browser against the real token.

---

## Phase 6 Performance, SEO, accessibility, and launch (open)

- [ ] Core Web Vitals passing on mobile and desktop
- [ ] Per-page titles and descriptions correct (site-level metadata and OG done, per-page still open)
- [ ] Custom share image per case study (site-level OG card done, per-study images still open)
- [ ] Semantic markup and real alt text on every image
- [ ] Keyboard-reachable navigation final pass
- [ ] Reduced motion final audit
- [ ] Contact form endpoint set (NEXT_PUBLIC_CONTACT_FORM_ENDPOINT still a placeholder)
- [x] metadataBase and NEXT_PUBLIC_SITE_URL wired to https://www.akshitas.com
- [x] Domain configured in Vercel, canonical host settled as www.akshitas.com with apex 308 redirect
- [ ] Production Keystatic mode switched to github

---

## Open items, the real blockers

- Domain is configured in Vercel. The canonical host is www.akshitas.com, with the apex redirecting to the www host. The remaining launch steps are the Keystatic github switch and the contact form endpoint.
- Real outcome numbers for Fosfor AI and Fosfor Data Profiling.
- Contact form endpoint (Formspree or Web3Forms) and the env var.
- Real portrait and real screen exports uploaded through Keystatic.
- Tune the faint heading and backdrop alphas against the real cream token.

---

## /studio read-only content dashboard (shipped)

Custom editorial dashboard at /studio. Read-only. It surfaces Reader-readable content and deep-links out to the exact Keystatic editor, and never writes. Sidebar and section-card layout. The mockup is docs/studio/studio-dashboard-mockup.html.

- Areas. /studio (Homepage map), /studio/projects, /studio/experience, /studio/skills, /studio/settings. All read through lib/studio/data.ts, a cache()-wrapped getHomePageData that is the single content-access seam.
- Deep-links via lib/keystatic-links.ts. Homepage Hero, About, and Process all resolve to the one siteSettings singleton, because Keystatic has no sub-item URLs. That is by design.
- Completeness signals (no hero image, no summary, no description) are derived from the list-item payload using falsy checks, so they catch both empty string and null.
- noindex, plus /studio/ in the robots disallow. Auth inherits /keystatic, which is none in dev.
- Excludes the otis-one-view orphan, so Projects shows 4.

## Open forks (named so they are not silently assumed)

1. Case-study body editing from /studio is split, and the split is the opposite of what a quick look suggests. Only boat-crest is bespoke. BESPOKE_SLUGS holds just "boat-crest". Its body is hand-authored in lib/case-studies/boat-crest.ts and renders through the literal route app/(portfolio)/projects/boat-crest/page.tsx, so the Keystatic projects item that the /studio card deep-links to is NOT what renders the live boat-crest page. Editing that item does nothing to the live boat-crest page. The other three (fosfor-ai, fosfor-data-profiling, elevate-one-view) are empty placeholder stubs in lib/case-studies and still render their poured bodies through the Keystatic [slug] route, so for them the /studio deep-link already reaches the live body. The open decision applies to boat-crest and any future bespoke study. Option A keeps the body in Keystatic so /studio deep-links work for free, which means not giving it the bespoke treatment. Option B builds custom inline editing for the bespoke TS bodies, see fork 4. Not yet scoped.
2. The three In code homepage sections (Hero facets, Process stage visuals, Contact form steps) are code-managed and shown as non-editable cards. They are the first candidates if and when we migrate hand-authored content into Keystatic.
3. /studio search is a non-functional placeholder. A client-side label filter is the near-term fast-follow. Search over field values needs a content index and is deferred.
4. /studio B, the inline editing write path, SHIPPED for the Hero group. Saves go through the owner-gated save-draft route to the draft branch and Publish merges the draft into main through the publish route, both in github mode, with the pure transform in lib/studio/site-settings-format.ts. The P1 fs write seam (lib/studio/save-site-settings.ts) was removed as superseded, dev editing happens in Keystatic. Remaining forks are image upload and the other field groups, see the multi-form draft accumulation blocker below.

## /studio prod-readiness blockers (before hosted editing ships)

- Gate /studio itself. It is ungated today, and in github mode it makes authenticated GitHub reads.
- Add caching to the per-request draft read. getStudioData hits the GitHub API per /studio request in github mode.
- Durable cross-instance login throttle. The in-memory one does not survive serverless cold starts.
- Set UPSTASH_REDIS_REST_URL + TOKEN in Vercel prod env, else the GH-7 login throttle falls back to per-instance in-memory in prod.
- /keystatic is dev-only by decision, guarded to 404 in production by the middleware. No OAuth app, no prod storage split. Retire fully after image upload lands in /studio.

## /studio inline-edit, multi-form draft accumulation (before a 2nd settings form)

commitSiteSettings rebuilds the draft branch from main on every save, so a per-form partial patch silently drops the other forms' draft edits. Hero-only is safe today because the Hero panel (components/studio/HeroEditPanel.tsx) sends the full patch on each save. Before wiring a second Site Settings form (About, Process, or Links), do one of two things. Change the save base in lib/studio/commit-site-settings.ts to the draft branch when it exists so saves accumulate, or have every form send all settings on each save. Otherwise the second form's first save wipes the first form's unpublished draft. The save endpoint is app/api/studio/save-draft.

The draft-base fix must also cover three deferred findings from the PR 4 review, they live in the same seam.

- Review finding 2. commitSiteSettings deletes the existing draft branch before recreating it and deletes it again on a commit failure, so a transient GitHub error mid-save destroys the previously saved draft. Basing the read-modify-write on the draft head fixes this naturally.
- Review finding 6. The save-draft route recomputes differs by re-reading through the tag-invalidated cache in the same request, which Next may serve stale in prod. Compute the response differs from result.bytes, which the route already holds.
- Review finding 8. entryToRecord in lib/studio/draft-site-settings.ts is a third hand-synced copy of the settings field list. A field added to the schema but missed there makes differs silently false for drafts changing only that field. Derive the record from SITE_SETTINGS_FIELD_ORDER or compare the raw YAML texts directly.

## Portfolio (user-facing), still open, pre-dates the /studio work

- Full mobile and responsive QA pass across ALL boAt case-study sections at 1024px. 07 was almost certainly not the only gap, so verify on a real device, not just preview_resize.
- Beats 7 to 9 of the case-study page.
- Remaining app screens. Sleep Detail and Blood Oxygen (inspirations TBD), and Daybreak light-mode variants via token swap.
- Behance publish (full panel sequence).
