# Design system reference

The tokens, the scales and the rules that decide which treatment a new element gets.

## How this was derived, and how to read it

Every value here comes from one of three places, and each is marked.

- **Source.** A `file:line` citation. The file is the authority.
- **Measured.** A live reading, with the viewport and the page stated beside it.
- **Compiled.** An answer from the Tailwind compiler itself, asked the way `css-comment-trap` asks it.

Nothing here is copied from a contract in `docs/studio`. Those mocks have been measurably wrong
roughly half the time, and `docs/STATE.md` is a record of decisions rather than evidence for them.
Where a comment inside the code disagrees with the code, the code wins and the disagreement is
noted.

**Measurement context.** Viewport 1440 by 900, dev server on port 3457. Public numbers come from
`/blog/what-a-data-table-teaches-you-about-trust`. Studio numbers come from
`/studio/projects/elevate-one-view`, never `boat-crest`, which is bespoke and renders no sections
board.

**Contrast method.** Ratios are rasterised. Each colour is painted into a 1 by 1 canvas and read
back with `getImageData`, so the browser does the conversion. `getComputedStyle` hands back
unconverted `oklch()` here, and parsing that string is how a contrast harness reports 1.0 for
everything. The sanity pair runs first and white on black must read 21. It did. Every ratio below
names the ground it belongs to, because a ratio without a ground is not a number.

---

## A. Tokens

All of these live in one `@theme` block, the `@theme` block in `app/globals.css`.

### The colour scales

| Scale | Steps that exist | Source |
|---|---|---|
| ink | 950, 800, 600, 400, 200 | globals.css:34-38 |
| cream | 50, 100, 200, 300 | globals.css:25-28 |
| accent | 400, 500, 600 | globals.css:40-42 |
| success | 50, 700 | globals.css:73-74 |
| on-dark | band-dark, on-dark, on-dark-muted, on-dark-quote, on-dark-line | globals.css:66-70 |
| single-purpose | danger-600, glow-web, draft-600, canvas, case-study-sand | globals.css |

Semantic aliases sit on top, `app/globals.css`, at `--color-text-primary`. `text-primary` is ink-950, `text-secondary` is
ink-600, and `text-muted` and `text-subtle` are both `oklch(51% 0.016 66)`, a value tuned to the
lightest warm ink that still clears 4.5 on the hardest light surface.

**There is no ink-500 and no ink-700.** Both were considered and declined. A bare theme utility is
generated only when its token exists, so `text-ink-500` emits nothing at all and the element draws
whatever it inherits. Confirmed by asking the compiler, which returns zero bytes for `text-ink-500`
and `text-ink-700` and a real rule for `text-ink-600`. Fifty-one live sites carried those two names
before `studio-tokens` was written.

### Contrast, per ground

Rasterised, sanity pair asserted. Text foreground against the four grounds a studio surface can be.

| Foreground | cream-50 | cream-100 | cream-200 | canvas |
|---|---|---|---|---|
| ink-950 | 19.04 | 18.13 | 16.49 | 15.73 |
| ink-800 | 14.87 | 14.16 | 12.87 | 12.28 |
| ink-600 | 7.42 | 7.06 | 6.42 | 6.13 |
| ink-400 | **3.49** | **3.33** | **3.02** | **2.89** |
| accent-500 | 4.70 | **4.48** | **4.07** | **3.89** |
| accent-600 | 7.22 | 6.87 | 6.25 | 5.96 |
| text-muted | 5.52 | 5.25 | 4.78 | 4.56 |
| danger-600 | 7.70 | 7.33 | 6.66 | 6.36 |
| draft-600 | 6.35 | 6.04 | 5.49 | 5.24 |
| success-700 | 6.58 | 6.27 | 5.70 | 5.44 |

Bold entries are under the 4.5 small-text floor.

**Two rules fall straight out of that table.** `ink-400` is not a text colour on cream on any step.
`accent-500` is a text colour on cream-50 alone, and misses cream-100 by 0.02. `accent-600` is the
accent that travels, clearing every step.

On the ink sidebar, cream-50 reads 19.04, ink-200 reads 10.64, ink-400 reads 5.45 and accent-500
reads 4.05.

### Type

⚠ THIS SECTION NAMED THE WRONG TYPEFACES FOR THE WHOLE SITE. It read *"Fraunces is `--font-display`
and DM Sans is `--font-body`"*, cited to `globals.css:112-116`. Grep the declarations: `--font-display`
resolves to Source Serif and `--font-body` to Work Sans. **Fraunces and DM Sans are loaded by
`components/sections/hero-fonts.ts` and scoped to the hero alone**, which is a deliberate second
typographic system rather than the site's.

⚠ AND THE CITATION POINTED AT AN UNRELATED COMMENT. `globals.css:112-116` is prose about a
dark-ground token. The two other citations in this section were equally adrift — the ramp cited at
118-127 and the role tokens at 130-135 sit at 593-602 and 605-610. **All three were in range and all
three named the wrong lines**, which is why a range check does not catch this.

⚠ SO THIS SECTION CITES TOKEN NAMES RATHER THAN LINE NUMBERS. A line number is the most decay-prone
claim a document can carry — every edit above it moves it and nothing re-reads it, and this file has
grown past 470 lines since these were written. `grep -n -- '--font-display:' app/globals.css` is
exact, and it stays exact.

