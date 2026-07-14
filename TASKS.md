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

Still pending inside content. Real outcome numbers for Fosfor AI and Fosfor Data Profiling, and the real portrait plus real screen exports.

Where those uploads go changed. The screen exports for the three migrated projects go through /studio now, NOT Keystatic, which is locked out of those files because it rewrites them destructively (see the case study editor section below). The portrait is the site-settings photo, now uploadable through /studio (#64), the last field to move before Keystatic was retired (#65).

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

- [ ] Core Web Vitals passing on mobile and desktop. Lab-measured GOOD on both (prod, warm cache), desktop LCP 1068ms CLS 0 FCP 304ms, mobile LCP 964ms CLS 0 FCP 196ms. Not field-confirmed (needs CrUX p75) and INP not measured, so this stays open pending real-user data.
- [x] Per-page titles and descriptions correct. Verified distinct per route (homepage, boat-crest, and each content study via generateMetadata with title + summary).
- [x] Custom share image per case study. Verified each study renders its own /projects/<slug>/og image (distinct bytes, its own title + summary), 1200x630 image/png.
- [ ] Semantic markup and real alt text on every image. NOT done, blocked on content, the 3 migrated studies still carry placeholder alt ("Placeholder companion screen, replace via the dashboard"), which clears when real screens are uploaded with real alt through /studio.
- [x] Keyboard-reachable navigation final pass. Focus is visible (terracotta :focus-visible ring, outline not suppressed), tab order sane, no hidden-focusable leak, the mobile menu focus trap is textbook (traps, wraps, Escape closes and restores focus to the burger, scroll locks), and the skip-to-content link (WCAG 2.4.1) was added, first focusable, jumps focus into main so the nav is bypassed, verified on the homepage and case studies.
- [x] Reduced motion final audit. Every animation source respects it, verified. A global CSS killswitch (globals.css, prefers-reduced-motion:reduce neutralizes all animation/transition/scroll-behavior) plus useReducedMotion on every JS source, Motion (13 files), Lenis smooth scroll (SmoothScrollProvider returns children unwrapped), and GSAP ScrollTrigger (GSAPProvider skips the sync).
- [ ] Contact form endpoint set. NOT done, NEXT_PUBLIC_CONTACT_FORM_ENDPOINT is unset, so the form throws "no endpoint configured" on submit. Ops task, set the Web3Forms endpoint + key in Vercel.
- [x] metadataBase and NEXT_PUBLIC_SITE_URL wired to https://www.akshitas.com
- [x] Domain configured in Vercel, canonical host settled as www.akshitas.com with apex 308 redirect
- [ ] Studio prod env vars set in Vercel (STUDIO_WRITE_MODE=github plus the three secrets, see the prod-readiness section). The old Keystatic github switch is obsolete now that Keystatic is retired. Partial confirmation from the prod verification pass, login rejects a wrong password and the throttle fires, so OWNER_PASSWORD and SESSION_SECRET are set, but WRITE_MODE=github and GITHUB_TOKEN need an authenticated write to confirm (owner-only).

---

## Open items, the real blockers

- Domain is configured in Vercel. The canonical host is www.akshitas.com, with the apex redirecting to the www host. The remaining launch steps are the /studio prod env vars (see the prod-readiness section) and the contact form endpoint.
- Real outcome numbers for Fosfor AI and Fosfor Data Profiling.
- Contact form endpoint (Formspree or Web3Forms) and the env var.
- Real portrait and real screen exports, uploaded through /studio (Keystatic retired).
- Tune the faint heading and backdrop alphas against the real cream token.

---

## The /studio arc (COMPLETE)

The custom editor is done. /studio is the sole content editor and the second CMS is gone. Every element of the three content case studies, and every site and homepage field, edits from one owner-gated dashboard that commits to a draft branch and publishes to main by merge. boat-crest is the exception and stays bespoke by decision, rendered from its hand-authored TS object, not dashboard-edited.

The milestones, in order, each proven before the next began.

- The read-only dashboard. A dashboard that surfaced reader-readable content and deep-linked to Keystatic for edits. Superseded by the write path below.
- The write path (GH-1 through GH-12). The owner-gated commit layer, the login gate, the draft branch, publish-as-merge, the durable login throttle, and the production file-tracing fix.
- Renderer convergence (the COMPLETE section below). One component set renders all four case studies, boat-crest from its hand-authored TS object and the three content studies from their sections through the adapter.
- The case study editor (phase 4, the section below). Draft preview, the sections write seam, all 14 block-kind forms, section and block add and remove and reorder, and content-addressed block image upload.
- The site photo upload (#64). The last Keystatic-only field, given a /studio writer, which was the one gap gating the retirement.
- The Keystatic retirement (#65). The editing UI and API deleted, the moot guards removed, Keystatic kept as the content SCHEMA only (the reader parses all content through keystatic.config.ts and sections-raw.ts derives the 14 block-kind union from it, so the config and @keystatic/core stay, and the body field stays because createReader throws without it).

What remains is content and polish, not architecture. The two carried-forward follow-ups (orphan block-image GC and a confirm on section remove) and the pending content (the real portrait and screen exports, now uploadable through /studio, plus the outcome numbers) are the open work. The sections below are the detailed record, and a few describe superseded early states.

## /studio read-only content dashboard (shipped, later superseded by the write path)

Custom editorial dashboard at /studio. Read-only in this first version. It surfaced Reader-readable content and deep-linked out to the Keystatic editor, and never wrote. Sidebar and section-card layout. The mockup is docs/studio/studio-dashboard-mockup.html.

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

## The case study editor (COMPLETE, and this closes /studio phase 4)

Step 4, the editor itself. Every element of the THREE CONTENT case studies is now editable from /studio, images included. boat-crest is not, and never will be, because it stays bespoke by decision (fork 1 below). With step 1 (heroImage upload, 040dbfb, #48) and the renderer convergence above, the /studio phase 4 is done.

The arc, each sub-gate proven before the next started.

- 4(a), 562980e (#56). The case-study draft-preview read-split plus the preview-placeholder guard, one of the two flags step 3 named. adaptSections gained a mode, ssg stays the pinned fail-loud default and preview yields placeholders so a half-authored draft still renders.
- 4(b)-i, aae6325 (#57). The pullQuote vertical slice, the sections write seam, and the Keystatic lockout. The head-splice preserves the tail by design, so it can never write the sections that live in it. The sections-splice is its mirror.
- 4(b)-ii, 2311244 (#58) and 4976be0 (#59). All 14 block kinds, through a registry keyed by discriminant. PR A did the derived raw types and tiers 1 and 2, PR B did the tier 3 kinds.
- 4(b)-iii, e2c9d40 (#60). Section and block add, remove, and reorder, the 14 empties, and the section shell form.
- 4(b)-iv, 9f31470 (#61). Block image upload, content-addressed.

What holds, and why.

- The forms edit the RAW Keystatic shape, never lib/case-studies/types.ts. types.ts is what the adapter EMITS, raw is what it CONSUMES, and they differ in five documented ways. A form typed against the renderer's types would invent a translate tuple the file has never held. The raw types are DERIVED from keystatic.config through Keystatic's own Entry helper, so the schema is the single source and a rename is a compile error.
- The 14 kinds are exhaustive BY CONSTRUCTION. The registry and the sanitizer's validator table are both mapped types over the schema-derived union, so a 15th kind stops them compiling. No assertNever is needed for a table. Note that types.ts's BlockKind is SIXTEEN, because it also carries boat-crest's two scroll-story kinds, which the sections schema cannot express.
- Forms preserve exactly what they read, and the sanitizer enforces it rather than trusting it. Every field the schema declares is required, so a form that strips an empty string or drops a null fails the save loudly instead of quietly rewriting blocks the owner never touched.
- Block images are CONTENT-ADDRESSED, named by a hash of the normalized webp bytes. Every obvious alternative was unsafe. An array index renames on reorder, which is exactly what Keystatic does and exactly why it is locked out. The stable client ids are useRef counters reseeded on every mount, so the same id names a different block after a reload. And section.id is user-editable. A hash depends on the image and nothing else, so a reorder cannot rename a blob.
- The upload route is BLOB-ONLY. It commits the image and returns its path, and the panel sets src through the ordinary save, so sections keeps exactly ONE writer.
- Publish now validates sections, extending the GH-4 seam that already validated site settings. This is what makes block add safe. Upload alone did not, because a new block is still born with a null src, so the gate moved from the picker, which could only guess, to publish, which can look. An unpublishable draft is refused with the adapter's own message and main is untouched.
- Keystatic is LOCKED OUT of the three migrated projects. It rewrites them destructively on save, relocating every block image and deleting the originals, because it derives nested image filenames from the field's path within the entry. The lock is the update-route guard, since the slug is in the write body rather than the URL. The set is derived from each file's own sections key, not listed, so a future migrated project locks itself.

### Follow-ups the editor surfaced, none blocking

- Orphan block images. Replacing or clearing an image repoints `src` and leaves the old blob, by decision. Deleting on replace would need refcounting, because content-addressing means two blocks can legitimately share one blob, so a naive delete could break an unrelated block. A stale blob is inert, it costs repo size and not correctness. `blockImageBlobPathFromValue` in lib/studio/block-image-path.ts is already built and tested for the GC sweep that would reclaim them.
- Removing a section discards its blocks with no confirmation. The control sits beside the reorder buttons, so a misclick is easy, and the undo (Cancel locally, or Discard for the draft) is not obvious. It is recoverable and not data loss, which is why it was not treated as a defect. Item 13 set the precedent worth matching, a confirm dialog that says the true thing, that a draft delete is undoable until Publish.
- Two retracted claims, recorded so they are not re-relied on. The 3(d) note that a Keystatic save of an untouched project is byte-idempotent is VOID, because those saves never wrote. 3(d)'s real byte-safety rests on the splice proofs, which stand and are re-run by the suites. And the 4(b) recon finding that Keystatic preserves stored image paths on save is FALSIFIED, it relocates them, which is what forced the lockout.

### Carried forward, now editable through the step 4 editor

The SYSTEM is complete. Everything below is content, not a blocker, and the step 4 editor is what makes it editable from production.

- Placeholder images, all three migrated projects. Each carries neutral placeholder screens (public/images/projects/<slug>/screen-a,b,c.webp) and a null heroImage. Replace the hero through the P4-1 upload (040dbfb, #48) and the block images through the 4(b)-iv upload (9f31470, #61). A replacement lands at a content-addressed path under blocks/, so the old screen-a,b,c.webp files stay behind as orphans until a GC sweep.
- The Fosfor Data Profiling `[real number]` stat. Poured verbatim from the old body, still standing in for a real figure.
- The Fosfor AI outcome. The study still closes without a real outcome number, the same gap Content gaps above records.
- Enrichment toward boat-crest depth. The pour was a faithful starting point, not a ceiling. statCards, principleCards, annotatedImage, and swatchTokens are all available block kinds the three studies do not use yet.
- One adapter flag is still open. The preview-placeholder guard landed in 4(a) (562980e, #56). The per-image `aspect?` field did NOT, and is still wanted if a real replacement image disagrees with the phone-bezel default. Nothing needs it yet, because every image in the three studies is still a placeholder at the bezel aspect.

## Open forks (named so they are not silently assumed)

1. Case-study body editing. SETTLED for the three content projects. The renderer convergence removed the rendering split, so all four studies share one component set, and the step 4 editor made the data editable, images included. What survives is a DATA split, not a renderer one. The three content projects render from their Keystatic `sections`, which /studio now edits end to end.

   boat-crest stays bespoke and is not dashboard-edited, the locked decision. It renders from the hand-authored TS object in lib/case-studies/boat-crest.ts through its literal route, so editing its Keystatic item does nothing to the live page. Two residual items belong to that decision rather than to body editing. Its Keystatic projects item is a misleading surface that edits nothing, worth removing or labelling when /keystatic retires. And its two scroll-story blocks (featureStory, beforeAfterStory) are deliberately excluded from the sections schema, so they are the one thing a content project cannot express. They stay boat-crest's island because they need statically-imported assets with build-time dimensions, which a content-path image cannot supply.
2. The three In code homepage sections (Hero facets, Process stage visuals, Contact form steps) are code-managed and shown as non-editable cards. They are the first candidates if and when we make hand-authored content editable, which would mean a /studio panel now that Keystatic is retired.
3. /studio search is a non-functional placeholder. A client-side label filter is the near-term fast-follow. Search over field values needs a content index and is deferred.
4. /studio B, the inline editing write path, SHIPPED. Saves go through the owner-gated save-draft route to the draft branch and Publish merges the draft into main through the publish route, both in github mode, with the pure transform in lib/studio/site-settings-format.ts. The P1 fs write seam (lib/studio/save-site-settings.ts) was removed as superseded. All field groups now edit inline. Hero, About, Process, Links, and Skills each have their own panel, and Experience and Projects add and delete entries through the create and delete foundation (F-1 write primitives, F-2 studio draft overlay, F-3 guarded create and delete, items 13 and 11). Links (item 10) migrated its fixed url fields to an editable array in the same singleton-array pattern as Skills.

   Two polish follow-ups are done. The object-array editors (Links, Skills) no longer commit a fully-blank row to the draft, because buildCommitted and isDirty both drop empty items now, matching the About and Process string-array editors (PR 43 for Links, PR 44 for Skills). And the sidebar Projects and Experience counts live-update on add and remove through a StudioCountsProvider seeded from the server counts, instead of going stale until a hard reload (PR 45). Image upload is done too, for the project heroImage (040dbfb, #48) and for case-study block images (9f31470, #61), so no fork remains here.

## /studio prod-readiness blockers (audited, three were stale)

Audited against the code, not from memory. Three of the four bullets this list carried had shipped and were still written as open. What is left is ops, not code.

Settled, with the check that proves it.

- Gate /studio itself. DONE by GH-6. middleware.ts and the (dashboard) layout both call verifyOwnerSession before anything renders, and an unauthenticated /studio returns a 307 to the login page.
- Cache the per-request draft read. DONE by GH-8. readDraftSettingsCached wraps the GitHub read in unstable_cache with a 45 second TTL and a revalidate tag, and all seven write routes invalidate it (save-draft, publish, discard, create-entry, delete-entry, and the two upload routes).
- Durable cross-instance login throttle. DONE by GH-7. lib/studio/login-throttle.ts backs the same policy with Upstash over its REST API and falls back to the in-memory counter, logged, when the store is absent or erroring.

Still open, and both are ops rather than code.

- Set the four REQUIRED server env vars in Vercel prod. This list never named them, which was the real gap. STUDIO_WRITE_MODE must be `github`, because every write path tests that literal and nothing falls back to NODE_ENV, so leaving it unset makes every save return the fs no-op and tell the owner it needs github mode (dev), in production. STUDIO_GITHUB_TOKEN, or writes 500. STUDIO_OWNER_PASSWORD and STUDIO_SESSION_SECRET, or nobody can log in. The last three FAIL CLOSED, verified, so a missing secret locks the owner out rather than letting anyone in. STUDIO_WRITE_MODE is the odd one, it fails confusing rather than closed.
- Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel prod, else the GH-7 throttle degrades to per-instance in-memory. Optional by design, unlike the four above.
- Retire /keystatic. DONE. The editing UI and API route are deleted, `@keystatic/next` is removed, and the moot guards (the GH-9 prod-404 and the 4b-i lockout, both pointless once the write route is gone) go with them. `keystatic.config.ts` and `@keystatic/core` STAY, because the reader parses all content through the config and `sections-raw.ts` derives the 14 block-kind union from it (createReader throws without the `body` field, proven, so `body` stays too). The one gap that gated this, the site photo being Keystatic-only, was closed first by the /studio photo upload (#64). Keystatic is now schema-only, editing is entirely /studio.

Phase 4 added no new blocker, checked rather than assumed. Every /studio route and every /api/studio route carries content/ in its build trace, including the new body and preview pages, so GH-12's glob covers the nested routes. Both upload routes carry sharp. The Keystatic lockout reads content/ from the filesystem, but the middleware's production 404 returns before that read, so it never runs in prod.

## /studio inline-edit, multi-form draft accumulation (SETTLED by DB-1)

Fixed. commitSiteSettings now commits on top of the existing draft branch (base = draft head with expectedHeadOid), creating from main only when no draft exists, so partial patches accumulate and a second settings form can never wipe the first form's draft edits. Proven by saving two disjoint partial patches and verifying both survive with the commit parent chain intact. New settings forms may send per-form partial patches.

The three deferred PR 4 review findings in this seam are also settled. Finding 2, a failed commit no longer destroys the prior draft because nothing is deleted when a draft exists (proven with a forced stale expectedHeadOid failure). Finding 6, the save-draft route computes its response differs from the bytes it just committed via settingsDiffer, never through the same-request cache. Finding 8 was settled earlier in H1, entryToRecord derives from SITE_SETTINGS_FIELD_ORDER.

Remaining known trade, a draft based on an old main surfaces staleness only at publish, where the merges API three-way merges cleanly or returns the typed merge_conflict. No save-time staleness signal by decision.

## Portfolio (user-facing), still open, pre-dates the /studio work

- Full mobile and responsive QA pass across ALL boAt case-study sections at 1024px. 07 was almost certainly not the only gap, so verify on a real device, not just preview_resize.
- Beats 7 to 9 of the case-study page.
- Remaining app screens. Sleep Detail and Blood Oxygen (inspirations TBD), and Daybreak light-mode variants via token swap.
- Behance publish (full panel sequence).
