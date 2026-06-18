# Build Progress

## Phase 0 Setup — done

- [x] Git repo initialised with CLAUDE.md and docs
- [x] Next.js 15 with App Router and TypeScript
- [x] Tailwind v4 with design tokens in app/globals.css
- [x] Free variable fonts configured via next/font/google
- [x] Keystatic CMS in local mode with full case study block schema
- [x] Placeholder home page and Keystatic dashboard route
- [x] TypeScript clean, production build passing
- [x] Initial commit on master

### What was decided in Phase 0

**Fonts.** Fraunces as display serif with the SOFT, WONK, and opsz variable axes, and DM Sans as body text with the opsz axis. Both are downloaded at build time by next/font/google and self-hosted. No runtime requests go to Google Fonts. Fonts are provisional and sit behind CSS custom properties so swapping them later is a one-line change.

**Palette.** Warm cream background at oklch(98.5% 0.012 80), warm near-black ink text at oklch(14% 0.018 60), and a muted terracotta rust accent at oklch(56% 0.14 42). All values use oklch so the steps are perceptually uniform. Every token lives in the @theme block in app/globals.css as a CSS custom property.

**Keystatic API corrections.** Three things differed from the documented API once the package was installed. The route handler is exported from @keystatic/next/route-handler, not @keystatic/next/api. The dashboard page uses the named export makePage(config) from @keystatic/next/ui/app, not a default export. There is no withKeystaticConfig wrapper in Keystatic v0.5, so next.config.ts is a plain NextConfig with no Keystatic import.

**Dev port.** Port 3000 is occupied on this machine by the job-fit-extension wxt dev server. Run the portfolio dev server with npm run dev -- -p 3456, or kill the other process first if port 3000 is preferred.

---

## Phase 1 Design system and motion baseline — done

- [x] Layout primitives (container, grid, section wrapper)
- [x] Site header shell with navigation
- [x] Site footer shell
- [x] Lenis smooth scroll initialised in a Client Component
- [x] Motion spring baseline for reveals
- [x] GSAP ScrollTrigger wired up for heavier choreography
- [x] Reduced motion respected throughout

---

## Phase 2 Home page — done

- [x] Hero section with display serif and hero photo
- [x] Project grid with ProjectCard component
- [x] About section with bio copy and photo, anchored to /#about
- [x] Process section with four Discover Define Develop Deliver steps
- [x] Experience timeline with date-range rows
- [x] Skills section with category groups
- [x] Contact section with email, resume, and social links
- [x] All sections return null gracefully when CMS data is absent
- [x] Nav anchor links updated to /#work, /#about, /#contact
- [x] scroll-mt-20 on all anchor sections to clear sticky header
- [x] TypeScript clean, production build static (no dynamic rendering)

### Phase 2 page order

Hero, Work, About, Process, Experience, Skills, Contact

### What was added to the CMS schema in Phase 2

siteSettings gained five new fields: aboutCopy (multiline text for the About section bio), discoverText, defineText, developText, and deliverText (one-liners for each Process step). Content for all five fields lands in Phase 4.

---

## Phase 3 Case study template — done

- [x] Case study page route wired to Keystatic reader
- [x] All fifteen block types built as components
- [x] heroBlock
- [x] summaryGrid
- [x] impactNumbers
- [x] context
- [x] problem
- [x] goals
- [x] processSteps
- [x] keyInsights
- [x] solutionReveal
- [x] guidedDesignStep
- [x] imageGallery
- [x] comparison
- [x] quote
- [x] reflection
- [x] closingLine

### What was built in Phase 3

The dynamic route lives at app/projects/[slug]/page.tsx and uses generateStaticParams to pre-render all project slugs. Each project slug calls getCaseStudyData(slug) from lib/keystatic.ts which reads the Keystatic blocks array and resolves async document fields (context and reflection) before returning a fully typed CaseStudyData object.

Fifteen block components live in components/blocks/. Each accepts a typed value prop narrowed by the CaseStudyBlock discriminated union. CaseStudyBlockRenderer.tsx dispatches to the right component via a switch on block.discriminant. Document blocks (context, reflection) render through CaseStudyDocumentRenderer.tsx which wraps Keystatic's DocumentRenderer with design-token Tailwind classes.

ProjectCard.tsx now links to /projects/[slug] to match the new route.

---

## Phase 4 Content — not started

- [x] boAt Crest case study poured and cleaned
- [x] Fosfor AI case study poured and cleaned
- [ ] Fosfor Data Profiling case study poured and cleaned
- [ ] OTIS ONE View case study poured and cleaned
- [ ] Experience entries entered
- [ ] Skills entered
- [ ] Site settings filled in

---

## Phase 5 Polish and launch — not started

- [ ] Core Web Vitals passing on mobile and desktop
- [ ] Per-page titles and descriptions correct
- [ ] Custom share image per case study
- [ ] Semantic markup and real alt text on every image
- [ ] Keyboard-reachable navigation
- [ ] Reduced motion passes a final audit
- [ ] Domain configured in Vercel
- [ ] Production Keystatic mode switched to github

---

## Open items needed before certain phases can close

- Domain name (needed for Phase 5 launch and for updating metadataBase in app/layout.tsx)
- Real outcome numbers for Fosfor AI and Fosfor Data Profiling (needed for Phase 4 content)
- Cleaned case study copy for all four studies, starting with boAt (needed for Phase 4 content)
- Confirmation or tweak on the light editorial palette before Phase 1 finalises tokens