**Site-wide, `app/layout.tsx` loads Source Serif, Work Sans, Space Grotesk, Kaushan Script and
Caveat.** `--font-display` is Source Serif and `--font-body` is Work Sans. Kaushan Script is the
wordmark and the footer signature; Caveat is `AnnotatedImage`. A mono stack exists with no webfont
behind it site-wide, though the hero loads JetBrains Mono for its own use.

The fluid ramp is ten `clamp()` steps from `--text-xs` at 0.694rem-0.75rem up to `--text-6xl` at
3.5rem-6.5rem.

Six semantic role tokens sit beside the ramp, from `--text-section-heading` to `--text-tag`.

| Token | Value | Role |
|---|---|---|
| `--text-section-heading` | 2.25rem | display serif italic 400, every section h2 |
| `--text-subheading` | 1.875rem | display serif italic 400, item names |
| `--text-eyebrow` | 0.75rem | body sans uppercase, 0.14em tracking |
| `--text-ui-label` | 0.75rem | body sans 500 uppercase, 0.08em tracking |
| `--text-meta` | 0.75rem | body sans 500, 0.08em tracking |
| `--text-tag` | 0.6875rem | body sans 400 |

`--text-eyebrow` is read by sixteen non-studio files, which is why the studio sizes its labels with
a local literal instead. See B.

### Radius, and the two inherited steps that are live

Declared in `app/globals.css` at `--radius-sm`.

| Step | Value |
|---|---|
| sm | 0.25rem |
| md | 0.5rem |
| lg | 1rem |
| xl | 1.5rem |
| full | 9999px |

**The ramp stops at xl on purpose, and stopping is not the same as removing.** Tailwind ships its
own radius defaults and `@theme` overrides only the steps it redeclares, so `--radius-2xl` at 1rem
and `--radius-3xl` at 1.5rem survive underneath. Both utilities compile. Asked directly, the
compiler returns `.rounded-2xl { border-radius: var(--radius-2xl) }`, and Tailwind's own
`theme.css` sets that variable to 1rem.

So `rounded-2xl` renders **equal to lg** and **smaller than xl**, and `rounded-3xl` renders exactly
`xl`. The name says a step up and the screen shows a step down. This is hazard 24 and it is gated,
see F.

### Shadow, and why there are three scales rather than one

These are three different families for three different jobs. Reaching into the wrong one is a
regression wearing a migration's clothes.

**The site scale**, `app/globals.css`, at `--shadow-sm`. `--shadow-sm`, `--shadow-md`, `--shadow-lg`, warm oklch
ink, topping out at `0 12px 32px oklch(14% 0.018 60 / 0.10)`.

**The studio card-lift scale**, `app/globals.css`, at `--studio-lift-rest`. A card lifting off a grid.

| Token | Role |
|---|---|
| `--studio-lift-rest` | every card at rest |
| `--studio-lift-hover` | the card under the pointer, paired with a 3px rise |
| `--studio-lift-active` | the selected card, deeper than hover and with no rise |

**The studio overlay scale**, `app/globals.css`, at `--studio-lift-popover`. Surfaces that float over the page.

| Token | Role |
|---|---|
| `--studio-lift-popover` | a dropdown or listbox panel, attached to its trigger |
| `--studio-lift-floating` | the publish bar, the block toolbar, the link dialog |
| `--studio-lift-modal` | the modal, over an already dimmed page |

**The boundary between the two studio families is a measurement, not taste.** Measured as darkening
against a cream-100 ground, with reach as blur plus spread, the heaviest card step is lighter than
every overlay but the popover. Modal reads 2.845 at reach 36 where lift-active reads 1.584 at reach
20. Repointing the modal onto the card scale would cut its darkening by 44 percent and halve its
reach.

The overlay family also keeps a literal ink, `rgb(60, 45, 30)`, where every other shadow uses
ink-950 at `rgb(15, 7, 3)`. No declared token is closer than ink-800, so the literal stays rather
than being folded onto a token that would move every floating surface.

### Motion, and the namespace that generates nothing

Easings, `app/globals.css`, at `--ease-spring`. `--ease-spring`, `--ease-out-expo`, `--ease-in-expo`.
Durations, `app/globals.css`, at `--duration-fast`. `--duration-fast` 150ms through `--duration-crawl` 1200ms.

**`--duration-*` is not a Tailwind v4 namespace and `--ease-*` is.** Asked directly, the compiler
returns nothing for `duration-fast`, `duration-base` and `duration-slow`, and a real rule for
`ease-out-expo`, `ease-spring` and `ease-in-expo`. `duration-*` resolves from
`--transition-duration-*` instead.

The consequence has two spellings and only one of them works.

| Written | Compiles to | Result |
|---|---|---|
| `duration-fast` | nothing | dead, emits no CSS |
| `duration-[--duration-base]` | `transition-duration:--duration-base` | dead, invalid value the browser drops |
| `duration-[var(--duration-fast)]` | `transition-duration:var(--duration-fast)` | **works** |

All three verified in the built bundle, not inferred. The last one works because Tailwind emits
`--duration-fast:.15s` into the stylesheet once something references it.

### Z index

Eight tokens, `app/globals.css`, at `--z-below`, from `--z-below` at -1 to `--z-toast` at 60. **`--z-*` is not
a namespace either.** The compiler returns nothing for `z-modal` and `z-overlay`, so these are
consumable only through `var()` or by writing the number. `--z-overlay` at 40 and `--z-modal` at 50
are the two that reach the bundle, because those are the two something references.

