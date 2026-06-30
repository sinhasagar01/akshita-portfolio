# Before → After section — build spec ("scroll-pinned comparison story", cs-07)

Replaces the three static before/after cards with **one scroll-pinned panel** that steps
through the three screen comparisons — **Home → Activity → Vitals** — one at a time. The
section pins to the viewport (like the homepage process section) and scroll progress
drives everything: the **after-screen scrolls top-to-bottom inside the real device
bezel** while the **before sits still** beside it, the **01/02/03 change notes light up**
in time, a **progress bar** tracks position, and a left **rail** (Home/Activity/Vitals)
shows which screen you're on. Reference prototype: `before-after-pinned.html` (approved).

The mechanic is deliberate: scrolling the page *is* scrolling the redesigned screen — the
interaction demonstrates the section's headline change ("now it scrolls / it's calm").

## Scroll mechanics (the pin)
- Same engine as the homepage process section: GSAP **`ScrollTrigger`** with
  **`pin: true`** + **`scrub`** on a tall track. The section gets a **~`300vh`** scroll
  track (≈ one viewport-height per pair); a `position: sticky` inner panel pins to the
  viewport while the track scrolls past.
- Track progress **`p` (0 → 1)** maps to the three segments. For pair `i` (0,1,2):
  **`phase = p*3 − i`**. The pair is "active" while `0 ≤ phase ≤ 1`.
- **Per active pair**, `phase` (eased, see below) drives: the after-scroll, the progress
  bar (`width = clamp(phase)·100%`), the change-note reveal, and the rail-active state
  (`active = floor(p*3)`, clamped 0–2).
- **Segment crossfade:** near a boundary (window `W ≈ 0.12`), the leaving pair fades out
  and the entering pair fades in (opacity only — no slide; the motion is the in-phone
  scroll, not the panel).
- Provide `prefers-reduced-motion` + mobile fallbacks (below) — no pin/scrub there.

## Per-pair phone — three-layer auto-scroller (reused from the Work section)
Identical structure and geometry rules to `work-section-spec.md`; the only difference is
**scroll is driven by `phase`, not a timer**. Per scrollable (after) phone:
- **`.win`** (z1): `overflow:hidden`; a `content` wrapper holds the body `<Image>`
  (`*-after-body.png`), translateY-scrolled by `−eIO(clamp(phase)) · scrollRange`.
- **`.footer`** (z2): pinned bottom bar (`*-after-footer.png`), `overflow:hidden`,
  `border-radius:0 0 R R`.
- **`.frame`** (z3): the shared `phone-frame-bezel.png` overlay (fixed status bar, side
  rails, rounded bottom).
- Two pinned **scroll-edge blur** strips (~24px, `backdrop-filter:blur(5px)`, mask-faded)
  under the status bar and above the footer.
- The **before phone** is the static full image (`*-before.png`) behind the same bezel —
  no win/footer, no scroll. (The old design crammed everything onto one screen, so there
  is nothing to scroll — that stillness is the point.)

### Geometry (1030px-wide space; from PNG dims, not `offsetHeight`)
`INSET=30`, `win_top=110`, `screen_bottom=2138`, `radius=100`. `footerTop = 2138 −
footerH`; `.win` covers `[win_top, footerTop]`; **`scrollRange = (bodyH − (footerTop −
win_top))`** as a ratio of `bodyH` for a `%` translate (so it's resolution-independent).
`win_top=110` tucks the scroll box under the status bar (no seam); the body/footer split
sits in the gap **above** each screen's bottom bar (pre-cut). `bodyH`/`footerH` come from
the static-import `.height`.

Per pair (from the cut assets):

| Pair | after body H | after footer H | note |
|---|---|---|---|
| Home | 2388 | 224 | footer = bottom nav |
| Activity | 1966 | 80 | no bottom bar → footer is just the home-indicator chin; scrolls only a little |
| Vitals | 2189 | 252 | footer = "Measure now" button |

### Easings
`eIO(t) = t<.5 ? 2t² : 1−(−2t+2)²/2` (ease-in-out, the after-scroll); reuse `clamp`,
`lerp`. The change-note reveal lights item `j` when `clamp(phase) ≥ 0.12 + j·0.28`.

## Layout (pinned panel, ~1000px content)
- **Header (persistent):** `07 · Before → After` index/eyebrow, title "The same job, made
  calm.", and the **2.3★ → 4.2★** rating as a single hero stat top-right (shown once, not
  per pair).
- **Left rail:** `Home / Activity / Vitals` with a connecting spine; active item filled
  (accent), others dimmed. (Reuse the homepage process rail styling if one exists.)
