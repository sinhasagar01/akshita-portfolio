# Phase 5 — launch pass (performance, accessibility, motion)

Grounded in three concrete audits (accessibility, motion, performance + launch-readiness)
against the live code. The site is already strong: reduced-motion coverage is thorough,
and SEO plumbing (canonical host `www.akshitas.com`, sitemap, robots, JSON-LD, per-study OG
cards, `outputFileTracingIncludes`, avif/webp) all passes clean. Findings below are the real gaps,
each with a `file:line` from the audits.

## Tier 1 — blockers (fix before launch)

1. **Home page has no `h1`.** `components/sections/HeroSection.tsx:252` renders the name as a `<p class="font-script">`; every section below is `<h2>`. SR heading-nav never gets a page title. → make the signature an `<h1>` (or add an `sr-only` `<h1>` in `app/(portfolio)/page.tsx:34`).
2. **`text-subtle` fails WCAG AA at 2.55:1.** `app/globals.css:54` — used for every section subheading, footer labels, and case-study eyebrows. → darken toward `ink-600` (7.47:1). **Visual change — needs the designer's eye.**
3. **`Reveal.tsx` reduced-motion may leave the hero invisible.** `components/motion/Reveal.tsx:28-31` sets `initial/animate={false}` when `prefersReduced`, but SSR emits `opacity:0` (useReducedMotion is `null` pre-hydration) with no CSS fallback, so it can stay hidden. Wraps the homepage hero (`HeroSection.tsx:250,263,344,429`). → **VERIFY the bug reproduces first** (the a11y audit did not flag the CSS reveal paths — this is the Motion-only component), then give reduced motion an explicit visible resting state.
4. **Case-study hero LCP image is never `priority`.** `components/case-study/DeviceImage.tsx:99,114,145` — the hero device is the LCP element, lazy by default and gated on hydration. → thread a `priority` prop through `DeviceImage`/`WideFrame`, set it on the two `HeroCover` hero devices.

## Tier 2 — should-fix (strongly recommended)

**Contrast (all AA failures on <18px text — a designer-visual decision):**
5. `ink-400`/`text-muted` 3.50:1 on cream — project eyebrows, experience dates, process tags, studio counts (`app/globals.css:25`). → use `ink-600` for small labels.
6. `accent-500` on the canvas/translucent header 3.89:1 — nav links (`SiteHeader.tsx:258`). `accent-600` (5.95:1) already exists. → use `accent-600` for accent text on canvas.
7. Form placeholder/hint 1.94:1 (`ContactSection.tsx:53,189`). → darken.

**A11y widgets:**
8. Closed mobile menu stays in tab order + a11y tree (hidden only by `clip-path`, `SiteHeader.tsx:320`; `aria-modal` persists). → `inert`/`hidden` when closed; `aria-modal` only while open.
9. Studio dialogs (`ProjectsListEditor.tsx:235`, `ExperienceListEditor.tsx:239`) have no focus trap / focus-return. → reuse SiteHeader's trap pattern (`SiteHeader.tsx:159-182`).

**Motion/scroll correctness:**
10. `history.scrollRestoration="manual"` set even under reduced-motion where nothing restores scroll (`SmoothScrollProvider.tsx:50`). → only set it when Lenis is active.
11. Deep-link `/#work` clobbered by three scroll-to-top mechanisms; the 1400ms loader's `resetToTop` wins (`GSAPProvider.tsx:18`, `PageLoader.tsx:117`). → skip forced scroll-to-0 when `location.hash` is present.
12. ScrollTrigger scrubbers not refreshed after web-font reflow (`ProcessSection.tsx:133`, `BeforeAfterStory.tsx:247`). → `ScrollTrigger.refresh()` on `document.fonts.ready`; add resize refresh to ProcessSection for parity.

**Launch surfaces + quick perf:**
13. No 404 page, no error boundaries. → `app/not-found.tsx` (branded, in chrome), `app/(portfolio)/error.tsx`, `app/global-error.tsx`.
14. Caveat font preloaded but below the fold (`app/layout.tsx:12-43`). → `preload:false` on Caveat only.
15. About photo `sizes` uses `768px` but the site flips at `1024px` (`AboutSection.tsx:77`). → `1023px`.
16. **`PageLoader` holds an opaque overlay 1400ms every route** (`PageLoader.tsx:117`) — the biggest field-LCP lever. → first-visit-only (sessionStorage) or shorten. **Brand moment — design decision.**

## Tier 3 — polish / nice-to-have

17. Hero tabs + process stepper use `role="tab"` without `aria-controls`/tabpanel/arrow-keys (`HeroSection.tsx:268`, `ProcessSection.tsx:344`). → full ARIA tabs pattern OR downgrade to buttons + `aria-pressed`. **Decision.**
18. `ProjectCard.tsx:59` — malformed inline `transition` string (a `background:` spliced into it) silently no-ops. Real bug. → fix the style.
19. Dead `components/case-study/ImageFigure.tsx` renders `<Image>` with no width/height/fill — would throw if used, zero consumers. → delete.
20. HeroCover reduced-motion flash of hidden state (`HeroCover.tsx:42`). → `useLayoutEffect` for the reduce branch.
21. `will-change` static on 5 offscreen WorkStory units (`WorkStory.tsx:243`); per-frame `blur()` on mobile GPUs (`WorkStory.tsx:95`, `HeroCover.tsx:60`). → scope `will-change`, drop blur on mobile.
22. CustomCursor hides native pointer even under reduced-motion (`CustomCursor.tsx:14`). → keep native cursor on reduce.
23. No-JS: reveal sections ship clipped/opacity:0 (`RevealSection.tsx`, `globals.css:848`). → start visible, JS opts into hide-then-reveal. Low priority (JS-required site).
24. Studio raw `<img>` (`ProjectsEditPanel.tsx:427`) — admin-only, low value. → `next/image` or leave.

## Proposed sequencing (thematic PRs)

- **PR A — Accessibility & contrast** (Tier 1 #1–2, Tier 2 #5–9): h1, contrast tokens, menu inert, studio focus traps. Contrast + h1 are the launch-gating a11y items.
- **PR B — Reduced-motion & scroll correctness** (#3, #10–12, #20): verify + fix Reveal.tsx, scrollRestoration, hash-nav, ScrollTrigger font refresh, HeroCover flash.
- **PR C — Performance / LCP** (#4, #14–16, #18–19, #21): priority image, PageLoader (pending decision), Caveat preload, About sizes, ProjectCard bug, delete dead file, will-change/blur.
- **PR D — Launch surfaces** (#13): 404 + error boundaries, branded.
- **Tier-3 remainder** (#17, #22–24): batch or defer post-launch.

Each PR: build + render-verify the affected surface, reduced-motion + Lighthouse spot-check where relevant, byte-compat where the change is meant to be invisible.

## Decisions — RESOLVED

1. **Contrast** → fix all genuine reading copy to AA, tuning each token to the LIGHTEST value that still clears 4.5:1 (not jumping to `ink-600`), so the editorial softness is preserved as far as compliance allows. Applies to `text-subtle`, `ink-400`, the placeholder/hint, and `accent-500`→`accent-600` for accent text on canvas.
2. **PageLoader** (#16) → first-visit-only via `sessionStorage`; internal navigation paints instantly, first landing keeps the full brand moment.
3. **Hero tabs / stepper** (#17) → downgrade to `aria-pressed` buttons (drop `role="tab"`); correct and simpler than a full tablist/tabpanel/arrow-key pattern for a visual toggle. Moves from Tier 3 into PR A.