---

## B. The studio system

### The three role scales

Every studio scale is named by what a thing **is**, never by what it is worth, so a new element can
be placed without reading every call site to infer the rule.

**Radius**, scoped custom properties at `app/globals.css`, at `--studio-radius-panel`.

| Token | Value | Applies to |
|---|---|---|
| `--studio-radius-panel` | 12px | a page-level shell, a panel, a list container, a sticky rail |
| `--studio-radius-card` | 8px | a row, a card inside a panel, anything floating over the page |
| `--studio-radius-control` | 4px | anything a person clicks or types into |

These are custom properties rather than `@theme` tokens because the site scale cannot express the
hierarchy. Halving 24, 16 and 8 lands on 12, 8 and 4, and there is no 12 in `@theme`. Control and
card coincide with the site's sm and md today and are still declared separately, so a change to one
scale cannot drag the other.

**Ground**, a ladder of three existing cream tokens, documented at `app/globals.css`, at `--color-studio-ground`.

| Ground | Role |
|---|---|
| cream-200 | **chrome**, a panel header, a panel footer, a list rail |
| cream-100 | **field surface**, anything that holds inputs |
| cream-50 | **the well**, the input itself and only the input |

**This ladder is deliberately not a set of custom properties**, unlike radius, and the difference is
the reason radius needed them. `@theme` had no 12px, so that value did not exist until the block
declared it. Here the three creams already exist and a `--studio-ground-*` layer would be a second
name for a value that already has an honest one. What was missing was the roles.

**The rule is relational and that is the part that keeps getting lost.** An input reads as a well
because it is one step lighter than the surface holding it, not because it is any particular
colour. Writing it as an absolute has been a live bug twice in a row. Inputs were set to cream-100,
which inverted the relation on the cream-100 inspector so field and ground came out identical. The
repair was written as another absolute, inputs to cream-50, which would have collided on the six
cream-50 entry panels.

Readonly is the one inversion. A readonly field takes cream-200, darker rather than lighter,
because it is chrome that happens to hold text.

**Selection**, one rule over three surfaces. A selected row is one step darker than **its own**
ground, plus a 3px accent-500 left bar.

| Surface | Ground | Selected fill |
|---|---|---|
| `ListDetailLayout` row | cream-200 | cream-300 |
| blog list rail post | cream-200 | cream-300 |
| block strip block | cream-100 | cream-200 |

> The prose table in `app/globals.css`, at `SELECTION: GROUND + 1 STEP`, still records the first row as cream-50 going to
> cream-100. That is stale. The list column began declaring cream-200 in #242 and the fill moved
> with it. `studio-ink` G1 reads the live values and is the authority, `ralph/tests/studio-ink.mjs`, at `G1`.

**The fill is not the signal and no cream fill could be.** Measured, each step of the ladder
separates by 1.05 to 1.19, and the accent tint the bar replaced sat at 1.15, inside that same band.
The bar carries it at 3.43 to 4.48, roughly thirty times the separation.

| Separation | Measured |
|---|---|
| cream-50 to cream-100 | 1.05 |
| cream-100 to cream-200 | 1.10 |
| cream-200 to cream-300 | 1.19 |
| accent bar on cream-100 | 4.48 |
| accent bar on cream-200 | 4.07 |
| accent bar on cream-300 | 3.43 |

Hover and selected share a fill by necessity. At 1.05 per step the ladder cannot encode rest, hover
and selected as three legible fills, so the bar is what separates them.

### The decision rules

These pick a treatment from a property of the thing, so a new surface does not need a precedent.

**Section headers, by role.**

| Surface | Treatment |
|---|---|
| inspector pane | ink band, `bg-ink-950 px-3 py-2` with `.sechead` |
| entry panel | cream-200 bar |

The band's reasoning is about a narrow pane beside ink chrome, where it anchors the inspector to
the sidebar. On a full-width form it would be a slab of ink mid-page.

**A band divides co-visible regions**, and that is the property the decision rests on rather than
the pane's name. The blog inspector has two sections on screen at once, so it takes two bands. The
case-study inspector's section heads are alternatives, hidden by selection, so at most one is ever
visible and a band would divide nothing. `studio-ink` E5 pins that property directly, so if two
section editors ever become co-visible the gate fails and the question reopens,
`ralph/tests/studio-ink.mjs`, at `THE CASE-STUDY INSPECTOR HAS NOTHING TO DIVIDE`.

**Selection, by function.** This is the rule that was restated in #263 when the owner overruled the
earlier by-role wording. The role was never what decided the treatment. Shape and function were.

| The control | Treatment |
|---|---|
| a two-state **mode** switch | segmented accent fill |
| a switch between **content sets** | underline |
| a **vertical list rail** | fill plus a 3px accent left bar |

The two live examples that look identical and are deliberately not. The blog status filter swaps
which posts are shown, so each option owns its own set, so it takes the underline. The view
switcher beside it shows the same posts arranged differently, so it is a mode switch and takes the
fill. Both keep full tablist semantics either way, `components/studio/BlogStatusTabs.tsx`.

### The label scale

Two steps, named by role, `components/studio/blocks/fields.tsx`.

