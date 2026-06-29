# boAt Crest — block style spec (the "match by section type" fix)

These are **design decisions, not pixel noise** — reproduce the chrome (fill, border,
radius, padding, heading weight, highlights, shelf gradient) faithfully. Only the
**palette and typeface come from tokens**; the card styling does not get "adapted away."

Fix each item **once at the block-component level** — all nine sections and the three
other case studies inherit it. Token column uses our `@theme` utilities.

---

## A · Three global fixes first (these cause most of the drift)

**A1 · Canvas vs card contrast is gone.** The page background must be the warm sand
`--color-canvas`; section cards are `--color-cream-50`. Right now both read near-white,
so cards disappear. Make sure the page/route bg is `bg-canvas` and section cards are
`bg-cream-50` — there must be a visible warm step between them.

**A2 · Section-card shell lost its chrome.** Every section card =
`bg-cream-50` + `border border-ink-950/8` + `rounded-[var(--radius-xl)]` (≈24px) +
generous padding (panel = 66×74px → our section padding). On `--color-canvas`, gapped.
Panel source: `.section{background:cream-50;border:1px solid line;border-radius:26px;padding:66px 74px}`.

**A3 · Fraunces headings render too light.** Panels use Fraunces 400 **with optical
sizing tracking size** (`font-optical-sizing:auto`), so display titles gain weight/contrast.
Our `next/font` Fraunces isn't tracking `opsz`, so headings come out thin. Fix: enable the
`opsz` axis / `font-optical-sizing:auto` on `--font-display`; if titles still look lighter
than the panel crops, load + apply **weight 500–600** for display headings. Match the
*presence* in the crops, not just the family.

Warm hairline = `border-ink-950/8` everywhere a panel used `--line rgba(120,90,60,.14)`.

---

## B · Per-block chrome (exact, from the panel CSS)

### Section header
- index: `font-display` italic, `--text-2xl`, `text-accent-500`
- eyebrow: `--text-eyebrow`, tracking `.2em`, uppercase, `text-text-subtle`, 600
- title (`.stitle`): `font-display` **opsz/weight per A3**, `--text-4xl`, `text-ink-950`, leading 1.04, max-w ~760px
- lead: `--text-lg`, `text-ink-600`, leading 1.62, max-w ~680px

### StatCard  ← currently broken (renders as borderless columns)
- card: `bg-cream-50` · `border border-ink-950/8` · `rounded-[var(--radius-lg)]` (≈18px) · padding 30px
- **highlighted variant**: `bg-cream-200` · `border-accent-500/35` — **must be visibly different** (the 90% card)
- number: `font-display`, `--text-5xl` (54–58px), `text-accent-500`; `%` as `.42em` superscript
- body: `--text-base` (15px), `text-ink-950`, mt 14
- tag: `--text-eyebrow`, 700, `text-accent-500`, **top hairline** `border-t border-ink-950/8`, pt 13
- These are 3 distinct cards in a grid — never table columns.

### PrincipleCard (Goals, Reflection)
- card: `bg-cream-200` · `border border-ink-950/8` · `rounded-[var(--radius-lg)]` · padding 30×28
- index: `font-display` italic, `--text-3xl` (38px in Goals/Reflection), `text-accent-500`
- title: `font-display`, `--text-2xl` (25–27px), `text-ink-950`, mt 12
- body: `--text-base` (15px), `text-ink-600`

