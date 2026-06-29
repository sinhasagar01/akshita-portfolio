# Work section — build spec ("auto-playing pinned story")

Replaces the five stacked feature rows in the Work section with **one pinned frame**
that auto-advances through the five features, with manual prev/next arrows. The phone
shows each screen **auto-scrolling inside the real device bezel** (pinned status bar +
bottom bar). Reference prototype: `docs/case-study-page/work-pinned-autoscroll.html`
(the approved feel); assets in `scroll-assets/`.

## Behavior (locked)
- **Auto-play, continuous.** On entering the section, it cycles the five features on a
  timer. **Dwell = 5s** per feature, **entrance = 0.85s**. It loops 05 → 01.
- **Hover does NOTHING.** No hover-pause anywhere. Autoplay never stops on pointer-over.
- **Manual skip = click only.** Left arrow → previous feature, right arrow → next. Each
  click runs the **same full entrance transition** as an auto-advance, then **autoplay
  continues from the landed slide** (the 5s dwell restarts there). No lingering pause, no
  "resume after idle" — just skip-and-continue.
- **Keyboard.** ← / → mirror prev / next (when the section is focused / in view).
- **Start on scroll-in.** Begin the timer when the section enters the viewport
  (IntersectionObserver), not on page load. Stop/!start when fully out of view (don't
  burn rAF off-screen).

## Layout (one card, ~1000px content width)
- Header: index `06` (Fraunces italic, accent) + eyebrow `The Work` + title
  "Where the redesign lives." (uses the existing case-study section header).
- Stage (two-column): **copy left** (Feature 0X · category eyebrow · Fraunces title ·
  description), **phone right**, with a giant faint **ghost number** (current feature)
  behind, accent ~7–8%, `aria-hidden`.
- **Journey rail** below: dots `01…05` joined by segments; segments fill cumulatively and
  the active segment fills as a **countdown** toward the next auto-advance. Active dot in
  accent.
- **Controls, centered, bracketing the status** (placement ④): `‹  status  ›`. Status =
  "auto-playing". Arrows = ~40px circles (≥44px hit area on mobile), hairline border
  `border-ink-950/8`, chevron in `ink-600`, hover/focus → accent. `aria-label`
  Previous/Next feature, visible focus ring.

## Per-feature entrance (reuse the hero curves)
Each time a feature becomes active (auto OR manual), animate over **0.85s**:
- **Phone:** new screen enters from `translateY(+46px) scale(.95) blur(6px) opacity(0)` →
  resting, `cubic-bezier(0.16,1,0.3,1)` (easeOutExpo). Outgoing screen drifts
  `translateY(-26px) scale(.97)` and fades. Two-layer crossfade.
- **Copy stagger** (easeOutCubic, `translateY(+14px)→0`, opacity 0→1): Feature number
  (delay 0) → category (≈+0.10) → **title clip-reveals** through an `overflow:hidden`
  mask, inner `translateY(108%)→0` (≈+0.16) → description (≈+0.28).
- **Ghost number:** cross-fades to the new numeral, slight scale `.92→1`.
- Phones carry **no shadow** (consistent with the rest of the case study).

## Phone — auto-scrolling screens inside the real bezel
The phone is the **genuine device bezel** with the full screen scrolling inside it during
the dwell (NOT a cropped still, NOT gif/video — live CSS: sharp, light, theme-able).
Assets in `scroll-assets/` (+ `geometry.json`); geometry is in a 1030px-wide space.

**Three layers per scroller** (z order):
- **`.win`** (z1, scrolling body): app body between the status bar and the bottom bar — a
  `<img>` (`*-body.png`) translateY-scrolled inside an `overflow:hidden` box.
- **`.footer`** (z2, pinned bottom bar): the screen's nav/CTA + chin (`*-footer.png`),
  fixed at the bottom, `border-radius:0 0 R R` + `overflow:hidden` (R = screen radius).