| Constant | Value | Role |
|---|---|---|
| `labelCls` | `text-[12px] font-bold uppercase tracking-eyebrow text-ink-600` | a field label |
| `groupLabelCls` | `text-[10px] uppercase tracking-eyebrow text-ink-600` | a group head inside a nested card |

The smaller step means **one level in**. All six sites carrying it sit inside the identical nested
card container, which is what makes it a hierarchy somebody built rather than drift.

**Both are ink-600 because ink-400 failed AA, and that is this scale's real reason for existing.**
12px is not WCAG large text, that threshold is 24px or 18.66px bold, so the 4.5 floor applies and
ink-400 reads 3.49, 3.33 and 3.02 on the three creams. The group step kept its 10px and its 400
weight, so fixing the contrast did not flatten the hierarchy.

Neither step reaches for `--text-eyebrow`. That token is read by sixteen non-studio files, so
sizing the studio through it would move the canvas and two public pages. The two values coincide
today, 0.75rem at a 16px root is exactly 12px, and they are kept independent anyway so the token
can move for the canvas without dragging the studio.

### Input geometry

`components/studio/blocks/fields.tsx`, at `inputCls`.

```
w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12
bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors
focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30
```

`inputErrorCls` carries the same geometry with `border-danger-600` and `ring-danger-600/20`. It is
not derived from `inputCls`, so it is the copy that silently keeps the old shape when the well
changes, and its only visible moment is a rejected value.

> **`inputCls` and `inputClsMd` are byte-identical today.** Compared programmatically, the two
> strings match exactly. The comment above them describes a deliberate 13px against 14px split and
> says do not merge them, and it names `text-[14px]` on both sides of its own contrast. Whatever
> the split was, the values have since converged and the comment now documents a distinction the
> code does not make.

`FIELD_MEASURE` is `max-w-[760px]`, one definition applied per site rather than through a shared
seam. Textareas are excluded because they hold paragraphs and use the room. Three plausible shared
seams were tried and each failed differently, which is why the constant is applied rather than
inherited, `components/studio/blocks/fields.tsx`, at `THE FIELD MEASURE`.

The note on declaring a ground has **inverted** since it was first written. It used to pin the
absence of a background, so that adding one became a deliberate act. #242 was that act. The list
column now declares cream-200 and the selected fill moved to cream-300 with it, which is strictly
stronger because the step is derivable from source rather than from whatever page happens to host
the component, `ralph/tests/studio-ink.mjs`, at `border-l-studio-accent`.

### The save bar

One shape across nine surfaces, `components/studio/SaveBar.tsx`, at its `@container grid` row. Ground is cream-200, chrome on
the ladder, with a `border-t border-ink-950/12` hairline.

Four derived states, `lib/studio/save-state.ts`, at `deriveSaveState`.

| State | Dot | Phrase |
|---|---|---|
| saved | `bg-ink-400` | `Saved`, or `Saved <age>` once one has landed this session |
| dirty | `bg-accent-500` | `Unsaved changes` |
| saving | `bg-accent-500 motion-safe:animate-pulse` | `Saving…` |
| error | `bg-danger-600` | `Couldn't save` |

The dot carries the state as colour and the phrase carries it as words, so neither is doing it
alone and the line survives colour blindness.

A fifth line exists and **is not a save state**. A validation message outranks all four because it
is a fact about the content rather than about the commit, and it is the thing blocking the save.

**One row or two is a container query on the bar's own box**, `@[520px]`, not a viewport
breakpoint, so a bar in a narrow pane folds while a wide one does not. Both class strings are
written out in full rather than composed, because the scanner reads source as plain text and a
runtime-assembled variant prefix would emit no CSS at all.

Placement is explicit rather than by source order, which is what lets one row and two rows be the
same three tracks and the same DOM.

The root element is a `footer` and that is load-bearing rather than semantic. `ListDetailLayout`
pins every bar with `lg:[&>section>footer]:mt-auto`, so a `div` would match nothing and five bars
would float mid-pane while every class-string gate still passed.

### Scrollbars

`app/globals.css`, at `.studio-chrome ::-webkit-scrollbar`. Scoped to `.studio-chrome`, 6px, transparent track, no buttons.

**The thumb is an alpha over its surface rather than a fixed colour, and that is a correction to
the contract.** A fixed cream-300 lands at 1.37, 1.30 and 1.19 on the three grounds, worst on the
list rails, which is the surface with the most scrolling. An alpha is the relation, so it lands on
one number everywhere.

| Thumb | Measured against its ground |
|---|---|
| ink-950 at 22 percent on cream-50 | 1.65 |
| ink-950 at 22 percent on cream-100 | 1.65 |
| ink-950 at 22 percent on cream-200 | 1.64 |
| white at 18 percent on ink-950 | 1.63 |
| white at 40 percent on ink-950, hover | 3.74 |

**The two sides do not share an alpha and that is the point rather than a compromise.** The
luminance curve is not symmetric, so equal alphas would not give equal separation. The separation
is what is held equal, not the number that produces it.

The standard properties are fenced behind `@supports not selector(::-webkit-scrollbar)`. Setting
`scrollbar-width` discards every webkit rule on the same element, so writing both would ship an
11px bar with no radius and no hover. The document scroller is deliberately untouched, because
styling it moves `scrollbar-gutter` from 15 to 6 and shifts every studio width threshold by 9px.
Firefox takes the fenced path and is recorded as **unverified**, not assumed.

