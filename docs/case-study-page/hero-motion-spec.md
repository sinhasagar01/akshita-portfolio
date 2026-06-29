# Hero motion — "Rise / calm" (concept C, iteration 2)

A one-time mount animation for the case-study hero. The stacked phones rise from a
soft blur and settle with a gentle parallax (front leads, back trails and drifts to
its spread position); the copy resolves in sync — title clip-reveals, lines fade up,
the ★4.2 chip pops last, and the "crest" watermark fades in behind. Calm, editorial,
premium. Total timeline ≈ **1.75s**.

## Principles
- **Trigger once on mount** — the hero is above the fold, so this is NOT a scroll/inview
  reveal. Do not route it through `RevealSection`.
- **Animate INTO the existing layout.** Every "from" value below is an *offset applied to
  each element's existing resting transform*. The final/resting state is unchanged — only
  the entrance is added. Don't restyle the static hero.
- **Scope to the hero component only.** No other section, no shared/global file, no
  homepage impact.

## Easing
- `expo` (phones) = `cubic-bezier(0.16, 1, 0.3, 1)` — easeOutExpo
- `cubic` (text) = `cubic-bezier(0.33, 1, 0.68, 1)` — easeOutCubic
- `back` (chip pop) = `cubic-bezier(0.34, 1.56, 0.64, 1)` — easeOutBack

## Timeline (delays/durations in ms; from → resting)

| Element | From (offset from resting) | Delay | Dur | Easing |
|---|---|---|---|---|
| Stack opacity | 0 → 1 | 0 | 490 | cubic |
| Stack blur | `blur(8px)` → `blur(0)` | 0 | 875 | cubic |
| **Front phone** | translateY **+56px**, rotate **−2°**, scale **.94** → resting | 90 | **1435** | expo |
| **Back phone** | translateX **+130px** (sits stacked over the front), translateY **+64px**, rotate **+6°**, scale **.93** → resting | 90 | **1570** | expo |
| Glow "crest" | opacity 0 → ~0.12 | 175 | 1225 | cubic |
| Overline | opacity 0, translateY +16 → 0 | 90 | 650 | cubic |
| **Title** (clip-reveal) | inner translateY **108%** → 0, inside an `overflow:hidden` mask | 175 | 700 | cubic |
| Thesis | opacity 0, translateY +16 → 0 | 385 | 650 | cubic |
| Body | opacity 0, translateY +16 → 0 | 560 | 650 | cubic |
| Meta grid | opacity 0, translateY +16 → 0 | 700 | 650 | cubic |
| **Chip** (pop) | opacity 0, translateY +14, scale **.9** → 1 | 770 | 650 | back |

Front finishes ~140ms before the back phone — that gap is the parallax; keep it.
(The lab used ~875ms text fades; the 650ms here reads a touch crisper while staying calm. If you want it slower, bump text durations back to ~850.)

## Reduced motion
On `prefers-reduced-motion: reduce`, **skip the entrance entirely** — render every
element at its resting state immediately (no transform, no blur, glow at ~0.12, full
opacity). With Framer Motion use `useReducedMotion()` to swap to a no-op variant; with
GSAP, guard the timeline behind the media query.

## Mobile (≤ lg / 1024px)
Gentler, no horizontal spread (the phones don't fan on narrow screens): translateY from
**+32px**, scale from **.96**, `blur(4px)`, total ~1.2s, same stagger shape. Still
respect reduced motion. No perspective/rotateY anywhere (this concept has none — keep it
that way).

## Framer Motion sketch (adapt to the real hero markup)
```tsx
const reduce = useReducedMotion();
const EXPO = [0.16, 1, 0.3, 1] as const;
const CUBIC = [0.33, 1, 0.68, 1] as const;
const BACK  = [0.34, 1.56, 0.64, 1] as const;
const show = reduce ? "show" : "show"; // when reduce, give variants no transition (instant)

// helper: a fade-up line
const line = (delay: number) => ({
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: reduce ? { duration: 0 } : { delay, duration: 0.65, ease: CUBIC } },
});

// phones (wrap each DeviceImage; from-values are offsets ON TOP of the resting transform)
const frontPhone = {
  hidden: { y: 56, rotate: -2, scale: 0.94 },
  show: { y: 0, rotate: /*resting*/ 0, scale: 1, transition: reduce ? {duration:0} : { delay: 0.09, duration: 1.435, ease: EXPO } },
};
const backPhone = {
  hidden: { x: 130, y: 64, rotate: 6, scale: 0.93 },
  show: { x: 0, y: 0, rotate: /*resting*/ 0, scale: 0.94, transition: reduce ? {duration:0} : { delay: 0.09, duration: 1.57, ease: EXPO } },
};
// stack wrapper animates blur+opacity (filter via style/animate)
// title: wrap text in <span className="block overflow-hidden">, inner motion span y:"108%" → 0
// chip: { hidden:{opacity:0,y:14,scale:.9}, show:{opacity:1,y:0,scale:1, transition:{delay:.77,duration:.65,ease:BACK}} }
```
Container uses `initial="hidden" animate="show"` on mount. Use explicit per-element
`delay` (not uniform `staggerChildren`) to hit the timing above. If the hero already runs
on GSAP, a single `gsap.timeline()` with the same delays/eases is equally fine — match
the table, don't approximate.

## Constraints
- Animate into the **existing** resting transforms — don't change the static composition,
  device sizes, or spread.
- Phones carry **no shadow** in the resting state (this concept adds none — good).
- Hero only. No `RevealSection`, no other section, no global/shared/homepage changes.
- Keep the "crest" `GlowWord` (it fades in as part of this).

---

## Prompt to paste

> Add a one-time mount entrance animation to the case-study **hero only** — concept "Rise /
> calm", per `docs/case-study-page/hero-motion-spec.md`. Implement the exact timeline,
> offsets, and easings in that table (don't approximate). It animates INTO the existing
> resting layout — the static composition, device positions, and sizes stay unchanged; only
> the entrance is new. Trigger once on mount (the hero is above the fold — do NOT use
> RevealSection). Honor `prefers-reduced-motion` by rendering the resting state instantly.
> Add the gentler mobile variant (≤1024px) from the spec. Scope everything to the hero
> component — no other section, no RevealSection, no shared/global/homepage changes. When
> done, run the dev server and show me the hero entrance.
