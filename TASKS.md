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

Superseded. The fifteen generic block types and CaseStudyBlockRenderer above were DELETED by the renderer convergence (see that section below). The route and generateStaticParams survive, but [slug] now renders through the adapter into CaseStudyView, the same components boat-crest uses. This record stands as history, not as the current shape.

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

## Case study renderer convergence (COMPLETE)

Numbering note, because two things are called Phase 4. This is the /studio phase 4 (image upload, then converge the renderer, then the editor). It is NOT the build-sequence Phase 4 Content above, which was the one-time content pour. The two are unrelated.

ONE renderer now serves every case study. The three content projects render from their Keystatic `sections` field through the adapter into CaseStudyView, and boat-crest renders from its hand-authored TS object through the same components. The generic renderer that structurally could never match boat-crest is gone.

The arc, each sub-gate proven before the next started.

- 3(a), ffdfcba (#49). HeroCover's three boat-crest hardcodes became explicit fields, eyebrow, watermark, and a two-device tuple. Proven by a byte-identical boat-crest re-render.
- 3(b), 5177735 (#50). The Section to Block-array schema in keystatic.config.ts, 14 in-scope block kinds, added additively alongside `body`. Proven byte-compat through a realistic authored round-trip carrying a folded scalar, with no Keystatic unsaved diff.
- 3(c), 3f48138 (#51). The pure content-to-CaseStudy adapter (lib/case-studies/adapter.ts) plus DeviceImage's fill and aspect mode for content-path images. Proven by a 19-case unit suite (ralph/tests/p4-3c-adapter.mjs) and a byte-identical boat-crest.
- 3(d), e251c7e (#52). The per-project fallback switch plus fosfor-ai migrated, the pattern proof.
- 3(d), 2ca723e (#53). fosfor-data-profiling and elevate-one-view migrated.
- 3(d), 30fdb70 (#54). The legacy renderer deleted, components/blocks and the switch gone, the three bodies collapsed to `body: []`.

What holds after the deletion, and why.

- The head-splice write seam is UNCHANGED. The three bodies collapsed to `body: []` rather than being removed, so splitAtBody keeps its `\nbody:` anchor and `sections` stays a verbatim-preserved tail, never re-serialized. `body: []` is the shape Keystatic itself writes for an empty blocks field, so saves stay byte-idempotent. Removing the key would have forced a re-anchor AND save churn. Proven both in memory before writing and on disk after.
- The projects schema KEEPS the `body` field, dead but harmless, because removing it would orphan boat-crest.yaml's 19 poured blocks against the schema. Known cost, Keystatic still shows the unused field. Retire it when /keystatic retires.
- A project with no sections adapts to an empty array and renders CaseStudyView's Coming soon placeholder, so a fresh studio-created stub is graceful rather than a crash.
- The adapter is fail-loud by design. A wrong device count or a missing image src throws at the adapter boundary, which is right for build-time SSG.

### Carried forward, editable once the step 4 editor lands

The SYSTEM is complete. Everything below is content, not a blocker, and step 4 is exactly what makes it editable from production.

- Placeholder images, all three migrated projects. Each carries neutral placeholder screens (public/images/projects/<slug>/screen-a,b,c.webp) and a null heroImage. Replace them through the dashboard image upload (040dbfb, #48).
- The Fosfor Data Profiling `[real number]` stat. Poured verbatim from the old body, still standing in for a real figure.
- The Fosfor AI outcome. The study still closes without a real outcome number, the same gap Content gaps above records.
- Enrichment toward boat-crest depth. The pour was a faithful starting point, not a ceiling. statCards, principleCards, annotatedImage, and swatchTokens are all available block kinds the three studies do not use yet.
- Two adapter flags for step 4. A preview-placeholder guard in front of the fail-loud adapter for half-authored studio drafts, and a per-image `aspect?` field if a real replacement image disagrees with the phone-bezel default.

## Open forks (named so they are not silently assumed)

1. Case-study body editing. MOSTLY SETTLED by the renderer convergence above, and the part that remains is narrower than this fork used to describe. The rendering split is gone, all four studies now share one component set. What survives is a DATA split, not a renderer one. The three content projects render from their Keystatic `sections`, so they are dashboard-editable and the /studio deep-link reaches what renders. boat-crest still renders from the hand-authored TS object in lib/case-studies/boat-crest.ts through its literal route, so editing its Keystatic item still does nothing to the live page, which is the locked decision (boat-crest stays bespoke and is not dashboard-edited). Two things stay genuinely open. The Keystatic projects item for boat-crest is a misleading surface that edits nothing, worth removing or labelling when /keystatic retires. And boat-crest's two scroll-story blocks (featureStory, beforeAfterStory) are deliberately excluded from the sections schema in keystatic.config.ts, so they are the one thing a content project cannot express. They stay boat-crest's island because they need statically-imported assets with build-time dimensions, which a content-path image cannot supply.
2. The three In code homepage sections (Hero facets, Process stage visuals, Contact form steps) are code-managed and shown as non-editable cards. They are the first candidates if and when we migrate hand-authored content into Keystatic.
3. /studio search is a non-functional placeholder. A client-side label filter is the near-term fast-follow. Search over field values needs a content index and is deferred.
4. /studio B, the inline editing write path, SHIPPED. Saves go through the owner-gated save-draft route to the draft branch and Publish merges the draft into main through the publish route, both in github mode, with the pure transform in lib/studio/site-settings-format.ts. The P1 fs write seam (lib/studio/save-site-settings.ts) was removed as superseded, dev editing happens in Keystatic. All field groups now edit inline. Hero, About, Process, Links, and Skills each have their own panel, and Experience and Projects add and delete entries through the create and delete foundation (F-1 write primitives, F-2 studio draft overlay, F-3 guarded create and delete, items 13 and 11). Links (item 10) migrated its fixed url fields to an editable array in the same singleton-array pattern as Skills.

   Two polish follow-ups are done. The object-array editors (Links, Skills) no longer commit a fully-blank row to the draft, because buildCommitted and isDirty both drop empty items now, matching the About and Process string-array editors (PR 43 for Links, PR 44 for Skills). And the sidebar Projects and Experience counts live-update on add and remove through a StudioCountsProvider seeded from the server counts, instead of going stale until a hard reload (PR 45). The remaining fork is image upload.

## /studio prod-readiness blockers (before hosted editing ships)

- Gate /studio itself. It is ungated today, and in github mode it makes authenticated GitHub reads.
- Add caching to the per-request draft read. getStudioData hits the GitHub API per /studio request in github mode.
- Durable cross-instance login throttle. The in-memory one does not survive serverless cold starts.
- Set UPSTASH_REDIS_REST_URL + TOKEN in Vercel prod env, else the GH-7 login throttle falls back to per-instance in-memory in prod.
- /keystatic is dev-only by decision, guarded to 404 in production by the middleware. No OAuth app, no prod storage split. Retire fully after image upload lands in /studio.

## /studio inline-edit, multi-form draft accumulation (SETTLED by DB-1)

Fixed. commitSiteSettings now commits on top of the existing draft branch (base = draft head with expectedHeadOid), creating from main only when no draft exists, so partial patches accumulate and a second settings form can never wipe the first form's draft edits. Proven by saving two disjoint partial patches and verifying both survive with the commit parent chain intact. New settings forms may send per-form partial patches.

The three deferred PR 4 review findings in this seam are also settled. Finding 2, a failed commit no longer destroys the prior draft because nothing is deleted when a draft exists (proven with a forced stale expectedHeadOid failure). Finding 6, the save-draft route computes its response differs from the bytes it just committed via settingsDiffer, never through the same-request cache. Finding 8 was settled earlier in H1, entryToRecord derives from SITE_SETTINGS_FIELD_ORDER.

Remaining known trade, a draft based on an old main surfaces staleness only at publish, where the merges API three-way merges cleanly or returns the typed merge_conflict. No save-time staleness signal by decision.

## Portfolio (user-facing), still open, pre-dates the /studio work

- Full mobile and responsive QA pass across ALL boAt case-study sections at 1024px. 07 was almost certainly not the only gap, so verify on a real device, not just preview_resize.
- Beats 7 to 9 of the case-study page.
- Remaining app screens. Sleep Detail and Blood Oxygen (inspirations TBD), and Daybreak light-mode variants via token swap.
- Behance publish (full panel sequence).