### Motion tiers and the reduced-motion posture

`app/globals.css`, at `--studio-t0`. Named by tier because the order is the design.

| Token | Value | Tier |
|---|---|---|
| `--studio-t0` | 420ms | the reveal, canvas only, conditional scroll |
| `--studio-t1` | 220ms | the lead, the canvas accent bar drawing itself |
| `--studio-t2` | 340ms, delay 40ms | the structure, the dock |
| `--studio-t3` | 260ms, delay 90ms | the echo, the form field's mark |
| `--studio-t4` | 280ms, delays 150ms and 190ms | the details, the dock's tag then its field |
| `--studio-out` | 130ms | dismiss, everything at once, no stagger |
| `--studio-rise` | 20px | the panel distance |
| `--studio-detail` | 6px | the detail distance |
| `--studio-ease-settle` | `cubic-bezier(0.34, 1.35, 0.5, 1)` | the only thing that springs |

**Two easings are deliberately absent.** `--ease-glide` is not declared because it is byte-identical
to `--ease-out-expo`, and a second name for a value that already has an honest one is a second place
to drift. `--ease-spring` is not declared because `@theme` already holds that name with a different
value, so declaring it here would silently shadow the theme token for everything inside
`.studio-chrome`. Nothing consumes it today, which is precisely why the shadowing would have gone
unnoticed.

Hover has its own three durations, `app/globals.css`, at `--studio-lift-sheen`. Lead 200ms, follower 240ms, sheen
620ms. These are not the t-tiers renamed. Twenty milliseconds is below the threshold anyone could
tell apart, and sharing the names would make a later change to one silently move the other.

**Reduced motion**, `app/globals.css`, at its `prefers-reduced-motion` block. The global `*` reset zeroes `transition-duration` but
**not** `transition-delay`. With four delay tokens that leaves a 190ms dead pause followed by a
snap, which is jank rather than stillness and worse than the motion it replaces. So the studio
scopes both.

The distances zero too, and that half is not optional. Zeroing a duration makes a translate
instant, not absent, so the offset has to stop existing rather than stop animating. That is what
keeps the final state pixel-identical in both modes.

`--studio-t0` is zeroed here as well, because it is read by JavaScript through `getComputedStyle`.
A token read as a number is not a transition, so the global duration reset cannot reach it.

**This is scoped to `.studio-chrome` rather than widened into the global reset.** Adding
`transition-delay` there would change public reduced-motion behaviour from inside a studio change.
The public gap is real and is recorded as a hazard rather than fixed from here.

---

## C. The blog system

### Local custom properties, never global tokens

Two scoped blocks, and the discipline is the same one the studio radius scale follows.

`.blog-article, .blog-index`, `app/globals.css`, at `.blog-article`.

| Property | Value |
|---|---|
| `--blog-measure` | 68ch |
| `--blog-ease` | `cubic-bezier(0.22, 0.68, 0.24, 1)` |
| `--blog-ease-settle` | `cubic-bezier(0.16, 0.9, 0.28, 1)` |
| `--blog-rule` | ink-950 at 8 percent |

The **Pearl Smoke** palette, scoped to the two liquid components only, `app/globals.css`, at `--color-vessel-pearl`.

| Property | Value |
|---|---|
| `--smoke-1` | `oklch(0.84 0.014 58 / 0.74)` |
| `--smoke-2` | `oklch(0.9 0.018 52 / 0.74)` |
| `--smoke-3` | `oklch(0.97 0.01 70 / 0.74)` |
| `--smoke-4` | `oklch(0.87 0.015 48 / 0.74)` |
| `--bounce` | `oklch(1 0.008 80)` |

It lives on `.blog-vessel` and `.blog-capsule` so it never enters the global namespace.

### The measure, as a number

The column is `mx-auto max-w-[68ch] px-6` on the `<main>` element. Measured at 1440 by 900 on
`/blog/what-a-data-table-teaches-you-about-trust`.

| Reading | Value |
|---|---|
| computed `max-width` | **745.93px** |
| border box | 746px |
| inline padding | 24px each side |
| **content width** | **676.74px** — was 697.93px under DM Sans; #304 repointed `--font-body` to Work Sans and `ch` follows the font. The locked property is article-canvas EQUALITY, delta 0, and both sides moved together |
| prose font size and line height | 18px, 31.5px |

**The `ch` unit resolves against the element that carries it, not against the text inside it.**
`max-w-[68ch]` sits on `<main>`, whose font size is the 16px root, giving 745.93px. The same 68ch
resolved in the prose's own 18px font would be 841.44px. That 96px gap is the whole reason the
number is worth writing down rather than restating the token.

A consequence falls out. The unlayered `p { max-width: 68ch }` rule resolves to 841.44px inside
`.blog-prose`, which is wider than the 676.74px column, so it never binds there. It is inert on the
blog and live elsewhere.

The canvas side is bounded separately by `BLOG_CANVAS_MIN_PX = 794`, `lib/studio/three-pane.ts`.
That is the pane floor the layout protects, not the measure itself.

### The prefix rule

Every blog selector in `globals.css` is `blog-` prefixed and matches only elements the blog routes
render, `app/globals.css`, at `.blog-vessel`. The vessel's liquid glass, the capsule, the prose column and the
plate are what Tailwind cannot express. The masthead, the cards and the grid are bare utilities in
the components. **This rule has no gate**, see F.