### FeatureRow (Work) ← needs the giant ghost number back
- card: `bg-cream-50` · `border border-ink-950/8` · `rounded-[var(--radius-xl)]` (22px) · padding 40×54 · gap 52 · alternating (`rev` = row-reverse)
- ghost number: `font-display` italic, **~250px**, `text-accent-500/8`, absolutely positioned on the open side, `aria-hidden` (this is the device that fills the empty space — it's missing now)
- category: `--text-eyebrow`, tracking `.18em`, uppercase, `text-accent-500`, 600
- title: `font-display`, `--text-2xl` (31px), `text-ink-950`
- body: `--text-base` (16px), `text-ink-600`
- device: width ~268px desktop, no rotation here

### BeforeAfter (3 cards; Activity card is **image-right/copy-left** = `rev`)
- card: `bg-cream-50` · `border border-ink-950/8` · `rounded-[var(--radius-xl)]` (22px) · padding 32×46 · align-center · gap 50
- before image: `grayscale(.2)`; after image: full colour; baseline-aligned, uniform height
- caps: `--text-eyebrow` 700 uppercase `text-text-subtle`; "After" cap = `text-accent-600`
- change rows: 8px accent dot + bold `text-ink-950` + `text-ink-600` detail

### Stepper (Approach)
- container: flex · `border border-ink-950/8` · `rounded-[var(--radius-md)]` (16px) · overflow-hidden · `bg-cream-50`
- step: flex-1 · padding 22×24 · `border-r border-ink-950/8` (last none)
- dot: 9px `bg-accent-500`; label: `font-display` italic, `--text-lg` (19px), `text-ink-950`; text: `--text-sm`, `text-ink-600`

### GlanceGrid (Setup, 4-cell)
- grid 4-col, **gap 1px on a `bg-ink-950/8` track** + outer border + `rounded-[var(--radius-md)]` + overflow-hidden → hairline-divided cells
- cell: `bg-cream-50`, padding 22×24; label `--text-eyebrow` uppercase `text-text-subtle` 600; value `--text-base` 600

### PullQuote (Setup)
- `font-display` italic, `--text-3xl` (40px), `text-ink-950`, leading 1.22, `pl-[26px]`
- left bar: `::before` 3px `bg-accent-500`, `rounded-full`, inset top/bottom 8

### IssueList (Problem)
- `border-t border-ink-950/8`; numbered rows separated by hairlines; index `font-display` italic `text-accent-500` + text `text-ink-950`

### SwatchTokens (System) — **content colours stay literal hex**
- chips: swatch + label, `gap-2.5`, wrap; boAt's palette (boAt Red `#EC3A23`, Indigo `#4F46E5`, Heart `#FF4D6D`, SpO₂ `#3BC9FF`, Sleep `#A78BFA`) are **product data, literal hex** — do not tokenize.

### DeviceShelf (Hero + System) ← gradient pedestal is missing now
- shelf: **`bg-[linear-gradient(180deg,var(--color-cream-50),var(--color-cream-200))]`** · `border border-ink-950/8` · `rounded-[var(--radius-xl)]` (22px) · overflow-hidden · padding 48×40×0
- System dual (`sysduo`): same gradient, devices baseline-aligned, theme pills (`Midnight Ember` / `Daybreak`) = `bg-cream-50` · `border border-ink-950/8` · `rounded-full` · `--text-eyebrow` uppercase `text-text-subtle`
- hero device rotation/translate = **desktop only**, dropped at the `lg` breakpoint

### GlowWord (all sections)
- `font-display` italic, `text-accent-500/10`, absolute, leading .8, `aria-hidden`; hidden/shrunk at `lg`

### Annotation (Problem)
- dot 11px `bg-accent-500` + 4px halo `accent-500/15` → connector 1.5px×84px `bg-accent-500/50` → label (`--text-base` 700 `text-ink-950` + `--text-sm` `text-ink-600`)
- `.scrawl` = `font-doodle` (Caveat) 700, `--text-3xl`, `text-accent-500`, rotate −5°
- absolute on desktop; collapses to a caption list at `lg`; decorative parts `aria-hidden`

---

## C · What "acceptable drift" means now (recalibrated)

- **OK to differ:** exact px spacing/size from the fluid scale; sub-pixel type sizing.
- **NOT OK (must match the crop):** missing/!=radius, flat/borderless/no-fill cards, wrong
  heading weight, missing stat highlight, missing feature ghost number, missing device-shelf
  gradient, no canvas↔card contrast. These are the design, not noise.

---

## D · Prompt to paste into Claude Code

> The case-study page is structurally correct but the **card and heading styling drifted** —
> the "adapt to tokens" rule got over-applied and adapted away things that *are* the design.
> Fix it once at the **block-component level** (so all sections and the future studies inherit
> it), using `docs/case-study-page/block-style-spec.md` as the exact spec. Only palette and
> typeface come from tokens; card chrome is reproduced faithfully.
>
> Do the three global fixes first: (A1) page bg = `bg-canvas`, section cards = `bg-cream-50`,
> so there's visible warm contrast between them; (A2) restore the section-card chrome —
> `bg-cream-50` + `border-ink-950/8` + `rounded-[var(--radius-xl)]` + padding; (A3) Fraunces
> headings render too light — enable `font-optical-sizing:auto` on `--font-display` and, if
> still lighter than the panel crops, apply weight 500–600 to display headings.
>
> Then fix each block component to the spec: `StatCards` (bordered, rounded, cream-filled
> cards with the 90% **highlight** restored — not text columns), `FeatureRows` (giant faint
> ghost number back), `BeforeAfter`, `PrincipleCards`, `GlanceGrid`, `PullQuote`, `Stepper`,
> `DeviceShelf` (the cream **gradient pedestal** + radius), `GlowWord`, `Annotation`.
>
> Gate **per block type, not per section**: screenshot one instance of each block against its
> panel crop and fix until the chrome matches — radius, border, fill, heading weight,
> highlight, shelf gradient, canvas/card contrast must match; only spacing/size may drift.
> When a block is fixed, every section using it is fixed. Don't touch content, copy, or the
> data files — this is purely the block components' styling. Show me StatCards, FeatureRows,
> and the Hero/DeviceShelf first.