- **`.frame`** (z3, bezel): `phone-frame-bezel.png` — feature 01's real bezel with the
  app-body window cut as a **rounded** rect (keeps the bezel's corner curve) and the
  status-bar bottom darkened. Supplies the fixed status bar, side rails, notch, rounded
  bottom.

**Geometry (`geometry.json`):** screen x[30,1000] y[130,2138], radius 100.
`footerTop = 2138 − footerH`; `.win` covers [win_top, footerTop], `.footer` [footerTop,
2138]. **`win_top = 110`** (not 130): the scroll box tucks ~20px UP under the opaque
status bar so the page background never shows through a seam. **The body/footer split
(`barTop`) MUST sit in the dark gap ABOVE each button** — never inside it — so the whole
bar is in the fixed footer and fully visible at every scroll position (a split mid-button
shows only half until you scroll — real bug we hit).

**Scroll motion:** after the entrance, drift `translateY` from 0 to
`−(bodyH − (footerTop − win_top))·scale` across the dwell, **slow and gentle**
(ease-in-out, ~35–50px/s). Reset to 0 on every slide change. Compute the range from the
**known asset dimensions**, not `offsetHeight` (0 before the image decodes — another bug
we hit). **Onboarding (01)** is a single viewport: full static `feature-01-onboarding.png`,
no scroll.

**Scroll-edge blur:** a ~24px `backdrop-filter: blur(5px)` strip, mask-faded, under the
status bar AND above the footer — identical top and bottom (iOS scroll-edge). No heavy
dark gradients.

## Reduced motion (`prefers-reduced-motion: reduce`)
- **No auto-play, no entrance, no auto-scroll.** Each screen rests at the top of its scroll.
- Keep the **arrows fully functional** (click/keyboard) so the content is still reachable;
  changes are instant cross-fades at most, no transform/blur.
- Consider showing all five as the **original stacked rows** under reduced motion if that's
  simpler and fully accessible — either is fine, but nothing should auto-move.

## Data
Five features, in order, from the Work content (already in the content file):
`01 Onboarding (17-onboarding-pair) · 02 Navigation (01-home) · 03 Insights (04-heart-rate)
· 04 Personalisation (12-watchface-studio) · 05 Social (13-fit-crew)` — titles and copy
unchanged from the panels. Screens from `public/work/boat-crest/`.

## Implementation notes
- Framer Motion or a small rAF loop are both fine; match the timings above, don't
  approximate. A single timer drives auto-advance; `goTo(i)` resets the dwell and replays
  the entrance; prev/next call `goTo` and let the timer continue.
- Scope **everything to the Work section component** — no other section, no
  `RevealSection` wrapper on this one (it manages its own in-view start), no shared/global
  or homepage changes.
- Mobile (≤lg): gentler entrance (less travel, no blur), arrows ≥44px with more spacing,
  rail labels shrink; same skip-and-continue logic.

## Prompt to paste
> Rebuild the Work section ("06 The Work") as an auto-playing pinned story per
> `docs/case-study-page/work-section-spec.md`, matching the prototype
> `docs/case-study-page/work-pinned-autoscroll.html`. Replace the five stacked feature
> rows with one pinned frame that auto-advances (5s dwell, 0.85s entrance) through the
> five features, looping. Inside the phone, render the genuine device bezel as a fixed
> overlay (status bar + bottom bar pinned) with the screen body **auto-scrolling** behind
> it during the dwell — slow gentle drift, reset on slide change — using the three-layer
> structure and `scroll-assets/` (frame bezel + per-screen body/footer, geometry in
> geometry.json; the body/footer split sits in the gap ABOVE each button; win_top tucks
> under the status bar; footer + frame cut are rounded to the screen radius; iOS-style
> scroll-edge blur top and bottom). Onboarding (01) is static (no scroll). Hover must NOT
> pause. Prev/next arrows (centered, bracketing the status) and ← / → keys skip one
> feature with the same full entrance, after which autoplay continues from the landed
> slide — no lingering pause. Start the timer on scroll-into-view via IntersectionObserver.
> Honor prefers-reduced-motion (no autoplay/entrance/auto-scroll; screens rest at top;
> arrows still work). Phones carry no shadow. Scope everything to the Work section
> component — no RevealSection on it, no shared/global/homepage changes. Show me the
> section running when done.