### Images, and the branch that is forced rather than chosen

The rule is not that the blog never uses `next/image`. It is narrower and it is worth stating
precisely, because the exception is the largest image on the page.

| Surface | Element | Why |
|---|---|---|
| article hero | `next/image` | it is the LCP, so `priority` plus the srcset is the point |
| canvas hero | plain `<img>` | the src may be an owner-gated proxy URL or a `blob:` |
| body figures, both surfaces | plain `<img>` | the same proxy constraint |

The optimizer refetches its source server-side **without** the session cookie, so `/_next/image`
cannot read an owner-gated proxy URL and a `blob:` object URL cannot go through it at all.
`next/image` would also wrap the element in some configurations, which is the editable-only-wrapper
failure the parity contract forbids. Sources are `components/blog/BlogHero.tsx` and
`components/blog/BlogProse.tsx`, at `The inline figure`.

Body figures carry no explicit width or height because the schema holds no intrinsic dimensions, so
aspect is left to CSS and `loading="lazy"` keeps them off the critical path. `alt=""` on a
decorative image is correct HTML. Omitting the attribute makes a screen reader announce the
filename instead.

---

## D. The public portfolio

### Container and section geometry

| Rule | Desktop | Below 1024px | Source |
|---|---|---|---|
| `.container-x` | `max-width: 80rem`, `padding-inline: 1.5rem`, centred | `padding-inline: 1rem` | globals.css:308, 567 |
| `.section-card` | `padding-inline: 3.25rem`, `margin-inline: clamp(0.75rem, 2vw, 2rem)` | `padding-inline: 2rem` | globals.css:325, 571 |

`.section-card` is cream-50 at `--radius-xl`, and its edge is a `box-shadow` ring of ink-950 at 7
percent rather than a border, so it costs no layout box.

**The breakpoint is 1024px and the whole site goes mobile at once.** The stylesheet switches at
max-width 1023 and min-width 1024. There is no `md` two-column step anywhere.

### The work card hover

Six things change, and the last two are the ones a partial mirror misses because neither is what
you are looking at.

| Target | Change | Source |
|---|---|---|
| `.work-card` | `--gl: 1`, the platform glow | globals.css:1270 |
| `.wc-shot` | `border-color: transparent` | globals.css:1299 |
| `.wc-shot > img, > svg` | `transform: scale(1.045)` | globals.css:1317 |
| `.wc-veil` | `opacity: 1` | globals.css:1340 |
| `.vt, .vs` | `transform: translateY(0)` | globals.css:1362 |
| `.wc-rail .cat::before` | `opacity: 1`, `transform: scale(1.4)` | globals.css:1411 |

`--gl` is behind `@media (hover: hover)` publicly. `:focus-visible` drives the veil, the copy and
the dot but not the image scale or the border.

Under reduced motion the image zoom is removed and the veil copy is left untranslated, so nothing
is trapped in a half state and the story stays reachable.

**The studio Details canvas re-asserts every one of these against `[data-card-state="hover"]`**,
`app/globals.css`, at `.palette-dot.is-on`, because `:hover` cannot be set from script and the summary is invisible at
rest. If a hover property is added publicly and not there, the canvas silently stops matching what
it claims to preview. `studio-ink` asserts the two property sets agree rather than trusting the
comment. The attribute sits on a wrapper so the card's own markup is identical in both copies.

### Hero type

⚠ THIS PARAGRAPH WAS WRONG FOUR WAYS AND ONE OF THEM INVENTED A DEFECT. It read *"Fraunces through
`font-display`, `not-italic`, capped at `max-w-[34ch]`"*, and closed *"its colour, leading and
tracking are written in the bracket-bare form and **do not render**"*. Measured against `.hero-line`
in `app/globals.css`:

- the face is `--font-hero-display`, **not** `--font-display` — Fraunces is hero-scoped, the same
  distinction the Type section above had to be corrected for
- the cap is **`max-width: 17ch`**, not 34ch. `max-w-[34ch]` belongs to `ContactSection` and
  `ClosingLine`, which are different components
- `.hero-line em` **is** italic, deliberately — it is the accent word the contract marks
- and the colour, leading and tracking are set **in CSS and they render**. The element's entire
  markup is `className="hero-line"`; there are no bracket-bare classes on it to fail

⚠ THE LAST ONE IS THE COSTLY KIND. A document asserting a rendering defect that does not exist sends
the next reader hunting for broken classes, and it reads as diligence the whole time — the same
shape as a "cannot reach" list naming a hazard with an empty population.

The hero thesis line is `.hero-line` in `app/globals.css`: `--font-hero-display` at weight 300,
`clamp(23px, 2.7vw, 38px)`, leading 1.14, tracking -0.026em, capped at 17ch, with the accent word
italicised by `.hero-line em`.

---

## E. Cascade hazards

Five mechanisms by which the code says one thing and the screen says another. Each changes how the
tokens above can be used, which is why they sit in a design system reference rather than in a bug
list.

### E1. Unlayered element rules beat every utility

Tailwind emits utilities inside `@layer utilities`. `globals.css` also carries plain element rules
at the top level, outside any layer. **In the cascade an unlayered rule beats a layered one
regardless of specificity**, because layer order is consulted before specificity ever is. The
utility produces nothing, sits in the markup, survives review and survives grep.