- **Stage (3 columns):** `before phone` · `center` · `after phone`. Before is **always on
  the left** (the rail anchors the left edge; alternating sides doesn't suit a single
  pinned comparison — this is a deliberate change from the old static section's L/R/L).
- **Center column:** screen name (`text-2xl` Fraunces), "Scroll to explore the redesign"
  tag, the **01/02/03 change list** (reveals with scroll), and a thin **progress bar**
  (accent fill).
- Phones carry a **soft grounding shadow** (`drop-shadow`, ~`0 20px 30px rgba(...,.2)`) —
  unlike the Work story's no-shadow rule; here the devices sit on the cream card and a
  faint shadow reads as polish, consistent with `DeviceImage` elsewhere.

## Reduced motion (`prefers-reduced-motion: reduce`)
No pin, no scrub, no auto-scroll. Render the **three pairs stacked** as static before/after
comparisons (each after at the **top** of its screen), the rail becomes plain step labels,
the change notes are all visible, the progress bar is hidden. End state always readable.

## Mobile (≤ `lg`, 1024px)
Pinning is fragile on mobile, so **don't pin**: stack the three pairs as static
comparisons (before over after, or side-by-side if it fits), each after at top, change
notes below, the rail collapses to a small "Home / Activity / Vitals" step label per pair.
Same `lg` breakpoint the rest of the site uses.

## Data + types (additive, case-study-internal)
- **`lib/case-studies/types.ts`**: add a block kind
  `{ kind: "beforeAfterStory"; pairs: BAPair[] }` where
  `BAPair = { name: string; before: StaticImageData; after: { body: StaticImageData;
  footer: StaticImageData }; changes: { index: string; title: string; body: string }[] }`.
  The existing `beforeAfter` block stays for any other study. `Section.variant` already
  supports `"static"` (added for Work) — reuse it so this section isn't wrapped in
  `RevealSection` (it runs its own ScrollTrigger).
- **`lib/case-studies/boat-crest.ts`** (section 07 only): swap its `beforeAfter` block for
  `beforeAfterStory` with the three pairs, static-importing the `scroll-assets/` PNGs.
  Copy/changes below; the rating stat is section-level (in the header), not per pair.
- **`BlockRenderer.tsx`**: add a `beforeAfterStory` case → `<BeforeAfterStory pairs=… />`.
- **`SectionRenderer.tsx`**: already routes `variant:"static"` to the static (no-Reveal)
  wrapper — nothing to change if Work's edit landed.

## Component
- **New `components/case-study/blocks/BeforeAfterStory.tsx`** (`"use client"`). Holds the
  ScrollTrigger pin/scrub, the `setProgress(p)` paint (after-scroll + bar + reveal + rail
  + crossfade), the three-layer scroller markup, and the reduced-motion / mobile static
  fallbacks. Mirrors `WorkStory.tsx` structure; reuses the same geometry helpers and the
  shared `phone-frame-bezel` import.
- Decorative parts (`aria-hidden`): the rail, progress bar, and phone layers. The content
  is carried by the per-pair **screen name + change list** (real text), always present
  (visible in the reduced-motion/mobile static render).

## Assets (`public/work/boat-crest/scroll-assets/`)
Shared: `phone-frame-bezel.png`. Per pair: `ba-<pair>-before.png` (full, fills the bezel),
`ba-<pair>-after-body.png` (scrolling), `ba-<pair>-after-footer.png` (pinned bar).
- Home: `ba-home-before` · `ba-home-after-body` (2388) · `ba-home-after-footer` (224)
- Activity: `ba-activity-before` · `ba-activity-after-body` (1966) · `ba-activity-after-footer` (80)
- Vitals: `ba-vitals-before` · `ba-vitals-after-body` (2189) · `ba-vitals-after-footer` (252)
PNG (bezel + footers need alpha; bodies keep text crisp). Load via `next/image`
(auto WebP/AVIF, keeps alpha); body/footer heights come from the static-import `.height`.

## Verification
- `npm run typecheck`; clean `npm run build` (confirms static imports + `"use client"`).
- Load `/projects/boat-crest`, scroll into section 07. Confirm: it **pins**; scroll steps
  Home → Activity → Vitals one at a time; the after-screen scrolls in the bezel while the
  before stays still; 01→02→03 light up; the progress bar fills; the rail tracks the active
  screen; the rating stays in the header.
- **Known headless limit** (same as Work/hero): ScrollTrigger needs real scroll + a visible
  page, which the headless preview can't fully drive — verify the pinned DOM, geometry, no
  shadow on the *Work* phones vs the soft shadow here, and the static fallback; confirm the
  pin/scrub on the live dev server.
- Reduced motion: pairs render stacked + static, after at top, nothing auto-moves.
- `preview_resize` mobile (≤lg): no pin, stacked static pairs, rail collapses to step labels.

## Prompt to paste
> Build the Before → After section ("07") as a scroll-pinned comparison story per
> `docs/case-study-page/before-after-section-spec.md`, matching the prototype
> `docs/case-study-page/before-after-pinned.html`. Pin the section (GSAP ScrollTrigger
> pin + scrub, ~300vh track, sticky inner panel — same as the homepage process section)
> and step through three comparisons one at a time: Home → Activity → Vitals. In each, the
> after-screen auto-scrolls top-to-bottom inside the genuine device bezel (three-layer
> scroller + scroll-assets, geometry from the spec / PNG dims) driven by scroll progress,
> while the before sits static beside it; the 01/02/03 change notes light up with scroll,
> a progress bar fills, and a left rail (Home/Activity/Vitals) tracks the active screen.
> The 2.3★→4.2★ rating is a single header stat. Add a `beforeAfterStory` block kind →
> BeforeAfterStory.tsx (keep the existing `beforeAfter` block), wire boat-crest.ts section
> 07 to it with variant:"static" (no RevealSection — it runs its own ScrollTrigger); the
> types/BlockRenderer/SectionRenderer changes are additive. Honor prefers-reduced-motion
> and mobile (≤lg) by NOT pinning — render the three pairs as stacked static before/after
> comparisons (after at top), rail as step labels. Phones get a soft grounding shadow.
> Scope to the new component + boat-crest content; no homepage/global changes.
> Don't code yet — show me the plan.
