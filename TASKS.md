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

## Phase 2 Home page — not started

- [ ] Hero section with display serif and hero photo
- [ ] Project grid or list
- [ ] Experience timeline
- [ ] Skills section
- [ ] Resume link and contact

---

## Phase 3 Case study template — not started

- [ ] Case study page route wired to Keystatic reader
- [ ] All eleven spine block types built as components
- [ ] heroBlock
- [ ] summaryGrid
- [ ] impactNumbers
- [ ] context
- [ ] problem
- [ ] goals
- [ ] processSteps
- [ ] keyInsights
- [ ] solutionReveal
- [ ] guidedDesignStep
- [ ] imageGallery
- [ ] comparison
- [ ] quote
- [ ] reflection
- [ ] closingLine

---

## Phase 4 Content — not started

- [ ] boAt Crest case study poured and cleaned
- [ ] Fosfor AI case study poured and cleaned
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