The full set, derived by parsing the file rather than by reading it.

| Selector | Properties it sets | Source |
|---|---|---|
| `html` | `background-color`, `color`, `font-family`, `font-size`, font smoothing, `text-rendering`, `scrollbar-gutter` | globals.css:233 |
| `body` | `min-height`, `overflow-x` | globals.css:262 |
| `h1, h2` | `font-family`, `font-variation-settings`, `font-weight`, `line-height`, `letter-spacing` | globals.css:267 |
| `h3, h4, h5, h6` | `font-family`, `font-weight`, `line-height` | globals.css:276 |
| `p` | `line-height`, `max-width` | globals.css:285 |
| `img, video` | `max-width`, `height`, `display` | globals.css:290 |
| `a` | `color`, `text-decoration-thickness`, `text-underline-offset` | globals.css:297 |

Four instances have shipped. `a { color: inherit }` beat `text-*` on anchors. `img { height: auto }`
beat `h-*` on the canvas hero. `h3` to `h6` `font-family` beat `.font-display`. `h1, h2` beat
`font-bold` plus `tracking-*` on the ink bands, where three of five utilities were silently dead.

**Every one was found by someone measuring the thing they already suspected.** Not one was found by
review, and #205's own gate asserted the band header's class string while the heading inside it drew
Fraunces 400. A gate reading a class cannot see a class that does nothing.

The repair is a class declared **outside** any layer. `.studio-chrome .sechead`,
`app/globals.css` at `.blog-prose h2`, sets family, weight, size, tracking, leading and case together, at specificity
0,2,0 against the reset's 0,0,2. A class rather than re-asserted utilities because four properties
must land together and one is an arbitrary tracking.

**Agreement is not a collision.** Eleven studio utilities currently carry the same value their reset
already sets, so nothing renders wrong and the utility still does not drive the result. Editing one
will silently do nothing. The current inventory, reported by `studio-cascade` and not failed.

| Site | Utility |
|---|---|
| AreaHeader.tsx:10 | `font-display`, `font-normal`, `leading-tight` on `<h1>` |
| StudioModal.tsx:118 | `font-display` on `<h2>` |
| BlogBlocksEditPanel.tsx:917 | `leading-relaxed` on `<p>` |
| BlogEditPanel.tsx:252, 283, 288 | `leading-relaxed` on `<p>` |
| BlogIndex.tsx:349, 393 | `leading-relaxed` on `<p>` |
| blocks/blog-registry.tsx:129 | `leading-relaxed` on `<p>` |

> **One blind spot, found while deriving that table, and since FIXED.** `studio-cascade` split the
> flattened stylesheet on `}` without stripping comments first, so a rule preceded by a comment lost
> its tag and never entered the rule map. `html` was the one rule that fell through.
>
> **The "no live consequence" this paragraph originally claimed did not survive the week.** The
> typography arc put a comment immediately above the `h1, h2` reset, and that rule fell through too
> — the one rule the suite exists for, the one #205's ink bands lost to. `A0` reported `undefined`
> and the inert inventory dropped from 11 to 7 while `C1` kept passing, because it had nothing left
> to check. Repaired in #302, pinned with two assertions and mutation-tested. `html` is guarded for
> the first time. **A blind spot with no consequence today is a blind spot waiting for the comment
> that gives it one.**

### E2. Two utilities racing on sheet order

`border-transparent` writes `border-color`, all four sides. `border-l-accent-500` writes
`border-left-color`, one side. Put both on one element and the left edge is written twice at **equal
specificity**, since each is a single class. CSS then resolves the tie by source order in the
generated stylesheet, and that order is Tailwind's to decide.

**It renders correctly right now, which is the worst case.** Nothing catches it, and it can flip on
an upgrade that reorders utilities.

The rule is disjoint edges. Write the three non-bar sides explicitly, `border-y-transparent
border-r-transparent`, so no two utilities ever touch the same edge. `studio-cascade` is blind to
this, because both classes are layered and no element rule is involved.

**A second form of the same family, and this one is live at scale.** The bracket-bare spelling
`utility-[--token]` compiles to a declaration whose value is a bare custom property name, which is
invalid, so the browser drops it.

Measured in the shipped bundle, `.text-\[--color-text-muted\]{color:--color-text-muted}`.

There are **51 such sites across 11 files** under `components`, none of them in the studio.

| Property family | Sites |
|---|---|
| `text-*` | 37 |
| `leading-*` | 6 |
| `duration-*` | 4 |
| `tracking-*` | 2 |
| `font-*` | 1 |
| `border-*` | 1 |

The heaviest files are `ContactSection.tsx` at 8, `ProcessSection.tsx`, `HeroSection.tsx` and
`ExperienceSection.tsx` at 7 each, `ExperienceEntry.tsx` and `SiteFooter.tsx` at 6 each. The
correct spelling is `text-[var(--color-text-muted)]`, verified emitting a working rule. `CLAUDE.md`
already records `components/sections` as carrying the broken form. **There is no gate**, see F.

### E3. A token that does not exist emits nothing

A bare theme utility is generated only when its token exists. `text-ink-500` looks exactly like
`text-ink-600`, survives review, survives grep and type-checks, and emits **no CSS at all**. The
element renders whatever it inherits.

