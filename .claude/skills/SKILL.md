---
name: code-conventions
description: The stack, tokens, animation system, file structure, writing voice, and dev workflow for this portfolio project (Akshita Singh, a custom-coded product-designer portfolio). Consult this whenever writing or editing code, styles, copy, or commits in this repo, BEFORE generating a component, adding an animation, picking a color or font, choosing a breakpoint, or wording UI text, so the output matches the established patterns without re-explaining them each session.
---

# Project Code Conventions

A custom-coded editorial portfolio. Warm, calm, glow-forward. Match the patterns below rather than inventing new ones. When a value or name is needed, read the source of truth named here rather than guessing.

## Stack

- Next.js (App Router) + TypeScript + React.
- Tailwind v4, CSS-first. Design tokens live in `app/globals.css` under `@theme`. There is no `tailwind.config` colour palette to edit, the tokens are the palette.
- Animation, three tools with clear lanes (see Animation).
- Keystatic CMS, git-based local mode, for case-study and home content.
- Fonts via `next/font`.
- Deploy on Vercel.

## Design tokens (source of truth: app/globals.css @theme)

Never hardcode hex in components. Map every colour, font, and spacing value to an existing token and reference it with `var(--...)`. If a value has no token and recurs, add a token rather than repeating a literal.

Known tokens (read globals.css for the full, current set):
- `--color-cream-50` warm surface (~#FBF6EE), `--color-cream-200` one step up (~#F3EADB).
- `--color-text-primary` warm near-black ink (~#211C16), `--color-text-subtle` (~#A89D8D), plus muted ink tones.
- `--color-accent-500` muted terracotta (~#B5613C).
- Page background is a warmer sand (~#E3D7C4).

When matching a reference file, translate its literal hex to the matching token, do not paste the hex.

## Fonts

Set via `next/font`, referenced as CSS vars:
- `--font-display` Fraunces (the display serif, used italic AND upright).
- `--font-body` DM Sans.
- the signature face is Kaushan Script, used for the name and logo. Reuse the exact var the hero and header logo already use, confirm its name in globals.css rather than guessing.
- Caveat exists for occasional doodle accents.

Headlines read better upright Fraunces than italic for long lines. Italic Fraunces is the accent voice (proper nouns, glow words, small flourishes).

## Animation, three lanes

- **Motion** (`motion/react`) for component-level animation, enter/exit, hovers, staggers. Use `AnimatePresence`, `useInView`, and always `useReducedMotion`.
- **Lenis** for smooth scrolling, mounted in `SmoothScrollProvider`.
- **GSAP ScrollTrigger** for pinned / scrubbed sections (the Process section), not for ordinary reveals.

Two hard rules:
1. **Never call `lenis.scrollTo` directly.** Route every programmatic scroll (nav clicks, back-to-top, scroll cues, logo-home) through the shared helper `useSmoothScroll().scrollToTarget(target)`. It owns the `isProgrammaticRef` flag that suppresses the Process snap and the nav scrollspy during programmatic scrolls. A raw `lenis.scrollTo` gets hijacked by the Process snap and breaks navigation.
2. **Always provide a reduced-motion fallback.** Gate motion behind `useReducedMotion()` (JS) or `@media (prefers-reduced-motion: no-preference)` (CSS). Critical, when gating CSS behind `no-preference`, the animation's **end state must still apply** under reduced motion, never trap the final position inside the no-preference block, or reduced-motion users get a broken half-state. Provide a plain fade or static state instead.

## File structure

- `components/layout/` SiteHeader, SiteFooter.
- `components/sections/` HeroSection, ProcessSection, and the other home sections.
- `components/ui/` reusable pieces (SectionHeading, CustomCursor).
- `components/providers/` SmoothScrollProvider, GSAPProvider.
- `components/motion/` PageLoader and similar.
- Shared data goes in `lib/` (for example the social links array imported by both header and footer).

Match this placement for new files. Keep one component per concern.

## Single source of truth

If a value, list, or piece of state is needed in two places, define it once and import it, do not duplicate. Reuse existing handlers, hooks, context, and state rather than adding a parallel one. A second source of truth for the same thing is treated as a bug. Example, social links live in one `lib/` array consumed by header and footer, not retyped in each.

## Breakpoints

The site goes mobile at one shared breakpoint, the header swaps nav for a burger, the hero tabs become dots, and footer pieces hide, all at the same width. When adding a responsive rule, use that same breakpoint so the layout shifts all at once, never in pieces. Confirm the actual breakpoint in the existing header/hero/footer code rather than defaulting to `md`, and verify it is where the content actually breaks.

## Reference-file workflow

Visual work is specced as a standalone `docs/*-reference.html` file with a comment block mapping literal hex to tokens plus build and behavior notes. When a task says "match the reference," match it exactly, sizes, colours, copy, and behavior, and translate its literals to tokens. Do not improvise structure the reference does not have.

## Writing voice (applies to UI copy, comments, commit messages, and chat in this project)

Prose avoids colons, semicolons, em dashes, and forward slashes. Hyphens, commas, periods, and parentheses are fine. Slashes appear only inside code, file paths, and URLs. Keep copy short and scannable. This is the house voice, hold it for any words shown to the user and any prose written about the work. (Markdown structure in internal docs may use colons where needed, the rule is about sentence prose, not list syntax.)

## Dev and verification workflow

- Dev server runs on port 3457, `npm run dev -- -p 3457`. Port 3000 collides with another local project, do not use it.
- After any change, run `npm run typecheck` and `npm run build`, then stop and let the user check on `http://localhost:3457` before committing.
- Use plan mode for load-bearing or multi-file changes (shared layout, providers, scroll behavior, focus traps). Contained, single-component, well-specified changes can run directly.
- Persistent project files, `CLAUDE.md` (stack + rules), `TASKS.md` (progress), `docs/portfolio-prd.md` (spec). Keep them current.

## Accessibility defaults

Interactive UI ships with the basics, focus management and trapping for overlays, `aria-expanded` / `aria-controls` / labels, keyboard operability, and roles. When an element loses its visible label (icon-only buttons, dot indicators), give it an accessible name. Reduced-motion fallback is not optional.
