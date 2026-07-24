# Hero-as-ground — branch handoff (feat/hero-as-ground)

WIP. COMMIT 1 is landed and browser-verified; commits 2–4 + the full proof matrix remain.
No PR yet by decision — a grounded hero with un-restyled internals is a half-dressed state.
Delete this file before opening the PR.

## Confirmed decisions (fold into the eventual PR body)
- **Hero byte-parity intentionally broken.** Re-scope: everything BELOW the hero stays
  byte-identical on all four studies + homepage; the hero render changed by design.
- **Case-study watermark re-treatment (approved).** Change the case-study hero watermark
  from the current corner `font-display italic` to the **centred script word behind the
  tagline** (matching the reference + the homepage backdrop word). This is an intentional
  change to published pages, not drift — note it in the PR body alongside the hero-parity note.

## Done — COMMIT 1 (SHA 9ca7862) · "the ground"
Hero is the page's full-bleed 100svh ground, a **sibling of `<main>`** (not a section inside
the padded container) — so it is naturally full-bleed with NO 100vw trick and NO
`overflow-x:clip` on the Lenis/ScrollManager container. One shared `.hero-ground` rule
(min-height:100svh, own bg, nav runway in top padding); `.is-dark` for the web hero.
Rail fix: hero **stops being a tick** — `railItems` and `CaseStudyView`'s article both use
the SAME `variant !== "hero"` split, so positional resolution stays aligned.

Files touched (the seams for 2–4):
- `app/globals.css` — `.hero-ground` + `:root` tokens (see glow tokens below), near `.section-card` (~line 300).
- `components/case-study/SectionRenderer.tsx` — new `asGround` prop; hero branches render `.hero-ground` when set, `.section-card` otherwise (studio canvas keeps the card).
- `components/case-study/CaseStudyView.tsx` — splits hero out, renders it before `<main>`; article maps `bodySections`.
- `app/(portfolio)/page.tsx` — HeroSection moved out of `<main class="container-x">` into a fragment before it.
- `components/sections/HeroSection.tsx` — root class `section-card min-h-[78svh] … py-section` → `hero-ground items-center`.
- `lib/case-studies/rail-items.ts` — `.filter(s => s.variant !== "hero")`.

Verified: homepage + case-study heroes 100svh full-bleed, hero out of article, 0 horizontal
overflow @1280, rail 14 ticks = 14 article children, tick 0 → `setup`. Studio canvas gets no
`asGround` (card kept). typecheck clean.

## The glow refactor shape (do in C2, reuse in C3/C4)
- **Current:** homepage-ONLY, in `HeroSection.tsx`. TWO layers (glow 560px `radial-gradient` +
  a terracotta "core" 240px), each moved by mutating inline `left`/`top` px on mousemove with
  `transition: left/top .14s ease-out`. That is layout-property animation — no `translate3d`,
  no rAF. Not present on the case-study heroes.
- **Target (one shared mechanism, never a second glow):** a single fixed-size layer per host,
  moved with `translate3d(x,y,0)` set in a **rAF-throttled** `pointermove` (see the mock's
  `[data-glow]` loop), `will-change: transform`, hidden under `@media (hover:none)` and
  reduced-motion, coloured by `--glow-color` which each surface sets from its own token.
  Extract as a small client component/hook and mount it on: the homepage hero, the web hero,
  the mobile hero, and the homepage work section. The glow host must be PUBLIC-only — it must
  never render in the studio canvas (gate it the same way as `asGround`).
- **Tokens already added in COMMIT 1** (`:root` in globals.css): `--glow-on-paper`,
  `--glow-on-tan`, `--glow-on-dark`, `--glow-size`, plus `--hero-word-light` / `--hero-word-dark`
  for the backdrop word. Real oklch tokens, not the mock's hex.

## Still needed per commit
- **C2 · Homepage.** Keep centre alignment + content order (name, role, tabs, tagline, cue).
  Raise the type scale now that it isn't boxed (h1 / tagline / tabs — see mock `.hero.home`).
  Swap the two-layer glow for the shared translate3d/rAF layer with `--glow-on-paper`; give the
  work/case-study section `--glow-on-tan`. The backdrop word ALREADY cross-fades on tab change
  (AnimatePresence, script face, aria-hidden) — do NOT rebuild it.
- **C3 · Web case study (dark).** In `HeroCover.tsx` `wide` branch: centre the copy block
  (eyebrow, title, backdrop word, tagline) and the facts grid; reuse the existing framed image
  (`DeviceImage` wide frame) on the right; re-treat the watermark to the centred script word
  behind the tagline (`--hero-word-dark`); nav uses on-dark glass over the hero; glow
  `--glow-on-dark`.
- **C4 · Mobile case study (light).** In `HeroCover.tsx` two-phone branch: centre the copy
  block, rating chip and facts; reuse the existing two-phone composition; re-treat the watermark
  to centred script (`--hero-word-light`); glow `--glow-on-paper`.
- Everything below the hero stays UNCHANGED (same card, gutter, radius, shadow, reveal, order).

## Guardrails (unchanged from the task)
Don't touch ScrollManager, the journey-aware reveal, the Process pinned 240vh scrub, the hero
tabs' behaviour, or the rail's positioning. /studio chrome + canvas unchanged (glow must NOT
render in the editor). Logo wrapped only, untouched. No new image asset. No horizontal scrollbar.

## Proof matrix still outstanding
- [ ] Each of the 3 heroes fills the viewport @1280×800 AND on a 390 profile (screenshot each);
      state measured px gap: nav pill bottom edge → hero first text baseline.
- [ ] Scroll FPS with glow + nav blur both live, on a case-study page (desktop + throttled
      mobile). NOTE: this preview pane's rAF is ~30fps-capped even idle, so a trustworthy
      differential CAN'T be measured here — report that and gate real-device FPS on owner QA
      (same as the nav PR #155).
- [ ] Glow: assert it moves via `transform` (not `background-position`), is absent under
      `(hover:none)` and reduced-motion, and each surface uses its own token.
- [ ] Backdrop word cross-fades on tab change, stays script behind the tagline, aria-hidden
      (homepage already verified; verify case-study after C3/C4).
- [ ] BELOW-HERO PARITY: normalized rendered DOM after the hero byte-identical on 4 studies +
      homepage. COMMIT 1 already moved the hero OUT of `article.case-study`, so the article now
      == body sections; compare branch `article` vs main's `article` minus its first child (the
      old in-article hero). State explicitly the hero itself changed by design.
- [ ] #152 walk: home → case study (lands at hero) → scroll → Back (exact offset, nav immediate)
      → Forward. Process pin still scrubs; preview rail unmoved.
- [ ] No horizontal overflow at 390 / 768 / 1280 / 1920 (COMMIT 1 verified 1280 only).
- [ ] ralph green (expect 551); typecheck + build clean; env fs; main SHA unchanged.