Fifty-one sites carried `text-ink-500` and `text-ink-700` before this was gated, across twenty
files, every one rendering ink-950 while its code claimed otherwise.

The same mechanism has a second form that is worse, because it emits the **wrong** thing rather
than nothing. Where Tailwind ships a default for a step the project declined, the utility compiles
against that default. `rounded-2xl` is the live case, see A.

Note the asymmetry. `ink-*` is entirely custom, so an invented step emits nothing. `radius-*` has
Tailwind defaults underneath, so an undeclared step emits a value nobody chose.

### E4. A string constant across the server and client boundary

Importing a plain `export const` from a `"use client"` module into a **server** component compiles
cleanly. Next yields a **throwing proxy**, a template literal stringifies it, and the rendered
attribute ends up containing a JavaScript error message.

```
class="w-6 shrink-0 tabular-nums function() { throw new Error("Attempted to call labelCls()…"
```

`tsc` passed, lint passed, ralph passed, and the page looked plausible. Only rendering it showed
anything.

There is no static check for this and none is proposed. The fix is to write the value out in the
server component and **assert the pair**, plus an assertion that the import has not come back.
`OverviewRow.tsx` is the one site, and `studio-labels` E3 holds both halves,
`ralph/tests/studio-labels.mjs`, at `OverviewRow`.

### E5. Prose ships CSS

Tailwind's scanner reads source as **plain text** and has no concept of a comment. Naming a utility
in prose emits it exactly as writing it in a `className` does. `.css` files are scanned too, so a
CSS comment does it as readily as a TSX one.

This fired more than ten times. An audit found 12 already in the repo at 439 raw bytes, including a
real `filter: invert()` rule that came from the word "invert" in an animation comment. One deletion
left the bundle hash unmoved because the comment explaining the deletion spelled the class out.

The price is paid in prose. Some utilities are ordinary English words, so those words cannot be
written bare in a scanned file. Substitutes exist for each, and the rule is uniform. Describe the
value, never spell the class.

**This document is exempt, and that is checked rather than assumed.** `app/globals.css`'s own file header carries
`@source not "../docs"`, and `css-comment-trap` skips `docs` in its own file walk,
`ralph/tests/css-comment-trap.mjs`, at `EXTS`. Both exclusions are why a design system reference can name
utilities at all. The proof that it changed nothing is in the PR body.

---

## F. Enforced against documented

A rule with a gate holds. A rule without one is a sentence somebody has to remember.

### Enforced

| Rule | Gate |
|---|---|
| No studio utility loses to an unlayered element rule, and the inert inventory stays at exactly 11 | `studio-cascade` |
| Every studio colour utility resolves to a declared `@theme` token | `studio-tokens` |
| No `border-color` shorthand shares an edge with a per-side longhand | `studio-border-race` |
| Every on-ink foreground ratio, computed in CI without a browser | `studio-ink-contrast` |
| `ink-400` fails the text floor on every cream step, and every `text-ink-400` **text** site is registered with a guard that proves its ground | `studio-ink-contrast` H4 and H6 |
| The accent ladder on cream is computed, not assumed | `studio-ink-contrast` H7 |
| Two label steps, with the group rule derived from the nested-card container signature | `studio-labels` |
| The radius ramp is strictly increasing, and every radius utility resolves to a declared step | `radius-scale` |
| No utility reaches the stylesheet because a comment names it | `css-comment-trap` |
| The motion tiers exist, are ordered, and declare no shadowing or duplicate easing | `studio-motion` |
| The canvas and the public page stay geometrically identical | `parity`, dev-only |

### Documented, with no gate

These are the ones to be careful with, because nothing will tell you.

| Rule | Status |
|---|---|
| The bracket-bare `utility-[--token]` form is dead | **51 live sites across 11 files**, all public. Recorded in `CLAUDE.md`, gated nowhere |
| Every blog selector is `blog-` prefixed | Stated in `app/globals.css` at `.blog-vessel`, proven once in its PR, not re-checked |
| The public reduced-motion reset zeroes duration but not delay | Recorded as a hazard. The studio scopes its own fix, the public gap stands |
| Firefox scrollbar rendering | Explicitly **unverified**. Only Chromium was available |
| `--duration-*` and `--z-*` generate no utilities | True and verified here, gated only for the studio's half by `studio-motion` |
| A string constant across the server and client boundary | No static check, and none proposed |

### Two entries that have moved since they were last written down

- **accent-600 on cream is no longer uncomputed.** `studio-ink-contrast` H7 computes the whole
  ladder, 7.22, 6.87, 6.25 and 5.27, and asserts it clears the floor on every step. Independently
  reproduced here by rasterising.
- **`ink-400` as text is no longer merely asserted.** H6 is a usage scan with a per-entry `guard`
  regex, so the claimed ground is a fact about the code rather than a note beside it. The registry
  holds three sites, one large-text and two `lg:`-scoped to ink.

### Inert against live

Marked distinctly throughout, because the two need different care.

- **Inert** means the declaration is present and does not drive the result. The eleven utilities in
  E1 and the `p { max-width: 68ch }` rule on the blog are inert. Nothing renders wrong. Editing one
  does nothing.
- **Live** means it drives the result. `rounded-2xl` is live and renders a value nobody chose.
- **Dead** means it emits nothing or is dropped. `text-ink-500` emits nothing. The 51 bracket-bare
  sites emit an invalid declaration the browser discards.
