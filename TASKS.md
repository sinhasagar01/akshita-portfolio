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
- [x] OTIS ONE View case study poured and cleaned
- [x] Experience entries entered
- [x] Skills entered
- [x] Site settings filled in

Still pending inside content. Real outcome numbers for Fosfor AI and Fosfor Data Profiling, and the real portrait plus real screen exports uploaded through Keystatic.

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
